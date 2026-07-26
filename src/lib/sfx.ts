/** WebAudio sound engine — Sweet Bonanza style bright bells, chimes and upbeat loop. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let convolver: ConvolverNode | null = null;

export const audioState = { sfx: true, music: true };

function makeReverb(c: AudioContext) {
  const len = Math.floor(c.sampleRate * 1.1);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2.6;
  }
  const cv = c.createConvolver();
  cv.buffer = buf;
  return cv;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    convolver = makeReverb(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    convolver.connect(wet);
    wet.connect(master);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.14;
    musicGain.connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

/** Bright bell / marimba style hit (two detuned partials + shimmer). */
function bell(freq: number, dur: number, vol = 0.3, delay = 0, wet = true) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  out.connect(master);
  if (wet && convolver) out.connect(convolver);

  [
    [1, 1],
    [2.01, 0.34],
    [3.02, 0.14],
    [5.4, 0.06],
  ].forEach(([mul, amp]) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * mul, t);
    g.gain.setValueAtTime(amp, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (mul > 2 ? 0.5 : 1));
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
}

function pluck(freq: number, dur: number, type: OscillatorType, vol = 0.2, delay = 0) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(4200, t);
  f.frequency.exponentialRampToValueAtTime(900, t + dur);
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f);
  f.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function shimmer(dur: number, vol = 0.2, delay = 0) {
  const c = ac();
  if (!c || !master) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 1.6;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 5200;
  f.Q.value = 1.4;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  if (convolver) g.connect(convolver);
  src.start(c.currentTime + delay);
}

/** Pentatonic ladder used for cascading candy chimes (very Sweet Bonanza). */
const LADDER = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1567.98, 1760, 2093];

export const sfx = {
  pick() {
    if (!audioState.sfx) return;
    bell(1174.66, 0.22, 0.16);
  },
  place() {
    if (!audioState.sfx) return;
    pluck(392, 0.14, "triangle", 0.16);
    bell(783.99, 0.28, 0.16, 0.01);
  },
  invalid() {
    if (!audioState.sfx) return;
    pluck(160, 0.16, "sawtooth", 0.1);
    pluck(120, 0.2, "sawtooth", 0.08, 0.05);
  },
  /** Cascading candy chime ladder + sparkle wash. */
  blast(lines: number, combo: number) {
    if (!audioState.sfx) return;
    const start = Math.min(combo, 5);
    const count = Math.min(LADDER.length - start, 4 + lines * 2 + combo);
    for (let i = 0; i < count; i++) {
      bell(LADDER[start + i], 0.55, 0.24 - i * 0.012, i * 0.055);
    }
    shimmer(0.5, 0.16);
    pluck(130.81, 0.3, "sine", 0.2);
  },
  /** Big win style rising fanfare, grows with combo. */
  combo(level: number) {
    if (!audioState.sfx) return;
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    chord.forEach((f, i) => bell(f * (1 + level * 0.02), 0.9, 0.22, i * 0.07));
    shimmer(0.9, 0.2, 0.1);
    [65.41, 98, 130.81].forEach((f, i) => pluck(f, 0.4, "sine", 0.22, i * 0.09));
  },
  levelUp() {
    if (!audioState.sfx) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) =>
      bell(f, 0.8, 0.26, i * 0.09),
    );
    shimmer(1.1, 0.22, 0.2);
  },
  tick() {
    if (!audioState.sfx) return;
    bell(1760, 0.12, 0.12);
  },
  gameOver() {
    if (!audioState.sfx) return;
    [783.99, 659.25, 523.25, 392].forEach((f, i) => bell(f, 0.7, 0.22, i * 0.17));
    pluck(98, 0.6, "sine", 0.18, 0.5);
  },
};

/* ── Upbeat candy loop (marimba melody + bouncy bass) ─────────────── */
const MELODY: [number, number][] = [
  [1046.5, 0.22], [880, 0.22], [1318.5, 0.22], [1046.5, 0.22],
  [1174.66, 0.22], [880, 0.22], [1046.5, 0.44],
  [987.77, 0.22], [1174.66, 0.22], [1567.98, 0.22], [1318.5, 0.22],
  [1174.66, 0.22], [987.77, 0.22], [880, 0.44],
  [1046.5, 0.22], [1318.5, 0.22], [1567.98, 0.22], [1760, 0.22],
  [1567.98, 0.22], [1318.5, 0.22], [1046.5, 0.44],
  [880, 0.22], [1046.5, 0.22], [1174.66, 0.22], [1318.5, 0.22],
  [1174.66, 0.22], [1046.5, 0.22], [783.99, 0.44],
];
const BASS = [130.81, 174.61, 196, 164.81];

export function startMusic() {
  const c = ac();
  if (!c || !musicGain || musicTimer !== null) return;
  let i = 0;
  const step = () => {
    if (!audioState.music || !ctx || !musicGain) return;
    const [f, len] = MELODY[i % MELODY.length];
    const t = ctx.currentTime;

    // marimba-ish melody
    [1, 2.01].forEach((mul, k) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = "sine";
      o.frequency.value = f * mul;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(k === 0 ? 0.5 : 0.14, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len * 1.2);
      o.connect(g);
      g.connect(musicGain!);
      o.start(t);
      o.stop(t + len * 1.4);
    });

    // bouncy bass
    const b = ctx.createOscillator();
    const bg = ctx.createGain();
    b.type = "triangle";
    b.frequency.value = BASS[Math.floor(i / 4) % BASS.length];
    bg.gain.setValueAtTime(0.4, t);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.9);
    b.connect(bg);
    bg.connect(musicGain);
    b.start(t);
    b.stop(t + len);

    // hat on off-beats
    if (i % 2 === 1) {
      const len2 = Math.floor(ctx.sampleRate * 0.05);
      const buf = ctx.createBuffer(1, len2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let n = 0; n < len2; n++) d[n] = (Math.random() * 2 - 1) * (1 - n / len2) ** 2;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hf = ctx.createBiquadFilter();
      hf.type = "highpass";
      hf.frequency.value = 7000;
      const hg = ctx.createGain();
      hg.gain.value = 0.25;
      src.connect(hf);
      hf.connect(hg);
      hg.connect(musicGain);
      src.start(t);
    }

    i += 1;
    musicTimer = window.setTimeout(step, len * 1000);
  };
  step();
}

export function stopMusic() {
  if (musicTimer !== null) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
}

export function setMusic(on: boolean) {
  audioState.music = on;
  if (on) startMusic();
  else stopMusic();
}

export function setSfx(on: boolean) {
  audioState.sfx = on;
}
