



from flask import Flask, request, jsonify
from pymongo import MongoClient
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import re

app = Flask(__name__)

# ———————————————— Helpers ————————————————

# (1) Tab lines: your original logic
_TAB_STARTS = ("e|", "B|", "G|", "D|", "A|", "E|", "e:", "B:", "G:", "D:", "A:", "E:")
def _is_tab_line(line: str) -> bool:
    return (
        line.lstrip().startswith(_TAB_STARTS)
        or line.count("-") >= 5
    )

def _extract_tabs(cifra: str) -> str:
    out = []
    lines = cifra.splitlines()
    i = 0
    while i < len(lines):
        if _is_tab_line(lines[i]) and i + 2 < len(lines) \
           and _is_tab_line(lines[i+1]) and _is_tab_line(lines[i+2]):
            while i < len(lines) and _is_tab_line(lines[i]):
                out.append(lines[i].rstrip())
                i += 1
            out.append("")  # blank line between tab-blocks
        else:
            i += 1
    return "\n".join(out).strip()

# (2) Chord lines: detect if a line contains ≥2 standalone chords
# _CHORD_RE = re.compile(r"""
#     (?<=^|\s|\()             # 1) precedido de início de linha, espaço ou '('
#     [A-G]                    # 2) nota raiz A–G
#     [#b]?                    # 3) opcional sustenido ou bemol
#     (?:
#         (?:maj|min|m)?\d+M?  # 4a) opcional "maj"/"min"/"m" + número + "M" opcional (Cmaj7, Cm7, C7M, Eb7M)
#       | sus\d*               # 4b) suspensos: sus2, sus4, etc.
#       | aug                  # 4c) aumentados
#       | dim                  # 4d) diminutos
#       | [º°+\-]              # 4e) símbolos: º, °, +, –
#     )?
#     (?:\([^)]*\))?           # 5) extensões em parênteses: (4), (4/9), (add9)
#     (?:/[A-G][#b]?)?         # 6) baixo alternativo: C/E, F#/A#
#     (?=$|\s|\))              # 7) seguido de fim de string, espaço ou ')'
# """, re.VERBOSE)

CHORD_PATTERN = (
    r'^[A-G]'              
    r'[#b]?'               
    r'(?:(?:maj|min|m)?\d+M?'  
    r'|sus\d*'             
    r'|aug'                
    r'|dim'                
    r'|[º°+\-])?'          
    r'(?:\([^)]*\))?'      
    r'(?:/[A-G][#b]?)?'    
    r'$'
)
_CHORD_RE = re.compile(CHORD_PATTERN)


def _is_chord_line(line: str) -> bool:
    tokens = line.strip().split()
    matches = sum(1 for t in tokens if _CHORD_RE.fullmatch(t))
    return matches >= 2



import re

def _extract_chords(cifra: str) -> str:
    """
    1) Remove linhas de tablatura
    2) Mantém linhas de acordes intactas
    3) Oculta todas as demais linhas (letras) com display:none
    4) Limita a no máximo 3 linhas em branco consecutivas
    """
    lines = cifra.splitlines(keepends=True)
    out = []

    for line in lines:
        # ——— 1) Descarta linhas de tablatura ——————————————————————————
        # Se a linha for identificada como tab, pula ela
        if _is_tab_line(line):
            continue

        # ——— 2) Mantém linhas de acordes intactas ————————————————————
        # Se a linha contiver ≥2 acordes, adiciona sem alteração
        if _is_chord_line(line):
            out.append(line)
            continue

        # ——— 3) Preserva linhas em branco —————————————————————————
        # Mantém as linhas vazias (serão colapsadas no final)
        if re.match(r'^[ \t]*\n$', line):
            out.append(line)
            continue

        # ——— 4) Oculta linhas de letra ——————————————————————————————
        # Tudo que restou é letra: envolve em span com display:none,
        # mantendo a indentação original
        content = line.rstrip('\n')
        out.append(f'<span style="color:lightgrey">{content}</span>\n')

    # ——— 5) Colapsa 4+ quebras de linha em exatamente 3 ——————————
    blank_re = re.compile(r'(?:\n){4,}')  # quatro ou mais '\n' seguidos
    result = blank_re.sub('\n\n\n', ''.join(out))

    return result





# (3) Lyrics: anything that’s not tabs, not chords, and not blank

def _extract_lyrics(cifra: str) -> str:
    # 1) remover linhas de seção (inclui H.N, 'tom:', cabeçalhos e partes)
    section_re = re.compile(
        r'(?im)^[ \t]*'
        r'(?:'
          r'tom:'
          r'|\[Intro\]'
          r'|\[Solo Intro\]'
          r'|H\.N'
          r'|\[Primeira Parte\]'
          r'|\[Segunda Parte\]'
          r'|\[Terceira Parte\]'
          r'|\[Solo\]'
          r'|\[Solo Principal\]'
          r'|\[Final\]'
          r'|Parte\s*\d+\s*(?:De|de)\s*\d+'
          r'|Pate\s*\d+\s*de\s*\d+'
        r')'
        r'.*\n?',
        flags=re.MULTILINE
    )
    result = section_re.sub('', cifra)

    # 2) remover linhas de tablatura e cabeçalhos "[Tab ...]"
    tab_line_re   = re.compile(r'(?m)^[ \t]*[eEBGDA]\|.*\n?')
    tab_header_re = re.compile(r'(?m)^\[Tab[^\]]*\].*\n?')
    result = tab_line_re.sub('', result)
    result = tab_header_re.sub('', result)

    # 3) esconder qualquer linha que contenha um acorde, envolvendo toda a linha em display:none
    chord_body = (
        r'[A-G][#b]?'
        r'(?:(?:maj|min|m)?\d*|\d+M|sus\d*|aug|dim|º|°|\+|\-)?'
        r'(?:/[A-G][#b]?)?'
    )
    chord_line_re = re.compile(rf'(?m)^[ \t]*.*\b{chord_body}\b.*\n?')
    result = chord_line_re.sub(lambda m: f'<span style="display:none">{m.group(0)}</span>', result)

    # 4) remover parênteses vazios e linhas só com "( )"
    empty_par_re = re.compile(r'(?m)^\(\s*\)\s*\n?')
    result = empty_par_re.sub('', result)

    # 5) colapsar mais de 3 linhas em branco consecutivas para exatamente 3
    blank_re = re.compile(r'(?:\n[ \t]*){4,}')
    result = blank_re.sub('\n\n\n', result)

    return result



# ————————————— song_cifra_treatment —————————————
def song_cifra_treatment(song_cifra: str) -> dict:
    """
    Decomposes the full cifra text into:
      - songFull:     original raw text
      - songTabs:     only the tablature blocks
      - songChords:   only the chord-line blocks
      - songLyrics:   only the lyric lines
    """
    tabs   = _extract_tabs(song_cifra)
    chords = _extract_chords(song_cifra)
    lyrics = _extract_lyrics(song_cifra)

    return {
        "song_cifra": song_cifra,
        "songTabs":  tabs,
        "songChords": chords,
        "songLyrics": lyrics,
    }


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
            songTitle  = elem.find('h1', class_='t1')
            artistName = elem.find('h2', class_='t3')
            cifraDiv   = elem.find('div', class_='cifra_cnt')

            title  = songTitle.text.strip()  if songTitle  else 'Unknown Title'
            artist = artistName.text.strip() if artistName else 'Unknown Artist'
            cifra  = cifraDiv.text.strip()    if cifraDiv   else 'No Cifra'

            songData.append({
                'song_title':  title,
                'artist_name': artist,
                'song_cifra':  cifra
            })

        # Always treat the first scraped block
        first = songData[0]
        treat = song_cifra_treatment(first['song_cifra'])
        enriched = {
            'song_title':  first['song_title'],
            'artist_name': first['artist_name'],
            'song_cifra':  first['song_cifra'],
            'songTabs':    treat['songTabs'],
            'songChords':  treat['songChords'],
            'songLyrics':  treat['songLyrics'],
        }
        return [enriched]

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
    artist    = data.get('artist')
    song      = data.get('song')
    instrument            = data.get('instrument')
    userEmail             = data.get('email')
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
    try:
        client     = MongoClient("mongodb://root:example@db:27017/admin")
        db         = client["liveNloud_"]
        collection = db["data"]

        existing_user = collection.find_one({"email": userEmail})
        if existing_user:
            print("Email found, checking existing userdata.")
            userdata = existing_user.get("userdata", [])

            # find existing song entry
            song_entry = next(
                (e for e in userdata
                 if e["artist"] == song_data[0]["artist_name"]
                 and e["song"] == song_data[0]["song_title"]),
                None
            )
            if song_entry:
                print("Matching entry found, updating existing entry.")
                song_entry["instruments"][instrument] = True
                song_entry[instrument] = {
                    "active":    True,
                    "capo":      "",
                    "tuning":    "",
                    "lastPlay":  datetime.today().strftime('%Y-%m-%d'),
                    "songCifra": song_data[0]['song_cifra'],
                    "songTabs":  song_data[0]['songTabs'],
                    "songChords":song_data[0]['songChords'],
                    "songLyrics":song_data[0]['songLyrics'],
                    "progress":  instrument_progressbar,
                    "link":      link_url
                }
                collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
                print("Data updated successfully in MongoDB.")
                send_to_generalCifras(song_entry, instrument, instrument_progressbar)
            else:
                print("No matching entry found, adding new entry.")
                new_id = max((e['id'] for e in userdata), default=0) + 1
                new_entry = {
                    'id':       new_id,
                    'song':     song_data[0]['song_title'],
                    'artist':   song_data[0]['artist_name'],
                    'progressBar': '',
                    'instruments': {
                        'guitar01': instrument=='guitar01',
                        'guitar02': instrument=='guitar02',
                        'bass':     instrument=='bass',
                        'keys':     instrument=='keys',
                        'drums':    instrument=='drums',
                        'voice':    instrument=='voice'
                    },
                    'guitar01': {
                        'active':    instrument=='guitar01',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_data[0]['song_cifra']  if instrument=='guitar01' else '',
                        'songTabs':  song_data[0]['songTabs']   if instrument=='guitar01' else '',
                        'songChords':song_data[0]['songChords'] if instrument=='guitar01' else '',
                        'songLyrics':song_data[0]['songLyrics'] if instrument=='guitar01' else '',
                        'progress':  int(instrument_progressbar) if instrument=='guitar01' else 0,
                        'link':      link_url if instrument=='guitar01' else ''
                    },
                    'guitar02': {
                        'active':    instrument=='guitar02',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_data[0]['song_cifra']  if instrument=='guitar02' else '',
                        'songTabs':  song_data[0]['songTabs']   if instrument=='guitar02' else '',
                        'songChords':song_data[0]['songChords'] if instrument=='guitar02' else '',
                        'songLyrics':song_data[0]['songLyrics'] if instrument=='guitar02' else '',
                        'progress':  int(instrument_progressbar) if instrument=='guitar02' else 0,
                        'link':      link_url if instrument=='guitar02' else ''
                    },
                    'bass': {
                        'active':    instrument=='bass',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_data[0]['song_cifra']  if instrument=='bass' else '',
                        'songTabs':  song_data[0]['songTabs']   if instrument=='bass' else '',
                        'songChords':song_data[0]['songChords'] if instrument=='bass' else '',
                        'songLyrics':song_data[0]['songLyrics'] if instrument=='bass' else '',
                        'progress':  int(instrument_progressbar) if instrument=='bass' else 0,
                        'link':      link_url if instrument=='bass' else ''
                    },
                    'keys': {
                        'active':    instrument=='keys',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_data[0]['song_cifra']  if instrument=='keys' else '',
                        'songTabs':  song_data[0]['songTabs']   if instrument=='keys' else '',
                        'songChords':song_data[0]['songChords'] if instrument=='keys' else '',
                        'songLyrics':song_data[0]['songLyrics'] if instrument=='keys' else '',
                        'progress':  int(instrument_progressbar) if instrument=='keys' else 0,
                        'link':      link_url if instrument=='keys' else ''
                    },
                    'drums': {
                        'active':    instrument=='drums',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_data[0]['song_cifra']  if instrument=='drums' else '',
                        'songTabs':  song_data[0]['songTabs']   if instrument=='drums' else '',
                        'songChords':song_data[0]['songChords'] if instrument=='drums' else '',
                        'songLyrics':song_data[0]['songLyrics'] if instrument=='drums' else '',
                        'progress':  int(instrument_progressbar) if instrument=='drums' else 0,
                        'link':      link_url if instrument=='drums' else ''
                    },
                    'voice': {
                        'active':    instrument=='voice',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_data[0]['song_cifra']  if instrument=='voice' else '',
                        'songTabs':  song_data[0]['songTabs']   if instrument=='voice' else '',
                        'songChords':song_data[0]['songChords'] if instrument=='voice' else '',
                        'songLyrics':song_data[0]['songLyrics'] if instrument=='voice' else '',
                        'progress':  int(instrument_progressbar) if instrument=='voice' else 0,
                        'link':      link_url if instrument=='voice' else ''
                    },
                    'embedVideos': [],
                    'addedIn':     datetime.today().strftime('%Y-%m-%d'),
                    'updateIn':    datetime.today().strftime('%Y-%m-%d'),
                    'email':       userEmail
                }
                userdata.append(new_entry)
                collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
                print("New entry added successfully to MongoDB.")
                send_to_generalCifras(new_entry, instrument, instrument_progressbar)
        else:
            print("Email not found, creating new userdata.")
            new_id = 1
            userdata = []
            for song_info in song_data:
                new_doc = {
                    'id':       new_id,
                    'song':     song_info['song_title'],
                    'artist':   song_info['artist_name'],
                    'progressBar': 0,
                    'instruments': {
                        'guitar01': instrument=='guitar01',
                        'guitar02': instrument=='guitar02',
                        'bass':     instrument=='bass',
                        'keys':     instrument=='keys',
                        'drums':    instrument=='drums',
                        'voice':    instrument=='voice'
                    },
                    'guitar01': {
                        'active':    instrument=='guitar01',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_info['song_cifra']  if instrument=='guitar01' else '',
                        'songTabs':  song_info.get('songTabs','')   if instrument=='guitar01' else '',
                        'songChords':song_info.get('songChords','') if instrument=='guitar01' else '',
                        'songLyrics':song_info.get('songLyrics','') if instrument=='guitar01' else '',
                        'progress':  int(instrument_progressbar) if instrument=='guitar01' else 0,
                        'link':      link_url if instrument=='guitar01' else ''
                    },
                    'guitar02': {
                        'active':    instrument=='guitar02',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_info['song_cifra']  if instrument=='guitar02' else '',
                        'songTabs':  song_info.get('songTabs','')   if instrument=='guitar02' else '',
                        'songChords':song_info.get('songChords','') if instrument=='guitar02' else '',
                        'songLyrics':song_info.get('songLyrics','') if instrument=='guitar02' else '',
                        'progress':  int(instrument_progressbar) if instrument=='guitar02' else 0,
                        'link':      link_url if instrument=='guitar02' else ''
                    },
                    'bass': {
                        'active':    instrument=='bass',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_info['song_cifra']  if instrument=='bass' else '',
                        'songTabs':  song_info.get('songTabs','')   if instrument=='bass' else '',
                        'songChords':song_info.get('songChords','') if instrument=='bass' else '',
                        'songLyrics':song_info.get('songLyrics','') if instrument=='bass' else '',
                        'progress':  int(instrument_progressbar) if instrument=='bass' else 0,
                        'link':      link_url if instrument=='bass' else ''
                    },
                    'keys': {
                        'active':    instrument=='keys',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_info['song_cifra']  if instrument=='keys' else '',
                        'songTabs':  song_info.get('songTabs','')   if instrument=='keys' else '',
                        'songChords':song_info.get('songChords','') if instrument=='keys' else '',
                        'songLyrics':song_info.get('songLyrics','') if instrument=='keys' else '',
                        'progress':  int(instrument_progressbar) if instrument=='keys' else 0,
                        'link':      link_url if instrument=='keys' else ''
                    },
                    'drums': {
                        'active':    instrument=='drums',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_info['song_cifra']  if instrument=='drums' else '',
                        'songTabs':  song_info.get('songTabs','')   if instrument=='drums' else '',
                        'songChords':song_info.get('songChords','') if instrument=='drums' else '',
                        'songLyrics':song_info.get('songLyrics','') if instrument=='drums' else '',
                        'progress':  int(instrument_progressbar) if instrument=='drums' else 0,
                        'link':      link_url if instrument=='drums' else ''
                    },
                    'voice': {
                        'active':    instrument=='voice',
                        'capo':      '',
                        'tuning':    '',
                        'lastPlay':  datetime.today().strftime('%Y-%m-%d'),
                        'songCifra': song_info['song_cifra']  if instrument=='voice' else '',
                        'songTabs':  song_info.get('songTabs','')   if instrument=='voice' else '',
                        'songChords':song_info.get('songChords','') if instrument=='voice' else '',
                        'songLyrics':song_info.get('songLyrics','') if instrument=='voice' else '',
                        'progress':  int(instrument_progressbar) if instrument=='voice' else 0,
                        'link':      link_url if instrument=='voice' else ''
                    },
                    'embedVideos': [],
                    'addedIn':     datetime.today().strftime('%Y-%m-%d'),
                    'updateIn':    datetime.today().strftime('%Y-%m-%d'),
                    'email':       userEmail
                }
                userdata.append(new_doc)
                new_id += 1

            collection.insert_one({"email": userEmail, "userdata": userdata})
            print("New user created in MongoDB.")
            send_to_generalCifras(new_doc, instrument, instrument_progressbar)

        print("Data stored in MongoDB.")
    except Exception as e:
        print(f"An error occurred while storing data in MongoDB: {e}")


def send_to_generalCifras(entry, instrument, instrument_progressbar):
    try:
        node_api_url = "https://api.live.eloygomes.com.br/api/createMusic"
        payload = {
            "song":        entry["song"],
            "artist":      entry["artist"],
            "instruments": entry["instruments"],
            "guitar01":    entry.get("guitar01", {}),
            "guitar02":    entry.get("guitar02", {}),
            "bass":        entry.get("bass", {}),
            "keys":        entry.get("keys", {}),
            "drums":       entry.get("drums", {}),
            "voice":       entry.get("voice", {}),
            "addedIn":     entry.get("addedIn", ""),
            "setlist":     []
        }
        response = requests.post(node_api_url, json=payload)
        response.raise_for_status()
        print("Successfully saved in generalCifras via Node API:", response.json())
    except Exception as e:
        print("Error sending data to generalCifras Node API:", e)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
