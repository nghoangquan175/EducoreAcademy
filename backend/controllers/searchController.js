const { Op } = require('sequelize');
const { Course, Article } = require('../models');

// @desc    Search courses and articles by title
// @route   GET /api/search?q=keyword
// @access  Public
const searchContent = async (req, res) => {
  try {
    const query = req.query.q;
    const instructorId = req.query.instructorId;
    const studentId = req.query.studentId;
    const authorId = req.query.authorId;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }

    const limitPerType = 5;

    // --- Course Search ---
    const courseWhere = {
      title: {
        [Op.substring]: query
      }
    };

    let courseInclude = [];

    if (studentId) {
      // Search only enrolled courses for this student
      const { Enrollment } = require('../models');
      courseInclude.push({
        model: Enrollment,
        where: { userId: studentId },
        required: true, // INNER JOIN
        attributes: [] // We don't need enrollment data, just the filter
      });
    } else if (instructorId) {
      // Search courses taught by this instructor
      courseWhere.instructorId = instructorId;
    } else {
      // Global search: only published courses
      courseWhere.published = 2; // 2 = Published
    }

    const courses = await Course.findAll({
      where: courseWhere,
      include: courseInclude,
      limit: limitPerType,
      attributes: ['id', 'title', 'thumbnail', 'category']
    });

    // --- Article Search ---
    const articleWhere = {
      title: {
        [Op.substring]: query
      },
      published: true
    };

    // If authorId is provided (Dashboard context), filter articles by author
    // If not provided (Global context), search all published articles
    if (authorId) {
      articleWhere.authorId = authorId;
    }

    const articles = await Article.findAll({
      where: articleWhere,
      limit: limitPerType,
      attributes: ['id', 'title', 'thumbnail']
    });

    // Formatting output
    const formattedCourses = courses.map(c => ({
      id: c.id,
      title: c.title,
      thumbnail: c.thumbnail,
      type: 'course',
      category: c.category
    }));

    const formattedArticles = articles.map(a => ({
      id: a.id,
      title: a.title,
      thumbnail: a.thumbnail,
      type: 'article'
    }));

    const results = [...formattedCourses, ...formattedArticles];
    res.json(results);

  } catch (error) {
    res.status(500).json({ message: 'Server error during search', error: error.message });
  }
};

module.exports = {
  searchContent
};
