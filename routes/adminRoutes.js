const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/auth');

router.get('/dashboard', ensureAdmin, (req, res) => {
  adminController.showDashboard(req,res,'dashboard');
});

router.get('/products', ensureAdmin, (req, res) => {
  adminController.showProducts(req, res, 'products');
});

router.get('/orders', ensureAdmin, (req, res) => {
  adminController.showOrders(req, res, 'orders');
});

router.get('/users', ensureAdmin, (req, res) => {
  adminController.showUsers(req, res, 'users');
});
router.post('/users', ensureAdmin, (req, res) => {
  adminController.editUser(req, res, 'users');
});
router.post('/users/delete', ensureAdmin, adminController.deleteUser);

router.get('/settings', ensureAdmin, (req, res) => {
  adminController.showSettings(req, res, 'settings');
});

module.exports = router;