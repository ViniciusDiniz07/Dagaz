import { z } from 'zod';

export const createGuardianSchema = z.object({
  nome_completo: z.string().min(3, 'Nome completo obrigatório').max(255),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  rg: z.string().max(50).optional().nullable(),
  nis: z.string().max(50).optional().nullable(),
  telefone: z.string().min(8, 'Telefone de contato obrigatório').max(30),
  email: z.string().email('E-mail inválido').max(255).optional().nullable(),
  endereco: z.string().max(255).optional().nullable(),
  numero: z.string().max(30).optional().nullable(),
  bairro: z.string().max(100).optional().nullable(),
  cidade: z.string().max(100).default('Volta Redonda'),
  cep: z.string().max(10).optional().nullable(),
  parentesco: z.string().max(50).optional().nullable(),
  ocupacao: z.enum(['trabalho_formal', 'informal', 'esporadico', 'desempregado', 'aposentado_pensionista', 'outro']).default('informal'),
  escolaridade: z.enum(['nenhuma', 'fundamental', 'medio', 'superior_incompleto', 'superior_completo', 'pos_graduacao']).default('medio'),
  renda_familiar_faixa: z.enum(['ate_1_sm', 'ate_2_sm', 'ate_3_sm', 'ate_4_sm', 'acima_4_sm']).default('ate_2_sm'),
  beneficiario_programa_social: z.boolean().default(false),
  programa_social: z.string().max(100).optional().nullable(),
});
