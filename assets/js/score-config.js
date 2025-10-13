// score-config page logic (moved from inline HTML). Uses DailyCommon for defaults and persistence
(function(){
    'use strict';

    // basic auth check - allow only admin
    try {
        const u = JSON.parse(sessionStorage.getItem('dailyUser'));
        if (!u || !u.id) {
            window.location.href='login.html';
        }
        if (String(u.id).toLowerCase() !== 'admin') {
            alert('管理者のみアクセス可能です');
            window.location.href = 'reports.html';
        }
    } catch(e){ window.location.href='login.html'; }

    function loadConfig(){
        // prefer DailyCommon.loadScoreConfig if available
        if (window.DailyCommon && typeof window.DailyCommon.loadScoreConfig === 'function') return window.DailyCommon.loadScoreConfig();
        // fallback: localStorage or built-in defaults
        try { return JSON.parse(localStorage.getItem('scoreConfig') || JSON.stringify(window.DailyCommon && window.DailyCommon.defaultScoreConfig ? window.DailyCommon.defaultScoreConfig : { sales:{base:50,per1000:1,maxAdd:40}, types:{}, keywords:[] })); } catch(e) { return window.DailyCommon && window.DailyCommon.defaultScoreConfig ? window.DailyCommon.defaultScoreConfig : { sales:{base:50,per1000:1,maxAdd:40}, types:{}, keywords:[] } }
    }
    function saveConfig(c){
        if (window.DailyCommon && typeof window.DailyCommon.saveReports !== 'undefined') {
            // save via localStorage directly
            try { localStorage.setItem('scoreConfig', JSON.stringify(c)); } catch(e){}
        } else {
            try { localStorage.setItem('scoreConfig', JSON.stringify(c)); } catch(e){}
        }
    }

    function renderTypeRows(types){ const container = document.getElementById('type-rows'); container.innerHTML=''; Object.entries(types).forEach(([k,v],i)=>{
            const row = document.createElement('div'); row.className='form-group';
            row.innerHTML = `<input class="type-key" value="${k}" style="margin-right:8px;" /> <input class="type-score" type="number" value="${v}" style="width:120px;" /> <button class="secondary-button remove-type">削除</button>`;
            container.appendChild(row);
        });
    }

    function renderKwRows(kws){ const container = document.getElementById('kw-rows'); container.innerHTML=''; (kws||[]).forEach((it, i)=>{
            const row = document.createElement('div'); row.className='form-group';
            row.innerHTML = `<input class="kw-key" value="${it.k}" style="margin-right:8px;" /> <input class="kw-delta" type="number" value="${it.delta}" style="width:80px;" /> <button class="secondary-button remove-kw">削除</button>`;
            container.appendChild(row);
        }); }

    function init(){ const cfg = loadConfig(); document.getElementById('sales-base').value = cfg.sales.base; document.getElementById('sales-per-1000').value = cfg.sales.per1000; document.getElementById('sales-max-add').value = cfg.sales.maxAdd; renderTypeRows(cfg.types); renderKwRows(cfg.keywords); }

    document.getElementById('add-type').addEventListener('click', ()=>{ const container = document.getElementById('type-rows'); const row = document.createElement('div'); row.className='form-group'; row.innerHTML = `<input class="type-key" placeholder="種別名" style="margin-right:8px;" /> <input class="type-score" type="number" value="50" style="width:120px;" /> <button class="secondary-button remove-type">削除</button>`; container.appendChild(row); });

    document.getElementById('add-kw').addEventListener('click', ()=>{ const container = document.getElementById('kw-rows'); const row = document.createElement('div'); row.className='form-group'; row.innerHTML = `<input class="kw-key" placeholder="キーワード" style="margin-right:8px;" /> <input class="kw-delta" type="number" value="0" style="width:80px;" /> <button class="secondary-button remove-kw">削除</button>`; container.appendChild(row); });

    document.addEventListener('click', (e)=>{
            if (e.target && e.target.classList && e.target.classList.contains('remove-type')) { e.target.parentElement.remove(); }
            if (e.target && e.target.classList && e.target.classList.contains('remove-kw')) { e.target.parentElement.remove(); }
        });

    document.getElementById('save-config').addEventListener('click', ()=>{
            const sales = { base: Number(document.getElementById('sales-base').value||0), per1000: Number(document.getElementById('sales-per-1000').value||0), maxAdd: Number(document.getElementById('sales-max-add').value||0) };
            const types = {};
            document.querySelectorAll('#type-rows .form-group').forEach(g=>{ const key = g.querySelector('.type-key').value.trim(); const val = Number(g.querySelector('.type-score').value||0); if (key) types[key]=val; });
            const kws = [];
            document.querySelectorAll('#kw-rows .form-group').forEach(g=>{ const key = g.querySelector('.kw-key').value.trim(); const val = Number(g.querySelector('.kw-delta').value||0); if (key) kws.push({k:key, delta: val}); });
            const cfg = { sales, types, keywords: kws };
            saveConfig(cfg);
            alert('スコア設定を保存しました');
        });

    document.getElementById('reset-config').addEventListener('click', ()=>{
        if (!confirm('デフォルト設定に戻しますか？')) return;
        if (window.DailyCommon && typeof window.DailyCommon.resetScoreConfig === 'function') {
            window.DailyCommon.resetScoreConfig();
        } else {
            try { localStorage.removeItem('scoreConfig'); } catch(e){}
        }
        init();
        alert('デフォルトに戻しました');
    });

    // initialize
    init();
})();
