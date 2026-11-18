-- PROJETO ESPORTE DAGAZ - SISTEMA DE GESTÃO SOCIOESPORTIVA
-- MIGRATION 002: ROW LEVEL SECURITY (RLS) & DEFENSE-IN-DEPTH POLICIES

-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE digitized_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PARA SERVICE_ROLE (Acesso exclusivo do Backend para operações protegidas)
-- O backend opera como canal seguro autorizado via service_role, aplicando as regras de negócio
CREATE POLICY service_role_all_users ON users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_sports ON sports FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_classes ON classes FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_guardians ON guardians FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_students ON students FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_student_guardians ON student_guardians FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_health_records ON health_records FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_family_members ON family_members FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_enrollments ON enrollments FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_authorizations ON authorizations FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_digitized_documents ON digitized_documents FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY service_role_all_audit_logs ON audit_logs FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 2. POLÍTICAS PARA USUÁRIOS AUTENTICADOS (Supabase Auth / JWT Claims)
-- Usuários autenticados podem consultar modalidades e turmas ativas
CREATE POLICY auth_read_sports ON sports FOR SELECT TO authenticated USING (ativo = TRUE);
CREATE POLICY auth_read_classes ON classes FOR SELECT TO authenticated USING (ativo = TRUE);

-- Alunos e Matrículas: Leitura para equipe autorizada
CREATE POLICY auth_read_students ON students FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'role') IN ('admin', 'coordenador', 'atendente', 'consulta')
);

CREATE POLICY auth_write_students ON students FOR INSERT TO authenticated WITH CHECK (
    (auth.jwt() ->> 'role') IN ('admin', 'coordenador', 'atendente')
);

CREATE POLICY auth_update_students ON students FOR UPDATE TO authenticated USING (
    (auth.jwt() ->> 'role') IN ('admin', 'coordenador', 'atendente')
);

CREATE POLICY auth_delete_students ON students FOR DELETE TO authenticated USING (
    (auth.jwt() ->> 'role') = 'admin'
);

-- Prontuário de Saúde (Restrição Crítica - Apenas Admin, Coordenador e Atendente autorizado)
CREATE POLICY auth_read_health ON health_records FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'role') IN ('admin', 'coordenador', 'atendente')
);

CREATE POLICY auth_write_health ON health_records FOR ALL TO authenticated USING (
    (auth.jwt() ->> 'role') IN ('admin', 'coordenador')
);

-- Trilha de Auditoria (Imutável: Somente inserção automática, leitura apenas por Admin)
CREATE POLICY auth_insert_audit ON audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY auth_read_audit ON audit_logs FOR SELECT TO authenticated USING (
    (auth.jwt() ->> 'role') = 'admin'
);
