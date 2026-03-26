// PREMIUM ID - Background v3.3 (con verificación mejorada para Prime Video)

const PLATFORMS = {
    netflix: { name: 'Netflix', domain: '.netflix.com', url: 'https://www.netflix.com', checkUrl: 'https://www.netflix.com/browse' },
    crunchyroll: { name: 'Crunchyroll', domain: '.crunchyroll.com', url: 'https://www.crunchyroll.com', checkUrl: 'https://www.crunchyroll.com' },
    prime: { name: 'Prime Video', domain: '.amazon.com', altDomains: ['.primevideo.com'], url: 'https://www.primevideo.com', checkUrl: 'https://www.primevideo.com' },
    paramount: { name: 'Paramount+', domain: '.paramountplus.com', url: 'https://www.paramountplus.com', checkUrl: 'https://www.paramountplus.com' },
    viki: { name: 'Rakuten Viki', domain: '.viki.com', url: 'https://www.viki.com', checkUrl: 'https://www.viki.com' },
    atresplayer: { name: 'AtresPlayer', domain: '.atresplayer.com', url: 'https://www.atresplayer.com', checkUrl: 'https://www.atresplayer.com' }
};

// ============================================
// GENERAR CÓDIGO
// ============================================

async function generateSessionCode(platformKey) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');
        
        let allCookies = [];
        const cookies = await chrome.cookies.getAll({ domain: platform.domain });
        allCookies.push(...cookies);
        
        if (platform.altDomains) {
            for (let altDomain of platform.altDomains) {
                const altCookies = await chrome.cookies.getAll({ domain: altDomain });
                allCookies.push(...altCookies);
            }
        }
        
        if (!allCookies || allCookies.length === 0) {
            throw new Error(`No hay sesión activa en ${platform.name}`);
        }
        
        const cookieString = allCookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        const sessionData = {
            platform: platformKey,
            cookies: cookieString,
            version: '1.0',
            createdAt: Date.now()
        };
        
        const encryptedData = btoa(JSON.stringify(sessionData));
        const sessionId = Math.random().toString(36).substring(2, 8);
        const accessKey = Math.random().toString(36).substring(2, 8);
        const fullCode = `premium_id:${platformKey}:${sessionId}:${accessKey}:${encryptedData}`;
        
        return fullCode;
        
    } catch(e) {
        throw e;
    }
}

// ============================================
// VERIFICAR SESIÓN REAL (con ventana invisible)
// ============================================

async function verifySessionReal(platformKey, encryptedData) {
    let winId = null;
    
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) return false;
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        const cookiesString = sessionData.cookies;
        
        // Restaurar cookies temporalmente
        const cookiePairs = cookiesString.split('; ');
        
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
        
        // Crear ventana invisible (fuera de pantalla)
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
        
        // Esperar carga (5 segundos para Prime Video)
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Ejecutar script para verificar
        const result = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (platformKey) => {
                const url = window.location.href.toLowerCase();
                const body = document.body?.innerText?.toLowerCase() || '';
                const title = document.title?.toLowerCase() || '';
                
                const loginIndicators = {
                    crunchyroll: ['login', 'sign in', 'iniciar sesión', 'signin'],
                    netflix: ['login', 'sign in', 'iniciar sesión'],
                    prime: [
                        'signin', 'login', 'ap/signin', 'auth',
                        'nonprimehomepage', 'offers/nonprimehomepage',
                        'plan', 'selectplan', 'force_root',
                        'offers', 'nonprime'
                    ],
                    paramount: ['login', 'sign in'],
                    viki: ['login', 'sign in'],
                    atresplayer: ['iniciar-sesion', 'login']
                };
                
                const indicators = loginIndicators[platformKey] || ['login', 'signin'];
                const isLoginPage = indicators.some(i => url.includes(i) || body.includes(i) || title.includes(i));
                
                const expiredIndicators = [
                    'session expired', 'sesión expirada', 'logged out', 'cerraste sesión',
                    'sign in to continue', 'inicia sesión para continuar'
                ];
                const isExpired = expiredIndicators.some(i => body.includes(i));
                
                // PRIME VIDEO: verificación específica
                if (platformKey === 'prime') {
                    // Si la URL contiene 'nonprimehomepage' o 'offers' -> sesión inválida
                    if (url.includes('nonprimehomepage') || url.includes('/offers/') || url.includes('nonprime')) {
                        return { isValid: false };
                    }
                    
                    // Buscar menú de usuario
                    const hasUserMenu = document.querySelector(
                        '[aria-label*="cuenta" i], [aria-label*="account" i], ' +
                        '.nav-account, #nav-link-accountList, ' +
                        '[data-testid="user-menu"], .profile-button, ' +
                        '.nav-user, .nav-avatar'
                    );
                    
                    // Si es página de contenido
                    const isContentPage = url.includes('/watch') || url.includes('/detail') || url.includes('/tv') || url.includes('/video');
                    
                    // Si no hay menú de usuario y no es página de contenido -> inválido
                    if (!hasUserMenu && !isContentPage) {
                        return { isValid: false };
                    }
                    
                    // Si hay menú de usuario -> válido
                    if (hasUserMenu) {
                        return { isValid: true };
                    }
                }
                
                if (isLoginPage || isExpired) {
                    return { isValid: false };
                }
                
                return { isValid: true };
            },
            args: [platformKey]
        });
        
        const isValid = result[0]?.result?.isValid === true;
        
        return isValid;
        
    } catch(e) {
        return false;
        
    } finally {
        if (winId) {
            try {
                await chrome.windows.remove(winId);
            } catch(e) {}
        }
    }
}

// ============================================
// RESTAURAR SESIÓN (ABRE PESTAÑA VISIBLE)
// ============================================

async function restoreSession(platformKey, encryptedData) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        
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
        
        return true;
        
    } catch(e) {
        throw new Error('Código inválido');
    }
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
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: 'kill_session' });
                } catch(e) {}
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

setInterval(checkClipboardForSessionPaste, 2000);

// ============================================
// HEARTBEAT
// ============================================

setInterval(async () => {
    const tabs = await chrome.tabs.query({});
    for (let tab of tabs) {
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'heartbeat' });
        } catch(e) {}
    }
}, 2000);

// ============================================
// MANEJADOR DE MENSAJES
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateCode') {
        generateSessionCode(request.platform)
            .then(code => sendResponse({ success: true, code: code }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
    
    if (request.action === 'verifySession') {
        verifySessionReal(request.platform, request.encryptedData)
            .then(isValid => sendResponse({ isValid: isValid }))
            .catch(() => sendResponse({ isValid: false }));
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