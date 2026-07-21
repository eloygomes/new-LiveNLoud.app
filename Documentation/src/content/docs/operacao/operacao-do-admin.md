---
title: "Operação do Admin"
description: "Administre acesso, usuários e ações sensíveis com auditoria e separação."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["admin", "auditoria", "usuarios", "acesso"]
order: 520
---

## Separação

O Admin possui banco de autenticação e secrets próprios. Ele acessa dados do produto por conexão controlada. Não transforme conta comum em admin nem reutilize secrets da API principal.

## Primeiro acesso e bootstrap

Valores de bootstrap são fornecidos apenas pelo inventário de segredos, aplicados na implantação e removidos/rotacionados depois do primeiro acesso. Nunca registre e-mail ou senha de bootstrap neste portal.

## Ações administrativas

Aprovação, rejeição, bloqueio, reativação e remoções exigem identidade administrativa, motivo, confirmação e registro em `adminLogs`. Para exclusão de usuário, siga também o runbook LGPD.

## Falha do painel

Confirme saúde do frontend/servidor, API interna, banco próprio e conexão de leitura/operação com o banco do produto. Não altere redes ou banco alvo por tentativa. Uma falha do Admin não deve derrubar o produto.

## Verificação

Use conta administrativa técnica com menor privilégio possível. Confira login/refresh, papel, auditoria e negação de ações sem permissão. O Admin ainda não possui testes automatizados reais; toda operação crítica requer dupla conferência até a cobertura existir.
