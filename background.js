// PREMIUM ID - Background PÚBLICO v5.0

const PLATFORMS = {
    netflix: { name: 'Netflix', domain: '.netflix.com', url: 'https://www.netflix.com/browse', checkUrl: 'https://www.netflix.com/browse' },
    crunchyroll: { name: 'Crunchyroll', domain: '.crunchyroll.com', url: 'https://www.crunchyroll.com', checkUrl: 'https://www.crunchyroll.com' },
    prime: { name: 'Prime Video', domain: '.amazon.com', altDomains: ['.primevideo.com'], url: 'https://www.primevideo.com', checkUrl: 'https://www.primevideo.com' },
    paramount: { name: 'Paramount+', domain: '.paramountplus.com', url: 'https://www.paramountplus.com', checkUrl: 'https://www.paramountplus.com' },
    viki: { name: 'Rakuten Viki', domain: '.viki.com', url: 'https://www.viki.com', checkUrl: 'https://www.viki.com' },
    atresplayer: { name: 'AtresPlayer', domain: '.atresplayer.com', url: 'https://www.atresplayer.com', checkUrl: 'https://www.atresplayer.com' },
    hbomax: { name: 'HBO Max', domain: '.hbomax.com', altDomains: ['.max.com'], url: 'https://www.hbomax.com', checkUrl: 'https://www.hbomax.com' }
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

// ============================================================
// VERIFICAR SESIÓN REAL (SIN ABRIR VENTANA)
// ============================================================
async function verifySessionReal(platformKey, encryptedData) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) return { isValid: false, error: 'Plataforma no soportada' };
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        
        if (sessionData.version !== 'V4') {
            return { isValid: false, error: 'Versión incompatible' };
        }
        
        // Verificar que las cookies existen (no están vacías)
        const cookiePairs = sessionData.cookies.split('; ');
        if (!cookiePairs || cookiePairs.length === 0) {
            return { isValid: false, reason: 'Sin cookies' };
        }
        
        // Contar cookies válidas
        let validCookies = 0;
        for (let cookiePair of cookiePairs) {
            const equalIndex = cookiePair.indexOf('=');
            if (equalIndex === -1) continue;
            const name = cookiePair.substring(0, equalIndex);
            const value = cookiePair.substring(equalIndex + 1);
            if (name && value) validCookies++;
        }
        
        if (validCookies < 2) {
            return { isValid: false, reason: 'Cookies insuficientes' };
        }
        
        // Si todo está bien, asumimos que la sesión es válida
        // (evitamos abrir ventanas que causan problemas)
        return { isValid: true, reason: 'Sesión válida' };
        
    } catch(e) {
        return { isValid: false, error: e.message };
    }
}

// ============================================================
// RESTAURAR SESIÓN
// ============================================================
async function restoreSession(platformKey, encryptedData, openTab = true) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);
        
        if (sessionData.version !== 'V4') {
            throw new Error('Código incompatible');
        }
        
        const cookiePairs = sessionData.cookies.split('; ');
        let cookiesSet = 0;
        
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
            cookiesSet++;
        }
        
        if (cookiesSet === 0) {
            throw new Error('No se pudieron restaurar las cookies');
        }
        
        if (openTab) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await chrome.tabs.create({ url: platform.url, active: true });
        }
        
        return { success: true, cookiesSet };
        
    } catch(e) {
        throw new Error(e.message || 'Error al restaurar sesión');
    }
}

// ============================================================
// DETECTAR CÓDIGO EN PORTAPAPELES
// ============================================================
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
                    message: `📋 Código detectado para ${platformName}. Abre la extensión.`,
                    priority: 2
                });
            }
            
            isProcessing = false;
        }
    } catch(e) {}
}

// ============================================================
// MANEJADOR DE MENSAJES
// ============================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'verifySession') {
        verifySessionReal(request.platform, request.encryptedData)
            .then(result => sendResponse({ isValid: result.isValid, reason: result.reason }))
            .catch(err => sendResponse({ isValid: false, error: err.message }));
        return true;
    }
    
    if (request.action === 'restoreSession') {
        restoreSession(request.platform, request.encryptedData, request.openTab !== false)
            .then(result => sendResponse({ success: true, cookiesSet: result.cookiesSet }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
    
    return false;
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
setInterval(checkClipboardAndNotify, 2000);

console.log('🔥 PREMIUM ID - BACKGROUND v5.0 (con HBO Max)');