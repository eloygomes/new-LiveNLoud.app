import { useEffect, useMemo, useState } from "react";
import { searchUsers } from "../../Tools/Controllers";

function extractActiveEmailToken(text) {
  const pieces = String(text || "").split(/[\s,\n;]+/);
  return (pieces[pieces.length - 1] || "").trim();
}

function replaceActiveToken(text, email) {
  return String(text || "").replace(
    /([^\s,\n;]*)$/,
    () => `${email} `,
  );
}

function toLocalDateTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function nowLocalDateTimeValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function defaultDateTimeValueFromDate(value) {
  if (!value) return nowLocalDateTimeValue();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return nowLocalDateTimeValue();
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toDateValue(value) {
  if (!value) return "";
  return value.slice(0, 10);
}

function toTimeValue(value) {
  if (!value) return "";
  return value.slice(11, 16);
}

export default function EventModal({
  open,
  event,
  onClose,
  onSave,
  onDelete,
  canDelete = false,
  canEdit = true,
  readOnlyMessage = "",
  defaultDate = null,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [invitedUsersText, setInvitedUsersText] = useState("");
  const [allowGuestEdit, setAllowGuestEdit] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(event?.title || "");
    setDescription(event?.description || "");
    const initialDateTime = event?.startsAt
      ? toLocalDateTimeValue(event.startsAt)
      : defaultDateTimeValueFromDate(defaultDate);
    setEventDate(toDateValue(initialDateTime));
    setEventTime(toTimeValue(initialDateTime));
    setInvitedUsersText(event?.invitedUsersText || "");
    setAllowGuestEdit(Boolean(event?.allowGuestEdit));
    setSuggestions([]);
    setSaving(false);
    setError("");
  }, [defaultDate, event, open]);

  const activeToken = useMemo(
    () => extractActiveEmailToken(invitedUsersText),
    [invitedUsersText],
  );

  useEffect(() => {
    let cancelled = false;

    const loadSuggestions = async () => {
      if (!canEdit || !activeToken || activeToken.length < 1) {
        setSuggestions([]);
        return;
      }

      try {
        const users = await searchUsers(activeToken);
        if (!cancelled) {
          setSuggestions(users);
        }
      } catch (searchError) {
        if (!cancelled) {
          console.error("Failed to search users:", searchError);
          setSuggestions([]);
        }
      }
    };

    const timeoutId = setTimeout(loadSuggestions, 180);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeToken, canEdit]);

  if (!open) return null;

  const canToggleGuestEdit =
    canEdit && (!event || Boolean(event.allowGuestEdit));

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    setSaving(true);
    setError("");

    try {
      const startsAt = `${eventDate}T${eventTime || "00:00"}`;
      await onSave({
        title,
        description,
        startsAt: new Date(startsAt).toISOString(),
        invitedUsersText,
        allowGuestEdit,
      });
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          saveError?.message ||
          "Failed to save event.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[28px] bg-gradient-to-br from-gray-100 to-gray-200 p-6 shadow-xl"
        onClick={(eventClick) => eventClick.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold uppercase">
              {event ? (canEdit ? "Edit Event" : "Event Details") : "Create Event"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Invite users with their email inside the attendees field.
            </p>
            {event?.ownerUsername ? (
              <p className="text-sm text-gray-600 mt-2">
                Event created by: @{event.ownerUsername}
              </p>
            ) : null}
            {readOnlyMessage ? (
              <p className="text-sm text-amber-700 mt-2">{readOnlyMessage}</p>
            ) : null}
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

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(eventValue) => setTitle(eventValue.target.value)}
            className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-xl font-extrabold tracking-[0.02em] outline-none"
            placeholder="Event title"
            required
            disabled={!canEdit}
          />

          <div className="grid grid-cols-[1.3fr,0.8fr] gap-3">
            <input
              type="date"
              value={eventDate}
              onChange={(eventValue) => setEventDate(eventValue.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none"
              required
              disabled={!canEdit}
            />
            <input
              type="time"
              value={eventTime}
              onChange={(eventValue) => setEventTime(eventValue.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none"
              required
              disabled={!canEdit}
            />
          </div>

          <textarea
            value={description}
            onChange={(eventValue) => setDescription(eventValue.target.value)}
            className="w-full min-h-[120px] rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none"
            placeholder="Describe the rehearsal, meeting, or session."
            disabled={!canEdit}
          />

          <div className="relative">
            <input
              type="text"
              value={invitedUsersText}
              onChange={(eventValue) => setInvitedUsersText(eventValue.target.value)}
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 outline-none"
              placeholder="Attendees: user@email.com another@email.com"
              disabled={!canEdit}
            />

            {suggestions.length > 0 ? (
              <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
                {suggestions.map((user) => (
                  <button
                    key={user.email}
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-gray-100"
                    onClick={() => {
                      setInvitedUsersText((current) =>
                        replaceActiveToken(current, user.email),
                      );
                      setSuggestions([]);
                    }}
                  >
                    <span className="text-sm font-bold">{user.email}</span>
                    {user.fullName ? (
                      <span className="text-xs text-gray-500 ml-2">
                        {user.fullName}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-4">
            <input
              type="checkbox"
              checked={allowGuestEdit}
              onChange={(eventValue) => setAllowGuestEdit(eventValue.target.checked)}
              disabled={!canToggleGuestEdit}
            />
            <span className="text-sm">Allow invited users to edit this event too</span>
          </label>
          {event && !event.allowGuestEdit ? (
            <p className="text-xs text-gray-500">
              Guest editing was not enabled when this event was created.
            </p>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {canDelete ? (
                <button
                  type="button"
                  className="neuphormism-b-btn-red px-4 py-3 text-xs font-bold uppercase text-white"
                  onClick={() => onDelete?.(event)}
                >
                  Delete
                </button>
              ) : null}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="neuphormism-b-btn px-4 py-3 text-xs font-bold uppercase"
                onClick={onClose}
              >
                {canEdit ? "Cancel" : "Close"}
              </button>
              {canEdit ? (
                <button
                  type="submit"
                  className="neuphormism-b-btn-gold px-4 py-3 text-xs font-bold uppercase"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Event"}
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
