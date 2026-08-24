"""Compatibility import for the legacy scraping_service module.

The maintained implementation lives in scraping_service_ultimate_guitar. Keep
one source of truth so an older entry point cannot silently return empty or
differently parsed Ultimate Guitar content.
"""

from scraping_service_ultimate_guitar import get_ultimate_guitar_data


__all__ = ["get_ultimate_guitar_data"]
