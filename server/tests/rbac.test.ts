import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../src/middlewares/rbac.js';
import { Request, Response } from 'express';

describe('Middleware RBAC (Role-Based Access Control)', () => {
  const createMockReqRes = (user: any) => {
    const req = { user } as unknown as Request;
    const res = {
      statusCode: 200,
      jsonResponse: null as any,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.jsonResponse = data;
        return this;
      },
    } as unknown as Response;
    const next = vi.fn();

    return { req, res, next };
  };

  it('deve retornar 401 Não Autenticado quando o usuário não estiver presente no req', () => {
    const { req, res, next } = createMockReqRes(null);
    const middleware = requireRole('admin', 'coordenador');

    middleware(req, res, next);

    expect((res as any).statusCode).toBe(401);
    expect((res as any).jsonResponse.error).toBe('Não autenticado');
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 403 Acesso Negado quando o perfil do usuário não tiver permissão', () => {
    const { req, res, next } = createMockReqRes({
      userId: 'user-1',
      role: 'consulta',
      nome: 'Visitante',
    });
    const middleware = requireRole('admin', 'coordenador');

    middleware(req, res, next);

    expect((res as any).statusCode).toBe(403);
    expect((res as any).jsonResponse.error).toBe('Acesso negado');
    expect((res as any).jsonResponse.message).toContain('consulta');
    expect(next).not.toHaveBeenCalled();
  });

  it('deve permitir acesso e chamar next() quando o perfil for atendente em rota permitida', () => {
    const { req, res, next } = createMockReqRes({
      userId: 'user-2',
      role: 'atendente',
      nome: 'Atendente Dagaz',
    });
    const middleware = requireRole('admin', 'coordenador', 'atendente');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect((res as any).statusCode).toBe(200);
  });

  it('deve permitir acesso exclusivo de admin em rotas restritas como exclusão de dados', () => {
    const { req, res, next } = createMockReqRes({
      userId: 'admin-1',
      role: 'admin',
      nome: 'Administrador Geral',
    });
    const middleware = requireRole('admin');

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
