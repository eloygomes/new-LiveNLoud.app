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


---

# Diretrizes de implementação — Transpose, duas colunas e expansão da cifra

- **Data da atualização:** 2026-05-25
- **Escopo:** somente web, dentro de `Front/src/Pages/Presentation` e estilos relacionados em `Front/src/index.css`.
- **Objetivo:** adicionar três recursos à Presentation Page sem alterar a estrutura principal da página, mantendo compatibilidade com modo normal, modo LIVE, toolbox, parser atual e rolagem automática.

## 12. Visão geral dos novos recursos

A implementação deve adicionar três controles novos na `ToolBox` da página `Presentation`:

1. **Transpose / Tom**
   - Controle visual parecido com `- Tom +` ou `- ½ Tom +`.
   - Deve alterar acordes da cifra em semitons.
   - Deve alterar também os números das tablaturas quando a música for transposta.
   - Deve exibir o tom atual calculado.
   - Deve funcionar sem salvar automaticamente no banco. A transposição deve ser visual/local por padrão.

2. **Cifra em duas colunas**
   - Controle booleano para exibir o conteúdo da cifra em duas colunas.
   - Deve ser aplicado no container de renderização da cifra, não dentro do parser.
   - Deve preservar blocos de tablatura sem quebrar linhas internamente de forma ruim.

3. **Expandir cifra**
   - Controle booleano para remover o limite visual centralizado da cifra.
   - Deve fazer a cifra ocupar mais largura da tela.
   - Por padrão, quando expandido, deve tentar usar duas colunas para caber mais conteúdo na tela.
   - Deve continuar compatível com o modo LIVE e com a rolagem automática.

## 13. Arquivos que devem ser alterados

### 13.1 `Front/src/Pages/Presentation/Presentation.jsx`

Responsável por criar e controlar os novos estados:

- `transposeSteps`
- `isTwoColumns`
- `isExpandedCifra`

Também deve calcular o conteúdo transposto antes de enviar para o parser.

### 13.2 `Front/src/Pages/Presentation/ToolBox.jsx`

Responsável por exibir os novos controles dentro da toolbox:

- controle de transpose;
- toggle de duas colunas;
- toggle de expandir cifra.

A implementação deve seguir o padrão visual já existente da toolbox.

### 13.3 `Front/src/Pages/Presentation/processSongCifra.jsx`

Deve receber o conteúdo já transposto.

O parser não deve ser responsável por controlar o estado de transposição. Ele pode continuar recebendo uma string e retornando HTML renderizável.

Pode ser necessário apenas garantir que linhas de tab continuem recebendo classes adequadas (`tab`, `presentation-tab`, ou equivalente atual).

### 13.4 Novo arquivo recomendado: `Front/src/Pages/Presentation/transposeCifra.js`

Criar um helper isolado para a lógica musical de transposição.

Esse arquivo deve conter:

- mapa de notas;
- normalização de notas;
- transposição de acordes;
- transposição de linhas de tab;
- função principal para transpor o conteúdo completo.

### 13.5 `Front/src/index.css`

Adicionar classes para:

- layout em duas colunas;
- modo expandido;
- comportamento responsivo;
- proteção contra quebra ruim em tablaturas;
- ajustes específicos para modo LIVE, se necessário.

## 14. Estados novos em `Presentation.jsx`

Adicionar os estados no componente principal:

```jsx
const [transposeSteps, setTransposeSteps] = useState(0);
const [isTwoColumns, setIsTwoColumns] = useState(false);
const [isExpandedCifra, setIsExpandedCifra] = useState(false);
```

### Regras dos estados

- `transposeSteps` começa em `0`.
- Cada clique no botão `+` aumenta `transposeSteps` em `1`.
- Cada clique no botão `-` diminui `transposeSteps` em `1`.
- `1` representa meio tom acima.
- `-1` representa meio tom abaixo.
- `isTwoColumns` pode ser ligado/desligado manualmente.
- `isExpandedCifra` pode ser ligado/desligado manualmente.
- Quando `isExpandedCifra === true`, a UI deve preferir duas colunas mesmo que `isTwoColumns === false`.

A regra prática para renderização deve ser:

```jsx
const shouldUseTwoColumns = isTwoColumns || isExpandedCifra;
```

## 15. Fluxo correto para transposição

O fluxo recomendado é:

1. Carregar a cifra original do backend normalmente.
2. Guardar a cifra original sem modificar.
3. Aplicar transposição apenas em uma variável derivada.
4. Enviar a versão derivada para `processSongCifra`.
5. Renderizar o HTML resultante.

Exemplo conceitual:

```jsx
const selectedRawContent = selectContenttoShow(...);

const transposedContent = useMemo(() => {
  return transposeCifra(selectedRawContent, transposeSteps);
}, [selectedRawContent, transposeSteps]);

const processedHtml = useMemo(() => {
  return processSongCifra(transposedContent, ...);
}, [transposedContent, ...]);
```

A implementação não deve sobrescrever `songCifraData`, `songTabs`, `songLyrics` ou `songChords` com valores transpostos. Esses estados devem continuar representando a versão original vinda do banco ou da edição.

## 16. Lógica musical da transposição

### 16.1 Notas suportadas

Usar preferencialmente sustenidos como saída padrão:

```js
const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
```

Também aceitar bemóis na entrada:

```js
const FLAT_TO_SHARP = {
  "Db": "C#",
  "Eb": "D#",
  "Gb": "F#",
  "Ab": "G#",
  "Bb": "A#"
};
```

### 16.2 Transposição de uma nota

A função deve:

1. normalizar bemol para sustenido;
2. encontrar o índice da nota;
3. somar `steps`;
4. aplicar módulo 12;
5. retornar a nota transposta.

Exemplo:

```js
function transposeNote(note, steps) {
  const normalized = FLAT_TO_SHARP[note] || note;
  const index = SHARP_NOTES.indexOf(normalized);

  if (index === -1) return note;

  const nextIndex = (index + steps + 1200) % 12;
  return SHARP_NOTES[nextIndex];
}
```

### 16.3 Transposição de acordes

A função deve preservar o restante do acorde.

Exemplos esperados:

- `B` com `+1` → `C`
- `C#m` com `+1` → `Dm`
- `F#7` com `+1` → `G7`
- `Bb` com `+1` → `B`
- `D/F#` com `+1` → `D#/G`
- `A#Cm` não deve ser tratado como acorde único; essa situação indica provavelmente falta de espaço na cifra original. A implementação deve transpor tokens isolados, não blocos colados sem separador.

Regex recomendada para capturar a raiz do acorde:

```js
/^([A-G](?:#|b)?)(.*)$/
```

Para acordes com baixo invertido:

```js
function transposeChord(chord, steps) {
  return chord.split("/").map((part, index) => {
    const match = part.match(/^([A-G](?:#|b)?)(.*)$/);
    if (!match) return part;

    const root = match[1];
    const suffix = match[2] || "";

    return `${transposeNote(root, steps)}${suffix}`;
  }).join("/");
}
```

## 17. Como identificar linhas de acordes, letras e tabs

A transposição precisa evitar alterar palavras comuns da letra.

Por isso, não se deve aplicar regex global em toda a cifra indiscriminadamente.

A regra recomendada é classificar a linha antes:

### 17.1 Linha de tab

Uma linha é tab quando começa com uma corda seguida de `|`:

```js
/^\s*[eEADGB]\|/
```

Também considerar baixo com quatro cordas:

```js
/^\s*[GDAE]\|/
```

Na prática, uma função simples pode ser:

```js
function isTabLine(line) {
  return /^\s*[eEADGB]\|/.test(line) || /^\s*[GDAE]\|/.test(line);
}
```

### 17.2 Linha de tom

Uma linha de tom pode aparecer como:

- `Tom: B`
- `Tom: Bb`
- `Tom: C`
- `Tom: C#`

Regex:

```js
/^(Tom:\s*)([A-G](?:#|b)?)(.*)$/i
```

### 17.3 Linha de acordes

Uma linha deve ser considerada linha de acordes quando a maior parte dos tokens forem acordes válidos.

Tokens de acorde devem aceitar:

- notas naturais;
- sustenidos;
- bemóis;
- menores;
- sétimas;
- extensões;
- acordes com baixo invertido.

Regex prática:

```js
/^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:M|m)?(?:\/[A-G](?:#|b)?)?$/
```

Uma função mais segura:

```js
function isChordToken(token) {
  const cleaned = token.trim();
  if (!cleaned) return false;

  return /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:M|m)?(?:\/[A-G](?:#|b)?)?$/.test(cleaned);
}

function isChordLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;

  const chordTokens = tokens.filter(isChordToken);
  return chordTokens.length > 0 && chordTokens.length / tokens.length >= 0.6;
}
```

## 18. Transposição de tabs

### 18.1 Regra funcional esperada

Ao subir ou descer o tom, a tab deve mudar os números dos trastes.

Exemplo com `+1`:

```txt
A|-----3-5/7-5-----
```

vira:

```txt
A|-----4-6/8-6-----
```

Exemplo com `-1`:

```txt
A|-----3-5/7-5-----
```

vira:

```txt
A|-----2-4/6-4-----
```

### 18.2 Limite inferior

Nenhum traste deve ficar negativo.

Se o resultado for menor que zero, usar `0`.

Exemplo:

```txt
E|--0--5--
```

com `-1` vira:

```txt
E|--0--4--
```

O primeiro `0` permanece `0`, porque não existe traste `-1`.

### 18.3 Regex para números de tab

Usar uma substituição global em números dentro de linhas classificadas como tab:

```js
function transposeTabLine(line, steps) {
  return line.replace(/\d+/g, (value) => {
    const next = Number(value) + steps;
    return String(Math.max(0, next));
  });
}
```

### 18.4 Observação importante sobre tabs

Essa regra é útil para o comportamento visual solicitado, mas musicalmente é uma simplificação.

Em uma implementação mais avançada, a transposição de tablatura deveria redistribuir notas entre cordas, respeitar afinação, cordas soltas e posições tocáveis. Para esta fase, a regra correta é transpor apenas os números mantendo a mesma corda e a mesma estrutura visual.

## 19. Função principal recomendada: `transposeCifra`

Criar `Front/src/Pages/Presentation/transposeCifra.js`:

```js
const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const FLAT_TO_SHARP = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

function transposeNote(note, steps) {
  const normalized = FLAT_TO_SHARP[note] || note;
  const index = SHARP_NOTES.indexOf(normalized);

  if (index === -1) return note;

  const nextIndex = (index + steps + 1200) % 12;
  return SHARP_NOTES[nextIndex];
}

function transposeChord(chord, steps) {
  return chord
    .split("/")
    .map((part) => {
      const match = part.match(/^([A-G](?:#|b)?)(.*)$/);
      if (!match) return part;

      const root = match[1];
      const suffix = match[2] || "";

      return `${transposeNote(root, steps)}${suffix}`;
    })
    .join("/");
}

function isTabLine(line) {
  return /^\s*[eEADGB]\|/.test(line) || /^\s*[GDAE]\|/.test(line);
}

function transposeTabLine(line, steps) {
  return line.replace(/\d+/g, (value) => {
    const next = Number(value) + steps;
    return String(Math.max(0, next));
  });
}

function isChordToken(token) {
  const cleaned = token.trim();
  if (!cleaned) return false;

  return /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?[0-9]*(?:M|m)?(?:\/[A-G](?:#|b)?)?$/.test(cleaned);
}

function isChordLine(line) {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;

  const chordTokens = tokens.filter(isChordToken);
  return chordTokens.length > 0 && chordTokens.length / tokens.length >= 0.6;
}

function transposeChordLine(line, steps) {
  return line.replace(/\S+/g, (token) => {
    return isChordToken(token) ? transposeChord(token, steps) : token;
  });
}

function transposeTomLine(line, steps) {
  return line.replace(/^(Tom:\s*)([A-G](?:#|b)?)(.*)$/i, (_, prefix, note, suffix) => {
    return `${prefix}${transposeNote(note, steps)}${suffix}`;
  });
}

export function transposeCifra(content, steps) {
  if (!content || steps === 0) return content || "";

  return content
    .split("\n")
    .map((line) => {
      if (isTabLine(line)) {
        return transposeTabLine(line, steps);
      }

      if (/^Tom:\s*/i.test(line.trim())) {
        return transposeTomLine(line, steps);
      }

      if (isChordLine(line)) {
        return transposeChordLine(line, steps);
      }

      return line;
    })
    .join("\n");
}

export function getTransposedKey(originalKey, steps) {
  if (!originalKey) return "";
  return transposeNote(originalKey, steps);
}
```

## 20. Integração em `Presentation.jsx`

### 20.1 Importar helper

```jsx
import { transposeCifra, getTransposedKey } from "./transposeCifra";
```

### 20.2 Criar estados

```jsx
const [transposeSteps, setTransposeSteps] = useState(0);
const [isTwoColumns, setIsTwoColumns] = useState(false);
const [isExpandedCifra, setIsExpandedCifra] = useState(false);
```

### 20.3 Criar handlers

```jsx
const handleTransposeDown = () => {
  setTransposeSteps((current) => current - 1);
};

const handleTransposeUp = () => {
  setTransposeSteps((current) => current + 1);
};

const handleResetTranspose = () => {
  setTransposeSteps(0);
};

const handleToggleTwoColumns = () => {
  setIsTwoColumns((current) => !current);
};

const handleToggleExpandedCifra = () => {
  setIsExpandedCifra((current) => !current);
};
```

### 20.4 Aplicar transposição no conteúdo selecionado

Encontrar o ponto onde o conteúdo selecionado é enviado para `processSongCifra`.

Antes do parser, criar uma variável derivada:

```jsx
const contentToRender = useMemo(() => {
  return transposeCifra(selectedContent, transposeSteps);
}, [selectedContent, transposeSteps]);
```

Depois usar `contentToRender` no lugar de `selectedContent`.

### 20.5 Passar controles para a toolbox

Na chamada de `ToolBox`, passar:

```jsx
<ToolBox
  ...
  transposeSteps={transposeSteps}
  onTransposeDown={handleTransposeDown}
  onTransposeUp={handleTransposeUp}
  onResetTranspose={handleResetTranspose}
  isTwoColumns={isTwoColumns}
  onToggleTwoColumns={handleToggleTwoColumns}
  isExpandedCifra={isExpandedCifra}
  onToggleExpandedCifra={handleToggleExpandedCifra}
/>
```

Ajustar os nomes conforme o padrão real de props do arquivo atual.

## 21. UI da ToolBox

### 21.1 Controle de transpose

Adicionar um item na toolbox com esta lógica visual:

```jsx
<div className="presentation-toolbox-row">
  <button type="button" onClick={onTransposeDown}>−</button>

  <button type="button" onClick={onResetTranspose}>
    {transposeSteps === 0 ? "Tom" : `${transposeSteps > 0 ? "+" : ""}${transposeSteps} semitom`}
  </button>

  <button type="button" onClick={onTransposeUp}>+</button>
</div>
```

Se quiser seguir exatamente a referência visual do Cifra Club:

```txt
−   ½ Tom   +
```

Quando houver transposição ativa, pode mostrar:

```txt
−   +1   +
```

ou:

```txt
−   C   +
```

A opção mais útil para o usuário é mostrar o tom calculado, por exemplo:

```txt
−   C   +
```

### 21.2 Botão de duas colunas

Adicionar um botão/toggle:

```jsx
<button
  type="button"
  onClick={onToggleTwoColumns}
  className={isTwoColumns ? "active" : ""}
>
  Duas colunas
</button>
```

### 21.3 Botão de expandir cifra

Adicionar um botão/toggle:

```jsx
<button
  type="button"
  onClick={onToggleExpandedCifra}
  className={isExpandedCifra ? "active" : ""}
>
  Expandir cifra
</button>
```

## 22. Classes CSS para layout

Adicionar em `Front/src/index.css`.

### 22.1 Container da cifra

No `Presentation.jsx`, aplicar classes condicionais no container que envolve o HTML da cifra:

```jsx
const cifraLayoutClassName = [
  "presentation-cifra-content",
  shouldUseTwoColumns ? "presentation-cifra-two-columns" : "",
  isExpandedCifra ? "presentation-cifra-expanded" : "",
].filter(Boolean).join(" ");
```

Uso:

```jsx
<div className={cifraLayoutClassName}>
  ...
</div>
```

### 22.2 CSS recomendado

```css
.presentation-cifra-content {
  width: 100%;
}

.presentation-cifra-expanded {
  max-width: none !important;
  width: calc(100vw - 48px);
}

.presentation-cifra-two-columns {
  column-count: 2;
  column-gap: 48px;
  column-fill: auto;
}

.presentation-cifra-two-columns .tab,
.presentation-cifra-two-columns pre,
.presentation-cifra-two-columns .presentation-tab {
  break-inside: avoid;
  page-break-inside: avoid;
  overflow-x: auto;
  white-space: pre;
}

.presentation-cifra-two-columns .section,
.presentation-cifra-two-columns .verse,
.presentation-cifra-two-columns .chorus,
.presentation-cifra-two-columns .intro,
.presentation-cifra-two-columns .solo,
.presentation-cifra-two-columns .bridge {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

### 22.3 Responsivo

Em telas menores, forçar uma coluna:

```css
@media (max-width: 900px) {
  .presentation-cifra-two-columns {
    column-count: 1;
  }

  .presentation-cifra-expanded {
    width: 100%;
  }
}
```

### 22.4 Modo LIVE

Se o modo LIVE já usa classes próprias, adicionar compatibilidade:

```css
.presentation-live .presentation-cifra-expanded,
.live-mode .presentation-cifra-expanded {
  width: 100vw;
  max-width: none !important;
}

.presentation-live .presentation-cifra-two-columns,
.live-mode .presentation-cifra-two-columns {
  column-gap: 64px;
}
```

Ajustar os seletores conforme as classes reais existentes no projeto.

## 23. Observações importantes sobre duas colunas

CSS columns pode quebrar blocos em pontos indesejados se o HTML gerado pelo parser não agrupar corretamente seções e tablaturas.

Se isso acontecer, há duas opções:

1. **Solução simples:** manter CSS columns e usar `break-inside: avoid` nos blocos principais.
2. **Solução robusta:** alterar `processSongCifra.jsx` para envolver cada seção em um bloco pai consistente, por exemplo:

```html
<div class="presentation-section-block">
  ...
</div>
```

Depois aplicar:

```css
.presentation-section-block {
  break-inside: avoid;
  page-break-inside: avoid;
}
```

A solução simples deve ser tentada primeiro.

## 24. Comportamento esperado do botão expandir cifra

Quando o usuário clicar em expandir:

- remover limite de largura central da cifra;
- usar mais largura horizontal da página;
- tentar aplicar duas colunas automaticamente;
- preservar rolagem vertical;
- não esconder o cabeçalho por padrão;
- não entrar automaticamente em modo LIVE.

Regra recomendada:

```jsx
const shouldUseTwoColumns = isTwoColumns || isExpandedCifra;
```

Se o usuário desligar expandir, a cifra volta ao limite normal. O estado manual de `isTwoColumns` pode continuar preservado.

## 25. Comportamento esperado no modo LIVE

No modo LIVE:

- toolbox continua escondida, como já acontece;
- se o usuário ativou transpose antes do LIVE, a transposição permanece;
- se o usuário ativou duas colunas antes do LIVE, as duas colunas permanecem;
- se o usuário ativou expandir antes do LIVE, a cifra continua expandida;
- o scroll automático deve continuar usando o mesmo viewport atual.

Não adicionar novos listeners globais para esses recursos. Eles devem ser estados React normais.

## 26. Persistência

Para a primeira versão, não salvar essas preferências no banco.

Opções futuras:

- salvar `transposeSteps` por usuário e música;
- salvar preferência de duas colunas por usuário;
- salvar modo expandido por dispositivo;
- salvar em `localStorage` usando chaves específicas.

Se for usar `localStorage` futuramente, usar chaves parecidas com:

```txt
presentation:transposeSteps:{artist}:{song}:{instrument}
presentation:twoColumns
presentation:expandedCifra
```

Para esta fase, manter local apenas em memória do React.

## 27. Cenários de teste obrigatórios

### 27.1 Transpose de acordes

Testar:

```txt
Tom: B
Introdução: C#m B C#m D#m E F# B
```

Com `+1`, esperado:

```txt
Tom: C
Introdução: Dm C Dm Em F G C
```

Com `-1`, esperado:

```txt
Tom: A#
Introdução: Cm A# Cm Dm D# F A#
```

### 27.2 Transpose de tabs

Entrada:

```txt
E|--0--5-----------------------------0--5-
A|-----3-5/7-5--5-5--5-5------7-5-3--3-3--
D|-------------------------7-5-------------
```

Com `+1`, esperado:

```txt
E|--1--6-----------------------------1--6-
A|-----4-6/8-6--6-6--6-6------8-6-4--4-4--
D|-------------------------8-6-------------
```

Com `-1`, esperado:

```txt
E|--0--4-----------------------------0--4-
A|-----2-4/6-4--4-4--4-4------6-4-2--2-2--
D|-------------------------6-4-------------
```

### 27.3 Letras não devem ser alteradas

Entrada:

```txt
Before I go let me kiss you
And wipe the tears from your eyes
```

Com qualquer transpose, deve continuar igual.

### 27.4 Acordes sobre letra

Entrada:

```txt
F        A#     Cm
Too proud to be a queen
```

Com `+1`:

```txt
F#       B      C#m
Too proud to be a queen
```

### 27.5 Duas colunas

Validar:

- layout normal em uma coluna;
- toggle liga duas colunas;
- tabs não quebram no meio;
- seções não ficam cortadas de forma ilegível;
- mobile volta para uma coluna.

### 27.6 Expandir cifra

Validar:

- largura central limitada é removida;
- duas colunas são aplicadas automaticamente;
- rolagem continua funcionando;
- LIVE continua funcionando;
- botão pode desligar e voltar ao layout anterior.

## 28. Ordem recomendada de implementação

1. Criar `transposeCifra.js`.
2. Testar manualmente `transposeCifra()` com strings simples.
3. Adicionar estados em `Presentation.jsx`.
4. Aplicar transposição antes do parser.
5. Adicionar controles na `ToolBox`.
6. Adicionar classes condicionais no container da cifra.
7. Adicionar CSS de duas colunas e expansão.
8. Testar em modo normal.
9. Testar em modo LIVE.
10. Testar com tabs reais do Cifra Club.
11. Só depois considerar persistência em `localStorage`.

## 29. Riscos e decisões técnicas

### 29.1 Risco: transpor palavras da letra por engano

Mitigação:

- nunca aplicar regex global em todo o conteúdo;
- primeiro classificar a linha;
- transpor somente linha de acorde, linha de tom e linha de tab.

### 29.2 Risco: tabs musicalmente imprecisas

Mitigação:

- aceitar a regra simples por enquanto;
- documentar que a transposição de tab apenas desloca números de trastes;
- não tentar redistribuir notas entre cordas nesta fase.

### 29.3 Risco: duas colunas quebrando blocos

Mitigação:

- usar `break-inside: avoid`;
- se necessário, melhorar o HTML do parser agrupando seções.

### 29.4 Risco: conflitos com LIVE mode

Mitigação:

- não criar novo sistema de scroll;
- não alterar o controller global de rolagem;
- aplicar apenas classes CSS e estados React.

## 30. Critério de aceite

A implementação estará correta quando:

- o botão `- Tom +` aparecer dentro da toolbox da Presentation Page;
- clicar em `+` subir acordes e tabs em meio tom;
- clicar em `-` descer acordes e tabs em meio tom;
- o tom exibido for atualizado visualmente;
- letras comuns não forem alteradas;
- a opção de duas colunas funcionar no layout normal;
- a opção de expandir remover o limite central da cifra;
- expandir aplicar duas colunas automaticamente quando houver espaço;
- o modo LIVE continuar funcionando;
- a rolagem automática continuar funcionando;
- a cifra original no banco não for sobrescrita pela transposição visual.
