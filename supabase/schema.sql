-- =====================================================================
--  SlotHub — Schema do Supabase
--  Execute este script no SQL Editor do seu projeto Supabase
--  (Dashboard -> SQL -> New query -> cole e "Run")
-- =====================================================================

-- 1) TABELA --------------------------------------------------------------
create table if not exists public.links_afiliados (
  id              uuid primary key default gen_random_uuid(),
  nome_plataforma text        not null,
  link_afiliado   text        not null,
  imagem_url      text,
  descricao       text,
  categoria       text,
  cor_destaque    text        default '#00ff88',
  ativo           boolean     default true,
  ordem           integer     default 0,
  created_at      timestamptz default now()
);

create index if not exists idx_links_ativo on public.links_afiliados (ativo);
create index if not exists idx_links_ordem on public.links_afiliados (ordem);

-- 2) ROW LEVEL SECURITY --------------------------------------------------
alter table public.links_afiliados enable row level security;

-- Público: pode LER apenas links ativos (usado na home do site)
drop policy if exists "public_read_active" on public.links_afiliados;
create policy "public_read_active"
  on public.links_afiliados
  for select
  using (ativo = true);

-- Autenticado (admin): controle total (o servidor também usa service_role,
-- que ignora RLS, mas esta policy protege acesso direto via Auth)
drop policy if exists "authenticated_all" on public.links_afiliados;
create policy "authenticated_all"
  on public.links_afiliados
  for all
  to authenticated
  using (true)
  with check (true);

-- 3) DADOS DE EXEMPLO (opcional — remova se não quiser) -------------------
-- Substitua os links de afiliado pelos seus links reais.
insert into public.links_afiliados (nome_plataforma, link_afiliado, imagem_url, descricao, categoria, cor_destaque, ativo, ordem)
values
  ('BetStars',     'https://exemplo.com/?ref=slothub', 'https://placehold.co/600x340/0b0c18/00ff88?text=BetStars',     'Bônus de boas-vindas de 100% + 50 giros grátis.', 'Cassino', '#00ff88', true, 1),
  ('LuckySpins',   'https://exemplo.com/?ref=slothub', 'https://placehold.co/600x340/0b0c18/ffd34e?text=LuckySpins', 'Melhores slots do mercado e saques rápidos.',     'Slots',   '#ffd34e', true, 2),
  ('RoyalPoker',   'https://exemplo.com/?ref=slothub', 'https://placehold.co/600x340/0b0c18/ff4d6d?text=RoyalPoker',  'Mesa de poker ao vivo 24h com torneios diários.', 'Poker',   '#ff4d6d', true, 3),
  ('NeonCasino',   'https://exemplo.com/?ref=slothub', 'https://placehold.co/600x340/0b0c18/8b5cff?text=NeonCasino',  'Experiência neon com milhares de jogos.',          'Cassino', '#8b5cff', false, 4)
on conflict do nothing;

-- =====================================================================
--  IMPORTANTE: crie um USUÁRIO para acessar o /admin
--  Dashboard -> Authentication -> Users -> "Add user"
--  (ou use um e-mail/senha que você já tenha no Supabase Auth)
-- =====================================================================
