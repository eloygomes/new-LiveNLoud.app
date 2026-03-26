import os

from flask import Flask, request, jsonify

from scraping_service import get_song_data
from source_rules import detect_source
from storage_service import store_in_mongo

app = Flask(__name__)
app.config["TRUSTED_HOSTS"] = [
    host.strip()
    for host in os.getenv(
        "TRUSTED_HOSTS",
        "localhost,127.0.0.1,python_scraper,python_scraper:8000",
    ).split(",")
    if host.strip()
]


def sanitize_scrape_link(link: str) -> str:
    raw = str(link or "").strip()
    if not raw:
        return ""

    half = len(raw) // 2
    if len(raw) % 2 == 0 and half > 0 and raw[:half] == raw[half:]:
        return raw[:half]

    return raw


@app.route('/scrape', methods=['POST'])
def scrape_and_store():
    print("[SCRAPER DEBUG] request.host =", request.host, flush=True)
    print("[SCRAPER DEBUG] Host header =", request.headers.get("Host"), flush=True)
    print("[SCRAPER DEBUG] headers =", dict(request.headers), flush=True)
    data = request.json

    link_url = sanitize_scrape_link(data.get('link'))
    artist = data.get('artist')
    song = data.get('song')
    instrument = data.get('instrument')
    userEmail = data.get('email')
    instrument_progressbar = data.get('instrument_progressbar')

    if not userEmail or not instrument:
        return jsonify({"message": "Missing required fields"}), 400

    url_to_fetch = (link_url or "").strip()
    if not url_to_fetch and not (artist and song):
        return jsonify({"message": "Missing link or artist/song"}), 400

    source_name = detect_source(url_to_fetch) if url_to_fetch else "cifraclub"
    try:
        songData = get_song_data(url_to_fetch, artist=artist, song=song)
    except Exception as err:
        print(f"[SCRAPER] source='{source_name}' error: {err}")
        return jsonify({
            "message": f"Could not scrape this link from source '{source_name}'.",
            "details": str(err),
            "source": source_name,
            "link": url_to_fetch,
        }), 500

    if songData:
        store_in_mongo(songData, instrument, userEmail, instrument_progressbar, link_url)
        return jsonify({"message": "Data stored successfully"}), 201
    else:
        return jsonify({
            "message": f"Could not scrape this link from source '{source_name}'.",
            "details": "Check if the URL is valid, if the page is public, and review Python scraper logs for selector or request errors.",
            "source": source_name,
            "link": url_to_fetch,
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
