const express = require('express');
const router = express.Router();
const { Quiz, Question, QuizAttempt, Lesson, Chapter, Course } = require('../models');
const { protect, instructor } = require('../middleware/authMiddleware');

// @desc    Get quiz for a lesson
// @route   GET /api/quizzes/lesson/:lessonId
// @access  Private (Enrolled students/Instructors)
router.get('/lesson/:lessonId', protect, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({
            where: { lessonId: req.params.lessonId },
            include: [{ model: Question, as: 'questions' }]
        });

        if (!quiz) {
            return res.status(404).json({ message: 'Không tìm thấy bài kiểm tra cho bài học này' });
        }

        // TODO: Check enrollment if student is requesting

        res.json(quiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create or Update quiz for a lesson
// @route   POST /api/quizzes
// @access  Private (Instructor)
router.post('/', protect, instructor, async (req, res) => {
    const { lessonId, passingScore, questions } = req.body;
    try {
        // Verify ownership
        const lesson = await Lesson.findByPk(lessonId, {
            include: [{ model: Chapter, include: [{ model: Course }] }]
        });

        // Find course instructor (adjust depending on include structure)
        const chapter = await Chapter.findByPk(lesson.chapterId, {
            include: [{ model: Course, as: 'Course' }] // Check alias if needed
        });

        // More direct check later if structure is complex

        let quiz = await Quiz.findOne({ where: { lessonId } });

        if (quiz) {
            await quiz.update({ passingScore });
            // Delete old questions and add new ones (simple sync)
            await Question.destroy({ where: { quizId: quiz.id } });
        } else {
            quiz = await Quiz.create({ lessonId, passingScore });
        }

        if (questions && questions.length > 0) {
            const questionsWithQuizId = questions.map(q => ({ ...q, quizId: quiz.id }));
            await Question.bulkCreate(questionsWithQuizId);
        }

        const finalQuiz = await Quiz.findByPk(quiz.id, {
            include: [{ model: Question, as: 'questions' }]
        });

        res.status(201).json(finalQuiz);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Submit quiz attempt
// @route   POST /api/quizzes/:quizId/submit
// @access  Private (Enrolled students)
router.post('/:quizId/submit', protect, async (req, res) => {
    const { answers } = req.body; // Array of selected indices
    try {
        const quiz = await Quiz.findByPk(req.params.quizId, {
            include: [{ model: Question, as: 'questions' }]
        });

        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        let correctCount = 0;
        quiz.questions.forEach((q, index) => {
            if (answers[index] === q.correctOptionIndex) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / quiz.questions.length) * 100);
        const status = score >= quiz.passingScore ? 'passed' : 'failed';

        const attempt = await QuizAttempt.create({
            quizId: quiz.id,
            userId: req.user.id,
            score,
            status,
            userAnswers: answers // Saved via setter
        });

        res.json(attempt);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all lesson IDs passed by user for a specific course
// @route   GET /api/quizzes/course/:courseId/passed-lessons
// @access  Private
router.get('/course/:courseId/passed-lessons', protect, async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user.id;

        // 1. Get all lesson IDs for this course
        const lessons = await Lesson.findAll({
            include: [{
                model: Chapter,
                required: true,
                where: { courseId }
            }]
        });
        const lessonIds = lessons.map(l => l.id);

        if (lessonIds.length === 0) {
            return res.json([]);
        }

        // 2. Find passed attempts for these lessons
        const passedAttempts = await QuizAttempt.findAll({
            where: { 
                userId, 
                status: 'passed' 
            },
            include: [{
                model: Quiz,
                required: true,
                where: { lessonId: lessonIds }
            }]
        });

        const passedLessonIds = passedAttempts.map(attempt => attempt.Quiz.lessonId);

        res.json([...new Set(passedLessonIds)]);
    } catch (error) {
        console.error("Error in GET /passed-lessons:", error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get latest attempt for a lesson
// @route   GET /api/quizzes/lesson/:lessonId/latest-attempt
// @access  Private
router.get('/lesson/:lessonId/latest-attempt', protect, async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;

        const quiz = await Quiz.findOne({ where: { lessonId } });
        if (!quiz) return res.json(null);

        const latestAttempt = await QuizAttempt.findOne({
            where: { quizId: quiz.id, userId },
            order: [['createdAt', 'DESC']]
        });

        res.json(latestAttempt);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
