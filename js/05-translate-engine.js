
(function () {
  'use strict';
  // Link tải extension nhập video tiếng Việt. Mặc định: file zip nằm trong thư mục zip-files/. Nếu sau này đưa lên Chrome Web Store thì thay bằng link https://...
  const VT_EXT_URL = 'zip-files/ShadowingStudio-VN-Importer.zip';
  const LS = 'vtData_v1', LS_UI = 'vtUi_v1', BATCH = 80;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = (m) => { try { showVocabToast(m, false); } catch (e) { console.warn(m); } };
  const isTouch = !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);   // điện thoại / iPad: không tự phát, không tự bật bàn phím
  const rateFmt = (r) => Number.isInteger(r) ? r.toFixed(1) : String(+r.toFixed(2));
  let store = { videos: {} }, lib = [], rec = null, idx = -1, filter = 'all', libLoaded = false, saveT = 0, readAll = false;
  let ui = { side: true, rate: 1 };   // tuỳ chọn giao diện: hiện/ẩn cột danh sách câu, tốc độ nghe

  let legacyLoaded = false;   // dữ liệu cũ nằm trong localStorage -> sẽ được chuyển sang IndexedDB
  try { const j = JSON.parse(localStorage.getItem(LS) || 'null'); if (j && j.videos) { store = j; legacyLoaded = true; } } catch (e) {}
  try { const u = JSON.parse(localStorage.getItem(LS_UI) || 'null'); if (u) ui = Object.assign(ui, u); } catch (e) {}
  // ---------- Lưu trữ: IndexedDB (mỗi video 1 bản ghi, gần như không giới hạn dung lượng) ----------
  // Trước đây toàn bộ dữ liệu nằm trong localStorage (~5MB, dùng chung với lịch sử luyện tiếng Pháp, từ vựng...). Khi đầy, setItem
  // lỗi nhưng bị nuốt im lặng -> video vừa import / bản dịch AI vừa dán chỉ nằm trong RAM, tải lại trang là mất.
  const DB_NAME = 'vtStore_v1', OS = 'videos';
  let dbp = null, useIDB = true, lastSaveP = Promise.resolve(true), lastWarn = 0;
  function openDB() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!window.indexedDB) { rej(new Error('no indexedDB')); return; }
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => { if (!rq.result.objectStoreNames.contains(OS)) rq.result.createObjectStore(OS, { keyPath: 'key' }); };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error || new Error('indexedDB error'));
      rq.onblocked = () => rej(new Error('indexedDB blocked'));
    });
    return dbp;
  }
  const idbAll = () => openDB().then((db) => new Promise((res, rej) => { const rq = db.transaction(OS, 'readonly').objectStore(OS).getAll(); rq.onsuccess = () => res(rq.result || []); rq.onerror = () => rej(rq.error); }));
  const idbPut = (recs) => openDB().then((db) => new Promise((res, rej) => { const tx = db.transaction(OS, 'readwrite'), o = tx.objectStore(OS); recs.forEach((r) => o.put(r)); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('aborted')); }));
  const idbDel = (key) => openDB().then((db) => new Promise((res, rej) => { const tx = db.transaction(OS, 'readwrite'); tx.objectStore(OS).delete(key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }));
  // Gộp bản ghi trong DB vào RAM (tab khác có thể đã ghi): bản mới hơn thắng, riêng video đang mở thì giữ bản trong RAM
  async function mergeAll() {
    (await idbAll()).forEach((r) => {
      if (!r || !r.key || (rec && r.key === rec.key)) return;
      const m = store.videos[r.key];
      if (!m || (r.ts || 0) > (m.ts || 0)) store.videos[r.key] = r;
    });
  }
  const ready = (async () => {
    try {
      await openDB();
      await mergeAll();
      if (legacyLoaded) {   // chuyển dữ liệu cũ từ localStorage sang IndexedDB, thành công rồi mới xoá bản cũ
        const inDb = new Set((await idbAll()).map((r) => r.key));
        const missing = Object.values(store.videos).filter((r) => r && r.key && !inDb.has(r.key));
        if (missing.length) await idbPut(missing);
        try { localStorage.removeItem(LS); } catch (e) {}
      }
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    } catch (e) { useIDB = false; console.warn('[Luyện dịch] IndexedDB không dùng được, quay về localStorage', e); }
  })();
  async function refreshFromDB() { await ready; if (!useIDB) return; try { await mergeAll(); } catch (e) {} }
  function warnSave(msg) { if (Date.now() - lastWarn > 20000) { lastWarn = Date.now(); toast(msg); } }
  async function persist(recs) {
    await ready;
    if (!recs.length) return true;
    if (useIDB) {
      try { await idbPut(recs); return true; }
      catch (e) { console.warn('[Luyện dịch] Ghi IndexedDB lỗi, thử localStorage', e); useIDB = false; }
    }
    try { localStorage.setItem(LS, JSON.stringify(store)); return true; }
    catch (e) { warnSave('⚠ Không lưu được tiến độ luyện dịch (bộ nhớ trình duyệt đầy hoặc bị chặn). Dữ liệu chỉ còn trong phiên này.'); return false; }
  }
  // Lưu video đang mở + các video chỉ định thêm (keys). Trả về Promise<boolean> (đã ghi xong hay chưa)
  function save(keys) {
    const ks = new Set(Array.isArray(keys) ? keys : []); if (rec) ks.add(rec.key);
    lastSaveP = persist([...ks].map((k) => store.videos[k]).filter(Boolean));
    return lastSaveP;
  }
  function saveSoon() { clearTimeout(saveT); saveT = setTimeout(() => save(), 400); }
  // Thoát / chuyển tab: ghi ngay phần đang chờ debounce
  window.addEventListener('pagehide', () => { clearTimeout(saveT); save(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { clearTimeout(saveT); save(); } });
  function saveUi() { try { localStorage.setItem(LS_UI, JSON.stringify({ side: ui.side, rate: ui.rate })); } catch (e) {} }
  const hasTr = (s) => !!(s.lit || s.nat);
  const seenCount = (r) => r.sents.filter((s, i) => r.seen[i]).length;

  // ---------- Đọc bản dịch AI: hỗ trợ "1 / S: ... / T: ..." và JSON ----------
  function parseTr(txt) {
    const out = {}; let m, n = 0;
    const j = String(txt || '').replace(/```[a-z]*/gi, '').trim();
    if (/^[\[{]/.test(j)) {
      try {
        const a = JSON.parse(j);
        (Array.isArray(a) ? a : a.items || []).forEach((o) => {
          const k = +(o.n || o.id || o.i);
          if (k) out[k] = { lit: o.s || o.lit || o.literal || '', nat: o.t || o.nat || o.natural || '' };
        });
        if (Object.keys(out).length) return out;
      } catch (e) {}
    }
    j.split(/\r?\n/).forEach((raw) => {
      const l = raw.replace(/[*`_>#]/g, '').trim();
      if (!l) return;
      if ((m = /^\[?(\d+)\]?[.:)]?\s*$/.exec(l)) || (m = /^(\d+)[.)]\s+\S/.exec(l))) { n = +m[1]; out[n] = out[n] || { lit: '', nat: '' }; return; }
      if (!n) return;
      if ((m = /^(?:S|Sát nghĩa|Sát|Literal)\s*[:：\-]\s*(.*)$/i.exec(l))) out[n].lit = m[1].trim();
      else if ((m = /^(?:T|Thoáng|Tự nhiên|Natural)\s*[:：\-]\s*(.*)$/i.exec(l))) out[n].nat = m[1].trim();
    });
    Object.keys(out).forEach((k) => { if (!out[k].lit && !out[k].nat) delete out[k]; });
    return out;
  }

  // ---------- Nạp câu tiếng Việt ----------
  // Thư viện có sẵn nằm trong thư mục "Vietnamese Videos" (cùng chỗ với index.html):
  //   Vietnamese Videos/library-index.json            {"folders": ["_ID_Tên video", ...]}
  //   Vietnamese Videos/_ID_Tên video/video-data.json, <ID>.txt (phụ đề Việt), <ID>_timing.json (mốc thời gian câu + từ, có thể thiếu ở video cũ),
  //                                   <ID>_en.txt (bản dịch AI, có thể trống), prompt.txt
  let VT_DIR = 'Vietnamese Videos';   // hosting phân biệt hoa/thường: tự thử thêm 'Vietnamese videos' nếu thư mục đặt tên khác
  const dirUrl = (f) => encodeURIComponent(VT_DIR) + '/' + (f ? encodeURIComponent(f) + '/' : '');
  const CAT = { daily_life: 'Đời sống', story: 'Kể chuyện', news: 'Tin tức', interview: 'Phỏng vấn', podcast: 'Podcast', education: 'Học tập', business: 'Kinh doanh', tech: 'Công nghệ', health: 'Sức khỏe', humor: 'Hài hước', others: 'Khác' };
  const catLabel = (c) => CAT[String(c || '').toLowerCase()] || String(c || '').replace(/_/g, ' ').replace(/^./, (m) => m.toUpperCase());
  let libCat = 'all';
  const fin = (v) => (v !== '' && v != null && isFinite(+v)) ? +v : undefined;
  const toSent = (x) => {
    if (typeof x === 'string') return { t: x.trim(), lit: '', nat: '' };
    const o = { t: String(x.vi || x.text || x.t || '').trim(), lit: x.lit || '', nat: x.nat || '' };
    const s = fin(x.start), e = fin(x.end);
    if (s !== undefined) o.start = s;
    if (s !== undefined && e !== undefined && e > s) o.end = e;
    return o;
  };
  // File phụ đề .txt: mỗi dòng 1 câu, có thể bắt đầu bằng mốc giờ [mm:ss] (giữ lại làm mốc bắt đầu để phát âm thanh)
  function parseTxtLines(txt) {
    const re = /^\s*\[?(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,](\d+))?\]?\s*/;
    return String(txt || '').split(/\r?\n/).map((l) => {
      const m = re.exec(l);
      const t = l.replace(re, '').trim();
      let start;
      if (m) start = m[3] != null ? (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) : (+m[1]) * 60 + (+m[2]);
      return { t, start };
    }).filter((x) => x.t).map((x) => { const o = { t: x.t, lit: '', nat: '' }; if (x.start !== undefined) o.start = x.start; return o; });
  }
  // <ID>_timing.json: { sentences: [{ s, e, w: [[bắt đầu, kết thúc], ...] }] } — khớp theo thứ tự dòng của <ID>.txt
  function applyTiming(base, tj) {
    const a = tj && tj.sentences;
    if (!Array.isArray(a) || a.length !== base.length) return;
    a.forEach((x, i) => {
      const s = fin(x && x.s), e = fin(x && x.e);
      if (s === undefined) return;
      base[i].start = s;
      if (e !== undefined && e > s) base[i].end = e;
    });
  }
  async function fetchText(u) {
    const r = await fetch(u + (u.includes('?') ? '&' : '?') + 't=' + Date.now(), { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const t = await r.text();
    if (/^\s*<!doctype html/i.test(t)) throw new Error('not found');
    return t;
  }
  const loose = (t) => JSON.parse(t.replace(/,\s*([\]}])/g, '$1'));

  // ---------- Thư viện + trang chọn video ----------
  async function loadLib() {
    let folders = [];
    for (const d of ['Vietnamese Videos', 'Vietnamese videos']) {
      VT_DIR = d;
      try { const j = loose(await fetchText(dirUrl('') + 'library-index.json')); folders = Array.isArray(j) ? j : (j.folders || []); break; } catch (e) {}
    }
    if (!folders.length) VT_DIR = 'Vietnamese Videos';
    const seen = new Set();
    folders = folders.map((f) => String(f || '').trim()).filter((f) => f && !seen.has(f) && seen.add(f));
    const res = await Promise.allSettled(folders.map(async (f) => {
      const m = /^_([A-Za-z0-9_-]{11})_(.*)$/.exec(f);
      if (!m) throw new Error('Tên thư mục sai cú pháp: ' + f);
      const d = loose(await fetchText(dirUrl(f) + 'video-data.json'));
      return { id: m[1], folder: f, videoId: /^[\w-]{11}$/.test(d.videoId || '') && !/^demo/i.test(m[1]) ? d.videoId : '', title: d.title || m[2], channel: d.channelTitle || '', duration: d.duration || '', topic: d.category || '' };
    }));
    res.forEach((r) => { if (r.status === 'rejected') console.warn('[Thư viện Việt]', r.reason && r.reason.message); });
    lib = res.filter((r) => r.status === 'fulfilled').map((r) => r.value).reverse();   // video mới thêm (cuối index) hiện đầu
    libLoaded = true;
  }
  function cardHTML(o) {
    const thumb = o.videoId ? `<img loading="lazy" src="https://i.ytimg.com/vi/${esc(o.videoId)}/mqdefault.jpg" alt="" onerror="this.remove()">` : '';
    const pct = o.total ? Math.round(o.done / o.total * 100) : 0;
    const label = o.videoId ? '' : (o.kind === 'text' ? '📄 Bài viết' : 'Việt → Anh');
    const del = o.src === 'rec' ? `<button type="button" class="vt-del" data-del="${esc(o.key)}" title="Xóa khỏi danh sách" aria-label="Xóa khỏi danh sách">×</button>` : '';
    return `<div class="vt-card" data-k="${esc(o.key)}" data-src="${o.src}" tabindex="0">${del}<div class="vt-thumb">${thumb}<span style="position:relative;padding:0 14px;text-align:center">${label}</span>${o.duration ? `<span class="vt-dur">${esc(o.duration)}</span>` : ''}</div>
      <div class="vt-cb"><div class="vt-ct">${esc(o.title)}</div><div class="vt-cm">${o.channel ? `<span>${esc(o.channel)}</span>` : ''}${o.topic ? `<span>${esc(catLabel(o.topic))}</span>` : ''}${o.total ? `<span>${o.total} câu</span>` : ''}${o.tr ? '<span style="color:#86efac">Có bản dịch AI</span>' : ''}</div>
      <div class="vt-bar"><i style="width:${pct}%"></i></div></div></div>`;
  }
  function syncExtStrip() {
    const on = !!document.documentElement.dataset.shadowingViExtension, btn = $('vt-ext-btn');
    if (!btn) return;
    btn.style.display = on ? 'none' : ''; $('vt-ext-hint').style.display = on ? 'none' : '';
    $('vt-ext-text').innerHTML = on ? '✓ Đã cài extension. Mở một video YouTube tiếng Việt rồi bấm nút <b>Luyện dịch Việt → Pháp</b> dưới video, hoặc bôi đen một đoạn văn / bài báo tiếng Việt → chuột phải → <b>Luyện dịch Việt - Anh</b> để đưa vào đây.'
      : 'Để tự import video Youtube hoặc bài viết / bài báo tiếng Việt của riêng bạn,<br>vui lòng cài extension sau:';
  }
  new MutationObserver(syncExtStrip).observe(document.documentElement, { attributes: true, attributeFilter: ['data-shadowing-vi-extension'] });
  async function renderLanding() {
    const eb = $('vt-ext-btn'); eb.href = VT_EXT_URL; if (!/^https?:/i.test(VT_EXT_URL)) eb.setAttribute('download', ''); else eb.removeAttribute('download');
    syncExtStrip();
    if (!libLoaded) await loadLib();
    await refreshFromDB();
    let hs = Object.values(store.videos).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    if (!hs.length) {
      const sampleKey = 'sample:giao_tiep_co_ban';
      store.videos[sampleKey] = {
        key: sampleKey,
        kind: 'text',
        title: 'Hội thoại giao tiếp tiếng Pháp cơ bản',
        channel: 'French Shadowing Studio',
        duration: '5 câu',
        sents: [
          { t: "Xin chào, bạn có khỏe không?", lit: "Bonjour, comment allez-vous ?", nat: "Salut, comment ça va ?" },
          { t: "Tôi đang học tiếng Pháp mỗi ngày để đi du lịch Paris.", lit: "J'apprends le français chaque jour pour voyager à Paris.", nat: "J'étudie le français tous les jours pour visiter Paris." },
          { t: "Bạn có muốn đi uống cà phê với tôi vào chiều nay không?", lit: "Voulez-vous aller boire un café avec moi cet après-midi ?", nat: "Tu veux prendre un café avec moi cet après-midi ?" },
          { t: "Thời tiết hôm nay thật đẹp, trời trong xanh và có nắng nhẹ.", lit: "Le temps aujourd'hui est très beau, le ciel est clair avec un léger soleil.", nat: "Il fait vraiment un temps superbe aujourd'hui, bien ensoleillé." },
          { t: "Cảm ơn bạn rất nhiều vì sự giúp đỡ nhiệt tình này.", lit: "Merci beaucoup pour cette aide enthousiaste.", nat: "Merci infiniment pour ton aide précieuse !" }
        ],
        ans: {},
        seen: {},
        idx: 0,
        ts: Date.now()
      };
      save([sampleKey]);
      hs = Object.values(store.videos);
    }
    $('vt-hist-wrap').style.display = hs.length ? '' : 'none';
    {
      // Tiêu đề giống hàng "Video Bạn Đã Luyện Gần Đây" ở mục Luyện với Video: cùng icon, cùng kiểu chữ, có số lượng
      let ico = '';
      try { ico = CATEGORY_ICONS.history_pro.replace(/hist-/g, 'vthist-'); } catch (e) {}   // đổi id gradient để không trùng với hàng bên Luyện với Video
      let glow = '#38bdf8'; try { glow = rowGlowColor('text-sky-400'); } catch (e) {}
      const hh = $('vt-hist-head');
      if (hh) hh.innerHTML = `<div class="vt-hh-l"><span class="cat-row-ico" style="--ico-glow:${glow}">${ico}</span><h4>Bài Bạn Đã Luyện</h4><span class="vt-hh-count">${hs.length}</span></div>`;
    }
    $('vt-hist').innerHTML = hs.map((r) => cardHTML({ key: r.key, src: 'rec', kind: r.kind, videoId: r.videoId, title: r.title, channel: r.channel, duration: r.duration, total: r.sents.length, done: seenCount(r), tr: r.sents.some(hasTr) })).join('');
    const cats = [...new Set(lib.map((v) => v.topic).filter(Boolean))];
    if (libCat !== 'all' && !cats.includes(libCat)) libCat = 'all';
    $('vt-cats').innerHTML = cats.length > 1 ? ['all'].concat(cats).map((c) => `<button type="button" class="vt-chip${c === libCat ? ' on' : ''}" data-c="${esc(c)}">${c === 'all' ? 'Tất cả' : esc(catLabel(c))}</button>`).join('') : '';
    const shown = lib.filter((v) => libCat === 'all' || v.topic === libCat);
    $('vt-lib').innerHTML = shown.length ? shown.map((v) => {
      const r = store.videos['lib:' + v.id];
      return cardHTML({ key: v.id, src: 'lib', videoId: v.videoId, title: v.title, channel: v.channel, duration: v.duration, topic: v.topic, total: r ? r.sents.length : 0, done: r ? seenCount(r) : 0, tr: r ? r.sents.some(hasTr) : false });
    }).join('') : `<div class="vt-empty">Chưa có video nào trong thư viện. Hãy đặt thư mục <b>${esc(VT_DIR)}</b> (có <b>library-index.json</b> bên trong) cùng chỗ với index.html.</div>`;
  }
  $('vt-cats').addEventListener('click', (e) => { const b = e.target.closest('.vt-chip'); if (b) { libCat = b.dataset.c; renderLanding(); } });
  async function openLib(id) {
    const v = lib.find((x) => x.id === id); if (!v) return;
    const key = 'lib:' + id, old = store.videos[key];
    try {
      const base = parseTxtLines(await fetchText(dirUrl(v.folder) + id + '.txt'));
      if (!base.length) throw new Error('File phụ đề của video này đang trống.');
      try { applyTiming(base, loose(await fetchText(dirUrl(v.folder) + id + '_timing.json'))); } catch (e) {}   // video cũ chưa có file timing: vẫn phát được theo mốc [mm:ss] của từng dòng
      try { const m = parseTr(await fetchText(dirUrl(v.folder) + id + '_en.txt')); base.forEach((s, i) => { const x = m[i + 1]; if (x) { s.lit = x.lit; s.nat = x.nat; } }); } catch (e) {}   // _en.txt trống/chưa có: bỏ qua
      base.forEach((s, i) => { const o = old && old.sents[i]; if (o && o.t === s.t) { s.lit = s.lit || o.lit; s.nat = s.nat || o.nat; } });   // giữ bản dịch người học tự dán nếu server chưa có
      store.videos[key] = { key, kind: 'video', title: v.title, channel: v.channel, videoId: v.videoId, duration: v.duration, sents: base, ans: (old && old.ans) || {}, seen: (old && old.seen) || {}, idx: (old && old.idx) || 0, ts: Date.now() };
      save([key]); openRec(key);
    } catch (e) { alert('Không mở được video: ' + e.message); }
  }

  // ---------- Âm thanh: phát đúng đoạn của câu trong video YouTube (trình phát ẩn), giống Shadowing / Chép chính tả ----------
  const hasVid = () => !!(rec && /^[\w-]{11}$/.test(rec.videoId || ''));
  const canPlay = (i) => hasVid() && !!rec.sents[i] && typeof rec.sents[i].start === 'number';
  const tokens = (s) => s.t.split(/\s+/).filter(Boolean);
  // [bắt đầu, kết thúc] (giây) của câu i. Thiếu mốc kết thúc thì lấy tới đầu câu kế tiếp.
  function span(i) {
    const s = rec.sents[i], nx = rec.sents[i + 1], st = s.start;
    const nxStart = nx && typeof nx.start === 'number' && nx.start > st ? nx.start : null;
    let en;
    if (s.end > st) { en = s.end + 0.12; if (nxStart !== null && en > nxStart) en = nxStart; }   // chút đệm cuối câu để không bị cụt âm
    else en = nxStart !== null ? nxStart - 0.05 : st + Math.max(2, tokens(s).length * 0.5);
    if (!(en > st + 0.3)) en = st + 0.6;
    return [st, en];
  }
  const P = { yt: null, ready: false, loading: false, vid: '', playing: false, seg: null, timer: null, started: false, kicks: 0, kickAt: 0, segAt: 0, waitT: 0, pauseAt: 0, resumes: 0, auto: false, unlocked: false, unlocking: false, lastTap: 0 };

  function ensurePlayer() {
    if (P.yt || P.loading) return;
    P.loading = true;
    if (!(window.YT && window.YT.Player) && !document.getElementById('yt-api-script')) {
      const tag = document.createElement('script'); tag.id = 'yt-api-script'; tag.src = 'https://www.youtube.com/iframe_api'; document.body.appendChild(tag);
    }
    let n = 0;
    const tryMake = () => {
      if (window.YT && window.YT.Player) { makePlayer(); return; }
      if (++n < 100) setTimeout(tryMake, 200); else P.loading = false;   // ~20s không nạp được API YouTube thì thôi (lần sau thử lại)
    };
    tryMake();
  }
  function makePlayer() {
    try {
      P.yt = new window.YT.Player('vt-yt', {
        width: 480, height: 270,
        playerVars: { autoplay: 0, controls: 0, rel: 0, playsinline: 1, modestbranding: 1, disablekb: 1, fs: 0, cc_load_policy: 0, iv_load_policy: 3 },
        events: {
          onReady: () => { P.ready = true; P.loading = false; cueCurrent(); },
          onError: (ev) => { stopAudio(true); P.vid = ''; toast('Không phát được âm thanh của video này (mã lỗi ' + (ev && ev.data) + ')'); },
          onStateChange: (ev) => {
            if (ev.data === 1) {
              applyRate();
              if (P.unlocking) { P.unlocking = false; P.unlocked = true; try { P.yt.pauseVideo(); P.yt.unMute(); } catch (e) {} }   // phát câm 1 nhịp trong lúc chạm để "mở khoá" tự phát
            }
          },
        },
      });
    } catch (e) { P.yt = null; P.loading = false; }
  }
  // Nạp sẵn (cue) video ngay khi mở bài / khi trình phát sẵn sàng, để lần bấm loa đầu tiên chỉ cần seekTo + playVideo (đúng đường chạy
  // của lần bấm thứ 2). Trước đây lần bấm đầu phải loadVideoById từ đầu -> trên điện thoại nạp rất lâu, tới lúc phát thì
  // trình duyệt đã hết "quyền tự phát" nên bị dừng ngay sau ~0.1s.
  function cueCurrent() {
    if (!P.yt || !P.ready || !rec || !hasVid() || P.playing || P.vid === rec.videoId) return;
    const st = canPlay(idx) ? Math.max(0, span(idx)[0] - 0.05) : 0;
    try { P.vid = rec.videoId; P.yt.cueVideoById({ videoId: rec.videoId, startSeconds: st }); } catch (e) { P.vid = ''; }
  }
  function applyRate() { try { if (P.yt && P.yt.setPlaybackRate && Math.abs((P.yt.getPlaybackRate() || 1) - ui.rate) > 0.01) P.yt.setPlaybackRate(ui.rate); } catch (e) {} }

  function playUI(on) { const b = $('vt-play'); if (b) b.classList.toggle('on', !!on); }
  function prog(p) {
    const f = $('vt-pfill'); if (f) f.style.width = Math.max(0, Math.min(100, p * 100)) + '%';
  }
  function stopAudio(resetUI) {
    clearInterval(P.timer); P.timer = null; clearTimeout(P.waitT);
    if (P.playing && P.yt && P.ready) { try { P.yt.pauseVideo(); } catch (e) {} }
    P.playing = false; P.seg = null;
    if (resetUI !== false) { playUI(false); prog(0, -1); }
  }
  function finish(natural, failed) {
    try { P.yt.pauseVideo(); } catch (e) {}
    clearInterval(P.timer); P.timer = null; P.playing = false; P.seg = null; playUI(false);
    if (natural) prog(1);
    if (failed && !P.auto) toast('Không phát được âm thanh. Hãy bấm biểu tượng loa để nghe.');   // tự phát thất bại thì im lặng, không làm phiền
  }
  function tick() {
    if (!P.seg || !P.yt || !P.yt.getCurrentTime) return;
    let t; try { t = P.yt.getCurrentTime(); } catch (e) { return; }
    let st = -1; try { st = P.yt.getPlayerState(); } catch (e) {}
    const seg = P.seg, now = Date.now();
    if (!P.started) {
      // Chỉ coi là "đã chạy" khi YouTube báo PLAYING (1) và vị trí nằm trong câu; chưa thì cứ ~0.26s bấm play lại (tối đa 8 lần)
      const inRange = t >= seg.start - 0.35 && t <= seg.end + 0.2;
      if (st === 1 && inRange) { P.started = true; P.unlocked = true; }
      else {
        if (now - P.segAt > (P.auto ? 6000 : 15000)) { finish(false, true); return; }
        if (st !== 3 && now - P.kickAt > 260) {
          if (P.kicks >= 8) { finish(false, true); return; }
          P.kicks++; P.kickAt = now;
          try { if (!inRange) P.yt.seekTo(seg.start, true); P.yt.playVideo(); } catch (e) {}
        }
        return;
      }
    }
    prog((t - seg.start) / (seg.end - seg.start), t);
    if (t >= seg.end - 0.03 || t > seg.end + 1.5) { finish(true); return; }
    // Bị dừng giữa chừng (điện thoại hay tự dừng 1 nhịp): đợi ~0.7s rồi tự bấm phát tiếp (tối đa 3 lần) thay vì bỏ cuộc ngay
    if (st === 0 || st === 2) {
      if (!P.pauseAt) P.pauseAt = now;
      else if (now - P.pauseAt > 700) {
        if (st === 2 && P.resumes < 3 && t < seg.end - 0.3) { P.resumes++; P.pauseAt = 0; try { P.yt.playVideo(); } catch (e) {} }
        else finish(true);
      }
    } else P.pauseAt = 0;
  }
  // fromT: phát từ giây này tới hết câu (bấm vào 1 từ); mặc định phát cả câu
  function play(fromT, auto) {
    if (!rec || !canPlay(idx)) return;
    stopAudio(false);
    ensurePlayer();
    if (!P.yt || !P.ready) { playUI(false); if (!auto) toast('Âm thanh đang tải, thử lại sau giây lát'); return; }
    P.auto = !!auto; P.unlocking = false;
    try { if (P.yt.isMuted && P.yt.isMuted()) P.yt.unMute(); } catch (e) {}
    const sp = span(idx), start = Math.max(0, fromT != null ? fromT : sp[0] - 0.05), end = sp[1];
    P.seg = { start, end }; P.segAt = Date.now(); P.started = false; P.kicks = 0; P.kickAt = Date.now(); P.pauseAt = 0; P.resumes = 0;
    prog(0, -1);
    try {
      if (P.vid !== rec.videoId) { P.vid = rec.videoId; P.yt.loadVideoById({ videoId: rec.videoId, startSeconds: start }); }
      else { P.yt.seekTo(start, true); P.yt.playVideo(); }
      P.yt.setPlaybackRate(ui.rate);
    } catch (e) {}
    P.playing = true; playUI(true);
    clearInterval(P.timer); P.timer = setInterval(tick, 30);
  }
  // Tự phát khi chuyển sang câu mới: chờ trình phát sẵn sàng (nếu chưa)
  function playLater() {
    clearTimeout(P.waitT);
    if (!canPlay(idx)) return;
    ensurePlayer();
    // Điện thoại/iPad: trình duyệt chỉ cho tự phát khi vừa có chạm (hoặc đã "mở khoá" bằng lần chạm trước) -> chỉ tự phát trong các trường hợp đó,
    // còn lúc vừa mở video (chưa chạm gì) thì im lặng để người học tự bấm loa.
    const tapped = Date.now() - P.lastTap < 2500;
    if (isTouch && !tapped && !P.unlocked) return;
    const my = idx, myRec = rec; let tries = 0;
    const attempt = () => {
      if (!rec || rec !== myRec || idx !== my || $('screen-vt').classList.contains('hidden')) return;
      if (P.yt && P.ready) { play(undefined, true); return; }
      if (++tries < 60) P.waitT = setTimeout(attempt, 300);
    };
    P.waitT = setTimeout(attempt, isTouch ? 0 : 200);
  }
  function rateCommit() {
    const inp = $('vt-rate'); if (!inp) return;
    const w = inp.closest('.sh-rate');
    const v = parseFloat(String(inp.value).replace(',', '.'));
    if (!isFinite(v) || v <= 0) {
      if (w) { w.classList.add('invalid'); setTimeout(() => w.classList.remove('invalid'), 700); }
      inp.value = rateFmt(ui.rate); return;
    }
    ui.rate = Math.max(0.25, Math.min(2, Math.round(v * 100) / 100)); saveUi();
    inp.value = rateFmt(ui.rate);
    try { if (P.yt && P.ready) P.yt.setPlaybackRate(ui.rate); } catch (e) {}
  }

  // ---------- Màn luyện ----------
  function show(on) {
    $('screen-input').classList.toggle('hidden', on); $('screen-vt').classList.toggle('hidden', !on);
    $('screen-vt').classList.toggle('side-off', ui.side === false);
    window.scrollTo({ top: 0 }); if (on) $('vt-main').scrollTop = 0;
    fitVV();
  }
  // Khi bàn phím ảo mở (iPhone không co khung trang, chỉ co "vùng nhìn thấy"): ép màn Luyện dịch đúng bằng vùng nhìn thấy để header luôn hiện
  function fitVV() {
    const el = $('screen-vt'); if (!el) return;
    if (el.classList.contains('hidden')) { el.style.top = el.style.bottom = el.style.height = ''; return; }
    const v = window.visualViewport; if (!v) return;
    if (v.scale <= 1.01 && (Math.abs(v.height - window.innerHeight) > 1 || v.offsetTop > 1)) { el.style.bottom = 'auto'; el.style.top = v.offsetTop + 'px'; el.style.height = v.height + 'px'; }
    else { el.style.top = el.style.bottom = el.style.height = ''; }
  }
  if (window.visualViewport) { window.visualViewport.addEventListener('resize', fitVV); window.visualViewport.addEventListener('scroll', fitVV); }
  function openRec(key) {
    rec = store.videos[key]; if (!rec) return;
    stopAudio(true); closePop();
    rec.ts = Date.now(); filter = 'all'; idx = Math.min(rec.idx || 0, rec.sents.length - 1);
    $('vt-title').textContent = rec.title; show(true); render(true);
    syncReadBtn();
    if (hasVid()) { ensurePlayer(); cueCurrent(); }
    if (!readAll) playLater();
  }
  window.vtClose = function () { save(); stopAudio(true); closePop(); closeAI(); show(false); rec = null; renderLanding(); };
  function stats() { const t = rec.sents.length, d = seenCount(rec); return { t, d, tr: rec.sents.filter(hasTr).length }; }
  const SPEAKER = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  const GAUGE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>';
  function rowHTML(i) {
    const s = rec.sents[i], seen = rec.seen[i], typed = (rec.ans[i] || '').trim();
    const spk = canPlay(i) ? `<button type="button" class="sh-ico" data-a="row-play" title="Nghe câu này" aria-label="Nghe câu này">${SPEAKER}</button>` : '';
    return `<div class="sh-row vt-row${seen ? ' done' : ''}" data-i="${i}"><div class="sh-num">${i + 1}</div><div class="sh-body"><div class="sh-text">${esc(s.t)}</div></div><div class="sh-side">${seen ? '<span class="sh-badge done">Đã xem</span>' : typed ? '<span class="vt-badge-todo">Đã gõ</span>' : ''}${spk}</div></div>`;
  }
  function activeHTML(i) {
    const s = rec.sents[i], seen = rec.seen[i], typed = (rec.ans[i] || '').trim(), audio = canPlay(i);
    const text = esc(s.t);
    let h = `<div class="sh-row vt-row active" data-i="${i}"><div class="sh-head"><div class="sh-num on">${i + 1}</div>${audio ? `<button type="button" class="sh-speaker" id="vt-play" data-a="play" title="Nghe câu này (Tab)" aria-label="Nghe câu này">${SPEAKER}</button>` : ''}<div class="sh-body"><div class="sh-text">${text}</div></div></div>`;
    if (audio) h += `<div class="sh-progrow"><div class="sh-prog"><i id="vt-pfill"></i></div><label class="sh-rate" title="Tốc độ nghe: gõ số bất kỳ từ 0.25 đến 2 rồi bấm Enter, hoặc nhấn giữ rồi kéo lên/xuống để tăng/giảm (↑/↓ chỉnh từng 0.05)">${GAUGE}<input id="vt-rate" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="5" value="${rateFmt(ui.rate)}" aria-label="Tốc độ nghe"><span>x</span></label></div>`;
    if (!seen) {
      h += `<textarea id="vt-in" class="dc-input" rows="3" placeholder="Tự dịch trong đầu, hoặc gõ bản dịch tiếng Pháp của bạn vào đây…" spellcheck="false" autocomplete="off" autocorrect="off" aria-label="Bản dịch tiếng Pháp của bạn">${esc(rec.ans[i] || '')}</textarea>
      <div class="dc-foot" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span class="vt-ph">Enter: xem bản dịch AI · Shift+Enter: xuống dòng${audio ? ' · Tab: nghe lại' : ''}</span><div class="dc-actions" style="display:flex;gap:8px"><button type="button" class="dc-btn" data-a="clear">Xóa</button><button type="button" class="dc-btn primary" data-a="reveal">Xem bản dịch AI</button></div></div>`;
    } else {
      if (typed) h += `<div class="vt-yours"><b>Bản dịch của bạn</b><p>${esc(typed)}</p></div>`;
      if (hasTr(s)) {
        const ver = (cls, name, t) => t ? `<div class="vt-ver ${cls}"><div><b>${name}</b><p>${esc(t)}</p></div><button type="button" class="sh-ico" data-a="say" data-t="${esc(t)}" title="Nghe câu tiếng Pháp" aria-label="Nghe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg></button></div>` : '';
        h += ver('lit', 'Sát nghĩa', s.lit) + ver('nat', 'Dịch thoáng · tự nhiên', s.nat);
      } else h += `<div class="vt-miss">Câu này chưa có bản dịch AI. Bấm “Nhờ AI dịch” để lấy prompt, gửi cho AI rồi dán kết quả vào app.<br><button type="button" class="dc-btn vt-ai-btn" data-a="ai">Nhờ AI dịch</button></div>`;
      h += `<div class="dc-foot" style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><button type="button" class="dc-btn" data-a="retry">Dịch lại câu này</button>${i < rec.sents.length - 1 ? '<button type="button" class="dc-btn primary" data-a="next">Câu tiếp theo</button>' : '<span class="vt-ph" style="align-self:center">Đây là câu cuối 🎉</span>'}</div>`;
    }
    return h + '</div>';
  }
  // Chế độ đọc: mọi câu mở sẵn cùng 2 bản dịch AI, không có ô gõ
  function readHTML(i) {
    const s = rec.sents[i];
    const spk = canPlay(i) ? `<button type="button" class="sh-speaker" data-a="read-play" title="Nghe câu này" aria-label="Nghe câu này">${SPEAKER}</button>` : '';
    let h = `<div class="sh-row vt-row read${i === idx ? ' curr' : ''}" data-i="${i}"><div class="sh-head"><div class="sh-num${i === idx ? ' on' : ''}">${i + 1}</div>${spk}<div class="sh-body"><div class="sh-text">${esc(s.t)}</div></div></div>`;
    if (hasTr(s)) {
      const ver = (cls, name, t) => t ? `<div class="vt-ver ${cls}"><div><b>${name}</b><p>${esc(t)}</p></div><button type="button" class="sh-ico" data-a="say" data-t="${esc(t)}" title="Nghe câu tiếng Pháp" aria-label="Nghe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg></button></div>` : '';
      h += ver('lit', 'Sát nghĩa', s.lit) + ver('nat', 'Dịch thoáng · tự nhiên', s.nat);
    } else h += '<div class="vt-miss">Câu này chưa có bản dịch AI.</div>';
    return h + '</div>';
  }
  function syncReadBtn() {
    const b = $('vt-readall'); if (!b) return;
    b.classList.toggle('on', readAll); b.setAttribute('aria-pressed', readAll ? 'true' : 'false');
    b.textContent = readAll ? 'Ẩn hết bản dịch' : 'Hiện hết bản dịch';
  }
  function render(scroll) {
    if (!rec) return;
    let h = '';
    if (readAll) rec.sents.forEach((s, i) => { h += readHTML(i); });
    else rec.sents.forEach((s, i) => { if (filter === 'todo' && rec.seen[i] && i !== idx) return; h += i === idx ? activeHTML(i) : rowHTML(i); });
    $('vt-list').innerHTML = h || '<div class="sh-empty">Không có câu nào phù hợp với bộ lọc này.</div>';
    playUI(P.playing);
    const st = stats();
    const src = rec.url && /^https?:\/\//i.test(rec.url) ? ` · <a href="${esc(rec.url)}" target="_blank" rel="noopener" style="color:#7aa2ff">Xem bài gốc</a>` : '';
    $('vt-sub').innerHTML = `Đã luyện <b>${st.d}/${st.t}</b> câu · Bản dịch AI <b>${st.tr}/${st.t}</b> câu${src}`;
    $('vt-bar').style.width = (st.t ? st.d / st.t * 100 : 0) + '%';
    document.querySelectorAll('#vt-filter button').forEach((b) => b.classList.toggle('on', b.dataset.f === filter));
    renderSide();
    const act = $('vt-list').querySelector(readAll ? '.vt-row[data-i="' + idx + '"]' : '.active');
    if (scroll && act) {   // chỉ cuộn bên trong khung nội dung (scrollIntoView còn kéo cả trang -> đẩy header lên khỏi màn hình trên điện thoại)
      const m = $('vt-main');
      if (m) { const top = Math.max(0, act.getBoundingClientRect().top - m.getBoundingClientRect().top + m.scrollTop - 10); try { m.scrollTo({ top, behavior: 'smooth' }); } catch (e) { m.scrollTop = top; } }
    }
    const inp = $('vt-in'); if (inp && scroll && !isTouch) setTimeout(() => inp.focus({ preventScroll: true }), 250);   // điện thoại: không tự bật bàn phím
  }
  function go(i, scroll) {
    if (!rec || i < 0 || i >= rec.sents.length) return;
    stopAudio(true);
    idx = i; rec.idx = i; save(); render(scroll !== false);
    if (!readAll) playLater();
  }
  function reveal() {
    const i = idx, s = rec.sents[i]; const inp = $('vt-in');
    if (inp) rec.ans[i] = inp.value;
    rec.seen[i] = 1; save(); render(false);
  }
  function say(t) {
    stopAudio(true);
    try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'fr-FR'; u.rate = .95; speechSynthesis.speak(u); } catch (e) {}
  }

  // ---------- Danh sách câu (cột bên trái ở màn hình rộng; popup ở màn hình nhỏ) ----------
  const stOf = (i) => rec.seen[i] ? 'perfect' : ((rec.ans[i] || '').trim() ? 'partial' : '');
  function renderSide() {
    if (!rec) return;
    const n = rec.sents.length; let g = '';
    for (let i = 0; i < n; i++) g += `<button type="button" class="dc-chip ${stOf(i)}${i === idx ? ' cur' : ''}" data-i="${i}" title="Câu ${i + 1}">${i + 1}</button>`;
    $('vt-side-grid').innerHTML = g;
    const st = stats();
    $('vt-side-big').innerHTML = `<b>${st.d}</b><span>/ ${st.t} câu đã luyện</span>`;
    $('vt-side-bar').innerHTML = `<i class="p" style="width:${st.t ? st.d / st.t * 100 : 0}%"></i>`;
    $('vt-side-meta').innerHTML = `<span>Còn <b>${st.t - st.d}</b> câu</span><span>Bản dịch AI <b>${st.tr}/${st.t}</b></span>`;
    $('vt-count-now').textContent = 'Câu ' + (idx + 1); $('vt-count-total').textContent = '/ ' + n;
    $('vt-prev').disabled = idx <= 0; $('vt-next').disabled = idx >= n - 1;
    const cur = $('vt-side-grid').querySelector('.dc-chip.cur');
    if (cur) { try { cur.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  }
  function closePop() { const p = $('vt-pop'); if (!p) return; p.classList.add('pv-x'); $('vt-count').setAttribute('aria-expanded', 'false'); }
  function togglePop() {
    const pop = $('vt-pop');
    if (!pop.classList.contains('pv-x')) { closePop(); return; }
    if (!rec) return;
    let h = '<div class="dc-pop-grid">';
    for (let i = 0; i < rec.sents.length; i++) h += `<button type="button" class="dc-chip ${stOf(i)}${i === idx ? ' cur' : ''}" data-i="${i}">${i + 1}</button>`;
    h += '</div><div class="dc-pop-foot"><div class="dc-legend"><span><i style="background:#22c55e"></i>Đã xem bản dịch</span><span><i style="background:#f59e0b"></i>Đã gõ, chưa xem</span><span><i style="background:#17213f;border:1px solid #2b3f7a"></i>Chưa làm</span></div></div>';
    pop.innerHTML = h; pop.classList.remove('pv-x'); $('vt-count').setAttribute('aria-expanded', 'true');
    const cur = pop.querySelector('.dc-chip.cur'); if (cur) cur.scrollIntoView({ block: 'center' });
  }
  function setSide(on) { ui.side = !!on; saveUi(); $('screen-vt').classList.toggle('side-off', !ui.side); }
  $('vt-side-grid').addEventListener('click', (e) => { const c = e.target.closest('.dc-chip[data-i]'); if (c) go(+c.dataset.i); });
  $('vt-pop').addEventListener('click', (e) => { const c = e.target.closest('.dc-chip[data-i]'); if (c) { closePop(); go(+c.dataset.i); } });
  $('vt-side-hide').addEventListener('click', () => setSide(false));
  $('vt-side-show').addEventListener('click', () => setSide(true));
  $('vt-count').addEventListener('click', togglePop);
  $('vt-prev').addEventListener('click', () => go(idx - 1));
  $('vt-next').addEventListener('click', () => go(idx + 1));
  const popOutside = (e) => { const p = $('vt-pop'); if (p && !p.classList.contains('pv-x') && !p.contains(e.target) && !$('vt-count').contains(e.target)) closePop(); };
  document.addEventListener('mousedown', popOutside);
  document.addEventListener('touchstart', popOutside, { passive: true });

  // Ghi nhận lần chạm gần nhất + "mở khoá" âm thanh trên điện thoại: chạm đầu tiên cho trình phát chạy câm 1 nhịp rồi dừng,
  // từ đó các lần sang câu mới (Câu tiếp theo / chọn câu...) tự phát được như trên laptop.
  function noteTap() {
    P.lastTap = Date.now();
    if (!isTouch || P.unlocked || P.unlocking || P.playing || !P.yt || !P.ready || !rec || !hasVid()) return;
    try { P.unlocking = true; P.yt.mute(); P.yt.playVideo(); } catch (e) { P.unlocking = false; return; }
    setTimeout(() => { if (P.unlocking) { P.unlocking = false; try { P.yt.pauseVideo(); P.yt.unMute(); } catch (e) {} } }, 4000);
  }
  $('screen-vt').addEventListener('click', noteTap, true);
  $('vt-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]');
    if (b) {
      const a = b.dataset.a;
      if (a === 'reveal') reveal();
      else if (a === 'clear') { rec.ans[idx] = ''; save(); const t = $('vt-in'); if (t) { t.value = ''; t.focus(); } }
      else if (a === 'retry') { delete rec.seen[idx]; save(); render(false); const t = $('vt-in'); if (t) t.focus(); }
      else if (a === 'next') go(idx + 1);
      else if (a === 'say') say(b.dataset.t);
      else if (a === 'ai') window.vtOpenAI();
      else if (a === 'play') { if (P.playing) stopAudio(true); else play(); }
      else if (a === 'read-play') { const r = b.closest('.vt-row'); if (r) { idx = +r.dataset.i; rec.idx = idx; if (P.playing && P.seg) stopAudio(true); play(); $('vt-list').querySelectorAll('.vt-row.curr').forEach((x) => x.classList.remove('curr')); r.classList.add('curr'); renderSide(); } }
      else if (a === 'row-play') { e.stopPropagation(); const r = b.closest('.vt-row'); if (r) go(+r.dataset.i); }
      return;
    }
    if (readAll) return;   // chế độ đọc: bấm vào hàng không chuyển câu
    const row = e.target.closest('.vt-row:not(.active)'); if (row) go(+row.dataset.i);
  });
  $('vt-list').addEventListener('input', (e) => { if (e.target.id === 'vt-in') { rec.ans[idx] = e.target.value; saveSoon(); } });
  $('vt-list').addEventListener('keydown', (e) => {
    if (e.target.id === 'vt-in' && e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); reveal(); }
    else if (e.target.id === 'vt-rate') {
      const inp = e.target;
      if (e.key === 'Enter') { e.preventDefault(); rateCommit(); inp.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); inp.value = rateFmt(ui.rate); inp.blur(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        const cur = parseFloat(String(inp.value).replace(',', '.')), base = isFinite(cur) ? cur : ui.rate;
        inp.value = rateFmt(Math.max(0.25, Math.min(2, Math.round((base + (e.key === 'ArrowUp' ? 0.1 : -0.1)) * 100) / 100)));
        rateCommit(); inp.select();
      }
    }
  });
  $('vt-list').addEventListener('focusin', (e) => { if (e.target.id === 'vt-rate') e.target.select(); });
  $('vt-list').addEventListener('focusout', (e) => { if (e.target.id === 'vt-rate') rateCommit(); });
  document.addEventListener('keydown', (e) => {
    if ($('screen-vt').classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      if ($('vt-ai-modal').classList.contains('open')) closeAI();
      else if (!$('vt-pop').classList.contains('pv-x')) closePop();
      return;
    }
    // Tab: nghe lại câu hiện tại (giống Chép chính tả) — chỉ khi đang ở ô gõ hoặc không focus vào nút nào
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && rec && canPlay(idx) && !$('vt-ai-modal').classList.contains('open') && (e.target.id === 'vt-in' || e.target === document.body)) {
      e.preventDefault(); play(); return;
    }
    if (e.target.closest && e.target.closest('textarea,input')) return;
    if (e.key === 'Enter' && rec && !readAll && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey && !e.isComposing && !$('vt-ai-modal').classList.contains('open')) {
      if (e.target.closest && e.target.closest('button,a,select,[contenteditable="true"]')) return;   // đang focus nút/liên kết: để Enter kích hoạt chính nút đó
      if (rec.seen[idx]) { e.preventDefault(); go(idx + 1); }
      else { e.preventDefault(); reveal(); }   // con trỏ ở ngoài ô gõ vẫn hiện được bản dịch AI
    }
  });
  $('vt-readall').addEventListener('click', () => { readAll = !readAll; stopAudio(true); syncReadBtn(); render(true); });
  $('vt-filter').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { filter = b.dataset.f; render(false); } });
  $('vt-hist').addEventListener('click', cardClick); $('vt-lib').addEventListener('click', cardClick);
  async function cardClick(e) {
    const d = e.target.closest('.vt-del');
    if (d) {
      e.stopPropagation();
      const r = store.videos[d.dataset.del];
      if (r && confirm('Xóa “' + r.title + '” khỏi danh sách?\nTiến độ luyện và bản dịch AI đã dán cho bài này sẽ mất.')) { delete store.videos[d.dataset.del]; if (rec && rec.key === d.dataset.del) rec = null; idbDel(d.dataset.del).catch(() => {}); if (!useIDB) save(); renderLanding(); }
      return;
    }
    const c = e.target.closest('.vt-card'); if (!c) return;
    const k = c.dataset.k;
    if (c.dataset.src === 'lib') return openLib(k);
    // Video thư viện nằm trong "Bài bạn đã luyện": nạp lại từ server để có đủ mốc từng từ (bản lưu có thể đã được rút gọn)
    if (k.indexOf('lib:') === 0 && lib.some((v) => v.id === k.slice(4))) return openLib(k.slice(4));
    await refreshFromDB(); openRec(k);
  }

  // ---------- Nhờ AI dịch ----------
  function startIdx() { let last = -1; rec.sents.forEach((s, i) => { if (hasTr(s)) last = i; }); return (last >= 0 && last < rec.sents.length - 1) ? last + 1 : 0; }
  function buildPrompt() {
    const a = startIdx(), b = Math.min(rec.sents.length, a + BATCH);
    const list = rec.sents.slice(a, b).map((s, k) => `${a + k + 1}. ${s.t}`).join('\n');
    return `Bạn là chuyên gia dịch Việt–Pháp. Dưới đây là các câu tiếng Việt đã đánh số (lấy từ phụ đề một video). Hãy dịch theo NGỮ CẢNH TOÀN BÀI, không dịch từng câu rời rạc.
    
    CÁCH LÀM:
Bước 1 (làm thầm, KHÔNG viết ra): đọc hết toàn văn để nắm chủ đề, mạch ý, ai đang nói với ai và quan hệ giữa họ, giọng điệu (thân mật / trang trọng / hài hước...), thuật ngữ và tên riêng.
Bước 2: với MỖI câu đánh số, viết 2 bản dịch tiếng Pháp:
S: bản dịch SÁT NGHĨA, bám sát từ ngữ và cấu trúc của câu tiếng Việt gốc nhưng vẫn đúng ngữ pháp tiếng Pháp.
T: bản dịch THOÁNG, truyền tải đúng thông điệp gốc nhưng nghe tự nhiên như người bản xứ nói; có thể đổi cấu trúc câu, không dịch word-for-word.

Yêu cầu: giữ nguyên số thứ tự; không gộp, tách hay bỏ câu nào (nếu câu thiếu dấu câu thì hiểu theo ngữ cảnh); không giải thích gì thêm; đặt toàn bộ kết quả trong MỘT khối code (codebox \`\`\`) để người dùng mobile dễ bấm nút copy; mỗi câu đúng 3 dòng, cách nhau một dòng trống, theo mẫu:

${a + 1}
S: ...
T: ...

Các câu cần dịch:
${list}`;
  }
  window.vtOpenAI = function () {
    if (!rec) return;
    const a = startIdx(), b = Math.min(rec.sents.length, a + BATCH);
    $('vt-ai-desc').innerHTML = `Bấm Copy prompt, gửi cho AI (ChatGPT, Claude, Gemini…), rồi dán kết quả vào ô bên dưới. Đợt này dịch <b>câu ${a + 1}–${b}</b> trên tổng ${rec.sents.length} câu${b < rec.sents.length ? '; xong đợt này hãy mở lại để lấy đợt tiếp theo' : ''}.`;
    $('vt-ai-text').value = ''; aiSetStatus($('vt-ai-status'), '', ''); $('vt-ai-modal').classList.add('open');
  };
  function closeAI() { $('vt-ai-modal').classList.remove('open'); }
  window.vtCloseAI = closeAI;
  window.vtCopyPrompt = function (btn) {
    copyTextToClipboard(buildPrompt()).then(() => flashCopied(btn, 1800)).catch((e) => alert('Không thể sao chép: ' + e));
  };
  window.vtApplyAI = function () {
    const m = parseTr($('vt-ai-text').value); let n = 0;
    Object.keys(m).forEach((k) => { const s = rec.sents[k - 1]; if (s) { s.lit = m[k].lit || s.lit; s.nat = m[k].nat || s.nat; n++; } });
    if (!n) { aiSetStatus($('vt-ai-status'), 'err', 'Không nhận ra bản dịch nào. Hãy dán đúng kết quả của AI (mỗi câu gồm số thứ tự, dòng S:, dòng T:).'); return; }
    save(); render(false);
    aiSetStatus($('vt-ai-status'), 'ok', `Đã áp dụng bản dịch cho <b>${n}</b> câu.`);
    setTimeout(closeAI, 900);
  };

  // ---------- Nhận video / văn bản từ extension "Luyện dịch Việt → Pháp" ----------
  // window.postMessage({type:'SHADOWING_VI_IMPORT', payload:{
  //   videoId?, textId?, kind?:'video'|'text', url?, title, channel, duration,
  //   sentences:[string | {text, start?, end?, wt?:[[s,e],...]}] }})
  // Video YouTube: có videoId + start/end từng câu -> có âm thanh. Văn bản (bài viết): không có videoId -> không có âm thanh.
  function importPayload(p) {
    if (!p || !Array.isArray(p.sentences)) return false;
    const sents = p.sentences.map(toSent).filter((s) => s.t); if (!sents.length) return false;
    const key = p.videoId || (p.textId ? 't:' + p.textId : 'x:' + (p.title || Date.now())), old = store.videos[key];
    store.videos[key] = { key, kind: p.videoId ? 'video' : 'text', url: p.url || '', title: p.title || 'Video ' + key, channel: p.channel || '', videoId: p.videoId || '', duration: p.duration || '', sents: sents.map((s, i) => { const o = old && old.sents[i]; return o && o.t === s.t ? Object.assign(s, { lit: o.lit, nat: o.nat }) : s; }), ans: (old && old.ans) || {}, seen: (old && old.seen) || {}, idx: (old && old.idx) || 0, ts: Date.now() };
    save([key]); setInputMode('vt'); renderLanding(); return key;
  }
  window.vtImportPayload = importPayload;
  const viInflight = new Set();   // extension gửi lại mỗi 0,5s tới khi nhận ACK -> bỏ qua bản trùng đang xử lý
  window.addEventListener('message', async (e) => {
    if (e.source !== window || !e.data || e.data.type !== 'SHADOWING_VI_IMPORT') return;
    const p = e.data.payload || {}, k = p.videoId || (p.textId ? 't:' + p.textId : 'x:' + (p.title || ''));
    if (viInflight.has(k)) return;
    viInflight.add(k);
    try {
      await refreshFromDB();                 // lấy bản mới nhất (giữ bản dịch / tiến độ đã có) trước khi gộp
      const key = importPayload(p); if (!key) return;
      const ok = await lastSaveP;            // chỉ báo ACK (extension mới xoá dữ liệu chờ) sau khi đã ghi xong
      window.postMessage({ type: 'SHADOWING_VI_IMPORT_ACK' }, location.origin);
      if (!ok) alert('Video đã được mở nhưng KHÔNG lưu được vào bộ nhớ trình duyệt (có thể đã đầy). Hãy xóa bớt dữ liệu cũ rồi import lại.');
      openRec(key);
    } finally { viInflight.delete(k); }
  });

  // ---------- Link riêng cho từng bài (router ở index.html gọi 2 hàm này) ----------
  window.vtCurrentKey = function () { const sc = $('screen-vt'); return (rec && sc && !sc.classList.contains('hidden')) ? rec.key : ''; };
  window.vtOpenKey = async function (key) {
    await refreshFromDB();
    if (!libLoaded) { try { await loadLib(); } catch (e) {} }
    if (String(key).indexOf('lib:') === 0 && lib.some((v) => v.id === String(key).slice(4))) { await openLib(String(key).slice(4)); return !!rec; }
    if (store.videos[key]) { openRec(key); return true; }
    toast('Không tìm thấy bài này trên thiết bị. Hãy chọn từ thư viện hoặc import lại bằng extension.');
    return false;
  };

  // ---------- Bôi đen bản dịch AI -> popup Tra nghĩa / Phát âm / Lưu (dùng chung popup #lookup-tooltip của app) ----------
  const elOf = (n) => (!n ? null : (n.nodeType === 1 ? n : n.parentElement));
  const vtOpen = () => { const sc = $('screen-vt'); return !!sc && !sc.classList.contains('hidden') && !!rec; };
  const vtHideTip = () => { try { hideLookupTooltip(); } catch (e) {} };
  function vtSelCheck() {
    if (!vtOpen()) return false;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) { vtHideTip(); return true; }
    const text = sel.toString().trim();
    const a = elOf(sel.anchorNode), f = elOf(sel.focusNode);
    const blk = a && a.closest('.vt-ver p');                       // chỉ khối bản dịch AI (Sát nghĩa / Dịch thoáng)
    if (!text || !blk || !f || blk !== f.closest('.vt-ver p') || !/\p{L}/u.test(text)) { vtHideTip(); return true; }
    const range = sel.getRangeAt(0), rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) { vtHideTip(); return true; }
    const row = blk.closest('.vt-row'), i = row ? +row.dataset.i : idx, s = rec.sents[i] || {};
    let en = blk.textContent, hs = -1, he = -1;
    try { const r = document.createRange(); r.setStart(blk, 0); r.setEnd(range.startContainer, range.startOffset); hs = r.toString().length; he = hs + range.toString().length; } catch (e) { hs = -1; }
    if (hs < 0 || en.slice(hs, he) !== range.toString()) { hs = en.indexOf(text); he = hs + text.length; }
    if (hs < 0) { en = text; hs = 0; he = text.length; }
    const seg = en.slice(hs, he);
    hs += seg.match(/^[^\p{L}\p{N}]*/u)[0].length; he -= seg.match(/[^\p{L}\p{N}]*$/u)[0].length;
    const picked = he > hs ? en.slice(hs, he).trim() : '';
    if (!picked || picked.length > 600) { vtHideTip(); return true; }
    const vid = hasVid() ? rec.videoId : 'txt_vt_' + String(rec.key).replace(/[^\w-]+/g, '_').slice(0, 60);
    // Dùng lại nút Tra nghĩa / Phát âm / Lưu của app: chúng đọc vùng bôi đen từ các biến này
    selectedTextForLookup = text; selectedRangeForLoop = range.cloneRange();
    vocabAreaCtx = { ok: true, text: picked, en, hs, he, prev: '', vi: s.t || '', src: { videoId: vid, videoTitle: rec.title || '', t: s.start || 0 }, contextStr: en };
    const lk = $('btn-lookup-action'); if (lk) lk.style.display = '';
    const sv = $('btn-save-action'); if (sv) sv.style.display = '';
    const lp = $('btn-loop-action'); if (lp) lp.style.display = 'none';
    const pr = $('btn-pronounce-action');
    if (pr) {
      const pw = getSingleWordForLookup(text) || (text && text.trim().length <= 150 ? text.trim() : '');
      pr.style.display = pw ? '' : 'none';
      if (pw) { pr.title = 'Phát âm "' + pw + '" · Shift + click: Mở Từ điển Larousse'; }
    }
    const tip = $('lookup-tooltip');
    tip.style.left = (rect.left + rect.width / 2) + 'px'; tip.style.top = rect.top + 'px'; tip.style.display = 'block';
    const half = tip.offsetWidth / 2;
    tip.style.left = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8) + 'px';
    return true;
  }
  window.vtSelectionHook = vtSelCheck;   // checkTextSelection() (mouseup) hỏi hàm này trước
  let vtSelT = 0;
  document.addEventListener('selectionchange', () => {   // điện thoại / iPad: bôi đen bằng cách giữ tay không có mouseup
    if (!vtOpen() || !(window.matchMedia && matchMedia('(pointer: coarse)').matches)) return;
    clearTimeout(vtSelT); vtSelT = setTimeout(vtSelCheck, 350);
  });

  window.vtModeShown = renderLanding;
})();
