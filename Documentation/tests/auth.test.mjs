import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const isProtectedPath = (pathname) => pathname === '/interno' || pathname.startsWith('/interno/') || pathname === '/operacao' || pathname.startsWith('/operacao/');

test('protege URLs operacionais, inclusive acesso direto', () => {
  assert.equal(isProtectedPath('/operacao/exemplo'), true);
  assert.equal(isProtectedPath('/interno/seguranca'), true);
  assert.equal(isProtectedPath('/usuario/primeiros-passos'), false);
});

test('não confunde apresentação LIVE MODE com rota operacional', () => {
  assert.equal(isProtectedPath('/presentation/artista/musica/guitar01'), false);
});

test('credenciais operacionais são configuração de runtime', () => {
  const middleware = fs.readFileSync(new URL('../src/middleware.ts', import.meta.url), 'utf8');
  assert.match(middleware, /process\.env\.DOCS_INTERNAL_USER/);
  assert.doesNotMatch(middleware, /import\.meta\.env\.DOCS_INTERNAL_USER/);
});

test('desenvolvimento local carrega credenciais privadas do .env', () => {
  const config = fs.readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /loadEnv\(process\.env\.NODE_ENV \|\| 'development', process\.cwd\(\), 'DOCS_INTERNAL_'\)/);
  assert.doesNotMatch(config, /PUBLIC_DOCS_INTERNAL_/);
});
