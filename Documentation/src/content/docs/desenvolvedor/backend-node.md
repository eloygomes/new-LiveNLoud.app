---
title: "Backend Node/Express"
description: "Responsabilidades, inicialização, contratos e riscos da API principal."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["backend", "node", "express", "api"]
order: 250
---

## Responsabilidades

A API Node concentra autenticação, dados musicais, perfil, Guitar Pro, social, calendário, compartilhamento, analytics, YouTube e integração com o scraper. O arquivo principal é monolítico e convive com rotas modernas e legadas. Scraping, Guitar Pro/AlphaTab e YouTube são integrações **Beta** mesmo quando suas rotas já estão implementadas.

## Executar pelo Compose

```bash
cd Server/sustenido
cp .env.example .env
docker compose up -d --build node python_scraper db
```

Use credenciais locais. O serviço expõe `/health` e, no container, escuta na porta definida pela composição.

## Prefixo e compatibilidade

A API vigente usa `/api/v1`. Existe middleware de compatibilidade para caminhos antigos e uma duplicidade de cadastro entre `/api/v1/signup` e `/api/v1/auth/signup`. Novos clientes devem usar contratos canônicos de `/api/v1/auth/*`.

## Autorização

`authenticateJWT` protege várias rotas, mas existem endpoints de dados, perfil, scraping, progresso e notas sem middleware. Isso é defeito de segurança, não contrato público desejável. Toda correção deve validar propriedade do recurso, não apenas presença de token.

## Observabilidade

Logs devem registrar identificadores técnicos mínimos e nunca headers completos, senha, access token, refresh token ou conteúdo privado. Healthcheck confirma disponibilidade, não comportamento funcional.

## Testes

O package atual só declara `start`; não há suíte automatizada do backend. Adicione testes de contrato e autorização antes de refatorações estruturais, especialmente para rotas legadas.
