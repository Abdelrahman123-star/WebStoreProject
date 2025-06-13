const express = require('express');
const router = express.Router();
const AdminCategoryController = require('../controllers/AdminCategoryController');
const upload = require('../middleware/upload');
const { ensureAdmin } = require('../middleware/auth');

// Category management routes
router.get('/', ensureAdmin, AdminCategoryController.listCategories);
router.post('/create', ensureAdmin, upload.single('categoryImage'), AdminCategoryController.createCategory);
router.get('/edit/:id', ensureAdmin, AdminCategoryController.editCategoryForm);
router.post('/update/:id', ensureAdmin, upload.single('categoryImage'), AdminCategoryController.updateCategory);
router.delete('/delete/:id', ensureAdmin, AdminCategoryController.deleteCategory);

module.exports = router;