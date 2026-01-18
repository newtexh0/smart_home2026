/**
 * SMART HOME ENGINE - FINAL BUILD
 * Developer: Eng. Hassan Mossa Rayyan
 */

// 1. Initial State Definition
const defaultState = {
    // Devices
    livingLight: false, livingTV: false, livingBlinds: true,
    kitchenLight: true, kitchenCoffee: false,
    bedroomLight: false, bedroomFan: false,
    frontDoor: true, alarmSystem: true,
    // System Settings
    thermostat: 22,
    activeScene: null,
    // Accessibility Settings
    highContrast: false, dyslexiaMode: false, reduceMotion: false,
    colorSim: 'normal', fontSize: 100
};

// Load State
let appState = JSON.parse(localStorage.getItem('sh_state')) || defaultState;

// 2. Initialization
document.addEventListener('DOMContentLoaded', () => {
    applyGlobalSettings();
    renderUI();
    
    // Restore active scene visual state if exists
    if(appState.activeScene) {
        const btn = document.getElementById(`scene-${appState.activeScene}`);
        if(btn) {
            btn.classList.add('active-scene');
            const icon = btn.querySelector('.scene-icon');
            const txt = btn.querySelector('.scene-status-text');
            if(icon) icon.classList.add('pulse-animation');
            if(txt) { txt.innerText = "ACTIVE • RUNNING"; txt.style.color = "var(--primary-color)"; }
        }
    }
});

// 3. Logic: Toggle Devices
function toggleDevice(id) {
    appState[id] = !appState[id];
    saveState();
    renderUI();
    
    // Feedback
    let status = appState[id] ? "ON" : "OFF";
    if(id.includes('Door')) status = appState[id] ? "LOCKED" : "UNLOCKED";
    if(id.includes('Alarm')) status = appState[id] ? "ARMED" : "DISARMED";
    if(id.includes('Blinds')) status = appState[id] ? "OPENED" : "CLOSED";
    
    showToast(`${formatName(id)}: ${status}`);
}

// 4. Logic: Smart Scenes (Toggle On/Off)
function toggleScene(name) {
    const btn = document.getElementById(`scene-${name}`);
    if(!btn) return;

    if(appState.activeScene === name) {
        // Deactivate
        btn.classList.remove('active-scene');
        const icon = btn.querySelector('.scene-icon');
        const txt = btn.querySelector('.scene-status-text');
        if(icon) icon.classList.remove('pulse-animation');
        if(txt) { txt.innerText = "READY"; txt.style.color = "#888"; }
        
        appState.activeScene = null;
        showToast(`Scene ${formatName(name)} Deactivated`);
    } else {
        // Activate (Turn off others first)
        document.querySelectorAll('.scene-card').forEach(c => {
            c.classList.remove('active-scene');
            c.querySelector('.scene-icon')?.classList.remove('pulse-animation');
            const t = c.querySelector('.scene-status-text');
            if(t) { t.innerText = "READY"; t.style.color = "#888"; }
        });

        // Show Loader
        const loader = btn.querySelector('.scene-loader');
        if(loader) loader.style.display = 'block';
        if(btn.querySelector('.scene-status-text')) btn.querySelector('.scene-status-text').innerText = "LOADING...";

        setTimeout(() => {
            if(loader) loader.style.display = 'none';
            btn.classList.add('active-scene');
            const icon = btn.querySelector('.scene-icon');
            const txt = btn.querySelector('.scene-status-text');
            if(icon) icon.classList.add('pulse-animation');
            if(txt) { txt.innerText = "ACTIVE • RUNNING"; txt.style.color = "var(--primary-color)"; }
            
            appState.activeScene = name;
            executeSceneLogic(name);
            showToast(`Scene ${formatName(name)} Activated`);
            saveState(); // Save inside timeout to ensure logic is done
        }, 800);
        return; // Return early to avoid double save
    }
    saveState();
}

function executeSceneLogic(name) {
    if(name === 'night') { appState.livingLight=false; appState.livingTV=false; appState.frontDoor=true; appState.alarmSystem=true; }
    if(name === 'away') { appState.livingLight=false; appState.alarmSystem=true; appState.bedroomFan=false; }
    if(name === 'reading') { appState.livingLight=true; appState.livingTV=false; appState.livingBlinds=true; }
}

// 5. Accessibility Logic
function toggleHighContrast() { appState.highContrast = !appState.highContrast; saveAndApply(); }
function toggleDyslexiaMode() { appState.dyslexiaMode = !appState.dyslexiaMode; saveAndApply(); }
function toggleReduceMotion() { appState.reduceMotion = !appState.reduceMotion; saveAndApply(); }
function simulateColorBlindness(mode) { appState.colorSim = mode; saveAndApply(); }
function updateFontSize(val) { appState.fontSize = val; saveAndApply(); }

function saveAndApply() {
    saveState();
    applyGlobalSettings();
    renderUI();
}

function applyGlobalSettings() {
    const b = document.body;
    // Classes
    appState.highContrast ? b.classList.add('high-contrast') : b.classList.remove('high-contrast');
    appState.dyslexiaMode ? b.classList.add('dyslexia-font') : b.classList.remove('dyslexia-font');
    appState.reduceMotion ? b.classList.add('reduce-motion') : b.classList.remove('reduce-motion');
    
    // Filters
    b.classList.remove('sim-achromatopsia', 'sim-protanopia', 'sim-deuteranopia');
    if(appState.colorSim !== 'normal') b.classList.add(`sim-${appState.colorSim}`);
    
    // Font Size
    document.documentElement.style.fontSize = `${(appState.fontSize / 100) * 16}px`;
}

// 6. UI Render (Sync HTML with JS State)
// --- تحديث دالة renderUI لتشمل عداد الأجهزة ---

function renderUI() {
    // 1. Helper to sync buttons (كما كان سابقاً)
    const sync = (id, key) => {
        const el = document.getElementById(id);
        const stat = document.getElementById(id + '-status');
        if(el) {
            appState[key] ? el.classList.add('active') : el.classList.remove('active');
            el.setAttribute('aria-pressed', appState[key]);
        }
        if(stat) {
            let txt = appState[key] ? "ON" : "OFF";
            if(key.includes('Door')) txt = appState[key] ? "LOCKED" : "UNLOCKED";
            if(key.includes('Alarm')) txt = appState[key] ? "ARMED" : "DISARMED";
            if(key.includes('Blinds')) txt = appState[key] ? "OPEN" : "CLOSED";
            
            stat.innerText = txt;
            stat.className = `status-badge ${appState[key] ? 'status-active' : 'status-inactive'}`;
        }
    };

    // 2. Sync All Devices
    sync('btn-living', 'livingLight');
    sync('btn-tv', 'livingTV');
    sync('btn-blinds', 'livingBlinds');
    sync('btn-kitchen', 'kitchenLight');
    sync('btn-coffee', 'kitchenCoffee');
    sync('btn-bed-light', 'bedroomLight');
    sync('btn-fan', 'bedroomFan');
    sync('btn-door', 'frontDoor');
    sync('btn-alarm', 'alarmSystem');

    // ---------------------------------------------------------
    // 3. NEW: Active Devices Counter (Logic Update)
    // ---------------------------------------------------------
    
    // قائمة بالأجهزة التي نعتبرها "أجهزة نشطة" عند التشغيل
    const devicesToCheck = [
        appState.livingLight,
        appState.livingTV,
        appState.kitchenLight,
        appState.kitchenCoffee,
        appState.bedroomLight,
        appState.bedroomFan,
        appState.alarmSystem // نعتبر الإنذار جهازاً نشطاً
    ];

    // حساب عدد القيم true (الأجهزة التي تعمل)
    const activeCount = devicesToCheck.filter(Boolean).length;
    
    // تحديث النص في الصفحة الرئيسية
    const statusMsg = document.getElementById('system-status-msg');
    if (statusMsg) {
        // تغيير النص ديناميكياً
        statusMsg.innerHTML = `System is running normally. <strong>${activeCount} Devices Active.</strong>`;
    }

    // ---------------------------------------------------------

    // 4. Sync Accessibility Page Buttons (كما كان سابقاً)
    const hc = document.getElementById('hc-toggle-btn');
    if(hc) appState.highContrast ? hc.classList.add('active') : hc.classList.remove('active');
    
    const dys = document.getElementById('dyslexia-btn');
    if(dys) appState.dyslexiaMode ? dys.classList.add('active') : dys.classList.remove('active');
    
    const mot = document.getElementById('motion-btn');
    if(mot) appState.reduceMotion ? mot.classList.add('active') : mot.classList.remove('active');

    const sli = document.getElementById('font-slider');
    if(sli) sli.value = appState.fontSize;
    
    const sel = document.getElementById('color-filter-select');
    if(sel) sel.value = appState.colorSim;
}

// 7. Utils
function saveState() { localStorage.setItem('sh_state', JSON.stringify(appState)); }
function formatName(s) { return s.replace(/([A-Z])/g, ' $1').trim().replace(/^./, c => c.toUpperCase()); }
function showToast(msg) {
    const t = document.getElementById('toast');
    if(t) { t.innerText = msg; t.className = "show"; setTimeout(() => t.className = "", 3000); }
}
function speakStatus() {
    if('speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance("System Operational. 4 Devices Active."));
    } else { alert("TTS Not Supported"); }
}

/* =========================================
   7. ASSET MANAGEMENT (IMAGE PRELOADING)
   HCI Principle: Perceived Performance
   ========================================= */

// قائمة بجميع الصور المستخدمة في المشروع
const imageAssets = [
    // Dashboard
    'images/security-feed.jpg',
    'images/energy-chart.png',
    
    // Rooms
    'images/living-room.jpg',
    'images/kitchen.jpg',
    'images/bedroom.jpg',
    'images/entrance.jpg',
    
    // Scenes
    'images/scene-night.jpg',
    'images/scene-away.jpg',
    'images/scene-reading.jpg',
    
    // About
    'images/system-arch.png'
];

/**
 * Preloads images into browser cache for instant navigation.
 */
function preloadImages() {
    console.log('🔄 System: Preloading Assets...');
    
    imageAssets.forEach((src) => {
        const img = new Image();
        img.src = src;
        // Optional: Log success/error for debugging
        // img.onload = () => console.log(`Loaded: ${src}`);
        // img.onerror = () => console.warn(`Missing: ${src}`);
    });
}

// استدعاء الوظيفة عند بدء التشغيل
document.addEventListener('DOMContentLoaded', () => {
    // ... (الكود السابق موجود هنا)
    
    // Start Preloading immediately
    preloadImages();
    
    // إضافة معالج للأخطاء للصور في حال لم يقم المستخدم بإضافتها بعد
    handleMissingImages();
});

/**
 * Fallback for missing images (Safety Net)
 * If an image fails to load, show a nice colored placeholder instead.
 */
function handleMissingImages() {
    const allImages = document.querySelectorAll('img');
    
    allImages.forEach(img => {
        img.onerror = function() {
            console.warn(`Image failed: ${this.src}. Reverting to placeholder.`);
            this.style.display = 'none'; // Hide broken image icon
            
            // Create a fallback div dynamically
            const fallback = document.createElement('div');
            fallback.className = 'img-placeholder';
            fallback.innerHTML = `<i class="fas fa-image"></i>&nbsp; Image Not Found`;
            fallback.style.height = this.style.height || '160px';
            
            // Insert fallback before the broken image
            this.parentNode.insertBefore(fallback, this);
        };
    });
}