let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext => {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.15, delay = 0) => {
  try {
    const ctx = getCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  } catch {}
};

export const SoundsRaw = {
  click: () => playTone(440, 0.08, 'square', 0.1),
  success: () => {
    playTone(523, 0.1, 'square', 0.12, 0);
    playTone(659, 0.1, 'square', 0.12, 0.1);
    playTone(784, 0.15, 'square', 0.12, 0.2);
  },
  error: () => {
    playTone(200, 0.15, 'sawtooth', 0.15, 0);
    playTone(150, 0.15, 'sawtooth', 0.15, 0.15);
  },
  itemComplete: () => {
    [392, 494, 587, 698].forEach((freq, i) => playTone(freq, 0.12, 'square', 0.12, i * 0.08));
  },
  projectComplete: () => {
    const notes: [number, number][] = [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.5], [784, 0.7], [880, 0.85], [1047, 1.0]];
    notes.forEach(([freq, delay]) => playTone(freq, 0.2, 'square', 0.18, delay));
  },
  copy: () => playTone(880, 0.06, 'sine', 0.08),
  join: () => {
    playTone(660, 0.1, 'sine', 0.12, 0);
    playTone(880, 0.15, 'sine', 0.12, 0.1);
  },
  navigate: () => {
    playTone(300, 0.15, 'sine', 0.08, 0);
    playTone(400, 0.1, 'sine', 0.08, 0.08);
  },
  dismiss: () => playTone(220, 0.06, 'square', 0.05),
  modalOpen: () => playTone(600, 0.1, 'sine', 0.08),
};

let muted = false;
export const setSoundMuted = (val: boolean) => { muted = val; };
export const isSoundMuted = () => muted;

type SoundKeys = keyof typeof SoundsRaw;
export const Sounds = {} as Record<SoundKeys, () => void>;
(Object.keys(SoundsRaw) as SoundKeys[]).forEach((key) => {
  Sounds[key] = (...args: any[]) => { if (!muted) (SoundsRaw[key] as any)(...args); };
});
