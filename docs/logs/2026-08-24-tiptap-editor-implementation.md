# Tiptap editor implementation — 2026-08-24

## Resumo

A Presentation passou a usar um editor headless Tiptap com documento estruturado, blocos próprios e persistência de JSON ao lado do contrato legado `songCifra`. A versão refinada mantém a leitura como um documento normal, ativa a edição pelo botão Edit, mostra os colchetes somente durante a edição e só consolida qualquer alteração quando o usuário aciona Save.

Foram preservados os contratos `presentationLayouts.default` e `presentationLayouts.expanded`, apresentados na interface como Vertical View e Horizontal View. A escolha automática responde à proporção da tela e os rascunhos de ambos os layouts sobrevivem à troca de orientação.

## Arquitetura

### Model

- `ChordParser` centraliza o reconhecimento musical e evita regex dispersa.
- `CifraDocumentModel` converte cifras antigas em JSON Tiptap, migra documentos com o antigo node atômico de acorde, serializa o documento estruturado e produz o texto compatível sem colchetes.
- `presentationLayoutHelpers` mantém a conversão entre os nomes de interface e as chaves legadas do banco.
- `cifraPersistence` monta o payload de Save e persiste rascunhos alterados dos dois layouts em uma única operação.

### View

- `PresentationTiptapEditor` hospeda o `EditorContent` sem controlar regras de negócio.
- `PresentationInlineEditToolbar` oferece duas fileiras simétricas de dez controles dentro da barra Presentation.
- `PresentationTopBar` troca todos os controles normais pela barra de edição; Save é o último item da primeira fileira e Discard o último da segunda.
- A superfície Tiptap exibe acordes sem colchetes no modo normal e revela `[`, espaços internos e `]` no modo de edição.

### Controller

- `PresentationEditorController` é a única fachada usada pela interface para comandos, estado, serialização, transposição, edição e navegação estrutural.
- O hook `usePresentationCifraEditor` controla snapshots, rascunhos por layout, Save e Discard.
- A navegação de músicas por botões e teclado usa `goToSetlistSong`, evitando lógica duplicada.

### Componentes e extensions

- Componentes criados: `PresentationTiptapEditor`, `ToolBoxFormattingControls` e `PresentationInlineEditToolbar`.
- Extensions próprias: `PresentationDocument`, `SongBlock`, `ChordMark`, `ChordBracket`, `ChordRecognition`, `FontSize`, `TextColor` e `Underline`; atalhos estruturais ficam no controller para preceder os keymaps do StarterKit.
- Não foi criado service paralelo; a implementação integra os controllers, helpers de layout, armazenamento local e API já existentes.

## Arquivos alterados

- `.gitignore` → ignora artefatos locais de teste/execução.
- `Front/package.json` e `Front/package-lock.json` → dependências Tiptap.
- `Front/src/Pages/Presentation/Presentation.jsx` → integração do editor, barra inline, tooltip e ciclo Save/Discard.
- `Front/src/Pages/Presentation/components/PresentationTopBar.jsx` → troca condicional dos controles normais pela barra de edição.
- `Front/src/Pages/Presentation/components/PresentationInlineEditToolbar.jsx` → nova barra simétrica em duas fileiras.
- `Front/src/Pages/Presentation/components/PresentationHorizontalNav.jsx` → navegação estrutural compartilhada.
- `Front/src/Pages/Presentation/ToolBox.jsx`, `TollBoxAcoord.jsx` e testes → integração inicial dos comandos Tiptap e fechamento sem descarte implícito; o fluxo principal de Edit agora é inline.
- `Front/src/Pages/Presentation/editor/model/ChordParser.js` → parser central de acordes.
- `Front/src/Pages/Presentation/editor/model/CifraDocumentModel.js` e teste → conversão, migração e serialização.
- `Front/src/Pages/Presentation/editor/extensions/PresentationEditorExtensions.js` → schema, marks, reconhecimento e atalhos.
- `Front/src/Pages/Presentation/editor/controller/PresentationEditorController.js` e teste → comandos e navegação.
- `Front/src/Pages/Presentation/editor/view/PresentationTiptapEditor.jsx` e teste → lifecycle do editor.
- `Front/src/Pages/Presentation/editor/view/ToolBoxFormattingControls.jsx` → controles de formatação reutilizáveis.
- `Front/src/Pages/Presentation/hooks/usePresentationCifraEditor.js` e teste → rascunhos e persistência explícita.
- `Front/src/Pages/Presentation/hooks/usePresentationChordTooltip.js` e teste → hover e clique/touch.
- `Front/src/Pages/Presentation/hooks/usePresentationLayoutStorageSync.js` e teste → layout automático e bloqueio de persistência durante edição.
- `Front/src/Pages/Presentation/hooks/usePresentationNavigation.js` e teste → Ctrl + setas.
- `Front/src/Pages/Presentation/hooks/usePresentationSongData.js` e teste → leitura do JSON Tiptap com fallback legado.
- `Front/src/Pages/Presentation/helpers/cifraPersistence.js` e teste → payload com documentos e múltiplos layouts.
- `Front/src/Pages/Presentation/presentationLayoutHelpers.js` e teste → documentos por variante e rótulos novos.
- `Front/src/Pages/Presentation/components/PresentationComponents.test.jsx` → contrato da barra normal e da barra inline.
- `Front/src/index.css` → layout do editor, estados de edição, acordes, colchetes e toolbar.

## Tiptap

O controller inicializa `Editor` com `StarterKit` reduzido, documento `doc` customizado e `songBlock+` como estrutura raiz. A View cria uma instância por música/layout e a destrói no unmount.

O formato persistido é `{ version, document }`, dentro de `presentationLayouts.<variant>.tiptapDocument`. `songCifra` continua existindo como camada de compatibilidade. Documentos antigos que usavam um node atômico `chord` são migrados na leitura para texto com marks.

## Layouts e responsividade

- `default` → Vertical View → blocos/linhas.
- `expanded` → Horizontal View → blocos/colunas.

As chaves antigas permanecem no payload para compatibilidade. Sem preferência manual, `innerHeight > innerWidth` seleciona Vertical View; nos demais casos usa Horizontal View. Resize e orientation change reaplicam a regra. Durante edição, cada variante mantém seu próprio documento de rascunho para que uma mudança automática não destrua conteúdo.

## Atalhos

- `Shift + Enter` remove o slice à direita da seleção/cursor, preserva marks/nodes e o insere no início do próximo bloco; cria um bloco quando necessário.
- `Shift + Backspace` executa a operação inversa, inserindo o slice no final do bloco anterior.
- Horizontal View: esquerda/direita atravessam blocos apenas quando o cursor alcança o limite; dentro do texto mantêm o comportamento nativo.
- Vertical View: cima/baixo atravessam blocos nos limites e mantêm a navegação normal dentro do texto.
- `Ctrl + esquerda/direita` e `Shift + esquerda/direita` chamam a mesma função dos botões anterior/próxima música.
- `Tab` insere um caractere de tabulação no documento e não transfere o foco para outro controle.

## Acordes

`[C]`, `[Am]`, `[F#m7]`, `[Bb7]`, `[G/B]` e `[C#sus4]` são reconhecidos pelo parser. O conteúdo permanece texto real: existem posições de cursor antes/depois de `[`, de cada caractere do acorde e de `]`, como em Word/Docs.

O acorde recebe `ChordMark` dourado; colchetes e espaços internos recebem `ChordBracket`. Durante edição, todos os caracteres aparecem e são navegáveis. Fora da edição, `ChordBracket` fica oculto e o texto de compatibilidade salvo remove esses caracteres, normalizando `[G]` e `[ G ]` para `G`. Hover no desktop e clique no touch abrem o popover existente. A transposição altera somente a representação visual, sem corromper o texto ProseMirror.

## Controles de edição

Primeira fileira: Bold, Italic, Underline, Strike, Undo, Redo, Clear formatting, Text color, Progression markers e Save.

Segunda fileira: Align left, Align center, Align right, Heading, Selection font size, diminuir/aumentar fonte global, diminuir/aumentar espaçamento de blocos e Discard.

Quando a edição está ativa, Transpose, Notes, Instruments, Video, Scrolling, View, Settings, Guitar Pro, Live e navegação de músicas não são renderizados. A altura-base da Presentation é mantida; em telas estreitas a barra permite overflow horizontal.

## Persistência

- Digitação e comandos Tiptap atualizam apenas `draftCifra`, `draftTiptapDocument` e o mapa de rascunhos em memória.
- O sync automático de `localStorage` é suspenso enquanto `isEditing` for verdadeiro.
- Save serializa conteúdo sem colchetes, JSON Tiptap, distribuição de blocos, font size, espaçamento e configurações de ambos os layouts; chama `updateSongEntry`, atualiza o estado confirmado e grava o cache existente.
- Discard restaura os snapshots originais e não chama a API.
- Ao carregar, o JSON Tiptap tem prioridade; na ausência dele, `songCifra` é convertido para o documento estruturado.

## Compatibilidade

Cifras antigas continuam entrando pelo parser legado. `default`/`expanded`, `songCifra`, cache offline e o payload da API não foram renomeados silenciosamente. O JSON estruturado é adicional. A migração suporta os documentos gerados pela primeira versão do editor com nodes de acorde atômicos.

## Problemas encontrados

- O node atômico de acorde impedia posicionar o cursor entre `[`, acorde e `]`; ele foi substituído por marks sobre texto.
- O callback de update escrevia imediatamente em `songDataFetched`, que podia acionar persistência local antes de Save; updates agora ficam isolados no rascunho.
- A transposição anterior alterava `textContent` dentro do DOM do ProseMirror; isso violava a fonte de verdade e foi substituído por atributos de apresentação/CSS.
- O lint do projeto não pôde ser executado: `.eslintrc.cjs` contém a propriedade de topo inválida `REMOVED_MONGO_USER`, erro anterior e fora do escopo desta implementação.
- A validação visual pelo navegador integrado foi tentada com o servidor Vite ativo, mas o ambiente informou `No browser is available`.

## O que funcionou

- Build Vite de produção concluído.
- 88 arquivos de teste e 352 testes passaram, incluindo persistência mult-layout, bloqueio de storage durante edição, navegação de acordes por linha e rolagem real dos blocos Tiptap.
- Acordes digitados, marks, cursor em todas as fronteiras de `[G]`, serialização sem colchetes e migração foram cobertos.
- Shift + Enter, Shift + Backspace, Enter normal, navegação estrutural, Ctrl + setas, toolbar, Save/Discard, lifecycle, layout automático, transposição e offline helpers foram cobertos por testes.

## O que não funcionou

- Não houve sessão de navegador integrada disponível para inspeção visual manual. A validação visual ficou limitada ao build, CSS/DOM e testes de componentes.
- O lint global permanece bloqueado pela configuração inválida descrita acima.

## Decisões técnicas

- Marks foram escolhidos para acordes porque preservam edição caractere a caractere; nodes atômicos não atendem a navegação solicitada.
- Os colchetes permanecem no JSON, mas como mark ocultável. Isso permite reabrir o editor com a sintaxe completa sem mostrá-la na leitura.
- A API só recebe alterações em Save. O cache segue a arquitetura existente e não ganhou um sistema paralelo.
- A toolbar usa a fachada do controller, mantendo chamadas Tiptap fora dos componentes de alto nível.

## Próximos passos

- Corrigir a configuração ESLint e recolocar lint no gate obrigatório.
- Executar a lista manual completa em um navegador autenticado quando a sessão integrada estiver disponível.
- Evoluir o parser para gramática ChordPro e equivalências enarmônicas mais avançadas.
- Adicionar versionamento/migração de schema quando o documento Tiptap ganhar novos nodes estruturais.

## Refinamento de atalhos e ícones

- Os botões da barra inline agora usam diretamente `neuphormism-b-btn` e `neuphormism-b-btn-gold`, com a mesma proporção visual de ícones da Presentation.
- Os eventos Tab, Shift + Enter, Shift + Backspace e setas estruturais são interceptados antes dos keymaps do StarterKit. Isso impede que o HardBreak padrão consuma Shift + Enter.
- Em Horizontal View, esquerda/direita só atravessam blocos nos limites; dentro de acordes, direita desce uma linha. Os botões `.presentation-horizontal-nav-buttons` controlam diretamente o deslocamento visível das colunas.
- Em Vertical View, esquerda/direita continuam sendo navegação textual normal; cima/baixo navegam entre blocos/linhas.
- Shift + esquerda/direita foi adicionado para músicas anterior/próxima, mantendo também o atalho Control solicitado anteriormente.
- A seta direita, quando o cursor toca um acorde, procura o próximo `hardBreak` e posiciona o cursor no início da linha seguinte do mesmo bloco; somente os limites reais do bloco atravessam colunas pelo teclado.
- Os botões inline permanecem em `2.75rem`, com gaps de `0.75rem`, e os ícones internos foram refinados para `1rem`, preservando o tamanho dos controles anteriores com conteúdo visual mais leve.
- A toolbar ganhou respiro interno para conter integralmente os raios e as sombras das duas fileiras. O overflow fica visível em desktop e limitado ao eixo horizontal apenas no mobile, sem cortar a base dos botões.
- A navegação flutuante agora reconhece `.presentation-editor-block`, calcula o deslocamento relativo ao primeiro bloco e move o viewport antes de qualquer alteração de seleção. Assim, o segundo bloco ocupa exatamente o alinhamento esquerdo original do primeiro.

## Compatibilidade com tablaturas e cifras legadas

- Blocos com duas ou mais linhas de tablatura são detectados automaticamente e recebem fonte monoespaçada, ligaduras desativadas, `white-space: pre` e rolagem horizontal. Espaços, números, barras e traços mantêm suas colunas originais sem quebra interna.
- Linhas compostas majoritariamente por acordes são reconhecidas mesmo sem colchetes. Separadores de compasso e indicadores de repetição não prejudicam a detecção, enquanto frases como `A strange illusion` continuam sendo tratadas como letra.
- Na conversão de músicas legadas, acordes como `E5   C5  D/F#` recebem colchetes e marks apenas no documento editável. A serialização de compatibilidade continua salvando `E5   C5  D/F#`, sem colchetes e sem alterar os espaços.
- Documentos Tiptap já persistidos também passam pela normalização automática, preservando marks de formatação existentes e adicionando a classificação de tablatura quando necessário.
- A suíte completa passou com 88 arquivos e 358 testes; o build Vite de produção também foi concluído.

## Remoção de payloads da página de origem

- O scraper do Cifra Club deixou de percorrer conteúdo de `script`, `style`, `noscript` e `template` dentro de `.cifra_cnt`. Isso impede que payloads React/JSON-LD sejam confundidos com cifra.
- Uma sanitização adicional reconhece assinaturas como `self.__next_f.push`, `$L14`, `dangerouslySetInnerHTML`, `application/ld+json` e `schema.org`, truncando somente o payload incorporado e preservando a música anterior.
- A camada de armazenamento Python aplica a mesma defesa a cifra, tabs, acordes e letra antes de gravar no Mongo.
- O frontend sanitiza cifras e documentos Tiptap já contaminados ao carregar. Nenhuma escrita automática foi adicionada: a limpeza definitiva de uma música existente ocorre no próximo Save explícito ou ao importar novamente o link.
- A validação passou com 10 testes Python, 89 arquivos/362 testes do frontend e build Vite de produção.

## Correção específica da tablatura de baixo em quatro cordas

- Tablaturas sem pipe inicial, no formato `G-----`, `D-----`, `A-----`, `E-----`, são reconhecidas sem transformar os nomes das cordas em acordes.
- A continuação `G–D–A–E` que tenha sido persistida em outra coluna é reunida ao grupo anterior quando ele termina em uma linha de técnica `(T)/(P)`.
- A regra é restrita a grupos de quatro cordas: tablaturas de seis cordas não são reunidas nem redistribuídas.
- A regra visual que anulava acordes dentro de um bloco classificado como tablatura foi removida. Acordes de apoio como `C5`, posicionados acima da pauta, mantêm o dourado; somente as linhas das cordas são excluídas do reconhecimento.
- A suíte completa passou com 89 arquivos/367 testes do frontend, 11 testes Python e build Vite de produção.

## Separação ao transferir blocos e encaixe automático de tabs

- Shift+Enter e Shift+Backspace inserem exatamente uma linha vazia entre o conteúdo transferido e o conteúdo que já existia na coluna de destino. Quebras já existentes são contabilizadas para evitar espaços duplicados.
- O Enter comum continua inserindo apenas uma nova linha dentro do bloco atual.
- Cada linha de tablatura recebe um mark próprio, permitindo medir e reduzir somente a pauta; acordes, títulos e letras no mesmo bloco preservam o tamanho configurado pelo usuário.
- A escala é recalculada após edição e redimensionamento. Tabs que já cabem permanecem em 100%; tabs largas usam a proporção necessária entre a largura natural da maior linha e a largura interna da coluna.
- A largura natural passou a ser medida em um elemento invisível sem o recorte/overflow da coluna. Quando o encaixe está ativo, a escala também prevalece sobre marks internos de tamanho, mas continua restrita aos spans das linhas de tablatura.
- A suíte completa passou com 90 arquivos/370 testes do frontend e o build Vite de produção foi concluído.

## Navegação do caret após o encaixe das tabs

- As linhas de tablatura voltaram ao fluxo inline do `contenteditable`; a medição de largura continua sendo feita pela cópia invisível, sem transformar o texto editável em `inline-block`.
- Esquerda, direita, cima e baixo permanecem sob o comportamento nativo enquanto o cursor está dentro do conteúdo. A navegação estrutural horizontal continua somente nas extremidades esquerda/direita, e a vertical somente no início/fim do bloco.
- Shift+setas, Shift+Enter, Shift+Backspace, Tab e o comportamento especial de acordes foram preservados.
- A suíte completa passou com 90 arquivos/372 testes do frontend e o build Vite de produção foi concluído.

## Limites e paginação no Horizontal View

- A superfície Tiptap usa exatamente a altura útil do painel entre o cabeçalho da apresentação e a base da viewport; o espaço inferior duplicado de `6rem` foi removido.
- O painel horizontal voltou a bloquear rolagem vertical. Um bloco que ultrapassa o limite inferior continua automaticamente em uma nova coluna CSS à direita, em vez de aumentar a página ou esconder texto.
- Cada `songBlock` estrutural começa em uma nova coluna, enquanto blocos longos podem ocupar quantas colunas de continuação forem necessárias sem alterar o documento persistido.
- Os botões de navegação horizontal passaram a avançar pela largura de uma coluna visual, incluindo continuações geradas pela paginação.
- Tabs continuam com encaixe automático de largura e sem scroll vertical interno. As regras permanecem restritas ao Horizontal View e não alteram o Vertical View nem o Live.
- A suíte completa passou com 90 arquivos/373 testes do frontend e o build Vite de produção foi concluído.
