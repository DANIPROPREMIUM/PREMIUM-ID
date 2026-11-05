// ============================================================
// PREMIUM ID - BACKGROUND v17.0 (Disney refresh vía pestaña - sin 403)
// ============================================================

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
    },
    hidive: {
        name: 'HiDive',
        domain: '.hidive.com',
        url: 'https://www.hidive.com',
        storageBased: true,
        storageUrl: 'https://www.hidive.com/',
        hostMatch: ['*://*.hidive.com/*'],
        preferHost: 'www.hidive.com'
    },
    disney: {
        name: 'Disney+',
        domain: '.disneyplus.com',
        url: 'https://www.disneyplus.com/',
        storageBased: true,
        storageUrl: 'https://www.disneyplus.com/',
        hostMatch: ['*://*.disneyplus.com/*'],
        preferHost: 'www.disneyplus.com'
    }
};

// ============================================================
// 🌐 Disney+ Desktop UA
// ============================================================
const DISNEY_UA_RULE_ID = 3;
const DISNEY_UA_DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                          "AppleWebKit/537.36 (KHTML, like Gecko) " +
                          "Chrome/131.0.0.0 Safari/537.36";

async function enableDisneyDesktopUA() {
    try {
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [DISNEY_UA_RULE_ID],
            addRules: [{
                id: DISNEY_UA_RULE_ID,
                priority: 2,
                action: {
                    type: "modifyHeaders",
                    requestHeaders: [
                        { header: "user-agent", operation: "set", value: DISNEY_UA_DESKTOP },
                        { header: "sec-ch-ua", operation: "set",
                          value: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' },
                        { header: "sec-ch-ua-mobile", operation: "set", value: "?0" },
                        { header: "sec-ch-ua-platform", operation: "set", value: '"Windows"' }
                    ]
                },
                condition: {
                    requestDomains: ["disneyplus.com"],
                    resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest"]
                }
            }]
        });
        console.log('✅ Disney+ Desktop UA activo');
    } catch (e) {
        console.warn('Disney UA rule error:', e);
    }
}
enableDisneyDesktopUA();

// ============================================================
// PRIME VIDEO: SPOOF COMPLETO DE ESCRITORIO
// ============================================================
const PRIME_RULE_ID = 2;
const PRIME_UA_DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
                         "AppleWebKit/537.36 (KHTML, like Gecko) " +
                         "Chrome/131.0.0.0 Safari/537.36";

async function enablePrimeSpoof() {
    try {
        await chrome.declarativeNetRequest.updateSessionRules({
            removeRuleIds: [PRIME_RULE_ID],
            addRules: [{
                id: PRIME_RULE_ID,
                priority: 2,
                action: {
                    type: "modifyHeaders",
                    requestHeaders: [
                        { header: "user-agent", operation: "set", value: PRIME_UA_DESKTOP },
                        { header: "sec-ch-ua", operation: "set",
                          value: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' },
                        { header: "sec-ch-ua-mobile", operation: "set", value: "?0" },
                        { header: "sec-ch-ua-platform", operation: "set", value: '"Windows"' }
                    ]
                },
                condition: {
                    requestDomains: ["primevideo.com", "amazon.com"],
                    resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest"]
                }
            }]
        });
        console.log('✅ Prime Video desktop spoof activo');
    } catch (e) {
        console.warn('Prime spoof error:', e);
    }
}
enablePrimeSpoof();

// ============================================================
// 🔴 WATCHDOG DISNEY+
// ============================================================
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'disney-watchdog') {
        port.onDisconnect.addListener(() => {});
    }
});

function atobUtf8(b64) {
    const raw = atob(b64);
    try { return decodeURIComponent(escape(raw)); } catch(e) { return raw; }
}

function getCodeVersion(code) {
    if (!code?.startsWith('premium_id:')) return null;
    try {
        const parts = code.split(':');
        if (parts.length < 5) return null;
        const encryptedData = parts.slice(4).join(':');
        const decoded = atobUtf8(encryptedData);
        const sessionData = JSON.parse(decoded);
        return sessionData.version || 'V1';
    } catch(e) {
        return null;
    }
}

// ============================================================
// 🆕 DISNEY+ TOKEN REFRESH — v3 (refresh inyectado en pestaña)
// ============================================================
const DISNEY_TOKEN_URL = 'https://global.edge.bamgrid.com/token';
const DISNEY_API_KEY = 'ZGlzbmV5JmJyb3dzZXImMS4wLjA.Cu56AgSfBTDag5NiRA81oLHkDZfu5L3CKadnefEAY84';

// Ya NO se usa para Disney (el fetch va en la pestaña), pero se deja
// por compatibilidad.
async function refreshDisneyToken(refreshToken) {
    if (!refreshToken) return null;
    try {
        const res = await fetch(DISNEY_TOKEN_URL, {
            method: 'POST',
            headers: {
                'authorization': 'Bearer ' + DISNEY_API_KEY,
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });
        if (!res.ok) {
            console.warn('[Disney Refresh] HTTP', res.status);
            return null;
        }
        const data = await res.json();
        if (!data.access_token) return null;
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshToken,
            expires_in: data.expires_in || 3600
        };
    } catch (e) {
        console.warn('[Disney Refresh] Error:', e.message);
        return null;
    }
}

function extractDisneyRefreshToken(ls) {
    if (!ls) return null;

    const dtciToken = Object.keys(ls).find(k => /^DTCI-DISNEYPLUS\..*\.token$/.test(k));
    if (dtciToken) {
        try {
            const p = JSON.parse(ls[dtciToken]);
            if (p?.refresh_token) return p.refresh_token;
        } catch (e) {}
    }

    const dtciDtoken = Object.keys(ls).find(k => /^DTCI-DISNEYPLUS\..*\.dtoken$/.test(k));
    if (dtciDtoken) {
        try {
            const p = JSON.parse(ls[dtciDtoken]);
            if (p?.refresh_token) return p.refresh_token;
        } catch (e) {}
    }

    const bamAccess = Object.keys(ls).find(k => k.startsWith('__bam_sdk_access'));
    if (bamAccess) {
        try {
            const p = JSON.parse(ls[bamAccess]);
            if (p?.context?.refreshToken) return p.context.refreshToken;
            if (p?.token?.refresh_token) return p.token.refresh_token;
            if (p?.refresh_token) return p.refresh_token;
        } catch (e) {}
    }

    const bamRefresh = Object.keys(ls).find(k => k.startsWith('__bam_sdk_refresh'));
    if (bamRefresh) {
        try {
            const p = JSON.parse(ls[bamRefresh]);
            if (p?.token?.refresh_token) return p.token.refresh_token;
            if (p?.refresh_token) return p.refresh_token;
        } catch (e) {}
    }

    return null;
}

// 🆕 Hace el refresh DESDE LA PESTAÑA (no desde el service worker)
async function refreshDisneyFromTab(tabId, refreshToken) {
    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: async (apiKey, tokenUrl, rt) => {
                try {
                    const res = await fetch(tokenUrl, {
                        method: 'POST',
                        headers: {
                            'authorization': 'Bearer ' + apiKey,
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        body: new URLSearchParams({
                            grant_type: 'refresh_token',
                            refresh_token: rt
                        })
                    });
                    if (!res.ok) return { error: 'HTTP ' + res.status };
                    const data = await res.json();
                    return {
                        access_token: data.access_token || null,
                        refresh_token: data.refresh_token || null,
                        expires_in: data.expires_in || 3600
                    };
                } catch (e) {
                    return { error: e.message };
                }
            },
            args: [DISNEY_API_KEY, DISNEY_TOKEN_URL, refreshToken]
        });
        return results?.[0]?.result || { error: 'sin resultado' };
    } catch (e) {
        return { error: e.message };
    }
}

// ============================================================
// RESTAURAR SESIÓN
// ============================================================
function waitForTab(tabId, timeout = 20000) {
    return new Promise(resolve => {
        let done = false;
        const finish = (ok) => {
            if (done) return;
            done = true;
            clearInterval(poll);
            clearTimeout(timer);
            resolve(ok);
        };
        const poll = setInterval(async () => {
            try {
                const tab = await chrome.tabs.get(tabId);
                if (tab.status === 'complete') finish(true);
            } catch (e) {
                finish(false);
            }
        }, 400);
        const timer = setTimeout(() => finish(false), timeout);
    });
}

const HIDIVE_WRITER = (ls, ss) => {
    let applied = 0;
    const dump = (store, data) => {
        if (!data) return;
        for (const key in data) {
            if (key === 'device-id') continue;
            try {
                store.setItem(key, data[key]);
                applied++;
            } catch (e) {}
        }
    };
    dump(localStorage, ls);
    dump(sessionStorage, ss);
    return applied;
};

const DISNEY_TOKEN_WRITER = (newAccess, newRefresh) => {
    try {
        const dtciToken = Object.keys(localStorage).find(k => /^DTCI-DISNEYPLUS\..*\.token$/.test(k));
        if (dtciToken) {
            const p = JSON.parse(localStorage.getItem(dtciToken));
            if (p) {
                p.access_token = newAccess;
                if (newRefresh) p.refresh_token = newRefresh;
                localStorage.setItem(dtciToken, JSON.stringify(p));
            }
        }
        const dtciDtoken = Object.keys(localStorage).find(k => /^DTCI-DISNEYPLUS\..*\.dtoken$/.test(k));
        if (dtciDtoken) {
            const p = JSON.parse(localStorage.getItem(dtciDtoken));
            if (p) {
                p.access_token = newAccess;
                if (newRefresh) p.refresh_token = newRefresh;
                localStorage.setItem(dtciDtoken, JSON.stringify(p));
            }
        }
        const bamAccess = Object.keys(localStorage).find(k => k.startsWith('__bam_sdk_access'));
        if (bamAccess) {
            const p = JSON.parse(localStorage.getItem(bamAccess));
            if (p?.context) {
                p.context.token = newAccess;
                if (newRefresh) p.context.refreshToken = newRefresh;
                localStorage.setItem(bamAccess, JSON.stringify(p));
            }
        }
        const bamRefresh = Object.keys(localStorage).find(k => k.startsWith('__bam_sdk_refresh'));
        if (bamRefresh) {
            const p = JSON.parse(localStorage.getItem(bamRefresh));
            if (p?.token) {
                p.token.access_token = newAccess;
                if (newRefresh) p.token.refresh_token = newRefresh;
            } else if (p) {
                p.access_token = newAccess;
                if (newRefresh) p.refresh_token = newRefresh;
            }
            localStorage.setItem(bamRefresh, JSON.stringify(p));
        }
    } catch (e) {}
};

async function injectStorage(platform, ls, ss, openTab = true) {
    const STORAGE_URL = platform.storageUrl;
    const prefer = platform.preferHost;

    const tabs = await chrome.tabs.query({ url: platform.hostMatch });
    tabs.sort((a, b) => {
        const aw = (a.url || '').includes(prefer) ? 0 : 1;
        const bw = (b.url || '').includes(prefer) ? 0 : 1;
        return aw - bw;
    });

    let tabId;

    if (tabs.length > 0) {
        tabId = tabs[0].id;
        await chrome.tabs.update(tabId, { url: STORAGE_URL, active: true }).catch(() => {});
    } else {
        const tab = await chrome.tabs.create({ url: STORAGE_URL, active: true });
        tabId = tab.id;
    }

    if (tabId === undefined) throw new Error(`${platform.name}: no se pudo abrir la página`);

    await waitForTab(tabId);

    let results;
    try {
        results = await chrome.scripting.executeScript({
            target: { tabId },
            func: HIDIVE_WRITER,
            args: [ls, ss]
        });
    } catch (e) {
        throw new Error(`${platform.name}: sin permiso para escribir en la página`);
    }

    const applied = results?.[0]?.result || 0;

    if (applied === 0) throw new Error(`${platform.name}: no se pudo escribir el storage de la página`);

    await chrome.tabs.reload(tabId).catch(() => {});

    if (openTab) {
        await chrome.tabs.update(tabId, { active: true }).catch(() => {});
    }

    return { applied, tabId };
}

async function restoreSession(platformKey, encryptedData, openTab = true) {
    try {
        const platform = PLATFORMS[platformKey];
        if (!platform) throw new Error('Plataforma no soportada');

        const decoded = atobUtf8(encryptedData);
        const sessionData = JSON.parse(decoded);

        // HBO MAX V5
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

                if (!c.hostOnly && c.domain) details.domain = c.domain;
                if (details.sameSite === 'no_restriction') details.secure = true;
                if (!c.session && c.expirationDate) details.expirationDate = c.expirationDate;

                try {
                    await chrome.cookies.set(details);
                    cookiesSet++;
                    cookieNames.push(c.name);
                } catch (e) {
                    console.warn('No se pudo setear', c.name, '@', c.domain, e?.message);
                }
            }

            if (cookiesSet === 0) throw new Error('No se pudieron restaurar las cookies');

            if (openTab) {
                await new Promise(resolve => setTimeout(resolve, 500));
                await chrome.tabs.create({ url: platform.url, active: true });
            }

            return { success: true, cookiesSet, cookieNames };
        }

        // STORAGE V6 (HiDive / Disney)
        if (platform.storageBased && sessionData.version === 'V6') {
            const storedLs = sessionData.ls || {};
            const storedSs = sessionData.ss || {};

            if (Object.keys(storedLs).length === 0 && Object.keys(storedSs).length === 0) {
                throw new Error(`El código no contiene datos de sesión de ${platform.name}`);
            }

            if (sessionData.cookies) {
                for (let pair of sessionData.cookies.split('; ')) {
                    const eq = pair.indexOf('=');
                    if (eq === -1) continue;
                    try {
                        await chrome.cookies.set({
                            url: platform.url,
                            name: pair.substring(0, eq),
                            value: pair.substring(eq + 1),
                            domain: platform.domain,
                            path: '/',
                            secure: true,
                            expirationDate: Date.now() / 1000 + 2592000
                        });
                    } catch (e) {}
                }
            }

            const injected = await injectStorage(platform, storedLs, storedSs, openTab);

            // 🆕 DISNEY: renovar token automáticamente DESDE LA PESTAÑA
            if (platformKey === 'disney' && injected.tabId) {
                const refreshToken = extractDisneyRefreshToken(storedLs);

                if (refreshToken) {
                    console.log('[Disney] Renovando token desde la pestaña...');
                    const result = await refreshDisneyFromTab(injected.tabId, refreshToken);

                    if (result?.access_token) {
                        await chrome.scripting.executeScript({
                            target: { tabId: injected.tabId },
                            func: DISNEY_TOKEN_WRITER,
                            args: [result.access_token, result.refresh_token]
                        });

                        await chrome.tabs.reload(injected.tabId).catch(() => {});
                        console.log('[Disney] ✅ Token renovado y página recargada');
                    } else {
                        console.warn('[Disney] ⚠️ No se pudo renovar:', result?.error || 'sin access_token');
                    }
                } else {
                    console.warn('[Disney] ⚠️ No se encontró refresh_token en el storage');
                }
            }

            return { success: true, cookiesSet: 0, cookieNames: [], storage: injected };
        }

        if (sessionData.version !== 'V4') {
            throw new Error('Código incompatible');
        }

        // V4 (resto de plataformas por cookies)
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

            if (platformKey === 'prime') {
                await chrome.cookies.set({
                    url: 'https://www.amazon.com', name, value,
                    domain: '.amazon.com', path: '/', secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                await chrome.cookies.set({
                    url: 'https://www.primevideo.com', name, value,
                    domain: '.primevideo.com', path: '/', secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                cookiesSet++;
                continue;
            }

            if (platformKey === 'hbomax') {
                for (let domain of platform.domains) {
                    try {
                        await chrome.cookies.set({
                            url: `https://${domain.replace('.', '')}`,
                            name, value, domain, path: '/', secure: true,
                            sameSite: 'no_restriction',
                            expirationDate: Date.now() / 1000 + 2592000
                        });
                    } catch(e) {
                        try {
                            await chrome.cookies.set({
                                url: 'https://www.hbomax.com', name, value,
                                path: '/', secure: true, sameSite: 'no_restriction',
                                expirationDate: Date.now() / 1000 + 2592000
                            });
                        } catch(e2) {}
                    }
                }
                cookiesSet++;
                continue;
            }

            if (platformKey === 'appletv') {
                await chrome.cookies.set({
                    url: 'https://www.apple.com', name, value,
                    domain: '.apple.com', path: '/', secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                await chrome.cookies.set({
                    url: 'https://tv.apple.com', name, value,
                    domain: '.tv.apple.com', path: '/', secure: true,
                    sameSite: 'no_restriction',
                    expirationDate: Date.now() / 1000 + 2592000
                });
                cookiesSet++;
                continue;
            }

            await chrome.cookies.set({
                url: platform.url, name, value,
                domain: platform.domain, path: '/', secure: true,
                expirationDate: Date.now() / 1000 + 2592000
            });
            cookiesSet++;
        }

        if (cookiesSet === 0) throw new Error('No se pudieron restaurar las cookies');

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
            if (version === 'V4' || version === 'V5' || version === 'V6') {
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
// GENERADOR DE TOKENS NETFLIX
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
  if (!token) throw new Error('Cuenta off, imposible generar TOKENS, intenta con otra.');
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
// 🆕 RENOVACIÓN PERIÓDICA (cada 50 min) en pestañas Disney abiertas
// ============================================================
setInterval(async () => {
    try {
        const tabs = await chrome.tabs.query({ url: '*://*.disneyplus.com/*' });
        for (const tab of tabs) {
            if (!tab.id) continue;
            try {
                // Leer refresh_token del storage de la pestaña
                const res = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        const dtciToken = Object.keys(localStorage).find(k => /^DTCI-DISNEYPLUS\..*\.token$/.test(k));
                        if (dtciToken) {
                            try {
                                const p = JSON.parse(localStorage.getItem(dtciToken));
                                if (p?.refresh_token) return p.refresh_token;
                            } catch (e) {}
                        }
                        const dtciDtoken = Object.keys(localStorage).find(k => /^DTCI-DISNEYPLUS\..*\.dtoken$/.test(k));
                        if (dtciDtoken) {
                            try {
                                const p = JSON.parse(localStorage.getItem(dtciDtoken));
                                if (p?.refresh_token) return p.refresh_token;
                            } catch (e) {}
                        }
                        const bamAccess = Object.keys(localStorage).find(k => k.startsWith('__bam_sdk_access'));
                        if (bamAccess) {
                            try {
                                const p = JSON.parse(localStorage.getItem(bamAccess));
                                if (p?.context?.refreshToken) return p.context.refreshToken;
                            } catch (e) {}
                        }
                        return null;
                    }
                });
                const refreshToken = res?.[0]?.result;
                if (!refreshToken) continue;

                // Refresh DESDE LA PESTAÑA
                const result = await refreshDisneyFromTab(tab.id, refreshToken);
                if (result?.access_token) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: DISNEY_TOKEN_WRITER,
                        args: [result.access_token, result.refresh_token]
                    });
                    console.log('[Disney Periodic] ✅ Token renovado en pestaña', tab.id);
                } else {
                    console.warn('[Disney Periodic] ⚠️ Falló:', result?.error || 'sin access_token');
                }
            } catch (e) {}
        }
    } catch (e) {}
}, 50 * 60 * 1000);

// ============================================================
// INICIALIZACIÓN
// ============================================================
setInterval(checkClipboardAndNotify, 2000);

console.log('🔥 PREMIUM ID - BACKGROUND v17.0 (Disney refresh vía pestaña - sin 403)');