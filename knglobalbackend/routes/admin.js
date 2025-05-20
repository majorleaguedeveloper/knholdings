const express = require('express');
const {
  getMembers,
  getMember,
  updateMemberStatus,
  createSharePurchase,
  createAnnouncement,
  getAllSharePurchases,
  getActiveAnnouncements,
  getAllAnnouncements,
  createMember,
  updateMember,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncement
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validateAnnouncement, validateAnnouncementUpdate } = require('../middleware/validateAnnouncement');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);
router.use(authorize('admin'));

// Member routes
router.get('/members', getMembers);
router.get('/members/:id', getMember);
router.put('/members/:id/status', updateMemberStatus);
router.post('/members', createMember);
router.put('/members/:id', updateMember);

// Share routes
router.post('/shares', createSharePurchase);
router.get('/shares', getAllSharePurchases);

// Announcement routes
router.post('/announcements', validateAnnouncement, createAnnouncement);
router.get('/announcements', getActiveAnnouncements);
router.get('/announcements/all', getAllAnnouncements);
router.get('/announcements/:id', getAnnouncement);
router.put('/announcements/:id', validateAnnouncementUpdate, updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;