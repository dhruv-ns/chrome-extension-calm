// Aura Tab - Clock, Greeting & Date Controller

import { getGreeting, formatTime, formatDate } from '../common/utils.js';

let timerId = null;

export function initClock(settings) {
  const clockEl = document.getElementById('clock');
  const greetingEl = document.getElementById('greeting');
  const dateEl = document.getElementById('date');

  // If user edited HTML directly (e.g. "Good morning, Dhruv"), adopt that name
  if (greetingEl && greetingEl.textContent) {
    const match = greetingEl.textContent.match(/Good (?:morning|afternoon|evening|night),\s*(.*)/i);
    if (match && match[1] && match[1].trim() && (settings.userName === 'Aditya' || !settings.userName)) {
      settings.userName = match[1].trim();
    }
  }

  function tick() {
    const now = new Date();
    clockEl.textContent = formatTime(now, settings.militaryTime, settings.showSeconds);
    greetingEl.textContent = getGreeting(settings.userName, now);
    dateEl.textContent = formatDate(now);
  }

  // Initial immediate tick
  tick();

  // Run on interval
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);

  // Pause when tab not visible to save CPU/battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(timerId);
    } else {
      tick();
      clearInterval(timerId);
      timerId = setInterval(tick, 1000);
    }
  });
}

export function updateClockSettings(newSettings) {
  const clockEl = document.getElementById('clock');
  const greetingEl = document.getElementById('greeting');
  const now = new Date();
  clockEl.textContent = formatTime(now, newSettings.militaryTime, newSettings.showSeconds);
  greetingEl.textContent = getGreeting(newSettings.userName, now);
}

