import { Request, Response } from 'express';
import { dbAccess } from '../../db/database.js';

export async function listEnrollments(_req: Request, res: Response): Promise<void> {
  const db = dbAccess.getMemoryDb();

  const enriched = db.enrollments.map((e) => {
    const student = db.students.find((s) => s.id === e.student_id);
    const sport = db.sports.find((sp) => sp.id === e.sports_id);
    const cls = e.class_id ? db.classes.find((c) => c.id === e.class_id) : null;
    return {
      ...e,
      aluno_nome: student ? student.nome_completo : 'Aluno',
      matricula_numero: student ? student.matricula_numero : '',
      modalidade_nome: sport ? sport.nome : '',
      turma_nome: cls ? cls.nome : '',
    };
  });

  res.json({ enrollments: enriched });
}

export async function updateEnrollmentStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, observacoes } = req.body;
  const db = dbAccess.getMemoryDb();

  const enrollment = db.enrollments.find((e) => e.id === id);
  if (!enrollment) {
    res.status(404).json({ error: 'Matrícula não encontrada' });
    return;
  }

  enrollment.status = status;
  if (status === 'cancelada') {
    enrollment.data_cancelamento = new Date().toISOString().split('T')[0];
  } else if (status === 'ativa') {
    enrollment.data_cancelamento = null;
  }

  if (observacoes) {
    enrollment.observacoes = observacoes;
  }
  enrollment.updated_at = new Date().toISOString();

  res.json({
    message: `Status da matrícula alterado para "${status}" com sucesso.`,
    enrollment,
  });
}

export async function reactivateEnrollment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = dbAccess.getMemoryDb();

  const enrollment = db.enrollments.find((e) => e.id === id);
  if (!enrollment) {
    res.status(404).json({ error: 'Matrícula não encontrada' });
    return;
  }

  enrollment.status = 'ativa';
  enrollment.data_cancelamento = null;
  enrollment.observacoes = (enrollment.observacoes || '') + ' [Reativada em ' + new Date().toLocaleDateString('pt-BR') + ']';
  enrollment.updated_at = new Date().toISOString();

  // Reativa também o aluno caso estivesse trancado/cancelado
  const student = db.students.find((s) => s.id === enrollment.student_id);
  if (student && student.status !== 'ativo') {
    student.status = 'ativo';
  }

  res.json({
    message: 'Matrícula reativada com sucesso!',
    enrollment,
  });
}
