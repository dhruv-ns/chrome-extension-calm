// Aura Tab - Tab Overload Warning Banner

import { getSettings } from '../common/storage.js';

let dismissedUntil = 0;

export async function initTabOverloadBar() {
  const barEl = document.getElementById('tab-overload-bar');
  const msgEl = document.getElementById('tab-overload-msg');
  const cleanBtn = document.getElementById('btn-overload-clean');
  const dismissBtn = document.getElementById('btn-overload-dismiss');

  async function check() {
    if (Date.now() < dismissedUntil) {
      barEl.classList.remove('visible');
      return;
    }

    const settings = await getSettings();
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const count = tabs.length;

    if (count >= settings.tabOverloadThreshold) {
      msgEl.textContent = `You have ${count} tabs open.`;
      barEl.classList.add('visible');
    } else {
      barEl.classList.remove('visible');
    }
  }

  cleanBtn.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'CLEANUP_TABS' }, () => {
      barEl.classList.remove('visible');
      setTimeout(check, 1000);
    });
  });

  dismissBtn.addEventListener('click', () => {
    barEl.classList.remove('visible');
    // Dismiss for 3 hours
    dismissedUntil = Date.now() + 3 * 60 * 60 * 1000;
  });

  await check();
}

