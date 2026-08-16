// PREMIUM ID - Popup PÚBLICO v10.0

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status-message');
    const platformCards = document.querySelectorAll('.platform-card');
    const hbomaxCleaner = document.getElementById('hbomax-cleaner');
    const cleanBtn = document.getElementById('clean-hbomax-cookies');
    const netflixPanel = document.getElementById('netflix-tokens');
    const nfTokensList = document.getElementById('nf-tokens-list');
    const nfStatusEl = document.getElementById('nf-status');
    const nfRegenBtn = document.getElementById('nt-regenerar');
    const nfIngresarBtn = document.getElementById('nt-ingresar');
    const nfNoteEl = document.querySelector('.nt-note');
    
    let isRestoring = false;
    let messageTimeout = null;
    let autoCloseTimeout = null;
    let lastClipboardText = null;
    let pendingRestore = null;
    let pendingNetflix = null;
    let nfTokens = null;
    let nfGenerating = false;
    // Detección de dispositivo por UA: todo navegador Android con extensiones
    // (Kiwi/Quetta) tiene "Android" en el UA; un PC normal no.
    // userAgentData.mobile es la fuente de verdad cuando está disponible.
    function isAndroidDevice() {
        try {
            const uaData = navigator.userAgentData;
            if (uaData && typeof uaData.mobile === 'boolean') return uaData.mobile;
        } catch(e) {}
        return /Android/i.test(navigator.userAgent);
    }
    
    const platforms = {
        netflix: { name: 'Netflix', url: 'https://www.netflix.com/browse' },
        crunchyroll: { name: 'Crunchyroll', url: 'https://www.crunchyroll.com' },
        prime: { name: 'Prime Video', url: 'https://www.primevideo.com' },
        paramount: { name: 'Paramount+', url: 'https://www.paramountplus.com' },
        viki: { name: 'Rakuten Viki', url: 'https://www.viki.com' },
        atresplayer: { name: 'AtresPlayer', url: 'https://www.atresplayer.com' },
        hbomax: { name: 'HBO Max', url: 'https://play.hbomax.com' },
        appletv: { name: 'Apple TV', url: 'https://tv.apple.com' }
    };
    
    function showMessage(text, type = 'info', duration = 3000) {
        if (messageTimeout) clearTimeout(messageTimeout);
        const color = type === 'success' ? '#4CAF50' : type === 'error' ? '#FF5252' : '#D4AF37';
        statusDiv.innerHTML = `<span style="color: ${color};">${text}</span>`;
        messageTimeout = setTimeout(() => {
            if (statusDiv.innerHTML.includes(text)) statusDiv.innerHTML = '';
            messageTimeout = null;
        }, duration);
    }
    
    async function readClipboard() {
        try { 
            return await navigator.clipboard.readText();
        } catch(e) { 
            return null; 
        }
    }
    
    // ============================================================
    // FUNCIÓN: LIMPIAR COOKIES DE HBO MAX Y RESTAURAR
    // ============================================================
    async function clearHboMaxCookies() {
        if (!cleanBtn) return;
        
        cleanBtn.classList.add('cleaning');
        cleanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Limpiando...';
        
        try {
            const domains = ['hbomax.com', 'max.com', 'play.hbomax.com'];
            let deleted = 0;
            
            for (let domain of domains) {
                try {
                    const cookies = await chrome.cookies.getAll({ domain: '.' + domain });
                    for (let cookie of cookies) {
                        await chrome.cookies.remove({
                            url: `https://${domain}`,
                            name: cookie.name
                        });
                        deleted++;
                    }
                } catch(e) {}
                
                try {
                    const cookies = await chrome.cookies.getAll({ domain: domain });
                    for (let cookie of cookies) {
                        await chrome.cookies.remove({
                            url: `https://${domain}`,
                            name: cookie.name
                        });
                        deleted++;
                    }
                } catch(e) {}
            }
            
            try {
                const allCookies = await chrome.cookies.getAll({});
                for (let cookie of allCookies) {
                    if (!cookie.domain || cookie.domain === '') {
                        const isHBO = cookie.name?.toLowerCase().includes('session') || 
                                      cookie.name?.toLowerCase().includes('token') ||
                                      cookie.name?.toLowerCase().includes('auth') ||
                                      cookie.name?.toLowerCase().includes('access') ||
                                      cookie.name?.toLowerCase().includes('user') ||
                                      cookie.name?.toLowerCase().includes('hbomax');
                        if (isHBO) {
                            await chrome.cookies.remove({
                                url: 'https://www.hbomax.com',
                                name: cookie.name
                            });
                            deleted++;
                        }
                    }
                }
            } catch(e) {}
            
            cleanBtn.classList.remove('cleaning');
            cleanBtn.classList.add('done');
            cleanBtn.innerHTML = `<i class="fas fa-check"></i> ${deleted} cookies eliminadas`;
            
            showMessage(`✅ ${deleted} cookies eliminadas. Restaurando...`, 'success', 2000);
            
            if (pendingRestore) {
                setTimeout(async () => {
                    await restoreSession(
                        pendingRestore.platform, 
                        pendingRestore.encryptedData, 
                        pendingRestore.platformName
                    );
                    pendingRestore = null;
                }, 1000);
            }
            
            setTimeout(() => {
                cleanBtn.classList.remove('done');
                cleanBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Limpiar cookies de HBO Max';
            }, 5000);
            
        } catch(e) {
            cleanBtn.classList.remove('cleaning');
            cleanBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Limpiar cookies de HBO Max';
            showMessage(`❌ Error: ${e.message}`, 'error', 3000);
        }
    }
    
    // ============================================================
    // RESTAURAR SESIÓN
    // ============================================================
    async function restoreSession(platform, encryptedData, platformName) {
        if (isRestoring) return;
        isRestoring = true;
        
        try {
            showMessage(`🔄 Restaurando ${platformName}...`, 'info', 2000);
            
            const response = await chrome.runtime.sendMessage({
                action: 'restoreSession',
                platform: platform,
                encryptedData: encryptedData,
                openTab: true
            });
            
            if (response?.success) {
                showMessage(`✅ ${platformName} abierta correctamente`, 'success', 2000);
                autoCloseTimeout = setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                showMessage(`❌ ${response?.error || 'Error al restaurar'}`, 'error', 3000);
            }
            
            isRestoring = false;
            
        } catch(e) {
            showMessage(`❌ Error: ${e.message}`, 'error', 3000);
            isRestoring = false;
        }
    }
    
    // ============================================================
    // PANEL NETFLIX: INGRESAR / 3 TOKENS
    // ============================================================
    async function copyText(txt, btn) {
        if (!txt) return;
        try {
            await navigator.clipboard.writeText(txt);
            if (btn) {
                const antes = btn.textContent;
                btn.classList.add('done');
                btn.textContent = '✓';
                setTimeout(() => {
                    btn.classList.remove('done');
                    btn.textContent = antes;
                }, 1200);
            }
        } catch(e) {}
    }

    function setNfStatus(text, type = '') {
        nfStatusEl.textContent = text;
        nfStatusEl.className = 'nf-status ' + type;
    }

    function formatExpiry(ms) {
        if (!ms) return '';
        const d = new Date(typeof ms === 'number' ? ms : Number(ms));
        if (isNaN(d.getTime())) return '';
        return d.toLocaleString();
    }

    function renderNfTokens(isPc) {
        if (!nfTokens) {
            nfTokensList.classList.add('hidden');
            return;
        }
        nfTokensList.classList.remove('hidden');
        const keys = isPc ? ['phone', 'desktop', 'tv'] : ['phone', 'tv'];
        for (const k of ['phone', 'desktop', 'tv']) {
            const row = nfTokensList.querySelector(`[data-ntk="${k}"]`);
            if (!row) continue;
            if (keys.includes(k) && nfTokens[k]) row.classList.remove('hidden');
            else row.classList.add('hidden');
        }
        const extra = formatExpiry(nfTokens.expires);
        setNfStatus(extra ? 'Tokens listos ✔ · expira: ' + extra : 'Tokens listos ✔', 'ok');
    }

    async function genNfTokens(codeText, isPc) {
        if (nfGenerating) return;
        nfGenerating = true;
        setNfStatus('Generando tokens…');
        try {
            const r = await chrome.runtime.sendMessage({ action: 'genTokens', text: codeText });
            if (!r?.success) throw new Error(r?.error || 'Error al generar tokens');
            nfTokens = {
                code: codeText,
                phone: r.tokens.phone || '',
                desktop: r.tokens.desktop || '',
                tv: r.tokens.tv || '',
                expires: r.expires,
                mintedAt: Date.now()
            };
            await chrome.storage.local.set({ nfTokens });
            renderNfTokens(isPc);
        } catch(e) {
            setNfStatus('✗ ' + e.message, 'err');
        } finally {
            nfGenerating = false;
        }
    }

    async function ensureNfTokens(codeText, isPc) {
        try {
            const st = await chrome.storage.local.get('nfTokens');
            if (st.nfTokens && codeText && st.nfTokens.code === codeText) {
                nfTokens = st.nfTokens;
                renderNfTokens(isPc);
                return;
            }
        } catch(e) {}
        await genNfTokens(codeText, isPc);
    }

    function showNetflixOptions(encryptedData, codeText) {
        pendingNetflix = { encryptedData, codeText };
        hbomaxCleaner.classList.remove('show');
        netflixPanel.classList.remove('hidden');
        nfTokensList.classList.add('hidden');
        setNfStatus('');
        
        const isPc = !isAndroidDevice();
        // En PC se ofrece Ingresar + los 3 tokens (la web reproduce).
        // En Android no hay Ingresar y solo se muestran Teléfono/TV.
        if (nfIngresarBtn) nfIngresarBtn.classList.toggle('hidden', !isPc);
        if (nfNoteEl) {
            nfNoteEl.textContent = isPc
                ? '⚠️ Nota: Si un TOKEN generado falla y no te accede es por la región. Prueba con otra cuenta. '
                : 'Web no reproduce en Android → utiliza un token';
        }
        
        ensureNfTokens(codeText, isPc);
    }

    function hideNetflixOptions() {
        netflixPanel.classList.add('hidden');
        pendingNetflix = null;
    }

    // ============================================================
    // DETECCIÓN AUTOMÁTICA EN PC
    // ============================================================
    async function checkAndProcessClipboard() {
        if (isRestoring) return;
        
        const text = await readClipboard();
        if (text === lastClipboardText) return;
        lastClipboardText = text;

        if (!text?.startsWith('premium_id:')) {
            hideNetflixOptions();
        }
        
        if (text?.startsWith('premium_id:')) {
            const parts = text.split(':');
            const platform = parts[1];
            const platformName = platforms[platform]?.name || platform;
            
            if (platform && platforms[platform]) {
                const encryptedData = parts.slice(4).join(':');
                
                if (platform === 'netflix') {
                    showNetflixOptions(encryptedData, text);
                    return;
                }
                
                if (platform === 'hbomax') {
                    pendingRestore = {
                        platform: platform,
                        encryptedData: encryptedData,
                        platformName: platformName
                    };
                    
                    hbomaxCleaner.classList.add('show');
                    showMessage(`📋 Código de ${platformName} detectado. Limpia cookies o pulsa el logo.`, 'info', 5000);
                    return;
                }
                
                hbomaxCleaner.classList.remove('show');
                showMessage(`🔍 Código detectado para ${platformName}. Restaurando...`, 'info', 2000);
                await restoreSession(platform, encryptedData, platformName);
                
            } else {
                showMessage(`⚠️ Código inválido`, 'error', 2500);
                hbomaxCleaner.classList.remove('show');
            }
        } else {
            hbomaxCleaner.classList.remove('show');
        }
    }
    
    // ============================================================
    // CLIC MANUAL EN LOGO
    // ============================================================
    platformCards.forEach(card => {
        card.addEventListener('click', async function() {
            const platform = this.dataset.platform;
            if (!platform) return;
            
            const text = await readClipboard();
            if (!text?.startsWith('premium_id:')) {
                showMessage('❌ No hay código válido en el portapapeles', 'error', 3000);
                return;
            }
            
            const parts = text.split(':');
            const codePlatform = parts[1];
            
            if (codePlatform !== platform) {
                const platformName = platforms[codePlatform]?.name || codePlatform;
                showMessage(`⚠️ El código es para ${platformName}`, 'warning', 3000);
                return;
            }
            
            const encryptedData = parts.slice(4).join(':');
            const platformName = platforms[platform]?.name || platform;
            
            if (platform === 'netflix') {
                showNetflixOptions(encryptedData, text);
                return;
            }
            
            if (platform === 'hbomax') {
                pendingRestore = {
                    platform: platform,
                    encryptedData: encryptedData,
                    platformName: platformName
                };
                hbomaxCleaner.classList.add('show');
                showMessage(`📋 Código de ${platformName} listo. Limpia cookies o pulsa el logo.`, 'info', 3000);
                return;
            }
            
            hbomaxCleaner.classList.remove('show');
            await restoreSession(platform, encryptedData, platformName);
        });
    });
    
    // ============================================================
    // EVENTO DEL BOTÓN LIMPIAR
    // ============================================================
    if (cleanBtn) {
        cleanBtn.addEventListener('click', clearHboMaxCookies);
    }
    
    // ============================================================
    // EVENTOS DEL PANEL NETFLIX
    // ============================================================
    if (nfIngresarBtn) {
        nfIngresarBtn.addEventListener('click', () => {
            if (!pendingNetflix) return;
            hbomaxCleaner.classList.remove('show');
            restoreSession('netflix', pendingNetflix.encryptedData, 'Netflix');
        });
    }
    
    if (nfRegenBtn) {
        nfRegenBtn.addEventListener('click', () => {
            if (pendingNetflix) genNfTokens(pendingNetflix.codeText, !isAndroidDevice());
        });
    }
    
    if (nfTokensList) {
        nfTokensList.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b || !nfTokens) return;
            const k = b.dataset.ntk;
            const url = nfTokens[k];
            if (!url) return;
            if (b.classList.contains('ir')) {
                chrome.tabs.create({ url: url, active: true });
                window.close();
            } else if (b.classList.contains('cp')) {
                copyText(url, b);
            }
        });
    }
    
    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    // El polling corre SIEMPRE: en PC lee el portapapeles automáticamente;
    // en Android la lectura falla (se ignora en silencio) y se usa el logo.
    setInterval(checkAndProcessClipboard, 1000);
    setTimeout(checkAndProcessClipboard, 300);

    if (isAndroidDevice()) {
        showMessage('📱 Modo Android: pulsa el logo de la plataforma', 'info', 4000);
        console.log('🔥 PREMIUM ID v10.0 - MODO ANDROID');
    } else {
        console.log('🔥 PREMIUM ID v10.0 - MODO PC (Detección automática)');
    }
});