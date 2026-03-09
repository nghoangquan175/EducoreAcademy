const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo } = require('../config/cloudinary');
const { protect, instructor } = require('../middleware/authMiddleware');

// @desc    Upload an image (e.g. course thumbnail)
// @route   POST /api/upload/image
// @access  Private (Instructor/Admin)
router.post('/image', protect, instructor, uploadImage.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    // Cloudinary returns the secure url in req.file.path
    res.status(200).json({
      message: 'Image uploaded successfully',
      url: req.file.path,
      format: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ message: 'Image upload error: ' + (error.message || error.toString()) });
  }
});

// @desc    Upload a video (e.g. lesson content)
// @route   POST /api/upload/video
// @access  Private (Instructor/Admin)
router.post('/video', protect, instructor, uploadVideo.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    res.status(200).json({
      message: 'Video uploaded successfully',
      url: req.file.path,
      format: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Video upload error: ' + (error.message || error.toString()) });
  }
});

module.exports = router;
