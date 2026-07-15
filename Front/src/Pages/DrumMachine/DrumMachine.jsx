import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaDownload, FaFolderOpen, FaPause, FaPlay, FaRandom, FaSave, FaStop, FaTrash, FaExchangeAlt, FaVolumeMute, FaHeadphones, FaEraser, FaFileAudio } from "react-icons/fa";
import { z } from "zod";
import { DrumAudioEngine } from "./DrumAudioEngine";
import { BARS, DRUM_VOICES, GROOVE_PRESETS, STEPS, VOICE_LABELS, applyGroovePreset, createEmptyPattern, createFactoryPattern, cycleStep, randomizeBar } from "./drumMachineModel";
import { downloadJson, loadProject, loadVoiceSamples, saveProject, saveVoiceSample } from "./drumMachineStorage";
import DrumKnob from "./DrumKnob";
import { VOICE_CONTROLS, createDefaultVoiceParameters } from "./voiceControls";
import { MACHINE_PROFILES } from "./machineProfiles";
import "./DrumMachine.css";

const projectSchema = z.object({ pattern: z.object({ banks: z.object({ A: z.record(z.string(), z.any()), B: z.record(z.string(), z.any()) }) }), bpm: z.number().min(40).max(240) }).passthrough();
const clone = (value) => structuredClone(value);

export default function DrumMachine() {
  const [pattern, setPattern] = useState(createFactoryPattern);
  const [bank, setBank] = useState("A");
  const [bar, setBar] = useState(0);
  const [voice, setVoice] = useState("kick");
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [volume, setVolume] = useState(0.78);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [activeBars, setActiveBars] = useState([0]);
  const [activeVoices, setActiveVoices] = useState([]);
  const [visualTheme, setVisualTheme] = useState(() => localStorage.getItem("drum-machine-theme") || "hardware");
  const [muted, setMuted] = useState({});
  const [soloed, setSoloed] = useState({});
  const [clipboard, setClipboard] = useState(null);
  const [notice, setNotice] = useState("Ready — press Play to unlock audio");
  const [grooveIndex, setGrooveIndex] = useState(-1);
  const [voiceParameters, setVoiceParameters] = useState(createDefaultVoiceParameters);
  const [machine, setMachine] = useState("tr808");
  const [sampleNames, setSampleNames] = useState({});
  const fileRef = useRef(null);
  const stateRef = useRef({});
  const engineRef = useRef(null);
  const voiceFlashTimerRef = useRef(null);
  const bpmDragRef = useRef(null);
  const sampleFileRef = useRef(null);
  const sampleUrlsRef = useRef([]);

  const project = useMemo(() => ({ id: "last-project", version: 1, machine, pattern, bpm, swing, volume, muted, soloed, activeBars, voiceParameters }), [machine, pattern, bpm, swing, volume, muted, soloed, activeBars, voiceParameters]);
  stateRef.current = { pattern, bank, muted, soloed, activeBars };

  useEffect(() => {
    document.title = "Drum Machine | Sustenido";
    loadProject().then((saved) => {
      if (!saved) return;
      setPattern(saved.pattern); setBpm(saved.bpm); setSwing(saved.swing || 0); setVolume(saved.volume ?? 0.78);
      setMuted(saved.muted || {}); setSoloed(saved.soloed || {}); setNotice("Last project restored");
      setActiveBars(saved.activeBars?.length ? saved.activeBars : [0]);
      if (saved.voiceParameters) setVoiceParameters((current) => ({ ...current, ...saved.voiceParameters }));
      if (saved.machine) setMachine(({ analog: "tr808", linn: "lm1", hybrid: "tr909" })[saved.machine] || saved.machine);
    }).catch(() => setNotice("Local storage unavailable"));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => saveProject(project).catch(() => {}), 350);
    return () => clearTimeout(timeout);
  }, [project]);

  useEffect(() => {
    const engine = new DrumAudioEngine((step, activeBar, hits = []) => {
      setPlayhead(step % STEPS); setBar(activeBar); setActiveVoices(hits.map((hit) => hit.voice));
      window.clearTimeout(voiceFlashTimerRef.current);
      voiceFlashTimerRef.current = window.setTimeout(() => setActiveVoices([]), 95);
    });
    engine.setPatternReader((absoluteStep) => {
      const current = stateRef.current;
      const loopBars = current.activeBars.length ? current.activeBars : [0];
      const loopStep = absoluteStep % (loopBars.length * STEPS);
      const activeBar = loopBars[Math.floor(loopStep / STEPS)];
      const step = loopStep % STEPS;
      const hasSolo = Object.values(current.soloed).some(Boolean);
      const hits = DRUM_VOICES.flatMap((item) => {
        const beat = current.pattern.banks[current.bank][item][activeBar][step];
        const audible = hasSolo ? current.soloed[item] : !current.muted[item];
        return beat.active && audible && Math.random() <= (beat.probability ?? 1) ? [{ voice: item, velocity: beat.velocity }] : [];
      });
      return { hits, bar: activeBar };
    });
    engineRef.current = engine;
    engine.setVoiceParameters(voiceParameters);
    engine.setMachine(machine);
    loadVoiceSamples().then(async (samples) => {
      for (const sample of samples) {
        const url = URL.createObjectURL(sample.blob); sampleUrlsRef.current.push(url);
        await engine.setCustomSample(sample.voice, url);
        setSampleNames((current) => ({ ...current, [sample.voice]: sample.name }));
      }
    }).catch(() => {});
    return () => { window.clearTimeout(voiceFlashTimerRef.current); sampleUrlsRef.current.forEach(URL.revokeObjectURL); engine.dispose(); };
  }, []);

  useEffect(() => { engineRef.current?.setBpm(bpm); }, [bpm]);
  useEffect(() => { engineRef.current?.setSwing(swing); }, [swing]);
  useEffect(() => { engineRef.current?.setVolume(volume); }, [volume]);
  useEffect(() => { engineRef.current?.setVoiceParameters(voiceParameters); }, [voiceParameters]);
  useEffect(() => { engineRef.current?.setMachine(machine); setNotice(`${MACHINE_PROFILES.find((profile) => profile.id === machine)?.name || "Machine"} sound profile selected`); }, [machine]);

  useEffect(() => {
    const keydown = (event) => {
      if (event.target.matches("input, textarea, select")) return;
      if (event.code === "Space" && !event.repeat) { event.preventDefault(); togglePlay(); }
      const index = Number(event.key) - 1;
      if (index >= 0 && index < 9) audition(DRUM_VOICES[index]);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });

  const togglePlay = useCallback(async () => {
    if (playing) { engineRef.current.pause(); setPlaying(false); setNotice("Paused"); }
    else { await engineRef.current.play(); engineRef.current.setBpm(bpm); engineRef.current.setSwing(swing); engineRef.current.setVolume(volume); setPlaying(true); setNotice("Playing"); }
  }, [playing, bpm, swing, volume]);

  const audition = async (item) => { await engineRef.current.init(); engineRef.current.trigger(item); setVoice(item); };
  const toggleLoopBar = (index) => setActiveBars((current) => current.includes(index)
    ? current.length === 1 ? current : current.filter((item) => item !== index)
    : [...current, index].sort());
  const toggleTheme = () => setVisualTheme((current) => {
    const next = current === "hardware" ? "neumorphic" : "hardware";
    localStorage.setItem("drum-machine-theme", next);
    return next;
  });
  const voiceBars = (item) => Array.from({ length: BARS }, (_, barIndex) => pattern.banks[bank][item][barIndex].some((step) => step.active));
  const startBpmDrag = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    bpmDragRef.current = { y: event.clientY, bpm };
  };
  const moveBpmDrag = (event) => {
    if (!bpmDragRef.current) return;
    const delta = Math.round((bpmDragRef.current.y - event.clientY) / 3);
    setBpm(Math.min(240, Math.max(40, bpmDragRef.current.bpm + delta)));
  };
  const endBpmDrag = () => { bpmDragRef.current = null; };
  const updateStep = (index) => setPattern((current) => { const next = clone(current); next.banks[bank][voice][bar][index] = cycleStep(next.banks[bank][voice][bar][index]); return next; });
  const clearVoice = () => setPattern((current) => { const next = clone(current); next.banks[bank][voice][bar].forEach((step) => { step.active = false; }); return next; });
  const clearVoiceEveryBar = (item) => setPattern((current) => {
    const next = clone(current);
    next.banks[bank][item].flat().forEach((step) => { step.active = false; });
    return next;
  });
  const updateVoiceParameter = (item, parameter, value) => setVoiceParameters((current) => ({ ...current, [item]: { ...current[item], [parameter]: value } }));
  const loadNextGroove = () => {
    const nextIndex = (grooveIndex + 1) % GROOVE_PRESETS.length;
    const preset = GROOVE_PRESETS[nextIndex];
    setPattern((current) => applyGroovePreset(current, bank, preset));
    setGrooveIndex(nextIndex);
    setActiveBars([0, 1, 2, 3]);
    setNotice(`${preset.name} loaded in Pattern ${bank}`);
  };
  const clearPattern = () => { if (window.confirm("Clear both patterns and all four bars?")) setPattern(createEmptyPattern()); };
  const copyBar = () => { setClipboard(clone(Object.fromEntries(DRUM_VOICES.map((v) => [v, pattern.banks[bank][v][bar]])))); setNotice(`Bar ${bar + 1} copied`); };
  const pasteBar = () => { if (!clipboard) return; setPattern((current) => { const next = clone(current); DRUM_VOICES.forEach((v) => { next.banks[bank][v][bar] = clone(clipboard[v]); }); return next; }); setNotice(`Pasted to bar ${bar + 1}`); };
  const importProject = async (event) => {
    try { const raw = JSON.parse(await event.target.files[0].text()); const value = projectSchema.parse(raw.pattern ? raw : { pattern: raw, bpm }); setPattern(value.pattern); setBpm(value.bpm); setSwing(value.swing || 0); setNotice("Project imported"); }
    catch { setNotice("Invalid Sustenido project file"); }
    event.target.value = "";
  };
  const importVoiceSample = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await saveVoiceSample(voice, file);
      const url = URL.createObjectURL(file); sampleUrlsRef.current.push(url);
      await engineRef.current.setCustomSample(voice, url);
      setSampleNames((current) => ({ ...current, [voice]: file.name }));
      setMachine("custom"); setNotice(`${file.name} loaded for ${VOICE_LABELS[voice]}`);
    } catch { setNotice("Could not decode this audio file"); }
    event.target.value = "";
  };

  return (
    <main className={`drum-page machine-${machine} ${visualTheme === "neumorphic" ? "neumorphic-theme" : "hardware-theme"}`}>
      <section className="drum-shell" aria-label="Sustenido drum machine">
        <header className="drum-header">
          <div><p>SUSTENIDO INSTRUMENTS</p><h1>DRUM MACHINE</h1></div>
          <label className="machine-badge"><span>{MACHINE_PROFILES.find((profile) => profile.id === machine)?.inspiredBy} · {MACHINE_PROFILES.find((profile) => profile.id === machine)?.engine}</span><select value={machine} onChange={(event) => setMachine(event.target.value)}>{MACHINE_PROFILES.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
          <div className="drum-actions">
            <button onClick={toggleTheme} title="Switch visual style" aria-label="Switch visual style"><FaExchangeAlt /><span>{visualTheme === "hardware" ? "Soft UI" : "Hardware"}</span></button>
            <button onClick={() => sampleFileRef.current.click()} title={`Import sample for ${VOICE_LABELS[voice]}`} aria-label={`Import sample for ${VOICE_LABELS[voice]}`}><FaFileAudio /></button>
            <button onClick={() => saveProject(project).then(() => setNotice("Project saved"))} title="Save"><FaSave /></button>
            <button onClick={() => fileRef.current.click()} title="Import"><FaFolderOpen /></button>
            <button onClick={() => downloadJson(project, "sustenido-drum-project.json")} title="Export"><FaDownload /></button>
            <input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={importProject} />
            <input ref={sampleFileRef} hidden type="file" accept="audio/wav,audio/mpeg,audio/mp4,audio/aac,audio/*" onChange={importVoiceSample} />
          </div>
        </header>

        <div className="drum-display">
          <div><small>PATTERN</small><div className="bank-switch">{["A", "B"].map((item) => <button className={bank === item ? "active" : ""} key={item} onClick={() => setBank(item)}>{item}</button>)}</div></div>
          <div className="tempo"><small>TEMPO · DRAG ↑↓</small><strong className="bpm-drag" onPointerDown={startBpmDrag} onPointerMove={moveBpmDrag} onPointerUp={endBpmDrag} onPointerCancel={endBpmDrag}>{bpm}</strong><span>BPM</span></div>
          <div><small>BAR</small><div className="bar-switch">{Array.from({ length: BARS }, (_, i) => <button className={bar === i ? "active" : ""} key={i} onClick={() => setBar(i)}>{i + 1}</button>)}</div></div>
        </div>

        <div className="drum-workspace">
          <div className="voice-grid">
            {DRUM_VOICES.map((item, index) => <div key={item} className={`voice-card ${voice === item ? "selected" : ""} ${activeVoices.includes(item) ? "sounding" : ""}`}>
              <button className="voice-pad" onClick={() => audition(item)} title={sampleNames[item] ? `Custom: ${sampleNames[item]}` : VOICE_LABELS[item]}><span>{index + 1}</span><strong className="voice-name">{VOICE_LABELS[item]}</strong>{sampleNames[item] ? <em>S</em> : null}<i className="voice-led" aria-hidden="true" /></button>
              <div className="voice-knobs">{VOICE_CONTROLS[item].map((parameter) => <DrumKnob key={parameter} label={parameter} value={voiceParameters[item][parameter]} onChange={(value) => updateVoiceParameter(item, parameter, value)} />)}{sampleNames[item] ? <DrumKnob label="Trim" value={voiceParameters[item].Trim ?? 0} onChange={(value) => updateVoiceParameter(item, "Trim", value)} /> : null}</div>
              <span className="voice-bars" aria-label={`Used in bars ${voiceBars(item).map((used, i) => used ? i + 1 : null).filter(Boolean).join(", ") || "none"}`}>{voiceBars(item).map((used, i) => <b key={i} className={`${used ? "used" : ""} ${bar === i ? "current" : ""}`}>{i + 1}</b>)}</span>
              <div className="voice-actions"><button aria-label={`Mute ${VOICE_LABELS[item]}`} title={`Mute ${VOICE_LABELS[item]}`} className={muted[item] ? "lit" : ""} onClick={() => setMuted((v) => ({ ...v, [item]: !v[item] }))}><FaVolumeMute /></button><button aria-label={`Solo ${VOICE_LABELS[item]}`} title={`Solo ${VOICE_LABELS[item]}`} className={soloed[item] ? "lit" : ""} onClick={() => setSoloed((v) => ({ ...v, [item]: !v[item] }))}><FaHeadphones /></button><button aria-label={`Clean ${VOICE_LABELS[item]}`} title={`Clear ${VOICE_LABELS[item]} from all bars`} onClick={() => clearVoiceEveryBar(item)}><FaEraser /></button></div>
            </div>)}
          </div>
        </div>

        <div className="sequencer">
          <div className="loop-bars"><strong>LOOP BARS</strong>{Array.from({ length: BARS }, (_, i) => <button key={i} className={activeBars.includes(i) ? "active" : ""} aria-pressed={activeBars.includes(i)} onClick={() => toggleLoopBar(i)}>{i + 1}</button>)}<span>Only highlighted bars will play</span><button className="groove-button" onClick={loadNextGroove}><FaRandom /> GROOVE: {grooveIndex < 0 ? "LOAD EXAMPLE" : GROOVE_PRESETS[grooveIndex].name}</button></div>
          <div className="sequence-tools"><strong>{VOICE_LABELS[voice]}</strong><div className="step-legend"><i /> Normal <i /> Accent <i /> Off</div><button onClick={clearVoice}>Clear voice</button><button onClick={() => setPattern((p) => randomizeBar(p, bank, bar))}><FaRandom /> Random</button><button onClick={copyBar}>Copy</button><button disabled={!clipboard} onClick={pasteBar}>Paste</button><button onClick={clearPattern}><FaTrash /> Pattern</button></div>
          <div className="steps">{pattern.banks[bank][voice][bar].map((step, index) => <button key={index} title="Click: normal → accent → off" aria-label={`Step ${index + 1}${step.active ? step.velocity === 1 ? ", accented" : ", active" : ""}`} onClick={() => updateStep(index)} className={`${step.active ? step.velocity === 1 ? "accent" : "on" : ""} ${playing && playhead === index ? "playhead" : ""}`}><span>{index + 1}</span></button>)}</div>
          <div className="transport"><button className="stop" onClick={() => { engineRef.current.stop(); setPlaying(false); setPlayhead(0); setBar(activeBars[0]); setActiveVoices([]); setNotice("Stopped — returned to first active bar"); }}><FaStop /><span>STOP</span></button><button className="play" onClick={togglePlay}>{playing ? <FaPause /> : <FaPlay />}<span>{playing ? "PAUSE" : "PLAY"}</span></button><p aria-live="polite">Space: Play/Pause · {notice}</p></div>
        </div>
      </section>
    </main>
  );
}
