import json
import logging

from .fetchers import default_fetchers
from .models import ErrorCode, ImportPipelineError
from .providers import ProviderResolver
from .validation import validate_generic_page


logger = logging.getLogger("sustenido.import")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())
logger.propagate = False


def _log(event: str, **fields):
    logger.info("%s %s", event, json.dumps(fields, ensure_ascii=True, sort_keys=True))


class FetchManager:
    def __init__(self, fetchers):
        self.fetchers = fetchers

    def fetch_valid_page(self, url, provider):
        attempts = []
        for engine_name in provider.fetch_strategy:
            fetcher = self.fetchers.get(engine_name)
            if not fetcher:
                continue
            result = validate_generic_page(fetcher.fetch(url))
            if result.success and not provider.validate_page(result.html):
                result = type(result)(False, result.engine, result.status, result.html, result.elapsed_ms,
                                      ErrorCode.PAGE_VALIDATION_ERROR, "Provider page validation failed")
            attempts.append(result)
            _log("FETCH", provider=provider.name, engine=result.engine, status=result.status,
                 elapsed_ms=result.elapsed_ms, result="success" if result.success else "fallback",
                 error_code=result.error_code.value if result.error_code else None,
                 error=result.error[:300] if result.error else None)
            if result.success:
                return result
            if result.is_terminal:
                break
        last = attempts[-1] if attempts else None
        code = last.error_code if last and last.error_code else ErrorCode.FETCH_ENGINE_ERROR
        detail = last.error if last else "No fetch engine is configured"
        raise ImportPipelineError(code, detail)


class ImportService:
    def __init__(self, resolver=None, fetch_manager=None):
        self.resolver = resolver or ProviderResolver()
        self.fetch_manager = fetch_manager or FetchManager(default_fetchers())

    def import_url(self, url: str, source_content: str = "", source_content_format: str = ""):
        provider = self.resolver.resolve(url)
        _log("IMPORT", provider=provider.name, result="started")
        accepted_browser_content = {
            "ultimate_guitar": "ultimate_guitar_wiki_tab",
            "cifraclub": "cifraclub_html",
        }
        if (accepted_browser_content.get(provider.name) == source_content_format
                and source_content.strip()):
            song = provider.parse_source_content(source_content, url)
            engine = "provided_content"
        else:
            fetched = self.fetch_manager.fetch_valid_page(url, provider)
            song = provider.parse(fetched.html, url)
            engine = fetched.engine
        if not song.title.strip() or not song.artist.strip() or not song.content.strip():
            raise ImportPipelineError(ErrorCode.INVALID_SONG_DATA, "Parsed song data is incomplete")
        _log("PARSER", provider=provider.name, engine=engine,
             title_length=len(song.title), content_length=len(song.content), result="success")
        return [song.to_legacy_dict()]
