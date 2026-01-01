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
    // Cursor logic
    document.addEventListener('mousemove', e => {
        if(cursor) cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    });
}
init();

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
        container.innerHTML = '<div class="text-center text-red-400 p-4">Error loading scores</div>';
    }
}

function toggleScoreMode() {
    window.isLazerMode = !window.isLazerMode;
    renderScoresList();
}

function showMoreScores() {
    window.visibleScoresCount = 50;
    renderScoresList();
}
function showLessScores() {
    window.visibleScoresCount = 5;
    renderScoresList();
}

function renderScoresList() {
    const container = document.getElementById('scores-container');
    const data = window.topScoresData.slice(0, window.visibleScoresCount);
    
    // Header
    let html = `
        <div class="flex justify-between items-center mb-4 px-2">
            <h3 class="text-xl font-bold flex items-center gap-2"><i class="fas fa-trophy text-yellow-400"></i> Best Performance</h3>
            <button onclick="toggleScoreMode()" class="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-bold transition-all hover:bg-white/10 flex items-center gap-2">
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
         html += `<button onclick="${btnAction}" class="w-full py-3 mt-2 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-gray-400 rounded-lg transition-colors">${btnText}</button>`;
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
    
    // PP if FC logic (simple placeholder logic)
    const isFC = s.stats.miss === 0;
    const ppIfFc = isFC ? s.pp : Math.round(s.pp * 1.2); // Грубая прикидка для визуала

    const modalHtml = `
    <div class="modal-overlay active" onclick="closeScoreModal(event)">
        <div class="modal-card" onclick="event.stopPropagation()">
            <div class="relative h-48 w-full shrink-0 overflow-hidden">
                <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${s.beatmap.cover}'); filter: blur(4px) brightness(0.6);"></div>
                <div class="absolute inset-0 bg-gradient-to-b from-transparent to-[#111]"></div>
                
                <button onclick="closeScoreModal()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors z-20"><i class="fas fa-times"></i></button>

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
    
    updateCalculator(); // Initial render
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
        if(m === 'NM' && window.simMods.length === 0) btn.classList.add('active');
        else if (window.simMods.includes(m)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
}

function updateCalculator() {
    const s = window.currentModalScore;
    const base = s.beatmap;
    const mods = window.simMods;

    let cs = base.cs, ar = base.ar, od = base.od, hp = base.hp, bpm = base.bpm;
    let stars = base.stars; // Approximate star rating change

    if (mods.includes('HR')) {
        cs = Math.min(10, cs * 1.3);
        ar = Math.min(10, ar * 1.4);
        od = Math.min(10, od * 1.4);
        hp = Math.min(10, hp * 1.4);
        stars *= 1.05; // Fake calc
    } else if (mods.includes('EZ')) {
        cs *= 0.5; ar *= 0.5; od *= 0.5; hp *= 0.5;
        stars *= 0.8;
    }

    if (mods.includes('DT')) {
        bpm *= 1.5;
        // AR formula approximation
        if(ar > 5) ar = Math.min(11, (1200 - ((1200 - (ar - 5) * 150) / 1.5) + 750) / 150 + 5); 
        else ar = Math.min(11, (1200 - ((1200 - 120 * ar) / 1.5) + 750) / 150 + 5); // very rough
        ar = Math.min(11, ar + 1.5); // Simplified visual change
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

// --- UTILS ---
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
    if(rank.includes('S')) return 'text-[#ffcc22]'; // Gold
    if(rank === 'A') return 'text-[#22c55e]'; // Green
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

// User Stats loading (keep previous logic or simplified)
async function loadUserStats() { /* Keep your existing loadUserStats code here */ }
async function fetchLanyardStatus() { /* Keep your existing Lanyard code here */ }
