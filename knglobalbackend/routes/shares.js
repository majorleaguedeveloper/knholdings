const express = require('express');
const {
  getShareStats,
  getMemberSharesById
} = require('../controllers/shareController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Admin-only routes
router.get('/stats', authorize('admin'), getShareStats);
router.get('/member/:id', authorize('admin'), getMemberSharesById);

module.exports = router;