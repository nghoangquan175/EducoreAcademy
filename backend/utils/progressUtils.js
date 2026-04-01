const { Op } = require('sequelize');

/**
 * Calculates course progress for a user
 * @param {object} models - Object containing Sequelize models (Lesson, Chapter, Quiz, QuizAttempt, Progress, Enrollment)
 * @param {number} userId - ID of the student
 * @param {number} courseId - ID of the course
 * @returns {Promise<object>} Progress stats and eligibility flags
 */
const calculateCourseProgress = async (models, userId, courseId) => {
  const { Lesson, Chapter, Quiz, QuizAttempt, Progress, Enrollment } = models;

  // 1. Get all lessons in course
  const lessons = await Lesson.findAll({
    attributes: ['id'],
    include: [{
      model: Chapter,
      as: 'Chapter', // Note: Check alias in models/index.js if needed. Usually it's the model name.
      where: { courseId },
      required: true,
      attributes: []
    }]
  });
  const totalLessons = lessons.length;
  const lessonIds = lessons.map(l => l.id);

  // 2. Get enrollment
  const enrollment = await Enrollment.findOne({
    where: { userId, courseId }
  });
  if (!enrollment) return null;

  // 3. Count watched lessons (at least once watched)
  const watchedCount = await Progress.count({
    where: {
      enrollmentId: enrollment.id,
      videoWatched: true,
      lessonId: { [Op.in]: lessonIds }
    }
  });

  // 4. Get all quizzes for these lessons
  const quizzes = await Quiz.findAll({
    where: { lessonId: { [Op.in]: lessonIds } },
    attributes: ['id']
  });
  const totalQuizzes = quizzes.length;
  const quizIds = quizzes.map(q => q.id);

  // 5. Count passed quizzes (unique quizId where status is 'passed')
  let passedQuizzesCount = 0;
  if (totalQuizzes > 0) {
    passedQuizzesCount = await QuizAttempt.count({
      distinct: true,
      col: 'quizId',
      where: {
        userId,
        quizId: { [Op.in]: quizIds },
        status: 'passed'
      }
    });
  }

  // 6. Logic: 100% Video + 65% Passed Quizzes
  // Round up: Math.ceil(totalQuizzes * 0.65)
  const requiredQuizzes = Math.ceil(totalQuizzes * 0.65);
  const isQuizzesEligible = totalQuizzes === 0 || passedQuizzesCount >= requiredQuizzes;
  const isVideosEligible = totalLessons > 0 && watchedCount === totalLessons;

  const isEligibleForCompletion = isVideosEligible && isQuizzesEligible;

  return {
    totalLessons,
    watchedCount,
    totalQuizzes,
    passedQuizzesCount,
    requiredQuizzes,
    isEligibleForCompletion,
    isCompleted: enrollment.status === 'completed',
    progressPercent: totalLessons > 0 ? Math.round((watchedCount / totalLessons) * 100) : 0
  };
};

module.exports = { calculateCourseProgress };
