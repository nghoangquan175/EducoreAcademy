const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenueController');
const { protect, admin } = require('../middleware/authMiddleware');

// === ADMIN ROUTES ===
router.get('/admin/overview', protect, admin, revenueController.getAdminOverview);
router.get('/admin/courses', protect, admin, revenueController.getAdminCourses);
router.get('/admin/instructors', protect, admin, revenueController.getAdminInstructors);
router.get('/admin/transactions', protect, admin, revenueController.getAdminTransactions);

// === INSTRUCTOR ROUTES ===
router.get('/instructor/overview', protect, revenueController.getInstructorOverview);
router.get('/instructor/courses', protect, revenueController.getInstructorCourses);
router.get('/instructor/transactions', protect, revenueController.getInstructorTransactions);

module.exports = router;
