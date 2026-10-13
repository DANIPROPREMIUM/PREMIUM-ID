// PREMIUM ID - Content Script v6.9
// Netflix | HiDive | Disney+ (bloqueo total + watchdog anti-desactivación)

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
        'hidive.com': { color: '#00AEEF', text: 'HiDive', loginUrl: 'https://www.hidive.com/login', loginIndicators: ['login', 'signin'] },
        'disneyplus.com': { color: '#113CCF', text: 'Disney+', loginUrl: 'https://www.disneyplus.com/login', loginIndicators: ['login', 'signin'] }
    };

    function getCurrentPlatform() {
        const hostname = window.location.hostname;
        for (const [domain, data] of Object.entries(platformConfig)) {
            if (hostname.includes(domain)) return data;
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
        if (hostname.includes('hbomax') || hostname.includes('max.com')) return 'hbomax';
        if (hostname.includes('hidive')) return 'hidive';
        if (hostname.includes('disneyplus')) return 'disney';
        return null;
    }

    function isNetflix()     { return window.location.hostname.includes('netflix.com'); }
    function isCrunchyroll() { return window.location.hostname.includes('crunchyroll.com'); }
    function isHboMax()      { return window.location.hostname.includes('hbomax') || window.location.hostname.includes('max.com'); }
    function isHiDive()      { return window.location.hostname.includes('hidive.com'); }
    function isDisney()      { return window.location.hostname.includes('disneyplus.com'); }

    // ============================================================
    // HIDIVE
    // ============================================================
    function blockHiDiveActions() {
        if (!isHiDive()) return;

        const SIGNOUT_PATH = /^(?:\/(?:oidc|oauth|auth)?\/?)?(logout|signout|sign-out|log-out|cerrar-sesion|cerrar-sesi%C3%B3n|salir|desconectar|deconectar|abmelden|se-deconnecter|deconnecter|uitloggen)[\/?#]?$/i;
        const PROFILE_PATH = /^\/(profile|perfil)(?:es|s)?(?:-profiles|-profile)?[\/?#]?$/i;

        const SIGNOUT_TEXT = /\b(log ?out|sign ?out|cerrar sesi[oó]n|salir|desconectar|deconectar|abmelden|se d[eé]connecter|d[eé]connecter|uitloggen)\b/i;
        const PROFILE_TEXT = /\b(edit profile|manage profiles?|switch profile|my profiles?|editar perfil|gestionar perfiles?|administrar perfiles?|mis perfiles|mein profil|meine profile|ver profil|mes profils)\b/i;

        const blockEl = (el, attr) => { el.setAttribute(attr, 'true'); };

        const blockedTarget = (node) => {
            let el = node, depth = 0;
            while (el && el.nodeType === 1 && depth < 6) {
                if (el.hasAttribute && el.hasAttribute('data-hidive-blocked')) return el;
                const label = el.getAttribute && el.getAttribute('data-label');
                if (label && (SIGNOUT_TEXT.test(label) || PROFILE_TEXT.test(label))) return el;
                el = el.parentElement;
                depth++;
            }
            return null;
        };

        const killEvent = (ev) => {
            const target = blockedTarget(ev.target);
            if (!target) return;
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (target.tagName === 'A' && target.hasAttribute('href')) {
                target.setAttribute('href', 'javascript:void(0)');
            }
        };

        if (!window.__premiumIdHiDiveGuard) {
            window.__premiumIdHiDiveGuard = true;
            ['pointerdown', 'mousedown', 'mouseup', 'click', 'auxclick', 'dblclick'].forEach(t => {
                window.addEventListener(t, killEvent, true);
            });
            window.addEventListener('keydown', (ev) => {
                if (ev.key !== 'Enter' && ev.key !== ' ') return;
                if (blockedTarget(document.activeElement)) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    ev.stopImmediatePropagation();
                }
            }, true);
        }

        document.querySelectorAll('a, button').forEach(el => {
            if (el.hasAttribute('data-hidive-blocked')) return;
            const href = el.getAttribute('href') || '';
            const cls = el.getAttribute('class') || '';
            const testId = el.getAttribute('data-test-id') || el.getAttribute('data-testid') || '';
            const ariaLabel = el.getAttribute('aria-label') || '';
            const title = el.getAttribute('title') || '';

            let path = '';
            if (href) { try { path = new URL(href, location.origin).pathname; } catch (e) { path = href; } }

            const hayPath = !!path && path !== '/';
            const classSignOut = /\blogout-btn\b|\bsign-?out-btn\b/i.test(cls);
            const testSignOut = /logout|sign-?out/i.test(testId);
            const dataLabel = el.getAttribute('data-label') || '';
            const innerLabel = el.querySelector?.('[data-label]')?.getAttribute('data-label') || '';
            const txt = `${el.textContent || ''} ${ariaLabel} ${title} ${dataLabel} ${innerLabel}`;

            if ((hayPath && SIGNOUT_PATH.test(path)) || classSignOut || testSignOut || SIGNOUT_TEXT.test(txt)) {
                blockEl(el, 'data-hidive-blocked');
                return;
            }
            if ((hayPath && PROFILE_PATH.test(path)) || PROFILE_TEXT.test(txt)) {
                blockEl(el, 'data-hidive-blocked');
            }
        });
    }

    // ============================================================
    // DISNEY+ — CAPA 1: bloquear botón de perfil por posición
    // ============================================================
    function blockDisneyProfileButton() {
        if (!isDisney()) return;
        const vw = window.innerWidth;

        document.querySelectorAll('button, [role="button"], a, [tabindex]:not([tabindex="-1"])').forEach(el => {
            if (el.hasAttribute('data-disney-profile-blocked')) return;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            if (rect.width > 100 || rect.height > 100) return;

            const inTopRight = (rect.right > vw - 280) && (rect.top < 130) && (rect.bottom > 0);
            if (!inTopRight) return;

            const hasImg = !!el.querySelector('img');
            let hasBg = false;
            if (!hasImg) {
                const kids = [el, ...el.querySelectorAll('div, span')];
                hasBg = kids.some(d => {
                    try {
                        const bg = getComputedStyle(d).backgroundImage;
                        return bg && bg !== 'none' && bg.includes('url(');
                    } catch (e) { return false; }
                });
            }

            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const looksLikeAccount = /cuenta|perfil|account|profile|avatar|user|usuario|men[uú]/i.test(aria);

            if (!hasImg && !hasBg && !looksLikeAccount) return;

            el.setAttribute('data-disney-profile-blocked', 'true');

            const kill = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                return false;
            };

            ['pointerdown', 'mousedown', 'mouseup', 'click', 'auxclick', 'dblclick', 'touchstart', 'touchend']
                .forEach(t => el.addEventListener(t, kill, true));
        });
    }

    // ============================================================
    // DISNEY+ — CAPA 2: ocultar/bloquear items del menú si se abre
    // ============================================================
    function blockDisneyMenuItems() {
        if (!isDisney()) return;

        const BLOCKED_TEXT = /\b(cerrar sesi[oó]n|log ?out|sign ?out|salir|desconectar|cerrar|cuenta|account|perfil|profile|perfiles|profiles|editar perfil|edit profile|gestionar perfiles|manage profiles|cambiar perfil|switch profile|mi cuenta|my account|suscripci[oó]n|subscription|configuraci[oó]n|settings|ajustes|ayuda|help|privacidad|privacy|dispositivos|devices|idioma|language)\b/i;

        const menuItems = document.querySelectorAll(
            '[role="menuitem"], [role="menu"] a, [role="menu"] button, [role="menu"] [role="menuitem"], ' +
            '[role="dialog"] a, [role="dialog"] button, [role="dialog"] [role="menuitem"], ' +
            '[class*="dropdown"] a, [class*="dropdown"] button, [class*="menu"] a, [class*="menu"] button'
        );

        menuItems.forEach(el => {
            if (el.hasAttribute('data-disney-menu-blocked')) return;
            const txt = (el.textContent || '').trim();
            if (!txt || txt.length > 60) return;

            const aria = (el.getAttribute('aria-label') || '').trim();
            const combined = txt + ' ' + aria;
            if (!BLOCKED_TEXT.test(combined)) return;

            el.setAttribute('data-disney-menu-blocked', 'true');

            const kill = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                return false;
            };

            ['pointerdown', 'mousedown', 'mouseup', 'click', 'auxclick', 'dblclick', 'touchstart', 'touchend']
                .forEach(t => el.addEventListener(t, kill, true));

            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
        });
    }

    // ============================================================
    // DISNEY+ — CAPA 3: ocultar el nombre del perfil
    // ============================================================
    function hideDisneyProfileName() {
        if (!isDisney()) return;

        document.querySelectorAll(
            '[data-testid*="profile-name" i],[data-testid*="profileName" i],' +
            '[data-testid*="account-name" i],[data-testid*="accountName" i],' +
            '[data-testid*="user-name" i],[data-testid*="userName" i],' +
            '[data-testid*="display-name" i],[data-testid*="displayName" i]'
        ).forEach(el => el.style.setProperty('display', 'none', 'important'));

        const GENERIC_ALT = /^(avatar|profile|perfil|user|usuario|imagen|image|foto|photo|icon|icono|logo|banner|poster|cover|thumbnail|default|placeholder|disney|disney\+|marvel|star|pixar|national geographic|${.*}|\{\{.*\}\})$/i;

        document.querySelectorAll('img[alt]').forEach(img => {
            const alt = (img.getAttribute('alt') || '').trim();
            if (!alt || alt.length < 2 || alt.length > 50) return;
            if (GENERIC_ALT.test(alt)) return;

            let node = img;
            let level = 0;
            while (node && level < 6) {
                node.querySelectorAll?.('span, p, div, a, button').forEach(el => {
                    if (el === img) return;
                    if (el.querySelector('img')) return;
                    const txt = (el.textContent || '').trim();
                    if (txt !== alt) return;
                    if (el.children.length > 3) return;
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                    el.style.setProperty('opacity', '0', 'important');
                    el.style.setProperty('width', '0', 'important');
                    el.style.setProperty('height', '0', 'important');
                    el.style.setProperty('overflow', 'hidden', 'important');
                    el.style.setProperty('pointer-events', 'none', 'important');
                });
                node = node.parentElement;
                level++;
            }
        });
    }

    // ============================================================
    // DISNEY+ — CAPA 4: bloquear "Cerrar sesión" en cualquier parte
    // ============================================================
    function blockDisneyActions() {
        if (!isDisney()) return;

        const SIGNOUT_PATH = /^\/(?:[a-z-]+\/)?(logout|signout|sign-out|log-out|cerrar-sesion|cerrar-sesi%C3%B3n|salir|desconectar|abmelden|se-deconnecter|d[eé]connecter|uitloggen)[\/?#]?$/i;
        const SIGNOUT_TEXT = /\b(log ?out|sign ?out|cerrar sesi[oó]n|salir|desconectar|deconectar|abmelden|se d[eé]connecter|d[eé]connecter|uitloggen)\b/i;

        const blockedTarget = (node) => {
            let el = node, depth = 0;
            while (el && el.nodeType === 1 && depth < 8) {
                if (el.hasAttribute && el.hasAttribute('data-disney-blocked')) return el;
                el = el.parentElement;
                depth++;
            }
            return null;
        };

        const killEvent = (ev) => {
            const target = blockedTarget(ev.target);
            if (!target) return;
            ev.preventDefault();
            ev.stopPropagation();
            ev.stopImmediatePropagation();
            if (target.tagName === 'A' && target.hasAttribute('href')) {
                target.setAttribute('href', 'javascript:void(0)');
            }
        };

        if (!window.__premiumIdDisneyGuard) {
            window.__premiumIdDisneyGuard = true;
            ['pointerdown', 'mousedown', 'mouseup', 'click', 'auxclick', 'dblclick'].forEach(t => {
                window.addEventListener(t, killEvent, true);
            });
            window.addEventListener('keydown', (ev) => {
                if (ev.key !== 'Enter' && ev.key !== ' ') return;
                if (blockedTarget(document.activeElement)) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    ev.stopImmediatePropagation();
                }
            }, true);
        }

        document.querySelectorAll('a, button, [role="menuitem"], [role="link"]').forEach(el => {
            if (el.hasAttribute('data-disney-blocked')) return;
            const href = el.getAttribute('href') || '';
            const ariaLabel = el.getAttribute('aria-label') || '';
            const title = el.getAttribute('title') || '';
            const testId = el.getAttribute('data-testid') || el.getAttribute('data-test-id') || '';

            let path = '';
            if (href) { try { path = new URL(href, location.origin).pathname; } catch (e) { path = href; } }

            const txt = `${el.textContent || ''} ${ariaLabel} ${title} ${testId}`;
            if ((path && SIGNOUT_PATH.test(path)) || SIGNOUT_TEXT.test(txt)) {
                el.setAttribute('data-disney-blocked', 'true');
            }
        });
    }

    function injectDisneyCSS() {
        if (!isDisney()) return;
        if (document.getElementById('premium-id-disney-hide-profile')) return;

        const style = document.createElement('style');
        style.id = 'premium-id-disney-hide-profile';
        style.textContent = `
            [data-testid*="profile-name" i],
            [data-testid*="profileName" i],
            [data-testid*="account-name" i],
            [data-testid*="accountName" i],
            [data-testid*="user-name" i],
            [data-testid*="userName" i],
            [data-testid*="display-name" i],
            [data-testid*="displayName" i] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    // ============================================================
    // 🔴 WATCHDOG DISNEY+ — CIERRA SESIÓN AL DESACTIVAR LA EXTENSIÓN
    // ============================================================
    function installDisneyKillSwitch() {
        if (!isDisney()) return;
        if (window.__premiumIdDisneyKillSwitch) return;
        window.__premiumIdDisneyKillSwitch = true;

        let killed = false;

        function isExtensionDead() {
            // MV3: cuando la extensión se desactiva/desinstala,
            // chrome.runtime sigue existiendo pero chrome.runtime.id
            // pasa a ser undefined.
            try {
                return !chrome || !chrome.runtime || !chrome.runtime.id;
            } catch (e) {
                return true;
            }
        }

        function nukeSessionSync() {
            // Borrado SÍNCRONO: válido para beforeunload
            try {
                const cookies = document.cookie.split(";");
                for (let c of cookies) {
                    const name = c.split("=")[0].trim();
                    if (!name) continue;
                    const exp = "expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    document.cookie = `${name}=; ${exp}; path=/`;
                    document.cookie = `${name}=; ${exp}; path=/; domain=.disneyplus.com`;
                    document.cookie = `${name}=; ${exp}; path=/; domain=.bamgrid.com`;
                    document.cookie = `${name}=; ${exp}; path=/; domain=${location.hostname}`;
                }
            } catch (e) {}
            try { localStorage.clear(); } catch (e) {}
            try { sessionStorage.clear(); } catch (e) {}
        }

        function nukeSession() {
            if (killed) return;
            killed = true;

            nukeSessionSync();

            // IndexedDB (async, no crítico para el logout)
            try {
                if (indexedDB.databases) {
                    indexedDB.databases().then(dbs => {
                        for (const db of dbs) {
                            try { indexedDB.deleteDatabase(db.name); } catch (e) {}
                        }
                    }).catch(() => {});
                }
            } catch (e) {}

            // Intento adicional: borrar también vía chrome.cookies (por si
            // la extensión aún responde aunque esté en proceso de morir)
            try {
                if (chrome?.cookies?.getAll) {
                    chrome.cookies.getAll({ domain: '.disneyplus.com' }, (cks) => {
                        (cks || []).forEach(ck => {
                            try {
                                chrome.cookies.remove({
                                    url: `https://${ck.domain.replace(/^\./, '')}${ck.path}`,
                                    name: ck.name
                                }, () => { void chrome.runtime.lastError; });
                            } catch (e) {}
                        });
                    });
                }
            } catch (e) {}

            // Redirigir a login
            try {
                window.location.replace('https://www.disneyplus.com/login');
            } catch (e) {}
        }

        // ---------------------------------------------------------
        // Capa 1: puerto con el background (onDisconnect inmediato)
        // ---------------------------------------------------------
        try {
            const port = chrome.runtime.connect({ name: 'disney-watchdog' });
            port.onDisconnect.addListener(() => {
                // Pequeño delay por si es solo un reload del SW
                setTimeout(() => {
                    if (isExtensionDead()) nukeSession();
                }, 400);
            });
        } catch (e) {
            // Si ya no se puede conectar → extensión muerta
            nukeSession();
            return;
        }

        // ---------------------------------------------------------
        // Capa 2: polling por si el puerto no se cierra bien
        // ---------------------------------------------------------
        setInterval(() => {
            if (killed) return;
            if (isExtensionDead()) {
                nukeSession();
                return;
            }
            // Ping opcional al SW para mantenerlo vivo / detectar errores
            try {
                chrome.runtime.sendMessage({ action: 'heartbeat' }, () => {
                    void chrome.runtime.lastError; // ignorar
                });
            } catch (e) {
                nukeSession();
            }
        }, 2500);

        // ---------------------------------------------------------
        // Capa 3: beforeunload (desactivar + recargar rápido)
        // ---------------------------------------------------------
        window.addEventListener('beforeunload', () => {
            if (isExtensionDead()) {
                nukeSessionSync();
            }
        });

        // ---------------------------------------------------------
        // Capa 4: pagehide (más fiable que beforeunload en móvil/bfcache)
        // ---------------------------------------------------------
        window.addEventListener('pagehide', () => {
            if (isExtensionDead()) {
                nukeSessionSync();
            }
        });
    }

    // ============================================================
    // WATERMARK
    // ============================================================
    let netflixRedirected = false;
    let watermarkAdded = false;

    function addWatermark() {
        if (watermarkAdded) return;
        if (!document.body) { setTimeout(addWatermark, 500); return; }

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
                    if (chrome.runtime.lastError.message.includes('context invalidated')) extensionAlive = false;
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

        if (url.includes('login')) { netflixRedirected = true; return; }

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
            safeSendMessage({ action: 'session_failed', platform: getPlatformKey() });
            clearCookies();
            setTimeout(() => { window.location.href = platform.loginUrl; }, 500);
        }
    }

    function clearCookies() {
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const name = cookie.split("=")[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        }
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
    }

    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!extensionAlive) { sendResponse({ error: 'context_invalidated' }); return true; }
            if (request.action === 'heartbeat') sendResponse({ received: true });
            if (request.action === 'reset_netflix_redirect') { netflixRedirected = false; sendResponse({ reset: true }); }
            if (request.action === 'check_session_validity') {
                setTimeout(() => detectInvalidSession(), 2000);
                sendResponse({ checking: true });
            }
            return true;
        });
    } catch (e) { extensionAlive = false; }

    function blockSignOutClick() {
        if (!isNetflix()) return;

        document.querySelectorAll('a, button').forEach(el => {
            if (el.hasAttribute('data-signout-blocked')) return;

            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            const href = el.getAttribute('href')?.toLowerCase() || '';

            const isSignOut =
                text.includes('cerrar sesión') ||
                text.includes('cierra sesión') ||
                text.trim() === 'sign out' ||
                text.trim() === 'logout' ||
                ariaLabel.includes('cerrar sesión') ||
                ariaLabel.includes('sign out') ||
                ariaLabel.includes('logout') ||
                href.includes('logout') ||
                href.includes('signout');

            if (isSignOut) {
                el.setAttribute('data-signout-blocked', 'true');
                el.addEventListener('click', (ev) => {
                    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); return false;
                }, true);
                el.addEventListener('mousedown', (ev) => {
                    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
                }, true);
                el.addEventListener('pointerdown', (ev) => {
                    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
                }, true);
            }
        });
    }

    let languageStyleInserted = false;

    function unblockLanguageSelector() {
        if (isCrunchyroll()) return;
        if (isHboMax()) return;
        if (isHiDive()) return;
        if (isDisney()) return;

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

        document.querySelectorAll(
            '[data-testid="audio-track-selector"], ' +
            '[data-testid="subtitle-track-selector"], ' +
            '[aria-label*="idioma" i], ' +
            '[aria-label*="language" i], ' +
            '.language-selector, .audio-selector, .subtitle-selector'
        ).forEach(el => {
            if (el.hasAttribute('disabled')) el.removeAttribute('disabled');
            if (el.getAttribute('aria-disabled') === 'true') el.removeAttribute('aria-disabled');
        });
    }

    function resetRedirectFlag() {
        if (window.location.href.includes('/browse')) netflixRedirected = false;
    }

    function init() {
        addWatermark();

        if (isNetflix()) {
            resetRedirectFlag();
            setInterval(blockSignOutClick, 2000);
            blockSignOutClick();
            const observer = new MutationObserver(() => blockSignOutClick());
            if (document.body) observer.observe(document.body, { childList: true, subtree: true });
            window.addEventListener('scroll', () => blockSignOutClick(), { passive: true });
            setInterval(detectInvalidSession, 5000);
            window.addEventListener('load', () => {
                resetRedirectFlag();
                setTimeout(() => detectInvalidSession(), 1500);
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

        if (isHiDive()) {
            blockHiDiveActions();
            setInterval(blockHiDiveActions, 1500);
            const hidiveObserver = new MutationObserver(() => blockHiDiveActions());
            if (document.body) hidiveObserver.observe(document.body, { childList: true, subtree: true });
            window.addEventListener('scroll', () => blockHiDiveActions(), { passive: true });
        }

        // Disney+ — 4 capas + watchdog
        if (isDisney()) {
            injectDisneyCSS();

            // 🔴 Instalar watchdog lo ANTES posible
            installDisneyKillSwitch();

            const applyDisney = () => {
                blockDisneyProfileButton();
                blockDisneyMenuItems();
                hideDisneyProfileName();
                blockDisneyActions();
            };

            applyDisney();

            let ticks = 0;
            const quick = setInterval(() => {
                applyDisney();
                if (++ticks > 40) clearInterval(quick);
            }, 250);

            setInterval(applyDisney, 800);

            const disneyObserver = new MutationObserver(() => applyDisney());
            if (document.body) {
                disneyObserver.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class', 'style', 'aria-expanded', 'aria-hidden']
                });
            }

            window.addEventListener('scroll', applyDisney, { passive: true });
            window.addEventListener('focus', applyDisney);
            window.addEventListener('resize', applyDisney);
        }

        if (!isCrunchyroll() && !isHboMax() && !isHiDive() && !isDisney()) {
            unblockLanguageSelector();
            setInterval(unblockLanguageSelector, 3000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🔥 PREMIUM ID - CONTENT v6.9 (Netflix | HiDive | Disney+ + watchdog)');
})();