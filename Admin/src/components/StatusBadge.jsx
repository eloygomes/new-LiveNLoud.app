export function StatusBadge({ status }) {
  return <span className={`status-badge ${status || "unknown"}`}>{status || "unknown"}</span>;
}
