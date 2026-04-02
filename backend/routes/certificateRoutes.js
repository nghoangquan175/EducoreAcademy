const express = require('express');
const router = express.Router();
const { 
    generateCertificate, 
    verifyCertificate, 
    getMyCertificates 
} = require('../controllers/certificateController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/certificates/generate
// @desc    Generate a certificate (Student only, must have completed enrollment)
router.post('/generate', protect, generateCertificate);

// @route   GET /api/certificates/my
// @desc    Get current user's certificates
router.get('/my', protect, getMyCertificates);

// @route   GET /api/certificates/verify/:code
// @desc    Verify certificate by code (Public)
router.get('/verify/:code', verifyCertificate);

module.exports = router;
