// Aura Tab - Weather Engine & Particle Canvas Controller

import { getWeatherCache, saveWeatherCache, getSettings } from '../common/storage.js';

let canvas, ctx;
let animationFrameId = null;
let particles = [];
let activeWeatherEffect = 'none'; // 'rain' | 'snow' | 'thunder' | 'stars' | 'fog' | 'none'
let thunderFlashAlpha = 0;

export async function initWeather(settings) {
  canvas = document.getElementById('weather-canvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  await loadAndRenderWeather(settings);

  // Tab visibility: pause loop when hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopParticleLoop();
    } else {
      startParticleLoop();
    }
  });
}

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export async function loadAndRenderWeather(settings) {
  const tempEl = document.getElementById('weather-temp');
  const iconEl = document.getElementById('weather-icon');
  const cityEl = document.getElementById('weather-city-label');

  cityEl.textContent = settings.weatherCity || 'San Francisco';

  let cache = await getWeatherCache();
  const now = Date.now();
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  if (!cache || !cache.timestamp || now - cache.timestamp > CACHE_TTL || cache.city !== settings.weatherCity) {
    cache = await fetchWeatherFromApi(settings.weatherCity, settings.weatherUnits);
    if (cache) {
      await saveWeatherCache(cache);
    }
  }

  if (cache) {
    const isFahr = settings.weatherUnits === 'fahrenheit';
    const tempDisplay = isFahr
      ? `${Math.round(cache.temp * 9 / 5 + 32)}°F`
      : `${Math.round(cache.temp)}°C`;

    tempEl.textContent = tempDisplay;
    iconEl.textContent = getWeatherGlyph(cache.conditionCode, cache.isDay);

    if (settings.enableWeatherParticles) {
      determineAndStartWeatherEffect(cache.conditionCode, cache.isDay);
    } else {
      stopWeatherEffect();
    }
  }
}

async function fetchWeatherFromApi(city, units) {
  try {
    // 1. Geocoding
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) return null;

    const { latitude, longitude, name } = geoData.results[0];

    // 2. Weather
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();
    if (!weatherData.current_weather) return null;

    const cw = weatherData.current_weather;
    return {
      timestamp: Date.now(),
      city: name,
      temp: cw.temperature,
      conditionCode: cw.weathercode,
      condition: getConditionName(cw.weathercode),
      isDay: cw.is_day
    };
  } catch (err) {
    console.warn('[Aura Tab] Weather fetch failed:', err);
    return null;
  }
}

function getConditionName(code) {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Cloudy';
}

function getWeatherGlyph(code, isDay) {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code >= 1 && code <= 3) return isDay ? '🌤️' : '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '☁️';
}

function determineAndStartWeatherEffect(code, isDay) {
  if (code >= 95 && code <= 99) {
    setWeatherEffect('thunder');
  } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    setWeatherEffect('rain');
  } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    setWeatherEffect('snow');
  } else if (!isDay && (code === 0 || code === 1)) {
    setWeatherEffect('stars');
  } else {
    stopWeatherEffect();
  }
}

export function setWeatherEffect(type) {
  activeWeatherEffect = type;
  initParticles(type);
  startParticleLoop();
}

export function stopWeatherEffect() {
  activeWeatherEffect = 'none';
  stopParticleLoop();
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function initParticles(type) {
  particles = [];
  if (!canvas) return;
  const w = canvas.width;
  const h = canvas.height;

  if (type === 'rain' || type === 'thunder') {
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: Math.random() * 18 + 10,
        speed: Math.random() * 8 + 12,
        opacity: Math.random() * 0.3 + 0.15
      });
    }
  } else if (type === 'snow') {
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 3 + 1,
        speed: Math.random() * 1.5 + 0.8,
        drift: Math.random() * 0.02,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  } else if (type === 'stars') {
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * (h * 0.7),
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        pulseSpeed: Math.random() * 0.02 + 0.01
      });
    }
  }
}

function startParticleLoop() {
  if (animationFrameId || activeWeatherEffect === 'none') return;

  function loop() {
    renderParticles();
    animationFrameId = requestAnimationFrame(loop);
  }
  animationFrameId = requestAnimationFrame(loop);
}

function stopParticleLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function renderParticles() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;

  if (activeWeatherEffect === 'rain' || activeWeatherEffect === 'thunder') {
    ctx.strokeStyle = 'rgba(180, 210, 255, 0.4)';
    ctx.lineWidth = 1.2;

    particles.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.len * 0.25, p.y + p.len);
      ctx.stroke();

      p.y += p.speed;
      p.x -= p.speed * 0.25;

      if (p.y > h) {
        p.y = -20;
        p.x = Math.random() * (w + 100);
      }
    });

    if (activeWeatherEffect === 'thunder') {
      if (Math.random() < 0.008) {
        thunderFlashAlpha = 0.25;
      }
      if (thunderFlashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${thunderFlashAlpha})`;
        ctx.fillRect(0, 0, w, h);
        thunderFlashAlpha -= 0.03;
      }
    }
  } else if (activeWeatherEffect === 'snow') {
    particles.forEach(p => {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      p.y += p.speed;
      p.x += Math.sin(p.y * p.drift) * 0.8;

      if (p.y > h) {
        p.y = -10;
        p.x = Math.random() * w;
      }
    });
  } else if (activeWeatherEffect === 'stars') {
    particles.forEach(p => {
      p.alpha += p.pulseSpeed;
      if (p.alpha > 0.8 || p.alpha < 0.2) p.pulseSpeed = -p.pulseSpeed;

      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, p.alpha)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

