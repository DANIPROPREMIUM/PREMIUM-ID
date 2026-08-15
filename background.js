// PREMIUM ID - Background PÚBLICO v10.0

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
    },
    appletv: {
        name: 'Apple TV',
        domain: '.apple.com',
        altDomains: ['.tv.apple.com'],
        url: 'https://tv.apple.com'
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
// RESTAURAR SESIÓN
// ============================================================
async function restoreSession(platformKey, encryptedData, openTab = true) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');
        
        const decoded = atob(encryptedData);
        const sessionData = JSON.parse(decoded);

        // ============================================================
        // HBO MAX V5: cookies COMPLETAS
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

                if (!c.hostOnly && c.domain) {
                    details.domain = c.domain;
                }

                if (details.sameSite === 'no_restriction') {
                    details.secure = true;
                }

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
            // HBO MAX
            // ============================================================
            if (platformKey === 'hbomax') {
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
            
            // ============================================================
            // APPLE TV
            // ============================================================
            if (platformKey === 'appletv') {
                await chrome.cookies.set({
                    url: 'https://www.apple.com',
                    name: name,
                    value: value,
                    domain: '.apple.com',
                    path: '/',
                    secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                
                await chrome.cookies.set({
                    url: 'https://tv.apple.com',
                    name: name,
                    value: value,
                    domain: '.tv.apple.com',
                    path: '/',
                    secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
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
// GENERADOR DE TOKENS NETFLIX (integración Token Generator)
// ============================================================
const IOSUI = "https://ios.prod.ftl.netflix.com/iosui/user/15.48";
const UA_ARGO = "Argo/15.48.1 (iPhone; iOS 15.8.5; Scale/2.00)";
const RULE_ID = 1;
const ESN = "NFAPPL-02-IPHONE8%3D1-PXA-02026U9VV5O8AUKEAEO8PUJETCGDD4PQRI9DEB3MDLEMD0EACM4CS78LMD334MN3MQ3NMJ8SU9O9MVGS6BJCURM1PH1MUTGDPF4S4200";
const CONFIG = '{"gamesInTrailersEnabled":"false","isTrailersEvidenceEnabled":"false","cdsMyListSortEnabled":"true","kidsBillboardEnabled":"true","addHorizontalBoxArtToVideoSummariesEnabled":"false","skOverlayTestEnabled":"false","homeFeedTestTVMovieListsEnabled":"false","baselineOnIpadEnabled":"true","trailersVideoIdLoggingFixEnabled":"true","postPlayPreviewsEnabled":"false","bypassContextualAssetsEnabled":"false","roarEnabled":"false","useSeason1AltLabelEnabled":"false","disableCDSSearchPaginationSectionKinds":["searchVideoCarousel"],"cdsSearchHorizontalPaginationEnabled":"true","searchPreQueryGamesEnabled":"true","kidsMyListEnabled":"true","billboardEnabled":"true","useCDSGalleryEnabled":"true","contentWarningEnabled":"true","videosInPopularGamesEnabled":"true","avifFormatEnabled":"false","sharksEnabled":"true"}';

const dec = s => { try { return decodeURIComponent(s); } catch { return s; } };

function cookieHeader(s) {
  if (!s || !s.netflixId) return null;
  let h = "NetflixId=" + dec(s.netflixId);
  if (s.secureNetflixId) h += "; SecureNetflixId=" + dec(s.secureNetflixId);
  if (s.nfvdid) h += "; nfvdid=" + s.nfvdid;
  return h;
}

function parseCookiesString(s) {
  const map = {};
  for (const part of s.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) map[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return map;
}

// Decodifica el base64 tolerando basura pegada al final (WhatsApp/notas).
function decodePayload(s) {
  s = s.replace(/[^A-Za-z0-9+/=]/g, "");
  const tope = Math.min(s.length, 64);
  for (let n = s.length; n >= s.length - tope; n--) {
    try {
      const d = decodeURIComponent(escape(atob(s.slice(0, n))));
      const j = JSON.parse(d);
      if (j && typeof j === "object") return j;
    } catch {}
  }
  return null;
}

function parseNetflixCookies(texto) {
  let t = (texto || "").replace(/\s+/g, "");
  const i = t.indexOf("premium_id:netflix:");
  if (i < 0) return null;
  t = t.slice(i);
  const parts = t.split(":");
  if (parts.length < 5) return null;
  const payload = decodePayload(parts.slice(4).join(":"));
  if (payload && payload.cookies) {
    const map = parseCookiesString(payload.cookies);
    return {
      netflixId: map.NetflixId || "",
      secureNetflixId: map.SecureNetflixId || "",
      nfvdid: map.nfvdid || ""
    };
  }
  return null;
}

// Chrome no deja setear Cookie/User-Agent en fetch() desde un service worker,
// así que se inyectan con una regla declarativeNetRequest de sesión, solo
// para el endpoint de mint, y se quita al terminar.
async function setRuleHeaders(cookieStr, add) {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [RULE_ID],
    ...(add ? { addRules: [{
      id: RULE_ID,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [
          { header: "cookie", operation: "set", value: cookieStr },
          { header: "user-agent", operation: "set", value: UA_ARGO }
        ]
      },
      condition: {
        urlFilter: "ios.prod.ftl.netflix.com/iosui/user/15.48",
        resourceTypes: ["xmlhttprequest"]
      }
    }] } : {})
  });
}

async function mintToken(session) {
  const p = new URLSearchParams();
  p.set("appVersion", "15.48.1");
  p.set("config", CONFIG);
  p.set("device_type", "NFAPPL-02-");
  p.set("esn", ESN);
  p.set("idiom", "phone");
  p.set("iosVersion", "15.8.5");
  p.set("isTablet", "false");
  p.set("languages", "en-US");
  p.set("locale", "en-US");
  p.set("maxDeviceWidth", "375");
  p.set("model", "saget");
  p.set("modelType", "IPHONE8-1");
  p.set("odpAware", "true");
  p.set("path", '["account","token","default"]');
  p.set("pathFormat", "graph");
  p.set("pixelDensity", "2.0");
  p.set("progressive", "false");
  p.set("responseFormat", "json");

  const h = cookieHeader(session);
  if (!h) throw new Error("El Premium ID no contiene las cookies de sesión");
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 25000);
  await setRuleHeaders(h, true);
  try {
    const r = await fetch(IOSUI + "?" + p.toString(), {
      signal: ctl.signal,
      headers: {
        "x-netflix.request.attempt": "1",
        "x-netflix.context.app-version": "15.48.1",
        "x-netflix.client.appversion": "15.48.1",
        "x-netflix.context.form-factor": "phone",
        "x-netflix.context.max-device-width": "375",
        "x-netflix.client.type": "argo",
        "x-netflix.client.ftl.esn": dec(ESN),
        "x-netflix.argo.translated": "true",
        "x-netflix.request.routing": '{"path":"/nq/mobile/nqios/~15.48.0/user","control_tag":"iosui_argo"}',
        "x-netflix.context.sdk-version": "2012.4",
        "x-netflix.context.locales": "en-US",
        "x-netflix.context.ui-flavor": "argo",
        "x-netflix.context.pixel-density": "2.0",
        "x-netflix.argo.abtests": "",
        "x-netflix.context.ab-tests": "",
        "x-netflix.argo.nfnsm": "9",
        "accept-language": "en-US;q=1"
      }
    });
    const d = await r.json();
    const td = (d && d.value && d.value.account && d.value.account.token && d.value.account.token.default) || {};
    return { token: td.token || null, expires: td.expires || null };
  } finally {
    clearTimeout(t);
    await setRuleHeaders(h, false);
  }
}

function urlsDeToken(token) {
  return {
    phone: "https://www.netflix.com/unsupported?nftoken=" + token,
    desktop: "https://www.netflix.com/browse?nftoken=" + token,
    tv: "https://www.netflix.com/tv8?nftoken=" + token
  };
}

async function genNetflixTokens(texto) {
  const entrada = parseNetflixCookies(texto);
  if (!entrada) throw new Error('Formato inválido. Pegá un Premium ID de Netflix válido.');
  const session = {
    netflixId: entrada.netflixId || "",
    secureNetflixId: entrada.secureNetflixId || "",
    nfvdid: entrada.nfvdid || "",
    savedAt: Date.now(),
    source: "premium-id"
  };
  const { token, expires } = await mintToken(session);
  if (!token) throw new Error('La sesión fue rechazada (Premium ID muerto o ya usado).');
  return { tokens: urlsDeToken(token), token, expires };
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
    
    if (request.action === 'genTokens') {
        genNetflixTokens(request.text)
            .then(result => sendResponse({ success: true, tokens: result.tokens, expires: result.expires }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
    
    return false;
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
setInterval(checkClipboardAndNotify, 2000);

console.log('🔥 PREMIUM ID - BACKGROUND v10.0');