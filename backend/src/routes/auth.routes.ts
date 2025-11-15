import { Router } from 'express';
import { body } from 'express-validator';
import {
  signup,
  login,
  logout,
  refreshToken,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  googleAuth,
  githubAuth,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Signup
router.post(
  '/signup',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().isLength({ min: 1, max: 100 }),
  ],
  validate,
  signup
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);

// Logout
router.post('/logout', authenticate, logout);

// Refresh token
router.post('/refresh', refreshToken);

// Get current user
router.get('/me', authenticate, getMe);

// Email verification
router.get('/verify-email/:token', verifyEmail);

// Password reset
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  forgotPassword
);

router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 8 })],
  validate,
  resetPassword
);

// OAuth
router.post('/google', googleAuth);
router.post('/github', githubAuth);

export default router;
