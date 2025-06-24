# from flask import Flask, request, jsonify
# from pymongo import MongoClient
# import requests
# from bs4 import BeautifulSoup
# from datetime import datetime

# app = Flask(__name__)

# def get_cifra(url):
#     try:
#         print(f"Fetching URL: {url}")
#         response = requests.get(url)
#         response.raise_for_status()
#         print(f"Response status code: {response.status_code}")

#         soup = BeautifulSoup(response.text, 'html.parser')

#         songData = []
#         songElements = soup.find_all('div', class_='g-1 g-fix cifra')

#         if not songElements:
#             print("No song elements found on the page.")
#             return None

#         for elem in songElements:
#             songTitle = elem.find('h1', class_='t1')
#             artistName = elem.find('h2', class_='t3')
#             cifraDiv = elem.find('div', class_='cifra_cnt')

#             title = songTitle.text.strip() if songTitle else 'Unknown Title'
#             artist = artistName.text.strip() if artistName else 'Unknown Artist'
#             cifra = cifraDiv.text.strip() if cifraDiv else 'No Cifra'

#             songData.append({
#                 'song_title': title,
#                 'artist_name': artist,
#                 'song_cifra': cifra
#             })

#         print(f"Scraped data: {songData}")
#         return songData

#     except requests.exceptions.HTTPError as http_err:
#         print(f"HTTP error occurred: {http_err}")
#         return None
#     except Exception as e:
#         print(f"An error occurred: {e}")
#         return None

# @app.route('/scrape', methods=['POST'])
# def scrape_and_store():
#     data = request.json

#     # Se vier link_url, vamos usá-lo.
#     link_url = data.get('link')

#     artist = data.get('artist')
#     song = data.get('song')
#     instrument = data.get('instrument')
#     userEmail = data.get('email')
#     instrument_progressbar = data.get('instrument_progressbar')

#     if not userEmail or not instrument:
#         return jsonify({"message": "Missing required fields"}), 400

#     if link_url:
#         # Usa diretamente o link inteiro (pode ser /simplificada.html, #instrument=keys, etc.)
#         url_to_fetch = link_url.strip()
#     else:
#         # Se não veio link completo, volta para o método antigo
#         if not (artist and song):
#             return jsonify({"message": "Missing artist or song"}), 400
#         url_to_fetch = f'https://www.cifraclub.com.br/{artist}/{song}/'

#     songData = get_cifra(url_to_fetch)
#     if songData:
#         store_in_mongo(songData, instrument, userEmail, instrument_progressbar, link_url)
#         return jsonify({"message": "Data stored successfully"}), 201
#     else:
#         return jsonify({"message": "Failed to scrape data"}), 500

# def store_in_mongo(song_data, instrument, userEmail, instrument_progressbar, link_url):
#     try:
#         client = MongoClient("mongodb://root:example@db:27017/admin")
#         db = client["liveNloud_"]
#         collection = db["data"]

#         existing_user = collection.find_one({"email": userEmail})
#         if existing_user:
#             print("Email found, checking existing userdata.")
#             userdata = existing_user.get("userdata", [])

#             song_entry = next(
#                 (
#                     entry for entry in userdata
#                     if entry["artist"] == song_data[0]["artist_name"]
#                     and entry["song"] == song_data[0]["song_title"]
#                 ),
#                 None
#             )

#             if song_entry:
#                 print("Matching entry found, updating existing entry.")
#                 song_entry["instruments"][instrument] = True
#                 song_entry[instrument] = {
#                     "active": True,
#                     "capo": "",
#                     "tuning": "",
#                     "lastPlay": "2024-08-01",
#                     "songCifra": (
#                         song_data[0]['song_cifra']
#                         if instrument in ['guitar01', 'guitar02', 'bass', 'keys', 'drums', 'voice']
#                         else ""
#                     ),
#                     "progress": instrument_progressbar,
#                     "link": link_url
#                 }

#                 collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
#                 print("Data updated successfully in MongoDB.")
#             else:
#                 print("No matching entry found, adding new entry.")
#                 new_id = max([entry["id"] for entry in userdata], default=0) + 1

#                 new_entry = {
#                     "id": new_id,
#                     "song": song_data[0]['song_title'],
#                     "artist": song_data[0]['artist_name'],
#                     "progressBar": '',
#                     "instruments": {
#                         "guitar01": instrument == 'guitar01',
#                         "guitar02": instrument == 'guitar02',
#                         "bass": instrument == 'bass',
#                         "keys": instrument == 'keys',
#                         "drums": instrument == 'drums',
#                         "voice": instrument == 'voice'
#                     },
#                     "guitar01": {
#                         "active": instrument == 'guitar01',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_data[0]['song_cifra']
#                             if instrument == 'guitar01' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'guitar01' else 0,
#                         "link": link_url if instrument == 'guitar01' else ""
#                     },
#                     "guitar02": {
#                         "active": instrument == 'guitar02',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_data[0]['song_cifra']
#                             if instrument == 'guitar02' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'guitar02' else 0,
#                         "link": link_url if instrument == 'guitar02' else ""
#                     },
#                     "bass": {
#                         "active": instrument == 'bass',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_data[0]['song_cifra']
#                             if instrument == 'bass' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'bass' else 0,
#                         "link": link_url if instrument == 'bass' else ""
#                     },
#                     "keys": {
#                         "active": instrument == 'keys',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_data[0]['song_cifra']
#                             if instrument == 'keys' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'keys' else 0,
#                         "link": link_url if instrument == 'keys' else ""
#                     },
#                     "drums": {
#                         "active": instrument == 'drums',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_data[0]['song_cifra']
#                             if instrument == 'drums' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'drums' else 0,
#                         "link": link_url if instrument == 'drums' else ""
#                     },
#                     "voice": {
#                         "active": instrument == 'voice',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_data[0]['song_cifra']
#                             if instrument == 'voice' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'voice' else 0,
#                         "link": link_url if instrument == 'voice' else ""
#                     },
#                     "embedVideos": [],
#                     "addedIn": datetime.today().strftime('%Y-%m-%d'),
#                     "updateIn": datetime.today().strftime('%Y-%m-%d'),
#                     "email": userEmail
#                 }

#                 userdata.append(new_entry)
#                 collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
#         else:
#             print("Email not found, creating new userdata.")
#             new_id = 1
#             userdata = []
#             for song_info in song_data:
#                 userdata.append({
#                     "id": new_id,
#                     "song": song_info['song_title'],
#                     "artist": song_info['artist_name'],
#                     "progressBar": 0,
#                     "instruments": {
#                         "guitar01": instrument == 'guitar01',
#                         "guitar02": instrument == 'guitar02',
#                         "bass": instrument == 'bass',
#                         "keys": instrument == 'keys',
#                         "drums": instrument == 'drums',
#                         "voice": instrument == 'voice'
#                     },
#                     "guitar01": {
#                         "active": instrument == 'guitar01',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_info['song_cifra'] if instrument == 'guitar01' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'guitar01' else 0,
#                         "link": link_url if instrument == 'guitar01' else ""
#                     },
#                     "guitar02": {
#                         "active": instrument == 'guitar02',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_info['song_cifra'] if instrument == 'guitar02' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'guitar02' else 0,
#                         "link": link_url if instrument == 'guitar02' else ""
#                     },
#                     "bass": {
#                         "active": instrument == 'bass',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_info['song_cifra'] if instrument == 'bass' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'bass' else 0,
#                         "link": link_url if instrument == 'bass' else ""
#                     },
#                     "keys": {
#                         "active": instrument == 'keys',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_info['song_cifra'] if instrument == 'keys' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'keys' else 0,
#                         "link": link_url if instrument == 'keys' else ""
#                     },
#                     "drums": {
#                         "active": instrument == 'drums',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_info['song_cifra'] if instrument == 'drums' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'drums' else 0,
#                         "link": link_url if instrument == 'drums' else ""
#                     },
#                     "voice": {
#                         "active": instrument == 'voice',
#                         "capo": "",
#                         "tuning": "",
#                         "lastPlay": datetime.today().strftime('%Y-%m-%d'),
#                         "songCifra": (
#                             song_info['song_cifra'] if instrument == 'voice' else ""
#                         ),
#                         "progress": int(instrument_progressbar) if instrument == 'voice' else 0,
#                         "link": link_url if instrument == 'voice' else ""
#                     },
#                     "embedVideos": [],
#                     "addedIn": datetime.today().strftime('%Y-%m-%d'),
#                     "updateIn": datetime.today().strftime('%Y-%m-%d'),
#                     "email": userEmail,
#                 })
#             collection.insert_one({"email": userEmail, "userdata": userdata})
#         print("Data stored in MongoDB.")
#     except Exception as e:
#         print(f"An error occurred while storing data in MongoDB: {e}")

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=8000)

from flask import Flask, request, jsonify
from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup
from datetime import datetime

app = Flask(__name__)

def get_cifra(url):
    try:
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
            songTitle = elem.find('h1', class_='t1')
            artistName = elem.find('h2', class_='t3')
            cifraDiv = elem.find('div', class_='cifra_cnt')

            title = songTitle.text.strip() if songTitle else 'Unknown Title'
            artist = artistName.text.strip() if artistName else 'Unknown Artist'
            cifra = cifraDiv.text.strip() if cifraDiv else 'No Cifra'

            songData.append({
                'song_title': title,
                'artist_name': artist,
                'song_cifra': cifra
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

    songData = get_cifra(url_to_fetch)
    if songData:
        store_in_mongo(songData, instrument, userEmail, instrument_progressbar, link_url)
        return jsonify({"message": "Data stored successfully"}), 201
    else:
        return jsonify({"message": "Failed to scrape data"}), 500

def store_in_mongo(song_data, instrument, userEmail, instrument_progressbar, link_url):
    """
    Este método faz:
      1) Conexão e salvamento no liveNloud_/data (como antes).
      2) Também monta o payload e faz um POST para a rota Node /api/createMusic,
         para salvar em generalCifras/Documents.
    """
    try:
        # 1) Salvar no "liveNloud_" (código original)
        client = MongoClient("mongodb://root:example@db:27017/admin")
        db = client["liveNloud_"]
        collection = db["data"]

        existing_user = collection.find_one({"email": userEmail})
        if existing_user:
            print("Email found, checking existing userdata.")
            userdata = existing_user.get("userdata", [])

            song_entry = next(
                (
                    entry for entry in userdata
                    if entry["artist"] == song_data[0]["artist_name"]
                    and entry["song"] == song_data[0]["song_title"]
                ),
                None
            )

            if song_entry:
                print("Matching entry found, updating existing entry.")
                song_entry["instruments"][instrument] = True
                song_entry[instrument] = {
                    "active": True,
                    "capo": "",
                    "tuning": "",
                    "lastPlay": "2024-08-01",
                    "songCifra": (
                        song_data[0]['song_cifra']
                        if instrument in ['guitar01', 'guitar02', 'bass', 'keys', 'drums', 'voice']
                        else ""
                    ),
                    "progress": instrument_progressbar,
                    "link": link_url
                }

                collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
                print("Data updated successfully in MongoDB.")
                # APÓS ATUALIZAR AQUI, MANDA PARA A ROTA NODE:
                send_to_generalCifras(song_entry, instrument, instrument_progressbar)
            else:
                print("No matching entry found, adding new entry.")
                new_id = max([entry["id"] for entry in userdata], default=0) + 1

                new_entry = {
                    "id": new_id,
                    "song": song_data[0]['song_title'],
                    "artist": song_data[0]['artist_name'],
                    "progressBar": '',
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
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_data[0]['song_cifra']
                            if instrument == 'guitar01' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'guitar01' else 0,
                        "link": link_url if instrument == 'guitar01' else ""
                    },
                    "guitar02": {
                        "active": instrument == 'guitar02',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_data[0]['song_cifra']
                            if instrument == 'guitar02' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'guitar02' else 0,
                        "link": link_url if instrument == 'guitar02' else ""
                    },
                    "bass": {
                        "active": instrument == 'bass',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_data[0]['song_cifra']
                            if instrument == 'bass' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'bass' else 0,
                        "link": link_url if instrument == 'bass' else ""
                    },
                    "keys": {
                        "active": instrument == 'keys',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_data[0]['song_cifra']
                            if instrument == 'keys' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'keys' else 0,
                        "link": link_url if instrument == 'keys' else ""
                    },
                    "drums": {
                        "active": instrument == 'drums',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_data[0]['song_cifra']
                            if instrument == 'drums' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'drums' else 0,
                        "link": link_url if instrument == 'drums' else ""
                    },
                    "voice": {
                        "active": instrument == 'voice',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_data[0]['song_cifra']
                            if instrument == 'voice' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'voice' else 0,
                        "link": link_url if instrument == 'voice' else ""
                    },
                    "embedVideos": [],
                    "addedIn": datetime.today().strftime('%Y-%m-%d'),
                    "updateIn": datetime.today().strftime('%Y-%m-%d'),
                    "email": userEmail
                }

                userdata.append(new_entry)
                collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
                print("New entry added successfully to MongoDB.")
                # APÓS INSERIR NOVO, ENVIA PARA NODE:
                send_to_generalCifras(new_entry, instrument, instrument_progressbar)
        else:
            print("Email not found, creating new userdata.")
            new_id = 1
            userdata = []
            for song_info in song_data:
                new_doc = {
                    "id": new_id,
                    "song": song_info['song_title'],
                    "artist": song_info['artist_name'],
                    "progressBar": 0,
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
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_info['song_cifra'] if instrument == 'guitar01' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'guitar01' else 0,
                        "link": link_url if instrument == 'guitar01' else ""
                    },
                    "guitar02": {
                        "active": instrument == 'guitar02',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_info['song_cifra'] if instrument == 'guitar02' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'guitar02' else 0,
                        "link": link_url if instrument == 'guitar02' else ""
                    },
                    "bass": {
                        "active": instrument == 'bass',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_info['song_cifra'] if instrument == 'bass' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'bass' else 0,
                        "link": link_url if instrument == 'bass' else ""
                    },
                    "keys": {
                        "active": instrument == 'keys',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_info['song_cifra'] if instrument == 'keys' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'keys' else 0,
                        "link": link_url if instrument == 'keys' else ""
                    },
                    "drums": {
                        "active": instrument == 'drums',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_info['song_cifra'] if instrument == 'drums' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'drums' else 0,
                        "link": link_url if instrument == 'drums' else ""
                    },
                    "voice": {
                        "active": instrument == 'voice',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": (
                            song_info['song_cifra'] if instrument == 'voice' else ""
                        ),
                        "progress": int(instrument_progressbar) if instrument == 'voice' else 0,
                        "link": link_url if instrument == 'voice' else ""
                    },
                    "embedVideos": [],
                    "addedIn": datetime.today().strftime('%Y-%m-%d'),
                    "updateIn": datetime.today().strftime('%Y-%m-%d'),
                    "email": userEmail,
                }
                userdata.append(new_doc)
                # Para cada 'song_info' do scraping, incrementa new_id
                new_id += 1

            collection.insert_one({"email": userEmail, "userdata": userdata})
            print("New user created in MongoDB.")
            # Supondo que iremos enviar apenas o último doc inserido
            # ou todos se quiser (ex: loop). Aqui envio só o último p/ exemplo:
            send_to_generalCifras(new_doc, instrument, instrument_progressbar)

        print("Data stored in MongoDB.")
    except Exception as e:
        print(f"An error occurred while storing data in MongoDB: {e}")


def send_to_generalCifras(entry, instrument, instrument_progressbar):
    """
    Envia para a rota Node /api/createMusic
    usando a mesma estrutura que já enviamos ao 'liveNloud_'.
    Ajuste a URL da sua API Node abaixo.
    """
    try:
        node_api_url = "https://api.live.eloygomes.com.br/api/createMusic"

        # Monta o payload no formato esperado pela rota Node:
        # O 'entry' aqui é o que acabamos de salvar ou atualizar.
        # Adapte se algum campo estiver em outro formato
        payload = {
            "song": entry["song"],
            "artist": entry["artist"],
            # "progressBar": entry["progressBar"],  
            "instruments": entry["instruments"],
            "guitar01": entry.get("guitar01", {}),
            "guitar02": entry.get("guitar02", {}),
            "bass": entry.get("bass", {}),
            "keys": entry.get("keys", {}),
            "drums": entry.get("drums", {}),
            "voice": entry.get("voice", {}),
            # "embedVideos": entry.get("embedVideos", []),
            "addedIn": entry.get("addedIn", ""),
            # "updateIn": entry.get("updateIn", ""),
            # "email": entry["email"],
            "setlist": []  # Se quiser mandar setlist, e se existir, adicione
        }

        response = requests.post(node_api_url, json=payload)
        response.raise_for_status()
        print("Successfully saved in generalCifras via Node API:", response.json())
    except Exception as e:
        print("Error sending data to generalCifras Node API:", e)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)