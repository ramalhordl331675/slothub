import type { APIRoute } from 'astro';
import { clearSessionCookies } from '../../lib/auth';

export const POST: APIRoute = async ({ cookies }) => {
  clearSessionCookies(cookies);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
};
