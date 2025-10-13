document.addEventListener('DOMContentLoaded', ()=>{
    const user = window.DailyCommon.requireLogin('login.html');
    if (!user) return;

    const form = document.getElementById('report-form');
    const saveBtn = document.getElementById('save-btn');
    const suggestBtn = document.getElementById('suggest-btn');
    const reportsList = document.getElementById('reports-list');
    const suggestions = document.getElementById('suggestions');

    // show user
    const ua = document.getElementById('user-area');
    if (ua) { ua.style.display=''; ua.innerHTML = `<span style="color:white; margin-right:8px;">${window.DailyCommon.escapeHtml(user.id)}でログイン中</span> <button id="logout-btn" class="secondary-button">ログアウト</button>`; document.getElementById('logout-btn').addEventListener('click', ()=>{ sessionStorage.removeItem('dailyUser'); window.location.href='login.html'; }); }

    // entry type control
    const entrySalesBtn = document.getElementById('entry-sales');
    const entryEventBtn = document.getElementById('entry-event');
    const typeField = document.getElementById('type-field');
    const salesFields = document.getElementById('sales-fields');
    const customersField = document.getElementById('customers-field');
    let currentEntryType = 'sales';

    function setEntryType(t) {
        currentEntryType = t;
        if (t === 'sales') {
            entrySalesBtn.classList.add('active');
            entryEventBtn.classList.remove('active');
            typeField.style.display = 'none';
            salesFields.style.display = '';
            customersField.style.display = '';
        } else {
            entryEventBtn.classList.add('active');
            entrySalesBtn.classList.remove('active');
            typeField.style.display = '';
            salesFields.style.display = 'none';
            customersField.style.display = 'none';
        }
    }
    entrySalesBtn.addEventListener('click', () => setEntryType('sales'));
    entryEventBtn.addEventListener('click', () => setEntryType('event'));
    setEntryType(currentEntryType);

    // populate type select from admin-configurable types (so admin can add tags)
    try {
        const cfg = window.DailyCommon.loadScoreConfig();
        const typeSelect = document.getElementById('type');
        if (typeSelect && cfg && cfg.types) {
            // clear existing options
            typeSelect.innerHTML = '';
            Object.keys(cfg.types).forEach(k => {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = k;
                typeSelect.appendChild(opt);
            });
        }
    } catch(e) { /* ignore */ }

    function loadReports(){ return window.DailyCommon.loadReports(); }
    function saveReports(r){ window.DailyCommon.saveReports(r); }

    function renderReports(){
        const reports = loadReports();
        if (!reports || reports.length === 0) { reportsList.innerHTML = '<p>まだ日報が保存されていません。</p>'; return; }
        reportsList.innerHTML = reports.map((r, idx)=>`<div class="report-card"><div class="report-header"><strong>${window.DailyCommon.escapeHtml(r.store)}</strong> - ${window.DailyCommon.escapeHtml(r.staff)} (${r.date}) <button class="delete-button" onclick="(function(i){ const ev = new Event('deleteReport'); ev.idx = i; document.dispatchEvent(ev); })(${idx})">削除</button></div><div class="report-meta">${window.DailyCommon.escapeHtml(r.area)} / ${window.DailyCommon.escapeHtml(r.type)} / 種別: ${window.DailyCommon.escapeHtml(r.entryType||'')} / 売上: ${r.sales||'-'} / 客数: ${r.customers||'-'} / スコア: ${typeof r.score!=='undefined'?r.score:'-'}</div><div class="report-memo">${window.DailyCommon.escapeHtml(r.memo)}</div></div>`).join('');
    }

    // listen for delegated delete events
    document.addEventListener('deleteReport', function(e){
        const idx = e.idx; const reports = loadReports(); if (!Number.isInteger(idx) || idx<0 || idx>=reports.length) return; if (!confirm('この日報を削除しますか？')) return; reports.splice(idx,1); saveReports(reports); renderReports();
    });

    function computeScore(r){
        const cfg = window.DailyCommon.loadScoreConfig();
        let score = 60; const entry = (r.entryType||'').toString(); const type = (r.type||'').toString(); const memo = (r.memo||'').toString(); const sales = Number(r.sales||0);
        if (entry==='sales'){
            const base = Number(cfg.sales?.base||50); const per = Number(cfg.sales?.per1000||1); const maxAdd = Number(cfg.sales?.maxAdd||40);
            score = base + Math.min(maxAdd, Math.floor(sales/1000)*per);
        } else {
            if (cfg.types && cfg.types[type] !== undefined) score = Number(cfg.types[type]); else score = Number(cfg.types && cfg.types['その他'] ? cfg.types['その他'] : 65);
            const kws = cfg.keywords || [];
            const lower = memo.toLowerCase(); kws.forEach(kw=>{ try{ if (!kw||!kw.k) return; if (lower.includes(kw.k.toString().toLowerCase())) score = Number(score) + Number(kw.delta||0); }catch(e){} });
        }
        if (!Number.isFinite(score)) score = 60; score = Math.max(0, Math.min(100, Math.round(score))); return score;
    }

    saveBtn.addEventListener('click', ()=>{
        const data = new FormData(form);
        const report = { store: data.get('store'), staff: data.get('staff'), area: data.get('area'), entryType: currentEntryType, type: currentEntryType==='sales' ? '売上' : data.get('type'), sales: currentEntryType==='sales' ? data.get('sales') : null, customers: currentEntryType==='sales' ? data.get('customers') : null, memo: data.get('memo'), date: new Date().toLocaleString() };
        report.score = computeScore(report);
        const reports = loadReports(); reports.unshift(report); saveReports(reports); renderReports(); alert('日報を保存しました'); form.reset(); setEntryType('sales');
    });

    // suggestion stub
    suggestBtn.addEventListener('click', ()=>{
        const memo = document.getElementById('memo').value.trim(); if (!memo) { suggestions.innerHTML = '<p class="muted">改善案を生成するにはメモを入力してください。</p>'; return; }
        suggestions.innerHTML = '<p>提案を生成中...</p>'; setTimeout(()=>{ const tips=[]; if (memo.match(/クレーム|怒|不満/)) { tips.push('クレーム対応を実施'); } if (memo.match(/故障|壊|トラブル/)) { tips.push('設備点検を実施'); } if (memo.match(/賛辞|褒め|感謝/)) { tips.push('成功事例として共有'); } if (tips.length===0) tips.push('原因・対応策を明記してください'); suggestions.innerHTML = '<ul>'+tips.map(t=>`<li>${t}</li>`).join('')+'</ul>'; },700);
    });

    // initial render
    renderReports();
});
