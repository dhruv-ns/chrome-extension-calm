// Aura Tab - Hover Image Magnifier

(function () {
  let hoverTimer = null;
  let activeMagnifier = null;

  function showPreview(img, clientX, clientY) {
    removePreview();

    const src = img.currentSrc || img.src;
    if (!src || src.startsWith('data:image/svg')) return;

    const popover = document.createElement('div');
    popover.className = 'aura-image-magnifier';
    
    const previewImg = document.createElement('img');
    previewImg.src = src;
    popover.appendChild(previewImg);

    document.body.appendChild(popover);
    activeMagnifier = popover;

    // Position popover safely within viewport
    const popoverRect = popover.getBoundingClientRect();
    let left = clientX + 20;
    let top = clientY - popoverRect.height / 2;

    if (left + popoverRect.width > window.innerWidth - 20) {
      left = clientX - popoverRect.width - 20;
    }
    if (top < 20) top = 20;
    if (top + popoverRect.height > window.innerHeight - 20) {
      top = window.innerHeight - popoverRect.height - 20;
    }

    popover.style.left = `${Math.max(10, left)}px`;
    popover.style.top = `${Math.max(10, top)}px`;
  }

  function removePreview() {
    clearTimeout(hoverTimer);
    if (activeMagnifier) {
      activeMagnifier.remove();
      activeMagnifier = null;
    }
  }

  window.AuraImagePreviewer = {
    init: function (settings) {
      if (!settings.enableImageMagnifier) return;

      document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('img');
        if (!target) return;

        const rect = target.getBoundingClientRect();
        // Check size: between 32px and 300px
        if (rect.width >= 32 && rect.width <= 320 && rect.height >= 32 && rect.height <= 320) {
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => {
            showPreview(target, e.clientX, e.clientY);
          }, 350);
        }
      }, true);

      document.addEventListener('mouseout', (e) => {
        if (e.target.closest('img') || (activeMagnifier && !e.relatedTarget?.closest('.aura-image-magnifier'))) {
          removePreview();
        }
      }, true);

      window.addEventListener('scroll', removePreview, true);
    }
  };
})();

