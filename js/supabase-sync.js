/**
 * French Shadowing Studio - Supabase Cloud Sync Manager (Module M1 + M2 + M3)
 * Đồng bộ tự động 2 chiều: Kho từ vựng, Video import (phụ đề json3 song ngữ) và Tiến độ học.
 */
(function () {
  'use strict';

  var CONFIG_KEY = 'fss_supabase_config';
  var LAST_SYNC_KEY = 'fss_last_sync_time';
  var VOCAB_STORAGE_KEY = 'shadowing_saved_vocab_v1';
  var HISTORY_STORAGE_KEY = 'shadowing_master_user_history';
  var PROGRESS_STORAGE_KEY = 'shadowing_dictation_progress_v1';
  var TABLE_NAME = 'fss_user_data';

  // Cấu hình Supabase mặc định của dự án
  var DEFAULT_URL = 'https://ksuxrbwvmjxaskqhdfna.supabase.co';
  var DEFAULT_KEY = 'sb_publishable_BvyOUamNtHefjyWk-pEOdw_7LbWfmj_';

  var config = {
    url: DEFAULT_URL,
    key: DEFAULT_KEY
  };

  try {
    var savedCfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    if (savedCfg && savedCfg.url && savedCfg.key) {
      config = savedCfg;
    }
  } catch (e) {}

  var client = null;
  var currentUser = null;
  var syncState = 'disconnected'; // 'disconnected' | 'syncing' | 'synced' | 'error'
  var syncMessage = 'Chưa đăng nhập';
  var vocabSyncTimer = null;
  var historySyncTimer = null;
  var progressSyncTimer = null;
  var isFullSyncing = false;

  // Đảm bảo nạp Supabase SDK từ CDN
  function ensureSupabaseSdk(callback) {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      if (callback) callback();
      return;
    }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = function () {
      if (callback) callback();
    };
    script.onerror = function () {
      console.error('[Supabase] Không thể tải thư viện Supabase SDK từ CDN');
      updateSyncStatus('error', 'Lỗi tải Supabase SDK');
    };
    document.head.appendChild(script);
  }

  // Khởi tạo Supabase client
  function initClient() {
    if (!config.url || !config.key) {
      updateSyncStatus('disconnected', 'Chưa cấu hình Supabase');
      return false;
    }
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      ensureSupabaseSdk(initClient);
      return false;
    }
    try {
      client = window.supabase.createClient(config.url, config.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      window.supabaseClient = client;

      // Lắng nghe thay đổi phiên đăng nhập
      client.auth.onAuthStateChange(function (event, session) {
        currentUser = (session && session.user) || null;
        if (currentUser) {
          updateSyncStatus('synced', 'Đã đăng nhập: ' + (currentUser.email || 'Người dùng'));
          window.dispatchEvent(new CustomEvent('fss-supabase-auth-ready', { detail: { user: currentUser } }));
          // Tự động kéo toàn bộ dữ liệu (từ vựng + video + tiến độ) khi đăng nhập
          pullAllDataFromCloud();
        } else {
          updateSyncStatus('disconnected', 'Chưa đăng nhập');
          window.dispatchEvent(new CustomEvent('fss-supabase-signed-out'));
        }
        renderModalContent();
      });

      // Kiểm tra phiên đăng nhập hiện có
      client.auth.getSession().then(function (res) {
        if (res.data && res.data.session && res.data.session.user) {
          currentUser = res.data.session.user;
          updateSyncStatus('synced', 'Đã đăng nhập: ' + (currentUser.email || 'Người dùng'));
          // Tự động kéo dữ liệu khi khởi động có phiên
          pullAllDataFromCloud();
        } else {
          updateSyncStatus('disconnected', 'Chưa đăng nhập');
        }
        renderModalContent();
      }).catch(function (err) {
        console.warn('[Supabase] Lỗi lấy phiên:', err);
        updateSyncStatus('error', 'Lỗi phiên đăng nhập');
      });

      return true;
    } catch (err) {
      console.error('[Supabase] Lỗi khởi tạo client:', err);
      updateSyncStatus('error', 'Lỗi cấu hình Supabase');
      return false;
    }
  }

  // Cập nhật trạng thái hiển thị trên nút Header
  function updateSyncStatus(state, msg) {
    syncState = state;
    syncMessage = msg || '';

    var dots = document.querySelectorAll('.cloud-sync-dot');
    dots.forEach(function (dot) {
      dot.className = 'cloud-sync-dot ' + state;
    });

    var statusTexts = document.querySelectorAll('#cloud-sync-status-text');
    statusTexts.forEach(function (txt) {
      if (state === 'synced') txt.textContent = 'Cloud OK';
      else if (state === 'syncing') txt.textContent = 'Đang đồng bộ…';
      else if (state === 'error') txt.textContent = 'Lỗi Cloud';
      else txt.textContent = 'Đồng bộ Cloud';
    });

    var syncBtns = document.querySelectorAll('.cloud-sync-btn');
    syncBtns.forEach(function (btn) {
      btn.title = 'Đồng bộ Cloud: ' + syncMessage;
    });
  }

  function recordLastSync() {
    var nowStr = new Date().toLocaleTimeString('vi-VN') + ' ' + new Date().toLocaleDateString('vi-VN');
    try { localStorage.setItem(LAST_SYNC_KEY, nowStr); } catch (e) {}
  }

  // =========================================================================
  // 1. QUẢN LÝ DỮ LIỆU CỤC BỘ (LOCAL STORAGE HELPERS)
  // =========================================================================

  function getLocalVocab() {
    try {
      var d = JSON.parse(localStorage.getItem(VOCAB_STORAGE_KEY) || '[]');
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }

  function saveLocalVocabSilently(list) {
    try {
      localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(list));
      if (typeof updateVocabBadges === 'function') updateVocabBadges();
      var scr = document.getElementById('screen-vocab');
      if (scr && !scr.classList.contains('hidden') && typeof renderVocabPageKeepScroll === 'function') {
        renderVocabPageKeepScroll();
      }
      return true;
    } catch (e) { return false; }
  }

  function getLocalHistory() {
    try {
      var d = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]');
      return Array.isArray(d) ? d : [];
    } catch (e) { return []; }
  }

  function saveLocalHistorySilently(list) {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
      if (typeof renderHistorySection === 'function') renderHistorySection();
      return true;
    } catch (e) { return false; }
  }

  function getLocalProgress() {
    try {
      var d = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
      return (d && typeof d === 'object') ? d : {};
    } catch (e) { return {}; }
  }

  function saveLocalProgressSilently(obj) {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(obj));
      return true;
    } catch (e) { return false; }
  }

  // =========================================================================
  // 2. THUẬT TOÁN GỘP DỮ LIỆU THÔNG MINH (INTELLIGENT MERGE)
  // =========================================================================

  // Gộp Từ vựng
  function mergeVocabLists(localList, cloudList) {
    var map = new Map();
    var keyOf = function (it) {
      if (it && it.id) return 'id:' + it.id;
      return 'txt:' + String(it.videoId || '') + '|' + String(it.text || '').toLowerCase().trim();
    };

    localList.forEach(function (it) {
      if (it && (it.id || it.text)) map.set(keyOf(it), Object.assign({}, it));
    });

    var hasCloudNew = false;
    cloudList.forEach(function (cIt) {
      if (!cIt || (!cIt.id && !cIt.text)) return;
      var k = keyOf(cIt);
      if (!map.has(k)) {
        map.set(k, cIt);
        hasCloudNew = true;
      } else {
        var lIt = map.get(k);
        var merged = Object.assign({}, lIt, cIt);
        if (lIt.wordVi && !cIt.wordVi) merged.wordVi = lIt.wordVi;
        if (lIt.srs && (!cIt.srs || (lIt.srs.lastReview || 0) > (cIt.srs.lastReview || 0))) {
          merged.srs = lIt.srs;
        }
        map.set(k, merged);
      }
    });

    var result = Array.from(map.values());
    result.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

    return {
      merged: result,
      hasCloudNew: hasCloudNew,
      hasLocalNew: result.length > cloudList.length
    };
  }

  // Gộp Lịch sử video & bài đọc
  function mergeHistoryLists(localHist, cloudHist) {
    var map = new Map();

    localHist.forEach(function (h) {
      if (h && h.videoId) map.set(h.videoId, Object.assign({}, h));
    });

    var hasCloudNew = false;
    cloudHist.forEach(function (cH) {
      if (!cH || !cH.videoId) return;
      if (!map.has(cH.videoId)) {
        map.set(cH.videoId, cH);
        hasCloudNew = true;
      } else {
        var lH = map.get(cH.videoId);
        var merged = Object.assign({}, lH, cH);
        // Ưu tiên bản ghi có phụ đề đầy đủ (sentences)
        if (lH.sentences && lH.sentences.length && (!cH.sentences || !cH.sentences.length)) {
          merged.sentences = lH.sentences;
        }
        if (lH.userTrans && !cH.userTrans) merged.userTrans = lH.userTrans;
        map.set(cH.videoId, merged);
      }
    });

    var result = Array.from(map.values());
    result.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
    if (result.length > 30) result = result.slice(0, 30);

    return {
      merged: result,
      hasCloudNew: hasCloudNew,
      hasLocalNew: result.length > cloudHist.length
    };
  }

  // Gộp Tiến độ chép chính tả
  function mergeProgressObjs(localProg, cloudProg) {
    var merged = Object.assign({}, localProg);
    var hasLocalNew = false;

    Object.keys(cloudProg).forEach(function (vid) {
      var cP = cloudProg[vid];
      var lP = merged[vid];
      if (!lP) {
        merged[vid] = cP;
      } else {
        // So sánh mốc thời gian hoàn thành câu gần nhất
        if ((cP.t || 0) > (lP.t || 0)) {
          merged[vid] = cP;
        } else if ((lP.t || 0) > (cP.t || 0)) {
          hasLocalNew = true;
        }
      }
    });

    return {
      merged: merged,
      hasLocalNew: hasLocalNew || Object.keys(merged).length > Object.keys(cloudProg).length
    };
  }

  // =========================================================================
  // 3. ĐỒNG BỘ TOÀN DIỆN (FULL SYNC ENGINE)
  // =========================================================================

  // Kéo toàn bộ dữ liệu từ Cloud (Pull All)
  async function pullAllDataFromCloud() {
    if (!client || !currentUser || isFullSyncing) return;
    isFullSyncing = true;
    updateSyncStatus('syncing', 'Đang đồng bộ dữ liệu…');

    try {
      var res = await client
        .from(TABLE_NAME)
        .select('vocab, history, progress, updated_at')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (res.error) {
        if (res.error.code === '42P01' || (res.error.message && res.error.message.includes('does not exist'))) {
          console.warn('[Supabase] Bảng fss_user_data chưa được tạo trên Supabase');
          updateSyncStatus('error', 'Chưa tạo bảng fss_user_data (xem tab Cấu hình)');
        } else {
          console.warn('[Supabase] Lỗi kéo dữ liệu:', res.error);
          updateSyncStatus('error', 'Lỗi kết nối Cloud');
        }
        isFullSyncing = false;
        return;
      }

      var row = res.data;
      var localVocab = getLocalVocab();
      var localHistory = getLocalHistory();
      var localProgress = getLocalProgress();

      if (!row) {
        // Người dùng mới hoàn toàn: nếu local đang có dữ liệu thì đẩy lên tạo bản ghi đầu tiên
        if (localVocab.length > 0 || localHistory.length > 0 || Object.keys(localProgress).length > 0) {
          await pushAllDataToCloud(localVocab, localHistory, localProgress);
        } else {
          updateSyncStatus('synced', 'Đồng bộ hoàn tất');
        }
      } else {
        // Gộp Từ vựng
        var cloudVocab = Array.isArray(row.vocab) ? row.vocab : [];
        var vRes = mergeVocabLists(localVocab, cloudVocab);
        saveLocalVocabSilently(vRes.merged);

        // Gộp Lịch sử video
        var cloudHistory = Array.isArray(row.history) ? row.history : [];
        var hRes = mergeHistoryLists(localHistory, cloudHistory);
        saveLocalHistorySilently(hRes.merged);

        // Gộp Tiến độ học
        var cloudProgress = (row.progress && typeof row.progress === 'object') ? row.progress : {};
        var pRes = mergeProgressObjs(localProgress, cloudProgress);
        saveLocalProgressSilently(pRes.merged);

        // Nếu máy có dữ liệu mới hơn thì đẩy ngược lên để cập nhật Cloud
        if (vRes.hasLocalNew || hRes.hasLocalNew || pRes.hasLocalNew) {
          await pushAllDataToCloud(vRes.merged, hRes.merged, pRes.merged);
        } else {
          updateSyncStatus('synced', 'Đã đồng bộ ' + vRes.merged.length + ' từ, ' + hRes.merged.length + ' video');
          recordLastSync();
        }
      }
    } catch (err) {
      console.error('[Supabase] Lỗi đồng bộ dữ liệu:', err);
      updateSyncStatus('error', 'Lỗi mạng khi đồng bộ');
    } finally {
      isFullSyncing = false;
      renderModalContent();
    }
  }

  // Đẩy toàn bộ dữ liệu lên Cloud (Push All)
  async function pushAllDataToCloud(vocabList, historyList, progressObj) {
    if (!client || !currentUser) return;
    updateSyncStatus('syncing', 'Đang tải lên Cloud…');

    try {
      // Lọc bỏ phụ đề của video thư viện mặc định để tiết kiệm dung lượng
      var cleanHistory = historyList.filter(function (h) {
        return h && (!h.lib || h.userTrans || h.isText || (h.sentences && h.sentences.length));
      });

      var nowIso = new Date().toISOString();
      var res = await client
        .from(TABLE_NAME)
        .upsert({
          user_id: currentUser.id,
          vocab: vocabList,
          history: cleanHistory,
          progress: progressObj,
          updated_at: nowIso
        }, { onConflict: 'user_id' });

      if (res.error) {
        if (res.error.code === '42P01' || (res.error.message && res.error.message.includes('does not exist'))) {
          updateSyncStatus('error', 'Chưa tạo bảng fss_user_data (xem tab Cấu hình)');
        } else {
          console.error('[Supabase] Lỗi đẩy dữ liệu:', res.error);
          updateSyncStatus('error', 'Lỗi lưu dữ liệu lên Cloud');
        }
      } else {
        updateSyncStatus('synced', 'Đã đồng bộ ' + vocabList.length + ' từ, ' + cleanHistory.length + ' video');
        recordLastSync();
      }
    } catch (err) {
      console.error('[Supabase] Lỗi mạng khi đẩy dữ liệu:', err);
      updateSyncStatus('error', 'Lỗi kết nối Cloud');
    }
  }

  // Debounced push riêng lẻ khi user thao tác
  function syncVocabDebounced(list) {
    if (!client || !currentUser) return;
    if (vocabSyncTimer) clearTimeout(vocabSyncTimer);
    updateSyncStatus('syncing', 'Sẵn sàng đồng bộ…');
    vocabSyncTimer = setTimeout(function () {
      pushAllDataToCloud(list, getLocalHistory(), getLocalProgress());
    }, 1500);
  }

  function syncHistoryDebounced(list) {
    if (!client || !currentUser) return;
    if (historySyncTimer) clearTimeout(historySyncTimer);
    updateSyncStatus('syncing', 'Sẵn sàng đồng bộ…');
    historySyncTimer = setTimeout(function () {
      pushAllDataToCloud(getLocalVocab(), list, getLocalProgress());
    }, 2000);
  }

  function syncProgressDebounced(progressObj) {
    if (!client || !currentUser) return;
    if (progressSyncTimer) clearTimeout(progressSyncTimer);
    updateSyncStatus('syncing', 'Sẵn sàng đồng bộ…');
    progressSyncTimer = setTimeout(function () {
      pushAllDataToCloud(getLocalVocab(), getLocalHistory(), progressObj);
    }, 2500);
  }

  // =========================================================================
  // 4. GIAO DIỆN MODAL CLOUD SYNC
  // =========================================================================

  window.openCloudSyncModal = function () {
    var modal = document.getElementById('fss-cloud-modal');
    if (!modal) {
      createModalDOM();
      modal = document.getElementById('fss-cloud-modal');
    }
    renderModalContent();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  };

  window.closeCloudSyncModal = function () {
    var modal = document.getElementById('fss-cloud-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  function createModalDOM() {
    var modal = document.createElement('div');
    modal.id = 'fss-cloud-modal';
    modal.className = 'fss-cloud-modal-overlay hidden fixed inset-0 z-50 items-center justify-center bg-black/70 backdrop-blur-xs p-4';
    modal.onclick = function (e) {
      if (e.target === modal) window.closeCloudSyncModal();
    };

    modal.innerHTML = [
      '<div class="fss-cloud-modal-card bg-[#0b1329] border border-blue-900/80 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl text-slate-200 relative animate-in fade-in zoom-in-95 duration-150">',
      '  <div class="flex items-center justify-between pb-3 mb-4 border-b border-blue-950/80">',
      '    <div class="flex items-center gap-2.5">',
      '      <div class="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">',
      '        <i data-lucide="cloud" class="w-4 h-4"></i>',
      '      </div>',
      '      <div>',
      '        <h3 class="text-base font-bold text-white flex items-center gap-2">',
      '          <span>Đồng bộ Đám mây (Supabase)</span>',
      '          <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-300">Cá nhân</span>',
      '        </h3>',
      '        <p class="text-xs text-slate-400">Tự động đồng bộ từ vựng & video giữa PC và Điện thoại</p>',
      '      </div>',
      '    </div>',
      '    <button type="button" onclick="closeCloudSyncModal()" class="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer">',
      '      <i data-lucide="x" class="w-4 h-4"></i>',
      '    </button>',
      '  </div>',
      '  <div id="fss-cloud-modal-body" class="space-y-4"></div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(modal);
  }

  var SCHEMA_SQL = [
    'create table if not exists public.fss_user_data (',
    '  user_id uuid primary key references auth.users(id) on delete cascade,',
    '  vocab jsonb default \'[]\'::jsonb,',
    '  history jsonb default \'[]\'::jsonb,',
    '  progress jsonb default \'{}\'::jsonb,',
    '  updated_at timestamptz default now()',
    ');',
    'alter table public.fss_user_data enable row level security;',
    'drop policy if exists "Users can view own data" on public.fss_user_data;',
    'create policy "Users can view own data" on public.fss_user_data for select using (auth.uid() = user_id);',
    'drop policy if exists "Users can insert own data" on public.fss_user_data;',
    'create policy "Users can insert own data" on public.fss_user_data for insert with check (auth.uid() = user_id);',
    'drop policy if exists "Users can update own data" on public.fss_user_data;',
    'create policy "Users can update own data" on public.fss_user_data for update using (auth.uid() = user_id);'
  ].join('\n');

  function renderModalContent(activeTab) {
    var body = document.getElementById('fss-cloud-modal-body');
    if (!body) return;

    var hasConfig = !!(config.url && config.key);
    var tab = activeTab || (hasConfig ? (currentUser ? 'status' : 'login') : 'config');

    var tabsHtml = [
      '<div class="flex border-b border-blue-950/60 pb-1 mb-4 gap-2 text-xs font-semibold">',
      hasConfig ? '<button type="button" class="px-3 py-1.5 rounded-lg ' + (tab === 'status' && currentUser ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white') + '" onclick="window.fssSwitchTab(\'status\')">Trạng thái</button>' : '',
      hasConfig ? '<button type="button" class="px-3 py-1.5 rounded-lg ' + (tab === 'login' && !currentUser ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white') + '" onclick="window.fssSwitchTab(\'login\')">' + (currentUser ? 'Tài khoản' : 'Đăng nhập') + '</button>' : '',
      '<button type="button" class="px-3 py-1.5 rounded-lg ' + (tab === 'config' ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-white') + '" onclick="window.fssSwitchTab(\'config\')">Cấu hình API ' + (!hasConfig ? '<span class="text-amber-400">●</span>' : '') + '</button>',
      '</div>'
    ].join('');

    var contentHtml = '';

    // TAB 1: CẤU HÌNH API
    if (tab === 'config') {
      contentHtml = [
        '<div class="space-y-3.5 text-xs">',
        '  <div class="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-slate-300 space-y-1.5 leading-relaxed">',
        '    <p class="font-semibold text-blue-300 flex items-center gap-1.5"><i data-lucide="info" class="w-3.5 h-3.5"></i> Hướng dẫn kết nối Supabase cá nhân:</p>',
        '    <ol class="list-decimal pl-4 space-y-1 text-slate-300">',
        '      <li>Vào <a href="https://supabase.com" target="_blank" rel="noopener" class="text-blue-400 underline hover:text-blue-300 font-semibold">supabase.com</a> đăng nhập và tạo 1 Project mới miễn phí.</li>',
        '      <li>Vào <b>SQL Editor</b> → Bấm <b>New query</b> → Dán mã SQL bên dưới và bấm <b>Run</b>.</li>',
        '      <li>Vào <b>Project Settings → API</b> để lấy URL và Anon Key dán vào bên dưới.</li>',
        '    </ol>',
        '    <div class="pt-1">',
        '      <button type="button" onclick="window.fssCopySql()" id="btn-copy-sql" class="px-3 py-1.5 rounded-lg bg-blue-900/70 hover:bg-blue-800 border border-blue-700/80 text-blue-200 font-semibold flex items-center gap-1.5 cursor-pointer">',
        '        <i data-lucide="copy" class="w-3.5 h-3.5"></i>',
        '        <span id="txt-copy-sql">Sao chép mã SQL tạo bảng (1-click)</span>',
        '      </button>',
        '    </div>',
        '  </div>',
        '  <div class="space-y-1.5">',
        '    <label class="block font-semibold text-slate-300">Project URL:</label>',
        '    <input id="fss-cfg-url" type="text" placeholder="https://xyzcompany.supabase.co" value="' + (config.url || '') + '" class="w-full px-3 py-2 rounded-lg bg-[#060a17] border border-blue-900/80 text-white font-mono text-xs focus:border-blue-500 focus:outline-none" />',
        '  </div>',
        '  <div class="space-y-1.5">',
        '    <label class="block font-semibold text-slate-300">Anon Public Key:</label>',
        '    <input id="fss-cfg-key" type="password" placeholder="eyJhbGciOiJIUzI1NiIsIn..." value="' + (config.key || '') + '" class="w-full px-3 py-2 rounded-lg bg-[#060a17] border border-blue-900/80 text-white font-mono text-xs focus:border-blue-500 focus:outline-none" />',
        '  </div>',
        '  <div class="pt-2 flex items-center justify-between">',
        '    <button type="button" onclick="window.fssSaveConfig()" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer">',
        '      <i data-lucide="save" class="w-3.5 h-3.5"></i>',
        '      <span>Lưu cấu hình & Kết nối</span>',
        '    </button>',
        hasConfig ? '<button type="button" onclick="window.fssClearConfig()" class="text-red-400 hover:text-red-300 underline cursor-pointer">Xóa cấu hình</button>' : '',
        '  </div>',
        '</div>'
      ].join('');
    }
    // TAB 2: ĐĂNG NHẬP / TÀI KHOẢN
    else if (tab === 'login') {
      if (currentUser) {
        contentHtml = [
          '<div class="space-y-4 text-xs">',
          '  <div class="p-4 rounded-xl bg-blue-950/50 border border-blue-800/60 flex items-center gap-3">',
          '    <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base">',
          (currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'),
          '    </div>',
          '    <div class="flex-1 truncate">',
          '      <p class="font-bold text-white text-sm truncate">' + (currentUser.email || 'Người dùng') + '</p>',
          '      <p class="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span> Đã kết nối với Supabase</p>',
          '    </div>',
          '  </div>',
          '  <div class="pt-2 flex justify-between items-center">',
          '    <button type="button" onclick="window.fssSignOut()" class="px-3.5 py-2 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/80 text-red-200 font-semibold transition-all cursor-pointer flex items-center gap-1.5">',
          '      <i data-lucide="log-out" class="w-3.5 h-3.5"></i>',
          '      <span>Đăng xuất</span>',
          '    </button>',
          '    <button type="button" onclick="window.fssSwitchTab(\'status\')" class="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all cursor-pointer">',
          '      <span>Xem đồng bộ</span>',
          '    </button>',
          '  </div>',
          '</div>'
        ].join('');
      } else {
        contentHtml = [
          '<div class="space-y-4 text-xs">',
          '  <p class="text-slate-300">Đăng nhập tài khoản của bạn để dữ liệu được tự động đồng bộ sang mọi thiết bị:</p>',
          '  <button type="button" onclick="window.fssSignInGoogle()" class="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer border border-slate-300">',
          '    <svg class="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>',
          '    <span>Đăng nhập nhanh với Google</span>',
          '  </button>',
          '  <div class="flex items-center gap-2 my-2"><div class="flex-1 h-px bg-blue-950"></div><span class="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">hoặc Email OTP</span><div class="flex-1 h-px bg-blue-950"></div></div>',
          '  <div class="space-y-2">',
          '    <input id="fss-login-email" type="email" placeholder="Nhập địa chỉ email của bạn..." class="w-full px-3 py-2 rounded-lg bg-[#060a17] border border-blue-900/80 text-white text-xs focus:border-blue-500 focus:outline-none" />',
          '    <button type="button" onclick="window.fssSendOtp()" class="w-full py-2 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 hover:text-white font-semibold transition-all cursor-pointer">Gửi mã đăng nhập qua Email</button>',
          '  </div>',
          '  <div id="fss-otp-verify-block" class="hidden space-y-2 pt-2 border-t border-blue-950/60">',
          '    <p class="text-emerald-400 text-[11px]">Đã gửi mã xác thực về email của bạn. Hãy nhập mã 6 số:</p>',
          '    <div class="flex gap-2">',
          '      <input id="fss-otp-token" type="text" placeholder="123456" maxlength="8" class="flex-1 px-3 py-2 rounded-lg bg-[#060a17] border border-blue-900/80 text-white font-mono text-center tracking-widest text-sm focus:border-blue-500 focus:outline-none" />',
          '      <button type="button" onclick="window.fssVerifyOtp()" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer">Xác thực</button>',
          '    </div>',
          '  </div>',
          '</div>'
        ].join('');
      }
    }
    // TAB 3: TRẠNG THÁI ĐỒNG BỘ
    else {
      var lastSyncStr = localStorage.getItem(LAST_SYNC_KEY) || 'Chưa đồng bộ lần nào';
      var localVocabCount = getLocalVocab().length;
      var localHistCount = getLocalHistory().length;
      var localProgCount = Object.keys(getLocalProgress()).length;

      contentHtml = [
        '<div class="space-y-4 text-xs">',
        '  <div class="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/60 space-y-2.5">',
        '    <div class="flex justify-between items-center">',
        '      <span class="text-slate-400">Tài khoản:</span>',
        '      <span class="font-bold text-white truncate max-w-[200px]">' + (currentUser ? currentUser.email : 'Chưa đăng nhập') + '</span>',
        '    </div>',
        '    <div class="grid grid-cols-3 gap-2 pt-1 border-t border-blue-950/60 text-center">',
        '      <div class="p-2 rounded-lg bg-[#070e22] border border-blue-950">',
        '        <div class="font-bold text-blue-300 text-sm">' + localVocabCount + '</div>',
        '        <div class="text-[10px] text-slate-400 mt-0.5">Từ vựng</div>',
        '      </div>',
        '      <div class="p-2 rounded-lg bg-[#070e22] border border-blue-950">',
        '        <div class="font-bold text-rose-300 text-sm">' + localHistCount + '</div>',
        '        <div class="text-[10px] text-slate-400 mt-0.5">Video / bài</div>',
        '      </div>',
        '      <div class="p-2 rounded-lg bg-[#070e22] border border-blue-950">',
        '        <div class="font-bold text-emerald-300 text-sm">' + localProgCount + '</div>',
        '        <div class="text-[10px] text-slate-400 mt-0.5">Tiến độ bài</div>',
        '      </div>',
        '    </div>',
        '    <div class="flex justify-between items-center pt-1 border-t border-blue-950/60">',
        '      <span class="text-slate-400">Trạng thái:</span>',
        '      <span class="font-semibold text-emerald-400 flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Tự động đồng bộ 2 chiều</span>',
        '    </div>',
        '    <div class="flex justify-between items-center">',
        '      <span class="text-slate-400">Lần cuối:</span>',
        '      <span class="font-mono text-slate-300">' + lastSyncStr + '</span>',
        '    </div>',
        '  </div>',
        '  <div class="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] leading-relaxed">',
        '    <p class="font-semibold flex items-center gap-1"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> Tự động hóa hoàn toàn:</p>',
        '    <p class="mt-1 text-slate-300">Import video trên máy tính bằng userscript hoặc lưu từ vựng mới $\\rightarrow$ Toàn bộ dữ liệu tự động đẩy lên Supabase. Điện thoại mở lên sẽ tự động có video và từ vựng để học ngay!</p>',
        '  </div>',
        '  <div class="pt-2 flex justify-between items-center">',
        '    <button type="button" onclick="window.fssManualSync()" class="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer">',
        '      <i data-lucide="refresh-cw" class="w-3.5 h-3.5"></i>',
        '      <span>Đồng bộ ngay bây giờ</span>',
        '    </button>',
        '    <button type="button" onclick="window.fssSignOut()" class="text-xs text-slate-400 hover:text-red-400 underline cursor-pointer">Đăng xuất</button>',
        '  </div>',
        '</div>'
      ].join('');
    }

    body.innerHTML = tabsHtml + contentHtml;
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  // Chuyển tab
  window.fssSwitchTab = function (tab) { renderModalContent(tab); };

  // Copy mã SQL tạo bảng
  window.fssCopySql = function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SCHEMA_SQL).then(function () {
        var txt = document.getElementById('txt-copy-sql');
        if (txt) {
          txt.textContent = '✓ Đã sao chép mã SQL!';
          setTimeout(function () { txt.textContent = 'Sao chép mã SQL tạo bảng (1-click)'; }, 2500);
        }
      });
    } else {
      prompt('Hãy copy đoạn mã SQL bên dưới:', SCHEMA_SQL);
    }
  };

  // Lưu cấu hình
  window.fssSaveConfig = function () {
    var urlIn = document.getElementById('fss-cfg-url');
    var keyIn = document.getElementById('fss-cfg-key');
    if (!urlIn || !keyIn) return;

    var url = urlIn.value.trim().replace(/\/+$/, '');
    var key = keyIn.value.trim();

    if (!url || !key) {
      alert('Vui lòng nhập đầy đủ Project URL và Anon Public Key!');
      return;
    }
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co/i.test(url)) {
      alert('Project URL phải có dạng https://xyz.supabase.co');
      return;
    }

    config = { url: url, key: key };
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {}

    var ok = initClient();
    if (ok) {
      alert('Đã lưu cấu hình Supabase thành công! Hãy đăng nhập tài khoản của bạn.');
      renderModalContent('login');
    }
  };

  // Xoá cấu hình
  window.fssClearConfig = function () {
    if (!confirm('Bạn có chắc muốn xoá thông tin cấu hình Supabase trên máy này?')) return;
    try { localStorage.removeItem(CONFIG_KEY); } catch (e) {}
    config = { url: '', key: '' };
    client = null;
    currentUser = null;
    updateSyncStatus('disconnected', 'Chưa cấu hình Supabase');
    renderModalContent('config');
  };

  // Đăng nhập Google
  window.fssSignInGoogle = function () {
    if (!client) {
      alert('Chưa khởi tạo được kết nối Supabase!');
      return;
    }
    client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    }).then(function (res) {
      if (res.error) {
        if (res.error.message && (res.error.message.includes('not enabled') || res.error.message.includes('Unsupported provider'))) {
          alert('Chưa bật tính năng đăng nhập Google trên Supabase!\n\nCách bật (mất 2 phút):\n1. Vào Supabase -> Authentication -> Providers -> chọn Google.\n2. Bật công tắc "Enable Sign in with Google: ON".\n3. Điền Google Client ID & Secret.\n\n(Trong lúc chưa cấu hình, bạn có thể đăng nhập ngay bằng Email OTP bên dưới rất nhanh!)');
        } else {
          alert('Lỗi đăng nhập Google: ' + res.error.message);
        }
      }
    }).catch(function (err) {
      alert('Lỗi: ' + (err.message || err));
    });
  };

  // Gửi OTP qua Email
  window.fssSendOtp = function () {
    if (!client) {
      alert('Vui lòng lưu cấu hình Supabase trước khi đăng nhập!');
      return;
    }
    var emailIn = document.getElementById('fss-login-email');
    var email = emailIn ? emailIn.value.trim() : '';
    if (!email || !email.includes('@')) {
      alert('Vui lòng nhập email hợp lệ!');
      return;
    }
    client.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname
      }
    }).then(function (res) {
      if (res.error) {
        alert('Lỗi gửi OTP: ' + res.error.message);
      } else {
        var verifyBlock = document.getElementById('fss-otp-verify-block');
        if (verifyBlock) verifyBlock.classList.remove('hidden');
      }
    }).catch(function (err) {
      alert('Lỗi: ' + (err.message || err));
    });
  };

  // Xác thực OTP
  window.fssVerifyOtp = function () {
    if (!client) return;
    var emailIn = document.getElementById('fss-login-email');
    var tokenIn = document.getElementById('fss-otp-token');
    var email = emailIn ? emailIn.value.trim() : '';
    var token = tokenIn ? tokenIn.value.trim() : '';
    if (!email || !token) {
      alert('Vui lòng nhập email và mã OTP 6 số!');
      return;
    }
    client.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email'
    }).then(function (res) {
      if (res.error) {
        alert('Mã OTP không đúng hoặc đã hết hạn: ' + res.error.message);
      } else {
        currentUser = res.data.user;
        updateSyncStatus('synced', 'Đã đăng nhập: ' + currentUser.email);
        pullAllDataFromCloud();
        renderModalContent('status');
      }
    }).catch(function (err) {
      alert('Lỗi: ' + (err.message || err));
    });
  };

  // Đăng xuất
  window.fssSignOut = function () {
    if (!client) return;
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi Supabase?')) return;
    client.auth.signOut().then(function () {
      currentUser = null;
      updateSyncStatus('disconnected', 'Chưa đăng nhập');
      renderModalContent('login');
    });
  };

  // Nút đồng bộ thủ công
  window.fssManualSync = function () {
    if (!currentUser) {
      alert('Vui lòng đăng nhập trước khi đồng bộ!');
      return;
    }
    pullAllDataFromCloud().then(function () {
      if (typeof showVocabToast === 'function') {
        showVocabToast('Đã đồng bộ toàn bộ Từ vựng & Video thành công', true);
      }
    });
  };

  // Export API cho app
  window.FSS_SUPABASE = {
    getClient: function () { return client; },
    getUser: function () { return currentUser; },
    isReady: function () { return !!(client && currentUser); },
    updateStatus: updateSyncStatus,
    syncVocabDebounced: syncVocabDebounced,
    syncHistoryDebounced: syncHistoryDebounced,
    syncProgressDebounced: syncProgressDebounced,
    pullAll: pullAllDataFromCloud,
    pushAll: pushAllDataToCloud
  };

  // Tự động khởi chạy khi tải trang
  document.addEventListener('DOMContentLoaded', function () {
    ensureSupabaseSdk(function () {
      initClient();
    });
  });
})();
