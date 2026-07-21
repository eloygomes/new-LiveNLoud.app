---
title: "Referência da API principal"
description: "Mapa inicial dos contratos REST e do estado de autenticação observado."
audience: "referencia"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "tecnico"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["api", "rest", "endpoints", "jwt"]
order: 300
---

## Convenções

Base canônica: `/api/v1`. Use JSON salvo upload multipart de Guitar Pro. Access token segue no cabeçalho `Authorization: Bearer`. Esta página inventaria o código; não declara seguros endpoints atualmente sem JWT.

## Autenticação

| Método | Caminho | Autenticação |
|---|---|---|
| POST | `/auth/signup` | pública, cria conta pendente |
| POST | `/auth/login` | pública |
| GET | `/auth/approve-account` | token de aprovação |
| POST | `/auth/request-password-reset` | pública e limitada |
| POST | `/auth/reset-password` | token de reset |
| POST | `/auth/refresh` | refresh token |
| GET | `/me` | JWT |

## Música e perfil

`/newsong`, `/allsongdata`, `/deleteonesong`, `/alldata/:email`, `/deleteAllUserSongs`, `/deleteUserAccount`, `/updateSetlists` e `/song/updateExact` possuem JWT no estado observado. `/alldata/`, `/updateUsername`, `/lastPlay`, `/downloadUserData/:email`, `/createMusic` e `/song/instrumentNotes` requerem correção de autenticação/autorização.

## Social e calendário

`/users/search`, `/notifications*`, `/logs`, `/invitations*`, `/friends/:email`, `/calendar/events*` e `/setlist-shares*` usam JWT. A autorização deve também validar proprietário, participante e permissão de edição.

## Arquivos e integrações

`/guitarpro/upload|files|file|delete` usa JWT e verifica propriedade. `/youtube/auth/url`, `/youtube/auth/start` e `/youtube/export` usam JWT; o callback OAuth é público por natureza e deve validar estado. Scraping, YouTube e Guitar Pro são **Beta**.

## Saúde e analytics

`/health` é público e não deve revelar configuração. `/analytics/track` usa JWT; `/analytics/track-public` depende de flag e precisa de limitação/validação.

## Próximo passo contratual

Gerar OpenAPI versionada a partir de contratos testados, incluindo schemas, erros, limites e requisitos de autorização. Não gere a especificação apenas inferindo respostas felizes do frontend.
