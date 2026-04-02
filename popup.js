// PREMIUM ID - Popup v4.0 

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status-message');
    const instructionArea = document.querySelector('.instruction-area');
    
    let currentWarningPlatform = null;
    let isChecking = false;
    
    const platforms = {
        netflix: { name: 'Netflix', color: '#E50914' },
        crunchyroll: { name: 'Crunchyroll', color: '#F47521' },
        prime: { name: 'Prime Video', color: '#00A8E1' },
        paramount: { name: 'Paramount+', color: '#0066FF' },
        viki: { name: 'Rakuten Viki', color: '#9B59B6' },
        atresplayer: { name: 'AtresPlayer', color: '#FF4D4D' }
    };
    
    function updateInstructionArea(platform) {
        if (platform && platforms[platform]) {
            instructionArea.classList.add('code-ready');
            instructionArea.style.borderColor = platforms[platform].color;
        } else {
            instructionArea.classList.remove('code-ready');
            instructionArea.style.borderColor = '';
        }
    }
    
    function setPermanentMessage(platform) {
        const platformName = platforms[platform]?.name || platform;
        const platformColor = platforms[platform]?.color || '#F47521';
        
        currentWarningPlatform = platform;
        
        const instructionText = document.querySelector('.instruction-text');
        if (instructionText) {
            instructionText.innerHTML = 'SESIÓN CERRADA';
            instructionText.style.background = 'none';
            instructionText.style.color = '#FF0000';
            instructionText.style.textShadow = '0 0 5px #FF0000';
            instructionText.style.animation = 'blinkRed 0.8s ease-in-out infinite';
        }
        
        const allPlatformTexts = document.querySelectorAll('.platform-text');
        allPlatformTexts.forEach(el => {
            el.classList.remove('platform-warning');
            const existingIcon = el.querySelector('.warning-icon-inline');
            if (existingIcon) existingIcon.remove();
        });
        
        const targetPlatform = document.querySelector(`.platform-text.${platform}`);
        if (targetPlatform) {
            targetPlatform.classList.add('platform-warning');
            const iconSpan = document.createElement('span');
            iconSpan.className = 'warning-icon-inline';
            iconSpan.textContent = '⚠️ ';
            targetPlatform.prepend(iconSpan);
        }
        
        statusDiv.innerHTML = `
            <div class="status-warning permanent-warning" style="background: transparent; border-left: none; padding: 8px 0;">
                La sesión de <span style="color: ${platformColor}; font-weight: bold;">${platformName}</span> está cerrada. 
                <a href="https://t.me/cuentaspremiumid" target="_blank" class="telegram-link-warning">Avisa por Telegram</a> y espera un código nuevo.
            </div>
        `;
    }
    
    function clearPermanentMessage() {
        currentWarningPlatform = null;
        statusDiv.innerHTML = '';
        
        const instructionText = document.querySelector('.instruction-text');
        if (instructionText) {
            instructionText.innerHTML = 'COPIA UN CÓDIGO ID PARA ACCEDER';
            instructionText.style.background = 'linear-gradient(135deg, #D4AF37, #F5E6B3, #D4AF37)';
            instructionText.style.webkitBackgroundClip = 'text';
            instructionText.style.backgroundClip = 'text';
            instructionText.style.color = 'transparent';
            instructionText.style.textShadow = '0 0 10px rgba(212, 175, 55, 0.3)';
            instructionText.style.animation = 'none';
        }
        
        const allPlatformTexts = document.querySelectorAll('.platform-text');
        allPlatformTexts.forEach(el => {
            el.classList.remove('platform-warning');
            const existingIcon = el.querySelector('.warning-icon-inline');
            if (existingIcon) existingIcon.remove();
        });
    }
    
    function showTemporaryMessage(text, type = 'info') {
        if (currentWarningPlatform) return;
        statusDiv.innerHTML = `<div class="status-${type}">${text}</div>`;
        setTimeout(() => {
            if (statusDiv.innerHTML.includes(text) && !currentWarningPlatform) {
                statusDiv.innerHTML = '';
            }
        }, 3000);
    }
    
    async function readClipboard() {
        try {
            return await navigator.clipboard.readText();
        } catch(e) {
            return null;
        }
    }
    
    async function detectAndAutoRestore() {
        if (isChecking) return;
        
        const text = await readClipboard();
        if (!text?.startsWith('premium_id:')) {
            if (currentWarningPlatform) clearPermanentMessage();
            return;
        }
        
        const parts = text.split(':');
        const platform = parts[1];
        if (!platforms[platform]) return;
        
        const encryptedData = parts.slice(4).join(':');
        
        if (currentWarningPlatform === platform) return;
        
        isChecking = true;
        updateInstructionArea(platform);
        showTemporaryMessage(`🔍 Verificando ${platforms[platform].name}...`, 'info');
        
        try {
            const verifyRes = await chrome.runtime.sendMessage({
                action: 'verifySession',
                platform: platform,
                encryptedData: encryptedData
            });
            
            if (!verifyRes?.isValid) {
                console.log(`[POPUP] ❌ Sesión de ${platform} cerrada`);
                setPermanentMessage(platform);
                isChecking = false;
                return;
            }
            
            console.log(`[POPUP] ✅ Sesión de ${platform} válida, restaurando...`);
            
            if (currentWarningPlatform) clearPermanentMessage();
            
            const restoreRes = await chrome.runtime.sendMessage({
                action: 'restoreSession',
                platform: platform,
                encryptedData: encryptedData
            });
            
            if (restoreRes?.success) {
                showTemporaryMessage(`✅ ${platforms[platform].name} abierta`, 'success');
                setTimeout(() => window.close(), 800);
            } else {
                setPermanentMessage(platform);
            }
            
        } catch(e) {
            console.error('Error:', e);
            setPermanentMessage(platform);
        } finally {
            isChecking = false;
        }
    }
    
    // Iniciar detección automática
    setInterval(detectAndAutoRestore, 3000);
    setTimeout(detectAndAutoRestore, 500);
    
    console.log('🔥 PREMIUM ID');
});