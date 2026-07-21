---
title: "Runbook — indisponibilidade da API"
description: "Diagnostique e recupere a API sem agravar banco, dados ou autenticação."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["runbook", "api", "indisponibilidade"]
order: 480
---

## Sintomas

`/health` falha, frontend recebe 5xx/timeout, login não responde ou o container reinicia. Confirme ambiente antes de qualquer ação.

## Diagnóstico

1. verifique monitor externo e horário inicial;
2. confira estado/reinícios dos containers;
3. leia logs recentes sanitizados da API;
4. confirme recursos do host, disco e conectividade Mongo;
5. compare com deploy/configuração recente;
6. teste `/health` local e via proxy;
7. verifique certificado, DNS e proxy se apenas acesso externo falhar.

## Contenção

Se uma rota específica causa carga ou exposição, limite/bloqueie-a no proxy preservando o restante. Não reinicie em loop e não apague volume/logs.

## Recuperação

Reverta release/configuração conhecida ou recrie apenas o serviço afetado. Não restaure banco sem evidência de corrupção. Após recuperar, valide login técnico, biblioteca e autorização negativa.

## Escalonamento

Acione banco quando houver falha de conexão/corrupção; segurança quando houver token, dados ou rota exposta; provedor quando host/rede falhar. Encerre após estabilidade observada e ação corretiva registrada.
