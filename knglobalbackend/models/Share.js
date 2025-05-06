const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Please specify the number of shares'],
    min: [1, 'Must purchase at least 1 share'],
  },
  pricePerShare: {
    type: Number,
    required: [true, 'Please specify the price per share'],
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: [true, 'Please specify payment method'],
    enum: ['paypal', 'bank transfer', 'skrill', 'cash', 'check', 'other'],
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
  month: {
    type: String, // e.g., "2025-05" for May 2025
  },
  notes: {
    type: String,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // The admin who recorded this purchase
  },
});

// Pre-save middleware to calculate total amount and set month
shareSchema.pre('save', function (next) {
  // Calculate total amount
  if (!this.totalAmount) {
    this.totalAmount = this.quantity * this.pricePerShare;
  }

  // Set month in YYYY-MM format for easier querying
  const date = this.purchaseDate || new Date();
  this.month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  next();
});

module.exports = mongoose.model('Share', shareSchema);