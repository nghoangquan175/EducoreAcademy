const { Op } = require('sequelize');
const { Course, Article } = require('../models');

// @desc    Search courses and articles by title
// @route   GET /api/search?q=keyword
// @access  Public
const searchContent = async (req, res) => {
  try {
    const query = req.query.q;
    const instructorId = req.query.instructorId;

    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters long' });
    }

    // Search max 5-10 records total to be efficient
    const limitPerType = 5;

    // Build the course where clause
    const courseWhere = {
      title: {
        [Op.substring]: query
      }
    };

    // If instructorId is provided, filter by it and don't restrict to published only (they can search drafts)
    if (instructorId) {
      courseWhere.instructorId = instructorId;
    } else {
      courseWhere.published = 2; // 2 = Published
    }

    const courses = await Course.findAll({
      where: courseWhere,
      limit: limitPerType,
      attributes: ['id', 'title', 'thumbnail', 'category']
    });

    let articles = [];
    // Only search articles if not strictly searching instructor courses
    if (!instructorId) {
      articles = await Article.findAll({
        where: {
          title: {
            [Op.substring]: query
          },
          published: true
        },
        limit: limitPerType,
        attributes: ['id', 'title', 'thumbnail']
      });
    }

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

    // Combine and slice to max 10 total if needed, but here limitPerType=5 means max 10 anyway
    const results = [...formattedCourses, ...formattedArticles];

    res.json(results);

  } catch (error) {
    res.status(500).json({ message: 'Server error during search', error: error.message });
  }
};

module.exports = {
  searchContent
};
