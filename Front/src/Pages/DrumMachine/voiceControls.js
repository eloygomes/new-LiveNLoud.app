export const VOICE_CONTROLS = {
  kick: ["Tune", "Volume", "Attack", "Decay", "Env Time", "Drive"],
  snare: ["Tune", "Level", "Tone", "Snappy", "Ring"],
  lowTom: ["Tune", "Level", "Decay", "Tone"],
  highTom: ["Tune", "Level", "Decay", "Tone"],
  clap: ["RS Level", "HC Level", "Spread", "Decay", "Tail"],
  closedHat: ["Tune", "Level", "Closed", "Open"],
  openHat: ["Tune", "Level", "Closed", "Open"],
  cowbell: ["Tune", "Level", "Decay", "Tone"],
  cymbal: ["Level", "Tone", "Tune", "Color", "Decay", "Tail"],
};

export const createDefaultVoiceParameters = () => Object.fromEntries(
  Object.entries(VOICE_CONTROLS).map(([voice, controls]) => [voice,
    Object.fromEntries(controls.map((label) => [label, label.includes("Level") || label === "Volume" ? 78 : label === "Tune" ? 50 : label === "Spread" ? 45 : label === "Tail" ? 55 : 50])),
  ]),
);
