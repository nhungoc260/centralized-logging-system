import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { User } from '../models/User';

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, role } = req.body;
      const { user, token } = await authService.register(email, password, name, role);
      res.status(201).json({ success: true, data: { user, token } });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      res.json({ success: true, data: { user, token } });
    } catch (error) {
      next(error);
    }
  },

  async me(req: Request, res: Response): Promise<void> {
    res.json({ success: true, data: (req as Request & { user?: unknown }).user });
  },

  // Admin: lấy danh sách tất cả users
  async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.find({}).select('-password').sort({ createdAt: -1 });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  // Admin: xóa user theo id
  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const currentUserId = (req as Request & { user?: { userId: string } }).user?.userId;

      // Không tự xóa mình
      if (id === currentUserId) {
        res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        return;
      }

      const deleted = await User.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      res.json({ success: true, message: 'User deleted' });
    } catch (error) {
      next(error);
    }
  },
};
