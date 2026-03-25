const express = require('express');
const router = express.Router();
const { Course, Chapter, Lesson, User, Enrollment, Quiz, Progress, Review } = require('../models');
const { Op } = require('sequelize');
const { protect, instructor, optionalProtect } = require('../middleware/authMiddleware');
const { notifyAdmins } = require('../utils/notificationUtils');

// ── GET /api/courses — Public/Enrolled-aware: list published courses ──
router.get('/', optionalProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 8;
    const offset = (page - 1) * limit;

    const where = { published: 2, isLatest: true };
    
    // Logic mới: Lọc bỏ các khóa học đã đăng ký nếu được yêu cầu
    if (req.query.excludeEnrolled === 'true' && req.user) {
      const enrolledCourses = await Enrollment.findAll({
        where: { userId: req.user.id },
        attributes: ['courseId']
      });
      const enrolledIds = enrolledCourses.map(e => e.courseId);
      if (enrolledIds.length > 0) {
        where.id = { [Op.notIn]: enrolledIds };
      }
    }
    // Category filter
    if (req.query.category && req.query.category !== 'Tất cả') {
      where.category = req.query.category;
    }
    // Type filter: 'free' or 'pro' relies on isPro boolean now
    if (req.query.type === 'free') {
      where.isPro = false;
    } else if (req.query.type === 'pro') {
      where.isPro = true;
    }

    const { sequelize } = require('../config/db');
    const { count, rows: courses } = await Course.findAndCountAll({
      where,
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
      order: [[sequelize.literal('(SELECT COUNT(*) FROM [Enrollments] WHERE [Enrollments].[courseId] = [Course].[id])'), 'DESC']],
      include: [{ model: User, as: 'instructor', attributes: ['name'] }],
      limit,
      offset,
      distinct: true
    });

    res.json({
      courses,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/categories — Public: list available categories (optional ?type=pro/free) ───────────
router.get('/categories', async (req, res) => {
  try {
    const { Category } = require('../models');
    const categories = await Category.findAll({
      order: [['name', 'ASC']],
    });

    const categoryList = categories.map(c => c.name);
    res.json(['Tất cả', ...categoryList]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/instructor/my-courses — Instructor: get own courses (including drafts) ──
router.get('/instructor/my-courses', protect, instructor, async (req, res) => {
  try {
    const { CourseEditRequest } = require('../models');
    const allCourses = await Course.findAll({
      where: { instructorId: req.user.id },
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
      include: [
        {
          model: CourseEditRequest,
          as: 'editRequests',
          limit: 1,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['version', 'DESC'], ['updatedAt', 'DESC']],
    });

    // Grouping by rootCourseId to show only the "Working Copy"
    const groupedCourses = {};
    for (const course of allCourses) {
      const rootId = course.rootCourseId || course.id;
      if (!groupedCourses[rootId]) {
        groupedCourses[rootId] = course;
      } else {
        // Priority: Draft (0) > Pending (1) > Published (2)
        // Since we ordered by version DESC, we already likely have the latest version.
        // But we want to prefer a Version that is NOT Published if it exists for that root.
        const currentSelected = groupedCourses[rootId];
        if (course.published < currentSelected.published) {
             // If we find a version with lower status value (Draft=0 < Pending=1 < Published=2), 
             // it means it's the "active working copy".
             // However, usually the higher version IS the working copy.
             // Let's stick to: Latest Version is the one shown.
        }
      }
    }

    // Simplified logic: For each unique rootCourseId (or id if NULL), 
    // pick the version with the highest version number.
    const result = [];
    const rootsSeen = new Set();
    for (const course of allCourses) {
       const rootId = course.rootCourseId || course.id;
       if (!rootsSeen.has(rootId)) {
         result.push(course);
         rootsSeen.add(rootId);
       }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/trash — Instructor/Admin: Get trash bin courses ──
router.get('/trash/all', protect, async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== 'admin') {
      where.instructorId = req.user.id;
    }
    
    // Manual check for deletedAt since we need paranoid: false
    const courses = await Course.findAll({
      where: {
        ...where,
        deletedAt: { [Op.ne]: null }
      },
      paranoid: false,
      include: [{ model: User, as: 'instructor', attributes: ['name'] }],
      order: [['deletedAt', 'DESC']]
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/:id — Public: get single course ─────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [{ model: User, as: 'instructor', attributes: ['name', 'avatar'] }],
    });
    if (!course || course.published !== 2) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses — Instructor: create a course ──────────────────────────
router.post('/', protect, instructor, async (req, res) => {
  try {
    const { title, description, price, category, thumbnail, previewVideoUrl, level, duration, isPro } = req.body;
    const course = await Course.create({
      title, description, price, category, thumbnail, previewVideoUrl, level, duration, isPro,
      instructorId: req.user.id,
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/instructor/:id — Instructor: get single course for editing ──
router.get('/instructor/:id', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }
    // Auth check: only owner can fetch for editing
    if (course.instructorId !== req.user.id) {
       return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PATCH /api/courses/:id — Instructor: update course details ───────────────
router.patch('/:id', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    // Auth check: only owner can edit
    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    const { title, description, price, category, thumbnail, previewVideoUrl, level, duration, isPro } = req.body;
    
    // Update fields
    course.title = title !== undefined ? title : course.title;
    course.description = description !== undefined ? description : course.description;
    course.price = price !== undefined ? price : course.price;
    course.category = category !== undefined ? category : course.category;
    course.thumbnail = thumbnail !== undefined ? thumbnail : course.thumbnail;
    course.previewVideoUrl = previewVideoUrl !== undefined ? previewVideoUrl : course.previewVideoUrl;
    course.level = level !== undefined ? level : course.level;
    course.duration = duration !== undefined ? duration : course.duration;
    course.isPro = isPro !== undefined ? isPro : course.isPro;

    await course.save();

    // Notify admins if course is already published
    if (course.published === 2) {
      await notifyAdmins(
        'Cập nhật khóa học đã xuất bản',
        `Giảng viên ${req.user.name} vừa cập nhật nội dung cho khóa học: "${course.title}" (ID: ${course.id})`
      );
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/:id/curriculum — Public/Enrolled-aware: get full curriculum ──
router.get('/:id/curriculum', optionalProtect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findByPk(courseId, {
      include: [
        { model: User, as: 'instructor', attributes: ['name', 'avatar'] },
        {
          model: Chapter,
          as: 'chapters',
          include: [
            {
              model: Lesson,
              as: 'lessons',
              attributes: ['id', 'title', 'duration', 'isFree', 'lessonOrder', 'videoUrl'],
            }
          ]
        }
      ],
      order: [
        [{ model: Chapter, as: 'chapters' }, 'chapterOrder', 'ASC'],
        [{ model: Chapter, as: 'chapters' }, { model: Lesson, as: 'lessons' }, 'lessonOrder', 'ASC'],
      ]
    });
    if (!course || course.published !== 2) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    let isEnrolled = false;
    if (req.user) {
      const enrollment = await Enrollment.findOne({ where: { userId: req.user.id, courseId } });
      isEnrolled = !!enrollment;
    }

    res.json({ ...course.toJSON(), isEnrolled });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/:id/learn — Enrolled: get full curriculum for learning ──
router.get('/:id/learn', protect, async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;

    const course = await Course.findByPk(courseId, {
      include: [
        { model: User, as: 'instructor', attributes: ['name', 'avatar'] },
        {
          model: Chapter,
          as: 'chapters',
          include: [{ 
            model: Lesson, 
            as: 'lessons',
            include: [{ model: Quiz, as: 'quiz', attributes: ['id'] }]
          }]
        }
      ],
      order: [
        [{ model: Chapter, as: 'chapters' }, 'chapterOrder', 'ASC'],
        [{ model: Chapter, as: 'chapters' }, { model: Lesson, as: 'lessons' }, 'lessonOrder', 'ASC'],
      ]
    });

    if (!course || course.published !== 2) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({ where: { courseId, userId } });
    const isOwner = course.instructorId === userId;
    const isAdmin = req.user.role === 'admin';

    if (!enrollment && !isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này' });
    }

    // Update lastAccessedAt if it's a student
    if (enrollment) {
      enrollment.lastAccessedAt = new Date();
      await enrollment.save();

      // Fetch user progress
      const userProgress = await Progress.findAll({
        where: { enrollmentId: enrollment.id }
      });

      // Map progress to lessons
      course.chapters.forEach(chapter => {
        chapter.lessons.forEach(lesson => {
          const prog = userProgress.find(p => p.lessonId === lesson.id);
          lesson.setDataValue('videoWatched', prog ? prog.videoWatched : false);
          lesson.setDataValue('completed', prog ? prog.completed : false);
        });
      });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/:id/activity — Update last activity ──
router.post('/:id/activity', protect, async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;
    const enrollment = await Enrollment.findOne({ where: { courseId, userId } });
    if (enrollment) {
      enrollment.lastAccessedAt = new Date();
      await enrollment.save();
      return res.json({ success: true });
    }
    res.status(404).json({ message: 'Enrollment not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// ── GET /api/courses/instructor/:id/full-curriculum — Instructor: get full curriculum for editing ──
router.get('/instructor/:id/full-curriculum', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: Chapter,
          as: 'chapters',
          include: [{ model: Lesson, as: 'lessons' }]
        }
      ],
      order: [
        [{ model: Chapter, as: 'chapters' }, 'chapterOrder', 'ASC'],
        [{ model: Chapter, as: 'chapters' }, { model: Lesson, as: 'lessons' }, 'lessonOrder', 'ASC'],
      ]
    });
    if (!course) return res.status(404).json({ message: 'Khoá học không tồn tại' });
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/:id/chapters — Instructor: create chapter ──────────
router.post('/:id/chapters', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: 'Khoá học không tồn tại' });
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    const { title, chapterOrder } = req.body;
    const chapter = await Chapter.create({
      title,
      chapterOrder,
      courseId: course.id
    });

    // Notify admins if course is published
    if (course.published === 2) {
      await notifyAdmins(
        'Thêm chương mới',
        `Giảng viên ${req.user.name} vừa thêm chương "${title}" vào khóa học: "${course.title}"`
      );
    }

    res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PATCH /api/courses/chapters/:id — Instructor: update chapter ──────────────
router.patch('/chapters/:id', protect, instructor, async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chương không tồn tại' });
    
    // Simple ownership check via the associated course
    const course = await Course.findByPk(chapter.courseId);
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    const { title, chapterOrder } = req.body;
    chapter.title = title !== undefined ? title : chapter.title;
    chapter.chapterOrder = chapterOrder !== undefined ? chapterOrder : chapter.chapterOrder;
    await chapter.save();

    // Notify admins if course is published
    if (course.published === 2) {
      await notifyAdmins(
        'Cập nhật nội dung chương',
        `Giảng viên ${req.user.name} vừa cập nhật chương "${chapter.title}" trong khóa học: "${course.title}"`
      );
    }

    res.json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/chapters/:chapterId/lessons — Instructor: create lesson ───
router.post('/chapters/:chapterId/lessons', protect, instructor, async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.chapterId);
    if (!chapter) return res.status(404).json({ message: 'Chương không tồn tại' });
    
    const course = await Course.findByPk(chapter.courseId);
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    const { title, lessonOrder, isFree, videoUrl, content, duration } = req.body;
    const lesson = await Lesson.create({
      title,
      lessonOrder,
      isFree,
      videoUrl,
      content,
      duration,
      chapterId: chapter.id
    });

    // Notify admins if course is published
    if (course.published === 2) {
      await notifyAdmins(
        'Thêm bài học mới',
        `Giảng viên ${req.user.name} vừa thêm bài học "${title}" vào khóa học: "${course.title}"`
      );
    }

    // Update stats
    await Course.updateCourseStats(course.id);

    res.status(201).json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── DELETE /api/courses/chapters/:id — Instructor: delete chapter ────────────
router.delete('/chapters/:id', protect, instructor, async (req, res) => {
  try {
    const chapter = await Chapter.findByPk(req.params.id);
    if (!chapter) return res.status(404).json({ message: 'Chương không tồn tại' });
    
    const course = await Course.findByPk(chapter.courseId);
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    await chapter.destroy();

    // Notify admins if course is published
    if (course.published === 2) {
      await notifyAdmins(
        'Xóa chương học',
        `Giảng viên ${req.user.name} vừa xóa một chương trong khóa học: "${course.title}"`
      );
    }

    // Update stats
    await Course.updateCourseStats(course.id);

    res.json({ message: 'Đã xóa chương' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PATCH /api/courses/lessons/:id — Instructor: update lesson ───────────────
router.patch('/lessons/:id', protect, instructor, async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại' });

    const chapter = await Chapter.findByPk(lesson.chapterId);
    const course = await Course.findByPk(chapter.courseId);
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    const { title, videoUrl, content, lessonOrder, duration, isFree } = req.body;
    lesson.title = title !== undefined ? title : lesson.title;
    lesson.videoUrl = videoUrl !== undefined ? videoUrl : lesson.videoUrl;
    lesson.content = content !== undefined ? content : lesson.content;
    lesson.lessonOrder = lessonOrder !== undefined ? lessonOrder : lesson.lessonOrder;
    lesson.duration = duration !== undefined ? duration : lesson.duration;
    lesson.isFree = isFree !== undefined ? isFree : lesson.isFree;

    await lesson.save();

    // Notify admins if course is published
    if (course.published === 2) {
      await notifyAdmins(
        'Cập nhật nội dung bài học',
        `Giảng viên ${req.user.name} vừa cập nhật bài học "${lesson.title}" trong khóa học: "${course.title}"`
      );
    }

    // Update stats
    await Course.updateCourseStats(course.id);

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── DELETE /api/courses/lessons/:id — Instructor: delete lesson ──────────────
router.delete('/lessons/:id', protect, instructor, async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại' });

    const chapter = await Chapter.findByPk(lesson.chapterId);
    const course = await Course.findByPk(chapter.courseId);
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });

    await lesson.destroy();

    // Notify admins if course is published
    if (course.published === 2) {
      await notifyAdmins(
        'Xóa bài học',
        `Giảng viên ${req.user.name} vừa xóa một bài học trong khóa học: "${course.title}"`
      );
    }

    // Update stats
    await Course.updateCourseStats(course.id);

    res.json({ message: 'Đã xóa bài học' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/:id/enroll — Student: enroll in a free course ──────────
router.post('/:id/enroll', protect, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    const { Enrollment } = require('../models');
    const existingEnrollment = await Enrollment.findOne({
      where: { userId: req.user.id, courseId: course.id }
    });

    if (!existingEnrollment) {
      await Enrollment.create({
        userId: req.user.id,
        courseId: course.id,
        status: 'active'
      });
      // Tăng số lượng học viên cho khoá học
      await course.increment('studentsCount');
    }

    res.status(200).json({ message: 'Đăng ký khoá học thành công', courseId: course.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/:id/edit-request — Instructor: request to edit a published course ──
router.post('/:id/edit-request', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ message: 'Khoá học không tồn tại' });
    if (course.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });
    if (course.published !== 2) return res.status(400).json({ message: 'Chỉ có thể yêu cầu sửa khóa học đã xuất bản' });

    const { reason, contentSummary } = req.body;
    const { CourseEditRequest } = require('../models');

    // Check if there's already a pending request
    const existingRequest = await CourseEditRequest.findOne({
      where: { courseId: course.id, status: 'pending' }
    });
    if (existingRequest) return res.status(400).json({ message: 'Đã có một yêu cầu đang chờ phê duyệt' });

    const editRequest = await CourseEditRequest.create({
      courseId: course.id,
      instructorId: req.user.id,
      reason,
      contentSummary,
      status: 'pending'
    });

    await notifyAdmins(
      'Yêu cầu chỉnh sửa khóa học đã xuất bản',
      `Giảng viên ${req.user.name} muốn chỉnh sửa khóa học: "${course.title}" (ID: ${course.id})`
    );

    res.status(201).json(editRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/edit-requests/:id/reactivate — Instructor: request to reactivate an expired draft ──
router.post('/edit-requests/:id/reactivate', protect, instructor, async (req, res) => {
  try {
    const { CourseEditRequest } = require('../models');
    const editRequest = await CourseEditRequest.findByPk(req.params.id);

    if (!editRequest) return res.status(404).json({ message: 'Yêu cầu không tồn tại' });
    if (editRequest.instructorId !== req.user.id) return res.status(403).json({ message: 'Không có quyền' });
    if (editRequest.status !== 'expired') return res.status(400).json({ message: 'Yêu cầu chưa hết hạn hoặc đang ở trạng thái khác' });

    // Mark as pending again for admin review
    editRequest.status = 'pending';
    await editRequest.save();

    await notifyAdmins(
      'Yêu cầu gia hạn chỉnh sửa khóa học',
      `Giảng viên ${req.user.name} yêu cầu mở lại quyền chỉnh sửa cho khóa học ID: ${editRequest.courseId}`
    );

    res.json({ message: 'Đã gửi yêu cầu gia hạn nội dung' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PATCH /api/courses/:id/submit — Instructor: submit for approval ──────
router.patch('/:id/submit', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    // Auth check: only owner can submit
    if (course.instructorId !== req.user.id) {
       return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    // Pre-submission checks (can be expanded later, e.g. check if lessons exist)
    // For now, just allow submitting if status is Draft(0) or Rejected(3)
    if (course.published !== 0 && course.published !== 3) {
      return res.status(400).json({ message: 'Trạng thái khoá học không hợp lệ để gửi yêu cầu' });
    }

    course.published = 1; // 1 = Pending
    await course.save();

    // Notify admins of new submission
    await notifyAdmins(
      'Yêu cầu phê duyệt khóa học mới',
      `Giảng viên ${req.user.name} vừa gửi yêu cầu phê duyệt cho khóa học: "${course.title}" (ID: ${course.id})`
    );

    res.status(200).json({ message: 'Gửi yêu cầu phê duyệt thành công', published: course.published });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── DELETE /api/courses/:id — Instructor: delete course ────────────
router.delete('/:id', protect, instructor, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Khoá học không tồn tại' });
    }

    // Auth check: only owner can delete
    if (course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này' });
    }

    // Restriction: Cannot delete published courses
    if (course.published === 2) {
      return res.status(400).json({ message: 'Không thể xóa khóa học đã được xuất bản' });
    }

    await course.destroy();
    res.json({ message: 'Đã xóa khóa học thành công' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/lessons/:id/complete — Student: Mark lesson as completed ──
router.post('/lessons/:id/complete', protect, async (req, res) => {
  try {
    const lessonId = req.params.id;
    const userId = req.user.id;

    // Find the lesson and its course
    const lesson = await Lesson.findByPk(lessonId, {
      include: [{ model: Chapter, include: [{ model: Course }] }]
    });

    if (!lesson) return res.status(404).json({ message: 'Bài học không tồn tại' });

    const courseId = lesson.Chapter.Course.id;

    // Find enrollment
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'Bạn chưa đăng ký khóa học này' });
    }

    // Create or find progress
    const quiz = await Quiz.findOne({ where: { lessonId: lesson.id } });
    
    const [progress, created] = await Progress.findOrCreate({
      where: { enrollmentId: enrollment.id, lessonId },
      defaults: { 
        videoWatched: true,
        completed: !quiz, // Mark completed ONLY if no quiz exists
        completedAt: !quiz ? new Date() : null 
      }
    });

    if (!created) {
      progress.videoWatched = true;
      if (!quiz && !progress.completed) {
        progress.completed = true;
        progress.completedAt = new Date();
      }
      await progress.save();
    }

    // Also update enrollment activity
    enrollment.lastAccessedAt = new Date();
    await enrollment.save();

    res.json({ 
      message: quiz ? 'Đã ghi nhận xem video. Vui lòng hoàn thành bài kiểm tra để tiếp tục.' : 'Đã đánh dấu hoàn thành bài học', 
      progress,
      quizExists: !!quiz
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── PUT /api/courses/:id/restore — Instructor/Admin: Restore course ──
router.put('/:id/restore', protect, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, { paranoid: false });
    if (!course) return res.status(404).json({ message: 'Khoá học không tồn tại' });
    
    if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    await course.restore();
    res.json({ message: 'Đã khôi phục khóa học' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── DELETE /api/courses/:id/force — Instructor/Admin: Permanent delete ──
router.delete('/:id/force', protect, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, { paranoid: false });
    if (!course) return res.status(404).json({ message: 'Khoá học không tồn tại' });

    if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền' });
    }

    await course.destroy({ force: true });
    res.json({ message: 'Đã xóa vĩnh viễn khóa học' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/:id/reviews — Public: get course reviews ────────
router.get('/:id/reviews', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { courseId: req.params.id },
      include: [{ model: User, as: 'user', attributes: ['name', 'avatar'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      totalReviews: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/:id/reviews — Student: Submit a review ──────────
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const courseId = req.params.id;
    const userId = req.user.id;

    // 1. Check enrollment
    const enrollment = await Enrollment.findOne({ where: { userId, courseId } });
    if (!enrollment) {
      return res.status(403).json({ message: 'Bạn phải đăng ký khóa học này để đánh giá' });
    }

    // 2. Check completion
    const totalLessons = await Lesson.count({
      include: [{ model: Chapter, where: { courseId } }]
    });

    const completedLessons = await Progress.count({
      where: { enrollmentId: enrollment.id, completed: true }
    });

    if (completedLessons < totalLessons || totalLessons === 0) {
      return res.status(403).json({ 
        message: 'Bạn phải hoàn thành toàn bộ khóa học trước khi để lại đánh giá',
        progress: `${completedLessons}/${totalLessons}`
      });
    }

    // 3. Create or update review
    const existingReview = await Review.findOne({ where: { courseId, userId } });
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();

      // Update Course Average Rating
      const allReviews = await Review.findAll({ where: { courseId } });
      const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
      const roundedRating = Math.round(avgRating * 10) / 10;
      await Course.update({ rating: roundedRating }, { where: { id: courseId } });

      return res.json({ message: 'Đã cập nhật đánh giá của bạn', review: existingReview });
    }

    const review = await Review.create({
      courseId,
      userId,
      rating,
      comment
    });

    // 4. Update Course Average Rating
    const allReviews = await Review.findAll({ where: { courseId } });
    const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10;
    await Course.update({ rating: roundedRating }, { where: { id: courseId } });

    res.status(201).json({ message: 'Cảm ơn bạn đã đánh giá khóa học!', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
 
module.exports = router;
