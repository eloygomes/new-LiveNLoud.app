from flask import Flask, request, jsonify
from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup

app = Flask(__name__)


def get_cifra(artist, song):
    try:
        url = f'https://www.cifraclub.com.br/{artist}/{song}/'
        print(f"Fetching URL: {url}")
        response = requests.get(url)
        response.raise_for_status()
        print(f"Response status code: {response.status_code}")

        soup = BeautifulSoup(response.text, 'html.parser')

        songData = []
        songElements = soup.find_all('div', class_='g-1 g-fix cifra')

        if not songElements:
            print("No song elements found on the page.")
            return None

        for elem in songElements:
            songTitle = elem.find('h1', class_='t1').text.strip(
            ) if elem.find('h1', class_='t1') else 'Unknown Title'
            artistName = elem.find('h2', class_='t3').text.strip(
            ) if elem.find('h2', class_='t3') else 'Unknown Artist'
            songCifra = elem.find('div', class_='cifra_cnt').text.strip(
            ) if elem.find('div', class_='cifra_cnt') else 'No Cifra'

            songData.append({
                'song_title': songTitle,
                'artist_name': artistName,
                'song_cifra': songCifra
            })

        print(f"Scraped data: {songData}")
        return songData
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        return None
    except Exception as e:
        print(f"An error occurred: {e}")
        return None


@app.route('/scrape', methods=['POST'])
def scrape_and_store():
    data = request.json
    print("Received data:", data)
    artist = data.get('artist')
    song = data.get('song')
    instrument = data.get('instrument')
    userEmail = data.get('email')

    if not artist or not song or not instrument or not userEmail:
        return jsonify({"message": "Missing required fields"}), 400

    songData = get_cifra(artist, song)
    if songData:
        store_in_mongo(songData, instrument, userEmail)
        return jsonify({"message": "Data stored successfully"}), 201
    else:
        return jsonify({"message": "Failed to scrape data"}), 500


def store_in_mongo(song_data, instrument, userEmail):
    try:
        client = MongoClient("mongodb://root:example@db:27017/admin")
        db = client["liveNloud_"]
        collection = db["data"]

        existing_user = collection.find_one({"email": userEmail})
        if existing_user:
            print("Email found, checking existing userdata.")
            userdata = existing_user.get("userdata", [])

            for idx, entry in enumerate(userdata):
                if entry["artist"] == song_data[0]["artist_name"] and entry["song"] == song_data[0]["song_title"] and entry["instruments"].get(instrument):
                    print("Matching entry found, updating existing entry.")
                    userdata[idx] = {
                        "id": entry["id"],
                        "song": song_data[0]['song_title'],
                        "artist": song_data[0]['artist_name'],
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
                            "songCifra": song_data[0]['song_cifra'] if instrument == 'guitar01' else "",
                        },
                        "guitar02": {
                            "active": instrument == 'guitar02',
                            "capo": "",
                            "tuning": "",
                            "lastPlay": "2024-08-01",
                            "songCifra": song_data[0]['song_cifra'] if instrument == 'guitar02' else "",
                        },
                        "bass": {
                            "active": instrument == 'bass',
                            "capo": "",
                            "tuning": "",
                            "lastPlay": "2024-08-01",
                            "songCifra": song_data[0]['song_cifra'] if instrument == 'bass' else "",
                        },
                        "keys": {
                            "active": instrument == 'keys',
                            "capo": "",
                            "tuning": "",
                            "lastPlay": "2024-08-01",
                            "songCifra": song_data[0]['song_cifra'] if instrument == 'keys' else "",
                        },
                        "drums": {
                            "active": instrument == 'drums',
                            "capo": "",
                            "tuning": "",
                            "lastPlay": "2024-08-01",
                            "songCifra": song_data[0]['song_cifra'] if instrument == 'drums' else "",
                        },
                        "voice": {
                            "active": instrument == 'voice',
                            "capo": "",
                            "tuning": "",
                            "lastPlay": "2024-08-01",
                            "songCifra": song_data[0]['song_cifra'] if instrument == 'voice' else "",
                        },
                        "embedVideos": [],
                        "addedIn": "2024-08-16",
                        "updateIn": "2024-08-16",
                        "email": userEmail,
                    }
                    collection.update_one({"email": userEmail}, {
                                          "$set": {"userdata": userdata}})
                    print("Data updated successfully in MongoDB.")
                    return

            print("No matching entry found, adding new entry.")
            new_id = max([entry["id"] for entry in userdata], default=0) + 1

        else:
            print("Email not found, creating new userdata.")
            userdata = []
            new_id = 1

        for song in song_data:
            userdata.append({
                "id": new_id,
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
            })

        if existing_user:
            collection.update_one({"email": userEmail}, {
                                  "$set": {"userdata": userdata}})
        else:
            collection.insert_one({"email": userEmail, "userdata": userdata})

        print("Data stored in MongoDB.")
    except Exception as e:
        print(f"An error occurred while storing data in MongoDB: {e}")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
