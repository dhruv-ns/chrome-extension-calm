// Aura Tab - Global Text Expansion Engine

(function () {
  let snippets = [];

  function formatCurrentDate() {
    const d = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  function formatCurrentTime() {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  function resolveTokens(replacementText) {
    return replacementText
      .replace(/\{date\}/gi, formatCurrentDate())
      .replace(/\{time\}/gi, formatCurrentTime());
  }

  function checkAndExpand(target) {
    if (!target) return;

    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable;

    if (!isInput && !isContentEditable) return;

    let text = isInput ? target.value : target.innerText;
    if (!text) return;

    for (const item of snippets) {
      const trigger = item.trigger; // e.g. "/hi"
      if (!trigger) continue;

      // Match trigger followed by a trailing space or end of word
      const triggerRegex = new RegExp(`(^|\\s)(${escapeRegex(trigger)})(\\s|$)`);
      const match = text.match(triggerRegex);

      if (match) {
        const replacement = resolveTokens(item.replacement) + (match[3] || ' ');
        const newText = text.replace(triggerRegex, `$1${replacement}`);

        if (isInput) {
          const selectionStart = target.selectionStart;
          target.value = newText;
          // Trigger framework change events (React, Vue)
          target.dispatchEvent(new Event('input', { bubbles: true }));
          target.dispatchEvent(new Event('change', { bubbles: true }));
          if (selectionStart !== null) {
            const newPos = Math.min(newText.length, selectionStart + (replacement.length - trigger.length));
            target.setSelectionRange(newPos, newPos);
          }
        } else if (isContentEditable) {
          target.innerText = newText;
          target.dispatchEvent(new Event('input', { bubbles: true }));
        }
        break;
      }
    }
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  window.AuraTextExpander = {
    init: function (settings) {
      if (!settings.enableTextExpansion) return;
      snippets = settings.textSnippets || [];

      document.addEventListener('input', (e) => {
        checkAndExpand(e.target);
      }, true);
    }
  };
})();

