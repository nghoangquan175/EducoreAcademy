const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for Images (Course Thumbnails, Profiles)
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'educore/images',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

// Storage for Videos (Lessons)
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'educore/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'wmv'],
    // Note: Free cloudinary accounts have strict file size limits for video (~100MB)
  }
});

// Storage for Documents (CVs)
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'documents',
    resource_type: 'raw'
  }
});

const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ 
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for demo
});
const uploadDocument = multer({ storage: documentStorage });

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  uploadDocument
};
