/**
 * French Shadowing Studio - Vocab Importer & Data Management UI (Schema 0.2 - M40)
 * Quản lý UI nạp nhiều nguồn, đối chiếu thông minh, giải quyết va chạm và cam kết ghi an toàn.
 */
(function () {
  'use strict';

  var VOCAB_STORAGE_KEY = 'shadowing_saved_vocab_v1';
  var HISTORY_STORAGE_KEY = 'shadowing_master_user_history';
  var PROGRESS_STORAGE_KEY = 'shadowing_dictation_progress_v1';

  var currentMode = 'ADD_SOURCE'; // 'ADD_SOURCE' | 'REPLACE_ALL' | 'RESTORE'
  var stagedFiles = []; // [ { fileName, content, source_id, title } ]
  var stagedResult = null;
  var collisionDecisions = {}; // collisionId -> 'keep_existing_add_occ' | 'skip_new'
  var suspiciousDecisions = {}; // suspiciousId -> 'merge' | 'separate' | 'skip'
  var lastCommittedList = null; // dùng cho nút thử đẩy lại cloud nếu pushAll lỗi

  // =========================================================================
  // 1. SAO LƯU DỮ LIỆU JSON
  // =========================================================================
  window.downloadVocabJsonBackup = function () {
    try {
      var raw = localStorage.getItem(VOCAB_STORAGE_KEY) || '[]';
      var parsed = JSON.parse(raw);
      var prettyJson = JSON.stringify(parsed, null, 2);
      var blob = new Blob([prettyJson], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var nowStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = 'french_vocab_backup_' + nowStr + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (typeof window.showVocabToast === 'function') {
        window.showVocabToast('Đã tải file sao lưu JSON về máy tính', true);
      }
    } catch (e) {
      alert('Không thể tạo file sao lưu: ' + (e.message || e));
    }
  };

  // =========================================================================
  // 2. MỞ / ĐÓNG MODAL & CHUYỂN CHẾ ĐỘ
  // =========================================================================
  window.openVocabImportModal = function (preloadedFile, preloadedSentences) {
    var modal = document.getElementById('fss-import-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    window.switchVocabImportMode('ADD_SOURCE');

    if (preloadedFile) {
      stagedFiles = [preloadedFile];
      renderStagedFilesList();
      window.runVocabDryRunPreview(preloadedSentences);
    }
  };

  window.closeVocabImportModal = function () {
    var modal = document.getElementById('fss-import-modal');
    if (modal) modal.classList.add('hidden');
  };

  window.switchVocabImportMode = function (mode) {
    currentMode = mode || 'ADD_SOURCE';
    
    var btnAdd = document.getElementById('fss-tab-btn-add');
    var btnRep = document.getElementById('fss-tab-btn-replace');
    var btnRes = document.getElementById('fss-tab-btn-restore');

    var warnRep = document.getElementById('fss-import-replace-warning');
    var infoRes = document.getElementById('fss-import-restore-info');
    var boxRep = document.getElementById('fss-import-confirm-box-replace');
    var boxRes = document.getElementById('fss-import-confirm-box-restore');
    var overwriteBox = document.getElementById('fss-import-overwrite-container');

    // Cập nhật tab active
    var activeClass = 'px-4 py-2 font-medium border-b-2 border-blue-500 text-blue-400 cursor-pointer transition';
    var inactiveClass = 'px-4 py-2 font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 cursor-pointer transition';

    if (btnAdd) btnAdd.className = (currentMode === 'ADD_SOURCE') ? activeClass : inactiveClass;
    if (btnRep) btnRep.className = (currentMode === 'REPLACE_ALL') ? activeClass : inactiveClass;
    if (btnRes) btnRes.className = (currentMode === 'RESTORE') ? activeClass : inactiveClass;

    if (warnRep) warnRep.classList.toggle('hidden', currentMode !== 'REPLACE_ALL');
    if (infoRes) infoRes.classList.toggle('hidden', currentMode !== 'RESTORE');
    if (boxRep) boxRep.classList.toggle('hidden', currentMode !== 'REPLACE_ALL');
    if (boxRes) boxRes.classList.toggle('hidden', currentMode !== 'RESTORE');
    if (overwriteBox) overwriteBox.classList.toggle('hidden', currentMode !== 'ADD_SOURCE');

    var commitBtnText = document.getElementById('fss-import-commit-btn-text');
    if (commitBtnText) {
      if (currentMode === 'REPLACE_ALL') commitBtnText.textContent = 'Xác nhận xóa cũ & thay thế';
      else if (currentMode === 'RESTORE') commitBtnText.textContent = 'Xác nhận khôi phục kho';
      else commitBtnText.textContent = 'Xác nhận ghi vào kho';
    }

    window.checkCommitUnlock();
  };

  // =========================================================================
  // 3. XỬ LÝ NHIỀU FILE DỮ LIỆU
  // =========================================================================
  window.handleVocabImportFiles = function (event) {
    var files = event.target.files;
    if (!files || !files.length) return;

    var readCount = 0;
    for (var i = 0; i < files.length; i++) {
      (function (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
          var content = e.target.result;
          stagedFiles.push({
            fileName: file.name,
            content: content,
            source_id: '',
            title: ''
          });
          readCount++;
          if (readCount === files.length) {
            renderStagedFilesList();
            event.target.value = '';
          }
        };
        reader.readAsText(file, 'UTF-8');
      })(files[i]);
    }
  };

  window.removeStagedFile = function (index) {
    if (typeof index === 'number' && index >= 0 && index < stagedFiles.length) {
      stagedFiles.splice(index, 1);
      renderStagedFilesList();
      window.checkCommitUnlock();
    }
  };

  function renderStagedFilesList() {
    var container = document.getElementById('fss-import-staged-files-list');
    if (!container) return;
    container.innerHTML = '';
    stagedFiles.forEach(function (f, idx) {
      var pill = document.createElement('div');
      pill.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-950/80 border border-blue-800 text-blue-200';
      pill.innerHTML = '<span class="font-mono">' + escapeHtml(f.fileName) + '</span>' +
        '<button type="button" onclick="window.removeStagedFile(' + idx + ')" class="text-rose-400 hover:text-rose-300 ml-1 font-bold cursor-pointer">&times;</button>';
      container.appendChild(pill);
    });
  }

  // =========================================================================
  // 4. CHẠY DRY-RUN PREVIEW / STAGING
  // =========================================================================
  window.runVocabDryRunPreview = function (customSentences) {
    if (!window.SchemaV02) {
      alert('Lỗi: Chưa tải module SchemaV02.');
      return;
    }

    var filesToStage = stagedFiles.slice();
    var textarea = document.getElementById('fss-import-textarea');
    var rawText = (textarea && textarea.value || '').trim();

    if (rawText) {
      filesToStage.push({
        fileName: 'Văn bản trực tiếp',
        content: rawText,
        source_id: '',
        title: ''
      });
    }

    if (filesToStage.length === 0) {
      alert('Vui lòng chọn ít nhất 1 file hoặc dán nội dung văn bản vào ô nhập liệu.');
      return;
    }

    // Đọc kho từ vựng hiện tại
    var existingVocab = [];
    try {
      existingVocab = JSON.parse(localStorage.getItem(VOCAB_STORAGE_KEY) || '[]');
      if (!Array.isArray(existingVocab)) existingVocab = [];
    } catch (e) { existingVocab = []; }

    // Xử lý chế độ RESTORE riêng
    if (currentMode === 'RESTORE') {
      try {
        var restoreRes = window.SchemaV02.restoreFlatBackup(rawText || (filesToStage[0] && filesToStage[0].content), 'KHOI PHUC');
        renderRestorePreview(restoreRes.restoredVocabList);
        return;
      } catch (err) {
        alert('Lỗi khôi phục: ' + err.message);
        return;
      }
    }

    // Chạy Stage Multi-source kèm căn mốc phụ đề
    var sents = Array.isArray(customSentences) && customSentences.length
      ? customSentences
      : ((typeof window.sentences !== 'undefined' && Array.isArray(window.sentences) && window.sentences.length) ? window.sentences : null);

    try {
      stagedResult = window.SchemaV02.stageMultiSourceImport(filesToStage, existingVocab, { sentences: sents });
    } catch (err) {
      alert('Lỗi trong quá trình chuẩn bị dữ liệu: ' + err.message);
      return;
    }

    collisionDecisions = {};
    suspiciousDecisions = {};

    var previewContainer = document.getElementById('fss-import-preview-results');
    if (previewContainer) previewContainer.classList.remove('hidden');

    renderStatsSummary(stagedResult.stats);
    renderSourcesBreakdown(stagedResult.files);
    renderErrorsList(stagedResult.errors, stagedResult.unresolvedOccurrences);
    renderCollisionsList(stagedResult.collisions);
    renderSuspiciousList(stagedResult.suspicious);
    renderPreviewTable(stagedResult.stagedItems);

    window.checkCommitUnlock();
  };

  function renderStatsSummary(stats) {
    var grid = document.getElementById('fss-import-stats-grid');
    if (!grid) return;
    var aStats = stats.alignStats || { exact: 0, fuzzy: 0, multiple: 0, notFound: 0 };
    var alignHtml = '';
    if (stats.hasSubtitles) {
      alignHtml = [
        '<div class="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-900/60"><div class="text-[10px] uppercase text-indigo-400">Khớp chính xác</div><div class="text-base font-bold text-indigo-300 font-mono">' + aStats.exact + '</div></div>',
        '<div class="p-2.5 rounded-lg bg-sky-950/40 border border-sky-900/60"><div class="text-[10px] uppercase text-sky-400">Khớp gần đúng</div><div class="text-base font-bold text-sky-300 font-mono">' + aStats.fuzzy + '</div></div>',
        '<div class="p-2.5 rounded-lg bg-amber-950/40 border border-amber-900/60"><div class="text-[10px] uppercase text-amber-400">Nhiều câu khớp (chờ chọn)</div><div class="text-base font-bold text-amber-300 font-mono">' + aStats.multiple + '</div></div>',
        '<div class="p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60"><div class="text-[10px] uppercase text-rose-400">Cần căn lại mốc</div><div class="text-base font-bold text-rose-300 font-mono">' + aStats.notFound + '</div></div>'
      ].join('');
    }

    grid.innerHTML = [
      '<div class="p-2.5 rounded-lg bg-blue-950/40 border border-blue-900/60"><div class="text-[10px] uppercase text-slate-400">Tổng mục nhận diện</div><div class="text-base font-bold text-white font-mono">' + stats.totalItems + '</div></div>',
      '<div class="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60"><div class="text-[10px] uppercase text-emerald-400">Mục mới</div><div class="text-base font-bold text-emerald-300 font-mono">' + stats.newCount + '</div></div>',
      '<div class="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-900/60"><div class="text-[10px] uppercase text-cyan-400">Đã có trong kho</div><div class="text-base font-bold text-cyan-300 font-mono">' + stats.existsCount + '</div></div>',
      '<div class="p-2.5 rounded-lg bg-purple-950/40 border border-purple-900/60"><div class="text-[10px] uppercase text-purple-400">Xung đột / Nghi trùng</div><div class="text-base font-bold text-purple-300 font-mono">' + (stats.collisionCount + stats.suspiciousCount) + '</div></div>',
      alignHtml
    ].join('');
  }

  function renderSourcesBreakdown(files) {
    var box = document.getElementById('fss-import-sources-breakdown');
    var tbody = document.getElementById('fss-import-sources-tbody');
    if (!box || !tbody) return;

    if (!files || !files.length) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    tbody.innerHTML = '';
    files.forEach(function (f) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="px-3 py-2 font-medium text-slate-200">' + escapeHtml(f.fileName) + '</td>' +
        '<td class="px-3 py-2 font-mono text-blue-300 text-[11px]">' + escapeHtml(f.source_id) + '</td>' +
        '<td class="px-3 py-2 text-center text-emerald-400 font-mono font-bold">' + f.itemsCount + '</td>' +
        '<td class="px-3 py-2 text-center text-cyan-400 font-mono font-bold">' + f.occurrencesCount + '</td>';
      tbody.appendChild(tr);
    });
  }

  function renderErrorsList(errors, unresolvedOccs) {
    var box = document.getElementById('fss-import-errors-box');
    var list = document.getElementById('fss-import-errors-list');
    if (!box || !list) return;

    var allErrs = [];
    (errors || []).forEach(function (e) {
      allErrs.push((e.file ? '[' + e.file + '] ' : '') + (e.error ? (e.error.message || e.error) : JSON.stringify(e)));
    });
    (unresolvedOccs || []).forEach(function (u) {
      allErrs.push((u.file ? '[' + u.file + '] ' : '') + u.reason);
    });

    if (allErrs.length === 0) {
      box.classList.add('hidden');
      return;
    }

    box.classList.remove('hidden');
    list.innerHTML = allErrs.map(function (msg) {
      return '<li>' + escapeHtml(msg) + '</li>';
    }).join('');
  }

  function renderCollisionsList(collisions) {
    var sec = document.getElementById('fss-import-collisions-section');
    var badge = document.getElementById('fss-collision-badge');
    var list = document.getElementById('fss-collisions-list');
    if (!sec || !list) return;

    var relevant = (collisions || []).filter(function (col) {
      if (currentMode === 'REPLACE_ALL' && col.type === 'DB_COLLISION') return false;
      return true;
    });

    if (relevant.length === 0) {
      sec.classList.add('hidden');
      return;
    }

    sec.classList.remove('hidden');
    if (badge) badge.textContent = relevant.length + ' xung đột';

    list.innerHTML = '';
    relevant.forEach(function (col) {
      var itemDiv = document.createElement('div');
      itemDiv.className = 'p-2.5 rounded-lg bg-[#04091a] border border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2';

      var infoHtml = '<div class="space-y-0.5">' +
        '<div class="font-bold text-amber-200">' + escapeHtml(col.fr) + '</div>' +
        '<div class="text-[10px] text-slate-400">' +
          'Loại cũ: <span class="text-cyan-300 font-mono">' + col.existingType + '</span> | ' +
          'Loại mới: <span class="text-amber-300 font-mono">' + col.incomingType + '</span>' +
        '</div>' +
      '</div>';

      var checkedKeep = (collisionDecisions[col.collisionId] === 'keep_existing_add_occ') ? 'checked' : '';
      var checkedSkip = (collisionDecisions[col.collisionId] === 'skip_new') ? 'checked' : '';

      var choicesHtml = '<div class="flex items-center gap-3 text-[11px] shrink-0">' +
        '<label class="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">' +
          '<input type="radio" name="' + col.collisionId + '" value="keep_existing_add_occ" ' + checkedKeep + ' onchange="window.setCollisionDecision(\'' + col.collisionId + '\', \'keep_existing_add_occ\')" />' +
          '<span>Giữ mục cũ & thêm ngữ cảnh</span>' +
        '</label>' +
        '<label class="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">' +
          '<input type="radio" name="' + col.collisionId + '" value="skip_new" ' + checkedSkip + ' onchange="window.setCollisionDecision(\'' + col.collisionId + '\', \'skip_new\')" />' +
          '<span>Bỏ qua mục mới</span>' +
        '</label>' +
      '</div>';

      itemDiv.innerHTML = infoHtml + choicesHtml;
      list.appendChild(itemDiv);
    });
  }

  window.setCollisionDecision = function (collisionId, choice) {
    collisionDecisions[collisionId] = choice;
    window.checkCommitUnlock();
  };

  function renderSuspiciousList(suspicious) {
    var sec = document.getElementById('fss-import-suspicious-section');
    var list = document.getElementById('fss-suspicious-list');
    if (!sec || !list) return;

    var relevant = (suspicious || []).filter(function (s) {
      if (currentMode === 'REPLACE_ALL' && s.type === 'DB_SUSPICIOUS') return false;
      return true;
    });

    if (relevant.length === 0) {
      sec.classList.add('hidden');
      return;
    }

    sec.classList.remove('hidden');
    list.innerHTML = '';

    relevant.forEach(function (s) {
      var itemDiv = document.createElement('div');
      itemDiv.className = 'p-2.5 rounded-lg bg-[#04091a] border border-purple-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2';

      var infoHtml = '<div class="space-y-0.5">' +
        '<div class="font-bold text-purple-200">' + escapeHtml(s.fr) + ' <span class="text-slate-400 font-normal">≈</span> ' + escapeHtml(s.matchedFr) + '</div>' +
        '<div class="text-[10px] text-slate-400">Nghi ngờ trùng gốc từ / biến thể phản xạ</div>' +
      '</div>';

      var cur = suspiciousDecisions[s.suspiciousId] || '';
      var checkedMerge = (cur === 'merge') ? 'checked' : '';
      var checkedSep = (cur === 'separate') ? 'checked' : '';
      var checkedSkip = (cur === 'skip') ? 'checked' : '';

      var choicesHtml = '<div class="flex items-center gap-3 text-[11px] shrink-0">' +
        '<label class="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">' +
          '<input type="radio" name="' + s.suspiciousId + '" value="merge" ' + checkedMerge + ' onchange="window.setSuspiciousDecision(\'' + s.suspiciousId + '\', \'merge\')" />' +
          '<span>Gộp</span>' +
        '</label>' +
        '<label class="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">' +
          '<input type="radio" name="' + s.suspiciousId + '" value="separate" ' + checkedSep + ' onchange="window.setSuspiciousDecision(\'' + s.suspiciousId + '\', \'separate\')" />' +
          '<span>Tách riêng</span>' +
        '</label>' +
        '<label class="flex items-center gap-1 cursor-pointer text-slate-300 hover:text-white">' +
          '<input type="radio" name="' + s.suspiciousId + '" value="skip" ' + checkedSkip + ' onchange="window.setSuspiciousDecision(\'' + s.suspiciousId + '\', \'skip\')" />' +
          '<span>Bỏ qua</span>' +
        '</label>' +
      '</div>';

      itemDiv.innerHTML = infoHtml + choicesHtml;
      list.appendChild(itemDiv);
    });
  }

  window.setSuspiciousDecision = function (suspiciousId, choice) {
    suspiciousDecisions[suspiciousId] = choice;
    window.checkCommitUnlock();
  };

  window.applyBulkSuspicious = function (choice) {
    if (!stagedResult || !stagedResult.suspicious) return;
    stagedResult.suspicious.forEach(function (s) {
      suspiciousDecisions[s.suspiciousId] = choice;
    });
    renderSuspiciousList(stagedResult.suspicious);
    window.checkCommitUnlock();
  };

  function renderPreviewTable(items) {
    var tbody = document.getElementById('fss-import-table-body');
    var countLabel = document.getElementById('fss-preview-count-label');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (countLabel) countLabel.textContent = (items ? items.length : 0) + ' mục';

    (items || []).forEach(function (it, idx) {
      var tr = document.createElement('tr');
      tr.className = 'hover:bg-blue-950/30 transition';

      var statusBadge = '';
      if (it.status === 'NEW') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">MỤC MỚI</span>';
      } else if (it.status === 'EXISTS') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px]">ĐÃ CÓ</span>';
      } else if (it.status === 'TYPE_COLLISION') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">XUNG ĐỘT</span>';
      } else if (it.status === 'SUSPICIOUS') {
        statusBadge = '<span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px]">NGHI TRÙNG</span>';
      }

      tr.innerHTML = '<td class="px-3 py-2 text-center text-slate-400 font-mono text-[11px]">' + (it.seq || (idx + 1)) + '</td>' +
        '<td class="px-3 py-2 font-medium text-white">' + escapeHtml(it.fr) + '</td>' +
        '<td class="px-3 py-2 font-mono text-cyan-300 text-[11px]">' + escapeHtml(it.type) + '</td>' +
        '<td class="px-3 py-2 text-center font-mono text-slate-300 text-[11px]">' + escapeHtml(it.level || 'A2') + '</td>' +
        '<td class="px-3 py-2 text-slate-300 truncate max-w-xs">' + escapeHtml(it.meaning_vi || '') + '</td>' +
        '<td class="px-3 py-2 text-center">' + statusBadge + '</td>';

      tbody.appendChild(tr);
    });
  }

  function renderRestorePreview(list) {
    var previewContainer = document.getElementById('fss-import-preview-results');
    if (previewContainer) previewContainer.classList.remove('hidden');

    renderStatsSummary({
      totalItems: list.length,
      newCount: list.length,
      existsCount: 0,
      collisionCount: 0,
      suspiciousCount: 0
    });
    renderPreviewTable(list.map(function (it, idx) {
      return {
        seq: idx + 1,
        fr: it.text || it.fr,
        type: it.type || 'chunk',
        level: it.level || 'A2',
        meaning_vi: it.wordVi || it.vi || '',
        status: 'NEW'
      };
    }));
    window.checkCommitUnlock();
  }

  // =========================================================================
  // 5. MỞ KHÓA NÚT GHI (COMMIT UNLOCK CHECK)
  // =========================================================================
  window.checkCommitUnlock = function () {
    var commitBtn = document.getElementById('fss-import-commit-btn');
    var statusText = document.getElementById('fss-import-status-text');
    if (!commitBtn) return;

    if (currentMode === 'RESTORE') {
      var restoreInput = document.getElementById('fss-import-confirm-restore-input');
      var tokenOk = restoreInput && restoreInput.value.trim() === 'KHOI PHUC';
      commitBtn.disabled = !tokenOk;
      if (statusText) {
        statusText.textContent = tokenOk ? 'Đã xác nhận KHOI PHUC. Sẵn sàng ghi.' : 'Cần gõ "KHOI PHUC" để mở khóa nút ghi.';
      }
      return;
    }

    if (!stagedResult || !stagedResult.stagedItems || stagedResult.stagedItems.length === 0) {
      commitBtn.disabled = true;
      if (statusText) statusText.textContent = 'Chưa có dữ liệu xem trước.';
      return;
    }

    // Kiểm tra đã giải quyết hết TYPE_COLLISION chưa
    var relevantCol = (stagedResult.collisions || []).filter(function (col) {
      if (currentMode === 'REPLACE_ALL' && col.type === 'DB_COLLISION') return false;
      return true;
    });

    for (var i = 0; i < relevantCol.length; i++) {
      if (!collisionDecisions[relevantCol[i].collisionId]) {
        commitBtn.disabled = true;
        if (statusText) statusText.textContent = 'Chặn ghi: Còn xung đột loại chưa giải quyết.';
        return;
      }
    }

    // Kiểm tra đã giải quyết hết SUSPICIOUS chưa
    var relevantSusp = (stagedResult.suspicious || []).filter(function (s) {
      if (currentMode === 'REPLACE_ALL' && s.type === 'DB_SUSPICIOUS') return false;
      return true;
    });

    for (var j = 0; j < relevantSusp.length; j++) {
      if (!suspiciousDecisions[relevantSusp[j].suspiciousId]) {
        commitBtn.disabled = true;
        if (statusText) statusText.textContent = 'Chặn ghi: Còn mục nghi trùng chưa giải quyết.';
        return;
      }
    }

    // Kiểm tra từ khóa xác nhận cho REPLACE_ALL
    if (currentMode === 'REPLACE_ALL') {
      var replaceInput = document.getElementById('fss-import-confirm-replace-input');
      var repTokenOk = replaceInput && replaceInput.value.trim() === 'THAY THE';
      if (!repTokenOk) {
        commitBtn.disabled = true;
        if (statusText) statusText.textContent = 'Chặn ghi: Cần gõ đúng "THAY THE" để xác nhận xóa cũ.';
        return;
      }
    }

    commitBtn.disabled = false;
    if (statusText) statusText.textContent = 'Tất cả điều kiện đã thỏa mãn. Sẵn sàng ghi vào kho.';
  };

  // =========================================================================
  // 6. THỰC THI GHI VÀO KHO (COMMIT & CLOUD SYNC)
  // =========================================================================
  window.executeVocabCommit = async function () {
    var commitBtn = document.getElementById('fss-import-commit-btn');
    if (commitBtn && commitBtn.disabled) return;

    var overwrite = !!(document.getElementById('fss-import-overwrite-checkbox') && document.getElementById('fss-import-overwrite-checkbox').checked);
    var replaceToken = (document.getElementById('fss-import-confirm-replace-input') && document.getElementById('fss-import-confirm-replace-input').value.trim()) || '';
    var restoreToken = (document.getElementById('fss-import-confirm-restore-input') && document.getElementById('fss-import-confirm-restore-input').value.trim()) || '';

    // Đọc DB hiện tại
    var existingVocab = [];
    try {
      existingVocab = JSON.parse(localStorage.getItem(VOCAB_STORAGE_KEY) || '[]');
      if (!Array.isArray(existingVocab)) existingVocab = [];
    } catch (e) { existingVocab = []; }

    var finalVocabList = [];

    // Chế độ RESTORE
    if (currentMode === 'RESTORE') {
      var textarea = document.getElementById('fss-import-textarea');
      var rawJson = (textarea && textarea.value.trim()) || (stagedFiles[0] && stagedFiles[0].content);
      try {
        var restRes = window.SchemaV02.restoreFlatBackup(rawJson, restoreToken);
        finalVocabList = restRes.restoredVocabList;
      } catch (err) {
        alert('Lỗi: ' + err.message);
        return;
      }
    } else {
      // Chế độ ADD_SOURCE hoặc REPLACE_ALL
      try {
        var commitRes = window.SchemaV02.commitStagedImport(stagedResult, currentMode, {
          confirmationText: replaceToken,
          collisionDecisions: collisionDecisions,
          suspiciousDecisions: suspiciousDecisions,
          overwriteContent: overwrite
        }, existingVocab);

        finalVocabList = commitRes.updatedVocabList;
      } catch (err) {
        alert('Lỗi khi cam kết ghi: ' + err.message);
        return;
      }
    }

    // 1. Ghi LocalStorage nguyên tử (Atomic write)
    try {
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(finalVocabList));
    } catch (quotaErr) {
      alert('Lỗi ghi bộ nhớ trình duyệt (QuotaExceededError). Không có thay đổi nào được lưu và Cloud không bị ảnh hưởng.');
      return;
    }

    lastCommittedList = finalVocabList;

    // 2. Đẩy Cloud (Supabase Push All)
    var currentUser = null;
    if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.getCurrentUser === 'function') {
      currentUser = window.FSS_SUPABASE.getCurrentUser();
    }

    if (currentUser && typeof window.FSS_SUPABASE.pushAll === 'function') {
      var statusText = document.getElementById('fss-import-status-text');
      if (statusText) statusText.textContent = 'Đang đẩy toàn bộ lên Cloud…';

      try {
        var historyList = [];
        try { historyList = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]'); } catch (e) {}
        var progressObj = {};
        try { progressObj = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}'); } catch (e) {}

        await window.FSS_SUPABASE.pushAll(finalVocabList, historyList, progressObj);

        // Sau khi pushAll thành công: LUÔN cập nhật fss_last_server_updated_at để pull sau không bị xung đột
        var nowIso = new Date().toISOString();
        localStorage.setItem('fss_last_server_updated_at', nowIso);
        localStorage.setItem('fss_last_sync_time', new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'));

        hidePersistentCloudAlert();
      } catch (cloudErr) {
        showPersistentCloudAlert('Lỗi mạng hoặc Supabase từ chối: ' + (cloudErr.message || cloudErr));
        return;
      }
    } else {
      if (currentMode === 'REPLACE_ALL') {
        alert('Lưu ý: Bạn chưa đăng nhập Supabase. Dữ liệu mới đã được lưu vào LocalStorage của trình duyệt này. Nếu sau này đăng nhập lại vào tài khoản cũ, dữ liệu cũ trên Cloud có thể bị gộp trở lại.');
      }
    }

    // Cập nhật giao diện bên ngoài
    if (typeof window.renderVocabList === 'function') {
      window.renderVocabList();
    }
    if (typeof window.updateVocabBadges === 'function') {
      window.updateVocabBadges();
    }
    if (typeof window.renderRightPanelKeyVocab === 'function') {
      window.renderRightPanelKeyVocab();
    }
    if (typeof window.renderVocabPage === 'function') {
      window.renderVocabPage();
    }
    if (typeof window.showVocabToast === 'function') {
      window.showVocabToast('Đã lưu thành công ' + finalVocabList.length + ' mục từ vựng', true);
    }

    window.closeVocabImportModal();
  };

  // =========================================================================
  // 7. THỬ ĐẨY LẠI CLOUD KHI LỖI (RETRY CLOUD PUSH)
  // =========================================================================
  window.retryCloudPush = async function () {
    if (!lastCommittedList || !window.FSS_SUPABASE || typeof window.FSS_SUPABASE.pushAll !== 'function') {
      alert('Không tìm thấy dữ liệu đã cam kết để thử lại.');
      return;
    }

    var retryBtn = document.getElementById('fss-import-cloud-retry-btn');
    if (retryBtn) {
      retryBtn.disabled = true;
      retryBtn.textContent = 'Đang đẩy…';
    }

    try {
      var historyList = [];
      try { historyList = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]'); } catch (e) {}
      var progressObj = {};
      try { progressObj = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}'); } catch (e) {}

      await window.FSS_SUPABASE.pushAll(lastCommittedList, historyList, progressObj);

      var nowIso = new Date().toISOString();
      localStorage.setItem('fss_last_server_updated_at', nowIso);
      localStorage.setItem('fss_last_sync_time', new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN'));

      hidePersistentCloudAlert();
      alert('Đẩy lên Cloud thành công!');
    } catch (err) {
      showPersistentCloudAlert('Thử lại thất bại: ' + (err.message || err));
    } finally {
      if (retryBtn) {
        retryBtn.disabled = false;
        retryBtn.textContent = 'Thử đẩy lại Cloud';
      }
    }
  };

  function showPersistentCloudAlert(msg) {
    var alertBox = document.getElementById('fss-import-cloud-alert');
    var msgEl = document.getElementById('fss-import-cloud-alert-msg');
    if (alertBox) alertBox.classList.remove('hidden');
    if (msgEl) msgEl.textContent = msg;
  }

  function hidePersistentCloudAlert() {
    var alertBox = document.getElementById('fss-import-cloud-alert');
    if (alertBox) alertBox.classList.add('hidden');
  }

  function escapeHtml(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();
