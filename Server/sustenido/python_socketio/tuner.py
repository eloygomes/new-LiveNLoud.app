import socketio
import numpy as np

# ---------- Parâmetros de pitch ----------
FMIN = 40.0      # Hz (abaixo disso, guitarra/voz já complica; ajuste se quiser piano)
FMAX = 1200.0    # Hz (ajuste conforme necessidade)
ENERGY_GATE = 1e-6  # energia mínima após normalização para considerar válido

# ---------- Tabela de notas (como você já tinha) ----------
note_frequencies = {
    "C0": 16.35, "C#0/Db0": 17.32, "D0": 18.35, "D#0/Eb0": 19.45, "E0": 20.60,
    "F0": 21.83, "F#0/Gb0": 23.12, "G0": 24.50, "G#0/Ab0": 25.96, "A0": 27.50, "A#0/Bb0": 29.14, "B0": 30.87,
    "C1": 32.70, "C#1/Db1": 34.65, "D1": 36.71, "D#1/Eb1": 38.89, "E1": 41.20,
    "F1": 43.65, "F#1/Gb1": 46.25, "G1": 49.00, "G#1/Ab1": 51.91, "A1": 55.00, "A#1/Bb1": 58.27, "B1": 61.74,
    "C2": 65.41, "C#2/Db2": 69.30, "D2": 73.42, "D#2/Eb2": 77.78, "E2": 82.41,
    "F2": 87.31, "F#2/Gb2": 92.50, "G2": 98.00, "G#2/Ab2": 103.83, "A2": 110.00, "A#2/Bb2": 116.54, "B2": 123.47,
    "C3": 130.81, "C#3/Db3": 138.59, "D3": 146.83, "D#3/Eb3": 155.56, "E3": 164.81,
    "F3": 174.61, "F#3/Gb3": 185.00, "G3": 196.00, "G#3/Ab3": 207.65, "A3": 220.00, "A#3/Bb3": 233.08, "B3": 246.94,
    "C4": 261.63, "C#4/Db4": 277.18, "D4": 293.66, "D#4/Eb4": 311.13, "E4": 329.63,
    "F4": 349.23, "F#4/Gb4": 369.99, "G4": 392.00, "G#4/Ab4": 415.30, "A4": 440.00, "A#4/Bb4": 466.16, "B4": 493.88,
    "C5": 523.25, "C#5/Db5": 554.37, "D5": 587.33, "D#5/Eb5": 622.25, "E5": 659.25,
    "F5": 698.46, "F#5/Gb5": 739.99, "G5": 783.99, "G#5/Ab5": 830.61, "A5": 880.00, "A#5/Bb5": 932.33, "B5": 987.77,
    "C6": 1046.50, "C#6/Db6": 1108.73, "D6": 1174.66, "D#6/Eb6": 1244.51, "E6": 1318.51,
    "F6": 1396.91, "F#6/Gb6": 1479.98, "G6": 1567.98, "G#6/Ab6": 1661.22, "A6": 1760.00, "A#6/Bb6": 1864.66, "B6": 1975.53,
    "C7": 2093.00, "C#7/Db7": 2217.46, "D7": 2349.32, "D#7/Eb7": 2489.02, "E7": 2637.02,
    "F7": 2793.83, "F#7/Gb7": 2959.96, "G7": 3135.96, "G#7/Ab7": 3322.44, "A7": 3520.00, "A#7/Bb7": 3729.31, "B7": 3951.07,
    "C8": 4186.01
}

def create_note_ranges(frequencies):
    note_ranges = {}
    notes = sorted(frequencies.keys(), key=lambda n: frequencies[n])
    for i in range(len(notes) - 1):
        cur, nxt = notes[i], notes[i + 1]
        midpoint = np.sqrt(frequencies[cur] * frequencies[nxt])  # meio geométrico
        note_ranges[cur] = (frequencies[cur], midpoint)
    last_note = notes[-1]
    note_ranges[last_note] = (frequencies[last_note], frequencies[last_note] * 2)
    return note_ranges

note_ranges = create_note_ranges(note_frequencies)

# ---------- Utils musicais ----------
def find_nearest_note_in_range(freq):
    for note, (low, high) in note_ranges.items():
        if low <= freq < high:
            return note, low, high
    return None, None, None

def cents_difference(freq, ref_freq):
    return 1200 * np.log2(freq / ref_freq)

def create_tuning_bar(cents):
    bar_length = 31
    max_cents = 50
    center_index = bar_length // 2
    cents = max(-max_cents, min(max_cents, cents))
    position = int((cents + max_cents) * (bar_length - 1) / (2 * max_cents))
    bar = ['-'] * bar_length
    bar[center_index] = '|'
    if 0 <= position < bar_length:
        bar[position] = '*'
    return '[' + ''.join(bar) + ']'

# ---------- Pitch por autocorrelação ----------
def detect_pitch(samples_f32, rate):
    """
    samples_f32: float32 1-D (qualquer escala; normalizamos aqui)
    rate: sample rate REAL do áudio recebido
    """
    n = len(samples_f32)
    if n < int(rate / FMIN) * 2:  # janela mínima ~2 períodos do mais grave
        return 0.0

    # DC-block + normalização robusta
    x = samples_f32.astype(np.float32)
    x = x - np.mean(x)
    peak = np.max(np.abs(x)) + 1e-9
    x = x / peak

    # Janela de Hamming
    x *= np.hamming(n).astype(np.float32)

    # Autocorrelação (O(N^2); para N~3e4 ok)
    corr = np.correlate(x, x, mode='full')[n-1:]  # a partir do lag 0

    # Faixa de períodos (em amostras)
    min_period = int(rate / FMAX)
    max_period = int(rate / FMIN)
    if max_period <= min_period or max_period >= len(corr):
        return 0.0

    corr_subset = corr[min_period:max_period]
    if corr_subset.size < 3:
        return 0.0

    # Pico bruto
    k = np.argmax(corr_subset) + min_period

    # Verificação de energia/pico significativo
    if corr[k] < 0.1 * corr[0] or corr[0] < ENERGY_GATE:
        return 0.0

    # ---- Interpolação parabólica (sub-amostra) ----
    if 1 <= k < len(corr) - 1:
        y0, y1, y2 = corr[k-1], corr[k], corr[k+1]
        denom = (2.0 * (y0 - 2.0*y1 + y2))
        if abs(denom) > 1e-12:
            delta = (y0 - y2) / denom  # deslocamento em [-0.5, +0.5] se pico parabólico
            k = k + delta

    # Frequência
    if k <= 0:
        return 0.0
    return float(rate / k)

# ---------- Socket.IO client ----------
sio = socketio.Client()

NODEJS_URL = 'http://node:3000'
NAMESPACE = '/python'

@sio.event(namespace=NAMESPACE)
def connect():
    print("✅ Conectado ao servidor Node.js via Socket.IO")

@sio.event(namespace=NAMESPACE)
def disconnect():
    print("❌ Desconectado do servidor Node.js")

@sio.on('processData', namespace=NAMESPACE)
def receber_dados(data):
    # Esperado: data['audioData'] (bytes), data['clientId'], opcional data['sampleRate']
    try:
        client_id = data.get('clientId', 'unknown')
        audio_data = data['audioData']
        sr = int(data.get('sampleRate', 44100))  # <— SR dinâmico (FALLBACK 44100)

        # Int16 -> float32 em [-1, 1]
        x = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0

        print(f"📥 Cliente {client_id}: {x.shape[0]} amostras, SR={sr}")

        pitch = detect_pitch(x, sr)
        if pitch <= 0 or pitch > 5000:
            print(f"⚠️ pitch inválido: {pitch:.2f} Hz")
            return

        note, _, _ = find_nearest_note_in_range(pitch)
        if note is None:
            print(f"⚠️ nenhuma nota para {pitch:.2f} Hz")
            return

        ref = note_frequencies[note]
        cents = cents_difference(pitch, ref)
        bar = create_tuning_bar(cents)

        resultado = {
            'note': note,
            'frequency': pitch,
            'cents': cents,
            'tuningBar': bar,
            'clientId': client_id,
            'usedSampleRate': sr,     # para debug no front
        }

        sio.emit('processedData', resultado, namespace=NAMESPACE)
        print(f"📤 {client_id}: {note} | {pitch:.2f} Hz | {cents:+.1f} cents")

    except Exception as e:
        print(f"❌ Erro ao processar: {e}")

if __name__ == '__main__':
    print(f"Conectando em {NODEJS_URL}{NAMESPACE} …")
    sio.connect(NODEJS_URL, namespaces=[NAMESPACE])
    sio.wait()