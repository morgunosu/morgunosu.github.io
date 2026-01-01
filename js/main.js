const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');

// Данные
window.topScoresData = [];
window.isLazerMode = false; 
window.visibleScoresCount = 5;
window.currentModalScore = null;
window.simMods = []; 

// --- INIT ---
function init() {
    loadTopScores();
    loadUserStats();
    fetchLanyardStatus();
    setInterval(fetchLanyardStatus, 10000);
    
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX; mouseY = e.clientY; isMoving = true;
    });
    requestAnimationFrame(updateCursorLoop);
    updateCursorUI();
    
    // Вкладки
    if(!document.querySelector('.tab-content.active')) {
        switchTab('profile');
    }
}

// --- КУРСОР ---
let mouseX = 0, mouseY = 0, isMoving = false;
let cursorEnabled = localStorage.getItem('customCursor') !== 'false';

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
window.toggleCursor = function() {
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

// --- TABS ---
window.switchTab = function(t) { 
    if (document.startViewTransition) document.startViewTransition(() => performSwitch(t)); 
    else performSwitch(t); 
}
function performSwitch(t) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active')); 
    document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active')); 
    const tab = document.getElementById('tab-'+t);
    const btn = document.getElementById('btn-'+t);
    if(tab) tab.classList.add('active'); 
    if(btn) btn.classList.add('active');
}

// --- СКОРЫ (ЛОГИКА НОВАЯ, ДИЗАЙН СТАРЫЙ) ---
async function loadTopScores() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    container.innerHTML = '<div class="flex justify-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-osu"></div></div>';

    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error('API Error');
        window.topScoresData = await res.json();
        renderScoresList();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-xs text-red-400 p-4">Failed to load scores.</div>';
    }
}

window.toggleScoreMode = function() { window.isLazerMode = !window.isLazerMode; renderScoresList(); }
window.showMoreScores = function() { window.visibleScoresCount = 50; renderScoresList(); }
window.showLessScores = function() { window.visibleScoresCount = 5; renderScoresList(); }

function renderScoresList() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    const data = window.topScoresData.slice(0, window.visibleScoresCount);
    
    let html = `
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="text-xl font-bold flex items-center gap-2">Top Performance</h3>
            <button onclick="toggleScoreMode()" class="bento-btn-small">
                <span class="${!window.isLazerMode ? 'text-white' : 'text-gray-500'}">Classic</span>
                <span class="mx-1 text-gray-600">/</span>
                <span class="${window.isLazerMode ? 'text-pink-400' : 'text-gray-500'}">Lazer</span>
            </button>
        </div>
        <div class="flex flex-col gap-2">
    `;

    html += data.map((s, idx) => {
        const modsHtml = s.mods.map(m => `<span class="mod-badge ${m}">${m}</span>`).join('');
        const scoreVal = window.isLazerMode ? s.score_lazer : s.score_classic;
        
        return `
        <div onclick="openScoreModal(${idx})" class="score-row group relative h-16 rounded-xl overflow-hidden cursor-pointer hover:bg-white/5 transition-colors border border-white/5">
            <div class="absolute left-0 top-0 bottom-0 w-1 ${getRankBgClass(s.rank)}"></div>
            
            <div class="relative z-10 flex items-center h-full px-4 gap-4 w-full">
                <div class="text-2xl font-bold italic w-10 text-center ${getRankColorClass(s.rank)}">${s.rank}</div>
                
                <div class="flex flex-col justify-center min-w-0 flex-grow">
                    <div class="text-sm font-bold text-white truncate group-hover:text-indigo-400 transition-colors">${s.beatmap.title}</div>
                    <div class="flex items-center gap-2 text-[10px] text-gray-500">
                        <span class="font-bold text-gray-400 bg-white/5 px-1.5 rounded">${s.beatmap.stars.toFixed(2)}★</span>
                        <span class="truncate">${s.beatmap.version}</span>
                        <span class="text-[9px] text-gray-600 font-mono">${Math.round(scoreVal).toLocaleString()}</span>
                    </div>
                </div>

                <div class="flex flex-col items-end justify-center">
                    <div class="flex gap-1 mb-1 scale-90 origin-right">${modsHtml}</div>
                    <div class="flex items-baseline gap-2">
                        <div class="text-lg font-bold text-indigo-300">${s.pp}pp</div>
                        <div class="text-xs font-bold ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
                    </div>
                </div>
            </div>
            
            <div class="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" style="background-image: url('${s.beatmap.cover}')"></div>
        </div>
        `;
    }).join('');

    if (window.topScoresData.length > 5) {
         const btnText = window.visibleScoresCount > 5 ? "Show Less" : "Show More";
         const btnAction = window.visibleScoresCount > 5 ? "showLessScores()" : "showMoreScores()";
         html += `<button onclick="${btnAction}" class="w-full py-3 mt-2 bento-btn-small text-xs uppercase tracking-widest text-gray-400">${btnText}</button>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

// === МОДАЛЬНОЕ ОКНО (BENTO STYLE) ===
window.openScoreModal = function(index) {
    const s = window.topScoresData[index];
    if(!s) return;
    window.currentModalScore = s;
    window.simMods = []; 

    const scoreVal = window.isLazerMode ? s.score_lazer : s.score_classic;
    const dateObj = new Date(s.date_iso);
    const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // PP Calc
    const ppIfFc = s.stats.miss === 0 ? s.pp : Math.round(s.pp * (1 + (s.stats.miss * 0.03))); 

    // Chart Data
    const totalHits = s.stats.great + s.stats.ok + s.stats.meh + s.stats.miss;
    const p300 = (s.stats.great / totalHits) * 100;
    const p100 = (s.stats.ok / totalHits) * 100;
    const p50 = (s.stats.meh / totalHits) * 100;
    const ringGradient = `conic-gradient(#60a5fa 0% ${p300}%, #4ade80 ${p300}% ${p300 + p100}%, #facc15 ${p300 + p100}% ${p300 + p100 + p50}%, #ef4444 ${p300 + p100 + p50}% 100%)`;

    const modalHtml = `
    <div class="modal-overlay active" onclick="closeScoreModal(event)">
        <div class="modal-card" onclick="event.stopPropagation()">
            <div class="relative h-48 w-full shrink-0 overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${s.beatmap.cover}'); filter: brightness(0.6);"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#141417] to-transparent"></div>
                <button onclick="closeScoreModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors z-20 cursor-pointer"><i class="fas fa-times"></i></button>

                <div class="absolute bottom-0 left-0 p-8 w-full">
                    <h2 class="text-3xl font-bold text-white leading-none mb-1 shadow-black drop-shadow-md">${s.beatmap.title}</h2>
                    <p class="text-lg text-gray-300 mb-3 drop-shadow-md">${s.beatmap.artist}</p>
                    <div class="flex gap-2">
                         <a href="${s.beatmap.url}" target="_blank" class="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded shadow transition-colors">Beatmap</a>
                         <span class="px-3 py-1 bg-black/40 text-white text-[10px] font-bold rounded border border-white/10">${s.beatmap.version}</span>
                    </div>
                </div>
            </div>

            <div class="p-8 bg-[#141417] grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div class="lg:col-span-7 flex flex-col gap-6">
                    <div class="flex items-center gap-6">
                        <div class="relative w-32 h-32 rounded-full flex items-center justify-center" style="background: ${ringGradient}; padding: 4px;">
                            <div class="w-full h-full bg-[#141417] rounded-full flex items-center justify-center">
                                <span class="text-6xl font-bold italic ${getRankColorClass(s.rank)}">${s.rank}</span>
                            </div>
                        </div>
                        <div>
                            <div class="text-3xl font-mono font-bold text-white tracking-widest">${Math.round(scoreVal).toLocaleString()}</div>
                            <div class="text-[10px] text-gray-500 font-bold uppercase mt-1">Total Score</div>
                            <div class="text-xs text-gray-500 mt-2">${dateStr}</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-4 gap-3">
                        <div class="bento-box text-center py-3">
                            <span class="text-[10px] font-bold text-gray-500 uppercase">PP</span>
                            <div class="text-xl font-bold text-indigo-400">${s.pp}</div>
                        </div>
                        <div class="bento-box text-center py-3">
                            <span class="text-[10px] font-bold text-gray-500 uppercase">Acc</span>
                            <div class="text-xl font-bold ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
                        </div>
                        <div class="bento-box text-center py-3">
                            <span class="text-[10px] font-bold text-gray-500 uppercase">Combo</span>
                            <div class="text-xl font-bold text-white">${s.max_combo}x</div>
                        </div>
                        <div class="bento-box text-center py-3">
                            <span class="text-[10px] font-bold text-gray-500 uppercase">If FC</span>
                            <div class="text-xl font-bold text-pink-400">~${ppIfFc}</div>
                        </div>
                    </div>

                    <div class="bento-box p-4 flex justify-between text-center">
                        <div><div class="text-lg font-bold text-blue-400">${s.stats.great}</div><div class="text-[9px] text-gray-500">300</div></div>
                        <div><div class="text-lg font-bold text-green-400">${s.stats.ok}</div><div class="text-[9px] text-gray-500">100</div></div>
                        <div><div class="text-lg font-bold text-yellow-400">${s.stats.meh}</div><div class="text-[9px] text-gray-500">50</div></div>
                        <div><div class="text-lg font-bold text-red-500">${s.stats.miss}</div><div class="text-[9px] text-gray-500">MISS</div></div>
                    </div>
                </div>

                <div class="lg:col-span-5 bento-box p-5 flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="text-xs font-bold text-white uppercase">Map Stats</h4>
                        <div class="flex gap-1">
                            <button onclick="toggleSimMod('NM')" id="btn-NM" class="calc-btn active">NM</button>
                            <button onclick="toggleSimMod('DT')" id="btn-DT" class="calc-btn">DT</button>
                            <button onclick="toggleSimMod('HR')" id="btn-HR" class="calc-btn">HR</button>
                            <button onclick="toggleSimMod('EZ')" id="btn-EZ" class="calc-btn">EZ</button>
                        </div>
                    </div>
                    <div id="sim-stats-container" class="space-y-2 text-sm font-mono flex-grow"></div>
                    <div class="mt-4 pt-4 border-t border-white/5 text-center">
                         <div class="text-[10px] text-gray-600">Difficulty</div>
                         <div class="text-2xl font-bold text-yellow-400" id="sim-stars">0.00★</div>
                    </div>
                </div>

            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    updateCalculator();
    updateCalculatorUI();
    requestAnimationFrame(()=>document.querySelector('.modal-overlay').classList.add('active'));
}

// Калькулятор (логика та же)
window.toggleSimMod = function(mod) {
    if (mod === 'NM') window.simMods = [];
    else {
        const idx = window.simMods.indexOf(mod);
        if (idx > -1) window.simMods.splice(idx, 1);
        else {
            if (mod === 'HR') window.simMods = window.simMods.filter(m => m !== 'EZ');
            if (mod === 'EZ') window.simMods = window.simMods.filter(m => m !== 'HR');
            window.simMods.push(mod);
        }
    }
    updateCalculatorUI();
    updateCalculator();
}
function updateCalculatorUI() {
    ['NM','DT','HR','EZ'].forEach(m => {
        const btn = document.getElementById(`btn-${m}`);
        if(btn) {
            if(m === 'NM' && window.simMods.length === 0) btn.classList.add('active');
            else if (window.simMods.includes(m)) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    });
}
function updateCalculator() {
    const s = window.currentModalScore;
    const base = s.beatmap;
    const mods = window.simMods;
    let cs = base.cs, ar = base.ar, od = base.od, hp = base.hp, bpm = base.bpm, stars = base.stars;

    if (mods.includes('HR')) { cs=Math.min(10,cs*1.3); ar=Math.min(10,ar*1.4); od=Math.min(10,od*1.4); hp=Math.min(10,hp*1.4); stars*=1.05; }
    else if (mods.includes('EZ')) { cs*=0.5; ar*=0.5; od*=0.5; hp*=0.5; stars*=0.8; }
    if (mods.includes('DT')) { bpm*=1.5; ar=Math.min(11,ar+1.5); od=Math.min(11,od+1.4); stars*=1.35; }

    const row = (lbl, val) => `
        <div class="flex justify-between items-center bg-black/20 p-2 rounded">
            <span class="text-gray-500 font-bold">${lbl}</span>
            <span class="text-white font-bold">${Math.round(val * 10) / 10}</span>
        </div>`;
    document.getElementById('sim-stats-container').innerHTML = `${row('CS', cs)}${row('AR', ar)}${row('OD', od)}${row('HP', hp)}${row('BPM', bpm)}`;
    document.getElementById('sim-stars').innerText = stars.toFixed(2) + '★';
}

window.closeScoreModal = function(e) {
    if (e && !e.target.classList.contains('modal-overlay') && !e.target.closest('button')) return;
    const el = document.querySelector('.modal-overlay');
    if (el) { el.classList.remove('active'); setTimeout(()=>el.remove(), 250); }
    document.body.style.overflow = '';
}

// --- USER STATS (BENTO GRID - СТАРЫЙ ДИЗАЙН) ---
async function loadUserStats() {
    const container = document.getElementById('live-stats-container');
    if(!container) return;
    try {
        const res = await fetch('/api/scores?type=user');
        if(!res.ok) throw new Error("API Error");
        const u = await res.json();
        
        // ВОЗВРАЩАЕМ СТАРУЮ СТРУКТУРУ BENTO GRID
        container.className = "grid grid-cols-2 md:grid-cols-4 gap-4 mt-2";
        container.innerHTML = `
            <div class="col-span-2 md:col-span-4 bento-card p-0 relative group">
                <div class="absolute inset-0 h-full w-full bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity duration-500" style="background-image: url('${u.cover_url}');"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#141417] via-[#141417]/90 to-transparent"></div>
                <div class="relative z-10 flex items-center p-6 gap-6">
                    <img src="${u.avatar_url}" class="w-20 h-20 rounded-2xl border-2 border-white/10 shadow-2xl">
                    <div class="flex-grow">
                        <div class="flex items-center gap-3">
                            <h2 class="text-4xl font-bold text-white tracking-tight">${u.username}</h2>
                            <div class="bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-1.5">
                                <img src="https://flagcdn.com/20x15/${u.country.toLowerCase()}.png" class="rounded-[2px]">
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-3">
                            <span class="text-xs bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg text-indigo-300 font-bold">Global #${u.global_rank}</span>
                            <span class="text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-gray-400 font-bold">${u.country} #${u.country_rank}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="bento-card p-5 flex flex-col justify-center text-center">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">PP</div>
                <div class="text-3xl font-bold text-indigo-400">${u.pp}</div>
            </div>
            <div class="bento-card p-5 flex flex-col justify-center text-center">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Accuracy</div>
                <div class="text-3xl font-bold text-white">${u.accuracy}<span class="text-sm text-gray-500 ml-0.5">%</span></div>
            </div>
            <div class="bento-card p-5 flex flex-col justify-center text-center">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Play Count</div>
                <div class="text-3xl font-bold text-white">${u.play_count}</div>
            </div>
            <div class="bento-card p-5 flex flex-col justify-center text-center">
                <div class="flex justify-between items-end mb-2">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Level ${u.level}</div>
                    <div class="text-[10px] font-bold text-yellow-400">${u.level_progress}%</div>
                </div>
                <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-400 rounded-full" style="width: ${u.level_progress}%"></div>
                </div>
            </div>
        `;
    } catch(e) { console.error(e); }
}

async function fetchLanyardStatus() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await res.json();
        if (data.success) updateStatusBadges(data.data);
    } catch (e) { console.error(e); }
}
function updateStatusBadges(discordData) {
    const profileWrapper = document.getElementById('profile-status-wrapper');
    if(!profileWrapper) return;
    const status = discordData.discord_status || 'offline';
    let color = status === 'online' ? 'bg-green-500' : (status === 'dnd' ? 'bg-red-500' : 'bg-gray-500');
    profileWrapper.innerHTML = `
        <div class="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span class="w-2 h-2 rounded-full ${color} ${status === 'online' ? 'animate-pulse' : ''}"></span>
            <span class="text-xs font-bold text-gray-300 uppercase">${status}</span>
        </div>`;
}
window.copyDiscord = function() { navigator.clipboard.writeText(".morgun."); const t = document.getElementById("toast"); t.className="show"; setTimeout(()=>t.className="", 3000); }
window.toggleFilter = function(id, btn) { document.getElementById(id).classList.toggle('open'); btn.classList.toggle('active'); }
window.setLang = function(lang) { localStorage.setItem('lang', lang); }

// --- HELPERS ---
function getRankColorClass(rank) {
    if(rank.includes('X')) return 'text-gray-100 drop-shadow-md';
    if(rank.includes('S')) return 'text-[#facc15] drop-shadow-md';
    if(rank === 'A') return 'text-[#4ade80]';
    if(rank === 'B') return 'text-[#60a5fa]';
    return 'text-[#f87171]';
}
function getRankBgClass(rank) {
    if(rank.includes('X')) return 'bg-gray-100';
    if(rank.includes('S')) return 'bg-[#facc15]';
    if(rank === 'A') return 'bg-[#4ade80]';
    if(rank === 'B') return 'bg-[#60a5fa]';
    return 'bg-[#f87171]';
}
function getAccColor(acc) {
    if(acc >= 99) return 'text-[#4ade80]';
    if(acc >= 97) return 'text-[#60a5fa]';
    if(acc >= 94) return 'text-[#facc15]';
    return 'text-[#f87171]';
}

init();
