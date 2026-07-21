---
title: "Rollback"
description: "Retorne à última versão aprovada sem reconstruir código durante o incidente."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["rollback", "incidente", "versao"]
order: 420
---

## Quando usar

Faça rollback quando a release causa indisponibilidade, falha crítica, exposição de segurança ou corrupção e a correção imediata é mais arriscada que retornar.

## Decisão

Defina impacto, versão atual, versão anterior aprovada, compatibilidade de dados e responsável. Se houve mudança destrutiva de schema ou dados, rollback de código isolado pode piorar o incidente.

## Frontend

Restaure o artefato/site preservado pelo deploy ou publique novamente o artefato imutável anterior. Não gere um novo build do commit antigo durante o incidente.

## Backend

Selecione a imagem/tag aprovada anterior ou o commit conhecido conforme o mecanismo implantado. Recrie somente serviços afetados e preserve logs. O processo atual baseado em Git precisa evoluir para imagens imutáveis para tornar este rollback reproduzível.

## Dados

Não restaure banco como reação automática a um bug de aplicação. Restauração com `--drop` é destrutiva e exige runbook próprio, backup preventivo e decisão explícita sobre perda de dados após o ponto restaurado.

## Verificação

Valide `/health`, página inicial, login técnico, biblioteca, apresentação e autorização. Registre causa, versão revertida, período afetado e tarefa de correção antes de encerrar.
