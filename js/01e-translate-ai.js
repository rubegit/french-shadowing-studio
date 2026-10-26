    // ==================== RENDERING SUBTITLES ====================
    function updateActiveSentenceDisplay() {
      // Giao diện phụ đề hiện chỉ có dạng văn bản liền mạch: từ đang phát được tô bởi Karaoke,
      // không còn thẻ câu để tô nền nên hàm này giữ lại (nhiều nơi gọi) nhưng không cần làm gì thêm.
    }

    function updateActiveHighlight(targetIndex) {
      const idx = targetIndex !== undefined ? targetIndex : currentSentenceIndex;
      const countEl = document.getElementById('sub-panel-count');
      if (window.activeRightPanelTab !== 'keyvocab' && countEl && sentences && sentences.length) {
        countEl.textContent = `Câu ${idx + 1}/${sentences.length}`;
      }
      const s = sentences[idx];
      if (!s) return;
      document.querySelectorAll('.sub-item-card').forEach((card) => {
        const id = parseInt(card.getAttribute('data-id'), 10);
        const isActive = id === s.id;
        if (isActive) {
          card.classList.add('sub-item-active');
          card.classList.remove('bg-[#080e1e]/80', 'border-slate-800/80');
        } else {
          card.classList.remove('sub-item-active');
          card.classList.add('bg-[#080e1e]/80', 'border-slate-800/80');
        }
      });
    }

    function renderSubtitleList() {
      const countEl = document.getElementById('sub-panel-count');
      if (window.activeRightPanelTab !== 'keyvocab' && countEl && sentences && sentences.length) {
        const curIdx = currentSentenceIndex >= 0 ? currentSentenceIndex + 1 : 1;
        countEl.textContent = `Câu ${curIdx}/${sentences.length}`;
      }
      const scrollContainer = document.getElementById('subtitles-scroll-container');
      scrollContainer.innerHTML = '';
      updateBilingualButton();
      updateSentenceAutoStopUI();

      if (settings.blurMode && !isTextMode) {   // "Ẩn chữ" chỉ dành cho video; đọc bài thì luôn hiện chữ
        scrollContainer.classList.add('sub-blurred');
      } else {
        scrollContainer.classList.remove('sub-blurred');
      }
      scrollContainer.classList.toggle('sub-show-vi', !!settings.bilingual);

      const query = searchQuery.toLowerCase().trim();
      const filtered = sentences.filter((s) => {
        if (!query) return true;
        const matchEn = s.text.toLowerCase().includes(query);
        const matchVi = s.vi ? s.vi.toLowerCase().includes(query) : false;
        return matchEn || matchVi;
      });

      if (filtered.length === 0) {
        scrollContainer.innerHTML = `<div class="text-center py-12 text-slate-500 text-xs">Không tìm thấy phụ đề phù hợp "${searchQuery}"</div>`;
        return;
      }

      // GIAO DIỆN DUY NHẤT: đoạn văn bản liền mạch
      {
        const textCardContainer = document.createElement('div');
        textCardContainer.className = `sub-textmode-container p-4.5 sm:p-6 rounded-xl border border-slate-800/80 bg-[#080e1e]/80 select-text transition-all`;

        filtered.forEach((sentence, fIdx) => {
          if (sentence.imgs && sentence.imgs.length) sentence.imgs.forEach((im) => textCardContainer.appendChild(txiRenderFigure(im)));
          const sentLine = document.createElement('div');
          sentLine.setAttribute('data-id', sentence.id);
          // Các đoạn do AI chia nhỏ nhưng cùng một câu (cùng gid): khi TẮT song ngữ nối liền lại thành một câu như cũ (CSS .sg-m / .sg-first / .sg-end)
          const gSame = (o) => o && sentence.gid !== undefined && o.gid === sentence.gid;
          const sgPrev = gSame(filtered[fIdx - 1]), sgNext = gSame(filtered[fIdx + 1]);
          const sgCls = (sgPrev || sgNext) ? (' sg-m' + (sgPrev ? '' : ' sg-first') + (sgNext ? '' : ' sg-end')) : '';
          sentLine.className = 'sentence-text-line block' + sgCls + (sentence.hd ? ' is-heading' : '') + (sentence.ti ? ' is-title' : '') + (sentence.ps ? ' para-start' : '');

          if (sentence.words && sentence.words.length > 0) {
            sentence.words.forEach((w, wIdx) => {
              const sp = document.createElement('span');
              sp.className = 'word-hover sub-word-unit inline-block';
              sp.textContent = w.word;
              sp.setAttribute('data-start', w.startTime);
              sp.setAttribute('data-end', w.endTime);
              sp.title = `Bấm: "${w.word}"`;
              sp.onclick = (e) => {
                const selection = window.getSelection();
                if (selection && selection.toString().trim().length > 0) return;
                if (sp._wordClickTimer) return;   // đây là click thứ 2 của double-click -> bỏ qua, đợi sự kiện dblclick huỷ click thứ 1
                sp._wordClickTimer = setTimeout(() => {
                  sp._wordClickTimer = null;
                  const sel2 = window.getSelection();
                  if (sel2 && sel2.toString().trim().length > 0) return;
                  const origIdx = sentences.findIndex((s) => s.id === sentence.id);
                  // Bù trễ âm thanh YouTube và đón trước phụ âm đầu: tua trước 80ms để chữ phát ra tròn vành, tự nhiên
                  const targetTime = Math.max(0, Number((w.startTime - 0.08).toFixed(3)));
                  seekToTime(targetTime, origIdx, true, sp, false);
                }, MULTI_CLICK_MS);
              };
              sp.ondblclick = () => {
                if (sp._wordClickTimer) { clearTimeout(sp._wordClickTimer); sp._wordClickTimer = null; }
              };
              sentLine.appendChild(sp);
              if (wIdx < sentence.words.length - 1) {
                sentLine.appendChild(document.createTextNode(' '));
              }
            });
          } else {
            const rawTokens = sentence.text.split(' ').filter(Boolean);
            const dur = Math.max(0.6, sentence.endTime - sentence.startTime);
            const step = dur / rawTokens.length;

            rawTokens.forEach((wordText, wIdx) => {
              const sp = document.createElement('span');
              sp.className = 'word-hover sub-word-unit inline-block';
              sp.textContent = wordText;
              sp.setAttribute('data-start', (sentence.startTime + wIdx * step).toFixed(3));
              sp.setAttribute('data-end', (sentence.startTime + (wIdx + 1) * step).toFixed(3));
              sp.onclick = (e) => {
                const selection = window.getSelection();
                if (selection && selection.toString().trim().length > 0) return;
                if (sp._wordClickTimer) return;
                sp._wordClickTimer = setTimeout(() => {
                  sp._wordClickTimer = null;
                  const sel2 = window.getSelection();
                  if (sel2 && sel2.toString().trim().length > 0) return;
                  const origIdx = sentences.findIndex((s) => s.id === sentence.id);
                  const estTime = sentence.startTime + (wIdx * step);
                  const targetTime = Math.max(0, Number((estTime - 0.08).toFixed(3)));
                  seekToTime(targetTime, origIdx, true, sp, false);
                }, MULTI_CLICK_MS);
              };
              sp.ondblclick = () => {
                if (sp._wordClickTimer) { clearTimeout(sp._wordClickTimer); sp._wordClickTimer = null; }
              };
              sentLine.appendChild(sp);
              if (wIdx < rawTokens.length - 1) {
                sentLine.appendChild(document.createTextNode(' '));
              }
            });
          }

          if (sentence.vi && sentence.vi.trim()) {
            const viDiv = document.createElement('div');
            viDiv.className = 'sub-textmode-trans sub-vi-line mt-1 pl-1 leading-normal';
            viDiv.textContent = sentence.vi.trim();
            sentLine.appendChild(viDiv);
          }

          textCardContainer.appendChild(sentLine);
        });

        scrollContainer.appendChild(textCardContainer);

        if (!query && aicHasTranslation(sentences)) {
          const pct = aiTranslatedPercent();
          if (pct < 98) {
            const note = document.createElement('div');
            note.className = 'ai-tail-note';
            note.innerHTML = `<span>Bản dịch mới phủ <strong>${pct}%</strong> bài.</span><button type="button" onclick="openBilingualModal()">Dịch tiếp phần còn lại</button>`;
            scrollContainer.appendChild(note);
          }
        }
        return;
      }

    }

    // Xoá sạch ô "Tìm kiếm câu thoại hoặc từ vựng..." (cả biến lưu lẫn nội dung trong ô nhập),
    // để từ khoá của video/văn bản trước không bị dính sang video kế tiếp.
    function resetSubtitleSearch() {
      searchQuery = '';
      const inp = document.getElementById('sub-search-input');
      if (inp) inp.value = '';
    }

    function handleSearch(val) {
      searchQuery = val;
      renderSubtitleList();
      updateActiveSentenceDisplay();
    }

    // ==================== GIAO DIỆN "NÂNG CẤP PHỤ ĐỀ BẰNG AI" + NÚT SONG NGỮ ====================
    const AI_REFS = {
      'punct':        { textarea: 'ai-textarea-punct', status: 'ai-status-punct', undo: 'ai-undo-punct' },
      'trans':        { textarea: 'ai-textarea-trans', status: 'ai-status-trans', undo: 'ai-undo-trans' },
      'trans-player': { textarea: 'bl-textarea',       status: 'bl-status',       undo: null },
      'punct-player': { textarea: 'pc-textarea',       status: 'pc-status',       undo: null }
    };
    let aiBackupSentences = null;

    const BILINGUAL_BTN_BASE = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all shrink-0 whitespace-nowrap';
    const BILINGUAL_BTN_ON = BILINGUAL_BTN_BASE + ' bg-red-600/30 text-red-200 border-red-500/60 glow-red';
    const BILINGUAL_BTN_OFF = BILINGUAL_BTN_BASE + ' bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700';

    function aiClone(x) { return JSON.parse(JSON.stringify(x)); }

    // Copy phụ đề: sao chép đúng những gì ô phụ đề đang hiển thị (cùng bộ lọc tìm kiếm, cùng chế độ Song ngữ / liền câu)
    function buildTranscriptText() {
      const query = (searchQuery || '').toLowerCase().trim();
      const list = sentences.filter((s) => {
        if (!query) return true;
        return s.text.toLowerCase().includes(query) || (s.vi ? s.vi.toLowerCase().includes(query) : false);
      });
      const bi = !!settings.bilingual;
      const blocks = [];                      // mỗi phần tử là 1 đoạn/cặp câu, nối nhau bằng dòng trống (song ngữ) hoặc xuống dòng
      if (bi) {
        list.forEach((s) => {
          const en = String(s.text || '').trim();
          const vi = s.vi ? String(s.vi).trim() : '';
          if (!en && !vi) return;
          blocks.push(vi ? en + '\n' + vi : en);
        });
        return { text: blocks.join('\n\n'), count: blocks.length };
      }
      // Tắt song ngữ: các đoạn cùng gid được nối liền thành một câu, đầu đoạn / tiêu đề cách một dòng trống — giống hệt khi hiển thị
      let out = '', count = 0;
      list.forEach((s, i) => {
        const t = String(s.text || '').trim();
        if (!t) return;
        const same = i > 0 && s.gid !== undefined && list[i - 1] && list[i - 1].gid === s.gid;
        if (same) { out += ' ' + t; return; }
        if (out) out += ((s.ps || s.hd || list[i - 1].ti || list[i - 1].hd) ? '\n\n' : '\n');
        out += t; count++;
      });
      return { text: out, count };
    }
    async function copyTranscript() {
      const btn = document.getElementById('btn-copy-transcript');
      const { text, count } = buildTranscriptText();
      if (!text.trim()) { showVocabToast('Chưa có phụ đề nào để copy', false); return; }
      try {
        await copyTextToClipboard(text);
        if (btn) { btn.classList.add('copied'); clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove('copied'), 1600); }
        showVocabToast(settings.bilingual ? `Đã copy ${count} câu phụ đề (Anh + Việt)` : `Đã copy ${count} câu phụ đề`, false);
      } catch (e) {
        showVocabToast('Không copy được: trình duyệt chặn quyền clipboard', false);
      }
    }

    function copyTextToClipboard(text) {
      return new Promise((resolve, reject) => {
        if (!text && text !== '') {
          reject(new Error('Nội dung sao chép trống'));
          return;
        }

        const tryExecCommand = () => {
          try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.fontSize = '16px';
            ta.style.position = 'fixed';
            ta.style.top = '0';
            ta.style.left = '-9999px';
            ta.style.width = '2em';
            ta.style.height = '2em';
            ta.style.padding = '0';
            ta.style.border = 'none';
            ta.style.outline = 'none';
            ta.style.boxShadow = 'none';
            ta.style.background = 'transparent';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            ta.setSelectionRange(0, text.length);
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            if (ok) {
              resolve(true);
            } else {
              reject(new Error('execCommand thất bại'));
            }
          } catch (e) {
            reject(e);
          }
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text).then(() => {
            resolve(true);
          }).catch((err) => {
            console.warn('[Clipboard] navigator.clipboard.writeText bị từ chối/thất bại, chuyển sang fallback execCommand:', err);
            tryExecCommand();
          });
        } else {
          tryExecCommand();
        }
      });
    }

    // Câu đầu tiên chưa có bản dịch nằm sau đoạn đã dịch (dịch dở dang do AI bị cắt) -> tiếp tục từ đó; ngược lại dịch từ đầu.
    function aiTranslateStartIndex() {
      let last = -1;
      sentences.forEach((s, i) => { if (s.vi && String(s.vi).trim()) last = i; });
      return (last >= 0 && last < sentences.length - 1) ? last + 1 : 0;
    }

    function aiTranslatedPercent() {
      if (!sentences.length) return 0;
      let words = 0, done = 0;
      sentences.forEach((s) => {
        const n = (s.words && s.words.length) || 1;
        words += n;
        if (s.vi && String(s.vi).trim()) done += n;
      });
      return Math.round((done / words) * 100);
    }

    let blReplaceMode = false;   // cửa sổ song ngữ đang ở chế độ "thay bản dịch"

    // Prompt nút "Song ngữ" (xem video): vừa tách câu ngắn vừa dịch xen kẽ Pháp - Việt
    const AI_PROMPT_BILINGUAL = [
      'Thêm dấu câu và dịch đoạn phụ đề tiếng Pháp sau, theo thứ tự: một câu tiếng Pháp gốc, ngay dưới là một câu tiếng Việt, xen kẽ nhau.',
      'QUY TẮC TÁCH CÂU:',
      '',
      '1. Chỉ bỏ các từ đệm "euh", "bah", "um", "uh" và chú thích âm thanh "[music]" hoặc "[musique]". Còn lại tuyệt đối không bỏ từ nào trong phụ đề tiếng Pháp; giữ cả những cụm như "tu sais" hoặc "je veux dire".',
      '',
      '2. Nếu câu dài hơn 25 từ, hãy chia thành hai hoặc nhiều mệnh đề trọn nghĩa và dịch riêng từng mệnh đề. Mỗi mệnh đề tiếng Pháp một hàng, ngay bên dưới là bản dịch tiếng Việt tương ứng. Không được bỏ qua quy tắc này.',
      '3. Dấu câu bản dịch tiếng Việt phải bám theo câu tiếng Pháp tương ứng: câu gốc dùng dấu chấm thì bản dịch cũng dùng dấu chấm; áp dụng tương tự với dấu hỏi, dấu chấm than và các dấu câu khác.',
      '',
      'QUY TẮC DỊCH:',
      'Dịch tự nhiên, đúng ngữ cảnh. Mỗi câu tiếng Việt phải tương ứng đúng với một câu hoặc mệnh đề tiếng Pháp vừa tách.',
      'Không thêm lời giải thích hay ghi chú.',
      '',
      'ĐỊNH DẠNG ĐẦU RA (lặp lại cho mọi câu):',
      '- Đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy.',
      '- Bên trong codebox, mỗi cặp câu gồm 2 dòng liên tiếp: câu tiếng Pháp ở trên, ngay dưới là câu tiếng Việt tương ứng.',
      '- Không thêm lời dẫn, tiêu đề, đánh số hay giải thích nào ngoài khối code.',
      '',
      'Phụ đề cần xử lý:'
    ].join('\n');

    // Prompt nút "Thêm dấu câu" (xem video): chỉ thêm dấu câu + tách câu ngắn, không dịch
    const AI_PROMPT_PUNCT = [
      'Bạn là biên tập viên phụ đề cho người học tiếng Pháp (luyện chép chính tả và shadowing). Hãy thêm dấu câu và chia câu cho đoạn phụ đề tiếng Pháp dưới đây. Không dịch.',
      '',
      'QUY TẮC:',
      '1. Giữ nguyên từng chữ của bản gốc. Chỉ được thêm dấu câu và viết hoa, không được thêm, bớt hay đổi từ.',
      '2. Mỗi câu dài 8-20 từ là lý tưởng, tối đa 25 từ. Không bao giờ được vượt quá 25 từ.',
      '3. Mỗi câu sau khi tách phải trọn nghĩa, đọc lên tự nhiên.',
      '4. Không tách thành mảnh vụn dưới 5 từ, trừ các câu cảm thán hoặc chú thích tự nhiên như "Merci." Nếu có mảnh quá ngắn, hãy gộp vào câu liền kề.',
      '5. Các chú thích trong ngoặc như (Rires), (Applaudissements) giữ nguyên chữ, đặt thành một dòng riêng và thêm dấu chấm ở cuối, ví dụ "(Rires)."',
      '6. Mỗi câu kết thúc bằng dấu chấm, dấu hỏi hoặc dấu chấm than. Dùng dấu phẩy hợp lý trong câu.',
      '',
      'ĐỊNH DẠNG ĐẦU RA:',
      '- Đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy.',
      '- Mỗi câu một dòng bên trong codebox, chỉ gồm văn bản tiếng Pháp đã thêm dấu câu.',
      '- Không dịch, không đánh số, không thêm lời giải thích hay ghi chú ngoài khối code.',
      '',
      'Phụ đề cần xử lý:'
    ].join('\n');

    function aiBuildPrompt(kind) {
      if (kind === 'punct-player') {
        return AI_PROMPT_PUNCT + '\n\n' + aicPlainTranscript(sentences);
      }
      if (kind === 'punct') {
        return 'Thêm dấu câu vào đoạn văn bản này giúp tôi. Đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy:\n\n' + aicPlainTranscript(sentences);
      }
      const body = aicPlainTranscript(sentences.slice(blReplaceMode ? 0 : aiTranslateStartIndex()));
      if (kind === 'trans-player') {
        return AI_PROMPT_BILINGUAL + '\n\n' + body;
      }
      return 'Dịch đoạn văn bản sau, theo kiểu 1 câu gốc tiếng Pháp, ngay sau đó là 1 câu tiếng Việt xen kẽ nhau. Đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy:\n\n' + body;
    }

    // Hiện "Đã copy!" tạm thời trên nút rồi trả về đúng nhãn gốc. Nhãn gốc được ghi nhớ 1 lần (data-default-label),
    // nên bấm nhiều lần liên tiếp cũng không bị kẹt ở chữ "Đã copy!" như trước (trước đây lần bấm thứ 2 trong 1,8 giây
    // sẽ coi "Đã copy!" là nhãn gốc và giữ luôn chữ đó, kể cả khi chuyển sang video khác vì cửa sổ dùng chung).
    function flashCopied(btn, ms) {
      const label = btn ? btn.querySelector('span') : null;
      if (!label) return;
      if (!btn.dataset.defaultLabel) btn.dataset.defaultLabel = label.textContent === 'Đã copy!' ? 'Copy prompt' : label.textContent;
      clearTimeout(btn._copiedTimer);
      label.textContent = 'Đã copy!';
      btn._copiedTimer = setTimeout(() => { label.textContent = btn.dataset.defaultLabel; }, ms || 1800);
      // Hiện nút "Mở Gemini / Mở Claude" bên cạnh (nếu hàng nút này có) sau khi đã copy prompt
      const lk = btn.parentElement && btn.parentElement.querySelector('.ai-open-links');
      if (lk) lk.classList.add('show');
    }
    // Đưa mọi nút copy về nhãn gốc (gọi mỗi khi mở cửa sổ, phòng trường hợp còn sót trạng thái cũ)
    function resetCopyButtons() {
      document.querySelectorAll('.ai-open-links.show').forEach((e) => e.classList.remove('show'));
      document.querySelectorAll('.ai-btn-copy, .ai-btn-primary').forEach((b) => {
        clearTimeout(b._copiedTimer);
        const l = b.querySelector('span');
        if (l && b.dataset.defaultLabel) l.textContent = b.dataset.defaultLabel;
        else if (l && l.textContent === 'Đã copy!') l.textContent = b.classList.contains('ai-btn-copy') ? 'Copy prompt' : 'Copy link';
      });
    }

    function aiCopy(kind, btn) {
      if (!sentences.length) { alert('Chưa có phụ đề để tạo prompt.'); return; }
      copyTextToClipboard(aiBuildPrompt(kind)).then(() => {
        flashCopied(btn, 1800);
      }).catch((err) => { alert('Không thể sao chép: ' + err); });
    }

    function aiSetStatus(el, kind, html) {
      if (!el) return;
      el.className = 'ai-status' + (kind ? ' ' + kind : '');
      el.innerHTML = html || '';
    }

    function aiSetCardOpen(id, open) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('open', !!open);
    }

    function aiToggleCard(id) {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('open');
    }

    function aiRefreshPanel() {
      const panel = document.getElementById('ai-enhance-panel');
      if (!panel) return;
      if (!sentences.length) { panel.classList.add('hidden'); return; }
      panel.classList.remove('hidden');

      const low = aicPunctuationDensity(sentences) < 0.03;
      const bp = document.getElementById('ai-badge-punct');
      if (bp) {
        bp.textContent = low ? 'Phát hiện: phụ đề gần như không có dấu câu' : 'Phụ đề đã có dấu câu';
        bp.className = 'ai-card-sub ' + (low ? 'warn' : 'ok');
      }
      const bt = document.getElementById('ai-badge-trans');
      if (bt) {
        if (aicHasTranslation(sentences)) {
          const pct = aiTranslatedPercent();
          bt.textContent = pct >= 98 ? 'Đã có bản dịch tiếng Việt' : `Đã dịch ${pct}% bài`;
          bt.className = 'ai-card-sub ' + (pct >= 98 ? 'ok' : 'warn');
        } else {
          bt.textContent = 'Chưa có bản dịch';
          bt.className = 'ai-card-sub';
        }
      }
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    // Gọi mỗi khi người dùng nạp phụ đề MỚI (file hoặc dán): reset trạng thái, mở thẻ phù hợp.
    function aiOnSubtitlesLoaded() {
      aiBackupSentences = null;
      Object.keys(AI_REFS).forEach((k) => {
        const r = AI_REFS[k];
        const ta = document.getElementById(r.textarea);
        if (ta) ta.value = '';
        aiSetStatus(document.getElementById(r.status), '', '');
        const u = r.undo && document.getElementById(r.undo);
        if (u) u.classList.add('ai-hide');
      });
      aiRefreshPanel();
      if (!sentences.length) return;
      const low = aicPunctuationDensity(sentences) < 0.03;
      aiSetCardOpen('ai-card-punct', low);
      aiSetCardOpen('ai-card-trans', !low);
    }

    // Chạy đúng thuật toán theo loại; với bản dịch, ưu tiên nối tiếp phần đang dịch dở, không được thì thử từ đầu.
    function aiRunApply(kind, text) {
      if (kind === 'punct' || kind === 'punct-player') return applyPunctuationFromAi(sentences, text, { lineChunks: !isTextMode });
      const attempt = (from) => {
        const head = sentences.slice(0, from);
        const r = applyBilingualFromAi(sentences.slice(from), text, { lineChunks: !isTextMode });
        if (r.ok) {
          r.sentences = head.concat(r.sentences);
          r.sentences.forEach((x, i) => { x.id = i + 1; });
          r.stats.sentenceCount = r.sentences.length;
          r.stats.translated = r.sentences.filter((x) => x.vi && String(x.vi).trim()).length;
        }
        return r;
      };
      const start = aiTranslateStartIndex();
      let r = attempt(start);
      if (!r.ok && start > 0) {
        const r2 = attempt(0);
        if (r2.ok) r = r2;
      }
      return r;
    }

    function aiApply(kind) {
      const refs = AI_REFS[kind];
      const ta = document.getElementById(refs.textarea);
      const st = document.getElementById(refs.status);
      const text = (ta && ta.value || '').trim();
      if (!sentences.length) { aiSetStatus(st, 'err', 'Chưa có phụ đề để áp dụng.'); return; }
      if (!text) { aiSetStatus(st, 'err', 'Bạn chưa dán câu trả lời của AI vào ô bên trên.'); return; }

      const isTrans = kind !== 'punct' && kind !== 'punct-player';
      if (kind === 'punct-player' && aicHasTranslation(sentences) &&
          !confirm('Video này đang có bản dịch song ngữ. Thêm dấu câu sẽ chia lại câu nên bản dịch hiện tại sẽ bị xóa (bạn có thể dịch lại bằng nút Song ngữ). Tiếp tục?')) return;
      const before = aiClone(sentences);
      // Chế độ thay bản dịch: bỏ bản dịch cũ, ghép bản mới từ đầu; nếu ghép lỗi thì trả lại bản cũ
      let keptOld = null;
      if (kind === 'trans-player' && blReplaceMode) {
        keptOld = sentences;
        sentences = sentences.map((x) => { const c = Object.assign({}, x); delete c.vi; return c; });
      }
      let res;
      try { res = aiRunApply(kind, text); }
      catch (e) { console.error(e); res = { ok: false, error: 'Có lỗi khi xử lý câu trả lời: ' + e.message }; }
      if (!res.ok) { if (keptOld) sentences = keptOld; aiSetStatus(st, 'err', res.error); return; }
      // Người dùng tự nạp bản dịch song ngữ -> với video thư viện, đây là trường hợp được phép lưu vào localStorage
      if (isTrans) { if (kind === 'trans-player') userTransVid = currentVideoId || ''; else pendingUserVi = true; }

      if (kind === 'punct-player') {
        sentences = res.sentences;
        aiAfterSentencesChangedInPlayer();
        updateBilingualButton();
        if (res.stats.tailPct < 98) {
          aiSetStatus(st, 'warn', `✓ Đã thêm dấu câu cho khoảng ${res.stats.tailPct}% bài (${res.stats.sentenceCount} câu). AI mới trả lời một phần: nhắn AI "Tiếp tục", dán nối phần tiếp theo vào ô trên rồi bấm Áp dụng lại.`);
        } else {
          closePunctModal();
          showVocabToast(`Đã thêm dấu câu: ${res.stats.sentenceCount} câu`, false);
        }
        return;
      }

      if (kind === 'trans-player') {
        // đang xem video: giữ nguyên vị trí phát, dựng lại phụ đề, lưu vào lịch sử, bật Song ngữ
        sentences = res.sentences;
        closeBilingualModal();
        aiAfterSentencesChangedInPlayer();
        setBilingual(true);
        return;
      }

      aiBackupSentences = before;
      sentences = res.sentences;

      const pctTail = res.stats.tailPct;
      let html, cls = 'ok';
      if (isTrans) {
        const pct = aiTranslatedPercent();
        html = `✓ Đã ghép bản dịch cho <strong>${res.stats.translated}/${res.stats.sentenceCount}</strong> câu (${pct}% bài).`;
        if (pct < 98) {
          cls = 'warn';
          html += '<br>AI mới dịch một phần. Bạn có thể nhắn AI "Tiếp tục", rồi dán nối phần dịch tiếp theo vào ô trên và bấm Áp dụng lại — app sẽ dịch tiếp phần còn thiếu.';
        }
      } else {
        html = `✓ Đã thêm dấu câu: <strong>${res.stats.sentenceCount}</strong> câu (khớp ${res.stats.tailPct}% bài).`;
        if (pctTail < 98) {
          cls = 'warn';
          html += '<br>AI mới trả lời tới khoảng ' + pctTail + '% bài, phần còn lại được giữ nguyên. Hãy nhắn AI "Tiếp tục", rồi dán nối phần trả lời tiếp theo vào ô trên và bấm Áp dụng lại.';
        }
      }
      aiSetStatus(st, cls, html);
      const u = refs.undo && document.getElementById(refs.undo);
      if (u) u.classList.remove('ai-hide');

      if (typeof fileStatusText !== 'undefined' && fileStatusText) {
        fileStatusText.textContent = `Phụ đề đã xử lý: ${sentences.length} câu${aicHasTranslation(sentences) ? ' (có bản dịch)' : ''}`;
      }
      aiRefreshPanel();
      if (!isTrans && cls === 'ok') aiSetCardOpen('ai-card-trans', true);   // gợi ý bước tiếp theo
      checkStartReady();
    }

    function aiUndo() {
      if (!aiBackupSentences) return;
      sentences = aiBackupSentences;
      aiBackupSentences = null;
      ['punct', 'trans'].forEach((k) => {
        aiSetStatus(document.getElementById(AI_REFS[k].status), '', '');
        const u = document.getElementById(AI_REFS[k].undo);
        if (u) u.classList.add('ai-hide');
      });
      if (typeof fileStatusText !== 'undefined' && fileStatusText) {
        fileStatusText.textContent = `Đã hoàn tác: ${sentences.length} câu`;
      }
      aiRefreshPanel();
      checkStartReady();
    }

    // ---------- Khi đang ở màn hình phát video và câu/bản dịch bị thay đổi ----------
    function persistSentencesToHistory() {
      if (!currentVideoId) return;
      const existing = getLocalHistory().find((h) => h.videoId === currentVideoId);
      saveToLocalHistory({
        videoId: currentVideoId,
        title: currentVideoTitle || (existing && existing.title) || `Video ${currentVideoId}`,
        duration: existing ? existing.duration : 0,
        format: subtitleFormat,
        isText: isTextMode,
        sentences: sentences
      });
    }

    function aiAfterSentencesChangedInPlayer() {
      if (isTextMode) {
        // Chế độ văn bản: không có video để theo vị trí phát -> giữ nguyên vị trí cuộn hiện tại, chỉ vẽ lại + lưu vào lịch sử
        const box = document.getElementById('subtitles-scroll-container');
        const keepTop = box ? box.scrollTop : 0;
        lastReportedScrollTarget = -1;
        lastTrackedLineTop = -1;
        currentHighlightedWordEl = null;
        renderSubtitleList();
        if (box) box.scrollTop = keepTop;
        persistSentencesToHistory();
        syncVocabSentenceTranslations(currentVideoId, sentences);
        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
        return;
      }
      const t = (ytPlayer && ytPlayer.getCurrentTime) ? ytPlayer.getCurrentTime() : 0;
      currentSentenceIndex = getSentenceIndexForTime(t);
      lastReportedScrollTarget = -1;
      lastTrackedLineTop = -1;
      currentHighlightedWordEl = null;
      renderSubtitleList();
      const container = document.getElementById('subtitles-scroll-container');
      const el = findActiveWordElement(t, container);
      if (el) scrollElementToElevatedPosition(el, container);
      persistSentencesToHistory();
      syncVocabSentenceTranslations(currentVideoId, sentences);
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    // ---------- Nút "Song ngữ" ----------
    function updateBilingualButton() {
      const btn = document.getElementById('btn-toggle-bilingual');
      if (btn) btn.className = settings.bilingual ? BILINGUAL_BTN_ON : BILINGUAL_BTN_OFF;
      const editBtn = document.getElementById('btn-edit-bilingual');
      if (editBtn) editBtn.classList.toggle('show', aicHasTranslation(sentences));
    }

    function setBilingual(on) {
      const container = document.getElementById('subtitles-scroll-container');
      settings.bilingual = !!on;
      updateBilingualButton();
      if (!container) return;

      // Neo vào DÒNG ĐẦU TIÊN ĐANG HIỂN THỊ trong khung phụ đề (mép trên cùng khung nhìn), để dòng đó
      // đứng yên tại chỗ và phụ đề mới (dòng dịch) chỉ đẩy các dòng PHÍA SAU xuống — không đẩy dòng nào
      // ở phía trên bị khuất lên trên như trước (khi neo vào 1 dòng nằm giữa khung nhìn).
      const cRect = container.getBoundingClientRect();
      const probeY = cRect.top;
      let anchor = null;
      const lines = container.querySelectorAll('.sentence-text-line');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].getBoundingClientRect().bottom >= probeY) { anchor = lines[i]; break; }
      }
      const before = anchor ? anchor.getBoundingClientRect().top : 0;
      container.classList.toggle('sub-show-vi', settings.bilingual);
      if (anchor) {
        const diff = anchor.getBoundingClientRect().top - before;
        if (Math.abs(diff) > 0.5) container.scrollTop += diff;
      }
      lastTrackedLineTop = -1;
    }

    // Ghi nhớ lựa chọn Song ngữ của từng video (bật/tắt) trong trình duyệt, để mở lại hoặc tải lại trang vẫn giữ nguyên
    const BILINGUAL_PREF_KEY = 'shadowing_bilingual_pref_v1';
    function getBilingualPref(videoId) {
      try { const m = JSON.parse(localStorage.getItem(BILINGUAL_PREF_KEY) || '{}'); return m && videoId in m ? !!m[videoId] : undefined; } catch (e) { return undefined; }
    }
    function saveBilingualPref(videoId, on) {
      if (!videoId) return;
      try {
        const m = JSON.parse(localStorage.getItem(BILINGUAL_PREF_KEY) || '{}') || {};
        m[videoId] = on ? 1 : 0;
        localStorage.setItem(BILINGUAL_PREF_KEY, JSON.stringify(m));
      } catch (e) {}
    }

    function toggleBilingual() {
      if (settings.bilingual) { setBilingual(false); if (!isTextMode) saveBilingualPref(currentVideoId, false); return; }
      if (!aicHasTranslation(sentences)) { openBilingualModal(); return; }
      setBilingual(true);
      if (!isTextMode) saveBilingualPref(currentVideoId, true);
    }

    // Video thư viện có sẵn bản dịch, người xem chưa từng bật/tắt Song ngữ cho video này -> mở lần đầu luôn thấy Song ngữ BẬT
    function ensureBilingualDefaultOn() {
      try {
        if (isTextMode || settings.bilingual || !aicHasTranslation(sentences)) return;
        if (getBilingualPref(currentVideoId) !== undefined) return;   // đã có lựa chọn riêng của người dùng -> tôn trọng
        setBilingual(true);
      } catch (e) {}
    }

    function resetBilingualForNewVideo() {
      // Video đã có sẵn phụ đề song ngữ: lần đầu mở tự bật; nếu người dùng đã chọn bật/tắt trước đó thì theo đúng lựa chọn đó
      let on = false;
      if (!isTextMode && aicHasTranslation(sentences)) {
        const pref = getBilingualPref(currentVideoId);
        on = pref === undefined ? true : pref;
      }
      settings.bilingual = on;
      updateBilingualButton();
      closeBilingualModal();
      const container = document.getElementById('subtitles-scroll-container');
      if (container) container.classList.toggle('sub-show-vi', on);
    }

    // ---------- Cửa sổ dán bản dịch ----------
    function openBilingualModal(replace) {
      const modal = document.getElementById('bilingual-modal');
      if (!modal) return;
      const title = document.getElementById('bl-title');
      const desc = document.getElementById('bl-desc');
      blReplaceMode = replace === true;
      const delBtn = document.getElementById('bl-delete');
      if (delBtn) delBtn.classList.toggle('ai-hide', !blReplaceMode);
      if (blReplaceMode) {
        title.textContent = 'Thay bản dịch song ngữ';
        desc.textContent = 'Bản dịch hiện tại sẽ được thay hoàn toàn. Copy prompt (dịch lại toàn bộ bài), gửi AI, rồi paste bản dịch mới vào đây. Hoặc bấm "Xóa bản dịch" nếu chỉ muốn bỏ đi.';
      } else if (aicHasTranslation(sentences)) {
        const pct = aiTranslatedPercent();
        title.textContent = `Bản dịch mới phủ ${pct}% bài`;
        desc.textContent = 'Prompt dưới đây chỉ gồm phần chưa được dịch. Copy prompt, gửi AI, sau đó paste bản dịch của nó vào đây:';
      } else {
        title.textContent = 'Chưa có bản dịch tiếng Việt';
        desc.textContent = 'Chưa có bản dịch tiếng Việt. Copy prompt sau và gửi AI, sau đó paste bản dịch của nó vào đây:';
      }
      document.getElementById('bl-textarea').value = '';
      resetCopyButtons();
      aiSetStatus(document.getElementById('bl-status'), '', '');
      modal.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    function closeBilingualModal() {
      const modal = document.getElementById('bilingual-modal');
      if (modal) modal.classList.remove('open');
      blReplaceMode = false;
    }

    // Xóa toàn bộ bản dịch của video đang mở (và cập nhật bản đã lưu) để có thể nạp bản mới.
    function deleteBilingual() {
      if (!aicHasTranslation(sentences)) return;
      if (!confirm('Xóa bản dịch song ngữ của video này? Bạn có thể nạp bản dịch khác sau đó.')) return;
      sentences.forEach((x) => { delete x.vi; });
      if (userTransVid === currentVideoId) userTransVid = '';   // bỏ bản dịch riêng: video thư viện sẽ quay về dùng bản của server ở lần mở sau
      closeBilingualModal();
      setBilingual(false);
      renderSubtitleList();
      persistSentencesToHistory();
      updateBilingualButton();
      showVocabToast('Đã xóa bản dịch song ngữ', false);
    }

    // ---------- Cửa sổ "Thêm dấu câu" ----------
    function openPunctModal() {
      const modal = document.getElementById('punct-modal');
      if (!modal) return;
      if (!sentences.length) { alert('Chưa có phụ đề để tạo prompt.'); return; }
      document.getElementById('pc-textarea').value = '';
      resetCopyButtons();
      aiSetStatus(document.getElementById('pc-status'), '', '');
      modal.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    function closePunctModal() {
      const modal = document.getElementById('punct-modal');
      if (modal) modal.classList.remove('open');
    }

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeBilingualModal(); closePunctModal(); } });


