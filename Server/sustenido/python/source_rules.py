from urllib.parse import urlparse


SOURCE_RULES = {
    "cifraclub": {
        "hosts": ("cifraclub.com.br", "www.cifraclub.com.br", "sscdn.co"),
    },
    "ultimate_guitar": {
        "hosts": (
            "tabs.ultimate-guitar.com",
            "www.ultimate-guitar.com",
            "ultimate-guitar.com",
        ),
        "domain_suffixes": ("ultimate-guitar.com",),
    },
    "letrasmus": {
        "hosts": (
            "letras.mus.br",
            "www.letras.mus.br",
            "letras.com",
            "www.letras.com",
        ),
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
