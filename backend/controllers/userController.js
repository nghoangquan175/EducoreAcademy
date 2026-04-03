const dns = require('dns').promises;
const { User, Enrollment } = require('../models');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { verifyGoogleToken, verifyFacebookToken } = require('../config/socialAuth');
const { sendOtpEmail, sendPasswordResetEmail } = require('../config/emailService');
const crypto = require('crypto');

// ─── OTP In-memory Store ──────────────────────────────────────────────────────
// Map<email, { otp, name, password, expiresAt }>
const otpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 phút

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (id, version) => {
  return jwt.sign({ id, version }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const buildUserResponse = async (user) => {
  // Logic apply ONLY for students
  if (user.role === 'student') {
    const now = new Date();

    // 1. Check if account is currently locked
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingMinutes = Math.ceil((user.lockedUntil - now) / (60 * 1000));
      const message = user.loginViolationCount >= 2
        ? 'Tài khoản bị khóa vĩnh viễn do vi phạm đăng nhập bất thường nhiều lần. Vui lòng liên hệ Admin.'
        : `Tài khoản đang bị tạm khóa do hoạt động bất thường. Vui lòng thử lại sau ${remainingMinutes} phút.`;
      
      const error = new Error(message);
      error.statusCode = 403;
      error.code = 'ACCOUNT_LOCKED';
      throw error;
    }

    // 2. Check for rapid login (anomaly detection)
    const RAPID_WINDOW = 2 * 60 * 1000; // 2 minutes
    const MAX_RAPID_ATTEMPTS = 3;
    const LOCK_DURATION = 15 * 60 * 1000; // 15 minutes

    if (user.lastLoginAt && (now - user.lastLoginAt) < RAPID_WINDOW) {
      user.rapidLoginCount += 1;

      if (user.rapidLoginCount >= MAX_RAPID_ATTEMPTS) {
        // Punish based on violation count
        if (user.loginViolationCount >= 1) {
          // Second offense: Permanent lock
          user.loginViolationCount = 2;
          user.lockedUntil = new Date('9999-12-31T23:59:59Z'); // effectively permanent
          user.tokenVersion += 1; // invalidate current session too
          await user.save();
          
          const error = new Error('Tài khoản đã bị khóa vĩnh viễn do tái phạm đăng nhập bất thường.');
          error.statusCode = 403;
          error.code = 'ACCOUNT_LOCKED';
          throw error;
        } else {
          // First offense: 15-minute lock
          user.loginViolationCount = 1;
          user.lockedUntil = new Date(now.getTime() + LOCK_DURATION);
          user.rapidLoginCount = 0;
          user.tokenVersion += 1; // invalidate current session
          await user.save();

          const error = new Error('Phát hiện đăng nhập bất thường liên tiếp. Tài khoản bị tạm khóa 15 phút.');
          error.statusCode = 403;
          error.code = 'ACCOUNT_LOCKED';
          throw error;
        }
      }
    } else {
      // Not a rapid login, reset the counter
      user.rapidLoginCount = 0;
    }

    // 3. Successful login logic for students
    user.tokenVersion += 1;
    user.lastLoginAt = now;
    await user.save();
  }

  // Common response building logic
  const enrollmentCount = await Enrollment.count({ where: { userId: user.id } });
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    provider: user.provider,
    hasEnrolledCourses: enrollmentCount > 0,
    token: generateToken(user.id, user.tokenVersion)
  };
};

// Kiểm tra domain email có MX record không
const checkEmailDomain = async (email) => {
  const domain = email.split('@')[1];
  if (!domain) return false;
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
};

// ─── OTP: Gửi mã xác minh ────────────────────────────────────────────────────

const sendOtp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input cơ bản
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
    
    // Kiểm tra mật khẩu mạnh (Backend)
    if (!validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      return res.status(400).json({ 
        message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' 
      });
    }

    // Validate định dạng email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Địa chỉ email không hợp lệ' });
    }

    // Kiểm tra domain qua DNS MX
    const hasMx = await checkEmailDomain(email);
    if (!hasMx) {
      return res.status(400).json({ message: 'Email không hợp lệ hoặc domain không tồn tại' });
    }

    // Kiểm tra email đã dùng chưa
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    // Sinh OTP và lưu vào store
    const otp = generateOtp();
    otpStore.set(email, {
      otp,
      name,
      password,
      expiresAt: Date.now() + OTP_TTL_MS,
    });

    // Tự xóa OTP sau khi hết hạn
    setTimeout(() => otpStore.delete(email), OTP_TTL_MS);

    // Gửi email
    await sendOtpEmail(email, otp);

    res.json({ message: 'Mã xác minh đã được gửi tới email của bạn' });
  } catch (error) {
    console.error('sendOtp error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ─── OTP: Xác minh mã và tạo tài khoản ──────────────────────────────────────

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Thiếu email hoặc mã xác minh' });
    }

    const record = otpStore.get(email);

    if (!record) {
      return res.status(400).json({ message: 'Mã xác minh không tồn tại hoặc đã hết hạn' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Mã xác minh đã hết hạn, vui lòng yêu cầu mã mới' });
    }

    if (record.otp !== String(otp).trim()) {
      return res.status(400).json({ message: 'Mã xác minh không đúng' });
    }

    // OTP hợp lệ → tạo tài khoản
    const { name, password } = record;
    otpStore.delete(email);

    // Kiểm tra lần cuối (tránh race condition)
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    await User.create({ name, email, password, provider: 'local' });

    res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ─── Local Auth ───────────────────────────────────────────────────────────────

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    const user = await User.create({ name, email, password, role, provider: 'local' });
    res.status(201).json(await buildUserResponse(user));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || user.provider !== 'local') {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    if (await user.matchPassword(password)) {
      res.json(await buildUserResponse(user));
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

// ─── Google Auth ──────────────────────────────────────────────────────────────

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Thiếu Google credential' });

    const payload = await verifyGoogleToken(credential);
    const { sub: googleId, name, email, picture: avatar } = payload;

    let user = await User.findOne({ where: { googleId } });

    if (!user) {
      user = await User.findOne({ where: { email } });
      if (user) {
        user.googleId = googleId;
        user.avatar = user.avatar || avatar;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          googleId,
          avatar,
          provider: 'google',
        });
      }
    }

    res.json(await buildUserResponse(user));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Xác thực Google thất bại', error: error.message });
  }
};

// ─── Facebook Auth ────────────────────────────────────────────────────────────

const facebookLogin = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Thiếu Facebook access token' });

    const fbProfile = await verifyFacebookToken(accessToken);
    const { id: facebookId, name, email, picture } = fbProfile;
    const avatar = picture?.data?.url || null;

    let user = await User.findOne({ where: { facebookId } });

    if (!user) {
      if (email) {
        user = await User.findOne({ where: { email } });
        if (user) {
          user.facebookId = facebookId;
          user.avatar = user.avatar || avatar;
          await user.save();
        }
      }

      if (!user) {
        user = await User.create({
          name,
          email: email || `${facebookId}@facebook.com`,
          facebookId,
          avatar,
          provider: 'facebook',
        });
      }
    }

    res.json(await buildUserResponse(user));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message, code: error.code });
    }
    console.error('Facebook login error:', error);
    res.status(401).json({ message: 'Xác thực Facebook thất bại', error: error.message });
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu' });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({ 
        message: `Tài khoản này được đăng ký qua ${user.provider}. Vui lòng đăng nhập qua ${user.provider}.` 
      });
    }

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Set token and expiry (1 hour)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 3600000;
    await user.save();

    // Send email
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);

    res.json({ message: 'Link đặt lại mật khẩu đã được gửi tới email của bạn' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt lại mật khẩu' });
    }

    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ 
      where: { 
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    }

    // Validate password strength
    if (!validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    })) {
      return res.status(400).json({ 
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt' 
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    user.tokenVersion += 1; // Invalidate current sessions
    await user.save();

    res.json({ message: 'Mật khẩu đã được cập nhật thành công' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin, facebookLogin, sendOtp, verifyOtp, forgotPassword, resetPassword };
