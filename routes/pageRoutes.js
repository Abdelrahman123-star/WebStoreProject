const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.get('/', pageController.showHome);
router.get('/contact', pageController.showContact);
router.get('/about', pageController.showAbout);
router.get('/category', pageController.showCategory);
router.get('/cart', pageController.showCart);

module.exports = router;