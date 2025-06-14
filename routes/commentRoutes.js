const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { ensureAdmin } = require('../middleware/auth');

// Admin routes
router.get('/admin/comments', ensureAdmin, commentController.getAllComments);
router.put('/api/comments/:commentId/status', ensureAdmin, commentController.updateCommentStatus);
router.delete('/api/comments/:id', ensureAdmin, commentController.deleteComment);

// User routes
router.post('/api/comments', commentController.addComment);

module.exports = router; 