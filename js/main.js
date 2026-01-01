const DISCORD_ID = "1193659050878054551";
const cursor = document.getElementById('osu-cursor');

// --- STATE ---
window.topScoresData = [];
window.isLazerMode = false; 
window.visibleScoresCount = 5;
window.currentModalScore = null;
window.simMods = []; // Моды для калькулятора

// --- INIT ---
function init() {
    loadTopScores();
    loadUserStats();
    fetchLanyardStatus();
    setInterval(fetchLanyardStatus, 10000);
    
    // Cursor logic setup
    document.addEventListener('mousemove', e => {
        mouseX = e.clientX; mouseY = e.clientY; isMoving = true;
    });
    requestAnimationFrame(updateCursorLoop);
    updateCursorUI();
    
    // Set default tab
    if(!document.querySelector('.tab-content.active')) {
        switchTab('profile');
    }
}

// --- CURSOR LOGIC ---
let mouseX = 0, mouseY = 0, isMoving = false;
let cursorEnabled = localStorage.getItem('customCursor') !== 'false';

function updateCursorLoop() {
    if (isMoving && cursorEnabled && cursor) {
        cursor.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
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

// --- TABS LOGIC ---
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
    
    if (t === 'stream' && typeof resize === 'function') setTimeout(resize, 100);
}

// --- SCORES LOGIC ---
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

window.toggleScoreMode = function() {
    window.isLazerMode = !window.isLazerMode;
    renderScoresList();
}

window.showMoreScores = function() {
    window.visibleScoresCount = 50;
    renderScoresList();
}

window.showLessScores = function() {
    window.visibleScoresCount = 5;
    renderScoresList();
}

function renderScoresList() {
    const container = document.getElementById('scores-container');
    if (!container) return;
    
    const data = window.topScoresData.slice(0, window.visibleScoresCount);
    
    // Header
    let html = `
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="text-xl font-bold flex items-center gap-2"><i class="fas fa-trophy text-yellow-400"></i> Best Performance</h3>
            <button onclick="toggleScoreMode()" class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold transition-all hover:bg-white/10 flex items-center gap-2 cursor-pointer">
                <span class="${!window.isLazerMode ? 'text-white' : 'text-gray-500'}">Score V1</span>
                <i class="fas fa-exchange-alt text-gray-500"></i>
                <span class="${window.isLazerMode ? 'text-pink-400' : 'text-gray-500'}">Lazer</span>
            </button>
        </div>
        <div class="flex flex-col gap-2">
    `;

    // Items
    html += data.map((s, idx) => {
        const scoreVal = window.isLazerMode ? s.score_lazer : s.score_classic;
        const timeAgo = getTimeAgo(new Date(s.date_iso));
        
        // Mods formatting
        const modsHtml = s.mods.map(m => `<span class="mod-badge ${m}">${m === 'NM' ? 'NM' : m}</span>`).join('');
        
        // Detail row string (300/100/50/Miss)
        const hitString = `${s.stats.great} / ${s.stats.ok} / ${s.stats.meh} / <span class="${s.stats.miss > 0 ? 'text-red-500' : ''}">${s.stats.miss}</span>`;

        return `
        <div onclick="openScoreModal(${idx})" class="score-card group relative h-20 bg-[#1e1e24] rounded-lg overflow-hidden cursor-pointer border-l-4 ${getRankBorderClass(s.rank)} hover:scale-[1.01] transition-transform">
            <div class="absolute inset-0 bg-cover bg-center grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-50 transition-all duration-500" style="background-image: url('${s.beatmap.cover}')"></div>
            <div class="absolute inset-0 bg-gradient-to-r from-[#18181b] via-[#18181b]/90 to-transparent"></div>

            <div class="relative z-10 flex items-center h-full px-4 gap-4">
                <div class="text-4xl font-rank italic w-12 text-center ${getRankColorClass(s.rank)} drop-shadow-md">${s.rank}</div>
                
                <div class="flex flex-col justify-center min-w-0 flex-grow">
                    <div class="text-base font-bold text-white truncate leading-tight mb-1 group-hover:text-blue-300 transition-colors">${s.beatmap.title}</div>
                    <div class="flex items-center gap-2 text-xs text-gray-400">
                        <span class="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">${s.beatmap.stars.toFixed(2)}★</span>
                        <span class="truncate">${s.beatmap.version}</span>
                        <span>•</span>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="text-[10px] text-gray-500 font-mono mt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        ${parseInt(scoreVal).toLocaleString()} • <b>${s.max_combo}x</b> • { ${hitString} }
                    </div>
                </div>

                <div class="flex flex-col items-end justify-center min-w-[100px]">
                    <div class="flex gap-1 mb-1">${modsHtml}</div>
                    <div class="text-2xl font-black text-[#66ccff] leading-none drop-shadow-sm">${s.pp}<span class="text-sm font-medium text-gray-500 ml-0.5">pp</span></div>
                    <div class="text-xs font-bold ${getAccColor(s.accuracy)} mt-0.5">${s.accuracy}%</div>
                </div>
            </div>
        </div>
        `;
    }).join('');

    // Footer
    if (window.topScoresData.length > 5) {
         const btnText = window.visibleScoresCount > 5 ? "Show Less" : "Show More";
         const btnAction = window.visibleScoresCount > 5 ? "showLessScores()" : "showMoreScores()";
         html += `<button onclick="${btnAction}" class="w-full py-3 mt-2 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-gray-400 rounded-lg transition-colors cursor-pointer">${btnText}</button>`;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// === CALCULATOR & MODAL ===

window.openScoreModal = function(index) {
    const s = window.topScoresData[index];
    window.currentModalScore = s;
    window.simMods = []; // Сброс калькулятора (начать с Nomod базы)

    const scoreVal = window.isLazerMode ? s.score_lazer : s.score_classic;
    const dateObj = new Date(s.date_iso);
    const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const modalHtml = `
    <div class="modal-overlay active" onclick="closeScoreModal(event)">
        <div class="modal-card" onclick="event.stopPropagation()">
            <div class="relative h-48 w-full shrink-0 overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${s.beatmap.cover}'); filter: blur(4px) brightness(0.6);"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-[#111]"></div>
                
                <button onclick="closeScoreModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors z-20 cursor-pointer"><i class="fas fa-times"></i></button>

                <div class="absolute bottom-0 left-0 p-6 w-full">
                    <h2 class="text-3xl font-black text-white leading-none drop-shadow-lg mb-1">${s.beatmap.title}</h2>
                    <p class="text-lg text-gray-300 font-medium drop-shadow-md mb-3">${s.beatmap.artist}</p>
                    <div class="flex gap-2">
                        <a href="${s.beatmap.url}" target="_blank" class="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-lg transition-colors">Beatmap Page</a>
                        <span class="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded border border-white/10">${s.beatmap.version}</span>
                    </div>
                </div>
            </div>

            <div class="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#111]">
                
                <div class="lg:col-span-7 flex flex-col gap-6">
                    <div class="flex items-center gap-6 pb-6 border-b border-white/10">
                        <div class="font-rank text-8xl ${getRankColorClass(s.rank)} drop-shadow-2xl">${s.rank}</div>
                        <div>
                            <div class="text-4xl font-mono font-black text-white tracking-wider">${Math.round(scoreVal).toLocaleString()}</div>
                            <div class="text-xs text-gray-500 font-bold uppercase mt-1">Total Score (${window.isLazerMode ? 'Lazer' : 'Classic'})</div>
                            <div class="text-xs text-gray-600 mt-2"><i class="far fa-clock"></i> ${dateStr}</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-4 gap-3">
                        <div class="stat-card">
                            <span class="lbl">PP</span>
                            <span class="val text-indigo-400">${s.pp}</span>
                        </div>
                        <div class="stat-card">
                            <span class="lbl">Acc</span>
                            <span class="val ${getAccColor(s.accuracy)}">${s.accuracy}%</span>
                        </div>
                        <div class="stat-card">
                            <span class="lbl">Max Combo</span>
                            <span class="val text-green-400">${s.max_combo}x</span>
                        </div>
                        <div class="stat-card">
                            <span class="lbl">Miss</span>
                            <span class="val ${s.stats.miss > 0 ? 'text-red-500' : 'text-gray-500'}">${s.stats.miss}</span>
                        </div>
                    </div>

                    <div class="bg-white/5 rounded-xl p-4 border border-white/5">
                        <div class="grid grid-cols-4 text-center divide-x divide-white/5">
                            <div><div class="text-xl font-bold text-blue-400">${s.stats.great}</div><div class="text-[9px] text-gray-500 font-bold mt-1">300</div></div>
                            <div><div class="text-xl font-bold text-green-400">${s.stats.ok}</div><div class="text-[9px] text-gray-500 font-bold mt-1">100</div></div>
                            <div><div class="text-xl font-bold text-yellow-400">${s.stats.meh}</div><div class="text-[9px] text-gray-500 font-bold mt-1">50</div></div>
                            <div><div class="text-xl font-bold text-red-500">${s.stats.miss}</div><div class="text-[9px] text-gray-500 font-bold mt-1">MISS</div></div>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-5 bg-[#1a1a1e] rounded-xl border border-white/5 p-5 flex flex-col h-full">
                    <div class="mb-4 pb-2 border-b border-white/5 flex justify-between items-center">
                        <h4 class="text-xs font-bold text-white uppercase tracking-widest">Map Stats</h4>
                        <span class="text-[10px] text-gray-500">Calculator</span>
                    </div>

                    <div class="flex gap-2 mb-6 justify-center">
                        <button onclick="toggleSimMod('NM')" id="btn-NM" class="calc-btn active">NM</button>
                        <button onclick="toggleSimMod('DT')" id="btn-DT" class="calc-btn">DT</button>
                        <button onclick="toggleSimMod('HR')" id="btn-HR" class="calc-btn">HR</button>
                        <button onclick="toggleSimMod('EZ')" id="btn-EZ" class="calc-btn">EZ</button>
                    </div>

                    <div id="sim-stats-container" class="space-y-3 font-mono text-sm">
                        </div>
                    
                    <div class="mt-auto pt-4 text-center">
                         <div class="text-[10px] text-gray-600 mb-1">Estimated Difficulty</div>
                         <div class="text-2xl font-black text-yellow-400" id="sim-stars">0.00★</div>
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
}

window.toggleSimMod = function(mod) {
    if (mod === 'NM') {
        window.simMods = [];
    } else {
        const idx = window.simMods.indexOf(mod);
        if (idx > -1) window.simMods.splice(idx, 1);
        else {
            // Remove conflicting mods
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

    let cs = base.cs, ar = base.ar, od = base.od, hp = base.hp, bpm = base.bpm;
    let stars = base.stars; 

    if (mods.includes('HR')) {
        cs = Math.min(10, cs * 1.3);
        ar = Math.min(10, ar * 1.4);
        od = Math.min(10, od * 1.4);
        hp = Math.min(10, hp * 1.4);
        stars *= 1.05; 
    } else if (mods.includes('EZ')) {
        cs *= 0.5; ar *= 0.5; od *= 0.5; hp *= 0.5;
        stars *= 0.8;
    }

    if (mods.includes('DT')) {
        bpm *= 1.5;
        if(ar > 5) ar = Math.min(11, ar + 1.5); 
        else ar = Math.min(11, ar + 2); 
        od = Math.min(11, od + 1.4);
        stars *= 1.35;
    }

    const row = (lbl, val) => `
        <div class="flex justify-between items-center bg-black/20 p-2 rounded">
            <span class="text-gray-500 font-bold">${lbl}</span>
            <span class="text-white font-bold">${Math.round(val * 10) / 10}</span>
        </div>
    `;

    document.getElementById('sim-stats-container').innerHTML = `
        ${row('CS', cs)}
        ${row('AR', ar)}
        ${row('OD', od)}
        ${row('HP', hp)}
        ${row('BPM', bpm)}
    `;
    document.getElementById('sim-stars').innerText = stars.toFixed(2) + '★';
}

window.closeScoreModal = function(e) {
    if (e && !e.target.classList.contains('modal-overlay') && !e.target.closest('button')) return;
    const el = document.querySelector('.modal-overlay');
    if (el) el.remove();
    document.body.style.overflow = '';
}

// --- USER STATS ---
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
                <div class="absolute inset-0 bg-gradient-to-r from-[#141417] via-[#141417]/90 to-transparent"></div>
                
                <div class="relative z-10 flex items-center p-6 gap-6">
                    <img src="${u.avatar_url}" class="w-24 h-24 rounded-2xl border-2 border-white/10 shadow-2xl">
                    <div class="flex-grow">
                        <div class="flex items-center gap-3">
                            <h2 class="text-4xl font-black text-white tracking-tight">${u.username}</h2>
                            <div class="bg-black/40 backdrop-blur-md px-2 py-1 rounded border border-white/10 flex items-center gap-1.5" title="${u.country_name}">
                                <img src="https://flagcdn.com/24x18/${u.country.toLowerCase()}.png" class="rounded-[2px]">
                            </div>
                        </div>
                        <div class="flex items-center gap-2 mt-3">
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

            <div class="bento-card p-5 flex flex-col justify-center text-center">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">PP</div>
                <div class="text-3xl font-black text-indigo-400">${u.pp}</div>
            </div>
            
            <div class="bento-card p-5 flex flex-col justify-center text-center">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Accuracy</div>
                <div class="text-3xl font-black text-white">${u.accuracy}<span class="text-sm text-gray-500 ml-0.5">%</span></div>
            </div>

            <div class="bento-card p-5 flex flex-col justify-center text-center">
                <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Play Count</div>
                <div class="text-3xl font-black text-white">${u.play_count}</div>
                <div class="text-[10px] text-gray-500 font-mono mt-1">${u.play_time}h played</div>
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
    } catch(e) {
        console.error(e);
        container.innerHTML = '<div class="col-span-4 text-center text-xs text-red-400 py-4">Failed to load stats</div>';
    }
}

// --- UTILS ---
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

    if(!profileWrapper) return;

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
    profileWrapper.className = wrapperClasses; 
    profileWrapper.innerHTML = htmlContent;
}

window.copyDiscord = function() { 
    navigator.clipboard.writeText(".morgun.").then(()=>{ 
        var t=document.getElementById("toast"); 
        t.className="show"; 
        setTimeout(()=>t.className=t.className.replace("show",""),3000); 
    }); 
}

window.toggleFilter = function(id, btn) { 
    const d = document.getElementById(id); 
    d.classList.toggle('open'); 
    btn.classList.toggle('active'); 
}

window.setLang = function(lang) { 
    localStorage.setItem('lang', lang); 
    // Add translation logic here if needed
}

// --- UTILS HELPERS ---
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    return "Today";
}
function getRankColorClass(rank) {
    if(rank.includes('X')) return 'text-gray-200';
    if(rank.includes('S')) return 'text-[#ffcc22]'; 
    if(rank === 'A') return 'text-[#22c55e]'; 
    if(rank === 'B') return 'text-[#3b82f6]';
    return 'text-red-500';
}
function getRankBorderClass(rank) {
    if(rank.includes('X')) return 'border-gray-200';
    if(rank.includes('S')) return 'border-[#ffcc22]';
    if(rank === 'A') return 'border-[#22c55e]';
    if(rank === 'B') return 'border-[#3b82f6]';
    return 'border-red-500';
}
function getAccColor(acc) {
    if(acc >= 99) return 'text-[#22c55e]';
    if(acc >= 97) return 'text-[#8fbfff]';
    if(acc >= 94) return 'text-[#ffcc22]';
    return 'text-[#ff4444]';
}

// Start everything
init();
