import requests
from bs4 import BeautifulSoup
import json
from pymongo import MongoClient


def get_cifra(artist, song):
    try:
        url = f'https://www.cifraclub.com.br/{artist}/{song}/'
        response = requests.get(url)
        response.raise_for_status()  # Levanta um erro se o status HTTP for 4xx/5xx
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
        print("error", e)
        return None


def store_in_mongo(song_data):
    client = MongoClient("mongodb://root:example@db:27017/admin")
    db = client["mydatabase"]
    collection = db["songs"]

    if song_data:
        result = collection.insert_many(song_data)
        print(f"Documentos inseridos com IDs: {result.inserted_ids}")

        for song in collection.find({"artist_name": song_data[0]['artist_name']}):
            print("Documento recuperado:")
            print(song)
    else:
        print("Nenhum dado foi armazenado no MongoDB.")


def main():
    # songData = get_cifra('the-smiths', 'this-charming-man')
    songData = get_cifra('angra', 'rebirth')

    if songData:
        for song in songData:
            # print(f"Cifra {song['song_title']}")
            # print(f"Artist: {song['artist_name']}")
            # print(f"Cifra: {song['song_cifra'][:100]}...")

            print('Song added to MongoDB')

        # Armazenando os dados no MongoDB
        store_in_mongo(songData)
    else:
        print("Erro ao fazer o scraping da cifra.")


if __name__ == '__main__':
    main()
