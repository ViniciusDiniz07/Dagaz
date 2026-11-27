# Diretrizes de Segurança, LGPD e Proteção de Dados de Menores

Este documento detalha as medidas de segurança cibernética, privacidade e conformidade com a **Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018)** aplicadas na arquitetura do **Sistema de Gestão Socioesportiva – Condomínio Cultural e Esportivo**.

---

## 1. Tratamento de Dados de Crianças e Adolescentes (Artigo 14 da LGPD)

O sistema lida com dados cadastrais, familiares e de saúde de crianças e adolescentes beneficiados pelo projeto social. Em estrita observância ao **Art. 14 da LGPD**:

1. **Melhor Interesse do Menor:** Todas as coletas de dados têm como única finalidade a segurança física, pedagógica e socioesportiva do aluno no âmbito das atividades do Condomínio Cultural e Esportivo.
2. **Consentimento Específico e em Destaque:** O cadastro exige obrigatoriamente a identificação formal do responsável legal (mãe, pai ou tutor legal), incluindo declaração expressa de veracidade e autorização de uso de imagem.
3. **Minimização da Coleta:** Coletam-se apenas os dados estritamente necessários para atendimento a emergências de saúde, formação de turmas adequadas à faixa etária e comprovação de indicadores sociais para convênios públicos (ex: CSN, Governo do Estado do Rio de Janeiro).

---

## 2. Proteção de Dados Pessoais Sensíveis (Saúde e Cuidados Especiais)

Informações sobre deficiências, condições crônicas de saúde e uso de medicamentos controlados são classificadas como **dados sensíveis** (Art. 5º, II da LGPD):

- **Criptografia em Repouso (AES-256-GCM):**
  - O sistema implementa o algoritmo de cifragem autenticada `AES-256-GCM` (`server/src/config/crypto.ts`) para campos clínicos textuais, tais como prescrições de remédios, laudos médicos e orientações de primeiros socorros.
  - Cada registro cifrado contém um vetor de inicialização (`IV`) de 96 bits e uma tag de autenticação de 128 bits, prevenindo qualquer ataque de adulteração física do banco de dados.
- **Acesso Restrito Baseado em Função (RBAC):**
  - Operadores de nível `consulta` não possuem visibilidade de laudos médicos confidenciais.
  - Apenas `coordenadores` e `administradores` autorizados podem visualizar prontuários de saúde completos.
- **Mascaramento e Pseudonimização:**
  - Telas de listagem, logs e relatórios resumidos exibem CPF mascarado (`***.456.789-**`) e telefones mascarados (`(24) *****-4321`), evitando vazamento acidental em telas ou impressões.

---

## 3. Arquitetura de Defesa em Profundidade

O sistema não confia em uma única barreira de proteção. Quatro camadas independentes atuam em conjunto:

```plaintext
[ Navegador do Usuário ]
          │ (HTTPS / TLS 1.3)
          ▼
┌────────────────────────────────────────────────────────┐
│  Camada 1: Headers de Segurança, CORS & Rate Limiting  │
│  - Helmet (CSP, HSTS, X-Content-Type-Options)          │
│  - CORS com Whitelist Restrita                         │
│  - Rate Limiting contra Brute-Force e Abuso de OCR     │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Camada 2: Autenticação JWT & Matriz de Perfis (RBAC)  │
│  - Tokens JWT assinados com HS256 e expiração de 8h    │
│  - Senhas criptografadas com Bcrypt (fator 10)         │
│  - Bloqueio temporário após 5 tentativas incorretas    │
│  - Controle de perfis: Admin, Coordenador, Atendente   │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Camada 3: Validação de Entrada & Prevenção IDOR       │
│  - Validação de Schema rigorosa com Zod em todas rotas │
│  - Sanitização de inputs contra XSS e SQL Injection    │
│  - Verificação de propriedade e permissões por ID      │
└────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────┐
│  Camada 4: Banco de Dados PostgreSQL & RLS             │
│  - Row Level Security ativo em 100% das tabelas        │
│  - Consultas parametrizadas (Prepared Statements)      │
│  - Chaves estrangeiras e integridade referencial ON    │
└────────────────────────────────────────────────────────┘
```

---

## 4. Matriz de Perfis e Permissões (RBAC)

| Recurso / Operação | Administrador | Coordenador | Atendente | Consulta |
| :--- | :---: | :---: | :---: | :---: |
| Visualizar Dashboard e Estatísticas | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| Listar Alunos e Matrículas | ✅ Sim | ✅ Sim | ✅ Sim | ✅ Sim |
| Cadastrar Novo Aluno e Responsável | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não |
| Digitalizar Ficha Física com Gemini AI | ✅ Sim | ✅ Sim | ✅ Sim | ❌ Não |
| Editar Matrícula e Turma | ✅ Sim | ✅ Sim | ❌ Não | ❌ Não |
| Visualizar Prontuário Clínico Detalhado | ✅ Sim | ✅ Sim | ❌ Não | ❌ Não |
| Exportar Relatórios (PDF / Excel) | ✅ Sim | ✅ Sim | ❌ Não | ❌ Não |
| Acessar Trilha de Auditoria do Sistema | ✅ Sim | ❌ Não | ❌ Não | ❌ Não |
| Excluir Aluno ou Inativar Matrícula | ✅ Sim | ❌ Não | ❌ Não | ❌ Não |

---

## 5. Trilha de Auditoria Imutável (`audit_logs`)

Todas as operações de criação, alteração, exclusão e exportação de dados são registradas em log de auditoria permanente:

- **Dados Registrados:**
  - `user_id`: Identificador único do operador responsável pela ação.
  - `action`: Tipo de operação (`LOGIN`, `CREATE_STUDENT`, `CONFIRM_OCR`, `EXPORT_REPORT`).
  - `resource`: Tabela ou módulo afetado (`students`, `enrollments`, `health_records`).
  - `ip_address`: Endereço IP de origem da requisição.
  - `user_agent`: Navegador e sistema operacional do cliente.
  - `timestamp`: Data e hora exatas com fuso UTC.
- **Sanitização Estrita de Logs:**
  - O utilitário de log (`server/src/utils/logger.ts`) intercepta e expurga automaticamente chaves de senha (`password`, `senha`), tokens de autorização (`authorization`, `jwt`) e notas clínicas de qualquer saída em log, prevenindo vazamentos em arquivos de registro de servidores.
