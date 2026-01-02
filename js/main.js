// Integrated Utils for better performance
const Utils = {
    getAccColor: a => a>=99 ? 'text-[#22c55e]' : a>=97 ? 'text-[#8fbfff]' : a>=94 ? 'text-[#ffcc22]' : 'text-[#ff4444]',
    fmtNum: new Intl.NumberFormat('ru-RU').format,
    timeAgo: (date) => {
        const diff = (Date.now() - new Date(date)) / 1000;
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
        return `${Math.floor(diff/86400)}d ago`;
    }
};

const DISCORD_ID = "1193659050878054551";

// --- Cursor Logic ---
const cursor = { el: document.getElementById('osu-cursor'), x: 0, y: 0, enabled: localStorage.getItem('customCursor') !== 'false' };
document.addEventListener('mousemove', e => { cursor.x = e.clientX; cursor.y = e.clientY; });

function loopCursor() {
    if (cursor.enabled && cursor.el) {
        cursor.el.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`;
        if (Math.random() > 0.92) {
            const d = document.createElement('div');
            d.className = 'trail-dot'; d.style.left = cursor.x+'px'; d.style.top = cursor.y+'px';
            document.body.appendChild(d);
            setTimeout(() => d.remove(), 300);
        }
    }
    requestAnimationFrame(loopCursor);
}
requestAnimationFrame(loopCursor);

function toggleCursor() {
    cursor.enabled = !cursor.enabled;
    localStorage.setItem('customCursor', cursor.enabled);
    updateCursorUI();
}

function updateCursorUI() {
    const icon = document.getElementById('cursor-toggle-icon');
    if (!cursor.el || !icon) return;
    document.body.classList.toggle('system-cursor', !cursor.enabled);
    cursor.el.style.display = cursor.enabled ? 'block' : 'none';
    icon.className = `w-8 h-4 rounded-full relative transition-colors ${cursor.enabled ? 'bg-indigo-500' : 'bg-gray-600'}`;
    icon.innerHTML = `<div class="absolute ${cursor.enabled ? 'right-0.5' : 'left-0.5'} top-0.5 w-3 h-3 bg-white rounded-full transition-all"></div>`;
}
document.getElementById('btn-toggle-cursor')?.addEventListener('click', toggleCursor);
updateCursorUI();

// --- Navigation ---
document.getElementById('main-nav')?.addEventListener('click', e => {
    if (!e.target.classList.contains('nav-btn')) return;
    const t = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${t}`).classList.add('active');
    e.target.classList.add('active');
    
    if (t === 'stream') window.dispatchEvent(new Event('resize'));
});

// --- Data Fetching ---
async function fetchData(endpoint) {
    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(res.statusText);
        return await res.json();
    } catch (e) { console.error(e); return null; }
}

async function init() {
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    
    document.getElementById('btn-discord')?.addEventListener('click', () => {
        navigator.clipboard.writeText(".morgun.");
        const t = document.getElementById("toast");
        t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 3000);
    });

    const [scores, user] = await Promise.all([
        fetchData('/api/scores?type=best'),
        fetchData('/api/scores?type=user')
    ]);

    if (scores) renderScores(scores);
    if (user) renderUser(user);
    
    fetchLanyard();
    setInterval(fetchLanyard, 15000);
}

function renderScores(data) {
    const c = document.getElementById('scores-container');
    if (!c || !data.length) return;
    
    const createRow = (s) => {
        const mods = s.mods.length ? s.mods.map(m=>`<span class="badge badge-mod">${m}</span>`).join('') : '<span class="badge badge-nm">NM</span>';
        return `
        <div class="score-row group relative w-full bg-[#121214] border border-white/5 rounded-xl overflow-hidden mb-2" onclick="this.classList.toggle('open')">
            <div class="relative h-20 w-full flex items-center cursor-pointer z-10">
                <div class="absolute inset-0 bg-cover bg-center opacity-[0.07] group-hover:opacity-[0.15] transition-opacity grayscale group-hover:grayscale-0" style="background-image: url('${s.beatmap.cover}')"></div>
                <div class="relative z-10 w-14 flex justify-center border-r border-white/5"><span class="text-3xl font-black rank-${s.rank}">${s.rank.replace('X','SS')}</span></div>
                <div class="relative z-10 flex-grow px-4 flex flex-col justify-center">
                    <span class="text-sm font-bold text-white truncate">${s.beatmap.title}</span>
                    <div class="text-[10px] text-gray-400">${s.beatmap.version} <span class="ml-2">${mods}</span></div>
                </div>
                <div class="relative z-10 w-24 flex flex-col items-end pr-4 bg-black/10 backdrop-blur-sm h-full justify-center border-l border-white/5">
                    <div class="text-xl font-black text-indigo-400">${s.pp}<span class="text-xs ml-0.5">pp</span></div>
                    <div class="text-xs font-bold ${Utils.getAccColor(s.accuracy)}">${s.accuracy}%</div>
                    <div class="text-[9px] text-gray-600">${Utils.timeAgo(s.date_iso)}</div>
                </div>
            </div>
            <div class="score-details-container bg-black/40 border-t border-white/5 p-4 grid grid-cols-2 gap-4">
                <div><h4 class="text-[10px] text-gray-500 font-bold uppercase mb-2">Hits</h4><div class="flex gap-4 text-xs font-mono"><span class="text-blue-300">300: ${s.stats.great}</span><span class="text-green-300">100: ${s.stats.ok}</span><span class="text-red-400">Miss: ${s.stats.miss}</span></div></div>
                <div class="text-right"><a href="${s.beatmap.url}" target="_blank" class="text-[10px] bg-indigo-500 text-white px-3 py-1 rounded-full">Map Page</a></div>
            </div>
        </div>`;
    };
    
    c.innerHTML = data.slice(0, 5).map(createRow).join('');
    if (data.length > 5) {
        const btn = document.createElement('button');
        btn.className = "w-full py-2 text-xs font-bold text-gray-500 bg-white/5 rounded-xl hover:text-white transition-colors mt-2";
        btn.innerText = "Show All";
        btn.onclick = () => { c.innerHTML = data.map(createRow).join(''); btn.remove(); };
        c.appendChild(btn);
    }
}

function renderUser(u) {
    const c = document.getElementById('live-stats-container');
    if (!c) return;
    // (Reduced HTML string construction for brevity, assume similar structure to original but utilizing Utils.fmtNum)
    c.innerHTML = `
        <div class="bento-card p-6 mb-4 relative overflow-hidden flex items-center gap-6">
            <div class="absolute inset-0 bg-cover bg-center opacity-20" style="background-image: url('${u.cover_url}')"></div>
            <img src="${u.avatar_url}" class="w-20 h-20 rounded-xl border border-white/10 z-10 shadow-xl">
            <div class="z-10">
                <h2 class="text-3xl font-black text-white">${u.username}</h2>
                <div class="flex gap-3 mt-2 text-xs font-bold">
                    <span class="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">#${Utils.fmtNum(u.global_rank)}</span>
                    <span class="bg-white/10 text-white px-2 py-1 rounded">${u.country} #${Utils.fmtNum(u.country_rank)}</span>
                    <span class="bg-pink-500/10 text-pink-300 px-2 py-1 rounded">${Utils.fmtNum(u.pp)} pp</span>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="stat-panel-clean"><div class="text-gray-500 text-[10px] uppercase font-bold">Accuracy</div><div class="text-white font-bold text-lg">${u.accuracy}%</div></div>
            <div class="stat-panel-clean"><div class="text-gray-500 text-[10px] uppercase font-bold">Play Count</div><div class="text-white font-bold text-lg">${Utils.fmtNum(u.play_count)}</div></div>
            <div class="stat-panel-clean"><div class="text-gray-500 text-[10px] uppercase font-bold">Max Combo</div><div class="text-white font-bold text-lg">${Utils.fmtNum(u.max_combo)}x</div></div>
            <div class="stat-panel-clean"><div class="text-gray-500 text-[10px] uppercase font-bold">Level ${u.level}</div><div class="w-full bg-white/10 h-1 mt-2 rounded-full overflow-hidden"><div class="bg-yellow-400 h-full" style="width:${u.level_progress}%"></div></div></div>
        </div>
    `;
    loadActivity();
}

async function loadActivity() {
    const data = await fetchData('/api/scores?type=recent');
    const c = document.getElementById('scores-container'); // Appending to bottom or specific area
    if (data && data.length) {
        const div = document.createElement('div');
        div.className = "mt-4 bento-card p-4";
        div.innerHTML = `<h3 class="text-xs font-bold uppercase text-gray-500 mb-3">Recent Activity</h3>` + 
            data.slice(0,5).map(s => `
            <div class="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                <div class="flex items-center gap-3"><span class="text-xl font-bold rank-${s.rank} w-8 text-center">${s.rank.replace('X','SS')}</span> <span class="text-xs text-white truncate max-w-[200px]">${s.beatmap.title}</span></div>
                <div class="text-[10px] text-gray-500">${Utils.timeAgo(s.created_at)}</div>
            </div>`).join('');
        c.appendChild(div);
    }
}

async function fetchLanyard() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const { data } = await res.json();
        const w = document.getElementById('profile-status-wrapper');
        if (!w || !data) return;
        
        const osu = data.activities.find(a => a.name.toLowerCase().includes('osu'));
        if (osu) {
            w.className = "inline-flex items-center rounded-full border mb-6 px-4 py-1 bg-pink-500/10 border-pink-500/30 text-pink-400 text-xs font-bold";
            w.innerHTML = `Playing osu!`;
        } else {
            const color = data.discord_status === 'online' ? 'green' : 'gray';
            w.className = `inline-flex items-center rounded-full border mb-6 px-3 py-1 bg-${color}-500/10 border-${color}-500/30 text-${color}-400 text-xs font-bold`;
            w.innerHTML = `<span class="w-2 h-2 rounded-full mr-2 bg-${color}-400 animate-pulse"></span>${data.discord_status.toUpperCase()}`;
        }
    } catch {}
}

window.addEventListener('load', init);
