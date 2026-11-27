import { Request, Response } from 'express';
import { dbAccess, query } from '../../db/database.js';

type ActivityRow = {
  id: string;
  acao: string;
  entidade: string;
  user_email: string | null;
  resultado: string;
  data_hora: string | Date;
};

function calculateAge(birthDateValue: string | Date): number {
  const birthDate =
    typeof birthDateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(birthDateValue)
      ? new Date(`${birthDateValue}T00:00:00`)
      : new Date(birthDateValue);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return Math.max(0, age);
}

function getPeriodStart(period: string, now: Date): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  if (period === 'semana') {
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
  } else if (period === 'mes') {
    start.setDate(1);
  }

  return start;
}

function getPeriodLabel(period: string, now: Date): string {
  if (period === 'semana') return 'Esta semana';
  if (period === 'mes') {
    return `Este mês (${now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})`;
  }
  return `Hoje, ${now.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
}

function percentage(value: number, total: number): number {
  return total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;
}

function formatElapsed(value: string | Date, now: Date): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Data indisponível';

  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - timestamp) / 60000));
  if (elapsedMinutes < 1) return 'Agora';
  if (elapsedMinutes < 60) return `Há ${elapsedMinutes} min`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `Há ${elapsedHours} h`;

  const elapsedDays = Math.floor(elapsedHours / 24);
  return `Há ${elapsedDays} dia${elapsedDays === 1 ? '' : 's'}`;
}

function mapActivities(rows: ActivityRow[], now: Date) {
  return rows.map((row) => ({
    id: row.id,
    titulo: `${row.acao} - ${row.entidade}`,
    descricao: row.user_email || 'Atividade registrada no sistema',
    tempo: formatElapsed(row.data_hora, now),
    status: row.resultado,
    tipo: row.entidade,
    icone: 'history',
  }));
}

function getAgeGroups(birthDates: Array<string | Date>) {
  const counts = [0, 0, 0];

  for (const birthDate of birthDates) {
    const age = calculateAge(birthDate);
    if (age >= 6 && age <= 9) counts[0]++;
    else if (age >= 10 && age <= 13) counts[1]++;
    else if (age >= 14 && age <= 17) counts[2]++;
  }

  const total = counts.reduce((sum, count) => sum + count, 0);
  return {
    grupo1: { faixa: '06 - 09 anos', count: counts[0], percent: percentage(counts[0], total) },
    grupo2: { faixa: '10 - 13 anos', count: counts[1], percent: percentage(counts[1], total) },
    grupo3: { faixa: '14 - 17 anos', count: counts[2], percent: percentage(counts[2], total) },
  };
}

const modalityColors: Record<string, string> = {
  Futsal: '#0051d5',
  'Judô': '#0f2942',
  Capoeira: '#00a270',
  'Treinamento Funcional': '#316bf3',
  'Basquete 3x3': '#001428',
  'Futevôlei': '#49607c',
};

async function getPostgresDashboardData(startDate: Date) {
  const [studentsResult, enrollmentsResult, guardiansResult, documentsResult, sportsResult, ageResult, activitiesResult] =
    await Promise.all([
      query<{
        total: number;
        ativos: number;
        novos: number;
      }>(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'ativo')::int AS ativos,
           COUNT(*) FILTER (WHERE created_at >= $1::timestamptz)::int AS novos
         FROM students`,
        [startDate.toISOString()]
      ),
      query<{
        total: number;
        ativas: number;
        aguardando: number;
        trancadas: number;
        canceladas: number;
      }>(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE status = 'ativa')::int AS ativas,
           COUNT(*) FILTER (WHERE status = 'aguardando_vaga')::int AS aguardando,
           COUNT(*) FILTER (WHERE status = 'trancada')::int AS trancadas,
           COUNT(*) FILTER (WHERE status = 'cancelada')::int AS canceladas
         FROM enrollments`
      ),
      query<{ total: number }>('SELECT COUNT(*)::int AS total FROM guardians'),
      query<{ total: number }>(
        `SELECT COUNT(*)::int AS total
         FROM digitized_documents
         WHERE status_processamento IN ('pendente', 'pendente_revisao')`
      ),
      query<{ id: string; nome: string; count: number }>(
        `SELECT s.id, s.nome, COUNT(e.id)::int AS count
         FROM sports s
         LEFT JOIN enrollments e ON e.sports_id = s.id AND e.status = 'ativa'
         WHERE s.ativo = TRUE
         GROUP BY s.id, s.nome
         ORDER BY s.nome`
      ),
      query<{ grupo1: number; grupo2: number; grupo3: number }>(
        `SELECT
           COUNT(*) FILTER (
             WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 6 AND 9
           )::int AS grupo1,
           COUNT(*) FILTER (
             WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 10 AND 13
           )::int AS grupo2,
           COUNT(*) FILTER (
             WHERE EXTRACT(YEAR FROM AGE(CURRENT_DATE, data_nascimento)) BETWEEN 14 AND 17
           )::int AS grupo3
         FROM students`
      ),
      query<ActivityRow>(
        `SELECT id, acao, entidade, user_email, resultado, data_hora
         FROM audit_logs
         ORDER BY data_hora DESC
         LIMIT 4`
      ),
    ]);

  const students = studentsResult.rows[0];
  const enrollments = enrollmentsResult.rows[0];
  const totalStudents = Number(students?.total || 0);
  const activeEnrollments = Number(enrollments?.ativas || 0);
  const ageGroups = ageResult.rows[0] || { grupo1: 0, grupo2: 0, grupo3: 0 };
  const totalInAgeGroups = Number(ageGroups.grupo1 || 0) + Number(ageGroups.grupo2 || 0) + Number(ageGroups.grupo3 || 0);

  return {
    kpis: {
      totalAlunos: totalStudents,
      alunosNovos: Number(students?.novos || 0),
      alunosAtivos: Number(students?.ativos || 0),
      percentualAlunosAtivos: percentage(Number(students?.ativos || 0), totalStudents),
      matriculasTotais: Number(enrollments?.total || 0),
      matriculasAtivas: activeEnrollments,
      matriculasAguardandoVaga: Number(enrollments?.aguardando || 0),
      matriculasTrancadas: Number(enrollments?.trancadas || 0),
      matriculasCanceladas: Number(enrollments?.canceladas || 0),
      totalResponsaveis: Number(guardiansResult.rows[0]?.total || 0),
      fichasPendentes: Number(documentsResult.rows[0]?.total || 0),
    },
    modalidades: sportsResult.rows.map((sport) => ({
      id: sport.id,
      nome: sport.nome,
      count: Number(sport.count || 0),
      percent: percentage(Number(sport.count || 0), activeEnrollments),
      color: modalityColors[sport.nome] || '#0051d5',
    })),
    faixaEtaria: {
      grupo1: {
        faixa: '06 - 09 anos',
        count: Number(ageGroups.grupo1 || 0),
        percent: percentage(Number(ageGroups.grupo1 || 0), totalInAgeGroups),
      },
      grupo2: {
        faixa: '10 - 13 anos',
        count: Number(ageGroups.grupo2 || 0),
        percent: percentage(Number(ageGroups.grupo2 || 0), totalInAgeGroups),
      },
      grupo3: {
        faixa: '14 - 17 anos',
        count: Number(ageGroups.grupo3 || 0),
        percent: percentage(Number(ageGroups.grupo3 || 0), totalInAgeGroups),
      },
    },
    atividadesRecentes: mapActivities(activitiesResult.rows, new Date()),
  };
}

function getMemoryDashboardData(startDate: Date) {
  const db = dbAccess.getMemoryDb();
  const totalStudents = db.students.length;
  const activeStudents = db.students.filter((student) => student.status === 'ativo').length;
  const activeEnrollments = db.enrollments.filter((enrollment) => enrollment.status === 'ativa').length;
  const newStudents = db.students.filter((student) => new Date(student.created_at) >= startDate).length;
  const ages = getAgeGroups(db.students.map((student) => student.data_nascimento));

  const sports = db.sports
    .filter((sport) => sport.ativo)
    .map((sport) => {
      const count = db.enrollments.filter(
        (enrollment) => enrollment.sports_id === sport.id && enrollment.status === 'ativa'
      ).length;

      return {
        id: sport.id,
        nome: sport.nome,
        count,
        percent: percentage(count, activeEnrollments),
        color: modalityColors[sport.nome] || '#0051d5',
      };
    });

  const activities = [...db.audit_logs]
    .sort((left, right) => new Date(right.data_hora).getTime() - new Date(left.data_hora).getTime())
    .slice(0, 4);

  return {
    kpis: {
      totalAlunos: totalStudents,
      alunosNovos: newStudents,
      alunosAtivos: activeStudents,
      percentualAlunosAtivos: percentage(activeStudents, totalStudents),
      matriculasTotais: db.enrollments.length,
      matriculasAtivas: activeEnrollments,
      matriculasAguardandoVaga: db.enrollments.filter((enrollment) => enrollment.status === 'aguardando_vaga').length,
      matriculasTrancadas: db.enrollments.filter((enrollment) => enrollment.status === 'trancada').length,
      matriculasCanceladas: db.enrollments.filter((enrollment) => enrollment.status === 'cancelada').length,
      totalResponsaveis: db.guardians.length,
      fichasPendentes: db.digitized_documents.filter(
        (document) =>
          document.status_processamento === 'pendente' ||
          document.status_processamento === 'pendente_revisao'
      ).length,
    },
    modalidades: sports,
    faixaEtaria: ages,
    atividadesRecentes: mapActivities(activities, new Date()),
  };
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const requestedPeriod = String(req.query.period || 'hoje').toLowerCase();
  const period = ['hoje', 'semana', 'mes'].includes(requestedPeriod) ? requestedPeriod : 'hoje';
  const now = new Date();
  const startDate = getPeriodStart(period, now);
  const data = dbAccess.isPostgres()
    ? await getPostgresDashboardData(startDate)
    : getMemoryDashboardData(startDate);

  res.json({
    period,
    periodLabel: getPeriodLabel(period, now),
    ...data,
  });
}

export async function exportReport(req: Request, res: Response): Promise<void> {
  const format = String(req.query.format || 'pdf').toLowerCase();
  let exportData: Array<Record<string, unknown>>;

  if (dbAccess.isPostgres()) {
    const result = await query<{
      matricula_numero: string;
      nome_completo: string;
      data_nascimento: string | Date;
      status: string;
      escola: string | null;
      responsavel: string | null;
      telefone: string | null;
      modalidades: string | null;
    }>(
      `SELECT
         s.matricula_numero,
         s.nome_completo,
         s.data_nascimento,
         s.status,
         s.escola,
         g.nome_completo AS responsavel,
         g.telefone,
         STRING_AGG(DISTINCT sp.nome, ', ') AS modalidades
       FROM students s
       LEFT JOIN LATERAL (
         SELECT guardian.nome_completo, guardian.telefone
         FROM student_guardians sg
         JOIN guardians guardian ON guardian.id = sg.guardian_id
         WHERE sg.student_id = s.id
         ORDER BY sg.principal DESC, sg.created_at
         LIMIT 1
       ) g ON TRUE
       LEFT JOIN enrollments e ON e.student_id = s.id
       LEFT JOIN sports sp ON sp.id = e.sports_id
       GROUP BY s.id, g.nome_completo, g.telefone
       ORDER BY s.nome_completo`
    );

    exportData = result.rows.map((student) => ({
      matricula: student.matricula_numero,
      nome: student.nome_completo,
      nascimento: student.data_nascimento,
      idade: calculateAge(student.data_nascimento),
      status: student.status,
      escola: student.escola || 'Não informada',
      responsavel: student.responsavel || 'Não informado',
      telefone: student.telefone || 'Não informado',
      modalidades: student.modalidades || 'Nenhuma',
    }));
  } else {
    const db = dbAccess.getMemoryDb();
    exportData = db.students.map((student) => {
      const guardianLink = db.student_guardians.find((link) => link.student_id === student.id);
      const guardian = guardianLink
        ? db.guardians.find((item) => item.id === guardianLink.guardian_id)
        : null;
      const modalities = db.enrollments
        .filter((enrollment) => enrollment.student_id === student.id)
        .map((enrollment) => db.sports.find((sport) => sport.id === enrollment.sports_id)?.nome || '')
        .filter(Boolean)
        .join(', ');

      return {
        matricula: student.matricula_numero,
        nome: student.nome_completo,
        nascimento: student.data_nascimento,
        idade: calculateAge(student.data_nascimento),
        status: student.status,
        escola: student.escola || 'Não informada',
        responsavel: guardian?.nome_completo || 'Não informado',
        telefone: guardian?.telefone || 'Não informado',
        modalidades: modalities || 'Nenhuma',
      };
    });
  }

  res.json({
    projeto: 'Condomínio Cultural e Esportivo - Gestão Socioesportiva',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    formato: format,
    totalRegistros: exportData.length,
    dados: exportData,
  });
}
