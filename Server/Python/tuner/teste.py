import numpy as np


def generate_sine_wave(freq, duration, sample_rate):
    t = np.linspace(0, duration, int(sample_rate * duration), endpoint=False)
    audio_data = np.sin(2 * np.pi * freq * t)
    return audio_data.tolist()


# Generate a 0.1-second sine wave at 440 Hz
audio_data = generate_sine_wave(440, 0.1, 44100)

# Now, audio_data contains 4410 samples

print(audio_data)
