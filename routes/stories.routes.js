import express from 'express';
import multer from 'multer';
import {
  getAllStories,
  getMyStories,
  getUserStories,
  getStoryById,
  createStory,
  addViewToStory,
  toggleLikeStory,
  deleteStory,
  getStoryViews,
} from '../controllers/stories.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for story media uploads
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
  // Accept images and videos for stories
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    const error = new Error('Invalid file type. Only images and videos are allowed for stories.');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for stories/videos
  },
});

// Public routes
router.get('/user/:userId', getUserStories);
router.get('/:id', getStoryById);

// Protected routes
router.get('/', authenticate, getAllStories);
router.post('/', authenticate, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
}, createStory);
router.get('/my/stories', authenticate, getMyStories);
router.post('/:id/view', authenticate, addViewToStory);
router.post('/:id/like', authenticate, toggleLikeStory);
router.delete('/:id', authenticate, deleteStory);
router.get('/:id/views', authenticate, getStoryViews);

 export default router
