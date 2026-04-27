// Web Worker — processamento de pitch via autocorrelação

function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;

  let sum = 0;
  let rms = 0;

  // Calcula RMS e média
  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    sum += val;
    rms += val * val;
  }

  rms = Math.sqrt(rms / SIZE);

  // Ignora silêncio
  if (rms < 0.01) return -1;

  // Remove DC offset (centraliza o sinal)
  const avg = sum / SIZE;
  for (let i = 0; i < SIZE; i++) {
    buffer[i] -= avg;
  }

  // Array de correlação
  const correlations = new Float32Array(SIZE);

  let bestOffset = -1;
  let bestCorrelation = 0;

  const threshold = 0.2;

  // Calcula autocorrelação
  for (let offset = 0; offset < SIZE; offset++) {
    let correlation = 0;

    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }

    correlations[offset] = correlation;
  }

  // Encontra o melhor pico
  for (let offset = 1; offset < SIZE - 1; offset++) {
    if (
      correlations[offset] > threshold &&
      correlations[offset] > correlations[offset - 1] &&
      correlations[offset] > correlations[offset + 1]
    ) {
      if (correlations[offset] > bestCorrelation) {
        bestCorrelation = correlations[offset];
        bestOffset = offset;
      }
    }
  }

  if (bestOffset === -1 || bestCorrelation < 0.01) {
    return -1;
  }

  // Interpolação parabólica para maior precisão
  const a = correlations[bestOffset - 1];
  const b = correlations[bestOffset];
  const c = correlations[bestOffset + 1];

  const shift = (c - a) / (2 * (2 * b - a - c));

  // Frequência final
  return sampleRate / (bestOffset + shift);
}

/* ------------------------------------------------------------------
   WORKER STATE
------------------------------------------------------------------ */

let sampleRate = 44100;
let bufferSize = 2048;
let buffer = null;
let isProcessing = false;

/* ------------------------------------------------------------------
   MESSAGES
------------------------------------------------------------------ */

self.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === "INIT") {
    sampleRate = data.sampleRate;
    bufferSize = data.bufferSize;
    buffer = new Float32Array(bufferSize);

    self.postMessage({ type: "INIT_COMPLETE" });
    return;
  }

  if (type === "PROCESS") {
    if (isProcessing || !buffer) return;

    isProcessing = true;

    if (data.length === bufferSize) {
      buffer.set(data);

      const frequency = autoCorrelate(buffer, sampleRate);

      if (frequency !== -1) {
        self.postMessage({
          type: "FREQUENCY_DETECTED",
          data: frequency,
        });
      }
    }

    isProcessing = false;
  }
};
