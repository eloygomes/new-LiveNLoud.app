---
title: "Arquitetura do sistema"
description: "Visão das superfícies, serviços, integrações e limites de confiança."
audience: "arquitetura"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["arquitetura", "componentes", "fluxo", "seguranca"]
order: 210
---

## Visão de contexto

```text
Web React ───────┐
Mobile Expo ─────┼── HTTPS/REST ── API Node/Express ── MongoDB
Extensão ────────┘                     │
                                       ├── Scraper Python ── fontes externas (Beta)
                                       ├── SMTP
                                       └── YouTube OAuth/API (Beta)

Admin React/Express/FastAPI ── banco próprio do Admin
             └─────────────── acesso controlado aos dados do produto
```

Marketing e documentação são superfícies independentes. O portal de documentação usa Astro SSR e protege conteúdo operacional no servidor.

## Fluxo principal

Clientes autenticam na API Node, recebem access/refresh token e operam documentos MongoDB. Importações passam pela API e pelo scraper Python. Arquivos Guitar Pro são armazenados e associados à música. Recursos sociais usam REST; Socket.IO está descontinuado.

## Ambientes

- **desenvolvimento (`live`)**: domínio, API, banco e compose próprios;
- **produção (#Sustenido)**: implantação e banco do produto;
- não existe staging confirmado;
- LIVE MODE é somente uma função da apresentação.

## Limites de confiança

Navegador, mobile e extensão são clientes não confiáveis: autorização deve ser aplicada no servidor. Scraper e integrações externas são **Beta** e devem ter timeout, limite de requisição, validação e logs sanitizados. O Admin usa credenciais, secrets e banco de autenticação separados.

## Dívidas estruturais

Backend Node monolítico, duas árvores de servidor semelhantes, contratos legados, ausência de migrações MongoDB e artefatos gerados no repositório aumentam o risco de mudança. Evoluções devem reduzir duplicação sem misturar ambientes.
