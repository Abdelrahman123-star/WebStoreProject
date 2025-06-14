const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Search products route
router.get('/', searchController.searchProducts);

module.exports = router; 