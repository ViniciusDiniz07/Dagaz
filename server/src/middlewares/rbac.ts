import { Request, Response, NextFunction } from 'express';

export type UserRole = 'admin' | 'coordenador' | 'atendente' | 'consulta';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Não autenticado',
        message: 'Identificação de usuário necessária para prosseguir',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Acesso negado',
        message: `Seu perfil (${req.user.role}) não possui autorização para esta operação`,
      });
      return;
    }

    next();
  };
}
