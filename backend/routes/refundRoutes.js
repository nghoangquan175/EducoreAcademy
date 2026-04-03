const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/request', protect, refundController.requestRefund);
router.get('/my-requests', protect, refundController.getMyRefundRequests);

router.get('/requests', protect, admin, refundController.getRefundRequests);
router.patch('/:id/approve', protect, admin, refundController.approveRefund);
router.patch('/:id/reject', protect, admin, refundController.rejectRefund);

module.exports = router;
