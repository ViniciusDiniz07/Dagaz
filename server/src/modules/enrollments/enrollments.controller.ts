import { Request, Response } from 'express';
import { dbAccess, query, withTransaction } from '../../db/database.js';

export async function listEnrollments(_req: Request, res: Response): Promise<void> {
  if (dbAccess.isPostgres()) {
    const result = await query(`
      SELECT e.*,
        s.nome_completo AS aluno_nome,
        s.matricula_numero,
        sp.nome AS modalidade_nome,
        c.nome AS turma_nome
      FROM enrollments e
      JOIN students s ON s.id = e.student_id
      JOIN sports sp ON sp.id = e.sports_id
      LEFT JOIN classes c ON c.id = e.class_id
      ORDER BY e.data_matricula DESC, s.nome_completo
    `);
    res.json({ enrollments: result.rows });
    return;
  }

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

  if (dbAccess.isPostgres()) {
    const allowedStatuses = ['ativa', 'aguardando_vaga', 'trancada', 'cancelada'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: 'Status de matrícula inválido' });
      return;
    }

    const result = await query(
      `UPDATE enrollments
       SET status = $1,
           data_cancelamento = CASE WHEN $1 = 'cancelada' THEN CURRENT_DATE ELSE NULL END,
           observacoes = COALESCE($2, observacoes),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, observacoes || null, id]
    );
    if (!result.rows[0]) {
      res.status(404).json({ error: 'Matrícula não encontrada' });
      return;
    }

    res.json({
      message: `Status da matrícula alterado para "${status}" com sucesso.`,
      enrollment: result.rows[0],
    });
    return;
  }

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

  if (dbAccess.isPostgres()) {
    const enrollment = await withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE enrollments
         SET status = 'ativa',
             data_cancelamento = NULL,
             observacoes = concat_ws(' ', NULLIF(observacoes, ''), '[Reativada em ' || to_char(CURRENT_DATE, 'DD/MM/YYYY') || ']'),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      if (!result.rows[0]) {
        return null;
      }

      await client.query(`UPDATE students SET status = 'ativo', updated_at = NOW() WHERE id = $1`, [
        result.rows[0].student_id,
      ]);
      return result.rows[0];
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Matrícula não encontrada' });
      return;
    }
    res.json({ message: 'Matrícula reativada com sucesso!', enrollment });
    return;
  }

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
