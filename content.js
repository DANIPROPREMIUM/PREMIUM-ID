// PREMIUM ID - Content Script v5.0 (Con todas las protecciones de Netflix)

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

    // ========== DETECTAR SESIÓN INVÁLIDA (SOLO NETFLIX) ==========
    let sessionClosed = false;

    function detectInvalidSession() {
        if (!isNetflix()) return;

        const platform = getCurrentPlatform();
        const url = window.location.href.toLowerCase();
        const title = document.title?.toLowerCase() || '';
        const body = document.body?.innerText?.toLowerCase() || '';

        const isLoginPage = platform.loginIndicators.some(indicator =>
            url.includes(indicator) || title.includes(indicator) || body.includes(indicator)
        );

        const expiredIndicators = [
            'session expired', 'sesión expirada', 'sign in again', 
            'inicia sesión nuevamente', 'logged out', 'cerraste sesión',
            'your session has expired', 'tu sesión ha expirado'
        ];
        const isExpired = expiredIndicators.some(indicator => 
            body.includes(indicator) || title.includes(indicator)
        );

        if (isLoginPage || isExpired) {
            safeSendMessage({
                action: 'session_failed',
                platform: getPlatformKey()
            });

            showSessionClosedOverlay(platform);
            clearCookies();

            setTimeout(() => {
                window.location.href = platform.loginUrl;
            }, 2000);
        }
    }

    function showSessionClosedOverlay(platform) {
        if (document.getElementById('premium-id-session-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'premium-id-session-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 2147483646;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        overlay.innerHTML = `
            <div style="text-align: center; padding: 32px; background: #0a0a0a; border-radius: 24px; border: 1px solid ${platform.color};">
                <div style="width: 56px; height: 56px; background: rgba(244,117,33,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                    <span style="font-size: 28px;">⚠️</span>
                </div>
                <h3 style="color: ${platform.color}; margin-bottom: 12px;">SESIÓN CERRADA</h3>
                <p style="color: #888; font-size: 13px;">La sesión de Netflix ya no es válida.</p>
                <p style="color: #666; font-size: 12px; margin-top: 16px;">Redirigiendo al login...</p>
            </div>
        `;
        document.body.appendChild(overlay);
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
                if (sessionClosed) {
                    sessionClosed = false;
                    const overlay = document.getElementById('premium-id-overlay');
                    if (overlay) overlay.remove();
                }
                sendResponse({ received: true });
            }

            if (request.action === 'kill_session') {
                sendResponse({ killed: false, message: 'Kill session disabled' });
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

    // ========== BLOQUEAR NAVEGACIÓN (SOLO NETFLIX) ==========
    function blockNavigation() {
        if (!isNetflix()) return;

        const path = window.location.pathname;
        const url = window.location.href;

        // Bloquear URLs de TV y activación
        const tvPatterns = ['/tv', '/tv8', '/tv2', '/tv9', '/pair', '/activate', '/device', '/atv', '/tvcode'];
        if (tvPatterns.some(p => path.includes(p) || url.includes(p))) {
            window.location.replace('https://www.netflix.com/browse');
            return;
        }
        
        // Bloquear ajustes y perfiles
        if (path.includes('/account') || path.includes('/profiles') || path.includes('/ManageProfiles') || path.includes('logout')) {
            window.location.replace('https://www.netflix.com/browse');
            return;
        }
    }

    // ========== ANULAR BOTÓN DE CERRAR SESIÓN ==========
    function blockSignOutButtons() {
        if (!isNetflix()) return;

        // Buscar botones de "Cerrar sesión" / "Sign out" por texto
        const allElements = document.querySelectorAll('a, button, span, div');
        allElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            const href = el.getAttribute('href')?.toLowerCase() || '';
            const onClick = el.getAttribute('onclick')?.toLowerCase() || '';
            
            // Detectar "Cerrar sesión" por múltiples formas
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
                // Anular completamente el elemento
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.4';
                el.style.cursor = 'default';
                el.style.userSelect = 'none';
                
                // Si es un enlace, quitar href
                if (el.tagName === 'A') {
                    el.removeAttribute('href');
                    el.style.textDecoration = 'none';
                }
                
                // Si tiene onclick, anularlo
                if (el.hasAttribute('onclick')) {
                    el.setAttribute('onclick', 'return false;');
                }
                
                // Añadir un mensaje de bloqueo
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

        // Buscar botones de agregar perfil
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

    // ========== ANULAR BOTONES DE EDICIÓN DE PERFIL ==========
    function blockProfileEditButtons() {
        if (!isNetflix()) return;

        const editSelectors = [
            '[aria-label*="editar" i]',
            '[aria-label*="edit" i]',
            '[aria-label*="manage" i]',
            '[aria-label*="administrar" i]',
            '[data-uia*="profile-edit"]',
            '[data-uia*="profile-manage"]',
            'a[href*="/profiles/manage"]',
            'a[href*="/ManageProfiles"]'
        ];
        
        editSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.4';
                el.style.cursor = 'default';
                el.style.userSelect = 'none';
                if (el.tagName === 'A') {
                    el.removeAttribute('href');
                }
                if (!el.hasAttribute('data-blocked')) {
                    el.setAttribute('data-blocked', 'true');
                    el.title = '🔒 Bloqueado por PREMIUM ID';
                }
            });
        });
    }

    // ========== PERMITIR SOLO SELECCIÓN DE PERFILES ==========
    function allowProfileSelection() {
        if (!isNetflix()) return;

        // Desbloquear solo la selección de perfiles existentes
        document.querySelectorAll('.profile-link, .profile-icon, [data-profile-guid]').forEach(el => {
            // Restaurar solo si es un perfil existente (no es el botón "+")
            const isAddButton = el.textContent?.includes('+') || 
                               el.getAttribute('aria-label')?.includes('agregar');
            if (!isAddButton) {
                el.style.pointerEvents = '';
                el.style.opacity = '';
                el.style.cursor = '';
                el.style.userSelect = '';
                if (el.tagName === 'A' && el.hasAttribute('href')) {
                    // No modificar el href
                }
            }
        });
    }

    // ========== BLOQUEAR TODOS LOS BOTONES PELIGROSOS ==========
    function blockAllDangerousButtons() {
        if (!isNetflix()) return;

        blockSignOutButtons();
        blockAddProfileButton();
        blockProfileEditButtons();
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

    // ========== INICIALIZAR ==========
    function init() {
        addWatermark();

        if (isNetflix()) {
            // Protecciones de navegación
            blockNavigation();
            
            // Protecciones de botones (ejecutar cada 2 segundos)
            setInterval(blockAllDangerousButtons, 2000);
            blockAllDangerousButtons();
            
            // Detectar sesión expirada
            setInterval(detectInvalidSession, 5000);
            
            // Observar cambios en el DOM para proteger nuevos elementos
            const observer = new MutationObserver(() => {
                blockAllDangerousButtons();
            });
            
            if (document.body) {
                observer.observe(document.body, { childList: true, subtree: true });
            }

            // También al hacer scroll (por si Netflix carga elementos dinámicamente)
            window.addEventListener('scroll', () => {
                blockAllDangerousButtons();
            }, { passive: true });
        }

        // Desbloquear selector de idioma (excepto en Crunchyroll)
        if (!isCrunchyroll()) {
            unblockLanguageSelector();
            setInterval(unblockLanguageSelector, 3000);
        }

        // Detectar sesión al cargar la página
        window.addEventListener('load', () => {
            if (isNetflix()) {
                setTimeout(detectInvalidSession, 1500);
                setTimeout(blockAllDangerousButtons, 2000);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('🔥 PREMIUM ID - CONTENT v5.0 (Todas las protecciones activas)');
})();