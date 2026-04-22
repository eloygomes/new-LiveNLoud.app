import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EventModal from "./EventModal";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvent,
  fetchCalendarEvents,
  fetchCurrentUserProfile,
  respondToCalendarEvent,
  updateCalendarEvent,
} from "../../Tools/Controllers";
import {
  formatDisplayDate,
  formatDisplayDateTime,
  formatDisplayTime,
} from "../../Tools/dateFormat";

const VIEW_OPTIONS = ["month", "week", "year"];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date) {
  return addDays(date, -date.getDay());
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function sameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function sameMonth(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth()
  );
}

function formatDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(value) {
  return formatDisplayDateTime(value);
}

function formatCompactDate(value) {
  return formatDisplayDateTime(value);
}

function toLowercaseEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getColorFromEmail(email) {
  const palette = [
    "bg-[goldenrod]",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-cyan-500",
  ];
  const normalized = toLowercaseEmail(email);
  const hash = [...normalized].reduce(
    (accumulator, character) => accumulator + character.charCodeAt(0),
    0,
  );
  return palette[hash % palette.length];
}

function getParticipantEmails(event) {
  const emails = [
    event?.ownerEmail,
    ...(Array.isArray(event?.invitedUsers)
      ? event.invitedUsers.map((user) => user.email)
      : []),
    ...(Array.isArray(event?.pendingInvitedUsers)
      ? event.pendingInvitedUsers.map((user) => user.email)
      : []),
  ]
    .map(toLowercaseEmail)
    .filter(Boolean);

  return emails.filter(
    (email, index, array) => array.findIndex((candidate) => candidate === email) === index,
  );
}

function buildMonthDays(viewDate) {
  const first = startOfMonth(viewDate);
  const last = endOfMonth(viewDate);
  const calendarStart = addDays(first, -first.getDay());
  const calendarEnd = addDays(last, 6 - last.getDay());
  const days = [];

  for (
    let cursor = new Date(calendarStart);
    cursor <= calendarEnd;
    cursor = addDays(cursor, 1)
  ) {
    days.push(new Date(cursor));
  }

  return days;
}

function buildWeekDays(viewDate) {
  const first = startOfWeek(viewDate);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

function groupEventsByDay(events) {
  return events.reduce((accumulator, event) => {
    const key = formatDayKey(new Date(event.startsAt));
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(event);
    return accumulator;
  }, {});
}

function formatTime(value) {
  return formatDisplayTime(value);
}

function getWeekLabel(viewDate) {
  const first = startOfWeek(viewDate);
  const last = addDays(first, 6);

  return `${formatDisplayDate(first)} - ${formatDisplayDate(last)}`;
}

function getYearMonths(viewDate) {
  return Array.from(
    { length: 12 },
    (_, index) => new Date(viewDate.getFullYear(), index, 1),
  );
}

function getMiniMonthGrid(monthDate) {
  const first = startOfMonth(monthDate);
  const last = endOfMonth(monthDate);
  const calendarStart = addDays(first, -first.getDay());
  const calendarEnd = addDays(last, 6 - last.getDay());
  const days = [];

  for (
    let cursor = new Date(calendarStart);
    cursor <= calendarEnd;
    cursor = addDays(cursor, 1)
  ) {
    days.push(new Date(cursor));
  }

  return days;
}

function InviteResponseModal({
  open,
  event,
  loading,
  error,
  onClose,
  onRespond,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10030] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-[28px] bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-xl"
        onClick={(eventClick) => eventClick.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold uppercase">Event Invitation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose if you want this event added to your calendar.
            </p>
          </div>
          <button
            type="button"
            className="text-3xl text-gray-500"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {loading ? <p className="mt-6 text-sm">Loading invitation...</p> : null}
        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
        {event ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-white px-5 py-4">
              <div className="text-xl font-extrabold">{event.title}</div>
              <div className="text-sm text-gray-500 mt-2">
                Created by @{event.ownerUsername}
              </div>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 text-sm">
              <div className="font-bold uppercase text-[11px] text-gray-500">
                Date and Time
              </div>
              <div className="mt-2">{formatReadableDate(event.startsAt)}</div>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 text-sm">
              <div className="font-bold uppercase text-[11px] text-gray-500">
                Description
              </div>
              <div className="mt-2 whitespace-pre-wrap">
                {event.description || "No description."}
              </div>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 text-sm break-all">
              <div className="font-bold uppercase text-[11px] text-gray-500">
                Invited Emails
              </div>
              <div className="mt-2">
                {[...(event.pendingInvitedUsers || []), ...(event.invitedUsers || [])]
                  .map((user) => user.email)
                  .join(", ") || "No guests."}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="neuphormism-b-btn px-4 py-3 text-xs font-bold uppercase"
            onClick={() => onRespond("declined")}
            disabled={loading || !event}
          >
            Decline
          </button>
          <button
            type="button"
            className="neuphormism-b-btn-gold px-4 py-3 text-xs font-bold uppercase"
            onClick={() => onRespond("accepted")}
            disabled={loading || !event}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Calendar() {
  const isTouchLayout =
    typeof window !== "undefined" && window.innerWidth <= 1024;
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [viewMode, setViewMode] = useState("month");
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [modalForceEdit, setModalForceEdit] = useState(false);
  const [newEventDate, setNewEventDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readOnlyMessage, setReadOnlyMessage] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEvent, setInviteEvent] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  const resetEventModalState = () => {
    setModalOpen(false);
    setEditingEvent(null);
    setModalForceEdit(false);
    setNewEventDate(null);
    setReadOnlyMessage("");
  };

  const resetInviteModalState = () => {
    setInviteModalOpen(false);
    setInviteEvent(null);
    setInviteError("");
  };

  const loadCalendar = async () => {
    setLoading(true);
    setError("");

    try {
      const [me, nextEvents] = await Promise.all([
        fetchCurrentUserProfile(),
        fetchCalendarEvents(),
      ]);
      setProfile(me);
      setEvents(nextEvents);
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Failed to load calendar.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const eventsByDay = useMemo(() => groupEventsByDay(events), [events]);
  const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate]);
  const weekDays = useMemo(() => buildWeekDays(viewDate), [viewDate]);
  const yearMonths = useMemo(() => getYearMonths(viewDate), [viewDate]);

  const selectedEvents = useMemo(() => {
    const key = formatDayKey(selectedDay);
    return (eventsByDay[key] || []).sort(
      (left, right) => new Date(left.startsAt) - new Date(right.startsAt),
    );
  }, [eventsByDay, selectedDay]);

  const upcomingEvents = useMemo(
    () =>
      [...events]
        .sort((left, right) => new Date(left.startsAt) - new Date(right.startsAt))
        .slice(0, 8),
    [events],
  );

  const canEditEvent = (event) => {
    if (!event || !profile?.email) return false;
    if (event.ownerEmail === profile.email) return true;

    return (
      Boolean(event.allowGuestEdit) &&
      Array.isArray(event.invitedUsers) &&
      event.invitedUsers.some((user) => user.email === profile.email)
    );
  };

  const saveEvent = async (payload) => {
    if (editingEvent?._id) {
      await updateCalendarEvent(editingEvent._id, payload);
    } else {
      await createCalendarEvent(payload);
    }

    setModalOpen(false);
    resetEventModalState();
    await loadCalendar();
  };

  const removeEvent = async (event) => {
    await deleteCalendarEvent(event._id);
    resetEventModalState();
    await loadCalendar();
  };

  const openEventEditor = (event) => {
    setEditingEvent(event);
    setSelectedDay(new Date(event.startsAt));
    setModalForceEdit(true);
    setNewEventDate(null);
    setReadOnlyMessage(
      canEditEvent(event)
        ? ""
        : "You can view this event, but only the owner or allowed guests can edit it.",
    );
    setModalOpen(true);
  };

  const openNewEventModal = (date) => {
    setEditingEvent(null);
    setModalForceEdit(true);
    setNewEventDate(date ? new Date(date) : new Date());
    setReadOnlyMessage("");
    setModalOpen(true);
  };

  const movePeriod = (direction) => {
    if (viewMode === "week") {
      setViewDate((current) => addDays(current, direction * 7));
      return;
    }

    if (viewMode === "year") {
      setViewDate(
        (current) => new Date(current.getFullYear() + direction, current.getMonth(), 1),
      );
      return;
    }

    setViewDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  };

  const currentLabel =
    viewMode === "week"
      ? getWeekLabel(viewDate)
      : viewMode === "year"
        ? String(viewDate.getFullYear())
        : formatDisplayDate(viewDate);

  useEffect(() => {
    const inviteEventId = searchParams.get("inviteEvent");
    const detailEventId = searchParams.get("event");
    if (!inviteEventId && !detailEventId) return;

    let cancelled = false;

    const loadInviteEvent = async () => {
      setInviteModalOpen(true);
      setInviteLoading(true);
      setInviteError("");

      try {
        const data = await fetchCalendarEvent(inviteEventId);
        if (!cancelled) {
          setInviteEvent(data);
          setViewDate(new Date(data.startsAt));
          setSelectedDay(new Date(data.startsAt));
        }
      } catch (inviteLoadError) {
        if (!cancelled) {
          setInviteError(
            inviteLoadError?.response?.data?.message ||
              inviteLoadError?.message ||
              "Failed to load invitation.",
          );
        }
      } finally {
        if (!cancelled) {
          setInviteLoading(false);
        }
      }
    };

    const loadDetailEvent = async () => {
      resetInviteModalState();
      setInviteLoading(false);
      setInviteError("");

      try {
        const data = await fetchCalendarEvent(detailEventId);
        if (!cancelled) {
          setEditingEvent(data);
          setViewDate(new Date(data.startsAt));
          setSelectedDay(new Date(data.startsAt));
          setModalForceEdit(false);
          setNewEventDate(null);
          setReadOnlyMessage(
            canEditEvent(data)
              ? ""
              : "You can view this event, but only the owner or allowed guests can edit it.",
          );
          setModalOpen(true);
        }
      } catch (detailLoadError) {
        if (!cancelled) {
          setError(
            detailLoadError?.response?.data?.message ||
              detailLoadError?.message ||
              "Failed to load event details.",
          );
        }
      } finally {
        if (!cancelled) {
          setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.delete("event");
            return next;
          });
        }
      }
    };

    if (inviteEventId) {
      loadInviteEvent();
    } else if (detailEventId) {
      loadDetailEvent();
    }

    return () => {
      cancelled = true;
    };
  }, [searchParams, profile]);

  useEffect(() => {
    const handleCloseAllModals = () => {
      resetEventModalState();
      resetInviteModalState();
    };

    window.addEventListener("close-all-modals", handleCloseAllModals);
    return () =>
      window.removeEventListener("close-all-modals", handleCloseAllModals);
  }, []);

  const closeInviteModal = () => {
    resetInviteModalState();
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("inviteEvent");
      return next;
    });
  };

  const handleInviteResponse = async (status) => {
    if (!inviteEvent?._id) return;

    setInviteLoading(true);
    setInviteError("");

    try {
      await respondToCalendarEvent(inviteEvent._id, status);
      closeInviteModal();
      await loadCalendar();
    } catch (respondError) {
      setInviteError(
        respondError?.response?.data?.message ||
          respondError?.message ||
          "Failed to respond to event invitation.",
      );
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div
      className={`flex justify-center ${
        isTouchLayout ? "min-h-screen bg-[#f0f0f0] pb-28 pt-3" : "h-screen"
      }`}
    >
      <InviteResponseModal
        open={inviteModalOpen}
        event={inviteEvent}
        loading={inviteLoading}
        error={inviteError}
        onClose={closeInviteModal}
        onRespond={handleInviteResponse}
      />
      <EventModal
        open={modalOpen}
        event={editingEvent}
        onClose={resetEventModalState}
        onSave={saveEvent}
        onDelete={removeEvent}
        canDelete={Boolean(
          editingEvent?._id && editingEvent?.ownerEmail === profile?.email,
        )}
        canEdit={editingEvent ? canEditEvent(editingEvent) && modalForceEdit : true}
        readOnlyMessage={readOnlyMessage}
        defaultDate={newEventDate}
      />

      <div className="container mx-auto">
        <div
          className={`${
            isTouchLayout ? "w-full px-3 pb-10" : "w-11/12 2xl:w-9/12 mx-auto pb-10"
          }`}
        >
          <div
            className={`my-5 neuphormism-b ${
              isTouchLayout ? "p-4" : "flex flex-row p-5"
            }`}
          >
            <div>
              {isTouchLayout ? (
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[goldenrod]">
                  # sustenido
                </div>
              ) : null}
              <h1
                className={`${isTouchLayout ? "mt-2 text-[2rem]" : "text-4xl"} font-bold`}
              >
                CALENDAR
              </h1>
              <h4 className="text-sm mt-2">
                Schedule rehearsals, sessions, and invite other users with
                their email.
              </h4>
            </div>
            <div
              className={`${
                isTouchLayout
                  ? "mt-4 flex flex-col gap-3"
                  : "ml-auto mt-auto flex items-center gap-3"
              }`}
            >
              <div className="flex rounded-full bg-white p-1">
                {VIEW_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-full px-4 py-2 text-[11px] font-bold uppercase transition ${
                      viewMode === option
                        ? "bg-black text-white"
                        : "text-gray-500"
                    }`}
                    onClick={() => setViewMode(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`neuphormism-b-btn-gold px-5 py-3 text-xs font-bold uppercase ${
                  isTouchLayout ? "w-full" : ""
                }`}
                onClick={() => {
                  openNewEventModal(new Date());
                }}
              >
                New Event
              </button>
            </div>
          </div>

          {error ? <div className="neuphormism-b p-4 text-red-600">{error}</div> : null}

          <div
            className={`grid grid-cols-1 gap-5 items-stretch ${
              isTouchLayout
                ? ""
                : "xl:grid-cols-[minmax(0,1.65fr),360px] min-h-[calc(100vh-260px)]"
            }`}
          >
            <div className="neuphormism-b p-5 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-5 gap-4">
                <button
                  type="button"
                  className="neuphormism-b-btn px-4 py-2 text-xs font-bold uppercase"
                  onClick={() => movePeriod(-1)}
                >
                  Prev
                </button>
                <div className="text-center">
                  <h2 className="text-xl font-bold uppercase">{currentLabel}</h2>
                  <p className="text-[11px] text-gray-500 uppercase mt-1">
                    Double-click any event card to edit it.
                  </p>
                </div>
                <button
                  type="button"
                  className="neuphormism-b-btn px-4 py-2 text-xs font-bold uppercase"
                  onClick={() => movePeriod(1)}
                >
                  Next
                </button>
              </div>

              {viewMode === "month" ? (
                <>
                  <div className="grid grid-cols-7 gap-3 text-center text-xs font-bold uppercase text-gray-500 mb-3">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={label}>{label}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 grid-rows-6 gap-3">
                    {monthDays.map((day) => {
                      const key = formatDayKey(day);
                      const dayEvents = eventsByDay[key] || [];
                      const isCurrentMonth = sameMonth(day, viewDate);
                      const isSelected = sameDay(day, selectedDay);
                      const isToday = sameDay(day, new Date());

                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => setSelectedDay(day)}
                          onDoubleClick={() => openNewEventModal(day)}
                          className={`h-[96px] min-h-[96px] rounded-3xl p-3 text-left transition overflow-hidden ${
                            isSelected ? "bg-black text-white" : "bg-white/80 text-black"
                          } ${!isCurrentMonth ? "opacity-45" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{day.getDate()}</span>
                            {isToday ? (
                              <span className="text-[10px] uppercase text-[goldenrod]">
                                Today
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {dayEvents.slice(0, 4).map((event) => (
                              <button
                                type="button"
                                key={event._id}
                                onDoubleClick={(eventClick) => {
                                  eventClick.stopPropagation();
                                  openEventEditor(event);
                                }}
                                onClick={(eventClick) => {
                                  eventClick.stopPropagation();
                                  setSelectedDay(day);
                                }}
                                className={`h-2.5 w-2.5 rounded-full ${
                                  isSelected
                                    ? "bg-[goldenrod]"
                                    : "bg-gray-300"
                                }`}
                                title={`${event.title} • ${formatReadableDate(event.startsAt)}`}
                                aria-label={event.title}
                              />
                            ))}
                            {dayEvents.length > 4 ? (
                              <div className="text-[10px] font-bold uppercase">
                                +{dayEvents.length - 4}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {viewMode === "week" ? (
                <div className="overflow-auto flex-1 min-h-0">
                  <div className="grid grid-cols-7 gap-3 min-w-[840px] h-full min-h-[calc(100vh-360px)]">
                    {weekDays.map((day) => {
                      const key = formatDayKey(day);
                      const dayEvents = (eventsByDay[key] || []).sort(
                        (left, right) =>
                          new Date(left.startsAt) - new Date(right.startsAt),
                      );
                      const isToday = sameDay(day, new Date());

                      return (
                        <div
                          key={key}
                          className={`rounded-[28px] p-4 flex flex-col min-h-0 ${
                            sameDay(day, selectedDay)
                              ? "bg-black text-white"
                              : "bg-white/80"
                          }`}
                          onClick={() => setSelectedDay(day)}
                          onDoubleClick={() => openNewEventModal(day)}
                        >
                          <div className="mb-4 border-b border-black/10 pb-3">
                            <p className="text-xs uppercase font-bold opacity-70">
                              {WEEKDAY_LABELS[day.getDay()]}
                            </p>
                            <p className="text-2xl font-bold mt-1">
                              {day.getDate()}
                            </p>
                            {isToday ? (
                              <span className="text-[10px] uppercase text-[goldenrod]">
                                Today
                              </span>
                            ) : null}
                          </div>
                          <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
                            {dayEvents.length === 0 ? (
                              <div className="rounded-2xl bg-white/50 p-3 text-xs text-gray-500">
                                No events.
                              </div>
                            ) : (
                              dayEvents.map((event) => (
                                <div
                                  key={event._id}
                                  onDoubleClick={() => openEventEditor(event)}
                                  className={`rounded-2xl p-3 cursor-default ${
                                    sameDay(day, selectedDay)
                                      ? "bg-white/15 border border-white/10"
                                      : "bg-gray-100"
                                  }`}
                                >
                                  <div className="text-[11px] uppercase font-bold opacity-70">
                                    {formatTime(event.startsAt)}
                                  </div>
                                  <div className="font-bold mt-1">{event.title}</div>
                                  {event.description ? (
                                    <div className="text-xs mt-2 opacity-80 line-clamp-3">
                                      {event.description}
                                    </div>
                                  ) : null}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {viewMode === "year" ? (
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {yearMonths.map((monthDate) => {
                    const miniGrid = getMiniMonthGrid(monthDate);
                    return (
                      <button
                        type="button"
                        key={monthDate.toISOString()}
                        className="rounded-[24px] bg-white/80 p-3 text-left"
                        onClick={() => {
                          setViewMode("month");
                          setViewDate(monthDate);
                          setSelectedDay(monthDate);
                        }}
                        onDoubleClick={() => openNewEventModal(monthDate)}
                      >
                        <h3 className="text-base font-bold uppercase mb-2">
                          {formatDisplayDate(monthDate)}
                        </h3>
                        <div className="grid grid-cols-7 gap-y-1 text-center text-[9px] text-gray-500 uppercase mb-1.5">
                          {WEEKDAY_LABELS.map((label) => (
                            <div key={label}>{label.slice(0, 1)}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 text-center text-[13px]">
                          {miniGrid.map((day) => {
                            const dayEvents = eventsByDay[formatDayKey(day)] || [];
                            const participantColors = dayEvents
                              .flatMap((event) =>
                                getParticipantEmails(event).map((email) =>
                                  getColorFromEmail(email),
                                ),
                              )
                              .filter(
                                (color, index, array) =>
                                  array.findIndex((candidate) => candidate === color) === index,
                              )
                              .slice(0, 4);
                            return (
                              <div
                                key={day.toISOString()}
                                className={`mx-auto flex h-8 w-8 flex-col items-center justify-center rounded-full ${
                                  sameDay(day, new Date()) && sameMonth(day, monthDate)
                                    ? "bg-black text-white"
                                    : ""
                                } ${sameMonth(day, monthDate) ? "" : "opacity-30"}`}
                              >
                                <span>{day.getDate()}</span>
                                {participantColors.length ? (
                                  <span className="mt-0.5 flex items-center justify-center gap-[2px]">
                                    {participantColors.map((color) => (
                                      <span
                                        key={`${day.toISOString()}-${color}`}
                                        className={`h-1 w-1 rounded-full ${color}`}
                                      />
                                    ))}
                                  </span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex min-h-0 flex-col gap-5">
              <div className="neuphormism-b p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold uppercase">Selected Day</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDisplayDate(selectedDay)}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase text-gray-600">
                    {selectedEvents.length} events
                  </div>
                </div>

                <div
                  className={`space-y-4 mt-5 ${
                    selectedEvents.length > 2 ? "max-h-[360px] overflow-y-auto pr-1" : ""
                  }`}
                >
                  {loading ? <p className="text-sm">Loading events...</p> : null}
                  {!loading && selectedEvents.length === 0 ? (
                    <div className="rounded-3xl bg-white p-4 text-sm text-gray-500">
                      No events scheduled for this day.
                    </div>
                  ) : null}

                  {!loading
                    ? selectedEvents.map((event) => (
                        <div
                          key={event._id}
                          className="w-full rounded-3xl bg-white p-4 text-left"
                          onDoubleClick={() => openEventEditor(event)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-bold">{event.title}</h3>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatReadableDate(event.startsAt)}
                              </p>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-[goldenrod]">
                              {event.ownerEmail === profile?.email ? "Owner" : "Guest"}
                            </span>
                          </div>
                          {event.description ? (
                            <p className="text-sm mt-3 text-gray-700">
                              {event.description}
                            </p>
                          ) : null}
                          {event.invitedUsers?.length ? (
                            <p className="text-[11px] text-gray-500 mt-3 break-all">
                              Guests: {event.invitedUsers
                                .map((user) => toLowercaseEmail(user.email))
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                      ))
                    : null}
                </div>
              </div>

              <div className="neuphormism-b p-5 flex-1 min-h-0 flex flex-col">
                <h2 className="text-xl font-bold uppercase">Upcoming</h2>
                <div className="mt-5 flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
                  {upcomingEvents.length === 0 ? (
                    <div className="rounded-3xl bg-white p-4 text-sm text-gray-500">
                      No upcoming events yet.
                    </div>
                  ) : (
                    upcomingEvents.map((event) => (
                      <button
                        type="button"
                        key={event._id}
                        className="w-full rounded-3xl bg-white px-4 py-3 text-left"
                        onClick={() => {
                          setSelectedDay(new Date(event.startsAt));
                          setViewDate(new Date(event.startsAt));
                        }}
                        onDoubleClick={() => openEventEditor(event)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-bold truncate">{event.title}</div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              {formatCompactDate(event.startsAt)}
                            </div>
                          </div>
                          <div className="max-w-[120px] text-[10px] font-bold break-all text-right text-gray-600 lowercase">
                            {toLowercaseEmail(event.ownerEmail)}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
