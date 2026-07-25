/** Tiny WebAudio sound engine - synthesized SFX + looping candy music (no assets needed). */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;

export const audioState = { sfx: true, music: true };

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.16;
    musicGain.connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  ac();
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.3, delay = 0) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function noise(dur: number, vol = 0.25, delay = 0) {
  const c = ac();
  if (!c || !master) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 1200;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f);
  f.connect(g);
  g.connect(master);
  src.start(c.currentTime + delay);
}

export const sfx = {
  pick() {
    if (!audioState.sfx) return;
    tone(880, 0.08, "triangle", 0.2);
  },
  place() {
    if (!audioState.sfx) return;
    tone(520, 0.09, "square", 0.14);
    tone(780, 0.08, "sine", 0.16, 0.04);
  },
  invalid() {
    if (!audioState.sfx) return;
    tone(150, 0.16, "sawtooth", 0.12);
  },
  blast(lines: number, combo: number) {
    if (!audioState.sfx) return;
    const base = 520 + combo * 60;
    [0, 0.07, 0.14, 0.21].slice(0, Math.max(2, lines + 1)).forEach((d, i) => {
      tone(base * Math.pow(1.26, i), 0.22, "triangle", 0.26, d);
    });
    noise(0.35, 0.2);
  },
  combo(level: number) {
    if (!audioState.sfx) return;
    [0, 0.08, 0.16].forEach((d, i) => tone(660 * Math.pow(1.2, i + level * 0.3), 0.2, "sine", 0.24, d));
  },
  levelUp() {
    if (!audioState.sfx) return;
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, "triangle", 0.26, i * 0.11));
  },
  gameOver() {
    if (!audioState.sfx) return;
    [523, 440, 349, 262].forEach((f, i) => tone(f, 0.4, "sine", 0.24, i * 0.16));
  },
};

const MELODY = [
  [659, 0.25], [784, 0.25], [880, 0.5], [784, 0.25], [659, 0.25], [587, 0.5],
  [523, 0.25], [587, 0.25], [659, 0.5], [587, 0.25], [523, 0.25], [440, 0.5],
  [659, 0.25], [880, 0.25], [988, 0.5], [880, 0.25], [784, 0.25], [659, 0.5],
  [587, 0.25], [659, 0.25], [784, 0.5], [659, 0.5], [523, 0.5],
] as [number, number][];
const BASS = [131, 165, 196, 165];

export function startMusic() {
  const c = ac();
  if (!c || !musicGain || musicTimer !== null) return;
  let i = 0;
  let bar = 0;
  const step = () => {
    if (!audioState.music || !ctx || !musicGain) return;
    const [f, len] = MELODY[i % MELODY.length];
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.85);
    o.connect(g);
    g.connect(musicGain);
    o.start(t);
    o.stop(t + len);

    const b = ctx.createOscillator();
    const bg = ctx.createGain();
    b.type = "sine";
    b.frequency.value = BASS[bar % BASS.length];
    bg.gain.setValueAtTime(0.35, t);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + len);
    b.connect(bg);
    bg.connect(musicGain);
    b.start(t);
    b.stop(t + len);

    i += 1;
    if (i % 4 === 0) bar += 1;
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
