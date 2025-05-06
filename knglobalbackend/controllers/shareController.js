const Share = require('../models/Share');
const User = require('../models/User');

// @desc    Get share statistics
// @route   GET /api/shares/stats
// @access  Private/Admin
exports.getShareStats = async (req, res) => {
  try {
    // Get total shares issued
    const totalShares = await Share.aggregate([
      { $group: {
          _id: null,
          total: { $sum: "$quantity" },
          value: { $sum: "$totalAmount" }
        }
      }
    ]);
    
    // Get monthly distribution
    const monthlyDistribution = await Share.aggregate([
      { $group: {
          _id: "$month",
          month: { $first: "$month" },
          shares: { $sum: "$quantity" },
          value: { $sum: "$totalAmount" }
        }
      },
      { $sort: { month: -1 } },
      { $limit: 12 }
    ]);
    
    // Get top members by shares
    const topMembers = await Share.aggregate([
      { $group: {
          _id: "$user",
          totalShares: { $sum: "$quantity" }
        }
      },
      { $sort: { totalShares: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $project: {
          _id: 1,
          totalShares: 1,
          name: { $arrayElemAt: ["$userDetails.name", 0] },
          email: { $arrayElemAt: ["$userDetails.email", 0] }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalShares: totalShares.length > 0 ? totalShares[0].total : 0,
        totalValue: totalShares.length > 0 ? totalShares[0].value : 0,
        monthlyDistribution,
        topMembers
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get shares for a specific member
// @route   GET /api/shares/member/:id
// @access  Private/Admin
exports.getMemberSharesById = async (req, res) => {
  try {
    const memberId = req.params.id;
    
    // Check if member exists
    const memberExists = await User.findById(memberId);
    if (!memberExists) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Get member's shares
    const shares = await Share.find({ user: memberId })
      .sort({ purchaseDate: -1 });
    
    // Calculate total shares
    const totalShares = shares.reduce((total, share) => total + share.quantity, 0);
    
    res.status(200).json({
      success: true,
      memberId,
      memberName: memberExists.name,
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