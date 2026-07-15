const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const {
    getPosts,
    createPost,
    deletePost,
    toggleLike,
    toggleSave,
    addComment,
    deleteComment
} = require('../controllers/postController');

router.use(verifyToken);

router.route('/')
    .get(getPosts)
    .post(createPost);

router.route('/:id')
    .delete(deletePost);

router.post('/:id/like', toggleLike);
router.post('/:id/save', toggleSave);

router.post('/:id/comments', addComment);
router.delete('/:id/comments/:commentId', deleteComment);

module.exports = router;
