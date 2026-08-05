/* ===========================================================
   MATEOAVENTURA — Motor de sonido (Web Audio API)
   Efectos sintetizados en tiempo real: sin archivos.
   Música de fondo alegre (loop sintetizado).
   =========================================================== */

(() => {
'use strict';

let ctx = null;
let masterGain = null;
let musicGain = null;
let sfxGain = null;
let musicOn = true;
let sfxOn = true;

let musicTimer = null;
let musicStep = 0;

function init() {
  if (ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.85;
    sfxGain.connect(masterGain);
  } catch (e) {
    console.warn('Web Audio no disponible', e);
  }
}

function resume() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, dur, type = 'square', vol = 0.3, attack = 0.005, release = 0.05, target = sfxGain) {
  if (!ctx || !sfxOn) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(target);
  osc.start(t);
  osc.stop(t + dur + release);
  return osc;
}

function slide(f1, f2, dur, type = 'square', vol = 0.3) {
  if (!ctx || !sfxOn) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f1, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(sfxGain);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise(dur, vol = 0.2, filterFreq = 1000, type = 'lowpass') {
  if (!ctx || !sfxOn) return;
  const t = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(sfxGain);
  src.start(t);
  src.stop(t + dur);
}

const sfx = {
  init,
  resume,

  jump() {
    slide(300, 620, 0.18, 'square', 0.22);
  },

  shoot() {
    // disparo de tirachinas: estirar goma + soltar
    slide(600, 200, 0.08, 'square', 0.2);
    noise(0.05, 0.1, 2000, 'highpass');
  },

  hit() {
    // piedra impacta al alien
    noise(0.06, 0.2, 1500, 'bandpass');
    tone(440, 0.08, 'square', 0.2);
  },

  rescue() {
    // recoger cuadro: acorde de guitarra alegre
    tone(659, 0.08, 'triangle', 0.22);
    setTimeout(() => tone(880, 0.1, 'triangle', 0.22), 80);
    setTimeout(() => tone(1047, 0.12, 'triangle', 0.2), 160);
  },

  stomp() {
    // pisotón / alien derrotado
    slide(420, 90, 0.18, 'square', 0.3);
    noise(0.1, 0.25, 2200, 'highpass');
  },

  bossAlert() {
    // alerta de boss: tono grave y dramático
    slide(150, 80, 0.6, 'sawtooth', 0.3);
    setTimeout(() => slide(200, 60, 0.4, 'square', 0.25), 200);
  },

  bossShoot() {
    // disparo del boss: plasma alien
    slide(800, 200, 0.12, 'sawtooth', 0.22);
    noise(0.05, 0.15, 500, 'bandpass');
  },

  land() {
    slide(200, 120, 0.07, 'sine', 0.18);
  },

  hurt() {
    slide(400, 120, 0.35, 'sawtooth', 0.28);
    setTimeout(() => slide(300, 80, 0.3, 'square', 0.2), 80);
  },

  death() {
    const notes = [523, 440, 349, 262, 175];
    notes.forEach((f, i) => setTimeout(() => tone(f, 0.25, 'square', 0.3), i * 130));
  },

  victory() {
    const seq = [
      [523, 0], [659, 130], [784, 260], [1047, 390],
      [784, 560], [1047, 690], [1319, 820],
    ];
    seq.forEach(([f, t]) => setTimeout(() => tone(f, 0.3, 'square', 0.3), t));
  },

  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => tone(f, 0.15, 'triangle', 0.28), i * 80));
  },

  click() {
    tone(660, 0.05, 'square', 0.18);
  },

  start() {
    [392, 523, 659, 784].forEach((f, i) =>
      setTimeout(() => tone(f, 0.12, 'square', 0.25), i * 70));
  },
};

/* ---- Música de fondo: rock sintetizado ---- */
const N = {
  // Escala de Mi menor (rock clásico)
  E2:82.41,  A2:110.00, D3:146.83, G3:196.00,
  E3:164.81, A3:220.00, B3:246.94, C3:130.81,
  E4:329.63, A4:440.00, B4:493.88, D4:293.66,
  G4:392.00, F4:349.23, C4:261.63,
  REST: 0,
};

// Riff principal de guitarra (estilo rock/punk)
const MELODY = [
  N.E4, N.E4, N.REST, N.E4,  N.REST, N.E4, N.G4, N.E4,
  N.A4, N.REST, N.A4, N.REST, N.G4,  N.E4, N.REST, N.REST,
  N.B4, N.B4, N.REST, N.B4,  N.REST, N.A4, N.G4, N.E4,
  N.A4, N.G4, N.E4,  N.REST, N.D4,  N.E4, N.REST, N.REST,
];

// Bajo poderoso (palm mute)
const BASS = [
  N.E2, N.E2, N.E2, N.E2,
  N.A2, N.A2, N.A2, N.A2,
  N.B3, N.B3, N.A2, N.A2,
  N.G3, N.G3, N.E2, N.E2,
];

function startMusic() {
  if (!ctx || !musicOn || musicTimer !== null) return;
  musicStep = 0;
  const stepMs = 110; // tempo rock rápido
  let beatCount = 0;
  const tick = () => {
    if (!musicOn || !ctx) { musicTimer = null; return; }
    const step = musicStep % MELODY.length;
    // --- Guitarra distorsionada (sawtooth) ---
    const m = MELODY[step];
    if (m > 0) {
      playMusicNote(m,        stepMs / 1000 * 0.7, 'sawtooth', 0.10);
      playMusicNote(m * 1.005, stepMs / 1000 * 0.7, 'sawtooth', 0.08); // coro ligero
    }
    // --- Bajo (triangle con ataque) ---
    if (step % 2 === 0) {
      const b = BASS[Math.floor(step / 2) % BASS.length];
      if (b > 0) playMusicNote(b, stepMs / 1000 * 1.8, 'triangle', 0.22);
    }
    // --- Bateria: bombo en 1 y 3, caja en 2 y 4 ---
    const beat = step % 4;
    if (beat === 0 || beat === 2) {
      // Bombo: ruido grave
      noise(0.08, 0.28, 80, 'lowpass');
    }
    if (beat === 1 || beat === 3) {
      // Caja: ruido medio + tono agudo
      noise(0.05, 0.18, 600, 'bandpass');
      tone(200, 0.04, 'square', 0.12);
    }
    // Hi-hat en cada paso
    noise(0.025, 0.06, 8000, 'highpass');

    musicStep++;
    beatCount++;
    musicTimer = setTimeout(tick, stepMs);
  };
  tick();
}

function playMusicNote(freq, dur, type, vol) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.setValueAtTime(vol, t + dur * 0.5);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(musicGain);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function stopMusic() {
  if (musicTimer !== null) { clearTimeout(musicTimer); musicTimer = null; }
}

function setMusicOn(on) {
  musicOn = on;
  if (!on) stopMusic();
}

function setSfxOn(on) { sfxOn = on; }
function isMusicOn() { return musicOn; }
function isSfxOn() { return sfxOn; }

window.JMSound = {
  sfx,
  startMusic,
  stopMusic,
  setMusicOn,
  setSfxOn,
  isMusicOn,
  isSfxOn,
  init,
  resume,
};

})();
