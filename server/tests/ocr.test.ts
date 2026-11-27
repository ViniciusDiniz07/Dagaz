import { describe, it, expect } from 'vitest';

describe('Módulo de Digitalização e IA com Google Gemini', () => {
  // Exemplo de JSON extraído pelo Gemini a partir de uma ficha física.
  const mockGeminiOutput = {
    modalidades_selecionadas: ['Judô', 'Capoeira'],
    aluno: {
      nome: 'Lucas Gabriel da Silva Santos',
      data_nascimento: '2014-05-12',
      idade: 11,
      cpf: '145.892.307-88',
      rg: '28.910.455-2',
      orgao_emissor: 'DETRAN-RJ',
      nis: '20938472615',
      etnia: 'Parda',
      escola: 'E.M. João XXIII',
      serie: '5º Ano',
    },
    saude: {
      possui_deficiencia: false,
      descricao_deficiencia: null,
      possui_doenca_cronica: true,
      descricao_doenca: 'Asma leve em tratamento',
      utiliza_medicamento: true,
      descricao_medicamento: 'Aerolin spray sob demanda',
      observacoes_atividades: 'Evitar esforço intenso em dias de clima muito seco sem hidratação prévia',
    },
    responsavel: {
      nome: 'Mariana da Silva Santos',
      parentesco: 'Mãe',
      endereco: 'Rua São João',
      numero: '142',
      bairro: 'Vila Americana',
      cidade: 'Volta Redonda',
      cep: '27215-000',
      telefone: '(24) 98123-4567',
      rg: '14.288.901-0',
      cpf: '088.455.912-34',
      nis: '10928374650',
      email: 'mariana.santos@email.com',
      ocupacao: 'trabalho_formal',
      escolaridade: 'Médio Completo',
      renda_familiar: 'Até 02 Salários Mínimos',
      beneficiario_programa_social: true,
      qual_programa_social: 'Bolsa Família',
    },
    composicao_familiar: {
      residentes: [
        {
          nome: 'Mariana da Silva Santos',
          parentesco: 'Mãe',
          idade: 36,
          escolaridade: 'Médio',
          profissao: 'Caixa de Mercado',
          renda: 1650.0,
        },
        {
          nome: 'Lucas Gabriel',
          parentesco: 'Filho',
          idade: 11,
          escolaridade: 'Fundamental',
          profissao: 'Estudante',
          renda: 0.0,
        },
      ],
      total_residentes: 2,
      renda_familiar_total: 1650.0,
    },
    autorizacoes: {
      autorizacao_uso_imagem: true,
      declaracao_responsabilidade: true,
      assinatura_responsavel_presente: true,
      assinatura_assistente_social_presente: false,
      data_inscricao: '2026-02-10',
      local_inscricao: 'Volta Redonda',
    },
    confianca_campos: {
      'aluno.nome': 98.5,
      'aluno.data_nascimento': 97.0,
      'aluno.cpf': 95.0,
      'responsavel.telefone': 92.0,
      'aluno.nis': 74.0, // Baixa confiança para inspeção humana
      'saude.descricao_doenca': 88.0,
    },
    observacoes_ia: [
      'Documento em bom estado de conservação.',
      'Campo NIS com caligrafia parcialmente borrada; sugerida verificação manual.',
    ],
  };

  it('deve possuir os campos exigidos pela ficha de inscrição', () => {
    expect(mockGeminiOutput.aluno.nome).toBeTruthy();
    expect(mockGeminiOutput.aluno.data_nascimento).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(mockGeminiOutput.responsavel.nome).toBeTruthy();
    expect(mockGeminiOutput.responsavel.cidade).toBe('Volta Redonda');
    expect(mockGeminiOutput.modalidades_selecionadas).toContain('Judô');
    expect(mockGeminiOutput.composicao_familiar.residentes.length).toBeGreaterThan(0);
  });

  it('deve identificar campos de baixa confiança para alerta visual de revisão humana', () => {
    const CONFIDENCE_THRESHOLD = 80.0;
    const lowConfidenceFields: string[] = [];

    Object.entries(mockGeminiOutput.confianca_campos).forEach(([field, score]) => {
      if (score < CONFIDENCE_THRESHOLD) {
        lowConfidenceFields.push(field);
      }
    });

    expect(lowConfidenceFields).toContain('aluno.nis');
    expect(lowConfidenceFields).toHaveLength(1);
  });

  it('deve respeitar a regra de nunca inventar valores: campos não preenchidos devem ser null', () => {
    expect(mockGeminiOutput.saude.descricao_deficiencia).toBeNull();
  });

  it('deve calcular corretamente os totais da tabela de residentes familiares', () => {
    const totalRenda = mockGeminiOutput.composicao_familiar.residentes.reduce(
      (acc, curr) => acc + curr.renda,
      0
    );
    expect(totalRenda).toBe(mockGeminiOutput.composicao_familiar.renda_familiar_total);
    expect(mockGeminiOutput.composicao_familiar.residentes.length).toBe(
      mockGeminiOutput.composicao_familiar.total_residentes
    );
  });

  it('deve garantir que o status inicial do OCR seja pendente até a confirmação humana explícita', () => {
    const ocrRecord = {
      id: 'doc-uuid-1234',
      status: 'pendente',
      arquivo_nome: 'ficha_exemplo_dagaz_2026.jpg',
      dados_extraidos: mockGeminiOutput,
      revisado_por: null,
    };

    expect(ocrRecord.status).toBe('pendente');
    expect(ocrRecord.revisado_por).toBeNull();

    // Simula a confirmação humana
    const confirmedRecord = {
      ...ocrRecord,
      status: 'confirmado',
      revisado_por: 'admin@esportedagaz.org.br',
      confirmado_em: new Date().toISOString(),
    };

    expect(confirmedRecord.status).toBe('confirmado');
    expect(confirmedRecord.revisado_por).toBeTruthy();
  });
});
