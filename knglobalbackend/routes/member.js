const express = require('express');
const {
  getProfile,
  updateProfile,
  getMemberShares,
  getMemberSharesByMonth,
  getActiveAnnouncements
} = require('../controllers/memberController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/shares', getMemberShares);
router.get('/shares/monthly', getMemberSharesByMonth);
router.get('/announcements', getActiveAnnouncements);

module.exports = router;