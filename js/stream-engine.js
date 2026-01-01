let clickTimes = [], hitErrors = [], liveHitErrors = [], chartData = [];
let keys = { k1: 'KeyZ', k2: 'KeyX' }, keyNames = { k1: 'Z', k2: 'X' };
let counts = { k1: 0, k2: 0 }, binding = null, isTesting = false, inputMode = 'keyboard';
let testSettings = { mode: 'none', value: 0 }, beginTime = -1, keyStates = {};

const chartCanvas = document.getElementById('bpmChart'), errCanvas = document.getElementById('errorBar');
const chartCtx = chartCanvas?.getContext('2d'), errCtx = errCanvas?.getContext('2d');
let width, height, errW, errH;

function resize() {
    if (!chartCanvas || !chartCanvas.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const p = chartCanvas.parentElement;
    width = p.clientWidth; height = p.clientHeight;
    chartCanvas.width = width * dpr; chartCanvas.height = height * dpr;
    chartCtx.scale(dpr, dpr);

    const ep = errCanvas.parentElement;
    errW = ep.clientWidth; errH = ep.clientHeight;
    errCanvas.width = errW * dpr; errCanvas.height = errH * dpr;
    errCtx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
if (chartCanvas) resize();

function setLimitType(type) {
    const input = document.getElementById('limit-value');
    ['none', 'time', 'clicks'].forEach(t => {
        const btn = document.getElementById('lim-' + t);
        const isActive = t === type;
        btn.className = isActive ? "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all bg-indigo-500 text-white shadow-lg transform scale-105" : "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all text-gray-500 hover:text-white hover:bg-white/5";
    });
    input.disabled = type === 'none';
    if (type === 'none') { input.value = ''; input.classList.add('opacity-50', 'cursor-not-allowed'); input.placeholder = '-'; } 
    else { input.classList.remove('opacity-50', 'cursor-not-allowed'); input.focus(); input.placeholder = '0'; }
}

function toggleInputMode() {
    inputMode = inputMode === 'keyboard' ? 'mouse' : 'keyboard';
    const isMouse = inputMode === 'mouse';
    document.getElementById('mode-icon').className = isMouse ? "fas fa-mouse" : "fas fa-keyboard";
    document.getElementById('mode-text').innerText = isMouse ? "Mouse" : "Keyboard";
    document.getElementById('k1-visual').innerText = isMouse ? "LMB" : keyNames.k1;
    document.getElementById('k2-visual').innerText = isMouse ? "RMB" : keyNames.k2;
    ['bind-k1', 'bind-k2'].forEach(id => document.getElementById(id).style.display = isMouse ? 'none' : 'block');
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
    const span = btn.querySelector('span'), icon = btn.querySelector('i');
    
    if (isTesting) {
        let type = 'none';
        if (document.getElementById('lim-time').classList.contains('bg-indigo-500')) type = 'time';
        if (document.getElementById('lim-clicks').classList.contains('bg-indigo-500')) type = 'clicks';
        const val = parseInt(document.getElementById('limit-value').value);
        testSettings = { mode: type, value: (isNaN(val) || val <= 0) ? 0 : val };

        resetTest();
        btn.className = "bg-red-500 hover:bg-red-400 text-black px-8 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transform hover:scale-105 active:scale-95";
        span.innerText = "STOP"; icon.className = "fas fa-stop mr-2";
        beginTime = performance.now();
        requestAnimationFrame(gameLoop);
    } else {
        btn.className = "bg-green-500 hover:bg-green-400 text-black px-8 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:scale-105 active:scale-95";
        span.innerText = "START"; icon.className = "fas fa-play mr-2";
        beginTime = -1;
        drawFinalResults();
    }
}

function manualReset() {
    if (isTesting) toggleTestState();
    resetTest();
}

function resetTest() {
    clickTimes = []; chartData = []; hitErrors = []; liveHitErrors = []; counts = { k1: 0, k2: 0 }; keyStates = {};
    ['val-bpm', 'count-k1', 'count-k2'].forEach(id => document.getElementById(id).innerText = "0");
    document.getElementById('val-ur').innerText = "0.00"; 
    document.getElementById('val-time').innerText = "0.000 s";
    if (width) chartCtx.clearRect(0, 0, width, height);
    if (errW) errCtx.clearRect(0, 0, errW, errH);
    document.getElementById('input-history-list').innerHTML = `<div id="history-placeholder" class="text-center text-xs text-gray-600 italic py-10">Waiting for input...</div>`;
}

function handleInput(type, isDown) {
    if (!isTesting) {
        if (!isDown) document.getElementById(type + '-visual').classList.remove('active');
        return;
    }
    const now = performance.now();
    
    if (isDown) {
        if (keyStates[type]) return;
        keyStates[type] = now;
        counts[type]++;
        document.getElementById('count-' + type).innerText = counts[type];
        document.getElementById(type + '-visual').classList.add('active');
        clickTimes.push(now);
        const ph = document.getElementById('history-placeholder');
        if (ph) ph.remove();
        calculateStats(now);
        checkLimits(now);
    } else {
        const start = keyStates[type];
        if (start) {
            addHistoryRow(type, now - start);
            delete keyStates[type];
        }
        document.getElementById(type + '-visual').classList.remove('active');
    }
}

function addHistoryRow(type, duration) {
    const list = document.getElementById('input-history-list');
    const row = document.createElement('div');
    row.className = "flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/5 animate-fade-in";
    const label = type === 'k1' ? (inputMode === 'mouse' ? 'LMB' : keyNames.k1) : (inputMode === 'mouse' ? 'RMB' : keyNames.k2);
    const color = type === 'k1' ? 'text-indigo-400' : 'text-fuchsia-400';
    const bg = type === 'k1' ? 'bg-indigo-500' : 'bg-fuchsia-500';
    
    row.innerHTML = `<div class="w-8 text-xs font-bold ${color}">${label}</div>
        <div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div class="h-full ${bg} rounded-full" style="width: ${Math.min((duration/200)*100, 100)}%"></div></div>
        <div class="w-12 text-right text-xs font-mono text-gray-400">${duration.toFixed(0)}ms</div>`;
    list.prepend(row);
    if (list.children.length > 1000) list.removeChild(list.lastChild);
}

function calculateStats(now) {
    if (clickTimes.length < 2) return;
    let intervals = [];
    for (let i = 1; i < clickTimes.length; i++) intervals.push(clickTimes[i] - clickTimes[i-1]);
    
    const recent = intervals.slice(-10);
    const avg = recent.reduce((a,b)=>a+b,0) / recent.length;
    const bpm = avg > 0 ? Math.round(15000/avg) : 0;
    
    document.getElementById('val-bpm').innerText = bpm;
    chartData.push(bpm);
    if (chartData.length > 100) chartData.shift();

    const totalAvg = intervals.reduce((a,b)=>a+b,0) / intervals.length;
    const ur = Math.sqrt(intervals.reduce((a,b)=>a+Math.pow(b-totalAvg,2),0) / intervals.length) * 10;
    document.getElementById('val-ur').innerText = isNaN(ur) ? "0.00" : ur.toFixed(2);

    const error = intervals[intervals.length-1] - totalAvg;
    hitErrors.push(error);
    liveHitErrors.push({ offset: error, time: now });
}

function checkLimits(now) {
    if (testSettings.mode === 'clicks' && (counts.k1 + counts.k2) >= testSettings.value) toggleTestState();
    else if (testSettings.mode === 'time' && (now - beginTime)/1000 >= testSettings.value) toggleTestState();
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
    if (!width) resize();
    chartCtx.clearRect(0, 0, width, height);
    if (chartData.length < 2) return;
    chartCtx.beginPath(); chartCtx.lineWidth = 2; chartCtx.strokeStyle = '#6366f1';
    let min = Math.min(...chartData), max = Math.max(...chartData);
    if (max === min) { min-=10; max+=10; }
    const range = max - min, step = width / (chartData.length - 1);
    
    chartData.forEach((val, i) => {
        const y = height - ((val - min) / range * height);
        i === 0 ? chartCtx.moveTo(i * step, y) : chartCtx.lineTo(i * step, y);
    });
    chartCtx.stroke();
    chartCtx.lineTo(width, height); chartCtx.lineTo(0, height);
    const grad = chartCtx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.3)'); grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
    chartCtx.fillStyle = grad; chartCtx.fill();
}

function drawLiveHitErrors(now) {
    if (!errW) resize();
    errCtx.clearRect(0, 0, errW, errH);
    errCtx.fillStyle = 'rgba(255, 255, 255, 0.8)'; errCtx.fillRect(errW/2-1, 0, 2, errH);
    liveHitErrors = liveHitErrors.filter(e => now - e.time < 1000);
    liveHitErrors.forEach(e => drawErrorBar(e.offset, 1 - (now - e.time)/1000));
}

function drawFinalResults() {
    if (!errW) resize();
    errCtx.clearRect(0, 0, errW, errH);
    errCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; errCtx.fillRect(errW/2-1, 0, 2, errH);
    hitErrors.forEach(e => drawErrorBar(e, 0.6));
}

function drawErrorBar(offset, alpha) {
    const x = (errW / 2) + (offset * 3);
    const abs = Math.abs(offset);
    let c = abs < 15 ? "59, 130, 246" : abs < 35 ? "34, 197, 94" : "239, 68, 68";
    errCtx.fillStyle = `rgba(${c}, ${alpha})`;
    errCtx.fillRect(x - 1, 5, 2, errH - 10);
}

document.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (binding && inputMode === 'keyboard') {
        e.preventDefault();
        keys[binding] = e.code;
        const name = e.code.replace(/Key|Digit/, '');
        keyNames[binding] = name;
        document.getElementById(binding + '-visual').innerText = name;
        const btn = document.getElementById('bind-' + binding);
        btn.innerText = "Change Key"; btn.classList.remove('binding');
        binding = null; return;
    }
    if (inputMode === 'keyboard') {
        if (e.code === keys.k1) { e.preventDefault(); handleInput('k1', true); }
        else if (e.code === keys.k2) { e.preventDefault(); handleInput('k2', true); }
    }
});

document.addEventListener('keyup', e => {
    if (inputMode === 'keyboard') {
        if (e.code === keys.k1) handleInput('k1', false);
        if (e.code === keys.k2) handleInput('k2', false);
    }
});

document.addEventListener('mousedown', e => {
    if (inputMode === 'mouse') {
        if (e.button === 0) handleInput('k1', true);
        if (e.button === 2) handleInput('k2', true);
    }
});

document.addEventListener('mouseup', e => {
    if (inputMode === 'mouse') {
        if (e.button === 0) handleInput('k1', false);
        if (e.button === 2) handleInput('k2', false);
    }
});

document.addEventListener('contextmenu', e => { if (inputMode === 'mouse' && isTesting) e.preventDefault(); });
