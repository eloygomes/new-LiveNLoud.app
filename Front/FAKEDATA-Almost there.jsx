const data = {
  "user@example.com": {
    id: 1,
    Song: "Snow",
    Artist: "Red Hot Chili Peppers",
    progressBar: 85,
    Instruments: {
      guitar01: true,
      guitar02: false,
      bass: true,
      keys: false,
      drums: true,
      voice: true,
    },
    guitar01: {
      active: true,
      capo: "2nd fret",
      tuning: "Standard",
      lastPlay: "2024-08-01",
    },
    guitar02: {
      active: false,
      capo: null,
      tuning: "Drop D",
      lastPlay: null,
    },
    bass: {
      active: true,
      capo: "None",
      tuning: "Standard",
      lastPlay: "2024-07-25",
    },
    keys: {
      active: false,
    },
    drums: {
      active: true,
    },
    voice: {
      active: true,
    },
    EmbedVideos: [
      "https://www.youtube.com/watch?v=abc123",
      "https://www.youtube.com/watch?v=def456",
    ],
    AddedIn: "2024-08-16",
    UpdateIn: "2024-08-16",
    email: "user@example.com",
  },
};
