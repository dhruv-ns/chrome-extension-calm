// Aura Tab - Screen Time Tracker (Idle-aware, local only)

import { getScreentimeToday, saveScreentimeToday } from '../common/storage.js';
import { extractDomain } from '../common/utils.js';

let activeDomain = null;
let lastHeartbeat = Date.now();
let isUserIdle = false;
let isWindowFocused = true;

/**
 * Update domain screentime tally
 */
async function recordActiveTime() {
  const now = Date.now();
  const elapsedSeconds = Math.round((now - lastHeartbeat) / 1000);
  lastHeartbeat = now;

  if (elapsedSeconds <= 0 || elapsedSeconds > 60) return; // Ignore large jumps or anomalies
  if (isUserIdle || !isWindowFocused || !activeDomain) return;

  const data = await getScreentimeToday();
  const currentSeconds = data.domains[activeDomain] || 0;
  data.domains[activeDomain] = currentSeconds + elapsedSeconds;

  await saveScreentimeToday(data);
}

/**
 * Refresh current active tab domain
 */
async function updateCurrentActiveTab() {
  await recordActiveTime();

  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs && tabs.length > 0 && tabs[0].url) {
      const url = tabs[0].url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        activeDomain = extractDomain(url);
      } else {
        activeDomain = null;
      }
    } else {
      activeDomain = null;
    }
  } catch {
    activeDomain = null;
  }
}

/**
 * Initialize listeners
 */
export function initScreentimeTracker() {
  // Listen to tab activation & URL change
  chrome.tabs.onActivated.addListener(updateCurrentActiveTab);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url) {
      updateCurrentActiveTab();
    }
  });

  // Listen to window focus
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      recordActiveTime();
      isWindowFocused = false;
    } else {
      isWindowFocused = true;
      updateCurrentActiveTab();
    }
  });

  // Listen to user idle state (60-second detection threshold)
  chrome.idle.onStateChanged.addListener((newState) => {
    if (newState === 'active') {
      isUserIdle = false;
      lastHeartbeat = Date.now();
    } else {
      recordActiveTime();
      isUserIdle = true;
    }
  });

  // Periodic heartbeat timer every 15 seconds
  setInterval(recordActiveTime, 15000);

  // Initial check
  updateCurrentActiveTab();
}

