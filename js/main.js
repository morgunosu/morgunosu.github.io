const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');

// --- CURSOR ---
let mouseX = 0, mouseY = 0, isMoving = false;
let cursorEnabled = localStorage.getItem('customCursor') !== 'false';

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    isMoving = true;
});

function updateCursorLoop() {
    if (isMoving && cursorEnabled) {
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        if (Math.random() > 0.85 && !document.body.classList.contains('system-cursor')) {
            const dot = document.createElement('div'); dot.className = 'trail-dot';
            dot.style.left = mouseX+'px'; dot.style.top = mouseY+'px';
            document.body.appendChild(dot); setTimeout(()=>dot.remove(), 300);
        }
    }
    isMoving = false;
    requestAnimationFrame(updateCursorLoop);
}
requestAnimationFrame(updateCursorLoop);

// --- TRANSLATIONS (Shortened for brevity, assumes standard structure) ---
const translations = {
    en: { nav_profile: "PROFILE", nav_bpm: "BPM TEST", nav_skins: "SKINS & STATS", nav_setup: "SETUP", copied: "Copied!", btn_start: "START", btn_stop: "STOP", mode_keyboard: "Keyboard", mode_mouse: "Mouse" },
    ru: { nav_profile: "ПРОФИЛЬ", nav_bpm: "BPM ТЕСТ", nav_skins: "СКИНЫ И СТАТЫ", nav_setup: "СЕТАП", copied: "Скопировано!", btn_start: "СТАРТ", btn_stop: "СТОП", mode_keyboard: "Клавиатура", mode_mouse: "Мышь" },
    ua: { nav_profile: "ПРОФІЛЬ", nav_bpm: "BPM ТЕСТ", nav_skins: "СКІНИ ТА СТАТИ", nav_setup: "СЕТАП", copied: "Скопійовано!", btn_start: "СТАРТ", btn_stop: "СТОП", mode_keyboard: "Клавіатура", mode_mouse: "Миша" }
};

let currentLang = localStorage.getItem('lang') || 'en';
function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('lang-'+lang).classList.add('active');
    // Simple text update logic here if needed for static elements
}
setLang(currentLang);

function toggleCursor() {
    cursorEnabled = !cursorEnabled;
    localStorage.setItem('customCursor', cursorEnabled);
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
toggleCursor(); toggleCursor(); // Init state

// --- NEW SCORES LOGIC ---
async function loadTopScores() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    // Показываем загрузку
    container.innerHTML = '<div class="flex items-center justify-center h-40"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-osu"></div></div>';

    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error('API Error');
        const scores = await res.json();

        // Заголовок
        let html = `
            <div class="flex items-center justify-between mb-2 sticky top-0 bg-[#141417]/95 backdrop-blur-xl z-20 pb-3 pt-1 border-b border-white/5">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400"><i class="fas fa-trophy"></i></div>
                    <div><h3 class="font-bold text-base leading-none text-white">Best Performance</h3><p class="text-[10px] text-gray-500 font-mono mt-0.5">TOP 20 PLAYS</p></div>
                </div>
            </div>
            <div class="score-scroll-container flex flex-col gap-2 pr-1">
        `;

        // Генерация карточек
        html += scores.map((s, index) => {
            const rankClass = `rank-${s.rank}`;
            const isFC = s.stats.miss === 0;
            const missText = isFC ? '' : `<span class="text-red-400 font-bold ml-1">${s.stats.miss}m</span>`;

            return `
            <a href="${s.beatmap.url}" target="_blank" class="relative group block overflow-hidden rounded-xl bg-[#1a1a1d] border border-white/5 hover:border-osu/50 transition-all duration-300">
                <div class="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 bg-cover bg-center" 
                     style="background-image: url('${s.beatmap.cover}')"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>

                <div class="relative z-10 flex items-center p-3 gap-4">
                    <div class="flex flex-col items-center justify-center w-10 flex-shrink-0">
                        <span class="text-2xl font-black italic ${rankClass} drop-shadow-lg">${s.rank}</span>
                        <span class="text-[9px] text-gray-500 font-mono">#${index + 1}</span>
                    </div>

                    <div class="flex flex-col min-w-0 flex-grow">
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-white font-bold text-sm truncate hover:text-osu transition-colors">${s.beatmap.title}</span>
                        </div>
                        <div class="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                            <span class="bg-white/10 px-1.5 rounded text-[10px] text-white font-bold">${s.beatmap.version}</span>
                            <span class="text-yellow-400 font-bold text-[10px] flex items-center gap-1"><i class="fas fa-star text-[8px]"></i>${s.beatmap.stars}</span>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <div class="flex gap-1">${s.mods.map(m => `<span class="mod-badge ${m === 'NM' ? 'bg-gray-700 text-gray-300' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'}">${m}</span>`).join('')}</div>
                            <span class="text-[10px] text-gray-600 ml-auto">${s.date}</span>
                        </div>
                    </div>

                    <div class="flex flex-col items-end flex-shrink-0 text-right gap-0.5">
                        <div class="text-lg font-bold text-white flex items-end gap-1">
                            ${s.pp}<span class="text-xs text-osu font-bold mb-1">pp</span>
                        </div>
                        <div class="text-xs font-bold ${s.accuracy >= 99 ? 'text-green-400' : 'text-gray-300'}">${s.accuracy}%</div>
                        <div class="text-[10px] text-gray-400 font-mono mt-1 flex items-center gap-2 bg-black/50 px-2 py-1 rounded">
                            <span class="text-gray-300 font-bold">${s.max_combo}x</span>
                            ${missText}
                        </div>
                    </div>
                </div>
                
                <div class="h-0 group-hover:h-8 transition-all duration-300 overflow-hidden bg-black/80 border-t border-white/5 flex items-center justify-around px-4 text-[10px] font-mono text-gray-400 relative z-20">
                    <span title="Great (300)"><span class="text-blue-300 font-bold">300:</span> ${s.stats.great}</span>
                    <span title="Ok (100)"><span class="text-green-300 font-bold">100:</span> ${s.stats.ok}</span>
                    <span title="Meh (50)"><span class="text-yellow-300 font-bold">50:</span> ${s.stats.meh}</span>
                    <span title="Miss"><span class="text-red-400 font-bold">Miss:</span> ${s.stats.miss}</span>
                </div>
            </a>
            `;
        }).join('');

        html += `</div>`;
        container.innerHTML = html;
        container.parentElement.classList.remove('p-5'); 
        container.parentElement.classList.add('p-4'); 

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-xs text-red-400 py-2">Failed to load scores. Check API Key.</div>';
    }
}

async function loadUserStats() {
    const container = document.getElementById('live-stats-container');
    if(!container) return;
    try {
        const res = await fetch('/api/scores?type=user');
        if(!res.ok) throw new Error("API Error");
        const u = await res.json();
        
        container.className = "grid grid-cols-2 md:grid-cols-4 gap-3 mt-0";
        container.innerHTML = `
            <div class="col-span-2 md:col-span-4 bg-[#1a1a1d] border border-white/5 rounded-2xl p-0 relative overflow-hidden group">
                <div class="absolute inset-0 h-full w-full bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity duration-500" style="background-image: url('${u.cover_url}');"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#141417] via-[#141417]/90 to-transparent"></div>
                
                <div class="relative z-10 flex items-center p-5 gap-5">
                    <img src="${u.avatar_url}" class="w-20 h-20 rounded-2xl border-2 border-white/10 shadow-2xl">
                    <div class="flex-grow">
                        <div class="flex items-center gap-3">
                            <h2 class="text-3xl font-black text-white tracking-tight">${u.username}</h2>
                            <div class="bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-1.5" title="${u.country_name}">
                                <img src="https://flagcdn.com/20x15/${u.country.toLowerCase()}.png" class="rounded-[2px]">
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-2">
                            <div class="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg">
                                <span class="text-[10px] text-indigo-300 font-bold uppercase">Global</span>
                                <span class="text-sm font-bold text-white ml-1">#${u.global_rank}</span>
                            </div>
                            <div class="bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
                                <span class="text-[10px] text-gray-400 font-bold uppercase">${u.country}</span>
                                <span class="text-sm font-bold text-white ml-1">#${u.country_rank}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-[#1a1a1d] border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:border-osu/30 transition-colors">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">PP</div>
                <div class="text-2xl font-black text-osu">${u.pp}</div>
            </div>
            
            <div class="bg-[#1a1a1d] border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:border-green-500/30 transition-colors">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Accuracy</div>
                <div class="text-2xl font-black text-white">${u.accuracy}<span class="text-sm text-gray-500 ml-0.5">%</span></div>
            </div>

            <div class="bg-[#1a1a1d] border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:border-blue-500/30 transition-colors">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Play Count</div>
                <div class="text-2xl font-black text-white">${u.play_count}</div>
                <div class="text-[10px] text-gray-500 font-mono mt-1">${u.play_time}h played</div>
            </div>

            <div class="bg-[#1a1a1d] border border-white/5 rounded-xl p-4 flex flex-col justify-center hover:border-yellow-500/30 transition-colors">
                <div class="flex justify-between items-end mb-1">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Level ${u.level}</div>
                    <div class="text-[10px] font-bold text-yellow-400">${u.level_progress}%</div>
                </div>
                <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-400 rounded-full" style="width: ${u.level_progress}%"></div>
                </div>
                <div class="text-[10px] text-gray-500 mt-2 text-right">Total Score: ${u.total_score}</div>
            </div>
        `;
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div class="col-span-4 text-center text-xs text-red-400 py-4">Failed to load stats</div>';
    }
}

// Lanyard & Utils
async function fetchLanyardStatus() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await res.json();
        if (data.success) updateStatusBadges(data.data);
    } catch (e) { console.error(e); }
}
function updateStatusBadges(discordData) {
    // ... (Your existing Lanyard code is fine, keep it here) ...
    // Note: I'm omitting the full Lanyard function to save space, but DO NOT DELETE IT from your file.
    // Use the Lanyard function I gave you in the previous turn (with game icons).
    const status = discordData.discord_status;
    const activities = discordData.activities || [];
    const profileWrapper = document.getElementById('profile-status-wrapper');
    let activity = activities.find(a => a.name.toLowerCase().includes('osu'));
    if (!activity) activity = activities.find(a => a.type === 0);
    if (!activity) activity = activities.find(a => a.type === 1);
    if (!activity) activity = activities.find(a => a.type === 2);

    let htmlContent = '', wrapperClasses = "inline-flex items-center rounded-2xl border mb-6 backdrop-blur-md transition-colors duration-300 max-w-full";
    let color = 'text-gray-400', bg = 'bg-gray-500/10', border = 'border-gray-500/30', dotColor = 'bg-gray-400';

    if (activity) {
        let iconUrl = null;
        if (activity.id === 'spotify:1' && activity.assets?.large_image) iconUrl = `https://i.scdn.co/image/${activity.assets.large_image.replace('spotify:', '')}`;
        else if (activity.assets?.large_image) {
            let img = activity.assets.large_image;
            if (img.startsWith('mp:')) iconUrl = img.replace('mp:', 'https://media.discordapp.net/');
            else iconUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${img}.png`;
        }
        const name = activity.name;
        const details = activity.details || "";
        const state = activity.state || "";

        if (name.toLowerCase().includes('osu')) { color='text-pink-400'; bg='bg-pink-500/10'; border='border-pink-500/30'; }
        else if (activity.type === 2) { color='text-green-400'; bg='bg-green-500/10'; border='border-green-500/30'; }
        else { color='text-indigo-400'; bg='bg-indigo-500/10'; border='border-indigo-500/30'; }

        wrapperClasses += ` px-4 py-2 ${bg} ${border}`;
        htmlContent = `${iconUrl ? `<img src="${iconUrl}" class="w-10 h-10 rounded-md mr-3 object-cover shadow-lg">` : ''}<div class="flex flex-col min-w-0"><span class="text-xs font-bold ${color} leading-none mb-1">${name}</span>${details ? `<span class="text-[10px] text-gray-300 leading-tight truncate w-full">${details}</span>` : ''}${state ? `<span class="text-[10px] text-gray-400 leading-tight truncate w-full">${state}</span>` : ''}</div>`;
    } else {
        if (status === 'online') { color='text-green-400'; bg='bg-green-500/10'; border='border-green-500/30'; dotColor='bg-green-400'; }
        else if (status === 'dnd') { color='text-red-400'; bg='bg-red-500/10'; border='border-red-500/30'; dotColor='bg-red-400'; }
        wrapperClasses += ` px-3 py-1 ${bg} ${border}`;
        htmlContent = `<span class="w-2 h-2 rounded-full mr-2 ${dotColor} ${status === 'online' ? 'animate-pulse' : ''}"></span><span class="text-xs font-bold ${color}">${status.toUpperCase()}</span>`;
    }
    if(profileWrapper) { profileWrapper.className = wrapperClasses; profileWrapper.innerHTML = htmlContent; }
}

function switchTab(t) { 
    if (document.startViewTransition) { document.startViewTransition(() => performSwitch(t)); } else { performSwitch(t); }
}
function performSwitch(t) {
    document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active')); 
    document.querySelectorAll('.nav-btn').forEach(e=>e.classList.remove('active')); 
    document.getElementById('tab-'+t).classList.add('active'); 
    document.getElementById('btn-'+t).classList.add('active');
    if (t === 'stream' && typeof resize === 'function') setTimeout(resize, 100);
}
function copyDiscord() { navigator.clipboard.writeText(".morgun.").then(()=>{ var t=document.getElementById("toast"); t.className="show"; setTimeout(()=>t.className=t.className.replace("show",""),3000); }); }
function closeImageModal() { document.getElementById('image-modal').classList.add('hidden'); }
function toggleFilter(id, btn) { const d = document.getElementById(id); d.classList.toggle('open'); btn.classList.toggle('active'); }
document.addEventListener('keydown', e=>{if(e.key==="Escape")closeImageModal()});
const limitTypeEl = document.getElementById('limit-type');
if(limitTypeEl) { limitTypeEl.addEventListener('change', function() { const input = document.getElementById('limit-value'); input.disabled = this.value === 'none'; if(this.value === 'none') input.value = ''; }); }

// INIT
fetchLanyardStatus(); setInterval(fetchLanyardStatus, 10000);
loadTopScores(); loadUserStats();
