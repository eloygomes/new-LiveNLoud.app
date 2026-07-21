# DOC-001 — Divergências iniciais a tratar

| ID | Prioridade | Divergência | Critério de encerramento |
|---|---|---|---|
| SEC-001 | Crítica | Rotas sensíveis sem JWT | Contratos protegidos e clientes migrados com testes. |
| OPS-001 | Crítica | Banco de produção diverge entre compose e scripts | Nome confirmado e backup/restore testados em ambiente isolado. |
| REP-001 | Crítica | PII, e-mails, uploads, logs e builds rastreados | Dados removidos/anonimizados e histórico tratado conforme decisão de segurança. |
| MOB-001 | Alta | Mobile contém configuração e resíduos de Socket.IO | API de produção corrigida; Socket.IO removido; fluxo REST validado. |
| REL-001 | Alta | Versões divergentes | Fonte única de versão adotada por todos os componentes. |
| DOC-002 | Alta | Domínio final e autenticação do portal não confirmados | DNS/TLS e mecanismo do proxy registrados no inventário privado. |
| TEST-001 | Alta | Backend e Admin sem cobertura efetiva | Suítes mínimas integradas ao pipeline. |

Este arquivo registra problemas; a documentação pública não deve ocultá-los nem expor detalhes sensíveis.
