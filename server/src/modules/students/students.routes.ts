import { Router } from 'express';
import { listStudents, getStudentById, createStudent, updateStudent, deleteStudent } from './students.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { recordAudit } from '../../middlewares/audit.js';

const router = Router();

router.get('/', authenticate, listStudents);
router.get('/:id', authenticate, getStudentById);
router.post('/', authenticate, requireRole('admin', 'coordenador', 'atendente'), recordAudit('CREATE', 'students'), createStudent);
router.put('/:id', authenticate, requireRole('admin', 'coordenador', 'atendente'), recordAudit('UPDATE', 'students'), updateStudent);
router.delete('/:id', authenticate, requireRole('admin'), recordAudit('DELETE', 'students'), deleteStudent);

export default router;
