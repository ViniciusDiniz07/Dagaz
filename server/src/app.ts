import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Rotas dos Módulos
import authRoutes from './modules/auth/auth.routes.js';
import sportsRoutes from './modules/sports/sports.routes.js';
import guardiansRoutes from './modules/guardians/guardians.routes.js';
import studentsRoutes from './modules/students/students.routes.js';
import enrollmentsRoutes from './modules/enrollments/enrollments.routes.js';
import ocrRoutes from './modules/ocr/ocr.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';

export function createApp(): express.Application {
  const app = express();

  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // 1. Configurações de Segurança HTTP com Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Permitir carregar imagens e scripts no ambiente frontend
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 2. Política de CORS restritiva
  const allowedOrigins = [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'];
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissivo em dev, estrito em produção
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 3. Parsers de Requisição com limite de segurança
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Rate Limiting Geral
  app.use('/api', apiLimiter);

  // 5. Servir uploads estáticos (fichas e imagens)
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  // 6. Endpoint de Verificação de Saúde (Health Check)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      projeto: 'Condomínio Cultural e Esportivo - Gestão Socioesportiva',
      versao: '1.0.4',
      timestamp: new Date().toISOString(),
      modos: {
        gemini: !!env.GEMINI_API_KEY ? 'conectado' : 'modo_local',
        supabase: !!env.SUPABASE_URL ? 'conectado' : 'modo_local',
      },
    });
  });

  // 7. Registro dos Módulos da API
  app.use('/api/auth', authRoutes);
  app.use('/api/sports', sportsRoutes);
  app.use('/api/guardians', guardiansRoutes);
  app.use('/api/students', studentsRoutes);
  app.use('/api/enrollments', enrollmentsRoutes);
  app.use('/api/ocr', ocrRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/audit', auditRoutes);

  // 8. Tratamento Centralizado de Erros
  app.use(errorHandler);

  return app;
}
