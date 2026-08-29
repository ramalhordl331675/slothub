import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';
import { verifySession } from '../../../lib/auth';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Lê o JSON do body; retorna null se inválido. */
async function readJson(request: Request): Promise<Record<string, any> | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Só aceita http(s). */
function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (v === '') return null;
  return /^https?:\/\//i.test(v) ? v : null;
}

/** Cor segura (hex). */
function sanitizeColor(value: unknown): string {
  if (typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value.trim())) return value.trim();
  return '#00ff88';
}

const CAMPOS = [
  'nome_plataforma',
  'link_afiliado',
  'imagem_url',
  'descricao',
  'categoria',
  'cor_destaque',
  'ativo',
  'ordem',
] as const;

/** ATUALIZA um link */
export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const user = await verifySession(cookies);
  if (!user) return json({ error: 'Não autorizado.' }, 401);

  const id = params.id;
  if (!id) return json({ error: 'ID ausente.' }, 400);

  const body = readJson(request);
  if (!body) return json({ error: 'JSON inválido.' }, 400);

  const update: Record<string, unknown> = {};
  for (const campo of CAMPOS) {
    if (body[campo] === undefined) continue;
    if (campo === 'link_afiliado') {
      const link = sanitizeUrl(body[campo]);
      if (!link) return json({ error: 'link_afiliado deve começar com http:// ou https://' }, 400);
      update[campo] = link;
    } else if (campo === 'imagem_url') {
      update[campo] = sanitizeUrl(body[campo]); // null se vazio/inválido
    } else if (campo === 'cor_destaque') {
      update[campo] = sanitizeColor(body[campo]);
    } else if (campo === 'ativo') {
      update[campo] = body[campo] === true || body[campo] === 'true';
    } else if (campo === 'ordem') {
      update[campo] = Number.isFinite(body[campo]) ? body[campo] : 0;
    } else {
      update[campo] = String(body[campo]);
    }
  }

  if (Object.keys(update).length === 0) {
    return json({ error: 'Nenhum campo para atualizar.' }, 400);
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('links_afiliados')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data);
};

/** EXCLUI um link */
export const DELETE: APIRoute = async ({ params, cookies }) => {
  const user = await verifySession(cookies);
  if (!user) return json({ error: 'Não autorizado.' }, 401);

  const id = params.id;
  if (!id) return json({ error: 'ID ausente.' }, 400);

  const supabase = getAdminClient();
  const { error } = await supabase.from('links_afiliados').delete().eq('id', id);

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};
