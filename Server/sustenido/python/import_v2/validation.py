import re

from bs4 import BeautifulSoup

from .models import ErrorCode, FetchResult


BLOCK_PATTERNS = (
    re.compile(r"\baccess denied\b", re.I),
    re.compile(r"\b403 forbidden\b", re.I),
    re.compile(r"\bcomplete the captcha\b", re.I),
    re.compile(r"\bverify (?:that )?you are human\b", re.I),
    re.compile(r"\bchecking (?:your )?browser\b", re.I),
)


def _visible_page_summary(html: str) -> str:
    """Return user-visible signals without script/style false positives."""
    soup = BeautifulSoup(html, "html.parser")
    for element in soup(["script", "style", "noscript", "template", "svg"]):
        element.decompose()
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    body = soup.body or soup
    visible_text = body.get_text(" ", strip=True)
    return f"{title}\n{visible_text[:20_000]}"


def validate_generic_page(result: FetchResult) -> FetchResult:
    if not result.success:
        return result
    html = result.html or ""
    if result.status == 404:
        return FetchResult(False, result.engine, 404, elapsed_ms=result.elapsed_ms,
                           error_code=ErrorCode.UPSTREAM_NOT_FOUND, error="Upstream page not found")
    if result.status in (401, 403):
        return FetchResult(False, result.engine, result.status, elapsed_ms=result.elapsed_ms,
                           error_code=ErrorCode.UPSTREAM_ACCESS_DENIED, error="Upstream access denied")
    visible_summary = _visible_page_summary(html)
    if any(pattern.search(visible_summary) for pattern in BLOCK_PATTERNS):
        return FetchResult(False, result.engine, result.status, elapsed_ms=result.elapsed_ms,
                           error_code=ErrorCode.UPSTREAM_CHALLENGE, error="Blocked or challenge page")
    if len(html.strip()) < 100:
        return FetchResult(False, result.engine, result.status, elapsed_ms=result.elapsed_ms,
                           error_code=ErrorCode.PAGE_VALIDATION_ERROR, error="Empty or incomplete HTML")
    return result
