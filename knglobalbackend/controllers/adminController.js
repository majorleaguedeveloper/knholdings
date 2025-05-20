const User = require('../models/User');
const Share = require('../models/Share');
const Announcement = require('../models/Announcement');

// @desc    Create new member (admin)
// @route   POST /api/admin/members
// @access  Private/Admin
exports.createMember = async (req, res) => {
  try {
    const { name, email, phone, password, status } = req.body;

    // Check if member already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with that email already exists'
      });
    }

    // Validate status
    if (status && !['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Create member
    const member = await User.create({
      name,
      email,
      phone,
      password,
      role: 'member',
      status: status || 'pending'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
        status: member.status,
        createdAt: member.createdAt
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update member profile
// @route   PUT /api/admin/members/:id
// @access  Private/Admin
exports.updateMember = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    
    // Find member first to check if exists
    const member = await User.findById(req.params.id);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // If email is being changed, check if the new email is already in use
    if (email && email !== member.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }
    
    // Prepare update object
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status && ['active', 'inactive', 'pending'].includes(status)) {
      updateData.status = status;
    }
    
    // Update member
    const updatedMember = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: updatedMember
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all members or search members
// @route   GET /api/admin/members
// @access  Private/Admin
exports.getMembers = async (req, res) => {
  try {
    const { search } = req.query;
    
    // If search parameter exists, handle as search query
    if (search) {
      const query = {
        role: 'member',
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
      
      const members = await User.find(query)
        .select('name email _id')
        .limit(10);
      
      return res.status(200).json({
        success: true,
        count: members.length,
        data: members
      });
    }
    
    // Otherwise return all members
    const members = await User.find({ role: 'member' }).select('-password -__v');
    
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

// @desc    Search members by name or email
// @route   GET /api/admin/members?search=
// @access  Private/Admin
exports.searchMembers = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    // Create case-insensitive search query
    const query = {
      role: 'member',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };
    
    const members = await User.find(query)
      .select('name email _id')
      .limit(10); // Limit results for performance
    
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

// @desc    Create new share purchase for a member
// @route   POST /api/admin/shares
// @access  Private/Admin
exports.createSharePurchase = async (req, res) => {
  try {
    const { 
      user, 
      amountPaid, 
      quantity, 
      pricePerShare, 
      paymentMethod, 
      purchaseDate, 
      notes 
    } = req.body;

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
    if (!pricePerShare || isNaN(pricePerShare) || pricePerShare <= 0) {
      return res.status(400).json({ success: false, message: 'Price per share must be a positive number' });
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

    // Create share purchase data object
    const shareData = {
      user,
      amountPaid: parseFloat(amountPaid),
      quantity: parseFloat(quantity),
      pricePerShare: parseFloat(pricePerShare),
      totalAmount: parseFloat(quantity) * parseFloat(pricePerShare),
      paymentMethod,
      recordedBy: req.user.id, // Admin's ID
    };

    // Add purchase date if provided
    if (purchaseDate) {
      shareData.purchaseDate = new Date(purchaseDate);
    }

    // Add notes if provided
    if (notes) {
      shareData.notes = notes;
    }

    // Create the share purchase
    const sharePurchase = await Share.create(shareData);

    // Populate user details for response
    await sharePurchase.populate('user', 'name email');
    
    res.status(201).json({ success: true, data: sharePurchase });
  } catch (error) {
    console.error('Error creating share purchase:', error);
    res.status(400).json({ success: false, message: error.message });
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
    
    // Calculate additional fields if needed for frontend
    const enhancedShares = shares.map(share => {
      const shareObj = share.toObject();
      // Ensure totalAmount is available (fallback to amountPaid if needed)
      if (!shareObj.totalAmount) {
        shareObj.totalAmount = shareObj.amountPaid;
      }
      return shareObj;
    });
    
    res.status(200).json({
      success: true,
      count: enhancedShares.length,
      data: enhancedShares
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


// @desc    Update announcement
// @route   PUT /api/admin/announcements/:id
// @access  Private/Admin
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, content, importance, expiresAt } = req.body;
    
    // Find announcement first to check if it exists
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    // Validate importance level if provided
    if (importance && !['low', 'medium', 'high'].includes(importance)) {
      return res.status(400).json({
        success: false,
        message: 'Importance must be low, medium, or high'
      });
    }
    
    // Prepare update object
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (importance) updateData.importance = importance;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt;
    
    // Update the announcement
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedAnnouncement
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete announcement  
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    await announcement.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get a single announcement
// @route   GET /api/admin/announcements/:id
// @access  Private/Admin
exports.getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found'
      });
    }
    
    res.status(200).json({
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
    // Query parameters for filtering
    const { importance, sortBy, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = {
      $or: [
        { expiresAt: { $gt: Date.now() } },
        { expiresAt: null }
      ]
    };
    
    // Add importance filter if provided
    if (importance && ['low', 'medium', 'high'].includes(importance)) {
      query.importance = importance;
    }
    
    // Create sort object
    const sort = {};
    if (sortBy) {
      const sortFields = sortBy.split(',').forEach(field => {
        if (field.startsWith('-')) {
          sort[field.substring(1)] = -1;
        } else {
          sort[field] = 1;
        }
      });
    } else {
      // Default sort by createdAt in descending order
      sort.createdAt = -1;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const announcements = await Announcement.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');
    
    // Get total count for pagination info
    const total = await Announcement.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: announcements.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
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

// @desc    Get all announcements (including expired)
// @route   GET /api/admin/announcements/all
// @access  Private/Admin
exports.getAllAnnouncements = async (req, res) => {
  try {
    // Query parameters for filtering
    const { importance, status, sortBy, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by importance if provided
    if (importance && ['low', 'medium', 'high'].includes(importance)) {
      query.importance = importance;
    }
    
    // Filter by status if provided (active/expired)
    if (status === 'active') {
      query.$or = [
        { expiresAt: { $gt: Date.now() } },
        { expiresAt: null }
      ];
    } else if (status === 'expired') {
      query.expiresAt = { $lte: Date.now(), $ne: null };
    }
    
    // Create sort object
    const sort = {};
    if (sortBy) {
      const sortFields = sortBy.split(',').forEach(field => {
        if (field.startsWith('-')) {
          sort[field.substring(1)] = -1;
        } else {
          sort[field] = 1;
        }
      });
    } else {
      // Default sort by createdAt in descending order
      sort.createdAt = -1;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const announcements = await Announcement.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name');
    
    // Get total count for pagination info
    const total = await Announcement.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: announcements.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: announcements
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};