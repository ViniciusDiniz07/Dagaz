import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('E-mail institucional inválido').max(255),
  password: z.string().min(6, 'A chave de acesso deve conter no mínimo 6 caracteres').max(100),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail institucional inválido'),
});
