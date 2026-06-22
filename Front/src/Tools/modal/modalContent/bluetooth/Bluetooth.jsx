import React, { useEffect, useMemo, useState } from "react";
import { useBluetooth } from "../../../../contexts/BluetoothContext";

const TABS = [
  { id: "connection", label: "Connection" },
  { id: "mapping", label: "Mapping" },
  { id: "logs", label: "Logs" },
];

const panelClassName = "rounded-[20px] neuphormism-b bg-[#ececec] p-4";
const actionButtonClassName =
  "neuphormism-b-btn rounded-[14px] px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] text-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45";

export default function Bluetooth() {
  const {
    support,
    activeSource,
    setActiveSource,
    autoReconnect,
    setAutoReconnect,
    last,
    logs,
    clearLogs,
    controls,
    clearControls,
    setRowAction,
    ACTIONS,
    connectBLE,
    disconnectBLE,
    bleConnected,
  } = useBluetooth();

  const [activeTab, setActiveTab] = useState("connection");
  const [activeControlId, setActiveControlId] = useState("");
  const [learningAction, setLearningAction] = useState("");
  const [learningBaseline, setLearningBaseline] = useState("");
  const controlsList = useMemo(
    () => Object.entries(controls).sort(([a], [b]) => a.localeCompare(b)),
    [controls],
  );
  const fixedActions = useMemo(
    () => ACTIONS.filter((action) => action.value !== "none"),
    [ACTIONS],
  );

  useEffect(() => {
    if (!last.key || last.key === "—") return undefined;

    setActiveControlId(last.key);
    const timeoutId = window.setTimeout(() => {
      setActiveControlId("");
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [last.bytes, last.key, last.time]);

  useEffect(() => {
    if (!learningAction || !last.key || last.key === "—") return;
    const eventSignature = `${last.key}|${last.bytes}|${last.time}`;
    if (eventSignature === learningBaseline) return;
    if (!controls[last.key]) return;

    setRowAction(last.key, learningAction);
    setLearningAction("");
    setLearningBaseline("");
  }, [
    controls,
    last.bytes,
    last.key,
    last.time,
    learningAction,
    learningBaseline,
    setRowAction,
  ]);

  const startLearningAction = (actionValue) => {
    setLearningAction((current) => {
      if (current === actionValue) {
        setLearningBaseline("");
        return "";
      }
      setLearningBaseline(`${last.key}|${last.bytes}|${last.time}`);
      return actionValue;
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-[#ececec] text-black">
      <header className="flex shrink-0 flex-col gap-3 border-b border-black/5 px-3 pb-4 md:px-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[goldenrod]">
            Footswitch
          </p>
          <h2 className="mt-1 text-2xl font-black uppercase leading-none">
            Bluetooth &amp; MIDI
          </h2>
        </div>

        <nav
          className="grid grid-cols-3 gap-2 rounded-[18px] neuphormism-b-se p-1"
          aria-label="Bluetooth settings sections"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-[14px] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition active:scale-[0.98] ${
                  selected
                    ? "neuphormism-b-btn-gold text-black"
                    : "text-gray-500 hover:text-black"
                }`}
                aria-pressed={selected}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-3 py-4 md:px-4">
        {activeTab === "connection" ? (
          <ConnectionTab
            activeSource={activeSource}
            autoReconnect={autoReconnect}
            bleConnected={bleConnected}
            connectBLE={connectBLE}
            disconnectBLE={disconnectBLE}
            setActiveSource={setActiveSource}
            setAutoReconnect={setAutoReconnect}
            support={support}
          />
        ) : null}

        {activeTab === "mapping" ? (
          <MappingTab
            activeControlId={activeControlId}
            clearControls={clearControls}
            controlsList={controlsList}
            fixedActions={fixedActions}
            last={last}
            learningAction={learningAction}
            setLearningAction={startLearningAction}
            setRowAction={setRowAction}
          />
        ) : null}

        {activeTab === "logs" ? (
          <LogsTab clearLogs={clearLogs} logs={logs} />
        ) : null}
      </div>
    </div>
  );
}

function ConnectionTab({
  activeSource,
  autoReconnect,
  bleConnected,
  connectBLE,
  disconnectBLE,
  setActiveSource,
  setAutoReconnect,
  support,
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <section className={panelClassName}>
        <SectionHeader
          eyebrow="Browser"
          title="Support"
          copy="Chrome and Edge can connect BLE MIDI devices directly. Web MIDI covers devices exposed by the operating system."
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SupportTile label="Web Bluetooth" ok={support.bt} />
          <SupportTile label="Web MIDI" ok={support.midi} />
        </div>

      </section>

      <section className={panelClassName}>
        <SectionHeader
          eyebrow="Device"
          title="Connection"
          copy="Pair the footswitch, choose the event source, then press each pedal in Mapping."
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={connectBLE}
            className={actionButtonClassName}
          >
            Connect
          </button>
          <button
            type="button"
            onClick={disconnectBLE}
            disabled={!bleConnected}
            className={`${actionButtonClassName} ${
              bleConnected ? "text-red-700" : ""
            }`}
          >
            Disconnect
          </button>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
              bleConnected
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {bleConnected ? "BLE connected" : "BLE idle"}
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <SourceOption
            checked={activeSource === "BLE"}
            label="BLE"
            meta="Web Bluetooth"
            name="src"
            onChange={() => setActiveSource("BLE")}
          />
          <SourceOption
            checked={activeSource === "MIDI"}
            label="MIDI"
            meta="Web MIDI / OS"
            name="src"
            onChange={() => setActiveSource("MIDI")}
          />
        </div>

        <label className="mt-4 flex items-center justify-between gap-4 rounded-[16px] neuphormism-b-se px-4 py-3">
          <span>
            <span className="block text-sm font-black">Auto-reconnect BLE</span>
            <span className="block text-xs font-semibold text-gray-500">
              Reconnects when the browser still has permission for the device.
            </span>
          </span>
          <input
            type="checkbox"
            checked={autoReconnect}
            onChange={(event) => setAutoReconnect(event.target.checked)}
            className="h-5 w-5 accent-[goldenrod]"
          />
        </label>
      </section>
    </div>
  );
}

function MappingTab({
  activeControlId,
  clearControls,
  controlsList,
  fixedActions,
  last,
  learningAction,
  setLearningAction,
  setRowAction,
}) {
  const actionAssignments = useMemo(() => {
    return fixedActions.reduce((acc, action) => {
      const assignment = controlsList.find(([, meta]) => meta.action === action.value);
      acc[action.value] = assignment
        ? { controlId: assignment[0], meta: assignment[1] }
        : null;
      return acc;
    }, {});
  }, [controlsList, fixedActions]);

  return (
    <section className={panelClassName}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Controls"
          title="Detected & Mapping"
          copy="Press each footswitch button, then assign one of the fixed presentation actions."
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Chip>{controlsList.length} detected</Chip>
          <button
            type="button"
            onClick={clearControls}
            disabled={controlsList.length === 0}
            className={`${actionButtonClassName} text-red-700`}
          >
            Clear detected controls
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[16px] neuphormism-b-se p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
          Last event
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Led on={Boolean(activeControlId)} />
          <Chip>{last.source}</Chip>
          <Chip>{last.key}</Chip>
          <span className="font-mono text-gray-600">{last.bytes}</span>
          <span className="font-mono text-gray-500">{last.time}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {fixedActions.map((action) => {
          const assignment = actionAssignments[action.value];
          const assignedControlId = assignment?.controlId || "";
          const isLearning = learningAction === action.value;
          const isPressed = Boolean(
            assignedControlId && activeControlId === assignedControlId,
          );

          return (
            <div
              key={action.value}
              role="button"
              tabIndex={0}
              onClick={() => setLearningAction(action.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setLearningAction(action.value);
              }}
              className={`min-h-[8.4rem] rounded-[18px] px-4 py-4 text-left transition active:scale-[0.99] ${
                isLearning
                  ? "neuphormism-b-btn-gold"
                  : "neuphormism-b-se hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
              } ${isPressed ? "ring-2 ring-[goldenrod]" : ""}`}
              aria-pressed={isLearning ? "true" : "false"}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                    Function
                  </p>
                  <h4 className="mt-1 text-sm font-black uppercase leading-tight">
                    {action.label}
                  </h4>
                </div>
                <span
                  className={`mt-1 h-3 w-3 shrink-0 rounded-full border transition ${
                    isPressed
                      ? "border-[goldenrod] bg-[goldenrod] shadow-[0_0_0_7px_rgba(218,165,32,0.2)]"
                      : assignedControlId
                        ? "border-emerald-600 bg-emerald-500"
                        : "border-gray-300 bg-gray-100"
                  }`}
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 rounded-[14px] bg-white/60 px-3 py-2">
                {isLearning ? (
                  <p className="text-xs font-black uppercase tracking-[0.1em] text-black">
                    Press a controller button
                  </p>
                ) : assignedControlId ? (
                  <>
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
                      Assigned to
                    </p>
                    <p
                      className="mt-1 truncate font-mono text-xs font-bold"
                      title={assignedControlId}
                    >
                      {assignedControlId}
                    </p>
                  </>
                ) : (
                  <p className="text-xs font-bold text-gray-500">
                    Click here, then press a controller button.
                  </p>
                )}
              </div>

              {assignedControlId ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setRowAction(assignedControlId, "none");
                    if (learningAction === action.value) setLearningAction("");
                  }}
                  className="mt-3 inline-flex rounded-[12px] bg-white/70 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-red-700"
                >
                  Clear assignment
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 max-h-[34vh] overflow-auto rounded-[18px] border border-black/5 bg-white/40">
        <table className="w-full min-w-[880px] border-collapse">
          <thead className="sticky top-0 z-10 bg-[#e8e8e8]">
            <tr className="text-left text-[11px] font-black uppercase tracking-[0.12em] text-gray-500">
              <th className="w-12 px-4 py-3">On</th>
              <th className="px-4 py-3">Control ID</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Channel / Info</th>
              <th className="px-4 py-3">Last Value</th>
              <th className="px-4 py-3">Assigned Function</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {controlsList.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>
                  No controls detected yet.
                </td>
              </tr>
            ) : (
              controlsList.map(([id, meta]) => {
                const isActive = activeControlId === id;
                return (
                  <tr
                    key={id}
                    className={`border-t border-black/5 transition-colors ${
                      isActive ? "bg-[rgba(218,165,32,0.13)]" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`block h-3 w-3 rounded-full border transition ${
                          isActive
                            ? "border-[goldenrod] bg-[goldenrod] shadow-[0_0_0_6px_rgba(218,165,32,0.18)]"
                            : "border-gray-300 bg-gray-100"
                        }`}
                        aria-label={isActive ? "Pressed" : "Idle"}
                      />
                    </td>
                    <td className="max-w-[24rem] px-4 py-3 font-mono text-xs">
                      <span className="block truncate" title={id}>
                        {id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Chip>{meta.source}</Chip>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {meta.info}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {meta.lastValue}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex min-w-[10rem] rounded-full bg-white/80 px-3 py-2 text-xs font-black">
                        {fixedActions.find(
                          (action) => action.value === meta.action,
                        )?.label || "(nenhuma)"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LogsTab({ clearLogs, logs }) {
  return (
    <section className={panelClassName}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeader
          eyebrow="Events"
          title="Logs"
          copy="Use this when pairing or checking whether each footswitch button is sending the expected event."
        />
        <button
          type="button"
          onClick={clearLogs}
          disabled={logs.length === 0}
          className={actionButtonClassName}
        >
          Clear logs
        </button>
      </div>

      <div className="mt-4 max-h-[58vh] overflow-auto rounded-[18px] bg-[#101010] p-4 font-mono text-xs font-bold leading-6 text-[#f5d47a] shadow-inner">
        {logs.length === 0 ? (
          <div className="text-gray-400">No logs yet.</div>
        ) : (
          logs.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)
        )}
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[goldenrod]">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-lg font-black uppercase leading-tight">
        {title}
      </h3>
      {copy ? (
        <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-gray-500">
          {copy}
        </p>
      ) : null}
    </div>
  );
}

function SupportTile({ label, ok }) {
  return (
    <div className="rounded-[16px] neuphormism-b-se px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-gray-500">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Led on={ok} />
        <span
          className={`text-sm font-black ${ok ? "text-emerald-700" : "text-red-700"}`}
        >
          {ok ? "Available" : "Unavailable"}
        </span>
      </div>
    </div>
  );
}

function SourceOption({ checked, label, meta, name, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-[16px] px-4 py-3 transition ${
        checked ? "neuphormism-b-btn-gold" : "neuphormism-b-se"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-[goldenrod]"
      />
      <span>
        <span className="block text-sm font-black uppercase">{label}</span>
        <span className="block text-xs font-semibold text-gray-600">
          {meta}
        </span>
      </span>
    </label>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-gray-700">
      {children}
    </span>
  );
}

function Led({ on }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full border ${
        on ? "border-emerald-600 bg-emerald-500" : "border-red-700 bg-red-500"
      }`}
      aria-hidden="true"
    />
  );
}
