// Aura Tab - Focus Mode Enforcer & Distraction Interception

import { getSettings, updateSettings } from '../common/storage.js';
import { extractDomain } from '../common/utils.js';

/**
 * Checks if a URL should be blocked under active focus mode
 */
export async function isUrlBlocked(url) {
  if (!url || !url.startsWith('http')) return false;

  const settings = await getSettings();
  if (!settings.focusModeActive) return false;

  // Check 5-minute snooze cooldown
  if (settings.focusCooldownExpiry && Date.now() < settings.focusCooldownExpiry) {
    return false;
  }

  const domain = extractDomain(url).toLowerCase();
  const blockedSites = settings.focusBlockedSites || [];

  return blockedSites.some(blocked => {
    const cleanBlocked = blocked.trim().toLowerCase().replace(/^www\./, '');
    return domain === cleanBlocked || domain.endsWith('.' + cleanBlocked);
  });
}

/**
 * Intercept and redirect blocked tab
 */
async function inspectTab(tabId, url) {
  if (!url) return;
  const blocked = await isUrlBlocked(url);
  if (blocked) {
    const blockedPageUrl = chrome.runtime.getURL(
      `src/blocked/blocked.html?target=${encodeURIComponent(url)}`
    );
    await chrome.tabs.update(tabId, { url: blockedPageUrl });
  }
}

/**
 * Initialize focus mode event listeners
 */
export function initFocusEnforcer() {
  // Check on tab update
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
      inspectTab(tabId, changeInfo.url);
    }
  });

  // Check periodically or upon alarm to re-block any lingering tabs when 5-min cooldown ends
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'focus_cooldown_end') {
      const settings = await getSettings();
      await updateSettings({ focusCooldownExpiry: 0 });
      // Re-evaluate all open tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.url) {
          inspectTab(tab.id, tab.url);
        }
      }
    }
  });
}

