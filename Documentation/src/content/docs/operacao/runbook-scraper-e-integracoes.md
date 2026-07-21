---
title: "Runbook — scraper e integrações Beta"
description: "Isole falhas externas sem comprometer a API ou músicas existentes."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "beta"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["runbook", "scraper", "integracoes", "beta"]
order: 500
---

## Escopo

Cifra Club, Ultimate Guitar, Letras.mus.br, YouTube, Spotify, Guitar Pro/AlphaTab, extensão e Bluetooth/MIDI são **Beta**. Uma falha externa não deve derrubar login, biblioteca ou dados já salvos.

## Scraper indisponível

1. confirme que a API principal continua saudável;
2. verifique estado/recursos do container Python;
3. identifique fonte e padrão de erro sem registrar headers/cookies;
4. teste uma fixture sanitizada, não uma conta real;
5. aplique limite/pausa se a fonte mudou ou bloqueou acesso;
6. recrie somente o scraper quando configuração e dependências estiverem válidas.

## Fonte externa mudou

Desative a fonte afetada ou apresente erro controlado. Preserve cadastro manual e outras fontes. Abra correção com HTML mínimo sanitizado e atualize parser/testes.

## Arquivo ou dispositivo

Falha de Guitar Pro deve preservar arquivo original e restante da apresentação. Bluetooth/MIDI deve cair para controle manual. Não marque o produto inteiro como indisponível por uma integração opcional.

## Encerramento

Registre fonte, período, impacto, taxa de falha, mitigação e versão corrigida. Nunca anexe material musical privado ou tokens de terceiros.
