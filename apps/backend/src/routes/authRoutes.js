import express from 'express';
import * as authController from '../controller/mysql/authController.js';
import { authenticateToken, checkSuspension } from '../middleWare/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', checkSuspension, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.put('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);

// Protected routes (authentication required)
router.get('/logout', authenticateToken, authController.logout);
router.get('/verify-token', authenticateToken, authController.verifyToken);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);

export default router;
