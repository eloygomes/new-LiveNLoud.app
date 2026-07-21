---
title: "Segurança e privacidade para desenvolvimento"
description: "Regras mínimas para código, dados, endpoints, logs e revisão do #Sustenido."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "seguranca"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["seguranca", "privacidade", "lgpd", "secrets"]
order: 340
---

## Princípios

Menor privilégio, autorização no servidor, minimização de dados, secrets fora do Git, logs sanitizados e exclusão verificável. O frontend e a extensão nunca são fronteira de segurança.

## Riscos abertos

- endpoints sensíveis sem JWT/propriedade;
- upload de perfil e exportação identificados por e-mail fornecido pelo cliente;
- scraper registrando headers completos;
- extensão com permissões amplas e dado administrativo codificado;
- dados de mail server, uploads, logs e builds rastreados;
- refresh token único armazenado diretamente;
- contratos legados que podem permitir bypass.

Esses itens estão registrados como defeitos. Não os reproduza em novos endpoints.

Scraping, extensão, OAuth, Guitar Pro/AlphaTab, offline e Bluetooth/MIDI são **Beta**; trate toda entrada externa como não confiável e limite seu impacto.

## Secrets e configuração

Use `.env.example` apenas com nomes e valores fictícios. Secrets diferentes por ambiente e por serviço; rotacione após exposição. Variáveis `VITE_*` e conteúdo enviado ao navegador são públicos.

## Dados pessoais

Não use dados reais em testes, screenshots ou fixtures. Exportação, perfil, eventos, amizades, analytics e arquivos musicais exigem controle de propriedade. Exclusão de conta precisa revogar tokens, remover coleções e arquivos e tratar restauração de backups.

## Revisão de endpoint

Para cada rota, registre autenticação, autorização, validação, rate limit, tamanho, erros, logging e retenção. Teste acesso horizontal (outro usuário) e vertical (papel insuficiente).

## Incidentes

Não publique detalhes de incidente no portal público. Preserve evidência, contenha exposição, acione responsáveis e siga o procedimento restrito. Prazos e comunicação LGPD dependem da avaliação do incidente e revisão jurídica vigente.
