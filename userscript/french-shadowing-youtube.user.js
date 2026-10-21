// ==UserScript==
// @name         French Shadowing Studio - Trợ thủ YouTube (Word Timestamps & 1-Click Import)
// @namespace    https://french-shadowing-studio.vercel.app/
// @version      1.1.0
// @description  Tự động trích xuất phụ đề tiếng Pháp dạng JSON3 (chuẩn word-level timestamp) trên YouTube: Tải file .json3 về máy hoặc 1-click chuyển video sang French Shadowing Studio để luyện tập.
// @author       French Shadowing Studio
// @match        *://*.youtube.com/*
// @match        *://french-shadowing-studio.vercel.app/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  console.log('[French Shadowing Studio] Userscript đang chạy trên:', location.href);
  var STUDIO_URL = 'https://french-shadowing-studio.vercel.app/';

  // =========================================================================
  // 1. NẾU ĐANG Ở TRANG FRENCH SHADOWING STUDIO: NHẬN DỮ LIỆU TỪ YOUTUBE CHUYỂN QUA
  // =========================================================================
  if (location.host.includes('french-shadowing-studio') || location.host.includes('localhost')) {
    function checkPendingImport() {
      try {
        var pending = GM_getValue('PENDING_SHADOWING_IMPORT', null);
        if (pending && pending.videoId) {
          console.log('[French Shadowing Studio] Phát hiện gói import từ YouTube:', pending.videoId);
          GM_deleteValue('PENDING_SHADOWING_IMPORT');
          var maxWait = 50;
          var timer = setInterval(function () {
            maxWait--;
            if (document.getElementById('input-youtube-url') || maxWait <= 0) {
              clearInterval(timer);
              window.postMessage({ type: 'SHADOWING_IMPORT', payload: pending }, '*');
            }
          }, 100);
        }
      } catch (e) {
        console.error('[French Shadowing Studio] Lỗi nhận import:', e);
      }
    }
    checkPendingImport();
    window.addEventListener('focus', checkPendingImport);
    return;
  }

  // =========================================================================
  // 2. NẾU ĐANG Ở TRANG YOUTUBE: THÊM NÚT VÀO GIAO DIỆN
  // =========================================================================
  var INLINE_BAR_ID = 'fss-yt-inline-toolbar';
  var FLOAT_BAR_ID = 'fss-yt-float-pill';

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
    if (!pr && window.ytInitialPlayerResponse) pr = window.ytInitialPlayerResponse;
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

    var manual = tracks.find(function (t) {
      return (t.languageCode === 'fr' || (t.languageCode && t.languageCode.startsWith('fr-'))) && t.kind !== 'asr';
    });
    if (manual) return { track: manual, type: 'manual' };

    var asr = tracks.find(function (t) {
      return (t.languageCode === 'fr' || (t.languageCode && t.languageCode.startsWith('fr-'))) && t.kind === 'asr';
    });
    if (asr) return { track: asr, type: 'asr' };

    var anyFr = tracks.find(function (t) {
      return (t.languageCode || '').toLowerCase().startsWith('fr');
    });
    if (anyFr) return { track: anyFr, type: 'fr' };

    if (tracks[0] && tracks[0].baseUrl) {
      var transTrack = Object.assign({}, tracks[0]);
      transTrack.baseUrl = tracks[0].baseUrl + '&tlang=fr';
      transTrack.name = { simpleText: 'Français (Dịch tự động)' };
      return { track: transTrack, type: 'auto-translate' };
    }
    return null;
  }

  async function fetchJson3(baseUrl) {
    var url = baseUrl;
    if (!url.includes('fmt=json3')) {
      url += (url.includes('?') ? '&' : '?') + 'fmt=json3';
    }
    var res = await fetch(url);
    if (!res.ok) throw new Error('Không thể tải phụ đề từ YouTube (HTTP ' + res.status + ')');
    return await res.json();
  }

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

  function showToast(msg, isError) {
    var toast = document.getElementById('fss-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'fss-toast';
      toast.style.cssText = 'position:fixed;bottom:80px;right:24px;z-index:99999999;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);transition:all 0.3s;pointer-events:none;color:#fff;';
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

  // Hành động Luyện tập
  async function handlePractice(vid, btnEl) {
    var origHtml = btnEl.innerHTML;
    btnEl.innerHTML = '⏳ Đang nạp...';
    showToast('Đang trích xuất phụ đề tiếng Pháp dạng JSON3...');

    try {
      var info = await getCaptionTracks(vid);
      var chosen = selectFrenchTrack(info.tracks);
      if (!chosen) throw new Error('Video không có phụ đề tiếng Pháp (kể cả tự động dịch).');

      var json3 = await fetchJson3(chosen.track.baseUrl);
      var pr = info.playerResponse;
      var payload = {
        videoId: vid,
        title: (pr && pr.videoDetails && pr.videoDetails.title) || document.title.replace(' - YouTube', ''),
        raw: json3,
        channelTitle: (pr && pr.videoDetails && pr.videoDetails.author) || '',
        duration: (pr && pr.videoDetails && parseInt(pr.videoDetails.lengthSeconds, 10)) || 0
      };

      GM_setValue('PENDING_SHADOWING_IMPORT', payload);
      var studioTab = window.open(STUDIO_URL, '_blank');

      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (studioTab && !studioTab.closed) {
          try { studioTab.postMessage({ type: 'SHADOWING_IMPORT', payload: payload }, '*'); } catch (e) {}
        }
        if (tries >= 20) clearInterval(timer);
      }, 300);

      showToast('✓ Đã nạp thành công! Đang chuyển sang Studio...');
    } catch (err) {
      showToast('❌ ' + err.message, true);
      console.error(err);
    } finally {
      btnEl.innerHTML = origHtml;
    }
  }

  // Hành động Tải file .json3
  async function handleDownload(vid, btnEl) {
    var origHtml = btnEl.innerHTML;
    btnEl.innerHTML = '⏳ Đang tải...';
    showToast('Đang tải file .json3 từ YouTube...');

    try {
      var info = await getCaptionTracks(vid);
      var chosen = selectFrenchTrack(info.tracks);
      if (!chosen) throw new Error('Video không có phụ đề tiếng Pháp.');

      var json3 = await fetchJson3(chosen.track.baseUrl);
      triggerDownload(vid + '.fr.json3', JSON.stringify(json3, null, 2));
      showToast('✓ Đã tải file ' + vid + '.fr.json3 thành công!');
    } catch (err) {
      showToast('❌ ' + err.message, true);
      console.error(err);
    } finally {
      btnEl.innerHTML = origHtml;
    }
  }

  // 1. Tạo thanh công cụ nổi (Floating Pill) ở góc dưới phải màn hình (KHÔNG BAO GIỜ BỊ ẨN)
  function injectFloatingPill(vid) {
    if (document.getElementById(FLOAT_BAR_ID)) {
      var old = document.getElementById(FLOAT_BAR_ID).getAttribute('data-vid');
      if (old === vid) return;
      document.getElementById(FLOAT_BAR_ID).remove();
    }

    var pill = document.createElement('div');
    pill.id = FLOAT_BAR_ID;
    pill.setAttribute('data-vid', vid);
    pill.style.cssText = 'position:fixed;bottom:26px;right:26px;z-index:9999999;display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(15,23,42,0.92);border:1.5px solid rgba(59,130,246,0.65);border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,0.65);backdrop-filter:blur(10px);font-family:system-ui,-apple-system,sans-serif;animation:fssFadeIn 0.3s ease;';

    pill.innerHTML = `
      <style>
        @keyframes fssFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fss-btn-glow:hover { transform: scale(1.03); filter: brightness(1.1); }
        .fss-btn-glow:active { transform: scale(0.97); }
      </style>
      <button type="button" id="fss-float-practice" class="fss-btn-glow" style="display:flex;align-items:center;gap:6px;padding:8px 15px;border-radius:999px;border:none;background:linear-gradient(135deg, #e11d48, #2563eb);color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s;">
        <span>🇫🇷</span><span>Luyện Shadowing</span>
      </button>
      <button type="button" id="fss-float-dl" class="fss-btn-glow" style="display:flex;align-items:center;gap:5px;padding:8px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.22);background:rgba(255,255,255,0.1);color:#e2e8f0;font-size:12.5px;font-weight:600;cursor:pointer;transition:all 0.15s;">
        <span>⬇️</span><span>.json3</span>
      </button>
    `;

    document.body.appendChild(pill);

    pill.querySelector('#fss-float-practice').addEventListener('click', function () {
      handlePractice(vid, this);
    });
    pill.querySelector('#fss-float-dl').addEventListener('click', function () {
      handleDownload(vid, this);
    });
  }

  // 2. Chèn thanh công cụ inline ngay cạnh tiêu đề/nút kênh dưới video
  function injectInlineToolbar(vid) {
    if (document.getElementById(INLINE_BAR_ID)) {
      var old = document.getElementById(INLINE_BAR_ID).getAttribute('data-vid');
      if (old === vid) return;
      document.getElementById(INLINE_BAR_ID).remove();
    }

    var target = document.querySelector('#owner') ||
                 document.querySelector('#top-row') ||
                 document.querySelector('#above-the-fold') ||
                 document.querySelector('#title');

    if (!target) return;

    var bar = document.createElement('div');
    bar.id = INLINE_BAR_ID;
    bar.setAttribute('data-vid', vid);
    bar.style.cssText = 'display:inline-flex;align-items:center;gap:8px;margin:8px 0;padding:5px 8px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);border-radius:12px;backdrop-filter:blur(8px);font-family:system-ui,-apple-system,sans-serif;';

    bar.innerHTML = `
      <button type="button" id="fss-inline-practice" style="display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:none;background:linear-gradient(135deg, #e11d48, #2563eb);color:#fff;font-size:13px;font-weight:700;cursor:pointer;">
        <span>🇫🇷</span><span>Luyện Shadowing</span>
      </button>
      <button type="button" id="fss-inline-dl" style="display:flex;align-items:center;gap:5px;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#e2e8f0;font-size:13px;font-weight:600;cursor:pointer;">
        <span>⬇️</span><span>Tải .json3</span>
      </button>
    `;

    if (target.nextSibling) {
      target.parentNode.insertBefore(bar, target.nextSibling);
    } else {
      target.appendChild(bar);
    }

    bar.querySelector('#fss-inline-practice').addEventListener('click', function () {
      handlePractice(vid, this);
    });
    bar.querySelector('#fss-inline-dl').addEventListener('click', function () {
      handleDownload(vid, this);
    });
  }

  function renderAll() {
    var vid = getVideoId();
    if (!vid) {
      var fl = document.getElementById(FLOAT_BAR_ID);
      if (fl) fl.remove();
      var inl = document.getElementById(INLINE_BAR_ID);
      if (inl) inl.remove();
      return;
    }
    injectFloatingPill(vid);
    injectInlineToolbar(vid);
  }

  // Lắng nghe thay đổi trang của YouTube
  window.addEventListener('yt-navigate-finish', renderAll);
  window.addEventListener('load', renderAll);
  document.addEventListener('DOMContentLoaded', renderAll);
  setInterval(renderAll, 1200);

})();
