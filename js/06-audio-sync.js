
(function () {
  'use strict';
  const CLS = ['vs-w', 'vs-first', 'vs-last', 'vs-cont'];
  const collapse = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Cách tách từ giống hệt cách giao diện phụ đề đang dùng để dựng từng ô chữ
  function toksOf(s) {
    if (s && s.words && s.words.length) return s.words.map((w) => String(w.word));
    return String((s && s.text) || '').split(/\s+/).filter(Boolean);
  }
  const canonOf = (s) => collapse(toksOf(s).join(' '));

  let cache = null;
  function build() {
    let raw = '';
    try { raw = localStorage.getItem(VOCAB_KEY) || ''; } catch (e) {}
    const S = Array.isArray(sentences) ? sentences : [];
    const vid = String(currentVideoId || '');
    const sig = S.length + '|' + (S[0] ? S[0].text : '') + '|' + (S.length ? S[S.length - 1].text : '');
    if (cache && cache.raw === raw && cache.S === S && cache.vid === vid && cache.sig === sig && cache.tm === isTextMode) return cache.map;
    let map;
    try { map = compute(S, vid); } catch (e) { console.warn('[vocab-highlight]', e); map = new Map(); }
    cache = { raw, S, vid, sig, tm: isTextMode, map };
    return map;
  }

  // Trả về Map: id câu -> [[từ, đến), ...] (toạ độ ký tự trong chuỗi chuẩn của câu đó)
  function compute(S, vid) {
    const map = new Map();
    if (!vid || !S.length) return map;
    const items = getVocab().filter((x) => x && !x.bookId && String(x.videoId || '') === vid && x.en && x.text);
    if (!items.length) return map;

    const canons = S.map(canonOf), offs = [], ends = [];
    let full = '';
    canons.forEach((c, i) => { if (i) full += ' '; offs[i] = full.length; full += c; ends[i] = full.length; });
    const startAt = new Map();
    offs.forEach((o, i) => { if (!startAt.has(o)) startAt.set(o, i); });
    const endSet = new Set(ends);
    const idxAt = (pos) => { let lo = 0, hi = offs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (offs[m] <= pos) lo = m; else hi = m - 1; } return lo; };
    const timeDist = (k, t) => {
      const s = S[k], a = +s.startTime, b = +s.endTime;
      if (!isFinite(a)) return 0;
      if (t < a) return a - t;
      if (isFinite(b) && t > b) return t - b;
      return 0;
    };
    const lim = isTextMode ? 1.5 : 8;

    items.forEach((x) => {
      const enRaw = String(x.en), hsN = +x.hs, heN = +x.he;
      if (!isFinite(hsN) || !isFinite(heN) || heN <= hsN) return;
      const en = collapse(enRaw);
      const hs = collapse(enRaw.slice(0, hsN)).length, he = collapse(enRaw.slice(0, heN)).length;
      const t = +x.t || 0;
      let best = null;

      // 1) Khớp nguyên văn đoạn ngữ cảnh đã lưu (có kiểm tra khớp đúng ranh giới câu) -> đúng chỗ đã lưu, kể cả khi từ đó lặp lại nhiều nơi
      if (en) {
        for (let p = full.indexOf(en); p >= 0; p = full.indexOf(en, p + 1)) {
          if (!startAt.has(p) || !endSet.has(p + en.length)) continue;
          const d = timeDist(startAt.get(p), t);
          if (!best || d < best.d) best = { a: p + hs, b: p + he, d };
        }
      }

      // 2) Câu đã bị chia lại / sửa dấu câu: tìm đúng từ/cụm đó ở câu gần mốc thời gian đã lưu nhất
      if (!best) {
        const txt = collapse(x.text).trim();
        if (!txt) return;
        let re;
        try { re = new RegExp('(?<![\\p{L}\\p{N}])' + reEsc(txt) + '(?![\\p{L}\\p{N}])', 'iu'); } catch (e) { return; }
        for (let k = 0; k < S.length; k++) {
          const d = timeDist(k, t);
          if (d > lim || (best && d >= best.d)) continue;
          const m = re.exec(canons[k]);
          if (m) best = { a: offs[k] + m.index, b: offs[k] + m.index + m[0].length, d };
        }
      }
      if (!best) return;

      for (let k = idxAt(best.a); k < S.length && offs[k] < best.b; k++) {
        const la = Math.max(best.a, offs[k]) - offs[k], lb = Math.min(best.b, ends[k]) - offs[k];
        if (lb > la) {
          const id = String(S[k].id);
          if (!map.has(id)) map.set(id, []);
          map.get(id).push([la, lb]);
        }
      }
    });
    return map;
  }

  // toks: các chuỗi hiển thị của câu (theo thứ tự). Trả về mảng class ('' hoặc 'vs-w vs-first ...') hoặc null nếu câu không có gì được lưu
  function flags(s, toks) {
    if (!s) return null;
    const rs = build().get(String(s.id));
    if (!rs || !rs.length) return null;
    const canon = canonOf(s);
    let cur = 0;
    const mk = toks.map((t) => {
      t = String(t);
      const i = t ? canon.indexOf(t, cur) : -1;
      if (i < 0) return false;
      cur = i + t.length;
      return rs.some((r) => i < r[1] && i + t.length > r[0]);
    });
    if (!mk.some(Boolean)) return null;
    return mk.map((m, i) => (!m ? '' : 'vs-w' + (mk[i - 1] ? '' : ' vs-first') + (mk[i + 1] ? ' vs-cont' : ' vs-last')));
  }
  const clear = (el) => CLS.forEach((c) => el.classList.remove(c));
  const setCls = (el, c) => { clear(el); if (c) c.split(' ').forEach((k) => el.classList.add(k)); };

  // ---- Giao diện Mặc định + Đọc báo/IELTS ----
  function markMain() {
    const root = document.getElementById('subtitles-scroll-container');
    if (!root) return;
    root.querySelectorAll('.vs-w').forEach(clear);
    const map = build();
    if (!map.size) return;
    const lines = new Map();
    root.querySelectorAll('.sentence-text-line[data-id]').forEach((ln) => lines.set(ln.getAttribute('data-id'), ln));
    sentences.forEach((s) => {
      const ln = lines.get(String(s.id));
      if (!ln || !map.has(String(s.id))) return;
      const els = Array.from(ln.querySelectorAll('.sub-word-unit'));
      const fl = flags(s, els.map((e) => e.textContent));
      if (fl) els.forEach((e, i) => setCls(e, fl[i]));
    });
  }

  // ---- Shadowing (câu đang luyện + các câu còn lại trong danh sách) ----
  function markShadow() {
    const list = document.getElementById('sh-list');
    if (!list || !Array.isArray(sentences)) return;
    const map = build();
    list.querySelectorAll('.sh-row[data-i]').forEach((row) => {
      const s = sentences[+row.getAttribute('data-i')];
      if (!s) return;
      const box = row.querySelector('.sh-text');
      if (!box || box.classList.contains('masked')) return;
      const has = map.has(String(s.id));
      if (row.classList.contains('active')) {
        const els = Array.from(box.querySelectorAll('.sh-w'));
        els.forEach(clear);
        if (!has) return;
        const fl = flags(s, els.map((e) => e.textContent));
        if (fl) els.forEach((e, i) => setCls(e, fl[i]));
        return;
      }
      const marked = !!box.querySelector('.vs-w');
      if (!has && !marked) return;
      const toks = String(s.text).split(/\s+/).filter(Boolean);
      const fl = has ? flags(s, toks) : null;
      if (!fl) { if (marked) box.textContent = s.text; return; }
      box.innerHTML = toks.map((t, i) => fl[i] ? '<span class="' + fl[i] + '">' + esc(t) + '</span>' : esc(t)).join(' ');
    });
  }

  window.vsFlags = flags;
  window.vsMarkShadow = markShadow;
  window.vsRefresh = function () {
    try { markMain(); } catch (e) { console.warn('[vocab-highlight]', e); }
    try { markShadow(); } catch (e) { console.warn('[vocab-highlight]', e); }
    try { if (window.vsDcRefresh) window.vsDcRefresh(); } catch (e) { console.warn('[vocab-highlight]', e); }
  };

  // Vẽ lại danh sách phụ đề -> đánh dấu lại
  const origRender = window.renderSubtitleList;
  if (typeof origRender === 'function') {
    window.renderSubtitleList = function () {
      const r = origRender.apply(this, arguments);
      try { markMain(); } catch (e) { console.warn('[vocab-highlight]', e); }
      return r;
    };
  }
  // Lưu / xoá / sửa từ vựng ở bất cứ đâu -> cập nhật ngay tại chỗ (không vẽ lại, nên không làm mất vùng đang bôi đen)
  let timer = 0;
  const origSet = window.setVocab;
  if (typeof origSet === 'function') {
    window.setVocab = function () {
      const r = origSet.apply(this, arguments);
      clearTimeout(timer);
      timer = setTimeout(window.vsRefresh, 0);
      return r;
    };
  }
})();
