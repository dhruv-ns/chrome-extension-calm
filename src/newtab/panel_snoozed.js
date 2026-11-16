// Aura Tab - Snoozed Tabs Panel Controller

import { getSnoozedTabs, saveSnoozedTabs } from '../common/storage.js';
import { getFaviconUrl, escapeHtml } from '../common/utils.js';

export async function initSnoozedPanel() {
  const listEl = document.getElementById('snoozed-list');
  const countBadge = document.getElementById('snoozed-count-badge');

  async function render() {
    const list = await getSnoozedTabs();
    countBadge.textContent = String(list.length);
    listEl.innerHTML = '';

    if (list.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 28px 12px; color: var(--text-faint); font-size: 13px;">No tabs currently snoozed.</div>`;
      return;
    }

    list.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      const fav = getFaviconUrl(item.url);

      const timeLeftMinutes = Math.max(0, Math.round((item.wakeTime - Date.now()) / (60 * 1000)));
      const wakeLabel = timeLeftMinutes > 60
        ? `Wakes in ${Math.round(timeLeftMinutes / 60)}h`
        : `Wakes in ${timeLeftMinutes}m`;

      row.innerHTML = `
        <div class="history-item-left" style="flex:1;">
          <img src="${fav}" style="width:16px; height:16px; border-radius:3px;" onerror="this.style.display='none'">
          <div>
            <div class="history-item-title">${escapeHtml(item.title || item.url)}</div>
            <div style="font-size:10px; color:var(--text-faint);">${wakeLabel}</div>
          </div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-primary-sm btn-wake" style="padding:4px 8px; font-size:11px;">Wake</button>
          <button class="task-action-btn btn-del" title="Cancel">×</button>
        </div>
      `;

      // Wake now
      row.querySelector('.btn-wake').addEventListener('click', async () => {
        await chrome.tabs.create({ url: item.url, active: false });
        await removeSnooze(item);
      });

      // Cancel
      row.querySelector('.btn-del').addEventListener('click', async () => {
        await removeSnooze(item);
      });

      listEl.appendChild(row);
    });
  }

  async function removeSnooze(item) {
    if (item.alarmName) {
      await chrome.alarms.clear(item.alarmName);
    }
    const all = await getSnoozedTabs();
    const next = all.filter(s => s.id !== item.id);
    await saveSnoozedTabs(next);
    render();
  }

  window.addEventListener('aura-panel-opened', (e) => {
    if (e.detail?.panelId === 'panel-snoozed') {
      render();
    }
  });

  await render();
}

