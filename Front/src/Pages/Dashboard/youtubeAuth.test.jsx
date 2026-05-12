import { pickJwtToken } from "./youtubeAuth";

describe("pickJwtToken", () => {
  it("returns the first valid token found in localStorage", () => {
    localStorage.setItem("jwt", "jwt-value");
    localStorage.setItem("token", "legacy-token");

    expect(pickJwtToken()).toBe("jwt-value");
  });

  it("falls back to sessionStorage when localStorage is empty", () => {
    sessionStorage.setItem("access_token", "session-token");

    expect(pickJwtToken()).toBe("session-token");
  });

  it("ignores empty string values", () => {
    localStorage.setItem("accessToken", "   ");

    expect(pickJwtToken()).toBeNull();
  });
});
