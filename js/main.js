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

async function loadTopScores() {
    const c = document.getElementById('scores-container');
    if (!c) return;
    c.innerHTML = '<div class="flex items-center justify-center h-20"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-osu"></div></div>';
    try {
        const res = await fetch('/api/scores?type=best');
        if (!res.ok) throw new Error();
        window.topScoresData = await res.json();
        renderScoresList();
    } catch {
        c.innerHTML = '<div class="text-center text-xs text-red-400 py-4">Failed to load scores.</div>';
    }
}

function showMoreScores() { window.visibleScoresCount = window.topScoresData.length; renderScoresList(); }
function showLessScores() { window.visibleScoresCount = 5; renderScoresList(); }

function getRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (isNaN(diff)) return "Recently";
    if (diff < 60) return 'just now';
    const min = Math.floor(diff / 60);
    if (min < 60) return `${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo}mo ago`;
    return `${Math.floor(mo / 12)}y ago`;
}

function toggleScoreDetails(index) {
    const row = document.getElementById(`score-row-${index}`);
    if (row) row.classList.toggle('open');
}

function calculateMapStats(beatmap, mods) {
    let cs = beatmap.cs, ar = beatmap.ar, od = beatmap.od, hp = beatmap.hp, bpm = beatmap.bpm, len = beatmap.length;
    if (mods.includes('HR')) { cs = Math.min(10, cs * 1.3); ar = Math.min(10, ar * 1.4); od = Math.min(10, od * 1.4); hp = Math.min(10, hp * 1.4); }
    else if (mods.includes('EZ')) { cs *= 0.5; ar *= 0.5; od *= 0.5; hp *= 0.5; }
    if (mods.includes('DT') || mods.includes('NC')) { bpm *= 1.5; len /= 1.5; ar = ar > 5 ? Math.min(11, ar + (11 - ar)/1.5) : Math.min(10, ar + 2); od = Math.min(11, od + (11 - od)/1.5); } 
    else if (mods.includes('HT')) { bpm *= 0.75; len /= 0.75; ar = ar > 5 ? ar - (ar - 5)/1.5 : ar - 2; od = Math.max(0, od - 2); }
    const m = Math.floor(len/60);
    const ss = Math.floor(len%60).toString().padStart(2,'0');
    return { cs, ar, od, hp, bpm, time: `${m}:${ss}` };
}

function renderScoresList() {
    const c = document.getElementById('scores-container');
    const data = window.topScoresData.slice(0, window.visibleScoresCount);
    let html = `
        <div class="flex items-center justify-between px-1 py-3 mb-2 border-b border-white/5">
            <div class="flex gap-3 items-center"><i class="fas fa-trophy text-indigo-400"></i><span class="text-sm font-bold text-white uppercase tracking-widest">Best Performance</span></div>
            <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-1 rounded">Score V2</div>
        </div><div class="flex flex-col gap-2">`;
    html += data.map((s, i) => {
        const score = Math.round(s.score_lazer).toLocaleString(); 
        const mods = s.mods;
        const modsHTML = mods.length > 0 ? mods.map(m => `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-yellow-300 border border-white/5">${m}</span>`).join('') : `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/5">NM</span>`;
        const timeAgo = getRelativeTime(s.date_iso);
        const rankClass = `rank-${s.rank.replace('H', 'H')}`;
        const mapStats = calculateMapStats(s.beatmap, mods);
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
                    <div class="text-xs font-bold ${getAccColor(s.accuracy)}">${s.accuracy}%</div>
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
                        <h4 class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Map Attributes (Modded)</h4>
                        <div class="grid grid-cols-4 gap-2 text-center">
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">CS</div><div class="text-white font-bold text-sm">${mapStats.cs.toFixed(1)}</div></div>
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">AR</div><div class="text-white font-bold text-sm">${mapStats.ar.toFixed(1)}</div></div>
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">OD</div><div class="text-white font-bold text-sm">${mapStats.od.toFixed(1)}</div></div>
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">HP</div><div class="text-white font-bold text-sm">${mapStats.hp.toFixed(1)}</div></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2 mt-2 text-center">
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">BPM</div><div class="text-white font-bold text-sm">${Math.round(mapStats.bpm)}</div></div>
                            <div class="bg-white/5 rounded p-2 border border-white/5"><div class="text-[9px] text-gray-500 font-bold">LENGTH</div><div class="text-white font-bold text-sm">${mapStats.time}</div></div>
                        </div>
                    </div>
                </div>
                <div class="px-4 pb-4 flex justify-end"><a href="${s.beatmap.url}" target="_blank" class="text-[10px] font-bold bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-1.5 rounded-full transition-colors">Open Beatmap Page</a></div>
            </div>
        </div>`;
    }).join('');
    html += `</div>`;
    if (window.topScoresData.length > 5) {
        html += `<button onclick="${window.visibleScoresCount < window.topScoresData.length ? 'showMoreScores' : 'showLessScores'}()" class="w-full mt-3 py-2.5 text-[10px] font-bold text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all uppercase tracking-widest">${window.visibleScoresCount < window.topScoresData.length ? '<i class="fas fa-chevron-down mr-1"></i> Show More' : '<i class="fas fa-chevron-up mr-1"></i> Show Less'}</button>`;
    }
    c.innerHTML = html;
}

function getAccColor(a) { return a>=99 ? 'text-[#22c55e]' : a>=97 ? 'text-[#8fbfff]' : a>=94 ? 'text-[#ffcc22]' : 'text-[#ff4444]'; }

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
                    <div class="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-700" style="background-image: url('${u.cover_url}');"></div>
                    <div class="absolute inset-0 bg-gradient-to-r from-[#141417] via-[#141417]/95 to-transparent"></div>
                    <div class="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <img src="${u.avatar_url}" class="w-24 h-24 rounded-2xl border-2 border-white/10 shadow-2xl">
                        <div class="flex-grow text-center md:text-left">
                            <div class="flex items-center justify-center md:justify-start gap-3">
                                <h2 class="text-4xl font-black text-white tracking-tight">${u.username}</h2>
                                <img src="https://flagcdn.com/24x18/${u.country.toLowerCase()}.png" class="rounded shadow-sm">
                            </div>
                            <div class="mt-3 flex flex-wrap justify-center md:justify-start gap-3">
                                <div class="bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-sm font-bold text-indigo-300">Global #${u.global_rank.toLocaleString()}</div>
                                <div class="bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-bold text-white">${u.country} #${u.country_rank.toLocaleString()}</div>
                                <div class="bg-pink-500/10 border border-pink-500/30 px-3 py-1.5 rounded-lg text-sm font-bold text-pink-300">${u.pp.toLocaleString()} pp</div>
                                <div class="bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg text-sm font-bold text-yellow-300"><i class="fas fa-medal mr-1.5"></i>${u.medal_count} Medals</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="bento-card col-span-2 md:col-span-4 p-0 relative h-56 group overflow-hidden">
                    <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
                        <i class="fas fa-chart-line text-yellow-400"></i>
                        <span class="text-xs font-bold text-white uppercase tracking-widest">Rank History (90 Days)</span>
                    </div>
                    <div class="absolute inset-0 top-12 bottom-0 left-0 right-0">
                        <canvas id="rank-history-chart" class="w-full h-full"></canvas>
                    </div>
                </div>

                <div class="bento-card col-span-2 md:col-span-4 p-5 flex justify-between items-center gap-2 overflow-x-auto">
                    <div class="flex items-center gap-3 px-4 border-r border-white/5 last:border-0 min-w-fit">
                        <span class="text-3xl font-black text-rank-XH drop-shadow-md">SS</span>
                        <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold uppercase">Silver</span><span class="text-lg font-bold text-white leading-none">${u.grades.ssh.toLocaleString()}</span></div>
                    </div>
                    <div class="flex items-center gap-3 px-4 border-r border-white/5 last:border-0 min-w-fit">
                        <span class="text-3xl font-black text-rank-X drop-shadow-md">SS</span>
                        <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold uppercase">Gold</span><span class="text-lg font-bold text-white leading-none">${u.grades.ss.toLocaleString()}</span></div>
                    </div>
                    <div class="flex items-center gap-3 px-4 border-r border-white/5 last:border-0 min-w-fit">
                        <span class="text-3xl font-black text-rank-SH drop-shadow-md">S</span>
                        <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold uppercase">Silver</span><span class="text-lg font-bold text-white leading-none">${u.grades.sh.toLocaleString()}</span></div>
                    </div>
                    <div class="flex items-center gap-3 px-4 border-r border-white/5 last:border-0 min-w-fit">
                        <span class="text-3xl font-black text-rank-S drop-shadow-md">S</span>
                        <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold uppercase">Gold</span><span class="text-lg font-bold text-white leading-none">${u.grades.s.toLocaleString()}</span></div>
                    </div>
                    <div class="flex items-center gap-3 px-4 min-w-fit">
                        <span class="text-3xl font-black text-rank-A drop-shadow-md">A</span>
                        <div class="flex flex-col"><span class="text-[9px] text-gray-500 font-bold uppercase">Rank A</span><span class="text-lg font-bold text-white leading-none">${u.grades.a.toLocaleString()}</span></div>
                    </div>
                </div>

                <div class="bento-card col-span-1 p-4 flex flex-col justify-center border-l-4 border-l-blue-500 bg-[#1a1a1d]">
                    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Ranked Score</p>
                    <h4 class="text-lg font-bold text-white truncate">${parseInt(u.ranked_score).toLocaleString()}</h4>
                </div>
                <div class="bento-card col-span-1 p-4 flex flex-col justify-center border-l-4 border-l-green-500 bg-[#1a1a1d]">
                    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Hit Accuracy</p>
                    <h4 class="text-lg font-bold text-white">${u.accuracy}%</h4>
                </div>
                <div class="bento-card col-span-1 p-4 flex flex-col justify-center border-l-4 border-l-yellow-500 bg-[#1a1a1d]">
                    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Play Count</p>
                    <h4 class="text-lg font-bold text-white">${parseInt(u.play_count).toLocaleString()}</h4>
                </div>
                <div class="bento-card col-span-1 p-4 flex flex-col justify-center border-l-4 border-l-purple-500 bg-[#1a1a1d]">
                    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Hits</p>
                    <h4 class="text-lg font-bold text-white">${parseInt(u.total_hits).toLocaleString()}</h4>
                </div>
                
                <div class="bento-card col-span-1 p-4 flex flex-col justify-center bg-[#1a1a1d]">
                    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Max Combo</p>
                    <h4 class="text-lg font-bold text-white">${u.max_combo.toLocaleString()}x</h4>
                </div>
                <div class="bento-card col-span-1 p-4 flex flex-col justify-center bg-[#1a1a1d]">
                    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Score</p>
                    <h4 class="text-sm font-bold text-gray-300 break-all">${parseInt(u.total_score).toLocaleString()}</h4>
                </div>
                <div class="bento-card col-span-1 p-4 flex flex-col justify-center bg-[#1a1a1d]">
                    <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Replays Watched</p>
                    <h4 class="text-lg font-bold text-white">${u.replays_watched.toLocaleString()}</h4>
                </div>
                
                <div class="bento-card col-span-1 p-4 flex flex-col justify-center relative overflow-hidden bg-[#1a1a1d]">
                    <div class="flex justify-between items-end mb-2 relative z-10">
                        <div><p class="text-[10px] text-gray-500 uppercase font-bold">Lvl ${u.level}</p></div>
                        <div class="text-right"><p class="text-[10px] text-gray-500 uppercase font-bold">Time</p></div>
                    </div>
                    <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10 mb-1">
                        <div class="h-full bg-yellow-400 rounded-full" style="width: ${u.level_progress}%"></div>
                    </div>
                    <div class="flex justify-between text-[10px] font-bold text-white relative z-10">
                        <span>${u.level_progress}%</span>
                        <span>${playTimeFormatted}</span>
                    </div>
                </div>

            </div>`;
    } catch(e) {
        console.error(e);
        c.innerHTML = '<div class="col-span-4 text-center text-xs text-red-400 py-4">Failed to load stats</div>';
    }
}

function drawRankGraph(history) {
    const canvas = document.getElementById('rank-history-chart');
    const tooltip = document.getElementById('chart-tooltip');
    
    if (!canvas || !history || history.length < 2) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const minRank = Math.min(...history);
    const maxRank = Math.max(...history);
    const range = maxRank - minRank || 1;
    const padding = 20;

    // 1. Draw Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=1; i<4; i++) {
        const y = padding + ((h - padding*2) / 4) * i;
        ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // 2. Draw Line
    ctx.beginPath();
    ctx.strokeStyle = '#fbbf24'; // Golden color
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    history.forEach((val, i) => {
        const x = (i / (history.length - 1)) * w;
        // Invert Y axis: Lower rank (better) is Higher on screen (y=0)
        const norm = (val - minRank) / range; 
        const y = padding + norm * (h - padding * 2);
        if(i===0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 3. Fill Gradient
    ctx.lineTo(w, h); ctx.lineTo(0, h); 
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.1)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad; 
    ctx.fill();

    // 4. Interactive Tooltip (FIXED POSITION)
    canvas.onmousemove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const idx = Math.round( (x / w) * (history.length - 1) );
        
        if (idx >= 0 && idx < history.length) {
            const rank = history[idx];
            const daysAgo = 90 - idx;
            
            tooltip.style.opacity = 1;
            // Используем clientX/Y для fixed позиционирования относительно окна, а не канваса
            tooltip.style.left = `${e.clientX + 15}px`; 
            tooltip.style.top = `${e.clientY - 15}px`;
            tooltip.innerHTML = `<div class="text-center"><span class="font-bold text-yellow-400 text-lg">#${rank.toLocaleString()}</span><br><span class="text-[10px] text-gray-400 uppercase tracking-widest">${daysAgo} days ago</span></div>`;
        }
    };
    
    canvas.onmouseleave = () => { tooltip.style.opacity = 0; };
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
