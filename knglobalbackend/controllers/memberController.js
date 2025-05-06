const User = require('../models/User');
const Share = require('../models/Share');
const Announcement = require('../models/Announcement');

// @desc    Get member's profile
// @route   GET /api/member/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update member's profile
// @route   PUT /api/member/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get member's shares
// @route   GET /api/member/shares
// @access  Private
exports.getMemberShares = async (req, res) => {
  try {
    const shares = await Share.find({ user: req.user.id })
      .sort({ purchaseDate: -1 });
    
    // Calculate total shares
    const totalShares = shares.reduce((total, share) => total + share.quantity, 0);
    
    res.status(200).json({
      success: true,
      totalShares,
      count: shares.length,
      data: shares
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get member's shares by month
// @route   GET /api/member/shares/monthly
// @access  Private
exports.getMemberSharesByMonth = async (req, res) => {
  try {
    // Aggregate shares by month
    const monthlyShares = await Share.aggregate([
      // Match documents for this user
      { $match: { user: mongoose.Types.ObjectId(req.user.id) } },
      
      // Group by month
      { $group: {
          _id: "$month",
          month: { $first: "$month" },
          totalShares: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
          purchases: { $push: {
            _id: "$_id",
            quantity: "$quantity",
            pricePerShare: "$pricePerShare",
            totalAmount: "$totalAmount",
            purchaseDate: "$purchaseDate"
          }}
        }
      },
      
      // Sort by month (descending)
      { $sort: { month: -1 } }
    ]);
    
    res.status(200).json({
      success: true,
      count: monthlyShares.length,
      data: monthlyShares
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get active announcements
// @route   GET /api/member/announcements
// @access  Private
exports.getActiveAnnouncements = async (req, res) => {
  try {
    // Get announcements that haven't expired
    const announcements = await Announcement.find({
      $or: [
        { expiresAt: { $gt: Date.now() } },
        { expiresAt: null }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};