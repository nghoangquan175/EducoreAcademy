const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check for account locking
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(403).json({ 
          message: 'Tài khoản hiện đang bị khóa.',
          code: 'ACCOUNT_LOCKED'
        });
      }

      // Check token version ONLY for students
      if (user.role === 'student' && user.tokenVersion !== decoded.version) {
        return res.status(401).json({ 
          message: 'Phiên đăng nhập đã hết hạn hoặc được đăng nhập ở thiết bị khác.',
          code: 'SESSION_EXPIRED'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const instructor = (req, res, next) => {
  if (req.user && (req.user.role === 'instructor' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an instructor' });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      // For optionalProtect, we only attach user if everything is valid (including version for students)
      if (user) {
        const isLocked = user.lockedUntil && user.lockedUntil > new Date();
        const isStudentVersionMismatch = user.role === 'student' && user.tokenVersion !== decoded.version;

        if (!isLocked && !isStudentVersionMismatch) {
          req.user = user;
        }
      }
    } catch (error) {
      // Just continue without user if token is invalid
      console.warn('Optional token failed');
    }
  }
  next();
};

module.exports = { protect, admin, instructor, optionalProtect };
