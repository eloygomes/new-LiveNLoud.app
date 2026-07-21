---
title: "Aplicativo React Native"
description: "Estado atual, execução e limites de paridade do aplicativo Expo."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "beta"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["produto", "tecnico", "seguranca", "linguagem"]
tags: ["mobile", "react-native", "expo", "offline", "beta"]
order: 240
---

## Stack

Expo 54, React Native 0.81 e Expo Router com rotas baseadas em arquivos. O aplicativo possui autenticação, biblioteca, editor, calendário, social e armazenamento offline em diferentes níveis de maturidade.

## Executar

```bash
cd Mobile
npm ci
npm start
```

Use emulador, simulador, desenvolvimento nativo ou Expo Go conforme a capacidade testada. Recursos de dispositivo podem não funcionar igualmente no Expo Go.

## Divergência de ambiente

`Mobile/connect/connect.tsx` e o editor ainda apontam diretamente para `https://api.live.eloygomes.com/api`. A decisão de produto exige `https://api.sustenido.eloygomes.com` em produção. Substitua constantes por configuração validada de ambiente antes de distribuir.

## Socket.IO

Há constantes e dependências residuais relacionadas a Socket.IO. A tecnologia foi descontinuada; não crie novos fluxos sobre ela. Remova o cliente e use REST/polling onde necessário, com testes de reconexão.

## Offline

O armazenamento, fila e sessão offline possuem uma suíte específica:

```bash
npm run test:offline
```

Offline mobile é **Beta** e não compartilha automaticamente a mesma implementação da PWA web.

## Roadmap, não recurso entregue

O afinador nativo ainda não está implementado e a apresentação não tem paridade confirmada com a web. Documente TODOs como planejados, nunca como capacidade disponível.
