---
title: "Deploy e promoção"
description: "Publique frontend e backend com validação, promoção imutável e smoke tests."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["deploy", "promocao", "frontend", "backend"]
order: 410
---

## Pré-condições

- mudança revisada e commit identificado;
- testes e build aprovados;
- configuração do ambiente validada sem exibir secrets;
- backup aplicável concluído;
- rollback definido;
- janela e responsável registrados.

## Frontend web

Use os scripts completos de `scripts/ops/deploy/front/`, não os legados. O fluxo incrementa versão, executa testes, gera o build do ambiente, valida a API embutida, guarda o site atual, publica com rsync e executa healthcheck.

O script `manual_dist` só serve para reenviar um artefato já testado. Ele não substitui testes, build ou versionamento.

## Backend

Use o script de ambiente em `scripts/ops/deploy/back/`. Ele exige confirmação, executa `git pull --ff-only`, recria API Node e scraper e então verifica saúde. Divergência Git no servidor deve interromper o deploy; não faça merge improvisado na VPS.

## Promoção

1. publique em desenvolvimento (`live`);
2. execute smoke tests públicos e autenticados;
3. aprove produto, técnica e segurança;
4. promova o mesmo commit/artefato para produção;
5. valide saúde, login, biblioteca, apresentação e bloqueios;
6. registre versão, horário e resultado.

## Critério de sucesso

Serviços saudáveis não bastam: confirme API correta no frontend, autenticação, carregamento de uma biblioteca técnica e uma rota crítica. Scraper e demais integrações externas são **Beta** e têm smoke test próprio.
