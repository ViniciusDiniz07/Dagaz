import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbAccess } from '../../db/database.js';
import { createGuardianSchema } from './guardians.schema.js';
import { maskCPF } from '../../config/crypto.js';

export async function searchGuardians(req: Request, res: Response): Promise<void> {
  const queryParam = String(req.query.q || '').trim().toLowerCase();
  const db = dbAccess.getMemoryDb();

  let guardians = [...db.guardians];

  if (queryParam) {
    guardians = guardians.filter(
      (g) =>
        g.nome_completo.toLowerCase().includes(queryParam) ||
        g.cpf.replace(/\D/g, '').includes(queryParam.replace(/\D/g, '')) ||
        (g.telefone && g.telefone.includes(queryParam))
    );
  }

  const sanitized = guardians.map((g) => ({
    ...g,
    cpfMascara: maskCPF(g.cpf),
  }));

  res.json({ guardians: sanitized });
}

export async function getGuardianById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = dbAccess.getMemoryDb();

  const guardian = db.guardians.find((g) => g.id === id);
  if (!guardian) {
    res.status(404).json({ error: 'Responsável não encontrado' });
    return;
  }

  // Busca alunos vinculados
  const studentLinks = db.student_guardians.filter((sg) => sg.guardian_id === id);
  const students = studentLinks.map((link) => {
    const student = db.students.find((s) => s.id === link.student_id);
    return {
      ...student,
      parentesco: link.parentesco,
    };
  });

  // Busca composição familiar
  const family = db.family_members.filter((f) => f.guardian_id === id);

  res.json({
    guardian: {
      ...guardian,
      cpfMascara: maskCPF(guardian.cpf),
    },
    students,
    family,
  });
}

export async function createGuardian(req: Request, res: Response): Promise<void> {
  const parsed = createGuardianSchema.parse(req.body);
  const db = dbAccess.getMemoryDb();

  // Verifica duplicidade por CPF
  const existing = db.guardians.find((g) => g.cpf.replace(/\D/g, '') === parsed.cpf.replace(/\D/g, ''));
  if (existing) {
    res.status(409).json({
      error: 'CPF já cadastrado',
      message: 'Já existe um responsável cadastrado com este número de CPF.',
      guardianId: existing.id,
    });
    return;
  }

  const newGuardian = {
    id: crypto.randomUUID(),
    ...parsed,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.guardians.push(newGuardian);

  res.status(201).json({
    message: 'Responsável cadastrado com sucesso',
    guardian: newGuardian,
  });
}
