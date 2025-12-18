
let audioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

const createOscillator = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const sounds = {
  init: initAudio,

  // Short blip for hover
  hover: () => {
    initAudio();
    createOscillator(880, 'square', 0.05, 0.02);
  },

  // Crisp click for buttons
  click: () => {
    initAudio();
    createOscillator(440, 'square', 0.1, 0.05);
    setTimeout(() => createOscillator(220, 'square', 0.1, 0.03), 20);
  },

  // Mechanical terminal type sound
  type: () => {
    initAudio();
    if (!audioCtx) return;
    const duration = 0.02;
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    noise.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start();
  },

  // Retro success sequence
  success: () => {
    initAudio();
    const now = audioCtx?.currentTime || 0;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => createOscillator(freq, 'square', 0.15, 0.04), i * 100);
    });
  },

  // Heavy mechanical keyboard sound
  keyboard: () => {
    initAudio();
    if (!audioCtx) return;

    // Key click (high snap)
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(t + 0.05);

    // Mechanical thud (low impact)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(150, t);
    osc2.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain2.gain.setValueAtTime(0.03, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc2.start();
    osc2.stop(t + 0.08);
  }
};
