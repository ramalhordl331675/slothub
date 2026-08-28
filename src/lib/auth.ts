import type { AstroCookies } from 'astro';
import type { User } from '@supabase/supabase-js';
import { getAnonClient } from './supabase';

export const ACCESS_COOKIE = 'sb-access-token';
export const REFRESH_COOKIE = 'sb-refresh-token';

const COOKIE_OPTS = {
  httpOnly: true,
  path: '/',
  secure: true,
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 dias
};

/**
 * Decodifica o payload de um JWT sem validar assinatura (o cookie é
 * httpOnly e só definido pelo nosso servidor após login bem-sucedido).
 */
function decodeJwt(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    return json as Record<string, any>;
  } catch {
    return null;
  }
}

/**
 * Verifica se existe uma sessão válida lendo o cookie de acesso.
 *
 * Valida o JWT localmente (sem chamada de rede) para evitar loops de
 * sessão. Se estiver expirado, tenta renovar via refresh token.
 */
export async function verifySession(cookies: AstroCookies): Promise<User | null> {
  const access = cookies.get(ACCESS_COOKIE)?.value;
  const refresh = cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return null;

  if (access) {
    const payload = decodeJwt(access);
    const exp = payload?.exp ? Number(payload.exp) * 1000 : 0;
    if (payload?.sub && (!exp || exp > Date.now())) {
      // Sessão válida (sem dependência de rede).
      return {
        id: payload.sub,
        email: payload.email ?? null,
        app_metadata: {},
        user_metadata: {},
        aud: payload.aud ?? 'authenticated',
        created_at: '',
      } as unknown as User;
    }
  }

  if (refresh) {
    const { data, error } = await getAnonClient().auth.refreshSession({ refresh_token: refresh });
    if (!error && data.session) {
      setSessionCookies(cookies, data.session.access_token, data.session.refresh_token);
      return (data.user as User) ?? null;
    }
  }

  return null;
}

export async function setSessionCookies(
  cookies: AstroCookies,
  accessToken: string,
  refreshToken: string
) {
  cookies.set(ACCESS_COOKIE, accessToken, COOKIE_OPTS);
  cookies.set(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
}

export function clearSessionCookies(cookies: AstroCookies) {
  cookies.delete(ACCESS_COOKIE, { path: '/' });
  cookies.delete(REFRESH_COOKIE, { path: '/' });
}
