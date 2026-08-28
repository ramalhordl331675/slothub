import type { APIRoute } from 'astro';
import { getAnonClient } from '../../lib/supabase';
import { buildSessionCookieHeaders } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let email: string | undefined;
  let password: string | undefined;

  try {
    const body = await request.json();
    email = body.email;
    password = body.password;
  } catch {
    return new Response(JSON.stringify({ error: 'Requisição inválida.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'E-mail e senha são obrigatórios.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return new Response(JSON.stringify({ error: error?.message || 'Falha no login.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const headers = new Headers();
  headers.set('content-type', 'application/json');
  for (const c of buildSessionCookieHeaders(data.session.access_token, data.session.refresh_token)) {
    headers.append('set-cookie', c);
  }

  return new Response(JSON.stringify({ ok: true, user: data.user }), { headers });
};
