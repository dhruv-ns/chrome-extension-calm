// Aura Tab - Web Audio Ambient Focus Sound Synthesizer (Zero External Audio Files)

import { getSettings, updateSettings } from '../common/storage.js';

let audioCtx = null;
let currentSource = null;
let gainNode = null;
let currentSoundType = 'off';

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Generate noise buffer (White, Pink, Brown)
 */
function createNoiseBuffer(ctx, type = 'brown', duration = 5) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let lastOut = 0.0;
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;

    if (type === 'white') {
      data[i] = white * 0.2;
    } else if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
      b6 = white * 0.115926;
    } else {
      // Brown noise
      lastOut = (lastOut + (0.02 * white)) / 1.02;
      data[i] = lastOut * 1.5;
    }
  }

  return buffer;
}

/**
 * Start synthesizing ambient sound
 */
export async function playAmbientSound(type, volume = 0.35) {
  stopAmbientSound();
  if (type === 'off') {
    currentSoundType = 'off';
    return;
  }

  const ctx = getAudioContext();
  gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.connect(ctx.destination);

  currentSoundType = type;

  if (type === 'rain') {
    // Rain: Pink noise filtered + random droplet pops
    const noiseBuffer = createNoiseBuffer(ctx, 'pink', 4);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    noise.start();
    currentSource = { stop: () => noise.stop() };
  } else if (type === 'ocean') {
    // Ocean: Brown noise with slow LFO modulating filter and volume
    const noiseBuffer = createNoiseBuffer(ctx, 'brown', 5);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    // LFO for tide rise and fall
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 second wave cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(300, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(gainNode);
    noise.start();
    lfo.start();
    currentSource = { stop: () => { noise.stop(); lfo.stop(); } };
  } else if (type === 'brown_noise') {
    // Deep Brown Noise
    const noiseBuffer = createNoiseBuffer(ctx, 'brown', 5);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    noise.start();
    currentSource = { stop: () => noise.stop() };
  } else if (type === 'drone') {
    // Zen Drone: Harmonious root & fifth chord (110Hz A2 + 165Hz E3)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(110, ctx.currentTime);
    osc2.frequency.setValueAtTime(165.2, ctx.currentTime); // subtle beat frequency

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.2, ctx.currentTime);

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(gainNode);

    osc1.start();
    osc2.start();
    currentSource = { stop: () => { osc1.stop(); osc2.stop(); } };
  }
}

export function stopAmbientSound() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // Ignore if already stopped
    }
    currentSource = null;
  }
  currentSoundType = 'off';
}

export function setAmbientVolume(vol) {
  if (gainNode && audioCtx) {
    gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), audioCtx.currentTime);
  }
}

/**
 * Initialize ambient sound UI button & popover
 */
export async function initAmbientSound(settings) {
  const btn = document.getElementById('ambient-sound-btn');
  const label = document.getElementById('ambient-sound-text');
  const popover = document.getElementById('ambient-sound-popover');
  const volSlider = document.getElementById('ambient-volume-slider');

  if (!btn) return;

  function updateUi(type) {
    const names = {
      off: 'Sound: OFF',
      rain: '🌧️ Rain',
      ocean: '🌊 Ocean',
      brown_noise: '☕ Brown Noise',
      drone: '🧘 Zen Drone'
    };
    label.textContent = names[type] || 'Sound: OFF';
    btn.classList.toggle('active', type !== 'off');

    popover.querySelectorAll('.ambient-sound-opt').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.sound === type);
    });
  }

  updateUi(currentSoundType);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.toggle('visible');
  });

  popover.querySelectorAll('.ambient-sound-opt').forEach(opt => {
    opt.addEventListener('click', async (e) => {
      e.stopPropagation();
      const type = opt.dataset.sound;
      const vol = parseFloat(volSlider?.value || 0.35);

      if (type === currentSoundType) {
        stopAmbientSound();
        updateUi('off');
        await updateSettings({ ambientSoundType: 'off' });
      } else {
        await playAmbientSound(type, vol);
        updateUi(type);
        await updateSettings({ ambientSoundType: type });
      }
    });
  });

  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      setAmbientVolume(vol);
      updateSettings({ ambientSoundVolume: vol });
    });
  }

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== btn) {
      popover.classList.remove('visible');
    }
  });

  // Pause sound when tab is hidden to save battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (audioCtx && audioCtx.state === 'running') {
        audioCtx.suspend();
      }
    } else {
      if (audioCtx && audioCtx.state === 'suspended' && currentSoundType !== 'off') {
        audioCtx.resume();
      }
    }
  });
}

