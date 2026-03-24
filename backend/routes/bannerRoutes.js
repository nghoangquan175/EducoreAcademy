const express = require('express');
const router = express.Router();
const {
  getBanners,
  getAllBanners,
  getTrashBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  restoreBanner,
  forceDeleteBanner,
} = require('../controllers/bannerController');

const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.get('/', getBanners);

// Admin only
router.get('/all', protect, admin, getAllBanners);
router.get('/trash', protect, admin, getTrashBanners);
router.post('/', protect, admin, createBanner);
router.put('/:id', protect, admin, updateBanner);
router.put('/:id/restore', protect, admin, restoreBanner);
router.delete('/:id', protect, admin, deleteBanner);
router.delete('/:id/force', protect, admin, forceDeleteBanner);

module.exports = router;
