from datetime import datetime

import requests
from pymongo import MongoClient

from config import MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTION_NAME, NODE_API_URL

# ---------------------------------------------------
# Constantes e helpers internos
# ---------------------------------------------------

INSTRUMENT_NAMES = ("guitar01", "guitar02", "bass", "keys", "drums", "voice")


def _today_str() -> str:
    return datetime.today().strftime('%Y-%m-%d')


def _build_instruments_dict(current_instrument: str) -> dict:
    """
    Cria o campo 'instruments' com True apenas para o instrumento atual,
    exatamente como no código original.
    """
    return {
        name: (name == current_instrument)
        for name in INSTRUMENT_NAMES
    }


def _build_instrument_block(
    name: str,
    current_instrument: str,
    song_info: dict,
    instrument_progressbar,
    link_url: str,
    *,
    cast_progress_to_int: bool,
    safe_get: bool,
) -> dict:
    """
    Cria o subdocumento de um instrumento (guitar01, bass, etc.)
    sem mudar o comportamento original:

    - Se NÃO for o instrumento atual:
        * active = False
        * textos vazios
        * progress = 0
        * link = ''
    - Se for o instrumento atual:
        * ativa song_cifra/tabs/chords/lyrics
        * progress:
            - se cast_progress_to_int=True → int(instrument_progressbar)
            - se cast_progress_to_int=False → usa instrument_progressbar "cru"
        * link = link_url
    - safe_get:
        - True  → usa song_info.get('chave', '')   (como no bloco do "novo usuário")
        - False → usa song_info['chave']           (como nos outros blocos)
    """

    active = (name == current_instrument)
    last_play = _today_str()

    # Escolhe como acessar os campos (get ou index)
    if safe_get:
        get_val = lambda k, default="": song_info.get(k, default)
    else:
        # no código original, songTabs/songChords são acessados direto com []
        # e isso levanta erro se não existir → preservamos esse comportamento
        get_val = lambda k, default="": song_info[k]

    if active:
        if cast_progress_to_int:
            try:
                progress_value = int(instrument_progressbar)
            except (TypeError, ValueError):
                progress_value = 0
        else:
            # preserva o comportamento de usar o valor "cru"
            progress_value = instrument_progressbar

        return {
            "active": active,
            "capo": get_val("capo", ""),
            "tuning": get_val("tuning", ""),
            "lastPlay": last_play,
            "songCifra": get_val("song_cifra", ""),
            "songTabs": get_val("songTabs", ""),
            "songChords": get_val("songChords", ""),
            "songLyrics": get_val("songLyrics", ""),
            "progress": progress_value,
            "link": link_url or "",
        }

    # Instrumento não é o atual → zera campos, como no código original
    return {
        "active": False,
        "capo": "",
        "tuning": "",
        "lastPlay": last_play,
        "songCifra": "",
        "songTabs": "",
        "songChords": "",
        "songLyrics": "",
        "progress": 0,
        "link": "",
    }


# ---------------------------------------------------
# Funções principais
# ---------------------------------------------------


def store_in_mongo(song_data, instrument, userEmail, instrument_progressbar, link_url):
    """
    Replica exatamente o comportamento do código original, mas usando helpers
    para montar os blocos de instrumentos.
    """
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        collection = db[MONGO_COLLECTION_NAME]

        existing_user = collection.find_one({"email": userEmail})

        if existing_user:
            print("Email found, checking existing userdata.")
            userdata = existing_user.get("userdata", [])
            first_song_info = song_data[0]

            # find existing song entry
            song_entry = next(
                (
                    e for e in userdata
                    if e["artist"] == first_song_info["artist_name"]
                    and e["song"] == first_song_info["song_title"]
                ),
                None
            )

            if song_entry:
                # ----------------------------------------------------------
                # Caso 1: usuário existe e música/já existe → UPDATE
                # ----------------------------------------------------------
                print("Matching entry found, updating existing entry.")

                # Apenas marca o instrumento atual como True (mantendo os outros)
                song_entry["instruments"][instrument] = True
                song_entry["capo"] = first_song_info.get("capo", "")
                song_entry["tom"] = first_song_info.get("tom", "")
                song_entry["tuning"] = first_song_info.get("tuning", "")

                # Mantemos o comportamento original:
                #   progress = instrument_progressbar (sem int())
                song_entry[instrument] = _build_instrument_block(
                    name=instrument,
                    current_instrument=instrument,
                    song_info=first_song_info,
                    instrument_progressbar=instrument_progressbar,
                    link_url=link_url,
                    cast_progress_to_int=False,   # update: valor cru
                    safe_get=True,                # lyrics-only sources may omit capo/tuning/tab fields
                )

                collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
                print("Data updated successfully in MongoDB.")
                send_to_generalCifras(song_entry, instrument, instrument_progressbar)

            else:
                # ----------------------------------------------------------
                # Caso 2: usuário existe mas música ainda não cadastrada
                #         → nova entry dentro do mesmo usuário
                # ----------------------------------------------------------
                print("No matching entry found, adding new entry.")
                new_id = max((e['id'] for e in userdata), default=0) + 1
                first_song_info = song_data[0]

                new_entry = {
                    'id': new_id,
                    'song': first_song_info['song_title'],
                    'artist': first_song_info['artist_name'],
                    'capo': first_song_info.get('capo', ''),
                    'tom': first_song_info.get('tom', ''),
                    'tuning': first_song_info.get('tuning', ''),
                    'progressBar': '',  # exatamente como no código original
                    'instruments': _build_instruments_dict(instrument),
                    'embedVideos': [],
                    'addedIn': _today_str(),
                    'updateIn': _today_str(),
                    'email': userEmail,
                }

                # Cria os blocos de cada instrumento (com int(progress))
                for name in INSTRUMENT_NAMES:
                    new_entry[name] = _build_instrument_block(
                        name=name,
                        current_instrument=instrument,
                        song_info=first_song_info,
                        instrument_progressbar=instrument_progressbar,
                        link_url=link_url,
                        cast_progress_to_int=True,   # aqui tinha int(...)
                        safe_get=True,               # lyrics-only sources may omit capo/tuning/tab fields
                    )

                userdata.append(new_entry)
                collection.update_one({"email": userEmail}, {"$set": {"userdata": userdata}})
                print("New entry added successfully to MongoDB.")
                send_to_generalCifras(new_entry, instrument, instrument_progressbar)

        else:
            # --------------------------------------------------------------
            # Caso 3: usuário ainda não existe → novo documento de usuário
            # --------------------------------------------------------------
            print("Email not found, creating new userdata.")
            new_id = 1
            userdata = []

            for song_info in song_data:
                new_doc = {
                    'id': new_id,
                    'song': song_info['song_title'],
                    'artist': song_info['artist_name'],
                    'capo': song_info.get('capo', ''),
                    'tom': song_info.get('tom', ''),
                    'tuning': song_info.get('tuning', ''),
                    'progressBar': 0,  # exatamente como no código original
                    'instruments': _build_instruments_dict(instrument),
                    'embedVideos': [],
                    'addedIn': _today_str(),
                    'updateIn': _today_str(),
                    'email': userEmail,
                }

                # Aqui o código original usava .get('songTabs','') etc,
                # então usamos safe_get=True para preservar esse comportamento.
                for name in INSTRUMENT_NAMES:
                    new_doc[name] = _build_instrument_block(
                        name=name,
                        current_instrument=instrument,
                        song_info=song_info,
                        instrument_progressbar=instrument_progressbar,
                        link_url=link_url,
                        cast_progress_to_int=True,   # tinha int(...) aqui
                        safe_get=True,               # usa get(..., '') como no original
                    )

                userdata.append(new_doc)
                new_id += 1

            collection.insert_one({"email": userEmail, "userdata": userdata})
            print("New user created in MongoDB.")
            # mantém o comportamento (envia o último new_doc criado)
            send_to_generalCifras(new_doc, instrument, instrument_progressbar)

        print("Data stored in MongoDB.")
    except Exception as e:
        print(f"An error occurred while storing data in MongoDB: {e}")
        raise


def send_to_generalCifras(entry, instrument, instrument_progressbar):
    """
    Mantido igual ao original em termos de dados enviados.
    """
    try:
        payload = {
            "song":        entry["song"],
            "artist":      entry["artist"],
            "capo":        entry.get("capo", ""),
            "tom":         entry.get("tom", ""),
            "tuning":      entry.get("tuning", ""),
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
        response = requests.post(NODE_API_URL, json=payload)
        response.raise_for_status()
        print("Successfully saved in generalCifras via Node API:", response.json())
    except Exception as e:
        print("Error sending data to generalCifras Node API:", e)
