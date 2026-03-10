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

    const courses = await Course.findAll({
      where,
      order: [['studentsCount', 'DESC']],
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
    const courses = await Course.findAll({
      where: { instructorId: req.user.id },
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

// ── GET /api/courses/:id/curriculum — Public: get full curriculum (chapters + lessons) ──
router.get('/:id/curriculum', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: User, as: 'instructor', attributes: ['name', 'avatar'] },
        {
          model: Chapter,
          as: 'chapters',
          order: [['chapterOrder', 'ASC']],
          include: [
            {
              model: Lesson,
              as: 'lessons',
              attributes: ['id', 'title', 'duration', 'isFree', 'lessonOrder'],
              order: [['lessonOrder', 'ASC']],
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

// ── POST /api/courses/:id/chapters — Instructor: add a chapter ───────────────
router.post('/:id/chapters', protect, instructor, async (req, res) => {
  try {
    const { title, chapterOrder } = req.body;
    const chapter = await Chapter.create({ title, chapterOrder, courseId: req.params.id });
    res.status(201).json(chapter);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── POST /api/courses/chapters/:chapterId/lessons — Instructor: add a lesson ─
router.post('/chapters/:chapterId/lessons', protect, instructor, async (req, res) => {
  try {
    const { title, videoUrl, content, lessonOrder, duration, isFree } = req.body;
    const lesson = await Lesson.create({
      title, videoUrl, content, lessonOrder, duration, isFree,
      chapterId: req.params.chapterId,
    });
    res.status(201).json(lesson);
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
    }

    res.status(200).json({ message: 'Đăng ký khoá học thành công', courseId: course.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
