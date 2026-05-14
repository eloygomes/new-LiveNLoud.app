import { ALLOWED_GUITAR_PRO_EXTENSIONS } from "../../constants/guitarPro";

export function getGuitarProFiles(songData = {}) {
  return Array.isArray(songData?.guitarProFiles) ? songData.guitarProFiles : [];
}

export function isValidGuitarProFile(file) {
  if (!file?.name) return false;
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ALLOWED_GUITAR_PRO_EXTENSIONS.includes(extension);
}
