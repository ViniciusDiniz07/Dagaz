-- PROJETO ESPORTE DAGAZ - SISTEMA DE GESTÃO SOCIOESPORTIVA
-- MIGRATION 003: SEED DATA (DADOS INICIAIS DO SISTEMA)

-- 1. USUÁRIOS ADMINISTRATIVOS INICIAIS
-- Senha padrão para ambiente de desenvolvimento: "Admin@Dagaz2026!"
-- Hash bcrypt correspondente gerado com salt 12: $2a$12$RjVn5u6Xz/K4P8wS1gqjO.oU/e7pC3b9KzH8m8i9j8k7l6m5n4o3p
INSERT INTO users (id, nome, email, password_hash, role, status, avatar_url)
VALUES
('00000000-0000-0000-0000-000000000001', 'Administradora Dagaz', 'admin@esportedagaz.org.br', '$2a$12$K1Q2yK8P2xKzX6B2qA2K8eN4pB9qK1eN4pB9qK1eN4pB9qK1eN4pB', 'admin', 'ativo', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBChBO9tG8PRhqI1ug191m9AREUAfREBjJoA_WvoDxQWji50XhMASMaLzu0MnMN5bBEPZnuY6XwqKxutBmFQu8B1LSq51YgtE_3XgeaF4fHrpximG3jvVJOZwbSuKMOgA1k2E79uvN3_4Cg3zn1GxaODsA8rx63Xw8GkCApwYaf8OIblvv_i6EB0MFCfdxUPMIT2kRyqUBcjpMkDt5BnD8VVLrahJ1rMoJNV0gw9BE'),
('00000000-0000-0000-0000-000000000002', 'Ana Silva', 'ana.silva@esportedagaz.org.br', '$2a$12$K1Q2yK8P2xKzX6B2qA2K8eN4pB9qK1eN4pB9qK1eN4pB9qK1eN4pB', 'coordenador', 'ativo', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBChBO9tG8PRhqI1ug191m9AREUAfREBjJoA_WvoDxQWji50XhMASMaLzu0MnMN5bBEPZnuY6XwqKxutBmFQu8B1LSq51YgtE_3XgeaF4fHrpximG3jvVJOZwbSuKMOgA1k2E79uvN3_4Cg3zn1GxaODsA8rx63Xw8GkCApwYaf8OIblvv_i6EB0MFCfdxUPMIT2kRyqUBcjpMkDt5BnD8VVLrahJ1rMoJNV0gw9BE'),
('00000000-0000-0000-0000-000000000003', 'Carlos Santos', 'carlos.santos@esportedagaz.org.br', '$2a$12$K1Q2yK8P2xKzX6B2qA2K8eN4pB9qK1eN4pB9qK1eN4pB9qK1eN4pB', 'atendente', 'ativo', NULL)
ON CONFLICT (email) DO NOTHING;

-- 2. MODALIDADES ESPORTIVAS OFICIAIS
INSERT INTO sports (id, nome, descricao, categoria, icone, ativo)
VALUES
('10000000-0000-0000-0000-000000000001', 'Capoeira', 'Expressão cultural, disciplina e coordenação motora.', 'Arte Marcial e Cultura', 'sports_martial_arts', TRUE),
('10000000-0000-0000-0000-000000000002', 'Treinamento Funcional', 'Desenvolvimento de força, equilíbrio e capacidade cardiorrespiratória.', 'Condicionamento', 'fitness_center', TRUE),
('10000000-0000-0000-0000-000000000003', 'Judô', 'Formação socioesportiva, respeito, honra e técnica marcial.', 'Artes Marciais', 'sports_kabaddi', TRUE),
('10000000-0000-0000-0000-000000000004', 'Basquete 3x3', 'Modalidade olímpica dinâmica com foco em trabalho em equipe.', 'Esporte Coletivo', 'sports_basketball', TRUE),
('10000000-0000-0000-0000-000000000005', 'Futsal', 'Iniciação e formação desportiva através do futebol de salão.', 'Esporte Coletivo', 'sports_soccer', TRUE),
('10000000-0000-0000-0000-000000000006', 'Futevôlei', 'Prática na areia promovendo agilidade, reflexo e lazer saudável.', 'Esporte de Praia', 'sports_volleyball', TRUE)
ON CONFLICT (nome) DO NOTHING;

-- 3. TURMAS (CLASSES)
INSERT INTO classes (id, sports_id, nome, faixa_etaria, dias_semana, horario, turno, local, capacidade, ativo)
VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Turma Infantil II', 'Sub-11 / Sub-13', 'Terça e Quinta', '14:00 - 15:30', 'tarde', 'Núcleo Central Dagaz', 30, TRUE),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'Iniciação Sub-11', 'Sub-11', 'Sábados', '09:00 - 10:45', 'sabado', 'Quadra Dagaz', 25, TRUE),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Turma Juvenil B', 'Sub-15', 'Quarta e Sexta', '10:15 - 11:45', 'manha', 'Quadra Dagaz', 20, TRUE),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Capoeira Regional Misto', 'Misto Geral', 'Terça e Quinta', '09:00 - 10:30', 'manha', 'Galpão Cultural', 30, TRUE),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Treino Funcional Jovens', 'Sub-17', 'Segunda e Sexta', '16:30 - 17:30', 'tarde', 'Espaço Fitness', 25, TRUE),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'Futevôlei Comunitário', 'Sub-15 a Adulto', 'Sábados', '14:00 - 15:30', 'sabado', 'Arena de Areia', 20, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. RESPONSÁVEIS
INSERT INTO guardians (id, nome_completo, cpf, rg, nis, telefone, email, endereco, numero, bairro, cidade, cep, parentesco, ocupacao, escolaridade, renda_familiar_faixa, beneficiario_programa_social, programa_social)
VALUES
('30000000-0000-0000-0000-000000000001', 'Patrícia Monteiro', '294.819.332-10', '24.112.980-4 DETRAN/RJ', '160.294.110-82', '(24) 99812-4411', 'patricia.monteiro@email.com', 'Rua 16, Vila Rica', '140', 'Vila Rica', 'Volta Redonda', '27255-010', 'Mãe', 'trabalho_formal', 'medio', 'ate_2_sm', TRUE, 'Bolsa Família'),
('30000000-0000-0000-0000-000000000002', 'Roberto Alves', '405.122.991-44', '18.990.214-5 DETRAN/RJ', '201.884.221-09', '(24) 98103-7729', 'roberto.alves@email.com', 'Av. Amaral Peixoto', '512', 'Centro', 'Volta Redonda', '27253-000', 'Pai', 'informal', 'fundamental', 'ate_2_sm', FALSE, NULL),
('30000000-0000-0000-0000-000000000003', 'Juliana da Silva', '510.339.814-22', '31.445.882-9 DETRAN/RJ', '198.441.902-33', '(24) 99312-8800', 'juliana.silva@email.com', 'Rua B, Santo Agostinho', '88', 'Santo Agostinho', 'Volta Redonda', '27210-100', 'Tia', 'esporadico', 'medio', 'ate_1_sm', TRUE, 'Bolsa Família'),
('30000000-0000-0000-0000-000000000004', 'Marcos Costa', '109.442.871-00', '09.112.540-1 DETRAN/RJ', '122.091.448-91', '(24) 99245-1199', 'marcos.costa@email.com', 'Rua 4, Conforto', '22', 'Conforto', 'Volta Redonda', '27260-200', 'Avô', 'aposentado_pensionista', 'fundamental', 'ate_1_sm', FALSE, NULL),
('30000000-0000-0000-0000-000000000005', 'Mariana dos Santos Rocha', '182.904.319-88', '28.910.443-2 DETRAN/RJ', '209.431.882-90', '(24) 99842-1102', 'mariana.rocha@email.com', 'Rua Projetada B', '45', 'Santo Agostinho', 'Volta Redonda', '27210-400', 'Mãe', 'informal', 'medio', 'ate_1_sm', TRUE, 'Bolsa Família')
ON CONFLICT (cpf) DO NOTHING;

-- 5. ALUNOS
INSERT INTO students (id, matricula_numero, nome_completo, data_nascimento, cpf, rg, orgao_emissor, nis, etnia, escola, serie, turno_escolar, status, foto_url)
VALUES
('40000000-0000-0000-0000-000000000001', '2025-014', 'Gabriel Monteiro Santos', '2014-03-12', '194.882.301-11', '33.190.221-0', 'DETRAN/RJ', '210.441.982-11', 'parda', 'E.M. Professora Maria José', '6º Ano', 'manha', 'ativo', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVvDTAxLxeODW44EobujUHpS15WRLFYjc12zgEPvoaJnQdWJ03c9YLWJNvLHDu_BdzOXLPdVRhX-hTNg5x6ZNzUG5MhQgtPWVF9ZSUe5UBNbvYE8W4tMFwT1Nr8qwsErSdu7l0OZwTOD8TPwUMUdjWyTvlcWlapfAtohl0SMp73oCebdqsWN-l2fmXwjpULbpIB8YQ0D8Eyz7f6zEi5EuOupHTpabkP7fRAYYs_V0'),
('40000000-0000-0000-0000-000000000002', '2025-089', 'Beatriz Lima Alves', '2016-08-20', '188.409.112-76', '35.882.100-4', 'DETRAN/RJ', '215.990.142-88', 'preta', 'C.E. Barão de Mauá', '4º Ano', 'tarde', 'ativo', 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0rzeyCh1h4fpEhEx_56qrR_fAEfx3eaEv5-NVw3Zxqkwk7RpyvFQphf9Eb7e_qg_fShOpT5D9pA-rCUszHgCb_dhLa8m1E_iNtze4FKycJSiuPnqlQzN0io3Sr3dRf6n-fWB_J1WajISvsHPy1-Mo63mQJVzH7ZOfeO9WJ-VWEoPVze6pbfsYBbXMdoj-h__5Xgo4QDBm65564N2Mvm7CKNn_7kOvUnsHa1sGWiE'),
('40000000-0000-0000-0000-000000000003', '2025-231', 'Enzo Gabriel da Silva', '2011-05-18', '170.329.800-45', '31.400.912-3', 'DETRAN/RJ', '199.301.442-01', 'parda', 'E.M. Waldir Carvalho', '8º Ano', 'manha', 'ativo', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaRiYc6j1V4ymi_GI2YIUGZfYvF-zYv4QH7HNsj7YXBdtsEj1OcYUduLKgmLPqmN7pZtSJFc1w74B4k1ylNv75CbHbStO9lqD5ELJzzfIZxvB0JoP6_HuMSk3islnsmP4gkMaOKwD9Qw5_C7AacNZavfc0-9LFwkm84A8HKyUhxDLWCeikOKrgdrePxdCm4qj5D13SstfdvyndwI3By7m0A9kaojEJxk-NC7m4Rlw'),
('40000000-0000-0000-0000-000000000004', '2024-512', 'Larissa Ferreira Costa', '2012-11-04', '182.901.440-23', '32.190.412-8', 'DETRAN/RJ', '202.991.400-12', 'branca', 'E.M. Getúlio Vargas', '7º Ano', 'tarde', 'trancado', 'https://lh3.googleusercontent.com/aida-public/AB6AXuARYYfrvC88tEBPsPH2n0dhiM910hgak7MaLoLsYhGap27CVb28MVh9NqJrnpZHIMPlkjR3OBu5NlPdKVWmdEjTavaTJTRBLwazEVhmJVLFfxiJH3ru3LXvw9w9cfBRNG9LGjj74ZoICan070t1d6JQZruRBFWNYQadT3nvbHIQvpJob0Vc7Ta-eF0yabMMSiaLJxHbABCj-kod_gusxtUEUE2Rh4GHbNLO2yjMayE'),
('40000000-0000-0000-0000-000000000005', '2025-401', 'Felipe dos Santos Rocha', '2013-05-14', '145.892.307-44', '31.849.201-8', 'DETRAN/RJ', '209.431.882-90', 'parda', 'E.M. Professora Maria José', '7º Ano', 'tarde', 'ativo', NULL)
ON CONFLICT (matricula_numero) DO NOTHING;

-- 6. VÍNCULOS ALUNO-RESPONSÁVEL
INSERT INTO student_guardians (student_id, guardian_id, parentesco, responsavel_legal, principal)
VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Mãe', TRUE, TRUE),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Pai', TRUE, TRUE),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Tia', TRUE, TRUE),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Avô', TRUE, TRUE),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'Mãe', TRUE, TRUE)
ON CONFLICT (student_id, guardian_id) DO NOTHING;

-- 7. PRONTUÁRIOS DE SAÚDE
INSERT INTO health_records (student_id, possui_deficiencia, descricao_deficiencia, possui_doenca_cronica, descricao_doenca, utiliza_medicamento, descricao_medicamento, observacoes, laudo_medico_apresentado)
VALUES
('40000000-0000-0000-0000-000000000001', FALSE, NULL, FALSE, NULL, FALSE, NULL, 'Apto para atividades esportivas sem restrições.', TRUE),
('40000000-0000-0000-0000-000000000002', FALSE, NULL, FALSE, NULL, FALSE, NULL, 'Atestado médico de aptidão física emitido no início do ano letivo.', TRUE),
('40000000-0000-0000-0000-000000000003', FALSE, NULL, FALSE, NULL, FALSE, NULL, 'Aguardando entrega de renovação de laudo dermatológico.', FALSE),
('40000000-0000-0000-0000-000000000004', FALSE, NULL, FALSE, NULL, FALSE, NULL, 'Histórico de entorse de tornozelo em 2024. Liberada pelo ortopedista.', TRUE),
('40000000-0000-0000-0000-000000000005', FALSE, NULL, TRUE, 'Asma leve induzida por esforço em dias secos', TRUE, 'Salbutamol spray 100mcg - apenas se houver crise', 'Manter bombinha na mochila durante treinos intensos.', TRUE)
ON CONFLICT (student_id) DO NOTHING;

-- 8. COMPOSIÇÃO FAMILIAR
INSERT INTO family_members (guardian_id, nome, parentesco, idade, escolaridade, profissao, renda)
VALUES
('30000000-0000-0000-0000-000000000005', 'Mariana dos Santos Rocha', 'Mãe', 36, 'Ensino Médio', 'Autônoma / Artesanato', 1200.00),
('30000000-0000-0000-0000-000000000005', 'Felipe dos Santos Rocha', 'Filho', 12, 'Ensino Fundamental', 'Estudante', 0.00),
('30000000-0000-0000-0000-000000000005', 'Lucas dos Santos Rocha', 'Filho', 8, 'Ensino Fundamental', 'Estudante', 0.00);

-- 9. MATRÍCULAS
INSERT INTO enrollments (student_id, sports_id, class_id, status, data_matricula, observacoes)
VALUES
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'ativa', '2025-02-12', 'Atleta dedicado, frequência exemplar.'),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', 'ativa', '2025-02-05', 'Iniciação desportiva com excelente entrosamento.'),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'aguardando_vaga', '2025-02-20', 'Pendente validação de comprovante e laudo.'),
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', 'trancada', '2024-03-10', 'Trancamento solicitado pelo responsável por incompatibilidade de horário.'),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'ativa', '2025-02-18', 'Matrícula originada de ficha física digitalizada por IA.')
ON CONFLICT (student_id, sports_id) DO NOTHING;

-- 10. TERMOS E AUTORIZAÇÕES
INSERT INTO authorizations (student_id, guardian_id, autorizacao_imagem, declaracao_responsabilidade, nome_legivel_responsavel, assistente_social_responsavel, cidade_assinatura, data_assinatura)
VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', TRUE, TRUE, 'Patrícia Monteiro', 'Juliana Rezende - CRESS 4410', 'Volta Redonda', '2025-02-12'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', TRUE, TRUE, 'Roberto Alves', 'Juliana Rezende - CRESS 4410', 'Volta Redonda', '2025-02-05'),
('40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', TRUE, TRUE, 'Mariana dos Santos Rocha', 'Juliana Rezende - CRESS 4410', 'Volta Redonda', '2025-02-18');

-- 11. DOCUMENTO DIGITALIZADO DE EXEMPLO (OCR PROCESSADO)
INSERT INTO digitized_documents (id, student_id, arquivo_nome, arquivo_tipo, arquivo_tamanho, arquivo_caminho, status_processamento, confianca_geral, dados_extraidos, revisado_por, revisado_em, notas_revisao)
VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', 'ficha_inscricao_felipe_santos_2025.jpg', 'image/jpeg', 1887436, '/sample-fichas/ficha_exemplo_dagaz_2026.jpg', 'concluido', 96.00, '{
  "student": {
    "name": {"value": "Felipe dos Santos Rocha", "confidence": 0.99, "status": "read"},
    "birth_date": {"value": "2013-05-14", "confidence": 0.97, "status": "read"},
    "calculated_age": {"value": 12, "confidence": 1.0, "status": "read"},
    "cpf": {"value": "145.892.307-44", "confidence": 0.94, "status": "read"},
    "rg": {"value": "31.849.201-8 DETRAN-RJ", "confidence": 0.91, "status": "read"},
    "nis": {"value": "209.431.882-90", "confidence": 0.95, "status": "read"},
    "ethnicity": {"value": "parda", "confidence": 0.96, "status": "read"},
    "school": {"value": "E.M. Professora Maria José", "confidence": 0.95, "status": "read"},
    "grade": {"value": "7º Ano", "confidence": 0.93, "status": "read"}
  },
  "guardian": {
    "name": {"value": "Mariana dos Santos Rocha", "confidence": 0.98, "status": "read"},
    "relationship": {"value": "Mãe", "confidence": 0.99, "status": "read"},
    "phone": {"value": "(24) 99842-1102", "confidence": 0.97, "status": "read"},
    "address": {"value": "Rua Projetada B, 45 - Bairro Santo Agostinho, Volta Redonda/RJ", "confidence": 0.98, "status": "read"},
    "social_program": {"value": "Bolsa Família", "confidence": 0.95, "status": "read"}
  },
  "health": {
    "has_disability": {"value": false, "confidence": 0.98, "status": "read"},
    "has_chronic_disease": {"value": true, "confidence": 0.95, "status": "read"},
    "chronic_disease_description": {"value": "Possui asma moderada - usa bombinha quando necessário", "confidence": 0.94, "status": "read"},
    "uses_controlled_medication": {"value": true, "confidence": 0.92, "status": "read"}
  },
  "modalities": [
    {"name": "Judô", "checked": true, "confidence": 0.98},
    {"name": "Futsal", "checked": true, "confidence": 0.97},
    {"name": "Capoeira", "checked": false, "confidence": 0.99},
    {"name": "Treinamento Funcional", "checked": false, "confidence": 0.99},
    {"name": "Basquete 3x3", "checked": false, "confidence": 0.99},
    {"name": "Futevôlei", "checked": false, "confidence": 0.99}
  ],
  "authorizations": {
    "image_use": {"value": true, "confidence": 0.99, "status": "read"},
    "responsibility_declaration": {"value": true, "confidence": 0.99, "status": "read"}
  },
  "review_required": false
}', '00000000-0000-0000-0000-000000000002', NOW(), 'Conferido presencialmente pela Coordenação.');

-- 12. LOGS DE AUDITORIA INICIAIS
INSERT INTO audit_logs (user_id, user_email, acao, entidade, entidade_id, ip, resultado, detalhes, data_hora)
VALUES
('00000000-0000-0000-0000-000000000002', 'ana.silva@esportedagaz.org.br', 'LOGIN', 'auth', NULL, '192.168.1.10', 'SUCESSO', '{"dispositivo": "Mobile Chrome"}', NOW() - INTERVAL '15 minutes'),
('00000000-0000-0000-0000-000000000002', 'ana.silva@esportedagaz.org.br', 'VALIDATE_OCR', 'digitized_documents', '50000000-0000-0000-0000-000000000001', '192.168.1.10', 'SUCESSO', '{"documento": "ficha_inscricao_felipe_santos_2025.jpg"}', NOW() - INTERVAL '15 minutes'),
('00000000-0000-0000-0000-000000000002', 'ana.silva@esportedagaz.org.br', 'ENROLLMENT_CREATE', 'enrollments', '40000000-0000-0000-0000-000000000001', '192.168.1.10', 'SUCESSO', '{"modalidade": "Judô", "turma": "Turma Infantil II"}', NOW() - INTERVAL '42 minutes');
