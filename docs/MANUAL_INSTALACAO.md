# Manual de Instalação e Execução – Sistema Esporte Dagaz

Este documento orienta a equipe de tecnologia e desenvolvimento na instalação, configuração e inicialização do **Sistema de Gestão Socioesportiva – Projeto Esporte Dagaz**.

---

## 1. Requisitos Prévios

Certifique-se de possuir em seu ambiente:
- **Node.js**: Versão 18.x, 20.x ou 22.x LTS instalada ([nodejs.org](https://nodejs.org/)).
- **Gerenciador de Pacotes**: `pnpm` (recomendado) ou `npm`.
- **Git**: Para controle de versão.
- **Navegador Moderno**: Google Chrome, Microsoft Edge, Firefox ou Safari.

---

## 2. Estrutura do Repositório

```plaintext
Dagaz/
├── client/                     # Frontend SPA (React 18 + TypeScript + Vite + Tailwind CSS)
│   ├── public/                 # Favicons, amostras de fichas oficiais (sample-fichas)
│   ├── src/
│   │   ├── components/         # Header, Sidebar, MobileDrawer, BottomNav, StudentDossierModal
│   │   ├── contexts/           # AuthContext (autenticação persistente, RBAC)
│   │   ├── pages/              # Login (p1), Dashboard (p2), Matrículas (p3), Cadastro (p4), Scanner (p5), Auditoria
│   │   ├── services/           # Cliente HTTP Axios/Fetch tipado
│   │   └── types/              # Definições de tipos TypeScript
├── server/                     # Backend API REST (Node.js + Express + TypeScript + Zod)
│   ├── src/
│   │   ├── config/             # Criptografia AES-256-GCM, Gemini API, Supabase, Variáveis de Ambiente
│   │   ├── db/                 # Conexão PostgreSQL e Repositório Resiliente Local
│   │   ├── middlewares/        # Autenticação JWT, RBAC, Rate Limiting, Auditoria, Helmet
│   │   ├── modules/            # Auth, Alunos, Matrículas, Modalidades, Responsáveis, OCR, Relatórios
│   │   └── utils/              # Logger estruturado, sanitizador de logs, gerador JWT
│   └── tests/                  # Testes automatizados Vitest (Auth, RBAC, Alunos, OCR)
├── supabase/
│   └── migrations/             # Migrações SQL versionadas (DDL, RLS, Seed Oficial)
└── docs/                       # Documentação técnica e operacional
```

---

## 3. Configuração do Backend (`server/`)

### 3.1. Variáveis de Ambiente
Navegue até a pasta `server/` e verifique ou crie o arquivo `.env`:

```bash
cd server
cp .env.example .env   # ou configure manualmente conforme abaixo
```

Exemplo de conteúdo do `server/.env`:
```ini
PORT=3001
NODE_ENV=development

# Segurança de Criptografia (32 bytes em hexadecimal)
ENCRYPTION_KEY=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
JWT_SECRET=esporte-dagaz-super-secret-jwt-key-2026-production

# Supabase / PostgreSQL (Opcional para teste local: o sistema possui fallback automático em memória)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
SUPABASE_DB_URL=postgresql://postgres.seu-projeto:senha@aws-0-sa-east-1.pooler.supabase.com:6543/postgres

# Google Gemini AI (Para processamento multimodal de fichas físicas)
GEMINI_API_KEY=sua-chave-gemini-ai-studio

# Configurações de CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

> **Nota:** Caso você não configure `SUPABASE_DB_URL` ou `GEMINI_API_KEY` de imediato, o sistema entrará automaticamente em **Modo Local Resiliente**, pré-carregando 100% dos dados reais do Instituto Dagaz (turmas, modalidades, alunos e fichas) sem travar ou interromper a navegação!

### 3.2. Instalação e Execução do Servidor
```bash
# Na raiz do projeto ou dentro de server/
cd server
pnpm install

# Executar em modo desenvolvimento (Hot reload com TSX)
pnpm run dev

# Ou compilar e executar o build de produção
pnpm run build
pnpm start
```

O servidor iniciará em `http://localhost:3001`.

---

## 4. Configuração do Frontend (`client/`)

### 4.1. Variáveis de Ambiente
O arquivo `client/.env` configura o endereço da API. Para desenvolvimento web, pode usar o proxy local do Vite sem definir essa variável. Para o APK, configure a URL pública HTTPS do backend:

```bash
cd ../client
```

Copie `client/.env.example` para `client/.env` e ajuste o endereço:
```ini
VITE_API_URL=https://api.seu-dominio.com/api
```

### 4.2. Instalação e Execução da Aplicação Web
```bash
cd client
pnpm install

# Iniciar servidor de desenvolvimento Vite
pnpm run dev
```

A aplicação estará disponível em `http://localhost:5173`.

### 4.3. Gerar o projeto Android e o APK

O frontend usa Capacitor para gerar o projeto nativo Android. O backend precisa estar publicado e acessível por HTTPS; `localhost` dentro do APK aponta para o próprio telefone, não para o computador. A variável `VITE_API_URL` é incorporada ao app durante o build, então configure-a antes de sincronizar.

1. Instale o **Android Studio** e, pelo SDK Manager, instale uma versão do Android SDK e as ferramentas de build disponíveis.
2. No terminal, execute:

```bash
cd client
pnpm install
pnpm run android:sync
pnpm run android:open
```

O projeto que deve ser aberto no Android Studio está em `client/android/`. O comando de sincronização compila o frontend e copia os arquivos para o projeto nativo; repita-o depois de alterações no frontend.

3. No Android Studio, aguarde a sincronização do Gradle e use **Build > Build Bundle(s) / APK(s) > Build APK(s)** para gerar um APK de teste. Para publicar ou distribuir um APK assinado, use **Build > Generate Signed Bundle / APK...** e crie/seleciona uma chave de assinatura Android. Guarde essa chave e sua senha em local seguro; são diferentes das chaves do Supabase e do Gemini.

O APK gerado para teste normalmente fica em `client/android/app/build/outputs/apk/debug/`. Não inclua credenciais Supabase ou Gemini no frontend ou no APK; elas pertencem somente ao `server/.env`.

---

## 5. Credenciais de Acesso Administrativo Pré-Configuradas

Para demonstração e testes imediatos, o sistema já possui 3 perfis funcionais cadastrados:

| Perfil | E-mail | Senha Padrão | Nível de Permissão |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@esportedagaz.org.br` | `Admin@Dagaz2026!` | Acesso total: auditoria, exclusão, relatórios e gestão de usuários |
| **Coordenadora** | `ana.silva@esportedagaz.org.br` | `Admin@Dagaz2026!` | Gestão completa de turmas, alunos, responsáveis e matrículas |
| **Atendente** | `carlos.santos@esportedagaz.org.br` | `Admin@Dagaz2026!` | Cadastro de novos alunos e digitalização OCR de fichas |

---

## 6. Execução da Suíte de Testes Automatizados

O backend conta com uma suíte de testes de unidade e integração implementada com **Vitest**, cobrindo autenticação, RBAC, integridade de dados e validações do Gemini OCR:

```bash
cd server
pnpm test
```

Resultado esperado:
```plaintext
 ✓ tests/ocr.test.ts (5 tests)
 ✓ tests/rbac.test.ts (4 tests)
 ✓ tests/students.test.ts (6 tests)
 ✓ tests/auth.test.ts (9 tests)

 Test Files  4 passed (4)
      Tests  24 passed (24)
```

---

## 7. Solução de Problemas Comuns

1. **Porta 3001 ou 5173 já em uso:**
   - No Windows: Execute `netstat -ano | findstr :3001` e finalize o processo com `taskkill /PID <PID> /F`, ou altere a porta no `.env`.
2. **Erro de CORS ao acessar a API:**
   - Verifique se `CORS_ORIGIN` no `server/.env` inclui a URL exata do frontend (por exemplo, `http://localhost:5173`).
3. **Upload de fichas grandes:**
   - O Multer e o middleware Express estão configurados com limite de 10 MB por arquivo para fotografias de alta resolução ou digitalizações em PDF.
