export const DRUM_VOICES = [
  "kick", "snare", "closedHat", "openHat", "clap",
  "lowTom", "highTom", "cowbell", "cymbal",
];

export const VOICE_LABELS = {
  kick: "Bass drum", snare: "Snare", closedHat: "Closed hat",
  openHat: "Open hat", clap: "Clap", lowTom: "Low tom",
  highTom: "High tom", cowbell: "Cowbell", cymbal: "Cymbal",
};

export const BARS = 4;
export const STEPS = 16;

export const emptyStep = () => ({ active: false, velocity: 0.82, probability: 1, microTiming: 0 });

export function createPattern(name = "New pattern") {
  return {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    name,
    version: 1,
    updatedAt: new Date().toISOString(),
    banks: Object.fromEntries(["A", "B"].map((bank) => [bank,
      Object.fromEntries(DRUM_VOICES.map((voice) => [voice,
        Array.from({ length: BARS }, () => Array.from({ length: STEPS }, emptyStep)),
      ])),
    ])),
  };
}

export function createFactoryPattern() {
  const pattern = createPattern("Golden groove");
  for (const bank of ["A", "B"]) {
    for (let bar = 0; bar < BARS; bar += 1) {
      [0, 8].forEach((step) => { pattern.banks[bank].kick[bar][step] = { ...emptyStep(), active: true, velocity: 1 }; });
      [4, 12].forEach((step) => { pattern.banks[bank].snare[bar][step] = { ...emptyStep(), active: true, velocity: 0.9 }; });
      [0, 2, 4, 6, 8, 10, 12, 14].forEach((step) => { pattern.banks[bank].closedHat[bar][step] = { ...emptyStep(), active: true, velocity: step % 4 ? 0.62 : 0.82 }; });
    }
  }
  return pattern;
}

export function createEmptyPattern() {
  return createPattern("Empty pattern");
}

export function cycleStep(step) {
  if (!step.active) return { ...step, active: true, velocity: 0.82 };
  if (step.velocity < 1) return { ...step, velocity: 1 };
  return { ...step, active: false, velocity: 0.82 };
}

export function randomizeBar(pattern, bank, bar, amount = 0.24) {
  const next = structuredClone(pattern);
  DRUM_VOICES.forEach((voice) => {
    next.banks[bank][voice][bar] = next.banks[bank][voice][bar].map((step, index) => ({
      ...step,
      active: Math.random() < (voice === "kick" || voice === "snare" ? amount * 0.7 : amount),
      velocity: index % 4 === 0 ? 1 : 0.68 + Math.random() * 0.2,
    }));
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

export const GROOVE_PRESETS = [
  {
    name: "Four on the floor",
    hits: { kick: [0, 4, 8, 12], snare: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 12, 14], openHat: [6, 14], clap: [4, 12] },
  },
  {
    name: "Boom bap",
    hits: { kick: [0, 3, 7, 10], snare: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 12, 14], openHat: [15] },
  },
  {
    name: "Funk break",
    hits: { kick: [0, 2, 7, 10, 13], snare: [4, 11], closedHat: [0, 2, 4, 6, 8, 10, 12, 14], openHat: [7, 15], clap: [12], lowTom: [14], highTom: [15] },
  },
  {
    name: "Electro pulse",
    hits: { kick: [0, 6, 8, 11], snare: [4, 12], clap: [4, 12], closedHat: [0, 2, 4, 6, 8, 10, 12, 14], cowbell: [2, 7, 10, 15] },
  },
];

export function applyGroovePreset(pattern, bank, preset) {
  const next = structuredClone(pattern);
  DRUM_VOICES.forEach((voice) => {
    for (let bar = 0; bar < BARS; bar += 1) {
      next.banks[bank][voice][bar] = Array.from({ length: STEPS }, (_, step) => ({
        ...emptyStep(),
        active: Boolean(preset.hits[voice]?.includes(step)),
        velocity: step % 4 === 0 ? 1 : 0.82,
      }));
    }
  });
  next.name = preset.name;
  next.updatedAt = new Date().toISOString();
  return next;
}
