import { Request, Response } from 'express';
import { dbAccess } from '../../db/database.js';

export async function listSports(_req: Request, res: Response): Promise<void> {
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
