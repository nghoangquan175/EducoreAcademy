const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, facebookLogin, sendOtp, verifyOtp } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Local auth
router.post('/register', registerUser);
router.post('/login', loginUser);

// Email verification OTP
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Social auth
router.post('/auth/google', googleLogin);
router.post('/auth/facebook', facebookLogin);

// Protected
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
