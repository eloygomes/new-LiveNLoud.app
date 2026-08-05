import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UserProfile from "./UserProfile";
import {
  fetchCurrentUserProfile,
  fetchInvitations,
  fetchUserLogs,
  getProfileImageObjectURL,
  requestData,
} from "../../Tools/Controllers";

vi.mock("../../Tools/Controllers", () => ({
  createInvitation: vi.fn(),
  deleteAllUserSongs: vi.fn(),
  deleteUserAccount: vi.fn(),
  downloadUserData: vi.fn(),
  fetchCurrentUserProfile: vi.fn(),
  fetchInvitations: vi.fn(),
  fetchUserLogs: vi.fn(),
  getProfileImageObjectURL: vi.fn(),
  logoutUser: vi.fn(),
  requestData: vi.fn(),
  respondToInvitation: vi.fn(),
  revokeFriendship: vi.fn(),
  updatePassword: vi.fn(),
  updateUserName: vi.fn(),
  uploadProfileImage: vi.fn(),
}));

describe("UserProfile tablet experience", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });
    window.scrollTo = vi.fn();
    localStorage.setItem("userEmail", "eloy@example.com");

    requestData.mockResolvedValue(
      JSON.stringify([
        {
          _id: "song-1",
          fullName: "Eloy Gomes",
          username: "eloy",
          email: "eloy@example.com",
          addedIn: "2026-01-10T00:00:00.000Z",
          progressBar: "60%",
          instruments: { guitar01: true },
        },
      ]),
    );
    fetchCurrentUserProfile.mockResolvedValue({
      fullName: "Eloy Gomes",
      username: "eloy",
      email: "eloy@example.com",
      acceptedInvitations: [],
    });
    fetchInvitations.mockResolvedValue([]);
    fetchUserLogs.mockResolvedValue([
      {
        _id: "log-1",
        createdAt: "2026-08-04T12:00:00.000Z",
        message: "Song updated",
      },
    ]);
    getProfileImageObjectURL.mockResolvedValue(null);
  });

  it("uses the full tablet hub and resets its content scroll between sections", async () => {
    const { container } = render(<UserProfile />);

    expect(
      await screen.findByRole("heading", { name: "Your library at a glance" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: /illustration$/ })).toHaveLength(
      6,
    );

    const contentScroller = container.querySelector(
      ".user-hub-tablet-content",
    );
    contentScroller.scrollTop = 420;

    fireEvent.click(screen.getByRole("button", { name: /Your data/i }));

    expect(
      await screen.findByRole("heading", {
        name: "Take a copy of your Sustenido data",
      }),
    ).toBeInTheDocument();
    await waitFor(() => expect(contentScroller.scrollTop).toBe(0));
  });
});
