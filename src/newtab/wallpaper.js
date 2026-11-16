// Aura Tab - Dynamic Sky, Procedural Themes & Online Animated Live Video Wallpapers

import { getSettings, updateSettings, saveWallpaperToDB, getWallpaperFromDB } from '../common/storage.js';

export const BUILTIN_WALLPAPERS = [
  {
    id: 'sky',
    name: 'Dynamic Solar Sky',
    desc: 'Real-time solar sky shifting from Dawn to Night',
    tag: 'Ambient',
    category: 'procedural',
    preview: 'linear-gradient(180deg, #1A102F, #C2635B, #E89E6C)'
  },
  {
    id: 'aurora',
    name: 'Northern Lights',
    desc: 'Ethereal emerald, cyan & violet polar aurora ribbons',
    tag: 'Animated',
    category: 'procedural',
    preview: 'linear-gradient(135deg, #020C1B 0%, #064E3B 40%, #06B6D4 80%, #6366F1 100%)'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Grid',
    desc: 'Retro synthwave horizon with glowing neon perspective',
    tag: 'Retro 80s',
    category: 'procedural',
    preview: 'linear-gradient(180deg, #090014 0%, #2E0854 50%, #EC4899 100%)'
  },
  {
    id: 'nebula',
    name: 'Cosmic Nebula',
    desc: 'Deep galactic space with radiant cosmic stardust',
    tag: 'Cosmic',
    category: 'procedural',
    preview: 'radial-gradient(ellipse at center, #3B0764 0%, #1E1B4B 60%, #030712 100%)'
  },
  {
    id: 'obsidian',
    name: 'Liquid Obsidian',
    desc: 'Apple-style iridescent dark fluid waves',
    tag: 'Calm Glass',
    category: 'procedural',
    preview: 'linear-gradient(135deg, #0F172A 0%, #1E293B 40%, #020617 100%)'
  },
  {
    id: 'sunset',
    name: 'Dune Sunset',
    desc: 'Warm golden hour desert horizon and terracotta embers',
    tag: 'Warm',
    category: 'procedural',
    preview: 'linear-gradient(180deg, #1C0A00 0%, #7C2D12 50%, #F59E0B 100%)'
  },
  {
    id: 'rainforest',
    name: 'Emerald Canopy',
    desc: 'Moody botanical mist & deep forest moss',
    tag: 'Nature',
    category: 'procedural',
    preview: 'linear-gradient(180deg, #022C22 0%, #064E3B 45%, #0F766E 100%)'
  },
  {
    id: 'matrix',
    name: 'Digital Cyber Rain',
    desc: 'Subtle emerald phosphors flowing through the matrix',
    tag: 'Cyber',
    category: 'procedural',
    preview: 'linear-gradient(180deg, #001100 0%, #002B00 60%, #000000 100%)'
  },
  {
    id: 'minimalist',
    name: 'Studio Obsidian',
    desc: 'Monochrome architectural dark slate',
    tag: 'Minimal',
    category: 'procedural',
    preview: 'linear-gradient(180deg, #181A20 0%, #0B0F17 100%)'
  }
];

export const ONLINE_ANIMATED_WALLPAPERS = [
  {
    id: 'online_rain_window',
    name: 'Rain on Window',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-falling-on-a-window-glass-1250-large.mp4',
    preview: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
    desc: 'Gentle raindrops running down a calm windowpane'
  },
  {
    id: 'online_ocean_waves',
    name: 'Sunset Ocean Surf',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-waves-coming-to-the-beach-5016-large.mp4',
    preview: 'linear-gradient(135deg, #7C2D12 0%, #F59E0B 100%)',
    desc: 'Golden hour waves washing peacefully ashore'
  },
  {
    id: 'online_space_stars',
    name: 'Hyperspace Flight',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-flying-through-a-starfield-in-deep-space-41539-large.mp4',
    preview: 'radial-gradient(circle, #3B0764 0%, #030712 100%)',
    desc: 'Hyperspace flight through distant cosmic nebulae'
  },
  {
    id: 'online_forest_fog',
    name: 'Misty Alpine Pines',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-forest-covered-in-fog-42207-large.mp4',
    preview: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)',
    desc: 'Morning sea of mist drifting across alpine evergreens'
  },
  {
    id: 'online_fireplace',
    name: 'Cozy Hearth Fire',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-burning-wood-in-a-fireplace-43075-large.mp4',
    preview: 'linear-gradient(135deg, #451A03 0%, #7C2D12 100%)',
    desc: 'Warm crackling firewood embers in an ambient hearth'
  },
  {
    id: 'online_night_city',
    name: 'Tokyo Cyber Lights',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-night-time-traffic-on-a-city-highway-42044-large.mp4',
    preview: 'linear-gradient(135deg, #18002E 0%, #090014 100%)',
    desc: 'Streaming light trails across a nocturnal metropolis'
  },
  {
    id: 'online_sakura',
    name: 'Cherry Blossom Breeze',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-cherry-blossom-flowers-in-spring-43097-large.mp4',
    preview: 'linear-gradient(135deg, #BE185D 0%, #4C0519 100%)',
    desc: 'Gentle sakura petals fluttering on spring branches'
  },
  {
    id: 'online_thunder',
    name: 'Atmospheric Storm',
    type: 'video',
    tag: 'Live Video',
    category: 'animated',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-lightning-flashes-in-a-storm-cloud-at-night-42358-large.mp4',
    preview: 'linear-gradient(135deg, #1E1B4B 0%, #0B0F17 100%)',
    desc: 'Dramatic lightning flashes illuminating night clouds'
  }
];

export const CURATED_4K_WALLPAPERS = [
  {
    id: 'photo_nordic_fjords',
    name: 'Nordic Mountain Fjord',
    type: 'image',
    tag: '4K Photo',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85',
    preview: 'linear-gradient(135deg, #0369A1 0%, #0C4A6E 100%)',
    desc: 'Majestic mountain lake reflections at dawn'
  },
  {
    id: 'photo_tokyo_night',
    name: 'Neon Tokyo Rain',
    type: 'image',
    tag: '4K Photo',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2560&q=85',
    preview: 'linear-gradient(135deg, #831843 0%, #1E1B4B 100%)',
    desc: 'Rainy Tokyo alleyway with traditional glowing paper lanterns'
  },
  {
    id: 'photo_milky_way',
    name: 'Milky Way Galaxy',
    type: 'image',
    tag: '4K Photo',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2560&q=85',
    preview: 'linear-gradient(135deg, #312E81 0%, #030712 100%)',
    desc: 'High desert astronomical starscape and galaxy arch'
  },
  {
    id: 'photo_minimal_desert',
    name: 'Minimal Dune Shadows',
    type: 'image',
    tag: '4K Photo',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2560&q=85',
    preview: 'linear-gradient(135deg, #9A3412 0%, #431407 100%)',
    desc: 'Clean architectural ridge lines in twilight dunes'
  }
];

export const ALL_WALLPAPERS = [
  ...ONLINE_ANIMATED_WALLPAPERS,
  ...BUILTIN_WALLPAPERS,
  ...CURATED_4K_WALLPAPERS
];

let matrixCanvasId = null;

export async function initWallpaper(settings) {
  const container = document.getElementById('wallpaper-container');
  const skyEl = document.getElementById('sky-gradient');
  const themeLayerEl = document.getElementById('theme-layer');
  const videoEl = document.getElementById('wallpaper-video');
  const imageEl = document.getElementById('wallpaper-image');
  const themeLabel = document.getElementById('theme-name-label');

  async function applyWallpaper() {
    const current = await getSettings();
    const type = current.wallpaperType || 'sky';

    // Stop matrix animation if active
    if (matrixCanvasId) {
      cancelAnimationFrame(matrixCanvasId);
      matrixCanvasId = null;
    }

    // Reset media layers
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
    videoEl.style.display = 'none';

    imageEl.style.backgroundImage = 'none';
    imageEl.style.display = 'none';

    skyEl.style.display = 'none';
    themeLayerEl.style.display = 'none';
    themeLayerEl.className = 'theme-layer';
    themeLayerEl.innerHTML = '';

    const currentItem = ALL_WALLPAPERS.find(w => w.id === type);
    if (themeLabel) {
      if (type === 'custom') {
        themeLabel.textContent = 'Custom Upload';
      } else if (type === 'online_video' || type === 'online_image') {
        themeLabel.textContent = 'Web Wallpaper';
      } else {
        themeLabel.textContent = currentItem?.name || 'Wallpaper';
      }
    }

    // 1. Direct Online Video Link (Live Web Wallpaper)
    if (type === 'online_video' && current.activeWallpaperUrl) {
      videoEl.src = current.activeWallpaperUrl;
      videoEl.style.display = 'block';
      videoEl.play().catch(e => console.warn('[Aura Tab] Video autoplay blocked or invalid:', e));
      return;
    }

    // 2. Direct Online Image / GIF Link
    if (type === 'online_image' && current.activeWallpaperUrl) {
      imageEl.style.backgroundImage = `url("${current.activeWallpaperUrl}")`;
      imageEl.style.display = 'block';
      return;
    }

    // 3. Curated Online Animated Video
    const onlineAnimated = ONLINE_ANIMATED_WALLPAPERS.find(w => w.id === type);
    if (onlineAnimated) {
      videoEl.src = onlineAnimated.url;
      videoEl.style.display = 'block';
      videoEl.play().catch(e => console.warn('[Aura Tab] Video play error:', e));
      return;
    }

    // 4. Curated 4K Photography
    const onlinePhoto = CURATED_4K_WALLPAPERS.find(w => w.id === type);
    if (onlinePhoto) {
      imageEl.style.backgroundImage = `url("${onlinePhoto.url}")`;
      imageEl.style.display = 'block';
      return;
    }

    // 5. Custom Upload from IndexedDB
    if (type === 'custom' && current.activeWallpaperId) {
      try {
        const item = await getWallpaperFromDB(current.activeWallpaperId);
        if (item && item.blob) {
          const objectUrl = URL.createObjectURL(item.blob);
          if (item.type.startsWith('video/')) {
            videoEl.src = objectUrl;
            videoEl.style.display = 'block';
            videoEl.play().catch(() => {});
          } else {
            imageEl.style.backgroundImage = `url(${objectUrl})`;
            imageEl.style.display = 'block';
          }
          return;
        }
      } catch (err) {
        console.warn('[Aura Tab] Error loading custom wallpaper:', err);
      }
    }

    // 6. Dynamic Real-time Solar Sky
    if (type === 'sky') {
      skyEl.style.display = 'block';
      updateSkyGradient(skyEl);
      return;
    }

    // 7. Procedural Built-in Themes (aurora, cyberpunk, nebula, etc.)
    themeLayerEl.style.display = 'block';
    themeLayerEl.classList.add(`theme-${type}`);
    setupThemeElements(type, themeLayerEl);
  }

  function updateSkyGradient(el) {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;

    let gradient = '';
    if (hour >= 5 && hour < 7.5) {
      // Dawn
      gradient = 'linear-gradient(180deg, #1A102F 0%, #4E2757 45%, #C2635B 80%, #E89E6C 100%)';
    } else if (hour >= 7.5 && hour < 17) {
      // Day
      gradient = 'linear-gradient(180deg, #1C3144 0%, #2B4C6F 40%, #466995 100%)';
    } else if (hour >= 17 && hour < 19.5) {
      // Dusk
      gradient = 'linear-gradient(180deg, #0B132B 0%, #1C2541 40%, #5B3758 75%, #8B4F58 100%)';
    } else {
      // Night
      gradient = 'linear-gradient(180deg, #030712 0%, #0B0F19 50%, #111827 100%)';
    }

    el.style.background = gradient;
  }

  function setupThemeElements(type, containerEl) {
    if (type === 'cyberpunk') {
      containerEl.innerHTML = `
        <div class="cyber-sun"></div>
        <div class="cyber-grid"></div>
        <div class="cyber-horizon"></div>
      `;
    } else if (type === 'aurora') {
      containerEl.innerHTML = `
        <div class="aurora-glow aurora-1"></div>
        <div class="aurora-glow aurora-2"></div>
        <div class="aurora-glow aurora-3"></div>
      `;
    } else if (type === 'nebula') {
      containerEl.innerHTML = `
        <div class="nebula-cloud nebula-1"></div>
        <div class="nebula-cloud nebula-2"></div>
      `;
    } else if (type === 'obsidian') {
      containerEl.innerHTML = `
        <div class="obsidian-orb orb-1"></div>
        <div class="obsidian-orb orb-2"></div>
        <div class="obsidian-orb orb-3"></div>
      `;
    } else if (type === 'sunset') {
      containerEl.innerHTML = `
        <div class="sunset-sun"></div>
        <div class="sunset-dune dune-1"></div>
        <div class="sunset-dune dune-2"></div>
      `;
    } else if (type === 'rainforest') {
      containerEl.innerHTML = `
        <div class="rainforest-beam beam-1"></div>
        <div class="rainforest-beam beam-2"></div>
      `;
    } else if (type === 'matrix') {
      const canvas = document.createElement('canvas');
      canvas.className = 'matrix-canvas';
      containerEl.appendChild(canvas);
      startMatrixRain(canvas);
    }
  }

  function startMatrixRain(canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');

    const chars = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    function draw() {
      ctx.fillStyle = 'rgba(0, 8, 2, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#10B981';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      matrixCanvasId = requestAnimationFrame(draw);
    }

    draw();
  }

  await applyWallpaper();

  // Periodically check sky update (every 10 minutes)
  setInterval(() => {
    if (skyEl.style.display !== 'none') {
      updateSkyGradient(skyEl);
    }
  }, 10 * 60 * 1000);
}

/**
 * Handle direct web link wallpaper (video or image/GIF)
 */
export async function handleWebWallpaperUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) return false;

  const isVideo = /\.(mp4|webm|ogv|m4v)(\?.*)?$/i.test(cleanUrl) || cleanUrl.includes('mixkit.co/videos') || cleanUrl.includes('video');
  const type = isVideo ? 'online_video' : 'online_image';

  const settings = await getSettings();
  let history = settings.wallpaperHistory || [];
  const id = 'web_' + Date.now();

  history = [
    { id, name: isVideo ? 'Online Video' : 'Online Image', type: isVideo ? 'video/mp4' : 'image/jpeg', url: cleanUrl, timestamp: Date.now() },
    ...history.filter(h => h.url !== cleanUrl)
  ].slice(0, 8);

  await updateSettings({
    wallpaperType: type,
    activeWallpaperUrl: cleanUrl,
    wallpaperHistory: history
  });

  return true;
}

/**
 * Handle new wallpaper upload (Image, GIF, Video)
 */
export async function handleWallpaperUpload(file) {
  if (!file) return null;

  if (file.size > 25 * 1024 * 1024) {
    alert('File is too large. Maximum size is 25MB.');
    return null;
  }

  const id = 'wp_' + Date.now();
  const wallpaperObj = {
    id,
    name: file.name,
    type: file.type,
    blob: file,
    timestamp: Date.now()
  };

  await saveWallpaperToDB(wallpaperObj);

  const settings = await getSettings();
  let history = settings.wallpaperHistory || [];
  history = [{ id, name: file.name, type: file.type, timestamp: Date.now() }, ...history.filter(h => h.id !== id)].slice(0, 8);

  await updateSettings({
    wallpaperType: 'custom',
    activeWallpaperId: id,
    wallpaperHistory: history
  });

  return id;
}

/**
 * Initialize Quick Wallpaper Switcher Popover
 */
export function initThemeSwitcher(onThemeSelected) {
  const btn = document.getElementById('theme-switcher-btn');
  const popover = document.getElementById('theme-switcher-popover');
  const grid = document.getElementById('theme-switcher-grid');
  const filterBtns = document.querySelectorAll('.theme-filter-btn');
  const webInput = document.getElementById('popover-web-url-input');
  const webBtn = document.getElementById('btn-popover-apply-url');

  if (!btn || !popover || !grid) return;

  let currentCategory = 'all';

  function renderGrid(category = 'all') {
    grid.innerHTML = '';
    const filtered = category === 'all'
      ? ALL_WALLPAPERS
      : ALL_WALLPAPERS.filter(w => w.category === category);

    filtered.forEach(theme => {
      const card = document.createElement('div');
      card.className = 'theme-mini-card';
      card.dataset.themeId = theme.id;
      card.title = theme.desc || theme.name;

      card.innerHTML = `
        <div class="theme-mini-preview" style="background: ${theme.preview};">
          <span class="theme-mini-tag">${theme.tag}</span>
        </div>
        <span class="theme-mini-name">${theme.name}</span>
      `;

      card.addEventListener('click', async (e) => {
        e.stopPropagation();
        popover.classList.remove('visible');
        await updateSettings({ wallpaperType: theme.id });
        if (onThemeSelected) onThemeSelected(await getSettings());
      });

      grid.appendChild(card);
    });
  }

  renderGrid('all');

  filterBtns.forEach(fBtn => {
    fBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterBtns.forEach(b => b.classList.remove('active'));
      fBtn.classList.add('active');
      currentCategory = fBtn.dataset.category;
      renderGrid(currentCategory);
    });
  });

  if (webBtn && webInput) {
    webBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const url = webInput.value.trim();
      if (url) {
        webInput.value = '';
        popover.classList.remove('visible');
        const success = await handleWebWallpaperUrl(url);
        if (success && onThemeSelected) {
          onThemeSelected(await getSettings());
        }
      }
    });

    webInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        webBtn.click();
      }
    });
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.toggle('visible');
  });

  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== btn) {
      popover.classList.remove('visible');
    }
  });
}
