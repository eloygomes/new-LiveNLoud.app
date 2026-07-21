---
title: "Modelo de dados"
description: "Coleções MongoDB, agregados principais e invariantes que o código deve preservar."
audience: "referencia"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["mongodb", "dados", "colecoes", "schema"]
order: 290
---

## Bancos lógicos

Produção usa o banco do #Sustenido; desenvolvimento (`live`) usa `liveNloud_`; `generalCifras` mantém base auxiliar; `adminPanel` isola autenticação e auditoria administrativa. Host, usuário e credencial são inventário operacional restrito.

## Coleções do produto

| Coleção | Responsabilidade |
|---|---|
| `authUsers` | credenciais, aprovação, refresh token, papel e amizades |
| `data` | documento do usuário com músicas e setlists |
| `profileImages` | avatar binário associado à conta |
| `Documents` | documentos/cifras auxiliares de scraping |
| `notifications`, `invitations` | comunicação social |
| `calendarEvents` | eventos, convidados e permissões |
| `setlistShares` | snapshot e resposta de compartilhamentos |
| `userLogs` | atividade do usuário |
| `guitarpro_files` | arquivo Guitar Pro e metadados |
| coleções `analytics_*` | eventos e agregados de produto |

Dados produzidos por scraping e arquivos Guitar Pro pertencem a integrações **Beta**; preserve a origem e trate formatos externos como não confiáveis.

## Agregado música

Uma música possui título, artista, progresso geral, instrumentos, vídeos, Guitar Pro, setlists e estado offline. Cada instrumento mantém atividade, link, progresso, última execução, capo, afinação, notas, cifra, tablatura, acordes, letra e layouts.

## Invariantes

- identidade e propriedade vêm do usuário autenticado, não do e-mail no payload;
- artista+título participam da atualização exata e consolidação de duplicatas;
- Guitar Pro pertence à música;
- setlists referenciam/agrupam músicas do usuário;
- exclusão de conta precisa alcançar coleções e arquivos físicos associados.

## Evolução

MongoDB é schemaless e contém formatos legados. Antes de mudar estrutura, documente versão, leitura compatível, migração, rollback e amostras anonimizadas. Não use dumps reais como fixture.
