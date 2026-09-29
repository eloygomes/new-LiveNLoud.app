from abc import ABC, abstractmethod
from urllib.parse import urlparse

from bs4 import BeautifulSoup

from scraping_service_cifraclub import (
    _extract_legacy_song_data,
    _extract_next_song_data,
    _extract_cifra_text,
    _split_cifra_sections,
)
from scraping_service_ultimate_guitar import (
    _build_structured_result,
    _extract_header_metadata,
    _extract_song_title,
    _extract_store_raw_content,
    _parse_ug_tab_url,
    _slug_to_title,
)
from .models import ErrorCode, ImportPipelineError, SongImportData


class Provider(ABC):
    name = "base"
    hosts: tuple[str, ...] = ()
    fetch_strategy: tuple[str, ...] = ()

    def supports(self, url: str) -> bool:
        host = (urlparse(url).hostname or "").lower()
        return any(host == allowed or host.endswith(f".{allowed}") for allowed in self.hosts)

    @abstractmethod
    def validate_page(self, html: str) -> bool:
        raise NotImplementedError

    @abstractmethod
    def parse(self, html: str, url: str) -> SongImportData:
        raise NotImplementedError

    @staticmethod
    def _from_legacy(data: dict) -> SongImportData:
        metadata = dict(data)
        for key in ("song_title", "artist_name", "song_cifra", "source", "source_url", "tom", "key"):
            metadata.pop(key, None)
        return SongImportData(data.get("song_title", ""), data.get("artist_name", ""),
                              data.get("song_cifra", ""), data.get("source", ""),
                              data.get("source_url", ""), data.get("tom") or data.get("key", ""), metadata)


class CifraClubProvider(Provider):
    name = "cifraclub"
    hosts = ("cifraclub.com.br", "sscdn.co")
    fetch_strategy = ("current", "camoufox", "hero")

    def validate_page(self, html: str) -> bool:
        soup = BeautifulSoup(html, "html.parser")
        return bool(
            soup.select_one("main#chordPage pre")
            or soup.select_one("div.cifra_cnt")
            or any("songData" in script.get_text() for script in soup.find_all("script"))
        )

    def parse(self, html: str, url: str) -> SongImportData:
        soup = BeautifulSoup(html, "html.parser")
        result = _extract_legacy_song_data(soup, url) or _extract_next_song_data(soup, url)
        if not result:
            pre = soup.select_one("main#chordPage pre")
            content = _extract_cifra_text(pre)
            if content:
                title = soup.select_one("main#chordPage h1") or soup.find("h1")
                artist = soup.select_one("main#chordPage h2") or soup.select_one("[data-cy='song-artist']")
                og_title = soup.select_one('meta[property="og:title"]')
                og_parts = str(og_title.get("content", "")).rsplit(" - ", 2) if og_title else []
                fallback_title = og_parts[0].strip() if len(og_parts) == 3 else "Unknown Title"
                fallback_artist = og_parts[1].strip() if len(og_parts) == 3 else "Unknown Artist"
                tom_el = soup.select_one("#cifra_tom a")
                tuning_el = soup.select_one("#cifra_afi a")
                capo_el = soup.select_one("#cifra_capo")
                split = _split_cifra_sections(content)
                result = [{"song_title": title.get_text(" ", strip=True) if title else fallback_title,
                           "artist_name": artist.get_text(" ", strip=True) if artist else fallback_artist,
                           "song_cifra": content, **split,
                           "capo": capo_el.get_text(" ", strip=True).replace("Capo:", "").strip() if capo_el else "",
                           "tom": tom_el.get_text(" ", strip=True) if tom_el else "",
                           "tuning": tuning_el.get_text(" ", strip=True) if tuning_el else "",
                           "source": self.name, "source_url": url}]
        if not result:
            raise ImportPipelineError(ErrorCode.PARSER_ERROR, "Cifra Club content could not be parsed")
        return self._from_legacy(result[0])

    def parse_source_content(self, content: str, url: str) -> SongImportData:
        if not self.validate_page(content):
            raise ImportPipelineError(
                ErrorCode.PAGE_VALIDATION_ERROR,
                "Cifra Club browser snapshot failed provider validation",
            )
        return self.parse(content, url)


class UltimateGuitarProvider(Provider):
    name = "ultimate_guitar"
    hosts = ("ultimate-guitar.com",)
    fetch_strategy = ("current", "camoufox", "hero")

    def validate_page(self, html: str) -> bool:
        soup = BeautifulSoup(html, "html.parser")
        return bool(_extract_store_raw_content(soup))

    def parse(self, html: str, url: str) -> SongImportData:
        parsed = _parse_ug_tab_url(url)
        if not parsed:
            raise ImportPipelineError(ErrorCode.INVALID_URL, "Invalid Ultimate Guitar tab URL")
        soup = BeautifulSoup(html, "html.parser")
        raw = _extract_store_raw_content(soup)
        if not raw:
            raise ImportPipelineError(ErrorCode.PARSER_ERROR, "Ultimate Guitar structured content was not found")
        artist_el = soup.select_one("h1.tabHeader-h1 .tabHeader-h2")
        result = _build_structured_result(
            url, parsed, raw, song_title=_extract_song_title(soup, parsed["song_slug"]),
            artist_name=artist_el.get_text(" ", strip=True) if artist_el else _slug_to_title(parsed["artist_slug"]),
            metadata=_extract_header_metadata(soup),
        )[0]
        return self._from_legacy(result)

    def parse_source_content(self, content: str, url: str) -> SongImportData:
        parsed = _parse_ug_tab_url(url)
        if not parsed:
            raise ImportPipelineError(ErrorCode.INVALID_URL, "Invalid Ultimate Guitar tab URL")
        return self._from_legacy(_build_structured_result(url, parsed, content)[0])


class ProviderResolver:
    def __init__(self, providers=None):
        self.providers = providers or (CifraClubProvider(), UltimateGuitarProvider())

    def resolve(self, url: str) -> Provider:
        parsed = urlparse(str(url or ""))
        if parsed.scheme not in ("http", "https") or not parsed.hostname:
            raise ImportPipelineError(ErrorCode.INVALID_URL, "A valid HTTP(S) URL is required")
        for provider in self.providers:
            if provider.supports(url):
                return provider
        raise ImportPipelineError(ErrorCode.UNSUPPORTED_PROVIDER, "URL provider is not supported")
