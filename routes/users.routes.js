import express from 'express';
import multer from 'multer';
import {
  getProfile,
  updateProfile,
  uploadKYC,
  getKYC,
  updateSettings,
  registerFCMToken,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowing,
  upgradeAccount,
} from '../controllers/users.controller.js';
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

const upload = multer({ storage });

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// KYC routes
router.post('/kyc', upload.array('documents', 5), uploadKYC);
router.get('/kyc', getKYC);

// Settings routes
router.put('/settings', updateSettings);

// FCM token for push notifications
router.post('/fcm-token', registerFCMToken);

// Account upgrade route
router.post('/upgrade', upgradeAccount);

// Follow/unfollow routes
router.post('/follow/:userId', followUser);
router.delete('/follow/:userId', unfollowUser);
router.get('/followers', getFollowers); // Get current user's followers
router.get('/followers/:userId', getFollowers); // Get specific user's followers
router.get('/following', getFollowing); // Get current user's following
router.get('/following/:userId', getFollowing); // Get specific user's following
router.get('/check-following/:userId', checkFollowing);

export default router;
