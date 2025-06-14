const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    priceAtPurchase: {
        type: Number,
        required: true
    },
    imageUrl: String,
    imagePath: String
});

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    items: [
        OrderItemSchema
    ],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingCost: {
        type: Number,
        required: true,
        default: 0
    },
    finalTotal: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'Cash on Delivery'],
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    // You can add shipping address fields here if needed
    // shippingAddress: {
    //     street: String,
    //     city: String,
    //     zip: String,
    //     country: String
    // },
    // contactEmail: String
}, { timestamps: true });

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order; 