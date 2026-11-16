// Aura Tab - Read Later Panel Controller

import { getReadLater, saveReadLater } from '../common/storage.js';
import { getFaviconUrl, escapeHtml } from '../common/utils.js';

export async function initReadLaterPanel() {
  const listEl = document.getElementById('readlater-list');
  const countEl = document.getElementById('readlater-count');

  async function render() {
    const items = await getReadLater();
    const unread = items.filter(i => !i.read);

    countEl.textContent = `${unread.length} unread`;
    listEl.innerHTML = '';

    if (items.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 28px 12px; color: var(--text-faint); font-size: 13px;">Your reading list is empty.<br>Hover the edge handle on any article to save it.</div>`;
      return;
    }

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'history-item';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      const fav = getFaviconUrl(item.url);

      row.innerHTML = `
        <a href="${item.url}" target="_blank" class="history-item-left" style="text-decoration:none; color:inherit; flex:1;">
          <img src="${fav}" style="width:16px; height:16px; border-radius:3px;" onerror="this.style.display='none'">
          <span class="history-item-title ${item.read ? 'completed' : ''}" style="${item.read ? 'opacity: 0.5; text-decoration: line-through;' : ''}">${escapeHtml(item.title || item.url)}</span>
        </a>
        <div style="display:flex; gap:6px;">
          <button class="task-action-btn btn-archive" title="${item.read ? 'Mark unread' : 'Mark read'}">${item.read ? '↩' : '✓'}</button>
          <button class="task-action-btn btn-del" title="Delete">×</button>
        </div>
      `;

      row.querySelector('.btn-archive').addEventListener('click', async () => {
        const all = await getReadLater();
        const target = all.find(i => i.id === item.id);
        if (target) {
          target.read = !target.read;
          await saveReadLater(all);
          render();
        }
      });

      row.querySelector('.btn-del').addEventListener('click', async () => {
        const all = await getReadLater();
        const next = all.filter(i => i.id !== item.id);
        await saveReadLater(next);
        render();
      });

      listEl.appendChild(row);
    });
  }

  window.addEventListener('aura-panel-opened', (e) => {
    if (e.detail?.panelId === 'panel-readlater') {
      render();
    }
  });

  await render();
}

