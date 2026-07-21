---
title: "Mapa do repositório"
description: "Localize cada aplicação, serviço, script e área legada antes de alterar código."
audience: "desenvolvedor"
visibility: "public"
status: "stable"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "linguagem"]
tags: ["repositorio", "monorepo", "componentes"]
order: 220
---

| Caminho | Responsabilidade | Situação |
|---|---|---|
| `Front/` | aplicação web React/Vite | principal superfície do produto |
| `Mobile/` | aplicativo Expo/React Native | ativo, sem paridade completa |
| `Server/sustenido/` | backend e scraper de produção | ativo |
| `Server/liveNloud/` | backend e scraper de desenvolvimento | ativo como ambiente `live` |
| `Admin/` | painel administrativo isolado | ativo, sem testes reais |
| `MarketingPage/` | landing page Astro | ativa, publicação comercial condicionada |
| `Chrome Extension/` | captura rápida de músicas | Beta, instalação manual |
| `scripts/ops/` | deploy, backup, restore e sincronização | ativo e sensível |
| `Documentation/` | portal documental | ativo |
| `Server/OLD/`, `Server/03/` | código e builds históricos | legado; não usar em novas mudanças |

## Regra de alteração

Descubra primeiro qual cliente e ambiente consomem o código. Nomes históricos podem continuar em diretórios e bancos; não os transforme novamente em marca pública.

## Higiene

Não adicione `node_modules`, builds, backups, uploads, logs, mail data ou arquivos pessoais. O histórico já contém artefatos dessa natureza e requer saneamento separado.
