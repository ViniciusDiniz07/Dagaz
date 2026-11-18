import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../../db/database.js';
import { signAccessToken } from '../../utils/jwt.js';
import { logger } from '../../utils/logger.js';
import { loginSchema } from './auth.schema.js';

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.parse(req.body);
  const { email, password } = parsed;

  const result = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  const user = result.rows[0];

  // Mensagem segura idêntica caso usuário não exista ou senha esteja incorreta
  const INVALID_CREDENTIALS_MSG = 'E-mail ou chave de acesso incorretos.';

  if (!user) {
    logger.warn(`Tentativa de login com e-mail inexistente: ${email}`);
    res.status(401).json({
      error: 'Não autorizado',
      message: INVALID_CREDENTIALS_MSG,
    });
    return;
  }

  if (user.status === 'bloqueado' || (user.locked_until && new Date(user.locked_until) > new Date())) {
    res.status(403).json({
      error: 'Conta temporariamente bloqueada',
      message: 'Múltiplas tentativas incorretas. Contate a administração do polo para desbloqueio.',
    });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    const failedAttempts = (user.failed_login_attempts || 0) + 1;
    let lockedUntil: Date | null = null;
    let status = user.status;

    if (failedAttempts >= 5) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de bloqueio
      status = 'bloqueado';
      logger.warn(`Conta ${email} bloqueada por 15 minutos após 5 tentativas falhas.`);
    }

    await query(
      'UPDATE users SET failed_login_attempts = $1, locked_until = $2, status = $3 WHERE id = $4',
      [failedAttempts, lockedUntil, status, user.id]
    );

    res.status(401).json({
      error: 'Não autorizado',
      message: INVALID_CREDENTIALS_MSG,
    });
    return;
  }

  // Login com sucesso: reseta tentativas
  await query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, status = $1 WHERE id = $2', [
    'ativo',
    user.id,
  ]);

  const token = signAccessToken({
    userId: user.id,
    email: user.email,
    nome: user.nome,
    role: user.role,
  });

  logger.info(`Usuário logado com sucesso: ${user.email} (${user.role})`);

  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
    },
    expiresIn: '8h',
  });
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Não autenticado' });
    return;
  }

  const result = await query('SELECT id, nome, email, role, status, avatar_url, created_at FROM users WHERE id = $1', [
    req.user.userId,
  ]);
  const user = result.rows[0];

  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  res.json({ user });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // Encerramento de sessão
  res.json({
    message: 'Sessão encerrada com sucesso.',
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  // Retorna instruções seguras conforme modal institucional
  res.json({
    message: 'Por motivos de segurança e proteção dos dados infanto-juvenis, entre em contato com o Administrador do Polo ou solicite redefinição com a coordenação geral.',
    supportEmail: 'suporte@dagaz.org.br',
  });
}
