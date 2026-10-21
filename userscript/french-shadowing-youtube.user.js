// ==UserScript==
// @name         French Shadowing Studio - Trợ thủ YouTube (Word Timestamps & 1-Click Import)
// @namespace    https://french-shadowing-studio.vercel.app/
// @version      1.3.6
// @description  Tự động trích xuất phụ đề tiếng Pháp dạng JSON3 trên YouTube: Tải file .json3 về máy hoặc 1-click chuyển video sang French Shadowing Studio.
// @author       French Shadowing Studio
// @downloadURL  https://french-shadowing-studio.vercel.app/userscript/french-shadowing-youtube.user.js
// @updateURL    https://french-shadowing-studio.vercel.app/userscript/french-shadowing-youtube.user.js
// @match        *://*.youtube.com/*
// @match        *://youtube.com/*
// @match        *://m.youtube.com/*
// @match        *://*.youtube.ca/*
// @match        *://youtube.ca/*
// @match        *://*.youtube.fr/*
// @match        *://youtube.fr/*
// @match        *://*.youtube.vn/*
// @match        *://youtube.vn/*
// @match        *://*.youtube.be/*
// @match        *://youtube.be/*
// @match        *://youtu.be/*
// @include      *://*.youtube.*/*
// @include      *://youtube.*/*
// @include      *://m.youtube.*/*
// @include      *://m.youtube.com/*
// @include      *://youtu.be/*
// @match        *://french-shadowing-studio.vercel.app/*
// @match        *://localhost/*
// @include      *://french-shadowing-studio.vercel.app/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  var STUDIO_URL = 'https://french-shadowing-studio.vercel.app/';
  var uWin = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

  console.log('[French Shadowing Studio] Userscript v1.3.6 active on:', location.href);

  // Xử lý dữ liệu dự phòng an toàn cho localStorage nếu thiếu GM_setValue
  var _setValue = (typeof GM_setValue !== 'undefined') ? GM_setValue : function (key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  };
  var _getValue = (typeof GM_getValue !== 'undefined') ? GM_getValue : function (key, def) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch (e) { return def; }
  };
  var _deleteValue = (typeof GM_deleteValue !== 'undefined') ? GM_deleteValue : function (key) {
    try { localStorage.removeItem(key); } catch (e) {}
  };

  // =========================================================================
  // 1. NẾU ĐANG Ở TRANG FRENCH SHADOWING STUDIO: NHẬN DỮ LIỆU TỪ YOUTUBE
  // =========================================================================
  if (location.host.includes('french-shadowing-studio') || location.host.includes('localhost')) {
    function checkPendingImport() {
      try {
        var pending = _getValue('PENDING_SHADOWING_IMPORT', null);
        if (pending && pending.videoId) {
          console.log('[French Shadowing Studio] Phát hiện gói import từ YouTube:', pending.videoId);
          _deleteValue('PENDING_SHADOWING_IMPORT');
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
  // 2. NẾU ĐANG Ở TRANG YOUTUBE (DESKTOP & MOBILE WEB): THÊM NÚT VÀO GIAO DIỆN
  // (Lưu ý: YouTube áp dụng CSP Trusted Types nghiêm ngặt, TUYỆT ĐỐI không dùng .innerHTML)
  // =========================================================================
  var INLINE_BAR_ID = 'fss-yt-inline-toolbar';
  var FLOAT_BAR_ID = 'fss-yt-float-pill';

  function getVideoId() {
    if (window.location.hostname === 'youtu.be') {
      var shortMatch = window.location.pathname.match(/^\/([a-zA-Z0-9_-]{11})/);
      if (shortMatch) return shortMatch[1];
    }
    var urlParams = new URLSearchParams(window.location.search);
    var vid = urlParams.get('v');
    if (vid && vid.length === 11) return vid;
    var shortsMatch = window.location.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    var embedMatch = window.location.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    return embedMatch ? embedMatch[1] : null;
  }

  async function getCaptionTracks(videoId) {
    var pr = null;
    var player = document.getElementById('movie_player');
    if (player && typeof player.getPlayerResponse === 'function') {
      try { pr = player.getPlayerResponse(); } catch (e) {}
    }
    if (!pr && uWin.ytInitialPlayerResponse) {
      pr = uWin.ytInitialPlayerResponse;
    }
    if (!pr && window.ytInitialPlayerResponse) {
      pr = window.ytInitialPlayerResponse;
    }
    if (!pr || (pr.videoDetails && pr.videoDetails.videoId !== videoId)) {
      try {
        var currentOrigin = location.origin.includes('youtube.') ? location.origin : 'https://www.youtube.com';
        var resp = await fetch(currentOrigin + '/watch?v=' + videoId);
        var html = await resp.text();
        var match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
        if (match) {
          try {
            pr = JSON.parse(match[1]);
          } catch (jsonErr) {
            var lastIdx = match[1].lastIndexOf('}');
            if (lastIdx !== -1) {
              pr = JSON.parse(match[1].substring(0, lastIdx + 1));
            }
          }
        }
      } catch (e) {
        console.warn('[French Shadowing Studio] Không thể fetch player response:', e);
      }
    }

    var tracks = (pr && pr.captions && pr.captions.playerCaptionsTracklistRenderer && pr.captions.playerCaptionsTracklistRenderer.captionTracks) || [];
    return { tracks: tracks, playerResponse: pr };
  }

  function selectFrenchTrack(tracks) {
    if (!tracks || !tracks.length) return null;

    var asr = tracks.find(function (t) {
      return (t.languageCode === 'fr' || (t.languageCode && t.languageCode.startsWith('fr-'))) && t.kind === 'asr';
    });

    var manual = tracks.find(function (t) {
      return (t.languageCode === 'fr' || (t.languageCode && t.languageCode.startsWith('fr-'))) && t.kind !== 'asr';
    });

    if (asr) {
      return { primaryTrack: asr, manualTrack: manual, type: 'asr' };
    }
    if (manual) {
      return { primaryTrack: manual, manualTrack: null, type: 'manual' };
    }

    var anyFr = tracks.find(function (t) {
      return (t.languageCode || '').toLowerCase().startsWith('fr');
    });
    if (anyFr) return { primaryTrack: anyFr, manualTrack: null, type: 'fr' };

    if (tracks[0] && tracks[0].baseUrl) {
      var transTrack = Object.assign({}, tracks[0]);
      transTrack.baseUrl = tracks[0].baseUrl + '&tlang=fr';
      transTrack.name = { simpleText: 'Français (Dịch tự động)' };
      return { primaryTrack: transTrack, manualTrack: null, type: 'auto-translate' };
    }
    return null;
  }

  async function fetchJson3(baseUrl) {
    var url = baseUrl;
    if (!url.includes('fmt=json3')) {
      url += (url.includes('?') ? '&' : '?') + 'fmt=json3';
    }
    try {
      var res = await fetch(url);
      if (res.ok) {
        var textData = await res.text();
        if (textData && textData.trim().startsWith('{')) {
          return JSON.parse(textData);
        }
      }
    } catch (e) {}

    try {
      var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
      var fallbackRes = await fetch(proxyUrl);
      if (fallbackRes.ok) {
        var fallbackText = await fallbackRes.text();
        if (fallbackText && fallbackText.trim().startsWith('{')) {
          return JSON.parse(fallbackText);
        }
      }
    } catch (e) {}

    throw new Error('Không thể tải phụ đề JSON3 từ YouTube.');
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
      toast.style.cssText = [
        'position: fixed',
        'bottom: 86px',
        'right: 26px',
        'z-index: 2147483647',
        'padding: 12px 20px',
        'border-radius: 12px',
        'font-size: 14px',
        'font-weight: 600',
        'font-family: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
        'box-shadow: 0 10px 30px rgba(0,0,0,0.65)',
        'transition: all 0.25s ease',
        'pointer-events: none',
        'color: #ffffff'
      ].join(' !important;') + ' !important;';
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

  function setBtnLoading(btn, icon, text) {
    if (!btn._orig) {
      var ico = btn.querySelector('.fss-ico');
      var txt = btn.querySelector('.fss-txt');
      btn._orig = {
        icon: ico ? ico.textContent : '',
        text: txt ? txt.textContent : ''
      };
    }
    var icoEl = btn.querySelector('.fss-ico');
    var txtEl = btn.querySelector('.fss-txt');
    if (icoEl) icoEl.textContent = icon;
    if (txtEl) txtEl.textContent = text;
    btn.disabled = true;
    btn.style.opacity = '0.7';
    btn.style.cursor = 'wait';
  }

  function resetBtnLoading(btn) {
    if (btn._orig) {
      var icoEl = btn.querySelector('.fss-ico');
      var txtEl = btn.querySelector('.fss-txt');
      if (icoEl) icoEl.textContent = btn._orig.icon;
      if (txtEl) txtEl.textContent = btn._orig.text;
    }
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  }

  async function handlePractice(vid, btnEl) {
    // Mở tab Studio ngay khi người dùng click để bảo toàn User Gesture (tránh bị trình duyệt mobile/desktop chặn popup)
    var studioTab = null;
    try {
      studioTab = window.open(STUDIO_URL, '_blank');
    } catch (e) {}

    setBtnLoading(btnEl, '⏳', 'Đang nạp...');
    showToast('Đang trích xuất phụ đề tiếng Pháp dạng JSON3...');

    try {
      var info = await getCaptionTracks(vid);
      var chosen = selectFrenchTrack(info.tracks);
      if (!chosen) throw new Error('Video này không có phụ đề tiếng Pháp.');

      var json3 = await fetchJson3(chosen.primaryTrack.baseUrl);
      var manualJson3 = null;
      if (chosen.manualTrack && chosen.manualTrack.baseUrl) {
        try { manualJson3 = await fetchJson3(chosen.manualTrack.baseUrl); } catch (e) {}
      }

      var pr = info.playerResponse;
      var payload = {
        videoId: vid,
        title: (pr && pr.videoDetails && pr.videoDetails.title) || document.title.replace(' - YouTube', ''),
        raw: json3,
        manual: manualJson3 ? { raw: manualJson3 } : null,
        channelTitle: (pr && pr.videoDetails && pr.videoDetails.author) || '',
        duration: (pr && pr.videoDetails && parseInt(pr.videoDetails.lengthSeconds, 10)) || 0
      };

      _setValue('PENDING_SHADOWING_IMPORT', payload);

      if (!studioTab || studioTab.closed) {
        window.location.href = STUDIO_URL;
        return;
      }

      var tries = 0;
      var timer = setInterval(function () {
        tries++;
        if (studioTab && !studioTab.closed) {
          try { studioTab.postMessage({ type: 'SHADOWING_IMPORT', payload: payload }, '*'); } catch (e) {}
        }
        if (tries >= 25) clearInterval(timer);
      }, 250);

      showToast('✓ Đã nạp thành công! Đang chuyển sang Studio...');
    } catch (err) {
      if (studioTab && !studioTab.closed) {
        try { studioTab.close(); } catch (e) {}
      }
      showToast('❌ ' + err.message, true);
      console.error('[French Shadowing Studio]', err);
    } finally {
      resetBtnLoading(btnEl);
    }
  }

  async function handleDownload(vid, btnEl) {
    setBtnLoading(btnEl, '⏳', 'Đang tải...');
    showToast('Đang tải file .json3 từ YouTube...');

    try {
      var info = await getCaptionTracks(vid);
      var chosen = selectFrenchTrack(info.tracks);
      if (!chosen) throw new Error('Video không có phụ đề tiếng Pháp.');

      var json3 = await fetchJson3(chosen.primaryTrack.baseUrl);
      triggerDownload(vid + '.fr.json3', JSON.stringify(json3, null, 2));
      showToast('✓ Đã tải file ' + vid + '.fr.json3 thành công!');
    } catch (err) {
      showToast('❌ ' + err.message, true);
      console.error('[French Shadowing Studio]', err);
    } finally {
      resetBtnLoading(btnEl);
    }
  }

  function createButton(id, label, icon, isPrimary, onClick) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = id;

    var iconSpan = document.createElement('span');
    iconSpan.className = 'fss-ico';
    iconSpan.textContent = icon;
    iconSpan.style.display = 'inline-block';
    iconSpan.style.lineHeight = '1';

    var textSpan = document.createElement('span');
    textSpan.className = 'fss-txt';
    textSpan.textContent = label;
    textSpan.style.display = 'inline-block';
    textSpan.style.lineHeight = '1';

    btn.appendChild(iconSpan);
    btn.appendChild(textSpan);

    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.gap = '6px';
    btn.style.cursor = 'pointer';
    btn.style.fontFamily = 'inherit';
    btn.style.border = 'none';
    btn.style.outline = 'none';
    btn.style.whiteSpace = 'nowrap';
    btn.style.userSelect = 'none';
    btn.style.transition = 'transform 0.15s ease, filter 0.15s ease, background 0.15s ease, box-shadow 0.15s ease';

    if (isPrimary) {
      btn.style.padding = '9px 18px';
      btn.style.borderRadius = '9999px';
      btn.style.background = 'linear-gradient(135deg, #e11d48, #2563eb)';
      btn.style.color = '#ffffff';
      btn.style.fontSize = '13.5px';
      btn.style.fontWeight = '700';
      btn.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.45)';
    } else {
      btn.style.padding = '9px 15px';
      btn.style.borderRadius = '9999px';
      btn.style.background = 'rgba(255, 255, 255, 0.12)';
      btn.style.border = '1px solid rgba(255, 255, 255, 0.28)';
      btn.style.color = '#f8fafc';
      btn.style.fontSize = '13px';
      btn.style.fontWeight = '600';
      btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    }

    btn.addEventListener('mouseenter', function () {
      btn.style.transform = 'translateY(-1px) scale(1.03)';
      btn.style.filter = 'brightness(1.15)';
    });
    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'translateY(0) scale(1)';
      btn.style.filter = 'brightness(1)';
    });
    btn.addEventListener('mousedown', function () {
      btn.style.transform = 'scale(0.97)';
    });
    btn.addEventListener('mouseup', function () {
      btn.style.transform = 'scale(1.03)';
    });

    btn.addEventListener('click', onClick);
    return btn;
  }

  function injectFloatingPill(vid) {
    var existing = document.getElementById(FLOAT_BAR_ID);
    if (existing) {
      if (existing.getAttribute('data-vid') === vid) return;
      existing.remove();
    }

    var pill = document.createElement('div');
    pill.id = FLOAT_BAR_ID;
    pill.setAttribute('data-vid', vid);
    pill.style.cssText = [
      'position: fixed',
      'bottom: 26px',
      'right: 26px',
      'z-index: 2147483647',
      'display: flex',
      'align-items: center',
      'gap: 8px',
      'padding: 7px 12px',
      'background: rgba(15, 23, 42, 0.95)',
      'border: 1.5px solid rgba(59, 130, 246, 0.75)',
      'border-radius: 9999px',
      'box-shadow: 0 10px 35px rgba(0, 0, 0, 0.8)',
      'backdrop-filter: blur(12px)',
      '-webkit-backdrop-filter: blur(12px)',
      'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(' !important;') + ' !important;';

    var practiceBtn = createButton('fss-float-practice', 'Luyện Shadowing', '🇫🇷', true, function () {
      handlePractice(vid, this);
    });

    var dlBtn = createButton('fss-float-dl', '.json3', '⬇️', false, function () {
      handleDownload(vid, this);
    });

    pill.appendChild(practiceBtn);
    pill.appendChild(dlBtn);

    var container = document.fullscreenElement || document.body;
    if (container) {
      container.appendChild(pill);
    }
  }

  function injectInlineToolbar(vid) {
    var existing = document.getElementById(INLINE_BAR_ID);
    if (existing) {
      if (existing.getAttribute('data-vid') === vid) return;
      existing.remove();
    }

    // Hỗ trợ cả Desktop (#owner, #top-row, #actions-inner...) lẫn Mobile Web (ytm-slim-owner-renderer, .slim-video-metadata-header)
    var target = document.querySelector('#owner') ||
                 document.querySelector('#top-row') ||
                 document.querySelector('#actions-inner') ||
                 document.querySelector('#above-the-fold') ||
                 document.querySelector('#title') ||
                 document.querySelector('ytm-slim-owner-renderer') ||
                 document.querySelector('.slim-video-metadata-header') ||
                 document.querySelector('.slim-video-information-holder');

    if (!target) return;

    var bar = document.createElement('div');
    bar.id = INLINE_BAR_ID;
    bar.setAttribute('data-vid', vid);
    bar.style.cssText = [
      'display: inline-flex',
      'align-items: center',
      'gap: 8px',
      'margin: 8px 0',
      'padding: 6px 10px',
      'background: rgba(255, 255, 255, 0.08)',
      'border: 1px solid rgba(255, 255, 255, 0.2)',
      'border-radius: 14px',
      'backdrop-filter: blur(8px)',
      '-webkit-backdrop-filter: blur(8px)',
      'font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    ].join(' !important;') + ' !important;';

    var practiceBtn = createButton('fss-inline-practice', 'Luyện Shadowing', '🇫🇷', true, function () {
      handlePractice(vid, this);
    });

    var dlBtn = createButton('fss-inline-dl', 'Tải .json3', '⬇️', false, function () {
      handleDownload(vid, this);
    });

    bar.appendChild(practiceBtn);
    bar.appendChild(dlBtn);

    if (target.nextSibling) {
      target.parentNode.insertBefore(bar, target.nextSibling);
    } else {
      target.appendChild(bar);
    }
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

  // Lắng nghe thay đổi trang của YouTube (Desktop Polymer & Mobile Web)
  window.addEventListener('yt-navigate-finish', renderAll);
  window.addEventListener('yt-page-data-updated', renderAll);
  window.addEventListener('load', renderAll);
  window.addEventListener('popstate', renderAll);
  document.addEventListener('DOMContentLoaded', renderAll);
  setInterval(renderAll, 1000);

  renderAll();

})();
