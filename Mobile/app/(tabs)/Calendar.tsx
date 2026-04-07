import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarEvent,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchCalendarEvent,
  fetchCalendarEvents,
  fetchCurrentUserProfile,
  respondToCalendarEvent,
  updateCalendarEvent,
  UserProfile,
} from "@/connect/connect";

const GOLD = "#d9ad26";
const PANEL = "#e0e0e0";
const SOFT = "#efefef";
const WHITE = "#fff";
const TEXT = "#0b0b0b";
const MUTED = "#6b7280";
const BORDER = "#d1d5db";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const VIEW_OPTIONS = ["month", "week", "year"] as const;

type ViewMode = (typeof VIEW_OPTIONS)[number];

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date) {
  return addDays(date, -date.getDay());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildMonthDays(date: Date) {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  const days = [];

  for (
    let cursor = addDays(first, -first.getDay());
    cursor <= addDays(last, 6 - last.getDay());
    cursor = addDays(cursor, 1)
  ) {
    days.push(new Date(cursor));
  }

  return days;
}

function buildWeekDays(date: Date) {
  const first = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

function chunkDays(days: Date[]) {
  const rows: Date[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    rows.push(days.slice(index, index + 7));
  }
  return rows;
}

function formatDateInput(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return formatDateInput(new Date());
  return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
}

function formatTimeInput(value?: string | Date | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return formatTimeInput(new Date());
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseDateAndTime(dateInput: string, timeInput: string) {
  const dateMatch = dateInput.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const timeMatch = timeInput.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) return null;

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (month < 1 || month > 12 || hour > 23 || minute > 59) return null;

  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function displayDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatDateInput(date)}, ${formatTimeInput(date)}`;
}

function lower(email?: string) {
  return String(email || "").trim().toLowerCase();
}

function safeEventDate(value?: string | Date | null, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function withCurrentTime(date: Date) {
  const now = new Date();
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    now.getHours(),
    now.getMinutes(),
    0,
    0,
  );
}

function groupByDay(events: CalendarEvent[]) {
  return events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const date = safeEventDate(event.startsAt, new Date(NaN));
    if (Number.isNaN(date.getTime())) return acc;
    const key = formatDayKey(date);
    acc[key] = acc[key] || [];
    acc[key].push(event);
    return acc;
  }, {});
}

function canEditEvent(event: CalendarEvent | null, profile: UserProfile | null) {
  if (!event || !profile?.email) return false;
  if (lower(event.ownerEmail) === lower(profile.email)) return true;
  return Boolean(event.allowGuestEdit) &&
    (event.invitedUsers || []).some((user) => lower(user.email) === lower(profile.email));
}

export default function Calendar() {
  const router = useRouter();
  const params = useLocalSearchParams<{ event?: string; inviteEvent?: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [forceEdit, setForceEdit] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

 const loadCalendar = useCallback(async () => {
    const [me, nextEvents] = await Promise.all([
      fetchCurrentUserProfile(),
      fetchCalendarEvents(),
    ]);
    setProfile(me);
    setEvents(nextEvents);
    console.log(`[${Platform.OS}] [calendar] loaded events`, nextEvents.length);
  }, []);

  useEffect(() => {
    loadCalendar()
      .catch((error) => Alert.alert("Calendar", error.message || "Failed to load calendar."))
      .finally(() => setLoading(false));
  }, [loadCalendar]);

  useEffect(() => {
    const eventId = params.event || params.inviteEvent;
    if (!eventId) return;

    fetchCalendarEvent(String(eventId))
      .then((event) => {
        setSelectedEvent(event);
        const eventDate = safeEventDate(event.startsAt);
        setViewDate(eventDate);
        setSelectedDay(eventDate);
        setForceEdit(false);
        setInviteModalOpen(Boolean(params.inviteEvent));
        setModalOpen(Boolean(params.event));
      })
      .catch((error) => Alert.alert("Calendar", error.message || "Failed to open event."));
  }, [params.event, params.inviteEvent]);

  const eventsByDay = useMemo(() => groupByDay(events), [events]);
  const monthDays = useMemo(() => buildMonthDays(viewDate), [viewDate]);
  const weekDays = useMemo(() => buildWeekDays(viewDate), [viewDate]);
  const selectedEvents = useMemo(
    () =>
      [...(eventsByDay[formatDayKey(selectedDay)] || [])].sort(
        (left, right) => safeEventDate(left.startsAt).getTime() - safeEventDate(right.startsAt).getTime()
      ),
    [eventsByDay, selectedDay]
  );
  const upcomingEvents = useMemo(
    () =>
      [...events].sort(
        (left, right) => safeEventDate(left.startsAt).getTime() - safeEventDate(right.startsAt).getTime()
      ),
    [events]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadCalendar();
    } finally {
      setRefreshing(false);
    }
  };

  const movePeriod = (direction: number) => {
    setViewDate((current) => {
      if (viewMode === "week") return addDays(current, direction * 7);
      if (viewMode === "year") return new Date(current.getFullYear() + direction, 0, 1);
      return new Date(current.getFullYear(), current.getMonth() + direction, 1);
    });
  };

  const openNewEvent = (date = new Date()) => {
    const nextDate = withCurrentTime(date);
    setDefaultDate(nextDate);
    setSelectedDay(nextDate);
    setViewDate(nextDate);
    setSelectedEvent(null);
    setForceEdit(true);
    setModalOpen(true);
  };

  const openEventDetails = (event: CalendarEvent, editIntent = false) => {
    const eventDate = safeEventDate(event.startsAt);
    setSelectedEvent(event);
    setSelectedDay(eventDate);
    setDefaultDate(null);
    setForceEdit(editIntent);
    setModalOpen(true);
  };

  const saveEvent = async (payload: {
    title: string;
    description: string;
    dateInput: string;
    timeInput: string;
    invitedUsersText: string;
    allowGuestEdit: boolean;
  }) => {
    const startsAtDate = parseDateAndTime(payload.dateInput, payload.timeInput);
    if (!startsAtDate) {
      throw new Error("Use a valid date as DD-MM-YYYY and time as HH:mm.");
    }
    const startsAt = startsAtDate.toISOString();

    if (selectedEvent?._id) {
      await updateCalendarEvent(selectedEvent._id, {
        title: payload.title,
        description: payload.description,
        startsAt,
        invitedUsersText: payload.invitedUsersText,
        allowGuestEdit: payload.allowGuestEdit,
      });
    } else {
      await createCalendarEvent({
        title: payload.title,
        description: payload.description,
        startsAt,
        invitedUsersText: payload.invitedUsersText,
        allowGuestEdit: payload.allowGuestEdit,
      });
    }

    setModalOpen(false);
    setSelectedEvent(null);
    await loadCalendar();
  };

  const removeEvent = async () => {
    if (!selectedEvent?._id) return;
    await deleteCalendarEvent(selectedEvent._id);
    setModalOpen(false);
    setSelectedEvent(null);
    await loadCalendar();
  };

  const handleInviteResponse = async (status: "accepted" | "declined") => {
    if (!selectedEvent?._id) return;
    await respondToCalendarEvent(selectedEvent._id, status);
    setInviteModalOpen(false);
    setSelectedEvent(null);
    await loadCalendar();
  };

  const currentLabel =
    viewMode === "year"
      ? String(viewDate.getFullYear())
      : viewMode === "week"
        ? `${formatDateInput(buildWeekDays(viewDate)[0])} - ${formatDateInput(buildWeekDays(viewDate)[6])}`
        : viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      <SafeAreaProvider>
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            nestedScrollEnabled
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.kicker}># SUSTENIDO</Text>
                <Text style={styles.title}>Calendar</Text>
                <Text style={styles.subtitle}>
                  Schedule sessions and invite friends by email.
                </Text>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={() => openNewEvent(new Date())}>
                <Text style={styles.primaryButtonText}>New</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.viewSwitch}>
              {VIEW_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.viewButton, viewMode === option && styles.viewButtonActive]}
                  onPress={() => setViewMode(option)}
                >
                  <Text style={[styles.viewButtonText, viewMode === option && styles.viewButtonTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.calendarCard}>
              <View style={styles.periodRow}>
                <TouchableOpacity style={styles.periodButton} onPress={() => movePeriod(-1)}>
                  <Text style={styles.periodText}>Prev</Text>
                </TouchableOpacity>
                <Text style={styles.periodTitle}>{currentLabel}</Text>
                <TouchableOpacity style={styles.periodButton} onPress={() => movePeriod(1)}>
                  <Text style={styles.periodText}>Next</Text>
                </TouchableOpacity>
              </View>

              {loading ? <ActivityIndicator color={GOLD} style={{ marginVertical: 24 }} /> : null}
              {!loading && viewMode === "month" ? (
                <MonthView
                  days={monthDays}
                  eventsByDay={eventsByDay}
                  selectedDay={selectedDay}
                  viewDate={viewDate}
                  onSelect={setSelectedDay}
                  onCreate={openNewEvent}
                  onOpenEvent={openEventDetails}
                />
              ) : null}
              {!loading && viewMode === "week" ? (
                <WeekView
                  days={weekDays}
                  eventsByDay={eventsByDay}
                  selectedDay={selectedDay}
                  onSelect={setSelectedDay}
                  onCreate={openNewEvent}
                  onOpenEvent={openEventDetails}
                />
              ) : null}
              {!loading && viewMode === "year" ? (
                <YearView
                  year={viewDate.getFullYear()}
                  eventsByDay={eventsByDay}
                  onSelect={openNewEvent}
                />
              ) : null}
            </View>

            <View style={styles.sideCard}>
              <View style={styles.sideTitleRow}>
                <Text style={styles.sideTitle}>Selected Day</Text>
                <Text style={styles.countBadge}>{selectedEvents.length} events</Text>
              </View>
              <Text style={styles.muted}>{formatDateInput(selectedDay)}</Text>
              <ScrollView style={styles.compactScroll} nestedScrollEnabled>
                {selectedEvents.length === 0 ? (
                  <Text style={styles.emptyText}>No events scheduled for this day.</Text>
                ) : (
                  selectedEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      profile={profile}
                      onPress={() => openEventDetails(event, false)}
                      onEdit={() => openEventDetails(event, true)}
                    />
                  ))
                )}
              </ScrollView>
            </View>

            <View style={styles.sideCard}>
              <Text style={styles.sideTitle}>Upcoming</Text>
              <ScrollView style={styles.upcomingScroll} nestedScrollEnabled>
                {upcomingEvents.length === 0 ? (
                  <Text style={styles.emptyText}>No upcoming events yet.</Text>
                ) : (
                  upcomingEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      profile={profile}
                      compact
                      onPress={() => {
                        const eventDate = safeEventDate(event.startsAt);
                        setSelectedDay(eventDate);
                        setViewDate(eventDate);
                      }}
                      onEdit={() => openEventDetails(event, true)}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          </ScrollView>

          <EventModal
            open={modalOpen}
            event={selectedEvent}
            profile={profile}
            defaultDate={defaultDate}
            canEdit={selectedEvent ? canEditEvent(selectedEvent, profile) && forceEdit : true}
            onClose={() => setModalOpen(false)}
            onSave={saveEvent}
            onDelete={removeEvent}
          />
          <InviteModal
            open={inviteModalOpen}
            event={selectedEvent}
            onClose={() => setInviteModalOpen(false)}
            onRespond={handleInviteResponse}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

function MonthView({
  days,
  eventsByDay,
  selectedDay,
  viewDate,
  onSelect,
  onCreate,
  onOpenEvent,
}: {
  days: Date[];
  eventsByDay: Record<string, CalendarEvent[]>;
  selectedDay: Date;
  viewDate: Date;
  onSelect: (date: Date) => void;
  onCreate: (date: Date) => void;
  onOpenEvent: (event: CalendarEvent, editIntent?: boolean) => void;
}) {
  const weeks = useMemo(() => chunkDays(days), [days]);

  return (
    <>
      <View style={styles.weekdayRow}>{WEEKDAYS.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}</View>
      <View style={styles.monthGrid}>
        {weeks.map((week) => (
          <View key={week.map(formatDayKey).join("-")} style={styles.monthWeekRow}>
            {week.map((day) => {
              const key = formatDayKey(day);
              const selected = sameDay(day, selectedDay);
              const sameMonth = day.getMonth() === viewDate.getMonth();
              const dayEvents = eventsByDay[key] || [];
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.monthCell, selected && styles.monthCellSelected, !sameMonth && styles.faded]}
                  onPress={() => {
                    onSelect(day);
                    onCreate(day);
                  }}
                  onLongPress={() => onCreate(day)}
                >
                  <Text style={[styles.dayNumber, selected && styles.selectedText]}>{day.getDate()}</Text>
                  <View style={styles.dotRow}>
                    {dayEvents.slice(0, 5).map((event) => (
                      <TouchableOpacity
                        key={event._id}
                        style={styles.eventDot}
                        onPress={() => onOpenEvent(event, false)}
                      />
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </>
  );
}

function WeekView(props: Omit<React.ComponentProps<typeof MonthView>, "viewDate">) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
      <View style={styles.weekRow}>
        {props.days.map((day) => {
          const events = props.eventsByDay[formatDayKey(day)] || [];
          return (
            <View
              key={formatDayKey(day)}
              style={[styles.weekDayCard, sameDay(day, props.selectedDay) && styles.weekDaySelected]}
            >
              <TouchableOpacity
                onPress={() => {
                  props.onSelect(day);
                  props.onCreate(day);
                }}
                onLongPress={() => props.onCreate(day)}
              >
                <Text style={styles.weekDayName}>{WEEKDAYS[day.getDay()]}</Text>
                <Text style={styles.weekDayNumber}>{day.getDate()}</Text>
              </TouchableOpacity>
              <ScrollView style={styles.weekEvents} nestedScrollEnabled>
                {events.length === 0 ? <Text style={styles.emptyText}>No events.</Text> : null}
                {events.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    compact
                    onPress={() => props.onOpenEvent(event, false)}
                    onEdit={() => props.onOpenEvent(event, true)}
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function YearView({
  year,
  eventsByDay,
  onSelect,
}: {
  year: number;
  eventsByDay: Record<string, CalendarEvent[]>;
  onSelect: (date: Date) => void;
}) {
  return (
    <View style={styles.yearGrid}>
      {Array.from({ length: 12 }, (_, month) => new Date(year, month, 1)).map((monthDate) => (
        <YearMonth
          key={monthDate.toISOString()}
          monthDate={monthDate}
          eventsByDay={eventsByDay}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

function YearMonth({
  monthDate,
  eventsByDay,
  onSelect,
}: {
  monthDate: Date;
  eventsByDay: Record<string, CalendarEvent[]>;
  onSelect: (date: Date) => void;
}) {
  const weeks = useMemo(() => chunkDays(buildMonthDays(monthDate)), [monthDate]);

  return (
    <View style={styles.yearMonth}>
      <Text style={styles.yearMonthTitle}>{monthDate.toLocaleString(undefined, { month: "long" })}</Text>
      <View style={styles.miniWeekdayRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.miniWeekday}>{day.slice(0, 1)}</Text>
        ))}
      </View>
      <View style={styles.miniGrid}>
        {weeks.map((week) => (
          <View key={week.map(formatDayKey).join("-")} style={styles.miniWeekRow}>
            {week.map((day) => {
              const events = eventsByDay[formatDayKey(day)] || [];
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={styles.miniDay}
                  onPress={() => onSelect(day)}
                  disabled={day.getMonth() !== monthDate.getMonth()}
                >
                  <Text style={[styles.miniDayText, day.getMonth() !== monthDate.getMonth() && styles.fadedText]}>
                    {day.getDate()}
                  </Text>
                  {events.length ? <View style={styles.miniDot} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function EventCard({
  event,
  profile,
  compact = false,
  onPress,
  onEdit,
}: {
  event: CalendarEvent;
  profile?: UserProfile | null;
  compact?: boolean;
  onPress: () => void;
  onEdit: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.eventCard, compact && styles.eventCardCompact]} onPress={onPress} onLongPress={onEdit}>
      <View style={styles.eventTopRow}>
        <Text style={styles.eventTitle} numberOfLines={compact ? 1 : 2}>{event.title}</Text>
        <Text style={styles.roleText}>{lower(event.ownerEmail) === lower(profile?.email) ? "Owner" : "Guest"}</Text>
      </View>
      <Text style={styles.muted}>{displayDate(event.startsAt)}</Text>
      {!compact && event.description ? <Text style={styles.eventDescription}>{event.description}</Text> : null}
      {!compact && event.invitedUsers?.length ? (
        <Text style={styles.guestText}>
          Guests: {event.invitedUsers.map((user) => lower(user.email)).join(", ")}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

function EventModal({
  open,
  event,
  profile,
  defaultDate,
  canEdit,
  onClose,
  onSave,
  onDelete,
}: {
  open: boolean;
  event: CalendarEvent | null;
  profile: UserProfile | null;
  defaultDate: Date | null;
  canEdit: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    description: string;
    dateInput: string;
    timeInput: string;
    invitedUsersText: string;
    allowGuestEdit: boolean;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateInput, setDateInput] = useState(formatDateInput());
  const [timeInput, setTimeInput] = useState(formatTimeInput());
  const [invitedUsersText, setInvitedUsersText] = useState("");
  const [allowGuestEdit, setAllowGuestEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const startsAt = event?.startsAt || defaultDate;
    setTitle(event?.title || "");
    setDescription(event?.description || "");
    setDateInput(formatDateInput(startsAt));
    setTimeInput(formatTimeInput(startsAt));
    setInvitedUsersText(event?.invitedUsersText || "");
    setAllowGuestEdit(Boolean(event?.allowGuestEdit));
  }, [defaultDate, event, open]);

  const isOwner = lower(event?.ownerEmail) === lower(profile?.email);

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{event ? (canEdit ? "Edit Event" : "Event Details") : "Create Event"}</Text>
              {event?.ownerUsername ? <Text style={styles.muted}>Created by @{event.ownerUsername}</Text> : null}
              {event && !canEdit ? <Text style={styles.warningText}>You can view this event, but you cannot edit it.</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput style={styles.inputTitle} value={title} onChangeText={setTitle} placeholder="Event title" editable={canEdit} />
            <View style={styles.dateTimeRow}>
              <View style={styles.dateInputWrap}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={dateInput}
                  onChangeText={setDateInput}
                  placeholder="DD-MM-YYYY"
                  editable={canEdit}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={styles.timeInputWrap}>
                <Text style={styles.inputLabel}>Hour</Text>
                <TextInput
                  style={styles.input}
                  value={timeInput}
                  onChangeText={setTimeInput}
                  placeholder="HH:mm"
                  editable={canEdit}
                  autoCapitalize="none"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Description"
              editable={canEdit}
              multiline
            />
            <TextInput
              style={styles.input}
              value={invitedUsersText}
              onChangeText={(value) => setInvitedUsersText(value.toLowerCase())}
              placeholder="friend@email.com another@email.com"
              editable={canEdit}
              autoCapitalize="none"
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Allow invited users to edit this event</Text>
              <Switch value={allowGuestEdit} onValueChange={setAllowGuestEdit} disabled={!canEdit || Boolean(event && !event.allowGuestEdit)} />
            </View>

            <View style={styles.modalActions}>
              {event && isOwner ? (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    Alert.alert("Delete event", "Remove this event?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => onDelete().catch((error) => Alert.alert("Calendar", error.message)),
                      },
                    ]);
                  }}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Close</Text>
              </TouchableOpacity>
              {canEdit ? (
                <TouchableOpacity
                  style={styles.saveButton}
                  disabled={saving}
                  onPress={async () => {
                    setSaving(true);
                    try {
                      await onSave({ title, description, dateInput, timeInput, invitedUsersText, allowGuestEdit });
                    } catch (error) {
                      Alert.alert("Calendar", error instanceof Error ? error.message : "Failed to save event.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function InviteModal({
  open,
  event,
  onClose,
  onRespond,
}: {
  open: boolean;
  event: CalendarEvent | null;
  onClose: () => void;
  onRespond: (status: "accepted" | "declined") => Promise<void>;
}) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Event Invitation</Text>
          <Text style={styles.muted}>Choose if you want this event added to your calendar.</Text>
          {event ? (
            <View style={styles.inviteDetails}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.muted}>{displayDate(event.startsAt)}</Text>
              <Text style={styles.eventDescription}>{event.description || "No description."}</Text>
            </View>
          ) : null}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => onRespond("declined").catch((error) => Alert.alert("Calendar", error.message))}>
              <Text style={styles.secondaryButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={() => onRespond("accepted").catch((error) => Alert.alert("Calendar", error.message))}>
              <Text style={styles.saveButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SOFT },
  content: { padding: 14, gap: 14 },
  header: { borderRadius: 22, backgroundColor: PANEL, padding: 18, flexDirection: "row", justifyContent: "space-between", gap: 12, shadowColor: "#bebebe", shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
  kicker: { fontSize: 11, fontWeight: "900", letterSpacing: 2, color: GOLD, textTransform: "uppercase" },
  title: { marginTop: 8, fontSize: 32, fontWeight: "900", textTransform: "uppercase", color: TEXT },
  subtitle: { marginTop: 8, fontSize: 13, lineHeight: 20, color: MUTED, maxWidth: 240 },
  primaryButton: { alignSelf: "flex-end", backgroundColor: GOLD, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 13 },
  primaryButtonText: { fontWeight: "900", color: TEXT, textTransform: "uppercase" },
  viewSwitch: { flexDirection: "row", backgroundColor: WHITE, borderRadius: 999, padding: 4, gap: 4 },
  viewButton: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  viewButtonActive: { backgroundColor: TEXT },
  viewButtonText: { fontSize: 11, fontWeight: "900", color: MUTED, textTransform: "uppercase" },
  viewButtonTextActive: { color: WHITE },
  calendarCard: { backgroundColor: PANEL, borderRadius: 22, padding: 14, shadowColor: "#bebebe", shadowOpacity: 0.14, shadowRadius: 12, elevation: 6 },
  periodRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 10 },
  periodButton: { backgroundColor: SOFT, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  periodText: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  periodTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "900", textTransform: "uppercase" },
  weekdayRow: { flexDirection: "row", marginBottom: 8 },
  weekday: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "900", color: MUTED },
  monthGrid: { gap: 5 },
  monthWeekRow: { flexDirection: "row", gap: 5 },
  monthCell: { flex: 1, minHeight: 58, borderRadius: 14, backgroundColor: WHITE, padding: 7 },
  monthCellSelected: { backgroundColor: TEXT },
  faded: { opacity: 0.36 },
  dayNumber: { fontSize: 12, fontWeight: "900", color: TEXT },
  selectedText: { color: WHITE },
  dotRow: { marginTop: 9, flexDirection: "row", flexWrap: "wrap", gap: 3 },
  eventDot: { width: 6, height: 6, borderRadius: 99, backgroundColor: GOLD },
  weekRow: { flexDirection: "row", gap: 10 },
  weekDayCard: { width: 150, minHeight: 420, borderRadius: 20, backgroundColor: WHITE, padding: 12 },
  weekDaySelected: { backgroundColor: "#f8f0d8" },
  weekDayName: { fontSize: 11, color: MUTED, fontWeight: "900", textTransform: "uppercase" },
  weekDayNumber: { marginTop: 4, fontSize: 24, fontWeight: "900" },
  weekEvents: { marginTop: 12, maxHeight: 330 },
  yearGrid: { gap: 10 },
  yearMonth: { backgroundColor: WHITE, borderRadius: 18, padding: 12, marginBottom: 10 },
  yearMonthTitle: { fontWeight: "900", textTransform: "uppercase", marginBottom: 8 },
  miniWeekdayRow: { flexDirection: "row", gap: 2, marginBottom: 4 },
  miniWeekday: { flex: 1, textAlign: "center", fontSize: 8, fontWeight: "900", color: MUTED },
  miniGrid: { gap: 3 },
  miniWeekRow: { flexDirection: "row", gap: 2 },
  miniDay: { flex: 1, alignItems: "center", minHeight: 28 },
  miniDayText: { fontSize: 11, fontWeight: "800" },
  fadedText: { color: "#c0c0c0" },
  miniDot: { marginTop: 2, width: 4, height: 4, borderRadius: 99, backgroundColor: GOLD },
  sideCard: { backgroundColor: PANEL, borderRadius: 22, padding: 14, gap: 8 },
  sideTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sideTitle: { fontSize: 20, fontWeight: "900", textTransform: "uppercase" },
  countBadge: { backgroundColor: WHITE, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: "900", color: MUTED },
  compactScroll: { maxHeight: 280 },
  upcomingScroll: { maxHeight: 430 },
  eventCard: { backgroundColor: WHITE, borderRadius: 18, padding: 14, marginTop: 10 },
  eventCardCompact: { padding: 12 },
  eventTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  eventTitle: { flex: 1, fontSize: 16, fontWeight: "900", color: TEXT },
  roleText: { fontSize: 10, fontWeight: "900", color: GOLD, textTransform: "uppercase" },
  muted: { color: MUTED, fontSize: 12, marginTop: 4 },
  emptyText: { color: MUTED, fontSize: 13, paddingVertical: 12 },
  eventDescription: { marginTop: 8, color: "#374151", lineHeight: 18 },
  guestText: { marginTop: 8, color: MUTED, fontSize: 11 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 16 },
  modalCard: { maxHeight: "88%", borderRadius: 26, backgroundColor: SOFT, padding: 18 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  modalTitle: { fontSize: 24, fontWeight: "900", textTransform: "uppercase", color: TEXT },
  closeText: { fontSize: 34, color: MUTED },
  warningText: { marginTop: 6, color: "#92400e", fontSize: 12, fontWeight: "700" },
  inputTitle: { marginTop: 16, borderRadius: 18, backgroundColor: WHITE, padding: 14, fontSize: 20, fontWeight: "900" },
  input: { marginTop: 12, borderRadius: 18, backgroundColor: WHITE, padding: 14, fontSize: 14 },
  inputLabel: { color: MUTED, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 12, textTransform: "uppercase" },
  dateTimeRow: { flexDirection: "row", gap: 10 },
  dateInputWrap: { flex: 1.45 },
  timeInputWrap: { flex: 1 },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  switchRow: { marginTop: 12, borderRadius: 18, backgroundColor: WHITE, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  switchLabel: { flex: 1, fontWeight: "800", color: TEXT },
  modalActions: { marginTop: 18, flexDirection: "row", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
  secondaryButton: { borderRadius: 14, backgroundColor: WHITE, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryButtonText: { fontWeight: "900", color: TEXT },
  saveButton: { borderRadius: 14, backgroundColor: GOLD, paddingHorizontal: 16, paddingVertical: 12 },
  saveButtonText: { fontWeight: "900", color: TEXT },
  deleteButton: { borderRadius: 14, backgroundColor: "#fee4e2", paddingHorizontal: 16, paddingVertical: 12 },
  deleteButtonText: { fontWeight: "900", color: "#b42318" },
  inviteDetails: { marginTop: 16, backgroundColor: WHITE, borderRadius: 18, padding: 14 },
});
