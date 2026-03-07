const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

// Example protected route
router.get('/profile', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
