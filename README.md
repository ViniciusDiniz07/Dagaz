# Sistema de Gestão Socioesportiva – Projeto Esporte Dagaz

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

Plataforma integrada de gestão socioesportiva desenvolvida especificamente para o **Projeto Esporte Dagaz** (Volta Redonda/RJ), em parceria com o **Instituto Dagaz**, a **CSN** e o **Governo do Estado do Rio de Janeiro**.

O sistema digitaliza e centraliza todo o fluxo de matrículas, turmas, prontuários de saúde e acompanhamento socioeconômico das famílias atendidas, integrando **inteligência artificial multimodal (Google Gemini)** para leitura de fichas físicas de papel.

---

## 📸 Telas e Referências Visuais (Figma Pixel-Perfect)

O sistema foi rigorosamente desenvolvido seguindo as telas de referência oficiais:
- **`p1.HTML`**: Login institucional e recuperação de acesso seguro com feedback visual.
- **`p2.HTML`**: Dashboard administrativo com KPIs em tempo real, gráficos de modalidades, distribuição etária e feed de atividades.
- **`p3.HTML`**: Gestão de matrículas com busca instantânea, chips de status, filtros por oficinas esportivas, exportação e prontuário completo.
- **`p4.HTML`**: Formulário de matrícula em 5 etapas (Identificação, Escolaridade, Saúde Condicional, Modalidades e Composição Familiar dinâmica).
- **`p5.HTML`**: Estação de digitalização e conferência lado a lado com OCR do Google Gemini, zoom/pan do documento e salvamento condicionado à revisão humana (*Human-in-the-Loop*).

---

## 🚀 Início Rápido

### 1. Clonar e Instalar Dependências
```bash
# Instalar dependências do Backend
cd server
pnpm install

# Instalar dependências do Frontend
cd ../client
pnpm install
```

### 2. Iniciar os Serviços em Modo Desenvolvimento
Em um terminal (Backend):
```bash
cd server
pnpm run dev
# Servidor disponível em http://localhost:3001
```

Em outro terminal (Frontend):
```bash
cd client
pnpm run dev
# Aplicação web disponível em http://localhost:5173
```

---

## 🔑 Credenciais Pré-Configuradas para Demonstração

| Perfil | E-mail | Senha | Acesso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@esportedagaz.org.br` | `Admin@Dagaz2026!` | Completo + Auditoria + Exclusão |
| **Coordenadora** | `ana.silva@esportedagaz.org.br` | `Admin@Dagaz2026!` | Gestão Geral de Alunos e Turmas |
| **Atendente** | `carlos.santos@esportedagaz.org.br` | `Admin@Dagaz2026!` | Cadastro e Digitalização de Fichas |

---

## 🧪 Suíte de Testes Automatizados

O sistema conta com suíte de testes unitários e de integração utilizando **Vitest**:

```bash
cd server
pnpm test
```

- `tests/auth.test.ts`: Hashing Bcrypt, criptografia AES-256-GCM, mascaramento LGPD e emissão de JWT.
- `tests/rbac.test.ts`: Proteção de rotas e matriz de perfis funcionais.
- `tests/students.test.ts`: Validações de formulário Zod e integridade do banco de dados.
- `tests/ocr.test.ts`: Esquema canônico de extração do Gemini e detecção de baixa confiança.

---

## 📚 Documentação Técnica Completa

Consulte a pasta [`docs/`](./docs/):
- 📘 [Manual de Instalação e Execução](./docs/MANUAL_INSTALACAO.md)
- 🗄️ [Guia de Configuração do Supabase & PostgreSQL](./docs/CONFIGURACAO_SUPABASE.md)
- 🤖 [Guia de Integração com Google Gemini AI](./docs/CONFIGURACAO_GEMINI.md)
- 🔒 [Diretrizes de Segurança, LGPD e Proteção de Dados de Menores](./docs/SEGURANCA_E_LGPD.md)
- 🏛️ [Arquitetura de Software e Diagrama de Dados](./docs/ARQUITETURA.md)

---

## 🏛️ Modalidades Oficiais Atendidas
1. **Capoeira**
2. **Treinamento Funcional**
3. **Judô**
4. **Basquete 3x3**
5. **Futsal**
6. **Futevôlei**

---

## ⚖️ Conformidade e Licença
Desenvolvido em estrita conformidade com o Artigo 14 da Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018).
Todos os direitos reservados ao **Projeto Esporte Dagaz** e entidades parceiras.
