// PREMIUM ID - Background v4.0

function isNetflixAllowed() {
    const ua = navigator.userAgent;
    const tvPatterns = [
        /SmartTV/i, /Smart-TV/i, /SMART_TV/i,
        /Tizen/i, /WebOS/i, /Web0S/i,
        /HbbTV/i, /CrKey/i, /VIDAA/i,
        /Viera/i, /NetCast/i, /NETTV/i,
        /DLNADOC/i, /AppleTV/i,
        /googletv/i, /AndroidTV/i,
        /Android.*TV/i, /Roku/i,
        /Opera TV/i, /AFT/i
    ];
    const isTV = tvPatterns.some(p => p.test(ua));
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isWindows = /Windows NT/i.test(ua);
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
                
                if (platformKey === 'atresplayer') {
                    if (url.includes('login') || url.includes('iniciar-sesion') || url.includes('identificate') || url.includes('entrar')) {
                        return { isValid: false, reason: 'Página de login detectada' };
                    }
                    
                    const loggedInSelectors = [
                        '[data-testid="user-avatar"]', '[data-testid="user-menu"]',
                        '.user-avatar', '.user-menu', '.profile-dropdown',
                        '.account-menu', '.user-info', '.profile-info',
                        '[class*="UserMenu"]', '[class*="userMenu"]',
                        '.nav-user', '.header-user',
                        'img[alt*="perfil"]', 'img[alt*="profile"]',
                        'img[class*="avatar"]', 'a[href*="logout"]',
                        'button[class*="logout"]', '[class*="cerrar-sesion"]'
                    ];
                    
                    let hasLoggedInElement = false;
                    for (const selector of loggedInSelectors) {
                        try {
                            const el = document.querySelector(selector);
                            if (el && el.offsetParent !== null) {
                                hasLoggedInElement = true;
                                break;
                            }
                        } catch(e) {}
                    }
                    
                    const loggedInText = [
                        'mi cuenta', 'mi perfil', 'cerrar sesión', 'logout',
                        'mis listas', 'ver perfil', 'ajustes de cuenta'
                    ];
                    const hasLoggedInText = loggedInText.some(text => body.includes(text.toLowerCase()));
                    
                    let hasSessionCookie = false;
                    try {
                        const cookies = document.cookie.split(';');
                        for (let cookie of cookies) {
                            const c = cookie.trim().toLowerCase();
                            if (c.includes('session') || c.includes('token') || 
                                c.includes('auth') || c.includes('jwt') ||
                                c.includes('atresplayer') || c.includes('user')) {
                                hasSessionCookie = true;
                                break;
                            }
                        }
                    } catch(e) {}
                    
                    let hasStorageData = false;
                    try {
                        const storageKeys = ['user', 'token', 'session', 'auth', 'jwt', 'atresplayer'];
                        for (const key of storageKeys) {
                            if (localStorage.getItem(key) || sessionStorage.getItem(key)) {
                                hasStorageData = true;
                                break;
                            }
                        }
                    } catch(e) {}
                    
                    const isValid = hasLoggedInElement || hasLoggedInText || hasSessionCookie || hasStorageData;
                    
                    if (isValid) {
                        return { isValid: true };
                    }
                    
                    const noUserIndicators = [
                        'iniciar sesión', 'registrarse', 'crear cuenta', 'sign in', 'sign up',
                        'entrar con email', 'entrar con google', '¿no tienes cuenta?'
                    ];
                    const hasNoUserText = noUserIndicators.some(text => body.includes(text));
                    
                    if (hasNoUserText || isLoginPage) {
                        return { isValid: false, reason: 'No se detectó sesión activa' };
                    }
                    
                    return { isValid: true };
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

async function restoreSession(platformKey, encryptedData) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');

        if (platformKey === 'netflix' && !isNetflixAllowed()) {
            throw new Error('No disponible en este dispositivo');
        }
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        
        if (sessionData.version !== 'V4') {
            throw new Error('Código incompatible');
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
                    message: `Código detectado para ${platformName}. Abre la extensión.`,
                    priority: 2
                });
                
                chrome.action.openPopup();
                
            } else if (version && version !== 'V4') {
                chrome.notifications?.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'PREMIUM ID',
                    message: `Código incompatible (versión ${version}).`,
                    priority: 2
                });
            } else {
                chrome.notifications?.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: 'PREMIUM ID',
                    message: `Código inválido.`,
                    priority: 2
                });
            }
            
            isProcessing = false;
        }
    } catch(e) {}
}

setInterval(async () => {
    const tabs = await chrome.tabs.query({});
    for (let tab of tabs) {
        try { await chrome.tabs.sendMessage(tab.id, { action: 'heartbeat' }); } catch(e) {}
    }
}, 2000);

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