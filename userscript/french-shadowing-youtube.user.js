// ==UserScript==
// @name         French Shadowing Studio - Trợ thủ YouTube (Word Timestamps & 1-Click Import)
// @namespace    https://french-shadowing-studio.vercel.app/
// @version      1.0.0
// @description  Tự động trích xuất phụ đề tiếng Pháp dạng JSON3 (chuẩn word-level timestamp) trên YouTube: Tải file .json3 về máy hoặc 1-click chuyển video sang French Shadowing Studio để luyện tập.
// @author       French Shadowing Studio
// @match        https://www.youtube.com/*
// @match        https://french-shadowing-studio.vercel.app/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  var STUDIO_URL = 'https://french-shadowing-studio.vercel.app/';

  // =========================================================================
  // 1. NẾU ĐANG Ở TRANG FRENCH SHADOWING STUDIO: NHẬN DỮ LIỆU TỪ YOUTUBE CHUYỂN QUA
  // =========================================================================
  if (location.host.includes('french-shadowing-studio') || location.host.includes('localhost')) {
    function checkPendingImport() {
      try {
        var pending = GM_getValue('PENDING_SHADOWING_IMPORT', null);
        if (pending && pending.videoId) {
          GM_deleteValue('PENDING_SHADOWING_IMPORT');
          var maxWait = 50; // đợi tối đa 5s để app sẵn sàng
          var timer = setInterval(function () {
            maxWait--;
            if (document.getElementById('input-youtube-url') || maxWait <= 0) {
              clearInterval(timer);
              window.postMessage({ type: 'SHADOWING_IMPORT', payload: pending }, '*');
            }
          }, 100);
        }
      } catch (e) {
        console.error('[French Shadowing Userscript] Lỗi nhận import:', e);
      }
    }
    checkPendingImport();
    window.addEventListener('focus', checkPendingImport);
    return;
  }

  // =========================================================================
  // 2. NẾU ĐANG Ở TRANG YOUTUBE: THÊM NÚT VÀO GIAO DIỆN VIDEO
  // =========================================================================
  var BTN_CONTAINER_ID = 'fss-yt-helper-toolbar';

  function getVideoId() {
    var urlParams = new URLSearchParams(window.location.search);
    var vid = urlParams.get('v');
    if (vid && vid.length === 11) return vid;
    var shortsMatch = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    return shortsMatch ? shortsMatch[1] : null;
  }

  // Lấy danh sách caption tracks từ YouTube Player
  async function getCaptionTracks(videoId) {
    var pr = null;
    var player = document.getElementById('movie_player');
    if (player && typeof player.getPlayerResponse === 'function') {
      try { pr = player.getPlayerResponse(); } catch (e) {}
    }
    if (!pr && window.ytInitialPlayerResponse) {
      pr = window.ytInitialPlayerResponse;
    }
    if (!pr || (pr.videoDetails && pr.videoDetails.videoId !== videoId)) {
      try {
        var resp = await fetch('https://www.youtube.com/watch?v=' + videoId);
        var html = await resp.text();
        var match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match) pr = JSON.parse(match[1]);
      } catch (e) {}
    }

    var tracks = (pr && pr.captions && pr.captions.playerCaptionsTracklistRenderer && pr.captions.playerCaptionsTracklistRenderer.captionTracks) || [];
    return { tracks: tracks, playerResponse: pr };
  }

  // Tìm track tiếng Pháp (hoặc dịch tự động sang tiếng Pháp)
  function selectFrenchTrack(tracks) {
    if (!tracks || !tracks.length) return null;

    // Ưu tiên 1: Phụ đề thủ công tiếng Pháp (chính xác nhất)
    var manual = tracks.find(function (t) {
      return (t.languageCode === 'fr' || (t.languageCode && t.languageCode.startsWith('fr-'))) && t.kind !== 'asr';
    });
    if (manual) return { track: manual, type: 'manual' };

    // Ưu tiên 2: Phụ đề ASR tự động tiếng Pháp (có timestamp từng từ chuẩn)
    var asr = tracks.find(function (t) {
      return (t.languageCode === 'fr' || (t.languageCode && t.languageCode.startsWith('fr-'))) && t.kind === 'asr';
    });
    if (asr) return { track: asr, type: 'asr' };

    // Ưu tiên 3: Bất kỳ phụ đề tiếng Pháp nào
    var anyFr = tracks.find(function (t) {
      return (t.languageCode || '').toLowerCase().startsWith('fr');
    });
    if (anyFr) return { track: anyFr, type: 'fr' };

    // Ưu tiên 4: Dịch tự động track có sẵn sang tiếng Pháp (&tlang=fr)
    if (tracks[0] && tracks[0].baseUrl) {
      var transTrack = Object.assign({}, tracks[0]);
      transTrack.baseUrl = tracks[0].baseUrl + '&tlang=fr';
      transTrack.name = { simpleText: 'Français (Dịch tự động)' };
      return { track: transTrack, type: 'auto-translate' };
    }

    return null;
  }

  // Tải JSON3 từ baseUrl
  async function fetchJson3(baseUrl) {
    var url = baseUrl;
    if (!url.includes('fmt=json3')) {
      url += (url.includes('?') ? '&' : '?') + 'fmt=json3';
    }
    var res = await fetch(url);
    if (!res.ok) throw new Error('Không thể tải phụ đề từ YouTube (HTTP ' + res.status + ')');
    return await res.json();
  }

  // Hiển thị thông báo nhỏ (Toast) trên YouTube
  function showToast(msg, isError) {
    var toast = document.getElementById('fss-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fss-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:9999999;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);transition:all 0.3s;pointer-events:none;color:#fff;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = isError ? 'rgba(239, 68, 68, 0.95)' : 'rgba(37, 99, 235, 0.95)';
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3500);
  }

  // Kích hoạt tải file về máy
  function triggerDownload(filename, text) {
    var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Vẽ nút lên trang YouTube
  function injectToolbar() {
    var vid = getVideoId();
    if (!vid) return;

    if (document.getElementById(BTN_CONTAINER_ID)) {
      var oldVid = document.getElementById(BTN_CONTAINER_ID).getAttribute('data-vid');
      if (oldVid === vid) return;
      document.getElementById(BTN_CONTAINER_ID).remove();
    }

    // Tìm vị trí thích hợp trên giao diện YouTube (dưới tiêu đề, cạnh nút Like/Share hoặc ở phần owner)
    var target = document.querySelector('#actions #top-level-buttons-computed') ||
                 document.querySelector('#actions-inner') ||
                 document.querySelector('#above-the-fold #owner') ||
                 document.querySelector('#meta-contents') ||
                 document.querySelector('ytd-watch-metadata');

    if (!target) return;

    var wrap = document.createElement('div');
    wrap.id = BTN_CONTAINER_ID;
    wrap.setAttribute('data-vid', vid);
    wrap.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin:8px 0;padding:4px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:12px;backdrop-filter:blur(8px);';

    // 1. Nút "Luyện trên Studio"
    var btnOpen = document.createElement('button');
    btnOpen.type = 'button';
    btnOpen.innerHTML = '<span style="font-size:15px">🇫🇷</span> <span style="font-weight:700">Luyện Shadowing</span>';
    btnOpen.title = 'Mở video này trên French Shadowing Studio với phụ đề word-level timestamp chuẩn xác';
    btnOpen.style.cssText = 'display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:none;background:linear-gradient(135deg, #e11d48, #2563eb);color:#fff;font-size:13px;cursor:pointer;transition:transform 0.15s, opacity 0.15s;';
    btnOpen.onmouseover = function () { btnOpen.style.opacity = '0.9'; };
    btnOpen.onmouseout = function () { btnOpen.style.opacity = '1'; };

    // 2. Nút "Tải .json3"
    var btnDl = document.createElement('button');
    btnDl.type = 'button';
    btnDl.innerHTML = '<span style="font-size:13px">⬇️</span> <span style="font-weight:600">Tải .json3</span>';
    btnDl.title = 'Tải file phụ đề JSON3 (chứa timestamp chính xác từng từ) về máy';
    btnDl.style.cssText = 'display:inline-flex;align-items:center;gap:5px;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#e2e8f0;font-size:13px;cursor:pointer;transition:background 0.15s;';
    btnDl.onmouseover = function () { btnDl.style.background = 'rgba(255,255,255,0.15)'; };
    btnDl.onmouseout = function () { btnDl.style.background = 'rgba(255,255,255,0.08)'; };

    // Xử lý sự kiện click
    btnOpen.addEventListener('click', async function () {
      btnOpen.disabled = true;
      btnOpen.innerHTML = '⏳ <span>Đang lấy phụ đề...</span>';
      showToast('Đang tải phụ đề tiếng Pháp dạng JSON3...');

      try {
        var info = await getCaptionTracks(vid);
        var chosen = selectFrenchTrack(info.tracks);
        if (!chosen) {
          throw new Error('Video này không có phụ đề tiếng Pháp nào (kể cả phụ đề tự động dịch).');
        }

        var json3 = await fetchJson3(chosen.track.baseUrl);
        var pr = info.playerResponse;
        var payload = {
          videoId: vid,
          title: (pr && pr.videoDetails && pr.videoDetails.title) || document.title.replace(' - YouTube', ''),
          raw: json3,
          channelTitle: (pr && pr.videoDetails && pr.videoDetails.author) || '',
          duration: (pr && pr.videoDetails && parseInt(pr.videoDetails.lengthSeconds, 10)) || 0
        };

        // Lưu vào bộ nhớ Userscript để tab mới tự đọc
        GM_setValue('PENDING_SHADOWING_IMPORT', payload);

        // Mở French Shadowing Studio trong tab mới
        var studioTab = window.open(STUDIO_URL, '_blank');

        // Gửi qua postMessage dự phòng trong 5s đầu
        var tries = 0;
        var timer = setInterval(function () {
          tries++;
          if (studioTab && !studioTab.closed) {
            try {
              studioTab.postMessage({ type: 'SHADOWING_IMPORT', payload: payload }, '*');
            } catch (e) {}
          }
          if (tries >= 20) clearInterval(timer);
        }, 300);

        showToast('✓ Đã nạp thành công! Đang chuyển sang Studio...');
      } catch (err) {
        showToast('❌ ' + err.message, true);
        console.error(err);
      } finally {
        btnOpen.disabled = false;
        btnOpen.innerHTML = '<span style="font-size:15px">🇫🇷</span> <span style="font-weight:700">Luyện Shadowing</span>';
      }
    });

    btnDl.addEventListener('click', async function () {
      btnDl.disabled = true;
      btnDl.innerHTML = '⏳ <span>Đang tải...</span>';
      showToast('Đang tải file .json3 từ YouTube...');

      try {
        var info = await getCaptionTracks(vid);
        var chosen = selectFrenchTrack(info.tracks);
        if (!chosen) {
          throw new Error('Video này không có phụ đề tiếng Pháp nào.');
        }

        var json3 = await fetchJson3(chosen.track.baseUrl);
        triggerDownload(vid + '.fr.json3', JSON.stringify(json3, null, 2));
        showToast('✓ Đã tải file ' + vid + '.fr.json3 thành công!');
      } catch (err) {
        showToast('❌ ' + err.message, true);
        console.error(err);
      } finally {
        btnDl.disabled = false;
        btnDl.innerHTML = '<span style="font-size:13px">⬇️</span> <span style="font-weight:600">Tải .json3</span>';
      }
    });

    wrap.appendChild(btnOpen);
    wrap.appendChild(btnDl);

    // Chèn vào vị trí thích hợp
    if (target.firstChild) {
      target.insertBefore(wrap, target.firstChild);
    } else {
      target.appendChild(wrap);
    }
  }

  // Lắng nghe thay đổi trang của YouTube (SPA navigation)
  window.addEventListener('yt-navigate-finish', injectToolbar);
  window.addEventListener('load', injectToolbar);
  setInterval(function () {
    var vid = getVideoId();
    if (vid && !document.getElementById(BTN_CONTAINER_ID)) {
      injectToolbar();
    }
  }, 1200);

})();
