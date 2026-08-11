import { ObjectId } from "mongodb";
import { getGeneralCifrasDb, getTargetDb } from "../db.js";
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function serializeGeneralSong(song = {}) {
  const instruments = Object.entries(song.instruments || {})
    .filter(([, enabled]) => enabled === true || enabled === "true")
    .map(([instrument]) => instrument);

  return {
    id: song._id?.toString?.() || "",
    artist: song.artist || "",
    song: song.song || "",
    instruments,
    createdAt: song.createdAt || song.addedIn || null,
    updatedAt: song.updatedAt || song.updateIn || null,
  };
}

export async function listGeneralSongs({ query = "", limit = 500 } = {}) {
  const cleanQuery = String(query).trim().slice(0, 120);
  const filter = cleanQuery
    ? {
        $or: [
          { artist: { $regex: escapeRegExp(cleanQuery), $options: "i" } },
          { song: { $regex: escapeRegExp(cleanQuery), $options: "i" } },
        ],
      }
    : {};
  const safeLimit = Math.min(Math.max(Number(limit) || 500, 1), 1000);
  const collection = getGeneralCifrasDb().collection("Documents");
  const [items, total] = await Promise.all([
    collection.find(filter).sort({ artist: 1, song: 1 }).limit(safeLimit).toArray(),
    collection.countDocuments(filter),
  ]);

  return { items: items.map(serializeGeneralSong), total, limit: safeLimit };
}

export async function deleteGeneralSong(songId) {
  if (!ObjectId.isValid(songId)) return { deletedCount: 0, song: null };
  const collection = getGeneralCifrasDb().collection("Documents");
  const song = await collection.findOne({ _id: new ObjectId(songId) });
  if (!song) return { deletedCount: 0, song: null };
  const candidates = await collection
    .find({}, { projection: { _id: 1, artist: 1, song: 1 } })
    .toArray();
  const duplicateIds = candidates
    .filter(
      (candidate) =>
        normalizeName(candidate.artist) === normalizeName(song.artist) &&
        normalizeName(candidate.song) === normalizeName(song.song),
    )
    .map((candidate) => candidate._id);
  const result = await collection.deleteMany({ _id: { $in: duplicateIds } });
  return { deletedCount: result.deletedCount, song: serializeGeneralSong(song) };
}
