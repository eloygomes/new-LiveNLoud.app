import fs from 'node:fs';
const files = fs.readdirSync(new URL('../src/', import.meta.url), { recursive: true }).filter((name) => /\.(astro|md)$/.test(name));
const known = new Set(['/', '/buscar', '/desenvolvedor', '/arquitetura', '/referencia', '/usuario/primeiros-passos', '/operacao/exemplo']);
const contentRoot = new URL('../src/content/docs/', import.meta.url);
for (const name of fs.readdirSync(contentRoot, { recursive: true }).filter((name) => /\.mdx?$/.test(name))) {
  known.add(`/${name.replace(/\.mdx?$/, '')}`);
}
for (const name of files) {
  const text = fs.readFileSync(new URL(name, new URL('../src/', import.meta.url)), 'utf8');
  for (const [, href] of text.matchAll(/href=["'`]([^"'`]+)["'`]/g)) {
    if (href.startsWith('/') && !known.has(href.split('#')[0])) throw new Error(`${name}: link interno desconhecido ${href}`);
  }
}
console.log('Links internos estáticos validados.');
