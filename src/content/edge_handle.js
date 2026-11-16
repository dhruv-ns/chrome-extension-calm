// Aura Tab - Draggable Edge Handle & Quick Toolbar

(function () {
  window.AuraEdgeHandle = {
    init: async function (settings) {
      if (document.getElementById('aura-edge-handle-root')) return;

      const currentDomain = window.location.hostname.replace(/^www\./, '');
      const hiddenSites = settings.edgeHandleHiddenSites || [];
      if (hiddenSites.includes(currentDomain)) return;

      const side = settings.edgeHandleSide || 'right';
      const offsetY = settings.edgeHandleOffsetY || 200;

      const root = document.createElement('div');
      root.id = 'aura-edge-handle-root';
      if (side === 'left') root.classList.add('aura-side-left');
      root.style.top = `${offsetY}px`;

      root.innerHTML = `
        <div class="aura-handle-capsule" title="Drag to reposition / Click to open Aura Toolbar"></div>
        <div class="aura-toolbar-panel">
          <button class="aura-tool-btn" id="aura-btn-save-later" data-tooltip="Save for later">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </button>
          <div style="position: relative;">
            <button class="aura-tool-btn" id="aura-btn-snooze" data-tooltip="Snooze tab">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
            <div class="aura-snooze-flyout" id="aura-snooze-menu">
              <button class="aura-snooze-opt" data-preset="in1Hour">In 1 Hour</button>
              <button class="aura-snooze-opt" data-preset="thisEvening">This Evening</button>
              <button class="aura-snooze-opt" data-preset="tomorrowMorning">Tomorrow Morning</button>
              <button class="aura-snooze-opt" data-preset="thisWeekend">This Weekend</button>
              <button class="aura-snooze-opt" data-preset="nextWeek">Next Week</button>
            </div>
          </div>
          <button class="aura-tool-btn" id="aura-btn-cleanup" data-tooltip="Clean up duplicate tabs">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
          <button class="aura-tool-btn" id="aura-btn-ocr" data-tooltip="Copy text from screen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <button class="aura-tool-btn" id="aura-btn-export-table" data-tooltip="Download table as Excel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
          </button>
          <button class="aura-tool-btn" id="aura-btn-sticky" data-tooltip="Add sticky note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </button>
          <button class="aura-tool-btn" id="aura-btn-hide-site" data-tooltip="Hide on this site">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </button>
        </div>
      `;

      document.body.appendChild(root);

      const capsule = root.querySelector('.aura-handle-capsule');
      const snoozeBtn = root.querySelector('#aura-btn-snooze');
      const snoozeMenu = root.querySelector('#aura-snooze-menu');

      // Dragging logic
      let isDragging = false;
      let startY = 0;
      let startTop = 0;

      capsule.addEventListener('mousedown', (e) => {
        isDragging = true;
        startY = e.clientY;
        startTop = root.offsetTop;
        document.body.style.userSelect = 'none';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const newTop = Math.max(20, Math.min(window.innerHeight - 80, startTop + (e.clientY - startY)));
        root.style.top = `${newTop}px`;

        // Check if dragged past screen midpoint to flip side
        if (e.clientX < window.innerWidth / 2) {
          root.classList.add('aura-side-left');
        } else {
          root.classList.remove('aura-side-left');
        }
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.userSelect = '';
          const side = root.classList.contains('aura-side-left') ? 'left' : 'right';
          const offsetY = root.offsetTop;
          chrome.runtime.sendMessage({
            type: 'UPDATE_SETTINGS',
            settings: { edgeHandleSide: side, edgeHandleOffsetY: offsetY }
          });
        }
      });

      // Toolbar Actions
      root.querySelector('#aura-btn-save-later').addEventListener('click', () => {
        chrome.runtime.sendMessage({
          type: 'SAVE_READ_LATER',
          item: { url: window.location.href, title: document.title }
        }, () => {
          window.AuraEdgeHandle.showToast('Saved to Read Later list!');
        });
      });

      snoozeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        snoozeMenu.classList.toggle('aura-visible');
      });

      snoozeMenu.querySelectorAll('.aura-snooze-opt').forEach(opt => {
        opt.addEventListener('click', (e) => {
          const preset = e.target.dataset.preset;
          snoozeMenu.classList.remove('aura-visible');
          chrome.runtime.sendMessage({ type: 'SNOOZE_TAB', preset }, (res) => {
            if (res && res.success) {
              window.AuraEdgeHandle.showToast('Tab snoozed.');
            }
          });
        });
      });

      document.addEventListener('click', (e) => {
        if (!snoozeMenu.contains(e.target) && e.target !== snoozeBtn) {
          snoozeMenu.classList.remove('aura-visible');
        }
      });

      root.querySelector('#aura-btn-cleanup').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'CLEANUP_TABS' }, (res) => {
          if (res && res.closedCount !== undefined) {
            window.AuraEdgeHandle.showToast(`Cleaned up ${res.closedCount} duplicate tabs.`);
          } else {
            window.AuraEdgeHandle.showToast('Tab cleanup completed.');
          }
        });
      });

      root.querySelector('#aura-btn-ocr').addEventListener('click', () => {
        if (window.AuraAI && window.AuraAI.startOcrSelection) {
          window.AuraAI.startOcrSelection();
        } else {
          window.AuraEdgeHandle.showToast('Screen OCR module loading...');
        }
      });

      root.querySelector('#aura-btn-export-table').addEventListener('click', () => {
        if (window.AuraTableExporter && window.AuraTableExporter.scanAndExport) {
          window.AuraTableExporter.scanAndExport();
        }
      });

      root.querySelector('#aura-btn-sticky').addEventListener('click', () => {
        if (window.AuraStickyNotes && window.AuraStickyNotes.createNote) {
          window.AuraStickyNotes.createNote();
        }
      });

      root.querySelector('#aura-btn-hide-site').addEventListener('click', () => {
        const domain = window.location.hostname.replace(/^www\./, '');
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (currentSettings) => {
          const hidden = currentSettings.edgeHandleHiddenSites || [];
          if (!hidden.includes(domain)) {
            hidden.push(domain);
            chrome.runtime.sendMessage({
              type: 'UPDATE_SETTINGS',
              settings: { edgeHandleHiddenSites: hidden }
            }, () => {
              root.remove();
              window.AuraEdgeHandle.showToast(`Aura handle hidden on ${domain}.`);
            });
          }
        });
      });
    },

    showToast: function (message, duration = 3000) {
      const existing = document.querySelector('.aura-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'aura-toast';
      toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${message}</span>
      `;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(16px)';
        toast.style.transition = 'all 0.25s ease';
        setTimeout(() => toast.remove(), 250);
      }, duration);
    }
  };
})();

