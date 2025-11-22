import express from 'express';
import multer from 'multer';
import {
  uploadImageToCloud,
  uploadMultipleToCloud,
  uploadProductImage,
  uploadStoryMedia,
  deleteCloudinaryFile,
  deleteMultipleCloudinaryFiles
} from '../controllers/cloudinary.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage (we'll upload directly to Cloudinary)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept images, videos, and PDFs
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// All routes require authentication
router.use(authenticate);

// Upload routes
router.post('/image', upload.single('file'), uploadImageToCloud);
router.post('/multiple', upload.array('files', 10), uploadMultipleToCloud);
router.post('/product', upload.single('file'), uploadProductImage);
router.post('/story', upload.single('file'), uploadStoryMedia);

// Delete routes
router.delete('/file', deleteCloudinaryFile);
router.delete('/multiple', deleteMultipleCloudinaryFiles);

export default router;
