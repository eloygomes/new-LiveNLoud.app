export function getYouTubeVideoId(url) {
  try {
    const normalizedValue = String(url || "").trim();
    if (!normalizedValue) return null;

    if (
      /^[a-zA-Z0-9_-]{11}$/.test(normalizedValue) &&
      !normalizedValue.includes("http")
    ) {
      return normalizedValue;
    }

    const videoUrl = new URL(
      normalizedValue.startsWith("http")
        ? normalizedValue
        : `https://${normalizedValue}`,
    );
    const host = videoUrl.hostname.replace(/^www\./, "");

    if (host === "youtu.be" && videoUrl.pathname.length > 1) {
      return videoUrl.pathname.slice(1);
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (videoUrl.pathname === "/watch") return videoUrl.searchParams.get("v");
      if (videoUrl.pathname.startsWith("/shorts/")) {
        return videoUrl.pathname.split("/")[2] || null;
      }
      if (videoUrl.pathname.startsWith("/embed/")) {
        return videoUrl.pathname.split("/")[2] || null;
      }
    }

    return videoUrl.searchParams.get("v");
  } catch {
    return (
      String(url || "")
        .trim()
        .match(/(?:v=|embed\/|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] ||
      null
    );
  }
}

export function formatSyncTime(value = 0) {
  const totalSeconds = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 100);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )}.${String(centiseconds).padStart(2, "0")}`;
}
