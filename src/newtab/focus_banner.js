// Aura Tab - Focus Mode Quick Switch Pill

import { updateSettings } from '../common/storage.js';

export function initFocusBanner(settings) {
  const btn = document.getElementById('focus-toggle-btn');
  const textEl = document.getElementById('focus-status-text');

  function render(isActive) {
    if (isActive) {
      btn.classList.add('active');
      textEl.textContent = 'Focus: ON';
    } else {
      btn.classList.remove('active');
      textEl.textContent = 'Focus: OFF';
    }
  }

  render(settings.focusModeActive);

  btn.addEventListener('click', async () => {
    const nextState = !btn.classList.contains('active');
    render(nextState);
    await updateSettings({ focusModeActive: nextState });

    // Sync switch in Settings Modal if open
    const modalSwitch = document.getElementById('setting-focus-toggle');
    if (modalSwitch) modalSwitch.checked = nextState;
  });
}

