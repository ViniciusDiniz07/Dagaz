import { Router } from 'express';
import { listEnrollments, updateEnrollmentStatus, reactivateEnrollment } from './enrollments.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { recordAudit } from '../../middlewares/audit.js';

const router = Router();

router.get('/', authenticate, listEnrollments);
router.patch('/:id/status', authenticate, requireRole('admin', 'coordenador', 'atendente'), recordAudit('UPDATE_STATUS', 'enrollments'), updateEnrollmentStatus);
router.post('/:id/reactivate', authenticate, requireRole('admin', 'coordenador', 'atendente'), recordAudit('REACTIVATE', 'enrollments'), reactivateEnrollment);

export default router;
