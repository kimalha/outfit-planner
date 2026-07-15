const express = require('express');
const router = express.Router();
const {
    getCategories,
    addCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

router.route('/')
    .get(getCategories)
    .post(addCategory);

router.route('/:id')
    .put(updateCategory)
    .delete(deleteCategory);

module.exports = router;
