import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EventModal from "./EventModal";
import { searchUsers } from "../../Tools/Controllers";

vi.mock("../../Tools/Controllers", () => ({
  searchUsers: vi.fn(),
}));

describe("EventModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render when closed", () => {
    render(<EventModal open={false} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.queryByText("Create Event")).not.toBeInTheDocument();
  });

  it("renders the event data and submits the edited payload", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EventModal
        open
        event={{
          title: "Rehearsal",
          description: "Warmup and setlist",
          startsAt: "2026-05-12T19:30:00.000Z",
          invitedUsersText: "friend@example.com",
          allowGuestEdit: true,
          ownerUsername: "eloy",
        }}
        onClose={vi.fn()}
        onSave={onSave}
        canDelete
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Event title"), {
      target: { value: "Band Rehearsal" },
    });
    fireEvent.change(
      screen.getByPlaceholderText(
        "Describe the rehearsal, meeting, or session.",
      ),
      {
        target: { value: "Full run-through" },
      },
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        "Attendees: user@email.com another@email.com",
      ),
      {
        target: { value: "friend@example.com guest@example.com" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Event" }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Band Rehearsal",
          description: "Full run-through",
          invitedUsersText: "friend@example.com guest@example.com",
          allowGuestEdit: true,
        }),
      );
    });

    expect(onSave.mock.calls[0][0].startsAt).toMatch(
      /^2026-05-12T\d{2}:30:00.000Z$/,
    );
  });

  it("loads attendee suggestions and fills the active token when selected", async () => {
    searchUsers.mockResolvedValue([
      { email: "friend@example.com", fullName: "Friend Name" },
    ]);

    render(
      <EventModal open onClose={vi.fn()} onSave={vi.fn()} defaultDate="2026-05-12" />,
    );

    fireEvent.change(
      screen.getByPlaceholderText(
        "Attendees: user@email.com another@email.com",
      ),
      {
        target: { value: "fri" },
      },
    );

    await waitFor(() => {
      expect(searchUsers).toHaveBeenCalledWith("fri");
    });

    const suggestion = await screen.findByRole("button", {
      name: /friend@example.com/i,
    });
    fireEvent.click(suggestion);

    expect(searchUsers).toHaveBeenCalledWith("fri");
    expect(
      screen.getByPlaceholderText("Attendees: user@email.com another@email.com"),
    ).toHaveValue("friend@example.com ");
  });

  it("shows a save error when onSave rejects", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));

    render(
      <EventModal
        open
        onClose={vi.fn()}
        onSave={onSave}
        defaultDate="2026-05-12"
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Event title"), {
      target: { value: "Event" },
    });
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[1], { target: { value: "Desc" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Event" }));

    expect(await screen.findByText("Save failed")).toBeInTheDocument();
  });
});
