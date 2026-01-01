const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');

// --- STATE ---
window.topScoresData = [];
window.isLazerMode = false; // По умолчанию Score V1 (Classic)
window.visibleScoresCount = 5; // Сначала показываем 5
window.currentModalScore = null;
window.activeSimulationMods = []; // Для калькулятора в модалке

// --- CURSOR ---
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

// --- LOGIC: SCORES ---

async function loadTopScores() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    container.innerHTML = '<div class="flex items-center justify-center h-20"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-osu"></div></div>';

    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error('API Error');
        window.topScoresData = await res.json();
        renderScoresList();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-xs text-red-400 py-4">Failed to load scores. Check API Key.</div>';
    }
}

function toggleScoreMode() {
    window.isLazerMode = !window.isLazerMode;
    renderScoresList();
}

function showMoreScores() {
    window.visibleScoresCount = window.topScoresData.length; // Показать все
    renderScoresList();
}

function showLessScores() {
    window.visibleScoresCount = 5;
    renderScoresList();
}

function renderScoresList() {
    const container = document.getElementById('scores-container');
    const scoresToRender = window.topScoresData.slice(0, window.visibleScoresCount);
    
    // Header with Toggle
    let html = `
        <div class="flex items-center justify-between px-2 py-3 mb-2 border-b border-white/5">
            <div class="flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <span class="w-8 text-center">Rank</span>
                <span>Map</span>
            </div>
            <button onclick="toggleScoreMode()" class="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-2 py-1 rounded-full transition-all border border-white/5">
                <span class="text-[9px] font-bold ${!window.isLazerMode ? 'text-indigo-400' : 'text-gray-600'}">Score V1</span>
                <div class="w-6 h-3 bg-black/50 rounded-full relative">
                    <div class="absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${window.isLazerMode ? 'left-3.5' : 'left-0.5'}"></div>
                </div>
                <span class="text-[9px] font-bold ${window.isLazerMode ? 'text-pink-400' : 'text-gray-600'}">Lazer</span>
            </button>
        </div>
        <div class="flex flex-col gap-1.5">
    `;

    // List
    html += scoresToRender.map((s, index) => {
        const scoreValue = window.isLazerMode ? s.score_lazer : s.score_classic;
        const formattedScore = Math.round(scoreValue).toLocaleString();
        
        // Красивые моды
        const modsHtml = s.mods.map(m => 
            `<span class="mod-pill ${m}">${m}</span>`
        ).join('');

        return `
        <div onclick="openScoreModal(${index})" class="group relative flex items-center bg-[#121214]/80 hover:bg-[#1a1a1d] border border-white/5 hover:border-white/20 rounded-lg p-2 cursor-pointer transition-all duration-300 overflow-hidden h-14">
            <div class="absolute inset-0 bg-cover bg-center opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-40 transition-all duration-500 ease-out" style="background-image: url('${s.beatmap.cover}')"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/80 to-transparent"></div>

            <div class="w-10 flex-shrink-0 text-center relative z-10">
                <span class="font-rank text-2xl ${getRankColorClass(s.rank)}">${s.rank}</span>
            </div>
            
            <div class="flex-grow min-w-0 px-2 flex flex-col justify-center relative z-10">
                <div class="text-xs font-bold text-gray-200 group-hover:text-white truncate">${s.beatmap.title}</div>
                <div class="flex items-center gap-2 mt-0.5">
                    <div class="text-[9px] text-gray-500 font-bold bg-black/30 px-1 rounded">${s.beatmap.stars}★</div>
                    <div class="text-[10px] text-gray-400 truncate">${s.beatmap.version}</div>
                </div>
            </div>

            <div class="flex flex-col items-end gap-0.5 relative z-10 min-w-[80px]">
                <div class="flex gap-1 h-3.5 mb-0.5">${modsHtml}</div>
                <div class="text-sm font-black text-indigo-300 leading-none">${s.pp}pp</div>
                <div class="text-[9px] font-mono text-gray-500">${s.accuracy}%</div>
            </div>
        </div>
        `;
    }).join('');

    html += `</div>`;

    // Show More / Less Button
    if (window.topScoresData.length > 5) {
        if (window.visibleScoresCount < window.topScoresData.length) {
            html += `<button onclick="showMoreScores()" class="w-full mt-3 py-2 text-xs font-bold text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors uppercase tracking-widest">Show All (${window.topScoresData.length})</button>`;
        } else {
            html += `<button onclick="showLessScores()" class="w-full mt-3 py-2 text-xs font-bold text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors uppercase tracking-widest">Show Less</button>`;
        }
    }

    container.innerHTML = html;
}

// === MODAL & CALCULATOR LOGIC ===

window.openScoreModal = function(index) {
    const s = window.topScoresData[index];
    if (!s) return;
    window.currentModalScore = s;
    window.activeSimulationMods = [...s.mods]; // Копируем моды скора как начальные

    const dateObj = new Date(s.date_iso);
    const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const scoreVal = window.isLazerMode ? s.score_lazer : s.score_classic;

    const modalHtml = `
    <div class="glass-overlay active" id="score-modal-overlay" onclick="closeScoreModal(event)">
        <div class="glass-modal" onclick="event.stopPropagation()">
            <button onclick="closeScoreModal()" class="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-black/20 text-white/50 hover:text-white hover:bg-red-500/80 backdrop-blur-md flex items-center justify-center transition-all duration-300"><i class="fas fa-times"></i></button>

            <div class="relative h-56 w-full overflow-hidden shrink-0">
                <div class="absolute inset-0 bg-cover bg-center blur-sm scale-110" style="background-image: url('${s.beatmap.cover}');"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-[#0f0f10]"></div>
                
                <div class="absolute bottom-0 left-0 p-8 w-full">
                    <h2 class="text-3xl font-black text-white leading-tight drop-shadow-lg tracking-tight">${s.beatmap.title}</h2>
                    <p class="text-lg text-gray-200 font-medium drop-shadow-md mb-3">${s.beatmap.artist}</p>
                    <div class="flex gap-2">
                        <a href="${s.beatmap.url}" target="_blank" class="px-4 py-1.5 rounded-full bg-indigo-500/80 hover:bg-indigo-500 text-white text-xs font-bold backdrop-blur-md shadow-lg transition-all transform hover:scale-105">Open Beatmap</a>
                    </div>
                </div>
            </div>

            <div class="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                
                <div class="flex flex-col items-center justify-start lg:border-r border-white/5 lg:pr-8">
                    <div class="font-rank text-8xl ${getRankColorClass(s.rank)} drop-shadow-2xl mb-2">${s.rank}</div>
                    <div class="text-4xl font-black text-white tracking-widest font-mono tabular-nums mb-1">${Math.round(scoreVal).toLocaleString()}</div>
                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-6">${window.isLazerMode ? 'Lazer Score' : 'Classic Score'}</div>
                    
                    <div class="grid grid-cols-2 gap-4 w-full">
                        <div class="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                            <div class="text-[10px] text-gray-500 font-bold uppercase">PP</div>
                            <div class="text-2xl font-black text-indigo-400">${s.pp}</div>
                        </div>
                        <div class="bg-white/5 p-3 rounded-2xl text-center border border-white/5">
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Acc</div>
                            <div class="text-2xl font-black ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
                        </div>
                    </div>
                </div>

                <div class="col-span-2 flex flex-col gap-6">
                    
                    <div class="bg-black/20 p-5 rounded-2xl border border-white/5">
                        <div class="flex justify-between items-center mb-2">
                            <div class="text-center"><div class="text-blue-300 font-bold text-xl">${s.stats.great}</div><div class="text-[9px] text-gray-500 font-bold">300</div></div>
                            <div class="text-center"><div class="text-green-300 font-bold text-xl">${s.stats.ok}</div><div class="text-[9px] text-gray-500 font-bold">100</div></div>
                            <div class="text-center"><div class="text-yellow-300 font-bold text-xl">${s.stats.meh}</div><div class="text-[9px] text-gray-500 font-bold">50</div></div>
                            <div class="text-center"><div class="text-red-500 font-bold text-xl">${s.stats.miss}</div><div class="text-[9px] text-gray-500 font-bold">MISS</div></div>
                        </div>
                        <div class="h-1.5 w-full flex rounded-full overflow-hidden bg-white/5">
                            <div class="h-full bg-blue-400" style="width: ${(s.stats.great / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                            <div class="h-full bg-green-400" style="width: ${(s.stats.ok / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                            <div class="h-full bg-yellow-400" style="width: ${(s.stats.meh / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                            <div class="h-full bg-red-500" style="width: ${(s.stats.miss / (s.stats.great+s.stats.ok+s.stats.meh+s.stats.miss))*100}%"></div>
                        </div>
                    </div>

                    <div class="bg-white/5 rounded-2xl p-6 border border-white/5 relative group">
                        <div class="flex justify-between items-center mb-6">
                            <h4 class="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2"><i class="fas fa-sliders-h text-indigo-400"></i> Map Stats Simulator</h4>
                            <div class="flex gap-2">
                                <button onclick="toggleSimMod('DT')" id="sim-btn-DT" class="sim-mod-btn ${s.mods.includes('DT') || s.mods.includes('NC') ? 'active' : ''}">DT</button>
                                <button onclick="toggleSimMod('HR')" id="sim-btn-HR" class="sim-mod-btn ${s.mods.includes('HR') ? 'active' : ''}">HR</button>
                                <button onclick="toggleSimMod('EZ')" id="sim-btn-EZ" class="sim-mod-btn ${s.mods.includes('EZ') ? 'active' : ''}">EZ</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-y-4 gap-x-8 text-xs font-mono" id="sim-stats-grid">
                            </div>
                        <div class="mt-4 text-[10px] text-center text-gray-500 italic">Click mods above to see how Difficulty changes</div>
                    </div>
                    
                </div>
            </div>
        </div>
    </div>
    `;

    // Render
    const existing = document.getElementById('score-modal-overlay');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    
    // Initial Calc
    updateSimulationStats();
    
    requestAnimationFrame(() => document.getElementById('score-modal-overlay').classList.add('active'));
};

window.toggleSimMod = function(mod) {
    const idx = window.activeSimulationMods.indexOf(mod);
    if (idx > -1) {
        window.activeSimulationMods.splice(idx, 1);
        document.getElementById(`sim-btn-${mod}`).classList.remove('active');
    } else {
        // Конфликты
        if (mod === 'HR' && window.activeSimulationMods.includes('EZ')) window.toggleSimMod('EZ');
        if (mod === 'EZ' && window.activeSimulationMods.includes('HR')) window.toggleSimMod('HR');
        
        window.activeSimulationMods.push(mod);
        document.getElementById(`sim-btn-${mod}`).classList.add('active');
    }
    updateSimulationStats();
}

function updateSimulationStats() {
    const s = window.currentModalScore;
    const mods = window.activeSimulationMods;
    const base = s.beatmap;

    // Base values
    let cs = base.cs;
    let ar = base.ar;
    let od = base.od;
    let hp = base.hp;
    let bpm = base.bpm;
    let length = base.length; // seconds

    // 1. Apply EZ/HR (Multipliers)
    if (mods.includes('HR')) {
        cs = Math.min(10, cs * 1.3);
        ar = Math.min(10, ar * 1.4);
        od = Math.min(10, od * 1.4);
        hp = Math.min(10, hp * 1.4);
    } else if (mods.includes('EZ')) {
        cs = cs * 0.5;
        ar = ar * 0.5;
        od = od * 0.5;
        hp = hp * 0.5;
    }

    // 2. Apply DT (Speed) - Note: DT modifies speed, which affects AR/OD "perceived" values, but simpler to just show Speed increase
    let speedMult = 1.0;
    if (mods.includes('DT') || mods.includes('NC')) {
        speedMult = 1.5;
        bpm = bpm * 1.5;
        length = length / 1.5;
        // AR calculation for DT is complex (ms based), simplified here for display:
        // Usually AR 8 + DT ~= AR 9.6, AR 9 + DT ~= 10.3
        if (ar > 5) ar = Math.min(11, ar + (11 - ar)/1.5); // Rough approx
        else ar = Math.min(10, ar + 2);
        od = Math.min(11, od + (11-od)/1.5);
    }

    // Format Length
    const mins = Math.floor(length / 60);
    const secs = Math.floor(length % 60).toString().padStart(2, '0');

    // Render
    const grid = document.getElementById('sim-stats-grid');
    
    // Helper to color changed stats
    const valClass = (val, baseVal) => {
        if (Math.abs(val - baseVal) < 0.01) return 'text-gray-300';
        return val > baseVal ? 'text-red-400 font-bold' : 'text-blue-400 font-bold';
    };
    const diffStat = (label, val, baseVal) => `
        <div class="flex justify-between items-center border-b border-white/5 pb-1">
            <span class="text-gray-500">${label}</span>
            <span class="${valClass(val, baseVal)}">${Number(val).toFixed(1).replace('.0','')}</span>
        </div>`;

    grid.innerHTML = `
        ${diffStat('CS', cs, base.cs)}
        ${diffStat('AR', ar, base.ar)}
        ${diffStat('OD', od, base.od)}
        ${diffStat('HP', hp, base.hp)}
        <div class="flex justify-between items-center border-b border-white/5 pb-1"><span class="text-gray-500">BPM</span><span class="${bpm > base.bpm ? 'text-red-400 font-bold' : 'text-gray-300'}">${Math.round(bpm)}</span></div>
        <div class="flex justify-between items-center border-b border-white/5 pb-1"><span class="text-gray-500">Length</span><span class="${length < base.length ? 'text-red-400 font-bold' : 'text-gray-300'}">${mins}:${secs}</span></div>
    `;
}

window.closeScoreModal = function(e) {
    if (e && !e.target.classList.contains('glass-overlay') && !e.target.closest('button')) return;
    const modal = document.getElementById('score-modal-overlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 250);
    }
    document.body.style.overflow = '';
};

// --- HELPERS ---
function getRankColorClass(rank) {
    // Custom font needed for this to look right
    if(rank.includes('X')) return 'text-gray-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]';
    if(rank.includes('S')) return 'text-[#ffcc22] drop-shadow-[0_0_10px_rgba(255,204,34,0.6)]';
    if(rank === 'A') return 'text-[#22c55e] drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    if(rank === 'B') return 'text-[#3b82f6]';
    return 'text-[#ff4444]';
}
function getAccColor(acc) {
    if(acc >= 99) return 'text-[#22c55e]';
    if(acc >= 97) return 'text-[#8fbfff]';
    if(acc >= 94) return 'text-[#ffcc22]';
    return 'text-[#ff4444]';
}

// ... КОПИРУЙТЕ ОСТАЛЬНЫЕ ФУНКЦИИ (switchTab, loadUserStats, Lanyard) БЕЗ ИЗМЕНЕНИЙ ...
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
