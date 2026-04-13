import { Router } from 'express';
import { logController } from '../controllers/logController';
import { authenticate, requireAdmin } from '../middlewares/auth';
import { validateLog } from '../middlewares/validation';

const router = Router();

router.post('/', authenticate, validateLog, logController.ingest);
router.post('/batch', authenticate, logController.ingestBatch);
router.get('/', authenticate, logController.query);
router.get('/stats', authenticate, logController.getStats);
router.get('/services', authenticate, logController.getServices);
router.get('/queue-stats', authenticate, requireAdmin, logController.getQueueStats);

// DELETE /api/logs - admin only
router.delete('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { service, level, before } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (service) filter.service = service;
    if (level)   filter.level = level;
    if (before)  filter.timestamp = { $lt: new Date(before) };
    const { Log } = await import('../models/Log');
    const result = await Log.deleteMany(filter);
    res.json({ success: true, data: { deletedCount: result.deletedCount } });
  } catch (e) { next(e); }
});

export default router;