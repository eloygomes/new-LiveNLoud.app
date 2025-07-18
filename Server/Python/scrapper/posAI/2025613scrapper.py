
from __future__ import annotations

# ─────────────────────────  IMPORTS  ──────────────────────────────
import re
import sys
import importlib
import html
from typing import Optional

from dotenv import load_dotenv      # type: ignore
from pydantic import BaseModel      # type: ignore

import logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    force=True,
)

# LangChain
from langchain_openai import ChatOpenAI                    # type: ignore
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder  # type: ignore
from langchain_core.output_parsers import PydanticOutputParser              # type: ignore
from langchain.agents import create_tool_calling_agent, AgentExecutor       # type: ignore
from langchain.memory import ConversationBufferMemory                       # type: ignore
from langchain.tools import Tool                                            # type: ignore

# carregar variáveis (.env) caso use OPENAI_API_KEY etc.
load_dotenv()

# ─────────────────────────  REGEX ÚTEIS  ─────────────────────────
_CHORD_RE = re.compile(
    r"(?<!\w)[A-G](?:[#b])?(?:m|min|maj|sus|dim|aug|add)?\d*(?:/[A-G](?:[#b])?)?(?!\w)"
)
_META_RE = re.compile(r"^\s*(tom:|capotraste)", re.I)
_TAB_STARTS = (
    "a|","a#|","b|","c|","c#|","d|","d#|","e|","f|","f#|","g|","g#|",
    "A|","A#|","B|","C|","C#|","D|","D#|","E|","F|","F#|","G|","G#|",
    "e:", "a:","a#:","b:","c:","c#:","d:","d#:","e:","f:","f#:","g:","g#:",
    "A:","A#:","B:","C:","C#:","D:","D#:","E:","F:","F#:","G:","G#:",
)

# ───────────────────────  ACESSO LAZy AO userData  ───────────────
def _get_user_data() -> list:
    scrapper_mod = sys.modules.get("scrapper") or importlib.import_module("scrapper")
    return getattr(scrapper_mod, "userData", [])

# ─────────────────────────  TOOL  ────────────────────────────────
def get_song_cifra(key: str) -> dict:
    logging.info("[tool] called with key=%s", key)
    parts = key.split("|")
    if len(parts) == 4:
        instrument, email, artist, song = parts
    elif len(parts) == 3:
        instrument, artist, song = parts
        email = None
    else:
        return {"error": "Chave inválida."}

    artist = artist.strip().lower()
    song   = song.strip().lower()

    for item in _get_user_data():
        if email and item.get("email") and item["email"].lower() != email.lower():
            continue
        if (
            item.get("artist_name", "").lower() == artist
            and item.get("song_title", "").lower() == song
        ):
            return {
                "artist_name": item["artist_name"],
                "song_title":  item["song_title"],
                "song_cifra":  item["song_cifra"],
            }
    return {"error": "Música não encontrada."}

getSongCifra_tool = Tool(
    name="getSongCifra",
    func=get_song_cifra,
    description=(
        "Retorna {artist_name, song_title, song_cifra} dado "
        "'<instrument>|<artist>|<song>' ou '<instrument>|<email>|<artist>|<song>'."
    ),
)
TOOLS = [getSongCifra_tool]

# ───────────────────────  Pydantic schema  ──────────────────────
class SongCifraResponse(BaseModel):
    artist_name: str
    song_title:  str
    song_cifra:  str
    song_cifra_tab:  Optional[str] = ""
    song_cifra_lyrics: Optional[str] = ""
    song_chords:       Optional[str] = ""

parser = PydanticOutputParser(pydantic_object=SongCifraResponse)

# ─────────────────────────  PROMPT & AGENT  ─────────────────────
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Você é um assistente musical.\n"
            "⚠️  Sempre chame a ferramenta getSongCifra antes de responder.\n"
            "Depois devolva APENAS JSON no formato abaixo:\n{format_instructions}"
        ),
        MessagesPlaceholder("chat_history"),
        ("human", "{query}"),
        MessagesPlaceholder("agent_scratchpad"),
    ]
).partial(format_instructions=parser.get_format_instructions())

llm        = ChatOpenAI(model="gpt-4o-mini", temperature=0)
_agent     = create_tool_calling_agent(llm=llm, prompt=prompt, tools=TOOLS)
memory     = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
EXECUTOR   = AgentExecutor(agent=_agent, tools=TOOLS, memory=memory, return_only_outputs=True)

# ───────────────────  Helpers (HTML → texto)  ───────────────────
def _html_to_text(html_str: str) -> str:
    """Remove tags mantendo acordes e quebras de linha."""
    # Converte <br>, </pre>, </div> em \n para preservar blocos
    html_str = re.sub(r"(<br\s*/?>|</pre>|</div>)", "\n", html_str, flags=re.I)
    # Remove todas as tags, mas mantém o texto entre elas
    html_str = re.sub(r"<[^>]+>", "", html_str)
    # Decodifica entidades HTML (&amp;, &nbsp;…)
    return html.unescape(html_str)

# ───────────────────  Helpers (só texto)  ───────────────────────
def _is_chord_only(line: str) -> bool:
    return _CHORD_RE.sub("", line).strip() == "" and bool(_CHORD_RE.search(line))

def _strip_chords(cifra: str) -> str:
    txt = _html_to_text(cifra)
    return "\n".join(
        _CHORD_RE.sub("", l)
        for l in txt.splitlines()
        if not _META_RE.match(l) and not _is_chord_only(l)
    )

def _extract_chords_preserving_layout(cifra: str) -> str:
    """
    • Mantém somente linhas que contêm **apenas acordes** OU cabeçalhos
      entre colchetes.  
    • Linhas de letra viram linha em branco (para não quebrar espaçamento).
    """
    txt = _html_to_text(cifra)
    out: list[str] = []
    previous_blank = False

    for raw in txt.splitlines():
        if _META_RE.match(raw):          # ignora Tom:, Capotraste:
            continue

        line = raw.rstrip()
        if line.strip() == "":
            if not previous_blank:
                out.append("")
                previous_blank = True
            continue

        previous_blank = False

        if _is_chord_only(line):
            out.append(line)
        elif line.lstrip().startswith("[") and line.rstrip().endswith("]"):
            # Ex.: [Intro], [Terceira Parte]
            out.append(line)
        else:
            # linha de letra → preserva quebra vertical
            out.append("")

    return "\n".join(out)

# --------------- Extração de TABs  ---------------
def _is_tab_line(line: str) -> bool:
    return line.lstrip().startswith(_TAB_STARTS) or line.count("-") >= 5

def _extract_tabs(cifra: str) -> str:
    txt   = _html_to_text(cifra)
    out   = []
    lines = txt.splitlines()
    n = len(lines)
    i = 0

    while i < n:
        if _is_tab_line(lines[i]):
            if i + 2 < n and _is_tab_line(lines[i+1]) and _is_tab_line(lines[i+2]):
                while i < n and _is_tab_line(lines[i]):
                    out.append(lines[i].rstrip())
                    i += 1
                out.append("")  # separador entre blocos
            else:
                i += 1
        else:
            i += 1
    return "\n".join(out)

# ───────────────────────  Função pública  ───────────────────────
def agent(
    user_email: str,
    song_title: str,
    artist_name: str,
    instrument: str = "guitar01",
    song_cifra: str = "",
) -> SongCifraResponse:
    logging.info("[agent] start -> %s – %s", artist_name, song_title)
    key  = f"{instrument}|{user_email}|{artist_name}|{song_title}"
    raw  = EXECUTOR.invoke({"query": f"Separe letra, acordes e TABs de {key}"})
    resp = parser.parse(raw["output"])

    # Caso a LLM não retorne a cifra mas tenhamos recebido via parâmetro
    if not resp.song_cifra and song_cifra:
        resp.song_cifra = song_cifra

    # Fallback absoluto, busca direto no userData
    if not resp.song_cifra:
        for itm in _get_user_data():
            if (
                itm.get("artist_name", "").lower() == artist_name.lower()
                and itm.get("song_title", "").lower() == song_title.lower()
            ):
                resp.song_cifra = itm.get("song_cifra", "")
                break

    # ---------- Campos derivados ----------
    if not resp.song_cifra_lyrics:
        resp.song_cifra_lyrics = _strip_chords(resp.song_cifra)

    if not resp.song_chords:
        resp.song_chords = _extract_chords_preserving_layout(resp.song_cifra)

    if not resp.song_cifra_tab:
        resp.song_cifra_tab = _extract_tabs(resp.song_cifra)

    logging.info("[agent] output -> %s", resp.model_dump())
    return resp