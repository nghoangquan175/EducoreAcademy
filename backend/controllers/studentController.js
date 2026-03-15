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
        category: course.category,
        lastAccessedAt: en.lastAccessedAt
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
    const { Chapter, Course } = require('../models');
    const attempts = await QuizAttempt.findAll({
      where: { userId },
      include: [
        {
          model: Quiz,
          include: [{ 
            model: Lesson, 
            attributes: ['id', 'title'],
            include: [{
              model: Chapter,
              attributes: ['title'],
              include: [{
                model: Course,
                attributes: ['id', 'title']
              }]
            }]
          }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedAttempts = attempts.map(att => ({
      id: att.id,
      quizId: att.quizId,
      lessonId: att.Quiz?.Lesson?.id,
      lessonTitle: att.Quiz?.Lesson?.title || 'Unknown Lesson',
      chapterTitle: att.Quiz?.Lesson?.Chapter?.title || 'Unknown Chapter',
      courseId: att.Quiz?.Lesson?.Chapter?.Course?.id,
      courseTitle: att.Quiz?.Lesson?.Chapter?.Course?.title || 'Unknown Course',
      score: att.score,
      totalQuestions: att.totalQuestions,
      createdAt: att.createdAt
    }));

    res.json(formattedAttempts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/users/student/pending-quizzes ──────────────────────────────────
exports.getPendingQuizzes = async (req, res) => {
  try {
    const userId = req.user.id;
    const { Chapter, Course } = require('../models');

    // 1. Tìm tất cả lượt đăng ký của user
    const enrollments = await Enrollment.findAll({
      where: { userId },
      attributes: ['id']
    });
    const enrollmentIds = enrollments.map(e => e.id);

    // 2. Tìm các bài học đã hoàn thành (Progress) mà có Quiz (Lesson.Quiz)
    const progressRecords = await Progress.findAll({
      where: { 
        enrollmentId: enrollmentIds,
        completed: true 
      },
      include: [{
        model: Lesson,
        required: true,
        include: [
          { 
            model: Quiz, 
            as: 'quiz', 
            required: true // Chỉ lấy những bài học có quiz
          },
          {
            model: Chapter,
            include: [{ model: Course, attributes: ['id', 'title'] }]
          }
        ]
      }]
    });

    // 3. Tìm các Quiz mà user đã từng làm
    const attempts = await QuizAttempt.findAll({
      where: { userId },
      attributes: ['quizId'],
      group: ['quizId']
    });
    const attemptedQuizIds = attempts.map(a => a.quizId);

    // 4. Lọc ra những bài học có quiz nhưng CHƯA làm
    const pendingQuizzes = progressRecords
      .filter(p => p.Lesson && p.Lesson.quiz && !attemptedQuizIds.includes(p.Lesson.quiz.id))
      .map(p => ({
        id: p.Lesson.quiz.id,
        lessonId: p.Lesson.id,
        lessonTitle: p.Lesson.title,
        courseId: p.Lesson.Chapter?.Course?.id,
        courseTitle: p.Lesson.Chapter?.Course?.title || 'Unknown Course',
        completedAt: p.updatedAt // Thời điểm hoàn thành bài học
      }));

    res.json(pendingQuizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/users/student/upcoming-study-goals ─────────────────────────────
exports.getUpcomingStudyGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { Op } = require('sequelize');
    const today = new Date().toISOString().split('T')[0];

    const upcomings = await StudyGoal.findAll({
      where: {
        userId,
        date: { [Op.gte]: today },
        isCompleted: false
      },
      order: [
        ['date', 'ASC'],
        ['time', 'ASC']
      ],
      limit: 5
    });

    res.json(upcomings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/users/student/leaderboard ──────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sequelize } = require('../config/db');
    const { QueryTypes } = require('sequelize');

    // 1. Get raw leaderboard data using raw SQL to avoid Sequelize's ID injection in GROUP BY (MSSQL strictness)
    const leaderboard = await sequelize.query(`
      SELECT 
        qa.userId, 
        u.name, 
        u.avatar, 
        SUM(qa.score) AS totalPoints
      FROM QuizAttempts qa
      JOIN Users u ON qa.userId = u.id
      GROUP BY qa.userId, u.id, u.name, u.avatar
      ORDER BY totalPoints DESC
      OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY
    `, { type: QueryTypes.SELECT });

    // 2. Find the current user's rank and top 5
    const top5 = leaderboard.slice(0, 5).map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      name: item.name,
      avatar: item.avatar,
      points: parseInt(item.totalPoints)
    }));

    const myRankIndex = leaderboard.findIndex(item => item.userId == userId);
    let myRankLabel = '?';
    let myPoints = 0;

    if (myRankIndex !== -1) {
      const actualRank = myRankIndex + 1;
      myPoints = parseInt(leaderboard[myRankIndex].totalPoints);
      
      if (actualRank <= 5) {
        myRankLabel = actualRank.toString();
      } else if (actualRank <= 10) {
        myRankLabel = actualRank.toString();
      } else if (actualRank <= 100) {
        myRankLabel = "10+";
      } else {
        myRankLabel = "100+";
      }
    } else {
      // If not in top 100 at all
      myRankLabel = "100+";
    }

    res.json({
      top5,
      myRank: {
        rank: myRankLabel,
        points: myPoints
      }
    });
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
