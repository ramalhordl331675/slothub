import type { APIRoute } from 'astro';
import { getAdminClient } from '../../lib/supabase';
import { verifySession } from '../../lib/auth';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Lê o JSON do body; retorna [null] se inválido (trata resposta não-JSON). */
async function readJson(request: Request): Promise<Record<string, any> | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Só aceita http(s); rejeita javascript:, data:, etc. (previne XSS). */
function sanitizeUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (v === '') return null;
  return /^https?:\/\//i.test(v) ? v : null;
}

/** Cor segura (hex). Evita injeção de CSS em style="--accent:...". */
function sanitizeColor(value: unknown): string {
  if (typeof value === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(value.trim())) return value.trim();
  return '#00ff88';
}

/** LISTA todos os links (admin) */
export const GET: APIRoute = async ({ cookies }) => {
  const user = await verifySession(cookies);
  if (!user) return json({ error: 'Não autorizado.' }, 401);

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('links_afiliados')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) return json({ error: error.message }, 500);
  return json(data);
};

/** CRIA um novo link */
export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await verifySession(cookies);
  if (!user) return json({ error: 'Não autorizado.' }, 401);

  const body = readJson(request);
  if (!body) return json({ error: 'JSON inválido.' }, 400);
  if (!body.nome_plataforma || !body.link_afiliado) {
    return json({ error: 'nome_plataforma e link_afiliado são obrigatórios.' }, 400);
  }

  const link = sanitizeUrl(body.link_afiliado);
  if (!link) {
    return json({ error: 'link_afiliado deve começar com http:// ou https://' }, 400);
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('links_afiliados')
    .insert({
      nome_plataforma: String(body.nome_plataforma),
      link_afiliado: link,
      imagem_url: sanitizeUrl(body.imagem_url),
      descricao: body.descricao ? String(body.descricao) : null,
      categoria: body.categoria ? String(body.categoria) : null,
      cor_destaque: sanitizeColor(body.cor_destaque),
      ativo: body.ativo !== false,
      ordem: Number.isFinite(body.ordem) ? body.ordem : 0,
    })
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
};
