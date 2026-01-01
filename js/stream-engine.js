let clickTimes = [];
let hitErrors = []; 
let liveHitErrors = []; 
let chartData = [];
let keys = { k1: 'KeyZ', k2: 'KeyX' }; 
let keyNames = { k1: 'Z', k2: 'X' }; 
let counts = { k1: 0, k2: 0 };
let binding = null;
let isTesting = false;
let inputMode = 'keyboard';
let testSettings = { mode: 'none', value: 0 };
let beginTime = -1;
let keyStates = {};

const chartCanvas = document.getElementById('bpmChart');
const chartCtx = chartCanvas ? chartCanvas.getContext('2d') : null;
const errCanvas = document.getElementById('errorBar');
const errCtx = errCanvas ? errCanvas.getContext('2d') : null;

let width, height, errW, errH;

function resize() {
    if (!chartCanvas || !chartCanvas.parentElement) return;
    
    const dpr = window.devicePixelRatio || 1;
    const parent = chartCanvas.parentElement;
    
    width = parent.clientWidth;
    height = parent.clientHeight;
    
    chartCanvas.width = width * dpr;
    chartCanvas.height = height * dpr;
    chartCtx.scale(dpr, dpr);
    
    const errParent = errCanvas.parentElement;
    errW = errParent.clientWidth;
    errH = errParent.clientHeight;
    errCanvas.width = errW * dpr;
    errCanvas.height = errH * dpr;
    errCtx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
if(chartCanvas) resize();

function setLimitType(type) {
    const input = document.getElementById('limit-value');
    ['none', 'time', 'clicks'].forEach(t => {
        const btn = document.getElementById('lim-' + t);
        if (t === type) {
            btn.className = "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all bg-indigo-500 text-white shadow-lg transform scale-105";
        } else {
            btn.className = "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all text-gray-500 hover:text-white hover:bg-white/5";
        }
    });
    if (type === 'none') {
        input.disabled = true; input.value = ''; input.classList.add('opacity-50', 'cursor-not-allowed'); input.placeholder = '-';
    } else {
        input.disabled = false; input.classList.remove('opacity-50', 'cursor-not-allowed'); input.focus(); input.placeholder = '0';
    }
}

function toggleInputMode() {
    inputMode = inputMode === 'keyboard' ? 'mouse' : 'keyboard';
    const text = document.getElementById('mode-text');
    const icon = document.getElementById('mode-icon');
    const k1 = document.getElementById('k1-visual');
    const k2 = document.getElementById('k2-visual');
    const b1 = document.getElementById('bind-k1');
    const b2 = document.getElementById('bind-k2');

    const isMouse = inputMode === 'mouse';
    const tKeyboard = (typeof translations !== 'undefined') ? translations[currentLang].mode_keyboard : "Keyboard";
    const tMouse = (typeof translations !== 'undefined') ? translations[currentLang].mode_mouse : "Mouse";

    if (isMouse) {
        icon.className = "fas fa-mouse"; text.innerText = tMouse; k1.innerText = "LMB"; k2.innerText = "RMB";
        b1.style.display = 'none'; b2.style.display = 'none';
    } else {
        icon.className = "fas fa-keyboard"; text.innerText = tKeyboard; k1.innerText = keyNames.k1; k2.innerText = keyNames.k2;
        b1.style.display = 'block'; b2.style.display = 'block';
    }
}

function bindKey(k) {
    if (inputMode === 'mouse') return;
    binding = k;
    const btn = document.getElementById('bind-' + k);
    btn.innerText = "...";
    btn.classList.add('binding');
}

function toggleTestState() {
    isTesting = !isTesting;
    const btn = document.getElementById('btn-start');
    const span = btn.querySelector('span');
    const icon = btn.querySelector('i');

    let type = 'none';
    if (document.getElementById('lim-time').classList.contains('bg-indigo-500')) type = 'time';
    if (document.getElementById('lim-clicks').classList.contains('bg-indigo-500')) type = 'clicks';
    const val = parseInt(document.getElementById('limit-value').value);
    testSettings = { mode: type, value: (isNaN(val) || val <= 0) ? 0 : val };

    const tStart = (typeof translations !== 'undefined') ? translations[currentLang].btn_start : "START";
    const tStop = (typeof translations !== 'undefined') ? translations[currentLang].btn_stop : "STOP";

    if (isTesting) {
        resetTest();
        btn.classList.remove('bg-green-500', 'hover:bg-green-400', 'shadow-[0_0_20px_rgba(34,197,94,0.3)]');
        btn.classList.add('bg-red-500', 'hover:bg-red-400', 'shadow-[0_0_20px_rgba(239,68,68,0.3)]');
        span.innerText = tStop; icon.className = "fas fa-stop mr-2";
        beginTime = performance.now();
        requestAnimationFrame(gameLoop);
    } else {
        btn.classList.remove('bg-red-500', 'hover:bg-red-400', 'shadow-[0_0_20px_rgba(239,68,68,0.3)]');
        btn.classList.add('bg-green-500', 'hover:bg-green-400', 'shadow-[0_0_20px_rgba(34,197,94,0.3)]');
        span.innerText = tStart; icon.className = "fas fa-play mr-2";
        beginTime = -1;
        drawFinalResults(); 
    }
}

// --- NEW MANUAL RESET FUNCTION ---
function manualReset() {
    if (isTesting) {
        toggleTestState(); // Stop test if running
    }
    resetTest(); // Clear all data
}

function resetTest() {
    clickTimes = []; chartData = []; hitErrors = []; liveHitErrors = []; counts = { k1: 0, k2: 0 };
    keyStates = {};
    document.getElementById('val-bpm').innerText = "0"; document.getElementById('val-ur').innerText = "0.00"; document.getElementById('val-time').innerText = "0.000 s";
    document.getElementById('count-k1').innerText = "0"; document.getElementById('count-k2').innerText = "0";
    if(width) chartCtx.clearRect(0, 0, width, height);
    if(errW) errCtx.clearRect(0, 0, errW, errH);
    document.getElementById('input-history-list').innerHTML = `<div id="history-placeholder" class="text-center text-xs text-gray-600 italic py-10">Waiting for input...</div>`;
}

function processInputDown(type) {
    if (!isTesting) return;
    const now = performance.now();
    
    if (keyStates[type]) return; 
    keyStates[type] = now;

    counts[type]++;
    document.getElementById('count-' + type).innerText = counts[type];
    document.getElementById(type + '-visual').classList.add('active'); 

    clickTimes.push(now);
    
    const ph = document.getElementById('history-placeholder');
    if(ph) ph.remove();

    calculateStats(now);
    checkLimits(now);
}

function processInputUp(type) {
    if (!isTesting) {
        document.getElementById(type + '-visual').classList.remove('active');
        return;
    }
    
    const now = performance.now();
    const startTime = keyStates[type];
    
    if (startTime) {
        const duration = now - startTime;
        addHistoryRow(type, duration);
        delete keyStates[type];
    }
    
    document.getElementById(type + '-visual').classList.remove('active'); 
}

function addHistoryRow(type, duration) {
    const list = document.getElementById('input-history-list');
    const row = document.createElement('div');
    row.className = "flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/5 animate-fade-in";
    
    let keyLabel = type === 'k1' ? (inputMode === 'mouse' ? 'LMB' : keyNames.k1) : (inputMode === 'mouse' ? 'RMB' : keyNames.k2);
    let colorClass = type === 'k1' ? 'text-indigo-400' : 'text-fuchsia-400';
    let barColor = type === 'k1' ? 'bg-indigo-500' : 'bg-fuchsia-500';
    const widthPct = Math.min((duration / 200) * 100, 100);

    row.innerHTML = `
        <div class="w-8 text-xs font-bold ${colorClass}">${keyLabel}</div>
        <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full ${barColor} rounded-full" style="width: ${widthPct}%"></div>
        </div>
        <div class="w-12 text-right text-xs font-mono text-gray-400">${duration.toFixed(0)}ms</div>
    `;
    list.prepend(row);
    
    // --- UPDATED LIMIT TO 1000 ---
    if (list.children.length > 1000) {
        list.removeChild(list.lastChild);
    }
}

function calculateStats(now) {
    if (clickTimes.length < 2) return;
    
    let intervals = [];
    for (let i = 1; i < clickTimes.length; i++) intervals.push(clickTimes[i] - clickTimes[i - 1]);
    
    const recentIntervals = intervals.slice(-10);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    const currentBpm = avgInterval > 0 ? Math.round(15000 / avgInterval) : 0;
    
    document.getElementById('val-bpm').innerText = currentBpm;
    chartData.push(currentBpm);
    if (chartData.length > 100) chartData.shift();

    const totalAvg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - totalAvg, 2), 0) / intervals.length;
    const ur = Math.sqrt(variance) * 10;
    document.getElementById('val-ur').innerText = isNaN(ur) ? "0.00" : ur.toFixed(2);

    const lastDiff = intervals[intervals.length - 1];
    const error = lastDiff - totalAvg; 
    
    hitErrors.push(error);
    liveHitErrors.push({ offset: error, time: now });
}

function checkLimits(now) {
    if (testSettings.mode === 'clicks') {
        if ((counts.k1 + counts.k2) >= testSettings.value) toggleTestState();
    } else if (testSettings.mode === 'time') {
        if ((now - beginTime) / 1000 >= testSettings.value) toggleTestState();
    }
}

function gameLoop() {
    if (!isTesting) return;
    const now = performance.now();
    document.getElementById('val-time').innerText = ((now - beginTime) / 1000).toFixed(3) + " s";
    drawChart(); 
    drawLiveHitErrors(now);
    requestAnimationFrame(gameLoop);
}

function drawChart() {
    if (!width || !height) resize();
    chartCtx.clearRect(0, 0, width, height);
    if (chartData.length < 2) return;
    chartCtx.beginPath(); chartCtx.lineWidth = 2; chartCtx.strokeStyle = '#6366f1';
    let min = Math.min(...chartData); let max = Math.max(...chartData);
    if (max === min) { min -= 10; max += 10; }
    const range = max - min; const step = width / (chartData.length - 1);
    for (let i = 0; i < chartData.length; i++) {
        const x = i * step; const val = chartData[i];
        const y = height - ((val - min) / range * height); 
        if (i === 0) chartCtx.moveTo(x, y); else chartCtx.lineTo(x, y);
    }
    chartCtx.stroke();
    chartCtx.lineTo(width, height); chartCtx.lineTo(0, height);
    const grad = chartCtx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.3)'); grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    chartCtx.fillStyle = grad; chartCtx.fill();
}

function drawLiveHitErrors(now) {
    if (!errW || !errH) resize();
    errCtx.clearRect(0, 0, errW, errH);
    errCtx.fillStyle = 'rgba(255, 255, 255, 0.8)'; errCtx.fillRect(errW / 2 - 1, 0, 2, errH);
    
    liveHitErrors = liveHitErrors.filter(e => now - e.time < 1000);
    
    liveHitErrors.forEach(e => {
        const life = now - e.time;
        const alpha = 1 - (life / 1000);
        const x = (errW / 2) + (e.offset * 3);
        let color = `255, 255, 255`; 
        const absErr = Math.abs(e.offset);
        if (absErr < 15) color = `59, 130, 246`; else if (absErr < 35) color = `34, 197, 94`; else color = `239, 68, 68`; 
        errCtx.fillStyle = `rgba(${color}, ${alpha})`; 
        errCtx.fillRect(x - 1, 5, 2, errH - 10);
    });
}

function drawFinalResults() {
    if (!errW || !errH) resize();
    errCtx.clearRect(0, 0, errW, errH);
    errCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    errCtx.fillRect(errW / 2 - 1, 0, 2, errH);

    hitErrors.forEach(error => {
        const x = (errW / 2) + (error * 3);
        let color = `255, 255, 255`; 
        const absErr = Math.abs(error);
        if (absErr < 15) color = `59, 130, 246`; else if (absErr < 35) color = `34, 197, 94`; else color = `239, 68, 68`; 
        errCtx.fillStyle = `rgba(${color}, 0.6)`; 
        errCtx.fillRect(x - 1, 5, 2, errH - 10);
    });
}

document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (binding && inputMode === 'keyboard') {
        e.preventDefault(); keys[binding] = e.code;
        const name = e.code.replace('Key', '').replace('Digit', '');
        keyNames[binding] = name; document.getElementById(binding + '-visual').innerText = name;
        const btn = document.getElementById('bind-' + binding);
        const tChange = (typeof translations !== 'undefined') ? translations[currentLang].change_key : "Change";
        btn.innerText = tChange; btn.classList.remove('binding'); binding = null; return;
    }
    if (inputMode === 'keyboard') {
        if (e.code === keys.k1) { e.preventDefault(); processInputDown('k1'); } 
        else if (e.code === keys.k2) { e.preventDefault(); processInputDown('k2'); }
    }
});
document.addEventListener('keyup', (e) => {
    if (inputMode === 'keyboard') {
        if (e.code === keys.k1) processInputUp('k1');
        if (e.code === keys.k2) processInputUp('k2');
    }
});
document.addEventListener('mousedown', (e) => {
    if (inputMode === 'mouse') {
        if (e.button === 0) processInputDown('k1');
        if (e.button === 2) processInputDown('k2');
    }
});
document.addEventListener('mouseup', (e) => {
    if (inputMode === 'mouse') {
        if (e.button === 0) processInputUp('k1');
        if (e.button === 2) processInputUp('k2');
    }
});
document.addEventListener('contextmenu', event => {
    if (inputMode === 'mouse' && isTesting) event.preventDefault();
});