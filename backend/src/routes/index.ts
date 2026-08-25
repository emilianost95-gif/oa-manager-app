import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { getDashboardStats } from '../controllers/stats.controller';
import authRoutes from './auth.routes';
import courseRoutes from './course.routes';
import subjectRoutes from './subject.routes';
import unitRoutes from './unit.routes';
import objectiveRoutes from './objective.routes';
import importRoutes from './import.routes';
import exportRoutes from './export.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);

// Todo lo que sigue requiere sesión iniciada.
router.use('/courses', requireAuth, courseRoutes);
router.use('/subjects', requireAuth, subjectRoutes);
router.use('/units', requireAuth, unitRoutes);
router.use('/objectives', requireAuth, objectiveRoutes);
router.use('/import', requireAuth, importRoutes);
router.use('/export', requireAuth, exportRoutes);
router.get('/stats/dashboard', requireAuth, asyncHandler(getDashboardStats));

export default router;
