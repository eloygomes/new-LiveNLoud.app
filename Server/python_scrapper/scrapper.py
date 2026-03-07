from flask import Flask, request, jsonify

from scraping_service import get_song_data
from storage_service import store_in_mongo

app = Flask(__name__)


@app.route('/scrape', methods=['POST'])
def scrape_and_store():
    data = request.json

    link_url = data.get('link')
    artist = data.get('artist')
    song = data.get('song')
    instrument = data.get('instrument')
    userEmail = data.get('email')
    instrument_progressbar = data.get('instrument_progressbar')

    if not userEmail or not instrument:
        return jsonify({"message": "Missing required fields"}), 400

    if link_url:
        url_to_fetch = link_url.strip()
    else:
        if not (artist and song):
            return jsonify({"message": "Missing artist or song"}), 400
        url_to_fetch = f'https://www.cifraclub.com.br/{artist}/{song}/'

    songData = get_song_data(url_to_fetch)
    if songData:
        store_in_mongo(songData, instrument, userEmail, instrument_progressbar, link_url)
        return jsonify({"message": "Data stored successfully"}), 201
    else:
        return jsonify({"message": "Failed to scrape data"}), 500


if __name__ == '__main__':
    # continua igual
    app.run(host='0.0.0.0', port=8000)
