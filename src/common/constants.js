// Aura Tab - Shared Constants and Default Settings

export const DEFAULT_SETTINGS = {
  // User Profile & Aesthetic
  userName: "Dhruv",
  militaryTime: false,
  showSeconds: false,
  themeMode: "dark", // "dark" | "light" | "auto"
  glassOpacity: 0.65, // 0.2 to 0.95
  wallpaperType: "sky", // "sky" | "aurora" | ... | "online_video" | "online_image" | "custom"
  activeWallpaperId: null, // uuid referencing IndexedDB entry
  activeWallpaperUrl: "", // direct internet URL for animated video or image
  wallpaperHistory: [], // Array of { id, type, timestamp, name, url }
  enableWeatherParticles: true,
  enableWeatherWebTint: true,
  ambientSoundType: "off", // "off" | "rain" | "ocean" | "brown_noise" | "drone"
  ambientSoundVolume: 0.35,

  // Weather
  weatherCity: "San Francisco",
  weatherLat: 37.7749,
  weatherLon: -122.4194,
  weatherUnits: "celsius", // "celsius" | "fahrenheit"

  // Focus System
  focusModeActive: false,
  focusBlockedSites: [
    "youtube.com",
    "instagram.com",
    "facebook.com",
    "x.com",
    "twitter.com",
    "reddit.com"
  ],
  focusCooldownExpiry: 0, // epoch ms when 5-min grace period ends

  // Tabs & Hygiene
  tabOverloadThreshold: 15,
  autoGroupOnCleanup: true,
  cleanPreservePinned: true,
  snoozePresets: {
    in1Hour: 60,
    thisEvening: 18,
    tomorrowMorning: 9,
    thisWeekend: "Saturday",
    nextWeek: "Monday"
  },

  // Content Script Superpowers
  edgeHandleSide: "right", // "left" | "right"
  edgeHandleOffsetY: 200, // px from top
  edgeHandleHiddenSites: [],
  enableImageMagnifier: true,
  enableTableExport: true,
  enableTextExpansion: true,
  textSnippets: [
    { trigger: "/hi", replacement: "Hello! Hope you are having a wonderful day." },
    { trigger: "/date", replacement: "{date}" },
    { trigger: "/time", replacement: "{time}" },
    { trigger: "/mail", replacement: "dhruv@example.com" }
  ],

  // AI Mode (Groq)
  groqApiKey: "",
  groqModelText: "llama-3.1-8b-instant",
  groqModelVision: "llama-3.2-11b-vision-preview",
  aiEnabled: false
};

export const STORAGE_KEYS = {
  SETTINGS: "settings",
  TASKS: "tasks",
  READ_LATER: "readLater",
  WORKSPACES: "workspaces",
  SNOOZED_TABS: "snoozedTabs",
  STICKY_NOTES: "stickyNotes",
  SCREENTIME_TODAY: "screentime_today",
  WEATHER_CACHE: "weather_cache"
};

export const MESSAGE_TYPES = {
  CLEANUP_TABS: "CLEANUP_TABS",
  SNOOZE_TAB: "SNOOZE_TAB",
  SAVE_READ_LATER: "SAVE_READ_LATER",
  GET_SETTINGS: "GET_SETTINGS",
  UPDATE_SETTINGS: "UPDATE_SETTINGS",
  CAPTURE_AND_OCR: "CAPTURE_AND_OCR",
  DEFINE_WORD: "DEFINE_WORD",
  TOGGLE_FOCUS: "TOGGLE_FOCUS",
  GET_TOP_TASK: "GET_TOP_TASK",
  RESTORE_CLOSED_TAB: "RESTORE_CLOSED_TAB"
};

