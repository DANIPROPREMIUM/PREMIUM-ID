// PREMIUM ID - Content Script v5.0 (Anti-TV/Android exclusivo Netflix)

(function() {
    'use strict';

    // ============================================
    // ANTI-TV/ANDROID — Exclusivo para Netflix
    // ============================================
    function isNetflixAllowed() {
        const ua = navigator.userAgent;
        const tvPatterns = [
            /SmartTV/i, /Smart-TV/i, /SMART_TV/i,
            /Tizen/i, /WebOS/i, /Web0S/i,
            /HbbTV/i, /CrKey/i, /VIDAA/i,
            /Viera/i, /NetCast/i, /NETTV/i,
            /DLNADOC/i, /AppleTV/i, /googletv/i,
            /AndroidTV/i, /Android.*TV/i,
            /Roku/i, /Opera TV/i, /AFT/i
        ];
        const isTV      = tvPatterns.some(p => p.test(ua));
        const isAndroid = /Android/i.test(ua);
        const isIOS     = /iPhone|iPad|iPod/i.test(ua);
        const isWindows = /Windows NT/i.test(ua);
        return isWindows && !isTV && !isAndroid && !isIOS;
    }

    function showNetflixBlockOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'premium-id-device-block';
        overlay.style.cssText = `
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important; height: 100% !important;
            background: rgba(0,0,0,0.97) !important;
            z-index: 2147483647 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        `;
        overlay.innerHTML = `
            <div style="text-align:center;padding:36px 28px;background:#0a0a0a;
                        border-radius:24px;border:1px solid #ff4444;max-width:320px;">
                <div style="font-size:52px;margin-bottom:18px;">🚫</div>
                <h2 style="color:#E50914;font-size:16px;font-weight:800;
                           letter-spacing:1px;margin:0 0 12px;text-transform:uppercase;">
                    Acceso No Permitido
                </h2>
                <p style="color:#aaa;font-size:13px;line-height:1.6;margin:0 0 20px;">
                    Netflix solo está disponible desde<br>
                    <strong style="color:#D4AF37">navegadores de Windows</strong>.
                </p>
                <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;font-weight:600;">
                    <div style="background:rgba(255,60,60,0.1);border-radius:10px;
                                padding:8px 14px;color:#ff6666;">
                        ❌ TV y Android TV — No permitido
                    </div>
                    <div style="background:rgba(255,60,60,0.1);border-radius:10px;
                                padding:8px 14px;color:#ff6666;">
                        ❌ Android / iOS — No permitido
                    </div>
                    <div style="background:rgba(212,175,55,0.1);border-radius:10px;
                                padding:8px 14px;color:#D4AF37;">
                        ✅ Chrome / Edge en Windows — Permitido
                    </div>
                </div>
            </div>
        `;

        const inject = () => { if (document.body) document.body.appendChild(overlay); };
        if (document.body) inject(); else document.addEventListener('DOMContentLoaded', inject);
    }

    let lastHeartbeat = Date.now();
    let sessionClosed = false;
    let watermarkAdded = false;
    let extensionAlive = true;
    let shadowHost = null;
    // FIX: bandera para saber si el <style> de idioma ya fue insertado
    let languageStyleInserted = false;
    
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
    
    function isNetflix() {
        return window.location.hostname.includes('netflix.com');
    }
    
    function isCrunchyroll() {
        return window.location.hostname.includes('crunchyroll.com');
    }
    
    function isPrimeVideo() {
        const hostname = window.location.hostname;
        return hostname.includes('primevideo.com') || hostname.includes('amazon.com');
    }
    
    // ========== MARCA DE AGUA ==========
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
    
    // ========== DETECTAR SESIÓN INVÁLIDA (SOLO NETFLIX) ==========
    function detectInvalidSession() {
        if (!isNetflix()) return;
        
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
    } catch(e) {
        extensionAlive = false;
    }
    
    function killSession() {
        console.log('Kill session desactivado - no se cerrará la sesión');
    }
    
    // ========== BLOQUEAR NAVEGACIÓN (SOLO NETFLIX) ==========
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
    
    // ========== BLOQUEAR BOTONES PELIGROSOS (SOLO NETFLIX) ==========
    // FIX: solo aplica el estilo si el elemento no lo tiene ya, evitando repaint innecesario
    function blockDangerousButtons() {
        if (!isNetflix()) return;
        
        const allElements = document.querySelectorAll('a, button');
        allElements.forEach(el => {
            const text = el.textContent?.toLowerCase() || '';
            const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
            const isDangerous = (
                text.includes('cerrar sesión') || text.includes('sign out') || text.includes('logout') ||
                ariaLabel.includes('cerrar sesión') || ariaLabel.includes('sign out') ||
                text.includes('agregar perfil') || text.includes('add profile') || text === '+' ||
                ariaLabel.includes('agregar perfil') || ariaLabel.includes('add profile')
            );
            if (isDangerous) {
                // FIX: solo escribir en el DOM si el valor realmente cambió
                if (el.style.pointerEvents !== 'none') el.style.pointerEvents = 'none';
                if (el.style.opacity !== '0.6') el.style.opacity = '0.6';
            }
        });
        const accountLinks = document.querySelectorAll('a[href*="/account"], a[href*="/profiles"], a[href*="/ManageProfiles"]');
        accountLinks.forEach(link => {
            if (link.style.pointerEvents !== 'none') link.style.pointerEvents = 'none';
            if (link.style.opacity !== '0.6') link.style.opacity = '0.6';
        });
    }
    
    // ========== PERMITIR SELECCIÓN DE PERFILES (SOLO NETFLIX) ==========
    // FIX: solo escribe en el DOM si el valor realmente cambió
    function allowProfileSelection() {
        if (!isNetflix()) return;
        
        document.querySelectorAll('.profile-link, .profile-icon, [data-profile-guid]').forEach(el => {
            if (el.style.pointerEvents === 'none') el.style.pointerEvents = '';
            if (el.style.opacity === '0.6') el.style.opacity = '';
        });
    }
    
    // ========== DESBLOQUEAR CAMBIO DE IDIOMA ==========
    // FIX: el <style> se inserta UNA SOLA VEZ; el interval solo desbloquea atributos en elementos nuevos
    function unblockLanguageSelector() {
        if (isCrunchyroll()) return;
        
        // Insertar el <style> solo si todavía no existe en el documento
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
        
        // Solo quitar atributos HTML que bloqueen elementos (no tocar styles ya correctos)
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
            // FIX: solo tocar el DOM si hay algo que realmente cambiar
            if (el.hasAttribute('disabled')) el.removeAttribute('disabled');
            if (el.getAttribute('aria-disabled') === 'true') el.removeAttribute('aria-disabled');
        });
    }
    
    // ========== INICIALIZAR ==========
    function init() {

        // Anti-TV/Android: bloqueo exclusivo para Netflix
        if (isNetflix() && !isNetflixAllowed()) {
            showNetflixBlockOverlay();
            return;
        }

        addWatermark();
        
        if (isNetflix()) {
            blockNavigation();
            setInterval(blockDangerousButtons, 2000);
            setInterval(allowProfileSelection, 2000);
            blockDangerousButtons();
            allowProfileSelection();
            setInterval(detectInvalidSession, 5000);
        }
        
        if (!isCrunchyroll()) {
            unblockLanguageSelector();
            setInterval(unblockLanguageSelector, 3000);
        }
        
        const observer = new MutationObserver(() => {
            if (isNetflix()) {
                blockDangerousButtons();
                allowProfileSelection();
            }
            if (!isCrunchyroll()) {
                unblockLanguageSelector();
            }
        });
        
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
        
        window.addEventListener('load', () => {
            if (isNetflix()) {
                setTimeout(detectInvalidSession, 1500);
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
