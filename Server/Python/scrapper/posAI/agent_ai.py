
from __future__ import annotations

# ─────────────────────────  IMPORTS  ──────────────────────────────
import re
import sys
import importlib
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel

import logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    force=True,
)

# LangChain
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import PydanticOutputParser
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain.memory import ConversationBufferMemory
from langchain.tools import Tool

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

def _is_chord_only(line: str) -> bool:
    return _CHORD_RE.sub("", line).strip() == "" and bool(_CHORD_RE.search(line))

def _strip_chords(cifra: str) -> str:
    return "\n".join(
        _CHORD_RE.sub("", l)
        for l in cifra.splitlines()
        if not _META_RE.match(l) and not _is_chord_only(l)
    )

def _extract_chords(cifra: str) -> str:
    return "\n".join(
        " ".join(m)
        for l in cifra.splitlines()
        if not _META_RE.match(l) and (m := _CHORD_RE.findall(l))
    )

def _extract_tabs(cifra: str) -> str:
    out, lines = [], cifra.splitlines()
    i = 0
    while i < len(lines):
        ln = lines[i].rstrip()
        is_tab = ln.lstrip().startswith(_TAB_STARTS) or ln.count("-") >= 5
        if is_tab:
            if i > 0 and _CHORD_RE.search(lines[i - 1]):
                out.append(lines[i - 1].rstrip())
            while i < len(lines) and (
                lines[i].lstrip().startswith(_TAB_STARTS) or lines[i].count("-") >= 5
            ):
                out.append(lines[i].rstrip())
                i += 1
            out.append("")
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
        resp.song_cifra_lyrics = _strip_chords(resp.song_cifra)
    if not resp.song_chords:
        resp.song_chords = _extract_chords(resp.song_cifra)
    if not resp.song_cifra_tab:
        resp.song_cifra_tab = _extract_tabs(resp.song_cifra)

    logging.info("[agent] output -> %s", resp.model_dump())
    return resp

# ─────────────────────────  Teste rápido  ────────────────────────
if __name__ == "__main__":
    # Para testar isoladamente:
    import scrapper  # garante que userData existe
    scrapper.userData.append(
        {
            "song_title": "Pescador de Ilusões",
            "artist_name": "O Rappa",
            "song_cifra": "tom:C\nAm  G\nLetra ...\n",
        }
    )
    r = agent("teste@teste.com", "Pescador de Ilusões", "O Rappa")
    print(r.model_dump())