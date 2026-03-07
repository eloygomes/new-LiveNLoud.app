from urllib.parse import urlparse


def _slug_to_title(slug: str) -> str:
    return " ".join(chunk.capitalize() for chunk in slug.split("-") if chunk)


def _parse_ug_tab_url(url: str):
    parsed = urlparse(url)
    segments = [s for s in parsed.path.split("/") if s]

    # Expected pattern:
    # /tab/{artist-slug}/{song-slug}-{arrangement}-{tab-id}
    if len(segments) < 3 or segments[0] != "tab":
        return None

    artist_slug = segments[1]
    tail_slug = segments[2]
    tail_parts = [p for p in tail_slug.split("-") if p]

    if len(tail_parts) < 3:
        return None

    tab_id = tail_parts[-1]
    arrangement = tail_parts[-2]
    song_slug = "-".join(tail_parts[:-2])

    return {
        "artist_slug": artist_slug,
        "song_slug": song_slug,
        "arrangement": arrangement,
        "tab_id": tab_id,
    }


def get_ultimate_guitar_data(url: str):
    """
    Initial UG integration scaffold.
    This returns normalized metadata and keeps text fields empty for now.
    """
    parsed = _parse_ug_tab_url(url)
    if not parsed:
        return None

    return [{
        "song_title": _slug_to_title(parsed["song_slug"]),
        "artist_name": _slug_to_title(parsed["artist_slug"]),
        "song_cifra": "",
        "songTabs": "",
        "songChords": "",
        "songLyrics": "",
        "source": "ultimate_guitar",
        "arrangement": parsed["arrangement"],
        "tab_id": parsed["tab_id"],
        "source_url": url,
    }]
