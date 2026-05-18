import express from 'express';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireAdmin } from '../../middleware/admin.middleware.js';
import {
  getAllUsers,
  toggleUserStatus,
  adjustUserCoins,
  getUserProfile,
} from './admin.controller.js';

const router = express.Router();

/**
 * All admin routes require authentication and admin role
 */
router.use(requireAuth);
router.use(requireAdmin());

// GET all users
router.get('/users', getAllUsers);

// GET user profile with details
router.get('/users/:userId/profile', getUserProfile);

// PATCH toggle block/unblock user
router.patch('/users/:userId/status', toggleUserStatus);

// PATCH adjust user coins
router.patch('/users/:userId/coins', adjustUserCoins);

export default router;
