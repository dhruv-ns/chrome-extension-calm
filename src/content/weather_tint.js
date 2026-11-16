// Aura Tab - Soft Ambient Weather Tint for Webpages

(function () {
  window.AuraWeatherTint = {
    init: function (settings) {
      if (!settings.enableWeatherWebTint) return;

      chrome.storage.local.get('weather_cache', (res) => {
        const cache = res.weather_cache;
        if (!cache) return;

        // Check if condition is rain or stormy
        const condition = (cache.condition || '').toLowerCase();
        const code = cache.conditionCode;
        const isRainy = condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunder') ||
                        (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99);

        if (isRainy && !document.getElementById('aura-weather-tint-overlay')) {
          const overlay = document.createElement('div');
          overlay.id = 'aura-weather-tint-overlay';
          document.body.appendChild(overlay);
        }
      });
    }
  };
})();

