import { Router } from 'express';
import { login, getProfile, logout, forgotPassword } from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';
import { recordAudit } from '../../middlewares/audit.js';

const router = Router();

router.post('/login', authLimiter, recordAudit('LOGIN', 'auth'), login);
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, recordAudit('LOGOUT', 'auth'), logout);
router.post('/forgot-password', authLimiter, recordAudit('FORGOT_PASSWORD_REQUEST', 'auth'), forgotPassword);

export default router;
