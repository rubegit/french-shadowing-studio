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
  var hasDownloadedBackupInSession = false; // đánh dấu đã tải file sao lưu trong phiên modal này

  // Hằng số cấu hình: Bắt buộc tải sao lưu trước khi Thay thế / Khôi phục
  // Mặc định false khi app chưa release (thuận tiện nạp thử & nghiệm thu nhanh)
  var REQUIRE_BACKUP_BEFORE_REPLACE = false;

  window.getBackupSessionStatus = function () {
    return hasDownloadedBackupInSession;
  };
  window.setBackupSessionStatus = function (val) {
    hasDownloadedBackupInSession = !!val;
    if (typeof window.checkCommitUnlock === 'function') {
      window.checkCommitUnlock();
    }
  };

  window.getRequireBackupBeforeReplace = function () {
    return REQUIRE_BACKUP_BEFORE_REPLACE;
  };
  window.setRequireBackupBeforeReplace = function (val) {
    REQUIRE_BACKUP_BEFORE_REPLACE = !!val;
    if (typeof window.checkCommitUnlock === 'function') {
      window.checkCommitUnlock();
    }
  };

  // Cập nhật huy hiệu Cloud sync & tùy chọn Lưu cục bộ (M43-B)
  function updateCloudSyncBadge() {
    var badge = document.getElementById('fss-cloud-sync-badge');
    var badgeText = document.getElementById('fss-cloud-sync-badge-text');
    var badgeIcon = document.getElementById('fss-cloud-sync-badge-icon');
    var localOnlyCheckbox = document.getElementById('fss-import-local-only-checkbox');
    if (!badge) return;

    var isSignedIn = false;
    try {
      if (typeof window.fssIsUserSignedIn === 'function') {
        isSignedIn = !!window.fssIsUserSignedIn();
      } else if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.getCurrentUser === 'function') {
        isSignedIn = !!window.FSS_SUPABASE.getCurrentUser();
      }
    } catch (e) {
      isSignedIn = false;
    }

    if (isSignedIn) {
      if (badgeText) badgeText.textContent = 'Đã đăng nhập: sẽ đồng bộ lên đám mây';
      if (badgeIcon) badgeIcon.textContent = '☁️';
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      if (localOnlyCheckbox) {
        localOnlyCheckbox.disabled = false;
        localOnlyCheckbox.checked = false;
      }
    } else {
      if (badgeText) badgeText.textContent = 'Chưa đăng nhập: chỉ lưu cục bộ';
      if (badgeIcon) badgeIcon.textContent = '💾';
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1.5 bg-slate-700/40 text-slate-300 border border-slate-600/40';
      if (localOnlyCheckbox) {
        localOnlyCheckbox.checked = true;
        localOnlyCheckbox.disabled = true;
      }
    }
  }
  window.updateVocabImportCloudBadge = updateCloudSyncBadge;

  // =========================================================================
  // 1. SAO LƯU DỮ LIỆU JSON
  // =========================================================================
  window.downloadVocabJsonBackup = function () {
    try {
      var raw = localStorage.getItem(VOCAB_STORAGE_KEY) || '[]';
      var parsed = JSON.parse(raw);
      var items = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
      var totalItems = items.length;
      var tombstoneCount = 0;
      var activeCount = 0;
      items.forEach(function (it) {
        if (it && it._deleted) tombstoneCount++;
        else activeCount++;
      });
      var backupData = {
        metadata: {
          totalItems: totalItems,
          activeCount: activeCount,
          tombstoneCount: tombstoneCount,
          exportedAt: new Date().toISOString(),
          schema_version: '0.2'
        },
        items: items
      };
      var prettyJson = JSON.stringify(backupData, null, 2);
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

      hasDownloadedBackupInSession = true;
      var backupBtn = document.getElementById('fss-import-backup-btn');
      if (backupBtn) {
        backupBtn.innerHTML = '✓ Đã tải sao lưu JSON';
      }
      if (typeof window.showVocabToast === 'function') {
        window.showVocabToast('Đã tải file sao lưu JSON về máy tính', true);
      }
      if (typeof window.checkCommitUnlock === 'function') {
        window.checkCommitUnlock();
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
    document.body.style.overflow = 'hidden';
    document.body.classList.add('has-import-modal-open');
    hasDownloadedBackupInSession = false;
    var backupBtn = document.getElementById('fss-import-backup-btn');
    if (backupBtn) {
      backupBtn.innerHTML = '<span class="inline-block mr-1">📥</span> Tải file sao lưu JSON';
    }
    updateCloudSyncBadge();
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
    document.body.style.overflow = '';
    document.body.classList.remove('has-import-modal-open');
  };

  // Lắng nghe phím Esc để đóng modal ở bước preview
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      var modal = document.getElementById('fss-import-modal');
      if (modal && !modal.classList.contains('hidden')) {
        window.closeVocabImportModal();
      }
    }
  });

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

    // Cập nhật tab active (kiểu nút chọn chế độ ở thanh đáy)
    var activeClass = 'px-3 py-1.5 rounded-lg font-semibold text-xs bg-blue-600 text-white shadow-sm cursor-pointer transition';
    var inactiveClass = 'fss-tab-btn-inactive px-3 py-1.5 rounded-lg font-medium text-xs cursor-pointer transition';

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
      pill.className = 'fss-staged-pill flex items-center gap-1.5 px-2.5 py-1 rounded text-xs';
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
    var curVid = (typeof window.currentVideoId !== 'undefined' && window.currentVideoId) ? window.currentVideoId : '';
    var curTitle = (typeof window.currentVideoTitle !== 'undefined' && window.currentVideoTitle) ? window.currentVideoTitle : '';

    try {
      stagedResult = window.SchemaV02.stageMultiSourceImport(filesToStage, existingVocab, {
        sentences: sents,
        currentVideoId: curVid,
        currentVideoTitle: curTitle
      });
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
        '<div class="p-3 rounded-xl bg-indigo-950/40 border border-indigo-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Khớp chính xác</div><div class="text-lg font-bold text-indigo-200 font-mono mt-1">' + aStats.exact + '</div></div>',
        '<div class="p-3 rounded-xl bg-sky-950/40 border border-sky-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-sky-400 tracking-wider">Khớp gần đúng</div><div class="text-lg font-bold text-sky-200 font-mono mt-1">' + aStats.fuzzy + '</div></div>',
        '<div class="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Nhiều câu khớp</div><div class="text-lg font-bold text-amber-200 font-mono mt-1">' + aStats.multiple + '</div></div>',
        '<div class="p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Cần căn lại</div><div class="text-lg font-bold text-rose-200 font-mono mt-1">' + aStats.notFound + '</div></div>'
      ].join('');
    }

    grid.innerHTML = [
      '<div class="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng nhận diện</div><div class="text-lg font-bold text-white font-mono mt-1">' + stats.totalItems + '</div></div>',
      '<div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Mục mới</div><div class="text-lg font-bold text-emerald-300 font-mono mt-1">' + stats.newCount + '</div></div>',
      '<div class="p-3 rounded-xl bg-cyan-950/40 border border-cyan-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Đã có trong kho</div><div class="text-lg font-bold text-cyan-300 font-mono mt-1">' + stats.existsCount + '</div></div>',
      '<div class="p-3 rounded-xl bg-purple-950/40 border border-purple-900/60 shadow-sm flex flex-col justify-between"><div class="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Xung đột / Nghi trùng</div><div class="text-lg font-bold text-purple-300 font-mono mt-1">' + (stats.collisionCount + stats.suspiciousCount) + '</div></div>',
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
      var warnHtml = f.warning
        ? '<div class="text-amber-400 text-[11px] mt-0.5 flex items-center gap-1 font-sans"><span>⚠️ ' + escapeHtml(f.warning) + '</span></div>'
        : '';
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="px-3 py-2 font-medium text-slate-200">' + escapeHtml(f.fileName) + warnHtml + '</td>' +
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

    // Đăng ký event delegation an toàn, tránh lỗi cú pháp JS khi từ khóa chứa dấu nháy đơn tiếng Pháp
    if (!list._hasColDelegation && typeof list.addEventListener === 'function') {
      list._hasColDelegation = true;
      list.addEventListener('change', function (e) {
        var target = e.target;
        if (target && target.classList && target.classList.contains('fss-col-radio')) {
          var colId = target.getAttribute('data-col-id');
          var val = target.value;
          window.setCollisionDecision(colId, val);
          var parentItem = target.closest('.fss-collision-item');
          if (parentItem) {
            parentItem.querySelectorAll('.fss-choice-card').forEach(function (card) {
              var radio = card.querySelector('input[type="radio"]');
              card.classList.toggle('is-selected', !!(radio && radio.checked));
            });
          }
        }
      });
    }

    list.innerHTML = '';
    relevant.forEach(function (col) {
      var itemDiv = document.createElement('div');
      itemDiv.className = 'fss-collision-item p-3 rounded-xl bg-[#04091a] border border-amber-500/40 hover:border-amber-500/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm';

      var infoHtml = '<div class="space-y-1">' +
        '<div class="font-bold text-amber-200 text-sm flex items-center gap-1.5">' +
          '<span class="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>' +
          '<span>' + escapeHtml(col.fr) + '</span>' +
        '</div>' +
        '<div class="text-[11px] text-slate-400 flex flex-wrap items-center gap-2">' +
          '<span>Loại cũ: <span class="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono text-[10px]">' + escapeHtml(col.existingType) + '</span></span>' +
          '<span class="text-slate-500">→</span>' +
          '<span>Loại mới: <span class="px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono text-[10px]">' + escapeHtml(col.incomingType) + '</span></span>' +
        '</div>' +
      '</div>';

      var curDecision = collisionDecisions[col.collisionId];
      var checkedKeep = (curDecision === 'keep_existing_add_occ') ? 'checked' : '';
      var checkedSkip = (curDecision === 'skip_new') ? 'checked' : '';
      var isKeepSelected = (curDecision === 'keep_existing_add_occ') ? ' is-selected' : '';
      var isSkipSelected = (curDecision === 'skip_new') ? ' is-selected' : '';

      var safeColId = escapeHtml(col.collisionId);

      var choicesHtml = '<div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">' +
        '<label class="fss-choice-card cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-2 select-none' + isKeepSelected + '">' +
          '<input type="radio" class="fss-col-radio accent-amber-500 cursor-pointer" name="' + safeColId + '" data-col-id="' + safeColId + '" value="keep_existing_add_occ" ' + checkedKeep + ' />' +
          '<span>Giữ mục cũ & thêm ngữ cảnh</span>' +
        '</label>' +
        '<label class="fss-choice-card cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-2 select-none' + isSkipSelected + '">' +
          '<input type="radio" class="fss-col-radio accent-amber-500 cursor-pointer" name="' + safeColId + '" data-col-id="' + safeColId + '" value="skip_new" ' + checkedSkip + ' />' +
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

    if (!list._hasSuspDelegation && typeof list.addEventListener === 'function') {
      list._hasSuspDelegation = true;
      list.addEventListener('change', function (e) {
        var target = e.target;
        if (target && target.classList && target.classList.contains('fss-susp-radio')) {
          var suspId = target.getAttribute('data-susp-id');
          var val = target.value;
          window.setSuspiciousDecision(suspId, val);
          var parentItem = target.closest('.fss-suspicious-item');
          if (parentItem) {
            parentItem.querySelectorAll('.fss-choice-card').forEach(function (card) {
              var radio = card.querySelector('input[type="radio"]');
              card.classList.toggle('is-selected', !!(radio && radio.checked));
            });
          }
        }
      });
    }

    list.innerHTML = '';

    relevant.forEach(function (s) {
      var itemDiv = document.createElement('div');
      itemDiv.className = 'fss-suspicious-item p-3 rounded-xl bg-[#04091a] border border-purple-500/40 hover:border-purple-500/70 transition flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm';

      var infoHtml = '<div class="space-y-1">' +
        '<div class="font-bold text-purple-200 text-sm flex items-center gap-1.5">' +
          '<span class="w-2 h-2 rounded-full bg-purple-400 shrink-0"></span>' +
          '<span>' + escapeHtml(s.fr) + ' <span class="text-slate-400 font-normal">≈</span> ' + escapeHtml(s.matchedFr) + '</span>' +
        '</div>' +
        '<div class="text-[11px] text-slate-400">Nghi ngờ trùng gốc từ / biến thể phản xạ</div>' +
      '</div>';

      var cur = suspiciousDecisions[s.suspiciousId] || '';
      var checkedMerge = (cur === 'merge') ? 'checked' : '';
      var checkedSep = (cur === 'separate') ? 'checked' : '';
      var checkedSkip = (cur === 'skip') ? 'checked' : '';

      var isMergeSelected = (cur === 'merge') ? ' is-selected' : '';
      var isSepSelected = (cur === 'separate') ? ' is-selected' : '';
      var isSkipSelected = (cur === 'skip') ? ' is-selected' : '';

      var safeSuspId = escapeHtml(s.suspiciousId);

      var choicesHtml = '<div class="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">' +
        '<label class="fss-choice-card cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-2 select-none' + isMergeSelected + '">' +
          '<input type="radio" class="fss-susp-radio accent-purple-500 cursor-pointer" name="' + safeSuspId + '" data-susp-id="' + safeSuspId + '" value="merge" ' + checkedMerge + ' />' +
          '<span>Gộp</span>' +
        '</label>' +
        '<label class="fss-choice-card cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-2 select-none' + isSepSelected + '">' +
          '<input type="radio" class="fss-susp-radio accent-purple-500 cursor-pointer" name="' + safeSuspId + '" data-susp-id="' + safeSuspId + '" value="separate" ' + checkedSep + ' />' +
          '<span>Tách riêng</span>' +
        '</label>' +
        '<label class="fss-choice-card cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-medium transition flex items-center gap-2 select-none' + isSkipSelected + '">' +
          '<input type="radio" class="fss-susp-radio accent-purple-500 cursor-pointer" name="' + safeSuspId + '" data-susp-id="' + safeSuspId + '" value="skip" ' + checkedSkip + ' />' +
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

  function formatCefrBadge(level) {
    var lvl = (level || 'A2').toUpperCase().trim();
    if (lvl === 'A1') {
      return '<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">A1</span>';
    }
    if (lvl === 'A2' || lvl === 'A2+') {
      return '<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30">' + escapeHtml(lvl) + '</span>';
    }
    if (lvl === 'B1') {
      return '<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">B1</span>';
    }
    if (lvl === 'B2') {
      return '<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-orange-500/15 text-orange-300 border border-orange-500/30">B2</span>';
    }
    if (lvl === 'C1' || lvl === 'C2') {
      return '<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30">' + escapeHtml(lvl) + '</span>';
    }
    return '<span class="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-800 text-slate-300 border border-slate-700">' + escapeHtml(lvl) + '</span>';
  }

  function formatTypeBadge(type) {
    var raw = (type || '').toLowerCase().trim();
    if (raw === 'word' || raw === 'từ') {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/15 text-blue-300 border border-blue-500/30">Từ đơn</span>';
    }
    if (raw === 'chunk' || raw === 'cụm từ') {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">Cụm từ</span>';
    }
    if (raw === 'collocation') {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">Collocation</span>';
    }
    if (raw === 'idiom' || raw === 'thành ngữ') {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">Thành ngữ</span>';
    }
    if (raw === 'slang' || raw === 'tiếng lóng') {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-pink-500/15 text-pink-300 border border-pink-500/30">Tiếng lóng</span>';
    }
    return '<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">' + escapeHtml(type) + '</span>';
  }

  function formatStatusBadge(status) {
    if (status === 'NEW') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>MỤC MỚI</span>';
    }
    if (status === 'EXISTS') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>ĐÃ CÓ</span>';
    }
    if (status === 'TYPE_COLLISION') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>XUNG ĐỘT</span>';
    }
    if (status === 'SUSPICIOUS') {
      return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30"><span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>NGHI TRÙNG</span>';
    }
    return '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">' + escapeHtml(status) + '</span>';
  }

  function renderPreviewTable(items) {
    var tbody = document.getElementById('fss-import-table-body');
    var countLabel = document.getElementById('fss-preview-count-label');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (countLabel) countLabel.textContent = (items ? items.length : 0) + ' mục';

    (items || []).forEach(function (it, idx) {
      var tr = document.createElement('tr');
      tr.className = 'hover:bg-blue-900/20 transition-colors border-b border-blue-950/40';

      tr.innerHTML = '<td class="px-3 py-2.5 text-center text-slate-400 font-mono text-[11px] select-none">' + (it.seq || (idx + 1)) + '</td>' +
        '<td class="px-3 py-2.5 font-semibold text-slate-100 text-sm tracking-wide">' + escapeHtml(it.fr) + '</td>' +
        '<td class="px-3 py-2.5">' + formatTypeBadge(it.type) + '</td>' +
        '<td class="px-3 py-2.5 text-center">' + formatCefrBadge(it.level) + '</td>' +
        '<td class="px-3 py-2.5 text-slate-300 text-xs truncate max-w-xs" title="' + escapeHtml(it.meaning_vi || '') + '">' + escapeHtml(it.meaning_vi || '') + '</td>' +
        '<td class="px-3 py-2.5 text-center whitespace-nowrap">' + formatStatusBadge(it.status) + '</td>';

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
      if (REQUIRE_BACKUP_BEFORE_REPLACE && !hasDownloadedBackupInSession) {
        commitBtn.disabled = true;
        if (statusText) statusText.textContent = 'Chặn khôi phục: Cần tải file sao lưu JSON trong phiên này trước khi khôi phục.';
        return;
      }
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

    // Kiểm tra cho REPLACE_ALL: khi bật REQUIRE_BACKUP_BEFORE_REPLACE phải tải sao lưu trước; và luôn phải gõ đúng "THAY THE"
    if (currentMode === 'REPLACE_ALL') {
      if (REQUIRE_BACKUP_BEFORE_REPLACE && !hasDownloadedBackupInSession) {
        commitBtn.disabled = true;
        if (statusText) statusText.textContent = 'Chặn thay thế: Cần tải file sao lưu JSON trong phiên này trước khi thay thế.';
        return;
      }
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

    // 2. Đẩy Cloud (Supabase Push All) - Bỏ qua nếu người dùng tích "Chỉ lưu cục bộ" (M43-B)
    var localOnlyCheckbox = document.getElementById('fss-import-local-only-checkbox');
    var isLocalOnly = !!(localOnlyCheckbox && localOnlyCheckbox.checked);

    var currentUser = null;
    if (!isLocalOnly && window.FSS_SUPABASE && typeof window.FSS_SUPABASE.getCurrentUser === 'function') {
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
      var statusText = document.getElementById('fss-import-status-text');
      if (statusText) {
        statusText.textContent = isLocalOnly ? 'Đã lưu cục bộ (bỏ qua đẩy Cloud theo yêu cầu).' : 'Đã lưu cục bộ.';
      }
      if (currentMode === 'REPLACE_ALL' && !isLocalOnly) {
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
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
