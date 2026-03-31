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
    return urlparse(url).netloc.lower()


def detect_source(url: str) -> str:
    host = _normalize_host(url)

    for source_name, rule in SOURCE_RULES.items():
        if host in rule["hosts"]:
            return source_name

    return "unknown"


def get_source_rule(url: str):
    source_name = detect_source(url)
    return SOURCE_RULES.get(source_name)
