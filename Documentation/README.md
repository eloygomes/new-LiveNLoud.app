# Portal de documentação do #Sustenido

Primeira entrega arquitetural definida pelo plano consolidado de 16/07/2026. O portal usa Astro SSR, TypeScript strict, Tailwind CSS, Content Collections e proteção no servidor para conteúdo operacional.

## Executar localmente

1. Copie `.env.example` para `.env` e troque as credenciais de exemplo.
2. Execute `npm ci`.
3. Execute `npm run dev`.
4. Abra `http://localhost:4321`.

## Validar

- `npm test`: regras mínimas de conteúdo e autorização.
- `npm run validate`: tipos, schemas e links internos estáticos.
- `npm run build`: validação completa e build Node standalone.

## Segurança

`/operacao/*` e `/interno/*` exigem autenticação no middleware. Em produção, prefira o proxy da VPS enviando `X-Docs-Authenticated: true` somente depois de autenticar o usuário. Como fallback, configure `DOCS_INTERNAL_USER` e `DOCS_INTERNAL_PASSWORD` fora da imagem. Nunca grave credenciais, hosts internos, tokens, dumps ou dados pessoais no portal.

## Container

O `Dockerfile` executa build e testes em estágios separados e inicia o servidor como usuário não-root. O `compose.yaml` mantém a porta apenas na rede interna do proxy, usa filesystem somente leitura e expõe `/health` para verificação.

## Escopo atual

Esta entrega inclui a árvore definitiva, schema editorial, busca pública inicial, página completa de primeiros passos, exemplo operacional protegido, matriz de rastreabilidade, ADR e tickets de divergências. O restante do manual deve ser produzido após aprovação deste ponto de controle.
