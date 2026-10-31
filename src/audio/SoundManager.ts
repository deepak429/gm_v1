// Web Audio API procedural sound synthesizer (zero external audio file dependencies)

export type MusicThemeCategory = 'fire' | 'frost' | 'shadow' | 'wind' | 'holy' | 'fortress' | 'desert';

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;

  private sfxVolume = 0.75;
  private musicVolume = 0.40;
  private muted = false;

  private musicSchedulerInterval: number | null = null;
  private musicPlaying = false;
  private nextBeatTime = 0;
  private currentStep = 0;

  // Real-time combat state for adaptive dynamic soundtrack
  private currentCategory: MusicThemeCategory = 'fortress';
  private playerHpRatio = 1.0;
  private enemyHpRatio = 1.0;
  private combo = 0;
  private isAiming = false;

  private bowDrawOsc: OscillatorNode | null = null;
  private bowDrawGain: GainNode | null = null;

  constructor() {
    // Un-suspend AudioContext on any user gesture immediately
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        if (!this.ctx) {
          this.initCtx();
        } else if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (!this.musicPlaying) {
          this.startMusic();
        }
      };

      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });

      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      });
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();

      // Gentle lowpass filter for atmospheric warmth and combat reactivity
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.setValueAtTime(14000, this.ctx.currentTime);
      this.musicFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.musicGain.connect(this.musicFilter);
      this.musicFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(sfx: number, music: number, muted: boolean) {
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.muted = muted;
    this.updateVolumes();
  }

  private updateVolumes() {
    if (!this.masterGain || !this.sfxGain || !this.musicGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, now);
    this.sfxGain.gain.setValueAtTime(this.sfxVolume, now);
    this.musicGain.gain.setValueAtTime(this.musicVolume, now);
  }

  // --- SOUND EFFECTS ---

  public playBowDraw(powerRatio: number) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // Subtle, gentle wooden creak with a brief natural decay (never drones forever)
    if (!this.bowDrawOsc) {
      const now = this.ctx.currentTime;
      this.bowDrawOsc = this.ctx.createOscillator();
      this.bowDrawGain = this.ctx.createGain();

      this.bowDrawOsc.type = 'triangle';
      this.bowDrawOsc.frequency.setValueAtTime(80 + powerRatio * 50, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, now);

      this.bowDrawGain.gain.setValueAtTime(0.012, now);
      this.bowDrawGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      this.bowDrawOsc.connect(filter);
      filter.connect(this.bowDrawGain);
      this.bowDrawGain.connect(this.sfxGain);

      this.bowDrawOsc.start(now);
      this.bowDrawOsc.stop(now + 0.38);

      setTimeout(() => {
        this.bowDrawOsc = null;
        this.bowDrawGain = null;
      }, 380);
    }
  }

  public stopBowDraw() {
    if (this.bowDrawOsc && this.bowDrawGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.bowDrawGain.gain.setValueAtTime(0.0001, now);
        this.bowDrawOsc.stop(now + 0.01);
      } catch {
        // already stopped
      }
      this.bowDrawOsc = null;
      this.bowDrawGain = null;
    }
  }

  public playBowRelease() {
    this.stopBowDraw();
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // 1. Sharp string slap against limb/brace (transient pop)
    const slap = this.ctx.createOscillator();
    const slapGain = this.ctx.createGain();
    slap.type = 'sine';
    slap.frequency.setValueAtTime(880, now);
    slap.frequency.exponentialRampToValueAtTime(140, now + 0.04);
    slapGain.gain.setValueAtTime(0.4, now);
    slapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    slap.connect(slapGain);
    slapGain.connect(this.sfxGain);
    slap.start(now);
    slap.stop(now + 0.045);

    // 2. Resonating bowstring twang (vibrating harmonic decay)
    const twang = this.ctx.createOscillator();
    const twangGain = this.ctx.createGain();
    twang.type = 'triangle';
    twang.frequency.setValueAtTime(520, now);
    twang.frequency.exponentialRampToValueAtTime(110, now + 0.18);
    twangGain.gain.setValueAtTime(0.32, now);
    twangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    twang.connect(twangGain);
    twangGain.connect(this.sfxGain);
    twang.start(now);
    twang.stop(now + 0.23);

    // 3. Arrow whipping cut through the air
    this.createNoiseBurst(0.14, 1800, 450, 0.32);
  }

  public playArrowWhistle() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // High frequency aerodynamic wind whistle over arrow fletchings
    const whistle = this.ctx.createOscillator();
    const wGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1650, now);
    whistle.frequency.linearRampToValueAtTime(1420, now + 0.18);
    wGain.gain.setValueAtTime(0.06, now);
    wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    whistle.connect(wGain);
    wGain.connect(this.sfxGain);
    whistle.start(now);
    whistle.stop(now + 0.19);
  }

  public playGroundElementalImpact(type: string) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (type === 'fire') {
      // Fiery ground combustion burst + crackling sizzle
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'triangle';
      boom.frequency.setValueAtTime(160, now);
      boom.frequency.exponentialRampToValueAtTime(35, now + 0.35);
      boomGain.gain.setValueAtTime(0.35, now);
      boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      boom.connect(boomGain);
      boomGain.connect(this.sfxGain);
      boom.start(now);
      boom.stop(now + 0.4);
      this.createNoiseBurst(0.28, 900, 240, 0.32);
    } else if (type === 'ice') {
      // Crystal shattering clink + deep freeze frost
      const clink = this.ctx.createOscillator();
      const clinkGain = this.ctx.createGain();
      clink.type = 'sine';
      clink.frequency.setValueAtTime(1420, now);
      clink.frequency.exponentialRampToValueAtTime(820, now + 0.22);
      clinkGain.gain.setValueAtTime(0.28, now);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      clink.connect(clinkGain);
      clinkGain.connect(this.sfxGain);
      clink.start(now);
      clink.stop(now + 0.26);
      this.createNoiseBurst(0.18, 2200, 700, 0.22);
    } else if (type === 'poison') {
      // Hissing bubbling venom splash
      const hiss = this.ctx.createOscillator();
      const hissGain = this.ctx.createGain();
      hiss.type = 'sawtooth';
      hiss.frequency.setValueAtTime(260, now);
      hiss.frequency.linearRampToValueAtTime(120, now + 0.25);
      hissGain.gain.setValueAtTime(0.22, now);
      hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      hiss.connect(hissGain);
      hissGain.connect(this.sfxGain);
      hiss.start(now);
      hiss.stop(now + 0.3);
      this.createNoiseBurst(0.25, 1400, 480, 0.28);
    } else if (type === 'arcane') {
      // Mystical cosmic bell shimmer
      const chord = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      chord.type = 'sine';
      chord.frequency.setValueAtTime(940, now);
      chord.frequency.exponentialRampToValueAtTime(470, now + 0.45);
      cGain.gain.setValueAtTime(0.3, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      chord.connect(cGain);
      cGain.connect(this.sfxGain);
      chord.start(now);
      chord.stop(now + 0.5);
    } else {
      // Solid wooden arrow stick into earth (quiver thud)
      const thud = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(220, now);
      thud.frequency.exponentialRampToValueAtTime(55, now + 0.12);
      tGain.gain.setValueAtTime(0.38, now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      thud.connect(tGain);
      tGain.connect(this.sfxGain);
      thud.start(now);
      thud.stop(now + 0.15);
      this.createNoiseBurst(0.08, 800, 300, 0.22);
    }
  }

  public playImpact(type: string, isHeadshot: boolean) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    if (isHeadshot) {
      // Metallic critical chime + heavy crack
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(1280, now);
      bell.frequency.exponentialRampToValueAtTime(860, now + 0.35);

      bellGain.gain.setValueAtTime(0.45, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      bell.connect(bellGain);
      bellGain.connect(this.sfxGain);
      bell.start(now);
      bell.stop(now + 0.4);

      // Extra punch
      this.createNoiseBurst(0.08, 2400, 600, 0.4);
    } else {
      // Flesh thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(140, now);
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.16);

      thudGain.gain.setValueAtTime(0.4, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      thud.connect(thudGain);
      thudGain.connect(this.sfxGain);
      thud.start(now);
      thud.stop(now + 0.2);
    }

    // Element specific sound
    if (type === 'fire') {
      this.playFireEffect();
    } else if (type === 'ice') {
      this.playIceEffect();
    } else if (type === 'poison') {
      this.playPoisonEffect();
    } else if (type === 'arcane') {
      this.playArcaneEffect();
    }
  }

  public playShieldBlock() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Metallic shield clang
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(320, now);
    osc1.frequency.exponentialRampToValueAtTime(110, now + 0.25);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(740, now);
    osc2.frequency.exponentialRampToValueAtTime(370, now + 0.3);

    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.32);
    osc2.stop(now + 0.32);
  }

  public playFireEffect() {
    // Whooshing flame explosion
    this.createNoiseBurst(0.28, 650, 150, 0.4);
  }

  public playIceEffect() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Glass / ice crystal shatter
    for (let i = 0; i < 3; i++) {
      const chime = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(900 + i * 420, now + i * 0.04);
      chime.frequency.exponentialRampToValueAtTime(400, now + 0.22 + i * 0.04);

      gain.gain.setValueAtTime(0.18, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.04);

      chime.connect(gain);
      gain.connect(this.sfxGain);
      chime.start(now + i * 0.04);
      chime.stop(now + 0.26 + i * 0.04);
    }
  }

  public playPoisonEffect() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Bubbling toxic hiss
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(480, now + 0.1);
    osc.frequency.linearRampToValueAtTime(180, now + 0.25);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playArcaneEffect() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Cosmic warp resonance
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2); // C6
    osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.45); // C4

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  public playDash() {
    this.initCtx();
    this.createNoiseBurst(0.18, 1800, 200, 0.3);
  }

  public playSlowMo(enter: boolean) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    if (enter) {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.35);
    } else {
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
    }

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  public playFinisherKill(isHeadshot: boolean) {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Heavy visceral bone-crunch & blood squelch
    const crunch = this.ctx.createOscillator();
    const crunchGain = this.ctx.createGain();
    crunch.type = 'sawtooth';
    crunch.frequency.setValueAtTime(isHeadshot ? 280 : 160, now);
    crunch.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    crunchGain.gain.setValueAtTime(0.55, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    crunch.connect(crunchGain);
    crunchGain.connect(this.sfxGain);
    crunch.start(now);
    crunch.stop(now + 0.32);

    // Deep sub-bass cinematic kill drop
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(95, now);
    sub.frequency.exponentialRampToValueAtTime(25, now + 0.45);

    subGain.gain.setValueAtTime(0.65, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.5);

    // Violent blood splatter noise
    this.createNoiseBurst(0.22, 1600, 180, 0.48);

    if (isHeadshot) {
      // Extra high-pitched metallic execution ring
      const ring = this.ctx.createOscillator();
      const ringGain = this.ctx.createGain();
      ring.type = 'sine';
      ring.frequency.setValueAtTime(1420, now);
      ring.frequency.exponentialRampToValueAtTime(900, now + 0.35);

      ringGain.gain.setValueAtTime(0.4, now);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      ring.connect(ringGain);
      ringGain.connect(this.sfxGain);
      ring.start(now);
      ring.stop(now + 0.4);
    }
  }

  public playHit() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Momentary low-pass muffle on damage for punchy cinematic impact
    if (this.musicFilter) {
      this.musicFilter.frequency.setValueAtTime(500, now);
      this.musicFilter.frequency.exponentialRampToValueAtTime(14000, now + 0.35);
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playCoin() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  public playVictory() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.42);
    });
  }

  public playDefeat() {
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;
    const notes = [392.0, 369.99, 329.63, 261.63]; // G F# E C
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.18;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + 0.38);
    });
  }

  // --- PROCEDURAL CINEMATIC FANTASY BGM ENGINE ---

  public setCombatMusicState(state: {
    themeCategory: MusicThemeCategory;
    playerHpRatio: number;
    enemyHpRatio: number;
    combo: number;
    isAiming: boolean;
  }) {
    this.currentCategory = state.themeCategory;
    this.playerHpRatio = state.playerHpRatio;
    this.enemyHpRatio = state.enemyHpRatio;
    this.combo = state.combo;
    this.isAiming = state.isAiming;

    if (!this.ctx || !this.musicFilter || !this.musicGain) return;
    const now = this.ctx.currentTime;

    // Smooth, gentle atmospheric filter reaction (no harsh transitions or ringing)
    let targetCutoff = 14000;
    let targetMusicVol = this.musicVolume;

    if (this.playerHpRatio < 0.35) {
      // Warm, cinematic low-health focus (softly rolls off high frequencies)
      targetCutoff = 900 + (this.playerHpRatio / 0.35) * 1800;
    } else if (this.isAiming) {
      // Subtle 25% focus ducking while pulling bowstring
      targetMusicVol *= 0.72;
      targetCutoff = 4800;
    }

    if (this.combo >= 3) {
      targetMusicVol = Math.min(1.0, targetMusicVol * 1.15);
    }

    this.musicFilter.frequency.setTargetAtTime(targetCutoff, now, 0.2);
    if (!this.muted) {
      this.musicGain.gain.setTargetAtTime(targetMusicVol, now, 0.15);
    }
  }

  public startMusic() {
    this.initCtx();
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    if (this.ctx) {
      this.nextBeatTime = this.ctx.currentTime + 0.05;
    }
    if (this.musicSchedulerInterval) {
      clearInterval(this.musicSchedulerInterval);
    }
    this.musicSchedulerInterval = window.setInterval(() => this.runMusicScheduler(), 50);
  }

  public stopMusic() {
    this.musicPlaying = false;
    if (this.musicSchedulerInterval) {
      clearInterval(this.musicSchedulerInterval);
      this.musicSchedulerInterval = null;
    }
  }

  private runMusicScheduler() {
    if (!this.musicPlaying) return;
    this.initCtx();
    if (!this.ctx || !this.musicGain) return;

    // Resync nextBeatTime if tab was in background or suspended
    if (this.nextBeatTime < this.ctx.currentTime) {
      this.nextBeatTime = this.ctx.currentTime + 0.04;
    }

    const scheduleAheadTime = 0.35; // 350ms lookahead for clean, gapless playback
    const stepDuration = 0.55; // Spacious, relaxing, noble fantasy rhythm (approx 109 BPM quarter notes)

    while (this.nextBeatTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleBarBeat(this.nextBeatTime, this.currentStep);
      this.nextBeatTime += stepDuration;
      this.currentStep = (this.currentStep + 1) % 16;
    }
  }

  // Spacious, warm, organic fantasy music bar scheduler
  private scheduleBarBeat(time: number, step: number) {
    if (!this.ctx || !this.musicGain) return;

    // 1. Gentle Low-Health Heartbeat Thud (Soft, warm low sine wave on beats 0 & 2 only when HP < 35%)
    if (this.playerHpRatio < 0.35 && (step % 4 === 0 || step % 4 === 1)) {
      this.playGentleHeartbeat(time, step % 4 === 1);
    }

    // 2. Downbeat Cinematic Taiko/Tom Drum (Deep, warm acoustic resonance on main measure downbeats)
    if (step % 4 === 0) {
      this.playWarmCinematicTom(time, step === 0);
    }

    // 3. Category Melodic Themes (Gentle plucked acoustic harp/lute and warm strings)
    const chordStep = Math.floor(step / 2); // Changes every 2 beats (1.1s)

    switch (this.currentCategory) {
      case 'fire': {
        // Warm Spanish Lute & Cello Pad (D minor / Phrygian)
        const roots = [146.83, 174.61, 155.56, 146.83]; // D3, F3, Eb3, D3
        const r = roots[chordStep % roots.length];
        if (step % 2 === 0) {
          this.playWarmStringPad(time, r / 2, 1.2, 0.06);
          this.playPluckedLute(time, r, 0.7, 0.045);
        } else {
          this.playPluckedLute(time, r * 1.5, 0.5, 0.035);
        }
        break;
      }

      case 'frost': {
        // Ethereal Crystal Harp & Winter Drone (A minor)
        const roots = [110.0, 130.81, 164.81, 146.83]; // A2, C3, E3, D3
        const r = roots[chordStep % roots.length];
        if (step % 2 === 0) {
          this.playWarmStringPad(time, r, 1.3, 0.05);
          this.playCrystalBell(time, r * 3, 0.9, 0.035);
        } else {
          this.playCrystalBell(time, r * 2.5, 0.8, 0.03);
        }
        break;
      }

      case 'shadow': {
        // Deep Atmospheric Cello & Mysterious Pluck (C minor)
        const roots = [130.81, 155.56, 174.61, 130.81]; // C3, Eb3, F3, C3
        const r = roots[chordStep % roots.length];
        if (step % 2 === 0) {
          this.playWarmStringPad(time, r / 2, 1.3, 0.06);
          this.playPluckedLute(time, r, 0.8, 0.04);
        }
        break;
      }

      case 'wind': {
        // Gentle Wooden Flute & Elven Acoustic Arpeggios (G major)
        const roots = [196.0, 246.94, 293.66, 220.0]; // G3, B3, D4, A3
        const r = roots[chordStep % roots.length];
        if (step % 2 === 0) {
          this.playWarmStringPad(time, r / 2, 1.2, 0.05);
          this.playWoodenFlute(time, r, 0.65, 0.04);
        } else {
          this.playWoodenFlute(time, r * 1.25, 0.6, 0.035);
        }
        break;
      }

      case 'holy': {
        // Cathedral Organ Warm Fifths & Radiant Chimes (F major)
        const roots = [174.61, 220.0, 261.63, 174.61]; // F3, A3, C4, F3
        const r = roots[chordStep % roots.length];
        if (step % 2 === 0) {
          this.playWarmStringPad(time, r / 2, 1.3, 0.065);
          this.playCrystalBell(time, r * 2, 0.9, 0.04);
        }
        break;
      }

      case 'fortress':
      default: {
        // Noble Citadel Horn Pad & Stalwart Battle Lute (D minor)
        const roots = [146.83, 174.61, 196.0, 220.0]; // D3, F3, G3, A3
        const r = roots[chordStep % roots.length];
        if (step % 2 === 0) {
          this.playWarmStringPad(time, r / 2, 1.25, 0.06);
          this.playPluckedLute(time, r, 0.7, 0.045);
        } else {
          this.playPluckedLute(time, r * 1.5, 0.6, 0.035);
        }
        break;
      }
    }

    // 4. Combo Flourish (gentle high bell chime on upbeat when combo >= 3)
    if (this.combo >= 3 && step % 4 === 2) {
      this.playCrystalBell(time, 880.0, 0.6, 0.025);
    }
  }

  // --- CLEAN, NATURAL SYNTHESIS INSTRUMENTS ---

  // Deep, warm acoustic taiko/tom downbeat
  private playWarmCinematicTom(time: number, isAccent: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const startF = isAccent ? 85 : 70;
    const endF = isAccent ? 32 : 36;
    osc.frequency.setValueAtTime(startF, time);
    osc.frequency.exponentialRampToValueAtTime(endF, time + 0.14);

    const vol = isAccent ? 0.16 : 0.11;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.26);
  }

  // Soft low-health heartbeat thud (warm, physical, non-piercing)
  private playGentleHeartbeat(time: number, isSecondThump: boolean) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const f = isSecondThump ? 58 : 46;
    osc.frequency.setValueAtTime(f, time);
    osc.frequency.exponentialRampToValueAtTime(28, time + 0.09);

    const vol = isSecondThump ? 0.14 : 0.10;
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.16);
  }

  // Warm orchestral cello/string pad chord
  private playWarmStringPad(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, time);

    // Smooth orchestral attack and warm long decay
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.05);
  }

  // Plucked medieval lute/harp note
  private playPluckedLute(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + duration);

    // Natural plucked envelope
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.04);
  }

  // Soft wooden flute note with gentle breath vibrato
  private playWoodenFlute(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Soft 5Hz vibrato
    const vib = this.ctx.createOscillator();
    const vibG = this.ctx.createGain();
    vib.frequency.setValueAtTime(4.8, time);
    vibG.gain.setValueAtTime(3.5, time);
    vib.connect(vibG);
    vibG.connect(osc.frequency);
    vib.start(time);
    vib.stop(time + duration);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.04);
  }

  // Pure shimmering crystal chime
  private playCrystalBell(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.04);
  }

  private createNoiseBurst(duration: number, startFreq: number, endFreq: number, volume: number) {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    whiteNoise.start(now);
  }
}

export const soundManager = new SoundManager();
