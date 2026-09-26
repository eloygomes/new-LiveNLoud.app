export function getSortedSyncPoints(syncPoints = []) {
  return (Array.isArray(syncPoints) ? syncPoints : [])
    .filter(
      (point) =>
        point?.syncBlockId &&
        Number.isFinite(Number(point.time)) &&
        Number(point.time) >= 0,
    )
    .map((point) => ({
      syncBlockId: String(point.syncBlockId),
      time: Number(point.time),
    }))
    .sort((left, right) => left.time - right.time);
}

export function getActiveSyncPoint({
  currentTime = 0,
  offset = 0,
  syncPoints = [],
} = {}) {
  const effectiveTime = Math.max(0, Number(currentTime || 0) + Number(offset || 0));
  const sortedPoints = getSortedSyncPoints(syncPoints);

  if (!sortedPoints.length) return null;
  if (effectiveTime < sortedPoints[0].time) return null;

  let activePoint = sortedPoints[0];
  for (const point of sortedPoints) {
    if (point.time > effectiveTime) break;
    activePoint = point;
  }

  return activePoint;
}

export function getNextSyncPoint(syncPoint, syncPoints = []) {
  if (!syncPoint?.syncBlockId) return null;

  const sortedPoints = getSortedSyncPoints(syncPoints);
  const index = sortedPoints.findIndex(
    (point) => point.syncBlockId === syncPoint.syncBlockId,
  );

  return index >= 0 ? sortedPoints[index + 1] || null : null;
}

export function getPreviousSyncPoint(syncPoint, syncPoints = []) {
  if (!syncPoint?.syncBlockId) return null;

  const sortedPoints = getSortedSyncPoints(syncPoints);
  const index = sortedPoints.findIndex(
    (point) => point.syncBlockId === syncPoint.syncBlockId,
  );

  return index > 0 ? sortedPoints[index - 1] : null;
}

export function getSyncProgress({
  currentTime = 0,
  offset = 0,
  activePoint,
  nextPoint,
} = {}) {
  if (!activePoint || !nextPoint) return 0;

  const start = Number(activePoint.time);
  const end = Number(nextPoint.time);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;

  const effectiveTime = Math.max(0, Number(currentTime || 0) + Number(offset || 0));
  return Math.min(1, Math.max(0, (effectiveTime - start) / (end - start)));
}

export function getLoopBounds({
  activePoint,
  duration = 0,
  syncPoints = [],
} = {}) {
  if (!activePoint) return null;

  const nextPoint = getNextSyncPoint(activePoint, syncPoints);
  const loopStart = Math.max(0, Number(activePoint.time) || 0);
  const fallbackEnd = Number(duration) > loopStart ? Number(duration) : loopStart;
  const loopEnd = nextPoint ? Number(nextPoint.time) : fallbackEnd;

  if (!Number.isFinite(loopEnd) || loopEnd <= loopStart) return null;

  return {
    start: loopStart,
    end: loopEnd,
  };
}
