import type { APIRoute } from 'astro';
import { getAdminClient } from '../../../lib/supabase';
import { verifySession } from '../../../lib/auth';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

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

  const body = await request.json();
  const update: Record<string, unknown> = {};
  for (const campo of CAMPOS) {
    if (body[campo] !== undefined) update[campo] = body[campo];
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
