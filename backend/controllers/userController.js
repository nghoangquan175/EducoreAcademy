const dns = require('dns').promises;
const { User, Enrollment } = require('../models');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { verifyGoogleToken, verifyFacebookToken } = require('../config/socialAuth');
const { sendOtpEmail } = require('../config/emailService');

// ─── OTP In-memory Store ──────────────────────────────────────────────────────
// Map<email, { otp, name, password, expiresAt }>
const otpStore = new Map();
const OTP_TTL_MS = 10 * 60 * 1000; // 10 phút

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const buildUserResponse = async (user) => {
  // Check if student has any enrollments
  const enrollmentCount = await Enrollment.count({ where: { userId: user.id } });
  
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    provider: user.provider,
    hasEnrolledCourses: enrollmentCount > 0,
    token: generateToken(user.id)
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
    console.error('Facebook login error:', error);
    res.status(401).json({ message: 'Xác thực Facebook thất bại', error: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin, facebookLogin, sendOtp, verifyOtp };
