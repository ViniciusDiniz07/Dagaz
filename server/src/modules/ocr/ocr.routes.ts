import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { extractDocument, getDocumentById, confirmDocument, rejectDocument } from './ocr.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireRole } from '../../middlewares/rbac.js';
import { ocrLimiter } from '../../middlewares/rateLimiter.js';
import { recordAudit } from '../../middlewares/audit.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const hash = crypto.randomBytes(8).toString('hex');
    cb(null, `ficha-${Date.now()}-${hash}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas imagens (JPG, PNG, WEBP) ou PDF são aceitos.'));
    }
  },
});

const router = Router();

router.post(
  '/extract',
  authenticate,
  requireRole('admin', 'coordenador', 'atendente'),
  ocrLimiter,
  upload.single('documento'),
  recordAudit('OCR_EXTRACT', 'digitized_documents'),
  extractDocument
);

router.get('/:id', authenticate, getDocumentById);

router.post(
  '/:id/confirm',
  authenticate,
  requireRole('admin', 'coordenador', 'atendente'),
  recordAudit('OCR_CONFIRM', 'digitized_documents'),
  confirmDocument
);

router.post(
  '/:id/reject',
  authenticate,
  requireRole('admin', 'coordenador', 'atendente'),
  recordAudit('OCR_REJECT', 'digitized_documents'),
  rejectDocument
);

export default router;
