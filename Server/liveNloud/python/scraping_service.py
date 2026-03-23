from importlib import import_module
from urllib.parse import urlparse

from source_rules import detect_source, get_source_rule


def _build_default_cifraclub_url(artist: str, song: str) -> str:
    artist_slug = str(artist or "").strip().strip("/")
    song_slug = str(song or "").strip().strip("/")
    return f"https://www.cifraclub.com.br/{artist_slug}/{song_slug}/"


def _normalize_input_url(url: str, artist: str = "", song: str = "") -> str | None:
    cleaned_url = str(url or "").strip()
    if cleaned_url:
        parsed = urlparse(cleaned_url)
        if parsed.scheme and parsed.netloc:
            return cleaned_url

    if artist and song:
        return _build_default_cifraclub_url(artist, song)

    return None


def get_song_data(url: str, artist: str = "", song: str = ""):
    target_url = _normalize_input_url(url, artist, song)
    if not target_url:
        return None

    rule = get_source_rule(target_url)
    if not rule:
        print(f"Unsupported source for URL: {target_url}")
        return None

    module = import_module(rule["service_module"])
    service_fn = getattr(module, rule["service_function"])

    song_data = service_fn(target_url)
    if not song_data:
        return None

    source_name = detect_source(target_url)
    for item in song_data:
        item.setdefault("source", source_name)
        item.setdefault("source_url", target_url)

    return song_data
