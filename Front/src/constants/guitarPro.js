export const ALLOWED_GUITAR_PRO_EXTENSIONS = [
  "gp3",
  "gp4",
  "gp5",
  "gpx",
  "gp",
  "xml",
  "cap",
];

export const GUITAR_PRO_ACCEPT = ALLOWED_GUITAR_PRO_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");
