const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken, verifyFacebookToken } = require('../config/socialAuth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const buildUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  provider: user.provider,
  token: generateToken(user.id)
});

// ─── Local Auth ───────────────────────────────────────────────────────────────

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'Email này đã được sử dụng' });
    }

    const user = await User.create({ name, email, password, role, provider: 'local' });
    res.status(201).json(buildUserResponse(user));
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
      res.json(buildUserResponse(user));
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
      // Check if an account with same email exists (link it)
      user = await User.findOne({ where: { email } });
      if (user) {
        // Link Google to existing account
        user.googleId = googleId;
        user.avatar = user.avatar || avatar;
        await user.save();
      } else {
        // Create new user (no password for social login)
        user = await User.create({
          name,
          email,
          googleId,
          avatar,
          provider: 'google',
        });
      }
    }

    res.json(buildUserResponse(user));
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

    res.json(buildUserResponse(user));
  } catch (error) {
    console.error('Facebook login error:', error);
    res.status(401).json({ message: 'Xác thực Facebook thất bại', error: error.message });
  }
};

module.exports = { registerUser, loginUser, googleLogin, facebookLogin };
