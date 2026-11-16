// Aura Tab - Mac-Style Bottom Dock Controller

import { extractDomain, getFaviconUrl } from '../common/utils.js';

let activePanelId = null;

export async function initDock(onOpenSettings) {
  const topSitesContainer = document.getElementById('dock-top-sites');
  const scrim = document.getElementById('flyout-scrim');
  const panels = document.querySelectorAll('.glass-panel');

  // 1. Render Left Wing: Top 5 Visited Sites (Deduplicated by Domain)
  try {
    const sites = await chrome.topSites.get();
    const seenDomains = new Set();
    const uniqueSites = [];

    for (const site of sites) {
      const domain = extractDomain(site.url);
      if (domain && !seenDomains.has(domain)) {
        seenDomains.add(domain);
        uniqueSites.push(site);
        if (uniqueSites.length === 5) break;
      }
    }

    topSitesContainer.innerHTML = '';
    uniqueSites.forEach(site => {
      const a = document.createElement('a');
      a.className = 'dock-item';
      a.href = site.url;
      a.title = site.title || site.url;
      const fav = getFaviconUrl(site.url);

      a.innerHTML = `<img src="${fav}" alt="${site.title}" onerror="this.src='../../assets/icons/icon48.png'">`;
      topSitesContainer.appendChild(a);
    });
  } catch (err) {
    console.warn('[Aura Tab] Top sites fetch failed:', err);
  }

  // 2. Right Wing Tool Button Click Handlers
  document.querySelectorAll('.dock-right .dock-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetPanelId = btn.dataset.panel;

      if (targetPanelId === 'panel-settings') {
        closeAllPanels();
        if (onOpenSettings) onOpenSettings();
        return;
      }

      if (activePanelId === targetPanelId) {
        closeAllPanels();
      } else {
        openPanel(targetPanelId);
      }
    });
  });

  // Scrim click closes active panel
  scrim.addEventListener('click', closeAllPanels);

  // Escape key closes active panel
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activePanelId) {
      closeAllPanels();
    }
  });

  function openPanel(panelId) {
    closeAllPanels();
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('open');
      scrim.classList.add('visible');
      activePanelId = panelId;

      // Dispatch event for panel lazy data refresh
      window.dispatchEvent(new CustomEvent('aura-panel-opened', { detail: { panelId } }));
    }
  }

  function closeAllPanels() {
    panels.forEach(p => p.classList.remove('open'));
    scrim.classList.remove('visible');
    activePanelId = null;
  }
}

