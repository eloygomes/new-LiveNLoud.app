export function formatDisplayDate(value) {
  if (!value) return "";

  const raw = value?.$date || value;
  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return String(raw);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day} / ${month} / ${year}`;
}

export function formatDisplayTime(value) {
  if (!value) return "";

  const raw = value?.$date || value;
  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function formatDisplayDateTime(value) {
  const date = formatDisplayDate(value);
  const time = formatDisplayTime(value);

  if (!date) return "";
  return time ? `${date} ${time}` : date;
}
