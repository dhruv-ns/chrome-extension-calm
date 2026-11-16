// Aura Tab - Screen Time Panel Controller

import { getScreentimeToday } from '../common/storage.js';
import { formatDuration, escapeHtml } from '../common/utils.js';

export async function initScreentimePanel() {
  const chartEl = document.getElementById('screentime-chart');
  const totalLabel = document.getElementById('total-screentime-label');

  async function render() {
    const data = await getScreentimeToday();
    const domains = Object.entries(data.domains || {}).sort((a, b) => b[1] - a[1]);

    const totalSeconds = domains.reduce((sum, item) => sum + item[1], 0);
    totalLabel.textContent = `${formatDuration(totalSeconds)} active`;

    chartEl.innerHTML = '';

    if (domains.length === 0 || totalSeconds === 0) {
      chartEl.innerHTML = `<div style="text-align:center; padding: 28px 12px; color: var(--text-faint); font-size: 13px;">No active browsing recorded yet today.</div>`;
      return;
    }

    const maxSeconds = domains[0][1] || 1;

    domains.slice(0, 8).forEach(([domain, seconds]) => {
      const percentage = Math.round((seconds / maxSeconds) * 100);
      const row = document.createElement('div');
      row.className = 'screentime-bar-row';

      row.innerHTML = `
        <div class="screentime-bar-meta">
          <span style="font-weight: 500; color: #FFFFFF;">${escapeHtml(domain)}</span>
          <span style="color: var(--text-muted);">${formatDuration(seconds)}</span>
        </div>
        <div class="screentime-track">
          <div class="screentime-fill" style="width: ${percentage}%;"></div>
        </div>
      `;
      chartEl.appendChild(row);
    });
  }

  window.addEventListener('aura-panel-opened', (e) => {
    if (e.detail?.panelId === 'panel-screentime') {
      render();
    }
  });

  await render();
}

