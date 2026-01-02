const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');
let mouseX = 0, mouseY = 0, isMoving = false;
let cursorEnabled = localStorage.getItem('customCursor') !== 'false';
window.topScoresData = [];
window.visibleScoresCount = 5;

document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; isMoving = true; });

function updateCursorLoop() {
    if (isMoving && cursorEnabled && cursor) {
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        if (Math.random() > 0.90 && !document.body.classList.contains('system-cursor')) {
            const dot = document.createElement('div'); 
            dot.className = 'trail-dot';
            dot.style.left = mouseX+'px'; dot.style.top = mouseY+'px';
            document.body.appendChild(dot); 
            setTimeout(()=>dot.remove(), 300);
        }
    }
    isMoving = false;
    requestAnimationFrame(updateCursorLoop);
}
requestAnimationFrame(updateCursorLoop);

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
updateCursorUI();

window.switchTab = function(t) { 
    if (document.startViewTransition) { document.startViewTransition(() => performSwitch(t)); } else { performSwitch(t); }
}

function performSwitch(t) {
    document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active')); 
    document.querySelectorAll('.nav-btn').forEach(e=>e.classList.remove('active')); 
    document.getElementById('tab-'+t).classList.add('active'); 
    document.getElementById('btn-'+t).classList.add('active');
    if (t === 'stream' && typeof resize === 'function') setTimeout(resize, 100);
}

window.copyDiscord = function() { 
    navigator.clipboard.writeText(".morgun.").then(()=>{ 
        var t=document.getElementById("toast"); t.className="show"; 
        setTimeout(()=>t.className=t.className.replace("show",""),3000); 
    }); 
}

const Utils = {
    getAccColor: (a) => a>=99 ? 'text-[#22c55e]' : a>=97 ? 'text-[#8fbfff]' : a>=94 ? 'text-[#ffcc22]' : 'text-[#ff4444]',
    getRelativeTime: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (isNaN(diff)) return "";
        if (diff < 60) return 'just now';
        const min = Math.floor(diff / 60);
        if (min < 60) return `${min}m ago`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        return `${d}d ago`;
    },
    calculateMapStats: (b, mods) => {
        let cs = b.cs, ar = b.ar, od = b.accuracy, hp = b.drain, bpm = b.bpm, len = b.total_length;
        if (mods.includes('HR')) { cs = Math.min(10, cs * 1.3); ar = Math.min(10, ar * 1.4); od = Math.min(10, od * 1.4); hp = Math.min(10, hp * 1.4); }
        else if (mods.includes('EZ')) { cs *= 0.5; ar *= 0.5; od *= 0.5; hp *= 0.5; }
        if (mods.includes('DT') || mods.includes('NC')) { bpm *= 1.5; len /= 1.5; ar = ar > 5 ? Math.min(11, ar + (11 - ar)/1.5) : Math.min(10, ar + 2); od = Math.min(11, od + (11 - od)/1.5); } 
        else if (mods.includes('HT')) { bpm *= 0.75; len /= 0.75; ar = ar > 5 ? ar - (ar - 5)/1.5 : ar - 2; od = Math.max(0, od - 2); }
        const m = Math.floor(len/60);
        const ss = Math.floor(len%60).toString().padStart(2,'0');
        return { cs, ar, od, hp, bpm, time: `${m}:${ss}` };
    },
    formatNumber: (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
};

async function loadTopScores() {
    const c = document.getElementById('scores-container');
    if (!c) return;
    c.innerHTML = '<div class="flex items-center justify-center h-20"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-osu"></div></div>';
    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error();
        window.topScoresData = await res.json();
        renderScoresList();
    } catch { c.innerHTML = '<div class="text-center text-xs text-red-400 py-4">Failed to load scores.</div>'; }
}

window.showMoreScores = function() { window.visibleScoresCount = window.topScoresData.length; renderScoresList(); }
window.showLessScores = function() { window.visibleScoresCount = 5; renderScoresList(); }

window.toggleScoreDetails = function(index) { document.getElementById(`score-row-${index}`).classList.toggle('open'); }

function renderScoresList() {
    const c = document.getElementById('scores-container');
    const data = window.topScoresData.slice(0, window.visibleScoresCount);
    let html = `<div class="flex flex-col gap-2">`;
    html += data.map((s, i) => {
        const score = Math.round(s.score_lazer).toLocaleString(); 
        const mods = s.mods;
        const modsHTML = mods.length > 0 ? mods.map(m => `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-yellow-300 border border-white/5">${m}</span>`).join('') : `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">NM</span>`;
        const timeAgo = Utils.getRelativeTime(s.date_iso);
        const rankClass = `rank-${s.rank.replace('H', 'H')}`;
        const mapStats = Utils.calculateMapStats(s.beatmap, mods);
        return `
        <div id="score-row-${i}" class="score-row group relative w-full bg-[#121214] border border-white/5 rounded-xl overflow-hidden transition-all duration-300">
            <div onclick="toggleScoreDetails(${i})" class="relative h-20 w-full flex items-center cursor-pointer z-10 bg-[#121214]">
                <div class="absolute inset-0 bg-cover bg-center opacity-[0.07] group-hover:opacity-[0.15] transition-opacity duration-500 grayscale group-hover:grayscale-0" style="background-image: url('${s.beatmap.cover}')"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#121214] via-[#121214]/90 to-transparent z-0"></div>
                <div class="relative z-10 w-14 h-full flex items-center justify-center border-r border-white/5 flex-shrink-0"><span class="rank-text text-3xl ${rankClass}">${s.rank.replace('X', 'SS')}</span></div>
                <div class="relative z-10 flex-grow min-w-0 px-4 py-2 flex flex-col justify-center h-full">
                    <div class="flex items-baseline gap-2 truncate w-full"><span class="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">${s.beatmap.title}</span></div>
                    <div class="text-[10px] text-gray-400 truncate mb-1">by ${s.beatmap.artist} <span class="text-gray-600 mx-1">•</span> <span class="text-gray-300">[${s.beatmap.version}]</span></div>
                    <div class="flex items-center gap-3"><div class="flex gap-1">${modsHTML}</div></div>
                </div>
                <div class="relative z-10 flex-shrink-0 w-24 sm:w-32 h-full flex flex-col items-end justify-center pr-4 border-l border-white/5 bg-black/10 backdrop-blur-sm">
                    <div class="text-lg sm:text-xl font-black text-indigo-400 leading-none mb-0.5 text-shadow">${s.pp}<span class="text-xs text-indigo-500/70 ml-0.5">pp</span></div>
                    <div class="text-xs font-bold ${Utils.getAccColor(s.accuracy)}">${s.accuracy}%</div>
                    <div class="text-[9px] text-gray-600 mt-1">${timeAgo}</div>
                </div>
            </div>
            <div class="score-details-container bg-black/40 border-t border-white/5">
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Hit Statistics</h4>
                        <div class="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/5">
                            <div class="text-center"><div class="text-blue-300 font-bold text-lg leading-none">${s.stats.great}</div><div class="text-[9px] text-gray-500 font-bold mt-1">300</div></div><div class="w-px h-6 bg-white/10"></div>
                            <div class="text-center"><div class="text-green-300 font-bold text-lg leading-none">${s.stats.ok}</div><div class="text-[9px] text-gray-500 font-bold mt-1">100</div></div><div class="w-px h-6 bg-white/10"></div>
                            <div class="text-center"><div class="text-yellow-300 font-bold text-lg leading-none">${s.stats.meh}</div><div class="text-[9px] text-gray-500 font-bold mt-1">50</div></div><div class="w-px h-6 bg-white/10"></div>
                            <div class="text-center"><div class="text-red-500 font-bold text-lg leading-none">${s.stats.miss}</div><div class="text-[9px] text-gray-500 font-bold mt-1">MISS</div></div>
                        </div>
                        <div class="mt-3 flex justify-between text-xs font-mono text-gray-400 px-1"><span>Combo: <span class="text-white font-bold">${s.max_combo}x</span></span><span>Score: <span class="text-white">${score}</span></span></div>
                    </div>
                    <div>
                        <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Map Attributes</h4>
                        <div class="grid grid-cols-4 gap-2 text-center">
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">CS</div><div class="text-white font-bold text-sm">${mapStats.cs.toFixed(1)}</div></div>
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">AR</div><div class="text-white font-bold text-sm">${mapStats.ar.toFixed(1)}</div></div>
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">OD</div><div class="text-white font-bold text-sm">${mapStats.od.toFixed(1)}</div></div>
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">HP</div><div class="text-white font-bold text-sm">${mapStats.hp.toFixed(1)}</div></div>
                        </div>
                    </div>
                </div>
                <div class="px-4 pb-4 flex justify-end"><a href="${s.beatmap.url}" target="_blank" class="text-[10px] font-bold bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-full transition-colors">Open Beatmap Page</a></div>
            </div>
        </div>`;
    }).join('');
    html += `</div>`;
    if (window.topScoresData.length > 5) html += `<button onclick="window.visibleScoresCount=window.topScoresData.length;renderScoresList()" class="w-full mt-3 py-2.5 text-[10px] font-bold text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all uppercase tracking-widest">Show More</button>`;
    c.innerHTML = html;
}

async function loadUserStats() {
    const c = document.getElementById('live-stats-container');
    if (!c) return;
    try {
        const res = await fetch('/api/scores?type=user');
        if (!res.ok) throw new Error();
        const u = await res.json();
        
        const d = Math.floor(u.play_time_seconds / 86400);
        const h = Math.floor((u.play_time_seconds % 86400) / 3600);
        const m = Math.floor((u.play_time_seconds % 3600) / 60);
        const playTimeFormatted = `${d}d ${h}h ${m}m`;

        setTimeout(() => { drawRankGraph(u.rank_history); }, 100);

        c.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bento-card col-span-2 md:col-span-4 p-6 relative group overflow-hidden">
                    <div class="absolute inset-0 bg-cover bg-center opacity-30" style="background-image: url('${u.cover_url}');"></div>
                    <div class="absolute inset-0 bg-gradient-to-r from-[#141417] via-[#141417]/95 to-transparent"></div>
                    <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <img src="${u.avatar_url}" class="w-24 h-24 rounded-2xl border-2 border-white/10 shadow-2xl">
                        <div class="flex-grow text-center md:text-left">
                            <div class="flex items-center justify-center md:justify-start gap-3">
                                <h2 class="text-4xl font-black text-white tracking-tight">${u.username}</h2>
                                <img src="https://flagcdn.com/24x18/${u.country.toLowerCase()}.png" class="rounded shadow-sm">
                            </div>
                            <div class="mt-3 flex flex-wrap justify-center md:justify-start gap-3">
                                <div class="bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-sm font-bold text-indigo-300">#${Utils.formatNumber(u.global_rank)}</div>
                                <div class="bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-bold text-white">${u.country} #${Utils.formatNumber(u.country_rank)}</div>
                                <div class="bg-pink-500/10 border border-pink-500/30 px-3 py-1.5 rounded-lg text-sm font-bold text-pink-300">${Utils.formatNumber(u.pp)} pp</div>
                                <div class="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-sm font-bold text-yellow-300">${u.medal_count} Medals</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bento-card col-span-2 md:col-span-4 p-0 relative h-56 group overflow-hidden">
                    <div class="absolute top-4 left-4 z-10 flex items-center gap-2"><i class="fas fa-chart-line text-yellow-400"></i><span class="text-xs font-bold text-white uppercase tracking-widest">Rank History</span></div>
                    <div class="absolute inset-0 top-12 bottom-0 left-0 right-0"><canvas id="rank-history-chart" class="w-full h-full"></canvas></div>
                </div>
                <div class="col-span-2 md:col-span-4 flex justify-between gap-2 overflow-x-auto py-2">
                    <div class="stat-panel-clean flex-1 min-w-[80px] items-center"><span class="text-2xl font-black text-rank-XH leading-none">SS</span><span class="text-[9px] text-gray-500 font-bold uppercase mt-1">Silver</span><span class="text-sm font-bold text-rank-XH">${u.grades.ssh.toLocaleString()}</span></div>
                    <div class="stat-panel-clean flex-1 min-w-[80px] items-center"><span class="text-2xl font-black text-rank-X leading-none">SS</span><span class="text-[9px] text-gray-500 font-bold uppercase mt-1">Gold</span><span class="text-sm font-bold text-rank-X">${u.grades.ss.toLocaleString()}</span></div>
                    <div class="stat-panel-clean flex-1 min-w-[80px] items-center"><span class="text-2xl font-black text-rank-SH leading-none">S</span><span class="text-[9px] text-gray-500 font-bold uppercase mt-1">Silver</span><span class="text-sm font-bold text-rank-SH">${u.grades.sh.toLocaleString()}</span></div>
                    <div class="stat-panel-clean flex-1 min-w-[80px] items-center"><span class="text-2xl font-black text-rank-S leading-none">S</span><span class="text-[9px] text-gray-500 font-bold uppercase mt-1">Gold</span><span class="text-sm font-bold text-rank-S">${u.grades.s.toLocaleString()}</span></div>
                    <div class="stat-panel-clean flex-1 min-w-[80px] items-center"><span class="text-2xl font-black text-rank-A leading-none">A</span><span class="text-[9px] text-gray-500 font-bold uppercase mt-1">Rank A</span><span class="text-sm font-bold text-rank-A">${u.grades.a.toLocaleString()}</span></div>
                </div>
                <div class="profile-stats-grid col-span-2 md:col-span-4">
                    <div class="stat-panel-clean"><p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Ranked Score</p><h4 class="text-lg font-bold text-white truncate">${Utils.formatNumber(u.ranked_score)}</h4></div>
                    <div class="stat-panel-clean"><p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Hit Accuracy</p><h4 class="text-lg font-bold text-white">${u.accuracy}%</h4></div>
                    <div class="stat-panel-clean"><p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Play Count</p><h4 class="text-lg font-bold text-white">${Utils.formatNumber(u.play_count)}</h4></div>
                    <div class="stat-panel-clean"><p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Hits</p><h4 class="text-lg font-bold text-white">${Utils.formatNumber(u.total_hits)}</h4></div>
                    <div class="stat-panel-clean"><p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Max Combo</p><h4 class="text-lg font-bold text-white">${Utils.formatNumber(u.max_combo)}x</h4></div>
                    <div class="stat-panel-clean"><p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Score</p><h4 class="text-xs font-bold text-gray-300 break-all leading-tight">${Utils.formatNumber(u.total_score)}</h4></div>
                    <div class="stat-panel-clean"><p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Replays</p><h4 class="text-lg font-bold text-white">${Utils.formatNumber(u.replays_watched)}</h4></div>
                    <div class="stat-panel-clean relative overflow-hidden">
                        <div class="flex justify-between items-end mb-2 relative z-10"><div><p class="text-[10px] text-gray-500 uppercase font-bold">Lvl ${u.level}</p></div><div class="text-right"><p class="text-[10px] text-gray-500 uppercase font-bold">Time</p></div></div>
                        <div class="w-full h-1 bg-white/10 rounded-full overflow-hidden relative z-10 mb-1"><div class="h-full bg-yellow-400 rounded-full" style="width: ${u.level_progress}%"></div></div>
                        <div class="flex justify-between text-[9px] font-bold text-white relative z-10"><span>${u.level_progress}%</span><span>${playTimeFormatted}</span></div>
                    </div>
                </div>
                <div class="bento-card col-span-2 md:col-span-4 p-0 relative overflow-hidden">
                    <div class="p-4 border-b border-white/5 flex items-center gap-2"><i class="fas fa-history text-indigo-400"></i><span class="text-xs font-bold text-white uppercase tracking-widest">Recent Activity</span></div>
                    <div id="activity-container" class="flex flex-col"><div class="p-4 text-center text-xs text-gray-500">Loading activity...</div></div>
                </div>
            </div>`;
        loadRecentActivity();
    } catch(e) {
        c.innerHTML = '<div class="col-span-4 text-center text-xs text-red-400 py-4">Failed to load stats</div>';
    }
}

async function loadRecentActivity() {
    const c = document.getElementById('activity-container');
    if (!c) return;
    try {
        const res = await fetch('/api/scores?type=recent');
        if (!res.ok) throw new Error();
        const data = await res.json();
        let html = '';
        if (data.length === 0) html = '<div class="text-center text-gray-500 py-4 text-xs">No recent activity found.</div>';
        else {
            html = data.map(s => {
                const time = Utils.getRelativeTime(s.created_at);
                const rankClass = `rank-${s.rank.replace('H', 'H')}`;
                const modsHTML = s.mods.length > 0 ? `+${s.mods.join('')}` : '';
                const failClass = s.rank === 'F' ? 'opacity-60 grayscale' : '';
                return `
                <div class="activity-item ${failClass}">
                    <div class="w-10 text-center flex-shrink-0"><span class="text-2xl font-black ${rankClass} drop-shadow-sm">${s.rank.replace('X', 'SS')}</span></div>
                    <div class="flex-grow min-w-0 px-3">
                        <div class="text-xs font-bold text-white truncate">${s.beatmap.title}</div>
                        <div class="text-[10px] text-gray-400 truncate">${s.beatmap.version} <span class="text-yellow-300 ml-1">${modsHTML}</span></div>
                    </div>
                    <div class="text-right flex-shrink-0"><div class="text-[10px] font-mono text-gray-500">${time}</div></div>
                </div>`;
            }).join('');
        }
        c.innerHTML = html;
    } catch { c.innerHTML = '<div class="text-center text-red-400 py-4 text-xs">Failed to load activity.</div>'; }
}

function drawRankGraph(history) {
    const canvas = document.getElementById('rank-history-chart');
    const tooltip = document.getElementById('chart-tooltip');
    if (!canvas || !history || history.length < 2) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width; const h = rect.height;
    const minRank = Math.min(...history); const maxRank = Math.max(...history);
    const range = maxRank - minRank || 1; const padding = 20;
    
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.beginPath();
    for(let i=1; i<4; i++) { const y = padding + ((h - padding*2) / 4) * i; ctx.moveTo(0, y); ctx.lineTo(w, y); }
    ctx.stroke();

    ctx.beginPath(); ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    history.forEach((val, i) => {
        const x = (i / (history.length - 1)) * w;
        const norm = (val - minRank) / range; 
        const y = padding + norm * (h - padding * 2);
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.lineTo(w, h); ctx.lineTo(0, h); 
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.1)'); grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad; ctx.fill();

    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const idx = Math.round( (x / w) * (history.length - 1) );
        if (idx >= 0 && idx < history.length) {
            tooltip.style.opacity = 1; tooltip.style.left = `${e.clientX + 15}px`; tooltip.style.top = `${e.clientY - 15}px`;
            tooltip.innerHTML = `<div class="text-center"><span class="font-bold text-yellow-400 text-lg">#${history[idx].toLocaleString()}</span><br><span class="text-[10px] text-gray-400 uppercase tracking-widest">${90 - idx} days ago</span></div>`;
        }
    };
    canvas.onmouseleave = () => { tooltip.style.opacity = 0; };
}

window.downloadResults = function() {
    const history = window.fullTestHistory || [];
    const bpm = document.getElementById('val-bpm').innerText;
    const ur = document.getElementById('val-ur').innerText;
    if (history.length === 0) return;
    let content = "MORGUN STREAM TEST RESULT\n";
    content += "---------------------------------\n";
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Final BPM: ${bpm}\n`;
    content += `Unstable Rate: ${ur}\n`;
    content += `Total Inputs: ${history.length}\n`;
    content += "---------------------------------\n";
    content += "KEY\t|\tTIME (ms)\t|\tHOLD (ms)\n";
    content += "---------------------------------\n";
    history.forEach(item => { content += `${item.key}\t|\t${item.timestamp}\t\t|\t${item.duration}\n`; });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `morgun_bpm_test_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

async function fetchLanyardStatus() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const data = await res.json();
        if (data.success) {
            const status = data.data.discord_status;
            const activity = data.data.activities.find(a => a.name.toLowerCase().includes('osu'));
            const w = document.getElementById('profile-status-wrapper');
            if (!w) return;
            if (activity) {
                w.className = "inline-flex items-center rounded-2xl border mb-6 backdrop-blur-md transition-colors duration-300 max-w-full px-4 py-2 bg-pink-500/10 border-pink-500/30";
                w.innerHTML = `<span class="text-xs font-bold text-pink-400">Playing osu!</span>`;
            } else {
                const color = status === 'online' ? 'green' : 'gray';
                w.className = `inline-flex items-center rounded-2xl border mb-6 backdrop-blur-md transition-colors duration-300 max-w-full px-3 py-1 bg-${color}-500/10 border-${color}-500/30`;
                w.innerHTML = `<span class="w-2 h-2 rounded-full mr-2 bg-${color}-400 ${status==='online'?'animate-pulse':''}"></span><span class="text-xs font-bold text-${color}-400">${status.toUpperCase()}</span>`;
            }
        }
    } catch {}
}

fetchLanyardStatus(); setInterval(fetchLanyardStatus, 10000);
loadTopScores(); loadUserStats();
