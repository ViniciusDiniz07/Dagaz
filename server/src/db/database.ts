import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

// Interface unificada de resultado de consulta
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DbClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
}

let pool: pg.Pool | null = null;
let isPostgres = false;

// Armazenamento em memória compatível caso o PostgreSQL externo ainda não esteja configurado
interface InMemoryDb {
  users: any[];
  sports: any[];
  classes: any[];
  guardians: any[];
  students: any[];
  student_guardians: any[];
  health_records: any[];
  family_members: any[];
  enrollments: any[];
  authorizations: any[];
  digitized_documents: any[];
  audit_logs: any[];
}

const memoryDb: InMemoryDb = {
  users: [],
  sports: [],
  classes: [],
  guardians: [],
  students: [],
  student_guardians: [],
  health_records: [],
  family_members: [],
  enrollments: [],
  authorizations: [],
  digitized_documents: [],
  audit_logs: [],
};

export async function initDatabase(): Promise<void> {
  if (!env.SUPABASE_DB_URL && env.NODE_ENV === 'production') {
    throw new Error('SUPABASE_DB_URL é obrigatória em produção.');
  }

  if (env.SUPABASE_DB_URL) {
    try {
      pool = new Pool({
        connectionString: env.SUPABASE_DB_URL,
        ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();

      isPostgres = true;
      logger.info('Conectado com sucesso ao banco PostgreSQL/Supabase.');
      return;
    } catch (err) {
      logger.error('Falha ao conectar ao PostgreSQL/Supabase:', err);
      if (env.NODE_ENV === 'production') {
        throw err;
      }
    }
  }

  // O repositório em memória com dados de demonstração é usado apenas no desenvolvimento local.
  isPostgres = false;
  logger.info('PostgreSQL ausente; inicializando repositório de demonstração para desenvolvimento local.');
  await populateLocalSeedData();
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  if (isPostgres && pool) {
    const res = await pool.query(sql, params);
    return {
      rows: res.rows as unknown as T[],
      rowCount: res.rowCount ?? res.rows.length,
    };
  }

  // Execução via motor em memória
  return executeInMemoryQuery<T>(sql, params);
}

export async function withTransaction<T>(callback: (client: DbClient) => Promise<T>): Promise<T> {
  if (isPostgres && pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback({
        query: (text, params) => client.query(text, params) as any,
      });
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Em memória
  return callback({
    query: (text, params) => query(text, params),
  });
}

// Inicializa dados iniciais oficiais no repositório local
async function populateLocalSeedData() {
  const defaultPassword = 'Admin@Dagaz2026!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Usuários
  memoryDb.users = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      nome: 'Administradora do Condomínio',
      email: 'admin@esportedagaz.org.br',
      password_hash: hashedPassword,
      role: 'admin',
      status: 'ativo',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBChBO9tG8PRhqI1ug191m9AREUAfREBjJoA_WvoDxQWji50XhMASMaLzu0MnMN5bBEPZnuY6XwqKxutBmFQu8B1LSq51YgtE_3XgeaF4fHrpximG3jvVJOZwbSuKMOgA1k2E79uvN3_4Cg3zn1GxaODsA8rx63Xw8GkCApwYaf8OIblvv_i6EB0MFCfdxUPMIT2kRyqUBcjpMkDt5BnD8VVLrahJ1rMoJNV0gw9BE',
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      nome: 'Ana Silva',
      email: 'ana.silva@esportedagaz.org.br',
      password_hash: hashedPassword,
      role: 'coordenador',
      status: 'ativo',
      avatar_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBChBO9tG8PRhqI1ug191m9AREUAfREBjJoA_WvoDxQWji50XhMASMaLzu0MnMN5bBEPZnuY6XwqKxutBmFQu8B1LSq51YgtE_3XgeaF4fHrpximG3jvVJOZwbSuKMOgA1k2E79uvN3_4Cg3zn1GxaODsA8rx63Xw8GkCApwYaf8OIblvv_i6EB0MFCfdxUPMIT2kRyqUBcjpMkDt5BnD8VVLrahJ1rMoJNV0gw9BE',
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      nome: 'Carlos Santos',
      email: 'carlos.santos@esportedagaz.org.br',
      password_hash: hashedPassword,
      role: 'atendente',
      status: 'ativo',
      avatar_url: null,
      failed_login_attempts: 0,
      locked_until: null,
      created_at: new Date().toISOString(),
    },
  ];

  // Modalidades
  memoryDb.sports = [
    { id: '10000000-0000-0000-0000-000000000001', nome: 'Capoeira', descricao: 'Expressão cultural e disciplina.', categoria: 'Arte Marcial', icone: 'sports_martial_arts', ativo: true },
    { id: '10000000-0000-0000-0000-000000000002', nome: 'Treinamento Funcional', descricao: 'Equilíbrio e coordenação motora.', categoria: 'Condicionamento', icone: 'fitness_center', ativo: true },
    { id: '10000000-0000-0000-0000-000000000003', nome: 'Judô', descricao: 'Formação socioesportiva e respeito.', categoria: 'Artes Marciais', icone: 'sports_kabaddi', ativo: true },
    { id: '10000000-0000-0000-0000-000000000004', nome: 'Basquete 3x3', descricao: 'Dinamismo e trabalho em equipe.', categoria: 'Esporte Coletivo', icone: 'sports_basketball', ativo: true },
    { id: '10000000-0000-0000-0000-000000000005', nome: 'Futsal', descricao: 'Iniciação desportiva formativa.', categoria: 'Esporte Coletivo', icone: 'sports_soccer', ativo: true },
    { id: '10000000-0000-0000-0000-000000000006', nome: 'Futevôlei', descricao: 'Prática na areia e lazer saudável.', categoria: 'Esporte de Areia', icone: 'sports_volleyball', ativo: true },
  ];

  // Turmas
  memoryDb.classes = [
    { id: '20000000-0000-0000-0000-000000000001', sports_id: '10000000-0000-0000-0000-000000000003', nome: 'Turma Infantil II', faixa_etaria: 'Sub-11 / Sub-13', dias_semana: 'Terça e Quinta', horario: '14:00 - 15:30', turno: 'tarde', local: 'Núcleo Central', capacidade: 30, ativo: true },
    { id: '20000000-0000-0000-0000-000000000002', sports_id: '10000000-0000-0000-0000-000000000005', nome: 'Iniciação Sub-11', faixa_etaria: 'Sub-11', dias_semana: 'Sábados', horario: '09:00 - 10:45', turno: 'sabado', local: 'Quadra do Condomínio', capacidade: 25, ativo: true },
    { id: '20000000-0000-0000-0000-000000000003', sports_id: '10000000-0000-0000-0000-000000000004', nome: 'Turma Juvenil B', faixa_etaria: 'Sub-15', dias_semana: 'Quarta e Sexta', horario: '10:15 - 11:45', turno: 'manha', local: 'Quadra do Condomínio', capacidade: 20, ativo: true },
    { id: '20000000-0000-0000-0000-000000000004', sports_id: '10000000-0000-0000-0000-000000000001', nome: 'Capoeira Regional Misto', faixa_etaria: 'Misto Geral', dias_semana: 'Terça e Quinta', horario: '09:00 - 10:30', turno: 'manha', local: 'Galpão Cultural', capacidade: 30, ativo: true },
    { id: '20000000-0000-0000-0000-000000000005', sports_id: '10000000-0000-0000-0000-000000000002', nome: 'Treino Funcional Jovens', faixa_etaria: 'Sub-17', dias_semana: 'Segunda e Sexta', horario: '16:30 - 17:30', turno: 'tarde', local: 'Espaço Fitness', capacidade: 25, ativo: true },
    { id: '20000000-0000-0000-0000-000000000006', sports_id: '10000000-0000-0000-0000-000000000006', nome: 'Futevôlei Comunitário', faixa_etaria: 'Sub-15 a Adulto', dias_semana: 'Sábados', horario: '14:00 - 15:30', turno: 'sabado', local: 'Arena de Areia', capacidade: 20, ativo: true },
  ];

  // Responsáveis
  memoryDb.guardians = [
    { id: '30000000-0000-0000-0000-000000000001', nome_completo: 'Patrícia Monteiro', cpf: '294.819.332-10', rg: '24.112.980-4 DETRAN/RJ', nis: '160.294.110-82', telefone: '(24) 99812-4411', email: 'patricia.monteiro@email.com', endereco: 'Rua 16, Vila Rica', numero: '140', bairro: 'Vila Rica', cidade: 'Volta Redonda', cep: '27255-010', parentesco: 'Mãe', ocupacao: 'trabalho_formal', escolaridade: 'medio', renda_familiar_faixa: 'ate_2_sm', beneficiario_programa_social: true, programa_social: 'Bolsa Família' },
    { id: '30000000-0000-0000-0000-000000000002', nome_completo: 'Roberto Alves', cpf: '405.122.991-44', rg: '18.990.214-5 DETRAN/RJ', nis: '201.884.221-09', telefone: '(24) 98103-7729', email: 'roberto.alves@email.com', endereco: 'Av. Amaral Peixoto', numero: '512', bairro: 'Centro', cidade: 'Volta Redonda', cep: '27253-000', parentesco: 'Pai', ocupacao: 'informal', escolaridade: 'fundamental', renda_familiar_faixa: 'ate_2_sm', beneficiario_programa_social: false, programa_social: null },
    { id: '30000000-0000-0000-0000-000000000003', nome_completo: 'Juliana da Silva', cpf: '510.339.814-22', rg: '31.445.882-9 DETRAN/RJ', nis: '198.441.902-33', telefone: '(24) 99312-8800', email: 'juliana.silva@email.com', endereco: 'Rua B, Santo Agostinho', numero: '88', bairro: 'Santo Agostinho', cidade: 'Volta Redonda', cep: '27210-100', parentesco: 'Tia', ocupacao: 'esporadico', escolaridade: 'medio', renda_familiar_faixa: 'ate_1_sm', beneficiario_programa_social: true, programa_social: 'Bolsa Família' },
    { id: '30000000-0000-0000-0000-000000000004', nome_completo: 'Marcos Costa', cpf: '109.442.871-00', rg: '09.112.540-1 DETRAN/RJ', nis: '122.091.448-91', telefone: '(24) 99245-1199', email: 'marcos.costa@email.com', endereco: 'Rua 4, Conforto', numero: '22', bairro: 'Conforto', cidade: 'Volta Redonda', cep: '27260-200', parentesco: 'Avô', ocupacao: 'aposentado_pensionista', escolaridade: 'fundamental', renda_familiar_faixa: 'ate_1_sm', beneficiario_programa_social: false, programa_social: null },
    { id: '30000000-0000-0000-0000-000000000005', nome_completo: 'Mariana dos Santos Rocha', cpf: '182.904.319-88', rg: '28.910.443-2 DETRAN/RJ', nis: '209.431.882-90', telefone: '(24) 99842-1102', email: 'mariana.rocha@email.com', endereco: 'Rua Projetada B', numero: '45', bairro: 'Santo Agostinho', cidade: 'Volta Redonda', cep: '27210-400', parentesco: 'Mãe', ocupacao: 'informal', escolaridade: 'medio', renda_familiar_faixa: 'ate_1_sm', beneficiario_programa_social: true, programa_social: 'Bolsa Família' },
  ];

  // Alunos
  memoryDb.students = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      matricula_numero: '2025-014',
      nome_completo: 'Gabriel Monteiro Santos',
      data_nascimento: '2014-03-12',
      cpf: '194.882.301-11',
      rg: '33.190.221-0',
      orgao_emissor: 'DETRAN/RJ',
      nis: '210.441.982-11',
      etnia: 'parda',
      escola: 'E.M. Professora Maria José',
      serie: '6º Ano',
      turno_escolar: 'manha',
      status: 'ativo',
      foto_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVvDTAxLxeODW44EobujUHpS15WRLFYjc12zgEPvoaJnQdWJ03c9YLWJNvLHDu_BdzOXLPdVRhX-hTNg5x6ZNzUG5MhQgtPWVF9ZSUe5UBNbvYE8W4tMFwT1Nr8qwsErSdu7l0OZwTOD8TPwUMUdjWyTvlcWlapfAtohl0SMp73oCebdqsWN-l2fmXwjpULbpIB8YQ0D8Eyz7f6zEi5EuOupHTpabkP7fRAYYs_V0',
      created_at: '2025-02-12T10:00:00Z',
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      matricula_numero: '2025-089',
      nome_completo: 'Beatriz Lima Alves',
      data_nascimento: '2016-08-20',
      cpf: '188.409.112-76',
      rg: '35.882.100-4',
      orgao_emissor: 'DETRAN/RJ',
      nis: '215.990.142-88',
      etnia: 'preta',
      escola: 'C.E. Barão de Mauá',
      serie: '4º Ano',
      turno_escolar: 'tarde',
      status: 'ativo',
      foto_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0rzeyCh1h4fpEhEx_56qrR_fAEfx3eaEv5-NVw3Zxqkwk7RpyvFQphf9Eb7e_qg_fShOpT5D9pA-rCUszHgCb_dhLa8m1E_iNtze4FKycJSiuPnqlQzN0io3Sr3dRf6n-fWB_J1WajISvsHPy1-Mo63mQJVzH7ZOfeO9WJ-VWEoPVze6pbfsYBbXMdoj-h__5Xgo4QDBm65564N2Mvm7CKNn_7kOvUnsHa1sGWiE',
      created_at: '2025-02-05T14:30:00Z',
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      matricula_numero: '2025-231',
      nome_completo: 'Enzo Gabriel da Silva',
      data_nascimento: '2011-05-18',
      cpf: '170.329.800-45',
      rg: '31.400.912-3',
      orgao_emissor: 'DETRAN/RJ',
      nis: '199.301.442-01',
      etnia: 'parda',
      escola: 'E.M. Waldir Carvalho',
      serie: '8º Ano',
      turno_escolar: 'manha',
      status: 'ativo',
      foto_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaRiYc6j1V4ymi_GI2YIUGZfYvF-zYv4QH7HNsj7YXBdtsEj1OcYUduLKgmLPqmN7pZtSJFc1w74B4k1ylNv75CbHbStO9lqD5ELJzzfIZxvB0JoP6_HuMSk3islnsmP4gkMaOKwD9Qw5_C7AacNZavfc0-9LFwkm84A8HKyUhxDLWCeikOKrgdrePxdCm4qj5D13SstfdvyndwI3By7m0A9kaojEJxk-NC7m4Rlw',
      created_at: '2025-02-20T09:15:00Z',
    },
    {
      id: '40000000-0000-0000-0000-000000000004',
      matricula_numero: '2024-512',
      nome_completo: 'Larissa Ferreira Costa',
      data_nascimento: '2012-11-04',
      cpf: '182.901.440-23',
      rg: '32.190.412-8',
      orgao_emissor: 'DETRAN/RJ',
      nis: '202.991.400-12',
      etnia: 'branca',
      escola: 'E.M. Getúlio Vargas',
      serie: '7º Ano',
      turno_escolar: 'tarde',
      status: 'trancado',
      foto_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARYYfrvC88tEBPsPH2n0dhiM910hgak7MaLoLsYhGap27CVb28MVh9NqJrnpZHIMPlkjR3OBu5NlPdKVWmdEjTavaTJTRBLwazEVhmJVLFfxiJH3ru3LXvw9w9cfBRNG9LGjj74ZoICan070t1d6JQZruRBFWNYQadT3nvbHIQvpJob0Vc7Ta-eF0yabMMSiaLJxHbABCj-kod_gusxtUEUE2Rh4GHbNLO2yjMayE',
      created_at: '2024-03-10T11:00:00Z',
    },
    {
      id: '40000000-0000-0000-0000-000000000005',
      matricula_numero: '2025-401',
      nome_completo: 'Felipe dos Santos Rocha',
      data_nascimento: '2013-05-14',
      cpf: '145.892.307-44',
      rg: '31.849.201-8 DETRAN-RJ',
      orgao_emissor: 'DETRAN/RJ',
      nis: '209.431.882-90',
      etnia: 'parda',
      escola: 'E.M. Professora Maria José',
      serie: '7º Ano',
      turno_escolar: 'tarde',
      status: 'ativo',
      foto_url: null,
      created_at: '2025-02-18T16:00:00Z',
    },
  ];

  // Vínculos
  memoryDb.student_guardians = [
    { id: '1', student_id: '40000000-0000-0000-0000-000000000001', guardian_id: '30000000-0000-0000-0000-000000000001', parentesco: 'Mãe', responsavel_legal: true, principal: true },
    { id: '2', student_id: '40000000-0000-0000-0000-000000000002', guardian_id: '30000000-0000-0000-0000-000000000002', parentesco: 'Pai', responsavel_legal: true, principal: true },
    { id: '3', student_id: '40000000-0000-0000-0000-000000000003', guardian_id: '30000000-0000-0000-0000-000000000003', parentesco: 'Tia', responsavel_legal: true, principal: true },
    { id: '4', student_id: '40000000-0000-0000-0000-000000000004', guardian_id: '30000000-0000-0000-0000-000000000004', parentesco: 'Avô', responsavel_legal: true, principal: true },
    { id: '5', student_id: '40000000-0000-0000-0000-000000000005', guardian_id: '30000000-0000-0000-0000-000000000005', parentesco: 'Mãe', responsavel_legal: true, principal: true },
  ];

  // Saúde
  memoryDb.health_records = [
    { id: '1', student_id: '40000000-0000-0000-0000-000000000001', possui_deficiencia: false, descricao_deficiencia: null, possui_doenca_cronica: false, descricao_doenca: null, utiliza_medicamento: false, descricao_medicamento: null, observacoes: 'Apto para atividades esportivas sem restrições.', laudo_medico_apresentado: true },
    { id: '2', student_id: '40000000-0000-0000-0000-000000000002', possui_deficiencia: false, descricao_deficiencia: null, possui_doenca_cronica: false, descricao_doenca: null, utiliza_medicamento: false, descricao_medicamento: null, observacoes: 'Atestado de aptidão física em dia.', laudo_medico_apresentado: true },
    { id: '3', student_id: '40000000-0000-0000-0000-000000000003', possui_deficiencia: false, descricao_deficiencia: null, possui_doenca_cronica: false, descricao_doenca: null, utiliza_medicamento: false, descricao_medicamento: null, observacoes: 'Pendente entrega de laudo dermatológico.', laudo_medico_apresentado: false },
    { id: '4', student_id: '40000000-0000-0000-0000-000000000004', possui_deficiencia: false, descricao_deficiencia: null, possui_doenca_cronica: false, descricao_doenca: null, utiliza_medicamento: false, descricao_medicamento: null, observacoes: 'Liberada para retorno gradual após entorse.', laudo_medico_apresentado: true },
    { id: '5', student_id: '40000000-0000-0000-0000-000000000005', possui_deficiencia: false, descricao_deficiencia: null, possui_doenca_cronica: true, descricao_doenca: 'Possui asma moderada - usa bombinha quando necessário', utiliza_medicamento: true, descricao_medicamento: 'Salbutamol spray 100mcg', observacoes: 'Manter bombinha na mochila durante treinos.', laudo_medico_apresentado: true },
  ];

  // Matrículas
  memoryDb.enrollments = [
    { id: 'e1', student_id: '40000000-0000-0000-0000-000000000001', sports_id: '10000000-0000-0000-0000-000000000003', class_id: '20000000-0000-0000-0000-000000000001', status: 'ativa', data_matricula: '2025-02-12', observacoes: 'Judô regular' },
    { id: 'e2', student_id: '40000000-0000-0000-0000-000000000002', sports_id: '10000000-0000-0000-0000-000000000005', class_id: '20000000-0000-0000-0000-000000000002', status: 'ativa', data_matricula: '2025-02-05', observacoes: 'Futsal feminino regular' },
    { id: 'e3', student_id: '40000000-0000-0000-0000-000000000003', sports_id: '10000000-0000-0000-0000-000000000004', class_id: '20000000-0000-0000-0000-000000000003', status: 'aguardando_vaga', data_matricula: '2025-02-20', observacoes: 'Pendente OCR e laudo' },
    { id: 'e4', student_id: '40000000-0000-0000-0000-000000000004', sports_id: '10000000-0000-0000-0000-000000000001', class_id: '20000000-0000-0000-0000-000000000004', status: 'trancada', data_matricula: '2024-03-10', observacoes: 'Trancada a pedido do avô' },
    { id: 'e5', student_id: '40000000-0000-0000-0000-000000000005', sports_id: '10000000-0000-0000-0000-000000000003', class_id: '20000000-0000-0000-0000-000000000001', status: 'ativa', data_matricula: '2025-02-18', observacoes: 'Importado de ficha IA' },
    { id: 'e6', student_id: '40000000-0000-0000-0000-000000000005', sports_id: '10000000-0000-0000-0000-000000000005', class_id: '20000000-0000-0000-0000-000000000002', status: 'ativa', data_matricula: '2025-02-18', observacoes: 'Importado de ficha IA' },
  ];

  // Documentos digitalizados
  memoryDb.digitized_documents = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      student_id: '40000000-0000-0000-0000-000000000005',
      arquivo_nome: 'ficha_inscricao_felipe_santos_2025.jpg',
      arquivo_tipo: 'image/jpeg',
      arquivo_tamanho: 1887436,
      arquivo_caminho: '/sample-fichas/ficha_exemplo_dagaz_2026.jpg',
      status_processamento: 'concluido',
      confianca_geral: 96.0,
      dados_extraidos: {
        student: {
          name: { value: 'Felipe dos Santos Rocha', confidence: 0.99, status: 'read' },
          birth_date: { value: '2013-05-14', confidence: 0.97, status: 'read' },
          calculated_age: { value: 12, confidence: 1.0, status: 'read' },
          cpf: { value: '145.892.307-44', confidence: 0.94, status: 'read' },
          rg: { value: '31.849.201-8 DETRAN-RJ', confidence: 0.91, status: 'read' },
          nis: { value: '209.431.882-90', confidence: 0.95, status: 'read' },
          ethnicity: { value: 'parda', confidence: 0.96, status: 'read' },
          school: { value: 'E.M. Professora Maria José', confidence: 0.95, status: 'read' },
          grade: { value: '7º Ano', confidence: 0.93, status: 'read' },
        },
        guardian: {
          name: { value: 'Mariana dos Santos Rocha', confidence: 0.98, status: 'read' },
          relationship: { value: 'Mãe', confidence: 0.99, status: 'read' },
          phone: { value: '(24) 99842-1102', confidence: 0.97, status: 'read' },
          address: { value: 'Rua Projetada B, 45 - Bairro Santo Agostinho, Volta Redonda/RJ', confidence: 0.98, status: 'read' },
          social_program: { value: 'Bolsa Família', confidence: 0.95, status: 'read' },
        },
        health: {
          has_disability: { value: false, confidence: 0.98, status: 'read' },
          has_chronic_disease: { value: true, confidence: 0.95, status: 'read' },
          chronic_disease_description: { value: 'Possui asma moderada - usa bombinha quando necessário', confidence: 0.94, status: 'read' },
          uses_controlled_medication: { value: true, confidence: 0.92, status: 'read' },
        },
        modalities: [
          { name: 'Judô', checked: true, confidence: 0.98 },
          { name: 'Futsal', checked: true, confidence: 0.97 },
          { name: 'Capoeira', checked: false, confidence: 0.99 },
          { name: 'Treinamento Funcional', checked: false, confidence: 0.99 },
          { name: 'Basquete 3x3', checked: false, confidence: 0.99 },
          { name: 'Futevôlei', checked: false, confidence: 0.99 },
        ],
        authorizations: {
          image_use: { value: true, confidence: 0.99, status: 'read' },
          responsibility_declaration: { value: true, confidence: 0.99, status: 'read' },
        },
        review_required: false,
      },
      revisado_por: '00000000-0000-0000-0000-000000000002',
      revisado_em: new Date().toISOString(),
      notas_revisao: 'Conferido com base na ficha física assinada.',
      created_at: new Date().toISOString(),
    },
  ];

  // Logs de auditoria
  memoryDb.audit_logs = [
    {
      id: '1',
      user_id: '00000000-0000-0000-0000-000000000002',
      user_email: 'ana.silva@esportedagaz.org.br',
      acao: 'LOGIN',
      entidade: 'auth',
      entidade_id: null,
      ip: '192.168.1.10',
      resultado: 'SUCESSO',
      detalhes: { dispositivo: 'Mobile Chrome' },
      data_hora: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      user_id: '00000000-0000-0000-0000-000000000002',
      user_email: 'ana.silva@esportedagaz.org.br',
      acao: 'OCR_VALIDATE',
      entidade: 'digitized_documents',
      entidade_id: '50000000-0000-0000-0000-000000000001',
      ip: '192.168.1.10',
      resultado: 'SUCESSO',
      detalhes: { documento: 'ficha_inscricao_felipe_santos_2025.jpg' },
      data_hora: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      user_id: '00000000-0000-0000-0000-000000000002',
      user_email: 'ana.silva@esportedagaz.org.br',
      acao: 'ENROLLMENT_CREATE',
      entidade: 'enrollments',
      entidade_id: '40000000-0000-0000-0000-000000000001',
      ip: '192.168.1.10',
      resultado: 'SUCESSO',
      detalhes: { modalidade: 'Judô', turma: 'Turma Infantil II' },
      data_hora: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    },
  ];
}

// Implementação em memória dos métodos SQL principais
function executeInMemoryQuery<T>(sql: string, params: any[]): QueryResult<T> {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ');
  const upperSql = normalizedSql.toUpperCase();

  // 1. SELECT FROM users WHERE email = $1
  if (upperSql.includes('FROM USERS WHERE EMAIL =') || upperSql.includes('FROM USERS WHERE LOWER(EMAIL) =')) {
    const emailParam = String(params[0] || '').toLowerCase();
    const found = memoryDb.users.filter((u) => u.email.toLowerCase() === emailParam);
    return { rows: found as T[], rowCount: found.length };
  }

  // 2. SELECT FROM users WHERE id = $1
  if (upperSql.includes('FROM USERS WHERE ID =')) {
    const idParam = String(params[0] || '');
    const found = memoryDb.users.filter((u) => u.id === idParam);
    return { rows: found as T[], rowCount: found.length };
  }

  // 3. SELECT FROM sports
  if (upperSql.includes('FROM SPORTS')) {
    const rows = memoryDb.sports.filter((s) => s.ativo);
    return { rows: rows as T[], rowCount: rows.length };
  }

  // 4. SELECT FROM classes
  if (upperSql.includes('FROM CLASSES')) {
    let rows = [...memoryDb.classes];
    if (params.length > 0 && upperSql.includes('SPORTS_ID =')) {
      rows = rows.filter((c) => c.sports_id === params[0]);
    }
    return { rows: rows as T[], rowCount: rows.length };
  }

  // 5. SELECT FROM digitized_documents WHERE id = $1
  if (upperSql.includes('FROM DIGITIZED_DOCUMENTS WHERE ID =')) {
    const docId = String(params[0] || '');
    const found = memoryDb.digitized_documents.filter((d) => d.id === docId);
    return { rows: found as T[], rowCount: found.length };
  }

  // 6. INSERT INTO digitized_documents
  if (upperSql.startsWith('INSERT INTO DIGITIZED_DOCUMENTS')) {
    const newDoc = {
      id: params[0] || crypto.randomUUID(),
      student_id: params[1] || null,
      arquivo_nome: params[2],
      arquivo_tipo: params[3],
      arquivo_tamanho: params[4],
      arquivo_caminho: params[5],
      status_processamento: params[6] || 'concluido',
      confianca_geral: params[7] || 95.0,
      dados_extraidos: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
      revisado_por: params[9] || null,
      revisado_em: params[10] || null,
      notas_revisao: params[11] || null,
      created_at: new Date().toISOString(),
    };
    memoryDb.digitized_documents.push(newDoc);
    return { rows: [newDoc as unknown as T], rowCount: 1 };
  }

  // 7. INSERT INTO audit_logs
  if (upperSql.startsWith('INSERT INTO AUDIT_LOGS')) {
    const newLog = {
      id: crypto.randomUUID(),
      user_id: params[0] || null,
      user_email: params[1] || null,
      acao: params[2],
      entidade: params[3],
      entidade_id: params[4] || null,
      ip: params[5] || null,
      user_agent: params[6] || null,
      resultado: params[7],
      detalhes: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
      data_hora: new Date().toISOString(),
    };
    memoryDb.audit_logs.unshift(newLog);
    return { rows: [newLog as unknown as T], rowCount: 1 };
  }

  // 8. SELECT FROM audit_logs
  if (upperSql.includes('FROM AUDIT_LOGS')) {
    return { rows: memoryDb.audit_logs as T[], rowCount: memoryDb.audit_logs.length };
  }

  // 9. INSERT INTO students
  if (upperSql.startsWith('INSERT INTO STUDENTS')) {
    const newStudent = {
      id: params[0] || crypto.randomUUID(),
      matricula_numero: params[1] || `2025-${Math.floor(100 + Math.random() * 900)}`,
      nome_completo: params[2],
      data_nascimento: params[3],
      cpf: params[4] || null,
      rg: params[5] || null,
      orgao_emissor: params[6] || 'DETRAN/RJ',
      nis: params[7] || null,
      etnia: params[8] || 'parda',
      escola: params[9] || null,
      serie: params[10] || null,
      turno_escolar: params[11] || 'tarde',
      status: params[12] || 'ativo',
      foto_url: params[13] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.students.push(newStudent);
    return { rows: [newStudent as unknown as T], rowCount: 1 };
  }

  // 10. INSERT INTO guardians
  if (upperSql.startsWith('INSERT INTO GUARDIANS')) {
    const newGuardian = {
      id: params[0] || crypto.randomUUID(),
      nome_completo: params[1],
      cpf: params[2],
      rg: params[3] || null,
      nis: params[4] || null,
      telefone: params[5],
      email: params[6] || null,
      endereco: params[7] || null,
      numero: params[8] || null,
      bairro: params[9] || null,
      cidade: params[10] || 'Volta Redonda',
      cep: params[11] || null,
      parentesco: params[12] || null,
      ocupacao: params[13] || 'trabalho_formal',
      escolaridade: params[14] || 'medio',
      renda_familiar_faixa: params[15] || 'ate_2_sm',
      beneficiario_programa_social: params[16] || false,
      programa_social: params[17] || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.guardians.push(newGuardian);
    return { rows: [newGuardian as unknown as T], rowCount: 1 };
  }

  // 11. INSERT INTO health_records
  if (upperSql.startsWith('INSERT INTO HEALTH_RECORDS')) {
    const newHealth = {
      id: params[0] || crypto.randomUUID(),
      student_id: params[1],
      possui_deficiencia: params[2] || false,
      descricao_deficiencia: params[3] || null,
      possui_doenca_cronica: params[4] || false,
      descricao_doenca: params[5] || null,
      utiliza_medicamento: params[6] || false,
      descricao_medicamento: params[7] || null,
      observacoes: params[8] || null,
      laudo_medico_apresentado: params[9] ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.health_records.push(newHealth);
    return { rows: [newHealth as unknown as T], rowCount: 1 };
  }

  // 12. INSERT INTO enrollments
  if (upperSql.startsWith('INSERT INTO ENROLLMENTS')) {
    const newEnrollment = {
      id: params[0] || crypto.randomUUID(),
      student_id: params[1],
      sports_id: params[2],
      class_id: params[3] || null,
      status: params[4] || 'ativa',
      data_matricula: params[5] || new Date().toISOString().split('T')[0],
      observacoes: params[6] || null,
      created_at: new Date().toISOString(),
    };
    memoryDb.enrollments.push(newEnrollment);
    return { rows: [newEnrollment as unknown as T], rowCount: 1 };
  }

  // 13. INSERT INTO student_guardians
  if (upperSql.startsWith('INSERT INTO STUDENT_GUARDIANS')) {
    const newLink = {
      id: crypto.randomUUID(),
      student_id: params[0],
      guardian_id: params[1],
      parentesco: params[2] || 'Responsável',
      responsavel_legal: params[3] ?? true,
      principal: params[4] ?? true,
      created_at: new Date().toISOString(),
    };
    memoryDb.student_guardians.push(newLink);
    return { rows: [newLink as unknown as T], rowCount: 1 };
  }

  // 14. INSERT INTO family_members
  if (upperSql.startsWith('INSERT INTO FAMILY_MEMBERS')) {
    const newMember = {
      id: crypto.randomUUID(),
      guardian_id: params[0],
      nome: params[1],
      parentesco: params[2],
      idade: params[3] || null,
      escolaridade: params[4] || null,
      profissao: params[5] || null,
      renda: params[6] || 0.0,
      created_at: new Date().toISOString(),
    };
    memoryDb.family_members.push(newMember);
    return { rows: [newMember as unknown as T], rowCount: 1 };
  }

  // 15. INSERT INTO authorizations
  if (upperSql.startsWith('INSERT INTO AUTHORIZATIONS')) {
    const newAuth = {
      id: crypto.randomUUID(),
      student_id: params[0],
      guardian_id: params[1],
      autorizacao_imagem: params[2] ?? true,
      declaracao_responsabilidade: params[3] ?? true,
      nome_legivel_responsavel: params[4] || null,
      assistente_social_responsavel: params[5] || null,
      cidade_assinatura: params[6] || 'Volta Redonda',
      data_assinatura: params[7] || new Date().toISOString().split('T')[0],
      observacoes: params[8] || null,
      created_at: new Date().toISOString(),
    };
    memoryDb.authorizations.push(newAuth);
    return { rows: [newAuth as unknown as T], rowCount: 1 };
  }

  // 16. Fallback padrão para SELECT de Students/Matrículas/Etc.
  return { rows: [] as T[], rowCount: 0 };
}

// Funções de acesso direto a dados consolidados
export const dbAccess = {
  getMemoryDb: () => memoryDb,
  isPostgres: () => isPostgres,
};
