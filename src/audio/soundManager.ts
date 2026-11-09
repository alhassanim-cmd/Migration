// Web Audio API Sound Synthesizer & Dynamic Music Engine for DeadZone: Last Stand

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isMuted: boolean = false;
  private masterVol: number = 0.8;
  private musicVol: number = 0.5;
  private sfxVol: number = 0.8;

  // Music state
  private currentTrack: 'none' | 'menu' | 'ambient' | 'horde' | 'boss' = 'none';
  private musicInterval: any = null;
  private musicStep: number = 0;
  private xpChimeIndex: number = 0;
  private lastXpTime: number = 0;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with mobile autoplay policies
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported or error initializing:', e);
    }
  }

  private ensureContext(): boolean {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return !!this.ctx;
  }

  public setVolumes(master: number, music: number, sfx: number) {
    this.masterVol = Math.max(0, Math.min(1, master));
    this.musicVol = Math.max(0, Math.min(1, music));
    this.sfxVol = Math.max(0, Math.min(1, sfx));

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.masterGain) this.masterGain.gain.setValueAtTime(this.masterVol, now);
      if (this.musicGain) this.musicGain.gain.setValueAtTime(this.musicVol, now);
      if (this.sfxGain) this.sfxGain.gain.setValueAtTime(this.sfxVol, now);
    }
  }

  // --- Sound Effects Synthesizer ---

  public playPistol() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Click snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);

    // Punch noise
    this.playNoise(0.06, 800, 0.35);
  }

  public playAssaultRifle() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.07);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.07);

    this.playNoise(0.05, 1400, 0.4);
  }

  public playShotgun() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Deep boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.22);

    this.playNoise(0.18, 600, 0.6);
  }

  public playSMG() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(750, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);

    this.playNoise(0.04, 1800, 0.3);
  }

  public playSniper() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Resonant rail whip
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(120, now);
    osc2.frequency.exponentialRampToValueAtTime(30, now + 0.4);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.4);
    osc2.stop(now + 0.4);

    this.playNoise(0.25, 1200, 0.5);
  }

  public playFlamethrower() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    this.playNoise(0.12, 450, 0.28, 'lowpass');
  }

  public playDash() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);

    this.playNoise(0.15, 700, 0.25);
  }

  public playHurt() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playXpPickup() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Reset pitch if pause between pickups is > 0.4s
    if (now - this.lastXpTime > 0.4) {
      this.xpChimeIndex = 0;
    }
    this.lastXpTime = now;

    // Pentatonic scale notes
    const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const freq = freqs[this.xpChimeIndex % freqs.length];
    this.xpChimeIndex++;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playLevelUp() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C Major chord

    chords.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.28, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startT);
      osc.stop(startT + 0.4);
    });
  }

  public playEvolution() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startT = now + i * 0.06;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startT);

      gain.gain.setValueAtTime(0.3, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startT);
      osc.stop(startT + 0.6);
    });
  }

  public playExplosion() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.5);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    this.playNoise(0.45, 500, 0.7);
  }

  public playZombieGroan() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(95 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playBossWarning() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Double siren pulse
    [0, 0.25, 0.5].forEach((offset) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + offset;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.linearRampToValueAtTime(320, t + 0.2);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public playAbilityShockwave() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playLightning() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);

    this.playNoise(0.12, 1600, 0.4);
  }

  public playClick() {
    if (!this.ensureContext() || !this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Noise generator utility for shots/impacts
  private playNoise(duration: number, filterFreq: number = 1000, volume: number = 0.3, filterType: BiquadFilterType = 'lowpass') {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  // --- Dynamic Procedural Synth Soundtrack Engine ---
  // Generates dark synthwave rhythm beats and bassline for high tension survival

  public startMusic(track: 'menu' | 'ambient' | 'horde' | 'boss') {
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;

    if (!this.ensureContext()) return;

    const tempo = track === 'boss' ? 145 : track === 'horde' ? 130 : track === 'menu' ? 100 : 110;
    const stepTimeMs = (60 / tempo / 4) * 1000; // 16th notes

    this.musicStep = 0;
    this.musicInterval = setInterval(() => {
      this.tickMusic(track);
      this.musicStep = (this.musicStep + 1) % 16;
    }, stepTimeMs);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentTrack = 'none';
  }

  private tickMusic(track: 'menu' | 'ambient' | 'horde' | 'boss') {
    if (!this.ctx || !this.musicGain || this.musicVol <= 0.01) return;
    const now = this.ctx.currentTime;
    const step = this.musicStep;

    // Kick drum on beats 0, 4, 8, 12
    if (step % 4 === 0 && (track === 'horde' || track === 'boss' || (track === 'menu' && step === 0))) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.12);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.12);
    }

    // Hi-hat closed on off-beats
    if ((step % 2 === 1 || step % 4 === 2) && (track === 'horde' || track === 'boss')) {
      const bufSize = Math.floor(this.ctx.sampleRate * 0.03);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

      const src = this.ctx.createBufferSource();
      src.buffer = buf;

      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.setValueAtTime(7000, now);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(step % 4 === 2 ? 0.2 : 0.1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      src.connect(f);
      f.connect(g);
      g.connect(this.musicGain);
      src.start(now);
      src.stop(now + 0.03);
    }

    // Dark Synth Bassline (root notes depending on mode)
    const baseFreqs = track === 'boss' ? [73.42, 73.42, 82.41, 65.41] // D2, D2, E2, C2
      : track === 'horde' ? [55.0, 55.0, 65.41, 49.0] // A1, A1, C2, G1
      : [65.41, 65.41, 73.42, 55.0]; // C2, C2, D2, A1

    const bar = Math.floor(step / 4);
    const root = baseFreqs[bar % baseFreqs.length];

    if (step % 2 === 0) {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = track === 'boss' ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(root, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(track === 'boss' ? 900 : 500, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.18);

      gain.gain.setValueAtTime(track === 'boss' ? 0.28 : 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    // Eerie Tension Arpeggio (every 4 steps for atmospheric vibe)
    if (step % 4 === 0) {
      const arps = [220, 261.63, 329.63, 392.00, 440, 523.25];
      const note = arps[(step + bar) % arps.length];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  }
}

export const soundManager = new SoundManager();
