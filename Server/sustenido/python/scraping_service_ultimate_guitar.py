import re
import os
import hashlib
import secrets
from urllib.parse import urlparse
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import WebDriverException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


CHROME_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/134.0.0.0 Safari/537.36"
)

UG_API_ENDPOINT = "https://api.ultimate-guitar.com/api/v1"
UG_API_USER_AGENT = "UGT_ANDROID/4.11.1 (Pixel; 8.1.0)"
UG_API_TIMEOUT_SECONDS = 20
CHORD_TOKEN_RE = re.compile(r"^[A-G][#b]?(?:m|maj|min|sus|dim|aug|add|mmaj)?[0-9/#bA-G()]*$")
CHORD_TAG_RE = re.compile(r"\[ch\](.*?)\[/ch\]")
CONTROL_TAG_RE = re.compile(r"\[/?(?:tab|c|b|i|u)\]")


class UltimateGuitarScrapeError(RuntimeError):
    pass


UG_SCRAPER_ENABLED = os.getenv("UG_SCRAPER_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
    "on",
}


def _slug_to_title(slug: str) -> str:
    return " ".join(chunk.capitalize() for chunk in slug.split("-") if chunk)


def _ug_headers() -> dict:
    device_id = secrets.token_hex(8)
    now = datetime.now(timezone.utc)
    payload = f"{device_id}{now.strftime('%Y-%m-%d')}:{now.hour}createLog()"
    api_key = hashlib.md5(payload.encode("utf-8")).hexdigest()
    return {
        "Accept-Charset": "utf-8",
        "Accept": "application/json",
        "User-Agent": UG_API_USER_AGENT,
        "Connection": "close",
        "X-UG-CLIENT-ID": device_id,
        "X-UG-API-KEY": api_key,
    }


def _request_ug_json(path: str, params: dict) -> dict:
    response = requests.get(
        f"{UG_API_ENDPOINT}{path}",
        params=params,
        headers=_ug_headers(),
        timeout=UG_API_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


def _clean_text(value: str) -> str:
    value = value.replace("\r", "")
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def _parse_ug_tab_url(url: str):
    parsed = urlparse(url)
    segments = [segment for segment in parsed.path.split("/") if segment]

    if len(segments) < 3 or segments[0] != "tab":
        return None

    artist_slug = segments[1]
    tail_slug = segments[2]
    tail_parts = [part for part in tail_slug.split("-") if part]

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


def _extract_header_metadata(soup: BeautifulSoup):
    metadata = {}
    for item in soup.select("ul.tabHeader-info li.tabHeader-item"):
        name_el = item.select_one(".tabHeader-name")
        if not name_el:
            continue

        label = name_el.get_text(" ", strip=True).replace(":", "").strip().lower()
        value = item.get_text(" ", strip=True)
        value = value.replace(name_el.get_text(" ", strip=True), "", 1).strip()

        if label and value:
            metadata[label] = value

    return metadata


def _extract_song_title(soup: BeautifulSoup, fallback_slug: str):
    title_header = soup.select_one("h1.tabHeader-h1")
    if not title_header:
        return _slug_to_title(fallback_slug)

    artist_el = title_header.select_one(".tabHeader-h2")
    artist_text = artist_el.get_text(" ", strip=True) if artist_el else ""
    header_text = title_header.get_text(" ", strip=True)

    if " by " in header_text:
        return header_text.split(" by ", 1)[0].strip()

    if artist_text and header_text.endswith(artist_text):
        return header_text[: -len(artist_text)].strip()

    return header_text.strip() or _slug_to_title(fallback_slug)


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


def _parse_ug_content_lines(content: str) -> list[dict]:
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
            lines.append({"type": "chords", "chords": chord_line})

        if lyric_line.strip():
            lines.append({"type": "lyric", "lyric": lyric_line})
        elif not chord_line:
            lines.append({"type": "blank"})

    return lines


def _body_from_ug_lines(lines: list[dict]) -> str:
    rendered_lines = []

    for line in lines:
        line_type = line.get("type")
        if line_type == "blank":
            rendered_lines.append("")
        elif line_type == "lyric":
            rendered_lines.append(str(line.get("lyric", "")))
        elif line_type == "chords":
            chord_value = line.get("chords", "")
            if isinstance(chord_value, str):
                rendered_lines.append(chord_value)
            else:
                pieces = []
                for chord in chord_value or []:
                    pre_spaces = max(int(chord.get("pre_spaces", 0)), 0)
                    pieces.append((" " * pre_spaces) + str(chord.get("note", "")))
                rendered_lines.append("".join(pieces).rstrip())
        else:
            rendered_lines.append(str(line.get("lyric", "")))

    return _clean_text("\n".join(rendered_lines))


def _is_chord_only_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False

    if stripped.startswith("[") and stripped.endswith("]"):
        return False

    tokens = [token for token in re.split(r"\s+", stripped) if token]
    if not tokens:
        return False

    return all(CHORD_TOKEN_RE.match(token) for token in tokens)


def _extract_lyrics_from_body(body: str) -> str:
    lyrics_lines = []

    for line in body.splitlines():
        stripped = line.strip()
        if not stripped:
            lyrics_lines.append("")
            continue

        if stripped.startswith("[") and stripped.endswith("]"):
            continue

        if _is_chord_only_line(line):
            continue

        lyrics_lines.append(line.rstrip())

    return _clean_text("\n".join(lyrics_lines))


def _build_song_fields(arrangement: str, body: str):
    arrangement_key = arrangement.lower()
    song_tabs = ""
    song_chords = ""

    if arrangement_key in {"tab", "tabs", "bass", "drums"}:
        song_tabs = body
    elif arrangement_key in {"chords", "ukulele", "official"}:
        song_chords = body
    else:
        song_chords = body

    return {
        "song_cifra": body,
        "songTabs": song_tabs,
        "songChords": song_chords,
        "songLyrics": _extract_lyrics_from_body(body),
    }


def _build_chrome_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--disable-infobars")
    chrome_options.add_argument("--disable-notifications")
    chrome_options.add_argument("--disable-popup-blocking")
    chrome_options.add_argument("--disable-features=IsolateOrigins,site-per-process")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--window-size=1440,2200")
    chrome_options.add_argument("--lang=en-US")
    chrome_options.add_argument(f"--user-agent={CHROME_UA}")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)

    chrome_binary = (
        os.getenv("CHROME_BINARY")
        or os.getenv("GOOGLE_CHROME_BIN")
        or os.getenv("CHROMIUM_BINARY")
    )
    if chrome_binary:
        chrome_options.binary_location = chrome_binary
        print(f"[UG] Using Chrome binary: {chrome_binary}")

    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_cdp_cmd(
        "Page.addScriptToEvaluateOnNewDocument",
        {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'platform', {get: () => 'MacIntel'});
                Object.defineProperty(navigator, 'language', {get: () => 'en-US'});
                Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                window.chrome = { runtime: {} };
            """
        },
    )
    return driver


def _fetch_ultimate_guitar_html(url: str) -> str:
    driver = None
    try:
        print("[UG] Launching headless Chrome")
        driver = _build_chrome_driver()
        driver.get("https://www.ultimate-guitar.com/")
        WebDriverWait(driver, 20).until(
            lambda current_driver: current_driver.execute_script("return document.readyState") == "complete"
        )
        print("[UG] Warmup page loaded")

        driver.get(url)
        wait = WebDriverWait(driver, 30)
        wait.until(
            lambda current_driver: current_driver.execute_script("return document.readyState") == "complete"
        )
        try:
            wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "pre.extra")))
        except TimeoutException:
            print("[UG] Timed out waiting for pre.extra, returning current page source for diagnostics")

        print(f"[UG] Final URL: {driver.current_url}")
        return driver.page_source
    except Exception as err:
        if isinstance(err, WebDriverException):
            raise UltimateGuitarScrapeError(
                "Ultimate Guitar Selenium fetch failed: Chrome/Chromium could not start. "
                "Install a Chrome-compatible browser in the server image and set "
                "CHROME_BINARY or GOOGLE_CHROME_BIN if needed. "
                f"Original error: {err}"
            ) from err
        raise UltimateGuitarScrapeError(f"Ultimate Guitar Selenium fetch failed: {err}") from err
    finally:
        if driver:
            driver.quit()


def _fetch_ultimate_guitar_from_api(url: str):
    tab_metadata = _request_ug_json("/tab/url", {"url": url})
    tab_id = tab_metadata["id"]
    tab_access_type = tab_metadata.get("tab_access_type", "public")
    tab_info = _request_ug_json(
        "/tab/info",
        {"tab_id": tab_id, "tab_access_type": tab_access_type},
    )

    lines = _parse_ug_content_lines(tab_info.get("content", ""))
    body = _body_from_ug_lines(lines)
    if not body:
        raise UltimateGuitarScrapeError("Ultimate Guitar API returned an empty tab body.")

    arrangement = (
        tab_info.get("type")
        or tab_info.get("type_name")
        or tab_metadata.get("type")
        or tab_metadata.get("type_name")
        or ""
    )

    result = {
        "song_title": tab_info.get("song_name", "").strip(),
        "artist_name": tab_info.get("artist_name", "").strip(),
        "song_cifra": body,
        "source": "ultimate_guitar",
        "arrangement": arrangement,
        "tab_id": str(tab_id),
        "tuning": tab_info.get("tuning", "") or "",
        "key": tab_info.get("tonality_name", "") or "",
        "difficulty": tab_info.get("difficulty", "") or "",
        "rating": tab_info.get("rating", "") or "",
        "capo": "" if tab_info.get("capo") in (None, "") else str(tab_info.get("capo")),
        "last_edit": tab_info.get("date_update", "") or "",
        "source_url": url,
        "ug_lines": lines,
    }
    result.update(_build_song_fields(arrangement, body))

    if not result["song_title"]:
        result["song_title"] = "Unknown Title"
    if not result["artist_name"]:
        result["artist_name"] = "Unknown Artist"

    return [result]


def get_ultimate_guitar_data(url: str):
    if not UG_SCRAPER_ENABLED:
        raise UltimateGuitarScrapeError(
            "Ultimate Guitar scraper is disabled. Set UG_SCRAPER_ENABLED=true to enable it again."
        )

    parsed = _parse_ug_tab_url(url)
    if not parsed:
        msg = f"Invalid Ultimate Guitar URL format: {url}"
        print(f"[UG] {msg}")
        raise UltimateGuitarScrapeError(msg)

    try:
        print(f"[UG] Fetching URL via API: {url}")
        try:
            api_result = _fetch_ultimate_guitar_from_api(url)
            first = api_result[0]
            print(
                "[UG] API success:",
                {
                    "artist": first.get("artist_name", ""),
                    "song": first.get("song_title", ""),
                    "arrangement": first.get("arrangement", ""),
                    "body_length": len(first.get("song_cifra", "")),
                },
            )
            return api_result
        except Exception as api_err:
            print(f"[UG] API fetch failed, falling back to Selenium: {api_err}")

        print(f"[UG] Fetching URL: {url}")
        html = _fetch_ultimate_guitar_html(url)
        soup = BeautifulSoup(html, "html.parser")

        artist_el = soup.select_one("h1.tabHeader-h1 .tabHeader-h2")
        artist_name = (
            artist_el.get_text(" ", strip=True)
            if artist_el
            else _slug_to_title(parsed["artist_slug"])
        )
        song_title = _extract_song_title(soup, parsed["song_slug"])
        print(f"[UG] Parsed header: artist='{artist_name}' song='{song_title}' arrangement='{parsed['arrangement']}'")

        content_el = soup.select_one("pre.extra")
        if not content_el:
            pre_count = len(soup.select("pre"))
            title_found = bool(soup.select_one("h1.tabHeader-h1"))
            msg = (
                "Ultimate Guitar tab content not found. "
                f"selector='pre.extra' pre_count={pre_count} title_found={title_found}"
            )
            print(f"[UG] {msg}")
            raise UltimateGuitarScrapeError(msg)

        song_body = _clean_text(content_el.get_text("\n"))
        if not song_body:
            msg = "Ultimate Guitar returned an empty tab body."
            print(f"[UG] {msg}")
            raise UltimateGuitarScrapeError(msg)

        fields = _build_song_fields(parsed["arrangement"], song_body)
        metadata = _extract_header_metadata(soup)
        print(
            "[UG] Metadata:",
            {
                "tuning": metadata.get("tuning", ""),
                "key": metadata.get("key", ""),
                "difficulty": metadata.get("difficulty", ""),
                "rating": metadata.get("rating", ""),
                "last_edit": metadata.get("last edit", ""),
            },
        )
        print(f"[UG] Body length: {len(song_body)}")

        return [{
            "song_title": song_title,
            "artist_name": artist_name,
            "song_cifra": fields["song_cifra"],
            "songTabs": fields["songTabs"],
            "songChords": fields["songChords"],
            "songLyrics": fields["songLyrics"],
            "source": "ultimate_guitar",
            "arrangement": parsed["arrangement"],
            "tab_id": parsed["tab_id"],
            "tuning": metadata.get("tuning", ""),
            "key": metadata.get("key", ""),
            "difficulty": metadata.get("difficulty", ""),
            "rating": metadata.get("rating", ""),
            "last_edit": metadata.get("last edit", ""),
            "source_url": url,
        }]
    except Exception as err:
        if isinstance(err, UltimateGuitarScrapeError):
            raise
        print(f"[UG] Scrape error: {err}")
        raise UltimateGuitarScrapeError(f"Unexpected Ultimate Guitar scrape error: {err}") from err
