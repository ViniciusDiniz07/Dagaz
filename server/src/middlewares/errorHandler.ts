import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      campo: e.path.join('.'),
      mensagem: e.message,
    }));

    res.status(400).json({
      error: 'Dados inválidos',
      message: 'Erros de validação nos campos informados',
      detalhes: formattedErrors,
    });
    return;
  }

  // Erros de upload Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: 'Arquivo muito grande',
      message: 'O tamanho máximo permitido para o documento é de 10 MB.',
    });
    return;
  }

  // Log seguro do erro interno
  logger.error(`Erro não tratado na rota ${req.method} ${req.path}:`, err);

  // Resposta segura (sem expor stack traces ou detalhes do banco)
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: 'Ocorreu uma falha no processamento da solicitação. Tente novamente mais tarde.',
  });
}
