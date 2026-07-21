---
title: "Frontend web"
description: "Arquitetura, configuração e pontos críticos da aplicação React/Vite."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["frontend", "react", "vite", "web"]
order: 230
---

## Stack e estrutura

O Front usa React 18, Vite, Tailwind e MUI. Páginas ficam em `Front/src/Pages`, componentes compartilhados em `Front/src/components` e contratos HTTP em `Front/src/Tools/Controllers.jsx`.

## Configuração de API

`VITE_API_BASE_URL` é resolvida no build. Sem valor, o desenvolvimento local usa `http://localhost:3000`. Os scripts oficiais são:

```bash
npm run build:live
npm run build:sustenido
```

O build de produção deve conter `https://api.sustenido.eloygomes.com`. Nunca use a API `live` como fallback de produção.

## Rotas críticas

Dashboard, criação/edição de música, calendário, perfil, ferramentas e apresentação formam os fluxos principais. `Presentation.jsx`, seus hooks/toolboxes, `Controllers.jsx` e `GuitarProViewer.jsx` concentram alto risco de regressão.

## Estado e offline

O frontend persiste sessão elegível, músicas offline e fila de mutações. Offline/PWA é **Beta**. Mudanças de contrato precisam testar comportamento online, restauração offline e reconciliação.

## Testes

Use `npm test` para Vitest e Testing Library. Execute `npm run build:sustenido` quando a mudança depender de variáveis de produção. Não valide Presentation apenas por snapshot: cubra teclado, setlist, rolagem, edição e instrumento.

## Regras de segurança

Não confie no e-mail enviado pelo cliente para decidir propriedade. Tokens ficam no fluxo de autenticação; logs e mensagens de erro não devem expô-los. Variáveis `VITE_*` são públicas no bundle e nunca podem conter secrets.
