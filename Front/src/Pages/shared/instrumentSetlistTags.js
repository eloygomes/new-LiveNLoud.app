export const INSTRUMENT_SETLIST_TAGS = {
  guitar01: "guitar",
  guitar02: "guitar",
  bass: "bass",
  keys: "keys",
  drums: "drums",
  voice: "voice",
};

const MANAGED_TAGS = new Set(Object.values(INSTRUMENT_SETLIST_TAGS));

export function syncInstrumentSetlistTags(currentSetlist = [], statuses = {}) {
  const activeTags = new Set(
    Object.entries(INSTRUMENT_SETLIST_TAGS)
      .filter(([instrument]) => Boolean(statuses?.[instrument]))
      .map(([, tag]) => tag),
  );
  const customTags = (Array.isArray(currentSetlist) ? currentSetlist : []).filter(
    (tag) => !MANAGED_TAGS.has(String(tag || "").trim().toLowerCase()),
  );

  return [...new Set([...customTags, ...activeTags])];
}
