+# Scraper v2: arquitetura e rollback

## AS-IS

`POST /scrape` em `scrapper.py` valida o payload, chama
`scraping_service.get_song_data`, persiste no Mongo e responde `201` com
`{message, songData}`. O Node (`POST /api/v1/scrape`) é o proxy usado por
Front e Mobile. Cifra Club usa requests + BeautifulSoup. Ultimate Guitar tenta
store HTML, API própria e Selenium. Letras.mus tem serviço independente. Erros
de aquisição/parsing são historicamente expostos como `500`.

## TO-BE

Com `SCRAPER_ARCHITECTURE=v2`, Cifra Club e Ultimate Guitar seguem:

`Controller -> ImportService -> ProviderResolver -> FetchManager -> Fetcher -> Provider validator/parser -> SongImportData`.

O formato legado só é produzido na borda, portanto persistência, Node, Front e
Mobile não mudam. Letras.mus permanece no fluxo legado. A estratégia inicial
dos dois providers é Current, Camoufox, Hero. HTTP 404 é terminal; 403, timeout,
challenge, erro técnico e página 200 inválida permitem fallback. Hero recebe a
URL por JSON em stdin, devolve JSON em stdout e tem limite padrão de dois
processos.

Configurações: `SCRAPER_CURRENT_TIMEOUT_SECONDS` (30),
`SCRAPER_CAMOUFOX_TIMEOUT_SECONDS` (45), `SCRAPER_HERO_TIMEOUT_SECONDS` (45),
`SCRAPER_HERO_MAX_CONCURRENCY` (2), `SCRAPER_HERO_SCRIPT` e
`SCRAPER_NODE_BINARY`.

## Feature flag e rollback

- `SCRAPER_ARCHITECTURE=v2` (padrão): ativa o novo pipeline para Cifra Club e UG.
- `SCRAPER_ARCHITECTURE=legacy`: rollback explícito para o código anterior.
- Alterações exigem restart/recreate do container Python.
- Rollback: definir `legacy` e recriar apenas `python_scraper`; não requer
  reversão de código ou migração de banco.

## Riscos e dependências

Mudanças de DOM upstream podem invalidar validators/parsers. Camoufox e Hero
elevam tempo/memória somente após falha do fetch barato. A imagem instala as
dependências no build e expõe `/health`; não existe browser pool. Não há
alteração de schema. Logs registram provider, engine, status, duração e código
do erro, nunca HTML ou conteúdo musical.

O runtime do Hero usa uma versão exata em `package.json`. O Dockerfile não
depende da presença do lockfile no pacote de deploy; quando ele estiver
disponível no repositório, deve continuar sendo atualizado para auditoria.

## Integração com a extensão

A extensão 0.66 envia conteúdo autoritativo junto da URL quando ele pertence à
aba ativa. Ultimate Guitar usa `ultimate_guitar_wiki_tab`; Cifra Club usa
`cifraclub_html`, contendo somente o subtree musical e metadados públicos. Os
dois formatos têm limite de 2 MB no proxy Node e são aceitos apenas pelo
provider correspondente. Nesse caminho o log do parser mostra
`engine=provided_content` e browsers não são iniciados. Sem conteúdo fornecido,
o fallback normal de fetchers continua ativo.
