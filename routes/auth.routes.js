import express from 'express';
import { register, login, verifyOTP, refreshToken, logout } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP);
router.post('/refresh', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);

export default router;
