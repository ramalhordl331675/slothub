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
 * Verifica se existe uma sessão válida lendo o cookie de acesso
 * e validando o JWT junto ao Supabase Auth.
 *
 * Se o access token estiver expirado (o padrão do Supabase é ~1h),
 * tenta renovar a sessão usando o refresh token e reescreve os cookies.
 */
export async function verifySession(cookies: AstroCookies): Promise<User | null> {
  const access = cookies.get(ACCESS_COOKIE)?.value;
  const refresh = cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) return null;

  const supabase = getAnonClient();

  if (access) {
    const { data } = await supabase.auth.getUser(access);
    if (data.user) return data.user;
  }

  if (refresh) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refresh });
    if (!error && data.session) {
      setSessionCookies(cookies, data.session.access_token, data.session.refresh_token);
      return data.user ?? null;
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
