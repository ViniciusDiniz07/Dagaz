import { Router } from 'express';
import { listSports, listClasses } from './sports.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.get('/', authenticate, listSports);
router.get('/classes', authenticate, listClasses);

export default router;
