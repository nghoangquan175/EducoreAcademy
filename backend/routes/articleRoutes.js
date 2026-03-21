const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { protect, instructor, optionalProtect } = require('../middleware/authMiddleware');

// Public routes
router.get('/', articleController.getArticles);
router.get('/trash', protect, articleController.getTrashArticles);
router.get('/:id', optionalProtect, articleController.getArticleById);

// Instructor routes (also allows admin)
router.get('/instructor/my-articles', protect, instructor, articleController.getMyArticles);
router.post('/instructor', protect, instructor, articleController.createArticle);
router.put('/instructor/:id', protect, instructor, articleController.updateArticle);
router.delete('/instructor/:id', protect, instructor, articleController.deleteArticle);
router.patch('/instructor/:id/submit', protect, instructor, articleController.submitArticleForReview);

// Student routes
router.get('/student/pro-status', protect, articleController.checkStudentProStatus);
router.get('/student/my-articles', protect, articleController.getMyArticles);
router.post('/student', protect, articleController.createArticle);
router.put('/student/:id', protect, articleController.updateArticle);
router.delete('/student/:id', protect, articleController.deleteArticleStudent);
router.patch('/student/:id/submit', protect, articleController.submitArticleForReview);
router.patch('/student/:id/undo-submit', protect, articleController.undoSubmitArticleStudent);

// Trash bin routes
router.put('/:id/restore', protect, articleController.restoreArticle);
router.delete('/:id/force', protect, articleController.forceDeleteArticle);

module.exports = router;
