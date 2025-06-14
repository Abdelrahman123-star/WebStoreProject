const mongoose = require('mongoose');
const Product = require('../models/Product');

mongoose.connect('mongodb://localhost:27017/mystore', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const sampleProducts = [
    {
        name: "Smart 4K TV",
        description: "55-inch 4K Ultra HD Smart LED TV with HDR",
        price: 699.99,
        category: "electronics",
        imageUrl: "/images/products/tv.jpg",
        rating: 4.5,
        numberOfReviews: 128
    },
    {
        name: "Wireless Headphones",
        description: "Noise Cancelling Bluetooth Headphones",
        price: 199.99,
        category: "electronics",
        imageUrl: "/images/products/headphones.jpg",
        rating: 4.8,
        numberOfReviews: 256
    },
    {
        name: "Cotton T-Shirt",
        description: "Premium Cotton Crew Neck T-Shirt",
        price: 24.99,
        category: "clothing",
        imageUrl: "/images/products/tshirt.jpg",
        rating: 4.2,
        numberOfReviews: 89
    },
    {
        name: "Coffee Maker",
        description: "12-Cup Programmable Coffee Maker",
        price: 79.99,
        category: "home",
        imageUrl: "/images/products/coffee-maker.jpg",
        rating: 4.6,
        numberOfReviews: 167
    },
    {
        name: "Face Moisturizer",
        description: "Hydrating Daily Face Moisturizer",
        price: 29.99,
        category: "beauty",
        imageUrl: "/images/products/moisturizer.jpg",
        rating: 4.7,
        numberOfReviews: 203
    },
    {
        name: "Laptop",
        description: "15.6-inch Full HD Laptop with SSD",
        price: 899.99,
        category: "electronics",
        imageUrl: "/images/products/laptop.jpg",
        rating: 4.4,
        numberOfReviews: 145
    },
    {
        name: "Denim Jeans",
        description: "Classic Fit Stretch Denim Jeans",
        price: 49.99,
        category: "clothing",
        imageUrl: "/images/products/jeans.jpg",
        rating: 4.3,
        numberOfReviews: 178
    },
    {
        name: "Air Purifier",
        description: "HEPA Air Purifier for Large Rooms",
        price: 199.99,
        category: "home",
        imageUrl: "/images/products/air-purifier.jpg",
        rating: 4.9,
        numberOfReviews: 92
    }
];

async function seedProducts() {
    try {
        // Clear existing products
        await Product.deleteMany({});
        
        // Insert sample products
        await Product.insertMany(sampleProducts);
        
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedProducts(); 