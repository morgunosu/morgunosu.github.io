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

// --- UTILS ---
function switchTab(t) { document.querySelectorAll('.tab-content').forEach(e=>e.classList.remove('active')); document.querySelectorAll('.nav-btn').forEach(e=>e.classList.remove('active')); document.getElementById('tab-'+t).classList.add('active'); document.getElementById('btn-'+t).classList.add('active'); }
function copyDiscord() { navigator.clipboard.writeText(".morgun.").then(()=>{ var t=document.getElementById("toast"); t.className="show"; setTimeout(()=>t.className=t.className.replace("show",""),3000); }); }
function openImageModal() { document.getElementById('image-modal').classList.remove('hidden'); }
function closeImageModal() { document.getElementById('image-modal').classList.add('hidden'); }
document.addEventListener('keydown', e=>{if(e.key==="Escape")closeImageModal()});

// Init
fetchLanyardStatus();
setInterval(fetchLanyardStatus, 5000);