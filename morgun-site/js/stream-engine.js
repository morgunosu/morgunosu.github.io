/* --- STREAM ENGINE (OSU LOGIC) --- */
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

// Resize Handler
function resize() {
    if(!canvas.parentElement) return;
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width; canvas.height = height;
}
window.addEventListener('resize', resize); 
// Force resize on load to fix layout
window.addEventListener('load', resize);

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
        
        // Math Logic: UR
        if (timeDiffs.length > 0) {
            const sum = timeDiffs.reduce((a, b) => a + b, 0);
            const avg = sum / timeDiffs.length;
            const deviations = timeDiffs.map(v => (v - avg) * (v - avg));
            const variance = deviations.reduce((a, b) => a + b, 0) / deviations.length;
            const std = Math.sqrt(variance);
            const unstableRate = std * 10;
            document.getElementById('val-ur').innerText = unstableRate.toFixed(2);
        }

        // Live BPM Graph
        if (clickTimes.length > 2) {
            const recentDiffs = timeDiffs.slice(-10);
            const recentAvg = recentDiffs.reduce((a,b)=>a+b,0) / recentDiffs.length;
            const currentBPM = Math.round(15000 / recentAvg); 
            
            chartData.push(currentBPM);
            if(chartData.length > 100) chartData.shift(); 
            drawChart();
        }

    } else {
        // Timer Loop
        if(beginTime !== -1) {
            const streamTime = (Date.now() - beginTime) / 1000;
            document.getElementById('val-time').innerText = streamTime.toFixed(3) + " s";
            
            // Overall BPM
            if (clickTimes.length > 2) {
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
    const min = Math.min(...chartData) * 0.9;
    const max = Math.max(...chartData) * 1.1;
    const range = max - min || 1;

    chartData.forEach((val, i) => {
        const x = i * stepX;
        const normalizedY = (val - min) / range;
        const y = height - (normalizedY * height); 
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });

    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2; ctx.stroke();
    
    // Gradient
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

    // Binding
    if (binding) {
        keys[binding] = key;
        document.getElementById(binding+'-visual').innerText = key.toUpperCase();
        const btn = document.getElementById('bind-'+binding);
        btn.innerText = "Change Key"; btn.classList.remove('binding');
        binding = null; return;
    }

    const isK1 = key === keys.k1;
    const isK2 = key === keys.k2;

    if (isK1 || isK2) {
        e.preventDefault();
        
        if (beginTime === -1) {
            beginTime = Date.now();
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