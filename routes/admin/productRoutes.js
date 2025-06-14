const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const { ensureAuthenticated, ensureAdmin } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Apply authentication and admin middleware to all routes
router.use(ensureAuthenticated, ensureAdmin);

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('admin/products', {
            products,
            title: 'Products Management'
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        req.flash('error', 'Failed to fetch products');
        res.redirect('/admin/dashboard');
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product details' });
    }
});

// Create product
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, stock, category, discount } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const product = new Product({
            name,
            description,
            price,
            stock,
            category,
            discount: discount || 0,
            imagePath
        });

        await product.save();
        req.flash('success', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error', 'Failed to create product');
        res.redirect('/admin/products');
    }
});

// Update product
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, stock, category, discount } = req.body;
        const updateData = {
            name,
            description,
            price,
            stock,
            category,
            discount: discount || 0
        };

        if (req.file) {
            updateData.imagePath = `/uploads/${req.file.filename}`;
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ success: true, message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router; 