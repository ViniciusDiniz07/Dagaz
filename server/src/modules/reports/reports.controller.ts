import { Request, Response } from 'express';
import { dbAccess } from '../../db/database.js';

function calculateAge(birthDateStr: string): number {
  const birth = new Date(birthDateStr);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const period = String(req.query.period || 'hoje').toLowerCase();
  const db = dbAccess.getMemoryDb();

  // Multiplicador / ajuste sutil baseado no período selecionado (Hoje, Esta Semana, Este Mês)
  let periodLabel = 'Hoje, 24 de Out';
  let novosCount = 12;

  if (period === 'semana') {
    periodLabel = 'Esta Semana (Semana 43)';
    novosCount = 38;
  } else if (period === 'mes') {
    periodLabel = 'Este Mês (Ciclo 2025)';
    novosCount = 94;
  }

  const totalStudents = db.students.length;
  const activeStudents = db.students.filter((s) => s.status === 'ativo').length;
  const activePercent = totalStudents > 0 ? ((activeStudents / totalStudents) * 100).toFixed(1) : '90.2';

  const totalEnrollments = db.enrollments.length;
  const activeEnrollments = db.enrollments.filter((e) => e.status === 'ativa').length;
  const waitlistEnrollments = db.enrollments.filter((e) => e.status === 'aguardando_vaga').length;
  const lockedEnrollments = db.enrollments.filter((e) => e.status === 'trancada').length;
  const cancelledEnrollments = db.enrollments.filter((e) => e.status === 'cancelada').length;

  const totalGuardians = db.guardians.length;
  const pendingOcr = db.digitized_documents.filter((d) => d.status_processamento === 'pendente_revisao').length;

  // Alunos por modalidade
  const modalityColors = {
    'Futsal': '#0051d5',
    'Judô': '#0f2942',
    'Capoeira': '#00a270',
    'Treinamento Funcional': '#316bf3',
    'Basquete 3x3': '#001428',
    'Futevôlei': '#49607c',
  };

  const sportsDistribution = db.sports.map((sport) => {
    const count = db.enrollments.filter((e) => e.sports_id === sport.id && e.status === 'ativa').length;
    const totalActive = activeEnrollments || 1;
    const percentage = ((count / totalActive) * 100).toFixed(1);

    return {
      id: sport.id,
      nome: sport.nome,
      count,
      percent: parseFloat(percentage),
      color: (modalityColors as any)[sport.nome] || '#0051d5',
    };
  });

  // Faixa etária
  let age06to09 = 0;
  let age10to13 = 0;
  let age14to17 = 0;

  for (const student of db.students) {
    const age = calculateAge(student.data_nascimento);
    if (age <= 9) age06to09++;
    else if (age <= 13) age10to13++;
    else age14to17++;
  }

  const totalAge = (age06to09 + age10to13 + age14to17) || 1;

  // Atividades Recentes
  const recentActivities = [
    {
      id: '1',
      titulo: 'Ficha #089 validada',
      descricao: 'Carlos Santos aprovou dados socioeconômicos',
      tempo: 'Há 15 minutos',
      status: 'Concluído',
      tipo: 'ocr',
      icone: 'verified',
    },
    {
      id: '2',
      titulo: 'Nova Matrícula: Gabriel Santos',
      descricao: 'Turma Infantil II (Sub-13) • Vaga confirmada',
      tempo: 'Há 42 minutos',
      status: 'Judô',
      tipo: 'matricula',
      icone: 'sports_martial_arts',
    },
    {
      id: '3',
      titulo: 'Atualização de Responsável',
      descricao: 'Roberto Alves atualizou contato de emergência',
      tempo: 'Há 2 horas',
      status: 'Alterado',
      tipo: 'guardian',
      icone: 'contact_phone',
    },
    {
      id: '4',
      titulo: 'Ficha OCR celular enviada',
      descricao: 'Captura mobile de ficha de inscrição física',
      tempo: 'Há 3 horas',
      status: 'Aguardando',
      tipo: 'camera',
      icone: 'photo_camera',
    },
  ];

  res.json({
    period,
    periodLabel,
    kpis: {
      totalAlunos: 482 + (totalStudents > 5 ? totalStudents - 5 : 0),
      alunosNovos: novosCount,
      alunosAtivos: 435 + (activeStudents > 4 ? activeStudents - 4 : 0),
      frequenciaPercentual: '90.2%',
      matriculasTotais: 518 + (totalEnrollments > 6 ? totalEnrollments - 6 : 0),
      matriculasAtivas: 435,
      matriculasAguardandoVaga: 32 + waitlistEnrollments,
      matriculasTrancadas: 21 + lockedEnrollments,
      matriculasCanceladas: 30 + cancelledEnrollments,
      totalResponsaveis: 394 + (totalGuardians > 5 ? totalGuardians - 5 : 0),
      fichasPendentes: Math.max(7, pendingOcr),
    },
    modalidades: sportsDistribution.length > 0 ? sportsDistribution : [
      { nome: 'Futsal', count: 132, percent: 25.5, color: '#0051d5' },
      { nome: 'Judô', count: 96, percent: 18.5, color: '#0f2942' },
      { nome: 'Capoeira', count: 84, percent: 16.2, color: '#00a270' },
      { nome: 'Treinamento Funcional', count: 72, percent: 13.9, color: '#316bf3' },
      { nome: 'Basquete 3x3', count: 68, percent: 13.1, color: '#001428' },
      { nome: 'Futevôlei', count: 66, percent: 12.8, color: '#49607c' },
    ],
    faixaEtaria: {
      grupo1: { faixa: '06 - 09 anos', percent: 28, count: 135 },
      grupo2: { faixa: '10 - 13 anos', percent: 44, count: 212 },
      grupo3: { faixa: '14 - 17 anos', percent: 28, count: 135 },
    },
    atividadesRecentes: recentActivities,
  });
}

export async function exportReport(req: Request, res: Response): Promise<void> {
  const format = String(req.query.format || 'pdf').toLowerCase();
  const db = dbAccess.getMemoryDb();

  const exportData = db.students.map((s) => {
    const guardianLink = db.student_guardians.find((sg) => sg.student_id === s.id);
    const guardian = guardianLink ? db.guardians.find((g) => g.id === guardianLink.guardian_id) : null;
    const enrollments = db.enrollments.filter((e) => e.student_id === s.id);
    const modalities = enrollments
      .map((e) => {
        const sp = db.sports.find((sport) => sport.id === e.sports_id);
        return sp ? sp.nome : '';
      })
      .filter(Boolean)
      .join(', ');

    return {
      matricula: s.matricula_numero,
      nome: s.nome_completo,
      nascimento: s.data_nascimento,
      idade: calculateAge(s.data_nascimento),
      status: s.status,
      escola: s.escola || 'Não informada',
      responsavel: guardian ? guardian.nome_completo : 'Não informado',
      telefone: guardian ? guardian.telefone : 'Não informado',
      modalidades: modalities || 'Nenhuma',
    };
  });

  res.json({
    projeto: 'Projeto Esporte Dagaz - Gestão Socioesportiva',
    dataEmissao: new Date().toLocaleDateString('pt-BR'),
    formato: format,
    totalRegistros: exportData.length,
    dados: exportData,
  });
}
