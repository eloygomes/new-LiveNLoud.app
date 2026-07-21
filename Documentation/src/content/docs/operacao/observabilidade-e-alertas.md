---
title: "Observabilidade e alertas"
description: "Monitore disponibilidade, infraestrutura, dependências e experiência real fora da VPS."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "planned"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["monitoramento", "alertas", "observabilidade", "slo"]
order: 450
---

## Estado atual

Há healthchecks locais e em scripts, mas não existe monitoramento externo confirmado. Um monitor na mesma VPS falha junto com os serviços e não é suficiente.

## Fase 1 — disponibilidade

Verifique externamente a cada cinco minutos: página pública, API `/health`, Admin e landing/documentação quando publicados. Registre código, latência, certificado e conteúdo mínimo. Alerte após duas ou três falhas e informe recuperação.

## Fase 2 — infraestrutura

Monitore CPU, memória, disco, reinícios, MongoDB, SMTP, erro HTTP 5xx, falhas de login, fila de e-mail, validade do último backup e idade dos certificados. O check não deve vazar configuração ou enviar e-mail real a cada execução.

## Fase 3 — experiência

Diariamente, uma conta técnica de baixo privilégio autentica, carrega uma biblioteca sintética e abre apresentação. Nunca use administrador ou dados reais. Scraper, OAuth, Guitar Pro/AlphaTab e demais integrações são **Beta** e devem ter checks separados, menos frequentes e não destrutivos.

## Alertas acionáveis

Cada alerta informa serviço, ambiente, horário, check, impacto, evidência sanitizada, runbook, responsável e critério de encerramento. Defina severidade e escalonamento; evite alertas sem ação possível.
