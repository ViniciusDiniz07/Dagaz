/**
 * Logger seguro que sanitiza automaticamente campos confidenciais
 * Proteção contra vazamento de senhas, tokens e dados sensíveis de menores
 */

const REDACTED_KEYS = [
  'password',
  'senha',
  'password_hash',
  'token',
  'authorization',
  'jwt',
  'secret',
  'cookie',
  'key',
  'laudo',
  'doenca',
  'medicamento',
];

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (REDACTED_KEYS.some((k) => lowerKey.includes(k))) {
      sanitized[key] = '[REMOVIDO_POR_SEGURANCA]';
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.log(`[${timestamp}] [INFO] ${message}`, JSON.stringify(sanitizeObject(meta)));
    } else {
      console.log(`[${timestamp}] [INFO] ${message}`);
    }
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.warn(`[${timestamp}] [WARN] ${message}`, JSON.stringify(sanitizeObject(meta)));
    } else {
      console.warn(`[${timestamp}] [WARN] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[${timestamp}] [ERROR] ${message}`, JSON.stringify(sanitizeObject(errorDetails)));
  },
  audit: (action: string, meta: { userId?: string; userEmail?: string; entity: string; entityId?: string; result: 'SUCESSO' | 'FALHA' | 'NEGADO'; ip?: string }) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AUDIT] [${meta.result}] User: ${meta.userEmail || 'Anon'} | Action: ${action} | Entity: ${meta.entity} (${meta.entityId || 'N/A'}) | IP: ${meta.ip || 'Local'}`);
  },
};
