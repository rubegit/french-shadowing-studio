    // =====================================================================================
    // ==================== ĐỌC SÁCH (BOOK READER) — PHẦN 1: LƯU TRỮ + NẠP SÁCH ====================
    // Sách được lưu trong IndexedDB (không dùng localStorage vì chỉ ~5MB). Mỗi sách = 1 bản ghi
    // "books" (thông tin + vị trí đọc) + N bản ghi "chapters" (từng chương, kèm bản dịch).
    // Mô hình câu trong bộ nhớ: { id, text, vi?, p (số đoạn), h? (tiêu đề phụ), startTime, endTime }
    // — dùng đúng tên trường của app cũ để tái sử dụng tra nghĩa / lưu từ vựng / ghép song ngữ.
    // =====================================================================================
    Object.assign(SVG_ICONS, {
      'book-open': `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
      'list': `<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>`,
      'type': `<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>`,
      'maximize': `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`
    });

    const BK_DB_NAME = 'shadowing_books_v1';
    const BK_MAX_CH_WORDS = 7000;     // chương dài hơn mức này sẽ được chia nhỏ để đọc nhẹ + render nhanh
    const BK_SIZE_PART_WORDS = 2500;  // cỡ mỗi phần khi chia đều theo độ dài
    let bkLibrary = [];               // danh sách thông tin sách (không kèm nội dung) để vẽ thư viện

    const bkWc = (t) => { t = String(t || '').trim(); return t ? t.split(/\s+/).length : 0; };
    const bkUid = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    function bkHue(str) { let h = 7; const s = String(str || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
    function bkToast(msg) { try { showVocabToast(msg, false); } catch (e) { alert(msg); } }
    function bkLoading(on, text) {
      const el = document.getElementById('bk-loading');
      if (!el) return;
      el.classList.toggle('open', !!on);
      if (text) document.getElementById('bk-loading-text').textContent = text;
    }
    const bkTick = () => new Promise((r) => setTimeout(r, 0));   // nhường luồng chính để vòng xoay kịp vẽ

    // ---------- IndexedDB ----------
    let bkDbP = null;
    function bkDb() {
      if (bkDbP) return bkDbP;
      bkDbP = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('Trình duyệt này không hỗ trợ IndexedDB')); return; }
        const req = indexedDB.open(BK_DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore('books', { keyPath: 'id' });
          const cs = db.createObjectStore('chapters', { keyPath: 'key' });
          cs.createIndex('bookId', 'bookId', { unique: false });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { bkDbP = null; reject(req.error); };
      });
      return bkDbP;
    }
    const bkReq = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const bkTxDone = (tx) => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Giao dịch bị hủy')); });

    async function bkDbListBooks() {
      const db = await bkDb();
      return bkReq(db.transaction('books', 'readonly').objectStore('books').getAll());
    }
    async function bkDbGetChapters(bookId) {
      const db = await bkDb();
      const rows = await bkReq(db.transaction('chapters', 'readonly').objectStore('chapters').index('bookId').getAll(bookId));
      return rows.sort((a, b) => a.idx - b.idx);
    }
    async function bkDbSaveBook(meta, chapterRecs) {
      const db = await bkDb();
      const tx = db.transaction(['books', 'chapters'], 'readwrite');
      tx.objectStore('books').put(meta);
      if (chapterRecs) { const cs = tx.objectStore('chapters'); chapterRecs.forEach((r) => cs.put(r)); }
      return bkTxDone(tx);
    }
    async function bkDbDeleteBook(id) {
      const db = await bkDb();
      const tx = db.transaction(['books', 'chapters'], 'readwrite');
      tx.objectStore('books').delete(id);
      const cs = tx.objectStore('chapters');
      const keys = await bkReq(cs.index('bookId').getAllKeys(id)).catch(() => []);
      (keys || []).forEach((k) => cs.delete(k));
      return bkTxDone(tx);
    }

    // chuyển giữa dạng lưu (gọn) <-> dạng trong bộ nhớ (đủ trường cho code cũ)
    function bkHydrateChapter(rec) {
      const s = (rec.s || []).map((x, i) => {
        const o = { id: i + 1, text: x.t, p: x.p || 0, startTime: i, endTime: i + 1 };
        if (x.v) o.vi = x.v;
        if (x.h) o.h = 1;
        if (x.e) o.e = 1;
        return o;
      });
      return { idx: rec.idx, title: rec.title, s, words: rec.words || s.reduce((a, x) => a + bkWc(x.text), 0), lv: rec.lv || 0, pa: rec.pa || [] };
    }
    function bkDehydrateChapter(bookId, ch) {
      return {
        key: `${bookId}:${ch.idx}`, bookId, idx: ch.idx, title: ch.title, words: ch.words, lv: ch.lv || 0, pa: ch.pa || [],
        s: ch.s.map((x) => { const o = { t: x.text, p: x.p || 0 }; if (x.vi && String(x.vi).trim()) o.v = String(x.vi).trim(); if (x.h) o.h = 1; if (x.e) o.e = 1; return o; })
      };
    }
    async function bkRefreshLibrary() {
      try { bkLibrary = (await bkDbListBooks()).sort((a, b) => (b.openedAt || b.createdAt || 0) - (a.openedAt || a.createdAt || 0)); }
      catch (e) { bkLibrary = []; }
      bkRenderLibrary();
    }

    // =====================================================================================
    // ==================== PHÂN TÍCH VĂN BẢN → KHỐI (block) → CHƯƠNG ====================
    // Khối: { k:'p', text } hoặc { k:'h', lvl, src:'md'|'kw'|'caps'|'h'|'size', text, toc? }
    // =====================================================================================
    const BK_KW_RE = /^(chapter|chương|chuong|part|phần|phan|book|section|lesson|unit)\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b(?:[\s:.\-–—|]+.*)?$/i;
    const BK_KW_SOLO = /^(prologue|epilogue|introduction|foreword|preface|afterword|appendix(?:\s+[a-z0-9]+)?|conclusion|acknowledg(?:e)?ments?|about the author|author'?s note|preamble|lời nói đầu|lời tựa|lời giới thiệu|mở đầu|kết luận|phụ lục|lời cảm ơn)\s*[:.]?$/i;
    const BK_SKIP_TITLE = /^(sources?|references|further reading|next on .+|important notes? on this book.*|disclaimer|table of contents|contents|copyright(?:\s+page)?|about the author|about the authors|also by.*|also by.*|praise for.*|title page|cover|half title|about the publisher|about the author|mục lục|bản quyền|colophon|dedication|acknowledg(e)?ments?|notes?|index|bibliography|endnotes?|credits|newsletter|sign up.*|further reading|permissions)$/i;

    function bkHeadingOf(line) {
      const t = String(line || '').trim();
      if (!t || t.length > 120) return null;
      let m = /^(#{1,6})\s+(.+?)\s*#*$/.exec(t);
      if (m) return { lvl: m[1].length, src: 'md', text: m[2].trim() };
      const wc = bkWc(t);
      if (t.length <= 90 && (BK_KW_RE.test(t) || BK_KW_SOLO.test(t)) && (!/[.!?]$/.test(t) || wc <= 6)) return { lvl: 1, src: 'kw', text: t.replace(/\s*[:.]$/, '') };
      const letters = t.replace(/[^A-Za-zÀ-ỹ]/g, '');
      if (letters.length >= 3 && t.length <= 70 && letters === letters.toUpperCase() && !/[.!?]$/.test(t) && wc <= 10 && !/^\d+$/.test(t)) return { lvl: 2, src: 'caps', text: t };
      return null;
    }

    function bkCleanInline(t) {
      return String(t || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[\s(“"'])[*_]([^*_\s][^*_]*?)[*_](?=$|[\s.,;:!?)”"'])/g, '$1$2')
        .replace(/^\s*>\s?/, '')
        .replace(/\s+/g, ' ').trim();
    }

    function bkStripGutenberg(raw) {
      const t = String(raw || '');
      const m = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK\s*(.*?)\s*\*\*\*/i.exec(t);
      if (!m) return { text: t };
      const head = t.slice(0, m.index);
      const gt = /^\s*Title:\s*(.+)$/im.exec(head), ga = /^\s*Author:\s*(.+)$/im.exec(head);
      let body = t.slice(m.index + m[0].length);
      const e = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i.exec(body);
      if (e) body = body.slice(0, e.index);
      return { text: body, title: gt ? gt[1].trim() : '', author: ga ? ga[1].trim() : '' };
    }

    function bkBlocksFromText(raw) {
      const text = String(raw || '').replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').replace(/[\u200b\u200c\u200d\u00ad]/g, '').replace(/\u00a0/g, ' ');
      const lens = text.split('\n').map((l) => l.trim().length).filter(Boolean).sort((a, b) => a - b);
      const p95 = lens[Math.floor(lens.length * 0.95)] || 0, med = lens[Math.floor(lens.length / 2)] || 0;
      const hardWrap = p95 <= 110 && med >= 40;   // văn bản ngắt dòng cứng (kiểu Project Gutenberg): nối các dòng trong cùng 1 đoạn
      const blocks = [];
      const BUL = /^\s*(?:[-*•–]|\d{1,3}[.)])\s+/;
      const pushParas = (buf) => {
        if (!buf.length) return;
        if (buf.length >= 2 && buf.filter((l) => BUL.test(l)).length >= buf.length * 0.6) { buf.forEach((l) => { const c = bkCleanInline(l.replace(BUL, '')); if (c) blocks.push({ k: 'p', text: c }); }); return; }
        if (hardWrap || buf.length === 1) {
          let out = '';
          buf.forEach((l) => { if (!out) out = l; else if (/[a-z]-$/.test(out) && /^[a-z]/.test(l)) out = out.slice(0, -1) + l; else out += ' ' + l; });
          const c = bkCleanInline(out); if (c) blocks.push({ k: 'p', text: c });
        } else buf.forEach((l) => { const c = bkCleanInline(l); if (c) blocks.push({ k: 'p', text: c }); });
      };
      text.split(/\n[ \t]*\n+/).forEach((rb) => {
        const ls = rb.split('\n').map((l) => l.trim()).filter(Boolean);
        if (!ls.length) return;
        let buf = [];
        for (let i = 0; i < ls.length; i++) {
          const h = bkHeadingOf(ls[i]);
          const ok = h && (h.src === 'md' || h.src === 'kw' || ls.length === 1);
          if (ok) {
            pushParas(buf); buf = [];
            let title = h.text;
            if (h.src === 'kw' && i + 1 < ls.length && ls.length <= 4 && ls[i + 1].length <= 80 && !/[.!?]$/.test(ls[i + 1]) && !bkHeadingOf(ls[i + 1])) { title += ': ' + ls[i + 1]; i++; }
            blocks.push({ k: 'h', lvl: h.lvl, src: h.src, text: bkCleanInline(title) });
          } else buf.push(ls[i]);
        }
        pushParas(buf);
      });
      return blocks;
    }

    // HTML (file .html hoặc 1 tài liệu trong EPUB) → khối.
    // marks: các mục của mục lục trỏ vào tài liệu này ({frag,label,depth,uid}); mỗi mục được chèn thành 1 khối
    // {k:'h', src:'toc'} đúng tại vị trí neo (id) của nó, nên nhiều bài trong CÙNG 1 file vẫn cắt riêng được.
    const BK_LEAF = new Set(['P', 'LI', 'PRE', 'FIGCAPTION', 'DT', 'DD', 'BLOCKQUOTE', 'TD', 'TH', 'CAPTION']);
    const BK_BLOCKISH = 'p,div,h1,h2,h3,h4,h5,h6,li,ul,ol,blockquote,table,tr,pre,section,article,dl';
    const bkNorm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9\u00c0-\u1ef9]+/g, '');
    function bkBlocksFromDom(root, marks) {
      marks = marks || [];
      root.querySelectorAll('script,style,nav,noscript,svg,head,sup,[epub\\:type="noteref"],[role="doc-noteref"]').forEach((e) => e.remove());
      root.querySelectorAll('a').forEach((a) => { if (/^\[?\d{1,3}\]?$/.test((a.textContent || '').trim()) && /#/.test(a.getAttribute('href') || '')) a.remove(); });
      const doc = root.ownerDocument, byId = {}, startMarks = [];
      marks.forEach((m) => { if (m.frag && doc.getElementById(m.frag)) (byId[m.frag] = byId[m.frag] || []).push(m); else startMarks.push(m); });
      const out = []; let buf = '', pend = '';
      const clean = (t) => t.replace(/\s*\[\d{1,3}(?:\s*[,–-]\s*\d{1,3})*\]/g, '');
      const same = (t) => { const a = bkNorm(t); return !!pend && !!a && (a === pend || (a.length > 3 && pend.length > 3 && (pend.startsWith(a) || a.startsWith(pend)))); };
      const pushMark = (m) => { if (m.done) return; m.done = true; out.push({ k: 'h', lvl: 1, src: 'toc', toc: true, uid: m.uid, depth: m.depth, text: m.label }); pend = bkNorm(m.label); };
      const addP = (t, epi) => { t = clean(t).replace(/\s+/g, ' ').trim(); if (!t) return; if (same(t)) { pend = ''; return; } pend = ''; const b = { k: 'p', text: t }; if (epi) b.epi = true; out.push(b); };
      const addH = (t, lvl) => { t = t.replace(/\s+/g, ' ').trim(); if (!t) return; if (same(t)) { pend = ''; return; } pend = ''; out.push({ k: 'h', lvl, src: 'h', text: t }); };
      const flush = () => { const t = buf; buf = ''; addP(t); };
      const fire = (el, deep) => {
        if (el.id && byId[el.id]) { flush(); byId[el.id].forEach(pushMark); }
        if (deep && el.querySelectorAll) el.querySelectorAll('[id]').forEach((x) => { if (byId[x.id]) { flush(); byId[x.id].forEach(pushMark); } });
      };
      startMarks.forEach(pushMark);
      const walk = (node) => {
        node.childNodes.forEach((c) => {
          if (c.nodeType === 3) { buf += c.nodeValue; return; }
          if (c.nodeType !== 1) return;
          const tag = c.tagName;
          if (tag === 'BR') { buf += ' '; return; }
          if (tag === 'IMG') return;
          const hasBlock = !!c.querySelector(BK_BLOCKISH), isHead = /^H[1-6]$/.test(tag);
          const leaf = isHead || (BK_LEAF.has(tag) && !hasBlock);
          fire(c, leaf);
          if (isHead) { flush(); addH(c.textContent || '', +tag[1]); return; }
          if (leaf) { flush(); addP(c.textContent || '', /callout|epigraph|pull-?quote/i.test(c.getAttribute('class') || '')); return; }
          if (hasBlock || /^(DIV|SECTION|ARTICLE|UL|OL|TABLE|TBODY|THEAD|TR|DL|MAIN|BODY|ASIDE|HEADER|FOOTER|FIGURE|BLOCKQUOTE|LI|P)$/.test(tag)) { flush(); walk(c); flush(); return; }
          buf += c.textContent || '';
        });
      };
      walk(root); flush();
      return out;
    }

    // Chọn quy tắc ranh giới chương từ các tiêu đề tìm được, rồi cắt khối thành chương.
    const BK_PART_RE = /^(part|book|section|volume|act)\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b|^(bonus|appendix|appendices|extras?|epilogue|prologue)\s*$/i;
    const BK_BACK_RE = /^(about the authors?|sources?|appreciation|acknowledg(?:e)?ments?|notes|endnotes|bibliography|references|index|glossary|next on .*|also by .*)$/i;

    // Cắt chương đúng theo mục lục của sách. Cấp bậc (lv): 0 = Part, 1 = nhóm, 2 = bài.
    // Mục lục trống nội dung (trang "Part I", trang nhóm chỉ có 1 câu trích) được gộp vào bài đầu tiên phía sau
    // (câu trích thành "epigraph", tiêu đề hiện ở dòng breadcrumb) nhưng vẫn xuất hiện trong mục lục.
    function bkChapterizeToc(blocks) {
      const front = { title: 'Mở đầu', paras: [], front: true, skipDefault: true, lv: 0 };
      let cur = front; const ents = [];
      blocks.forEach((b) => {
        if (b.k === 'h' && b.src === 'toc') { cur = { uid: b.uid, title: String(b.text).replace(/\s+/g, ' ').trim(), depth: b.depth || 0, paras: [] }; ents.push(cur); }
        else if (b.k === 'h') cur.paras.push({ text: b.text, h: 1 });
        else { const p = { text: b.text }; if (b.epi) p.epi = true; cur.paras.push(p); }
      });
      const wc = (e) => e.paras.reduce((a, p) => a + bkWc(p.text), 0);
      ents.forEach((e) => { e.words = wc(e); });
      front.words = wc(front);
      const isDiv = (e, i) => e.depth === 0 && e.words < 40 && BK_PART_RE.test(e.title) && i < ents.length - 1;
      const flatParts = ents.some((e, i) => isDiv(e, i) && !(ents[i + 1].depth > e.depth));
      ents.forEach((e, i) => {
        e.div = isDiv(e, i);
        e.lv = e.div ? (flatParts ? 0 : e.depth) : (e.depth + (flatParts ? 1 : 0));
        if (flatParts && !e.div && e.depth === 0 && BK_BACK_RE.test(e.title)) e.lv = 0;   // phần cuối sách không thuộc "Bonus"
      });
      const chapters = []; let carry = []; const stack = [];
      ents.forEach((e, i) => {
        while (stack.length && stack[stack.length - 1].lv >= e.lv) stack.pop();
        const next = ents[i + 1], container = !!next && next.lv > e.lv;
        const node = { uid: e.uid, t: e.title, lv: e.lv };
        if (next && e.words < 40 && (e.div || container)) {
          const nt = bkNorm(e.title);
          carry = carry.concat(e.paras.filter((p) => bkNorm(p.text) !== nt).map((p) => Object.assign({}, p, { epi: true })));
          stack.push(node); return;
        }
        const paras = carry.concat(e.paras.filter((p, k) => !(k === 0 && bkNorm(p.text) === bkNorm(e.title))));
        carry = [];
        chapters.push({ uid: e.uid, title: e.title, lv: e.lv, paras, pathNodes: stack.slice() });
        if (container) stack.push(node);
      });
      if (carry.length && chapters.length) chapters[chapters.length - 1].paras = chapters[chapters.length - 1].paras.concat(carry);
      chapters.forEach((c) => { c.words = wc(c); });
      const all = [];
      if (front.words >= 60) all.push(front);
      chapters.forEach((c) => {
        if (c.words > BK_MAX_CH_WORDS) {
          const k = Math.max(2, Math.round(c.words / 4500));
          bkSplitParas(c.paras, Math.ceil(c.words / k)).forEach((ps, i, arr) => all.push(Object.assign({}, c, { title: `${c.title} (${i + 1}/${arr.length})`, paras: ps })));
        } else all.push(c);
      });
      all.forEach((c) => { c.words = wc(c); });
      return { chapters: all, bookTitle: '', toc: true };
    }

    // Dàn ý (mục lục có cấp bậc) cho các chương được chọn: tự thêm tiêu đề Part / nhóm còn thiếu.
    function bkBuildOutline(chosen) {
      const out = [], seen = new Set();
      chosen.forEach((c, i) => {
        (c.pathNodes || []).forEach((n) => { if (!seen.has(n.uid)) { seen.add(n.uid); out.push({ t: n.t, lv: n.lv, ch: i, own: false }); } });
        out.push({ t: c.title, lv: c.lv || 0, ch: i, own: true });
      });
      return out;
    }

    function bkChapterize(blocks, opts) {
      opts = opts || {};
      const mode = opts.mode || 'auto';
      if (mode !== 'size' && blocks.filter((b) => b.k === 'h' && b.src === 'toc').length >= 3) return bkChapterizeToc(blocks);
      const heads = blocks.filter((b) => b.k === 'h');
      let titleBlock = null, isBoundary = () => false;
      if (mode !== 'size' && heads.length) {
        const real = heads.filter((h) => h.src !== 'caps' && !h.toc);
        const byLvl = {};
        real.forEach((h) => { byLvl[h.lvl] = (byLvl[h.lvl] || 0) + 1; });
        let lvls = Object.keys(byLvl).map(Number).sort((a, b) => a - b);
        if (lvls.length > 1 && byLvl[lvls[0]] === 1 && real.find((h) => h.lvl === lvls[0]).src !== 'kw') {   // 1 tiêu đề cấp cao nhất duy nhất = tên sách
          titleBlock = real.find((h) => h.lvl === lvls[0]);
          lvls = lvls.slice(1);
        }
        let L = null, cum = 0;
        for (const l of lvls) { cum += byLvl[l]; if (cum >= 3 || (cum >= 2 && lvls.length === 1)) { L = l; break; } }
        if (L === null && lvls.length) L = lvls[lvls.length - 1];
        if (L !== null && cum >= 2) isBoundary = (h) => h.src !== 'caps' && h !== titleBlock && h.lvl <= L;
        else if (heads.filter((h) => h.src === 'caps').length >= 3) isBoundary = (h) => h.src === 'caps';
      }
      if (!titleBlock && opts.wantTitle) titleBlock = null;
      let chapters = [], cur = { title: opts.frontTitle || 'Mở đầu', paras: [], front: true };
      blocks.forEach((b) => {
        if (b === titleBlock) return;
        if (b.k === 'h' && (b.toc || isBoundary(b))) {
          if (cur.paras.length || !cur.front) chapters.push(cur);
          cur = { title: b.text, paras: [], front: false };
        } else if (b.k === 'h') {
          // "Chapter 3" + dòng phụ đề ngay bên dưới → "Chapter 3: Phụ đề"
          if (!cur.paras.length && !cur.front && BK_KW_RE.test(cur.title) && cur.title.length < 28 && !/[:–—]/.test(cur.title) && b.src !== 'caps' && b.text.length < 90) cur.title += ': ' + b.text;
          else cur.paras.push({ text: b.text, h: 1 });
        }
        else cur.paras.push({ text: b.text });
      });
      chapters.push(cur);
      chapters.forEach((c) => { c.words = c.paras.reduce((a, p) => a + bkWc(p.text), 0); });

      // Chương rỗng/rất ngắn (trang "Part 1", dòng mục lục): ≥3 mục rỗng liên tiếp = mục lục -> bỏ; còn lại gộp thành tiêu đề phụ của chương kế
      const merged = [];
      for (let i = 0; i < chapters.length; i++) {
        const c = chapters[i];
        if (c.front && c.words < 60) continue;
        if (c.words < 25 && !c.front && i < chapters.length - 1 && !BK_SKIP_TITLE.test((c.title || '').trim())) {
          let j = i; while (j < chapters.length - 1 && chapters[j].words < 25 && !chapters[j].front) j++;
          if (j - i >= 3) { i = j - 1; continue; }
          const carry = [];
          for (let k = i; k < j; k++) { carry.push({ text: chapters[k].title, h: 1 }); chapters[k].paras.forEach((p) => carry.push(p)); }
          chapters[j].paras = carry.concat(chapters[j].paras);
          chapters[j].words = chapters[j].paras.reduce((a, p) => a + bkWc(p.text), 0);
          i = j - 1; continue;
        }
        merged.push(c);
      }
      chapters = merged.filter((c) => c.paras.length);

      // chia đều theo độ dài khi không có tiêu đề (hoặc người dùng chọn), và chia nhỏ chương quá dài
      const out = [];
      if (mode === 'size' || (chapters.length === 1 && chapters[0].front && chapters[0].words > BK_MAX_CH_WORDS)) {
        const all = []; chapters.forEach((c) => c.paras.forEach((p) => all.push(p)));
        bkSplitParas(all, BK_SIZE_PART_WORDS).forEach((ps, i) => out.push({ title: `Phần ${i + 1}`, paras: ps }));
      } else {
        chapters.forEach((c) => {
          if (c.words > BK_MAX_CH_WORDS) {
            const k = Math.max(2, Math.round(c.words / 4500));
            bkSplitParas(c.paras, Math.ceil(c.words / k)).forEach((ps, i, arr) => out.push({ title: `${c.title} (${i + 1}/${arr.length})`, paras: ps }));
          } else out.push({ title: c.title, paras: c.paras });
        });
      }
      out.forEach((c) => { c.words = c.paras.reduce((a, p) => a + bkWc(p.text), 0); });
      return { chapters: out, bookTitle: titleBlock ? titleBlock.text : '' };
    }

    function bkSplitParas(paras, target) {
      const parts = []; let cur = [], w = 0;
      paras.forEach((p) => {
        cur.push(p); w += bkWc(p.text);
        if (w >= target) { parts.push(cur); cur = []; w = 0; }
      });
      if (cur.length) { if (parts.length && w < target * 0.4) parts[parts.length - 1] = parts[parts.length - 1].concat(cur); else parts.push(cur); }
      return parts;
    }

    // đoạn văn → các câu (dùng lại bộ tách câu của chế độ "văn bản" để cách tách luôn nhất quán)
    function bkSplitSentences(text) {
      const r = splitProseIntoSentences(text);
      return r.length ? r.map((x) => x.text) : (String(text).trim() ? [String(text).trim()] : []);
    }
    // chương (đoạn) → bản ghi chương gồm câu
    function bkBuildChapterRec(ch, idx) {
      const s = []; let p = 0;
      ch.paras.forEach((pa) => {
        const parts = pa.h ? [pa.text] : bkSplitSentences(pa.text);
        parts.forEach((t) => { const o = { id: s.length + 1, text: t, p, startTime: s.length, endTime: s.length + 1 }; if (pa.h) o.h = 1; if (pa.epi) o.e = 1; s.push(o); });
        p++;
      });
      return { idx, title: ch.title, s, words: s.reduce((a, x) => a + bkWc(x.text), 0), lv: ch.lv || 0, pa: (ch.pathNodes || []).map((n) => n.t) };
    }

    // =====================================================================================
    // ==================== EPUB (tự giải nén ZIP, không cần thư viện ngoài) ====================
    // =====================================================================================
    function bkZipEntries(u8) {
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      let eocd = -1;
      for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
      if (eocd < 0) throw new Error('File không phải EPUB/ZIP hợp lệ.');
      const total = dv.getUint16(eocd + 10, true);
      let off = dv.getUint32(eocd + 16, true);
      const entries = {}, dec = new TextDecoder();
      for (let n = 0; n < total; n++) {
        if (dv.getUint32(off, true) !== 0x02014b50) break;
        const method = dv.getUint16(off + 10, true), csize = dv.getUint32(off + 20, true);
        const nlen = dv.getUint16(off + 28, true), elen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true);
        const lho = dv.getUint32(off + 42, true);
        entries[dec.decode(u8.subarray(off + 46, off + 46 + nlen))] = { method, csize, lho };
        off += 46 + nlen + elen + clen;
      }
      return entries;
    }
    async function bkZipRead(u8, e) {
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      const start = e.lho + 30 + dv.getUint16(e.lho + 26, true) + dv.getUint16(e.lho + 28, true);
      const data = u8.subarray(start, start + e.csize);
      if (e.method === 0) return data;
      if (typeof DecompressionStream === 'undefined') throw new Error('Trình duyệt quá cũ để mở EPUB (cần Chrome/Edge/Firefox/Safari bản mới).');
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    function bkDirOf(p) { const i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i + 1); }
    function bkResolvePath(base, href) {
      href = decodeURIComponent(String(href || '').split('#')[0]);
      const parts = (href.startsWith('/') ? href.slice(1) : base + href).split('/'), out = [];
      parts.forEach((s) => { if (s === '..') out.pop(); else if (s !== '.' && s !== '') out.push(s); });
      return out.join('/');
    }

    async function bkParseEpub(buf) {
      const u8 = new Uint8Array(buf), entries = bkZipEntries(u8), dec = new TextDecoder('utf-8');
      const readText = async (name) => { const e = entries[name]; if (!e) return null; return dec.decode(await bkZipRead(u8, e)); };
      const cont = await readText('META-INF/container.xml');
      if (!cont) throw new Error('EPUB thiếu META-INF/container.xml');
      const opfPath = (/full-path\s*=\s*"([^"]+)"/.exec(cont) || [])[1];
      const opfText = opfPath && await readText(opfPath);
      if (!opfText) throw new Error('Không đọc được file OPF trong EPUB.');
      const base = bkDirOf(opfPath), opf = new DOMParser().parseFromString(opfText, 'text/xml');
      const q = (sel) => Array.from(opf.querySelectorAll(sel));
      const meta = (n) => { const e = q(`metadata > *`).find((x) => (x.localName || '').toLowerCase() === n); return e ? e.textContent.trim() : ''; };
      const manifest = {};
      q('manifest > item').forEach((it) => { manifest[it.getAttribute('id')] = { href: bkResolvePath(base, it.getAttribute('href')), type: it.getAttribute('media-type') || '', props: it.getAttribute('properties') || '' }; });
      const spine = q('spine > itemref').filter((r) => (r.getAttribute('linear') || 'yes') !== 'no').map((r) => manifest[r.getAttribute('idref')]).filter(Boolean);

      // Mục lục (nav EPUB3 hoặc NCX EPUB2) → danh sách phẳng có độ sâu: { label, file, frag, depth }
      const tocEntries = [];
      const addToc = (baseDir, href, label, depth) => {
        label = String(label || '').replace(/\s+/g, ' ').trim();
        if (!href || !label) return;
        const hi = href.indexOf('#'), frag = hi >= 0 ? decodeURIComponent(href.slice(hi + 1)) : '';
        tocEntries.push({ label, file: bkResolvePath(baseDir, href), frag, depth });
      };
      const kids = (el, name) => Array.from(el.children).filter((x) => (x.localName || '').toLowerCase() === name);
      const navItem = Object.values(manifest).find((m) => /\bnav\b/.test(m.props));
      if (navItem && entries[navItem.href]) {
        const nd = new DOMParser().parseFromString(await readText(navItem.href), 'text/html'), nb = bkDirOf(navItem.href);
        const nav = nd.querySelector('nav[epub\\:type="toc"], nav#toc, nav') || nd;
        const walkOl = (ol, depth) => kids(ol, 'li').forEach((li) => {
          const a = Array.from(li.children).find((x) => /^(a|span)$/i.test(x.localName || ''));
          const href = a && a.getAttribute('href');
          if (href) addToc(nb, href, a.textContent, depth);
          kids(li, 'ol').forEach((sub) => walkOl(sub, depth + (href ? 1 : 0)));
        });
        const ol = nav.querySelector('ol');
        if (ol) walkOl(ol, 0);
      }
      if (!tocEntries.length) {
        const ncx = Object.values(manifest).find((m) => /ncx/.test(m.type));
        if (ncx && entries[ncx.href]) {
          const nd = new DOMParser().parseFromString(await readText(ncx.href), 'text/xml'), nb = bkDirOf(ncx.href);
          const walkNp = (np, depth) => {
            const lab = kids(np, 'navlabel')[0], ct = kids(np, 'content')[0];
            if (lab && ct) addToc(nb, ct.getAttribute('src'), lab.textContent, depth);
            kids(np, 'navpoint').forEach((c) => walkNp(c, depth + 1));
          };
          const nm = nd.querySelector('navMap');
          if (nm) kids(nm, 'navpoint').forEach((np) => walkNp(np, 0));
        }
      }
      tocEntries.forEach((e, i) => { e.uid = i; });
      const byFile = {};
      tocEntries.forEach((e) => { (byFile[e.file] = byFile[e.file] || []).push(e); });

      const blocks = [];
      for (let i = 0; i < spine.length; i++) {
        const it = spine[i];
        if (!/html|xml/.test(it.type) || /\bnav\b/.test(it.props) || !entries[it.href]) continue;
        const html = await readText(it.href);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const bl = bkBlocksFromDom(doc.body || doc.documentElement, byFile[it.href] || []);
        if (bl.length) blocks.push.apply(blocks, bl);
        if (i % 6 === 0) { bkLoading(true, `Đang đọc EPUB... (${i + 1}/${spine.length})`); await bkTick(); }
      }
      return { blocks, title: meta('title'), author: meta('creator') };
    }

    // =====================================================================================
    // ==================== PDF (nạp pdf.js từ CDN khi cần) ====================
    // =====================================================================================
    function bkLoadPdfJs() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(window.pdfjsLib); } catch (e) { reject(e); } };
        s.onerror = () => reject(new Error('Không tải được thư viện đọc PDF (cần kết nối internet). Bạn có thể dùng bản EPUB hoặc TXT của sách.'));
        document.head.appendChild(s);
      });
    }

    async function bkParsePdf(buf) {
      const lib = await bkLoadPdfJs();
      const pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
      const pages = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n), tc = await page.getTextContent();
        const lines = []; let cur = null;
        tc.items.forEach((it) => {
          if (typeof it.str !== 'string' || !it.transform) return;
          const x = it.transform[4], y = it.transform[5], size = Math.hypot(it.transform[0], it.transform[1]) || it.height || 10;
          if (!it.str.trim() && !cur) return;
          if (!cur || Math.abs(y - cur.y) > Math.max(2, size * 0.45)) { cur = { y, x0: x, x1: x + (it.width || 0), size, text: '' }; lines.push(cur); }
          if (cur.text && !/\s$/.test(cur.text) && !/^\s/.test(it.str) && x - cur.x1 > size * 0.12) cur.text += ' ';
          cur.text += it.str; cur.x1 = Math.max(cur.x1, x + (it.width || 0)); cur.size = Math.max(cur.size, size);
        });
        pages.push({ lines: lines.map((l) => Object.assign(l, { text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text), w: page.view[2] - page.view[0] });
        if (n % 5 === 0 || n === pdf.numPages) { bkLoading(true, `Đang đọc PDF... (${n}/${pdf.numPages} trang)`); await bkTick(); }
      }
      // cỡ chữ thân bài = cỡ chiếm nhiều ký tự nhất (tính trên toàn bộ trước khi lọc)
      const sizeChars = {};
      pages.forEach((pg) => pg.lines.forEach((l) => { const k = Math.round(l.size * 2) / 2; sizeChars[k] = (sizeChars[k] || 0) + l.text.length; }));
      const body = +Object.keys(sizeChars).sort((a, b) => sizeChars[b] - sizeChars[a])[0] || 10;
      // bỏ đầu trang / chân trang lặp lại và số trang (KHÔNG đụng tới tiêu đề: chữ lớn hơn thân bài hoặc dạng "Chapter 7")
      const keyOf = (t) => t.toLowerCase().replace(/\d+/g, '#');
      const isTitleLike = (l) => l.size > body * 1.1 || BK_KW_RE.test(l.text) || BK_KW_SOLO.test(l.text);
      const freq = {};
      pages.forEach((pg) => { const edge = pg.lines.slice(0, 2).concat(pg.lines.slice(-2)); new Set(edge.filter((l) => !isTitleLike(l)).map((l) => keyOf(l.text))).forEach((k) => { freq[k] = (freq[k] || 0) + 1; }); });
      const need = Math.max(4, pages.length * 0.3);
      pages.forEach((pg) => {
        const n = pg.lines.length;
        pg.lines = pg.lines.filter((l, i) => {
          const edge = i < 2 || i >= n - 2;
          if (!edge) return true;
          if (/^(page\s+)?[-–—]?\s*\d{1,4}\s*[-–—]?$/i.test(l.text)) return false;
          if (isTitleLike(l)) return true;
          return !(freq[keyOf(l.text)] >= need);
        });
      });
      const headSizes = Array.from(new Set([].concat(...pages.map((pg) => pg.lines.filter((l) => l.size > body * 1.22 && l.text.length <= 110).map((l) => Math.round(l.size)))))).sort((a, b) => b - a);

      const blocks = []; let para = '', prev = null, newPage = false;
      const flushPara = () => { const t = para.trim(); para = ''; if (!t) return; const h = t.length <= 90 && bkHeadingOf(t); if (h && h.src === 'kw') blocks.push({ k: 'h', lvl: 1, src: 'kw', text: h.text }); else blocks.push({ k: 'p', text: t }); };
      pages.forEach((pg) => {
        const xs = pg.lines.map((l) => l.x0).sort((a, b) => a - b), xe = pg.lines.map((l) => l.x1).sort((a, b) => a - b);
        const left = xs[Math.floor(xs.length * 0.1)] || 0, right = xe[Math.floor(xe.length * 0.9)] || pg.w;
        const gaps = []; for (let i = 1; i < pg.lines.length; i++) { const g = pg.lines[i - 1].y - pg.lines[i].y; if (g > 0) gaps.push(g); }
        gaps.sort((a, b) => a - b);
        const spacing = gaps[Math.floor(gaps.length / 2)] || body * 1.3;
        newPage = true;
        pg.lines.forEach((l, i) => {
          if (l.size > body * 1.22 && l.text.length <= 110) {
            flushPara();
            const lvl = Math.max(1, headSizes.indexOf(Math.round(l.size)) + 1), last = blocks[blocks.length - 1];
            if (last && last.k === 'h' && last.src === 'size' && last.lvl === lvl && !newPage) last.text += ' ' + l.text;
            else if (last && last.k === 'h' && last.src === 'size' && last.lvl === lvl && prev && prev.size === l.size && Math.abs(prev.y - l.y) < l.size * 2.2) last.text += ' ' + l.text;
            else blocks.push({ k: 'h', lvl, src: 'size', text: l.text });
            prev = l; newPage = false; return;
          }
          let np = !para;
          if (!np) {
            const ends = /[.!?:”"’')\]]$/.test(para.trim());
            const gap = !newPage && prev ? prev.y - l.y : 0;
            const indent = l.x0 - left > body * 0.9;
            const shortPrev = prev && prev.x1 < right - pg.w * 0.07;
            if (gap > spacing * 1.55) np = true;
            else if (indent && ends) np = true;
            else if (shortPrev && ends && !newPage) np = true;
            else if (newPage && ends && /^[A-Z“"‘']/.test(l.text)) np = true;
          }
          if (np) { flushPara(); para = l.text; }
          else if (/[a-z]-$/.test(para) && /^[a-z]/.test(l.text)) para = para.slice(0, -1) + l.text;
          else para += ' ' + l.text;
          prev = l; newPage = false;
        });
      });
      flushPara();
      let meta = {};
      try { meta = (await pdf.getMetadata()).info || {}; } catch (e) {}
      const junk = /^(untitled|anonymous|unknown|none|null|user|admin|author|title)\b|^microsoft|\.(docx?|indd|pdf|tex|pages)$/i;
      const clean = (v) => { v = String(v || '').trim(); return (!v || junk.test(v)) ? '' : v; };
      return { blocks, title: clean(meta.Title), author: clean(meta.Author) };
    }

    // =====================================================================================
    // ==================== LUỒNG NHẬP SÁCH: chọn file → phân tích → xem trước → lưu ====================
    // =====================================================================================
    let bkImp = null;   // { blocks, fmt, fileName, title, author, chapters:[{title,paras,words,on}], mode }

    function bkInitImport() {
      const drop = document.getElementById('bk-drop'), inp = document.getElementById('bk-file');
      if (!drop || !inp) return;
      drop.addEventListener('click', () => inp.click());
      drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
      ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); }));
      drop.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) bkHandleFile(f); });
      inp.addEventListener('change', () => { if (inp.files && inp.files[0]) bkHandleFile(inp.files[0]); inp.value = ''; });
    }

    async function bkHandleFile(file) {
      const name = file.name || 'sach', ext = (name.split('.').pop() || '').toLowerCase();
      const base = name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
      bkLoading(true, 'Đang đọc file...');
      await bkTick();
      try {
        let parsed;
        if (ext === 'json') {
          const obj = JSON.parse(await file.text());
          bkLoading(false);
          return bkImportBackup(obj);
        } else if (ext === 'epub') parsed = Object.assign({ fmt: 'epub' }, await bkParseEpub(await file.arrayBuffer()));
        else if (ext === 'pdf') parsed = Object.assign({ fmt: 'pdf' }, await bkParsePdf(await file.arrayBuffer()));
        else if (ext === 'html' || ext === 'htm') {
          const doc = new DOMParser().parseFromString(await file.text(), 'text/html');
          const t = (doc.querySelector('title') || {}).textContent || '';
          parsed = { fmt: 'html', blocks: bkBlocksFromDom(doc.body || doc.documentElement), title: t.trim() };
        } else {
          const g = bkStripGutenberg(await file.text());
          parsed = { fmt: ext === 'md' || ext === 'markdown' ? 'md' : 'txt', blocks: bkBlocksFromText(g.text), title: g.title || '', author: g.author || '' };
        }
        if (!parsed.blocks || !parsed.blocks.length) throw new Error('Không tìm thấy nội dung chữ trong file này (nếu là PDF scan ảnh thì cần OCR trước).');
        bkLoading(false);
        bkOpenImportPreview(parsed, base);
      } catch (e) {
        console.error(e);
        bkLoading(false);
        alert('Không nạp được sách: ' + (e && e.message ? e.message : e));
      }
    }

    function bkImportPasted() {
      const text = (document.getElementById('bk-paste-text').value || '').trim();
      if (!text) { bkToast('Hãy dán nội dung sách vào ô bên dưới trước đã'); return; }
      const blocks = bkBlocksFromText(text);
      if (!blocks.length) { bkToast('Không nhận ra nội dung nào trong văn bản đã dán'); return; }
      bkOpenImportPreview({ fmt: 'txt', blocks }, (document.getElementById('bk-paste-title').value || '').trim() || 'Sách của tôi');
    }

    function bkOpenImportPreview(parsed, fallbackTitle) {
      bkImp = { blocks: parsed.blocks, fmt: parsed.fmt, mode: 'auto', chapters: [] };
      document.getElementById('bk-imp-title').value = parsed.title || '';
      document.getElementById('bk-imp-author').value = parsed.author || '';
      document.getElementById('bk-imp-mode').value = 'auto';
      bkImportRechunk();
      if (!document.getElementById('bk-imp-title').value.trim()) document.getElementById('bk-imp-title').value = fallbackTitle || '';
      if (!document.getElementById('bk-imp-author').value.trim()) {
        for (let i = 0; i < Math.min(8, parsed.blocks.length); i++) {
          const b = parsed.blocks[i], m = b.k === 'p' && /^by\s+([A-Z][^.!?]{2,60})$/i.exec(b.text);
          if (m) { document.getElementById('bk-imp-author').value = m[1].trim(); break; }
        }
      }
      document.getElementById('bk-import-modal').classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    function bkImportRechunk() {
      if (!bkImp) return;
      const mode = document.getElementById('bk-imp-mode').value;
      const res = bkChapterize(bkImp.blocks, { mode });
      bkImp.chapters = res.chapters.map((c) => Object.assign(c, { on: !c.skipDefault && !BK_SKIP_TITLE.test((c.title || '').trim()) }));
      if (res.bookTitle && !document.getElementById('bk-imp-title').value.trim()) document.getElementById('bk-imp-title').value = res.bookTitle;
      bkImportRenderList();
    }
    function bkImportRenderList() {
      const list = document.getElementById('bk-imp-list');
      list.innerHTML = bkImp.chapters.map((c, i) =>
        `<label class="bk-chrow${c.on ? '' : ' off'}" style="padding-left:${10 + (c.lv > 1 ? 14 : 0)}px"><input type="checkbox" data-i="${i}" ${c.on ? 'checked' : ''} /><span class="t">${bkEsc(c.title)}${c.pathNodes && c.pathNodes.length ? `<span style="color:#64748b;font-size:.7rem"> · ${bkEsc(c.pathNodes.map((n) => n.t).join(' › '))}</span>` : ''}</span><span class="w">${c.words.toLocaleString('en-US')} từ</span></label>`).join('');
      list.querySelectorAll('input').forEach((cb) => cb.addEventListener('change', () => { bkImp.chapters[+cb.dataset.i].on = cb.checked; cb.closest('.bk-chrow').classList.toggle('off', !cb.checked); bkImportSummary(); }));
      bkImportSummary();
    }
    function bkImportSummary() {
      const on = bkImp.chapters.filter((c) => c.on), w = on.reduce((a, c) => a + c.words, 0);
      document.getElementById('bk-imp-sum').textContent = `${on.length}/${bkImp.chapters.length} phần được chọn · ${w.toLocaleString('en-US')} từ · đọc khoảng ${Math.max(1, Math.round(w / 200 / 60 * 10) / 10)} giờ`;
    }
    function bkImpAll(on) { bkImp.chapters.forEach((c) => { c.on = on; }); bkImportRenderList(); }
    function bkImportCancel() { document.getElementById('bk-import-modal').classList.remove('open'); bkImp = null; }

    async function bkBuildBook(chosen, info) {
      const id = info.id || bkUid(), recs = [];
      let sent = 0, words = 0;
      for (let i = 0; i < chosen.length; i++) {
        const hy = bkBuildChapterRec(chosen[i], i);
        sent += hy.s.length; words += hy.words;
        recs.push(bkDehydrateChapter(id, hy));
        if (i % 10 === 9) await bkTick();
      }
      const now = Date.now();
      const meta = Object.assign({ id, title: info.title, author: info.author || '', createdAt: now, updatedAt: now, openedAt: now, chapterCount: recs.length, wordCount: words, sentCount: sent, pos: { ch: 0, i: 0 }, cur: null, glossary: '', batch: 'M', hue: bkHue(info.title), format: info.fmt, transWords: 0, chTitles: recs.map((r) => r.title), chWords: recs.map((r) => r.words), chTr: recs.map(() => 0) }, info.extra || {});
      meta.outline = bkBuildOutline(chosen);
      return { meta, recs };
    }

    async function bkImportConfirm() {
      if (!bkImp) return;
      const chosen = bkImp.chapters.filter((c) => c.on);
      if (!chosen.length) { bkToast('Hãy chọn ít nhất 1 phần để nhập'); return; }
      const title = (document.getElementById('bk-imp-title').value || '').trim() || 'Sách không tên';
      const author = (document.getElementById('bk-imp-author').value || '').trim();
      const fmt = bkImp.fmt;
      document.getElementById('bk-import-modal').classList.remove('open');
      bkLoading(true, 'Đang tách câu và lưu sách...');
      await bkTick();
      try {
        const { meta, recs } = await bkBuildBook(chosen, { title, author, fmt });
        const id = meta.id;
        await bkDbSaveBook(meta, recs);
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
        bkImp = null;
        await bkRefreshLibrary();
        bkLoading(false);
        document.getElementById('bk-paste-text').value = '';
        bkOpenBook(id);
      } catch (e) {
        console.error(e);
        bkLoading(false);
        alert('Không lưu được sách: ' + (e && e.message ? e.message : e) + '\n(Có thể bộ nhớ trình duyệt đã đầy.)');
      }
    }

    // ---------- sao lưu / khôi phục ----------
    async function bkExportBook(id) {
      try {
        const metas = await bkDbListBooks(), meta = metas.find((m) => m.id === id);
        if (!meta) return;
        const chs = await bkDbGetChapters(id);
        const blob = new Blob([JSON.stringify({ format: 'shadowing-book-v1', meta, chapters: chs })], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${(meta.title || 'sach').replace(/[^\w\-]+/g, '_').slice(0, 60)}.shadowbook.json`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      } catch (e) { bkToast('Không xuất được sách: ' + e.message); }
    }
    async function bkImportBackup(obj) {
      if (!obj || obj.format !== 'shadowing-book-v1' || !obj.meta || !Array.isArray(obj.chapters)) { alert('File .json này không phải bản sao lưu sách của app.'); return; }
      const exist = bkLibrary.find((b) => b.id === obj.meta.id);
      if (exist && !confirm(`Sách "${exist.title}" đã có trong thư viện. Ghi đè bằng bản sao lưu này?`)) return;
      const meta = Object.assign({}, obj.meta, { openedAt: Date.now() });
      const recs = obj.chapters.map((c) => Object.assign({}, c, { bookId: meta.id, key: `${meta.id}:${c.idx}` }));
      await bkDbSaveBook(meta, recs);
      await bkRefreshLibrary();
      bkToast(`Đã khôi phục sách “${meta.title}”`);
    }
    async function bkDeleteBook(id, e) {
      if (e) e.stopPropagation();
      const b = bkLibrary.find((x) => x.id === id);
      if (!b || !confirm(`Xóa sách "${b.title}" cùng toàn bộ bản dịch? Từ vựng đã lưu vẫn được giữ lại.`)) return;
      await bkDbDeleteBook(id);
      await bkRefreshLibrary();
    }

    // ---------- thư viện sách (trang chủ) ----------
    function bkCoverHtml(b) {
      const h = b.hue || bkHue(b.title);
      const img = b.thumb ? `<img src="${bkEsc(encodeURI(/^(https?:|data:|blob:|images\/)/.test(b.thumb) ? b.thumb : 'images/' + b.thumb))}" alt="" loading="lazy" onerror="this.remove()">` : '';
      return `<div class="bk-cover${b.thumb ? ' has-img' : ''}" style="background:linear-gradient(145deg,hsl(${h},62%,38%),hsl(${(h + 40) % 360},58%,22%))">${img}<span>${bkEsc((b.title || '').slice(0, 42))}</span></div>`;
    }
    function bkProgressOf(b) {
      const total = b.wordCount || 1, pos = b.pos || { ch: 0, i: 0 };
      let before = 0;
      if (b.chWords) { for (let i = 0; i < pos.ch; i++) before += b.chWords[i] || 0; }
      else before = total * (pos.ch / Math.max(1, b.chapterCount));
      return Math.max(0, Math.min(100, Math.round(before / total * 100)));
    }
    function bkRenderLibrary() {
      const host = document.getElementById('bk-lib');
      if (!host) return;
      const cnt = document.getElementById('bk-lib-count');
      const mine = bkLibrary.filter((b) => !b.sample);
      if (typeof bkRenderSamples === 'function') bkRenderSamples();
      if (cnt) cnt.textContent = mine.length ? `${mine.length} cuốn` : '';
      if (!mine.length) { host.innerHTML = '<div class="bk-empty" style="grid-column:1/-1">Chưa có cuốn sách nào. Hãy nạp file sách ở phía trên để bắt đầu.</div>'; return; }
      host.innerHTML = mine.map((b) => {
        const pr = bkProgressOf(b), tr = b.wordCount ? Math.min(100, Math.round((b.transWords || 0) / b.wordCount * 100)) : 0;
        return `<div class="bk-card" onclick="bkOpenBook('${b.id}')" title="Mở sách">
          <div class="bk-card-tools"><button type="button" class="bk-t-exp" title="Sao lưu (.json, kèm bản dịch)" onclick="event.stopPropagation(); bkExportBook('${b.id}')"><i data-lucide="download"></i></button><button type="button" title="Xóa sách" onclick="bkDeleteBook('${b.id}', event)"><i data-lucide="trash-2"></i></button></div>
          ${bkCoverHtml(b)}
          <div class="bk-card-body">
            <div class="bk-card-title">${bkEsc(b.title)}</div>
            <div class="bk-card-sub">${bkEsc(b.author || 'Không rõ tác giả')}</div>
            <div class="bk-card-meta"><span>${(b.chapterCount || 0)} chương</span><span>${((b.wordCount || 0) / 1000).toFixed(1)}k từ</span></div>
            <div class="bk-card-meta"><span>Đọc ${pr}%</span><span style="color:#fcd34d">Dịch ${tr}%</span></div>
            <div class="bk-bar"><i style="width:${pr}%"></i></div>
            <div class="bk-bar tr" style="margin-top:3px"><i style="width:${tr}%"></i></div>
          </div></div>`;
      }).join('');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    const bkEsc = (s) => escHtml(s);

    // =====================================================================================
    // ==================== ĐỌC SÁCH — PHẦN 2: GIAO DIỆN ĐỌC ====================
    // =====================================================================================
    const BK_PREF_KEY = 'shadowing_book_prefs_v1';
    const BK_DEF_PREFS = { theme: 'night', font: 'serif', size: 20, lh: 1.75, width: 760, align: 'left', lay: 'sent', hl: true, bi: false, ct: 3 };
    let bkPrefs = Object.assign({}, BK_DEF_PREFS, window.innerWidth < 640 ? { size: 18 } : {}, (() => { try { return JSON.parse(localStorage.getItem(BK_PREF_KEY) || '{}'); } catch (e) { return {}; } })());
    let bkBook = null;       // bản ghi sách đang mở (object meta từ IndexedDB)
    let bkChs = [];          // toàn bộ chương (dạng trong bộ nhớ)
    let bkPrefix = [];       // bkPrefix[i] = tổng số từ của các chương trước chương i
    let bkCh = 0;            // chương đang đọc
    let bkSEls = [];         // phần tử câu theo chỉ số câu của chương đang hiển thị
    let bkPEls = {};         // phần tử đoạn theo số đoạn (p)
    let bkSliding = false;

    const bkScrollEl = () => document.getElementById('bk-scroll');
    const bkContentEl = () => document.getElementById('bk-content');
    function bkActive() { const el = document.getElementById('screen-book'); return !!el && !el.classList.contains('hidden'); }
    // Vùng chứa chữ đang dùng cho tra nghĩa / lưu từ vựng (khung phụ đề của video, hoặc trang sách)
    function activeSubContainer() { return document.getElementById(bkActive() ? 'bk-content' : 'subtitles-scroll-container'); }

    function bkSavePrefs() { try { localStorage.setItem(BK_PREF_KEY, JSON.stringify(bkPrefs)); } catch (e) {} }

    // ---------- giao diện: nền, chữ, cỡ chữ... ----------
    function bkApplyPrefs() {
      const el = document.getElementById('screen-book');
      if (!el) return;
      el.dataset.theme = bkPrefs.theme; el.dataset.font = bkPrefs.font; el.dataset.align = bkPrefs.align; el.dataset.ct = String(bkPrefs.ct || 3);
      el.style.setProperty('--bk-size', bkPrefs.size + 'px');
      el.style.setProperty('--bk-lh', String(bkPrefs.lh));
      el.style.setProperty('--bk-width', bkPrefs.width + 'px');
      el.style.setProperty('--bk-align', bkPrefs.align === 'justify' ? 'justify' : 'left');
      const c = bkContentEl();
      if (c) { c.classList.toggle('bk-lay-par', bkPrefs.lay === 'par'); c.classList.toggle('bk-lay-sent', bkPrefs.lay !== 'par'); c.classList.toggle('sub-show-vi', !!bkPrefs.bi); }
      document.body.classList.toggle('bk-hl-saved', !!bkPrefs.hl);
      el.querySelectorAll('#bk-set [data-theme]').forEach((b) => b.classList.toggle('on', b.dataset.theme === bkPrefs.theme));
      el.querySelectorAll('#bk-set [data-font]').forEach((b) => b.classList.toggle('on', b.dataset.font === bkPrefs.font));
      el.querySelectorAll('#bk-set [data-width]').forEach((b) => b.classList.toggle('on', +b.dataset.width === +bkPrefs.width));
      el.querySelectorAll('#bk-set [data-align]').forEach((b) => b.classList.toggle('on', b.dataset.align === bkPrefs.align));
      el.querySelectorAll('#bk-set [data-lay]').forEach((b) => b.classList.toggle('on', b.dataset.lay === bkPrefs.lay));
      const hl = document.getElementById('bk-chk-hl'); if (hl) hl.checked = !!bkPrefs.hl;
      document.getElementById('bk-v-size').textContent = bkPrefs.size + 'px';
      document.getElementById('bk-v-lh').textContent = (+bkPrefs.lh).toFixed(2);
      document.getElementById('bk-v-ct').textContent = `${bkPrefs.ct || 3}/5 · ${['', 'Dịu', 'Thường', 'Rõ', 'Rất rõ', 'Đậm'][bkPrefs.ct || 3]}`;
      const bi = document.getElementById('bk-btn-bi'); if (bi) bi.classList.toggle('on', !!bkPrefs.bi);
    }
    function bkSetPref(k, v) {
      const a = bkAnchor();
      bkPrefs[k] = v; bkSavePrefs(); bkApplyPrefs();
      if (['size', 'lh', 'width', 'font', 'lay', 'align', 'ct'].indexOf(k) >= 0) bkRestoreAnchor(a);
      if (k === 'size' && bkDrawerOpen()) requestAnimationFrame(() => bkTocScrollToCurrent(true));   // chữ mục lục đổi theo → giữ mục đang đọc trong tầm nhìn
    }
    function bkStep(k, d) {
      if (k === 'size') bkSetPref('size', Math.max(14, Math.min(36, bkPrefs.size + d)));
      else if (k === 'ct') bkSetPref('ct', Math.max(1, Math.min(5, (bkPrefs.ct || 3) + d)));
      else bkSetPref('lh', Math.max(1.35, Math.min(2.3, Math.round((bkPrefs.lh + d * 0.05) * 100) / 100)));
    }
    function bkToggleSettings(force) {
      const el = document.getElementById('bk-set');
      const open = force === undefined ? !el.classList.contains('open') : !!force;
      el.classList.toggle('open', open);
      document.getElementById('bk-btn-set').classList.toggle('on', open);
      if (open) bkCloseDrawer();
    }
    function bkToggleFocus() {
      const s = document.getElementById('screen-book');
      s.classList.toggle('bk-focus');
      s.classList.remove('bk-peek');
    }

    // ---------- neo vị trí cuộn theo ĐOẠN (không bị nhảy khi đổi cỡ chữ / bật song ngữ / có bản dịch mới) ----------
    function bkAnchor() {
      const box = bkScrollEl(); if (!box || !bkActive()) return null;
      const bt = box.getBoundingClientRect().top;
      const ps = Object.keys(bkPEls).map(Number).sort((a, b) => a - b);
      let lo = 0, hi = ps.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (bkPEls[ps[mid]].getBoundingClientRect().bottom > bt + 1) hi = mid; else lo = mid + 1; }
      if (!ps.length) return null;
      return { p: ps[lo], off: bkPEls[ps[lo]].getBoundingClientRect().top - bt };
    }
    function bkRestoreAnchor(a) {
      if (!a) return;
      const box = bkScrollEl(); let el = bkPEls[a.p];
      if (!el) { const ks = Object.keys(bkPEls).map(Number).sort((x, y) => x - y); const k = ks.find((n) => n >= a.p) ?? ks[ks.length - 1]; el = bkPEls[k]; }
      if (!el) return;
      box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - a.off;
    }

    // ---------- mở / đóng sách ----------
    async function bkOpenBook(id, opts) {
      opts = opts || {};
      bkLoading(true, 'Đang mở sách...');
      await bkTick();
      try {
        const meta = (await bkDbListBooks()).find((b) => b.id === id);
        const recs = meta ? await bkDbGetChapters(id) : [];
        if (!meta || !recs.length) { bkLoading(false); bkToast('Sách này không còn trong thư viện'); return false; }
        bkBook = meta;
        bkChs = recs.map(bkHydrateChapter);
        if (!Array.isArray(bkBook.chWords) || bkBook.chWords.length !== bkChs.length) bkBook.chWords = bkChs.map((c) => c.words);
        if (!Array.isArray(bkBook.chTr) || bkBook.chTr.length !== bkChs.length) bkBook.chTr = bkChs.map((c) => c.s.reduce((a, x) => a + ((x.vi && String(x.vi).trim()) ? bkWc(x.text) : 0), 0));
        bkBook.transWords = bkBook.chTr.reduce((a, b) => a + b, 0);
        bkPrefix = []; let acc = 0; bkChs.forEach((c) => { bkPrefix.push(acc); acc += c.words; });
        bkBook.openedAt = Date.now();

        if (document.getElementById('screen-book').classList.contains('hidden')) captureHomeState();
        if (rafAnimId) { cancelAnimationFrame(rafAnimId); rafAnimId = null; }
        try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
        stopSubtitleLoop(); hideLookupTooltip();
        ['screen-input', 'screen-practice', 'screen-vocab'].forEach((x) => document.getElementById(x).classList.add('hidden'));
        document.getElementById('screen-book').classList.remove('hidden');
        document.body.classList.add('book-mode');
        document.getElementById('bk-title').textContent = bkBook.title;
        bkApplyPrefs(); bkCloseDrawer(); bkToggleSettings(false); bkTocCollapsed = new Set();
        const pos = bkBook.pos || { ch: 0, i: 0 };
        const ch = opts.ch !== undefined ? opts.ch : pos.ch;
        const si = opts.si !== undefined ? opts.si : pos.i;
        bkShowChapter(ch, { si, flash: !!opts.flash });
        bkDbSaveBook(bkBook).catch(() => {});
        bkLoading(false);
        const sc = bkScrollEl(); if (sc) sc.focus({ preventScroll: true });
        return true;
      } catch (e) {
        console.error(e); bkLoading(false); alert('Không mở được sách: ' + (e && e.message ? e.message : e)); return false;
      }
    }

    async function bkClose() {
      if (!bkBook) return;
      bkSavePosNow();
      hideLookupTooltip(); bkCloseDrawer(); bkToggleSettings(false);
      document.getElementById('bk-tr-modal').classList.remove('open');
      document.getElementById('screen-book').classList.add('hidden');
      document.body.classList.remove('book-mode');
      document.getElementById('screen-input').classList.remove('hidden');
      setInputMode('book');
      await bkRefreshLibrary();
      requestAnimationFrame(() => requestAnimationFrame(() => { window.scrollTo({ top: savedHomeScrollY, behavior: 'auto' }); restoreRowScrollPositions(); }));
    }

    async function bkOpenFromVocab(x) {
      const si = Math.max(0, Math.round(x.t || 0));
      if (bkBook && bkBook.id === x.bookId && bkChs.length) {
        ['screen-input', 'screen-practice', 'screen-vocab'].forEach((i) => document.getElementById(i).classList.add('hidden'));
        document.getElementById('screen-book').classList.remove('hidden');
        document.body.classList.add('book-mode');
        bkShowChapter(x.ch, { si, flash: true });
        return;
      }
      await bkOpenBook(x.bookId, { ch: x.ch, si, flash: true });
    }

    // ---------- hiển thị 1 chương ----------
    function bkShowChapter(ch, o) {
      o = o || {};
      ch = Math.max(0, Math.min(bkChs.length - 1, ch | 0));
      bkCh = ch;
      sentences = bkChs[ch].s;
      currentVideoId = `book:${bkBook.id}:${ch}`;
      currentVideoTitle = `${bkBook.title} · ${bkChs[ch].title}`;
      currentSentenceIndex = 0;
      bkRenderChapter();
      const box = bkScrollEl();
      if (o.si > 0 && bkSEls[o.si]) bkScrollToSentence(o.si, !!o.flash);
      else { box.scrollTop = 0; if (o.flash && bkSEls[0]) bkSEls[0].classList.add('bk-flash'); }
      if (o.pos === 'end') box.scrollTop = box.scrollHeight;
      bkBook.pos = { ch, i: Math.max(0, o.si | 0) };
      bkUpdateUi(); bkSavePos();
    }

    function bkRenderChapter() {
      const ch = bkChs[bkCh], c = bkContentEl();
      const frag = document.createDocumentFragment();
      const head = document.createElement('header');
      head.className = 'bk-chhead';
      head.innerHTML = `${ch.pa && ch.pa.length ? `<div class="bk-crumb">${ch.pa.map(bkEsc).join('<i>›</i>')}</div>` : ''}<div class="bk-chno">Chương ${bkCh + 1} / ${bkChs.length}</div><h1 class="bk-chtitle">${bkEsc(ch.title)}</h1><div class="bk-chrule"></div>`;
      frag.appendChild(head);
      const banner = document.createElement('div'); banner.id = 'bk-banner'; banner.className = 'bk-banner'; banner.style.display = 'none';
      frag.appendChild(banner);

      bkSEls = []; bkPEls = {};
      let curP = null, pEl = null, viBuf = [];
      const flushVi = () => {
        if (pEl && viBuf.length) { const d = document.createElement('div'); d.className = 'sub-vi-line bk-vi-par'; d.textContent = viBuf.join(' '); frag.appendChild(d); }
        viBuf = [];
      };
      ch.s.forEach((s, i) => {
        if (s.p !== curP || !pEl) {
          flushVi();
          curP = s.p;
          pEl = document.createElement('p');
          pEl.className = 'bk-p' + (s.h ? ' bk-sub' : '') + (s.e ? ' bk-epi' : '');
          pEl.dataset.p = s.p;
          frag.appendChild(pEl);
          bkPEls[s.p] = pEl;
        }
        const sp = document.createElement('span');
        sp.className = 'bk-s sentence-text-line';
        sp.setAttribute('data-id', s.id);
        const words = s.text.split(' ').filter(Boolean);
        words.forEach((w, k) => {
          const ws = document.createElement('span');
          ws.className = 'bk-w sub-word-unit';
          ws.textContent = w;
          ws.setAttribute('data-start', i); ws.setAttribute('data-end', i + 1);
          sp.appendChild(ws);
          if (k < words.length - 1) sp.appendChild(document.createTextNode(' '));
        });
        const vi = s.vi && String(s.vi).trim();
        if (vi) {
          const vd = document.createElement('span'); vd.className = 'sub-vi-line bk-vi-inline'; vd.textContent = vi; sp.appendChild(vd);
          viBuf.push(vi);
        }
        pEl.appendChild(sp);
        pEl.appendChild(document.createTextNode(' '));
        bkSEls[i] = sp;
      });
      flushVi();

      const nav = document.createElement('div'); nav.className = 'bk-chnav';
      const prev = bkChs[bkCh - 1], next = bkChs[bkCh + 1];
      nav.innerHTML = `<button type="button" ${prev ? '' : 'disabled'} onclick="bkPrevChapter()"><small>← Chương trước</small><b>${prev ? bkEsc(prev.title) : '—'}</b></button><button type="button" class="next" ${next ? '' : 'disabled'} onclick="bkNextChapter()"><small>Chương sau →</small><b>${next ? bkEsc(next.title) : (bkCh === bkChs.length - 1 ? 'Hết sách 🎉' : '—')}</b></button>`;
      frag.appendChild(nav);
      c.innerHTML = '';
      c.appendChild(frag);
      c.classList.toggle('sub-show-vi', !!bkPrefs.bi);
      bkMarkSaved();
      bkUpdateBanner();
    }

    // Từ/cụm từ đã lưu của chương này → gạch chân chấm chấm
    function bkMarkSaved() {
      const c = bkContentEl(); if (!c || !bkBook) return;
      c.querySelectorAll('.bk-saved').forEach((e) => e.classList.remove('bk-saved'));
      const items = getVocab().filter((x) => x.videoId === currentVideoId && x.bookId === bkBook.id);
      if (!items.length) return;
      const S = bkChs[bkCh].s;
      const joinFrom = (si, n) => { let en = ''; for (let k = si; k < S.length && en.length < n; k++) { const t = S[k].text.split(' ').filter(Boolean).join(' '); en += (en ? ' ' : '') + t; } return en; };
      items.forEach((x) => {
        let si = Math.max(0, Math.round(x.t || 0));
        if (joinFrom(si, x.en.length).slice(0, x.en.length) !== x.en) {   // câu đã bị chia lại (vd. sau khi ghép bản dịch) → dò lại
          const first = x.en.slice(0, 40); si = -1;
          for (let k = 0; k < S.length; k++) { if (S[k].text.indexOf(first) === 0 || S[k].text.split(' ').filter(Boolean).join(' ').indexOf(first) === 0) { if (joinFrom(k, x.en.length).slice(0, x.en.length) === x.en) { si = k; break; } } }
          if (si < 0) return;
        }
        let pos = 0;
        outer: for (let s = si; s < S.length; s++) {
          const el = bkSEls[s]; if (!el) break;
          const ws = el.querySelectorAll('.bk-w');
          for (let w = 0; w < ws.length; w++) {
            const len = ws[w].textContent.length, st = pos, en = pos + len;
            if (en > x.hs && st < x.he) ws[w].classList.add('bk-saved');
            pos = en + 1;
            if (pos > x.he) break outer;
          }
        }
      });
    }

    function bkUpdateBanner() {
      const b = document.getElementById('bk-banner'); if (!b) return;
      if (!bkPrefs.bi) { b.style.display = 'none'; return; }
      const w = bkBook.chWords[bkCh] || 1, pct = Math.round((bkBook.chTr[bkCh] || 0) / w * 100);
      if (pct >= 98) { b.style.display = 'none'; return; }
      b.style.display = 'flex';
      b.innerHTML = `<span>${pct === 0 ? 'Chương này chưa có bản dịch.' : `Bản dịch mới phủ <b>${pct}%</b> chương này.`}</span><button type="button" onclick="bkOpenTranslate('read')">${pct === 0 ? 'Dịch chương này' : 'Dịch tiếp'}</button>`;
    }

    // ---------- cuộn / vị trí / tiến độ ----------
    function bkTopSentence() {
      if (!bkSEls.length) return 0;
      const bt = bkScrollEl().getBoundingClientRect().top + 4;
      let lo = 0, hi = bkSEls.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (bkSEls[mid].getBoundingClientRect().bottom > bt) hi = mid; else lo = mid + 1; }
      return lo;
    }
    function bkScrollToSentence(i, flash) {
      const el = bkSEls[i], box = bkScrollEl(); if (!el) return;
      const r = (el.getClientRects()[0] || el.getBoundingClientRect());
      box.scrollTop += r.top - box.getBoundingClientRect().top - Math.min(110, box.clientHeight * 0.18);
      if (flash) { el.classList.remove('bk-flash'); void el.offsetWidth; el.classList.add('bk-flash'); setTimeout(() => el.classList.remove('bk-flash'), 2600); }
    }
    let bkRaf = 0, bkSaveT = null;
    function bkOnScroll() {
      if (bkRaf) return;
      bkRaf = requestAnimationFrame(() => { bkRaf = 0; bkUpdateProgress(); });
      clearTimeout(bkSaveT); bkSaveT = setTimeout(bkSavePosNow, 900);
    }
    function bkChapterFrac() {
      const box = bkScrollEl(), max = box.scrollHeight - box.clientHeight;
      return max > 4 ? Math.max(0, Math.min(1, box.scrollTop / max)) : 1;
    }
    function bkOverallFrac() {
      const total = bkPrefix.length ? bkPrefix[bkPrefix.length - 1] + bkChs[bkChs.length - 1].words : 1;
      return Math.max(0, Math.min(1, (bkPrefix[bkCh] + bkChapterFrac() * bkChs[bkCh].words) / total));
    }
    function bkUpdateProgress() {
      if (!bkBook || !bkActive()) return;
      const f = bkOverallFrac(), total = bkPrefix[bkPrefix.length - 1] + bkChs[bkChs.length - 1].words;
      if (!bkSliding) document.getElementById('bk-slider').value = Math.round(f * 1000);
      document.getElementById('bk-st-pct').innerHTML = `<b>${Math.round(f * 100)}%</b>`;
      const left = Math.max(0, total * (1 - f)), mins = left / 180;
      document.getElementById('bk-st-left').textContent = mins < 1 ? 'sắp xong' : mins < 60 ? `còn ~${Math.round(mins)} phút` : `còn ~${Math.floor(mins / 60)}g ${Math.round(mins % 60)}p`;
    }
    function bkUpdateUi() {
      document.getElementById('bk-subtitle').textContent = `${bkCh + 1}/${bkChs.length} · ${bkChs[bkCh].title}`;
      document.getElementById('bk-st-ch').innerHTML = `Ch <b>${bkCh + 1}</b>/${bkChs.length}`;
      const tr = bkBook.transWords || 0;
      document.getElementById('bk-btn-bi').classList.toggle('hint', !(bkBook.chTr[bkCh] > 0));
      bkUpdateProgress(); bkUpdateTocHighlight(); bkUpdateTrPill();
    }
    function bkSavePosNow() {
      clearTimeout(bkSaveT);
      if (!bkBook || !bkActive()) return;
      bkBook.pos = { ch: bkCh, i: bkTopSentence() };
      bkBook.openedAt = Date.now();
      bkDbSaveBook(bkBook).catch(() => {});
      bkUpdateTrPill();
    }
    function bkSavePos() { clearTimeout(bkSaveT); bkSaveT = setTimeout(bkSavePosNow, 600); }

    function bkPrevChapter() { if (bkCh > 0) bkShowChapter(bkCh - 1, { pos: 'start' }); }
    function bkNextChapter() { if (bkCh < bkChs.length - 1) bkShowChapter(bkCh + 1); }
    function bkGoto(ch, si, flash) {
      if (ch !== bkCh) bkShowChapter(ch, { si, flash }); else { bkScrollToSentence(si, flash); bkSavePos(); bkUpdateProgress(); }
    }
    function bkSliderInput(v) { bkSliding = true; document.getElementById('bk-st-pct').innerHTML = `<b>${Math.round(v / 10)}%</b>`; }
    function bkSliderCommit(v) {
      bkSliding = false;
      const total = bkPrefix[bkPrefix.length - 1] + bkChs[bkChs.length - 1].words, target = (v / 1000) * total;
      let ch = 0; while (ch < bkChs.length - 1 && bkPrefix[ch + 1] <= target) ch++;
      let within = target - bkPrefix[ch], si = 0, acc = 0;
      const S = bkChs[ch].s;
      for (let i = 0; i < S.length; i++) { acc += bkWc(S[i].text); if (acc >= within) { si = i; break; } si = i; }
      if (+v >= 998) { bkShowChapter(bkChs.length - 1, { pos: 'end' }); return; }
      bkShowChapter(ch, { si });
    }

    // ---------- mục lục + tìm kiếm (ngăn bên trái, KHÔNG che/làm tối nội dung) ----------
    // Màn hình rộng: ngăn nằm cạnh trang sách, vừa xem mục lục vừa đọc. Màn hình hẹp: ngăn nổi lên trên, chạm ra ngoài để đóng.
    let bkTocCollapsed = new Set();
    const bkNarrow = () => window.innerWidth <= 820;
    function bkDrawerOpen() { return document.getElementById('bk-drawer').classList.contains('open'); }
    function bkToggleDrawer(tab, forceOpen) {
      const d = document.getElementById('bk-drawer'), open = bkDrawerOpen();
      const cur = document.getElementById('bk-tab-toc').classList.contains('on') ? 'toc' : 'search';
      if (open && !forceOpen && cur === tab) { bkCloseDrawer(); return; }
      const a = open ? null : bkAnchor();
      bkToggleSettings(false);
      d.classList.add('open'); document.getElementById('bk-drawer-back').classList.toggle('open', bkNarrow());
      document.getElementById('bk-btn-toc').classList.toggle('on', tab === 'toc');
      document.getElementById('bk-tab-toc').classList.toggle('on', tab === 'toc');
      document.getElementById('bk-tab-search').classList.toggle('on', tab === 'search');
      document.getElementById('bk-pane-toc').classList.toggle('on', tab === 'toc');
      document.getElementById('bk-pane-search').classList.toggle('on', tab === 'search');
      if (a) bkRestoreAnchor(a);
      if (tab === 'toc') { bkRenderToc(); bkTocScrollToCurrent(true); }
      else setTimeout(() => { const i = document.getElementById('bk-search-input'); i.focus(); i.select(); }, 60);
    }
    function bkCloseDrawer() {
      const d = document.getElementById('bk-drawer');
      if (!d.classList.contains('open')) return;
      const a = bkActive() ? bkAnchor() : null;
      d.classList.remove('open');
      document.getElementById('bk-drawer-back').classList.remove('open');
      document.getElementById('bk-btn-toc').classList.remove('on');
      if (a) bkRestoreAnchor(a);
      const sc = bkScrollEl(); if (sc && bkActive()) sc.focus({ preventScroll: true });
    }
    // Dàn ý: sách có mục lục cấp bậc dùng outline đã lưu; sách thường → danh sách phẳng
    function bkOutline() {
      if (bkBook && Array.isArray(bkBook.outline) && bkBook.outline.length) return bkBook.outline;
      return bkChs.map((c, i) => ({ t: c.title, lv: 0, ch: i, own: true }));
    }
    function bkRenderToc() {
      const host = document.getElementById('bk-pane-toc'); if (!host || !bkBook) return;
      const ol = bkOutline();
      const hier = ol.some((n) => n.lv > 0 || !n.own);
      let curIdx = -1;
      ol.forEach((n, i) => { if (n.own && n.ch === bkCh) curIdx = i; });
      const anc = new Set();
      if (curIdx >= 0) { let need = ol[curIdx].lv; for (let j = curIdx - 1; j >= 0 && need > 0; j--) if (ol[j].lv < need) { anc.add(j); need = ol[j].lv; } }
      const st = host.scrollTop;
      let hideBelow = -1, html = '';
      ol.forEach((n, i) => {
        if (hideBelow >= 0 && n.lv > hideBelow) return;
        hideBelow = -1;
        const kids = i + 1 < ol.length && ol[i + 1].lv > n.lv;
        const collapsed = kids && bkTocCollapsed.has(i);
        if (collapsed) hideBelow = n.lv;
        let flag = '', meta = '';
        if (n.own) {
          const w = bkBook.chWords[n.ch] || 1, pct = Math.round((bkBook.chTr[n.ch] || 0) / w * 100);
          flag = pct >= 98 ? '<span class="f full">VI</span>' : pct > 0 ? `<span class="f part">${pct}%</span>` : '';
          meta = `<span class="m">${(bkChs[n.ch].words).toLocaleString('en-US')} từ</span>`;
        }
        const lv = hier ? Math.min(n.lv, 3) : 2;
        const cls = ['bk-toc-item', 'lv' + lv, i === curIdx ? 'cur' : '', anc.has(i) ? 'anc' : '', n.own && n.ch < bkCh ? 'read' : '', hier ? '' : 'flat'].filter(Boolean).join(' ');
        const chev = kids ? `<span class="chev" title="${collapsed ? 'Mở rộng' : 'Thu gọn'}" onclick="event.stopPropagation(); bkTocToggle(${i})">${collapsed ? '▸' : '▾'}</span>` : (hier ? '<span class="chev sp"></span>' : '');
        const num = hier ? '' : `<span class="n">${n.ch + 1}</span>`;
        html += `<div class="${cls}" role="button" tabindex="0" data-n="${i}" onclick="bkTocGo(${n.ch})" onkeydown="if(event.key==='Enter'){bkTocGo(${n.ch})}">${chev}${num}<span class="t">${bkEsc(n.t)}${meta}</span>${flag}</div>`;
      });
      host.innerHTML = html;
      host.scrollTop = st;
    }
    function bkTocScrollToCurrent(center) {
      const cur = document.querySelector('#bk-pane-toc .bk-toc-item.cur'); if (!cur) return;
      cur.scrollIntoView({ block: center ? 'center' : 'nearest' });
    }
    function bkUpdateTocHighlight() { if (bkDrawerOpen() && document.getElementById('bk-pane-toc').classList.contains('on')) { bkRenderToc(); bkTocScrollToCurrent(false); } }
    function bkTocToggle(i) { if (bkTocCollapsed.has(i)) bkTocCollapsed.delete(i); else bkTocCollapsed.add(i); bkRenderToc(); }
    function bkTocGo(i) {
      // đảm bảo nhóm chứa chương này không bị thu gọn
      const ol = bkOutline(); ol.forEach((n, k) => { if (n.own && n.ch === i) { let need = n.lv; for (let j = k - 1; j >= 0 && need > 0; j--) if (ol[j].lv < need) { bkTocCollapsed.delete(j); need = ol[j].lv; } } });
      if (bkNarrow()) bkCloseDrawer();
      bkShowChapter(i);
    }

    let bkSearchT = null;
    function bkSearchInput(v) { clearTimeout(bkSearchT); bkSearchT = setTimeout(() => bkRunSearch(v), 180); }
    function bkRunSearch(raw) {
      const host = document.getElementById('bk-search-res'), q = String(raw || '').trim().toLowerCase();
      if (q.length < 2) { host.innerHTML = '<div class="bk-dnote">Gõ ít nhất 2 ký tự để tìm trong toàn bộ cuốn sách.</div>'; return; }
      const hits = []; let more = false;
      outer: for (let c = 0; c < bkChs.length; c++) {
        const S = bkChs[c].s;
        for (let i = 0; i < S.length; i++) {
          const en = S[i].text, vi = S[i].vi || '';
          const a = en.toLowerCase().indexOf(q), b = vi ? vi.toLowerCase().indexOf(q) : -1;
          if (a >= 0 || b >= 0) { hits.push({ c, i, a, b, en, vi }); if (hits.length >= 150) { more = true; break outer; } }
        }
      }
      if (!hits.length) { host.innerHTML = '<div class="bk-dnote">Không tìm thấy kết quả nào.</div>'; return; }
      const mark = (t, k) => k < 0 ? bkEsc(t) : bkEsc(t.slice(0, k)) + '<mark>' + bkEsc(t.slice(k, k + q.length)) + '</mark>' + bkEsc(t.slice(k + q.length));
      const snip = (t, k) => { if (k < 0 || t.length <= 190) return mark(t, k); const s = Math.max(0, k - 70); return (s ? '…' : '') + mark(t.slice(s, s + 190), k - s) + '…'; };
      host.innerHTML = `<div class="bk-dnote" style="padding:10px 14px;text-align:left">${hits.length}${more ? '+' : ''} kết quả</div>` + hits.map((h) =>
        `<button type="button" class="bk-hit" onclick="bkHitGo(${h.c},${h.i})"><small>Ch ${h.c + 1} · ${bkEsc(bkChs[h.c].title)}</small>${h.a >= 0 ? snip(h.en, h.a) : bkEsc(h.en.slice(0, 160))}${h.b >= 0 ? `<div style="color:var(--bk-vi);margin-top:2px">${snip(h.vi, h.b)}</div>` : ''}</button>`).join('');
    }
    function bkHitGo(c, i) { if (bkNarrow()) bkCloseDrawer(); bkGoto(c, i, true); }

    // ---------- bật / tắt song ngữ ----------
    function bkToggleBilingual() {
      if (!bkBook) return;
      if (!bkPrefs.bi && !(bkBook.transWords > 0)) { bkOpenTranslate('read'); return; }
      const a = bkAnchor();
      bkPrefs.bi = !bkPrefs.bi; bkSavePrefs(); bkApplyPrefs(); bkUpdateBanner();
      bkRestoreAnchor(a);
      bkUpdateTrPill();
    }

    // ---------- phím tắt khi đang đọc sách ----------
    document.addEventListener('keydown', (e) => {
      if (!bkActive()) return;
      const k = e.key;
      if (k === 'Escape') {
        const trm = document.getElementById('bk-tr-modal'), imp = document.getElementById('bk-import-modal');
        if (trm.classList.contains('open')) { bkCloseTranslate(); e.stopImmediatePropagation(); return; }
        if (imp.classList.contains('open')) { bkImportCancel(); e.stopImmediatePropagation(); return; }
        if (document.getElementById('bk-drawer').classList.contains('open')) { bkCloseDrawer(); e.stopImmediatePropagation(); return; }
        if (document.getElementById('bk-set').classList.contains('open')) { bkToggleSettings(false); e.stopImmediatePropagation(); return; }
        const s = document.getElementById('screen-book'); if (s.classList.contains('bk-focus')) { s.classList.remove('bk-focus'); e.stopImmediatePropagation(); }
        return;
      }
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.querySelector('.ai-modal-backdrop.open')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const box = bkScrollEl(), h = box.clientHeight;
      let handled = true;
      switch (k) {
        case ' ': box.scrollBy({ top: (e.shiftKey ? -1 : 1) * h * 0.88, behavior: 'smooth' }); break;
        case 'PageDown': box.scrollBy({ top: h * 0.88, behavior: 'smooth' }); break;
        case 'PageUp': box.scrollBy({ top: -h * 0.88, behavior: 'smooth' }); break;
        case 'ArrowDown': box.scrollBy({ top: 70 }); break;
        case 'ArrowUp': box.scrollBy({ top: -70 }); break;
        case 'Home': box.scrollTo({ top: 0 }); break;
        case 'End': box.scrollTo({ top: box.scrollHeight }); break;
        case 'ArrowRight': bkNextChapter(); break;
        case 'ArrowLeft': bkPrevChapter(); break;
        case 't': case 'T': bkToggleDrawer('toc'); break;
        case '/': bkToggleDrawer('search', true); break;
        case 'b': case 'B': bkToggleBilingual(); break;
        case 'f': case 'F': bkToggleFocus(); break;
        case 'd': case 'D': bkOpenTranslate('read'); break;
        case 's': case 'S': saveSelectionToVocabByKey(); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
      e.stopImmediatePropagation();   // chặn phím tắt của phần video (số = tốc độ, Space = phát...)
    }, true);

    document.addEventListener('mousemove', (e) => {
      const s = document.getElementById('screen-book');
      if (!s || s.classList.contains('hidden') || !s.classList.contains('bk-focus')) return;
      s.classList.toggle('bk-peek', e.clientY < 64 || e.clientY > window.innerHeight - 60);
    });
    document.addEventListener('mousedown', (e) => {
      if (!bkActive()) return;
      const st = document.getElementById('bk-set');
      if (st.classList.contains('open') && !st.contains(e.target) && !document.getElementById('bk-btn-set').contains(e.target)) bkToggleSettings(false);
    });
    document.addEventListener('touchend', () => { if (bkActive()) setTimeout(checkTextSelection, 350); });

    // =====================================================================================
    // ==================== ĐỌC SÁCH — PHẦN 3: DỊCH SONG NGỮ THEO TỪNG ĐỢT ====================
    // Một đợt = khoảng 600 / 1.100 / 1.800 từ, cắt ở ranh giới ĐOẠN VĂN (không cắt giữa đoạn),
    // chương ngắn thì gom nhiều chương vào 1 đợt, chương dài thì chia nhiều đợt. Kết quả AI trả về
    // được căn lại với đúng đoạn sách đó bằng thuật toán ghép sẵn có của app (aicRun).
    // =====================================================================================
    const BK_BATCH = { S: 600, M: 1100, L: 1800 };
    let bkTr = { batch: null, copied: null };
    const bkHasVi = (s) => !!(s && s.vi && String(s.vi).trim());

    // Câu đầu tiên chưa dịch tính từ một vị trí (bỏ qua phần đã dịch). null = đã dịch hết.
    function bkFirstUntranslated(ch, i) {
      for (; ch < bkChs.length; ch++, i = 0) {
        const S = bkChs[ch].s;
        while (i < S.length && bkHasVi(S[i])) i++;
        if (i < S.length) return { ch, i };
      }
      return null;
    }
    function bkTrStart(mode) {
      if (mode === 'start') return { ch: 0, i: 0 };
      if (mode === 'chapter') return { ch: bkCh, i: 0 };
      let ch, i;
      if (mode === 'cursor' && bkBook.cur && bkChs[bkBook.cur.ch]) { ch = bkBook.cur.ch; i = bkBook.cur.i; }
      else {
        ch = bkCh; i = bkTopSentence();
        const S = bkChs[ch].s, p = S[i] ? S[i].p : 0;
        while (i > 0 && S[i - 1].p === p) i--;   // lùi về đầu đoạn đang đọc
      }
      return bkFirstUntranslated(ch, i);
    }

    // Dựng 1 đợt dịch bắt đầu từ (ch0, i0)
    function bkMakeBatch(ch0, i0, target, stopAtTranslated) {
      const segs = []; let acc = 0, ch = ch0, i = i0;
      while (ch < bkChs.length) {
        const S = bkChs[ch].s;
        let lim = S.length;
        if (stopAtTranslated) for (let j = i; j < S.length; j++) if (bkHasVi(S[j])) { lim = j; break; }
        let rem = 0; for (let j = i; j < lim; j++) rem += bkWc(S[j].text);
        if (lim <= i) break;
        const need = target - acc;
        if (rem <= need * 1.3) {                                    // lấy hết phần còn lại của chương
          segs.push({ ch, from: i, to: lim }); acc += rem;
          if (lim < S.length) break;                                // gặp phần đã dịch → dừng
          ch++; i = 0;
          if (acc >= target * 0.85) break;
          continue;
        }
        // cắt giữa chương: chọn ranh giới đoạn gần mức mục tiêu nhất
        let w = 0, best = -1, bestD = Infinity, firstOver = -1;
        for (let j = i; j < lim; j++) {
          if (j > i && S[j].p !== S[j - 1].p) { const tot = acc + w; if (w > 0 && tot >= target * 0.6) { const d = Math.abs(tot - target); if (d < bestD) { bestD = d; best = j; } } }
          w += bkWc(S[j].text);
          if (firstOver < 0 && acc + w >= target) firstOver = j + 1;
        }
        let cut = best;
        if (cut >= 0) { let wb = 0; for (let j = i; j < cut; j++) wb += bkWc(S[j].text); if (acc + wb > target * 1.45) cut = -1; }
        if (cut < 0) {
          if (acc >= target * 0.6) break;                           // đã đủ lớn, đừng kéo thêm đoạn quá dài của chương này
          cut = firstOver > 0 ? firstOver : lim;
        }
        let wc = 0; for (let j = i; j < cut; j++) wc += bkWc(S[j].text);
        segs.push({ ch, from: i, to: cut }); acc += wc;
        break;
      }
      if (!segs.length) return null;
      let words = 0, sents = 0, paras = [];
      segs.forEach((sg, si) => {
        const S = bkChs[sg.ch].s; let curP = null, buf = [];
        const flush = () => { if (buf.length) paras.push(buf.join(' ')); buf = []; };
        for (let j = sg.from; j < sg.to; j++) { if (S[j].p !== curP) { flush(); curP = S[j].p; } buf.push(S[j].text); words += bkWc(S[j].text); sents++; }
        flush();
      });
      const first = bkChs[segs[0].ch].s[segs[0].from], lastSg = segs[segs.length - 1], last = bkChs[lastSg.ch].s[lastSg.to - 1];
      return { segs, words, sents, body: paras.join('\n\n'), startText: first.text, endText: last.text, startCh: segs[0].ch, endCh: lastSg.ch, endIdx: lastSg.to, stop: !!stopAtTranslated };
    }

    function bkTrPrompt(b) {
      const gl = (bkBook.glossary || '').trim();
      const chTitle = bkChs[b.startCh].title + (b.endCh !== b.startCh ? ` … ${bkChs[b.endCh].title}` : '');
      return `Dịch đoạn trích sau từ cuốn sách "${bkBook.title}"${bkBook.author ? ` của ${bkBook.author}` : ''} (phần: "${chTitle}") sang tiếng Việt, theo kiểu xen kẽ: 1 câu gốc tiếng Pháp, ngay dưới là 1 câu dịch tiếng Việt, rồi tới câu tiếng Pháp kế tiếp.\n` +
        `Yêu cầu: giữ nguyên từng câu tiếng Pháp gốc (không bỏ sót, không gộp, không viết lại); đặt toàn bộ kết quả trong MỘT khối code (codebox \`\`\`) để người dùng mobile dễ bấm nút copy; chỉ trả về các cặp câu, không thêm lời dẫn, tiêu đề, đánh số hay ghi chú ngoài khối code; dịch tự nhiên, chính xác, đúng văn phong của sách.` +
        (gl ? `\nGhi chú khi dịch (hãy tuân theo): ${gl}` : '') + `\n\nVăn bản:\n\n${b.body}`;
    }

    // ---------- cửa sổ dịch ----------
    function bkOpenTranslate(mode) {
      if (!bkBook) return;
      document.getElementById('bk-tr-from').value = mode || 'read';
      document.getElementById('bk-tr-size').value = bkBook.batch || 'M';
      document.getElementById('bk-tr-gloss').value = bkBook.glossary || '';
      document.getElementById('bk-tr-title').textContent = `Dịch song ngữ · ${bkBook.title}`;
      document.getElementById('bk-tr-text').value = '';
      aiSetStatus(document.getElementById('bk-tr-status'), '', '');
      document.getElementById('bk-tr-prev').classList.remove('open');
      bkTr.copied = null;
      resetCopyButtons();
      bkTrRefresh();
      document.getElementById('bk-tr-modal').classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function bkCloseTranslate() { document.getElementById('bk-tr-modal').classList.remove('open'); const sc = bkScrollEl(); if (sc && bkActive()) sc.focus({ preventScroll: true }); }
    function bkTrSizeChange() { bkBook.batch = document.getElementById('bk-tr-size').value; bkDbSaveBook(bkBook).catch(() => {}); bkTrRefresh(); }
    function bkTrSaveGloss() { bkBook.glossary = document.getElementById('bk-tr-gloss').value.trim(); bkDbSaveBook(bkBook).catch(() => {}); bkTrRefresh(); }

    function bkTrRefresh() {
      const mode = document.getElementById('bk-tr-from').value;
      const target = BK_BATCH[document.getElementById('bk-tr-size').value] || 1100;
      const total = bkBook.wordCount || 1, done = bkBook.transWords || 0;
      document.getElementById('bk-tr-meter').style.width = Math.min(100, done / total * 100) + '%';
      document.getElementById('bk-tr-prog-text').innerHTML = `Đã dịch <b>${Math.round(done / total * 100)}%</b> cuốn sách (${done.toLocaleString('en-US')}/${total.toLocaleString('en-US')} từ)`;
      const st = bkTrStart(mode), info = document.getElementById('bk-tr-info'), copyBtn = document.getElementById('bk-tr-copy');
      bkTr.batch = st ? bkMakeBatch(st.ch, st.i, target, mode === 'cursor' || mode === 'read') : null;
      copyBtn.disabled = !bkTr.batch; copyBtn.style.opacity = bkTr.batch ? '' : '.5';
      document.getElementById('bk-tr-prev').textContent = bkTr.batch ? bkTrPrompt(bkTr.batch) : '';
      if (!bkTr.batch) { info.innerHTML = 'Không còn phần nào chưa dịch từ vị trí này. Chọn “Đầu chương đang đọc” hoặc “Đầu sách” nếu muốn dịch lại.'; return; }
      const b = bkTr.batch, cut = (s) => bkEsc(s.length > 70 ? s.slice(0, 70) + '…' : s);
      let remain = 0;
      for (let c = b.endCh; c < bkChs.length; c++) { const S = bkChs[c].s; for (let j = (c === b.endCh ? b.endIdx : 0); j < S.length; j++) if (!bkHasVi(S[j])) remain += bkWc(S[j].text); }
      const chTxt = b.startCh === b.endCh ? `chương ${b.startCh + 1}` : `chương ${b.startCh + 1}–${b.endCh + 1}`;
      info.innerHTML = `Đợt này: <b>~${b.words.toLocaleString('en-US')} từ</b> · ${b.sents} câu · ${chTxt}.<br>Bắt đầu từ: “${cut(b.startText)}”<br>Sau đợt này còn khoảng <b>${Math.max(1, Math.round(remain / target))}</b> đợt nữa cho tới hết sách.`;
    }
    function bkTrTogglePrev() { document.getElementById('bk-tr-prev').classList.toggle('open'); }
    function bkTrCopy(btn) {
      if (!bkTr.batch) return;
      bkTr.copied = bkTr.batch;
      copyTextToClipboard(bkTrPrompt(bkTr.batch)).then(() => flashCopied(btn, 1800)).catch((err) => { alert('Không thể sao chép: ' + err); });
    }

    // Chạy thuật toán ghép trên 1 đợt (có thể trải nhiều chương); chưa ghi gì vào sách.
    function bkRunBatch(b, text) {
      const comb = [], map = [];
      b.segs.forEach((sg) => {
        const S = bkChs[sg.ch].s;
        for (let j = sg.from; j < sg.to; j++) {
          const k = comb.length;
          comb.push({ id: k + 1, text: S[j].text, startTime: k, endTime: k + 1, p: S[j].p, h: S[j].h, e: S[j].e });
          map.push({ ch: sg.ch, j });
        }
      });
      let r;
      try { r = applyBilingualFromAi(comb, text); } catch (e) { console.error(e); return { ok: false, error: 'Có lỗi khi xử lý câu trả lời: ' + e.message }; }
      if (!r.ok) return r;
      return { ok: true, res: r, comb, map };
    }

    async function bkTrApply() {
      const st = document.getElementById('bk-tr-status');
      const text = (document.getElementById('bk-tr-text').value || '').trim();
      if (!text) { aiSetStatus(st, 'err', 'Bạn chưa dán câu trả lời của AI vào ô bên trên.'); return; }
      const cands = [];
      if (bkTr.copied) cands.push(bkTr.copied);
      if (bkTr.batch && bkTr.batch !== bkTr.copied) cands.push(bkTr.batch);
      if (!cands.length) { aiSetStatus(st, 'err', 'Chưa có đợt dịch nào. Hãy bấm “Copy prompt” trước.'); return; }
      let out = null, used = null, err = '';
      for (const b of cands) { const r = bkRunBatch(b, text); if (r.ok) { out = r; used = b; break; } err = r.error; }
      if (!out) { aiSetStatus(st, 'err', err + '<br>Hãy chắc rằng bạn dán đúng câu trả lời cho prompt vừa copy (đừng đổi “Cỡ mỗi đợt” hay “Bắt đầu dịch từ” sau khi đã copy).'); return; }

      // Ghi kết quả về từng chương (ghi lại đoạn p cũ cho mỗi câu mới)
      const a = bkAnchor();
      const byCh = new Map();
      used.segs.forEach((sg) => byCh.set(sg.ch, { sg, items: [] }));
      out.res.sentences.forEach((r) => {
        let k = Math.floor(r.words[0].startTime + 1e-6); k = Math.max(0, Math.min(out.comb.length - 1, k));
        const m = out.map[k], c0 = out.comb[k];
        const o = { text: r.text, p: c0.p, startTime: 0, endTime: 1 };
        if (bkHasVi(r)) o.vi = String(r.vi).trim();
        if (c0.h) o.h = 1;
        if (c0.e) o.e = 1;
        byCh.get(m.ch).items.push(o);
      });
      const recs = []; let lastTr = null, trSents = 0;
      byCh.forEach((v, ch) => {
        const S = bkChs[ch].s;
        const ns = S.slice(0, v.sg.from).concat(v.items, S.slice(v.sg.to));
        ns.forEach((x, i) => { x.id = i + 1; x.startTime = i; x.endTime = i + 1; });
        bkChs[ch].s = ns;
        bkBook.chTr[ch] = ns.reduce((acc, x) => acc + (bkHasVi(x) ? bkWc(x.text) : 0), 0);
        v.items.forEach((x, idx) => { if (x.vi) trSents++; });
        for (let q = v.sg.from + v.items.length - 1; q >= v.sg.from; q--) { if (bkHasVi(ns[q])) { if (!lastTr || ch > lastTr.ch || (ch === lastTr.ch && q > lastTr.i)) lastTr = { ch, i: q }; break; } }
        recs.push(bkDehydrateChapter(bkBook.id, bkChs[ch]));
      });
      if (!lastTr) { aiSetStatus(st, 'err', 'Không ghép được câu dịch nào. Hãy kiểm tra lại câu trả lời của AI.'); return; }
      let nxt = { ch: lastTr.ch, i: lastTr.i + 1 };
      if (nxt.i >= bkChs[nxt.ch].s.length) nxt = nxt.ch + 1 < bkChs.length ? { ch: nxt.ch + 1, i: 0 } : null;
      bkBook.cur = nxt;
      bkBook.transWords = bkBook.chTr.reduce((x, y) => x + y, 0);
      bkBook.updatedAt = Date.now();
      try { await bkDbSaveBook(bkBook, recs); }
      catch (e) { aiSetStatus(st, 'err', 'Không lưu được bản dịch (bộ nhớ trình duyệt đầy?): ' + e.message); return; }

      bkPrefs.bi = true; bkSavePrefs();
      sentences = bkChs[bkCh].s;
      bkRenderChapter(); bkApplyPrefs(); bkRestoreAnchor(a); bkUpdateUi();
      if (document.getElementById('bk-drawer').classList.contains('open')) bkRenderToc();

      const total = used.sents, pct = Math.min(100, Math.round(trSents / Math.max(1, out.comb.length) * 100));
      let html = `✓ Đã ghép bản dịch cho <b>${trSents}</b> câu của đợt này.`, cls = 'ok';
      if (out.res.stats.tailPct < 96) { cls = 'warn'; html += `<br>AI mới trả lời tới khoảng ${out.res.stats.tailPct}% đợt này. Bấm “Copy prompt” lần nữa: đợt kế tiếp sẽ tự bắt đầu đúng chỗ AI dừng.`; }
      else html += '<br>Đợt kế tiếp đã sẵn sàng bên dưới.';
      document.getElementById('bk-tr-text').value = '';
      bkTr.copied = null;
      resetCopyButtons();
      bkTrRefresh();
      aiSetStatus(st, cls, html);
    }

    async function bkTrClear(scope) {
      const msg = scope === 'book' ? 'Xóa bản dịch của CẢ cuốn sách này?' : 'Xóa bản dịch của chương đang đọc?';
      if (!confirm(msg)) return;
      const recs = [], chs = scope === 'book' ? bkChs.map((c, i) => i) : [bkCh];
      chs.forEach((ch) => { bkChs[ch].s.forEach((x) => { delete x.vi; }); bkBook.chTr[ch] = 0; recs.push(bkDehydrateChapter(bkBook.id, bkChs[ch])); });
      if (scope === 'book') bkBook.cur = null;
      else if (!bkBook.cur || bkBook.cur.ch > bkCh) bkBook.cur = { ch: bkCh, i: 0 };
      bkBook.transWords = bkBook.chTr.reduce((x, y) => x + y, 0);
      await bkDbSaveBook(bkBook, recs);
      const a = bkAnchor();
      bkRenderChapter(); bkApplyPrefs(); bkRestoreAnchor(a); bkUpdateUi();
      bkTr.copied = null; bkTrRefresh();
      bkToast('Đã xóa bản dịch');
    }

    // Nút nhắc "Dịch tiếp" khi đọc gần tới chỗ hết bản dịch
    function bkUpdateTrPill() {
      const pill = document.getElementById('bk-trpill'); if (!pill) return;
      pill.classList.remove('show');
      if (!bkBook || !bkActive() || !(bkBook.transWords > 0) || !bkPrefs.bi) return;
      const readI = bkTopSentence(), fr = bkFirstUntranslated(bkCh, readI);
      if (!fr) return;
      let words = 0, ch = bkCh, i = readI;
      while (words <= 350 && (ch < fr.ch || (ch === fr.ch && i < fr.i))) {
        const S = bkChs[ch].s, end = ch === fr.ch ? fr.i : S.length;
        for (; i < end && words <= 350; i++) words += bkWc(S[i].text);
        if (ch === fr.ch) break; ch++; i = 0;
      }
      if (words <= 350 && bkChs[fr.ch]) pill.classList.add('show');
    }

    // ---------- khởi tạo ----------
    document.addEventListener('DOMContentLoaded', () => {
      bkInitImport();
      bkApplyPrefs();
      bkRefreshLibrary();
    });

    // =====================================================================================
    // ==================== SÁCH MẪU (để người xem web dùng thử chế độ đọc sách) ====================
    // File sách + ảnh bìa nằm CÙNG THƯ MỤC với index.html. Bấm thẻ → app tự tải, nhập vào trình duyệt
    // người xem (lần đầu), những lần sau mở thẳng từ bộ nhớ trình duyệt. Thêm sách mẫu khác = thêm 1 mục vào mảng này.
    // `bundle` (tùy chọn): tên file .shadowbook.json (sao lưu từ nút tải xuống trên thẻ sách) để người xem có
    // sẵn bản dịch song ngữ; nếu để trống hoặc file không có thì dùng file EPUB (chưa có bản dịch).
    // =====================================================================================
    const BK_SAMPLES = [
      {
        id: 'sample-le-petit-prince',
        file: '',
        thumb: '',
        title: 'Le Petit Prince',
        author: 'Antoine de Saint-Exupéry',
        note: 'Kiệt tác văn học Pháp (Song ngữ Pháp - Việt đầy đủ)',
        skip: null,
        bundle: '',
        sampleData: {
          format: 'shadowing-book-v1',
          meta: {
            id: 'sample-le-petit-prince',
            title: 'Le Petit Prince',
            author: 'Antoine de Saint-Exupéry',
            chapterCount: 2,
            wordCount: 385,
            sentCount: 16,
            transWords: 385,
            pos: { ch: 0, i: 0 },
            chTitles: ['Chapitre I — Le serpent boa', 'Chapitre II — S\'il vous plaît... dessine-moi un mouton !'],
            chWords: [195, 190],
            chTr: [195, 190],
            outline: [
              { idx: 0, title: 'Chapitre I — Le serpent boa', lv: 1, words: 195, trWords: 195 },
              { idx: 1, title: 'Chapitre II — S\'il vous plaît... dessine-moi un mouton !', lv: 1, words: 190, trWords: 190 }
            ]
          },
          chapters: [
            {
              idx: 0,
              title: 'Chapitre I — Le serpent boa',
              lv: 1,
              words: 195,
              s: [
                { p: 0, t: "Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait « Histoires Vécues ».", v: "Khi tôi lên sáu tuổi, một lần nọ tôi nhìn thấy một bức tranh tuyệt đẹp trong một cuốn sách về Rừng Nguyên Sinh có tựa đề là « Những câu chuyện có thật »." },
                { p: 0, t: "Ça représentait un serpent boa qui avalait un fauve.", v: "Bức tranh vẽ một con trăn boa đang nuốt chửng một con thú hoang." },
                { p: 1, t: "On disait dans le livre : « Les serpents boas avalent leur proie tout entière, sans la mâcher. Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion. »", v: "Trong cuốn sách người ta viết rằng: « Những con trăn boa nuốt chửng toàn bộ con mồi mà không cần nhai. Sau đó chúng không thể cử động được nữa và ngủ suốt sáu tháng trong quá trình tiêu hóa. »" },
                { p: 2, t: "J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, với un crayon de couleur, à tracer mon premier dessin.", v: "Khi đó tôi đã suy nghĩ rất nhiều về những cuộc phiêu lưu nơi rừng rậm, và đến lượt mình, tôi đã dùng bút chì màu vẽ thành công bức tranh đầu tiên của tôi." },
                { p: 2, t: "Mon dessin numéro 1. Il était comme ça.", v: "Bức tranh số 1 của tôi. Nó trông như thế này đây." },
                { p: 3, t: "J'ai montré mon chef-d'œuvre aux grandes personnes et je leur ai demandé si mon dessin leur faisait peur.", v: "Tôi khoe kiệt tác của mình với những người lớn và hỏi xem bức tranh của tôi có làm họ sợ không." },
                { p: 4, t: "Elles m'ont répondu : « Pourquoi un chapeau ferait-il peur ? »", v: "Họ trả lời tôi rằng: « Tại sao một chiếc mũ lại làm người ta sợ chứ? »" },
                { p: 4, t: "Mon dessin ne représentait pas un chapeau. Il représentait un serpent boa qui digérait un éléphant.", v: "Bức vẽ của tôi không phải là một chiếc mũ. Nó vẽ một con trăn boa đang tiêu hóa một con voi." }
              ]
            },
            {
              idx: 1,
              title: "Chapitre II — S'il vous plaît... dessine-moi un mouton !",
              lv: 1,
              words: 190,
              s: [
                { p: 0, t: "J'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert de Sahara, il y a six ans.", v: "Tôi đã sống cô độc như thế, không có ai để thực sự trò chuyện, cho đến khi máy bay của tôi gặp sự cố rơi xuống sa mạc Sahara cách đây sáu năm." },
                { p: 0, t: "Quelque chose s'était cassé dans mon moteur.", v: "Một bộ phận nào đó trong động cơ của tôi đã bị hỏng." },
                { p: 1, t: "Le premier soir je me suis donc endormi sur le sable à mille milles de toute terre habitée.", v: "Đêm đầu tiên tôi đã ngủ thiếp đi trên cát, cách xa cả ngàn dặm mọi vùng đất có người sinh sống." },
                { p: 2, t: "Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé.", v: "Bạn hãy tưởng tượng sự ngạc nhiên tột cùng của tôi, khi bình minh ló rạng, một giọng nói nhỏ bé kỳ lạ đã đánh thức tôi dậy." },
                { p: 2, t: "Elle disait : « S'il vous plaît... dessine-moi un mouton ! »", v: "Giọng nói ấy cất lên: « Làm ơn... hãy vẽ cho cháu một con cừu! »" },
                { p: 3, t: "— Hein !", v: "— Hả !" },
                { p: 3, t: "— Dessine-moi un mouton...", v: "— Vẽ cho cháu một con cừu..." },
                { p: 4, t: "Je me suis frotté bien les yeux. J'ai bien regardé. Et j'ai vu un petit bonhomme tout à fait extraordinaire qui me considérait gravement.", v: "Tôi dụi kỹ mắt mình. Tôi nhìn thật chăm chú. Và tôi thấy một cậu bé vô cùng phi thường đang nhìn tôi với vẻ nghiêm trang." }
              ]
            }
          ]
        }
      }
    ];

    function bkRenderSamples() {
      const host = document.getElementById('bk-samples'), wrap = document.getElementById('bk-samples-wrap');
      if (!host) return;
      if (!BK_SAMPLES.length) { if (wrap) wrap.style.display = 'none'; return; }
      host.innerHTML = BK_SAMPLES.map((sm) => {
        const have = bkLibrary.find((b) => b.id === sm.id);
        const pr = have ? bkProgressOf(have) : 0, tr = have && have.wordCount ? Math.min(100, Math.round((have.transWords || 0) / have.wordCount * 100)) : 0;
        const cover = bkCoverHtml({ title: sm.title, thumb: sm.thumb, hue: bkHue(sm.title) });
        return `<div class="bk-sample" role="button" tabindex="0" onclick="bkOpenSample('${sm.id}')" onkeydown="if(event.key==='Enter'){bkOpenSample('${sm.id}')}">
          ${cover.replace('class="bk-cover', 'class="bk-cover bk-cover-lg')}
          <div class="bk-sample-body">
            <span class="bk-sample-tag">Sách mẫu · dùng thử</span>
            <div class="bk-sample-title">${bkEsc(sm.title)}</div>
            <div class="bk-sample-author">${bkEsc(sm.author)}</div>
            <div class="bk-sample-note">${bkEsc(sm.note || '')}</div>
            ${have ? `<div class="bk-card-meta"><span>${have.chapterCount} chương</span><span>${((have.wordCount || 0) / 1000).toFixed(1)}k từ</span><span>Đọc ${pr}%</span>${tr ? `<span style="color:#fcd34d">Dịch ${tr}%</span>` : ''}</div><div class="bk-bar"><i style="width:${pr}%"></i></div>` : '<div class="bk-sample-note">Bấm để mở ngay: tra nghĩa, lưu từ vựng, song ngữ…</div>'}
            <span class="bk-sample-btn">${have ? (pr > 0 ? 'Tiếp tục đọc →' : 'Mở sách →') : 'Đọc thử →'}</span>
          </div>
          ${have ? `<div class="bk-card-tools"><button type="button" title="Xóa bản đã tải về máy này (tải lại bất cứ lúc nào)" onclick="event.stopPropagation(); bkRemoveSample('${sm.id}')"><i data-lucide="trash-2"></i></button></div>` : ''}
        </div>`;
      }).join('');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    async function bkRemoveSample(id) {
      if (!confirm('Xóa bản sách mẫu đã tải trên trình duyệt này (kèm vị trí đọc và bản dịch)? Bạn có thể mở lại để tải lại bất cứ lúc nào.')) return;
      await bkDbDeleteBook(id);
      await bkRefreshLibrary();
    }

    async function bkOpenSample(id) {
      const sm = BK_SAMPLES.find((x) => x.id === id);
      if (!sm) return;
      const have = bkLibrary.find((b) => b.id === id);
      if (have && Array.isArray(have.outline)) { bkOpenBook(id); return; }
      if (have) await bkDbDeleteBook(id);   // bản đã lưu từ phiên bản cũ (chưa có mục lục cấp bậc) → tải lại bản mới
      bkLoading(true, 'Đang tải sách mẫu...');
      await bkTick();
      try {
        const url = sm.file ? new URL(encodeURI(sm.file), location.href).href : '';
        const extra = { sample: true, thumb: sm.thumb };
        let built = null;
        if (sm.sampleData) {
          const obj = sm.sampleData;
          if (obj && obj.format === 'shadowing-book-v1' && obj.meta && Array.isArray(obj.chapters)) {
            const now = Date.now();
            const meta = Object.assign({}, obj.meta, { id: sm.id, title: sm.title, author: sm.author, sample: true, thumb: sm.thumb, createdAt: now, openedAt: now, pos: { ch: 0, i: 0 } });
            built = { meta, recs: obj.chapters.map((c) => Object.assign({}, c, { bookId: sm.id, key: `${sm.id}:${c.idx}` })) };
          }
        }
        if (!built && sm.bundle) {   // bản dựng sẵn có song ngữ
          try {
            const r = await fetch(new URL(encodeURI(sm.bundle), location.href).href);
            if (r.ok) {
              const obj = await r.json();
              if (obj && obj.format === 'shadowing-book-v1' && obj.meta && Array.isArray(obj.chapters)) {
                const now = Date.now();
                const meta = Object.assign({}, obj.meta, { id: sm.id, title: sm.title, author: sm.author, sample: true, thumb: sm.thumb, createdAt: now, openedAt: now, pos: { ch: 0, i: 0 } });
                built = { meta, recs: obj.chapters.map((c) => Object.assign({}, c, { bookId: sm.id, key: `${sm.id}:${c.idx}` })) };
              }
            }
          } catch (e) { /* không có bản dựng sẵn → dùng EPUB */ }
        }
        if (!built) {
          const r = await fetch(url);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const buf = await r.arrayBuffer();
          bkLoading(true, 'Đang đọc sách...');
          await bkTick();
          const parsed = await bkParseEpub(buf);
          const res = bkChapterize(parsed.blocks, { mode: 'auto' });
          const chosen = res.chapters.filter((c) => !c.skipDefault && !BK_SKIP_TITLE.test((c.title || '').trim()) && !(sm.skip && sm.skip.test((c.title || '').trim())));
          if (!chosen.length) throw new Error('Không tìm thấy nội dung trong file sách');
          bkLoading(true, 'Đang tách câu và lưu sách...');
          await bkTick();
          built = await bkBuildBook(chosen, { id: sm.id, title: sm.title, author: sm.author, fmt: 'epub', extra });
        }
        await bkDbSaveBook(built.meta, built.recs);
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
        if (built.meta.transWords > 0) { bkPrefs.bi = true; bkSavePrefs(); }   // có sẵn bản dịch → hiện song ngữ cho người xem lần đầu
        await bkRefreshLibrary();
        bkLoading(false);
        bkOpenBook(sm.id);
      } catch (e) {
        console.error(e);
        bkLoading(false);
        const local = location.protocol === 'file:';
        alert('Không tải được sách mẫu.\n' + (local
          ? 'Bạn đang mở index.html trực tiếp từ máy (file://) nên trình duyệt chặn việc đọc file đi kèm. Khi đã đưa lên web (hoặc chạy bằng một máy chủ cục bộ) thì sẽ mở được.'
          : `Hãy kiểm tra file “${sm.file}” có nằm cùng thư mục với index.html trên host hay không.`) + '\n(' + (e && e.message ? e.message : e) + ')');
      }
    }

    // ==================== ĐỊNH TUYẾN BẰNG HASH (#) ====================
    // Mỗi màn hình có địa chỉ riêng:  #/  trang chủ · #/vocab  từ vựng đã lưu · #/watch/<videoId>  luyện video
    //                                 #/read/<id>  luyện bài viết/văn bản · #/book/<bookId>  đọc sách · #/guide · #/donate
    // Mỗi giao diện luyện tập cũng có link riêng (để F5 không bị quay về Mặc định):
    //   #/watch/<id>  hoặc  #/read/<id>  = Mặc định ·  .../shadowing  = Shadowing ·  .../dictation  = Chép chính tả
    // - Đổi màn hình (bằng bất kỳ nút nào trong app) -> tự cập nhật hash (thêm 1 mục lịch sử, nên Back/Forward chạy tự nhiên).
    // - Tải trang / bấm Back, Forward / sửa hash tay -> đọc hash rồi mở đúng màn hình.
    // - Link cũ dạng #share=... và ?v=... vẫn do code chia sẻ cũ xử lý, router không đụng tới.
    (function setupHashRouter() {
      const $ = (id) => document.getElementById(id);
      const vis = (id) => { const e = $(id); return !!e && !e.classList.contains('hidden'); };
      const SCREENS = ['screen-input', 'screen-practice', 'screen-vocab', 'screen-book', 'screen-guide', 'screen-vt'];
      let ready = false;      // chỉ ghi hash sau khi app khởi động xong
      let routing = 0;        // > 0: router đang tự chuyển màn hình, không ghi ngược lại hash
      let syncTimer = null;

      const norm = (h) => { h = String(h || '').replace(/^#/, ''); return (!h || h === '/') ? '/' : h; };
      const dec = (x) => { try { return decodeURIComponent(x); } catch (e) { return x; } };
      const same = (a, b) => a === b || dec(a) === dec(b);   // trình duyệt có thể mã hoá lại hash, nên so sánh cả dạng đã giải mã
      const isShare = () => /^#share=/.test(location.hash || '');
      const setHash = (r, replace) => {
        const url = location.pathname + location.search + '#' + r;
        try { if (replace) history.replaceState(null, '', url); else location.hash = '#' + r; } catch (e) {}
      };

      // Mỗi mục ở trang chủ có link riêng:  #/ (Luyện với Video) · #/articles (Đọc báo/IELTS) · #/books (Đọc sách) · #/translate (Luyện dịch Việt → Pháp)
      // Bài trong mục Luyện dịch Việt → Pháp:  #/translate/<mã bài>.   (Còn #/watch, #/read, #/book như cũ.)
      const MODE_ROUTE = { video: '/', text: '/articles', book: '/books', vt: '/translate', 'custom-yt': '/custom-video' };

      // ----- trạng thái màn hình -> route -----
      function stateRoute() {
        if (vis('screen-vocab')) return '/vocab';
        if (vis('screen-book')) return bkBook ? '/book/' + encodeURIComponent(bkBook.id) : null;
        if (vis('screen-practice')) {
          if (!currentVideoId) return null;
          const pv = window.pvGetView ? window.pvGetView() : 'default';
          return (isTextMode ? '/read/' : '/watch/') + encodeURIComponent(currentVideoId) + (pv && pv !== 'default' ? '/' + pv : '');
        }
        if (vis('screen-guide')) return '/guide';
        if (vis('screen-vt')) { const k = window.vtCurrentKey ? window.vtCurrentKey() : ''; return k ? '/translate/' + encodeURIComponent(k) : null; }
        if (vis('screen-input')) {
          const lr = (currentInputMode === 'video' && window.libCatRoute) ? window.libCatRoute() : '';   // trang riêng của thể loại: #/library/<thể loại>[/<playlist>]
          return lr || MODE_ROUTE[currentInputMode] || '/';
        }
        return null;
      }

      // Người dùng đổi màn hình trong app -> cập nhật hash (thêm mục lịch sử)
      function syncHash() {
        if (!ready || routing || isShare()) return;
        const r = stateRoute();
        if (r == null || same(norm(location.hash), r)) return;
        setHash(r, false);
      }
      function scheduleSync() { clearTimeout(syncTimer); syncTimer = setTimeout(syncHash, 30); }
      const mo = new MutationObserver(scheduleSync);
      SCREENS.forEach((id) => { const e = $(id); if (e) mo.observe(e, { attributes: true, attributeFilter: ['class'] }); });

      // ----- route -> mở màn hình -----
      // Về trang chủ từ bất kỳ màn hình nào, dùng đúng các hàm thoát có sẵn (dọn loop, lưu vị trí đọc, khôi phục cuộn...)
      function leaveToHome() {
        if (vis('screen-vocab')) {
          const back = vocabReturnTo;
          closeVocabScreen();                                  // trở lại nơi đã mở Từ vựng
          if (back === 'practice' && vis('screen-practice')) backToInputScreen();
          else if (back === 'book' && vis('screen-book')) bkClose();
        } else if (vis('screen-practice')) backToInputScreen();
        else if (vis('screen-vt')) { if (window.vtClose) window.vtClose(); }
        else if (vis('screen-book')) bkClose();
        else if (vis('screen-guide')) closeGuideScreen();
      }

      function toast(msg) { try { showVocabToast(msg, false); } catch (e) {} }

      async function openVideo(id) {
        const h = getLocalHistory().find((x) => x.videoId === id && !x.isText && x.sentences && x.sentences.length);
        if (h) { loadFromHistory(id); return vis('screen-practice'); }
        // Không có trong lịch sử trên máy này -> thử thư viện video có sẵn của trang
        let title = '';
        if (typeof categoryStructure !== 'undefined' && categoryStructure) {
          Object.keys(categoryStructure).forEach((k) => { if (categoryStructure[k] && categoryStructure[k][id]) title = categoryStructure[k][id]; });
        }
        const meta = typeof videoMetadataMap !== 'undefined' ? videoMetadataMap[id] : null;
        if (meta && meta.title) title = meta.title;
        if (/^[\w-]{6,20}$/.test(id)) { try { await selectCategoryVideo(id, title); } catch (e) {} }
        if (vis('screen-practice')) return true;
        toast('Không tìm thấy video này trên thiết bị. Hãy import lại bằng extension hoặc chọn từ thư viện.');
        return false;
      }

      async function openText(id) {
        const h = getLocalHistory().find((x) => x.videoId === id && x.isText && x.sentences && x.sentences.length);
        if (h) { loadFromHistory(id); return vis('screen-practice'); }
        if (/^art_lib_/.test(id)) { try { await openLibraryArticle(id.slice(8)); } catch (e) {} }   // bài trong thư mục articles/
        else if (/^art_/.test(id)) { try { await selectCategoryArticle(id.slice(4), ''); } catch (e) {} }
        if (vis('screen-practice')) return true;
        toast('Không tìm thấy bài viết này trên thiết bị.');
        return false;
      }

      async function navigate(target) {
        const parts = target.split('/');                 // '/watch/abc' -> ['', 'watch', 'abc']
        const kind = parts[1] || '';
        let id = parts.slice(2).join('/');
        try { id = decodeURIComponent(id); } catch (e) {}

        switch (kind) {
          case '':
          case 'video':
            leaveToHome();
            setInputMode('video');
            if (window.closeLibraryCategory) window.closeLibraryCategory();
            return;
          case 'library': {
            if (!vis('screen-input')) leaveToHome();
            setInputMode('video');
            const dc = (x) => { try { return decodeURIComponent(x || ''); } catch (e) { return x || ''; } };
            if (window.libOpenFromRoute) window.libOpenFromRoute(dc(parts[2]), dc(parts[3]));
            return;
          }
          case 'articles':
          case 'books':
          case 'translate':
          case 'custom-video': {
            const mode = kind === 'articles' ? 'text' : (kind === 'books' ? 'book' : (kind === 'custom-video' ? 'custom-yt' : 'vt'));
            if (!vis('screen-input')) leaveToHome();
            setInputMode(mode);
            if (kind === 'translate' && id && window.vtOpenKey) await window.vtOpenKey(id);
            return;
          }
          case 'vocab':
            if (vis('screen-guide')) leaveToHome();
            openVocabScreen();
            return;
          case 'guide':
            if (!vis('screen-input')) leaveToHome();
            openGuideScreen();
            return;
          case 'donate':
            leaveToHome();
            return;
          case 'watch':
          case 'read': {
            const text = kind === 'read';
            // Đuôi /shadowing hoặc /dictation (hoặc /default) = giao diện luyện tập cần mở
            let wantView = 'default';
            const rest = parts.slice(2);
            if (rest.length > 1 && /^(default|shadowing|dictation)$/.test(rest[rest.length - 1])) {
              wantView = rest.pop();
              try { id = decodeURIComponent(rest.join('/')); } catch (e) { id = rest.join('/'); }
            }
            const applyView = () => { if (vis('screen-practice') && window.pvSetView) { try { window.pvSetView(wantView); } catch (e) {} } };
            // Đang ở Từ vựng mà video/bài này vẫn đang mở phía sau -> chỉ cần quay lại, không nạp lại
            if (vis('screen-vocab') && vocabReturnTo === 'practice' && currentVideoId === id && isTextMode === text && sentences.length) { closeVocabScreen(); applyView(); return; }
            // Đang mở đúng video/bài này rồi (ví dụ bấm Back/Forward giữa các giao diện) -> chỉ đổi giao diện, không nạp lại
            if (vis('screen-practice') && currentVideoId === id && isTextMode === text && sentences.length) { applyView(); return; }
            if (!vis('screen-input')) leaveToHome();
            await (text ? openText(id) : openVideo(id));
            applyView();
            return;
          }
          case 'book': {
            if (vis('screen-vocab') && vocabReturnTo === 'book' && bkBook && bkBook.id === id && bkChs.length) { closeVocabScreen(); return; }
            if (!vis('screen-input')) leaveToHome();
            await bkOpenBook(id, {});
            return;
          }
          default:
            leaveToHome();
        }
      }

      async function applyRoute() {
        if (isShare()) return;                              // link chia sẻ cũ: do openSharedFromHash xử lý
        const target = norm(location.hash);
        const cur0 = stateRoute();
        if (cur0 != null && same(target, cur0)) return;    // đã đúng màn hình rồi
        routing++;
        try { await navigate(target); }
        catch (e) { console.warn('[router]', e); }
        finally {
          routing--;
          setTimeout(() => {
            // Không mở được (video/sách không còn trên máy...) -> sửa hash cho khớp màn hình thực tế (thay, không thêm mục lịch sử)
            const r = stateRoute();
            if (r != null && !same(norm(location.hash), r)) setHash(r, true);
          }, 0);
        }
      }

      window.addEventListener('hashchange', () => { if (ready) applyRoute(); });
      window.__routerSync = scheduleSync;   // giao diện luyện tập đổi (Mặc định / Shadowing / Chép chính tả) -> cập nhật hash

      // Gọi từ DOMContentLoaded: đọc hash khi tải trang (F5 / mở link) rồi mới bật chế độ tự ghi hash
      window.__routerBoot = async function (catPromise, skip) {
        const unhide = () => { try { document.documentElement.classList.remove('rt-boot'); if (window.homeNavRefresh) window.homeNavRefresh(); } catch (e) {} };
        if (skip) { ready = true; unhide(); return; }      // đang mở link chia sẻ (#share / ?v=): code chia sẻ tự mở màn hình
        if (norm(location.hash) !== '/') {
          // Màn hình nào KHÔNG cần thư viện video thì mở ngay, không chờ category.json / catalog.json:
          // từ vựng, hướng dẫn, ủng hộ, sách, bài viết đã lưu, và video do chính người dùng nhập (đã có đủ phụ đề trên máy).
          // Video thư viện (hoặc link mở từ máy khác) vẫn phải chờ thư viện nạp xong để lấy đúng dữ liệu từ server.
          const t = norm(location.hash), parts = t.split('/');
          let needLib = true;
          if (/^\/(vocab|guide|donate|book|read)(\/|$)/.test(t)) needLib = false;
          else if (parts[1] === 'watch') {
            let id = parts[2] || ''; try { id = decodeURIComponent(id); } catch (e) {}
            try { const it = getLocalHistory().find((x) => x.videoId === id && !x.isText); needLib = !(it && it.sentences && it.sentences.length && it.userTrans === true); } catch (e) {}
          }
          if (needLib) { try { await catPromise; } catch (e) {} }
          if (!/^#\//.test(location.hash)) { ready = true; unhide(); return; }
          try { await applyRoute(); } catch (e) {}
        }
        ready = true;
        unhide();
        scheduleSync();
      };
    })();


  