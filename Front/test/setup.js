import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

let consoleLogSpy;
let consoleErrorSpy;
let consoleWarnSpy;
let consoleInfoSpy;
let consoleDebugSpy;
let consoleGroupSpy;
let consoleGroupEndSpy;

beforeEach(() => {
  consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
  consoleGroupSpy = vi.spyOn(console, "group").mockImplementation(() => {});
  consoleGroupEndSpy = vi
    .spyOn(console, "groupEnd")
    .mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  consoleLogSpy.mockRestore();
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
  consoleInfoSpy.mockRestore();
  consoleDebugSpy.mockRestore();
  consoleGroupSpy.mockRestore();
  consoleGroupEndSpy.mockRestore();
});
