// Netflix Bypass v3.3 - CORREGIDO

(function () {
    'use strict';

    if (!location.hostname.includes('netflix.com')) return;

    const KEYWORDS = [
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

    const SELECTORS = [
        '[data-uia="clcsModal"]',
        '[data-uia="household-interstitial"]',
        '[data-uia="travel-mode-interstitial"]',
        '[data-uia="EBI_MOBILE_WATCH_TEMPORARILY"]',
        '[data-uia="EBI_BORROWER_CREATE_ACCOUNT_OR_SIGNOUT"]',
        '[data-uia="EBI_MOBILE_SIGNOUT"]',
        '.watch-video--interstitial-scrim',
        '.nf-modal-overlay',
    ];

    let observer = null;
    let sweepTimer = null;
    let resumeTimer = null;

    function containsText(node) {
        const text = (node.innerText || node.textContent || '').toLowerCase();
        return KEYWORDS.some(kw => text.includes(kw));
    }

    function removeModal(node) {
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
        
        console.log('[Netflix Bypass] Modal eliminado');
        target.remove();

        // Eliminar overlays de fondo
        document.querySelectorAll(
            '[class*="interstitial"], [class*="modal-backdrop"], [class*="overlay--dim"], [class*="scrim"]'
        ).forEach(el => {
            if (containsText(el) || el.children.length === 0) {
                el.remove();
            }
        });

        // Reanudar video
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
            document.querySelectorAll('video').forEach(v => {
                if (v.paused && v.readyState >= 2 && v.duration > 0) {
                    v.play().catch(() => {});
                    console.log('[Netflix Bypass] Video reanudado');
                }
            });
        }, 400);
    }

    function sweep() {
        SELECTORS.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (containsText(el)) {
                    removeModal(el);
                }
            });
        });

        // Buscar también por role="dialog"
        document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach(el => {
            if (containsText(el)) {
                removeModal(el);
            }
        });
    }

    // INICIALIZAR OBSERVER - CORREGIDO
    function startObserver() {
        if (observer) observer.disconnect();
        
        observer = new MutationObserver(function(mutationsList) {  // ✅ AQUÍ ESTABA EL ERROR
            let needsSweep = false;
            
            for (const mutation of mutationsList) {  // ✅ mutationsList, NO mutations
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    
                    const uia = node.getAttribute && node.getAttribute('data-uia');
                    const isModal =
                        uia === 'clcsModal' ||
                        uia === 'household-interstitial' ||
                        uia === 'travel-mode-interstitial' ||
                        uia === 'EBI_MOBILE_WATCH_TEMPORARILY' ||
                        uia === 'EBI_BORROWER_CREATE_ACCOUNT_OR_SIGNOUT' ||
                        uia === 'EBI_MOBILE_SIGNOUT' ||
                        (node.getAttribute('role') === 'dialog' && containsText(node));
                    
                    if (isModal || containsText(node)) {
                        needsSweep = true;
                        break;
                    }
                }
                if (needsSweep) break;
            }
            
            if (needsSweep) {
                clearTimeout(sweepTimer);
                sweepTimer = setTimeout(sweep, 150);
            }
        });

        const target = document.body || document.documentElement;
        observer.observe(target, { childList: true, subtree: true });
        console.log('[Netflix Bypass] Observer activo');
    }

    function init() {
        sweep();
        startObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Función global para barrido manual
    window.__netflixBypassSweep = sweep;
})();