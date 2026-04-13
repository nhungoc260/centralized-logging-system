import { Router, Response, NextFunction } from 'express';
import { Request } from 'express';
import { User } from '../models/User';
import { authenticate, requireAdmin } from '../middlewares/auth';
import mongoose from 'mongoose';

interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

// Helper kiểm tra ObjectId hợp lệ
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const router = Router();

router.get('/users', authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (e) { next(e); }
});

router.patch('/users/:id/role', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidId(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' }); return;
    }
    if (!['admin', 'developer'].includes(role)) {
      res.status(400).json({ success: false, message: 'Invalid role' }); return;
    }

    const user = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' }); return;
    }

    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.delete('/users/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' }); return;
    }
    if (req.user?.userId === id) {
      res.status(400).json({ success: false, message: 'Cannot delete yourself' }); return;
    }
    const deleted = await User.findByIdAndDelete(new mongoose.Types.ObjectId(id));
    if (!deleted) {
      res.status(404).json({ success: false, message: 'User not found' }); return;
    }
    res.json({ success: true, message: 'User deleted' });
  } catch (e) { next(e); }
});

router.patch('/users/:id/profile', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!isValidId(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' }); return;
    }
    if (!name?.trim()) {
      res.status(400).json({ success: false, message: 'Name required' }); return;
    }
    if (req.user?.userId !== id && req.user?.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Forbidden' }); return;
    }

    const user = await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(id),
      { name: name.trim() },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' }); return;
    }
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.patch('/users/:id/password', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!isValidId(id)) {
      res.status(400).json({ success: false, message: 'Invalid user ID' }); return;
    }
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: 'Both passwords required' }); return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: 'New password min 6 chars' }); return;
    }
    if (req.user?.userId !== id) {
      res.status(403).json({ success: false, message: 'Forbidden' }); return;
    }

    const user = await User.findById(new mongoose.Types.ObjectId(id)).select('+password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' }); return;
    }

    const ok = await user.comparePassword(currentPassword);
    if (!ok) {
      res.status(400).json({ success: false, message: 'Current password is incorrect' }); return;
    }

    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed' });
  } catch (e) { next(e); }
});

export default router;