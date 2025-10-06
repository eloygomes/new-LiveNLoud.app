import React from "react";
// import { useBluetooth } from "../../../context/BluetoothContext"; // ajuste o caminho conforme sua estrutura
import { useBluetooth } from "../../../../contexts/BluetoothContext"; // ajuste o caminho conforme sua estrutura

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
    setRowAction,
    ACTIONS,
    connectBLE,
    disconnectBLE,
    bleConnected,
  } = useBluetooth();

  const controlsList = Object.entries(controls).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="flex flex-col gap-4 overflow-scroll ">
      <h2 className="text-2xl font-bold pl-2">Bluetooth &amp; MIDI</h2>
      <h5 className="text-xs text-gray-400  pl-2">
        Web BLE API is only avaliable on Google Chrome & Microsoft Edge
      </h5>

      {/* 1) Suporte & Conexão */}
      <section className=" rounded-xl p-2 ">
        <h3 className="font-bold text-base p-2 px-4 mb-3 neuphormism-b">
          Suporte & Conexão
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          {/* suporte + último evento */}
          <div className="flex-1 min-w-[320px] border border-slate-200 rounded-xl p-4 neuphormism-b">
            <div className="neuphormism-b p-2">
              <div className="text-base font-bold mt-1 mb-3">
                Suporte do navegador
              </div>
              <div className=" text-sm">
                Web Bluetooth:
                <Badge ok={support.bt} />
              </div>
              <div className="pt-2 text-sm">
                Web MIDI:
                <Badge ok={support.midi} />
              </div>
            </div>
            <hr className="my-3 border-slate-200" />
            <div className="neuphormism-b p-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base">Último evento</span>
                <span className="px-2 py-0.5 rounded-md border border-slate-300 bg-slate-50 text-xs">
                  {last.source}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-slate-300 bg-slate-50 text-xs">
                  {last.key}
                </span>
                <span className="text-slate-500 text-xs">{last.bytes}</span>
                <span className="text-slate-500 text-xs">{last.time}</span>
              </div>
            </div>
          </div>

          {/* conectar + seleção de fonte */}
          <div className="min-w-[280px] border border-slate-200 rounded-xl p-4 neuphormism-b">
            <div className="flex flex-col neuphormism-b p-2">
              <div className="font-bold text-base mt-1 mb-3">
                Conectar Dispositivos
              </div>
              <div className="flex flex-row gap-2 ">
                <button
                  onClick={connectBLE}
                  className="px-3 py-2 rounded-lg border border-slate-500 text-slate-800 hover:bg-slate-50 active:scale-[.99] transition"
                >
                  Connect
                </button>
                <button
                  onClick={disconnectBLE}
                  disabled={!bleConnected}
                  className={`px-3 py-2 rounded-lg border active:scale-[.99] transition ${
                    bleConnected
                      ? "border-rose-500 text-rose-700 hover:bg-rose-50"
                      : "border-slate-300 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Desconect
                </button>
              </div>
            </div>
            <div className=" neuphormism-b mt-4 px-4 py-2 ">
              <div className="text-base font-bold mb-1">Fonte de eventos</div>
              <div className="flex flex-row justify-start gap-5">
                <label className="flex items-center gap-2">
                  <Led on={activeSource === "BLE"} />
                  <input
                    type="radio"
                    name="src"
                    checked={activeSource === "BLE"}
                    onChange={() => setActiveSource("BLE")}
                  />
                  <span className="text-xs">BLE (Web Bluetooth)</span>
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <Led on={activeSource === "MIDI"} />
                  <input
                    type="radio"
                    name="src"
                    checked={activeSource === "MIDI"}
                    onChange={() => setActiveSource("MIDI")}
                  />
                  <span className="text-xs">Web MIDI (SO)</span>
                </label>
              </div>

              <label className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  checked={autoReconnect}
                  onChange={(e) => setAutoReconnect(e.target.checked)}
                />
                <span className="text-xs">Auto-reconnect (BLE)</span>
              </label>

              <p className="text-xs text-slate-500 mt-2">
                Obs.: “Desconectar BLE” encerra a sessão no navegador. Para
                remover do sistema/OS, use as configurações de Bluetooth do
                computador.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Mapeamento */}
      <section className=" rounded-xl p-2 ">
        <h3 className="font-bold text-base p-2 px-4 mb-3 neuphormism-b">
          Controles Detectados &amp; Mapeamento
        </h3>
        <div className="neuphormism-b p-2">
          <p className="text-slate-500 text-xs pl-2 mb-3">
            Aperte os pedais/botões. Cada controle detectado aparece abaixo.
            Selecione a ação para cada um (salva automaticamente).
          </p>

          <div className="max-h-[48vh] overflow-auto rounded-xl border border-slate-200  neuphormism-b">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-100">
                <tr className="text-left text-sm">
                  <th className="px-3 py-2 w-[36%]">
                    Identificador do Controle
                  </th>
                  <th className="px-3 py-2 w-[16%]">Fonte</th>
                  <th className="px-3 py-2 w-[14%]">Canal/Info</th>
                  <th className="px-3 py-2 w-[16%]">Último Valor</th>
                  <th className="px-3 py-2 w-[18%]">Ação</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {controlsList.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={5}>
                      Nenhum controle detectado ainda.
                    </td>
                  </tr>
                )}
                {controlsList.map(([id, meta]) => (
                  <tr key={id} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-mono">{id}</td>
                    <td className="px-3 py-2">{meta.source}</td>
                    <td className="px-3 py-2 font-mono text-slate-500">
                      {meta.info}
                    </td>
                    <td className="px-3 py-2 font-mono">{meta.lastValue}</td>
                    <td className="px-3 py-2">
                      <select
                        value={meta.action}
                        onChange={(e) => setRowAction(id, e.target.value)}
                        className="px-2 py-1 rounded-md border border-slate-400 bg-white"
                      >
                        {ACTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3) Logs */}
      <section className=" rounded-xl p-2 ">
        <div className="flex flex-row justify-between items-center neuphormism-b p-2 px-4 mb-3">
          <h3 className="font-bold text-base ">Logs</h3>
          <div className="">
            <button
              onClick={clearLogs}
              className="px-3  rounded-lg border border-slate-500 hover:bg-slate-50 active:scale-[.99] transition"
            >
              Limpar logs
            </button>
          </div>
        </div>
        <div className="max-h-56 overflow-auto  p-3 font-mono text-xs leading-relaxed font-bold  px-4 my-3 neuphormism-b">
          {logs.length === 0 ? (
            <div className="text-slate-500">Sem logs ainda…</div>
          ) : (
            logs.map((ln, i) => <div key={i}>{ln}</div>)
          )}
        </div>
      </section>
    </div>
  );
}

/* ====================== UI helpers ====================== */
function Badge({ ok }) {
  return (
    <span
      className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-xs ${
        ok
          ? "border-emerald-500 text-emerald-600"
          : "border-rose-600 text-rose-700"
      }`}
    >
      {ok ? "ok" : "não"}
    </span>
  );
}
function Led({ on }) {
  return (
    <span
      className={`inline-block h-3 w-3 rounded-full border ${
        on ? "bg-emerald-500 border-emerald-600" : "bg-rose-500 border-rose-600"
      }`}
      aria-hidden="true"
    />
  );
}
