import express from 'express';
import {
  getDeliveries,
  getDeliveryById,
  trackDelivery,
  updateDeliveryStatus,
} from '../controllers/deliveries.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Delivery routes
router.get('/', getDeliveries);
router.get('/:id', getDeliveryById);
router.get('/:id/track', trackDelivery);
router.patch('/:id/status', authorize('admin', 'delivery'), updateDeliveryStatus);

export default router;
