import importlib.util
import os
import shutil
from urllib.parse import urlparse

from flask import Flask, request, jsonify

from scraping_service import get_song_data
from source_rules import detect_source
from storage_service import store_in_mongo
from config import SCRAPER_ARCHITECTURE
from import_v2 import ImportService
from import_v2.models import ImportPipelineError

app = Flask(__name__)
import_service = ImportService() if SCRAPER_ARCHITECTURE == "v2" else None
print(f"[SCRAPER] architecture='{SCRAPER_ARCHITECTURE}'")


REQUIRED_FIELDS = ("email", "instrument")


def sanitize_scrape_link(link: str) -> str:
    raw = str(link or "").strip()
    if not raw:
        return ""

    half = len(raw) // 2
    if len(raw) % 2 == 0 and half > 0 and raw[:half] == raw[half:]:
        return raw[:half]

    return raw


def _normalized_host(url: str) -> str:
    return urlparse(str(url or "")).netloc.lower().replace("www.", "")


def _build_scrape_payload(data: dict) -> dict:
    link_url = sanitize_scrape_link(data.get("link"))
    source_content = data.get("source_content")
    if not isinstance(source_content, str) or len(source_content) > 2_000_000:
        source_content = ""
    return {
        "artist": data.get("artist"),
        "song": data.get("song"),
        "instrument": data.get("instrument"),
        "email": data.get("email"),
        "instrument_progressbar": data.get("instrument_progressbar"),
        "link": link_url,
        "url_to_fetch": link_url.strip(),
        "source_content": source_content,
        "source_content_format": data.get("source_content_format", ""),
    }


def _validate_scrape_payload(payload: dict):
    missing_fields = [field for field in REQUIRED_FIELDS if not payload.get(field)]
    if missing_fields:
        return f"Missing required fields: {', '.join(missing_fields)}"

    if not payload["url_to_fetch"] and not (payload.get("artist") and payload.get("song")):
        return "Missing link or artist/song"

    return None


@app.route('/scrape', methods=['POST'])
def scrape_and_store():
    data = request.get_json(silent=True) or {}

    if not data:
        return jsonify({
            "message": "Invalid or missing JSON payload",
            "details": "The scraper expected application/json with artist, song, instrument, email and link.",
        }), 400

    payload = _build_scrape_payload(data)
    validation_error = _validate_scrape_payload(payload)
    if validation_error:
        return jsonify({"message": validation_error}), 400

    url_to_fetch = payload["url_to_fetch"]
    source_name = detect_source(url_to_fetch) if url_to_fetch else "cifraclub"
    link_host = _normalized_host(url_to_fetch)

    if source_name == "letrasmus" and payload["instrument"] != "voice":
        print("[SCRAPER] letrasmus rejected for non-voice instrument", {
            "instrument": payload["instrument"],
            "link": url_to_fetch,
            "host": link_host,
        })
        return jsonify({
            "message": "Esse link deve ser usado no campo Voice",
            "source": source_name,
            "link": url_to_fetch,
        }), 400

    try:
        use_v2 = import_service is not None and bool(url_to_fetch) and source_name in {"cifraclub", "ultimate_guitar"}
        songData = (
            import_service.import_url(
                url_to_fetch,
                source_content=payload["source_content"],
                source_content_format=payload["source_content_format"],
            )
            if use_v2
            else get_song_data(
                url_to_fetch,
                artist=payload["artist"],
                song=payload["song"],
                source_content=payload["source_content"],
                source_content_format=payload["source_content_format"],
            )
        )
    except ImportPipelineError as err:
        print(f"[SCRAPER] source='{source_name}' code='{err.code.value}' error: {err}")
        return jsonify({
            "message": f"Could not scrape this link from source '{source_name}'.",
            "details": str(err), "code": err.code.value,
            "source": source_name, "link": url_to_fetch,
        }), 500
    except Exception as err:
        print(f"[SCRAPER] source='{source_name}' error: {err}")
        return jsonify({
            "message": f"Could not scrape this link from source '{source_name}'.",
            "details": str(err),
            "source": source_name,
            "link": url_to_fetch,
        }), 500

    if songData:
        store_in_mongo(
            songData,
            payload["instrument"],
            payload["email"],
            payload["instrument_progressbar"],
            payload["link"],
        )
        return jsonify({
            "message": "Data stored successfully",
            "songData": songData[0] if songData else None,
        }), 201
    else:
        return jsonify({
            "message": f"Could not scrape this link from source '{source_name}'.",
            "details": "Check if the URL is valid, if the page is public, and review Python scraper logs for selector or request errors.",
            "source": source_name,
            "link": url_to_fetch,
        }), 500


@app.route('/health', methods=['GET'])
def health():
    hero_script = os.getenv(
        "SCRAPER_HERO_SCRIPT",
        os.path.join(os.path.dirname(__file__), "hero_fetcher.mjs"),
    )
    hero_module = os.path.join(
        os.path.dirname(hero_script), "node_modules", "@ulixee", "hero", "package.json"
    )
    return jsonify({
        "status": "ok",
        "scraperArchitecture": SCRAPER_ARCHITECTURE,
        "v2Enabled": import_service is not None,
        "fetchEngines": {
            "current": {"available": True},
            "camoufox": {"available": importlib.util.find_spec("camoufox") is not None},
            "hero": {
                "available": shutil.which(os.getenv("SCRAPER_NODE_BINARY", "node")) is not None
                and os.path.isfile(hero_script)
                and os.path.isfile(hero_module),
                "moduleInstalled": os.path.isfile(hero_module),
            },
        },
    }), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
