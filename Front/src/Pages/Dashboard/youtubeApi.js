// src/Pages/Dashboard/youtubeApi.js
import { getYouTubeAccessToken } from "./youtubeAuth";

async function ytFetch(url, options = {}) {
  const token = getYouTubeAccessToken();
  if (!token) throw new Error("Sem token do YouTube. Faça login novamente.");

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.error?.message || data?.error_description || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function youtubeCreatePlaylist({
  title,
  description = "",
  privacyStatus = "public",
}) {
  const url =
    "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status";
  return ytFetch(url, {
    method: "POST",
    body: JSON.stringify({
      snippet: { title, description },
      status: { privacyStatus },
    }),
  });
}

export async function youtubeSearchVideoId(query) {
  const url =
    "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=" +
    encodeURIComponent(query);

  const data = await ytFetch(url, { method: "GET" });
  const first = data?.items?.[0];
  const videoId = first?.id?.videoId;
  return videoId || null;
}

export async function youtubeAddVideoToPlaylist({ playlistId, videoId }) {
  const url =
    "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet";
  return ytFetch(url, {
    method: "POST",
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    }),
  });
}
