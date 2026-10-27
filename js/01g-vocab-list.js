    // ==================== TỪ VỰNG ĐÃ LƯU ====================
    // Mỗi mục: { id, text, kind, en (ngữ cảnh), hs/he (vị trí từ được tô sáng trong en), vi (bản dịch, có thể rỗng),
    //           videoId, videoTitle, t (giây), createdAt }. Lưu trong localStorage, không cần backend.
    const VOCAB_KEY = 'shadowing_saved_vocab_v1';
    let vocabSource = 'all', vocabLevelFilter = 'all', vocabSort = 'new', vocabQuery = '', vocabReturnTo = 'input', vocabHomeScrollY = 0, vocabScrollY = 0;
    let vocabToastTimer = null;
    let pendingSeekTime = null;
    let vocabEditIds = new Set();          // các mục đang bật ô sửa "nghĩa riêng của từ"
    let vocabMeaningBatchIds = [];         // thứ tự id ứng với số thứ tự trong prompt đã copy gần nhất

    // escHtml & escapeHtml are declared and hoisted at the top of the main script tag.
    function mergeDuplicateVocab(list) {
      if (!Array.isArray(list) || list.length <= 1) return Array.isArray(list) ? list : [];
      const map = new Map();
      list.forEach((item) => {
        if (!item || !item.text) return;
        const key = String(item.text).trim().toLowerCase();
        if (!map.has(key)) {
          const clone = Object.assign({}, item);
          if (!Array.isArray(clone.contexts)) clone.contexts = [];
          map.set(key, clone);
        } else {
          const target = map.get(key);
          if (!target.wordVi && item.wordVi) target.wordVi = item.wordVi;
          if ((!target.examples || !target.examples.length) && (item.examples && item.examples.length)) target.examples = item.examples;
          if (!target.tag && item.tag) target.tag = item.tag;
          if (item.srs && (!target.srs || (item.srs.reps || 0) > (target.srs.reps || 0))) {
            target.srs = item.srs;
          }
          const isSamePrimary = (target.videoId === item.videoId && Math.abs((target.t || 0) - (item.t || 0)) < 2);
          const isAlreadyInContexts = target.contexts.some(c => c.videoId === item.videoId && Math.abs((c.t || 0) - (item.t || 0)) < 2);
          if (!isSamePrimary && !isAlreadyInContexts) {
            target.contexts.push({
              videoId: item.videoId || '',
              videoTitle: item.videoTitle || '',
              bookId: item.bookId || '',
              en: item.en || '',
              vi: item.vi || '',
              hs: item.hs || 0,
              he: item.he || 0,
              t: item.t || 0,
              createdAt: item.createdAt || Date.now()
            });
          }
          if (Array.isArray(item.contexts)) {
            item.contexts.forEach(c => {
              if (!target.contexts.some(tc => tc.videoId === c.videoId && Math.abs((tc.t || 0) - (c.t || 0)) < 2)) {
                target.contexts.push(c);
              }
            });
          }
        }
      });
      return Array.from(map.values());
    }

    const DEFAULT_VOCAB_SAMPLES = [
      {
        id: 'sample-vocab-1',
        text: 'magnifique',
        wordVi: 'a. tuyệt đẹp, tráng lệ',
        en: "J'ai vu une magnifique image dans un livre sur la Forêt Vierge.",
        vi: "Tôi đã nhìn thấy một bức tranh tuyệt đẹp trong một cuốn sách về Rừng Nguyên Sinh.",
        hs: 14,
        he: 24,
        kind: 'word',
        tag: 'Từ',
        level: 'B1',
        createdAt: Date.now() - 3600000 * 24,
        videoTitle: 'Le Petit Prince',
        bookId: 'sample-le-petit-prince'
      },
      {
        id: 'sample-vocab-2',
        text: 'découvrir',
        wordVi: 'v. khám phá, phát hiện',
        en: "Nous allons découvrir le secret du bonheur au quotidien.",
        vi: "Chúng ta sẽ khám phá bí mật của hạnh phúc trong cuộc sống hàng ngày.",
        hs: 10,
        he: 19,
        kind: 'word',
        tag: 'Từ',
        level: 'A2',
        createdAt: Date.now() - 3600000 * 18,
        videoTitle: 'Français Authentique'
      },
      {
        id: 'sample-vocab-3',
        text: "s'émerveiller",
        wordVi: 'v. trầm trồ, ngạc nhiên thú vị',
        en: "Il faut savoir s'émerveiller des petites choses de la vie.",
        vi: "Cần phải biết trầm trồ trước những điều nhỏ bé trong cuộc sống.",
        hs: 14,
        he: 28,
        kind: 'word',
        tag: 'Từ',
        level: 'B2',
        createdAt: Date.now() - 3600000 * 12,
        videoTitle: 'Philosophie & Vie'
      },
      {
        id: 'sample-vocab-4',
        text: 'au lever du jour',
        wordVi: 'loc. khi bình minh ló rạng, lúc tảng sáng',
        en: "Au lever du jour, une drôle de petite voix m'a réveillé.",
        vi: "Khi bình minh ló rạng, một giọng nói nhỏ bé kỳ lạ đã đánh thức tôi dậy.",
        hs: 0,
        he: 16,
        kind: 'phrase',
        tag: 'Cụm từ',
        level: 'B1',
        createdAt: Date.now() - 3600000 * 6,
        videoTitle: 'Le Petit Prince',
        bookId: 'sample-le-petit-prince'
      },
      {
        id: 'sample-vocab-5',
        text: 'chef-d’œuvre',
        wordVi: 'n.m. kiệt tác, tác phẩm xuất sắc nhất',
        en: "J'ai montré mon chef-d'œuvre aux grandes personnes.",
        vi: "Tôi đã khoe kiệt tác của mình với những người lớn.",
        hs: 16,
        he: 28,
        kind: 'word',
        tag: 'Từ',
        level: 'B2',
        createdAt: Date.now() - 3600000 * 2,
        videoTitle: 'Le Petit Prince',
        bookId: 'sample-le-petit-prince'
      }
    ];

    function getVocab() {
      try {
        const raw = localStorage.getItem(VOCAB_KEY);
        if (!raw) {
          localStorage.setItem(VOCAB_KEY, JSON.stringify(DEFAULT_VOCAB_SAMPLES));
          return DEFAULT_VOCAB_SAMPLES;
        }
        const d = JSON.parse(raw);
        return Array.isArray(d) ? d : [];
      } catch (e) {
        return DEFAULT_VOCAB_SAMPLES;
      }
    }
    function setVocab(list) {
      try {
        const merged = mergeDuplicateVocab(list);
        localStorage.setItem(VOCAB_KEY, JSON.stringify(merged));
        if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncVocabDebounced === 'function') {
          window.FSS_SUPABASE.syncVocabDebounced(merged);
        }
        return true;
      } catch (e) { return false; }
    }
    function updateVocabBadges() {
      const n = getVocab().length;
      document.querySelectorAll('.vocab-count-badge').forEach((el) => { el.textContent = n; el.style.display = n ? '' : 'none'; });
      updateVocabMissingBadge();
      updateReviewBadges();
    }

    // Tự động đồng bộ bản dịch câu cho các từ vựng đã lưu thuộc video vid từ danh sách sentences sents
    function syncVocabSentenceTranslations(vid, sents) {
      if (!vid || !Array.isArray(sents) || !sents.length) return false;
      const all = getVocab();
      let changed = false;
      all.forEach((item) => {
        if (item.videoId !== vid) return;
        if (!item.vi || !String(item.vi).trim()) {
          let matched = null;
          if (typeof item.t === 'number') {
            matched = sents.find(s => Math.abs((s.startTime || 0) - item.t) < 1.5 && s.vi && String(s.vi).trim());
          }
          if (!matched && item.en) {
            const normEn = String(item.en).trim().toLowerCase();
            matched = sents.find(s => String(s.text || '').trim().toLowerCase() === normEn && s.vi && String(s.vi).trim());
          }
          if (matched && matched.vi && String(matched.vi).trim()) {
            item.vi = String(matched.vi).trim();
            changed = true;
          }
        }
        if (Array.isArray(item.contexts)) {
          item.contexts.forEach((ctx) => {
            if (ctx.videoId === vid && (!ctx.vi || !String(ctx.vi).trim())) {
              let matched = null;
              if (typeof ctx.t === 'number') {
                matched = sents.find(s => Math.abs((s.startTime || 0) - ctx.t) < 1.5 && s.vi && String(s.vi).trim());
              }
              if (!matched && ctx.en) {
                const normEn = String(ctx.en).trim().toLowerCase();
                matched = sents.find(s => String(s.text || '').trim().toLowerCase() === normEn && s.vi && String(s.vi).trim());
              }
              if (matched && matched.vi && String(matched.vi).trim()) {
                ctx.vi = String(matched.vi).trim();
                changed = true;
              }
            }
          });
        }
      });
      if (changed) {
        setVocab(all);
        return true;
      }
      return false;
    }

    // Tự động kiểm tra và bù đắp bản dịch câu trích dẫn từ Lịch sử video cho toàn bộ sổ từ vựng
    function syncAllVocabFromLocalHistory() {
      try {
        const all = getVocab();
        const hist = typeof getLocalHistory === 'function' ? getLocalHistory() : [];
        if (!all.length || !hist || !hist.length) return false;
        let changed = false;
        all.forEach((item) => {
          if (!item.videoId || (item.vi && String(item.vi).trim())) return;
          const h = hist.find((v) => v.videoId === item.videoId && Array.isArray(v.sentences) && v.sentences.length);
          if (!h) return;
          let matched = null;
          if (typeof item.t === 'number') {
            matched = h.sentences.find(s => Math.abs((s.startTime || 0) - item.t) < 1.5 && s.vi && String(s.vi).trim());
          }
          if (!matched && item.en) {
            const normEn = String(item.en).trim().toLowerCase();
            matched = h.sentences.find(s => String(s.text || '').trim().toLowerCase() === normEn && s.vi && String(s.vi).trim());
          }
          if (matched && matched.vi && String(matched.vi).trim()) {
            item.vi = String(matched.vi).trim();
            changed = true;
          }
        });
        if (changed) {
          setVocab(all);
          return true;
        }
      } catch (e) {}
      return false;
    }

    // ==================== ÔN TẬP TỪ VỰNG THEO SPACED REPETITION (thuật toán kiểu SM-2) ====================
    // Mỗi mục từ vựng có thêm x.srs = { ease, interval (ngày), reps, due (mốc thời gian ms), lastReview }.
    // Mục chưa từng ôn (không có x.srs) coi như "đến hạn ngay" để được đưa vào hàng đợi ôn tập đầu tiên.
    function srsDefault() { return { ease: 2.5, interval: 0, reps: 0, due: 0, lastReview: null }; }
    function getSrs(item) { return Object.assign(srsDefault(), item && item.srs ? item.srs : {}); }
    function srsIsDue(item, now) { return getSrs(item).due <= now; }
    // scopeKey: 'all' (hoặc bỏ trống) = mọi từ; còn lại = khoá nguồn (video/bài viết/sách) lấy từ vocabSourceInfo()
    function vocabInScope(scopeKey) {
      const all = getVocab();
      if (!scopeKey || scopeKey === 'all') return all;
      return all.filter((x) => {
        if (vocabSourceInfo(x).key === scopeKey) return true;
        if (Array.isArray(x.contexts) && x.contexts.some(c => vocabSourceInfo(c).key === scopeKey)) return true;
        return false;
      });
    }
    function srsDueList(scopeKey) {
      const now = Date.now();
      return vocabInScope(scopeKey).filter((x) => srsIsDue(x, now))
        .sort((a, b) => (getSrs(a).due - getSrs(b).due) || (a.createdAt - b.createdAt));
    }
    function srsDueCount(scopeKey) { return srsDueList(scopeKey).length; }
    function updateReviewBadges() {
      // Nút "Ôn tập" trong trang Từ vựng đếm theo bài đang lọc; hai huy hiệu ở nơi khác đếm toàn bộ.
      const nAll = srsDueCount();
      const nScoped = vocabSource && vocabSource !== 'all' ? srsDueCount(vocabSource) : nAll;
      [['vocab-due-badge-1', nScoped], ['vocab-due-badge-2', nAll], ['vocab-due-badge-3', nAll]].forEach(([id, n]) => {
        const el = document.getElementById(id);
        if (el) { el.textContent = n; el.style.display = n ? '' : 'none'; }
      });
    }
    // Tính trạng thái SRS mới theo mức tự đánh giá, KHÔNG làm thay đổi dữ liệu gốc (dùng để xem trước khoảng cách lặp lại).
    function srsCompute(s, rating) {
      let { ease, interval, reps } = s;
      if (rating === 'again') {
        reps = 0;
        ease = Math.max(1.3, ease - 0.2);
        return { ease, interval: 0, reps, due: Date.now() + 10 * 60 * 1000, lastReview: Date.now() };
      }
      if (rating === 'hard') {
        interval = interval > 0 ? Math.max(1, Math.round(interval * 1.2)) : 1;
        ease = Math.max(1.3, ease - 0.15);
      } else if (rating === 'good') {
        if (reps === 0) interval = 1;
        else if (reps === 1) interval = 3;
        else interval = Math.max(1, Math.round(interval * ease));
      } else if (rating === 'easy') {
        interval = reps === 0 ? 4 : Math.max(1, Math.round(interval * ease * 1.3));
        ease = Math.min(2.8, ease + 0.15);
      }
      reps += 1;
      return { ease, interval, reps, due: Date.now() + interval * 24 * 60 * 60 * 1000, lastReview: Date.now() };
    }
    function srsFormatDelta(ms) {
      const mins = Math.round(ms / 60000);
      if (mins < 60) return `${Math.max(1, mins)} phút`;
      const days = Math.round(ms / 86400000);
      return days <= 1 ? '1 ngày' : `${days} ngày`;
    }

    // Điều hướng sang Flashcard 3D trong Trung tâm Luyện tập (thay thế modal ôn tập cũ)
    function openReviewScreen(scopeKey) {
      const scope = (typeof scopeKey === 'string' && scopeKey && scopeKey !== 'all') ? scopeKey : 'all';
      if (typeof window.openVocabPracticeHub === 'function') {
        window.openVocabPracticeHub(scope, 'all', 'flashcard');
      }
    }
    function closeReviewScreen() {
      if (typeof window.VocabPracticeHub?.close === 'function') {
        window.VocabPracticeHub.close();
      }
    }
    // itemId (tuỳ chọn): id của mục từ vựng vừa lưu -> hiện thêm nút "Thêm nghĩa" / "Sửa nghĩa" để nhập nghĩa ngay tại chỗ.
    let toastEditId = null;
    function showVocabToast(msg, withLink, itemId, canDelete) {
      const el = document.getElementById('vocab-toast');
      if (!el) return;
      commitToastMeaning();
      toastEditId = null;
      el.classList.remove('editing');
      let actions = '';
      if (itemId) {
        const it = getVocab().find((v) => v.id === itemId);
        if (it) actions += `<button type="button" onclick="startToastMeaning('${itemId}')">${it.wordVi ? 'Sửa nghĩa' : 'Thêm nghĩa'}</button>`;
        if (it && vocabAiToastWanted(it)) actions += `<button type="button" onclick="openVocabMeaningModal()" title="Nhờ AI điền nghĩa + 3 ví dụ cho tất cả các từ chưa có">✨ Điền nghĩa AI</button>`;
      }
      if (withLink) actions += `<button type="button" onclick="openVocabScreen('lesson')" title="Xem từ vựng đã lưu của bài học này">Xem danh sách</button>`;   // 'lesson': lọc sẵn theo video / bài đang học
      if (itemId && canDelete) actions += `<button type="button" class="vt-remove" onclick="deleteSavedFromToast('${itemId}')" title="Bỏ từ vừa lưu (dùng khi lỡ bấm Lưu)">Xóa</button>`;
      el.innerHTML = `<span class="vt-msg">${escHtml(msg)}</span>` + (actions ? `<div class="vt-actions">${actions}</div>` : '');
      el.classList.add('show');
      clearTimeout(vocabToastTimer);
      vocabToastTimer = setTimeout(() => el.classList.remove('show'), itemId ? 6000 : 3500);
    }

    // Biến popup thành ô nhập "nghĩa riêng" của từ/cụm vừa lưu (dùng chung dữ liệu wordVi với trang Từ vựng đã lưu)
    function startToastMeaning(id) {
      const el = document.getElementById('vocab-toast');
      const item = getVocab().find((v) => v.id === id);
      if (!el || !item) return;
      toastEditId = id;
      clearTimeout(vocabToastTimer);
      const short = item.text.length > 28 ? item.text.slice(0, 28) + '…' : item.text;
      el.classList.add('editing');
      el.innerHTML = `<span class="vt-word" title="${escHtml(item.text)}">“${escHtml(short)}”</span>`
        + `<input id="vt-wordvi-input" class="vt-input" type="text" autocomplete="off" value="${escHtml(item.wordVi || '')}" placeholder="Nghĩa tiếng Việt của từ/cụm này..."`
        + ` onkeydown="if(event.key==='Enter'){event.preventDefault();saveToastMeaning();}else if(event.key==='Escape'){event.preventDefault();cancelToastMeaning();}" />`
        + `<button type="button" onclick="saveToastMeaning()">Lưu</button>`
        + `<button type="button" class="vt-ghost" onclick="cancelToastMeaning()">Huỷ</button>`;
      el.classList.add('show');
      requestAnimationFrame(() => {
        const inp = document.getElementById('vt-wordvi-input');
        if (inp) { inp.focus(); inp.select(); }
      });
    }
    function saveToastMeaning() {
      const inp = document.getElementById('vt-wordvi-input');
      const id = toastEditId;
      if (!inp || !id) return;
      const val = inp.value.trim();
      const all = getVocab();
      const item = all.find((v) => v.id === id);
      toastEditId = null;
      if (!item) { cancelToastMeaning(); return; }
      if (val) item.wordVi = val; else delete item.wordVi;
      if (!setVocab(all)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      const shown = val.length > 40 ? val.slice(0, 40) + '…' : val;
      showVocabToast(val ? `Đã lưu nghĩa: ${shown}` : 'Đã xoá nghĩa của từ này', true);
    }
    function cancelToastMeaning() {
      const el = document.getElementById('vocab-toast');
      toastEditId = null;
      if (!el) return;
      el.classList.remove('show');
      setTimeout(() => { if (!el.classList.contains('show')) el.classList.remove('editing'); }, 250);
    }
    // Nếu popup đang mở ô nhập mà bị thay bằng thông báo khác, giữ lại phần nghĩa đã gõ thay vì làm mất
    function commitToastMeaning() {
      const inp = document.getElementById('vt-wordvi-input');
      if (!toastEditId || !inp) return;
      const val = inp.value.trim();
      if (!val) return;
      const all = getVocab();
      const item = all.find((v) => v.id === toastEditId);
      if (item) { item.wordVi = val; setVocab(all); }
    }

    // Dựng mục từ vựng từ vùng đang bôi đen: lấy các CÂU chứa vùng đó làm ngữ cảnh + vị trí từ cần tô sáng.
    function buildVocabItem(range, selText) {
      const container = activeSubContainer();
      const overlaps = (el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return range.compareBoundaryPoints(Range.END_TO_START, r) < 0 && range.compareBoundaryPoints(Range.START_TO_END, r) > 0;
      };
      const hit = container ? Array.from(container.querySelectorAll('.sub-word-unit')).filter(overlaps) : [];
      let en = '', hs = 0, he = 0, vi = '', t = 0, prevIdx = -1;

      if (hit.length) {
        const hitSet = new Set(hit);
        const lines = [];
        hit.forEach((sp) => { const ln = sp.closest('.sentence-text-line'); if (ln && !lines.includes(ln)) lines.push(ln); });
        let first = -1, last = -1;
        const vis = [];
        lines.forEach((ln) => {
          const s = sentences.find((x) => String(x.id) === ln.getAttribute('data-id'));
          if (s && s.vi && s.vi.trim()) vis.push(s.vi.trim());
          ln.querySelectorAll('.sub-word-unit').forEach((sp) => {
            if (en) en += ' ';
            const st = en.length;
            en += sp.textContent;
            if (hitSet.has(sp)) { if (first < 0) first = st; last = en.length; }
          });
        });
        hs = first; he = last; vi = vis.join(' ');
        prevIdx = sentences.findIndex((x) => String(x.id) === lines[0].getAttribute('data-id')) - 1;
        t = parseFloat(hit[0].getAttribute('data-start')) || 0;
      } else {
        const low = selText.toLowerCase();
        let pvS = window.pvActiveSentence ? window.pvActiveSentence() : null;   // giao diện Shadowing: luôn lấy đúng câu đang luyện
        try {   // bôi đen ở phụ đề đè lên video: lấy đúng câu đang hiển thị trên video
          ['vid-en', 'cs-text'].forEach((id) => {
            const vEn = document.getElementById(id);
            if (!pvS && vEn && range && vEn.contains(range.startContainer)) pvS = sentences[parseInt(vEn.getAttribute('data-idx'), 10)] || null;
          });
        } catch (e) {}
        const s = pvS || sentences.find((x) => x.text.toLowerCase().includes(low)) || sentences[currentSentenceIndex];
        if (!s) return null;
        en = s.text.trim();
        prevIdx = sentences.indexOf(s) - 1;
        let low2 = low, idx = en.toLowerCase().indexOf(low2);
        if (idx < 0) { low2 = low.replace(/\s+([,.;:!?)\]\u201d\u2019])/g, '$1').replace(/([(\[\u201c\u2018])\s+/g, '$1'); idx = en.toLowerCase().indexOf(low2); }
        if (idx >= 0) { hs = idx; he = idx + low2.length; } else { hs = 0; he = en.length; }
        vi = (s.vi || '').trim();
        t = s.startTime || 0;
      }

      // Bỏ dấu câu thừa ở hai đầu phần được tô sáng
      const seg = en.slice(hs, he);
      hs += seg.match(/^[^\p{L}\p{N}]*/u)[0].length;
      he -= seg.match(/[^\p{L}\p{N}]*$/u)[0].length;
      if (he <= hs) return null;
      const text = en.slice(hs, he).trim();
      const n = text.split(/\s+/).length;
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'),
        en, hs, he, vi,
        prev: (prevIdx >= 0 && sentences[prevIdx]) ? String(sentences[prevIdx].text || '').trim() : '',   // câu đứng ngay trước (làm ngữ cảnh cho AI)
        videoId: currentVideoId, videoTitle: currentVideoTitle || '', t, createdAt: Date.now(),
        bookId: (bkActive() && bkBook) ? bkBook.id : undefined, ch: (bkActive() && bkBook) ? bkCh : undefined
      };
    }

    function saveSelectionToVocab(keepPopup) {
      if (!selectedRangeForLoop || !selectedTextForLookup) return;
      const fromVocabArea = !!vocabAreaCtx;
      const item = vocabAreaCtx ? buildVocabItemFromArea(vocabAreaCtx) : buildVocabItem(selectedRangeForLoop, selectedTextForLookup);
      // Shift + click "Lưu": vẫn lưu nhưng giữ nguyên 3 pop-up + vùng bôi đen để còn bấm "Tra nghĩa" / "Loop" tiếp
      if (!keepPopup) {
        hideLookupTooltip();
        window.getSelection()?.removeAllRanges();
      }
      if (!item) return;
      const short = item.text.length > 40 ? item.text.slice(0, 40) + '…' : item.text;
      const list = getVocab();
      const normText = String(item.text || '').trim().toLowerCase();

      // (1) Trùng chính xác ở cùng đoạn trong video này:
      const exactDup = list.find((x) => x.videoId === item.videoId && String(x.text || '').trim().toLowerCase() === normText && Math.abs((x.t || 0) - (item.t || 0)) < 2);
      if (exactDup) { showVocabToast(`“${short}” đã được lưu ở đoạn này rồi`, true, exactDup.id); return; }

      // (2) Trùng từ đã lưu từ video/bài học khác -> Hợp nhất ngữ cảnh:
      const crossDup = list.find((x) => String(x.text || '').trim().toLowerCase() === normText);
      if (crossDup) {
        if (!Array.isArray(crossDup.contexts)) crossDup.contexts = [];
        const isAlreadyInContexts = crossDup.contexts.some(c => c.videoId === item.videoId && Math.abs((c.t || 0) - (item.t || 0)) < 2);
        if (!isAlreadyInContexts && (crossDup.videoId !== item.videoId || Math.abs((crossDup.t || 0) - (item.t || 0)) >= 2)) {
          crossDup.contexts.push({
            videoId: item.videoId || '',
            videoTitle: item.videoTitle || '',
            bookId: item.bookId || '',
            en: item.en || '',
            vi: item.vi || '',
            hs: item.hs || 0,
            he: item.he || 0,
            t: item.t || 0,
            createdAt: Date.now()
          });
        }
        if (!crossDup.wordVi && item.wordVi) crossDup.wordVi = item.wordVi;
        if ((!crossDup.examples || !crossDup.examples.length) && (item.examples && item.examples.length)) crossDup.examples = item.examples;
        setVocab(list);
        updateVocabBadges();
        if (bkActive()) bkMarkSaved();
        if (fromVocabArea) {
          const vscr = document.getElementById('screen-vocab');
          if (vscr && !vscr.classList.contains('hidden')) { renderVocabPageKeepScroll(); hideLookupTooltip(); }
        }
        const srcTitle = crossDup.videoTitle ? ` (bài: ${crossDup.videoTitle})` : '';
        showVocabToast(`“${short}” đã có trong sổ từ vựng${srcTitle}. Đã bổ sung ngữ cảnh bài này!`, true, crossDup.id, true);
        return;
      }

      list.unshift(item);
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      updateVocabBadges();
      if (bkActive()) bkMarkSaved();
      if (fromVocabArea) {
        // Đang ở màn "Từ vựng đã lưu": vẽ lại danh sách để thấy mục mới (vùng bôi đen sẽ mất nên ẩn luôn popup)
        const vscr = document.getElementById('screen-vocab');
        if (vscr && !vscr.classList.contains('hidden')) { renderVocabPageKeepScroll(); hideLookupTooltip(); }
      }
      showVocabToast(`Đã lưu “${short}”`, true, item.id, true);
    }
    // Nút "Xóa" trên popup vừa lưu: bỏ từ vừa lưu nhầm (cập nhật luôn số đếm, gạch chân / highlight từ đã lưu và trang Từ vựng nếu đang mở)
    function deleteSavedFromToast(id) {
      const all = getVocab();
      const it = all.find((v) => v.id === id);
      if (!it) { showVocabToast('Từ này không còn trong danh sách', false); return; }
      if (!setVocab(all.filter((v) => v.id !== id))) { showVocabToast('Không xóa được: bộ nhớ trình duyệt bị lỗi', false); return; }
      updateVocabBadges();
      try { if (bkActive()) bkMarkSaved(); } catch (e) {}
      const vscr = document.getElementById('screen-vocab');
      if (vscr && !vscr.classList.contains('hidden')) renderVocabPageKeepScroll();
      const short = it.text.length > 40 ? it.text.slice(0, 40) + '…' : it.text;
      showVocabToast(`Đã xóa “${short}”`, false);
    }
    document.getElementById('btn-save-action').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      saveSelectionToVocab(e.shiftKey);
    });

    // scope === 'lesson' (nút "Từ vựng" trong giao diện luyện tập): lọc sẵn theo bài đang học (video / bài viết); bài chưa có từ nào thì hiện "Tất cả bài học"
    function openVocabScreen(scope) {
      const practice = document.getElementById('screen-practice');
      const fromPractice = !practice.classList.contains('hidden');
      const bookScr = document.getElementById('screen-book');
      const fromBook = !!bookScr && !bookScr.classList.contains('hidden');
      if (fromBook) { bkSavePosNow(); bookScr.classList.add('hidden'); document.body.classList.remove('book-mode'); }
      vocabReturnTo = fromBook ? 'book' : (fromPractice ? 'practice' : 'input');
      if (fromPractice) { try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {} }
      else { vocabHomeScrollY = window.scrollY; }
      hideLookupTooltip();
      document.getElementById('screen-input').classList.add('hidden');
      practice.classList.add('hidden');
      document.getElementById('screen-vocab').classList.remove('hidden');
      vocabSource = 'all';
      const lessonScope = scope === 'lesson' && fromPractice && !!currentVideoId;
      if (lessonScope) { vocabSource = vocabSourceInfo({ videoId: currentVideoId }).key; vocabScrollY = 0; }
      syncAllVocabFromLocalHistory();
      renderVocabPage();
      // Khởi tạo sớm player ngầm để bấm "Audio video" phát ngay lập tức
      if (typeof window.ensureBgAudioPlayer === 'function') {
        window.ensureBgAudioPlayer();
      }
      // Khôi phục vị trí cuộn lần trước (chỉ nhớ trong phiên này; tải lại trang thì về đầu)
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: vocabScrollY, behavior: 'auto' })));
    }
    function closeVocabScreen() {
      vocabScrollY = window.scrollY;
      document.getElementById('screen-vocab').classList.add('hidden');
      if (vocabReturnTo === 'book' && bkBook && bkChs.length) {
        document.getElementById('screen-book').classList.remove('hidden');
        document.body.classList.add('book-mode');
        bkMarkSaved();
        const sc = bkScrollEl(); if (sc) sc.focus({ preventScroll: true });
        return;
      }
      if (vocabReturnTo === 'practice') {
        document.getElementById('screen-practice').classList.remove('hidden');
      } else {
        document.getElementById('screen-input').classList.remove('hidden');
        requestAnimationFrame(() => window.scrollTo({ top: vocabHomeScrollY, behavior: 'auto' }));
      }
      ensurePageFocus();
    }



    // ==================== TRANG HƯỚNG DẪN CÀI EXTENSION ====================
    let guideHomeScrollY = 0;
    const guideVisible = () => { const d = document.getElementById('screen-guide'); return !!d && !d.classList.contains('hidden'); };
    function loadGuideImages() {
      document.querySelectorAll('#screen-guide img[data-src]').forEach((im) => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
    }
    function openGuideScreen() {
      loadGuideImages();
      guideHomeScrollY = window.scrollY;
      if (typeof hideLookupTooltip === 'function') hideLookupTooltip();
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-guide').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    function closeGuideScreen() {
      closeGuideLightbox();
      document.getElementById('screen-guide').classList.add('hidden');
      document.getElementById('screen-input').classList.remove('hidden');
      requestAnimationFrame(() => window.scrollTo({ top: guideHomeScrollY, behavior: 'auto' }));
    }
    function fitGuideLightbox() {
      const im = document.getElementById('gd-lightbox-img');
      const nw = im.naturalWidth, nh = im.naturalHeight;
      if (!nw || !nh) return;
      // Phóng ảnh vừa khít khung nhìn (tối đa 3 lần để không quá mờ)
      const k = Math.min(3, (window.innerWidth * 0.94) / nw, (window.innerHeight * 0.82) / nh);
      im.style.width = Math.round(nw * k) + 'px';
      im.style.height = Math.round(nh * k) + 'px';
    }
    function openGuideLightbox(btn) {
      if (btn.classList.contains('gd-missing')) return;
      const src = btn.querySelector('img'), im = document.getElementById('gd-lightbox-img');
      im.onload = fitGuideLightbox;
      im.alt = src.alt;
      im.src = src.currentSrc || src.src;
      document.getElementById('gd-lightbox').classList.add('show');
      if (im.complete) fitGuideLightbox();
    }
    function closeGuideLightbox() {
      const box = document.getElementById('gd-lightbox');
      if (box) box.classList.remove('show');
    }
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('#screen-guide .gd-shot').forEach((b) => b.addEventListener('click', () => openGuideLightbox(b)));
      document.getElementById('gd-lightbox').addEventListener('click', closeGuideLightbox);
    });
    window.addEventListener('resize', () => { if (document.getElementById('gd-lightbox').classList.contains('show')) fitGuideLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !guideVisible()) return;
      const lb = document.getElementById('gd-lightbox');
      if (lb && lb.classList.contains('show')) closeGuideLightbox(); else closeGuideScreen();
    });




    // Mở video của từ vựng ngay trong app, tua tới đúng câu chứa từ đó.
    async function openVocabVideo(id) {
      const x = getVocab().find((v) => v.id === id);
      if (!x || !x.videoId) return;
      if (x.bookId) { vocabScrollY = window.scrollY; await bkOpenFromVocab(x); return; }
      vocabScrollY = window.scrollY;
      const goPractice = () => {
        document.getElementById('screen-vocab').classList.add('hidden');
        document.getElementById('screen-input').classList.add('hidden');
        document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();
        ensurePageFocus();
      };
      const sentStart = () => {
        const s = sentences[getSentenceIndexForTime(x.t || 0)];
        return Math.max(0, s ? s.startTime : (x.t || 0));
      };

      // (a0) Bài văn bản đang mở sẵn -> chỉ cần quay lại và cuộn tới đúng câu
      if (isTextMode && currentVideoId === x.videoId && sentences.length) {
        goPractice();
        triggerSmoothCenterScroll(getSentenceIndexForTime(x.t || 0), true);
        return;
      }
      // (a) Video đang mở sẵn trong player -> chỉ cần quay lại và tua
      if (!isTextMode && currentVideoId === x.videoId && sentences.length && ytPlayer && isPlayerReady) {
        goPractice();
        seekToTime(sentStart(), undefined, true, null, true);
        return;
      }
      // (b) Có trong lịch sử luyện tập (đã lưu sẵn phụ đề)
      if (getLocalHistory().some((h) => h.videoId === x.videoId && h.sentences && h.sentences.length)) {
        const item = getLocalHistory().find((h) => h.videoId === x.videoId);
        pendingSeekTime = (() => { const s = item.sentences.slice().reverse().find((z) => z.startTime <= (x.t || 0) + 0.05); return s ? s.startTime : (x.t || 0); })();
        loadFromHistory(x.videoId);
        return;
      }
      // (c) Video thuộc thư viện có sẵn -> nạp phụ đề từ thư viện
      pendingSeekTime = Math.max(0, (x.t || 0) - 0.3);
      const ok = await selectCategoryVideo(x.videoId, x.videoTitle);
      if (ok) return;
      // (d) Không còn phụ đề -> đành mở YouTube
      pendingSeekTime = null;
      showVocabToast('App không còn phụ đề của video này nên mở tạm trên YouTube', false);
      window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(x.videoId)}&t=${Math.max(0, Math.floor((x.t || 0) - 2))}s`, '_blank');
    }


    // Tô sáng từ cần học trong câu ví dụ (khớp cả khi đã chia: plot -> plotting)
    function hlExample(en, term) {
      const t = String(term || '').trim();
      const low = en.toLowerCase();
      if (t.length >= 2) {
        const cands = [t.toLowerCase()];
        const stem = t.toLowerCase().replace(/(e|y)$/, '');
        if (stem.length >= 3 && stem !== cands[0]) cands.push(stem);
        for (const c of cands) {
          let from = 0, idx;
          while ((idx = low.indexOf(c, from)) >= 0) {
            if (idx === 0 || !/[\p{L}]/u.test(low[idx - 1])) {
              let end = idx + c.length;
              if (c.indexOf(' ') < 0) while (end < low.length && /[\p{L}']/u.test(low[end])) end++;
              return escHtml(en.slice(0, idx)) + '<mark>' + escHtml(en.slice(idx, end)) + '</mark>' + escHtml(en.slice(end));
            }
            from = idx + 1;
          }
        }
      }
      return escHtml(en);
    }
    let vocabOpenExamples = new Set();   // các thẻ đang mở phần "ví dụ" (giữ nguyên khi vẽ lại danh sách)
    function vocabExamplesHtml(x) {
      const ex = Array.isArray(x.examples) ? x.examples.filter((e) => e && e.en) : [];
      if (!ex.length) return '';
      const open = vocabOpenExamples.has(x.id);
      const items = ex.map((e) => `<div><p class="vocab-ex-en">${hlExample(String(e.en), x.text)}</p>${e.vi ? `<p class="vocab-ex-vi">${escHtml(e.vi)}</p>` : ''}</div>`).join('');
      return `<button type="button" class="vocab-more-btn" id="vex-btn-${x.id}" onclick="toggleVocabExamples('${x.id}')">${open ? 'Ẩn ví dụ' : `Xem thêm ví dụ (${ex.length})`}</button>
        <div class="vocab-examples" id="vex-${x.id}" ${open ? '' : 'hidden'}>${items}</div>`;
    }
    function toggleVocabExamples(id) {
      const box = document.getElementById('vex-' + id), btn = document.getElementById('vex-btn-' + id);
      if (!box || !btn) return;
      const open = box.hasAttribute('hidden');
      if (open) { box.removeAttribute('hidden'); vocabOpenExamples.add(id); } else { box.setAttribute('hidden', ''); vocabOpenExamples.delete(id); }
      const n = box.children.length;
      btn.textContent = open ? 'Ẩn ví dụ' : `Xem thêm ví dụ (${n})`;
    }

    function maskGrammarTag(text) {
      if (!text) return '';
      return String(text).replace(/\[v\.\s*([^·\]]+)\s*·\s*([^\]]+)\]/gi, (match, root, rest) => {
        return `[v. ${rest.trim()}]`;
      });
    }

    function formatGrammarBadgeHtml(text, options = {}) {
      if (!text) return '';
      let str = String(text);
      if (options.mask) {
        str = maskGrammarTag(str);
      }
      return str.replace(/\[(v\.[^\]]*|n\.m\.|n\.f\.|n\.pl\.|n\.m\.\/f\.|adj\.|adv\.|loc\.[^\]]*|prep\.|conj\.)\]/gi, (match, tag) => {
        let colorClass = 'vph-badge-default';
        const t = tag.toLowerCase().trim();
        if (t.startsWith('v.')) colorClass = 'vph-badge-verb';
        else if (t === 'n.m.') colorClass = 'vph-badge-nm';
        else if (t === 'n.f.') colorClass = 'vph-badge-nf';
        else if (t.startsWith('adj') || t.startsWith('adv')) colorClass = 'vph-badge-adj';
        else if (t.startsWith('loc')) colorClass = 'vph-badge-loc';
        return `<span class="vph-grammar-badge ${colorClass}" title="${escHtml(match)}">${escHtml(match)}</span>`;
      });
    }
    window.formatGrammarBadgeHtml = formatGrammarBadgeHtml;
    window.maskGrammarTag = maskGrammarTag;

    function vocabCardHtml(x) {
      const KIND = { word: 'Từ', phrase: 'Cụm từ', sentence: 'Câu' };
      const ctx = x.he > x.hs
        ? escHtml(x.en.slice(0, x.hs)) + '<mark class="vocab-hl">' + escHtml(x.en.slice(x.hs, x.he)) + '</mark>' + escHtml(x.en.slice(x.he))
        : escHtml(x.en);
      const yt = x.videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(x.videoId)}&t=${Math.max(0, Math.floor((x.t || 0) - 2))}s` : '';
      const src = x.bookId ? `<a href="#" title="Mở lại đúng câu này trong sách" onclick="openVocabVideo('${x.id}'); return false;">📖 ${escHtml(x.videoTitle || 'Sách')}</a>`
        : x.srcUrl ? `<a href="${escHtml(x.srcUrl)}" target="_blank" rel="noopener" title="Mở trang web gốc">🌐 ${escHtml(x.videoTitle || x.srcUrl)}</a>`
        : x.videoId ? `<a href="${yt}" title="Mở lại đúng câu này trong Shadowing Studio" onclick="openVocabVideo('${x.id}'); return false;">▶ ${escHtml(x.videoTitle || x.videoId)} · ${formatTime(x.t || 0)}</a>` : '<span></span>';

      let wordViBlock;
      if (vocabEditIds.has(x.id)) {
        wordViBlock = `<div class="vocab-wordvi-edit">
          <input id="wordvi-input-${x.id}" class="vocab-wordvi-input" type="text" value="${escHtml(x.wordVi || '')}" placeholder="Nghĩa riêng của từ/cụm này..."
            onkeydown="if(event.key==='Enter'){event.preventDefault();saveWordMeaning('${x.id}');}else if(event.key==='Escape'){cancelEditWordMeaning('${x.id}');}" />
          <button type="button" class="vocab-mini" onclick="saveWordMeaning('${x.id}')">Lưu</button>
          <button type="button" class="vocab-mini" onclick="cancelEditWordMeaning('${x.id}')">Huỷ</button>
        </div>${vocabAiHintId === x.id ? vocabAiHintHtml() : ''}`;
      } else {
        wordViBlock = `<div class="vocab-wordvi-row">
          ${x.wordVi ? `<p class="vocab-wordvi">${formatGrammarBadgeHtml(escHtml(x.wordVi))}</p>` : `<p class="vocab-wordvi-empty">Chưa có nghĩa riêng của từ này<button type="button" class="vocab-ai-link" onclick="openVocabMeaningModal('${x.id}')" title="Nhờ AI điền nghĩa + 3 ví dụ cho từ này">✨ Điền bằng AI</button></p>`}
          <button type="button" class="vocab-mini" onclick="startEditWordMeaning('${x.id}')">${x.wordVi ? 'Sửa nghĩa' : '+ Thêm nghĩa'}</button>
        </div>`;
      }

      const extraContexts = Array.isArray(x.contexts) && x.contexts.length > 0 ? x.contexts : [];
      let extraContextsHtml = '';
      if (extraContexts.length > 0) {
        extraContextsHtml = `
          <div class="vocab-multi-ctx-card">
            <details class="vocab-multi-ctx-details">
              <summary class="vocab-multi-ctx-summary">
                <span class="vocab-multi-ctx-badge">🔗 Xuất hiện ở ${extraContexts.length + 1} bài học</span>
                <span class="vocab-multi-ctx-hint">Xem ngữ cảnh khác ▾</span>
              </summary>
              <div class="vocab-multi-ctx-body">
                ${extraContexts.map((c) => {
                  const cYt = c.videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(c.videoId)}&t=${Math.max(0, Math.floor((c.t || 0) - 2))}s` : '';
                  const cSrc = c.bookId ? `📖 ${escHtml(c.videoTitle || 'Sách')}`
                    : c.videoId ? `<a href="${cYt}" target="_blank" rel="noopener">▶ ${escHtml(c.videoTitle || c.videoId)} · ${formatTime(c.t || 0)}</a>`
                    : '';
                  return `
                    <div class="vocab-ctx-item">
                      <p class="vocab-ctx-en">“${escHtml(c.en)}”</p>
                      ${c.vi ? `<p class="vocab-ctx-vi">${escHtml(c.vi)}</p>` : ''}
                      ${cSrc ? `<div class="vocab-ctx-src">${cSrc}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </details>
          </div>
        `;
      }

      return `<article class="vocab-card" data-vid="${escHtml(x.id)}">
        <div class="vocab-card-head">
          <div>
            <span class="vocab-kind vocab-kind-${x.kind}">${escHtml(x.tag || KIND[x.kind] || '')}</span>
            ${x.level ? `<span class="vocab-level-badge level-${escHtml(x.level.toLowerCase().replace('+', 'plus'))}">${escHtml(x.level)}</span>` : ''}
            <h3 class="vocab-word">${escHtml(x.text)}</h3>
          </div>
          <div class="vocab-card-tools">
            <button type="button" class="vocab-mini" onclick="playVocabWordAudio('${x.id}', event)" title="Nghe phát âm từ vựng">🗣️ Phát âm</button>
            ${(x.videoId && !x.bookId) ? `<button type="button" class="vocab-mini vocab-video-mini" onclick="playVocabVideoAudio('${x.id}', event)" title="Nghe âm thanh từ video gốc (không chiếu video)">🎧 Audio video</button>` : ''}
            <button type="button" class="vocab-mini" onclick="lookupVocab('${x.id}')">Tra nghĩa</button>
            <button type="button" class="vocab-mini del" title="Xoá" onclick="deleteVocab('${x.id}')">✕</button>
          </div>
        </div>
        <p class="vocab-ctx">${ctx}</p>
        ${extraContextsHtml}
        ${wordViBlock}
        ${x.vi ? `<p class="vocab-vi">Cả câu: ${escHtml(x.vi)}</p>` : `<p class="vocab-vi-empty">Chưa có bản dịch cả câu<button type="button" class="vocab-ai-link" onclick="openVocabMeaningModal('${x.id}')" title="Nhờ AI điền nghĩa và dịch câu này">✨ Điền bằng AI</button></p>`}
        ${vocabExamplesHtml(x)}
        <div class="vocab-src">${src}<span>${new Date(x.createdAt).toLocaleDateString('vi-VN')}</span></div>
      </article>`;
    }

    // ---------- Gợi ý dùng "Điền nghĩa (AI)" ----------
    // Bấm "+ Thêm nghĩa" ở trang Từ vựng đã lưu: hiện ô gợi ý ngay dưới ô nhập, tối đa 2 lần (mỗi lần bấm 1 lần hiện), chỉ khi còn từ 3 mục chưa có nghĩa trở lên.
    // Đã mở cửa sổ "Điền nghĩa (AI)" (từ bất kỳ nút nào) thì coi như người dùng đã biết -> không gợi ý nữa.
    const VOCAB_AI_HINT_KEY = 'shadowing_vocab_ai_hint_v1', VOCAB_AI_TOAST_KEY = 'shadowing_vocab_ai_toast_v1';
    const VOCAB_AI_HINT_MAX = 2, VOCAB_AI_HINT_MIN_MISSING = 3;
    const vocabAiMem = {};   // dự phòng khi trình duyệt chặn localStorage
    let vocabAiHintId = null;
    function vocabAiCountGet(key) {
      let n = 0;
      try { n = parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) {}
      return Math.max(n, vocabAiMem[key] || 0);
    }
    function vocabAiCountSet(key, n) {
      vocabAiMem[key] = n;
      try { localStorage.setItem(key, String(n)); } catch (e) {}
    }
    function vocabMissingMeaningCount() {
      return getVocab().filter((x) => !x.wordVi || !String(x.wordVi).trim()).length;
    }
    function vocabAiHintHtml() {
      const n = vocabMissingMeaningCount();
      return `<div class="vocab-ai-hint" id="vocab-ai-hint">
          <div class="vah-text">💡 <b>Không cần tự gõ nghĩa từng từ.</b> Bạn có <b>${n} mục</b> chưa có nghĩa. AI có thể điền nghĩa và 3 ví dụ cho tất cả chỉ trong khoảng 1 phút: copy prompt → dán vào ChatGPT/Claude → dán câu trả lời lại.</div>
          <div class="vah-actions">
            <button type="button" class="vah-primary" onclick="openVocabMeaningModal()">Điền nghĩa bằng AI</button>
            <button type="button" class="vah-ghost" onclick="vocabAiHintDismiss()">Tự gõ, không cần</button>
          </div>
        </div>`;
    }
    function vocabAiHintMaybeShow(id) {
      vocabAiHintId = null;
      const it = getVocab().find((v) => v.id === id);
      if (!it || (it.wordVi && String(it.wordVi).trim())) return;   // "Sửa nghĩa": họ đã biết cách điền rồi
      const shown = vocabAiCountGet(VOCAB_AI_HINT_KEY);
      if (shown >= VOCAB_AI_HINT_MAX) return;
      if (vocabMissingMeaningCount() < VOCAB_AI_HINT_MIN_MISSING) return;   // chỉ thiếu 1-2 từ thì tự gõ nhanh hơn, không làm phiền
      vocabAiHintId = id;
      vocabAiCountSet(VOCAB_AI_HINT_KEY, shown + 1);
    }
    function vocabAiHintDismiss() {   // chỉ ẩn ô gợi ý của lần này (không vẽ lại trang để khỏi mất chữ đang gõ)
      vocabAiHintId = null;
      const el = document.getElementById('vocab-ai-hint');
      if (el) el.remove();
    }
    function vocabAiHintDone() {   // đã mở cửa sổ "Điền nghĩa (AI)" -> người dùng đã biết nút này
      vocabAiCountSet(VOCAB_AI_HINT_KEY, VOCAB_AI_HINT_MAX);
      vocabAiCountSet(VOCAB_AI_TOAST_KEY, VOCAB_AI_HINT_MAX);
      vocabAiHintDismiss();
    }
    // Thông báo sau khi lưu từ ở phụ đề: thêm nút "Điền nghĩa AI" (tối đa 2 lần, chỉ khi từ vừa lưu chưa có nghĩa và còn ≥ 3 mục chưa có nghĩa)
    function vocabAiToastWanted(item) {
      if (!item || (item.wordVi && String(item.wordVi).trim())) return false;
      const shown = vocabAiCountGet(VOCAB_AI_TOAST_KEY);
      if (shown >= VOCAB_AI_HINT_MAX || vocabMissingMeaningCount() < VOCAB_AI_HINT_MIN_MISSING) return false;
      vocabAiCountSet(VOCAB_AI_TOAST_KEY, shown + 1);
      return true;
    }

    // ---------- (A) Sửa/thêm nghĩa riêng của 1 từ ----------
    function startEditWordMeaning(id) {
      vocabEditIds.add(id);
      vocabAiHintMaybeShow(id);
      renderVocabPage();
      requestAnimationFrame(() => {
        const el = document.getElementById(`wordvi-input-${id}`);
        if (el) { el.focus(); el.select(); }
      });
    }
    function cancelEditWordMeaning(id) {
      if (vocabAiHintId === id) vocabAiHintId = null;
      vocabEditIds.delete(id);
      renderVocabPage();
    }
    function saveWordMeaning(id) {
      const el = document.getElementById(`wordvi-input-${id}`);
      const val = el ? el.value.trim() : '';
      const all = getVocab();
      const item = all.find((v) => v.id === id);
      if (item) {
        if (val) item.wordVi = val; else delete item.wordVi;
        setVocab(all);
      }
      if (vocabAiHintId === id) vocabAiHintId = null;
      vocabEditIds.delete(id);
      renderVocabPage();
    }

    // ---------- (B) Điền nghĩa hàng loạt bằng AI (copy prompt / dán câu trả lời) ----------
    // Mục cần AI điền: chưa có nghĩa riêng, hoặc (từ/cụm) chưa có ví dụ
    function vocabItemsMissingMeaning() {
      return getVocab().filter((x) => !x.wordVi || !String(x.wordVi).trim()
        || (!x.vi || !String(x.vi).trim())
        || (x.kind !== 'sentence' && !(Array.isArray(x.examples) && x.examples.length)));
    }
    const VOCAB_AI_BATCH = 30;   // mỗi lượt tối đa 30 mục để AI không bị cắt giữa chừng

    function parseCefrLevel(str) {
      if (!str) return '';
      const m = String(str).trim().match(/^(A1|A2\+?|B1|B2|C1|C2)$/i);
      return m ? m[1].toUpperCase() : '';
    }

    // ---- Đọc câu trả lời của AI (dùng chung cho "Điền nghĩa" và "Từ vựng khó") ----
    // Rất dễ tính: bỏ markdown (**, `, >, gạch đầu dòng), chấp nhận "VD1:", "Ví dụ 1:", "Example 1:",
    // ngăn cách câu Anh / Việt bằng "||" (hoặc " | ", "→"). Dòng nào không hiểu thì bỏ qua chứ không báo lỗi cả bài.
    function aiParseVocabAnswer(raw) {
      const out = [];
      let cur = null;
      const unq = (t) => { t = String(t || '').trim(); return (t.length > 2 && /^[“"‘'«]/.test(t) && /[”"’'»]$/.test(t)) ? t.slice(1, -1).trim() : t; };
      // Chuẩn hoá trước khi đọc: (1) bỏ dấu \ do markdown escape ("1\." -> "1.");
      // (2) nếu AI/trình duyệt làm mất xuống dòng (cả mục dính thành 1 đoạn) thì tách lại trước "VD1:", "Trong bài:" và "N. từ || loại ||".
      const KINDS = 'từ|phrasal verb|idiom|slang|cụm từ';
      const norm = String(raw || '')
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/\\([\\.\)\(\-*_`#>\[\]!:|])/g, '$1')
        .replace(/[ \t\u00a0]+(?=(?:VD|V\.D|Ví dụ|Vi du|Example|Ex)\s*\d+\s*[:：.)\-–])/gi, '\n')
        .replace(/[ \t\u00a0]+(?=(?:Trong bài|Trong văn bản|In the text)\s*[:：])/gi, '\n')
        .replace(new RegExp('[ \\t\\u00a0]+(?=\\d{1,3}\\s*[\\.\\)]\\s*[^|\\n]{1,80}\\|\\|\\s*(?:' + KINDS + ')\\s*\\|\\|)', 'gi'), '\n');
      norm.split(/\r?\n/).forEach((line0) => {
        const line = line0.replace(/\*\*|__|`/g, '').replace(/^[\s>]*(?:[-*•–]\s+)?/, '').trim();
        if (!line) return;
        const ex = /^(?:VD|V\.D|Ví dụ|Vi du|Example|Ex)\s*(?:\d+\s*)?[:：.)\-–]\s*(.+)$/i.exec(line);
        if (ex) {
          if (!cur) return;
          const body = ex[1];
          let en = body, vi = '';
          const k = body.indexOf('||');
          if (k >= 0) { en = body.slice(0, k); vi = body.slice(k + 2).replace(/^\s*\|\s*/, ''); }
          else {
            const mm = /\s+\|\s+|\s+(?:→|=>|⇒)\s+/.exec(body);
            if (mm) { en = body.slice(0, mm.index); vi = body.slice(mm.index + mm[0].length); }
          }
          en = unq(en); vi = unq(vi);
          if (en) cur.examples.push({ en: en, vi: vi });
          return;
        }
        const it = /^(?:Trong bài|Trong văn bản|In the text|In text|Source)\s*[:：]\s*(.+)$/i.exec(line);
        if (it) { if (cur) cur.inText = unq(it[1]); return; }
        const trSent = /^(?:Dịch câu|Dich cau|Dịch ngữ cảnh|Dich ngu canh|Bản dịch câu|Bản dịch|Sentence translation)\s*[:：]\s*(.+)$/i.exec(line);
        if (trSent) { if (cur) cur.sentVi = unq(trSent[1]); return; }
        const h = /^(\d+)\s*[\.\):]\s*(.*)$/.exec(line);
        if (h) {
          const rest = h[2].trim().replace(/^(?:Nghĩa|Nghia|Meaning)\s*[:：]\s*/i, '');
          const parts = rest.split(/\s*\|\|\s*/);
          cur = { n: +h[1], term: '', kind: '', level: '', meaning: '', inText: '', examples: [] };
          if (parts.length >= 4) {
            cur.term = unq(parts[0]);
            cur.kind = parts[1].trim();
            cur.level = parseCefrLevel(parts[2]);
            if (!cur.level && parseCefrLevel(parts[1])) {
              cur.level = parseCefrLevel(parts[1]);
              cur.kind = parts[2].trim();
            }
            cur.meaning = parts.slice(3).join(' ').trim();
          } else if (parts.length === 3) {
            cur.term = unq(parts[0]);
            const lvl1 = parseCefrLevel(parts[1]);
            const lvl2 = parseCefrLevel(parts[2]);
            if (lvl1) {
              cur.level = lvl1;
              cur.meaning = parts.slice(2).join(' ').trim();
            } else if (lvl2) {
              cur.kind = parts[1].trim();
              cur.level = lvl2;
              cur.meaning = parts.slice(2).join(' ').trim();
            } else {
              cur.kind = parts[1].trim();
              cur.meaning = parts.slice(2).join(' ').trim();
            }
          } else if (parts.length === 2) {
            cur.term = unq(parts[0]);
            cur.meaning = parts[1].trim();
          } else {
            cur.meaning = rest;
          }
          if (!cur.level && cur.meaning) {
            const ml = /\[(A1|A2\+?|B1|B2|C1|C2)\]/i.exec(cur.meaning);
            if (ml) {
              cur.level = ml[1].toUpperCase();
              cur.meaning = cur.meaning.replace(ml[0], '').trim();
            }
          }
          out.push(cur);
          return;
        }
        const mn = /^(?:Nghĩa|Nghia|Meaning)\s*[:：]\s*(.+)$/i.exec(line);
        if (mn && cur && !cur.meaning) cur.meaning = mn[1].trim();
      });
      return out.filter((e) => e.meaning || e.examples.length);
    }

    // Câu đứng ngay trước câu chứa từ. Mục lưu mới đã có sẵn (x.prev); mục cũ thì dò lại trong lịch sử của video/bài (sách cũ thì bỏ qua).
    function vocabPrevSentence(x) {
      if (typeof x.prev === 'string') return x.prev;
      try {
        if (x.bookId) return '';
        const h = getLocalHistory().find((v) => v.videoId === x.videoId);
        const ss = h && h.sentences;
        if (!ss || !ss.length) return '';
        const head = String(x.en || '').trim().slice(0, 40).toLowerCase();
        if (!head) return '';
        const i = ss.findIndex((q) => String(q.text || '').trim().toLowerCase().indexOf(head) === 0 || head.indexOf(String(q.text || '').trim().toLowerCase().slice(0, 40)) === 0 && String(q.text || '').trim().length > 3);
        return i > 0 ? String(ss[i - 1].text || '').trim() : '';
      } catch (e) { return ''; }
    }

    function buildVocabMeaningPrompt(ids) {
      const all = getVocab();
      const items = ids.map((id) => all.find((x) => x.id === id)).filter(Boolean);
      const KIND_VI = { word: 'từ', phrase: 'cụm từ', sentence: 'CẢ CÂU' };
      const lines = items.map((x, i) => {
        const prev = vocabPrevSentence(x);
        return `${i + 1}. "${x.text}" (${KIND_VI[x.kind] || 'từ'}) — ngữ cảnh: "${prev ? prev + ' ' : ''}${x.en}"`;
      });
      return 'Tôi đang học tiếng Pháp. Với TỪNG mục trong danh sách bên dưới (kèm ngữ cảnh gồm câu đứng trước và câu chứa nó, nơi tôi gặp nó), hãy cho tôi:\n'
        + '(1) Ghi chú loại từ / thì được chia viết tắt trong ngoặc vuông [] kèm nghĩa tiếng Việt ngắn gọn, đúng ngữ cảnh (không dịch cả câu).\n'
        + '    Quy ước viết tắt chuẩn (Larousse/Bescherelle):\n'
        + '    - Động từ nguyên mẫu: [v. inf.] nghĩa\n'
        + '    - Động từ đã chia: [v. <từ_gốc> · <thì> <ngôi>] nghĩa (viết tắt thì: prés., imp., fut., p.c., cond., subj., p.p., p.pr.; ngôi: 1s, 2s, 3s, 1p, 2p, 3p. Ví dụ: [v. aller · fut. 1p] chúng tôi sẽ đi)\n'
        + '    - Danh từ: [n.m.] (giống đực), [n.f.] (giống cái), [n.pl.] nghĩa\n'
        + '    - Tính từ: [adj.] nghĩa | Trạng từ: [adv.] nghĩa | Thành ngữ, cụm: [loc.] nghĩa\n'
        + '(2) Bản dịch tiếng Việt tự nhiên, chuẩn xác của câu chứa từ (câu trong phần ngữ cảnh).\n'
        + '(3) Đúng 3 câu ví dụ thực tế BẰNG TIẾNG PHÁP (French) mà người bản xứ hay dùng, đơn giản, không học thuật, không dùng từ quá cao siêu. Mỗi ví dụ dùng đúng nghĩa ở mục (1) và có bản dịch tiếng Việt.\n'
        + '    QUAN TRỌNG: Các câu ví dụ BẮT BUỘC PHẢI VIẾT BẰNG TIẾNG PHÁP. Tuyệt đối KHÔNG viết câu ví dụ bằng tiếng Anh!\n'
        + 'Riêng mục nào ghi (CẢ CÂU) thì chỉ dịch cả câu sang tiếng Việt, không cần ví dụ và không cần tag.\n\n'
        + 'QUAN TRỌNG: đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy (không in đậm, không bảng, không lời dẫn hay giải thích ngoài codebox). '
        + 'Mỗi mục theo đúng mẫu sau, bắt đầu bằng đúng số thứ tự của mục, các mục cách nhau 1 dòng trống. Dùng đúng dấu || giữa câu tiếng Pháp và bản dịch:\n\n'
        + '1. Nghĩa: [tag viết tắt] nghĩa tiếng Việt\n'
        + 'Dịch câu: bản dịch tiếng Việt của câu chứa từ\n'
        + 'VD1: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD2: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD3: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n\n'
        + 'Danh sách từ/cụm từ tiếng Pháp:\n' + lines.join('\n');
    }

    function updateVocabMissingBadge() {
      const badge = document.getElementById('vocab-missing-badge');
      if (!badge) return;
      const n = vocabItemsMissingMeaning().length;
      badge.textContent = n;
      badge.style.display = n ? '' : 'none';
    }

    function openVocabMeaningModal(specificId) {
      resetCopyButtons();
      const modal = document.getElementById('vocab-meaning-modal');
      if (!modal) return;
      vocabAiHintDone();
      const all = getVocab();
      const missing = vocabItemsMissingMeaning();
      
      if (specificId) {
        const target = all.find(x => x.id === specificId);
        const others = missing.filter(x => x.id !== specificId);
        vocabMeaningBatchIds = target ? [target.id, ...others.slice(0, VOCAB_AI_BATCH - 1).map(x => x.id)] : missing.slice(0, VOCAB_AI_BATCH).map(x => x.id);
      } else if (missing.length) {
        vocabMeaningBatchIds = missing.slice(0, VOCAB_AI_BATCH).map((x) => x.id);
      } else {
        vocabMeaningBatchIds = all.slice(0, VOCAB_AI_BATCH).map((x) => x.id);
      }

      const desc = document.getElementById('vm-desc');
      const copyBtn = document.getElementById('vm-copy-btn');
      if (all.length === 0) {
        desc.textContent = 'Sổ từ vựng đang trống. Hãy lưu từ vựng từ video hoặc sách trước khi sử dụng tính năng điền nghĩa bằng AI.';
        if (copyBtn) {
          copyBtn.disabled = true;
          copyBtn.style.opacity = '0.5';
        }
      } else if (missing.length > 0) {
        desc.textContent = `Có ${missing.length} mục chưa có nghĩa riêng hoặc chưa có 3 ví dụ`
          + (missing.length > VOCAB_AI_BATCH ? ` (lượt này gồm ${VOCAB_AI_BATCH} mục đầu, làm xong thì mở lại để làm tiếp)` : '')
          + '. Bấm "Copy prompt", dán cho AI (ChatGPT/Claude...), rồi dán nguyên câu trả lời của AI vào ô bên dưới và bấm "Áp dụng".';
        if (copyBtn) {
          copyBtn.disabled = false;
          copyBtn.style.opacity = '';
        }
      } else {
        desc.textContent = `Tất cả ${all.length} từ vựng đã có nghĩa riêng. Bạn vẫn có thể bấm "Copy prompt" bên dưới để tạo lại prompt cho ${vocabMeaningBatchIds.length} từ (để AI cập nhật thêm ký hiệu ngữ pháp [v. ...] hoặc tạo ví dụ mới).`;
        if (copyBtn) {
          copyBtn.disabled = false;
          copyBtn.style.opacity = '';
        }
      }
      document.getElementById('vm-textarea').value = '';
      aiSetStatus(document.getElementById('vm-status'), '', '');
      modal.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function closeVocabMeaningModal() {
      const modal = document.getElementById('vocab-meaning-modal');
      if (modal) modal.classList.remove('open');
    }

    function openManualPromptModal(text) {
      let modal = document.getElementById('manual-prompt-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'manual-prompt-modal';
        modal.className = 'ai-modal-backdrop';
        modal.innerHTML = `
          <div class="ai-modal" style="max-width:580px;position:relative;z-index:9999" role="dialog" aria-modal="true">
            <div class="ai-modal-head">
              <div class="ai-modal-title">📋 Sao chép Prompt dành cho AI</div>
              <button type="button" class="ai-modal-close" onclick="document.getElementById('manual-prompt-modal').classList.remove('open')">✕</button>
            </div>
            <p class="ai-step-text" style="color:#fde68a;margin-top:4px">Trình duyệt hạn chế tự động copy vào bộ nhớ. Bạn hãy bấm nút bên dưới hoặc nhấn Ctrl+C (⌘+C trên Mac) để copy prompt:</p>
            <textarea id="manual-prompt-text" class="ai-textarea" style="height:220px;font-size:13px;line-height:1.5" readonly></textarea>
            <div class="ai-actions" style="margin-top:12px;display:flex;gap:10px">
              <button type="button" class="ai-btn ai-btn-primary" onclick="const ta=document.getElementById('manual-prompt-text');ta.focus();ta.select();try{document.execCommand('copy');showVocabToast('Đã copy prompt thành công!', true);}catch(e){}">
                <i data-lucide="copy"></i><span>Chọn tất cả &amp; Sao chép</span>
              </button>
              <button type="button" class="ai-btn ai-btn-ghost" onclick="document.getElementById('manual-prompt-modal').classList.remove('open')">Đóng</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      const ta = document.getElementById('manual-prompt-text');
      if (ta) {
        ta.value = text;
        setTimeout(() => { ta.focus(); ta.select(); }, 150);
      }
      modal.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    function copyVocabMeaningPrompt(btn) {
      if (!vocabMeaningBatchIds.length) {
        const all = getVocab();
        if (all.length > 0) {
          vocabMeaningBatchIds = all.slice(0, VOCAB_AI_BATCH).map((x) => x.id);
        } else {
          showVocabToast('Chưa có từ vựng nào để tạo prompt.', false);
          return;
        }
      }
      const text = buildVocabMeaningPrompt(vocabMeaningBatchIds);
      copyTextToClipboard(text).then(() => {
        flashCopied(btn, 1800);
        showVocabToast('✓ Đã copy prompt điền nghĩa AI vào bộ nhớ tạm!', true);
      }).catch((err) => {
        console.warn('Lỗi copy prompt:', err);
        openManualPromptModal(text);
      });
    }

    function applyVocabMeaningAnswer() {
      const statusEl = document.getElementById('vm-status');
      const raw = (document.getElementById('vm-textarea').value || '').trim();
      if (!vocabMeaningBatchIds.length) { aiSetStatus(statusEl, 'err', 'Không có mục nào để áp dụng. Hãy đóng lại và mở lại cửa sổ này.'); return; }
      if (!raw) { aiSetStatus(statusEl, 'err', 'Bạn chưa dán câu trả lời của AI vào ô bên trên.'); return; }

      const entries = aiParseVocabAnswer(raw);
      const byNum = {};
      let seq = 0;
      entries.forEach((e) => { if (e.n && !byNum[e.n]) byNum[e.n] = e; });
      const all = getVocab();
      let applied = 0, withEx = 0;
      vocabMeaningBatchIds.forEach((id, idx) => {
        const e = byNum[idx + 1] || (Object.keys(byNum).length ? null : entries[seq++]);
        if (!e) return;
        const item = all.find((x) => x.id === id);
        if (!item) return;
        let changed = false;
        if (e.meaning && (!item.wordVi || !String(item.wordVi).trim())) { item.wordVi = e.meaning; changed = true; }
        if (e.sentVi && (!item.vi || !String(item.vi).trim())) { item.vi = e.sentVi; changed = true; }
        if (e.examples.length && item.kind !== 'sentence') { item.examples = e.examples.slice(0, 3); withEx++; changed = true; }
        if (changed) applied++;
      });

      if (!applied) {
        aiSetStatus(statusEl, 'err', 'Không nhận ra được mục nào khớp định dạng. Mỗi mục cần có dòng "1. Nghĩa: ..." và các dòng "VD1: câu tiếng Pháp || bản dịch". Kiểm tra lại câu trả lời của AI rồi dán lại.');
        return;
      }

      setVocab(all);
      const total = vocabMeaningBatchIds.length;
      let html = `✓ Đã cập nhật <strong>${applied}/${total}</strong> mục (có ví dụ: ${withEx}).`;
      if (applied < total) html += '<br>Còn thiếu một số mục (AI có thể trả lời thiếu hoặc sai định dạng). Mở lại cửa sổ này để tiếp tục với các mục còn lại.';
      aiSetStatus(statusEl, applied < total ? 'warn' : 'ok', html);
      renderVocabPage();
      updateVocabBadges();
    }

    // ==================== TỪ VỰNG KHÓ TRONG BÀI (AI tổng hợp) ====================
    // Quy trình: copy prompt (kèm cả bài) -> AI trả lời đúng mẫu -> dán lại -> app hiện danh sách + nút "Lưu từ vựng".
    // Kết quả được nhớ theo từng video/bài để mở lại không phải dán lần nữa.
    const KV_KEY = 'shadowing_keyvocab_v1';
    const KV_LABEL = { 'từ': 'Từ', 'phrasal verb': 'Phrasal verb', 'idiom': 'Idiom', 'slang': 'Slang', 'cụm từ': 'Cụm từ' };
    function kvLoadAll() { try { const d = JSON.parse(localStorage.getItem(KV_KEY) || '{}'); return (d && typeof d === 'object') ? d : {}; } catch (e) { return {}; } }
    function kvGet() { const a = kvLoadAll()[currentVideoId]; return a && Array.isArray(a.items) ? a.items : []; }
    function kvSet(items) {
      const all = kvLoadAll();
      if (items.length) all[currentVideoId] = { ts: Date.now(), items: items }; else delete all[currentVideoId];
      const keys = Object.keys(all);
      if (keys.length > 80) keys.sort((a, b) => (all[a].ts || 0) - (all[b].ts || 0)).slice(0, keys.length - 80).forEach((k) => { delete all[k]; });
      try { localStorage.setItem(KV_KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
    }
    function kvNormKind(k, term) {
      const t = String(k || '').toLowerCase();
      if (/phrasal/.test(t)) return 'phrasal verb';
      if (/idiom|thành ngữ/.test(t)) return 'idiom';
      if (/slang|lóng/.test(t)) return 'slang';
      if (/cụm|phrase|collocation/.test(t)) return 'cụm từ';
      if (/từ|word|noun|verb|adj/.test(t)) return 'từ';
      return /\s/.test(term || '') ? 'cụm từ' : 'từ';
    }

    const KV_LEVELS_KEY = 'shadowing_keyvocab_levels_v1';
    const KV_ALL_LEVELS = ['A1', 'A2', 'A2+', 'B1', 'B2', 'C1', 'C2'];
    const KV_DEFAULT_LEVELS = ['B1', 'B2', 'C1'];

    function kvGetLevels() {
      try {
        const raw = localStorage.getItem(KV_LEVELS_KEY);
        if (raw === null) return [...KV_DEFAULT_LEVELS];
        const d = JSON.parse(raw);
        return Array.isArray(d) ? d : [...KV_DEFAULT_LEVELS];
      } catch (e) { return [...KV_DEFAULT_LEVELS]; }
    }
    function kvSetLevels(levels) {
      try { localStorage.setItem(KV_LEVELS_KEY, JSON.stringify(levels)); } catch (e) {}
    }
    function kvToggleLevel(lvl) {
      let cur = kvGetLevels();
      const idx = cur.indexOf(lvl);
      if (idx >= 0) cur.splice(idx, 1);
      else cur.push(lvl);
      cur = KV_ALL_LEVELS.filter((l) => cur.includes(l));
      kvSetLevels(cur);
      kvRenderLevels();
    }
    function kvRenderLevels() {
      const cur = kvGetLevels();
      document.querySelectorAll('#kv-level-box .kv-level-chip').forEach((btn) => {
        const lvl = btn.getAttribute('data-level');
        btn.classList.toggle('active', cur.includes(lvl));
      });
    }

    function buildKeyVocabPrompt() {
      const activeLevels = kvGetLevels();
      const levels = activeLevels.length ? activeLevels : KV_DEFAULT_LEVELS;

      const guideMap = {
        'A1': '- [A1]: Trích xuất CẢ các từ vựng căn bản, đồ vật và động từ quen thuộc trong bài mà người mới bắt đầu cần cho giao tiếp (bỏ qua đại từ nhân xưng quá vỡ lòng je/tu/il).\n',
        'A2': '- [A2]: Trích xuất CẢ các từ vựng sơ cấp, cụm từ miêu tả sinh hoạt, thói quen, cảm xúc thường nhật trong giao tiếp.\n',
        'A2+': '- [A2+]: Trích xuất CẢ các từ nối câu (connecteurs), liên từ và cách diễn đạt thông dụng tiền trung cấp.\n',
        'B1': '- [B1]: Trích xuất các từ vựng, cụm từ giúp thảo luận, diễn đạt ý kiến và giao tiếp tự tin ở mức trung cấp.\n',
        'B2': '- [B2]: Trích xuất các từ vựng diễn đạt sắc thái ngữ nghĩa tinh tế, thành ngữ trung cao cấp nâng cao khả năng giao tiếp tự nhiên.\n',
        'C1': '- [C1]: Trích xuất các từ vựng phong phú, cấu trúc diễn đạt cao cấp, sắc bén của người giao tiếp lưu loát.\n',
        'C2': '- [C2]: Trích xuất các từ vựng điêu luyện, tinh tế tương đương người bản xứ, từ vựng và sắc thái biểu cảm sâu sắc.\n'
      };

      const levelDetail = levels.map((lvl) => guideMap[lvl] || '').join('');

      return 'Tôi đang học tiếng Pháp. Mục tiêu xuyên suốt là trích xuất các từ vựng, cụm từ / locutions, thành ngữ (idioms), tiếng lóng (argot / slang) THỰC SỰ HỮU ÍCH CHO GIAO TIẾP THỰC TẾ xuất hiện trong văn bản tiếng Pháp bên dưới (bỏ qua từ vô nghĩa, từ quá tầm thường không mang giá trị giao tiếp và tên riêng).\n\n'
        + `Định hướng theo các trình độ người học đã kích hoạt: [${levels.join(', ')}].\n`
        + (levelDetail ? `Cụ thể yêu cầu với từng trình độ:\n${levelDetail}\n` : '')
        + 'Với từng mục, cho tôi ghi chú ngữ pháp viết tắt trong ngoặc vuông [] kèm nghĩa tiếng Việt (đúng với nghĩa được dùng trong văn bản) và đúng 3 câu ví dụ thực tế BẰNG TIẾNG PHÁP mà người bản xứ hay dùng, đơn giản, không học thuật, không dùng từ quá cao siêu; mỗi ví dụ kèm bản dịch tiếng Việt.\n\n'
        + 'QUAN TRỌNG VỀ NGÔN NGỮ CÂU VÍ DỤ (BẮT BUỘC TUÂN THỦ):\n'
        + '- Toàn bộ các câu ví dụ (VD1, VD2, VD3) BẮT BUỘC PHẢI ĐƯỢC VIẾT BẰNG TIẾNG PHÁP (French). Tuyệt đối KHÔNG ĐƯỢC viết câu ví dụ bằng tiếng Anh!\n'
        + '- Sau dấu "||" là bản dịch của câu ví dụ đó sang TIẾNG VIỆT.\n\n'
        + 'Quy ước viết tắt ngữ pháp chuẩn (Larousse/Bescherelle):\n'
        + '- Động từ nguyên mẫu: [v. inf.] | Động từ chia: [v. <từ_gốc> · <thì> <ngôi>] (thì: prés., imp., fut., p.c., cond., subj., p.p.; ngôi: 1s, 2s, 3s, 1p, 2p, 3p. VD: [v. savoir · subj. 2s])\n'
        + '- Danh từ: [n.m.] hoặc [n.f.] | Tính từ: [adj.] | Trạng từ: [adv.] | Thành ngữ/cụm: [loc.]\n\n'
        + 'QUAN TRỌNG: đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy (không in đậm, không bảng, không lời dẫn hay giải thích ngoài codebox). '
        + 'Mỗi mục theo đúng mẫu 5 dòng sau, các mục cách nhau 1 dòng trống, đánh số từ 1. Dùng đúng dấu || để ngăn cách, và không dùng || ở chỗ nào khác:\n\n'
        + '1. TỪ hoặc CỤM TỪ tiếng Pháp (dạng xuất hiện trong bài hoặc nguyên mẫu) || LOẠI || CẤP_ĐỘ || [tag viết tắt] nghĩa tiếng Việt\n'
        + 'Trong bài: đúng cụm chữ tiếng Pháp như nó xuất hiện trong văn bản\n'
        + 'VD1: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD2: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD3: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n\n'
        + 'LOẠI chỉ được là một trong: từ, idiom, slang, cụm từ.\n'
        + 'CẤP_ĐỘ chỉ được là một trong các cấp độ CEFR: A1, A2, A2+, B1, B2, C1, C2.\n\n'
        + 'Ví dụ mẫu (chỉ để minh hoạ định dạng chuẩn bằng tiếng Pháp, KHÔNG đưa vào kết quả):\n'
        + '1. a abandonné || từ || B1 || [v. abandonner · p.c. 3s] đã từ bỏ, đã bỏ cuộc\n'
        + 'Trong bài: a abandonné\n'
        + 'VD1: N\'abandonne pas, tu y es presque ! || Đừng bỏ cuộc, bạn gần tới rồi!\n'
        + 'VD2: J\'ai abandonné le tabac l\'année dernière. || Năm ngoái tôi đã bỏ thuốc lá.\n'
        + 'VD3: Elle n\'abandonne jamais ses rêves. || Cô ấy không bao giờ từ bỏ ước mơ.\n\n'
        + 'Văn bản tiếng Pháp:\n<<<\n' + aicPlainTranscript(sentences) + '\n>>>';
    }
    function copyKeyVocabPrompt(btn) {
      if (!sentences.length) {
        showVocabToast('Chưa có nội dung để tạo prompt.', false);
        return;
      }
      const text = buildKeyVocabPrompt();
      copyTextToClipboard(text).then(() => {
        flashCopied(btn, 1800);
        showVocabToast('✓ Đã copy prompt từ vựng khó vào bộ nhớ tạm!', true);
      }).catch((err) => {
        console.warn('Lỗi copy prompt:', err);
        openManualPromptModal(text);
      });
    }

    function kvShowView(view) {
      const inp = document.getElementById('kv-input-view'), lst = document.getElementById('kv-list-view');
      if (!inp || !lst) return;
      inp.style.display = view === 'input' ? '' : 'none';
      lst.style.display = view === 'list' ? '' : 'none';
      document.getElementById('kv-title').textContent = view === 'list' ? 'Từ vựng khó trong bài' : 'Tổng hợp từ vựng khó bằng AI';
      const back = document.getElementById('kv-back-btn');
      if (back) back.classList.toggle('ai-hide', !kvGet().length);
      if (view === 'list') kvRenderList();
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function openKeyVocabModal() {
      if (!sentences.length) { alert('Chưa có nội dung để tổng hợp.'); return; }
      resetCopyButtons();
      document.getElementById('kv-textarea').value = '';
      aiSetStatus(document.getElementById('kv-status'), '', '');
      document.getElementById('keyvocab-modal').classList.add('open');
      kvRenderLevels();
      kvShowView(kvGet().length ? 'list' : 'input');
    }
    function closeKeyVocabModal() {
      const m = document.getElementById('keyvocab-modal');
      if (m) m.classList.remove('open');
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeKeyVocabModal(); });

    function applyKeyVocabAnswer() {
      const statusEl = document.getElementById('kv-status');
      const raw = (document.getElementById('kv-textarea').value || '').trim();
      if (!raw) { aiSetStatus(statusEl, 'err', 'Bạn chưa dán câu trả lời của AI vào ô bên trên.'); return; }
      const seen = new Set();
      const items = [];
      aiParseVocabAnswer(raw).forEach((e) => {
        const term = (e.term || '').trim();
        if (!term || !e.meaning) return;
        const k = term.toLowerCase();
        if (seen.has(k)) return;
        seen.add(k);
        items.push({ term: term, kind: kvNormKind(e.kind, term), level: e.level || '', meaning: e.meaning, inText: e.inText || '', examples: e.examples.slice(0, 3) });
      });
      if (!items.length) {
        aiSetStatus(statusEl, 'err', 'Không nhận ra được mục nào. Mỗi mục cần có dòng "1. từ || loại || nghĩa" (có dấu ||) và các dòng "VD1: câu tiếng Pháp || bản dịch". Kiểm tra lại câu trả lời của AI rồi dán lại.');
        return;
      }
      if (!kvSet(items)) { aiSetStatus(statusEl, 'err', 'Không lưu được danh sách: bộ nhớ trình duyệt đã đầy.'); return; }
      document.getElementById('kv-textarea').value = '';
      aiSetStatus(statusEl, '', '');
      kvShowView('list');
    }
    function kvClear() {
      if (!confirm('Xóa danh sách từ vựng khó của bài này? (Những từ bạn đã lưu vào "Từ vựng đã lưu" vẫn được giữ.)')) return;
      kvSet([]);
      kvShowView('input');
    }

    // Tìm câu trong bài chứa từ này (ưu tiên đúng cụm chữ AI chép lại từ bài), để lấy ngữ cảnh + vị trí tô sáng
    function kvFindContext(it) {
      const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cands = [it.inText, it.term].filter((x) => x && x.length >= 2);
      for (let c = 0; c < cands.length; c++) {
        const low = cands[c].toLowerCase();
        for (let i = 0; i < sentences.length; i++) {
          const tx = String(sentences[i].text || '');
          const idx = tx.toLowerCase().indexOf(low);
          if (idx >= 0 && (idx === 0 || !/\p{L}/u.test(tx[idx - 1]))) return { s: sentences[i], hs: idx, he: idx + cands[c].length };
        }
      }
      const base = String(it.term || '').toLowerCase().split(/\s+/)[0].replace(/(e|y)$/, '');
      if (base.length >= 3) {
        const re = new RegExp('(^|[^\\p{L}])(' + escRe(base) + "[\\p{L}']*)", 'iu');
        for (let i = 0; i < sentences.length; i++) {
          const tx = String(sentences[i].text || '');
          const m = re.exec(tx);
          if (m) { const hs = m.index + m[1].length; return { s: sentences[i], hs: hs, he: hs + m[2].length }; }
        }
      }
      return null;
    }
    function kvIsSaved(it) {
      const k = String(it.term || '').trim().toLowerCase();
      return getVocab().some((x) => {
        if (String(x.text || '').trim().toLowerCase() !== k) return false;
        if (x.videoId === currentVideoId) return true;
        if (Array.isArray(x.contexts) && x.contexts.some((c) => c.videoId === currentVideoId)) return true;
        return false;
      });
    }

    function kvRenderList() {
      const items = kvGet();
      const box = document.getElementById('kv-list');
      document.getElementById('kv-count').textContent = `${items.length} từ/cụm khó`;
      box.innerHTML = items.map((it, i) => {
        const ctx = kvFindContext(it);
        let ctxHtml = '';
        if (ctx) {
          const en = String(ctx.s.text || '');
          ctxHtml = `<p class="vocab-ctx">${escHtml(en.slice(0, ctx.hs))}<mark class="vocab-hl">${escHtml(en.slice(ctx.hs, ctx.he))}</mark>${escHtml(en.slice(ctx.he))}</p>`
            + (ctx.s.vi ? `<p class="vocab-vi">Cả câu: ${escHtml(ctx.s.vi)}</p>` : '');
        }
        const exHtml = it.examples.map((e) => `<div><p class="vocab-ex-en">${hlExample(String(e.en), it.term)}</p>${e.vi ? `<p class="vocab-ex-vi">${escHtml(e.vi)}</p>` : ''}</div>`).join('');
        const saved = kvIsSaved(it);
        const lvlBadge = it.level ? `<span class="vocab-level-badge level-${escHtml(it.level.toLowerCase().replace('+', 'plus'))}">${escHtml(it.level)}</span>` : '';
        return `<article class="vocab-card" data-kv-i="${i}">
          <div class="vocab-card-head">
            <div><span class="vocab-kind vocab-kind-${it.kind === 'từ' ? 'word' : 'phrase'}">${escHtml(KV_LABEL[it.kind] || '')}</span>${lvlBadge}<h3 class="vocab-word">${escHtml(it.term)}</h3></div>
            <div class="vocab-card-tools"><button type="button" class="vocab-mini del" title="Xóa từ này khỏi danh sách" onclick="kvRemove(${i})">Xóa</button><button type="button" class="kv-save-btn${saved ? ' saved' : ''}" ${saved ? 'disabled' : ''} onclick="kvSave(${i})">${saved ? '✓ Đã lưu' : 'Lưu từ vựng'}</button></div>
          </div>
          ${ctxHtml}
          <p class="vocab-wordvi" style="margin-top:8px">${formatGrammarBadgeHtml(escHtml(it.meaning))}</p>
          ${exHtml ? `<div class="vocab-examples" style="margin-left:0">${exHtml}</div>` : ''}
        </article>`;
      }).join('');
      const allBtn = document.getElementById('kv-save-all-btn');
      if (allBtn) {
        const allSaved = items.length > 0 && items.every((it) => kvIsSaved(it));
        allBtn.disabled = allSaved;
        allBtn.classList.toggle('saved', allSaved);
        allBtn.textContent = allSaved ? '✓ Đã lưu tất cả' : 'Lưu tất cả';
      }
    }

    // Xóa 1 từ khỏi danh sách tạm (không đụng tới "Từ vựng đã lưu")
    function kvRemove(i) {
      const items = kvGet().slice();
      if (i < 0 || i >= items.length) return;
      items.splice(i, 1);
      kvSet(items);
      if (!items.length) { kvShowView('input'); return; }
      kvRenderList();
    }

    // Thêm 1 mục từ khó vào mảng từ vựng đã lưu `list` (chưa ghi xuống bộ nhớ). Trả về true nếu là mục mới.
    function kvStoreItem(list, it) {
      const text = it.term.trim();
      const n = text.split(/\s+/).length;
      const ctx = kvFindContext(it);
      let en, hs, he, vi = '', t = 0, prev = '';
      if (ctx) {
        en = String(ctx.s.text || ''); hs = ctx.hs; he = ctx.he; vi = (ctx.s.vi || '').trim(); t = ctx.s.startTime || 0;
        const si = sentences.indexOf(ctx.s);
        if (si > 0) prev = String(sentences[si - 1].text || '').trim();
      }
      else { en = text; hs = 0; he = text.length; }
      
      const normText = text.toLowerCase();
      const dup = list.find((x) => String(x.text || '').trim().toLowerCase() === normText);
      if (dup) {
        if (!dup.wordVi) dup.wordVi = it.meaning;
        if (!dup.level && it.level) dup.level = it.level;
        if (!(dup.examples && dup.examples.length)) dup.examples = it.examples;
        if (!dup.tag) dup.tag = KV_LABEL[it.kind];
        // Nếu khác video/ngữ cảnh -> lưu vào contexts
        if (dup.videoId !== currentVideoId) {
          if (!Array.isArray(dup.contexts)) dup.contexts = [];
          const hasCtx = dup.contexts.some((c) => c.videoId === currentVideoId);
          if (!hasCtx) {
            dup.contexts.push({
              videoId: currentVideoId,
              videoTitle: currentVideoTitle || '',
              en: en, hs: hs, he: he, vi: vi, prev: prev, t: t, createdAt: Date.now()
            });
          }
        }
        return false;
      }
      list.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'), tag: KV_LABEL[it.kind],
        level: it.level || '',
        en: en, hs: hs, he: he, vi: vi, prev: prev, wordVi: it.meaning, examples: it.examples,
        videoId: currentVideoId, videoTitle: currentVideoTitle || '', t: t, createdAt: Date.now()
      });
      return true;
    }

    function kvSave(i) {
      const it = kvGet()[i];
      if (!it) return;
      const text = it.term.trim();
      const list = getVocab();
      kvStoreItem(list, it);
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      updateVocabBadges();
      showVocabToast(`Đã lưu “${text.length > 40 ? text.slice(0, 40) + '…' : text}”`, false);
      kvRenderList();
    }

    // Lưu tất cả các từ còn lại trong danh sách (đã xóa bớt từ không cần thì chỉ lưu phần còn lại)
    function kvSaveAll() {
      const items = kvGet();
      if (!items.length) return;
      const list = getVocab();
      let added = 0;
      // duyệt ngược để từ đầu danh sách nằm trên cùng trong \"Từ vựng đã lưu\"
      items.slice().reverse().forEach((it) => { if (kvStoreItem(list, it)) added++; });
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      updateVocabBadges();
      showVocabToast(added ? `Đã lưu ${added} từ vựng` : 'Tất cả từ đã được lưu trước đó', false);
      kvRenderList();
      if (window.activeRightPanelTab === 'keyvocab' && window.renderRightPanelKeyVocab) {
        window.renderRightPanelKeyVocab();
      }
    }

    // ==================== BỐ CỤC CỘT PHẢI: TỪ KHÓ & CHÚ GIẢI KÝ HIỆU (MODULE L3) ====================
    window.activeRightPanelTab = 'sentences';
    window.rightPanelKvFilter = 'all';

    window.switchRightPanelTab = function (tab) {
      window.activeRightPanelTab = tab;
      const btnSentences = document.getElementById('tab-sub-sentences');
      const btnKv = document.getElementById('tab-sub-keyvocab');
      const subContainer = document.getElementById('subtitles-scroll-container');
      const searchBar = document.getElementById('sub-search-bar');
      const kvContainer = document.getElementById('keyvocab-panel-container');
      const countEl = document.getElementById('sub-panel-count');

      if (tab === 'keyvocab') {
        if (btnSentences) btnSentences.classList.remove('on');
        if (btnKv) btnKv.classList.add('on');
        if (subContainer) subContainer.style.display = 'none';
        if (searchBar) searchBar.style.display = 'none';
        if (kvContainer) kvContainer.style.display = 'flex';
        renderRightPanelKeyVocab(window.rightPanelKvFilter || 'all');
      } else {
        if (btnSentences) btnSentences.classList.add('on');
        if (btnKv) btnKv.classList.remove('on');
        if (subContainer) subContainer.style.display = '';
        if (searchBar) searchBar.style.display = '';
        if (kvContainer) kvContainer.style.display = 'none';
        if (countEl && sentences && sentences.length) {
          const curIdx = currentSentenceIndex >= 0 ? currentSentenceIndex + 1 : 1;
          countEl.textContent = `Câu ${curIdx}/${sentences.length}`;
        }
      }
    };

    window.toggleSymbolLegend = function (boxId) {
      const box = document.getElementById(boxId || 'panel-symbol-legend');
      if (!box) return;
      const isOpen = box.classList.toggle('open');
      const btn = box.querySelector('.legend-toggle-btn');
      if (btn) btn.textContent = isOpen ? 'Đóng' : 'Xem chú giải';
    };

    window.renderRightPanelKeyVocab = function (filterLevel) {
      if (filterLevel !== undefined) window.rightPanelKvFilter = filterLevel;
      const curFilter = window.rightPanelKvFilter || 'all';
      const container = document.getElementById('keyvocab-panel-container');
      const countEl = document.getElementById('sub-panel-count');
      if (!container) return;

      const rawItems = kvGet();
      const items = curFilter === 'all' ? rawItems : rawItems.filter((x) => x.level === curFilter);

      if (countEl) {
        countEl.textContent = `${items.length} từ`;
      }

      const allLevels = ['all', 'A1', 'A2', 'A2+', 'B1', 'B2', 'C1', 'C2'];
      const chipsHtml = allLevels.map((lvl) => {
        const isActive = lvl === curFilter;
        const count = lvl === 'all' ? rawItems.length : rawItems.filter((x) => x.level === lvl).length;
        return `<button type="button" class="kv-chip ${isActive ? 'active' : ''}" onclick="renderRightPanelKeyVocab('${lvl}')">${lvl === 'all' ? 'Tất cả' : lvl} <span class="kv-chip-num">(${count})</span></button>`;
      }).join('');

      const allSaved = rawItems.length > 0 && rawItems.every((it) => kvIsSaved(it));

      let listHtml = '';
      if (!rawItems.length) {
        listHtml = `
          <div class="kv-panel-empty">
            <div class="kv-empty-icon"><i data-lucide="sparkles"></i></div>
            <h3 class="kv-empty-title">Chưa có danh sách từ khó</h3>
            <p class="kv-empty-desc">Nhờ AI tổng hợp tự động các từ vựng, cụm từ và từ lóng quan trọng kèm 3 ví dụ tiếng Pháp thực tế.</p>
            <button type="button" class="kv-btn-cta" onclick="openKeyVocabModal()">
              <i data-lucide="sparkles"></i><span>Trích xuất từ khó bằng AI</span>
            </button>
          </div>
        `;
      } else if (!items.length) {
        listHtml = `<div class="kv-panel-empty"><p class="kv-empty-desc">Không có từ vựng nào thuộc cấp độ <b>${curFilter}</b>.</p></div>`;
      } else {
        listHtml = items.map((it) => {
          const rawIndex = rawItems.indexOf(it);
          const ctx = kvFindContext(it);
          let ctxHtml = '';
          if (ctx) {
            const en = String(ctx.s.text || '');
            ctxHtml = `<p class="vocab-ctx">${escHtml(en.slice(0, ctx.hs))}<mark class="vocab-hl">${escHtml(en.slice(ctx.hs, ctx.he))}</mark>${escHtml(en.slice(ctx.he))}</p>`;
          }
          const exHtml = (it.examples || []).map((e) => `<div><p class="vocab-ex-en">${hlExample(String(e.en || ''), it.term)}</p>${e.vi ? `<p class="vocab-ex-vi">${escHtml(e.vi)}</p>` : ''}</div>`).join('');
          const saved = kvIsSaved(it);
          const lvlBadge = it.level ? `<span class="vocab-level-badge level-${escHtml(it.level.toLowerCase().replace('+', 'plus'))}">${escHtml(it.level)}</span>` : '';
          return `
            <article class="vocab-card kv-panel-card" data-kv-term="${escHtml(it.term)}">
              <div class="vocab-card-head">
                <div>
                  <span class="vocab-kind vocab-kind-${it.kind === 'từ' ? 'word' : 'phrase'}">${escHtml(KV_LABEL[it.kind] || 'Từ')}</span>
                  ${lvlBadge}
                  <h3 class="vocab-word">${escHtml(it.term)}</h3>
                </div>
                <div class="vocab-card-tools">
                  <button type="button" class="vocab-mini" title="Phát âm từ này" onclick="window.playFrenchAudio && window.playFrenchAudio('${escHtml(it.term).replace(/'/g, "\\'")}')">
                    <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                  </button>
                  <button type="button" class="kv-save-btn ${saved ? 'saved' : ''}" ${saved ? 'disabled' : ''} onclick="kvSave(${rawIndex})">
                    ${saved ? '✓ Đã lưu' : 'Lưu'}
                  </button>
                  <button type="button" class="vocab-mini del" title="Xóa từ này" onclick="kvRemove(${rawIndex})">✕</button>
                </div>
              </div>
              ${ctxHtml}
              <p class="vocab-wordvi">${formatGrammarBadgeHtml(escHtml(it.meaning))}</p>
              ${exHtml ? `<div class="vocab-examples">${exHtml}</div>` : ''}
            </article>
          `;
        }).join('');
      }

      container.innerHTML = `
        <div class="kv-panel-toolbar">
          <div class="kv-panel-chips">${chipsHtml}</div>
          <div class="kv-panel-actions">
            <button type="button" class="kv-save-all-btn ${allSaved ? 'saved' : ''}" ${allSaved || !rawItems.length ? 'disabled' : ''} onclick="kvSaveAll()">
              ${allSaved ? '✓ Đã lưu tất cả' : 'Lưu tất cả (' + rawItems.length + ')'}
            </button>
            <button type="button" class="kv-action-ghost" onclick="openKeyVocabModal()">
              <i data-lucide="sparkles"></i><span>Nhờ AI</span>
            </button>
            <button type="button" class="kv-action-ghost" onclick="toggleSymbolLegend('panel-symbol-legend')">
              <i data-lucide="help-circle"></i><span>Chú giải</span>
            </button>
          </div>
        </div>

        <!-- THẺ CHÚ GIẢI KÝ HIỆU (ARTBOARD TRA / HARD) -->
        <div class="symbol-legend-box" id="panel-symbol-legend">
          <div class="legend-hd">
            <h4><i data-lucide="book-open"></i> Chú giải ký hiệu & Mẫu Karaoke</h4>
            <button type="button" class="legend-toggle-btn" onclick="toggleSymbolLegend('panel-symbol-legend')">Đóng</button>
          </div>
          <div class="legend-grid">
            <div class="legend-col">
              <div class="legend-title">BẢNG VIẾT TẮT TỪ LOẠI</div>
              <div class="pos-table">
                <div class="pos-row"><span class="pos">n.m.</span><span>danh từ giống đực</span></div>
                <div class="pos-row"><span class="pos">n.f.</span><span>danh từ giống cái</span></div>
                <div class="pos-row"><span class="pos">v.</span><span>động từ</span></div>
                <div class="pos-row"><span class="pos">adj.</span><span>tính từ</span></div>
                <div class="pos-row"><span class="pos">adv.</span><span>trạng từ</span></div>
                <div class="pos-row"><span class="pos">prép.</span><span>giới từ</span></div>
                <div class="pos-row"><span class="pos">conj.</span><span>liên từ</span></div>
                <div class="pos-row"><span class="pos">pron.</span><span>đại từ</span></div>
              </div>
            </div>
            <div class="legend-col">
              <div class="legend-title">MẪU TRẠNG THÁI KARAOKE</div>
              <div class="karaoke-sample-box">
                <div class="kw-sample">
                  <span class="done">Voici</span>
                  <span class="now">une</span>
                  <span class="next">phrase</span>
                  <span class="next saved">longue</span>
                </div>
                <ul class="karaoke-legend-list">
                  <li><span class="kw-dot done"></span> <b>Đã đọc:</b> Chữ xanh ngọc (accent)</li>
                  <li><span class="kw-dot now"></span> <b>Đang đọc:</b> Nền mint, chữ đậm</li>
                  <li><span class="kw-dot next"></span> <b>Chưa đọc:</b> Chữ xám mờ (muted)</li>
                  <li><span class="kw-dot saved"></span> <b>Từ đã lưu:</b> Gạch chân chấm (dotted)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="kv-panel-list">${listHtml}</div>
      `;

      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    };

    // Nguồn của 1 mục từ vựng: video YouTube, bài viết/văn bản (id bắt đầu bằng art_ hoặc txt_) hoặc sách
    function vocabSourceInfo(x) {
      if (x.bookId) return { key: 'book:' + x.bookId, type: 'book', title: x.videoTitle || 'Sách' };
      const id = String(x.videoId || '');
      if (/^(art|txt)_/.test(id)) return { key: 'text:' + id, type: 'article', title: x.videoTitle || 'Bài viết' };
      if (id) return { key: 'video:' + id, type: 'video', title: x.videoTitle || id };
      return { key: 'none', type: 'other', title: 'Không rõ nguồn' };
    }
    // Dựng danh sách lọc theo bài học (nhóm Video / Bài viết / Sách), kèm số từ của từng bài
    function renderVocabSourceOptions(all) {
      const sel = document.getElementById('vocab-source');
      if (!sel) return;
      const map = new Map();
      all.forEach((x) => {
        const info = vocabSourceInfo(x);
        let g = map.get(info.key);
        if (!g) { g = { key: info.key, type: info.type, title: info.title, titleAt: 0, recent: 0, count: 0 }; map.set(info.key, g); }
        g.count++;
        const at = x.createdAt || 0;
        if (at > g.recent) g.recent = at;
        if (x.videoTitle && at >= g.titleAt) { g.title = x.videoTitle; g.titleAt = at; }
      });
      if (vocabSource !== 'all' && !map.has(vocabSource)) vocabSource = 'all';
      const cut = (t) => (t.length > 60 ? t.slice(0, 60) + '…' : t);
      const groups = [['video', 'Video'], ['article', 'Bài viết'], ['book', 'Sách'], ['other', 'Khác']];
      let html = `<option value="all">Tất cả bài học (${all.length})</option>`;
      groups.forEach(([type, label]) => {
        const items = Array.from(map.values()).filter((g) => g.type === type).sort((a, b) => b.recent - a.recent);
        if (!items.length) return;
        html += `<optgroup label="${label}">` + items.map((g) => `<option value="${escHtml(g.key)}">${escHtml(cut(g.title))} (${g.count})</option>`).join('') + '</optgroup>';
      });
      sel.innerHTML = html;
      sel.value = vocabSource;
    }

    function renderVocabLevelOptions(all) {
      const sel = document.getElementById('vocab-level');
      if (!sel) return;
      const CEFR = ['A1', 'A2', 'A2+', 'B1', 'B2', 'C1', 'C2'];
      const counts = {};
      CEFR.forEach((l) => { counts[l] = 0; });
      all.forEach((x) => {
        const l = String(x.level || '').trim().toUpperCase();
        if (counts[l] !== undefined) counts[l]++;
      });
      let html = `<option value="all">Tất cả cấp độ (${all.length})</option>`;
      CEFR.forEach((l) => {
        html += `<option value="${l}">Cấp ${l} (${counts[l] || 0})</option>`;
      });
      sel.innerHTML = html;
      sel.value = vocabLevelFilter;
    }

    // Vẽ lại danh sách nhưng giữ cho màn hình "đứng im": lấy thẻ đang nhìn thấy đầu tiên làm mốc, sau khi vẽ lại thì
    // cuộn bù đúng phần chênh lệch (mục mới được thêm lên đầu danh sách sẽ không đẩy nội dung đang đọc trôi xuống).
    function renderVocabPageKeepScroll() {
      const cards = Array.from(document.querySelectorAll('#screen-vocab .vocab-card[data-vid]'));
      const anchor = cards.find((c) => c.getBoundingClientRect().bottom > 40);
      const id = anchor ? anchor.getAttribute('data-vid') : null;
      const top = anchor ? anchor.getBoundingClientRect().top : 0;
      renderVocabPage();
      if (!id) return;
      const again = Array.from(document.querySelectorAll('#screen-vocab .vocab-card[data-vid]')).find((c) => c.getAttribute('data-vid') === id);
      if (!again) return;
      const delta = again.getBoundingClientRect().top - top;
      if (Math.abs(delta) > 0.5) window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' });
    }

    function renderVocabPage() {
      const all = getVocab();
      document.getElementById('vocab-count').textContent = all.length;
      renderVocabSourceOptions(all);
      renderVocabLevelOptions(all);
      const q = vocabQuery.toLowerCase().trim();
      const list = all.filter((x) => (vocabSource === 'all' || vocabSourceInfo(x).key === vocabSource)
        && (vocabLevelFilter === 'all' || String(x.level || '').trim().toUpperCase() === vocabLevelFilter.toUpperCase())
        && (!q || `${x.text} ${x.en} ${x.vi || ''} ${x.wordVi || ''} ${x.videoTitle || ''}`.toLowerCase().includes(q)));
      list.sort(vocabSort === 'az' ? (a, b) => a.text.localeCompare(b.text, 'en', { sensitivity: 'base' })
        : vocabSort === 'old' ? (a, b) => a.createdAt - b.createdAt : (a, b) => b.createdAt - a.createdAt);
      updateVocabMissingBadge();
      updateReviewBadges();
      const rb = document.getElementById('vocab-review-btn');
      if (rb) rb.title = vocabSource === 'all'
        ? 'Ôn tập từ vựng theo nguyên lý lặp lại ngắt quãng (spaced repetition)'
        : 'Chỉ ôn tập từ vựng của bài đang lọc (video / bài viết / sách)';
      document.getElementById('vocab-list').innerHTML = list.length
        ? list.map(vocabCardHtml).join('')
        : `<div class="vocab-empty">${all.length ? 'Không có mục nào khớp bộ lọc.' : 'Chưa có từ vựng nào.<br>Khi luyện tập, bôi đen một từ, cụm từ hoặc câu rồi bấm <b style="color:#fbbf24">Lưu</b> để lưu lại ở đây.'}</div>`;
    }

    function lookupVocab(id) {
      const x = getVocab().find((v) => v.id === id);
      if (!x) return;
      const q = `tôi đang học tiếng Pháp. Từ/cụm từ "${x.text}" trong câu "${x.en}" có nghĩa là gì? Giải thích ngắn gọn bằng tiếng Việt.`;
      window.open(`https://www.google.com/search?udm=50&q=${encodeURIComponent(q)}`, '_blank');   // udm=50: Google AI Mode
    }
    function deleteVocab(id) {
      setVocab(getVocab().filter((v) => v.id !== id));
      updateVocabBadges();
      renderVocabPage();
    }
    function clearAllVocab() {
      if (!getVocab().length || !confirm('Xoá toàn bộ từ vựng đã lưu trên thiết bị này?')) return;
      setVocab([]);
      updateVocabBadges();
      renderVocabPage();
    }
    function exportVocabCsv() {
      const all = getVocab();
      if (!all.length) { showVocabToast('Chưa có gì để xuất', false); return; }
      const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const rows = [['Từ / cụm từ', 'Nghĩa riêng của từ', 'Ngữ cảnh', 'Bản dịch cả câu', 'Video', 'Link']].concat(all.map((x) => [
        x.text, x.wordVi || '', x.en, x.vi || '', x.videoTitle || x.videoId,
        x.srcUrl ? x.srcUrl : ((x.videoId && !x.bookId) ? `https://www.youtube.com/watch?v=${x.videoId}&t=${Math.max(0, Math.floor((x.t || 0) - 2))}s` : '')
      ]));
      const blob = new Blob(['\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tu-vung-shadowing.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }

    // ==================== ĐẢM BẢO TIÊU ĐIỂM TRANG CHO PHÍM TẮT (ITEM 2) ====================
    function ensurePageFocus() {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        window.focus();
      }
    }

    window.addEventListener('blur', () => {
      // Khi bấm vào iframe YouTube, tự động phục hồi quyền nhận phím tắt cho trang sau 150ms
      setTimeout(() => {
        window.focus();
      }, 150);
    });

    // Phím F: phát RIÊNG khung video YouTube toàn màn hình (không phải cả giao diện app).
    function toggleFullScreen() {
      const elem = document.getElementById('video-frame-wrapper');
      if (!elem) return;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().then(() => { try { window.focus(); } catch (e) {} }).catch(() => {});
        }
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    }
    // Thoát fullscreen bằng Esc/phím F: trả quyền nhận phím tắt về trang.
    document.addEventListener('fullscreenchange', () => { try { window.focus(); } catch (e) {} });

    let isYTCaptionsVisible = false;
    function toggleYouTubeCaptions() {
      if (!ytPlayer) return;
      try {
        if (isYTCaptionsVisible) {
          if (ytPlayer.unloadModule) ytPlayer.unloadModule('captions');
          if (ytPlayer.setOption) ytPlayer.setOption('captions', 'track', {});
          isYTCaptionsVisible = false;
        } else {
          if (ytPlayer.loadModule) ytPlayer.loadModule('captions');
          if (ytPlayer.setOption) ytPlayer.setOption('captions', 'track', {'languageCode': 'en'});
          isYTCaptionsVisible = true;
        }
      } catch (err) {}
    }

    document.addEventListener('keydown', (e) => {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        return;
      }
      if (window.pvBlocksHotkeys && window.pvBlocksHotkeys()) return;   // đang ở giao diện Shadowing / Chép chính tả: không dùng phím tắt của giao diện Mặc định
      if (!document.getElementById('screen-vocab').classList.contains('hidden')) return;
      if (donateVisible()) return;
      if (guideVisible()) return;

      const key = e.key;

      if (subtitleLoopActive && (key === 'Enter' || key === 'Escape')) {
        e.preventDefault();
        stopSubtitleLoop();
        return;
      }

      if (e.shiftKey && (key === '>' || key === '.')) {
        e.preventDefault();
        setRate(settings.playbackRate + 0.25);
        return;
      }
      if (e.shiftKey && (key === '<' || key === ',')) {
        e.preventDefault();
        setRate(settings.playbackRate - 0.25);
        return;
      }

      if (!e.shiftKey && !e.altKey && /^[0-9]$/.test(key)) {
        e.preventDefault();
        if (key === '0') { playFromBeginning(); return; }
        const rateMap = { '1': 0.5, '2': 0.75, '3': 0.9, '4': 1, '5': 1.25, '6': 1.5, '7': 1.75, '8': 2 };
        if (rateMap[key] !== undefined) setRate(rateMap[key]);
        return;
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        if (ytPlayer && ytPlayer.getVolume && ytPlayer.setVolume) {
          const v = Math.min(100, ytPlayer.getVolume() + 5);
          ytPlayer.setVolume(v);
          if (ytPlayer.isMuted && ytPlayer.isMuted()) ytPlayer.unMute();
        }
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault();
        if (ytPlayer && ytPlayer.getVolume && ytPlayer.setVolume) {
          const v = Math.max(0, ytPlayer.getVolume() - 5);
          ytPlayer.setVolume(v);
        }
        return;
      }

      if (key === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5);
        return;
      }
      if (key === 'l' || key === 'L') {
        e.preventDefault();
        loopSelectedText(false);
        return;
      }
      if (key === 's' || key === 'S') {
        e.preventDefault();
        saveSelectionToVocabByKey();
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5);
        return;
      }

      if (key === 'f' || key === 'F') {
        e.preventDefault();
        toggleFullScreen();
        return;
      }

      if (key === 'c' || key === 'C') {
        e.preventDefault();
        toggleYouTubeCaptions();
        return;
      }

      if (key === 'm' || key === 'M') {
        e.preventDefault();
        if (ytPlayer && ytPlayer.isMuted && ytPlayer.mute && ytPlayer.unMute) {
          if (ytPlayer.isMuted()) {
            ytPlayer.unMute();
          } else {
            ytPlayer.mute();
          }
        }
        return;
      }

      if (key === ' ' || key === 'Backspace') {
        e.preventDefault();
        if (key === 'Backspace' && subtitleLoopActive && (loopWaitingAtEnd || !isPlaying)) {
          restartLoopFromStart();
        } else {
          togglePlay();
        }
      } else if (key === 'r' || key === 'R') {
        replaySentence();
      } else if (key === 'Home') {
        playFromBeginning();
      }
    });


    // ==================== CHIA SẺ VIDEO BẰNG LINK ====================
    // Link chứa luôn phụ đề (+ bản dịch) trong phần sau dấu # nên không cần backend:
    //   <trang>#share=<dữ liệu nén>     -> mở đúng video, có phụ đề, tự bật Song ngữ nếu lúc chia sẻ đang bật.
    // (Định dạng cũ #share=... vẫn được đọc để link đã gửi trước đây còn dùng được; link mới dùng ?v=<id> + file .share.json.)
    function shareB64FromBytes(bytes) {
      let bin = '';
      const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function shareBytesFromB64(str) {
      let b = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      const bin = atob(b);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    async function shareEncode(obj) {
      const raw = new TextEncoder().encode(JSON.stringify(obj));
      if (window.CompressionStream) {
        try {
          const cs = new CompressionStream('deflate-raw');
          const w = cs.writable.getWriter();
          w.write(raw); w.close();
          const buf = await new Response(cs.readable).arrayBuffer();
          return 'z' + shareB64FromBytes(new Uint8Array(buf));
        } catch (e) {}
      }
      return 'r' + shareB64FromBytes(raw);
    }
    async function shareDecode(str) {
      const kind = str.charAt(0);
      let bytes = shareBytesFromB64(str.slice(1));
      if (kind === 'z') {
        const ds = new DecompressionStream('deflate-raw');
        const w = ds.writable.getWriter();
        w.write(bytes); w.close();
        bytes = new Uint8Array(await new Response(ds.readable).arrayBuffer());
      }
      return JSON.parse(new TextDecoder().decode(bytes));
    }
    function shareBaseUrl() { return location.href.split('#')[0].split('?')[0]; }

    // Link ngắn: <trang>?v=<videoId>&b=1
    // Dữ liệu đầy đủ (kể cả mốc thời gian từng từ + bản dịch) nằm trong file <videoId>.share.json
    // đặt trong thư mục subs/ (cùng chỗ với các file phụ đề). Bấm Chia sẻ sẽ tải file này về + copy link ngắn.
    function shareDownloadFile(name, text) {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    async function shareCurrentVideo() {
      if (!currentVideoId || !sentences.length) return;
      const withVi = aicHasTranslation(sentences);
      const bilingualOn = !!(settings.bilingual && withVi);
      const fileName = `${currentVideoId}.share.json`;
      const payload = {
        v: 2,
        id: currentVideoId,
        title: currentVideoTitle || '',
        format: subtitleFormat || 'srt',
        sentences: sentences
      };
      shareDownloadFile(fileName, JSON.stringify(payload));
      const link = shareBaseUrl() + '?v=' + encodeURIComponent(currentVideoId) + (bilingualOn ? '&b=1' : '');
      try { await copyTextToClipboard(link); } catch (e) {}
      openShareModal(link, fileName, bilingualOn, withVi);
    }

    function openShareModal(link, fileName, bilingualOn, withVi) {
      const m = document.getElementById('share-modal');
      if (!m) return;
      document.getElementById('share-link-input').value = link;
      document.getElementById('share-file-name').textContent = fileName;
      const f2 = document.getElementById('share-file-name2');
      if (f2) f2.textContent = fileName;
      document.getElementById('share-extra').textContent =
        (withVi ? 'Có kèm bản dịch tiếng Việt. ' : 'Video này chưa có bản dịch nên link không kèm song ngữ. ') +
        (bilingualOn ? 'Người mở link sẽ thấy Song ngữ đang bật.' : (withVi ? 'Đang tắt Song ngữ nên người mở link sẽ thấy Song ngữ tắt (muốn bật sẵn thì bật Song ngữ rồi bấm chia sẻ lại).' : ''));
      const warn = document.getElementById('share-file-warn');
      warn.style.display = location.protocol === 'file:' ? 'block' : 'none';
      m.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function closeShareModal() { const m = document.getElementById('share-modal'); if (m) m.classList.remove('open'); }
    function copyShareLink(btn) {
      const v = document.getElementById('share-link-input').value;
      copyTextToClipboard(v).then(() => {
        flashCopied(btn, 1600);
      }).catch(() => { document.getElementById('share-link-input').select(); });
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShareModal(); });

    function shareEnterPractice() {
      document.getElementById('screen-vocab').classList.add('hidden');
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();
      currentSentenceIndex = 0;
      isTextMode = false;
      document.body.classList.remove('text-mode');
      resetPlaybackTrackingState();
      initYouTubePlayer();
      renderSubtitleList();
      const scrollBox0 = document.getElementById('subtitles-scroll-container');
      if (scrollBox0) scrollBox0.scrollTop = 0;
      updateActiveSentenceDisplay();
      if (window.lucide && window.lucide.createIcons) { window.lucide.createIcons(); }
      ensurePageFocus();
      trackAndShowVideoStats(currentVideoId);
    }

    async function openSharedFromHash() {
      const m = /^#share=(.+)$/.exec(location.hash || '');
      if (!m) return false;
      try {
        const p = await shareDecode(m[1]);
        if (!p || !p.id || !Array.isArray(p.s) || !p.s.length) throw new Error('bad');
        const list = p.s.map((a, i) => {
          const o = { id: i + 1, startTime: Number(a[0]) || 0, endTime: Number(a[1]) || 0, text: String(a[2] || '') };
          if (a[3]) o.vi = String(a[3]);
          return o;
        });
        const existing = getLocalHistory().find((h) => h.videoId === p.id);
        currentVideoId = String(p.id);
        currentVideoTitle = p.n || (existing && existing.title) || `Video ${p.id}`;
        subtitleFormat = 'srt';
        sentences = list;
        inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
        // Chỉ lưu vào lịch sử của người xem nếu họ chưa có bản riêng của video này
        if (existing && existing.sentences && existing.sentences.length) sharedNoSaveId = currentVideoId;
        else saveToLocalHistory({ videoId: currentVideoId, title: currentVideoTitle, format: subtitleFormat, sentences: sentences });
        shareEnterPractice();
        if (p.b && aicHasTranslation(sentences)) setBilingual(true);
        try { history.replaceState(null, '', shareBaseUrl()); } catch (e) {}
        showVocabToast('Đang mở video được chia sẻ', false);
        return true;
      } catch (e) {
        console.warn('Link chia sẻ không hợp lệ:', e);
        try { history.replaceState(null, '', shareBaseUrl()); } catch (e2) {}
        showVocabToast('Link chia sẻ không đọc được (có thể bị cắt ngắn)', false);
        return false;
      }
    }

    // Mở link ngắn ?v=<videoId>&b=1
    async function openSharedFromQuery() {
      const q = new URLSearchParams(location.search);
      const vid = q.get('v');
      if (!vid || !/^[\w-]{6,20}$/.test(vid)) return;
      const wantBilingual = q.get('b') === '1';
      try { history.replaceState(null, '', shareBaseUrl()); } catch (e) {}

      // (a) File chia sẻ đầy đủ (từng từ + bản dịch)
      try {
        const res = await fetch(`${DATA_DIR}${vid}.share.json?t=${Date.now()}`, { cache: 'no-cache' });
        if (res.ok) {
          const txt = await res.text();
          if (txt && !txt.trim().toLowerCase().startsWith('<!doctype html')) {
            const p = JSON.parse(txt);
            if (p && Array.isArray(p.sentences) && p.sentences.length) {
              const existing = getLocalHistory().find((h) => h.videoId === vid);
              currentVideoId = vid;
              currentVideoTitle = p.title || (existing && existing.title) || `Video ${vid}`;
              subtitleFormat = p.format || 'srt';
              sentences = p.sentences;
              inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
              if (existing && existing.sentences && existing.sentences.length) sharedNoSaveId = currentVideoId;   // không ghi đè bản riêng của người xem
              else saveToLocalHistory({ videoId: currentVideoId, title: currentVideoTitle, format: subtitleFormat, sentences: sentences });
              shareEnterPractice();
              if (wantBilingual && aicHasTranslation(sentences)) setBilingual(true);
              return;
            }
          }
        }
      } catch (e) { console.warn('Không đọc được file chia sẻ:', e); }

      // (b) Không có file chia sẻ -> thử mở video từ thư viện của trang
      let title = '';
      if (categoryStructure) {
        Object.keys(categoryStructure).forEach((k) => { if (categoryStructure[k] && categoryStructure[k][vid]) title = categoryStructure[k][vid]; });
      }
      const meta = videoMetadataMap[vid];
      if (meta && meta.title) title = meta.title;
      const ok = await selectCategoryVideo(vid, title);
      if (ok) { if (wantBilingual && aicHasTranslation(sentences)) setBilingual(true); }
      else showVocabToast('Không tìm thấy dữ liệu chia sẻ của video này (thiếu file .share.json trên hosting)', false);
    }


    // ==================== ĐẾM LƯỢT TRUY CẬP & SỐ THIẾT BỊ ĐÃ TỪNG VÀO ====================
    // Dùng dịch vụ đếm công khai, miễn phí (countapi.mileshilliard.com) vì trang này không có backend riêng.
    // Mỗi lần tải trang -> +1 "lượt truy cập". Mỗi thiết bị/trình duyệt CHỈ được tính +1 vào "số người dùng"
    // đúng 1 lần duy nhất (đánh dấu lại trong localStorage của máy đó để không đếm trùng ở các lần sau).
    // Lưu ý: đây chỉ là số liệu tương đối, có thể bị thiếu ở người dùng chặn tracker/quảng cáo, và sẽ đếm
    // trùng nếu người dùng xoá dữ liệu trình duyệt hoặc dùng nhiều trình duyệt/thiết bị khác nhau.
    const SITE_COUNTER_BASE = 'https://countapi.mileshilliard.com/api/v1';
    const SITE_COUNTER_VIEWS_KEY = 'shadowingmaster_pageviews_if13mn4r';
    const SITE_COUNTER_USERS_KEY = 'shadowingmaster_uniqueusers_if13mn4r';
    const SITE_COUNTER_DEVICE_FLAG = 'shadowing_master_device_counted_v1';

    function siteCounterRenderText(views, users) {
      const el = document.getElementById('site-counter-footer');
      if (!el) return;
      const parts = [];
      if (views != null) parts.push(`<span>${views.toLocaleString('vi-VN')} lượt truy cập</span>`);
      if (users != null) parts.push(`<span>${users.toLocaleString('vi-VN')} người dùng</span>`);
      el.innerHTML = parts.join('<span>·</span>');
    }

    async function initSiteCounters() {
      try {
        const viewsRes = await fetch(`${SITE_COUNTER_BASE}/hit/${SITE_COUNTER_VIEWS_KEY}`, { cache: 'no-store' });
        const viewsData = viewsRes.ok ? await viewsRes.json() : null;
        const views = viewsData && viewsData.value != null ? Number(viewsData.value) : null;

        let alreadyCounted = false;
        try { alreadyCounted = localStorage.getItem(SITE_COUNTER_DEVICE_FLAG) === '1'; } catch (e) {}

        let users = null;
        if (alreadyCounted) {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/get/${SITE_COUNTER_USERS_KEY}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
        } else {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/hit/${SITE_COUNTER_USERS_KEY}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
          try { localStorage.setItem(SITE_COUNTER_DEVICE_FLAG, '1'); } catch (e) {}
        }

        if (views != null || users != null) siteCounterRenderText(views, users);
        // Nếu dịch vụ đếm bị chặn (adblock/mạng công ty) hoặc lỗi -> âm thầm bỏ qua, không hiện gì cả,
        // không ảnh hưởng đến các chức năng khác của trang.
      } catch (e) { /* âm thầm bỏ qua */ }
    }

    // ---------- Đếm riêng cho từng video: "lượt xem" + "người học" (số thiết bị khác nhau đã xem video đó) ----------
    // Mỗi lần vào màn hình luyện tập của 1 video -> +1 lượt xem của riêng video đó. Mỗi thiết bị chỉ được
    // tính vào "người học" của video đó đúng 1 lần (khác với bộ đếm tổng của cả trang ở trên).
    async function trackAndShowVideoStats(videoId) {
      const el = document.getElementById('video-stats-footer');
      if (el) el.innerHTML = '';
      try { if (window.csIpaReset) csIpaReset(); } catch (e) {}   // giao diện Mặc định: mỗi video mở ra đều tắt IPA ở thẻ phụ đề
      try { if (window.VP && VP.onVideoOpen) VP.onVideoOpen(); } catch (e) {}   // điện thoại / máy tính bảng: mỗi video mở ra đều tắt "Phụ đề Việt" ở nút CC
      try { if (window.VP) VP.renderInfo(videoId); } catch (e) {}   // tiêu đề + kênh + lượt xem dưới các nút điều hướng
      if (!videoId) return;
      const viewsKey = `shadowingmaster_vv_if13mn4r_${videoId}`;
      const usersKey = `shadowingmaster_vu_if13mn4r_${videoId}`;
      const deviceFlagKey = `shadowing_master_video_user_counted_${videoId}`;
      try {
        const viewsRes = await fetch(`${SITE_COUNTER_BASE}/hit/${viewsKey}`, { cache: 'no-store' });
        const viewsData = viewsRes.ok ? await viewsRes.json() : null;
        const views = viewsData && viewsData.value != null ? Number(viewsData.value) : null;

        let alreadyCounted = false;
        try { alreadyCounted = localStorage.getItem(deviceFlagKey) === '1'; } catch (e) {}

        let users = null;
        if (alreadyCounted) {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/get/${usersKey}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
        } else {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/hit/${usersKey}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
          try { localStorage.setItem(deviceFlagKey, '1'); } catch (e) {}
        }

        // Phòng trường hợp người dùng đã chuyển sang video khác trong lúc đang đợi kết quả -> không ghi đè nhầm.
        if (el && currentVideoId === videoId) {
          const parts = [];
          if (views != null) parts.push(`<span>${views.toLocaleString('vi-VN')} lượt xem</span>`);
          if (users != null) parts.push(`<span>${users.toLocaleString('vi-VN')} người học</span>`);
          el.innerHTML = parts.join('<span>·</span>');
        }
      } catch (e) { /* âm thầm bỏ qua */ }
    }

    document.addEventListener('DOMContentLoaded', () => {
      if (window.lucide && window.lucide.createIcons) { window.lucide.createIcons(); }
      initSiteCounters();

      applySubtitleFontSize(currentSubFontSize);
      applySubtitleLineHeight();

      updateRateUI(settings.playbackRate);

      const karaokeBtn = document.getElementById('btn-toggle-karaoke');
      if (!settings.karaokeMode) karaokeBtn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';


      const autoScrollBtn = document.getElementById('btn-toggle-autoscroll');
      if (settings.autoScroll) {
        autoScrollBtn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-red-600/30 text-red-200 border-red-500/60 glow-red shrink-0 whitespace-nowrap';
      } else {
        autoScrollBtn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';
      }

      updateSentenceAutoStopUI();

      renderHistorySection();
      updateVocabBadges();
      const hasShareHash = /^#share=/.test(location.hash || '');
      const catPromise = loadCategoryData();
      if (!hasShareHash && new URLSearchParams(location.search).get('v')) catPromise.then(() => openSharedFromQuery());
      initSplitResizer();
      ensurePageFocus();
      if (hasShareHash) openSharedFromHash();
      if (window.__routerBoot) window.__routerBoot(catPromise, hasShareHash || !!new URLSearchParams(location.search).get('v'));
    });

    // ==================== NHẬN DỮ LIỆU TỪ EXTENSION "ShadowingStudio Importer" ====================
    // Extension gửi: { videoId, title, lang, kind, raw } - `raw` là file json3 gốc của YouTube
    // (giống hệt file lưu thủ công từ tab Network), nên dùng lại parseAnySubtitle() có sẵn.
    function importFromExtension(p) {
      if (p && p.type === 'article') return importArticleFromExtension(p);
      if (!p || !p.videoId || !p.raw) { showVocabToast('Dữ liệu từ extension không hợp lệ', false); return false; }
      let res = parseAnySubtitle(`${p.videoId}.json3`, JSON.stringify(p.raw));
      if (!res || !res.sentences || !res.sentences.length) {
        showVocabToast('Extension đã gửi phụ đề nhưng app không đọc được', false);
        return false;
      }
      // Extension v1.1+: có kèm phụ đề thủ công tiếng Pháp do người làm video upload -> ghép vào bản tự động
      // (chữ + dấu câu + chia câu theo người làm, thời gian từng từ theo ASR). Lỗi/không khớp -> giữ nguyên bản ASR như cũ.
      let mergeInfo = null, mergeFailed = false;
      if (p.manual && p.manual.raw) {
        try {
          const mr = mergeManualIntoAsr(res.sentences, mcJson3ToText(p.manual.raw));
          if (mr.ok && mr.sentences.length) {
            res = { format: res.format, sentences: mr.sentences };
            mergeInfo = mr.stats;
          } else {
            mergeFailed = true;
            console.warn('[merge] Không ghép được phụ đề người làm:', mr.error);
          }
        } catch (err) { mergeFailed = true; console.error('[merge]', err); }
      }
      const meta = {};
      if (p.channelTitle) meta.channelTitle = String(p.channelTitle).slice(0, 120);
      if (p.channelAvatar && /^https:\/\//.test(p.channelAvatar)) meta.channelAvatar = String(p.channelAvatar);
      if (Number(p.viewCount) > 0) meta.viewCount = Number(p.viewCount);
      const dur = Number(p.duration) > 0 ? Number(p.duration) : 0;
      sharedNoSaveId = '';
      const existing = getLocalHistory().find((h) => h.videoId === p.videoId && !h.isText);
      // Video đã có bản dịch song ngữ trong lịch sử -> mở bản đã lưu, tránh ghi đè mất bản dịch
      if (existing && existing.sentences && existing.sentences.length && aicHasTranslation(existing.sentences)) {
        showVocabToast('Video này đã có bản dịch trong lịch sử, đang mở bản đã lưu', false);
        saveToLocalHistory(Object.assign({}, existing, { meta: Object.assign({}, existing.meta, meta), duration: existing.duration || dur }));   // cập nhật tên kênh/lượt xem mới nhất
        loadFromHistory(p.videoId);
        return true;
      }
      currentVideoId = String(p.videoId);
      currentVideoTitle = (p.title || '').trim() || (existing && existing.title) || `Video ${p.videoId}`;
      subtitleFormat = res.format;
      sentences = res.sentences;
      inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
      inputUrl.dispatchEvent(new Event('input'));
      fileStatusText.textContent = `Từ extension: ${res.sentences.length} câu (${res.format.toUpperCase()}${mergeInfo ? ' + phụ đề người làm' : ''})`;
      fileStatusBadge.classList.remove('hidden');
      aiOnSubtitlesLoaded();
      saveToLocalHistory({ videoId: currentVideoId, title: currentVideoTitle, duration: dur, meta: meta, format: subtitleFormat, sentences: sentences });
      shareEnterPractice();
      showVocabToast(
        mergeInfo ? `Đã import và ghép phụ đề người làm (${mergeInfo.coverage}% từ khớp)`
          : mergeFailed ? 'Đã import (phụ đề người làm không khớp nên dùng bản tự động)'
          : 'Đã import video từ YouTube',
        false
      );
      return true;
    }


    // ==================== NHẬN BÀI ĐỌC (BÀI BÁO / IELTS READING) TỪ EXTENSION ====================
    // Extension gửi: { type:'article', title, url, site, blocks:[ {t:'h'|'p', x}, {t:'img', d (dataURL), u (link gốc), a, c} ] }
    // -> tách câu, gắn ảnh / đầu đoạn / tiêu đề vào đúng câu rồi mở ở chế độ "Luyện với văn bản".
    // Ảnh lưu trong IndexedDB riêng (localStorage quá nhỏ); trong lịch sử chỉ giữ tham chiếu nhỏ { k, u, a, c }.
    const TXI_DB_NAME = 'shadowing_text_images_v1';
    let txiDbP = null;
    const txiCache = new Map();

    function txiDb() {
      if (txiDbP) return txiDbP;
      txiDbP = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('Trình duyệt này không hỗ trợ IndexedDB')); return; }
        const rq = indexedDB.open(TXI_DB_NAME, 1);
        rq.onupgradeneeded = () => { rq.result.createObjectStore('imgs', { keyPath: 'k' }); };
        rq.onsuccess = () => resolve(rq.result);
        rq.onerror = () => reject(rq.error);
      });
      txiDbP.catch(() => { txiDbP = null; });
      return txiDbP;
    }
    function txiPut(items) {
      if (!items.length) return Promise.resolve();
      return txiDb().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction('imgs', 'readwrite');
        const st = tx.objectStore('imgs');
        items.forEach((it) => { st.put(it); txiCache.set(it.k, it.d); });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('abort'));
      }));
    }
    function txiGet(k) {
      if (txiCache.has(k)) return Promise.resolve(txiCache.get(k));
      return txiDb().then((db) => new Promise((resolve) => {
        const rq = db.transaction('imgs').objectStore('imgs').get(k);
        rq.onsuccess = () => { const v = (rq.result && rq.result.d) || null; if (v) txiCache.set(k, v); resolve(v); };
        rq.onerror = () => resolve(null);
      })).catch(() => null);
    }
    // Dọn ảnh của những bài đã bị xóa khỏi lịch sử (bỏ qua ảnh mới lưu < 2 phút để không xóa nhầm khi đang import)
    function txiGc() {
      txiDb().then((db) => {
        const live = new Set(getLocalHistory().filter((h) => h.isText).map((h) => h.videoId));
        const st = db.transaction('imgs', 'readwrite').objectStore('imgs');
        const rq = st.openCursor();
        rq.onsuccess = () => {
          const c = rq.result;
          if (!c) return;
          const doc = String(c.key).split('#')[0];
          if (!live.has(doc) && Date.now() - ((c.value && c.value.ts) || 0) > 120000) { txiCache.delete(c.key); c.delete(); }
          c.continue();
        };
      }).catch(() => {});
    }
    document.addEventListener('DOMContentLoaded', () => setTimeout(txiGc, 5000));

    function txiOpenLightbox(src) {
      if (!src) return;
      const old = document.getElementById('txi-lightbox');
      if (old) old.remove();
      const box = document.createElement('div');
      box.id = 'txi-lightbox';
      const im = document.createElement('img');
      im.src = src;
      box.appendChild(im);
      box.onclick = () => box.remove();
      document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { box.remove(); document.removeEventListener('keydown', esc); } });
      document.body.appendChild(box);
    }

    // Vẽ một ảnh của bài đọc (ảnh lấy từ IndexedDB; nếu mất thì thử link gốc; không có gì thì ẩn)
    function txiRenderFigure(im) {
      const fig = document.createElement('figure');
      fig.className = 'txt-figure';
      const img = document.createElement('img');
      img.alt = im.a || '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      let triedRemote = false;
      img.onerror = () => {
        if (!triedRemote && im.u && img.src !== im.u) { triedRemote = true; img.src = im.u; }
        else fig.remove();
      };
      img.onclick = () => txiOpenLightbox(img.currentSrc || img.src);
      fig.appendChild(img);
      if (im.c) {
        const cap = document.createElement('figcaption');
        cap.textContent = im.c;
        fig.appendChild(cap);
      }
      if (im.k) {
        txiGet(im.k).then((d) => {
          if (d) img.src = d;
          else if (im.u) { triedRemote = true; img.src = im.u; }
          else fig.remove();
        });
      } else if (im.u) { triedRemote = true; img.src = im.u; }
      else fig.remove();
      return fig;
    }

    // Nhãn đoạn kiểu "A." / "B." / "(i)" hay bị tách riêng thành một "câu" -> gộp vào câu kế tiếp
    function txiSplitParagraph(text) {
      const parts = splitProseIntoSentences(text).map((x) => x.text);
      if (parts.length > 1 && /^(?:[A-Za-z]|[IVXivx]{1,4}|\d{1,2})[.)]$|^\((?:[A-Za-z]|[ivxIVX]{1,4}|\d{1,2})\)$/.test(parts[0])) {
        parts[1] = parts[0] + ' ' + parts[1];
        parts.shift();
      }
      return parts;
    }

    function txiBuildSentences(seq) {
      const out = [];
      let pending = [];
      const add = (text, extra) => {
        const s = { id: out.length + 1, startTime: out.length, endTime: out.length + 1, text: text };
        if (extra) Object.assign(s, extra);
        if (pending.length) { s.imgs = pending; pending = []; }
        out.push(s);
      };
      seq.forEach((b) => {
        if (b.t === 'img') { pending.push(b.ref); return; }
        if (b.t === 'h' && (b.title || b.x.split(/\s+/).length <= 25)) { add(b.x, b.title ? { hd: 1, ti: 1 } : { hd: 1 }); return; }
        txiSplitParagraph(b.x).forEach((t, i) => add(t, i === 0 ? { ps: 1 } : null));
      });
      if (pending.length && out.length) {
        const last = out[out.length - 1];
        last.imgs = (last.imgs || []).concat(pending);   // ảnh nằm cuối bài: gắn vào câu cuối
      }
      return out;
    }

    function importArticleFromExtension(p) {
      const blocks = Array.isArray(p.blocks) ? p.blocks : [];
      const textOf = (b) => String((b && b.x) || '').replace(/\s+/g, ' ').trim();
      const textBlocks = blocks.filter((b) => b && (b.t === 'h' || b.t === 'p') && textOf(b));
      if (!textBlocks.length) { showVocabToast('Bài đọc từ extension không có nội dung chữ', false); return false; }
      sharedNoSaveId = '';
      // Cùng mã với cách dán tay (textDocHash) nên import lại đúng bài đó sẽ mở bản đã lưu, giữ nguyên bản dịch
      const rawText = textBlocks.map(textOf).join('\n\n');
      const docId = `txt_${textDocHash(rawText)}`;

      const seq = [], putList = [];
      let n = 0;
      blocks.forEach((b) => {
        if (!b) return;
        if (b.t === 'img') {
          n++;
          const ref = { a: String(b.a || '').slice(0, 200), c: String(b.c || '').slice(0, 400) };
          if (typeof b.d === 'string' && /^data:image\//.test(b.d)) { ref.k = `${docId}#${n}`; putList.push({ k: ref.k, d: b.d, ts: Date.now() }); }
          if (typeof b.u === 'string' && /^https?:\/\//.test(b.u) && b.u.length <= 800) ref.u = b.u;
          if (ref.k || ref.u) seq.push({ t: 'img', ref });
        } else if ((b.t === 'h' || b.t === 'p') && textOf(b)) {
          seq.push({ t: b.t, x: textOf(b) });
        }
      });

      const saved = getLocalHistory().find((h) => h.videoId === docId && h.isText && h.sentences && h.sentences.length);
      const hasNewImgs = seq.some((b) => b.t === 'img');
      const savedHasImgs = !!(saved && saved.sentences.some((s) => s.imgs && s.imgs.length));
      // Đã luyện/dịch rồi (hoặc đã có ảnh) -> dùng lại bản đã lưu để không mất bản dịch song ngữ
      const reuse = !!saved && (aicHasTranslation(saved.sentences) || savedHasImgs || !hasNewImgs);

      txiPut(putList).catch((e) => console.warn('[bài đọc] không lưu được ảnh:', e)).then(() => {
        const parsed = reuse ? aiClone(saved.sentences) : txiBuildSentences(seq);
        if (!parsed.length) { showVocabToast('Không tách được câu nào từ bài đọc này', false); return; }
        // Tiêu đề = hàng chữ đầu tiên của văn bản đã bôi đen (không dùng tiêu đề trang web)
        const title = titleFromLines(textBlocks.map(textOf)) || (saved && saved.title) || deriveTextTitle(parsed);
        openTextSession(docId, title, parsed);
        showVocabToast(reuse && saved ? 'Bài này đã có trong lịch sử, đã mở bản đã lưu' : 'Đã import bài đọc từ extension', false);
        setTimeout(txiGc, 6000);
      });
      return true;
    }

    window.addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'SHADOWING_IMPORT') return;
      if (e.source !== window && e.source !== window.opener) return;
      if (e.source && typeof e.source.postMessage === 'function') {
        try { e.source.postMessage({ type: 'SHADOWING_IMPORT_ACK' }, '*'); } catch (err) {}
      }
      try { importFromExtension(e.data.payload); } catch (err) { console.error(err); showVocabToast('Import bị lỗi', false); }
    });

    // ==================== NHẬN TỪ VỰNG TỪ EXTENSION ====================
    // Bôi đen 1 từ ở trang web bất kỳ -> chuột phải -> Shadowing Studio -> "Lưu từ vựng": extension đẩy mục từ vựng sang đây.
    // Trả về false nếu không ghi được (để extension giữ lại hàng chờ và thử lại), true nếu đã xử lý xong.
    function saveVocabFromExtension(items) {
      const list = getVocab();
      const key = (x) => `${x.videoId}|${String(x.text).toLowerCase()}|${Math.round(x.t || 0)}`;
      const seenKeys = new Set(list.map(key)), seenIds = new Set(list.map((x) => x.id));
      let added = 0, dup = 0, last = null;
      items.forEach((raw) => {
        if (!raw || typeof raw !== 'object') return;
        const en = String(raw.en || '').slice(0, 3000);
        const text = String(raw.text || '').trim().slice(0, 1000);
        const hs = Math.max(0, Math.min(en.length, parseInt(raw.hs, 10) || 0));
        const he = Math.max(hs, Math.min(en.length, parseInt(raw.he, 10) || 0));
        if (!text || !en || he <= hs) return;
        const n = text.split(/\s+/).length;
        const item = {
          id: String(raw.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6))).slice(0, 40),
          text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'),
          en, hs, he, vi: '', prev: String(raw.prev || '').slice(0, 1500),
          videoId: String(raw.videoId || 'art_web').slice(0, 80), videoTitle: String(raw.videoTitle || '').slice(0, 200),
          t: 0, createdAt: Number(raw.createdAt) || Date.now()
        };
        if (/^https?:\/\//i.test(String(raw.srcUrl || ''))) item.srcUrl = String(raw.srcUrl).slice(0, 800);
        if (seenIds.has(item.id) || seenKeys.has(key(item))) { dup++; return; }
        seenIds.add(item.id); seenKeys.add(key(item));
        list.unshift(item); added++; last = item;
      });
      if (!added) { if (dup) showVocabToast('Từ này đã được lưu trước đó', true); return true; }
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return false; }
      updateVocabBadges();
      const scr = document.getElementById('screen-vocab');
      if (scr && !scr.classList.contains('hidden')) renderVocabPageKeepScroll();
      const short = last.text.length > 40 ? last.text.slice(0, 40) + '…' : last.text;
      showVocabToast(added === 1 ? `Đã lưu “${short}” từ trang web` : `Đã lưu ${added} từ vựng từ trang web`, true, added === 1 ? last.id : undefined, added === 1);
      return true;
    }
    window.addEventListener('message', (e) => {
      if (e.source !== window || !e.data || e.data.type !== 'SHADOWING_SAVE_VOCAB') return;
      const items = Array.isArray(e.data.items) ? e.data.items : [];
      let ok = false;
      try { ok = saveVocabFromExtension(items); } catch (err) { console.error(err); showVocabToast('Lưu từ vựng từ extension bị lỗi', false); }
      if (ok) window.postMessage({ type: 'SHADOWING_SAVE_VOCAB_ACK', ids: items.map((x) => x && x.id).filter(Boolean) }, location.origin);   // báo extension đã xử lý để nó xoá khỏi hàng chờ
    });
    document.addEventListener('DOMContentLoaded', () => {
      window.postMessage({ type: 'SHADOWING_READY' }, location.origin);
    });

    // Tự ẩn dải hướng dẫn cài extension khi phát hiện extension đã cài
    // (app-bridge.js của extension gắn data-shadowing-extension="1" lên <html>).
    (function () {
      function syncExtStrip() {
        const el = document.getElementById('ext-install-strip');
        if (el) el.hidden = document.documentElement.dataset.shadowingExtension === '1';
      }
      syncExtStrip();
      document.addEventListener('DOMContentLoaded', syncExtStrip);
      try {
        new MutationObserver(syncExtStrip).observe(document.documentElement, { attributes: true, attributeFilter: ['data-shadowing-extension'] });
      } catch (e) {}
      setTimeout(syncExtStrip, 800);
    })();

    // Đếm từ + nút xóa nhanh trong "Luyện với văn bản"
    document.addEventListener('DOMContentLoaded', () => {
      const ta = document.getElementById('text-shadow-textarea');
      const wc = document.getElementById('text-wc');
      const clr = document.getElementById('text-clear-btn');
      if (!ta || !wc) return;
      const upd = () => { const t = ta.value.trim(); wc.textContent = t ? t.split(/\s+/).length : 0; };
      ta.addEventListener('input', upd);
      if (clr) clr.addEventListener('click', () => { ta.value = ''; upd(); ta.focus(); });
      upd();
    });
