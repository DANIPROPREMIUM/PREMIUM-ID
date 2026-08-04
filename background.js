// PREMIUM ID - Background PÚBLICO v5.0 (HBO MAX - RESTAURA TOTAL)

const PLATFORMS = {
    netflix: { name: 'Netflix', domain: '.netflix.com', url: 'https://www.netflix.com/browse' },
    crunchyroll: { name: 'Crunchyroll', domain: '.crunchyroll.com', url: 'https://www.crunchyroll.com' },
    prime: { name: 'Prime Video', domain: '.amazon.com', altDomains: ['.primevideo.com'], url: 'https://www.primevideo.com' },
    paramount: { name: 'Paramount+', domain: '.paramountplus.com', url: 'https://www.paramountplus.com' },
    viki: { name: 'Rakuten Viki', domain: '.viki.com', url: 'https://www.viki.com' },
    atresplayer: { name: 'AtresPlayer', domain: '.atresplayer.com', url: 'https://www.atresplayer.com' },
    hbomax: { 
        name: 'HBO Max', 
        domains: ['.hbomax.com', '.max.com', 'play.hbomax.com'],
        url: 'https://play.hbomax.com'
    }
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
// RESTAURAR SESIÓN - HBO MAX CON TODAS LAS COOKIES
// ============================================================
async function restoreSession(platformKey, encryptedData, openTab = true) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);

        // ============================================================
        // HBO MAX V5: cookies COMPLETAS (dominio + atributos reales).
        // Se restaura cada cookie tal cual la exportó el CREADOR,
        // igual que hace Cookie-Editor. Solo HBO usa este camino.
        // ============================================================
        if (platformKey === 'hbomax' && sessionData.version === 'V5' && Array.isArray(sessionData.cookiesFull)) {
            let cookiesSet = 0;
            let cookieNames = [];

            for (let c of sessionData.cookiesFull) {
                if (!c.name) continue;

                const bareHost = (c.domain || '').replace(/^\./, '');
                if (!bareHost) continue;
                const path = c.path || '/';
                const url = `https://${bareHost}${path}`;

                const details = {
                    url,
                    name: c.name,
                    value: c.value != null ? String(c.value) : '',
                    path,
                    secure: !!c.secure,
                    httpOnly: !!c.httpOnly,
                    sameSite: c.sameSite || 'unspecified'
                };

                // Cookie de dominio (.hbomax.com) vs host-only (auth.hbomax.com)
                if (!c.hostOnly && c.domain) {
                    details.domain = c.domain;
                }

                // sameSite=none exige secure
                if (details.sameSite === 'no_restriction') {
                    details.secure = true;
                }

                // Expiración original (o sesión si no había)
                if (!c.session && c.expirationDate) {
                    details.expirationDate = c.expirationDate;
                }

                try {
                    await chrome.cookies.set(details);
                    cookiesSet++;
                    cookieNames.push(c.name);
                } catch (e) {
                    console.warn('No se pudo setear', c.name, '@', c.domain, e?.message);
                }
            }

            if (cookiesSet === 0) {
                throw new Error('No se pudieron restaurar las cookies');
            }

            if (openTab) {
                await new Promise(resolve => setTimeout(resolve, 500));
                await chrome.tabs.create({ url: platform.url, active: true });
            }

            return { success: true, cookiesSet, cookieNames };
        }

        if (sessionData.version !== 'V4') {
            throw new Error('Código incompatible');
        }

        const cookiePairs = sessionData.cookies.split('; ');
        let cookiesSet = 0;
        let cookieNames = [];
        
        for (let cookiePair of cookiePairs) {
            const equalIndex = cookiePair.indexOf('=');
            if (equalIndex === -1) continue;
            
            const name = cookiePair.substring(0, equalIndex);
            const value = cookiePair.substring(equalIndex + 1);
            
            if (!name || !value) continue;
            
            cookieNames.push(name);
            
            // PRIME VIDEO
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
                cookiesSet++;
                continue;
            }
            
            // ============================================================
            // HBO MAX - RESTAURAR EN TODOS LOS DOMINIOS
            // ============================================================
            if (platformKey === 'hbomax') {
                // Establecer en CADA dominio de HBO Max
                for (let domain of platform.domains) {
                    try {
                        await chrome.cookies.set({
                            url: `https://${domain.replace('.', '')}`,
                            name: name,
                            value: value,
                            domain: domain,
                            path: '/',
                            secure: true,
                            sameSite: 'no_restriction',
                            expirationDate: Date.now() / 1000 + 2592000
                        });
                    } catch(e) {
                        // Si falla un dominio, intentar sin dominio específico
                        try {
                            await chrome.cookies.set({
                                url: 'https://www.hbomax.com',
                                name: name,
                                value: value,
                                path: '/',
                                secure: true,
                                sameSite: 'no_restriction',
                                expirationDate: Date.now() / 1000 + 2592000
                            });
                        } catch(e2) {}
                    }
                }
                
                // También establecer sin dominio específico
                try {
                    await chrome.cookies.set({
                        url: 'https://www.hbomax.com',
                        name: name,
                        value: value,
                        path: '/',
                        secure: true,
                        sameSite: 'no_restriction',
                        expirationDate: Date.now() / 1000 + 2592000
                    });
                } catch(e) {}
                
                cookiesSet++;
                continue;
            }
            
            // RESTANTES
            await chrome.cookies.set({
                url: platform.url,
                name: name,
                value: value,
                domain: platform.domain,
                path: '/',
                secure: true,
                expirationDate: Date.now() / 1000 + 2592000
            });
            cookiesSet++;
        }
        
        if (cookiesSet === 0) {
            throw new Error('No se pudieron restaurar las cookies');
        }
        
        if (openTab) {
            await new Promise(resolve => setTimeout(resolve, 500));
            await chrome.tabs.create({ url: platform.url, active: true });
        }
        
        return { success: true, cookiesSet, cookieNames };
        
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
            
            if (version === 'V4' || version === 'V5') {
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

console.log('🔥 PREMIUM ID PRUEBA - BACKGROUND v5.0 (HBO MAX V5 - restaura cookies completas)');