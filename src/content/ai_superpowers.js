// Aura Tab - In-Page AI Superpowers (Groq Dictionary & Screen OCR)

(function () {
  let isAiEnabled = false;

  window.AuraAI = {
    init: function (settings) {
      isAiEnabled = !!(settings.aiEnabled && settings.groqApiKey);

      // 1. Double-click word definition
      document.addEventListener('dblclick', (e) => {
        if (!isAiEnabled) return;

        const selection = window.getSelection().toString().trim();
        // Valid single word check
        if (/^[a-zA-Z]{3,24}$/.test(selection)) {
          window.AuraAI.lookupWord(selection, e.clientX, e.clientY);
        }
      });
    },

    lookupWord: function (word, clientX, clientY) {
      // Remove any existing definition popovers
      document.querySelectorAll('.aura-dict-popover').forEach(el => el.remove());

      const popover = document.createElement('div');
      popover.className = 'aura-dict-popover';
      popover.innerHTML = `
        <div class="aura-dict-word">${word}</div>
        <div class="aura-dict-def">Looking up definition...</div>
      `;

      // Position near click
      let left = Math.min(window.innerWidth - 320, Math.max(10, clientX + 10));
      let top = Math.min(window.innerHeight - 150, Math.max(10, clientY - 80));
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;

      document.body.appendChild(popover);

      // Request definition from background
      chrome.runtime.sendMessage({ type: 'DEFINE_WORD', word }, (response) => {
        if (response && response.success && response.data) {
          const { definition, example } = response.data;
          popover.innerHTML = `
            <div class="aura-dict-word">${word}</div>
            <div class="aura-dict-def">${definition}</div>
            ${example ? `<div class="aura-dict-example">“${example}”</div>` : ''}
          `;
        } else {
          popover.innerHTML = `
            <div class="aura-dict-word">${word}</div>
            <div class="aura-dict-def">Could not retrieve definition.</div>
          `;
          setTimeout(() => popover.remove(), 2000);
        }
      });

      // Dismiss on click outside
      const dismissHandler = (e) => {
        if (!popover.contains(e.target)) {
          popover.remove();
          document.removeEventListener('mousedown', dismissHandler);
        }
      };
      setTimeout(() => document.addEventListener('mousedown', dismissHandler), 100);
    },

    startOcrSelection: function () {
      if (!isAiEnabled) {
        window.AuraEdgeHandle?.showToast('Enable AI Mode in Aura Settings to unlock screen text extraction.');
        return;
      }

      if (document.getElementById('aura-ocr-canvas-overlay')) return;

      const overlay = document.createElement('div');
      overlay.id = 'aura-ocr-canvas-overlay';
      document.body.appendChild(overlay);

      let isDrawing = false;
      let startX = 0;
      let startY = 0;
      let box = null;

      const onMouseDown = (e) => {
        isDrawing = true;
        startX = e.clientX;
        startY = e.clientY;

        box = document.createElement('div');
        box.className = 'aura-ocr-selection';
        box.style.left = `${startX}px`;
        box.style.top = `${startY}px`;
        overlay.appendChild(box);
      };

      const onMouseMove = (e) => {
        if (!isDrawing || !box) return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
      };

      const cleanup = () => {
        overlay.remove();
        document.removeEventListener('keydown', onKeyDown);
      };

      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          cleanup();
        }
      };

      const onMouseUp = async (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        const rect = box ? box.getBoundingClientRect() : null;
        cleanup();

        if (!rect || rect.width < 10 || rect.height < 10) {
          return;
        }

        window.AuraEdgeHandle?.showToast('Extracting text with AI Vision...');

        chrome.runtime.sendMessage({
          type: 'CAPTURE_AND_OCR',
          crop: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            dpr: window.devicePixelRatio || 1
          }
        }, async (res) => {
          if (res && res.success && res.text) {
            try {
              await navigator.clipboard.writeText(res.text);
              window.AuraEdgeHandle?.showToast('Copied extracted text to clipboard!');
            } catch {
              window.AuraEdgeHandle?.showToast(`Extracted: "${res.text.slice(0, 30)}..."`);
            }
          } else if (res && res.error === 'AI_DISABLED') {
            window.AuraEdgeHandle?.showToast('Enable AI Mode in Aura Settings to unlock screen text extraction.');
          } else {
            window.AuraEdgeHandle?.showToast('No text detected in selected area.');
          }
        });
      };

      overlay.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp, { once: true });
      document.addEventListener('keydown', onKeyDown);
    }
  };
})();

