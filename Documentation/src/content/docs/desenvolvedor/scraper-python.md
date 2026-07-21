---
title: "Scraper Python"
description: "Fluxo de importação, fontes compatíveis e regras para execução segura."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "beta"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["scraper", "python", "cifra-club", "ultimate-guitar", "letras", "beta"]
order: 260
---

## Papel no sistema

O serviço Python recebe solicitações da API Node, identifica a fonte, extrai material musical, normaliza conteúdo e pode persistir documentos auxiliares. Há implementações específicas para Cifra Club, Ultimate Guitar e Letras.mus.br.

## Executar

Prefira o Compose do backend, que injeta banco e rede de forma consistente:

```bash
cd Server/sustenido
docker compose up -d --build python_scraper
```

As dependências estão em `Server/sustenido/python/requirements.txt`. Não execute arquivos `_*.py`, `.bak` ou cópias históricas como entrypoint.

## Regras por fonte

O roteamento e normalização devem ficar separados da persistência. Letras.mus.br alimenta principalmente voz/letra. Mudanças de HTML externo precisam de fixture sanitizada e teste por fonte.

## Segurança e resiliência

- aceite somente protocolos e destinos autorizados;
- aplique timeout, tamanho máximo e rate limit;
- não registre headers completos nem cookies;
- normalize entrada antes de persistir;
- trate indisponibilidade externa sem corromper a música existente.

## Estado

Todas as fontes são **Beta**. Dependências de OpenAI/LangChain aparecem em código auxiliar, mas a integração principal de IA não está confirmada como operacional. Não a torne requisito do scraping sem decisão e teste próprios.
