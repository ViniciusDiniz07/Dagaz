import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbAccess, query } from '../../db/database.js';
import { createGuardianSchema } from './guardians.schema.js';
import { maskCPF } from '../../config/crypto.js';

export async function searchGuardians(req: Request, res: Response): Promise<void> {
  const queryParam = String(req.query.q || '').trim().toLowerCase();

  if (dbAccess.isPostgres()) {
    const result = await query(
      `SELECT * FROM guardians
       WHERE $1 = ''
          OR LOWER(nome_completo) LIKE $2
          OR regexp_replace(cpf, '[^0-9]', '', 'g') LIKE $3
          OR telefone LIKE $2
       ORDER BY nome_completo
       LIMIT 100`,
      [queryParam, `%${queryParam}%`, `%${queryParam.replace(/\D/g, '')}%`]
    );
    res.json({
      guardians: result.rows.map((guardian) => ({
        ...guardian,
        cpfMascara: maskCPF(guardian.cpf),
      })),
    });
    return;
  }

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

  if (dbAccess.isPostgres()) {
    const guardianResult = await query('SELECT * FROM guardians WHERE id = $1', [id]);
    const guardian = guardianResult.rows[0];
    if (!guardian) {
      res.status(404).json({ error: 'Responsável não encontrado' });
      return;
    }

    const [studentResult, familyResult] = await Promise.all([
      query(
        `SELECT s.*, sg.parentesco
         FROM student_guardians sg
         JOIN students s ON s.id = sg.student_id
         WHERE sg.guardian_id = $1
         ORDER BY s.nome_completo`,
        [id]
      ),
      query('SELECT * FROM family_members WHERE guardian_id = $1 ORDER BY created_at', [id]),
    ]);
    res.json({
      guardian: { ...guardian, cpfMascara: maskCPF(guardian.cpf) },
      students: studentResult.rows,
      family: familyResult.rows,
    });
    return;
  }

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

  if (dbAccess.isPostgres()) {
    const existing = await query(
      `SELECT id FROM guardians
       WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g')
       LIMIT 1`,
      [parsed.cpf]
    );
    if (existing.rows[0]) {
      res.status(409).json({
        error: 'CPF já cadastrado',
        message: 'Já existe um responsável cadastrado com este número de CPF.',
        guardianId: existing.rows[0].id,
      });
      return;
    }

    const guardian = await query(
      `INSERT INTO guardians (
        nome_completo, cpf, rg, nis, telefone, email, endereco, numero, bairro, cidade, cep,
        parentesco, ocupacao, escolaridade, renda_familiar_faixa,
        beneficiario_programa_social, programa_social
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        parsed.nome_completo,
        parsed.cpf,
        parsed.rg || null,
        parsed.nis || null,
        parsed.telefone,
        parsed.email || null,
        parsed.endereco || null,
        parsed.numero || null,
        parsed.bairro || null,
        parsed.cidade,
        parsed.cep || null,
        parsed.parentesco || null,
        parsed.ocupacao,
        parsed.escolaridade,
        parsed.renda_familiar_faixa,
        parsed.beneficiario_programa_social,
        parsed.programa_social || null,
      ]
    );
    res.status(201).json({
      message: 'Responsável cadastrado com sucesso',
      guardian: guardian.rows[0],
    });
    return;
  }

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
