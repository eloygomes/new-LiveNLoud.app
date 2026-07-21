---
title: "Restauração"
description: "Recupere banco e arquivos em ambiente isolado antes de qualquer sobrescrita."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["restauracao", "mongodb", "disaster-recovery"]
order: 440
---

## Regra principal

Restaure primeiro em ambiente isolado. Nunca aponte um teste de restore para produção. Os scripts de `scripts/ops/db/restore/` usam confirmação, backup preventivo, envio do archive, `mongorestore --drop` e healthcheck; `--drop` substitui dados.

## Preparação

- incidente e objetivo registrados;
- archive identificado por hash/data/ambiente;
- banco real confirmado contra Compose e `MONGO_DATABASES`;
- chave e acesso aprovados;
- ponto de perda de dados comunicado;
- lista de contas excluídas após o backup disponível para reaplicação;
- backup preventivo do destino concluído.

## Ensaio isolado

1. provisione MongoDB vazio e sem acesso público;
2. valide hash e descriptografe em storage temporário protegido;
3. restaure sem reutilizar secrets de produção;
4. verifique coleções, contagens aproximadas, índices e amostra técnica;
5. valide uploads associados;
6. teste login/biblioteca com conta sintética;
7. elimine o ambiente e temporários conforme política.

## Produção

Somente após aprovação, janela e ensaio. Suspenda gravações quando necessário, execute o script correto, reaplique exclusões obrigatórias e valide aplicação. Não sincronize `live` e produção como atalho de restore.

## Encerramento

Registre RPO/RTO observado, archive, resultado, dados perdidos, exclusões reaplicadas e ações corretivas sem expor conteúdo do banco.
