import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  // Garante que nossas rotas dinâmicas sejam tratadas como SSR (on-demand)
  prefetch: false,
});
