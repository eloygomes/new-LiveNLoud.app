from urllib.parse import urlparse


SOURCE_RULES = {
    "cifraclub": {
        "hosts": ("cifraclub.com.br", "www.cifraclub.com.br", "sscdn.co"),
        "service_module": "scraping_service_cifraclub",
        "service_function": "get_cifraclub_data",
    },
    "ultimate_guitar": {
        "hosts": (
            "tabs.ultimate-guitar.com",
            "www.ultimate-guitar.com",
            "ultimate-guitar.com",
        ),
        "domain_suffixes": ("ultimate-guitar.com",),
        "service_module": "scraping_service_ultimate_guitar",
        "service_function": "get_ultimate_guitar_data",
    },
    "letrasmus": {
        "hosts": (
            "letras.mus.br",
            "www.letras.mus.br",
            "letras.com",
            "www.letras.com",
        ),
        "service_module": "scraping_service_letrasmus",
        "service_function": "get_letrasmus_data",
    },
}


def _normalize_host(url: str) -> str:
    return (urlparse(url).hostname or "").lower()


def _host_matches_rule(host: str, rule: dict) -> bool:
    if host in rule.get("hosts", ()):
        return True

    return any(
        host.endswith(f".{suffix}")
        for suffix in rule.get("domain_suffixes", ())
    )


def detect_source(url: str) -> str:
    host = _normalize_host(url)

    for source_name, rule in SOURCE_RULES.items():
        if _host_matches_rule(host, rule):
            return source_name

    return "unknown"


def get_source_rule(url: str):
    source_name = detect_source(url)
    return SOURCE_RULES.get(source_name)
