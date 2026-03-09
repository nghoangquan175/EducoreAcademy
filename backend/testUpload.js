require('dotenv').config();
console.log('CLOUD_NAME:', typeof process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_CLOUD_NAME);
console.log('API_KEY:', typeof process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_KEY);
console.log('API_SECRET:', typeof process.env.CLOUDINARY_API_SECRET, process.env.CLOUDINARY_API_SECRET);

const cloudinary = require('./config/cloudinary').cloudinary;
console.log('Config configured:', cloudinary.config());
