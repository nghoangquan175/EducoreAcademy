const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, facebookLogin } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Local auth
router.post('/register', registerUser);
router.post('/login', loginUser);

// Social auth
router.post('/auth/google', googleLogin);
router.post('/auth/facebook', facebookLogin);

// Protected
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
