// Aura Tab - Recently Opened & Just Closed History Panel

import { extractDomain, getFaviconUrl, escapeHtml } from '../common/utils.js';

let viewMode = 'pages'; // 'pages' | 'sites'

export async function initHistoryPanel() {
  const searchInput = document.getElementById('history-search-input');
  const justClosedEl = document.getElementById('history-just-closed');
  const timelineEl = document.getElementById('history-timeline');
  const btnPages = document.getElementById('btn-hist-pages');
  const btnSites = document.getElementById('btn-hist-sites');

  async function loadJustClosed() {
    justClosedEl.innerHTML = '';
    try {
      const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 1 });
      if (sessions && sessions.length > 0) {
        const s = sessions[0];
        const title = s.tab?.title || s.window?.tabs?.[0]?.title || 'Recently Closed Session';
        const row = document.createElement('div');
        row.className = 'just-closed-row';
        row.innerHTML = `
          <div style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width: 260px;">
            <strong>Just closed:</strong> ${escapeHtml(title)}
          </div>
          <button id="btn-restore-last" class="btn btn-primary-sm" style="padding: 3px 8px; font-size: 11px;">Restore</button>
        `;
        row.querySelector('#btn-restore-last').addEventListener('click', async () => {
          await chrome.sessions.restore(s.tab?.sessionId || s.window?.sessionId);
          loadJustClosed();
          loadHistory(searchInput.value);
        });
        justClosedEl.appendChild(row);
      }
    } catch (err) {
      console.warn('[Aura Tab] Error loading recently closed sessions:', err);
    }
  }

  async function loadHistory(query = '') {
    timelineEl.innerHTML = '';
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    try {
      const items = await chrome.history.search({
        text: query,
        startTime: oneWeekAgo,
        maxResults: 60
      });

      if (!items || items.length === 0) {
        timelineEl.innerHTML = `<div style="text-align:center; padding: 24px; color: var(--text-faint); font-size: 12px;">No recent history found.</div>`;
        return;
      }

      if (viewMode === 'sites') {
        // Group by Domain
        const domainMap = new Map();
        for (const item of items) {
          const dom = extractDomain(item.url);
          if (!dom) continue;
          if (!domainMap.has(dom)) {
            domainMap.set(dom, { count: 0, latestUrl: item.url, title: dom });
          }
          domainMap.get(dom).count++;
        }

        for (const [dom, data] of domainMap.entries()) {
          const row = document.createElement('a');
          row.className = 'history-item';
          row.href = data.latestUrl;
          const fav = getFaviconUrl(data.latestUrl);

          row.innerHTML = `
            <div class="history-item-left">
              <img src="${fav}" style="width:16px; height:16px; border-radius:3px;" onerror="this.style.display='none'">
              <span class="history-item-title">${escapeHtml(dom)}</span>
            </div>
            <span class="badge-count">${data.count} visits</span>
          `;
          timelineEl.appendChild(row);
        }
      } else {
        // Timeline View: Pages Grouped by Today, Yesterday, Earlier this week
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;

        const groups = {
          today: [],
          yesterday: [],
          earlier: []
        };

        for (const item of items) {
          const time = item.lastVisitTime || 0;
          if (time >= startOfToday) {
            groups.today.push(item);
          } else if (time >= startOfYesterday) {
            groups.yesterday.push(item);
          } else {
            groups.earlier.push(item);
          }
        }

        renderGroup('Today', groups.today);
        renderGroup('Yesterday', groups.yesterday);
        renderGroup('Earlier this week', groups.earlier);
      }
    } catch (err) {
      console.warn('[Aura Tab] Error fetching history:', err);
    }
  }

  function renderGroup(title, items) {
    if (!items || items.length === 0) return;

    const header = document.createElement('div');
    header.style.fontSize = '11px';
    header.style.textTransform = 'uppercase';
    header.style.letterSpacing = '0.05em';
    header.style.color = '#818CF8';
    header.style.fontWeight = '600';
    header.style.marginTop = '8px';
    header.style.marginBottom = '4px';
    header.textContent = title;
    timelineEl.appendChild(header);

    items.forEach(item => {
      const row = document.createElement('a');
      row.className = 'history-item';
      row.href = item.url;
      const fav = getFaviconUrl(item.url);

      row.innerHTML = `
        <div class="history-item-left">
          <img src="${fav}" style="width:16px; height:16px; border-radius:3px;" onerror="this.style.display='none'">
          <span class="history-item-title">${escapeHtml(item.title || item.url)}</span>
        </div>
        <span style="font-size: 10px; color: var(--text-faint);">${formatTimeShort(item.lastVisitTime)}</span>
      `;
      timelineEl.appendChild(row);
    });
  }

  function formatTimeShort(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // Search input filter
  searchInput.addEventListener('input', (e) => {
    loadHistory(e.target.value);
  });

  // Pages vs Sites segmented control
  btnPages.addEventListener('click', () => {
    btnPages.classList.add('active');
    btnSites.classList.remove('active');
    viewMode = 'pages';
    loadHistory(searchInput.value);
  });

  btnSites.addEventListener('click', () => {
    btnSites.classList.add('active');
    btnPages.classList.remove('active');
    viewMode = 'sites';
    loadHistory(searchInput.value);
  });

  window.addEventListener('aura-panel-opened', (e) => {
    if (e.detail?.panelId === 'panel-history') {
      loadJustClosed();
      loadHistory(searchInput.value);
    }
  });
}

