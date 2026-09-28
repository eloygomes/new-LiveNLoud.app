const test = require("node:test");
const assert = require("node:assert/strict");

const {
  extractYouTubeCandidatesFromHtml,
  normalizeVideoList,
  normalizeYouTubeUrl,
  pickBestSearchResult,
} = require("./youtubeVideoResolver");

test("normalizes supported YouTube URL formats to watch URLs", () => {
  assert.equal(
    normalizeYouTubeUrl("https://youtu.be/dQw4w9WgXcQ"),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  assert.equal(
    normalizeYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  assert.equal(
    normalizeYouTubeUrl("https://music.youtube.com/watch?v=dQw4w9WgXcQ"),
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
});

test("rejects shorts and invalid video ids", () => {
  assert.equal(normalizeYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"), null);
  assert.equal(normalizeYouTubeUrl("https://www.youtube.com/watch?v=bad"), null);
});

test("deduplicates videos after normalization", () => {
  assert.deepEqual(
    normalizeVideoList([
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ]),
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  );
});

test("extracts normal and escaped YouTube URLs from source HTML", () => {
  assert.deepEqual(
    extractYouTubeCandidatesFromHtml(`
      <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>
      {"url":"https:\\/\\/www.youtube.com\\/watch?v=aaaaaaaaaaa"}
    `),
    [
      "https://www.youtube.com/watch?v=aaaaaaaaaaa",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ],
  );
});

test("prefers official search results over covers and tutorials", () => {
  const picked = pickBestSearchResult(
    [
      {
        videoId: "aaaaaaaaaaa",
        title: "Artist Song guitar lesson tutorial",
        channelTitle: "Random Lessons",
      },
      {
        videoId: "bbbbbbbbbbb",
        title: "Artist - Song Official Audio",
        channelTitle: "Artist Topic",
      },
    ],
    { artist: "Artist", song: "Song" },
  );

  assert.equal(picked, "https://www.youtube.com/watch?v=bbbbbbbbbbb");
});
