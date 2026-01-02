let clickTimes = [], hitErrors = [], liveHitErrors = [], chartData = [];
let keys = { k1: 'KeyZ', k2: 'KeyX' }, keyNames = { k1: 'Z', k2: 'X' };
let counts = { k1: 0, k2: 0 }, binding = null, isTesting = false, inputMode = 'keyboard';
let testSettings = { mode: 'none', value: 0 }, beginTime = -1, keyStates = {};
window.fullTestHistory = [];

const dom = {
    bpmChart: document.getElementById('bpmChart'),
    errorBar: document.getElementById('errorBar'),
    bpmVal: document.getElementById('val-bpm'),
    urVal: document.getElementById('val-ur'),
    timeVal: document.getElementById('val-time'),
    countK1: document.getElementById('count-k1'),
    countK2: document.getElementById('count-k2'),
    visualK1: document.getElementById('k1-visual'),
    visualK2: document.getElementById('k2-visual'),
    historyList: document.getElementById('input-history-list'),
    btnStart: document.getElementById('btn-start'),
    btnDownload: document.getElementById('btn-download'),
    limitVal: document.getElementById('limit-value')
};

const chartCtx = dom.bpmChart?.getContext('2d', { alpha: false });
const errCtx = dom.errorBar?.getContext('2d', { alpha: true });
let width, height, errW, errH;
let lastDrawTime = 0;
const FPS_LIMIT = 1000 / 60;

function resize() {
    if (!dom.bpmChart || !dom.bpmChart.parentElement) return;
    const dpr = window.devicePixelRatio || 1;
    const p = dom.bpmChart.parentElement;
    width = p.clientWidth; height = p.clientHeight;
    dom.bpmChart.width = width * dpr; dom.bpmChart.height = height * dpr;
    chartCtx.scale(dpr, dpr);
    const ep = dom.errorBar.parentElement;
    errW = ep.clientWidth; errH = ep.clientHeight;
    dom.errorBar.width = errW * dpr; dom.errorBar.height = errH * dpr;
    errCtx.scale(dpr, dpr);
}
window.addEventListener('resize', resize);
if (dom.bpmChart) resize();

window.setLimitType = function(type) {
    ['none', 'time', 'clicks'].forEach(t => {
        const btn = document.getElementById('lim-' + t);
        if(btn) btn.className = (t === type) ? "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all bg-indigo-500 text-white shadow-lg transform scale-105" : "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all text-gray-500 hover:text-white hover:bg-white/5";
    });
    if(dom.limitVal) {
        dom.limitVal.disabled = type === 'none';
        if (type === 'none') { dom.limitVal.value = ''; dom.limitVal.classList.add('opacity-50', 'cursor-not-allowed'); dom.limitVal.placeholder = '-'; } 
        else { dom.limitVal.classList.remove('opacity-50', 'cursor-not-allowed'); dom.limitVal.focus(); dom.limitVal.placeholder = '0'; }
    }
}

window.toggleInputMode = function() {
    inputMode = inputMode === 'keyboard' ? 'mouse' : 'keyboard';
    const isMouse = inputMode === 'mouse';
    document.getElementById('mode-icon').className = isMouse ? "fas fa-mouse" : "fas fa-keyboard";
    document.getElementById('mode-text').innerText = isMouse ? "Mouse" : "Keyboard";
    dom.visualK1.innerText = isMouse ? "LMB" : keyNames.k1;
    dom.visualK2.innerText = isMouse ? "RMB" : keyNames.k2;
    ['bind-k1', 'bind-k2'].forEach(id => document.getElementById(id).style.display = isMouse ? 'none' : 'block');
}

window.bindKey = function(k) {
    if (inputMode === 'mouse') return;
    binding = k;
    const btn = document.getElementById('bind-' + k);
    btn.innerText = "...";
    btn.classList.add('binding');
}

window.toggleTestState = function() {
    isTesting = !isTesting;
    if (isTesting) {
        let type = 'none';
        const limTime = document.getElementById('lim-time');
        const limClicks = document.getElementById('lim-clicks');
        if (limTime && limTime.classList.contains('bg-indigo-500')) type = 'time';
        if (limClicks && limClicks.classList.contains('bg-indigo-500')) type = 'clicks';
        const val = parseInt(dom.limitVal.value);
        testSettings = { mode: type, value: (isNaN(val) || val <= 0) ? 0 : val };
        resetTest();
        dom.btnStart.className = "bg-red-500 hover:bg-red-400 text-black px-8 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transform hover:scale-105 active:scale-95";
        dom.btnStart.innerHTML = '<i class="fas fa-stop mr-2"></i><span>STOP</span>';
        if(dom.btnDownload) dom.btnDownload.disabled = true;
        beginTime = performance.now();
        loop(0);
    } else {
        dom.btnStart.className = "bg-green-500 hover:bg-green-400 text-black px-8 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:scale-105 active:scale-95";
        dom.btnStart.innerHTML = '<i class="fas fa-play mr-2"></i><span>START</span>';
        beginTime = -1;
        if(dom.btnDownload) dom.btnDownload.disabled = window.fullTestHistory.length === 0;
        drawFinalResults();
    }
}

window.manualReset = function() {
    if (isTesting) toggleTestState();
    resetTest();
}

function resetTest() {
    clickTimes = []; chartData = []; hitErrors = []; liveHitErrors = []; counts = { k1: 0, k2: 0 }; keyStates = {};
    window.fullTestHistory = [];
    dom.bpmVal.innerText = "0"; dom.urVal.innerText = "0.00"; dom.timeVal.innerText = "0.000 s";
    dom.countK1.innerText = "0"; dom.countK2.innerText = "0";
    if(dom.btnDownload) dom.btnDownload.disabled = true;
    if (width) chartCtx.clearRect(0, 0, width, height);
    if (errW) errCtx.clearRect(0, 0, errW, errH);
    dom.historyList.innerHTML = `<div id="history-placeholder" class="text-center text-xs text-gray-600 italic py-10">Waiting for input...</div>`;
}

function handleInput(type, isDown) {
    if (!isTesting) {
        if (!isDown) {
            if(type === 'k1') dom.visualK1.classList.remove('active');
            else dom.visualK2.classList.remove('active');
        }
        return;
    }
    const now = performance.now();
    if (isDown) {
        if (keyStates[type]) return;
        keyStates[type] = now;
        counts[type]++;
        if(type === 'k1') { dom.countK1.innerText = counts.k1; dom.visualK1.classList.add('active'); }
        else { dom.countK2.innerText = counts.k2; dom.visualK2.classList.add('active'); }
        clickTimes.push(now);
        const ph = document.getElementById('history-placeholder');
        if (ph) ph.remove();
        calculateStats(now);
        checkLimits(now);
    } else {
        const start = keyStates[type];
        if (start) {
            const duration = now - start;
            const pressTime = start - beginTime;
            const label = type === 'k1' ? (inputMode === 'mouse' ? 'LMB' : keyNames.k1) : (inputMode === 'mouse' ? 'RMB' : keyNames.k2);
            window.fullTestHistory.push({ key: label, timestamp: pressTime.toFixed(2), duration: duration.toFixed(1) });
            requestAnimationFrame(() => addHistoryRow(type, duration));
            delete keyStates[type];
        }
        if(type === 'k1') dom.visualK1.classList.remove('active');
        else dom.visualK2.classList.remove('active');
    }
}

function addHistoryRow(type, duration) {
    if (dom.historyList.children.length > 30) dom.historyList.lastElementChild.remove();
    const row = document.createElement('div');
    row.className = "flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/5";
    const label = type === 'k1' ? (inputMode === 'mouse' ? 'LMB' : keyNames.k1) : (inputMode === 'mouse' ? 'RMB' : keyNames.k2);
    const color = type === 'k1' ? 'text-indigo-400' : 'text-fuchsia-400';
    const bg = type === 'k1' ? 'bg-indigo-500' : 'bg-fuchsia-500';
    row.innerHTML = `<div class="w-8 text-xs font-bold ${color}">${label}</div><div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div class="h-full ${bg} rounded-full" style="width: ${Math.min((duration/150)*100, 100)}%"></div></div><div class="w-12 text-right text-xs font-mono text-gray-400">${Math.round(duration)}ms</div>`;
    dom.historyList.prepend(row);
}

function calculateStats(now) {
    if (clickTimes.length < 2) return;
    const startIndex = Math.max(0, clickTimes.length - 11);
    let recentIntervals = [];
    for (let i = startIndex + 1; i < clickTimes.length; i++) recentIntervals.push(clickTimes[i] - clickTimes[i-1]);
    if (recentIntervals.length === 0) return;
    const avg = recentIntervals.reduce((a,b)=>a+b,0) / recentIntervals.length;
    const bpm = avg > 0 ? Math.round(15000/avg) : 0;
    dom.bpmVal.innerText = bpm;
    chartData.push(bpm);
    if (chartData.length > 100) chartData.shift();
    if (clickTimes.length % 5 === 0 || clickTimes.length < 50) {
        let allIntervals = [];
        for (let i = 1; i < clickTimes.length; i++) allIntervals.push(clickTimes[i] - clickTimes[i-1]);
        const totalAvg = allIntervals.reduce((a,b)=>a+b,0) / allIntervals.length;
        const variance = allIntervals.reduce((a,b)=>a+Math.pow(b-totalAvg,2),0) / allIntervals.length;
        const ur = Math.sqrt(variance) * 10;
        dom.urVal.innerText = isNaN(ur) ? "0.00" : ur.toFixed(2);
        const lastInterval = recentIntervals[recentIntervals.length-1];
        const error = lastInterval - totalAvg;
        hitErrors.push(error);
        liveHitErrors.push({ offset: error, time: now });
    }
}

function checkLimits(now) {
    if (testSettings.mode === 'clicks' && (counts.k1 + counts.k2) >= testSettings.value) toggleTestState();
    else if (testSettings.mode === 'time' && (now - beginTime)/1000 >= testSettings.value) toggleTestState();
}

function loop(timestamp) {
    if (!isTesting) return;
    if (timestamp - lastDrawTime >= FPS_LIMIT) {
        const now = performance.now();
        dom.timeVal.innerText = ((now - beginTime) / 1000).toFixed(3) + " s";
        drawChart();
        drawLiveHitErrors(now);
        lastDrawTime = timestamp;
    }
    requestAnimationFrame(loop);
}

function drawChart() {
    if (!width) resize();
    chartCtx.clearRect(0, 0, width, height);
    if (chartData.length < 2) return;
    chartCtx.beginPath(); chartCtx.lineWidth = 1; chartCtx.strokeStyle = '#6366f1';
    let min = 1000, max = 0;
    for(let i=0; i<chartData.length; i++) { if(chartData[i]<min) min = chartData[i]; if(chartData[i]>max) max = chartData[i]; }
    if (max === min) { min-=10; max+=10; }
    const range = max - min; 
    const step = width / (chartData.length - 1 || 1);
    chartCtx.moveTo(0, height - ((chartData[0] - min) / range * height));
    for (let i = 1; i < chartData.length; i++) chartCtx.lineTo(i * step, height - ((chartData[i] - min) / range * height));
    chartCtx.stroke();
}

function drawLiveHitErrors(now) {
    if (!errW) resize();
    errCtx.clearRect(0, 0, errW, errH);
    errCtx.fillStyle = 'rgba(255, 255, 255, 0.8)'; 
    errCtx.fillRect(Math.floor(errW/2)-1, 0, 2, errH);
    if (liveHitErrors.length > 0 && now - liveHitErrors[0].time > 1000) liveHitErrors.shift();
    for (let i = 0; i < liveHitErrors.length; i++) {
        const e = liveHitErrors[i];
        const life = now - e.time;
        if (life > 1000) continue;
        const alpha = 1 - (life / 1000);
        const x = (errW / 2) + (e.offset * 3);
        const abs = Math.abs(e.offset);
        if (abs < 15) errCtx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        else if (abs < 35) errCtx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        else errCtx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
        errCtx.fillRect(Math.floor(x) - 1, 5, 2, errH - 10);
    }
}

function drawFinalResults() {
    if (!errW) resize();
    errCtx.clearRect(0, 0, errW, errH);
    errCtx.fillStyle = 'rgba(255, 255, 255, 0.5)'; 
    errCtx.fillRect(Math.floor(errW/2)-1, 0, 2, errH);
    const start = Math.max(0, hitErrors.length - 200);
    for (let i = start; i < hitErrors.length; i++) {
        const error = hitErrors[i];
        const x = (errW / 2) + (error * 3);
        const abs = Math.abs(error);
        if (abs < 15) errCtx.fillStyle = "rgba(59, 130, 246, 0.6)";
        else if (abs < 35) errCtx.fillStyle = "rgba(34, 197, 94, 0.6)";
        else errCtx.fillStyle = "rgba(239, 68, 68, 0.6)";
        errCtx.fillRect(Math.floor(x) - 1, 5, 2, errH - 10);
    }
}

document.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (binding && inputMode === 'keyboard') {
        e.preventDefault(); keys[binding] = e.code;
        const name = e.code.replace(/Key|Digit/, '');
        keyNames[binding] = name; dom[binding === 'k1' ? 'visualK1' : 'visualK2'].innerText = name;
        const btn = document.getElementById('bind-' + binding);
        btn.innerText = "Change Key"; btn.classList.remove('binding'); binding = null; return;
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
