---
title: "LGPD, retenção e exclusão"
description: "Aplique minimização, prazos, exclusão abrangente e controle de backups."
audience: "operacao"
visibility: "restricted"
status: "review"
featureStatus: "planned"
owner: "seguranca"
validatedAt: "2026-07-16"
validatedCommit: "2cb3f8f"
reviewers: ["produto", "operacao", "tecnico", "seguranca"]
tags: ["lgpd", "retencao", "exclusao", "privacidade"]
order: 470
---

## Status

Esta política inicial precisa de aprovação jurídica e implementação técnica. Não declarar conformidade apenas porque existe uma rota de exclusão.

## Retenção proposta

| Categoria | Prazo inicial | Destino |
|---|---:|---|
| logs operacionais comuns | 30 dias | excluir |
| erros/diagnósticos | 90 dias | excluir ou anonimizar |
| eventos de segurança | 180 dias | excluir ou agregar |
| auditoria administrativa | 365 dias | revisar antes de excluir |
| analytics identificável/pseudonimizado | 90 dias | anonimizar ou excluir |
| métricas realmente anônimas | 24 meses | revisar |
| backups | 7 diários, 4 semanais, 6 mensais | expurgo verificável |

Prazos viram configuração, job, alerta e evidência. Base legal ou obrigação específica pode exigir ajuste aprovado.

## Exclusão de conta

1. reconfirme identidade e intenção;
2. bloqueie novas sessões e revogue tokens;
3. interrompa tratamentos/e-mails desnecessários;
4. exclua autenticação, perfil, músicas, relacionamentos, eventos, notificações e compartilhamentos;
5. remova imagens, Guitar Pro e uploads físicos;
6. anonimize analytics apenas quando efetivo; caso contrário, exclua;
7. registre protocolo mínimo e conclusão;
8. inclua a exclusão na lista a reaplicar após restore;
9. informe conclusão e prazo residual tecnicamente necessário.

## Auditoria

Teste conta, dados, amigos, convites, eventos próprios/participações, logs, analytics, arquivos, sessões, filas offline e efeito de restauração. Guitar Pro e offline são **Beta**, mas os dados tratados continuam sujeitos à política.
