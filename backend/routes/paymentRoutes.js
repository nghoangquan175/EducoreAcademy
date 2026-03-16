const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.post('/order/create', protect, paymentController.createOrder);
router.post('/vnpay/create', protect, paymentController.createPayment);

// This matches the Return URL configured: /payment-return
router.get('/vnpay/callback', paymentController.vnpayReturn);

// IPN route for VNPay server-to-server call
router.get('/vnpay/ipn', paymentController.vnpayIpn);

module.exports = router;
