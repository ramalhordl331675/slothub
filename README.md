# 🎰 SlotHub — Site de Links de Afiliados (Cassinos & Slots)

Site completo em **Astro + Supabase + Vercel** com:
- Página pública (`/`) em tema escuro estilo cassino, grid responsivo de cards com botão "Jogar Agora".
- Painel admin (`/admin`) com login via Supabase Auth e CRUD completo de links (listar, adicionar, editar, excluir, ativar/desativar). Tudo via SSR.
- Banco de dados Supabase (`links_afiliados`).

---

## 1. Pré-requisitos
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com)
- Node.js 18+ instalado

## 2. Configurar o Supabase
1. Crie um projeto no Supabase.
2. Vá em **SQL Editor** e execute o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql). Isso cria a tabela `links_afiliados`, as policies de RLS e dados de exemplo.
3. Crie um **usuário admin** em **Authentication → Users → Add user** (e-mail + senha). Será usado para entrar no `/admin`.
4. Em **Project Settings → API**, copie:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key (secreta!) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Login do admin não funciona?** Se retornar "Invalid login credentials", verifique em
> **Authentication → Users** se o usuário está com e-mail **confirmado**. Se necessário, desative a
> confirmação de e-mail em **Authentication → Providers → Email** (ou confirme o usuário manualmente).

## 3. Configurar variáveis de ambiente
Copie o exemplo e preencha com seus valores:

```bash
cp .env.local.example .env.local
```

Conteúdo de `.env.local`:
```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-publica
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-secreta
```

> ⚠️ A `SUPABASE_SERVICE_ROLE_KEY` é secreta e só é usada no servidor (SSR). Nunca a exponha no front-end.

## 4. Instalar e rodar localmente
```bash
npm install
npm run dev
```
- Site público: http://localhost:4321/
- Admin: http://localhost:4321/admin (use o usuário criado no passo 2.3)

## 5. Deploy na Vercel
1. Faça push deste projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Na Vercel, importe o repositório. O `astro.config.mjs` já usa o adapter `@astrojs/vercel` (SSR).
3. Em **Settings → Environment Variables** adicione:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Pronto — `/` e `/admin` funcionando em SSR.

## 6. Estrutura do projeto
```
.
├── astro.config.mjs          # Config do Astro + adapter Vercel (SSR)
├── supabase/
│   └── schema.sql            # Cria tabela, RLS e dados de exemplo
├── src/
│   ├── layouts/Base.astro    # Layout + tema escuro cassino
│   ├── components/SlotCard.astro
│   ├── lib/
│   │   ├── supabase.ts       # Clientes anon + service_role
│   │   └── auth.ts           # Sessão via cookie + verifySession
│   └── pages/
│       ├── index.astro       # Página pública (SSR)
│       ├── admin/index.astro # Login + painel (SSR + interatividade)
│       └── api/
│           ├── login.ts      # POST login (define cookie)
│           ├── logout.ts     # POST logout
│           ├── links.ts      # GET (lista) + POST (cria)
│           └── links/[id].ts # PUT (edita) + DELETE (exclui)
```

## 7. Como funciona o fluxo
- **Home (`/`)**: busca links com `ativo = true` usando a chave `anon` (respeita RLS).
- **Admin (`/admin`)**: valida o cookie de sessão (`sb-access-token`) via `supabase.auth.getUser`. Se não logado, mostra o login. Se logado, usa a chave `service_role` para CRUD completo.
- Ao **adicionar/ativar** um link no admin, ele aparece automaticamente na home (próximo reload, pois a home é SSR).

## 8. Observações de segurança
- O cookie de sessão é `httpOnly` + `secure` + `sameSite=lax`.
- A chave `service_role` nunca vai para o navegador.
- Recomenda-se ativar MFA e usar apenas usuários confiáveis no Supabase Auth.

## 9. CI/CD (GitHub Actions)
- `.github/workflows/ci.yml` — valida o build em PRs/pushes.
- `.github/workflows/deploy.yml` — faz deploy em produção na Vercel (só roda se os segredos existirem).
- `vercel.json` — headers de segurança + cache de assets (aditivo, não conflita com o adapter).

Para o deploy automático, adicione estes **Secrets** no repo GitHub:
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (ver em Vercel → Settings → Tokens / Project).
As env vars do Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) continuam configuradas no painel da Vercel, não no GitHub.

<!-- deploy trigger -->
