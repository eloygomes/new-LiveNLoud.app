import re

# ———————————————— Helpers ————————————————

# (1) Tab lines: your original logic
_TAB_STARTS = ("e|", "B|", "G|", "D|", "A|", "E|", "e:", "B:", "G:", "D:", "A:", "E:")


def _is_tab_line(line: str) -> bool:
    return (
        line.lstrip().startswith(_TAB_STARTS)
        or line.count("-") >= 5
    )


def _extract_tabs(cifra: str) -> str:
    out = []
    lines = cifra.splitlines()
    i = 0
    while i < len(lines):
        if _is_tab_line(lines[i]) and i + 2 < len(lines) \
           and _is_tab_line(lines[i+1]) and _is_tab_line(lines[i+2]):
            while i < len(lines) and _is_tab_line(lines[i]):
                out.append(lines[i].rstrip())
                i += 1
            out.append("")  # blank line between tab-blocks
        else:
            i += 1
    return "\n".join(out).strip()


# (2) Chord lines: detect if a line contains ≥2 standalone chords

_CHORD_INNER = (
    r'[A-G]'               # nota raiz A–G
    r'[#b]?'               # opcional # ou b
    r'(?:'                 # extensões opcionais:
      r'(?:maj|min|m)\d*M?'  #   maj|min|m + dígitos + M opcional (Cmaj7, Cm7, Cmaj, Cm)
      r'|\d+M?'            #   dígito + M opcional (C7, C9M)
      r'|sus\d*'           #   sus2, sus4...
      r'|aug'              #   aug
      r'|dim'              #   dim
      r'|[º°+\-]'          #   símbolos º ° + –
    r')?'
    r'(?:\([^)]*\))?'      # extensões entre parênteses: (4), (4/9), (add9)
    r'(?:/[A-G][#b]?)?'    # baixo alternativo: /E, /Bb...
)
_CHORD_RE = re.compile(r'^\(?'+_CHORD_INNER+r'\)?$')


def _is_chord_line(line: str) -> bool:
    tokens = line.strip().split()
    # conta quantos tokens são acordes válidos
    count = sum(1 for t in tokens if _CHORD_RE.fullmatch(t))
    if count >= 2:
        return True
    # também trata linha com apenas 1 token que é acorde
    if count == 1 and _CHORD_RE.fullmatch(line.strip()):
        return True
    return False


def _extract_chords(cifra: str) -> str:
    """
    1) Remove linhas de tablatura
    2) Mantém linhas de acordes intactas
    3) Oculta todas as demais linhas (letras) com display:none
    4) Limita a no máximo 3 linhas em branco consecutivas
    """
    lines = cifra.splitlines(keepends=True)
    out = []

    for line in lines:
        # ——— 1) Descarta linhas de tablatura ——————————————————————————
        if _is_tab_line(line):
            continue

        # ——— 2) Mantém linhas de acordes intactas ————————————————————
        if _is_chord_line(line):
            out.append(line)
            continue

        # ——— 3) Preserva linhas em branco —————————————————————————
        if re.match(r'^[ \t]*\n$', line):
            out.append(line)
            continue

        # ——— 4) Oculta linhas de letra ——————————————————————————————
        content = line.rstrip('\n')
        out.append(f'<span style="color:lightgrey">{content}</span>\n')

    # ——— 5) Colapsa 4+ quebras de linha em exatamente 3 ——————————
    blank_re = re.compile(r'(?:\n){4,}')  # quatro ou mais '\n' seguidos
    result = blank_re.sub('\n\n\n', ''.join(out))

    return result


# (3) Lyrics: anything that’s not tabs, not chords, and not blank

def _extract_lyrics(cifra: str) -> str:
    # 1) remover linhas de seção (inclui H.N, 'tom:', cabeçalhos e partes)
    section_re = re.compile(
        r'(?im)^[ \t]*'
        r'(?:'
          r'tom:'
          r'|\[Intro\]'
          r'|\[Solo Intro\]'
          r'|H\.N'
          r'|\[Primeira Parte\]'
          r'|\[Segunda Parte\]'
          r'|\[Terceira Parte\]'
          r'|\[Solo\]'
          r'|\[Solo Principal\]'
          r'|\[Final\]'
          r'|Parte\s*\d+\s*(?:De|de)\s*\d+'
          r'|Pate\s*\d+\s*de\s*\d+'
        r')'
        r'.*\n?',
        flags=re.MULTILINE
    )
    result = section_re.sub('', cifra)

    # 2) remover linhas de tablatura e cabeçalhos "[Tab ...]"
    tab_line_re   = re.compile(r'(?m)^[ \t]*[eEBGDA]\|.*\n?')
    tab_header_re = re.compile(r'(?m)^\[Tab[^\]]*\].*\n?')
    result = tab_line_re.sub('', result)
    result = tab_header_re.sub('', result)

    # 3) esconder qualquer linha que contenha um acorde, envolvendo toda a linha em display:none
    chord_body = (
        r'[A-G][#b]?'
        r'(?:(?:maj|min|m)?\d*|\d+M|sus\d*|aug|dim|º|°|\+|\-)?'
        r'(?:/[A-G][#b]?)?'
    )
    chord_line_re = re.compile(rf'(?m)^[ \t]*.*\b{chord_body}\b.*\n?')
    result = chord_line_re.sub(lambda m: f'<span style="display:none">{m.group(0)}</span>', result)

    # 4) remover parênteses vazios e linhas só com "( )"
    empty_par_re = re.compile(r'(?m)^\(\s*\)\s*\n?')
    result = empty_par_re.sub('', result)

    # 5) colapsar mais de 3 linhas em branco consecutivas para exatamente 3
    blank_re = re.compile(r'(?:\n[ \t]*){4,}')
    result = blank_re.sub('\n\n\n', result)

    return result


# ————————————— song_cifra_treatment —————————————
def song_cifra_treatment(song_cifra: str) -> dict:
    """
    Decomposes the full cifra text into:
      - song_cifra: original raw text
      - songTabs:   only the tablature blocks
      - songChords: only the chord-line blocks
      - songLyrics: only the lyric lines
    """
    tabs   = _extract_tabs(song_cifra)
    chords = _extract_chords(song_cifra)
    lyrics = _extract_lyrics(song_cifra)

    return {
        "song_cifra": song_cifra,
        "songTabs":  tabs,
        "songChords": chords,
        "songLyrics": lyrics,
    }