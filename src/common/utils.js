// Aura Tab - Utility Functions

/**
 * Normalizes URL for deduplication:
 * - strips tracking query params (utm_*, fbclid, etc.)
 * - strips fragment/hash
 * - trims trailing slashes
 * - lowercases protocol and hostname
 */
export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const url = new URL(rawUrl);
    
    // Ignore internal chrome/extension pages
    if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:' || url.protocol === 'about:') {
      return rawUrl;
    }

    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'msclkid', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi',
      'ref', 'source', 'igshid'
    ];
    trackingParams.forEach(p => url.searchParams.delete(p));

    // Strip hash fragment
    url.hash = '';

    let clean = url.toString().replace(/\/+$/, '');
    return clean;
  } catch {
    return rawUrl.trim().replace(/\/+$/, '');
  }
}

/**
 * Extracts clean domain (e.g. "github.com")
 */
export function extractDomain(urlStr) {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr || '';
  }
}

/**
 * Gets greeting based on 24-hr hour
 */
export function getGreeting(name, now = new Date()) {
  const hour = now.getHours();
  let salutation = "Good morning";
  if (hour >= 4 && hour < 12) {
    salutation = "Good morning";
  } else if (hour >= 12 && hour < 17) {
    salutation = "Good afternoon";
  } else if (hour >= 17 && hour < 22) {
    salutation = "Good evening";
  } else {
    salutation = "Good night";
  }

  if (name && name.trim()) {
    return `${salutation}, ${name.trim()}`;
  }
  return salutation;
}

/**
 * Formats time with leading zeros
 */
export function formatTime(date = new Date(), military = false, showSeconds = false) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  if (!military) {
    hours = hours % 12 || 12;
  }
  const hoursStr = String(hours).padStart(2, '0');

  if (showSeconds) {
    return `${hoursStr}:${minutes}:${seconds}`;
  }
  return `${hoursStr}:${minutes}`;
}

/**
 * Formats date into readable string: "Friday, 14 November"
 */
export function formatDate(date = new Date()) {
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  return date.toLocaleDateString(undefined, options);
}

/**
 * Converts seconds to "1h 25m" or "42m"
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || totalSeconds < 60) return `${Math.floor(totalSeconds || 0)}s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Simple HTML escaper
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Debounce helper
 */
export function debounce(fn, wait = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Get favicon URL for a website
 */
export function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return '';
  }
}

