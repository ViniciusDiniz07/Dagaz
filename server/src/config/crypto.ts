import crypto from 'crypto';
import { env } from './env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recomendado para GCM
const TAG_LENGTH = 16; // 128 bits auth tag

/**
 * Deriva a chave de 32 bytes de forma determinística e segura
 */
function getEncryptionKey(): Buffer {
  const keyHex = env.ENCRYPTION_KEY;
  if (keyHex && keyHex.length === 64) {
    return Buffer.from(keyHex, 'hex');
  }
  // Se não tiver 64 hex chars, usa SHA-256 para gerar exatamente 32 bytes
  return crypto.createHash('sha256').update(keyHex || 'dagaz-secret-key').digest();
}

/**
 * Criptografa uma string usando AES-256-GCM
 * Formato retornado: iv:authTag:ciphertext (em hexadecimal)
 */
export function encryptData(plainText: string | null | undefined): string | null {
  if (!plainText) return null;
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Erro na criptografia:', error);
    throw new Error('Falha ao criptografar dados sensíveis');
  }
}

/**
 * Descriptografa uma string criptografada com AES-256-GCM
 */
export function decryptData(cipherText: string | null | undefined): string | null {
  if (!cipherText) return null;
  // Se o dado não estiver no formato iv:authTag:ciphertext, retorna como está (compatibilidade de dados já existentes)
  if (!cipherText.includes(':')) return cipherText;

  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return cipherText;

    const [ivHex, authTagHex, encryptedData] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    // Se falhar (por exemplo, texto legado não criptografado com esse formato), retorna o original
    return cipherText;
  }
}

/**
 * Mascara CPF para exibição segura (LGPD Compliant): ***.XXX.XXX-**
 */
export function maskCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return `***.${clean.substring(3, 6)}.${clean.substring(6, 9)}-**`;
}

/**
 * Mascara Telefone: (XX) *****-XXXX
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 10) {
    const ddd = clean.substring(0, 2);
    const end = clean.substring(clean.length - 4);
    return `(${ddd}) *****-${end}`;
  }
  return phone;
}
