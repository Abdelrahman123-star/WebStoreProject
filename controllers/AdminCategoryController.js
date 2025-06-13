const Category = require('../models/category');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// List all categories
exports.listCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page - 1) * limit;
        
        const [categories, totalCategories] = await Promise.all([
            Category.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Category.countDocuments()
        ]);

        // Get product counts for each category
        const categoriesWithCounts = await Promise.all(categories.map(async (category) => {
            const productCount = await Product.countDocuments({ category: category._id });
            return {
                ...category.toObject(),
                productCount
            };
        }));

        const totalPages = Math.ceil(totalCategories / limit);

        res.render('admin/categories', {
            user: req.session.user,
            activePage: 'categories',
            pageTitle: 'Category Management',
            categories: categoriesWithCounts,
            currentPage: page,
            totalPages,
            success: req.flash('success'),
            error: req.flash('error')
        });
    } catch (err) {
        console.error('Error listing categories:', err);
        req.flash('error', 'Failed to load categories');
        res.render('admin/categories', {
            user: req.session.user,
            activePage: 'categories',
            pageTitle: 'Category Management',
            categories: [],
            currentPage: 1,
            totalPages: 1,
            success: req.flash('success'),
            error: req.flash('error')
        });
    }
};

// Create new category
exports.createCategory = async (req, res) => {
    try {
        const { categoryName, categoryDescription, imageUrl } = req.body;
        
        if (!categoryName) {
            req.flash('error', 'Category name is required');
            return res.redirect('/admin/categories');
        }

        const categoryData = {
            user: req.session.user,
            name: categoryName,
            description: categoryDescription || ''
        };

        // Handle image upload or URL
        if (req.file) {
            categoryData.imagePath = '/uploads/' + req.file.filename;
        } else if (imageUrl) {
            categoryData.imageUrl = imageUrl;
        }

        const newCategory = new Category(categoryData);
        await newCategory.save();

        req.flash('success', 'Category created successfully');
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Error creating category:', err);
        if (err.code === 11000) {
            req.flash('error', 'Category name already exists');
        } else {
            req.flash('error', 'Failed to create category');
        }
        res.redirect('/admin/categories');
    }
};

// Edit category form
exports.editCategoryForm = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json({
            user: req.session.user,

            name: category.name,
            description: category.description,
            imageUrl: category.imageUrl,
            imagePath: category.imagePath
        });
    } catch (err) {
        console.error('Error loading category:', err);
        res.status(500).json({ error: 'Failed to load category' });
    }
};

// Update category
exports.updateCategory = async (req, res) => {
    try {
        const { categoryName, categoryDescription, imageUrl } = req.body;
        const categoryId = req.params.id;

        if (!categoryName) {
            req.flash('error', 'Category name is required');
            return res.redirect(`/admin/categories/edit/${categoryId}`);
        }

        const updateData = {
            name: categoryName,
            description: categoryDescription || ''
        };

        // Handle image update
        if (req.file) {
            updateData.imagePath = '/uploads/' + req.file.filename;
            updateData.imageUrl = '';
        } else if (imageUrl) {
            updateData.imageUrl = imageUrl;
            updateData.imagePath = '';
        }

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/categories');
        }

        req.flash('success', 'Category updated successfully');
        res.redirect('/admin/categories');
    } catch (err) {
        console.error('Error updating category:', err);
        if (err.code === 11000) {
            req.flash('error', 'Category name already exists');
        } else {
            req.flash('error', 'Failed to update category');
        }
        res.redirect(`/admin/categories/edit/${req.params.id}`);
    }
};

// Delete category
exports.deleteCategory = async (req, res) => {
    try {
        // First check if category exists
        const category = await Category.findById(req.params.id);
        
        if (!category) {
            console.log('Category not found with ID:', req.params.id);
            return res.status(404).json({ 
                success: false,
                error: 'Category not found' 
            });
        }

        // Check if category has associated products
        const productsCount = await Product.countDocuments({ category: req.params.id });
        if (productsCount > 0) {
            console.log('Cannot delete category with associated products:', productsCount);
            return res.status(400).json({ 
                success: false,
                error: `Cannot delete category. There are ${productsCount} product(s) in this category. Please remove or reassign these products first.` 
            });
        }

        // Delete associated image file if exists
        if (category.imagePath) {
            const filePath = path.join(__dirname, '../public', category.imagePath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete the category
        await Category.findByIdAndDelete(req.params.id);
        
        // Send success response
        return res.status(200).json({ 
            success: true, 
            message: 'Category deleted successfully' 
        });
    } catch (err) {
        console.error('Error deleting category:', err);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to delete category: ' + err.message 
        });
    }
};