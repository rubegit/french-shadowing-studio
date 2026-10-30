
  /* ============================================================================
     ĐỔI GIAO DIỆN LUYỆN TẬP (Mặc định / Shadowing / Chép chính tả) + CHÉP CHÍNH TẢ
     Dùng chung dữ liệu có sẵn của app: sentences, currentSentenceIndex, ytPlayer,
     isPlayerReady, isTextMode, settings, seekToTime(), setRate(), calculateEffectiveEndTime()...
     ============================================================================ */
  (function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const toast = (m) => { try { showVocabToast(m, false); } catch (e) {} };
    const PREF_KEY = 'shadowing_dictation_prefs_v1';
    const PROG_KEY = 'shadowing_dictation_progress_v1';
    const VIEW_NAMES = { 'default': 'Mặc định', shadowing: 'Shadowing', dictation: 'Chép chính tả' };
    const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5];

    let view = 'default';

    function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
    function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

    const prefs = Object.assign({ level: 'hard', autoplay: true }, readJSON(PREF_KEY) || {});
    if (prefs.level !== 'easy') prefs.level = 'hard';   // mặc định "Nghe thuần"; chỉ khi người dùng từng tự bấm "Có gợi ý" (đã lưu) thì lần sau mới vào lại chế độ đó
    prefs.autoplay = true;   // nút "Tự phát" đã bỏ khỏi giao diện Chép chính tả: luôn tự phát khi sang câu mới
    function savePrefs() { writeJSON(PREF_KEY, { level: prefs.level, autoplay: prefs.autoplay, side: prefs.side }); }

    /* ====================== BỘ CHUYỂN GIAO DIỆN ====================== */
    function menuOpen() { return !$('pv-menu').classList.contains('pv-x'); }
    function closeMenu() { $('pv-menu').classList.add('pv-x'); $('pv-switch-btn').setAttribute('aria-expanded', 'false'); }
    // Header của phòng luyện tập cuộn ngang trên điện thoại/iPad (<1024px) và CẮT mọi thứ thò ra ngoài nó,
    // nên menu thả xuống phải dùng position:fixed + toạ độ tính theo nút bấm thì mới hiện ra được.
    window.pvPlaceFloating = function (pop, anchor, align) {
        if (!pop || !anchor) return;
        const _hdrEl = anchor.closest('header');
        const _floating = window.matchMedia('(max-width: 1023px), (orientation: portrait) and (max-width: 1100px)').matches || !!(_hdrEl && _hdrEl.classList.contains('hdr-overflow'));
        if (!_floating) {
            if (pop._pvHome && pop.parentNode === document.body) {   // màn hình lớn: trả popup về chỗ cũ trong header
                if (pop._pvNext && pop._pvNext.parentNode === pop._pvHome) pop._pvHome.insertBefore(pop, pop._pvNext); else pop._pvHome.appendChild(pop);
            }
            pop.classList.remove('pv-fixed');
            pop.style.top = ''; pop.style.left = ''; pop.style.right = '';
            return;
        }
        // iOS (Safari / Brave đều dùng WebKit): phần tử position:fixed nằm TRONG header đang cuộn ngang (overflow-x:auto +
        // -webkit-overflow-scrolling:touch) vẫn bị header cắt mất -> menu không hiện. Chuyển thẳng ra <body> để không còn bị cắt.
        if (!pop._pvHome) { pop._pvHome = pop.parentNode; pop._pvNext = pop.nextSibling; }
        if (pop.parentNode !== document.body) document.body.appendChild(pop);
        const hdr = anchor.closest('header'), ar = anchor.getBoundingClientRect();
        const vw = window.innerWidth, w = Math.min(pop.offsetWidth || 326, vw - 20);
        let left = align === 'right' ? ar.right - w : ar.left;
        left = Math.max(10, Math.min(left, vw - w - 10));
        const top = Math.round((hdr ? hdr.getBoundingClientRect().bottom : ar.bottom) + 8);
        pop.classList.add('pv-fixed');
        pop.style.top = top + 'px'; pop.style.left = left + 'px'; pop.style.right = 'auto';
    };
    window.pvToggleMenu = function (e) {
        if (e) e.stopPropagation();
        const open = !menuOpen();
        $('pv-menu').classList.toggle('pv-x', !open);
        $('pv-switch-btn').setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) window.pvPlaceFloating($('pv-menu'), $('pv-switch-btn'), 'left');
    };
    // Đang mở menu mà xoay màn hình / vuốt header -> đóng lại cho khỏi lệch chỗ
    window.addEventListener('resize', () => { if (menuOpen()) closeMenu(); });
    window.addEventListener('orientationchange', () => { if (menuOpen()) closeMenu(); });
    (function () { const h = document.querySelector('#screen-practice header'); if (h) h.addEventListener('scroll', () => { if (menuOpen()) closeMenu(); }, { passive: true }); })();
    const pvOutside = (e) => {
        if (menuOpen() && !$('pv-switch').contains(e.target) && !$('pv-menu').contains(e.target)) closeMenu();
        const pop = $('dc-pop');
        if (pop && !pop.classList.contains('pv-x') && !pop.contains(e.target) && !$('dc-count').contains(e.target)) closePop();
    };
    document.addEventListener('mousedown', pvOutside);
    document.addEventListener('touchstart', pvOutside, { passive: true });   // iOS Safari: chạm vào vùng trống không sinh mousedown
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (menuOpen()) { closeMenu(); e.stopPropagation(); return; }
        const pop = $('dc-pop');
        if (pop && !pop.classList.contains('pv-x')) { closePop(); e.stopPropagation(); }
    }, true);

    // Phím tắt của giao diện Mặc định (Space, phím số, F, B...) phải tắt khi đang ở giao diện khác
    window.pvBlocksHotkeys = function () {
        const sp = $('screen-practice');
        return view !== 'default' && sp && !sp.classList.contains('hidden');
    };

    function applyView(v) {
        const prev = view;
        view = v;
        const def = $('pv-default');
        def.classList.toggle('pv-offscreen', v !== 'default');
        try { def.inert = (v !== 'default'); } catch (e) {}
        def.setAttribute('aria-hidden', v !== 'default' ? 'true' : 'false');
        $('practice-header-tools').classList.toggle('pv-tools-hidden', v !== 'default');
        $('pv-dictation').classList.toggle('pv-x', v !== 'dictation');
        $('pv-shadowing').classList.toggle('pv-x', v !== 'shadowing');
        const ttl = $('pv-header-title');
        if (ttl) { ttl.classList.toggle('pv-x', v === 'default'); ttl.textContent = (typeof currentVideoTitle === 'string' ? currentVideoTitle : '') || ''; }
        document.body.setAttribute('data-pv-view', v);
        $('pv-sw-name').textContent = VIEW_NAMES[v];
        const cur = document.querySelector('.pv-opt[data-v="' + v + '"] .pv-opt-ico');
        if (cur) $('pv-sw-ico').innerHTML = cur.innerHTML;
        document.querySelectorAll('.pv-opt').forEach((b) => {
            const on = b.getAttribute('data-v') === v;
            b.classList.toggle('active', on);
            b.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        try { if (window.__routerSync) window.__routerSync(); } catch (e) {}   // cập nhật link (#/watch/<id>/shadowing ...)
        return prev;
    }

    window.pvGetView = function () { return view; };

    window.pvSetView = function (v, silent) {
        closeMenu();
        if (!VIEW_NAMES[v] || v === view) return;
        const prev = view;
        if (prev === 'dictation') dcLeave();
        if (prev === 'shadowing') shLeave();
        if (prev === 'default') { try { if (window.pvRecLeave) window.pvRecLeave(); } catch (e) {} }
        if (prev === 'default' && !silent) {
            // Rời giao diện Mặc định: dừng video + loop để không phát ngầm
            try { stopSubtitleLoop(); } catch (e) {}
            try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
            try { hideLookupTooltip(); } catch (e) {}
        }
        applyView(v);
        if (v === 'dictation') dcEnter();
        if (v === 'shadowing') shEnter();
    };

    // Gọi mỗi khi mở một video / bài đọc mới: luôn bắt đầu ở giao diện Mặc định
    window.pvReset = function () {
        closeMenu();
        try { if (window.pvRecReset) window.pvRecReset(); } catch (e) {}
        if (view === 'dictation') dcLeave();
        if (view === 'shadowing') shLeave();
        if (view !== 'default') applyView('default');
        else { $('pv-default').classList.remove('pv-offscreen'); }
    };

    /* ====================== CHẤM ĐIỂM: TÁCH TỪ + SO KHỚP ====================== */
    function norm(w) {
        return String(w).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    }
    function stripAccents(s) {
        return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
    }
    function tokenize(text) {
        const out = [];
        String(text || '').split(/\s+/).filter(Boolean).forEach((chunk) => {
            const pieces = chunk.match(/[^\-–—]+[\-–—]*|[\-–—]+/g) || [chunk];
            pieces.forEach((p) => {
                const key = norm(p);
                if (!key) { if (out.length) out[out.length - 1].disp += p; return; }   // dấu câu lẻ: dính vào từ trước
                out.push({ ri: out.length, disp: p, key: key, core: p.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''), glue: /[\-–—]$/.test(p) });
            });
        });
        return out;
    }
    function joinTok(arr) { return arr.map((t, i) => t.disp + (t.glue || i === arr.length - 1 ? '' : ' ')).join(''); }
    function lev(a, b) {
        const m = a.length, n = b.length;
        if (!m) return n; if (!n) return m;
        let prev = new Array(n + 1), cur = new Array(n + 1);
        for (let j = 0; j <= n; j++) prev[j] = j;
        for (let i = 1; i <= m; i++) {
            cur[0] = i;
            for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            const t = prev; prev = cur; cur = t;
        }
        return prev[n];
    }
    function isClose(a, b) {
        if (a !== b && stripAccents(a) === stripAccents(b)) return true;
        const L = Math.max(a.length, b.length), d = lev(a, b);
        return (L >= 4 && d <= 1) || (L >= 8 && d <= 2);
    }
    /* ----- Dạng nói tắt / viết theo cách đọc (wanna, gonna, gotta, outta...) -----
       Phụ đề thường ghi dạng đầy đủ ("want to") trong khi người nói phát âm "wanna" (và ngược lại).
       Nghe thì không thể phân biệt, nên coi các dạng này là ĐÚNG như nhau.
       forms = các cách viết nói tắt (đã bỏ dấu câu, chữ thường); ph = các cụm đầy đủ tương ứng. */
    const COLLOQ = [
        { id: 'tu_as',       forms: ['tas'],                                ph: ['tu as'] },
        { id: 'je_suis',     forms: ['chuis'],                              ph: ['je suis'] },
        { id: 'je_sais_pas', forms: ['chais pas', 'jsais pas', 'sais pas'], ph: ['je ne sais pas'] },
        { id: 'il_y_a',      forms: ['ya', 'y a'],                          ph: ['il y a'] },
        { id: 'petit',       forms: ['ptit'],                               ph: ['petit'] },
        { id: 'monsieur',    forms: ['msieur'],                             ph: ['monsieur'] },
        { id: 'cest_a_dire', forms: ['cad'],                                ph: ["c'est à dire", "c'est-à-dire"] }
    ];
    const COLLOQ_FORM = {};
    COLLOQ.forEach((e) => {
        e.ph = e.ph.map((p) => p.split(' ').map(norm));
        e.forms.forEach((f) => { COLLOQ_FORM[f] = e; });
    });
    // Đưa hai bên về cùng một dạng trước khi so khớp. Chỉ gộp cụm đầy đủ ("want to") thành một từ khi
    // bên kia thật sự có dạng nói tắt ("wanna"), nên chấm điểm các câu bình thường không bị ảnh hưởng.
    function reconcile(R, T) {
        const kr = new Set(R.map((t) => t.key)), kt = new Set(T.map((t) => t.key));
        const strip = (s) => s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        function prep(A, other) {
            // 1) doin' / goin' / nothin' ≡ doing / going / nothing (chỉ khi bên kia không có sẵn đúng dạng đó)
            let out = A.map((t) => {
                if (t.key.length > 2 && /in['’‘]+[^\p{L}\p{N}]*$/u.test(t.disp) && !other.has(t.key)) return Object.assign({}, t, { key: t.key + 'g' });
                return t;
            });
            // 2) mọi cách viết nói tắt của cùng một từ coi như một
            out = out.map((t) => { const e = COLLOQ_FORM[t.key]; return e ? Object.assign({}, t, { key: e.id }) : t; });
            // 3) cụm đầy đủ -> gộp thành một từ nếu bên kia có dạng nói tắt tương ứng
            const apps = COLLOQ.filter((e) => e.forms.some((f) => other.has(f)));
            if (!apps.length) return out;
            const res = []; let i = 0;
            while (i < out.length) {
                let hit = null;
                apps.forEach((e) => e.ph.forEach((ph) => {
                    if ((!hit || ph.length > hit.ph.length) && ph.length <= out.length - i && ph.every((k, j) => out[i + j].key === k)) hit = { e: e, ph: ph };
                }));
                if (!hit) { res.push(out[i++]); continue; }
                const parts = out.slice(i, i + hit.ph.length), last = parts[parts.length - 1];
                const disp = parts.map((p, j) => p.disp + (j < parts.length - 1 && !p.glue ? ' ' : '')).join('');
                res.push({ disp: disp, key: hit.e.id, core: strip(disp), glue: last.glue, span: parts.reduce((a, p) => a + (p.span || 1), 0) });
                i += parts.length;
            }
            return res;
        }
        return { R: prep(R, kt), T: prep(T, kr) };
    }
    // So khớp theo từng từ (LCS): bỏ qua hoa/thường, dấu câu, dấu nháy; từ gõ gần đúng được tính nửa điểm
    function compare(R, T) {
        const n = R.length, m = T.length;
        const dp = Array.from({ length: n + 1 }, () => new Int16Array(m + 1));
        for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
            dp[i][j] = R[i].key === T[j].key ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        let i = 0, j = 0; const ops = [];
        while (i < n && j < m) {
            if (R[i].key === T[j].key) { ops.push({ t: 'ok', r: i, u: j }); i++; j++; }
            else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: 'miss', r: i }); i++; }
            else { ops.push({ t: 'extra', u: j }); j++; }
        }
        while (i < n) ops.push({ t: 'miss', r: i++ });
        while (j < m) ops.push({ t: 'extra', u: j++ });
        const items = []; let k = 0;
        while (k < ops.length) {
            if (ops[k].t === 'ok') { items.push(ops[k]); k++; continue; }
            const dels = [], inss = [];
            while (k < ops.length && ops[k].t !== 'ok') { (ops[k].t === 'miss' ? dels : inss).push(ops[k]); k++; }
            const p = Math.min(dels.length, inss.length);
            for (let q = 0; q < p; q++) items.push({ t: isClose(R[dels[q].r].key, T[inss[q].u].key) ? 'close' : 'wrong', r: dels[q].r, u: inss[q].u });
            for (let q = p; q < dels.length; q++) items.push(dels[q]);
            for (let q = p; q < inss.length; q++) items.push(inss[q]);
        }
        const c = { ok: 0, close: 0, wrong: 0, miss: 0, extra: 0 };
        items.forEach((it) => { c[it.t]++; });
        const acc = n ? (c.ok + 0.5 * c.close) / (n + c.extra) : 0;
        return { items: items, c: c, n: n, acc: acc, perfect: n > 0 && c.ok === n && c.extra === 0 };
    }

    /* ====================== TRẠNG THÁI + LƯU TIẾN ĐỘ ====================== */
    const DC = {
        sel: null, loopOn: false, rangeOn: false, inP: null, outP: null,   // đoạn đang chọn trên dải sóng {a,b} (0..1 của câu) + đang loop đoạn đó
        vid: null, allSig: '', idx: 0, rec: {}, ref: [], checked: false, hints: 0,
        playing: false, timer: null, seg: null, segAt: 0, seen: false, retried: false,
        repeat: false, summary: false, tts: null, ttsStart: 0, ttsDur: 0,
        repeatTimer: null, autoTimer: null, waitTimer: null, waveN: 56, waveK: -1, lastRes: null,
        hwEls: [], hwTimes: null, hwReal: false, hlCur: -1,   // chế độ Có gợi ý: các ô từ gợi ý, mốc thời gian từng từ (karaoke), từ đang tô sáng
        curP: 0,      // tiến độ nghe hiện tại của câu (0..1), cập nhật trong setProgress()
        resumeP: 0    // > 0: đang TẠM DỪNG giữa chừng ở vị trí này -> bấm Play sẽ nghe TIẾP từ đó (không nghe lại từ đầu)
    };
    const sg = (s) => { const t = (s && s.text) || ''; return t.length + ':' + t.slice(0, 10); };
    const allSig = () => (sentences ? sentences.length : 0) + '|' + (sentences && sentences[0] ? sg(sentences[0]) : '');

    function loadAll() { return readJSON(PROG_KEY) || {}; }
    function saveProgress() {
        if (!DC.vid) return;
        const all = loadAll();
        all[DC.vid] = { t: Date.now(), last: DC.idx, r: DC.rec };
        const keys = Object.keys(all);
        if (keys.length > 60) keys.sort((a, b) => (all[a].t || 0) - (all[b].t || 0)).slice(0, keys.length - 60).forEach((k) => { delete all[k]; });
        writeJSON(PROG_KEY, all);
        if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncProgressDebounced === 'function') {
          window.FSS_SUPABASE.syncProgressDebounced(all);
        }
    }
    function loadProgress() {
        DC.vid = currentVideoId; DC.allSig = allSig(); DC.rec = {};
        const saved = loadAll()[DC.vid] || {};
        Object.keys(saved.r || {}).forEach((k) => {
            const i = +k, r = saved.r[k];
            if (sentences[i] && r && r.g === sg(sentences[i])) DC.rec[i] = r;
        });
        DC.idx = Math.min(Math.max(+saved.last || 0, 0), Math.max(sentences.length - 1, 0));
    }
    function statusOf(i) {
        const r = DC.rec[i];
        if (!r) return 'todo';
        if (typeof r.a === 'number') return r.a >= 100 ? 'perfect' : (r.a >= 50 ? 'partial' : 'poor');
        return r.v ? 'revealed' : 'todo';
    }
    function stats() {
        let done = 0, perfect = 0, sum = 0, cnt = 0;
        for (let i = 0; i < sentences.length; i++) {
            const st = statusOf(i);
            if (st !== 'todo') done++;
            if (st === 'perfect') perfect++;
            const r = DC.rec[i]; if (r && typeof r.a === 'number') { sum += r.a; cnt++; }
        }
        return { done: done, perfect: perfect, avg: cnt ? Math.round(sum / cnt) : 0, total: sentences.length };
    }

    /* ====================== TIMESTAMP TỪNG CÂU (dùng chung Chép chính tả + Shadowing) ======================
       Chỉnh thời gian bắt đầu / kết thúc của câu để khắc phục lỗi đọc mất đầu từ hoặc cắt cụt từ cuối.
       Lưu riêng theo từng video, không sửa dữ liệu phụ đề gốc nên giao diện Mặc định không bị ảnh hưởng. */
    const TS_KEY = 'shadowing_timestamp_adjust_v1', TS_STEP = 0.2;
    const TS = { vid: null, sig: '', map: {} };
    const r3 = (x) => Math.round(x * 1000) / 1000;
    const TS_RW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>';
    const TS_FF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>';
    const TS_RS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';
    function tsSync() {
        const sig = allSig();
        if (TS.vid === currentVideoId && TS.sig === sig) return;
        TS.vid = currentVideoId; TS.sig = sig; TS.map = {};
        const saved = ((readJSON(TS_KEY) || {})[TS.vid] || {}).m || {};
        Object.keys(saved).forEach((k) => { const i = +k, r = saved[k]; if (sentences[i] && r && r.g === sg(sentences[i])) TS.map[i] = r; });
    }
    function tsSave() {
        if (!TS.vid) return;
        const all = readJSON(TS_KEY) || {};
        if (Object.keys(TS.map).length) all[TS.vid] = { t: Date.now(), m: TS.map }; else delete all[TS.vid];
        const keys = Object.keys(all);
        if (keys.length > 60) keys.sort((a, b) => (all[a].t || 0) - (all[b].t || 0)).slice(0, keys.length - 60).forEach((k) => { delete all[k]; });
        writeJSON(TS_KEY, all);
    }
    // Mốc gốc của câu (đúng như app đang dùng để cắt âm thanh trước khi chỉnh)
    function tsBase(i) {
        const s = sentences[i], st = s.startTime || 0;
        let en = calculateEffectiveEndTime(i);
        if (!(en > st + 0.2)) en = Math.max(s.endTime || 0, st + 2.5);
        return { s: st, e: en };
    }
    function tsGet(i) {
        tsSync();
        const b = tsBase(i), o = TS.map[i];
        if (!o) return b;
        return { s: typeof o.s === 'number' ? o.s : b.s, e: typeof o.e === 'number' ? o.e : b.e };
    }
    function tsApply(i, s, e) {
        tsSync();
        s = Math.max(0, r3(s)); e = r3(e);
        if (!(e > s + 0.1)) return false;
        const b = tsBase(i);
        if (Math.abs(s - b.s) < 0.0005 && Math.abs(e - b.e) < 0.0005) delete TS.map[i];
        else TS.map[i] = { g: sg(sentences[i]), s: s, e: e };
        tsSave();
        return true;
    }
    function tsFmt(x) {
        const cs = Math.max(0, Math.round(x * 100)), m = Math.floor(cs / 6000), rem = cs % 6000;
        return m + ':' + String(Math.floor(rem / 100)).padStart(2, '0') + '.' + String(rem % 100).padStart(2, '0');
    }
    // Chấp nhận 83.45 | 1:23.45 | 1:23 | 0:01:23.4 | 83,45
    function tsParse(raw) {
        const t = String(raw || '').trim().replace(',', '.').replace(/s$/i, '').trim();
        let m;
        if ((m = t.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/))) return (+m[1]) * 60 + parseFloat(m[2]);
        if ((m = t.match(/^(\d+):(\d{1,2}):(\d{1,2}(?:\.\d+)?)$/))) return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
        if (/^\d*\.?\d+$|^\d+\.$/.test(t)) return parseFloat(t);
        return null;
    }
    function tsMarkup() {
        return '<span class="ts-lbl">Thời gian:</span>' +
            '<button type="button" class="ts-step" data-ts="s-" title="Lùi thời gian bắt đầu 0.2 giây (câu bắt đầu sớm hơn)" aria-label="Lùi thời gian bắt đầu 0.2 giây">' + TS_RW + '</button>' +
            '<input type="text" class="ts-in" data-ts-in="s" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="10" title="Thời gian bắt đầu câu: bấm vào để gõ tay (vd 1:23.45 hoặc 83.45), ↑/↓ chỉnh từng 0.05 giây" aria-label="Thời gian bắt đầu câu">' +
            '<button type="button" class="ts-step" data-ts="s+" title="Tăng thời gian bắt đầu 0.2 giây (câu bắt đầu muộn hơn)" aria-label="Tăng thời gian bắt đầu 0.2 giây">' + TS_FF + '</button>' +
            '<span class="ts-sep">–</span>' +
            '<button type="button" class="ts-step" data-ts="e-" title="Lùi thời gian kết thúc 0.2 giây (câu kết thúc sớm hơn)" aria-label="Lùi thời gian kết thúc 0.2 giây">' + TS_RW + '</button>' +
            '<input type="text" class="ts-in" data-ts-in="e" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="10" title="Thời gian kết thúc câu: bấm vào để gõ tay (vd 1:25.10 hoặc 85.1), ↑/↓ chỉnh từng 0.05 giây" aria-label="Thời gian kết thúc câu">' +
            '<button type="button" class="ts-step" data-ts="e+" title="Tăng thời gian kết thúc 0.2 giây (câu kéo dài thêm)" aria-label="Tăng thời gian kết thúc 0.2 giây">' + TS_FF + '</button>' +
            '<button type="button" class="ts-step ts-reset" data-ts="reset" title="Đưa thời gian bắt đầu và kết thúc về mốc gốc" aria-label="Đặt lại thời gian về mốc gốc">' + TS_RS + '</button>';
    }
    function tsIdx() {
        if (view === 'dictation') return DC.idx;
        if (view === 'shadowing') return SH.idx;
        if (view === 'default' && !isTextMode && sentences && sentences.length) return Math.max(0, Math.min(sentences.length - 1, currentSentenceIndex || 0));
        return -1;
    }
    // Cho code giao diện Mặc định (script bên ngoài) đọc mốc đã chỉnh của câu i: { s, e } hoặc null nếu chưa chỉnh
    window.tsOv = function (i) {
        if (TS.vid !== currentVideoId) tsSync();
        return TS.map[i] || null;
    };
    function tsRefresh() {
        const i = tsIdx();
        if (i < 0 || !sentences[i]) return;
        const t = tsGet(i);
        document.querySelectorAll('.ts-ctl').forEach((ctl) => {
            ctl.classList.toggle('pv-x', !!isTextMode);   // bài văn bản không có mốc thời gian âm thanh
            const a = ctl.querySelector('[data-ts-in="s"]'), b = ctl.querySelector('[data-ts-in="e"]');
            if (a && document.activeElement !== a) a.value = tsFmt(t.s);
            if (b && document.activeElement !== b) b.value = tsFmt(t.e);
            const bs = tsBase(i);
            if (a) a.classList.toggle('mod', Math.abs(t.s - bs.s) > 0.0005);
            if (b) b.classList.toggle('mod', Math.abs(t.e - bs.e) > 0.0005);
            const rb = ctl.querySelector('[data-ts="reset"]');
            if (rb) {
                const hasMod = !!TS.map[i];
                rb.classList.toggle('has-mod', hasMod);
                // Giữ nút luôn tương tác được để người dùng có thể bấm reset/replay mốc gốc bất kỳ lúc nào
                rb.disabled = false;
                rb.style.opacity = hasMod ? '1' : '0.6';
            }
        });
    }
    function tsAfter(i, old) {
        tsRefresh();
        // Vùng highlight lưu theo tỉ lệ (0..1) của câu -> khi đổi mốc bắt đầu/kết thúc phải quy đổi lại để vẫn đúng đoạn âm thanh cũ
        if (old && view === 'dictation' && DC.sel && !isTextMode) {
            const n = tsGet(i), od = old.e - old.s, nd = n.e - n.s;
            if (od > 0 && nd > 0) {
                const cv = (x) => Math.max(0, Math.min(1, (old.s + x * od - n.s) / nd));
                if (DC.inP != null) DC.inP = cv(DC.inP);
                if (DC.outP != null) DC.outP = cv(DC.outP);
                const a = DC.inP == null ? 0 : DC.inP, b = DC.outP == null ? 1 : DC.outP;
                if ((b - a) * nd < DC_MIN_SEC) dcClearSel(); else { dcSyncSel(); dcPlacePop(); }
            }
        }
        // Giao diện Mặc định: phát lại câu từ mốc bắt đầu mới để nghe ngay kết quả (dừng ở mốc kết thúc nếu đang bật "Tự dừng")
        if (view === 'default' && !isTextMode) {
            try { seekToTime(tsGet(i).s, i, true, null, false); } catch (e) {}
            return;
        }
        if (view === 'dictation' && !DC.playing && !DC.tts && !isTextMode) {
            const t = tsGet(i); setDuration(Math.max(0.5, t.e - t.s));
            if (DC.resumeP > 0) { DC.resumeP = 0; setProgress(0); uiPlaying(false); }   // câu đã đổi độ dài -> vị trí tạm dừng cũ không còn đúng
        }
    }
    function tsStep(which, delta) {
        const i = tsIdx(); if (i < 0 || !sentences[i]) return;
        const t = tsGet(i);
        const s = which === 's' ? Math.max(0, t.s + delta) : t.s, e = which === 'e' ? t.e + delta : t.e;
        if (!tsApply(i, s, e)) { toast('Thời gian kết thúc phải sau thời gian bắt đầu'); return; }
        tsAfter(i, { s: t.s, e: t.e });
    }
    function tsReset() {
        const i = tsIdx(); if (i < 0 || !sentences[i]) return;
        tsSync();
        if (!TS.map[i]) {
            // Dù chưa có map override, phát lại câu từ mốc gốc để người dùng nghe lại
            if (view === 'default' && !isTextMode) {
                try { seekToTime(tsBase(i).s, i, true, null, false); } catch (e) {}
            }
            toast('Thời gian câu đang ở mốc gốc');
            return;
        }
        const t0 = tsGet(i); delete TS.map[i]; tsSave(); tsAfter(i, { s: t0.s, e: t0.e });
        toast('Đã đưa thời gian về mốc gốc');
    }
    function tsCommit(inp) {
        const i = tsIdx(); if (i < 0 || !sentences[i]) return;
        const which = inp.getAttribute('data-ts-in'), t = tsGet(i), cur = which === 's' ? t.s : t.e;
        if (inp.value.trim() === tsFmt(cur)) return;   // không đổi gì thì giữ nguyên mốc gốc (tránh làm tròn)
        const bad = (msg) => { if (msg) toast(msg); inp.classList.add('invalid'); setTimeout(() => inp.classList.remove('invalid'), 700); inp.value = tsFmt(cur); };
        const v = tsParse(inp.value);
        if (v === null) { bad('Gõ thời gian dạng 83.45 hoặc 1:23.45'); return; }
        if (!tsApply(i, which === 's' ? v : t.s, which === 'e' ? v : t.e)) { bad('Thời gian kết thúc phải sau thời gian bắt đầu'); return; }
        tsAfter(i, { s: t.s, e: t.e });
    }
    document.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('button[data-ts]'); if (!b) return;
        e.preventDefault();
        if (view === 'default') { try { b.blur(); } catch (er) {} }   // giao diện Mặc định có phím tắt (Space...) nên không để nút giữ focus
        const k = b.getAttribute('data-ts');
        if (k === 's-') tsStep('s', -TS_STEP); else if (k === 's+') tsStep('s', TS_STEP); else if (k === 'e-') tsStep('e', -TS_STEP); else if (k === 'e+') tsStep('e', TS_STEP); else if (k === 'reset') tsReset();
    });
    document.addEventListener('change', (e) => { const el = e.target; if (el && el.matches && el.matches('input[data-ts-in]')) tsCommit(el); });
    document.addEventListener('focusin', (e) => { const el = e.target; if (el && el.matches && el.matches('input[data-ts-in]')) el.select(); });
    document.addEventListener('keydown', (e) => {
        const el = e.target; if (!el || !el.matches || !el.matches('input[data-ts-in]')) return;
        if (e.key === 'Enter') { e.preventDefault(); tsCommit(el); el.blur(); }
        else if (e.key === 'Escape') { e.preventDefault(); const i = tsIdx(), t = i >= 0 ? tsGet(i) : null; if (t) el.value = tsFmt(el.getAttribute('data-ts-in') === 's' ? t.s : t.e); el.blur(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const i = tsIdx(); if (i < 0) return;
            tsCommit(el);
            tsStep(el.getAttribute('data-ts-in'), e.key === 'ArrowUp' ? 0.05 : -0.05);
            el.select();
        }
    });

    /* ====================== ÂM THANH ====================== */
    const fmt = (s) => { s = Math.max(0, s || 0); return Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0'); };
    function waveHeights(str, n) {
        let h = 2166136261;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
        let x = h >>> 0; const out = [];
        for (let i = 0; i < n; i++) {
            x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
            const env = 0.4 + 0.6 * Math.sin(Math.PI * (i + 0.5) / n);
            out.push(Math.round(6 + ((x % 1000) / 1000) * 28 * env));
        }
        return out;
    }
    // Số thanh sóng tự co giãn theo bề rộng thực tế (~11px / thanh) để không bị tràn khỏi thẻ trên màn hình hẹp
    function waveCountFor(w) { return w > 0 ? Math.max(24, Math.min(90, Math.floor((w + 3) / 11))) : DC.waveN; }
    function buildWave(text) {
        DC.waveN = waveCountFor($('dc-wave').clientWidth);
        const hs = waveHeights(text || '', DC.waveN);
        $('dc-wave').innerHTML = hs.map((h) => '<b style="--h:' + h + 'px"></b>').join('');
        DC.waveK = -1;
    }
    function setProgress(p) {
        p = Math.max(0, Math.min(1, p || 0));
        DC.curP = p;
        const k = Math.round(p * DC.waveN);
        if (k !== DC.waveK) {
            DC.waveK = k;
            const bars = $('dc-wave').children;
            for (let i = 0; i < bars.length; i++) bars[i].classList.toggle('on', i < k);
        }
        const dur = DC.durSec || 0;
        $('dc-t-cur').textContent = fmt(dur * p);
        dcKaraokeP(p);
    }
    function setDuration(sec) { DC.durSec = sec; $('dc-t-dur').textContent = fmt(sec); }
    function uiPlaying(on) {
        const b = $('dc-play');
        b.classList.toggle('on', !!on);
        b.title = on ? 'Tạm dừng' : (DC.resumeP > 0 ? 'Phát tiếp' : (DC.sel ? 'Nghe đoạn đã chọn' : 'Nghe câu này'));
        b.setAttribute('aria-label', b.title);
    }
    function stopAudio(resetUI) {
        DC.resumeP = 0;   // mọi cách dừng thông thường (đổi câu, kiểm tra, rời giao diện...) đều xoá vị trí nghe tiếp; chỉ pauseAudio() mới đặt lại
        clearInterval(DC.timer); DC.timer = null;
        clearTimeout(DC.repeatTimer); DC.repeatTimer = null;
        if (DC.tts) { DC.tts = null; try { speechSynthesis.cancel(); } catch (e) {} }
        else if (!isTextMode && DC.playing) { try { ytPlayer.pauseVideo(); } catch (e) {} }
        DC.playing = false; DC.seg = null;
        if (resetUI !== false) uiPlaying(false);
    }
    function maybeRepeat() {
        if (DC.repeat && !DC.checked && !DC.summary && view === 'dictation') {
            clearTimeout(DC.repeatTimer);
            DC.repeatTimer = setTimeout(() => { if (DC.repeat && !DC.checked && view === 'dictation') play(); }, 1200);
        }
    }
    function finish(natural) {
        try { if (!isTextMode) ytPlayer.pauseVideo(); } catch (e) {}
        clearInterval(DC.timer); DC.timer = null;
        DC.playing = false; DC.seg = null;
        uiPlaying(false);
        if (natural) {
            if (DC.loopOn && DC.sel && !isTextMode) { setProgress(DC.sel.b); dcLoopAgain(); }   // đang loop đoạn chọn: nghe lại đoạn đó
            else if (DC.rangeOn && DC.sel && !isTextMode) setProgress(DC.sel.b);               // nghe hết đoạn In→Out: playhead dừng ở Out
            else { setProgress(1); maybeRepeat(); }
        }
    }
    function tick() {
        if (!DC.seg || !ytPlayer || !ytPlayer.getCurrentTime) return;
        let t; try { t = ytPlayer.getCurrentTime(); } catch (e) { return; }
        const seg = DC.seg, now = Date.now();
        if (!DC.seen) {
            // Chỉ coi là "đã tua tới câu" khi vị trí đã thật sự đổi khỏi vị trí cũ (hoặc vị trí cũ vốn đã gần điểm bắt đầu)
            if (t >= seg.start - 0.35 && t <= seg.end + 0.2 && (Math.abs(t - DC.t0) > 0.05 || Math.abs(seg.start - DC.t0) <= 0.4)) DC.seen = true;
            else if (now - DC.segAt > 2200) {
                if (!DC.retried) { DC.retried = true; DC.segAt = now; try { ytPlayer.seekTo(seg.start, true); ytPlayer.playVideo(); } catch (e) {} }
                else finish(false);
                return;
            } else return;
        }
        setProgress((t - seg.base) / ((seg.full || seg.end) - seg.base));
        dcKaraokeT(t);
        let st = -1; try { st = ytPlayer.getPlayerState(); } catch (e) {}
        if (t >= seg.end - 0.03 || t > seg.end + 1.5 || ((st === 0 || st === 2) && now - DC.segAt > 1200)) finish(true);
    }
    function pickVoice() {
        let vs = []; try { vs = speechSynthesis.getVoices() || []; } catch (e) {}
        const fr = vs.filter((v) => /^fr[-_]/i.test(v.lang));
        return fr.find((v) => /fr[-_]FR/i.test(v.lang) && /Google|Thomas|Amélie|Audrey|Hortense|Natural|Denise|Julie|Pauline/i.test(v.name)) || fr.find((v) => /fr[-_]FR/i.test(v.lang)) || fr[0] || null;
    }
    function speak(text, p0) {
        p0 = Math.max(0, Math.min(0.98, +p0 || 0));   // p0 > 0: đọc tiếp từ giữa câu (bấm vào timeline)
        if (!('speechSynthesis' in window)) { toast('Trình duyệt này không hỗ trợ đọc văn bản'); return; }
        try { speechSynthesis.cancel(); } catch (e) {}
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'fr-FR';
        const v = pickVoice(); if (v) u.voice = v;
        u.rate = Math.max(0.5, Math.min(1.6, (settings && settings.playbackRate) || 1));
        const words = String(text).split(/\s+/).filter(Boolean).length;
        DC.ttsDur = Math.max(1.2, words * 0.4 / u.rate); DC.ttsStart = performance.now();
        setDuration(p0 > 0 ? DC.ttsDur / (1 - p0) : DC.ttsDur);
        const done = (failed) => {
            if (DC.tts !== u) return;
            DC.tts = null; clearInterval(DC.timer); DC.timer = null; DC.playing = false;
            uiPlaying(false);
            if (failed) { setProgress(0); return; }
            setProgress(1); maybeRepeat();
        };
        u.onend = () => done(false); u.onerror = () => done(true);
        DC.tts = u; DC.playing = true; uiPlaying(true); setProgress(p0);
        DC.timer = setInterval(() => { setProgress(p0 + (1 - p0) * Math.min(0.97, (performance.now() - DC.ttsStart) / 1000 / DC.ttsDur)); }, 60);
        speechSynthesis.speak(u);
    }
    // p0 (0..1): phát từ vị trí đó trong câu (bấm vào timeline); mặc định phát từ đầu câu
    function play(p0) {
        const hasP0 = p0 !== undefined && p0 !== null;
        p0 = Math.max(0, Math.min(0.97, +p0 || 0));
        let p1 = 1;   // điểm dừng (0..1) trong câu: mặc định hết câu; đang loop đoạn chọn thì là mép phải của đoạn
        if ((DC.loopOn || DC.rangeOn) && DC.sel && !isTextMode) { p1 = DC.sel.b; if (!hasP0 || p0 < DC.sel.a - 0.001 || p0 >= DC.sel.b) p0 = DC.sel.a; }
        const s = sentences[DC.idx];
        if (!s || view !== 'dictation') return;
        stopAudio(false);
        if (isTextMode) {
            if (p0 > 0) {
                const ws = String(s.text).split(/\s+/).filter(Boolean);
                const k = Math.min(ws.length - 1, Math.floor(p0 * ws.length));
                speak(ws.slice(k).join(' '), k / ws.length);
            } else speak(s.text);
            return;
        }
        if (!ytPlayer || !isPlayerReady || !ytPlayer.seekTo) { uiPlaying(false); toast('Video đang tải, thử lại sau giây lát'); return; }
        const tt = tsGet(DC.idx), start = tt.s, end = tt.e;
        const from = start + p0 * (end - start);
        DC.seg = { start: from, end: start + p1 * (end - start), base: start, full: end }; DC.segAt = Date.now(); DC.seen = false; DC.retried = false;
        // Nhớ vị trí phát TRƯỚC khi tua: sau khi nghe hết câu, video đang dừng ở cuối câu, và tick() có thể đọc lại
        // đúng vị trí cũ đó trước khi lệnh tua kịp thực hiện -> tưởng đã phát hết câu rồi tự pause.
        try { DC.t0 = ytPlayer.getCurrentTime(); } catch (e) { DC.t0 = -1; }
        setDuration(end - start); setProgress(p0);
        try { currentSentenceIndex = DC.idx; seekToTime(from, DC.idx, true, null, false); }
        catch (e) { try { ytPlayer.seekTo(from, true); ytPlayer.playVideo(); } catch (e2) {} }
        DC.playing = true; uiPlaying(true);
        clearInterval(DC.timer); DC.timer = setInterval(tick, 30);
    }
    // Tạm dừng và NHỚ vị trí đang nghe, để bấm Play lần nữa thì nghe tiếp từ đúng chỗ đó
    function pauseAudio() {
        const p = DC.curP || 0;
        stopAudio(true);
        if (p > 0.005 && p < 0.97) { DC.resumeP = p; uiPlaying(false); }   // gần đầu/cuối câu thì coi như chưa nghe -> lần sau phát từ đầu
    }
    // Nút Play đỏ: đang phát -> tạm dừng · đang tạm dừng -> phát tiếp · chưa phát / đã hết câu -> phát từ đầu
    function togglePlay() {
        if (DC.playing) { pauseAudio(); return; }
        DC.rangeOn = !!(DC.sel && !isTextMode);   // đã bôi đen đoạn In→Out thì Play/Pause chỉ chạy trong đoạn đó
        if (DC.resumeP > 0) play(DC.resumeP);
        else play();
    }
    function autoplaySoon() {
        clearTimeout(DC.autoTimer); clearTimeout(DC.waitTimer);
        const myIdx = DC.idx;
        let tries = 0;
        const attempt = () => {
            if (view !== 'dictation' || DC.idx !== myIdx || DC.checked || DC.summary) return;
            if (isTextMode || (ytPlayer && isPlayerReady)) { play(); return; }
            if (++tries < 50) DC.waitTimer = setTimeout(attempt, 300);
        };
        DC.autoTimer = setTimeout(attempt, 180);
    }

    /* ====================== HIỂN THỊ ====================== */
    function renderTop() {
        const total = sentences.length;
        $('dc-count-now').textContent = 'Câu ' + (DC.idx + 1);
        $('dc-count-total').textContent = '/ ' + total;
        $('dc-prev').disabled = DC.idx <= 0;
        $('dc-next').disabled = DC.idx >= total - 1;
        $('dc-tts-tag').classList.toggle('pv-x', !isTextMode);
        document.querySelectorAll('#dc-level button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-l') === prefs.level));
        { const sw = $('dc-hintsw-btn'); if (sw) { const on = prefs.level === 'easy'; sw.classList.toggle('on', on); sw.setAttribute('aria-checked', on ? 'true' : 'false'); } }
        dcSyncRate();
    }
    function renderRibbon() {
        renderSide();
    }
    /* ====================== GỢI Ý (mức \"Có gợi ý\") ======================
       Hiện mỗi từ thành một dãy dấu • (đúng số chữ, KHÔNG lộ chữ cái đầu); từ nào bạn gõ đúng sẽ tự mở.
       Bấm vào một từ = nghe từ từ đó; khi đang phát, từ đang đọc được tô sáng (karaoke, giống Shadowing). */
    function matchedWordIndices() {
        const val = $('dc-input').value, R = DC.ref, T = tokenize(val);
        if (T.length && !/\s$/.test(val)) {
            const last = T[T.length - 1];
            // Nếu từ cuối đang gõ dở và không khớp với bất kỳ từ nào trong câu thì tạm bỏ qua
            if (!R.some((r) => r.key === last.key)) T.pop();
        }
        if (!T.length || !R.length) return new Set();
        const rc = reconcile(R, T);
        let rIdx = 0;
        const rMap = rc.R.map((item) => {
            const span = item.span || 1;
            const start = rIdx;
            rIdx += span;
            return { start: start, end: rIdx };
        });
        const cmp = compare(rc.R, rc.T);
        const okIndices = new Set();
        cmp.items.forEach((it) => {
            if (it.t === 'ok' && rMap[it.r]) {
                for (let i = rMap[it.r].start; i < rMap[it.r].end; i++) okIndices.add(i);
            }
        });
        return okIndices;
    }
    function dcHLset(cur) {
        DC.hlCur = cur;
        const els = DC.hwEls;
        for (let i = 0; i < els.length; i++) els[i].classList.toggle('cur', i === cur);
    }
    // Theo thời gian video (có mốc từng từ)
    function dcKaraokeT(t) {
        if (!DC.hwEls.length || !DC.hwReal || !DC.hwTimes) return;
        let cur = -1;
        for (let i = 0; i < DC.hwTimes.length; i++) if (t >= DC.hwTimes[i][0] - 0.02) cur = i;
        if (cur !== DC.hlCur) dcHLset(cur);
    }
    // Theo tiến độ câu (giọng đọc máy hoặc phụ đề không có mốc từng từ: chia đều theo số từ)
    function dcKaraokeP(p) {
        if (!DC.hwEls.length) return;
        if (p <= 0 || p >= 1) { if (DC.hlCur !== -1) dcHLset(-1); return; }
        if (DC.hwReal && !DC.tts) return;   // đã có mốc thời gian thật: dcKaraokeT lo
        const cur = Math.min(DC.hwEls.length - 1, Math.floor(p * DC.hwEls.length));
        if (cur !== DC.hlCur) dcHLset(cur);
    }
    function renderHint() {
        const el = $('dc-hint');
        if (prefs.level !== 'easy' || DC.checked || DC.summary) { el.classList.add('pv-x'); el.innerHTML = ''; DC.hwEls = []; DC.hlCur = -1; return; }
        el.classList.remove('pv-x');
        const s = sentences[DC.idx] || { text: '' };
        const chunks = String(s.text || '').split(/\s+/).filter(Boolean);
        const okIndices = matchedWordIndices();
        let acc = 0, firstUnmatched = false;
        el.innerHTML = chunks.map((c, i) => {
            const a = acc, b = acc + tokenize(c).length; acc = b;
            const core = c.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || c;
            if (b === a) return '<span class="dc-hw" data-i="' + i + '">' + esc(c) + '</span>';   // chỉ có dấu câu: giữ nguyên
            let isOk = true;
            for (let tIdx = a; tIdx < b; tIdx++) {
                if (!okIndices.has(tIdx)) { isOk = false; break; }
            }
            if (isOk) return '<span class="dc-hw ok" data-i="' + i + '">' + esc(core) + '</span>';
            const isNx = !firstUnmatched;
            firstUnmatched = true;
            return '<span class="dc-hw' + (isNx ? ' nx' : '') + '" data-i="' + i + '">' + '•'.repeat(Math.max(1, Array.from(core).length)) + '</span>';
        }).join('');
        DC.hwEls = Array.from(el.querySelectorAll('.dc-hw'));
        // Mốc thời gian từng từ: chỉ dùng khi số từ trong phụ đề khớp số từ của câu, nếu không thì chia đều
        const ws = s.words;
        DC.hwReal = !isTextMode && Array.isArray(ws) && ws.length === chunks.length && ws.every((w) => typeof w.startTime === 'number');
        DC.hwTimes = DC.hwReal ? ws.map((w) => [w.startTime, w.endTime]) : null;
        if (DC.hlCur >= 0 && DC.hlCur < DC.hwEls.length) DC.hwEls[DC.hlCur].classList.add('cur'); else DC.hlCur = -1;
        dcHintMarkSel();
    }
    // Vị trí [bắt đầu, kết thúc] của từ thứ i theo tỉ lệ 0..1 của câu
    function dcWordFr(i) {
        const n = DC.hwEls.length;
        if (DC.hwReal && DC.hwTimes && DC.hwTimes[i]) {
            const tt = tsGet(DC.idx), d = tt.e - tt.s;
            if (d > 0) {
                const c = (x) => Math.max(0, Math.min(1, x));
                return [c((DC.hwTimes[i][0] - tt.s) / d), c((DC.hwTimes[i][1] - tt.s) / d)];
            }
        }
        return [i / n, (i + 1) / n];
    }
    // Tô các từ nằm trong đoạn đang loop (cùng đoạn với vùng xanh trên dải sóng)
    function dcHintMarkSel() {
        const els = DC.hwEls; if (!els.length) return;
        for (let i = 0; i < els.length; i++) {
            let on = false;
            if (DC.sel) { const f = dcWordFr(i), m = (f[0] + f[1]) / 2; on = m >= DC.sel.a - 1e-6 && m <= DC.sel.b + 1e-6; }
            els[i].classList.toggle('loopsel', on);
        }
    }
    // Bôi đen chữ trong dòng gợi ý -> loop luôn đoạn đó (giống bôi đen trên dải sóng)
    function dcHintSelection() {
        const hint = $('dc-hint');
        if (view !== 'dictation' || isTextMode || DC.summary || DC.checked || hint.classList.contains('pv-x') || !DC.hwEls.length) return;
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed || !sel.toString().trim()) return;
        const range = sel.getRangeAt(0);
        if (!hint.contains(range.commonAncestorContainer)) return;
        let a = -1, b = -1;
        DC.hwEls.forEach((el, i) => { if (range.intersectsNode(el)) { if (a < 0) a = i; b = i; } });
        if (a < 0) return;
        clearTimeout(DC.hwT);   // huỷ lệnh "nghe từ chỗ đó" của lần bấm trước
        try { sel.removeAllRanges(); } catch (e) {}
        if (DC.loopOn) { DC.loopOn = false; clearTimeout(DC.repeatTimer); }
        DC.inP = dcWordFr(a)[0]; DC.outP = dcWordFr(b)[1];
        if ((DC.outP - DC.inP) * (DC.durSec || 0) < DC_MIN_SEC) { dcClearSel(); return; }
        dcSyncSel();
        dcStartLoop();
    }
    // Bấm vào một từ: nghe từ từ đó tới hết câu
    function dcPlayFromWord(i) {
        const n = DC.hwEls.length;
        if (DC.summary || DC.checked || i < 0 || i >= n) return;
        let p0 = i / n;
        if (DC.hwReal && DC.hwTimes && DC.hwTimes[i]) {
            const tt = tsGet(DC.idx), d = tt.e - tt.s;
            if (d > 0) p0 = (DC.hwTimes[i][0] - tt.s) / d;
        }
        DC.rangeOn = false;   // bấm thẳng vào từ = nghe từ chỗ đó tới hết câu
        play(Math.max(0, Math.min(0.97, p0)));
        $('dc-input').focus();
    }
    function hintWord() {
        if (DC.checked || DC.summary) return;
        const inp = $('dc-input'), T = tokenize(inp.value), R = DC.ref;
        let k = 0; while (k < T.length && k < R.length && T[k].key === R[k].key) k++;
        if (k >= R.length) return;
        const keep = T.slice(0, k); keep.push(R[k]);
        inp.value = joinTok(keep) + ' ';
        DC.hints++;
        autoGrow(); renderHint();
        inp.focus(); try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (e) {}
    }
    function autoGrow() {
        const t = $('dc-input'); t.style.height = 'auto';
        t.style.height = Math.max(112, Math.min(t.scrollHeight + 2, 320)) + 'px';
    }
    function resetSentenceState() {
        stopAudio(true);
        try { dcClearSel(); } catch (e) {}
        clearTimeout(DC.autoTimer); clearTimeout(DC.waitTimer);
        const s = sentences[DC.idx] || { text: '' };
        DC.ref = tokenize(s.text); DC.checked = false; DC.hints = 0; DC.lastRes = null; DC.hlCur = -1;
        const inp = $('dc-input'); inp.value = ''; inp.readOnly = false; inp.classList.remove('shake'); autoGrow();
        $('dc-result').classList.add('pv-x');
        try { hideLookupTooltip(); } catch (e) {}
        $('dc-check').textContent = 'Kiểm tra';
        $('dc-hintword').disabled = false;
        if ($('dc-listen-again')) $('dc-listen-again').disabled = false;
        $('dc-type').classList.remove('is-checked');
        buildWave(s.text);
        const tt = isTextMode ? null : tsGet(DC.idx);
        const dur = isTextMode ? Math.max(1.2, DC.ref.length * 0.4) : Math.max(0.5, tt.e - tt.s);
        setDuration(dur); setProgress(0);
        tsRefresh();
    }
    function showBody(on) {
        $('dc-body').classList.toggle('pv-x', !on);
        $('dc-summary').classList.toggle('pv-x', on);
    }
    function renderAll() {
        showBody(!DC.summary);
        renderTop(); renderRibbon(); renderHint();
    }

    /* ====================== CHẤM / ĐÁP ÁN ====================== */
    function wordHTML(cls, tok, extra) { return '<span class="dc-d ' + cls + '"' + (tok.ri != null ? ' data-r="' + tok.ri + '"' : '') + '>' + (extra || '') + esc(tok.disp) + '</span>'; }
    function diffHTML(res, T, Rin) {
        const R = Rin || DC.ref, parts = [];
        res.items.forEach((it) => {
            if (it.t === 'extra') { parts.push({ h: '<span class="dc-d extra">' + esc(T[it.u].disp) + '</span>', g: false }); return; }
            const tok = R[it.r];
            let h;
            if (it.t === 'ok' || it.t === 'miss') h = wordHTML(it.t, tok);
            else h = wordHTML(it.t, tok, '<span class="dc-typed">' + esc(T[it.u].core || T[it.u].disp) + '</span>');
            parts.push({ h: h, g: tok.glue });
        });
        return parts.map((p) => p.h + (p.g ? '' : ' ')).join('');
    }
    function showResult(res, T, reveal) {
        const s = sentences[DC.idx];
        const card = $('dc-result');
        card.classList.remove('pv-x');
        card.classList.toggle('perfect', !!(res && res.perfect));
        const ring = $('dc-ring');
        {
            const pct = Math.round(res.acc * 100);
            ring.className = 'dc-ring';
            ring.style.setProperty('--p', pct);
            ring.style.setProperty('--c', pct >= 90 ? '#22c55e' : (pct >= 50 ? '#f59e0b' : '#ef4444'));
            ring.innerHTML = '<span id="dc-ring-txt">' + pct + '%</span>';
            $('dc-verdict').textContent = res.perfect ? 'Hoàn hảo!' : (pct >= 90 ? 'Rất tốt!' : (pct >= 75 ? 'Khá tốt' : (pct >= 50 ? 'Cần nghe kỹ hơn' : 'Nghe lại và thử nữa nhé')));
            const c = res.c, bits = [c.ok + '/' + res.n + ' từ đúng'];
            if (c.close) bits.push(c.close + ' gần đúng');
            if (c.wrong) bits.push(c.wrong + ' sai');
            if (c.miss) bits.push(c.miss + ' thiếu');
            if (c.extra) bits.push(c.extra + ' thừa');
            if (DC.hints) bits.push('dùng ' + DC.hints + ' gợi ý');
            $('dc-sub').textContent = bits.join(' · ');
            $('dc-diff').innerHTML = diffHTML(res, T, DC.lastR);
            $('dc-res-legend').innerHTML = '<span><i style="background:#22c55e"></i>Đúng</span><span><i style="background:#f59e0b"></i>Gần đúng (gõ sai chính tả)</span><span><i style="background:#ef4444"></i>Sai / thiếu</span><span><i style="background:#64748b"></i>Thừa</span>';
        }
        const vi = s && s.vi && String(s.vi).trim();
        $('dc-trans').classList.toggle('pv-x', !vi);
        $('dc-trans-txt').textContent = vi || '';
        const last = DC.idx >= sentences.length - 1;
        $('dc-next2').firstChild.nodeValue = last ? 'Xem tổng kết ' : 'Câu tiếp theo ';
        vsDcMark();
        try { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
    }
    function joinTokHTML(R) { return R.map((t) => '<span class="dc-d plain"' + (t.ri != null ? ' data-r="' + t.ri + '"' : '') + '>' + esc(t.disp) + '</span>' + (t.glue ? '' : ' ')).join(''); }
    // Đánh dấu nhẹ các từ/cụm đã lưu (từ chính video/bài này) trong phần đáp án chép chính tả
    function vsDcMark() {
        try {
            const box = $('dc-diff'), s = sentences[DC.idx];
            if (!box) return;
            box.querySelectorAll('.dc-d.vs-w').forEach((n) => n.classList.remove('vs-w', 'vs-first', 'vs-last', 'vs-cont'));
            if (!s || !window.vsFlags || !DC.ref) return;
            const fl = window.vsFlags(s, DC.ref.map((t) => t.disp));
            if (!fl) return;
            box.querySelectorAll('.dc-d[data-r]').forEach((n) => { const c = fl[+n.getAttribute('data-r')]; if (c) c.split(' ').forEach((k) => n.classList.add(k)); });
        } catch (e) {}
    }
    window.vsDcRefresh = vsDcMark;

    function lockInput() {
        DC.checked = true;
        stopAudio(true);
        const inp = $('dc-input'); inp.readOnly = true;
        $('dc-check').textContent = 'Câu tiếp theo';
        $('dc-hintword').disabled = true;
        if ($('dc-listen-again')) $('dc-listen-again').disabled = true;
        $('dc-type').classList.add('is-checked');
        renderHint();
        inp.focus();
    }
    function check() {
        if (DC.summary) return;
        if (DC.checked) { next(); return; }
        const raw = $('dc-input').value.trim();   // để trống vẫn chấm: không có từ nào đúng -> 0%, và hiện đáp án
        const rc = reconcile(DC.ref, tokenize(raw)), T = rc.T, res = compare(rc.R, T);
        DC.lastR = rc.R;
        const s = sentences[DC.idx];
        const r = DC.rec[DC.idx] || { g: sg(s), n: 0 };
        r.g = sg(s); r.n = (r.n || 0) + 1;
        r.a = Math.max(typeof r.a === 'number' ? r.a : 0, Math.round(res.acc * 100));
        DC.rec[DC.idx] = r; DC.lastRes = res;
        saveProgress();
        lockInput(); showResult(res, T, false); renderRibbon(); renderTop();
    }
    function retry() {
        if (!DC.checked) return;
        DC.checked = false; DC.hints = 0;
        const inp = $('dc-input'); inp.readOnly = false; inp.value = ''; autoGrow();
        $('dc-result').classList.add('pv-x');
        try { hideLookupTooltip(); } catch (e) {}
        $('dc-check').textContent = 'Kiểm tra';
        $('dc-hintword').disabled = false;
        if ($('dc-listen-again')) $('dc-listen-again').disabled = false;
        $('dc-type').classList.remove('is-checked');
        renderHint();
        inp.focus(); play();
    }
    /* ====================== ĐIỀU HƯỚNG ====================== */
    function go(i) {
        if (!sentences.length) return;
        i = Math.max(0, Math.min(sentences.length - 1, i));
        DC.idx = i; DC.summary = false;
        resetSentenceState(); saveProgress(); renderAll(); closePop();
        $('dc-input').focus();
        if (prefs.autoplay) autoplaySoon();
        const sc = $('dc-scroll'); if (sc) sc.scrollTop = 0;
    }
    function next() { if (DC.idx < sentences.length - 1) go(DC.idx + 1); else showSummary(); }
    function prev() { if (DC.idx > 0) go(DC.idx - 1); }

    function showSummary() {
        stopAudio(true); closePop();
        DC.summary = true;
        const st = stats();
        const weak = [];
        for (let i = 0; i < sentences.length; i++) if (statusOf(i) !== 'perfect') weak.push(i);
        const allDone = st.done === st.total;
        let h = '<div class="dc-sum-title">' + (allDone ? 'Hoàn thành bài chép chính tả!' : 'Tổng kết tới thời điểm này') + '</div>';
        h += '<div class="dc-sum-sub">' + (weak.length ? (weak.length + ' câu chưa đạt mức hoàn hảo, bấm vào số câu để luyện lại.') : 'Tất cả các câu đều chính xác tuyệt đối.') + '</div>';
        h += '<div class="dc-sum-grid"><div class="dc-sum-stat"><b>' + st.done + '/' + st.total + '</b><span>Câu đã làm</span></div><div class="dc-sum-stat"><b>' + st.perfect + '</b><span>Câu hoàn hảo</span></div><div class="dc-sum-stat"><b>' + (st.done ? st.avg + '%' : '–') + '</b><span>Chính xác TB</span></div></div>';
        if (weak.length) {
            h += '<div class="dc-pop-grid" id="dc-weak" style="max-height:none;margin-bottom:6px">' + weak.map((i) => '<button type="button" class="dc-chip ' + statusOf(i) + '" data-i="' + i + '">' + (i + 1) + '</button>').join('') + '</div>';
        }
        h += '<div class="dc-res-foot"><div class="dc-actions">';
        h += '<button type="button" class="dc-btn" id="dc-sum-reset">Làm lại từ đầu</button><button type="button" class="dc-btn" id="dc-sum-back">Về giao diện Mặc định</button></div>';
        if (weak.length) h += '<div class="dc-actions"><button type="button" class="dc-btn primary" id="dc-sum-weak">Luyện lại câu chưa hoàn hảo</button></div>';
        h += '</div>';
        $('dc-summary').innerHTML = h;
        showBody(false); renderTop(); renderRibbon();
        const sc = $('dc-scroll'); if (sc) sc.scrollTop = 0;
    }
    function resetAll() {
        if (!confirm('Xóa toàn bộ tiến độ chép chính tả của bài này?')) return;
        DC.rec = {}; DC.idx = 0; saveProgress(); go(0);
    }

    /* ----- Bảng chọn câu (popover) ----- */
    function closePop() {
        const pop = $('dc-pop'); if (!pop) return;
        pop.classList.add('pv-x'); $('dc-count').setAttribute('aria-expanded', 'false');
    }
    function togglePop() {
        const pop = $('dc-pop');
        if (!pop.classList.contains('pv-x')) { closePop(); return; }
        let h = '<div class="dc-pop-grid">';
        for (let i = 0; i < sentences.length; i++) h += '<button type="button" class="dc-chip ' + statusOf(i) + (i === DC.idx ? ' cur' : '') + '" data-i="' + i + '">' + (i + 1) + '</button>';
        h += '</div><div class="dc-pop-foot"><div class="dc-legend"><span><i style="background:#22c55e"></i>Hoàn hảo</span><span><i style="background:#f59e0b"></i>Gần đúng</span><span><i style="background:#ef4444"></i>Cần luyện</span><span><i style="background:#64748b"></i>Xem đáp án</span></div>';
        h += '<div><button type="button" class="dc-link" id="dc-pop-sum">Tổng kết</button><button type="button" class="dc-link danger" id="dc-pop-reset">Xóa tiến độ</button></div></div>';
        pop.innerHTML = h; pop.classList.remove('pv-x'); $('dc-count').setAttribute('aria-expanded', 'true');
        const cur = pop.querySelector('.dc-chip.cur'); if (cur) cur.scrollIntoView({ block: 'center' });
    }

    /* ====================== VÀO / RA GIAO DIỆN ====================== */
    function dcEnter() {
        if (!sentences || !sentences.length) { toast('Chưa có câu nào để chép chính tả'); window.pvSetView('default'); return; }
        if (DC.vid !== currentVideoId || DC.allSig !== allSig()) loadProgress();
        DC.idx = Math.min(DC.idx, sentences.length - 1);
        DC.summary = false;
        resetSentenceState(); renderAll();
        const sc = $('dc-scroll'); if (sc) sc.scrollTop = 0;
        setTimeout(() => { try { $('dc-input').focus(); } catch (e) {} }, 30);
        if (prefs.autoplay) autoplaySoon();
    }
    function dcLeave() {
        try { hideLookupTooltip(); } catch (e) {}
        stopAudio(true);
        try { dcClearSel(); } catch (e) {}
        clearTimeout(DC.autoTimer); clearTimeout(DC.waitTimer);
        closePop();
        if (DC.vid) saveProgress();
        try { if (!isTextMode && ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
    }

    /* ====================== GẮN SỰ KIỆN ====================== */
    const inp = $('dc-input');
    inp.addEventListener('input', () => { autoGrow(); renderHint(); });
    inp.addEventListener('keydown', (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!e.repeat) check(); return; }
        if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); if (!e.repeat) togglePlay(); return; }
        if (DC.checked && (e.key === 'Backspace' || e.key === 'Delete')) { e.preventDefault(); retry(); }
    });
    // Khi focus không nằm trong ô gõ: Enter / Tab / gõ chữ vẫn hoạt động bình thường
    document.addEventListener('keydown', (e) => {
        if (view !== 'dictation' || $('screen-practice').classList.contains('hidden')) return;
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (DC.summary) return;
        if (e.key === 'Enter' && !(t && t.tagName === 'BUTTON')) { e.preventDefault(); if (DC.checked) next(); else inp.focus(); return; }
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); if (!e.repeat) togglePlay(); inp.focus(); return; }
        if (e.key && e.key.length === 1 && !DC.checked) inp.focus();
    });

    $('dc-play').addEventListener('click', () => { togglePlay(); if (!DC.checked) inp.focus(); });
    // Nút Phát lại (cạnh nút Play đỏ): luôn nghe lại câu từ ĐẦU, kể cả khi đang phát hoặc đang tạm dừng
    $('dc-replay').addEventListener('click', () => { DC.rangeOn = !!(DC.sel && !isTextMode); play(); if (!DC.checked) inp.focus(); });   // có đoạn chọn: phát lại từ In tới Out
    // Dải sóng đổi bề rộng (xoay điện thoại, ẩn/hiện danh sách câu, đổi kích thước cửa sổ) -> vẽ lại số thanh cho vừa khít
    if (typeof ResizeObserver === 'function') {
        new ResizeObserver(() => {
            const w = $('dc-wave').clientWidth, s = sentences && sentences[DC.idx];
            if (!w || !s || waveCountFor(w) === DC.waveN) return;
            buildWave(s.text); setProgress(DC.curP);
        }).observe($('dc-wave'));
    }
    $('dc-res-replay').addEventListener('click', () => { play(); inp.focus(); });
    /* Dải sóng: BẤM = nghe từ vị trí đó · KÉO = bôi đen một đoạn (xanh lá) rồi bấm "Loop" để nghe lặp lại đoạn đó */
    const dcWave = $('dc-wave'), dcSelEl = $('dc-sel');
    const dcPop = document.createElement('div');
    dcPop.className = 'dc-loop-pop';
    dcPop.innerHTML = '<button type="button" id="dc-loop-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2.1l4 4-4 4"></path><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8"></path><path d="M7 21.9l-4-4 4-4"></path><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"></path></svg><span>Loop</span></button>';
    document.body.appendChild(dcPop);
    const DC_MIN_SEC = 0.02;   // chỉ coi là bấm nhầm khi đoạn chọn gần như bằng 0 (cho phép bôi đen cả đoạn rất ngắn)
    let gMode = '', gEdge = '', gAnchor = 0, gDownX = 0, gDownP = 0, gRect = null;

    function dcRenderSel() {
        const rp = $('dc-replay');
        if (rp) { rp.title = DC.sel ? 'Phát lại đoạn đã chọn (từ In tới Out)' : 'Nghe lại từ đầu'; rp.setAttribute('aria-label', rp.title); }
        try { uiPlaying(!!DC.playing); } catch (_) {}   // cập nhật tooltip nút Play đỏ
        try { dcHintMarkSel(); } catch (_) {}
        if (!DC.sel) { dcSelEl.classList.remove('on', 'looping', 'no-in', 'no-out'); return; }
        dcSelEl.style.left = (DC.sel.a * 100) + '%';
        dcSelEl.style.width = ((DC.sel.b - DC.sel.a) * 100) + '%';
        dcSelEl.classList.add('on');
        dcSelEl.classList.toggle('looping', !!DC.loopOn);
        dcSelEl.classList.toggle('no-in', DC.inP == null);     // chưa đặt In -> đoạn bắt đầu từ đầu timeline
        dcSelEl.classList.toggle('no-out', DC.outP == null);   // chưa đặt Out -> đoạn kéo dài tới cuối timeline
    }
    function dcPopHide() { dcPop.classList.remove('on'); }
    function dcPlacePop() {
        if (!DC.sel || gMode === 'select' || gMode === 'edge' || view !== 'dictation') { dcPopHide(); return; }
        const r = dcWave.getBoundingClientRect();
        if (!r.width || !r.height) { dcPopHide(); return; }
        dcPop.classList.toggle('stop', !!DC.loopOn);
        dcPop.querySelector('span').textContent = DC.loopOn ? 'Dừng loop' : 'Loop';
        dcPop.classList.add('on');
        const half = (dcPop.offsetWidth || 90) / 2;
        const cx = r.left + ((DC.sel.a + DC.sel.b) / 2) * r.width;
        dcPop.style.left = Math.max(half + 8, Math.min(window.innerWidth - half - 8, cx)) + 'px';
        dcPop.style.top = Math.max(8, r.top - 6) + 'px';
    }
    function dcClearSel() {
        const was = DC.loopOn;
        DC.sel = null; DC.inP = null; DC.outP = null; DC.loopOn = false; DC.rangeOn = false; gMode = '';
        clearTimeout(DC.repeatTimer);
        if (was && DC.playing) stopAudio(true);
        dcRenderSel(); dcPopHide();
    }
    function dcStartLoop() {
        if (!DC.sel || isTextMode) return;
        DC.loopOn = true;
        dcRenderSel();
        play(DC.sel.a);
        dcPlacePop();
        if (!DC.checked) inp.focus();
    }
    function dcStopLoop() {          // dừng loop nhưng GIỮ vùng chọn để bấm Loop lại
        DC.loopOn = false;
        clearTimeout(DC.repeatTimer);
        if (DC.playing) stopAudio(true);
        dcRenderSel(); dcPlacePop();
        if (!DC.checked) inp.focus();
    }
    function dcLoopAgain() {         // hết đoạn chọn -> nghỉ một nhịp ngắn rồi nghe lại từ đầu đoạn
        clearTimeout(DC.repeatTimer);
        DC.repeatTimer = setTimeout(() => {
            if (DC.loopOn && DC.sel && !DC.checked && !DC.summary && view === 'dictation') play(DC.sel.a);
        }, 400);
    }
    dcPop.addEventListener('mousedown', (e) => e.preventDefault());
    $('dc-loop-btn').addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); if (DC.loopOn) { dcClearSel(); if (!DC.checked) inp.focus(); } else dcStartLoop(); });   // "Dừng loop" = dừng nghe lặp VÀ bỏ highlight
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || view !== 'dictation' || !DC.sel) return;
        dcClearSel();
    });
    // Bấm ra ngoài bất kỳ chỗ nào trên giao diện -> thoát loop (trừ: dải sóng, popup Loop, ô gõ chép chính tả và nút Play / Phát lại điều khiển chính đoạn đang nghe)
    document.addEventListener('pointerdown', (e) => {
        if (!DC.sel || view !== 'dictation') return;
        const t = e.target;
        if (t && t.closest && t.closest('#dc-wave, .dc-mid, .dc-loop-pop, .dc-toolrow, #dc-input, #dc-accents-bar, #dc-play, #dc-replay')) return;
        dcClearSel();
    }, true);
    const dcRePlace = () => { if (DC.sel) dcPlacePop(); };
    window.addEventListener('resize', dcRePlace);
    window.addEventListener('scroll', dcRePlace, true);
    if (typeof ResizeObserver === 'function') new ResizeObserver(dcRePlace).observe(dcWave);

    function dcWaveP(e, r) { return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); }
    function dcEdgeAt(e, r) {
        if (!DC.sel || !r.width) return '';
        const tol = e.pointerType === 'mouse' ? 8 : 14;
        // Chỉ bắt mép nào ĐÃ được đặt (đoạn mới có In hoặc Out thì đầu còn lại không có tay kéo)
        const da = DC.inP == null ? Infinity : Math.abs(e.clientX - (r.left + DC.sel.a * r.width));
        const db = DC.outP == null ? Infinity : Math.abs(e.clientX - (r.left + DC.sel.b * r.width));
        if (da > tol && db > tol) return '';
        return da <= db ? 'a' : 'b';
    }
    function dcSyncSel() {   // DC.sel (đoạn dùng cho Loop) luôn suy ra từ điểm In / Out
        DC.sel = (DC.inP == null && DC.outP == null) ? null : { a: DC.inP == null ? 0 : DC.inP, b: DC.outP == null ? 1 : DC.outP };
        dcRenderSel();
    }
    function dcSetSel(p) {
        if (gMode === 'edge' && gEdge && (gEdge === 'a' ? DC.outP == null : DC.inP == null)) {
            if (gEdge === 'a') DC.inP = p; else DC.outP = p;   // đoạn đang "mở" một đầu: chỉ kéo đúng đầu đã đặt
        } else { DC.inP = Math.min(gAnchor, p); DC.outP = Math.max(gAnchor, p); }
        dcSyncSel();
    }
    dcWave.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        gRect = dcWave.getBoundingClientRect(); if (!gRect.width) return;
        try { dcWave.setPointerCapture(e.pointerId); } catch (_) {}
        gDownX = e.clientX; gDownP = dcWaveP(e, gRect);
        const edge = isTextMode ? '' : dcEdgeAt(e, gRect);
        if (edge) { gMode = 'edge'; gEdge = edge; gAnchor = edge === 'a' ? DC.sel.b : DC.sel.a; if (DC.loopOn) dcStopLoop(); dcPopHide(); }
        else { gMode = 'click'; gEdge = ''; }
        e.preventDefault();
    });
    dcWave.addEventListener('pointermove', (e) => {
        if (!gMode) {
            if (e.pointerType === 'mouse') dcWave.style.cursor = (!isTextMode && dcEdgeAt(e, dcWave.getBoundingClientRect())) ? 'ew-resize' : '';
            return;
        }
        const p = dcWaveP(e, gRect);
        if (gMode === 'click' && !isTextMode && Math.abs(e.clientX - gDownX) > 4) {
            gMode = 'select'; gEdge = ''; gAnchor = gDownP;
            if (DC.loopOn) dcStopLoop();
            dcPopHide();
        }
        if (gMode === 'select' || gMode === 'edge') dcSetSel(p);
    });
    function dcWaveUp(e, ok) {
        if (!gMode) return;
        const mode = gMode; gMode = '';
        try { dcWave.releasePointerCapture(e.pointerId); } catch (_) {}
        if (mode === 'select' || mode === 'edge') {
            if (!DC.sel || (DC.sel.b - DC.sel.a) * (DC.durSec || 0) < DC_MIN_SEC) dcClearSel(); else dcStartLoop();   // bôi đen xong là loop luôn, nút hiện "Dừng loop"
            return;
        }
        if (!ok) return;
        // Bấm thường: nghe từ vị trí đó. Đang loop mà bấm TRONG đoạn chọn thì loop vẫn tiếp tục; bấm ngoài đoạn chọn thì thoát loop.
        // (Có playhead: bấm trên dải sóng = đưa playhead tới đó và nghe từ đó; điểm In/Out KHÔNG bị xoá — xoá bằng X / Esc / bấm ra ngoài)
        const p = dcWaveP(e, gRect);
        if (DC.sel && DC.loopOn && !(p >= DC.sel.a && p <= DC.sel.b)) dcStopLoop();   // bấm ra ngoài đoạn đang loop -> thôi loop, vẫn giữ In/Out
        if (!DC.loopOn) DC.rangeOn = false;   // bấm thẳng vào dải sóng = nghe từ chỗ đó tới hết câu
        play(p);
        if (!DC.checked) inp.focus();
    }
    dcWave.addEventListener('pointerup', (e) => dcWaveUp(e, true));
    dcWave.addEventListener('pointercancel', (e) => dcWaveUp(e, false));
    // Ô tốc độ (giống giao diện Shadowing): gõ số 0.25 - 2 rồi Enter, ↑/↓ chỉnh từng 0.1
    function dcSyncRate() {
        const el = $('dc-rate'); if (!el) return;
        if (document.activeElement !== el) el.value = rateFmt(settings.playbackRate || 1);
        const w = el.closest('.sh-rate'); if (w) w.classList.remove('invalid');
        document.querySelectorAll('#dc-speeds button').forEach((b) => b.classList.toggle('on', Math.abs((settings.playbackRate || 1) - parseFloat(b.getAttribute('data-sp'))) < 0.001));
        const rb = $('dc-rate-reset'); if (rb) rb.disabled = Math.abs((settings.playbackRate || 1) - 1) < 0.001;   // đang 1.0x thì nút reset mờ đi (giống nút reset thời gian)
    }
    function dcRateCommit() {
        const el = $('dc-rate'); if (!el) return;
        const w = el.closest('.sh-rate');
        const v = parseRateInput(el.value);
        if (v === null) {
            if (w) { w.classList.add('invalid'); setTimeout(() => w.classList.remove('invalid'), 700); }
            el.value = rateFmt(settings.playbackRate || 1);
            return;
        }
        const clamped = Math.max(0.25, Math.min(2, Math.round(v * 100) / 100));
        const changed = Math.abs(clamped - (settings.playbackRate || 1)) > 0.001;
        el.value = rateFmt(clamped);
        if (changed) setRate(clamped);
        setTimeout(dcSyncRate, 400);   // trình phát YouTube có thể chỉ nhận được tốc độ gần đúng -> hiện đúng tốc độ thật
        if (changed && DC.tts) play();   // giọng đọc máy phải đọc lại mới đổi tốc độ
    }
    $('dc-rate').addEventListener('keydown', (e) => {
        const el = e.target;
        if (e.key === 'Enter') { e.preventDefault(); dcRateCommit(); el.blur(); if (!DC.checked && !DC.summary) inp.focus(); }
        else if (e.key === 'Escape') { e.preventDefault(); el.value = rateFmt(settings.playbackRate || 1); el.blur(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const cur = parseRateInput(el.value), base = cur === null ? (settings.playbackRate || 1) : cur;
            el.value = rateFmt(Math.max(0.25, Math.min(2, Math.round((base + (e.key === 'ArrowUp' ? 0.1 : -0.1)) * 100) / 100)));
            dcRateCommit(); el.select();
        }
    });
    $('dc-rate-reset').addEventListener('click', () => { $('dc-rate').value = rateFmt(1); dcRateCommit(); try { $('dc-rate-reset').blur(); } catch (e) {} if (!DC.checked && !DC.summary) inp.focus(); });
    $('dc-rate').addEventListener('focus', (e) => e.target.select());
    $('dc-rate').addEventListener('blur', dcRateCommit);
    $('dc-check').addEventListener('click', check);
    $('dc-clear').addEventListener('click', () => { if (DC.checked) { retry(); return; } inp.value = ''; autoGrow(); renderHint(); inp.focus(); });
    $('dc-hintword').addEventListener('click', hintWord);
    const btnListenAgain = $('dc-listen-again');
    if (btnListenAgain) btnListenAgain.addEventListener('click', () => {
        DC.rangeOn = !!(DC.sel && !isTextMode);
        play();
        if (!DC.checked) inp.focus();
    });
    $('dc-speeds').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-sp]'); if (!b) return;
        const v = parseFloat(b.getAttribute('data-sp'));
        const changed = Math.abs(v - (settings.playbackRate || 1)) > 0.001;
        if (changed) setRate(v);
        dcSyncRate(); setTimeout(dcSyncRate, 400);   // trình phát YouTube có thể chỉ nhận tốc độ gần đúng -> hiện đúng tốc độ thật
        if (changed && DC.tts) play();   // giọng đọc máy phải đọc lại mới đổi tốc độ
        if (!DC.checked && !DC.summary) inp.focus();
    });
    $('dc-hintsw-btn').addEventListener('click', () => {
        const t = document.querySelector('#dc-level button[data-l="' + (prefs.level === 'easy' ? 'hard' : 'easy') + '"]');
        if (t) t.click();
    });
    $('dc-level').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-l]'); if (!b) return;
        prefs.level = b.getAttribute('data-l'); savePrefs(); renderTop(); renderHint();
        if (!DC.checked) inp.focus();
    });
    // Bấm vào một từ gợi ý: nghe từ từ đó
    $('dc-hint').addEventListener('click', (e) => {
        const w = e.target.closest('.dc-hw'); if (!w) return;
        const sel = window.getSelection();
        if (sel && sel.toString().trim()) return;   // đang bôi đen: không phát
        clearTimeout(DC.hwT);
        DC.hwT = setTimeout(() => {
            const s2 = window.getSelection();
            if (s2 && s2.toString().trim()) return;
            dcPlayFromWord(DC.hwEls.indexOf(w));
        }, 180);
    });
    $('dc-hint').addEventListener('dblclick', () => { clearTimeout(DC.hwT); });
    // Thả chuột / nhấc tay sau khi bôi đen chữ gợi ý -> loop đoạn đó
    document.addEventListener('mouseup', () => { setTimeout(dcHintSelection, 0); });
    document.addEventListener('touchend', () => { setTimeout(dcHintSelection, 350); }, { passive: true });
    $('dc-retry').addEventListener('click', retry);
    $('dc-next2').addEventListener('click', next);
    $('dc-prev').addEventListener('click', prev);
    $('dc-next').addEventListener('click', next);
    $('dc-count').addEventListener('click', (e) => { e.stopPropagation(); togglePop(); });
    $('dc-pop').addEventListener('click', (e) => {
        const chip = e.target.closest('.dc-chip[data-i]'); if (chip) { go(+chip.getAttribute('data-i')); return; }
        if (e.target.id === 'dc-pop-sum') showSummary();
        else if (e.target.id === 'dc-pop-reset') { closePop(); resetAll(); }
    });
    $('dc-summary').addEventListener('click', (e) => {
        const chip = e.target.closest('.dc-chip[data-i]'); if (chip) { go(+chip.getAttribute('data-i')); return; }
        if (e.target.id === 'dc-sum-reset') resetAll();
        else if (e.target.id === 'dc-sum-back') window.pvSetView('default');
        else if (e.target.id === 'dc-sum-weak') {
            let i = 0; for (; i < sentences.length; i++) if (statusOf(i) !== 'perfect') break;
            go(i >= sentences.length ? 0 : i);
        }
    });
    window.addEventListener('beforeunload', () => { try { if (DC.vid) saveProgress(); } catch (e) {} });

    // Hàng nút ký tự đặc biệt tiếng Pháp cho ô Chép chính tả
    (function () {
        const bar = $('dc-accents-bar'), shiftBtn = $('dc-acc-shift');
        if (!bar || !shiftBtn) return;
        let isShift = false;
        function updateShift() {
            shiftBtn.classList.toggle('active', isShift);
            shiftBtn.setAttribute('aria-pressed', isShift ? 'true' : 'false');
            const btns = bar.querySelectorAll('.dc-acc-btn:not(.dc-acc-shift)');
            btns.forEach((btn) => {
                const orig = btn.getAttribute('data-orig') || btn.getAttribute('data-char');
                if (!btn.getAttribute('data-orig')) btn.setAttribute('data-orig', orig);
                const ch = isShift ? orig.toUpperCase() : orig.toLowerCase();
                btn.setAttribute('data-char', ch);
                btn.textContent = ch;
            });
        }
        bar.addEventListener('mousedown', (e) => e.preventDefault());
        bar.addEventListener('click', (e) => {
            const btn = e.target.closest('.dc-acc-btn');
            if (!btn) return;
            e.preventDefault();
            if (btn === shiftBtn) {
                isShift = !isShift;
                updateShift();
                if (!DC.checked) inp.focus();
                return;
            }
            const ch = btn.getAttribute('data-char');
            if (!ch) return;
            const start = inp.selectionStart ?? inp.value.length;
            const end = inp.selectionEnd ?? inp.value.length;
            const v = inp.value;
            inp.value = v.substring(0, start) + ch + v.substring(end);
            inp.selectionStart = inp.selectionEnd = start + ch.length;
            if (!DC.checked) inp.focus();
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            if (isShift) {
                isShift = false;
                updateShift();
            }
        });
    })();
    /* ====================== SHADOWING (CHỈ NGHE, KHÔNG HIỆN VIDEO) ====================== */
    const SHP_KEY = 'shadowing_shadow_progress_v1', SHPREF_KEY = 'shadowing_shadow_prefs_v1';
    const shPrefs = Object.assign({ tr: true, hide: false }, readJSON(SHPREF_KEY) || {}, { ipa: false });   // ipa KHÔNG lưu: mỗi lần mở app đều tắt, chỉ tải từ điển khi người dùng bấm nút
    function shSavePrefs() { writeJSON(SHPREF_KEY, { tr: shPrefs.tr, hide: shPrefs.hide }); }
    const SH = {
        vid: null, allSig: '', idx: 0, rec: {}, voice: {}, filter: 'all', revealed: {},
        playing: false, timer: null, seg: null, segAt: 0, started: false, kicks: 0, kickAt: 0, tts: null, ttsStart: 0, ttsDur: 0, wEls: [], wTimes: null, p0: 0, p1: 0,
        loop: null, loopTimer: null, sel: null,
        recording: false, mr: null, stream: null, chunks: [], recIdx: 0, mrDone: false, finDone: true,
        recT0: 0, recTimer: null, userAudio: null, userPlaying: false, meterRaf: null, ac: null, an: null
    };
    const SHT = { mode: 0 };   // trạng thái chạm-để-chọn chữ ở Shadowing (0: không | 2: đang chạm lần 2 / kéo | 3: chạm lần 3)
    const hasVi = () => sentences.some((s) => s.vi && String(s.vi).trim());
    const I = {
        speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
        micFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path fill="none" d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
        mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
        stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.6-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z"/></svg>',
        gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>',
        left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
        right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
    };
    const RS_DN = '<button type="button" class="rate-step" data-rstep="-1" title="Giảm tốc độ 0.1" aria-label="Giảm tốc độ 0.1"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 9h12l-6 8z"/></svg></button>', RS_UP = '<button type="button" class="rate-step" data-rstep="1" title="Tăng tốc độ 0.1" aria-label="Tăng tốc độ 0.1"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 15h12l-6-8z"/></svg></button>';
    function shLoad() {
        SH.vid = currentVideoId; SH.allSig = allSig(); SH.rec = {}; SH.voice = {}; SH.revealed = {};
        const saved = (readJSON(SHP_KEY) || {})[SH.vid] || {};
        Object.keys(saved.r || {}).forEach((k) => { const i = +k, r = saved.r[k]; if (sentences[i] && r && r.g === sg(sentences[i])) SH.rec[i] = { g: r.g, n: r.n || 1 }; });
        SH.idx = Math.min(Math.max(+saved.last || 0, 0), Math.max(sentences.length - 1, 0));
    }
    function shSave() {
        if (!SH.vid) return;
        const all = readJSON(SHP_KEY) || {};
        all[SH.vid] = { t: Date.now(), last: SH.idx, r: SH.rec };
        const keys = Object.keys(all);
        if (keys.length > 60) keys.sort((a, b) => (all[a].t || 0) - (all[b].t || 0)).slice(0, keys.length - 60).forEach((k) => { delete all[k]; });
        writeJSON(SHP_KEY, all);
    }
    function shStatus(i) { return SH.rec[i] ? 'done' : 'todo'; }
    function shStats() {
        let done = 0;
        for (let i = 0; i < sentences.length; i++) if (SH.rec[i]) done++;
        return { done: done, total: sentences.length };
    }

    /* ----- Nghe mẫu (cắt đúng từng câu từ video ẩn, hoặc giọng đọc máy với bài văn bản) ----- */
    // p = tiến độ 0..1 của đoạn đang phát; t = thời gian video (nếu có) để tô từ đang đọc.
    // Đoạn đang phát có thể chỉ là 1 phần câu (bấm vào từ / loop): SH.p0..SH.p1 là các từ nằm trong đoạn đó.
    function shProg(p, t) {
        p = Math.max(0, Math.min(1, p || 0));
        const f = $('sh-pfill'); if (f) f.style.width = (p * 100).toFixed(1) + '%';
        const els = SH.wEls; if (!els.length) return;
        const p0 = Math.max(0, Math.min(SH.p0 || 0, els.length - 1));
        const p1 = Math.min(Math.max(SH.p1 == null ? els.length - 1 : SH.p1, p0), els.length - 1);
        let cur = -1;
        if (SH.wTimes && t != null) { for (let i = 0; i < els.length; i++) if (t >= SH.wTimes[i][0] - 0.02) cur = i; cur = Math.min(cur, p1); }
        else cur = p0 + Math.min(p1 - p0, Math.floor(p * (p1 - p0 + 1)));
        if (p <= 0) cur = -1;
        for (let i = 0; i < els.length; i++) {
            els[i].classList.toggle('cur', i === cur && p < 1);
            els[i].classList.toggle('past', i >= p0 && (i < cur || (p >= 1 && i <= p1)));
        }
    }
    function shPlayUI(on) { const b = $('sh-play'); if (b) { b.classList.toggle('on', !!on); b.title = (on ? 'Dừng' : 'Nghe mẫu') + ' (Tab)'; } }
    function shStopModel(resetUI) {
        clearInterval(SH.timer); SH.timer = null;
        if (SH.tts) { SH.tts = null; try { speechSynthesis.cancel(); } catch (e) {} }
        else if (!isTextMode && SH.playing) { try { ytPlayer.pauseVideo(); } catch (e) {} }
        SH.playing = false; SH.seg = null;
        if (resetUI !== false) shPlayUI(false);
    }
    function shStopUser() {
        if (SH.userAudio) { try { SH.userAudio.pause(); } catch (e) {} SH.userAudio = null; }
        SH.userPlaying = false; shUserUI();
    }
    function shUserUI() {
        const b = $('sh-mine'); if (!b) return;
        b.classList.toggle('on', SH.userPlaying);
        b.innerHTML = (SH.userPlaying ? I.stop : I.play) + (SH.userPlaying ? 'Dừng nghe' : 'Nghe thu âm');
    }

    /* ----- Loop đoạn bôi đen ----- */
    function shLoopUI() {
        // Không còn thanh "Đang loop" ở dưới: tô xanh các chữ đang loop + popup "Dừng loop" ngay trên chữ (giống Chép chính tả)
        const els = SH.wEls || [], r = SH.loop && SH.loop.range;
        for (let i = 0; i < els.length; i++) els[i].classList.toggle('loopsel', !!r && i >= r.p0 && i <= r.p1);
        if (!r && window.LoopBox) window.LoopBox.clear('sh');
        shLoopPopSync();
    }
    let shLoopPopEl = null, shLoopPopRaf = 0;
    function shLoopPopEnsure() {
        if (shLoopPopEl) return shLoopPopEl;
        const el = document.createElement('div');
        el.id = 'sh-loop-pop';
        el.className = 'dc-loop-pop stop';
        el.innerHTML = '<button type="button" id="sh-loop-stop-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2.1l4 4-4 4"></path><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8"></path><path d="M7 21.9l-4-4 4-4"></path><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"></path></svg><span>Dừng loop</span></button>';
        el.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
        el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); shStopLoop(); shStopModel(true); });
        document.body.appendChild(el);
        shLoopPopEl = el;
        return el;
    }
    function shLoopPopTick() {
        shLoopPopRaf = 0;
        const el = shLoopPopEl;
        if (!el) return;
        if (!SH.loop || view !== 'shadowing') { el.classList.remove('on'); if (window.LoopBox) window.LoopBox.clear('sh'); return; }
        shLoopPopRaf = requestAnimationFrame(shLoopPopTick);
        if (window.LoopBox) window.LoopBox.render('sh', (SH.wEls || []).slice(SH.loop.range.p0, SH.loop.range.p1 + 1));
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim()) { el.classList.remove('on'); return; }   // đang bôi đen đoạn khác: nhường chỗ cho popup Tra nghĩa / Loop / Lưu
        const els = SH.wEls || [], rg = SH.loop.range;
        let u = null;
        for (let i = rg.p0; i <= rg.p1; i++) {
            const w = els[i]; if (!w || !w.isConnected) continue;
            const r = w.getBoundingClientRect(); if (!r.width) continue;
            u = u ? { left: Math.min(u.left, r.left), right: Math.max(u.right, r.right), top: Math.min(u.top, r.top) } : { left: r.left, right: r.right, top: r.top };
        }
        if (!u) { el.classList.remove('on'); return; }
        el.classList.add('on');
        const half = (el.offsetWidth || 120) / 2, h = el.offsetHeight || 36;
        el.style.left = Math.max(half + 8, Math.min(window.innerWidth - half - 8, (u.left + u.right) / 2)) + 'px';
        el.style.top = Math.min(window.innerHeight - 8, Math.max(h + 14, u.top - 6)) + 'px';
    }
    function shLoopPopSync() {
        if (SH.loop && view === 'shadowing') { shLoopPopEnsure(); if (!shLoopPopRaf) shLoopPopRaf = requestAnimationFrame(shLoopPopTick); }
        else { if (shLoopPopEl) shLoopPopEl.classList.remove('on'); if (window.LoopBox) window.LoopBox.clear('sh'); }
    }
    function shStopLoop() {
        clearTimeout(SH.loopTimer); SH.loopTimer = null;
        if (SH.loop) { SH.loop = null; shLoopUI(); }
    }
    // Hết 1 lượt phát tự nhiên: nếu đang loop thì nghỉ (Delay) rồi phát lại đúng đoạn đó
    function shAfterEnd() {
        if (!SH.loop || view !== 'shadowing') return;
        clearTimeout(SH.loopTimer);
        const my = SH.idx;
        SH.loopTimer = setTimeout(() => {
            SH.loopTimer = null;
            if (SH.loop && view === 'shadowing' && SH.idx === my && !SH.recording) shPlay(SH.loop.range, true);
        }, Math.max(0, loopDelaySeconds) * 1000);
    }
    function shStartLoop(sel) {
        const els = SH.wEls, n = els.length; if (!n) return;
        const a = Math.max(0, sel.a), b = Math.min(n - 1, sel.b);
        let range;
        if (isTextMode) range = { text: els.slice(a, b + 1).map((e) => e.textContent).join(' '), p0: a, p1: b };
        else {
            const st = shWordSpan(a)[0]; let en = shWordSpan(b)[1];
            if (!(en > st + 0.25)) en = st + 0.6;
            range = { start: st, end: en, p0: a, p1: b };
        }
        clearTimeout(SH.loopTimer); SH.loopTimer = null;
        SH.loop = { range: range, label: sel.text };
        shPlay(range, true);
        shLoopUI();
    }

    function shFinish(natural) {
        try { if (!isTextMode) ytPlayer.pauseVideo(); } catch (e) {}
        clearInterval(SH.timer); SH.timer = null; SH.playing = false; SH.seg = null; shPlayUI(false);
        if (natural) { shProg(1); shAfterEnd(); }
        else if (SH.loop) shStopLoop();
    }
    function shTick() {
        if (!SH.seg || !ytPlayer || !ytPlayer.getCurrentTime) return;
        let t; try { t = ytPlayer.getCurrentTime(); } catch (e) { return; }
        let st = -1; try { st = ytPlayer.getPlayerState(); } catch (e) {}
        const seg = SH.seg, now = Date.now();
        if (!SH.started) {
            // Chưa thật sự chạy. Trên điện thoại, lệnh playVideo() gửi ngay sau seekTo() (nhất là khi video đang dừng ở cuối câu)
            // hay bị YouTube bỏ qua -> video đứng yên và phải bấm loa lần nữa. Nên ở đây chỉ coi là "đã chạy" khi YouTube báo
            // trạng thái PLAYING (1); nếu chưa thì cứ ~0.26s bấm play lại (tối đa 8 lần).
            const inRange = t >= seg.start - 0.35 && t <= seg.end + 0.2;
            if (st === 1 && inRange) { SH.started = true; }
            else {
                if (now - SH.segAt > 6000) { shFinish(false); return; }
                if (st !== 3 && now - SH.kickAt > 260) {          // 3 = đang buffer: cứ đợi, không đụng vào
                    if (SH.kicks >= 8) { shFinish(false); return; }
                    SH.kicks++; SH.kickAt = now;
                    try { if (!inRange) ytPlayer.seekTo(seg.start, true); ytPlayer.playVideo(); } catch (e) {}
                }
                return;
            }
        }
        shProg((t - seg.start) / (seg.end - seg.start), t);
        if (t >= seg.end - 0.03 || t > seg.end + 1.5 || ((st === 0 || st === 2) && now - SH.segAt > 1200)) shFinish(true);
    }
    function shSpeak(text) {
        if (!('speechSynthesis' in window)) { toast('Trình duyệt này không hỗ trợ đọc văn bản'); return; }
        try { speechSynthesis.cancel(); } catch (e) {}
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'fr-FR'; const v = pickVoice(); if (v) u.voice = v;
        u.rate = Math.max(0.5, Math.min(1.6, (settings && settings.playbackRate) || 1));
        const words = String(text).split(/\s+/).filter(Boolean).length;
        SH.ttsDur = Math.max(1.2, words * 0.4 / u.rate); SH.ttsStart = performance.now();
        const done = (failed) => {
            if (SH.tts !== u) return;
            SH.tts = null; clearInterval(SH.timer); SH.timer = null; SH.playing = false; shPlayUI(false);
            if (failed) { shProg(0); if (SH.loop) shStopLoop(); return; }
            shProg(1); shAfterEnd();
        };
        u.onend = () => done(false); u.onerror = () => done(true);
        SH.tts = u; SH.playing = true; shPlayUI(true); shProg(0);
        SH.timer = setInterval(() => { shProg(Math.min(0.97, (performance.now() - SH.ttsStart) / 1000 / SH.ttsDur)); }, 60);
        speechSynthesis.speak(u);
    }
    // Thời gian [bắt đầu, kết thúc] của từ thứ wi trong câu đang luyện (không có mốc từng từ thì chia đều theo độ dài câu)
    function shWordSpan(wi) {
        if (SH.wTimes && SH.wTimes[wi]) return SH.wTimes[wi];
        const n = Math.max(1, SH.wEls.length), tt = tsGet(SH.idx);
        const step = (tt.e - tt.s) / n;
        return [tt.s + wi * step, tt.s + (wi + 1) * step];
    }
    // range (tuỳ chọn): phát 1 phần câu { start, end, text, p0, p1 }. fromLoop: lượt lặp tự động của Loop (không huỷ Loop)
    function shPlay(range, fromLoop) {
        const s = sentences[SH.idx];
        if (!s || view !== 'shadowing') return;
        if (!fromLoop) shStopLoop();
        if (SH.recording) shRecStop();
        shStopModel(false); shStopUser();
        SH.p0 = range && range.p0 != null ? range.p0 : 0;
        SH.p1 = range && range.p1 != null ? range.p1 : Math.max(0, SH.wEls.length - 1);
        if (isTextMode) { shSpeak(range && range.text ? range.text : s.text); return; }
        if (!ytPlayer || !isPlayerReady || !ytPlayer.seekTo) { shPlayUI(false); toast('Âm thanh đang tải, thử lại sau giây lát'); return; }
        const tt = tsGet(SH.idx);
        let start = tt.s, end = tt.e;
        if (range && range.start != null) { start = range.start; if (range.end != null) end = range.end; if (!(end > start + 0.25)) end = start + 0.6; }
        SH.seg = { start: start, end: end }; SH.segAt = Date.now(); SH.started = false; SH.kicks = 0; SH.kickAt = Date.now();
        shProg(0);
        // Seek + play thẳng vào player. Không gọi seekToTime() nữa: hàm đó còn cuộn mượt danh sách phụ đề của giao diện Mặc định (đang ẩn)
        // ngay trước khi phát, tốn thời gian trên điện thoại.
        currentSentenceIndex = SH.idx;
        try { if (typeof subtitleLoopActive !== 'undefined' && subtitleLoopActive) stopSubtitleLoop(); } catch (e) {}
        try { ytPlayer.seekTo(start, true); ytPlayer.playVideo(); } catch (e) {}
        SH.playing = true; shPlayUI(true);
        clearInterval(SH.timer); SH.timer = setInterval(shTick, 30);
    }
    // Bấm vào 1 từ: nghe từ từ đó tới hết câu
    function shPlayFrom(wi) {
        const n = SH.wEls.length; if (wi < 0 || wi >= n) return;
        if (isTextMode) { shPlay({ text: SH.wEls.slice(wi).map((e) => e.textContent).join(' '), p0: wi, p1: n - 1 }); return; }
        shPlay({ start: shWordSpan(wi)[0], p0: wi, p1: n - 1 });
    }
    function shWordClick(el) {
        // Đang bôi đen thì không phát; chờ 1 chút để phân biệt với double-click (double-click = chọn từ để hiện Loop)
        const sel = window.getSelection();
        if (sel && sel.toString().trim()) return;
        if (el._shT) return;
        el._shT = setTimeout(() => {
            el._shT = null;
            const s2 = window.getSelection();
            if (s2 && s2.toString().trim()) return;
            const wi = SH.wEls.indexOf(el);
            if (wi >= 0) shPlayFrom(wi);
        }, 180);
    }
    function shPlayLater() {
        const my = SH.idx; let tries = 0;
        const attempt = () => {
            if (view !== 'shadowing' || SH.idx !== my || SH.recording) return;
            if (isTextMode || (ytPlayer && isPlayerReady)) { shPlay(); return; }
            if (++tries < 50) setTimeout(attempt, 300);
        };
        setTimeout(attempt, 250);
    }

    /* ----- Tốc độ nghe mẫu (ô gõ số, dùng chung cài đặt tốc độ với giao diện Mặc định) ----- */
    function shSyncRate() {
        const inp = $('sh-rate'); if (!inp) return;
        if (document.activeElement !== inp) inp.value = rateFmt(settings.playbackRate || 1);
        const w = inp.closest('.sh-rate'); if (w) w.classList.remove('invalid');
        const rb = $('sh-rate-reset'); if (rb) rb.disabled = Math.abs((settings.playbackRate || 1) - 1) < 0.001;   // đang 1.0x thì nút reset mờ đi (giống Chép chính tả)
    }
    // Nút chọn nhanh tốc độ nằm cùng hàng với nút thu âm, căn phải
    function shSpeedsHTML() {
        const r = settings.playbackRate || 1;
        return '<div class="dc-seg sh-speeds" id="sh-speeds" role="group" aria-label="Chọn nhanh tốc độ nghe mẫu">' +
            [['0.5', '0.5'], ['0.75', '0.75'], ['0.9', '0.9'], ['1', '1.0']].map((a) =>
                '<button type="button" data-sp="' + a[0] + '" class="' + (Math.abs(parseFloat(a[0]) - r) < 0.01 ? 'on' : '') + '" title="Tốc độ ' + a[1] + 'x">' + a[1] + '<i>x</i></button>').join('') + '</div>';
    }
    function shRateCommit() {
        const inp = $('sh-rate'); if (!inp) return;
        const w = inp.closest('.sh-rate');
        const v = parseRateInput(inp.value);
        if (v === null) {
            if (w) { w.classList.add('invalid'); setTimeout(() => w.classList.remove('invalid'), 700); }
            inp.value = rateFmt(settings.playbackRate || 1);
            return;
        }
        const clamped = Math.max(0.25, Math.min(2, Math.round(v * 100) / 100));
        const changed = Math.abs(clamped - (settings.playbackRate || 1)) > 0.001;
        inp.value = rateFmt(clamped);
        setRate(clamped);
        shSyncRate();
        setTimeout(shSyncRate, 400);   // trình phát YouTube có thể chỉ nhận được tốc độ gần đúng -> hiện đúng tốc độ thật
        if (changed && SH.tts) { const rg = SH.loop ? SH.loop.range : null; shPlay(rg, !!rg); }   // giọng đọc máy phải đọc lại mới đổi tốc độ
    }
    function shRateKey(e) {
        const inp = e.target;
        if (e.key === 'Enter') { e.preventDefault(); shRateCommit(); inp.blur(); }
        else if (e.key === 'Escape') { e.preventDefault(); inp.value = rateFmt(settings.playbackRate || 1); inp.blur(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const cur = parseRateInput(inp.value), base = cur === null ? (settings.playbackRate || 1) : cur;
            inp.value = rateFmt(Math.max(0.25, Math.min(2, Math.round((base + (e.key === 'ArrowUp' ? 0.1 : -0.1)) * 100) / 100)));
            shRateCommit(); inp.select();
        }
    }

    /* ----- Thu âm (không chấm điểm: người dùng tự nghe lại và tự so sánh với bản mẫu) ----- */
    function shMeterStart(stream) {
        try {
            const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
            SH.ac = new AC(); const src = SH.ac.createMediaStreamSource(stream);
            SH.an = SH.ac.createAnalyser(); SH.an.fftSize = 256; src.connect(SH.an);
            const buf = new Uint8Array(SH.an.frequencyBinCount);
            const loop = () => {
                SH.meterRaf = requestAnimationFrame(loop);
                const bars = document.querySelectorAll('#sh-meter b'); if (!bars.length) return;
                SH.an.getByteFrequencyData(buf);
                for (let i = 0; i < bars.length; i++) {
                    const v = buf[2 + i * 3] || 0;
                    bars[i].style.height = Math.max(4, Math.round(v / 255 * 22)) + 'px';
                }
            };
            loop();
        } catch (e) {}
    }
    function shMeterStop() {
        if (SH.meterRaf) cancelAnimationFrame(SH.meterRaf); SH.meterRaf = null;
        try { if (SH.ac) SH.ac.close(); } catch (e) {} SH.ac = null; SH.an = null;
    }
    function shRecTimeUI() {
        const el = $('sh-rec-time'); if (el) el.textContent = fmt((Date.now() - SH.recT0) / 1000);
    }
    async function shRecStart() {
        if (SH.recording || view !== 'shadowing') return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { toast('Trình duyệt này không hỗ trợ thu âm'); return; }
        shStopLoop(); shStopModel(true); shStopUser(); shProg(0);
        let stream;
        try { stream = await getMicStream(); }
        catch (e) { toast('Không truy cập được micro. Hãy cho phép quyền micro cho trang này.'); return; }
        if (view !== 'shadowing') { stream.getTracks().forEach((t) => t.stop()); return; }
        SH.stream = stream; SH.chunks = []; SH.recIdx = SH.idx; SH.mrDone = false; SH.finDone = false;
        let mr;
        try {
            mr = createMicRecorder(stream);
            SH.mr = mr;
        } catch (e) {
            try { stream.getTracks().forEach((t) => t.stop()); } catch (e2) {}
            SH.recording = false;
            toast('Không thể khởi tạo bộ ghi âm trên thiết bị này.');
            return;
        }
        mr.ondataavailable = (e) => { if (e.data && e.data.size) SH.chunks.push(e.data); };
        mr.onstop = () => {
            shMeterStop(); try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
            const blob = new Blob(SH.chunks, { type: mr.mimeType || 'audio/webm' });
            const old = SH.voice[SH.recIdx]; if (old && old.url) { try { URL.revokeObjectURL(old.url); } catch (e) {} }
            SH.voice[SH.recIdx] = { url: URL.createObjectURL(blob) };
            SH.mrDone = true; shFinalize();
        };
        try {
            mr.start(250);
        } catch (e) {
            try { stream.getTracks().forEach((t) => t.stop()); } catch (e2) {}
            SH.recording = false;
            toast('Lỗi khi bắt đầu ghi âm.');
            return;
        }
        SH.recording = true; SH.recT0 = Date.now();
        clearInterval(SH.recTimer);
        const s = sentences[SH.idx]; const maxMs = Math.max(8000, ((s && s.endTime - s.startTime) || 4) * 2200 + 4000);
        SH.recTimer = setInterval(() => { shRecTimeUI(); if (Date.now() - SH.recT0 > maxMs) shRecStop(); }, 250);
        shRecUI(); shMeterStart(stream);
    }
    function shRecStop() {
        if (!SH.recording) return;
        SH.recording = false; clearInterval(SH.recTimer); SH.recTimer = null;
        try { if (SH.mr && SH.mr.state !== 'inactive') SH.mr.stop(); } catch (e) {}
        shRecUI();
    }
    function shFinalize() {
        if (SH.finDone) return; SH.finDone = true;
        const i = SH.recIdx, s = sentences[i];
        if (!s || !SH.voice[i]) return;
        const r = SH.rec[i] || { g: sg(s), n: 0 };
        r.g = sg(s); r.n = (r.n || 0) + 1;
        SH.rec[i] = r; shSave();
        shRender(false);
    }

    /* ----- Hiển thị ----- */
    // Chưa thu: [Nhấn để thu âm]. Thu xong: [Thu âm lại] [Nghe thu âm] -> nút thu âm luôn nằm cùng 1 chỗ, chỉ thêm 1 nút bên phải.
    function shRecUI() {
        const box = $('sh-recbox'); if (!box) return;
        const v = SH.voice[SH.idx];
        if (SH.recording) {
            box.innerHTML = '<div class="sh-recrow"><button type="button" class="sh-recbtn rec" data-act="rec-stop" title="Nhấn để dừng thu (R)"><span class="sh-recdot"></span><span>Dừng thu</span><b id="sh-rec-time">0:00</b><span class="sh-meter" id="sh-meter">' + '<b></b>'.repeat(8) + '</span></button>' + shSpeedsHTML() + '</div>';
            tsRefresh();
            return;
        }
        box.innerHTML = '<div class="sh-recrow"><button type="button" class="sh-recbtn ' + (v ? 'redo' : 'go') + '" data-act="rec" title="Thu âm giọng của bạn (R)">' + (v ? I.micFill + 'Thu âm lại' : '<span class="sh-micdot">' + I.micFill + '</span>Nhấn để thu âm') + '</button>' +
            (v ? '<button type="button" class="sh-recbtn alt' + (SH.userPlaying ? ' on' : '') + '" id="sh-mine" data-act="mine" title="Nghe lại giọng bạn vừa thu (L)">' + (SH.userPlaying ? I.stop + 'Dừng nghe' : I.play + 'Nghe thu âm') + '</button>' : '') + shSpeedsHTML() + '</div>';
        tsRefresh();
    }
    /* ----- IPA (tải từ điển CMU lười: chỉ khi người dùng bấm nút IPA lần đầu) ----- */
    const IPA = { map: null, promise: null, urls: ['assets/french-ipa.txt', 'assets/cmudict-0.7b-ipa.txt'] };   // thử cả 2 cách đặt tên file
    /* Bảng sửa tay: từ nào cách đọc đầu tiên trong từ điển CMU khác Cambridge thì ghi đè ở đây (KHÓA VIẾT HOA : IPA).
       Muốn thêm từ mới chỉ cần thêm 1 dòng, ví dụ  WORD: 'ˈwɝd',  */
    const IPA_FIX = {
        REALLY: 'ˈriːli'   // CMU liệt kê ˈrɪli (i ngắn) trước; ưu tiên cách đọc i dài
    };
    function ipaFetch(i) {
        if (i >= IPA.urls.length) return Promise.reject(new Error('not found'));
        return fetch(IPA.urls[i]).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
            .then((txt) => { if (txt.slice(0, 200).toLowerCase().indexOf('<html') >= 0 || txt.length < 100000) throw new Error('not dict'); return txt; })   // host trả về index.html khi thiếu file thì coi như lỗi
            .catch(() => ipaFetch(i + 1));
    }
    function ipaLoad() {
        if (IPA.map) return Promise.resolve(IPA.map);
        if (IPA.promise) return IPA.promise;
        IPA.promise = ipaFetch(0).then((txt) => {
            const m = new Map();
            const lines = txt.split('\n');
            for (let k = 0; k < lines.length; k++) {
                const ln = lines[k]; const t = ln.indexOf('\t'); if (t < 1) continue;
                const first = ln.slice(t + 1).split(',')[0].trim();   // từ có nhiều cách đọc: lấy cách đầu tiên
                if (first) m.set(ln.slice(0, t), first);
            }
            for (const k in IPA_FIX) m.set(k, IPA_FIX[k]);   // áp bảng sửa tay lên trên từ điển
            if (m.size < 1000) throw new Error('empty dict');
            IPA.map = m; return m;
        }).catch((err) => { IPA.promise = null; throw err; });
        return IPA.promise;
    }
    /* ----- Đọc số thành chữ (CMU không có "9", "1990", "3rd"...): đổi sang chữ rồi tra IPA từng chữ ----- */
    const NUM_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const NUM_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const NUM_SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];
    function numBelow1000(n, out) {
        if (n >= 100) { out.push(NUM_ONES[Math.floor(n / 100)], 'hundred'); n %= 100; }
        if (n >= 20) { out.push(NUM_TENS[Math.floor(n / 10)]); n %= 10; if (n) out.push(NUM_ONES[n]); }
        else if (n > 0) out.push(NUM_ONES[n]);
    }
    function numWords(str) {   // chuỗi chữ số (không dấu phẩy) -> mảng chữ; null nếu quá dài
        str = str.replace(/^0+(?=\d)/, '');
        if (str.length > 15) return null;
        if (str === '0') return ['zero'];
        const groups = []; for (let i = str.length; i > 0; i -= 3) groups.unshift(parseInt(str.slice(Math.max(0, i - 3), i), 10));
        const out = [];
        groups.forEach((g, i) => { if (!g) return; numBelow1000(g, out); const sc = NUM_SCALES[groups.length - 1 - i]; if (sc) out.push(sc); });
        return out;
    }
    function yearWords(str) {   // 1100-1999, 2010-2099: đọc theo cặp (1990 -> nineteen ninety)
        const n = parseInt(str, 10);
        if (str.length === 4 && ((n >= 1100 && n <= 1999) || (n >= 2010 && n <= 2099))) {
            const hi = parseInt(str.slice(0, 2), 10), lo = parseInt(str.slice(2), 10), out = [];
            numBelow1000(hi, out);
            if (lo === 0) out.push('hundred'); else { if (lo < 10) out.push('oh'); numBelow1000(lo, out); }
            return out;
        }
        return numWords(str);
    }
    function wordPlural(w) {
        if (/y$/.test(w)) return w.slice(0, -1) + 'ies';
        if (/(s|x|z|ch|sh)$/.test(w)) return w + 'es';
        return w + 's';
    }
    function wordOrdinal(w) {
        const irr = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
        if (irr[w]) return irr[w];
        if (/y$/.test(w)) return w.slice(0, -1) + 'ieth';
        return w + 'th';
    }
    function numberToWords(w) {   // w: token đã bỏ dấu câu ở hai đầu; trả về mảng chữ hoặc null nếu không phải số
        let m, out;
        w = w.replace(/^(\d{1,3}(?:,\d{3})+)(?=$|[.'a-zA-Z])/, (x) => x.replace(/,/g, ''));
        if ((m = w.match(/^(\d+)$/))) return (m[1].length === 4 ? yearWords(m[1]) : numWords(m[1]));
        if ((m = w.match(/^(\d+)\.(\d+)$/))) {
            const a = numWords(m[1]); if (!a) return null;
            return a.concat(['point'], m[2].split('').map((d) => NUM_ONES[+d]));
        }
        if ((m = w.match(/^(\d+)(?:st|nd|rd|th)$/i))) { out = numWords(m[1]); if (!out) return null; out[out.length - 1] = wordOrdinal(out[out.length - 1]); return out; }
        if ((m = w.match(/^(\d{2,4})'?s$/i))) { out = (m[1].length === 4 ? yearWords(m[1]) : numWords(m[1])); if (!out) return null; out[out.length - 1] = wordPlural(out[out.length - 1]); return out; }
        return null;
    }
    /* Từ 1 âm tiết thì bỏ dấu nhấn (ˈ ˌ); chỉ từ từ 2 âm tiết trở lên mới hiện nhấn âm */
    function ipaSyllables(ipa) {
        const m = String(ipa).match(/a\u026a|e\u026a|o\u028a|a\u028a|\u0254\u026a|[\u0251\u0252\u00e6\u025b\u026a\u028a\u028c\u0259\u0254eioua\u025d\u025a]\u02d0?/g);
        return m ? m.length : 0;
    }
    function ipaLookup(w) {
        const r = ipaLookupRaw(w);
        return (r && ipaSyllables(r) <= 1) ? r.replace(/[\u02c8\u02cc]/g, '') : r;
    }
    function ipaLookupRaw(w) {
        const M = IPA.map; if (!M) return '';
        w = String(w).replace(/[\u2018\u2019]/g, "'").replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '');
        if (!w) return '';
        const up = w.toUpperCase();
        let r = M.get(up) || M.get(up.replace(/'+$/, '')) || M.get(up.replace(/^'+/, ''));
        if (r) return r;
        const nw = /^\d/.test(up) ? numberToWords(w) : null;   // số: 9 -> nine, 1990 -> nineteen ninety, 3rd -> third
        if (nw) { const out = []; for (const x of nw) { const y = ipaLookup(x); if (!y) return ''; out.push(y); } return out.join(' '); }
        if (/[-\u2013\u2014]/.test(up)) {   // từ ghép có gạch nối: ghép IPA từng phần
            const parts = up.split(/[-\u2013\u2014]+/).filter(Boolean), out = [];
            for (const p of parts) { const x = ipaLookup(p); if (!x) return ''; out.push(x); }
            return out.join('');
        }
        const pm = up.match(/^(.+)'S$/);   // sở hữu cách / viết tắt 's: lấy IPA từ gốc + s / z / ɪz theo âm cuối
        if (pm) {
            const b = M.get(pm[1]);
            if (b) {
                const last = b.replace(/[ˈˌː]+$/, '');
                if (/(tʃ|dʒ|[sz\u0283\u0292])$/.test(last)) return b + 'ɪz';
                if (/[ptkfθ]$/.test(last)) return b + 's';
                return b + 'z';
            }
        }
        return ipaInflect(up, M);
    }
    // Từ điển CMU chỉ có một số dạng chia của từ (vd. có "imposter" mà thiếu "imposters"): khi không tra được nguyên văn
    // thì thử tìm từ gốc (bỏ -s/-es/-ies/-ed/-ing/-ly, hoặc đổi -ter <-> -tor) rồi nối âm đuôi tương ứng vào IPA.
    function ipaInflect(up, M) {
        const base = (b) => {
            if (b.length < 2) return '';
            let r = M.get(b); if (r) return r;
            if (/TER$/.test(b)) { r = M.get(b.slice(0, -2) + 'OR'); if (r) return r; }   // imposter <-> impostor, v.v. (cùng cách đọc)
            if (/TOR$/.test(b)) { r = M.get(b.slice(0, -2) + 'ER'); if (r) return r; }
            return '';
        };
        const tail = (b) => b.replace(/[ˈˌː]+$/, '');
        const sib = (b) => /(tʃ|dʒ|[sz\u0283\u0292])$/.test(tail(b));
        const vl = (b) => /(tʃ|[ptkfθs\u0283])$/.test(tail(b));
        const dbl = (st) => /([BDGLMNPRT])\1$/.test(st) ? [st.slice(0, -1)] : [];   // stopped -> stop, running -> run
        let m, st, b, i;
        if ((b = base(up))) return b;   // chỉ khác cách viết: imposter / impostor
        if (/[^S]S$/.test(up)) {   // số nhiều / ngôi thứ 3: -s, -es, -ies
            const stems = [];
            if ((m = up.match(/^(.+)IES$/))) stems.push(m[1] + 'Y');
            if ((m = up.match(/^(.+)ES$/))) stems.push(m[1]);
            stems.push(up.slice(0, -1));
            for (st of stems) if ((b = base(st))) return b + (sib(b) ? 'ɪz' : (vl(b) ? 's' : 'z'));
        }
        if ((m = up.match(/^(.+)ED$/))) {   // quá khứ: -ed
            const stems = [m[1], m[1] + 'E'].concat(dbl(m[1]));
            if ((i = up.match(/^(.+)IED$/))) stems.unshift(i[1] + 'Y');
            for (st of stems) if ((b = base(st))) return b + (/[td]$/.test(tail(b)) ? 'ɪd' : (vl(b) ? 't' : 'd'));
        }
        if ((m = up.match(/^(.+)ING$/))) {  // -ing
            for (st of [m[1], m[1] + 'E'].concat(dbl(m[1]))) if ((b = base(st))) return tail(b) + 'ɪŋ';
        }
        if ((m = up.match(/^(.+)LY$/))) {   // -ly
            if ((b = base(m[1]))) return tail(b) + 'li';
        }
        return '';
    }
    function ipaAttr(word) { if (!shPrefs.ipa || !IPA.map) return ''; const v = ipaLookup(word); return v ? ' data-ipa="' + esc(v) + '"' : ''; }
    // Ẩn chữ: mỗi từ thành một dãy dấu • (đúng số chữ cái, không lộ chữ nào)
    function shMask(w) {
        const core = String(w).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '') || String(w);
        return '•'.repeat(Math.max(1, Array.from(core).length));
    }
    function shWordsHTML(s, mask) {
        SH.wTimes = null;
        const show = (w) => mask ? shMask(w) : w, ipa = (w) => mask ? '' : ipaAttr(w);
        // Khi bật IPA, mỗi khoảng trắng giữa 2 từ nằm trong 1 khối cao đúng bằng 1 dòng chữ -> bôi đen không kéo dài xuống phần IPA
        const sep = (!mask && shPrefs.ipa && IPA.map) ? '<span class="ipa-sp"> </span>' : ' ';
        if (s.words && s.words.length && !isTextMode) {
            SH.wTimes = s.words.map((w) => [w.startTime, w.endTime]);
            return s.words.map((w) => '<span class="sh-w"' + ipa(w.word) + '>' + esc(show(w.word)) + '</span>').join(sep);
        }
        return String(s.text).split(/\s+/).filter(Boolean).map((w) => '<span class="sh-w"' + ipa(w) + '>' + esc(show(w)) + '</span>').join(sep);
    }
    // Icon Play / Pause của nút đỏ (cùng hình với nút phát bên Chép chính tả)
    const SH_PLAY_ICONS = '<svg class="i-play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.6-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z"/></svg>' +
        '<svg class="i-pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>';
    function shActiveHTML(i) {
        const s = sentences[i], vi = s.vi && String(s.vi).trim();
        const blur = shPrefs.hide;
        let h = '<div class="sh-row active" data-i="' + i + '"><div class="sh-head"><span class="sh-num on">' + (i + 1) + '</span>' +
            '<button type="button" class="sh-speaker' + (SH.playing ? ' on' : '') + '" id="sh-play" data-act="play" title="' + (SH.playing ? 'Dừng' : 'Nghe mẫu') + ' (Tab)" aria-label="Nghe mẫu">' + SH_PLAY_ICONS + '</button>' +
            '<div class="sh-text big' + (blur ? ' masked' : '') + '" id="sh-text"' + '' + '>' + shWordsHTML(s, blur) + '</div>' +
            '<button type="button" class="sh-collapse" data-act="collapse" title="Dừng nghe">' + I.x + '</button></div>';
        if (shPrefs.tr && vi) h += '<div class="sh-vi big">' + esc(vi) + '</div>';
        h += '<div class="sh-progrow"><div class="ts-ctl">' + tsMarkup() + '</div>' +
            '<span class="rate-ctl">' + RS_DN + '<label class="sh-rate" title="Tốc độ nghe mẫu: gõ số bất kỳ từ 0.25 đến 2 rồi bấm Enter, hoặc nhấn giữ rồi kéo lên/xuống để tăng/giảm (↑/↓ chỉnh từng 0.1)">' + I.gauge +
            '<input id="sh-rate" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="5" value="' + rateFmt(settings.playbackRate || 1) + '" aria-label="Tốc độ nghe mẫu"><span>x</span></label>' + RS_UP +
            '<button type="button" class="ts-step ts-reset" id="sh-rate-reset" title="Đưa tốc độ về 1.0x" aria-label="Đặt lại tốc độ về 1.0x"' + (Math.abs((settings.playbackRate || 1) - 1) < 0.001 ? ' disabled' : '') + '>' + TS_RS + '</button></span></div>';
        h += '<div id="sh-recbox"></div>';
        h += '<div class="sh-nav"><button type="button" class="dc-btn" data-act="prev"' + (i <= 0 ? ' disabled' : '') + '>' + I.left.replace('<svg', '<svg style="width:15px;height:15px"') + 'Câu trước</button>' +
            '<div class="sh-keys"><span><kbd>Tab</kbd>Play/Phát</span><span><kbd>R</kbd>thu âm</span><span><kbd>Space</kbd>Câu sau</span><span><kbd>1</kbd>–<kbd>4</kbd>Tốc độ</span></div>' +
            '<button type="button" class="dc-btn primary" data-act="next"' + (i >= sentences.length - 1 ? ' disabled' : '') + '>Câu sau' + I.right.replace('<svg', '<svg style="width:15px;height:15px"') + '</button></div></div>';
        return h;
    }
    function shRowHTML(i) {
        const s = sentences[i], st = shStatus(i), vi = s.vi && String(s.vi).trim();
        const blur = shPrefs.hide;
        const badge = SH.rec[i] ? '<span class="sh-badge done">Đã luyện</span>' : '';
        return '<div class="sh-row ' + st + '" data-i="' + i + '"><span class="sh-num">' + (i + 1) + '</span><div class="sh-body"><div class="sh-text' + (blur ? ' masked' : '') + '">' + esc(blur ? String(s.text).split(/\s+/).filter(Boolean).map(shMask).join(' ') : s.text) + '</div>' +
            (shPrefs.tr && vi ? '<div class="sh-vi">' + esc(vi) + '</div>' : '') + '</div><div class="sh-side">' + badge +
            '<button type="button" class="sh-ico" data-act="row-play" title="Nghe câu này">' + I.speaker + '</button></div></div>';
    }
    function shPass(i) {
        if (i === SH.idx) return true;
        if (SH.filter === 'todo') return !SH.rec[i];
        return true;
    }
    function shRender(keepScroll) {
        const list = $('sh-list'); if (!list) return;
        let h = '';
        for (let i = 0; i < sentences.length; i++) {
            if (!shPass(i)) continue;
            h += i === SH.idx ? shActiveHTML(i) : shRowHTML(i);
        }
        list.innerHTML = h || '<div class="sh-empty">Không có câu nào phù hợp với bộ lọc này.</div>';
        const act = list.querySelector('.sh-row.active');
        SH.wEls = act ? Array.from(act.querySelectorAll('.sh-w')) : [];
        if (window.vsMarkShadow) window.vsMarkShadow();
        shRecUI(); shLoopUI();
        if (SH.playing) shPlayUI(true);
        const st = shStats();
        $('sh-sub').innerHTML = 'Đã luyện <b>' + st.done + '/' + st.total + '</b> câu · Còn <b>' + (st.total - st.done) + '</b> câu';
        $('sh-bar').style.width = (st.total ? st.done / st.total * 100 : 0) + '%';
        document.querySelectorAll('#sh-filter button').forEach((b) => b.classList.toggle('on', b.getAttribute('data-f') === SH.filter));
        const tr = $('sh-tr'), hv = hasVi();
        tr.disabled = !hv; tr.classList.toggle('on', hv && shPrefs.tr); tr.title = hv ? 'Hiện / ẩn bản dịch tiếng Việt' : 'Bài này chưa có bản dịch (dùng nút Song ngữ ở giao diện Mặc định để thêm)';
        $('sh-hide').classList.toggle('on', shPrefs.hide);
        $('sh-ipa').classList.toggle('on', shPrefs.ipa);
    }
    // Vẽ lại danh sách nhưng GIỮ NGUYÊN vị trí thẻ đang luyện trên màn hình (dùng khi bật/tắt Dịch nghĩa, Ẩn chữ, IPA, bộ lọc):
    // chiều cao các thẻ đổi nên nếu không bù lại thì cả màn hình bị trôi đi.
    function shScroller(el) {
        let q = el && el.parentElement;
        while (q && q !== document.body) {
            const o = getComputedStyle(q).overflowY;
            if ((o === 'auto' || o === 'scroll') && q.scrollHeight > q.clientHeight) return q;
            q = q.parentElement;
        }
        return document.scrollingElement || document.documentElement;
    }
    function shRenderKeep() {
        const old = document.querySelector('#sh-list .sh-row.active');
        const top0 = old ? old.getBoundingClientRect().top : null;
        const sc = old ? shScroller(old) : null;
        shRender();
        const act = document.querySelector('#sh-list .sh-row.active');
        if (!act || top0 === null || !sc) return;
        const d = act.getBoundingClientRect().top - top0;
        if (Math.abs(d) > 0.5) sc.scrollTo({ top: sc.scrollTop + d, behavior: 'instant' });
    }
    // play === true: vào câu rồi phát luôn (chỉ khi người dùng chủ động bấm nút loa ở câu đó). Mặc định KHÔNG tự phát.
    function shGo(i, play) {
        if (!sentences.length) return;
        i = Math.max(0, Math.min(sentences.length - 1, i));
        shStopLoop();
        if (SH.recording) shRecStop();
        shStopModel(true); shStopUser();
        SH.idx = i; shSave(); shRender();
        const act = document.querySelector('#sh-list .sh-row.active');
        if (act) { try { act.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {} }
        if (play === true) shPlayLater();
    }
    function shEnter() {
        if (!sentences || !sentences.length) { toast('Chưa có câu nào để luyện shadowing'); window.pvSetView('default'); return; }
        if (SH.vid !== currentVideoId || SH.allSig !== allSig()) shLoad();
        SH.idx = Math.min(SH.idx, sentences.length - 1);
        if (!hasVi()) shPrefs.tr = false;
        shRender();
        setTimeout(() => { const act = document.querySelector('#sh-list .sh-row.active'); if (act) { try { act.scrollIntoView({ block: 'start' }); } catch (e) {} } }, 30);
    }
    function shLeave() {
        shStopLoop();
        if (SH.recording) shRecStop();
        shStopModel(true); shStopUser(); shMeterStop();
        shRestoreTip();
        if (SH.vid) shSave();
        try { if (!isTextMode && ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
    }

    /* ----- Bôi đen chữ -> popup chỉ có nút "Loop" (dùng lại popup có sẵn của giao diện Mặc định) ----- */
    function shRestoreTip() {
        try { hideLookupTooltip(); } catch (e) {}
        ['btn-lookup-action', 'btn-save-action'].forEach((id) => { const el = $(id); if (el) el.style.display = ''; });
        const p = $('btn-pronounce-action'); if (p) p.style.display = 'none';
        SH.sel = null;
    }
    function shCheckSelection() {
        if (SHT.mode) return;   // đang chạm đôi / kéo chọn bằng ngón tay: đợi thả tay mới hiện popup
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        const box = $('sh-text');
        const none = () => { SH.sel = null; hideLookupTooltip(); };
        if (!text || !sel.rangeCount || !box || box.classList.contains('masked')) { none(); return; }
        const range = sel.getRangeAt(0);
        if (!box.contains(range.commonAncestorContainer)) { none(); return; }
        let a = -1, b = -1;
        SH.wEls.forEach((el, i) => { if (range.intersectsNode(el)) { if (a < 0) a = i; b = i; } });
        const rect = range.getBoundingClientRect();
        if (a < 0 || (rect.width === 0 && rect.height === 0)) { none(); return; }
        SH.sel = { a: a, b: b, text: text };
        // Dùng lại nút "Lưu" và "Phát âm" của giao diện Mặc định: chúng đọc vùng bôi đen từ các biến này
        selectedTextForLookup = text; selectedRangeForLoop = range.cloneRange(); vocabAreaCtx = null;
        const lk = $('btn-lookup-action'); if (lk) lk.style.display = '';   // giống giao diện Mặc định: Tra nghĩa + Phát âm + Loop + Lưu
        const sv = $('btn-save-action'); if (sv) sv.style.display = '';
        const pr = $('btn-pronounce-action');
        if (pr) {
            const pw = getSingleWordForLookup(text) || (text && text.trim().length <= 150 ? text.trim() : '');
            pr.style.display = pw ? '' : 'none';
            if (pw) { pr.title = 'Phát âm "' + pw + '" · Shift + click: Mở Từ điển Larousse'; }
        }
        const lp = $('btn-loop-action'); if (lp) lp.style.display = '';
        const tip = $('lookup-tooltip');
        tip.style.left = (rect.left + rect.width / 2) + 'px';
        tip.style.top = rect.top + 'px';
        tip.style.display = 'block';
        const half = tip.offsetWidth / 2;
        tip.style.left = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8) + 'px';
    }
    // checkTextSelection() (bôi đen ở giao diện Mặc định) hỏi hàm này trước: đang ở Shadowing thì giao diện này tự xử lý
    // Câu đang luyện ở giao diện Shadowing (để lưu từ vựng đúng câu chứa đoạn bôi đen)
    window.pvActiveSentence = function () { return view === 'shadowing' ? (sentences[SH.idx] || null) : (view === 'dictation' ? (sentences[DC.idx] || null) : null); };
    window.pvSelIdx = function () { return view === 'shadowing' ? SH.idx : (view === 'dictation' ? DC.idx : -1); };
    // Chép chính tả: bôi đen chữ trong phần đáp án (sau khi kiểm tra / xem đáp án) -> popup Tra nghĩa + Phát âm + Lưu như giao diện Mặc định
    function dcCheckSelection() {
        if (!DC.checked) return false;
        const box = $('dc-diff'), sel = window.getSelection();
        if (!box || !sel || !sel.rangeCount || sel.isCollapsed) return false;
        const range = sel.getRangeAt(0);
        if (!box.contains(range.commonAncestorContainer)) return false;
        const bad = (n) => { const el = n && (n.nodeType === 1 ? n : n.parentElement); return !!(el && el.closest && el.closest('.dc-typed, .dc-d.extra')); };
        if (bad(sel.anchorNode) || bad(sel.focusNode)) { hideLookupTooltip(); return true; }
        // Chỉ lấy chữ của đáp án: bỏ chữ gõ sai (nhỏ phía trên) và chữ gõ thừa (gạch ngang)
        const frag = range.cloneContents();
        frag.querySelectorAll('.dc-typed, .dc-d.extra').forEach((n) => n.remove());
        const text = (frag.textContent || '').replace(/\s+/g, ' ').trim();
        const rect = range.getBoundingClientRect();
        if (!text || (rect.width === 0 && rect.height === 0)) { hideLookupTooltip(); return true; }
        selectedTextForLookup = text; selectedRangeForLoop = range.cloneRange(); vocabAreaCtx = null;
        const lk = $('btn-lookup-action'); if (lk) lk.style.display = '';
        const sv = $('btn-save-action'); if (sv) sv.style.display = '';
        const lp = $('btn-loop-action'); if (lp) lp.style.display = 'none';   // Loop điều khiển video riêng, không dùng ở đây
        const pr = $('btn-pronounce-action');
        if (pr) {
            const pw = getSingleWordForLookup(text) || (text && text.trim().length <= 150 ? text.trim() : '');
            pr.style.display = pw ? '' : 'none';
            if (pw) { pr.title = 'Phát âm "' + pw + '" · Shift + click: Mở Từ điển Larousse'; }
        }
        const tip = $('lookup-tooltip');
        tip.style.left = (rect.left + rect.width / 2) + 'px';
        tip.style.top = rect.top + 'px';
        tip.style.display = 'block';
        const half = tip.offsetWidth / 2;
        tip.style.left = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8) + 'px';
        return true;
    }
    window.pvSelectionHook = function () {
        if (view === 'dictation' && !$('screen-practice').classList.contains('hidden')) return dcCheckSelection();
        if (view !== 'shadowing') return false;
        shCheckSelection();
        return true;
    };
    $('lookup-tooltip').addEventListener('click', (e) => {
        if (view !== 'shadowing') return;
        if (!e.target.closest('#btn-loop-action')) return;
        e.preventDefault(); e.stopPropagation();   // chặn nút Loop của giao diện Mặc định (nó điều khiển video riêng)
        const sel = SH.sel;
        if (!e.shiftKey) { hideLookupTooltip(); try { window.getSelection().removeAllRanges(); } catch (er) {} }
        if (sel) shStartLoop(sel);
    }, true);

    $('sh-list').addEventListener('click', (e) => {
        const a = e.target.closest('[data-act]');
        if (a) {
            const act = a.getAttribute('data-act');
            const rowEl = a.closest('.sh-row'); const ri = rowEl ? +rowEl.getAttribute('data-i') : SH.idx;
            if (act === 'row-play') { e.stopPropagation(); shGo(ri, true); return; }
            if (act === 'play') { if (SH.playing) { shStopLoop(); shStopModel(true); } else shPlay(); return; }
            if (act === 'rec') { shRecStart(); return; }
            if (act === 'rec-stop') { shRecStop(); return; }
            if (act === 'mine') { if (SH.userPlaying) shStopUser(); else shUserPlay(); return; }
            if (act === 'prev') { shGo(SH.idx - 1, true); return; }
            if (act === 'next') { shGo(SH.idx + 1, true); return; }
            if (act === 'collapse') { shStopLoop(); shStopModel(true); shStopUser(); return; }
            if (act === 'loop-stop') { shStopLoop(); shStopModel(true); return; }
            if (act === 'loop-dec' || act === 'loop-inc') { adjustLoopDelay(act === 'loop-inc' ? 1 : -1); const l = $('sh-loop-delay'); if (l) l.textContent = loopDelaySeconds + 's'; return; }
        }
        const w = e.target.closest('.sh-w');
        if (w && w.closest('.sh-row.active')) { shWordClick(w); return; }
        const row = e.target.closest('.sh-row[data-i]');
        if (row && !row.classList.contains('active')) shGo(+row.getAttribute('data-i'));
    });
    // ===== CẢM ỨNG (điện thoại / iPad) cho chữ ở Shadowing, giống giao diện Mặc định:
    // chạm 1 lần = nghe từ chỗ đó | chạm 2 lần = chọn từ | chạm 2 lần, giữ lần 2 rồi kéo = chọn theo ngón tay | chạm 3 lần = chọn cả câu
    // (thả tay -> hiện popup Tra nghĩa / Loop / Lưu như khi bôi đen bằng chuột) =====
    (function shTouchSelection() {
        const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/u;
        const WSEL = '#sh-list .sh-row.active .sh-w';
        const gap = () => (typeof MULTI_CLICK_MS === 'number' ? MULTI_CLICK_MS : 170);
        let startX = 0, startY = 0, moved = false, multi = false, lastEnd = 0, lastX = 0, lastY = 0, taps = 0;
        let anchorSp = null, dragged = false;
        const boxOf = () => $('sh-text');
        const usable = () => { const b = boxOf(); return view === 'shadowing' && b && !b.classList.contains('masked'); };
        function wordRange(sp) {
            const node = sp.firstChild, r = document.createRange();
            const m = node && node.nodeType === 3 ? WORD_RE.exec(node.nodeValue) : null;
            if (m) { r.setStart(node, m.index); r.setEnd(node, m.index + m[0].length); } else r.selectNodeContents(sp);
            return r;
        }
        function setSel(r) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); }
        function sentenceRange() {
            const w = SH.wEls; if (!w.length) return null;
            const r = document.createRange(); r.setStartBefore(w[0]); r.setEndAfter(w[w.length - 1]); return r;
        }
        // Chọn từ theo KIỂU CÁC APP KHÁC: xác định DÒNG theo toạ độ dọc của ngón tay trước, rồi chọn từ trong dòng theo toạ độ ngang
        // (lệch trái -> từ đầu dòng, lệch phải -> từ cuối dòng). Tránh việc kéo xuống dòng dưới nhưng vẫn dính vào từ gần nhất của dòng trên.
        function pickByRow(ws, x, y) {
          const rows = [];
          for (let i = 0; i < ws.length; i++) {
            const b = ws[i].getBoundingClientRect();
            if (!b.width && !b.height) continue;
            const mid = (b.top + b.bottom) / 2, R = rows[rows.length - 1];
            if (R && mid >= R.top && mid <= R.bottom) { R.top = Math.min(R.top, b.top); R.bottom = Math.max(R.bottom, b.bottom); R.items.push({ w: ws[i], b: b }); }
            else rows.push({ top: b.top, bottom: b.bottom, items: [{ w: ws[i], b: b }] });
          }
          if (!rows.length) return null;
          let row = rows[0], bd = Infinity, bc = Infinity;
          for (let i = 0; i < rows.length; i++) {
            const R = rows[i];
            const d = y < R.top ? R.top - y : (y > R.bottom ? y - R.bottom : 0);
            const c = Math.abs(y - (R.top + R.bottom) / 2);
            if (d < bd || (d === bd && c < bc)) { bd = d; bc = c; row = R; }
          }
          let best = null, bx = Infinity;
          for (let i = 0; i < row.items.length; i++) {
            const b = row.items[i].b;
            const dx = x < b.left ? b.left - x : (x > b.right ? x - b.right : 0);
            if (dx < bx) { bx = dx; best = row.items[i].w; }
          }
          return best;
        }
        function nearestWord(x, y) {
            return pickByRow(SH.wEls, x, y);
        }
        function extendTo(cur) {
            const a = wordRange(anchorSp), c = wordRange(cur);
            const forward = anchorSp === cur || (anchorSp.compareDocumentPosition(cur) & Node.DOCUMENT_POSITION_FOLLOWING);
            const r = document.createRange();
            if (forward) { r.setStart(a.startContainer, a.startOffset); r.setEnd(c.endContainer, c.endOffset); }
            else { r.setStart(c.startContainer, c.startOffset); r.setEnd(a.endContainer, a.endOffset); }
            setSel(r);
        }
        document.addEventListener('touchstart', (e) => {
            SHT.mode = 0;
            multi = e.touches.length > 1;
            if (multi || !usable()) { taps = 0; return; }
            const t = e.touches[0];
            moved = false; startX = t.clientX; startY = t.clientY;
            const sp = e.target && e.target.closest ? e.target.closest(WSEL) : null;
            if (!sp) { taps = 0; return; }
            const now = Date.now();
            const seq = (taps > 0 && now - lastEnd < gap() && Math.hypot(t.clientX - lastX, t.clientY - lastY) < 40) ? taps + 1 : 1;
            if (seq < 2) return;                      // chạm 1 lần: giữ nguyên (nghe từ chỗ đó, xử lý ở sự kiện click)
            SH.wEls.forEach((w) => { if (w._shT) { clearTimeout(w._shT); w._shT = null; } });   // huỷ lệnh "nghe từ chỗ đó" của lần chạm 1
            if (e.cancelable) e.preventDefault();     // chặn cuộn trang + click giả làm mất vùng chọn
            hideLookupTooltip();
            dragged = false;
            if (seq === 2) { SHT.mode = 2; anchorSp = sp; setSel(wordRange(sp)); }
            else { SHT.mode = 3; const r = sentenceRange(); if (r) setSel(r); }
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            const t = e.touches[0]; if (!t) return;
            if (Math.hypot(t.clientX - startX, t.clientY - startY) > 10) moved = true;
            if (SHT.mode !== 2 || !moved) return;
            dragged = true;
            const box = boxOf();
            if (box) {                                // kéo sát mép trên/dưới màn hình thì tự cuộn
                const sc = shScroller(box);
                if (t.clientY < 70) sc.scrollTop -= 10; else if (t.clientY > window.innerHeight - 70) sc.scrollTop += 10;
            }
            const el = document.elementFromPoint(t.clientX, t.clientY);
            let cur = el && el.closest ? el.closest(WSEL) : null;
            if (!cur) cur = nearestWord(t.clientX, t.clientY);
            if (cur) extendTo(cur);
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            if (SHT.mode) {
                if (e.cancelable) e.preventDefault();
                const was = SHT.mode;
                SHT.mode = 0;
                setTimeout(shCheckSelection, 30);     // thả tay -> hiện popup Tra nghĩa / Loop / Lưu
                setTimeout(shCheckSelection, 250);
                if (was === 2 && !dragged) { taps = 2; lastEnd = Date.now(); lastX = t.clientX; lastY = t.clientY; }   // chờ lần chạm thứ 3
                else taps = 0;
                return;
            }
            if (multi || moved || !usable()) { taps = 0; return; }
            const sp = e.target && e.target.closest ? e.target.closest(WSEL) : null;
            if (!sp) { taps = 0; return; }
            taps = 1; lastEnd = Date.now(); lastX = t.clientX; lastY = t.clientY;
        }, { passive: false });
        document.addEventListener('touchcancel', () => { SHT.mode = 0; taps = 0; }, { passive: true });
    })();
    $('sh-list').addEventListener('dblclick', (e) => {
        const w = e.target.closest('.sh-w');
        if (w && w._shT) { clearTimeout(w._shT); w._shT = null; }
    });
    $('sh-list').addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('.sh-speeds button[data-sp]'); if (!b) return;
        const v = parseFloat(b.getAttribute('data-sp'));
        const changed = Math.abs(v - (settings.playbackRate || 1)) > 0.001;
        setRate(v); shSyncRate(); setTimeout(shSyncRate, 400);
        if (changed && SH.tts) { const rg = SH.loop ? SH.loop.range : null; shPlay(rg, !!rg); }   // giọng đọc máy phải đọc lại mới đổi tốc độ
        b.blur();
    });
    $('sh-list').addEventListener('keydown', (e) => { if (e.target && e.target.id === 'sh-rate') shRateKey(e); });
    $('sh-list').addEventListener('focusin', (e) => { if (e.target && e.target.id === 'sh-rate') e.target.select(); });
    $('sh-list').addEventListener('focusout', (e) => { if (e.target && e.target.id === 'sh-rate') shRateCommit(); });
    function shUserPlay() {
        const v = SH.voice[SH.idx]; if (!v) return;
        shStopLoop(); shStopModel(true); shStopUser();
        const a = new Audio(v.url); SH.userAudio = a; SH.userPlaying = true;
        a.onended = () => { SH.userPlaying = false; SH.userAudio = null; shUserUI(); };
        a.play().catch(() => { SH.userPlaying = false; shUserUI(); });
        shUserUI();
    }
    $('sh-filter').addEventListener('click', (e) => { const b = e.target.closest('button[data-f]'); if (!b) return; SH.filter = b.getAttribute('data-f'); shRenderKeep(); });
    $('sh-tr').addEventListener('click', () => { if (!hasVi()) return; shPrefs.tr = !shPrefs.tr; shSavePrefs(); shRenderKeep(); });
    $('sh-hide').addEventListener('click', () => { shPrefs.hide = !shPrefs.hide; shSavePrefs(); shRenderKeep(); });
    $('sh-ipa').addEventListener('click', () => {
        const btn = $('sh-ipa');
        if (shPrefs.ipa) { shPrefs.ipa = false; shRenderKeep(); return; }
        if (IPA.map) { shPrefs.ipa = true; shRenderKeep(); return; }
        if (btn.disabled) return;
        btn.disabled = true; btn.textContent = 'Đang tải IPA…';
        ipaLoad().then(() => { shPrefs.ipa = true; }).catch(() => {
            toast('Không tải được từ điển IPA. Hãy upload file cmudict-0.7b-ipa.txt (hoặc cmudict-0_7b-ipa.txt) vào thư mục assets, và mở app qua http/https');
        }).then(() => { btn.disabled = false; btn.textContent = 'Phiên âm IPA'; if (view === 'shadowing') shRenderKeep(); });
    });
    // Đăng ký ở pha "capture" để các phím tắt luôn tới được đây trước mọi trình xử lý khác (và không bị trình duyệt cuộn trang)
    function shKeyHandler(e) {
        if (e.__shHandled) return;   // tránh xử lý 2 lần nếu sự kiện đi qua nhiều trình nghe
        if (view !== 'shadowing' || $('screen-practice').classList.contains('hidden')) return;
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = (e.code === 'Space' || e.key === ' ') ? ' ' : e.key;
        const blurBtn = () => { if (t && t.tagName === 'BUTTON') t.blur(); };
        let nav = 0;   // +1: câu sau, -1: câu trước
        if (k === 'Tab' && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); blurBtn(); shPlay(); return; }   // Tab = nghe mẫu từ đầu câu (giống giao diện Chép chính tả)
        if (k === 'r' || k === 'R') { e.preventDefault(); e.stopPropagation(); SH.recording ? shRecStop() : shRecStart(); return; }
        if (k === 'l' || k === 'L') { e.preventDefault(); e.stopPropagation(); if (SH.voice[SH.idx]) (SH.userPlaying ? shStopUser() : shUserPlay()); return; }
        if ((k === 'h' || k === 'H') && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); e.__shHandled = true; if (e.repeat) return; blurBtn(); shPrefs.hide = !shPrefs.hide; shSavePrefs(); shRenderKeep(); return; }   // H = Ẩn chữ / hiện chữ
        if (!e.shiftKey && (k === '1' || k === '2' || k === '3' || k === '4')) {   // 1-4 = tốc độ 0.5 / 0.75 / 0.9 / 1
            e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); e.__shHandled = true;
            const inp = $('sh-rate'); if (inp) { inp.value = rateFmt([0.5, 0.75, 0.9, 1][+k - 1]); shRateCommit(); }
            return;
        }
        if (k === ' ') nav = e.shiftKey ? -1 : 1;                                      // Space = câu sau, Shift + Space = câu trước
        else if (k === 'ArrowRight' || k === 'n' || k === 'N') nav = 1;
        else if (k === 'ArrowLeft' || k === 'p' || k === 'P') nav = -1;
        if (!nav) return;
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();   // chặn mặc định của trình duyệt (cuộn trang / quay lại) và các trình xử lý khác
        e.__shHandled = true;
        if (e.repeat) return;                       // giữ phím không được nhảy liên tục qua nhiều câu
        blurBtn();
        shGo(SH.idx + nav, true);                   // chuyển câu bằng phím -> tự phát audio
    }
    // Đăng ký ở window + pha "capture": chạy trước mọi trình nghe khác của document
    window.addEventListener('keydown', shKeyHandler, true);
    // Khi bấm vào khung video YouTube, focus rơi vào iframe và phím không còn tới trang nữa -> trả focus về trang để phím tắt luôn hoạt động
    window.addEventListener('blur', () => {
        setTimeout(() => {
            const a = document.activeElement;
            if (view === 'shadowing' && a && a.tagName === 'IFRAME') { try { a.blur(); window.focus(); } catch (err) {} }
        }, 0);
    });

    /* ====================== CỘT DANH SÁCH CÂU (CHÉP CHÍNH TẢ) ====================== */
    function renderSide() {
        const grid = $('dc-side-grid'); if (!grid) return;
        let g = '';
        for (let i = 0; i < sentences.length; i++) g += '<button type="button" class="dc-chip ' + statusOf(i) + (i === DC.idx ? ' cur' : '') + '" data-i="' + i + '" title="Câu ' + (i + 1) + '">' + (i + 1) + '</button>';
        grid.innerHTML = g;
        const st = stats();
        let perfect = 0, other = 0;
        for (let i = 0; i < sentences.length; i++) { const s2 = statusOf(i); if (s2 === 'perfect') perfect++; else if (s2 !== 'todo') other++; }
        const tot = Math.max(1, st.total);
        $('dc-side-bar').innerHTML = '<i class="p" style="width:' + (perfect / tot * 100) + '%"></i><i class="o" style="width:' + (other / tot * 100) + '%"></i>';
        $('dc-side-big').innerHTML = '<b>' + st.done + '</b><span>/ ' + st.total + ' câu đã làm</span>';
        $('dc-side-meta').innerHTML = '<span>Còn <b>' + (st.total - st.done) + '</b> câu</span><span>Chính xác TB <b>' + (st.done && st.avg ? st.avg + '%' : (st.done ? '0%' : '–')) + '</b></span>';
        const cur = grid.querySelector('.dc-chip.cur');
        if (cur) { try { cur.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
    }
    $('dc-side-grid').addEventListener('click', (e) => { const c = e.target.closest('.dc-chip[data-i]'); if (c) go(+c.getAttribute('data-i')); });
    function setSide(on) {
        prefs.side = !!on; savePrefs();
        $('pv-dictation').classList.toggle('side-off', !prefs.side);
    }
    $('dc-side-hide').addEventListener('click', () => setSide(false));
    $('dc-side-show').addEventListener('click', () => setSide(true));
    $('pv-dictation').classList.toggle('side-off', prefs.side === false);


    /* ====================== NÚT ▼ / ▲ CHỈNH TỐC ĐỘ 0.1 (Mặc định + Shadowing + Chép chính tả) ====================== */
    document.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('button[data-rstep]'); if (!b) return;
        e.preventDefault();
        const wrap = b.closest('.rate-ctl'), inp = wrap && wrap.querySelector('input'); if (!inp) return;
        const cur = parseRateInput(inp.value), base = cur === null ? (settings.playbackRate || 1) : cur;
        const dir = +b.getAttribute('data-rstep') > 0 ? 1 : -1;
        inp.value = rateFmt(Math.max(0.25, Math.min(2, Math.round((base + dir * 0.1) * 100) / 100)));
        if (inp.id === 'sh-rate') shRateCommit();
        else if (inp.id === 'dc-rate') dcRateCommit();
        else commitRateInput();
        try { b.blur(); } catch (err) {}
    });

    // Nút reset tốc độ của giao diện Shadowing: về 1.0x
    document.addEventListener('click', (e) => {
        const b = e.target.closest && e.target.closest('#sh-rate-reset'); if (!b) return;
        e.preventDefault();
        const inp = $('sh-rate'); if (inp) { inp.value = rateFmt(1); shRateCommit(); }
        try { b.blur(); } catch (err) {}
    });

    // Phụ đề đè lên video: chỉ còn tiếng Việt (tiếng Pháp đã có ở thẻ phụ đề bên dưới); bật / tắt ở nút CC (chỉ hiện khi video có bản dịch)
    (function () {
        const vi = $('vid-vi'); if (!vi) return;
        const fade = $('vid-fade');
        let last = '';
        function upd() {
            const idx = (!isTextMode && sentences && sentences.length) ? Math.max(0, Math.min(sentences.length - 1, currentSentenceIndex || 0)) : -1;
            const s = idx >= 0 ? sentences[idx] : null;
            const showVi = window.VP ? VP.showVi() : !!settings.bilingual;
            if (fade) fade.classList.toggle('on', !isTextMode && !!showVi);   // lớp tối dưới video chỉ hiện khi phụ đề vàng đang bật
            const v = (s && showVi && s.vi) ? String(s.vi).trim() : '';
            if (v === last) return; last = v;
            vi.firstChild.textContent = v; vi.classList.toggle('on', !!v);
        }
        setInterval(upd, 120);
    })();
    // Ô chỉnh tốc độ luôn cao bằng nút +5s bên cạnh (đo thật, nên đúng cả khi màn hình đổi cỡ)
    (function () {
        const b = document.querySelector('button[onclick="seekRelative(5)"]'); if (!b) return;
        const sync = () => { const h = b.offsetHeight; if (h) document.documentElement.style.setProperty('--rate-h', h + 'px'); };
        sync();
        try { new ResizeObserver(sync).observe(b); } catch (e) { window.addEventListener('resize', sync); }
    })();

    /* ====================== THẺ PHỤ ĐỀ CÂU HIỆN TẠI (giao diện Mặc định, máy tính + iPad ngang) ======================
       Hiện chữ Anh của câu đang phát + IPA dưới từng chữ. Bấm chữ = phát từ chữ đó; bôi đen = popup Tra nghĩa / Phát âm / Loop / Lưu
       (các chữ có class .sub-word-unit + data-start / data-end nên mọi chức năng của phụ đề bên phải dùng lại được). */
    (function () {
        const card = $('cs-card'), box = $('cs-text'), btnIpa = $('cs-ipa'), btnPrev = $('cs-prev'), btnNext = $('cs-next');
        if (!card || !box) return;
        const mq = window.matchMedia('(min-width: 1024px) and (orientation: landscape), (min-width: 1101px)');
        const KEY = 'shadowing_cs_ipa_v1';
        let ipaOn = false;   // IPA luôn TẮT khi mở video; ai cần thì tự bấm nút IPA để bật (không nhớ trạng thái của lần trước)
        let lastKey = '', curEl = null, wordEls = [], ipaAsked = false, ipaFailed = false;

        function tokens(s) {
            if (s.words && s.words.length) return s.words.map((w) => ({ t: String(w.word), a: w.startTime, b: w.endTime }));
            const raw = String(s.text || '').split(/\s+/).filter(Boolean);
            const dur = Math.max(0.6, s.endTime - s.startTime), step = dur / (raw.length || 1);
            return raw.map((t, i) => ({ t: t, a: +(s.startTime + i * step).toFixed(3), b: +(s.startTime + (i + 1) * step).toFixed(3) }));
        }
        function markCur(el) {
            if (curEl === el) return;
            if (curEl) curEl.classList.remove('cs-cur');
            if (el) el.classList.add('cs-cur');
            curEl = el;
        }
        function render(idx) {
            const s = sentences[idx];
            box.setAttribute('data-idx', String(idx));
            box.textContent = '';
            curEl = null; wordEls = [];
            if (!s) return;
            const toks = tokens(s);
            toks.forEach((w, i) => {
                const sp = document.createElement('span');
                sp.className = 'sub-word-unit cs-w';
                sp.textContent = w.t;
                sp.setAttribute('data-start', w.a);
                sp.setAttribute('data-end', w.b);
                if (ipaOn && IPA.map) { const v = ipaLookup(w.t); if (v) sp.setAttribute('data-ipa', v); }
                box.appendChild(sp);
                wordEls.push(sp);
                if (i < toks.length - 1) {
                    if (ipaOn && IPA.map) { const gap = document.createElement('span'); gap.className = 'ipa-sp'; gap.textContent = ' '; box.appendChild(gap); }
                    else box.appendChild(document.createTextNode(' '));
                }
            });
        }
        function ensureIpa() {
            if (!ipaOn || IPA.map || ipaAsked || ipaFailed) return;
            ipaAsked = true;
            ipaLoad().then(() => { lastKey = ''; }).catch(() => {
                ipaFailed = true;
                toast('Không tải được từ điển IPA cho thẻ phụ đề. Hãy upload file cmudict-0.7b-ipa.txt vào thư mục assets, và mở app qua http/https');
            }).then(() => { ipaAsked = false; });
        }
        let lastTsKey = '';
        function tick() {
            if (view !== 'default' || isTextMode) return;
            const n = (sentences && sentences.length) || 0;
            const idx = n ? Math.max(0, Math.min(n - 1, currentSentenceIndex || 0)) : -1;
            if (idx >= 0) {   // ô Thời gian: cập nhật khi đổi câu, hoặc khi mốc được chỉnh ở giao diện khác
                const tt = tsGet(idx), tk = idx + '|' + tt.s + '|' + tt.e + '|' + currentVideoId;
                if (tk !== lastTsKey) { lastTsKey = tk; tsRefresh(); }
            }
            const s = idx >= 0 ? sentences[idx] : null;
            const key = String(currentVideoId) + '\u0001' + idx + '\u0001' + (s ? s.text : '') + '\u0001' + (s && s.words ? s.words.length : 0) + '\u0001' + (ipaOn ? (IPA.map ? 1 : 0) : 2);
            if (key !== lastKey) {
                lastKey = key;
                // Câu đổi trong lúc đang bôi đen ở thẻ: vùng chọn sắp bị vẽ lại nên ẩn popup luôn
                try { if (selectedRangeForLoop && box.contains(selectedRangeForLoop.startContainer)) hideLookupTooltip(); } catch (e) {}
                render(idx);
                card.classList.toggle('empty', !s);
                if (btnPrev) btnPrev.disabled = idx <= 0;
                if (btnNext) btnNext.disabled = idx < 0 || idx >= n - 1;
                ensureIpa();
            }
            // Tô chữ đang đọc (theo nút Karaoke của giao diện Mặc định)
            let want = null;
            if (settings.karaokeMode && wordEls.length && ytPlayer && isPlayerReady && typeof ytPlayer.getCurrentTime === 'function') {
                let t = NaN; try { t = ytPlayer.getCurrentTime(); } catch (e) {}
                if (!isNaN(t)) {
                    for (let i = 0; i < wordEls.length; i++) {
                        const a = parseFloat(wordEls[i].getAttribute('data-start')), b = parseFloat(wordEls[i].getAttribute('data-end'));
                        if (t >= a - 0.02 && t < b - 0.01) { want = wordEls[i]; break; }
                    }
                }
            }
            markCur(want);
        }
        setInterval(tick, 80);

        // Bấm chữ = phát từ chữ đó (giống phụ đề bên phải: chờ MULTI_CLICK_MS để phân biệt với double-click chọn chữ)
        box.addEventListener('click', (e) => {
            const sp = e.target && e.target.closest ? e.target.closest('.cs-w') : null; if (!sp) return;
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 0) return;
            if (sp._wordClickTimer) return;   // click thứ 2 của double-click: đợi sự kiện dblclick huỷ click thứ 1
            sp._wordClickTimer = setTimeout(() => {
                sp._wordClickTimer = null;
                const s2 = window.getSelection();
                if (s2 && s2.toString().trim().length > 0) return;
                const idx = parseInt(box.getAttribute('data-idx'), 10), t = parseFloat(sp.getAttribute('data-start'));
                if (isNaN(t) || !sentences[idx]) return;
                const targetTime = Math.max(0, Number((t - 0.08).toFixed(3)));
                seekToTime(targetTime, idx, true, null, false);
                markCur(sp);
            }, typeof MULTI_CLICK_MS === 'number' ? MULTI_CLICK_MS : 170);
        });
        box.addEventListener('dblclick', (e) => {
            const sp = e.target && e.target.closest ? e.target.closest('.cs-w') : null;
            if (sp && sp._wordClickTimer) { clearTimeout(sp._wordClickTimer); sp._wordClickTimer = null; }
        });

        const btnAuto = $('cs-auto');
        if (btnAuto) {
            btnAuto.setAttribute('aria-checked', settings.sentenceAutoStop ? 'true' : 'false');
            btnAuto.addEventListener('click', () => {
                toggleSentenceAutoStop();
                try { btnAuto.blur(); } catch (e) {}
            });
        }
        function goSentence(d) {
            const n = (sentences && sentences.length) || 0; if (!n) return;
            const cur = Math.max(0, Math.min(n - 1, currentSentenceIndex || 0)), t = cur + d;
            if (t < 0 || t >= n) return;
            seekToTime(sentPlayStart(t), t, true, null, true);
        }
        if (btnPrev) btnPrev.addEventListener('click', () => { goSentence(-1); try { btnPrev.blur(); } catch (e) {} });
        if (btnNext) btnNext.addEventListener('click', () => { goSentence(1); try { btnNext.blur(); } catch (e) {} });

        function syncBtn() { btnIpa.classList.toggle('on', ipaOn); btnIpa.setAttribute('aria-pressed', ipaOn ? 'true' : 'false'); }
        btnIpa.addEventListener('click', () => {
            ipaOn = !ipaOn;
            try { localStorage.setItem(KEY, ipaOn ? '1' : '0'); } catch (e) {}
            if (ipaOn) ipaFailed = false;
            lastKey = ''; syncBtn(); tick();
            try { btnIpa.blur(); } catch (e) {}
        });
        syncBtn();
        // Mở video nào cũng tắt IPA (gọi từ trackAndShowVideoStats; thêm 1 lớp dự phòng khi đổi sang video khác)
        window.csIpaReset = function () {
            if (!ipaOn) return;
            ipaOn = false; lastKey = ''; syncBtn();
            try { tick(); } catch (e) {}
        };
        let vidSeen = '';
        setInterval(() => { if (currentVideoId !== vidSeen) { vidSeen = currentVideoId; window.csIpaReset(); } }, 200);
    })();

    $('dc-ts').innerHTML = tsMarkup();
    if ($('cs-ts')) $('cs-ts').innerHTML = tsMarkup();
    applyView('default');   // khởi tạo biểu tượng + tên giao diện trên nút chuyển
    // Danh sách giọng đọc của trình duyệt nạp bất đồng bộ
    try { if ('speechSynthesis' in window) speechSynthesis.getVoices(); } catch (e) {}
  })();
  