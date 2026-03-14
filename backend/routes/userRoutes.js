const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, facebookLogin, sendOtp, verifyOtp } = require('../controllers/userController');
const { 
  getStudentStats, 
  getEnrolledCourses, 
  getQuizAttempts,
  getStudyGoals,
  getStudyGoalsSummary,
  addStudyGoal,
  updateStudyGoal,
  deleteStudyGoal 
} = require('../controllers/studentController');
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

// Student Dashboard
router.get('/student/stats', protect, getStudentStats);
router.get('/student/enrolled-courses', protect, getEnrolledCourses);
router.get('/student/quiz-attempts', protect, getQuizAttempts);

// Study Goals
router.get('/student/study-goals', protect, getStudyGoals);
router.get('/student/study-goals/summary', protect, getStudyGoalsSummary);
router.post('/student/study-goals', protect, addStudyGoal);
router.put('/student/study-goals/:id', protect, updateStudyGoal);
router.delete('/student/study-goals/:id', protect, deleteStudyGoal);

module.exports = router;
