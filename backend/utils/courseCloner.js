const { Course, Chapter, Lesson, Quiz, Question } = require('../models');

/**
 * Deep clones a course including all its components.
 * @param {number} courseId - The ID of the course to clone.
 * @returns {Promise<Course>} - The newly created course version.
 */
async function cloneCourse(courseId) {
  const originalCourse = await Course.findByPk(courseId, {
    include: [
      {
        model: Chapter,
        as: 'chapters',
        include: [
          {
            model: Lesson,
            as: 'lessons',
            include: [{ model: Quiz, as: 'quiz', include: [{ model: Question, as: 'questions' }] }]
          }
        ]
      }
    ]
  });

  if (!originalCourse) throw new Error('Course not found');

  // 1. Clone Course
  const newCourseData = originalCourse.toJSON();
  delete newCourseData.id;
  delete newCourseData.createdAt;
  delete newCourseData.updatedAt;
  delete newCourseData.deletedAt;
  delete newCourseData.studentsCount;

  const newCourse = await Course.create({
    ...newCourseData,
    version: (originalCourse.version || 1) + 1,
    rootCourseId: originalCourse.rootCourseId || originalCourse.id,
    published: 0, // Draft
    isLatest: false, // Not latest until published
  });

  // 2. Clone Chapters
  for (const chapter of originalCourse.chapters) {
    const newChapterData = chapter.toJSON();
    delete newChapterData.id;
    const newChapter = await Chapter.create({
      ...newChapterData,
      courseId: newCourse.id
    });

    // 3. Clone Lessons
    for (const lesson of chapter.lessons) {
      const newLessonData = lesson.toJSON();
      delete newLessonData.id;
      const newLesson = await Lesson.create({
        ...newLessonData,
        chapterId: newChapter.id
      });

      // 4. Clone Quiz
      if (lesson.quiz) {
        const newQuizData = lesson.quiz.toJSON();
        delete newQuizData.id;
        const newQuiz = await Quiz.create({
          ...newQuizData,
          lessonId: newLesson.id
        });

        // 5. Clone Questions
        if (lesson.quiz.questions) {
          for (const question of lesson.quiz.questions) {
            const newQuestionData = question.toJSON();
            delete newQuestionData.id;
            await Question.create({
              ...newQuestionData,
              quizId: newQuiz.id
            });
          }
        }
      }
    }
  }

  // Update stats for the new course
  await Course.updateCourseStats(newCourse.id);

  return newCourse;
}

module.exports = { cloneCourse };
