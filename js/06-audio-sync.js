
(function () {
  'use strict';
  const CLS = ['vs-w', 'vs-first', 'vs-last', 'vs-cont'];
  const collapse = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const cleanVid = (id) => String(id || '').replace(/^(yt|video):/, '').trim().toLowerCase();

  // Tìm toạ độ từ/cụm từ (kể cả đã chia, đại từ phản thân, trợ từ quá khứ, dấu câu)
  function getWordSpan(text, term) {
    if (typeof window !== 'undefined' && typeof window.findWordSpanInString === 'function') {
      return window.findWordSpanInString(text, term);
    }
    if (!text || !term) return null;
    text = String(text); term = String(term).trim();
    const cleanTerm = term.replace(/[!?,;.:«»"“”()]+$/, '').replace(/^[«»"“”()]+/, '').trim();
    const isReflexive = /^(se|s\x27|s’)\s*/i.test(cleanTerm);
    const cleanP = cleanTerm.replace(/^(se|s\x27|s’)\s*/i, '');
    const words = cleanP.split(/\s+/).filter(Boolean);
    if (!words.length) return null;

    const exactTokens = cleanTerm.split(/\s+/).filter(Boolean);
    if (exactTokens.length) {
      const reExact = exactTokens.map(t => reEsc(t).replace(/[\x27\u2019]/g, '[\x27\u2019]?')).join('\\s+');
      const re = new RegExp('(^|[^\\p{L}])(' + reExact + ')(?=$|[^\\p{L}])', 'iu');
      const m = re.exec(text);
      if (m) return { start: m.index + m[1].length, end: m.index + m[1].length + m[2].length, match: m[2] };
    }
    const pronounPart = isReflexive
      ? '(?:(?:se|s[\x27\u2019]|me|m[\x27\u2019]|te|t[\x27\u2019]|nous|vous)\\s*(?:(?:suis|es|est|sommes|êtes|etes|sont|ai|as|a|avons|avez|ont|étais|etait|étaient|etaient)\\s+)?)?'
      : '';
    const bodyPart = words.map((w) => {
      const pure = w.replace(/[\x27\u2019]/g, '').toLowerCase();
      if (/^(du|de|des|le|la|les|un|une|d|l|en|à|au|aux)$/i.test(pure)) {
        return '(?:de\\s+(?:tes|ses|mes|nos|vos|leurs?)|du|de|des|le|la|les|un|une|d[\x27\u2019]|l[\x27\u2019]|en|à|au|aux)';
      }
      if (pure === 'prendre' || pure === 'pris') return '(?:prendre|prends?|prennent|prenons|prenez|prenait|prenaient|pris)';
      if (pure === 'faire' || pure === 'fait') return '(?:faire|fais|fait|faisons|faites|font|faisait|faisaient|fera|feront)';
      if (pure === 'avoir' || pure === 'eu') return '(?:avoir|ai|as|a|avons|avez|ont|avait|avaient|eu)';
      if (pure === 'être' || pure === 'etre' || pure === 'été' || pure === 'ete') return '(?:être|etre|suis|es|est|sommes|êtes|etes|sont|étais|etait|étaient|etaient|été|ete)';
      if (pure === 'mettre' || pure === 'mis') return '(?:mettre|mets?|mettent|mettons|mettez|mettait|mettaient|mis)';
      if (pure === 'aller' || pure === 'va' || pure === 'vais') return '(?:aller|vais|vas|va|allons|allez|vont|allait|allaient|allé|alle)';
      const pureNoElision = w.replace(/^[ldsjcn][\x27\u2019]/i, '');
      if (pureNoElision.length >= 4) {
        const stem = pureNoElision.slice(0, Math.min(pureNoElision.length - 2, 4));
        return '(?:[ldsjcn][\x27\u2019])?' + reEsc(stem) + '[\\p{L}\x27\u2019]*';
      }
      return reEsc(w).replace(/[\x27\u2019]/g, '[\x27\u2019]?') + '[sx]?';
    }).join('\\s+');

    const reGrammar = new RegExp('(^|[^\\p{L}])(' + pronounPart + bodyPart + ')(?=$|[^\\p{L}])', 'iu');
    const mg = reGrammar.exec(text);
    if (mg) return { start: mg.index + mg[1].length, end: mg.index + mg[1].length + mg[2].length, match: mg[2] };
    return null;
  }

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
    const cVid = cleanVid(vid);
    const vocabList = (typeof getVocab === 'function') ? getVocab() : [];
    const items = vocabList.filter((x) => x && !x.bookId && cleanVid(x.videoId) === cVid && x.text);
    if (!items.length) return map;

    const canons = S.map(canonOf), offs = [], ends = [];
    let full = '';
    canons.forEach((c, i) => { if (i) full += ' '; offs[i] = full.length; full += c; ends[i] = full.length; });
    const idxAt = (pos) => { let lo = 0, hi = offs.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (offs[m] <= pos) lo = m; else hi = m - 1; } return lo; };
    const timeDist = (k, t) => {
      const s = S[k], a = +s.startTime, b = +s.endTime;
      if (!isFinite(a)) return 0;
      if (t < a) return a - t;
      if (isFinite(b) && t > b) return t - b;
      return 0;
    };
    const lim = (typeof isTextMode !== 'undefined' && isTextMode) ? 1.5 : 8;

    items.forEach((x) => {
      const enRaw = String(x.en || ''), hsN = +x.hs, heN = +x.he;
      const en = collapse(enRaw);
      const t = +x.t || 0;
      let best = null;

      // 1) Khớp ngữ cảnh đã lưu trong full transcript (hỗ trợ cả trích đoạn/mệnh đề nằm trong câu)
      if (en) {
        for (let p = full.indexOf(en); p >= 0; p = full.indexOf(en, p + 1)) {
          const k = idxAt(p);
          if (p >= offs[k] && p + en.length <= ends[k] + 1) {
            let wordStart = 0, wordEnd = en.length;
            if (isFinite(hsN) && isFinite(heN) && heN > hsN && heN <= enRaw.length) {
              const sub = enRaw.slice(hsN, heN).trim();
              if (sub.length > 1 && !/^[.,;:!?]+$/.test(sub) && getWordSpan(sub, x.text)) {
                wordStart = collapse(enRaw.slice(0, hsN)).length;
                wordEnd = collapse(enRaw.slice(0, heN)).length;
              }
            }
            if (wordStart === 0 && wordEnd === en.length) {
              const span = getWordSpan(en, x.text);
              if (span) {
                wordStart = span.start;
                wordEnd = span.end;
              }
            }
            const d = timeDist(k, t);
            if (!best || d < best.d) {
              best = { a: p + wordStart, b: p + wordEnd, d };
            }
          }
        }
      }

      // 2) Câu đã bị chia lại / sửa dấu câu: tìm đúng từ/cụm/dạng đã chia ở câu gần mốc thời gian đã lưu nhất
      if (!best) {
        for (let k = 0; k < S.length; k++) {
          const d = timeDist(k, t);
          if (d > lim || (best && d >= best.d)) continue;
          const span = getWordSpan(canons[k], x.text);
          if (span) {
            best = { a: offs[k] + span.start, b: offs[k] + span.end, d };
          }
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

  // ---- Giao diện Mặc định + Đọc báo/IELTS (danh sách cuộn bên phải) ----
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

  // ---- Thẻ câu đang phát (#cs-text ở dưới video) ----
  function markCs() {
    const csBox = document.getElementById('cs-text');
    if (!csBox || !Array.isArray(sentences)) return;
    const map = build();
    csBox.querySelectorAll('.vs-w').forEach(clear);
    if (!map.size) return;
    const idx = parseInt(csBox.getAttribute('data-idx'), 10);
    if (isNaN(idx) || !sentences[idx]) return;
    const s = sentences[idx];
    if (!map.has(String(s.id))) return;
    const els = Array.from(csBox.querySelectorAll('.cs-w'));
    if (!els.length) return;
    const fl = flags(s, els.map((e) => e.textContent));
    if (fl) els.forEach((e, i) => setCls(e, fl[i]));
  }

  // Tự động cập nhật toạ độ từ vựng khi thẻ câu hiện tại (#cs-text) thay đổi
  try {
    const csBox = document.getElementById('cs-text');
    if (csBox && typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(() => {
        try { markCs(); } catch (e) {}
      });
      obs.observe(csBox, { childList: true });
    }
  } catch (e) {}

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

  window.computeVocabMap = compute;
  window.vsFlags = flags;
  window.vsMarkMain = markMain;
  window.vsMarkCs = markCs;
  window.vsMarkShadow = markShadow;
  window.vsRefresh = function () {
    try { markMain(); } catch (e) { console.warn('[vocab-highlight]', e); }
    try { markCs(); } catch (e) { console.warn('[vocab-highlight]', e); }
    try { markShadow(); } catch (e) { console.warn('[vocab-highlight]', e); }
    try { if (window.vsDcRefresh) window.vsDcRefresh(); } catch (e) { console.warn('[vocab-highlight]', e); }
  };

  // Vẽ lại danh sách phụ đề -> đánh dấu lại
  const origRender = window.renderSubtitleList;
  if (typeof origRender === 'function') {
    window.renderSubtitleList = function () {
      const r = origRender.apply(this, arguments);
      try { markMain(); } catch (e) { console.warn('[vocab-highlight]', e); }
      try { markCs(); } catch (e) { console.warn('[vocab-highlight]', e); }
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
