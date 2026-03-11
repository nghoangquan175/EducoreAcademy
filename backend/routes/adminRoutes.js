const express = require('express');
const router = express.Router();
const { User, Course, Enrollment, Article } = require('../models');
const { protect, admin } = require('../middleware/authMiddleware');
const { sequelize } = require('../config/db');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const studentCount = await User.count({ where: { role: 'student' } });
    const instructorCount = await User.count({ where: { role: 'instructor' } });
    const courseCount = await Course.count();
    const pendingCourses = await Course.count({ where: { published: 1 } });
    const enrollmentCount = await Enrollment.count();
    
    // Revenue (simplistic: sum of prices of enrolled courses, this might need a Payment model later)
    // For now, let's just return some mock or basic data
    const totalRevenue = await Enrollment.findAll({
        include: [{ model: Course, attributes: ['price'] }]
    }).then(enrollments => enrollments.reduce((acc, curr) => acc + (curr.Course?.price || 0), 0));

    res.json({
      students: studentCount,
      instructors: instructorCount,
      courses: courseCount,
      pendingCourses,
      enrollments: enrollmentCount,
      revenue: totalRevenue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get pending courses for approval
// @route   GET /api/admin/courses/pending
// @access  Private/Admin
router.get('/courses/pending', protect, admin, async (req, res) => {
  try {
    const pendingCourses = await Course.findAll({
      where: { published: 1 },
      include: [{ model: User, as: 'instructor', attributes: ['id', 'name', 'email'] }],
      order: [['updatedAt', 'ASC']]
    });
    res.json(pendingCourses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all courses for management
// @route   GET /api/admin/courses
// @access  Private/Admin
router.get('/courses', protect, admin, async (req, res) => {
  try {
    const courses = await Course.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM [Enrollments]
              WHERE [Enrollments].[courseId] = [Course].[id]
            )`),
            'studentsCount'
          ]
        ]
      },
      include: [{ model: User, as: 'instructor', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Approve or Reject a course
// @route   PATCH /api/admin/courses/:id/status
// @access  Private/Admin
router.patch('/courses/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, message } = req.body; // status: 2 (Approve), 3 (Reject)
    
    if (![2, 3].includes(Number(status))) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    course.published = status;
    await course.save();

    res.json({ 
        message: status === 2 ? 'Khoá học đã được phê duyệt' : 'Khoá học đã bị từ chối',
        course 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all users for management
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', protect, admin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
