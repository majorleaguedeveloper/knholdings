const express = require('express');
const {
  getMembers,
  getMember,
  updateMemberStatus,
  createSharePurchase,
  createAnnouncement,
  getAllSharePurchases,
  getActiveAnnouncements
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));

router.get('/members', getMembers);
router.get('/members/:id', getMember);
router.put('/members/:id/status', updateMemberStatus);
router.post('/shares', createSharePurchase);
router.get('/shares', getAllSharePurchases);
router.post('/announcements', createAnnouncement);
router.get('/announcements', getActiveAnnouncements);

module.exports = router;
