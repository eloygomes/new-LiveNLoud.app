import re

import requests
from bs4 import BeautifulSoup


MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 "
    "Mobile/15E148 Safari/604.1"
)


def _clean(text: str) -> str:
    text = text.replace("\r", "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def get_letrasmus_data(url: str):
    try:
        headers = {
            "User-Agent": MOBILE_UA,
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        title_el = soup.select_one("h1.textStyle-primary")
        artist_el = soup.select_one("h2.textStyle-secondary")

        lyrics_container = soup.select_one(".lyric-translation-left")
        if not lyrics_container:
            lyrics_container = soup.select_one(".lyric-content")

        lyrics_parts = []
        if lyrics_container:
            for paragraph in lyrics_container.find_all("p"):
                chunk = _clean(paragraph.get_text("\n", strip=True))
                if chunk:
                    lyrics_parts.append(chunk)

        lyrics = _clean("\n\n".join(lyrics_parts))

        return [{
            "song_title": title_el.get_text(strip=True) if title_el else "Unknown Title",
            "artist_name": artist_el.get_text(strip=True) if artist_el else "Unknown Artist",
            "song_cifra": "",
            "songTabs": "",
            "songChords": "",
            "songLyrics": lyrics,
            "source": "letrasmus",
            "source_url": url,
        }]
    except requests.exceptions.HTTPError as http_err:
        print(f"Letras Mus HTTP error: {http_err}")
        return None
    except Exception as err:
        print(f"Letras Mus scrape error: {err}")
        return None
