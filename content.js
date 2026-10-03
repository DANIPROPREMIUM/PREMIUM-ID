// PREMIUM ID - Content Script v6.5 (Netflix + Crunchyroll: bloqueos + HiDive)

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
        'max.com': { color: '#6432F9', text: 'HBO Max', loginUrl: 'https://www.max.com/login', loginIndicators: ['login', 'signin'] },
        'hidive.com': { color: '#00AEEF', text: 'HiDive', loginUrl: 'https://www.hidive.com/login', loginIndicators: ['login', 'signin'] }
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
        if (hostname.includes('hidive')) return 'hidive';
        return null;
    }

    function isNetflix() {
        return window.location.hostname.includes('netflix.com');
    }

    function isCrunchyroll() {
        return window.location.hostname.includes('crunchyroll.com');
    }

    function isHboMax() {
        return window.location.hostname.includes('hbomax') ||
               window.location.hostname.includes('max.com');
    }

    function isHiDive() {
        return window.location.hostname.includes('hidive.com');
    }

    let netflixRedirected = false;
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

    function detectInvalidSession() {
        if (!isNetflix()) return;
        if (window.location.href.toLowerCase().includes('nftoken')) return;
        if (netflixRedirected) return;

        const platform = getCurrentPlatform();
        const url = window.location.href.toLowerCase();
        const title = document.title?.toLowerCase() || '';
        const body = document.body?.innerText?.toLowerCase() || '';

        if (url.includes('login')) {
            netflixRedirected = true;
            return;
        }

        const expiredIndicators = [
            'session expired', 'sesión expirada', 'sign in again',
            'inicia sesión nuevamente', 'logged out', 'cerraste sesión',
            'your session has expired', 'tu sesión ha expirado'
        ];
        const isExpired = expiredIndicators.some(indicator =>
            body.includes(indicator) || title.includes(indicator)
        );

        if (isExpired) {
            netflixRedirected = true;

            safeSendMessage({
                action: 'session_failed',
                platform: getPlatformKey()
            });

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

    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!extensionAlive) {
                sendResponse({ error: 'context_invalidated' });
                return true;
            }

            if (request.action === 'heartbeat') {
                sendResponse({ received: true });
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
    // ✅ HELPER: interceptar clics silenciosamente
    // ============================================================
    function interceptClicks(el) {
        el.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            return false;
        }, true);

        el.addEventListener('mousedown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
        }, true);

        el.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
        }, true);
    }

    function matchesSignOut(text, ariaLabel, href) {
        return (
            text.includes('cerrar sesión') ||
            text.includes('cierra sesión') ||
            text.includes('cerrar sesion') ||
            text.includes('cierra sesion') ||
            text.trim() === 'sign out' ||
            text.trim() === 'logout' ||
            text.trim() === 'log out' ||
            ariaLabel.includes('cerrar sesión') ||
            ariaLabel.includes('cerrar sesion') ||
            ariaLabel.includes('sign out') ||
            ariaLabel.includes('logout') ||
            ariaLabel.includes('log out') ||
            href.includes('logout') ||
            href.includes('signout') ||
            href.includes('sign-out') ||
            href.includes('/logout')
        );
    }

    function matchesProfileManagement(text, ariaLabel, href) {
        return (
            text.includes('gestionar perfil') ||
            text.includes('administrar perfil') ||
            text.includes('editar perfil') ||
            text.includes('añadir perfil') ||
            text.includes('anadir perfil') ||
            text.includes('agregar perfil') ||
            text.includes('crear perfil') ||
            text.includes('nuevo perfil') ||
            text.includes('manage profile') ||
            text.includes('edit profile') ||
            text.includes('add profile') ||
            text.includes('create profile') ||
            text.includes('new profile') ||
            ariaLabel.includes('gestionar perfil') ||
            ariaLabel.includes('administrar perfil') ||
            ariaLabel.includes('editar perfil') ||
            ariaLabel.includes('añadir perfil') ||
            ariaLabel.includes('agregar perfil') ||
            ariaLabel.includes('crear perfil') ||
            ariaLabel.includes('manage profile') ||
            ariaLabel.includes('edit profile') ||
            ariaLabel.includes('add profile') ||
            (href.includes('/profile') && (
                href.includes('edit') ||
                href.includes('manage') ||
                href.includes('add') ||
                href.includes('new') ||
                href.includes('create')
            ))
        );
    }

    // ============================================================
    // ✅ NETFLIX: solo bloquea "Cerrar sesión"
    // ============================================================
    function blockNetflixSignOut() {
        if (!isNetflix()) return;

        document.querySelectorAll('a, button').forEach(el => {
            if (el.hasAttribute('data-signout-blocked')) return;

            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            const href = el.getAttribute('href')?.toLowerCase() || '';

            if (matchesSignOut(text, ariaLabel, href)) {
                el.setAttribute('data-signout-blocked', 'true');
                interceptClicks(el);
            }
        });
    }

    // ============================================================
    // ✅ CRUNCHYROLL: bloquea "Cerrar sesión" + "Gestionar perfiles"
    // ============================================================
    function blockCrunchyrollActions() {
        if (!isCrunchyroll()) return;

        document.querySelectorAll('a, button').forEach(el => {
            if (el.hasAttribute('data-blocked-action')) return;

            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            const href = el.getAttribute('href')?.toLowerCase() || '';

            // Bloquear Cerrar sesión
            if (matchesSignOut(text, ariaLabel, href)) {
                el.setAttribute('data-blocked-action', 'true');
                interceptClicks(el);
                return;
            }

            // Bloquear gestión de perfiles
            if (matchesProfileManagement(text, ariaLabel, href)) {
                el.setAttribute('data-blocked-action', 'true');
                interceptClicks(el);
                return;
            }
        });
    }

    let languageStyleInserted = false;

    function unblockLanguageSelector() {
        if (isCrunchyroll()) return;
        if (isHboMax()) return;
        if (isHiDive()) return;

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

    function resetRedirectFlag() {
        if (window.location.href.includes('/browse')) {
            netflixRedirected = false;
        }
    }

    function init() {
        addWatermark();

        // Netflix: bloquear "Cerrar sesión"
        if (isNetflix()) {
            setInterval(blockNetflixSignOut, 2000);
            blockNetflixSignOut();
        }

        // Crunchyroll: bloquear "Cerrar sesión" + gestión de perfiles
        if (isCrunchyroll()) {
            setInterval(blockCrunchyrollActions, 2000);
            blockCrunchyrollActions();
        }

        // Observer + scroll comunes
        if (isNetflix() || isCrunchyroll()) {
            const observer = new MutationObserver(() => {
                if (isNetflix()) blockNetflixSignOut();
                if (isCrunchyroll()) blockCrunchyrollActions();
            });
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }

            window.addEventListener('scroll', () => {
                if (isNetflix()) blockNetflixSignOut();
                if (isCrunchyroll()) blockCrunchyrollActions();
            }, { passive: true });
        }

        // Netflix: detección de sesión inválida + reanudar bloqueo
        if (isNetflix()) {
            resetRedirectFlag();

            setInterval(detectInvalidSession, 5000);

            window.addEventListener('load', () => {
                resetRedirectFlag();
                setTimeout(() => {
                    detectInvalidSession();
                }, 1500);
            });

            let lastUrl = window.location.href;
            setInterval(() => {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    resetRedirectFlag();
                    detectInvalidSession();
                }
            }, 1000);
        }

        if (!isCrunchyroll() && !isHboMax() && !isHiDive()) {
            unblockLanguageSelector();
            setInterval(unblockLanguageSelector, 3000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🔥 PREMIUM ID - CONTENT v6.5 (Netflix + Crunchyroll: bloqueos + HiDive)');
})();