import express from 'express';
import {
  getWarehouses,
  getWarehouseById,
  getWarehouseInventory,
  updateWarehouseStock,
} from '../controllers/warehouses.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Warehouse routes
router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);
router.get('/:id/inventory', getWarehouseInventory);
router.patch('/:id/stock', authorize('admin', 'wholesaler', 'retailer'), updateWarehouseStock);

export default router;
