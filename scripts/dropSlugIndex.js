const mongoose = require('mongoose');
require('dotenv').config();

async function dropSlugIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Get the categories collection
        const collection = mongoose.connection.collection('categories');

        // Drop the slug index
        await collection.dropIndex('slug_1');
        console.log('Successfully dropped slug index');

        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dropSlugIndex(); 