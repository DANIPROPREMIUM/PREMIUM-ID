// PREMIUM ID - Background v4.0 PÚBLICO (Anti-TV/Android exclusivo Netflix)

// ============================================
// ANTI-TV/ANDROID — Exclusivo para Netflix
// Solo permite Windows (Chrome/Edge/etc.)
// Bloquea: Android, Smart TV, iOS
// ============================================
function isNetflixAllowed() {
    const ua = navigator.userAgent;

    // Patrones de Smart TV / Android TV / dispositivos de streaming
    const tvPatterns = [
        /SmartTV/i, /Smart-TV/i, /SMART_TV/i,
        /Tizen/i,                  // Samsung Smart TV
        /WebOS/i, /Web0S/i,        // LG Smart TV
        /HbbTV/i,                  // TV híbrida europeo
        /CrKey/i,                  // Chromecast
        /VIDAA/i,                  // Hisense TV
        /Viera/i, /NetCast/i,      // Panasonic / LG
        /NETTV/i, /DLNADOC/i,      // Philips TV
        /AppleTV/i,
        /googletv/i, /AndroidTV/i,
        /Android.*TV/i,
        /Roku/i,
        /Opera TV/i,
        /AFT/i                     // Amazon Fire TV
    ];

    const isTV      = tvPatterns.some(p => p.test(ua));
    const isAndroid = /Android/i.test(ua);
    const isIOS     = /iPhone|iPad|iPod/i.test(ua);
    const isWindows = /Windows NT/i.test(ua);

    // Solo pasar si es Windows Y no es TV ni Android ni iOS
    return isWindows && !isTV && !isAndroid && !isIOS;
}

const PLATFORMS = {
    netflix: { name: 'Netflix', domain: '.netflix.com', url: 'https://www.netflix.com/browse', checkUrl: 'https://www.netflix.com/browse' },
    crunchyroll: { name: 'Crunchyroll', domain: '.crunchyroll.com', url: 'https://www.crunchyroll.com', checkUrl: 'https://www.crunchyroll.com' },
    prime: { name: 'Prime Video', domain: '.amazon.com', altDomains: ['.primevideo.com'], url: 'https://www.primevideo.com', checkUrl: 'https://www.primevideo.com' },
    paramount: { name: 'Paramount+', domain: '.paramountplus.com', url: 'https://www.paramountplus.com', checkUrl: 'https://www.paramountplus.com' },
    viki: { name: 'Rakuten Viki', domain: '.viki.com', url: 'https://www.viki.com', checkUrl: 'https://www.viki.com' },
    atresplayer: { name: 'AtresPlayer', domain: '.atresplayer.com', url: 'https://www.atresplayer.com', checkUrl: 'https://www.atresplayer.com' }
};

// ============================================
// VERIFICAR VERSIÓN DEL CÓDIGO
// ============================================
function getCodeVersion(code) {
    if (!code?.startsWith('premium_id:')) return null;
    try {
        const parts = code.split(':');
        if (parts.length < 5) return null;
        const encryptedData = parts.slice(4).join(':');
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        return sessionData.version || 'V1';
    } catch(e) {
        return null;
    }
}

function isCodeCompatible(code) {
    const version = getCodeVersion(code);
    return version === 'V4';
}

// ============================================
// VERIFICAR SESIÓN REAL (con ventana invisible)
// ============================================
async function verifySessionReal(platformKey, encryptedData) {
    let winId = null;
    
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) return { isValid: false, error: 'Plataforma no soportada' };
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        
        if (sessionData.version !== 'V4') {
            return { isValid: false, error: 'Versión incompatible' };
        }
        
        const cookiePairs = sessionData.cookies.split('; ');
        
        for (let cookiePair of cookiePairs) {
            const equalIndex = cookiePair.indexOf('=');
            if (equalIndex === -1) continue;
            
            const name = cookiePair.substring(0, equalIndex);
            const value = cookiePair.substring(equalIndex + 1);
            
            if (!name || !value) continue;
            
            if (platformKey === 'prime') {
                await chrome.cookies.set({
                    url: 'https://www.amazon.com',
                    name: name,
                    value: value,
                    domain: '.amazon.com',
                    path: '/',
                    secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                
                await chrome.cookies.set({
                    url: 'https://www.primevideo.com',
                    name: name,
                    value: value,
                    domain: '.primevideo.com',
                    path: '/',
                    secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                
            } else {
                await chrome.cookies.set({
                    url: platform.url,
                    name: name,
                    value: value,
                    domain: platform.domain,
                    path: '/',
                    secure: true,
                    expirationDate: Date.now() / 1000 + 2592000
                });
            }
        }
        
        const win = await chrome.windows.create({
            url: platform.checkUrl,
            type: 'popup',
            width: 1,
            height: 1,
            left: -10000,
            top: -10000,
            focused: false
        });
        
        winId = win.id;
        const tabId = win.tabs[0].id;
        await new Promise(resolve => setTimeout(resolve, 6000));
        
        const result = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (platformKey) => {
                const url = window.location.href.toLowerCase();
                const body = document.body?.innerText?.toLowerCase() || '';
                const title = document.title?.toLowerCase() || '';
                
                const loginIndicators = {
                    crunchyroll: ['login', 'sign in', 'iniciar sesión', 'signin'],
                    netflix: ['login', 'sign in', 'iniciar sesión'],
                    prime: ['signin', 'login', 'ap/signin', 'auth', 'nonprimehomepage', 'offers/nonprimehomepage', 'plan', 'selectplan', 'force_root', 'offers', 'nonprime'],
                    paramount: ['login', 'sign in'],
                    viki: ['login', 'sign in'],
                    atresplayer: ['login', 'iniciar-sesion', 'identificate', 'entrar', 'signin']
                };
                
                const indicators = loginIndicators[platformKey] || ['login', 'signin'];
                const isLoginPage = indicators.some(i => url.includes(i) || body.includes(i) || title.includes(i));
                
                const expiredIndicators = [
                    'session expired', 'sesión expirada', 'logged out', 'cerraste sesión',
                    'sign in to continue', 'inicia sesión para continuar', 'vuelve a iniciar sesión',
                    'your session has expired', 'tu sesión ha expirado', 'login required'
                ];
                const isExpired = expiredIndicators.some(i => body.includes(i));
                
                // PRIME VIDEO
                if (platformKey === 'prime') {
                    if (url.includes('nonprimehomepage') || url.includes('/offers/') || url.includes('nonprime')) {
                        return { isValid: false, reason: 'Sesión no premium' };
                    }
                    const hasUserMenu = document.querySelector(
                        '[aria-label*="cuenta" i], [aria-label*="account" i], ' +
                        '.nav-account, #nav-link-accountList, ' +
                        '[data-testid="user-menu"], .profile-button, ' +
                        '.nav-user, .nav-avatar'
                    );
                    const isContentPage = url.includes('/watch') || url.includes('/detail') || url.includes('/tv') || url.includes('/video');
                    if (!hasUserMenu && !isContentPage) {
                        return { isValid: false, reason: 'No se detectó sesión activa' };
                    }
                    if (hasUserMenu) {
                        return { isValid: true };
                    }
                }
                
                // ATRESPLAYER - VERIFICACIÓN MEJORADA
                if (platformKey === 'atresplayer') {
                    // Si está en página de login -> sesión inválida
                    if (url.includes('login') || url.includes('iniciar-sesion') || url.includes('identificate') || url.includes('entrar')) {
                        return { isValid: false, reason: 'Página de login detectada' };
                    }
                    
                    // Buscar elementos que indican que el usuario NO está logueado
                    const noUserIndicators = [
                        'iniciar sesión', 'registrarse', 'crear cuenta', 'sign in', 'sign up',
                        'entrar con email', 'entrar con google', '¿no tienes cuenta?'
                    ];
                    const hasNoUserText = noUserIndicators.some(text => body.includes(text));
                    
                    // Buscar elementos que indican que el usuario SÍ está logueado
                    const hasUserAvatar = document.querySelector('[data-testid="user-avatar"], .user-avatar, .avatar, [class*="avatar"], .profile-image');
                    const hasUserName = document.querySelector('[data-testid="user-name"], .user-name, .profile-name, .username');
                    const hasUserMenu = document.querySelector('[class*="user-menu"], [class*="dropdown"], .profile-dropdown');
                    const hasLogout = document.querySelector('[href*="logout"], [class*="logout"], [class*="cerrar-sesion"]');
                    
                    // Caso 1: Hay elementos de usuario logueado -> válido
                    if (hasUserAvatar || hasUserName || hasUserMenu || hasLogout) {
                        return { isValid: true };
                    }
                    
                    // Caso 2: Hay texto de "iniciar sesión" -> inválido
                    if (hasNoUserText || isLoginPage) {
                        return { isValid: false, reason: 'No se detectó sesión activa' };
                    }
                    
                    // Caso 3: Por defecto, si no podemos confirmar, asumimos inválido por seguridad
                    return { isValid: false, reason: 'No se pudo verificar la sesión' };
                }
                
                if (isLoginPage || isExpired) {
                    return { isValid: false, reason: isLoginPage ? 'Página de login' : 'Sesión expirada' };
                }
                
                return { isValid: true };
            },
            args: [platformKey]
        });
        
        const isValid = result[0]?.result?.isValid === true;
        const reason = result[0]?.result?.reason || '';
        
        return { isValid, reason };
        
    } catch(e) {
        return { isValid: false, error: e.message };
    } finally {
        if (winId) {
            try { await chrome.windows.remove(winId); } catch(e) {}
        }
    }
}

// ============================================
// RESTAURAR SESIÓN (solo si es válida)
// ============================================
async function restoreSession(platformKey, encryptedData) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');

        if (platformKey === 'netflix' && !isNetflixAllowed()) {
            throw new Error('NETFLIX BLOQUEADO: Netflix solo está disponible en navegadores de Windows.');
        }
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        
        if (sessionData.version !== 'V4') {
            throw new Error('Código incompatible. Solo compatible con PREMIUM ID V4');
        }
        
        const cookiePairs = sessionData.cookies.split('; ');
        
        for (let cookiePair of cookiePairs) {
            const equalIndex = cookiePair.indexOf('=');
            if (equalIndex === -1) continue;
            
            const name = cookiePair.substring(0, equalIndex);
            const value = cookiePair.substring(equalIndex + 1);
            
            if (!name || !value) continue;
            
            if (platformKey === 'prime') {
                await chrome.cookies.set({
                    url: 'https://www.amazon.com',
                    name: name,
                    value: value,
                    domain: '.amazon.com',
                    path: '/',
                    secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                
                await chrome.cookies.set({
                    url: 'https://www.primevideo.com',
                    name: name,
                    value: value,
                    domain: '.primevideo.com',
                    path: '/',
                    secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                
            } else {
                await chrome.cookies.set({
                    url: platform.url,
                    name: name,
                    value: value,
                    domain: platform.domain,
                    path: '/',
                    secure: true,
                    expirationDate: Date.now() / 1000 + 2592000
                });
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await chrome.tabs.create({ url: platform.url, active: true });
        
        return { success: true };
        
    } catch(e) {
        throw new Error(e.message || 'Código inválido');
    }
}

// ============================================
// DETECCIÓN AUTOMÁTICA Y ABRIR POPUP
// ============================================
let lastProcessedCode = null;
let isProcessing = false;

async function checkClipboardAndNotify() {
    if (isProcessing) return;
    
    try {
        const text = await navigator.clipboard.readText();
        
        if (text === lastProcessedCode) return;
        
        if (text?.startsWith('premium_id:')) {
            lastProcessedCode = text;
            isProcessing = true;
            
            const version = getCodeVersion(text);
            const parts = text.split(':');
            const platform = parts[1];
            const platformName = PLATFORMS[platform]?.name || platform;
            
            if (version === 'V4') {
                chrome.notifications?.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'PREMIUM ID',
                    message: `🎬 Código V4 detectado para ${platformName}. Abre la extensión y pulsa la plataforma.`,
                    priority: 2
                });
                
                chrome.action.openPopup();
                
            } else if (version && version !== 'V4') {
                chrome.notifications?.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'PREMIUM ID',
                    message: `⚠️ Código incompatible (versión ${version}). Solo compatible con PREMIUM ID V4.`,
                    priority: 2
                });
            } else {
                chrome.notifications?.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'PREMIUM ID',
                    message: `❌ Código inválido.`,
                    priority: 2
                });
            }
            
            isProcessing = false;
        }
    } catch(e) {}
}

// ============================================
// ANTI-SESSION SHARE
// ============================================
let sessionPasteDetected = false;

async function checkClipboardForSessionPaste() {
    if (sessionPasteDetected) return;
    try {
        const text = await navigator.clipboard.readText();
        if (text && text.startsWith('session_paste')) {
            sessionPasteDetected = true;
            const tabs = await chrome.tabs.query({});
            for (let tab of tabs) {
                try { await chrome.tabs.sendMessage(tab.id, { action: 'kill_session' }); } catch(e) {}
            }
            chrome.notifications?.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'PREMIUM ID',
                message: '⚠️ Se detectó un intento de copiar la sesión.'
            });
            setTimeout(() => { sessionPasteDetected = false; }, 10000);
        }
    } catch(e) {}
}

// ============================================
// HEARTBEAT
// ============================================
setInterval(async () => {
    const tabs = await chrome.tabs.query({});
    for (let tab of tabs) {
        try { await chrome.tabs.sendMessage(tab.id, { action: 'heartbeat' }); } catch(e) {}
    }
}, 2000);

// ============================================
// MANEJADOR DE MENSAJES
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'verifySession') {
        verifySessionReal(request.platform, request.encryptedData)
            .then(result => sendResponse({ isValid: result.isValid, reason: result.reason }))
            .catch(err => sendResponse({ isValid: false, error: err.message }));
        return true;
    }
    
    if (request.action === 'restoreSession') {
        restoreSession(request.platform, request.encryptedData)
            .then(() => sendResponse({ success: true }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
    
    if (request.action === 'heartbeat') {
        sendResponse({ alive: true });
        return true;
    }
    
    return false;
});

setInterval(checkClipboardAndNotify, 2000);
setInterval(checkClipboardForSessionPaste, 2000);

console.log('🔥 PREMIUM ID v4.0 - PÚBLICO (Anti-TV/Android activo)');