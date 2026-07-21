---
title: "Verificação de disponibilidade"
description: "Procedimento operacional mínimo e seguro para validar o portal de documentação."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "delivered"
owner: "operacao"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["operacao", "tecnico", "seguranca"]
tags: ["operacao", "healthcheck", "runbook"]
order: 10
---

## Pré-requisitos

- acesso autorizado ao ambiente;
- endereço do portal fornecido pelo inventário operacional externo ao Git;
- nenhuma credencial registrada em terminal compartilhado ou ticket público.

## Procedimento

1. Acesse `/health` e confirme resposta HTTP 200 com estado `ok`.
2. Abra a página inicial e uma página pública por URL direta.
3. Acesse uma rota sob `/operacao` sem autenticação e confirme HTTP 401.
4. Autentique-se pelo mecanismo aprovado da VPS e repita o acesso.
5. Registre horário, ambiente, resultado e versão da imagem, sem copiar tokens ou cabeçalhos sensíveis.

## Resultado esperado

O healthcheck e o conteúdo público respondem; rotas operacionais negam acesso anônimo e ficam disponíveis apenas após autenticação.

## Escalonamento

Se o healthcheck falhar, preserve evidências não sensíveis e siga o runbook de indisponibilidade da documentação. Não reinicie componentes do produto principal como resposta automática a uma falha isolada do portal.
