const { User, Enrollment, Course, Progress, Lesson, QuizAttempt, Quiz, StudyGoal } = require('../models');

// ── GET /api/users/student/stats ───────────────────────────────────────────
exports.getStudentStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Total enrolled courses
    const totalCourses = await Enrollment.count({ where: { userId } });

    // Completed lessons (assuming Progress with status 'completed' or just existing record)
    const completedLessons = await Progress.count({
      include: [{
        model: Enrollment,
        where: { userId }
      }]
    });

    // Quiz points (Total score from all attempts)
    const quizAttempts = await QuizAttempt.findAll({ where: { userId } });
    const totalPoints = quizAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0);

    // Badges (Simple logic: 1 badge per completed course)
    // In a real app, this might be a separate table or complex logic
    const badges = Math.floor(totalPoints / 100); // Mock badge logic: 1 badge per 100 points

    res.json({
      totalCourses,
      completedLessons,
      points: totalPoints,
      badges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/users/student/enrolled-courses ─────────────────────────────────
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const enrollments = await Enrollment.findAll({
      where: { userId },
      include: [
        {
          model: Course,
          include: [{ model: User, as: 'instructor', attributes: ['name'] }]
        }
      ]
    });

    const courses = await Promise.all(enrollments.map(async (en) => {
      const course = en.Course;
      
      // Calculate progress
      const totalLessons = await Lesson.count({
        include: [{
          model: require('../models').Chapter,
          where: { courseId: course.id }
        }]
      });

      const completedLessons = await Progress.count({
        where: { enrollmentId: en.id }
      });

      const progressPercent = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        instructorName: course.instructor?.name || 'Unknown',
        progressPercent,
        category: course.category
      };
    }));

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/users/student/quiz-attempts ─────────────────────────────────────
exports.getQuizAttempts = async (req, res) => {
  try {
    const userId = req.user.id;
    const attempts = await QuizAttempt.findAll({
      where: { userId },
      include: [
        {
          model: Quiz,
          include: [{ model: Lesson, attributes: ['title'] }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedAttempts = attempts.map(att => ({
      id: att.id,
      quizId: att.quizId,
      lessonTitle: att.Quiz?.Lesson?.title || 'Unknown Lesson',
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt
    }));

    res.json(formattedAttempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get study goals for a specific date
// @route   GET /api/users/student/study-goals
exports.getStudyGoals = async (req, res) => {
  try {
    const { date } = req.query; // Expecting YYYY-MM-DD
    const goals = await StudyGoal.findAll({
      where: {
        userId: req.user.id,
        date: date || new Date().toISOString().split('T')[0]
      },
      order: [['time', 'ASC']]
    });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching study goals', error: error.message });
  }
};

// @desc    Get dates that have goals for the current month
// @route   GET /api/users/student/study-goals/summary
exports.getStudyGoalsSummary = async (req, res) => {
  try {
    const goals = await StudyGoal.findAll({
      where: { userId: req.user.id },
      attributes: ['date'],
      group: ['date']
    });
    const dates = goals.map(g => g.date);
    res.json(dates);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching goals summary', error: error.message });
  }
};

// @desc    Add a new study goal
// @route   POST /api/users/student/study-goals
exports.addStudyGoal = async (req, res) => {
  try {
    const { title, type, date, time, color } = req.body;
    const goal = await StudyGoal.create({
      userId: req.user.id,
      title,
      type,
      date,
      time,
      color
    });
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Error adding study goal', error: error.message });
  }
};

// @desc    Update a study goal (toggle complete or edit)
// @route   PUT /api/users/student/study-goals/:id
exports.updateStudyGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await StudyGoal.findOne({ where: { id, userId: req.user.id } });
    
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    await goal.update(req.body);
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Error updating study goal', error: error.message });
  }
};

// @desc    Delete a study goal
// @route   DELETE /api/users/student/study-goals/:id
exports.deleteStudyGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await StudyGoal.destroy({ where: { id, userId: req.user.id } });
    
    if (!result) return res.status(404).json({ message: 'Goal not found' });

    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting study goal', error: error.message });
  }
};
