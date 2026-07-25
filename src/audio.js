
class SoundManager {
  constructor() {
    this.ctx = null;
    this.bgmInterval = null;
    this.isMuted = false;
    this.bgmPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    this.init();
    this.resume();
    if (this.isMuted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playPlace() {
    this.init();
    this.resume();
    if (this.isMuted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.setValueAtTime(110, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playBlast() {
    this.init();
    this.resume();
    if (this.isMuted || !this.ctx) return;

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.start();
    osc2.start();
    osc.stop(this.ctx.currentTime + 0.3);
    osc2.stop(this.ctx.currentTime + 0.3);
  }

  playCombo(comboCount) {
    this.init();
    this.resume();
    if (this.isMuted || !this.ctx) return;

    const frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25];
    const index = Math.min(comboCount - 1, frequencies.length - 1);
    const baseFreq = frequencies[index];

    const playChime = (freq, delay, volume) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0, this.ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + 0.5);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.6);
    };

    playChime(baseFreq, 0, 0.25);
    playChime(baseFreq * 1.5, 0.06, 0.15);
    playChime(baseFreq * 2, 0.12, 0.1);
  }

  playWin() {
    this.init();
    this.resume();
    if (this.isMuted || !this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const delay = idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.3);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.35);
    });
  }

  playLose() {
    this.init();
    this.resume();
    if (this.isMuted || !this.ctx) return;

    const notes = [207.65, 196.00, 185.00, 174.61];
    notes.forEach((freq, idx) => {
      const delay = idx * 0.18;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
      osc.frequency.linearRampToValueAtTime(freq - 15, this.ctx.currentTime + delay + 0.15);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + delay + 0.2);
      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + 0.22);
    });
  }

  startBGM() {
    this.init();
    this.resume();
    if (this.isMuted || !this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;

    let step = 0;
    const tempo = 0.22;
    const progression = [
      [261.63, 329.63, 392.00],
      [196.00, 246.94, 293.66],
      [220.00, 261.63, 329.63],
      [174.61, 220.00, 261.63]
    ];
    const melody = [
      329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66,
      329.63, 329.63, 392.00, 523.25, 587.33, 523.25, 659.25, 0,
      440.00, 523.25, 440.00, 392.00, 329.63, 293.66, 261.63, 220.00,
      261.63, 293.66, 329.63, 392.00, 293.66, 0, 261.63, 0
    ];

    const playStep = () => {
      if (!this.bgmPlaying || this.isMuted) return;
      const measure = Math.floor(step / 8) % 4;
      const beat = step % 8;
      const chord = progression[measure];

      if (beat === 0 || beat === 4) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(chord[0] / 2, this.ctx.currentTime);
        bassGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + tempo * 2.5);
        bassOsc.start();
        bassOsc.stop(this.ctx.currentTime + tempo * 2.5);
      }

      if (beat % 2 === 0) {
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        padOsc.connect(padGain);
        padGain.connect(this.ctx.destination);
        padOsc.type = 'sine';
        const note = chord[Math.floor(beat / 2) % chord.length];
        padOsc.frequency.setValueAtTime(note, this.ctx.currentTime);
        padGain.gain.setValueAtTime(0.03, this.ctx.currentTime);
        padGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + tempo * 1.8);
        padOsc.start();
        padOsc.stop(this.ctx.currentTime + tempo * 1.8);
      }

      const melodyNote = melody[step % melody.length];
      if (melodyNote > 0) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.connect(melGain);
        melGain.connect(this.ctx.destination);
        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melodyNote, this.ctx.currentTime);
        melGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        melGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + tempo * 1.2);
        melOsc.start();
        melOsc.stop(this.ctx.currentTime + tempo * 1.2);
      }

      step++;
    };

    this.bgmInterval = setInterval(playStep, tempo * 1000);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }
}

export const sound = new SoundManager();
