import { Router } from 'express';
import { getDashboardStats, exportReport } from './reports.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.get('/dashboard', authenticate, getDashboardStats);
router.get('/export', authenticate, exportReport);

export default router;
