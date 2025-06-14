const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Discount = require('../models/discount');
const Setting = require('../models/Setting');

// Get user's cart
exports.getCart = async (req, res) => {
    try {
        // Initialize session cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = { items: [], totalAmount: 0, totalItems: 0 };
        }

        if (!req.session?.user?.id) {
            return res.render('cart/cart', {
                activePage: 'carts',

                user: null,
                cart: { items: [], totalAmount: 0, totalItems: 0 },
                message: 'Please login to view your cart',
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                }
            });
        }

        
        const cart = await Cart.findOne({ user: req.session.user.id })
            .populate({
                path: 'items.product',
                select: 'name price imageUrl imagePath stock category'
            });

        // Fetch store settings
        const settings = await Setting.findOne({ key: 'store_settings' });
        const defaultShippingCost = settings ? settings.defaultShippingCost : 0; // Default to 0 if settings not found
        const freeShippingThreshold = settings ? settings.freeShippingThreshold : 0; // Default to 0 if settings not found

        if (!cart) {
            // Store empty cart in session
            req.session.cart = { items: [], totalAmount: 0, totalItems: 0 };
            return res.render('cart/cart', {
                activePage: 'carts',
                user: req.session.user,
                cart: { items: [], totalAmount: 0, totalItems: 0 },
                message: null,
                messages: {
                    success: req.flash('success'),
                    error: req.flash('error')
                },
                defaultShippingCost, // Pass to view
                freeShippingThreshold // Pass to view
            });
        }


        // Calculate current prices including any active discounts
        const now = new Date();
        const activeDiscounts = await Discount.find({
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now }
        });
        let updatedItems = await Promise.all(cart.items.map(async (item) => {
            const product = item.product;
            if (!product) {
                console.error('Product not found for item:', item);
                return null;
            }


            let discountedPrice = product.price;
            let discountPercentage = 0;

            for (const discount of activeDiscounts) {
                const isProductInDiscount = discount.products.some(pId => pId.toString() === product.id.toString());
                const isCategoryInDiscount = product.category && discount.categories.some(cId => cId.toString() === product.category._id.toString());


                if ((discount.products.length === 0 && discount.categories.length === 0) || isProductInDiscount || isCategoryInDiscount) {
                    const potentialDiscountedPrice = discount.calculateDiscountedPrice(product.price);
                    if (potentialDiscountedPrice < discountedPrice) {
                        discountedPrice = potentialDiscountedPrice;
                        if (discount.type === 'percentage') {
                            discountPercentage = discount.value;
                        } else {
                            discountPercentage = ((product.price - discountedPrice) / product.price) * 100;
                        }
                    }
                }
            }

            return {
                ...item.toObject(),
                product: {
                    ...product.toObject(),
                    id: product.id // Ensure id is available
                },
                currentPrice: discountedPrice,
                discountPercentage: discountPercentage.toFixed(0),
                originalPrice: product.price // Ensure original price is passed
            };
        }));

        

        // Filter out any null items (products that no longer exist)
        updatedItems = updatedItems.filter(item => item !== null);

        // Calculate new totals
        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        // Store cart data in session
        req.session.cart = {
            items: updatedItems,
            totalItems,
            totalAmount: totalAmount.toFixed(2)
        };



        res.render('cart/cart', {
            activePage: 'carts',
            user: req.session.user,
            cart: {
                items: updatedItems,
                totalAmount: totalAmount.toFixed(2),
                totalItems
            },
            message: null,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            },
            defaultShippingCost, // Pass to view
            freeShippingThreshold // Pass to view
        });
    } catch (error) {
        console.error('Error in getCart:', error);
        res.status(500).render('error', {
            activePage: 'carts',

            message: 'Failed to load cart',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    }
};

// Add item to cart
exports.addToCart = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.session?.user?.id) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(401).json({ 
                    error: 'Please login to add items to cart',
                    redirect: '/login'
                });
            }
            req.flash('error', 'Please login to add items to cart');
            return res.redirect('/login');
        }

        const { productId } = req.body;
        const quantity = req.body.quantity || 1; // Default to 1 if not specified
        const userId = req.session.user.id;

        // Validate input
        if (!productId) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({ error: 'Product ID is required' });
            }
            req.flash('error', 'Product ID is required');
            return res.redirect('back');
        }

        if (quantity < 1) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({ error: 'Quantity must be at least 1' });
            }
            req.flash('error', 'Quantity must be at least 1');
            return res.redirect('back');
        }

        // Validate product exists and has sufficient stock
        const product = await Product.findById(productId);
        if (!product) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(404).json({ error: 'Product not found' });
            }
            req.flash('error', 'Product not found');
            return res.redirect('back');
        }

        if (product.stock < quantity) {
            if (req.xhr || req.headers.accept.includes('application/json')) {
                return res.status(400).json({ 
                    error: `Insufficient stock. Only ${product.stock} available.`
                });
            }
            req.flash('error', `Insufficient stock. Only ${product.stock} available.`);
            return res.redirect('back');
        }

        // Get or create cart
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Check if product already in cart
        const existingItem = cart.items.find(item => item.product.toString() === productId);
        if (existingItem) {
            // Update quantity if product exists
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stock) {
                if (req.xhr || req.headers.accept.includes('application/json')) {
                    return res.status(400).json({ 
                        error: `Cannot add more. Only ${product.stock} available.`
                    });
                }
                req.flash('error', `Cannot add more. Only ${product.stock} available.`);
                return res.redirect('back');
            }
            existingItem.quantity = newQuantity;
        } else {
            // Add new item
            cart.items.push({
                product: productId,
                quantity,
                price: product.price
            });
        }

        // Calculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();

        // Update session cart data
        req.session.cart = {
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount.toFixed(2)
        };

        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.json({
                success: true,
                message: `${quantity} item(s) of ${product.name} added to your cart!`,
                cart: {
                    totalItems: cart.totalItems,
                    totalAmount: cart.totalAmount.toFixed(2)
                }
            });
        }

        req.flash('success', `${quantity} item(s) of ${product.name} added to your cart!`);
        res.redirect('back');

    } catch (error) {
        console.error('Error adding to cart:', error);
        if (req.xhr || req.headers.accept.includes('application/json')) {
            return res.status(500).json({ 
                error: error.message || 'Failed to add item to cart'
            });
        }
        req.flash('error', error.message || 'Failed to add item to cart');
        res.redirect('back');
    }
};

// Update cart item quantity
exports.updateQuantity = async (req, res) => {
    try {
        if (!req.session?.user?.id) {
            req.flash('error', 'Please login to update cart');
            return res.status(401).json({ 
                error: 'Please login to update cart',
                redirect: '/login'
            });
        }

        const { productId } = req.params;
        const { change } = req.body;
        const userId = req.session.user.id;

        // Get cart
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            req.flash('error', 'Cart not found');
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find item
        const item = cart.items.find(item => item.product.toString() === productId);
        if (!item) {
            req.flash('error', 'Item not found in cart');
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        // Calculate new quantity
        const newQuantity = item.quantity + change;
        if (newQuantity < 1) {
            req.flash('error', 'Quantity cannot be less than 1');
            return res.status(400).json({ error: 'Quantity cannot be less than 1' });
        }

        // Check product stock
        const product = await Product.findById(productId);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.status(404).json({ error: 'Product not found' });
        }

        if (product.stock < newQuantity) {
            req.flash('error', 'Insufficient stock');
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Update quantity
        item.quantity = newQuantity;

        // Recalculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();

        req.flash('success', 'Cart updated successfully');
        res.json({
            success: true,
            message: 'Cart updated',
            cart: {
                totalItems: cart.totalItems,
                totalAmount: cart.totalAmount
            }
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        req.flash('error', 'Failed to update cart');
        res.status(500).json({ error: 'Failed to update cart' });
    }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
    try {
        if (!req.session?.user?.id) {
            req.flash('error', 'Please login to remove items');
            return res.status(401).json({ 
                error: 'Please login to remove items',
                redirect: '/login'
            });
        }

        const { productId } = req.params;
        const userId = req.session.user.id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            req.flash('error', 'Cart not found');
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Remove item
        cart.items = cart.items.filter(item => item.product.toString() !== productId);

        // Recalculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        await cart.save();

        req.flash('success', 'Item removed from cart');
        res.json({
            success: true,
            message: 'Item removed from cart',
            cart: {
                totalItems: cart.totalItems,
                totalAmount: cart.totalAmount
            }
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        req.flash('error', 'Failed to remove item from cart');
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
};

// Clear cart
exports.clearCart = async (req, res) => {
    try {
        if (!req.session?.user?.id) {
            req.flash('error', 'Please login to clear cart');
            return res.status(401).json({ 
                error: 'Please login to clear cart',
                redirect: '/login'
            });
        }

        const userId = req.session.user.id;

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            req.flash('error', 'Cart not found');
            return res.status(404).json({ error: 'Cart not found' });
        }

        cart.items = [];
        cart.totalItems = 0;
        cart.totalAmount = 0;

        await cart.save();

        req.flash('success', 'Cart cleared successfully');
        res.json({
            success: true,
            message: 'Cart cleared',
            cart: {
                totalItems: 0,
                totalAmount: 0
            }
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        req.flash('error', 'Failed to clear cart');
        res.status(500).json({ error: 'Failed to clear cart' });
    }
}; 