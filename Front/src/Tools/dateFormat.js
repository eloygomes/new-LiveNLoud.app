export function parseDateValue(value) {
  if (!value) return null;

  const raw = value?.$date || value;

  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }

  if (typeof raw === "string") {
    const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDisplayDate(value) {
  if (!value) return "";

  const raw = value?.$date || value;
  const date = parseDateValue(raw);

  if (!date) {
    return String(raw);
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day} / ${month} / ${year}`;
}

export function formatDisplayTime(value) {
  if (!value) return "";

  const date = parseDateValue(value);

  if (!date) {
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
