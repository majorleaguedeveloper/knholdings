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
    const { user, quantity, pricePerShare, paymentMethod, purchaseDate, notes } = req.body;
    
    // Check if member exists
    const member = await User.findById(user);
    if (!member || member.role !== 'member') {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Create share purchase
    const sharePurchase = await Share.create({
      user,
      quantity,
      pricePerShare,
      paymentMethod,
      purchaseDate: purchaseDate || Date.now(),
      notes,
      recordedBy: req.user.id // Current admin
    });
    
    res.status(201).json({
      success: true,
      data: sharePurchase
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
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