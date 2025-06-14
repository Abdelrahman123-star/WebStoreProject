const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/orderController');
const { ensureAuthenticated, ensureAdmin } = require('../../middleware/auth');

// Apply authentication and admin middleware to all routes
router.use(ensureAuthenticated, ensureAdmin);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get single order details
router.get('/:orderId', orderController.getOrderDetails);

// Update order status
router.put('/:orderId/status', orderController.updateOrderStatus);

module.exports = router; 