import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/request-password-reset', UserController.requestPasswordReset);

// Protected routes
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);
router.post('/change-password', authMiddleware, UserController.changePassword);
router.delete('/account', authMiddleware, UserController.deleteAccount);

export default router;
