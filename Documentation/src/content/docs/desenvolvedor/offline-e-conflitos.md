---
title: "Arquitetura offline e conflitos"
description: "Persistência local, fila de mutações e fronteiras entre web e mobile."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "beta"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["offline", "pwa", "mobile", "sincronizacao", "beta"]
order: 320
---

## Capacidades

A web mantém armazenamento, fila e restauração de sessão elegível. O mobile possui store e fila próprios. Ambos são **Beta** e não devem compartilhar documentação como se fossem uma única implementação.

## Modelo de mutação

Uma operação offline precisa de identificador estável, tipo, payload mínimo, data, tentativas e estado. Reenvio deve ser idempotente ou detectar duplicidade. Tokens expirados exigem reconexão e refresh antes da fila.

## Conflitos

O modelo atual não possui uma estratégia global documentada de versionamento. Até defini-la, evite last-write-wins silencioso para conteúdo musical. Considere versão do agregado, horário do servidor, diff e escolha explícita quando ambos os lados mudaram.

## Segurança local

Armazene somente o necessário, limpe dados no logout/exclusão e evite tokens de longa duração sem proteção. Conteúdo offline em dispositivo perdido pode expor repertório e dados pessoais.

## Testes

- primeira sincronização;
- reinício no meio da fila;
- repetição idempotente;
- token expirado;
- edição concorrente em dois dispositivos;
- exclusão enquanto offline;
- mudança de schema;
- quota/limpeza do navegador ou sistema.

No mobile, execute `npm run test:offline`. Na web, rode a suíte Vitest relacionada a offline e sessão.
