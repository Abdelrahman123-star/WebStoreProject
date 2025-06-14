const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'scheduled'],
    default: 'scheduled'
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
discountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if discount is valid
discountSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    now >= this.startDate &&
    now <= this.endDate
  );
};

// Method to calculate discounted price
discountSchema.methods.calculateDiscountedPrice = function(originalPrice) {
  if (!this.isValid()) return originalPrice;

  let discountedPrice;
  if (this.type === 'percentage') {
    discountedPrice = originalPrice * (1 - this.value / 100);
  } else {
    discountedPrice = originalPrice - this.value;
  }

  // Ensure price doesn't go below 0
  return Math.max(0, discountedPrice);
};

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount; 