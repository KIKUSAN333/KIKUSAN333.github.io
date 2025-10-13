// common helpers for the 日報 system
(function(window){
    'use strict';

    function loadReports(){
        try {
            const raw = JSON.parse(localStorage.getItem('dailyReports')||'[]');
            let changed = false;
            const normalized = (raw || []).map(r => {
                if (!r) return r;
                const out = Object.assign({}, r);
                if (out.score !== undefined && out.score !== null) {
                    const s = Number(out.score);
                    const clamped = Math.max(0, Math.min(100, Math.round(isFinite(s) ? s : 0)));
                    if (clamped !== out.score) { out.score = clamped; changed = true; }
                }
                return out;
            });
            if (changed) {
                try { localStorage.setItem('dailyReports', JSON.stringify(normalized)); } catch(e){}
            }
            return normalized;
        } catch(e){ return []; }
    }

    function saveReports(reports){
        try { localStorage.setItem('dailyReports', JSON.stringify(reports)); }
        catch(e){}
    }

    // Load reports without clamping/normalization — preserves negative scores
    function loadRawReports(){
        try {
            const raw = JSON.parse(localStorage.getItem('dailyReports')||'[]');
            return (raw || []).map(r => {
                if (!r) return r;
                const out = Object.assign({}, r);
                if (out.score !== undefined && out.score !== null) {
                    out.score = Number(out.score) || 0;
                }
                return out;
            });
        } catch(e){ return []; }
    }

    function escapeHtml(text){ if (!text) return ''; return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function getCurrentUser(){
        try { return JSON.parse(sessionStorage.getItem('dailyUser')) || null; } catch(e){ return null; }
    }

    function requireLogin(redirectTo='login.html'){
        const u = getCurrentUser();
        if (!u || !u.id) {
            window.location.href = redirectTo;
            return null;
        }
        return u;
    }

    // Central default config for scores. Exported via DailyCommon.defaultScoreConfig
    const DEFAULT_SCORE_CONFIG = {
        sales: { base:50, per1000:1, maxAdd:40 },
        types: { '事故':-5,'故障':-5,'クレーム':-10,'賛辞':10,'その他':0 },
        keywords: [ {k:'クレーム', delta:-10}, {k:'賛辞', delta:10} ]
    };

    // Simple deep-merge: returns a new object merging source onto target
    function mergeDeep(target, source){
        if (!source) return JSON.parse(JSON.stringify(target));
        const out = Array.isArray(target) ? target.slice() : Object.assign({}, target || {});
        Object.keys(source).forEach(key => {
            const sval = source[key];
            const tval = target ? target[key] : undefined;
            if (sval && typeof sval === 'object' && !Array.isArray(sval)) {
                out[key] = mergeDeep(tval || {}, sval);
            } else {
                out[key] = sval;
            }
        });
        return out;
    }

    function loadScoreConfig(){
        // Use a deep merge so partial stored objects don't wipe nested defaults
        try {
            const stored = JSON.parse(localStorage.getItem('scoreConfig') || 'null');
            if (stored) return mergeDeep(DEFAULT_SCORE_CONFIG, stored);
        } catch(e){}
        // Return a fresh copy so callers can mutate without changing the constant
        return mergeDeep(DEFAULT_SCORE_CONFIG, null);
    }

    function resetScoreConfig(){
        try { localStorage.removeItem('scoreConfig'); } catch(e){}
    }

    window.DailyCommon = { loadReports, loadRawReports, saveReports, escapeHtml, getCurrentUser, requireLogin, loadScoreConfig, resetScoreConfig, defaultScoreConfig: DEFAULT_SCORE_CONFIG };
})(window);
