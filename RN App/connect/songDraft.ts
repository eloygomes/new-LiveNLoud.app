import AsyncStorage from "@react-native-async-storage/async-storage";

export type InstrumentKey =
  | "guitar01"
  | "guitar02"
  | "bass"
  | "keys"
  | "drums"
  | "voice";

export type SongDraft = {
  artist: string;
  song: string;
  capo: string;
  tom: string;
  tuning: string;
  instrumentLinks: Record<InstrumentKey, string>;
  videos: string[];
  setlists: string[];
  setlistOptions: string[];
};

const SONG_DRAFT_KEY = "songDraft";

export async function saveSongDraft(draft: SongDraft) {
  await AsyncStorage.setItem(SONG_DRAFT_KEY, JSON.stringify(draft));
}

export async function loadSongDraft(): Promise<SongDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(SONG_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearSongDraft() {
  await AsyncStorage.removeItem(SONG_DRAFT_KEY);
}
