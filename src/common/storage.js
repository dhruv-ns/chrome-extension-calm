// Aura Tab - Storage abstraction over chrome.storage.local & IndexedDB

import { DEFAULT_SETTINGS, STORAGE_KEYS } from './constants.js';

/**
 * Retrieve current settings, merging with defaults
 */
export async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(result[STORAGE_KEYS.SETTINGS] || {}) };
}

/**
 * Update partial settings
 */
export async function updateSettings(partialSettings) {
  const current = await getSettings();
  const updated = { ...current, ...partialSettings };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
  return updated;
}

/**
 * Tasks helpers
 */
export async function getTasks() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TASKS);
  return result[STORAGE_KEYS.TASKS] || [];
}

export async function saveTasks(tasks) {
  await chrome.storage.local.set({ [STORAGE_KEYS.TASKS]: tasks });
}

/**
 * Read Later helpers
 */
export async function getReadLater() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.READ_LATER);
  return result[STORAGE_KEYS.READ_LATER] || [];
}

export async function saveReadLater(items) {
  await chrome.storage.local.set({ [STORAGE_KEYS.READ_LATER]: items });
}

export async function addReadLaterItem(item) {
  const items = await getReadLater();
  // Avoid duplicate URLs
  const existingIdx = items.findIndex(i => i.url === item.url);
  if (existingIdx >= 0) {
    items[existingIdx] = { ...items[existingIdx], ...item, addedAt: Date.now() };
  } else {
    items.unshift({
      id: crypto.randomUUID ? crypto.randomUUID() : 'rl_' + Date.now(),
      url: item.url,
      title: item.title || item.url,
      addedAt: Date.now(),
      read: false
    });
  }
  await saveReadLater(items);
}

/**
 * Workspaces helpers
 */
export async function getWorkspaces() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WORKSPACES);
  return result[STORAGE_KEYS.WORKSPACES] || [];
}

export async function saveWorkspaces(workspaces) {
  await chrome.storage.local.set({ [STORAGE_KEYS.WORKSPACES]: workspaces });
}

/**
 * Snoozed Tabs helpers
 */
export async function getSnoozedTabs() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SNOOZED_TABS);
  return result[STORAGE_KEYS.SNOOZED_TABS] || [];
}

export async function saveSnoozedTabs(snoozed) {
  await chrome.storage.local.set({ [STORAGE_KEYS.SNOOZED_TABS]: snoozed });
}

/**
 * Sticky notes per URL helpers
 */
export async function getStickyNotes(url) {
  const cleanUrl = url ? url.split('#')[0] : '';
  const result = await chrome.storage.local.get(STORAGE_KEYS.STICKY_NOTES);
  const allNotes = result[STORAGE_KEYS.STICKY_NOTES] || {};
  return allNotes[cleanUrl] || [];
}

export async function saveStickyNotes(url, notes) {
  const cleanUrl = url ? url.split('#')[0] : '';
  const result = await chrome.storage.local.get(STORAGE_KEYS.STICKY_NOTES);
  const allNotes = result[STORAGE_KEYS.STICKY_NOTES] || {};
  if (notes && notes.length > 0) {
    allNotes[cleanUrl] = notes;
  } else {
    delete allNotes[cleanUrl];
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.STICKY_NOTES]: allNotes });
}

/**
 * Screentime helpers
 */
export async function getScreentimeToday() {
  const todayStr = new Date().toISOString().split('T')[0];
  const result = await chrome.storage.local.get(STORAGE_KEYS.SCREENTIME_TODAY);
  const data = result[STORAGE_KEYS.SCREENTIME_TODAY] || { date: todayStr, domains: {} };
  if (data.date !== todayStr) {
    return { date: todayStr, domains: {} };
  }
  return data;
}

export async function saveScreentimeToday(data) {
  await chrome.storage.local.set({ [STORAGE_KEYS.SCREENTIME_TODAY]: data });
}

/**
 * Weather Cache helpers
 */
export async function getWeatherCache() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.WEATHER_CACHE);
  return result[STORAGE_KEYS.WEATHER_CACHE] || null;
}

export async function saveWeatherCache(cacheData) {
  await chrome.storage.local.set({ [STORAGE_KEYS.WEATHER_CACHE]: cacheData });
}

/* ==========================================================================
   IndexedDB Media Store (AuraMediaDB) for custom photo/video wallpapers
   ========================================================================== */
const DB_NAME = 'AuraMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'wallpapers';

function openMediaDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveWallpaperToDB(wallpaperObj) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(wallpaperObj);
    tx.oncomplete = () => resolve(wallpaperObj.id);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getWallpaperFromDB(id) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteWallpaperFromDB(id) {
  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

