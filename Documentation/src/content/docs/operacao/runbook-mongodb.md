---
title: "Runbook — MongoDB"
description: "Trate indisponibilidade, disco, autenticação e suspeita de corrupção do banco."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["runbook", "mongodb", "disco", "recuperacao"]
order: 490
---

## Primeiro diagnóstico

Confirme ambiente, banco esperado, espaço em disco, estado do container, montagem do volume e mensagens de autenticação. Não execute bootstrap contra volume existente sem compreender o efeito.

## Disco cheio

Interrompa crescimento desnecessário e preserve dados. Não apague arquivos internos do Mongo manualmente. Limpe somente artefatos comprovadamente externos/descartáveis e aumente capacidade conforme plano aprovado.

## Falha de autenticação

Compare variáveis e usuário com o inventário privado sem imprimir secrets. Mudança de senha exige atualização coordenada dos serviços. Não desative autenticação para restaurar acesso.

## Corrupção ou perda

Pare gravações quando indicado, preserve volume/snapshot e acione restauração isolada. Não rode `mongorestore --drop` por tentativa. Confirme archive, hash, banco e perda após o ponto restaurado.

## Validação

Após recuperação, verifique saúde, logs, coleções esperadas, índices e operação com conta sintética. Execute backup novo somente depois de confirmar consistência para não substituir o último backup bom por estado corrompido.
