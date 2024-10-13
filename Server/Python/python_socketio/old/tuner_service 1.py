import pyaudio
import numpy as np

# All notes and frequencies (A4 = 440 Hz reference tuning)
note_frequencies = {
    # (Full dictionary included)
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

# PyAudio Parameters
CHUNK = 8192  # Increased from 4096
FORMAT = pyaudio.paInt16  # Audio format (16-bit)
CHANNELS = 1  # Mono audio
RATE = 44100  # Sample rate (44.1 kHz)

# Initialize PyAudio
p = pyaudio.PyAudio()

# Open stream
stream = p.open(format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK)


def detect_pitch(data):
    """Detects the pitch of the audio data using autocorrelation."""
    # Convert audio data to numpy array
    samples = np.frombuffer(data, dtype=np.int16).astype(np.float32)

    # Apply a Hamming window to reduce spectral leakage
    window = np.hamming(len(samples))
    samples = samples * window

    # Normalize samples
    samples -= np.mean(samples)
    # Add epsilon to prevent division by zero
    samples /= np.max(np.abs(samples)) + 1e-6

    # Compute autocorrelation using FFT for efficiency
    corr = np.correlate(samples, samples, mode='full')
    corr = corr[len(corr)//2:]  # Take the second half

    # Find the first significant peak in autocorrelation
    peak_index = find_autocorrelation_peak(corr, RATE)

    # Calculate fundamental frequency
    if peak_index > 0:
        frequency = RATE / peak_index
    else:
        frequency = 0

    return frequency


def find_autocorrelation_peak(corr, rate):
    """Finds the peak in the autocorrelation function corresponding to the fundamental frequency."""
    # Minimum and maximum periods (in samples)
    min_period = int(rate / 500)  # Max frequency 500 Hz
    max_period = int(rate / 50)   # Min frequency 50 Hz

    # Search within the range of interest
    corr_subset = corr[min_period:max_period]

    # Find the peak in the subset
    peak_index = np.argmax(corr_subset) + min_period

    # Ensure the peak is significant
    if corr[peak_index] < 0.1 * corr[0]:
        return -1  # No significant peak found

    return peak_index


def create_note_ranges(frequencies):
    """Creates frequency ranges for each note."""
    note_ranges = {}
    notes = list(frequencies.keys())
    # Ensure notes are sorted by frequency
    notes.sort(key=lambda n: frequencies[n])
    for i in range(len(notes) - 1):
        current_note = notes[i]
        next_note = notes[i + 1]
        # Calculate the geometric mean between two consecutive notes
        midpoint = np.sqrt(frequencies[current_note] * frequencies[next_note])
        note_ranges[current_note] = (frequencies[current_note], midpoint)
    # Handle the last note separately
    last_note = notes[-1]
    note_ranges[last_note] = (frequencies[last_note],
                              frequencies[last_note] * 2)
    return note_ranges


def find_nearest_note_in_range(freq):
    """Finds the nearest note and its frequency range."""
    for note, (low, high) in note_ranges.items():
        if low <= freq < high:
            return note, low, high
    return None, None, None


def cents_difference(freq, ref_freq):
    """Calculates the difference in cents between two frequencies."""
    return 1200 * np.log2(freq / ref_freq)


def create_tuning_bar(cents):
    """Creates a bar indicator showing the deviation in cents."""
    bar_length = 31  # Total length of the bar (must be odd number)
    max_cents = 50   # Maximum cents deviation to display on either side
    center_index = bar_length // 2

    # Clamp the cents value to the range [-max_cents, max_cents]
    cents = max(-max_cents, min(max_cents, cents))

    # Calculate the position of the marker
    # Map cents [-max_cents, max_cents] to index [0, bar_length - 1]
    position = int((cents + max_cents) * (bar_length - 1) / (2 * max_cents))
    bar = ['-'] * bar_length
    bar[center_index] = '|'

    if position >= 0 and position < bar_length:
        bar[position] = '*'

    # Build the bar string
    bar_string = '[' + ''.join(bar) + ']'
    return bar_string


# Create ranges for each note
note_ranges = create_note_ranges(note_frequencies)

# Variables to track the previous result and counts
previous_note = None
same_note_count = 0
SAME_NOTE_THRESHOLD = 2  # Decreased for faster updates

# Initialize pitch history for smoothing
pitch_history = []
HISTORY_SIZE = 3  # Number of samples to average

print("Tuning... Play a note.")

try:
    while True:
        # Read data from microphone
        data = stream.read(CHUNK, exception_on_overflow=False)

        # Detect pitch
        pitch = detect_pitch(data)

        # Skip if frequency is zero or unrealistic
        if pitch <= 0 or pitch > 5000:
            continue

        # Add pitch to history for smoothing
        pitch_history.append(pitch)
        if len(pitch_history) > HISTORY_SIZE:
            pitch_history.pop(0)
        smoothed_pitch = sum(pitch_history) / len(pitch_history)

        # Find the nearest musical note within its range
        nearest_note, low, high = find_nearest_note_in_range(smoothed_pitch)

        if nearest_note:
            # Calculate cents difference
            ref_freq = note_frequencies[nearest_note]
            cents_diff = cents_difference(smoothed_pitch, ref_freq)

            # If the note is the same as the previous one, increase the count
            if nearest_note == previous_note:
                same_note_count += 1
            else:
                # Reset count if it's a different note
                same_note_count = 1
                previous_note = nearest_note

            # Print only if the same note is detected consecutively
            if same_note_count >= SAME_NOTE_THRESHOLD:
                tuning_bar = create_tuning_bar(cents_diff)
                print(f"\nDetected note: {nearest_note}")
                print(f"Frequency: {smoothed_pitch:.2f} Hz")
                print(f"Deviation: {cents_diff:+.2f} cents")
                print(f"Tuning: {tuning_bar}")
                same_note_count = 0  # Reset after printing

except KeyboardInterrupt:
    print("\nExiting tuner...")

finally:
    stream.stop_stream()
    stream.close()
    p.terminate()
