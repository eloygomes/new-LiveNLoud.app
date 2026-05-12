import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
  parseDateValue,
} from "./dateFormat";

describe("dateFormat", () => {
  it("returns null when parseDateValue receives an empty value", () => {
    expect(parseDateValue("")).toBeNull();
    expect(parseDateValue(null)).toBeNull();
    expect(parseDateValue(undefined)).toBeNull();
  });

  it("converts a yyyy-mm-dd string into a valid Date", () => {
    const parsedDate = parseDateValue("2026-05-12");

    expect(parsedDate).toBeInstanceOf(Date);
    expect(parsedDate?.getFullYear()).toBe(2026);
    expect(parsedDate?.getMonth()).toBe(4);
    expect(parsedDate?.getDate()).toBe(12);
  });

  it("formats only the date when a valid value is provided", () => {
    expect(formatDisplayDate("2026-05-12")).toBe("12 / 05 / 2026");
  });

  it("formats only the time when a full date-time is provided", () => {
    expect(formatDisplayTime("2026-05-12T08:45:00")).toBe("08:45");
  });

  it("combines date and time in a single string", () => {
    expect(formatDisplayDateTime("2026-05-12T08:45:00")).toBe(
      "12 / 05 / 2026 08:45",
    );
  });

  it("returns the original text when the date cannot be parsed", () => {
    expect(formatDisplayDate("not-a-date")).toBe("not-a-date");
  });
});
