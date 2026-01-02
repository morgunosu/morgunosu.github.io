(() => {
    const state = {
        clickTimes: [], hitErrors: [], liveHitErrors: [], chartData: [],
        keys: { k1: 'KeyZ', k2: 'KeyX' }, keyNames: { k1: 'Z', k2: 'X' },
        counts: { k1: 0, k2: 0 }, binding: null, isTesting: false, inputMode: 'keyboard',
        settings: { mode: 'none', value: 0 }, beginTime: -1, keyStates: {},
        fullHistory: []
    };

    const dom = {
        bpmChart: document.getElementById('bpmChart'),
        errorBar: document.getElementById('errorBar'),
        bpmVal: document.getElementById('val-bpm'),
        urVal: document.getElementById('val-ur'),
        timeVal: document.getElementById('val-time'),
        counts: { k1: document.getElementById('count-k1'), k2: document.getElementById('count-k2') },
        visuals: { k1: document.getElementById('k1-visual'), k2: document.getElementById('k2-visual') },
        history: document.getElementById('input-history-list'),
        btnStart: document.getElementById('btn-start'),
        btnDownload: document.getElementById('btn-download'),
        limitVal: document.getElementById('limit-value'),
        modeIcon: document.getElementById('mode-icon'),
        modeText: document.getElementById('mode-text'),
        binds: { k1: document.getElementById('bind-k1'), k2: document.getElementById('bind-k2') }
    };

    let ctxChart, ctxErr, w, h, ew, eh, animId;
    let lastDraw = 0;
    const FPS = 1000 / 60;

    function resize() {
        if (!dom.bpmChart?.parentElement) return;
        const dpr = window.devicePixelRatio || 1;
        const p1 = dom.bpmChart.parentElement;
        const p2 = dom.errorBar.parentElement;
        w = p1.clientWidth; h = p1.clientHeight;
        ew = p2.clientWidth; eh = p2.clientHeight;
        
        dom.bpmChart.width = w * dpr; dom.bpmChart.height = h * dpr;
        ctxChart = dom.bpmChart.getContext('2d', { alpha: false });
        ctxChart.scale(dpr, dpr);
        
        dom.errorBar.width = ew * dpr; dom.errorBar.height = eh * dpr;
        ctxErr = dom.errorBar.getContext('2d', { alpha: true });
        ctxErr.scale(dpr, dpr);
    }
    
    let resizeTimeout;
    window.addEventListener('resize', () => { clearTimeout(resizeTimeout); resizeTimeout = setTimeout(resize, 100); });
    setTimeout(resize, 0);

    function updateLimitUI(type) {
        document.querySelectorAll('#limit-controls button').forEach(b => {
            const active = b.dataset.limit === type;
            b.className = active 
                ? "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase bg-indigo-500 text-white shadow-lg transform scale-105 transition-all" 
                : "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase text-gray-500 hover:text-white hover:bg-white/5 transition-all";
        });
        dom.limitVal.disabled = type === 'none';
        dom.limitVal.placeholder = type === 'none' ? '-' : '0';
        dom.limitVal.classList.toggle('opacity-50', type === 'none');
        dom.limitVal.classList.toggle('cursor-not-allowed', type === 'none');
        if (type !== 'none') dom.limitVal.focus();
        state.settings.mode = type;
    }

    function toggleMode() {
        state.inputMode = state.inputMode === 'keyboard' ? 'mouse' : 'keyboard';
        const isMouse = state.inputMode === 'mouse';
        dom.modeIcon.className = isMouse ? "fas fa-mouse" : "fas fa-keyboard";
        dom.modeText.innerText = isMouse ? "Mouse" : "Keyboard";
        dom.visuals.k1.innerText = isMouse ? "LMB" : state.keyNames.k1;
        dom.visuals.k2.innerText = isMouse ? "RMB" : state.keyNames.k2;
        Object.values(dom.binds).forEach(el => el.style.display = isMouse ? 'none' : 'block');
    }

    function toggleTest() {
        state.isTesting = !state.isTesting;
        if (state.isTesting) {
            const val = parseInt(dom.limitVal.value);
            state.settings.value = (isNaN(val) || val <= 0) ? 0 : val;
            reset();
            dom.btnStart.className = "bg-red-500 hover:bg-red-400 text-black px-8 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transform hover:scale-105 active:scale-95";
            dom.btnStart.innerHTML = '<i class="fas fa-stop mr-2"></i><span>STOP</span>';
            dom.btnDownload.disabled = true;
            state.beginTime = performance.now();
            loop(0);
        } else {
            dom.btnStart.className = "bg-green-500 hover:bg-green-400 text-black px-8 py-2 rounded-lg transition-all text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transform hover:scale-105 active:scale-95";
            dom.btnStart.innerHTML = '<i class="fas fa-play mr-2"></i><span>START</span>';
            state.beginTime = -1;
            dom.btnDownload.disabled = state.fullHistory.length === 0;
            drawFinal();
            cancelAnimationFrame(animId);
        }
    }

    function reset() {
        state.clickTimes = []; state.chartData = []; state.hitErrors = []; state.liveHitErrors = [];
        state.counts = { k1: 0, k2: 0 }; state.keyStates = {}; state.fullHistory = [];
        dom.bpmVal.innerText = "0"; dom.urVal.innerText = "0.00"; dom.timeVal.innerText = "0.000 s";
        dom.counts.k1.innerText = "0"; dom.counts.k2.innerText = "0";
        dom.history.innerHTML = `<div id="history-placeholder" class="text-center text-xs text-gray-600 italic py-10">Waiting for input...</div>`;
        if (ctxChart) ctxChart.clearRect(0, 0, w, h);
        if (ctxErr) ctxErr.clearRect(0, 0, ew, eh);
    }

    function input(type, isDown) {
        if (!state.isTesting) {
            if (!isDown) dom.visuals[type].classList.remove('active');
            return;
        }
        const now = performance.now();
        if (isDown) {
            if (state.keyStates[type]) return;
            state.keyStates[type] = now;
            state.counts[type]++;
            dom.counts[type].innerText = state.counts[type];
            dom.visuals[type].classList.add('active');
            state.clickTimes.push(now);
            const ph = document.getElementById('history-placeholder');
            if (ph) ph.remove();
            calcStats(now);
            checkLimits(now);
        } else {
            const start = state.keyStates[type];
            if (start) {
                const dur = now - start;
                const label = type === 'k1' ? (state.inputMode === 'mouse' ? 'LMB' : state.keyNames.k1) : (state.inputMode === 'mouse' ? 'RMB' : state.keyNames.k2);
                state.fullHistory.push({ key: label, time: (start - state.beginTime).toFixed(2), dur: dur.toFixed(1) });
                addHistoryRow(type, dur, label);
                delete state.keyStates[type];
            }
            dom.visuals[type].classList.remove('active');
        }
    }

    function addHistoryRow(type, dur, label) {
        if (dom.history.children.length > 30) dom.history.lastElementChild.remove();
        const row = document.createElement('div');
        row.className = "flex items-center gap-3 bg-white/5 px-3 py-2 rounded-lg border border-white/5";
        const color = type === 'k1' ? 'text-indigo-400' : 'text-fuchsia-400';
        const bg = type === 'k1' ? 'bg-indigo-500' : 'bg-fuchsia-500';
        row.innerHTML = `<div class="w-8 text-xs font-bold ${color}">${label}</div><div class="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden"><div class="h-full ${bg} rounded-full" style="width: ${Math.min((dur/150)*100, 100)}%"></div></div><div class="w-12 text-right text-xs font-mono text-gray-400">${Math.round(dur)}ms</div>`;
        dom.history.prepend(row);
    }

    function calcStats(now) {
        const ct = state.clickTimes;
        if (ct.length < 2) return;
        const recent = ct.slice(-12);
        if (recent.length > 1) {
            let sum = 0;
            for(let i=1; i<recent.length; i++) sum += recent[i] - recent[i-1];
            const bpm = Math.round(15000 / (sum / (recent.length - 1)));
            dom.bpmVal.innerText = bpm;
            state.chartData.push(bpm);
            if (state.chartData.length > 100) state.chartData.shift();
        }
        if (ct.length % 5 === 0 || ct.length < 50) {
            let intervals = [];
            for (let i = 1; i < ct.length; i++) intervals.push(ct[i] - ct[i-1]);
            const avg = intervals.reduce((a,b)=>a+b,0) / intervals.length;
            const variance = intervals.reduce((a,b)=>a+Math.pow(b-avg,2),0) / intervals.length;
            const ur = Math.sqrt(variance) * 10;
            dom.urVal.innerText = isNaN(ur) ? "0.00" : ur.toFixed(2);
            const err = (ct[ct.length-1] - ct[ct.length-2]) - avg;
            state.hitErrors.push(err);
            state.liveHitErrors.push({ offset: err, time: now });
        }
    }

    function checkLimits(now) {
        if (state.settings.mode === 'clicks' && (state.counts.k1 + state.counts.k2) >= state.settings.value) toggleTest();
        else if (state.settings.mode === 'time' && (now - state.beginTime)/1000 >= state.settings.value) toggleTest();
    }

    function loop(time) {
        if (!state.isTesting) return;
        animId = requestAnimationFrame(loop);
        if (time - lastDraw < FPS) return;
        const now = performance.now();
        dom.timeVal.innerText = ((now - state.beginTime) / 1000).toFixed(3) + " s";
        if (w && ctxChart && state.chartData.length > 1) {
            ctxChart.clearRect(0, 0, w, h);
            ctxChart.beginPath(); ctxChart.lineWidth = 1; ctxChart.strokeStyle = '#6366f1';
            let min = Math.min(...state.chartData), max = Math.max(...state.chartData);
            if (max === min) { min-=10; max+=10; }
            const step = w / (state.chartData.length - 1 || 1);
            ctxChart.moveTo(0, h - ((state.chartData[0] - min) / (max-min) * h));
            for (let i = 1; i < state.chartData.length; i++) ctxChart.lineTo(i * step, h - ((state.chartData[i] - min) / (max-min) * h));
            ctxChart.stroke();
        }
        if (ew && ctxErr) {
            ctxErr.clearRect(0, 0, ew, eh);
            ctxErr.fillStyle = 'rgba(255, 255, 255, 0.8)'; ctxErr.fillRect((ew/2)-1, 0, 2, eh);
            while (state.liveHitErrors.length && now - state.liveHitErrors[0].time > 1000) state.liveHitErrors.shift();
            for (const e of state.liveHitErrors) {
                const alpha = 1 - ((now - e.time) / 1000);
                const x = (ew / 2) + (e.offset * 3);
                const abs = Math.abs(e.offset);
                ctxErr.fillStyle = abs < 15 ? `rgba(59, 130, 246, ${alpha})` : abs < 35 ? `rgba(34, 197, 94, ${alpha})` : `rgba(239, 68, 68, ${alpha})`;
                ctxErr.fillRect(x - 1, 5, 2, eh - 10);
            }
        }
        lastDraw = time;
    }

    function drawFinal() {
        if (!ew || !ctxErr) return;
        ctxErr.clearRect(0, 0, ew, eh);
        ctxErr.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctxErr.fillRect((ew/2)-1, 0, 2, eh);
        const errs = state.hitErrors.slice(-200);
        for (const error of errs) {
            const x = (ew / 2) + (error * 3);
            const abs = Math.abs(error);
            ctxErr.fillStyle = abs < 15 ? "rgba(59, 130, 246, 0.6)" : abs < 35 ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)";
            ctxErr.fillRect(x - 1, 5, 2, eh - 10);
        }
    }

    dom.btnStart.addEventListener('click', toggleTest);
    document.getElementById('btn-reset').addEventListener('click', () => { if(state.isTesting) toggleTest(); reset(); });
    document.getElementById('btn-mode').addEventListener('click', toggleMode);
    document.getElementById('limit-controls').addEventListener('click', e => {
        if(e.target.tagName === 'BUTTON') updateLimitUI(e.target.dataset.limit);
    });
    Object.keys(dom.binds).forEach(k => {
        dom.binds[k].addEventListener('click', () => {
            if (state.inputMode === 'mouse') return;
            state.binding = k;
            dom.binds[k].innerText = "...";
            dom.binds[k].classList.add('binding');
        });
    });
    dom.btnDownload.addEventListener('click', () => {
        if (!state.fullHistory.length) return;
        const txt = `MORGUN STREAM TEST\nBPM: ${dom.bpmVal.innerText} | UR: ${dom.urVal.innerText}\n\nKEY\t| TIME\t| HOLD\n` + 
                    state.fullHistory.map(h => `${h.key}\t| ${h.time}\t| ${h.dur}`).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([txt], {type: 'text/plain'}));
        a.download = `stream_test_${Date.now()}.txt`;
        a.click();
    });
    document.addEventListener('keydown', e => {
        if (e.repeat) return;
        if (state.binding && state.inputMode === 'keyboard') {
            e.preventDefault();
            state.keys[state.binding] = e.code;
            const name = e.code.replace(/Key|Digit/, '');
            state.keyNames[state.binding] = name;
            dom.visuals[state.binding].innerText = name;
            dom.binds[state.binding].innerText = "Change Key";
            dom.binds[state.binding].classList.remove('binding');
            state.binding = null;
            return;
        }
        if (state.inputMode === 'keyboard') {
            if (e.code === state.keys.k1) { e.preventDefault(); input('k1', true); }
            else if (e.code === state.keys.k2) { e.preventDefault(); input('k2', true); }
        }
    });
    document.addEventListener('keyup', e => {
        if (state.inputMode === 'keyboard') {
            if (e.code === state.keys.k1) input('k1', false);
            if (e.code === state.keys.k2) input('k2', false);
        }
    });
    document.addEventListener('mousedown', e => {
        if (state.inputMode === 'mouse') {
            if (e.button === 0) input('k1', true);
            if (e.button === 2) input('k2', true);
        }
    });
    document.addEventListener('mouseup', e => {
        if (state.inputMode === 'mouse') {
            if (e.button === 0) input('k1', false);
            if (e.button === 2) input('k2', false);
        }
    });
    document.addEventListener('contextmenu', e => { if (state.inputMode === 'mouse' && state.isTesting) e.preventDefault(); });
})();
