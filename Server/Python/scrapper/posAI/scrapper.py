
from __future__ import annotations

# ─────────────────────────  IMPORTS  ──────────────────────────────
import re
import sys
import importlib
from typing import Optional

from dotenv import load_dotenv # type: ignore
from pydantic import BaseModel # type: ignore

import logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    force=True,
)

# LangChain
from langchain_openai import ChatOpenAI # type: ignore
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder # type: ignore
from langchain_core.output_parsers import PydanticOutputParser # type: ignore
from langchain.agents import create_tool_calling_agent, AgentExecutor # type: ignore
from langchain.memory import ConversationBufferMemory # type: ignore
from langchain.tools import Tool # type: ignore

# carregar variáveis (.env) caso use OPENAI_API_KEY etc.
load_dotenv()

# ─────────────────────────  REGEX ÚTEIS  ─────────────────────────
_CHORD_RE = re.compile(
    r"(?<!\w)[A-G](?:[#b])?(?:m|min|maj|sus|dim|aug|add)?\d*(?:/[A-G](?:[#b])?)?(?!\w)"
)
_TAB_STARTS = ("e|", "B|", "G|", "D|", "A|", "E|", "e:", "B:", "G:", "D:", "A:", "E:")

# ───────────────────────  ACESSO LAZy AO userData  ───────────────
def _get_user_data() -> list:
    """
    Busca o buffer global `userData` definido em scrapper.py sem criar
    import circular. Lida com import dinâmico se scrapper ainda não
    estiver nos módulos carregados.
    """
    scrapper_mod = sys.modules.get("scrapper") or importlib.import_module("scrapper")
    return getattr(scrapper_mod, "userData", [])

# ─────────────────────────  TOOL  ────────────────────────────────
def get_song_cifra(key: str) -> dict:
    logging.info("[tool] called with key=%s", key)
    """
    Retorna {artist_name, song_title, song_cifra} pesquisando no
    `userData` preenchido por scrapper.py.

    key formatos aceitos:
      • "<instrument>|<artist>|<song>"
      • "<instrument>|<email>|<artist>|<song>"
    """
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
        # Só aplica o filtro de e‑mail se o item realmente tiver esse campo
        if email and item.get("email") and item["email"].lower() != email.lower():
            continue
        if (
            item.get("artist_name", "").lower() == artist
            and item.get("song_title", "").lower() == song
        ):
            return {
                "artist_name": item["artist_name"],
                "song_title": item["song_title"],
                "song_cifra": item["song_cifra"],
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
    song_title: str
    song_cifra: str
    song_cifra_tab: Optional[str] = ""
    song_cifra_lyrics: Optional[str] = ""
    song_chords: Optional[str] = ""

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

llm     = ChatOpenAI(model="gpt-4o-mini", temperature=0)
_agent  = create_tool_calling_agent(llm=llm, prompt=prompt, tools=TOOLS)
memory  = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
EXECUTOR = AgentExecutor(agent=_agent, tools=TOOLS, memory=memory, return_only_outputs=True)
# EXECUTOR = AgentExecutor(agent=_agent, tools=TOOLS,  return_only_outputs=True)

# ───────────────────  Helpers (fallback local)  ─────────────────
_META_RE = re.compile(r"^\s*(tom:|capotraste)", re.I)


# ───────────────────────  Helpers (cifras)  ──────────────────────
# ───────────────────────  _is_chord_only  ──────────────────────
# Verifica se a linha contém apenas acordes, ou seja,
# se a linha só tem acordes e nada mais (nem espaços, nem letras).
# Exemplo: "C G Am F" é um acorde só, mas "C G Am F texto" não é.
# Também ignora linhas que só têm espaços ou estão vazias

# _is_chord_only é usado para filtrar linhas que não são
# apenas acordes, ou seja, linhas que contêm outros caracteres
# além dos acordes reconhecidos pelo regex _CHORD_RE.
# Se a linha contiver apenas acordes, espaços ou estiver vazia,
# ela será considerada como "apenas acordes" e será ignorada
# na hora de extrair a cifra sem acordes.

# ORIGINAL EXEMPLO:
# C                 Am7
# Todos os dias quando acordo
# Bm                   Em
# Não tenho mais o tempo que passou

# COMO DEVE FICAR:
# (espaço em branco onde estavam os acordes)
# Todos os dias quando acordo
# (espaço em branco onde estavam os acordes)
# Não tenho mais o tempo que passou

def _is_chord_only(line: str) -> bool:
    return _CHORD_RE.sub("", line).strip() == "" and bool(_CHORD_RE.search(line))


# ───────────────────────  LYRICS  ──────────────────────
# ───────────────────────  _strip_chords  ──────────────────────
# Extrai a cifra sem os acordes, ou seja,
# remove as linhas que contêm apenas acordes ou estão vazias.
# As linhas que contêm acordes mas também têm outros caracteres
# (como letras ou números) são mantidas.
def _strip_chords(cifra: str) -> str:
    return "\n".join(
        _CHORD_RE.sub("", l)
        for l in cifra.splitlines()
        if not _META_RE.match(l) and not _is_chord_only(l)
    )

# ───────────────────────  CHORDS  ──────────────────────
# ───────────────────────  _extract_chords  ──────────────────────
# Extrai os acordes de uma cifra, retornando um texto
# contendo apenas os acordes encontrados. Cada acorde é separado
# por um espaço e cada linha de acordes é separada por uma nova linha.
# Exemplo: "C G Am F" se torna "C G Am F".
def _extract_chords(cifra: str) -> str:
    return "\n".join(
        " ".join(m)
        for l in cifra.splitlines()
        if not _META_RE.match(l) and (m := _CHORD_RE.findall(l))
    )



# ───────────────────────  TABS  ──────────────────────
# ───────────────────────  _is_tab_line  ──────────────────────
# Verifica se a linha parece uma linha de tablatura, ou seja,
# começa com uma das strings de início de tablatura ou contém
# pelo menos 5 traços consecutivos.
def _is_tab_line(line: str) -> bool:
    """Retorna True se a linha for uma linha de tablatura."""
    return (
        line.lstrip().startswith(_TAB_STARTS)
        or line.count("-") >= 5
    )

# Extrai blocos de tablatura de uma cifra, retornando
# um texto contendo apenas as linhas de tablatura.
# Cada bloco de tablatura é separado por uma linha em branco.
# Se uma linha não formar um bloco de tablatura, ela é ignorada.
# Exemplo:

def _extract_tabs(cifra: str) -> str:
    out: list[str] = []
    lines = cifra.splitlines()
    n = len(lines)
    i = 0

    while i < n:
        # se a linha atual parece tab...
        if _is_tab_line(lines[i]):
            # ...e as próximas duas linhas também parecem tab
            if i + 2 < n and _is_tab_line(lines[i+1]) and _is_tab_line(lines[i+2]):
                # então coletamos todo o bloco de tablatura
                while i < n and _is_tab_line(lines[i]):
                    out.append(lines[i].rstrip())
                    i += 1
                out.append("")  # separador entre blocos
            else:
                # se não formar mínimo de 3 linhas, ignora só esta
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
    key   = f"{instrument}|{user_email}|{artist_name}|{song_title}"
    raw   = EXECUTOR.invoke({"query": f"Separe letra, acordes e TABs de {key}"})
    resp  = parser.parse(raw["output"])

    # Se o modelo não retornou a cifra mas recebemos via parâmetro,
    # usa‑a imediatamente.
    if not resp.song_cifra and song_cifra:
        resp.song_cifra = song_cifra

    # ─── Fallback absoluto ──────────────────────────────────────
    # Se o LLM devolveu JSON com campos vazios, preenchemos
    # manualmente a partir do userData já em memória.
    if not resp.song_cifra:
        for itm in _get_user_data():
            if (
                itm.get("artist_name", "").lower() == artist_name.lower()
                and itm.get("song_title", "").lower() == song_title.lower()
            ):
                resp.song_cifra = itm.get("song_cifra", "")
                break

    # Completa campos derivados se ainda estiverem vazios
    if not resp.song_cifra_lyrics:
        resp.song_cifra_lyrics = _strip_chords(resp.song_cifra) # LYRICS
    if not resp.song_chords:
        resp.song_chords = _extract_chords(resp.song_cifra) # CHORDS
    if not resp.song_cifra_tab:
        resp.song_cifra_tab = _extract_tabs(resp.song_cifra) # TABs

    logging.info("[agent] output -> %s", resp.model_dump())
    return resp

