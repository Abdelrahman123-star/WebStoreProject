const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    defaultShippingCost: {
        type: Number,
        default: 0
    },
    freeShippingThreshold: {
        type: Number,
        default: 0
    },
    // Add a unique identifier for the settings document
    // This ensures there's only one settings document in the collection
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'store_settings' // A fixed key to easily find the single settings document
    }
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting; 