import express from 'express';
import multer from 'multer';
import {
  uploadImage,
  uploadFile,
  uploadMultiple,
} from '../controllers/upload.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

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
    fileSize: 50 * 1024 * 1024, // 50MB for stories/videos
  },
});

// All routes require authentication
router.use(authenticate);

// Upload routes
router.post('/image', upload.single('file'), uploadImage);
router.post('/file', upload.single('file'), uploadFile);
router.post('/multiple', upload.array('files', 10), uploadMultiple);

export default router;
