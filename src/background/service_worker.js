// Aura Tab - Background Service Worker (Manifest V3)

import { cleanupTabs, snoozeTab, handleSnoozeAlarm, updateTabBadge } from './tab_manager.js';
import { initScreentimeTracker } from './screentime_tracker.js';
import { initFocusEnforcer } from './focus_enforcer.js';
import { getSettings, updateSettings, addReadLaterItem, getTasks } from '../common/storage.js';
import { extractTextFromImage, defineWordWithAI } from '../common/groq_client.js';
import { MESSAGE_TYPES } from '../common/constants.js';

// Initialize background subsystems
initScreentimeTracker();
initFocusEnforcer();

// Lifecycle events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Aura Tab] Extension installed/updated:', details.reason);
  await updateTabBadge();
});

// Extension icon click -> Instant tab cleanup
chrome.action.onClicked.addListener(async () => {
  const result = await cleanupTabs();
  console.log('[Aura Tab] Cleaned up tabs via action icon:', result);
});

// Keyboard shortcuts (commands)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'cleanup-tabs') {
    await cleanupTabs();
  }
});

// Listen to tab creations/removals to update overload badge
chrome.tabs.onCreated.addListener(() => updateTabBadge());
chrome.tabs.onRemoved.addListener(() => updateTabBadge());

// Alarms dispatcher
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('snooze_')) {
    await handleSnoozeAlarm(alarm);
  }
});

// Unified Message Bus
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handleAsync = async () => {
    switch (message.type) {
      case MESSAGE_TYPES.CLEANUP_TABS: {
        const result = await cleanupTabs(sender.tab?.windowId);
        return { success: true, ...result };
      }

      case MESSAGE_TYPES.SNOOZE_TAB: {
        const tabId = message.tabId || sender.tab?.id;
        if (!tabId) return { success: false, error: 'No tab specified' };
        const result = await snoozeTab(tabId, message.preset || 'in1Hour');
        return result;
      }

      case MESSAGE_TYPES.SAVE_READ_LATER: {
        const item = message.item || {
          url: sender.tab?.url,
          title: sender.tab?.title
        };
        await addReadLaterItem(item);
        return { success: true };
      }

      case MESSAGE_TYPES.GET_SETTINGS: {
        const settings = await getSettings();
        return settings;
      }

      case MESSAGE_TYPES.UPDATE_SETTINGS: {
        const updated = await updateSettings(message.settings || {});
        return updated;
      }

      case MESSAGE_TYPES.GET_TOP_TASK: {
        const tasks = await getTasks();
        const topTask = tasks.find(t => t.column === 'today' && !t.completed);
        return { topTask: topTask || null };
      }

      case MESSAGE_TYPES.CAPTURE_AND_OCR: {
        const settings = await getSettings();
        if (!settings.aiEnabled || !settings.groqApiKey) {
          return { success: false, error: 'AI_DISABLED' };
        }

        try {
          // Capture current visible tab
          const dataUrl = await chrome.tabs.captureVisibleTab(sender.tab?.windowId || null, {
            format: 'png'
          });

          // Crop image if coordinates provided
          let finalDataUrl = dataUrl;
          if (message.crop) {
            // If crop is needed and sender is content script
            // Offscreen cropping or sending full data URL with coordinates
          }

          const extractedText = await extractTextFromImage(finalDataUrl, settings.groqApiKey);
          return { success: true, text: extractedText };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      case MESSAGE_TYPES.DEFINE_WORD: {
        const settings = await getSettings();
        if (!settings.aiEnabled || !settings.groqApiKey) {
          return { success: false, error: 'AI_DISABLED' };
        }
        const definition = await defineWordWithAI(message.word, settings.groqApiKey);
        return { success: !!definition, data: definition };
      }

      case MESSAGE_TYPES.RESTORE_CLOSED_TAB: {
        try {
          const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 1 });
          if (sessions && sessions.length > 0) {
            const restored = await chrome.sessions.restore(sessions[0].tab?.sessionId || sessions[0].window?.sessionId);
            return { success: true, restored };
          }
          return { success: false, error: 'No recently closed tabs found.' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }

      default:
        return { error: 'Unknown message type: ' + message.type };
    }
  };

  handleAsync().then(sendResponse).catch(err => sendResponse({ error: err.message }));
  return true; // Keep message channel open for async response
});

