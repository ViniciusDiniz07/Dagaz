import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbAccess, query, withTransaction } from '../../db/database.js';
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

async function listStudentsFromPostgres(req: Request, res: Response): Promise<void> {
  const search = String(req.query.q || '').trim();
  const modality = String(req.query.modality || '').trim();
  const status = String(req.query.status || '').trim().toLowerCase();
  const requestedPage = Number.parseInt(String(req.query.page || '1'), 10);
  const requestedLimit = Number.parseInt(String(req.query.limit || '10'), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 10;

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (search) {
    params.push(`%${search}%`);
    const searchParam = `$${params.length}`;
    params.push(`%${search.replace(/\D/g, '')}%`);
    const cpfParam = `$${params.length}`;
    conditions.push(`(
      s.nome_completo ILIKE ${searchParam}
      OR s.matricula_numero ILIKE ${searchParam}
      OR (${cpfParam} <> '' AND regexp_replace(COALESCE(s.cpf, ''), '[^0-9]', '', 'g') LIKE ${cpfParam})
      OR EXISTS (
        SELECT 1
        FROM student_guardians sg
        JOIN guardians g ON g.id = sg.guardian_id
        WHERE sg.student_id = s.id AND g.nome_completo ILIKE ${searchParam}
      )
    )`);
  }
  if (status && status !== 'todos') {
    params.push(status);
    const statusParam = `$${params.length}`;
    conditions.push(`(
      s.status = ${statusParam}
      OR EXISTS (
        SELECT 1 FROM enrollments e
        WHERE e.student_id = s.id AND e.status = ${statusParam}
      )
    )`);
  }
  if (modality && modality !== 'todos') {
    params.push(modality);
    conditions.push(`EXISTS (
      SELECT 1
      FROM enrollments e
      JOIN sports sp ON sp.id = e.sports_id
      WHERE e.student_id = s.id AND LOWER(sp.nome) = LOWER($${params.length})
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM students s ${whereClause}`,
    params
  );
  const totalCount = Number(countResult.rows[0]?.total || 0);
  const paginationParams = [...params, limit, (page - 1) * limit];
  const limitParam = `$${params.length + 1}`;
  const offsetParam = `$${params.length + 2}`;
  const studentsResult = await query(
    `
      SELECT s.*,
        guardian.id AS guardian_id,
        guardian.nome_completo AS guardian_nome,
        guardian.parentesco AS guardian_parentesco,
        guardian.telefone AS guardian_telefone,
        health.laudo_medico_apresentado AS laudo_ok,
        health.possui_deficiencia,
        health.possui_doenca_cronica,
        health.utiliza_medicamento,
        health.observacoes AS health_observacoes,
        COALESCE(enrollment_list.items, '[]'::json) AS todas_matriculas
      FROM students s
      LEFT JOIN LATERAL (
        SELECT g.id, g.nome_completo, g.parentesco, g.telefone
        FROM student_guardians sg
        JOIN guardians g ON g.id = sg.guardian_id
        WHERE sg.student_id = s.id
        ORDER BY sg.principal DESC, sg.created_at
        LIMIT 1
      ) guardian ON TRUE
      LEFT JOIN health_records health ON health.student_id = s.id
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object(
          'id', e.id,
          'status', e.status,
          'data_matricula', e.data_matricula,
          'modalidade', sp.nome,
          'turma', c.nome,
          'horario', c.horario,
          'dias', c.dias_semana,
          'local', c.local
        ) ORDER BY e.data_matricula DESC) AS items
        FROM enrollments e
        JOIN sports sp ON sp.id = e.sports_id
        LEFT JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = s.id
      ) enrollment_list ON TRUE
      ${whereClause}
      ORDER BY s.nome_completo
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `,
    paginationParams
  );

  const students = studentsResult.rows.map((student) => {
    const enrollments = student.todas_matriculas || [];
    const primaryEnrollment = enrollments[0];
    const hasHealthAlert =
      student.possui_deficiencia || student.possui_doenca_cronica || student.utiliza_medicamento;
    return {
      id: student.id,
      matricula_numero: student.matricula_numero,
      nome_completo: student.nome_completo,
      data_nascimento: student.data_nascimento,
      idade: calculateAge(student.data_nascimento),
      cpf_mascarado: maskCPF(student.cpf),
      status: primaryEnrollment?.status || student.status,
      foto_url: student.foto_url,
      modalidade: primaryEnrollment?.modalidade || 'Sem modalidade',
      turma: primaryEnrollment?.turma || 'Sem turma',
      horario: primaryEnrollment?.horario || 'Não informado',
      dias: primaryEnrollment?.dias || 'Não informado',
      local: primaryEnrollment?.local || 'Não informado',
      todas_matriculas: enrollments,
      responsavel: student.guardian_id
        ? {
            id: student.guardian_id,
            nome: student.guardian_nome,
            parentesco: student.guardian_parentesco || 'Responsável',
            telefone: student.guardian_telefone,
            telefone_mascarado: maskPhone(student.guardian_telefone),
          }
        : null,
      saude: {
        laudo_ok: student.laudo_ok ?? false,
        possui_alerta: Boolean(hasHealthAlert),
        observacoes: student.health_observacoes || null,
      },
    };
  });

  res.json({
    students,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  });
}

export async function listStudents(req: Request, res: Response): Promise<void> {
  if (dbAccess.isPostgres()) {
    await listStudentsFromPostgres(req, res);
    return;
  }

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
      modalidade: 'Sem modalidade',
      turma: 'Sem turma',
      horario: 'Não informado',
      dias: 'Não informado',
      local: 'Não informado',
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
        laudo_ok: health ? health.laudo_medico_apresentado : false,
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

  if (dbAccess.isPostgres()) {
    const studentResult = await query('SELECT * FROM students WHERE id = $1', [id]);
    const student = studentResult.rows[0];
    if (!student) {
      res.status(404).json({ error: 'Aluno não encontrado' });
      return;
    }

    const [guardianResult, healthResult, enrollmentResult, authorizationResult, documentResult] = await Promise.all([
      query(
        `SELECT g.*, sg.parentesco AS vinculo_parentesco
         FROM student_guardians sg
         JOIN guardians g ON g.id = sg.guardian_id
         WHERE sg.student_id = $1
         ORDER BY sg.principal DESC, sg.created_at
         LIMIT 1`,
        [id]
      ),
      query('SELECT * FROM health_records WHERE student_id = $1', [id]),
      query(
        `SELECT e.*, sp.nome AS modalidade, c.nome AS turma, c.horario,
                c.dias_semana AS dias, c.local
         FROM enrollments e
         JOIN sports sp ON sp.id = e.sports_id
         LEFT JOIN classes c ON c.id = e.class_id
         WHERE e.student_id = $1
         ORDER BY e.data_matricula DESC`,
        [id]
      ),
      query('SELECT * FROM authorizations WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1', [id]),
      query('SELECT * FROM digitized_documents WHERE student_id = $1 ORDER BY created_at DESC', [id]),
    ]);

    const guardian = guardianResult.rows[0] || null;
    const [familyResult] = guardian
      ? await Promise.all([query('SELECT * FROM family_members WHERE guardian_id = $1 ORDER BY created_at', [guardian.id])])
      : [{ rows: [] }];
    const health = healthResult.rows[0] || {
      possui_deficiencia: false,
      possui_doenca_cronica: false,
      utiliza_medicamento: false,
      laudo_medico_apresentado: false,
    };

    res.json({
      student: {
        ...student,
        idade: calculateAge(student.data_nascimento),
        cpf_mascarado: maskCPF(student.cpf),
      },
      guardian: guardian
        ? {
            ...guardian,
            parentesco: guardian.vinculo_parentesco,
            cpf_mascarado: maskCPF(guardian.cpf),
          }
        : null,
      family: familyResult.rows,
      health,
      enrollments: enrollmentResult.rows,
      authorization: authorizationResult.rows[0] || null,
      documents: documentResult.rows,
    });
    return;
  }

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
      laudo_medico_apresentado: false,
    },
    enrollments,
    authorization,
    documents,
  });
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const parsed = createStudentSchema.parse(req.body);

  if (dbAccess.isPostgres()) {
    const result = await withTransaction(async (client) => {
      if (parsed.cpf) {
        const duplicateStudent = await client.query(
          `SELECT nome_completo, matricula_numero
           FROM students
           WHERE regexp_replace(COALESCE(cpf, ''), '[^0-9]', '', 'g') =
             regexp_replace($1, '[^0-9]', '', 'g')
           LIMIT 1`,
          [parsed.cpf]
        );
        if (duplicateStudent.rows[0]) {
          return {
            error: 'CPF já cadastrado' as const,
            studentName: duplicateStudent.rows[0].nome_completo,
            registrationNumber: duplicateStudent.rows[0].matricula_numero,
          };
        }
      }

      const availableSports = await client.query(
        'SELECT id FROM sports WHERE id = ANY($1::uuid[]) AND ativo = TRUE',
        [parsed.modalidades_ids]
      );
      if (availableSports.rows.length !== new Set(parsed.modalidades_ids).size) {
        return { error: 'modalidade' as const };
      }
      if (parsed.turma_id) {
        if (parsed.modalidades_ids.length !== 1) {
          return { error: 'turma' as const };
        }
        const availableClass = await client.query(
          'SELECT id FROM classes WHERE id = $1 AND sports_id = $2 AND ativo = TRUE',
          [parsed.turma_id, parsed.modalidades_ids[0]]
        );
        if (!availableClass.rows[0]) {
          return { error: 'turma' as const };
        }
      }

      let guardianId = parsed.responsavel_id || null;
      if (guardianId) {
        const guardian = await client.query('SELECT id FROM guardians WHERE id = $1', [guardianId]);
        if (!guardian.rows[0]) {
          return { error: 'Responsável não encontrado' as const };
        }
      } else if (parsed.novo_responsavel) {
        const cpf = parsed.novo_responsavel.cpf;
        const foundGuardian = await client.query(
          `SELECT id FROM guardians
           WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = regexp_replace($1, '[^0-9]', '', 'g')
           LIMIT 1`,
          [cpf]
        );
        if (foundGuardian.rows[0]) {
          guardianId = foundGuardian.rows[0].id;
        } else {
          const guardian = parsed.novo_responsavel;
          const insertedGuardian = await client.query(
            `INSERT INTO guardians (
              nome_completo, cpf, rg, nis, telefone, email, endereco, numero, bairro, cidade, cep,
              parentesco, ocupacao, escolaridade, renda_familiar_faixa,
              beneficiario_programa_social, programa_social
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
            )
            ON CONFLICT (cpf) DO UPDATE SET updated_at = NOW()
            RETURNING id`,
            [
              guardian.nome_completo,
              guardian.cpf,
              guardian.rg || null,
              guardian.nis || null,
              guardian.telefone,
              guardian.email || null,
              guardian.endereco || null,
              guardian.numero || null,
              guardian.bairro || null,
              guardian.cidade || 'Volta Redonda',
              guardian.cep || null,
              guardian.parentesco || null,
              guardian.ocupacao || null,
              guardian.escolaridade || null,
              guardian.renda_familiar_faixa || null,
              guardian.beneficiario_programa_social,
              guardian.programa_social || null,
            ]
          );
          guardianId = insertedGuardian.rows[0].id;
        }
      }

      if (!guardianId) {
        return { error: 'Responsável obrigatório' as const };
      }

      const studentId = crypto.randomUUID();
      const matriculaNumero = `${new Date().getFullYear()}-${studentId.slice(0, 8).toUpperCase()}`;
      const studentResult = await client.query(
        `INSERT INTO students (
          id, matricula_numero, nome_completo, data_nascimento, cpf, rg, orgao_emissor, nis,
          etnia, escola, serie, turno_escolar, status, foto_url
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ativo', $13)
        RETURNING *`,
        [
          studentId,
          matriculaNumero,
          parsed.nome_completo,
          parsed.data_nascimento,
          parsed.cpf || null,
          parsed.rg || null,
          parsed.orgao_emissor || null,
          parsed.nis || null,
          parsed.etnia || null,
          parsed.escola || null,
          parsed.serie || null,
          parsed.turno_escolar || null,
          parsed.foto_url || null,
        ]
      );

      await client.query(
        `INSERT INTO student_guardians (student_id, guardian_id, parentesco, responsavel_legal, principal)
         VALUES ($1, $2, $3, TRUE, TRUE)`,
        [studentId, guardianId, parsed.novo_responsavel?.parentesco || 'Responsável']
      );

      const health = parsed.saude;
      await client.query(
        `INSERT INTO health_records (
          student_id, possui_deficiencia, descricao_deficiencia, possui_doenca_cronica,
          descricao_doenca, utiliza_medicamento, descricao_medicamento, observacoes,
          laudo_medico_apresentado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          studentId,
          health.possui_deficiencia,
          health.descricao_deficiencia || null,
          health.possui_doenca_cronica,
          health.descricao_doenca || null,
          health.utiliza_medicamento,
          health.descricao_medicamento || null,
          health.observacoes || null,
          health.laudo_medico_apresentado,
        ]
      );

      for (const sportId of parsed.modalidades_ids) {
        const classResult = parsed.turma_id
          ? { rows: [{ id: parsed.turma_id }] }
          : await client.query(
              'SELECT id FROM classes WHERE sports_id = $1 AND ativo = TRUE ORDER BY nome LIMIT 1',
              [sportId]
            );
        await client.query(
          `INSERT INTO enrollments (student_id, sports_id, class_id, status, observacoes)
           VALUES ($1, $2, $3, 'ativa', $4)`,
          [studentId, sportId, classResult.rows[0]?.id || null, 'Matrícula efetuada pelo formulário digital.']
        );
      }

      for (const resident of parsed.residentes_domicilio || []) {
        await client.query(
          `INSERT INTO family_members (guardian_id, nome, parentesco, idade, escolaridade, profissao, renda)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            guardianId,
            resident.nome,
            resident.parentesco,
            resident.idade ?? null,
            resident.escolaridade || null,
            resident.profissao || null,
            resident.renda,
          ]
        );
      }

      await client.query(
        `INSERT INTO authorizations (
          student_id, guardian_id, autorizacao_imagem, declaracao_responsabilidade,
          nome_legivel_responsavel, assistente_social_responsavel, cidade_assinatura, data_assinatura
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)`,
        [
          studentId,
          guardianId,
          parsed.autorizacao_imagem,
          parsed.declaracao_responsabilidade,
          parsed.novo_responsavel?.nome_completo || null,
          req.user?.nome || null,
          'Volta Redonda',
        ]
      );

      return { student: studentResult.rows[0], enrollmentsCount: parsed.modalidades_ids.length };
    });

    if ('error' in result) {
      if (result.error === 'CPF já cadastrado') {
        res.status(409).json({
          error: result.error,
          message: `O aluno ${result.studentName} já está registrado com esta matrícula #${result.registrationNumber}.`,
        });
      } else if (result.error === 'modalidade') {
        res.status(400).json({ error: 'Uma modalidade selecionada não está disponível.' });
      } else if (result.error === 'turma') {
        res.status(400).json({ error: 'A turma selecionada não pertence à modalidade escolhida.' });
      } else {
        res.status(result.error === 'Responsável obrigatório' ? 400 : 404).json({
          error: result.error,
          ...(result.error === 'Responsável obrigatório'
            ? { message: 'Informe um responsável cadastrado ou preencha os dados de um novo responsável.' }
            : {}),
        });
      }
      return;
    }

    res.status(201).json({
      message: 'Aluno e matrículas cadastradas com sucesso!',
      student: result.student,
      enrollmentsCount: result.enrollmentsCount,
    });
    return;
  }

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
  const matriculaNumero = `${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const newStudent = {
    id: studentId,
    matricula_numero: matriculaNumero,
    nome_completo: parsed.nome_completo,
    data_nascimento: parsed.data_nascimento,
    cpf: parsed.cpf || null,
    rg: parsed.rg || null,
    orgao_emissor: parsed.orgao_emissor || null,
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
    parentesco: parsed.novo_responsavel?.parentesco || 'Responsável',
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
    assistente_social_responsavel: req.user?.nome || null,
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

  if (dbAccess.isPostgres()) {
    const columnMap: Record<string, string> = {
      nome_completo: 'nome_completo',
      data_nascimento: 'data_nascimento',
      cpf: 'cpf',
      rg: 'rg',
      orgao_emissor: 'orgao_emissor',
      nis: 'nis',
      etnia: 'etnia',
      escola: 'escola',
      serie: 'serie',
      turno_escolar: 'turno_escolar',
      foto_url: 'foto_url',
    };
    const values: unknown[] = [];
    const assignments = Object.entries(columnMap)
      .filter(([key]) => parsed[key as keyof typeof parsed] !== undefined)
      .map(([key, column]) => {
        values.push(parsed[key as keyof typeof parsed] ?? null);
        return `${column} = $${values.length}`;
      });

    let updatedStudent;
    if (assignments.length) {
      values.push(id);
      const studentResult = await query(
        `UPDATE students SET ${assignments.join(', ')}, updated_at = NOW()
         WHERE id = $${values.length} RETURNING *`,
        values
      );
      updatedStudent = studentResult.rows[0];
    } else {
      const studentResult = await query('SELECT * FROM students WHERE id = $1', [id]);
      updatedStudent = studentResult.rows[0];
    }
    if (!updatedStudent) {
      res.status(404).json({ error: 'Aluno não encontrado' });
      return;
    }

    if (parsed.saude) {
      const health = parsed.saude;
      await query(
        `INSERT INTO health_records (
          student_id, possui_deficiencia, descricao_deficiencia, possui_doenca_cronica,
          descricao_doenca, utiliza_medicamento, descricao_medicamento, observacoes,
          laudo_medico_apresentado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (student_id) DO UPDATE SET
          possui_deficiencia = EXCLUDED.possui_deficiencia,
          descricao_deficiencia = EXCLUDED.descricao_deficiencia,
          possui_doenca_cronica = EXCLUDED.possui_doenca_cronica,
          descricao_doenca = EXCLUDED.descricao_doenca,
          utiliza_medicamento = EXCLUDED.utiliza_medicamento,
          descricao_medicamento = EXCLUDED.descricao_medicamento,
          observacoes = EXCLUDED.observacoes,
          laudo_medico_apresentado = EXCLUDED.laudo_medico_apresentado,
          updated_at = NOW()`,
        [
          id,
          health.possui_deficiencia,
          health.descricao_deficiencia || null,
          health.possui_doenca_cronica,
          health.descricao_doenca || null,
          health.utiliza_medicamento,
          health.descricao_medicamento || null,
          health.observacoes || null,
          health.laudo_medico_apresentado,
        ]
      );
    }

    res.json({ message: 'Dados do aluno atualizados com sucesso', student: updatedStudent });
    return;
  }

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

  if (dbAccess.isPostgres()) {
    const result = await withTransaction(async (client) => {
      const studentResult = await client.query(
        `UPDATE students SET status = 'cancelado', updated_at = NOW()
         WHERE id = $1 RETURNING nome_completo`,
        [id]
      );
      if (!studentResult.rows[0]) {
        return null;
      }
      await client.query(
        `UPDATE enrollments SET status = 'cancelada', data_cancelamento = CURRENT_DATE, updated_at = NOW()
         WHERE student_id = $1`,
        [id]
      );
      return studentResult.rows[0];
    });
    if (!result) {
      res.status(404).json({ error: 'Aluno não encontrado' });
      return;
    }
    res.json({
      message: `Matrículas e prontuário do aluno ${result.nome_completo} foram cancelados com sucesso.`,
    });
    return;
  }

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
