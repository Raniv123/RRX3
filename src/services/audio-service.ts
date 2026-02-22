// שירות מוזיקה אמביינטית דינמית — Web Audio API בלבד, ללא קבצים חיצוניים

// --- סוגים פנימיים ---

type Phase = 'ICE' | 'WARM' | 'HOT' | 'FIRE';
type ScenarioId =
  | 'massage-therapist'
  | 'boss-assistant'
  | 'doctor-patient'
  | 'yoga-instructor'
  | 'photographer-model';

interface PhaseConfig {
  // תדרי אקורד (Hz)
  chordFreqs: number[];
  // עוצמת אקורד
  chordAmp: number;
  // סוג גל (oscilator)
  waveType: OscillatorType;
  // תדר noise filter (Hz)
  noiseFilterFreq: number;
  // סוג filter
  noiseFilterType: BiquadFilterType;
  // Q ל-bandpass
  noiseFilterQ: number;
  // עוצמת noise
  noiseAmp: number;
  // מהירות LFO (Hz)
  lfoRate: number;
  // עומק LFO
  lfoDepth: number;
  // האם להוסיף distortion קל
  distortion: boolean;
}

// --- הגדרות פרופילי שלב ---

const PHASE_CONFIGS: Record<Phase, PhaseConfig> = {
  ICE: {
    // Fmaj7: F3 + A3 + C4 + E4
    chordFreqs: [174.61, 220.0, 261.63, 329.63],
    chordAmp: 0.018,
    waveType: 'sine',
    noiseFilterFreq: 400,
    noiseFilterType: 'lowpass',
    noiseFilterQ: 1.0,
    noiseAmp: 0.006,
    lfoRate: 0.1,
    lfoDepth: 0.008,
    distortion: false,
  },
  WARM: {
    // D7: D3 + F#3 + A3 + C4
    chordFreqs: [146.83, 185.0, 220.0, 261.63],
    chordAmp: 0.024,
    waveType: 'sine',
    noiseFilterFreq: 600,
    noiseFilterType: 'lowpass',
    noiseFilterQ: 1.0,
    noiseAmp: 0.009,
    lfoRate: 0.2,
    lfoDepth: 0.012,
    distortion: false,
  },
  HOT: {
    // Am add9: A2 + E3 + G3 + C#4
    chordFreqs: [110.0, 164.81, 196.0, 277.18],
    chordAmp: 0.03,
    waveType: 'sawtooth',
    noiseFilterFreq: 800,
    noiseFilterType: 'bandpass',
    noiseFilterQ: 2.0,
    noiseAmp: 0.011,
    lfoRate: 0.4,
    lfoDepth: 0.016,
    distortion: true,
  },
  FIRE: {
    // Cm7: C2 + G2 + Bb2 + Eb3
    chordFreqs: [65.41, 98.0, 116.54, 155.56],
    chordAmp: 0.036,
    waveType: 'sawtooth',
    noiseFilterFreq: 1200,
    noiseFilterType: 'bandpass',
    noiseFilterQ: 1.5,
    noiseAmp: 0.015,
    lfoRate: 0.6,
    lfoDepth: 0.022,
    distortion: true,
  },
};

// --- עזרים ---

// יצירת buffer של white noise
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// יצירת waveshaper curve לdistortion עדין
function createDistortionCurve(amount: number): Float32Array {
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// --- ממשק AudioPatch: אוסף של nodes שניתן לנקות ---

interface AudioPatch {
  nodes: AudioNode[];
  gainNode: GainNode;
}

// --- AudioService ---

export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private patches: AudioPatch[] = [];
  private enabled = false;
  private currentProfile = '';
  private fadeTimeout: ReturnType<typeof setTimeout> | null = null;

  // --- אתחול (חייב להיקרא אחרי gesture מהמשתמש) ---

  init(): void {
    if (this.ctx) return; // לא ליצור פעמיים

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.15; // volume master — מאוד שקט ברקע
    this.masterGain.connect(this.ctx.destination);
  }

  // --- ניגון פרופיל (scenarioId + phase) ---

  play(scenarioId: string, phase: string): void {
    if (!this.enabled) return;
    if (!this.ctx || !this.masterGain) return;

    const profileKey = `${scenarioId}__${phase}`;
    if (this.currentProfile === profileKey) return; // כבר מנגן

    this.currentProfile = profileKey;
    this._buildProfile(scenarioId as ScenarioId, phase as Phase);
  }

  // --- מעבר חלק — fade out ואז fade in ---

  transition(scenarioId: string, phase: string): void {
    if (!this.ctx || !this.masterGain) return;

    const profileKey = `${scenarioId}__${phase}`;
    if (this.currentProfile === profileKey) return;

    // ביטול fade שעדיין רץ
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }

    // fade out — 2 שניות
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 2);

    // אחרי fade out — נקה ובנה פרופיל חדש
    this.fadeTimeout = setTimeout(() => {
      this._stopAllPatches();
      this.currentProfile = profileKey;

      if (this.enabled && this.ctx && this.masterGain) {
        this._buildProfile(scenarioId as ScenarioId, phase as Phase);

        // fade in — 2 שניות
        const t = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(t);
        this.masterGain.gain.setValueAtTime(0, t);
        this.masterGain.gain.linearRampToValueAtTime(0.15, t + 2);
      }
    }, 2100);
  }

  // --- מצב mission ---

  setMissionMood(intensity: 'soft' | 'intense'): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    if (intensity === 'soft') {
      // הורד עוצמה כללית
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.06, now + 1.5);
    } else {
      // עלה עוצמה — intensify
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.22, now + 1.5);

      // האץ את כל ה-LFO הקיימים
      for (const patch of this.patches) {
        // LFO nodes הם OscillatorNode — מזהים לפי type
        for (const node of patch.nodes) {
          if (node instanceof OscillatorNode) {
            const current = node.frequency.value;
            // LFO טיפוסי הוא תחת 2Hz
            if (current < 2) {
              node.frequency.setTargetAtTime(current * 1.5, this.ctx.currentTime, 0.5);
            }
          }
        }
      }
    }
  }

  // --- toggle on/off ---

  toggle(): boolean {
    this.enabled = !this.enabled;

    if (this.enabled) {
      if (!this.ctx) this.init();
      if (this.currentProfile) {
        const [scenarioId, phase] = this.currentProfile.split('__');
        this._buildProfile(scenarioId as ScenarioId, phase as Phase);

        if (this.ctx && this.masterGain) {
          const now = this.ctx.currentTime;
          this.masterGain.gain.cancelScheduledValues(now);
          this.masterGain.gain.setValueAtTime(0, now);
          this.masterGain.gain.linearRampToValueAtTime(0.15, now + 2);
        }
      }
    } else {
      // fade out ועצירה
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
        this.masterGain.gain.linearRampToValueAtTime(0, now + 2);

        this.fadeTimeout = setTimeout(() => {
          this._stopAllPatches();
          this.currentProfile = '';
        }, 2100);
      }
    }

    return this.enabled;
  }

  // --- getter ---

  get isEnabled(): boolean {
    return this.enabled;
  }

  // --- ניקוי מלא ---

  destroy(): void {
    this._stopAllPatches();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
    }
    this.enabled = false;
    this.currentProfile = '';
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
  }

  // --- בנייה פנימית של פרופיל קול ---

  private _buildProfile(scenarioId: ScenarioId, phase: Phase): void {
    if (!this.ctx || !this.masterGain) return;

    const config = PHASE_CONFIGS[phase];
    if (!config) return;

    // 1. PAD — אקורד מיתרים
    const padPatch = this._buildPad(config);
    if (padPatch) this.patches.push(padPatch);

    // 2. NOISE — רחש אמביינטי
    const noisePatch = this._buildNoise(config);
    if (noisePatch) this.patches.push(noisePatch);

    // 3. modifier לפי תרחיש
    this._applyScenarioModifier(scenarioId, phase, config);
  }

  // בניית pad (אקורד)
  private _buildPad(config: PhaseConfig): AudioPatch | null {
    if (!this.ctx || !this.masterGain) return null;

    const nodes: AudioNode[] = [];
    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0, this.ctx.currentTime);
    padGain.gain.linearRampToValueAtTime(config.chordAmp, this.ctx.currentTime + 2);
    padGain.connect(this.masterGain);
    nodes.push(padGain);

    // Distortion (אם צריך)
    let distortionNode: WaveShaperNode | null = null;
    if (config.distortion) {
      distortionNode = this.ctx.createWaveShaper();
      distortionNode.curve = createDistortionCurve(30);
      distortionNode.oversample = '2x';
      distortionNode.connect(padGain);
      nodes.push(distortionNode);
    }

    const target = distortionNode ?? padGain;

    // oscillator per note
    for (const freq of config.chordFreqs) {
      const osc = this.ctx.createOscillator();
      osc.type = config.waveType;
      osc.frequency.value = freq;

      // detuning קל לעושר
      osc.detune.value = (Math.random() - 0.5) * 8;

      // LFO לtremolo
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = config.lfoRate + (Math.random() - 0.5) * 0.05;
      lfoGain.gain.value = config.lfoDepth;

      const oscGain = this.ctx.createGain();
      oscGain.gain.value = config.chordAmp / config.chordFreqs.length;

      lfo.connect(lfoGain);
      lfoGain.connect(oscGain.gain);
      osc.connect(oscGain);
      oscGain.connect(target);

      osc.start();
      lfo.start();

      nodes.push(osc, lfo, lfoGain, oscGain);
    }

    return { nodes, gainNode: padGain };
  }

  // בניית noise
  private _buildNoise(config: PhaseConfig): AudioPatch | null {
    if (!this.ctx || !this.masterGain) return null;

    const nodes: AudioNode[] = [];

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);
    noiseGain.gain.linearRampToValueAtTime(config.noiseAmp, this.ctx.currentTime + 2);
    noiseGain.connect(this.masterGain);
    nodes.push(noiseGain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = config.noiseFilterType;
    filter.frequency.value = config.noiseFilterFreq;
    filter.Q.value = config.noiseFilterQ;
    filter.connect(noiseGain);
    nodes.push(filter);

    const noiseBuffer = createNoiseBuffer(this.ctx);
    const source = this.ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;
    source.connect(filter);
    source.start();
    nodes.push(source);

    // FIRE — noise רחב יותר עם שכבה שנייה
    if (config.noiseFilterType === 'bandpass') {
      const filter2 = this.ctx.createBiquadFilter();
      filter2.type = 'highpass';
      filter2.frequency.value = 300;
      filter2.Q.value = 0.7;

      const gain2 = this.ctx.createGain();
      gain2.gain.value = config.noiseAmp * 0.4;
      gain2.connect(this.masterGain);

      const source2 = this.ctx.createBufferSource();
      source2.buffer = createNoiseBuffer(this.ctx);
      source2.loop = true;
      source2.connect(filter2);
      filter2.connect(gain2);
      source2.start();

      nodes.push(filter2, gain2, source2);
    }

    return { nodes, gainNode: noiseGain };
  }

  // modifiers לפי תרחיש
  private _applyScenarioModifier(
    scenarioId: ScenarioId,
    phase: Phase,
    _config: PhaseConfig
  ): void {
    if (!this.ctx || !this.masterGain) return;

    switch (scenarioId) {
      case 'massage-therapist':
        this._addSparkle();
        break;

      case 'yoga-instructor':
        this._addPentatonicTones(phase);
        break;

      case 'boss-assistant':
        this._addCityHum();
        break;

      case 'photographer-model':
        this._addShutterTick();
        break;

      case 'doctor-patient':
        // ללא modifier — קר ונקי
        break;
    }
  }

  // sparkle — תחושת ספא
  private _addSparkle(): void {
    if (!this.ctx || !this.masterGain) return;

    const nodes: AudioNode[] = [];
    const freqs = [2000, 3000, 4200];

    const sparkleGain = this.ctx.createGain();
    sparkleGain.gain.value = 0.004;
    sparkleGain.connect(this.masterGain);
    nodes.push(sparkleGain);

    for (const freq of freqs) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 15;

      // LFO עדין מאוד
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = 0.07 + Math.random() * 0.05;
      lfoGain.gain.value = 0.002;
      lfo.connect(lfoGain);
      lfoGain.connect(sparkleGain.gain);

      osc.connect(sparkleGain);
      osc.start();
      lfo.start();

      nodes.push(osc, lfo, lfoGain);
    }

    this.patches.push({ nodes, gainNode: sparkleGain });
  }

  // pentatonic tones — יוגה
  private _addPentatonicTones(phase: Phase): void {
    if (!this.ctx || !this.masterGain) return;

    // סקאלה פנטטונית: C, D, E, G, A
    const pentatonic: Record<Phase, number[]> = {
      ICE:  [261.63, 293.66, 329.63, 392.0, 440.0],         // אוקטבה 4
      WARM: [130.81, 146.83, 164.81, 196.0, 220.0],          // אוקטבה 3
      HOT:  [65.41, 73.42, 82.41, 98.0, 110.0],              // אוקטבה 2
      FIRE: [65.41, 73.42, 82.41, 98.0, 110.0],              // אוקטבה 2 עמוקה
    };

    const freqs = pentatonic[phase];
    const nodes: AudioNode[] = [];

    const yogaGain = this.ctx.createGain();
    yogaGain.gain.value = 0.01;
    yogaGain.connect(this.masterGain);
    nodes.push(yogaGain);

    // ניגון תנים בסדר אקראי עם delay ארוך
    let noteIndex = 0;
    const playNext = (): void => {
      if (!this.ctx || !this.masterGain) return;

      const freq = freqs[noteIndex % freqs.length];
      noteIndex++;

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const envGain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      envGain.gain.setValueAtTime(0, now);
      envGain.gain.linearRampToValueAtTime(0.012, now + 0.5);
      envGain.gain.linearRampToValueAtTime(0, now + 4);

      osc.connect(envGain);
      envGain.connect(yogaGain);
      osc.start(now);
      osc.stop(now + 4.5);

      nodes.push(osc, envGain);

      // הבא — כל 6-10 שניות
      const delay = 6000 + Math.random() * 4000;
      setTimeout(playNext, delay);
    };

    // התחל אחרי 2 שניות
    setTimeout(playNext, 2000);

    this.patches.push({ nodes, gainNode: yogaGain });
  }

  // city hum — boss/office
  private _addCityHum(): void {
    if (!this.ctx || !this.masterGain) return;

    const nodes: AudioNode[] = [];
    const humGain = this.ctx.createGain();
    humGain.gain.value = 0.007;
    humGain.connect(this.masterGain);
    nodes.push(humGain);

    const humFreqs = [60, 120, 180];

    for (const freq of humFreqs) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const oscGain = this.ctx.createGain();
      oscGain.gain.value = 1 / humFreqs.length;

      osc.connect(oscGain);
      oscGain.connect(humGain);
      osc.start();

      nodes.push(osc, oscGain);
    }

    this.patches.push({ nodes, gainNode: humGain });
  }

  // shutter tick — photographer
  private _addShutterTick(): void {
    if (!this.ctx || !this.masterGain) return;

    const nodes: AudioNode[] = [];
    const tickGain = this.ctx.createGain();
    tickGain.gain.value = 0.0; // מתחיל שקט, נוצר per tick
    tickGain.connect(this.masterGain);
    nodes.push(tickGain);

    const bpm = 120;
    const interval = (60 / bpm) * 1000; // 500ms

    const tick = (): void => {
      if (!this.ctx || !this.masterGain) return;

      // click קצר מאוד — noise burst
      const clickBuffer = this.ctx.createBuffer(1, 512, this.ctx.sampleRate);
      const data = clickBuffer.getChannelData(0);
      for (let i = 0; i < 512; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
      }

      const clickSrc = this.ctx.createBufferSource();
      clickSrc.buffer = clickBuffer;

      const clickGain = this.ctx.createGain();
      clickGain.gain.value = 0.025;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3000;

      clickSrc.connect(filter);
      filter.connect(clickGain);
      clickGain.connect(this.masterGain);
      clickSrc.start();

      nodes.push(clickSrc, clickGain, filter);

      setTimeout(tick, interval);
    };

    // התחל אחרי רנדום delay קטן
    setTimeout(tick, Math.random() * 500);

    this.patches.push({ nodes, gainNode: tickGain });
  }

  // --- ניקוי כל ה-patches ---

  private _stopAllPatches(): void {
    for (const patch of this.patches) {
      for (const node of patch.nodes) {
        try {
          if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
            node.stop();
          }
          node.disconnect();
        } catch {
          // node ייתכן שכבר הופסק
        }
      }
    }
    this.patches = [];
  }
}

// --- singleton ---
export default new AudioService();
