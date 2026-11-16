# Product Requirement Document (PRD): Aura Tab & Browser Copilot

**Version:** 1.0.0  
**Target Platform:** Google Chrome (Manifest V3, Pure Vanilla HTML/CSS/JS, No Build Step)  
**Execution Objective:** A deterministic, zero-ambiguity blueprint designed for autonomous AI agents or developers to implement the entire extension in a single execution pass.

---

## 1. Executive Summary & Core Philosophy

### 1.1 Product Vision
**Aura Tab** transforms Chrome's barren "New Tab" page into a calm, luxury-grade, macOS-inspired personal command center while injecting unobtrusive superpowers onto every visited webpage.

### 1.2 Non-Negotiable Architectural Principles
1. **Local-First & Zero-Telemetry:** No third-party servers, no analytics, no user accounts, no tracking pixels. All data resides exclusively in `chrome.storage.local` and IndexedDB.
2. **AI as an Optional Enhancer, Never a Dependency:** The extension operates with 100% functionality offline and without AI. If the user provides a free Groq API key in Settings, advanced semantic capabilities (AI tab grouping, screen OCR extraction, inline word definitions) unlock smoothly. If AI is absent or fails, fallback states are instant and silent.
3. **Strict Zero-CDN / Self-Contained Rule:** Under Manifest V3, remote script execution is strictly forbidden. All fonts, styles, icons (inline SVG), and scripts must be physically bundled within the extension bundle.
4. **Lightweight & Battery-Conscious:** Zero heavy frameworks (no React, no Vue, no Tailwind CLI runtime). Pure modern ES6+ modules and vanilla CSS custom properties. Background processes must yield to idle states (`chrome.alarms` rather than persistent `setInterval`). Animations must pause when tabs are inactive (`document.hidden`).

---

## 2. Competitive Differentiation & Scope Boundaries

### 2.1 What Chrome / Gemini in Chrome Already Does vs. Aura Tab
| Capability | Native Chrome / Gemini in Chrome | Aura Tab Superpower |
| :--- | :--- | :--- |
| **Page Reading** | Summarizes page, answers questions in sidebar. | **Does not duplicate.** Leaves page summarization to Chrome. |
| **New Tab Screen** | Static Google search bar + shortcut thumbnails. | **Full ambient OS:** Procedural sky, dynamic weather canvas, top-task anchor, Spotlight bookmark search, Mac dock. |
| **Tab Hygiene** | Native tab search, manual group creation. | **Automated hygiene:** 1-click canonical deduplication (ignoring UTM/hash), domain auto-grouping, cross-session tab snoozing, tab overload warnings. |
| **Page Mutation** | Read-only inspection via side panels. | **Active DOM intervention:** Edge-docked tool handle, persistent per-URL sticky notes, 1-click table-to-Excel export, image hover magnifier, global text expansions (`/date`, `/snippet`). |
| **Distraction Control** | None (requires external extensions). | **Hard focus wall:** Blocks distraction domains, surfaces current anchor goal, enforces 5-minute cooldown timer. |

### 2.2 Explicit Out-of-Scope Items (V1)
- Cookie consent banner blockers.
- Sleeping/discarding tab memory management (Chrome native Memory Saver handles this).
- Color pickers / eyedroppers.
- Live DOM price/element watchers.
- Voice/speech-to-text input.

---

## 3. Extension Permissions & Security Architecture

### 3.1 `manifest.json` Specification
```json
{
  "manifest_version": 3,
  "name": "Aura Tab",
  "version": "1.0.0",
  "description": "A calm, elegant command center for your new tab and subtle superpowers on every webpage.",
  "chrome_url_overrides": {
    "newtab": "src/newtab/newtab.html"
  },
  "permissions": [
    "storage",
    "tabs",
    "tabGroups",
    "bookmarks",
    "topSites",
    "history",
    "alarms",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "https://api.open-meteo.com/*",
    "https://geocoding-api.open-meteo.com/*",
    "https://api.groq.com/*",
    "<all_urls>"
  ],
  "background": {
    "service_worker": "src/background/service_worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/content_bundle.js"],
      "css": ["src/content/content_styles.css"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_icon": {
      "16": "assets/icons/icon16.png",
      "48": "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    },
    "default_title": "Clean Up Tabs & Aura Controls"
  },
  "commands": {
    "cleanup-tabs": {
      "suggested_key": {
        "default": "Alt+Shift+C",
        "mac": "Alt+Shift+C"
      },
      "description": "Trigger instant tab deduplication and grouping"
    },
    "toggle-sidebar-handle": {
      "suggested_key": {
        "default": "Alt+Shift+S",
        "mac": "Alt+Shift+S"
      },
      "description": "Toggle Aura quick toolbar on current webpage"
    }
  },
  "web_accessible_resources": [
    {
      "resources": [
        "assets/fonts/*",
        "assets/icons/*",
        "src/content/weather-tint.css"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

---

## 4. File Structure & Module Organization

All files reside inside the extension root directory without sub-bundling:

```
aura-tab/
├── manifest.json
├── assets/
│   ├── fonts/
│   │   ├── inter-variable.woff2          # Bundled clean sans font (UI)
│   │   └── playfair-display-regular.woff2# Bundled elegant serif (Clock)
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── src/
│   ├── background/
│   │   ├── service_worker.js             # Event router, alarms, tab deduplication
│   │   ├── tab_manager.js                # Canonical URL normalization, grouping, snoozing
│   │   ├── screentime_tracker.js         # Idle-aware active tab time logging
│   │   └── focus_enforcer.js             # Tab listener to redirect blocked domains
│   ├── common/
│   │   ├── constants.js                  # Default settings, storage keys, enums
│   │   ├── storage.js                    # Promise-wrapped typed storage helpers
│   │   ├── groq_client.js                # Groq API caller with safety parser & fallbacks
│   │   └── utils.js                      # Date, URL normalizer, debounce, escaping
│   ├── newtab/
│   │   ├── newtab.html                   # Command center structure
│   │   ├── newtab.css                    # Glassmorphism, layout, animations
│   │   ├── newtab.js                     # Root controller & initializers
│   │   ├── clock.js                      # Serif clock, personalized dynamic greeting, date
│   │   ├── top_task.js                   # Single-line anchor task with complete transition
│   │   ├── spotlight.js                  # Bookmark search & web fallback with arrow navigation
│   │   ├── wallpaper.js                  # Dynamic sky shader / custom video/GIF/image manager
│   │   ├── weather.js                    # Open-Meteo cache, particle canvas (rain/snow/stars)
│   │   ├── focus_banner.js               # Focus mode quick toggle & blocked redirect receiver
│   │   ├── dock.js                       # Top sites (left) + flyout panels (right)
│   │   ├── panel_tasks.js                # Today / Later / Done drag-and-drop task panel
│   │   ├── panel_history.js              # Recently opened / Just closed with restore
│   │   ├── panel_read_later.js           # Reading list drawer with read/unread tags
│   │   ├── panel_workspaces.js           # Window tab snapshot & restore engine
│   │   ├── panel_screentime.js           # Daily site breakdown charts
│   │   ├── panel_snoozed.js              # View & cancel active snoozed tabs
│   │   ├── settings_modal.js             # Mac System Settings modal controller
│   │   └── tab_overload_bar.js           # Gentle tab count cleanup notification
│   ├── content/
│   │   ├── content_bundle.js             # Injected root controller
│   │   ├── content_styles.css            # Floating handle, sticky notes, magnifiers
│   │   ├── edge_handle.js                # Draggable left/right handle & vertical toolbar
│   │   ├── sticky_notes.js               # Per-URL persistent draggable notes
│   │   ├── table_exporter.js             # DOM table scanner to Excel-ready CSV
│   │   ├── text_expander.js              # Inline `/command` snippet replacer
│   │   ├── image_previewer.js            # Hover thumbnail magnifier
│   │   ├── weather_tint.js               # Rain/overcast ambient page overlay
│   │   └── ai_superpowers.js             # Double-click dictionary & screen OCR box
│   └── blocked/
│       ├── blocked.html                  # Minimalist focus screen
│       ├── blocked.css                   # Calm focus UI styling
│       └── blocked.js                    # Back to goal & 5-minute snooze button handlers
```

---

## 5. Storage Schema & Default Configurations

All settings and state reside in `chrome.storage.local`. Large files (wallpapers) utilize an IndexedDB store named `AuraMediaDB` to avoid Chrome storage quota exhaustion.

### 5.1 Storage Schema (`chrome.storage.local`)
```javascript
{
  // User Profile & Aesthetic
  "settings": {
    "userName": "Aditya",
    "militaryTime": false,
    "showSeconds": false,
    "themeMode": "dark", // "dark" | "light" | "auto"
    "glassOpacity": 0.65, // 0.2 to 0.95
    "wallpaperType": "sky", // "sky" | "custom"
    "activeWallpaperId": null, // uuid referencing IndexedDB entry
    "wallpaperHistory": [], // Array of { id, type: 'image'|'video', timestamp, thumbBlobUrl } (max 8)
    "enableWeatherParticles": true,
    "enableWeatherWebTint": true,
    
    // Weather
    "weatherCity": "San Francisco",
    "weatherLat": 37.7749,
    "weatherLon": -122.4194,
    "weatherUnits": "celsius", // "celsius" | "fahrenheit"
    
    // Focus System
    "focusModeActive": false,
    "focusBlockedSites": [
      "youtube.com",
      "instagram.com",
      "facebook.com",
      "x.com",
      "twitter.com",
      "reddit.com"
    ],
    "focusCooldownExpiry": 0, // epoch ms when 5-min grace period ends
    
    // Tabs & Hygiene
    "tabOverloadThreshold": 15,
    "autoGroupOnCleanup": true,
    "cleanPreservePinned": true,
    "snoozePresets": {
      "in1Hour": 60,
      "thisEvening": 18, // 18:00
      "tomorrowMorning": 9, // 09:00
      "thisWeekend": "Saturday",
      "nextWeek": "Monday"
    },
    
    // Content Script Superpowers
    "edgeHandleSide": "right", // "left" | "right"
    "edgeHandleOffsetY": 200, // px from top
    "edgeHandleHiddenSites": [], // array of domains
    "enableImageMagnifier": true,
    "enableTableExport": true,
    "enableTextExpansion": true,
    "textSnippets": [
      { "trigger": "/hi", "replacement": "Hello! Hope you are having a wonderful day." },
      { "trigger": "/date", "replacement": "{date}" },
      { "trigger": "/time", "replacement": "{time}" },
      { "trigger": "/mail", "replacement": "aditya@example.com" }
    ],
    
    // AI Mode (Groq)
    "groqApiKey": "", // AES or plain string in local storage (user local machine only)
    "groqModelText": "llama-3.1-8b-instant",
    "groqModelVision": "llama-3.2-11b-vision-preview",
    "aiEnabled": false // true if valid key entered and tested
  },

  // State Stores
  "tasks": [
    // { id: "uuid", text: "Finish pitch deck", column: "today"|"later"|"done", order: 0, createdAt: 1718000000 }
  ],
  "readLater": [
    // { id: "uuid", url: "https://...", title: "...", addedAt: 1718000000, read: false }
  ],
  "workspaces": [
    // { id: "uuid", name: "Research Sprint", createdAt: 1718000000, tabs: [ { title, url, pinned } ] }
  ],
  "snoozedTabs": [
    // { id: "uuid", url: "https://...", title: "...", wakeTime: 1718040000, alarmName: "snooze_uuid" }
  ],
  "stickyNotes": {
    // "https://news.ycombinator.com/": [ { id: "uuid", x: 100, y: 150, text: "Check back at 5pm", color: "yellow" } ]
  },
  "screentime_today": {
    // "date": "2026-11-14",
    // "domains": { "github.com": 3420, "figma.com": 5120 } // seconds active
  },
  "weather_cache": {
    // "timestamp": 1718000000,
    // "temp": 22,
    // "condition": "Rain",
    // "conditionCode": 61,
    // "isDay": 1
  }
}
```

### 5.2 IndexedDB Schema (`AuraMediaDB`)
- **Database Name:** `AuraMediaDB`
- **Version:** `1`
- **Object Store:** `wallpapers`
  - `keyPath`: `id` (string UUID)
  - Fields: `id`, `name`, `type` (`"image/png" | "image/jpeg" | "image/gif" | "video/mp4" | "video/webm"`), `blob` (Blob), `thumbnail` (Blob), `timestamp` (number).

---

## 6. Detailed Feature Specifications & UI Requirements

### 6.1 The New Tab Command Center

```
+-----------------------------------------------------------------------------------+
|  [ (o) Focus: OFF ]                                             [ 21°C Rain 🌧️ ]   |
|                                                                                   |
|                                                                                   |
|                                Good morning, Aditya                               |
|                                     09 : 42                                       |
|                               Friday, 14 November                                 |
|                                                                                   |
|                       ( )  Design the quarterly roadmap                           |
|                                                                                   |
|                       [ 🔍 Search bookmarks or web...    ]                         |
|                                                                                   |
|                                                                                   |
|                                                                                   |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   | (F) (G) (N) (Y) (X)  |  [Tasks: 3] [History] [Read] [Spaces] [Time] [⚙️]  |   |
|   +---------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------+
```

#### 6.1.1 Central Clock, Greeting, Date & Top Task Anchor
- **Greeting:** Rendered in clean sans font (`inter-variable.woff2`), `font-size: 1.5rem`, `font-weight: 400`, `letter-spacing: -0.02em`, `opacity: 0.85`.
  - Dynamic logic based on 24-hr local time:
    - `04:00 - 11:59`: "Good morning, [Name]"
    - `12:00 - 16:59`: "Good afternoon, [Name]"
    - `17:00 - 21:59`: "Good evening, [Name]"
    - `22:00 - 03:59`: "Good night, [Name]"
  - If `userName` is blank, display "Good morning", "Good afternoon", etc.
- **Clock:** Centered directly beneath greeting in elegant serif font (`playfair-display-regular.woff2`), `font-size: 6.5rem`, `font-weight: 500`, `letter-spacing: -0.04em`.
  - Formats: `HH:MM` or `HH:MM:SS` (if enabled in settings). Supports 12-hr / 24-hr format.
- **Date:** Below clock in sans font, `font-size: 1rem`, `text-transform: capitalize`, `opacity: 0.7`. E.g., "Friday, 14 November".
- **Top Task Anchor:**
  - Located 24px below the date. Displays only the **first unchecked item** from the "Today" task list.
  - UI: Glass capsule containing a circular checkbox (`18px`) and task label (`font-size: 1.05rem`).
  - Interaction: Clicking the circle triggers a micro-animation (circle fills with emerald green `#10B981`, checkmark strokes in, text slides up and fades out, and the next top task slides up in its place).
  - Empty State: If no tasks exist in "Today", display: `+ Add a focus task for today` in subtle italics. Clicking it opens the Task Flyout Panel directly focused on the input field.

#### 6.1.2 Spotlight Search Bar
- **Default Appearance:** Centered pill container, `width: 520px`, `height: 48px`, background `rgba(255, 255, 255, 0.08)`, `backdrop-filter: blur(16px)`, border `1px solid rgba(255, 255, 255, 0.14)`. Placeholder text: "Search bookmarks or type a URL...".
- **Spotlight Mode Activation:**
  - Triggers immediately when the user types the first character or presses `Ctrl+K` / `Cmd+K`.
  - **Motion Animation:** The search input smoothly translates `translateY(-140px)` upwards towards the upper-third of the screen. All background elements (Greeting, Clock, Date, Top Task, Dock) transition to `opacity: 0.05` and `pointer-events: none` over `240ms cubic-bezier(0.16, 1, 0.3, 1)`.
- **Bookmark Search Behavior:**
  - Uses `chrome.bookmarks.search(query)`.
  - Results appear in an attached glassmorphism dropdown list (max 6 items).
  - Each row shows: Favicon, bookmark title (query match highlighted in bold), and truncated path/URL.
  - Keyboard navigation: `ArrowDown` and `ArrowUp` cycle active selection; `Enter` opens the URL in the current tab; `Escape` clears search and restores normal screen layout.
- **Web Search Fallback:**
  - If no bookmarks match, the first row displays: `🔍 Search Google for "[query]"`. Pressing `Enter` navigates to `https://www.google.com/search?q=${encodeURIComponent(query)}`.
  - If the query conforms to a valid URL pattern (e.g., `reddit.com` or `localhost:3000`), the first row displays: `🌐 Go to http://[query]`.

#### 6.1.3 Dynamic Wallpaper & Media Manager
- **Default Mode (Procedural Sky):**
  - Continuous CSS radial/linear gradient canvas simulating atmospheric sky based on real solar time:
    - **Dawn (05:00 - 07:30):** Deep violet fading to amber gold (`linear-gradient(180deg, #1A102F 0%, #4E2757 45%, #C2635B 80%, #E89E6C 100%)`).
    - **Day (07:30 - 17:00):** Calm cerulean slate (`linear-gradient(180deg, #1C3144 0%, #2B4C6F 40%, #466995 100%)`).
    - **Dusk (17:00 - 19:30):** Twilight indigo to burnt copper (`linear-gradient(180deg, #0B132B 0%, #1C2541 40%, #5B3758 75%, #8B4F58 100%)`).
    - **Night (19:30 - 05:00):** Midnight obsidian with subtle celestial dust (`linear-gradient(180deg, #030712 0%, #0B0F19 50%, #111827 100%)`).
- **Custom Upload Mode:**
  - Drag-and-drop or file selector accepting `.jpg`, `.png`, `.webp`, `.gif`, and `.mp4` / `.webm` (max file size: 25MB).
  - Videos autoplay muted on loop (`playsinline`, `loop`, `muted`).
  - IndexedDB persists the file blob; the last 8 uploaded wallpapers are retained in an interactive horizontal carousel in Settings under "Look".
  - One-click deletion or selection from the 8-thumbnail gallery.

#### 6.1.4 Weather Integration & Particle Canvas
- **API Endpoint:** Open-Meteo Geocoding (`https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1`) + Open-Meteo Forecast (`https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true`).
- **Zero-Key Requirement:** Free, no API token required.
- **Caching Mechanism:** Results cached in `chrome.storage.local.weather_cache` with timestamp. Requests only execute if `Date.now() - cached.timestamp > 30 * 60 * 1000` (30-minute rate limit). Tab opens read strictly from cache.
- **Top-Right Pill:** Displays current temperature (e.g. `21°C` or `70°F`) alongside a minimalist monochrome SVG weather icon (Sun, Moon, Cloud, Drizzle, Rain, Snow, Thunderstorm, Fog). Clicking the pill opens a 5-day mini forecast tooltip.
- **Weather Particle Canvas Overlay:**
  - Fullscreen `<canvas id="weather-canvas">` placed immediately above the wallpaper but beneath UI text.
  - **Rain:** Angled translucent streaks falling at varying speeds (`alpha: 0.35`, slanted 12 degrees), creating small ripple rings upon reaching the bottom 10% of the screen.
  - **Snow:** Soft circular particles drifting slowly with horizontal sinusoidal oscillation.
  - **Thunderstorm:** Rain streaks combined with periodic subtle white canvas flash opacity (`0.25` opacity for 60ms) triggered randomly every 8-15 seconds.
  - **Night/Clear:** Subtle twinkling stars (tiny 1-2px circles pulsing opacity between 0.2 and 0.8).
  - **Performance Safety:** Canvas rendering halts completely when `document.hidden === true` via `requestAnimationFrame` loop cancellation.
  - **Settings Control:** Toggle to disable particles entirely + preview buttons (`[Test Rain]`, `[Test Snow]`, `[Test Thunder]`, `[Test Fog]`, `[Test Stars]`) to inspect each effect immediately.
- **Cross-Webpage Weather Tint:**
  - If enabled, when the weather is `Rain` or `Thunderstorm`, content scripts inject a persistent, high-transparency overlay onto all pages: `rgba(20, 35, 60, 0.04)` with `mix-blend-mode: multiply` and `pointer-events: none`. User can disable this in Settings with a single switch.

#### 6.1.5 Focus Mode Engine & Interception
- **Top-Left Switch:** High-contrast pill toggle: `[ (o) Focus: OFF ]` / `[ (•) Focus: ON ]`. Green accent glow when active.
- **Domain Interception Rules:**
  - Content script & background service worker listen to `chrome.tabs.onUpdated` and `webNavigation.onBeforeNavigate`.
  - If `settings.focusModeActive === true` AND current domain matches `settings.focusBlockedSites`:
    - Check `settings.focusCooldownExpiry`. If `Date.now() < focusCooldownExpiry`, allow navigation (user is on a 5-minute break).
    - If cooldown has elapsed, redirect tab to `chrome-extension://<id>/src/blocked/blocked.html?target=${encodeURIComponent(tab.url)}`.
- **Blocked Focus Screen (`blocked.html`):**
  - Aesthetic: Deep obsidian background, soft ambient purple backlight.
  - Headline: "Stay in your flow, Aditya."
  - Central Card: "Your commitment today:" followed by the active **Top Task** displayed in bold serif font.
  - Action 1: `[ Back to My Goal ]` (Primary button: closes the current tab or opens New Tab).
  - Action 2: `[ Give me 5 minutes ]` (Ghost button: sets `focusCooldownExpiry = Date.now() + 5 * 60 * 1000`, navigates back to target URL).
  - After 5 minutes, background worker fires an alarm that clears the cooldown and re-blocks any open distraction tabs.
- **Editable Site List:** Full domain editor inside Settings -> Focus (Add domain, remove domain, reset to defaults).

#### 6.1.6 The Mac-Style Bottom Dock & Flyout Panels
- **Container Styling:** Centered at the bottom (`bottom: 24px`), height `58px`, padding `6px 12px`, border-radius `22px`, background `rgba(28, 28, 30, 0.75)`, `backdrop-filter: blur(24px) saturate(180%)`, border `1px solid rgba(255, 255, 255, 0.12)`, box-shadow `0 20px 40px rgba(0,0,0,0.4)`.
- **Left Wing (Top Sites):**
  - Fetched via `chrome.topSites.get()`.
  - Max 5 distinct entries. Deduplicated by hostname (e.g. only one YouTube icon, only one GitHub icon).
  - Rendered as 36x36px rounded square icons with subtle hover scale (`scale(1.15)` with spring transition).
- **Vertical Divider:** 1px width, 24px height, background `rgba(255, 255, 255, 0.15)`, margin `0 10px`.
- **Right Wing (Tool Panels):**
  - Interactive icons with SVG glyphs:
    1. **Tasks** (with red/amber badge indicating unfinished Today tasks count).
    2. **Recently Opened**
    3. **Read Later**
    4. **Workspaces**
    5. **Screen Time**
    6. **Snoozed Tabs**
    7. **Settings Gear**
  - Clicking an icon opens its corresponding **Glass Flyout Panel** directly above the dock (`bottom: 92px`), anchored smoothly. Opening a panel closes any other open panel. Clicking outside dismisses the panel.

##### Flyout Panel Specifications:
1. **Tasks Panel:**
   - Three tab headers: `Today`, `Later`, `Done`.
   - Input field: "+ Add new task... (Press Enter)".
   - Items render with drag handle (reorder via HTML5 Drag and Drop), editable text on double-click, and action buttons (`Move to Later`, `Delete`).
   - "Done" view includes a `[Clear All Done]` button.
2. **Recently Opened Panel:**
   - Search input at top to filter history instantly.
   - Top banner: "Just closed" section displaying the last 3 closed tabs with a 1-click `[Restore]` button.
   - Body: Timeline grouped into sections: `Today`, `Yesterday`, `Earlier this week`.
   - Toggle switch at top right: `[ Pages | Sites ]` (Pages displays individual URLs; Sites groups by domain).
3. **Read Later Panel:**
   - Displays list of saved articles.
   - Each item includes: Favicon, Title, Domain, Date Added, `[Open & Archive]` and `[Delete]`.
4. **Workspaces Panel:**
   - Allows saving all tabs in the current window as a named session.
   - Input: `[ Workspace name... ]` + button `[ Save Current Window ]`.
   - Saved workspaces list: Shows name, tab count, creation date, button `[ Restore in New Window ]`, and button `[ Replace Current Tabs ]`.
5. **Screen Time Panel:**
   - Visual horizontal bar graph showing minutes spent per domain for the current day.
   - Calculated strictly when Chrome is active and user is not idle (via `chrome.idle.queryState`).
   - Shows total focused browser time today.
6. **Snoozed Tabs Panel:**
   - Lists all scheduled snoozed tabs with target wake-up times (e.g. "Wakes up Tomorrow at 9:00 AM").
   - Action: `[ Wake Up Now ]` or `[ Cancel Snooze ]`.

---

## 7. Tab Management & Superpowers

### 7.1 Canonical Deduplication Engine
- **Trigger:** Click on extension icon, shortcut `Alt+Shift+C`, or button inside New Tab.
- **Normalization Algorithm:**
  ```javascript
  function normalizeUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      // 1. Strip all tracking and campaign query parameters
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
        'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi'
      ];
      trackingParams.forEach(param => url.searchParams.delete(param));
      
      // 2. Remove hash fragments unless it's a known SPA router
      url.hash = '';
      
      // 3. Remove trailing slashes
      let clean = url.toString().replace(/\/+$/, '');
      return clean.toLowerCase();
    } catch {
      return rawUrl;
    }
  }
  ```
- **Preservation Rules:**
  - Never close pinned tabs (`tab.pinned === true`).
  - Never close the currently active tab in the focused window.
  - If duplicates exist across windows, close the oldest inactive duplicates.
  - Dispatches Chrome notification or subtle toast: `"Cleaned up 6 duplicate tabs."`.

### 7.2 Domain & Topic Tab Grouping
- **Standard Mode (Zero AI):**
  - Iterates through all open unpinned tabs in the current window.
  - Groups tabs sharing the same base domain (e.g. `github.com` -> Group "GitHub", `google.com` -> Group "Google").
  - Assigns unique consistent Chrome colors (`blue`, `red`, `yellow`, `green`, `pink`, `purple`, `cyan`, `orange`).
  - Ignores groups with only 1 tab.
- **AI Mode (Groq Enabled):**
  - If `settings.aiEnabled === true`, gathers `{ id, title, url }` of all open tabs.
  - Sends a single structured JSON prompt to Groq (`llama-3.1-8b-instant`):
    ```
    Group these browser tabs into 2 to 5 meaningful thematic project categories (e.g. "Trip Planning", "React Research", "Financial Filing").
    Return ONLY a JSON array of objects:
    [{"name": "Category Name", "color": "blue|red|green|yellow|pink|purple|cyan|orange", "tabIds": [1, 2, 3]}]
    ```
  - Background worker parses the JSON safely and calls `chrome.tabs.group()` with titles and colors.
  - Fallback: If Groq rate-limits or returns malformed JSON, fallback immediately to Domain Grouping without prompting an error.

### 7.3 Tab Overload Notification
- If unpinned tab count in any window exceeds `settings.tabOverloadThreshold` (default: 15):
  - Extension icon displays a subtle amber badge count: `18`.
  - New Tab displays a floating pill at the bottom: `"You have 18 tabs open. [ Clean Up Now ] [ Dismiss ]"`.
  - Rate limiting: Dismissing mutes the bar for 3 hours.

### 7.4 Snooze Tab System
- **Preset Options:**
  1. `In 1 Hour` (`Date.now() + 60 * 60 * 1000`)
  2. `This Evening` (Today at 18:00; if past 18:00, 21:00)
  3. `Tomorrow Morning` (Next calendar day at 09:00)
  4. `This Weekend` (Upcoming Saturday at 10:00)
  5. `Next Week` (Upcoming Monday at 09:00)
- **Execution Mechanism:**
  - Saves tab URL and Title into `snoozedTabs` in storage.
  - Creates a persistent `chrome.alarms` entry: `chrome.alarms.create(alarmName, { when: wakeTimestamp })`.
  - Closes the active tab.
  - When alarm fires in `service_worker.js`:
    - `chrome.tabs.create({ url: snoozedItem.url, active: false })`.
    - Dispatches Chrome notification: `"Tab Awakened: [Title]"`.
    - Removes item from `snoozedTabs` storage.

---

## 8. In-Page Superpowers (Content Scripts)

The content script injects cleanly into `<all_urls>` without modifying global webpage CSS or conflicting with host stylesheets.

### 8.1 Draggable Edge Handle & Quick Toolbar
- **Handle DOM Element:** Minimalist vertical capsule (`6px` wide x `44px` high), styled with translucent glass and pill radius.
- **Positioning:** Fixed to screen edge (default right, `top: 200px`).
- **Draggability:** Clicking and dragging vertically adjusts `top` offset. Dragging across 50% screen width snaps the handle to the left edge. Position is saved immediately to `chrome.storage.local`.
- **Hover / Expand State:** Hovering the handle expands it into a sleek vertical toolbar (`38px` wide) housing SVG icons with animated tooltips:
  1. 🔖 **Save for Later** (Adds to Read Later list, flashes checkmark).
  2. ⏳ **Snooze Tab** (Opens mini flyout with 5 time presets).
  3. 🧹 **Clean Up Tabs** (Invokes canonical deduplication).
  4. 📋 **Copy Text from Screen** (AI OCR box selector).
  5. 📊 **Download Table as Excel** (Inspects tables on page).
  6. 📝 **Add Sticky Note** (Places note at viewport center).
  7. ⚙️ **More Options** (Includes "Hide on this website").

### 8.2 Text Expansion Engine
- Listens to `input` events on all `input[type="text"]`, `input[type="search"]`, `textarea`, and `[contenteditable="true"]`.
- Tracks typed buffer. When a registered trigger is detected (e.g. `/hi` or `/date` followed by a Space or Enter):
  - Replaces trigger string with snippet expansion.
  - Replaces dynamic tokens:
    - `{date}` -> Current date in `DD MMM YYYY` (e.g. `14 Nov 2026`).
    - `{time}` -> Current time in `HH:MM` (e.g. `14:35`).
  - Dispatches native `InputEvent` so modern reactive frameworks (React, Vue) capture state changes.

### 8.3 Table-to-Excel Exporter
- Toolbar action: "Download Table as Excel".
- Highlights all `<table>` elements on the page with a subtle cyan outline.
- If multiple tables exist, numbers them (`Table 1`, `Table 2`) with an overlaid floating button.
- Extraction Logic:
  - Iterates rows (`<tr>`) and cells (`<th>`, `<td>`).
  - Cleans cell text (strips multiple line breaks, unescapes characters).
  - Encodes into CSV string with **UTF-8 BOM (`\uFEFF`)** to ensure Excel preserves special symbols, currencies, and international characters correctly without corrupting encoding.
  - Automatically triggers browser download: `table_export_[domain]_[timestamp].csv`.

### 8.4 Persistent Per-URL Sticky Notes
- User clicks "Add Sticky Note" from the toolbar.
- Spawns a draggable, resizable note card (`220px` x `180px`, pale warm amber or dark slate glass).
- Features:
  - Editable `textarea`.
  - Minimalist top bar: Drag handle, Color dot switcher (Amber, Emerald, Azure, Obsidian), Minimize/Expand button, Close/Delete button.
  - Position coordinates (`x`, `y`), dimensions, color, and text content are debounced and saved to `chrome.storage.local.stickyNotes[window.location.href]`.
  - When returning to the URL in future sessions, sticky notes re-mount at their exact saved coordinates.

### 8.5 Image Magnifier Preview
- When `settings.enableImageMagnifier === true`:
  - Listens for `mouseover` on `<img>` elements whose natural or rendered dimensions are between `32px` and `300px`.
  - After a 350ms rest hover, a floating glass popover renders a crisp enlarged view (`max-width: 480px`, `max-height: 480px`, rounded corners, shadow).
  - Automatically repositions to remain within the visible viewport bounds.
  - Disappears immediately on `mouseout`.

---

## 9. AI Integration (Groq Optional Superpowers)

### 9.1 Zero-AI Base State & Graceful Degradation
- If `settings.groqApiKey` is empty or invalid:
  - AI Tab Grouping falls back seamlessly to base domain grouping.
  - Double-clicking a word functions normally with default browser behavior.
  - Clicking "Copy Text from Screen" displays a subtle toast:  
    `"Enable AI Mode in Aura Settings to unlock screen text extraction."`
  - No error banners, no red warning alerts, and no console exceptions.

### 9.2 Inline Word Definition Tooltip
- When enabled, double-clicking any single word on a webpage displays a micro popover above the selection.
- Popover contains:
  - The word in bold.
  - Definition in plain English (max 2 sentences).
  - 1 natural example sentence.
- Powered by Groq `llama-3.1-8b-instant` with temperature `0.1` and `max_tokens: 100`.
- Includes a 24-hour LRU memory cache in `chrome.storage.local` to prevent redundant API queries for identical words.

### 9.3 Screen OCR via Vision Model
- User clicks "Copy Text from Screen" on the Aura toolbar.
- Viewport freezes into an interactive crosshair selection canvas.
- User drags a bounding box over any element (image, video player, canvas, untranslatable text).
- Workflow:
  1. Content script sends crop coordinates `{ x, y, width, height, dpr: window.devicePixelRatio }` to `service_worker.js`.
  2. Service worker executes `chrome.tabs.captureVisibleTab(null, { format: 'png' })`.
  3. Offscreen canvas crops the PNG to the exact bounding box.
  4. Cropped image is converted to Base64 data URL.
  5. Base64 payload is dispatched to Groq Vision API (`llama-3.2-11b-vision-preview`):
     ```json
     {
       "model": "llama-3.2-11b-vision-preview",
       "messages": [
         {
           "role": "user",
           "content": [
             { "type": "text", "text": "Extract and transcribe all legible text from this image exactly as written. Return ONLY the extracted text, with no preamble, formatting, or commentary." },
             { "type": "image_url", "image_url": { "url": "data:image/png;base64,..." } }
           ]
         }
       ],
       "temperature": 0.1
     }
     ```
  6. Response string is automatically written to the user's system clipboard via `navigator.clipboard.writeText()`.
  7. Content script displays a sleek toast: `"Copied text to clipboard!"`.

---

## 10. Design System & Aesthetics

### 10.1 Typography
- **UI Body & Controls:** `Inter`, sans-serif (`assets/fonts/inter-variable.woff2`).
- **Command Center Clock:** `Playfair Display`, serif (`assets/fonts/playfair-display-regular.woff2`).
- **Code & Triggers:** System monospace font stack (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`).

### 10.2 Color Palette & Glassmorphic Tokens
```css
:root {
  /* Surface Layers */
  --aura-bg-base: #0B0F17;
  --aura-surface-glass: rgba(28, 28, 30, 0.72);
  --aura-surface-hover: rgba(255, 255, 255, 0.08);
  --aura-surface-active: rgba(255, 255, 255, 0.14);
  
  /* Borders & Dividers */
  --aura-border-subtle: rgba(255, 255, 255, 0.08);
  --aura-border-glass: rgba(255, 255, 255, 0.14);
  --aura-border-focus: rgba(99, 102, 241, 0.6);
  
  /* Text Accents */
  --aura-text-primary: #F9FAFB;
  --aura-text-secondary: rgba(249, 250, 251, 0.65);
  --aura-text-tertiary: rgba(249, 250, 251, 0.40);
  
  /* Status Colors */
  --aura-accent-emerald: #10B981;
  --aura-accent-amber: #F59E0B;
  --aura-accent-rose: #EF4444;
  --aura-accent-indigo: #6366F1;
  
  /* Mac Shadows & Blurs */
  --aura-glass-blur: blur(24px) saturate(190%);
  --aura-shadow-elevated: 0 24px 48px -12px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.1);
}
```

### 10.3 Form Controls & Components
- **Zero Browser Defaults:** All `<input>`, `<select>`, `<button>`, and checkboxes must have native styling reset (`appearance: none`).
- **Toggles:** Custom 40px x 22px track with sliding 18px circle, spring bezier transition (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Reduced Motion Compliance:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```

---

## 11. Settings Window (Mac System Settings Modal)

### 11.1 Window Geometry & Structure
- Centered modal dialog, `width: 780px`, `height: 540px`, border-radius: `16px`.
- Split view layout:
  - **Left Sidebar (210px):**
    - Search bar at top.
    - Navigation items with icons: `Look & Feel`, `Weather`, `Focus Mode`, `Tabs & Hygiene`, `Text Shortcuts`, `On Websites`, `AI Mode (Groq)`.
  - **Right Main Content Area:**
    - Scrollable settings cards corresponding to selected tab.
  - **Window Controls:** macOS-style decorative red, yellow, and green window buttons at the top-left of the sidebar. Clicking red closes the modal.

### 11.2 Complete Settings Matrix & Default Values
| Section | Setting Key | Type | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Look** | `userName` | string | `""` | Name displayed on New Tab greeting. |
| **Look** | `militaryTime` | boolean | `false` | Toggle 24-hour clock format. |
| **Look** | `showSeconds` | boolean | `false` | Display seconds on central clock. |
| **Look** | `wallpaperType` | enum | `"sky"` | `"sky"` (procedural) or `"custom"` (uploaded media). |
| **Look** | `glassOpacity` | number | `0.65` | Adjusts blur container background opacity. |
| **Weather** | `weatherCity` | string | `"London"` | City for weather forecast & animations. |
| **Weather** | `weatherUnits` | enum | `"celsius"` | `"celsius"` or `"fahrenheit"`. |
| **Weather** | `enableWeatherParticles`| boolean | `true` | Rain, snow, star particles on wallpaper. |
| **Weather** | `enableWeatherWebTint` | boolean | `true` | Soft rainy/overcast tint on all websites. |
| **Focus** | `focusModeActive` | boolean | `false` | Master toggle for Focus Mode. |
| **Focus** | `focusBlockedSites` | string[] | `["youtube.com", "instagram.com", "facebook.com", "x.com", "reddit.com"]` | Domains redirected during Focus Mode. |
| **Tabs** | `tabOverloadThreshold` | number | `15` | Tab count before warning bar shows. |
| **Tabs** | `autoGroupOnCleanup` | boolean | `true` | Automatically group tabs when cleaning up. |
| **Tabs** | `cleanPreservePinned` | boolean | `true` | Protect pinned tabs from deduplication. |
| **Shortcuts**| `textSnippets` | object[] | `[{trigger: "/hi", ...}, {trigger: "/date", ...}]` | Global text expansion replacement dictionary. |
| **Websites** | `edgeHandleSide` | enum | `"right"` | Default edge dock side (`"left"` or `"right"`). |
| **Websites** | `enableImageMagnifier` | boolean | `true` | Hover zoom on small images. |
| **Websites** | `enableTableExport` | boolean | `true` | Export HTML tables to CSV. |
| **AI Mode** | `groqApiKey` | string | `""` | User's personal Groq API key. |
| **AI Mode** | `aiEnabled` | boolean | `false` | Automatically set to true upon successful key verification. |

---

## 12. Complete UI Copy & Microcopy Reference

### 12.1 Button Labels
- Primary Actions: `Save Changes`, `Clean Up Tabs`, `Add Task`, `Restore Session`, `Test API Key`.
- Focus Screen: `Back to My Goal`, `Give Me 5 Minutes`.
- Weather Previews: `Test Rain`, `Test Snow`, `Test Thunder`, `Test Fog`, `Test Stars`.
- Exporter: `Download as CSV`.
- General: `Dismiss`, `Cancel`, `Clear All Done`, `Restore`, `Delete`.

### 12.2 Empty States
- **Top Task Anchor:** `+ Add a focus task for today`
- **Today Tasks:** `No tasks for today. You are completely caught up!`
- **Later Tasks:** `No upcoming tasks scheduled.`
- **Done Tasks:** `No completed tasks yet. Finish your top task to see it here!`
- **Read Later:** `Your reading list is empty. Hover the edge handle on any article to save it.`
- **Recently Opened:** `No recent history found matching your search.`
- **Workspaces:** `No saved workspaces. Save this window's tabs to return to them later.`
- **Snoozed Tabs:** `No tabs currently snoozed.`

### 12.3 Error & Status Notifications
- Duplicate cleanup completed: `Cleaned up {n} duplicate tabs.`
- Tab snoozed: `Tab snoozed until {time}. We will bring it back for you.`
- CSV export: `Exported {n} rows from {domain} table.`
- Groq validation success: `Groq API Key verified! AI Superpowers unlocked.`
- Groq validation failed: `Invalid API Key. Please verify key format and try again.`
- OCR success: `Copied extracted text to clipboard.`
- OCR failure / No text: `No text detected in selected area.`
- AI disabled hint: `Enable AI Mode in Aura Settings to use this superpower.`

---

## 13. Edge Cases & Resilience Engineering

1. **Duplicate URLs with Varying Query Strings:**
   - Handled via `normalizeUrl()`. Ignores UTM parameters, referral identifiers, and trailing slashes. Pinned tabs and active tabs are never closed.
2. **Offline Operation & Weather API Failure:**
   - If Open-Meteo is unreachable, the system falls back to cached weather. If cache is empty, the top-right pill hides cleanly and the wallpaper defaults to time-of-day sky without crashing.
3. **Large Video Wallpaper Storage Quotas:**
   - Chrome `storage.local` has a quota limit. All wallpaper media is saved exclusively in IndexedDB (`AuraMediaDB`), preventing extension storage errors.
4. **Restricted Browser Pages:**
   - Content scripts cannot execute on `chrome://*`, `chrome-extension://*`, or Chrome Web Store pages. Handle clicks and shortcuts gracefully catch permission rejections without console errors.
5. **Dynamic SPAs (React, Next.js, Vue) Text Expansion:**
   - Simply setting `input.value = replacement` breaks virtual DOM state in React. The content script must invoke `input.dispatchEvent(new Event('input', { bubbles: true }))` to guarantee frameworks capture the change.
6. **Focus Mode Loop Prevention:**
   - Prevent infinite redirect loops: `blocked.html` and `newtab.html` must never be added to the blocked sites filter.
7. **Excel International Character Corruption:**
   - When converting HTML tables to CSV, always prepend the Byte Order Mark `\uFEFF`. Without this, non-ASCII characters and accents break when opened in Microsoft Excel.

---

## 14. Step-by-Step Build Order (For Single-Pass Autonomous Build)

To implement this extension without blocking dependencies, construct the codebase in this exact sequence:

```
[Phase 1: Manifest & Foundation]
  ├── manifest.json
  ├── assets/ (fonts, icons)
  ├── src/common/constants.js
  ├── src/common/storage.js
  └── src/common/utils.js

[Phase 2: Service Worker & Background Services]
  ├── src/background/tab_manager.js
  ├── src/background/screentime_tracker.js
  ├── src/background/focus_enforcer.js
  └── src/background/service_worker.js

[Phase 3: Blocked Focus Screen]
  ├── src/blocked/blocked.html
  ├── src/blocked/blocked.css
  └── src/blocked/blocked.js

[Phase 4: Content Script Superpowers]
  ├── src/content/content_styles.css
  ├── src/content/edge_handle.js
  ├── src/content/sticky_notes.js
  ├── src/content/table_exporter.js
  ├── src/content/text_expander.js
  ├── src/content/image_previewer.js
  ├── src/content/weather_tint.js
  ├── src/content/ai_superpowers.js
  └── src/content/content_bundle.js

[Phase 5: New Tab Core Framework]
  ├── src/newtab/newtab.html
  ├── src/newtab/newtab.css
  ├── src/newtab/clock.js
  ├── src/newtab/top_task.js
  ├── src/newtab/spotlight.js
  ├── src/newtab/wallpaper.js
  ├── src/newtab/weather.js
  └── src/newtab/focus_banner.js

[Phase 6: New Tab Dock & Flyout Panels]
  ├── src/newtab/dock.js
  ├── src/newtab/panel_tasks.js
  ├── src/newtab/panel_history.js
  ├── src/newtab/panel_read_later.js
  ├── src/newtab/panel_workspaces.js
  ├── src/newtab/panel_screentime.js
  ├── src/newtab/panel_snoozed.js
  ├── src/newtab/tab_overload_bar.js
  └── src/newtab/settings_modal.js

[Phase 7: AI Integration & Final Wiring]
  ├── src/common/groq_client.js
  └── src/newtab/newtab.js (root assembly)
```

---

## 15. Feature Acceptance Criteria ("Done When" Tests)

| Component | Test Case | "Done When" Verification Checklist |
| :--- | :--- | :--- |
| **New Tab Screen** | Initial Load | Open new tab: Serif clock displays accurate time, greeting matches local hour, procedural sky reflects morning/day/dusk/night, zero console errors. |
| **Spotlight Search** | Search & Fallback | Press `Ctrl+K` or type: Search bar slides upward, background dims. Type bookmark title: Bookmark displays with favicon; press `Enter`: Navigates to bookmark. Type non-existent query: Google fallback row appears. |
| **Top Task Anchor** | Progression | Top task appears below date. Click circular checkmark: Circle turns green, item slides up, next task appears in its place. |
| **Weather & Canvas** | Live Weather & Particles | Set city to a rainy city: Canvas renders falling rain streaks. Toggle particles off in Settings: Canvas halts rendering immediately. Click `[Test Thunder]`: Screen flashes subtly. |
| **Focus Mode** | Block & Cooldown | Toggle Focus ON. Visit `youtube.com`: Tab is immediately redirected to `blocked.html` showing active Top Task. Click `[Give me 5 minutes]`: Navigates back to YouTube; after 5 minutes, YouTube is re-blocked. |
| **Dock & Tasks** | Task Operations | Click Task icon in Dock: Glass panel opens above dock. Add item "Build extension": Appears in Today column and updates Top Task on New Tab. Drag to Later: Moves cleanly. |
| **Tab Hygiene** | Deduplication | Open 3 tabs of `https://en.wikipedia.org/wiki/Earth?utm_source=test#Overview`. Click extension action: 2 duplicate tabs close immediately; pinned tabs and active tab remain open. Toast reports count. |
| **Tab Snooze** | Persistent Snooze | Right-click toolbar on webpage -> Snooze -> "In 1 Hour". Active tab closes. Open New Tab -> Dock -> Snoozed panel: Item appears with countdown. Fast-forward alarm in DevTools: Tab re-opens automatically. |
| **Workspaces** | Snapshot & Restore | Open 4 unique tabs. Open Workspaces panel -> Type "Sprint A" -> Save. Close all tabs. Click `[Restore in New Window]`: A new Chrome window opens with all 4 tabs intact. |
| **Edge Handle** | Drag & Toolbar | Visit any article (e.g. `medium.com`). A slim 6px handle appears on right edge. Drag to left edge: Snaps to left and persists on reload. Hover handle: Toolbar expands with SVG icons. |
| **Table Exporter** | Excel CSV Download | Open Wikipedia page with a table. Click "Download Table as Excel" on Aura toolbar. A CSV file downloads. Open in Excel: Unicode symbols, accents, and columns align without gibberish. |
| **Text Expansion** | Trigger Replacement | In any text field, type `/hi ` (with space). Immediately expands to "Hello! Hope you are having a wonderful day.". Type `/date `: Replaces with current date. |
| **Sticky Notes** | Per-URL Persistence | Click "Add Sticky Note" on Aura toolbar. Type "Testing note". Move to corner. Reload page: Sticky note re-mounts at exact position with saved text. |
| **AI Superpowers** | Groq Mode (Optional) | Without API key: Click "Copy Text from Screen" -> Shows toast "Enable AI Mode in Settings". Enter free Groq key in Settings -> Verify -> Success. Select screen area: Extracts text and copies to clipboard. Double-click word: Definition tooltip opens. |

---

## 16. Technical Assumptions & Sensible Defaults

1. **Weather Geocoding:** Defaults to Open-Meteo free API. If geocoding fails, fallback coordinates default to `51.5074, -0.1278` (London) as safe default.
2. **Groq Models Selected:**
   - Text inference: `llama-3.1-8b-instant` (ultra-fast, free tier friendly, 8k context).
   - Vision OCR: `llama-3.2-11b-vision-preview` (high visual acuity for screen crops).
3. **IndexedDB Media Quota:** Browser IndexedDB typically allows up to 20% of available disk space, ensuring full resolution MP4/WebM video wallpapers can be saved without exceeding extension memory boundaries.
4. **Permissions Principle:** No invasive identity, microphone, or camera permissions are requested. Content scripts only access the active DOM.
