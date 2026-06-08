import { getTargetDb } from "../db.js";
import {
  createDefaultUserProfileSeed,
  getDefaultUserSetlists,
  isSongEntry,
  normalizeEmail,
  normalizeName,
} from "./format.js";

export function serializeSong(song = {}) {
  const key = `${song.artist || ""}::${song.song || ""}`;
  return {
    key,
    id: song.id || null,
    artist: song.artist || "",
    song: song.song || "",
    progressBar: song.progressBar || 0,
    addedIn: song.addedIn || null,
    updateIn: song.updateIn || null,
    instruments: song.instruments || {},
    setlist: Array.isArray(song.setlist) ? song.setlist : [],
  };
}

export async function listUserSongs(email) {
  const doc = await getTargetDb().collection("data").findOne({ email: normalizeEmail(email) });
  const songs = Array.isArray(doc?.userdata) ? doc.userdata.filter(isSongEntry) : [];
  return songs.map(serializeSong);
}

export async function deleteUserSong(email, artist, song) {
  const normalizedEmail = normalizeEmail(email);
  const doc = await getTargetDb().collection("data").findOne({ email: normalizedEmail });
  if (!doc || !Array.isArray(doc.userdata)) return { deletedCount: 0 };

  const beforeCount = doc.userdata.length;
  const nextUserdata = doc.userdata.filter(
    (entry) =>
      !(
        normalizeName(entry?.artist) === normalizeName(artist) &&
        normalizeName(entry?.song) === normalizeName(song)
      ),
  );

  const deletedCount = beforeCount - nextUserdata.length;
  if (!deletedCount) return { deletedCount: 0 };

  await getTargetDb()
    .collection("data")
    .updateOne({ email: normalizedEmail }, { $set: { userdata: nextUserdata } });

  return { deletedCount };
}

export async function deleteAllUserSongs(email) {
  const normalizedEmail = normalizeEmail(email);
  const collection = getTargetDb().collection("data");
  const doc = await collection.findOne({ email: normalizedEmail });
  if (!doc || !Array.isArray(doc.userdata)) return { deletedCount: 0 };

  const deletedCount = doc.userdata.filter(isSongEntry).length;
  const profileEntry =
    doc.userdata.find((entry) => !String(entry?.song || "").trim() && !String(entry?.artist || "").trim()) ||
    doc.userdata[0] ||
    {};
  const preservedEntry = createDefaultUserProfileSeed({
    email: normalizedEmail,
    username: profileEntry?.username,
    fullName: profileEntry?.fullName,
    existing: profileEntry,
  });

  await collection.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        userdata: [preservedEntry],
        availableSetlists: getDefaultUserSetlists(),
      },
    },
  );

  return { deletedCount };
}
