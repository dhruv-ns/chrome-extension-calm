// Aura Tab - Blocked Focus Screen Logic

import { getSettings, updateSettings, getTasks } from '../common/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUrl = urlParams.get('target');

  const headlineEl = document.getElementById('focus-headline');
  const taskTextEl = document.getElementById('top-task-text');
  const btnBack = document.getElementById('btn-back-goal');
  const btnSnooze = document.getElementById('btn-snooze-5');

  // Load user name & settings
  const settings = await getSettings();
  if (settings.userName && settings.userName.trim()) {
    headlineEl.textContent = `Stay in your flow, ${settings.userName.trim()}.`;
  }

  // Load top task
  const tasks = await getTasks();
  const topTask = tasks.find(t => t.column === 'today' && !t.completed);
  if (topTask && topTask.text) {
    taskTextEl.textContent = topTask.text;
  } else {
    taskTextEl.textContent = 'Focus on finishing your most important priority today.';
  }

  // Action: Back to Goal
  btnBack.addEventListener('click', async () => {
    // Navigate to new tab
    window.location.href = chrome.runtime.getURL('src/newtab/newtab.html');
  });

  // Action: Give me 5 minutes
  btnSnooze.addEventListener('click', async () => {
    const fiveMinutes = Date.now() + 5 * 60 * 1000;
    await updateSettings({ focusCooldownExpiry: fiveMinutes });

    // Set alarm for 5 minutes to re-lock
    await chrome.alarms.create('focus_cooldown_end', { when: fiveMinutes });

    if (targetUrl) {
      window.location.href = decodeURIComponent(targetUrl);
    } else {
      window.history.back();
    }
  });
});

