import type { APIRoute } from 'astro';
import { getAnonClient } from '../../lib/supabase';
import { setSessionCookies } from '../../lib/auth';

export const prerender = false;

function redirectTo(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { location },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  let email: string | undefined;
  let password: string | undefined;

  const contentType = request.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      const fd = await request.formData();
      email = fd.get('email')?.toString();
      password = fd.get('password')?.toString();
    }
  } catch {
    return redirectTo('/admin?error=1');
  }

  if (!email || !password) {
    return redirectTo('/admin?error=1');
  }

  const supabase = getAnonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return redirectTo('/admin?error=1');
  }

  setSessionCookies(cookies, data.session.access_token, data.session.refresh_token);

  return redirectTo('/admin');
};
