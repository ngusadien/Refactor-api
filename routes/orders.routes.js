import express from 'express';
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  cancelOrder,
  getOrderHistory,
} from '../controllers/orders.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Order routes
router.get('/', getOrders);
router.get('/history', getOrderHistory);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', authorize('admin', 'wholesaler', 'retailer'), updateOrder);
router.post('/:id/cancel', cancelOrder);

export default router;
