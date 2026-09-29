from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ErrorCode(str, Enum):
    INVALID_URL = "INVALID_URL"
    UNSUPPORTED_PROVIDER = "UNSUPPORTED_PROVIDER"
    UPSTREAM_ACCESS_DENIED = "UPSTREAM_ACCESS_DENIED"
    UPSTREAM_NOT_FOUND = "UPSTREAM_NOT_FOUND"
    UPSTREAM_TIMEOUT = "UPSTREAM_TIMEOUT"
    UPSTREAM_CHALLENGE = "UPSTREAM_CHALLENGE"
    FETCH_ENGINE_ERROR = "FETCH_ENGINE_ERROR"
    PAGE_VALIDATION_ERROR = "PAGE_VALIDATION_ERROR"
    PARSER_ERROR = "PARSER_ERROR"
    INVALID_SONG_DATA = "INVALID_SONG_DATA"


@dataclass(frozen=True)
class FetchResult:
    success: bool
    engine: str
    status: int | None = None
    html: str = ""
    elapsed_ms: int = 0
    error_code: ErrorCode | None = None
    error: str = ""

    @property
    def is_terminal(self) -> bool:
        return self.error_code in {ErrorCode.INVALID_URL, ErrorCode.UPSTREAM_NOT_FOUND}


@dataclass(frozen=True)
class SongImportData:
    title: str
    artist: str
    content: str
    source: str
    source_url: str
    key: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_legacy_dict(self) -> dict[str, Any]:
        data = {
            "song_title": self.title,
            "artist_name": self.artist,
            "song_cifra": self.content,
            "source": self.source,
            "source_url": self.source_url,
        }
        data.update(self.metadata)
        if self.key:
            data.setdefault("tom", self.key)
            data.setdefault("key", self.key)
        return data


class ImportPipelineError(RuntimeError):
    def __init__(self, code: ErrorCode, message: str):
        super().__init__(message)
        self.code = code
