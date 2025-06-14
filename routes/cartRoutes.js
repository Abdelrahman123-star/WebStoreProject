const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { ensureAuthenticated } = require('../middleware/auth');
const Setting = require('../models/Setting'); // Import the Setting model
const orderController = require('../controllers/orderController'); // Import the new order controller

// Public route - View cart page
router.get('/', (req, res) => {
    console.log('GET /myCart - Accessing cart page');
    // If user is not logged in, show empty cart with login message
    if (!req.session.user) {
        console.log('User not logged in, showing empty cart');
        return res.render('cart/cart', {
            user: null,
            cart: { items: [], totalAmount: 0, totalItems: 0 },
            message: 'Please login to view your cart'
        });
    }
    // If user is logged in, show their cart
    console.log('User logged in, showing cart contents');
    cartController.getCart(req, res);
});

// Protected routes - Require authentication
router.use(ensureAuthenticated);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update item quantity
router.put('/update/:productId', cartController.updateQuantity);

// Remove item from cart
router.delete('/remove/:productId', cartController.removeFromCart);

// Clear entire cart
router.delete('/clear', cartController.clearCart);

// Payment page route
router.get('/payment', async (req, res) => {
    console.log('GET /myCart/payment - Accessing payment page');
    console.log('Session user:', req.session.user ? 'Logged in' : 'Not logged in');
    console.log('Session cart:', req.session.cart ? 'Exists' : 'Does not exist');
    
    try {
        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            console.log('Initializing empty cart');
            req.session.cart = {
                items: [],
                totalAmount: 0,
                totalItems: 0
            };
        }

        // Fetch store settings for shipping costs
        const settings = await Setting.findOne({ key: 'store_settings' });
        const defaultShippingCost = settings ? settings.defaultShippingCost : 0;
        const freeShippingThreshold = settings ? settings.freeShippingThreshold : 0;

        // Check if cart is empty
        if (!req.session.cart.items || req.session.cart.items.length === 0) {
            console.log('Cart is empty, redirecting to cart page');
            req.flash('error', 'Your cart is empty');
            return res.redirect('/myCart');
        }

        console.log('Cart contents:', {
            itemsCount: req.session.cart.items.length,
            totalAmount: req.session.cart.totalAmount
        });

        // Render the payment page with cart data and shipping settings
        console.log('Rendering payment page');
        res.render('cart/payment', {
            user: req.session.user,
            cart: req.session.cart,
            title: 'Payment',
            defaultShippingCost, // Pass to view
            freeShippingThreshold // Pass to view
        });
    } catch (error) {
        console.error('Payment page error:', error);
        console.error('Error stack:', error.stack);
        req.flash('error', 'An error occurred while loading the payment page');
        res.redirect('/myCart');
    }
});

// Process payment routes
router.post('/process-payment', ensureAuthenticated, (req, res) => {
    console.log('POST /myCart/process-payment - Processing card payment');
    // Pass control to orderController to create the order
    orderController.createOrder(req, res, 'Credit Card');
});

router.post('/process-cash-payment', ensureAuthenticated, (req, res) => {
    console.log('POST /myCart/process-cash-payment - Processing cash payment');
    // Pass control to orderController to create the order
    orderController.createOrder(req, res, 'Cash on Delivery');
});

module.exports = router; 