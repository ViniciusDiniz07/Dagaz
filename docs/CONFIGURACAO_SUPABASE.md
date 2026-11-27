# Guia de Configuração do Supabase & PostgreSQL – Condomínio Cultura e Esportivo

Este documento orienta a equipe de infraestrutura e banco de dados na configuração do **Supabase** para o Sistema de Gestão Socioesportiva – Condomínio Cultura e Esportivo.

---

## 1. Criação do Projeto no Supabase

1. Acesse o painel oficial em [supabase.com](https://supabase.com/) e faça login.
2. Clique em **"New Project"**.
3. Preencha as informações:
   - **Name**: `condominio-cultura-esportivo-prod` (ou `condominio-cultura-esportivo-dev`)
   - **Database Password**: Gere uma senha forte e armazene em cofre seguro.
   - **Region**: Selecione `São Paulo (sa-east-1)` para garantir a menor latência no Brasil.
   - **Pricing Plan**: Free ou Pro conforme a demanda institucional.
4. Aguarde a inicialização da instância PostgreSQL (geralmente cerca de 1 a 2 minutos).

---

## 2. Execução das Migrações SQL Versionadas

O repositório inclui migrações declarativas em `supabase/migrations/`. A execução deve seguir rigorosamente a ordem cronológica numérica:

### Opção A: Pelo Dashboard Web do Supabase (SQL Editor)
No painel do Supabase, acesse **SQL Editor** no menu lateral esquerdo e execute cada arquivo sequencialmente:

1. **Migração 1 – Estrutura Relacional Inicial:**
   - Abra o arquivo `supabase/migrations/20260218000001_initial_schema.sql`.
   - Copie todo o conteúdo, cole no SQL Editor e clique em **Run**.
   - Cria as 12 tabelas:
     - `users`: Usuários e operadores com controle de tentativas de login.
     - `sports`: Modalidades esportivas (Judô, Capoeira, etc.).
     - `classes`: Turmas e horários.
     - `guardians`: Responsáveis legais, escolaridade, NIS e renda.
     - `students`: Ficha cadastral dos alunos e código de matrícula.
     - `student_guardians`: Relacionamento n:n entre alunos e responsáveis.
     - `health_records`: Prontuário clínico, laudos, medicamentos e deficiências.
     - `family_members`: Residentes no domicílio e renda familiar calculada.
     - `enrollments`: Matrículas por modalidade e controle de status.
     - `authorizations`: Termos de uso de imagem e responsabilidade.
     - `digitized_documents`: Fichas físicas digitalizadas e metadados de OCR.
     - `audit_logs`: Trilha de auditoria e governança LGPD.

2. **Migração 2 – Políticas de Segurança e RLS (Row Level Security):**
   - Abra o arquivo `supabase/migrations/20260218000002_security_rls.sql`.
   - Copie o conteúdo, cole no SQL Editor e clique em **Run**.
   - Habilita RLS em todas as tabelas e estabelece políticas restritas por papel funcional.

3. **Migração 3 – Sementes e Dados Oficiais Iniciais:**
   - Abra o arquivo `supabase/migrations/20260218000003_seed_data.sql`.
   - Copie o conteúdo, cole no SQL Editor e clique em **Run**.
   - Insere dados iniciais de demonstração para modalidades, turmas, operadores e alunos. Não execute novamente após limpar os dados do projeto.

---

## 3. Configuração do Storage (Armazenamento de Fichas e Fotos)

No menu **Storage** do Supabase, crie dois buckets privados:

1. **`documentos-fichas`**:
   - Tipo: **Private** (Acesso somente via Backend com permissão).
   - Tipos de arquivo permitidos: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
   - Tamanho máximo por arquivo: `15 MB`.

2. **`fotos-alunos`**:
   - Tipo: **Private** (ou público com URLs assinadas).
   - Tipos de arquivo permitidos: `image/jpeg`, `image/png`, `image/webp`.
   - Tamanho máximo por arquivo: `5 MB`.

### Política de RLS para o Storage
Execute no SQL Editor para permitir que o backend (utilizando a chave Service Role) manipule arquivos nos buckets:

```sql
-- Políticas para o bucket de documentos digitalizados
CREATE POLICY "Acesso restrito a documentos pelo backend" 
ON storage.objects 
FOR ALL 
TO service_role 
USING (bucket_id = 'documentos-fichas');
```

---

## 4. Obtenção das Credenciais de Conexão

No painel do projeto Supabase, acesse **Project Settings**:

### 4.1. Configurações de API (`API Settings`)
- **Project URL**: Copie o valor (ex: `https://xyzcompany.supabase.co`) para a variável `SUPABASE_URL`.
- **Project API Keys**:
  - Localize a chave **`service_role`** (Secret).
  - Copie para a variável `SUPABASE_SERVICE_ROLE_KEY` no `server/.env`.
  - ⚠️ **ATENÇÃO CRÍTICA:** A chave `service_role` **NUNCA** deve ser exposta no frontend (`client/`), nem versionada em repositórios públicos. Ela ignora o RLS e possui acesso administrativo irrestrito.

### 4.2. String de Conexão PostgreSQL (`SUPABASE_DB_URL`)

No painel atualizado, a string fica no botão **Connect**, no topo da página do projeto — não procure uma tela chamada “Database Settings”:

1. Abra o projeto no [Dashboard do Supabase](https://supabase.com/dashboard).
2. Clique em **Connect** no topo.
3. Na janela **Connect to your project**, selecione **Direct Connection string** (terceiro cartão). Não escolha **Framework** ou **Server**, que mostram instruções para clientes/API.
4. Na tela seguinte, selecione o formato **URI** e o método de conexão. Para o backend em uma hospedagem com IPv4, use **Session pooler**. Se a hospedagem suportar IPv6, também pode usar **Direct connection**. Evite **Transaction pooler** para este servidor Node.js persistente.
5. Copie a string. Substitua o marcador da senha pela senha do banco definida na criação do projeto. Use a string fornecida pelo painel; não monte manualmente o endereço do pooler.
6. Configure a URI completa em `SUPABASE_DB_URL` no `server/.env`:
```ini
SUPABASE_DB_URL=postgresql://...
```

Se esqueceu a senha do banco, redefina-a nas configurações de banco do projeto. Caracteres especiais na senha podem precisar ser codificados na URI; o painel ou a documentação do Supabase explica como.

**Importante:** `SUPABASE_DB_URL` é a conexão usada pelo backend. As migrações SQL são executadas separadamente: no menu **SQL Editor**, crie uma query e copie/execute, em ordem, cada arquivo de `supabase/migrations/` (`20260218000001_initial_schema.sql`, depois `20260218000002_security_rls.sql` e por último `20260218000003_seed_data.sql`). Esses arquivos ficam na pasta do projeto no seu computador, não dentro do painel Supabase.

---

## 5. Verificação de Funcionamento

Após configurar as variáveis no `server/.env`, inicie o servidor:

```bash
cd server
pnpm run dev
```

Você deverá ver no console de inicialização:
```plaintext
[INFO] Conectado com sucesso ao banco PostgreSQL/Supabase.
[INFO] API do Condomínio Cultura e Esportivo rodando na porta 3001 em modo development
```

Caso ocorra qualquer erro de conexão com a rede externa, o sistema alertará e ativará o **Modo Local Resiliente**, assegurando que os operadores nunca fiquem sem atendimento.
