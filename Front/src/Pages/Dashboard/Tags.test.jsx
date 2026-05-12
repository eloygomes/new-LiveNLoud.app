import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Tags from "./Tags";
import {
  fetchCurrentUserProfile,
  shareSetlists,
} from "../../Tools/Controllers";

vi.mock("../../Tools/Controllers", () => ({
  fetchCurrentUserProfile: vi.fn(),
  shareSetlists: vi.fn(),
}));

function FakeDeleteIcon(props) {
  return <button type="button" {...props}>Delete icon</button>;
}

function renderTags(customProps = {}) {
  const props = {
    setlists: ["Worship", "Acoustic"],
    selectedSetlists: ["Worship"],
    importedSetlists: ["Imported A"],
    toggleTag: vi.fn(),
    handleDeleteSetlist: vi.fn(),
    handleAddSetlist: vi.fn(),
    RiDeleteBin6Line: FakeDeleteIcon,
    ...customProps,
  };

  render(<Tags {...props} />);
  return props;
}

describe("Tags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchCurrentUserProfile.mockResolvedValue({
      acceptedInvitations: [
        {
          counterpartEmail: "friend@example.com",
          counterpartFullName: "Friend Name",
          counterpartUsername: "friend",
        },
      ],
    });
  });

  it("adds a new tag when the plus button is clicked", async () => {
    const { handleAddSetlist } = renderTags();
    await waitFor(() => expect(fetchCurrentUserProfile).toHaveBeenCalled());

    fireEvent.change(screen.getByPlaceholderText("Add new tag"), {
      target: { value: "New Tag" },
    });
    fireEvent.click(screen.getByRole("button", { name: "+" }));

    await waitFor(() => {
      expect(handleAddSetlist).toHaveBeenCalledWith("New Tag");
    });
  });

  it("toggles a tag when not editing", async () => {
    const { toggleTag } = renderTags();
    await waitFor(() => expect(fetchCurrentUserProfile).toHaveBeenCalled());

    fireEvent.click(screen.getByText("Acoustic"));

    expect(toggleTag).toHaveBeenCalledWith("Acoustic");
  });

  it("deletes selected tags after entering edit mode", async () => {
    const { handleDeleteSetlist } = renderTags();
    await waitFor(() => expect(fetchCurrentUserProfile).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getAllByTitle("Remover setlist do sistema")[0]);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(handleDeleteSetlist).toHaveBeenCalledWith("Worship");
    });
  });

  it("shares the selected setlists with the typed email", async () => {
    shareSetlists.mockResolvedValue({ songs: [{ song: "Oceans" }] });

    renderTags();
    await waitFor(() => expect(fetchCurrentUserProfile).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    fireEvent.change(screen.getByPlaceholderText("friend@email.com"), {
      target: { value: "friend@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send setlist" }));

    await waitFor(() => {
      expect(shareSetlists).toHaveBeenCalledWith({
        recipientEmail: "friend@example.com",
        setlistNames: ["Worship"],
      });
    });

    expect(
      screen.getByText("Shared 1 songs with friend@example.com."),
    ).toBeInTheDocument();
  });

  it("shows friend suggestions and fills the email input when one is selected", async () => {
    renderTags();
    await waitFor(() => expect(fetchCurrentUserProfile).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    const emailInput = screen.getByPlaceholderText("friend@email.com");

    fireEvent.change(emailInput, {
      target: { value: "friend" },
    });

    const suggestion = await screen.findByRole("button", {
      name: /friend@example.com/i,
    });

    fireEvent.click(suggestion);

    expect(emailInput).toHaveValue("friend@example.com");
  });
});
