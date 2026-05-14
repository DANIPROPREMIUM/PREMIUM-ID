// ============================================================
//  Netflix Bypass v3.3 — "No eres parte del Hogar"
//  ✅ Elimina el modal una sola vez al entrar
//  ✅ Observer vigila si Netflix lo re-inserta (dentro o fuera del reproductor)
//  ✅ Sin setInterval — no polling ciego
//  ✅ Sin clicks automáticos — solo reanuda el video pausado
// ============================================================

(function () {
  'use strict';

  if (!location.hostname.includes('netflix.com')) return;

  const HOUSEHOLD_KEYWORDS = [
    // Español
    'no forma parte del hogar',
    'tu dispositivo no forma parte',
    'hogar con netflix',
    'no eres parte del hogar',
    'no vives en el hogar de netflix',
    'verifica tu ubicación',
    'verificar ubicación',
    'código de acceso temporal',
    'obtener un código de acceso',
    'este dispositivo no está en tu hogar',
    'dispositivo no pertenece al hogar',
    'fuera del hogar',
    'tu hogar de netflix',
    'agregar un hogar',
    'añadir hogar',
    // Inglés
    'your netflix household',
    'outside your netflix household',
    'verify your location',
    'get a temporary access code',
    'temporary access code',
    'add a home',
    'living outside',
    'not part of your household',
    'this device is not part',
    'household verification',
    'update your household',
  ];

  const HOUSEHOLD_SELECTORS = [
    '[data-uia="EBI_MOBILE_WATCH_TEMPORARILY"]',
    '[data-uia="EBI_BORROWER_CREATE_ACCOUNT_OR_SIGNOUT"]',
    '[data-uia="EBI_MOBILE_SIGNOUT"]',
    '[data-uia="clcsModal"]',
    '[data-uia="household-interstitial"]',
    '[data-uia="travel-mode-interstitial"]',
    '.watch-video--interstitial-scrim',
    '.nf-modal-overlay',
  ];

  let _observer = null;
  let _sweepTimer = null;
  let _resumeTimer = null;

  function containsHouseholdText(node) {
    const text = (node.innerText || node.textContent || '').toLowerCase();
    return HOUSEHOLD_KEYWORDS.some(kw => text.includes(kw));
  }

  function removeHouseholdModal(node, reason) {
    if (!node || !node.isConnected) return;

    const target =
      node.closest('[data-uia="clcsModal"]') ||
      node.closest('[data-uia="household-interstitial"]') ||
      node.closest('[data-uia="travel-mode-interstitial"]') ||
      node.closest('[role="dialog"]') ||
      node.closest('[role="alertdialog"]') ||
      node.closest('.watch-video--interstitial-scrim') ||
      node.closest('.nf-modal-overlay') ||
      node;

    if (!target || !target.isConnected) return;

    const id = target.getAttribute('data-uia') || target.className || '(sin clase)';
    console.log(`[Netflix Bypass v3.3] Modal de hogar eliminado (${reason}): ${id}`);
    target.remove();

    removeBackdropOverlays();
    resumeVideoPlayback();
  }

  function removeBackdropOverlays() {
    document.querySelectorAll(
      '[class*="interstitial"], [class*="modal-backdrop"], [class*="overlay--dim"], [class*="scrim"]'
    ).forEach(el => {
      if (containsHouseholdText(el) || el.children.length === 0) {
        el.remove();
      }
    });
  }

  function resumeVideoPlayback() {
    clearTimeout(_resumeTimer);
    _resumeTimer = setTimeout(() => {
      const videos = document.querySelectorAll('video');
      videos.forEach(v => {
        if (v.paused && v.readyState >= 2 && v.duration > 0) {
          v.play().catch(() => {});
          console.log('[Netflix Bypass v3.3] Video reanudado');
        }
      });
    }, 400);
  }

  // Barrido puntual — corre solo cuando se lo pide el Observer o al init
  function sweepHouseholdModal() {
    let found = false;

    HOUSEHOLD_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (containsHouseholdText(el)) {
          removeHouseholdModal(el, sel);
          found = true;
        }
      });
    });

    if (!found) {
      document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach(el => {
        if (containsHouseholdText(el)) {
          removeHouseholdModal(el, 'role=dialog');
          found = true;
        }
      });
    }

    if (!found) {
      document.querySelectorAll('div[style*="position: fixed"], div[style*="position:fixed"]').forEach(el => {
        if (containsHouseholdText(el)) {
          removeHouseholdModal(el, 'fullscreen-overlay');
        }
      });
    }
  }

  // Observer: actúa SOLO cuando Netflix inserta un nodo nuevo relevante
  // No hay setInterval — cero polling ciego
  function startObserver() {
    if (_observer) _observer.disconnect();
    _observer = new MutationObserver(mutations => {
      let needsSweep = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          const uia = node.getAttribute && node.getAttribute('data-uia');
          const isHouseholdModal =
            uia === 'clcsModal' ||
            uia === 'household-interstitial' ||
            uia === 'travel-mode-interstitial' ||
            (node.getAttribute('role') === 'dialog' && containsHouseholdText(node));
          if (isHouseholdModal || containsHouseholdText(node)) {
            needsSweep = true;
            break;
          }
        }
        if (needsSweep) break;
      }
      if (needsSweep) {
        // FIX: debounce corto — si Netflix inserta varios nodos seguidos,
        // solo corremos sweep una vez
        clearTimeout(_sweepTimer);
        _sweepTimer = setTimeout(sweepHouseholdModal, 150);
      }
    });

    const target = document.body || document.documentElement;
    _observer.observe(target, { childList: true, subtree: true });
    console.log('[Netflix Bypass v3.3] Observer activo — sin polling');
  }

  function init() {
    // Barrido inicial: elimina si ya está en el DOM al cargar la página
    sweepHouseholdModal();
    // Luego solo vigilar — sin setInterval
    startObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__netflixBypassSweep = sweepHouseholdModal;
})();
