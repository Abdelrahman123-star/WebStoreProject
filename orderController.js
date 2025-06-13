const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Setting = require('../models/Setting');

exports.createOrder = async (req, res, paymentMethod) => {
    try {
        const userId = req.session.user.id;
        const sessionCart = req.session.cart; // Use session cart which has updated product info

        if (!sessionCart || sessionCart.items.length === 0) {
            req.flash('error', 'Your cart is empty. Cannot place an order.');
            return res.redirect('/myCart');
        }

        // Fetch current shipping settings
        const settings = await Setting.findOne({ key: 'store_settings' });
        const defaultShippingCost = settings ? settings.defaultShippingCost : 0;
        const freeShippingThreshold = settings ? settings.freeShippingThreshold : 0;

        let calculatedShippingCost = 0;
        if (parseFloat(sessionCart.totalAmount) < freeShippingThreshold && freeShippingThreshold > 0) {
            calculatedShippingCost = defaultShippingCost;
        }

        const finalTotal = parseFloat(sessionCart.totalAmount) + calculatedShippingCost;

        // Prepare order items from session cart items
        const orderItems = sessionCart.items.map(item => {
            console.log('Product data in session cart for order item:', item.product); // Debugging line
            return ({
                product: item.product.id,
                name: item.product.name,
                quantity: item.quantity,
                priceAtPurchase: item.currentPrice, // Use currentPrice which includes discounts
                imageUrl: item.product.imageUrl || item.product.imagePath
            });
        });
        console.log('Final order items before saving:', orderItems); // Debugging line

        // Create the new order
        const newOrder = new Order({
            user: userId,
            items: orderItems,
            totalAmount: parseFloat(sessionCart.totalAmount), // Subtotal before shipping/VAT
            shippingCost: calculatedShippingCost,
            finalTotal: finalTotal,
            paymentMethod: paymentMethod,
            orderStatus: 'Pending' // Initial status
        });

        await newOrder.save();
        console.log('Order created successfully:', newOrder._id);

        // Update product stock (decrement)
        for (const item of sessionCart.items) {
            await Product.findByIdAndUpdate(item.product.id, { $inc: { stock: -item.quantity } });
            console.log(`Decremented stock for ${item.product.name} by ${item.quantity}`);
        }

        // Clear the user's cart from the database
        await Cart.findOneAndDelete({ user: userId });
        console.log('User cart cleared from database');

        // Clear session cart
        req.session.cart = { items: [], totalAmount: 0, totalItems: 0 };
        req.session.save(); // Ensure session is saved immediately
        console.log('User cart cleared from session');

        req.flash('success', `Order #${newOrder._id.toString().substring(0, 8)} placed successfully!`);
        res.redirect('/order/confirmation/' + newOrder._id);

    } catch (error) {
        console.error('Error creating order:', error);
        req.flash('error', 'Failed to place your order. Please try again.');
        res.redirect('/myCart/payment');
    }
};

exports.getUserOrders = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.session.user.id;
    console.log('Fetching orders for user:', userId);

    const orders = await Order.find({ user: userId }).sort({ orderDate: -1 }).limit(5);
    console.log('Found orders:', orders);

    const formattedOrders = orders.map(order => ({
      orderId: order._id.toString().substring(0, 8) + '...',
      date: new Date(order.orderDate).toLocaleDateString(),
      total: order.totalAmount.toFixed(2),
      status: order.orderStatus,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.priceAtPurchase.toFixed(2),
        imageUrl: item.imageUrl
      })),
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      paymentMethod: order.paymentMethod,
      shippingCost: order.shippingCost ? order.shippingCost.toFixed(2) : '0.00'
    }));
    
    console.log('Formatted orders:', formattedOrders);
    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
}; 