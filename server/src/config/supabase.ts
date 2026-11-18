import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
      logger.info('Cliente Supabase inicializado com chave de serviço (Service Role).');
    } catch (err) {
      logger.error('Erro ao conectar ao Supabase:', err);
    }
  } else {
    logger.info('Supabase URL ou Service Key não informadas. Modo local ativo.');
  }

  return supabaseClient;
}
