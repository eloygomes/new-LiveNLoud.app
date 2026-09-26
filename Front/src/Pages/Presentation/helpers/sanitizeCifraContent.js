const EMBEDDED_PAGE_PAYLOAD_PATTERNS = [
  /self\.__next_f\.push\s*\(/i,
  /(?:\(\s*[A-G]\s*\))?\s*\d+\s*:\s*\[\s*\\?"\$\\?"\s*,\s*\\?"\$L\d+/i,
  /\[\s*\\?"\$\\?"\s*,\s*\\?"\$L\d+/i,
  /<script\b/i,
  /application\/ld\+json/i,
  /\\?"dangerouslySetInnerHTML\\?"\s*:/i,
  /\{?\s*\\?"@context\\?"\s*:\s*\\?"https?:\/\/schema\.org/i,
  /\\?"translations\\?"\s*:\s*\{\s*\}\s*,\s*\\?"language\\?"\s*:/i,
];

function findEmbeddedPayloadStart(value = "") {
  return EMBEDDED_PAGE_PAYLOAD_PATTERNS.reduce((earliest, pattern) => {
    const match = pattern.exec(value);
    if (!match) return earliest;
    return earliest === -1 ? match.index : Math.min(earliest, match.index);
  }, -1);
}

export function sanitizeCifraContent(value = "") {
  const content = String(value || "").replace(/\r\n?/g, "\n");
  const payloadStart = findEmbeddedPayloadStart(content);
  if (payloadStart < 0) return content;

  const lineStart = content.lastIndexOf("\n", payloadStart - 1) + 1;
  const prefix = content.slice(lineStart, payloadStart).trim();
  const cutAt = !prefix || /^(?:\(\s*[A-G]\s*\))?\s*\d*\s*:?\s*[\[{"'\\$]*$/.test(prefix)
    ? lineStart
    : payloadStart;

  return content.slice(0, cutAt).trimEnd();
}

export function hasEmbeddedPagePayload(value = "") {
  return findEmbeddedPayloadStart(String(value || "")) >= 0;
}
