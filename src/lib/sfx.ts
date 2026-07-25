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
    // Juicy short tap click
    tone(880, 0.05, "sine", 0.15);
    tone(1320, 0.04, "sine", 0.08, 0.01);
  },
  place() {
    if (!audioState.sfx) return;
    // satisfying double pop
    tone(440, 0.06, "sine", 0.18);
    tone(660, 0.05, "sine", 0.12, 0.02);
  },
  invalid() {
    if (!audioState.sfx) return;
    // low dull buzzy pluck
    tone(120, 0.14, "sawtooth", 0.14);
    tone(80, 0.18, "sawtooth", 0.12, 0.03);
  },
  blast(lines: number, combo: number) {
    if (!audioState.sfx) return;
    const base = 300 + combo * 80;
    // cascading bubble pop waterfall effect
    for (let i = 0; i < lines * 3; i++) {
      const delay = i * 0.055;
      const freq = base * Math.pow(1.15, i % 4);
      tone(freq, 0.13, "triangle", 0.28, delay);
      tone(freq * 1.5, 0.09, "sine", 0.16, delay + 0.01);
    }
    // candy crunch noise effect
    noise(0.24, 0.14);
  },
  combo(level: number) {
    if (!audioState.sfx) return;
    // sparkling major chime arpeggio
    const notes = [523, 659, 784, 1046, 1318]; // C major pentatonic
    notes.forEach((f, i) => {
      tone(f * Math.pow(1.08, level), 0.24, "sine", 0.16, i * 0.065);
    });
  },
  levelUp() {
    if (!audioState.sfx) return;
    // glorious major chords fanfare
    const chords = [
      [261, 329, 392], // C major
      [329, 392, 523], // E minor/C 1st inv
      [392, 523, 659], // G / C 2nd inv
      [523, 659, 784, 1046] // C major oct
    ];
    chords.forEach((chord, step) => {
      chord.forEach((f) => {
        tone(f, 0.42, "triangle", 0.13, step * 0.14);
      });
    });
  },
  gameOver() {
    if (!audioState.sfx) return;
    // sad descending chord progression
    const sadChords = [
      [392, 466, 587], // G minor
      [349, 440, 523], // F major
      [311, 392, 466], // Eb major
      [293, 349, 440]  // D minor
    ];
    sadChords.forEach((chord, step) => {
      chord.forEach((f) => {
        tone(f, 0.48, "sine", 0.14, step * 0.22);
      });
    });
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
