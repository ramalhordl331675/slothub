import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function env(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente "${name}" não está definida. ` +
        `Crie um arquivo ".env.local" baseado em ".env.local.example".`
    );
  }
  return value as string;
}

/**
 * Cliente com a chave "anon". Usado para:
 *  - Ler links públicos (respeitando as policies de RLS)
 *  - Validar o token de sessão do admin
 */
export function getAnonClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente com a chave "service_role". Usado no servidor para CRUD completo
 * (ignora RLS). NUNCA use no navegador.
 */
export function getAdminClient(): SupabaseClient {
  return createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type LinkAfiliado = {
  id: string;
  nome_plataforma: string;
  link_afiliado: string;
  imagem_url: string | null;
  descricao: string | null;
  categoria: string | null;
  cor_destaque: string;
  ativo: boolean;
  ordem: number;
  created_at: string;
};
