// PREMIUM ID - Content Script (con Shadow DOM para Prime Video)

(function() {
    'use strict';
    
    let lastHeartbeat = Date.now();
    let sessionClosed = false;
    let watermarkAdded = false;
    let sessionChecked = false;
    let extensionAlive = true;
    let shadowHost = null;
    
    const platformConfig = {
        'netflix.com': { color: '#E50914', text: 'Netflix', loginUrl: 'https://www.netflix.com/login', loginIndicators: ['signin', 'login'] },
        'crunchyroll.com': { color: '#F47521', text: 'Crunchyroll', loginUrl: 'https://www.crunchyroll.com/login', loginIndicators: ['login', 'signin'] },
        'primevideo.com': { color: '#00A8E1', text: 'Prime Video', loginUrl: 'https://www.primevideo.com/auth', loginIndicators: ['signin', 'login'] },
        'amazon.com': { color: '#00A8E1', text: 'Prime Video', loginUrl: 'https://www.primevideo.com/auth', loginIndicators: ['signin', 'login'] },
        'paramountplus.com': { color: '#0066FF', text: 'Paramount+', loginUrl: 'https://www.paramountplus.com/login', loginIndicators: ['login', 'signin'] },
        'viki.com': { color: '#9B59B6', text: 'Rakuten Viki', loginUrl: 'https://www.viki.com/login', loginIndicators: ['login', 'signin'] },
        'atresplayer.com': { color: '#FF4D4D', text: 'AtresPlayer', loginUrl: 'https://www.atresplayer.com/iniciar-sesion', loginIndicators: ['iniciar-sesion', 'login'] }
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
        return null;
    }
    
    function isPrimeVideo() {
        const hostname = window.location.hostname;
        return hostname.includes('primevideo.com') || hostname.includes('amazon.com');
    }
    
    // ========== MARCA DE AGUA CON SHADOW DOM (para Prime Video) ==========
    function addWatermark() {
        if (watermarkAdded) return;
        if (!document.body) {
            setTimeout(addWatermark, 500);
            return;
        }
        
        watermarkAdded = true;
        const platform = getCurrentPlatform();
        const brandColor = platform.color;
        
        // Si es Prime Video, usar Shadow DOM
        if (isPrimeVideo()) {
            // Crear un contenedor que no sea fácilmente detectable
            shadowHost = document.createElement('div');
            shadowHost.id = 'premium-id-shadow-host';
            shadowHost.style.cssText = `
                position: fixed !important;
                bottom: 0 !important;
                left: 0 !important;
                width: auto !important;
                height: auto !important;
                z-index: 2147483647 !important;
                pointer-events: none !important;
                background: transparent !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
            `;
            
            // Adjuntar Shadow DOM
            const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
            
            // Crear el enlace dentro del Shadow DOM
            const watermark = document.createElement('a');
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
                text-decoration: none !important;
                letter-spacing: 0.5px !important;
                border: 1px solid ${brandColor} !important;
                transition: all 0.2s ease !important;
                cursor: pointer !important;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3) !important;
                pointer-events: auto !important;
                display: block !important;
                z-index: 2147483647 !important;
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
            
            shadowRoot.appendChild(watermark);
            document.body.appendChild(shadowHost);
            
            // Reintentar si el Shadow DOM es eliminado
            const observer = new MutationObserver((mutations) => {
                if (!document.body.contains(shadowHost)) {
                    document.body.appendChild(shadowHost);
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            
        } else {
            // Para otras plataformas, método normal
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
    }
    
    // ========== ENVIAR MENSAJE SEGURO ==========
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
        } catch(e) {
            extensionAlive = false;
            if (callback) callback(null);
        }
    }
    
    // ========== DETECTAR SESIÓN INVÁLIDA ==========
    function detectInvalidSession() {
        if (sessionChecked) return;
        if (!extensionAlive) return;
        
        const platform = getCurrentPlatform();
        const url = window.location.href.toLowerCase();
        const title = document.title?.toLowerCase() || '';
        const body = document.body?.innerText?.toLowerCase() || '';
        
        const isLoginPage = platform.loginIndicators.some(indicator => 
            url.includes(indicator) || title.includes(indicator) || body.includes(indicator)
        );
        
        const expiredIndicators = ['session expired', 'sesión expirada', 'sign in again', 'inicia sesión nuevamente', 'logged out', 'cerraste sesión'];
        const isExpired = expiredIndicators.some(indicator => body.includes(indicator) || title.includes(indicator));
        
        if (isLoginPage || isExpired) {
            sessionChecked = true;
            
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
                <p style="color: #888; font-size: 13px;">La sesión de ${platform.text} ya no es válida.</p>
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
        } catch(e) {}
    }
    
    // ========== RECIBIR MENSAJES ==========
    try {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (!extensionAlive) {
                sendResponse({ error: 'context_invalidated' });
                return true;
            }
            
            if (request.action === 'heartbeat') {
                lastHeartbeat = Date.now();
                if (sessionClosed) {
                    sessionClosed = false;
                    const overlay = document.getElementById('premium-id-overlay');
                    if (overlay) overlay.remove();
                }
                sendResponse({ received: true });
            }
            
            if (request.action === 'kill_session') {
                killSession();
                sendResponse({ killed: true });
            }
            
            if (request.action === 'check_session_validity') {
                setTimeout(() => {
                    detectInvalidSession();
                }, 2000);
                sendResponse({ checking: true });
            }
            
            return true;
        });
    } catch(e) {
        extensionAlive = false;
    }
    
    // ========== VERIFICAR HEARTBEAT ==========
    setInterval(() => {
        if (sessionClosed) return;
        if (!extensionAlive) return;
        if (Date.now() - lastHeartbeat > 30000) {
            killSession();
        }
    }, 5000);
    
    // ========== CERRAR SESIÓN ==========
    function killSession() {
        if (sessionClosed) return;
        sessionClosed = true;
        
        const platform = getCurrentPlatform();
        
        const overlay = document.createElement('div');
        overlay.id = 'premium-id-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.96);
            z-index: 2147483646;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        overlay.innerHTML = `
            <div style="text-align: center; padding: 32px; background: #0a0a0a; border-radius: 24px; border: 1px solid rgba(244,117,33,0.2);">
                <div style="width: 56px; height: 56px; background: rgba(244,117,33,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                    <span style="font-size: 28px;">⚠️</span>
                </div>
                <h3 style="color: #F47521; margin-bottom: 12px; font-weight: 500;">Extensión desactivada</h3>
                <p style="color: #888; font-size: 13px; margin-bottom: 20px;">La sesión se ha cerrado en este navegador por seguridad.</p>
                <a href="https://t.me/cuentaspremiumid" target="_blank" style="color: #F47521; text-decoration: none; font-size: 13px;">📱 Unirse al grupo</a>
            </div>
        `;
        document.body.appendChild(overlay);
        
        const cookies = document.cookie.split(";");
        for (let cookie of cookies) {
            const name = cookie.split("=")[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
        
        try {
            localStorage.clear();
            sessionStorage.clear();
        } catch(e) {}
        
        setTimeout(() => {
            window.location.href = platform.loginUrl;
        }, 2000);
    }
    
    // ========== BLOQUEAR NAVEGACIÓN ==========
    function blockNavigation() {
        if (sessionClosed) return;
        
        const hostname = window.location.hostname;
        const path = window.location.pathname;
        const url = window.location.href;
        
        if (hostname.includes('netflix.com')) {
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
        
        if (hostname.includes('crunchyroll.com')) {
            if (path.includes('/profiles/manage') || path.includes('/activate') || path.includes('/account') || path.includes('/settings') || path.includes('/preferences') || path.includes('logout')) {
                window.location.replace('/es-es');
                return;
            }
        }
        
        if (hostname.includes('primevideo.com') || hostname.includes('amazon.com')) {
            const blockedPrimePaths = ['logout', 'sign-out', 'signout', 'account', 'your-account', 'your_account', 'settings', 'preferences', 'manageprofiles', 'manage-profiles', 'profiles', 'help', 'contact-us', 'devices', 'your-devices', 'marketplace', 'subscriptions', 'payment', 'address'];
            const shouldBlock = blockedPrimePaths.some(blocked => path.toLowerCase().includes(blocked) || url.toLowerCase().includes(blocked));
            if (shouldBlock) {
                window.location.replace('https://www.primevideo.com');
                return;
            }
        }
        
        if (hostname.includes('paramountplus.com') && path.includes('logout')) {
            window.location.replace('https://www.paramountplus.com');
            return;
        }
        
        if (hostname.includes('viki.com') && path.includes('logout')) {
            window.location.replace('https://www.viki.com');
            return;
        }
        
        if (hostname.includes('atresplayer.com') && path.includes('logout')) {
            window.location.replace('https://www.atresplayer.com');
            return;
        }
    }
    
    // ========== BLOQUEAR BOTONES PELIGROSOS ==========
    function blockDangerousButtons() {
        if (sessionClosed) return;
        
        const hostname = window.location.hostname;
        
        if (hostname.includes('netflix.com')) {
            const allElements = document.querySelectorAll('a, button');
            allElements.forEach(el => {
                const text = el.textContent?.toLowerCase() || '';
                const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
                if (text.includes('cerrar sesión') || text.includes('sign out') || text.includes('logout') || ariaLabel.includes('cerrar sesión') || ariaLabel.includes('sign out')) {
                    el.style.pointerEvents = 'none';
                    el.style.opacity = '0.6';
                }
                if (text.includes('agregar perfil') || text.includes('add profile') || text === '+' || ariaLabel.includes('agregar perfil') || ariaLabel.includes('add profile')) {
                    el.style.pointerEvents = 'none';
                    el.style.opacity = '0.6';
                }
            });
            const accountLinks = document.querySelectorAll('a[href*="/account"], a[href*="/profiles"], a[href*="/ManageProfiles"]');
            accountLinks.forEach(link => {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.6';
            });
        }
        
        if (hostname.includes('crunchyroll.com')) {
            const logoutButtons = document.querySelectorAll('a[href*="logout"], [data-testid="logout-button"], button[aria-label*="cerrar sesión"]');
            logoutButtons.forEach(btn => { btn.style.pointerEvents = 'none'; btn.style.opacity = '0.6'; });
            const profileButtons = document.querySelectorAll('a[href*="/profiles/manage"], [data-testid="manage-profiles"]');
            profileButtons.forEach(btn => { btn.style.pointerEvents = 'none'; btn.style.opacity = '0.6'; });
            const optionsButtons = document.querySelectorAll('a[href*="/account"], a[href*="/settings"], a[href*="/preferences"], button[aria-label*="opciones" i], button[aria-label*="configuración" i], button[aria-label*="ajustes" i], [data-testid="settings-button"]');
            optionsButtons.forEach(btn => { btn.style.pointerEvents = 'none'; btn.style.opacity = '0.6'; });
        }
        
        if (hostname.includes('primevideo.com') || hostname.includes('amazon.com')) {
            const blockedTexts = ['mi cuenta', 'cuenta', 'account', 'ayuda', 'help', 'cerrar sesión', 'sign out', 'logout', 'editar perfil', 'edit profile', 'configuración', 'settings'];
            const allLinks = document.querySelectorAll('a');
            allLinks.forEach(link => {
                const linkText = (link.innerText || '').toLowerCase();
                const ariaLabel = (link.getAttribute('aria-label') || '').toLowerCase();
                if (blockedTexts.some(t => linkText.includes(t) || ariaLabel.includes(t))) {
                    link.style.pointerEvents = 'none';
                    link.style.opacity = '0.4';
                }
            });
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach(btn => {
                const btnText = (btn.innerText || '').toLowerCase();
                if (blockedTexts.some(t => btnText.includes(t))) {
                    btn.style.pointerEvents = 'none';
                    btn.style.opacity = '0.4';
                }
            });
        }
        
        if (hostname.includes('paramountplus.com')) {
            const blockedSelectors = ['a[href*="logout"]', 'a[href*="account"]', 'a[href*="settings"]', '[aria-label*="cuenta" i]', '[aria-label*="cerrar sesión" i]'];
            blockedSelectors.forEach(selector => { document.querySelectorAll(selector).forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; }); });
        }
        
        if (hostname.includes('viki.com')) {
            const blockedSelectors = ['a[href*="logout"]', 'a[href*="account"]', 'a[href*="settings"]', '.user-menu', '.account-dropdown'];
            blockedSelectors.forEach(selector => { document.querySelectorAll(selector).forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; }); });
        }
        
        if (hostname.includes('atresplayer.com')) {
            const blockedSelectors = ['a[href*="logout"]', 'a[href*="cuenta"]', 'a[href*="account"]', 'button[aria-label*="cerrar sesión" i]', '.user-account', '.profile-menu'];
            blockedSelectors.forEach(selector => { document.querySelectorAll(selector).forEach(el => { el.style.pointerEvents = 'none'; el.style.opacity = '0.6'; }); });
        }
    }
    
    // ========== PERMITIR SELECCIÓN DE PERFILES ==========
    function allowProfileSelection() {
        const hostname = window.location.hostname;
        if (hostname.includes('netflix.com')) {
            document.querySelectorAll('.profile-link, .profile-icon, [data-profile-guid]').forEach(el => {
                if (el.style.pointerEvents === 'none') { el.style.pointerEvents = ''; el.style.opacity = ''; }
            });
        }
        if (hostname.includes('crunchyroll.com')) {
            document.querySelectorAll('[data-testid="profile-selector"], .profile-avatar').forEach(el => {
                if (el.style.pointerEvents === 'none') { el.style.pointerEvents = ''; el.style.opacity = ''; }
            });
        }
    }
    
    // ========== INICIALIZAR ==========
    function init() {
        addWatermark();
        blockNavigation();
        setInterval(blockDangerousButtons, 2000);
        setInterval(allowProfileSelection, 2000);
        blockDangerousButtons();
        allowProfileSelection();
        
        const observer = new MutationObserver(() => {
            blockDangerousButtons();
            allowProfileSelection();
        });
        
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
        
        window.addEventListener('load', () => {
            setTimeout(detectInvalidSession, 1500);
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();