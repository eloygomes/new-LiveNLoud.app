---
title: "Resposta a incidentes"
description: "Classifique, contenha, recupere e revise incidentes técnicos ou de dados."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "planned"
owner: "seguranca"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["incidentes", "seguranca", "comunicacao", "pos-incidente"]
order: 460
---

## Acionamento

Abra incidente quando houver indisponibilidade relevante, corrupção, acesso indevido, segredo exposto, perda de backup, abuso do scraper ou suspeita de vazamento. Defina líder, severidade, canal restrito e horário inicial.

Scraper e integrações externas são **Beta**, mas abuso, exposição de dados ou impacto sistêmico continuam sujeitos a este processo de incidente.

## Sequência

1. **Identificar:** impacto, ambiente, usuários e início provável.
2. **Conter:** revogar credenciais/tokens, isolar serviço ou bloquear rota conforme o risco.
3. **Preservar:** guardar logs e metadados necessários com acesso restrito; não alterar evidência original.
4. **Erradicar:** corrigir causa e rotacionar segredos expostos.
5. **Recuperar:** usar artefato aprovado, validar dados e monitorar recorrência.
6. **Comunicar:** atualizar responsáveis e, quando aplicável, jurídico, autoridade e titulares.
7. **Revisar:** produzir análise sem culpa, ações, responsáveis e prazos.

## Severidade inicial

- **SEV-1:** exposição de dados, corrupção ampla ou indisponibilidade total prolongada;
- **SEV-2:** função crítica indisponível ou degradação ampla;
- **SEV-3:** impacto limitado com contorno seguro.

## Dados pessoais

Incidente confirmado com risco ou dano relevante exige avaliação imediata da obrigação de comunicação. A regra inicial do plano considera três dias úteis conforme regulamentação da ANPD, sujeita a validação jurídica vigente. Não espere o relatório final para iniciar essa avaliação.

## Registro

Não coloque dados pessoais, tokens, dumps ou detalhes exploráveis em tickets públicos. Mantenha timeline, decisões, evidências, comunicações e tarefas em repositório restrito.
