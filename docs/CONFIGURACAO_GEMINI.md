# Guia de Configuração do Google Gemini AI – Condomínio Cultura e Esportivo

Este documento orienta a integração do **Google Gemini AI** para a digitalização inteligente de fichas físicas de inscrição no Sistema de Gestão Socioesportiva – Condomínio Cultura e Esportivo.

---

## 1. Visão Geral da Funcionalidade

O módulo de digitalização substitui o trabalho manual e repetitivo de digitação de fichas de papel por um fluxo automatizado de leitura multimodal alimentado pela API do Google Gemini.

### Fluxo Operacional:
1. O funcionário fotografa ou faz upload da ficha física de inscrição (PNG, JPEG ou PDF).
2. O backend valida a integridade do arquivo e o encaminha para o Google Gemini via SDK oficial `@google/genai`.
3. O Gemini processa o documento visualmente e extrai estruturadamente todos os dados em formato JSON padronizado.
4. A tela de conferência apresenta lado a lado a imagem original e os dados extraídos, destacando com alertas visuais os campos com caligrafia duvidosa ou baixa confiança.
5. **Revisão Humana Obrigatória (*Human-in-the-Loop*):** Os dados só são persistidos no PostgreSQL/Supabase após conferência explícita e clique no botão "Confirmar e Efetivar Cadastro" pelo atendente.

---

## 2. Como Obter a Chave da API Gemini

1. Acesse o **Google AI Studio** em [aistudio.google.com](https://aistudio.google.com/).
2. Faça login com sua conta Google institucional ou de desenvolvedor.
3. No menu lateral, clique em **"Get API key"**.
4. Clique em **"Create API key in new project"** (ou selecione um projeto existente no Google Cloud).
5. Copie a chave de API gerada (`AIzaSy...`).

---

## 3. Configuração no Backend

Abra o arquivo `server/.env` e defina a chave obtida:

```ini
# Chave oficial do Google Gemini API
GEMINI_API_KEY=AIzaSySuaChaveDeApiAqui
```

> 🔒 **Regra de Segurança Inviolável:** A chave da API Gemini é restrita e privativa do backend. Ela **nunca** deve ser enviada para o frontend ou injetada no código do navegador.

---

## 4. Engenharia de Prompts e Regras de Extração

O prompt do sistema (`OCR_SYSTEM_PROMPT` em `server/src/config/gemini.ts`) impõe diretrizes rigorosas para garantir a conformidade dos dados com a realidade:

### Regras Mandatórias de Negócio para o Modelo:
- **Alucinação Zero:** Nunca inventar informações nem preencher dados não visíveis.
- **Valores Ausentes:** Campos em branco na folha física devem retornar estritamente `null`.
- **Diferenciação Caligráfica:** Diferenciar campo não preenchido de campo ilegível ou rasurado.
- **Formatação Brasileira:** Preservar a formatação de CPF (`000.000.000-00`), CEP (`00000-000`) e Telefone (`(24) 99999-9999`).
- **Detecção de Baixa Confiança:** A IA calcula uma pontuação de confiança (0 a 100%) para cada campo. Se um número ou letra estiver manchado ou ambíguo, a confiança é reduzida, acionando um alerta de revisão na interface do usuário.
- **Autorizações e Assinaturas:** Não marcar autorização de imagem ou declaração de responsabilidade como concedida sem que o "X" ou a assinatura estejam visíveis e legíveis.

---

## 5. Estrutura do JSON Extraído

O Gemini retorna os dados na seguinte estrutura canônica validada:

```json
{
  "modalidades_selecionadas": ["Judô", "Capoeira"],
  "aluno": {
    "nome": "Lucas Gabriel da Silva",
    "data_nascimento": "2014-05-12",
    "idade": 11,
    "cpf": "145.892.307-88",
    "rg": "28.910.455-2",
    "orgao_emissor": "DETRAN-RJ",
    "nis": "20938472615",
    "etnia": "Parda",
    "escola": "E.M. João XXIII",
    "serie": "5º Ano"
  },
  "saude": {
    "possui_deficiencia": false,
    "descricao_deficiencia": null,
    "possui_doenca_cronica": true,
    "descricao_doenca": "Asma leve",
    "utiliza_medicamento": true,
    "descricao_medicamento": "Aerolin sob demanda",
    "observacoes_atividades": "Evitar esforço intenso sem aquecimento"
  },
  "responsavel": {
    "nome": "Mariana da Silva",
    "parentesco": "Mãe",
    "endereco": "Rua São João",
    "numero": "142",
    "bairro": "Vila Americana",
    "cidade": "Volta Redonda",
    "cep": "27215-000",
    "telefone": "(24) 98123-4567",
    "rg": "14.288.901-0",
    "cpf": "088.455.912-34",
    "nis": "10928374650",
    "email": "mariana.santos@email.com",
    "ocupacao": "trabalho_formal",
    "escolaridade": "Médio Completo",
    "renda_familiar": "Até 02 Salários Mínimos",
    "beneficiario_programa_social": true,
    "qual_programa_social": "Bolsa Família"
  },
  "composicao_familiar": {
    "residentes": [
      { "nome": "Mariana da Silva", "parentesco": "Mãe", "idade": 36, "renda": 1650.0 },
      { "nome": "Lucas Gabriel", "parentesco": "Filho", "idade": 11, "renda": 0.0 }
    ],
    "total_residentes": 2,
    "renda_familiar_total": 1650.0
  },
  "autorizacoes": {
    "autorizacao_uso_imagem": true,
    "declaracao_responsabilidade": true,
    "assinatura_responsavel_presente": true,
    "assinatura_assistente_social_presente": false,
    "data_inscricao": "2026-02-10",
    "local_inscricao": "Volta Redonda"
  },
  "confianca_campos": {
    "aluno.nome": 98.0,
    "aluno.data_nascimento": 97.0,
    "aluno.nis": 72.0
  },
  "general_confidence": 94.5
}
```

---

## 6. Disponibilidade do OCR

O OCR depende da variável `GEMINI_API_KEY` configurada no ambiente do backend. Sem essa chave, a API informa que a leitura automática está indisponível; não há extração simulada.
