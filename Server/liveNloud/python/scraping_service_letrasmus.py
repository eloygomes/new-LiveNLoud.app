import re
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from bs4 import NavigableString


MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 "
    "Mobile/15E148 Safari/604.1"
)


def _clean(text: str) -> str:
    text = str(text or "").replace("\r", "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _slug_to_title(slug: str) -> str:
    return " ".join(chunk.capitalize() for chunk in str(slug or "").split("-") if chunk)


def _extract_title_artist_from_url(url: str):
    parsed = urlparse(url)
    segments = [segment for segment in parsed.path.split("/") if segment]

    if len(segments) >= 2:
        return {
            "artist_name": _slug_to_title(segments[0]),
            "song_title": _slug_to_title(segments[1]),
        }

    return {
        "artist_name": "Unknown Artist",
        "song_title": "Unknown Title",
    }


def _extract_song_metadata(soup: BeautifulSoup, url: str):
    fallback = _extract_title_artist_from_url(url)
    header = soup.select_one("article#js-lyricHeader.head.--lyric, article#js-lyricHeader")

    song_title = ""
    artist_name = ""

    if header:
        title_el = header.select_one(".title-content h1")
        artist_el = header.select_one(".title-content h2")
        song_title = _clean(title_el.get_text(" ", strip=True) if title_el else "")
        artist_name = _clean(artist_el.get_text(" ", strip=True) if artist_el else "")

    if not song_title:
        title_el = soup.select_one(
            "#js-lyricHeader .title-primary h1, "
            "#js-lyricHeader h1, "
            "h1.textStyle-primary, "
            ".cnt-head_title h1, "
            "h1"
        )
        song_title = _clean(title_el.get_text(" ", strip=True) if title_el else "")

    if not artist_name:
        artist_el = soup.select_one(
            "#js-lyricHeader .title-secondary h2, "
            "h2.textStyle-secondary, "
            ".cnt-head_title h2, "
            ".cnt-head_title h2 a"
        )
        artist_name = _clean(artist_el.get_text(" ", strip=True) if artist_el else "")

    return {
        "song_title": song_title or fallback["song_title"],
        "artist_name": artist_name or fallback["artist_name"],
    }


def _extract_lyrics_from_paragraphs(container) -> str:
    lyrics_parts = []
    for paragraph in container.find_all("p"):
        for br in paragraph.find_all("br"):
            br.replace_with("\n")

        chunk = _clean(paragraph.get_text("\n", strip=True))
        if chunk:
            lyrics_parts.append(chunk)

    return _clean("\n\n".join(lyrics_parts))


def _extract_lyrics_from_text_nodes(container) -> str:
    for br in container.find_all("br"):
        br.replace_with("\n")

    chunks = []
    current = []

    for node in container.children:
        if getattr(node, "name", None) == "script":
            continue
        if getattr(node, "get", None) and node.get("class") and "viewFractions" in node.get("class", []):
            continue

        text = ""
        if isinstance(node, NavigableString):
            text = str(node)
        else:
            text = node.get_text("\n", strip=False)

        text = text.replace("\xa0", " ")
        if text.strip():
            current.append(text)
        else:
            paragraph = _clean("".join(current))
            if paragraph:
                chunks.append(paragraph)
            current = []

    paragraph = _clean("".join(current))
    if paragraph:
        chunks.append(paragraph)

    return _clean("\n\n".join(chunks))


def _extract_lyrics(soup: BeautifulSoup) -> str:
    selector_candidates = [
        "div.lyric-original",
        ".lyric-original",
        ".lyric-translation-left",
        ".lyric-content",
        ".cnt-letra",
        ".letra",
        ".cnt-letra-trad",
        '[data-testid="lyrics-container"]',
    ]

    lyrics_container = None
    matched_selector = ""
    for selector in selector_candidates:
        lyrics_container = soup.select_one(selector)
        if lyrics_container:
            matched_selector = selector
            break

    if not lyrics_container:
        print("[LETRAS DEBUG] No lyrics container found.", {
            "selector_candidates": selector_candidates,
            "title_present": bool(soup.select_one("h1")),
            "body_classes": soup.body.get("class", []) if soup.body else [],
        })
        return ""

    print("[LETRAS DEBUG] Lyrics container found.", {
        "selector": matched_selector,
        "paragraphs": len(lyrics_container.find_all("p")),
        "preview": _clean(lyrics_container.get_text("\n", strip=True))[:240],
    })

    lyrics = _extract_lyrics_from_paragraphs(lyrics_container)
    if lyrics:
        return lyrics

    lyrics = _extract_lyrics_from_text_nodes(lyrics_container)
    if lyrics:
        return lyrics

    fallback_text = _clean(lyrics_container.get_text("\n", strip=True))
    return fallback_text


def get_letrasmus_data(url: str):
    try:
        headers = {
            "User-Agent": MOBILE_UA,
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        metadata = _extract_song_metadata(soup, url)
        lyrics = _extract_lyrics(soup)

        print("[LETRAS DEBUG] Metadata parsed.", {
            "url": url,
            "song_title": metadata["song_title"],
            "artist_name": metadata["artist_name"],
            "lyrics_length": len(lyrics),
        })

        if not lyrics:
            print("[LETRAS DEBUG] Lyrics not found.", {
                "url": url,
                "response_url": response.url,
                "status_code": response.status_code,
                "title_selectors": {
                    "js_lyric_header": bool(soup.select_one("#js-lyricHeader")),
                    "text_style_primary": bool(soup.select_one("h1.textStyle-primary")),
                    "legacy_header": bool(soup.select_one(".cnt-head_title")),
                },
            })
            return None

        return [{
            "song_title": metadata["song_title"],
            "artist_name": metadata["artist_name"],
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
