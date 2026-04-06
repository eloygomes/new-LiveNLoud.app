import { useEffect, useMemo, useState } from "react";
import { fetchCurrentUserProfile, fetchUserLogs } from "../../../Tools/Controllers";

function formatLogDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadLogs = async () => {
      setLoading(true);
      setError("");

      try {
        const [me, nextLogs] = await Promise.all([
          fetchCurrentUserProfile(),
          fetchUserLogs(),
        ]);
        if (!mounted) return;
        setProfile(me);
        setLogs(nextLogs);
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError?.response?.data?.message ||
            loadError?.message ||
            "Failed to load logs.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadLogs();
    return () => {
      mounted = false;
    };
  }, []);

  const latestLog = logs[0];
  const summary = useMemo(
    () => [
      {
        label: "Total Actions",
        value: String(logs.length),
      },
      {
        label: "Last Action",
        value: latestLog ? formatLogDate(latestLog.createdAt) : "No actions",
      },
      {
        label: "Friends",
        value: String(profile?.acceptedInvitations?.length || 0),
      },
    ],
    [latestLog, logs.length, profile],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto pr-2">
        <div className="neuphormism-b mt-5 p-5">
          <h2 className="text-xl font-bold uppercase">Activity Logs</h2>
          <p className="text-sm text-gray-600 mt-2">
            Plain text history for calendar, friendship, song, and playback actions.
          </p>
          {error ? <p className="text-sm text-red-600 mt-3">{error}</p> : null}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-5">
          {summary.map((item) => (
            <div key={item.label} className="neuphormism-b p-5">
              <div className="text-[11px] font-bold uppercase text-gray-500">
                {item.label}
              </div>
              <div className="text-lg font-extrabold mt-3 break-words">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="neuphormism-b mt-5 p-5">
          <h3 className="text-md font-bold uppercase">User Feed</h3>
          <p className="text-[11px] text-gray-500 mt-1">
            One action per line, newest first.
          </p>

          <div className="mt-4 rounded-3xl bg-[#171717] p-4 text-[#f2f2f2]">
            {loading ? (
              <div className="text-sm text-gray-300">Loading logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-sm text-gray-400">No logs yet.</div>
            ) : (
              <div className="max-h-[24rem] overflow-y-auto space-y-2 pr-1">
                {logs.map((log) => (
                  <div
                    key={log._id}
                    className="rounded-2xl bg-white/5 px-4 py-3 font-mono text-[12px] leading-5"
                  >
                    <span className="text-[goldenrod]">
                      [{formatLogDate(log.createdAt)}]
                    </span>{" "}
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
