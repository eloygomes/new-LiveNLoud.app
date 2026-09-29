import json
import os
import signal
import subprocess
import threading
import time
from abc import ABC, abstractmethod

import requests

from .models import ErrorCode, FetchResult


def _elapsed(started: float) -> int:
    return round((time.monotonic() - started) * 1000)


class Fetcher(ABC):
    name = "base"

    @abstractmethod
    def fetch(self, url: str) -> FetchResult:
        raise NotImplementedError


class CurrentFetcher(Fetcher):
    name = "current"

    def __init__(self, timeout: float = 30):
        self.timeout = timeout

    def fetch(self, url: str) -> FetchResult:
        started = time.monotonic()
        try:
            response = requests.get(url, timeout=self.timeout, headers={
                "User-Agent": "Mozilla/5.0 (compatible; SustenidoImporter/2.0)",
                "Accept": "text/html,application/xhtml+xml",
            })
            code = ErrorCode.UPSTREAM_NOT_FOUND if response.status_code == 404 else None
            success = 200 <= response.status_code < 300
            if response.status_code in (401, 403):
                code = ErrorCode.UPSTREAM_ACCESS_DENIED
            return FetchResult(success, self.name, response.status_code, response.text,
                               _elapsed(started), code, "" if success else f"HTTP {response.status_code}")
        except requests.Timeout:
            return FetchResult(False, self.name, elapsed_ms=_elapsed(started),
                               error_code=ErrorCode.UPSTREAM_TIMEOUT, error="Request timed out")
        except requests.RequestException as exc:
            return FetchResult(False, self.name, elapsed_ms=_elapsed(started),
                               error_code=ErrorCode.FETCH_ENGINE_ERROR, error=str(exc))


class CamoufoxFetcher(Fetcher):
    name = "camoufox"

    def __init__(self, timeout: float = 45):
        self.timeout = timeout

    def fetch(self, url: str) -> FetchResult:
        started = time.monotonic()
        try:
            from camoufox.sync_api import Camoufox
            with Camoufox(headless=True) as browser:
                page = browser.new_page()
                response = page.goto(url, wait_until="domcontentloaded", timeout=int(self.timeout * 1000))
                status = response.status if response else None
                html = page.content()
            return FetchResult(bool(html) and (status is None or status < 400), self.name,
                               status, html, _elapsed(started),
                               ErrorCode.UPSTREAM_NOT_FOUND if status == 404 else None,
                               "" if status is None or status < 400 else f"HTTP {status}")
        except Exception as exc:
            code = ErrorCode.UPSTREAM_TIMEOUT if "timeout" in str(exc).lower() else ErrorCode.FETCH_ENGINE_ERROR
            return FetchResult(False, self.name, elapsed_ms=_elapsed(started), error_code=code, error=str(exc))


class HeroFetcher(Fetcher):
    name = "hero"
    _semaphore = None
    _semaphore_limit = None
    _lock = threading.Lock()

    def __init__(self, script: str, timeout: float = 45, concurrency: int = 2, node_binary: str = "node"):
        self.script = script
        self.timeout = timeout
        self.node_binary = node_binary
        with self._lock:
            if self.__class__._semaphore is None or self.__class__._semaphore_limit != concurrency:
                self.__class__._semaphore = threading.BoundedSemaphore(max(1, concurrency))
                self.__class__._semaphore_limit = concurrency

    def fetch(self, url: str) -> FetchResult:
        started = time.monotonic()
        with self.__class__._semaphore:
            process = None
            try:
                process = subprocess.Popen(
                    [self.node_binary, self.script], stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
                    start_new_session=True,
                )
                stdout, stderr = process.communicate(json.dumps({"url": url}), timeout=self.timeout)
                completed = subprocess.CompletedProcess(process.args, process.returncode, stdout, stderr)
            except subprocess.TimeoutExpired:
                if process is not None:
                    os.killpg(process.pid, signal.SIGKILL)
                    process.communicate()
                return FetchResult(False, self.name, elapsed_ms=_elapsed(started),
                                   error_code=ErrorCode.UPSTREAM_TIMEOUT, error="Hero subprocess timed out")
            except OSError as exc:
                return FetchResult(False, self.name, elapsed_ms=_elapsed(started),
                                   error_code=ErrorCode.FETCH_ENGINE_ERROR, error=str(exc))
        try:
            payload = json.loads(completed.stdout)
        except (json.JSONDecodeError, TypeError):
            detail = completed.stderr or f"Hero subprocess exited with code {completed.returncode}"
            return FetchResult(False, self.name, elapsed_ms=_elapsed(started),
                               error_code=ErrorCode.FETCH_ENGINE_ERROR, error=detail[:1000])
        if completed.returncode != 0 or not payload.get("success"):
            detail = payload.get("error") or completed.stderr or f"Hero exited with code {completed.returncode}"
            return FetchResult(False, self.name, payload.get("status"), elapsed_ms=_elapsed(started),
                               error_code=ErrorCode.FETCH_ENGINE_ERROR, error=str(detail)[:1000])
        html = payload.get("html", "")
        status = payload.get("status")
        return FetchResult(bool(payload.get("success") and html), self.name, status, html,
                           _elapsed(started), None, str(payload.get("error") or ""))


def default_fetchers() -> dict[str, Fetcher]:
    root = os.path.dirname(os.path.dirname(__file__))
    return {
        "current": CurrentFetcher(float(os.getenv("SCRAPER_CURRENT_TIMEOUT_SECONDS", "30"))),
        "camoufox": CamoufoxFetcher(float(os.getenv("SCRAPER_CAMOUFOX_TIMEOUT_SECONDS", "45"))),
        "hero": HeroFetcher(
            os.getenv("SCRAPER_HERO_SCRIPT", os.path.join(root, "hero_fetcher.mjs")),
            float(os.getenv("SCRAPER_HERO_TIMEOUT_SECONDS", "45")),
            int(os.getenv("SCRAPER_HERO_MAX_CONCURRENCY", "2")),
            os.getenv("SCRAPER_NODE_BINARY", "node"),
        ),
    }
