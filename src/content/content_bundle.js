// Aura Tab - In-Page Content Script Root Orchestrator

(function () {
  // Guard against double execution
  if (window.__AURA_CONTENT_LOADED__) return;
  window.__AURA_CONTENT_LOADED__ = true;

  function boot() {
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (settings) => {
      if (chrome.runtime.lastError || !settings) {
        return;
      }

      // Initialize all content modules
      if (window.AuraEdgeHandle) window.AuraEdgeHandle.init(settings);
      if (window.AuraStickyNotes) window.AuraStickyNotes.init();
      if (window.AuraTextExpander) window.AuraTextExpander.init(settings);
      if (window.AuraImagePreviewer) window.AuraImagePreviewer.init(settings);
      if (window.AuraWeatherTint) window.AuraWeatherTint.init(settings);
      if (window.AuraAI) window.AuraAI.init(settings);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Keyboard shortcut listener from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'TOGGLE_TOOLBAR') {
      const root = document.getElementById('aura-edge-handle-root');
      if (root) root.classList.toggle('aura-expanded');
    }
  });
})();

