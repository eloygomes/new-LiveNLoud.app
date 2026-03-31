import hashlib
import json
import re
import secrets
from datetime import datetime, timezone

import requests


UG_API_ENDPOINT = "https://api.ultimate-guitar.com/api/v1"
UG_USER_AGENT = "UGT_ANDROID/4.11.1 (Pixel; 8.1.0)"
UG_API_TIMEOUT_SECONDS = 20

CHORD_TAG_RE = re.compile(r"\[ch\](.*?)\[/ch\]")
CONTROL_TAG_RE = re.compile(r"\[/?(?:tab|c|b|i|u)\]")


def _ug_headers() -> dict:
    device_id = secrets.token_hex(8)
    now = datetime.now(timezone.utc)
    payload = f"{device_id}{now.strftime('%Y-%m-%d')}:{now.hour}createLog()"
    api_key = hashlib.md5(payload.encode("utf-8")).hexdigest()
    return {
        "Accept-Charset": "utf-8",
        "Accept": "application/json",
        "User-Agent": UG_USER_AGENT,
        "Connection": "close",
        "X-UG-CLIENT-ID": device_id,
        "X-UG-API-KEY": api_key,
    }


def _request_json(path: str, params: dict) -> dict:
    response = requests.get(
        f"{UG_API_ENDPOINT}{path}",
        params=params,
        headers=_ug_headers(),
        timeout=UG_API_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


def _build_chord_line(chords: list[tuple[int, str]]) -> str:
    chord_line = []
    for position, chord in chords:
        if len(chord_line) < position:
            chord_line.extend(" " * (position - len(chord_line)))

        end = position + len(chord)
        if len(chord_line) < end:
            chord_line.extend(" " * (end - len(chord_line)))

        for index, char in enumerate(chord):
            chord_line[position + index] = char

    return "".join(chord_line).rstrip()


def _append_chord_line(lines: list[dict], chord_line: str) -> None:
    chords = []
    leading_spaces = 0

    for chunk in chord_line.split(" "):
        if not chunk:
            leading_spaces += 1
            continue

        chords.append({"note": chunk, "pre_spaces": leading_spaces})
        leading_spaces = 1

    if chords:
        lines.append({"type": "chords", "chords": chords})


def _append_lyric_line(lines: list[dict], lyric_line: str) -> None:
    if lyric_line:
        lines.append({"type": "lyric", "lyric": lyric_line})
    else:
        lines.append({"type": "blank"})


def _parse_content_lines(content: str) -> list[dict]:
    lines = []

    for raw_line in content.replace("\r\n", "\n").split("\n"):
        line = CONTROL_TAG_RE.sub("", raw_line)
        if not line:
            lines.append({"type": "blank"})
            continue

        chord_matches = list(CHORD_TAG_RE.finditer(line))
        if not chord_matches:
            plain_line = line.strip("\r")
            if plain_line:
                lines.append({"type": "lyric", "lyric": plain_line})
            else:
                lines.append({"type": "blank"})
            continue

        lyric_parts = []
        chords = []
        lyric_length = 0
        last_index = 0

        for match in chord_matches:
            text_before = line[last_index:match.start()]
            lyric_parts.append(text_before)
            lyric_length += len(text_before)
            chords.append((lyric_length, match.group(1).strip()))
            last_index = match.end()

        lyric_parts.append(line[last_index:])
        lyric_line = "".join(lyric_parts).rstrip()
        chord_line = _build_chord_line(chords)

        if chord_line:
            _append_chord_line(lines, chord_line)

        if lyric_line.strip():
            lines.append({"type": "lyric", "lyric": lyric_line})
        elif not chord_line:
            lines.append({"type": "blank"})

    return lines


def dict_from_ultimate_tab(url: str) -> json:
    tab_metadata = _request_json("/tab/url", {"url": url})
    tab_id = tab_metadata["id"]
    tab_access_type = tab_metadata.get("tab_access_type", "public")
    tab_info = _request_json(
        "/tab/info",
        {"tab_id": tab_id, "tab_access_type": tab_access_type},
    )

    tab = {
        "title": tab_info["song_name"],
        "artist_name": tab_info["artist_name"],
        "author": tab_info.get("contributor", {}).get("username", "UNKNOWN"),
        "lines": _parse_content_lines(tab_info.get("content", "")),
    }

    if tab_info.get("difficulty"):
        tab["difficulty"] = tab_info["difficulty"]
    if tab_info.get("tonality_name"):
        tab["key"] = tab_info["tonality_name"]
    if tab_info.get("capo") not in (None, ""):
        tab["capo"] = str(tab_info["capo"])
    if tab_info.get("tuning"):
        tab["tuning"] = tab_info["tuning"]

    return {"tab": tab}


def json_from_ultimate_tab(url: str) -> json:
    tab_dict = dict_from_ultimate_tab(url)
    return json.dumps(tab_dict, ensure_ascii=False)

