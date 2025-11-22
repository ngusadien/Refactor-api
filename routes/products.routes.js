import express from 'express';
import {
  uploadProduct,
  fetchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
  getCategories,
} from '../controllers/products.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', fetchProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Protected routes (require authentication)
// Note: Images are uploaded separately via /api/cloudinary/product
router.post('/', authenticate, uploadProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);

export default router;
