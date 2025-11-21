import express from 'express';
import {
  getConversations,
  getConversationById,
  sendMessage,
  markAsRead,
} from '../controllers/messages.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Conversation routes
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationById);

// Message routes
router.post('/send', sendMessage);
router.patch('/:id/read', markAsRead);

export default router;
