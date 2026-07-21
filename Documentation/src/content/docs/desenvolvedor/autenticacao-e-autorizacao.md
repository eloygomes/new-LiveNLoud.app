---
title: "Autenticação e autorização"
description: "Fluxos de cadastro, tokens, aprovação e regras de propriedade."
audience: "desenvolvedor"
visibility: "public"
status: "review"
featureStatus: "delivered"
owner: "seguranca"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["tecnico", "seguranca", "linguagem"]
tags: ["autenticacao", "jwt", "autorizacao", "senha"]
order: 310
---

## Cadastro e aprovação

O cadastro cria usuário pendente. Um token de aprovação enviado por e-mail permite aprovar ou rejeitar; login só deve funcionar depois da aprovação. Tokens de aprovação e reset são armazenados como hash.

## Senhas e tokens

Senhas usam bcrypt com custo mínimo observado de 12 rounds. Access token tem duração padrão de 24 horas e refresh token, 7 dias. O refresh atual é armazenado diretamente no documento do usuário e permite essencialmente uma sessão corrente; isso deve ser revisto para hash, rotação e múltiplas sessões controladas.

## Autenticação não basta

Após validar JWT, derive a identidade do token e confira propriedade/participação no recurso. Nunca aceite e-mail do corpo ou URL como prova de identidade.

## Admin

Admin usa banco, credenciais e secrets próprios. Contas comuns não devem ganhar papel administrativo por alteração manual em `authUsers`.

## Logout, exclusão e revogação

Logout remove estado do cliente e deve invalidar refresh conforme o modelo adotado. Troca de senha, bloqueio e exclusão precisam revogar sessões. Exclusão deve alcançar dados e arquivos, respeitando retenção legal aprovada.

## Controles obrigatórios

Rate limit por risco, CORS por ambiente, cookies/cabeçalhos seguros quando aplicáveis, mensagens sem enumeração de conta e logs sanitizados. Teste acesso anônimo, token inválido, usuário diferente, papel insuficiente e recurso inexistente.
