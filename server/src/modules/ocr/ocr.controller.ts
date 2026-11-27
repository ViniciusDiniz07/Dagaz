import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { dbAccess, query, withTransaction } from '../../db/database.js';
import { getGeminiClient, OCR_SYSTEM_PROMPT } from '../../config/gemini.js';
import { logger } from '../../utils/logger.js';

export async function extractDocument(req: Request, res: Response): Promise<void> {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      error: 'Arquivo não enviado',
      message: 'Por favor, selecione uma foto, imagem ou arquivo PDF da ficha física.',
    });
    return;
  }

  logger.info(`Processando documento OCR: ${file.originalname} (${file.mimetype}, ${(file.size / 1024).toFixed(1)} KB)`);

  const docId = crypto.randomUUID();

  let extractedData: any = null;
  let generalConfidence = 0;
  const gemini = getGeminiClient();

  if (!gemini) {
    logger.error('OCR indisponível: configure a chave do Google Gemini no servidor.');
    await removeTemporaryFile(file.path);
    res.status(503).json({
      error: 'OCR indisponível',
      message: 'A leitura automática não está configurada. Entre em contato com o administrador.',
    });
    return;
  }

  try {
    const fileBuffer = fs.readFileSync(file.path);
    const base64Data = fileBuffer.toString('base64');

    logger.info('Enviando documento para a API do Google Gemini com system prompt estruturado...');

    const response = await gemini.interactions.create({
      model: 'gemini-4-hydrogen',
      input: [
        {
          type: 'text',
          text: OCR_SYSTEM_PROMPT,
        },
        {
          type: 'image',
          data: base64Data,
          mime_type: file.mimetype,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const responseText = response.output_text || '';
    logger.info('Resposta recebida do Google Gemini. Validando JSON...');

    const cleanJson = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    extractedData = JSON.parse(cleanJson);
    const parsedConfidence = Number(extractedData.general_confidence);
    generalConfidence = Number.isFinite(parsedConfidence) ? parsedConfidence : 0;
  } catch (apiError) {
    logger.error('Erro ao extrair dados do documento com a API do Google Gemini:', apiError);
    await removeTemporaryFile(file.path);
    res.status(502).json({
      error: 'Falha no OCR',
      message: 'Não foi possível ler o documento. Tente novamente ou preencha os dados manualmente.',
    });
    return;
  }

  // Registra o documento na tabela digitized_documents
  await query(
    `INSERT INTO digitized_documents
       (id, student_id, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_caminho,
        status_processamento, confianca_geral, dados_extraidos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      docId,
      null,
      file.originalname,
      file.mimetype,
      file.size,
      `/uploads/${file.filename}`,
      'pendente',
      generalConfidence,
      JSON.stringify(extractedData),
    ]
  );

  res.json({
    documentId: docId,
    status: 'pendente',
    confianca_geral: generalConfidence,
    dados: extractedData,
    arquivo: {
      nome: file.originalname,
      tamanho: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      caminho: `/uploads/${file.filename}`,
    },
    mensagem: 'Documento analisado com sucesso pelo OCR. Revise os campos antes de confirmar o cadastro.',
  });
}

async function removeTemporaryFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error('Não foi possível remover o arquivo temporário de OCR:', error);
    }
  }
}

function getExtractedValue(data: any, field: string): string | null {
  const value = data?.[field]?.value;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeBirthDate(value: string | null): string | null {
  if (!value) return null;

  let normalized = value;
  const brazilianDate = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (brazilianDate) {
    normalized = `${brazilianDate[3]}-${brazilianDate[2]}-${brazilianDate[1]}`;
  }

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
  if (!isoDate) return null;
  const parsed = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized
    ? null
    : normalized;
}

export async function getDocumentById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const result = await query('SELECT * FROM digitized_documents WHERE id = $1', [id]);
  const doc = result.rows[0];
  if (!doc) {
    res.status(404).json({ error: 'Documento digitalizado não encontrado' });
    return;
  }

  res.json({ document: doc });
}

export async function confirmDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { dadosRevisados, notas } = req.body;
  const documentResult = await query('SELECT * FROM digitized_documents WHERE id = $1', [id]);
  const doc = documentResult.rows[0];
  if (!doc) {
    res.status(404).json({ error: 'Documento não encontrado' });
    return;
  }

  const data = dadosRevisados || doc.dados_extraidos;
  const studentData = data.student || {};
  const guardianData = data.guardian || {};
  const healthData = data.health || {};
  const studentName = getExtractedValue(studentData, 'name');
  const birthDate = normalizeBirthDate(getExtractedValue(studentData, 'birth_date'));
  const guardianName = getExtractedValue(guardianData, 'name');
  const guardianCpf = getExtractedValue(guardianData, 'cpf');
  const guardianPhone = getExtractedValue(guardianData, 'phone');
  const guardianCpfDigits = guardianCpf?.replace(/\D/g, '') || '';

  if (!studentName || !birthDate || !guardianName || guardianCpfDigits.length !== 11 || !guardianPhone) {
    res.status(400).json({
      error: 'Dados obrigatórios ausentes',
      message: 'Confira o nome e nascimento do aluno e o nome, CPF e telefone do responsável.',
    });
    return;
  }

  const modalities = Array.isArray(data.modalities) ? data.modalities : [];
  const checkedModalities = modalities.filter((modality: any) => modality?.checked && modality?.name);
  const studentId = crypto.randomUUID();
  const matriculaNumero = `${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const relationship = getExtractedValue(guardianData, 'relationship') || 'Responsável';
  let newStudent: Record<string, unknown>;
  let createdEnrollmentsCount = 0;

  if (dbAccess.isPostgres()) {
    const result = await withTransaction(async (client) => {
      const lockedDocument = await client.query(
        'SELECT id, status_processamento FROM digitized_documents WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (!lockedDocument.rows[0]) return null;
      if (lockedDocument.rows[0].status_processamento === 'revisado') {
        return { alreadyReviewed: true as const };
      }

      const existingGuardian = await client.query<{ id: string }>(
        `SELECT id FROM guardians
         WHERE regexp_replace(cpf, '[^0-9]', '', 'g') = $1
         LIMIT 1`,
        [guardianCpfDigits]
      );
      let guardianId = existingGuardian.rows[0]?.id;

      if (!guardianId) {
        const guardianResult = await client.query<{ id: string }>(
          `INSERT INTO guardians
             (id, nome_completo, cpf, rg, nis, telefone, endereco, parentesco,
              beneficiario_programa_social, programa_social)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [
            crypto.randomUUID(),
            guardianName,
            guardianCpf,
            getExtractedValue(guardianData, 'rg'),
            getExtractedValue(guardianData, 'nis'),
            guardianPhone,
            getExtractedValue(guardianData, 'address'),
            relationship,
            Boolean(getExtractedValue(guardianData, 'social_program')),
            getExtractedValue(guardianData, 'social_program'),
          ]
        );
        guardianId = guardianResult.rows[0].id;
      }

      const ethnicity = getExtractedValue(studentData, 'ethnicity');
      const allowedEthnicities = new Set([
        'branca',
        'preta',
        'parda',
        'amarela',
        'indigena',
        'nao_declarado',
      ]);
      const studentResult = await client.query(
        `INSERT INTO students
           (id, matricula_numero, nome_completo, data_nascimento, cpf, rg, orgao_emissor,
            nis, etnia, escola, serie, turno_escolar, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'ativo')
         RETURNING *`,
        [
          studentId,
          matriculaNumero,
          studentName,
          birthDate,
          getExtractedValue(studentData, 'cpf'),
          getExtractedValue(studentData, 'rg'),
          getExtractedValue(studentData, 'orgao_emissor'),
          getExtractedValue(studentData, 'nis'),
          ethnicity && allowedEthnicities.has(ethnicity) ? ethnicity : null,
          getExtractedValue(studentData, 'school'),
          getExtractedValue(studentData, 'grade'),
          getExtractedValue(studentData, 'turno_escolar'),
        ]
      );

      await client.query(
        `INSERT INTO student_guardians
           (student_id, guardian_id, parentesco, responsavel_legal, principal)
         VALUES ($1, $2, $3, TRUE, TRUE)`,
        [studentId, guardianId, relationship]
      );
      await client.query(
        `INSERT INTO health_records
           (student_id, possui_deficiencia, descricao_deficiencia, possui_doenca_cronica,
            descricao_doenca, utiliza_medicamento, descricao_medicamento, observacoes,
            laudo_medico_apresentado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)`,
        [
          studentId,
          healthData.has_disability?.value === true,
          getExtractedValue(healthData, 'disability_description'),
          healthData.has_chronic_disease?.value === true,
          getExtractedValue(healthData, 'chronic_disease_description'),
          healthData.uses_controlled_medication?.value === true,
          getExtractedValue(healthData, 'medication_description'),
          getExtractedValue(healthData, 'health_notes'),
        ]
      );

      let enrollmentCount = 0;
      for (const modality of checkedModalities) {
        const sportResult = await client.query<{ id: string }>(
          'SELECT id FROM sports WHERE LOWER(nome) = LOWER($1) AND ativo = TRUE LIMIT 1',
          [modality.name]
        );
        const sportId = sportResult.rows[0]?.id;
        if (!sportId) continue;

        await client.query(
          `INSERT INTO enrollments (student_id, sports_id, status, observacoes)
           VALUES ($1, $2, 'ativa', $3)`,
          [studentId, sportId, 'Matrícula originada de ficha digitalizada e revisada.']
        );
        enrollmentCount++;
      }

      await client.query(
        `UPDATE digitized_documents
         SET student_id = $1, status_processamento = 'revisado', revisado_por = $2,
             revisado_em = NOW(), notas_revisao = $3
         WHERE id = $4`,
        [studentId, req.user?.userId || null, notas || null, id]
      );

      return {
        alreadyReviewed: false as const,
        student: studentResult.rows[0],
        enrollmentCount,
      };
    });

    if (!result) {
      res.status(404).json({ error: 'Documento não encontrado' });
      return;
    }
    if (result.alreadyReviewed) {
      res.status(409).json({ error: 'Este documento já foi revisado.' });
      return;
    }

    newStudent = result.student;
    createdEnrollmentsCount = result.enrollmentCount;
  } else {
    const db = dbAccess.getMemoryDb();
    const memoryDoc = db.digitized_documents.find((document) => document.id === id);
    if (!memoryDoc) {
      res.status(404).json({ error: 'Documento não encontrado' });
      return;
    }

    let guardian = db.guardians.find(
      (item) => item.cpf.replace(/\D/g, '') === guardianCpfDigits
    );
    if (!guardian) {
      guardian = {
        id: crypto.randomUUID(),
        nome_completo: guardianName,
        cpf: guardianCpf,
        rg: getExtractedValue(guardianData, 'rg'),
        nis: getExtractedValue(guardianData, 'nis'),
        telefone: guardianPhone,
        endereco: getExtractedValue(guardianData, 'address'),
        parentesco: relationship,
        ocupacao: null,
        escolaridade: null,
        renda_familiar_faixa: null,
        beneficiario_programa_social: Boolean(getExtractedValue(guardianData, 'social_program')),
        programa_social: getExtractedValue(guardianData, 'social_program'),
        created_at: now,
        updated_at: now,
      };
      db.guardians.push(guardian);
    }

    newStudent = {
      id: studentId,
      matricula_numero: matriculaNumero,
      nome_completo: studentName,
      data_nascimento: birthDate,
      cpf: getExtractedValue(studentData, 'cpf'),
      rg: getExtractedValue(studentData, 'rg'),
      orgao_emissor: getExtractedValue(studentData, 'orgao_emissor'),
      nis: getExtractedValue(studentData, 'nis'),
      etnia: getExtractedValue(studentData, 'ethnicity'),
      escola: getExtractedValue(studentData, 'school'),
      serie: getExtractedValue(studentData, 'grade'),
      turno_escolar: getExtractedValue(studentData, 'turno_escolar'),
      status: 'ativo',
      foto_url: null,
      created_at: now,
      updated_at: now,
    };
    db.students.push(newStudent);
    db.student_guardians.push({
      id: crypto.randomUUID(),
      student_id: studentId,
      guardian_id: guardian.id,
      parentesco: relationship,
      responsavel_legal: true,
      principal: true,
      created_at: now,
    });
    db.health_records.push({
      id: crypto.randomUUID(),
      student_id: studentId,
      possui_deficiencia: healthData.has_disability?.value === true,
      descricao_deficiencia: getExtractedValue(healthData, 'disability_description'),
      possui_doenca_cronica: healthData.has_chronic_disease?.value === true,
      descricao_doenca: getExtractedValue(healthData, 'chronic_disease_description'),
      utiliza_medicamento: healthData.uses_controlled_medication?.value === true,
      descricao_medicamento: getExtractedValue(healthData, 'medication_description'),
      observacoes: getExtractedValue(healthData, 'health_notes'),
      laudo_medico_apresentado: false,
      created_at: now,
      updated_at: now,
    });

    for (const modality of checkedModalities) {
      const sport = db.sports.find(
        (item) => item.nome.toLowerCase() === String(modality.name).toLowerCase()
      );
      if (!sport) continue;

      const defaultClass = db.classes.find((item) => item.sports_id === sport.id && item.ativo);
      db.enrollments.push({
        id: crypto.randomUUID(),
        student_id: studentId,
        sports_id: sport.id,
        class_id: defaultClass?.id || null,
        status: 'ativa',
        data_matricula: new Date().toISOString().split('T')[0],
        observacoes: 'Matrícula originada de ficha digitalizada e revisada.',
        created_at: now,
      });
      createdEnrollmentsCount++;
    }

    memoryDoc.student_id = studentId;
    memoryDoc.status_processamento = 'revisado';
    memoryDoc.revisado_por = req.user?.userId || null;
    memoryDoc.revisado_em = now;
    memoryDoc.notas_revisao = notas || null;
  }

  logger.info(`Ficha ${id} confirmada. Aluno ${studentName} (Matrícula #${matriculaNumero}) registrado.`);

  res.json({
    message: 'Cadastro efetivado com sucesso a partir da ficha digitalizada!',
    student: newStudent,
    enrollmentsCount: createdEnrollmentsCount,
    matricula: matriculaNumero,
  });
}

export async function rejectDocument(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = req.user?.userId || null;

  if (dbAccess.isPostgres()) {
    const result = await query(
      `UPDATE digitized_documents
       SET status_processamento = 'descartado', revisado_por = $1,
           revisado_em = NOW(), notas_revisao = $2
       WHERE id = $3
       RETURNING id`,
      [userId, 'Documento descartado pelo operador.', id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Documento não encontrado' });
      return;
    }
  } else {
    const db = dbAccess.getMemoryDb();
    const doc = db.digitized_documents.find((d) => d.id === id);
    if (!doc) {
      res.status(404).json({ error: 'Documento não encontrado' });
      return;
    }

    doc.status_processamento = 'descartado';
    doc.revisado_por = userId;
    doc.revisado_em = new Date().toISOString();
    doc.notas_revisao = 'Documento descartado pelo operador.';
  }

  res.json({
    message: 'Documento rejeitado e descartado.',
  });
}
