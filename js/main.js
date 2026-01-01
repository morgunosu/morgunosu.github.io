const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');
window.topScoresData = [];

// --- КУРСОР ---
let mouseX = 0, mouseY = 0, isMoving = false;
let cursorEnabled = localStorage.getItem('customCursor') !== 'false';

document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; isMoving = true; });

function updateCursorLoop() {
    if (isMoving && cursorEnabled && cursor) {
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
updateCursorUI();

// --- НОВЫЙ ДИЗАЙН ТОП СКОРОВ ---
async function loadTopScores() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    container.innerHTML = '<div class="flex items-center justify-center h-20"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-osu"></div></div>';

    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error('API Error');
        const scores = await res.json();
        window.topScoresData = scores;

        let html = `<div class="flex flex-col gap-2 p-2">`;

        html += scores.map((s, index) => {
            // Формируем моды (без object Object)
            const modsHtml = s.mods.map(m => 
                `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2a2a30] text-[#ffcc22] border border-[#ffcc22]/20">${m}</span>`
            ).join('');

            return `
            <div onclick="openScoreModal(${index})" class="group relative flex items-center bg-[#18181b] hover:bg-[#202024] border border-white/5 hover:border-white/10 rounded-xl p-3 cursor-pointer transition-all duration-200 overflow-hidden">
                <div class="w-12 flex-shrink-0 text-center relative z-10">
                    <span class="text-2xl font-black italic ${getRankColorClass(s.rank)} drop-shadow-lg">${s.rank}</span>
                </div>
                
                <div class="flex-grow min-w-0 px-3 flex flex-col justify-center relative z-10">
                    <div class="text-sm font-bold text-gray-200 truncate group-hover:text-white transition-colors leading-tight">${s.beatmap.title}</div>
                    <div class="text-[11px] text-gray-500 truncate mt-0.5">${s.beatmap.artist} <span class="text-gray-600">•</span> ${s.beatmap.version}</div>
                </div>

                <div class="flex flex-col items-end gap-1 relative z-10 min-w-[80px]">
                    <div class="text-[15px] font-bold text-[#8fbfff] leading-none">${s.pp}<span class="text-[10px] text-gray-500 ml-0.5">pp</span></div>
                    <div class="flex items-center gap-2">
                         <div class="flex gap-1">${modsHtml}</div>
                         <div class="text-[10px] font-bold ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
                    </div>
                </div>

                <div class="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none grayscale" style="background-image: url('${s.beatmap.cover}')"></div>
            </div>
            `;
        }).join('');

        html += `</div>`;
        container.innerHTML = html;
        container.parentElement.style.padding = "0"; // Убираем отступы родителя

    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-xs text-red-400 py-4">Failed to load scores. Check API Key.</div>';
    }
}

// --- НОВОЕ МОДАЛЬНОЕ ОКНО ---
window.openScoreModal = function(index) {
    const s = window.topScoresData[index];
    if (!s) return;

    // Форматирование даты
    const dateObj = new Date(s.date_iso);
    const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Форматирование длительности
    const mins = Math.floor(s.beatmap.length / 60);
    const secs = (s.beatmap.length % 60).toString().padStart(2, '0');

    const modalHtml = `
    <div class="modal-overlay active" id="score-modal-overlay" onclick="closeScoreModal(event)">
        <div class="score-modal bg-[#121214] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-3xl mx-4" onclick="event.stopPropagation()">
            <div class="relative h-40 w-full overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center blur-[2px] opacity-60 scale-105" style="background-image: url('${s.beatmap.cover}');"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-[#121214]/60 to-[#121214]"></div>
                
                <button onclick="closeScoreModal()" class="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"><i class="fas fa-times"></i></button>

                <div class="absolute bottom-4 left-6 right-6 z-10 flex items-end justify-between">
                    <div class="min-w-0">
                        <h2 class="text-2xl font-black text-white leading-tight truncate shadow-black drop-shadow-md">${s.beatmap.title}</h2>
                        <p class="text-sm text-gray-300 font-medium truncate">${s.beatmap.artist}</p>
                    </div>
                    <div class="hidden sm:block text-right">
                        <div class="inline-flex gap-2">
                            <a href="${s.beatmap.url}" target="_blank" class="px-3 py-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-colors shadow-lg">Beatmap Page</a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div class="flex flex-col items-center justify-center md:border-r border-white/5 md:pr-6">
                    <div class="w-24 h-24 rounded-full border-[6px] border-[#202024] bg-[#18181b] flex items-center justify-center shadow-inner mb-4 relative">
                        <div class="absolute inset-0 rounded-full border-2 border-white/5"></div>
                        <span class="text-5xl font-black italic ${getRankColorClass(s.rank)}">${s.rank}</span>
                    </div>
                    <div class="text-3xl font-black text-white tracking-wider font-mono">${s.score}</div>
                    <div class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Total Score</div>
                </div>

                <div class="col-span-2 flex flex-col gap-5">
                    
                    <div class="grid grid-cols-4 gap-3">
                        <div class="bg-[#18181b] p-3 rounded-lg border border-white/5 text-center">
                            <div class="text-[10px] text-gray-500 font-bold uppercase">PP</div>
                            <div class="text-lg font-bold text-[#8fbfff]">${s.pp}</div>
                        </div>
                        <div class="bg-[#18181b] p-3 rounded-lg border border-white/5 text-center">
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Acc</div>
                            <div class="text-lg font-bold ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
                        </div>
                        <div class="bg-[#18181b] p-3 rounded-lg border border-white/5 text-center">
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Combo</div>
                            <div class="text-lg font-bold text-[#b3ff66]">${s.max_combo}x</div>
                        </div>
                        <div class="bg-[#18181b] p-3 rounded-lg border border-white/5 text-center">
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Miss</div>
                            <div class="text-lg font-bold text-[#ff6666]">${s.stats.miss}</div>
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex justify-between text-[10px] font-bold uppercase px-1">
                            <span class="text-[#66ccff]">300 <span class="text-white ml-1">${s.stats.great}</span></span>
                            <span class="text-[#88ff44]">100 <span class="text-white ml-1">${s.stats.ok}</span></span>
                            <span class="text-[#ffcc22]">50 <span class="text-white ml-1">${s.stats.meh}</span></span>
                            <span class="text-[#ff4444]">Miss <span class="text-white ml-1">${s.stats.miss}</span></span>
                        </div>
                        <div class="h-2 w-full flex rounded-full overflow-hidden bg-[#202024]">
                            <div class="h-full bg-[#66ccff]" style="width: ${(s.stats.great / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                            <div class="h-full bg-[#88ff44]" style="width: ${(s.stats.ok / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                            <div class="h-full bg-[#ffcc22]" style="width: ${(s.stats.meh / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                            <div class="h-full bg-[#ff4444]" style="width: ${(s.stats.miss / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                        </div>
                    </div>

                    <div class="grid grid-cols-3 gap-y-2 gap-x-4 text-[11px] border-t border-white/5 pt-4 mt-auto">
                        <div class="flex justify-between"><span class="text-gray-500">CS</span> <span class="text-gray-300 font-bold">${s.beatmap.cs}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">AR</span> <span class="text-gray-300 font-bold">${s.beatmap.ar}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">Length</span> <span class="text-gray-300 font-bold">${mins}:${secs}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">OD</span> <span class="text-gray-300 font-bold">${s.beatmap.od}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">HP</span> <span class="text-gray-300 font-bold">${s.beatmap.hp}</span></div>
                        <div class="flex justify-between"><span class="text-gray-500">BPM</span> <span class="text-gray-300 font-bold">${s.beatmap.bpm}</span></div>
                    </div>
                </div>
            </div>
            
            <div class="bg-[#0e0e10] px-6 py-3 flex justify-between items-center text-[10px] text-gray-600 font-mono border-t border-white/5">
                <span>Played on ${dateStr} at ${timeStr}</span>
                <span>Mapped by ${s.beatmap.creator}</span>
            </div>
        </div>
    </div>
    `;

    const existing = document.getElementById('score-modal-overlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => document.getElementById('score-modal-overlay').classList.add('active'));
};

window.closeScoreModal = function(e) {
    if (e && !e.target.classList.contains('modal-overlay') && !e.target.closest('.close-modal-btn')) return;
    const modal = document.getElementById('score-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 250);
    }
    document.body.style.overflow = '';
};

// --- ВСПОМОГАТЕЛЬНЫЕ ---
function getRankColorClass(rank) {
    if(rank.includes('X')) return 'text-[#e4e4e4] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]';
    if(rank.includes('S')) return 'text-[#ffcc22] drop-shadow-[0_0_8px_rgba(255,204,34,0.4)]';
    if(rank === 'A') return 'text-[#22c55e]';
    if(rank === 'B') return 'text-[#3b82f6]';
    if(rank === 'C') return 'text-[#a855f7]';
    return 'text-[#ef4444]';
}
function getAccColor(acc) {
    if(acc >= 99) return 'text-[#22c55e]';
    if(acc >= 97) return 'text-[#8fbfff]';
    if(acc >= 94) return 'text-[#ffcc22]';
    return 'text-[#ff4444]';
}

// ... ОСТАВЬТЕ ВСЕ ОСТАЛЬНЫЕ ФУНКЦИИ (switchTab, loadUserStats, Lanyard) БЕЗ ИЗМЕНЕНИЙ ...
// Скопируйте функции switchTab, copyDiscord, fetchLanyardStatus из предыдущего кода, 
// так как я обновил только логику скоров и модалки.
// ...
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
function toggleFilter(id, btn) { const d = document.getElementById(id); d.classList.toggle('open'); btn.classList.toggle('active'); }
function setLang(lang) { localStorage.setItem('lang', lang); }
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

fetchLanyardStatus(); 
setInterval(fetchLanyardStatus, 10000);
loadTopScores(); 
loadUserStats();
