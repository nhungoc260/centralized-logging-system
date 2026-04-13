import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate, requireAdmin } from '../middlewares/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me
router.get('/me', authenticate, authController.me);

// ── Admin only ──────────────────────────────────────────────

// GET /api/auth/users — danh sách tất cả users
router.get('/users', authenticate, requireAdmin, authController.listUsers);

// DELETE /api/auth/users/:id — xóa user
router.delete('/users/:id', authenticate, requireAdmin, authController.deleteUser);

export default router;
