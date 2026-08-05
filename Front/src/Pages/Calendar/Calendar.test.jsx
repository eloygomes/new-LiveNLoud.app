import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Calendar from "./Calendar";
import {
  fetchCalendarEvent,
  fetchCalendarEvents,
  fetchCurrentUserProfile,
  respondToCalendarEvent,
} from "../../Tools/Controllers";

vi.mock("../../Tools/Controllers", () => ({
  createCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
  fetchCalendarEvent: vi.fn(),
  fetchCalendarEvents: vi.fn(),
  fetchCurrentUserProfile: vi.fn(),
  respondToCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
}));

vi.mock("./EventModal", () => ({
  default: function EventModalMock({ open }) {
    return open ? <div>Event modal open</div> : null;
  },
}));

function renderCalendar(initialEntry = "/calendar") {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/calendar" element={<Calendar />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("Calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", {
      value: 1200,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      configurable: true,
    });

    fetchCurrentUserProfile.mockResolvedValue({
      email: "owner@example.com",
    });
    fetchCalendarEvents.mockResolvedValue([
      {
        _id: "1",
        title: "Band Rehearsal",
        description: "Warmup",
        startsAt: "2026-05-20T19:30:00.000Z",
        ownerEmail: "owner@example.com",
        ownerUsername: "owner",
        invitedUsers: [],
        pendingInvitedUsers: [],
        allowGuestEdit: true,
      },
    ]);
    fetchCalendarEvent.mockResolvedValue({
      _id: "invite-1",
      title: "Special Session",
      description: "Join us",
      startsAt: "2026-05-21T20:00:00.000Z",
      ownerEmail: "owner@example.com",
      ownerUsername: "owner",
      invitedUsers: [{ email: "friend@example.com" }],
      pendingInvitedUsers: [],
      allowGuestEdit: true,
    });
    respondToCalendarEvent.mockResolvedValue(undefined);
  });

  it("loads and displays the calendar with upcoming events", async () => {
    renderCalendar();

    await waitFor(() => {
      expect(fetchCalendarEvents).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText("CALENDAR")).toBeInTheDocument();
    expect(screen.getByText("Band Rehearsal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New event" })).toBeInTheDocument();
  });

  it("switches view modes and changes the main label", async () => {
    renderCalendar();

    await waitFor(() => {
      expect(fetchCalendarEvents).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "week" }));
    expect(
      screen.getByRole("heading", { level: 2, name: / - / }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "year" }));
    expect(screen.getByRole("heading", { name: "2026" })).toBeInTheDocument();
  });

  it("opens the invitation modal from the query string and responds to it", async () => {
    renderCalendar("/calendar?inviteEvent=invite-1");

    expect(await screen.findByText("Event Invitation")).toBeInTheDocument();
    expect(screen.getByText("Special Session")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => {
      expect(respondToCalendarEvent).toHaveBeenCalledWith(
        "invite-1",
        "accepted",
      );
    });
  });

  it("uses the full editorial planning workspace on portrait tablets", async () => {
    Object.defineProperty(window, "innerWidth", {
      value: 768,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: 1024,
      configurable: true,
    });

    renderCalendar();

    await waitFor(() => {
      expect(fetchCalendarEvents).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId("tablet-tool-shell")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Give every rehearsal a clear place in the week.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Calendar planning illustration" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New event" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Selected Day")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "week" }));
    expect(
      screen.getByRole("heading", { level: 2, name: / - / }),
    ).toBeInTheDocument();
  });
});
