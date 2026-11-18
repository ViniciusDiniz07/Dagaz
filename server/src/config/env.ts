import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'esporte_dagaz_jwt_super_secure_secret_key_2026_at_least_32_chars',
  JWT_EXPIRES_IN: '8h',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'c39e248b9415c829e1d8a435a201bcf891048e9185a06941295b9d3248e3a241',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};
