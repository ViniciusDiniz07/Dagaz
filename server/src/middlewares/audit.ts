import { Request, Response, NextFunction } from 'express';
import { query } from '../db/database.js';
import { logger } from '../utils/logger.js';

export function recordAudit(acao: string, entidade: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Intercepta a finalização da resposta
    const originalSend = res.send;

    res.send = function (body) {
      const statusCode = res.statusCode;
      const resultado = statusCode >= 200 && statusCode < 400 ? 'SUCESSO' : statusCode === 403 || statusCode === 401 ? 'NEGADO' : 'FALHA';

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Desconhecido';
      const userId = req.user?.userId || null;
      const userEmail = req.user?.email || null;
      const entidadeId = req.params?.id || req.body?.id || null;

      // Executa registro de auditoria de forma assíncrona sem travar a resposta
      query(
        `INSERT INTO audit_logs (user_id, user_email, acao, entidade, entidade_id, ip, user_agent, resultado, detalhes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId,
          userEmail,
          acao,
          entidade,
          entidadeId,
          ip,
          userAgent,
          resultado,
          JSON.stringify({ path: req.path, method: req.method, statusCode }),
        ]
      ).catch((err) => {
        logger.error('Falha ao gravar log de auditoria no banco:', err);
      });

      logger.audit(acao, {
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        entity: entidade,
        entityId: entidadeId || undefined,
        result: resultado,
        ip,
      });

      return originalSend.call(this, body);
    };

    next();
  };
}
