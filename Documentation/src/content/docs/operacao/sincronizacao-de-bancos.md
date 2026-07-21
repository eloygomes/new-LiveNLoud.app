---
title: "Sincronização de bancos"
description: "Controle a cópia entre desenvolvimento e produção como operação destrutiva excepcional."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["sincronizacao", "mongodb", "destrutivo", "dados-pessoais"]
order: 530
---

## Classificação

Os scripts de `scripts/ops/db/sync_db/` sobrescrevem o destino com `mongorestore --drop`. São operações destrutivas excepcionais, não parte de deploy, backup ou rotina diária.

## Bloqueios obrigatórios

Não execute enquanto houver divergência entre o banco do Compose de produção e `MONGO_DATABASES`. Não copie produção para desenvolvimento sem base legal, minimização, controle de acesso e anonimização adequada.

## Antes da execução

1. registre finalidade e aprovação de produto/operação/segurança;
2. confirme origem e destino em voz alta com outro operador;
3. identifique bancos e coleções;
4. estime indisponibilidade e perda no destino;
5. faça e valide backups de origem e destino;
6. confirme lista de exclusões LGPD;
7. prepare rollback e healthcheck.

## Depois

Valide ambiente destino, coleções, autenticação, biblioteca sintética e segregação. Reaplique exclusões quando necessário. Restrinja e elimine cópias intermediárias conforme retenção. Registre hashes e resultado sem publicar caminhos ou dados.
