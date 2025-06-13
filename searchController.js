const Product = require('../models/Product');
const Category = require('../models/category');

exports.searchProducts = async (req, res) => {
    try {
        const { term, category, minPrice, maxPrice, filter = 'all', sort = 'newest', rating = 0 } = req.query;
        
        // Build search query
        let query = {};
        let selectedCategory = null;
        
        // Text search
        if (term) {
            query.$or = [
                { name: { $regex: term, $options: 'i' } },
                { description: { $regex: term, $options: 'i' } }
            ];
        }

        // Category filter
        if (category && category !== 'all') {
            selectedCategory = await Category.findOne({ slug: category });
            if (selectedCategory) {
                query.category = selectedCategory._id;
            }
        }

        // Price range filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Execute search
        const products = await Product.find(query)
            .populate('category', 'name')
            .sort({ createdAt: -1 });

        // Get all categories for the filter dropdown
        const categories = await Category.find().sort('name');

        // Calculate if products have discounts
        const now = new Date();
        const productsWithDiscounts = products.map(product => {
            const productObj = product.toObject();
            productObj.hasDiscount = false;
            productObj.discountedPrice = product.price;
            productObj.discountPercentage = 0;

            if (product.discounts && product.discounts.length > 0) {
                const activeDiscount = product.discounts.find(discount => 
                    discount.status === 'active' &&
                    discount.startDate <= now &&
                    discount.endDate >= now
                );

                if (activeDiscount) {
                    productObj.hasDiscount = true;
                    if (activeDiscount.type === 'percentage') {
                        productObj.discountPercentage = activeDiscount.value;
                        productObj.discountedPrice = product.price * (1 - activeDiscount.value / 100);
                    } else {
                        productObj.discountedPrice = product.price - activeDiscount.value;
                        productObj.discountPercentage = ((product.price - productObj.discountedPrice) / product.price) * 100;
                    }
                }
            }

            return productObj;
        });

        // Apply filter
        let filteredProducts = productsWithDiscounts;
        if (filter === 'on-sale') {
            filteredProducts = filteredProducts.filter(p => p.hasDiscount);
        }

        // Apply rating filter
        if (rating > 0) {
            filteredProducts = filteredProducts.filter(p => p.rating >= rating);
        }

        // Apply sort
        switch(sort) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.discountedPrice - b.discountedPrice);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.discountedPrice - a.discountedPrice);
                break;
            case 'rating':
                filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            default: // newest
                filteredProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        res.render('products/products', {
            title: 'Search Results',
            products: filteredProducts,
            categories,
            category: selectedCategory,
            searchTerm: term,
            selectedCategory: category,
            minPrice: minPrice || '',
            maxPrice: maxPrice || '',
            currentFilter: filter,
            currentSort: sort,
            currentRating: rating || '',
            user: req.session.user,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });

    } catch (error) {
        console.error('Search error:', error);
        req.flash('error', 'An error occurred while searching products');
        res.redirect('/');
    }
}; 