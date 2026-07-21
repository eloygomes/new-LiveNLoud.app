---
title: "Backup externo"
description: "Implante cópias criptografadas fora do VPS e com restauração comprovada."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "planned"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["backup", "offsite", "retencao", "criptografia"]
order: 430
---

## Estado atual

Os scripts criam dumps no VPS e cópias locais. Isso não é backup off-site automatizado e não protege adequadamente contra perda do servidor, ransomware ou falha do operador.

## Implementação mínima

1. confirme os bancos e uploads indispensáveis;
2. gere dump consistente;
3. calcule hash e registre tamanho/duração;
4. criptografe antes da transmissão com chave fora da produção;
5. envie para outro provedor, conta ou região;
6. aplique retenção automática de 7 diários, 4 semanais e 6 mensais;
7. restrinja credenciais para impedir exclusão ampla do histórico;
8. alerte falha, ausência ou variação anormal de tamanho.

## Conteúdo

Inclua banco confirmado do produto, base auxiliar necessária, uploads Guitar Pro e imagens/arquivos indispensáveis. Mail data e demais serviços precisam de plano separado e base legal definida. Guitar Pro é integração **Beta**, mas seus arquivos continuam sendo dados do usuário.

## Verificação

Um job bem-sucedido não prova recuperação. Restaure mensalmente em ambiente isolado, valide coleções/arquivos e execute exercício completo trimestral. Registre evidência sem copiar dados pessoais para tickets.

## Segurança

Chaves não ficam no arquivo, servidor ou conta que armazenam o backup. Acesso é auditado; downloads temporários são eliminados; expurgo segue retenção e lista de exclusões LGPD.
