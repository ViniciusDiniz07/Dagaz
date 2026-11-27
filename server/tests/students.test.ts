import { describe, it, expect, beforeAll } from 'vitest';
import { createStudentSchema } from '../src/modules/students/students.schema.js';
import { dbAccess, initDatabase } from '../src/db/database.js';

describe('Módulo de Alunos e Matrículas', () => {
  beforeAll(async () => {
    await initDatabase();
  });
  describe('Validação Zod de Criação de Aluno (createStudentSchema)', () => {
    it('deve validar com sucesso um payload completo de cadastro', () => {
      const validPayload = {
        nome_completo: 'Matheus Henrique de Oliveira',
        data_nascimento: '2014-06-15',
        cpf: '12345678910',
        rg: '25489765-1',
        orgao_emissor: 'DETRAN-RJ',
        nis: '10987654321',
        etnia: 'parda',
        escola: 'E.M. Professora Maria José',
        serie: '5º Ano Fundamental',
        turno_escolar: 'tarde',
        saude: {
          possui_deficiencia: false,
          possui_doenca_cronica: false,
          utiliza_medicamento: false,
          observacoes: 'Aluno apto para prática esportiva',
          laudo_medico_apresentado: true,
        },
        modalidades_ids: ['a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'],
        responsavel_id: 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
        membros_familiares: [
          {
            nome: 'Maria de Oliveira',
            parentesco: 'Mãe',
            idade: 38,
            escolaridade: 'Médio Completo',
            profissao: 'Vendedora',
            renda: 1412.0,
          },
        ],
        autorizacoes: {
          uso_imagem: true,
          declaracao_responsabilidade: true,
        },
      };

      const result = createStudentSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('deve rejeitar cadastro sem nome ou com nome muito curto', () => {
      const invalidPayload = {
        nome_completo: 'Al',
        data_nascimento: '2014-06-15',
        modalidades_ids: ['a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'],
        saude: {},
      };

      const result = createStudentSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.nome_completo).toBeDefined();
      }
    });

    it('deve rejeitar data de nascimento em formato inválido (não AAAA-MM-DD)', () => {
      const invalidPayload = {
        nome_completo: 'Carlos Eduardo Souza',
        data_nascimento: '15/06/2014', // formato brasileiro deve ser convertido
        modalidades_ids: ['a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'],
        saude: {},
      };

      const result = createStudentSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.data_nascimento).toBeDefined();
      }
    });

    it('deve rejeitar quando nenhuma modalidade esportiva for selecionada', () => {
      const invalidPayload = {
        nome_completo: 'Ana Carolina Martins',
        data_nascimento: '2015-03-20',
        modalidades_ids: [],
        saude: {},
      };

      const result = createStudentSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.modalidades_ids).toBeDefined();
      }
    });
  });

  describe('Repositório de Dados e Integridade (Database Engine)', () => {
    it('deve carregar dados pre-seedados do Condomínio Cultural e Esportivo', async () => {
      const db = dbAccess.getMemoryDb();
      expect(db.students.length).toBeGreaterThan(0);
      expect(db.sports.length).toBe(6); // 6 modalidades oficiais

      const judo = db.sports.find((s) => s.nome === 'Judô');
      expect(judo).toBeDefined();
      expect(judo?.ativo).toBe(true);
    });

    it('deve conter alunos com prontuário de saúde e vínculos de responsáveis', async () => {
      const db = dbAccess.getMemoryDb();
      const student = db.students[0];

      expect(student.id).toBeDefined();
      expect(student.matricula_numero).toBeDefined();

      const health = db.health_records.find((h) => h.student_id === student.id);
      expect(health).toBeDefined();

      const studentGuardian = db.student_guardians.find((sg) => sg.student_id === student.id);
      expect(studentGuardian).toBeDefined();
    });
  });
});
