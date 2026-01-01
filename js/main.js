const DISCORD_ID = "1193659050878054551"; // Ваш Discord ID
const cursor = document.getElementById('osu-cursor');

// --- Глобальное хранилище данных ---
window.topScoresData = [];

// --- ЛОГИКА КУРСОРА ---
let mouseX = 0, mouseY = 0, isMoving = false;
let cursorEnabled = localStorage.getItem('customCursor') !== 'false';

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    isMoving = true;
});

function updateCursorLoop() {
    if (isMoving && cursorEnabled && cursor) {
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        // Создаем след (trail) с вероятностью
        if (Math.random() > 0.85 && !document.body.classList.contains('system-cursor')) {
            const dot = document.createElement('div'); 
            dot.className = 'trail-dot';
            dot.style.left = mouseX+'px'; 
            dot.style.top = mouseY+'px';
            document.body.appendChild(dot); 
            setTimeout(()=>dot.remove(), 300);
        }
    }
    isMoving = false;
    requestAnimationFrame(updateCursorLoop);
}
requestAnimationFrame(updateCursorLoop);

function toggleCursor() {
    cursorEnabled = !cursorEnabled;
    localStorage.setItem('customCursor', cursorEnabled);
    updateCursorUI();
}

function updateCursorUI() {
    const icon = document.getElementById('cursor-toggle-icon');
    if (!cursor || !icon) return;
    
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
// Инициализация курсора при загрузке
updateCursorUI();


// --- ТОП СКОРЫ (КОМПАКТНЫЙ СПИСОК + МОДАЛКА) ---
async function loadTopScores() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    // Лоадер
    container.innerHTML = '<div class="flex items-center justify-center h-20"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-osu"></div></div>';

    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error('API Error');
        const scores = await res.json();
        
        // Сохраняем данные глобально, чтобы открывать модалку
        window.topScoresData = scores;

        // Заголовок таблицы
        let html = `
            <div class="px-3 py-2 flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5 mb-1">
                <span class="w-10 text-center">Rank</span>
                <span class="flex-grow ml-2">Map</span>
                <span class="w-[100px] text-right">Mods / Acc</span>
                <span class="w-[80px] text-right">PP</span>
            </div>
            <div class="flex flex-col gap-1">
        `;

        // Генерация строк
        html += scores.map((s, index) => {
            const rankColor = getRankColorClass(s.rank);
            return `
            <div onclick="openScoreModal(${index})" class="score-row group relative overflow-hidden rounded hover:bg-white/5 transition-colors cursor-pointer border-l-2 border-transparent hover:border-osu">
                
                <div class="text-xl font-black italic text-center w-10 flex-shrink-0 ${rankColor} drop-shadow-md">${s.rank}</div>
                
                <div class="flex flex-col min-w-0 flex-grow px-2">
                    <div class="truncate text-sm font-bold text-gray-200 group-hover:text-white transition-colors">${s.beatmap.title}</div>
                    <div class="truncate text-[10px] text-gray-500 group-hover:text-gray-400">${s.beatmap.artist} [${s.beatmap.version}]</div>
                </div>

                <div class="text-right flex flex-col items-end w-[100px] flex-shrink-0">
                    <div class="flex gap-1 mb-0.5 h-4">${s.mods.map(m => `<span class="text-[9px] bg-white/10 px-1 rounded text-yellow-300 font-bold border border-white/5">${m}</span>`).join('')}</div>
                    <div class="text-xs font-bold ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
                </div>

                <div class="text-right text-lg font-bold text-indigo-400 w-[80px] flex-shrink-0">${s.pp}<span class="text-[10px] text-gray-500 ml-0.5 font-normal">pp</span></div>
            </div>
            `;
        }).join('');

        html += `</div>`;
        container.innerHTML = html;
        // Сброс паддингов родителя для красоты списка
        container.parentElement.style.padding = "10px";

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-xs text-red-400 py-4">Failed to load scores. Check API Key.</div>';
    }
}

// === ФУНКЦИИ МОДАЛЬНОГО ОКНА ===
window.openScoreModal = function(index) {
    const s = window.topScoresData[index];
    if (!s) return;

    const modalHtml = `
    <div class="modal-overlay active" id="score-modal-overlay" onclick="closeScoreModal(event)">
        <div class="score-modal relative bg-[#141417] w-full max-w-4xl mx-4 rounded-xl overflow-hidden shadow-2xl border border-white/10" onclick="event.stopPropagation()">
            <div class="close-modal-btn" onclick="closeScoreModal()"><i class="fas fa-times"></i></div>
            
            <div class="relative h-48 w-full bg-cover bg-center" style="background-image: url('${s.beatmap.cover}');">
                <div class="absolute inset-0 bg-gradient-to-t from-[#141417] via-[#141417]/70 to-transparent"></div>
                <div class="absolute bottom-0 left-0 p-6 w-full flex items-end justify-between">
                    <div class="max-w-[70%]">
                        <h2 class="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg truncate">${s.beatmap.title}</h2>
                        <p class="text-lg text-gray-300 drop-shadow-md truncate">${s.beatmap.artist}</p>
                        <div class="flex flex-wrap gap-2 mt-2">
                             <span class="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded shadow-lg flex items-center gap-1"><i class="fas fa-star text-[10px]"></i> ${s.beatmap.stars}</span>
                             <span class="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-0.5 rounded border border-white/10">${s.beatmap.version}</span>
                             <a href="${s.beatmap.url}" target="_blank" class="bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold px-3 py-0.5 rounded transition-colors ml-2 shadow-lg"><i class="fas fa-download mr-1"></i> Beatmap</a>
                        </div>
                    </div>
                    <div class="text-right text-xs text-gray-400 font-mono hidden sm:block">
                        <div>Mapped by <span class="text-white font-bold">${s.beatmap.creator}</span></div>
                        <div class="mt-1"><span class="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">${s.beatmap.status.toUpperCase()}</span></div>
                    </div>
                </div>
            </div>

            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                
                <div class="flex flex-col items-center justify-center md:border-r border-white/5 md:pr-4">
                    <div class="modal-rank-circle text-rank-${s.rank} mb-4">
                        ${s.rank}
                    </div>
                    <div class="text-center">
                        <div class="text-3xl md:text-4xl font-black text-white tracking-widest font-mono tabular-nums">${s.score}</div>
                        <div class="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">Total Score</div>
                    </div>
                    <div class="mt-6 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <i class="far fa-calendar-alt mr-2 opacity-50"></i>${s.full_date}
                    </div>
                </div>

                <div class="col-span-2 flex flex-col justify-between gap-6">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="detail-label">PP</div>
                            <div class="detail-val text-indigo-400 text-2xl">${s.pp}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Accuracy</div>
                            <div class="detail-val ${getAccColor(s.accuracy)} text-2xl">${s.accuracy}%</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Max Combo</div>
                            <div class="detail-val text-green-400 text-2xl">${s.max_combo}x</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Misses</div>
                            <div class="detail-val text-red-500 text-2xl">${s.stats.miss}</div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                        <div class="text-center flex-1 border-r border-white/5">
                            <div class="text-blue-300 font-bold text-xl">${s.stats.great}</div>
                            <div class="text-[9px] text-gray-500 font-bold">300</div>
                        </div>
                        <div class="text-center flex-1 border-r border-white/5">
                            <div class="text-green-300 font-bold text-xl">${s.stats.ok}</div>
                            <div class="text-[9px] text-gray-500 font-bold">100</div>
                        </div>
                        <div class="text-center flex-1 border-r border-white/5">
                            <div class="text-yellow-300 font-bold text-xl">${s.stats.meh}</div>
                            <div class="text-[9px] text-gray-500 font-bold">50</div>
                        </div>
                        <div class="text-center flex-1">
                            <div class="text-red-500 font-bold text-xl">${s.stats.miss}</div>
                            <div class="text-[9px] text-gray-500 font-bold">MISS</div>
                        </div>
                    </div>

                    <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                        <h4 class="text-[10px] font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><i class="fas fa-info-circle"></i> Map Info</h4>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3">
                            <div class="map-stat-row"><span class="text-gray-400">CS</span><span class="text-white font-bold">${s.beatmap.cs}</span></div>
                            <div class="map-stat-row"><span class="text-gray-400">AR</span><span class="text-white font-bold">${s.beatmap.ar}</span></div>
                            <div class="map-stat-row"><span class="text-gray-400">OD</span><span class="text-white font-bold">${s.beatmap.od}</span></div>
                            <div class="map-stat-row"><span class="text-gray-400">HP</span><span class="text-white font-bold">${s.beatmap.hp}</span></div>
                            <div class="map-stat-row"><span class="text-gray-400">BPM</span><span class="text-white font-bold">${s.beatmap.bpm}</span></div>
                            <div class="map-stat-row"><span class="text-gray-400">Length</span><span class="text-white font-bold">${s.beatmap.length}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // Удаляем старую, если есть
    const existing = document.getElementById('score-modal-overlay');
    if (existing) existing.remove();
    
    // Вставляем новую
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden'; // Блок скролла фона
    
    // Анимация появления
    requestAnimationFrame(() => {
        document.getElementById('score-modal-overlay').classList.add('active');
    });
};

window.closeScoreModal = function(e) {
    if (e && !e.target.classList.contains('modal-overlay') && !e.target.closest('.close-modal-btn')) return;
    
    const modal = document.getElementById('score-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    document.body.style.overflow = '';
};


// --- ПРОФИЛЬ (BENTO GRID) ---
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
                <div class="text-[10px] text-gray-500 mt-2 text-right">Score: ${u.total_score}</div>
            </div>
        `;
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div class="col-span-4 text-center text-xs text-red-400 py-4">Failed to load stats</div>';
    }
}


// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function getRankColorClass(rank) {
    if(rank.includes('X')) return 'text-rank-SS';
    if(rank.includes('S')) return 'text-rank-S';
    if(rank === 'A') return 'text-rank-A';
    if(rank === 'B') return 'text-rank-B';
    if(rank === 'C') return 'text-rank-C';
    return 'text-rank-D';
}
function getAccColor(acc) {
    if(acc >= 99) return 'text-green-400';
    if(acc >= 97) return 'text-blue-300';
    if(acc >= 94) return 'text-yellow-300';
    return 'text-red-400';
}

function switchTab(t) { 
    // Поддержка анимации View Transitions API
    if (document.startViewTransition) { 
        document.startViewTransition(() => performSwitch(t)); 
    } else { 
        performSwitch(t); 
    }
}
function performSwitch(t) {
    document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active')); 
    document.querySelectorAll('.nav-btn').forEach(e=>e.classList.remove('active')); 
    document.getElementById('tab-'+t).classList.add('active'); 
    document.getElementById('btn-'+t).classList.add('active');
    if (t === 'stream' && typeof resize === 'function') setTimeout(resize, 100);
}

// Lanyard (Статус Discord)
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

function copyDiscord() { 
    navigator.clipboard.writeText(".morgun.").then(()=>{ 
        var t=document.getElementById("toast"); 
        t.className="show"; 
        setTimeout(()=>t.className=t.className.replace("show",""),3000); 
    }); 
}
function toggleFilter(id, btn) { const d = document.getElementById(id); d.classList.toggle('open'); btn.classList.toggle('active'); }
function setLang(lang) { localStorage.setItem('lang', lang); }

// ЗАПУСК
fetchLanyardStatus(); 
setInterval(fetchLanyardStatus, 10000);
loadTopScores(); 
loadUserStats();
