from urllib.parse import urlparse

from flask import jsonify, request

from server import app
from .tab_parser import dict_from_ultimate_tab


SUPPORTED_UG_URIS = {
    "tabs.ultimate-guitar.com",
    "www.ultimate-guitar.com",
    "ultimate-guitar.com",
}

@app.route('/')
def index():
    return 'hi'

@app.route('/tab')
def tab():
    try:
        ultimate_url = request.args.get('url')
        if not ultimate_url:
            raise Exception('missing url parameter')

        # Ensure sanitized url
        parsed_url = urlparse(ultimate_url)
        location = parsed_url.netloc
        if parsed_url.scheme not in {"http", "https"}:
            raise Exception('unsupported url scheme')
        if location not in SUPPORTED_UG_URIS:
            raise Exception('unsupported url scheme')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    tab_dict = dict_from_ultimate_tab(ultimate_url)
    return jsonify(tab_dict)
