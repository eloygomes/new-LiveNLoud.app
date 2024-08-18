from flask import Flask, request, jsonify
from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)


def get_cifra(artist, song):
    try:
        url = f'https://www.cifraclub.com.br/{artist}/{song}/'
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        songData = []
        songElements = soup.find_all('div', class_='g-1 g-fix cifra')

        for elem in songElements:
            songTitle = elem.find('h1', class_='t1').text.strip()
            artistName = elem.find('h2', class_='t3').text.strip()
            songCifra = elem.find('div', class_='cifra_cnt').text.strip()

            songData.append({
                'song_title': songTitle,
                'artist_name': artistName,
                'song_cifra': songCifra
            })

        return songData
    except Exception as e:
        return None


@app.route('/scrape', methods=['POST'])
def scrape_and_store():
    data = request.json
    artist = data.get('artist')
    song = data.get('song')
    instrument = data.get('instrument')
    userEmail = data.get('email')

    songData = get_cifra(artist, song)
    if songData:
        store_in_mongo(songData, instrument, userEmail)
        return jsonify({"message": "Data stored successfully"}), 201
    else:
        return jsonify({"message": "Failed to scrape data"}), 500


def store_in_mongo(song_data, instrument, userEmail):
    client = MongoClient("mongodb://root:example@db:27017/admin")
    db = client["liveNloud_"]
    collection = db["data"]

    if song_data:
        formatted_data = []
        for i, song in enumerate(song_data):
            formatted_data.append({
                "databaseComing": "liveNloud_",
                "collectionComing": "data",
                "userdata": {
                    "id": i + 1,
                    "song": song['song_title'],
                    "artist": song['artist_name'],
                    "progressBar": 85,
                    "instruments": {
                        "guitar01": instrument == 'guitar01',
                        "guitar02": instrument == 'guitar02',
                        "bass": instrument == 'bass',
                        "keys": instrument == 'keys',
                        "drums": instrument == 'drums',
                        "voice": instrument == 'voice'
                    },
                    "guitar01": {
                        "active": instrument == 'guitar01',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": "2024-08-01",
                        "songCifra": song['song_cifra'] if instrument == 'guitar01' else "",
                    },
                    "guitar02": {
                        "active": instrument == 'guitar02',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": "2024-08-01",
                        "songCifra": song['song_cifra'] if instrument == 'guitar02' else "",
                    },
                    "bass": {
                        "active": instrument == 'bass',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": "2024-08-01",
                        "songCifra": song['song_cifra'] if instrument == 'bass' else "",
                    },
                    "keys": {
                        "active": instrument == 'keys',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": "2024-08-01",
                        "songCifra": song['song_cifra'] if instrument == 'keys' else "",
                    },
                    "drums": {
                        "active": instrument == 'drums',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": "2024-08-01",
                        "songCifra": song['song_cifra'] if instrument == 'drums' else "",
                    },
                    "voice": {
                        "active": instrument == 'voice',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": "2024-08-01",
                        "songCifra": song['song_cifra'] if instrument == 'voice' else "",
                    },
                    "embedVideos": [],
                    "addedIn": "2024-08-16",
                    "updateIn": "2024-08-16",
                    "email": userEmail,
                },
            })

        collection.insert_many(formatted_data)
        print("Data stored in MongoDB.")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
