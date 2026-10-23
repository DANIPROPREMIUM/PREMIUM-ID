// PREMIUM ID - Content Script v9.1
// Netflix | HiDive | Disney+ (banner bloqueante + anti-bucle 1 intento + /commerce/account)

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
    // DISNEY+ — Selección de perfil
    // ============================================================
    function isDisneySelectProfile() {
        if (!isDisney()) return false;
        const path = window.location.pathname.toLowerCase();
        return /\/(?:identity\/)?(?:select-profile|selectprofile|profiles?|who-s-watching|whos-watching)(?:\/|$|\?)/i.test(path);
    }

    function isDisneyActivationPage() {
        if (!isDisney()) return false;
        const path = window.location.pathname.toLowerCase();
        return /\/(?:identity\/)?(?:start|begin)\b/.test(path);
    }

    function blockDisneyActivationPage() {
        if (!isDisneyActivationPage()) return;
        window.location.replace('https://www.disneyplus.com/');
    }

    // ============================================================
    // DISNEY+ — Rutas de gestión de perfiles
    // ============================================================
    function isDisneyForbiddenProfilePath() {
        if (!isDisney()) return false;
        const path = window.location.pathname.toLowerCase();
        const prefix = '(?:\\/(?:identity|[a-z]{2}-[a-z]{2}))?';
        const forbidden = '(?:add-profile|select-avatar|edit-profiles?|manage-profiles|profile\\/(?:add|edit|new|avatar)|profiles?\\/(?:add|edit|new))';
        return new RegExp('^' + prefix + '\\/' + forbidden + '\\/?$', 'i').test(path);
    }

    function redirectDisneyForbiddenPaths() {
        if (!isDisneyForbiddenProfilePath()) return;
        window.location.replace('https://www.disneyplus.com/');
    }

    // ============================================================
    // 🆕 v9.1: /get-app con banner bloqueante + anti-bucle 1 intento
    // ============================================================
    const GETAPP_MAX_REDIRECTS = 1;   // 🔧 ahora solo 1 intento
    const GETAPP_RESET_MS = 5000;
    let getAppHandledThisLoad = false;

    function isDisneyGetAppPage() {
        if (!isDisney()) return false;
        const path = window.location.pathname.toLowerCase();
        return /^\/(?:[a-z]{2}-[a-z0-9]{2,4}\/)?get-app(?:\/|$)/i.test(path);
    }

    function getGetAppState() {
        try {
            const raw = sessionStorage.getItem('premiumIdGetAppState');
            if (!raw) return { count: 0, ts: 0 };
            return JSON.parse(raw);
        } catch (e) { return { count: 0, ts: 0 }; }
    }

    function setGetAppState(state) {
        try { sessionStorage.setItem('premiumIdGetAppState', JSON.stringify(state)); } catch (e) {}
    }

    function incGetAppCount() {
        const now = Date.now();
        const s = getGetAppState();
        if (now - s.ts > GETAPP_RESET_MS) s.count = 0;
        s.count++;
        s.ts = now;
        setGetAppState(s);
        return s.count;
    }

    function isDesktopUA() {
        return !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent || '');
    }

    function buildBlocker() {
        if (document.getElementById('premium-id-getapp-blocker')) return;

        // 1) Backdrop que tapa TODA la pantalla y bloquea clics/touch/scroll
        const backdrop = document.createElement('div');
        backdrop.id = 'premium-id-getapp-blocker';
        backdrop.style.cssText = `
            position: fixed !important;
            inset: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0, 0, 0, 0.72) !important;
            z-index: 2147483646 !important;
            pointer-events: auto !important;
            touch-action: none !important;
            cursor: not-allowed !important;
        `;

        // Bloquear eventos en el backdrop
        const kill = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        };
        ['pointerdown','mousedown','mouseup','click','auxclick','dblclick',
         'touchstart','touchend','touchmove','contextmenu'].forEach(t => {
            backdrop.addEventListener(t, kill, { capture: true, passive: false });
        });
        backdrop.addEventListener('wheel', (e) => { e.preventDefault(); }, { capture: true, passive: false });

        // 2) Banner encima del backdrop (también captura eventos)
        const banner = document.createElement('div');
        banner.id = 'premium-id-getapp-banner';
        banner.innerHTML = `
            <div style="font-size:38px;margin-bottom:14px;">📱 ➜ 💻</div>
            <div style="font-size:17px;font-weight:800;margin-bottom:12px;letter-spacing:0.4px;">ACTIVA EL MODO ESCRITORIO</div>
            <div style="font-size:13px;line-height:1.55;opacity:0.95;">
                Abre el menú de Quetta <strong>(⋮)</strong><br>
                y pulsa<br>
                <strong style="background:rgba(255,255,255,0.25);padding:4px 10px;border-radius:8px;display:inline-block;margin-top:10px;font-size:13px;word-break:break-word;">Sitio de escritorio</strong>
            </div>
        `;
        banner.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 2147483647 !important;
            background: rgba(17, 60, 207, 0.97) !important;
            color: #fff !important;
            padding: 30px 36px !important;
            border-radius: 22px !important;
            text-align: center !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
            border: 2px solid #fff !important;
            width: 300px !important;
            max-width: 85vw !important;
            pointer-events: auto !important;
            touch-action: none !important;
            animation: premiumIdPulse 1.6s ease-in-out infinite !important;
        `;
        ['pointerdown','mousedown','mouseup','click','auxclick','dblclick',
         'touchstart','touchend','touchmove','contextmenu'].forEach(t => {
            banner.addEventListener(t, kill, { capture: true, passive: false });
        });

        // Animación
        if (!document.getElementById('premium-id-getapp-style')) {
            const style = document.createElement('style');
            style.id = 'premium-id-getapp-style';
            style.textContent = `
                @keyframes premiumIdPulse {
                    0%, 100% { box-shadow: 0 20px 60px rgba(0,0,0,0.6); }
                    50% { box-shadow: 0 20px 80px rgba(17,60,207,0.85); }
                }
            `;
            (document.head || document.documentElement).appendChild(style);
        }

        document.body.appendChild(backdrop);
        document.body.appendChild(banner);

        try { document.title = '⚠️ Activa modo escritorio en Quetta'; } catch (e) {}

        // Bloquear scroll de la página
        try {
            document.documentElement.style.setProperty('overflow', 'hidden', 'important');
            document.body.style.setProperty('overflow', 'hidden', 'important');
        } catch (e) {}

        // Mantener vivo si Disney re-renderiza
        if (!window.__premiumIdGetAppKeeper) {
            window.__premiumIdGetAppKeeper = setInterval(() => {
                if (!isDisneyGetAppPage() || isDesktopUA()) return;
                if (document.body && !document.getElementById('premium-id-getapp-blocker')) {
                    buildBlocker();
                }
            }, 500);
        }
    }

    function showGetAppBanner() {
        if (!isDisneyGetAppPage()) return;
        if (isDesktopUA()) return;
        if (!document.body) { setTimeout(showGetAppBanner, 150); return; }
        buildBlocker();
    }

    function redirectGetAppPage() {
        if (!isDisneyGetAppPage()) return;

        showGetAppBanner();

        if (getAppHandledThisLoad) return;
        getAppHandledThisLoad = true;

        // Desktop UA: redirigir y no contar
        if (isDesktopUA()) {
            console.log('[Premium ID] Desktop UA en /get-app → redirect a /');
            window.location.replace('https://www.disneyplus.com/');
            return;
        }

        const count = incGetAppCount();

        // 🆕 MAX=1: primer intento redirige, segundo en adelante NO
        if (count > GETAPP_MAX_REDIRECTS) {
            console.log('[Premium ID] Bucle detenido tras ' + count + ' intentos. Esperando modo escritorio.');
            return;
        }

        console.log('[Premium ID] Redirect /get-app → / (intento ' + count + ')');
        window.location.replace('https://www.disneyplus.com/');
    }

    // ============================================================
    // 🆕 v9.1: /account y /commerce/account (con locale, incl. es-419) → /
    // ============================================================
    function isDisneyAccountPage() {
        if (!isDisney()) return false;
        const path = window.location.pathname.toLowerCase();
        // Cubre: /account, /account/x, /es-es/account, /identity/account,
        //        /commerce/account, /es-419/commerce/account, etc.
        return /(?:^|\/)(?:account|commerce\/account)(?:\/|$)/i.test(path);
    }

    function redirectAwayFromAccount() {
        if (!isDisneyAccountPage()) return;
        if (document.querySelector('input[type="password"]')) return;
        console.log('[Premium ID] Redirect account → / (' + window.location.pathname + ')');
        window.location.replace('https://www.disneyplus.com/');
    }

    // ============================================================
    // 🔥 Ejecución temprana
    // ============================================================
    if (isDisney()) {
        redirectGetAppPage();
        redirectAwayFromAccount();
        redirectDisneyForbiddenPaths();

        try {
            const _pushState = history.pushState;
            const _replaceState = history.replaceState;
            history.pushState = function () {
                const r = _pushState.apply(this, arguments);
                redirectGetAppPage();
                redirectAwayFromAccount();
                redirectDisneyForbiddenPaths();
                return r;
            };
            history.replaceState = function () {
                const r = _replaceState.apply(this, arguments);
                redirectGetAppPage();
                redirectAwayFromAccount();
                redirectDisneyForbiddenPaths();
                return r;
            };
            window.addEventListener('popstate', () => {
                redirectGetAppPage();
                redirectAwayFromAccount();
                redirectDisneyForbiddenPaths();
            });
        } catch (e) {}
    }

    // ============================================================
    // DISNEY+ — LIMPIAR /select-profile (solo enlaces legales)
    // ============================================================
    function cleanDisneySelectProfile() {
        if (!isDisney() || !isDisneySelectProfile()) return;

        const KILL_HREFS = /^\/(?:[a-z-]+\/)?(?:legal|terms|privacy|aviso-legal|terminos|privacidad|cookies)(?:[\/?#]|$)/i;
        const KILL_TESTIDS = ['legal-notice', 'legalnotice', 'aviso-legal', 'avisolegal'];

        document.querySelectorAll('a[href], [data-testid]').forEach(el => {
            if (!el.isConnected) return;

            const testId = (el.getAttribute('data-testid') || '').toLowerCase();
            if (KILL_TESTIDS.some(t => testId.includes(t))) { el.remove(); return; }

            if (el.tagName === 'A') {
                const href = el.getAttribute('href') || '';
                if (!href) return;
                try {
                    const path = new URL(href, location.origin).pathname;
                    if (KILL_HREFS.test(path)) { el.remove(); return; }
                } catch (e) {}
            }
        });
    }

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
    // DISNEY+ — Ocultar avatar/botón de cuenta
    // ============================================================
    function blockDisneyProfileButton() {
        if (!isDisney()) return;
        if (isDisneySelectProfile()) return;

        const vw = window.innerWidth;

        document.querySelectorAll('button, [role="button"], a, [tabindex]:not([tabindex="-1"])').forEach(el => {
            if (el.hasAttribute('data-disney-profile-blocked')) return;

            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            if (rect.width > 160 || rect.height > 160) return;

            const inTopRight = (rect.right > vw - 400) && (rect.top < 200);
            if (!inTopRight) return;

            const hasImg = !!el.querySelector('img');
            const aria = (el.getAttribute('aria-label') || '').toLowerCase();
            const looksLikeAccount = /cuenta|perfil|account|profile|avatar|user|usuario|men[uú]/i.test(aria);

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

            if (!hasImg && !hasBg && !looksLikeAccount) return;

            el.setAttribute('data-disney-profile-blocked', 'true');
            el.setAttribute('aria-hidden', 'true');

            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');

            const kill = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                ev.stopImmediatePropagation();
                return false;
            };
            ['pointerdown', 'mousedown', 'mouseup', 'click', 'auxclick', 'dblclick', 'touchstart', 'touchend', 'keydown']
                .forEach(t => el.addEventListener(t, kill, true));
        });
    }

    // ============================================================
    // DISNEY+ — Destruir menú de cuenta
    // ============================================================
    function nukeAccountMenu() {
        if (!isDisney()) return;
        if (isDisneySelectProfile()) return;

        const MENU_SELECTORS = [
            '[role="menu"]',
            '[role="dialog"]',
            '[class*="dropdown" i]',
            '[class*="account-menu" i]',
            '[class*="accountMenu" i]',
            '[class*="profile-menu" i]',
            '[class*="profileMenu" i]',
            '[data-testid*="account-menu" i]',
            '[data-testid*="profile-menu" i]',
            '[data-testid*="dropdown" i]'
        ];

        document.querySelectorAll(MENU_SELECTORS.join(',')).forEach(el => {
            if (el.hasAttribute('data-disney-menu-nuked')) return;
            if (el.querySelector('video')) return;

            const txt = (el.textContent || '').toLowerCase();
            const isAccountMenu = /switch profile|cambiar perfil|edit profile|editar perfil|manage profiles|gestionar perfiles|log ?out|cerrar sesi[oó]n|^account$|^cuenta$|^settings$|^ajustes$/im.test(txt);

            if (!isAccountMenu) return;

            el.setAttribute('data-disney-menu-nuked', 'true');
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
            el.style.setProperty('z-index', '-9999', 'important');
        });
    }

    // ============================================================
    // DISNEY+ — Bloquear "Switch profile"
    // ============================================================
    function blockDisneyMenuItems() {
        if (!isDisney()) return;
        if (isDisneySelectProfile()) return;

        nukeAccountMenu();

        document.querySelectorAll('button, a, [role="menuitem"], [role="button"], [role="link"]').forEach(el => {
            if (el.hasAttribute('data-disney-menu-blocked')) return;

            const txt = (el.textContent || '').trim();
            if (!txt || txt.length > 80) return;

            const aria = (el.getAttribute('aria-label') || '').trim();
            const combined = txt + ' ' + aria;

            if (/switch profile|cambiar perfil|edit profiles?|editar perfiles?|gestionar perfiles|manage profiles|who.?s watching|qui[eé]n est[aá] viendo/i.test(combined)) {
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
                el.style.setProperty('pointer-events', 'none', 'important');
            }
        });
    }

    // ============================================================
    // DISNEY+ — ocultar el nombre del perfil
    // ============================================================
    function hideDisneyProfileName() {
        if (!isDisney()) return;
        if (isDisneySelectProfile()) return;

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
    // DISNEY+ — bloquear "Cerrar sesión"
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

    // ============================================================
    // DISNEY+ — CSS para ocultar nombre de perfil
    // ============================================================
    function injectDisneyCSS() {
        if (!isDisney()) return;
        if (isDisneySelectProfile()) return;
        if (document.getElementById('premium-id-disney-hide-profile')) return;

        const style = document.createElement('style');
        style.id = 'premium-id-disney-hide-profile';
        style.textContent = `
            [data-testid*="profile-name" i]:not(button):not(a):not([role="button"]):not([role="link"]),
            [data-testid*="profileName" i]:not(button):not(a):not([role="button"]):not([role="link"]),
            [data-testid*="account-name" i]:not(button):not(a):not([role="button"]):not([role="link"]),
            [data-testid*="accountName" i]:not(button):not(a):not([role="button"]):not([role="link"]),
            [data-testid*="user-name" i]:not(button):not(a):not([role="button"]):not([role="link"]),
            [data-testid*="userName" i]:not(button):not(a):not([role="button"]):not([role="link"]),
            [data-testid*="display-name" i]:not(button):not(a):not([role="button"]):not([role="link"]),
            [data-testid*="displayName" i]:not(button):not(a):not([role="button"]):not([role="link"]) {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }

    // ============================================================
    // 🔴 WATCHDOG DISNEY+ v5
    // ============================================================
    function installDisneyKillSwitch() {
        if (!isDisney()) return;
        if (window.__premiumIdDisneyKillSwitch) return;
        window.__premiumIdDisneyKillSwitch = true;

        let killed = false;
        let pollInterval = null;

        function isExtensionDead() {
            try {
                return !chrome || !chrome.runtime || !chrome.runtime.id;
            } catch (e) {
                return true;
            }
        }

        function nukeSessionSync() {
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

            try {
                if (indexedDB.databases) {
                    indexedDB.databases().then(dbs => {
                        for (const db of dbs) {
                            try { indexedDB.deleteDatabase(db.name); } catch (e) {}
                        }
                    }).catch(() => {});
                }
            } catch (e) {}

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

            try {
                window.location.replace('https://www.disneyplus.com/login');
            } catch (e) {}
        }

        function startPolling() {
            if (pollInterval) return;
            pollInterval = setInterval(() => {
                if (killed) return;
                if (isExtensionDead()) {
                    nukeSession();
                }
            }, 800);
        }

        startPolling();

        window.addEventListener('focus', () => {
            if (isExtensionDead()) nukeSession();
        });

        window.addEventListener('beforeunload', () => {
            if (isExtensionDead()) nukeSessionSync();
        });

        window.addEventListener('pagehide', () => {
            if (isExtensionDead()) nukeSessionSync();
        });

        window.addEventListener('pageshow', (e) => {
            if (e.persisted) {
                startPolling();
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
        if (isDisney()) {
            blockDisneyActivationPage();
            redirectGetAppPage();
            redirectAwayFromAccount();
            redirectDisneyForbiddenPaths();
            setInterval(blockDisneyActivationPage, 500);
        }

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

        if (isDisney()) {
            injectDisneyCSS();
            installDisneyKillSwitch();

            const applyDisney = () => {
                blockDisneyActivationPage();
                redirectGetAppPage();
                redirectAwayFromAccount();
                redirectDisneyForbiddenPaths();
                cleanDisneySelectProfile();
                blockDisneyActions();

                if (!isDisneySelectProfile()) {
                    blockDisneyProfileButton();
                    blockDisneyMenuItems();
                    hideDisneyProfileName();
                    injectDisneyCSS();
                }
            };

            applyDisney();

            let ticks = 0;
            const quick = setInterval(() => {
                applyDisney();
                if (++ticks > 40) clearInterval(quick);
            }, 250);

            setInterval(applyDisney, 800);

            if (!isDisneySelectProfile()) {
                setInterval(nukeAccountMenu, 200);
            }

            const disneyObserver = new MutationObserver(() => {
                nukeAccountMenu();
                applyDisney();
            });
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

            let lastPath = window.location.pathname;
            setInterval(() => {
                if (window.location.pathname !== lastPath) {
                    lastPath = window.location.pathname;
                    applyDisney();
                }
            }, 500);
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

    console.log('🔥 PREMIUM ID - CONTENT v9.1 (anti-bucle 1 intento + backdrop bloqueante + /commerce/account)');
})();