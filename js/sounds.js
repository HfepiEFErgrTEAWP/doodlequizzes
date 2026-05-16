/**
 * Doodle Quizzes — sketch-style sound effects (Web Audio API)
 */
const Sounds = (function () {
  "use strict";

  let ctx = null;
  let muted = false;
  let volume = 0.7;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, ramp) {
    if (muted) return;
    try {
      const c = getCtx();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, c.currentTime);
      g.gain.setValueAtTime((vol || 0.08) * volume, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g);
      g.connect(c.destination);
      o.start();
      o.stop(c.currentTime + dur);
    } catch (e) {
      /* audio blocked */
    }
  }

  function noise(dur, vol) {
    if (muted) return;
    try {
      const c = getCtx();
      const len = c.sampleRate * dur;
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = c.createGain();
      g.gain.setValueAtTime((vol || 0.04) * volume, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 800;
      src.connect(f);
      f.connect(g);
      g.connect(c.destination);
      src.start();
    } catch (e) {
      /* */
    }
  }

  const SFX = {
    pencil() {
      noise(0.06, 0.05);
      tone(180 + Math.random() * 40, 0.04, "triangle", 0.03);
    },
    click() {
      tone(320, 0.05, "square", 0.05);
    },
    correct() {
      tone(523, 0.12, "sine", 0.07);
      setTimeout(() => tone(659, 0.15, "sine", 0.06), 80);
      setTimeout(() => tone(784, 0.2, "sine", 0.05), 160);
    },
    wrong() {
      tone(180, 0.2, "sawtooth", 0.06);
      setTimeout(() => tone(140, 0.25, "sawtooth", 0.05), 100);
    },
    hint() {
      tone(440, 0.08, "triangle", 0.05);
      noise(0.04, 0.03);
    },
    daily() {
      tone(392, 0.1, "sine", 0.06);
      setTimeout(() => tone(494, 0.1, "sine", 0.06), 90);
      setTimeout(() => tone(587, 0.15, "sine", 0.06), 180);
    },
    login() {
      tone(330, 0.1, "sine", 0.05);
      tone(440, 0.15, "sine", 0.05);
    },
  };

  return {
    play(name) {
      if (SFX[name]) SFX[name]();
    },
    setMuted(m) {
      muted = m;
    },
    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
    },
    getVolume() {
      return volume;
    },
    isMuted() {
      return muted;
    },
    unlock() {
      getCtx();
    },
  };
})();
