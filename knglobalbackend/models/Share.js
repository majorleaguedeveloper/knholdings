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
    min: [0.01, 'Share quantity must be greater than 0'],
  },
  pricePerShare: {
    type: Number,
    required: [true, 'Please specify the price per share'],
    min: [0.01, 'Price per share must be greater than 0'],
  },
  amountPaid: {
    type: Number,
    required: [true, 'Please specify the amount paid'],
    min: [0.01, 'Amount paid must be greater than 0'],
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
    trim: true,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // The admin who recorded this purchase
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to calculate total amount and set month
shareSchema.pre('save', function (next) {
  // Calculate total amount if not provided
  if (!this.totalAmount) {
    this.totalAmount = this.quantity * this.pricePerShare;
  }

  // Set month in YYYY-MM format for easier querying
  const date = this.purchaseDate || new Date();
  this.month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  next();
});

module.exports = mongoose.model('Share', shareSchema);