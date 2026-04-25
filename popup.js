// PREMIUM ID - Popup v4.0 PÚBLICO (solo mensaje arriba)

function isNetflixAllowed() {
    const ua = navigator.userAgent;
    const tvPatterns = [
        /SmartTV/i, /Smart-TV/i, /SMART_TV/i,
        /Tizen/i, /WebOS/i, /Web0S/i,
        /HbbTV/i, /CrKey/i, /VIDAA/i,
        /Viera/i, /NetCast/i, /NETTV/i,
        /DLNADOC/i, /AppleTV/i, /googletv/i,
        /AndroidTV/i, /Android.*TV/i,
        /Roku/i, /Opera TV/i, /AFT/i
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
    const instructionIcon = instructionBox.querySelector('i');
    const instructionText = instructionBox.querySelector('span');

    let currentWarningPlatform = null;
    let currentIncompatiblePlatform = null;
    let isChecking = false;
    let lastClipboardText = null;
    let originalInstructionText = 'PEGA UN CÓDIGO ID';
    let originalInstructionIcon = 'fas fa-clipboard-list';

    const platforms = {
        netflix: { name: 'Netflix', color: '#E50914' },
        crunchyroll: { name: 'Crunchyroll', color: '#F47521' },
        prime: { name: 'Prime Video', color: '#00A8E1' },
        paramount: { name: 'Paramount+', color: '#0066FF' },
        viki: { name: 'Rakuten Viki', color: '#9B59B6' },
        atresplayer: { name: 'AtresPlayer', color: '#E60000' }
    };

    function createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        ripple.style.cssText = `
            position: absolute; width: ${size}px; height: ${size}px;
            background: radial-gradient(circle, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0) 70%);
            border-radius: 50%; top: ${y}px; left: ${x}px;
            transform: scale(0); animation: rippleAnim 0.6s ease-out;
            pointer-events: none; z-index: 10;
        `;
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    function restoreInstructionText() {
        if (currentWarningPlatform || currentIncompatiblePlatform) return;
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

    // Mensaje para código incompatible
    function setIncompatibleMessage() {
        if (!instructionBox || !instructionText) return;
        
        currentIncompatiblePlatform = 'incompatible';
        instructionBox.classList.add('warning');
        instructionIcon.className = 'fas fa-exclamation-triangle';
        instructionText.innerHTML = '';
        instructionText.style.background = 'none';
        instructionText.style.color = '#FF0000';
        instructionText.style.display = 'flex';
        instructionText.style.alignItems = 'center';
        instructionText.style.gap = '8px';
        instructionText.style.justifyContent = 'center';

        const warningSpan = document.createElement('span');
        warningSpan.innerHTML = `⚠️ CÓDIGO DE SESIÓN INCOMPATIBLE PARA V4 ⚠️`;
        warningSpan.style.fontWeight = '800';
        warningSpan.style.fontSize = '13px';
        warningSpan.style.letterSpacing = '0.5px';

        instructionText.appendChild(warningSpan);
        
        // Resetear bordes de plataformas
        document.querySelectorAll('.platform-card').forEach(el => {
            el.style.border = '1px solid rgba(255,255,255,0.05)';
            el.style.background = 'linear-gradient(135deg,rgba(30,25,45,0.8),rgba(20,16,30,0.6))';
        });
        
        // Limpiar mensaje inferior
        statusDiv.innerHTML = '';
    }

    // Mensaje para sesión cerrada (SOLO ARRIBA)
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
        warningSpan.innerHTML = `<strong style="color:${platformColor}">${platformName}</strong> SESIÓN CERRADA`;
        warningSpan.style.fontWeight = '700';

        const telegramBtn = document.createElement('a');
        telegramBtn.href = 'https://t.me/cuentaspremiumid';
        telegramBtn.target = '_blank';
        telegramBtn.className = 'telegram-inline-btn';
        telegramBtn.innerHTML = '<i class="fab fa-telegram"></i> AVISAR POR TELEGRAM';
        telegramBtn.addEventListener('mouseenter', () => { telegramBtn.style.background = '#0099dd'; telegramBtn.style.transform = 'scale(1.02)'; });
        telegramBtn.addEventListener('mouseleave', () => { telegramBtn.style.background = '#0088cc'; telegramBtn.style.transform = 'scale(1)'; });

        instructionText.appendChild(warningSpan);
        instructionText.appendChild(telegramBtn);
        
        // Limpiar mensaje inferior
        statusDiv.innerHTML = '';
    }

    function setPermanentMessage(platform) {
        const platformName = platforms[platform]?.name || platform;
        const platformColor = platforms[platform]?.color || '#F47521';
        currentWarningPlatform = platform;
        currentIncompatiblePlatform = null;
        setWarningInstructionText(platformName, platformColor);
        
        document.querySelectorAll('.platform-card').forEach(el => {
            el.style.border = '1px solid rgba(255,255,255,0.05)';
            el.style.background = 'linear-gradient(135deg,rgba(30,25,45,0.8),rgba(20,16,30,0.6))';
        });
        
        const targetCard = document.querySelector(`.platform-card.${platform}`);
        if (targetCard) targetCard.style.border = `2px solid ${platformColor}`;
        
        // NO mostrar mensaje inferior
        statusDiv.innerHTML = '';
    }

    function clearPermanentMessage() {
        currentWarningPlatform = null;
        currentIncompatiblePlatform = null;
        statusDiv.innerHTML = '';
        instructionBox.classList.remove('warning');
        restoreInstructionText();
        document.querySelectorAll('.platform-card').forEach(el => {
            el.style.border = '1px solid rgba(255,255,255,0.05)';
            el.style.background = 'linear-gradient(135deg,rgba(30,25,45,0.8),rgba(20,16,30,0.6))';
        });
    }

    function showTemporaryMessage(text, type = 'info') {
        if (currentWarningPlatform || currentIncompatiblePlatform) return;
        const color = type === 'error' ? '#FF5252' : type === 'success' ? '#4CAF50' : '#D4AF37';
        statusDiv.innerHTML = `<div style="font-size:12px;padding:8px 12px;color:${color};background:rgba(212,175,55,0.1);border-radius:12px;">${text}</div>`;
        setTimeout(() => {
            if (!currentWarningPlatform && !currentIncompatiblePlatform && statusDiv.innerHTML.includes(text)) {
                statusDiv.innerHTML = '';
            }
        }, 3500);
    }

    async function readClipboard() {
        try { return await navigator.clipboard.readText(); }
        catch(e) { return null; }
    }

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

    function isCodeCompatible(code) {
        const version = getCodeVersion(code);
        return version === 'V4';
    }

    function showNetflixDeviceBlock() {
        if (currentWarningPlatform === 'netflix_blocked') return;
        currentWarningPlatform = 'netflix_blocked';
        instructionBox.classList.add('warning');
        instructionIcon.className = 'fas fa-ban';
        instructionText.innerHTML = '';
        instructionText.style.background = 'none';
        instructionText.style.color = '#ff4444';
        instructionText.style.display = 'flex';
        instructionText.style.alignItems = 'center';
        instructionText.style.gap = '10px';
        instructionText.style.flexWrap = 'wrap';
        instructionText.style.justifyContent = 'center';

        const msg = document.createElement('span');
        msg.innerHTML = '🚫 <strong style="color:#ff4444">NETFLIX</strong> — Solo disponible en Windows';
        msg.style.fontWeight = '700';
        instructionText.appendChild(msg);

        statusDiv.innerHTML = '';
    }

    async function detectAndAutoRestore() {
        if (isChecking) return;

        const text = await readClipboard();
        if (text === lastClipboardText) return;
        lastClipboardText = text;

        if (!text?.startsWith('premium_id:')) {
            if (currentWarningPlatform || currentIncompatiblePlatform) clearPermanentMessage();
            return;
        }

        const parts = text.split(':');
        const platform = parts[1];
        if (!platforms[platform]) return;

        const encryptedData = parts.slice(4).join(':');
        
        // VERIFICAR VERSIÓN
        if (!isCodeCompatible(text)) {
            if (currentWarningPlatform) clearPermanentMessage();
            setIncompatibleMessage();
            return;
        }

        if (platform === 'netflix' && !isNetflixAllowed()) {
            showNetflixDeviceBlock();
            return;
        }

        if (currentWarningPlatform === platform) return;

        isChecking = true;
        showTemporaryMessage(`🔍 Verificando ${platforms[platform].name}...`);
        instructionIcon.style.animation = 'spin 1s linear infinite';
        const savedIconClass = instructionIcon.className;

        try {
            const verifyRes = await chrome.runtime.sendMessage({
                action: 'verifySession',
                platform: platform,
                encryptedData: encryptedData
            });

            instructionIcon.style.animation = '';
            instructionIcon.className = savedIconClass;

            if (!verifyRes?.isValid) {
                setPermanentMessage(platform);
                return;
            }

            if (currentWarningPlatform) clearPermanentMessage();

            showTemporaryMessage(`✅ Sesión válida. Abriendo ${platforms[platform].name}...`, 'success');

            const restoreRes = await chrome.runtime.sendMessage({
                action: 'restoreSession',
                platform: platform,
                encryptedData: encryptedData
            });

            if (restoreRes?.success) {
                showTemporaryMessage(`🎉 ${platforms[platform].name} abierta correctamente`, 'success');
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

    document.querySelectorAll('.platform-card').forEach(card => {
        card.addEventListener('click', (event) => {
            const platform = card.dataset.platform;
            if (platform && !currentWarningPlatform && !currentIncompatiblePlatform) {
                createRipple(event, card);
                detectAndAutoRestore();
            }
        });
    });

    setInterval(detectAndAutoRestore, 4000);
    setTimeout(detectAndAutoRestore, 500);

    console.log('🔥 PREMIUM ID v4.0 - PÚBLICO (solo mensaje arriba)');
});