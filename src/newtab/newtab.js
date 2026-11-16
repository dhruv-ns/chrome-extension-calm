// Aura Tab - New Tab Root Controller & Initializer

import { getSettings } from '../common/storage.js';
import { initClock, updateClockSettings } from './clock.js';
import { initTopTask } from './top_task.js';
import { initSpotlight } from './spotlight.js';
import { initWallpaper, initThemeSwitcher } from './wallpaper.js';
import { initWeather, loadAndRenderWeather } from './weather.js';
import { initAmbientSound } from './ambient_sound.js';
import { initFocusBanner } from './focus_banner.js';
import { initDock } from './dock.js';
import { initTasksPanel } from './panel_tasks.js';
import { initHistoryPanel } from './panel_history.js';
import { initReadLaterPanel } from './panel_read_later.js';
import { initWorkspacesPanel } from './panel_workspaces.js';
import { initScreentimePanel } from './panel_screentime.js';
import { initSnoozedPanel } from './panel_snoozed.js';
import { initTabOverloadBar } from './tab_overload_bar.js';
import { initSettingsModal } from './settings_modal.js';

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await getSettings();

  // 1. Initialize ambient visual canvas & wallpaper
  await initWallpaper(settings);
  await initWeather(settings);

  // 2. Initialize Central Anchor (Clock, Greeting, Date, Top Task & Spotlight)
  initClock(settings);
  initTopTask(() => {
    // Open Tasks panel if user clicks "+ Add a focus task"
    const tasksBtn = document.getElementById('dock-btn-tasks');
    if (tasksBtn) tasksBtn.click();
  });
  initSpotlight();

  // 3. Initialize Top Controls (Focus Mode, Ambient Sound, Theme Switcher & Weather Pill)
  initFocusBanner(settings);
  await initAmbientSound(settings);
  initThemeSwitcher((updated) => {
    initWallpaper(updated);
  });
  const weatherPill = document.getElementById('weather-pill');
  if (weatherPill) {
    weatherPill.addEventListener('click', () => {
      if (window.openSettingsModal) {
        window.openSettingsModal();
        const weatherNav = document.querySelector('[data-tab="tab-weather"]');
        if (weatherNav) weatherNav.click();
      }
    });
  }

  // 4. Initialize Mac Bottom Dock & Flyout Panels
  await initDock(() => {
    if (window.openSettingsModal) window.openSettingsModal();
  });

  // 5. Initialize Panel Subsystems
  await initTasksPanel();
  await initHistoryPanel();
  await initReadLaterPanel();
  await initWorkspacesPanel();
  await initScreentimePanel();
  await initSnoozedPanel();

  // 6. Tab Overload Warning Monitor
  await initTabOverloadBar();

  // 7. Settings Modal
  await initSettingsModal((updatedSettings) => {
    updateClockSettings(updatedSettings);
    initWallpaper(updatedSettings);
    loadAndRenderWeather(updatedSettings);
  });
});

