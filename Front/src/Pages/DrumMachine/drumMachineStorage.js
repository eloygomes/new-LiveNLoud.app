import { openDB } from "idb";

const DB_NAME = "sustenido-drum-machine";
const STORE = "projects";
const SAMPLE_STORE = "samples";
export const LAST_PROJECT_ID = "last-project";

const db = () => openDB(DB_NAME, 2, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: "id" });
    if (!database.objectStoreNames.contains(SAMPLE_STORE)) database.createObjectStore(SAMPLE_STORE, { keyPath: "voice" });
  },
});

export async function saveProject(project) {
  const database = await db();
  await database.put(STORE, { ...project, id: LAST_PROJECT_ID, updatedAt: new Date().toISOString() });
}

export async function loadProject() {
  const database = await db();
  return database.get(STORE, LAST_PROJECT_ID);
}

export async function saveVoiceSample(voice, file) {
  const database = await db();
  await database.put(SAMPLE_STORE, { voice, blob: file, name: file.name, type: file.type, updatedAt: new Date().toISOString() });
}

export async function loadVoiceSamples() {
  const database = await db();
  return database.getAll(SAMPLE_STORE);
}

export function downloadJson(value, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
