-- PROJETO ESPORTE DAGAZ - SISTEMA DE GESTÃO SOCIOESPORTIVA
-- MIGRATION 001: INITIAL SCHEMA
-- Criação das tabelas centrais, constraints, índices e triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS (Equipe administrativa e técnica)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coordenador', 'atendente', 'consulta')),
    status VARCHAR(20) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'bloqueado')),
    avatar_url TEXT,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SPORTS (Modalidades esportivas oferecidas pelo projeto)
CREATE TABLE IF NOT EXISTS sports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) DEFAULT 'Socioesportivo',
    icone VARCHAR(50) DEFAULT 'sports',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLASSES (Turmas, horários e capacidade por núcleo)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sports_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    faixa_etaria VARCHAR(50),
    dias_semana VARCHAR(100) NOT NULL,
    horario VARCHAR(50) NOT NULL,
    turno VARCHAR(20) CHECK (turno IN ('manha', 'tarde', 'noite', 'integral', 'sabado')),
    local VARCHAR(100) DEFAULT 'Núcleo Central Dagaz',
    capacidade INT NOT NULL DEFAULT 25,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GUARDIANS (Responsáveis legais pelos alunos)
CREATE TABLE IF NOT EXISTS guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    rg VARCHAR(50),
    nis VARCHAR(50),
    telefone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    endereco VARCHAR(255),
    numero VARCHAR(30),
    bairro VARCHAR(100),
    cidade VARCHAR(100) DEFAULT 'Volta Redonda',
    cep VARCHAR(10),
    parentesco VARCHAR(50),
    ocupacao VARCHAR(50) CHECK (ocupacao IN ('trabalho_formal', 'informal', 'esporadico', 'desempregado', 'aposentado_pensionista', 'outro')),
    escolaridade VARCHAR(50) CHECK (escolaridade IN ('nenhuma', 'fundamental', 'medio', 'superior_incompleto', 'superior_completo', 'pos_graduacao')),
    renda_familiar_faixa VARCHAR(50) CHECK (renda_familiar_faixa IN ('ate_1_sm', 'ate_2_sm', 'ate_3_sm', 'ate_4_sm', 'acima_4_sm')),
    beneficiario_programa_social BOOLEAN DEFAULT FALSE,
    programa_social VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STUDENTS (Alunos atendidos pelo projeto)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matricula_numero VARCHAR(50) UNIQUE NOT NULL,
    nome_completo VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(50),
    orgao_emissor VARCHAR(50),
    nis VARCHAR(50),
    etnia VARCHAR(50) CHECK (etnia IN ('branca', 'preta', 'parda', 'amarela', 'indigena', 'nao_declarado')),
    escola VARCHAR(255),
    serie VARCHAR(50),
    turno_escolar VARCHAR(20) CHECK (turno_escolar IN ('manha', 'tarde', 'integral', 'noite')),
    status VARCHAR(30) NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'aguardando_vaga', 'trancado', 'cancelado')),
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDENT_GUARDIANS (Relação N:N de vínculos e autoridade legal)
CREATE TABLE IF NOT EXISTS student_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE RESTRICT,
    parentesco VARCHAR(50) NOT NULL,
    responsavel_legal BOOLEAN NOT NULL DEFAULT TRUE,
    principal BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_guardian UNIQUE (student_id, guardian_id)
);

-- 7. HEALTH_RECORDS (Dados clínicos sensíveis com proteção reforçada)
CREATE TABLE IF NOT EXISTS health_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    possui_deficiencia BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_deficiencia TEXT,
    possui_doenca_cronica BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_doenca TEXT,
    utiliza_medicamento BOOLEAN NOT NULL DEFAULT FALSE,
    descricao_medicamento TEXT,
    observacoes TEXT,
    laudo_medico_apresentado BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FAMILY_MEMBERS (Residentes no domicílio da composição familiar)
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    parentesco VARCHAR(50) NOT NULL,
    idade INT,
    escolaridade VARCHAR(50),
    profissao VARCHAR(100),
    renda NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ENROLLMENTS (Matrículas em modalidades esportivas)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    sports_id UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'aguardando_vaga', 'trancada', 'cancelada')),
    data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
    data_cancelamento DATE NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_student_sport UNIQUE (student_id, sports_id)
);

-- 10. AUTHORIZATIONS (Termos de imagem, declarações da ficha de inscrição)
CREATE TABLE IF NOT EXISTS authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE RESTRICT,
    autorizacao_imagem BOOLEAN NOT NULL DEFAULT TRUE,
    declaracao_responsabilidade BOOLEAN NOT NULL DEFAULT TRUE,
    nome_legivel_responsavel VARCHAR(255),
    assistente_social_responsavel VARCHAR(255),
    cidade_assinatura VARCHAR(100) DEFAULT 'Volta Redonda',
    data_assinatura DATE DEFAULT CURRENT_DATE,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DIGITIZED_DOCUMENTS (Fichas digitalizadas e histórico do Gemini OCR)
CREATE TABLE IF NOT EXISTS digitized_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE SET NULL,
    arquivo_nome VARCHAR(255) NOT NULL,
    arquivo_tipo VARCHAR(50) NOT NULL,
    arquivo_tamanho INT NOT NULL,
    arquivo_caminho TEXT NOT NULL,
    status_processamento VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status_processamento IN ('pendente', 'processando', 'concluido', 'revisado', 'erro', 'descartado')),
    confianca_geral NUMERIC(5,2),
    dados_extraidos JSONB NOT NULL,
    revisado_por UUID REFERENCES users(id),
    revisado_em TIMESTAMPTZ,
    notas_revisao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT_LOGS (Trilha de auditoria e conformidade LGPD)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    acao VARCHAR(100) NOT NULL,
    entidade VARCHAR(100) NOT NULL,
    entidade_id UUID NULL,
    ip VARCHAR(50),
    user_agent TEXT,
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('SUCESSO', 'FALHA', 'NEGADO')),
    detalhes JSONB NULL,
    data_hora TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES ESSENCIAIS PARA PERFORMANCE E BUSCA FREQUENTE
CREATE INDEX IF NOT EXISTS idx_students_nome ON students(nome_completo);
CREATE INDEX IF NOT EXISTS idx_students_cpf ON students(cpf);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_matricula ON students(matricula_numero);
CREATE INDEX IF NOT EXISTS idx_guardians_cpf ON guardians(cpf);
CREATE INDEX IF NOT EXISTS idx_guardians_nome ON guardians(nome_completo);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_sport ON enrollments(sports_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_audit_data_hora ON audit_logs(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_digitized_status ON digitized_documents(status_processamento);
