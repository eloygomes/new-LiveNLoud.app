

# from __future__ import annotations

# """
# Backend Flask – scraping, IA e persistência
# Reescrito para manter *todo* o espaçamento/indentação das cifras e
# evitar perda de formatação nos pontos críticos indicados.
# """

# # ─── IMPORTS ─────────────────────────────────────────────────────
# from flask import Flask, request, jsonify
# from pymongo import MongoClient
# from bs4 import BeautifulSoup
# from datetime import datetime
# import requests
# import logging
# import sys

# # -----------------------------------------------------------------
# logging.basicConfig(
#     level=logging.INFO,
#     format="[%(asctime)s] %(levelname)s  %(message)s",
#     force=True,  # override any previous basicConfig
# )

# # ─── Buffer global visível ao agent_ai ───────────────────────────
# userData: list[dict] = []  # será preenchido pelo scraper antes de chamar o agente

# # Importa somente depois de definir userData (evita import circular)
# from agent_ai import agent  # noqa: E402  pylint: disable=wrong-import-position

# # ─── CONFIG  GERAIS ──────────────────────────────────────────────
# app          = Flask(__name__)
# MONGO_URL    = "mongodb://root:example@db:27017/admin"
# NODE_API_URL = "https://api.live.eloygomes.com.br/api/createMusic"

# # ─────────────────────────────────────────────────────────────────
# # SCRAPER  – mantém espaçamento ORIGINAL
# # ----------------------------------------------------------------

# def get_cifra(url: str) -> list[dict] | None:
#     """Scrape da cifra no CifraClub mantendo formatação completa."""
#     logging.info("Fetching URL %s", url)
#     try:
#         resp = requests.get(url, timeout=15)
#         resp.raise_for_status()
#     except requests.RequestException as exc:
#         logging.error("Request error: %s", exc)
#         return None

#     soup  = BeautifulSoup(resp.text, "html.parser")
#     bloc  = soup.select_one("div.g-1.g-fix.cifra")
#     if not bloc:
#         logging.warning("Cifra block not found in page")
#         return None

#     title   = (bloc.select_one("h1.t1") or {}).get_text(strip=True)
#     artist  = (bloc.select_one("h2.t3") or {}).get_text(strip=True)
#     txtdiv  = bloc.select_one("div.cifra_cnt")

#     # ⚠️  NÃO use strip=True aqui: mantemos tabs, espaços, linhas vazias
#     cifra = txtdiv.get_text("\n", strip=False) if txtdiv else ""

#     return [{
#         "song_title":  title,
#         "artist_name": artist,
#         "song_cifra":  cifra,
#     }]

# # ─────────────────────────────────────────────────────────────────
# # REST  ENDPOINT  /scrape
# # ----------------------------------------------------------------

# @app.route("/scrape", methods=["POST"])
# def scrape_and_store():
#     payload = request.get_json(force=True, silent=True) or {}

#     instrument  = payload.get("instrument")
#     user_email  = payload.get("email")
#     if not instrument or not user_email:
#         return jsonify({"message": "Missing required fields"}), 400

#     link = (payload.get("link") or "").strip()
#     url  = link or f"https://www.cifraclub.com.br/{payload.get('artist')}/{payload.get('song')}/"

#     data = get_cifra(url)
#     logging.info("Scraper returned: %s", data)
#     if not data:
#         return jsonify({"message": "Failed to scrape"}), 500

#     # popula buffer global para agent_ai
#     userData.clear(); userData.extend(data)

#     # ----------------------------------------------------------------
#     # IA – separa letra / acordes / TABs PRESERVANDO formatação
#     # ----------------------------------------------------------------
#     try:
#         s = data[0]
#         logging.info("Calling agent for %s – %s", s["artist_name"], s["song_title"])
#         res = agent(
#             user_email=user_email,
#             song_title=s["song_title"],
#             artist_name=s["artist_name"],
#             instrument=instrument,
#             song_cifra=s["song_cifra"],
#         )
#         logging.info("Agent response OK")

#         # inclui campos derivados – já com espaços preservados
#         s.update({
#             "song_cifra_lyrics": res.song_cifra_lyrics,
#             "song_chords":       res.song_chords,
#             "song_cifra_tab":    res.song_cifra_tab,
#         })
#     except Exception:
#         logging.exception("agent error – continuing with raw scrape data")

#     # ----------------------------------------------------------------
#     # Persistência em Mongo + forward para API Node
#     # ----------------------------------------------------------------
#     try:
#         store_in_mongo(
#             song_data=data,
#             inst=instrument,
#             email=user_email,
#             prog=int(payload.get("instrument_progressbar", 0) or 0),
#             link=link,
#         )
#     except Exception as exc:
#         logging.exception("Mongo error")
#         return jsonify({"message": f"Mongo error: {exc}"}), 500

#     return jsonify({"message": "OK"}), 201

# # ─────────────────────────────────────────────────────────────────
# # Mongo helpers
# # ----------------------------------------------------------------

# def _inst_block(c: dict, active: bool, progress: int, link: str) -> dict:
#     today = datetime.today().strftime("%Y-%m-%d")
#     return {
#         "active":       active,
#         "capo":         "",
#         "tuning":       "",
#         "lastPlay":     today,
#         "songCifra":    c.get("song_cifra", ""),
#         "songLyrics":   c.get("song_cifra_lyrics", ""),
#         "songChords":   c.get("song_chords", ""),
#         "songTabs":     c.get("song_cifra_tab", ""),
#         "progress":     progress,
#         "link":         link,
#     }


# def store_in_mongo(*, song_data: list[dict], inst: str, email: str, prog: int, link: str) -> None:
#     client = MongoClient(MONGO_URL)
#     col    = client["liveNloud_"]["data"]
#     s      = song_data[0]

#     doc = col.find_one({"email": email}) or {"email": email, "userdata": []}
#     userdata = doc["userdata"]

#     record = next((x for x in userdata if x["artist"] == s["artist_name"] and x["song"] == s["song_title"]), None)
#     today  = datetime.today().strftime("%Y-%m-%d")

#     if not record:
#         record = {
#             "id":          max((x["id"] for x in userdata), default=0) + 1,
#             "song":        s["song_title"],
#             "artist":      s["artist_name"],
#             "progressBar": 0,
#             "instruments": {k: False for k in ["guitar01", "guitar02", "bass", "keys", "drums", "voice"]},
#             "guitar01": {}, "guitar02": {}, "bass": {}, "keys": {}, "drums": {}, "voice": {},
#             "embedVideos": [],
#             "addedIn":     today,
#             "updateIn":    today,
#             "email":       email,
#         }
#         userdata.append(record)

#     record["instruments"][inst] = True
#     record[inst] = _inst_block(s, True, prog, link)
#     record["updateIn"] = today

#     col.update_one({"email": email}, {"$set": {"userdata": userdata}}, upsert=True)
#     send_to_node(record)


# def send_to_node(e: dict) -> None:
#     payload = {
#         "song":        e["song"],
#         "artist":      e["artist"],
#         "instruments": e["instruments"],
#         "guitar01":    e.get("guitar01", {}),
#         "guitar02":    e.get("guitar02", {}),
#         "bass":        e.get("bass", {}),
#         "keys":        e.get("keys", {}),
#         "drums":       e.get("drums", {}),
#         "voice":       e.get("voice", {}),
#         "addedIn":     e.get("addedIn"),
#         "setlist":     [],
#     }
#     try:
#         requests.post(NODE_API_URL, json=payload, timeout=15).raise_for_status()
#     except Exception as exc:  # pragma: no cover – log e continua
#         logging.error("Node API error: %s", exc)


# # ─────────────────────────────────────────────────────────────────
# # MAIN  – run Flask
# # ----------------------------------------------------------------
# if __name__ == "__main__":
#     # Dica: defina host=\"0.0.0.0\" p/ docker, senão localhost
#     app.run(host="0.0.0.0", port=8000, debug=False)

from __future__ import annotations

# ─── IMPORTS ─────────────────────────────────────────────────────
from flask import Flask, request, jsonify
from pymongo import MongoClient
import requests, sys, html, re
from bs4 import BeautifulSoup
from datetime import datetime
import logging

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    force=True,  # override any previous basicConfig
)

# ─── Buffer global visível ao agent_ai ───────────────────────────
userData: list = []

# IMPORTA depois de criar userData → sem ciclo
from agent_ai import agent

# ─── CONFIG ──────────────────────────────────────────────────────
app          = Flask(__name__)
MONGO_URL    = "mongodb://root:example@db:27017/admin"
NODE_API_URL = "https://api.live.eloygomes.com.br/api/createMusic"

# ─── HELPERS ─────────────────────────────────────────────────────

def _extract_cifra_html(div_tag: BeautifulSoup) -> str:
    """Retorna o HTML interno de *div.cifra_cnt* **preservando**:
    - quebras de linha (`<br>` → `\n`)
    - espaços múltiplos ( `&nbsp;` → espaço real )
    - todas as _tags_ de formatação ( `<span>`, `<b>`… )
    Assim mantemos exatamente a mesma aparência que o site exibe.
    """
    if not div_tag:
        return ""

    raw = div_tag.decode_contents()          # HTML puro (sem a div wrapper)
    raw = raw.replace("&nbsp;", " ")       # mantém recuos/colunas
    raw = re.sub(r"<br\s*/?>", "\n", raw, flags=re.I)  # quebra de linha
    return raw

# ─── SCRAPER ─────────────────────────────────────────────────────

def get_cifra(url: str):
    try:
        logging.info("Fetching URL %s", url)
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()

        soup   = BeautifulSoup(resp.text, "html.parser")
        block  = soup.find("div", class_="g-1 g-fix cifra")
        if not block:
            return None

        title  = (block.find("h1", class_="t1") or {}).get_text(strip=True)
        artist = (block.find("h2", class_="t3") or {}).get_text(strip=True)
        cifra_div = block.find("div", class_="cifra_cnt")
        cifra_html = _extract_cifra_html(cifra_div)

        return [{
            "song_title":  title,
            "artist_name": artist,
            "song_cifra":  cifra_html,   # ✔ mantém HTML original
        }]
    except Exception:
        logging.exception("scrape error")
        return None

# ─── ENDPOINT /scrape ────────────────────────────────────────────

@app.route("/scrape", methods=["POST"])
def scrape_and_store():
    d = request.json or {}
    instrument  = d.get("instrument")
    user_email  = d.get("email")
    if not (instrument and user_email):
        return jsonify({"message":"Missing required fields"}), 400

    link = (d.get("link") or "").strip()
    url  = link or f"https://www.cifraclub.com.br/{d.get('artist')}/{d.get('song')}/"
    data = get_cifra(url)
    logging.info("Scraper returned: %s", data)
    if not data:
        return jsonify({"message":"Failed to scrape"}), 500

    # preenche buffer global p/ agent_ai
    global userData
    userData.clear(); userData.extend(data)

    try:
        s = data[0]
        logging.info("Calling agent for %s – %s", s["artist_name"], s["song_title"])
        res = agent(user_email, s["song_title"], s["artist_name"], instrument, s["song_cifra"])
        logging.info("Agent raw response: %s", res.model_dump())

        # merge sem alterar a formatação original
        s["song_cifra_lyrics"] = res.song_cifra_lyrics
        s["song_chords"]       = res.song_chords
        s["song_cifra_tab"]    = res.song_cifra_tab

    except Exception:
        logging.exception("agent error")

    try:
        store_in_mongo(data, instrument, user_email,
                       int(d.get("instrument_progressbar",0) or 0), link)
    except Exception as e:
        logging.exception("Mongo error")
        return jsonify({"message":f"Mongo error: {e}"}), 500

    return jsonify({"message":"OK"}), 201

# ─── Mongo helpers (inalterados) ─────────────────────────────────

def _inst_block(c, active, p, link):
    return {
        "active": active,
        "capo": "",
        "tuning": "",
        "lastPlay": datetime.today().strftime("%Y-%m-%d"),
        "songCifra": c.get("song_cifra", ""),
        "songLyrics": c.get("song_cifra_lyrics", ""),
        "songChords": c.get("song_chords", ""),
        "songTabs": c.get("song_cifra_tab", ""),
        "progress": p,
        "link": link,
    }


def store_in_mongo(song_data, inst, email, prog, link):
    client = MongoClient(MONGO_URL)
    col    = client["liveNloud_"]["data"]
    s      = song_data[0]

    doc = col.find_one({"email": email}) or {"email": email, "userdata": []}
    ud  = doc["userdata"]
    e   = next((x for x in ud if x["artist"] == s["artist_name"] and x["song"] == s["song_title"]), None)

    if not e:
        e = {
            "id": max([x["id"] for x in ud], default=0) + 1,
            "song": s["song_title"],
            "artist": s["artist_name"],
            "progressBar": 0,
            "instruments": {k: False for k in ["guitar01", "guitar02", "bass", "keys", "drums", "voice"]},
            "guitar01": {}, "guitar02": {}, "bass": {}, "keys": {}, "drums": {}, "voice": {},
            "embedVideos": [],
            "addedIn": datetime.today().strftime("%Y-%m-%d"),
            "updateIn": datetime.today().strftime("%Y-%m-%d"),
            "email": email,
        }
        ud.append(e)

    e["instruments"][inst] = True
    e[inst] = _inst_block(s, True, prog, link)
    e["updateIn"] = datetime.today().strftime("%Y-%m-%d")

    col.update_one({"email": email}, {"$set": {"userdata": ud}}, upsert=True)
    send_to_node(e)


def send_to_node(e):
    try:
        payload = {
            "song": e["song"],
            "artist": e["artist"],
            "instruments": e["instruments"],
            "guitar01": e.get("guitar01", {}),
            "guitar02": e.get("guitar02", {}),
            "bass": e.get("bass", {}),
            "keys": e.get("keys", {}),
            "drums": e.get("drums", {}),
            "voice": e.get("voice", {}),
            "addedIn": e.get("addedIn"),
            "setlist": [],
        }
        requests.post(NODE_API_URL, json=payload, timeout=15).raise_for_status()
    except Exception:
        logging.exception("Node API error")

# ─── MAIN ────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
