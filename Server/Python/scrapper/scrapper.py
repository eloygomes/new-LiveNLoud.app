import requests
from bs4 import BeautifulSoup
import json


def get_cifra(artist, song):
    url = f'https://www.cifraclub.com.br/{artist}/{song}/'
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    songData = []
    songElements = soup.find_all('div', class_='g-1 g-fix cifra')

    for elem in songElements:
        songTitle = elem.find('h1', class_='t1').text.strip()
        artistName = elem.find('h2', class_='t3').text.strip()

        songCifra = elem.find('div', class_='cifra_cnt').text.strip()

        # print(songCifra)

        songData.append({
            'song_title': songTitle,
            'artist_name': artistName,
            'song_cifra': songCifra

        })

    # print(songData)

    return songData


def main():
    songData = get_cifra('the-smiths', 'this-charming-man')

    for song in songData:
        print(f"Cifra {song['song_title']}")
        print(f"Artist: {song['artist_name']}")
        print(f"Cifra: {song['song_cifra'][:100]}...")


if __name__ == '__main__':
    main()
