import { createApp } from './app.js';
import { env } from './config/env.js';
import { initDatabase } from './db/database.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    logger.info('Iniciando Sistema de Gestão Socioesportiva - Condomínio Cultural e Esportivo...');

    // Inicializa o banco de dados (PostgreSQL remoto ou motor resiliente local)
    await initDatabase();

    const app = createApp();

    app.listen(env.PORT, () => {
      logger.info(`Servidor API operando com sucesso na porta ${env.PORT}`);
      logger.info(`Documentação e Health Check em http://localhost:${env.PORT}/api/health`);
    });
  } catch (err) {
    logger.error('Falha crítica durante a inicialização do servidor:', err);
    process.exit(1);
  }
}

bootstrap();
