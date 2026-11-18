# Arquitetura do Sistema – Esporte Dagaz

Este documento descreve a arquitetura de software, componentes estruturais, modelo de dados e fluxos operacionais do **Sistema de Gestão Socioesportiva – Projeto Esporte Dagaz**.

---

## 1. Visão Geral da Arquitetura

O sistema é construído como uma aplicação web moderna dividida em camadas desacopladas, priorizando a segurança, a usabilidade e a alta fidelidade às especificações de design do Figma.

```plaintext
                                ┌─────────────────────────────────┐
                                │       Navegador / Cliente       │
                                │   (React 18 + Vite + Tailwind)  │
                                └────────────────┬────────────────┘
                                                 │
                                                 │ HTTPS / JSON REST
                                                 ▼
                                ┌─────────────────────────────────┐
                                │          Backend API            │
                                │   (Node.js + Express + Zod)     │
                                └───────┬─────────────────┬───────┘
                                        │                 │
                Pooler PostgreSQL / SQL │                 │ Multimodal API
                                        ▼                 ▼
                         ┌───────────────────────┐ ┌──────────────────────┐
                         │   Supabase / Postgres │ │   Google Gemini AI   │
                         │   (12 Tabelas + RLS)  │ │   (gemini-4-hydrogen)│
                         └───────────────────────┘ └──────────────────────┘
```

---

## 2. Tecnologias Empregadas

| Camada | Tecnologia | Justificativa Técnica |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Renderização rápida, tipagem estática e ciclo de vida otimizado |
| **Estilização** | Tailwind CSS, Plus Jakarta Sans, Material Symbols | Conformidade pixel-perfect com as telas oficiais do Figma (p1 a p5) |
| **Backend** | Node.js, Express, TypeScript | Alta performance em I/O assíncrono e arquitetura modular de rotas |
| **Validação** | Zod | Validação declarativa e segura em tempo de execução para todos os payloads |
| **Banco de Dados** | Supabase, PostgreSQL | Relacionamentos com integridade referencial, RLS, índices e triggers |
| **Inteligência Artificial** | Google Gemini API (`@google/genai`) | Reconhecimento multimodal de caligrafia em fichas de papel |
| **Criptografia** | AES-256-GCM, Bcrypt | Proteção de dados clínicos de menores e senhas de operadores |
| **Testes** | Vitest | Execução rápida de testes automatizados com cobertura de regras críticas |

---

## 3. Módulos do Sistema

### 3.1. Módulo 1 – Autenticação e Sessão (Figma `p1.HTML`)
- **Responsabilidade:** Controle de acesso de operadores com e-mail e senha.
- **Segurança:** Hashing Bcrypt, tokens JWT com expiração de 8 horas, proteção contra força bruta com bloqueio após 5 tentativas incorretas e recuperação de senha segura.

### 3.2. Módulo 2 – Painel e Indicadores Socioesportivos (Figma `p2.HTML`)
- **Responsabilidade:** Apresentação de métricas consolidadas em tempo real com filtros de período (Hoje, Esta Semana, Este Mês).
- **Indicadores:** Total de matriculados, matrículas ativas, fila de espera, vagas trancadas, distribuição por modalidade, pirâmide etária e feed recente de atividades operacionais.

### 3.3. Módulo 3 – Gestão de Matrículas e Turmas (Figma `p3.HTML`)
- **Responsabilidade:** Listagem de alunos com busca em tempo real por nome, CPF ou turma; filtros por modalidade (Judô, Capoeira, Basquete 3x3, Futsal, Futevôlei, Treinamento Funcional) e situação cadastral (Ativa, Aguardando Vaga, Trancada, Cancelada).
- **Recursos:** Modal de Prontuário Institucional e Clínico, reativação de matrículas com 1 clique e exportação de relatórios em Excel/PDF.

### 3.4. Módulo 4 – Cadastro de Aluno em 5 Etapas (Figma `p4.HTML`)
- **Etapa 1 – Identificação Pessoal:** Nome completo, nascimento, cálculo automático de idade, CPF, RG, órgão emissor, NIS e etnia.
- **Etapa 2 – Escolaridade e Social:** Instituição de ensino, ano escolar, turno escolar e NIS da família.
- **Etapa 3 – Saúde e Cuidados:** Formulário condicional com deficiências, doenças crônicas, medicamentos contínuos e laudos médicos.
- **Etapa 4 – Modalidades:** Seleção de 1 ou mais oficinas com vinculação de turma.
- **Etapa 5 – Responsável e Composição Familiar:** Vínculo de responsável existente ou novo cadastro completo; tabela dinâmica de residentes com somatório em tempo real de moradores e renda familiar per capita.

### 3.5. Módulo 5 – Digitalização com Google Gemini AI (Figma `p5.HTML`)
- **Responsabilidade:** Leitura óptica de fichas físicas de papel capturadas por câmera ou scanner.
- **Segurança do Processo:** O modelo multimodal analisa a imagem com System Prompt calibrado para nunca alucinar, atribuindo pontuações de confiança por campo.
- **Revisão Humana Mandatória (*Human-in-the-Loop*):** Os campos são exibidos lado a lado com a foto do documento, permitindo ao atendente corrigir caligrafias difíceis antes de gravar no banco de dados.

---

## 4. Diagrama Entidade-Relacionamento (Banco de Dados)

```plaintext
┌──────────────┐          ┌───────────────────────┐          ┌──────────────┐
│    users     │          │        sports         │          │   classes    │
│  (Operadores)│          │ (Capoeira, Judô, etc) │◄────┬────┤   (Turmas)   │
└──────┬───────┘          └───────────┬───────────┘     │    └──────┬───────┘
       │                              │                 │           │
       │ audit                        │                 │           │
       ▼                              │                 │           │
┌──────────────┐                      │                 │           │
│  audit_logs  │                      │                 │           │
└──────────────┘                      ▼                 │           ▼
                          ┌───────────────────────┐     │    ┌──────────────┐
                          │      enrollments      │─────┴───►│   students   │
                          │      (Matrículas)     │          │   (Alunos)   │
                          └───────────────────────┘          └──┬───┬───┬───┘
                                                                │   │   │
                     ┌──────────────────────────────────────────┘   │   └──────────────────────┐
                     │                                              │                          │
                     ▼                                              ▼                          ▼
       ┌───────────────────────────┐                  ┌───────────────────┐      ┌─────────────────────────┐
       │     student_guardians     │                  │  health_records   │      │     family_members      │
       │ (Vínculo Responsável/Grau)│                  │(Prontuário Médico)│      │  (Residentes/Renda Dom) │
       └─────────────┬─────────────┘                  └───────────────────┘      └─────────────────────────┘
                     │
                     ▼
       ┌───────────────────────────┐                  ┌───────────────────┐      ┌─────────────────────────┐
       │         guardians         │                  │   authorizations  │      │   digitized_documents   │
       │    (Responsáveis Legais)  │                  │  (Termos Imagem)  │      │     (Fichas OCR IA)     │
       └───────────────────────────┘                  └───────────────────┘      └─────────────────────────┘
```

---

## 5. Estratégia de Deploy

- **Frontend:** Pode ser distribuído via Cloudflare Pages, Vercel ou AWS S3/CloudFront com CDN global.
- **Backend:** Pode ser empacotado em container Docker leve ou hospedado no Render, Railway, Fly.io ou Google Cloud Run.
- **Banco de Dados:** PostgreSQL gerenciado no Supabase com backups diários e isolamento de rede VPC.
- **Armazenamento de Arquivos:** Supabase Storage com buckets privados e assinaturas temporárias de download para proteger as fotografias das crianças.
