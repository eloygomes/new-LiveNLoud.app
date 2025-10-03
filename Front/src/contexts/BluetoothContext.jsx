import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ============================ Constantes ============================ */
const MIDI_SERVICE = "03b80e5a-ede8-4b33-a751-6ce34ec4c700";
const MIDI_CHAR = "7772e5db-3868-4112-a1a9-f2669d106bf3";
const SOURCE = { BLE: "BLE", MIDI: "MIDI" };

const ACTIONS = [
  { value: "none", label: "(nenhuma)" },
  { value: "arrowUp", label: "Seta ↑" },
  { value: "arrowDown", label: "Seta ↓" },
  { value: "pageUp", label: "Page Up" },
  { value: "pageDown", label: "Page Down" },
];

const LS = {
  actions: "footswitch_actions_v1",
  autoRec: "footswitch_autoReconnect_v1",
  source: "footswitch_source_v1",
};

/* ============================ Helpers ============================ */
const hasWindow = typeof window !== "undefined";

const loadJSON = (k, def) => {
  if (!hasWindow) return def;
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
};
const saveJSON = (k, v) => {
  if (hasWindow) localStorage.setItem(k, JSON.stringify(v));
};
const now = () => new Date().toLocaleTimeString();

/* ================= Scroll global (site inteiro) =================== */
/** Encontra o alvo de scroll da página atual. */
function getScrollTarget() {
  // 1) Marcador explícito
  const explicit = document.querySelector('[data-scroll-root="true"]');
  if (explicit) return explicit;

  // 2) Documento rola?
  const se =
    document.scrollingElement || document.documentElement || document.body;
  const canWindowScroll = se.scrollHeight - se.clientHeight > 0;
  if (canWindowScroll) return window;

  // 3) Fallback — procura o melhor candidato
  const candidates = Array.from(
    document.querySelectorAll(
      '#root, main, [role="main"], [data-app-scroll], .overflow-auto, .overflow-y-auto'
    )
  );
  let best = null,
    bestRoom = 0;
  for (const el of candidates) {
    const room = el.scrollHeight - el.clientHeight;
    if (room > bestRoom) {
      bestRoom = room;
      best = el;
    }
  }
  return best || window;
}

/** Executa a ação de navegação/scroll (sempre no alvo atual) */
function runGlobalAction(action) {
  const target = getScrollTarget();
  const h =
    target === window
      ? document.scrollingElement?.clientHeight || window.innerHeight
      : target.clientHeight;

  const doScroll = (dy) =>
    target === window
      ? window.scrollBy({ top: dy, behavior: "smooth" })
      : target.scrollBy({ top: dy, behavior: "smooth" });

  switch (action) {
    case "arrowUp":
      doScroll(-60);
      break;
    case "arrowDown":
      doScroll(60);
      break;
    case "pageUp":
      doScroll(-h * 0.9);
      break;
    case "pageDown":
      doScroll(h * 0.9);
      break;
    default:
      break;
  }
}

/* ============================ Contexto ============================ */
const BluetoothContext = createContext(null);
export function useBluetooth() {
  return useContext(BluetoothContext);
}

export function BluetoothProvider({ children }) {
  /* Suporte do navegador */
  const support = useMemo(
    () => ({
      bt: hasWindow && "bluetooth" in navigator,
      midi: hasWindow && typeof navigator.requestMIDIAccess === "function",
    }),
    []
  );

  /* Logs */
  const [logs, setLogs] = useState([]);
  const logsRef = useRef([]);
  const log = (...parts) => {
    const line = `[${now()}] ${parts.join(" ")}`;
    console.log(line);
    logsRef.current = [...logsRef.current, line].slice(-500);
    setLogs(logsRef.current);
  };

  /* Preferências */
  const [activeSource, setActiveSource] = useState(
    loadJSON(LS.source, SOURCE.MIDI)
  );
  useEffect(() => {
    saveJSON(LS.source, activeSource);
    log("Fonte ativa:", activeSource);
  }, [activeSource]);

  const [autoReconnect, setAutoReconnect] = useState(
    loadJSON(LS.autoRec, true)
  );
  useEffect(() => {
    saveJSON(LS.autoRec, autoReconnect);
    log("Auto-reconnect BLE:", autoReconnect ? "ON" : "OFF");
  }, [autoReconnect]);

  /* Último evento */
  const [last, setLast] = useState({
    source: "—",
    key: "—",
    bytes: "—",
    time: "—",
  });

  /* Mapeamentos */
  const [controls, setControls] = useState(() => loadJSON(LS.actions, {})); // { id: { source, info, lastValue, action } }
  const controlsRef = useRef(controls);
  useEffect(() => {
    controlsRef.current = controls;
    saveJSON(LS.actions, controls);
  }, [controls]);

  // Se alternar para MIDI, limpamos a tabela para evitar confusão
  useEffect(() => {
    if (activeSource === SOURCE.MIDI) clearControls();
  }, [activeSource]);

  const ensureRow = (controlId, meta) => {
    setControls((prev) => {
      const row = prev[controlId];
      if (row) {
        return {
          ...prev,
          [controlId]: {
            ...row,
            source: meta.source ?? row.source,
            info: meta.info ?? row.info,
          },
        };
      }
      return {
        ...prev,
        [controlId]: {
          source: meta.source,
          info: meta.info ?? "-",
          lastValue: "-",
          action: row?.action ?? "none",
        },
      };
    });
  };
  const updateRowValue = (controlId, lastValue) =>
    setControls((prev) => ({
      ...prev,
      [controlId]: { ...(prev[controlId] || {}), lastValue },
    }));
  const setRowAction = (controlId, action) => {
    log("Map:", controlId, "→", action);
    setControls((prev) => ({
      ...prev,
      [controlId]: { ...(prev[controlId] || {}), action },
    }));
  };

  /* ============ Garante um root de scroll se o Layout não marcar ============ */
  useEffect(() => {
    const already = document.querySelector('[data-scroll-root="true"]');
    if (already) return;

    const main =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.getElementById("root") ||
      document.body;

    main.setAttribute("data-scroll-root", "true");

    if (main !== document.body) {
      const prevOverflow = main.style.overflow;
      const computed = getComputedStyle(main).overflowY;
      if (!/auto|scroll/i.test(computed)) {
        main.style.overflow = "auto";
      }
      return () => {
        if (main.getAttribute("data-scroll-root") === "true") {
          main.removeAttribute("data-scroll-root");
        }
        if (prevOverflow !== main.style.overflow) {
          main.style.overflow = prevOverflow;
        }
      };
    }

    return () => {
      if (main.getAttribute("data-scroll-root") === "true") {
        main.removeAttribute("data-scroll-root");
      }
    };
  }, []);

  /* =========================== MIDI (via sistema) =========================== */
  const midiAccessRef = useRef(null);
  useEffect(() => {
    if (!support.midi) return;
    let cancelled = false;

    navigator
      .requestMIDIAccess()
      .then((access) => {
        if (cancelled) return;
        midiAccessRef.current = access;
        for (const input of access.inputs.values()) {
          log("MIDI IN:", input.name);
          input.onmidimessage = (msg) => {
            if (activeSource !== SOURCE.MIDI) return;
            const [status, d1, d2] = msg.data;
            const st = status & 0xf0,
              ch = (status & 0x0f) + 1;
            if (st === 0xc0) emitPC("MIDI", ch, d1);
            else if (st === 0xb0) emitCC("MIDI", ch, d1, d2);
            else if (st === 0x90) emitNO("MIDI", ch, d1, d2);
            else if (st === 0x80) emitNF("MIDI", ch, d1, d2);
          };
        }
      })
      .catch((e) => log("Web MIDI erro:", e?.message || e));

    return () => {
      cancelled = true;
      try {
        const access = midiAccessRef.current;
        if (access?.inputs)
          for (const input of access.inputs.values())
            input.onmidimessage = null;
        midiAccessRef.current = null;
      } catch (e) {
        console.warn("Cleanup MIDI falhou:", e);
      }
    };
  }, [support.midi, activeSource]);

  /* ========================== BLE (Web Bluetooth) ========================== */
  const bleDeviceRef = useRef(null);
  const bleCharRef = useRef(null);
  const manualDisconnectRef = useRef(false);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_BACKOFF_MS = 30000;

  // >>> Ajuste fino: bleConnected como STATE para re-render
  const [bleConnected, setBleConnected] = useState(false);

  async function connectBLE() {
    if (!support.bt) return log("Web Bluetooth não suportado.");
    try {
      log("Abrindo seletor BLE…");
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [MIDI_SERVICE],
      });
      await setupBLE(device);
    } catch (e) {
      log("BLE: requestDevice cancelado/erro:", e?.message || e);
    }
  }

  const clearControls = () => {
    setControls({});
    saveJSON(LS.actions, {});
    log("Controles resetados (nova conexão).");
  };

  async function setupBLE(device) {
    bleDeviceRef.current = device;
    manualDisconnectRef.current = false;

    clearControls();

    device.addEventListener("gattserverdisconnected", onGattDisconnected);
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(MIDI_SERVICE);
    const char = await service.getCharacteristic(MIDI_CHAR);

    bleCharRef.current = char;
    await char.startNotifications();
    char.addEventListener("characteristicvaluechanged", onBleNotify);

    reconnectAttemptsRef.current = 0;
    setLast({
      source: "BLE",
      key: device.name || device.id,
      bytes: "connected",
      time: now(),
    });
    setBleConnected(true); // <<< update state
    log("BLE conectado:", device.name || device.id);

    setActiveSource(SOURCE.BLE);
  }

  function onGattDisconnected() {
    const name = bleDeviceRef.current?.name || "device";
    setLast({ source: "BLE", key: name, bytes: "disconnected", time: now() });
    setBleConnected(false); // <<< update state
    log("BLE desconectado:", name);
    if (!manualDisconnectRef.current && autoReconnect) scheduleReconnect();
  }

  function scheduleReconnect() {
    if (!bleDeviceRef.current || !autoReconnect) return;
    const delay = Math.min(
      500 * Math.pow(2, reconnectAttemptsRef.current),
      MAX_BACKOFF_MS
    );
    reconnectAttemptsRef.current += 1;
    log(
      `Reconnecting BLE em ${Math.round(delay)}ms (tentativa ${
        reconnectAttemptsRef.current
      })…`
    );
    reconnectTimerRef.current = setTimeout(async () => {
      try {
        await reconnectBLE();
      } catch (e) {
        log("Falha reconectar:", e?.message || e);
        scheduleReconnect();
      }
    }, delay);
  }

  async function reconnectBLE() {
    const device = bleDeviceRef.current;
    if (!device || device.gatt.connected) return;
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(MIDI_SERVICE);
    const char = await service.getCharacteristic(MIDI_CHAR);
    bleCharRef.current = char;
    await char.startNotifications();
    char.addEventListener("characteristicvaluechanged", onBleNotify);

    reconnectAttemptsRef.current = 0;
    setLast({
      source: "BLE",
      key: device.name || device.id,
      bytes: "reconnected",
      time: now(),
    });
    setBleConnected(true); // <<< update state
    log("BLE reconectado:", device.name || device.id);
  }

  function disconnectBLE() {
    manualDisconnectRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    try {
      bleCharRef.current?.removeEventListener(
        "characteristicvaluechanged",
        onBleNotify
      );
    } catch {}
    try {
      if (bleDeviceRef.current?.gatt?.connected)
        bleDeviceRef.current.gatt.disconnect();
    } catch {}
    log("BLE: desconexão manual.");
    setLast({
      source: "BLE",
      key: bleDeviceRef.current?.name || "device",
      bytes: "disconnected (manual)",
      time: now(),
    });
    setBleConnected(false); // <<< update state
    bleDeviceRef.current = null;
    bleCharRef.current = null;
    reconnectAttemptsRef.current = 0;
  }

  function onBleNotify(e) {
    if (activeSource !== SOURCE.BLE) return;
    const b = new Uint8Array(e.target.value.buffer);
    let i = 0;
    while (i < b.length) {
      const x = b[i];
      if (x >= 0x80 && x <= 0xbf) {
        i++;
        continue; // timestamp BLE-MIDI
      }
      if (x >= 0x80) {
        const st = x & 0xf0,
          ch = (x & 0x0f) + 1;
        if (st === 0xc0 && i + 1 < b.length) {
          emitPC("BLE", ch, b[i + 1]);
          i += 2;
          continue;
        }
        if (st === 0xb0 && i + 2 < b.length) {
          emitCC("BLE", ch, b[i + 1], b[i + 2]);
          i += 3;
          continue;
        }
        if (st === 0x90 && i + 2 < b.length) {
          emitNO("BLE", ch, b[i + 1], b[i + 2]);
          i += 3;
          continue;
        }
        if (st === 0x80 && i + 2 < b.length) {
          emitNF("BLE", ch, b[i + 1], b[i + 2]);
          i += 3;
          continue;
        }
      }
      i++;
    }
  }

  /* ============= Emissores unificados + despacho de ação ============= */
  function emitPC(source, ch, pc) {
    handleControl({
      controlId: `${source}:PC:ch${ch}:${pc}`,
      source,
      info: `Program Change ch${ch}`,
      lastValue: `pc=${pc}`,
    });
  }
  function emitCC(source, ch, cc, val) {
    handleControl({
      controlId: `${source}:CC:ch${ch}:${cc}`,
      source,
      info: `CC ch${ch}`,
      lastValue: `cc=${cc} val=${val}`,
    });
  }
  function emitNO(source, ch, note, vel) {
    handleControl({
      controlId: `${source}:NOTE:ch${ch}:${note}`,
      source,
      info: `Note On ch${ch}`,
      lastValue: `note=${note} vel=${vel}`,
    });
  }
  function emitNF(source, ch, note, vel) {
    handleControl({
      controlId: `${source}:NOTE:ch${ch}:${note}`,
      source,
      info: `Note Off ch${ch}`,
      lastValue: `note=${note} vel=${vel}`,
    });
  }

  function handleControl({ controlId, source, info, lastValue }) {
    ensureRow(controlId, { source, info });
    updateRowValue(controlId, lastValue);
    setLast({ source, key: controlId, bytes: lastValue, time: now() });
    log("Evento", source, "→", controlId, "|", lastValue);

    const action = controlsRef.current?.[controlId]?.action ?? "none";
    if (action !== "none") {
      runGlobalAction(action);
      log("Ação executada:", action);
    } else {
      log("Ação não mapeada para", controlId);
    }
  }

  /* =============================== Expose =============================== */
  const value = {
    support,
    activeSource,
    setActiveSource,
    autoReconnect,
    setAutoReconnect,
    last,
    logs,
    clearLogs: () => {
      logsRef.current = [];
      setLogs([]);
      log("Logs limpos.");
    },
    controls,
    setRowAction,
    ACTIONS,
    connectBLE,
    disconnectBLE,
    bleConnected,
  };

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}
