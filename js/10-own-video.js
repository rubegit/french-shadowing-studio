
(function () {
  var wrap = document.getElementById('own-yt-wrap');
  if (!wrap) return;

  // Luôn hiển thị trên mọi thiết bị (máy tính, điện thoại, máy tính bảng)
   function syncVisibility() { wrap.hidden = false; }
  syncVisibility();

  var $ = function (id) { return document.getElementById(id); };
  var toggle = $('own-yt-toggle'), panel = $('own-yt-panel');
  var urlIn = $('own-yt-url'), urlFb = $('own-yt-url-fb'), pasteBtn = $('own-yt-paste');
  var fileIn = $('own-yt-file'), pickBtn = $('own-yt-pick'), pickLabel = $('own-yt-pick-label');
  var okBox = $('own-yt-file-ok'), errBox = $('own-yt-file-err'), startBtn = $('own-yt-start');

  // Các phần tử gốc của app (đang ẩn) - giao diện mới điều khiển chính chúng nên dùng lại toàn bộ logic cũ.
  var hUrl = $('input-youtube-url'), hStart = $('btn-start-practice');
  var hBadgeTxt = $('file-status-text'), hBadge = $('file-status-badge');
  var hErr = $('parse-error-alert'), hErrTxt = $('parse-error-message');

  toggle.addEventListener('click', function () {
    var open = panel.hidden;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) setTimeout(function () { try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }, 60);
  });

  function idOf(v) { return typeof parseYouTubeId === 'function' ? parseYouTubeId(v) : null; }

  function refresh() {
    // 1) Link / ID
    var v = urlIn.value.trim(), vid = idOf(v);
    if (v && !vid) urlFb.innerHTML = '<span class="bad">Không tìm thấy ID video hợp lệ. Hãy dán link YouTube hoặc ID gồm 11 ký tự.</span>';
    else if (vid) urlFb.innerHTML = '<span class="ok">Video ID: <b style="font-family:monospace">' + vid + '</b></span>';
    else urlFb.innerHTML = '';
    // 2) Phụ đề (đọc lại trạng thái từ phần tử gốc)
    var good = hBadge && !hBadge.classList.contains('hidden');
    var bad = hErr && !hErr.classList.contains('hidden');
    okBox.hidden = !good; errBox.hidden = !bad;
    if (good) { okBox.textContent = '✓ ' + (hBadgeTxt.textContent || 'Đã nạp phụ đề'); pickLabel.textContent = 'Chọn file phụ đề khác'; }
    else if (!bad) pickLabel.textContent = 'Chọn file phụ đề từ máy';
    if (bad) errBox.textContent = hErrTxt.textContent || 'Không đọc được file phụ đề này.';
    // 3) Nút bắt đầu
    startBtn.disabled = !!hStart.disabled;
  }

  var lastCheckedVid = '';
  async function autoDetectSubtitles(vid) {
    if (!vid || vid === lastCheckedVid) return;
    lastCheckedVid = vid;
    // 1) Thử dò trong catalog/thư viện sẵn có
    if (typeof selectCategoryVideo === 'function' && typeof isLibraryVideo === 'function' && isLibraryVideo(vid)) {
      urlFb.innerHTML = '<span class="ok">Video ID: <b style="font-family:monospace">' + vid + '</b> · Đang nạp từ thư viện...</span>';
      try {
        var ok = await selectCategoryVideo(vid, null, null);
        if (ok) {
          urlFb.innerHTML = '<span class="ok">Video ID: <b style="font-family:monospace">' + vid + '</b> · ✓ Đã tự động nạp ' + sentences.length + ' câu từ thư viện!</span>';
          refresh();
          return;
        }
      } catch (err) {}
    }
    // 2) Thử nạp từ thư mục subs/
    var tryFiles = ['subs/' + vid + '.fr.json3', 'subs/' + vid + '.json3', 'subs/' + vid + '.fr.json', 'subs/' + vid + '.json', 'subs/' + vid + '.fr.srt', 'subs/' + vid + '.srt'];
    for (var i = 0; i < tryFiles.length; i++) {
      try {
        var r = await fetch(tryFiles[i]);
        if (r.ok) {
          var txt = await r.text();
          if (txt && !txt.trim().toLowerCase().startsWith('<!doctype')) {
            var parsed = parseAnySubtitle(tryFiles[i], txt);
            if (parsed && parsed.sentences && parsed.sentences.length) {
              sentences = parsed.sentences;
              subtitleFormat = parsed.format;
              currentVideoId = vid;
              hBadgeTxt.textContent = 'Tự động nạp: ' + parsed.sentences.length + ' câu';
              hBadge.classList.remove('hidden');
              urlFb.innerHTML = '<span class="ok">Video ID: <b style="font-family:monospace">' + vid + '</b> · ✓ Đã tìm thấy phụ đề có sẵn (' + parsed.sentences.length + ' câu)!</span>';
              if (typeof checkStartReady === 'function') checkStartReady();
              refresh();
              return;
            }
          }
        }
      } catch (e) {}
    }
  }

  urlIn.addEventListener('input', function () {
    hUrl.value = urlIn.value;
    hUrl.dispatchEvent(new Event('input'));
    var vid = idOf(urlIn.value.trim());
    if (vid) autoDetectSubtitles(vid);
    refresh();
  });

  // Xử lý dán transcript trực tiếp
  var togglePasteBtn = $('oy-toggle-paste-sub'), pasteBox = $('oy-paste-sub-box');
  var subTextarea = $('oy-sub-textarea'), applySubBtn = $('oy-apply-sub-btn');
  if (togglePasteBtn && pasteBox) {
    togglePasteBtn.addEventListener('click', function () {
      var isHidden = pasteBox.style.display === 'none';
      pasteBox.style.display = isHidden ? 'block' : 'none';
      togglePasteBtn.textContent = isHidden ? 'Thu gọn' : 'Mở ô dán';
      if (isHidden && subTextarea) subTextarea.focus();
    });
  }
  if (applySubBtn && subTextarea) {
    applySubBtn.addEventListener('click', function () {
      var raw = subTextarea.value.trim();
      if (!raw) { alert('Vui lòng dán nội dung phụ đề hoặc bản chép lời vào ô trước.'); return; }
      var parsed = typeof parseAnySubtitle === 'function' ? parseAnySubtitle('pasted.txt', raw) : null;
      if (parsed && parsed.sentences && parsed.sentences.length > 0) {
        sentences = parsed.sentences;
        subtitleFormat = parsed.format;
        currentVideoId = idOf(urlIn.value.trim()) || currentVideoId || 'custom';
        hBadgeTxt.textContent = 'Từ văn bản dán: ' + parsed.sentences.length + ' câu (' + parsed.format.toUpperCase() + ')';
        hBadge.classList.remove('hidden');
        if (hErr) hErr.classList.add('hidden');
        if (typeof checkStartReady === 'function') checkStartReady();
        refresh();
        alert('Đã nhận diện thành công ' + parsed.sentences.length + ' câu phụ đề! Bấm "Bắt đầu luyện tập" để học.');
      } else {
        alert('Không nhận dạng được định dạng phụ đề vừa dán. Hãy kiểm tra lại bản chép lời hoặc file SRT.');
      }
    });
  }
  // Nếu app tự điền link từ tên file phụ đề (có ID 11 ký tự), kéo ngược về ô của mình
  hUrl.addEventListener('input', function () { if (urlIn.value !== hUrl.value) { urlIn.value = hUrl.value; } refresh(); });

  pasteBtn.addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (t) {
        if (t) { urlIn.value = t.trim(); urlIn.dispatchEvent(new Event('input')); } else { urlIn.focus(); }
      }).catch(function () { urlIn.focus(); });
    } else { urlIn.focus(); }
  });

  // Android: không có "accept" thì nhiều trình duyệt (Brave, Chrome trên Xiaomi...) chỉ hiện bảng Camera / Ảnh & video.
  // Khai báo loại văn bản/phụ đề để mở đúng trình chọn tài liệu. iOS giữ nguyên (không giới hạn) vì hay làm xám file đuôi lạ.
  if (/Android/i.test(navigator.userAgent || '')) {
    fileIn.setAttribute('accept', '.srt,.vtt,.txt,.json,.json3,.xml,.ttml,.srv1,.srv2,.srv3,.sbv,.lrc,.ass,.ssa,text/plain,text/vtt,text/*,application/json,application/x-subrip,application/xml,application/octet-stream');
  }
  pickBtn.addEventListener('click', function () { fileIn.click(); });
  fileIn.addEventListener('change', function () {
    var f = fileIn.files && fileIn.files[0];
    if (f && typeof handleFile === 'function') handleFile(f);
    fileIn.value = '';   // cho phép chọn lại cùng một file
    setTimeout(refresh, 50);
  });

  startBtn.addEventListener('click', function () {
    if (startBtn.disabled) return;
    if (typeof startPractice === 'function') startPractice();
  });

  // Quản lý danh sách Thư viện video của bạn (Spec 2.9)
  window.renderCustomYtHistory = function () {
    var grid = document.getElementById('oy-hist-grid');
    var countEl = document.getElementById('oy-hist-count');
    if (!grid) return;
    var allHistory = typeof getLocalHistory === 'function' ? getLocalHistory() : [];
    var videoItems = allHistory.filter(function (h) { return !h.isText; });
    if (countEl) countEl.textContent = videoItems.length;

    if (videoItems.length === 0) {
      grid.innerHTML = [
        '<div class="oy-empty-card">',
        '  <div class="oy-empty-text">Bạn chưa nạp video YouTube nào vào danh sách riêng. Hãy dán link và phụ đề ở trên, hoặc trải nghiệm ngay với video mẫu tiếng Pháp:</div>',
        '  <div class="oy-sample-row">',
        '    <button type="button" class="oy-sample-btn" onclick="oyLoadSample(\'dwt1yeNtKeQ\')">',
        '      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor"/><rect x="2" y="5" width="20" height="14" rx="4"/></svg>',
        '      <span>RFI: Journal en français facile (dwt1yeNtKeQ)</span>',
        '    </button>',
        '  </div>',
        '</div>'
      ].join('');
      return;
    }

    grid.innerHTML = videoItems.map(function (it) {
      var meta = Object.assign({}, it.meta || {}, (typeof videoMetadataMap !== 'undefined' && videoMetadataMap[it.videoId]) || {});
      var title = it.title || meta.title || ('Video ' + it.videoId);
      var thumb = meta.thumbnail || ('https://i.ytimg.com/vi/' + it.videoId + '/hqdefault.jpg');
      var numSentences = it.sentences ? it.sentences.length : 0;
      var escTitle = (title + '').replace(/"/g, '&quot;');
      var vid = it.videoId;
      return [
        '<div class="oy-card" onclick="loadFromHistory(\'' + vid + '\')">',
        '  <div class="oy-card-thumb-wrap">',
        '    <img src="' + thumb + '" alt="' + escTitle + '" class="oy-card-thumb" onerror="this.onerror=null;this.src=\'data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'120\\\' height=\\\'68\\\' fill=\\\'%231e293b\\\'><rect width=\\\'120\\\' height=\\\'68\\\'/><text x=\\\'60\\\' y=\\\'38\\\' fill=\\\'%2394a3b8\\\' font-size=\\\'12\\\' text-anchor=\\\'middle\\\'>YouTube</text></svg>\';" />',
        '    <span class="oy-card-badge">' + numSentences + ' câu</span>',
        '  </div>',
        '  <div class="oy-card-info">',
        '    <h4 class="oy-card-title" title="' + escTitle + '">' + escTitle + '</h4>',
        '    <div class="oy-card-actions">',
        '      <button type="button" class="oy-card-start-btn" onclick="event.stopPropagation(); loadFromHistory(\'' + vid + '\')">Luyện tập</button>',
        '      <button type="button" class="oy-card-del-btn" onclick="event.stopPropagation(); if (typeof removeHistoryItem===\'function\') removeHistoryItem(\'' + vid + '\', event); if (window.renderCustomYtHistory) window.renderCustomYtHistory();" title="Xóa video này khỏi lịch sử">✕</button>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');
  };

  window.oyLoadSample = function (vid) {
    if (urlIn) {
      urlIn.value = 'https://www.youtube.com/watch?v=' + vid;
      urlIn.dispatchEvent(new Event('input'));
      if (typeof autoDetectSubtitles === 'function') autoDetectSubtitles(vid);
    }
  };

  // Theo dõi thay đổi ở phần tử gốc (đọc file xong là FileReader chạy bất đồng bộ)
  try {
    var mo = new MutationObserver(function () {
      refresh();
      if (window.renderCustomYtHistory) window.renderCustomYtHistory();
    });
    [hStart, hBadge, hBadgeTxt, hErr, hErrTxt].forEach(function (el) {
      if (el) mo.observe(el, { attributes: true, childList: true, characterData: true, subtree: true });
    });
  } catch (e) {}
  refresh();
  if (window.renderCustomYtHistory) window.renderCustomYtHistory();
})();
