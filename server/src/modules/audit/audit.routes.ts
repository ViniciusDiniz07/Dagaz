import { Router } from 'express';
import { listAuditLogs } from './audit.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';

const router = Router();

// Somente perfil admin ou coordenador pode visualizar a trilha de auditoria completa
router.get('/', authenticate, requireRole('admin', 'coordenador'), listAuditLogs);

export default router;
