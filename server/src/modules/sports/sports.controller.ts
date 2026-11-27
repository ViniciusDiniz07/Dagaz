import { Request, Response } from 'express';
import { dbAccess, query } from '../../db/database.js';

export async function listSports(_req: Request, res: Response): Promise<void> {
  if (dbAccess.isPostgres()) {
    const result = await query(`
      SELECT s.*, COUNT(e.id)::int AS "totalAlunos"
      FROM sports s
      LEFT JOIN enrollments e ON e.sports_id = s.id AND e.status = 'ativa'
      WHERE s.ativo = TRUE
      GROUP BY s.id
      ORDER BY s.nome
    `);
    res.json({ sports: result.rows });
    return;
  }

  const db = dbAccess.getMemoryDb();
  const sports = db.sports.filter((s) => s.ativo);

  // Calcula contagem de alunos matriculados por modalidade
  const sportsWithCounts = sports.map((s) => {
    const enrollmentsCount = db.enrollments.filter((e) => e.sports_id === s.id && e.status === 'ativa').length;
    return {
      ...s,
      totalAlunos: enrollmentsCount,
    };
  });

  res.json({ sports: sportsWithCounts });
}

export async function listClasses(req: Request, res: Response): Promise<void> {
  if (dbAccess.isPostgres()) {
    const params: string[] = [];
    let sportFilter = '';
    if (typeof req.query.sportId === 'string' && req.query.sportId.trim()) {
      params.push(req.query.sportId.trim());
      sportFilter = 'AND c.sports_id = $1';
    }

    const result = await query(
      `
        SELECT c.*, s.nome AS "sportNome",
          COUNT(e.id)::int AS "vagasOcupadas",
          GREATEST(0, c.capacidade - COUNT(e.id)::int) AS "vagasRestantes"
        FROM classes c
        JOIN sports s ON s.id = c.sports_id
        LEFT JOIN enrollments e ON e.class_id = c.id AND e.status = 'ativa'
        WHERE c.ativo = TRUE ${sportFilter}
        GROUP BY c.id, s.nome
        ORDER BY s.nome, c.nome
      `,
      params
    );
    res.json({ classes: result.rows });
    return;
  }

  const db = dbAccess.getMemoryDb();
  let classes = db.classes.filter((c) => c.ativo);

  const sportId = req.query.sportId as string;
  if (sportId) {
    classes = classes.filter((c) => c.sports_id === sportId);
  }

  const enriched = classes.map((c) => {
    const enrolled = db.enrollments.filter((e) => e.class_id === c.id && e.status === 'ativa').length;
    const sport = db.sports.find((s) => s.id === c.sports_id);
    return {
      ...c,
      sportNome: sport ? sport.nome : '',
      vagasOcupadas: enrolled,
      vagasRestantes: Math.max(0, c.capacidade - enrolled),
    };
  });

  res.json({ classes: enriched });
}
