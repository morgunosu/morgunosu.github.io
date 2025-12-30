const DISCORD_ID = "1193659050878054551";

// --- CURSOR ---
const cursor = document.getElementById('osu-cursor');
let mouseX = 0, mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + 'px'; cursor.style.top = mouseY + 'px';
    if(Math.random() > 0.5) {
        const dot = document.createElement('div'); dot.className = 'trail-dot';
        dot.style.left = mouseX+'px'; dot.style.top = mouseY+'px';
        document.body.appendChild(dot); setTimeout(()=>dot.remove(),300);
    }
});

// --- LANYARD STATUS ---
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
    const profileDot = document.getElementById('profile-status-dot');
    const profileText = document.getElementById('profile-status-text');
    const avatarBadge = document.getElementById('avatar-status-badge');

    let primary = activities.find(a => a.name.toLowerCase().includes('osu'));
    if (!primary) primary = activities.find(a => a.type === 0);
    if (!primary) primary = activities.find(a => a.type === 1);
    let spotify = activities.find(a => a.type === 2);

    let color = 'text-gray-400', bg = 'bg-gray-500/10', border = 'border-gray-500/30';
    let txt = 'OFFLINE', dot = 'bg-gray-400', avTxt = 'OFF', avBg = 'bg-gray-500', pulse = false;

    if (primary) {
        const name = primary.name.toUpperCase();
        if (name.includes('OSU')) { color='text-pink-400'; bg='bg-pink-500/10'; border='border-pink-500/30'; dot='bg-pink-400'; avBg='bg-pink-500'; }
        else { color='text-indigo-400'; bg='bg-indigo-500/10'; border='border-indigo-500/30'; dot='bg-indigo-400'; avBg='bg-indigo-500'; }
        txt = primary.type === 1 ? `STREAMING ${name}` : `PLAYING ${name}`; avTxt='GAME'; pulse=true;
    } else if (spotify) {
        color='text-green-400'; bg='bg-green-500/10'; border='border-green-500/30'; dot='bg-green-400'; txt='LISTENING SPOTIFY'; avTxt='MUSIC'; avBg='bg-green-500'; pulse=true;
    } else if (status === 'online') {
        color='text-green-400'; bg='bg-green-500/10'; border='border-green-500/30'; dot='bg-green-400'; txt='ONLINE'; avTxt='LIVE'; avBg='bg-green-500'; pulse=true;
    } else if (status === 'idle') {
        color='text-yellow-400'; bg='bg-yellow-500/10'; border='border-yellow-500/30'; dot='bg-yellow-400'; txt='IDLE'; avTxt='AWAY'; avBg='bg-yellow-500';
    } else if (status === 'dnd') {
        color='text-red-400'; bg='bg-red-500/10'; border='border-red-500/30'; dot='bg-red-400'; txt='BUSY'; avTxt='DND'; avBg='bg-red-500';
    } else {
        color='text-gray-400'; bg='bg-gray-500/10'; border='border-gray-500/30'; dot='bg-gray-400'; txt='OFFLINE'; avTxt='OFF'; avBg='bg-gray-500';
    }

    profileWrapper.className = `inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold mb-6 backdrop-blur-md transition-colors duration-300 ${bg} ${border} ${color}`;
    profileText.innerText = txt.length > 25 ? txt.substring(0,25)+'...' : txt;
    profileDot.className = `w-2 h-2 rounded-full mr-2 ${dot} ${pulse ? 'animate-pulse' : ''}`;
    avatarBadge.className = `absolute -bottom-2 -right-2 text-black text-[10px] font-bold px-2 py-0.5 rounded-full border border-black transition-colors duration-300 ${avBg} ${pulse ? 'animate-pulse' : ''}`;
    avatarBadge.innerText = avTxt;
}

// --- UI UTILS ---
function switchTab(t) { document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(e=>e.classList.remove('active')); document.getElementById('tab-'+t).classList.add('active'); document.getElementById('btn-'+t).classList.add('active'); }
function copyDiscord() { navigator.clipboard.writeText(".morgun.").then(()=>{ var t=document.getElementById("toast"); t.className="show"; setTimeout(()=>t.className=t.className.replace("show",""),3000); }); }
function openImageModal() { document.getElementById('image-modal').classList.remove('hidden'); }
function closeImageModal() { document.getElementById('image-modal').classList.add('hidden'); }
document.addEventListener('keydown', e=>{if(e.key==="Escape")closeImageModal()});

// --- STREAM ENGINE (OSU LOGIC) ---
let clickTimes = [];
let timeDiffs = [];
let beginTime = -1;
let keys = { k1: 'z', k2: 'x' };
let counts = { k1: 0, k2: 0 };
let binding = null;
let chartData = []; 

const canvas = document.getElementById('bpmChart');
const ctx = canvas.getContext('2d');
let width, height;

function resize() {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width; canvas.height = height;
}
window.addEventListener('resize', resize); resize();

function bindKey(k) {
    binding = k;
    const btn = document.getElementById('bind-'+k);
    btn.innerText = "..."; btn.classList.add('binding');
}

function resetTest() {
    clickTimes = []; timeDiffs = []; chartData = [];
    counts = { k1: 0, k2: 0 };
    beginTime = -1;
    document.getElementById('val-bpm').innerText = "0";
    document.getElementById('val-ur').innerText = "0.00";
    document.getElementById('val-time').innerText = "0.000 s";
    document.getElementById('count-k1').innerText = "0";
    document.getElementById('count-k2').innerText = "0";
    ctx.clearRect(0,0,width,height);
}

function update(click) {
    if (click) {
        const now = Date.now();
        clickTimes.push(now);
        if (clickTimes.length > 1) {
            timeDiffs.push(clickTimes[clickTimes.length - 1] - clickTimes[clickTimes.length - 2]);
        }
        
        // Math Logic
        if (timeDiffs.length > 0) {
            const sum = timeDiffs.reduce((a, b) => a + b, 0);
            const avg = sum / timeDiffs.length;
            
            // Standard Deviation for UR
            const variance = timeDiffs.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / timeDiffs.length;
            const std = Math.sqrt(variance);
            const unstableRate = std * 10;
            document.getElementById('val-ur').innerText = unstableRate.toFixed(2);
        }

        // Live BPM for Chart
        if (clickTimes.length > 2) {
            // Instant BPM based on last few clicks for graph
            const recentDiffs = timeDiffs.slice(-10); // Take last 10 for smoothness
            const recentAvg = recentDiffs.reduce((a,b)=>a+b,0) / recentDiffs.length;
            const currentBPM = Math.round(15000 / recentAvg); // 1/4 stream formula
            
            chartData.push(currentBPM);
            if(chartData.length > 100) chartData.shift(); // Keep graph moving
            drawChart();
        }

    } else {
        // Timer Loop
        if(beginTime !== -1) {
            const streamTime = (Date.now() - beginTime) / 1000;
            document.getElementById('val-time').innerText = streamTime.toFixed(3) + " s";
            
            // Average BPM over total time
            if (clickTimes.length > 2) {
                // Formula: (Clicks / Time_in_min) / 4
                const totalMinutes = (Date.now() - beginTime) / 60000;
                const bpm = Math.round((clickTimes.length / totalMinutes) / 4);
                document.getElementById('val-bpm').innerText = bpm;
            }
        }
    }
}

function drawChart() {
    ctx.clearRect(0, 0, width, height);
    if (chartData.length < 2) return;

    ctx.beginPath();
    const stepX = width / (chartData.length - 1);
    
    // Dynamic Scale
    const min = Math.min(...chartData) * 0.9;
    const max = Math.max(...chartData) * 1.1;
    const range = max - min || 1;

    chartData.forEach((val, i) => {
        const x = i * stepX;
        const normalizedY = (val - min) / range;
        // Invert Y because canvas draws from top-left
        const y = height - (normalizedY * height); 
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.stroke();
    
    // Fill Gradient
    ctx.lineTo(width, height); ctx.lineTo(0, height);
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.5)');
    grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    ctx.fillStyle = grad; ctx.fill();
}

// Input Listener
document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const key = e.key.toLowerCase();

    // Binding Logic
    if (binding) {
        keys[binding] = key;
        document.getElementById(binding+'-visual').innerText = key.toUpperCase();
        const btn = document.getElementById('bind-'+binding);
        btn.innerText = "Change Key"; btn.classList.remove('binding');
        binding = null; return;
    }

    // Testing Logic
    const isK1 = key === keys.k1;
    const isK2 = key === keys.k2;

    if (isK1 || isK2) {
        e.preventDefault();
        
        if (beginTime === -1) {
            beginTime = Date.now();
            // Start timer loop
            setInterval(() => update(false), 30);
        }

        if (isK1) {
            counts.k1++;
            document.getElementById('count-k1').innerText = counts.k1;
            const el = document.getElementById('k1-visual');
            el.classList.add('active'); setTimeout(()=>el.classList.remove('active'), 80);
        } else {
            counts.k2++;
            document.getElementById('count-k2').innerText = counts.k2;
            const el = document.getElementById('k2-visual');
            el.classList.add('active'); setTimeout(()=>el.classList.remove('active'), 80);
        }

        update(true);
    }
});

// Init
fetchLanyardStatus();
setInterval(fetchLanyardStatus, 5000);
