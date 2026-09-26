export const SYNC_BLOCK_ID_ATTRIBUTE = "data-sync-block-id";
export const SYNC_BLOCK_ID_REGEX =
  /data-sync-block-id=(["'])(syncblk_[a-z0-9_-]+)\1/i;

const SYNC_BLOCK_PREFIX = "syncblk";

function hashSyncSeed(value = "") {
  const text = String(value || "");
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function createSyncBlockId(seed = "") {
  const safeSeed = String(seed || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const stablePart = hashSyncSeed(seed || safeSeed || "block");

  return [SYNC_BLOCK_PREFIX, safeSeed, stablePart]
    .filter(Boolean)
    .join("_")
    .replace(/-+/g, "-");
}

export function getSyncBlockIdFromHtml(html = "") {
  return String(html || "").match(SYNC_BLOCK_ID_REGEX)?.[2] || null;
}

export function ensureSyncBlockIdOnHtml(html = "", { seed = "" } = {}) {
  const rawHtml = String(html || "");
  const existingId = getSyncBlockIdFromHtml(rawHtml);

  if (existingId) {
    return { html: rawHtml, syncBlockId: existingId, created: false };
  }

  const syncBlockId = createSyncBlockId(seed);
  const nextHtml = rawHtml.replace(
    /^<([a-z0-9-]+)(\s|>)/i,
    `<$1 ${SYNC_BLOCK_ID_ATTRIBUTE}="${syncBlockId}"$2`,
  );

  return {
    html: nextHtml === rawHtml ? rawHtml : nextHtml,
    syncBlockId,
    created: nextHtml !== rawHtml,
  };
}

export function normalizeSyncPoint(value) {
  if (!value || typeof value !== "object") return null;

  const syncBlockId = String(value.syncBlockId || "").trim();
  const time = Number(value.time);

  if (!syncBlockId || !Number.isFinite(time) || time < 0) return null;

  return {
    syncBlockId,
    time: Math.round(time * 100) / 100,
    ...(value.needsReview ? { needsReview: true } : {}),
  };
}

export function normalizePlaybackSync(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const provider = value.provider === "youtube" ? "youtube" : null;
  const videoId = String(value.videoId || "").trim();
  const syncPoints = Array.isArray(value.syncPoints)
    ? value.syncPoints.map(normalizeSyncPoint).filter(Boolean)
    : [];

  if (!provider && !videoId && !syncPoints.length) return null;

  const seen = new Set();
  return {
    provider: provider || "youtube",
    videoId,
    syncPoints: syncPoints
      .sort((a, b) => a.time - b.time)
      .filter((point) => {
        if (seen.has(point.syncBlockId)) return false;
        seen.add(point.syncBlockId);
        return true;
      }),
  };
}

export function getSyncBlocksFromHtmlBlocks(htmlBlocks = []) {
  return (htmlBlocks || [])
    .map((block, index) => {
      const html = typeof block === "string" ? block : block?.html || "";
      const syncBlockId =
        typeof block === "object" && block?.syncBlockId
          ? block.syncBlockId
          : getSyncBlockIdFromHtml(html);

      if (!syncBlockId) return null;

      const label =
        html
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 80) || `Bloco ${index + 1}`;

      return { index, syncBlockId, html, label };
    })
    .filter(Boolean);
}

export function pruneSyncPointsForBlocks(playbackSync, syncBlocks = []) {
  const validBlockIds = new Set(syncBlocks.map((block) => block.syncBlockId));
  const normalized = normalizePlaybackSync(playbackSync);
  if (!normalized) return null;

  return {
    ...normalized,
    syncPoints: normalized.syncPoints.filter((point) =>
      validBlockIds.has(point.syncBlockId),
    ),
  };
}

export function reconcilePlaybackSyncToBlocks(playbackSync, syncBlocks = []) {
  const normalized = normalizePlaybackSync(playbackSync);
  const currentBlocks = (syncBlocks || []).filter((block) => block.syncBlockId);
  if (!normalized || !currentBlocks.length || !normalized.syncPoints.length) {
    return normalized;
  }

  const validBlockIds = new Set(currentBlocks.map((block) => block.syncBlockId));
  const matchingPoints = normalized.syncPoints.filter((point) =>
    validBlockIds.has(point.syncBlockId),
  );

  if (matchingPoints.length) {
    return {
      ...normalized,
      syncPoints: matchingPoints,
    };
  }

  return {
    ...normalized,
    syncPoints: normalized.syncPoints
      .slice()
      .sort((left, right) => left.time - right.time)
      .slice(0, currentBlocks.length)
      .map((point, index) => ({
        ...point,
        syncBlockId: currentBlocks[index].syncBlockId,
        needsReview: true,
      })),
  };
}
