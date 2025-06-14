const Cart = require('../../models/Cart');
const User = require('../../models/User');
const mongoose = require('mongoose');
const Discount = require('../../models/discount');

// Get all carts with user and product details
exports.getAllCarts = async (req, res) => {
    try {
        const carts = await Cart.find()
            .populate({
                path: 'user',
                select: 'username email'
            })
            .populate({
                path: 'items.product',
                select: 'name price imageUrl imagePath stock category'
            })
            .sort({ createdAt: -1 });

        const now = new Date();
        const activeDiscounts = await Discount.find({
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        //  apply discounts to items
        const processedCarts = carts.map(cart => {
            const updatedItems = cart.items.map(item => {
                const product = item.product;
                if (!product) {
                    return {
                        ...item.toObject(),
                        product: { name: 'Product not found', price: 0, imageUrl: '', imagePath: '' },
                        currentPrice: 0,
                        originalPrice: 0,
                        discountPercentage: 0
                    };
                }

                let originalPrice = parseFloat(product.price) || 0;
                let currentPrice = originalPrice;
                let discountPercentage = 0;

                for (const discount of activeDiscounts) {
                    const isProductInDiscount = discount.products.some(pId => pId.toString() === product._id.toString());
                    const isCategoryInDiscount = product.category && discount.categories.some(cId => cId.toString() === product.category.toString());

                    if ((discount.products.length === 0 && discount.categories.length === 0) || isProductInDiscount || isCategoryInDiscount) {
                        const potentialDiscountedPrice = discount.calculateDiscountedPrice(product.price);
                        if (potentialDiscountedPrice < currentPrice) {
                            currentPrice = potentialDiscountedPrice;
                            discountPercentage = discount.type === 'percentage' ? discount.value : 
                                ((originalPrice - currentPrice) / originalPrice) * 100;
                        }
                    }
                }

                return {
                    ...item.toObject(),
                    product: {
                        ...product.toObject(),
                        name: product.name || 'Unknown Product',
                        price: product.price || 0,
                        imageUrl: product.imageUrl || '',
                        imagePath: product.imagePath || ''
                    },
                    currentPrice: currentPrice,
                    originalPrice: originalPrice,
                    discountPercentage: Math.round(discountPercentage)
                };
            });

            const totalAmount = updatedItems.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
            const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

            return {
                ...cart.toObject(),
                items: updatedItems,
                totalAmount: totalAmount,
                totalItems
            };
        });

        res.render('admin/carts/index', {
            title: 'Manage Carts',
            carts: processedCarts,
            activePage: 'carts',
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching carts:', error);
        res.status(500).render('error', {
            message: 'Failed to load carts',
            error: process.env.NODE_ENV === 'development' ? error : {},
            user: req.session.user,
            activePage: 'carts'
        });
    }
};

exports.getCartDetails = async (req, res) => {
    try {
        const cartId = req.params.cartId;
        
        // Validate cartId
        if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
            console.log('Invalid cart ID received:', cartId);
            return res.status(400).render('error', {
                message: 'Invalid cart ID',
                error: { status: 400 },
                user: req.session.user,
                activePage: 'carts'
            });
        }

        const cart = await Cart.findById(cartId)
            .populate({
                path: 'user',
                select: 'username email'
            })
            .populate({
                path: 'items.product',
                select: 'name price imageUrl imagePath stock category'
            });

        if (!cart) {
            console.log('Cart not found for ID:', cartId);
            return res.status(404).render('error', {
                message: 'Cart not found',
                error: { status: 404 },
                user: req.session.user,
                activePage: 'carts'
            });
        }

        const now = new Date();
        const activeDiscounts = await Discount.find({
            status: 'active',
            startDate: { $lte: now },
            endDate: { $gte: now }
        });

        const updatedItems = cart.items.map(item => {
            const product = item.product;
            if (!product) {
                return {
                    ...item.toObject(),
                    product: { name: 'Product not found', price: 0, imageUrl: '', imagePath: '' },
                    currentPrice: 0,
                    originalPrice: 0,
                    discountPercentage: 0
                };
            }

            let originalPrice = parseFloat(product.price) || 0;
            let currentPrice = originalPrice;
            let discountPercentage = 0;

            for (const discount of activeDiscounts) {
                const isProductInDiscount = discount.products.some(pId => pId.toString() === product._id.toString());
                const isCategoryInDiscount = product.category && discount.categories.some(cId => cId.toString() === product.category.toString());

                if ((discount.products.length === 0 && discount.categories.length === 0) || isProductInDiscount || isCategoryInDiscount) {
                    const potentialDiscountedPrice = discount.calculateDiscountedPrice(product.price);
                    if (potentialDiscountedPrice < currentPrice) {
                        currentPrice = potentialDiscountedPrice;
                        discountPercentage = discount.type === 'percentage' ? discount.value : 
                            ((originalPrice - currentPrice) / originalPrice) * 100;
                    }
                }
            }

            return {
                ...item.toObject(),
                product: {
                    ...product.toObject(),
                    name: product.name || 'Unknown Product',
                    price: product.price || 0,
                    imageUrl: product.imageUrl || '',
                    imagePath: product.imagePath || ''
                },
                currentPrice: currentPrice,
                originalPrice: originalPrice,
                discountPercentage: Math.round(discountPercentage)
            };
        });

        const totalAmount = updatedItems.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
        const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);

        res.render('admin/carts/details', {
            title: 'Cart Details',
            cart: { ...cart.toObject(), items: updatedItems, totalAmount: totalAmount, totalItems },
            activePage: 'carts',
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching cart details:', error);
        res.status(500).render('error', {
            message: 'Failed to load cart details',
            error: { status: 500, message: error.message },
            user: req.session.user,
            activePage: 'carts'
        });
    }
};

// Delete cart
exports.deleteCart = async (req, res) => {
    try {
        const cartId = req.params.cartId;
        
        if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
            console.log('Invalid cart ID received:', cartId);
            return res.status(400).json({ 
                success: false,
                error: 'Invalid cart ID' 
            });
        }

        const deletedCart = await Cart.findByIdAndDelete(cartId);
        
        if (!deletedCart) {
            console.log('Cart not found for ID:', cartId);
            return res.status(404).json({ 
                success: false,
                error: 'Cart not found' 
            });
        }

        console.log('Cart deleted successfully:', cartId);
        return res.json({
            success: true,
            message: 'Cart deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting cart:', error);
        return res.status(500).json({ 
            success: false,
            error: 'Failed to delete cart' 
        });
    }
}; 