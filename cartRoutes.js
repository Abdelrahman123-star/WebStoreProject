const express = require('express');
const router = express.Router();
const Cart = require('../../models/Cart');
const { ensureAuthenticated, ensureAdmin } = require('../../middleware/auth');
const cartController = require('../../controllers/admin/cartController');

// Apply authentication and admin middleware to all routes
router.use(ensureAuthenticated, ensureAdmin);

// Get all carts (for admin review)
router.get('/', cartController.getAllCarts);

// Get details of a specific cart
router.get('/:cartId', cartController.getCartDetails);

// Delete a cart
router.delete('/:cartId', cartController.deleteCart);

module.exports = router; 