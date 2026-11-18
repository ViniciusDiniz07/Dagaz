import { Router } from 'express';
import { searchGuardians, getGuardianById, createGuardian } from './guardians.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { recordAudit } from '../../middlewares/audit.js';

const router = Router();

router.get('/', authenticate, searchGuardians);
router.get('/:id', authenticate, getGuardianById);
router.post('/', authenticate, requireRole('admin', 'coordenador', 'atendente'), recordAudit('CREATE', 'guardians'), createGuardian);

export default router;
