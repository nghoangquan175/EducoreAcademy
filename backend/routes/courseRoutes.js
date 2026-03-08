const express = require('express');
const router = express.Router();
const { Course, User } = require('../models');
const { Op } = require('sequelize');
const { protect, instructor } = require('../middleware/authMiddleware');

// ── GET /api/courses — Public: list published courses (optional ?category=, ?type=pro/free) ──
router.get('/', async (req, res) => {
  try {
    const where = { published: true };
    // Category filter
    if (req.query.category && req.query.category !== 'Tất cả') {
      where.category = req.query.category;
    }
    // Type filter: 'free' (price 0/null) or 'pro' (price > 0)
    if (req.query.type === 'free') {
      where.price = { [Op.or]: [0, null] };
    } else if (req.query.type === 'pro') {
      where.price = { [Op.gt]: 0 };
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
      published: true, 
      category: { [Op.not]: null, [Op.ne]: '' } 
    };

    if (req.query.type === 'free') {
      where.price = { [Op.or]: [0, null] };
    } else if (req.query.type === 'pro') {
      where.price = { [Op.gt]: 0 };
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

// ── GET /api/courses/:id — Public: get single course ─────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [{ model: User, as: 'instructor', attributes: ['name', 'avatar'] }],
    });
    if (!course || !course.published) {
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
    const { title, description, price, category, thumbnail, level, duration } = req.body;
    const course = await Course.create({
      title, description, price, category, thumbnail, level, duration,
      instructorId: req.user.id,
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
