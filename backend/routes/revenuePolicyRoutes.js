const express = require('express');
const router = express.Router();
const { 
  getRevenuePolicies, 
  createRevenuePolicy, 
  updatePolicyStatus,
  updateRevenuePolicy,
  getRevenuePolicyById
} = require('../controllers/revenuePolicyController');
const { protect, admin } = require('../middleware/authMiddleware');

// Get policies (Admin see all, Instructor see their own)
router.get('/', protect, getRevenuePolicies);
router.get('/:id', protect, getRevenuePolicyById);

// Create policy (Admin only)
router.post('/', protect, admin, createRevenuePolicy);

router.put('/:id', protect, admin, updateRevenuePolicy);

// Update status (Instructor only)
router.patch('/:id/status', protect, updatePolicyStatus);

module.exports = router;
