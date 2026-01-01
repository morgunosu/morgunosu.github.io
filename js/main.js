const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');

// Данные
window.topScoresData = [];
window.isLazerMode = false; 
window.visibleScoresCount = 5;

// --- ИНИЦИАЛИЗАЦИЯ ---
function init() {
    loadTopScores();
    loadUserStats();
    fetchLanyardStatus();
    setInterval(fetchLanyardStatus, 10000);
    
    // Курсор
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX; mouseY = e.clientY; isMoving = true;
    });
    requestAnimationFrame(updateCursorLoop);
    updateCursorUI();
    
    // Активация первой вкладки
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

// --- ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК ---
window.switchTab = function(t) { 
    if (document.startViewTransition) { 
        document.startViewTransition(() => performSwitch(t)); 
    } else { 
        performSwitch(t); 
    }
}

function performSwitch(t) {
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active')); 
    document.querySelectorAll('.nav-btn').forEach(e => e.classList.remove('active')); 
    
    const tab = document.getElementById('tab-'+t);
    const btn = document.getElementById('btn-'+t);
    if(tab) tab.classList.add('active'); 
    if(btn) btn.classList.add('active');
}

// --- ЗАГРУЗКА И ОТОБРАЖЕНИЕ СКОРОВ ---
async function loadTopScores() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    container.innerHTML = '<div class="flex justify-center p-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>';

    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error('API Error');
        window.topScoresData = await res.json();
        renderScoresList();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div class="text-center text-red-400 p-4">Error loading scores. Check API Key.</div>';
    }
}

window.toggleScoreMode = function() { window.isLazerMode = !window.isLazerMode; renderScoresList(); }
window.showMoreScores = function() { window.visibleScoresCount = 50; renderScoresList(); }
window.showLessScores = function() { window.visibleScoresCount = 5; renderScoresList(); }

function renderScoresList() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    const data = window.topScoresData.slice(0, window.visibleScoresCount);
    
    // Шапка списка
    let html = `
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="text-xl font-bold flex items-center gap-2 text-white">Top Performance</h3>
            <button onclick="toggleScoreMode()" class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold transition-all hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                <span class="${!window.isLazerMode ? 'text-white' : 'text-gray-500'}">Classic</span>
                <i class="fas fa-exchange-alt text-gray-500"></i>
                <span class="${window.isLazerMode ? 'text-pink-400' : 'text-gray-500'}">Lazer</span>
            </button>
        </div>
        <div class="flex flex-col gap-2">
    `;

    // Список скоров
    html += data.map((s, idx) => {
        const modsHtml = s.mods.map(m => `<span class="mod-badge ${m}">${m}</span>`).join('');
        
        return `
        <div onclick="openScoreModal(${idx})" class="glass-score-row group relative h-16 rounded-xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform">
            <div class="absolute left-0 top-0 bottom-0 w-1 ${getRankBgClass(s.rank)}"></div>
            
            <div class="relative z-10 flex items-center h-full px-4 gap-4 w-full">
                <div class="text-3xl font-rank italic w-10 text-center ${getRankColorClass(s.rank)}">${s.rank}</div>
                
                <div class="flex flex-col justify-center min-w-0 flex-grow">
                    <div class="text-sm font-bold text-white truncate group-hover:text-blue-300 transition-colors">${s.beatmap.title}</div>
                    <div class="flex items-center gap-2 text-[10px] text-gray-400">
                        <span class="font-bold text-gray-300 bg-white/10 px-1.5 rounded">${s.beatmap.stars.toFixed(2)}★</span>
                        <span class="truncate">${s.beatmap.version}</span>
                    </div>
                </div>

                <div class="flex flex-col items-end justify-center">
                    <div class="flex gap-1 mb-1 scale-90 origin-right">${modsHtml}</div>
                    <div class="flex items-baseline gap-2">
                        <div class="text-xl font-bold text-indigo-300">${s.pp}pp</div>
                        <div class="text-xs font-bold ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
                    </div>
                </div>
            </div>
            
            <div class="absolute inset-0 bg-cover bg-center opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" style="background-image: url('${s.beatmap.cover}')"></div>
        </div>
        `;
    }).join('');

    // Кнопка "Показать еще"
    if (window.topScoresData.length > 5) {
         const btnText = window.visibleScoresCount > 5 ? "Show Less" : "Show More";
         const btnAction = window.visibleScoresCount > 5 ? "showLessScores()" : "showMoreScores()";
         html += `<button onclick="${btnAction}" class="w-full py-3 mt-2 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-gray-400 rounded-xl transition-colors cursor-pointer">${btnText}</button>`;
    }
    html += `</div>`;
    container.innerHTML = html;
}

// --- МОДАЛЬНОЕ ОКНО (ПОДРОБНОСТИ) ---
window.openScoreModal = function(index) {
    const s = window.topScoresData[index];
    if(!s) return;

    const scoreVal = window.isLazerMode ? s.score_lazer : s.score_classic;
    const dateObj = new Date(s.date_iso);
    const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Расчет PP if FC (примерный)
    const ppIfFc = s.stats.miss === 0 ? s.pp : Math.round(s.pp * (1 + (s.stats.miss * 0.03))); 

    // Данные для круговой диаграммы
    const totalHits = s.stats.great + s.stats.ok + s.stats.meh + s.stats.miss;
    const p300 = (s.stats.great / totalHits) * 100;
    const p100 = (s.stats.ok / totalHits) * 100;
    const p50 = (s.stats.meh / totalHits) * 100;
    
    // CSS градиент для кольца
    const ringGradient = `conic-gradient(
        #60a5fa 0% ${p300}%, 
        #4ade80 ${p300}% ${p300 + p100}%, 
        #facc15 ${p300 + p100}% ${p300 + p100 + p50}%, 
        #ef4444 ${p300 + p100 + p50}% 100%
    )`;

    const modalHtml = `
    <div class="glass-overlay active" onclick="closeScoreModal(event)">
        <div class="glass-modal" onclick="event.stopPropagation()">
            <div class="relative h-48 w-full shrink-0 overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${s.beatmap.cover}'); filter: blur(8px) brightness(0.6);"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
                <button onclick="closeScoreModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-20 cursor-pointer"><i class="fas fa-times"></i></button>

                <div class="absolute bottom-0 left-0 p-8 w-full flex items-end justify-between">
                    <div>
                        <h2 class="text-3xl font-bold text-white leading-none mb-1 text-shadow">${s.beatmap.title}</h2>
                        <p class="text-lg text-gray-300 mb-2">${s.beatmap.artist}</p>
                        <div class="flex gap-2">
                             <a href="${s.beatmap.url}" target="_blank" class="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-full shadow-lg transition-colors">Download</a>
                             <span class="px-3 py-1 bg-white/10 text-white text-[10px] font-bold rounded-full border border-white/10">${s.beatmap.version}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="p-8 bg-[#050505] flex flex-col md:flex-row gap-8">
                
                <div class="flex flex-col items-center justify-center min-w-[200px]">
                    <div class="relative w-40 h-40 rounded-full flex items-center justify-center mb-4" style="background: ${ringGradient}; padding: 6px; box-shadow: 0 0 30px rgba(0,0,0,0.5);">
                        <div class="w-full h-full bg-[#050505] rounded-full flex items-center justify-center relative">
                            <span class="text-7xl font-rank italic ${getRankColorClass(s.rank)}">${s.rank}</span>
                        </div>
                    </div>
                    <div class="text-3xl font-mono font-bold text-white tracking-widest">${Math.round(scoreVal).toLocaleString()}</div>
                    <div class="text-[10px] text-gray-500 font-bold uppercase mt-1">Total Score</div>
                </div>

                <div class="flex-grow grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="detail-box">
                        <span class="lbl">Accuracy</span>
                        <span class="val ${getAccColor(s.accuracy)}">${s.accuracy}%</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl">Max Combo</span>
                        <span class="val text-white">${s.max_combo}x</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl">PP</span>
                        <span class="val text-indigo-400">${s.pp}</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl">PP if FC</span>
                        <span class="val text-pink-400 italic">~${ppIfFc}</span>
                    </div>

                    <div class="detail-box">
                        <span class="lbl text-blue-400">Great</span>
                        <span class="val text-white">${s.stats.great}</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl text-green-400">Ok</span>
                        <span class="val text-white">${s.stats.ok}</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl text-yellow-400">Meh</span>
                        <span class="val text-white">${s.stats.meh}</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl text-red-500">Miss</span>
                        <span class="val text-white">${s.stats.miss}</span>
                    </div>

                    <div class="detail-box">
                        <span class="lbl">Stars</span>
                        <span class="val text-yellow-400">${s.beatmap.stars.toFixed(2)}★</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl">AR / OD</span>
                        <span class="val text-gray-300">${s.beatmap.ar} <span class="text-gray-600">/</span> ${s.beatmap.od}</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl">CS / HP</span>
                        <span class="val text-gray-300">${s.beatmap.cs} <span class="text-gray-600">/</span> ${s.beatmap.hp}</span>
                    </div>
                    <div class="detail-box">
                        <span class="lbl">BPM</span>
                        <span class="val text-gray-300">${s.beatmap.bpm}</span>
                    </div>
                </div>

            </div>
            
            <div class="px-8 py-4 bg-[#0a0a0a] border-t border-white/5 flex justify-between text-[10px] text-gray-500 font-mono">
                <span>Played on ${dateStr} at ${timeStr}</span>
                <span>Mapped by ${s.beatmap.creator}</span>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(()=>document.querySelector('.glass-overlay').classList.add('active'));
}

window.closeScoreModal = function(e) {
    if (e && !e.target.classList.contains('glass-overlay') && !e.target.closest('button')) return;
    const el = document.querySelector('.glass-overlay');
    if (el) { el.classList.remove('active'); setTimeout(()=>el.remove(), 300); }
    document.body.style.overflow = '';
}

// --- USER STATS LOADING (Оставьте как есть) ---
async function loadUserStats() {
    const container = document.getElementById('live-stats-container');
    if(!container) return;
    try {
        const res = await fetch('/api/scores?type=user');
        if(!res.ok) throw new Error("API Error");
        const u = await res.json();
        
        container.className = "grid grid-cols-2 md:grid-cols-4 gap-4 mt-2";
        container.innerHTML = `
            <div class="col-span-2 md:col-span-4 bento-card p-0 relative group">
                <div class="absolute inset-0 h-full w-full bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity duration-500" style="background-image: url('${u.cover_url}');"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent"></div>
                <div class="relative z-10 flex items-center p-6 gap-6">
                    <img src="${u.avatar_url}" class="w-24 h-24 rounded-2xl border-2 border-white/10 shadow-2xl">
                    <div class="flex-grow">
                        <div class="flex items-center gap-3">
                            <h2 class="text-4xl font-bold text-white tracking-tight font-rank not-italic">${u.username}</h2>
                            <div class="bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-1.5">
                                <img src="https://flagcdn.com/24x18/${u.country.toLowerCase()}.png" class="rounded-[2px]">
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-3">
                            <span class="text-xs bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-lg text-indigo-300 font-bold">#${u.global_rank}</span>
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
        </div>
    `;
}

window.copyDiscord = function() { 
    navigator.clipboard.writeText(".morgun.");
    const t = document.getElementById("toast"); 
    t.className="show"; 
    setTimeout(()=>t.className="", 3000); 
}
window.toggleFilter = function(id, btn) { document.getElementById(id).classList.toggle('open'); btn.classList.toggle('active'); }
window.setLang = function(lang) { localStorage.setItem('lang', lang); }

// --- HELPERS ---
function getRankColorClass(rank) {
    if(rank.includes('X')) return 'text-gray-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]';
    if(rank.includes('S')) return 'text-[#facc15] drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]';
    if(rank === 'A') return 'text-[#4ade80] drop-shadow-[0_0_10px_rgba(74,222,128,0.4)]';
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
