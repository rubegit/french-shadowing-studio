    function playFromBeginning() {
      seekToTime(0, 0, true, null, true);
    }

    function seekRelative(seconds) {
      if (!ytPlayer || !ytPlayer.getCurrentTime) return;
      const current = ytPlayer.getCurrentTime();
      const target = Math.max(0, current + seconds);
      seekToTime(target, undefined, true, null, true);
    }

    const STORAGE_KEY = 'shadowing_master_user_history';

    // ===== Video thuộc "Thư viện có sẵn": KHÔNG lưu phụ đề vào localStorage =====
    // Mỗi lần mở, app luôn tải phụ đề word-level + bản dịch song ngữ mới nhất từ server.
    // Chỉ lưu phụ đề vào localStorage khi người dùng TỰ nạp bản dịch song ngữ (server chưa có, hoặc họ xóa bản của server rồi nạp bản mới).
    // Với video thư viện còn lại, lịch sử chỉ giữ một "thẻ" gọn (id, tiêu đề, thời lượng, sentences: []) để hàng "Video Bạn Đã Luyện Gần Đây" vẫn hiện.
    let userTransVid = '';       // videoId đang có bản dịch song ngữ do NGƯỜI DÙNG tự nạp
    let userPunctVid = '';       // videoId đang có phụ đề sửa câu/từ do NGƯỜI DÙNG tự áp dụng
    let pendingUserVi = false;   // người dùng vừa tự nạp phụ đề/bản dịch ở màn hình nhập, chờ startPractice gắn cờ theo videoId
    let pendingUserPunct = false;

    function isLibraryVideo(vid) {
      if (vid && hiddenVideoMap[vid]) return true;   // video ẩn (catalog_<nguồn>.json) cũng coi là video của trang: lịch sử chỉ giữ thẻ gọn
      if (!vid || !categoryStructure || typeof categoryStructure !== 'object') return false;
      return Object.keys(categoryStructure).some((k) => k !== 'Article' && categoryStructure[k] && typeof categoryStructure[k] === 'object' && categoryStructure[k][vid] !== undefined);
    }

    // Dọn lịch sử cũ: video thư viện không có bản dịch của người dùng -> bỏ phần phụ đề đã lưu (giữ thẻ gọn)
    function slimLibraryHistory() {
      try {
        const hist = getLocalHistory();
        let changed = false;
        hist.forEach((h) => {
          if (h.isText || h.userTrans === true || h.userPunct === true || !isLibraryVideo(h.videoId)) return;
          if (h.sentences && h.sentences.length && !aicHasTranslation(h.sentences)) { h.sentences = []; h.lib = true; changed = true; }
        });
        if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(hist));
      } catch (e) {}
    }
    let sharedNoSaveId = '';   // videoId đang xem từ link chia sẻ (không tự ghi đè lịch sử của người xem)
    let isTextMode = false;    // đang ở chế độ luyện shadowing với văn bản thuần (không có video)

    // Đọc raw history (bao gồm tombstone _deleted) từ localStorage
    function getRawHistory() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }
    // getLocalHistory() trả về danh sách sạch (không có tombstone) cho UI
    function getLocalHistory() {
      return getRawHistory().filter(function(h) { return !h._deleted; });
    }

    function saveToLocalHistory(item) {
      try {
        const raw = getRawHistory();
        const prevItem = raw.find(h => h.videoId === item.videoId && !h._deleted);
        const isLib = !item.isText && isLibraryVideo(item.videoId);
        const userTrans = item.userTrans !== undefined ? !!item.userTrans : (userTransVid === item.videoId);
        const userPunct = item.userPunct !== undefined ? !!item.userPunct : (typeof userPunctVid !== 'undefined' && userPunctVid === item.videoId);
        const keepSentences = !isLib || userTrans || userPunct;   // video thư viện: giữ phụ đề khi là bản dịch hoặc dấu câu/sửa từ của người dùng
        const mergedMeta = Object.assign({}, prevItem && prevItem.meta, item.meta);
        const now = Date.now();
        const HIST_TOMBSTONE_TTL = 30 * 24 * 60 * 60 * 1000;

        // Xóa sạch bản ghi cũ và tombstone cũ của videoId này
        let history = raw.filter(h => h.videoId !== item.videoId);
        // Dọn tombstone hết hạn
        history = history.filter(h => !h._deleted || (h._deletedAt && (now - h._deletedAt) < HIST_TOMBSTONE_TTL));

        const userPunctAt = userPunct
          ? (item.userPunctAt !== undefined ? item.userPunctAt : (prevItem && prevItem.userPunctAt))
          : undefined;
        const userPunctRevertedAt = !userPunct
          ? (item.userPunctRevertedAt !== undefined ? item.userPunctRevertedAt : (prevItem && prevItem.userPunctRevertedAt))
          : undefined;

        history.unshift({
          videoId: item.videoId,
          title: item.title || `YouTube Video (${item.videoId})`,
          duration: item.duration || (prevItem && prevItem.duration) || 0,
          meta: Object.keys(mergedMeta).length ? mergedMeta : undefined,   // tên kênh / lượt xem của video import từ extension
          format: item.format || 'srt',
          isText: !!item.isText,
          sentences: keepSentences ? (item.sentences !== undefined ? item.sentences : (prevItem && prevItem.sentences) || []) : [],
          lib: isLib ? true : undefined,
          userTrans: userTrans ? true : undefined,
          userPunct: userPunct ? true : undefined,
          userPunctAt: userPunctAt,
          userPunctRevertedAt: userPunctRevertedAt,
          updatedAt: now
        });
        if (sharedNoSaveId && item.videoId === sharedNoSaveId) return;   // đang xem bản được chia sẻ: không ghi đè dữ liệu riêng của mình
        if (history.length > 20) {
          const vocabIds = new Set(getVocab().map((v) => v.videoId));
          const keep = history.slice(0, 20);
          // Video đã có bản dịch song ngữ hoặc có từ vựng đã lưu thì không bị dọn khỏi lịch sử
          history.slice(20).forEach((h) => { if (vocabIds.has(h.videoId) || aicHasTranslation(h.sentences)) keep.push(h); });
          history = keep;
        }
        let saved = false;
        while (!saved && history.length > 0) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); saved = true; }
          catch (quotaErr) {
            if (history.length <= 1) break;   // chỉ còn mục vừa lưu: không xoá nó nữa, báo lỗi bên dưới
            // hết dung lượng trình duyệt -> bỏ mục cũ nhất (ưu tiên bỏ mục chưa có bản dịch) rồi thử lại
            let idx = -1;
            for (let i = history.length - 1; i > 0; i--) { if (!aicHasTranslation(history[i].sentences)) { idx = i; break; } }
            if (idx < 0) idx = history.length - 1;
            history.splice(idx, 1);
          }
        }
        if (!saved) { try { showVocabToast('⚠ Bộ nhớ trình duyệt đã đầy nên không lưu được video này vào lịch sử. Hãy xóa bớt video cũ trong lịch sử.', false); } catch (e2) {} }
        renderHistorySection();
        if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncHistoryDebounced === 'function') {
          window.FSS_SUPABASE.syncHistoryDebounced(history);
        }
      } catch (e) {}
    }

    const ARCHIVED_TRANS_KEY = 'shadowing_archived_trans_v1';
    function getArchivedTranslations() {
      try {
        const raw = localStorage.getItem(ARCHIVED_TRANS_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) { return {}; }
    }
    function setArchivedTranslation(videoId, data) {
      if (!videoId || !data || !Array.isArray(data.sentences) || !data.sentences.length) return;
      try {
        const all = getArchivedTranslations();
        all[videoId] = {
          title: data.title || '',
          format: data.format || 'srt',
          sentences: data.sentences,
          meta: data.meta || null,
          archivedAt: Date.now()
        };
        const keys = Object.keys(all);
        if (keys.length > 30) {
          keys.sort((a, b) => (all[a].archivedAt || 0) - (all[b].archivedAt || 0))
              .slice(0, keys.length - 30)
              .forEach(k => delete all[k]);
        }
        localStorage.setItem(ARCHIVED_TRANS_KEY, JSON.stringify(all));
      } catch (e) {}
    }
    function getArchivedTranslation(videoId) {
      if (!videoId) return null;
      const all = getArchivedTranslations();
      return all[videoId] || null;
    }
    function removeArchivedTranslation(videoId) {
      try {
        const all = getArchivedTranslations();
        if (all[videoId]) {
          delete all[videoId];
          localStorage.setItem(ARCHIVED_TRANS_KEY, JSON.stringify(all));
        }
      } catch (e) {}
    }
    window.getArchivedTranslations = getArchivedTranslations;
    window.setArchivedTranslation = setArchivedTranslation;
    window.getArchivedTranslation = getArchivedTranslation;
    window.removeArchivedTranslation = removeArchivedTranslation;

    function removeHistoryItem(videoId, e) {
      if (e) e.stopPropagation();
      try {
        const raw = getRawHistory();
        const currentItem = raw.find(function(h) { return h.videoId === videoId; });
        if (currentItem && currentItem.sentences && typeof aicHasTranslation === 'function' && aicHasTranslation(currentItem.sentences)) {
          if (!confirm('Video này đã có bản dịch song ngữ tiếng Việt. Bạn có chắc chắn muốn xóa không?')) {
            return;
          }
          // Lưu dự phòng bản dịch song ngữ trước khi xóa để có thể hỏi khôi phục khi nạp lại
          setArchivedTranslation(videoId, {
            title: currentItem.title,
            format: currentItem.format,
            sentences: currentItem.sentences,
            meta: currentItem.meta
          });
        }

        // Kiểm tra và hỏi dọn dẹp từ vựng liên quan tương ứng với video này
        const breakdown = typeof window.getScopeVocabBreakdown === 'function'
          ? window.getScopeVocabBreakdown('video:' + videoId)
          : { deleted: 0, contextOnly: 0, total: 0 };

        if (breakdown.total > 0) {
          let vocabMsg = `Video này có ${breakdown.total} từ vựng liên quan:\n`;
          if (breakdown.deleted > 0 && breakdown.contextOnly > 0) {
            vocabMsg += `• ${breakdown.deleted} từ chỉ có trong video này\n`;
            vocabMsg += `• ${breakdown.contextOnly} từ dùng chung với bài khác\n\n`;
            vocabMsg += `Bạn có muốn dọn dẹp từ vựng của video này không?\n\n`;
            vocabMsg += `• Bấm OK: Xóa video, xóa ${breakdown.deleted} từ độc lập và gỡ ngữ cảnh của ${breakdown.contextOnly} từ dùng chung\n`;
            vocabMsg += `• Bấm Hủy (Cancel): Chỉ xóa video, GIỮ NGUYÊN toàn bộ từ vựng`;
          } else {
            vocabMsg += `Bạn có muốn XÓA LUÔN toàn bộ ${breakdown.total} từ vựng tương ứng với video này không?\n\n`;
            vocabMsg += `• Bấm OK: Xóa cả video VÀ xóa toàn bộ ${breakdown.total} từ vựng\n`;
            vocabMsg += `• Bấm Hủy (Cancel): Chỉ xóa video, GIỮ LẠI từ vựng`;
          }

          if (confirm(vocabMsg)) {
            if (typeof window.deleteVocabByVideo === 'function') {
              window.deleteVocabByVideo(videoId);
            }
          }
        }

        // Đánh tombstone thay vì xóa cứng để sync đúng sang máy khác
        const now = Date.now();
        const HIST_TOMBSTONE_TTL = 30 * 24 * 60 * 60 * 1000;
        let found = false;
        const updated = raw.map(function(h) {
          if (h.videoId !== videoId) return h;
          found = true;
          // Giữ lại thẻ gọn (không có sentences) để tiết kiệm dung lượng
          return { videoId: h.videoId, _deleted: true, _deletedAt: now };
        });
        if (!found) { renderHistorySection(); return; }
        // Dọn tombstone hết TTL
        const validList = updated.filter(function(h) {
          if (!h._deleted) return true;
          return h._deletedAt && (now - h._deletedAt) < HIST_TOMBSTONE_TTL;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validList));
        renderHistorySection();
        if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncHistoryDebounced === 'function') {
          window.FSS_SUPABASE.syncHistoryDebounced(validList);
        }
      } catch (e) {}
    }

    function clearAllHistory() {
      if (!confirm('Bạn có chắc muốn xóa toàn bộ lịch sử luyện tập trên thiết bị này?')) return;
      localStorage.removeItem(STORAGE_KEY);
      renderHistorySection();
    }

    function loadFromHistory(videoId) {
      const history = getLocalHistory();
      const item = history.find(h => h.videoId === videoId);
      if (!item) return;
      // Video thư viện (không có bản dịch riêng và không có sửa câu/từ riêng của người dùng) -> tải mới từ server thay vì dùng dữ liệu lưu trên máy
      if (!item.isText && (isLibraryVideo(videoId) || item.lib === true) && item.userTrans !== true && item.userPunct !== true) { selectCategoryVideo(videoId, item.title, (typeof libCatState !== 'undefined' && libCatState && libCatState.cat === LIB_RECENT) ? 'hp-' : 'hist-'); return; }
      if (!item.sentences || item.sentences.length === 0) return;
      if (!item.isText) {
        userTransVid = item.userTrans === true ? videoId : '';
        userPunctVid = item.userPunct === true ? videoId : '';
      }

      // Bài văn bản đã lưu -> mở lại ở chế độ luyện văn bản (giữ nguyên cả bản dịch song ngữ)
      if (item.isText) {
        pendingSeekTime = null;
        openTextSession(item.videoId, item.title, aiClone(item.sentences));
        return;
      }

      currentVideoId = item.videoId;
      sentences = item.sentences;
      subtitleFormat = item.format;
      currentVideoTitle = item.title;

      captureHomeState();   // chụp trạng thái trang chủ trước khi lưu lịch sử (lưu lịch sử có thể làm hàng đầu trang đổi)
      saveToLocalHistory(item);

      document.getElementById('screen-vocab').classList.add('hidden');
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();
      currentSentenceIndex = 0;
      isTextMode = false;
      document.body.classList.remove('text-mode');
      resetPlaybackTrackingState();
      initYouTubePlayer();
      renderSubtitleList();
      if (window.activeRightPanelTab === 'keyvocab' && typeof window.renderRightPanelKeyVocab === 'function') {
        window.renderRightPanelKeyVocab();
      }
      const scrollBox0 = document.getElementById('subtitles-scroll-container');
      if (scrollBox0) scrollBox0.scrollTop = 0;
      updateActiveSentenceDisplay();
      if (window.lucide && window.lucide.createIcons) { window.lucide.createIcons(); }
      ensurePageFocus();
      trackAndShowVideoStats(currentVideoId);   // thẻ tên video / kênh / lượt xem (trước đây đường mở từ lịch sử bỏ sót bước này)
    }

    // Hàng "Video Bạn Đã Luyện Gần Đây" nằm ngay trong thư viện (đầu danh sách), nên làm mới = vẽ lại thư viện.
    function renderHistorySection() {
      // Chỉ làm mới hàng "Video Bạn Đã Luyện Gần Đây" + hàng văn bản; KHÔNG vẽ lại cả thư viện (trước đây mỗi lần
      // lịch sử đổi / quay lại trang chủ là dựng lại toàn bộ hàng video -> chậm).
      if (homeFrozen) { homeHistoryDirty = true; return; }   // đang ở màn luyện tập: để lúc quay lại mới làm mới, trang chủ không bị xê dịch trước khi rời đi
      renderRecentHistoryRow();
      renderTextHistoryRow();
      if (window.libRefreshRecentPage) window.libRefreshRecentPage();
    }

    function parseYouTubeId(url) {
      if (!url) return null;
      const clean = url.trim();
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|shorts\/)([^#&?]*).*/;
      const match = clean.match(regExp);
      if (match && match[2].length === 11) return match[2];
      if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean;
      return null;
    }

    // Thời lượng hiển thị trên thẻ video: từ 1 giờ trở lên thì dạng 1:14:31 (thay vì 74:31)
    function formatDurationLabel(seconds) {
      if (isNaN(seconds) || seconds < 0) return '0:00';
      const total = Math.floor(seconds);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const sec = total % 60;
      const ss = sec < 10 ? '0' + sec : '' + sec;
      return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${ss}` : `${m}:${ss}`;
    }

    function formatTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return '0:00';
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    const inputUrl = document.getElementById('input-youtube-url');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const btnStart = document.getElementById('btn-start-practice');
    const ctaGlowContainer = document.getElementById('cta-glow-container');
    const fileStatusBadge = document.getElementById('file-status-badge');
    const fileStatusText = document.getElementById('file-status-text');
    const parseErrorAlert = document.getElementById('parse-error-alert');
    const parseErrorMessage = document.getElementById('parse-error-message');

    function checkStartReady() {
      const vid = parseYouTubeId(inputUrl.value);
      const isReady = Boolean(vid && sentences.length > 0);
      btnStart.disabled = !isReady;
      if (isReady) {
        ctaGlowContainer.classList.remove('disabled');
      } else {
        ctaGlowContainer.classList.add('disabled');
      }
    }

    function pasteYoutubeUrl() {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (t) {
          var inp = document.getElementById('input-youtube-url');
          if (inp && t) {
            inp.value = t.trim();
            inp.dispatchEvent(new Event('input'));
          } else if (inp) {
            inp.focus();
          }
        }).catch(function () {
          var inp = document.getElementById('input-youtube-url');
          if (inp) inp.focus();
        });
      } else {
        var inp = document.getElementById('input-youtube-url');
        if (inp) inp.focus();
      }
    }
    window.pasteYoutubeUrl = pasteYoutubeUrl;

    inputUrl.addEventListener('input', () => {
      const vid = parseYouTubeId(inputUrl.value);
      const feedback = document.getElementById('youtube-url-feedback');
      if (inputUrl.value && !vid) {
        feedback.innerHTML = '<span class="text-red-400">Không tìm thấy Video ID hợp lệ.</span>';
      } else if (vid) {
        feedback.innerHTML = `<span class="text-emerald-400">Video ID: <strong class="font-mono">${vid}</strong></span>`;
      } else {
        feedback.innerHTML = '<span>Chấp nhận định dạng: watch?v=, youtu.be/, shorts/</span>';
      }
      checkStartReady();
    });

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-400', 'bg-[#091330]');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-blue-400', 'bg-[#091330]');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-400', 'bg-[#091330]');
      if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });

    function toggleSubtitleInputMode() {
      isRawSubMode = !isRawSubMode;
      const rawBox = document.getElementById('raw-sub-container');
      const dropBox = document.getElementById('drop-zone');
      const btn = document.getElementById('btn-switch-sub-mode');
      if (isRawSubMode) {
        rawBox.classList.remove('hidden');
        dropBox.classList.add('hidden');
        btn.textContent = 'Chọn file';
      } else {
        rawBox.classList.add('hidden');
        dropBox.classList.remove('hidden');
        btn.textContent = 'Dán văn bản';
      }
    }

    function applyRawSubtitles() {
      const text = document.getElementById('raw-sub-textarea').value;
      parseErrorAlert.classList.add('hidden');
      const res = parseAnySubtitle('pasted.txt', text);
      if (res && res.sentences.length > 0) {
        sentences = res.sentences;
        subtitleFormat = res.format;
        pendingUserVi = aicHasTranslation(res.sentences);
        fileStatusText.textContent = `Tự ngắt chuẩn: ${res.sentences.length} câu (${res.format.toUpperCase()})`;
        fileStatusBadge.classList.remove('hidden');
        checkStartReady();
        aiOnSubtitlesLoaded();
      } else {
        parseErrorMessage.textContent = 'Không nhận dạng được định dạng phụ đề vừa dán. Vui lòng kiểm tra lại.';
        parseErrorAlert.classList.remove('hidden');
        fileStatusBadge.classList.add('hidden');
      }
    }

    function handleFile(file) {
      parseErrorAlert.classList.add('hidden');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        const res = parseAnySubtitle(file.name, text);
        if (res && res.sentences.length > 0) {
          sentences = res.sentences;
          subtitleFormat = res.format;
          pendingUserVi = aicHasTranslation(res.sentences);
          fileStatusText.textContent = `Tự ngắt chuẩn: ${file.name} (${res.sentences.length} câu)`;
          fileStatusBadge.classList.remove('hidden');
          
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const match = baseName.match(/([a-zA-Z0-9_-]{11})/);
          if (match && !inputUrl.value.trim()) {
            inputUrl.value = `https://www.youtube.com/watch?v=${match[1]}`;
            inputUrl.dispatchEvent(new Event('input'));
          }
          checkStartReady();
          aiOnSubtitlesLoaded();
        } else {
          parseErrorMessage.textContent = `Không thể phân tích file "${file.name}". Định dạng chưa đúng chuẩn.`;
          parseErrorAlert.classList.remove('hidden');
          fileStatusBadge.classList.add('hidden');
          sentences = [];
          checkStartReady();
          aiOnSubtitlesLoaded();
        }
      };
      reader.readAsText(file);
    }

    function startPractice() {
      currentVideoId = parseYouTubeId(inputUrl.value);
      if (!currentVideoId || sentences.length === 0) return;
      if (pendingUserVi) { userTransVid = currentVideoId; pendingUserVi = false; }   // người dùng tự nạp phụ đề có bản dịch cho video này
      if (pendingUserPunct) { userPunctVid = currentVideoId; pendingUserPunct = false; }   // người dùng tự nạp phụ đề sửa câu/từ cho video này

      // Kiểm tra nếu video này từng có bản dịch song ngữ cũ được lưu mà bản hiện tại chưa có dịch
      if (typeof getArchivedTranslation === 'function' && typeof aicHasTranslation === 'function' && !aicHasTranslation(sentences)) {
        const archived = getArchivedTranslation(currentVideoId);
        if (archived && archived.sentences && archived.sentences.length && aicHasTranslation(archived.sentences)) {
          const useOld = confirm(
            `Video này (${currentVideoId}) đã có bản dịch song ngữ tiếng Việt đã lưu trước đây (${archived.sentences.length} câu).\n\n` +
            `• Bấm OK: Khôi phục lại bản dịch song ngữ cũ\n` +
            `• Bấm Hủy (Cancel): Dùng bản phụ đề mới vừa nạp`
          );
          if (useOld) {
            sentences = archived.sentences;
            subtitleFormat = archived.format || subtitleFormat;
            if (typeof showVocabToast === 'function') showVocabToast('Đã khôi phục bản dịch song ngữ cũ của video!', false);
          }
        }
      }

      captureHomeState();   // chụp trạng thái trang chủ trước khi lưu lịch sử
      saveToLocalHistory({
        videoId: currentVideoId,
        title: currentVideoTitle || `Video ${currentVideoId}`,
        format: subtitleFormat,
        sentences: sentences
      });

      // Nếu video nạp lại có từ vựng đã lưu sẵn, đảm bảo kích hoạt đồng bộ lên Cloud
      if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncVocabDebounced === 'function' && typeof getRawVocab === 'function') {
        const rawVoc = getRawVocab();
        const hasVidVocab = rawVoc.some(function(v) {
          return !v._deleted && (v.videoId === currentVideoId || (Array.isArray(v.contexts) && v.contexts.some(c => c.videoId === currentVideoId)));
        });
        if (hasVidVocab) {
          window.FSS_SUPABASE.syncVocabDebounced(rawVoc);
        }
      }

      document.getElementById('screen-vocab').classList.add('hidden');
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();
      currentSentenceIndex = 0;
      isTextMode = false;
      document.body.classList.remove('text-mode');
      resetPlaybackTrackingState();
      initYouTubePlayer();
      renderSubtitleList();
      if (window.activeRightPanelTab === 'keyvocab' && typeof window.renderRightPanelKeyVocab === 'function') {
        window.renderRightPanelKeyVocab();
      }
      const scrollBox0 = document.getElementById('subtitles-scroll-container');
      if (scrollBox0) scrollBox0.scrollTop = 0;
      updateActiveSentenceDisplay();
      if (window.lucide && window.lucide.createIcons) { window.lucide.createIcons(); }
      ensurePageFocus();
      trackAndShowVideoStats(currentVideoId);
    }

    function backToInputScreen() {
      sharedNoSaveId = '';
      if (window.pvReset) pvReset();
      stopSubtitleLoop();      // tắt loop + ẩn popup "Đang loop" vì không còn luyện video này nữa
      resetSubtitleSearch();   // xoá từ khoá đã gõ ở ô tìm kiếm phụ đề
      stopArticleAudio();      // tắt audio bài báo nếu đang phát
      isTextMode = false;
      document.body.classList.remove('text-mode');
      const backLabel = document.getElementById('practice-back-btn-label');
      if (backLabel) backLabel.textContent = 'Luyện video khác';
      const ttl = document.getElementById('pv-header-title');
      if (ttl) { ttl.textContent = ''; ttl.style.display = ''; }
      const sidePanel = document.getElementById('article-side-panel');
      if (sidePanel) sidePanel.style.display = 'none';
      if (rafAnimId) cancelAnimationFrame(rafAnimId);
      if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
      hideLookupTooltip();
      closeBilingualModal();
      aiRefreshPanel();
      document.getElementById('screen-practice').classList.add('hidden');
      homeFrozen = false; homeHistoryDirty = false;
      // 1) Làm mới hàng lịch sử KHI TRANG CHỦ CÒN ẨN (chỉ đổi DOM, chưa tốn công tính layout). Các hàng thư viện giữ nguyên.
      renderHistorySection();
      // 2) Hiện trang chủ và khôi phục vị trí cuộn ĐỒNG BỘ ngay tại đây, trước khi trình duyệt vẽ khung hình đầu tiên:
      //    không còn cảnh hiện đầu trang rồi mới nhảy xuống, và trình duyệt chỉ phải tính layout + vẽ đúng 1 lần.
      document.getElementById('screen-input').classList.remove('hidden');
      window.scrollTo({ top: savedHomeScrollY, behavior: 'instant' });
      restoreRowScrollPositions();
      // Bù độ lệch nếu hàng "Video Bạn Đã Luyện Gần Đây" vừa xuất hiện/đổi chiều cao: đo lại mốc neo so với lúc rời đi
      // (layout đã được tính ở bước cuộn ngay trên nên bước đo này gần như miễn phí).
      const anchorNow = homeSnap ? homeAnchorY() : null;
      if (anchorNow !== null && homeSnap.anchorY !== null && Math.abs(anchorNow - homeSnap.anchorY) > 1) {
        window.scrollTo({ top: Math.max(0, savedHomeScrollY + anchorNow - homeSnap.anchorY), behavior: 'instant' });
      }
      // 3) Việc phụ (thanh điều hướng, nút "Xem thêm", dựng hàng chưa tải) để sau khi đã vẽ xong
      requestAnimationFrame(() => {
        if (homeNavDirty) { homeNavDirty = false; if (typeof refreshHomeNav === 'function') refreshHomeNav(); }
        homeScheduleFill();
      });
      ensurePageFocus();
    }

    // ==================== CHUYỂN ĐỔI TAB "LUYỆN VỚI VIDEO" / "LUYỆN VỚI VĂN BẢN" ====================
    let currentInputMode = 'video';   // tab đang mở ở trang chủ: video | text | book | vt | custom-yt
    function setInputMode(mode) {
      const isText = mode === 'text', isBook = mode === 'book', isVt = mode === 'vt', isCustomYt = mode === 'custom-yt', isVideo = !isText && !isBook && !isVt && !isCustomYt;
      currentInputMode = isText ? 'text' : isBook ? 'book' : isVt ? 'vt' : isCustomYt ? 'custom-yt' : 'video';
      const set = (tab, pane, on) => {
        const t = document.getElementById(tab), p = document.getElementById(pane);
        if (t) t.classList.toggle('active', on);
        if (p) p.classList.toggle('hidden', !on);
      };
      set('mode-tab-video', 'video-input-mode', isVideo);
      set('mode-tab-text', 'text-input-mode', isText);
      set('mode-tab-book', 'book-input-mode', isBook);
      set('mode-tab-vt', 'vt-input-mode', isVt);
      set('mode-tab-custom-yt', 'custom-yt-input-mode', isCustomYt);
      if (isCustomYt && typeof window.renderCustomYtHistory === 'function') window.renderCustomYtHistory();
      try {   // tab vừa chọn nằm lọt giữa thanh tab (chỉ cuộn ngang trong thanh, không cuộn cả trang)
        const wrap = document.querySelector('.mode-tabs-wrap'), cur = document.getElementById('mode-tab-' + (isText ? 'text' : isBook ? 'book' : isVt ? 'vt' : isCustomYt ? 'custom-yt' : 'video'));
        if (wrap && cur && wrap.scrollWidth > wrap.clientWidth + 2) {
          wrap.scrollTo({ left: Math.max(0, cur.getBoundingClientRect().left - wrap.getBoundingClientRect().left + wrap.scrollLeft - (wrap.clientWidth - cur.offsetWidth) / 2), behavior: 'smooth' });
        }
      } catch (e) {}
      if (isVt && window.vtModeShown) window.vtModeShown();
      if (isText && window.renderArticleLibrary) window.renderArticleLibrary();
      if (isBook && typeof bkRefreshLibrary === 'function') bkRefreshLibrary();
      const libWrap = document.querySelector('.lib-wrap');
      if (libWrap) libWrap.classList.toggle('is-hidden', !isVideo);
      if (window.homeNavRefresh) window.homeNavRefresh();
      if (isVideo && window.homeFillVisible) setTimeout(window.homeFillVisible, 0);   // tab video hiện lại -> dựng các hàng đang nằm trong khung nhìn
      if (isText && window.syncHomeMore) setTimeout(window.syncHomeMore, 0);   // đo lại nút "Xem thêm" khi tab vừa hiện ra
      if (window.__routerSync) window.__routerSync();   // đổi tab -> cập nhật link riêng của mục đó
    }

    // ==================== LUYỆN SHADOWING VỚI VĂN BẢN THUẦN (KHÔNG CÓ VIDEO) ====================
    // Tách một đoạn văn bản (bài đọc IELTS, bài báo...) thành danh sách "câu" theo đúng cấu trúc dữ
    // liệu `sentences` mà toàn bộ phần còn lại của app đang dùng (text/startTime/endTime), để tái sử
    // dụng được gần như mọi tính năng: tra nghĩa, lưu từ vựng, dịch song ngữ, tìm kiếm... Vì không có
    // video/âm thanh thật nên startTime/endTime chỉ là mốc giả (tăng dần theo thứ tự câu) - không dùng
    // để phát lại, chỉ để tương thích với các hàm sẵn có (vốn được viết cho dữ liệu phụ đề video).
    function splitProseIntoSentences(text) {
      const abbrevSet = new Set([...AIC_TITLE_ABBREV, ...AIC_SOFT_ABBREV, ...AIC_NEVER_END, 'jan.', 'feb.', 'mar.', 'apr.', 'jun.', 'jul.', 'aug.', 'sep.', 'sept.', 'oct.', 'nov.', 'dec.']);   // viết tắt tháng: "Oct. 4" không phải hết câu
      const paragraphs = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      const out = [];
      let idx = 0;
      paragraphs.forEach((para) => {
        const flat = para.replace(/\n+/g, ' ').replace(/[ \t]+/g, ' ').trim();
        if (!flat) return;
        // Bảo vệ tạm các dấu chấm KHÔNG phải là kết thúc câu thật (viết tắt quen thuộc, số thập phân)
        // bằng một ký tự control vô hại, để không bị cắt câu sai chỗ ở bước split bên dưới.
        let guarded = flat.replace(/\b[A-Za-z]{1,4}(?:\.[A-Za-z]{1,4})*\./g, (m) => {
          return abbrevSet.has(m.toLowerCase()) ? m.replace(/\./g, '\u0001') : m;
        });
        guarded = guarded.replace(/(\d)\.(\d)/g, '$1\u0001$2');
        guarded = guarded.replace(/(?<=\b[A-Z][a-z]+ )([A-Z])\.(?=\s+[A-Z][a-z])/g, '$1\u0001');   // chữ lót trong tên: "Sally Q. Yates"
        const parts = guarded.split(/(?<=[.!?…”"’'\)])\s+(?=[A-ZÀ-Ỵ0-9"'“‘(])/);
        parts.forEach((part) => {
          const t = part.replace(/\u0001/g, '.').trim();
          if (t) out.push({ id: ++idx, startTime: idx - 1, endTime: idx, text: t });
        });
      });
      return out;
    }

    // Mã định danh ổn định cho một bài văn bản: cùng nội dung -> cùng mã, nên dán lại đúng văn bản đó sẽ mở lại
    // bản đã lưu (kèm bản dịch song ngữ) thay vì phải làm lại từ đầu.
    function textDocHash(str) {
      const t = String(str || '').replace(/\s+/g, ' ').trim();
      let h = 2166136261 >>> 0;
      for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
      return h.toString(36) + t.length.toString(36);
    }

    // Tiêu đề bài = hàng chữ đầu tiên có chữ/số thật sự (bỏ qua dòng trống, dòng toàn dấu câu / ký hiệu).
    function titleFromLines(lines) {
      const hasText = (t) => /[\p{L}\p{N}]/u.test(t);
      for (let i = 0; i < lines.length; i++) {
        const parts = String(lines[i] == null ? '' : lines[i]).split(/\r?\n/);
        for (let j = 0; j < parts.length; j++) {
          const ln = parts[j].replace(/\s+/g, ' ').trim();
          if (ln && hasText(ln)) return ln.length > 90 ? ln.slice(0, 90).trim() + '…' : ln;
        }
      }
      return '';
    }
    // rawText (nếu có) = nguyên văn người dùng dán vào -> lấy đúng hàng đầu tiên của văn bản đó
    function deriveTextTitle(parsed, rawText) {
      const t = rawText ? titleFromLines([rawText]) : '';
      return t || titleFromLines((parsed || []).map((x) => x && x.text)) || 'Văn bản của bạn';
    }

    // Điểm vào DUY NHẤT để bắt đầu luyện shadowing với văn bản (dùng chung cho cả việc dán tay lẫn mở
    // 1 bài trong "Thư viện bài viết"). articleId khác null nghĩa là bài có sẵn trong thư viện.
    function enterTextShadowing(rawText, title, articleId, customSentences) {
      const docId = articleId ? `art_${articleId}` : `txt_${textDocHash(rawText)}`;
      const saved = getLocalHistory().find((h) => h.videoId === docId && h.isText && h.sentences && h.sentences.length);
      let parsed;
      if (customSentences && Array.isArray(customSentences) && customSentences.length) {
        parsed = customSentences;
      } else if (saved) {
        parsed = aiClone(saved.sentences);   // đã luyện trước đó: dùng lại bản đã lưu (có bản dịch song ngữ nếu đã nhập)
      } else {
        parsed = splitProseIntoSentences(rawText || '');
        if (!parsed.length) { showVocabToast('Không tách được câu nào từ văn bản này', false); return false; }
      }
      const finalTitle = (title || '').trim() || (saved && saved.title) || deriveTextTitle(parsed, rawText);
      openTextSession(docId, finalTitle, parsed);
      return true;
    }

    // Mở phòng luyện ở chế độ văn bản từ danh sách câu đã có, đồng thời lưu bài vào lịch sử.
    function openTextSession(docId, title, parsed) {
      captureHomeState();

      // Nếu trước đó vừa xem video thì dừng video + vòng theo dõi cũ, tránh chạy ngầm
      if (rafAnimId) { cancelAnimationFrame(rafAnimId); rafAnimId = null; }
      try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}

      currentVideoId = docId;
      currentVideoTitle = (title || '').trim() || 'Văn bản của bạn';
      sentences = parsed;
      subtitleFormat = 'text';
      isTextMode = true;
      document.body.classList.add('text-mode');
      resetBilingualForNewVideo();

      saveToLocalHistory({
        videoId: docId,
        title: currentVideoTitle,
        duration: 0,
        format: 'text',
        isText: true,
        sentences: sentences
      });

      document.getElementById('screen-vocab').classList.add('hidden');
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();

      currentSentenceIndex = 0;
      resetPlaybackTrackingState();
      stopSubtitleLoop();
      resetSubtitleSearch();
      renderSubtitleList();
      const scrollBox0 = document.getElementById('subtitles-scroll-container');
      if (scrollBox0) scrollBox0.scrollTop = 0;
      updateActiveSentenceDisplay();

      // Module L4: Đồng bộ giao diện Đọc báo (Article)
      const backLabel = document.getElementById('practice-back-btn-label');
      if (backLabel) backLabel.textContent = 'Đọc báo';
      const ttl = document.getElementById('pv-header-title');
      if (ttl) { ttl.textContent = currentVideoTitle; ttl.style.display = 'block'; }
      renderArticleSidePanel(docId, currentVideoTitle, parsed);

      // Khởi tạo trình phát Audio cho bài báo
      if (pendingTextAudioFile) {
        const audioFile = pendingTextAudioFile;
        pendingTextAudioFile = null;
        clearTextAudioInput();
        saveArticleAudioBlob(docId, audioFile).then(() => {
          initArticleAudioPlayer(docId);
          renderArticleSidePanel(docId, currentVideoTitle, parsed);
        }).catch(err => {
          console.error('[Article Audio] Lỗi lưu MP3 vào IndexedDB:', err);
          initArticleAudioPlayer(docId);
        });
      } else {
        initArticleAudioPlayer(docId);
      }

      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      ensurePageFocus();
    }

    function renderArticleSidePanel(docId, title, parsed) {
      const p = document.getElementById('article-side-panel');
      if (!p) return;
      p.style.display = 'flex';

      const totalWords = (function() {
        if (!parsed || !parsed.length) return 0;
        let count = 0;
        for (const s of parsed) {
          if (s.text) count += s.text.trim().split(/\s+/).filter(Boolean).length;
        }
        return count;
      })();
      const totalSentences = parsed ? parsed.length : 0;
      const sourceName = (function() {
        const lower = ((docId || '') + ' ' + (title || '')).toLowerCase();
        if (lower.includes('rfi')) return 'RFI Français Facile';
        if (lower.includes('lemonde') || lower.includes('le monde')) return 'Le Monde';
        if (lower.includes('france24') || lower.includes('france 24')) return 'France 24';
        if (lower.includes('lefigaro') || lower.includes('le figaro')) return 'Le Figaro';
        if (lower.includes('tv5') || lower.includes('tv5monde')) return 'TV5Monde';
        if (lower.includes('courrier')) return 'Courrier International';
        if (lower.startsWith('art_') || lower.startsWith('sample_') || lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.docx')) return 'Thư viện bài viết';
        return 'Văn bản tiếng Pháp';
      })();

      const keyWords = (function() {
        if (!parsed || !parsed.length) return [];
        const stops = new Set([
          'alors','après','aussi','autre','avant','avec','avoir','cette','comme','dans','depuis','encore','faire','grand','jamais','mieux','moins','notre','parce','pendant','petit','plutôt','pourquoi','quand','quelque','sans','selon','seulement','toutes','toujours','toute','tous','votre','vraiment','étaient','était','étant','chose','entre','leurs','notre','votre','quelle','quelles','quels','cette','celles','ceux'
        ]);
        const list = [];
        const seen = new Set();
        for (const s of parsed) {
          if (!s.text) continue;
          const tokens = s.text.match(/[\p{L}]{5,}/gu) || [];
          for (const tok of tokens) {
            const w = tok.toLowerCase();
            if (!stops.has(w) && !seen.has(w)) {
              seen.add(w);
              list.push(tok);
              if (list.length >= 8) break;
            }
          }
          if (list.length >= 8) break;
        }
        return list;
      })();

      p.innerHTML = `
        <div class="art-side-card">
          <div class="art-side-hd">
            <span class="art-side-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </span>
            <div class="art-side-title-wrap">
              <h3 class="art-side-title">Thông tin bài đọc</h3>
              <span class="art-side-source"><span class="art-src-dot"></span>${escapeHtml(sourceName)}</span>
            </div>
          </div>

          <div class="art-side-stats">
            <div class="art-stat-box">
              <span class="art-stat-num" id="art-stat-wc">${totalWords}</span>
              <span class="art-stat-label">Tổng số từ</span>
            </div>
            <div class="art-stat-box">
              <span class="art-stat-num" id="art-stat-sc">${totalSentences}</span>
              <span class="art-stat-label">Tổng số câu</span>
            </div>
          </div>

          <div class="art-saved-indicator">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span>Tự động lưu vào lịch sử đọc</span>
          </div>

          <div class="art-side-actions">
            <button type="button" class="art-btn art-btn-bilingual" onclick="toggleBilingual()" title="Bật hoặc tắt hiển thị bản dịch tiếng Việt">
              <i data-lucide="languages" class="w-4 h-4"></i>
              <span>Dịch song ngữ</span>
            </button>
            <button type="button" class="art-btn art-btn-edit-bilingual" id="art-side-btn-edit-trans" onclick="openBilingualModal(true)" title="Sửa hoặc nạp đè bản dịch song ngữ mới cho bài đọc này">
              <i data-lucide="pencil" class="w-4 h-4"></i>
              <span>Sửa bản dịch</span>
            </button>
            <label class="art-btn" style="cursor:pointer;" title="Đính kèm hoặc đổi file âm thanh MP3 cho bài đọc này">
              <input type="file" id="art-side-audio-file-input" accept=".mp3,audio/mpeg" style="display:none;" onchange="uploadAudioForCurrentArticle(event)">
              <i data-lucide="music" class="w-4 h-4"></i>
              <span id="art-side-audio-label">Kèm Audio MP3</span>
            </label>
            <div id="art-side-file-pill" class="art-side-file-pill" style="display:none;" title="File audio đang nạp">
              <div class="art-side-file-info">
                <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                <span class="art-side-pill-name" id="art-side-pill-name">Audio.mp3</span>
              </div>
              <button type="button" class="art-side-pill-del" onclick="removeCurrentArticleAudio()" title="Gỡ file audio này khỏi bài viết" aria-label="Gỡ file audio">✕</button>
            </div>
            <button type="button" class="art-btn art-btn-sync-ai" id="art-side-sync-btn" onclick="openArtAiSyncModal()" title="Đồng bộ phụ đề & Word Timestamps từ AI" aria-label="Đồng bộ AI">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              <span>Sync AI Timestamps</span>
            </button>
            <button type="button" class="art-btn" onclick="copyFullArticleText()" title="Sao chép toàn bộ nội dung bài viết">
              <i data-lucide="copy" class="w-4 h-4"></i>
              <span>Sao chép bài</span>
            </button>
            <button type="button" class="art-btn" onclick="openKeyVocabModal()" title="Lọc và giải nghĩa từ khó với AI">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
              <span>Từ khó AI</span>
            </button>
          </div>

          <div class="art-vocab-section">
            <div class="art-vocab-header">
              <div class="art-vocab-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span>Từ vựng trong bài</span>
              </div>
              <span class="art-vocab-tip">Bôi đen chữ để tra</span>
            </div>
            <div class="art-vocab-list">
              ${keyWords.length ? keyWords.map(w => `<button type="button" class="art-vocab-tag" onclick="lookupArticleWord('${escapeHtml(w)}')">${escapeHtml(w)}</button>`).join('') : '<span class="art-vocab-empty">Bôi đen bất kỳ từ hoặc câu nào để tra nghĩa và phát âm chuẩn.</span>'}
            </div>
          </div>
        </div>
      `;
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      getArticleAudioBlob(docId).then(rec => {
        const lbl = document.getElementById('art-side-audio-label');
        const pill = document.getElementById('art-side-file-pill');
        const pillName = document.getElementById('art-side-pill-name');
        if (rec) {
          if (lbl) lbl.textContent = 'Đổi Audio MP3';
          if (pill) pill.style.display = 'flex';
          if (pillName) pillName.textContent = rec.name || rec.fileName || 'Audio.mp3';
        } else {
          if (lbl) lbl.textContent = 'Kèm Audio MP3';
          if (pill) pill.style.display = 'none';
        }
      });
    }

    // =========================================================================
    // ARTICLE AUDIO ENGINE: QUẢN LÝ ÂM THANH MP3 CHO BÀI BÁO (INDEXEDDB)
    // =========================================================================
    const ART_AUDIO_DB_NAME = 'shadowing_article_audio_v1';
    let artAudioDbPromise = null;
    let pendingTextAudioFile = null;
    let currentArtAudioObjUrl = null;

    function getArtAudioDb() {
      if (artAudioDbPromise) return artAudioDbPromise;
      artAudioDbPromise = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('IndexedDB không được hỗ trợ')); return; }
        const req = indexedDB.open(ART_AUDIO_DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('audios')) {
            db.createObjectStore('audios', { keyPath: 'id' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      artAudioDbPromise.catch(() => { artAudioDbPromise = null; });
      return artAudioDbPromise;
    }

    function saveArticleAudioBlob(docId, file) {
      if (!docId || !file) return Promise.resolve(false);
      return getArtAudioDb().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction('audios', 'readwrite');
        const store = tx.objectStore('audios');
        store.put({
          id: docId,
          name: file.name || (docId + '.mp3'),
          size: file.size,
          type: file.type || 'audio/mpeg',
          blob: file,
          updatedAt: Date.now()
        });
        tx.oncomplete = () => {
          // Tự động đẩy file MP3 lên Supabase Storage (nếu đã đăng nhập)
          if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.uploadArticleAudio === 'function') {
            try { window.FSS_SUPABASE.uploadArticleAudio(docId, file); } catch (e) {}
          }
          resolve(true);
        };
        tx.onerror = () => reject(tx.error);
      }));
    }

    function getArticleAudioBlob(docId) {
      if (!docId) return Promise.resolve(null);
      return getArtAudioDb().then(db => new Promise((resolve) => {
        const tx = db.transaction('audios', 'readonly');
        const store = tx.objectStore('audios');
        const req = store.get(docId);
        req.onsuccess = () => {
          const res = req.result || null;
          if (res && res.blob) {
            resolve(res);
            return;
          }
          // Nếu máy mới chưa có trong IndexedDB -> Tự động kéo từ Supabase Storage về nạp vào máy
          if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.downloadArticleAudio === 'function') {
            window.FSS_SUPABASE.downloadArticleAudio(docId).then((blob) => {
              if (blob) {
                saveArticleAudioBlob(docId, blob);
                resolve({
                  id: docId,
                  name: docId + '.mp3',
                  size: blob.size,
                  type: blob.type || 'audio/mpeg',
                  blob: blob,
                  updatedAt: Date.now()
                });
              } else {
                resolve(null);
              }
            }).catch(() => resolve(null));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      })).catch(() => null);
    }

    function deleteArticleAudioBlob(docId) {
      if (!docId) return Promise.resolve(false);
      return getArtAudioDb().then(db => new Promise((resolve) => {
        const tx = db.transaction('audios', 'readwrite');
        const store = tx.objectStore('audios');
        store.delete(docId);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      })).catch(() => false);
    }

    window.getArticleAudioBlob = getArticleAudioBlob;
    window.saveArticleAudioBlob = saveArticleAudioBlob;
    window.deleteArticleAudioBlob = deleteArticleAudioBlob;

    function isMp3File(file) {
      if (!file || !file.name) return false;
      const name = file.name.toLowerCase();
      return name.endsWith('.mp3') || file.type === 'audio/mpeg' || file.type === 'audio/mp3';
    }

    window.handleTextAudioInput = function(e) {
      const file = e.target && e.target.files && e.target.files[0];
      if (!file) return;
      if (!isMp3File(file)) {
        showVocabToast('Chỉ cho phép tải lên file âm thanh định dạng .mp3', false);
        e.target.value = '';
        return;
      }
      pendingTextAudioFile = file;
      const fnEl = document.getElementById('text-audio-filename');
      if (fnEl) fnEl.textContent = file.name;
      const badge = document.getElementById('text-audio-badge');
      if (badge) badge.style.display = 'inline-flex';
      const lbl = document.getElementById('lbl-text-audio-input');
      if (lbl) lbl.style.display = 'none';
      showVocabToast('Đã đính kèm audio MP3: ' + file.name, true);
    };

    window.clearTextAudioInput = function() {
      pendingTextAudioFile = null;
      const inp = document.getElementById('text-audio-input');
      if (inp) inp.value = '';
      const badge = document.getElementById('text-audio-badge');
      if (badge) badge.style.display = 'none';
      const lbl = document.getElementById('lbl-text-audio-input');
      if (lbl) lbl.style.display = 'inline-flex';
    };

    function stopArticleAudio() {
      const audioEl = document.getElementById('art-audio-el');
      if (audioEl) {
        try { audioEl.pause(); } catch (e) {}
        audioEl.currentTime = 0;
        if (currentArtAudioObjUrl) {
          URL.revokeObjectURL(currentArtAudioObjUrl);
          currentArtAudioObjUrl = null;
        }
        audioEl.removeAttribute('src');
      }
      const card = document.getElementById('art-cs-card') || document.getElementById('art-audio-bar');
      if (card) card.style.display = 'none';
      if (typeof tsRefresh === 'function') tsRefresh();
    }

    let currentArtWordEl = null;
    function highlightArticleCurrentWord(el) {
      if (currentArtWordEl === el) return;
      if (currentArtWordEl) {
        currentArtWordEl.classList.remove('cs-cur', 'karaoke-word-active');
      }
      if (el) {
        el.classList.add('cs-cur', 'karaoke-word-active');
      }
      currentArtWordEl = el;
    }

    function renderArticleSentenceCard(idx) {
      const card = document.getElementById('art-cs-card');
      const box = document.getElementById('art-cs-text');
      const btnPrev = document.getElementById('art-cs-prev');
      const btnNext = document.getElementById('art-cs-next');
      const btnAuto = document.getElementById('art-cs-auto');
      const tsEl = document.getElementById('art-cs-ts');
      if (!card || !box) return;

      const n = (sentences && sentences.length) || 0;
      const s = (idx >= 0 && idx < n) ? sentences[idx] : null;

      box.setAttribute('data-idx', String(idx));
      box.innerHTML = '';
      currentArtWordEl = null;

      if (btnPrev) btnPrev.disabled = (idx <= 0);
      if (btnNext) btnNext.disabled = (idx < 0 || idx >= n - 1);
      if (btnAuto) {
        const isAuto = !!(settings && settings.sentenceAutoStop);
        btnAuto.setAttribute('aria-checked', isAuto ? 'true' : 'false');
        btnAuto.classList.toggle('active', isAuto);
      }

      if (tsEl && !tsEl.innerHTML) {
        if (typeof tsMarkup === 'function') tsEl.innerHTML = tsMarkup();
      }
      if (typeof tsRefresh === 'function') {
        tsRefresh();
      }

      if (!s) return;

      let toks = [];
      if (s.words && s.words.length) {
        toks = s.words.map(w => ({
          t: String(w.word || ''),
          a: typeof w.startTime === 'number' ? w.startTime : (s.startTime || 0),
          b: typeof w.endTime === 'number' ? w.endTime : (s.endTime || 1)
        }));
      } else {
        const raw = String(s.text || '').split(/\s+/).filter(Boolean);
        const dur = Math.max(0.6, (s.endTime || 1) - (s.startTime || 0));
        const step = dur / (raw.length || 1);
        toks = raw.map((t, i) => ({
          t: t,
          a: +((s.startTime || 0) + i * step).toFixed(3),
          b: +((s.startTime || 0) + (i + 1) * step).toFixed(3)
        }));
      }

      toks.forEach((tok, i) => {
        const sp = document.createElement('span');
        sp.className = 'sub-word-unit cs-w';
        sp.textContent = tok.t;
        sp.setAttribute('data-start', String(tok.a));
        sp.setAttribute('data-end', String(tok.b));
        sp.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetTime = Math.max(0, Number((tok.a - 0.05).toFixed(3)));
          seekToTime(targetTime, idx, true, null, false);
          highlightArticleCurrentWord(sp);
        });
        box.appendChild(sp);
        if (i < toks.length - 1) {
          box.appendChild(document.createTextNode(' '));
        }
      });
    }
    window.renderArticleSentenceCard = renderArticleSentenceCard;

    window.prevArticleSentence = function() {
      if (!sentences || !sentences.length) return;
      const cur = Math.max(0, currentSentenceIndex || 0);
      if (cur <= 0) return;
      const prevIdx = cur - 1;
      const s = sentences[prevIdx];
      const startTime = (s && typeof s.startTime === 'number') ? s.startTime : 0;
      seekToTime(startTime, prevIdx, true, null, true);
      renderArticleSentenceCard(prevIdx);
    };

    window.nextArticleSentence = function() {
      if (!sentences || !sentences.length) return;
      const cur = Math.max(0, currentSentenceIndex || 0);
      if (cur >= sentences.length - 1) return;
      const nextIdx = cur + 1;
      const s = sentences[nextIdx];
      const startTime = (s && typeof s.startTime === 'number') ? s.startTime : 0;
      seekToTime(startTime, nextIdx, true, null, true);
      renderArticleSentenceCard(nextIdx);
    };

    window.toggleArticleAutoStop = function() {
      if (typeof toggleSentenceAutoStop === 'function') {
        toggleSentenceAutoStop();
      } else {
        settings.sentenceAutoStop = !settings.sentenceAutoStop;
        saveSettings();
      }
      const isAuto = !!(settings && settings.sentenceAutoStop);
      const btn = document.getElementById('art-cs-auto');
      if (btn) {
        btn.setAttribute('aria-checked', isAuto ? 'true' : 'false');
        btn.classList.toggle('active', isAuto);
      }
      showVocabToast(isAuto ? 'Đã bật: Tự dừng sau mỗi câu' : 'Đã tắt: Tự dừng sau mỗi câu', true);
    };

    function initArticleAudioPlayer(docId) {
      const audioEl = document.getElementById('art-audio-el');
      const card = document.getElementById('art-cs-card') || document.getElementById('art-audio-bar');
      if (!audioEl || !card) return;

      getArticleAudioBlob(docId).then(record => {
        if (!record || !record.blob) {
          card.style.display = 'none';
          if (currentArtAudioObjUrl) {
            URL.revokeObjectURL(currentArtAudioObjUrl);
            currentArtAudioObjUrl = null;
          }
          audioEl.removeAttribute('src');
          if (typeof tsRefresh === 'function') tsRefresh();
          return;
        }

        if (currentArtAudioObjUrl) {
          URL.revokeObjectURL(currentArtAudioObjUrl);
        }
        currentArtAudioObjUrl = URL.createObjectURL(record.blob);
        audioEl.src = currentArtAudioObjUrl;
        card.style.display = 'flex';

        const sidePill = document.getElementById('art-side-file-pill');
        const sidePillName = document.getElementById('art-side-pill-name');
        if (sidePill) sidePill.style.display = 'flex';
        if (sidePillName) sidePillName.textContent = record.name || record.fileName || 'Audio.mp3';

        renderArticleSentenceCard(currentSentenceIndex || 0);

        audioEl.ontimeupdate = () => {
          const ct = audioEl.currentTime || 0;

          if (isTextMode && sentences && sentences.length) {
            // Tự dừng cuối câu khi bật sentenceAutoStop cho bài báo
            if ((settings && settings.sentenceAutoStop) && currentSentenceIndex >= 0 && sentences[currentSentenceIndex]) {
              const curSent = sentences[currentSentenceIndex];
              const sEnd = typeof curSent.endTime === 'number' ? curSent.endTime : (curSent.startTime + 15);
              if (ct >= sEnd - 0.04 && handledSentenceEndId !== curSent.id) {
                audioEl.pause();
                handledSentenceEndId = curSent.id;
                pausedByAutoPauseId = curSent.id;
                pausedAtSentenceIndex = currentSentenceIndex;
                return;
              }
            }

            // Đồng bộ highlight câu theo mốc thời gian
            const matchIdx = sentences.findIndex(s => typeof s.startTime === 'number' && ct >= s.startTime && ct <= (typeof s.endTime === 'number' ? s.endTime : (s.startTime + 15)));
            if (matchIdx !== -1 && matchIdx !== currentSentenceIndex) {
              currentSentenceIndex = matchIdx;
              updateActiveSentenceDisplay();
              renderArticleSentenceCard(matchIdx);
              if (settings && settings.autoScroll && !shouldPreventAutoScroll()) {
                triggerSmoothCenterScroll(matchIdx, false, ct);
              }
            }

            // Tô từ đang phát trong thẻ #art-cs-text
            const box = document.getElementById('art-cs-text');
            if (box && String(currentSentenceIndex) === box.getAttribute('data-idx')) {
              const wordEls = box.querySelectorAll('.cs-w');
              let foundWord = null;
              for (let i = 0; i < wordEls.length; i++) {
                const a = parseFloat(wordEls[i].getAttribute('data-start'));
                const b = parseFloat(wordEls[i].getAttribute('data-end'));
                if (ct >= a - 0.02 && ct < b - 0.01) {
                  foundWord = wordEls[i];
                  break;
                }
              }
              highlightArticleCurrentWord(foundWord);
            }

            // Đồng bộ highlight từ karaoke trong subtitle list
            if (currentSentenceIndex >= 0 && sentences[currentSentenceIndex] && sentences[currentSentenceIndex].words) {
              const ws = sentences[currentSentenceIndex].words;
              const wIdx = ws.findIndex(w => typeof w.startTime === 'number' && ct >= w.startTime && ct <= w.endTime);
              const container = document.getElementById('subtitles-scroll-container');
              if (container && wIdx !== -1) {
                const sentEl = container.querySelector(`.sentence-text-line[data-id="${sentences[currentSentenceIndex].id}"]`);
                if (sentEl) {
                  const wordEls = sentEl.querySelectorAll('.sub-word-unit');
                  if (wordEls[wIdx]) {
                    if (currentHighlightedWordEl && currentHighlightedWordEl !== wordEls[wIdx]) {
                      currentHighlightedWordEl.classList.remove('karaoke-word-active');
                    }
                    wordEls[wIdx].classList.add('karaoke-word-active');
                    currentHighlightedWordEl = wordEls[wIdx];
                  }
                }
              }
            }
          }
        };
      });
    }

    window.toggleArtAudioPlay = function() {
      const audioEl = document.getElementById('art-audio-el');
      if (!audioEl || !audioEl.src) return;
      if (audioEl.paused) {
        audioEl.play().catch(e => console.warn('[Article Audio] Lỗi phát audio:', e));
      } else {
        audioEl.pause();
      }
    };

    window.seekArtAudioBy = function(delta) {
      const audioEl = document.getElementById('art-audio-el');
      if (!audioEl || !audioEl.src) return;
      const target = Math.max(0, Math.min(audioEl.duration || 9999, (audioEl.currentTime || 0) + delta));
      audioEl.currentTime = target;
    };

    window.onArtAudioSliderInput = function(val) {
      const audioEl = document.getElementById('art-audio-el');
      if (!audioEl || !audioEl.src) return;
      audioEl.currentTime = parseFloat(val) || 0;
    };

    let artTimeDisplayMode = 'sec'; // 'sec' hoặc 'min'

    function formatArtTime(seconds) {
      if (isNaN(seconds) || seconds < 0) return artTimeDisplayMode === 'sec' ? '0.0s' : '0:00';
      if (artTimeDisplayMode === 'sec') {
        return Number(seconds).toFixed(1) + 's';
      } else {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
      }
    }
    window.formatArtTime = formatArtTime;

    window.toggleArtTimeMode = function() {
      artTimeDisplayMode = artTimeDisplayMode === 'sec' ? 'min' : 'sec';
      const audioEl = document.getElementById('art-audio-el');
      const curEl = document.getElementById('art-audio-cur-time');
      const durEl = document.getElementById('art-audio-dur-time');
      if (audioEl && curEl) curEl.textContent = formatArtTime(audioEl.currentTime || 0);
      if (audioEl && durEl) {
        const maxD = audioEl.duration || (sentences && sentences.length ? (sentences[sentences.length - 1].endTime || 0) : 0);
        durEl.textContent = formatArtTime(maxD);
      }
    };

    window.setArtAudioSpeed = function(rate) {
      const audioEl = document.getElementById('art-audio-el');
      const r = parseFloat(rate) || 1.0;
      if (audioEl) audioEl.playbackRate = r;
      const badge = document.getElementById('art-ab-speed-val');
      if (badge) badge.textContent = r.toFixed(1) + 'x';
      const btns = document.querySelectorAll('#art-speeds button');
      btns.forEach(b => {
        const sp = parseFloat(b.getAttribute('data-sp'));
        if (Math.abs(sp - r) < 0.01) {
          b.classList.add('on');
        } else {
          b.classList.remove('on');
        }
      });
    };

    window.changeArtAudioSpeed = function(rate) {
      setArtAudioSpeed(rate);
    };

    window.uploadAudioForCurrentArticle = function(e) {
      const file = e.target && e.target.files && e.target.files[0];
      if (!file || !currentVideoId) return;
      if (!isMp3File(file)) {
        showVocabToast('Chỉ cho phép tải lên file âm thanh định dạng .mp3', false);
        e.target.value = '';
        return;
      }
      saveArticleAudioBlob(currentVideoId, file).then(() => {
        showVocabToast('Đã nạp file MP3 cho bài đọc: ' + file.name, true);
        initArticleAudioPlayer(currentVideoId);
        renderArticleSidePanel(currentVideoId, currentVideoTitle, sentences);
      }).catch(err => {
        showVocabToast('Lỗi lưu audio: ' + (err.message || err), false);
      });
    };

    window.removeCurrentArticleAudio = function() {
      if (!currentVideoId) return;
      if (!confirm('Bạn có chắc muốn gỡ file âm thanh khỏi bài viết này?')) return;
      stopArticleAudio();
      deleteArticleAudioBlob(currentVideoId).then(() => {
        showVocabToast('Đã gỡ file audio khỏi bài viết', true);
        renderArticleSidePanel(currentVideoId, currentVideoTitle, sentences);
      });
    };

    // =====================================================================
    // MODULE M3: ĐỒNG BỘ TRANSCRIPT & WORD TIMESTAMPS TỪ AI CHO BÀI BÁO
    // =====================================================================
    function parseTimestampToSeconds(ts) {
      if (typeof ts === 'number') return ts;
      if (!ts) return 0;
      const s = String(ts).trim().replace(',', '.');
      const parts = s.split(':');
      if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      }
      if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      const val = parseFloat(s);
      return isNaN(val) ? 0 : val;
    }

    function cleanMarkdownFences(str) {
      if (!str) return '';
      let s = String(str).trim();
      if (s.startsWith('```')) {
        s = s.replace(/^```[a-zA-Z0-9_-]*\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
      }
      return s;
    }

    function parseAiSyncData(rawInput, baseSentences) {
      const cleaned = cleanMarkdownFences(rawInput);
      if (!cleaned) throw new Error('Dữ liệu nhập vào trống');

      // Thử parse JSON
      if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (e) {
          const match = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (match) {
            try { parsed = JSON.parse(match[0]); } catch (e2) { throw new Error('Định dạng JSON không hợp lệ'); }
          } else {
            throw new Error('Định dạng JSON không hợp lệ');
          }
        }

        const items = Array.isArray(parsed) ? parsed : (parsed.sentences || parsed.subtitles || parsed.cues || []);
        if (!Array.isArray(items) || !items.length) {
          throw new Error('JSON không chứa mảng câu hoặc từ hợp lệ');
        }

        // Mảng câu
        if (items[0].text !== undefined || items[0].sentence !== undefined || items[0].words !== undefined) {
          const out = items.map((it, idx) => {
            const base = (baseSentences && baseSentences[idx]) || {};
            const text = String(it.text || it.sentence || base.text || '').trim();
            const start = parseTimestampToSeconds(it.startTime !== undefined ? it.startTime : it.start);
            const end = parseTimestampToSeconds(it.endTime !== undefined ? it.endTime : it.end);
            let words = null;
            if (Array.isArray(it.words)) {
              words = it.words.map((w) => ({
                word: String(w.word || w.text || '').trim(),
                startTime: parseTimestampToSeconds(w.startTime !== undefined ? w.startTime : w.start),
                endTime: parseTimestampToSeconds(w.endTime !== undefined ? w.endTime : w.end)
              })).filter((w) => w.word.length > 0);
            }
            return {
              ...base,
              id: it.id || base.id || idx + 1,
              startTime: start,
              endTime: Math.max(start + 0.5, end),
              text,
              words: words && words.length ? words : (base.words || undefined)
            };
          });
          return { format: 'json-sentences', sentences: out, count: out.length };
        }
      }

      // Thử parse SRT / WebVTT
      const timeRegex = /((?:(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}))\s*-->\s*((?:(\d{1,2}:)?\d{2}:\d{2}[.,]\d{3}))/;
      const blocks = cleaned.split(/\n\s*\n+/);
      const cues = [];
      for (const block of blocks) {
        const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
        if (!lines.length) continue;
        let timeLineIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          if (timeRegex.test(lines[i])) { timeLineIdx = i; break; }
        }
        if (timeLineIdx !== -1) {
          const match = lines[timeLineIdx].match(timeRegex);
          const start = parseTimestampToSeconds(match[1]);
          const end = parseTimestampToSeconds(match[3]);
          const text = lines.slice(timeLineIdx + 1).join(' ').replace(/<[^>]+>/g, '').trim();
          if (text) {
            cues.push({ id: cues.length + 1, startTime: start, endTime: end, text });
          }
        }
      }

      if (cues.length > 0) {
        return { format: 'vtt-srt', sentences: cues, count: cues.length };
      }

      throw new Error('Không nhận diện được dữ liệu JSON, WebVTT hoặc SRT');
    }

    function generateAiTimestampPrompt(title, sents) {
      const list = (sents || []).map((s, i) => `${i + 1}. ${s.text}`).join('\n');
      return `Bạn là chuyên gia căn chỉnh phụ đề âm thanh (Audio-Text Alignment).
Tôi có file audio MP3 cho bài báo tiếng Pháp: "${title || 'Bài báo tiếng Pháp'}".
Dưới đây là danh sách toàn bộ các câu trong bài:

${list}

YÊU CẦU:
Hãy nghe và trả về mảng JSON chứa mốc thời gian phát âm (tính bằng giây, 2 chữ số thập phân) theo đúng cấu trúc sau (chỉ trả về khối mã JSON thuần túy, không thêm lời chào hay giải thích):
[
  {
    "id": 1,
    "startTime": 0.00,
    "endTime": 3.50,
    "text": "...",
    "words": [
      { "word": "...", "startTime": 0.00, "endTime": 0.80 }
    ]
  }
]`;
    }

    function generateAiTranscriptionPrompt(title) {
      return `Bạn là chuyên gia phiên âm và tạo phụ đề tiếng Pháp chuyên nghiệp (Speech-to-Text Transcription & Alignment).
Đính kèm là file âm thanh tiếng Pháp cho bài: "${title || 'Bài báo tiếng Pháp'}".

YÊU CẦU:
1. Nghe kỹ toàn bộ file âm thanh và phiên âm chính xác từng câu tiếng Pháp chuẩn ngữ pháp, chính tả, dấu câu.
2. Tách thành từng câu hoàn chỉnh và xác định mốc thời gian bắt đầu và kết thúc (tính bằng giây, 2 chữ số thập phân).
3. Đánh dấu mốc thời gian chi tiết cho từng từ (word-level timestamps) để phục vụ luyện đọc Karaoke/Shadowing.
4. Trả về DUY NHẤT mảng JSON thuần túy (không kèm lời chào hay giải thích ngoài khối JSON) theo đúng cấu trúc sau:
[
  {
    "id": 1,
    "startTime": 0.00,
    "endTime": 3.20,
    "text": "Nội dung câu tiếng Pháp thứ nhất.",
    "words": [
      { "word": "Từ1", "startTime": 0.00, "endTime": 0.60 },
      { "word": "Từ2", "startTime": 0.65, "endTime": 1.10 }
    ]
  }
]`;
    }

    let currentArtPromptMode = 'align';

    window.switchArtPromptTab = function(mode) {
      currentArtPromptMode = mode === 'transcribe' ? 'transcribe' : 'align';
      const btnAlign = document.getElementById('art-sync-tab-align');
      const btnTranscribe = document.getElementById('art-sync-tab-transcribe');
      const preview = document.getElementById('art-sync-prompt-preview');

      if (btnAlign && btnTranscribe) {
        if (currentArtPromptMode === 'align') {
          btnAlign.classList.add('on');
          btnAlign.setAttribute('aria-selected', 'true');
          btnTranscribe.classList.remove('on');
          btnTranscribe.setAttribute('aria-selected', 'false');
        } else {
          btnTranscribe.classList.add('on');
          btnTranscribe.setAttribute('aria-selected', 'true');
          btnAlign.classList.remove('on');
          btnAlign.setAttribute('aria-selected', 'false');
        }
      }

      if (preview) {
        if (currentArtPromptMode === 'align') {
          preview.textContent = generateAiTimestampPrompt(currentVideoTitle, sentences);
        } else {
          preview.textContent = generateAiTranscriptionPrompt(currentVideoTitle);
        }
      }
    };

    window.openArtAiSyncModal = function() {
      const modal = document.getElementById('modal-art-ai-sync');
      if (!modal) return;
      switchArtPromptTab(currentArtPromptMode || 'align');
      const statusEl = document.getElementById('art-sync-status');
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'art-sync-status';
      }
      const copyLbl = document.getElementById('art-sync-copy-label');
      if (copyLbl) copyLbl.textContent = 'Sao chép Prompt';
      modal.style.display = 'flex';
    };

    window.closeArtAiSyncModal = function() {
      const modal = document.getElementById('modal-art-ai-sync');
      if (modal) modal.style.display = 'none';
    };

    window.copyArtAiPrompt = function() {
      const promptText = currentArtPromptMode === 'transcribe'
        ? generateAiTranscriptionPrompt(currentVideoTitle)
        : generateAiTimestampPrompt(currentVideoTitle, sentences);
      navigator.clipboard.writeText(promptText).then(() => {
        const copyLbl = document.getElementById('art-sync-copy-label');
        if (copyLbl) copyLbl.textContent = '✓ Đã sao chép!';
        setTimeout(() => {
          if (copyLbl) copyLbl.textContent = 'Sao chép Prompt';
        }, 2000);
      }).catch(err => {
        showVocabToast('Không thể sao chép: ' + err.message, false);
      });
    };

    window.applyArtAiSyncTranscript = function() {
      const inputEl = document.getElementById('art-sync-input');
      const statusEl = document.getElementById('art-sync-status');
      if (!inputEl) return;
      const val = inputEl.value.trim();
      if (!val) {
        if (statusEl) {
          statusEl.textContent = 'Vui lòng dán nội dung timestamps vào ô trên.';
          statusEl.className = 'art-sync-status is-error';
        }
        return;
      }

      try {
        const parsed = parseAiSyncData(val, sentences);
        if (!parsed.sentences || !parsed.sentences.length) {
          throw new Error('Không trích xuất được câu nào từ nội dung dán vào.');
        }

        // Cập nhật sentences của bài báo hiện tại
        sentences = parsed.sentences;

        // Lưu vào Local History để duy trì trạng thái
        if (currentVideoId) {
          saveToLocalHistory({
            videoId: currentVideoId,
            title: currentVideoTitle,
            duration: sentences[sentences.length - 1].endTime || 0,
            format: 'text',
            isText: true,
            sentences: sentences
          });
        }

        // Cập nhật giao diện phụ đề
        currentSentenceIndex = 0;
        renderSubtitleList();
        renderArticleSidePanel(currentVideoId, currentVideoTitle, sentences);

        // Cập nhật thời lượng thanh audio nếu có
        const audioEl = document.getElementById('art-audio-el');
        const durEl = document.getElementById('art-audio-dur-time');
        const slider = document.getElementById('art-audio-slider');
        if (audioEl && durEl && slider && !audioEl.duration && sentences.length) {
          const maxDur = sentences[sentences.length - 1].endTime || 0;
          durEl.textContent = formatArtTime(maxDur);
          slider.max = maxDur;
        }

        if (statusEl) {
          statusEl.textContent = `✓ Đã đồng bộ thành công ${parsed.count} câu với mốc thời gian AI!`;
          statusEl.className = 'art-sync-status is-success';
        }
        showVocabToast(`Đã đồng bộ ${parsed.count} câu với mốc thời gian AI!`, true);
        setTimeout(() => {
          closeArtAiSyncModal();
        }, 1200);
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = 'Lỗi: ' + err.message;
          statusEl.className = 'art-sync-status is-error';
        }
      }
    };

    function validateAiSyncJson(data) {
      if (!data) return { ok: false, reason: 'Dữ liệu JSON rỗng' };
      const items = Array.isArray(data) ? data : (data.sentences || data.subtitles || data.cues || []);
      if (!Array.isArray(items) || !items.length) {
        return { ok: false, reason: 'JSON không chứa danh sách các câu (cần mảng array hoặc thuộc tính "sentences")' };
      }
      const sample = items[0];
      if (!sample || typeof sample !== 'object') {
        return { ok: false, reason: 'Các phần tử trong danh sách không phải đối tượng câu' };
      }
      const hasText = sample.text != null || sample.sentence != null || sample.t != null || sample.words != null;
      const hasTime = sample.startTime != null || sample.start != null || (Array.isArray(sample.words) && sample.words[0] && sample.words[0].startTime != null);
      if (!hasText) {
        return { ok: false, reason: 'Thiếu trường nội dung câu ("text") trong các phần tử' };
      }
      if (!hasTime) {
        return { ok: false, reason: 'Thiếu mốc thời gian phát âm ("startTime" hoặc "start") trong các phần tử' };
      }
      return { ok: true, items };
    }
    window.validateAiSyncJson = validateAiSyncJson;

    function generateAiSyncFixPrompt(rawJsonStr) {
      const truncated = (rawJsonStr || '').length > 3000 ? rawJsonStr.slice(0, 3000) + '\n... (đã cắt ngắn dữ liệu)' : rawJsonStr;
      return `Tôi có một file JSON chứa phụ đề/timestamps nhưng cấu trúc hiện tại chưa đúng với chuẩn của French Shadowing Studio.

YÊU CẦU:
Hãy chuyển đổi dữ liệu JSON dưới đây sang ĐÚNG cấu trúc JSON chuẩn của French Shadowing Studio (chỉ trả về DUY NHẤT khối mã JSON, không thêm bất kỳ lời chào hay giải thích nào khác):

[CẤU TRÚC CHUẨN MẪU]:
[
  {
    "id": 1,
    "startTime": 0.00,
    "endTime": 3.20,
    "text": "Nội dung câu tiếng Pháp.",
    "words": [
      { "word": "Từ1", "startTime": 0.00, "endTime": 0.60 },
      { "word": "Từ2", "startTime": 0.65, "endTime": 1.10 }
    ]
  }
]

[DỮ LIỆU CẦN CHUYỂN ĐỔI]:
${truncated}`;
    }
    window.generateAiSyncFixPrompt = generateAiSyncFixPrompt;

    let currentArtAiSyncRawInvalid = '';

    window.handleArtAiSyncFileInput = function(e) {
      const file = e.target && e.target.files && e.target.files[0];
      if (!file) return;
      const fixBox = document.getElementById('art-sync-ai-fix-box');
      const fixMsg = document.getElementById('art-sync-ai-fix-msg');
      const statusEl = document.getElementById('art-sync-status');
      const inputEl = document.getElementById('art-sync-input');
      if (fixBox) fixBox.style.display = 'none';

      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result || '').trim();
        if (inputEl) inputEl.value = content;

        if (content.startsWith('{') || content.startsWith('[')) {
          try {
            const parsed = JSON.parse(cleanMarkdownFences(content));
            const check = validateAiSyncJson(parsed);
            if (!check.ok) {
              currentArtAiSyncRawInvalid = content;
              if (statusEl) {
                statusEl.textContent = '⚠️ ' + check.reason;
                statusEl.className = 'art-sync-status is-error';
              }
              if (fixBox) {
                if (fixMsg) fixMsg.textContent = `⚠️ Cấu trúc JSON chưa khớp chuẩn Studio: ${check.reason}`;
                fixBox.style.display = 'flex';
              }
              showVocabToast('Cấu trúc file JSON chưa khớp chuẩn. Hãy bấm sao chép Prompt nhờ AI sửa lại.', false);
              return;
            }
          } catch(err) {
            currentArtAiSyncRawInvalid = content;
            if (statusEl) {
              statusEl.textContent = '⚠️ Định dạng JSON không hợp lệ: ' + err.message;
              statusEl.className = 'art-sync-status is-error';
            }
            if (fixBox) {
              if (fixMsg) fixMsg.textContent = '⚠️ File JSON bị lỗi cú pháp: ' + err.message;
              fixBox.style.display = 'flex';
            }
            return;
          }
        }

        if (statusEl) {
          statusEl.textContent = `✓ Đã nạp file "${file.name}". Bấm "Áp dụng Timestamps" để hoàn tất.`;
          statusEl.className = 'art-sync-status is-success';
        }
        showVocabToast(`Đã nạp file "${file.name}"`, true);
      };
      reader.readAsText(file);
    };

    window.copyArtAiSyncFixPrompt = function() {
      const raw = currentArtAiSyncRawInvalid || (document.getElementById('art-sync-input') && document.getElementById('art-sync-input').value) || '';
      const prompt = generateAiSyncFixPrompt(raw);
      navigator.clipboard.writeText(prompt).then(() => {
        const lbl = document.getElementById('art-sync-copy-fix-label');
        if (lbl) lbl.textContent = '✓ Đã sao chép Prompt!';
        setTimeout(() => {
          if (lbl) lbl.textContent = 'Sao chép Prompt nhờ AI sửa lại file';
        }, 2000);
        showVocabToast('Đã sao chép Prompt. Dán vào ChatGPT/Claude để sửa lại file!', true);
      }).catch(err => {
        showVocabToast('Không thể sao chép: ' + err.message, false);
      });
    };

    function validateArticleJson(data) {
      if (!data) return { ok: false, reason: 'Dữ liệu JSON rỗng' };
      if (typeof data === 'string') {
        const t = data.trim();
        return t ? { ok: true, text: t, title: '', sentences: null } : { ok: false, reason: 'Chuỗi JSON rỗng' };
      }
      if (Array.isArray(data)) {
        if (!data.length) return { ok: false, reason: 'Mảng JSON rỗng' };
        const text = data.map(item => (typeof item === 'string' ? item : (item.text || item.sentence || item.t || ''))).filter(Boolean).join('\n\n');
        if (!text.trim()) return { ok: false, reason: 'Mảng JSON không chứa văn bản câu tiếng Pháp nào' };
        const hasTimings = data.some(item => typeof item === 'object' && item && (item.startTime != null || item.start != null));
        return { ok: true, text: text.trim(), title: '', sentences: hasTimings ? data : null };
      }
      if (typeof data === 'object') {
        const title = String(data.title || data.name || data.heading || '').trim();
        let text = String(data.text || data.content || data.body || data.article || '').trim();
        let sentences = null;
        if (Array.isArray(data.sentences) && data.sentences.length) {
          if (!text) {
            text = data.sentences.map(s => (typeof s === 'string' ? s : (s.text || s.sentence || s.t || ''))).filter(Boolean).join('\n\n');
          }
          sentences = data.sentences;
        }
        if (!text.trim()) {
          return { ok: false, reason: 'File JSON không có các trường nội dung bài báo: "text", "content" hoặc "sentences"' };
        }
        return { ok: true, text: text.trim(), title, sentences };
      }
      return { ok: false, reason: 'Định dạng JSON không tương thích' };
    }
    window.validateArticleJson = validateArticleJson;

    function generateArticleJsonFixPrompt(rawJsonStr) {
      const truncated = (rawJsonStr || '').length > 3000 ? rawJsonStr.slice(0, 3000) + '\n... (đã cắt ngắn dữ liệu)' : rawJsonStr;
      return `Tôi có một file JSON chứa nội dung bài báo/bài đọc tiếng Pháp nhưng cấu trúc chưa khớp với chuẩn của French Shadowing Studio.

YÊU CẦU:
Hãy chuyển đổi dữ liệu JSON dưới đây sang ĐÚNG cấu trúc JSON chuẩn của French Shadowing Studio (chỉ trả về DUY NHẤT khối mã JSON, không thêm lời chào hay giải thích):

[CẤU TRÚC CHUẨN MẪU]:
{
  "title": "Tiêu đề bài báo tiếng Pháp",
  "text": "Toàn bộ nội dung bài báo tiếng Pháp được phân tách thành các đoạn hoặc các câu...",
  "sentences": [
    { "text": "Câu tiếng Pháp thứ nhất..." },
    { "text": "Câu tiếng Pháp thứ hai..." }
  ]
}

[DỮ LIỆU CẦN CHUYỂN ĐỔI]:
${truncated}`;
    }
    window.generateArticleJsonFixPrompt = generateArticleJsonFixPrompt;

    let currentTextJsonRawInvalid = '';

    window.handleTextJsonFileInput = function(e) {
      const file = e.target && e.target.files && e.target.files[0];
      if (!file) return;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ti = document.getElementById('text-shadow-title-input');
      const ta = document.getElementById('text-shadow-textarea');
      const wc = document.getElementById('text-wc');
      const fixBox = document.getElementById('text-json-ai-fix-box');
      const fixMsg = document.getElementById('text-json-ai-fix-msg');
      if (fixBox) fixBox.style.display = 'none';

      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result || '').trim();
        let parsed = null;
        try {
          parsed = JSON.parse(cleanMarkdownFences(content));
        } catch(err) {
          currentTextJsonRawInvalid = content;
          if (fixBox) {
            if (fixMsg) fixMsg.textContent = '⚠️ File JSON bị lỗi cú pháp: ' + err.message;
            fixBox.style.display = 'flex';
          }
          showVocabToast('File JSON bị lỗi cú pháp. Bạn có thể sao chép Prompt nhờ AI sửa lại.', false);
          return;
        }

        const check = validateArticleJson(parsed);
        if (!check.ok) {
          currentTextJsonRawInvalid = content;
          if (fixBox) {
            if (fixMsg) fixMsg.textContent = `⚠️ Cấu trúc file JSON chưa khớp: ${check.reason}`;
            fixBox.style.display = 'flex';
          }
          showVocabToast('Cấu trúc file JSON chưa khớp. Hãy sao chép Prompt nhờ AI sửa lại.', false);
          return;
        }

        if (ti && (!ti.value.trim() || check.title)) {
          ti.value = check.title || baseName;
        }
        if (ta) {
          ta.value = check.text;
          if (wc) wc.textContent = check.text ? check.text.split(/\s+/).length : 0;
        }
        if (check.sentences) {
          window.__pendingArticleJsonSentences = check.sentences;
        } else {
          window.__pendingArticleJsonSentences = null;
        }
        showVocabToast(`Đã nạp file JSON thành công: "${file.name}"`, true);
      };
      reader.readAsText(file);
    };

    window.copyTextJsonFixPrompt = function() {
      const raw = currentTextJsonRawInvalid || (document.getElementById('text-shadow-textarea') && document.getElementById('text-shadow-textarea').value) || '';
      const prompt = generateArticleJsonFixPrompt(raw);
      navigator.clipboard.writeText(prompt).then(() => {
        const lbl = document.getElementById('text-json-copy-fix-label');
        if (lbl) lbl.textContent = '✓ Đã sao chép Prompt!';
        setTimeout(() => {
          if (lbl) lbl.textContent = 'Sao chép Prompt nhờ AI sửa lại file JSON này';
        }, 2000);
        showVocabToast('Đã sao chép Prompt. Dán vào ChatGPT/Claude để chuẩn hóa file JSON!', true);
      }).catch(err => {
        showVocabToast('Không thể sao chép: ' + err.message, false);
      });
    };

    window.resetArticleTimestamps = function() {
      if (!currentVideoId || !sentences || !sentences.length) return;
      if (!confirm('Khôi phục timestamps mặc định (1 giây/câu) cho bài báo này?')) return;

      sentences = sentences.map((s, idx) => ({
        ...s,
        startTime: idx,
        endTime: idx + 1,
        words: undefined
      }));

      saveToLocalHistory({
        videoId: currentVideoId,
        title: currentVideoTitle,
        duration: sentences.length,
        format: 'text',
        isText: true,
        sentences: sentences
      });

      renderSubtitleList();
      renderArticleSidePanel(currentVideoId, currentVideoTitle, sentences);
      closeArtAiSyncModal();
      showVocabToast('Đã khôi phục timestamps mặc định cho bài viết', true);
    };

    window.lookupArticleWord = function(word) {
      if (!word) return;
      if (window.speakFrench) window.speakFrench(word);
      showVocabToast('Đang phát âm: ' + word, true);
    };

    window.copyFullArticleText = function() {
      if (!sentences || !sentences.length) {
        showVocabToast('Không có nội dung bài viết để sao chép', false);
        return;
      }
      const full = sentences.map(s => (s.text || '').trim()).filter(Boolean).join('\n\n');
      navigator.clipboard.writeText(full).then(() => {
        showVocabToast('Đã sao chép toàn bộ bài viết vào bộ nhớ tạm', true);
      }).catch(() => {
        showVocabToast('Không thể sao chép vào bộ nhớ tạm', false);
      });
    };

    function startTextShadowingFromPaste() {
      const raw = (document.getElementById('text-shadow-textarea').value || '').trim();
      if (!raw) { showVocabToast('Hãy dán văn bản vào ô bên trên trước đã', false); return; }
      const title = (document.getElementById('text-shadow-title-input').value || '').trim();
      const customSentences = window.__pendingArticleJsonSentences || null;
      window.__pendingArticleJsonSentences = null;
      enterTextShadowing(raw, title, null, customSentences);
    }

    window.handleTextFileInput = function(e) {
      const file = e.target && e.target.files && e.target.files[0];
      if (!file) return;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ti = document.getElementById('text-shadow-title-input');
      const ta = document.getElementById('text-shadow-textarea');
      if (ti && !ti.value.trim()) ti.value = baseName;

      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (ext === 'json') {
        if (typeof window.handleTextJsonFileInput === 'function') {
          window.handleTextJsonFileInput(e);
          return;
        }
      }
      if (ext === 'docx') {
        const fr = new FileReader();
        fr.onload = async () => {
          try {
            const blocks = await artParseDocx(fr.result);
            const text = blocks.filter(b => b.t !== 'img').map(b => b.x).join('\n\n');
            if (ta) {
              ta.value = text;
              const wc = document.getElementById('text-wc');
              if (wc) wc.textContent = text ? text.split(/\s+/).length : 0;
            }
            showVocabToast('Đã nạp file Word thành công', true);
          } catch(err) {
            showVocabToast('Không đọc được file docx này: ' + (err.message || err), false);
          }
        };
        fr.readAsArrayBuffer(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        let content = String(reader.result || '');
        if (ext === 'html' || ext === 'htm') {
          const doc = new DOMParser().parseFromString(content, 'text/html');
          content = doc.body ? doc.body.innerText : content;
        } else if (ext === 'md' || ext === 'markdown') {
          content = typeof artMdInline === 'function' ? artMdInline(content) : content;
        }
        if (ta) {
          ta.value = content.trim();
          const wc = document.getElementById('text-wc');
          if (wc) wc.textContent = content.trim() ? content.trim().split(/\s+/).length : 0;
        }
        showVocabToast('Đã nạp file thành công', true);
      };
      reader.readAsText(file);
    };

    // Mở một bài trong "Thư viện bài viết" (mục "Article" trong category.json): đọc file văn bản
    // thuần <articleId>.txt cùng thư mục với index.html, giống quy ước <videoId>.srt của video.
    async function selectCategoryArticle(articleId, title) {
      try {
        const res = await fetch(`${DATA_DIR}${articleId}.txt?t=${Date.now()}`, { cache: 'no-cache' });
        if (!res.ok) throw new Error('not found');
        const text = await res.text();
        if (!text || text.trim().toLowerCase().startsWith('<!doctype html')) throw new Error('not text');
        enterTextShadowing(text, title || articleId, articleId);
      } catch (e) {
        showVocabToast(`Không tìm thấy file bài viết "${articleId}.txt" cùng thư mục`, false);
      }
    }

    // ==================== "THỬ ĐỌC BÀI VIẾT CÓ SẴN" (thư mục articles/) ====================
    // Cấu trúc (đặt cùng chỗ với index.html):
    //   articles/articles.json   { "articles": [ "bai-1.txt", "bai-2.docx", "bai-3.html", "bai-4.md" ] }
    //                            (cũng nhận {"file": "...", "title": "..."} cho từng bài nếu muốn đặt tên riêng)
    //   articles/<tên file>      Định dạng được hỗ trợ:
    //     .txt   dán thẳng nguyên văn bài (không có ảnh). Dòng chữ đầu tiên = tiêu đề.
    //     .docx  file Word: tiêu đề (Heading/Title), đoạn văn và CẢ HÌNH ẢNH nằm trong file.
    //     .html  trang web đã lưu: ảnh nhúng base64 (data:) hoặc ảnh để cạnh file đều được.
    //     .md    Markdown: ![mô tả](ảnh.png) với ảnh nhúng base64, ảnh để cạnh file hoặc link http(s).
    //   Bài có ảnh -> thẻ có thumbnail (ảnh đầu bài) và khi mở bài, ảnh hiện đúng vị trí như bài import từ extension.
    const ARTICLES_DIR = 'articles';
    const ARTICLES_INDEX = 'articles.json';
    const ART_EXT_RE = /\.(txt|md|markdown|html?|docx)$/i;
    let artLibItems = null, artLibLoading = null, artLibError = '', artOpening = false;

    function artWordCount(t) { t = String(t || '').trim(); return t ? t.split(/\s+/).length : 0; }
    function artUrl(file) { return ARTICLES_DIR + '/' + encodeURIComponent(file); }
    function artExtOf(file) {
      const m = ART_EXT_RE.exec(String(file || ''));
      const e = m ? m[1].toLowerCase() : 'txt';
      return e === 'htm' ? 'html' : (e === 'markdown' ? 'md' : e);
    }
    function artPreview(text, title) {
      const lines = String(text || '').split(/\r?\n/).map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => /[\p{L}\p{N}]/u.test(x));
      let i = 0;
      if (lines.length && title && lines[0].slice(0, 90).trim() === String(title).replace(/…$/, '').trim()) i = 1;
      const body = lines.slice(i).join(' ');
      return body.length > 170 ? body.slice(0, 170).trim() + '…' : body;
    }
    async function artFetchText(url, allowHtml) {
      const r = await fetch(url + '?t=' + Date.now(), { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const t = await r.text();
      // máy chủ trả về trang index.html của app khi không tìm thấy file -> coi như không có
      if (allowHtml ? /id=["']main-card["']/.test(t) : /^\s*<!doctype html/i.test(t)) throw new Error('not found');
      return t;
    }
    async function artFetchBuf(url) {
      const r = await fetch(url + '?t=' + Date.now(), { cache: 'no-cache' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const b = await r.arrayBuffer();
      const u = new Uint8Array(b, 0, Math.min(2, b.byteLength));
      if (u[0] !== 0x50 || u[1] !== 0x4b) throw new Error('not a zip/docx');   // file .docx là ZIP: bắt đầu bằng "PK"
      return b;
    }
    function artBlobToDataUrl(blob) {
      return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(fr.error); fr.readAsDataURL(blob); });
    }
    // Thu nhỏ ảnh đầu bài thành thumbnail nhẹ cho thẻ (ảnh gốc có thể vài MB)
    function artMakeThumb(d) {
      return new Promise((res) => {
        const im = new Image();
        im.onload = () => {
          try {
            const sc = Math.min(1, 480 / (im.naturalWidth || 480));
            const c = document.createElement('canvas');
            c.width = Math.max(1, Math.round(im.naturalWidth * sc)); c.height = Math.max(1, Math.round(im.naturalHeight * sc));
            const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
            res(c.toDataURL('image/jpeg', 0.8));
          } catch (e) { res(d); }
        };
        im.onerror = () => res(null);
        im.src = d;
      });
    }

    // ---------- Đọc ảnh theo yêu cầu: trả { d: dataURL, u: link gốc } hoặc null ----------
    async function artLoadImage(src, base) {
      src = String(src || '').trim();
      if (/^data:image\//i.test(src)) return { d: src };
      let abs;
      try { abs = new URL(src, base).href; } catch (e) { return null; }
      if (!/^https?:/i.test(abs)) return null;
      const out = {};
      if (abs.length <= 800) out.u = abs;
      try {
        if (new URL(abs).origin === location.origin) {   // ảnh để cạnh file bài viết: nạp luôn vào bộ nhớ trình duyệt để đọc offline
          const r = await fetch(abs);
          if (r.ok) { const b = await r.blob(); if (/^image\//.test(b.type) && b.size <= 12e6) out.d = await artBlobToDataUrl(b); }
        }
      } catch (e) {}
      return (out.d || out.u) ? out : null;
    }
    function artImgBlock(src, alt, cap, base) {
      return { t: 'img', a: String(alt || ''), c: String(cap || ''), load: () => artLoadImage(src, base) };
    }

    // ---------- .md ----------
    function artMdInline(t) {
      return String(t)
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[\s(])[*_]([^*_\n]+?)[*_](?=[\s).,;:!?]|$)/g, '$1$2')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/~~(.+?)~~/g, '$1');
    }
    function artParseMd(text, base) {
      const blocks = [];
      const IMG = /!\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*\)/g;
      let buf = [];
      const flush = () => {
        const t = artMdInline(buf.join(' ')).replace(/\s+/g, ' ').trim();
        buf = [];
        if (/[\p{L}\p{N}]/u.test(t)) blocks.push({ t: 'p', x: t });
      };
      let src = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
      if (/^---\n/.test(src)) { const end = src.indexOf('\n---', 4); if (end > 0) src = src.slice(end + 4); }   // bỏ front matter
      src.split('\n').forEach((raw) => {
        let line = raw.trim();
        if (!line) { flush(); return; }
        if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line) || /^```/.test(line)) { flush(); return; }
        const hm = /^#{1,6}\s+(.*?)\s*#*$/.exec(line);
        if (hm) { flush(); const t = artMdInline(hm[1]).trim(); if (t) blocks.push({ t: 'h', x: t }); return; }
        line = line.replace(/^>\s?/, '');
        const isItem = /^(?:[-*+]|\d{1,3}[.)])\s+/.test(line);
        if (isItem) { flush(); line = line.replace(/^(?:[-*+]|\d{1,3}[.)])\s+/, ''); }
        let last = 0, m;
        IMG.lastIndex = 0;
        while ((m = IMG.exec(line))) {
          buf.push(line.slice(last, m.index)); flush();
          let s = m[2]; if (s[0] === '<') s = s.slice(1, -1);
          blocks.push(artImgBlock(s, m[1], m[3] || m[4] || '', base));
          last = m.index + m[0].length;
        }
        buf.push(line.slice(last));
        if (isItem) flush();
      });
      flush();
      return blocks;
    }

    // ---------- .html ----------
    function artParseHtml(text, base) {
      const doc = new DOMParser().parseFromString(String(text || ''), 'text/html');
      doc.querySelectorAll('script,style,noscript,svg,template,iframe,nav,head').forEach((e) => e.remove());
      const blocks = [];
      let buf = '';
      const flush = () => { const t = buf.replace(/\s+/g, ' ').trim(); buf = ''; if (t) blocks.push({ t: 'p', x: t }); };
      const BLOCKISH = 'p,div,h1,h2,h3,h4,h5,h6,li,ul,ol,blockquote,table,tr,pre,section,article,figure,img,dl';
      const LEAF = new Set(['P', 'LI', 'PRE', 'BLOCKQUOTE', 'TD', 'TH', 'DT', 'DD', 'FIGCAPTION', 'CAPTION']);
      const pushImg = (el, cap) => {
        const w = parseInt(el.getAttribute('width'), 10), h = parseInt(el.getAttribute('height'), 10);
        if ((w && w <= 48) || (h && h <= 48)) return;   // bỏ icon nhỏ
        const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
        if (!src) return;
        flush();
        blocks.push(artImgBlock(src, el.getAttribute('alt') || '', cap || '', base));
      };
      const walk = (node) => {
        node.childNodes.forEach((c) => {
          if (c.nodeType === 3) { buf += c.nodeValue; return; }
          if (c.nodeType !== 1) return;
          const tag = c.tagName;
          if (tag === 'BR') { buf += ' '; return; }
          if (tag === 'IMG') { pushImg(c, ''); return; }
          if (/^H[1-6]$/.test(tag)) { flush(); const t = (c.textContent || '').replace(/\s+/g, ' ').trim(); if (t) blocks.push({ t: 'h', x: t }); return; }
          if (tag === 'FIGURE') {
            flush();
            const im = c.querySelector('img'), fc = c.querySelector('figcaption');
            const cap = fc ? (fc.textContent || '').replace(/\s+/g, ' ').trim() : '';
            if (im) { pushImg(im, cap); return; }
            if (cap) blocks.push({ t: 'p', x: cap });
            return;
          }
          const hasBlock = !!c.querySelector(BLOCKISH);
          if (LEAF.has(tag) && !hasBlock) { flush(); buf = c.textContent || ''; flush(); return; }
          if (hasBlock || /^(DIV|SECTION|ARTICLE|UL|OL|TABLE|TBODY|THEAD|TR|DL|MAIN|BODY|ASIDE|HEADER|FOOTER|BLOCKQUOTE|LI|P)$/.test(tag)) { flush(); walk(c); flush(); return; }
          buf += c.textContent || '';
        });
      };
      walk(doc.body || doc.documentElement);
      flush();
      return blocks;
    }

    // ---------- .docx (tự giải nén ZIP bằng bkZipEntries/bkZipRead của phần Đọc sách, không cần thư viện ngoài) ----------
    const ART_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml' };
    async function artParseDocx(buf) {
      const u8 = new Uint8Array(buf), entries = bkZipEntries(u8), dec = new TextDecoder('utf-8');
      const readU8 = async (name) => { const e = entries[name]; return e ? bkZipRead(u8, e) : null; };
      const xmlOf = async (name) => { const b = await readU8(name); return b ? new DOMParser().parseFromString(dec.decode(b), 'text/xml') : null; };
      const docXml = await xmlOf('word/document.xml');
      if (!docXml) throw new Error('Không phải file .docx hợp lệ');
      const kids = (el, ln) => Array.from(el.children).filter((x) => x.localName === ln);
      const attr = (el, ln) => { if (!el) return ''; for (const a of Array.from(el.attributes)) { if (a.localName === ln) return a.value; } return ''; };
      const rels = {};
      const relDoc = await xmlOf('word/_rels/document.xml.rels');
      if (relDoc) Array.from(relDoc.getElementsByTagName('Relationship')).forEach((r) => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });
      const styleName = {};
      const stDoc = await xmlOf('word/styles.xml');
      if (stDoc) Array.from(stDoc.getElementsByTagNameNS('*', 'style')).forEach((s) => {
        const nm = kids(s, 'name')[0];
        styleName[attr(s, 'styleId')] = (attr(nm, 'val') || '').toLowerCase();
      });
      const blocks = [];
      const imgBlock = (rid, alt) => {
        const target = rels[rid];
        if (!target) return null;
        const path = bkResolvePath('word/', target);
        const ext = (path.split('.').pop() || '').toLowerCase();
        const mime = ART_MIME[ext];
        if (!mime) return null;   // emf/wmf/tiff... trình duyệt không hiển thị được
        return { t: 'img', a: alt || '', c: '', load: async () => { const b = await readU8(path); return b ? { d: await artBlobToDataUrl(new Blob([b], { type: mime })) } : null; } };
      };
      const doParagraph = (p) => {
        let isH = false, buf = '';
        const pPr = kids(p, 'pPr')[0];
        if (pPr) {
          const ps = kids(pPr, 'pStyle')[0];
          if (ps) {
            const id = attr(ps, 'val'), nm = styleName[id] || id.toLowerCase();
            if (/^(heading|title|subtitle|tiêu đề)/.test(nm) || /^(heading|title)/i.test(id)) isH = true;
          }
          const ol = kids(pPr, 'outlineLvl')[0];
          if (ol && parseInt(attr(ol, 'val'), 10) < 9) isH = true;
        }
        const flush = () => { const t = buf.replace(/\s+/g, ' ').trim(); buf = ''; if (t) blocks.push({ t: isH ? 'h' : 'p', x: t }); };
        const walk = (n) => {
          Array.from(n.children).forEach((c) => {
            const ln = c.localName;
            if (ln === 't') buf += c.textContent;
            else if (ln === 'tab' || ln === 'br' || ln === 'cr') buf += ' ';
            else if (ln === 'drawing') {
              const bl = c.getElementsByTagNameNS('*', 'blip')[0], dp = c.getElementsByTagNameNS('*', 'docPr')[0];
              const b = bl && imgBlock(attr(bl, 'embed'), dp ? (dp.getAttribute('descr') || dp.getAttribute('title') || '') : '');
              if (b) { flush(); blocks.push(b); }
            } else if (ln === 'pict') {
              const im = c.getElementsByTagNameNS('*', 'imagedata')[0];
              const b = im && imgBlock(attr(im, 'id'), '');
              if (b) { flush(); blocks.push(b); }
            } else if (ln === 'AlternateContent') {
              const ch = kids(c, 'Choice')[0]; if (ch) walk(ch);
            } else if (ln === 'Fallback' || ln === 'txbxContent' || ln === 'instrText' || ln === 'rPr' || ln === 'pPr') { /* bỏ qua */ }
            else walk(c);   // r, hyperlink, ins, smartTag, sdtContent...
          });
        };
        walk(p);
        flush();
      };
      const walkBlock = (n) => {
        Array.from(n.children).forEach((c) => {
          if (c.localName === 'p') doParagraph(c);
          else if (/^(tbl|tr|tc|sdt|sdtContent|customXml)$/.test(c.localName)) walkBlock(c);
        });
      };
      const body = docXml.getElementsByTagNameNS('*', 'body')[0] || docXml.documentElement;
      walkBlock(body);
      return blocks;
    }

    async function artParseFile(file, ext) {
      const url = artUrl(file), base = new URL(url, location.href).href;
      if (ext === 'docx') return artParseDocx(await artFetchBuf(url));
      if (ext === 'html') return artParseHtml(await artFetchText(url, true), base);
      if (ext === 'md') return artParseMd(await artFetchText(url), base);
      throw new Error('Định dạng chưa hỗ trợ: ' + ext);
    }

    async function loadArticleLibrary(force) {
      if (artLibItems && !force) return artLibItems;
      if (artLibLoading && !force) return artLibLoading;
      artLibLoading = (async () => {
        artLibError = '';
        let list = [];
        try {
          const raw = await artFetchText(ARTICLES_DIR + '/' + ARTICLES_INDEX);
          const j = JSON.parse(raw.replace(/,\s*([\]}])/g, '$1'));
          const arr = Array.isArray(j) ? j : (j.articles || j.files || []);
          list = arr.map((x) => (typeof x === 'string' ? { file: x } : x)).filter((x) => x && typeof x.file === 'string' && x.file.trim());
          // File song ngữ "<tên>_vi.<đuôi>" đi kèm bài gốc -> không hiện thành thẻ riêng
          const allIds = new Set(list.map((x) => x.file.trim().replace(ART_EXT_RE, '')));
          list = list.filter((x) => { const i = x.file.trim().replace(ART_EXT_RE, ''); return !(/_vi$/i.test(i) && allIds.has(i.slice(0, -3))); });
        } catch (e) {
          artLibError = location.protocol === 'file:' ? 'file' : 'index';
          artLibItems = [];
          return artLibItems;
        }
        const seen = new Set();
        const res = await Promise.all(list.map(async (x) => {
          const file = x.file.trim();
          const id = file.replace(ART_EXT_RE, '');
          if (seen.has(id)) return null;
          seen.add(id);
          const ext = artExtOf(file);
          const customTitle = !!(x.title && String(x.title).trim());
          try {
            if (ext === 'txt') {
              const text = await artFetchText(artUrl(file));
              if (!text.trim()) return null;
              const title = (customTitle && String(x.title).trim()) || titleFromLines([text]) || id;
              return { id, file, ext, text, title, preview: artPreview(text, title), words: artWordCount(text), sentCount: splitProseIntoSentences(text).length, thumb: '', imgCount: 0, customTitle };
            }
            // Định dạng có thể chứa ảnh: đọc để lấy tiêu đề, số câu và thumbnail (ảnh đầu bài); ảnh đầy đủ chỉ nạp khi mở bài
            const blocks = await artParseFile(file, ext);
            const tb = blocks.filter((b) => b.t !== 'img');
            if (!tb.length) return null;
            const plain = tb.map((b) => b.x).join('\n\n');
            const title = (customTitle && String(x.title).trim()) || titleFromLines(tb.map((b) => b.x)) || id;
            const imgs = blocks.filter((b) => b.t === 'img');
            let thumb = '';
            for (let i = 0; i < Math.min(3, imgs.length) && !thumb; i++) {
              try {
                const r = await imgs[i].load();
                if (r) thumb = (r.d ? await artMakeThumb(r.d) : '') || r.u || '';
              } catch (e) {}
            }
            return { id, file, ext, text: '', title, preview: artPreview(plain, title), words: artWordCount(plain), sentCount: txiBuildSentences(tb.map((b) => ({ t: b.t, x: b.x }))).length, thumb, imgCount: imgs.length, customTitle };
          } catch (e) { console.warn('[articles] không đọc được', file, e && e.message); return null; }
        }));
        artLibItems = res.filter(Boolean);
        return artLibItems;
      })();
      try { return await artLibLoading; } finally { artLibLoading = null; }
    }

    // Thẻ bài viết có sẵn: cùng khung .yt-card với thẻ "Văn bản Bạn Đã Luyện"
    function artCardHTML(it, hist) {
      const h = hist.find((x) => x.videoId === 'art_lib_' + it.id && x.isText);
      const mins = Math.max(1, Math.round(it.words / 200));
      const status = h ? (aicHasTranslation(h.sentences) ? 'Có song ngữ' : 'Chưa có song ngữ') : 'Chưa đọc';
      const imgHTML = it.thumb ? '<img class="txt-thumb-img" alt="" decoding="async" referrerpolicy="no-referrer" />' : '';
      return `
        <div class="yt-card txt-card art-yt-card btn-interactive" data-id="${escHtml(it.id)}" role="button" tabindex="0" title="Bấm để đọc bài này">
          <div class="yt-thumb-wrapper txt-thumb pointer-events-none">
            <span class="txt-thumb-quote">“</span>
            <div class="txt-thumb-title"><span>${escHtml(it.title)}</span></div>
            ${imgHTML}
            <div class="yt-card-loading-overlay"><span class="yt-card-loading-spinner"></span><span>Đang mở...</span></div>
          </div>
          <div class="yt-meta-container pointer-events-none">
            <div class="yt-channel-avatar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg></div>
            <div class="yt-meta-text">
              <h5 class="yt-video-title" title="${escHtml(it.title)}">${escHtml(it.title)}</h5>
              <div class="yt-channel-name">${it.sentCount} câu · ~${mins} phút</div>
              <div class="yt-views-date"><span>${status}</span></div>
            </div>
          </div>
        </div>`;
    }
    window.renderArticleLibrary = async function (onlyIfLoaded) {
      const grid = document.getElementById('art-lib-grid');
      if (!grid) return;
      if (onlyIfLoaded && !artLibItems) return;
      if (!artLibItems) grid.innerHTML = '<div class="art-lib-msg">Đang tải danh sách bài viết…</div>';
      const items = await loadArticleLibrary();
      if (!items.length) {
        const samples = [
          {
            id: 'sample_cannes',
            title: 'Le Festival de Cannes ouvre ses portes sur la Croisette',
            level: 'B1',
            words: 118,
            desc: 'Le 79e Festival de Cannes débute cette semaine avec une sélection exceptionnelle de films internationaux et de réalisateurs renommés.',
            text: "Le Festival de Cannes ouvre ses portes sur la Croisette.\n\nLe 79e Festival de Cannes débute cette semaine avec une sélection exceptionnelle de films internationaux et de cinéastes venus du monde entier.\n\nLa montée des célèbres marches rouges attire des milliers de cinéphiles et de journalistes passionnés.\n\nLe jury international, composé d'artistes prestigieux, décernera la très convoitée Palme d'or lors de la cérémonie de clôture samedi soir."
          },
          {
            id: 'sample_gastronomie',
            title: 'La gastronomie française célèbre son patrimoine vivant',
            level: 'A2',
            words: 96,
            desc: 'Des marchés traditionnels aux bistrots parisiens, le repas gastronomique des Français demeure une tradition conviviale appréciée dans le monde entier.',
            text: "La gastronomie française célèbre son patrimoine vivant.\n\nDes marchés traditionnels aux bistrots parisiens, le repas gastronomique des Français demeure une tradition conviviale très appréciée.\n\nLe pain croustillant, les fromages régionaux et les pâtisseries raffinées font partie du quotidien.\n\nChaque repas partagé en famille est une occasion unique de célébrer l'art de vivre à la française."
          },
          {
            id: 'sample_ecologie',
            title: 'Transition écologique et énergies renouvelables en Europe',
            level: 'B2',
            words: 132,
            desc: "Face aux défis climatiques, plusieurs pays européens accélèrent leurs investissements dans le solaire, l'éolien và la mobilité durable.",
            text: "Transition écologique et énergies renouvelables en Europe.\n\nFace aux défis climatiques actuels, plusieurs pays européens accélèrent leurs investissements dans le solaire, l'éolien et la mobilité durable.\n\nLes grandes métropoles développent de nouveaux réseaux cyclables et modernisent leurs transports publics pour réduire les émissions de carbone.\n\nCette transformation énergétique profonde exige une coopération étroite entre scientifiques, citoyens et décideurs politiques."
          }
        ];
        window.__sampleArticles = samples;
        grid.innerHTML = `
          <div class="art-sample-list">
            ${samples.map((s, idx) => `
              <div class="art-sample-row" role="button" tabindex="0" onclick="enterTextShadowing(window.__sampleArticles[${idx}].text, window.__sampleArticles[${idx}].title, window.__sampleArticles[${idx}].id)">
                <div class="art-sample-main">
                  <div class="art-sample-hd">
                    <span class="art-sample-ico">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </span>
                    <h5 class="art-sample-title">${escapeHtml(s.title)}</h5>
                  </div>
                  <p class="art-sample-desc">${escapeHtml(s.desc)}</p>
                  <div class="art-sample-meta">
                    <span>${s.words} từ</span>
                    <span>·</span>
                    <span>Tiếng Pháp thực tế</span>
                  </div>
                </div>
                <div class="art-sample-side">
                  <span class="art-level-chip level-${s.level.toLowerCase()}">${s.level}</span>
                  <svg class="art-sample-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            `).join('')}
          </div>
        `;
        return;
      }
      const hist = getLocalHistory();
      grid.innerHTML = items.map((it) => artCardHTML(it, hist)).join('');
      grid.querySelectorAll('.art-yt-card').forEach((card) => {
        const it = items.find((x) => x.id === card.dataset.id);
        const wrap = card.querySelector('.txt-thumb'), img = wrap && wrap.querySelector('img.txt-thumb-img');
        if (!it || !img) return;
        img.onload = () => wrap.classList.add('has-img');
        img.onerror = () => wrap.classList.remove('has-img');
        img.src = it.thumb;
      });
    };

    // ---------- File song ngữ AI: "<tên bài>_vi.<đuôi>" cùng thư mục articles/ ----------
    // Ví dụ  Marie Curie.docx  ->  Marie Curie_vi.docx  (cũng nhận .txt / .md / .html). Nội dung = câu trả lời của AI
    // (câu Anh rồi câu Việt xen kẽ), được ghép vào bài đúng như khi dán vào cửa sổ "Nhờ AI dịch".
    async function artFetchVi(it) {
      const base = it.file.replace(ART_EXT_RE, '');
      const own = (ART_EXT_RE.exec(it.file) || [''])[0] || '.txt';
      const cands = [own];
      ['.docx', '.txt', '.md', '.html'].forEach((e) => { if (!cands.some((c) => c.toLowerCase() === e)) cands.push(e); });
      for (const dot of cands) {
        const file = base + '_vi' + dot, ext = artExtOf(file);
        try {
          if (ext === 'txt') { const t = await artFetchText(artUrl(file)); if (t.trim()) return t; continue; }
          const blocks = await artParseFile(file, ext);
          const t = blocks.filter((b) => b.t !== 'img').map((b) => b.x).join('\n');
          if (t.trim()) return t;
        } catch (e) { /* không có file này -> thử đuôi khác */ }
      }
      return '';
    }
    async function artApplyVi(parsed, it) {
      if (aicHasTranslation(parsed)) return parsed;
      const txt = await artFetchVi(it);
      if (!txt) return parsed;
      try {
        const r = applyBilingualFromAi(aiClone(parsed), txt);
        if (r.ok && aicHasTranslation(r.sentences)) { r.sentences.forEach((x, i) => { x.id = i + 1; }); return r.sentences; }
        console.warn('[articles] không ghép được file _vi của', it.file, r.error);
      } catch (e) { console.warn('[articles] lỗi ghép file _vi', e); }
      showVocabToast('Tìm thấy file _vi nhưng không ghép được bản dịch (nội dung tiếng Pháp không khớp bài gốc)', false);
      return parsed;
    }

    // Dòng chữ đầu tiên của bài có sẵn là TIÊU ĐỀ: 1 câu riêng, in đậm, căn giữa (cờ hd + ti)
    function artSentencesFromText(text) {
      const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
      const i = lines.findIndex((l) => /[\p{L}\p{N}]/u.test(l));
      if (i < 0) return [];
      const out = [{ id: 1, startTime: 0, endTime: 1, text: lines[i].replace(/\s+/g, ' ').trim(), hd: 1, ti: 1 }];
      splitProseIntoSentences(lines.slice(i + 1).join('\n')).forEach((x) => {
        out.push(Object.assign({}, x, { id: out.length + 1, startTime: out.length, endTime: out.length + 1 }));
      });
      return out;
    }
    async function artSentencesFromBlocks(blocks, docId) {
      const seq = [], putList = [];
      let n = 0, titled = false;
      for (const b of blocks) {
        if (b.t === 'img') {
          let r = null;
          try { r = await b.load(); } catch (e) {}
          if (!r) continue;
          n++;
          const ref = { a: String(b.a || '').slice(0, 200), c: String(b.c || '').slice(0, 400) };
          if (r.d) { ref.k = `${docId}#${n}`; putList.push({ k: ref.k, d: r.d, ts: Date.now() }); }
          if (r.u && r.u.length <= 800) ref.u = r.u;
          if (ref.k || ref.u) seq.push({ t: 'img', ref });
        } else if (!titled) { titled = true; seq.push({ t: 'h', x: b.x, title: true }); }
        else seq.push({ t: b.t, x: b.x });
      }
      try { await txiPut(putList); } catch (e) { console.warn('[articles] không lưu được ảnh:', e); }
      return txiBuildSentences(seq);
    }

    // Mở 1 bài trong thư mục articles/ (mã bài = tên file bỏ đuôi; mã lưu lịch sử / link: art_lib_<mã>)
    async function openLibraryArticle(id) {
      if (artOpening) return false;
      artOpening = true;
      const card = Array.from(document.querySelectorAll('#art-lib-grid .art-yt-card')).find((c) => c.dataset.id === id);
      if (card) card.classList.add('is-loading');
      try {
        const items = await loadArticleLibrary();
        const it = items.find((x) => x.id === id);
        if (!it) throw new Error('not in index');
        return await openLibraryDoc(it);
      } catch (e) {
        console.warn('[articles] mở bài lỗi', e);
        showVocabToast('Không mở được bài viết này. Hãy kiểm tra thư mục articles và file articles.json.', false);
        return false;
      } finally {
        artOpening = false;
        if (card) card.classList.remove('is-loading');
      }
    }
    async function openLibraryDoc(it) {
      const docId = 'art_lib_' + it.id;
      const norm = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
      const saved = getLocalHistory().find((h) => h.videoId === docId && h.isText && h.sentences && h.sentences.length);
      const savedHasImgs = !!(saved && saved.sentences.some((s) => s.imgs && s.imgs.length));
      const blocks = it.ext === 'txt' ? null : await artParseFile(it.file, it.ext);
      // Đã dịch song ngữ (hoặc đã lưu ảnh) -> dùng lại bản đã lưu để không mất dữ liệu; còn lại dựng mới
      const reuse = !!saved && (aicHasTranslation(saved.sentences) || savedHasImgs);
      let parsed;
      if (reuse) {
        parsed = aiClone(saved.sentences);
        if (!parsed.some((s) => s.ti)) {   // bản lưu từ phiên bản cũ: đánh dấu tiêu đề nếu câu đầu đúng là dòng đầu của bài
          const first = it.ext === 'txt' ? ((String(it.text).split(/\r?\n/).find((l) => /[\p{L}\p{N}]/u.test(l))) || '') : ((blocks.find((b) => b.t !== 'img') || {}).x || '');
          if (norm(first) && norm(parsed[0].text) === norm(first)) { parsed[0].hd = 1; parsed[0].ti = 1; }
        }
      } else {
        parsed = it.ext === 'txt' ? artSentencesFromText(it.text) : await artSentencesFromBlocks(blocks, docId);
      }
      if (!parsed.length) { showVocabToast('Không tách được câu nào từ bài viết này', false); return false; }
      parsed = await artApplyVi(parsed, it);
      const title = (it.customTitle ? it.title : '') || (saved && saved.title) || it.title;
      openTextSession(docId, title, parsed);
      setTimeout(txiGc, 6000);
      return true;
    }
    document.addEventListener('DOMContentLoaded', () => {
      const g = document.getElementById('art-lib-grid');
      if (!g) return;
      g.addEventListener('click', (e) => { const c = e.target.closest('.art-yt-card[data-id]'); if (c) openLibraryArticle(c.dataset.id); });
      g.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const c = e.target.closest('.art-yt-card[data-id]');
        if (c) { e.preventDefault(); openLibraryArticle(c.dataset.id); }
      });
    });

    // ==================== YOUTUBE PLAYER ====================
    let lastPlayerCurrentTime = 0;

    let _ytWatch = null;
    function hidePlayerError() { const o = document.getElementById('yt-error-overlay'); if (o) o.remove(); }
    function showPlayerError(code) {
      hidePlayerError();
      const wrap = document.getElementById('video-frame-wrapper');
      if (!wrap) return;
      const msgs = {
        2: 'Mã video không hợp lệ.', 5: 'Trình duyệt không phát được video này.',
        100: 'Video không tồn tại hoặc đang ở chế độ riêng tư.',
        101: 'Chủ video không cho phép nhúng video này.', 150: 'Chủ video không cho phép nhúng video này.',
        153: 'YouTube từ chối phát vì thiếu thông tin nguồn (referrer) của trang.',
        timeout: 'Video chưa tải được. Kiểm tra mạng, hoặc tắt Brave Shields cho trang này rồi thử lại.'
      };
      const o = document.createElement('div');
      o.id = 'yt-error-overlay';
      o.style.cssText = 'position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px;text-align:center;background:#000;color:#cbd5e1;font-size:13px;line-height:1.4';
      const t = document.createElement('div');
      t.textContent = (msgs[code] || 'Không phát được video.') + (code === 'timeout' ? '' : ' (mã lỗi ' + code + ')');
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = 'Thử lại';
      b.style.cssText = 'padding:7px 16px;border-radius:9999px;background:#dc2626;color:#fff;font-weight:700;font-size:13px;border:0;cursor:pointer';
      b.onclick = () => { hidePlayerError(); initYouTubePlayer(); };
      o.appendChild(t); o.appendChild(b); wrap.appendChild(o);
    }

    function initYouTubePlayer() {
      clearTimeout(_ytWatch); hidePlayerError();
      _ytWatch = setTimeout(() => { if (!isPlayerReady) showPlayerError('timeout'); }, 12000);
      isPlayerReady = false;
      stopSubtitleLoop();
      resetSubtitleSearch();
      resetBilingualForNewVideo();
      if (typeof window.ensureYouTubeIframeApi === 'function') {
        window.ensureYouTubeIframeApi(() => { createYTPlayer(); });
      } else {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        if (!document.getElementById('yt-api-script')) {
          tag.id = 'yt-api-script';
          document.body.appendChild(tag);
        }
        window.onYouTubeIframeAPIReady = () => { createYTPlayer(); };
        if (window.YT && window.YT.Player) { createYTPlayer(); }
      }
    }

    // Tắt phụ đề của chính YouTube (app đã có phụ đề Anh/Việt riêng nên không cần). YouTube hay nạp lại module phụ đề
    // sau khi onReady (lúc bắt đầu phát, hoặc do cài đặt "luôn bật phụ đề" của tài khoản) nên hàm này được gọi lại nhiều lần.
    // Nếu người dùng chủ động bật bằng phím C (isYTCaptionsVisible) thì không ép tắt.
    function ytCaptionsOff(p) {
      try { if (isYTCaptionsVisible) return; } catch (e) {}
      try { if (p && p.setOption) p.setOption('captions', 'track', {}); } catch (e) {}
      try { if (p && p.unloadModule) p.unloadModule('captions'); } catch (e) {}
    }

    function createYTPlayer() {
      try { isYTCaptionsVisible = false; } catch (e) {}   // player mới -> mặc định phụ đề YouTube tắt
      if (ytPlayer) {
        try { ytPlayer.destroy(); } catch(e) {}
      }
      ytPlayer = new window.YT.Player('yt-player-container', {
        videoId: currentVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,          // không hiện thanh timeline / nút của YouTube (app có nút điều khiển riêng)
          disablekb: 1,         // phím tắt do app xử lý, không để YouTube tự bắt
          fs: 0,                // không hiện nút toàn màn hình của YouTube (app có nút riêng)
          iv_load_policy: 3,    // tắt chú thích / thẻ (cards) của YouTube
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          cc_load_policy: 0
        },
        events: {
          onError: (ev) => { clearTimeout(_ytWatch); showPlayerError(ev.data); },
          onReady: (ev) => {
            clearTimeout(_ytWatch); hidePlayerError();
            isPlayerReady = true;
            ev.target.setPlaybackRate(settings.playbackRate);
            ytCaptionsOff(ev.target);   // tắt phụ đề CC của YouTube để không chồng lên phụ đề của app
            setTimeout(() => ytCaptionsOff(ev.target), 800); setTimeout(() => ytCaptionsOff(ev.target), 2500);

            try {
              const videoData = ev.target.getVideoData ? ev.target.getVideoData() : null;
              const realTitle = (videoData && videoData.title) ? videoData.title : currentVideoTitle;
              const dur = ev.target.getDuration() || 0;
              if (realTitle) {
                saveToLocalHistory({
                  videoId: currentVideoId,
                  title: realTitle,
                  duration: dur,
                  format: subtitleFormat,
                  sentences: sentences
                });
              }
            } catch (err) {}

            startTrackingLoop();

            if (pendingSeekTime !== null) {
              const t = pendingSeekTime;
              pendingSeekTime = null;
              seekToTime(t, undefined, true, null, true);
            }
          },
          onStateChange: (ev) => {
            if (ev.data === 1) {
              isPlaying = true;
              isUserSeeking = false;
              updatePlayIcon(true);
              ytCaptionsOff(ev.target); setTimeout(() => ytCaptionsOff(ev.target), 400);   // YouTube hay bật lại phụ đề đúng lúc bắt đầu phát

              // Nếu người dùng bấm trực tiếp vào video YouTube để phát tiếp khi đang tự dừng cuối câu:
              // chuyển mượt sang câu tiếp theo thay vì phát dở dang ở cuối câu cũ
              if (pausedByAutoPauseId !== null) {
                const finishedIdx = pausedAtSentenceIndex !== null ? pausedAtSentenceIndex : currentSentenceIndex;
                pausedByAutoPauseId = null;
                pausedAtSentenceIndex = null;
                if (finishedIdx < sentences.length - 1) {
                  const nextIdx = finishedIdx + 1;
                  handledSentenceEndId = sentences[finishedIdx] ? sentences[finishedIdx].id : null;
                  autoPauseCooldownUntil = Date.now() + 800;
                  seekToTime(sentPlayStart(nextIdx), nextIdx, true, null, false);
                  return;
                }
              }
            } else if (ev.data === 2) {
              isPlaying = false;
              updatePlayIcon(false);
              stopTrackingLoop();
            } else if (ev.data === 0) {
              isPlaying = false;
              updatePlayIcon(false);
              stopTrackingLoop();
            } else if (ev.data === 3) {
              isUserSeeking = true;
              startTrackingLoop();
              // YouTube cũng phát ra trạng thái "buffering" này khi chỉ đơn giản là bấm Play lại sau khi Pause
              // (không hề tua), nên không thể coi buffering = đang tua trên timeline. Chỉ ép cuộn khi mốc thời
              // gian thực sự NHẢY đáng kể (>1.8s) so với lần cập nhật gần nhất — đúng bằng cách mà vòng lặp theo
              // dõi bên dưới (startTrackingLoop) đã dùng để phát hiện tua timeline/nút -5s/+5s.
              if (!isInternalSeekAction && ytPlayer && ytPlayer.getCurrentTime) {
                const t = ytPlayer.getCurrentTime();
                if (Math.abs(t - lastPlayerCurrentTime) > 1.8) {
                  const idx = getSentenceIndexForTime(t);
                  currentSentenceIndex = idx;
                  updateActiveSentenceDisplay();
                  triggerSmoothCenterScroll(idx, true);
                }
              }
            }
          }
        }
      });
    }

    function updatePlayIcon(playing) {
      const btn = document.getElementById("btn-toggle-play");
      if (!btn) return;
      const changed = btn.classList.contains("is-playing") !== !!playing;
      btn.classList.toggle("is-playing", !!playing);
      if (changed) tpRetrigger(btn, "tp-swap", 200);
    }

    function calculateEffectiveEndTime(idx) {
      const curSent = sentences[idx];
      if (!curSent) return 0;
      
      let tLastEnd = curSent.endTime;
      if (curSent.words && curSent.words.length > 0) {
        tLastEnd = curSent.words[curSent.words.length - 1].endTime;
      }

      const nextSent = sentences[idx + 1];
      if (nextSent) {
        const nextStart = (nextSent.words && nextSent.words.length > 0) 
          ? nextSent.words[0].startTime 
          : nextSent.startTime;
        return Math.min(tLastEnd + 0.1, Math.max(tLastEnd, nextStart - 0.05));
      }
      return tLastEnd + 0.12;
    }

    // ---- Mốc thời gian người dùng đã chỉnh cho từng câu (hàng "Thời gian" dưới Câu trước / Câu sau; dữ liệu do window.tsOv của pv-script cung cấp) ----
    function tsOverrideOf(i) { const f = window.tsOv; return f ? f(i) : null; }
    // Mốc bắt đầu để PHÁT câu i (đã chỉnh nếu có)
    function sentPlayStart(i) {
      const s = sentences[i]; if (!s) return 0;
      const o = tsOverrideOf(i);
      return o && typeof o.s === 'number' ? o.s : s.startTime;
    }
    // Mốc kết thúc để DỪNG câu i (đã chỉnh nếu có)
    function sentPlayEnd(i) {
      const o = tsOverrideOf(i);
      return o && typeof o.e === 'number' ? o.e : calculateEffectiveEndTime(i);
    }
    // Thời điểm sớm nhất còn thuộc về câu i: nếu bắt đầu bị kéo lùi thì đoạn dẫn vào vẫn tính là câu i (không nhảy về câu trước)
    function sentIdxStart(i) {
      const s = sentences[i], o = tsOverrideOf(i);
      return o && typeof o.s === 'number' ? Math.min(s.startTime, o.s) : s.startTime;
    }

    function handleSubContainerMouseEnter() {
      isMouseHoveringSubtitles = true;
    }

    function handleSubContainerMouseLeave() {
      isMouseHoveringSubtitles = false;
    }

    function handleLookupTooltipMouseEnter() {
      isHoveringLookupTooltip = true;
    }

    function handleLookupTooltipMouseLeave() {
      isHoveringLookupTooltip = false;
    }

    let loopStartingNoScroll = false;   // đang bấm Loop: lần tua đầu tiên không được kéo phụ đề đi chỗ khác
    function shouldPreventAutoScroll() {
      if (isMouseHoveringSubtitles || isHoveringLookupTooltip) return true;
      if (loopStartingNoScroll || subtitleLoopActive) return true;   // đoạn bôi đen đang loop đã nằm sẵn trên màn hình: giữ phụ đề đứng yên
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 0) {
        const container = document.getElementById('subtitles-scroll-container');
        if (container && sel.anchorNode && container.contains(sel.anchorNode)) {
          return true;
        }
      }
      return false;
    }

    // ==================== LOOP TRACKING (LINE-LEVEL MICRO SCROLL) ====================
    function stopTrackingLoop() {
      if (rafAnimId) {
        cancelAnimationFrame(rafAnimId);
        rafAnimId = null;
      }
    }
    window.stopTrackingLoop = stopTrackingLoop;

    function checkTimeTick() {
      if (!ytPlayer || !isPlayerReady || !ytPlayer.getCurrentTime) return;
      if (window.pvGetView && window.pvGetView() !== 'default') return;
      try {
        const t = ytPlayer.getCurrentTime();
        const now = Date.now();

        if (!isInternalSeekAction && lastPlayerCurrentTime > 0 && Math.abs(t - lastPlayerCurrentTime) > 1.8 && now > seekGraceUntil) {
          pausedByAutoPauseId = null;
          pausedAtSentenceIndex = null;
          const scrubIdx = getSentenceIndexForTime(t);
          currentSentenceIndex = scrubIdx;
          updateActiveSentenceDisplay();
          triggerSmoothCenterScroll(scrubIdx, true);
        }
        lastPlayerCurrentTime = t;

        const isSeekingGrace = now < seekGraceUntil;
        const hasCaughtUp = Math.abs(t - seekTargetTime) < 0.25;
        if (isSeekingGrace && !hasCaughtUp) return;
        if (isSeekingGrace && hasCaughtUp) seekGraceUntil = 0;

        // Nếu đang tạm dừng do tự dừng hết câu: giữ nguyên câu vừa hoàn thành, không cho các frame trễ nhảy câu
        if (pausedByAutoPauseId !== null) {
          if (pausedAtSentenceIndex !== null && currentSentenceIndex !== pausedAtSentenceIndex) {
            currentSentenceIndex = pausedAtSentenceIndex;
          }
          return;
        }

        const currentSent = sentences[currentSentenceIndex];
        if (currentSent) {
          const effectiveEndTime = sentPlayEnd(currentSentenceIndex);
          const hasStarted = t >= (sentIdxStart(currentSentenceIndex) - 0.08);
          const reachedEnd = hasStarted && (t >= effectiveEndTime - 0.04);

          if (reachedEnd && handledSentenceEndId !== currentSent.id) {
            if (stopAtSentenceEndId === currentSent.id) {
              ytPlayer.pauseVideo();
              stopAtSentenceEndId = null;
              handledSentenceEndId = currentSent.id;
              pausedByAutoPauseId = currentSent.id;
              pausedAtSentenceIndex = currentSentenceIndex;
              stopTrackingLoop();
              return;
            }

            // Thời gian chờ 800ms sau mỗi lần tua chỉ để tránh dừng ngay khi vừa tua tới mốc ĐÃ nằm ở/sau cuối câu.
            // Bấm vào từ gần cuối câu (of, books...) thì còn <0.8s là hết câu: vẫn phải dừng ở cuối câu, không được bỏ qua.
            const seekedBeforeEnd = seekTargetTime < effectiveEndTime - 0.1;
            if ((settings.autoPause || settings.sentenceAutoStop) && (now > autoPauseCooldownUntil || seekedBeforeEnd) && !subtitleLoopActive) {
              ytPlayer.pauseVideo();
              handledSentenceEndId = currentSent.id;
              pausedByAutoPauseId = currentSent.id;
              pausedAtSentenceIndex = currentSentenceIndex;
              stopTrackingLoop();
              return;
            }
          }
        }

        let activeIndex = getSentenceIndexForTime(t);
        // Mốc kết thúc đã được kéo dài sang đoạn của câu sau: khi đang bật tự dừng thì giữ nguyên câu hiện tại tới hết mốc đó để dừng đúng chỗ
        if (activeIndex === currentSentenceIndex + 1 && currentSent && (settings.autoPause || settings.sentenceAutoStop) && !subtitleLoopActive
            && handledSentenceEndId !== currentSent.id && t < sentPlayEnd(currentSentenceIndex) - 0.04) {
          activeIndex = currentSentenceIndex;
        }
        // Đang đứng ở câu sau (vd bấm "Câu sau") nhưng mốc kết thúc kéo dài của câu trước còn phủ tới đây: giữ nguyên câu sau, không quay lại câu trước
        if (activeIndex === currentSentenceIndex - 1 && t >= sentIdxStart(currentSentenceIndex)) activeIndex = currentSentenceIndex;
        if (activeIndex !== currentSentenceIndex) {
          if (!(isSeekingGrace && activeIndex < currentSentenceIndex)) {
            currentSentenceIndex = activeIndex;
            handledSentenceEndId = null;
            updateActiveSentenceDisplay();
          }
        }

        if (settings.karaokeMode) {
          updateKaraokeWord(t);
        } else if (currentHighlightedWordEl) {
          currentHighlightedWordEl.classList.remove('karaoke-word-active');
          currentHighlightedWordEl = null;
        }

        const scrollTarget = activeIndex;
        if (lastReportedScrollTarget !== scrollTarget) {
          lastReportedScrollTarget = scrollTarget;
          if (settings.autoScroll && !shouldPreventAutoScroll()) {
            triggerSmoothCenterScroll(scrollTarget);
          }
        }

      } catch (e) {}
    }
    window.checkTimeTick = checkTimeTick;

    function startTrackingLoop() {
      if (rafAnimId) cancelAnimationFrame(rafAnimId);
      rafAnimId = null;
      if (document.hidden) return;
      if (window.pvGetView && window.pvGetView() !== 'default') return;

      const checkTime = () => {
        if (document.hidden || (window.pvGetView && window.pvGetView() !== 'default')) {
          stopTrackingLoop();
          return;
        }
        checkTimeTick();
        if (!isPlaying && !isUserSeeking && Date.now() > seekGraceUntil) {
          stopTrackingLoop();
          return;
        }
        rafAnimId = requestAnimationFrame(checkTime);
      };
      rafAnimId = requestAnimationFrame(checkTime);
    }
    window.startTrackingLoop = startTrackingLoop;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        stopTrackingLoop();
      } else {
        if (isPlaying && (!window.pvGetView || window.pvGetView() === 'default')) {
          startTrackingLoop();
        } else {
          checkTimeTick();
        }
      }
    });

    // ==================== FIX CUỘN THEO TỪNG DÒNG RƠI (LINE-LEVEL MICRO SCROLL - ITEM 1) ====================
    function updateKaraokeWord(currentTime) {
      const container = document.getElementById('subtitles-scroll-container');
      if (!container) return;

      const wordElements = container.querySelectorAll('.sub-word-unit');
      let activeWord = null;

      for (let i = 0; i < wordElements.length; i++) {
        const el = wordElements[i];
        const start = parseFloat(el.getAttribute('data-start'));
        const end = parseFloat(el.getAttribute('data-end'));
        
        if (currentTime >= (start - 0.02) && currentTime < (end - 0.01)) {
          activeWord = el;
          break;
        }
      }

      if (currentHighlightedWordEl !== activeWord) {
        if (currentHighlightedWordEl) {
          currentHighlightedWordEl.classList.remove('karaoke-word-active');
        }
        if (activeWord) {
          activeWord.classList.add('karaoke-word-active');
          
          // CUỘN TỨC THÌ THEO TỪNG HÀNG XUỐNG DÒNG HOẶC KHI TỪ BỊ SÁT MÉP DƯỚI (ITEM 1)
          if (settings.autoScroll && !shouldPreventAutoScroll()) {
            const currentLineTop = activeWord.offsetTop;

            const containerRect = container.getBoundingClientRect();
            const wordRect = activeWord.getBoundingClientRect();
            const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
            const effectiveBottom = Math.min(containerRect.bottom, viewportBottom - 15);
            const isDangerouslyLow = wordRect.bottom > effectiveBottom - 35;
            const isAboveView = wordRect.top < containerRect.top + 10;

            // Nếu phát hiện từ này sang dòng mới, chưa có mốc dòng (-1), hoặc từ bị che/sát mép màn hình: cuộn ngay lập tức
            if (lastTrackedLineTop === -1 || Math.abs(currentLineTop - lastTrackedLineTop) > 8 || isDangerouslyLow || isAboveView) {
              scrollElementToElevatedPosition(activeWord, container);
            }
            lastTrackedLineTop = currentLineTop;
          }
        }
        currentHighlightedWordEl = activeWord;
      }
    }

    function getSentenceIndexForTime(t) {
      if (!sentences || !sentences.length) return 0;
      if (t < sentences[0].startTime) return 0;
      let idx = sentences.length - 1;
      for (let i = 0; i < sentences.length - 1; i++) {
        if (t >= sentIdxStart(i) && t < sentIdxStart(i + 1)) { idx = i; break; }
      }
      // Câu trước đã được kéo dài mốc kết thúc: phần âm thanh vượt qua mốc bắt đầu gốc của câu này nhưng chưa hết mốc kết thúc mới
      // vẫn thuộc câu trước (trừ khi chính câu này cũng được người dùng kéo mốc bắt đầu lùi tới đó).
      while (idx > 0) {
        const p = idx - 1, op = tsOverrideOf(p);
        if (!(op && typeof op.e === 'number' && op.e > calculateEffectiveEndTime(p) + 0.0005 && t < op.e)) break;
        const oi = tsOverrideOf(idx);
        if (oi && typeof oi.s === 'number' && Math.abs(oi.s - sentences[idx].startTime) > 0.0005 && t >= oi.s) break;
        idx = p;
      }
      return idx;
    }

    // Tìm đúng span TỪ (không phải cả câu) đang được phát tại thời điểm t, dựa trên
    // data-start/data-end của từng .sub-word-unit -- dùng chung cho mọi nơi cần cuộn
    // phụ đề (tua timeline, ±5s, loop...), để luôn cuộn theo ĐÚNG TỪ đang phát chứ
    // không phải theo đầu câu. Với câu dài nhiều dòng hoặc phụ đề không dấu câu bị
    // gộp thành 1 câu khổng lồ, đây là điểm khác biệt quyết định giữa "nhất quán"
    // và "lúc thấy lúc không". Nếu không tìm được từ khớp chính xác (ví dụ phụ đề
    // thiếu word-level timestamp), fallback về từ đầu tiên của câu chứa mốc t đó.
    function findActiveWordElement(t, container) {
      if (!container) return null;
      const wordElements = container.querySelectorAll('.sub-word-unit');
      for (let i = 0; i < wordElements.length; i++) {
        const el = wordElements[i];
        const start = parseFloat(el.getAttribute('data-start'));
        const end = parseFloat(el.getAttribute('data-end'));
        if (!isNaN(start) && !isNaN(end) && t >= (start - 0.02) && t < (end - 0.01)) {
          return el;
        }
      }
      // Fallback: câu chứa t nhưng chưa khớp đúng từ nào (đầu/cuối video, hoặc dữ
      // liệu word-level không phủ hết) -> lấy từ đầu tiên của câu đó, hoặc cả khối
      // câu nếu phụ đề không có word-span (trường hợp không dấu câu bị gộp).
      const idx = getSentenceIndexForTime(t);
      const sentence = sentences[idx];
      if (!sentence) return null;
      const sentenceEl = container.querySelector(`[data-id="${sentence.id}"]`);
      if (!sentenceEl) return null;
      const firstWord = sentenceEl.querySelector('.sub-word-unit');
      return firstWord || sentenceEl;
    }

    // Chạy lại 1 hiệu ứng CSS (xoá class, ép reflow, thêm lại) để bấm liên tiếp vẫn có hiệu ứng
    function tpRetrigger(el, cls, ms) {
      if (!el) return;
      el.classList.remove(cls);
      void el.offsetWidth;
      el.classList.add(cls);
      clearTimeout(el['_t_' + cls]);
      el['_t_' + cls] = setTimeout(() => el.classList.remove(cls), ms);
    }

    function togglePlay() {
      tpRetrigger(document.getElementById('btn-toggle-play'), 'tp-press', 200);
      if (isTextMode) {
        const artEl = document.getElementById('art-audio-el');
        if (artEl && artEl.src) {
          toggleArtAudioPlay();
          return;
        }
        if (window._activeAudioPlayer || (window.speechSynthesis && window.speechSynthesis.speaking)) {
          if (window._activeAudioPlayer) {
            try { window._activeAudioPlayer.pause(); } catch(e) {}
            window._activeAudioPlayer = null;
          }
          if (window.speechSynthesis) {
            try { window.speechSynthesis.cancel(); } catch(e) {}
          }
          updatePlayIcon(false);
        } else {
          const s = sentences[currentSentenceIndex];
          if (s && s.text) {
            updatePlayIcon(true);
            window.playFrenchAudio(s.text, {
              rate: (settings && settings.playbackRate) || 1.0,
              onEnd: () => updatePlayIcon(false)
            });
          }
        }
        return;
      }
      // Đổi biểu tượng Play/Pause NGAY khi bấm, không chờ YouTube báo trạng thái (tránh trễ do buffering)
      if (ytPlayer && isPlayerReady) updatePlayIcon(!isPlaying);
      if (isPlaying) {
        if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
      } else {
        if (subtitleLoopActive && loopWaitingAtEnd) { restartLoopFromStart(); return; }
        if (pausedByAutoPauseId !== null) {
          const finishedIdx = pausedAtSentenceIndex !== null ? pausedAtSentenceIndex : currentSentenceIndex;
          pausedByAutoPauseId = null;
          pausedAtSentenceIndex = null;
          if (finishedIdx < sentences.length - 1) {
            const nextIdx = finishedIdx + 1;
            handledSentenceEndId = sentences[finishedIdx] ? sentences[finishedIdx].id : null;
            autoPauseCooldownUntil = Date.now() + 800;
            seekToTime(sentPlayStart(nextIdx), nextIdx, true, null, false);
            setTimeout(() => { if (ytPlayer?.playVideo) ytPlayer.playVideo(); }, 50);
            return;
          }
        }
        pausedByAutoPauseId = null;
        pausedAtSentenceIndex = null;
        autoPauseCooldownUntil = Date.now() + 800;
        if (ytPlayer && ytPlayer.playVideo) ytPlayer.playVideo();
      }
    }

    function seekToTime(seconds, targetIdx, autoPlay = true, specificElement = null, forceScroll = false) {
      // Nếu người dùng chủ động tua tới một mốc nằm ngoài đoạn đang loop, hiểu là họ
      // muốn rời khỏi đoạn đó -> tự tắt loop. Việc gọi seekToTime NGAY TRONG chính vòng
      // loop (seek về lại điểm bắt đầu) không đi qua nhánh này vì nó gọi ytPlayer.seekTo
      // trực tiếp, không phải qua seekToTime.
      if (subtitleLoopActive && (seconds < subtitleLoopStart - 0.05 || seconds > subtitleLoopEnd + 0.05)) {
        stopSubtitleLoop();
      } else if (subtitleLoopActive) {
        // Người dùng tự tua tới một điểm nằm TRONG đoạn loop: thoát trạng thái chờ để vòng loop tiếp tục hoạt động bình thường
        if (loopDelayTimer) { clearTimeout(loopDelayTimer); loopDelayTimer = null; }
        loopWaitingAtEnd = false;
        loopPreSeeked = false;
        loopGuardUntil = Date.now() + 350;
      }
      handledSentenceEndId = null;
      pausedByAutoPauseId = null;
      pausedAtSentenceIndex = null;
      autoPauseCooldownUntil = Date.now() + 800;
      seekTargetTime = seconds;
      seekGraceUntil = Date.now() + 600;
      lastPlayerCurrentTime = seconds;
      lastTrackedLineTop = -1; // Reset mốc dòng khi người dùng tua

      if (!forceScroll) {
        isInternalSeekAction = true;
        setTimeout(() => { isInternalSeekAction = false; }, 800);
      }
      
      const idx = targetIdx !== undefined ? targetIdx : getSentenceIndexForTime(seconds);
      currentSentenceIndex = idx;
      updateActiveSentenceDisplay();

      if (specificElement && specificElement.classList.contains('sub-word-unit')) {
        if (currentHighlightedWordEl) {
          currentHighlightedWordEl.classList.remove('karaoke-word-active');
        }
        specificElement.classList.add('karaoke-word-active');
        currentHighlightedWordEl = specificElement;

        if (settings.autoScroll && forceScroll && !shouldPreventAutoScroll()) {
          const container = document.getElementById('subtitles-scroll-container');
          scrollElementToElevatedPosition(specificElement, container);
        }
      } else {
        if (forceScroll) {
          triggerSmoothCenterScroll(idx, true, seconds);
        } else if (settings.autoScroll && !shouldPreventAutoScroll()) {
          triggerSmoothCenterScroll(idx, false, seconds);
        }
      }

      if (isTextMode) {
        renderArticleSentenceCard(idx);
        const artEl = document.getElementById('art-audio-el');
        if (artEl && artEl.src && !isNaN(artEl.duration) && artEl.duration > 0) {
          artEl.currentTime = Math.max(0, seconds);
          if (autoPlay && artEl.paused) {
            artEl.play().catch(() => {});
          }
        } else if (autoPlay) {
          if (specificElement && specificElement.textContent) {
            window.playFrenchAudio(specificElement.textContent.trim(), (settings && settings.playbackRate) || 1.0);
          } else {
            const s = sentences[idx];
            if (s && s.text) window.playFrenchAudio(s.text, (settings && settings.playbackRate) || 1.0);
          }
        }
      } else if (ytPlayer && ytPlayer.seekTo) {
        ytPlayer.seekTo(seconds, true);
        if (autoPlay && ytPlayer.playVideo) {
          ytPlayer.playVideo();
        } else {
          setTimeout(checkTimeTick, 50);
        }
      }
    }
    window.seekToTime = seekToTime;

    function replaySentence() {
      const s = sentences[currentSentenceIndex];
      if (!s) return;
      if (isTextMode) {
        renderArticleSentenceCard(currentSentenceIndex);
        const artEl = document.getElementById('art-audio-el');
        if (artEl && artEl.src && typeof s.startTime === 'number') {
          artEl.currentTime = s.startTime;
          if (artEl.paused) artEl.play().catch(() => {});
          return;
        }
        if (s.text) window.playFrenchAudio(s.text, (settings && settings.playbackRate) || 1.0);
        return;
      }
      seekToTime(sentPlayStart(currentSentenceIndex), currentSentenceIndex, true, null, false);
    }

    // Hiển thị tốc độ hiện tại: ô nhập + làm sáng nút preset trùng khớp (0.5 / 0.75 / 0.9 / 1.0)
    function rateFmt(r) { return Number.isInteger(r) ? r.toFixed(1) : String(+r.toFixed(2)); }
    function updateRateUI(rate) {
      const inp = document.getElementById('rate-input');
      if (inp) {
        if (document.activeElement !== inp) inp.value = rateFmt(rate);
        const wrap = inp.closest('.rate-input-wrap');
        if (wrap) wrap.classList.remove('invalid');
      }
      document.querySelectorAll('#pv-speeds button, .sh-speeds button').forEach((b) => b.classList.toggle('on', Math.abs(parseFloat(b.dataset.sp) - rate) < 0.01));
      document.querySelectorAll('.rate-btn').forEach((btn) => {
        const btnRate = parseFloat(btn.dataset.rate);
        if (Math.abs(btnRate - rate) < 0.01) {
          btn.className = 'rate-btn btn-interactive py-1 text-xs font-bold rounded bg-blue-600 text-white shadow-sm';
        } else {
          btn.className = 'rate-btn btn-interactive py-1 text-xs font-bold rounded text-slate-400 hover:text-white';
        }
      });
    }
    // Đọc số người dùng gõ (chấp nhận "0.9", "0,9", ".9", "0.9x"); trả về null nếu không hợp lệ
    function parseRateInput(raw) {
      const t = String(raw || '').trim().toLowerCase().replace(/x$/, '').trim().replace(',', '.');
      if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null;
      const v = parseFloat(t);
      return isFinite(v) && v > 0 ? v : null;
    }
    function commitRateInput() {
      const inp = document.getElementById('rate-input');
      if (!inp) return;
      const v = parseRateInput(inp.value);
      const wrap = inp.closest('.rate-input-wrap');
      if (v === null) {                       // gõ linh tinh -> trả về tốc độ đang dùng
        if (wrap) { wrap.classList.add('invalid'); setTimeout(() => wrap.classList.remove('invalid'), 700); }
        inp.value = rateFmt(settings.playbackRate);
        return;
      }
      inp.value = rateFmt(Math.max(0.25, Math.min(2, Math.round(v * 100) / 100)));
      setRate(v);
    }
    function rateInputKey(e) {
      const inp = e.target;
      if (e.key === 'Enter') { e.preventDefault(); commitRateInput(); inp.blur(); }
      else if (e.key === 'Escape') { e.preventDefault(); inp.value = rateFmt(settings.playbackRate); inp.blur(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {      // ↑/↓ chỉnh từng 0.05
        e.preventDefault();
        const cur = parseRateInput(inp.value);
        const base = cur === null ? settings.playbackRate : cur;
        inp.value = rateFmt(Math.max(0.25, Math.min(2, Math.round((base + (e.key === 'ArrowUp' ? 0.1 : -0.1)) * 100) / 100)));
        commitRateInput();
        inp.select();
      }
    }


    /* ==================== KÉO LÊN/XUỐNG TRÊN Ô TỐC ĐỘ ĐỂ TĂNG/GIẢM ====================
       Dùng chung cho mọi ô tốc độ: Mặc định (.rate-input-wrap), Chép chính tả / Shadowing / Luyện nghe (label.sh-rate).
       Chuột: rê vào -> con trỏ ns-resize + icon đổi thành mũi tên lên/xuống; nhấn giữ rồi kéo.
       Cảm ứng (điện thoại / iPad / máy tính bảng): đặt ngón tay lên ô rồi vuốt lên/xuống.
       Cứ 8px = 0.05x; kéo lên = nhanh hơn. Chạm (không kéo) vẫn focus vào ô để gõ số như cũ. */
    (function rateDragInit() {
      const PILL = '.rate-input-wrap, label.sh-rate';
      const PX_PER_STEP = 8, STEP = 0.05, MIN = 0.25, MAX = 2;
      const UPDOWN = '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>';
      let D = null, lastDragEnd = 0;

      function pillInput(pill) { return pill ? pill.querySelector('input') : null; }
      function pillSvg(pill) { return pill ? pill.querySelector('svg') : null; }
      function iconOn(pill) {
        const sv = pillSvg(pill); if (!sv || sv.dataset.dragIc) return;
        sv.dataset.dragIc = '1'; sv._orig = sv.innerHTML;
        sv._origFill = sv.getAttribute('fill'); sv._origSw = sv.getAttribute('stroke-width');
        sv.setAttribute('fill', 'none'); sv.setAttribute('stroke', 'currentColor'); sv.setAttribute('stroke-width', '2.4');
        sv.setAttribute('stroke-linecap', 'round'); sv.setAttribute('stroke-linejoin', 'round');
        sv.innerHTML = UPDOWN;
      }
      function iconOff(pill) {
        const sv = pillSvg(pill); if (!sv || !sv.dataset.dragIc) return;
        sv.innerHTML = sv._orig;
        if (sv._origFill === null) sv.removeAttribute('fill'); else sv.setAttribute('fill', sv._origFill);
        if (sv._origSw === null) sv.removeAttribute('stroke-width'); else sv.setAttribute('stroke-width', sv._origSw);
        delete sv.dataset.dragIc;
      }
      // Đẩy giá trị trong ô vào đúng bộ xử lý có sẵn của từng màn (mỗi màn nghe sự kiện blur / focusout trên ô nhập)
      function commit(inp) {
        try { inp.dispatchEvent(new FocusEvent('blur')); } catch (e) {}
        try { inp.dispatchEvent(new FocusEvent('focusout', { bubbles: true })); } catch (e) {}
      }
      function liveCommit() {
        if (!D) return;
        const now = Date.now();
        clearTimeout(D.t);
        if (now - D.last >= 90) { D.last = now; commit(D.inp); }
        else D.t = setTimeout(() => { if (D) { D.last = Date.now(); commit(D.inp); } }, 90 - (now - D.last));
      }

      // Rê chuột vào / ra: đổi icon (chỉ chuột, không áp dụng cho cảm ứng)
      document.addEventListener('pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const pill = e.target.closest && e.target.closest(PILL);
        if (pill && !pill.contains(e.relatedTarget)) iconOn(pill);
      });
      document.addEventListener('pointerout', (e) => {
        if (e.pointerType !== 'mouse') return;
        const pill = e.target.closest && e.target.closest(PILL);
        if (pill && !pill.contains(e.relatedTarget) && !(D && D.pill === pill)) iconOff(pill);
      });

      document.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        const pill = e.target.closest && e.target.closest(PILL);
        const inp = pillInput(pill);
        if (!pill || !inp) return;
        const typed = parseRateInput(inp.value);
        D = { pill, inp, id: e.pointerId, y0: e.clientY, start: typed === null ? (settings.playbackRate || 1) : typed,
              moving: false, cur: null, last: 0, t: null, type: e.pointerType };
      }, true);

      document.addEventListener('pointermove', (e) => {
        if (!D || e.pointerId !== D.id) return;
        const dy = D.y0 - e.clientY;                        // kéo lên = dương = tăng
        if (!D.moving) {
          if (Math.abs(dy) < 6) return;
          D.moving = true;
          D.pill.classList.add('rate-dragging');
          document.body.classList.add('rate-dragging-body');
          iconOn(D.pill);
          try { D.pill.setPointerCapture(e.pointerId); } catch (err) {}
          if (document.activeElement === D.inp) D.inp.blur();   // đang gõ dở thì thôi, nhường cho kéo
          try { const sel = window.getSelection(); if (sel) sel.removeAllRanges(); } catch (err) {}
        }
        e.preventDefault();
        let v = D.start + Math.round(dy / PX_PER_STEP) * STEP;
        v = Math.max(MIN, Math.min(MAX, Math.round(v * 100) / 100));
        if (v === D.cur) return;
        D.cur = v;
        D.inp.value = rateFmt(v);
        liveCommit();
      }, { passive: false });

      function end(e) {
        if (!D || (e && e.pointerId !== D.id)) return;
        const d = D; D = null;
        clearTimeout(d.t);
        if (!d.moving) return;                               // chỉ chạm: để ô nhập hoạt động bình thường
        lastDragEnd = Date.now();
        d.pill.classList.remove('rate-dragging');
        document.body.classList.remove('rate-dragging-body');
        try { d.pill.releasePointerCapture(d.id); } catch (err) {}
        if (d.cur !== null) commit(d.inp);                   // chốt giá trị cuối cùng (và đọc lại giọng máy nếu đang dùng TTS)
        if (d.inp === document.activeElement) d.inp.blur();
        if (d.type !== 'mouse' || !d.pill.matches(':hover')) iconOff(d.pill);
      }
      document.addEventListener('pointerup', end, true);
      document.addEventListener('pointercancel', end, true);
      // Sau khi kéo xong, trình duyệt có thể bắn thêm click/focus -> chặn để bàn phím ảo không bật lên
      document.addEventListener('click', (e) => {
        if (Date.now() - lastDragEnd < 400 && e.target.closest && e.target.closest(PILL)) { e.preventDefault(); e.stopPropagation(); }
      }, true);
      document.addEventListener('focusin', (e) => {
        if (Date.now() - lastDragEnd < 400 && e.target.closest && e.target.closest(PILL)) e.target.blur();
      }, true);
    })();

    function setRate(rate) {
      const num = Number(rate);
      if (!isFinite(num)) return;
      const targetRate = Math.max(0.25, Math.min(2.0, Math.round(num * 100) / 100));
      settings.playbackRate = targetRate;
      if (ytPlayer && ytPlayer.setPlaybackRate) {
        ytPlayer.setPlaybackRate(targetRate);
        // Kiểm tra lại: nếu trình phát YouTube không nhận đúng tốc độ này thì hiển thị tốc độ thật để không bị lệch
        setTimeout(() => {
          try {
            if (!ytPlayer.getPlaybackRate || settings.playbackRate !== targetRate) return;
            const actual = ytPlayer.getPlaybackRate();
            if (isFinite(actual) && Math.abs(actual - targetRate) > 0.01) {
              settings.playbackRate = actual;
              updateRateUI(actual);
              saveUserPreferences();
              showVocabToast(`Trình phát YouTube chỉ chạy được ${rateFmt(actual)}x thay vì ${rateFmt(targetRate)}x`, false);
            }
          } catch (err) { /* bỏ qua */ }
        }, 300);
      }
      
      updateRateUI(targetRate);
      saveUserPreferences();
    }

    /* ==================== GIAO DIỆN MẶC ĐỊNH: nút tốc độ nhanh + thu âm + co giãn 2 hàng điều khiển ==================== */
    (function pvCtlInit() {
      const $g = (id) => document.getElementById(id);
      // --- Nút chọn nhanh tốc độ ---
      const sp = $g('pv-speeds');
      if (sp) sp.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-sp]'); if (!b) return;
        setRate(parseFloat(b.getAttribute('data-sp')));
        b.blur();   // không giữ focus để phím Space vẫn phát / dừng video
      });
      try { updateRateUI(settings.playbackRate || 1); } catch (e) {}

      // --- Thu âm giọng của bạn (giống Shadowing: [Nhấn để thu âm] -> [Thu âm lại] [Nghe thu âm]) ---
      const DR = { rec: false, mr: null, chunks: [], stream: null, url: null, audio: null, playing: false, t0: 0, timer: null, ac: null, an: null, raf: null };
      const ICO = {
        mic: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5z"/><path d="M6 11a1 1 0 1 0-2 0 8 8 0 0 0 7 7.94V21H8.5a1 1 0 1 0 0 2h7a1 1 0 1 0 0-2H13v-2.06A8 8 0 0 0 20 11a1 1 0 1 0-2 0 6 6 0 0 1-12 0z"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.6v12.8a1 1 0 0 0 1.5.86l10.6-6.4a1 1 0 0 0 0-1.72L9.5 4.74A1 1 0 0 0 8 5.6z"/></svg>',
        stop: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'
      };
      const fmtT = (sec) => { sec = Math.max(0, sec || 0); return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0'); };
      function drRender() {
        const box = $g('pv-rec'); if (!box) return;
        if (DR.rec) {
          box.innerHTML = '<button type="button" class="pv-rbtn rec" data-a="stop" title="Nhấn để dừng thu" aria-label="Dừng thu"><span class="pv-recdot"></span><span class="lbl">Dừng thu</span><b id="pv-rec-time">0:00</b><span class="pv-meter" id="pv-meter">' + '<i></i>'.repeat(8) + '</span></button>';
          return;
        }
        const has = !!DR.url;
        box.innerHTML = '<button type="button" class="pv-rbtn redo" data-a="rec" title="' + (has ? 'Thu âm lại giọng của bạn' : 'Nhấn để thu âm giọng của bạn') + '" aria-label="' + (has ? 'Thu âm lại' : 'Nhấn để thu âm') + '">' +
          ICO.mic + '<span class="lbl">' + (has ? 'Thu âm lại' : 'Nhấn để thu âm') + '</span></button>' +   // cùng kiểu nút "Thu âm lại": chữ dịu, viền xanh đậm, chỉ icon mic màu đỏ
          (has ? '<button type="button" class="pv-rbtn alt' + (DR.playing ? ' on' : '') + '" data-a="mine" title="' + (DR.playing ? 'Dừng nghe' : 'Nghe lại giọng bạn vừa thu') + '" aria-label="' + (DR.playing ? 'Dừng nghe' : 'Nghe thu âm') + '">' + (DR.playing ? ICO.stop : ICO.play) + '<span class="lbl">' + (DR.playing ? 'Dừng nghe' : 'Nghe thu âm') + '</span></button>' : '');
      }
      function meterStart(stream) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
          DR.ac = new AC(); const src = DR.ac.createMediaStreamSource(stream);
          DR.an = DR.ac.createAnalyser(); DR.an.fftSize = 256; src.connect(DR.an);
          const buf = new Uint8Array(DR.an.frequencyBinCount);
          const loop = () => {
            DR.raf = requestAnimationFrame(loop);
            const bars = document.querySelectorAll('#pv-meter i'); if (!bars.length) return;
            DR.an.getByteFrequencyData(buf);
            for (let i = 0; i < bars.length; i++) bars[i].style.height = Math.max(4, Math.round((buf[2 + i * 3] || 0) / 255 * 20)) + 'px';
          };
          loop();
        } catch (e) {}
      }
      function meterStop() {
        if (DR.raf) cancelAnimationFrame(DR.raf); DR.raf = null;
        try { if (DR.ac) DR.ac.close(); } catch (e) {} DR.ac = null; DR.an = null;
      }
      function stopUser() {
        if (DR.audio) { try { DR.audio.pause(); } catch (e) {} DR.audio = null; }
        if (DR.playing) { DR.playing = false; drRender(); }
      }
      function pauseVideoQuiet() {
        try { stopSubtitleLoop(); } catch (e) {}
        try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
      }
      async function drStart() {
        if (DR.rec) return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { showVocabToast('Trình duyệt này không hỗ trợ thu âm', false); return; }
        pauseVideoQuiet(); stopUser();   // tạm dừng video để micro không thu lẫn tiếng video
        let stream;
        try { stream = await getMicStream(); }
        catch (e) { showVocabToast('Không truy cập được micro. Hãy cho phép quyền micro cho trang này.', false); return; }
        DR.stream = stream; DR.chunks = [];
        let mr;
        try {
          mr = createMicRecorder(stream);
          DR.mr = mr;
        } catch (e) {
          try { stream.getTracks().forEach((t) => t.stop()); } catch (e2) {}
          DR.rec = false;
          showVocabToast('Không thể khởi tạo bộ ghi âm trên thiết bị này.', false);
          return;
        }
        mr.ondataavailable = (e) => { if (e.data && e.data.size) DR.chunks.push(e.data); };
        mr.onstop = () => {
          meterStop(); try { stream.getTracks().forEach((t) => t.stop()); } catch (e) {}
          if (DR.chunks.length) {
            const blob = new Blob(DR.chunks, { type: mr.mimeType || 'audio/webm' });
            if (DR.url) { try { URL.revokeObjectURL(DR.url); } catch (e) {} }
            DR.url = URL.createObjectURL(blob);
          }
          DR.rec = false; drRender();
        };
        try {
          mr.start(250);
        } catch (e) {
          try { stream.getTracks().forEach((t) => t.stop()); } catch (e2) {}
          DR.rec = false;
          showVocabToast('Lỗi khi bắt đầu ghi âm.', false);
          return;
        }
        DR.rec = true; DR.t0 = Date.now();
        clearInterval(DR.timer);
        DR.timer = setInterval(() => {
          const el = $g('pv-rec-time'); if (el) el.textContent = fmtT((Date.now() - DR.t0) / 1000);
          if (Date.now() - DR.t0 > 180000) drStop();   // tối đa 3 phút cho mỗi lần thu
        }, 250);
        drRender(); meterStart(stream);
      }
      function drStop() {
        if (!DR.rec) return;
        clearInterval(DR.timer); DR.timer = null;
        try { if (DR.mr && DR.mr.state !== 'inactive') DR.mr.stop(); else { DR.rec = false; drRender(); } } catch (e) { DR.rec = false; drRender(); }
      }
      function drToggleMine() {
        if (!DR.url) return;
        if (DR.playing) { stopUser(); return; }
        pauseVideoQuiet();
        const a = new Audio(DR.url); DR.audio = a; DR.playing = true; drRender();
        a.onended = () => { DR.playing = false; DR.audio = null; drRender(); };
        a.play().catch(() => { DR.playing = false; DR.audio = null; drRender(); });
      }
      const rbox = $g('pv-rec');
      if (rbox) rbox.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-a]'); if (!b) return;
        const a = b.getAttribute('data-a');
        b.blur();
        if (a === 'rec') drStart(); else if (a === 'stop') drStop(); else if (a === 'mine') drToggleMine();
      });
      // Rời giao diện Mặc định: dừng thu / dừng nghe thu âm. Mở video mới: bỏ bản thu cũ.
      window.pvRecLeave = function () { drStop(); stopUser(); };
      window.pvRecReset = function () {
        drStop(); stopUser();
        if (DR.url) { try { URL.revokeObjectURL(DR.url); } catch (e) {} DR.url = null; }
        drRender();
      };
      drRender();

      // --- Khu điều khiển: đo BỀ RỘNG THẬT rồi chọn bậc hiển thị vừa nhất cho từng hàng (xem CSS #pv-ctl-layout) ---
      // Mỗi lần đo đều bắt đầu lại từ cỡ tự nhiên (bậc 0), tăng bậc cho tới khi hàng không còn tràn.
      // So scrollWidth với clientWidth cùng một hệ toạ độ nên đúng cả khi bảng bị zoom, trên điện thoại lẫn desktop.
      (function pcFit() {
        const ctl = $g('pv-ctl'); const A = ctl && ctl.querySelector('.pc'); if (!A) return;
        const r1 = A.querySelector('.pc-r1'); if (!r1) return;
        const MAX = 5;
        let raf = 0, lastW = -1;
        const over = (row) => row.scrollWidth > row.clientWidth + 1;
        function fit() {
          raf = 0;
          if (!A.clientWidth) return;                 // đang ẩn (chưa ở màn hình luyện tập)
          lastW = A.clientWidth;
          for (let i = 1; i <= MAX; i++) A.classList.remove('a' + i);
          for (let i = 1; i <= MAX && over(r1); i++) A.classList.add('a' + i);   // bậc i gồm cả các bậc trước nó
        }
        const schedule = () => { if (!raf) raf = requestAnimationFrame(fit); };
        // Khi kéo thanh chia đôi màn hình: đo và áp bậc NGAY trong lượt ResizeObserver (trước khi trình duyệt vẽ),
        // để không có khung hình nào hiện bố cục cũ bị tràn rồi mới co lại (đó là nguyên nhân gây giật).
        // Quan sát thanh timeline vì nó luôn rộng bằng khu điều khiển và không đổi chiều cao khi đổi bậc -> không vòng lặp.
        const watch = A.querySelector('#tl') || A;
        if (typeof ResizeObserver === 'function') new ResizeObserver(() => { if (A.clientWidth !== lastW) fit(); }).observe(watch);
        window.addEventListener('resize', schedule);
        window.addEventListener('load', schedule);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
        const rec = $g('pv-rec'); if (rec && window.MutationObserver) new MutationObserver(fit).observe(rec, { childList: true });  // nút thu âm đổi trạng thái -> đổi độ rộng

        // Ô số tốc độ có độ rộng cố định đủ cho 3 chữ số (chỉ nới thêm khi người dùng gõ dài hơn)
        const inp = $g('rate-input');
        if (inp) {
          const d = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
          let last = '';
          const size = () => {
            const v = d.get.call(inp), dots = (v.match(/[.,]/g) || []).length;
            const css = 'calc(' + (Math.max(3, v.length - dots) + Math.max(1, dots) * 0.3).toFixed(2) + 'ch + 1px)';   // luôn chừa sẵn chỗ cho 3 chữ số ("0.75") -> đổi 1.0 <-> 0.75 không làm ô co giãn, các nút bên cạnh đứng yên
            if (css === last) return; last = css; inp.style.width = css; fit();
          };
          Object.defineProperty(inp, 'value', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, v); size(); } });
          inp.addEventListener('input', size);
          const rc = inp.closest('.rate-ctl');
          if (rc) rc.addEventListener('mousedown', (e) => { if (e.target !== inp) { e.preventDefault(); inp.focus(); } });   // bấm đâu trong ô cũng gõ được
          size();
        }
        schedule();
      })();
    })();


    function toggleKaraokeMode() {
      settings.karaokeMode = !settings.karaokeMode;
      const btn = document.getElementById('btn-toggle-karaoke');
      if (btn) {
        if (settings.karaokeMode) {
          btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-red-600/30 text-red-200 border-red-500/60 glow-red shrink-0 whitespace-nowrap';
        } else {
          btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';
          if (currentHighlightedWordEl) {
            currentHighlightedWordEl.classList.remove('karaoke-word-active');
            currentHighlightedWordEl = null;
          }
        }
      }
      saveUserPreferences();
    }
    window.toggleKaraokeMode = toggleKaraokeMode;

    function toggleAutoScroll() {
      settings.autoScroll = !settings.autoScroll;
      const btn = document.getElementById('btn-toggle-autoscroll');
      if (btn) {
        if (settings.autoScroll) {
          btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-red-600/30 text-red-200 border-red-500/60 glow-red shrink-0 whitespace-nowrap';
          lastReportedScrollTarget = -1;
          lastTrackedLineTop = -1;
          triggerSmoothCenterScroll(currentSentenceIndex, true);
        } else {
          btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';
        }
      }
      saveUserPreferences();
    }
    window.toggleAutoScroll = toggleAutoScroll;

    function updateSentenceAutoStopUI() {
      const btn = document.getElementById('btn-toggle-autostop');
      if (btn) {
        if (settings.sentenceAutoStop) {
          btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-red-600/30 text-red-200 border-red-500/60 glow-red shrink-0 whitespace-nowrap';
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';
          btn.setAttribute('aria-pressed', 'false');
        }
      }
      const csAuto = document.getElementById('cs-auto');
      if (csAuto) {
        csAuto.setAttribute('aria-checked', settings.sentenceAutoStop ? 'true' : 'false');
      }
    }

    function toggleSentenceAutoStop() {
      settings.sentenceAutoStop = !settings.sentenceAutoStop;
      if (!settings.sentenceAutoStop) {
        pausedByAutoPauseId = null;
        pausedAtSentenceIndex = null;
      }
      updateSentenceAutoStopUI();
      saveUserPreferences();
    }
    window.toggleSentenceAutoStop = toggleSentenceAutoStop;

