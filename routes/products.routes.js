import express from 'express';
import multer from 'multer';
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

// Public routes
router.get('/', fetchProducts);
router.get('/search', searchProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Protected routes (require authentication)
router.post('/', authenticate, upload.single('image'), uploadProduct);
router.put('/:id', authenticate, upload.single('image'), updateProduct);
router.delete('/:id', authenticate, deleteProduct);

export default router;
