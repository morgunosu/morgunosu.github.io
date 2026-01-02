const Utils = {
    getAccColor: (a) => a >= 99 ? 'text-[#22c55e]' : a >= 97 ? 'text-[#8fbfff]' : a >= 94 ? 'text-[#ffcc22]' : 'text-[#ff4444]',
    
    getRelativeTime: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        if (isNaN(diff)) return "";
        if (diff < 60) return 'just now';
        const min = Math.floor(diff / 60);
        if (min < 60) return `${min}m ago`;
        const h = Math.floor(min / 60);
        if (h < 24) return `${h}h ago`;
        const d = Math.floor(h / 24);
        return `${d}d ago`;
    },

    calculateMapStats: (b, mods) => {
        let cs = b.cs, ar = b.ar, od = b.od, hp = b.hp, bpm = b.bpm, len = b.length;
        if (mods.includes('HR')) { cs = Math.min(10, cs * 1.3); ar = Math.min(10, ar * 1.4); od = Math.min(10, od * 1.4); hp = Math.min(10, hp * 1.4); }
        else if (mods.includes('EZ')) { cs *= 0.5; ar *= 0.5; od *= 0.5; hp *= 0.5; }
        if (mods.includes('DT') || mods.includes('NC')) { bpm *= 1.5; len /= 1.5; ar = ar > 5 ? Math.min(11, ar + (11 - ar)/1.5) : Math.min(10, ar + 2); od = Math.min(11, od + (11 - od)/1.5); } 
        else if (mods.includes('HT')) { bpm *= 0.75; len /= 0.75; ar = ar > 5 ? ar - (ar - 5)/1.5 : ar - 2; od = Math.max(0, od - 2); }
        const m = Math.floor(len/60);
        const ss = Math.floor(len%60).toString().padStart(2,'0');
        return { cs, ar, od, hp, bpm, time: `${m}:${ss}` };
    },

    formatNumber: (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
};
