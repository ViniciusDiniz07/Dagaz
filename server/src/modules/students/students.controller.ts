import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbAccess } from '../../db/database.js';
import { createStudentSchema, updateStudentSchema } from './students.schema.js';
import { maskCPF, maskPhone } from '../../config/crypto.js';

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

export async function listStudents(req: Request, res: Response): Promise<void> {
  const db = dbAccess.getMemoryDb();
  let students = [...db.students];

  const search = String(req.query.q || '').trim().toLowerCase();
  const modality = String(req.query.modality || '').trim();
  const status = String(req.query.status || '').trim().toLowerCase();
  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);

  // 1. Filtro por Busca Textual (Nome, CPF, Matrícula ou Responsável)
  if (search) {
    students = students.filter((s) => {
      const matchName = s.nome_completo.toLowerCase().includes(search);
      const matchMatricula = s.matricula_numero.toLowerCase().includes(search);
      const matchCpf = s.cpf && s.cpf.replace(/\D/g, '').includes(search.replace(/\D/g, ''));

      // Busca nos responsáveis vinculados
      const guardianLink = db.student_guardians.find((sg) => sg.student_id === s.id);
      const guardian = guardianLink ? db.guardians.find((g) => g.id === guardianLink.guardian_id) : null;
      const matchGuardian = guardian ? guardian.nome_completo.toLowerCase().includes(search) : false;

      return matchName || matchMatricula || matchCpf || matchGuardian;
    });
  }

  // 2. Filtro por Status da Matrícula / Aluno
  if (status && status !== 'todos') {
    students = students.filter((s) => {
      // Verifica se o aluno possui matrícula com o status especificado
      const studentEnrollments = db.enrollments.filter((e) => e.student_id === s.id);
      return studentEnrollments.some((e) => e.status.toLowerCase() === status) || s.status.toLowerCase() === status;
    });
  }

  // 3. Filtro por Modalidade Esportiva
  if (modality && modality !== 'todos') {
    const targetSport = db.sports.find((sp) => sp.nome.toLowerCase() === modality.toLowerCase());
    if (targetSport) {
      students = students.filter((s) => {
        return db.enrollments.some((e) => e.student_id === s.id && e.sports_id === targetSport.id);
      });
    }
  }

  const totalCount = students.length;
  const startIndex = (page - 1) * limit;
  const paginatedStudents = students.slice(startIndex, startIndex + limit);

  // Enriquece os dados para exibição idêntica aos cards do Figma (p3.HTML)
  const enriched = paginatedStudents.map((s) => {
    const age = calculateAge(s.data_nascimento);

    // Vínculo do responsável
    const link = db.student_guardians.find((sg) => sg.student_id === s.id);
    const guardian = link ? db.guardians.find((g) => g.id === link.guardian_id) : null;

    // Matrículas do aluno
    const enrollments = db.enrollments
      .filter((e) => e.student_id === s.id)
      .map((e) => {
        const sport = db.sports.find((sp) => sp.id === e.sports_id);
        const cls = e.class_id ? db.classes.find((c) => c.id === e.class_id) : null;
        return {
          id: e.id,
          status: e.status,
          data_matricula: e.data_matricula,
          modalidade: sport ? sport.nome : 'Geral',
          turma: cls ? cls.nome : 'Turma Geral',
          horario: cls ? cls.horario : 'Horário Flexível',
          dias: cls ? cls.dias_semana : 'Dias informados no polo',
          local: cls ? cls.local : 'Núcleo Central',
        };
      });

    // Prontuário de saúde
    const health = db.health_records.find((h) => h.student_id === s.id);

    // Situação consolidada da primeira matrícula principal
    const primaryEnrollment = enrollments[0] || {
      modalidade: 'Capoeira',
      turma: 'Turma Formativa',
      horario: 'A definir',
      dias: 'A definir',
      local: 'Núcleo Central',
      status: s.status,
    };

    return {
      id: s.id,
      matricula_numero: s.matricula_numero,
      nome_completo: s.nome_completo,
      data_nascimento: s.data_nascimento,
      idade: age,
      cpf_mascarado: maskCPF(s.cpf),
      status: primaryEnrollment.status || s.status,
      foto_url: s.foto_url,
      modalidade: primaryEnrollment.modalidade,
      turma: primaryEnrollment.turma,
      horario: primaryEnrollment.horario,
      dias: primaryEnrollment.dias,
      local: primaryEnrollment.local,
      todas_matriculas: enrollments,
      responsavel: guardian
        ? {
            id: guardian.id,
            nome: guardian.nome_completo,
            parentesco: link ? link.parentesco : guardian.parentesco || 'Responsável',
            telefone: guardian.telefone,
            telefone_mascarado: maskPhone(guardian.telefone),
          }
        : null,
      saude: {
        laudo_ok: health ? health.laudo_medico_apresentado : true,
        possui_alerta: health ? health.possui_deficiencia || health.possui_doenca_cronica || health.utiliza_medicamento : false,
        observacoes: health ? health.observacoes : null,
      },
    };
  });

  res.json({
    students: enriched,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  });
}

export async function getStudentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = dbAccess.getMemoryDb();

  const student = db.students.find((s) => s.id === id);
  if (!student) {
    res.status(404).json({ error: 'Aluno não encontrado' });
    return;
  }

  const age = calculateAge(student.data_nascimento);

  // Responsável
  const link = db.student_guardians.find((sg) => sg.student_id === id);
  const guardian = link ? db.guardians.find((g) => g.id === link.guardian_id) : null;
  const family = guardian ? db.family_members.filter((f) => f.guardian_id === guardian.id) : [];

  // Prontuário de Saúde
  const health = db.health_records.find((h) => h.student_id === id);

  // Matrículas
  const enrollments = db.enrollments
    .filter((e) => e.student_id === id)
    .map((e) => {
      const sport = db.sports.find((sp) => sp.id === e.sports_id);
      const cls = e.class_id ? db.classes.find((c) => c.id === e.class_id) : null;
      return {
        id: e.id,
        sports_id: e.sports_id,
        modalidade: sport ? sport.nome : '',
        turma: cls ? cls.nome : '',
        horario: cls ? cls.horario : '',
        dias: cls ? cls.dias_semana : '',
        local: cls ? cls.local : '',
        status: e.status,
        data_matricula: e.data_matricula,
        observacoes: e.observacoes,
      };
    });

  // Autorizações
  const authorization = db.authorizations.find((a) => a.student_id === id);

  // Documentos digitalizados vinculados
  const documents = db.digitized_documents.filter((d) => d.student_id === id);

  res.json({
    student: {
      ...student,
      idade: age,
      cpf_mascarado: maskCPF(student.cpf),
    },
    guardian: guardian
      ? {
          ...guardian,
          parentesco: link ? link.parentesco : guardian.parentesco,
          cpf_mascarado: maskCPF(guardian.cpf),
        }
      : null,
    family,
    health: health || {
      possui_deficiencia: false,
      possui_doenca_cronica: false,
      utiliza_medicamento: false,
      laudo_medico_apresentado: true,
    },
    enrollments,
    authorization,
    documents,
  });
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const parsed = createStudentSchema.parse(req.body);
  const db = dbAccess.getMemoryDb();

  // Verifica duplicidade de CPF do aluno se informado
  if (parsed.cpf) {
    const cleanCpf = parsed.cpf.replace(/\D/g, '');
    const existing = db.students.find((s) => s.cpf && s.cpf.replace(/\D/g, '') === cleanCpf);
    if (existing) {
      res.status(409).json({
        error: 'CPF já cadastrado',
        message: `O aluno ${existing.nome_completo} já está registrado com este CPF (Matrícula #${existing.matricula_numero}).`,
      });
      return;
    }
  }

  // 1. Define ou Cria o Responsável Legal
  let guardianId = parsed.responsavel_id;

  if (!guardianId && parsed.novo_responsavel) {
    const existingGuardian = db.guardians.find(
      (g) => g.cpf.replace(/\D/g, '') === parsed.novo_responsavel!.cpf.replace(/\D/g, '')
    );

    if (existingGuardian) {
      guardianId = existingGuardian.id;
    } else {
      guardianId = crypto.randomUUID();
      const newGuardian = {
        id: guardianId,
        ...parsed.novo_responsavel,
        cidade: parsed.novo_responsavel.cidade || 'Volta Redonda',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.guardians.push(newGuardian);
    }
  }

  if (!guardianId) {
    res.status(400).json({
      error: 'Responsável obrigatório',
      message: 'É obrigatório vincular um responsável existente ou preencher os dados de um novo responsável.',
    });
    return;
  }

  // 2. Cria o Aluno
  const studentId = crypto.randomUUID();
  const matriculaNumero = `2025-${Math.floor(100 + Math.random() * 900)}`;

  const newStudent = {
    id: studentId,
    matricula_numero: matriculaNumero,
    nome_completo: parsed.nome_completo,
    data_nascimento: parsed.data_nascimento,
    cpf: parsed.cpf || null,
    rg: parsed.rg || null,
    orgao_emissor: parsed.orgao_emissor || 'DETRAN/RJ',
    nis: parsed.nis || null,
    etnia: parsed.etnia,
    escola: parsed.escola || null,
    serie: parsed.serie || null,
    turno_escolar: parsed.turno_escolar,
    status: 'ativo',
    foto_url: parsed.foto_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.students.push(newStudent);

  // 3. Cria vínculo Aluno-Responsável
  db.student_guardians.push({
    id: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: guardianId,
    parentesco: parsed.novo_responsavel?.parentesco || 'Mãe',
    responsavel_legal: true,
    principal: true,
    created_at: new Date().toISOString(),
  });

  // 4. Cria Prontuário de Saúde
  db.health_records.push({
    id: crypto.randomUUID(),
    student_id: studentId,
    possui_deficiencia: parsed.saude.possui_deficiencia,
    descricao_deficiencia: parsed.saude.descricao_deficiencia || null,
    possui_doenca_cronica: parsed.saude.possui_doenca_cronica,
    descricao_doenca: parsed.saude.descricao_doenca || null,
    utiliza_medicamento: parsed.saude.utiliza_medicamento,
    descricao_medicamento: parsed.saude.descricao_medicamento || null,
    observacoes: parsed.saude.observacoes || null,
    laudo_medico_apresentado: parsed.saude.laudo_medico_apresentado,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // 5. Cria Matrículas nas modalidades selecionadas (sem duplicidade!)
  const createdEnrollments = [];
  for (const sportId of parsed.modalidades_ids) {
    const existingEnrollment = db.enrollments.find((e) => e.student_id === studentId && e.sports_id === sportId);
    if (!existingEnrollment) {
      // Tenta encontrar uma turma padrão ativa para o esporte
      const availableClass = db.classes.find((c) => c.sports_id === sportId && c.ativo);
      const newEnrollment = {
        id: crypto.randomUUID(),
        student_id: studentId,
        sports_id: sportId,
        class_id: availableClass ? availableClass.id : null,
        status: 'ativa',
        data_matricula: new Date().toISOString().split('T')[0],
        observacoes: 'Matrícula efetuada pelo formulário digital.',
        created_at: new Date().toISOString(),
      };
      db.enrollments.push(newEnrollment);
      createdEnrollments.push(newEnrollment);
    }
  }

  // 6. Cadastra Composição Familiar, se fornecida
  if (parsed.residentes_domicilio && parsed.residentes_domicilio.length > 0) {
    for (const resident of parsed.residentes_domicilio) {
      db.family_members.push({
        id: crypto.randomUUID(),
        guardian_id: guardianId,
        nome: resident.nome,
        parentesco: resident.parentesco,
        idade: resident.idade || null,
        escolaridade: resident.escolaridade || null,
        profissao: (resident as any).profession || resident.profissao || null,
        renda: resident.renda || 0,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 7. Termos e Autorizações
  db.authorizations.push({
    id: crypto.randomUUID(),
    student_id: studentId,
    guardian_id: guardianId,
    autorizacao_imagem: parsed.autorizacao_imagem,
    declaracao_responsabilidade: parsed.declaracao_responsabilidade,
    nome_legivel_responsavel: parsed.novo_responsavel?.nome_completo || null,
    assistente_social_responsavel: req.user?.nome || 'Juliana Rezende - CRESS 4410',
    cidade_assinatura: 'Volta Redonda',
    data_assinatura: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
  });

  res.status(201).json({
    message: 'Aluno e matrículas cadastradas com sucesso!',
    student: newStudent,
    enrollmentsCount: createdEnrollments.length,
  });
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = updateStudentSchema.parse(req.body);
  const db = dbAccess.getMemoryDb();

  const studentIndex = db.students.findIndex((s) => s.id === id);
  if (studentIndex === -1) {
    res.status(404).json({ error: 'Aluno não encontrado' });
    return;
  }

  const existing = db.students[studentIndex];
  db.students[studentIndex] = {
    ...existing,
    nome_completo: parsed.nome_completo || existing.nome_completo,
    data_nascimento: parsed.data_nascimento || existing.data_nascimento,
    cpf: parsed.cpf !== undefined ? parsed.cpf : existing.cpf,
    rg: parsed.rg !== undefined ? parsed.rg : existing.rg,
    orgao_emissor: parsed.orgao_emissor !== undefined ? parsed.orgao_emissor : existing.orgao_emissor,
    nis: parsed.nis !== undefined ? parsed.nis : existing.nis,
    etnia: parsed.etnia || existing.etnia,
    escola: parsed.escola !== undefined ? parsed.escola : existing.escola,
    serie: parsed.serie !== undefined ? parsed.serie : existing.serie,
    turno_escolar: parsed.turno_escolar || existing.turno_escolar,
    foto_url: parsed.foto_url !== undefined ? parsed.foto_url : existing.foto_url,
    updated_at: new Date().toISOString(),
  };

  // Atualiza saúde se enviada
  if (parsed.saude) {
    const healthIndex = db.health_records.findIndex((h) => h.student_id === id);
    if (healthIndex !== -1) {
      db.health_records[healthIndex] = {
        ...db.health_records[healthIndex],
        ...parsed.saude,
        updated_at: new Date().toISOString(),
      };
    }
  }

  res.json({
    message: 'Dados do aluno atualizados com sucesso',
    student: db.students[studentIndex],
  });
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const db = dbAccess.getMemoryDb();

  const student = db.students.find((s) => s.id === id);
  if (!student) {
    res.status(404).json({ error: 'Aluno não encontrado' });
    return;
  }

  // Desativa o aluno e suas matrículas
  student.status = 'cancelado';
  db.enrollments.filter((e) => e.student_id === id).forEach((e) => {
    e.status = 'cancelada';
    e.data_cancelamento = new Date().toISOString().split('T')[0];
  });

  res.json({
    message: `Matrículas e prontuário do aluno ${student.nome_completo} foram cancelados com sucesso.`,
  });
}
