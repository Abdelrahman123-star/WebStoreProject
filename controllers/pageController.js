const Product = require('../models/Product');
const Category = require('../models/category');
const Discount = require('../models/discount');

exports.showHome = async (req, res) => {
    try {
        const [products, categories] = await Promise.all([
            Product.find()
                .sort({ createdAt: -1 })
                .limit(5),
            Category.find()
                .sort({ name: 1 }) // Sort categories alphabetically
        ]);

        const activeDiscounts = await Discount.find();

        const featuredProductsWithDiscounts = await Promise.all(products.map(async (product) => {
            let bestDiscount = null;
            let discountedPrice = product.price;
            let discountPercentage = 0;

            for (const discount of activeDiscounts) {
                const isProductInDiscount = discount.products.some(pId => pId.toString() === product._id.toString());
                const isCategoryInDiscount = product.category && discount.categories.some(cId => cId.toString() === product.category.toString());

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

        res.render('pages/home', {
            featuredProducts: featuredProductsWithDiscounts,
            categories,
            user: req.session.user || null,
            searchTerm: req.query.term || '',
            selectedCategory: req.query.category || 'all',
            minPrice: req.query.minPrice || '',
            maxPrice: req.query.maxPrice || ''
        });
    } catch (error) {
        console.error('Error fetching home page data:', error);
        res.render('pages/home', {
            error: 'Failed to load products',
            featuredProducts: [],
            categories: [],
            user: req.session.user || null,
            searchTerm: req.query.term || '',
            selectedCategory: req.query.category || 'all',
            minPrice: req.query.minPrice || '',
            maxPrice: req.query.maxPrice || ''
        });
    }
};

exports.showAdmin = (req, res) => {
    res.render('admin/dashboard');
};

exports.showContact = (req, res) => {
    res.render('pages/contact');
};

exports.showAbout = (req, res) => {
    res.render('pages/about');
};

exports.showCategory = async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        
        // Get product counts for each category
        const categoriesWithCounts = await Promise.all(categories.map(async (category) => {
            const productCount = await Product.countDocuments({ category: category._id });
            return {
                ...category.toObject(),
                productCount
            };
        }));

        res.render('products/category', {
            categories: categoriesWithCounts,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.render('products/category', {
            error: 'Failed to load categories',
            categories: [],
            user: req.session.user || null
        });
    }
};

exports.showProductsByCategory = async (req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.categorySlug });
        if (!category) {
            return res.status(404).render('error', {
                message: 'Category not found',
                user: req.session.user || null
            });
        }

        const filter = req.query.filter || 'all';
        const sort = req.query.sort || 'newest';
        const rating = parseFloat(req.query.rating) || 0;

        let products = await Product.find({ category: category._id })
            .populate('category', 'name description')
            .sort({ createdAt: -1 });

        const activeDiscounts = await Discount.find();

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
            category,
            products: productsWithDiscounts,
            user: req.session.user || null,
            currentFilter: filter,
            currentSort: sort,
            currentRating: rating || ''
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).render('error', {
            message: 'Failed to load products',
            user: req.session.user || null
        });
    }
};

exports.showCart = async (req, res) => {
    try {
        // Redirect to cart controller's getCart function
        res.redirect('/cart');
    } catch (error) {
        console.error('Error showing cart:', error);
        res.status(500).render('error', {
            message: 'Failed to load cart',
            user: req.session.user || null
        });
    }
};