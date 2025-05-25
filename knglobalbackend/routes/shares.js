const express = require('express');
const {
  getShareStats,
  getMemberSharesById,
  getSharesByMonth,
  getAvailableMonths
} = require('../controllers/shareController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Admin-only routes
router.get('/stats', authorize('admin'), getShareStats);
router.get('/member/:id', authorize('admin'), getMemberSharesById);
router.get('/monthly/:month/:year', authorize('admin'), getSharesByMonth);
router.get('/available-months', authorize('admin'), getAvailableMonths);

module.exports = router;