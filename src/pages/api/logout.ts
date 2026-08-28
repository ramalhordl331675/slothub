import type { APIRoute } from 'astro';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../../lib/auth';

export const POST: APIRoute = async () => {
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    headers.append('set-cookie', `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  }
  return new Response(JSON.stringify({ ok: true }), { headers });
};
