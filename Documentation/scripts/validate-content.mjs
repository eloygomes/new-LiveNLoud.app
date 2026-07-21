import fs from 'node:fs';
const root = new URL('../src/content/docs/', import.meta.url);
const files = fs.readdirSync(root, { recursive: true }).filter((name) => name.endsWith('.md'));
const required = ['title', 'description', 'audience', 'visibility', 'status', 'featureStatus', 'owner', 'validatedAt', 'validatedCommit', 'reviewers', 'tags', 'order'];
for (const file of files) {
  const text = fs.readFileSync(new URL(file, root), 'utf8');
  const frontmatter = text.split('---')[1] ?? '';
  for (const field of required) if (!new RegExp(`^${field}:`, 'm').test(frontmatter)) throw new Error(`${file}: campo ausente ${field}`);
  if (/youtube|spotify|guitar pro|offline|bluetooth|midi|scrap|extens[aã]o/i.test(text) && !/Beta/i.test(text)) throw new Error(`${file}: integração sem aviso Beta`);
}
console.log(`${files.length} páginas de conteúdo validadas.`);
