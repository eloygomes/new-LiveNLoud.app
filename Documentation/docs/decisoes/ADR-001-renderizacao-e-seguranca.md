# ADR-001 — Astro SSR e separação de conteúdo operacional

- Estado: aceito para o ponto de controle arquitetural
- Data: 2026-07-16
- Commit validado: `2cb3f8f`

## Decisão

Executar o portal com Astro em modo servidor e adapter Node standalone. Usar `ClientRouter` no layout compartilhado. Aplicar autorização no middleware para `/interno` e `/operacao`, aceitando autenticação do proxy ou Basic Auth configurada apenas no ambiente.

## Consequências

Rotas protegidas não dependem de itens ocultos no menu. Segredos nunca entram no conteúdo. O mesmo container suporta páginas públicas e protegidas; uma publicação pública estática futura deverá excluir fisicamente conteúdo restrito.
