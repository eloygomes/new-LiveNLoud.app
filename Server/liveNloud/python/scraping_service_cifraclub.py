from urllib.parse import urlparse

import requests
from bs4 import NavigableString
from bs4 import BeautifulSoup


def _clean_text(text: str) -> str:
    text = str(text or "").replace("\r", "")
    lines = [line.rstrip() for line in text.splitlines()]
    return "\n".join(lines).strip()


def _split_cifra_sections(song_cifra: str):
    lines = song_cifra.splitlines()
    tabs = []
    chords = []
    lyrics = []

    for raw_line in lines:
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped:
            lyrics.append("")
            continue

        has_chord_markers = any(token in stripped for token in ("[", "]"))
        likely_tab = any(char in stripped for char in ("|", "-", "~")) and not has_chord_markers

        if likely_tab:
            tabs.append(line)
            continue

        if has_chord_markers:
            chords.append(line)
            continue

        lyrics.append(line)

    return {
        "songTabs": "\n".join(tabs).strip(),
        "songChords": "\n".join(chords).strip(),
        "songLyrics": "\n".join(lyrics).strip(),
    }


def _extract_artist_song_from_pdf(url: str):
    parsed = urlparse(url)
    filename = parsed.path.rsplit("/", 1)[-1]
    slug = filename[:-4] if filename.lower().endswith(".pdf") else filename
    parts = [p for p in slug.split("-") if p]

    if len(parts) >= 4:
        artist = "-".join(parts[:2])
        song = "-".join(parts[2:])
    elif len(parts) >= 2:
        artist = parts[0]
        song = "-".join(parts[1:])
    else:
        return None

    return artist, song


def normalize_cifraclub_url(url: str):
    parsed = urlparse(url)
    path = parsed.path or ""

    if path.lower().endswith(".pdf"):
        artist_song = _extract_artist_song_from_pdf(url)
        if not artist_song:
            return None
        artist, song = artist_song
        return f"https://www.cifraclub.com.br/{artist}/{song}/"

    segments = [s for s in path.split("/") if s]
    if len(segments) < 2:
        return None

    artist = segments[0]
    song = segments[1]
    return f"https://www.cifraclub.com.br/{artist}/{song}/"


def _extract_text_from_paragraphs(container) -> str:
    paragraphs = []

    for paragraph in container.find_all("p"):
        for br in paragraph.find_all("br"):
            br.replace_with("\n")

        paragraph_text = paragraph.get_text("\n", strip=True)
        paragraph_text = _clean_text(paragraph_text)
        if paragraph_text:
            paragraphs.append(paragraph_text)

    return _clean_text("\n\n".join(paragraphs))


def _extract_lyrics_from_song_content(first) -> str:
    lyrics_container = (
        first.select_one(".songContent .letra .letra-l")
        or first.select_one(".songContent .letra")
        or first.select_one(".songContent")
    )

    if not lyrics_container:
        return ""

    translation = lyrics_container.select_one(".letra-t")
    if translation:
        translation.decompose()

    lyrics = _extract_text_from_paragraphs(lyrics_container)
    if lyrics:
        return lyrics

    for br in lyrics_container.find_all("br"):
        br.replace_with("\n")

    return _clean_text(lyrics_container.get_text("\n", strip=True))


def _extract_cifra_text(cifra_el) -> str:
    if not cifra_el:
        return ""

    for br in cifra_el.find_all("br"):
        br.replace_with("\n")

    extracted_parts = []
    for node in cifra_el.descendants:
        if isinstance(node, NavigableString):
            extracted_parts.append(str(node))

    song_cifra = "".join(extracted_parts)
    song_cifra = song_cifra.replace("\r", "")
    song_cifra = "\n".join(line.rstrip() for line in song_cifra.splitlines())
    return song_cifra.strip("\n")


def get_cifraclub_data(url: str):
    try:
        parsed = urlparse(url)
        normalized_url = url

        if parsed.path.lower().endswith(".pdf"):
            normalized_url = normalize_cifraclub_url(url)
            if not normalized_url:
                return None

        response = requests.get(normalized_url, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")
        song_elements = soup.find_all("div", class_="g-1 g-fix cifra")
        if not song_elements:
            return None

        first = song_elements[0]
        title_el = first.find("h1", class_="t1")
        artist_el = first.find("h2", class_="t3")
        cifra_el = first.find("div", class_="cifra_cnt")
        tom_el = first.select_one("#cifra_tom a")
        tuning_el = first.select_one("#cifra_afi a")
        tuning_value_el = first.select_one('input[data-cy="song-tuningValue"]')
        capo_el = first.select_one("#cifra_capo")

        song_cifra = _extract_cifra_text(cifra_el)
        treated = _split_cifra_sections(song_cifra)
        song_lyrics = treated["songLyrics"] or _extract_lyrics_from_song_content(first)

        if not song_cifra and not song_lyrics:
            return None

        capo_text = capo_el.get_text(" ", strip=True) if capo_el else ""
        if ":" in capo_text:
          capo_text = capo_text.split(":", 1)[1].strip()

        return [{
            "song_title": title_el.get_text(strip=True) if title_el else "Unknown Title",
            "artist_name": artist_el.get_text(strip=True) if artist_el else "Unknown Artist",
            "song_cifra": song_cifra,
            "songTabs": treated["songTabs"],
            "songChords": treated["songChords"],
            "songLyrics": song_lyrics,
            "capo": capo_text,
            "tom": tom_el.get_text(strip=True) if tom_el else "",
            "tuning": (
                tuning_value_el.get("value", "").strip()
                if tuning_value_el
                else (tuning_el.get_text(strip=True) if tuning_el else "")
            ),
            "source": "cifraclub",
            "source_url": normalized_url,
        }]
    except requests.exceptions.HTTPError as http_err:
        print(f"CifraClub HTTP error: {http_err}")
        return None
    except Exception as err:
        print(f"CifraClub scrape error: {err}")
        return None
