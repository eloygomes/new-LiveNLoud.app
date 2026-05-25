# Análise da página Presentation (UI web)

- **Escopo:** somente a interface web em [Front/src/Pages/Presentation](Front/src/Pages/Presentation) e componentes diretamente relacionados na pasta Front.
- **Ignorado:** código móvel em [Mobile](Mobile) e qualquer lógica específica dessa pasta.
- **Data e hora de conclusão da análise:** 2026-05-25 09:07:47 -03

## 1. Objetivo funcional da página

A página Presentation é a camada de exibição “live” da aplicação web. Ela tem dois modos principais:

1. **Modo normal (desktop/touch fora de live):** exibe o cabeçalho da música, controles de navegação, toolbox com opções e o conteúdo renderizado da canção.
2. **Modo LIVE:** entra em tela cheia, esconde a toolbox e coloca o conteúdo em um layout preto com tipografia grande e foco no viewport de leitura.

A página foi construída para permitir que um músico ou apresentador leia a música em tempo real, alternando entre instrumentos, ocultando acordes, editando a cifra e controlando a rolagem automática.

## 2. Arquitetura e principais arquivos

### Arquivo principal

- [Front/src/Pages/Presentation/Presentation.jsx](Front/src/Pages/Presentation/Presentation.jsx)

Esse é o componente controlador da página. Ele coordena:

- carregamento da música,
- seleção de instrumento,
- estado do modo live,
- renderização do conteúdo,
- edição de cifra,
- notas por instrumento,
- exibição do tooltip de acordes,
- abertura do visualizador de Guitar Pro.

### Parsing e renderização do conteúdo

- [Front/src/Pages/Presentation/processSongCifra.jsx](Front/src/Pages/Presentation/processSongCifra.jsx)

Responsável por transformar a string da cifra em HTML renderizável.

### Controle de rolagem

- [Front/src/Pages/Presentation/presentationScrollController.js](Front/src/Pages/Presentation/presentationScrollController.js)
- [Front/src/Pages/Presentation/ScrollControlPanel.jsx](Front/src/Pages/Presentation/ScrollControlPanel.jsx)

Gerenciam o estado global da rolagem automática e dos atalhos de teclado.

### Tooltip e variações de acordes

- [Front/src/Pages/Presentation/PresentationChordTooltip.jsx](Front/src/Pages/Presentation/PresentationChordTooltip.jsx)

Renderiza o diagnóstico visual do acorde e permite trocar a posição/variação.

### Toolbox e interações auxiliares

- [Front/src/Pages/Presentation/ToolBox.jsx](Front/src/Pages/Presentation/ToolBox.jsx)
- [Front/src/Pages/Presentation/TollBoxAcoord.jsx](Front/src/Pages/Presentation/TollBoxAcoord.jsx)

Contêm os painéis de instrument selection, highlight, videos, editor, notas e tools.

### Estilos da página

- [Front/src/index.css](Front/src/index.css)

Define classes específicas para apresentação, modo live, mobile e tooltip de acordes.

## 3. Fluxo da página do início ao fim

### 3.1 Entrada na rota

A rota da página é definida em [Front/src/main.jsx](Front/src/main.jsx). O caminho esperado é:

- /presentation/:artist/:song/:instrument

Quando a página abre, o componente principal:

1. bloqueia a rolagem do body e html com `overflow: hidden`;
2. lê os parâmetros da URL (`artist`, `song`, `instrument`);
3. define o estado inicial da música e do instrumento selecionado;
4. salva `artist` e `song` no `localStorage`.

### 3.2 Carregamento dos dados da música

A busca ocorre em [Front/src/Pages/Presentation/Presentation.jsx](Front/src/Pages/Presentation/Presentation.jsx) via `allDataFromOneSong`.

Esse método, em [Front/src/Tools/Controllers.jsx](Front/src/Tools/Controllers.jsx), faz um `POST` para `/api/allsongdata` e, em caso de falha, tenta usar o cache offline da música.

A resposta esperada é um objeto com, pelo menos:

- `instruments`
- `guitar01`, `guitar02`, `bass`, `keys`, `drums`, `voice`
- `embedVideos`
- `guitarProFiles`
- `notes`
- campos de conteúdo como `songCifra`, `songLyrics`, `songChords`, `songTabs`

### 3.3 Normalização do instrumento

A página normaliza o instrumento solicitado:

- `keyboard` → `keys`
- qualquer outro valor é validado contra a lista suportada.

Se o instrumento solicitado não estiver disponível, a página escolhe o primeiro instrumento válido e redireciona a URL para esse instrumento.

### 3.4 Seleção de conteúdo

Depois do fetch, o componente:

1. guarda os dados completos em `songDataFetched`;
2. preenche os estados de conteúdo (`songCifraData`, `songLyrics`, `songChords`, `songTabs`);
3. decide o instrumento ativo.

O conteúdo exibido é controlado por `selectContenttoShow`, que suporta:

- `default` / `full` → mostra o conteúdo principal da cifra;
- `tabs` → mostra somente `songTabs`;
- `chords` → atualmente retorna `songLyrics` (isso parece inconsistente e deve ser revisado);
- `lyrics` → mostra `songLyrics`.

### 3.5 Renderização da cifra

A string de conteúdo selecionada é enviada para o parser em [processSongCifra.jsx](Front/src/Pages/Presentation/processSongCifra.jsx).

Esse parser converte a cifra em blocos HTML estruturados e aplica classes para:

- `presentation-lyrics`
- `presentation-chords`
- `presentation-chord-lyrics`
- `presentation-tom`
- `tab`
- `verse`, `chorus`, `intro`, `solo`, `bridge`, `section`

Também identifica:

- linhas com tabulatura,
- linhas com tom,
- linhas com acordes,
- seções como `[Intro]`, `[Refrão]`, etc.

Cada acorde encontrado recebe um span com classe `notespresentation` e metadados `data-chord` e `data-chord-id`.

## 4. Comportamento da UI em diferentes cenários

### 4.1 Modo desktop

No desktop o fluxo é:

1. cabeçalho com título/artist;
2. botões de navegação entre músicas da setlist;
3. botões de ação: options, edit, guitar pro, live;
4. área principal de conteúdo rolável;
5. toolbox flutuante opcional.

### 4.2 Modo touch

No touch, a UI adapta-se para uma navegação por painéis:

- botão de gear abre o toolbox em um bottom sheet;
- botões de tamanho de fonte ajustam a escala do texto;
- opções de vídeo, instrument selection, highlight, tools e scrolling ficam em seções;
- o modo live usa fallback pseudo-live quando o fullscreen não é disponível.

### 4.3 Modo LIVE

Ao clicar em LIVE:

1. o componente tenta abrir fullscreen no elemento raiz;
2. se tiver sucesso, ativa `isLiveMode` e foca no viewport;
3. se falhar em touch, ativa `isPseudoLiveMode`.

No modo LIVE:

- a toolbox some;
- o conteúdo ocupa a tela inteira;
- o texto fica em preto/branco sobre fundo preto;
- o viewport recebe foco para capturar teclado;
- os atalhos de rolagem ficam ativos.

## 5. Interações do usuário

### 5.1 Hover sobre acordes

Quando o usuário move o mouse sobre um acorde renderizado, o componente:

1. identifica o elemento `data-chord` mais próximo;
2. usa `findChordTooltipData` para localizar variações do acorde;
3. calcula a posição do tooltip com base no `getBoundingClientRect()`;
4. renderiza um tooltip compacto com diagrama do acorde;
5. permite expandir para trocar a variação e aplicar globalmente para todas as ocorrências.

### 5.2 Alteração de variação de acorde

O estado de seleção é dividido em dois níveis:

- **global por chordLabel**: aplica a mesma variação para todas as ocorrências do acorde;
- **por ocorrência**: aplica a variação apenas para uma ocorrência específica.

Essa lógica existe em [Presentation.jsx](Front/src/Pages/Presentation/Presentation.jsx) e depende do `chordId` gerado pelo parser.

### 5.3 Edição da cifra

A edição usa o editor TipTap com extensão customizada `ChordHighlight`.

Fluxo:

1. o usuário entra em modo de edição;
2. o editor recebe o conteúdo normalizado da cifra;
3. o usuário altera o texto;
4. ao salvar, a página chama `updateSongEntry` com o `songCifra` atualizado;
5. a UI atualiza o estado e exibe o timestamp do último salvamento.

### 5.4 Notas por instrumento

O componente permite gravar notas do instrumento atual.

A gravação usa `updateInstrumentNotes` e atualiza `songDataFetched` localmente após o save.

### 5.5 Vídeos e Guitar Pro

A toolbox abre vídeos via `embedLinks`, e `ToolBoxYT` controla o player.

Se a música possui arquivos Guitar Pro, o botão abre o visualizador e permite escolher entre múltiplos arquivos quando houver mais de um.

## 6. Controle de rolagem automática

O comportamento de rolagem automática é centralizado em [ScrollControlPanel.jsx](Front/src/Pages/Presentation/ScrollControlPanel.jsx) e no controller global em [presentationScrollController.js](Front/src/Pages/Presentation/presentationScrollController.js).

### Atalhos principais

- **Espaço:** inicia/para auto scroll
- **Escape:** para auto scroll
- **Setas esquerda/direita:** ajustam a velocidade
- **Setas cima/baixo:** rola a viewport
- **PageUp/PageDown:** rola por página
- **Home/End:** vai ao início/fim do conteúdo

### Modos de rolagem

- `normal`: desloca em passos pequenos
- `page`: desloca em páginas completas

### Touch

- a UI mobile usa um slider para ajustar a velocidade
- no touch, a velocidade padrão é maior que no desktop

## 7. Estado global e efeitos colaterais

A página usa vários efeitos React com responsabilidades distintas:

- controlar `overflow` do body;
- atualizar o `lastPlayed` no backend;
- registrar o viewport atual para o controller;
- reagir ao `fullscreenchange`;
- reforçar foco no viewport durante o live;
- remover listeners ao sair da página.

Isso torna a página funcional, mas também cria dependência forte do estado do DOM e do ciclo de vida do componente.

## 8. Pontos fortes da implementação

- **Separação razoável** entre parsing, renderização e controls.
- **Modo LIVE bem integrado** com fullscreen, foco e atalhos.
- **Tooltip de acordes funcional** com diagrama e variações.
- **Suporte a edição e notas** sem sair da página.
- **Fallback offline** na busca dos dados.
- **Ajuste mobile** para leitura em tela pequena.

## 9. Pontos frágeis / riscos observados

### 9.1 Inconsistência no modo “chords”

O estado `selectContenttoShow === "chords"` retorna `songLyrics`, não `songChords`.

Isso provavelmente é um bug ou uma divergência semântica e pode confundir usuários e agentes que tentem inferir o comportamento.

### 9.2 Parser dependente de heurísticas

O parser em [processSongCifra.jsx](Front/src/Pages/Presentation/processSongCifra.jsx) usa heurísticas para distinguir:

- linhas de acorde,
- linhas de letra,
- tabs,
- TOM,
- seções.

Isso funciona bem para formatos previsíveis, mas pode falhar em cifras pouco padronizadas.

### 9.3 Estado global da rolagem

O controller usa `window[GLOBAL_KEY]`. Isso facilita o compartilhamento entre componentes, mas também aumenta a chance de acoplamento e efeitos inesperados.

### 9.4 Dependência de DOM e do fullscreen

A lógica do live depende de APIs do browser e do elemento raiz. Em navegadores restritos ou ambientes sem fullscreen, o fluxo alterna para pseudo-live.

### 9.5 Renderização com HTML injetado

A página usa `dangerouslySetInnerHTML` para renderizar blocos HTML. Isso é necessário para o parser, mas aumenta o risco de inconsistências se o HTML não estiver sanitizado.

## 10. Quebrar pontos e cenários de teste recomendados

### Cenários críticos

1. Abrir a página com um instrumento ausente na URL.
2. Confirmar fallback para o primeiro instrumento válido.
3. Validar o conteúdo em `default`, `tabs`, `lyrics` e `chords`.
4. Testar o comportamento da rolagem automática com teclado e touch.
5. Testar hover do tooltip em acordes e troca de variação.
6. Validar a edição da cifra e o save.
7. Validar live mode em desktop e touch.
8. Validar abertura de vídeo e Guitar Pro.
9. Verificar notas e persistência.
10. Confirmar comportamento offline quando a API falha.

### Observações para agentes de IA

- O ponto de entrada principal é [Front/src/Pages/Presentation/Presentation.jsx](Front/src/Pages/Presentation/Presentation.jsx).
- O parser do conteúdo é o principal componente de transformação de dados.
- O controller global de rolagem é relevante para qualquer mudança de navegação/scroll.
- O tooltip de acordes depende tanto de metadados do parser quanto das bibliotecas de acordes.

## 11. Conclusão

A página Presentation da UI web está bem estruturada para uso em apresentação ao vivo e possui funcionalidades avançadas: seleção de instrumento, modo live, edição, tooltip de acordes, rolagem automática, notas, vídeos e Guitar Pro. Ela é adequada para uso por humanos e por agentes de IA que precisem compreender rapidamente o fluxo de renderização, estado e interações.

O principal ponto de atenção é a inconsistência do modo `chords`, que hoje se comporta como `lyrics`. Além disso, o parser e o controller global de rolagem são os pontos onde ajustes futuros podem afetar o comportamento de forma mais ampla.
