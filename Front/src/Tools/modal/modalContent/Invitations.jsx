import { useEffect, useMemo, useState } from "react";
import {
  createInvitation,
  fetchCurrentUserProfile,
  fetchInvitations,
  revokeFriendship,
  respondToInvitation,
} from "../../../Tools/Controllers";
import { formatDisplayDateTime } from "../../../Tools/dateFormat";

function InvitationCard({ invitation, isIncoming, onRespond }) {
  return (
    <div className="neuphormism-b mt-4 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold uppercase">
            {isIncoming
              ? `From @${invitation.senderUsername}`
              : `To @${invitation.receiverUsername}`}
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            {invitation.message || "No message attached."}
          </p>
          <p className="text-[11px] text-gray-500 mt-2">
            {formatDisplayDateTime(invitation.createdAt)}
          </p>
        </div>
        <span className="text-[11px] font-semibold uppercase px-2 py-1 rounded-full bg-white">
          {invitation.status}
        </span>
      </div>

      {isIncoming && invitation.status === "pending" ? (
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            className="neuphormism-b-btn-gold px-4 py-2 text-xs"
            onClick={() => onRespond(invitation._id, "accepted")}
          >
            Accept
          </button>
          <button
            type="button"
            className="neuphormism-b-btn px-4 py-2 text-xs"
            onClick={() => onRespond(invitation._id, "declined")}
          >
            Decline
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function Invitations() {
  const [profile, setProfile] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [revokingEmail, setRevokingEmail] = useState("");

  const loadInvitations = async () => {
    setLoading(true);
    setError("");

    try {
      const [me, invites] = await Promise.all([
        fetchCurrentUserProfile(),
        fetchInvitations(),
      ]);
      setProfile(me);
      setInvitations(invites);
    } catch (loadError) {
      setError(
        loadError?.response?.data?.message ||
          loadError?.message ||
          "Failed to load invitations.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitations();
  }, []);

  const incomingInvitations = useMemo(() => {
    if (!profile?.email) return [];
    return invitations.filter(
      (invitation) =>
        invitation.receiverEmail === profile.email &&
        invitation.status === "pending",
    );
  }, [invitations, profile]);

  const sentInvitations = useMemo(() => {
    if (!profile?.email) return [];
    return invitations.filter(
      (invitation) =>
        invitation.senderEmail === profile.email &&
        invitation.status === "pending",
    );
  }, [invitations, profile]);

  const friends = useMemo(() => {
    return Array.isArray(profile?.acceptedInvitations)
      ? [...profile.acceptedInvitations].sort((left, right) =>
          String(left?.counterpartEmail || "").localeCompare(
            String(right?.counterpartEmail || ""),
          ),
        )
      : [];
  }, [profile]);

  const handleInvite = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFeedback("");

    try {
      await createInvitation({ identifier, message });
      setIdentifier("");
      setMessage("");
      setFeedback("Friend request sent.");
      await loadInvitations();
    } catch (inviteError) {
      setError(
        inviteError?.response?.data?.message ||
          inviteError?.message ||
          "Failed to send invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (invitationId, status) => {
    setError("");
    setFeedback("");

    try {
      await respondToInvitation(invitationId, status);
      setFeedback(`Friend request ${status}.`);
      await loadInvitations();
    } catch (respondError) {
      setError(
        respondError?.response?.data?.message ||
          respondError?.message ||
          "Failed to update invitation.",
      );
    }
  };

  const handleRevokeFriendship = async (counterpartEmail) => {
    setError("");
    setFeedback("");
    setRevokingEmail(counterpartEmail);

    try {
      await revokeFriendship(counterpartEmail);
      setFeedback(`Friendship revoked with ${counterpartEmail}.`);
      await loadInvitations();
    } catch (revokeError) {
      setError(
        revokeError?.response?.data?.message ||
          revokeError?.message ||
          "Failed to revoke friendship.",
      );
    } finally {
      setRevokingEmail("");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
      <div className="neuphormism-b mt-5 p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-md font-bold mb-2">Friends</h2>
            <p className="text-[10pt]">
              Send a friendship invite by email.
            </p>
            <p className="text-[8pt]">
              Calendar invites are only allowed between accepted friends.
            </p>
          </div>
        </div>

        <form className="mt-5 grid grid-cols-1 xl:grid-cols-[1.2fr,1fr,auto] gap-3" onSubmit={handleInvite}>
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none"
            placeholder="user@email.com"
            disabled={submitting}
          />
          <input
            type="text"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none"
            placeholder="Optional message"
            disabled={submitting}
          />
          <button
            type="submit"
            className="neuphormism-b-btn-gold px-5 py-3 text-xs font-bold uppercase"
            disabled={submitting || !identifier.trim()}
          >
            {submitting ? "Sending..." : "Add Friend"}
          </button>
        </form>

        {feedback ? <p className="text-xs text-green-700 mt-3">{feedback}</p> : null}
        {error ? <p className="text-xs text-red-600 mt-3">{error}</p> : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-5">
        <div className="neuphormism-b p-5">
          <h2 className="text-md font-bold">Pending Requests</h2>
          <p className="text-[8pt] mt-1">Friend requests waiting for your decision.</p>
          {loading ? <p className="text-sm mt-4">Loading invitations...</p> : null}
          {!loading && incomingInvitations.length === 0 ? (
            <p className="text-sm mt-4">No pending friend requests.</p>
          ) : null}
          {!loading
            ? incomingInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation._id}
                  invitation={invitation}
                  isIncoming
                  onRespond={handleRespond}
                />
              ))
            : null}
        </div>

        <div className="neuphormism-b p-5">
          <h2 className="text-md font-bold">Sent Requests</h2>
          <p className="text-[8pt] mt-1">Friend invites you already sent.</p>
          {loading ? <p className="text-sm mt-4">Loading invitations...</p> : null}
          {!loading && sentInvitations.length === 0 ? (
            <p className="text-sm mt-4">No sent friend requests yet.</p>
          ) : null}
          {!loading
            ? sentInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation._id}
                  invitation={invitation}
                  isIncoming={false}
                  onRespond={handleRespond}
                />
              ))
            : null}
        </div>
      </div>

      <div className="neuphormism-b p-5 mt-5">
        <h2 className="text-md font-bold">Actual Friends</h2>
        <p className="text-[8pt] mt-1">
          Accepted friendships. These users can be invited to calendar events.
        </p>
        {loading ? <p className="text-sm mt-4">Loading friends...</p> : null}
        {!loading && friends.length === 0 ? (
          <p className="text-sm mt-4">No friends yet.</p>
        ) : null}
        {!loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            {friends.map((friend) => (
              <div
                key={`${friend.counterpartEmail}-${friend.invitationId}`}
                className="rounded-2xl bg-white p-4"
              >
                <div className="text-sm font-bold break-all">
                  {friend.counterpartEmail}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  @{friend.counterpartUsername || "user"}
                </div>
                {friend.counterpartFullName ? (
                  <div className="text-xs text-gray-500 mt-1">
                    {friend.counterpartFullName}
                  </div>
                ) : null}
                <div className="text-[11px] text-gray-500 mt-3">
                  Friends since {formatDisplayDateTime(friend.acceptedAt)}
                </div>
                <button
                  type="button"
                  className="mt-4 neuphormism-b-btn-red px-4 py-2 text-[11px] font-bold uppercase text-white"
                  onClick={() => handleRevokeFriendship(friend.counterpartEmail)}
                  disabled={revokingEmail === friend.counterpartEmail}
                >
                  {revokingEmail === friend.counterpartEmail
                    ? "Revoking..."
                    : "Revoke Friendship"}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
}
