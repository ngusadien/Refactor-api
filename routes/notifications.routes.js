import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences,
} from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Notification routes
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);

// Preferences routes
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

export default router;
