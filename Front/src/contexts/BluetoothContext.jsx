import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getRegisteredScrollViewport } from "../Pages/Presentation/presentationScrollController";
import { setLocalStorageJsonSafe } from "../Tools/storageSafe";

/* ============================ Constantes ============================ */
const MIDI_SERVICE = "03b80e5a-ede8-4b33-a751-6ce34ec4c700";
const MIDI_CHAR = "7772e5db-3868-4112-a1a9-f2669d106bf3";
const SOURCE = { BLE: "BLE", MIDI: "MIDI" };

const ACTIONS = [
  { value: "none", label: "(nenhuma)" },
  { value: "back", label: "Voltar (segurar 2s)" },
  { value: "arrowLeft", label: "Seta ←" },
  { value: "arrowRight", label: "Seta →" },
  { value: "enter", label: "Entrar (segurar 2s)" },
  { value: "arrowUp", label: "Seta ↑" },
  { value: "arrowDown", label: "Seta ↓" },
  { value: "pageUp", label: "Page Up" },
  { value: "pageDown", label: "Page Down" },
];

const LONG_PRESS_ACTIONS = new Set(["back", "enter"]);
const LONG_PRESS_MS = 2000;

const KEYBOARD_ACTIONS = {
  arrowLeft: { key: "ArrowLeft", code: "ArrowLeft" },
  arrowRight: { key: "ArrowRight", code: "ArrowRight" },
  arrowUp: { key: "ArrowUp", code: "ArrowUp" },
  arrowDown: { key: "ArrowDown", code: "ArrowDown" },
  pageUp: { key: "PageUp", code: "PageUp" },
  pageDown: { key: "PageDown", code: "PageDown" },
  enter: { key: "Enter", code: "Enter" },
  back: { key: "Escape", code: "Escape" },
};

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
  if (hasWindow) setLocalStorageJsonSafe(k, v);
};
const now = () => new Date().toLocaleTimeString();

/* ================= Scroll global (site inteiro) =================== */
function isScrollable(node) {
  return Boolean(node && node.scrollHeight > node.clientHeight + 4);
}

/** Encontra o alvo de scroll da página atual. */
function getScrollTarget() {
  // 0) Viewport explícito da tela de apresentação/live
  const registeredViewport = getRegisteredScrollViewport();
  if (isScrollable(registeredViewport)) return registeredViewport;

  // 1) Marcador explícito
  const explicit = document.querySelector(
    '[data-scroll-removed-mongo-user="true"]'
  );
  if (isScrollable(explicit)) return explicit;

  // 2) Documento rola?
  const se =
    document.scrollingElement || document.documentElement || document.body;
  const canWindowScroll = se.scrollHeight - se.clientHeight > 0;
  if (canWindowScroll) return window;

  // 3) Fallback — procura o melhor candidato
  const candidates = Array.from(
    document.querySelectorAll(
      '#REMOVED_MONGO_USER, main, [role="main"], [data-app-scroll], .overflow-auto, .overflow-y-auto'
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
  if (hasWindow) {
    const handledByPresentation = !window.dispatchEvent(
      new CustomEvent("footswitch:presentation-action", {
        cancelable: true,
        detail: { action },
      })
    );
    if (handledByPresentation) return;

    const keyMeta = KEYBOARD_ACTIONS[action];
    if (keyMeta) {
      const handledByKeyListener = !window.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: keyMeta.key,
          code: keyMeta.code,
        })
      );
      if (handledByKeyListener) return;
    }
  }

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
    case "arrowLeft":
      target === window
        ? window.scrollBy({ left: -160, behavior: "smooth" })
        : target.scrollBy({ left: -160, behavior: "smooth" });
      break;
    case "arrowRight":
      target === window
        ? window.scrollBy({ left: 160, behavior: "smooth" })
        : target.scrollBy({ left: 160, behavior: "smooth" });
      break;
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
    case "back":
    case "enter":
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

// eslint-disable-next-line react/prop-types
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
  const activePressesRef = useRef({});
  useEffect(
    () => () => {
      Object.values(activePressesRef.current).forEach((activePress) => {
        window.clearTimeout(activePress.timerId);
      });
      activePressesRef.current = {};
    },
    []
  );
  useEffect(() => {
    controlsRef.current = controls;
    saveJSON(LS.actions, controls);
  }, [controls]);

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
      ...Object.fromEntries(
        Object.entries(prev).map(([key, row]) => [
          key,
          action !== "none" && row?.action === action
            ? { ...row, action: "none" }
            : row,
        ]),
      ),
      [controlId]: { ...(prev[controlId] || {}), action },
    }));
  };

  /* ========================== BLE (Web Bluetooth) ========================== */
  const bleDeviceRef = useRef(null);
  const bleCharRef = useRef(null);
  const manualDisconnectRef = useRef(false);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_BACKOFF_MS = 30000;
  const midiFallbackLoggedRef = useRef(false);

  const [bleConnected, setBleConnected] = useState(false);

  /* ============ Garante um REMOVED_MONGO_USER de scroll se o Layout não marcar ============ */
  useEffect(() => {
    const already = document.querySelector(
      '[data-scroll-removed-mongo-user="true"]'
    );
    if (already) return;

    const main =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.getElementById("REMOVED_MONGO_USER") ||
      document.body;

    main.setAttribute("data-scroll-removed-mongo-user", "true");

    if (main !== document.body) {
      const prevOverflow = main.style.overflow;
      const computed = getComputedStyle(main).overflowY;
      if (!/auto|scroll/i.test(computed)) {
        main.style.overflow = "auto";
      }
      return () => {
        if (main.getAttribute("data-scroll-removed-mongo-user") === "true") {
          main.removeAttribute("data-scroll-removed-mongo-user");
        }
        if (prevOverflow !== main.style.overflow) {
          main.style.overflow = prevOverflow;
        }
      };
    }

    return () => {
      if (main.getAttribute("data-scroll-removed-mongo-user") === "true") {
        main.removeAttribute("data-scroll-removed-mongo-user");
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
            const midiAllowed =
              activeSource === SOURCE.MIDI ||
              (activeSource === SOURCE.BLE && !bleConnected);
            if (!midiAllowed) return;
            if (
              activeSource === SOURCE.BLE &&
              !bleConnected &&
              !midiFallbackLoggedRef.current
            ) {
              midiFallbackLoggedRef.current = true;
              log("Usando Web MIDI como fallback enquanto o BLE está desconectado.");
            }
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
  }, [support.midi, activeSource, bleConnected]);

  function detachBleListeners() {
    try {
      bleCharRef.current?.removeEventListener(
        "characteristicvaluechanged",
        onBleNotify
      );
    } catch {}

    try {
      bleDeviceRef.current?.removeEventListener(
        "gattserverdisconnected",
        onGattDisconnected
      );
    } catch {}
  }

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
    log("Controles resetados.");
  };

  async function setupBLE(device) {
    detachBleListeners();
    bleDeviceRef.current = device;
    manualDisconnectRef.current = false;

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
    midiFallbackLoggedRef.current = false;
    log("BLE conectado:", device.name || device.id);

    setActiveSource(SOURCE.BLE);
  }

  function onGattDisconnected() {
    const name = bleDeviceRef.current?.name || "device";
    setLast({ source: "BLE", key: name, bytes: "disconnected", time: now() });
    setBleConnected(false); // <<< update state
    log("BLE desconectado:", name);
    if (activeSource === SOURCE.BLE) {
      midiFallbackLoggedRef.current = false;
      log("Fallback BLE→MIDI habilitado enquanto o BLE estiver fora.");
    }
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
    let device = bleDeviceRef.current;
    if (!device) return;

    try {
      const permitted = await navigator.bluetooth?.getDevices?.();
      const matchedDevice = permitted?.find((entry) => entry.id === device.id);
      if (matchedDevice) {
        device = matchedDevice;
        bleDeviceRef.current = matchedDevice;
      }
    } catch (e) {
      log("Falha ao consultar devices permitidos:", e?.message || e);
    }

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
    midiFallbackLoggedRef.current = false;
    log("BLE reconectado:", device.name || device.id);
  }

  function disconnectBLE() {
    manualDisconnectRef.current = true;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    detachBleListeners();
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
    midiFallbackLoggedRef.current = false;
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
      phase: "press",
    });
  }
  function emitCC(source, ch, cc, val) {
    handleControl({
      controlId: `${source}:CC:ch${ch}:${cc}`,
      source,
      info: `CC ch${ch}`,
      lastValue: `cc=${cc} val=${val}`,
      phase: Number(val) > 0 ? "press" : "release",
    });
  }
  function emitNO(source, ch, note, vel) {
    handleControl({
      controlId: `${source}:NOTE:ch${ch}:${note}`,
      source,
      info: `Note On ch${ch}`,
      lastValue: `note=${note} vel=${vel}`,
      phase: Number(vel) > 0 ? "press" : "release",
    });
  }
  function emitNF(source, ch, note, vel) {
    handleControl({
      controlId: `${source}:NOTE:ch${ch}:${note}`,
      source,
      info: `Note Off ch${ch}`,
      lastValue: `note=${note} vel=${vel}`,
      phase: "release",
    });
  }

  function findMappedAction(controlId) {
    const exactAction = controlsRef.current?.[controlId]?.action;
    if (exactAction && exactAction !== "none") return exactAction;

    const genericKey = controlId.replace(/^[^:]+:/, "");
    const fallbackEntry = Object.entries(controlsRef.current || {}).find(
      ([key, meta]) =>
        key.replace(/^[^:]+:/, "") === genericKey && meta?.action !== "none"
    );

    return fallbackEntry?.[1]?.action ?? "none";
  }

  function clearLongPress(controlId) {
    const activePress = activePressesRef.current[controlId];
    if (!activePress) return null;

    window.clearTimeout(activePress.timerId);
    delete activePressesRef.current[controlId];
    return activePress;
  }

  function executeMappedAction(controlId, action) {
    runGlobalAction(action);
    log("Ação executada:", action, "por", controlId);
  }

  function handleMappedAction(controlId, action, phase) {
    if (action === "none") {
      log("Ação não mapeada para", controlId);
      return;
    }

    if (!LONG_PRESS_ACTIONS.has(action)) {
      if (phase !== "release") executeMappedAction(controlId, action);
      return;
    }

    if (phase === "release") {
      const activePress = clearLongPress(controlId);
      if (activePress?.triggered) return;
      log("Ação longa cancelada:", action, "(solte depois de 2s)");
      return;
    }

    const currentPress = activePressesRef.current[controlId];
    if (currentPress?.action === action) return;
    clearLongPress(controlId);

    const timerId = window.setTimeout(() => {
      const activePress = activePressesRef.current[controlId];
      if (!activePress || activePress.action !== action) return;

      activePress.triggered = true;
      executeMappedAction(controlId, action);
      delete activePressesRef.current[controlId];
    }, LONG_PRESS_MS);

    activePressesRef.current[controlId] = {
      action,
      timerId,
      triggered: false,
    };
    log("Ação longa aguardando 2s:", action);
  }

  function handleControl({ controlId, source, info, lastValue, phase = "press" }) {
    ensureRow(controlId, { source, info });
    updateRowValue(controlId, lastValue);
    setLast({ source, key: controlId, bytes: lastValue, time: now() });
    log("Evento", source, "→", controlId, "|", lastValue);

    const action = findMappedAction(controlId);
    handleMappedAction(controlId, action, phase);
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
    clearControls,
    setRowAction,
    ACTIONS,
    connectBLE,
    disconnectBLE,
    bleConnected,
  };

  async function restoreBleIfPermitted() {
    if (!support.bt || !navigator.bluetooth.getDevices) return;
    try {
      const permitted = await navigator.bluetooth.getDevices();
      if (!permitted || permitted.length === 0) return;

      if (bleDeviceRef.current?.gatt?.connected) return;

      const currentDeviceId = bleDeviceRef.current?.id;
      const devicesInPriorityOrder = currentDeviceId
        ? [
            ...permitted.filter((device) => device.id === currentDeviceId),
            ...permitted.filter((device) => device.id !== currentDeviceId),
          ]
        : permitted;

      for (const dev of devicesInPriorityOrder) {
        try {
          await setupBLE(dev);
          log("BLE restaurado via getDevices():", dev.name || dev.id);
          break;
        } catch (e) {
          log("Falha restore:", e?.message || e);
        }
      }
    } catch (e) {
      log("navigator.bluetooth.getDevices falhou:", e?.message || e);
    }
  }

  useEffect(() => {
    restoreBleIfPermitted();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        restoreBleIfPermitted();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", restoreBleIfPermitted);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", restoreBleIfPermitted);
    };
  }, []);

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}
