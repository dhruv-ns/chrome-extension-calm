// Aura Tab - Persistent Per-URL Sticky Notes

(function () {
  const STORAGE_KEY = 'stickyNotes';

  function getCleanUrl() {
    return window.location.href.split('#')[0];
  }

  window.AuraStickyNotes = {
    init: function () {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const allNotes = result[STORAGE_KEY] || {};
        const urlNotes = allNotes[getCleanUrl()] || [];
        urlNotes.forEach(note => window.AuraStickyNotes.renderNote(note));
      });
    },

    saveAllNotes: function () {
      const cleanUrl = getCleanUrl();
      const domNotes = document.querySelectorAll('.aura-sticky-note');
      const notesData = [];

      domNotes.forEach(el => {
        notesData.push({
          id: el.dataset.noteId,
          x: parseInt(el.style.left, 10) || 100,
          y: parseInt(el.style.top, 10) || 100,
          color: el.dataset.color || 'amber',
          text: el.querySelector('.aura-sticky-textarea')?.value || '',
          minimized: el.classList.contains('aura-minimized')
        });
      });

      chrome.storage.local.get(STORAGE_KEY, (result) => {
        const allNotes = result[STORAGE_KEY] || {};
        if (notesData.length > 0) {
          allNotes[cleanUrl] = notesData;
        } else {
          delete allNotes[cleanUrl];
        }
        chrome.storage.local.set({ [STORAGE_KEY]: allNotes });
      });
    },

    createNote: function () {
      const noteData = {
        id: 'note_' + Date.now(),
        x: Math.max(50, Math.round(window.innerWidth / 2 - 115)),
        y: Math.max(50, Math.round(window.innerHeight / 2 - 90)),
        color: 'amber',
        text: '',
        minimized: false
      };
      window.AuraStickyNotes.renderNote(noteData);
      window.AuraStickyNotes.saveAllNotes();
      window.AuraEdgeHandle?.showToast('Sticky note added.');
    },

    renderNote: function (noteData) {
      if (document.querySelector(`[data-note-id="${noteData.id}"]`)) return;

      const el = document.createElement('div');
      el.className = `aura-sticky-note aura-note-${noteData.color || 'amber'}`;
      if (noteData.minimized) el.classList.add('aura-minimized');
      el.dataset.noteId = noteData.id;
      el.dataset.color = noteData.color || 'amber';
      el.style.left = `${noteData.x}px`;
      el.style.top = `${noteData.y}px`;

      el.innerHTML = `
        <div class="aura-sticky-header">
          <div class="aura-sticky-dots">
            <span class="aura-sticky-dot amber" data-color="amber"></span>
            <span class="aura-sticky-dot emerald" data-color="emerald"></span>
            <span class="aura-sticky-dot azure" data-color="azure"></span>
            <span class="aura-sticky-dot obsidian" data-color="obsidian"></span>
          </div>
          <div class="aura-sticky-actions">
            <button class="aura-sticky-action-btn btn-min" title="Minimize">–</button>
            <button class="aura-sticky-action-btn btn-close" title="Delete note">×</button>
          </div>
        </div>
        <div class="aura-sticky-body" style="${noteData.minimized ? 'display:none;' : ''}">
          <textarea class="aura-sticky-textarea" placeholder="Type a note on this page...">${noteData.text || ''}</textarea>
        </div>
      `;

      document.body.appendChild(el);

      const header = el.querySelector('.aura-sticky-header');
      const body = el.querySelector('.aura-sticky-body');
      const textarea = el.querySelector('.aura-sticky-textarea');

      // Dragging
      let isDragging = false;
      let startX, startY, origX, origY;

      header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.aura-sticky-dots') || e.target.closest('.aura-sticky-actions')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origX = el.offsetLeft;
        origY = el.offsetTop;
        document.body.style.userSelect = 'none';
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        const newX = Math.max(0, Math.min(window.innerWidth - 240, origX + (e.clientX - startX)));
        const newY = Math.max(0, Math.min(window.innerHeight - 50, origY + (e.clientY - startY)));
        el.style.left = `${newX}px`;
        el.style.top = `${newY}px`;
      });

      window.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          document.body.style.userSelect = '';
          window.AuraStickyNotes.saveAllNotes();
        }
      });

      // Color switcher
      el.querySelectorAll('.aura-sticky-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
          const color = e.target.dataset.color;
          el.className = `aura-sticky-note aura-note-${color}` + (el.classList.contains('aura-minimized') ? ' aura-minimized' : '');
          el.dataset.color = color;
          window.AuraStickyNotes.saveAllNotes();
        });
      });

      // Minimize
      el.querySelector('.btn-min').addEventListener('click', () => {
        const isMin = el.classList.toggle('aura-minimized');
        body.style.display = isMin ? 'none' : 'block';
        window.AuraStickyNotes.saveAllNotes();
      });

      // Delete
      el.querySelector('.btn-close').addEventListener('click', () => {
        el.remove();
        window.AuraStickyNotes.saveAllNotes();
      });

      // Debounced text input
      let saveTimer;
      textarea.addEventListener('input', () => {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          window.AuraStickyNotes.saveAllNotes();
        }, 500);
      });
    }
  };
})();

