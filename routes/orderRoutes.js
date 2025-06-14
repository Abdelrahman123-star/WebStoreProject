const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { ensureAuthenticated } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// Order confirmation page
router.get('/confirmation/:orderId', ensureAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            req.flash('error', 'Order not found.');
            return res.redirect('/myCart');
        }
        res.render('order/confirmation', { order });
    } catch (error) {
        console.error('Error fetching order:', error);
        req.flash('error', 'Failed to load order details.');
        res.redirect('/myCart');
    }
});

// My Orders page
router.get('/myOrders', ensureAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.session.user.id })
            .sort({ orderDate: -1 });
        res.render('order/myOrders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        req.flash('error', 'Failed to load your orders.');
        res.redirect('/');
    }
});

router.get('/api/user-orders', orderController.getUserOrders);

module.exports = router;