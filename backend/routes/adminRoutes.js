const express = require('express');
const router = express.Router();
const { User, Course, Enrollment, Article, PaymentOrder, Payment, Notification, Chapter, Lesson, Quiz } = require('../models');
const { protect, admin } = require('../middleware/authMiddleware');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { CourseEditRequest } = require('../models');
const { cloneCourse } = require('../utils/courseCloner');
const { notifyUser } = require('../utils/notificationUtils');
const { 
  adminGetPendingArticles, 
  adminUpdateArticleStatus,
  adminGetAllArticles
} = require('../controllers/articleController');

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
    const publishedArticles = await Article.count({ where: { articleStatus: 2 } });
    const pendingArticles = await Article.count({ where: { articleStatus: 1 } });
    
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
      revenue: totalRevenue,
      publishedArticles,
      pendingArticles
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
    const search = req.query.search || '';
    const pendingCourses = await Course.findAll({
      where: { 
        published: 1,
        title: { [Op.like]: `%${search}%` }
      },
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
    const search = req.query.search || '';
    const courses = await Course.findAll({
      where: {
        title: { [Op.like]: `%${search}%` }
      },
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
    const { status } = req.body; // status: 2 (Approve), 3 (Reject)
    
    if (![2, 3].includes(Number(status))) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    if (Number(status) === 2) {
      course.published = 2;
      course.isVerified = true;
    } else if (Number(status) === 3) {
      // Nếu đã verified rồi thì gỡ xuống (4), ngược lại là từ chối (3)
      course.published = course.isVerified ? 4 : 3;
    }
    
    // If approving a new version, update isLatest
    if (status === 2 && course.rootCourseId) {
      // Set all other versions of the same root to isLatest = false
      await Course.update(
        { isLatest: false },
        { 
          where: { 
            [Op.or]: [
              { id: course.rootCourseId },
              { rootCourseId: course.rootCourseId }
            ],
            id: { [Op.ne]: course.id }
          } 
        }
      );
      course.isLatest = true;
    }
    
    await course.save();

    // Create notification for instructor
    try {
      let notifTitle = '';
      let notifMessage = '';
      
      if (Number(status) === 2) {
        notifTitle = 'Khóa học của bạn đã được phê duyệt';
        notifMessage = `Chúc mừng! Khóa học "${course.title}" đã được phê duyệt và xuất bản.`;
      } else {
        if (course.published === 4) {
          notifTitle = 'Khóa học của bạn đã bị tạm gỡ';
          notifMessage = `Quản trị viên đã tạm gỡ khóa học "${course.title}" xuống.`;
        } else {
          notifTitle = 'Khóa học của bạn đã bị từ chối';
          notifMessage = `Rất tiếc, yêu cầu phê duyệt cho khóa học "${course.title}" đã bị từ chối.`;
        }
      }
      
      await Notification.create({
        userId: course.instructorId,
        title: notifTitle,
        message: notifMessage,
        relatedId: course.id.toString(),
        type: 'course_status'
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the whole request if notification fails
    }

    res.json({ 
        message: status === 2 ? 'Khoá học đã được phê duyệt' : 
                (course.published === 4 ? 'Khoá học đã bị tạm gỡ' : 'Khoá học đã bị từ chối'),
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

// @desc    Get user details (for student/instructor management)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
router.get('/users/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Enrollment,
          include: [{ model: Course, attributes: ['id', 'title', 'price', 'thumbnail'] }]
        },
        {
          model: Course,
          as: 'instructedCourses',
          attributes: ['id', 'title', 'price', 'thumbnail', 'published']
        },
        {
          model: Article,
          as: 'articles',
          attributes: ['id', 'title', 'thumbnail', 'articleStatus', 'createdAt']
        },
        {
          model: PaymentOrder,
          include: [
            { model: Course, attributes: ['id', 'title', 'price'] }, 
            { model: Payment }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all articles for management
// @route   GET /api/admin/articles/all
// @access  Private/Admin
router.get('/articles/all', protect, admin, adminGetAllArticles);

// @desc    Get pending articles for review
// @route   GET /api/admin/articles/pending
// @access  Private/Admin
router.get('/articles/pending', protect, admin, adminGetPendingArticles);

// @desc    Approve or Reject an article
// @route   PATCH /api/admin/articles/:id/status
// @access  Private/Admin
router.patch('/articles/:id/status', protect, admin, adminUpdateArticleStatus);

// @desc    Send bulk notifications
// @route   POST /api/admin/notifications/bulk
// @access  Private/Admin
router.post('/notifications/bulk', protect, admin, async (req, res) => {
  const { target, title, message } = req.body;

  if (!title || !message || !target) {
    return res.status(400).json({ message: 'Thiếu thông tin tiêu đề, nội dung hoặc đối tượng gửi.' });
  }

  try {
    let users = [];
    if (target === 'all') {
      users = await User.findAll({ attributes: ['id'] });
    } else if (target === 'students') {
      users = await User.findAll({ where: { role: 'student' }, attributes: ['id'] });
    } else if (target === 'instructors') {
      users = await User.findAll({ where: { role: 'instructor' }, attributes: ['id'] });
    }

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng nào phù hợp với đối tượng đã chọn.' });
    }

    const notifications = users.map(user => ({
      userId: user.id,
      title,
      message,
      isRead: false
    }));

    await Notification.bulkCreate(notifications);

    res.status(201).json({ 
      message: `Đã gửi thông báo thành công cho ${users.length} người dùng!`,
      count: users.length 
    });
  } catch (error) {
    console.error('Lỗi khi gửi thông báo hàng loạt:', error);
    res.status(500).json({ message: 'Đã có lỗi xảy ra khi gửi thông báo.' });
  }
});

// @desc    Get full course review data (curriculum, etc.)
// @route   GET /api/admin/courses/:id/review
// @access  Private/Admin
router.get('/courses/:id/review', protect, admin, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['name', 'avatar', 'email'] },
        {
          model: Chapter,
          as: 'chapters',
          include: [
            {
              model: Lesson,
              as: 'lessons',
              include: [{ model: Quiz, as: 'quiz' }]
            }
          ]
        }
      ],
      order: [
        [{ model: Chapter, as: 'chapters' }, 'chapterOrder', 'ASC'],
        [{ model: Chapter, as: 'chapters' }, { model: Lesson, as: 'lessons' }, 'lessonOrder', 'ASC'],
      ]
    });

    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/admin/courses/edit-requests — Admin: Get all edit requests ──
router.get('/courses/edit-requests', protect, admin, async (req, res) => {
  try {
    const requests = await CourseEditRequest.findAll({
      where: { status: 'pending' },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title', 'version'] },
        { model: User, as: 'instructor', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PATCH /api/admin/courses/edit-requests/:id/status — Admin: Approve/Reject ──
router.patch('/courses/edit-requests/:id/status', protect, admin, async (req, res) => {
  try {
    const { status, message } = req.body; // status: 'approved' or 'rejected'
    const editRequest = await CourseEditRequest.findByPk(req.params.id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!editRequest) return res.status(404).json({ message: 'Yêu cầu không tồn tại' });
    if (editRequest.status !== 'pending') return res.status(400).json({ message: 'Yêu cầu đã được xử lý' });

    editRequest.status = status;
    await editRequest.save();

    if (status === 'approved') {
      // Clone course to create V2
      const newVersion = await cloneCourse(editRequest.courseId);
      
      // Notify instructor
      await Notification.create({
        userId: editRequest.instructorId,
        title: 'Yêu cầu chỉnh sửa được duyệt',
        message: `Yêu cầu chỉnh sửa khóa học "${editRequest.course.title}" đã được duyệt. Bạn có thể bắt đầu chỉnh sửa bản nháp mới (v${newVersion.version}).`,
        relatedId: newVersion.id.toString(),
        type: 'course_status'
      });

      res.json({ message: 'Đã duyệt yêu cầu và tạo bản sao mới', newCourseId: newVersion.id });
    } else {
      // Notify instructor about rejection
      await Notification.create({
        userId: editRequest.instructorId,
        title: 'Yêu cầu chỉnh sửa bị từ chối',
        message: `Yêu cầu chỉnh sửa khóa học "${editRequest.course.title}" đã bị từ chối. Lý do: ${message || 'Không có'}`,
        relatedId: editRequest.courseId.toString(),
        type: 'course_status'
      });
      res.json({ message: 'Đã từ chối yêu cầu chỉnh sửa' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/admin/courses/:id/diff — Admin: Compare V2 draft with V1 ──
router.get('/courses/:id/diff', protect, admin, async (req, res) => {
  try {
    const v2Course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Chapter,
          as: 'chapters',
          include: [{ model: Lesson, as: 'lessons', include: [{ model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions' }] }] }]
        }
      ]
    });

    if (!v2Course) return res.status(404).json({ message: 'Bản nháp không tồn tại' });
    if (!v2Course.rootCourseId) return res.status(400).json({ message: 'Đây không phải là một bản nháp chỉnh sửa' });

    const v1Course = await Course.findByPk(v2Course.rootCourseId, {
      include: [
        {
          model: Chapter,
          as: 'chapters',
          include: [{ model: Lesson, as: 'lessons', include: [{ model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions' }] }] }]
        }
      ]
    });

    res.json({ v1: v1Course, v2: v2Course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
