// Aura Tab - Workspaces Panel Controller (Window Tab Session Manager)

import { getWorkspaces, saveWorkspaces } from '../common/storage.js';
import { escapeHtml } from '../common/utils.js';

export async function initWorkspacesPanel() {
  const nameInput = document.getElementById('workspace-name-input');
  const saveBtn = document.getElementById('btn-save-workspace');
  const listEl = document.getElementById('workspace-list');

  async function render() {
    const workspaces = await getWorkspaces();
    listEl.innerHTML = '';

    if (workspaces.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 28px 12px; color: var(--text-faint); font-size: 13px;">No saved workspaces.<br>Save this window's tabs to return to them later.</div>`;
      return;
    }

    workspaces.forEach(ws => {
      const row = document.createElement('div');
      row.className = 'workspace-row';

      row.innerHTML = `
        <div style="flex:1;">
          <strong style="font-size:13px; color:#FFFFFF;">${escapeHtml(ws.name)}</strong>
          <div style="font-size:11px; color:var(--text-faint); margin-top:2px;">${ws.tabs.length} tabs • ${new Date(ws.createdAt).toLocaleDateString()}</div>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-primary-sm btn-restore-new" style="padding:4px 8px; font-size:11px;">Open</button>
          <button class="task-action-btn btn-del" style="font-size:14px; padding:4px;">×</button>
        </div>
      `;

      // Open in new window
      row.querySelector('.btn-restore-new').addEventListener('click', async () => {
        const urls = ws.tabs.map(t => t.url).filter(u => u && !u.startsWith('chrome://'));
        if (urls.length > 0) {
          await chrome.windows.create({ url: urls });
        }
      });

      // Delete workspace
      row.querySelector('.btn-del').addEventListener('click', async () => {
        const all = await getWorkspaces();
        const next = all.filter(w => w.id !== ws.id);
        await saveWorkspaces(next);
        render();
      });

      listEl.appendChild(row);
    });
  }

  // Save current window tabs
  saveBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim() || `Workspace ${new Date().toLocaleDateString()}`;
    nameInput.value = '';

    const currentTabs = await chrome.tabs.query({ currentWindow: true });
    const tabData = currentTabs
      .filter(t => t.url && !t.url.startsWith('chrome-extension://'))
      .map(t => ({ title: t.title, url: t.url, pinned: t.pinned }));

    if (tabData.length === 0) return;

    const all = await getWorkspaces();
    all.unshift({
      id: 'ws_' + Date.now(),
      name,
      createdAt: Date.now(),
      tabs: tabData
    });

    await saveWorkspaces(all);
    render();
  });

  window.addEventListener('aura-panel-opened', (e) => {
    if (e.detail?.panelId === 'panel-workspaces') {
      render();
    }
  });

  await render();
}

