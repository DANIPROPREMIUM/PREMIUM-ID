// PREMIUM ID - Popup PÚBLICO v5.0

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status-message');
    const platformCards = document.querySelectorAll('.platform-card');
    
    let isRestoring = false;
    let messageTimeout = null;
    let autoCloseTimeout = null;
    let lastClipboardText = null;
    let isAndroidDevice = /Android/i.test(navigator.userAgent);
    
    const platforms = {
        netflix: { name: 'Netflix', url: 'https://www.netflix.com/browse' },
        crunchyroll: { name: 'Crunchyroll', url: 'https://www.crunchyroll.com' },
        prime: { name: 'Prime Video', url: 'https://www.primevideo.com' },
        paramount: { name: 'Paramount+', url: 'https://www.paramountplus.com' },
        viki: { name: 'Rakuten Viki', url: 'https://www.viki.com' },
        atresplayer: { name: 'AtresPlayer', url: 'https://www.atresplayer.com' },
        hbomax: { name: 'HBO Max', url: 'https://play.hbomax.com' }  // ← CAMBIADO
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
    
    // DETECCIÓN AUTOMÁTICA EN PC
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
                showMessage(`🔍 Código detectado para ${platformName}. Restaurando...`, 'info', 2000);
                await restoreSession(platform, encryptedData, platformName);
            } else {
                showMessage(`⚠️ Código inválido o plataforma no soportada`, 'error', 2500);
            }
        }
    }
    
    // CLIC MANUAL
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
            await restoreSession(platform, encryptedData, platforms[platform]?.name || platform);
        });
    });
    
    // INICIALIZACIÓN
    if (isAndroidDevice) {
        showMessage('📱 Modo Android: Pulsa el logo para restaurar', 'info', 4000);
        console.log('🔥 PREMIUM ID - MODO ANDROID');
    } else {
        setInterval(checkAndProcessClipboard, 1000);
        setTimeout(checkAndProcessClipboard, 300);
        console.log('🔥 PREMIUM ID - MODO PC (Detección automática)');
    }
});