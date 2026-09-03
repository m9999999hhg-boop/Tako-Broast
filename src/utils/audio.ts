// Web Audio API generator for authentic thermal receipt printer and kitchen notification sounds
class AudioEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Authentic 80mm Thermal Printer Sound (whirring stepper motor + paper cutter chunk)
  public playPrinterSound() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Motor buzzing/stepping
      for (let i = 0; i < 4; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160 + (i % 2) * 30, now + i * 0.12);

        gain.gain.setValueAtTime(0.08, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + (i + 1) * 0.12);
      }

      // 2. Paper cutter click at the end
      const cutTime = now + 0.52;
      const cutOsc = this.ctx.createOscillator();
      const cutGain = this.ctx.createGain();

      cutOsc.type = 'triangle';
      cutOsc.frequency.setValueAtTime(800, cutTime);
      cutOsc.frequency.exponentialRampToValueAtTime(120, cutTime + 0.08);

      cutGain.gain.setValueAtTime(0.2, cutTime);
      cutGain.gain.exponentialRampToValueAtTime(0.001, cutTime + 0.08);

      cutOsc.connect(cutGain);
      cutGain.connect(this.ctx.destination);

      cutOsc.start(cutTime);
      cutOsc.stop(cutTime + 0.09);
    } catch (e) {
      console.warn('Audio play prevented', e);
    }
  }

  // Cheerful chime for new order creation
  public playNewOrderChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);

        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch (e) {
      console.warn('Audio play prevented', e);
    }
  }

  // Kitchen Service Bell (Ding!)
  public playKitchenBell() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now); // A6 bright bell

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) {
      console.warn('Audio play prevented', e);
    }
  }
}

export const audioEngine = new AudioEngine();
