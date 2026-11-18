import { z } from 'zod';

export const familyMemberSchema = z.object({
  nome: z.string().min(2, 'Nome do residente obrigatório'),
  parentesco: z.string().min(2, 'Parentesco obrigatório'),
  idade: z.number().int().min(0).max(120).optional().nullable(),
  escolaridade: z.string().optional().nullable(),
  profissao: z.string().optional().nullable(),
  renda: z.number().min(0).default(0),
});

export const createStudentSchema = z.object({
  // Etapa 1: Dados Pessoais
  nome_completo: z.string().min(3, 'Nome completo obrigatório').max(255),
  data_nascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve estar no formato AAAA-MM-DD'),
  cpf: z.string().max(14).optional().nullable(),
  rg: z.string().max(50).optional().nullable(),
  orgao_emissor: z.string().max(50).optional().nullable(),
  nis: z.string().max(50).optional().nullable(),
  etnia: z.enum(['branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarado']).default('parda'),
  foto_url: z.string().url().optional().nullable(),

  // Etapa 2: Escolaridade & NIS
  escola: z.string().max(255).optional().nullable(),
  serie: z.string().max(50).optional().nullable(),
  turno_escolar: z.enum(['manha', 'tarde', 'integral', 'noite']).default('tarde'),

  // Etapa 3: Ficha de Saúde & Cuidados
  saude: z.object({
    possui_deficiencia: z.boolean().default(false),
    descricao_deficiencia: z.string().optional().nullable(),
    possui_doenca_cronica: z.boolean().default(false),
    descricao_doenca: z.string().optional().nullable(),
    utiliza_medicamento: z.boolean().default(false),
    descricao_medicamento: z.string().optional().nullable(),
    observacoes: z.string().optional().nullable(),
    laudo_medico_apresentado: z.boolean().default(true),
  }),

  // Etapa 4: Modalidades Esportivas pretendidas (pode selecionar 1 ou mais turmas)
  modalidades_ids: z.array(z.string().uuid()).min(1, 'Selecione pelo menos uma modalidade esportiva'),
  turma_id: z.string().uuid().optional().nullable(),

  // Etapa 5: Responsável Legal
  responsavel_id: z.string().uuid().optional().nullable(),
  novo_responsavel: z
    .object({
      nome_completo: z.string().min(3),
      cpf: z.string().min(11),
      rg: z.string().optional().nullable(),
      nis: z.string().optional().nullable(),
      telefone: z.string().min(8),
      email: z.string().email().optional().nullable(),
      endereco: z.string().optional().nullable(),
      numero: z.string().optional().nullable(),
      bairro: z.string().optional().nullable(),
      cidade: z.string().default('Volta Redonda'),
      cep: z.string().optional().nullable(),
      parentesco: z.string().default('Mãe'),
      ocupacao: z.enum(['trabalho_formal', 'informal', 'esporadico', 'desempregado', 'aposentado_pensionista', 'outro']).default('informal'),
      escolaridade: z.enum(['nenhuma', 'fundamental', 'medio', 'superior_incompleto', 'superior_completo', 'pos_graduacao']).default('medio'),
      renda_familiar_faixa: z.enum(['ate_1_sm', 'ate_2_sm', 'ate_3_sm', 'ate_4_sm', 'acima_4_sm']).default('ate_2_sm'),
      beneficiario_programa_social: z.boolean().default(false),
      programa_social: z.string().optional().nullable(),
    })
    .optional(),

  // Composição Familiar Dinâmica
  residentes_domicilio: z.array(familyMemberSchema).optional(),

  // Autorizações da Ficha Física
  autorizacao_imagem: z.boolean().default(true),
  declaracao_responsabilidade: z.boolean().default(true),
});

export const updateStudentSchema = createStudentSchema.partial();
