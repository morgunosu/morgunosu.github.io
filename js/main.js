const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');

// --- OPTIMIZED CURSOR LOGIC ---
let mouseX = 0, mouseY = 0, isMoving = false;
let cursorEnabled = localStorage.getItem('customCursor') !== 'false';

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; 
    mouseY = e.clientY;
    isMoving = true;
});

function updateCursorLoop() {
    if (isMoving && cursorEnabled) {
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        
        if (Math.random() > 0.85 && !document.body.classList.contains('system-cursor')) {
            createTrailDot(mouseX, mouseY);
        }
    }
    isMoving = false;
    requestAnimationFrame(updateCursorLoop);
}
requestAnimationFrame(updateCursorLoop);

function createTrailDot(x, y) {
    const dot = document.createElement('div'); 
    dot.className = 'trail-dot';
    dot.style.left = x + 'px'; 
    dot.style.top = y + 'px';
    document.body.appendChild(dot); 
    setTimeout(() => dot.remove(), 300);
}

function toggleCursor() {
    cursorEnabled = !cursorEnabled;
    localStorage.setItem('customCursor', cursorEnabled);
    updateCursorState();
}
function updateCursorState() {
    const icon = document.getElementById('cursor-toggle-icon');
    if (cursorEnabled) {
        document.body.classList.remove('system-cursor');
        cursor.style.display = 'block';
        icon.className = "w-8 h-4 bg-indigo-500 rounded-full relative transition-colors";
        icon.innerHTML = '<div class="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-all"></div>';
    } else {
        document.body.classList.add('system-cursor');
        cursor.style.display = 'none';
        icon.className = "w-8 h-4 bg-gray-600 rounded-full relative transition-colors";
        icon.innerHTML = '<div class="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-all"></div>';
    }
}
updateCursorState();

// --- TRANSLATIONS ---
const translations = {
    en: {
        nav_profile: "PROFILE", nav_bpm: "BPM TEST", nav_skins: "SKINS & STATS", nav_setup: "SETUP",
        copied: "Copied!", custom_cursor: "Custom Cursor",
        status_offline: "OFFLINE", bio: "Kvass energy enjoyer", add_discord: "Add me on Discord",
        osu_profile: "Profile", check_stats: "Check main stats",
        bpm_title: "BPM Test", stream_tester: "Stream Speed Tester", reset: "RESET", taps: "taps", change_key: "Change Key",
        stream_bpm: "Stream BPM", ur: "Unstable Rate", test_duration: "Test Duration",
        bpm_disclaimer: "WARNING: This is a browser-based tool (JS Event Loop). Due to DOM latency and lack of Raw Input, results (especially UR) will be less precise and higher than in the osu! client.",
        engine_logic_title: "Engine Logic (osu! wiki)", 
        engine_logic_text: "UR (Unstable Rate) measures timing consistency, not accuracy. Formula: Standard Deviation of hit errors × 10. Lower is better. Note that browser jitter affects this calculation.",
        input_history: "Input History",
        statistics: "Statistics", view_profile: "View Profile", connecting: "Connecting to osu! servers...",
        top_perf: "Top Performance", auto_update: "AUTO-UPDATE", fetching: "Fetching from osu! API...",
        skin_lib: "Skin Library", curr_skin: "Current Skin",
        config: "Configuration", gear_specs: "GEAR & SETTINGS",
        pc: "PC", workstation: "MAIN WORKSTATION", ingame_config: "In-game Configuration",
        keypad: "Keypad", switches: "Switches", rapid_trigger: "Rapid Trigger",
        tablet: "Tablet", driver: "Driver", area: "Area Settings", filters: "Input Filters",
        typing_board: "Typing Board", stock_switches: "Stock Switches",
        btn_start: "START", btn_stop: "STOP", mode_keyboard: "Keyboard", mode_mouse: "Mouse",
        limit_none: "Unlimited", limit_time: "Time (sec)", limit_clicks: "Clicks"
    },
    ru: {
        nav_profile: "ПРОФИЛЬ", nav_bpm: "BPM ТЕСТ", nav_skins: "СКИНЫ И СТАТЫ", nav_setup: "СЕТАП",
        copied: "Скопировано!", custom_cursor: "Свой курсор",
        status_offline: "ОФФЛАЙН", bio: "Любитель кваса", add_discord: "Добавь в Discord",
        osu_profile: "Профиль", check_stats: "Главная статистика",
        bpm_title: "BPM Тест", stream_tester: "Тест скорости стрима", reset: "СБРОС", taps: "наж.", change_key: "Сменить",
        stream_bpm: "BPM стрима", ur: "Нестабильность", test_duration: "Длительность",
        bpm_disclaimer: "ВНИМАНИЕ: Это браузерный инструмент. Из-за задержек JavaScript и отсутствия Raw Input результаты (особенно UR) будут менее точными и хуже, чем в самом клиенте osu!.",
        engine_logic_title: "Логика движка (osu! wiki)", 
        engine_logic_text: "UR (Unstable Rate) измеряет стабильность нажатий, а не точность. Формула: Стандартное отклонение × 10. Чем ниже, тем лучше. Браузерные лаги могут завышать это значение.",
        input_history: "История ввода",
        statistics: "Статистика", view_profile: "Открыть профиль", connecting: "Подключение к osu!...",
        top_perf: "Лучшие результаты", auto_update: "АВТО-ОБНОВЛЕНИЕ", fetching: "Загрузка из osu! API...",
        skin_lib: "Библиотека скинов", curr_skin: "Текущий скин",
        config: "Конфигурация", gear_specs: "ДЕВАЙСЫ И НАСТРОЙКИ",
        pc: "ПК", workstation: "ОСНОВНАЯ СТАНЦИЯ", ingame_config: "Настройки игры",
        keypad: "Кейпад", switches: "Свитчи", rapid_trigger: "Rapid Trigger",
        tablet: "Планшет", driver: "Драйвер", area: "Настройки зоны", filters: "Фильтры ввода",
        typing_board: "Клавиатура", stock_switches: "Стоковые свитчи",
        btn_start: "СТАРТ", btn_stop: "СТОП", mode_keyboard: "Клавиатура", mode_mouse: "Мышь",
        limit_none: "Без лимита", limit_time: "Время (сек)", limit_clicks: "Клики"
    },
    ua: {
        nav_profile: "ПРОФІЛЬ", nav_bpm: "BPM ТЕСТ", nav_skins: "СКІНИ ТА СТАТИ", nav_setup: "СЕТАП",
        copied: "Скопійовано!", custom_cursor: "Свій курсор",
        status_offline: "ОФЛАЙН", bio: "Любитель квасу", add_discord: "Додай у Discord",
        osu_profile: "Профіль", check_stats: "Головна статистика",
        bpm_title: "BPM Тест", stream_tester: "Тест швидкості стріму", reset: "СКИДАННЯ", taps: "нат.", change_key: "Змінити",
        stream_bpm: "BPM стріму", ur: "Нестабільність", test_duration: "Тривалість",
        bpm_disclaimer: "УВАГА: Це браузерний інструмент. Через затримки JavaScript та відсутність Raw Input результати (особливо UR) будуть менш точними та гіршими, ніж у клієнті osu!.",
        engine_logic_title: "Логіка рушія (osu! wiki)", 
        engine_logic_text: "UR (Unstable Rate) вимірює стабільність, а не точність. Формула: Стандартне відхилення × 10. Чим нижче, тим краще. Браузерні лаги можуть завищувати це значення.",
        input_history: "Історія вводу",
        statistics: "Статистика", view_profile: "Відкрити профіль", connecting: "Підключення до osu!...",
        top_perf: "Найкращі результати", auto_update: "АВТО-ОНОВЛЕННЯ", fetching: "Завантаження з osu! API...",
        skin_lib: "Бібліотека скінів", curr_skin: "Поточний скін",
        config: "Конфігурація", gear_specs: "ДЕВАЙСИ ТА НАЛАШТУВАННЯ",
        pc: "ПК", workstation: "ОСНОВНА СТАНЦІЯ", ingame_config: "Налаштування гри",
        keypad: "Кейпад", switches: "Світчі", rapid_trigger: "Rapid Trigger",
        tablet: "Планшет", driver: "Драйвер", area: "Налаштування зони", filters: "Фільтри вводу",
        typing_board: "Клавіатура", stock_switches: "Стокові світчі",
        btn_start: "СТАРТ", btn_stop: "СТОП", mode_keyboard: "Клавіатура", mode_mouse: "Миша",
        limit_none: "Без ліміту", limit_time: "Час (сек)", limit_clicks: "Кліки"
    }
};

let currentLang = localStorage.getItem('lang') || 'en';
function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang][key]) el.innerText = translations[lang][key];
    });
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('lang-'+lang).classList.add('active');
    
    const startBtn = document.getElementById('btn-start');
    if(startBtn) {
        const isTesting = startBtn.classList.contains('bg-red-500');
        const span = startBtn.querySelector('span');
        if(span) span.innerText = isTesting ? translations[lang].btn_stop : translations[lang].btn_start;
    }
    
    const modeBtn = document.getElementById('btn-mode');
    if(modeBtn) {
        const isMouse = document.getElementById('mode-icon').classList.contains('fa-mouse');
        document.getElementById('mode-text').innerText = isMouse ? translations[lang].mode_mouse : translations[lang].mode_keyboard;
    }
}
setLang(currentLang);

// --- API FUNCTIONS ---
async function loadTopScores() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error('API Error');
        const scores = await res.json();
        container.innerHTML = scores.map(s => `
            <a href="${s.link}" target="_blank" class="flex items-center gap-3 bg-white/5 p-2 rounded-xl hover:bg-white/10 transition-colors group/score relative overflow-hidden">
                <div class="absolute inset-0 opacity-20 group-hover/score:opacity-40 transition-opacity bg-cover bg-center" style="background-image: url('${s.cover}')"></div>
                <div class="relative z-10 w-8 h-8 flex-shrink-0 flex items-center justify-center font-black text-xl italic ${getRankColor(s.rank)}">${s.rank}</div>
                <div class="relative z-10 flex-grow min-w-0"><div class="text-xs font-bold truncate text-white">${s.title}</div><div class="text-[10px] text-gray-400 truncate">${s.artist} [${s.version}]</div></div>
                <div class="relative z-10 text-right"><div class="text-sm font-bold text-indigo-400">${s.pp}pp</div></div>
            </a>
        `).join('');
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-xs text-red-400 py-2">Connect Vercel API</div>';
    }
}

async function loadUserStats() {
    const container = document.getElementById('live-stats-container');
    if(!container) return;
    try {
        const res = await fetch('/api/scores?type=user');
        if(!res.ok) throw new Error("API Error");
        const u = await res.json();
        container.innerHTML = `
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">Global Rank</div>
                <div class="text-xl font-black text-white">#${u.global_rank}</div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">Country</div>
                <div class="text-xl font-bold text-white flex items-center justify-center gap-2">
                    <img src="https://flagcdn.com/20x15/${u.country.toLowerCase()}.png" class="rounded-sm"> #${u.country_rank}
                </div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">PP</div>
                <div class="text-xl font-bold text-indigo-400">${u.pp}</div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">Accuracy</div>
                <div class="text-xl font-bold text-green-400">${u.accuracy}%</div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center col-span-2">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">Playcount</div>
                <div class="text-lg font-bold text-white">${u.playcount}</div>
            </div>
            <div class="bg-white/5 rounded-xl p-3 border border-white/5 text-center col-span-2">
                <div class="text-xs text-gray-500 uppercase font-bold mb-1">Level</div>
                <div class="text-lg font-bold text-white">${u.level}</div>
            </div>
        `;
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div class="col-span-4 text-center text-xs text-red-400 py-4">Failed to load stats</div>';
    }
}

function getRankColor(rank) {
    if (rank.includes('X')) return 'text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.5)]';
    if (rank.includes('S')) return 'text-gray-200 drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]';
    if (rank === 'A') return 'text-green-400';
    return 'text-gray-500';
}

// --- LANYARD (DISCORD) ---
async function fetchLanyardStatus() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await res.json();
        if (data.success) updateStatusBadges(data.data);
    } catch (e) { console.error(e); }
}

function updateStatusBadges(discordData) {
    const status = discordData.discord_status;
    const activities = discordData.activities || [];
    const profileWrapper = document.getElementById('profile-status-wrapper');

    // 1. Ищем приоритетную активность: osu! -> Другая игра -> Spotify
    let activity = activities.find(a => a.name.toLowerCase().includes('osu'));
    if (!activity) activity = activities.find(a => a.type === 0); // Playing
    if (!activity) activity = activities.find(a => a.type === 1); // Streaming
    if (!activity) activity = activities.find(a => a.type === 2); // Listening (Spotify)

    // Контейнер для HTML
    let htmlContent = '';
    let wrapperClasses = "inline-flex items-center rounded-2xl border mb-6 backdrop-blur-md transition-colors duration-300 max-w-full";
    
    // Стандартные стили (Offline/Idle)
    let color = 'text-gray-400';
    let bg = 'bg-gray-500/10';
    let border = 'border-gray-500/30';
    let dotColor = 'bg-gray-400';

    if (activity) {
        // --- РЕЖИМ АКТИВНОСТИ (ИГРА/МУЗЫКА) ---
        
        // 1. Получаем картинку (Assets)
        let iconUrl = null;
        if (activity.id === 'spotify:1' && activity.assets && activity.assets.large_image) {
             iconUrl = `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}`;
        } else if (activity.assets && activity.assets.large_image) {
            let img = activity.assets.large_image;
            if (img.startsWith('mp:')) iconUrl = img.replace('mp:', 'https://media.discordapp.net/');
            else iconUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png`;
        }

        // 2. Определяем цвета и текст (osu! logic)
        const name = activity.name;
        const details = activity.details || "";
        const state = activity.state || "";

        if (name.toLowerCase().includes('osu')) {
             if (details.includes('Spectating') || state.includes('Spectating')) {
                // SPECTATING -> BLUE
                color='text-blue-400'; bg='bg-blue-500/10'; border='border-blue-500/30';
            } else if (details.includes('Editing') || state.includes('Editing')) {
                // EDITING -> YELLOW/ORANGE
                color='text-yellow-400'; bg='bg-yellow-500/10'; border='border-yellow-500/30';
            } else if (state.includes('Lobby') || details.includes('Multiplayer')) {
                // MULTIPLAYER -> GREEN
                color='text-green-400'; bg='bg-green-500/10'; border='border-green-500/30';
            } else if (details.includes('Idle') || state.includes('Idle')) {
                // IDLE (Menus) -> GRAY
                color='text-gray-400'; bg='bg-white/5'; border='border-white/10';
            } else {
                // PLAYING -> PINK
                color='text-pink-400'; bg='bg-pink-500/10'; border='border-pink-500/30';
            }
        } else if (activity.type === 2) {
            // SPOTIFY -> GREEN
            color='text-green-400'; bg='bg-green-500/10'; border='border-green-500/30';
        } else {
            // OTHER GAMES -> INDIGO
            color='text-indigo-400'; bg='bg-indigo-500/10'; border='border-indigo-500/30';
        }

        // 3. Формируем HTML карточки
        wrapperClasses += ` px-4 py-2 ${bg} ${border}`;
        
        htmlContent = `
            ${iconUrl ? `<img src="${iconUrl}" class="w-10 h-10 rounded-md mr-3 object-cover shadow-lg">` : ''}
            <div class="flex flex-col min-w-0">
                <span class="text-xs font-bold ${color} leading-none mb-1">${name}</span>
                ${details ? `<span class="text-[10px] text-gray-300 leading-tight truncate w-full">${details}</span>` : ''}
                ${state ? `<span class="text-[10px] text-gray-400 leading-tight truncate w-full">${state}</span>` : ''}
            </div>
        `;

    } else {
        // --- РЕЖИМ ПРОСТОГО СТАТУСА (Оффлайн/Онлайн) ---
        let statusText = 'OFFLINE';
        
        if (status === 'online') {
            color='text-green-400'; bg='bg-green-500/10'; border='border-green-500/30'; dotColor='bg-green-400'; statusText='ONLINE';
        } else if (status === 'idle') {
            color='text-yellow-400'; bg='bg-yellow-500/10'; border='border-yellow-500/30'; dotColor='bg-yellow-400'; statusText='IDLE';
        } else if (status === 'dnd') {
            color='text-red-400'; bg='bg-red-500/10'; border='border-red-500/30'; dotColor='bg-red-400'; statusText='BUSY';
        }

        wrapperClasses += ` px-3 py-1 ${bg} ${border}`;
        
        htmlContent = `
            <span class="w-2 h-2 rounded-full mr-2 ${dotColor} ${status === 'online' ? 'animate-pulse' : ''}"></span>
            <span class="text-xs font-bold ${color}">${statusText}</span>
        `;
    }

    // Применяем изменения
    profileWrapper.className = wrapperClasses;
    profileWrapper.innerHTML = htmlContent;
}

// --- UTILS ---
function switchTab(t) { 
    document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active')); 
    document.querySelectorAll('.nav-btn').forEach(e=>e.classList.remove('active')); 
    document.getElementById('tab-'+t).classList.add('active'); 
    document.getElementById('btn-'+t).classList.add('active'); 
    
    if (t === 'stream' && typeof resize === 'function') setTimeout(resize, 100);
}

function copyDiscord() { 
    navigator.clipboard.writeText(".morgun.").then(()=>{ 
        var t=document.getElementById("toast"); 
        t.className="show"; 
        setTimeout(()=>t.className=t.className.replace("show",""),3000); 
    }); 
}

function closeImageModal() { document.getElementById('image-modal').classList.add('hidden'); }
function toggleFilter(id, btn) { const d = document.getElementById(id); d.classList.toggle('open'); btn.classList.toggle('active'); }

document.addEventListener('keydown', e=>{if(e.key==="Escape")closeImageModal()});

const limitTypeEl = document.getElementById('limit-type');
if(limitTypeEl) {
    limitTypeEl.addEventListener('change', function() {
        const input = document.getElementById('limit-value');
        input.disabled = this.value === 'none';
        if(this.value === 'none') input.value = '';
    });
}

fetchLanyardStatus(); setInterval(fetchLanyardStatus, 10000);
loadTopScores(); loadUserStats();
