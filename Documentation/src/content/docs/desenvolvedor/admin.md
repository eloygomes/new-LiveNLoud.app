---
title: "Painel administrativo"
description: "Arquitetura isolada, desenvolvimento e controles do Admin do #Sustenido."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "operacao", "seguranca", "linguagem"]
tags: ["admin", "react", "express", "fastapi", "auditoria"]
order: 270
---

## Isolamento

O Admin possui frontend React/Vite, servidor Express, API interna FastAPI e MongoDB próprio para `adminUsers` e `adminLogs`. Ele consulta o banco alvo do produto por conexão controlada, mas não reutiliza contas comuns como administradores.

## Desenvolvimento local

```bash
cd Admin
cp .env.example .env
npm ci
npm run dev:server
npm run dev
```

Configure credenciais locais e secrets exclusivos do Admin. Nunca use os secrets JWT da API principal nem valores reais de bootstrap em documentação ou commits.

## Build

```bash
npm run build:admin
```

Em produção, o frontend usa `/api` no mesmo domínio do painel.

## Ações sensíveis

Aprovação, bloqueio, reativação, remoção de música, amizade ou usuário precisam de confirmação, motivo e auditoria. O backend deve impor autorização mesmo quando a interface esconde uma ação.

## Cobertura

`npm test` usa `--passWithNoTests`; sucesso do comando não representa cobertura. Crie testes para login/refresh, papéis, auditoria e cada ação destrutiva antes de considerar o Admin protegido contra regressão.
