const User = require('../models/User');
const Share = require('../models/Share');
const Announcement = require('../models/Announcement');

// @desc    Get all members
// @route   GET /api/admin/members
// @access  Private/Admin
exports.getMembers = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' }).select('-__v');
    
    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a single member
// @route   GET /api/admin/members/:id
// @access  Private/Admin
exports.getMember = async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update member status
// @route   PUT /api/admin/members/:id/status
// @access  Private/Admin
exports.updateMemberStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const member = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Create new share purchase for a member
// @route   POST /api/admin/shares
// @access  Private/Admin
exports.createSharePurchase = async (req, res) => {
  try {
    const { user, amountPaid, quantity, paymentMethod } = req.body;

    // Validate required fields
    if (!user) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    if (!amountPaid || isNaN(amountPaid) || amountPaid <= 0) {
      return res.status(400).json({ success: false, message: 'Amount paid must be a positive number' });
    }
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive number' });
    }
    const validPaymentMethods = ['paypal', 'bank transfer', 'skrill', 'cash', 'check', 'other'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    // Check if the user exists and is a member
    const member = await User.findById(user);
    if (!member || member.role !== 'member') {
      return res.status(404).json({ success: false, message: 'Member not found or invalid role' });
    }

    // Set pricePerShare and calculate totalAmount
    const pricePerShare = 10; // Example rate per share
    const totalAmount = quantity * pricePerShare;

    // Create the share purchase
    const sharePurchase = await Share.create({
      user,
      amountPaid,
      quantity,
      pricePerShare,
      totalAmount,
      paymentMethod,
      recordedBy: req.user.id, // Assuming `req.user` contains the admin's ID
    });

    res.status(201).json({ success: true, data: sharePurchase });
  } catch (error) {
    console.error('Error creating share purchase:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create announcement
// @route   POST /api/admin/announcements
// @access  Private/Admin
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, importance, expiresAt } = req.body;
    
    const announcement = await Announcement.create({
      title,
      content,
      importance,
      expiresAt,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// @desc    Get active announcements
// @route   GET /api/admin/announcements
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

// @desc    Get all share purchases (admin dashboard)
// @route   GET /api/admin/shares
// @access  Private/Admin
exports.getAllSharePurchases = async (req, res) => {
  try {
    const shares = await Share.find()
      .populate('user', 'name email')
      .populate('recordedBy', 'name')
      .sort({ purchaseDate: -1 });
    
    res.status(200).json({
      success: true,
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