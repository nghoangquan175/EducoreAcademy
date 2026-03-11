const express = require('express');
const router = express.Router();
const { Course, Chapter, Lesson, User } = require('../models');
const { Op } = require('sequelize');
const { protect, instructor } = require('../middleware/authMiddleware');

// ── GET /api/courses — Public: list published courses (optional ?category=, ?type=pro/free) ──
router.get('/', async (req, res) => {
  try {
    const where = { published: 2 };
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
    const courses = await Course.findAll({
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
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/categories — Public: list available categories (optional ?type=pro/free) ───────────
router.get('/categories', async (req, res) => {
  try {
    const where = {
      published: 2, // 2 = Published
      category: { [Op.not]: null, [Op.ne]: '' }
    };

    if (req.query.type === 'free') {
      where.isPro = false;
    } else if (req.query.type === 'pro') {
      where.isPro = true;
    }

    const categories = await Course.findAll({
      attributes: ['category'],
      where,
      group: ['category'],
      order: [['category', 'ASC']],
    });

    const categoryList = categories.map(c => c.category);
    res.json(['Tất cả', ...categoryList]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/instructor/my-courses — Instructor: get own courses (including drafts) ──
router.get('/instructor/my-courses', protect, instructor, async (req, res) => {
  try {
    const { sequelize } = require('../config/db');
    const courses = await Course.findAll({
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
      order: [['createdAt', 'DESC']],
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
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── GET /api/courses/:id/curriculum — Public: get full curriculum (chapters + lessons) ──
router.get('/:id/curriculum', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['name', 'avatar'] },
        {
          model: Chapter,
          as: 'chapters',
          include: [
            {
              model: Lesson,
              as: 'lessons',
              attributes: ['id', 'title', 'duration', 'isFree', 'lessonOrder'],
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
    res.json(course);
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
    res.json(chapter);
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

    res.status(200).json({ message: 'Gửi yêu cầu phê duyệt thành công', published: course.published });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
