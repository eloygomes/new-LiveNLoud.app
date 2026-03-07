import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

from cifra_utils import song_cifra_treatment
from ultimate_guitar_service import get_ultimate_guitar_data


def get_cifra(url):
    try:
        print(f"Fetching URL: {url}")
        response = requests.get(url)
        response.raise_for_status()
        print(f"Response status code: {response.status_code}")

        soup = BeautifulSoup(response.text, 'html.parser')
        songData = []
        songElements = soup.find_all('div', class_='g-1 g-fix cifra')

        if not songElements:
            print("No song elements found on the page.")
            return None

        for elem in songElements:
            songTitle  = elem.find('h1', class_='t1')
            artistName = elem.find('h2', class_='t3')
            cifraDiv   = elem.find('div', class_='cifra_cnt')

            title  = songTitle.text.strip()  if songTitle  else 'Unknown Title'
            artist = artistName.text.strip() if artistName else 'Unknown Artist'
            cifra  = cifraDiv.text.strip()    if cifraDiv   else 'No Cifra'

            songData.append({
                'song_title':  title,
                'artist_name': artist,
                'song_cifra':  cifra
            })

        # Always treat the first scraped block
        first = songData[0]
        treat = song_cifra_treatment(first['song_cifra'])
        enriched = {
            'song_title':  first['song_title'],
            'artist_name': first['artist_name'],
            'song_cifra':  first['song_cifra'],
            'songTabs':    treat['songTabs'],
            'songChords':  treat['songChords'],
            'songLyrics':  treat['songLyrics'],
        }
        return [enriched]

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


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
    host = parsed.netloc.lower()
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


def detect_source(url: str):
    host = urlparse(url).netloc.lower()

    if "tabs.ultimate-guitar.com" in host:
        return "ultimate_guitar"
    if "cifraclub.com.br" in host or "sscdn.co" in host:
        return "cifraclub"
    return "unknown"


def get_song_data(url: str):
    source = detect_source(url)

    if source == "cifraclub":
        # Keep CifraClub URL exactly as provided by the user.
        # Only PDF links are converted to an HTML cifra URL fallback.
        parsed = urlparse(url)
        if parsed.path.lower().endswith(".pdf"):
            normalized = normalize_cifraclub_url(url)
            if not normalized:
                return None
            return get_cifra(normalized)
        return get_cifra(url)

    if source == "ultimate_guitar":
        return get_ultimate_guitar_data(url)

    return None
