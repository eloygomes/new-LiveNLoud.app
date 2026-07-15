import * as Tone from "tone";
import { MACHINE_SOUND_PROFILES } from "./machineProfiles";

export class DrumAudioEngine {
  constructor(onStep) {
    this.onStep = onStep;
    this.step = 0;
    this.patternReader = null;
    this.scheduleId = null;
    this.nodes = [];
    this.voiceParameters = {};
    this.customPlayers = {};
    this.machine = "tr808";
  }

  async init() {
    if (this.master) { await Tone.start(); return; }
    await Tone.start();
    this.master = new Tone.Gain(0.78).toDestination();
    this.machineDrive = new Tone.Distortion(0.08).connect(this.master);
    this.machineFilter = new Tone.Filter({ type: "lowpass", frequency: 15500, Q: 0.25 }).connect(this.machineDrive);
    this.compressor = new Tone.Compressor(-18, 3).connect(this.machineFilter);
    this.nodes.push(this.master, this.machineDrive, this.machineFilter, this.compressor);
    const connect = (node) => { node.connect(this.compressor); this.nodes.push(node); return node; };
    const through = (node, effect) => { node.connect(effect); effect.connect(this.compressor); this.nodes.push(node, effect); return node; };
    this.kick = connect(new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 8, oscillator: { type: "sine" }, envelope: { attack: 0.001, decay: 0.42, sustain: 0.01, release: 0.1 } }));
    this.snare = connect(new Tone.NoiseSynth({ noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.16, sustain: 0 } }));
    const clapFilter = new Tone.Filter({ type: "bandpass", frequency: 1350, Q: 0.7 });
    clapFilter.connect(this.compressor);
    this.clapBursts = Array.from({ length: 3 }, () => new Tone.NoiseSynth({ volume: -9, noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.018, sustain: 0, release: 0.012 } }).connect(clapFilter));
    this.clapTail = new Tone.NoiseSynth({ volume: -14, noise: { type: "pink" }, envelope: { attack: 0.001, decay: 0.16, sustain: 0, release: 0.11 } }).connect(clapFilter);
    this.nodes.push(clapFilter, ...this.clapBursts, this.clapTail);
    this.hat = through(
      new Tone.NoiseSynth({ volume: -7, noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.015 } }),
      new Tone.Filter({ type: "highpass", frequency: 7200, Q: 0.7 }),
    );
    this.openHat = through(
      new Tone.NoiseSynth({ volume: -9, noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.32, sustain: 0.04, release: 0.12 } }),
      new Tone.Filter({ type: "bandpass", frequency: 8800, Q: 0.75 }),
    );
    this.lowTom = connect(new Tone.MembraneSynth({ pitchDecay: 0.07, octaves: 3, envelope: { attack: 0.001, decay: 0.3, sustain: 0 } }));
    this.highTom = connect(new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 3, envelope: { attack: 0.001, decay: 0.22, sustain: 0 } }));
    const cowbellFilter = new Tone.Filter({ type: "bandpass", frequency: 1700, Q: 2.4 });
    cowbellFilter.connect(this.compressor);
    this.cowbellLow = new Tone.Synth({ volume: -10, oscillator: { type: "square" }, envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.025 } }).connect(cowbellFilter);
    this.cowbellHigh = new Tone.Synth({ volume: -12, oscillator: { type: "square" }, envelope: { attack: 0.001, decay: 0.085, sustain: 0, release: 0.02 } }).connect(cowbellFilter);
    this.nodes.push(cowbellFilter, this.cowbellLow, this.cowbellHigh);
    this.cymbal = through(
      new Tone.NoiseSynth({ volume: -10, noise: { type: "white" }, envelope: { attack: 0.001, decay: 0.72, sustain: 0.015, release: 0.22 } }),
      new Tone.Filter({ type: "highpass", frequency: 5200, Q: 0.55 }),
    );
    this.applyVoiceParameters();
    this.applyMachineProfile();
  }

  setPatternReader(reader) { this.patternReader = reader; }
  setBpm(value) { Tone.getTransport().bpm.rampTo(value, 0.05); }
  setSwing(value) { const t = Tone.getTransport(); t.swingSubdivision = "16n"; t.swing = value; }
  setVolume(value) { if (this.master) this.master.gain.rampTo(value, 0.03); }
  setMachine(machine) { this.machine = MACHINE_SOUND_PROFILES[machine] ? machine : "tr808"; this.applyMachineProfile(); }
  applyMachineProfile() {
    if (!this.master) return;
    const profile = MACHINE_SOUND_PROFILES[this.machine];
    this.machineFilter.frequency.rampTo(profile.filter, 0.08);
    this.machineDrive.distortion = profile.drive;
    this.kick.envelope.decay = profile.kickDecay;
    this.kick.octaves = profile.kickOctaves;
    this.snare.envelope.decay = profile.snareDecay;
    this.hat.envelope.decay = profile.hatDecay;
    this.openHat.envelope.decay = profile.openDecay;
    this.cymbal.envelope.decay = profile.cymbalDecay;
  }
  setVoiceParameters(value) { this.voiceParameters = value || {}; this.applyVoiceParameters(); }
  async setCustomSample(voice, url) {
    await this.init();
    this.customPlayers[voice]?.dispose();
    const player = new Tone.Player({ url, fadeIn: 0.001, fadeOut: 0.04 }).connect(this.compressor);
    await Tone.loaded();
    this.customPlayers[voice] = player;
    this.nodes.push(player);
  }

  applyVoiceParameters() {
    if (!this.master) return;
    const p = this.voiceParameters;
    const db = (value, floor = -30) => floor + (value / 100) * -floor;
    if (this.kick && p.kick) {
      this.kick.volume.rampTo(db(p.kick.Volume), 0.02);
      this.kick.envelope.attack = 0.001 + (p.kick.Attack / 100) * 0.08;
      this.kick.envelope.decay = 0.08 + (p.kick.Decay / 100) * 0.7;
      this.kick.pitchDecay = 0.01 + (p.kick["Env Time"] / 100) * 0.12;
    }
    if (this.snare && p.snare) {
      this.snare.volume.rampTo(db(p.snare.Level), 0.02);
      this.snare.envelope.decay = 0.05 + (p.snare.Snappy / 100) * 0.35;
    }
    if (this.clapBursts && p.clap) {
      this.clapBursts.forEach((node) => { node.volume.rampTo(db(p.clap["HC Level"], -24), 0.02); node.envelope.decay = 0.008 + (p.clap.Decay / 100) * 0.04; });
      this.clapTail.volume.rampTo(db(p.clap["RS Level"], -30), 0.02);
      this.clapTail.envelope.decay = 0.05 + (p.clap.Tail / 100) * 0.32;
    }
    if (this.hat && p.closedHat) { this.hat.volume.rampTo(db(p.closedHat.Level, -24), 0.02); this.hat.envelope.decay = 0.02 + (p.closedHat.Closed / 100) * 0.09; }
    if (this.openHat && p.openHat) { this.openHat.volume.rampTo(db(p.openHat.Level, -24), 0.02); this.openHat.envelope.decay = 0.12 + (p.openHat.Open / 100) * 0.65; }
    if (this.lowTom && p.lowTom) { this.lowTom.volume.rampTo(db(p.lowTom.Level), 0.02); this.lowTom.envelope.decay = 0.1 + (p.lowTom.Decay / 100) * 0.55; }
    if (this.highTom && p.highTom) { this.highTom.volume.rampTo(db(p.highTom.Level), 0.02); this.highTom.envelope.decay = 0.08 + (p.highTom.Decay / 100) * 0.45; }
    if (this.cowbellLow && p.cowbell) { this.cowbellLow.volume.rampTo(db(p.cowbell.Level, -25), 0.02); this.cowbellHigh.volume.rampTo(db(p.cowbell.Level, -28), 0.02); }
    if (this.cymbal && p.cymbal) { this.cymbal.volume.rampTo(db(p.cymbal.Level, -26), 0.02); this.cymbal.envelope.decay = 0.25 + (p.cymbal.Decay / 100) * 1.2; }
  }

  trigger(voice, velocity = 0.82, time = Tone.now()) {
    if (!this.master) return;
    const custom = this.customPlayers[voice];
    if (custom?.loaded) {
      const parameters = this.voiceParameters[voice] || {};
      custom.playbackRate = 2 ** ((((parameters.Tune ?? 50) - 50) / 50) * 12 / 12);
      custom.volume.value = -24 + ((parameters.Level ?? parameters.Volume ?? 78) / 100) * 24;
      custom.fadeOut = 0.01 + ((parameters.Decay ?? parameters.Tail ?? 50) / 100) * 0.3;
      const bufferDuration = custom.buffer.duration;
      const offset = ((parameters.Trim ?? 0) / 100) * bufferDuration * 0.5;
      const duration = Math.max(0.02, (bufferDuration - offset) * (0.15 + ((parameters.Decay ?? parameters.Tail ?? 60) / 100) * 0.85));
      custom.start(time, offset, duration);
      return;
    }
    const profile = MACHINE_SOUND_PROFILES[this.machine];
    const tune = (item, range = 12) => (((this.voiceParameters[item]?.Tune ?? 50) - 50) / 50) * range + profile.pitch;
    const map = {
      kick: () => this.kick.triggerAttackRelease(Tone.Frequency(profile.kickNote).transpose(tune("kick")), "8n", time, velocity),
      snare: () => this.snare.triggerAttackRelease("16n", time, velocity),
      clap: () => {
        const spread = 0.012 + ((this.voiceParameters.clap?.Spread ?? 45) / 100) * 0.022;
        this.clapBursts.forEach((node, index) => node.triggerAttackRelease(0.02, time + index * spread, velocity * (0.92 - index * 0.08)));
        this.clapTail.triggerAttackRelease(0.22, time + spread * 1.5, velocity * 0.72);
      },
      closedHat: () => { this.openHat.triggerRelease(time); this.hat.triggerAttackRelease(0.055, time, velocity); },
      openHat: () => this.openHat.triggerAttackRelease(0.42, time, velocity),
      lowTom: () => this.lowTom.triggerAttackRelease(Tone.Frequency("G1").transpose(tune("lowTom")), "8n", time, velocity),
      highTom: () => this.highTom.triggerAttackRelease(Tone.Frequency("D2").transpose(tune("highTom")), "8n", time, velocity),
      cowbell: () => {
        this.cowbellLow.triggerAttackRelease(Tone.Frequency("G5").transpose(tune("cowbell")), 0.13, time, velocity);
        this.cowbellHigh.triggerAttackRelease(Tone.Frequency("C#6").transpose(tune("cowbell")), 0.105, time, velocity * 0.82);
      },
      cymbal: () => this.cymbal.triggerAttackRelease(0.9, time, velocity),
    };
    map[voice]?.();
  }

  async play() {
    await this.init();
    const transport = Tone.getTransport();
    if (this.scheduleId === null) {
      this.scheduleId = transport.scheduleRepeat((time) => {
        const scheduledStep = this.step;
        const snapshot = this.patternReader?.(scheduledStep);
        snapshot?.hits.forEach(({ voice, velocity }) => this.trigger(voice, velocity, time));
        Tone.getDraw().schedule(() => this.onStep?.(scheduledStep, snapshot?.bar ?? 0, snapshot?.hits ?? []), time);
        this.step = (this.step + 1) % 64;
      }, "16n");
    }
    transport.start();
  }

  pause() { Tone.getTransport().pause(); }
  stop() { Tone.getTransport().stop(); this.step = 0; this.onStep?.(0, 0); }
  dispose() {
    const transport = Tone.getTransport();
    transport.stop();
    if (this.scheduleId !== null) transport.clear(this.scheduleId);
    this.nodes.forEach((node) => node.dispose());
    this.nodes = [];
    this.scheduleId = null;
  }
}
