
    function escHtml(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    const escapeHtml = escHtml;
    window.escHtml = escHtml;
    window.escapeHtml = escHtml;

    const SVG_ICONS = {
      "align-left": `<line x1="21" x2="3" y1="6"/><line x1="15" x2="3" y1="12"/><line x1="17" x2="3" y1="18"/>`,
      "alert-circle": `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
      "arrow-down-up": `<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>`,
      "arrow-left": `<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>`,
      "arrow-left-to-line": `<path d="m9 6-6 6 6 6"/><path d="M3 12h14"/><path d="M21 19V5"/>`,
      "check-circle": `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`,
      "chevron-left": `<polyline points="15 18 9 12 15 6"/>`,
      "chevron-down": `<polyline points="6 9 12 15 18 9"/>`,
      "keyboard": `<rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/>`,
      "chevron-right": `<polyline points="9 18 15 12 9 6"/>`,
      "copy": `<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>`,
      "eye": `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>`,
      "eye-off": `<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>`,
      "history": `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><polyline points="12 7 12 12 15 15"/>`,
      "languages": `<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>`,
      "mic": `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>`,
      "pause": `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`,
      "pause-circle": `<circle cx="12" cy="12" r="10"/><line x1="10" x2="10" y1="15" y2="9"/><line x1="14" x2="14" y1="15" y2="9"/>`,
      "play": `<polygon points="6 3 20 12 6 21 6 3"/>`,
      "rotate-ccw": `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>`,
      "rotate-ccw-5": `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M10 16h4"/><path d="M10 13h4v-3h-4"/>`,
      "rotate-cw-5": `<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.99 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M10 16h4"/><path d="M10 13h4v-3h-4"/>`,
      "search": `<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`,
      "sparkles": `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/>`,
      "timer": `<line x1="10" x2="14" y1="2" y2="2" stroke="currentColor" stroke-width="2"/><line x1="12" x2="15" y1="14" y2="11" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14" r="8" stroke="currentColor" stroke-width="2"/>`,
      "trash-2": `<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>`,
      "upload-cloud": `<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/>`,
      "volume-2": `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>`,
      "youtube": `<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><polygon points="10 15 15 12 10 9 10 15"/>`,
      "laugh": `<circle cx="12" cy="12" r="10"/><path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>`,
      "presentation": `<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/>`,
      "brain": `<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/>`,
      "trending-up": `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`,
      "clapperboard": `<path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>`,
      "user-growth": `<circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 7l3-3m0 0h-2.5m2.5 0v2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
      "layers": `<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>`,
      "x": `<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`
    };

    Object.assign(SVG_ICONS, {
      "bookmark": `<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>`,
      "download": `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>`,
      "share-2": `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>`,
      "case-sensitive": `<path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16"/><path d="M22 9v7"/><path d="M3.304 13h6.392"/><circle cx="18.5" cy="12.5" r="3.5"/>`,
      "pencil": `<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>`,
      "file-text": `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>`,
      "cloud": `<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>`,
      "refresh-cw": `<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>`,
      "log-out": `<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>`,
      "save": `<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/><path d="M7 3v4a1 1 0 0 0 1 1h7"/>`
    });

    window.lucide = {
      createIcons: function() {
        document.querySelectorAll("[data-lucide]").forEach((el) => {
          const iconName = el.getAttribute("data-lucide");
          const innerSvg = SVG_ICONS[iconName];
          if (!innerSvg) return;
          const classList = el.getAttribute("class") || "w-4 h-4";
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.setAttribute("fill", "none");
          svg.setAttribute("stroke", "currentColor");
          svg.setAttribute("stroke-width", "2");
          svg.setAttribute("stroke-linecap", "round");
          svg.setAttribute("stroke-linejoin", "round");
          svg.setAttribute("class", classList);
          svg.setAttribute("data-lucide", iconName);
          if (el.id) svg.id = el.id;
          svg.innerHTML = innerSvg;
          el.replaceWith(svg);
        });
      }
    };

    // ==================== STATE, SETTINGS & STORAGE ====================
    const PREFS_STORAGE_KEY = 'shadowing_app_user_preferences';

    function loadSavedPreferences() {
      try {
        const raw = localStorage.getItem(PREFS_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch(e) {}
      return null;
    }

    const savedPrefs = loadSavedPreferences() || {};

    let categoryStructure = null;
    let videoMetadataMap = {};
    let librarySearchKeyword = '';
    const fileContentCache = new Map();

    let currentVideoId = '';
    let sentences = [];
    let currentSentenceIndex = 0;
    let subtitleFormat = 'srt';
    let searchQuery = '';
    let isRawSubMode = false;
    let currentVideoTitle = '';

    // Expose reactive accessors on window for external modules (TCF Exam, Vocab Practice, etc.)
    try {
      Object.defineProperty(window, 'sentences', {
        get: () => sentences,
        set: (val) => { sentences = val; },
        configurable: true
      });
      Object.defineProperty(window, 'currentVideoId', {
        get: () => currentVideoId,
        set: (val) => { currentVideoId = val; },
        configurable: true
      });
      Object.defineProperty(window, 'currentVideoTitle', {
        get: () => currentVideoTitle,
        set: (val) => { currentVideoTitle = val; },
        configurable: true
      });
      Object.defineProperty(window, 'ytPlayer', {
        get: () => ytPlayer,
        set: (val) => { ytPlayer = val; },
        configurable: true
      });
      Object.defineProperty(window, 'isPlayerReady', {
        get: () => isPlayerReady,
        set: (val) => { isPlayerReady = val; },
        configurable: true
      });
      Object.defineProperty(window, 'isTextMode', {
        get: () => isTextMode,
        set: (val) => { isTextMode = val; },
        configurable: true
      });
    } catch (e) {
      console.warn('Cannot define window property accessors:', e);
    }
    window.getCurrentSentences = () => sentences;
    window.getCurrentVideoId = () => currentVideoId;
    window.getCurrentVideoTitle = () => currentVideoTitle;
    window.getYtPlayer = () => ytPlayer;

    // ==================== UNIVERSAL FRENCH AUDIO ENGINE ====================
    // Dual-strategy: Web Speech API (with anti-GC reference & Chromium un-pause) + Google TTS HTML5 Audio failsafe
    window._activeAudioPlayer = null;
    window._activeSpeechUtterance = null;
    window._cachedFrenchVoices = [];

    function initFrenchVoices() {
      if (!('speechSynthesis' in window)) return;
      const update = () => {
        try {
          const all = window.speechSynthesis.getVoices() || [];
          window._cachedFrenchVoices = all.filter((v) => /^fr([-_]|$)/i.test(v.lang));
        } catch (e) {}
      };
      update();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = update;
      }
    }
    initFrenchVoices();

    function getBestFrenchVoice() {
      let vs = window._cachedFrenchVoices;
      if (!vs || !vs.length) {
        try {
          vs = ('speechSynthesis' in window) ? (window.speechSynthesis.getVoices() || []).filter((v) => /^fr([-_]|$)/i.test(v.lang)) : [];
        } catch (e) { vs = []; }
      }
      if (!vs.length) return null;
      // Ưu tiên giọng chuẩn Pháp chất lượng cao
      const preferred = vs.find((v) => /fr[-_]FR/i.test(v.lang) && /Google|Thomas|Amélie|Amelie|Audrey|Natural|Denise|Julie|Paul|Hortense/i.test(v.name));
      if (preferred) return preferred;
      const frFR = vs.find((v) => /fr[-_]FR/i.test(v.lang));
      if (frFR) return frFR;
      return vs[0];
    }

    window.playFrenchAudio = function(text, options = {}) {
      const rate = typeof options === 'number' ? options : (options.rate || 0.95);
      const onStart = typeof options === 'object' ? options.onStart : null;
      const onEnd = typeof options === 'object' ? options.onEnd : null;

      if (!text) return Promise.resolve(false);
      const cleanText = String(text).trim().replace(/^['"«“]+|['"»”]+$/g, '');
      if (!cleanText) return Promise.resolve(false);

      // Dừng audio HTML5 trước đó nếu có
      if (window._activeAudioPlayer) {
        try {
          window._activeAudioPlayer.pause();
          window._activeAudioPlayer.currentTime = 0;
        } catch (e) {}
        window._activeAudioPlayer = null;
      }

      // Kênh dự phòng Failsafe: HTML5 Audio qua Google TTS (chuẩn âm thanh Pháp bản xứ 100%)
      const playFallbackAudio = () => {
        return new Promise((resolve) => {
          try {
            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=fr&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
            const audio = new Audio(ttsUrl);
            audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
            window._activeAudioPlayer = audio;

            audio.onplay = () => {
              if (typeof onStart === 'function') onStart();
            };
            audio.onended = () => {
              if (window._activeAudioPlayer === audio) window._activeAudioPlayer = null;
              if (typeof onEnd === 'function') onEnd();
              resolve(true);
            };
            audio.onerror = () => {
              if (window._activeAudioPlayer === audio) window._activeAudioPlayer = null;
              if (typeof onEnd === 'function') onEnd();
              resolve(false);
            };

            const p = audio.play();
            if (p && p.catch) {
              p.catch(() => {
                if (window._activeAudioPlayer === audio) window._activeAudioPlayer = null;
                if (typeof onEnd === 'function') onEnd();
                resolve(false);
              });
            }
          } catch (err) {
            if (typeof onEnd === 'function') onEnd();
            resolve(false);
          }
        });
      };

      if (!('speechSynthesis' in window)) {
        return playFallbackAudio();
      }

      return new Promise((resolve) => {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }

          const utt = new SpeechSynthesisUtterance(cleanText);
          utt.lang = 'fr-FR';
          utt.rate = Math.max(0.5, Math.min(1.5, rate));

          const voice = getBestFrenchVoice();
          if (voice) utt.voice = voice;

          // Giữ reference trên window chống V8 Garbage Collection bug
          window._activeSpeechUtterance = utt;

          let started = false;
          let finished = false;

          const finish = (ok) => {
            if (finished) return;
            finished = true;
            clearTimeout(fallbackTimer);
            window._activeSpeechUtterance = null;
            if (typeof onEnd === 'function') onEnd();
            resolve(ok);
          };

          utt.onstart = () => {
            started = true;
            clearTimeout(fallbackTimer);
            if (typeof onStart === 'function') onStart();
          };

          utt.onend = () => finish(true);
          utt.onerror = (e) => {
            if (e.error === 'interrupted' || e.error === 'canceled') {
              finish(false);
            } else {
              playFallbackAudio().then(resolve);
            }
          };

          // Timer kích hoạt Fallback nếu SpeechSynthesis bị treo hoặc không phản hồi sau 500ms
          const fallbackTimer = setTimeout(() => {
            if (!started && !finished) {
              try { window.speechSynthesis.cancel(); } catch (e) {}
              playFallbackAudio().then(resolve);
            }
          }, 500);

          // Delay nhỏ 35ms tránh race condition với cancel() bất đồng bộ của Chrome
          setTimeout(() => {
            try {
              if (window.speechSynthesis.paused) window.speechSynthesis.resume();
              window.speechSynthesis.speak(utt);
            } catch (err) {
              clearTimeout(fallbackTimer);
              playFallbackAudio().then(resolve);
            }
          }, 35);
        } catch (e) {
          playFallbackAudio().then(resolve);
        }
      });
    };

    // ==================== BACKGROUND VIDEO AUDIO ENGINE ====================
    // Phát âm thanh trích đoạn từ video gốc YouTube (chạy nền, không chiếu video)
    window._bgYtPlayer = null;
    window._bgYtReady = false;
    window._bgYtCurrentVid = '';
    window._bgYtTimer = null;
    window._bgYtActiveOnEnd = null;

    window.stopVideoAudioSegment = function() {
      if (window._bgYtTimer) {
        clearInterval(window._bgYtTimer);
        window._bgYtTimer = null;
      }
      if (window._bgYtActiveOnEnd) {
        try { window._bgYtActiveOnEnd(); } catch (e) {}
        window._bgYtActiveOnEnd = null;
      }
      if (window._bgYtPlayer && window._bgYtReady) {
        try { window._bgYtPlayer.pauseVideo(); } catch (e) {}
      }
    };

    // Quản lý nạp YouTube Iframe API toàn cục an toàn (không ghi đè callback của nhau)
    window._ytApiCallbacks = window._ytApiCallbacks || [];
    window.ensureYouTubeIframeApi = function(cb) {
      if (window.YT && window.YT.Player) {
        if (typeof cb === 'function') cb();
        return;
      }
      if (typeof cb === 'function') {
        window._ytApiCallbacks.push(cb);
      }
      if (!window._ytApiScriptInjected) {
        window._ytApiScriptInjected = true;
        if (!document.getElementById('yt-api-script')) {
          const tag = document.createElement('script');
          tag.id = 'yt-api-script';
          tag.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(tag);
        }
        const prevOnReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function() {
          if (typeof prevOnReady === 'function') {
            try { prevOnReady(); } catch (e) {}
          }
          const cbs = window._ytApiCallbacks.slice();
          window._ytApiCallbacks = [];
          cbs.forEach(fn => { try { fn(); } catch(e) {} });
        };
      }
    };

    // Khởi tạo sớm (Pre-warm) player ngầm để phát Audio Video từ vựng không bị chậm hoặc bị iOS chặn autoplay
    window.ensureBgAudioPlayer = function(callback) {
      if (window._bgYtPlayer && window._bgYtReady) {
        if (typeof callback === 'function') callback(window._bgYtPlayer);
        return;
      }
      let container = document.getElementById('bg-audio-yt-wrap');
      if (!container) {
        container = document.createElement('div');
        container.id = 'bg-audio-yt-wrap';
        container.setAttribute('aria-hidden', 'true');
        container.style.cssText = 'position:fixed;left:-4000px;top:0;width:480px;height:270px;overflow:hidden;pointer-events:none;z-index:-1;';
        const inner = document.createElement('div');
        inner.id = 'bg-audio-yt';
        container.appendChild(inner);
        document.body.appendChild(container);
      }
      window.ensureYouTubeIframeApi(() => {
        if (window._bgYtPlayer && window._bgYtReady) {
          if (typeof callback === 'function') callback(window._bgYtPlayer);
          return;
        }
        if (window._bgYtInitializing) {
          if (typeof callback === 'function') {
            const checkTimer = setInterval(() => {
              if (window._bgYtReady && window._bgYtPlayer) {
                clearInterval(checkTimer);
                callback(window._bgYtPlayer);
              }
            }, 60);
          }
          return;
        }
        window._bgYtInitializing = true;
        try {
          window._bgYtPlayer = new window.YT.Player('bg-audio-yt', {
            width: 480,
            height: 270,
            playerVars: {
              autoplay: 0,
              controls: 0,
              rel: 0,
              playsinline: 1,
              modestbranding: 1,
              disablekb: 1,
              fs: 0,
              cc_load_policy: 0,
              iv_load_policy: 3
            },
            events: {
              onReady: () => {
                window._bgYtReady = true;
                window._bgYtInitializing = false;
                if (typeof callback === 'function') callback(window._bgYtPlayer);
              },
              onError: () => {
                window._bgYtInitializing = false;
              }
            }
          });
        } catch (e) {
          window._bgYtInitializing = false;
        }
      });
    };

    window.playVideoAudioSegment = function(videoId, startTime = 0, duration = 4, options = {}) {
      const onStart = options.onStart || null;
      const onEnd = options.onEnd || null;
      const onError = options.onError || null;
      const rate = options.rate || 1.0;

      if (!videoId) {
        if (typeof onError === 'function') onError('No videoId');
        return Promise.resolve(false);
      }

      // Dừng bất kỳ âm thanh TTS nào trước đó
      if (window._activeAudioPlayer) {
        try { window._activeAudioPlayer.pause(); } catch(e) {}
        window._activeAudioPlayer = null;
      }
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        try { window.speechSynthesis.cancel(); } catch(e) {}
      }
      window.stopVideoAudioSegment();

      const startSec = Math.max(0, Number(startTime) || 0);
      const durSec = Math.max(1.5, Math.min(15, Number(duration) || 4));
      const endSec = startSec + durSec;

      return new Promise((resolve) => {
        let hasTriggeredStart = false;
        let isDone = false;

        const cleanupAndFinish = (success) => {
          if (isDone) return;
          isDone = true;
          if (window._bgYtTimer) {
            clearInterval(window._bgYtTimer);
            window._bgYtTimer = null;
          }
          window._bgYtActiveOnEnd = null;
          if (window._bgYtPlayer && window._bgYtReady) {
            try { window._bgYtPlayer.pauseVideo(); } catch (e) {}
          }
          if (success) {
            if (typeof onEnd === 'function') onEnd();
          } else {
            if (typeof onError === 'function') onError('playback_failed');
          }
          resolve(success);
        };

        window._bgYtActiveOnEnd = () => {
          if (!isDone) {
            isDone = true;
            if (typeof onEnd === 'function') onEnd();
            resolve(true);
          }
        };

        const executePlay = (player) => {
          try {
            const p = player || window._bgYtPlayer;
            const now = Date.now();
            try { if (p.unMute) p.unMute(); } catch (e) {}
            try { if (p.setVolume) p.setVolume(100); } catch (e) {}
            try { if (p.setPlaybackRate) p.setPlaybackRate(rate); } catch (e) {}

            if (window._bgYtCurrentVid !== videoId) {
              window._bgYtCurrentVid = videoId;
              p.loadVideoById({
                videoId: videoId,
                startSeconds: startSec
              });
            } else {
              p.seekTo(startSec, true);
              p.playVideo();
            }

            window._bgYtTimer = setInterval(() => {
              if (!p || !p.getCurrentTime) return;
              let curr = 0;
              let state = -1;
              try {
                curr = p.getCurrentTime() || 0;
                state = p.getPlayerState();
              } catch (e) { return; }

              if (!hasTriggeredStart) {
                if (state === 1) {
                  hasTriggeredStart = true;
                  if (typeof onStart === 'function') onStart();
                } else if (Date.now() - now > 10000) {
                  cleanupAndFinish(false);
                  return;
                }
              } else {
                if (curr >= endSec || (curr < startSec - 1.2 && state === 1)) {
                  cleanupAndFinish(true);
                }
              }
            }, 60);

          } catch (err) {
            cleanupAndFinish(false);
          }
        };

        window.ensureBgAudioPlayer((player) => {
          executePlay(player);
        });
      });
    };

    window.playVocabVideoAudio = function(id, e) {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      const item = getVocab().find((v) => v.id === id);
      if (!item || !item.videoId) return;

      const btn = e && e.currentTarget;
      if (btn && btn.classList.contains('playing')) {
        window.stopVideoAudioSegment();
        btn.classList.remove('playing');
        return;
      }

      document.querySelectorAll('.vocab-video-mini.playing, .vocab-audio-tag-btn.playing').forEach((b) => b.classList.remove('playing'));
      if (btn) btn.classList.add('playing');

      const dur = item.duration || (item.en ? Math.max(2.5, Math.min(8.0, item.en.split(/\s+/).length * 0.45 + 1.0)) : 4);
      window.playVideoAudioSegment(item.videoId, item.t || 0, dur, {
        onStart: () => { if (btn) btn.classList.add('playing'); },
        onEnd: () => { if (btn) btn.classList.remove('playing'); },
        onError: () => {
          if (btn) btn.classList.remove('playing');
          window.playFrenchAudio(item.text);
        }
      });
    };

    window.playVocabWordAudio = function(id, e) {
      if (e) { e.stopPropagation(); e.preventDefault(); }
      const item = getVocab().find((v) => v.id === id);
      if (!item || !item.text) return;
      window.stopVideoAudioSegment();
      const btn = e && e.currentTarget;
      if (btn) btn.classList.add('playing');
      window.playFrenchAudio(item.text, {
        onEnd: () => { if (btn) btn.classList.remove('playing'); }
      });
      setTimeout(() => { if (btn) btn.classList.remove('playing'); }, 800);
    };

    // Điện thoại (cạnh ngắn của màn hình <= 600px): cỡ chữ phụ đề mặc định nhỏ hơn 3px (16 thay vì 19). Muốn đổi: sửa 2 con số này.
    const IS_PHONE = Math.min(window.screen.width || 0, window.screen.height || 0) <= 600 && Math.min(window.screen.width || 0, window.screen.height || 0) > 0;
    const DEFAULT_SUB_FONT_SIZE = IS_PHONE ? 16 : 19;
    // Cỡ 19 đã lưu từ trước trên điện thoại chính là cỡ mặc định cũ -> coi như chưa chỉnh, dùng mặc định mới
    let currentSubFontSize = (savedPrefs.subFontSize && !(IS_PHONE && savedPrefs.subFontSize === 19)) ? savedPrefs.subFontSize : DEFAULT_SUB_FONT_SIZE;

    let currentCardLineHeight = savedPrefs.cardLineHeight || 1.30;
    let currentTextLineHeight = savedPrefs.textLineHeight || 1.42;
    let currentTextGap = savedPrefs.textGap || 8;

    let settings = {
      playbackRate: savedPrefs.playbackRate !== undefined ? savedPrefs.playbackRate : 1.0,
      autoPause: false,   // đã bỏ nút "Tự dừng cuối câu": luôn tắt (kể cả khi trình duyệt từng lưu trạng thái bật)
      sentenceAutoStop: savedPrefs.sentenceAutoStop !== undefined ? !!savedPrefs.sentenceAutoStop : (!!savedPrefs.autoPause || false),   // công tắc "Tự dừng" ở thanh công cụ & thẻ phụ đề
      blurMode: false,   // đã bỏ nút Ẩn chữ ở giao diện Mặc định: luôn tắt (Ẩn chữ chỉ còn ở giao diện Shadowing)
      autoScroll: savedPrefs.autoScroll !== undefined ? savedPrefs.autoScroll : false,
      karaokeMode: savedPrefs.karaokeMode !== undefined ? savedPrefs.karaokeMode : true,
      bilingual: false   // trạng thái khởi tạo; khi mở video có sẵn bản dịch thì resetBilingualForNewVideo() / ensureBilingualDefaultOn() tự bật lần đầu
    };

    function saveUserPreferences() {
      try {
        const prefs = {
          subFontSize: currentSubFontSize,
          cardLineHeight: currentCardLineHeight,
          textLineHeight: currentTextLineHeight,
          textGap: currentTextGap,
          playbackRate: settings.playbackRate,
          autoPause: settings.sentenceAutoStop,
          sentenceAutoStop: settings.sentenceAutoStop,
          blurMode: settings.blurMode,
          autoScroll: settings.autoScroll,
          karaokeMode: settings.karaokeMode
        };
        localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
      } catch(e) {}
    }

    let ytPlayer = null;
    let isPlayerReady = false;
    let isPlaying = false;
    let isUserSeeking = false;
    let isInternalSeekAction = false;
    // Ghi nhớ vị trí cuộn của trang chủ (thư viện video) trước khi chuyển sang màn
    // hình luyện tập, để khi bấm "Luyện video khác" quay lại đúng chỗ đã cuộn tới,
    // không bị đưa về đầu trang.
    let savedHomeScrollY = 0;
    let savedRowScrollLeft = {};   // vị trí cuộn ngang đã lưu của từng hàng danh mục trên trang chủ, theo rowId
    // ---- Chụp lại "trạng thái trang chủ" TRƯỚC khi rời đi (mở video / bài / sách), để quay lại thấy y hệt ----
    // Gồm: vị trí cuộn dọc, vị trí cuộn ngang của từng hàng, và 1 "mốc neo" (toạ độ của hàng thể loại đầu tiên) để bù lại nếu
    // hàng "Video Bạn Đã Luyện Gần Đây" xuất hiện/biến mất trong lúc đi vắng làm trang dịch lên/xuống.
    // Các thứ còn lại (từ khoá tìm kiếm, tab đang mở, hàng đang "Xem thêm", hàng đã tải) nằm ngay trong DOM trang chủ,
    // mà trang chủ chỉ bị ẩn chứ không bị vẽ lại nên tự được giữ nguyên.
    let homeSnap = null;
    let homeFrozen = false;          // true trong lúc trang chủ đang bị ẩn vì đang ở màn hình luyện tập: hoãn việc vẽ lại hàng lịch sử
    let homeNavDirty = false;        // hàng lịch sử đổi khi trang chủ đang ẩn -> thanh điều hướng cần dựng lại sau khi trang chủ hiện
    let homeHistoryDirty = false;    // lịch sử đổi trong lúc đi vắng -> cần làm mới hàng lịch sử khi quay lại
    function homeAnchorY() {
      const c = document.getElementById('netflix-categories-container');
      if (!c || !c.getClientRects().length) return null;   // trang chủ đang bị giấu (vd. F5 thẳng vào video): chưa có toạ độ thật -> không dùng làm mốc neo
      const w = c.querySelector(':scope > .netflix-row-wrapper:not([data-recent])');
      return w ? w.getBoundingClientRect().top + window.scrollY : null;
    }
    function captureHomeState() {
      const home = document.getElementById('screen-input');
      if (!home || home.classList.contains('hidden')) return;   // đang không ở trang chủ (vd. đi từ màn Từ vựng sang) -> giữ nguyên bản chụp cũ
      savedHomeScrollY = window.scrollY;
      captureRowScrollPositions();
      homeSnap = { anchorY: homeAnchorY() };
      homeFrozen = true;
    }
    window.homeOnShown = function () {   // trang chủ hiện lại bằng đường khác (Từ vựng, Sách...) -> bỏ trạng thái hoãn
      if (!homeFrozen) return;
      homeFrozen = false;
      if (homeHistoryDirty) { homeHistoryDirty = false; renderHistorySection(); }
    };
    function captureRowScrollPositions() {
      document.querySelectorAll('.netflix-scroll-row').forEach((row) => {
        if (row.id) savedRowScrollLeft[row.id] = row.scrollLeft;
      });
    }
    function restoreRowScrollPositions() {
      document.querySelectorAll('.netflix-scroll-row').forEach((row) => {
        if (row.id && savedRowScrollLeft[row.id]) row.scrollTo({ left: savedRowScrollLeft[row.id], top: 0, behavior: 'instant' });   // tức thì: CSS của hàng là smooth nên gán scrollLeft sẽ chạy hoạt ảnh
      });
    }
    let isMouseHoveringSubtitles = false;
    let isHoveringLookupTooltip = false;
    let rafAnimId = null;
    let seekTargetTime = 0;
    let seekGraceUntil = 0;
    let handledSentenceEndId = null;
    let pausedByAutoPauseId = null;
    let pausedAtSentenceIndex = null;
    let autoPauseCooldownUntil = 0;
    let stopAtSentenceEndId = null;
    let lastReportedScrollTarget = -1;
    let currentHighlightedWordEl = null;

    // Biến theo dõi dòng chữ thực tế phục vụ cuộn từng dòng (Item 1)
    let lastTrackedLineTop = -1;

    // Xoá sạch mọi trạng thái theo dõi cuộn/karaoke còn sót lại của video TRƯỚC ĐÓ, để video vừa mở
    // luôn hiển thị đúng từ dòng phụ đề đầu tiên (không bị "nhảy" tới vị trí cũ của video trước).
    function resetPlaybackTrackingState() {
      lastTrackedLineTop = -1;
      currentHighlightedWordEl = null;
      lastReportedScrollTarget = -1;
      lastPlayerCurrentTime = 0;
      handledSentenceEndId = null;
      pausedByAutoPauseId = null;
      pausedAtSentenceIndex = null;
      seekGraceUntil = 0;
      seekTargetTime = 0;
      isUserSeeking = false;
    }

    let mediaRecorder = null;
    let audioChunks = [];
    let recordedAudioUrl = null;
    let userAudioPlayer = null;
    let isRecording = false;
    let recordTimerInterval = null;
    let recordSeconds = 0;
    let selectedTextForLookup = '';

    // ==================== LOOP ĐOẠN BÔI ĐEN (SHADOWING) ====================
    let subtitleLoopActive = false;
    let subtitleLoopStart = null;
    let subtitleLoopEnd = null;
    let subtitleLoopRafId = null;

    // Icon SVG nhiều màu, tươi sáng, mỗi danh mục một tông màu riêng (không phụ thuộc màu chữ).
    // Dùng màu đặc (không dùng gradient/id) để hiển thị ổn định dù icon lặp lại nhiều lần trong trang.
    const CATEGORY_ICONS = (() => {
      const wrap = (bg, inner) => `
        <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
          <circle cx="24" cy="24" r="22" fill="${bg}"/>
          <ellipse cx="24" cy="13" rx="14" ry="7" fill="#fff" fill-opacity="0.2"/>
          ${inner}
          <circle cx="24" cy="24" r="22" stroke="#000" stroke-opacity="0.12" stroke-width="1.5"/>
        </svg>`;
      // Huy hiệu tròn 3D: nền gradient dọc + vệt sáng bóng phía trên + viền mờ (đồng bộ với các icon khác).
      // Mỗi icon dùng id gradient riêng (prefix) để không bị đụng nhau.
      const wrap3d = (id, top, bottom, inner) => `
        <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
          <defs>
            <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#${id}-bg)"/>
          <ellipse cx="24" cy="12.5" rx="14.5" ry="7.5" fill="#fff" fill-opacity="0.22"/>
          ${inner}
          <circle cx="24" cy="24" r="22" stroke="#000" stroke-opacity="0.12" stroke-width="1.5"/>
        </svg>`;
      // Hai mắt xích: dựng 2 lần (1 lần làm bóng đổ, 1 lần màu thật).
      const chainLinks = (ca, cb, weave) => `
        <g transform="rotate(-45 24 24)">
          <rect x="20" y="18.5" width="20" height="11" rx="5.5" stroke="${cb}" stroke-width="3.8"/>
          <rect x="8" y="18.5" width="20" height="11" rx="5.5" stroke="${ca}" stroke-width="3.8"/>
          ${weave ? `<g clip-path="url(#chn-clip)"><rect x="20" y="18.5" width="20" height="11" rx="5.5" stroke="${cb}" stroke-width="3.8"/></g>` : ''}
        </g>`;
      return {
        laugh_pro: `
        <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
          <defs>
            <radialGradient id="lf-face" cx="0.5" cy="0.28" r="0.85"><stop offset="0" stop-color="#FFEE80"/><stop offset="0.6" stop-color="#FDCB3E"/><stop offset="1" stop-color="#F59E2B"/></radialGradient>
            <linearGradient id="lf-mouth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a1608"/><stop offset="1" stop-color="#b4301c"/></linearGradient>
            <linearGradient id="lf-tongue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a90"/><stop offset="1" stop-color="#e11d48"/></linearGradient>
            <clipPath id="lf-clip"><path d="M9.8 27Q24 24.8 38.2 27C38.2 36.5 32.2 42.5 24 42.5S9.8 36.5 9.8 27Z"/></clipPath>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#lf-face)"/>
          <ellipse cx="24" cy="11.5" rx="14.5" ry="7" fill="#fff" fill-opacity="0.26"/>
          <path d="M11.5 13l8.8 5.6c-3.8.2-7.2.8-10.6 2.4M36.5 13l-8.8 5.6c3.8.2 7.2.8 10.6 2.4" stroke="#1f2a5c" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M9.8 27Q24 24.8 38.2 27C38.2 36.5 32.2 42.5 24 42.5S9.8 36.5 9.8 27Z" fill="url(#lf-mouth)"/>
          <g clip-path="url(#lf-clip)"><path d="M12.5 41C14.5 33.8 20 33.6 24 36.2C28 33.6 33.5 33.8 35.5 41V45H12.5Z" fill="url(#lf-tongue)"/></g>
          <circle cx="24" cy="24" r="22" stroke="#000" stroke-opacity="0.12" stroke-width="1.5"/>
        </svg>`,
        ted_logo: `
        <svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block">
          <circle cx="24" cy="24" r="22" fill="#e62b1e"/>
          <ellipse cx="24" cy="13" rx="14" ry="7" fill="#fff" fill-opacity="0.18"/>
          <text x="24" y="30.5" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="15" fill="#ffffff" letter-spacing="0.5">TED</text>
        </svg>`,
        brain_pro: wrap('#C026D3', `
          <path d="M20 14c-3.5 0-6 2.6-6 5.6 0 1-.5 1.6-1.2 2.3-1 1-1.8 2.2-1.8 4.1 0 2.6 1.9 4.2 3.8 4.6-.2.6-.3 1.2-.3 1.9 0 3 2.4 5.5 5.5 5.5h1V14h-1Z" fill="#fff"/>
          <path d="M28 14c3.5 0 6 2.6 6 5.6 0 1 .5 1.6 1.2 2.3 1 1 1.8 2.2 1.8 4.1 0 2.6-1.9 4.2-3.8 4.6.2.6.3 1.2.3 1.9 0 3-2.4 5.5-5.5 5.5h-1V14h1Z" fill="#fbcfe8"/>
          <path d="M17 22c2 0 3 1 3 3M31 22c-2 0-3 1-3 3M17 30c2 0 3-1 3-3M31 30c-2 0-3-1-3-3" stroke="#c026d3" stroke-width="1.6" stroke-linecap="round" fill="none"/>
          <path d="M38 8l1.2 2.8 2.8 1.2-2.8 1.2L38 16l-1.2-2.8L34 12l2.8-1.2z" fill="#fde047"/>`),
        growth_pro: wrap('#10B981', `
          <rect x="12" y="30" width="6.5" height="7" rx="1.5" fill="#d1fae5"/>
          <rect x="20.7" y="26" width="6.5" height="11" rx="1.5" fill="#fff"/>
          <rect x="29.5" y="21" width="6.5" height="16" rx="1.5" fill="#fde047"/>
          <path d="M12 22l7-5.5 5 3.8L34 11" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M28 10.5h6.5V17" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
        clapper_pro: wrap('#3B82F6', `
          <rect x="11" y="22" width="26" height="15" rx="2.5" fill="#fff"/>
          <path d="M11 22l4-6.5h5.5L16.5 22z" fill="#fde047"/>
          <path d="M16.5 22l4-6.5H26L22 22z" fill="#1e293b"/>
          <path d="M22 22l4-6.5h5.5L27.5 22z" fill="#fde047"/>
          <path d="M27.5 22l4-6.5H37V22z" fill="#1e293b"/>
          <path d="M21 25.5l9 4.8-9 4.8z" fill="#ef4444"/>`),
        layers_pro: wrap('#14B8A6', `
          <path d="M24 27l11 6-11 6-11-6z" fill="#a7f3d0"/>
          <path d="M24 21.5l11 6-11 6-11-6z" fill="#f9a8d4"/>
          <path d="M24 14l11 6-11 6-11-6z" fill="#fde047"/>`),
        history_pro: wrap3d('hist', '#38BDF8', '#0369A1', `
          <defs>
            <linearGradient id="hist-arc" gradientUnits="userSpaceOnUse" x1="0" y1="13" x2="0" y2="37"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#bae6fd"/></linearGradient>
            <linearGradient id="hist-gold" gradientUnits="userSpaceOnUse" x1="0" y1="10" x2="0" y2="32"><stop offset="0" stop-color="#FEF08A"/><stop offset="1" stop-color="#F59E0B"/></linearGradient>
          </defs>
          <g transform="translate(0 1.4)" opacity="0.3">
            <path d="M18.5 15.47A11 11 0 1 1 14.47 30.5" stroke="#0c2d57" stroke-width="3.8" stroke-linecap="round"/>
            <path d="M15.8 10.8L21.2 20.1L12.4 19Z" fill="#0c2d57" stroke="#0c2d57" stroke-width="2" stroke-linejoin="round"/>
            <path d="M24 19.5V25.5L28.5 30" stroke="#0c2d57" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <path d="M18.5 15.47A11 11 0 1 1 14.47 30.5" stroke="url(#hist-arc)" stroke-width="3.8" stroke-linecap="round"/>
          <path d="M15.8 10.8L21.2 20.1L12.4 19Z" fill="url(#hist-gold)" stroke="url(#hist-gold)" stroke-width="2" stroke-linejoin="round"/>
          <path d="M24 19.5V25.5L28.5 30" stroke="url(#hist-gold)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`),
        standup_pro: wrap('#EC4899', `
          <g transform="rotate(35 24 24)">
            <circle cx="24" cy="14" r="7" fill="#fff"/>
            <path d="M17.6 12.2h13.6M17.4 15.6h13.2M24 7.4v13.2" stroke="#ec4899" stroke-opacity="0.55" stroke-width="1.3" stroke-linecap="round"/>
            <rect x="20" y="20.4" width="8" height="3.2" rx="1.2" fill="#fde047"/>
            <path d="M21.4 24h5.2l-.9 14.6a1.3 1.3 0 0 1-1.3 1.2h-.8a1.3 1.3 0 0 1-1.3-1.2z" fill="#fff"/>
          </g>`),
        beginner_pro: wrap('#84CC16', `
          <path d="M24 36V21" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
          <path d="M24 23c0-5.5-4.2-8.5-9.5-8.5 0 5.5 4.2 8.5 9.5 8.5Z" fill="#fff"/>
          <path d="M24 23c0-4.4 3.2-7.5 8.5-7.5 0 4.4-3.2 7.5-8.5 7.5Z" fill="#ecfccb"/>
          <path d="M15 37.5h18" stroke="#3f6212" stroke-width="3" stroke-linecap="round"/>`),
        intermediate_pro: wrap('#F97316', `
          <rect x="12.5" y="27" width="7" height="10" rx="1.8" fill="#fed7aa"/>
          <rect x="20.5" y="21" width="7" height="16" rx="1.8" fill="#fff"/>
          <rect x="28.5" y="14" width="7" height="23" rx="1.8" fill="#fde047"/>`),
        podcast_pro: wrap('#06B6D4', `
          <rect x="19" y="10" width="10" height="17" rx="5" fill="#fff"/>
          <path d="M21.5 15.5h5M21.5 19h5" stroke="#06b6d4" stroke-opacity="0.45" stroke-width="1.6" stroke-linecap="round"/>
          <path d="M14 22.5a10 10 0 0 0 20 0" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/>
          <path d="M24 33v4.5M18 38h12" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M9.5 18.5q-2.2 4.5 0 9M38.5 18.5q2.2 4.5 0 9" stroke="#fde047" stroke-width="2.4" stroke-linecap="round" fill="none"/>`),
        intonation_pro: wrap('#6366F1', `
          <path d="M9 30C13 30 14.5 18 20 18S25.5 32 30.5 32C34 32 35 25 38 21" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M32.6 19.8l5.8.4-1.2 5.8" stroke="#fde047" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),
        connection_pro: wrap3d('chn', '#FBBF24', '#EA580C', `
          <defs>
            <linearGradient id="chn-a" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="34"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fde7b0"/></linearGradient>
            <linearGradient id="chn-b" gradientUnits="userSpaceOnUse" x1="0" y1="14" x2="0" y2="34"><stop offset="0" stop-color="#C2410C"/><stop offset="1" stop-color="#7C2D12"/></linearGradient>
            <clipPath id="chn-clip"><rect x="18" y="12" width="14" height="12"/></clipPath>
          </defs>
          <g transform="translate(0 1.5)" opacity="0.28">${chainLinks('#431407', '#431407', false)}</g>
          ${chainLinks('url(#chn-a)', 'url(#chn-b)', true)}`),
        reduction_pro: wrap('#F43F5E', `
          <path d="M9.5 24h10M15.5 18.5l5.5 5.5-5.5 5.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M38.5 24h-10M32.5 18.5L27 24l5.5 5.5" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="24" cy="24" r="2.6" fill="#fde047"/>`),
        article_pro: wrap('#8B5CF6', `
          <rect x="13" y="11" width="22" height="26" rx="3" fill="#fff"/>
          <path d="M17.5 17.5h13" stroke="#fbbf24" stroke-width="2.6" stroke-linecap="round"/>
          <path d="M17.5 23h13M17.5 28.5h8" stroke="#a78bfa" stroke-width="2.4" stroke-linecap="round"/>`),
        greatpeople_pro: wrap('#BE123C', `
          <path d="M12 32.5L10.5 18l7.5 5.5L24 13.5l6 10L37.5 18 36 32.5Z" fill="#fff" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
          <rect x="12" y="33.5" width="24" height="4.5" rx="1.8" fill="#fde047"/>
          <circle cx="10.5" cy="16.6" r="2.3" fill="#fde047"/><circle cx="24" cy="12" r="2.6" fill="#fde047"/><circle cx="37.5" cy="16.6" r="2.3" fill="#fde047"/>
          <circle cx="18" cy="35.75" r="1.1" fill="#be123c"/><circle cx="24" cy="35.75" r="1.1" fill="#be123c"/><circle cx="30" cy="35.75" r="1.1" fill="#be123c"/>`),
        friends_pro: wrap('#7E22CE', `
          <rect x="14" y="14.5" width="20" height="13" rx="4.5" fill="#fff"/>
          <rect x="8.5" y="21.5" width="7" height="14" rx="3.5" fill="#e9d5ff"/>
          <rect x="32.5" y="21.5" width="7" height="14" rx="3.5" fill="#e9d5ff"/>
          <rect x="13" y="26" width="22" height="9" rx="3" fill="#fdba74"/>
          <path d="M24 27v7" stroke="#c2410c" stroke-opacity="0.45" stroke-width="1.5" stroke-linecap="round"/>
          <rect x="13.5" y="35.5" width="3.2" height="3.2" rx="1" fill="#fde047"/><rect x="31.3" y="35.5" width="3.2" height="3.2" rx="1" fill="#fde047"/>
          <path d="M20 10.5h8" stroke="#fde047" stroke-width="2.4" stroke-linecap="round"/>`),
        bigbang_pro: wrap('#1D4ED8', `
          <ellipse cx="24" cy="24" rx="14" ry="5.4" stroke="#fff" stroke-width="2.2" fill="none"/>
          <ellipse cx="24" cy="24" rx="14" ry="5.4" stroke="#bfdbfe" stroke-width="2.2" fill="none" transform="rotate(60 24 24)"/>
          <ellipse cx="24" cy="24" rx="14" ry="5.4" stroke="#fff" stroke-width="2.2" fill="none" transform="rotate(120 24 24)"/>
          <circle cx="24" cy="24" r="3.8" fill="#fde047"/>
          <circle cx="38" cy="24" r="2" fill="#fde047"/>
          <circle cx="17" cy="36.1" r="2" fill="#fda4af"/>
          <circle cx="17" cy="11.9" r="2" fill="#fff"/>`),
        playlist_pro: `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block"><defs><linearGradient id="plp-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#60A5FA"/><stop offset="1" stop-color="#2563EB"/></linearGradient></defs><circle cx="24" cy="24" r="22" fill="url(#plp-bg)"/><ellipse cx="24" cy="12.5" rx="14.5" ry="7.5" fill="#fff" fill-opacity="0.22"/><path d="M12 15.5h16M12 23h16M12 30.5h9" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M30 25.5v13l10-6.5Z" fill="#fde047" stroke="#fde047" stroke-width="2.4" stroke-linejoin="round"/><circle cx="24" cy="24" r="22" stroke="#000" stroke-opacity="0.12" stroke-width="1.5"/></svg>`,
        chat_pro: `<svg viewBox="0 0 48 48" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block"><circle cx="24" cy="24" r="22" fill="#0EA5E9"/><ellipse cx="24" cy="13" rx="14" ry="7" fill="#fff" fill-opacity="0.2"/><path d="M26.5 21h7A4.5 4.5 0 0 1 38 25.5v4A4.5 4.5 0 0 1 33.5 34H33v5l-6-5h-.5A4.5 4.5 0 0 1 22 29.5v-4A4.5 4.5 0 0 1 26.5 21Z" fill="#fde047"/><path d="M14.5 10h13a4.5 4.5 0 0 1 4.5 4.5v6a4.5 4.5 0 0 1-4.5 4.5H21l-5.5 4.5V25h-1A4.5 4.5 0 0 1 10 20.5v-6A4.5 4.5 0 0 1 14.5 10Z" fill="#fff" stroke="#0EA5E9" stroke-width="1.6"/><circle cx="16.5" cy="17.5" r="1.7" fill="#0EA5E9"/><circle cx="21" cy="17.5" r="1.7" fill="#0EA5E9"/><circle cx="25.5" cy="17.5" r="1.7" fill="#0EA5E9"/><circle cx="24" cy="24" r="22" stroke="#000" stroke-opacity="0.12" stroke-width="1.5"/></svg>`
      };
    })();

    const CATEGORY_META = {
      "humor": { label: "Video hài & Giải trí", iconKey: "laugh_pro", color: "text-amber-400" },
      "ted_talks": { label: "TEDx En Français", iconKey: "ted_logo", color: "text-red-500" },
      "psychology": { label: "Tâm lý học & Đời sống (Psychologie)", iconKey: "brain_pro", color: "text-purple-400" },
      "self_growth": { label: "Phát triển bản thân", iconKey: "growth_pro", color: "text-emerald-400" },
      "animation": { label: "Hoạt hình & Hoạt hoạ (Animation)", iconKey: "clapper_pro", color: "text-blue-400" },
      "Standup": { label: "Hài độc thoại (Stand-up comedy)", iconKey: "standup_pro", color: "text-pink-400" },
      "Beginner": { label: "Tiếng Pháp chậm/rõ cho Beginners (A1, A2)", iconKey: "beginner_pro", color: "text-lime-400" },
      "Intermediate": { label: "Tiếng Pháp cho Intermediate (B1, B2)", iconKey: "intermediate_pro", color: "text-orange-400" },
      "Podcast": { label: "Podcast & Phỏng vấn (Video dài)", iconKey: "podcast_pro", color: "text-cyan-400" },
      "Intonation": { label: "Luyện ngữ điệu tiếng Pháp (Intonation)", iconKey: "intonation_pro", color: "text-indigo-400" },
      "Connection": { label: "Luyện nối âm (Liaison & Enchaînement)", iconKey: "connection_pro", color: "text-yellow-400" },
      "Reduction": { label: "Luyện lược âm, nuốt âm (Élision)", iconKey: "reduction_pro", color: "text-rose-400" },
      "Article": { label: "Thư viện bài đọc tiếng Pháp", iconKey: "article_pro", color: "text-teal-400" },
      "Slow_French": { label: "Tiếng Pháp Chậm Dễ Hiểu", iconKey: "greatpeople_pro", color: "text-rose-400" },
      "others": { label: "Chủ đề khác", iconKey: "layers_pro", color: "text-slate-400" },
      "tieng_phap_giao_tiep": { label: "Tiếng Pháp Giao Tiếp", iconKey: "chat_pro", color: "text-sky-400" }
    };
    // Ba mục có icon riêng. Nhận diện theo TÊN khoá trong category.json hoặc theo tên hiển thị (_label), không phân biệt hoa/thường/dấu gạch,
    // nên dù khoá của bạn đặt là "friends", "the_big_bang_theory", "great_people"... vẫn khớp.
    const CATEGORY_META_EXTRA = [
      { re: /v[ĩi]\s*nh[âa]n|great[\s_-]*(people|men|person|stor)|biograph/i, meta: { label: "Câu chuyện vĩ nhân", iconKey: "greatpeople_pro", color: "text-rose-400" } },
      { re: /friends|nh[ữu]ng\s*ng[ưu][ờo]i\s*b[ạa]n/i,                     meta: { label: "Những người bạn (FRIENDS)", iconKey: "friends_pro", color: "text-purple-400" } },
      { re: /big[\s_-]*bang/i,                                                  meta: { label: "The Big Bang Theory", iconKey: "bigbang_pro", color: "text-blue-400" } }
    ];

    // Tra thể loại KHÔNG phân biệt hoa/thường và bỏ qua dấu gạch (standup / Standup / stand-up / stand_up đều khớp),
    // vì tên thể loại trong category.json có thể viết thường -> trước đây bị rơi về nhãn mặc định IN HOA.
    const CATEGORY_META_NORM = (() => {
      const o = {};
      Object.keys(CATEGORY_META).forEach((k) => { o[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = CATEGORY_META[k]; });
      return o;
    })();
    // Tên hiển thị của từng thể loại có thể khai báo ngay trong category.json bằng khóa riêng "_label"
    // (nằm trong object của thể loại, cạnh các video). Ví dụ: "humor": { "_label": "Video hài & Giải trí", "ID": "Tiêu đề", ... }
    // Khóa này được TÁCH RA ngay khi đọc file nên phần còn lại của app chỉ thấy danh sách video như cũ.
    // Chỉ nhận đúng khóa "_label" (không nhận mọi khóa bắt đầu bằng "_", vì ID video YouTube có thể bắt đầu bằng dấu "_").
    let categoryLabelOverrides = {};
    let categoryPlaylists = {};   // catKey -> [{ id, title, videos: [videoId] }]  (từ "playlists" trong catalog.json)
    function extractCategoryLabels(parsed) {
      const labels = {};
      Object.keys(parsed).forEach((catKey) => {
        const obj = parsed[catKey];
        if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !('_label' in obj)) return;
        const v = obj._label;
        delete obj._label;
        if (typeof v === 'string' && v.trim()) labels[catKey] = v.trim();
      });
      return labels;
    }
    function getCategoryMeta(catKey) {
      const base = CATEGORY_META[catKey] || CATEGORY_META_NORM[String(catKey).toLowerCase().replace(/[^a-z0-9]/g, '')];
      if (base) return base;
      const hay = String(catKey) + ' ' + (categoryLabelOverrides[catKey] || '');
      const hit = CATEGORY_META_EXTRA.find((x) => x.re.test(hay));
      return hit ? hit.meta : null;
    }

    function formatViews(views) {
      if (!views) return '';
      const num = Number(views);
      if (isNaN(num)) return String(views);
      if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0', '') + 'M lượt xem';
      if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'N lượt xem';
      return num + ' lượt xem';
    }

    // ==================== THƯ VIỆN THEO THƯ MỤC (_[ID]_[Tên video]) ====================
    // Bổ sung (không thay thế) cho category.json + <ID>.txt cũ. Mỗi video có 1 thư mục riêng cùng cấp với index.html:
    //   _ABCD1234xyz_Learning English with Logan/
    //       video-data.json   (title, viewCount, channelTitle, channelAvatar, duration, durationSeconds, category)
    //       <ID>.txt          (phụ đề word-level đã đối chiếu)
    //       <ID>_vi.txt       (bản dịch song ngữ, có thể trống)
    //       prompt.txt        (prompt dịch, chỉ để người quản trị copy; app không đọc)
    // Hosting tĩnh không liệt kê được thư mục, nên danh sách thư mục nằm trong library-index.json
    // ({"folders": ["_ID_Tên", ...]}) do extension Publisher tự tạo/cập nhật mỗi lần xuất video.
    // Phụ đề lẻ, bản dịch, các thư mục _ID_Tên và file chia sẻ nằm trong subs/. Bốn file JSON (catalog, category, library-index, videos-data) nằm cạnh index.html.
    const DATA_DIR = 'subs/';

    // ---- Video "ẩn": phụ đề nằm trong subs/<nguồn>/<playlist>/<ID>.json3, KHÔNG hiện ở THƯ VIỆN VIDEO và KHÔNG nằm trong catalog.json ----
    // Mỗi nguồn có 1 file danh mục riêng cạnh index.html (catalog_<nguồn>.json, do admin.html tạo). Trang chủ không tải các file này;
    // chỉ khi mở video bằng link trực tiếp (#/watch/<ID>) mà video không có trong thư viện thì mới tải (1 lần, rồi nhớ lại).
    // Thêm nguồn mới: thêm tên file vào mảng này (và vào HIDDEN_SOURCES trong admin.html).
    const HIDDEN_CATALOGS = ['catalog_coachshane.json'];
    let hiddenVideoMap = {};        // videoId -> { base: 'subs/coachshane/playlist_01/', file: 'ID.json3', vi: true/false }
    let hiddenCatalogPromise = null;
    function loadHiddenCatalogs() {
      if (hiddenCatalogPromise) return hiddenCatalogPromise;
      hiddenCatalogPromise = (async () => {
        let okCount = 0;
        await Promise.all(HIDDEN_CATALOGS.map(async (name) => {
          try {
            const r = await fetch(name, { cache: 'no-cache' });
            if (!r.ok) return;
            const t = await r.text();
            if (!t || t.trim().toLowerCase().startsWith('<!doctype')) return;
            const cat = JSON.parse(t.replace(/^\uFEFF/, ''));
            const vids = (cat && cat.videos) || {};
            const root = `${DATA_DIR}${encodeURIComponent(cat.source || '')}/`;
            Object.keys(vids).forEach((id) => {
              const v = vids[id] || {};
              if (!v.f || hiddenVideoMap[id]) return;
              hiddenVideoMap[id] = { base: `${root}${v.d ? encodeURIComponent(v.d) + '/' : ''}`, file: v.f, vi: !!v.vi };
            });
            okCount++;
          } catch (e) { console.warn('Không đọc được ' + name + ':', e); }
        }));
        if (!okCount) hiddenCatalogPromise = null;   // chưa nạp được cái nào (lỗi mạng / chưa upload file) -> lần sau thử lại
      })();
      return hiddenCatalogPromise;
    }
    let libraryFolderMap = {};   // videoId -> tên thư mục

    function parseLibraryFolderName(name) {
      const m = /^_([A-Za-z0-9_-]{11})_(.*)$/.exec(String(name || ''));
      return m ? { videoId: m[1], title: m[2].trim() } : null;
    }

    function normCatKey(k) { return String(k || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

    async function loadFolderLibrary() {
      let folders = [];
      try {
        const r = await fetch('library-index.json', { cache: 'no-cache' });
        if (r.ok) {
          const t = (await r.text()).trim();
          if (t && !t.toLowerCase().startsWith('<!doctype')) {
            const j = JSON.parse(t.replace(/,\s*([\]}])/g, '$1'));
            folders = Array.isArray(j) ? j : (Array.isArray(j.folders) ? j.folders : []);
          }
        }
      } catch (e) { console.warn('Không đọc được library-index.json:', e); }

      const seen = new Set();
      folders = folders.map((f) => String(f || '').trim()).filter((f) => f && !seen.has(f) && seen.add(f));

      const results = await Promise.allSettled(folders.map(async (folder) => {
        const parsed = parseLibraryFolderName(folder);
        if (!parsed) throw new Error('Tên thư mục sai cú pháp: ' + folder);
        const r = await fetch(`${DATA_DIR}${encodeURIComponent(folder)}/video-data.json`, { cache: 'no-cache' });
        if (!r.ok) throw new Error('Thiếu video-data.json: ' + folder);
        const t = (await r.text()).trim();
        if (!t || t.toLowerCase().startsWith('<!doctype')) throw new Error('Thiếu video-data.json: ' + folder);
        const data = JSON.parse(t.replace(/,\s*([\]}])/g, '$1'));
        return { vid: parsed.videoId, folder, data: data || {}, fallbackTitle: parsed.title };
      }));

      const entries = [];
      results.forEach((r) => {
        if (r.status === 'fulfilled') entries.push(r.value);
        else console.warn('[Thư viện thư mục]', r.reason && r.reason.message ? r.reason.message : r.reason);
      });
      return entries;
    }

    // Gộp các video dạng thư mục vào categoryStructure / videoMetadataMap (video trùng ID với bản cũ -> bản thư mục thắng).
    // Trong mỗi hàng, video kiểu cũ đứng trước, video dạng thư mục nối phía sau (video mới nhất nằm cuối cùng).
    function mergeFolderLibrary(entries) {
      libraryFolderMap = {};
      const byCat = new Map();   // key hàng -> [[vid, title], ...]
      entries.forEach(({ vid, folder, data, fallbackTitle }) => {
        libraryFolderMap[vid] = folder;
        Object.keys(categoryStructure).forEach((k) => {
          if (categoryStructure[k] && typeof categoryStructure[k] === 'object' && categoryStructure[k][vid] !== undefined) delete categoryStructure[k][vid];
        });
        const rawCat = String(data.category || '').trim() || 'others';
        const key = Object.keys(categoryStructure).find((k) => normCatKey(k) === normCatKey(rawCat))
          || [...byCat.keys()].find((k) => normCatKey(k) === normCatKey(rawCat))
          || rawCat;
        const title = String(data.title || fallbackTitle || vid);
        if (!byCat.has(key)) byCat.set(key, []);
        byCat.get(key).push([vid, title]);
        videoMetadataMap[vid] = Object.assign({}, videoMetadataMap[vid] || {}, {
          title: title,
          viewCount: data.viewCount || '',
          channelTitle: data.channelTitle || '',
          channelAvatar: data.channelAvatar || '',
          duration: data.duration || ''
        });
      });
      // Hàng mới (chưa có trong category.json) xếp theo thứ tự CATEGORY_META, "others" cuối cùng
      const metaOrder = Object.keys(CATEGORY_META).map(normCatKey);
      const newKeys = [...byCat.keys()].filter((k) => !(k in categoryStructure))
        .sort((a, b) => {
          const rank = (k) => { const n = normCatKey(k); if (n === 'others') return 1000; const i = metaOrder.indexOf(n); return i < 0 ? 999 : i; };
          return rank(a) - rank(b);
        });
      byCat.forEach((list, key) => {
        const legacy = categoryStructure[key] || {};
        const merged = {};
        const newIds = new Set(list.map(([vid]) => vid));
        Object.keys(legacy).forEach((vid) => { if (!newIds.has(vid)) merged[vid] = legacy[vid]; });   // video kiểu cũ trước
        list.forEach(([vid, title]) => { merged[vid] = title; });                                      // video thư mục mới nối phía sau (cũ -> mới theo thứ tự trong library-index.json)
        categoryStructure[key] = merged;
      });
      // categoryStructure vừa được thêm key mới ở cuối theo thứ tự byCat; sắp lại để key mới theo newKeys
      if (newKeys.length) {
        const reordered = {};
        Object.keys(categoryStructure).filter((k) => !newKeys.includes(k)).forEach((k) => { reordered[k] = categoryStructure[k]; });
        newKeys.forEach((k) => { reordered[k] = categoryStructure[k]; });
        categoryStructure = reordered;
      }
    }

    function catalogHash(t) { t = String(t || '').trim(); if (!t) return 'none'; let x = 5381; for (let i = 0; i < t.length; i++) x = ((x << 5) + x + t.charCodeAt(i)) | 0; return (x >>> 0).toString(16) + ':' + t.length; }
    async function tryLoadCatalog() {
      try {
        const cr = await fetch('catalog.json', { cache: 'no-cache' });
        if (!cr.ok) return false;
        const ct = (await cr.text()).trim();
        if (!ct || ct.toLowerCase().startsWith('<!doctype')) return false;
        const cat = JSON.parse(ct);
        if (!cat || !Array.isArray(cat.categories) || !cat.videos) return false;
        // catalog.json kiểu mới (version >= 3) là nguồn dữ liệu duy nhất -> dùng thẳng, không cần category.json / library-index.json.
        // Kiểu cũ (version < 3): chỉ dùng khi còn khớp với category.json + library-index.json, lệch thì đọc theo cách cũ.
        if (!(cat.version >= 3)) {
          const [ir, kr] = await Promise.all([
            fetch('category.json', { cache: 'no-cache' }).catch(() => null),
            fetch('library-index.json', { cache: 'no-cache' }).catch(() => null)
          ]);
          const txt = async (r) => (r && r.ok) ? (await r.text()) : '';
          const c1 = catalogHash(await txt(ir)), c2 = catalogHash(await txt(kr));
          if (cat.sources && (cat.sources.category !== c1 || cat.sources.libraryIndex !== c2)) { console.warn('catalog.json cũ so với category.json/library-index.json -> dùng cách đọc cũ'); return false; }
        }
        const cs = {}, labels = {}, meta = {}, fmap = {}, pls = {};
        cat.categories.forEach((c) => {
          const o = {}; (c.videos || []).forEach((v) => { o[v.id] = v.title; }); cs[c.id] = o;
          if (c.label) labels[c.id] = c.label;
          // Playlist: chỉ giữ các video thật sự thuộc thể loại này; playlist trống vẫn giữ (hiện "Sắp có video")
          const list = (Array.isArray(c.playlists) ? c.playlists : []).map((p) => ({
            id: String((p && p.id) || ''),
            title: String((p && (p.title || p.name || p.label)) || (p && p.id) || ''),
            videos: ((p && Array.isArray(p.videos)) ? p.videos : []).map((v) => (typeof v === 'string' ? v : (v && v.id))).filter((id) => id && o[id] !== undefined)
          })).filter((p) => p.id);
          if (list.length) pls[c.id] = list;
        });
        Object.keys(cat.videos).forEach((v) => { const m = Object.assign({}, cat.videos[v]); if (m.folder) { fmap[v] = m.folder; delete m.folder; } meta[v] = m; });
        categoryStructure = cs; categoryLabelOverrides = labels; videoMetadataMap = meta; libraryFolderMap = fmap; categoryPlaylists = pls;
        return true;
      } catch (e) { console.warn('Không dùng được catalog.json:', e); return false; }
    }

    async function loadCategoryData() {
      const container = document.getElementById('netflix-categories-container');
      categoryStructure = {};
      categoryLabelOverrides = {};
      categoryPlaylists = {};
      videoMetadataMap = {};
      let legacyOk = false;

      // Hàng "Video Bạn Đã Luyện Gần Đây" đã được hiện ngay từ localStorage trước khi hàm này chạy (không phải đợi mạng).
      // Hai nguồn dữ liệu chạy SONG SONG (trước đây nối đuôi nhau): (1) category.json + videos-data.json, (2) library-index.json + các video-data.json.
      // Bỏ "?t=..." trên URL: vẫn dùng cache:'no-cache' để luôn kiểm tra bản mới, nhưng nếu file không đổi thì server trả 304 (nhẹ) thay vì tải lại cả file.
      const folderTaskStart = () => loadFolderLibrary().catch((e) => { console.warn('Lỗi đọc thư viện dạng thư mục:', e); return []; });

      const legacyTaskStart = () => (async () => {
        const [catRes, dataRes] = await Promise.all([
          fetch('category.json', { cache: 'no-cache' }).catch(() => null),
          fetch('videos-data.json', { cache: 'no-cache' }).catch(() => null)
        ]);
        try {
          if (catRes && catRes.ok) {
            let catText = await catRes.text();
            if (catText && !catText.trim().toLowerCase().startsWith('<!doctype')) {
              catText = catText.replace(/,\s*([\]}])/g, '$1');
              const parsedCat = JSON.parse(catText);
              if (parsedCat && typeof parsedCat === 'object') { categoryLabelOverrides = extractCategoryLabels(parsedCat); categoryStructure = parsedCat; legacyOk = true; }
            }
          }
        } catch (e) { console.warn('Không đọc được category.json (bỏ qua):', e); }

        if (legacyOk) {
          try {
            if (dataRes && dataRes.ok) {
              let dataText = await dataRes.text();
              dataText = dataText.replace(/,\s*([\]}])/g, '$1');
              const fullData = JSON.parse(dataText);
              Object.keys(fullData).forEach(cat => {
                if (typeof fullData[cat] === 'object' && fullData[cat] !== null) {
                  Object.assign(videoMetadataMap, fullData[cat]);
                }
              });
            }
          } catch (e) {
            console.warn('Không tải được videos-data.json, sử dụng tiêu đề từ category.json:', e);
          }
        }
      })();

      // CÁCH NHANH: đọc 1 file catalog.json (do admin.html tạo) thay cho hơn 80 yêu cầu nhỏ.
      // catalog.json kiểu mới là nguồn duy nhất; kiểu cũ thì so "dấu vân tay" của category.json + library-index.json, lệch -> dùng cách cũ.
      const catalogOk = await tryLoadCatalog();
      if (!catalogOk) {
      const folderTask = folderTaskStart(), legacyTask = legacyTaskStart();
      await legacyTask;
      const folderEntries = await folderTask;
      try { if (folderEntries.length) mergeFolderLibrary(folderEntries); }
      catch (e) { console.warn('Lỗi gộp thư viện dạng thư mục:', e); }
      }

      const total = Object.keys(categoryStructure).reduce((a, k) => a + Object.keys(categoryStructure[k] || {}).length, 0);
      if (!total) {
        if (container) {
          container.innerHTML = `
            <div class="text-center py-8 text-slate-400 text-xs bg-slate-900/40 rounded-xl border border-slate-700/50 p-4">
              Thư viện đang trống. Hãy mở admin.html để tạo <strong>catalog.json</strong> (cạnh index.html) từ các thư mục video <strong>_[ID]_[Tên]</strong> trong subs. Hoặc dùng cách cũ: <strong>category.json</strong> / <strong>library-index.json</strong>, đặt cùng thư mục với index.html (phụ đề và thư mục video nằm trong <strong>subs</strong>).
            </div>
          `;
        }
        return;
      }
      slimLibraryHistory();
      renderNetflixCategories();
    }

    function handleLibrarySearch(val) {
      librarySearchKeyword = val.toLowerCase().trim();
      renderNetflixCategories();
    }

    // Tạo HTML cho MỘT hàng "kiểu Netflix" dùng chung cho cả danh mục thư viện lẫn
    // hàng "Video Bạn Đã Luyện Gần Đây" -- cùng 1 kiểu thẻ .yt-card, chỉ khác nguồn
    // dữ liệu và hành vi khi bấm vào thẻ (onClickAttr).
    // Màu glow (aurora nhỏ) sau icon heading, lấy từ lớp màu của danh mục (vd "text-amber-400").
    const ROW_GLOW_COLORS = { amber:'#fbbf24', red:'#ef4444', purple:'#c084fc', emerald:'#34d399', blue:'#60a5fa', pink:'#f472b6',
      lime:'#a3e635', orange:'#fb923c', cyan:'#22d3ee', indigo:'#818cf8', yellow:'#facc15', rose:'#fb7185', teal:'#2dd4bf',
      slate:'#94a3b8', sky:'#38bdf8' };
    function rowGlowColor(colorClass) {
      const m = /text-([a-z]+)-\d+/.exec(colorClass || '');
      return (m && ROW_GLOW_COLORS[m[1]]) || '#60a5fa';
    }



// ==================== MOBILE HAMBURGER MENU ====================
function toggleMobileMenu() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const btn = document.getElementById('btn-mobile-menu');
  if (!drawer) return;
  const isOpening = drawer.classList.contains('hidden');
  if (isOpening) {
    drawer.classList.remove('hidden');
    document.body.classList.add('mobile-nav-open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'true');
      btn.querySelector('.icon-menu-bars')?.classList.add('hidden');
      btn.querySelector('.icon-menu-close')?.classList.remove('hidden');
    }
    // Cập nhật trạng thái active cho item trong mobile drawer
    updateMobileMenuActiveItem();
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  } else {
    closeMobileMenu();
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobile-nav-drawer');
  const btn = document.getElementById('btn-mobile-menu');
  if (!drawer) return;
  drawer.classList.add('hidden');
  document.body.classList.remove('mobile-nav-open');
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.querySelector('.icon-menu-bars')?.classList.remove('hidden');
    btn.querySelector('.icon-menu-close')?.classList.add('hidden');
  }
}

function selectMobileMode(mode) {
  closeMobileMenu();
  if (typeof setInputMode === 'function') {
    setInputMode(mode);
  }
}

function updateMobileMenuActiveItem() {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!drawer) return;
  const activeTab = document.querySelector('.text-mode-toggle button.active');
  const activeMode = activeTab ? activeTab.id.replace('mode-tab-', '') : 'video';
  drawer.querySelectorAll('.mobile-nav-item').forEach(item => {
    if (item.getAttribute('data-mode') === activeMode) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Lắng nghe phím ESC để đóng mobile menu
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeMobileMenu();
});
