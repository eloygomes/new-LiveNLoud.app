from flask import Flask, request, jsonify
from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup
from datetime import datetime

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
    # print("Received data:", data)
    artist = data.get('artist')
    song = data.get('song')
    instrument = data.get('instrument')
    userEmail = data.get('email')
    instrument_progressbar = data.get('instrument_progressbar')
    link_url = data.get('link')
    
          

    if not artist or not song or not instrument or not userEmail:
        return jsonify({"message": "Missing required fields"}), 400

    songData = get_cifra(artist, song)
    if songData:
        store_in_mongo(songData, instrument, userEmail, instrument_progressbar, link_url)
        return jsonify({"message": "Data stored successfully"}), 201
    else:
        return jsonify({"message": "Failed to scrape data"}), 500



def store_in_mongo(song_data, instrument, userEmail, instrument_progressbar, link_url):
    try:
        # Conecta ao MongoDB usando a URI fornecida
        client = MongoClient("mongodb://root:example@db:27017/admin")
        db = client["liveNloud_"]
        collection = db["data"]

        # Verifica se já existe um documento com o email fornecido
        existing_user = collection.find_one({"email": userEmail})
        if existing_user:
            print("Email found, checking existing userdata.")
            userdata = existing_user.get("userdata", [])

            # Verifica se já existe uma entrada para a música e o artista especificados
            song_entry = next((entry for entry in userdata if entry["artist"] == song_data[0]
                              ["artist_name"] and entry["song"] == song_data[0]["song_title"]), None)

            if song_entry:
                print("Matching entry found, updating existing entry.")
                # Se a entrada da música for encontrada, atualiza o instrumento específico
                song_entry["instruments"][instrument] = True
                song_entry[instrument] = {
                    "active": True,
                    "capo": "",  # Placeholder, pode ser ajustado conforme necessário
                    "tuning": "",  # Placeholder, pode ser ajustado conforme necessário
                    "lastPlay": "2024-08-01",  # Data de última reprodução, pode ser ajustada
                    "songCifra": song_data[0]['song_cifra'] if instrument in ['guitar01', 'guitar02', 'bass', 'keys', 'drums', 'voice'] else "",
                    "progress": instrument_progressbar,  # Adiciona o progresso do instrumento
                    "link": link_url
                }

                # Atualiza o documento no MongoDB com as novas informações
                collection.update_one({"email": userEmail}, {
                                      "$set": {"userdata": userdata}})
                print("Data updated successfully in MongoDB.")
            else:
                print("No matching entry found, adding new entry.")
                # Se a entrada da música não for encontrada, cria uma nova entrada
                new_id = max([entry["id"]
                             for entry in userdata], default=0) + 1

                new_entry = {
                    "id": new_id,  # Gera um novo ID para a entrada
                    "song": song_data[0]['song_title'],  # Título da música
                    "artist": song_data[0]['artist_name'],  # Nome do artista
                    "progressBar": '',  # Placeholder para uma barra de progresso
                    "instruments": {  # Mapeia os instrumentos e define quais estão ativos
                        "guitar01": instrument == 'guitar01',
                        "guitar02": instrument == 'guitar02',
                        "bass": instrument == 'bass',
                        "keys": instrument == 'keys',
                        "drums": instrument == 'drums',
                        "voice": instrument == 'voice'
                    },
                    # Dados específicos para cada instrumento, ajustados conforme necessário
                    "guitar01": {
                        "active": instrument == 'guitar01',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'guitar01' else "",
                        "progress": int(instrument_progressbar) if instrument == 'guitar01' else 0,
                        "link": link_url if instrument == 'guitar01' else ""
                    },
                    "guitar02": {
                        "active": instrument == 'guitar02',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'guitar02' else "",
                        "progress": int(instrument_progressbar) if instrument == 'guitar02' else 0,
                        "link": link_url if instrument == 'guitar02' else ""
                    },
                    "bass": {
                        "active": instrument == 'bass',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'bass' else "",
                        "progress": int(instrument_progressbar) if instrument == 'bass' else 0,
                        "link": link_url if instrument == 'bass' else ""
                    },
                    "keys": {
                        "active": instrument == 'keys',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'keys' else "",
                        "progress": int(instrument_progressbar) if instrument == 'keys' else 0,
                        "link": link_url if instrument == 'keys' else ""
                    },
                    "drums": {
                        "active": instrument == 'drums',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'drums' else "",
                        "progress": int(instrument_progressbar) if instrument == 'drums' else 0,
                        "link": link_url if instrument == 'drums' else ""
                    },
                    "voice": {
                        "active": instrument == 'voice',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'voice' else "",
                        "progress": int(instrument_progressbar) if instrument == 'voice' else 0,
                        "link": link_url if instrument == 'voice' else ""
                    },
                    "embedVideos": [],  # Placeholder para vídeos embutidos
                    "addedIn": datetime.today().strftime('%Y-%m-%d'),  # Data de adição
                    "updateIn": datetime.today().strftime('%Y-%m-%d'),  # Data de última atualização
                    "email": userEmail,  # Email do usuário
                }

                # Adiciona a nova entrada ao array userdata
                userdata.append(new_entry)
                # Atualiza o documento do usuário no MongoDB com a nova entrada de música
                collection.update_one({"email": userEmail}, {
                                      "$set": {"userdata": userdata}})
        else:
            print("Email not found, creating new userdata.")
            # Se o email não for encontrado, cria um novo documento para o usuário
            new_id = 1
            userdata = []
            for song in song_data:
                userdata.append({
                    "id": new_id,
                    "song": song['song_title'],
                    "artist": song['artist_name'],
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
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'guitar01' else "",
                        "progress": int(instrument_progressbar) if instrument == 'guitar01' else 0,
                        "link": link_url if instrument == 'guitar01' else ""
                    },
                    "guitar02": {
                        "active": instrument == 'guitar02',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'guitar02' else "",
                        "progress": int(instrument_progressbar) if instrument == 'guitar02' else 0,
                        "link": link_url if instrument == 'guitar02' else ""
                    },
                    "bass": {
                        "active": instrument == 'bass',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'bass' else "",
                        "progress": int(instrument_progressbar) if instrument == 'bass' else 0,
                        "link": link_url if instrument == 'bass' else ""
                    },
                    "keys": {
                        "active": instrument == 'keys',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'keys' else "",
                        "progress": int(instrument_progressbar) if instrument == 'keys' else 0,
                        "link": link_url if instrument == 'keys' else ""
                    },
                    "drums": {
                        "active": instrument == 'drums',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'drums' else "",
                        "progress": int(instrument_progressbar) if instrument == 'drums' else 0,
                        "link": link_url if instrument == 'drums' else ""
                    },
                    "voice": {
                        "active": instrument == 'voice',
                        "capo": "",
                        "tuning": "",
                        "lastPlay": datetime.today().strftime('%Y-%m-%d'),
                        "songCifra": song_data[0]['song_cifra'] if instrument == 'voice' else "",
                        "progress": int(instrument_progressbar) if instrument == 'voice' else 0,
                        "link": link_url if instrument == 'voice' else ""
                    },
                    "embedVideos": [],
                    "addedIn": datetime.today().strftime('%Y-%m-%d'),
                    "updateIn": datetime.today().strftime('%Y-%m-%d'),
                    "email": userEmail,
                })

            # Insere o novo documento de usuário no MongoDB
            collection.insert_one({"email": userEmail, "userdata": userdata})
        print("Data stored in MongoDB.")
    except Exception as e:
        # Captura qualquer erro durante o processo e exibe uma mensagem de erro
        print(f"An error occurred while storing data in MongoDB: {e}")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
