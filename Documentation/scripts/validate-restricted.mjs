import fs from 'node:fs';

const root = new URL('../src/content/docs/operacao/', import.meta.url);
const files = fs.readdirSync(root, { recursive: true }).filter((name) => /\.mdx?$/.test(name));
const forbidden = [
  { label: 'endereço IPv4', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/ },
  { label: 'URI de banco', pattern: /mongodb(?:\+srv)?:\/\//i },
  { label: 'chave privada', pattern: /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/ },
  { label: 'atribuição de segredo', pattern: /\b(?:PASSWORD|PASS|SECRET|TOKEN|API_KEY)\s*=\s*\S+/i },
  { label: 'Bearer token', pattern: /Bearer\s+[A-Za-z0-9._~-]{16,}/i },
];

for (const file of files) {
  const text = fs.readFileSync(new URL(file, root), 'utf8');
  if (!/visibility: "restricted"/.test(text)) throw new Error(`${file}: conteúdo operacional precisa ser restrito`);
  for (const rule of forbidden) if (rule.pattern.test(text)) throw new Error(`${file}: possível ${rule.label}`);
}

console.log(`${files.length} páginas operacionais verificadas contra exposição de dados sensíveis.`);
