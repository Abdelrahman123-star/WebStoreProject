const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/upload');
const { ensureAdmin } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/category');
const Discount = require('../models/discount');

// Public routes
router.get('/detail/:id', productController.getProductDetails);

// Admin routes
router.get('/admin', ensureAdmin, productController.getAllProducts);
router.get('/:id', ensureAdmin, productController.getProductById);
router.post('/create', 
  ensureAdmin,
  upload.single('productImage'),
  productController.createProduct
);
router.post('/:id', 
  ensureAdmin,
  upload.single('productImage'),
  productController.updateProduct
);
router.delete('/:id', ensureAdmin, productController.deleteProduct);

// Get all products (no category filter)
router.get('/', async (req, res) => {
    try {
        const filter = req.query.filter || 'all';
        const sort = req.query.sort || 'newest';
        const rating = parseFloat(req.query.rating) || 0;
        
        // Find products
        let products = await Product.find()
            .populate('category', 'name description')
            .sort({ createdAt: -1 });

        // Get active discounts
        const activeDiscounts = await Discount.find();

        // Apply discounts to products
        let productsWithDiscounts = await Promise.all(products.map(async (product) => {
            let bestDiscount = null;
            let discountedPrice = product.price;
            let discountPercentage = 0;

            for (const discount of activeDiscounts) {
                const isProductInDiscount = discount.products.some(pId => pId.toString() === product._id.toString());
                const isCategoryInDiscount = product.category && discount.categories.some(cId => cId.toString() === product.category._id.toString());

                if ((discount.products.length === 0 && discount.categories.length === 0) || isProductInDiscount || isCategoryInDiscount) {
                    const potentialDiscountedPrice = discount.calculateDiscountedPrice(product.price);

                    if (potentialDiscountedPrice < discountedPrice) {
                        bestDiscount = discount;
                        discountedPrice = potentialDiscountedPrice;

                        if (bestDiscount.type === 'percentage') {
                            discountPercentage = bestDiscount.value;
                        } else {
                            discountPercentage = ((product.price - discountedPrice) / product.price) * 100;
                        }
                    }
                }
            }
            
            return {
                ...product.toObject(),
                originalPrice: product.price,
                discountedPrice: parseFloat(discountedPrice.toFixed(2)),
                discountPercentage: discountPercentage.toFixed(0),
                hasDiscount: bestDiscount !== null
            };
        }));

        // Apply filter
        if (filter === 'on-sale') {
            productsWithDiscounts = productsWithDiscounts.filter(p => p.hasDiscount);
        }

        // Apply rating filter
        if (rating > 0) {
            productsWithDiscounts = productsWithDiscounts.filter(p => p.rating >= rating);
        }

        // Apply sort
        switch(sort) {
            case 'price-low':
                productsWithDiscounts.sort((a, b) => a.discountedPrice - b.discountedPrice);
                break;
            case 'price-high':
                productsWithDiscounts.sort((a, b) => b.discountedPrice - a.discountedPrice);
                break;
            case 'rating':
                productsWithDiscounts.sort((a, b) => b.rating - a.rating);
                break;
            default: // newest
                productsWithDiscounts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.render('products/products', {
            products: productsWithDiscounts,
            category: null,
            user: req.session.user || null,
            currentFilter: filter,
            currentSort: sort,
            currentRating: rating || ''
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).render('error', {
            message: 'Failed to load products',
            user: req.session.user || null
        });
    }
});

module.exports = router;