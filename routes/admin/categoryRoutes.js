const express = require('express');
const router = express.Router();
const Category = require('../../models/category'); // Changed to lowercase 'c' for consistency
const { ensureAuthenticated, ensureAdmin } = require('../../middleware/auth');
const upload = require('../../middleware/upload'); // Assuming you use multer for image uploads

// Apply authentication and admin middleware to all routes
router.use(ensureAuthenticated, ensureAdmin);

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('admin/categories', {
            categories,
            title: 'Categories Management'
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        req.flash('error', 'Failed to fetch categories');
        res.redirect('/admin/dashboard');
    }
});

// Create a new category
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // Adjust path as per your upload config

        const newCategory = new Category({
            name,
            description,
            imageUrl
        });

        await newCategory.save();
        req.flash('success', 'Category created successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error creating category:', error);
        req.flash('error', 'Failed to create category');
        res.redirect('/admin/categories');
    }
});

// Update category
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const updateData = { name, description };

        if (req.file) {
            updateData.imageUrl = `/uploads/${req.file.filename}`;
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

module.exports = router; 