import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { encryptData, decryptData, maskCPF, maskPhone } from '../src/config/crypto.js';
import { signAccessToken, verifyAccessToken } from '../src/utils/jwt.js';

describe('Módulo de Autenticação e Criptografia (LGPD & Segurança)', () => {
  describe('Criptografia AES-256-GCM de Dados Sensíveis', () => {
    it('deve criptografar e descriptografar dados clínicos/sensíveis com sucesso', () => {
      const sensitiveClinicalNote = 'Paciente apresenta asma moderada e necessita inalador Salbutamol antes do treino';
      const encrypted = encryptData(sensitiveClinicalNote);

      expect(encrypted).not.toBeNull();
      expect(encrypted).not.toEqual(sensitiveClinicalNote);
      expect(encrypted).toContain(':'); // Formato iv:authTag:ciphertext

      const decrypted = decryptData(encrypted);
      expect(decrypted).toBe(sensitiveClinicalNote);
    });

    it('deve lidar com valores nulos ou vazios de forma segura', () => {
      expect(encryptData(null)).toBeNull();
      expect(encryptData(undefined)).toBeNull();
      expect(decryptData(null)).toBeNull();
      expect(decryptData(undefined)).toBeNull();
    });

    it('deve retornar o texto intacto se não estiver no formato criptografado (compatibilidade retroativa)', () => {
      const plain = 'Texto legado sem cifragem';
      expect(decryptData(plain)).toBe(plain);
    });
  });

  describe('Mascaramento de Dados LGPD', () => {
    it('deve mascarar CPF mantendo apenas dígitos intermediários ocultando início e fim', () => {
      const rawCpf = '12345678900';
      const formattedCpf = '123.456.789-00';

      const maskedRaw = maskCPF(rawCpf);
      const maskedFormatted = maskCPF(formattedCpf);

      expect(maskedRaw).toBe('***.456.789-**');
      expect(maskedFormatted).toBe('***.456.789-**');
    });

    it('deve mascarar telefone com formato brasileiro de forma legível', () => {
      const phone = '24987654321';
      const masked = maskPhone(phone);
      expect(masked).toBe('(24) *****-4321');
    });

    it('deve retornar string vazia ou original quando o dado não é válido', () => {
      expect(maskCPF('')).toBe('');
      expect(maskPhone(null)).toBe('');
    });
  });

  describe('Tokens JWT e Validação de Sessão', () => {
    it('deve emitir e verificar token JWT assinado para um usuário com perfil admin', () => {
      const payload = {
        userId: 'f87a3b12-9c2e-4b6a-9f5e-1234567890ab',
        email: 'admin@esportedagaz.org.br',
        nome: 'Administrador Geral',
        role: 'admin' as const,
      };

      const token = signAccessToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // Header.Payload.Signature

      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe('admin');
    });

    it('deve rejeitar tokens adulterados', () => {
      const payload = {
        userId: '123',
        email: 'teste@dagaz.org.br',
        nome: 'Teste',
        role: 'consulta' as const,
      };

      const token = signAccessToken(payload);
      const tamperedToken = token.slice(0, -5) + 'xxxxx';

      expect(() => verifyAccessToken(tamperedToken)).toThrow();
    });
  });

  describe('Hashing de Senhas com Bcrypt', () => {
    it('deve gerar hash seguro e validar senhas corretamente', async () => {
      const plainPassword = 'SenhaForteDagaz2026!#';
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plainPassword, salt);

      expect(hash).not.toBe(plainPassword);
      const isValid = await bcrypt.compare(plainPassword, hash);
      expect(isValid).toBe(true);

      const isInvalid = await bcrypt.compare('SenhaIncorreta', hash);
      expect(isInvalid).toBe(false);
    });
  });
});
