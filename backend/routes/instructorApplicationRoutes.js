const express = require('express');
const router = express.Router();
const { 
  submitApplication, 
  getApplications,
  getApplicationById,
  approveApplication, 
  rejectApplication 
} = require('../controllers/instructorApplicationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route to submit application
router.post('/', submitApplication);

// Admin routes
router.route('/')
  .get(protect, admin, getApplications);

router.get('/:id', protect, admin, getApplicationById); // Added route for fetching single application
router.patch('/:id/approve', protect, admin, approveApplication);
router.patch('/:id/reject', protect, admin, rejectApplication);

module.exports = router;
