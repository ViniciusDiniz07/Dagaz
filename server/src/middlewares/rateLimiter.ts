import rateLimit from 'express-rate-limit';

// Limitador estrito para tentativas de login (defesa contra ataques de força bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo de 10 tentativas por IP em 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas tentativas de login',
    message: 'Por medidas de segurança, aguarde 15 minutos antes de tentar novamente.',
  },
});

// Limitador para o endpoint de OCR / Gemini AI (prevenção de abuso de cota de IA)
export const ocrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // Máximo de 30 uploads/digitalizações por IP a cada 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de digitalizações atingido',
    message: 'Limite de processamento de documentos atingido. Aguarde alguns minutos.',
  },
});

// Limitador geral da API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Limite de requisições excedido',
    message: 'Muitas requisições originadas deste IP. Tente novamente em breve.',
  },
});
