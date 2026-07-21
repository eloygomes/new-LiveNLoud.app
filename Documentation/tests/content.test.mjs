import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('página pública e página operacional têm visibilidade distinta', () => {
  const user = fs.readFileSync(new URL('../src/content/docs/usuario/primeiros-passos.md', import.meta.url), 'utf8');
  const operation = fs.readFileSync(new URL('../src/content/docs/operacao/verificacao-de-disponibilidade.md', import.meta.url), 'utf8');
  assert.match(user, /visibility: "public"/);
  assert.match(operation, /visibility: "restricted"/);
  assert.match(user, /LIVE MODE/);
});

test('manual público cobre o lote prioritário e sinaliza páginas Beta', () => {
  const root = new URL('../src/content/docs/usuario/', import.meta.url);
  const files = fs.readdirSync(root).filter((name) => name.endsWith('.md'));
  assert.ok(files.length >= 14, `esperava ao menos 14 páginas, encontrei ${files.length}`);
  for (const name of ['offline-e-sincronizacao.md', 'integracoes-e-exportacoes.md', 'extensao-do-navegador.md', 'web-e-aplicativo-mobile.md']) {
    assert.match(fs.readFileSync(new URL(name, root), 'utf8'), /featureStatus: "beta"/);
  }
});

test('não anuncia afinador nativo nem paridade mobile como entregues', () => {
  const mobile = fs.readFileSync(new URL('../src/content/docs/usuario/web-e-aplicativo-mobile.md', import.meta.url), 'utf8');
  assert.match(mobile, /Afinador[\s\S]*Planejado/);
  assert.match(mobile, /ainda não tem paridade/);
});

test('lote técnico cobre componentes, contratos e segurança', () => {
  const root = new URL('../src/content/docs/desenvolvedor/', import.meta.url);
  const files = fs.readdirSync(root).filter((name) => name.endsWith('.md'));
  assert.ok(files.length >= 15, `esperava ao menos 15 páginas técnicas, encontrei ${files.length}`);
  for (const name of ['frontend-web.md', 'aplicativo-mobile.md', 'backend-node.md', 'scraper-python.md', 'admin.md', 'extensao.md', 'modelo-de-dados.md', 'referencia-api.md', 'seguranca-e-privacidade.md']) {
    assert.ok(files.includes(name), `página técnica ausente: ${name}`);
  }
});

test('documentação técnica preserva riscos conhecidos', () => {
  const root = new URL('../src/content/docs/desenvolvedor/', import.meta.url);
  const mobile = fs.readFileSync(new URL('aplicativo-mobile.md', root), 'utf8');
  const backend = fs.readFileSync(new URL('backend-node.md', root), 'utf8');
  const security = fs.readFileSync(new URL('seguranca-e-privacidade.md', root), 'utf8');
  assert.match(mobile, /api\.live\.eloygomes\.com/);
  assert.match(mobile, /Socket\.IO[\s\S]*descontinuada/);
  assert.match(backend, /endpoints[\s\S]*sem middleware/);
  assert.match(security, /endpoints sensíveis sem JWT/);
});

test('lote operacional é restrito e cobre os runbooks exigidos', () => {
  const root = new URL('../src/content/docs/operacao/', import.meta.url);
  const files = fs.readdirSync(root).filter((name) => name.endsWith('.md'));
  assert.ok(files.length >= 15, `esperava ao menos 15 páginas operacionais, encontrei ${files.length}`);
  for (const name of ['ambientes.md', 'deploy-e-promocao.md', 'rollback.md', 'backup-externo.md', 'restauracao.md', 'observabilidade-e-alertas.md', 'resposta-a-incidentes.md', 'lgpd-retencao-e-exclusao.md', 'runbook-api.md', 'runbook-mongodb.md']) {
    const text = fs.readFileSync(new URL(name, root), 'utf8');
    assert.match(text, /visibility: "restricted"/, `${name} deve ser restrita`);
  }
});

test('backup e monitoramento não são anunciados como implantados', () => {
  const root = new URL('../src/content/docs/operacao/', import.meta.url);
  for (const name of ['backup-externo.md', 'observabilidade-e-alertas.md']) {
    const text = fs.readFileSync(new URL(name, root), 'utf8');
    assert.match(text, /featureStatus: "planned"/);
    assert.match(text, /não existe|não é backup off-site/i);
  }
});

test('menu público não enumera páginas operacionais', () => {
  const layout = fs.readFileSync(new URL('../src/layouts/DocsLayout.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(layout, /href: '\/operacao\/(?:backup|rollback|runbook|restauracao|ambientes)/);
  assert.match(layout, /Operação restrita/);
});
