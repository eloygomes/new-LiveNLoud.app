const IMPORT_PAYLOAD_MARKERS = [
  /\d+:\s*\[\s*"\$"\s*,\s*"\$L\d+"/,
  /\{"translations":\{\},"language":"[^"]+","locale":"[^"]+"/,
];

export function stripImportedCifraPayload(value = "") {
  const cifra = typeof value === "string" ? value : "";
  const payloadIndex = IMPORT_PAYLOAD_MARKERS.reduce((earliest, marker) => {
    const match = marker.exec(cifra);
    if (!match) return earliest;
    return earliest === -1 ? match.index : Math.min(earliest, match.index);
  }, -1);

  return payloadIndex === -1 ? cifra : cifra.slice(0, payloadIndex).trimEnd();
}
