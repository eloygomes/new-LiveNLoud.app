---
title: "Runbook — SMTP e OAuth"
description: "Recupere aprovação por e-mail e autorizações externas sem expor credenciais."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "beta"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["runbook", "smtp", "oauth", "youtube", "spotify", "beta"]
order: 510
---

## SMTP e aprovação

Cadastro depende de aprovação por e-mail, portanto SMTP é infraestrutura crítica. Verifique conectividade, certificado/TLS, remetente, fila e rejeições sem imprimir senha ou conteúdo completo. Use destinatário técnico controlado em testes.

Se o envio falhar, preserve a conta pendente e não aprove em massa por contorno. Corrija configuração, reenvie de forma idempotente e confirme expiração/uso único do token.

## Recuperação de senha

Tokens devem ser hash, temporários e invalidados após uso. Não solicite que usuário encaminhe o link. Em suspeita de exposição, revogue tokens pendentes e rotacione credenciais do serviço quando aplicável.

## YouTube e Spotify

OAuth é **Beta**. Verifique redirect URI exata, client ID do ambiente, segredo apenas no servidor quando exigido, parâmetro `state`, escopos e resposta do provedor. Não registre authorization code, access token ou refresh token.

## Contenção

Desative temporariamente a exportação afetada sem bloquear biblioteca/setlists. Preserve autorização existente somente conforme política; informe falha controlada ao usuário.

## Encerramento

Valide cadastro/aprovação com conta técnica e exportação com conta externa de teste de baixo privilégio. Registre resultado, não credenciais.
