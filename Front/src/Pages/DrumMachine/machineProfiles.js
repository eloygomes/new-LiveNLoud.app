export const MACHINE_PROFILES = [
  { id: "tr808", name: "Analog Eight", inspiredBy: "TR-808", engine: "synthesis", accent: "#e8a318" },
  { id: "lm1", name: "First Digital", inspiredBy: "LM-1", engine: "sample-ready", accent: "#b52e35" },
  { id: "tr909", name: "Nine Circuit", inspiredBy: "TR-909", engine: "hybrid", accent: "#ef5b25" },
  { id: "linndrum", name: "Velvet Digital", inspiredBy: "LinnDrum", engine: "sample-ready", accent: "#9d313b" },
  { id: "dmx", name: "Midnight DM", inspiredBy: "DMX", engine: "sample-ready", accent: "#e6d34a" },
  { id: "cr78", name: "Compu Rhythm", inspiredBy: "CR-78", engine: "synthesis", accent: "#dc6b36" },
  { id: "sp1200", name: "Twelve Hundred", inspiredBy: "SP-12/1200", engine: "sample-ready", accent: "#4c9a72" },
  { id: "tr727", name: "Latin Seven", inspiredBy: "TR-727", engine: "sample-ready", accent: "#e2c33b" },
  { id: "sr16", name: "Studio Sixteen", inspiredBy: "SR-16", engine: "sample-ready", accent: "#48a6c7" },
  { id: "dr55", name: "Doctor Rhythm", inspiredBy: "DR-55", engine: "synthesis", accent: "#df3b32" },
  { id: "custom", name: "Custom Kit", inspiredBy: "Your samples", engine: "samples", accent: "#18a999" },
];

export const MACHINE_SOUND_PROFILES = {
  tr808: { filter: 15500, drive: 0.08, kickNote: "C1", kickDecay: 0.62, kickOctaves: 8, snareDecay: 0.19, hatDecay: 0.055, openDecay: 0.48, cymbalDecay: 0.95, pitch: 0 },
  lm1: { filter: 9200, drive: 0.16, kickNote: "D1", kickDecay: 0.22, kickOctaves: 3.5, snareDecay: 0.12, hatDecay: 0.038, openDecay: 0.25, cymbalDecay: 0.58, pitch: -1 },
  tr909: { filter: 17500, drive: 0.2, kickNote: "D1", kickDecay: 0.4, kickOctaves: 5, snareDecay: 0.14, hatDecay: 0.035, openDecay: 0.31, cymbalDecay: 0.78, pitch: 1 },
  linndrum: { filter: 11500, drive: 0.12, kickNote: "D1", kickDecay: 0.28, kickOctaves: 3, snareDecay: 0.16, hatDecay: 0.045, openDecay: 0.3, cymbalDecay: 0.68, pitch: 0 },
  dmx: { filter: 8200, drive: 0.23, kickNote: "C#1", kickDecay: 0.26, kickOctaves: 2.8, snareDecay: 0.2, hatDecay: 0.05, openDecay: 0.27, cymbalDecay: 0.55, pitch: -2 },
  cr78: { filter: 7200, drive: 0.05, kickNote: "E1", kickDecay: 0.18, kickOctaves: 2.2, snareDecay: 0.1, hatDecay: 0.025, openDecay: 0.18, cymbalDecay: 0.42, pitch: 2 },
  sp1200: { filter: 6400, drive: 0.3, kickNote: "C1", kickDecay: 0.3, kickOctaves: 3, snareDecay: 0.15, hatDecay: 0.045, openDecay: 0.24, cymbalDecay: 0.5, pitch: -3 },
  tr727: { filter: 12800, drive: 0.09, kickNote: "F1", kickDecay: 0.19, kickOctaves: 2, snareDecay: 0.11, hatDecay: 0.035, openDecay: 0.2, cymbalDecay: 0.48, pitch: 3 },
  sr16: { filter: 18000, drive: 0.04, kickNote: "D1", kickDecay: 0.32, kickOctaves: 2.6, snareDecay: 0.22, hatDecay: 0.04, openDecay: 0.35, cymbalDecay: 1.05, pitch: 0 },
  dr55: { filter: 5600, drive: 0.14, kickNote: "F1", kickDecay: 0.14, kickOctaves: 2, snareDecay: 0.08, hatDecay: 0.022, openDecay: 0.12, cymbalDecay: 0.3, pitch: 4 },
  custom: { filter: 19000, drive: 0, kickNote: "C1", kickDecay: 0.4, kickOctaves: 4, snareDecay: 0.16, hatDecay: 0.04, openDecay: 0.3, cymbalDecay: 0.7, pitch: 0 },
};
