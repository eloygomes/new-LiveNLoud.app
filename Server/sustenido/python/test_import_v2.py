import json
import os
import tempfile
import unittest
import importlib.util
from unittest.mock import Mock, patch

from import_v2.fetchers import HeroFetcher
from import_v2.models import ErrorCode, FetchResult, ImportPipelineError
from import_v2.providers import CifraClubProvider, ProviderResolver, UltimateGuitarProvider
from import_v2.service import FetchManager, ImportService
from import_v2.validation import validate_generic_page


CIFRA_HTML = """<!doctype html><html><main id="chordPage"><h1>Amor Maior</h1><h2>Jota Quest</h2><pre>[Intro]\nA D\nMinha canção</pre></main></html>"""
UG_RAW = "[Verse]\n[ch]Am[/ch]Hello"
UG_HTML = """<!doctype html><html><h1 class="tabHeader-h1">Song <span class="tabHeader-h2">Artist</span></h1><div class="js-store" data-content='{}'></div></html>""".format(
    json.dumps({"store": {"page": {"data": {"tab_view": {"wiki_tab": {"content": UG_RAW}}}}}}).replace("'", "&#39;")
)


class StubFetcher:
    def __init__(self, result): self.result, self.calls = result, 0
    def fetch(self, _url): self.calls += 1; return self.result


class ImportV2Tests(unittest.TestCase):
    def test_resolver_validates_hostname_not_substring(self):
        resolver = ProviderResolver()
        self.assertIsInstance(resolver.resolve("https://www.cifraclub.com.br/a/b/"), CifraClubProvider)
        self.assertIsInstance(resolver.resolve("https://tabs.ultimate-guitar.com/tab/a/b-chords-1"), UltimateGuitarProvider)
        with self.assertRaises(ImportPipelineError):
            resolver.resolve("https://cifraclub.com.br.evil.example/a/b")

    def test_generic_validator_rejects_200_challenge(self):
        result = validate_generic_page(FetchResult(True, "x", 200, "<html><body>Verify that you are human" + " " * 100 + "</body></html>"))
        self.assertFalse(result.success)
        self.assertEqual(result.error_code, ErrorCode.UPSTREAM_CHALLENGE)

    def test_generic_validator_ignores_block_words_inside_scripts(self):
        html = "<html><head><script>const captchaChallenge = true;</script></head><body>" + "Valid song page " * 20 + "</body></html>"
        result = validate_generic_page(FetchResult(True, "camoufox", 200, html))
        self.assertTrue(result.success)

    def test_cifraclub_parser_preserves_legacy_shape(self):
        song = CifraClubProvider().parse(CIFRA_HTML, "https://www.cifraclub.com.br/jota-quest/amor-maior/")
        data = song.to_legacy_dict()
        self.assertEqual(data["song_title"], "Amor Maior")
        self.assertIn("Minha canção", data["song_cifra"])
        self.assertIn("songTabs", data)

    def test_cifraclub_browser_snapshot_bypasses_fetchers(self):
        provider = CifraClubProvider()
        resolver = Mock()
        resolver.resolve.return_value = provider
        fetch_manager = Mock()
        result = ImportService(resolver, fetch_manager).import_url(
            "https://www.cifraclub.com.br/jota-quest/amor-maior/",
            source_content=CIFRA_HTML,
            source_content_format="cifraclub_html",
        )
        self.assertEqual(result[0]["song_title"], "Amor Maior")
        fetch_manager.fetch_valid_page.assert_not_called()

    def test_fallback_stops_after_success(self):
        failed = StubFetcher(FetchResult(False, "current", 403, error_code=ErrorCode.UPSTREAM_ACCESS_DENIED))
        success = StubFetcher(FetchResult(True, "camoufox", 200, CIFRA_HTML))
        hero = StubFetcher(FetchResult(True, "hero", 200, CIFRA_HTML))
        result = FetchManager({"current": failed, "camoufox": success, "hero": hero}).fetch_valid_page(
            "https://www.cifraclub.com.br/a/b/", CifraClubProvider())
        self.assertEqual(result.engine, "camoufox")
        self.assertEqual(hero.calls, 0)

    def test_fallback_reaches_hero(self):
        current = StubFetcher(FetchResult(False, "current", 403, error_code=ErrorCode.UPSTREAM_ACCESS_DENIED))
        camoufox = StubFetcher(FetchResult(False, "camoufox", error_code=ErrorCode.FETCH_ENGINE_ERROR))
        hero = StubFetcher(FetchResult(True, "hero", 200, CIFRA_HTML))
        result = FetchManager({"current": current, "camoufox": camoufox, "hero": hero}).fetch_valid_page(
            "https://www.cifraclub.com.br/a/b/", CifraClubProvider())
        self.assertEqual(result.engine, "hero")

    def test_provider_invalid_http_200_falls_back(self):
        current = StubFetcher(FetchResult(True, "current", 200, "<html>" + "x" * 150 + "</html>"))
        camoufox = StubFetcher(FetchResult(True, "camoufox", 200, CIFRA_HTML))
        result = FetchManager({"current": current, "camoufox": camoufox}).fetch_valid_page(
            "https://www.cifraclub.com.br/a/b/", CifraClubProvider())
        self.assertEqual(result.engine, "camoufox")

    def test_ultimate_guitar_structured_content_uses_common_model(self):
        provider = UltimateGuitarProvider()
        song = provider.parse_source_content(
            "[Verse]\n[ch]Am[/ch]Hello",
            "https://tabs.ultimate-guitar.com/tab/artist/song-chords-123",
        )
        data = song.to_legacy_dict()
        self.assertEqual(data["source"], "ultimate_guitar")
        self.assertIn("Am", data["song_cifra"])

    def test_terminal_404_does_not_fallback(self):
        current = StubFetcher(FetchResult(False, "current", 404, error_code=ErrorCode.UPSTREAM_NOT_FOUND))
        camoufox = StubFetcher(FetchResult(True, "camoufox", 200, CIFRA_HTML))
        with self.assertRaises(ImportPipelineError) as context:
            FetchManager({"current": current, "camoufox": camoufox}).fetch_valid_page(
                "https://www.cifraclub.com.br/a/missing/", CifraClubProvider())
        self.assertEqual(context.exception.code, ErrorCode.UPSTREAM_NOT_FOUND)
        self.assertEqual(camoufox.calls, 0)

    def test_all_fail_returns_structured_final_error(self):
        fetchers = {name: StubFetcher(FetchResult(False, name, error_code=ErrorCode.FETCH_ENGINE_ERROR, error=name))
                    for name in ("current", "camoufox", "hero")}
        with self.assertRaises(ImportPipelineError) as context:
            FetchManager(fetchers).fetch_valid_page("https://www.cifraclub.com.br/a/b/", CifraClubProvider())
        self.assertEqual(context.exception.code, ErrorCode.FETCH_ENGINE_ERROR)

    @patch("import_v2.fetchers.subprocess.Popen")
    def test_hero_uses_structured_stdin_protocol(self, popen):
        process = popen.return_value
        process.communicate.return_value = (json.dumps({"success": True, "status": 200, "html": "<html>" + "x" * 100 + "</html>"}), "")
        process.returncode = 0
        process.args = ["node", "hero.mjs"]
        result = HeroFetcher("hero.mjs").fetch("https://example.com")
        self.assertTrue(result.success)
        self.assertIn('"url": "https://example.com"', process.communicate.call_args.args[0])

    @patch("import_v2.fetchers.subprocess.Popen")
    def test_hero_preserves_structured_error_from_stdout(self, popen):
        process = popen.return_value
        process.communicate.return_value = (json.dumps({"success": False, "error": "Chrome dependency missing"}), "")
        process.returncode = 1
        process.args = ["node", "hero.mjs"]
        result = HeroFetcher("hero.mjs").fetch("https://example.com")
        self.assertFalse(result.success)
        self.assertEqual(result.error, "Chrome dependency missing")


class EndpointCompatibilityTests(unittest.TestCase):
    @unittest.skipUnless(importlib.util.find_spec("flask"), "Flask is not installed in this test environment")
    def test_scrape_response_contract_in_v2(self):
        import scrapper
        service = Mock()
        service.import_url.return_value = [{"song_title": "Title", "artist_name": "Artist", "song_cifra": "A song"}]
        with patch.object(scrapper, "import_service", service), patch.object(scrapper, "store_in_mongo"):
            response = scrapper.app.test_client().post("/scrape", json={
                "email": "a@example.com", "instrument": "guitar",
                "link": "https://www.cifraclub.com.br/artist/song/",
            })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["songData"]["song_title"], "Title")


if __name__ == "__main__":
    unittest.main()
