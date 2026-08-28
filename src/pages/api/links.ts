import type { APIRoute } from 'astro';
import { getAdminClient } from '../../lib/supabase';
import { verifySession } from '../../lib/auth';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

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

  const body = await request.json();
  if (!body.nome_plataforma || !body.link_afiliado) {
    return json({ error: 'nome_plataforma e link_afiliado são obrigatórios.' }, 400);
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('links_afiliados')
    .insert({
      nome_plataforma: body.nome_plataforma,
      link_afiliado: body.link_afiliado,
      imagem_url: body.imagem_url || null,
      descricao: body.descricao || null,
      categoria: body.categoria || null,
      cor_destaque: body.cor_destaque || '#00ff88',
      ativo: body.ativo !== false,
      ordem: Number.isFinite(body.ordem) ? body.ordem : 0,
    })
    .select()
    .single();

  if (error) return json({ error: error.message }, 500);
  return json(data, 201);
};
