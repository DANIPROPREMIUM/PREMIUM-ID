// PREMIUM ID - Popup PÚBLICO v5.0 (HBO Max con botón limpiar)

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status-message');
    const platformCards = document.querySelectorAll('.platform-card');
    const hbomaxCleaner = document.getElementById('hbomax-cleaner');
    const cleanBtn = document.getElementById('clean-hbomax-cookies');
    
    let isRestoring = false;
    let messageTimeout = null;
    let autoCloseTimeout = null;
    let lastClipboardText = null;
    let isAndroidDevice = /Android/i.test(navigator.userAgent);
    let pendingRestore = null; // Guardar datos de restauración pendiente
    
    const platforms = {
        netflix: { name: 'Netflix', url: 'https://www.netflix.com/browse' },
        crunchyroll: { name: 'Crunchyroll', url: 'https://www.crunchyroll.com' },
        prime: { name: 'Prime Video', url: 'https://www.primevideo.com' },
        paramount: { name: 'Paramount+', url: 'https://www.paramountplus.com' },
        viki: { name: 'Rakuten Viki', url: 'https://www.viki.com' },
        atresplayer: { name: 'AtresPlayer', url: 'https://www.atresplayer.com' },
        hbomax: { name: 'HBO Max', url: 'https://play.hbomax.com' }
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
            
            // Limpiar cookies sin dominio específico
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
            
            // 🔥 RESTAURAR LA SESIÓN PENDIENTE DESPUÉS DE LIMPIAR
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
    // DETECCIÓN AUTOMÁTICA EN PC (CON PAUSA PARA HBO MAX)
    // ============================================================
    async function checkAndProcessClipboard() {
        if (isRestoring) return;
        if (isAndroidDevice) return;
        
        const text = await readClipboard();
        if (text === lastClipboardText) return;
        lastClipboardText = text;
        
        if (text?.startsWith('premium_id:')) {
            const parts = text.split(':');
            const platform = parts[1];
            const platformName = platforms[platform]?.name || platform;
            
            if (platform && platforms[platform]) {
                const encryptedData = parts.slice(4).join(':');
                
                // ============================================================
                // HBO MAX: MOSTRAR BOTÓN Y NO RESTAURAR AUTOMÁTICAMENTE
                // ============================================================
                if (platform === 'hbomax') {
                    // Guardar datos para restaurar después de limpiar
                    pendingRestore = {
                        platform: platform,
                        encryptedData: encryptedData,
                        platformName: platformName
                    };
                    
                    // Mostrar el botón limpiar
                    hbomaxCleaner.classList.add('show');
                    
                    // Mostrar mensaje
                    showMessage(`📋 Código de ${platformName} detectado. Limpia cookies o pulsa el logo.`, 'info', 5000);
                    
                    // NO cerrar el popup, NO restaurar automáticamente
                    return;
                }
                
                // ============================================================
                // OTRAS PLATAFORMAS: RESTAURAR AUTOMÁTICAMENTE
                // ============================================================
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
    // CLIC MANUAL EN LOGO (PARA TODAS LAS PLATAFORMAS)
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
            
            // Verificar que la plataforma coincida
            if (codePlatform !== platform) {
                const platformName = platforms[codePlatform]?.name || codePlatform;
                showMessage(`⚠️ El código es para ${platformName}`, 'warning', 3000);
                return;
            }
            
            const encryptedData = parts.slice(4).join(':');
            const platformName = platforms[platform]?.name || platform;
            
            // Si es HBO Max, mostrar el botón limpiar
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
            
            // Otras plataformas: restaurar directamente
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
    // INICIALIZACIÓN
    // ============================================================
    if (isAndroidDevice) {
        showMessage('📱 Modo Android: Pulsa el logo para restaurar', 'info', 4000);
        console.log('🔥 PREMIUM ID - MODO ANDROID');
    } else {
        setInterval(checkAndProcessClipboard, 1000);
        setTimeout(checkAndProcessClipboard, 300);
        console.log('🔥 PREMIUM ID - MODO PC (Detección automática)');
    }
});