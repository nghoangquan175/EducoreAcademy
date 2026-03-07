const express = require('express');
const router = express.Router();
const { Course, User } = require('../models');
const { protect, instructor } = require('../middleware/authMiddleware');

// Get all published courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.findAll({ 
      where: { published: true },
      include: [{ model: User, as: 'instructor', attributes: ['name'] }]
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a course
router.post('/', protect, instructor, async (req, res) => {
  try {
    const { title, description, price, category } = req.body;
    const course = await Course.create({
      title,
      description,
      price,
      category,
      instructorId: req.user.id
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
