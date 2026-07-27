// PREMIUM ID - Content Script v5.0 (Netflix - Sin bucle de refresco)

(function() {
    'use strict';

    const platformConfig = {
        'netflix.com': { color: '#E50914', text: 'Netflix', loginUrl: 'https://www.netflix.com/login', loginIndicators: ['signin', 'login'] },
        'crunchyroll.com': { color: '#F47521', text: 'Crunchyroll', loginUrl: 'https://www.crunchyroll.com/login', loginIndicators: ['login', 'signin'] },
        'primevideo.com': { color: '#00A8E1', text: 'Prime Video', loginUrl: 'https://www.primevideo.com/auth', loginIndicators: ['signin', 'login'] },
        'amazon.com': { color: '#00A8E1', text: 'Prime Video', loginUrl: 'https://www.primevideo.com/auth', loginIndicators: ['signin', 'login'] },
        'paramountplus.com': { color: '#0066FF', text: 'Paramount+', loginUrl: 'https://www.paramountplus.com/login', loginIndicators: ['login', 'signin'] },
        'viki.com': { color: '#9B59B6', text: 'Rakuten Viki', loginUrl: 'https://www.viki.com/login', loginIndicators: ['login', 'signin'] },
        'atresplayer.com': { color: '#FF4D4D', text: 'AtresPlayer', loginUrl: 'https://www.atresplayer.com/iniciar-sesion', loginIndicators: ['iniciar-sesion', 'login'] },
        'hbomax.com': { color: '#6432F9', text: 'HBO Max', loginUrl: 'https://www.hbomax.com/login', loginIndicators: ['login', 'signin'] },
        'max.com': { color: '#6432F9', text: 'HBO Max', loginUrl: 'https://www.max.com/login', loginIndicators: ['login', 'signin'] }
    };

    function getCurrentPlatform() {
        const hostname = window.location.hostname;
        for (const [domain, data] of Object.entries(platformConfig)) {
            if (hostname.includes(domain)) {
                return data;
            }
        }
        return { color: '#F47521', text: 'Premium', loginUrl: 'https://www.crunchyroll.com/login', loginIndicators: [] };
    }

    function getPlatformKey() {
        const hostname = window.location.hostname;
        if (hostname.includes('netflix')) return 'netflix';
        if (hostname.includes('crunchyroll')) return 'crunchyroll';
        if (hostname.includes('primevideo') || hostname.includes('amazon')) return 'prime';
        if (hostname.includes('paramount')) return 'paramount';
        if (hostname.includes('viki')) return 'viki';
        if (hostname.includes('atresplayer')) return 'atresplayer';
        if (hostname.includes('hbomax') || hostname.includes('max')) return 'hbomax';
        return null;
    }

    function isNetflix() {
        return window.location.hostname.includes('netflix.com');
    }

    function isCrunchyroll() {
        return window.location.hostname.includes('crunchyroll.com');
    }

    // ============================================================
    // CONTROL DE BUCLE PARA NETFLIX
    // ============================================================
    let netflixRedirected = false;  // ✅ Bandera para evitar bucle

    // ========== MARCA DE AGUA ==========
    let watermarkAdded = false;

    function addWatermark() {
        if (watermarkAdded) return;
        if (!document.body) {
            setTimeout(addWatermark, 500);
            return;
        }

        watermarkAdded = true;
        const platform = getCurrentPlatform();
        const brandColor = platform.color;

        const watermark = document.createElement('a');
        watermark.id = 'premium-id-watermark';
        watermark.href = 'https://t.me/cuentaspremiumid';
        watermark.target = '_blank';
        watermark.rel = 'noopener noreferrer';
        watermark.innerHTML = '🎬 CUENTAS GRATIS 🎬';
        watermark.style.cssText = `
            position: fixed !important;
            bottom: 12px !important;
            left: 12px !important;
            background: rgba(0, 0, 0, 0.85) !important;
            backdrop-filter: blur(8px) !important;
            color: ${brandColor} !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            font-size: 12px !important;
            font-weight: 700 !important;
            padding: 8px 16px !important;
            border-radius: 32px !important;
            z-index: 2147483647 !important;
            text-decoration: none !important;
            letter-spacing: 0.5px !important;
            border: 1px solid ${brandColor} !important;
            transition: all 0.2s ease !important;
            cursor: pointer !important;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
            pointer-events: auto !important;
            display: block !important;
        `;

        watermark.addEventListener('mouseenter', () => {
            watermark.style.background = brandColor;
            watermark.style.color = '#ffffff';
            watermark.style.transform = 'scale(1.02)';
        });

        watermark.addEventListener('mouseleave', () => {
            watermark.style.background = 'rgba(0, 0, 0, 0.85)';
            watermark.style.color = brandColor;
            watermark.style.transform = 'scale(1)';
        });

        document.body.appendChild(watermark);
    }

    // ========== ENVIAR MENSAJE SEGURO ==========
    let extensionAlive = true;

    function safeSendMessage(message, callback) {
        if (!extensionAlive) return;

        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    if (chrome.runtime.lastError.message.includes('context invalidated')) {
                        extensionAlive = false;
                    }
                    if (callback) callback(null);
                    return;
                }
                if (callback) callback(response);
            });
        } catch (e) {
            extensionAlive = false;
            if (callback) callback(null);
        }
    }

    // ========== DETECTAR SESIÓN INVÁLIDA (SIN BUCLE) ==========
    function detectInvalidSession() {
        if (!isNetflix()) return;
        
        // ⛔ SI YA SE REDIRIGIÓ, NO HACER NADA
        if (netflixRedirected) return;

        const platform = getCurrentPlatform();
        const url = window.location.href.toLowerCase();
        const title = document.title?.toLowerCase() || '';
        const body = document.body?.innerText?.toLowerCase() || '';

        // ✅ SI ESTAMOS EN LOGIN, NO REDIRIGIR
        if (url.includes('login')) {
            netflixRedirected = true;  // Marcar para no redirigir
            return;
        }

        const expiredIndicators = [
            'session expired', 'sesión expirada', 'sign in again', 
            'inicia sesión nuevamente', 'logged out', 'cerraste sesión',
            'your session has expired', 'tu sesión ha expirado',
            'no eres parte del hogar', 'your netflix household',
            'iniciar sesión', 'sign in', 'sign in to continue',
            'vuelve a iniciar sesión'
        ];
        const isExpired = expiredIndicators.some(indicator => 
            body.includes(indicator) || title.includes(indicator)
        );

        if (isExpired) {
            // ✅ MARCAR PARA NO REPETIR
            netflixRedirected = true;
            
            safeSendMessage({
                action: 'session_failed',
                platform: getPlatformKey()
            });

            // ✅ LIMPIAR COOKIES Y REDIRIGIR
            clearCookies();

            setTimeout(() => {
                window.location.href = platform.loginUrl;
            }, 500);
        }
    }

    function clearCookies() {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const name = cookie.split("=")[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        }
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch (e) {}
    }

    // ========== RECIBIR MENSAJES ==========
    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!extensionAlive) {
                sendResponse({ error: 'context_invalidated' });
                return true;
            }

            if (request.action === 'heartbeat') {
                sendResponse({ received: true });
            }

            if (request.action === 'kill_session') {
                sendResponse({ killed: false, message: 'Kill session disabled' });
            }

            if (request.action === 'reset_netflix_redirect') {
                netflixRedirected = false;
                sendResponse({ reset: true });
            }

            if (request.action === 'check_session_validity') {
                setTimeout(() => {
                    detectInvalidSession();
                }, 2000);
                sendResponse({ checking: true });
            }

            return true;
        });
    } catch (e) {
        extensionAlive = false;
    }

    // ============================================================
    // ========== PROTECCIONES DE NETFLIX ==========
    // ============================================================

    // ========== BLOQUEAR NAVEGACIÓN ==========
    function blockNavigation() {
        if (!isNetflix()) return;

        const path = window.location.pathname;
        const url = window.location.href;

        const tvPatterns = ['/tv', '/tv8', '/tv2', '/tv9', '/pair', '/activate', '/device', '/atv', '/tvcode'];
        if (tvPatterns.some(p => path.includes(p) || url.includes(p))) {
            window.location.replace('https://www.netflix.com/browse');
            return;
        }
        
        if (path.includes('/account') || path.includes('/profiles') || path.includes('/ManageProfiles') || path.includes('logout')) {
            window.location.replace('https://www.netflix.com/browse');
            return;
        }
    }

    // ========== ANULAR BOTÓN DE CERRAR SESIÓN ==========
    function blockSignOutButtons() {
        if (!isNetflix()) return;

        const allElements = document.querySelectorAll('a, button, span, div');
        allElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            const href = el.getAttribute('href')?.toLowerCase() || '';
            const onClick = el.getAttribute('onclick')?.toLowerCase() || '';
            
            const isSignOut = (
                text.includes('cerrar sesión') || 
                text.includes('sign out') || 
                text.includes('logout') ||
                text.includes('cerrar sesión') ||
                text.includes('cierra sesión') ||
                ariaLabel.includes('cerrar sesión') ||
                ariaLabel.includes('sign out') ||
                ariaLabel.includes('logout') ||
                href.includes('logout') ||
                href.includes('signout') ||
                onClick.includes('logout') ||
                onClick.includes('signout')
            );
            
            if (isSignOut) {
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.4';
                el.style.cursor = 'default';
                el.style.userSelect = 'none';
                
                if (el.tagName === 'A') {
                    el.removeAttribute('href');
                    el.style.textDecoration = 'none';
                }
                if (el.hasAttribute('onclick')) {
                    el.setAttribute('onclick', 'return false;');
                }
                if (!el.hasAttribute('data-blocked')) {
                    el.setAttribute('data-blocked', 'true');
                    el.title = '🔒 Bloqueado por PREMIUM ID';
                }
            }
        });
    }

    // ========== ANULAR BOTÓN "+" AGREGAR PERFIL ==========
    function blockAddProfileButton() {
        if (!isNetflix()) return;

        const addProfileButtons = document.querySelectorAll('a, button');
        addProfileButtons.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            
            const isAddProfile = (
                text === '+' ||
                text.includes('agregar perfil') ||
                text.includes('add profile') ||
                text.includes('añadir perfil') ||
                text.includes('create profile') ||
                ariaLabel.includes('agregar perfil') ||
                ariaLabel.includes('add profile') ||
                ariaLabel.includes('añadir perfil') ||
                (el.className && el.className.includes && el.className.includes('profile-add')) ||
                (el.id && el.id.includes('add-profile'))
            );
            
            if (isAddProfile) {
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.4';
                el.style.cursor = 'default';
                el.style.userSelect = 'none';
                
                if (el.tagName === 'A') {
                    el.removeAttribute('href');
                }
                if (el.hasAttribute('onclick')) {
                    el.setAttribute('onclick', 'return false;');
                }
                if (!el.hasAttribute('data-blocked')) {
                    el.setAttribute('data-blocked', 'true');
                    el.title = '🔒 Bloqueado por PREMIUM ID';
                }
            }
        });
    }

    // ========== PERMITIR SOLO SELECCIÓN DE PERFILES ==========
    function allowProfileSelection() {
        if (!isNetflix()) return;

        document.querySelectorAll('.profile-link, .profile-icon, [data-profile-guid]').forEach(el => {
            const isAddButton = el.textContent?.includes('+') || 
                               el.getAttribute('aria-label')?.includes('agregar');
            if (!isAddButton) {
                el.style.pointerEvents = '';
                el.style.opacity = '';
                el.style.cursor = '';
                el.style.userSelect = '';
            }
        });
    }

    // ========== BLOQUEAR TODOS LOS BOTONES PELIGROSOS ==========
    function blockAllDangerousButtons() {
        if (!isNetflix()) return;

        blockSignOutButtons();
        blockAddProfileButton();
        allowProfileSelection();
    }

    // ========== DESBLOQUEAR CAMBIO DE IDIOMA ==========
    let languageStyleInserted = false;

    function unblockLanguageSelector() {
        if (isCrunchyroll()) return;

        if (!languageStyleInserted && !document.getElementById('premium-id-language-unlock')) {
            const style = document.createElement('style');
            style.id = 'premium-id-language-unlock';
            style.textContent = `
                [data-testid="audio-track-selector"],
                [data-testid="subtitle-track-selector"],
                [aria-label*="idioma" i],
                [aria-label*="language" i],
                .language-selector,
                .audio-selector,
                .subtitle-selector,
                select[aria-label*="idioma"],
                select[aria-label*="language"],
                button[aria-label*="audio"],
                button[aria-label*="subtítulo"],
                button[aria-label*="subtitle"] {
                    pointer-events: auto !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    display: inline-flex !important;
                    cursor: pointer !important;
                }
            `;
            document.head.appendChild(style);
            languageStyleInserted = true;
        }

        const languageElements = document.querySelectorAll(
            '[data-testid="audio-track-selector"], ' +
            '[data-testid="subtitle-track-selector"], ' +
            '[aria-label*="idioma" i], ' +
            '[aria-label*="language" i], ' +
            '.language-selector, ' +
            '.audio-selector, ' +
            '.subtitle-selector'
        );

        languageElements.forEach(el => {
            if (el.hasAttribute('disabled')) el.removeAttribute('disabled');
            if (el.getAttribute('aria-disabled') === 'true') el.removeAttribute('aria-disabled');
        });
    }

    // ========== RESETEAR BANDERA AL CARGAR UNA NUEVA SESIÓN ==========
    function resetRedirectFlag() {
        // Si la URL es browse (sesión activa), resetear la bandera
        if (window.location.href.includes('/browse')) {
            netflixRedirected = false;
        }
    }

    // ========== INICIALIZAR ==========
    function init() {
        addWatermark();

        if (isNetflix()) {
            blockNavigation();
            
            setInterval(blockAllDangerousButtons, 2000);
            blockAllDangerousButtons();
            
            // ✅ RESETEAR BANDERA SI ESTAMOS EN BROWSE
            resetRedirectFlag();
            
            // ✅ DETECTAR SESIÓN CADA 5 SEGUNDOS (SOLO SI NO SE HA REDIRIGIDO)
            setInterval(detectInvalidSession, 5000);
            
            // ✅ DETECTAR AL CARGAR LA PÁGINA
            window.addEventListener('load', () => {
                resetRedirectFlag();
                setTimeout(() => {
                    detectInvalidSession();
                }, 1500);
            });
            
            // ✅ CUANDO CAMBIA LA URL (SPA DE NETFLIX)
            let lastUrl = window.location.href;
            setInterval(() => {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    resetRedirectFlag();
                    detectInvalidSession();
                }
            }, 1000);
            
            const observer = new MutationObserver(() => {
                blockAllDangerousButtons();
            });
            
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }

            window.addEventListener('scroll', () => {
                blockAllDangerousButtons();
            }, { passive: true });
        }

        if (!isCrunchyroll()) {
            unblockLanguageSelector();
            setInterval(unblockLanguageSelector, 3000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🔥 PREMIUM ID - CONTENT v5.0 (Netflix - Sin bucle de refresco)');
})();