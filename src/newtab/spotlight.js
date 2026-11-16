// Aura Tab - Mac Spotlight-Style Search Controller

import { escapeHtml, getFaviconUrl } from '../common/utils.js';

export function initSpotlight() {
  const centerStage = document.getElementById('center-stage');
  const wrapper = document.getElementById('spotlight-wrapper');
  const input = document.getElementById('spotlight-input');
  const resultsContainer = document.getElementById('spotlight-results');

  let selectedIndex = 0;
  let currentResults = [];

  function activateSpotlight() {
    wrapper.classList.add('active');
    centerStage.classList.add('dimmed');
  }

  function deactivateSpotlight() {
    wrapper.classList.remove('active');
    centerStage.classList.remove('dimmed');
    resultsContainer.classList.remove('visible');
    resultsContainer.innerHTML = '';
    selectedIndex = 0;
    currentResults = [];
  }

  async function handleSearch(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      resultsContainer.classList.remove('visible');
      resultsContainer.innerHTML = '';
      currentResults = [];
      return;
    }

    activateSpotlight();

    // Check for provider prefixes: "y cat videos", "gh react", "w quantum", "r webdev"
    let providerMatch = null;
    let actualQuery = trimmed;

    const prefixMap = [
      { prefix: /^y\s+(.*)/i, name: 'YouTube', url: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
      { prefix: /^yt\s+(.*)/i, name: 'YouTube', url: (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` },
      { prefix: /^gh\s+(.*)/i, name: 'GitHub', url: (q) => `https://github.com/search?q=${encodeURIComponent(q)}` },
      { prefix: /^w\s+(.*)/i, name: 'Wikipedia', url: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}` },
      { prefix: /^wiki\s+(.*)/i, name: 'Wikipedia', url: (q) => `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}` },
      { prefix: /^r\s+(.*)/i, name: 'Reddit', url: (q) => `https://www.reddit.com/search/?q=${encodeURIComponent(q)}` },
      { prefix: /^g\s+(.*)/i, name: 'Google', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` }
    ];

    for (const p of prefixMap) {
      const match = trimmed.match(p.prefix);
      if (match) {
        providerMatch = p;
        actualQuery = match[1].trim();
        break;
      }
    }

    // 1. Query Chrome Bookmarks
    let bookmarkItems = [];
    if (!providerMatch) {
      try {
        const hits = await chrome.bookmarks.search(actualQuery);
        bookmarkItems = hits.filter(b => b.url).slice(0, 5).map(b => ({
          type: 'bookmark',
          title: b.title || b.url,
          url: b.url
        }));
      } catch {
        bookmarkItems = [];
      }
    }

    // 2. Prepare Web Search / Direct URL item
    let fallbackItem;
    if (providerMatch) {
      fallbackItem = {
        type: 'search',
        title: `Search ${providerMatch.name} for "${actualQuery}"`,
        url: providerMatch.url(actualQuery)
      };
    } else {
      const isUrl = /^https?:\/\//i.test(trimmed) || trimmed.includes('.') && !trimmed.includes(' ');
      fallbackItem = {
        type: isUrl ? 'url' : 'search',
        title: isUrl ? `Go to ${trimmed}` : `Search Google for "${trimmed}"`,
        url: isUrl ? (trimmed.startsWith('http') ? trimmed : `https://${trimmed}`) : `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`
      };
    }

    currentResults = [fallbackItem, ...bookmarkItems];
    selectedIndex = 0;
    renderResults(actualQuery);
  }

  function renderResults(query) {
    if (currentResults.length === 0) {
      resultsContainer.classList.remove('visible');
      return;
    }

    resultsContainer.innerHTML = '';
    currentResults.forEach((item, idx) => {
      const row = document.createElement('div');
      row.className = `spotlight-item ${idx === selectedIndex ? 'selected' : ''}`;
      row.dataset.index = idx;

      let iconHtml = '';
      if (item.type === 'bookmark' || item.type === 'url') {
        const fav = getFaviconUrl(item.url);
        iconHtml = `<img class="spotlight-item-favicon" src="${fav}" onerror="this.style.display='none'">`;
      } else {
        iconHtml = `<svg class="spotlight-item-favicon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
      }

      // Highlight match in title
      let titleHtml = escapeHtml(item.title);
      if (query) {
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        titleHtml = titleHtml.replace(regex, '<strong style="color: #6366F1;">$1</strong>');
      }

      row.innerHTML = `
        ${iconHtml}
        <div class="spotlight-item-info">
          <div class="spotlight-item-title">${titleHtml}</div>
          <div class="spotlight-item-url">${escapeHtml(item.url)}</div>
        </div>
      `;

      row.addEventListener('click', () => {
        navigateTo(item.url);
      });

      resultsContainer.appendChild(row);
    });

    resultsContainer.classList.add('visible');
  }

  function navigateTo(url) {
    if (url) {
      window.location.href = url;
    }
  }

  // Keyboard Navigation
  input.addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentResults.length > 0) {
        selectedIndex = (selectedIndex + 1) % currentResults.length;
        updateSelectedHighlight();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentResults.length > 0) {
        selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
        updateSelectedHighlight();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentResults[selectedIndex]) {
        navigateTo(currentResults[selectedIndex].url);
      } else if (input.value.trim()) {
        navigateTo(`https://www.google.com/search?q=${encodeURIComponent(input.value.trim())}`);
      }
    } else if (e.key === 'Escape') {
      input.value = '';
      deactivateSpotlight();
    }
  });

  function updateSelectedHighlight() {
    const items = resultsContainer.querySelectorAll('.spotlight-item');
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === selectedIndex);
      if (idx === selectedIndex) {
        item.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  // Focus Spotlight via Cmd+K or Ctrl+K
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      activateSpotlight();
    }
  });

  // Clicking outside deactivates spotlight
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target) && wrapper.classList.contains('active')) {
      if (!input.value.trim()) {
        deactivateSpotlight();
      }
    }
  });
}

