---
title: "Ambientes e inventário operacional"
description: "Diferencie desenvolvimento e produção antes de executar qualquer procedimento."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["ambientes", "desenvolvimento", "producao", "inventario"]
order: 400
---

## Ambientes oficiais

| Ambiente | Finalidade | Regra |
|---|---|---|
| desenvolvimento (`live`) | desenvolvimento e validação integrada | nunca tratar como produção ou LIVE MODE |
| produção (#Sustenido) | serviço oficial do produto | somente artefato e configuração aprovados |

Não existe staging confirmado. LIVE MODE é uma função da apresentação e não participa da topologia.

## Inventário privado obrigatório

Mantenha fora do Git: host/usuário SSH, caminhos remotos, portas publicadas, domínios internos, credenciais Mongo/SMTP/OAuth, responsáveis, contatos e localização de backups. O portal pode apontar para esse inventário, mas não deve incorporá-lo.

## Checklist de identificação

Antes de operar, registre:

1. ambiente e finalidade;
2. commit/tag e imagem em execução;
3. domínio público esperado;
4. banco lógico esperado;
5. compose e diretório corretos;
6. responsável e janela aprovada;
7. backup válido e plano de rollback.

## Divergência bloqueante

O Compose de produção usa por padrão o banco `sustenido`, enquanto a configuração histórica dos scripts lista `liveNloud_` e `generalCifras`. Não execute backup, restore ou sincronização até confirmar o banco real e alinhar `MONGO_DATABASES`.
