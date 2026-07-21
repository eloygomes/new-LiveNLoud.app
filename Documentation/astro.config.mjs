import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

// Astro/Vite does not copy .env values into process.env automatically.
// Load only the server-side docs credentials for local development; the
// standalone production server continues to receive them at runtime.
const localEnv = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'DOCS_INTERNAL_');
process.env.DOCS_INTERNAL_USER ||= localEnv.DOCS_INTERNAL_USER;
process.env.DOCS_INTERNAL_PASSWORD ||= localEnv.DOCS_INTERNAL_PASSWORD;

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://docs.sustenido.eloygomes.com',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  vite: { plugins: [tailwindcss()] },
  security: { checkOrigin: true },
});
