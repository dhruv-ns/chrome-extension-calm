// Aura Tab - Mac System Settings Window Controller

import { getSettings, updateSettings } from '../common/storage.js';
import { verifyGroqApiKey } from '../common/groq_client.js';
import { handleWallpaperUpload, handleWebWallpaperUrl, ALL_WALLPAPERS } from './wallpaper.js';
import { setWeatherEffect, stopWeatherEffect } from './weather.js';
import { escapeHtml } from '../common/utils.js';

export async function initSettingsModal(onSettingsSaved) {
  const backdrop = document.getElementById('settings-modal');
  const closeBtn = document.getElementById('settings-btn-close');
  const navItems = backdrop.querySelectorAll('.nav-item');
  const panes = backdrop.querySelectorAll('.settings-pane');

  // Load and populate current settings
  async function populateSettings() {
    const settings = await getSettings();

    // Look
    document.getElementById('setting-user-name').value = settings.userName || '';
    document.getElementById('setting-military-time').checked = !!settings.militaryTime;
    document.getElementById('setting-show-seconds').checked = !!settings.showSeconds;

    renderThemeGallery(settings.wallpaperType || 'sky');
    renderWallpaperHistory(settings.wallpaperHistory, settings.activeWallpaperId);

    // Weather
    document.getElementById('setting-weather-city').value = settings.weatherCity || '';
    const btnUnitC = document.getElementById('btn-unit-c');
    const btnUnitF = document.getElementById('btn-unit-f');
    if (settings.weatherUnits === 'fahrenheit') {
      btnUnitF.classList.add('active');
      btnUnitC.classList.remove('active');
    } else {
      btnUnitC.classList.add('active');
      btnUnitF.classList.remove('active');
    }
    document.getElementById('setting-weather-particles').checked = !!settings.enableWeatherParticles;
    document.getElementById('setting-weather-tint').checked = !!settings.enableWeatherWebTint;

    // Focus
    document.getElementById('setting-focus-toggle').checked = !!settings.focusModeActive;
    renderBlockedSites(settings.focusBlockedSites || []);

    // Tabs
    document.getElementById('setting-tab-threshold').value = settings.tabOverloadThreshold || 15;
    document.getElementById('setting-auto-group').checked = !!settings.autoGroupOnCleanup;
    document.getElementById('setting-preserve-pinned').checked = !!settings.cleanPreservePinned;

    // Shortcuts
    renderShortcuts(settings.textSnippets || []);

    // Websites
    const btnEdgeRight = document.getElementById('btn-edge-right');
    const btnEdgeLeft = document.getElementById('btn-edge-left');
    if (settings.edgeHandleSide === 'left') {
      btnEdgeLeft.classList.add('active');
      btnEdgeRight.classList.remove('active');
    } else {
      btnEdgeRight.classList.add('active');
      btnEdgeLeft.classList.remove('active');
    }
    document.getElementById('setting-image-magnifier').checked = !!settings.enableImageMagnifier;
    document.getElementById('setting-table-export').checked = !!settings.enableTableExport;

    // AI
    document.getElementById('setting-groq-key').value = settings.groqApiKey || '';
    const groqMsg = document.getElementById('groq-status-msg');
    const aiBadge = document.getElementById('ai-status-badge');
    if (settings.aiEnabled && settings.groqApiKey) {
      groqMsg.textContent = 'Groq API Key verified! AI Superpowers unlocked.';
      groqMsg.style.color = '#10B981';
      aiBadge.textContent = 'Active';
      aiBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      aiBadge.style.color = '#10B981';
    } else {
      groqMsg.textContent = 'AI is currently OFF.';
      groqMsg.style.color = 'var(--text-muted)';
      aiBadge.textContent = 'Requires Key';
      aiBadge.style.background = 'rgba(99, 102, 241, 0.2)';
      aiBadge.style.color = '#818CF8';
    }
  }

  // Sidebar navigation switching
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Modal open/close
  window.openSettingsModal = function () {
    populateSettings();
    backdrop.classList.add('open');
  };

  closeBtn.addEventListener('click', () => {
    backdrop.classList.remove('open');
  });

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) {
      backdrop.classList.remove('open');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) {
      backdrop.classList.remove('open');
    }
  });

  // Look settings listeners
  document.getElementById('setting-user-name').addEventListener('change', async (e) => {
    const updated = await updateSettings({ userName: e.target.value });
    if (onSettingsSaved) onSettingsSaved(updated);
  });

  document.getElementById('setting-military-time').addEventListener('change', async (e) => {
    const updated = await updateSettings({ militaryTime: e.target.checked });
    if (onSettingsSaved) onSettingsSaved(updated);
  });

  document.getElementById('setting-show-seconds').addEventListener('change', async (e) => {
    const updated = await updateSettings({ showSeconds: e.target.checked });
    if (onSettingsSaved) onSettingsSaved(updated);
  });

  let currentGalleryFilter = 'all';

  function renderThemeGallery(currentType, category = currentGalleryFilter) {
    const galleryEl = document.getElementById('settings-theme-gallery');
    if (!galleryEl) return;
    galleryEl.innerHTML = '';

    const list = category === 'all'
      ? ALL_WALLPAPERS
      : ALL_WALLPAPERS.filter(w => w.category === category);

    list.forEach(theme => {
      const card = document.createElement('div');
      card.className = `theme-gallery-card ${theme.id === currentType ? 'active' : ''}`;
      card.innerHTML = `
        <div class="theme-card-preview" style="background: ${theme.preview};">
          <span class="theme-card-tag">${theme.tag}</span>
        </div>
        <div class="theme-card-info">
          <div class="theme-card-name">${escapeHtml(theme.name)}</div>
          <div class="theme-card-desc">${escapeHtml(theme.desc)}</div>
        </div>
      `;

      card.addEventListener('click', async () => {
        galleryEl.querySelectorAll('.theme-gallery-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const updated = await updateSettings({ wallpaperType: theme.id });
        if (onSettingsSaved) onSettingsSaved(updated);
      });

      galleryEl.appendChild(card);
    });
  }

  // Settings theme filter buttons
  document.querySelectorAll('.settings-theme-filter-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      document.querySelectorAll('.settings-theme-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentGalleryFilter = btn.dataset.category;
      const settings = await getSettings();
      renderThemeGallery(settings.wallpaperType, currentGalleryFilter);
    });
  });

  // Apply wallpaper from web URL in Settings
  const webApplyBtn = document.getElementById('btn-setting-apply-web-url');
  const webUrlInput = document.getElementById('setting-web-url-input');
  if (webApplyBtn && webUrlInput) {
    webApplyBtn.addEventListener('click', async () => {
      const url = webUrlInput.value.trim();
      if (url) {
        webUrlInput.value = '';
        const success = await handleWebWallpaperUrl(url);
        if (success) {
          const settings = await getSettings();
          populateSettings();
          if (onSettingsSaved) onSettingsSaved(settings);
          alert('Web wallpaper applied successfully!');
        } else {
          alert('Please enter a valid HTTP/HTTPS link to an image, GIF, or MP4/WebM video.');
        }
      }
    });
  }

  // File upload input
  document.getElementById('wallpaper-file-input').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleWallpaperUpload(file);
      await populateSettings();
      if (onSettingsSaved) onSettingsSaved(await getSettings());
    }
  });

  // Weather Settings
  document.getElementById('btn-save-city').addEventListener('click', async () => {
    const city = document.getElementById('setting-weather-city').value.trim();
    if (city) {
      const updated = await updateSettings({ weatherCity: city });
      if (onSettingsSaved) onSettingsSaved(updated);
    }
  });

  document.getElementById('btn-unit-c').addEventListener('click', async () => {
    document.getElementById('btn-unit-c').classList.add('active');
    document.getElementById('btn-unit-f').classList.remove('active');
    const updated = await updateSettings({ weatherUnits: 'celsius' });
    if (onSettingsSaved) onSettingsSaved(updated);
  });

  document.getElementById('btn-unit-f').addEventListener('click', async () => {
    document.getElementById('btn-unit-f').classList.add('active');
    document.getElementById('btn-unit-c').classList.remove('active');
    const updated = await updateSettings({ weatherUnits: 'fahrenheit' });
    if (onSettingsSaved) onSettingsSaved(updated);
  });

  document.getElementById('setting-weather-particles').addEventListener('change', async (e) => {
    const updated = await updateSettings({ enableWeatherParticles: e.target.checked });
    if (onSettingsSaved) onSettingsSaved(updated);
  });

  document.getElementById('setting-weather-tint').addEventListener('change', async (e) => {
    await updateSettings({ enableWeatherWebTint: e.target.checked });
  });

  // Weather Preview Buttons
  document.getElementById('test-rain').addEventListener('click', () => setWeatherEffect('rain'));
  document.getElementById('test-snow').addEventListener('click', () => setWeatherEffect('snow'));
  document.getElementById('test-thunder').addEventListener('click', () => setWeatherEffect('thunder'));
  document.getElementById('test-stars').addEventListener('click', () => setWeatherEffect('stars'));
  document.getElementById('test-clear').addEventListener('click', () => stopWeatherEffect());

  // Focus Mode
  document.getElementById('setting-focus-toggle').addEventListener('change', async (e) => {
    const updated = await updateSettings({ focusModeActive: e.target.checked });
    const pill = document.getElementById('focus-toggle-btn');
    const pillText = document.getElementById('focus-status-text');
    if (e.target.checked) {
      pill.classList.add('active');
      pillText.textContent = 'Focus: ON';
    } else {
      pill.classList.remove('active');
      pillText.textContent = 'Focus: OFF';
    }
    if (onSettingsSaved) onSettingsSaved(updated);
  });

  document.getElementById('btn-add-blocked-site').addEventListener('click', async () => {
    const input = document.getElementById('focus-new-domain');
    const domain = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
    if (domain) {
      input.value = '';
      const settings = await getSettings();
      const list = settings.focusBlockedSites || [];
      if (!list.includes(domain)) {
        list.push(domain);
        await updateSettings({ focusBlockedSites: list });
        renderBlockedSites(list);
      }
    }
  });

  function renderBlockedSites(list) {
    const container = document.getElementById('blocked-sites-chips');
    container.innerHTML = '';
    list.forEach(site => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.innerHTML = `
        <span>${escapeHtml(site)}</span>
        <span class="chip-remove" data-site="${site}">×</span>
      `;
      chip.querySelector('.chip-remove').addEventListener('click', async () => {
        const settings = await getSettings();
        const next = (settings.focusBlockedSites || []).filter(s => s !== site);
        await updateSettings({ focusBlockedSites: next });
        renderBlockedSites(next);
      });
      container.appendChild(chip);
    });
  }

  // Tabs
  document.getElementById('setting-tab-threshold').addEventListener('change', async (e) => {
    await updateSettings({ tabOverloadThreshold: parseInt(e.target.value, 10) || 15 });
  });

  document.getElementById('setting-auto-group').addEventListener('change', async (e) => {
    await updateSettings({ autoGroupOnCleanup: e.target.checked });
  });

  document.getElementById('setting-preserve-pinned').addEventListener('change', async (e) => {
    await updateSettings({ cleanPreservePinned: e.target.checked });
  });

  document.getElementById('btn-instant-cleanup').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'CLEANUP_TABS' }, () => {
      alert('Tab cleanup completed.');
    });
  });

  // Shortcuts
  document.getElementById('btn-add-shortcut').addEventListener('click', async () => {
    const triggerInput = document.getElementById('short-trigger-input');
    const replaceInput = document.getElementById('short-replace-input');
    const trigger = triggerInput.value.trim();
    const replacement = replaceInput.value.trim();

    if (trigger && replacement) {
      triggerInput.value = '';
      replaceInput.value = '';
      const settings = await getSettings();
      const snippets = settings.textSnippets || [];
      snippets.push({ trigger, replacement });
      await updateSettings({ textSnippets: snippets });
      renderShortcuts(snippets);
    }
  });

  function renderShortcuts(list) {
    const table = document.getElementById('shortcuts-table');
    table.innerHTML = '';
    list.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = 'shortcut-row';
      row.innerHTML = `
        <span style="font-family:monospace; color:#818CF8; font-weight:600;">${escapeHtml(item.trigger)}</span>
        <span style="flex:1; margin-left:14px; color:var(--text-main);">${escapeHtml(item.replacement)}</span>
        <button class="task-action-btn btn-del" style="font-size:14px;">×</button>
      `;
      row.querySelector('.btn-del').addEventListener('click', async () => {
        const settings = await getSettings();
        const next = (settings.textSnippets || []).filter((_, i) => i !== idx);
        await updateSettings({ textSnippets: next });
        renderShortcuts(next);
      });
      table.appendChild(row);
    });
  }

  // Websites
  document.getElementById('btn-edge-right').addEventListener('click', async () => {
    document.getElementById('btn-edge-right').classList.add('active');
    document.getElementById('btn-edge-left').classList.remove('active');
    await updateSettings({ edgeHandleSide: 'right' });
  });

  document.getElementById('btn-edge-left').addEventListener('click', async () => {
    document.getElementById('btn-edge-left').classList.add('active');
    document.getElementById('btn-edge-right').classList.remove('active');
    await updateSettings({ edgeHandleSide: 'left' });
  });

  document.getElementById('setting-image-magnifier').addEventListener('change', async (e) => {
    await updateSettings({ enableImageMagnifier: e.target.checked });
  });

  document.getElementById('setting-table-export').addEventListener('change', async (e) => {
    await updateSettings({ enableTableExport: e.target.checked });
  });

  // AI Settings (Groq)
  document.getElementById('btn-verify-groq').addEventListener('click', async () => {
    const key = document.getElementById('setting-groq-key').value.trim();
    const msgEl = document.getElementById('groq-status-msg');
    const aiBadge = document.getElementById('ai-status-badge');

    if (!key) {
      await updateSettings({ groqApiKey: '', aiEnabled: false });
      msgEl.textContent = 'AI is currently OFF.';
      msgEl.style.color = 'var(--text-muted)';
      aiBadge.textContent = 'Requires Key';
      aiBadge.style.background = 'rgba(99, 102, 241, 0.2)';
      aiBadge.style.color = '#818CF8';
      return;
    }

    msgEl.textContent = 'Verifying key with Groq...';
    msgEl.style.color = '#818CF8';

    const check = await verifyGroqApiKey(key);
    if (check.success) {
      await updateSettings({ groqApiKey: key, aiEnabled: true });
      msgEl.textContent = 'Groq API Key verified! AI Superpowers unlocked.';
      msgEl.style.color = '#10B981';
      aiBadge.textContent = 'Active';
      aiBadge.style.background = 'rgba(16, 185, 129, 0.2)';
      aiBadge.style.color = '#10B981';
    } else {
      msgEl.textContent = `Invalid API Key: ${check.error}`;
      msgEl.style.color = '#EF4444';
    }
  });

  function renderWallpaperHistory(history, activeId) {
    const grid = document.getElementById('wallpaper-history-grid');
    grid.innerHTML = '';
    (history || []).forEach(item => {
      const thumb = document.createElement('div');
      thumb.className = `wallpaper-thumb ${item.id === activeId ? 'active' : ''}`;
      thumb.title = item.name || 'Custom Wallpaper';
      thumb.style.display = 'flex';
      thumb.style.alignItems = 'center';
      thumb.style.justifyContent = 'center';
      thumb.style.color = '#FFF';
      thumb.style.fontSize = '10px';
      thumb.textContent = item.type.startsWith('video/') ? '▶ Video' : '🖼 Image';

      thumb.addEventListener('click', async () => {
        await updateSettings({
          wallpaperType: 'custom',
          activeWallpaperId: item.id
        });
        if (onSettingsSaved) onSettingsSaved(await getSettings());
        populateSettings();
      });

      grid.appendChild(thumb);
    });
  }
}

