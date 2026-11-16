// Aura Tab - Tab Hygiene, Deduplication, Grouping and Snooze Management

import { getSettings, getSnoozedTabs, saveSnoozedTabs } from '../common/storage.js';
import { normalizeUrl, extractDomain } from '../common/utils.js';
import { groupTabsWithAI } from '../common/groq_client.js';

const CHROME_GROUP_COLORS = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];

/**
 * Deduplicate tabs and optionally group them
 */
export async function cleanupTabs(windowId = null) {
  const settings = await getSettings();
  const queryInfo = windowId ? { windowId } : { currentWindow: true };
  const allTabs = await chrome.tabs.query(queryInfo);

  const seenUrls = new Map(); // normalizedUrl -> primaryTab
  const tabsToClose = [];
  const remainingTabs = [];

  for (const tab of allTabs) {
    // Never close pinned tabs if preserve pinned setting is on
    if (tab.pinned && settings.cleanPreservePinned) {
      remainingTabs.push(tab);
      continue;
    }

    // Never close internal/blank pages
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      remainingTabs.push(tab);
      continue;
    }

    const norm = normalizeUrl(tab.url);

    if (seenUrls.has(norm)) {
      // Duplicate found
      const primary = seenUrls.get(norm);
      if (tab.active) {
        // Current tab is active, so keep this one and close the previous primary
        tabsToClose.push(primary.id);
        seenUrls.set(norm, tab);
        // Replace in remaining list
        const idx = remainingTabs.findIndex(t => t.id === primary.id);
        if (idx !== -1) remainingTabs.splice(idx, 1);
        remainingTabs.push(tab);
      } else {
        tabsToClose.push(tab.id);
      }
    } else {
      seenUrls.set(norm, tab);
      remainingTabs.push(tab);
    }
  }

  // Close duplicates
  if (tabsToClose.length > 0) {
    await chrome.tabs.remove(tabsToClose);
  }

  let groupedCount = 0;
  if (settings.autoGroupOnCleanup && remainingTabs.length > 2) {
    groupedCount = await groupTabs(remainingTabs, settings);
  }

  // Update badge after cleanup
  await updateTabBadge();

  return { closedCount: tabsToClose.length, groupedCount };
}

/**
 * Groups remaining tabs (via AI if enabled, or by domain)
 */
async function groupTabs(tabs, settings) {
  // Exclude pinned tabs from grouping
  const groupableTabs = tabs.filter(t => !t.pinned && t.url && !t.url.startsWith('chrome://'));
  if (groupableTabs.length < 2) return 0;

  // 1. Try AI grouping if enabled
  if (settings.aiEnabled && settings.groqApiKey) {
    const aiGroups = await groupTabsWithAI(groupableTabs, settings.groqApiKey);
    if (aiGroups && Array.isArray(aiGroups) && aiGroups.length > 0) {
      let createdGroups = 0;
      for (const group of aiGroups) {
        if (!group.tabIds || group.tabIds.length < 1) continue;
        // Verify tab IDs are still valid
        const validIds = group.tabIds.filter(id => groupableTabs.some(t => t.id === id));
        if (validIds.length === 0) continue;

        try {
          const groupId = await chrome.tabs.group({ tabIds: validIds });
          const color = CHROME_GROUP_COLORS.includes(group.color) ? group.color : 'blue';
          await chrome.tabGroups.update(groupId, {
            title: group.name.slice(0, 25),
            color: color
          });
          createdGroups++;
        } catch (e) {
          console.warn('[Aura Tab] Error applying AI group:', e);
        }
      }
      if (createdGroups > 0) return createdGroups;
    }
  }

  // 2. Fallback: Group by Domain
  const domainMap = new Map();
  for (const tab of groupableTabs) {
    const domain = extractDomain(tab.url);
    if (!domain) continue;
    if (!domainMap.has(domain)) {
      domainMap.set(domain, []);
    }
    domainMap.get(domain).push(tab.id);
  }

  let colorIdx = 0;
  let domainGroupsCreated = 0;
  for (const [domain, tabIds] of domainMap.entries()) {
    // Only group if there are 2 or more tabs for this domain
    if (tabIds.length >= 2) {
      try {
        const groupId = await chrome.tabs.group({ tabIds });
        const color = CHROME_GROUP_COLORS[colorIdx % CHROME_GROUP_COLORS.length];
        colorIdx++;
        // Clean title: "github.com" -> "GitHub"
        const cleanTitle = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        await chrome.tabGroups.update(groupId, {
          title: cleanTitle,
          color: color
        });
        domainGroupsCreated++;
      } catch (err) {
        console.warn('[Aura Tab] Error grouping tabs by domain:', err);
      }
    }
  }

  return domainGroupsCreated;
}

/**
 * Snooze a tab until target preset time
 */
export async function snoozeTab(tabId, presetKey) {
  const tab = await chrome.tabs.get(tabId).catch(() => null);
  if (!tab) return { success: false, error: 'Tab not found' };

  const now = new Date();
  let wakeTimestamp = 0;

  switch (presetKey) {
    case 'in1Hour':
      wakeTimestamp = Date.now() + 60 * 60 * 1000;
      break;
    case 'thisEvening': {
      const evening = new Date(now);
      evening.setHours(18, 0, 0, 0);
      if (evening.getTime() <= now.getTime()) {
        evening.setHours(21, 0, 0, 0); // If past 6pm, set to 9pm
      }
      wakeTimestamp = evening.getTime();
      break;
    }
    case 'tomorrowMorning': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      wakeTimestamp = tomorrow.getTime();
      break;
    }
    case 'thisWeekend': {
      const sat = new Date(now);
      const daysUntilSat = (6 - sat.getDay() + 7) % 7 || 7;
      sat.setDate(sat.getDate() + daysUntilSat);
      sat.setHours(10, 0, 0, 0);
      wakeTimestamp = sat.getTime();
      break;
    }
    case 'nextWeek': {
      const mon = new Date(now);
      const daysUntilMon = (1 - mon.getDay() + 7) % 7 || 7;
      mon.setDate(mon.getDate() + daysUntilMon);
      mon.setHours(9, 0, 0, 0);
      wakeTimestamp = mon.getTime();
      break;
    }
    default:
      wakeTimestamp = Date.now() + 60 * 60 * 1000;
  }

  const itemId = 'snooze_' + (crypto.randomUUID ? crypto.randomUUID() : Date.now());
  const snoozedItem = {
    id: itemId,
    url: tab.url,
    title: tab.title || tab.url,
    wakeTime: wakeTimestamp,
    alarmName: itemId
  };

  const currentSnoozed = await getSnoozedTabs();
  currentSnoozed.push(snoozedItem);
  await saveSnoozedTabs(currentSnoozed);

  // Set alarm
  await chrome.alarms.create(itemId, { when: wakeTimestamp });

  // Close the tab
  await chrome.tabs.remove(tabId);

  return { success: true, wakeTime: wakeTimestamp };
}

/**
 * Handle alarm firing for waking a snoozed tab
 */
export async function handleSnoozeAlarm(alarm) {
  if (!alarm.name.startsWith('snooze_')) return;

  const snoozedList = await getSnoozedTabs();
  const itemIndex = snoozedList.findIndex(s => s.alarmName === alarm.name);

  if (itemIndex >= 0) {
    const item = snoozedList[itemIndex];
    snoozedList.splice(itemIndex, 1);
    await saveSnoozedTabs(snoozedList);

    // Open awakened tab
    await chrome.tabs.create({ url: item.url, active: false });
  }
}

/**
 * Update tab overload badge on extension icon
 */
export async function updateTabBadge() {
  try {
    const settings = await getSettings();
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const count = tabs.length;

    if (count >= settings.tabOverloadThreshold) {
      await chrome.action.setBadgeText({ text: String(count) });
      await chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' });
    } else {
      await chrome.action.setBadgeText({ text: '' });
    }
  } catch {
    // Ignore errors in background context
  }
}

