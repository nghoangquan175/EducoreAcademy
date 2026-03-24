const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Public: anyone can send a message (guest or logged in)
router.post('/send', async (req, res, next) => {
  // Optionally attach user if token is provided
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const { User } = require('../models');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findByPk(decoded.id);
    } catch (err) {
      // Token invalid, continue as guest
      req.user = null;
    }
  }
  chatController.sendMessage(req, res);
});

// Protected routes: require login
router.get('/latest', protect, chatController.getLatestConversation);
router.get('/conversations', protect, chatController.getConversations);
router.get('/conversations/:id', protect, chatController.getMessages);
router.delete('/conversations/:id', protect, chatController.deleteConversation);

module.exports = router;
