// PREMIUM ID - Popup v5.0

document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status-message');
    const instructionBox = document.querySelector('.instruction-box');
    const instructionIcon = instructionBox.querySelector('i');
    const instructionText = instructionBox.querySelector('span');
    
    let currentWarningPlatform = null;
    let isChecking = false;
    let originalInstructionText = 'COPIA EL CÓDIGO ID';
    let originalInstructionIcon = 'fas fa-key';
    
    const platforms = {
        netflix: { name: 'Netflix', color: '#E50914' },
        crunchyroll: { name: 'Crunchyroll', color: '#F47521' },
        prime: { name: 'Prime Video', color: '#00A8E1' },
        paramount: { name: 'Paramount+', color: '#0066FF' },
        viki: { name: 'Rakuten Viki', color: '#9B59B6' },
        atresplayer: { name: 'AtresPlayer', color: '#E60000' }
    };
    
    // Función para crear efecto ripple
    function createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(212, 175, 55, 0.6) 0%, rgba(212, 175, 55, 0) 70%);
            border-radius: 50%;
            top: ${y}px;
            left: ${x}px;
            transform: scale(0);
            animation: rippleAnim 0.6s ease-out;
            pointer-events: none;
            z-index: 10;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Función para restaurar el texto original de la instrucción
    function restoreInstructionText() {
        if (currentWarningPlatform) return;
        
        instructionIcon.className = originalInstructionIcon;
        instructionText.innerHTML = originalInstructionText;
        instructionText.style.background = 'linear-gradient(135deg, #D4AF37, #F5E6B3)';
        instructionText.style.webkitBackgroundClip = 'text';
        instructionText.style.backgroundClip = 'text';
        instructionText.style.color = 'transparent';
        instructionText.style.display = 'inline';
        
        const existingBtn = instructionBox.querySelector('.telegram-inline-btn');
        if (existingBtn) existingBtn.remove();
    }
    
    // Función para cambiar temporalmente el texto de la instrucción (al hacer clic)
    function changeInstructionTextTemporary(newText, newIcon = 'fas fa-copy') {
        if (currentWarningPlatform) return;
        
        instructionIcon.className = newIcon;
        instructionText.innerHTML = newText;
        instructionText.style.background = 'none';
        instructionText.style.color = '#D4AF37';
        instructionText.style.display = 'inline';
        
        setTimeout(() => {
            restoreInstructionText();
        }, 3000);
    }
    
    // Función para mostrar mensaje de sesión cerrada en el área de instrucción
    function setWarningInstructionText(platformName, platformColor) {
        if (!instructionBox || !instructionText) return;
        
        instructionBox.classList.add('warning');
        instructionIcon.className = 'fas fa-skull';
        
        instructionText.innerHTML = '';
        instructionText.style.background = 'none';
        instructionText.style.color = platformColor;
        instructionText.style.display = 'flex';
        instructionText.style.alignItems = 'center';
        instructionText.style.gap = '12px';
        instructionText.style.flexWrap = 'wrap';
        instructionText.style.justifyContent = 'center';
        
        const warningSpan = document.createElement('span');
        warningSpan.innerHTML = `<strong style="color: ${platformColor}">${platformName}</strong> SESIÓN CERRADA`;
        warningSpan.style.fontWeight = '700';
        
        const telegramBtn = document.createElement('a');
        telegramBtn.href = 'https://t.me/cuentaspremiumid';
        telegramBtn.target = '_blank';
        telegramBtn.className = 'telegram-inline-btn';
        telegramBtn.innerHTML = '<i class="fab fa-telegram"></i> AVISAR POR TELEGRAM';
        
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
    
    function setPermanentMessage(platform) {
        const platformName = platforms[platform]?.name || platform;
        const platformColor = platforms[platform]?.color || '#F47521';
        
        currentWarningPlatform = platform;
        
        setWarningInstructionText(platformName, platformColor);
        
        document.querySelectorAll('.platform-card').forEach(el => {
            el.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            el.style.background = 'linear-gradient(135deg, rgba(30, 25, 45, 0.8), rgba(20, 16, 30, 0.6))';
        });
        
        const targetCard = document.querySelector(`.platform-card.${platform}`);
        if (targetCard) {
            targetCard.style.border = `2px solid ${platformColor}`;
        }
        
        statusDiv.innerHTML = '';
    }
    
    function clearPermanentMessage() {
        currentWarningPlatform = null;
        statusDiv.innerHTML = '';
        
        instructionBox.classList.remove('warning');
        restoreInstructionText();
        
        document.querySelectorAll('.platform-card').forEach(el => {
            el.style.border = '1px solid rgba(255, 255, 255, 0.05)';
            el.style.background = 'linear-gradient(135deg, rgba(30, 25, 45, 0.8), rgba(20, 16, 30, 0.6))';
        });
    }
    
    function showTemporaryMessage(text) {
        if (currentWarningPlatform) return;
        statusDiv.innerHTML = `<div style="font-size: 12px; padding: 8px 12px; color: #D4AF37; background: rgba(212, 175, 55, 0.1); border-radius: 12px; animation: pulseGlow 1s infinite;">${text}</div>`;
        setTimeout(() => {
            if (!currentWarningPlatform && statusDiv.innerHTML.includes(text)) {
                statusDiv.innerHTML = '';
            }
        }, 3500);
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
        showTemporaryMessage(`🔍 Verificando ${platforms[platform].name}...`);
        
        const originalIconClass = instructionIcon.className;
        instructionIcon.style.animation = 'spin 1s linear infinite';
        
        try {
            const verifyRes = await chrome.runtime.sendMessage({
                action: 'verifySession',
                platform: platform,
                encryptedData: encryptedData
            });
            
            instructionIcon.style.animation = '';
            instructionIcon.className = originalIconClass;
            
            if (!verifyRes?.isValid) {
                setPermanentMessage(platform);
                isChecking = false;
                return;
            }
            
            if (currentWarningPlatform) clearPermanentMessage();
            
            const restoreRes = await chrome.runtime.sendMessage({
                action: 'restoreSession',
                platform: platform,
                encryptedData: encryptedData
            });
            
            if (restoreRes?.success) {
                showTemporaryMessage(`✅ ${platforms[platform].name} abierta correctamente`);
                setTimeout(() => window.close(), 800);
            } else {
                setPermanentMessage(platform);
            }
            
        } catch(e) {
            instructionIcon.style.animation = '';
            setPermanentMessage(platform);
        } finally {
            isChecking = false;
        }
    }
    
    // Click en plataformas - Con efecto ripple
    document.querySelectorAll('.platform-card').forEach(card => {
        card.addEventListener('click', (event) => {
            const platform = card.dataset.platform;
            if (platform && !currentWarningPlatform) {
                createRipple(event, card);
                changeInstructionTextTemporary('COPIA EL CÓDIGO DEL PASTE Y ABRE LA EXTENSIÓN', 'fas fa-clipboard-list');
            }
        });
    });
    
    setInterval(detectAndAutoRestore, 3000);
    setTimeout(detectAndAutoRestore, 500);
    
    console.log('🔥 PREMIUM ID - Official Extension');
});