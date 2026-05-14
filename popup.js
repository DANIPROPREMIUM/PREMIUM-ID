// PREMIUM ID - Popup v5.0 PÚBLICO
// PC: Detección automática al abrir la extensión
// Android: Mensaje de advertencia y verificación manual

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

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status-message');
    const instructionBox = document.querySelector('.instruction-box');
    const instructionIcon = instructionBox?.querySelector('i');
    const instructionText = instructionBox?.querySelector('span');
    const platformCards = document.querySelectorAll('.platform-card');
    
    let isProcessing = false;
    let messageTimeout = null;
    let autoCloseTimeout = null;
    let lastClipboardText = null;
    
    // Detectar si es Android
    const isAndroidDevice = /Android/i.test(navigator.userAgent);
    
    const platforms = {
        netflix: { name: 'Netflix', url: 'https://www.netflix.com/browse', color: '#E50914' },
        crunchyroll: { name: 'Crunchyroll', url: 'https://www.crunchyroll.com', color: '#F47521' },
        prime: { name: 'Prime Video', url: 'https://www.primevideo.com', color: '#00A8E1' },
        paramount: { name: 'Paramount+', url: 'https://www.paramountplus.com', color: '#0066FF' },
        viki: { name: 'Rakuten Viki', url: 'https://www.viki.com', color: '#9B59B6' },
        atresplayer: { name: 'AtresPlayer', url: 'https://www.atresplayer.com', color: '#E60000' }
    };
    
    // Efecto de onda
    function createRipple(event, element) {
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Mensaje normal (PC)
    function showMessage(text, type = 'info', duration = 2500) {
        if (messageTimeout) clearTimeout(messageTimeout);
        const color = type === 'success' ? '#4CAF50' : type === 'error' ? '#FF5252' : '#D4AF37';
        statusDiv.innerHTML = `<span style="color: ${color};">${text}</span>`;
        messageTimeout = setTimeout(() => {
            if (statusDiv.innerHTML.includes(text)) statusDiv.innerHTML = '';
            messageTimeout = null;
        }, duration);
    }
    
    // Mensaje Android
    function showAndroidMessage(text, type = 'info', duration = 4000) {
        if (messageTimeout) clearTimeout(messageTimeout);
        
        const color = type === 'success' ? '#4CAF50' : type === 'error' ? '#FF5252' : '#D4AF37';
        const bgColor = type === 'error' ? 'rgba(128,0,128,0.9)' : 'rgba(0,0,0,0.8)';
        
        statusDiv.innerHTML = `
            <div style="background: ${bgColor}; padding: 12px 8px; border-radius: 12px; margin: 4px 0; border-left: 3px solid ${color};">
                <span style="color: ${color}; font-weight: bold; font-size: 11px;">${text}</span>
            </div>
        `;
        
        void statusDiv.offsetHeight;
        
        if (!text.includes('SESIÓN CERRADA') && !text.includes('REPORTAR')) {
            messageTimeout = setTimeout(() => {
                if (statusDiv.innerHTML.includes(text)) statusDiv.innerHTML = '';
                messageTimeout = null;
            }, duration);
        }
    }
    
    // ============================================================
    // MENSAJE DE SESIÓN CERRADA (PC y Android)
    // ============================================================
    function showSessionClosedMessage(platformName, platformColor) {
        if (messageTimeout) clearTimeout(messageTimeout);
        isProcessing = false;
        const platformUpper = platformName.toUpperCase();
        
        if (instructionBox && instructionIcon && instructionText) {
            instructionBox.classList.add('warning');
            instructionIcon.className = 'fas fa-skull';
            instructionIcon.style.animation = 'skullBlink 0.6s ease-in-out infinite';
            
            instructionText.innerHTML = '';
            instructionText.style.background = 'none';
            instructionText.style.color = '#FFD700';
            instructionText.style.display = 'flex';
            instructionText.style.alignItems = 'center';
            instructionText.style.gap = '8px';
            instructionText.style.flexWrap = 'wrap';
            instructionText.style.justifyContent = 'center';

            const warningSpan = document.createElement('span');
            warningSpan.innerHTML = `<strong style="color:#FFD700; animation: textBlink 0.6s ease-in-out infinite; text-transform: uppercase;">💀 ${platformUpper} - SESIÓN CERRADA 💀</strong>`;
            warningSpan.style.fontWeight = '900';
            warningSpan.style.fontSize = '11px';

            const telegramBtn = document.createElement('a');
            telegramBtn.href = 'https://t.me/cuentaspremiumid';
            telegramBtn.target = '_blank';
            telegramBtn.className = 'telegram-inline-btn';
            telegramBtn.innerHTML = '<i class="fab fa-telegram"></i> REPORTAR';
            telegramBtn.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: #0088cc;
                color: white;
                text-decoration: none;
                padding: 4px 10px;
                border-radius: 40px;
                font-size: 9px;
                font-weight: 700;
                transition: all 0.2s ease;
            `;
            
            telegramBtn.addEventListener('mouseenter', () => {
                telegramBtn.style.background = '#0099dd';
                telegramBtn.style.transform = 'scale(1.02)';
            });
            telegramBtn.addEventListener('mouseleave', () => {
                telegramBtn.style.background = '#0088cc';
                telegramBtn.style.transform = 'scale(1)';
            });

            instructionText.appendChild(warningSpan);
            instructionText.appendChild(telegramBtn);
        }
        
        statusDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(128, 0, 128, 0.95), rgba(75, 0, 130, 0.95)); 
                        color: #FFD700; 
                        font-size: 11px; 
                        padding: 12px 8px; 
                        text-align: center; 
                        animation: statusBlink 0.6s ease-in-out infinite;
                        border-radius: 12px;
                        border: 1px solid #D4AF37;
                        font-weight: bold;">
                💀 <span style="text-transform: uppercase;">${platformUpper}</span> - SESIÓN CERRADA 💀<br>
                📢 <a href="https://t.me/cuentaspremiumid" target="_blank" style="color: #88ccff; text-decoration: none;">REPORTAR POR TELEGRAM</a>
            </div>
        `;
    }
    
    // Restaurar instruction box
    function restoreInstructionText() {
        if (instructionBox) instructionBox.classList.remove('warning');
        if (instructionIcon) {
            instructionIcon.className = 'fas fa-clipboard-list';
            instructionIcon.style.animation = '';
        }
        if (instructionText) {
            instructionText.innerHTML = 'PEGA UN CÓDIGO ID';
            instructionText.style.background = 'linear-gradient(135deg, #D4AF37, #F5E6B3)';
            instructionText.style.webkitBackgroundClip = 'text';
            instructionText.style.backgroundClip = 'text';
            instructionText.style.color = 'transparent';
            instructionText.style.display = 'inline';
        }
        const existingBtn = instructionBox?.querySelector('.telegram-inline-btn');
        if (existingBtn) existingBtn.remove();
    }
    
    // Leer portapapeles
    async function readClipboard() {
        try { 
            return await navigator.clipboard.readText();
        } catch(e) { 
            return null; 
        }
    }
    
    // ============================================================
    // FUNCIÓN PARA RESTAURAR SESIÓN (PC y Android)
    // ============================================================
    async function restoreSession(platform, encryptedData, platformName, platformColor, shouldOpenTab = true) {
        if (isProcessing) return;
        isProcessing = true;
        
        try {
            if (platform === 'netflix' && !isNetflixAllowed()) {
                showMessage(`🚫 Netflix solo funciona en PC Windows`, 'error', 4000);
                isProcessing = false;
                return;
            }
            
            const verifyRes = await chrome.runtime.sendMessage({
                action: 'verifySession',
                platform: platform,
                encryptedData: encryptedData
            });
            
            if (!verifyRes?.isValid) {
                showSessionClosedMessage(platformName, platformColor);
                isProcessing = false;
                return;
            }
            
            showMessage(`🔍 Abriendo ${platformName}...`, 'info', 2000);
            
            const restoreRes = await chrome.runtime.sendMessage({
                action: 'restoreSession',
                platform: platform,
                encryptedData: encryptedData,
                openTab: shouldOpenTab
            });
            
            if (restoreRes?.success) {
                showMessage(`✅ ${platformName} abierta correctamente`, 'success', 2000);
                restoreInstructionText();
                
                autoCloseTimeout = setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                showSessionClosedMessage(platformName, platformColor);
                isProcessing = false;
            }
        } catch(e) {
            showSessionClosedMessage(platformName, platformColor);
            isProcessing = false;
        }
    }
    
    // ============================================================
    // DETECCIÓN AUTOMÁTICA PARA PC
    // ============================================================
    async function checkAndProcessClipboard() {
        if (isProcessing) return;
        if (isAndroidDevice) return; // Desactivado en Android
        
        const text = await readClipboard();
        if (text === lastClipboardText) return;
        lastClipboardText = text;
        
        if (text?.startsWith('premium_id:')) {
            const parts = text.split(':');
            const platform = parts[1];
            
            if (platform && platforms[platform]) {
                const platformData = platforms[platform];
                const encryptedData = parts.slice(4).join(':');
                
                restoreInstructionText();
                showMessage(`🔍 Código detectado. Verificando ${platformData.name}...`, 'info', 2000);
                await restoreSession(platform, encryptedData, platformData.name, platformData.color, true);
            } else {
                showMessage(`⚠️ Código inválido o plataforma no soportada`, 'error', 2500);
            }
        } else {
            restoreInstructionText();
        }
    }
    
    // ============================================================
    // FUNCIÓN PARA ANDROID (Solo verificación manual)
    // ============================================================
    async function verifyAndNotifyAndroid(platform, platformName, platformColor) {
        if (isProcessing) {
            showAndroidMessage(`⏳ Espera, ya estoy procesando...`, 'warning', 2000);
            return false;
        }
        
        isProcessing = true;
        
        showAndroidMessage(`📋 Leyendo código del portapapeles...`, 'info', 1500);
        const text = await readClipboard();
        
        if (!text?.startsWith('premium_id:')) {
            showAndroidMessage(`❌ No hay código ID válido en el portapapeles. Cópialo desde PASTE.MYST.RS`, 'error', 4000);
            isProcessing = false;
            return false;
        }
        
        const parts = text.split(':');
        const codePlatform = parts[1];
        
        if (codePlatform !== platform) {
            showAndroidMessage(`⚠️ El código es para ${platforms[codePlatform]?.name || codePlatform}, no para ${platformName}`, 'warning', 3500);
            isProcessing = false;
            return false;
        }
        
        const encryptedData = parts.slice(4).join(':');
        
        try {
            if (platform === 'netflix' && !isNetflixAllowed()) {
                showAndroidMessage(`🚫 Netflix solo funciona en PC Windows`, 'error', 4000);
                isProcessing = false;
                return false;
            }
            
            showAndroidMessage(`🔍 Verificando sesión de ${platformName.toUpperCase()}...`, 'info', 2000);
            
            const verifyRes = await chrome.runtime.sendMessage({
                action: 'verifySession',
                platform: platform,
                encryptedData: encryptedData
            });
            
            if (verifyRes?.isValid) {
                showAndroidMessage(`✅ ${platformName.toUpperCase()} - SESIÓN VÁLIDA`, 'success', 4000);
                showAndroidMessage(`📱 Abre la App o Web manualmente`, 'info', 3000);
                restoreInstructionText();
                isProcessing = false;
                return true;
            } else {
                showSessionClosedMessage(platformName, platformColor);
                isProcessing = false;
                return false;
            }
        } catch(e) {
            console.error("Error:", e);
            showSessionClosedMessage(platformName, platformColor);
            isProcessing = false;
            return false;
        }
    }
    
    // ============================================================
    // MENSAJE DE ADVERTENCIA PARA ANDROID (al abrir la extensión)
    // ============================================================
    function showWarningMessageAndroid() {
        if (instructionBox && instructionIcon && instructionText) {
            instructionBox.classList.add('warning');
            instructionIcon.className = 'fas fa-exclamation-triangle';
            instructionIcon.style.animation = 'skullBlink 0.8s ease-in-out infinite';
            instructionIcon.style.color = '#FFD700';
            
            instructionText.innerHTML = '';
            instructionText.style.background = 'none';
            instructionText.style.color = '#FFD700';
            instructionText.style.display = 'flex';
            instructionText.style.alignItems = 'center';
            instructionText.style.gap = '8px';
            instructionText.style.flexWrap = 'wrap';
            instructionText.style.justifyContent = 'center';
            
            const warningText = document.createElement('span');
            warningText.innerHTML = `⚠️ <strong>IMPORTANTE</strong> ⚠️`;
            warningText.style.fontSize = '12px';
            warningText.style.fontWeight = 'bold';
            
            instructionText.appendChild(warningText);
        }
        
        statusDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, rgba(128, 0, 128, 0.95), rgba(75, 0, 130, 0.95)); 
                        color: #FFD700; 
                        font-size: 10px; 
                        padding: 12px 8px; 
                        text-align: center;
                        border-radius: 12px;
                        border: 1px solid #D4AF37;
                        margin-bottom: 8px;">
                <div style="font-weight: bold; font-size: 12px; margin-bottom: 8px;">⚠️ AVISO IMPORTANTE ⚠️</div>
                <div>Si la sesión está <strong style="color: #ff8888;">CERRADA</strong>,</div>
                <div>la página <strong>redirigirá automáticamente al login</strong>.</div>
                <div style="margin-top: 8px;">📢 <strong>REPORTA la cuenta caída en Telegram</strong> 📢</div>
                <div style="margin-top: 10px;">
                    <a href="https://t.me/cuentaspremiumid" target="_blank" style="background: #0088cc; color: white; text-decoration: none; padding: 6px 12px; border-radius: 40px; font-size: 11px; display: inline-block;">
                        <i class="fab fa-telegram"></i> AVISAR POR TELEGRAM
                    </a>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            if (instructionBox) instructionBox.classList.remove('warning');
            if (instructionIcon) {
                instructionIcon.className = 'fas fa-clipboard-list';
                instructionIcon.style.animation = '';
                instructionIcon.style.color = '';
            }
            if (instructionText) {
                instructionText.innerHTML = 'PEGA UN CÓDIGO ID';
                instructionText.style.background = 'linear-gradient(135deg, #D4AF37, #F5E6B3)';
                instructionText.style.webkitBackgroundClip = 'text';
                instructionText.style.backgroundClip = 'text';
                instructionText.style.color = 'transparent';
                instructionText.style.display = 'inline';
            }
            statusDiv.innerHTML = '<span style="color: #D4AF37;">📋 Copia un código ID y pulsa el logo</span>';
            
            setTimeout(() => {
                if (statusDiv.innerHTML.includes('Pega un código')) {
                    statusDiv.innerHTML = '';
                }
            }, 5000);
        }, 8000);
    }
    
    // ========== EVENTOS DE CLICK (SOLO PARA ANDROID) ==========
    if (isAndroidDevice) {
        platformCards.forEach(card => {
            card.addEventListener('click', async (event) => {
                const platform = card.dataset.platform;
                if (platform && platforms[platform]) {
                    const platformName = platforms[platform].name;
                    const platformColor = platforms[platform].color;
                    
                    createRipple(event, card);
                    await verifyAndNotifyAndroid(platform, platformName, platformColor);
                }
            });
        });
    }
    
    // ============================================================
    // INICIALIZACIÓN
    // ============================================================
    if (isAndroidDevice) {
        // Android: Mostrar mensaje de advertencia al abrir
        setTimeout(() => {
            showWarningMessageAndroid();
        }, 500);
        console.log('🔥 PREMIUM ID v5.0 - MODO ANDROID (Solo verificación manual)');
    } else {
        // PC: Detección automática al abrir
        setInterval(checkAndProcessClipboard, 1000);
        setTimeout(checkAndProcessClipboard, 500);
        console.log('🔥 PREMIUM ID v5.0 - MODO PC (Detección automática)');
    }
});