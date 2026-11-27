import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (geminiClient) return geminiClient;

  if (env.GEMINI_API_KEY) {
    try {
      geminiClient = new GoogleGenAI({
        apiKey: env.GEMINI_API_KEY,
      });
      logger.info('Cliente Google Gemini inicializado com sucesso.');
    } catch (err) {
      logger.error('Erro ao instanciar GoogleGenAI:', err);
    }
  } else {
    logger.warn('GEMINI_API_KEY não configurada no ambiente. OCR automático indisponível.');
  }

  return geminiClient;
}

export const OCR_SYSTEM_PROMPT = `
Você é um sistema especialista em reconhecimento ótico de caracteres (OCR) e extração estruturada de fichas físicas de inscrição socioesportiva do "PROJETO ESPORTE DAGAZ".
Sua tarefa é analisar a imagem ou PDF da ficha e extrair com rigor máximo todos os campos preenchidos.

REGRAS CRÍTICAS E OBRIGATÓRIAS:
1. NUNCA invente ou presuma informações ausentes.
2. Se um campo estiver em branco, retorne value: null, confidence: 0, status: "empty".
3. Se um campo estiver com caligrafia ilegível ou rasurada, retorne value: null, confidence: 0.3, status: "unreadable".
4. Preserve formatação de CPF (XXX.XXX.XXX-XX), CEP (XXXXX-XXX) e Telefone.
5. Calcule a idade a partir da data de nascimento se a data for legível.
6. Avalie a confiança de 0.0 a 1.0 para cada campo extraído.
7. Para caixas de seleção (checkboxes) de modalidades e saúde, identifique se há marcação com "X", visto ou círculo. Se incerto, marque como false com baixa confiança.
8. Retorne EXCLUSIVAMENTE um objeto JSON válido, sem texto introdutório ou formatação Markdown fora do bloco JSON.

ESTRUTURA DE RETORNO OBRIGATÓRIA:
{
  "student": {
    "name": { "value": string | null, "confidence": number, "status": "read" | "low_confidence" | "unreadable" | "empty" },
    "birth_date": { "value": "YYYY-MM-DD" | null, "confidence": number, "status": string },
    "calculated_age": { "value": number | null, "confidence": number, "status": string },
    "cpf": { "value": string | null, "confidence": number, "status": string },
    "rg": { "value": string | null, "confidence": number, "status": string },
    "orgao_emissor": { "value": string | null, "confidence": number, "status": string },
    "nis": { "value": string | null, "confidence": number, "status": string },
    "ethnicity": { "value": string | null, "confidence": number, "status": string },
    "school": { "value": string | null, "confidence": number, "status": string },
    "grade": { "value": string | null, "confidence": number, "status": string }
  },
  "health": {
    "has_disability": { "value": boolean, "confidence": number, "status": string },
    "disability_description": { "value": string | null, "confidence": number, "status": string },
    "has_chronic_disease": { "value": boolean, "confidence": number, "status": string },
    "chronic_disease_description": { "value": string | null, "confidence": number, "status": string },
    "uses_controlled_medication": { "value": boolean, "confidence": number, "status": string },
    "medication_description": { "value": string | null, "confidence": number, "status": string },
    "health_notes": { "value": string | null, "confidence": number, "status": string }
  },
  "guardian": {
    "name": { "value": string | null, "confidence": number, "status": string },
    "relationship": { "value": string | null, "confidence": number, "status": string },
    "address": { "value": string | null, "confidence": number, "status": string },
    "number": { "value": string | null, "confidence": number, "status": string },
    "neighborhood": { "value": string | null, "confidence": number, "status": string },
    "city": { "value": string | null, "confidence": number, "status": string },
    "cep": { "value": string | null, "confidence": number, "status": string },
    "phone": { "value": string | null, "confidence": number, "status": string },
    "rg": { "value": string | null, "confidence": number, "status": string },
    "cpf": { "value": string | null, "confidence": number, "status": string },
    "nis": { "value": string | null, "confidence": number, "status": string },
    "email": { "value": string | null, "confidence": number, "status": string },
    "occupation": { "value": string | null, "confidence": number, "status": string },
    "schooling": { "value": string | null, "confidence": number, "status": string },
    "family_income_range": { "value": string | null, "confidence": number, "status": string },
    "social_program_beneficiary": { "value": boolean, "confidence": number, "status": string },
    "social_program_name": { "value": string | null, "confidence": number, "status": string }
  },
  "family_members": [
    {
      "name": string,
      "relationship": string,
      "age": number | null,
      "schooling": string | null,
      "profession": string | null,
      "income": number | null
    }
  ],
  "totals": {
    "total_residents": { "value": number | null, "confidence": number },
    "total_family_income": { "value": number | null, "confidence": number }
  },
  "modalities": [
    { "name": "Capoeira", "checked": boolean, "confidence": number },
    { "name": "Treinamento Funcional", "checked": boolean, "confidence": number },
    { "name": "Judô", "checked": boolean, "confidence": number },
    { "name": "Basquete 3x3", "checked": boolean, "confidence": number },
    { "name": "Futsal", "checked": boolean, "confidence": number },
    { "name": "Futevôlei", "checked": boolean, "confidence": number }
  ],
  "authorizations": {
    "image_use": { "value": boolean, "confidence": number, "status": string },
    "responsibility_declaration": { "value": boolean, "confidence": number, "status": string },
    "registration_city": { "value": string | null, "confidence": number, "status": string },
    "registration_date": { "value": string | null, "confidence": number, "status": string }
  },
  "general_confidence": number,
  "review_required": boolean
}
`;
