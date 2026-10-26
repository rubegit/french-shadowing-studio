    // ==================== TRA CỨU TỪ VỰNG ====================
    const lookupTooltip = document.getElementById('lookup-tooltip');
    const btnLookupAction = document.getElementById('btn-lookup-action');

    let selectedRangeForLoop = null;
    let vocabAreaCtx = null;   // != null khi đang bôi đen trong "Từ vựng đã lưu" / "Từ khó" (hiện Tra nghĩa + Lưu + Phát âm, không có Loop)

    // Bôi đen chữ tiếng Pháp trong thẻ từ vựng (câu chứa từ, ví dụ, tên từ) ở màn "Từ vựng đã lưu" hoặc cửa sổ "Từ khó".
    // Trả về null nếu vùng chọn không nằm trong 2 nơi này; {ok:false} nếu nằm trong nhưng không hợp lệ (phần tiếng Việt, nhiều thẻ...).
    function vocabAreaInfo(selection, text) {
      const nodeEl = (n) => (!n ? null : (n.nodeType === 1 ? n : n.parentElement));
      const a = nodeEl(selection.anchorNode), f = nodeEl(selection.focusNode);
      if (!a || !f) return null;
      const vs = document.getElementById('screen-vocab');
      const km = document.getElementById('keyvocab-modal');
      let area = '';
      if (vs && !vs.classList.contains('hidden') && vs.contains(a)) area = 'vocab';
      else if (km && km.classList.contains('open') && km.contains(a)) area = 'kv';
      if (!area) return null;
      const bad = { ok: false };
      if (!(area === 'vocab' ? vs : km).contains(f)) return bad;
      const card = a.closest('.vocab-card');
      if (!card || card !== f.closest('.vocab-card')) return bad;
      const BLOCK = '.vocab-ctx, .vocab-ex-en, .vocab-word';   // chỉ phần tiếng Pháp
      const block = a.closest(BLOCK);
      if (!block || block !== f.closest(BLOCK)) return bad;
      if (!/\p{L}/u.test(text)) return bad;

      const isCtx = block.classList.contains('vocab-ctx');
      let src = {}, prev = '', vi = '';
      if (area === 'vocab') {
        const item = getVocab().find((v) => v.id === card.getAttribute('data-vid'));
        if (!item) return bad;
        src = { videoId: item.videoId, videoTitle: item.videoTitle || '', t: item.t || 0, bookId: item.bookId, ch: item.ch, srcUrl: item.srcUrl };
        if (isCtx) { prev = item.prev || ''; vi = item.vi || ''; }
      } else {
        const it = kvGet()[parseInt(card.getAttribute('data-kv-i'), 10)];
        if (!it) return bad;
        const c = kvFindContext(it);
        const inBook = bkActive() && bkBook;
        src = { videoId: currentVideoId, videoTitle: currentVideoTitle || '', t: c ? (c.s.startTime || 0) : 0, bookId: inBook ? bkBook.id : undefined, ch: inBook ? bkCh : undefined };
        if (isCtx && c) {
          const idx = sentences.indexOf(c.s);
          prev = idx > 0 ? String(sentences[idx - 1].text || '').trim() : '';
          vi = String(c.s.vi || '').trim();
        }
      }

      // Vị trí chữ bôi đen trong khối văn bản (để tô sáng khi lưu)
      const range = selection.getRangeAt(0);
      let en = block.textContent, hs = -1, he = -1;
      try {
        const r = document.createRange();
        r.setStart(block, 0);
        r.setEnd(range.startContainer, range.startOffset);
        hs = r.toString().length;
        he = hs + range.toString().length;
      } catch (e) { hs = -1; }
      if (hs < 0 || en.slice(hs, he) !== range.toString()) { hs = en.indexOf(text); he = hs + text.length; }
      if (hs < 0) { en = text; hs = 0; he = text.length; prev = ''; vi = ''; }
      if (en.length > 2500) { en = text; hs = 0; he = text.length; prev = ''; vi = ''; }
      const seg = en.slice(hs, he);
      hs += seg.match(/^[^\p{L}\p{N}]*/u)[0].length;
      he -= seg.match(/[^\p{L}\p{N}]*$/u)[0].length;
      if (he <= hs) return bad;
      const picked = en.slice(hs, he).trim();
      if (!picked || picked.length > 600) return bad;

      // Ngữ cảnh cho "Tra nghĩa": với tên từ thì lấy câu chứa từ trong thẻ
      let ctxText = en;
      if (block.classList.contains('vocab-word')) { const cp = card.querySelector('.vocab-ctx'); if (cp) ctxText = cp.textContent; }
      const contextStr = ((isCtx && prev) ? prev + ' ' : '') + ctxText;
      return { ok: true, text: picked, en, hs, he, prev, vi, src, contextStr };
    }

    function buildVocabItemFromArea(va) {
      const n = va.text.split(/\s+/).length;
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: va.text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'),
        en: va.en, hs: va.hs, he: va.he, vi: va.vi || '', prev: va.prev || '',
        videoId: va.src.videoId, videoTitle: va.src.videoTitle || '', t: va.src.t || 0, createdAt: Date.now(),
        bookId: va.src.bookId, ch: va.src.ch
      };
      if (va.src.srcUrl) item.srcUrl = va.src.srcUrl;
      return item;
    }

    function hideLookupTooltip() {
      if (lookupTooltip) lookupTooltip.style.display = 'none';
      selectedTextForLookup = '';
      selectedRangeForLoop = null;
      vocabAreaCtx = null;
      isHoveringLookupTooltip = false;
    }

    // Điện thoại / máy tính bảng: sau khi bôi đen (pop-up Tra nghĩa / Lưu / Loop đang hiện), nếu người dùng vuốt cuộn phụ đề
    // lên hoặc xuống thì ẩn pop-up + bỏ vùng bôi đen. Chỉ tính cử chỉ vuốt thật của ngón tay (touchmove làm vùng cuộn đổi vị trí),
    // nên karaoke tự cuộn phụ đề hay kéo tay cầm bôi đen không bị ảnh hưởng.
    (function dismissLookupTooltipOnSwipe() {
      const isTouchDevice = () => !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
      const tipVisible = () => !!lookupTooltip && lookupTooltip.style.display === 'block';
      const scrollParentOf = (n) => {
        let el = n && n.nodeType === 1 ? n : (n && n.parentElement);
        while (el && el !== document.body && el !== document.documentElement) {
          const oy = getComputedStyle(el).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return el;
          el = el.parentElement;
        }
        return null;
      };
      let sw = null;
      document.addEventListener('touchstart', (e) => {
        sw = null;
        if (!tipVisible() || !isTouchDevice() || e.touches.length !== 1) return;
        if (lookupTooltip.contains(e.target)) return;
        const el = scrollParentOf(e.target);
        sw = { y: e.touches[0].clientY, el: el, top: el ? el.scrollTop : 0, win: window.scrollY };
      }, { capture: true, passive: true });
      document.addEventListener('touchmove', (e) => {
        if (!sw || !tipVisible()) return;
        const t = e.touches[0];
        if (!t || Math.abs(t.clientY - sw.y) < 8) return;
        const scrolled = sw.el ? sw.el.scrollTop !== sw.top : window.scrollY !== sw.win;
        if (!scrolled) return;
        sw = null;
        hideLookupTooltip();
        try { window.getSelection().removeAllRanges(); } catch (err) {}
      }, { capture: true, passive: true });
      document.addEventListener('touchend', () => { sw = null; }, { capture: true, passive: true });
      document.addEventListener('touchcancel', () => { sw = null; }, { capture: true, passive: true });
    })();

    function checkTextSelection() {
      if (window.vtSelectionHook && window.vtSelectionHook()) return;   // đang ở màn Luyện dịch Việt → Pháp: bôi đen bản dịch AI
      if (window.pvSelectionHook && window.pvSelectionHook()) return;   // đang ở giao diện Shadowing: giao diện đó tự xử lý popup Loop
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';

      if (!text) {
        hideLookupTooltip();
        return;
      }

      // Bôi đen trong "Từ vựng đã lưu" / "Từ khó": hiện Tra nghĩa + Lưu từ vựng (+ Phát âm nếu đúng 1 từ), không có Loop
      const va = vocabAreaInfo(selection, text);
      if (va && !va.ok) {
        hideLookupTooltip();
        return;
      }

      if (!va) {
        const container = activeSubContainer();
        if (!container) return;

        const vidEnEl = document.getElementById('vid-en');   // phụ đề tiếng Pháp đè lên video: bôi đen cũng hiện popup như phụ đề bên phải
        const csTextEl = document.getElementById('cs-text');   // thẻ phụ đề câu hiện tại (dưới nút điều hướng): bôi đen cũng hiện popup
        const inVidEn = !!(selection.anchorNode && ((vidEnEl && vidEnEl.contains(selection.anchorNode)) || (csTextEl && csTextEl.contains(selection.anchorNode))));
        if (!inVidEn && (!selection.anchorNode || !container.contains(selection.anchorNode))) {
          hideLookupTooltip();
          return;
        }

        // Bôi đen phụ đề tiếng Việt: vẫn cho copy chữ bình thường, nhưng không hiện popup Tra nghĩa/Loop.
        const anchorEl = selection.anchorNode.nodeType === 1 ? selection.anchorNode : selection.anchorNode.parentElement;
        if (anchorEl && anchorEl.closest('.sub-vi-line')) {
          hideLookupTooltip();
          return;
        }
      }

      if (!va && subtitleLoopActive) stopLoopAndPause();   // bôi đen phụ đề khi đang loop -> tắt loop + dừng video

      selectedTextForLookup = text;

      const range = selection.getRangeAt(0);
      selectedRangeForLoop = range.cloneRange();
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        hideLookupTooltip();
        return;
      }

      // Đang bật "Ẩn chữ" (luyện chép chính tả) -> chỉ cho Loop nghe lại, ẩn nút
      // "Tra nghĩa" vì bôi đen được tức là đã biết đoạn đó viết gì, tra nghĩa lúc
      // này không còn ý nghĩa và còn vô tình "gợi ý" đáp án khi đang luyện nghe.
      // "Ẩn chữ" chỉ có ở video: đọc bài / đọc sách thì luôn cho tra nghĩa.
      vocabAreaCtx = va || null;
      const loopBtnEl = document.getElementById('btn-loop-action');
      if (loopBtnEl) loopBtnEl.style.display = va ? 'none' : '';
      const blurActive = !va && !!settings.blurMode && !isTextMode && !bkActive();
      if (btnLookupAction) {
        btnLookupAction.style.display = blurActive ? 'none' : '';
      }
      // "Phát âm" hiển thị khi bôi đen từ hoặc cụm ngắn
      const btnPron = document.getElementById('btn-pronounce-action');
      if (btnPron) {
        const pw = getSingleWordForLookup(text) || (text && text.trim().length <= 150 ? text.trim() : '');
        btnPron.style.display = (!blurActive && pw) ? '' : 'none';   // trong "Từ vựng đã lưu" / "Từ khó" cũng hiện khi bôi đen
        if (pw) {
          btnPron.title = 'Phát âm "' + pw + '" · Shift + click: Mở Từ điển Larousse';
        }
      }

      lookupTooltip.style.left = `${rect.left + rect.width / 2}px`;
      lookupTooltip.style.top = `${rect.top}px`;
      lookupTooltip.style.display = 'block';
      {
        const half = lookupTooltip.offsetWidth / 2;
        const cx = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
        lookupTooltip.style.left = `${cx}px`;
      }
    }

    // Lấy khoảng thời gian [start, end] của đoạn văn bản đang bôi đen, dựa trên
    // các span.sub-word-unit (mỗi từ đã có data-start / data-end) giao với Range đó.
    function getTimeRangeFromSelection(range) {
      if (!range) return null;
      const container = document.getElementById('subtitles-scroll-container');
      if (!container) return null;

      const wordEls = document.querySelectorAll('#subtitles-scroll-container .sub-word-unit, #vid-en .sub-word-unit, #cs-text .sub-word-unit');
      let minStart = null;
      let maxEnd = null;

      wordEls.forEach((el) => {
        if (range.intersectsNode(el)) {
          const s = parseFloat(el.getAttribute('data-start'));
          const e = parseFloat(el.getAttribute('data-end'));
          if (!isNaN(s) && (minStart === null || s < minStart)) minStart = s;
          if (!isNaN(e) && (maxEnd === null || e > maxEnd)) maxEnd = e;
        }
      });

      if (minStart === null || maxEnd === null || maxEnd <= minStart) return null;
      return { start: minStart, end: maxEnd };
    }

    // Mặc định Delay = 0s. Đổi sang khoá lưu mới (v2) để giá trị 1s cũ đã lưu trong trình duyệt không ghi đè mặc định mới.
    let loopDelaySeconds = (() => {
      try {
        const raw = localStorage.getItem('shadowing_loop_delay_v2');
        const v = raw === null ? NaN : parseFloat(raw);
        return Number.isFinite(v) ? Math.max(0, Math.min(20, v)) : 0;
      } catch (e) { return 0; }
    })();
    let loopWaitingAtEnd = false;   // đang tạm dừng ở cuối đoạn loop (chờ hết delay, hoặc chờ Backspace khi "Tự dừng cuối câu" đang bật)
    let loopDelayTimer = null;
    let loopPreSeeked = false;      // đã tua sẵn về đầu đoạn trong lúc pause -> hết delay chỉ cần phát là ra tiếng ngay
    let loopGuardUntil = 0;         // bỏ qua kiểm tra mốc cuối ngay sau khi vừa tua (getCurrentTime có thể chưa kịp cập nhật)

    function setLoopDelay(v) {
      loopDelaySeconds = Math.max(0, Math.min(20, Math.round(v)));
      const el = document.getElementById('loop-delay-value');
      if (el) el.textContent = `${loopDelaySeconds}s`;
      try { localStorage.setItem('shadowing_loop_delay_v2', String(loopDelaySeconds)); } catch (e) {}
    }
    function adjustLoopDelay(delta) { setLoopDelay(loopDelaySeconds + delta); }

    // Tua về đầu đoạn loop. autoPlay=false: chỉ tua (dùng ngay lúc bắt đầu pause cuối đoạn, để video kịp nạp sẵn
    // dữ liệu ở đầu đoạn trong khoảng thời gian delay -> khi hết delay phát lại tức thì, không bị khựng thêm).
    function loopSeekToStart(autoPlay) {
      if (!subtitleLoopActive || !ytPlayer) return;
      isInternalSeekAction = true;
      lastPlayerCurrentTime = subtitleLoopStart;
      seekTargetTime = subtitleLoopStart;
      seekGraceUntil = Date.now() + 400;
      handledSentenceEndId = null;
      pausedByAutoPauseId = null;
      stopAtSentenceEndId = null;
      autoPauseCooldownUntil = Date.now() + 800;
      currentSentenceIndex = getSentenceIndexForTime(subtitleLoopStart);
      ytPlayer.seekTo(subtitleLoopStart, true);
      if (autoPlay) ytPlayer.playVideo();
      setTimeout(() => { isInternalSeekAction = false; }, 500);
    }

    // Phát lại đoạn đang loop từ đầu ngay lập tức (dùng khi hết delay, hoặc khi người dùng bấm Backspace / Space
    // để thoát trạng thái tạm dừng do "Tự dừng cuối câu").
    function restartLoopFromStart() {
      if (!subtitleLoopActive || !ytPlayer) return;
      if (loopDelayTimer) { clearTimeout(loopDelayTimer); loopDelayTimer = null; }
      loopWaitingAtEnd = false;
      loopGuardUntil = Date.now() + 350;
      if (loopPreSeeked) {
        loopPreSeeked = false;
        pausedByAutoPauseId = null;
        handledSentenceEndId = null;
        autoPauseCooldownUntil = Date.now() + 800;
        ytPlayer.playVideo();
      } else {
        loopSeekToStart(true);
      }
    }

    // ---- Popup "Dừng loop" hiện ngay trên đoạn chữ đang loop (thay cho thanh ở giữa đáy màn hình) ----
    let loopPopEl = null, loopPopRange = null, loopPopRaf = 0, loopPopFbAt = 0, loopPopFbRect = null;
    function loopPopEnsure() {
      if (loopPopEl) return loopPopEl;
      const el = document.createElement('div');
      el.id = 'loop-stop-pop';
      el.className = 'dc-loop-pop stop';
      el.innerHTML = '<button type="button" id="loop-stop-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2.1l4 4-4 4"></path><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8"></path><path d="M7 21.9l-4-4 4-4"></path><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"></path></svg><span>Dừng loop</span></button>';
      el.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const st = e.target.closest && e.target.closest('.lsp-step');
        if (st) { adjustLoopDelay(parseInt(st.getAttribute('data-d'), 10) || 0); return; }
        if (e.target.closest && e.target.closest('#loop-stop-btn')) stopSubtitleLoop();
      });
      document.body.appendChild(el);
      loopPopEl = el;
      return el;
    }
    function loopPopRect() {
      try {
        if (loopPopRange && loopPopRange.startContainer && loopPopRange.startContainer.isConnected) {
          const r = loopPopRange.getBoundingClientRect();
          if (r && r.width > 0 && r.height > 0) return r;
        }
      } catch (e) {}
      // Vùng chọn gốc đã bị vẽ lại (đổi câu...): tìm lại các chữ nằm trong đoạn loop theo mốc thời gian (không quét mỗi khung hình cho nhẹ)
      const now = Date.now();
      if (now - loopPopFbAt < 300) return loopPopFbRect;
      loopPopFbAt = now; loopPopFbRect = null;
      const a = subtitleLoopStart, b = subtitleLoopEnd;
      if (a == null || b == null) return null;
      const sels = ['#cs-text .sub-word-unit', '#subtitles-scroll-container .sub-word-unit'];
      for (let k = 0; k < sels.length && !loopPopFbRect; k++) {
        let u = null;
        document.querySelectorAll(sels[k]).forEach((w) => {
          const ws = parseFloat(w.getAttribute('data-start')), we = parseFloat(w.getAttribute('data-end'));
          if (!(ws >= a - 0.03 && we <= b + 0.03)) return;
          const r = w.getBoundingClientRect(); if (!r.width) return;
          u = u ? { left: Math.min(u.left, r.left), right: Math.max(u.right, r.right), top: Math.min(u.top, r.top), bottom: Math.max(u.bottom, r.bottom) } : { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        });
        loopPopFbRect = u;
      }
      return loopPopFbRect;
    }
    function loopPopTick() {
      loopPopRaf = 0;
      const el = loopPopEl;
      if (!el || !subtitleLoopActive) return;
      loopPopRaf = requestAnimationFrame(loopPopTick);
      { const nt = performance.now();
        if (nt - loopMarkAt > 300) { loopMarkAt = nt; const big = nt - loopMarkBigAt > 1500; if (big) loopMarkBigAt = nt; loopMarkWords(big); } }
      if (document.body.getAttribute('data-pv-view') && document.body.getAttribute('data-pv-view') !== 'default') { el.classList.remove('on'); loopBoxClearAll(); return; }
      window.LoopBox.render('cs', document.querySelectorAll('#cs-text .loopsel'));
      window.LoopBox.render('right', document.querySelectorAll('#subtitles-scroll-container .loopsel'));
      const r = loopPopRect();
      if (!r) { el.classList.remove('on'); return; }
      el.classList.add('on');
      const half = (el.offsetWidth || 180) / 2, h = el.offsetHeight || 36;
      const cx = (r.left + r.right) / 2;
      el.style.left = Math.max(half + 8, Math.min(window.innerWidth - half - 8, cx)) + 'px';
      el.style.top = Math.min(window.innerHeight - 8, Math.max(h + 14, r.top - 6)) + 'px';
    }
    function loopPopShow(range) {
      const el = loopPopEnsure();
      loopPopRange = range || null; loopPopFbAt = 0; loopPopFbRect = null;
      el.classList.add('on');
      loopMarkWords(true);
      if (!loopPopRaf) loopPopRaf = requestAnimationFrame(loopPopTick);
    }
    function loopPopHide() {
      if (loopPopRaf) { cancelAnimationFrame(loopPopRaf); loopPopRaf = 0; }
      loopPopRange = null; loopPopFbRect = null;
      if (loopPopEl) loopPopEl.classList.remove('on');
      loopMarkWords(true);   // subtitleLoopActive đã tắt -> gỡ đánh dấu chữ loop
      loopBoxClearAll();
    }
    // ---- Khung chữ nhật xanh bọc quanh đoạn đang loop (kiểu timeline In/Out của Chép chính tả); dùng chung cho Mặc định và Shadowing ----
    window.LoopBox = (function () {
      // Mỗi nhóm (key) có 1 "lớp" chứa các khung. Nếu chữ nằm trong vùng cuộn thì lớp nằm BÊN TRONG vùng cuộn đó (position:absolute),
      // nên khung cuộn cùng chữ ở cấp trình duyệt -> không bao giờ bị trễ / "đuổi theo" chữ khi kéo phụ đề.
      const sets = {};
      function scrollerOf(el) {
        for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
          const oy = getComputedStyle(p).overflowY;
          if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
        }
        return null;
      }
      function makeLayer(host) {
        const ly = document.createElement('div');
        ly.className = 'loop-box-layer ' + (host ? 'in' : 'fx');
        (host || document.body).appendChild(ly);
        return ly;
      }
      function clear(key) { const st = sets[key]; if (st) st.segs.forEach((n) => n.classList.remove('on')); }
      function render(key, words) {
        const lines = [];
        let first = null;
        for (let i = 0; i < words.length; i++) {
          const w = words[i]; if (!w || !w.isConnected) continue;
          const r = w.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
          if (!first) first = w;
          const L = lines[lines.length - 1], mid = (r.top + r.bottom) / 2;
          if (L && mid >= L.top && mid <= L.bottom) { L.left = Math.min(L.left, r.left); L.right = Math.max(L.right, r.right); L.top = Math.min(L.top, r.top); L.bottom = Math.max(L.bottom, r.bottom); }
          else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        }
        if (!lines.length) { clear(key); return; }
        const host = scrollerOf(first);
        let st = sets[key];
        if (!st || st.host !== host || !st.layer.isConnected) {
          if (st && st.layer.parentNode) st.layer.remove();
          st = sets[key] = { host: host, layer: makeLayer(host), segs: [] };
        }
        if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';
        if (host && host.lastElementChild !== st.layer) host.appendChild(st.layer);
        const lr = st.layer.getBoundingClientRect();   // gốc toạ độ của lớp: luôn đi cùng nội dung khi cuộn
        const PAD = 2, HANDLE_PAD = 9;   // HANDLE_PAD = bề dày tay nắm (7px) + 2px chừa trống để tay nắm không đè lên chữ
        for (let i = 0; i < lines.length; i++) {
          let n = st.segs[i];
          if (!n) { n = document.createElement('div'); n.className = 'loop-seg'; n.innerHTML = '<i class="lh l"></i><i class="lh r"></i>'; st.layer.appendChild(n); st.segs[i] = n; }
          const L = lines[i];
          const lp = i === 0 ? HANDLE_PAD : PAD, rp = i === lines.length - 1 ? HANDLE_PAD : PAD;   // chỉ đầu đoạn / cuối đoạn mới có tay nắm
          n.style.left = (L.left - lp - lr.left) + 'px';
          n.style.top = (L.top - PAD - lr.top) + 'px';
          n.style.width = (L.right - L.left + lp + rp) + 'px';
          n.style.height = (L.bottom - L.top + PAD * 2) + 'px';
          n.classList.toggle('no-in', i > 0);
          n.classList.toggle('no-out', i < lines.length - 1);
          n.classList.add('on');
        }
        for (let i = lines.length; i < st.segs.length; i++) st.segs[i].classList.remove('on');
      }
      return { render: render, clear: clear };
    })();
    function loopBoxClearAll() { if (window.LoopBox) { window.LoopBox.clear('cs'); window.LoopBox.clear('right'); } }
    // Tô xanh các chữ nằm trong đoạn đang loop (phụ đề bên phải + thẻ câu hiện tại dưới video), giống giao diện Chép chính tả.
    // all=false: chỉ làm lại thẻ câu hiện tại (nó được vẽ lại mỗi khi đổi câu); all=true: làm lại cả danh sách phụ đề bên phải.
    let loopMarkAt = 0, loopMarkBigAt = 0;
    function loopMarkWords(all) {
      const a = subtitleLoopStart, b = subtitleLoopEnd;
      const on = !!subtitleLoopActive && a != null && b != null;
      const sel = all ? '#cs-text .sub-word-unit, #subtitles-scroll-container .sub-word-unit' : '#cs-text .sub-word-unit';
      document.querySelectorAll(sel).forEach((w) => {
        let m = false;
        if (on) {
          const ws = parseFloat(w.getAttribute('data-start')), we = parseFloat(w.getAttribute('data-end'));
          const mid = (ws + we) / 2;
          m = mid >= a - 0.03 && mid <= b + 0.03;
        }
        if (m !== w.classList.contains('loopsel')) w.classList.toggle('loopsel', m);
      });
    }

    function startSubtitleLoop(startTime, endTime, label, range) {
      if (!ytPlayer) { showVocabToast('Chế độ văn bản không có video để loop', false); return; }
      // Tắt loop cũ (nếu có) TRƯỚC khi seek, để seekToTime không hiểu nhầm đây là
      // hành động "rời khỏi đoạn đang loop" rồi tự hủy loop mới sắp bật.
      subtitleLoopActive = false;
      loopStartingNoScroll = true;
      try { seekToTime(startTime, undefined, true, null, false); } finally { loopStartingNoScroll = false; }
      subtitleLoopActive = true;
      subtitleLoopStart = startTime;
      subtitleLoopEnd = endTime;
      loopWaitingAtEnd = false;
      loopPreSeeked = false;
      loopGuardUntil = Date.now() + 400;
      if (loopDelayTimer) { clearTimeout(loopDelayTimer); loopDelayTimer = null; }
      setLoopDelay(loopDelaySeconds);

      loopPopShow(range);

      if (subtitleLoopRafId) cancelAnimationFrame(subtitleLoopRafId);
      const watchLoop = () => {
        if (!subtitleLoopActive) return;
        subtitleLoopRafId = requestAnimationFrame(watchLoop);
        if (loopWaitingAtEnd) return;   // đang tạm dừng chờ hết delay / chờ Backspace -> không kiểm tra tiếp
        if (Date.now() < loopGuardUntil) return;
        if (!ytPlayer || !ytPlayer.getCurrentTime) return;
        try {
          const t = ytPlayer.getCurrentTime();
          // Chỉ theo dõi mốc kết thúc; tốc độ phát (0.5x, 0.75x...) không ảnh hưởng
          // logic này vì ta luôn đọc thời gian thực tế của video, không phải theo nhịp cố định.
          if (t >= subtitleLoopEnd - 0.03) {
            if (!settings.autoPause && !settings.sentenceAutoStop && loopDelaySeconds === 0) {
              // Delay 0s: không cần dừng, nhảy thẳng về đầu đoạn và phát tiếp -> lặp liền mạch.
              loopGuardUntil = Date.now() + 350;
              loopSeekToStart(true);
              return;
            }
            loopWaitingAtEnd = true;
            ytPlayer.pauseVideo();
            // Tua về đầu đoạn NGAY khi vừa pause (video vẫn đứng yên), để trong lúc chờ delay trình phát kịp nạp
            // sẵn dữ liệu -> hết delay chỉ việc phát, ra tiếng ngay lập tức.
            loopSeekToStart(false);
            loopPreSeeked = true;
            if (settings.autoPause || settings.sentenceAutoStop) {
              // "Tự dừng cuối câu" đang bật -> dừng hẳn ở đây, đợi người dùng bấm Backspace mới phát lại từ đầu đoạn.
              return;
            }
            // Đợi đủ thời gian Delay (để người dùng kịp nhại lại - shadowing) rồi mới tự phát lại.
            loopDelayTimer = setTimeout(() => { restartLoopFromStart(); }, loopDelaySeconds * 1000);
          } else if (t < subtitleLoopStart - 0.5) {
            // Đánh dấu đây là seek NỘI BỘ của app (giống cơ chế seekToTime), để bộ
            // phát hiện "scrub timeline" trong startTrackingLoop() không hiểu nhầm
            // cú nhảy về đầu đoạn này là người dùng tự kéo thanh timeline rồi tự ý
            // ép cuộn phụ đề bất chấp chuột đang hover hay không.
            isInternalSeekAction = true;
            lastPlayerCurrentTime = subtitleLoopStart;
            seekGraceUntil = Date.now() + 400;
            ytPlayer.seekTo(subtitleLoopStart, true);
            setTimeout(() => { isInternalSeekAction = false; }, 500);
          }
        } catch (e) {}
      };
      subtitleLoopRafId = requestAnimationFrame(watchLoop);
    }

    function stopSubtitleLoop() {
      subtitleLoopActive = false;
      subtitleLoopStart = null;
      subtitleLoopEnd = null;
      loopWaitingAtEnd = false;
      if (loopDelayTimer) { clearTimeout(loopDelayTimer); loopDelayTimer = null; }
      if (subtitleLoopRafId) {
        cancelAnimationFrame(subtitleLoopRafId);
        subtitleLoopRafId = null;
      }
      loopPopHide();
    }

    // Đang loop mà người dùng chủ động thao tác trên phụ đề (bấm 1 từ / bôi đen 1 đoạn) -> tắt loop + dừng video,
    // để popup "Dừng loop" + "Delay" không chồng lên popup Tra nghĩa / Phát âm / Loop / Lưu.
    function stopLoopAndPause() {
      if (!subtitleLoopActive) return false;
      stopSubtitleLoop();
      try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
      return true;
    }
    // Bấm vào 1 từ ở phụ đề bên phải hoặc phụ đề có IPA (thẻ câu hiện tại): chỉ TẮT loop, không chặn gì thêm
    // -> video vẫn tua + phát từ chữ vừa bấm như bình thường (không pause).
    document.addEventListener('click', (e) => {
      if (!subtitleLoopActive) return;
      const t = e.target;
      if (!t || !t.closest || !t.closest('#subtitles-scroll-container .sub-word-unit, #cs-text .sub-word-unit')) return;
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) return;   // vừa bôi đen xong (kéo chuột): checkTextSelection() sẽ lo (tắt loop + dừng video)
      stopSubtitleLoop();
    }, true);

    document.addEventListener('mouseup', (e) => {
      // Bấm trong chính pop-up (Tra nghĩa / Loop / Lưu) thì không cần đọc lại vùng bôi đen
      if (lookupTooltip && e && lookupTooltip.contains(e.target)) return;
      setTimeout(checkTextSelection, 30);
    });

    // Bấm vào pop-up không được làm mất vùng bôi đen (đặc biệt khi giữ Shift: trình duyệt sẽ hiểu là mở rộng/đổi vùng chọn)
    if (lookupTooltip) lookupTooltip.addEventListener('mousedown', (e) => { e.preventDefault(); });

    document.addEventListener('mousedown', (e) => {
      if (lookupTooltip && !lookupTooltip.contains(e.target)) {
        hideLookupTooltip();
      }
    });

    // ===== CẢM ỨNG (điện thoại / iPad): chạm 1 lần = tua tới từ, chạm 2 lần = chọn từ (giữ lần thứ 2 rồi kéo = chọn cả đoạn), chạm 3 lần = chọn cả câu,
    // rồi hiện popup Tra nghĩa / Loop / Lưu giống hệt khi bôi đen bằng chuột trên máy tính. =====
    const MULTI_CLICK_MS = 170;   // 2 lần chạm / click liên tiếp phải cách nhau dưới 170ms mới tính là double / triple (trước đây 150ms, nới thêm 20ms cho người bấm hơi chậm)
    (function setupTouchSelection() {
      const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/u;
      const SEL = '#subtitles-scroll-container .sub-word-unit, #cs-text .sub-word-unit';
      const LINE = '.sentence-text-line, #cs-text';
      let startX = 0, startY = 0, moved = false, multi = false;
      let lastEnd = 0, lastX = 0, lastY = 0, lastLine = null, taps = 0;
      let mode = 0;                 // 0: chạm thường | 2: đang ở lần chạm thứ 2 (giữ + kéo để chọn) | 3: lần chạm thứ 3 (chọn câu)
      let anchorSp = null, dragged = false, selTimer = null;

      function wordRange(sp) {
        const node = sp.firstChild;
        const r = document.createRange();
        const m = node && node.nodeType === 3 ? WORD_RE.exec(node.nodeValue) : null;
        if (m) { r.setStart(node, m.index); r.setEnd(node, m.index + m[0].length); }
        else r.selectNodeContents(sp);
        return r;
      }
      function setSel(r) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      }
      function sentenceRange(line) {
        const words = line.querySelectorAll('.sub-word-unit');
        if (!words.length) return null;
        const r = document.createRange();
        r.setStartBefore(words[0]);
        r.setEndAfter(words[words.length - 1]);
        return r;
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
      function nearestWord(line, x, y) {
        return pickByRow(line.querySelectorAll('.sub-word-unit'), x, y);
      }
      // Kéo chọn theo từng từ: từ chữ đã chạm 2 lần tới chữ dưới ngón tay (kéo xuôi hoặc ngược đều được)
      function extendTo(cur) {
        const a = wordRange(anchorSp), c = wordRange(cur);
        const forward = anchorSp === cur || (anchorSp.compareDocumentPosition(cur) & Node.DOCUMENT_POSITION_FOLLOWING);
        const r = document.createRange();
        if (forward) { r.setStart(a.startContainer, a.startOffset); r.setEnd(c.endContainer, c.endOffset); }
        else { r.setStart(c.startContainer, c.startOffset); r.setEnd(a.endContainer, a.endOffset); }
        setSel(r);
      }

      document.addEventListener('touchstart', (e) => {
        multi = e.touches.length > 1;
        mode = 0;
        if (multi) { taps = 0; return; }
        const t = e.touches[0];
        moved = false; startX = t.clientX; startY = t.clientY;
        const sp = e.target && e.target.closest ? e.target.closest(SEL) : null;
        if (!sp) { taps = 0; return; }
        const line = sp.closest(LINE);
        const now = Date.now();
        const seq = (taps > 0 && now - lastEnd < MULTI_CLICK_MS && line === lastLine &&
                     Math.hypot(t.clientX - lastX, t.clientY - lastY) < 40) ? taps + 1 : 1;
        if (seq < 2) return;        // chạm 1 lần: giữ nguyên hành vi cũ (tua tới từ)
        if (line) line.querySelectorAll('.sub-word-unit').forEach((w) => {
          if (w._wordClickTimer) { clearTimeout(w._wordClickTimer); w._wordClickTimer = null; }
        });
        if (e.cancelable) e.preventDefault();   // chặn cuộn trang + click giả làm mất vùng chọn
        clearTimeout(selTimer);
        hideLookupTooltip();
        dragged = false;
        if (seq === 2) { mode = 2; anchorSp = sp; setSel(wordRange(sp)); }
        else { mode = 3; const r = line ? sentenceRange(line) : null; if (r) setSel(r); }
      }, { passive: false });

      document.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        if (!t) return;
        if (Math.hypot(t.clientX - startX, t.clientY - startY) > 10) moved = true;
        if (mode !== 2 || !moved) return;
        dragged = true;
        const box = document.getElementById('subtitles-scroll-container');
        if (box) {   // kéo sát mép trên/dưới thì tự cuộn phụ đề
          const b = box.getBoundingClientRect();
          if (t.clientY < b.top + 36) box.scrollTop -= 10;
          else if (t.clientY > b.bottom - 36) box.scrollTop += 10;
        }
        const el = document.elementFromPoint(t.clientX, t.clientY);
        let cur = el && el.closest ? el.closest(SEL) : null;
        if (!cur) {
          const ln = el && el.closest ? el.closest(LINE) : null;
          if (ln) cur = nearestWord(ln, t.clientX, t.clientY);
        }
        if (cur) extendTo(cur);
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        if (mode) {
          if (e.cancelable) e.preventDefault();
          const was = mode;
          mode = 0;
          setTimeout(checkTextSelection, 30);     // thả tay -> hiện popup Tra nghĩa / Loop / Lưu
          setTimeout(checkTextSelection, 250);
          if (was === 2 && !dragged) { taps = 2; lastEnd = Date.now(); lastX = t.clientX; lastY = t.clientY; }   // chờ lần chạm thứ 3
          else taps = 0;
          return;
        }
        if (multi || moved) { taps = 0; return; }
        const sp = e.target && e.target.closest ? e.target.closest(SEL) : null;
        if (!sp) { taps = 0; return; }
        taps = 1; lastEnd = Date.now(); lastLine = sp.closest(LINE); lastX = t.clientX; lastY = t.clientY;
      }, { passive: false });
      document.addEventListener('touchcancel', () => { mode = 0; taps = 0; }, { passive: true });

      // Bôi đen bằng cách nhấn giữ (tay cầm của hệ điều hành) cũng hiện popup
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        document.addEventListener('selectionchange', () => {
          clearTimeout(selTimer);
          if (mode) return;     // đang chạm đôi / kéo chọn: đợi thả tay mới hiện popup
          selTimer = setTimeout(checkTextSelection, 400);
        });
      }
    })();

    (function limitMouseMultiClick() {
      let lastDown = 0;
      document.addEventListener('mousedown', (e) => {
        const box = document.getElementById('subtitles-scroll-container'), csBox = document.getElementById('cs-text');
        if (!e.target || !((box && box.contains(e.target)) || (csBox && csBox.contains(e.target)))) return;
        const now = Date.now();
        if (e.detail > 1 && now - lastDown > MULTI_CLICK_MS && e.cancelable) e.preventDefault();
        lastDown = now;
      }, true);
    })();

    // ===== MÁY TÍNH (chuột): bôi đen "hít" theo từng từ =====
    // - Nhấn chuột + kéo: vùng chọn luôn tròn từ, không cần căn chuột đúng điểm đầu / điểm cuối (rơi vào khoảng trắng, lề, giữa 2 dòng cũng được).
    // - Double-click = chọn 1 từ | Triple-click = chọn cả câu | Double-click rồi giữ lần 2 và kéo = chọn theo từng từ.
    // - Chọn 1 từ (hoặc bấm 1 từ) rồi giữ Shift + bấm từ khác = chọn từ từ đầu đến từ cuối (giữ Shift + kéo cũng được).
    // Chỉ chạy với chuột / trackpad (pointerType === 'mouse'); điện thoại, iPad cảm ứng vẫn dùng đoạn xử lý cảm ứng ở trên.
    // Vùng chọn vẫn là Range thật của trình duyệt nên popup Tra nghĩa / Loop / Lưu / Phát âm chạy y như cũ.
    (function setupMouseWordSelection() {
      const SURFACES = [   // box: khung chứa | word: selector 1 từ | line: selector 1 câu (null = cả khung là 1 câu)
        { box: '#subtitles-scroll-container', word: '.sub-word-unit', line: '.sentence-text-line' },
        { box: '#cs-text', word: '.sub-word-unit', line: null },
        { box: '#vid-en', word: '.sub-word-unit', line: null },
        { box: '#sh-text', word: '.sh-w', line: null }   // giao diện Shadowing
      ];
      const DRAG_PX = 4;     // di chuột quá ngưỡng này mới tính là kéo (bấm đơn vẫn là tua tới từ)
      const EDGE_PX = 36;    // kéo sát mép khung cuộn thì tự cuộn
      const TEXT_RE = /[\p{L}\p{N}](?:.*[\p{L}\p{N}])?/u;   // bỏ dấu câu ở 2 đầu từ ("world," -> "world")
      let ptype = 'mouse', drag = null, raf = 0;
      const memo = { at: 0, seq: 0, line: null, x: 0, y: 0, anchor: null };

      document.addEventListener('pointerdown', (e) => { ptype = e.pointerType || 'mouse'; }, true);

      function surfaceOf(el) {
        for (let i = 0; i < SURFACES.length; i++) {
          const box = el.closest(SURFACES[i].box);
          if (box) return { s: SURFACES[i], box: box };
        }
        return null;
      }
      function lineOf(el, ctx) {
        if (!ctx.s.line) return ctx.box;
        const ln = el.closest(ctx.s.line);
        return ln && ctx.box.contains(ln) ? ln : null;
      }
      function wordRange(sp) {
        const r = document.createRange();
        const node = sp.firstChild;
        const m = node && node.nodeType === 3 ? TEXT_RE.exec(node.nodeValue) : null;
        if (m) { r.setStart(node, m.index); r.setEnd(node, m.index + m[0].length); }
        else r.selectNodeContents(sp);
        return r;
      }
      function rangeBetween(a, c) {
        const ra = wordRange(a), rc = wordRange(c);
        const fwd = a === c || (a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
        const r = document.createRange();
        if (fwd) { r.setStart(ra.startContainer, ra.startOffset); r.setEnd(rc.endContainer, rc.endOffset); }
        else { r.setStart(rc.startContainer, rc.startOffset); r.setEnd(ra.endContainer, ra.endOffset); }
        return r;
      }
      function lineRange(ln, ctx) {
        const ws = ln.querySelectorAll(ctx.s.word);
        if (!ws.length) return null;
        const r = document.createRange();
        r.setStart(wordRange(ws[0]).startContainer, wordRange(ws[0]).startOffset);
        const last = wordRange(ws[ws.length - 1]);
        r.setEnd(last.endContainer, last.endOffset);
        return r;
      }
      function setSel(r) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        if (r) sel.addRange(r);
      }
      // Chọn từ theo KIỂU CÁC APP KHÁC: trước hết xác định con trỏ đang ở DÒNG nào (theo toạ độ dọc), rồi mới chọn từ trong dòng đó theo toạ độ ngang
      // (lệch ra trái -> từ đầu dòng, lệch ra phải -> từ cuối dòng). Trước đây tính khoảng cách 2 chiều tới từng từ nên khi kéo xuống dòng dưới
      // mà con trỏ còn gần một từ của dòng trên hơn (vd: dòng dưới ngắn, con trỏ ở bên phải chỗ hết chữ) thì vùng chọn vẫn dừng ở dòng trên.
      function nearestIn(ln, x, y, ctx) {
        const ws = ln.querySelectorAll(ctx.s.word);
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
      function nearestInBox(x, y, ctx) {   // con trỏ ở ngoài mọi câu (lề, khoảng cách giữa các câu, ra ngoài khung...)
        if (!ctx.s.line) return nearestIn(ctx.box, x, y, ctx);
        const lines = ctx.box.querySelectorAll(ctx.s.line);
        let best = null, bd = Infinity;
        for (let i = 0; i < lines.length; i++) {
          const b = lines[i].getBoundingClientRect();
          if (!b.width && !b.height) continue;
          const dy = y < b.top ? b.top - y : (y > b.bottom ? y - b.bottom : 0);
          if (dy < bd) { bd = dy; best = lines[i]; }
          if (b.top > y) break;   // các câu phía sau chỉ càng xa hơn
        }
        return best ? nearestIn(best, x, y, ctx) : null;
      }
      function pick(x, y, ctx) {   // từ gần con trỏ nhất
        const el = document.elementFromPoint(x, y);
        if (el && ctx.box.contains(el) && !el.closest('.sub-vi-line')) {
          const w = el.closest(ctx.s.word);
          if (w && ctx.box.contains(w)) return w;
          const ln = lineOf(el, ctx);
          if (ln) { const n = nearestIn(ln, x, y, ctx); if (n) return n; }
        }
        return nearestInBox(x, y, ctx);
      }
      function scrollerOf(el) {
        for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
          const oy = getComputedStyle(p).overflowY;
          if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
        }
        return document.scrollingElement || document.documentElement;
      }
      function autoScroll() {
        const sc = drag.scroller;
        if (!sc) return false;
        const isDoc = sc === document.scrollingElement || sc === document.documentElement;
        const rc = isDoc ? null : sc.getBoundingClientRect();
        const top = isDoc ? 0 : rc.top, bot = isDoc ? window.innerHeight : rc.bottom;
        let dy = 0;
        if (drag.y < top + EDGE_PX) dy = -Math.min(28, 3 + (top + EDGE_PX - drag.y) / 3);
        else if (drag.y > bot - EDGE_PX) dy = Math.min(28, 3 + (drag.y - (bot - EDGE_PX)) / 3);
        if (!dy) return false;
        const before = sc.scrollTop;
        sc.scrollTop += dy;
        return sc.scrollTop !== before;
      }
      function schedule() { if (!raf) raf = requestAnimationFrame(update); }
      function update() {
        raf = 0;
        if (!drag || !drag.moved || drag.seq === 3) return;
        const scrolled = autoScroll();
        const cur = pick(drag.x, drag.y, drag.ctx);
        if (cur && cur !== drag.last) { drag.last = cur; setSel(rangeBetween(drag.anchor, cur)); }
        if (scrolled) schedule();   // đang kéo sát mép: tiếp tục cuộn dù chuột đứng yên
      }
      function endDrag() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        drag = null;
      }
      // Shift + bấm khi điểm neo cũ không còn (câu đã được vẽ lại): lấy đầu còn lại của vùng đang bôi đen làm điểm neo
      function anchorFromSelection(ctx, target) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
        const r = sel.getRangeAt(0);
        if (!ctx.box.contains(r.commonAncestorContainer)) return null;
        const hit = Array.prototype.filter.call(ctx.box.querySelectorAll(ctx.s.word), (w) => r.intersectsNode(w));
        if (!hit.length) return null;
        const first = hit[0], last = hit[hit.length - 1];
        return (target.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) ? last : first;
      }

      document.addEventListener('mousedown', (e) => {
        if (ptype !== 'mouse' || e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('button, a, input, textarea, select, [contenteditable="true"], .sub-vi-line')) return;   // dòng tiếng Việt: giữ nguyên bôi đen / copy mặc định
        const ctx = surfaceOf(t);
        if (!ctx || ctx.box.classList.contains('masked')) return;   // Shadowing đang ẩn chữ thì không can thiệp
        const ln = lineOf(t, ctx);
        if (!ln) return;
        let anchor = t.closest(ctx.s.word);
        if (!anchor || !ctx.box.contains(anchor)) anchor = nearestIn(ln, e.clientX, e.clientY, ctx);
        if (!anchor) return;

        const ae = document.activeElement;
        const dropFocus = () => { if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.blur) ae.blur(); };

        // Shift + bấm / kéo: bôi đen từ điểm neo cũ (từ vừa double-click hoặc vừa bấm) tới từ này
        if (e.shiftKey) {
          let a = memo.anchor && memo.anchor.isConnected && ctx.box.contains(memo.anchor) ? memo.anchor : null;
          if (!a) a = anchorFromSelection(ctx, anchor);
          if (a) {
            e.preventDefault(); dropFocus();
            memo.at = 0; memo.anchor = a;
            drag = { ctx: ctx, anchor: a, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: true, seq: 1, last: anchor, scroller: scrollerOf(a) };
            setSel(rangeBetween(a, anchor));
            return;
          }
        }

        e.preventDefault(); dropFocus();   // tự quản lý vùng chọn, không cho trình duyệt bôi đen theo ký tự
        setSel(null);
        const now = Date.now();
        const chained = memo.seq > 0 && memo.seq < 3 && now - memo.at < MULTI_CLICK_MS && memo.line === ln &&
                        Math.hypot(e.clientX - memo.x, e.clientY - memo.y) < 6;
        const seq = chained ? memo.seq + 1 : 1;
        memo.at = now; memo.seq = seq; memo.line = ln; memo.x = e.clientX; memo.y = e.clientY; memo.anchor = anchor;
        drag = { ctx: ctx, anchor: anchor, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, seq: seq, last: anchor, scroller: scrollerOf(anchor) };
        if (seq === 2) setSel(wordRange(anchor));          // double-click: chọn 1 từ (giữ lần 2 rồi kéo = mở rộng theo từng từ)
        else if (seq === 3) setSel(lineRange(ln, ctx));    // triple-click: chọn cả câu
      }, true);

      document.addEventListener('mousemove', (e) => {
        if (!drag) return;
        if (!(e.buttons & 1)) { endDrag(); return; }   // thả chuột ở ngoài cửa sổ
        drag.x = e.clientX; drag.y = e.clientY;
        if (!drag.moved) {
          if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) < DRAG_PX) return;
          drag.moved = true;
        }
        schedule();
      });

      document.addEventListener('mouseup', (e) => {
        if (!drag) return;
        drag.x = e.clientX; drag.y = e.clientY;
        if (drag.moved && drag.seq !== 3) {   // chốt vùng chọn đúng chỗ thả chuột trước khi popup đọc vùng bôi đen
          const cur = pick(drag.x, drag.y, drag.ctx);
          if (cur) setSel(rangeBetween(drag.anchor, cur));
        }
        endDrag();
      }, true);

      window.addEventListener('blur', endDrag);
    })();

    // Lấy ngữ cảnh: 4 câu đứng trước + câu (các câu) chứa phần văn bản được bôi đen.
    function getContextForSelectedText(selectedTxt) {
      if (!sentences || sentences.length === 0) return { contextStr: selectedTxt };

      let firstIdx = -1;
      let lastIdx = -1;

      // Shadowing / Chép chính tả: ngữ cảnh luôn là câu đang luyện (chính xác cả khi cụm từ xuất hiện nhiều lần)
      try { const pvI = window.pvSelIdx ? window.pvSelIdx() : -1; if (pvI >= 0 && pvI < sentences.length) { firstIdx = lastIdx = pvI; } } catch (e) {}

      // Bôi đen ở phụ đề đè lên video: ngữ cảnh là câu đang hiển thị trên video
      if (firstIdx < 0) try {
        ['vid-en', 'cs-text'].forEach((id) => {
          const vEn = document.getElementById(id);
          if (firstIdx < 0 && vEn && selectedRangeForLoop && vEn.contains(selectedRangeForLoop.startContainer)) {
            const di = parseInt(vEn.getAttribute('data-idx'), 10);
            if (di >= 0 && di < sentences.length) { firstIdx = lastIdx = di; }
          }
        });
      } catch (e) {}

      // Ưu tiên xác định theo vùng bôi đen thật sự trên màn hình (chính xác cả khi cụm từ xuất hiện nhiều lần hoặc trải qua nhiều câu)
      if (firstIdx < 0) try {
        const container = activeSubContainer();
        if (container && selectedRangeForLoop) {
          const overlaps = (el) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            return selectedRangeForLoop.compareBoundaryPoints(Range.END_TO_START, r) < 0 &&
                   selectedRangeForLoop.compareBoundaryPoints(Range.START_TO_END, r) > 0;
          };
          container.querySelectorAll('.sentence-text-line').forEach((ln) => {
            if (!overlaps(ln)) return;
            const id = ln.getAttribute('data-id');
            const idx = sentences.findIndex((x) => String(x.id) === id);
            if (idx < 0) return;
            if (firstIdx < 0 || idx < firstIdx) firstIdx = idx;
            if (idx > lastIdx) lastIdx = idx;
          });
        }
      } catch (e) {}

      if (firstIdx < 0) {
        const cleanSel = selectedTxt.toLowerCase().trim();
        for (let i = 0; i < sentences.length; i++) {
          if (sentences[i].text.toLowerCase().includes(cleanSel)) { firstIdx = i; break; }
        }
        if (firstIdx < 0) firstIdx = Math.max(0, Math.min(sentences.length - 1, currentSentenceIndex));
        lastIdx = firstIdx;
      }

      const from = Math.max(0, firstIdx - 4);
      const contextStr = sentences.slice(from, lastIdx + 1).map((x) => x.text.trim()).filter(Boolean).join(' ');
      return { contextStr: contextStr || selectedTxt };
    }

    // Mở một tab mới ở NỀN (không chuyển sang tab đó), dùng cho Shift + click "Tra nghĩa" / "Phát âm".
    // Trình duyệt bỏ qua phím Ctrl/Shift của click "giả" do code tạo ra, nên trang web tự nó không mở được tab nền;
    // việc này phải nhờ extension Shadowing Studio (chrome.tabs.create với active:false).
    // Không có extension (hoặc extension quá cũ) -> mở tab bình thường để không mất thao tác.
    let bgTabSeq = 0, bgTabHintShown = false;
    function openUrlInBackgroundTab(url) {
      const extPresent = document.documentElement.dataset.shadowingExtension === '1';
      const fallback = (msg) => {
        if (msg && !bgTabHintShown) { bgTabHintShown = true; showVocabToast(msg, false); }
        window.open(url, '_blank');
      };
      if (!extPresent) {
        fallback('Shift + click mở tab nền cần cài extension Shadowing Studio. Tạm thời mở tab bình thường.');
        return;
      }
      const id = ++bgTabSeq;
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMsg);
        if (!ok) fallback('Extension cần cập nhật lên bản 1.3.0 trở lên để Shift + click mở tab nền. Tạm thời mở tab bình thường.');
      };
      const onMsg = (e) => {
        if (e.source !== window || !e.data || e.data.type !== 'SHADOWING_OPEN_BG_TAB_RESULT' || e.data.id !== id) return;
        finish(!!e.data.ok);
      };
      const timer = setTimeout(() => finish(false), 800);
      window.addEventListener('message', onMsg);
      window.postMessage({ type: 'SHADOWING_OPEN_BG_TAB', id: id, url: url }, location.origin);
    }

    // Từ đơn (1 từ, bỏ dấu câu ở hai đầu) -> trả về từ đó; bôi đen từ 2 từ trở lên hoặc không phải chữ -> ''
    function getSingleWordForLookup(text) {
      const t = String(text || '').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      if (!t || /\s/.test(t)) return '';
      return /^\p{L}[\p{L}\p{M}]*(?:['’\-][\p{L}\p{M}]+)*$/u.test(t) ? t : '';
    }
    // ==================== ĐƯA TỪ VỀ DẠNG GỐC (cho nút "Phát âm" -> Cambridge) ====================
    // Cambridge chỉ có trang cho dạng gốc (plot, accuse...) chứ không có trang riêng cho plotting, accused...
    // Không có từ điển offline nên dùng luật biến đổi + vài danh sách ngoại lệ. Dạng bất quy tắc phổ biến
    // (went, children, taken...) giữ nguyên vì Cambridge thường có trang riêng cho chúng (và phát âm khác dạng gốc).
    const LM_MAP = {
      // số nhiều bất quy tắc đuôi -ves và gốc Latin/Hy Lạp
      wolves: 'wolf', knives: 'knife', wives: 'wife', shelves: 'shelf', thieves: 'thief', calves: 'calf', halves: 'half',
      selves: 'self', loaves: 'loaf', elves: 'elf', scarves: 'scarf', hooves: 'hoof',
      criteria: 'criterion', phenomena: 'phenomenon', analyses: 'analysis', crises: 'crisis', theses: 'thesis',
      hypotheses: 'hypothesis', diagnoses: 'diagnosis', parentheses: 'parenthesis', syntheses: 'synthesis',
      emphases: 'emphasis', oases: 'oasis', indices: 'index', appendices: 'appendix', vertices: 'vertex', matrices: 'matrix',
      cacti: 'cactus', fungi: 'fungus', nuclei: 'nucleus', stimuli: 'stimulus', alumni: 'alumnus', radii: 'radius',
      curricula: 'curriculum', quizzes: 'quiz', quizzed: 'quiz', quizzing: 'quiz',
      // -ed / -ing đặc biệt
      dyed: 'dye', eyed: 'eye', hoed: 'hoe', toed: 'toe', shoed: 'shoe', canoed: 'canoe', skied: 'ski', taxied: 'taxi',
      lying: 'lie', dying: 'die', tying: 'tie', vying: 'vie', belying: 'belie', untying: 'untie',
      dyeing: 'dye', eyeing: 'eye', singeing: 'singe', tingeing: 'tinge',
    };
    // Từ trông như đã chia nhưng thực ra là dạng gốc (hoặc đã có trang riêng) -> giữ nguyên
    const LM_KEEP = new Set(('thing king ring sing wing bring swing sting spring string cling fling sling wring ding ping zing during morning evening ceiling '
      + 'something anything nothing everything sibling darling earring viking herring shilling sterling bling lightning pudding '
      + 'red bed fed led wed shed sled bled bred fled sped need feed seed speed weed heed deed breed bleed proceed succeed exceed indeed creed greed steed reed '
      + 'hundred kindred naked wicked sacred beloved hatred '
      + 'was has his this its yes plus bus gas lens news series species means physics politics economics mathematics athletics gymnastics headquarters '
      + 'always perhaps sometimes towards besides afterwards backwards forwards across unless thus whereas jeans pants clothes scissors thanks outskirts '
      + 'bias atlas canvas alias chaos cosmos pathos ethos kudos analysis basis crisis axis oasis thesis emphasis diagnosis hypothesis synthesis '
      + 'business address process success access progress congress princess actress mistress express impress discuss illness fitness happiness kindness '
      + '').split(' '));
    const LM_IE_PLURAL = /(movie|cookie|zombie|rookie|calorie|smoothie|hippie|selfie|goodie|brownie|prairie|birdie|genie|collie|newbie|veggie|doggie|junkie|bookie|pixie|sortie|cutie|hoodie|talkie|walkie|boogie|lingerie)s$/;
    const LM_UK_LL = new Set('travell cancell labell modell levell marvell signall totall fuell channell counsell equall quarrell tunnell controll compell expell patroll propell rebell repell excell dispell pedall shovell jewell diall'.split(' '));
    const LM_CK = new Set(['panick', 'picnick', 'traffick', 'mimick', 'frolick', 'politick', 'physick']);
    const LM_KEEPSTEM = new Set(['purr', 'butt', 'mutt', 'murmur', 'sulphur']);
    // gốc đã mất "e" cuối nhưng không thể suy ra bằng luật chung -> thêm "e" trực tiếp
    const LM_PLUSE = new Set(('compar prepar declar bewar unprepar ignor explor restor implor deplor outscor interfer adher coher persever welcom becom overcom '
      + 'renam inflam misnam escap landscap reshap misshap postpon condon dethron aton inton compil reconcil defil exil consol cajol inhal exhal impal '
      + 'complet delet compet repet deplet concret preced conced reced seced interced supersed guid ach cach excit invit recit ignit unit incit expedit '
      + 'promot devot denot connot misquot dislik unlik creat recreat procreat persuad dissuad').split(' '));
    const LM_TH = new Set('breath bath cloth loath sooth writh seeth teeth wreath bequeath sheath'.split(' '));
    const LM_KEEP_S_STEM = new Set(['focus', 'bias', 'canvas', 'atlas', 'alias', 'chaos', 'cosmos', 'bonus', 'genus']);
    const LM_KEEP_AT = new Set(['combat', 'format', 'habitat', 'acrobat', 'diplomat', 'democrat', 'wombat']);
    const LM_KEEP_IN = new Set(['margin', 'origin', 'cousin', 'muffin', 'coffin', 'login', 'robin', 'satin', 'basin', 'raisin']);
    const LM_OES_S = /^(shoes|toes|foes)$|(canoes|oboes|horseshoes|tiptoes|snowshoes)$/;
    const LM_USES_ES = ['viruses', 'focuses', 'campuses', 'bonuses', 'circuses', 'statuses', 'citruses', 'walruses', 'octopuses', 'platypuses', 'apparatuses', 'surpluses', 'minuses', 'pluses', 'buses', 'lotuses', 'cactuses', 'choruses', 'crocuses', 'gases', 'biases', 'aliases', 'canvases', 'atlases'];

    function lmRestoreStem(s) {
      if (LM_UK_LL.has(s)) return s.slice(0, -1);
      if (LM_CK.has(s)) return s.slice(0, -1);
      if (LM_KEEPSTEM.has(s)) return s;
      if (LM_PLUSE.has(s)) return s + 'e';
      if (/([bdgmnprt])\1$/.test(s) && s.length >= 4) return s.slice(0, -1);     // plott -> plot, runn -> run
      if (/(ll|ss|ff|zz|cc|dd|gg|nn|rr|tt|bb|mm|pp)$/.test(s)) return s;         // tell, pass, stuff, add, egg...
      if (/[aeiou]$/.test(s)) return (/[^aeiou]u$/.test(s) || s === 'queu') ? s + 'e' : s;   // argu -> argue; see, go, ski giữ nguyên
      if (/[vzc]$/.test(s)) return s + 'e';                                       // mov -> move, amaz -> amaze, danc -> dance
      if (/(dg|rg|lg)$/.test(s)) return s + 'e';                                  // judg, charg, bulg
      if (/ng$/.test(s)) return (/(chang|rang|plung|lung|spong)$/.test(s) || (/eng$/.test(s) && s.length >= 6)) ? s + 'e' : s;
      if (/[aeiou]g$/.test(s) && s.length >= 4) return s + 'e';                   // manag, engag
      if (/th$/.test(s)) return LM_TH.has(s) ? s + 'e' : s;                        // breath -> breathe
      if (/[bcdfgkpstz]l$/.test(s)) return s + 'e';                               // handl -> handle, settl -> settle
      if (/[lnrp]s$/.test(s)) return s + 'e';                                     // nurs, licens, collaps
      if (/[aeiouy]s$/.test(s)) return LM_KEEP_S_STEM.has(s) ? s : s + 'e';       // accus -> accuse, rais -> raise
      if (/[^aeiou]ur$/.test(s) && s.length >= 4) return s + 'e';                 // secur, figur, captur
      if ((/[^aeiou]ir$/.test(s) && s.length >= 4) || /quir$/.test(s)) return s + 'e';   // admir, requir, acquir
      if (/(iat|uat)$/.test(s) && s.length >= 6) return s + 'e';                  // negotiat, evaluat
      if (/[^aeiouy]at$/.test(s) && s.length >= 5 && !LM_KEEP_AT.has(s)) return s + 'e';   // relat, locat, operat
      if (/[^aeiouy]ut$/.test(s) && s.length >= 5) return s + 'e';                // contribut, execut
      if (/[^aeiou]id$/.test(s) && s.length >= 4) return s + 'e';                 // provid, decid
      if (/[^aeiou]ud$/.test(s) && s.length >= 6) return s + 'e';                 // includ, conclud
      if (/[^aeiouy]ad$/.test(s) && s.length >= 5) return s + 'e';                // persuad, invad
      if (/[^aeiou]od$/.test(s) && s.length >= 5) return s + 'e';                 // explod, decod
      if (/[^aeiouy]ak$/.test(s) && s.length >= 5) return s + 'e';                // mistak, undertak
      if (/[^aeiou]ok$/.test(s) && s.length >= 4) return s + 'e';                 // provok, evok
      if (/[^aeiou]ib$/.test(s) && s.length >= 5) return s + 'e';                 // describ, subscrib
      if (/[^aeiou]um$/.test(s) && s.length >= 5) return s + 'e';                 // consum, assum
      if (/[^aeiou]in$/.test(s) && s.length >= 5 && !LM_KEEP_IN.has(s)) return s + 'e';   // imagin, examin
      const t = s.replace(/qu/g, 'q');
      if (/^[^aeiouy]*[aeiouy][^aeiouwxy]$/.test(t)) return s + 'e';              // hop -> hope, mak -> make, us -> use
      return s;
    }

    function lmStripS(w) {
      if (/(ss|us|is|ous|ics)$/.test(w)) return w;
      if (LM_IE_PLURAL.test(w)) return w.slice(0, -1);
      if (/ies$/.test(w)) return w.length > 4 ? w.slice(0, -3) + 'y' : w.slice(0, -1);   // studies -> study, ties -> tie
      if (/oes$/.test(w)) return LM_OES_S.test(w) ? w.slice(0, -1) : w.slice(0, -2);   // heroes -> hero, shoes -> shoe
      if (/uses$/.test(w)) return LM_USES_ES.some((x) => w.endsWith(x)) ? w.slice(0, -2) : w.slice(0, -1);
      if (/(ases|ises)$/.test(w) && LM_USES_ES.some((x) => w.endsWith(x))) return w.slice(0, -2);
      if (/(^|[^eo])aches$|^aches$/.test(w) || /(niches|quiches|cliches|psyches|creches|avalanches)$/.test(w)) return w.slice(0, -1);
      if (/(ss|sh|ch|x|zz)es$/.test(w)) return w.slice(0, -2);                   // passes -> pass, watches -> watch, boxes -> box
      if (/es$/.test(w)) return w.slice(0, -1);                                  // makes -> make, uses -> use, houses -> house
      if (/(as|os)$/.test(w) && w.length <= 5 && LM_KEEP.has(w)) return w;
      return w.slice(0, -1);                                                     // plots -> plot
    }

    function lmStripIng(w) {
      if (w.length < 5) return null;
      const stem = w.slice(0, -3);
      if (!/[aeiouy]/.test(stem)) return w;                                      // string, spring, bring...
      return lmRestoreStem(stem);
    }

    function lmStripEd(w) {
      if (w.length < 4) return null;
      if (/ied$/.test(w)) return w.length <= 4 ? w.slice(0, -1) : w.slice(0, -3) + 'y';   // tried -> try, died -> die
      if (/eed$/.test(w)) return w.slice(0, -1);                                  // agreed -> agree
      const stem = w.slice(0, -2);
      if (!/[aeiouy]/.test(stem)) return w;                                      // shed, sled, bled
      return lmRestoreStem(stem);
    }

    // Hàm alias tương thích
    function lemmatizeEnglish(raw) {
      return lemmatizeFrench(raw);
    }

    // Hỗ trợ đưa từ tiếng Pháp về dạng gốc và tra từ điển Larousse
    function lemmatizeFrench(raw) {
      if (!raw) return '';
      let w = String(raw).toLowerCase().replace(/’/g, "'").trim();
      w = w.replace(/^(?:[ldjcsmtn]|qu)['’]/i, '');
      const LM_FR = {
        'suis': 'être', 'es': 'être', 'est': 'être', 'sommes': 'être', 'êtes': 'être', 'sont': 'être', 'été': 'être',
        'serai': 'être', 'seras': 'être', 'sera': 'être', 'serons': 'être', 'serez': 'être', 'seront': 'être',
        'étais': 'être', 'était': 'être', 'étions': 'être', 'étiez': 'être', 'étaient': 'être',
        'sois': 'être', 'soit': 'être', 'soyons': 'être', 'soyez': 'être', 'soient': 'être',
        'ai': 'avoir', 'as': 'avoir', 'a': 'avoir', 'avons': 'avoir', 'avez': 'avoir', 'ont': 'avoir', 'eu': 'avoir',
        'aurai': 'avoir', 'auras': 'avoir', 'aura': 'avoir', 'aurons': 'avoir', 'aurez': 'avoir', 'auront': 'avoir',
        'avais': 'avoir', 'avait': 'avoir', 'avions': 'avoir', 'aviez': 'avoir', 'avaient': 'avoir',
        'aie': 'avoir', 'ait': 'avoir', 'ayons': 'avoir', 'ayez': 'avoir', 'aient': 'avoir',
        'vais': 'aller', 'vas': 'aller', 'va': 'aller', 'allons': 'aller', 'allez': 'aller', 'vont': 'aller',
        'irai': 'aller', 'iras': 'aller', 'ira': 'aller', 'irons': 'aller', 'irez': 'aller', 'iront': 'aller',
        'allé': 'aller', 'allée': 'aller', 'allés': 'aller', 'allées': 'aller',
        'fais': 'faire', 'fait': 'faire', 'faisons': 'faire', 'faites': 'faire', 'font': 'faire',
        'peux': 'pouvoir', 'peut': 'pouvoir', 'pouvons': 'pouvoir', 'pouvez': 'pouvoir', 'peuvent': 'pouvoir', 'pu': 'pouvoir',
        'veux': 'vouloir', 'veut': 'vouloir', 'voulons': 'vouloir', 'voulez': 'vouloir', 'veulent': 'vouloir', 'voulu': 'vouloir',
        'sais': 'savoir', 'sait': 'savoir', 'savons': 'savoir', 'savez': 'savoir', 'savent': 'savoir', 'su': 'savoir',
        'vois': 'voir', 'voit': 'voir', 'voyons': 'voir', 'voyez': 'voir', 'voient': 'voir', 'vu': 'voir',
        'viens': 'venir', 'vient': 'venir', 'venons': 'venir', 'venez': 'venir', 'viennent': 'venir', 'venu': 'venir',
        'yeux': 'oeil', 'eaux': 'eau', 'chevaux': 'cheval', 'travaux': 'travail', 'journaux': 'journal'
      };
      if (LM_FR[w]) return LM_FR[w];
      if (w.endsWith('aux') && w.length > 4) return w.slice(0, -3) + 'al';
      if ((w.endsWith('s') || w.endsWith('x')) && w.length > 3) {
        const stem = w.slice(0, -1);
        if (LM_FR[stem]) return LM_FR[stem];
        if (stem.endsWith('e') && stem.length > 3) return stem.slice(0, -1);
        return stem;
      }
      if (w.endsWith('e') && w.length > 4) {
        if (w.endsWith('ée')) return w.slice(0, -1);
        if (w.endsWith('ière')) return w.slice(0, -4) + 'ier';
        if (w.endsWith('euse')) return w.slice(0, -4) + 'eur';
        if (w.endsWith('trice')) return w.slice(0, -5) + 'teur';
      }
      return w;
    }

    function cambridgeUrlForWord(word) {
      const base = lemmatizeFrench(word) || String(word).toLowerCase();
      const slug = base.replace(/['’]/g, '');
      return 'https://www.larousse.fr/dictionnaires/francais/' + encodeURIComponent(slug);
    }

    btnLookupAction.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!selectedTextForLookup) return;

      const selText = selectedTextForLookup;
      const contextStr = vocabAreaCtx ? vocabAreaCtx.contextStr : getContextForSelectedText(selText).contextStr;

      const queryStr =
`Tôi đang học tiếng Pháp. Tôi muốn hỏi từ/câu/đoạn sau đây có nghĩa là gì: “${selText}”.
Trình bày theo kiểu trích lại đoạn/câu/từ gốc + loại từ + giống (masculin/féminin nếu là danh từ) + phiên âm IPA chuẩn Pháp, sau đó xuống dòng và viết nghĩa tiếng Việt của nó (phần nghĩa tiếng Việt bôi đen).
Nếu đoạn văn bản tôi vừa cung cấp là/chứa một từ/thành ngữ/cụm từ thì cho thêm 2-3 ví dụ thực tế bằng tiếng Pháp kèm bản dịch tiếng Việt của từng ví dụ.
Tôi tìm thấy đoạn/câu/từ trên ở trong ngữ cảnh sau:

“${contextStr}”`;

      const searchUrl = `https://www.google.com/search?udm=50&q=${encodeURIComponent(queryStr)}`;   // udm=50: mở thẳng Google AI Mode (luôn trả lời bằng AI)

      if (e.shiftKey) {
        // Shift + click: mở tab mới ở nền để tra nghĩa, vẫn ở lại trang hiện tại và GIỮ NGUYÊN 3 pop-up + vùng bôi đen.
        openUrlInBackgroundTab(searchUrl);
        return;
      }

      window.open(searchUrl, '_blank');
      hideLookupTooltip();
      window.getSelection()?.removeAllRanges();
    });

    const btnPronounceAction = document.getElementById('btn-pronounce-action');
    if (btnPronounceAction) {
      btnPronounceAction.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const word = getSingleWordForLookup(selectedTextForLookup) || (selectedTextForLookup || '').trim();
        if (!word) return;

        if (e.shiftKey) {
          // Shift + click: mở tab nền trên Từ điển Larousse
          const url = cambridgeUrlForWord(word);
          openUrlInBackgroundTab(url);
          return;
        }

        if (e.altKey && !isTextMode && currentVideoId && ytPlayer && isPlayerReady) {
          // Alt / Option + click: Phát đoạn âm thanh từ video gốc
          const timeRange = getTimeRangeFromSelection(selectedRangeForLoop);
          const st = timeRange ? timeRange.start : (sentences[currentSentenceIndex]?.startTime || 0);
          seekToTime(st, undefined, true);
          return;
        }

        // Phát âm tiếng Pháp trực tiếp
        btnPronounceAction.classList.add('playing');
        window.playFrenchAudio(word, {
          rate: 0.95,
          onStart: () => btnPronounceAction.classList.add('playing'),
          onEnd: () => btnPronounceAction.classList.remove('playing')
        });
        setTimeout(() => btnPronounceAction.classList.remove('playing'), 900);
      });
    }

    const btnLoopAction = document.getElementById('btn-loop-action');
    // Dùng chung cho nút "Loop" và phím tắt L.
    function loopSelectedText(keepPopup) {
      if (!selectedRangeForLoop || !selectedTextForLookup) {
        showVocabToast('Hãy bôi đen một đoạn phụ đề trước rồi bấm L để loop', false);
        return;
      }
      const timeRange = getTimeRangeFromSelection(selectedRangeForLoop);
      const labelText = selectedTextForLookup;
      const loopRange = selectedRangeForLoop.cloneRange();   // giữ lại để đặt popup "Dừng loop" ngay trên chỗ vừa bôi đen

      // Shift + click: vẫn loop như bình thường nhưng GIỮ NGUYÊN 3 pop-up + vùng bôi đen.
      if (!keepPopup) {
        hideLookupTooltip();
        window.getSelection()?.removeAllRanges();
      }

      if (!timeRange) return;
      startSubtitleLoop(timeRange.start, timeRange.end, labelText, loopRange);
    }
    btnLoopAction.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!selectedRangeForLoop) return;
      loopSelectedText(e.shiftKey);
    });

    // Phím tắt S: lưu từ vựng đang bôi đen
    function saveSelectionToVocabByKey() {
      if (!selectedRangeForLoop || !selectedTextForLookup) {
        showVocabToast('Hãy bôi đen từ/cụm từ trước rồi bấm S để lưu', false);
        return;
      }
      saveSelectionToVocab(false);
    }

    // Bảng phím tắt (nút dưới khu ghi âm)
    function toggleShortcutsPanel() {
      const panel = document.getElementById('shortcuts-panel');
      const chev = document.getElementById('shortcuts-chevron');
      if (!panel) return;
      const open = panel.classList.toggle('hidden') === false;
      if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
      const btn = document.getElementById('btn-shortcuts-toggle');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // ==================== HÀM CUỘN MƯỢT TỰ NHIÊN (EASING INTERPOLATION) ====================
    let activeScrollAnimationId = null;

    function smoothScrollToPosition(container, targetY) {
      if (!container) return;
      if (activeScrollAnimationId) cancelAnimationFrame(activeScrollAnimationId);

      const startY = container.scrollTop;
      const difference = targetY - startY;
      if (Math.abs(difference) < 3) return;

      // Ease-in-out (thay vì ease-out thuần trước đây): chuyển động KHỞI ĐỘNG nhẹ
      // nhàng, tăng tốc ở giữa, rồi chậm dần khi tới đích. Ease-out thuần bắt đầu
      // ở tốc độ nhanh nhất ngay lập tức -> mắt đang đứng yên bị "giật" đột ngột
      // ngay từ khung hình đầu tiên, đó là cảm giác "mất định hướng" khi phụ đề
      // nhảy. Ease-in-out mô phỏng đúng cách mắt người tự nhiên bắt đầu đuổi theo
      // một chuyển động (saccade mượt: khởi động dần - không giật cục).
      const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

      // Thời lượng animation tỉ lệ theo QUÃNG ĐƯỜNG thực tế cần di chuyển, thay vì
      // một con số cố định cho mọi trường hợp. Một cú nhảy 1 dòng (~30-40px, tình
      // huống phổ biến nhất khi karaoke rớt dòng) chỉ cần chuyển động ngắn, nhanh,
      // êm; một cú nhảy xa (chuyển hẳn sang câu khác, cách nhiều dòng) cần thời
      // gian dài hơn một chút để mắt kịp "đuổi theo" thay vì bị giật đột ngột.
      // Cùng một duration cố định cho cả 2 trường hợp khiến quãng ngắn cảm giác
      // giật (vì tốc độ trung bình quá cao so với khoảng cách) còn quãng dài lại
      // cảm giác hơi đột ngột lúc tăng tốc.
      const distance = Math.abs(difference);
      const effectiveDuration = Math.min(650, Math.max(260, distance * 1.15));

      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / effectiveDuration, 1);
        const ease = easeInOutQuad(progress);

        container.scrollTop = startY + difference * ease;

        if (progress < 1) {
          activeScrollAnimationId = requestAnimationFrame(step);
        } else {
          activeScrollAnimationId = null;
        }
      }

      activeScrollAnimationId = requestAnimationFrame(step);
    }

    function scrollElementToElevatedPosition(el, container) {
      if (!el || !container) return;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const isMobile = window.innerWidth <= 1023;
      const desiredRatio = isMobile ? 0.25 : 0.33;
      const desiredTopPosition = Math.max(16, containerRect.height * desiredRatio);
      const diff = elRect.top - containerRect.top - desiredTopPosition;
      
      const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
      const effectiveBottom = Math.min(containerRect.bottom, viewportBottom - 15);
      const isNearBottom = elRect.bottom > effectiveBottom - 35;
      const isNearTop = elRect.top < containerRect.top + 10;

      if (Math.abs(diff) > 10 || isNearBottom || isNearTop) {
        const targetScrollTop = Math.max(0, container.scrollTop + diff);
        smoothScrollToPosition(container, targetScrollTop);
      }
    }

    function triggerSmoothCenterScroll(targetIndex, force = false, explicitTime = null) {
      if (!force && (!settings.autoScroll || shouldPreventAutoScroll())) return;
      // Khi chuột đang hover trên phụ đề, tuyệt đối không cuộn — kể cả bị "force"
      // (ví dụ do tua timeline/±5s hoặc do Loop quay lại đầu đoạn). Người dùng đang
      // đọc/tương tác với phụ đề thì phụ đề phải đứng yên trong mọi trường hợp.
      if (shouldPreventAutoScroll()) return;

      const targetSentence = sentences[targetIndex];
      if (!targetSentence) return;
      const container = document.getElementById('subtitles-scroll-container');
      if (!container) return;

      // Luôn cuộn theo ĐÚNG TỪ đang được phát tại thời điểm hiện tại của video
      // (không phải theo đầu câu) -- nhất quán với vị trí 33% mà Cuộn tự động
      // (karaoke) đang dùng, và xử lý đúng cả câu dài nhiều dòng lẫn phụ đề không
      // dấu câu bị gộp thành 1 câu khổng lồ.
      // QUAN TRỌNG: khi hàm này được gọi ngay trong lúc tua (từ seekToTime), video
      // CHƯA kịp seek xong nên ytPlayer.getCurrentTime() vẫn trả về thời điểm CŨ
      // -> phải nhận thời điểm ĐÍCH qua explicitTime, không tự đọc currentTime lúc đó.
      const t = explicitTime !== null
        ? explicitTime
        : ((ytPlayer && ytPlayer.getCurrentTime) ? ytPlayer.getCurrentTime() : targetSentence.startTime);
      const el = findActiveWordElement(t, container);

      if (!el) return;
      scrollElementToElevatedPosition(el, container);
    }

    // ==================== MICRO + MEDIARECORDER (CHẤT LƯỢNG CAO) ====================
    // Trước đây: getUserMedia({ audio: true }) + new MediaRecorder(stream) (toàn bộ để mặc định). Mặc định đó bật bộ xử lý "gọi thoại" của
    // trình duyệt (khử vọng, khử ồn, tự chỉnh âm lượng) nên giọng bị bí, méo như nói qua điện thoại; bitrate mã hóa cũng do trình duyệt tự chọn (thường thấp).
    // Giờ: tắt các bộ xử lý đó, yêu cầu mono 48 kHz, và mã hóa Opus (hoặc AAC trên Safari) ở 128 kbps.
    async function getMicStream() {
      const constraints = {
        channelCount: 1,
        sampleRate: { ideal: 48000 },
        echoCancellation: false,   // app đã tạm dừng video khi thu nên không cần khử vọng; bật lên sẽ làm méo giọng
        noiseSuppression: false,   // khử ồn của trình duyệt cắt bớt dải cao của giọng nói
        autoGainControl: false     // tự chỉnh âm lượng gây hiện tượng "bơm" âm lượng, nghe rè
      };
      try { return await navigator.mediaDevices.getUserMedia({ audio: constraints }); }
      catch (e) {
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError' || e.name === 'NotFoundError')) throw e;   // lỗi quyền/không có micro: báo lại như cũ
        return await navigator.mediaDevices.getUserMedia({ audio: true });                                             // trình duyệt không nhận ràng buộc -> dùng mặc định
      }
    }

    function createMicRecorder(stream) {
      const prefs = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm'];
      let mime = '';
      try { mime = prefs.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || ''; } catch (e) {}
      const opts = { audioBitsPerSecond: 128000 };
      if (mime) opts.mimeType = mime;
      try { return new MediaRecorder(stream, opts); } catch (e) { return new MediaRecorder(stream); }
    }

    // ==================== GHI ÂM SO SÁNH ====================
    async function toggleRecording() {
      if (isRecording) stopRecording();
      else startRecording();
    }

    async function startRecording() {
      try {
        const stream = await getMicStream();
        audioChunks = [];
        mediaRecorder = createMicRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: (mediaRecorder && mediaRecorder.mimeType) || 'audio/webm' });
          if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
          recordedAudioUrl = URL.createObjectURL(audioBlob);
          document.getElementById('recording-actions').classList.remove('hidden');
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start();
        isRecording = true;
        recordSeconds = 0;
        document.getElementById('record-timer').textContent = '00:00';
        document.getElementById('btn-record-text').textContent = 'Dừng ghi âm';
        document.getElementById('btn-record').className = 'btn-interactive flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md animate-pulse cursor-pointer';
        
        recordTimerInterval = setInterval(() => {
          recordSeconds++;
          const m = Math.floor(recordSeconds / 60);
          const s = recordSeconds % 60;
          document.getElementById('record-timer').textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }, 1000);
      } catch (err) {
        isRecording = false;
        if (recordTimerInterval) { clearInterval(recordTimerInterval); recordTimerInterval = null; }
        const btn = document.getElementById('btn-record');
        if (btn) btn.className = 'btn-interactive flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-medium text-xs shadow-md cursor-pointer';
        const txt = document.getElementById('btn-record-text');
        if (txt) txt.textContent = 'Nhấn để thu âm';
        showVocabToast('Không thể truy cập Microphone. Vui lòng cấp quyền micro cho trang web.', false);
      }
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      isRecording = false;
      if (recordTimerInterval) clearInterval(recordTimerInterval);
      document.getElementById('btn-record-text').textContent = 'Ghi âm lại';
      document.getElementById('btn-record').className = 'btn-interactive flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-medium text-xs shadow-md cursor-pointer';
    }

    function playUserRecording() {
      if (!recordedAudioUrl) return;
      if (userAudioPlayer) {
        userAudioPlayer.pause();
        userAudioPlayer.currentTime = 0;
      }
      userAudioPlayer = new Audio(recordedAudioUrl);
      const textBtn = document.getElementById('text-play-user-rec');
      userAudioPlayer.onplay = () => { textBtn.textContent = 'Đang phát...'; };
      userAudioPlayer.onended = () => { textBtn.textContent = 'Phát lại giọng của bạn'; };
      userAudioPlayer.onerror = () => { textBtn.textContent = 'Phát lại giọng của bạn'; };
      userAudioPlayer.play();
    }

