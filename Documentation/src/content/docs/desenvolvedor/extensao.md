---
title: "Extensão Chrome/Firefox"
description: "Estrutura, ambientes, permissões e manutenção da captura rápida."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "beta"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["produto", "tecnico", "seguranca", "linguagem"]
tags: ["extensao", "manifest-v3", "chrome", "firefox", "beta"]
order: 280
---

## Estrutura

`Chrome Extension/manifest.json` declara a extensão Manifest V3. `popup.js` seleciona ambiente, captura a página e envia dados para a API. O backend distribui o pacote oficial diretamente pelo #Sustenido.

## Ambientes

A extensão conhece produção e desenvolvimento. Produção deve usar `https://api.sustenido.eloygomes.com`; `api.live` é somente desenvolvimento. Não adicione seleção silenciosa baseada em fallback.

## Fontes

Cifra Club, Ultimate Guitar e Letras.mus.br são fontes **Beta**. Separe detecção da página, extração e payload para permitir testes por fixture.

## Permissões

O manifest atual possui escopo amplo, incluindo `<all_urls>`. Reduza host permissions ao conjunto necessário e solicite permissões opcionais quando possível. Remova e-mails administrativos codificados e dados pessoais do pacote.

## Distribuição

Gere o ZIP a partir de fonte revisada, valide manifest e conteúdo e publique pelo fluxo oficial dentro do produto. A documentação pública deve ensinar instalação manual; não presuma loja.

## Teste mínimo

Valide instalação, login/sessão, captura por fonte, ambiente correto, payload sanitizado, erro de rede, atualização e remoção em Chrome e Firefox compatíveis.
