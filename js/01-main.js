
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

    // ==================== PLAYLIST + TRANG RIÊNG CỦA TỪNG THỂ LOẠI ====================
    // catalog.json (do admin.html tạo) có thể khai báo "playlists" trong mỗi thể loại. Trang chủ hiện mỗi playlist thành 1 thẻ.
    // Bấm thẻ playlist / tên thể loại / nút "Xem thêm" -> mở TRANG RIÊNG của thể loại ngay trong khung THƯ VIỆN VIDEO
    // (không phải màn hình mới). Link: #/library/<thể loại>  hoặc  #/library/<thể loại>/<playlist> (mở sẵn playlist đó).
    const PL_ICO = {
      chevR: '<path d="m9 18 6-6-6-6"/>',
      chevD: '<path d="m6 9 6 6 6-6"/>',
      arrowL: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
      play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>',
      clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
      list: '<path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/><path d="m16 12 5 3-5 3v-6Z" fill="currentColor"/>'
    };
    const plIco = (n, s = 16, w = 2.2, cls = '') => `<svg ${cls ? `class="${cls}" ` : ''}viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PL_ICO[n]}</svg>`;
    // Chuỗi an toàn để đặt trong onclick="..." (JSON + escape dấu & " <)
    const jsAttr = (s) => JSON.stringify(String(s)).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

    // Icon playlist: nhận diện theo tên (A1/A2 -> icon Beginner, B1/B2 -> icon Intermediate), còn lại dùng icon playlist chung.
    function plIconInfo(p) {
      const t = (p && p.title) || '';
      if (/\bA1\b|\bA2\b/i.test(t)) return { key: 'beginner_pro', glow: '#a3e635' };
      if (/\bB1\b|\bB2\b/i.test(t)) return { key: 'intermediate_pro', glow: '#fb923c' };
      return { key: 'playlist_pro', glow: '#60a5fa' };
    }
    function playlistTotalSeconds(p) { return p.videos.reduce((s, id) => s + (Number((videoMetadataMap[id] || {}).durationSeconds) || 0), 0); }
    function formatTotalDuration(sec) {
      const m = Math.round(sec / 60);
      if (m < 60) return m + ' phút';
      const h = Math.floor(m / 60), r = m % 60;
      return h + ' giờ' + (r ? ' ' + String(r).padStart(2, '0') + ' phút' : '');
    }
    // Icon SVG có gradient dùng id -> khi cùng 1 icon xuất hiện ở trang chủ (đang ẩn) và ở trang riêng thì đổi id để không trùng
    let libIconSeq = 0;
    function uniqSvgIds(svg) {
      const ids = [];
      String(svg).replace(/\bid="([^"]+)"/g, (m, id) => { ids.push(id); return m; });
      if (!ids.length) return svg;
      const sfx = '-lc' + (++libIconSeq);
      let out = String(svg);
      ids.forEach((id) => {
        const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        out = out.replace(new RegExp('id="' + e + '"', 'g'), 'id="' + id + sfx + '"')
                 .replace(new RegExp('url\\(#' + e + '\\)', 'g'), 'url(#' + id + sfx + ')')
                 .replace(new RegExp('href="#' + e + '"', 'g'), 'href="#' + id + sfx + '"');
      });
      return out;
    }

    // Thẻ playlist (cùng kích thước với thẻ video nên nằm chung hàng không bị lệch)
    function buildPlaylistCardHTML(catKey, p) {
      const n = p.videos.length, empty = n === 0;
      const ic = plIconInfo(p);
      const icon = CATEGORY_ICONS[ic.key] || CATEGORY_ICONS.layers_pro;
      const first = empty ? '' : p.videos[0];
      const thumb = empty ? '' : `<img src="https://img.youtube.com/vi/${first}/mqdefault.jpg" alt="" loading="lazy" decoding="async" onerror="this.src='https://img.youtube.com/vi/${first}/0.jpg'" />`;
      const mid = empty
        ? `<div class="pl-empty-msg">${plIco('list', 26, 1.8)}<span>Sắp có video</span><small>Đang được cập nhật</small></div>`
        : `<div class="pl-hover"><span class="pl-open">${plIco('play', 14)} Mở playlist</span></div>`;
      const total = playlistTotalSeconds(p);
      const dur = empty ? 'Chưa có video' : (total > 0 ? formatTotalDuration(total) : n + ' video');
      const attrs = empty
        ? 'aria-disabled="true"'
        : `role="button" tabindex="0" title="Mở playlist ${escHtml(p.title)}" onclick="openLibraryCategory(${jsAttr(catKey)}, ${jsAttr(p.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}"`;
      return `<div class="pl-deck${empty ? ' is-empty' : ''}">
        <div class="yt-card pl-card${empty ? ' is-empty' : ''}" ${attrs}>
          <div class="yt-thumb-wrapper pl-thumb pointer-events-none">${thumb}${mid}
            <div class="pl-side">${plIco('list', 26, 2)}<span class="pl-count">${n}</span><span class="pl-count-unit">video</span></div>
          </div>
          <div class="yt-meta-container pointer-events-none">
            <div class="yt-channel-avatar pl-avatar">${icon}</div>
            <div class="yt-meta-text">
              <h5 class="yt-video-title" title="${escHtml(p.title)}">${escHtml(p.title)}</h5>
              <div class="pl-kind">Playlist</div>
              <div class="pl-dur">${plIco('clock', 13, 2.2)}<span>${dur}</span></div>
            </div>
          </div>
        </div>
      </div>`;
    }

    // opts: { pageCat }   -> hàng của thể loại: tên bấm được + "Xem thêm" mở trang riêng (thay cho xổ xuống tại chỗ)
    //       { extraChip } -> chip phụ cạnh số video (vd "2 playlist")
    //       { iconSvg, glow } -> icon/màu glow tuỳ chọn (hàng playlist trong trang riêng)
    //       { emptyHTML } -> hàng chưa có video: không có nút "Xem thêm" và khung cuộn
    function buildNetflixRowHTML(rowId, iconKey, colorClass, label, countLabel, cardsHTML, headerRightHTML = '', opts = {}) {
      const iconSvg = opts.iconSvg || CATEGORY_ICONS[iconKey] || CATEGORY_ICONS.layers_pro;
      const glow = opts.glow || rowGlowColor(colorClass);
      const isPage = opts.pageCat !== undefined && opts.pageCat !== null;
      const titleHTML = isPage
        ? `<h4 class="text-[0.7rem] sm:text-[0.85rem] font-extrabold text-white tracking-wide row-title-link" role="link" tabindex="0" title="Mở trang riêng của mục này" onclick="openLibraryCategory(${jsAttr(opts.pageCat)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">${label}<span class="rt-arrow">${plIco('chevR', 16, 2.6)}</span></h4>`
        : (opts.toggleRow && !opts.emptyHTML
          ? `<h4 class="text-[0.7rem] sm:text-[0.85rem] font-extrabold text-white tracking-wide row-title-link row-title-toggle" role="button" tabindex="0" aria-expanded="false" title="Bấm để mở rộng / thu gọn playlist" onclick="toggleRowExpand('${rowId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}">${label}<span class="rt-chev">${plIco('chevD', 16, 2.6)}</span></h4>`
          : `<h4 class="text-[0.7rem] sm:text-[0.85rem] font-extrabold text-white tracking-wide">${label}</h4>`);
      const moreBtn = opts.emptyHTML ? '' : (isPage
        ? `<button type="button" class="row-more-btn show" data-page="1" onclick="openLibraryCategory(${jsAttr(opts.pageCat)})" title="Mở trang riêng của mục này"><span class="rm-label">Xem thêm</span>${plIco('chevR', 14, 2.6)}</button>`
        : `<button type="button" class="row-more-btn" data-row="${rowId}" onclick="toggleRowExpand('${rowId}')" title="Hiện tất cả các mục trong hàng này" aria-expanded="false">
              <span class="rm-label">Xem thêm</span>
              <svg class="rm-chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>`);
      const body = opts.emptyHTML ? opts.emptyHTML : `
        <div class="relative group/row">
          <button
            type="button"
            onclick="scrollNetflixRow('${rowId}', -1)"
            class="netflix-nav-btn prev btn-interactive"
            title="Cuộn sang trái"
          >
            <i data-lucide="chevron-left" class="w-5 h-5"></i>
          </button>

          <div id="${rowId}" class="netflix-scroll-row">
            ${cardsHTML}
          </div>

          <button
            type="button"
            onclick="scrollNetflixRow('${rowId}', 1)"
            class="netflix-nav-btn next btn-interactive"
            title="Cuộn sang phải"
          >
            <i data-lucide="chevron-right" class="w-5 h-5"></i>
          </button>
        </div>
      `;
      return `
        <div class="row-head flex items-center justify-between px-1">
          <div class="flex items-center gap-3">
            <span class="cat-row-ico" style="--ico-glow:${glow}">
              ${iconSvg}
            </span>
            <div class="row-head-txt">
              ${titleHTML}
              <span class="px-2.5 py-0.5 rounded-full bg-slate-800/90 text-xs font-mono text-slate-300 border border-slate-700 font-semibold">${countLabel}</span>
              ${opts.extraChip || ''}
            </div>
          </div>
          <div class="flex items-center gap-3">
            ${headerRightHTML}
            ${moreBtn}
          </div>
        </div>
        ${body}
      `;
    }

    // ---------- Trang riêng của thể loại ----------
    const LIB_RECENT = '__recent';   // "thể loại" đặc biệt: trang riêng liệt kê toàn bộ video bạn đã luyện (#/library/__recent)
    let libCatState = null;      // { cat, pl } khi trang riêng đang mở, null khi đang ở danh sách thể loại
    let libReturnY = 0;          // vị trí cuộn của trang chủ trước khi mở trang riêng (để trả về khi đóng)
    let libPageRowIds = [];
    const libSafe = (s) => String(s).replace(/[^\w-]/g, '_');

    function libVideoCardsHTML(catKey, ids) {
      const titles = categoryStructure[catKey] || {};
      return ids.map((vid) => {
        const d = videoMetadataMap[vid] || {};
        const title = d.title || titles[vid] || vid;
        const onClick = `selectCategoryVideo(${jsAttr(vid)}, ${jsAttr(title)}, 'cp-')`;
        return buildYtCardHTML(vid, escHtml(title), escHtml(d.channelTitle || 'YouTube Channel'), d.channelAvatar ? escHtml(d.channelAvatar) : '', d.duration || '', d.viewCount ? formatViews(d.viewCount) : '', onClick, { idPrefix: 'cp-' });
      }).join('');
    }

    function buildLibraryCategoryPageHTML(catKey) {
      const entries = Object.entries(categoryStructure[catKey] || {});
      const meta = getCategoryMeta(catKey) || { label: String(catKey).replace(/_/g, ' ').toUpperCase(), iconKey: 'layers_pro', color: 'text-blue-400' };
      const label = escHtml(categoryLabelOverrides[catKey] || meta.label);
      const pls = categoryPlaylists[catKey] || [];
      const inPl = new Set();
      pls.forEach((p) => p.videos.forEach((id) => inPl.add(id)));
      const loose = entries.map((e) => e[0]).filter((id) => !inPl.has(id));
      libPageRowIds = [];

      const emptyBlock = (title, sub) => `<div class="empty-row">${plIco('list', 22, 1.9)}<div><b>${title}</b><span>${sub}</span></div></div>`;
      const rowSection = (key, iconSvg, glow, title, ids, emptyHTML) => {
        const rowId = 'cp-row-' + libSafe(key);
        if (!emptyHTML) libPageRowIds.push(rowId);
        return `<section class="netflix-row-wrapper relative flex flex-col gap-3 my-2" id="cp-sec-${libSafe(key)}">${buildNetflixRowHTML(rowId, '', '', escHtml(title), `${ids.length} video`, emptyHTML ? '' : libVideoCardsHTML(catKey, ids), '', { iconSvg: uniqSvgIds(iconSvg), glow, emptyHTML, toggleRow: true })}</section>`;
      };

      let body = '';
      if (pls.length) {
        body += pls.map((p) => {
          const ic = plIconInfo(p);
          return rowSection(p.id, CATEGORY_ICONS[ic.key] || CATEGORY_ICONS.layers_pro, ic.glow, p.title, p.videos,
            p.videos.length ? '' : emptyBlock('Playlist này chưa có video', 'Video sẽ xuất hiện ở đây ngay khi được thêm vào.'));
        }).join('');
        if (loose.length) body += rowSection('__loose', CATEGORY_ICONS.layers_pro, '#94a3b8', 'Video khác', loose, '');
      } else if (entries.length) {
        // Thể loại chưa chia playlist: xổ sẵn toàn bộ video thành lưới, không cần "Xem thêm"
        body = `<section class="netflix-row-wrapper is-expanded flat relative my-2"><div class="netflix-scroll-row">${libVideoCardsHTML(catKey, entries.map((e) => e[0]))}</div></section>`;
      } else {
        body = emptyBlock('Mục này chưa có video', 'Video sẽ xuất hiện ở đây ngay khi được thêm vào.');
      }

      const stats = (pls.length ? `<span class="pl-chip">${pls.length} playlist</span>` : '') + `<span class="cat-chip">${entries.length} video</span>`;
      return `
        <div class="lib-page-top"><button type="button" class="lib-back-btn" onclick="closeLibraryCategory()">${plIco('arrowL', 14, 2.6)}<span>Thư viện video</span></button></div>
        <header class="cat-hero">
          <div class="cat-hero-main"><span class="cat-hero-ico lib-ico-glow" style="--ico-glow:${rowGlowColor(meta.color)}">${uniqSvgIds(CATEGORY_ICONS[meta.iconKey] || CATEGORY_ICONS.layers_pro)}</span><h1 class="cat-title">${label}</h1></div>
          <div class="cat-stats">${stats}</div>
        </header>
        <div class="hero-rule"></div>
        <div class="lib-cat-rows">${body}</div>`;
    }

    // Trang riêng "Video Bạn Đã Luyện Gần Đây": toàn bộ video đã luyện, xổ sẵn thành lưới (giống trang của một thể loại chưa chia playlist)
    function buildRecentPageHTML() {
      const items = getLocalHistory().filter((h) => !h.isText);
      libPageRowIds = [];
      const ico = uniqSvgIds(CATEGORY_ICONS.history_pro || CATEGORY_ICONS.layers_pro);
      return `
        <div class="lib-page-top"><button type="button" class="lib-back-btn" onclick="closeLibraryCategory()">${plIco('arrowL', 14, 2.6)}<span>Thư viện video</span></button></div>
        <header class="cat-hero">
          <div class="cat-hero-main"><span class="cat-hero-ico lib-ico-glow" style="--ico-glow:${rowGlowColor('text-sky-400')}">${ico}</span><h1 class="cat-title">Video Bạn Đã Luyện Gần Đây</h1></div>
          <div class="cat-stats"><span class="cat-chip">${items.length} video</span><button type="button" onclick="clearAllHistory()" class="text-[11px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer">Xóa tất cả</button></div>
        </header>
        <div class="hero-rule"></div>
        <div class="lib-cat-rows"><section class="netflix-row-wrapper is-expanded flat relative my-2"><div class="netflix-scroll-row">${recentHistoryCardsHTML(items, 'hp-')}</div></section></div>`;
    }

    // Lịch sử đổi (xoá video, xoá tất cả, vừa luyện xong...) khi trang này đang mở -> vẽ lại danh sách, giữ nguyên vị trí cuộn
    window.libRefreshRecentPage = function () {
      if (!libCatState || libCatState.cat !== LIB_RECENT) return;
      if (!getLocalHistory().some((h) => !h.isText)) { closeLibraryCategory(); return; }
      const page = document.getElementById('library-cat-page');
      if (!page) return;
      const y = window.scrollY;
      page.innerHTML = buildRecentPageHTML();
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      window.scrollTo({ top: y, behavior: 'instant' });
    };

    function libFocusPlaylist(plId) {
      const w = document.getElementById('cp-sec-' + libSafe(plId));
      if (!w) return;
      if (window.setRowExpanded) window.setRowExpanded('cp-row-' + libSafe(plId), true);   // mở sẵn như khi bấm "Xem thêm"
      w.scrollIntoView({ behavior: 'instant', block: 'start' });   // nhảy thẳng tới playlist, không trượt từ đầu trang xuống
      w.classList.remove('is-focus'); void w.offsetWidth; w.classList.add('is-focus');
      setTimeout(() => w.classList.remove('is-focus'), 2700);
    }

    function libCollapsePageRows() {
      if (!window.setRowExpanded) return;
      libPageRowIds.forEach((id) => window.setRowExpanded(id, false, true));
    }

    function openLibraryCategory(catKey, plId) {
      const wrap = document.querySelector('.lib-wrap');
      const page = document.getElementById('library-cat-page');
      if (!wrap || !page) return false;
      if (catKey !== LIB_RECENT && (!categoryStructure || !categoryStructure[catKey])) return false;
      if (!wrap.classList.contains('cat-open')) libReturnY = window.scrollY;
      libCollapsePageRows();
      libCatState = { cat: catKey, pl: plId || '' };
      page.innerHTML = catKey === LIB_RECENT ? buildRecentPageHTML() : buildLibraryCategoryPageHTML(catKey);
      wrap.classList.add('cat-open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      window.scrollTo({ top: Math.max(0, wrap.getBoundingClientRect().top + window.scrollY - 12), behavior: 'instant' });
      if (window.homeNavRefresh) window.homeNavRefresh();
      if (plId) libFocusPlaylist(plId);   // đồng bộ, trước khung hình đầu tiên: trang mở ra là thấy ngay playlist, không có chuyển động cuộn
      requestAnimationFrame(() => {
        if (window.syncHomeMore) window.syncHomeMore();
      });
      if (window.__routerSync) window.__routerSync();
      return true;
    }

    function closeLibraryCategory() {
      const wrap = document.querySelector('.lib-wrap');
      const page = document.getElementById('library-cat-page');
      if (!wrap || !wrap.classList.contains('cat-open')) return;
      libCollapsePageRows();
      wrap.classList.remove('cat-open');
      libCatState = null;
      libPageRowIds = [];
      if (page) page.innerHTML = '';
      window.scrollTo({ top: libReturnY, behavior: 'instant' });
      if (window.homeNavRefresh) window.homeNavRefresh();
      requestAnimationFrame(() => {
        if (window.syncHomeMore) window.syncHomeMore();
        if (typeof homeScheduleFill === 'function') homeScheduleFill();
      });
      if (window.__routerSync) window.__routerSync();
    }

    // Router dùng 2 hàm này (link #/library/...)
    window.libCatRoute = function () {
      if (!libCatState) return '';
      return '/library/' + encodeURIComponent(libCatState.cat) + (libCatState.pl ? '/' + encodeURIComponent(libCatState.pl) : '');
    };
    window.libOpenFromRoute = function (cat, pl) {
      if (cat !== LIB_RECENT && (!categoryStructure || !categoryStructure[cat])) { closeLibraryCategory(); return false; }
      if (libCatState && libCatState.cat === cat && libCatState.pl === (pl || '')) return true;   // đang đúng trang này rồi (vd. quay lại từ video) -> giữ nguyên vị trí cuộn
      return openLibraryCategory(cat, pl);
    };

    // Tạo HTML cho MỘT thẻ video kiểu Netflix (.yt-card). onClickAttr là chuỗi JS
    // sẽ chạy khi bấm thẻ -- khác nhau giữa video thư viện (selectCategoryVideo) và
    // video trong lịch sử đã luyện (loadFromHistory).
    function buildArticleCardHTML(articleId, title) {
      const safeTitle = String(title || articleId).replace(/'/g, "\\'");
      return `
        <div
          onclick="selectCategoryArticle('${articleId}', '${safeTitle}')"
          class="article-card btn-interactive"
        >
          <span class="article-icon">
            <i data-lucide="file-text" class="w-4.5 h-4.5"></i>
          </span>
          <span class="article-title">${escHtml(title || articleId)}</span>
        </div>
      `;
    }

    // Ảnh đầu tiên xuất hiện trong bài (bài import từ extension có kèm ảnh) -> dùng làm thumbnail của thẻ
    function txtFirstImageRef(item) {
      const ss = (item && item.sentences) || [];
      for (let i = 0; i < ss.length; i++) {
        const imgs = ss[i] && ss[i].imgs;
        if (!imgs || !imgs.length) continue;
        const r = imgs.find((x) => x && (x.k || x.u));
        if (r) return r;
      }
      return null;
    }

    // Thẻ bài văn bản: cùng khung với thẻ video. Thumbnail = ảnh đầu bài; không có ảnh thì hiện chính tiêu đề bài.
    function buildTextHistoryCardHTML(item) {
      const id = String(item.videoId).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const n = item.sentences ? item.sentences.length : 0;
      const hasVi = aicHasTranslation(item.sentences);
      const title = String(item.title || '').trim() || deriveTextTitle(item.sentences);
      const ref = txtFirstImageRef(item);
      const imgHTML = ref
        ? `<img class="txt-thumb-img" alt="" decoding="async" referrerpolicy="no-referrer" />`
        : '';
      const dataAttrs = ref ? ` data-k="${escHtml(ref.k || '')}" data-u="${escHtml(ref.u || '')}"` : '';
      return `
        <div onclick="loadFromHistory('${id}')" class="yt-card txt-card btn-interactive" title="Mở lại để luyện tiếp">
          <button type="button" class="yt-card-remove" title="Xóa khỏi lịch sử" onclick="removeHistoryItem('${id}', event)"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          <div class="yt-thumb-wrapper txt-thumb pointer-events-none"${dataAttrs}>
            <span class="txt-thumb-quote">“</span>
            <div class="txt-thumb-title"><span>${escHtml(title)}</span></div>
            ${imgHTML}
          </div>
          <div class="yt-meta-container pointer-events-none">
            <div class="yt-channel-avatar"><i data-lucide="file-text" class="w-4 h-4"></i></div>
            <div class="yt-meta-text">
              <h5 class="yt-video-title" title="${escHtml(title)}">${escHtml(title)}</h5>
              <div class="yt-channel-name">${n} câu</div>
              <div class="yt-views-date"><span>${hasVi ? 'Có song ngữ' : 'Chưa có song ngữ'}</span></div>
            </div>
          </div>
        </div>
      `;
    }

    // Nạp ảnh thumbnail cho các thẻ văn bản (ảnh nằm trong IndexedDB nên phải nạp bất đồng bộ).
    // Chưa nạp được / không có ảnh -> giữ nguyên tiêu đề làm thumbnail.
    function hydrateTextThumbs(root) {
      (root || document).querySelectorAll('.txt-thumb[data-k], .txt-thumb[data-u]').forEach((wrap) => {
        if (wrap.dataset.hyd) return;
        wrap.dataset.hyd = '1';
        const img = wrap.querySelector('img.txt-thumb-img');
        if (!img) return;
        const k = wrap.dataset.k || '', u = wrap.dataset.u || '';
        let triedRemote = false;
        const useRemote = () => {
          if (u && !triedRemote) { triedRemote = true; img.src = u; }
          else wrap.classList.remove('has-img');
        };
        img.onload = () => wrap.classList.add('has-img');
        img.onerror = () => useRemote();
        if (k) {
          Promise.resolve().then(() => txiGet(k)).then((d) => { if (d) img.src = d; else useRemote(); }).catch(useRemote);
        } else {
          useRemote();
        }
      });
    }

    function buildYtCardHTML(vid, title, channelTitle, channelAvatar, durationStr, viewsStr, onClickAttr, opts = {}) {
      const P = opts.idPrefix || '';
      const avatarInitial = (channelTitle || title).trim().substring(0, 2).toUpperCase();
      const thumbUrl = `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
      return `
        <div
          id="${P}lib-card-${vid}"
          onclick="${onClickAttr}"
          class="yt-card btn-interactive${(window.__loadingCard && window.__loadingCard.vid === vid && window.__loadingCard.prefix === P) ? ' is-loading' : ''}"
        >
          ${opts.removable ? `<button type="button" class="yt-card-remove" title="Xóa khỏi lịch sử" onclick="removeHistoryItem('${vid}', event)"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
          <div class="yt-thumb-wrapper pointer-events-none">
            <img src="${thumbUrl}" alt="thumbnail" loading="lazy" decoding="async" onerror="this.src='https://img.youtube.com/vi/${vid}/0.jpg'" />
            <span id="${P}video-dur-${vid}" class="yt-duration-badge ${durationStr ? '' : 'hidden'}">${durationStr || '--:--'}</span>
            <div class="yt-card-loading-overlay"><span class="yt-card-loading-spinner"></span><span>Đang mở...</span></div>
          </div>

          <div class="yt-meta-container pointer-events-none">
            <div id="${P}video-avatar-${vid}" class="yt-channel-avatar">
              ${channelAvatar ? `<img src="${channelAvatar}" alt="${channelTitle}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" /><span style="display:none;">${avatarInitial}</span>` : `<span>${avatarInitial}</span>`}
            </div>
            <div class="yt-meta-text">
              <h5 class="yt-video-title" title="${title}">${title}</h5>
              <div id="${P}video-channel-${vid}" class="yt-channel-name">${channelTitle}</div>
              <div class="yt-views-date">
                <span id="${P}video-views-${vid}">${viewsStr ? viewsStr : '-- lượt xem'}</span>
              </div>
            </div>
          </div>

          <div id="${P}lib-card-error-${vid}" class="hidden text-[10px] text-red-300 bg-red-950/80 border border-red-800/80 p-1.5 rounded-lg"></div>
        </div>
      `;
    }

    // Hàng "Văn bản Bạn Đã Luyện" nằm ở tab "Đọc báo/IELTS" (không còn nằm trong THƯ VIỆN VIDEO)
    function renderTextHistoryRow() {
      const box = document.getElementById('text-history-container');
      if (!box) return;
      const textHistory = getLocalHistory().filter((h) => h.isText && h.sentences && h.sentences.length);
      box.innerHTML = '';
      if (textHistory.length > 0) {
        const rowContainer = document.createElement('div');
        rowContainer.className = 'netflix-row-wrapper relative flex flex-col gap-3 my-2';
        rowContainer.innerHTML = buildNetflixRowHTML('netflix-row-text-history', 'article_pro', 'text-teal-400', 'Văn bản Bạn Đã Luyện', `${textHistory.length}`, textHistory.map((item) => buildTextHistoryCardHTML(item)).join(''));
        box.appendChild(rowContainer);
      }
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      setTimeout(() => {
        hydrateTextThumbs(box);                                   // ảnh thumbnail của thẻ "Văn bản Bạn Đã Luyện"
        if (window.syncHomeMore) window.syncHomeMore();           // nút "Xem thêm" của hàng
      }, 0);
      if (window.renderArticleLibrary) window.renderArticleLibrary(true);   // cập nhật nhãn "Chưa đọc / Có song ngữ" trên thẻ bài có sẵn
    }

    // ==================== TRANG CHỦ TẢI LƯỜI ====================
    // Khi vào trang chủ chỉ dựng đầy đủ: hàng "Video Bạn Đã Luyện Gần Đây" (nếu có) + HOME_EAGER_ROWS hàng thể loại đầu tiên.
    // Các hàng còn lại chỉ dựng "vỏ" (tiêu đề + khung chờ cùng kích thước thẻ thật, KHÔNG có ảnh/dữ liệu) để thanh điều hướng
    // vẫn liệt kê đủ mọi mục và thanh cuộn đúng độ dài; thẻ video thật chỉ được dựng khi người dùng cuộn tới gần (hoặc bấm nhảy tới mục đó).
    const HOME_EAGER_ROWS = 3;
    let homeLazyRows = new Map();   // rowId -> { catKey, entries, filling, filled }
    let homeJump = null;            // đang nhảy bằng thanh điều hướng: { w: hàng đích | null }
    let homeJumpTimer = 0;
    let homeFillRaf = 0;

    function homeSkeletonCardsHTML(count) {
      const card = `
        <div class="yt-card yt-skel" aria-hidden="true">
          <div class="yt-thumb-wrapper"></div>
          <div class="yt-meta-container">
            <div class="yt-channel-avatar"></div>
            <div class="yt-meta-text">
              <h5 class="yt-video-title">&nbsp;<br>&nbsp;</h5>
              <div class="yt-channel-name">&nbsp;</div>
              <div class="yt-views-date">&nbsp;</div>
            </div>
          </div>
        </div>`;
      return card.repeat(Math.max(1, Math.min(count, 6)));
    }

    // HTML các thẻ của một danh mục thư viện (dùng cho cả hàng dựng sẵn lẫn hàng tải lười)
    function buildCategoryCardsHTML(catKey, entries) {
      return entries.map(([vid, catTitle, pl]) => {
        if (pl) return buildPlaylistCardHTML(catKey, pl);   // thẻ playlist (xem buildPlaylistCardHTML)
        const detail = videoMetadataMap[vid] || {};
        const title = detail.title || catTitle || vid;
        if (catKey === 'Article') {
          return buildArticleCardHTML(vid, title);
        }
        const viewsStr = detail.viewCount ? formatViews(detail.viewCount) : '';
        const channelTitle = detail.channelTitle || 'YouTube Channel';
        const channelAvatar = detail.channelAvatar || '';
        const durationStr = detail.duration || '';
        const onClickAttr = `selectCategoryVideo('${vid}', '${title.replace(/'/g, "\\'")}')`;
        return buildYtCardHTML(vid, title, channelTitle, channelAvatar, durationStr, viewsStr, onClickAttr);
      }).join('');
    }

    function recentHistoryCardsHTML(items, idPrefix) {
      return items.map((item) => {
        const meta = Object.assign({}, item.meta || {}, videoMetadataMap[item.videoId] || {});
        const title = escHtml(item.title || meta.title || item.videoId);
        const durationStr = item.duration > 0 ? formatDurationLabel(item.duration) : (meta.duration || '');
        const onClickAttr = `loadFromHistory('${item.videoId}')`;
        const channelTitle = escHtml(meta.channelTitle || 'Video bạn đã luyện');
        const viewsStr = meta.viewCount ? formatViews(meta.viewCount) : (item.sentences && item.sentences.length ? `${item.sentences.length} câu phụ đề` : '');
        return buildYtCardHTML(item.videoId, title, channelTitle, escHtml(meta.channelAvatar || ''), durationStr, viewsStr, onClickAttr, { idPrefix: idPrefix, removable: true });
      }).join('');
    }

    // Hàng "VIDEO BẠN ĐÃ LUYỆN GẦN ĐÂY" — luôn ở đầu danh sách, chỉ có khi người dùng đã từng luyện ít nhất 1 video
    // (lịch sử nằm trong localStorage). Trả về phần tử hàng, hoặc null nếu không có gì để hiện.
    function buildRecentHistoryWrapper() {
      const recentHistory = getLocalHistory().filter((h) => !h.isText);
      const filteredHistory = recentHistory.filter((item) => {
        if (!librarySearchKeyword) return true;
        const title = (item.title || '').toLowerCase();
        return title.includes(librarySearchKeyword) || item.videoId.toLowerCase().includes(librarySearchKeyword);
      });
      if (!filteredHistory.length) return null;
      const cardsHTML = recentHistoryCardsHTML(filteredHistory, 'hist-');
      const clearAllBtn = `<button type="button" onclick="clearAllHistory()" class="text-[11px] text-slate-500 hover:text-red-400 transition-colors cursor-pointer">Xóa tất cả</button>`;
      const rowContainer = document.createElement('div');
      rowContainer.className = 'netflix-row-wrapper relative flex flex-col gap-3 my-2';
      rowContainer.dataset.recent = '1';
      rowContainer.innerHTML = buildNetflixRowHTML('netflix-row-recent-history', 'history_pro', 'text-sky-400', 'Video Bạn Đã Luyện Gần Đây', `${filteredHistory.length}`, cardsHTML, clearAllBtn, { pageCat: LIB_RECENT });
      return rowContainer;
    }

    // Làm mới RIÊNG hàng "Video Bạn Đã Luyện Gần Đây" mà không đụng tới phần còn lại của thư viện (nhẹ, dùng khi
    // lịch sử đổi hoặc khi quay lại trang chủ). Chạy được cả khi thư viện chưa nạp xong.
    function renderRecentHistoryRow() {
      const container = document.getElementById('netflix-categories-container');
      if (!container) return;
      const old = container.querySelector(':scope > .netflix-row-wrapper[data-recent="1"]');
      const fresh = buildRecentHistoryWrapper();
      if (fresh) {   // chữ ký nội dung hàng: giống hệt lần trước thì giữ nguyên DOM cũ (không dựng lại, không đo lại)
        fresh.dataset.sig = Array.from(fresh.querySelectorAll('.yt-card')).map((c) => c.id + '|' + ((c.querySelector('.yt-video-title') || {}).textContent || '')).join('~') + '#' + librarySearchKeyword;
        if (old && old.dataset.sig === fresh.dataset.sig) return;
      }
      if (old && fresh) old.replaceWith(fresh);
      else if (old) old.remove();
      else if (fresh) container.prepend(fresh);
      else return;   // không có gì đổi
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      const home = document.getElementById('screen-input');
      if (home && home.classList.contains('hidden')) { homeNavDirty = true; return; }   // đang ẩn: không ép trình duyệt tính layout cho trang đang ẩn; làm sau khi hiện
      if (typeof refreshHomeNav === 'function') refreshHomeNav();
    }

    function renderNetflixCategories() {
      renderTextHistoryRow();
      const container = document.getElementById('netflix-categories-container');
      const totalCountEl = document.getElementById('library-total-count');
      if (!container || !categoryStructure) return;

      container.innerHTML = '';
      homeLazyRows = new Map();
      let totalVideos = 0;
      Object.keys(categoryStructure).forEach(catKey => {
        totalVideos += Object.keys(categoryStructure[catKey] || {}).length;
      });
      if (totalCountEl) totalCountEl.textContent = totalVideos;

      let renderedAnyCategory = false;
      const frag = document.createDocumentFragment();

      const recentWrapper = buildRecentHistoryWrapper();
      if (recentWrapper) { renderedAnyCategory = true; frag.appendChild(recentWrapper); }

      let catIndex = 0;
      Object.keys(categoryStructure).forEach(catKey => {
        const videosObj = categoryStructure[catKey] || {};
        const videoEntries = Object.entries(videosObj);
        // Playlist chỉ hiện khi KHÔNG đang tìm kiếm (đang tìm thì hiện thẳng các video khớp như trước)
        const plAll = (catKey === 'Article' || librarySearchKeyword) ? [] : (categoryPlaylists[catKey] || []);
        if (videoEntries.length === 0 && !plAll.length) return;

        const filteredEntries = videoEntries.filter(([vid, catTitle]) => {
          const detail = videoMetadataMap[vid] || {};
          const title = detail.title || catTitle || '';
          const channel = detail.channelTitle || '';
          if (!librarySearchKeyword) return true;
          return title.toLowerCase().includes(librarySearchKeyword) ||
                 channel.toLowerCase().includes(librarySearchKeyword) ||
                 vid.toLowerCase().includes(librarySearchKeyword);
        });
        if (filteredEntries.length === 0 && !plAll.length) return;

        renderedAnyCategory = true;

        const meta = getCategoryMeta(catKey) || {
          label: catKey.replace(/_/g, ' ').toUpperCase(),
          iconKey: 'layers_pro',
          color: 'text-blue-400'
        };

        const rowContainer = document.createElement('div');
        rowContainer.className = 'netflix-row-wrapper relative flex flex-col gap-3 my-2';
        const rowId = `netflix-row-${catKey}`;

        // Hàng bài viết (chỉ chữ, không ảnh) luôn dựng luôn vì rất nhẹ; các hàng video từ hàng thứ HOME_EAGER_ROWS + 1 trở đi để tải lười.
        const eager = catKey === 'Article' || catIndex < HOME_EAGER_ROWS;
        catIndex++;
        // Mỗi hàng = các thẻ playlist (nếu có) rồi tới các video chưa thuộc playlist nào
        const inPl = new Set();
        plAll.forEach((p) => p.videos.forEach((id) => inPl.add(id)));
        const rowEntries = plAll.map((p) => ['', p.title, p]).concat(plAll.length ? filteredEntries.filter(([vid]) => !inPl.has(vid)) : filteredEntries);
        const cardsHTML = eager ? buildCategoryCardsHTML(catKey, rowEntries) : homeSkeletonCardsHTML(rowEntries.length);
        if (!eager) {
          rowContainer.dataset.lazy = '1';
          homeLazyRows.set(rowId, { catKey, entries: rowEntries, filling: false, filled: false });
        }

        const rowLabel = categoryLabelOverrides[catKey] ? escHtml(categoryLabelOverrides[catKey]) : meta.label;   // ưu tiên tên khai báo trong category.json
        const rowOpts = (catKey === 'Article') ? {} : { pageCat: catKey, extraChip: plAll.length ? `<span class="pl-chip">${plAll.length} playlist</span>` : '' };
        rowContainer.innerHTML = buildNetflixRowHTML(rowId, meta.iconKey, meta.color, rowLabel, `${filteredEntries.length}`, cardsHTML, '', rowOpts);
        frag.appendChild(rowContainer);
      });

      container.appendChild(frag);

      if (!renderedAnyCategory) {
        container.innerHTML = `
          <div class="text-center py-10 text-slate-400 text-xs sm:text-sm">
            Không tìm thấy video nào khớp với từ khóa "<strong>${librarySearchKeyword}</strong>".
          </div>
        `;
      }

      if (typeof refreshHomeNav === 'function') refreshHomeNav();   // cập nhật thanh điều hướng (liệt kê đủ mọi hàng, kể cả hàng chưa tải) + nút "Xem thêm"

      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons();
      }
      homeScheduleFill();
    }

    // Dựng thẻ thật cho một hàng đang là khung chờ. Thẻ đầu (vừa đủ lấp khung nhìn) dựng ngay, phần còn lại dựng dần
    // theo từng khung hình để không treo giao diện khi hàng có nhiều video.
    function fillHomeRow(rowId) {
      const st = homeLazyRows.get(rowId);
      if (!st || st.filling || st.filled) return;
      const row = document.getElementById(rowId);
      if (!row) return;
      st.filling = true;
      const w = row.closest('.netflix-row-wrapper');
      if (w) w.removeAttribute('data-lazy');
      row.innerHTML = '';
      let i = 0;
      const step = () => {
        if (homeLazyRows.get(rowId) !== st || !row.isConnected) return;   // trang chủ đã vẽ lại trong lúc chờ
        const n = i === 0 ? 4 : 8;
        row.insertAdjacentHTML('beforeend', buildCategoryCardsHTML(st.catKey, st.entries.slice(i, i + n)));
        i += n;
        if (i < st.entries.length) { requestAnimationFrame(step); return; }
        st.filled = true; st.filling = false;
        if (window.syncHomeMore) window.syncHomeMore();
      };
      step();
    }

    // Dựng thẻ cho các hàng chưa tải mà đang nằm trong/gần khung nhìn (cách ~1 màn hình).
    function homeFillVisible() {
      if (!homeLazyRows.size || homeJump) return;    // đang nhảy bằng thanh điều hướng: chỉ hàng đích được dựng (xem homeBeforeJump)
      const home = document.getElementById('screen-input');
      if (!home || home.classList.contains('hidden')) return;
      const vh = window.innerHeight;
      homeLazyRows.forEach((st, rowId) => {
        if (st.filling || st.filled) return;
        const row = document.getElementById(rowId);
        if (!row || row.offsetParent === null) return;   // đang ẩn (tab khác / màn hình luyện tập)
        const r = row.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        fillHomeRow(rowId);
      });
    }
    window.homeFillVisible = homeFillVisible;
    function homeScheduleFill() {
      if (homeFillRaf) return;
      homeFillRaf = requestAnimationFrame(() => { homeFillRaf = 0; homeFillVisible(); });
    }

    // Thanh điều hướng bấm nhảy tới một mục: dựng NGAY khung (đã có sẵn) + thẻ của hàng đích; các hàng nằm giữa đường cuộn
    // KHÔNG dựng (tránh giật), đợi cuộn xong mới dựng những hàng đang nằm trong khung nhìn.
    function endHomeJump() {
      clearTimeout(homeJumpTimer);
      const j = homeJump;
      homeJump = null;
      document.documentElement.classList.remove('home-jumping');
      // Cuộn xong mới dựng thẻ: hàng đích trước, rồi tới các hàng khác đang nằm gần khung nhìn
      if (j && j.w && j.w.dataset.lazy === '1') { const row = j.w.querySelector('.netflix-scroll-row'); if (row) fillHomeRow(row.id); }
      homeScheduleFill();
    }
    function armHomeJumpEnd(ms) { clearTimeout(homeJumpTimer); homeJumpTimer = setTimeout(endHomeJump, ms); }
    window.homeBeforeJump = function (w) {
      // Trong lúc trang đang cuộn mượt tới mục đó, KHÔNG làm thêm việc nặng nào (không dựng thẻ, không nạp ảnh, không chạy hiệu ứng khung chờ)
      // -> chuyển động không bị khựng. Người dùng vẫn thấy ngay tiêu đề + các khung chờ ở hàng đích; thẻ thật hiện ra ngay sau khi cuộn xong.
      // Kết thúc khi trang ĐẾN NƠI (so vị trí cuộn với đích) chứ không dựa vào "im lặng một lúc": nếu máy đang giật khiến cuộn khựng
      // vài trăm mili-giây thì cũng không bị tính nhầm là đã cuộn xong rồi dựng thẻ giữa đường.
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = w ? Math.min(maxY, Math.max(0, w.getBoundingClientRect().top + window.scrollY - 20)) : 0;
      homeJump = { w: w || null, y };
      document.documentElement.classList.add('home-jumping');
      if (Math.abs(window.scrollY - y) <= 2) armHomeJumpEnd(0); else armHomeJumpEnd(1500);   // 1500ms chỉ là lưới an toàn nếu không có sự kiện nào báo đã tới nơi
    };
    window.addEventListener('scroll', () => {
      if (homeJump) { if (Math.abs(window.scrollY - homeJump.y) <= 2) armHomeJumpEnd(60); else armHomeJumpEnd(1500); }
      homeScheduleFill();
    }, { passive: true });
    window.addEventListener('scrollend', () => { if (homeJump) endHomeJump(); });
    window.addEventListener('resize', homeScheduleFill);
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { if (homeJump) endHomeJump(); }, { passive: true }));

    function scrollNetflixRow(rowId, direction) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const scrollAmount = row.clientWidth * 0.75 * direction;
      row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    let isSelectingVideo = false;   // chặn bấm dồn dập trong lúc một video khác đang được tải

    async function selectCategoryVideo(videoId, videoTitle, cardPrefix) {
      if (isSelectingVideo) {
        showVocabToast('Đang mở video khác, vui lòng đợi xong đã nhé', false);
        return false;
      }
      isSelectingVideo = true;
      pendingUserVi = false;

      // cardPrefix = '' (thẻ trong thư viện) hoặc 'hist-' (thẻ ở hàng "Video Bạn Đã Luyện Gần Đây"): vòng xoay hiện đúng thẻ người dùng vừa bấm
      const cp = cardPrefix || '';
      window.__loadingCard = { vid: videoId, prefix: cp };
      const card = document.getElementById(`${cp}lib-card-${videoId}`);
      const errorContainer = document.getElementById(`${cp}lib-card-error-${videoId}`);
      if (errorContainer) errorContainer.classList.add('hidden');

      // Phản hồi ngay khi bấm, để người dùng chắc chắn là app đã nhận được thao tác và đang xử lý,
      // không phải do chưa bấm trúng: viền + overlay xoay trên chính thẻ video (nếu thẻ đang hiển thị trên màn hình).
      if (card) card.classList.add('is-loading');

      try {
        // Video không có trong thư viện (mở bằng link trực tiếp) -> xem có nằm trong danh mục video ẩn (catalog_<nguồn>.json) không
        if (!libraryFolderMap[videoId] && !isLibraryVideo(videoId)) { try { await loadHiddenCatalogs(); } catch (e) {} }
        const hiddenInfo = libraryFolderMap[videoId] ? null : (hiddenVideoMap[videoId] || null);
        // Đã từng nạp + có bản dịch song ngữ được lưu -> dùng lại bản đã lưu, không đọc lại file gốc (file gốc không có bản dịch).
        const savedItem = getLocalHistory().find((h) => h.videoId === videoId);
        const isLib = isLibraryVideo(videoId);
        // Video thư viện: chỉ dùng bản lưu trên máy khi đó là bản dịch do CHÍNH người dùng nạp (userTrans); còn lại luôn lấy mới từ server
        if (savedItem && savedItem.sentences && savedItem.sentences.length && aicHasTranslation(savedItem.sentences) && (!isLib || savedItem.userTrans === true)) {
          userTransVid = isLib ? videoId : '';
          currentVideoId = videoId;
          currentVideoTitle = savedItem.title || videoTitle || `Video ${videoId}`;
          sentences = savedItem.sentences;
          subtitleFormat = savedItem.format || 'srt';
          inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
          checkStartReady();
          startPractice();
          ensureBilingualDefaultOn();
          return true;
        }

        // Video dạng thư mục (_[ID]_[Tên]/): đọc file ngay trong thư mục đó. Không có -> cách cũ (file nằm thẳng trong subs/).
        const folderName = libraryFolderMap[videoId] || '';
        const base = hiddenInfo ? hiddenInfo.base : (folderName ? `${DATA_DIR}${encodeURIComponent(folderName)}/` : DATA_DIR);
        const possiblePaths = hiddenInfo ? [`${base}${encodeURIComponent(hiddenInfo.file)}`] : folderName ? [
          `${base}${videoId}.json3`,
          `${base}${videoId}.json`,
          `${base}${videoId}.srt`,
          `${base}${videoId}.vtt`,
          `${base}${videoId}.txt`
        ] : [
          `${base}${videoId}.fr.json3`,
          `${base}${videoId}.json3`,
          `${base}${videoId}.fr.json`,
          `${base}${videoId}.json`,
          `${base}${videoId}.fr.srt`,
          `${base}${videoId}.fr.vtt`,
          `${base}${videoId}.fr.txt`,
          `${base}${videoId}.srt`,
          `${base}${videoId}.vtt`,
          `${base}${videoId}.txt`,
          `${base}${videoId}.en.json3`,
          `${base}${videoId}.en.srt`,
          `${base}${videoId}.en.vtt`
        ];

        const cacheBust = `?t=${Date.now()}`;

        // Dò tất cả định dạng phụ đề có thể có CÙNG LÚC (thay vì lần lượt từng cái) để đỡ mất thời gian chờ,
        // đồng thời tranh thủ tải luôn file bản dịch song ngữ (nếu có) song song — không phải đợi xong phụ đề mới tải tiếp.
        const subtitleFetchPromise = Promise.allSettled(possiblePaths.map((path) =>
          fetch(`${path}${cacheBust}`, { cache: 'no-cache' }).then(async (res) => {
            if (!res.ok) throw new Error('not ok');
            const text = await res.text();
            if (!text || text.trim().toLowerCase().startsWith('<!doctype html')) throw new Error('not subtitle');
            return { path, text };
          })
        ));
        // Trả về { ok, status, text }: phân biệt \"server chắc chắn không có file dịch\" (404 hoặc trả về trang HTML) với \"lỗi mạng tạm thời\"
        const viFetchPromise = (hiddenInfo && !hiddenInfo.vi) ? Promise.resolve({ ok: false, status: 404, text: null }) : fetch(`${base}${videoId}_vi.txt${cacheBust}`, { cache: 'no-cache' })
          .then(async (res) => (res.ok ? { ok: true, status: res.status, text: await res.text() } : { ok: false, status: res.status, text: null }))
          .catch(() => ({ ok: false, status: 0, text: null }));

        let textContent = '';
        let fileName = '';
        let success = false;

        const results = await subtitleFetchPromise;
        for (let i = 0; i < possiblePaths.length; i++) {
          if (results[i].status === 'fulfilled') {
            textContent = results[i].value.text;
            fileName = results[i].value.path;
            fileContentCache.set(videoId, textContent);
            success = true;
            break;
          }
        }

        if (!success && fileContentCache.has(videoId)) {
          textContent = fileContentCache.get(videoId);
          fileName = `${videoId}.cache`;
          success = true;
        }

        if (!success) {
          throw new Error(hiddenInfo
            ? `Chưa tìm thấy file phụ đề "${hiddenInfo.file}" trong thư mục "${decodeURIComponent(base)}".`
            : folderName
            ? `Chưa tìm thấy file phụ đề "${videoId}.txt" trong thư mục "${folderName}".`
            : `Chưa tìm thấy file phụ đề "${videoId}" (.srt, .vtt, .json, .json3, .txt) trong thư mục subs.`);
        }

        const parsed = parseAnySubtitle(fileName, textContent);
        if (!parsed || !parsed.sentences || parsed.sentences.length === 0) {
          throw new Error('Dữ liệu phụ đề chưa đúng định dạng chuẩn.');
        }
        userTransVid = '';
        let serverHasVi = false;

        // Có sẵn file bản dịch song ngữ (đặt tên <videoId>_vi.txt cùng thư mục) -> tự động ghép vào, giữ nguyên timecode/word-level gốc.
        let serverViMissing = false;   // server chắc chắn không có file bản dịch cho video này
        try {
          const viRes = await viFetchPromise;
          const viText = viRes.ok ? viRes.text : null;
          serverViMissing = (!viRes.ok && viRes.status === 404) || (viRes.ok && (!viText || !viText.trim() || viText.trim().toLowerCase().startsWith('<!doctype html')));
          if (viText && viText.trim() && !viText.trim().toLowerCase().startsWith('<!doctype html')) {
            const merged = applyBilingualFromAi(parsed.sentences, viText, { lineChunks: true });
            if (merged.ok) { parsed.sentences = merged.sentences; serverHasVi = true; }
          }
        } catch (viErr) { console.warn(`Không đọc được file dịch ${videoId}_vi.txt:`, viErr); }

        // Dữ liệu lưu từ phiên bản cũ của app (chưa có cờ userTrans): server không có bản dịch mà máy lại có
        // -> đó chắc chắn là bản dịch người dùng tự nạp, giữ lại và đánh dấu để không bị mất.
        if (isLib && !serverHasVi && serverViMissing && savedItem && savedItem.userTrans === undefined && savedItem.sentences && savedItem.sentences.length && aicHasTranslation(savedItem.sentences)) {
          parsed.sentences = savedItem.sentences;
          parsed.format = savedItem.format || parsed.format;
          userTransVid = videoId;
        }

        if (parsed.sentences.length > 0) {
          const lastSent = parsed.sentences[parsed.sentences.length - 1];
          const durBadge = document.getElementById(`video-dur-${videoId}`);
          if (durBadge && (!durBadge.textContent || durBadge.textContent === '--:--') && lastSent.endTime) {
            durBadge.textContent = formatDurationLabel(lastSent.endTime);
            durBadge.classList.remove('hidden');
          }
        }

        currentVideoId = videoId;
        currentVideoTitle = videoTitle || `Video ${videoId}`;
        sentences = parsed.sentences;
        subtitleFormat = parsed.format;

        inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
        checkStartReady();
        startPractice();
        ensureBilingualDefaultOn();
        return true;

      } catch (err) {
        console.error(`Lỗi khi nạp video ${videoId}:`, err);
        if (errorContainer) {
          errorContainer.innerHTML = `<span>${err.message}</span>`;
          errorContainer.classList.remove('hidden');
        }
        return false;
      } finally {
        isSelectingVideo = false;
        window.__loadingCard = null;
        if (card) {
          card.classList.remove('is-loading');
        }
        const liveCard = document.getElementById(`${cp}lib-card-${videoId}`);   // hàng lịch sử có thể đã được vẽ lại trong lúc tải
        if (liveCard) liveCard.classList.remove('is-loading');
      }
    }

    const COMMON_ABBREVIATIONS = new Set([
      'm.', 'mme.', 'mme', 'mlle.', 'mlle', 'dr.', 'dr', 'prof.', 'prof',
      'c.-à-d.', 'p.ex.', 'av. j.-c.', 'apr. j.-c.', 'etc.', 'st.', 'ste.',
      'bd.', 'av.', 'vol.', 'fig.', 'n°', 'no.'
    ]);

    const QUESTION_STARTERS = new Set([
      'qui', 'que', 'quoi', 'où', 'quand', 'comment', 'pourquoi', 'combien',
      'quel', 'quelle', 'quels', 'quelles', 'est-ce', 'avez-vous', 'avez',
      'a-t-il', 'est-il', 'sont-ils', 'peut-on', 'pourrait-on', 'serait-il',
      'y a-t-il', "qu'est-ce"
    ]);

    const DISCOURSE_CONNECTORS = new Set([
      'cependant', 'pourtant', 'néanmoins', 'toutefois', 'en revanche',
      'par conséquent', 'donc', 'ainsi', 'en effet', "d'ailleurs",
      'en outre', 'soudain', 'de plus', 'enfin', "d'autre part"
    ]);

    function sanitizeWordTimestamps(tokens) {
      if (!tokens || tokens.length === 0) return tokens;
      for (let i = 0; i < tokens.length - 1; i++) {
        const cur = tokens[i];
        const next = tokens[i + 1];
        if (cur.endTime > next.time) {
          cur.endTime = Math.max(cur.time + 0.05, next.time);
        }
      }
      return tokens;
    }

    function smartSegmentSentences(tokens, opts) {
      if (!tokens || tokens.length === 0) return [];
      // trustBreaks: file do extension Publisher xuất (đã đối chiếu phụ đề người làm) -> mọi ranh giới câu đã nằm sẵn ở cờ brk,
      // KHÔNG chia thêm theo khoảng lặng / từ nối / câu hỏi, để kết quả y hệt khi Importer gửi phụ đề vào app.
      const trustBreaks = !!(opts && opts.trustBreaks);
      tokens = sanitizeWordTimestamps(tokens);

      const sentencesOut = [];
      let currentWords = [];
      let sentenceId = 1;

      for (let i = 0; i < tokens.length; i++) {
        const cur = tokens[i];
        const next = tokens[i + 1];

        let cleanWord = cur.word.replace(/^>>\s*/, '').trim();
        if (!cleanWord) continue;

        if (currentWords.length === 0) {
          cleanWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
        }

        const wordStart = cur.time;
        const wordEnd = cur.endTime || (next ? next.time : wordStart + 0.35);

        const wObj = { word: cleanWord, startTime: wordStart, endTime: wordEnd };
        if (cur.joinNext) wObj.joinNext = true;   // "do—" + "that" hiển thị liền nhau (từ cờ jn của file Publisher)
        currentWords.push(wObj);

        const lowerWord = cleanWord.toLowerCase();
        const hasPunctuation = /[.!?]["']?$/.test(cleanWord);
        const isAbbrev = COMMON_ABBREVIATIONS.has(lowerWord);

        let shouldBreak = trustBreaks ? (cur.forceBreak === true) : ((hasPunctuation && !isAbbrev) || cur.forceBreak === true);

        if (!shouldBreak && next && !trustBreaks) {
          const pauseGap = next.time - wordEnd;
          const nextFirstWordLower = next.word.replace(/^[^a-zA-Z]+/, '').toLowerCase();

          const isAudioPause = pauseGap >= 0.75;
          const isConnector = currentWords.length >= 6 && DISCOURSE_CONNECTORS.has(nextFirstWordLower);
          const isQuestionStart = pauseGap >= 0.45 && currentWords.length >= 5 && QUESTION_STARTERS.has(nextFirstWordLower);
          const isTooLong = currentWords.length >= 16 && pauseGap >= 0.25;

          if (isAudioPause || isConnector || isQuestionStart || isTooLong) {
            shouldBreak = true;
            const firstWordOfSentence = currentWords[0].word.toLowerCase();
            const isLikelyQuestion = QUESTION_STARTERS.has(firstWordOfSentence);
            const punctuationToAdd = isLikelyQuestion ? '?' : '.';

            if (!/[.!?]["']?$/.test(currentWords[currentWords.length - 1].word)) {
              currentWords[currentWords.length - 1].word += punctuationToAdd;
              currentWords[currentWords.length - 1].autoPunct = true;
            }
          }
        }

        if (i === tokens.length - 1) {
          shouldBreak = true;
          if (!/[.!?]["']?$/.test(currentWords[currentWords.length - 1].word)) {
            currentWords[currentWords.length - 1].word += '.';
            currentWords[currentWords.length - 1].autoPunct = true;
          }
        }

        if (shouldBreak && currentWords.length > 0) {
          currentWords[currentWords.length - 1].joinNext = false;
          const fullText = currentWords.map((w, k) => w.word + ((w.joinNext && k < currentWords.length - 1) ? '' : ' ')).join('').trim();
          if (fullText) {
            sentencesOut.push({
              id: sentenceId++,
              startTime: currentWords[0].startTime,
              endTime: currentWords[currentWords.length - 1].endTime,
              text: fullText,
              words: currentWords
            });
          }
          currentWords = [];
        }
      }

      for (let sIdx = 0; sIdx < sentencesOut.length - 1; sIdx++) {
        if (sentencesOut[sIdx].endTime > sentencesOut[sIdx + 1].startTime) {
          sentencesOut[sIdx].endTime = sentencesOut[sIdx + 1].startTime;
          if (sentencesOut[sIdx].words && sentencesOut[sIdx].words.length > 0) {
            const lastW = sentencesOut[sIdx].words[sentencesOut[sIdx].words.length - 1];
            if (lastW.endTime > sentencesOut[sIdx + 1].startTime) {
              lastW.endTime = sentencesOut[sIdx + 1].startTime;
            }
          }
        }
      }

      return sentencesOut;
    }

    function parseTimestamp(timeStr) {
      if (!timeStr) return 0;
      let clean = String(timeStr).trim().replace(',', '.').replace(/s$/i, '');
      clean = clean.replace(/^[\[\(\<]/, '').replace(/[\]\)\>]$/, '').trim();
      const parts = clean.split(':');
      if (parts.length === 3) {
        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
      } else if (parts.length === 2) {
        return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
      }
      return parseFloat(clean) || 0;
    }

    function parseAnySubtitle(name, content) {
      if (!content || !content.trim()) return null;
      const trimmed = content.trim();

      if (trimmed.includes('-->')) {
        const tokens = [];
        const normalized = trimmed.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const blocks = normalized.split(/\n\s*\n+/);

        for (const block of blocks) {
          const lines = block.trim().split('\n').filter(Boolean);
          if (lines.length < 2) continue;

          let timeIndex = -1;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('-->')) {
              timeIndex = i;
              break;
            }
          }
          if (timeIndex === -1) continue;

          const timeLine = lines[timeIndex];
          const [startStr, endStr] = timeLine.split('-->');
          if (!startStr || !endStr) continue;

          const startTime = parseTimestamp(startStr.trim());
          const endTime = parseTimestamp(endStr.trim().split(/\s+/)[0]);

          const textLines = lines.slice(timeIndex + 1);
          const rawDialogue = textLines.join(' ')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          if (rawDialogue && endTime > startTime) {
            const rawJoined = textLines.join(' ');
            // 1. Kiểm tra WebVTT có timestamp nội tuyến từng từ: <00:00:01.200> hoặc <00:01.200>
            const inlineTagRegex = /<((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{2,3})?)>/g;
            const hasInlineTags = inlineTagRegex.test(rawJoined);

            if (hasInlineTags) {
              // Parse WebVTT inline timestamps
              const parts = rawJoined.split(/(<(?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{2,3})?>)/g).filter(Boolean);
              let curTime = startTime;
              for (let pi = 0; pi < parts.length; pi++) {
                const p = parts[pi].trim();
                if (!p) continue;
                const tagMatch = p.match(/^<((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{2,3})?)>$/);
                if (tagMatch) {
                  curTime = parseTimestamp(tagMatch[1]);
                } else {
                  const cleanedText = p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
                  const pWords = cleanedText.split(' ').filter(Boolean);
                  if (pWords.length > 0) {
                    pWords.forEach((pw) => {
                      tokens.push({
                        time: Number(curTime.toFixed(3)),
                        endTime: Number(Math.min(endTime, curTime + 0.35).toFixed(3)),
                        word: pw
                      });
                    });
                  }
                }
              }
            } else {
              // 2. SRT / VTT thông thường: Ước lượng thông minh theo trọng số độ dài từ và ngắt nghỉ dấu câu
              const words = rawDialogue.split(' ').filter(Boolean);
              const blockDur = endTime - startTime;
              
              if (words.length === 1) {
                tokens.push({
                  time: Number(startTime.toFixed(3)),
                  endTime: Number(endTime.toFixed(3)),
                  word: words[0]
                });
              } else {
                // Tính trọng số cho từng từ:
                // - Từ ngắn (1-2 chữ cái như à, de, et, en, y) phát âm nhanh (~150-200ms)
                // - Từ dài (nhiều âm tiết như particulièrement, communication) phát âm lâu hơn
                // - Dấu phẩy / chấm có khoảng dừng tự nhiên
                const weights = words.map((w) => {
                  const cleanW = w.replace(/[^\p{L}\p{N}']/gu, '');
                  let wt = Math.max(1.8, Math.min(9.0, cleanW.length * 0.95 + 0.8));
                  if (/[,;:]$/.test(w)) wt += 1.6;
                  else if (/[.!?]$/.test(w)) wt += 2.2;
                  else if (/\.\.\.$/.test(w)) wt += 1.8;
                  return wt;
                });

                const totalWeight = weights.reduce((acc, val) => acc + val, 0);
                let accWeight = 0;

                words.forEach((w, wIdx) => {
                  const wStart = startTime + (accWeight / totalWeight) * blockDur;
                  accWeight += weights[wIdx];
                  const wEnd = (wIdx === words.length - 1) ? endTime : (startTime + (accWeight / totalWeight) * blockDur);

                  tokens.push({
                    time: Number(wStart.toFixed(3)),
                    endTime: Number(wEnd.toFixed(3)),
                    word: w
                  });
                });
              }
            }
          }
        }

        if (tokens.length > 0) {
          return { format: 'srt', sentences: smartSegmentSentences(tokens) };
        }
      }

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);

          if (parsed && Array.isArray(parsed.events) && parsed.events.length > 0 && 
              (parsed.events[0].start_ms !== undefined || parsed.events[0].words !== undefined)) {
            
            const tokens = [];
            parsed.events.forEach((ev) => {
              const evStart = (ev.start_ms || 0) / 1000;
              const evEnd = ev.duration_ms ? (ev.start_ms + ev.duration_ms) / 1000 : evStart + 3.0;

              if (Array.isArray(ev.words) && ev.words.length > 0) {
                ev.words.forEach((w) => {
                  const wStart = (w.start_ms !== undefined ? w.start_ms : evStart * 1000) / 1000;
                  const wEnd = (w.end_ms !== undefined ? w.end_ms : (w.start_ms ? w.start_ms + 350 : (evStart + 0.35) * 1000)) / 1000;
                  const wText = (w.text || w.word || '').trim();
                  if (wText) {
                    tokens.push({
                      time: Number(wStart.toFixed(3)),
                      endTime: Number(wEnd.toFixed(3)),
                      word: wText
                    });
                  }
                });
              } else {
                const cleanText = (ev.text || '').replace(/\r\n|\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
                if (cleanText) {
                  const words = cleanText.split(' ').filter(Boolean);
                  const dur = Math.max(0.6, evEnd - evStart);
                  const step = dur / words.length;
                  words.forEach((w, idx) => {
                    tokens.push({
                      time: Number((evStart + idx * step).toFixed(3)),
                      endTime: Number(((idx === words.length - 1) ? evEnd : evStart + (idx + 1) * step).toFixed(3)),
                      word: w
                    });
                  });
                }
              }
            });

            if (tokens.length > 0) {
              return { format: 'json', sentences: smartSegmentSentences(tokens) };
            }
          }

          if (parsed && Array.isArray(parsed.events)) {
            const tokens = [];
            parsed.events.forEach((ev) => {
              if (ev.segs && typeof ev.tStartMs === 'number') {
                const startSec = ev.tStartMs / 1000;
                const hasNewLine = ev.segs.some(s => s.utf8 && s.utf8.includes('\n'));

                ev.segs.forEach((seg, sIdx) => {
                  const raw = (seg.utf8 || '').replace(/\r\n|\n|\r/g, ' ').trim();
                  if (!raw) return;
                  const segStart = startSec + (seg.tOffsetMs || 0) / 1000;
                  const isLastSeg = sIdx === ev.segs.length - 1;
                  const pieces = raw.split(/\s+/).filter(Boolean);
                  if (pieces.length === 1) {
                    tokens.push({ time: Number(segStart.toFixed(3)), word: raw, forceBreak: (hasNewLine && isLastSeg) });
                    return;
                  }
                  // Seg chứa nhiều từ (JSON3 không có timestamp từng từ): tách từng từ, chia thời gian theo độ dài chữ
                  const nextSeg = ev.segs[sIdx + 1];
                  let segEnd = nextSeg ? startSec + (nextSeg.tOffsetMs || 0) / 1000
                    : (typeof ev.dDurationMs === 'number' ? (ev.tStartMs + ev.dDurationMs) / 1000 : segStart + pieces.length * 0.35);
                  if (!(segEnd > segStart + 0.05)) segEnd = segStart + pieces.length * 0.35;
                  const total = pieces.reduce((a, p) => a + p.length + 1, 0);
                  let acc = 0;
                  pieces.forEach((p, k) => {
                    tokens.push({
                      time: Number((segStart + (segEnd - segStart) * acc / total).toFixed(3)),
                      word: p,
                      forceBreak: (hasNewLine && isLastSeg && k === pieces.length - 1)
                    });
                    acc += p.length + 1;
                  });
                });
              }
            });

            if (tokens.length > 0) {
              return { format: 'json3', sentences: smartSegmentSentences(tokens) };
            }
          }

          let sentencesArr = Array.isArray(parsed) ? parsed : (parsed.sentences || null);
          if (Array.isArray(sentencesArr) && sentencesArr.length > 0) {
            if (sentencesArr[0].word && (sentencesArr[0].start !== undefined || sentencesArr[0].start_sec !== undefined)) {
              const tokens = sentencesArr.map(item => ({
                word: item.word,
                time: item.start !== undefined ? item.start : item.start_sec,
                endTime: item.end !== undefined ? item.end : (item.start + 0.35),
                forceBreak: item.brk === 1 || item.brk === true,   // extension Publisher: đánh dấu hết câu (đã đối chiếu phụ đề người làm)
                joinNext: item.jn === 1 || item.jn === true
              }));
              return { format: 'json', sentences: smartSegmentSentences(tokens, { trustBreaks: tokens.some((t) => t.forceBreak) }) };
            }
          }
        } catch (e) {}
      }

      return null;
    }

    // ==================== XỬ LÝ CÂU TRẢ LỜI CỦA AI (THÊM DẤU CÂU / BẢN DỊCH SONG NGỮ) ====================
    // Nguyên tắc thiết kế: KHÔNG tin văn bản AI trả về là "đáp án đúng", mà căn chỉnh (alignment) từng
    // từ của AI với chuỗi từ GỐC của phụ đề (vốn đã có mốc thời gian). Nhờ vậy:
    //   - Từ gốc + timestamp luôn được giữ nguyên; AI chỉ đóng góp: dấu câu, viết hoa, ranh giới câu,
    //     và (với bản dịch) câu tiếng Việt tương ứng.
    //   - AI chèn thêm từ, đổi từ, bỏ từ, đảo trật tự, kèm lời dẫn đầu/cuối... đều không làm hỏng dữ liệu.
    //   - Phụ đề gốc không có dấu câu vẫn khớp được, vì ranh giới câu lấy theo cách AI chia câu.

    const AIC_TITLE_ABBREV = new Set(['mr.', 'mrs.', 'ms.', 'dr.', 'prof.', 'sr.', 'jr.', 'st.', 'mt.', 'vs.', 'gen.', 'col.', 'sgt.', 'capt.', 'lt.', 'rev.', 'hon.']);
    const AIC_SOFT_ABBREV = new Set(['etc.', 'u.s.', 'u.k.', 'u.s.a.', 'a.m.', 'p.m.', 'ph.d.', 'inc.', 'ltd.', 'co.', 'corp.', 'approx.', 'dept.']);
    const AIC_NEVER_END = new Set(['e.g.', 'i.e.']);
    // Ký tự CHỈ có trong tiếng Việt (không nhầm với tên riêng châu Âu như "Brené"): ă ơ ư đ và các dấu hỏi/ngã/nặng, tổ hợp mũ+dấu...
    const AIC_VI_UNIQUE = /[ăơưđĂƠƯĐảẻỉỏủỷạẹịọụỵẽĩũỹấầẩẫậếềểễệốồổỗộắằẳẵặớờởỡợứừửữựẢẺỈỎỦỶẠẸỊỌỤỴẼĨŨỸẤẦẨẪẬẾỀỂỄỆỐỒỔỖỘẮẰẲẴẶỚỜỞỠỢỨỪỬỮỰ]/;

    // Chuẩn hóa từ để so khớp: bỏ hết dấu câu/ký hiệu, thường hóa, bỏ dấu nháy đơn (don't = dont).
    function aicNorm(s) {
      return String(s).toLowerCase().replace(/[\u2019\u2018`\u00b4]/g, "'").replace(/[^\p{L}\p{N}]+/gu, '');
    }

    // Token này có kết thúc một câu không? (xét viết tắt Mr./Dr., chữ cái đầu J., dấu ba chấm "..." không ngắt câu)
    function aicEndsSentence(tok, next) {
      const t = String(tok).replace(/["'\u201d\u2019)\]*_]+$/, '');
      if (!/[.?!\u2026]$/.test(t)) return false;
      if (/(\.\.|\u2026)$/.test(t)) return false;
      if (/[?!]$/.test(t)) return true;
      const low = t.toLowerCase();
      if (AIC_NEVER_END.has(low) || AIC_TITLE_ABBREV.has(low)) return false;
      if (/^[B-HJ-Z]\.$/.test(t)) return false;
      const nextLower = next ? /^["'\u201c(]*\p{Ll}/u.test(next) : false;
      if (AIC_SOFT_ABBREV.has(low) || /^([a-z]\.){2,}$/i.test(low)) return !nextLower;
      return true;
    }

    function aicCleanRaw(raw) {
      return String(raw || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u200b\u200c\u200d\ufeff]/g, '')
        .replace(/```[a-z]*\n?/gi, '\n')
        .replace(/\*|__/g, '')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s*>\s?/gm, '')
        .replace(/^\s*(?:[-\u2022]|\d{1,3}[.)])\s+/gm, '')
        .replace(/^\s*(?:EN|VI|English|Vietnamese|Ti\u1ebfng Anh|Ti\u1ebfng Vi\u1ec7t|Anh|Vi\u1ec7t|G\u1ed1c|D\u1ecbch)\s*[:\uff1a]\s*/gim, '');
    }

    function aicSplitAtDashes(piece) {
      const out = [];
      let cur = '';
      for (let k = 0; k < piece.length; k++) {
        const ch = piece[k];
        if (ch === '\u2014' && cur.length > 0 && k < piece.length - 1) {
          out.push(cur + '\u2014');
          cur = '';
        } else {
          cur += ch;
        }
      }
      if (cur) out.push(cur);
      return out;
    }

    // Tách văn bản thành các token; "do—that" thành "do—" + "that" (joinNext để hiển thị liền nhau),
    // token chỉ toàn dấu câu (— hoặc ...) được dán vào token liền trước.
    function aicTokenize(raw, unit) {
      const text = aicCleanRaw(raw).replace(/--+/g, '\u2014').replace(/\s*[\u2014\u2013]\s*/g, '\u2014');
      const toks = [];
      text.split(/\s+/).forEach((piece) => {
        if (!piece) return;
        const parts = aicSplitAtDashes(piece);
        parts.forEach((part, pi) => {
          const norm = aicNorm(part);
          if (!norm) {
            if (toks.length) { toks[toks.length - 1].text += part; toks[toks.length - 1].joinNext = false; }
            return;
          }
          toks.push({ text: part, norm, joinNext: part.endsWith('\u2014') && pi < parts.length - 1, unit: unit === undefined ? 0 : unit });
        });
      });
      return toks;
    }

    // Trải phẳng phụ đề hiện tại thành danh sách từ có mốc thời gian.
    function aicFlatten(sents) {
      const flat = [];
      (sents || []).forEach((s, sIdx) => {
        const flatStart = flat.length;
        let ws = s.words && s.words.length ? s.words : null;
        if (!ws) {
          const toks = String(s.text || '').split(/\s+/).filter(Boolean);
          const dur = Math.max(0.6, (s.endTime || s.startTime) - s.startTime);
          const step = dur / Math.max(1, toks.length);
          ws = toks.map((t, k) => ({ word: t, startTime: s.startTime + k * step, endTime: s.startTime + (k + 1) * step }));
        }
        ws.forEach((w) => {
          const parts = String(w.word).split(/\s+/).filter(Boolean);
          if (parts.length > 1) {
            const tot = parts.reduce((a, p) => a + p.length + 1, 0);
            let acc = 0;
            parts.forEach((p) => {
              const s0 = w.startTime + (w.endTime - w.startTime) * acc / tot;
              acc += p.length + 1;
              const e0 = w.startTime + (w.endTime - w.startTime) * acc / tot;
              flat.push({ w: p, s: s0, e: e0, auto: false, sent: sIdx, norm: aicNorm(p) });
            });
            return;
          }
          flat.push({ w: w.word, s: w.startTime, e: w.endTime, auto: !!w.autoPunct, sent: sIdx, norm: aicNorm(w.word) });
        });
        // Bài đọc import từ extension: ảnh / đầu đoạn / tiêu đề gắn vào TỪ ĐẦU của câu để không mất khi dựng lại câu
        if (flat.length > flatStart && (s.ps || s.hd || s.ti || (s.imgs && s.imgs.length))) {
          flat[flatStart].mk = { ps: s.ps ? 1 : 0, hd: s.hd ? 1 : 0, ti: s.ti ? 1 : 0, im: (s.imgs && s.imgs.length) ? s.imgs : null };
        }
      });
      return flat;
    }

    // Tìm điểm neo bắt đầu: bỏ qua lời dẫn của AI ("Dưới đây là đoạn văn đã được thêm dấu câu:") bằng cách
    // tìm chỗ đầu tiên mà vài từ đầu của phụ đề gốc xuất hiện liên tiếp trong câu trả lời.
    function aicFindStart(O, A) {
      const n = O.length, m = A.length;
      // Lời dẫn của AI / dòng credit của phụ đề người làm ("Transcriber: ... Reviewer: ...") chỉ có thể dài vài chục từ,
      // nên điểm bắt đầu phải nằm GẦN ĐẦU bản kia. Trước đây tìm trên toàn bài nên cụm 3 từ ngắn ("so when i") khớp tình cờ
      // ở cuối bài và kéo cả phép căn chỉnh chạy từ cuối. Giờ: ưu tiên cụm dài, cửa sổ hẹp; chỉ mở rộng khi cụm đủ dài.
      const maxI = Math.min(40, n - 3);
      const tryFind = (lens, jMax, maxScore) => {
        for (const L of lens) {
          let best = null;
          for (let i0 = 0; i0 <= maxI; i0++) {
            if (i0 + L > n) continue;
            const jEnd = Math.min(jMax, m - L);
            for (let j = 0; j <= jEnd; j++) {
              let ok = true;
              for (let q = 0; q < L; q++) {
                if (O[i0 + q] === '' || O[i0 + q] !== A[j + q]) { ok = false; break; }
              }
              if (ok) {
                const score = i0 + j;   // càng gần đầu cả hai bên càng tốt
                if (score <= (maxScore === undefined ? Infinity : maxScore) && (!best || score < best.score)) best = { i0, j0: j, score };
                break;
              }
            }
          }
          if (best) return { i0: best.i0, j0: best.j0 };
        }
        return null;
      };
      // Hai bản đều BẮT ĐẦU khớp nhau ngay từ đầu (>= 5 từ liên tiếp): chọn luôn, kẻo cụm dài hơn ở phía sau (>= 8 từ) kéo điểm bắt đầu
      // đi muộn và làm mất phần mở đầu (ví dụ phụ đề người làm thiếu 1 chữ "of" ở câu đầu -> 8 từ đầu bị bỏ khỏi phép đối chiếu).
      return tryFind([5], 12, 3)
          || tryFind([8, 6, 5, 4], 150)      // cụm dài, gần đầu
          || tryFind([3], 40)                // cụm 3 từ chỉ tin khi rất gần đầu
          || tryFind([10, 8, 6], m)          // lời dẫn/credit rất dài: cho tìm rộng nhưng chỉ nhận cụm dài
          || { i0: 0, j0: 0 };
    }

    // Căn chỉnh tối ưu (quy hoạch động) cho MỘT đoạn lệch ngắn giữa từ gốc và từ AI: khớp đúng những từ giống nhau,
    // coi các từ còn lại là thay thế / chèn / bỏ với chi phí nhỏ nhất. Nhờ vậy dấu câu của AI rơi đúng vào từ gốc tương ứng.
    function aicAlignGap(O, A, oS, oL, aS, aL, map) {
      const W = aL + 1;
      const cost = new Float32Array((oL + 1) * W);
      for (let x = 1; x <= oL; x++) cost[x * W] = x;
      for (let y = 1; y <= aL; y++) cost[y] = y;
      const sub = (x, y) => {
        const a = O[oS + x], b = A[aS + y];
        if (a !== '' && a === b) return 0;
        if (a.length >= 3 && b.length >= 3 && (a.startsWith(b) || b.startsWith(a))) return 0.5;
        return 1;
      };
      for (let x = 1; x <= oL; x++) {
        for (let y = 1; y <= aL; y++) {
          const d = cost[(x - 1) * W + (y - 1)] + sub(x - 1, y - 1);
          const u = cost[(x - 1) * W + y] + 1;
          const l = cost[x * W + (y - 1)] + 1;
          cost[x * W + y] = Math.min(d, u, l);
        }
      }
      let x = oL, y = aL;
      while (x > 0 && y > 0) {
        const cur = cost[x * W + y];
        const c = sub(x - 1, y - 1);
        if (Math.abs(cur - (cost[(x - 1) * W + (y - 1)] + c)) < 1e-6) { map[oS + x - 1] = aS + y - 1; x--; y--; }
        else if (Math.abs(cur - (cost[(x - 1) * W + y] + 1)) < 1e-6) { x--; }
        else { y--; }
      }
    }

    // Căn chỉnh tham lam có "đồng bộ lại" (resync): khi lệch, thử coi là AI đổi từ / chèn thêm / bỏ bớt và
    // chọn phương án tốn ít chỉnh sửa nhất mà 3 từ kế tiếp lại khớp. map[i] = chỉ số token AI ứng với từ gốc i
    // (-1: không khớp, -2: bị gộp vào từ ghép phía trước, ví dụ "one dimensional" -> "one-dimensional").
    function aicAlign(O, A, i0, j0) {
      const n = O.length, m = A.length;
      const map = new Int32Array(n).fill(-1);
      const merge = new Uint8Array(n);
      let i = i0, j = j0, exact = 0;
      const run = (oi, aj, L) => {
        let k = 0;
        while (k < L && oi + k < n && aj + k < m && O[oi + k] !== '' && O[oi + k] === A[aj + k]) k++;
        return k;
      };
      while (i < n && j < m) {
        if (O[i] !== '' && O[i] === A[j]) { map[i] = j; exact++; i++; j++; continue; }

        let mk = 0;
        if (A[j] !== '') {
          let cat = O[i];
          for (let k = 2; k <= 4 && i + k <= n; k++) {
            cat += O[i + k - 1];
            if (cat === A[j]) { mk = k; break; }
          }
        }
        if (mk) {
          map[i] = j; merge[i] = mk;
          for (let q = 1; q < mk; q++) map[i + q] = -2;
          exact += mk; i += mk; j++;
          continue;
        }

        const remO = n - i, remA = m - j;
        // Tìm phương án sửa tốn ít chỉnh sửa nhất (cost = max(di, dj)): thay thế / AI chèn / AI bỏ / thay cụm khác độ dài
        // (ví dụ 3 từ gốc "a long way" bị AI viết thành 1 từ "far"), miễn là các từ kế tiếp lại khớp nhau.
        const tryResync = (D, from, L) => {
          for (let cost = from; cost <= D; cost++) {
            const cands = [[cost, cost], [0, cost], [cost, 0]];
            for (let k = 1; k < cost; k++) { cands.push([cost, k]); cands.push([k, cost]); }
            for (const [di, dj] of cands) {
              if (i + di < n && j + dj < m && run(i + di, j + dj, L) >= L) return { di, dj };
            }
          }
          return null;
        };
        let found = tryResync(12, 1, Math.max(1, Math.min(3, remO, remA)));
        if (!found) found = tryResync(40, 13, Math.max(1, Math.min(4, remO, remA)));
        if (!found) {
          const L3 = Math.max(1, Math.min(6, remO, remA));
          for (let d = 41; d <= 400 && !found; d++) {
            if (j + d < m && run(i, j + d, L3) >= L3) found = { di: 0, dj: d };
            else if (i + d < n && run(i + d, j, L3) >= L3) found = { di: d, dj: 0 };
          }
        }
        if (!found) break;
        if (found.di > 0 && found.dj > 0) aicAlignGap(O, A, i, found.di, j, found.dj, map);
        i += found.di; j += found.dj;
      }
      return { map, merge, exact };
    }

    // Từ gốc bị AI đổi chữ (ví dụ work -> worked): giữ chữ gốc nhưng vẫn lấy dấu câu AI gắn vào.
    function aicAdoptPunct(origWord, tokText) {
      const lead = (tokText.match(/^[^\p{L}\p{N}]*/u) || [''])[0];
      const trail = (tokText.match(/[^\p{L}\p{N}]*$/u) || [''])[0];
      const core = origWord.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}]+$/u, '');
      return lead + (core || origWord) + trail;
    }

    function aicSplitLongWords(words, maxW) {
      if (words.length <= maxW) return [words];
      let best = -1, bestDist = Infinity;
      const mid = words.length / 2;
      for (let k = 8; k < words.length - 8; k++) {
        if (/[,;:\u2014]$/.test(words[k].word)) {
          const d = Math.abs(k - mid);
          if (d < bestDist) { bestDist = d; best = k; }
        }
      }
      if (best < 0) best = Math.floor(mid) - 1;
      return [...aicSplitLongWords(words.slice(0, best + 1), maxW), ...aicSplitLongWords(words.slice(best + 1), maxW)];
    }

    function aicComposeText(words) {
      let out = '';
      words.forEach((w, k) => {
        out += w.word;
        if (k < words.length - 1 && !w.joinNext) out += ' ';
      });
      return out;
    }

    // Câu trả lời của AI thường bọc cả đoạn trong ngoặc kép (do prompt); bỏ cặp ngoặc bọc ngoài đó đi.
    function aicStripWrapperQuotes(sentences) {
      if (!sentences.length) return;
      const straight = (s) => s.words.reduce((a, w) => a + (w.word.match(/"/g) || []).length, 0);
      const first = sentences[0], last = sentences[sentences.length - 1];
      const fw = first.words[0];
      if (/^[\u201c"]/.test(fw.word)) {
        const balanced = fw.word[0] === '"' ? straight(first) % 2 === 0 : first.words.some((w) => /\u201d/.test(w.word));
        if (!balanced) fw.word = fw.word.replace(/^[\u201c"]+/, '');
      }
      const lw = last.words[last.words.length - 1];
      if (/[\u201d"]$/.test(lw.word)) {
        const balanced = lw.word.slice(-1) === '"' ? straight(last) % 2 === 0 : last.words.some((w) => /\u201c/.test(w.word));
        if (!balanced) lw.word = lw.word.replace(/[\u201d"]+$/, '');
      }
    }

    // Dựng lại danh sách câu từ kết quả căn chỉnh.
    // Mỗi từ gốc thuộc về một "unit" (câu do AI chia). Từ gốc không khớp được sẽ:
    //   - đoạn ngắn (<7 từ) chen giữa: dồn vào câu kế tiếp (dấu câu của AI nằm ở từ khớp cuối câu trước);
    //   - đoạn dài (AI bỏ sót cả câu / phần đuôi chưa được trả lời): giữ NGUYÊN cấu trúc câu gốc.
    function aicRebuild(flat, tokens, al, unitVi, opts, unitGrp) {
      const n = flat.length;
      const { map, merge } = al;
      const unit = new Array(n).fill(null);
      for (let i = 0; i < n; i++) {
        if (map[i] >= 0) unit[i] = tokens[map[i]].unit;
        else if (map[i] === -2) unit[i] = unit[i - 1];
      }
      const nextU = new Array(n + 1).fill(null);
      for (let i = n - 1; i >= 0; i--) nextU[i] = unit[i] !== null ? unit[i] : nextU[i + 1];

      const gapUnit = new Array(n).fill(false);
      let prevU = null;
      for (let i = 0; i < n; ) {
        if (unit[i] !== null) { prevU = unit[i]; i++; continue; }
        let b = i;
        while (b + 1 < n && unit[b + 1] === null) b++;
        const len = b - i + 1;
        const q = nextU[b + 1];
        for (let k = i; k <= b; k++) {
          if (len >= 7 || (q === null && len > 3)) { unit[k] = 'g' + flat[k].sent; gapUnit[k] = true; }
          else if (q !== null) unit[k] = q;
          else unit[k] = prevU;
        }
        i = b + 1;
      }

      const groups = [];
      for (let i = 0; i < n; i++) {
        if (map[i] === -2) continue;
        const ow = flat[i];
        // Bản dịch song ngữ: từ gốc mà AI đã lược bỏ và là tiếng ngập ngừng (um, uh...) hoặc nhãn trong ngoặc vuông ([Music]...) thì bỏ hẳn, không giữ lại
        if (map[i] === -1 && opts && opts.dropFillers && (MC_HESITATIONS.has(ow.norm) || /^\[[^\]]*\]$/.test(ow.w))) continue;
        let text, endTime = ow.e, joinNext = false;
        if (map[i] >= 0) {
          const t = tokens[map[i]];
          if (merge[i]) { text = t.text; endTime = flat[i + merge[i] - 1].e; }
          else if (t.norm === ow.norm) text = t.text;
          else text = aicAdoptPunct(ow.w, t.text);
          joinNext = t.joinNext;
        } else {
          text = (ow.auto && !gapUnit[i]) ? ow.w.replace(/[.?!]+$/, '') : ow.w;
        }
        const w = { word: text, startTime: ow.s, endTime };
        if (joinNext) w.joinNext = true;
        if (ow.mk) w.mk = ow.mk;
        const u = unit[i];
        const lastG = groups[groups.length - 1];
        if (lastG && lastG.unit === u) lastG.words.push(w);
        else groups.push({ unit: u, words: [w] });
      }

      let out = [];
      groups.forEach((g) => {
        const vi = (typeof g.unit === 'number' && unitVi) ? unitVi[g.unit] : undefined;
        const pieces = (opts && opts.splitLong && typeof g.unit === 'number') ? aicSplitLongWords(g.words, opts.splitLong) : [g.words];
        const gid0 = (typeof g.unit === 'number' && unitGrp) ? unitGrp[g.unit] : undefined;   // nhóm "câu theo dấu chấm" chứa đoạn AI này
        pieces.forEach((ws, pi) => {
          ws[ws.length - 1].joinNext = false;
          out.push({ words: ws, vi: (pi === pieces.length - 1 && vi) ? vi : undefined, gid: gid0 === undefined ? undefined : (pieces.length > 1 ? gid0 + '.' + pi : gid0) });
        });
      });
      aicStripWrapperQuotes(out);

      const result = out.map((g, idx) => {
        const s = {
          id: idx + 1,
          startTime: g.words[0].startTime,
          endTime: g.words[g.words.length - 1].endTime,
          text: aicComposeText(g.words),
          words: g.words
        };
        if (g.vi) s.vi = g.vi;
        if (g.gid !== undefined) s.gid = g.gid;   // các đoạn cùng gid = cùng một câu (kết thúc bằng . ? !): giao diện Mặc định tắt song ngữ sẽ nối liền lại
        let mkPs = 0, mkHd = 0, mkTi = 0, mkIm = null;
        g.words.forEach((gw, gi) => {
          if (!gw.mk) return;
          if (gw.mk.ps) mkPs = 1;
          if (gi === 0 && gw.mk.hd) mkHd = 1;
          if (gi === 0 && gw.mk.ti) mkTi = 1;
          if (gw.mk.im && gw.mk.im.length) mkIm = (mkIm || []).concat(gw.mk.im);
          delete gw.mk;
        });
        if (mkPs) s.ps = 1;
        if (mkHd) s.hd = 1;
        if (mkTi) s.ti = 1;
        if (mkIm) s.imgs = mkIm;
        return s;
      });
      for (let k = 0; k < result.length - 1; k++) {
        const nextStart = result[k + 1].startTime;
        if (result[k].endTime > nextStart) {
          result[k].endTime = nextStart;
          const lw = result[k].words[result[k].words.length - 1];
          if (lw.endTime > nextStart) lw.endTime = nextStart;
        }
      }
      return result;
    }

    function aicRun(sents, tokens, unitVi, mode, unitGrp, sourceWordsByUnit) {
      const flat = aicFlatten(sents);
      const n = flat.length;
      if (!n) return { ok: false, error: 'Chưa có phụ đề để xử lý.' };
      if (!tokens.length) return { ok: false, error: 'Không tìm thấy nội dung tiếng Pháp nào trong câu trả lời vừa dán.' };
      const O = flat.map((f) => f.norm);
      const A = tokens.map((t) => t.norm);
      const st = aicFindStart(O, A);
      const al = aicAlign(O, A, st.i0, st.j0);
      // Xét chất lượng khớp theo MẬT ĐỘ trong đoạn đã được AI phủ tới (không phải % toàn bài): AI trả lời thiếu
      // (video dài bị cắt giữa chừng) vẫn hợp lệ; còn dán nhầm/AI diễn đạt lại thì mật độ khớp rất thấp -> từ chối.
      let firstMapped = -1, lastMapped = -1;
      for (let i = 0; i < n; i++) {
        if (al.map[i] !== -1) { if (firstMapped < 0) firstMapped = i; lastMapped = i; }
      }
      const span = lastMapped >= 0 ? lastMapped - firstMapped + 1 : 0;
      const density = span ? al.exact / span : 0;
      if (al.exact < Math.min(n, 6) || density < 0.6) {
        return {
          ok: false,
          error: `Nội dung vừa dán không khớp với phụ đề gốc (chỉ khớp được ${al.exact}/${n} từ) nên chưa áp dụng. Có thể AI đã diễn đạt lại nội dung, hoặc bạn dán nhầm câu trả lời.`
        };
      }
      const dropFillers = mode === 'trans' ? { dropFillers: true, sourceWordsByUnit } : null;
      const sentences = aicRebuild(flat, tokens, al, unitVi, mode === 'punct' ? { splitLong: 50 } : dropFillers, unitGrp);
      const tailWords = n - 1 - lastMapped;
      return {
        ok: true,
        sentences,
        stats: {
          totalWords: n,
          coverage: al.exact / n,
          headWords: firstMapped,
          tailWords,
          tailPct: Math.round(((lastMapped + 1) / n) * 100),
          sentenceCount: sentences.length,
          translated: sentences.filter((x) => x.vi).length
        }
      };
    }

    // (1) THÊM DẤU CÂU: câu trả lời của AI là văn bản tiếng Pháp đã có dấu câu.
    // opts.lineChunks (video): mỗi DÒNG trong câu trả lời của AI là một đoạn riêng (AI thường xuống dòng ở dấu phẩy / gạch ngang để chia câu dài thành
    // các cụm 8-18 từ cho dễ luyện) -> ngoài ranh giới ở . ? ! còn có ranh giới ở cuối mỗi dòng.
    function applyPunctuationFromAi(sents, aiText, opts) {
      const lineChunks = !!(opts && opts.lineChunks);
      let tokens = [];
      if (lineChunks) {
        aicCleanRaw(aiText).split('\n').forEach((line) => {
          const lt = aicTokenize(line, 0);
          if (lt.length) { lt[lt.length - 1].lineEnd = true; tokens = tokens.concat(lt); }
        });
      } else tokens = aicTokenize(aiText, 0);
      let u = 0, sentEnds = 0, gcount = 0;
      const unitGrp = [];
      tokens.forEach((t, k) => {
        t.unit = u;
        unitGrp[u] = gcount;
        const nxt = tokens[k + 1];
        const se = aicEndsSentence(t.text, nxt ? nxt.text : '');
        if (se) { sentEnds++; gcount++; }
        if (se || t.lineEnd) u++;
      });
      if (sentEnds < Math.max(1, Math.floor(tokens.length / 60))) {
        return { ok: false, error: 'Câu trả lời của AI gần như không có dấu kết thúc câu (. ? !) nên chưa thể chia câu. Hãy nhờ AI thêm dấu câu đầy đủ rồi dán lại.' };
      }
      return aicRun(sents, tokens, null, 'punct', lineChunks ? unitGrp : undefined);
    }

    // ==================== GHÉP PHỤ ĐỀ THỦ CÔNG (NGƯỜI LÀM) VÀO PHỤ ĐỀ TỰ ĐỘNG (WORD-LEVEL) ====================
    // Extension v1.1 gửi kèm 2 bản: ASR tiếng Pháp (thời gian từng từ) + phụ đề thủ công tiếng Pháp (chữ và dấu câu chuẩn).
    // Nguyên tắc: CHỮ + DẤU CÂU + CHIA CÂU lấy từ bản người làm (đáng tin hơn), THỜI GIAN từng từ lấy từ ASR.
    //   - Từ khớp nhau: giữ chữ của người làm, mượn mốc thời gian của từ ASR tương ứng.
    //   - ASR nghe sai (their/there...): chữ người làm thay vào, vẫn dùng mốc thời gian ASR.
    //   - Người làm có mà ASR bỏ sót: chèn thêm từ, thời gian nội suy theo độ dài chữ.
    //   - ASR có mà người làm không viết (you know, I mean, lặp cụm từ 2 từ trở lên... người nói CÓ nói): GIỮ LẠI; riêng tiếng ngập ngừng um/uh/hmm... và lặp đúng 1 từ (\"I I\") thì bỏ/gộp, gắn vào câu của từ người làm bên cạnh;
    //     (dài >= 7 từ: người làm cắt bớt lời) giữ nguyên cấu trúc câu của ASR.
    //   - Phụ đề người làm lệch hẳn ASR (mật độ khớp < 60%) thì KHÔNG ghép, giữ nguyên bản ASR như cũ.
    function mcCleanCue(t) {
      return String(t || '')
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/<[^>]+>/g, '')
        .replace(/\r\n|\n|\r/g, ' ')
        .replace(/\[[^\]]{0,60}\]/g, ' ')                  // [Music], [Applause]
        .replace(/\((?:[^()\s]+\s?){1,4}\)/g, ' ')         // (laughs), (music playing)
        .replace(/[\u266a\u266b\u266c][^\u266a\u266b\u266c]*[\u266a\u266b\u266c]/g, ' ')   // ♪ lời hát ♪
        .replace(/[\u266a\u266b\u266c]+/g, ' ')            // ♪ lẻ
        .replace(/>>+/g, ' ')                              // đổi người nói
        .replace(/^\s*-\s+/, '')                           // gạch đầu dòng thoại ở đầu cue
        .replace(/^\s*[A-Z][A-Z0-9 .'\-]{1,24}:\s+/, '')   // nhãn người nói "JOHN: "
        .replace(/\s+/g, ' ').trim();
    }

    function mcJson3ToText(raw) {
      const evs = (raw && Array.isArray(raw.events) ? raw.events : []).filter((ev) => ev && Array.isArray(ev.segs));
      evs.sort((a, b) => (a.tStartMs || 0) - (b.tStartMs || 0));
      const parts = [];
      evs.forEach((ev) => {
        const t = mcCleanCue(ev.segs.map((s) => s.utf8 || '').join(''));
        if (t) parts.push(t);
      });
      return parts.join(' ');
    }

    // Chia khoảng thời gian [t0, t1] cho một dãy token theo độ dài chữ (mỗi từ tối thiểu ~0.08s).
    function mcSpread(tokens, t0, t1) {
      const cnt = tokens.length;
      if (t1 < t0 + 0.08 * cnt) t1 = t0 + 0.08 * cnt;
      const total = tokens.reduce((a, t) => a + Math.max(1, t.norm.length) + 1, 0);
      let acc = 0;
      return tokens.map((t) => {
        const s = t0 + (t1 - t0) * acc / total;
        acc += Math.max(1, t.norm.length) + 1;
        return { s, e: t0 + (t1 - t0) * acc / total };
      });
    }

    // Tiếng đệm / cụm chêm mà người nói thật sự nói, ASR nghe được nhưng phụ đề người làm thường lược bỏ.
    // Dùng khi một đoạn ASR bị thay bằng chữ người làm: tách các cụm này ở đầu/cuối đoạn ra để giữ lại (xếp cụm dài trước).
    const MC_FILLER_PHRASES = [
      ['you', 'know', 'what', 'i', 'mean'], ['you', 'know'], ['i', 'mean'], ['you', 'see']
    ];
    // Tiếng ngập ngừng vô nghĩa (um, uh, hmm...): người chép chính tả không viết ra nên KHÔNG giữ lại khi đối chiếu
    const MC_HESITATIONS = new Set(['um', 'umm', 'uh', 'uhh', 'uhm', 'er', 'erm', 'ah', 'hmm', 'hm', 'mm', 'mmm']);
    // Từ thường gặp ở đầu câu: có thể hạ chữ hoa khi đứng sau tiếng đệm mở câu (\"Um, so ...\")
    const MC_LOWER_AFTER_FILLER = new Set(['so', 'and', 'but', 'well', 'okay', 'ok', 'now', 'then', 'yes', 'no', 'the', 'a', 'an', 'we', 'you', 'they', 'it', 'he', 'she',
      'this', 'that', 'there', 'when', 'what', 'how', 'why', 'if', 'as', 'because', 'while', 'or', 'just', 'really', 'actually', 'basically', 'anyway', 'my', 'our', 'your', 'in', 'on', 'at', 'to', 'for', 'with']);
    // Cụm chêm có dấu phẩy hai bên khi đứng giữa câu
    const MC_PAREN_FILLERS = new Set(['you know what i mean', 'you know', 'i mean', 'you see']);

    // idxs: chỉ số các từ ASR trong đoạn; minKeep: số từ tối thiểu phải còn lại (để thay bằng chữ người làm). Trả về { lead, trail, rest }.
    function mcPeelFillers(idxs, flat, minKeep) {
      let rest = idxs.slice();
      const lead = [], trail = [];
      const matchLen = (arr, atEnd) => {
        for (const ph of MC_FILLER_PHRASES) {
          const L = ph.length;
          if (arr.length - L < minKeep) continue;
          const seg = atEnd ? arr.slice(arr.length - L) : arr.slice(0, L);
          if (seg.every((i, q) => flat[i].norm === ph[q])) return L;
        }
        return 0;
      };
      let L;
      while ((L = matchLen(rest, false))) { lead.push(...rest.slice(0, L)); rest = rest.slice(L); }
      while ((L = matchLen(rest, true))) { trail.unshift(...rest.slice(rest.length - L)); rest = rest.slice(0, rest.length - L); }
      return { lead, trail, rest };
    }

    function mergeManualIntoAsr(sents, manualText) {
      const flat = aicFlatten(sents);
      const n = flat.length;
      if (!n) return { ok: false, error: 'Chưa có phụ đề tự động để ghép.' };
      const toks = aicTokenize(manualText, 0);
      if (toks.length < Math.min(8, Math.ceil(n / 2))) return { ok: false, error: 'Phụ đề người làm rỗng hoặc quá ngắn.' };

      // Chia câu theo dấu câu của bản người làm (nếu bản đó gần như không có dấu câu thì giữ cách chia câu của ASR)
      let u = 0;
      toks.forEach((t, k) => {
        t.unit = u;
        const nxt = toks[k + 1];
        if (aicEndsSentence(t.text, nxt ? nxt.text : '')) u++;
      });
      const useManualSentences = u >= Math.max(2, Math.floor(toks.length / 60));

      // Căn chỉnh từng từ ASR (O) với từ người làm (A)
      const O = flat.map((f) => f.norm);
      const A = toks.map((t) => t.norm);
      const st = aicFindStart(O, A);
      const al = aicAlign(O, A, st.i0, st.j0);

      let firstMapped = -1, lastMapped = -1;
      for (let i = 0; i < n; i++) if (al.map[i] !== -1) { if (firstMapped < 0) firstMapped = i; lastMapped = i; }
      const span = lastMapped >= 0 ? lastMapped - firstMapped + 1 : 0;
      const density = span ? al.exact / span : 0;
      if (al.exact < Math.min(n, 6) || density < 0.6) {
        return { ok: false, error: `Phụ đề người làm không khớp với phụ đề tự động (chỉ khớp ${al.exact}/${n} từ).` };
      }

      // Các "mỏ neo": từ người làm j <-> đoạn từ ASR [i0..i1]
      const anchors = [];
      let lastJ = -1;
      for (let i = 0; i < n; i++) {
        const j = al.map[i];
        if (j >= 0 && j > lastJ) {
          anchors.push({ i0: i, i1: i + (al.merge[i] || 1) - 1, j });
          lastJ = j;
        }
      }
      if (!anchors.length) return { ok: false, error: 'Không tìm được từ nào khớp giữa hai phụ đề.' };

      const items = [];   // { w, s, e, asr, auto, sent, unit, joinNext }
      const pushAsr = (i) => /^\[[^\]]*\][.!?,]*$/.test(String(flat[i].w).trim()) ? null : items.push({ w: flat[i].w, s: flat[i].s, e: flat[i].e, asr: true, auto: !!flat[i].auto, sent: flat[i].sent });
      const manualItem = (j, s, e, sent) => ({ w: toks[j].text, s, e, asr: false, sent, unit: toks[j].unit, joinNext: !!toks[j].joinNext });
      let inserted = 0, keptAsr = 0;

      // Từ ASR mà phụ đề người làm lược bỏ nhưng người nói VẪN NÓI (you know, I mean, um, lặp từ...): giữ lại, để người học
      // chép chính tả đúng với những gì nghe được. Các từ này được gắn vào câu của từ người làm đứng cạnh (không tách thành câu riêng).
      const pushKept = (idxs, jPrev, jNext) => {
        const kept = idxs.filter((i) => flat[i].norm !== '' && !/^\[[^\]]*\][.!?,]*$/.test(String(flat[i].w).trim()));
        if (!kept.length) return;
        // Lặp đúng 1 từ (\"I I had\", \"the the\"): gộp thành 1, bỏ từ thừa. Lặp cả cụm từ 2 từ trở lên (\"we went to the, we went to the store\") thì giữ.
        const adj = [toks[jPrev].norm, toks[jNext] ? toks[jNext].norm : ''];
        if (kept.every((i) => flat[i].norm !== '' && adj.includes(flat[i].norm))) return;
        const startsNew = aicEndsSentence(toks[jPrev].text, toks[jPrev + 1] ? toks[jPrev + 1].text : '');   // câu trước đã kết thúc -> mở đầu câu kế
        const unit = startsNew ? toks[jNext].unit : toks[jPrev].unit;
        const first = items.length;
        kept.forEach((i) => {
          let w = flat[i].auto ? String(flat[i].w).replace(/[.?!]+$/, '') : flat[i].w;
          if (/^i(?:'(?:m|ll|d|ve))?$/.test(w)) w = 'I' + w.slice(1);   // đại từ \"I\" luôn viết hoa
          items.push({ w, s: flat[i].s, e: flat[i].e, asr: true, auto: false, sent: flat[i].sent, unit });
        });
        keptAsr += kept.length;
        if (startsNew) {
          if (useManualSentences) {
            items[first].w = items[first].w.charAt(0).toUpperCase() + items[first].w.slice(1);
            const phrase = kept.map((i) => flat[i].norm).join(' ');
            if (MC_FILLER_PHRASES.some((ph) => ph.join(' ') === phrase)) {
              // \"Um, so I want...\": tiếng đệm mở đầu câu -> thêm dấu phẩy, từ người làm đứng sau hạ chữ hoa (xem bước hậu xử lý bên dưới)
              const last = items[items.length - 1];
              if (!/[,.;:!?\u2014\u2013]$/.test(last.w)) last.w += ',';
              last.lowerNext = true;
            }
          }
        } else if (MC_PAREN_FILLERS.has(kept.map((i) => flat[i].norm).join(' '))) {
          // "is, you know, you're": chèn dấu phẩy quanh cụm chêm giữa câu (nếu chưa có dấu câu)
          const prev = items[first - 1], last = items[items.length - 1];
          if (prev && !prev.joinNext && !/[,.;:!?\u2014\u2013)\"'\u201d\u2019]$/.test(prev.w)) {
            prev.w += ',';
            if (!/[,.;:!?\u2014\u2013)\"'\u201d\u2019]$/.test(last.w)) last.w += ',';
          }
        }
      };

      for (let i = 0; i < anchors[0].i0; i++) pushAsr(i);   // ASR trước đoạn khớp đầu tiên (người làm không có): giữ nguyên

      for (let k = 0; k < anchors.length; k++) {
        const a = anchors[k];
        const cur = manualItem(a.j, flat[a.i0].s, flat[a.i1].e, flat[a.i0].sent);
        items.push(cur);
        const nx = anchors[k + 1];
        if (!nx) break;

        const gapA = [];
        for (let i = a.i1 + 1; i < nx.i0; i++) if (!MC_HESITATIONS.has(flat[i].norm)) gapA.push(i);
        const gapM = [];
        for (let j = a.j + 1; j < nx.j; j++) gapM.push(j);

        const useManualGap = gapM.length >= 3 || (gapM.length > 0 && gapA.length < 7);
        if (useManualGap) {
          const gm = gapM.map((j) => toks[j]);
          // Đoạn ASR dài hơn đoạn người làm và có tiếng đệm (you know, I mean, um...) ở đầu/cuối: tách ra giữ lại, phần còn lại mới thay bằng chữ người làm
          let ga = gapA, lead = [], trail = [];
          if (gapA.length > gapM.length) { const p = mcPeelFillers(gapA, flat, gapM.length); ga = p.rest; lead = p.lead; trail = p.trail; }
          pushKept(lead, a.j, gapM[0]);
          if (ga.length) {
            // ASR có các từ ở đây (nhưng không khớp chữ): dùng đúng khoảng thời gian đó cho các từ người làm
            const times = mcSpread(gm, flat[ga[0]].s, flat[ga[ga.length - 1]].e);
            gapM.forEach((j, q) => items.push(manualItem(j, times[q].s, times[q].e, flat[ga[0]].sent)));
          } else {
            // ASR bỏ sót hẳn từ này: "mượn" thời gian của từ khớp liền trước + khoảng trống phía sau
            const gapTime = Math.max(0, flat[nx.i0].s - cur.e);
            const extra = Math.min(gapTime, 0.2 * gm.length);
            const times = mcSpread([toks[a.j]].concat(gm), cur.s, cur.e + extra);
            cur.s = times[0].s; cur.e = times[0].e;
            gapM.forEach((j, q) => items.push(manualItem(j, times[q + 1].s, times[q + 1].e, cur.sent)));
          }
          pushKept(trail, gapM[gapM.length - 1], nx.j);
          inserted += gapM.length;
        } else if (gapA.length >= 7) {
          gapA.forEach(pushAsr);   // người làm cắt bớt lời nói -> vẫn giữ phần ASR nghe được
        } else if (gapA.length) {
          pushKept(gapA, a.j, nx.j);   // vài từ ASR người làm không viết (you know, um, lặp từ...) nhưng người nói có nói -> GIỮ
        }
      }

      for (let i = anchors[anchors.length - 1].i1 + 1; i < n; i++) pushAsr(i);   // ASR sau đoạn khớp cuối: giữ nguyên

      // Thời gian phải tăng dần, các từ không chồng lên nhau
      for (let k = 0; k < items.length - 1; k++) {
        const a = items[k], b = items[k + 1];
        if (b.s < a.s) b.s = a.s;
        if (b.e < b.s + 0.05) b.e = b.s + 0.05;
        if (a.e > b.s) a.e = Math.max(a.s + 0.05, b.s);
      }

      // Từ người làm đứng ngay sau tiếng đệm mở câu (\"Um, So...\"): hạ chữ hoa nếu là từ thường gặp (không đụng tới tên riêng và \"I\")
      for (let k = 0; k < items.length - 1; k++) {
        if (!items[k].lowerNext) continue;
        const nw = items[k + 1];
        if (nw && !nw.asr && MC_LOWER_AFTER_FILLER.has(nw.w.toLowerCase().replace(/[^a-z']/g, ''))) nw.w = nw.w.replace(/^([^A-Za-z]*)([A-Z])/, (m, p, c) => p + c.toLowerCase());
      }

      // Gom thành câu
      items.forEach((it) => {
        if (it.asr) it.g = (useManualSentences && it.unit !== undefined) ? it.unit : 'a' + it.sent;   // từ ASR được giữ lại thì nằm chung câu với từ người làm bên cạnh
        else it.g = useManualSentences ? it.unit : 's' + it.sent;
      });
      if (!useManualSentences) items.forEach((it) => { if (it.asr) it.g = 's' + it.sent; });

      const groups = [];
      items.forEach((it) => {
        const w = { word: it.w, startTime: it.s, endTime: it.e };
        if (it.joinNext) w.joinNext = true;
        if (it.asr && it.auto) w.autoPunct = true;
        const last = groups[groups.length - 1];
        if (last && last.g === it.g) last.words.push(w);
        else groups.push({ g: it.g, words: [w] });
      });

      const out = [];
      groups.forEach((g) => {
        const pieces = useManualSentences ? aicSplitLongWords(g.words, 50) : [g.words];
        pieces.forEach((ws) => {
          ws[ws.length - 1].joinNext = false;
          if (!useManualSentences) {
            const lw = ws[ws.length - 1];
            if (!/[.!?\u2026]["'\u201d\u2019)]*$/.test(lw.word)) { lw.word += '.'; lw.autoPunct = true; }
          }
          out.push(ws);
        });
      });

      const result = out.map((ws, idx) => ({
        id: idx + 1,
        startTime: ws[0].startTime,
        endTime: ws[ws.length - 1].endTime,
        text: aicComposeText(ws),
        words: ws
      }));
      for (let k = 0; k < result.length - 1; k++) {
        const nextStart = result[k + 1].startTime;
        if (result[k].endTime > nextStart) {
          result[k].endTime = nextStart;
          const lw = result[k].words[result[k].words.length - 1];
          if (lw.endTime > nextStart) lw.endTime = nextStart;
        }
      }

      return {
        ok: true,
        sentences: result,
        stats: {
          asrWords: n,
          manualWords: toks.length,
          matched: anchors.length,
          inserted,
          keptAsr,
          coverage: Math.round((anchors.length / toks.length) * 100),
          sentenceCount: result.length,
          usedManualSentences: useManualSentences
        }
      };
    }

    // (2) BẢN DỊCH SONG NGỮ: AI trả lời xen kẽ "câu Anh / câu Việt" (cùng dòng hoặc khác dòng).
    // Bản theo DÒNG (video): mỗi dòng AI trả lời là một đoạn. Một dòng có thể chứa cả Anh lẫn Việt không có dấu . ? ! ở giữa
    // (vd. "So, you know—you get started a little slowly, Nghĩa là, bạn biết đấy—...,"), nên tìm điểm chuyển ngôn ngữ trong dòng:
    // chọn vị trí k sao cho các từ trước k là tiếng Pháp (có trong phụ đề gốc, không có dấu tiếng Việt) và các từ sau k là tiếng Việt.
    function aicParseBilingualLines(raw, vocab) {
      const lines = aicCleanRaw(raw).split('\n').map((x) => x.trim()).filter(Boolean);
      const segs = [];
      const pushSegs = (toks, lang) => {
        let cur = [];
        toks.forEach((t, k) => {
          cur.push(t);
          if (aicEndsSentence(t, toks[k + 1])) { segs.push({ lang, text: cur.join(' ') }); cur = []; }
        });
        if (cur.length) segs.push({ lang, text: cur.join(' ') });   // hết dòng / hết phần Anh mà chưa có dấu kết câu: vẫn là một đoạn
      };
      let prevPureEn = false;   // dòng ngay trước là dòng thuần tiếng Pháp (định dạng xen kẽ Anh / Việt)
      lines.forEach((line) => {
        const toks = line.split(/\s+/);
        const n = toks.length;
        const f = toks.map((t) => { const nm = aicNorm(t); return { viU: AIC_VI_UNIQUE.test(t), has: !!nm, inV: vocab.has(nm) }; });
        const pre = [0];
        for (let i = 0; i < n; i++) pre.push(pre[i] + (f[i].viU ? 3 : (f[i].has && !f[i].inV ? 1 : 0)));
        const suf = new Array(n + 1).fill(0);
        for (let i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + ((!f[i].viU && f[i].has && f[i].inV) ? 1 : 0);
        let best = 0, bestCost = Infinity;
        for (let k = 0; k <= n; k++) {
          let cut = 0;
          if (k > 0 && k < n) {
            // Chỉ cho phép cắt giữa dòng (Anh | Việt) tại một RANH GIỚI thật. Dòng Việt mở đầu bằng chuỗi tên riêng tiếng Pháp
            // (vd "Thomas Jefferson, John Adams, George Washington, chỉ là ba...") trước đây bị cắt nhầm ngay sau dấu phẩy -> mất bản dịch của câu trước.
            const last = toks[k - 1];
            const isBoundary = aicEndsSentence(last, toks[k]) || /[\u2014\u2013][\"'\u201d)]*$/.test(last);
            if (/[,;:][\"'\u201d)]*$/.test(last)) continue;   // phần "Anh" dừng giữa câu (dấu phẩy...) -> chưa phải ranh giới Anh/Việt
            if (prevPureEn && !isBoundary) continue;           // dòng ngay sau một dòng Anh là dòng Việt: không tách tên riêng ở đầu dòng ra làm dòng Anh
            cut = 2.5;   // cắt giữa dòng cần bằng chứng rõ
          }
          const cost = pre[k] + suf[k] + cut;
          if (cost < bestCost - 1e-9) { bestCost = cost; best = k; }
        }
        prevPureEn = (best === n);
        if (best > 0) pushSegs(toks.slice(0, best), 'source');
        if (best < n) pushSegs(toks.slice(best), 'vi');
      });
      const blocks = [];
      let cur = null;
      segs.forEach((sg) => {
        if (sg.lang === 'source') {
          if (!cur || cur.vi.length > 0) { cur = { source: [], vi: [] }; blocks.push(cur); }
          cur.source.push(sg.text);
        } else if (cur) cur.vi.push(sg.text);
      });
      const units = [];
      blocks.forEach((b, bi) => {
        let vi = b.vi;
        if (bi === blocks.length - 1 && vi.length > b.source.length) vi = vi.slice(0, Math.max(1, b.source.length));
        b.source.forEach((sourceText, k) => {
          let v = '';
          if (vi.length === b.source.length) v = vi[k];
          else if (vi.length > 0 && k === b.source.length - 1) v = vi.join(' ');
          units.push({ source: sourceText, vi: v.trim() });
        });
      });
      // Nhóm "câu theo dấu chấm": các đoạn liên tiếp cho tới khi gặp đoạn kết thúc bằng . ? !
      let gc = 0;
      units.forEach((u) => {
        u.g = gc;
        const tk = u.source.trim().split(/\s+/);
        if (aicEndsSentence(tk[tk.length - 1], '')) gc++;
      });
      return units;
    }

    function aicParseBilingual(raw, vocab, lineChunks) {
      if (lineChunks) {
        const lu = aicParseBilingualLines(raw, vocab);
        if (lu.length && lu.some((x) => x.vi)) return lu;   // không nhận ra theo dòng -> quay về cách cũ
      }
      const lines = aicCleanRaw(raw).split('\n').map((s) => s.trim()).filter(Boolean);
      const classify = (text) => {
        const toks = text.split(/\s+/).map(aicNorm).filter(Boolean);
        let inVocab = 0;
        toks.forEach((t) => { if (vocab.has(t)) inVocab++; });
        const ratio = toks.length ? inVocab / toks.length : 0;
        let lang;
        if (ratio >= 0.45) lang = 'source';
        else if (AIC_VI_UNIQUE.test(text) || ratio < 0.4) lang = 'vi';
        else lang = 'source';
        return { lang, text };
      };
      const segs = [];
      lines.forEach((line) => {
        const toks = line.split(/\s+/);
        let cur = [];
        toks.forEach((t, k) => {
          cur.push(t);
          if (aicEndsSentence(t, toks[k + 1])) { segs.push(classify(cur.join(' '))); cur = []; }
        });
        if (cur.length) segs.push(classify(cur.join(' ')));
      });

      const blocks = [];
      let cur = null;
      segs.forEach((sg) => {
        if (sg.lang === 'source') {
          if (!cur || cur.vi.length > 0) { cur = { source: [], vi: [] }; blocks.push(cur); }
          cur.source.push(sg.text);
        } else if (cur) {
          cur.vi.push(sg.text);
        }
      });

      const units = [];
      blocks.forEach((b, bi) => {
        let vi = b.vi;
        if (bi === blocks.length - 1 && vi.length > b.source.length) vi = vi.slice(0, Math.max(1, b.source.length));
        b.source.forEach((sourceText, k) => {
          let v = '';
          if (vi.length === b.source.length) v = vi[k];
          else if (vi.length > 0 && k === b.source.length - 1) v = vi.join(' ');
          units.push({ source: sourceText, vi: v.trim() });
        });
      });
      return units;
    }

    function applyBilingualFromAi(sents, aiText, opts) {
      const lineChunks = !!(opts && opts.lineChunks);
      const flat = aicFlatten(sents);
      const vocab = new Set(flat.map((f) => f.norm).filter(Boolean));
      const units = aicParseBilingual(aiText, vocab, lineChunks);
      if (!units.length) return { ok: false, error: 'Không nhận ra được các cặp câu tiếng Pháp – tiếng Việt trong câu trả lời. Hãy kiểm tra lại nội dung đã dán.' };
      let tokens = [];
      const unitVi = [], unitGrp = [], unitFrenchWords = [];
      units.forEach((u, idx) => {
        tokens = tokens.concat(aicTokenize(u.source, idx));
        unitFrenchWords.push(new Set(u.source.split(/\s+/).map(aicNorm).filter(Boolean)));
        unitVi.push(u.vi);
        unitGrp.push(u.g);
      });
      if (!unitVi.some(Boolean)) return { ok: false, error: 'Không tìm thấy phần tiếng Việt trong câu trả lời. Hãy dán cả câu tiếng Pháp lẫn bản dịch tiếng Việt của AI.' };
      return aicRun(sents, tokens, unitVi, 'trans', (lineChunks && units[0].g !== undefined) ? unitGrp : undefined, unitFrenchWords);
    }

    // Tỉ lệ từ có dấu câu THẬT (không tính dấu chấm do app tự chèn theo khoảng lặng) -> phát hiện phụ đề "không dấu câu".
    function aicPunctuationDensity(sents) {
      let total = 0, punct = 0;
      (sents || []).forEach((s) => (s.words || []).forEach((w) => {
        total++;
        if (!w.autoPunct && /[.,?!;:]["')\u201d]*$/.test(w.word)) punct++;
      }));
      return total ? punct / total : 1;
    }

    // Transcript thuần văn bản để đưa vào prompt (không timecode). Bỏ dấu chấm app tự chèn.
    function aicPlainTranscript(sents) {
      let out = '';
      (sents || []).forEach((s) => {
        const ws = s.words && s.words.length ? s.words : String(s.text || '').split(/\s+/).filter(Boolean).map((w) => ({ word: w }));
        ws.forEach((w) => {
          out += (w.autoPunct ? w.word.replace(/[.?!]+$/, '') : w.word) + (w.joinNext ? '' : ' ');
        });
      });
      return out.trim();
    }

    function aicHasTranslation(sents) {
      return (sents || []).some((s) => s.vi && String(s.vi).trim());
    }

    function changeSubtitleFontSize(delta) {
      const newSize = Math.max(13, Math.min(32, currentSubFontSize + delta));
      if (newSize === currentSubFontSize) return;
      applySubtitleFontSize(newSize);
      saveUserPreferences();
    }

    function resetSubtitleFontSize() {
      if (currentSubFontSize === DEFAULT_SUB_FONT_SIZE) return;
      applySubtitleFontSize(DEFAULT_SUB_FONT_SIZE);
      saveUserPreferences();
    }

    function applySubtitleFontSize(size) {
      const container = document.getElementById('subtitles-scroll-container');
      if (!container) return;

      let anchorEl = currentHighlightedWordEl;
      if (!anchorEl) {
        const activeCard = container.querySelector('.sub-item-active');
        if (activeCard) anchorEl = activeCard;
      }

      let anchorOffsetBefore = 0;
      if (anchorEl) {
        anchorOffsetBefore = anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
      }

      currentSubFontSize = size;
      const transSize = Math.max(12, Math.round(size * 0.95)); // tỉ lệ chữ Việt / chữ Anh (VI_SIZE_RATIO)
      document.documentElement.style.setProperty('--sub-font-size', `${currentSubFontSize}px`);
      document.documentElement.style.setProperty('--sub-trans-size', `${transSize}px`);
      try { if (window.VP) VP.onRightSize(); } catch (e) {}   // nút CC: cập nhật số cỡ chữ nếu đang theo cỡ chữ bên phải

      if (anchorEl) {
        requestAnimationFrame(() => {
          const anchorOffsetAfter = anchorEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
          const diff = anchorOffsetAfter - anchorOffsetBefore;
          if (Math.abs(diff) > 0.5) {
            container.scrollTop += diff;
          }
        });
      }
    }

    function changeSubtitleLineHeight(delta) {
      currentTextLineHeight = Math.max(1.15, Math.min(2.0, Number((currentTextLineHeight + delta).toFixed(2))));
      currentTextGap = Math.max(4, Math.min(20, Math.round(currentTextGap + delta * 15)));
      applySubtitleLineHeight();
      saveUserPreferences();
    }

    function resetSubtitleLineHeight() {
      currentCardLineHeight = 1.30;
      currentTextLineHeight = 1.42;
      currentTextGap = 8;
      applySubtitleLineHeight();
      saveUserPreferences();
    }

    function applySubtitleLineHeight() {
      document.documentElement.style.setProperty('--sub-card-line-height', `${currentCardLineHeight}`);
      document.documentElement.style.setProperty('--sub-textmode-line-height', `${currentTextLineHeight}`);
      document.documentElement.style.setProperty('--sub-textmode-gap', `${currentTextGap}px`);
    }

    function initSplitResizer() {
      const resizer = document.getElementById('split-resizer');
      const container = document.getElementById('split-container');
      const leftPanel = document.getElementById('panel-left');
      const rightPanel = document.getElementById('panel-right');
      if (!resizer || !container || !leftPanel || !rightPanel) return;

      let isDragging = false;
      let startX = 0;
      let startLeftWidth = 0;
      let containerWidth = 0;
      let animationFrameId = null;

      const onStart = (clientX) => {
        if (window.innerWidth < 1024) return;
        isDragging = true;
        startX = clientX;
        containerWidth = container.getBoundingClientRect().width;
        startLeftWidth = leftPanel.getBoundingClientRect().width;

        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(f => f.style.pointerEvents = 'none');
      };

      const onMove = (clientX) => {
        if (!isDragging) return;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        animationFrameId = requestAnimationFrame(() => {
          const deltaX = clientX - startX;
          let newLeftWidth = startLeftWidth + deltaX;
          let percentage = (newLeftWidth / containerWidth) * 100;

          if (percentage < 30) percentage = 30;
          if (percentage > 70) percentage = 70;

          const rightPercentage = 100 - percentage;
          leftPanel.style.width = `calc(${percentage}% - 4px)`;
          rightPanel.style.width = `calc(${rightPercentage}% - 4px)`;
        });
      };

      const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);

        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(f => f.style.pointerEvents = 'auto');
        ensurePageFocus();
      };

      resizer.addEventListener('mousedown', (e) => {
        onStart(e.clientX);
        e.preventDefault();
      });

      window.addEventListener('mousemove', (e) => {
        if (isDragging) onMove(e.clientX);
      });

      window.addEventListener('mouseup', onEnd);

      resizer.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) onStart(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length > 0) onMove(e.touches[0].clientX);
      }, { passive: true });

      window.addEventListener('touchend', onEnd);
      window.addEventListener('touchcancel', onEnd);
    }

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
    let pendingUserVi = false;   // người dùng vừa tự nạp phụ đề/bản dịch ở màn hình nhập, chờ startPractice gắn cờ theo videoId

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
          if (h.isText || h.userTrans === true || !isLibraryVideo(h.videoId)) return;
          if (h.sentences && h.sentences.length && !aicHasTranslation(h.sentences)) { h.sentences = []; h.lib = true; changed = true; }
        });
        if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(hist));
      } catch (e) {}
    }
    let sharedNoSaveId = '';   // videoId đang xem từ link chia sẻ (không tự ghi đè lịch sử của người xem)
    let isTextMode = false;    // đang ở chế độ luyện shadowing với văn bản thuần (không có video)

    function getLocalHistory() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        return [];
      }
    }

    function saveToLocalHistory(item) {
      try {
        let history = getLocalHistory();
        const prevItem = history.find(h => h.videoId === item.videoId);
        const isLib = !item.isText && isLibraryVideo(item.videoId);
        const userTrans = isLib && (item.userTrans !== undefined ? !!item.userTrans : userTransVid === item.videoId);
        const keepSentences = !isLib || userTrans;   // video thư viện: chỉ giữ phụ đề khi là bản dịch của người dùng
        const mergedMeta = Object.assign({}, prevItem && prevItem.meta, item.meta);
        history = history.filter(h => h.videoId !== item.videoId);
        history.unshift({
          videoId: item.videoId,
          title: item.title || `YouTube Video (${item.videoId})`,
          duration: item.duration || (prevItem && prevItem.duration) || 0,
          meta: Object.keys(mergedMeta).length ? mergedMeta : undefined,   // tên kênh / lượt xem của video import từ extension
          format: item.format || 'srt',
          isText: !!item.isText,
          sentences: keepSentences ? item.sentences : [],
          lib: isLib ? true : undefined,
          userTrans: userTrans ? true : undefined,
          updatedAt: Date.now()
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

    function removeHistoryItem(videoId, e) {
      if (e) e.stopPropagation();
      try {
        let history = getLocalHistory().filter(h => h.videoId !== videoId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        renderHistorySection();
        if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncHistoryDebounced === 'function') {
          window.FSS_SUPABASE.syncHistoryDebounced(history);
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
      // Video thư viện (không có bản dịch riêng của người dùng) -> tải mới từ server thay vì dùng dữ liệu lưu trên máy
      if (!item.isText && (isLibraryVideo(videoId) || item.lib === true) && item.userTrans !== true) { selectCategoryVideo(videoId, item.title, (typeof libCatState !== 'undefined' && libCatState && libCatState.cat === LIB_RECENT) ? 'hp-' : 'hist-'); return; }
      if (!item.sentences || item.sentences.length === 0) return;
      if (!item.isText) userTransVid = item.userTrans === true ? videoId : '';

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

      captureHomeState();   // chụp trạng thái trang chủ trước khi lưu lịch sử
      saveToLocalHistory({
        videoId: currentVideoId,
        title: currentVideoTitle || `Video ${currentVideoId}`,
        format: subtitleFormat,
        sentences: sentences
      });

      document.getElementById('screen-vocab').classList.add('hidden');
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();
      currentSentenceIndex = 0;
      isTextMode = false;
      document.body.classList.remove('text-mode');
      resetPlaybackTrackingState();
      initYouTubePlayer();
      renderSubtitleList();
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
    function enterTextShadowing(rawText, title, articleId) {
      const docId = articleId ? `art_${articleId}` : `txt_${textDocHash(rawText)}`;
      const saved = getLocalHistory().find((h) => h.videoId === docId && h.isText && h.sentences && h.sentences.length);
      let parsed;
      if (saved) {
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
    }

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
      enterTextShadowing(raw, title, null);
    }

    window.handleTextFileInput = function(e) {
      const file = e.target && e.target.files && e.target.files[0];
      if (!file) return;
      const baseName = file.name.replace(/\.[^.]+$/, '');
      const ti = document.getElementById('text-shadow-title-input');
      const ta = document.getElementById('text-shadow-textarea');
      if (ti && !ti.value.trim()) ti.value = baseName;

      const ext = (file.name.split('.').pop() || '').toLowerCase();
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
        if (autoPlay) {
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
      if (settings.karaokeMode) {
        btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-red-600/30 text-red-200 border-red-500/60 glow-red shrink-0 whitespace-nowrap';
      } else {
        btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';
        if (currentHighlightedWordEl) {
          currentHighlightedWordEl.classList.remove('karaoke-word-active');
          currentHighlightedWordEl = null;
        }
      }
      saveUserPreferences();
    }

    function toggleAutoScroll() {
      settings.autoScroll = !settings.autoScroll;
      const btn = document.getElementById('btn-toggle-autoscroll');
      if (settings.autoScroll) {
        btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-red-600/30 text-red-200 border-red-500/60 glow-red shrink-0 whitespace-nowrap';
        lastReportedScrollTarget = -1;
        lastTrackedLineTop = -1;
        triggerSmoothCenterScroll(currentSentenceIndex, true);
      } else {
        btn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';
      }
      saveUserPreferences();
    }

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


    // ==================== TRA CỨU TỪ VỰNG ====================
    const lookupTooltip = document.getElementById('lookup-tooltip');
    const btnLookupAction = document.getElementById('btn-lookup-action');

    let selectedRangeForLoop = null;
    let vocabAreaCtx = null;   // != null khi đang bôi đen trong "Từ vựng đã lưu" / "Từ khó" (hiện Tra nghĩa + Lưu + Phát âm, không có Loop)

    // Bôi đen chữ tiếng Pháp trong thẻ từ vựng (câu chứa từ, ví dụ, tên từ) ở màn "Từ vựng đã lưu" hoặc cửa sổ "Từ khó".
    // Trả về null nếu vùng chọn không nằm trong 2 nơi này; {ok:false} nếu nằm trong nhưng không hợp lệ (phần tiếng Việt, nhiều thẻ...).
    function vocabAreaInfo(selection, text) {
      const nodeEl = (n) => (!n ? null : (n.nodeType === 1 ? n : n.parentElement));
      const a = nodeEl(selection.anchorNode), f = nodeEl(selection.focusNode);
      if (!a || !f) return null;
      const vs = document.getElementById('screen-vocab');
      const km = document.getElementById('keyvocab-modal');
      let area = '';
      if (vs && !vs.classList.contains('hidden') && vs.contains(a)) area = 'vocab';
      else if (km && km.classList.contains('open') && km.contains(a)) area = 'kv';
      if (!area) return null;
      const bad = { ok: false };
      if (!(area === 'vocab' ? vs : km).contains(f)) return bad;
      const card = a.closest('.vocab-card');
      if (!card || card !== f.closest('.vocab-card')) return bad;
      const BLOCK = '.vocab-ctx, .vocab-ex-en, .vocab-word';   // chỉ phần tiếng Pháp
      const block = a.closest(BLOCK);
      if (!block || block !== f.closest(BLOCK)) return bad;
      if (!/\p{L}/u.test(text)) return bad;

      const isCtx = block.classList.contains('vocab-ctx');
      let src = {}, prev = '', vi = '';
      if (area === 'vocab') {
        const item = getVocab().find((v) => v.id === card.getAttribute('data-vid'));
        if (!item) return bad;
        src = { videoId: item.videoId, videoTitle: item.videoTitle || '', t: item.t || 0, bookId: item.bookId, ch: item.ch, srcUrl: item.srcUrl };
        if (isCtx) { prev = item.prev || ''; vi = item.vi || ''; }
      } else {
        const it = kvGet()[parseInt(card.getAttribute('data-kv-i'), 10)];
        if (!it) return bad;
        const c = kvFindContext(it);
        const inBook = bkActive() && bkBook;
        src = { videoId: currentVideoId, videoTitle: currentVideoTitle || '', t: c ? (c.s.startTime || 0) : 0, bookId: inBook ? bkBook.id : undefined, ch: inBook ? bkCh : undefined };
        if (isCtx && c) {
          const idx = sentences.indexOf(c.s);
          prev = idx > 0 ? String(sentences[idx - 1].text || '').trim() : '';
          vi = String(c.s.vi || '').trim();
        }
      }

      // Vị trí chữ bôi đen trong khối văn bản (để tô sáng khi lưu)
      const range = selection.getRangeAt(0);
      let en = block.textContent, hs = -1, he = -1;
      try {
        const r = document.createRange();
        r.setStart(block, 0);
        r.setEnd(range.startContainer, range.startOffset);
        hs = r.toString().length;
        he = hs + range.toString().length;
      } catch (e) { hs = -1; }
      if (hs < 0 || en.slice(hs, he) !== range.toString()) { hs = en.indexOf(text); he = hs + text.length; }
      if (hs < 0) { en = text; hs = 0; he = text.length; prev = ''; vi = ''; }
      if (en.length > 2500) { en = text; hs = 0; he = text.length; prev = ''; vi = ''; }
      const seg = en.slice(hs, he);
      hs += seg.match(/^[^\p{L}\p{N}]*/u)[0].length;
      he -= seg.match(/[^\p{L}\p{N}]*$/u)[0].length;
      if (he <= hs) return bad;
      const picked = en.slice(hs, he).trim();
      if (!picked || picked.length > 600) return bad;

      // Ngữ cảnh cho "Tra nghĩa": với tên từ thì lấy câu chứa từ trong thẻ
      let ctxText = en;
      if (block.classList.contains('vocab-word')) { const cp = card.querySelector('.vocab-ctx'); if (cp) ctxText = cp.textContent; }
      const contextStr = ((isCtx && prev) ? prev + ' ' : '') + ctxText;
      return { ok: true, text: picked, en, hs, he, prev, vi, src, contextStr };
    }

    function buildVocabItemFromArea(va) {
      const n = va.text.split(/\s+/).length;
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: va.text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'),
        en: va.en, hs: va.hs, he: va.he, vi: va.vi || '', prev: va.prev || '',
        videoId: va.src.videoId, videoTitle: va.src.videoTitle || '', t: va.src.t || 0, createdAt: Date.now(),
        bookId: va.src.bookId, ch: va.src.ch
      };
      if (va.src.srcUrl) item.srcUrl = va.src.srcUrl;
      return item;
    }

    function hideLookupTooltip() {
      if (lookupTooltip) lookupTooltip.style.display = 'none';
      selectedTextForLookup = '';
      selectedRangeForLoop = null;
      vocabAreaCtx = null;
      isHoveringLookupTooltip = false;
    }

    // Điện thoại / máy tính bảng: sau khi bôi đen (pop-up Tra nghĩa / Lưu / Loop đang hiện), nếu người dùng vuốt cuộn phụ đề
    // lên hoặc xuống thì ẩn pop-up + bỏ vùng bôi đen. Chỉ tính cử chỉ vuốt thật của ngón tay (touchmove làm vùng cuộn đổi vị trí),
    // nên karaoke tự cuộn phụ đề hay kéo tay cầm bôi đen không bị ảnh hưởng.
    (function dismissLookupTooltipOnSwipe() {
      const isTouchDevice = () => !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
      const tipVisible = () => !!lookupTooltip && lookupTooltip.style.display === 'block';
      const scrollParentOf = (n) => {
        let el = n && n.nodeType === 1 ? n : (n && n.parentElement);
        while (el && el !== document.body && el !== document.documentElement) {
          const oy = getComputedStyle(el).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) return el;
          el = el.parentElement;
        }
        return null;
      };
      let sw = null;
      document.addEventListener('touchstart', (e) => {
        sw = null;
        if (!tipVisible() || !isTouchDevice() || e.touches.length !== 1) return;
        if (lookupTooltip.contains(e.target)) return;
        const el = scrollParentOf(e.target);
        sw = { y: e.touches[0].clientY, el: el, top: el ? el.scrollTop : 0, win: window.scrollY };
      }, { capture: true, passive: true });
      document.addEventListener('touchmove', (e) => {
        if (!sw || !tipVisible()) return;
        const t = e.touches[0];
        if (!t || Math.abs(t.clientY - sw.y) < 8) return;
        const scrolled = sw.el ? sw.el.scrollTop !== sw.top : window.scrollY !== sw.win;
        if (!scrolled) return;
        sw = null;
        hideLookupTooltip();
        try { window.getSelection().removeAllRanges(); } catch (err) {}
      }, { capture: true, passive: true });
      document.addEventListener('touchend', () => { sw = null; }, { capture: true, passive: true });
      document.addEventListener('touchcancel', () => { sw = null; }, { capture: true, passive: true });
    })();

    function checkTextSelection() {
      if (window.vtSelectionHook && window.vtSelectionHook()) return;   // đang ở màn Luyện dịch Việt → Pháp: bôi đen bản dịch AI
      if (window.pvSelectionHook && window.pvSelectionHook()) return;   // đang ở giao diện Shadowing: giao diện đó tự xử lý popup Loop
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';

      if (!text) {
        hideLookupTooltip();
        return;
      }

      // Bôi đen trong "Từ vựng đã lưu" / "Từ khó": hiện Tra nghĩa + Lưu từ vựng (+ Phát âm nếu đúng 1 từ), không có Loop
      const va = vocabAreaInfo(selection, text);
      if (va && !va.ok) {
        hideLookupTooltip();
        return;
      }

      if (!va) {
        const container = activeSubContainer();
        if (!container) return;

        const vidEnEl = document.getElementById('vid-en');   // phụ đề tiếng Pháp đè lên video: bôi đen cũng hiện popup như phụ đề bên phải
        const csTextEl = document.getElementById('cs-text');   // thẻ phụ đề câu hiện tại (dưới nút điều hướng): bôi đen cũng hiện popup
        const inVidEn = !!(selection.anchorNode && ((vidEnEl && vidEnEl.contains(selection.anchorNode)) || (csTextEl && csTextEl.contains(selection.anchorNode))));
        if (!inVidEn && (!selection.anchorNode || !container.contains(selection.anchorNode))) {
          hideLookupTooltip();
          return;
        }

        // Bôi đen phụ đề tiếng Việt: vẫn cho copy chữ bình thường, nhưng không hiện popup Tra nghĩa/Loop.
        const anchorEl = selection.anchorNode.nodeType === 1 ? selection.anchorNode : selection.anchorNode.parentElement;
        if (anchorEl && anchorEl.closest('.sub-vi-line')) {
          hideLookupTooltip();
          return;
        }
      }

      if (!va && subtitleLoopActive) stopLoopAndPause();   // bôi đen phụ đề khi đang loop -> tắt loop + dừng video

      selectedTextForLookup = text;

      const range = selection.getRangeAt(0);
      selectedRangeForLoop = range.cloneRange();
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) {
        hideLookupTooltip();
        return;
      }

      // Đang bật "Ẩn chữ" (luyện chép chính tả) -> chỉ cho Loop nghe lại, ẩn nút
      // "Tra nghĩa" vì bôi đen được tức là đã biết đoạn đó viết gì, tra nghĩa lúc
      // này không còn ý nghĩa và còn vô tình "gợi ý" đáp án khi đang luyện nghe.
      // "Ẩn chữ" chỉ có ở video: đọc bài / đọc sách thì luôn cho tra nghĩa.
      vocabAreaCtx = va || null;
      const loopBtnEl = document.getElementById('btn-loop-action');
      if (loopBtnEl) loopBtnEl.style.display = va ? 'none' : '';
      const blurActive = !va && !!settings.blurMode && !isTextMode && !bkActive();
      if (btnLookupAction) {
        btnLookupAction.style.display = blurActive ? 'none' : '';
      }
      // "Phát âm" hiển thị khi bôi đen từ hoặc cụm ngắn
      const btnPron = document.getElementById('btn-pronounce-action');
      if (btnPron) {
        const pw = getSingleWordForLookup(text) || (text && text.trim().length <= 150 ? text.trim() : '');
        btnPron.style.display = (!blurActive && pw) ? '' : 'none';   // trong "Từ vựng đã lưu" / "Từ khó" cũng hiện khi bôi đen
        if (pw) {
          btnPron.title = 'Phát âm "' + pw + '" · Shift + click: Mở Từ điển Larousse';
        }
      }

      lookupTooltip.style.left = `${rect.left + rect.width / 2}px`;
      lookupTooltip.style.top = `${rect.top}px`;
      lookupTooltip.style.display = 'block';
      {
        const half = lookupTooltip.offsetWidth / 2;
        const cx = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
        lookupTooltip.style.left = `${cx}px`;
      }
    }

    // Lấy khoảng thời gian [start, end] của đoạn văn bản đang bôi đen, dựa trên
    // các span.sub-word-unit (mỗi từ đã có data-start / data-end) giao với Range đó.
    function getTimeRangeFromSelection(range) {
      if (!range) return null;
      const container = document.getElementById('subtitles-scroll-container');
      if (!container) return null;

      const wordEls = document.querySelectorAll('#subtitles-scroll-container .sub-word-unit, #vid-en .sub-word-unit, #cs-text .sub-word-unit');
      let minStart = null;
      let maxEnd = null;

      wordEls.forEach((el) => {
        if (range.intersectsNode(el)) {
          const s = parseFloat(el.getAttribute('data-start'));
          const e = parseFloat(el.getAttribute('data-end'));
          if (!isNaN(s) && (minStart === null || s < minStart)) minStart = s;
          if (!isNaN(e) && (maxEnd === null || e > maxEnd)) maxEnd = e;
        }
      });

      if (minStart === null || maxEnd === null || maxEnd <= minStart) return null;
      return { start: minStart, end: maxEnd };
    }

    // Mặc định Delay = 0s. Đổi sang khoá lưu mới (v2) để giá trị 1s cũ đã lưu trong trình duyệt không ghi đè mặc định mới.
    let loopDelaySeconds = (() => {
      try {
        const raw = localStorage.getItem('shadowing_loop_delay_v2');
        const v = raw === null ? NaN : parseFloat(raw);
        return Number.isFinite(v) ? Math.max(0, Math.min(20, v)) : 0;
      } catch (e) { return 0; }
    })();
    let loopWaitingAtEnd = false;   // đang tạm dừng ở cuối đoạn loop (chờ hết delay, hoặc chờ Backspace khi "Tự dừng cuối câu" đang bật)
    let loopDelayTimer = null;
    let loopPreSeeked = false;      // đã tua sẵn về đầu đoạn trong lúc pause -> hết delay chỉ cần phát là ra tiếng ngay
    let loopGuardUntil = 0;         // bỏ qua kiểm tra mốc cuối ngay sau khi vừa tua (getCurrentTime có thể chưa kịp cập nhật)

    function setLoopDelay(v) {
      loopDelaySeconds = Math.max(0, Math.min(20, Math.round(v)));
      const el = document.getElementById('loop-delay-value');
      if (el) el.textContent = `${loopDelaySeconds}s`;
      try { localStorage.setItem('shadowing_loop_delay_v2', String(loopDelaySeconds)); } catch (e) {}
    }
    function adjustLoopDelay(delta) { setLoopDelay(loopDelaySeconds + delta); }

    // Tua về đầu đoạn loop. autoPlay=false: chỉ tua (dùng ngay lúc bắt đầu pause cuối đoạn, để video kịp nạp sẵn
    // dữ liệu ở đầu đoạn trong khoảng thời gian delay -> khi hết delay phát lại tức thì, không bị khựng thêm).
    function loopSeekToStart(autoPlay) {
      if (!subtitleLoopActive || !ytPlayer) return;
      isInternalSeekAction = true;
      lastPlayerCurrentTime = subtitleLoopStart;
      seekTargetTime = subtitleLoopStart;
      seekGraceUntil = Date.now() + 400;
      handledSentenceEndId = null;
      pausedByAutoPauseId = null;
      stopAtSentenceEndId = null;
      autoPauseCooldownUntil = Date.now() + 800;
      currentSentenceIndex = getSentenceIndexForTime(subtitleLoopStart);
      ytPlayer.seekTo(subtitleLoopStart, true);
      if (autoPlay) ytPlayer.playVideo();
      setTimeout(() => { isInternalSeekAction = false; }, 500);
    }

    // Phát lại đoạn đang loop từ đầu ngay lập tức (dùng khi hết delay, hoặc khi người dùng bấm Backspace / Space
    // để thoát trạng thái tạm dừng do "Tự dừng cuối câu").
    function restartLoopFromStart() {
      if (!subtitleLoopActive || !ytPlayer) return;
      if (loopDelayTimer) { clearTimeout(loopDelayTimer); loopDelayTimer = null; }
      loopWaitingAtEnd = false;
      loopGuardUntil = Date.now() + 350;
      if (loopPreSeeked) {
        loopPreSeeked = false;
        pausedByAutoPauseId = null;
        handledSentenceEndId = null;
        autoPauseCooldownUntil = Date.now() + 800;
        ytPlayer.playVideo();
      } else {
        loopSeekToStart(true);
      }
    }

    // ---- Popup "Dừng loop" hiện ngay trên đoạn chữ đang loop (thay cho thanh ở giữa đáy màn hình) ----
    let loopPopEl = null, loopPopRange = null, loopPopRaf = 0, loopPopFbAt = 0, loopPopFbRect = null;
    function loopPopEnsure() {
      if (loopPopEl) return loopPopEl;
      const el = document.createElement('div');
      el.id = 'loop-stop-pop';
      el.className = 'dc-loop-pop stop';
      el.innerHTML = '<button type="button" id="loop-stop-btn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2.1l4 4-4 4"></path><path d="M3 12.2v-2a4 4 0 0 1 4-4h12.8"></path><path d="M7 21.9l-4-4 4-4"></path><path d="M21 11.8v2a4 4 0 0 1-4 4H4.2"></path></svg><span>Dừng loop</span></button>';
      el.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
      el.addEventListener('click', (e) => {
        e.preventDefault(); e.stopPropagation();
        const st = e.target.closest && e.target.closest('.lsp-step');
        if (st) { adjustLoopDelay(parseInt(st.getAttribute('data-d'), 10) || 0); return; }
        if (e.target.closest && e.target.closest('#loop-stop-btn')) stopSubtitleLoop();
      });
      document.body.appendChild(el);
      loopPopEl = el;
      return el;
    }
    function loopPopRect() {
      try {
        if (loopPopRange && loopPopRange.startContainer && loopPopRange.startContainer.isConnected) {
          const r = loopPopRange.getBoundingClientRect();
          if (r && r.width > 0 && r.height > 0) return r;
        }
      } catch (e) {}
      // Vùng chọn gốc đã bị vẽ lại (đổi câu...): tìm lại các chữ nằm trong đoạn loop theo mốc thời gian (không quét mỗi khung hình cho nhẹ)
      const now = Date.now();
      if (now - loopPopFbAt < 300) return loopPopFbRect;
      loopPopFbAt = now; loopPopFbRect = null;
      const a = subtitleLoopStart, b = subtitleLoopEnd;
      if (a == null || b == null) return null;
      const sels = ['#cs-text .sub-word-unit', '#subtitles-scroll-container .sub-word-unit'];
      for (let k = 0; k < sels.length && !loopPopFbRect; k++) {
        let u = null;
        document.querySelectorAll(sels[k]).forEach((w) => {
          const ws = parseFloat(w.getAttribute('data-start')), we = parseFloat(w.getAttribute('data-end'));
          if (!(ws >= a - 0.03 && we <= b + 0.03)) return;
          const r = w.getBoundingClientRect(); if (!r.width) return;
          u = u ? { left: Math.min(u.left, r.left), right: Math.max(u.right, r.right), top: Math.min(u.top, r.top), bottom: Math.max(u.bottom, r.bottom) } : { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        });
        loopPopFbRect = u;
      }
      return loopPopFbRect;
    }
    function loopPopTick() {
      loopPopRaf = 0;
      const el = loopPopEl;
      if (!el || !subtitleLoopActive) return;
      loopPopRaf = requestAnimationFrame(loopPopTick);
      { const nt = performance.now();
        if (nt - loopMarkAt > 300) { loopMarkAt = nt; const big = nt - loopMarkBigAt > 1500; if (big) loopMarkBigAt = nt; loopMarkWords(big); } }
      if (document.body.getAttribute('data-pv-view') && document.body.getAttribute('data-pv-view') !== 'default') { el.classList.remove('on'); loopBoxClearAll(); return; }
      window.LoopBox.render('cs', document.querySelectorAll('#cs-text .loopsel'));
      window.LoopBox.render('right', document.querySelectorAll('#subtitles-scroll-container .loopsel'));
      const r = loopPopRect();
      if (!r) { el.classList.remove('on'); return; }
      el.classList.add('on');
      const half = (el.offsetWidth || 180) / 2, h = el.offsetHeight || 36;
      const cx = (r.left + r.right) / 2;
      el.style.left = Math.max(half + 8, Math.min(window.innerWidth - half - 8, cx)) + 'px';
      el.style.top = Math.min(window.innerHeight - 8, Math.max(h + 14, r.top - 6)) + 'px';
    }
    function loopPopShow(range) {
      const el = loopPopEnsure();
      loopPopRange = range || null; loopPopFbAt = 0; loopPopFbRect = null;
      el.classList.add('on');
      loopMarkWords(true);
      if (!loopPopRaf) loopPopRaf = requestAnimationFrame(loopPopTick);
    }
    function loopPopHide() {
      if (loopPopRaf) { cancelAnimationFrame(loopPopRaf); loopPopRaf = 0; }
      loopPopRange = null; loopPopFbRect = null;
      if (loopPopEl) loopPopEl.classList.remove('on');
      loopMarkWords(true);   // subtitleLoopActive đã tắt -> gỡ đánh dấu chữ loop
      loopBoxClearAll();
    }
    // ---- Khung chữ nhật xanh bọc quanh đoạn đang loop (kiểu timeline In/Out của Chép chính tả); dùng chung cho Mặc định và Shadowing ----
    window.LoopBox = (function () {
      // Mỗi nhóm (key) có 1 "lớp" chứa các khung. Nếu chữ nằm trong vùng cuộn thì lớp nằm BÊN TRONG vùng cuộn đó (position:absolute),
      // nên khung cuộn cùng chữ ở cấp trình duyệt -> không bao giờ bị trễ / "đuổi theo" chữ khi kéo phụ đề.
      const sets = {};
      function scrollerOf(el) {
        for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
          const oy = getComputedStyle(p).overflowY;
          if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
        }
        return null;
      }
      function makeLayer(host) {
        const ly = document.createElement('div');
        ly.className = 'loop-box-layer ' + (host ? 'in' : 'fx');
        (host || document.body).appendChild(ly);
        return ly;
      }
      function clear(key) { const st = sets[key]; if (st) st.segs.forEach((n) => n.classList.remove('on')); }
      function render(key, words) {
        const lines = [];
        let first = null;
        for (let i = 0; i < words.length; i++) {
          const w = words[i]; if (!w || !w.isConnected) continue;
          const r = w.getBoundingClientRect(); if (!(r.width > 0 && r.height > 0)) continue;
          if (!first) first = w;
          const L = lines[lines.length - 1], mid = (r.top + r.bottom) / 2;
          if (L && mid >= L.top && mid <= L.bottom) { L.left = Math.min(L.left, r.left); L.right = Math.max(L.right, r.right); L.top = Math.min(L.top, r.top); L.bottom = Math.max(L.bottom, r.bottom); }
          else lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
        }
        if (!lines.length) { clear(key); return; }
        const host = scrollerOf(first);
        let st = sets[key];
        if (!st || st.host !== host || !st.layer.isConnected) {
          if (st && st.layer.parentNode) st.layer.remove();
          st = sets[key] = { host: host, layer: makeLayer(host), segs: [] };
        }
        if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';
        if (host && host.lastElementChild !== st.layer) host.appendChild(st.layer);
        const lr = st.layer.getBoundingClientRect();   // gốc toạ độ của lớp: luôn đi cùng nội dung khi cuộn
        const PAD = 2, HANDLE_PAD = 9;   // HANDLE_PAD = bề dày tay nắm (7px) + 2px chừa trống để tay nắm không đè lên chữ
        for (let i = 0; i < lines.length; i++) {
          let n = st.segs[i];
          if (!n) { n = document.createElement('div'); n.className = 'loop-seg'; n.innerHTML = '<i class="lh l"></i><i class="lh r"></i>'; st.layer.appendChild(n); st.segs[i] = n; }
          const L = lines[i];
          const lp = i === 0 ? HANDLE_PAD : PAD, rp = i === lines.length - 1 ? HANDLE_PAD : PAD;   // chỉ đầu đoạn / cuối đoạn mới có tay nắm
          n.style.left = (L.left - lp - lr.left) + 'px';
          n.style.top = (L.top - PAD - lr.top) + 'px';
          n.style.width = (L.right - L.left + lp + rp) + 'px';
          n.style.height = (L.bottom - L.top + PAD * 2) + 'px';
          n.classList.toggle('no-in', i > 0);
          n.classList.toggle('no-out', i < lines.length - 1);
          n.classList.add('on');
        }
        for (let i = lines.length; i < st.segs.length; i++) st.segs[i].classList.remove('on');
      }
      return { render: render, clear: clear };
    })();
    function loopBoxClearAll() { if (window.LoopBox) { window.LoopBox.clear('cs'); window.LoopBox.clear('right'); } }
    // Tô xanh các chữ nằm trong đoạn đang loop (phụ đề bên phải + thẻ câu hiện tại dưới video), giống giao diện Chép chính tả.
    // all=false: chỉ làm lại thẻ câu hiện tại (nó được vẽ lại mỗi khi đổi câu); all=true: làm lại cả danh sách phụ đề bên phải.
    let loopMarkAt = 0, loopMarkBigAt = 0;
    function loopMarkWords(all) {
      const a = subtitleLoopStart, b = subtitleLoopEnd;
      const on = !!subtitleLoopActive && a != null && b != null;
      const sel = all ? '#cs-text .sub-word-unit, #subtitles-scroll-container .sub-word-unit' : '#cs-text .sub-word-unit';
      document.querySelectorAll(sel).forEach((w) => {
        let m = false;
        if (on) {
          const ws = parseFloat(w.getAttribute('data-start')), we = parseFloat(w.getAttribute('data-end'));
          const mid = (ws + we) / 2;
          m = mid >= a - 0.03 && mid <= b + 0.03;
        }
        if (m !== w.classList.contains('loopsel')) w.classList.toggle('loopsel', m);
      });
    }

    function startSubtitleLoop(startTime, endTime, label, range) {
      if (!ytPlayer) { showVocabToast('Chế độ văn bản không có video để loop', false); return; }
      // Tắt loop cũ (nếu có) TRƯỚC khi seek, để seekToTime không hiểu nhầm đây là
      // hành động "rời khỏi đoạn đang loop" rồi tự hủy loop mới sắp bật.
      subtitleLoopActive = false;
      loopStartingNoScroll = true;
      try { seekToTime(startTime, undefined, true, null, false); } finally { loopStartingNoScroll = false; }
      subtitleLoopActive = true;
      subtitleLoopStart = startTime;
      subtitleLoopEnd = endTime;
      loopWaitingAtEnd = false;
      loopPreSeeked = false;
      loopGuardUntil = Date.now() + 400;
      if (loopDelayTimer) { clearTimeout(loopDelayTimer); loopDelayTimer = null; }
      setLoopDelay(loopDelaySeconds);

      loopPopShow(range);

      if (subtitleLoopRafId) cancelAnimationFrame(subtitleLoopRafId);
      const watchLoop = () => {
        if (!subtitleLoopActive) return;
        subtitleLoopRafId = requestAnimationFrame(watchLoop);
        if (loopWaitingAtEnd) return;   // đang tạm dừng chờ hết delay / chờ Backspace -> không kiểm tra tiếp
        if (Date.now() < loopGuardUntil) return;
        if (!ytPlayer || !ytPlayer.getCurrentTime) return;
        try {
          const t = ytPlayer.getCurrentTime();
          // Chỉ theo dõi mốc kết thúc; tốc độ phát (0.5x, 0.75x...) không ảnh hưởng
          // logic này vì ta luôn đọc thời gian thực tế của video, không phải theo nhịp cố định.
          if (t >= subtitleLoopEnd - 0.03) {
            if (!settings.autoPause && !settings.sentenceAutoStop && loopDelaySeconds === 0) {
              // Delay 0s: không cần dừng, nhảy thẳng về đầu đoạn và phát tiếp -> lặp liền mạch.
              loopGuardUntil = Date.now() + 350;
              loopSeekToStart(true);
              return;
            }
            loopWaitingAtEnd = true;
            ytPlayer.pauseVideo();
            // Tua về đầu đoạn NGAY khi vừa pause (video vẫn đứng yên), để trong lúc chờ delay trình phát kịp nạp
            // sẵn dữ liệu -> hết delay chỉ việc phát, ra tiếng ngay lập tức.
            loopSeekToStart(false);
            loopPreSeeked = true;
            if (settings.autoPause || settings.sentenceAutoStop) {
              // "Tự dừng cuối câu" đang bật -> dừng hẳn ở đây, đợi người dùng bấm Backspace mới phát lại từ đầu đoạn.
              return;
            }
            // Đợi đủ thời gian Delay (để người dùng kịp nhại lại - shadowing) rồi mới tự phát lại.
            loopDelayTimer = setTimeout(() => { restartLoopFromStart(); }, loopDelaySeconds * 1000);
          } else if (t < subtitleLoopStart - 0.5) {
            // Đánh dấu đây là seek NỘI BỘ của app (giống cơ chế seekToTime), để bộ
            // phát hiện "scrub timeline" trong startTrackingLoop() không hiểu nhầm
            // cú nhảy về đầu đoạn này là người dùng tự kéo thanh timeline rồi tự ý
            // ép cuộn phụ đề bất chấp chuột đang hover hay không.
            isInternalSeekAction = true;
            lastPlayerCurrentTime = subtitleLoopStart;
            seekGraceUntil = Date.now() + 400;
            ytPlayer.seekTo(subtitleLoopStart, true);
            setTimeout(() => { isInternalSeekAction = false; }, 500);
          }
        } catch (e) {}
      };
      subtitleLoopRafId = requestAnimationFrame(watchLoop);
    }

    function stopSubtitleLoop() {
      subtitleLoopActive = false;
      subtitleLoopStart = null;
      subtitleLoopEnd = null;
      loopWaitingAtEnd = false;
      if (loopDelayTimer) { clearTimeout(loopDelayTimer); loopDelayTimer = null; }
      if (subtitleLoopRafId) {
        cancelAnimationFrame(subtitleLoopRafId);
        subtitleLoopRafId = null;
      }
      loopPopHide();
    }

    // Đang loop mà người dùng chủ động thao tác trên phụ đề (bấm 1 từ / bôi đen 1 đoạn) -> tắt loop + dừng video,
    // để popup "Dừng loop" + "Delay" không chồng lên popup Tra nghĩa / Phát âm / Loop / Lưu.
    function stopLoopAndPause() {
      if (!subtitleLoopActive) return false;
      stopSubtitleLoop();
      try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
      return true;
    }
    // Bấm vào 1 từ ở phụ đề bên phải hoặc phụ đề có IPA (thẻ câu hiện tại): chỉ TẮT loop, không chặn gì thêm
    // -> video vẫn tua + phát từ chữ vừa bấm như bình thường (không pause).
    document.addEventListener('click', (e) => {
      if (!subtitleLoopActive) return;
      const t = e.target;
      if (!t || !t.closest || !t.closest('#subtitles-scroll-container .sub-word-unit, #cs-text .sub-word-unit')) return;
      const sel = window.getSelection();
      if (sel && sel.toString().trim()) return;   // vừa bôi đen xong (kéo chuột): checkTextSelection() sẽ lo (tắt loop + dừng video)
      stopSubtitleLoop();
    }, true);

    document.addEventListener('mouseup', (e) => {
      // Bấm trong chính pop-up (Tra nghĩa / Loop / Lưu) thì không cần đọc lại vùng bôi đen
      if (lookupTooltip && e && lookupTooltip.contains(e.target)) return;
      setTimeout(checkTextSelection, 30);
    });

    // Bấm vào pop-up không được làm mất vùng bôi đen (đặc biệt khi giữ Shift: trình duyệt sẽ hiểu là mở rộng/đổi vùng chọn)
    if (lookupTooltip) lookupTooltip.addEventListener('mousedown', (e) => { e.preventDefault(); });

    document.addEventListener('mousedown', (e) => {
      if (lookupTooltip && !lookupTooltip.contains(e.target)) {
        hideLookupTooltip();
      }
    });

    // ===== CẢM ỨNG (điện thoại / iPad): chạm 1 lần = tua tới từ, chạm 2 lần = chọn từ (giữ lần thứ 2 rồi kéo = chọn cả đoạn), chạm 3 lần = chọn cả câu,
    // rồi hiện popup Tra nghĩa / Loop / Lưu giống hệt khi bôi đen bằng chuột trên máy tính. =====
    const MULTI_CLICK_MS = 170;   // 2 lần chạm / click liên tiếp phải cách nhau dưới 170ms mới tính là double / triple (trước đây 150ms, nới thêm 20ms cho người bấm hơi chậm)
    (function setupTouchSelection() {
      const WORD_RE = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/u;
      const SEL = '#subtitles-scroll-container .sub-word-unit, #cs-text .sub-word-unit';
      const LINE = '.sentence-text-line, #cs-text';
      let startX = 0, startY = 0, moved = false, multi = false;
      let lastEnd = 0, lastX = 0, lastY = 0, lastLine = null, taps = 0;
      let mode = 0;                 // 0: chạm thường | 2: đang ở lần chạm thứ 2 (giữ + kéo để chọn) | 3: lần chạm thứ 3 (chọn câu)
      let anchorSp = null, dragged = false, selTimer = null;

      function wordRange(sp) {
        const node = sp.firstChild;
        const r = document.createRange();
        const m = node && node.nodeType === 3 ? WORD_RE.exec(node.nodeValue) : null;
        if (m) { r.setStart(node, m.index); r.setEnd(node, m.index + m[0].length); }
        else r.selectNodeContents(sp);
        return r;
      }
      function setSel(r) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      }
      function sentenceRange(line) {
        const words = line.querySelectorAll('.sub-word-unit');
        if (!words.length) return null;
        const r = document.createRange();
        r.setStartBefore(words[0]);
        r.setEndAfter(words[words.length - 1]);
        return r;
      }
      // Chọn từ theo KIỂU CÁC APP KHÁC: xác định DÒNG theo toạ độ dọc của ngón tay trước, rồi chọn từ trong dòng theo toạ độ ngang
      // (lệch trái -> từ đầu dòng, lệch phải -> từ cuối dòng). Tránh việc kéo xuống dòng dưới nhưng vẫn dính vào từ gần nhất của dòng trên.
      function pickByRow(ws, x, y) {
        const rows = [];
        for (let i = 0; i < ws.length; i++) {
          const b = ws[i].getBoundingClientRect();
          if (!b.width && !b.height) continue;
          const mid = (b.top + b.bottom) / 2, R = rows[rows.length - 1];
          if (R && mid >= R.top && mid <= R.bottom) { R.top = Math.min(R.top, b.top); R.bottom = Math.max(R.bottom, b.bottom); R.items.push({ w: ws[i], b: b }); }
          else rows.push({ top: b.top, bottom: b.bottom, items: [{ w: ws[i], b: b }] });
        }
        if (!rows.length) return null;
        let row = rows[0], bd = Infinity, bc = Infinity;
        for (let i = 0; i < rows.length; i++) {
          const R = rows[i];
          const d = y < R.top ? R.top - y : (y > R.bottom ? y - R.bottom : 0);
          const c = Math.abs(y - (R.top + R.bottom) / 2);
          if (d < bd || (d === bd && c < bc)) { bd = d; bc = c; row = R; }
        }
        let best = null, bx = Infinity;
        for (let i = 0; i < row.items.length; i++) {
          const b = row.items[i].b;
          const dx = x < b.left ? b.left - x : (x > b.right ? x - b.right : 0);
          if (dx < bx) { bx = dx; best = row.items[i].w; }
        }
        return best;
      }
      function nearestWord(line, x, y) {
        return pickByRow(line.querySelectorAll('.sub-word-unit'), x, y);
      }
      // Kéo chọn theo từng từ: từ chữ đã chạm 2 lần tới chữ dưới ngón tay (kéo xuôi hoặc ngược đều được)
      function extendTo(cur) {
        const a = wordRange(anchorSp), c = wordRange(cur);
        const forward = anchorSp === cur || (anchorSp.compareDocumentPosition(cur) & Node.DOCUMENT_POSITION_FOLLOWING);
        const r = document.createRange();
        if (forward) { r.setStart(a.startContainer, a.startOffset); r.setEnd(c.endContainer, c.endOffset); }
        else { r.setStart(c.startContainer, c.startOffset); r.setEnd(a.endContainer, a.endOffset); }
        setSel(r);
      }

      document.addEventListener('touchstart', (e) => {
        multi = e.touches.length > 1;
        mode = 0;
        if (multi) { taps = 0; return; }
        const t = e.touches[0];
        moved = false; startX = t.clientX; startY = t.clientY;
        const sp = e.target && e.target.closest ? e.target.closest(SEL) : null;
        if (!sp) { taps = 0; return; }
        const line = sp.closest(LINE);
        const now = Date.now();
        const seq = (taps > 0 && now - lastEnd < MULTI_CLICK_MS && line === lastLine &&
                     Math.hypot(t.clientX - lastX, t.clientY - lastY) < 40) ? taps + 1 : 1;
        if (seq < 2) return;        // chạm 1 lần: giữ nguyên hành vi cũ (tua tới từ)
        if (line) line.querySelectorAll('.sub-word-unit').forEach((w) => {
          if (w._wordClickTimer) { clearTimeout(w._wordClickTimer); w._wordClickTimer = null; }
        });
        if (e.cancelable) e.preventDefault();   // chặn cuộn trang + click giả làm mất vùng chọn
        clearTimeout(selTimer);
        hideLookupTooltip();
        dragged = false;
        if (seq === 2) { mode = 2; anchorSp = sp; setSel(wordRange(sp)); }
        else { mode = 3; const r = line ? sentenceRange(line) : null; if (r) setSel(r); }
      }, { passive: false });

      document.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        if (!t) return;
        if (Math.hypot(t.clientX - startX, t.clientY - startY) > 10) moved = true;
        if (mode !== 2 || !moved) return;
        dragged = true;
        const box = document.getElementById('subtitles-scroll-container');
        if (box) {   // kéo sát mép trên/dưới thì tự cuộn phụ đề
          const b = box.getBoundingClientRect();
          if (t.clientY < b.top + 36) box.scrollTop -= 10;
          else if (t.clientY > b.bottom - 36) box.scrollTop += 10;
        }
        const el = document.elementFromPoint(t.clientX, t.clientY);
        let cur = el && el.closest ? el.closest(SEL) : null;
        if (!cur) {
          const ln = el && el.closest ? el.closest(LINE) : null;
          if (ln) cur = nearestWord(ln, t.clientX, t.clientY);
        }
        if (cur) extendTo(cur);
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        if (mode) {
          if (e.cancelable) e.preventDefault();
          const was = mode;
          mode = 0;
          setTimeout(checkTextSelection, 30);     // thả tay -> hiện popup Tra nghĩa / Loop / Lưu
          setTimeout(checkTextSelection, 250);
          if (was === 2 && !dragged) { taps = 2; lastEnd = Date.now(); lastX = t.clientX; lastY = t.clientY; }   // chờ lần chạm thứ 3
          else taps = 0;
          return;
        }
        if (multi || moved) { taps = 0; return; }
        const sp = e.target && e.target.closest ? e.target.closest(SEL) : null;
        if (!sp) { taps = 0; return; }
        taps = 1; lastEnd = Date.now(); lastLine = sp.closest(LINE); lastX = t.clientX; lastY = t.clientY;
      }, { passive: false });
      document.addEventListener('touchcancel', () => { mode = 0; taps = 0; }, { passive: true });

      // Bôi đen bằng cách nhấn giữ (tay cầm của hệ điều hành) cũng hiện popup
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
        document.addEventListener('selectionchange', () => {
          clearTimeout(selTimer);
          if (mode) return;     // đang chạm đôi / kéo chọn: đợi thả tay mới hiện popup
          selTimer = setTimeout(checkTextSelection, 400);
        });
      }
    })();

    (function limitMouseMultiClick() {
      let lastDown = 0;
      document.addEventListener('mousedown', (e) => {
        const box = document.getElementById('subtitles-scroll-container'), csBox = document.getElementById('cs-text');
        if (!e.target || !((box && box.contains(e.target)) || (csBox && csBox.contains(e.target)))) return;
        const now = Date.now();
        if (e.detail > 1 && now - lastDown > MULTI_CLICK_MS && e.cancelable) e.preventDefault();
        lastDown = now;
      }, true);
    })();

    // ===== MÁY TÍNH (chuột): bôi đen "hít" theo từng từ =====
    // - Nhấn chuột + kéo: vùng chọn luôn tròn từ, không cần căn chuột đúng điểm đầu / điểm cuối (rơi vào khoảng trắng, lề, giữa 2 dòng cũng được).
    // - Double-click = chọn 1 từ | Triple-click = chọn cả câu | Double-click rồi giữ lần 2 và kéo = chọn theo từng từ.
    // - Chọn 1 từ (hoặc bấm 1 từ) rồi giữ Shift + bấm từ khác = chọn từ từ đầu đến từ cuối (giữ Shift + kéo cũng được).
    // Chỉ chạy với chuột / trackpad (pointerType === 'mouse'); điện thoại, iPad cảm ứng vẫn dùng đoạn xử lý cảm ứng ở trên.
    // Vùng chọn vẫn là Range thật của trình duyệt nên popup Tra nghĩa / Loop / Lưu / Phát âm chạy y như cũ.
    (function setupMouseWordSelection() {
      const SURFACES = [   // box: khung chứa | word: selector 1 từ | line: selector 1 câu (null = cả khung là 1 câu)
        { box: '#subtitles-scroll-container', word: '.sub-word-unit', line: '.sentence-text-line' },
        { box: '#cs-text', word: '.sub-word-unit', line: null },
        { box: '#vid-en', word: '.sub-word-unit', line: null },
        { box: '#sh-text', word: '.sh-w', line: null }   // giao diện Shadowing
      ];
      const DRAG_PX = 4;     // di chuột quá ngưỡng này mới tính là kéo (bấm đơn vẫn là tua tới từ)
      const EDGE_PX = 36;    // kéo sát mép khung cuộn thì tự cuộn
      const TEXT_RE = /[\p{L}\p{N}](?:.*[\p{L}\p{N}])?/u;   // bỏ dấu câu ở 2 đầu từ ("world," -> "world")
      let ptype = 'mouse', drag = null, raf = 0;
      const memo = { at: 0, seq: 0, line: null, x: 0, y: 0, anchor: null };

      document.addEventListener('pointerdown', (e) => { ptype = e.pointerType || 'mouse'; }, true);

      function surfaceOf(el) {
        for (let i = 0; i < SURFACES.length; i++) {
          const box = el.closest(SURFACES[i].box);
          if (box) return { s: SURFACES[i], box: box };
        }
        return null;
      }
      function lineOf(el, ctx) {
        if (!ctx.s.line) return ctx.box;
        const ln = el.closest(ctx.s.line);
        return ln && ctx.box.contains(ln) ? ln : null;
      }
      function wordRange(sp) {
        const r = document.createRange();
        const node = sp.firstChild;
        const m = node && node.nodeType === 3 ? TEXT_RE.exec(node.nodeValue) : null;
        if (m) { r.setStart(node, m.index); r.setEnd(node, m.index + m[0].length); }
        else r.selectNodeContents(sp);
        return r;
      }
      function rangeBetween(a, c) {
        const ra = wordRange(a), rc = wordRange(c);
        const fwd = a === c || (a.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING);
        const r = document.createRange();
        if (fwd) { r.setStart(ra.startContainer, ra.startOffset); r.setEnd(rc.endContainer, rc.endOffset); }
        else { r.setStart(rc.startContainer, rc.startOffset); r.setEnd(ra.endContainer, ra.endOffset); }
        return r;
      }
      function lineRange(ln, ctx) {
        const ws = ln.querySelectorAll(ctx.s.word);
        if (!ws.length) return null;
        const r = document.createRange();
        r.setStart(wordRange(ws[0]).startContainer, wordRange(ws[0]).startOffset);
        const last = wordRange(ws[ws.length - 1]);
        r.setEnd(last.endContainer, last.endOffset);
        return r;
      }
      function setSel(r) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        if (r) sel.addRange(r);
      }
      // Chọn từ theo KIỂU CÁC APP KHÁC: trước hết xác định con trỏ đang ở DÒNG nào (theo toạ độ dọc), rồi mới chọn từ trong dòng đó theo toạ độ ngang
      // (lệch ra trái -> từ đầu dòng, lệch ra phải -> từ cuối dòng). Trước đây tính khoảng cách 2 chiều tới từng từ nên khi kéo xuống dòng dưới
      // mà con trỏ còn gần một từ của dòng trên hơn (vd: dòng dưới ngắn, con trỏ ở bên phải chỗ hết chữ) thì vùng chọn vẫn dừng ở dòng trên.
      function nearestIn(ln, x, y, ctx) {
        const ws = ln.querySelectorAll(ctx.s.word);
        const rows = [];
        for (let i = 0; i < ws.length; i++) {
          const b = ws[i].getBoundingClientRect();
          if (!b.width && !b.height) continue;
          const mid = (b.top + b.bottom) / 2, R = rows[rows.length - 1];
          if (R && mid >= R.top && mid <= R.bottom) { R.top = Math.min(R.top, b.top); R.bottom = Math.max(R.bottom, b.bottom); R.items.push({ w: ws[i], b: b }); }
          else rows.push({ top: b.top, bottom: b.bottom, items: [{ w: ws[i], b: b }] });
        }
        if (!rows.length) return null;
        let row = rows[0], bd = Infinity, bc = Infinity;
        for (let i = 0; i < rows.length; i++) {
          const R = rows[i];
          const d = y < R.top ? R.top - y : (y > R.bottom ? y - R.bottom : 0);
          const c = Math.abs(y - (R.top + R.bottom) / 2);
          if (d < bd || (d === bd && c < bc)) { bd = d; bc = c; row = R; }
        }
        let best = null, bx = Infinity;
        for (let i = 0; i < row.items.length; i++) {
          const b = row.items[i].b;
          const dx = x < b.left ? b.left - x : (x > b.right ? x - b.right : 0);
          if (dx < bx) { bx = dx; best = row.items[i].w; }
        }
        return best;
      }
      function nearestInBox(x, y, ctx) {   // con trỏ ở ngoài mọi câu (lề, khoảng cách giữa các câu, ra ngoài khung...)
        if (!ctx.s.line) return nearestIn(ctx.box, x, y, ctx);
        const lines = ctx.box.querySelectorAll(ctx.s.line);
        let best = null, bd = Infinity;
        for (let i = 0; i < lines.length; i++) {
          const b = lines[i].getBoundingClientRect();
          if (!b.width && !b.height) continue;
          const dy = y < b.top ? b.top - y : (y > b.bottom ? y - b.bottom : 0);
          if (dy < bd) { bd = dy; best = lines[i]; }
          if (b.top > y) break;   // các câu phía sau chỉ càng xa hơn
        }
        return best ? nearestIn(best, x, y, ctx) : null;
      }
      function pick(x, y, ctx) {   // từ gần con trỏ nhất
        const el = document.elementFromPoint(x, y);
        if (el && ctx.box.contains(el) && !el.closest('.sub-vi-line')) {
          const w = el.closest(ctx.s.word);
          if (w && ctx.box.contains(w)) return w;
          const ln = lineOf(el, ctx);
          if (ln) { const n = nearestIn(ln, x, y, ctx); if (n) return n; }
        }
        return nearestInBox(x, y, ctx);
      }
      function scrollerOf(el) {
        for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
          const oy = getComputedStyle(p).overflowY;
          if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') && p.scrollHeight > p.clientHeight + 1) return p;
        }
        return document.scrollingElement || document.documentElement;
      }
      function autoScroll() {
        const sc = drag.scroller;
        if (!sc) return false;
        const isDoc = sc === document.scrollingElement || sc === document.documentElement;
        const rc = isDoc ? null : sc.getBoundingClientRect();
        const top = isDoc ? 0 : rc.top, bot = isDoc ? window.innerHeight : rc.bottom;
        let dy = 0;
        if (drag.y < top + EDGE_PX) dy = -Math.min(28, 3 + (top + EDGE_PX - drag.y) / 3);
        else if (drag.y > bot - EDGE_PX) dy = Math.min(28, 3 + (drag.y - (bot - EDGE_PX)) / 3);
        if (!dy) return false;
        const before = sc.scrollTop;
        sc.scrollTop += dy;
        return sc.scrollTop !== before;
      }
      function schedule() { if (!raf) raf = requestAnimationFrame(update); }
      function update() {
        raf = 0;
        if (!drag || !drag.moved || drag.seq === 3) return;
        const scrolled = autoScroll();
        const cur = pick(drag.x, drag.y, drag.ctx);
        if (cur && cur !== drag.last) { drag.last = cur; setSel(rangeBetween(drag.anchor, cur)); }
        if (scrolled) schedule();   // đang kéo sát mép: tiếp tục cuộn dù chuột đứng yên
      }
      function endDrag() {
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
        drag = null;
      }
      // Shift + bấm khi điểm neo cũ không còn (câu đã được vẽ lại): lấy đầu còn lại của vùng đang bôi đen làm điểm neo
      function anchorFromSelection(ctx, target) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed) return null;
        const r = sel.getRangeAt(0);
        if (!ctx.box.contains(r.commonAncestorContainer)) return null;
        const hit = Array.prototype.filter.call(ctx.box.querySelectorAll(ctx.s.word), (w) => r.intersectsNode(w));
        if (!hit.length) return null;
        const first = hit[0], last = hit[hit.length - 1];
        return (target.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) ? last : first;
      }

      document.addEventListener('mousedown', (e) => {
        if (ptype !== 'mouse' || e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target;
        if (!t || !t.closest) return;
        if (t.closest('button, a, input, textarea, select, [contenteditable="true"], .sub-vi-line')) return;   // dòng tiếng Việt: giữ nguyên bôi đen / copy mặc định
        const ctx = surfaceOf(t);
        if (!ctx || ctx.box.classList.contains('masked')) return;   // Shadowing đang ẩn chữ thì không can thiệp
        const ln = lineOf(t, ctx);
        if (!ln) return;
        let anchor = t.closest(ctx.s.word);
        if (!anchor || !ctx.box.contains(anchor)) anchor = nearestIn(ln, e.clientX, e.clientY, ctx);
        if (!anchor) return;

        const ae = document.activeElement;
        const dropFocus = () => { if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.blur) ae.blur(); };

        // Shift + bấm / kéo: bôi đen từ điểm neo cũ (từ vừa double-click hoặc vừa bấm) tới từ này
        if (e.shiftKey) {
          let a = memo.anchor && memo.anchor.isConnected && ctx.box.contains(memo.anchor) ? memo.anchor : null;
          if (!a) a = anchorFromSelection(ctx, anchor);
          if (a) {
            e.preventDefault(); dropFocus();
            memo.at = 0; memo.anchor = a;
            drag = { ctx: ctx, anchor: a, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: true, seq: 1, last: anchor, scroller: scrollerOf(a) };
            setSel(rangeBetween(a, anchor));
            return;
          }
        }

        e.preventDefault(); dropFocus();   // tự quản lý vùng chọn, không cho trình duyệt bôi đen theo ký tự
        setSel(null);
        const now = Date.now();
        const chained = memo.seq > 0 && memo.seq < 3 && now - memo.at < MULTI_CLICK_MS && memo.line === ln &&
                        Math.hypot(e.clientX - memo.x, e.clientY - memo.y) < 6;
        const seq = chained ? memo.seq + 1 : 1;
        memo.at = now; memo.seq = seq; memo.line = ln; memo.x = e.clientX; memo.y = e.clientY; memo.anchor = anchor;
        drag = { ctx: ctx, anchor: anchor, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, seq: seq, last: anchor, scroller: scrollerOf(anchor) };
        if (seq === 2) setSel(wordRange(anchor));          // double-click: chọn 1 từ (giữ lần 2 rồi kéo = mở rộng theo từng từ)
        else if (seq === 3) setSel(lineRange(ln, ctx));    // triple-click: chọn cả câu
      }, true);

      document.addEventListener('mousemove', (e) => {
        if (!drag) return;
        if (!(e.buttons & 1)) { endDrag(); return; }   // thả chuột ở ngoài cửa sổ
        drag.x = e.clientX; drag.y = e.clientY;
        if (!drag.moved) {
          if (Math.hypot(drag.x - drag.x0, drag.y - drag.y0) < DRAG_PX) return;
          drag.moved = true;
        }
        schedule();
      });

      document.addEventListener('mouseup', (e) => {
        if (!drag) return;
        drag.x = e.clientX; drag.y = e.clientY;
        if (drag.moved && drag.seq !== 3) {   // chốt vùng chọn đúng chỗ thả chuột trước khi popup đọc vùng bôi đen
          const cur = pick(drag.x, drag.y, drag.ctx);
          if (cur) setSel(rangeBetween(drag.anchor, cur));
        }
        endDrag();
      }, true);

      window.addEventListener('blur', endDrag);
    })();

    // Lấy ngữ cảnh: 4 câu đứng trước + câu (các câu) chứa phần văn bản được bôi đen.
    function getContextForSelectedText(selectedTxt) {
      if (!sentences || sentences.length === 0) return { contextStr: selectedTxt };

      let firstIdx = -1;
      let lastIdx = -1;

      // Shadowing / Chép chính tả: ngữ cảnh luôn là câu đang luyện (chính xác cả khi cụm từ xuất hiện nhiều lần)
      try { const pvI = window.pvSelIdx ? window.pvSelIdx() : -1; if (pvI >= 0 && pvI < sentences.length) { firstIdx = lastIdx = pvI; } } catch (e) {}

      // Bôi đen ở phụ đề đè lên video: ngữ cảnh là câu đang hiển thị trên video
      if (firstIdx < 0) try {
        ['vid-en', 'cs-text'].forEach((id) => {
          const vEn = document.getElementById(id);
          if (firstIdx < 0 && vEn && selectedRangeForLoop && vEn.contains(selectedRangeForLoop.startContainer)) {
            const di = parseInt(vEn.getAttribute('data-idx'), 10);
            if (di >= 0 && di < sentences.length) { firstIdx = lastIdx = di; }
          }
        });
      } catch (e) {}

      // Ưu tiên xác định theo vùng bôi đen thật sự trên màn hình (chính xác cả khi cụm từ xuất hiện nhiều lần hoặc trải qua nhiều câu)
      if (firstIdx < 0) try {
        const container = activeSubContainer();
        if (container && selectedRangeForLoop) {
          const overlaps = (el) => {
            const r = document.createRange();
            r.selectNodeContents(el);
            return selectedRangeForLoop.compareBoundaryPoints(Range.END_TO_START, r) < 0 &&
                   selectedRangeForLoop.compareBoundaryPoints(Range.START_TO_END, r) > 0;
          };
          container.querySelectorAll('.sentence-text-line').forEach((ln) => {
            if (!overlaps(ln)) return;
            const id = ln.getAttribute('data-id');
            const idx = sentences.findIndex((x) => String(x.id) === id);
            if (idx < 0) return;
            if (firstIdx < 0 || idx < firstIdx) firstIdx = idx;
            if (idx > lastIdx) lastIdx = idx;
          });
        }
      } catch (e) {}

      if (firstIdx < 0) {
        const cleanSel = selectedTxt.toLowerCase().trim();
        for (let i = 0; i < sentences.length; i++) {
          if (sentences[i].text.toLowerCase().includes(cleanSel)) { firstIdx = i; break; }
        }
        if (firstIdx < 0) firstIdx = Math.max(0, Math.min(sentences.length - 1, currentSentenceIndex));
        lastIdx = firstIdx;
      }

      const from = Math.max(0, firstIdx - 4);
      const contextStr = sentences.slice(from, lastIdx + 1).map((x) => x.text.trim()).filter(Boolean).join(' ');
      return { contextStr: contextStr || selectedTxt };
    }

    // Mở một tab mới ở NỀN (không chuyển sang tab đó), dùng cho Shift + click "Tra nghĩa" / "Phát âm".
    // Trình duyệt bỏ qua phím Ctrl/Shift của click "giả" do code tạo ra, nên trang web tự nó không mở được tab nền;
    // việc này phải nhờ extension Shadowing Studio (chrome.tabs.create với active:false).
    // Không có extension (hoặc extension quá cũ) -> mở tab bình thường để không mất thao tác.
    let bgTabSeq = 0, bgTabHintShown = false;
    function openUrlInBackgroundTab(url) {
      const extPresent = document.documentElement.dataset.shadowingExtension === '1';
      const fallback = (msg) => {
        if (msg && !bgTabHintShown) { bgTabHintShown = true; showVocabToast(msg, false); }
        window.open(url, '_blank');
      };
      if (!extPresent) {
        fallback('Shift + click mở tab nền cần cài extension Shadowing Studio. Tạm thời mở tab bình thường.');
        return;
      }
      const id = ++bgTabSeq;
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMsg);
        if (!ok) fallback('Extension cần cập nhật lên bản 1.3.0 trở lên để Shift + click mở tab nền. Tạm thời mở tab bình thường.');
      };
      const onMsg = (e) => {
        if (e.source !== window || !e.data || e.data.type !== 'SHADOWING_OPEN_BG_TAB_RESULT' || e.data.id !== id) return;
        finish(!!e.data.ok);
      };
      const timer = setTimeout(() => finish(false), 800);
      window.addEventListener('message', onMsg);
      window.postMessage({ type: 'SHADOWING_OPEN_BG_TAB', id: id, url: url }, location.origin);
    }

    // Từ đơn (1 từ, bỏ dấu câu ở hai đầu) -> trả về từ đó; bôi đen từ 2 từ trở lên hoặc không phải chữ -> ''
    function getSingleWordForLookup(text) {
      const t = String(text || '').trim().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
      if (!t || /\s/.test(t)) return '';
      return /^\p{L}[\p{L}\p{M}]*(?:['’\-][\p{L}\p{M}]+)*$/u.test(t) ? t : '';
    }
    // ==================== ĐƯA TỪ VỀ DẠNG GỐC (cho nút "Phát âm" -> Cambridge) ====================
    // Cambridge chỉ có trang cho dạng gốc (plot, accuse...) chứ không có trang riêng cho plotting, accused...
    // Không có từ điển offline nên dùng luật biến đổi + vài danh sách ngoại lệ. Dạng bất quy tắc phổ biến
    // (went, children, taken...) giữ nguyên vì Cambridge thường có trang riêng cho chúng (và phát âm khác dạng gốc).
    const LM_MAP = {
      // số nhiều bất quy tắc đuôi -ves và gốc Latin/Hy Lạp
      wolves: 'wolf', knives: 'knife', wives: 'wife', shelves: 'shelf', thieves: 'thief', calves: 'calf', halves: 'half',
      selves: 'self', loaves: 'loaf', elves: 'elf', scarves: 'scarf', hooves: 'hoof',
      criteria: 'criterion', phenomena: 'phenomenon', analyses: 'analysis', crises: 'crisis', theses: 'thesis',
      hypotheses: 'hypothesis', diagnoses: 'diagnosis', parentheses: 'parenthesis', syntheses: 'synthesis',
      emphases: 'emphasis', oases: 'oasis', indices: 'index', appendices: 'appendix', vertices: 'vertex', matrices: 'matrix',
      cacti: 'cactus', fungi: 'fungus', nuclei: 'nucleus', stimuli: 'stimulus', alumni: 'alumnus', radii: 'radius',
      curricula: 'curriculum', quizzes: 'quiz', quizzed: 'quiz', quizzing: 'quiz',
      // -ed / -ing đặc biệt
      dyed: 'dye', eyed: 'eye', hoed: 'hoe', toed: 'toe', shoed: 'shoe', canoed: 'canoe', skied: 'ski', taxied: 'taxi',
      lying: 'lie', dying: 'die', tying: 'tie', vying: 'vie', belying: 'belie', untying: 'untie',
      dyeing: 'dye', eyeing: 'eye', singeing: 'singe', tingeing: 'tinge',
    };
    // Từ trông như đã chia nhưng thực ra là dạng gốc (hoặc đã có trang riêng) -> giữ nguyên
    const LM_KEEP = new Set(('thing king ring sing wing bring swing sting spring string cling fling sling wring ding ping zing during morning evening ceiling '
      + 'something anything nothing everything sibling darling earring viking herring shilling sterling bling lightning pudding '
      + 'red bed fed led wed shed sled bled bred fled sped need feed seed speed weed heed deed breed bleed proceed succeed exceed indeed creed greed steed reed '
      + 'hundred kindred naked wicked sacred beloved hatred '
      + 'was has his this its yes plus bus gas lens news series species means physics politics economics mathematics athletics gymnastics headquarters '
      + 'always perhaps sometimes towards besides afterwards backwards forwards across unless thus whereas jeans pants clothes scissors thanks outskirts '
      + 'bias atlas canvas alias chaos cosmos pathos ethos kudos analysis basis crisis axis oasis thesis emphasis diagnosis hypothesis synthesis '
      + 'business address process success access progress congress princess actress mistress express impress discuss illness fitness happiness kindness '
      + '').split(' '));
    const LM_IE_PLURAL = /(movie|cookie|zombie|rookie|calorie|smoothie|hippie|selfie|goodie|brownie|prairie|birdie|genie|collie|newbie|veggie|doggie|junkie|bookie|pixie|sortie|cutie|hoodie|talkie|walkie|boogie|lingerie)s$/;
    const LM_UK_LL = new Set('travell cancell labell modell levell marvell signall totall fuell channell counsell equall quarrell tunnell controll compell expell patroll propell rebell repell excell dispell pedall shovell jewell diall'.split(' '));
    const LM_CK = new Set(['panick', 'picnick', 'traffick', 'mimick', 'frolick', 'politick', 'physick']);
    const LM_KEEPSTEM = new Set(['purr', 'butt', 'mutt', 'murmur', 'sulphur']);
    // gốc đã mất "e" cuối nhưng không thể suy ra bằng luật chung -> thêm "e" trực tiếp
    const LM_PLUSE = new Set(('compar prepar declar bewar unprepar ignor explor restor implor deplor outscor interfer adher coher persever welcom becom overcom '
      + 'renam inflam misnam escap landscap reshap misshap postpon condon dethron aton inton compil reconcil defil exil consol cajol inhal exhal impal '
      + 'complet delet compet repet deplet concret preced conced reced seced interced supersed guid ach cach excit invit recit ignit unit incit expedit '
      + 'promot devot denot connot misquot dislik unlik creat recreat procreat persuad dissuad').split(' '));
    const LM_TH = new Set('breath bath cloth loath sooth writh seeth teeth wreath bequeath sheath'.split(' '));
    const LM_KEEP_S_STEM = new Set(['focus', 'bias', 'canvas', 'atlas', 'alias', 'chaos', 'cosmos', 'bonus', 'genus']);
    const LM_KEEP_AT = new Set(['combat', 'format', 'habitat', 'acrobat', 'diplomat', 'democrat', 'wombat']);
    const LM_KEEP_IN = new Set(['margin', 'origin', 'cousin', 'muffin', 'coffin', 'login', 'robin', 'satin', 'basin', 'raisin']);
    const LM_OES_S = /^(shoes|toes|foes)$|(canoes|oboes|horseshoes|tiptoes|snowshoes)$/;
    const LM_USES_ES = ['viruses', 'focuses', 'campuses', 'bonuses', 'circuses', 'statuses', 'citruses', 'walruses', 'octopuses', 'platypuses', 'apparatuses', 'surpluses', 'minuses', 'pluses', 'buses', 'lotuses', 'cactuses', 'choruses', 'crocuses', 'gases', 'biases', 'aliases', 'canvases', 'atlases'];

    function lmRestoreStem(s) {
      if (LM_UK_LL.has(s)) return s.slice(0, -1);
      if (LM_CK.has(s)) return s.slice(0, -1);
      if (LM_KEEPSTEM.has(s)) return s;
      if (LM_PLUSE.has(s)) return s + 'e';
      if (/([bdgmnprt])\1$/.test(s) && s.length >= 4) return s.slice(0, -1);     // plott -> plot, runn -> run
      if (/(ll|ss|ff|zz|cc|dd|gg|nn|rr|tt|bb|mm|pp)$/.test(s)) return s;         // tell, pass, stuff, add, egg...
      if (/[aeiou]$/.test(s)) return (/[^aeiou]u$/.test(s) || s === 'queu') ? s + 'e' : s;   // argu -> argue; see, go, ski giữ nguyên
      if (/[vzc]$/.test(s)) return s + 'e';                                       // mov -> move, amaz -> amaze, danc -> dance
      if (/(dg|rg|lg)$/.test(s)) return s + 'e';                                  // judg, charg, bulg
      if (/ng$/.test(s)) return (/(chang|rang|plung|lung|spong)$/.test(s) || (/eng$/.test(s) && s.length >= 6)) ? s + 'e' : s;
      if (/[aeiou]g$/.test(s) && s.length >= 4) return s + 'e';                   // manag, engag
      if (/th$/.test(s)) return LM_TH.has(s) ? s + 'e' : s;                        // breath -> breathe
      if (/[bcdfgkpstz]l$/.test(s)) return s + 'e';                               // handl -> handle, settl -> settle
      if (/[lnrp]s$/.test(s)) return s + 'e';                                     // nurs, licens, collaps
      if (/[aeiouy]s$/.test(s)) return LM_KEEP_S_STEM.has(s) ? s : s + 'e';       // accus -> accuse, rais -> raise
      if (/[^aeiou]ur$/.test(s) && s.length >= 4) return s + 'e';                 // secur, figur, captur
      if ((/[^aeiou]ir$/.test(s) && s.length >= 4) || /quir$/.test(s)) return s + 'e';   // admir, requir, acquir
      if (/(iat|uat)$/.test(s) && s.length >= 6) return s + 'e';                  // negotiat, evaluat
      if (/[^aeiouy]at$/.test(s) && s.length >= 5 && !LM_KEEP_AT.has(s)) return s + 'e';   // relat, locat, operat
      if (/[^aeiouy]ut$/.test(s) && s.length >= 5) return s + 'e';                // contribut, execut
      if (/[^aeiou]id$/.test(s) && s.length >= 4) return s + 'e';                 // provid, decid
      if (/[^aeiou]ud$/.test(s) && s.length >= 6) return s + 'e';                 // includ, conclud
      if (/[^aeiouy]ad$/.test(s) && s.length >= 5) return s + 'e';                // persuad, invad
      if (/[^aeiou]od$/.test(s) && s.length >= 5) return s + 'e';                 // explod, decod
      if (/[^aeiouy]ak$/.test(s) && s.length >= 5) return s + 'e';                // mistak, undertak
      if (/[^aeiou]ok$/.test(s) && s.length >= 4) return s + 'e';                 // provok, evok
      if (/[^aeiou]ib$/.test(s) && s.length >= 5) return s + 'e';                 // describ, subscrib
      if (/[^aeiou]um$/.test(s) && s.length >= 5) return s + 'e';                 // consum, assum
      if (/[^aeiou]in$/.test(s) && s.length >= 5 && !LM_KEEP_IN.has(s)) return s + 'e';   // imagin, examin
      const t = s.replace(/qu/g, 'q');
      if (/^[^aeiouy]*[aeiouy][^aeiouwxy]$/.test(t)) return s + 'e';              // hop -> hope, mak -> make, us -> use
      return s;
    }

    function lmStripS(w) {
      if (/(ss|us|is|ous|ics)$/.test(w)) return w;
      if (LM_IE_PLURAL.test(w)) return w.slice(0, -1);
      if (/ies$/.test(w)) return w.length > 4 ? w.slice(0, -3) + 'y' : w.slice(0, -1);   // studies -> study, ties -> tie
      if (/oes$/.test(w)) return LM_OES_S.test(w) ? w.slice(0, -1) : w.slice(0, -2);   // heroes -> hero, shoes -> shoe
      if (/uses$/.test(w)) return LM_USES_ES.some((x) => w.endsWith(x)) ? w.slice(0, -2) : w.slice(0, -1);
      if (/(ases|ises)$/.test(w) && LM_USES_ES.some((x) => w.endsWith(x))) return w.slice(0, -2);
      if (/(^|[^eo])aches$|^aches$/.test(w) || /(niches|quiches|cliches|psyches|creches|avalanches)$/.test(w)) return w.slice(0, -1);
      if (/(ss|sh|ch|x|zz)es$/.test(w)) return w.slice(0, -2);                   // passes -> pass, watches -> watch, boxes -> box
      if (/es$/.test(w)) return w.slice(0, -1);                                  // makes -> make, uses -> use, houses -> house
      if (/(as|os)$/.test(w) && w.length <= 5 && LM_KEEP.has(w)) return w;
      return w.slice(0, -1);                                                     // plots -> plot
    }

    function lmStripIng(w) {
      if (w.length < 5) return null;
      const stem = w.slice(0, -3);
      if (!/[aeiouy]/.test(stem)) return w;                                      // string, spring, bring...
      return lmRestoreStem(stem);
    }

    function lmStripEd(w) {
      if (w.length < 4) return null;
      if (/ied$/.test(w)) return w.length <= 4 ? w.slice(0, -1) : w.slice(0, -3) + 'y';   // tried -> try, died -> die
      if (/eed$/.test(w)) return w.slice(0, -1);                                  // agreed -> agree
      const stem = w.slice(0, -2);
      if (!/[aeiouy]/.test(stem)) return w;                                      // shed, sled, bled
      return lmRestoreStem(stem);
    }

    // Hàm alias tương thích
    function lemmatizeEnglish(raw) {
      return lemmatizeFrench(raw);
    }

    // Hỗ trợ đưa từ tiếng Pháp về dạng gốc và tra từ điển Larousse
    function lemmatizeFrench(raw) {
      if (!raw) return '';
      let w = String(raw).toLowerCase().replace(/’/g, "'").trim();
      w = w.replace(/^(?:[ldjcsmtn]|qu)['’]/i, '');
      const LM_FR = {
        'suis': 'être', 'es': 'être', 'est': 'être', 'sommes': 'être', 'êtes': 'être', 'sont': 'être', 'été': 'être',
        'serai': 'être', 'seras': 'être', 'sera': 'être', 'serons': 'être', 'serez': 'être', 'seront': 'être',
        'étais': 'être', 'était': 'être', 'étions': 'être', 'étiez': 'être', 'étaient': 'être',
        'sois': 'être', 'soit': 'être', 'soyons': 'être', 'soyez': 'être', 'soient': 'être',
        'ai': 'avoir', 'as': 'avoir', 'a': 'avoir', 'avons': 'avoir', 'avez': 'avoir', 'ont': 'avoir', 'eu': 'avoir',
        'aurai': 'avoir', 'auras': 'avoir', 'aura': 'avoir', 'aurons': 'avoir', 'aurez': 'avoir', 'auront': 'avoir',
        'avais': 'avoir', 'avait': 'avoir', 'avions': 'avoir', 'aviez': 'avoir', 'avaient': 'avoir',
        'aie': 'avoir', 'ait': 'avoir', 'ayons': 'avoir', 'ayez': 'avoir', 'aient': 'avoir',
        'vais': 'aller', 'vas': 'aller', 'va': 'aller', 'allons': 'aller', 'allez': 'aller', 'vont': 'aller',
        'irai': 'aller', 'iras': 'aller', 'ira': 'aller', 'irons': 'aller', 'irez': 'aller', 'iront': 'aller',
        'allé': 'aller', 'allée': 'aller', 'allés': 'aller', 'allées': 'aller',
        'fais': 'faire', 'fait': 'faire', 'faisons': 'faire', 'faites': 'faire', 'font': 'faire',
        'peux': 'pouvoir', 'peut': 'pouvoir', 'pouvons': 'pouvoir', 'pouvez': 'pouvoir', 'peuvent': 'pouvoir', 'pu': 'pouvoir',
        'veux': 'vouloir', 'veut': 'vouloir', 'voulons': 'vouloir', 'voulez': 'vouloir', 'veulent': 'vouloir', 'voulu': 'vouloir',
        'sais': 'savoir', 'sait': 'savoir', 'savons': 'savoir', 'savez': 'savoir', 'savent': 'savoir', 'su': 'savoir',
        'vois': 'voir', 'voit': 'voir', 'voyons': 'voir', 'voyez': 'voir', 'voient': 'voir', 'vu': 'voir',
        'viens': 'venir', 'vient': 'venir', 'venons': 'venir', 'venez': 'venir', 'viennent': 'venir', 'venu': 'venir',
        'yeux': 'oeil', 'eaux': 'eau', 'chevaux': 'cheval', 'travaux': 'travail', 'journaux': 'journal'
      };
      if (LM_FR[w]) return LM_FR[w];
      if (w.endsWith('aux') && w.length > 4) return w.slice(0, -3) + 'al';
      if ((w.endsWith('s') || w.endsWith('x')) && w.length > 3) {
        const stem = w.slice(0, -1);
        if (LM_FR[stem]) return LM_FR[stem];
        if (stem.endsWith('e') && stem.length > 3) return stem.slice(0, -1);
        return stem;
      }
      if (w.endsWith('e') && w.length > 4) {
        if (w.endsWith('ée')) return w.slice(0, -1);
        if (w.endsWith('ière')) return w.slice(0, -4) + 'ier';
        if (w.endsWith('euse')) return w.slice(0, -4) + 'eur';
        if (w.endsWith('trice')) return w.slice(0, -5) + 'teur';
      }
      return w;
    }

    function cambridgeUrlForWord(word) {
      const base = lemmatizeFrench(word) || String(word).toLowerCase();
      const slug = base.replace(/['’]/g, '');
      return 'https://www.larousse.fr/dictionnaires/francais/' + encodeURIComponent(slug);
    }

    btnLookupAction.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!selectedTextForLookup) return;

      const selText = selectedTextForLookup;
      const contextStr = vocabAreaCtx ? vocabAreaCtx.contextStr : getContextForSelectedText(selText).contextStr;

      const queryStr =
`Tôi đang học tiếng Pháp. Tôi muốn hỏi từ/câu/đoạn sau đây có nghĩa là gì: “${selText}”.
Trình bày theo kiểu trích lại đoạn/câu/từ gốc + loại từ + giống (masculin/féminin nếu là danh từ) + phiên âm IPA chuẩn Pháp, sau đó xuống dòng và viết nghĩa tiếng Việt của nó (phần nghĩa tiếng Việt bôi đen).
Nếu đoạn văn bản tôi vừa cung cấp là/chứa một từ/thành ngữ/cụm từ thì cho thêm 2-3 ví dụ thực tế bằng tiếng Pháp kèm bản dịch tiếng Việt của từng ví dụ.
Tôi tìm thấy đoạn/câu/từ trên ở trong ngữ cảnh sau:

“${contextStr}”`;

      const searchUrl = `https://www.google.com/search?udm=50&q=${encodeURIComponent(queryStr)}`;   // udm=50: mở thẳng Google AI Mode (luôn trả lời bằng AI)

      if (e.shiftKey) {
        // Shift + click: mở tab mới ở nền để tra nghĩa, vẫn ở lại trang hiện tại và GIỮ NGUYÊN 3 pop-up + vùng bôi đen.
        openUrlInBackgroundTab(searchUrl);
        return;
      }

      window.open(searchUrl, '_blank');
      hideLookupTooltip();
      window.getSelection()?.removeAllRanges();
    });

    const btnPronounceAction = document.getElementById('btn-pronounce-action');
    if (btnPronounceAction) {
      btnPronounceAction.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const word = getSingleWordForLookup(selectedTextForLookup) || (selectedTextForLookup || '').trim();
        if (!word) return;

        if (e.shiftKey) {
          // Shift + click: mở tab nền trên Từ điển Larousse
          const url = cambridgeUrlForWord(word);
          openUrlInBackgroundTab(url);
          return;
        }

        if (e.altKey && !isTextMode && currentVideoId && ytPlayer && isPlayerReady) {
          // Alt / Option + click: Phát đoạn âm thanh từ video gốc
          const timeRange = getTimeRangeFromSelection(selectedRangeForLoop);
          const st = timeRange ? timeRange.start : (sentences[currentSentenceIndex]?.startTime || 0);
          seekToTime(st, undefined, true);
          return;
        }

        // Phát âm tiếng Pháp trực tiếp
        btnPronounceAction.classList.add('playing');
        window.playFrenchAudio(word, {
          rate: 0.95,
          onStart: () => btnPronounceAction.classList.add('playing'),
          onEnd: () => btnPronounceAction.classList.remove('playing')
        });
        setTimeout(() => btnPronounceAction.classList.remove('playing'), 900);
      });
    }

    const btnLoopAction = document.getElementById('btn-loop-action');
    // Dùng chung cho nút "Loop" và phím tắt L.
    function loopSelectedText(keepPopup) {
      if (!selectedRangeForLoop || !selectedTextForLookup) {
        showVocabToast('Hãy bôi đen một đoạn phụ đề trước rồi bấm L để loop', false);
        return;
      }
      const timeRange = getTimeRangeFromSelection(selectedRangeForLoop);
      const labelText = selectedTextForLookup;
      const loopRange = selectedRangeForLoop.cloneRange();   // giữ lại để đặt popup "Dừng loop" ngay trên chỗ vừa bôi đen

      // Shift + click: vẫn loop như bình thường nhưng GIỮ NGUYÊN 3 pop-up + vùng bôi đen.
      if (!keepPopup) {
        hideLookupTooltip();
        window.getSelection()?.removeAllRanges();
      }

      if (!timeRange) return;
      startSubtitleLoop(timeRange.start, timeRange.end, labelText, loopRange);
    }
    btnLoopAction.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!selectedRangeForLoop) return;
      loopSelectedText(e.shiftKey);
    });

    // Phím tắt S: lưu từ vựng đang bôi đen
    function saveSelectionToVocabByKey() {
      if (!selectedRangeForLoop || !selectedTextForLookup) {
        showVocabToast('Hãy bôi đen từ/cụm từ trước rồi bấm S để lưu', false);
        return;
      }
      saveSelectionToVocab(false);
    }

    // Bảng phím tắt (nút dưới khu ghi âm)
    function toggleShortcutsPanel() {
      const panel = document.getElementById('shortcuts-panel');
      const chev = document.getElementById('shortcuts-chevron');
      if (!panel) return;
      const open = panel.classList.toggle('hidden') === false;
      if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
      const btn = document.getElementById('btn-shortcuts-toggle');
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    // ==================== HÀM CUỘN MƯỢT TỰ NHIÊN (EASING INTERPOLATION) ====================
    let activeScrollAnimationId = null;

    function smoothScrollToPosition(container, targetY) {
      if (!container) return;
      if (activeScrollAnimationId) cancelAnimationFrame(activeScrollAnimationId);

      const startY = container.scrollTop;
      const difference = targetY - startY;
      if (Math.abs(difference) < 3) return;

      // Ease-in-out (thay vì ease-out thuần trước đây): chuyển động KHỞI ĐỘNG nhẹ
      // nhàng, tăng tốc ở giữa, rồi chậm dần khi tới đích. Ease-out thuần bắt đầu
      // ở tốc độ nhanh nhất ngay lập tức -> mắt đang đứng yên bị "giật" đột ngột
      // ngay từ khung hình đầu tiên, đó là cảm giác "mất định hướng" khi phụ đề
      // nhảy. Ease-in-out mô phỏng đúng cách mắt người tự nhiên bắt đầu đuổi theo
      // một chuyển động (saccade mượt: khởi động dần - không giật cục).
      const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

      // Thời lượng animation tỉ lệ theo QUÃNG ĐƯỜNG thực tế cần di chuyển, thay vì
      // một con số cố định cho mọi trường hợp. Một cú nhảy 1 dòng (~30-40px, tình
      // huống phổ biến nhất khi karaoke rớt dòng) chỉ cần chuyển động ngắn, nhanh,
      // êm; một cú nhảy xa (chuyển hẳn sang câu khác, cách nhiều dòng) cần thời
      // gian dài hơn một chút để mắt kịp "đuổi theo" thay vì bị giật đột ngột.
      // Cùng một duration cố định cho cả 2 trường hợp khiến quãng ngắn cảm giác
      // giật (vì tốc độ trung bình quá cao so với khoảng cách) còn quãng dài lại
      // cảm giác hơi đột ngột lúc tăng tốc.
      const distance = Math.abs(difference);
      const effectiveDuration = Math.min(650, Math.max(260, distance * 1.15));

      const startTime = performance.now();

      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / effectiveDuration, 1);
        const ease = easeInOutQuad(progress);

        container.scrollTop = startY + difference * ease;

        if (progress < 1) {
          activeScrollAnimationId = requestAnimationFrame(step);
        } else {
          activeScrollAnimationId = null;
        }
      }

      activeScrollAnimationId = requestAnimationFrame(step);
    }

    function scrollElementToElevatedPosition(el, container) {
      if (!el || !container) return;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const isMobile = window.innerWidth <= 1023;
      const desiredRatio = isMobile ? 0.25 : 0.33;
      const desiredTopPosition = Math.max(16, containerRect.height * desiredRatio);
      const diff = elRect.top - containerRect.top - desiredTopPosition;
      
      const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
      const effectiveBottom = Math.min(containerRect.bottom, viewportBottom - 15);
      const isNearBottom = elRect.bottom > effectiveBottom - 35;
      const isNearTop = elRect.top < containerRect.top + 10;

      if (Math.abs(diff) > 10 || isNearBottom || isNearTop) {
        const targetScrollTop = Math.max(0, container.scrollTop + diff);
        smoothScrollToPosition(container, targetScrollTop);
      }
    }

    function triggerSmoothCenterScroll(targetIndex, force = false, explicitTime = null) {
      if (!force && (!settings.autoScroll || shouldPreventAutoScroll())) return;
      // Khi chuột đang hover trên phụ đề, tuyệt đối không cuộn — kể cả bị "force"
      // (ví dụ do tua timeline/±5s hoặc do Loop quay lại đầu đoạn). Người dùng đang
      // đọc/tương tác với phụ đề thì phụ đề phải đứng yên trong mọi trường hợp.
      if (shouldPreventAutoScroll()) return;

      const targetSentence = sentences[targetIndex];
      if (!targetSentence) return;
      const container = document.getElementById('subtitles-scroll-container');
      if (!container) return;

      // Luôn cuộn theo ĐÚNG TỪ đang được phát tại thời điểm hiện tại của video
      // (không phải theo đầu câu) -- nhất quán với vị trí 33% mà Cuộn tự động
      // (karaoke) đang dùng, và xử lý đúng cả câu dài nhiều dòng lẫn phụ đề không
      // dấu câu bị gộp thành 1 câu khổng lồ.
      // QUAN TRỌNG: khi hàm này được gọi ngay trong lúc tua (từ seekToTime), video
      // CHƯA kịp seek xong nên ytPlayer.getCurrentTime() vẫn trả về thời điểm CŨ
      // -> phải nhận thời điểm ĐÍCH qua explicitTime, không tự đọc currentTime lúc đó.
      const t = explicitTime !== null
        ? explicitTime
        : ((ytPlayer && ytPlayer.getCurrentTime) ? ytPlayer.getCurrentTime() : targetSentence.startTime);
      const el = findActiveWordElement(t, container);

      if (!el) return;
      scrollElementToElevatedPosition(el, container);
    }

    // ==================== MICRO + MEDIARECORDER (CHẤT LƯỢNG CAO) ====================
    // Trước đây: getUserMedia({ audio: true }) + new MediaRecorder(stream) (toàn bộ để mặc định). Mặc định đó bật bộ xử lý "gọi thoại" của
    // trình duyệt (khử vọng, khử ồn, tự chỉnh âm lượng) nên giọng bị bí, méo như nói qua điện thoại; bitrate mã hóa cũng do trình duyệt tự chọn (thường thấp).
    // Giờ: tắt các bộ xử lý đó, yêu cầu mono 48 kHz, và mã hóa Opus (hoặc AAC trên Safari) ở 128 kbps.
    async function getMicStream() {
      const constraints = {
        channelCount: 1,
        sampleRate: { ideal: 48000 },
        echoCancellation: false,   // app đã tạm dừng video khi thu nên không cần khử vọng; bật lên sẽ làm méo giọng
        noiseSuppression: false,   // khử ồn của trình duyệt cắt bớt dải cao của giọng nói
        autoGainControl: false     // tự chỉnh âm lượng gây hiện tượng "bơm" âm lượng, nghe rè
      };
      try { return await navigator.mediaDevices.getUserMedia({ audio: constraints }); }
      catch (e) {
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError' || e.name === 'NotFoundError')) throw e;   // lỗi quyền/không có micro: báo lại như cũ
        return await navigator.mediaDevices.getUserMedia({ audio: true });                                             // trình duyệt không nhận ràng buộc -> dùng mặc định
      }
    }

    function createMicRecorder(stream) {
      const prefs = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4', 'audio/webm'];
      let mime = '';
      try { mime = prefs.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || ''; } catch (e) {}
      const opts = { audioBitsPerSecond: 128000 };
      if (mime) opts.mimeType = mime;
      try { return new MediaRecorder(stream, opts); } catch (e) { return new MediaRecorder(stream); }
    }

    // ==================== GHI ÂM SO SÁNH ====================
    async function toggleRecording() {
      if (isRecording) stopRecording();
      else startRecording();
    }

    async function startRecording() {
      try {
        const stream = await getMicStream();
        audioChunks = [];
        mediaRecorder = createMicRecorder(stream);
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: (mediaRecorder && mediaRecorder.mimeType) || 'audio/webm' });
          if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
          recordedAudioUrl = URL.createObjectURL(audioBlob);
          document.getElementById('recording-actions').classList.remove('hidden');
          stream.getTracks().forEach((track) => track.stop());
        };
        mediaRecorder.start();
        isRecording = true;
        recordSeconds = 0;
        document.getElementById('record-timer').textContent = '00:00';
        document.getElementById('btn-record-text').textContent = 'Dừng ghi âm';
        document.getElementById('btn-record').className = 'btn-interactive flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md animate-pulse cursor-pointer';
        
        recordTimerInterval = setInterval(() => {
          recordSeconds++;
          const m = Math.floor(recordSeconds / 60);
          const s = recordSeconds % 60;
          document.getElementById('record-timer').textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }, 1000);
      } catch (err) {
        isRecording = false;
        if (recordTimerInterval) { clearInterval(recordTimerInterval); recordTimerInterval = null; }
        const btn = document.getElementById('btn-record');
        if (btn) btn.className = 'btn-interactive flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-medium text-xs shadow-md cursor-pointer';
        const txt = document.getElementById('btn-record-text');
        if (txt) txt.textContent = 'Nhấn để thu âm';
        showVocabToast('Không thể truy cập Microphone. Vui lòng cấp quyền micro cho trang web.', false);
      }
    }

    function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      isRecording = false;
      if (recordTimerInterval) clearInterval(recordTimerInterval);
      document.getElementById('btn-record-text').textContent = 'Ghi âm lại';
      document.getElementById('btn-record').className = 'btn-interactive flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 text-white font-medium text-xs shadow-md cursor-pointer';
    }

    function playUserRecording() {
      if (!recordedAudioUrl) return;
      if (userAudioPlayer) {
        userAudioPlayer.pause();
        userAudioPlayer.currentTime = 0;
      }
      userAudioPlayer = new Audio(recordedAudioUrl);
      const textBtn = document.getElementById('text-play-user-rec');
      userAudioPlayer.onplay = () => { textBtn.textContent = 'Đang phát...'; };
      userAudioPlayer.onended = () => { textBtn.textContent = 'Phát lại giọng của bạn'; };
      userAudioPlayer.onerror = () => { textBtn.textContent = 'Phát lại giọng của bạn'; };
      userAudioPlayer.play();
    }

    // ==================== TỪ VỰNG ĐÃ LƯU ====================
    // Mỗi mục: { id, text, kind, en (ngữ cảnh), hs/he (vị trí từ được tô sáng trong en), vi (bản dịch, có thể rỗng),
    //           videoId, videoTitle, t (giây), createdAt }. Lưu trong localStorage, không cần backend.
    const VOCAB_KEY = 'shadowing_saved_vocab_v1';
    let vocabSource = 'all', vocabLevelFilter = 'all', vocabSort = 'new', vocabQuery = '', vocabReturnTo = 'input', vocabHomeScrollY = 0, vocabScrollY = 0;
    let vocabToastTimer = null;
    let pendingSeekTime = null;
    let vocabEditIds = new Set();          // các mục đang bật ô sửa "nghĩa riêng của từ"
    let vocabMeaningBatchIds = [];         // thứ tự id ứng với số thứ tự trong prompt đã copy gần nhất

    // escHtml & escapeHtml are declared and hoisted at the top of the main script tag.
    function mergeDuplicateVocab(list) {
      if (!Array.isArray(list) || list.length <= 1) return Array.isArray(list) ? list : [];
      const map = new Map();
      list.forEach((item) => {
        if (!item || !item.text) return;
        const key = String(item.text).trim().toLowerCase();
        if (!map.has(key)) {
          const clone = Object.assign({}, item);
          if (!Array.isArray(clone.contexts)) clone.contexts = [];
          map.set(key, clone);
        } else {
          const target = map.get(key);
          if (!target.wordVi && item.wordVi) target.wordVi = item.wordVi;
          if ((!target.examples || !target.examples.length) && (item.examples && item.examples.length)) target.examples = item.examples;
          if (!target.tag && item.tag) target.tag = item.tag;
          if (item.srs && (!target.srs || (item.srs.reps || 0) > (target.srs.reps || 0))) {
            target.srs = item.srs;
          }
          const isSamePrimary = (target.videoId === item.videoId && Math.abs((target.t || 0) - (item.t || 0)) < 2);
          const isAlreadyInContexts = target.contexts.some(c => c.videoId === item.videoId && Math.abs((c.t || 0) - (item.t || 0)) < 2);
          if (!isSamePrimary && !isAlreadyInContexts) {
            target.contexts.push({
              videoId: item.videoId || '',
              videoTitle: item.videoTitle || '',
              bookId: item.bookId || '',
              en: item.en || '',
              vi: item.vi || '',
              hs: item.hs || 0,
              he: item.he || 0,
              t: item.t || 0,
              createdAt: item.createdAt || Date.now()
            });
          }
          if (Array.isArray(item.contexts)) {
            item.contexts.forEach(c => {
              if (!target.contexts.some(tc => tc.videoId === c.videoId && Math.abs((tc.t || 0) - (c.t || 0)) < 2)) {
                target.contexts.push(c);
              }
            });
          }
        }
      });
      return Array.from(map.values());
    }

    const DEFAULT_VOCAB_SAMPLES = [
      {
        id: 'sample-vocab-1',
        text: 'magnifique',
        wordVi: 'a. tuyệt đẹp, tráng lệ',
        en: "J'ai vu une magnifique image dans un livre sur la Forêt Vierge.",
        vi: "Tôi đã nhìn thấy một bức tranh tuyệt đẹp trong một cuốn sách về Rừng Nguyên Sinh.",
        hs: 14,
        he: 24,
        kind: 'word',
        tag: 'Từ',
        level: 'B1',
        createdAt: Date.now() - 3600000 * 24,
        videoTitle: 'Le Petit Prince',
        bookId: 'sample-le-petit-prince'
      },
      {
        id: 'sample-vocab-2',
        text: 'découvrir',
        wordVi: 'v. khám phá, phát hiện',
        en: "Nous allons découvrir le secret du bonheur au quotidien.",
        vi: "Chúng ta sẽ khám phá bí mật của hạnh phúc trong cuộc sống hàng ngày.",
        hs: 10,
        he: 19,
        kind: 'word',
        tag: 'Từ',
        level: 'A2',
        createdAt: Date.now() - 3600000 * 18,
        videoTitle: 'Français Authentique'
      },
      {
        id: 'sample-vocab-3',
        text: "s'émerveiller",
        wordVi: 'v. trầm trồ, ngạc nhiên thú vị',
        en: "Il faut savoir s'émerveiller des petites choses de la vie.",
        vi: "Cần phải biết trầm trồ trước những điều nhỏ bé trong cuộc sống.",
        hs: 14,
        he: 28,
        kind: 'word',
        tag: 'Từ',
        level: 'B2',
        createdAt: Date.now() - 3600000 * 12,
        videoTitle: 'Philosophie & Vie'
      },
      {
        id: 'sample-vocab-4',
        text: 'au lever du jour',
        wordVi: 'loc. khi bình minh ló rạng, lúc tảng sáng',
        en: "Au lever du jour, une drôle de petite voix m'a réveillé.",
        vi: "Khi bình minh ló rạng, một giọng nói nhỏ bé kỳ lạ đã đánh thức tôi dậy.",
        hs: 0,
        he: 16,
        kind: 'phrase',
        tag: 'Cụm từ',
        level: 'B1',
        createdAt: Date.now() - 3600000 * 6,
        videoTitle: 'Le Petit Prince',
        bookId: 'sample-le-petit-prince'
      },
      {
        id: 'sample-vocab-5',
        text: 'chef-d’œuvre',
        wordVi: 'n.m. kiệt tác, tác phẩm xuất sắc nhất',
        en: "J'ai montré mon chef-d'œuvre aux grandes personnes.",
        vi: "Tôi đã khoe kiệt tác của mình với những người lớn.",
        hs: 16,
        he: 28,
        kind: 'word',
        tag: 'Từ',
        level: 'B2',
        createdAt: Date.now() - 3600000 * 2,
        videoTitle: 'Le Petit Prince',
        bookId: 'sample-le-petit-prince'
      }
    ];

    function getVocab() {
      try {
        const raw = localStorage.getItem(VOCAB_KEY);
        if (!raw) {
          localStorage.setItem(VOCAB_KEY, JSON.stringify(DEFAULT_VOCAB_SAMPLES));
          return DEFAULT_VOCAB_SAMPLES;
        }
        const d = JSON.parse(raw);
        return Array.isArray(d) ? d : [];
      } catch (e) {
        return DEFAULT_VOCAB_SAMPLES;
      }
    }
    function setVocab(list) {
      try {
        const merged = mergeDuplicateVocab(list);
        localStorage.setItem(VOCAB_KEY, JSON.stringify(merged));
        if (window.FSS_SUPABASE && typeof window.FSS_SUPABASE.syncVocabDebounced === 'function') {
          window.FSS_SUPABASE.syncVocabDebounced(merged);
        }
        return true;
      } catch (e) { return false; }
    }
    function updateVocabBadges() {
      const n = getVocab().length;
      document.querySelectorAll('.vocab-count-badge').forEach((el) => { el.textContent = n; el.style.display = n ? '' : 'none'; });
      updateVocabMissingBadge();
      updateReviewBadges();
    }

    // Tự động đồng bộ bản dịch câu cho các từ vựng đã lưu thuộc video vid từ danh sách sentences sents
    function syncVocabSentenceTranslations(vid, sents) {
      if (!vid || !Array.isArray(sents) || !sents.length) return false;
      const all = getVocab();
      let changed = false;
      all.forEach((item) => {
        if (item.videoId !== vid) return;
        if (!item.vi || !String(item.vi).trim()) {
          let matched = null;
          if (typeof item.t === 'number') {
            matched = sents.find(s => Math.abs((s.startTime || 0) - item.t) < 1.5 && s.vi && String(s.vi).trim());
          }
          if (!matched && item.en) {
            const normEn = String(item.en).trim().toLowerCase();
            matched = sents.find(s => String(s.text || '').trim().toLowerCase() === normEn && s.vi && String(s.vi).trim());
          }
          if (matched && matched.vi && String(matched.vi).trim()) {
            item.vi = String(matched.vi).trim();
            changed = true;
          }
        }
        if (Array.isArray(item.contexts)) {
          item.contexts.forEach((ctx) => {
            if (ctx.videoId === vid && (!ctx.vi || !String(ctx.vi).trim())) {
              let matched = null;
              if (typeof ctx.t === 'number') {
                matched = sents.find(s => Math.abs((s.startTime || 0) - ctx.t) < 1.5 && s.vi && String(s.vi).trim());
              }
              if (!matched && ctx.en) {
                const normEn = String(ctx.en).trim().toLowerCase();
                matched = sents.find(s => String(s.text || '').trim().toLowerCase() === normEn && s.vi && String(s.vi).trim());
              }
              if (matched && matched.vi && String(matched.vi).trim()) {
                ctx.vi = String(matched.vi).trim();
                changed = true;
              }
            }
          });
        }
      });
      if (changed) {
        setVocab(all);
        return true;
      }
      return false;
    }

    // Tự động kiểm tra và bù đắp bản dịch câu trích dẫn từ Lịch sử video cho toàn bộ sổ từ vựng
    function syncAllVocabFromLocalHistory() {
      try {
        const all = getVocab();
        const hist = typeof getLocalHistory === 'function' ? getLocalHistory() : [];
        if (!all.length || !hist || !hist.length) return false;
        let changed = false;
        all.forEach((item) => {
          if (!item.videoId || (item.vi && String(item.vi).trim())) return;
          const h = hist.find((v) => v.videoId === item.videoId && Array.isArray(v.sentences) && v.sentences.length);
          if (!h) return;
          let matched = null;
          if (typeof item.t === 'number') {
            matched = h.sentences.find(s => Math.abs((s.startTime || 0) - item.t) < 1.5 && s.vi && String(s.vi).trim());
          }
          if (!matched && item.en) {
            const normEn = String(item.en).trim().toLowerCase();
            matched = h.sentences.find(s => String(s.text || '').trim().toLowerCase() === normEn && s.vi && String(s.vi).trim());
          }
          if (matched && matched.vi && String(matched.vi).trim()) {
            item.vi = String(matched.vi).trim();
            changed = true;
          }
        });
        if (changed) {
          setVocab(all);
          return true;
        }
      } catch (e) {}
      return false;
    }

    // ==================== ÔN TẬP TỪ VỰNG THEO SPACED REPETITION (thuật toán kiểu SM-2) ====================
    // Mỗi mục từ vựng có thêm x.srs = { ease, interval (ngày), reps, due (mốc thời gian ms), lastReview }.
    // Mục chưa từng ôn (không có x.srs) coi như "đến hạn ngay" để được đưa vào hàng đợi ôn tập đầu tiên.
    function srsDefault() { return { ease: 2.5, interval: 0, reps: 0, due: 0, lastReview: null }; }
    function getSrs(item) { return Object.assign(srsDefault(), item && item.srs ? item.srs : {}); }
    function srsIsDue(item, now) { return getSrs(item).due <= now; }
    // scopeKey: 'all' (hoặc bỏ trống) = mọi từ; còn lại = khoá nguồn (video/bài viết/sách) lấy từ vocabSourceInfo()
    function vocabInScope(scopeKey) {
      const all = getVocab();
      if (!scopeKey || scopeKey === 'all') return all;
      return all.filter((x) => {
        if (vocabSourceInfo(x).key === scopeKey) return true;
        if (Array.isArray(x.contexts) && x.contexts.some(c => vocabSourceInfo(c).key === scopeKey)) return true;
        return false;
      });
    }
    function srsDueList(scopeKey) {
      const now = Date.now();
      return vocabInScope(scopeKey).filter((x) => srsIsDue(x, now))
        .sort((a, b) => (getSrs(a).due - getSrs(b).due) || (a.createdAt - b.createdAt));
    }
    function srsDueCount(scopeKey) { return srsDueList(scopeKey).length; }
    function updateReviewBadges() {
      // Nút "Ôn tập" trong trang Từ vựng đếm theo bài đang lọc; hai huy hiệu ở nơi khác đếm toàn bộ.
      const nAll = srsDueCount();
      const nScoped = vocabSource && vocabSource !== 'all' ? srsDueCount(vocabSource) : nAll;
      [['vocab-due-badge-1', nScoped], ['vocab-due-badge-2', nAll], ['vocab-due-badge-3', nAll]].forEach(([id, n]) => {
        const el = document.getElementById(id);
        if (el) { el.textContent = n; el.style.display = n ? '' : 'none'; }
      });
    }
    // Tính trạng thái SRS mới theo mức tự đánh giá, KHÔNG làm thay đổi dữ liệu gốc (dùng để xem trước khoảng cách lặp lại).
    function srsCompute(s, rating) {
      let { ease, interval, reps } = s;
      if (rating === 'again') {
        reps = 0;
        ease = Math.max(1.3, ease - 0.2);
        return { ease, interval: 0, reps, due: Date.now() + 10 * 60 * 1000, lastReview: Date.now() };
      }
      if (rating === 'hard') {
        interval = interval > 0 ? Math.max(1, Math.round(interval * 1.2)) : 1;
        ease = Math.max(1.3, ease - 0.15);
      } else if (rating === 'good') {
        if (reps === 0) interval = 1;
        else if (reps === 1) interval = 3;
        else interval = Math.max(1, Math.round(interval * ease));
      } else if (rating === 'easy') {
        interval = reps === 0 ? 4 : Math.max(1, Math.round(interval * ease * 1.3));
        ease = Math.min(2.8, ease + 0.15);
      }
      reps += 1;
      return { ease, interval, reps, due: Date.now() + interval * 24 * 60 * 60 * 1000, lastReview: Date.now() };
    }
    function srsFormatDelta(ms) {
      const mins = Math.round(ms / 60000);
      if (mins < 60) return `${Math.max(1, mins)} phút`;
      const days = Math.round(ms / 86400000);
      return days <= 1 ? '1 ngày' : `${days} ngày`;
    }

    let reviewQueue = [];
    let reviewRevealed = false;
    let reviewStats = { reviewed: 0, again: 0 };
    let reviewSessionSize = 0;

    let reviewScope = 'all';   // 'all' hoặc khoá nguồn: phiên ôn tập hiện tại chỉ gồm từ của bài này
    function reviewScopeTitle() {
      if (reviewScope === 'all') return '';
      const first = vocabInScope(reviewScope)[0];
      return first ? vocabSourceInfo(first).title : '';
    }
    function reviewScopeLineHtml() {
      const t = reviewScopeTitle();
      return t ? `<div class="review-scope" title="${escHtml(t)}">Chỉ ôn từ của: <b>${escHtml(t)}</b></div>` : '';
    }

    function openReviewScreen(scopeKey) {
      reviewScope = (typeof scopeKey === 'string' && scopeKey && scopeKey !== 'all') ? scopeKey : 'all';
      const due = srsDueList(reviewScope);
      reviewStats = { reviewed: 0, again: 0 };
      if (due.length > 0) {
        reviewQueue = due;
        reviewSessionSize = due.length;
        document.getElementById('review-backdrop').classList.add('open');
        renderReviewBody();
        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
        return;
      }
      const all = vocabInScope(reviewScope);
      document.getElementById('review-backdrop').classList.add('open');
      if (all.length === 0) {
        document.getElementById('review-body').innerHTML = `
          <div class="review-empty">
            <i data-lucide="bookmark" class="w-10 h-10"></i>
            <h3>Chưa có từ vựng nào</h3>
            <p>Hãy lưu vài từ/cụm từ khi luyện tập video, rồi quay lại đây để ôn tập nhé.</p>
          </div>`;
      } else {
        const soonest = all.map((x) => getSrs(x).due).sort((a, b) => a - b)[0];
        const delta = Math.max(0, soonest - Date.now());
        document.getElementById('review-body').innerHTML = `
          <div class="review-empty">
            <i data-lucide="check-circle" class="w-10 h-10"></i>
            <h3>Tuyệt vời! Không có từ nào đến hạn ôn${reviewScope === 'all' ? '' : ' trong bài này'}</h3>
            <p>Từ tiếp theo sẽ đến hạn sau khoảng ${escHtml(srsFormatDelta(delta))} nữa. Bạn cũng có thể ôn sớm tất cả ${all.length} từ${reviewScope === 'all' ? '' : ' của bài này'} ngay bây giờ nếu muốn.</p>
            <button type="button" class="review-reveal-btn" onclick="startReviewAll()">Ôn sớm tất cả (${all.length} từ)</button>
          </div>`;
      }
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function startReviewAll() {
      const all = vocabInScope(reviewScope).sort((a, b) => (getSrs(a).due - getSrs(b).due) || (a.createdAt - b.createdAt));
      reviewQueue = all;
      reviewSessionSize = all.length;
      renderReviewBody();
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function closeReviewScreen() {
      document.getElementById('review-backdrop').classList.remove('open');
      reviewQueue = [];
      reviewRevealed = false;
      updateVocabBadges();
      if (!document.getElementById('screen-vocab').classList.contains('hidden')) renderVocabPage();
    }
    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('review-backdrop') || !document.getElementById('review-backdrop').classList.contains('open')) return;
      if (e.key === 'Escape') { closeReviewScreen(); return; }
      if (!reviewQueue.length) return;
      if (!reviewRevealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); revealReviewAnswer(); return; }
      if (reviewRevealed) {
        if (e.key === '1' || e.key === 'ArrowLeft') { e.preventDefault(); rateReview('again'); }
        else if (e.key === '2' || e.key === 'ArrowRight') { e.preventDefault(); rateReview('good'); }
      }
    });

    function renderReviewBody() {
      const titleEl = document.getElementById('review-title-text');
      if (!reviewQueue.length) {
        titleEl.textContent = 'Hoàn thành!';
        document.getElementById('review-body').innerHTML = `
          <div class="review-done">
            <i data-lucide="sparkles" class="w-10 h-10"></i>
            <h3>Xong rồi!</h3>
            <p>Bạn vừa ôn xong ${reviewStats.reviewed} từ.</p>
            <div class="review-stats">
              <div class="review-stat"><b>${reviewStats.reviewed}</b><span>Đã ôn</span></div>
              <div class="review-stat"><b>${reviewStats.again}</b><span>Cần ôn lại</span></div>
            </div>
            <button type="button" class="review-reveal-btn" onclick="closeReviewScreen()">Đóng</button>
          </div>`;
        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
        return;
      }
      const doneSoFar = reviewSessionSize - reviewQueue.length;
      titleEl.textContent = `Ôn tập từ vựng (${doneSoFar}/${reviewSessionSize})`;
      const x = reviewQueue[0];
      reviewRevealed = false;
      const KIND = { word: 'Từ', phrase: 'Cụm từ', sentence: 'Câu' };
      const ctx = x.he > x.hs
        ? escHtml(x.en.slice(0, x.hs)) + '<mark>' + escHtml(x.en.slice(x.hs, x.he)) + '</mark>' + escHtml(x.en.slice(x.he))
        : escHtml(x.en);
      const pct = reviewSessionSize ? Math.round((doneSoFar / reviewSessionSize) * 100) : 0;
      document.getElementById('review-body').innerHTML = `
        ${reviewScopeLineHtml()}
        <div class="review-progress-bar"><div class="review-progress-fill" style="width:${pct}%"></div></div>
        <span class="review-kind">${KIND[x.kind] || ''}</span>
        <div class="review-word">${escHtml(x.text)}</div>
        <div class="review-ctx">${ctx}</div>
        <div id="review-answer-area"></div>
      `;
      renderReviewFront(x);
    }
    function renderReviewFront(x) {
      document.getElementById('review-answer-area').innerHTML =
        `<button type="button" class="review-reveal-btn" onclick="revealReviewAnswer()">Xem đáp án</button>`;
    }
    // "Xem thêm ví dụ" trong màn ôn tập (mặc định ẩn để không lộ gợi ý/đáp án cho thẻ kế tiếp)
    function reviewExamplesHtml(x) {
      const ex = Array.isArray(x.examples) ? x.examples.filter((e) => e && e.en) : [];
      if (!ex.length) return '';
      const items = ex.map((e) => `<div><p class="vocab-ex-en">${hlExample(String(e.en), x.text)}</p>${e.vi ? `<p class="vocab-ex-vi">${escHtml(e.vi)}</p>` : ''}</div>`).join('');
      return `<button type="button" class="vocab-more-btn" id="rvx-btn" style="margin-left:0" onclick="toggleReviewExamples(${ex.length})">Xem thêm ví dụ (${ex.length})</button>
        <div class="vocab-examples" id="rvx" style="margin-left:0" hidden>${items}</div>`;
    }
    function toggleReviewExamples(n) {
      const box = document.getElementById('rvx'), btn = document.getElementById('rvx-btn');
      if (!box || !btn) return;
      const open = box.hasAttribute('hidden');
      if (open) box.removeAttribute('hidden'); else box.setAttribute('hidden', '');
      btn.textContent = open ? 'Ẩn ví dụ' : `Xem thêm ví dụ (${n})`;
      btn.blur();   // trả phím Enter/Space/1-4 về cho thao tác chấm thẻ
    }
    function revealReviewAnswer() {
      if (!reviewQueue.length || reviewRevealed) return;
      reviewRevealed = true;
      const x = reviewQueue[0];
      const s = getSrs(x);
      const previews = {
        again: srsFormatDelta(srsCompute(s, 'again').due - Date.now()),
        good: srsFormatDelta(srsCompute(s, 'good').due - Date.now())
      };
      const yt = (x.videoId && !x.bookId && !x.srcUrl) ? `https://www.youtube.com/watch?v=${encodeURIComponent(x.videoId)}&t=${Math.max(0, Math.floor((x.t || 0) - 2))}s` : '';
      document.getElementById('review-answer-area').innerHTML = `
        <div class="review-answer-block">
          ${x.wordVi ? `<div class="review-wordvi">${escHtml(x.wordVi)}</div>` : '<div class="review-wordvi-empty">Chưa có nghĩa riêng của từ này</div>'}
          ${x.vi ? `<div class="review-sentvi">Cả câu: ${escHtml(x.vi)}</div>` : ''}
          ${reviewExamplesHtml(x)}
          ${yt ? `<div class="review-src"><a href="${yt}" target="_blank" rel="noopener">▶ ${escHtml(x.videoTitle || x.videoId)} · ${formatTime(x.t || 0)}</a></div>` : (x.bookId ? `<div class="review-src">📖 ${escHtml(x.videoTitle || 'Sách')}</div>` : (x.srcUrl ? `<div class="review-src"><a href="${escHtml(x.srcUrl)}" target="_blank" rel="noopener">🌐 ${escHtml(x.videoTitle || x.srcUrl)}</a></div>` : ''))}
        </div>
        <div class="review-rate-grid">
          <button type="button" class="review-rate-btn review-rate-again" onclick="rateReview('again')" title="Phím tắt: 1 hoặc ←" aria-label="Chưa nhớ lắm, muốn ôn lại sớm">
            <span class="rr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg></span>
            <span class="rr-lbl"><span class="rr-main">Chưa nhớ lắm</span><span class="rr-sub">muốn ôn lại sớm</span></span>
          </button>
          <button type="button" class="review-rate-btn review-rate-good" onclick="rateReview('good')" title="Phím tắt: 2 hoặc →" aria-label="Nhớ rồi">
            <span class="rr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>
            <span class="rr-lbl"><span class="rr-main">Nhớ rồi</span></span>
          </button>
        </div>`;
    }
    function rateReview(rating) {
      if (!reviewQueue.length || !reviewRevealed) return;
      const current = reviewQueue[0];
      const newSrs = srsCompute(getSrs(current), rating);
      const all = getVocab();
      const item = all.find((v) => v.id === current.id);
      if (item) { item.srs = newSrs; setVocab(all); }
      reviewStats.reviewed++;
      if (rating === 'again') {
        reviewStats.again++;
        reviewQueue.shift();
        const reinsertAt = Math.min(reviewQueue.length, 3);
        reviewQueue.splice(reinsertAt, 0, Object.assign({}, current, { srs: newSrs }));
        reviewSessionSize++;
      } else {
        reviewQueue.shift();
      }
      renderReviewBody();
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    // itemId (tuỳ chọn): id của mục từ vựng vừa lưu -> hiện thêm nút "Thêm nghĩa" / "Sửa nghĩa" để nhập nghĩa ngay tại chỗ.
    let toastEditId = null;
    function showVocabToast(msg, withLink, itemId, canDelete) {
      const el = document.getElementById('vocab-toast');
      if (!el) return;
      commitToastMeaning();
      toastEditId = null;
      el.classList.remove('editing');
      let actions = '';
      if (itemId) {
        const it = getVocab().find((v) => v.id === itemId);
        if (it) actions += `<button type="button" onclick="startToastMeaning('${itemId}')">${it.wordVi ? 'Sửa nghĩa' : 'Thêm nghĩa'}</button>`;
        if (it && vocabAiToastWanted(it)) actions += `<button type="button" onclick="openVocabMeaningModal()" title="Nhờ AI điền nghĩa + 3 ví dụ cho tất cả các từ chưa có">✨ Điền nghĩa AI</button>`;
      }
      if (withLink) actions += `<button type="button" onclick="openVocabScreen('lesson')" title="Xem từ vựng đã lưu của bài học này">Xem danh sách</button>`;   // 'lesson': lọc sẵn theo video / bài đang học
      if (itemId && canDelete) actions += `<button type="button" class="vt-remove" onclick="deleteSavedFromToast('${itemId}')" title="Bỏ từ vừa lưu (dùng khi lỡ bấm Lưu)">Xóa</button>`;
      el.innerHTML = `<span class="vt-msg">${escHtml(msg)}</span>` + (actions ? `<div class="vt-actions">${actions}</div>` : '');
      el.classList.add('show');
      clearTimeout(vocabToastTimer);
      vocabToastTimer = setTimeout(() => el.classList.remove('show'), itemId ? 6000 : 3500);
    }

    // Biến popup thành ô nhập "nghĩa riêng" của từ/cụm vừa lưu (dùng chung dữ liệu wordVi với trang Từ vựng đã lưu)
    function startToastMeaning(id) {
      const el = document.getElementById('vocab-toast');
      const item = getVocab().find((v) => v.id === id);
      if (!el || !item) return;
      toastEditId = id;
      clearTimeout(vocabToastTimer);
      const short = item.text.length > 28 ? item.text.slice(0, 28) + '…' : item.text;
      el.classList.add('editing');
      el.innerHTML = `<span class="vt-word" title="${escHtml(item.text)}">“${escHtml(short)}”</span>`
        + `<input id="vt-wordvi-input" class="vt-input" type="text" autocomplete="off" value="${escHtml(item.wordVi || '')}" placeholder="Nghĩa tiếng Việt của từ/cụm này..."`
        + ` onkeydown="if(event.key==='Enter'){event.preventDefault();saveToastMeaning();}else if(event.key==='Escape'){event.preventDefault();cancelToastMeaning();}" />`
        + `<button type="button" onclick="saveToastMeaning()">Lưu</button>`
        + `<button type="button" class="vt-ghost" onclick="cancelToastMeaning()">Huỷ</button>`;
      el.classList.add('show');
      requestAnimationFrame(() => {
        const inp = document.getElementById('vt-wordvi-input');
        if (inp) { inp.focus(); inp.select(); }
      });
    }
    function saveToastMeaning() {
      const inp = document.getElementById('vt-wordvi-input');
      const id = toastEditId;
      if (!inp || !id) return;
      const val = inp.value.trim();
      const all = getVocab();
      const item = all.find((v) => v.id === id);
      toastEditId = null;
      if (!item) { cancelToastMeaning(); return; }
      if (val) item.wordVi = val; else delete item.wordVi;
      if (!setVocab(all)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      const shown = val.length > 40 ? val.slice(0, 40) + '…' : val;
      showVocabToast(val ? `Đã lưu nghĩa: ${shown}` : 'Đã xoá nghĩa của từ này', true);
    }
    function cancelToastMeaning() {
      const el = document.getElementById('vocab-toast');
      toastEditId = null;
      if (!el) return;
      el.classList.remove('show');
      setTimeout(() => { if (!el.classList.contains('show')) el.classList.remove('editing'); }, 250);
    }
    // Nếu popup đang mở ô nhập mà bị thay bằng thông báo khác, giữ lại phần nghĩa đã gõ thay vì làm mất
    function commitToastMeaning() {
      const inp = document.getElementById('vt-wordvi-input');
      if (!toastEditId || !inp) return;
      const val = inp.value.trim();
      if (!val) return;
      const all = getVocab();
      const item = all.find((v) => v.id === toastEditId);
      if (item) { item.wordVi = val; setVocab(all); }
    }

    // Dựng mục từ vựng từ vùng đang bôi đen: lấy các CÂU chứa vùng đó làm ngữ cảnh + vị trí từ cần tô sáng.
    function buildVocabItem(range, selText) {
      const container = activeSubContainer();
      const overlaps = (el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        return range.compareBoundaryPoints(Range.END_TO_START, r) < 0 && range.compareBoundaryPoints(Range.START_TO_END, r) > 0;
      };
      const hit = container ? Array.from(container.querySelectorAll('.sub-word-unit')).filter(overlaps) : [];
      let en = '', hs = 0, he = 0, vi = '', t = 0, prevIdx = -1;

      if (hit.length) {
        const hitSet = new Set(hit);
        const lines = [];
        hit.forEach((sp) => { const ln = sp.closest('.sentence-text-line'); if (ln && !lines.includes(ln)) lines.push(ln); });
        let first = -1, last = -1;
        const vis = [];
        lines.forEach((ln) => {
          const s = sentences.find((x) => String(x.id) === ln.getAttribute('data-id'));
          if (s && s.vi && s.vi.trim()) vis.push(s.vi.trim());
          ln.querySelectorAll('.sub-word-unit').forEach((sp) => {
            if (en) en += ' ';
            const st = en.length;
            en += sp.textContent;
            if (hitSet.has(sp)) { if (first < 0) first = st; last = en.length; }
          });
        });
        hs = first; he = last; vi = vis.join(' ');
        prevIdx = sentences.findIndex((x) => String(x.id) === lines[0].getAttribute('data-id')) - 1;
        t = parseFloat(hit[0].getAttribute('data-start')) || 0;
      } else {
        const low = selText.toLowerCase();
        let pvS = window.pvActiveSentence ? window.pvActiveSentence() : null;   // giao diện Shadowing: luôn lấy đúng câu đang luyện
        try {   // bôi đen ở phụ đề đè lên video: lấy đúng câu đang hiển thị trên video
          ['vid-en', 'cs-text'].forEach((id) => {
            const vEn = document.getElementById(id);
            if (!pvS && vEn && range && vEn.contains(range.startContainer)) pvS = sentences[parseInt(vEn.getAttribute('data-idx'), 10)] || null;
          });
        } catch (e) {}
        const s = pvS || sentences.find((x) => x.text.toLowerCase().includes(low)) || sentences[currentSentenceIndex];
        if (!s) return null;
        en = s.text.trim();
        prevIdx = sentences.indexOf(s) - 1;
        let low2 = low, idx = en.toLowerCase().indexOf(low2);
        if (idx < 0) { low2 = low.replace(/\s+([,.;:!?)\]\u201d\u2019])/g, '$1').replace(/([(\[\u201c\u2018])\s+/g, '$1'); idx = en.toLowerCase().indexOf(low2); }
        if (idx >= 0) { hs = idx; he = idx + low2.length; } else { hs = 0; he = en.length; }
        vi = (s.vi || '').trim();
        t = s.startTime || 0;
      }

      // Bỏ dấu câu thừa ở hai đầu phần được tô sáng
      const seg = en.slice(hs, he);
      hs += seg.match(/^[^\p{L}\p{N}]*/u)[0].length;
      he -= seg.match(/[^\p{L}\p{N}]*$/u)[0].length;
      if (he <= hs) return null;
      const text = en.slice(hs, he).trim();
      const n = text.split(/\s+/).length;
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'),
        en, hs, he, vi,
        prev: (prevIdx >= 0 && sentences[prevIdx]) ? String(sentences[prevIdx].text || '').trim() : '',   // câu đứng ngay trước (làm ngữ cảnh cho AI)
        videoId: currentVideoId, videoTitle: currentVideoTitle || '', t, createdAt: Date.now(),
        bookId: (bkActive() && bkBook) ? bkBook.id : undefined, ch: (bkActive() && bkBook) ? bkCh : undefined
      };
    }

    function saveSelectionToVocab(keepPopup) {
      if (!selectedRangeForLoop || !selectedTextForLookup) return;
      const fromVocabArea = !!vocabAreaCtx;
      const item = vocabAreaCtx ? buildVocabItemFromArea(vocabAreaCtx) : buildVocabItem(selectedRangeForLoop, selectedTextForLookup);
      // Shift + click "Lưu": vẫn lưu nhưng giữ nguyên 3 pop-up + vùng bôi đen để còn bấm "Tra nghĩa" / "Loop" tiếp
      if (!keepPopup) {
        hideLookupTooltip();
        window.getSelection()?.removeAllRanges();
      }
      if (!item) return;
      const short = item.text.length > 40 ? item.text.slice(0, 40) + '…' : item.text;
      const list = getVocab();
      const normText = String(item.text || '').trim().toLowerCase();

      // (1) Trùng chính xác ở cùng đoạn trong video này:
      const exactDup = list.find((x) => x.videoId === item.videoId && String(x.text || '').trim().toLowerCase() === normText && Math.abs((x.t || 0) - (item.t || 0)) < 2);
      if (exactDup) { showVocabToast(`“${short}” đã được lưu ở đoạn này rồi`, true, exactDup.id); return; }

      // (2) Trùng từ đã lưu từ video/bài học khác -> Hợp nhất ngữ cảnh:
      const crossDup = list.find((x) => String(x.text || '').trim().toLowerCase() === normText);
      if (crossDup) {
        if (!Array.isArray(crossDup.contexts)) crossDup.contexts = [];
        const isAlreadyInContexts = crossDup.contexts.some(c => c.videoId === item.videoId && Math.abs((c.t || 0) - (item.t || 0)) < 2);
        if (!isAlreadyInContexts && (crossDup.videoId !== item.videoId || Math.abs((crossDup.t || 0) - (item.t || 0)) >= 2)) {
          crossDup.contexts.push({
            videoId: item.videoId || '',
            videoTitle: item.videoTitle || '',
            bookId: item.bookId || '',
            en: item.en || '',
            vi: item.vi || '',
            hs: item.hs || 0,
            he: item.he || 0,
            t: item.t || 0,
            createdAt: Date.now()
          });
        }
        if (!crossDup.wordVi && item.wordVi) crossDup.wordVi = item.wordVi;
        if ((!crossDup.examples || !crossDup.examples.length) && (item.examples && item.examples.length)) crossDup.examples = item.examples;
        setVocab(list);
        updateVocabBadges();
        if (bkActive()) bkMarkSaved();
        if (fromVocabArea) {
          const vscr = document.getElementById('screen-vocab');
          if (vscr && !vscr.classList.contains('hidden')) { renderVocabPageKeepScroll(); hideLookupTooltip(); }
        }
        const srcTitle = crossDup.videoTitle ? ` (bài: ${crossDup.videoTitle})` : '';
        showVocabToast(`“${short}” đã có trong sổ từ vựng${srcTitle}. Đã bổ sung ngữ cảnh bài này!`, true, crossDup.id, true);
        return;
      }

      list.unshift(item);
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      updateVocabBadges();
      if (bkActive()) bkMarkSaved();
      if (fromVocabArea) {
        // Đang ở màn "Từ vựng đã lưu": vẽ lại danh sách để thấy mục mới (vùng bôi đen sẽ mất nên ẩn luôn popup)
        const vscr = document.getElementById('screen-vocab');
        if (vscr && !vscr.classList.contains('hidden')) { renderVocabPageKeepScroll(); hideLookupTooltip(); }
      }
      showVocabToast(`Đã lưu “${short}”`, true, item.id, true);
    }
    // Nút "Xóa" trên popup vừa lưu: bỏ từ vừa lưu nhầm (cập nhật luôn số đếm, gạch chân / highlight từ đã lưu và trang Từ vựng nếu đang mở)
    function deleteSavedFromToast(id) {
      const all = getVocab();
      const it = all.find((v) => v.id === id);
      if (!it) { showVocabToast('Từ này không còn trong danh sách', false); return; }
      if (!setVocab(all.filter((v) => v.id !== id))) { showVocabToast('Không xóa được: bộ nhớ trình duyệt bị lỗi', false); return; }
      updateVocabBadges();
      try { if (bkActive()) bkMarkSaved(); } catch (e) {}
      const vscr = document.getElementById('screen-vocab');
      if (vscr && !vscr.classList.contains('hidden')) renderVocabPageKeepScroll();
      const short = it.text.length > 40 ? it.text.slice(0, 40) + '…' : it.text;
      showVocabToast(`Đã xóa “${short}”`, false);
    }
    document.getElementById('btn-save-action').addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      saveSelectionToVocab(e.shiftKey);
    });

    // scope === 'lesson' (nút "Từ vựng" trong giao diện luyện tập): lọc sẵn theo bài đang học (video / bài viết); bài chưa có từ nào thì hiện "Tất cả bài học"
    function openVocabScreen(scope) {
      const practice = document.getElementById('screen-practice');
      const fromPractice = !practice.classList.contains('hidden');
      const bookScr = document.getElementById('screen-book');
      const fromBook = !!bookScr && !bookScr.classList.contains('hidden');
      if (fromBook) { bkSavePosNow(); bookScr.classList.add('hidden'); document.body.classList.remove('book-mode'); }
      vocabReturnTo = fromBook ? 'book' : (fromPractice ? 'practice' : 'input');
      if (fromPractice) { try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {} }
      else { vocabHomeScrollY = window.scrollY; }
      hideLookupTooltip();
      document.getElementById('screen-input').classList.add('hidden');
      practice.classList.add('hidden');
      document.getElementById('screen-vocab').classList.remove('hidden');
      vocabSource = 'all';
      const lessonScope = scope === 'lesson' && fromPractice && !!currentVideoId;
      if (lessonScope) { vocabSource = vocabSourceInfo({ videoId: currentVideoId }).key; vocabScrollY = 0; }
      syncAllVocabFromLocalHistory();
      renderVocabPage();
      // Khởi tạo sớm player ngầm để bấm "Audio video" phát ngay lập tức
      if (typeof window.ensureBgAudioPlayer === 'function') {
        window.ensureBgAudioPlayer();
      }
      // Khôi phục vị trí cuộn lần trước (chỉ nhớ trong phiên này; tải lại trang thì về đầu)
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: vocabScrollY, behavior: 'auto' })));
    }
    function closeVocabScreen() {
      vocabScrollY = window.scrollY;
      document.getElementById('screen-vocab').classList.add('hidden');
      if (vocabReturnTo === 'book' && bkBook && bkChs.length) {
        document.getElementById('screen-book').classList.remove('hidden');
        document.body.classList.add('book-mode');
        bkMarkSaved();
        const sc = bkScrollEl(); if (sc) sc.focus({ preventScroll: true });
        return;
      }
      if (vocabReturnTo === 'practice') {
        document.getElementById('screen-practice').classList.remove('hidden');
      } else {
        document.getElementById('screen-input').classList.remove('hidden');
        requestAnimationFrame(() => window.scrollTo({ top: vocabHomeScrollY, behavior: 'auto' }));
      }
      ensurePageFocus();
    }



    // ==================== TRANG HƯỚNG DẪN CÀI EXTENSION ====================
    let guideHomeScrollY = 0;
    const guideVisible = () => { const d = document.getElementById('screen-guide'); return !!d && !d.classList.contains('hidden'); };
    function loadGuideImages() {
      document.querySelectorAll('#screen-guide img[data-src]').forEach((im) => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
    }
    function openGuideScreen() {
      loadGuideImages();
      guideHomeScrollY = window.scrollY;
      if (typeof hideLookupTooltip === 'function') hideLookupTooltip();
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-guide').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    function closeGuideScreen() {
      closeGuideLightbox();
      document.getElementById('screen-guide').classList.add('hidden');
      document.getElementById('screen-input').classList.remove('hidden');
      requestAnimationFrame(() => window.scrollTo({ top: guideHomeScrollY, behavior: 'auto' }));
    }
    function fitGuideLightbox() {
      const im = document.getElementById('gd-lightbox-img');
      const nw = im.naturalWidth, nh = im.naturalHeight;
      if (!nw || !nh) return;
      // Phóng ảnh vừa khít khung nhìn (tối đa 3 lần để không quá mờ)
      const k = Math.min(3, (window.innerWidth * 0.94) / nw, (window.innerHeight * 0.82) / nh);
      im.style.width = Math.round(nw * k) + 'px';
      im.style.height = Math.round(nh * k) + 'px';
    }
    function openGuideLightbox(btn) {
      if (btn.classList.contains('gd-missing')) return;
      const src = btn.querySelector('img'), im = document.getElementById('gd-lightbox-img');
      im.onload = fitGuideLightbox;
      im.alt = src.alt;
      im.src = src.currentSrc || src.src;
      document.getElementById('gd-lightbox').classList.add('show');
      if (im.complete) fitGuideLightbox();
    }
    function closeGuideLightbox() {
      const box = document.getElementById('gd-lightbox');
      if (box) box.classList.remove('show');
    }
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('#screen-guide .gd-shot').forEach((b) => b.addEventListener('click', () => openGuideLightbox(b)));
      document.getElementById('gd-lightbox').addEventListener('click', closeGuideLightbox);
    });
    window.addEventListener('resize', () => { if (document.getElementById('gd-lightbox').classList.contains('show')) fitGuideLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !guideVisible()) return;
      const lb = document.getElementById('gd-lightbox');
      if (lb && lb.classList.contains('show')) closeGuideLightbox(); else closeGuideScreen();
    });

    // ==================== TRANG ỦNG HỘ (DONATE) ====================
    let donateHomeScrollY = 0;
    const donateVisible = () => { const d = document.getElementById('screen-donate'); return !!d && !d.classList.contains('hidden'); };
    // Ảnh của trang Donate được nạp bằng JS (không nằm sẵn trong HTML) để các bot chia sẻ link không lấy nhầm làm ảnh xem trước.
    function loadDonateImages() {
      document.querySelectorAll('#screen-donate img[data-src]').forEach((im) => { im.src = im.dataset.src; im.removeAttribute('data-src'); });
    }
    window.addEventListener('load', () => { (window.requestIdleCallback || setTimeout)(loadDonateImages); });
    function openDonateScreen() {
      loadDonateImages();
      donateHomeScrollY = window.scrollY;
      hideLookupTooltip();
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-donate').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    function closeDonateScreen() {
      closeDonateQr();
      document.getElementById('screen-donate').classList.add('hidden');
      document.getElementById('screen-input').classList.remove('hidden');
      requestAnimationFrame(() => window.scrollTo({ top: donateHomeScrollY, behavior: 'auto' }));
    }
    function setDonateTab(name) {
      const tabs = document.getElementById('dn-tabs');
      tabs.dataset.active = name;
      tabs.querySelectorAll('[role="tab"]').forEach((t) => {
        const on = t.dataset.tab === name;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      document.querySelectorAll('#screen-donate .dn-pane').forEach((p) => p.classList.toggle('is-active', p.dataset.pane === name));
    }
    function donateTabKey(e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const next = document.getElementById('dn-tabs').dataset.active === 'momo' ? 'vcb' : 'momo';
      setDonateTab(next);
      document.getElementById('dn-tab-' + next).focus();
    }
    function copyDonateAccount(btn) {
      const text = (document.getElementById('dn-acc-number').textContent || '').trim();
      const label = btn.querySelector('.dn-copy-text');
      const done = () => {
        btn.classList.add('copied');
        if (label) label.textContent = 'Đã chép';
        clearTimeout(btn._t);
        btn._t = setTimeout(() => { btn.classList.remove('copied'); if (label) label.textContent = 'Sao chép'; }, 2000);
      };
      const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    }
    function openDonateQr(btn) {
      if (btn.classList.contains('is-missing')) return;
      const img = btn.querySelector('img');
      document.getElementById('dn-lightbox-img').src = img.currentSrc || img.src;
      document.getElementById('dn-lightbox').classList.add('show');
    }
    function closeDonateQr() {
      const box = document.getElementById('dn-lightbox');
      if (box) box.classList.remove('show');
    }
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !donateVisible()) return;
      const lb = document.getElementById('dn-lightbox');
      if (lb && lb.classList.contains('show')) closeDonateQr(); else closeDonateScreen();
    });


    // Mở video của từ vựng ngay trong app, tua tới đúng câu chứa từ đó.
    async function openVocabVideo(id) {
      const x = getVocab().find((v) => v.id === id);
      if (!x || !x.videoId) return;
      if (x.bookId) { vocabScrollY = window.scrollY; await bkOpenFromVocab(x); return; }
      vocabScrollY = window.scrollY;
      const goPractice = () => {
        document.getElementById('screen-vocab').classList.add('hidden');
        document.getElementById('screen-input').classList.add('hidden');
        document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();
        ensurePageFocus();
      };
      const sentStart = () => {
        const s = sentences[getSentenceIndexForTime(x.t || 0)];
        return Math.max(0, s ? s.startTime : (x.t || 0));
      };

      // (a0) Bài văn bản đang mở sẵn -> chỉ cần quay lại và cuộn tới đúng câu
      if (isTextMode && currentVideoId === x.videoId && sentences.length) {
        goPractice();
        triggerSmoothCenterScroll(getSentenceIndexForTime(x.t || 0), true);
        return;
      }
      // (a) Video đang mở sẵn trong player -> chỉ cần quay lại và tua
      if (!isTextMode && currentVideoId === x.videoId && sentences.length && ytPlayer && isPlayerReady) {
        goPractice();
        seekToTime(sentStart(), undefined, true, null, true);
        return;
      }
      // (b) Có trong lịch sử luyện tập (đã lưu sẵn phụ đề)
      if (getLocalHistory().some((h) => h.videoId === x.videoId && h.sentences && h.sentences.length)) {
        const item = getLocalHistory().find((h) => h.videoId === x.videoId);
        pendingSeekTime = (() => { const s = item.sentences.slice().reverse().find((z) => z.startTime <= (x.t || 0) + 0.05); return s ? s.startTime : (x.t || 0); })();
        loadFromHistory(x.videoId);
        return;
      }
      // (c) Video thuộc thư viện có sẵn -> nạp phụ đề từ thư viện
      pendingSeekTime = Math.max(0, (x.t || 0) - 0.3);
      const ok = await selectCategoryVideo(x.videoId, x.videoTitle);
      if (ok) return;
      // (d) Không còn phụ đề -> đành mở YouTube
      pendingSeekTime = null;
      showVocabToast('App không còn phụ đề của video này nên mở tạm trên YouTube', false);
      window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(x.videoId)}&t=${Math.max(0, Math.floor((x.t || 0) - 2))}s`, '_blank');
    }


    // Tô sáng từ cần học trong câu ví dụ (khớp cả khi đã chia: plot -> plotting)
    function hlExample(en, term) {
      const t = String(term || '').trim();
      const low = en.toLowerCase();
      if (t.length >= 2) {
        const cands = [t.toLowerCase()];
        const stem = t.toLowerCase().replace(/(e|y)$/, '');
        if (stem.length >= 3 && stem !== cands[0]) cands.push(stem);
        for (const c of cands) {
          let from = 0, idx;
          while ((idx = low.indexOf(c, from)) >= 0) {
            if (idx === 0 || !/[\p{L}]/u.test(low[idx - 1])) {
              let end = idx + c.length;
              if (c.indexOf(' ') < 0) while (end < low.length && /[\p{L}']/u.test(low[end])) end++;
              return escHtml(en.slice(0, idx)) + '<mark>' + escHtml(en.slice(idx, end)) + '</mark>' + escHtml(en.slice(end));
            }
            from = idx + 1;
          }
        }
      }
      return escHtml(en);
    }
    let vocabOpenExamples = new Set();   // các thẻ đang mở phần "ví dụ" (giữ nguyên khi vẽ lại danh sách)
    function vocabExamplesHtml(x) {
      const ex = Array.isArray(x.examples) ? x.examples.filter((e) => e && e.en) : [];
      if (!ex.length) return '';
      const open = vocabOpenExamples.has(x.id);
      const items = ex.map((e) => `<div><p class="vocab-ex-en">${hlExample(String(e.en), x.text)}</p>${e.vi ? `<p class="vocab-ex-vi">${escHtml(e.vi)}</p>` : ''}</div>`).join('');
      return `<button type="button" class="vocab-more-btn" id="vex-btn-${x.id}" onclick="toggleVocabExamples('${x.id}')">${open ? 'Ẩn ví dụ' : `Xem thêm ví dụ (${ex.length})`}</button>
        <div class="vocab-examples" id="vex-${x.id}" ${open ? '' : 'hidden'}>${items}</div>`;
    }
    function toggleVocabExamples(id) {
      const box = document.getElementById('vex-' + id), btn = document.getElementById('vex-btn-' + id);
      if (!box || !btn) return;
      const open = box.hasAttribute('hidden');
      if (open) { box.removeAttribute('hidden'); vocabOpenExamples.add(id); } else { box.setAttribute('hidden', ''); vocabOpenExamples.delete(id); }
      const n = box.children.length;
      btn.textContent = open ? 'Ẩn ví dụ' : `Xem thêm ví dụ (${n})`;
    }

    function maskGrammarTag(text) {
      if (!text) return '';
      return String(text).replace(/\[v\.\s*([^·\]]+)\s*·\s*([^\]]+)\]/gi, (match, root, rest) => {
        return `[v. ${rest.trim()}]`;
      });
    }

    function formatGrammarBadgeHtml(text, options = {}) {
      if (!text) return '';
      let str = String(text);
      if (options.mask) {
        str = maskGrammarTag(str);
      }
      return str.replace(/\[(v\.[^\]]*|n\.m\.|n\.f\.|n\.pl\.|n\.m\.\/f\.|adj\.|adv\.|loc\.[^\]]*|prep\.|conj\.)\]/gi, (match, tag) => {
        let colorClass = 'vph-badge-default';
        const t = tag.toLowerCase().trim();
        if (t.startsWith('v.')) colorClass = 'vph-badge-verb';
        else if (t === 'n.m.') colorClass = 'vph-badge-nm';
        else if (t === 'n.f.') colorClass = 'vph-badge-nf';
        else if (t.startsWith('adj') || t.startsWith('adv')) colorClass = 'vph-badge-adj';
        else if (t.startsWith('loc')) colorClass = 'vph-badge-loc';
        return `<span class="vph-grammar-badge ${colorClass}" title="${escHtml(match)}">${escHtml(match)}</span>`;
      });
    }
    window.formatGrammarBadgeHtml = formatGrammarBadgeHtml;
    window.maskGrammarTag = maskGrammarTag;

    function vocabCardHtml(x) {
      const KIND = { word: 'Từ', phrase: 'Cụm từ', sentence: 'Câu' };
      const ctx = x.he > x.hs
        ? escHtml(x.en.slice(0, x.hs)) + '<mark class="vocab-hl">' + escHtml(x.en.slice(x.hs, x.he)) + '</mark>' + escHtml(x.en.slice(x.he))
        : escHtml(x.en);
      const yt = x.videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(x.videoId)}&t=${Math.max(0, Math.floor((x.t || 0) - 2))}s` : '';
      const src = x.bookId ? `<a href="#" title="Mở lại đúng câu này trong sách" onclick="openVocabVideo('${x.id}'); return false;">📖 ${escHtml(x.videoTitle || 'Sách')}</a>`
        : x.srcUrl ? `<a href="${escHtml(x.srcUrl)}" target="_blank" rel="noopener" title="Mở trang web gốc">🌐 ${escHtml(x.videoTitle || x.srcUrl)}</a>`
        : x.videoId ? `<a href="${yt}" title="Mở lại đúng câu này trong Shadowing Studio" onclick="openVocabVideo('${x.id}'); return false;">▶ ${escHtml(x.videoTitle || x.videoId)} · ${formatTime(x.t || 0)}</a>` : '<span></span>';

      let wordViBlock;
      if (vocabEditIds.has(x.id)) {
        wordViBlock = `<div class="vocab-wordvi-edit">
          <input id="wordvi-input-${x.id}" class="vocab-wordvi-input" type="text" value="${escHtml(x.wordVi || '')}" placeholder="Nghĩa riêng của từ/cụm này..."
            onkeydown="if(event.key==='Enter'){event.preventDefault();saveWordMeaning('${x.id}');}else if(event.key==='Escape'){cancelEditWordMeaning('${x.id}');}" />
          <button type="button" class="vocab-mini" onclick="saveWordMeaning('${x.id}')">Lưu</button>
          <button type="button" class="vocab-mini" onclick="cancelEditWordMeaning('${x.id}')">Huỷ</button>
        </div>${vocabAiHintId === x.id ? vocabAiHintHtml() : ''}`;
      } else {
        wordViBlock = `<div class="vocab-wordvi-row">
          ${x.wordVi ? `<p class="vocab-wordvi">${formatGrammarBadgeHtml(escHtml(x.wordVi))}</p>` : `<p class="vocab-wordvi-empty">Chưa có nghĩa riêng của từ này<button type="button" class="vocab-ai-link" onclick="openVocabMeaningModal('${x.id}')" title="Nhờ AI điền nghĩa + 3 ví dụ cho từ này">✨ Điền bằng AI</button></p>`}
          <button type="button" class="vocab-mini" onclick="startEditWordMeaning('${x.id}')">${x.wordVi ? 'Sửa nghĩa' : '+ Thêm nghĩa'}</button>
        </div>`;
      }

      const extraContexts = Array.isArray(x.contexts) && x.contexts.length > 0 ? x.contexts : [];
      let extraContextsHtml = '';
      if (extraContexts.length > 0) {
        extraContextsHtml = `
          <div class="vocab-multi-ctx-card">
            <details class="vocab-multi-ctx-details">
              <summary class="vocab-multi-ctx-summary">
                <span class="vocab-multi-ctx-badge">🔗 Xuất hiện ở ${extraContexts.length + 1} bài học</span>
                <span class="vocab-multi-ctx-hint">Xem ngữ cảnh khác ▾</span>
              </summary>
              <div class="vocab-multi-ctx-body">
                ${extraContexts.map((c) => {
                  const cYt = c.videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(c.videoId)}&t=${Math.max(0, Math.floor((c.t || 0) - 2))}s` : '';
                  const cSrc = c.bookId ? `📖 ${escHtml(c.videoTitle || 'Sách')}`
                    : c.videoId ? `<a href="${cYt}" target="_blank" rel="noopener">▶ ${escHtml(c.videoTitle || c.videoId)} · ${formatTime(c.t || 0)}</a>`
                    : '';
                  return `
                    <div class="vocab-ctx-item">
                      <p class="vocab-ctx-en">“${escHtml(c.en)}”</p>
                      ${c.vi ? `<p class="vocab-ctx-vi">${escHtml(c.vi)}</p>` : ''}
                      ${cSrc ? `<div class="vocab-ctx-src">${cSrc}</div>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </details>
          </div>
        `;
      }

      return `<article class="vocab-card" data-vid="${escHtml(x.id)}">
        <div class="vocab-card-head">
          <div>
            <span class="vocab-kind vocab-kind-${x.kind}">${escHtml(x.tag || KIND[x.kind] || '')}</span>
            ${x.level ? `<span class="vocab-level-badge level-${escHtml(x.level.toLowerCase().replace('+', 'plus'))}">${escHtml(x.level)}</span>` : ''}
            <h3 class="vocab-word">${escHtml(x.text)}</h3>
          </div>
          <div class="vocab-card-tools">
            <button type="button" class="vocab-mini" onclick="playVocabWordAudio('${x.id}', event)" title="Nghe phát âm từ vựng">🗣️ Phát âm</button>
            ${(x.videoId && !x.bookId) ? `<button type="button" class="vocab-mini vocab-video-mini" onclick="playVocabVideoAudio('${x.id}', event)" title="Nghe âm thanh từ video gốc (không chiếu video)">🎧 Audio video</button>` : ''}
            <button type="button" class="vocab-mini" onclick="lookupVocab('${x.id}')">Tra nghĩa</button>
            <button type="button" class="vocab-mini del" title="Xoá" onclick="deleteVocab('${x.id}')">✕</button>
          </div>
        </div>
        <p class="vocab-ctx">${ctx}</p>
        ${extraContextsHtml}
        ${wordViBlock}
        ${x.vi ? `<p class="vocab-vi">Cả câu: ${escHtml(x.vi)}</p>` : `<p class="vocab-vi-empty">Chưa có bản dịch cả câu<button type="button" class="vocab-ai-link" onclick="openVocabMeaningModal('${x.id}')" title="Nhờ AI điền nghĩa và dịch câu này">✨ Điền bằng AI</button></p>`}
        ${vocabExamplesHtml(x)}
        <div class="vocab-src">${src}<span>${new Date(x.createdAt).toLocaleDateString('vi-VN')}</span></div>
      </article>`;
    }

    // ---------- Gợi ý dùng "Điền nghĩa (AI)" ----------
    // Bấm "+ Thêm nghĩa" ở trang Từ vựng đã lưu: hiện ô gợi ý ngay dưới ô nhập, tối đa 2 lần (mỗi lần bấm 1 lần hiện), chỉ khi còn từ 3 mục chưa có nghĩa trở lên.
    // Đã mở cửa sổ "Điền nghĩa (AI)" (từ bất kỳ nút nào) thì coi như người dùng đã biết -> không gợi ý nữa.
    const VOCAB_AI_HINT_KEY = 'shadowing_vocab_ai_hint_v1', VOCAB_AI_TOAST_KEY = 'shadowing_vocab_ai_toast_v1';
    const VOCAB_AI_HINT_MAX = 2, VOCAB_AI_HINT_MIN_MISSING = 3;
    const vocabAiMem = {};   // dự phòng khi trình duyệt chặn localStorage
    let vocabAiHintId = null;
    function vocabAiCountGet(key) {
      let n = 0;
      try { n = parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) {}
      return Math.max(n, vocabAiMem[key] || 0);
    }
    function vocabAiCountSet(key, n) {
      vocabAiMem[key] = n;
      try { localStorage.setItem(key, String(n)); } catch (e) {}
    }
    function vocabMissingMeaningCount() {
      return getVocab().filter((x) => !x.wordVi || !String(x.wordVi).trim()).length;
    }
    function vocabAiHintHtml() {
      const n = vocabMissingMeaningCount();
      return `<div class="vocab-ai-hint" id="vocab-ai-hint">
          <div class="vah-text">💡 <b>Không cần tự gõ nghĩa từng từ.</b> Bạn có <b>${n} mục</b> chưa có nghĩa. AI có thể điền nghĩa và 3 ví dụ cho tất cả chỉ trong khoảng 1 phút: copy prompt → dán vào ChatGPT/Claude → dán câu trả lời lại.</div>
          <div class="vah-actions">
            <button type="button" class="vah-primary" onclick="openVocabMeaningModal()">Điền nghĩa bằng AI</button>
            <button type="button" class="vah-ghost" onclick="vocabAiHintDismiss()">Tự gõ, không cần</button>
          </div>
        </div>`;
    }
    function vocabAiHintMaybeShow(id) {
      vocabAiHintId = null;
      const it = getVocab().find((v) => v.id === id);
      if (!it || (it.wordVi && String(it.wordVi).trim())) return;   // "Sửa nghĩa": họ đã biết cách điền rồi
      const shown = vocabAiCountGet(VOCAB_AI_HINT_KEY);
      if (shown >= VOCAB_AI_HINT_MAX) return;
      if (vocabMissingMeaningCount() < VOCAB_AI_HINT_MIN_MISSING) return;   // chỉ thiếu 1-2 từ thì tự gõ nhanh hơn, không làm phiền
      vocabAiHintId = id;
      vocabAiCountSet(VOCAB_AI_HINT_KEY, shown + 1);
    }
    function vocabAiHintDismiss() {   // chỉ ẩn ô gợi ý của lần này (không vẽ lại trang để khỏi mất chữ đang gõ)
      vocabAiHintId = null;
      const el = document.getElementById('vocab-ai-hint');
      if (el) el.remove();
    }
    function vocabAiHintDone() {   // đã mở cửa sổ "Điền nghĩa (AI)" -> người dùng đã biết nút này
      vocabAiCountSet(VOCAB_AI_HINT_KEY, VOCAB_AI_HINT_MAX);
      vocabAiCountSet(VOCAB_AI_TOAST_KEY, VOCAB_AI_HINT_MAX);
      vocabAiHintDismiss();
    }
    // Thông báo sau khi lưu từ ở phụ đề: thêm nút "Điền nghĩa AI" (tối đa 2 lần, chỉ khi từ vừa lưu chưa có nghĩa và còn ≥ 3 mục chưa có nghĩa)
    function vocabAiToastWanted(item) {
      if (!item || (item.wordVi && String(item.wordVi).trim())) return false;
      const shown = vocabAiCountGet(VOCAB_AI_TOAST_KEY);
      if (shown >= VOCAB_AI_HINT_MAX || vocabMissingMeaningCount() < VOCAB_AI_HINT_MIN_MISSING) return false;
      vocabAiCountSet(VOCAB_AI_TOAST_KEY, shown + 1);
      return true;
    }

    // ---------- (A) Sửa/thêm nghĩa riêng của 1 từ ----------
    function startEditWordMeaning(id) {
      vocabEditIds.add(id);
      vocabAiHintMaybeShow(id);
      renderVocabPage();
      requestAnimationFrame(() => {
        const el = document.getElementById(`wordvi-input-${id}`);
        if (el) { el.focus(); el.select(); }
      });
    }
    function cancelEditWordMeaning(id) {
      if (vocabAiHintId === id) vocabAiHintId = null;
      vocabEditIds.delete(id);
      renderVocabPage();
    }
    function saveWordMeaning(id) {
      const el = document.getElementById(`wordvi-input-${id}`);
      const val = el ? el.value.trim() : '';
      const all = getVocab();
      const item = all.find((v) => v.id === id);
      if (item) {
        if (val) item.wordVi = val; else delete item.wordVi;
        setVocab(all);
      }
      if (vocabAiHintId === id) vocabAiHintId = null;
      vocabEditIds.delete(id);
      renderVocabPage();
    }

    // ---------- (B) Điền nghĩa hàng loạt bằng AI (copy prompt / dán câu trả lời) ----------
    // Mục cần AI điền: chưa có nghĩa riêng, hoặc (từ/cụm) chưa có ví dụ
    function vocabItemsMissingMeaning() {
      return getVocab().filter((x) => !x.wordVi || !String(x.wordVi).trim()
        || (!x.vi || !String(x.vi).trim())
        || (x.kind !== 'sentence' && !(Array.isArray(x.examples) && x.examples.length)));
    }
    const VOCAB_AI_BATCH = 30;   // mỗi lượt tối đa 30 mục để AI không bị cắt giữa chừng

    function parseCefrLevel(str) {
      if (!str) return '';
      const m = String(str).trim().match(/^(A1|A2\+?|B1|B2|C1|C2)$/i);
      return m ? m[1].toUpperCase() : '';
    }

    // ---- Đọc câu trả lời của AI (dùng chung cho "Điền nghĩa" và "Từ vựng khó") ----
    // Rất dễ tính: bỏ markdown (**, `, >, gạch đầu dòng), chấp nhận "VD1:", "Ví dụ 1:", "Example 1:",
    // ngăn cách câu Anh / Việt bằng "||" (hoặc " | ", "→"). Dòng nào không hiểu thì bỏ qua chứ không báo lỗi cả bài.
    function aiParseVocabAnswer(raw) {
      const out = [];
      let cur = null;
      const unq = (t) => { t = String(t || '').trim(); return (t.length > 2 && /^[“"‘'«]/.test(t) && /[”"’'»]$/.test(t)) ? t.slice(1, -1).trim() : t; };
      // Chuẩn hoá trước khi đọc: (1) bỏ dấu \ do markdown escape ("1\." -> "1.");
      // (2) nếu AI/trình duyệt làm mất xuống dòng (cả mục dính thành 1 đoạn) thì tách lại trước "VD1:", "Trong bài:" và "N. từ || loại ||".
      const KINDS = 'từ|phrasal verb|idiom|slang|cụm từ';
      const norm = String(raw || '')
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/\\([\\.\)\(\-*_`#>\[\]!:|])/g, '$1')
        .replace(/[ \t\u00a0]+(?=(?:VD|V\.D|Ví dụ|Vi du|Example|Ex)\s*\d+\s*[:：.)\-–])/gi, '\n')
        .replace(/[ \t\u00a0]+(?=(?:Trong bài|Trong văn bản|In the text)\s*[:：])/gi, '\n')
        .replace(new RegExp('[ \\t\\u00a0]+(?=\\d{1,3}\\s*[\\.\\)]\\s*[^|\\n]{1,80}\\|\\|\\s*(?:' + KINDS + ')\\s*\\|\\|)', 'gi'), '\n');
      norm.split(/\r?\n/).forEach((line0) => {
        const line = line0.replace(/\*\*|__|`/g, '').replace(/^[\s>]*(?:[-*•–]\s+)?/, '').trim();
        if (!line) return;
        const ex = /^(?:VD|V\.D|Ví dụ|Vi du|Example|Ex)\s*(?:\d+\s*)?[:：.)\-–]\s*(.+)$/i.exec(line);
        if (ex) {
          if (!cur) return;
          const body = ex[1];
          let en = body, vi = '';
          const k = body.indexOf('||');
          if (k >= 0) { en = body.slice(0, k); vi = body.slice(k + 2).replace(/^\s*\|\s*/, ''); }
          else {
            const mm = /\s+\|\s+|\s+(?:→|=>|⇒)\s+/.exec(body);
            if (mm) { en = body.slice(0, mm.index); vi = body.slice(mm.index + mm[0].length); }
          }
          en = unq(en); vi = unq(vi);
          if (en) cur.examples.push({ en: en, vi: vi });
          return;
        }
        const it = /^(?:Trong bài|Trong văn bản|In the text|In text|Source)\s*[:：]\s*(.+)$/i.exec(line);
        if (it) { if (cur) cur.inText = unq(it[1]); return; }
        const trSent = /^(?:Dịch câu|Dich cau|Dịch ngữ cảnh|Dich ngu canh|Bản dịch câu|Bản dịch|Sentence translation)\s*[:：]\s*(.+)$/i.exec(line);
        if (trSent) { if (cur) cur.sentVi = unq(trSent[1]); return; }
        const h = /^(\d+)\s*[\.\):]\s*(.*)$/.exec(line);
        if (h) {
          const rest = h[2].trim().replace(/^(?:Nghĩa|Nghia|Meaning)\s*[:：]\s*/i, '');
          const parts = rest.split(/\s*\|\|\s*/);
          cur = { n: +h[1], term: '', kind: '', level: '', meaning: '', inText: '', examples: [] };
          if (parts.length >= 4) {
            cur.term = unq(parts[0]);
            cur.kind = parts[1].trim();
            cur.level = parseCefrLevel(parts[2]);
            if (!cur.level && parseCefrLevel(parts[1])) {
              cur.level = parseCefrLevel(parts[1]);
              cur.kind = parts[2].trim();
            }
            cur.meaning = parts.slice(3).join(' ').trim();
          } else if (parts.length === 3) {
            cur.term = unq(parts[0]);
            const lvl1 = parseCefrLevel(parts[1]);
            const lvl2 = parseCefrLevel(parts[2]);
            if (lvl1) {
              cur.level = lvl1;
              cur.meaning = parts.slice(2).join(' ').trim();
            } else if (lvl2) {
              cur.kind = parts[1].trim();
              cur.level = lvl2;
              cur.meaning = parts.slice(2).join(' ').trim();
            } else {
              cur.kind = parts[1].trim();
              cur.meaning = parts.slice(2).join(' ').trim();
            }
          } else if (parts.length === 2) {
            cur.term = unq(parts[0]);
            cur.meaning = parts[1].trim();
          } else {
            cur.meaning = rest;
          }
          if (!cur.level && cur.meaning) {
            const ml = /\[(A1|A2\+?|B1|B2|C1|C2)\]/i.exec(cur.meaning);
            if (ml) {
              cur.level = ml[1].toUpperCase();
              cur.meaning = cur.meaning.replace(ml[0], '').trim();
            }
          }
          out.push(cur);
          return;
        }
        const mn = /^(?:Nghĩa|Nghia|Meaning)\s*[:：]\s*(.+)$/i.exec(line);
        if (mn && cur && !cur.meaning) cur.meaning = mn[1].trim();
      });
      return out.filter((e) => e.meaning || e.examples.length);
    }

    // Câu đứng ngay trước câu chứa từ. Mục lưu mới đã có sẵn (x.prev); mục cũ thì dò lại trong lịch sử của video/bài (sách cũ thì bỏ qua).
    function vocabPrevSentence(x) {
      if (typeof x.prev === 'string') return x.prev;
      try {
        if (x.bookId) return '';
        const h = getLocalHistory().find((v) => v.videoId === x.videoId);
        const ss = h && h.sentences;
        if (!ss || !ss.length) return '';
        const head = String(x.en || '').trim().slice(0, 40).toLowerCase();
        if (!head) return '';
        const i = ss.findIndex((q) => String(q.text || '').trim().toLowerCase().indexOf(head) === 0 || head.indexOf(String(q.text || '').trim().toLowerCase().slice(0, 40)) === 0 && String(q.text || '').trim().length > 3);
        return i > 0 ? String(ss[i - 1].text || '').trim() : '';
      } catch (e) { return ''; }
    }

    function buildVocabMeaningPrompt(ids) {
      const all = getVocab();
      const items = ids.map((id) => all.find((x) => x.id === id)).filter(Boolean);
      const KIND_VI = { word: 'từ', phrase: 'cụm từ', sentence: 'CẢ CÂU' };
      const lines = items.map((x, i) => {
        const prev = vocabPrevSentence(x);
        return `${i + 1}. "${x.text}" (${KIND_VI[x.kind] || 'từ'}) — ngữ cảnh: "${prev ? prev + ' ' : ''}${x.en}"`;
      });
      return 'Tôi đang học tiếng Pháp. Với TỪNG mục trong danh sách bên dưới (kèm ngữ cảnh gồm câu đứng trước và câu chứa nó, nơi tôi gặp nó), hãy cho tôi:\n'
        + '(1) Ghi chú loại từ / thì được chia viết tắt trong ngoặc vuông [] kèm nghĩa tiếng Việt ngắn gọn, đúng ngữ cảnh (không dịch cả câu).\n'
        + '    Quy ước viết tắt chuẩn (Larousse/Bescherelle):\n'
        + '    - Động từ nguyên mẫu: [v. inf.] nghĩa\n'
        + '    - Động từ đã chia: [v. <từ_gốc> · <thì> <ngôi>] nghĩa (viết tắt thì: prés., imp., fut., p.c., cond., subj., p.p., p.pr.; ngôi: 1s, 2s, 3s, 1p, 2p, 3p. Ví dụ: [v. aller · fut. 1p] chúng tôi sẽ đi)\n'
        + '    - Danh từ: [n.m.] (giống đực), [n.f.] (giống cái), [n.pl.] nghĩa\n'
        + '    - Tính từ: [adj.] nghĩa | Trạng từ: [adv.] nghĩa | Thành ngữ, cụm: [loc.] nghĩa\n'
        + '(2) Bản dịch tiếng Việt tự nhiên, chuẩn xác của câu chứa từ (câu trong phần ngữ cảnh).\n'
        + '(3) Đúng 3 câu ví dụ thực tế BẰNG TIẾNG PHÁP (French) mà người bản xứ hay dùng, đơn giản, không học thuật, không dùng từ quá cao siêu. Mỗi ví dụ dùng đúng nghĩa ở mục (1) và có bản dịch tiếng Việt.\n'
        + '    QUAN TRỌNG: Các câu ví dụ BẮT BUỘC PHẢI VIẾT BẰNG TIẾNG PHÁP. Tuyệt đối KHÔNG viết câu ví dụ bằng tiếng Anh!\n'
        + 'Riêng mục nào ghi (CẢ CÂU) thì chỉ dịch cả câu sang tiếng Việt, không cần ví dụ và không cần tag.\n\n'
        + 'QUAN TRỌNG: đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy (không in đậm, không bảng, không lời dẫn hay giải thích ngoài codebox). '
        + 'Mỗi mục theo đúng mẫu sau, bắt đầu bằng đúng số thứ tự của mục, các mục cách nhau 1 dòng trống. Dùng đúng dấu || giữa câu tiếng Pháp và bản dịch:\n\n'
        + '1. Nghĩa: [tag viết tắt] nghĩa tiếng Việt\n'
        + 'Dịch câu: bản dịch tiếng Việt của câu chứa từ\n'
        + 'VD1: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD2: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD3: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n\n'
        + 'Danh sách từ/cụm từ tiếng Pháp:\n' + lines.join('\n');
    }

    function updateVocabMissingBadge() {
      const badge = document.getElementById('vocab-missing-badge');
      if (!badge) return;
      const n = vocabItemsMissingMeaning().length;
      badge.textContent = n;
      badge.style.display = n ? '' : 'none';
    }

    function openVocabMeaningModal(specificId) {
      resetCopyButtons();
      const modal = document.getElementById('vocab-meaning-modal');
      if (!modal) return;
      vocabAiHintDone();
      const all = getVocab();
      const missing = vocabItemsMissingMeaning();
      
      if (specificId) {
        const target = all.find(x => x.id === specificId);
        const others = missing.filter(x => x.id !== specificId);
        vocabMeaningBatchIds = target ? [target.id, ...others.slice(0, VOCAB_AI_BATCH - 1).map(x => x.id)] : missing.slice(0, VOCAB_AI_BATCH).map(x => x.id);
      } else if (missing.length) {
        vocabMeaningBatchIds = missing.slice(0, VOCAB_AI_BATCH).map((x) => x.id);
      } else {
        vocabMeaningBatchIds = all.slice(0, VOCAB_AI_BATCH).map((x) => x.id);
      }

      const desc = document.getElementById('vm-desc');
      const copyBtn = document.getElementById('vm-copy-btn');
      if (all.length === 0) {
        desc.textContent = 'Sổ từ vựng đang trống. Hãy lưu từ vựng từ video hoặc sách trước khi sử dụng tính năng điền nghĩa bằng AI.';
        if (copyBtn) {
          copyBtn.disabled = true;
          copyBtn.style.opacity = '0.5';
        }
      } else if (missing.length > 0) {
        desc.textContent = `Có ${missing.length} mục chưa có nghĩa riêng hoặc chưa có 3 ví dụ`
          + (missing.length > VOCAB_AI_BATCH ? ` (lượt này gồm ${VOCAB_AI_BATCH} mục đầu, làm xong thì mở lại để làm tiếp)` : '')
          + '. Bấm "Copy prompt", dán cho AI (ChatGPT/Claude...), rồi dán nguyên câu trả lời của AI vào ô bên dưới và bấm "Áp dụng".';
        if (copyBtn) {
          copyBtn.disabled = false;
          copyBtn.style.opacity = '';
        }
      } else {
        desc.textContent = `Tất cả ${all.length} từ vựng đã có nghĩa riêng. Bạn vẫn có thể bấm "Copy prompt" bên dưới để tạo lại prompt cho ${vocabMeaningBatchIds.length} từ (để AI cập nhật thêm ký hiệu ngữ pháp [v. ...] hoặc tạo ví dụ mới).`;
        if (copyBtn) {
          copyBtn.disabled = false;
          copyBtn.style.opacity = '';
        }
      }
      document.getElementById('vm-textarea').value = '';
      aiSetStatus(document.getElementById('vm-status'), '', '');
      modal.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function closeVocabMeaningModal() {
      const modal = document.getElementById('vocab-meaning-modal');
      if (modal) modal.classList.remove('open');
    }

    function openManualPromptModal(text) {
      let modal = document.getElementById('manual-prompt-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'manual-prompt-modal';
        modal.className = 'ai-modal-backdrop';
        modal.innerHTML = `
          <div class="ai-modal" style="max-width:580px;position:relative;z-index:9999" role="dialog" aria-modal="true">
            <div class="ai-modal-head">
              <div class="ai-modal-title">📋 Sao chép Prompt dành cho AI</div>
              <button type="button" class="ai-modal-close" onclick="document.getElementById('manual-prompt-modal').classList.remove('open')">✕</button>
            </div>
            <p class="ai-step-text" style="color:#fde68a;margin-top:4px">Trình duyệt hạn chế tự động copy vào bộ nhớ. Bạn hãy bấm nút bên dưới hoặc nhấn Ctrl+C (⌘+C trên Mac) để copy prompt:</p>
            <textarea id="manual-prompt-text" class="ai-textarea" style="height:220px;font-size:13px;line-height:1.5" readonly></textarea>
            <div class="ai-actions" style="margin-top:12px;display:flex;gap:10px">
              <button type="button" class="ai-btn ai-btn-primary" onclick="const ta=document.getElementById('manual-prompt-text');ta.focus();ta.select();try{document.execCommand('copy');showVocabToast('Đã copy prompt thành công!', true);}catch(e){}">
                <i data-lucide="copy"></i><span>Chọn tất cả &amp; Sao chép</span>
              </button>
              <button type="button" class="ai-btn ai-btn-ghost" onclick="document.getElementById('manual-prompt-modal').classList.remove('open')">Đóng</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }
      const ta = document.getElementById('manual-prompt-text');
      if (ta) {
        ta.value = text;
        setTimeout(() => { ta.focus(); ta.select(); }, 150);
      }
      modal.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    function copyVocabMeaningPrompt(btn) {
      if (!vocabMeaningBatchIds.length) {
        const all = getVocab();
        if (all.length > 0) {
          vocabMeaningBatchIds = all.slice(0, VOCAB_AI_BATCH).map((x) => x.id);
        } else {
          showVocabToast('Chưa có từ vựng nào để tạo prompt.', false);
          return;
        }
      }
      const text = buildVocabMeaningPrompt(vocabMeaningBatchIds);
      copyTextToClipboard(text).then(() => {
        flashCopied(btn, 1800);
        showVocabToast('✓ Đã copy prompt điền nghĩa AI vào bộ nhớ tạm!', true);
      }).catch((err) => {
        console.warn('Lỗi copy prompt:', err);
        openManualPromptModal(text);
      });
    }

    function applyVocabMeaningAnswer() {
      const statusEl = document.getElementById('vm-status');
      const raw = (document.getElementById('vm-textarea').value || '').trim();
      if (!vocabMeaningBatchIds.length) { aiSetStatus(statusEl, 'err', 'Không có mục nào để áp dụng. Hãy đóng lại và mở lại cửa sổ này.'); return; }
      if (!raw) { aiSetStatus(statusEl, 'err', 'Bạn chưa dán câu trả lời của AI vào ô bên trên.'); return; }

      const entries = aiParseVocabAnswer(raw);
      const byNum = {};
      let seq = 0;
      entries.forEach((e) => { if (e.n && !byNum[e.n]) byNum[e.n] = e; });
      const all = getVocab();
      let applied = 0, withEx = 0;
      vocabMeaningBatchIds.forEach((id, idx) => {
        const e = byNum[idx + 1] || (Object.keys(byNum).length ? null : entries[seq++]);
        if (!e) return;
        const item = all.find((x) => x.id === id);
        if (!item) return;
        let changed = false;
        if (e.meaning && (!item.wordVi || !String(item.wordVi).trim())) { item.wordVi = e.meaning; changed = true; }
        if (e.sentVi && (!item.vi || !String(item.vi).trim())) { item.vi = e.sentVi; changed = true; }
        if (e.examples.length && item.kind !== 'sentence') { item.examples = e.examples.slice(0, 3); withEx++; changed = true; }
        if (changed) applied++;
      });

      if (!applied) {
        aiSetStatus(statusEl, 'err', 'Không nhận ra được mục nào khớp định dạng. Mỗi mục cần có dòng "1. Nghĩa: ..." và các dòng "VD1: câu tiếng Pháp || bản dịch". Kiểm tra lại câu trả lời của AI rồi dán lại.');
        return;
      }

      setVocab(all);
      const total = vocabMeaningBatchIds.length;
      let html = `✓ Đã cập nhật <strong>${applied}/${total}</strong> mục (có ví dụ: ${withEx}).`;
      if (applied < total) html += '<br>Còn thiếu một số mục (AI có thể trả lời thiếu hoặc sai định dạng). Mở lại cửa sổ này để tiếp tục với các mục còn lại.';
      aiSetStatus(statusEl, applied < total ? 'warn' : 'ok', html);
      renderVocabPage();
      updateVocabBadges();
    }

    // ==================== TỪ VỰNG KHÓ TRONG BÀI (AI tổng hợp) ====================
    // Quy trình: copy prompt (kèm cả bài) -> AI trả lời đúng mẫu -> dán lại -> app hiện danh sách + nút "Lưu từ vựng".
    // Kết quả được nhớ theo từng video/bài để mở lại không phải dán lần nữa.
    const KV_KEY = 'shadowing_keyvocab_v1';
    const KV_LABEL = { 'từ': 'Từ', 'phrasal verb': 'Phrasal verb', 'idiom': 'Idiom', 'slang': 'Slang', 'cụm từ': 'Cụm từ' };
    function kvLoadAll() { try { const d = JSON.parse(localStorage.getItem(KV_KEY) || '{}'); return (d && typeof d === 'object') ? d : {}; } catch (e) { return {}; } }
    function kvGet() { const a = kvLoadAll()[currentVideoId]; return a && Array.isArray(a.items) ? a.items : []; }
    function kvSet(items) {
      const all = kvLoadAll();
      if (items.length) all[currentVideoId] = { ts: Date.now(), items: items }; else delete all[currentVideoId];
      const keys = Object.keys(all);
      if (keys.length > 80) keys.sort((a, b) => (all[a].ts || 0) - (all[b].ts || 0)).slice(0, keys.length - 80).forEach((k) => { delete all[k]; });
      try { localStorage.setItem(KV_KEY, JSON.stringify(all)); return true; } catch (e) { return false; }
    }
    function kvNormKind(k, term) {
      const t = String(k || '').toLowerCase();
      if (/phrasal/.test(t)) return 'phrasal verb';
      if (/idiom|thành ngữ/.test(t)) return 'idiom';
      if (/slang|lóng/.test(t)) return 'slang';
      if (/cụm|phrase|collocation/.test(t)) return 'cụm từ';
      if (/từ|word|noun|verb|adj/.test(t)) return 'từ';
      return /\s/.test(term || '') ? 'cụm từ' : 'từ';
    }

    const KV_LEVELS_KEY = 'shadowing_keyvocab_levels_v1';
    const KV_ALL_LEVELS = ['A1', 'A2', 'A2+', 'B1', 'B2', 'C1', 'C2'];
    const KV_DEFAULT_LEVELS = ['B1', 'B2', 'C1'];

    function kvGetLevels() {
      try {
        const raw = localStorage.getItem(KV_LEVELS_KEY);
        if (raw === null) return [...KV_DEFAULT_LEVELS];
        const d = JSON.parse(raw);
        return Array.isArray(d) ? d : [...KV_DEFAULT_LEVELS];
      } catch (e) { return [...KV_DEFAULT_LEVELS]; }
    }
    function kvSetLevels(levels) {
      try { localStorage.setItem(KV_LEVELS_KEY, JSON.stringify(levels)); } catch (e) {}
    }
    function kvToggleLevel(lvl) {
      let cur = kvGetLevels();
      const idx = cur.indexOf(lvl);
      if (idx >= 0) cur.splice(idx, 1);
      else cur.push(lvl);
      cur = KV_ALL_LEVELS.filter((l) => cur.includes(l));
      kvSetLevels(cur);
      kvRenderLevels();
    }
    function kvRenderLevels() {
      const cur = kvGetLevels();
      document.querySelectorAll('#kv-level-box .kv-level-chip').forEach((btn) => {
        const lvl = btn.getAttribute('data-level');
        btn.classList.toggle('active', cur.includes(lvl));
      });
    }

    function buildKeyVocabPrompt() {
      const activeLevels = kvGetLevels();
      const levels = activeLevels.length ? activeLevels : KV_DEFAULT_LEVELS;

      const guideMap = {
        'A1': '- [A1]: Trích xuất CẢ các từ vựng căn bản, đồ vật và động từ quen thuộc trong bài mà người mới bắt đầu cần cho giao tiếp (bỏ qua đại từ nhân xưng quá vỡ lòng je/tu/il).\n',
        'A2': '- [A2]: Trích xuất CẢ các từ vựng sơ cấp, cụm từ miêu tả sinh hoạt, thói quen, cảm xúc thường nhật trong giao tiếp.\n',
        'A2+': '- [A2+]: Trích xuất CẢ các từ nối câu (connecteurs), liên từ và cách diễn đạt thông dụng tiền trung cấp.\n',
        'B1': '- [B1]: Trích xuất các từ vựng, cụm từ giúp thảo luận, diễn đạt ý kiến và giao tiếp tự tin ở mức trung cấp.\n',
        'B2': '- [B2]: Trích xuất các từ vựng diễn đạt sắc thái ngữ nghĩa tinh tế, thành ngữ trung cao cấp nâng cao khả năng giao tiếp tự nhiên.\n',
        'C1': '- [C1]: Trích xuất các từ vựng phong phú, cấu trúc diễn đạt cao cấp, sắc bén của người giao tiếp lưu loát.\n',
        'C2': '- [C2]: Trích xuất các từ vựng điêu luyện, tinh tế tương đương người bản xứ, từ vựng và sắc thái biểu cảm sâu sắc.\n'
      };

      const levelDetail = levels.map((lvl) => guideMap[lvl] || '').join('');

      return 'Tôi đang học tiếng Pháp. Mục tiêu xuyên suốt là trích xuất các từ vựng, cụm từ / locutions, thành ngữ (idioms), tiếng lóng (argot / slang) THỰC SỰ HỮU ÍCH CHO GIAO TIẾP THỰC TẾ xuất hiện trong văn bản tiếng Pháp bên dưới (bỏ qua từ vô nghĩa, từ quá tầm thường không mang giá trị giao tiếp và tên riêng).\n\n'
        + `Định hướng theo các trình độ người học đã kích hoạt: [${levels.join(', ')}].\n`
        + (levelDetail ? `Cụ thể yêu cầu với từng trình độ:\n${levelDetail}\n` : '')
        + 'Với từng mục, cho tôi ghi chú ngữ pháp viết tắt trong ngoặc vuông [] kèm nghĩa tiếng Việt (đúng với nghĩa được dùng trong văn bản) và đúng 3 câu ví dụ thực tế BẰNG TIẾNG PHÁP mà người bản xứ hay dùng, đơn giản, không học thuật, không dùng từ quá cao siêu; mỗi ví dụ kèm bản dịch tiếng Việt.\n\n'
        + 'QUAN TRỌNG VỀ NGÔN NGỮ CÂU VÍ DỤ (BẮT BUỘC TUÂN THỦ):\n'
        + '- Toàn bộ các câu ví dụ (VD1, VD2, VD3) BẮT BUỘC PHẢI ĐƯỢC VIẾT BẰNG TIẾNG PHÁP (French). Tuyệt đối KHÔNG ĐƯỢC viết câu ví dụ bằng tiếng Anh!\n'
        + '- Sau dấu "||" là bản dịch của câu ví dụ đó sang TIẾNG VIỆT.\n\n'
        + 'Quy ước viết tắt ngữ pháp chuẩn (Larousse/Bescherelle):\n'
        + '- Động từ nguyên mẫu: [v. inf.] | Động từ chia: [v. <từ_gốc> · <thì> <ngôi>] (thì: prés., imp., fut., p.c., cond., subj., p.p.; ngôi: 1s, 2s, 3s, 1p, 2p, 3p. VD: [v. savoir · subj. 2s])\n'
        + '- Danh từ: [n.m.] hoặc [n.f.] | Tính từ: [adj.] | Trạng từ: [adv.] | Thành ngữ/cụm: [loc.]\n\n'
        + 'QUAN TRỌNG: đặt toàn bộ kết quả trong MỘT khối code (codebox ```) để người dùng mobile dễ bấm nút copy (không in đậm, không bảng, không lời dẫn hay giải thích ngoài codebox). '
        + 'Mỗi mục theo đúng mẫu 5 dòng sau, các mục cách nhau 1 dòng trống, đánh số từ 1. Dùng đúng dấu || để ngăn cách, và không dùng || ở chỗ nào khác:\n\n'
        + '1. TỪ hoặc CỤM TỪ tiếng Pháp (dạng xuất hiện trong bài hoặc nguyên mẫu) || LOẠI || CẤP_ĐỘ || [tag viết tắt] nghĩa tiếng Việt\n'
        + 'Trong bài: đúng cụm chữ tiếng Pháp như nó xuất hiện trong văn bản\n'
        + 'VD1: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD2: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n'
        + 'VD3: câu ví dụ bằng TIẾNG PHÁP || bản dịch tiếng Việt\n\n'
        + 'LOẠI chỉ được là một trong: từ, idiom, slang, cụm từ.\n'
        + 'CẤP_ĐỘ chỉ được là một trong các cấp độ CEFR: A1, A2, A2+, B1, B2, C1, C2.\n\n'
        + 'Ví dụ mẫu (chỉ để minh hoạ định dạng chuẩn bằng tiếng Pháp, KHÔNG đưa vào kết quả):\n'
        + '1. a abandonné || từ || B1 || [v. abandonner · p.c. 3s] đã từ bỏ, đã bỏ cuộc\n'
        + 'Trong bài: a abandonné\n'
        + 'VD1: N\'abandonne pas, tu y es presque ! || Đừng bỏ cuộc, bạn gần tới rồi!\n'
        + 'VD2: J\'ai abandonné le tabac l\'année dernière. || Năm ngoái tôi đã bỏ thuốc lá.\n'
        + 'VD3: Elle n\'abandonne jamais ses rêves. || Cô ấy không bao giờ từ bỏ ước mơ.\n\n'
        + 'Văn bản tiếng Pháp:\n<<<\n' + aicPlainTranscript(sentences) + '\n>>>';
    }
    function copyKeyVocabPrompt(btn) {
      if (!sentences.length) {
        showVocabToast('Chưa có nội dung để tạo prompt.', false);
        return;
      }
      const text = buildKeyVocabPrompt();
      copyTextToClipboard(text).then(() => {
        flashCopied(btn, 1800);
        showVocabToast('✓ Đã copy prompt từ vựng khó vào bộ nhớ tạm!', true);
      }).catch((err) => {
        console.warn('Lỗi copy prompt:', err);
        openManualPromptModal(text);
      });
    }

    function kvShowView(view) {
      const inp = document.getElementById('kv-input-view'), lst = document.getElementById('kv-list-view');
      if (!inp || !lst) return;
      inp.style.display = view === 'input' ? '' : 'none';
      lst.style.display = view === 'list' ? '' : 'none';
      document.getElementById('kv-title').textContent = view === 'list' ? 'Từ vựng khó trong bài' : 'Tổng hợp từ vựng khó bằng AI';
      const back = document.getElementById('kv-back-btn');
      if (back) back.classList.toggle('ai-hide', !kvGet().length);
      if (view === 'list') kvRenderList();
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function openKeyVocabModal() {
      if (!sentences.length) { alert('Chưa có nội dung để tổng hợp.'); return; }
      resetCopyButtons();
      document.getElementById('kv-textarea').value = '';
      aiSetStatus(document.getElementById('kv-status'), '', '');
      document.getElementById('keyvocab-modal').classList.add('open');
      kvRenderLevels();
      kvShowView(kvGet().length ? 'list' : 'input');
    }
    function closeKeyVocabModal() {
      const m = document.getElementById('keyvocab-modal');
      if (m) m.classList.remove('open');
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeKeyVocabModal(); });

    function applyKeyVocabAnswer() {
      const statusEl = document.getElementById('kv-status');
      const raw = (document.getElementById('kv-textarea').value || '').trim();
      if (!raw) { aiSetStatus(statusEl, 'err', 'Bạn chưa dán câu trả lời của AI vào ô bên trên.'); return; }
      const seen = new Set();
      const items = [];
      aiParseVocabAnswer(raw).forEach((e) => {
        const term = (e.term || '').trim();
        if (!term || !e.meaning) return;
        const k = term.toLowerCase();
        if (seen.has(k)) return;
        seen.add(k);
        items.push({ term: term, kind: kvNormKind(e.kind, term), level: e.level || '', meaning: e.meaning, inText: e.inText || '', examples: e.examples.slice(0, 3) });
      });
      if (!items.length) {
        aiSetStatus(statusEl, 'err', 'Không nhận ra được mục nào. Mỗi mục cần có dòng "1. từ || loại || nghĩa" (có dấu ||) và các dòng "VD1: câu tiếng Pháp || bản dịch". Kiểm tra lại câu trả lời của AI rồi dán lại.');
        return;
      }
      if (!kvSet(items)) { aiSetStatus(statusEl, 'err', 'Không lưu được danh sách: bộ nhớ trình duyệt đã đầy.'); return; }
      document.getElementById('kv-textarea').value = '';
      aiSetStatus(statusEl, '', '');
      kvShowView('list');
    }
    function kvClear() {
      if (!confirm('Xóa danh sách từ vựng khó của bài này? (Những từ bạn đã lưu vào "Từ vựng đã lưu" vẫn được giữ.)')) return;
      kvSet([]);
      kvShowView('input');
    }

    // Tìm câu trong bài chứa từ này (ưu tiên đúng cụm chữ AI chép lại từ bài), để lấy ngữ cảnh + vị trí tô sáng
    function kvFindContext(it) {
      const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const cands = [it.inText, it.term].filter((x) => x && x.length >= 2);
      for (let c = 0; c < cands.length; c++) {
        const low = cands[c].toLowerCase();
        for (let i = 0; i < sentences.length; i++) {
          const tx = String(sentences[i].text || '');
          const idx = tx.toLowerCase().indexOf(low);
          if (idx >= 0 && (idx === 0 || !/\p{L}/u.test(tx[idx - 1]))) return { s: sentences[i], hs: idx, he: idx + cands[c].length };
        }
      }
      const base = String(it.term || '').toLowerCase().split(/\s+/)[0].replace(/(e|y)$/, '');
      if (base.length >= 3) {
        const re = new RegExp('(^|[^\\p{L}])(' + escRe(base) + "[\\p{L}']*)", 'iu');
        for (let i = 0; i < sentences.length; i++) {
          const tx = String(sentences[i].text || '');
          const m = re.exec(tx);
          if (m) { const hs = m.index + m[1].length; return { s: sentences[i], hs: hs, he: hs + m[2].length }; }
        }
      }
      return null;
    }
    function kvIsSaved(it) {
      const k = String(it.term || '').trim().toLowerCase();
      return getVocab().some((x) => {
        if (String(x.text || '').trim().toLowerCase() !== k) return false;
        if (x.videoId === currentVideoId) return true;
        if (Array.isArray(x.contexts) && x.contexts.some((c) => c.videoId === currentVideoId)) return true;
        return false;
      });
    }

    function kvRenderList() {
      const items = kvGet();
      const box = document.getElementById('kv-list');
      document.getElementById('kv-count').textContent = `${items.length} từ/cụm khó`;
      box.innerHTML = items.map((it, i) => {
        const ctx = kvFindContext(it);
        let ctxHtml = '';
        if (ctx) {
          const en = String(ctx.s.text || '');
          ctxHtml = `<p class="vocab-ctx">${escHtml(en.slice(0, ctx.hs))}<mark class="vocab-hl">${escHtml(en.slice(ctx.hs, ctx.he))}</mark>${escHtml(en.slice(ctx.he))}</p>`
            + (ctx.s.vi ? `<p class="vocab-vi">Cả câu: ${escHtml(ctx.s.vi)}</p>` : '');
        }
        const exHtml = it.examples.map((e) => `<div><p class="vocab-ex-en">${hlExample(String(e.en), it.term)}</p>${e.vi ? `<p class="vocab-ex-vi">${escHtml(e.vi)}</p>` : ''}</div>`).join('');
        const saved = kvIsSaved(it);
        const lvlBadge = it.level ? `<span class="vocab-level-badge level-${escHtml(it.level.toLowerCase().replace('+', 'plus'))}">${escHtml(it.level)}</span>` : '';
        return `<article class="vocab-card" data-kv-i="${i}">
          <div class="vocab-card-head">
            <div><span class="vocab-kind vocab-kind-${it.kind === 'từ' ? 'word' : 'phrase'}">${escHtml(KV_LABEL[it.kind] || '')}</span>${lvlBadge}<h3 class="vocab-word">${escHtml(it.term)}</h3></div>
            <div class="vocab-card-tools"><button type="button" class="vocab-mini del" title="Xóa từ này khỏi danh sách" onclick="kvRemove(${i})">Xóa</button><button type="button" class="kv-save-btn${saved ? ' saved' : ''}" ${saved ? 'disabled' : ''} onclick="kvSave(${i})">${saved ? '✓ Đã lưu' : 'Lưu từ vựng'}</button></div>
          </div>
          ${ctxHtml}
          <p class="vocab-wordvi" style="margin-top:8px">${formatGrammarBadgeHtml(escHtml(it.meaning))}</p>
          ${exHtml ? `<div class="vocab-examples" style="margin-left:0">${exHtml}</div>` : ''}
        </article>`;
      }).join('');
      const allBtn = document.getElementById('kv-save-all-btn');
      if (allBtn) {
        const allSaved = items.length > 0 && items.every((it) => kvIsSaved(it));
        allBtn.disabled = allSaved;
        allBtn.classList.toggle('saved', allSaved);
        allBtn.textContent = allSaved ? '✓ Đã lưu tất cả' : 'Lưu tất cả';
      }
    }

    // Xóa 1 từ khỏi danh sách tạm (không đụng tới "Từ vựng đã lưu")
    function kvRemove(i) {
      const items = kvGet().slice();
      if (i < 0 || i >= items.length) return;
      items.splice(i, 1);
      kvSet(items);
      if (!items.length) { kvShowView('input'); return; }
      kvRenderList();
    }

    // Thêm 1 mục từ khó vào mảng từ vựng đã lưu `list` (chưa ghi xuống bộ nhớ). Trả về true nếu là mục mới.
    function kvStoreItem(list, it) {
      const text = it.term.trim();
      const n = text.split(/\s+/).length;
      const ctx = kvFindContext(it);
      let en, hs, he, vi = '', t = 0, prev = '';
      if (ctx) {
        en = String(ctx.s.text || ''); hs = ctx.hs; he = ctx.he; vi = (ctx.s.vi || '').trim(); t = ctx.s.startTime || 0;
        const si = sentences.indexOf(ctx.s);
        if (si > 0) prev = String(sentences[si - 1].text || '').trim();
      }
      else { en = text; hs = 0; he = text.length; }
      
      const normText = text.toLowerCase();
      const dup = list.find((x) => String(x.text || '').trim().toLowerCase() === normText);
      if (dup) {
        if (!dup.wordVi) dup.wordVi = it.meaning;
        if (!dup.level && it.level) dup.level = it.level;
        if (!(dup.examples && dup.examples.length)) dup.examples = it.examples;
        if (!dup.tag) dup.tag = KV_LABEL[it.kind];
        // Nếu khác video/ngữ cảnh -> lưu vào contexts
        if (dup.videoId !== currentVideoId) {
          if (!Array.isArray(dup.contexts)) dup.contexts = [];
          const hasCtx = dup.contexts.some((c) => c.videoId === currentVideoId);
          if (!hasCtx) {
            dup.contexts.push({
              videoId: currentVideoId,
              videoTitle: currentVideoTitle || '',
              en: en, hs: hs, he: he, vi: vi, prev: prev, t: t, createdAt: Date.now()
            });
          }
        }
        return false;
      }
      list.unshift({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'), tag: KV_LABEL[it.kind],
        level: it.level || '',
        en: en, hs: hs, he: he, vi: vi, prev: prev, wordVi: it.meaning, examples: it.examples,
        videoId: currentVideoId, videoTitle: currentVideoTitle || '', t: t, createdAt: Date.now()
      });
      return true;
    }

    function kvSave(i) {
      const it = kvGet()[i];
      if (!it) return;
      const text = it.term.trim();
      const list = getVocab();
      kvStoreItem(list, it);
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      updateVocabBadges();
      showVocabToast(`Đã lưu “${text.length > 40 ? text.slice(0, 40) + '…' : text}”`, false);
      kvRenderList();
    }

    // Lưu tất cả các từ còn lại trong danh sách (đã xóa bớt từ không cần thì chỉ lưu phần còn lại)
    function kvSaveAll() {
      const items = kvGet();
      if (!items.length) return;
      const list = getVocab();
      let added = 0;
      // duyệt ngược để từ đầu danh sách nằm trên cùng trong \"Từ vựng đã lưu\"
      items.slice().reverse().forEach((it) => { if (kvStoreItem(list, it)) added++; });
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return; }
      updateVocabBadges();
      showVocabToast(added ? `Đã lưu ${added} từ vựng` : 'Tất cả từ đã được lưu trước đó', false);
      kvRenderList();
      if (window.activeRightPanelTab === 'keyvocab' && window.renderRightPanelKeyVocab) {
        window.renderRightPanelKeyVocab();
      }
    }

    // ==================== BỐ CỤC CỘT PHẢI: TỪ KHÓ & CHÚ GIẢI KÝ HIỆU (MODULE L3) ====================
    window.activeRightPanelTab = 'sentences';
    window.rightPanelKvFilter = 'all';

    window.switchRightPanelTab = function (tab) {
      window.activeRightPanelTab = tab;
      const btnSentences = document.getElementById('tab-sub-sentences');
      const btnKv = document.getElementById('tab-sub-keyvocab');
      const subContainer = document.getElementById('subtitles-scroll-container');
      const searchBar = document.getElementById('sub-search-bar');
      const kvContainer = document.getElementById('keyvocab-panel-container');
      const countEl = document.getElementById('sub-panel-count');

      if (tab === 'keyvocab') {
        if (btnSentences) btnSentences.classList.remove('on');
        if (btnKv) btnKv.classList.add('on');
        if (subContainer) subContainer.style.display = 'none';
        if (searchBar) searchBar.style.display = 'none';
        if (kvContainer) kvContainer.style.display = 'flex';
        renderRightPanelKeyVocab(window.rightPanelKvFilter || 'all');
      } else {
        if (btnSentences) btnSentences.classList.add('on');
        if (btnKv) btnKv.classList.remove('on');
        if (subContainer) subContainer.style.display = '';
        if (searchBar) searchBar.style.display = '';
        if (kvContainer) kvContainer.style.display = 'none';
        if (countEl && sentences && sentences.length) {
          const curIdx = currentSentenceIndex >= 0 ? currentSentenceIndex + 1 : 1;
          countEl.textContent = `Câu ${curIdx}/${sentences.length}`;
        }
      }
    };

    window.toggleSymbolLegend = function (boxId) {
      const box = document.getElementById(boxId || 'panel-symbol-legend');
      if (!box) return;
      const isOpen = box.classList.toggle('open');
      const btn = box.querySelector('.legend-toggle-btn');
      if (btn) btn.textContent = isOpen ? 'Đóng' : 'Xem chú giải';
    };

    window.renderRightPanelKeyVocab = function (filterLevel) {
      if (filterLevel !== undefined) window.rightPanelKvFilter = filterLevel;
      const curFilter = window.rightPanelKvFilter || 'all';
      const container = document.getElementById('keyvocab-panel-container');
      const countEl = document.getElementById('sub-panel-count');
      if (!container) return;

      const rawItems = kvGet();
      const items = curFilter === 'all' ? rawItems : rawItems.filter((x) => x.level === curFilter);

      if (countEl) {
        countEl.textContent = `${items.length} từ`;
      }

      const allLevels = ['all', 'A1', 'A2', 'A2+', 'B1', 'B2', 'C1', 'C2'];
      const chipsHtml = allLevels.map((lvl) => {
        const isActive = lvl === curFilter;
        const count = lvl === 'all' ? rawItems.length : rawItems.filter((x) => x.level === lvl).length;
        return `<button type="button" class="kv-chip ${isActive ? 'active' : ''}" onclick="renderRightPanelKeyVocab('${lvl}')">${lvl === 'all' ? 'Tất cả' : lvl} <span class="kv-chip-num">(${count})</span></button>`;
      }).join('');

      const allSaved = rawItems.length > 0 && rawItems.every((it) => kvIsSaved(it));

      let listHtml = '';
      if (!rawItems.length) {
        listHtml = `
          <div class="kv-panel-empty">
            <div class="kv-empty-icon"><i data-lucide="sparkles"></i></div>
            <h3 class="kv-empty-title">Chưa có danh sách từ khó</h3>
            <p class="kv-empty-desc">Nhờ AI tổng hợp tự động các từ vựng, cụm từ và từ lóng quan trọng kèm 3 ví dụ tiếng Pháp thực tế.</p>
            <button type="button" class="kv-btn-cta" onclick="openKeyVocabModal()">
              <i data-lucide="sparkles"></i><span>Trích xuất từ khó bằng AI</span>
            </button>
          </div>
        `;
      } else if (!items.length) {
        listHtml = `<div class="kv-panel-empty"><p class="kv-empty-desc">Không có từ vựng nào thuộc cấp độ <b>${curFilter}</b>.</p></div>`;
      } else {
        listHtml = items.map((it) => {
          const rawIndex = rawItems.indexOf(it);
          const ctx = kvFindContext(it);
          let ctxHtml = '';
          if (ctx) {
            const en = String(ctx.s.text || '');
            ctxHtml = `<p class="vocab-ctx">${escHtml(en.slice(0, ctx.hs))}<mark class="vocab-hl">${escHtml(en.slice(ctx.hs, ctx.he))}</mark>${escHtml(en.slice(ctx.he))}</p>`;
          }
          const exHtml = (it.examples || []).map((e) => `<div><p class="vocab-ex-en">${hlExample(String(e.en || ''), it.term)}</p>${e.vi ? `<p class="vocab-ex-vi">${escHtml(e.vi)}</p>` : ''}</div>`).join('');
          const saved = kvIsSaved(it);
          const lvlBadge = it.level ? `<span class="vocab-level-badge level-${escHtml(it.level.toLowerCase().replace('+', 'plus'))}">${escHtml(it.level)}</span>` : '';
          return `
            <article class="vocab-card kv-panel-card" data-kv-term="${escHtml(it.term)}">
              <div class="vocab-card-head">
                <div>
                  <span class="vocab-kind vocab-kind-${it.kind === 'từ' ? 'word' : 'phrase'}">${escHtml(KV_LABEL[it.kind] || 'Từ')}</span>
                  ${lvlBadge}
                  <h3 class="vocab-word">${escHtml(it.term)}</h3>
                </div>
                <div class="vocab-card-tools">
                  <button type="button" class="vocab-mini" title="Phát âm từ này" onclick="window.playFrenchAudio && window.playFrenchAudio('${escHtml(it.term).replace(/'/g, "\\'")}')">
                    <i data-lucide="volume-2" class="w-3.5 h-3.5"></i>
                  </button>
                  <button type="button" class="kv-save-btn ${saved ? 'saved' : ''}" ${saved ? 'disabled' : ''} onclick="kvSave(${rawIndex})">
                    ${saved ? '✓ Đã lưu' : 'Lưu'}
                  </button>
                  <button type="button" class="vocab-mini del" title="Xóa từ này" onclick="kvRemove(${rawIndex})">✕</button>
                </div>
              </div>
              ${ctxHtml}
              <p class="vocab-wordvi">${formatGrammarBadgeHtml(escHtml(it.meaning))}</p>
              ${exHtml ? `<div class="vocab-examples">${exHtml}</div>` : ''}
            </article>
          `;
        }).join('');
      }

      container.innerHTML = `
        <div class="kv-panel-toolbar">
          <div class="kv-panel-chips">${chipsHtml}</div>
          <div class="kv-panel-actions">
            <button type="button" class="kv-save-all-btn ${allSaved ? 'saved' : ''}" ${allSaved || !rawItems.length ? 'disabled' : ''} onclick="kvSaveAll()">
              ${allSaved ? '✓ Đã lưu tất cả' : 'Lưu tất cả (' + rawItems.length + ')'}
            </button>
            <button type="button" class="kv-action-ghost" onclick="openKeyVocabModal()">
              <i data-lucide="sparkles"></i><span>Nhờ AI</span>
            </button>
            <button type="button" class="kv-action-ghost" onclick="toggleSymbolLegend('panel-symbol-legend')">
              <i data-lucide="help-circle"></i><span>Chú giải</span>
            </button>
          </div>
        </div>

        <!-- THẺ CHÚ GIẢI KÝ HIỆU (ARTBOARD TRA / HARD) -->
        <div class="symbol-legend-box" id="panel-symbol-legend">
          <div class="legend-hd">
            <h4><i data-lucide="book-open"></i> Chú giải ký hiệu & Mẫu Karaoke</h4>
            <button type="button" class="legend-toggle-btn" onclick="toggleSymbolLegend('panel-symbol-legend')">Đóng</button>
          </div>
          <div class="legend-grid">
            <div class="legend-col">
              <div class="legend-title">BẢNG VIẾT TẮT TỪ LOẠI</div>
              <div class="pos-table">
                <div class="pos-row"><span class="pos">n.m.</span><span>danh từ giống đực</span></div>
                <div class="pos-row"><span class="pos">n.f.</span><span>danh từ giống cái</span></div>
                <div class="pos-row"><span class="pos">v.</span><span>động từ</span></div>
                <div class="pos-row"><span class="pos">adj.</span><span>tính từ</span></div>
                <div class="pos-row"><span class="pos">adv.</span><span>trạng từ</span></div>
                <div class="pos-row"><span class="pos">prép.</span><span>giới từ</span></div>
                <div class="pos-row"><span class="pos">conj.</span><span>liên từ</span></div>
                <div class="pos-row"><span class="pos">pron.</span><span>đại từ</span></div>
              </div>
            </div>
            <div class="legend-col">
              <div class="legend-title">MẪU TRẠNG THÁI KARAOKE</div>
              <div class="karaoke-sample-box">
                <div class="kw-sample">
                  <span class="done">Voici</span>
                  <span class="now">une</span>
                  <span class="next">phrase</span>
                  <span class="next saved">longue</span>
                </div>
                <ul class="karaoke-legend-list">
                  <li><span class="kw-dot done"></span> <b>Đã đọc:</b> Chữ xanh ngọc (accent)</li>
                  <li><span class="kw-dot now"></span> <b>Đang đọc:</b> Nền mint, chữ đậm</li>
                  <li><span class="kw-dot next"></span> <b>Chưa đọc:</b> Chữ xám mờ (muted)</li>
                  <li><span class="kw-dot saved"></span> <b>Từ đã lưu:</b> Gạch chân chấm (dotted)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="kv-panel-list">${listHtml}</div>
      `;

      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    };

    // Nguồn của 1 mục từ vựng: video YouTube, bài viết/văn bản (id bắt đầu bằng art_ hoặc txt_) hoặc sách
    function vocabSourceInfo(x) {
      if (x.bookId) return { key: 'book:' + x.bookId, type: 'book', title: x.videoTitle || 'Sách' };
      const id = String(x.videoId || '');
      if (/^(art|txt)_/.test(id)) return { key: 'text:' + id, type: 'article', title: x.videoTitle || 'Bài viết' };
      if (id) return { key: 'video:' + id, type: 'video', title: x.videoTitle || id };
      return { key: 'none', type: 'other', title: 'Không rõ nguồn' };
    }
    // Dựng danh sách lọc theo bài học (nhóm Video / Bài viết / Sách), kèm số từ của từng bài
    function renderVocabSourceOptions(all) {
      const sel = document.getElementById('vocab-source');
      if (!sel) return;
      const map = new Map();
      all.forEach((x) => {
        const info = vocabSourceInfo(x);
        let g = map.get(info.key);
        if (!g) { g = { key: info.key, type: info.type, title: info.title, titleAt: 0, recent: 0, count: 0 }; map.set(info.key, g); }
        g.count++;
        const at = x.createdAt || 0;
        if (at > g.recent) g.recent = at;
        if (x.videoTitle && at >= g.titleAt) { g.title = x.videoTitle; g.titleAt = at; }
      });
      if (vocabSource !== 'all' && !map.has(vocabSource)) vocabSource = 'all';
      const cut = (t) => (t.length > 60 ? t.slice(0, 60) + '…' : t);
      const groups = [['video', 'Video'], ['article', 'Bài viết'], ['book', 'Sách'], ['other', 'Khác']];
      let html = `<option value="all">Tất cả bài học (${all.length})</option>`;
      groups.forEach(([type, label]) => {
        const items = Array.from(map.values()).filter((g) => g.type === type).sort((a, b) => b.recent - a.recent);
        if (!items.length) return;
        html += `<optgroup label="${label}">` + items.map((g) => `<option value="${escHtml(g.key)}">${escHtml(cut(g.title))} (${g.count})</option>`).join('') + '</optgroup>';
      });
      sel.innerHTML = html;
      sel.value = vocabSource;
    }

    function renderVocabLevelOptions(all) {
      const sel = document.getElementById('vocab-level');
      if (!sel) return;
      const CEFR = ['A1', 'A2', 'A2+', 'B1', 'B2', 'C1', 'C2'];
      const counts = {};
      CEFR.forEach((l) => { counts[l] = 0; });
      all.forEach((x) => {
        const l = String(x.level || '').trim().toUpperCase();
        if (counts[l] !== undefined) counts[l]++;
      });
      let html = `<option value="all">Tất cả cấp độ (${all.length})</option>`;
      CEFR.forEach((l) => {
        html += `<option value="${l}">Cấp ${l} (${counts[l] || 0})</option>`;
      });
      sel.innerHTML = html;
      sel.value = vocabLevelFilter;
    }

    // Vẽ lại danh sách nhưng giữ cho màn hình "đứng im": lấy thẻ đang nhìn thấy đầu tiên làm mốc, sau khi vẽ lại thì
    // cuộn bù đúng phần chênh lệch (mục mới được thêm lên đầu danh sách sẽ không đẩy nội dung đang đọc trôi xuống).
    function renderVocabPageKeepScroll() {
      const cards = Array.from(document.querySelectorAll('#screen-vocab .vocab-card[data-vid]'));
      const anchor = cards.find((c) => c.getBoundingClientRect().bottom > 40);
      const id = anchor ? anchor.getAttribute('data-vid') : null;
      const top = anchor ? anchor.getBoundingClientRect().top : 0;
      renderVocabPage();
      if (!id) return;
      const again = Array.from(document.querySelectorAll('#screen-vocab .vocab-card[data-vid]')).find((c) => c.getAttribute('data-vid') === id);
      if (!again) return;
      const delta = again.getBoundingClientRect().top - top;
      if (Math.abs(delta) > 0.5) window.scrollTo({ top: window.scrollY + delta, behavior: 'instant' });
    }

    function renderVocabPage() {
      const all = getVocab();
      document.getElementById('vocab-count').textContent = all.length;
      renderVocabSourceOptions(all);
      renderVocabLevelOptions(all);
      const q = vocabQuery.toLowerCase().trim();
      const list = all.filter((x) => (vocabSource === 'all' || vocabSourceInfo(x).key === vocabSource)
        && (vocabLevelFilter === 'all' || String(x.level || '').trim().toUpperCase() === vocabLevelFilter.toUpperCase())
        && (!q || `${x.text} ${x.en} ${x.vi || ''} ${x.wordVi || ''} ${x.videoTitle || ''}`.toLowerCase().includes(q)));
      list.sort(vocabSort === 'az' ? (a, b) => a.text.localeCompare(b.text, 'en', { sensitivity: 'base' })
        : vocabSort === 'old' ? (a, b) => a.createdAt - b.createdAt : (a, b) => b.createdAt - a.createdAt);
      updateVocabMissingBadge();
      updateReviewBadges();
      const rb = document.getElementById('vocab-review-btn');
      if (rb) rb.title = vocabSource === 'all'
        ? 'Ôn tập từ vựng theo nguyên lý lặp lại ngắt quãng (spaced repetition)'
        : 'Chỉ ôn tập từ vựng của bài đang lọc (video / bài viết / sách)';
      document.getElementById('vocab-list').innerHTML = list.length
        ? list.map(vocabCardHtml).join('')
        : `<div class="vocab-empty">${all.length ? 'Không có mục nào khớp bộ lọc.' : 'Chưa có từ vựng nào.<br>Khi luyện tập, bôi đen một từ, cụm từ hoặc câu rồi bấm <b style="color:#fbbf24">Lưu</b> để lưu lại ở đây.'}</div>`;
    }

    function lookupVocab(id) {
      const x = getVocab().find((v) => v.id === id);
      if (!x) return;
      const q = `tôi đang học tiếng Pháp. Từ/cụm từ "${x.text}" trong câu "${x.en}" có nghĩa là gì? Giải thích ngắn gọn bằng tiếng Việt.`;
      window.open(`https://www.google.com/search?udm=50&q=${encodeURIComponent(q)}`, '_blank');   // udm=50: Google AI Mode
    }
    function deleteVocab(id) {
      setVocab(getVocab().filter((v) => v.id !== id));
      updateVocabBadges();
      renderVocabPage();
    }
    function clearAllVocab() {
      if (!getVocab().length || !confirm('Xoá toàn bộ từ vựng đã lưu trên thiết bị này?')) return;
      setVocab([]);
      updateVocabBadges();
      renderVocabPage();
    }
    function exportVocabCsv() {
      const all = getVocab();
      if (!all.length) { showVocabToast('Chưa có gì để xuất', false); return; }
      const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const rows = [['Từ / cụm từ', 'Nghĩa riêng của từ', 'Ngữ cảnh', 'Bản dịch cả câu', 'Video', 'Link']].concat(all.map((x) => [
        x.text, x.wordVi || '', x.en, x.vi || '', x.videoTitle || x.videoId,
        x.srcUrl ? x.srcUrl : ((x.videoId && !x.bookId) ? `https://www.youtube.com/watch?v=${x.videoId}&t=${Math.max(0, Math.floor((x.t || 0) - 2))}s` : '')
      ]));
      const blob = new Blob(['\ufeff' + rows.map((r) => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tu-vung-shadowing.csv';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }

    // ==================== ĐẢM BẢO TIÊU ĐIỂM TRANG CHO PHÍM TẮT (ITEM 2) ====================
    function ensurePageFocus() {
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
        window.focus();
      }
    }

    window.addEventListener('blur', () => {
      // Khi bấm vào iframe YouTube, tự động phục hồi quyền nhận phím tắt cho trang sau 150ms
      setTimeout(() => {
        window.focus();
      }, 150);
    });

    // Phím F: phát RIÊNG khung video YouTube toàn màn hình (không phải cả giao diện app).
    function toggleFullScreen() {
      const elem = document.getElementById('video-frame-wrapper');
      if (!elem) return;
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().then(() => { try { window.focus(); } catch (e) {} }).catch(() => {});
        }
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    }
    // Thoát fullscreen bằng Esc/phím F: trả quyền nhận phím tắt về trang.
    document.addEventListener('fullscreenchange', () => { try { window.focus(); } catch (e) {} });

    let isYTCaptionsVisible = false;
    function toggleYouTubeCaptions() {
      if (!ytPlayer) return;
      try {
        if (isYTCaptionsVisible) {
          if (ytPlayer.unloadModule) ytPlayer.unloadModule('captions');
          if (ytPlayer.setOption) ytPlayer.setOption('captions', 'track', {});
          isYTCaptionsVisible = false;
        } else {
          if (ytPlayer.loadModule) ytPlayer.loadModule('captions');
          if (ytPlayer.setOption) ytPlayer.setOption('captions', 'track', {'languageCode': 'en'});
          isYTCaptionsVisible = true;
        }
      } catch (err) {}
    }

    document.addEventListener('keydown', (e) => {
      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.metaKey || e.ctrlKey) {
        return;
      }
      if (window.pvBlocksHotkeys && window.pvBlocksHotkeys()) return;   // đang ở giao diện Shadowing / Chép chính tả: không dùng phím tắt của giao diện Mặc định
      if (!document.getElementById('screen-vocab').classList.contains('hidden')) return;
      if (donateVisible()) return;
      if (guideVisible()) return;

      const key = e.key;

      if (subtitleLoopActive && (key === 'Enter' || key === 'Escape')) {
        e.preventDefault();
        stopSubtitleLoop();
        return;
      }

      if (e.shiftKey && (key === '>' || key === '.')) {
        e.preventDefault();
        setRate(settings.playbackRate + 0.25);
        return;
      }
      if (e.shiftKey && (key === '<' || key === ',')) {
        e.preventDefault();
        setRate(settings.playbackRate - 0.25);
        return;
      }

      if (!e.shiftKey && !e.altKey && /^[0-9]$/.test(key)) {
        e.preventDefault();
        if (key === '0') { playFromBeginning(); return; }
        const rateMap = { '1': 0.5, '2': 0.75, '3': 0.9, '4': 1, '5': 1.25, '6': 1.5, '7': 1.75, '8': 2 };
        if (rateMap[key] !== undefined) setRate(rateMap[key]);
        return;
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        if (ytPlayer && ytPlayer.getVolume && ytPlayer.setVolume) {
          const v = Math.min(100, ytPlayer.getVolume() + 5);
          ytPlayer.setVolume(v);
          if (ytPlayer.isMuted && ytPlayer.isMuted()) ytPlayer.unMute();
        }
        return;
      }
      if (key === 'ArrowDown') {
        e.preventDefault();
        if (ytPlayer && ytPlayer.getVolume && ytPlayer.setVolume) {
          const v = Math.max(0, ytPlayer.getVolume() - 5);
          ytPlayer.setVolume(v);
        }
        return;
      }

      if (key === 'ArrowLeft') {
        e.preventDefault();
        seekRelative(-5);
        return;
      }
      if (key === 'l' || key === 'L') {
        e.preventDefault();
        loopSelectedText(false);
        return;
      }
      if (key === 's' || key === 'S') {
        e.preventDefault();
        saveSelectionToVocabByKey();
        return;
      }
      if (key === 'ArrowRight') {
        e.preventDefault();
        seekRelative(5);
        return;
      }

      if (key === 'f' || key === 'F') {
        e.preventDefault();
        toggleFullScreen();
        return;
      }

      if (key === 'c' || key === 'C') {
        e.preventDefault();
        toggleYouTubeCaptions();
        return;
      }

      if (key === 'm' || key === 'M') {
        e.preventDefault();
        if (ytPlayer && ytPlayer.isMuted && ytPlayer.mute && ytPlayer.unMute) {
          if (ytPlayer.isMuted()) {
            ytPlayer.unMute();
          } else {
            ytPlayer.mute();
          }
        }
        return;
      }

      if (key === ' ' || key === 'Backspace') {
        e.preventDefault();
        if (key === 'Backspace' && subtitleLoopActive && (loopWaitingAtEnd || !isPlaying)) {
          restartLoopFromStart();
        } else {
          togglePlay();
        }
      } else if (key === 'r' || key === 'R') {
        replaySentence();
      } else if (key === 'Home') {
        playFromBeginning();
      }
    });


    // ==================== CHIA SẺ VIDEO BẰNG LINK ====================
    // Link chứa luôn phụ đề (+ bản dịch) trong phần sau dấu # nên không cần backend:
    //   <trang>#share=<dữ liệu nén>     -> mở đúng video, có phụ đề, tự bật Song ngữ nếu lúc chia sẻ đang bật.
    // (Định dạng cũ #share=... vẫn được đọc để link đã gửi trước đây còn dùng được; link mới dùng ?v=<id> + file .share.json.)
    function shareB64FromBytes(bytes) {
      let bin = '';
      const CH = 0x8000;
      for (let i = 0; i < bytes.length; i += CH) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    function shareBytesFromB64(str) {
      let b = str.replace(/-/g, '+').replace(/_/g, '/');
      while (b.length % 4) b += '=';
      const bin = atob(b);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    async function shareEncode(obj) {
      const raw = new TextEncoder().encode(JSON.stringify(obj));
      if (window.CompressionStream) {
        try {
          const cs = new CompressionStream('deflate-raw');
          const w = cs.writable.getWriter();
          w.write(raw); w.close();
          const buf = await new Response(cs.readable).arrayBuffer();
          return 'z' + shareB64FromBytes(new Uint8Array(buf));
        } catch (e) {}
      }
      return 'r' + shareB64FromBytes(raw);
    }
    async function shareDecode(str) {
      const kind = str.charAt(0);
      let bytes = shareBytesFromB64(str.slice(1));
      if (kind === 'z') {
        const ds = new DecompressionStream('deflate-raw');
        const w = ds.writable.getWriter();
        w.write(bytes); w.close();
        bytes = new Uint8Array(await new Response(ds.readable).arrayBuffer());
      }
      return JSON.parse(new TextDecoder().decode(bytes));
    }
    function shareBaseUrl() { return location.href.split('#')[0].split('?')[0]; }

    // Link ngắn: <trang>?v=<videoId>&b=1
    // Dữ liệu đầy đủ (kể cả mốc thời gian từng từ + bản dịch) nằm trong file <videoId>.share.json
    // đặt trong thư mục subs/ (cùng chỗ với các file phụ đề). Bấm Chia sẻ sẽ tải file này về + copy link ngắn.
    function shareDownloadFile(name, text) {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    async function shareCurrentVideo() {
      if (!currentVideoId || !sentences.length) return;
      const withVi = aicHasTranslation(sentences);
      const bilingualOn = !!(settings.bilingual && withVi);
      const fileName = `${currentVideoId}.share.json`;
      const payload = {
        v: 2,
        id: currentVideoId,
        title: currentVideoTitle || '',
        format: subtitleFormat || 'srt',
        sentences: sentences
      };
      shareDownloadFile(fileName, JSON.stringify(payload));
      const link = shareBaseUrl() + '?v=' + encodeURIComponent(currentVideoId) + (bilingualOn ? '&b=1' : '');
      try { await copyTextToClipboard(link); } catch (e) {}
      openShareModal(link, fileName, bilingualOn, withVi);
    }

    function openShareModal(link, fileName, bilingualOn, withVi) {
      const m = document.getElementById('share-modal');
      if (!m) return;
      document.getElementById('share-link-input').value = link;
      document.getElementById('share-file-name').textContent = fileName;
      const f2 = document.getElementById('share-file-name2');
      if (f2) f2.textContent = fileName;
      document.getElementById('share-extra').textContent =
        (withVi ? 'Có kèm bản dịch tiếng Việt. ' : 'Video này chưa có bản dịch nên link không kèm song ngữ. ') +
        (bilingualOn ? 'Người mở link sẽ thấy Song ngữ đang bật.' : (withVi ? 'Đang tắt Song ngữ nên người mở link sẽ thấy Song ngữ tắt (muốn bật sẵn thì bật Song ngữ rồi bấm chia sẻ lại).' : ''));
      const warn = document.getElementById('share-file-warn');
      warn.style.display = location.protocol === 'file:' ? 'block' : 'none';
      m.classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function closeShareModal() { const m = document.getElementById('share-modal'); if (m) m.classList.remove('open'); }
    function copyShareLink(btn) {
      const v = document.getElementById('share-link-input').value;
      copyTextToClipboard(v).then(() => {
        flashCopied(btn, 1600);
      }).catch(() => { document.getElementById('share-link-input').select(); });
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShareModal(); });

    function shareEnterPractice() {
      document.getElementById('screen-vocab').classList.add('hidden');
      document.getElementById('screen-input').classList.add('hidden');
      document.getElementById('screen-practice').classList.remove('hidden'); if (window.pvReset) pvReset();
      currentSentenceIndex = 0;
      isTextMode = false;
      document.body.classList.remove('text-mode');
      resetPlaybackTrackingState();
      initYouTubePlayer();
      renderSubtitleList();
      const scrollBox0 = document.getElementById('subtitles-scroll-container');
      if (scrollBox0) scrollBox0.scrollTop = 0;
      updateActiveSentenceDisplay();
      if (window.lucide && window.lucide.createIcons) { window.lucide.createIcons(); }
      ensurePageFocus();
      trackAndShowVideoStats(currentVideoId);
    }

    async function openSharedFromHash() {
      const m = /^#share=(.+)$/.exec(location.hash || '');
      if (!m) return false;
      try {
        const p = await shareDecode(m[1]);
        if (!p || !p.id || !Array.isArray(p.s) || !p.s.length) throw new Error('bad');
        const list = p.s.map((a, i) => {
          const o = { id: i + 1, startTime: Number(a[0]) || 0, endTime: Number(a[1]) || 0, text: String(a[2] || '') };
          if (a[3]) o.vi = String(a[3]);
          return o;
        });
        const existing = getLocalHistory().find((h) => h.videoId === p.id);
        currentVideoId = String(p.id);
        currentVideoTitle = p.n || (existing && existing.title) || `Video ${p.id}`;
        subtitleFormat = 'srt';
        sentences = list;
        inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
        // Chỉ lưu vào lịch sử của người xem nếu họ chưa có bản riêng của video này
        if (existing && existing.sentences && existing.sentences.length) sharedNoSaveId = currentVideoId;
        else saveToLocalHistory({ videoId: currentVideoId, title: currentVideoTitle, format: subtitleFormat, sentences: sentences });
        shareEnterPractice();
        if (p.b && aicHasTranslation(sentences)) setBilingual(true);
        try { history.replaceState(null, '', shareBaseUrl()); } catch (e) {}
        showVocabToast('Đang mở video được chia sẻ', false);
        return true;
      } catch (e) {
        console.warn('Link chia sẻ không hợp lệ:', e);
        try { history.replaceState(null, '', shareBaseUrl()); } catch (e2) {}
        showVocabToast('Link chia sẻ không đọc được (có thể bị cắt ngắn)', false);
        return false;
      }
    }

    // Mở link ngắn ?v=<videoId>&b=1
    async function openSharedFromQuery() {
      const q = new URLSearchParams(location.search);
      const vid = q.get('v');
      if (!vid || !/^[\w-]{6,20}$/.test(vid)) return;
      const wantBilingual = q.get('b') === '1';
      try { history.replaceState(null, '', shareBaseUrl()); } catch (e) {}

      // (a) File chia sẻ đầy đủ (từng từ + bản dịch)
      try {
        const res = await fetch(`${DATA_DIR}${vid}.share.json?t=${Date.now()}`, { cache: 'no-cache' });
        if (res.ok) {
          const txt = await res.text();
          if (txt && !txt.trim().toLowerCase().startsWith('<!doctype html')) {
            const p = JSON.parse(txt);
            if (p && Array.isArray(p.sentences) && p.sentences.length) {
              const existing = getLocalHistory().find((h) => h.videoId === vid);
              currentVideoId = vid;
              currentVideoTitle = p.title || (existing && existing.title) || `Video ${vid}`;
              subtitleFormat = p.format || 'srt';
              sentences = p.sentences;
              inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
              if (existing && existing.sentences && existing.sentences.length) sharedNoSaveId = currentVideoId;   // không ghi đè bản riêng của người xem
              else saveToLocalHistory({ videoId: currentVideoId, title: currentVideoTitle, format: subtitleFormat, sentences: sentences });
              shareEnterPractice();
              if (wantBilingual && aicHasTranslation(sentences)) setBilingual(true);
              return;
            }
          }
        }
      } catch (e) { console.warn('Không đọc được file chia sẻ:', e); }

      // (b) Không có file chia sẻ -> thử mở video từ thư viện của trang
      let title = '';
      if (categoryStructure) {
        Object.keys(categoryStructure).forEach((k) => { if (categoryStructure[k] && categoryStructure[k][vid]) title = categoryStructure[k][vid]; });
      }
      const meta = videoMetadataMap[vid];
      if (meta && meta.title) title = meta.title;
      const ok = await selectCategoryVideo(vid, title);
      if (ok) { if (wantBilingual && aicHasTranslation(sentences)) setBilingual(true); }
      else showVocabToast('Không tìm thấy dữ liệu chia sẻ của video này (thiếu file .share.json trên hosting)', false);
    }


    // ==================== ĐẾM LƯỢT TRUY CẬP & SỐ THIẾT BỊ ĐÃ TỪNG VÀO ====================
    // Dùng dịch vụ đếm công khai, miễn phí (countapi.mileshilliard.com) vì trang này không có backend riêng.
    // Mỗi lần tải trang -> +1 "lượt truy cập". Mỗi thiết bị/trình duyệt CHỈ được tính +1 vào "số người dùng"
    // đúng 1 lần duy nhất (đánh dấu lại trong localStorage của máy đó để không đếm trùng ở các lần sau).
    // Lưu ý: đây chỉ là số liệu tương đối, có thể bị thiếu ở người dùng chặn tracker/quảng cáo, và sẽ đếm
    // trùng nếu người dùng xoá dữ liệu trình duyệt hoặc dùng nhiều trình duyệt/thiết bị khác nhau.
    const SITE_COUNTER_BASE = 'https://countapi.mileshilliard.com/api/v1';
    const SITE_COUNTER_VIEWS_KEY = 'shadowingmaster_pageviews_if13mn4r';
    const SITE_COUNTER_USERS_KEY = 'shadowingmaster_uniqueusers_if13mn4r';
    const SITE_COUNTER_DEVICE_FLAG = 'shadowing_master_device_counted_v1';

    function siteCounterRenderText(views, users) {
      const el = document.getElementById('site-counter-footer');
      if (!el) return;
      const parts = [];
      if (views != null) parts.push(`<span>${views.toLocaleString('vi-VN')} lượt truy cập</span>`);
      if (users != null) parts.push(`<span>${users.toLocaleString('vi-VN')} người dùng</span>`);
      el.innerHTML = parts.join('<span>·</span>');
    }

    async function initSiteCounters() {
      try {
        const viewsRes = await fetch(`${SITE_COUNTER_BASE}/hit/${SITE_COUNTER_VIEWS_KEY}`, { cache: 'no-store' });
        const viewsData = viewsRes.ok ? await viewsRes.json() : null;
        const views = viewsData && viewsData.value != null ? Number(viewsData.value) : null;

        let alreadyCounted = false;
        try { alreadyCounted = localStorage.getItem(SITE_COUNTER_DEVICE_FLAG) === '1'; } catch (e) {}

        let users = null;
        if (alreadyCounted) {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/get/${SITE_COUNTER_USERS_KEY}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
        } else {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/hit/${SITE_COUNTER_USERS_KEY}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
          try { localStorage.setItem(SITE_COUNTER_DEVICE_FLAG, '1'); } catch (e) {}
        }

        if (views != null || users != null) siteCounterRenderText(views, users);
        // Nếu dịch vụ đếm bị chặn (adblock/mạng công ty) hoặc lỗi -> âm thầm bỏ qua, không hiện gì cả,
        // không ảnh hưởng đến các chức năng khác của trang.
      } catch (e) { /* âm thầm bỏ qua */ }
    }

    // ---------- Đếm riêng cho từng video: "lượt xem" + "người học" (số thiết bị khác nhau đã xem video đó) ----------
    // Mỗi lần vào màn hình luyện tập của 1 video -> +1 lượt xem của riêng video đó. Mỗi thiết bị chỉ được
    // tính vào "người học" của video đó đúng 1 lần (khác với bộ đếm tổng của cả trang ở trên).
    async function trackAndShowVideoStats(videoId) {
      const el = document.getElementById('video-stats-footer');
      if (el) el.innerHTML = '';
      try { if (window.csIpaReset) csIpaReset(); } catch (e) {}   // giao diện Mặc định: mỗi video mở ra đều tắt IPA ở thẻ phụ đề
      try { if (window.VP && VP.onVideoOpen) VP.onVideoOpen(); } catch (e) {}   // điện thoại / máy tính bảng: mỗi video mở ra đều tắt "Phụ đề Việt" ở nút CC
      try { if (window.VP) VP.renderInfo(videoId); } catch (e) {}   // tiêu đề + kênh + lượt xem dưới các nút điều hướng
      if (!videoId) return;
      const viewsKey = `shadowingmaster_vv_if13mn4r_${videoId}`;
      const usersKey = `shadowingmaster_vu_if13mn4r_${videoId}`;
      const deviceFlagKey = `shadowing_master_video_user_counted_${videoId}`;
      try {
        const viewsRes = await fetch(`${SITE_COUNTER_BASE}/hit/${viewsKey}`, { cache: 'no-store' });
        const viewsData = viewsRes.ok ? await viewsRes.json() : null;
        const views = viewsData && viewsData.value != null ? Number(viewsData.value) : null;

        let alreadyCounted = false;
        try { alreadyCounted = localStorage.getItem(deviceFlagKey) === '1'; } catch (e) {}

        let users = null;
        if (alreadyCounted) {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/get/${usersKey}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
        } else {
          const usersRes = await fetch(`${SITE_COUNTER_BASE}/hit/${usersKey}`, { cache: 'no-store' });
          const usersData = usersRes.ok ? await usersRes.json() : null;
          users = usersData && usersData.value != null ? Number(usersData.value) : null;
          try { localStorage.setItem(deviceFlagKey, '1'); } catch (e) {}
        }

        // Phòng trường hợp người dùng đã chuyển sang video khác trong lúc đang đợi kết quả -> không ghi đè nhầm.
        if (el && currentVideoId === videoId) {
          const parts = [];
          if (views != null) parts.push(`<span>${views.toLocaleString('vi-VN')} lượt xem</span>`);
          if (users != null) parts.push(`<span>${users.toLocaleString('vi-VN')} người học</span>`);
          el.innerHTML = parts.join('<span>·</span>');
        }
      } catch (e) { /* âm thầm bỏ qua */ }
    }

    document.addEventListener('DOMContentLoaded', () => {
      if (window.lucide && window.lucide.createIcons) { window.lucide.createIcons(); }
      initSiteCounters();

      applySubtitleFontSize(currentSubFontSize);
      applySubtitleLineHeight();

      updateRateUI(settings.playbackRate);

      const karaokeBtn = document.getElementById('btn-toggle-karaoke');
      if (!settings.karaokeMode) karaokeBtn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';


      const autoScrollBtn = document.getElementById('btn-toggle-autoscroll');
      if (settings.autoScroll) {
        autoScrollBtn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-red-600/30 text-red-200 border-red-500/60 glow-red shrink-0 whitespace-nowrap';
      } else {
        autoScrollBtn.className = 'btn-interactive flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700 shrink-0 whitespace-nowrap';
      }

      updateSentenceAutoStopUI();

      renderHistorySection();
      updateVocabBadges();
      const hasShareHash = /^#share=/.test(location.hash || '');
      const catPromise = loadCategoryData();
      if (!hasShareHash && new URLSearchParams(location.search).get('v')) catPromise.then(() => openSharedFromQuery());
      initSplitResizer();
      ensurePageFocus();
      if (hasShareHash) openSharedFromHash();
      if (window.__routerBoot) window.__routerBoot(catPromise, hasShareHash || !!new URLSearchParams(location.search).get('v'));
    });

    // ==================== NHẬN DỮ LIỆU TỪ EXTENSION "ShadowingStudio Importer" ====================
    // Extension gửi: { videoId, title, lang, kind, raw } - `raw` là file json3 gốc của YouTube
    // (giống hệt file lưu thủ công từ tab Network), nên dùng lại parseAnySubtitle() có sẵn.
    function importFromExtension(p) {
      if (p && p.type === 'article') return importArticleFromExtension(p);
      if (!p || !p.videoId || !p.raw) { showVocabToast('Dữ liệu từ extension không hợp lệ', false); return false; }
      let res = parseAnySubtitle(`${p.videoId}.json3`, JSON.stringify(p.raw));
      if (!res || !res.sentences || !res.sentences.length) {
        showVocabToast('Extension đã gửi phụ đề nhưng app không đọc được', false);
        return false;
      }
      // Extension v1.1+: có kèm phụ đề thủ công tiếng Pháp do người làm video upload -> ghép vào bản tự động
      // (chữ + dấu câu + chia câu theo người làm, thời gian từng từ theo ASR). Lỗi/không khớp -> giữ nguyên bản ASR như cũ.
      let mergeInfo = null, mergeFailed = false;
      if (p.manual && p.manual.raw) {
        try {
          const mr = mergeManualIntoAsr(res.sentences, mcJson3ToText(p.manual.raw));
          if (mr.ok && mr.sentences.length) {
            res = { format: res.format, sentences: mr.sentences };
            mergeInfo = mr.stats;
          } else {
            mergeFailed = true;
            console.warn('[merge] Không ghép được phụ đề người làm:', mr.error);
          }
        } catch (err) { mergeFailed = true; console.error('[merge]', err); }
      }
      const meta = {};
      if (p.channelTitle) meta.channelTitle = String(p.channelTitle).slice(0, 120);
      if (p.channelAvatar && /^https:\/\//.test(p.channelAvatar)) meta.channelAvatar = String(p.channelAvatar);
      if (Number(p.viewCount) > 0) meta.viewCount = Number(p.viewCount);
      const dur = Number(p.duration) > 0 ? Number(p.duration) : 0;
      sharedNoSaveId = '';
      const existing = getLocalHistory().find((h) => h.videoId === p.videoId && !h.isText);
      // Video đã có bản dịch song ngữ trong lịch sử -> mở bản đã lưu, tránh ghi đè mất bản dịch
      if (existing && existing.sentences && existing.sentences.length && aicHasTranslation(existing.sentences)) {
        showVocabToast('Video này đã có bản dịch trong lịch sử, đang mở bản đã lưu', false);
        saveToLocalHistory(Object.assign({}, existing, { meta: Object.assign({}, existing.meta, meta), duration: existing.duration || dur }));   // cập nhật tên kênh/lượt xem mới nhất
        loadFromHistory(p.videoId);
        return true;
      }
      currentVideoId = String(p.videoId);
      currentVideoTitle = (p.title || '').trim() || (existing && existing.title) || `Video ${p.videoId}`;
      subtitleFormat = res.format;
      sentences = res.sentences;
      inputUrl.value = `https://www.youtube.com/watch?v=${currentVideoId}`;
      inputUrl.dispatchEvent(new Event('input'));
      fileStatusText.textContent = `Từ extension: ${res.sentences.length} câu (${res.format.toUpperCase()}${mergeInfo ? ' + phụ đề người làm' : ''})`;
      fileStatusBadge.classList.remove('hidden');
      aiOnSubtitlesLoaded();
      saveToLocalHistory({ videoId: currentVideoId, title: currentVideoTitle, duration: dur, meta: meta, format: subtitleFormat, sentences: sentences });
      shareEnterPractice();
      showVocabToast(
        mergeInfo ? `Đã import và ghép phụ đề người làm (${mergeInfo.coverage}% từ khớp)`
          : mergeFailed ? 'Đã import (phụ đề người làm không khớp nên dùng bản tự động)'
          : 'Đã import video từ YouTube',
        false
      );
      return true;
    }


    // ==================== NHẬN BÀI ĐỌC (BÀI BÁO / IELTS READING) TỪ EXTENSION ====================
    // Extension gửi: { type:'article', title, url, site, blocks:[ {t:'h'|'p', x}, {t:'img', d (dataURL), u (link gốc), a, c} ] }
    // -> tách câu, gắn ảnh / đầu đoạn / tiêu đề vào đúng câu rồi mở ở chế độ "Luyện với văn bản".
    // Ảnh lưu trong IndexedDB riêng (localStorage quá nhỏ); trong lịch sử chỉ giữ tham chiếu nhỏ { k, u, a, c }.
    const TXI_DB_NAME = 'shadowing_text_images_v1';
    let txiDbP = null;
    const txiCache = new Map();

    function txiDb() {
      if (txiDbP) return txiDbP;
      txiDbP = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('Trình duyệt này không hỗ trợ IndexedDB')); return; }
        const rq = indexedDB.open(TXI_DB_NAME, 1);
        rq.onupgradeneeded = () => { rq.result.createObjectStore('imgs', { keyPath: 'k' }); };
        rq.onsuccess = () => resolve(rq.result);
        rq.onerror = () => reject(rq.error);
      });
      txiDbP.catch(() => { txiDbP = null; });
      return txiDbP;
    }
    function txiPut(items) {
      if (!items.length) return Promise.resolve();
      return txiDb().then((db) => new Promise((resolve, reject) => {
        const tx = db.transaction('imgs', 'readwrite');
        const st = tx.objectStore('imgs');
        items.forEach((it) => { st.put(it); txiCache.set(it.k, it.d); });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('abort'));
      }));
    }
    function txiGet(k) {
      if (txiCache.has(k)) return Promise.resolve(txiCache.get(k));
      return txiDb().then((db) => new Promise((resolve) => {
        const rq = db.transaction('imgs').objectStore('imgs').get(k);
        rq.onsuccess = () => { const v = (rq.result && rq.result.d) || null; if (v) txiCache.set(k, v); resolve(v); };
        rq.onerror = () => resolve(null);
      })).catch(() => null);
    }
    // Dọn ảnh của những bài đã bị xóa khỏi lịch sử (bỏ qua ảnh mới lưu < 2 phút để không xóa nhầm khi đang import)
    function txiGc() {
      txiDb().then((db) => {
        const live = new Set(getLocalHistory().filter((h) => h.isText).map((h) => h.videoId));
        const st = db.transaction('imgs', 'readwrite').objectStore('imgs');
        const rq = st.openCursor();
        rq.onsuccess = () => {
          const c = rq.result;
          if (!c) return;
          const doc = String(c.key).split('#')[0];
          if (!live.has(doc) && Date.now() - ((c.value && c.value.ts) || 0) > 120000) { txiCache.delete(c.key); c.delete(); }
          c.continue();
        };
      }).catch(() => {});
    }
    document.addEventListener('DOMContentLoaded', () => setTimeout(txiGc, 5000));

    function txiOpenLightbox(src) {
      if (!src) return;
      const old = document.getElementById('txi-lightbox');
      if (old) old.remove();
      const box = document.createElement('div');
      box.id = 'txi-lightbox';
      const im = document.createElement('img');
      im.src = src;
      box.appendChild(im);
      box.onclick = () => box.remove();
      document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { box.remove(); document.removeEventListener('keydown', esc); } });
      document.body.appendChild(box);
    }

    // Vẽ một ảnh của bài đọc (ảnh lấy từ IndexedDB; nếu mất thì thử link gốc; không có gì thì ẩn)
    function txiRenderFigure(im) {
      const fig = document.createElement('figure');
      fig.className = 'txt-figure';
      const img = document.createElement('img');
      img.alt = im.a || '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      let triedRemote = false;
      img.onerror = () => {
        if (!triedRemote && im.u && img.src !== im.u) { triedRemote = true; img.src = im.u; }
        else fig.remove();
      };
      img.onclick = () => txiOpenLightbox(img.currentSrc || img.src);
      fig.appendChild(img);
      if (im.c) {
        const cap = document.createElement('figcaption');
        cap.textContent = im.c;
        fig.appendChild(cap);
      }
      if (im.k) {
        txiGet(im.k).then((d) => {
          if (d) img.src = d;
          else if (im.u) { triedRemote = true; img.src = im.u; }
          else fig.remove();
        });
      } else if (im.u) { triedRemote = true; img.src = im.u; }
      else fig.remove();
      return fig;
    }

    // Nhãn đoạn kiểu "A." / "B." / "(i)" hay bị tách riêng thành một "câu" -> gộp vào câu kế tiếp
    function txiSplitParagraph(text) {
      const parts = splitProseIntoSentences(text).map((x) => x.text);
      if (parts.length > 1 && /^(?:[A-Za-z]|[IVXivx]{1,4}|\d{1,2})[.)]$|^\((?:[A-Za-z]|[ivxIVX]{1,4}|\d{1,2})\)$/.test(parts[0])) {
        parts[1] = parts[0] + ' ' + parts[1];
        parts.shift();
      }
      return parts;
    }

    function txiBuildSentences(seq) {
      const out = [];
      let pending = [];
      const add = (text, extra) => {
        const s = { id: out.length + 1, startTime: out.length, endTime: out.length + 1, text: text };
        if (extra) Object.assign(s, extra);
        if (pending.length) { s.imgs = pending; pending = []; }
        out.push(s);
      };
      seq.forEach((b) => {
        if (b.t === 'img') { pending.push(b.ref); return; }
        if (b.t === 'h' && (b.title || b.x.split(/\s+/).length <= 25)) { add(b.x, b.title ? { hd: 1, ti: 1 } : { hd: 1 }); return; }
        txiSplitParagraph(b.x).forEach((t, i) => add(t, i === 0 ? { ps: 1 } : null));
      });
      if (pending.length && out.length) {
        const last = out[out.length - 1];
        last.imgs = (last.imgs || []).concat(pending);   // ảnh nằm cuối bài: gắn vào câu cuối
      }
      return out;
    }

    function importArticleFromExtension(p) {
      const blocks = Array.isArray(p.blocks) ? p.blocks : [];
      const textOf = (b) => String((b && b.x) || '').replace(/\s+/g, ' ').trim();
      const textBlocks = blocks.filter((b) => b && (b.t === 'h' || b.t === 'p') && textOf(b));
      if (!textBlocks.length) { showVocabToast('Bài đọc từ extension không có nội dung chữ', false); return false; }
      sharedNoSaveId = '';
      // Cùng mã với cách dán tay (textDocHash) nên import lại đúng bài đó sẽ mở bản đã lưu, giữ nguyên bản dịch
      const rawText = textBlocks.map(textOf).join('\n\n');
      const docId = `txt_${textDocHash(rawText)}`;

      const seq = [], putList = [];
      let n = 0;
      blocks.forEach((b) => {
        if (!b) return;
        if (b.t === 'img') {
          n++;
          const ref = { a: String(b.a || '').slice(0, 200), c: String(b.c || '').slice(0, 400) };
          if (typeof b.d === 'string' && /^data:image\//.test(b.d)) { ref.k = `${docId}#${n}`; putList.push({ k: ref.k, d: b.d, ts: Date.now() }); }
          if (typeof b.u === 'string' && /^https?:\/\//.test(b.u) && b.u.length <= 800) ref.u = b.u;
          if (ref.k || ref.u) seq.push({ t: 'img', ref });
        } else if ((b.t === 'h' || b.t === 'p') && textOf(b)) {
          seq.push({ t: b.t, x: textOf(b) });
        }
      });

      const saved = getLocalHistory().find((h) => h.videoId === docId && h.isText && h.sentences && h.sentences.length);
      const hasNewImgs = seq.some((b) => b.t === 'img');
      const savedHasImgs = !!(saved && saved.sentences.some((s) => s.imgs && s.imgs.length));
      // Đã luyện/dịch rồi (hoặc đã có ảnh) -> dùng lại bản đã lưu để không mất bản dịch song ngữ
      const reuse = !!saved && (aicHasTranslation(saved.sentences) || savedHasImgs || !hasNewImgs);

      txiPut(putList).catch((e) => console.warn('[bài đọc] không lưu được ảnh:', e)).then(() => {
        const parsed = reuse ? aiClone(saved.sentences) : txiBuildSentences(seq);
        if (!parsed.length) { showVocabToast('Không tách được câu nào từ bài đọc này', false); return; }
        // Tiêu đề = hàng chữ đầu tiên của văn bản đã bôi đen (không dùng tiêu đề trang web)
        const title = titleFromLines(textBlocks.map(textOf)) || (saved && saved.title) || deriveTextTitle(parsed);
        openTextSession(docId, title, parsed);
        showVocabToast(reuse && saved ? 'Bài này đã có trong lịch sử, đã mở bản đã lưu' : 'Đã import bài đọc từ extension', false);
        setTimeout(txiGc, 6000);
      });
      return true;
    }

    window.addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'SHADOWING_IMPORT') return;
      if (e.source !== window && e.source !== window.opener) return;
      if (e.source && typeof e.source.postMessage === 'function') {
        try { e.source.postMessage({ type: 'SHADOWING_IMPORT_ACK' }, '*'); } catch (err) {}
      }
      try { importFromExtension(e.data.payload); } catch (err) { console.error(err); showVocabToast('Import bị lỗi', false); }
    });

    // ==================== NHẬN TỪ VỰNG TỪ EXTENSION ====================
    // Bôi đen 1 từ ở trang web bất kỳ -> chuột phải -> Shadowing Studio -> "Lưu từ vựng": extension đẩy mục từ vựng sang đây.
    // Trả về false nếu không ghi được (để extension giữ lại hàng chờ và thử lại), true nếu đã xử lý xong.
    function saveVocabFromExtension(items) {
      const list = getVocab();
      const key = (x) => `${x.videoId}|${String(x.text).toLowerCase()}|${Math.round(x.t || 0)}`;
      const seenKeys = new Set(list.map(key)), seenIds = new Set(list.map((x) => x.id));
      let added = 0, dup = 0, last = null;
      items.forEach((raw) => {
        if (!raw || typeof raw !== 'object') return;
        const en = String(raw.en || '').slice(0, 3000);
        const text = String(raw.text || '').trim().slice(0, 1000);
        const hs = Math.max(0, Math.min(en.length, parseInt(raw.hs, 10) || 0));
        const he = Math.max(hs, Math.min(en.length, parseInt(raw.he, 10) || 0));
        if (!text || !en || he <= hs) return;
        const n = text.split(/\s+/).length;
        const item = {
          id: String(raw.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6))).slice(0, 40),
          text, kind: n === 1 ? 'word' : (n <= 6 ? 'phrase' : 'sentence'),
          en, hs, he, vi: '', prev: String(raw.prev || '').slice(0, 1500),
          videoId: String(raw.videoId || 'art_web').slice(0, 80), videoTitle: String(raw.videoTitle || '').slice(0, 200),
          t: 0, createdAt: Number(raw.createdAt) || Date.now()
        };
        if (/^https?:\/\//i.test(String(raw.srcUrl || ''))) item.srcUrl = String(raw.srcUrl).slice(0, 800);
        if (seenIds.has(item.id) || seenKeys.has(key(item))) { dup++; return; }
        seenIds.add(item.id); seenKeys.add(key(item));
        list.unshift(item); added++; last = item;
      });
      if (!added) { if (dup) showVocabToast('Từ này đã được lưu trước đó', true); return true; }
      if (!setVocab(list)) { showVocabToast('Không lưu được: bộ nhớ trình duyệt đã đầy', false); return false; }
      updateVocabBadges();
      const scr = document.getElementById('screen-vocab');
      if (scr && !scr.classList.contains('hidden')) renderVocabPageKeepScroll();
      const short = last.text.length > 40 ? last.text.slice(0, 40) + '…' : last.text;
      showVocabToast(added === 1 ? `Đã lưu “${short}” từ trang web` : `Đã lưu ${added} từ vựng từ trang web`, true, added === 1 ? last.id : undefined, added === 1);
      return true;
    }
    window.addEventListener('message', (e) => {
      if (e.source !== window || !e.data || e.data.type !== 'SHADOWING_SAVE_VOCAB') return;
      const items = Array.isArray(e.data.items) ? e.data.items : [];
      let ok = false;
      try { ok = saveVocabFromExtension(items); } catch (err) { console.error(err); showVocabToast('Lưu từ vựng từ extension bị lỗi', false); }
      if (ok) window.postMessage({ type: 'SHADOWING_SAVE_VOCAB_ACK', ids: items.map((x) => x && x.id).filter(Boolean) }, location.origin);   // báo extension đã xử lý để nó xoá khỏi hàng chờ
    });
    document.addEventListener('DOMContentLoaded', () => {
      window.postMessage({ type: 'SHADOWING_READY' }, location.origin);
    });

    // Tự ẩn dải hướng dẫn cài extension khi phát hiện extension đã cài
    // (app-bridge.js của extension gắn data-shadowing-extension="1" lên <html>).
    (function () {
      function syncExtStrip() {
        const el = document.getElementById('ext-install-strip');
        if (el) el.hidden = document.documentElement.dataset.shadowingExtension === '1';
      }
      syncExtStrip();
      document.addEventListener('DOMContentLoaded', syncExtStrip);
      try {
        new MutationObserver(syncExtStrip).observe(document.documentElement, { attributes: true, attributeFilter: ['data-shadowing-extension'] });
      } catch (e) {}
      setTimeout(syncExtStrip, 800);
    })();

    // Đếm từ + nút xóa nhanh trong "Luyện với văn bản"
    document.addEventListener('DOMContentLoaded', () => {
      const ta = document.getElementById('text-shadow-textarea');
      const wc = document.getElementById('text-wc');
      const clr = document.getElementById('text-clear-btn');
      if (!ta || !wc) return;
      const upd = () => { const t = ta.value.trim(); wc.textContent = t ? t.split(/\s+/).length : 0; };
      ta.addEventListener('input', upd);
      if (clr) clr.addEventListener('click', () => { ta.value = ''; upd(); ta.focus(); });
      upd();
    });
    // =====================================================================================
    // ==================== ĐỌC SÁCH (BOOK READER) — PHẦN 1: LƯU TRỮ + NẠP SÁCH ====================
    // Sách được lưu trong IndexedDB (không dùng localStorage vì chỉ ~5MB). Mỗi sách = 1 bản ghi
    // "books" (thông tin + vị trí đọc) + N bản ghi "chapters" (từng chương, kèm bản dịch).
    // Mô hình câu trong bộ nhớ: { id, text, vi?, p (số đoạn), h? (tiêu đề phụ), startTime, endTime }
    // — dùng đúng tên trường của app cũ để tái sử dụng tra nghĩa / lưu từ vựng / ghép song ngữ.
    // =====================================================================================
    Object.assign(SVG_ICONS, {
      'book-open': `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
      'list': `<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>`,
      'type': `<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>`,
      'maximize': `<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>`
    });

    const BK_DB_NAME = 'shadowing_books_v1';
    const BK_MAX_CH_WORDS = 7000;     // chương dài hơn mức này sẽ được chia nhỏ để đọc nhẹ + render nhanh
    const BK_SIZE_PART_WORDS = 2500;  // cỡ mỗi phần khi chia đều theo độ dài
    let bkLibrary = [];               // danh sách thông tin sách (không kèm nội dung) để vẽ thư viện

    const bkWc = (t) => { t = String(t || '').trim(); return t ? t.split(/\s+/).length : 0; };
    const bkUid = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    function bkHue(str) { let h = 7; const s = String(str || ''); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; }
    function bkToast(msg) { try { showVocabToast(msg, false); } catch (e) { alert(msg); } }
    function bkLoading(on, text) {
      const el = document.getElementById('bk-loading');
      if (!el) return;
      el.classList.toggle('open', !!on);
      if (text) document.getElementById('bk-loading-text').textContent = text;
    }
    const bkTick = () => new Promise((r) => setTimeout(r, 0));   // nhường luồng chính để vòng xoay kịp vẽ

    // ---------- IndexedDB ----------
    let bkDbP = null;
    function bkDb() {
      if (bkDbP) return bkDbP;
      bkDbP = new Promise((resolve, reject) => {
        if (!window.indexedDB) { reject(new Error('Trình duyệt này không hỗ trợ IndexedDB')); return; }
        const req = indexedDB.open(BK_DB_NAME, 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          db.createObjectStore('books', { keyPath: 'id' });
          const cs = db.createObjectStore('chapters', { keyPath: 'key' });
          cs.createIndex('bookId', 'bookId', { unique: false });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { bkDbP = null; reject(req.error); };
      });
      return bkDbP;
    }
    const bkReq = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const bkTxDone = (tx) => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Giao dịch bị hủy')); });

    async function bkDbListBooks() {
      const db = await bkDb();
      return bkReq(db.transaction('books', 'readonly').objectStore('books').getAll());
    }
    async function bkDbGetChapters(bookId) {
      const db = await bkDb();
      const rows = await bkReq(db.transaction('chapters', 'readonly').objectStore('chapters').index('bookId').getAll(bookId));
      return rows.sort((a, b) => a.idx - b.idx);
    }
    async function bkDbSaveBook(meta, chapterRecs) {
      const db = await bkDb();
      const tx = db.transaction(['books', 'chapters'], 'readwrite');
      tx.objectStore('books').put(meta);
      if (chapterRecs) { const cs = tx.objectStore('chapters'); chapterRecs.forEach((r) => cs.put(r)); }
      return bkTxDone(tx);
    }
    async function bkDbDeleteBook(id) {
      const db = await bkDb();
      const tx = db.transaction(['books', 'chapters'], 'readwrite');
      tx.objectStore('books').delete(id);
      const cs = tx.objectStore('chapters');
      const keys = await bkReq(cs.index('bookId').getAllKeys(id)).catch(() => []);
      (keys || []).forEach((k) => cs.delete(k));
      return bkTxDone(tx);
    }

    // chuyển giữa dạng lưu (gọn) <-> dạng trong bộ nhớ (đủ trường cho code cũ)
    function bkHydrateChapter(rec) {
      const s = (rec.s || []).map((x, i) => {
        const o = { id: i + 1, text: x.t, p: x.p || 0, startTime: i, endTime: i + 1 };
        if (x.v) o.vi = x.v;
        if (x.h) o.h = 1;
        if (x.e) o.e = 1;
        return o;
      });
      return { idx: rec.idx, title: rec.title, s, words: rec.words || s.reduce((a, x) => a + bkWc(x.text), 0), lv: rec.lv || 0, pa: rec.pa || [] };
    }
    function bkDehydrateChapter(bookId, ch) {
      return {
        key: `${bookId}:${ch.idx}`, bookId, idx: ch.idx, title: ch.title, words: ch.words, lv: ch.lv || 0, pa: ch.pa || [],
        s: ch.s.map((x) => { const o = { t: x.text, p: x.p || 0 }; if (x.vi && String(x.vi).trim()) o.v = String(x.vi).trim(); if (x.h) o.h = 1; if (x.e) o.e = 1; return o; })
      };
    }
    async function bkRefreshLibrary() {
      try { bkLibrary = (await bkDbListBooks()).sort((a, b) => (b.openedAt || b.createdAt || 0) - (a.openedAt || a.createdAt || 0)); }
      catch (e) { bkLibrary = []; }
      bkRenderLibrary();
    }

    // =====================================================================================
    // ==================== PHÂN TÍCH VĂN BẢN → KHỐI (block) → CHƯƠNG ====================
    // Khối: { k:'p', text } hoặc { k:'h', lvl, src:'md'|'kw'|'caps'|'h'|'size', text, toc? }
    // =====================================================================================
    const BK_KW_RE = /^(chapter|chương|chuong|part|phần|phan|book|section|lesson|unit)\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b(?:[\s:.\-–—|]+.*)?$/i;
    const BK_KW_SOLO = /^(prologue|epilogue|introduction|foreword|preface|afterword|appendix(?:\s+[a-z0-9]+)?|conclusion|acknowledg(?:e)?ments?|about the author|author'?s note|preamble|lời nói đầu|lời tựa|lời giới thiệu|mở đầu|kết luận|phụ lục|lời cảm ơn)\s*[:.]?$/i;
    const BK_SKIP_TITLE = /^(sources?|references|further reading|next on .+|important notes? on this book.*|disclaimer|table of contents|contents|copyright(?:\s+page)?|about the author|about the authors|also by.*|also by.*|praise for.*|title page|cover|half title|about the publisher|about the author|mục lục|bản quyền|colophon|dedication|acknowledg(e)?ments?|notes?|index|bibliography|endnotes?|credits|newsletter|sign up.*|further reading|permissions)$/i;

    function bkHeadingOf(line) {
      const t = String(line || '').trim();
      if (!t || t.length > 120) return null;
      let m = /^(#{1,6})\s+(.+?)\s*#*$/.exec(t);
      if (m) return { lvl: m[1].length, src: 'md', text: m[2].trim() };
      const wc = bkWc(t);
      if (t.length <= 90 && (BK_KW_RE.test(t) || BK_KW_SOLO.test(t)) && (!/[.!?]$/.test(t) || wc <= 6)) return { lvl: 1, src: 'kw', text: t.replace(/\s*[:.]$/, '') };
      const letters = t.replace(/[^A-Za-zÀ-ỹ]/g, '');
      if (letters.length >= 3 && t.length <= 70 && letters === letters.toUpperCase() && !/[.!?]$/.test(t) && wc <= 10 && !/^\d+$/.test(t)) return { lvl: 2, src: 'caps', text: t };
      return null;
    }

    function bkCleanInline(t) {
      return String(t || '')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/(\*\*|__)(.+?)\1/g, '$2')
        .replace(/(^|[\s(“"'])[*_]([^*_\s][^*_]*?)[*_](?=$|[\s.,;:!?)”"'])/g, '$1$2')
        .replace(/^\s*>\s?/, '')
        .replace(/\s+/g, ' ').trim();
    }

    function bkStripGutenberg(raw) {
      const t = String(raw || '');
      const m = /\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK\s*(.*?)\s*\*\*\*/i.exec(t);
      if (!m) return { text: t };
      const head = t.slice(0, m.index);
      const gt = /^\s*Title:\s*(.+)$/im.exec(head), ga = /^\s*Author:\s*(.+)$/im.exec(head);
      let body = t.slice(m.index + m[0].length);
      const e = /\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK/i.exec(body);
      if (e) body = body.slice(0, e.index);
      return { text: body, title: gt ? gt[1].trim() : '', author: ga ? ga[1].trim() : '' };
    }

    function bkBlocksFromText(raw) {
      const text = String(raw || '').replace(/\r\n?/g, '\n').replace(/^\uFEFF/, '').replace(/[\u200b\u200c\u200d\u00ad]/g, '').replace(/\u00a0/g, ' ');
      const lens = text.split('\n').map((l) => l.trim().length).filter(Boolean).sort((a, b) => a - b);
      const p95 = lens[Math.floor(lens.length * 0.95)] || 0, med = lens[Math.floor(lens.length / 2)] || 0;
      const hardWrap = p95 <= 110 && med >= 40;   // văn bản ngắt dòng cứng (kiểu Project Gutenberg): nối các dòng trong cùng 1 đoạn
      const blocks = [];
      const BUL = /^\s*(?:[-*•–]|\d{1,3}[.)])\s+/;
      const pushParas = (buf) => {
        if (!buf.length) return;
        if (buf.length >= 2 && buf.filter((l) => BUL.test(l)).length >= buf.length * 0.6) { buf.forEach((l) => { const c = bkCleanInline(l.replace(BUL, '')); if (c) blocks.push({ k: 'p', text: c }); }); return; }
        if (hardWrap || buf.length === 1) {
          let out = '';
          buf.forEach((l) => { if (!out) out = l; else if (/[a-z]-$/.test(out) && /^[a-z]/.test(l)) out = out.slice(0, -1) + l; else out += ' ' + l; });
          const c = bkCleanInline(out); if (c) blocks.push({ k: 'p', text: c });
        } else buf.forEach((l) => { const c = bkCleanInline(l); if (c) blocks.push({ k: 'p', text: c }); });
      };
      text.split(/\n[ \t]*\n+/).forEach((rb) => {
        const ls = rb.split('\n').map((l) => l.trim()).filter(Boolean);
        if (!ls.length) return;
        let buf = [];
        for (let i = 0; i < ls.length; i++) {
          const h = bkHeadingOf(ls[i]);
          const ok = h && (h.src === 'md' || h.src === 'kw' || ls.length === 1);
          if (ok) {
            pushParas(buf); buf = [];
            let title = h.text;
            if (h.src === 'kw' && i + 1 < ls.length && ls.length <= 4 && ls[i + 1].length <= 80 && !/[.!?]$/.test(ls[i + 1]) && !bkHeadingOf(ls[i + 1])) { title += ': ' + ls[i + 1]; i++; }
            blocks.push({ k: 'h', lvl: h.lvl, src: h.src, text: bkCleanInline(title) });
          } else buf.push(ls[i]);
        }
        pushParas(buf);
      });
      return blocks;
    }

    // HTML (file .html hoặc 1 tài liệu trong EPUB) → khối.
    // marks: các mục của mục lục trỏ vào tài liệu này ({frag,label,depth,uid}); mỗi mục được chèn thành 1 khối
    // {k:'h', src:'toc'} đúng tại vị trí neo (id) của nó, nên nhiều bài trong CÙNG 1 file vẫn cắt riêng được.
    const BK_LEAF = new Set(['P', 'LI', 'PRE', 'FIGCAPTION', 'DT', 'DD', 'BLOCKQUOTE', 'TD', 'TH', 'CAPTION']);
    const BK_BLOCKISH = 'p,div,h1,h2,h3,h4,h5,h6,li,ul,ol,blockquote,table,tr,pre,section,article,dl';
    const bkNorm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9\u00c0-\u1ef9]+/g, '');
    function bkBlocksFromDom(root, marks) {
      marks = marks || [];
      root.querySelectorAll('script,style,nav,noscript,svg,head,sup,[epub\\:type="noteref"],[role="doc-noteref"]').forEach((e) => e.remove());
      root.querySelectorAll('a').forEach((a) => { if (/^\[?\d{1,3}\]?$/.test((a.textContent || '').trim()) && /#/.test(a.getAttribute('href') || '')) a.remove(); });
      const doc = root.ownerDocument, byId = {}, startMarks = [];
      marks.forEach((m) => { if (m.frag && doc.getElementById(m.frag)) (byId[m.frag] = byId[m.frag] || []).push(m); else startMarks.push(m); });
      const out = []; let buf = '', pend = '';
      const clean = (t) => t.replace(/\s*\[\d{1,3}(?:\s*[,–-]\s*\d{1,3})*\]/g, '');
      const same = (t) => { const a = bkNorm(t); return !!pend && !!a && (a === pend || (a.length > 3 && pend.length > 3 && (pend.startsWith(a) || a.startsWith(pend)))); };
      const pushMark = (m) => { if (m.done) return; m.done = true; out.push({ k: 'h', lvl: 1, src: 'toc', toc: true, uid: m.uid, depth: m.depth, text: m.label }); pend = bkNorm(m.label); };
      const addP = (t, epi) => { t = clean(t).replace(/\s+/g, ' ').trim(); if (!t) return; if (same(t)) { pend = ''; return; } pend = ''; const b = { k: 'p', text: t }; if (epi) b.epi = true; out.push(b); };
      const addH = (t, lvl) => { t = t.replace(/\s+/g, ' ').trim(); if (!t) return; if (same(t)) { pend = ''; return; } pend = ''; out.push({ k: 'h', lvl, src: 'h', text: t }); };
      const flush = () => { const t = buf; buf = ''; addP(t); };
      const fire = (el, deep) => {
        if (el.id && byId[el.id]) { flush(); byId[el.id].forEach(pushMark); }
        if (deep && el.querySelectorAll) el.querySelectorAll('[id]').forEach((x) => { if (byId[x.id]) { flush(); byId[x.id].forEach(pushMark); } });
      };
      startMarks.forEach(pushMark);
      const walk = (node) => {
        node.childNodes.forEach((c) => {
          if (c.nodeType === 3) { buf += c.nodeValue; return; }
          if (c.nodeType !== 1) return;
          const tag = c.tagName;
          if (tag === 'BR') { buf += ' '; return; }
          if (tag === 'IMG') return;
          const hasBlock = !!c.querySelector(BK_BLOCKISH), isHead = /^H[1-6]$/.test(tag);
          const leaf = isHead || (BK_LEAF.has(tag) && !hasBlock);
          fire(c, leaf);
          if (isHead) { flush(); addH(c.textContent || '', +tag[1]); return; }
          if (leaf) { flush(); addP(c.textContent || '', /callout|epigraph|pull-?quote/i.test(c.getAttribute('class') || '')); return; }
          if (hasBlock || /^(DIV|SECTION|ARTICLE|UL|OL|TABLE|TBODY|THEAD|TR|DL|MAIN|BODY|ASIDE|HEADER|FOOTER|FIGURE|BLOCKQUOTE|LI|P)$/.test(tag)) { flush(); walk(c); flush(); return; }
          buf += c.textContent || '';
        });
      };
      walk(root); flush();
      return out;
    }

    // Chọn quy tắc ranh giới chương từ các tiêu đề tìm được, rồi cắt khối thành chương.
    const BK_PART_RE = /^(part|book|section|volume|act)\s+([0-9]+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)\b|^(bonus|appendix|appendices|extras?|epilogue|prologue)\s*$/i;
    const BK_BACK_RE = /^(about the authors?|sources?|appreciation|acknowledg(?:e)?ments?|notes|endnotes|bibliography|references|index|glossary|next on .*|also by .*)$/i;

    // Cắt chương đúng theo mục lục của sách. Cấp bậc (lv): 0 = Part, 1 = nhóm, 2 = bài.
    // Mục lục trống nội dung (trang "Part I", trang nhóm chỉ có 1 câu trích) được gộp vào bài đầu tiên phía sau
    // (câu trích thành "epigraph", tiêu đề hiện ở dòng breadcrumb) nhưng vẫn xuất hiện trong mục lục.
    function bkChapterizeToc(blocks) {
      const front = { title: 'Mở đầu', paras: [], front: true, skipDefault: true, lv: 0 };
      let cur = front; const ents = [];
      blocks.forEach((b) => {
        if (b.k === 'h' && b.src === 'toc') { cur = { uid: b.uid, title: String(b.text).replace(/\s+/g, ' ').trim(), depth: b.depth || 0, paras: [] }; ents.push(cur); }
        else if (b.k === 'h') cur.paras.push({ text: b.text, h: 1 });
        else { const p = { text: b.text }; if (b.epi) p.epi = true; cur.paras.push(p); }
      });
      const wc = (e) => e.paras.reduce((a, p) => a + bkWc(p.text), 0);
      ents.forEach((e) => { e.words = wc(e); });
      front.words = wc(front);
      const isDiv = (e, i) => e.depth === 0 && e.words < 40 && BK_PART_RE.test(e.title) && i < ents.length - 1;
      const flatParts = ents.some((e, i) => isDiv(e, i) && !(ents[i + 1].depth > e.depth));
      ents.forEach((e, i) => {
        e.div = isDiv(e, i);
        e.lv = e.div ? (flatParts ? 0 : e.depth) : (e.depth + (flatParts ? 1 : 0));
        if (flatParts && !e.div && e.depth === 0 && BK_BACK_RE.test(e.title)) e.lv = 0;   // phần cuối sách không thuộc "Bonus"
      });
      const chapters = []; let carry = []; const stack = [];
      ents.forEach((e, i) => {
        while (stack.length && stack[stack.length - 1].lv >= e.lv) stack.pop();
        const next = ents[i + 1], container = !!next && next.lv > e.lv;
        const node = { uid: e.uid, t: e.title, lv: e.lv };
        if (next && e.words < 40 && (e.div || container)) {
          const nt = bkNorm(e.title);
          carry = carry.concat(e.paras.filter((p) => bkNorm(p.text) !== nt).map((p) => Object.assign({}, p, { epi: true })));
          stack.push(node); return;
        }
        const paras = carry.concat(e.paras.filter((p, k) => !(k === 0 && bkNorm(p.text) === bkNorm(e.title))));
        carry = [];
        chapters.push({ uid: e.uid, title: e.title, lv: e.lv, paras, pathNodes: stack.slice() });
        if (container) stack.push(node);
      });
      if (carry.length && chapters.length) chapters[chapters.length - 1].paras = chapters[chapters.length - 1].paras.concat(carry);
      chapters.forEach((c) => { c.words = wc(c); });
      const all = [];
      if (front.words >= 60) all.push(front);
      chapters.forEach((c) => {
        if (c.words > BK_MAX_CH_WORDS) {
          const k = Math.max(2, Math.round(c.words / 4500));
          bkSplitParas(c.paras, Math.ceil(c.words / k)).forEach((ps, i, arr) => all.push(Object.assign({}, c, { title: `${c.title} (${i + 1}/${arr.length})`, paras: ps })));
        } else all.push(c);
      });
      all.forEach((c) => { c.words = wc(c); });
      return { chapters: all, bookTitle: '', toc: true };
    }

    // Dàn ý (mục lục có cấp bậc) cho các chương được chọn: tự thêm tiêu đề Part / nhóm còn thiếu.
    function bkBuildOutline(chosen) {
      const out = [], seen = new Set();
      chosen.forEach((c, i) => {
        (c.pathNodes || []).forEach((n) => { if (!seen.has(n.uid)) { seen.add(n.uid); out.push({ t: n.t, lv: n.lv, ch: i, own: false }); } });
        out.push({ t: c.title, lv: c.lv || 0, ch: i, own: true });
      });
      return out;
    }

    function bkChapterize(blocks, opts) {
      opts = opts || {};
      const mode = opts.mode || 'auto';
      if (mode !== 'size' && blocks.filter((b) => b.k === 'h' && b.src === 'toc').length >= 3) return bkChapterizeToc(blocks);
      const heads = blocks.filter((b) => b.k === 'h');
      let titleBlock = null, isBoundary = () => false;
      if (mode !== 'size' && heads.length) {
        const real = heads.filter((h) => h.src !== 'caps' && !h.toc);
        const byLvl = {};
        real.forEach((h) => { byLvl[h.lvl] = (byLvl[h.lvl] || 0) + 1; });
        let lvls = Object.keys(byLvl).map(Number).sort((a, b) => a - b);
        if (lvls.length > 1 && byLvl[lvls[0]] === 1 && real.find((h) => h.lvl === lvls[0]).src !== 'kw') {   // 1 tiêu đề cấp cao nhất duy nhất = tên sách
          titleBlock = real.find((h) => h.lvl === lvls[0]);
          lvls = lvls.slice(1);
        }
        let L = null, cum = 0;
        for (const l of lvls) { cum += byLvl[l]; if (cum >= 3 || (cum >= 2 && lvls.length === 1)) { L = l; break; } }
        if (L === null && lvls.length) L = lvls[lvls.length - 1];
        if (L !== null && cum >= 2) isBoundary = (h) => h.src !== 'caps' && h !== titleBlock && h.lvl <= L;
        else if (heads.filter((h) => h.src === 'caps').length >= 3) isBoundary = (h) => h.src === 'caps';
      }
      if (!titleBlock && opts.wantTitle) titleBlock = null;
      let chapters = [], cur = { title: opts.frontTitle || 'Mở đầu', paras: [], front: true };
      blocks.forEach((b) => {
        if (b === titleBlock) return;
        if (b.k === 'h' && (b.toc || isBoundary(b))) {
          if (cur.paras.length || !cur.front) chapters.push(cur);
          cur = { title: b.text, paras: [], front: false };
        } else if (b.k === 'h') {
          // "Chapter 3" + dòng phụ đề ngay bên dưới → "Chapter 3: Phụ đề"
          if (!cur.paras.length && !cur.front && BK_KW_RE.test(cur.title) && cur.title.length < 28 && !/[:–—]/.test(cur.title) && b.src !== 'caps' && b.text.length < 90) cur.title += ': ' + b.text;
          else cur.paras.push({ text: b.text, h: 1 });
        }
        else cur.paras.push({ text: b.text });
      });
      chapters.push(cur);
      chapters.forEach((c) => { c.words = c.paras.reduce((a, p) => a + bkWc(p.text), 0); });

      // Chương rỗng/rất ngắn (trang "Part 1", dòng mục lục): ≥3 mục rỗng liên tiếp = mục lục -> bỏ; còn lại gộp thành tiêu đề phụ của chương kế
      const merged = [];
      for (let i = 0; i < chapters.length; i++) {
        const c = chapters[i];
        if (c.front && c.words < 60) continue;
        if (c.words < 25 && !c.front && i < chapters.length - 1 && !BK_SKIP_TITLE.test((c.title || '').trim())) {
          let j = i; while (j < chapters.length - 1 && chapters[j].words < 25 && !chapters[j].front) j++;
          if (j - i >= 3) { i = j - 1; continue; }
          const carry = [];
          for (let k = i; k < j; k++) { carry.push({ text: chapters[k].title, h: 1 }); chapters[k].paras.forEach((p) => carry.push(p)); }
          chapters[j].paras = carry.concat(chapters[j].paras);
          chapters[j].words = chapters[j].paras.reduce((a, p) => a + bkWc(p.text), 0);
          i = j - 1; continue;
        }
        merged.push(c);
      }
      chapters = merged.filter((c) => c.paras.length);

      // chia đều theo độ dài khi không có tiêu đề (hoặc người dùng chọn), và chia nhỏ chương quá dài
      const out = [];
      if (mode === 'size' || (chapters.length === 1 && chapters[0].front && chapters[0].words > BK_MAX_CH_WORDS)) {
        const all = []; chapters.forEach((c) => c.paras.forEach((p) => all.push(p)));
        bkSplitParas(all, BK_SIZE_PART_WORDS).forEach((ps, i) => out.push({ title: `Phần ${i + 1}`, paras: ps }));
      } else {
        chapters.forEach((c) => {
          if (c.words > BK_MAX_CH_WORDS) {
            const k = Math.max(2, Math.round(c.words / 4500));
            bkSplitParas(c.paras, Math.ceil(c.words / k)).forEach((ps, i, arr) => out.push({ title: `${c.title} (${i + 1}/${arr.length})`, paras: ps }));
          } else out.push({ title: c.title, paras: c.paras });
        });
      }
      out.forEach((c) => { c.words = c.paras.reduce((a, p) => a + bkWc(p.text), 0); });
      return { chapters: out, bookTitle: titleBlock ? titleBlock.text : '' };
    }

    function bkSplitParas(paras, target) {
      const parts = []; let cur = [], w = 0;
      paras.forEach((p) => {
        cur.push(p); w += bkWc(p.text);
        if (w >= target) { parts.push(cur); cur = []; w = 0; }
      });
      if (cur.length) { if (parts.length && w < target * 0.4) parts[parts.length - 1] = parts[parts.length - 1].concat(cur); else parts.push(cur); }
      return parts;
    }

    // đoạn văn → các câu (dùng lại bộ tách câu của chế độ "văn bản" để cách tách luôn nhất quán)
    function bkSplitSentences(text) {
      const r = splitProseIntoSentences(text);
      return r.length ? r.map((x) => x.text) : (String(text).trim() ? [String(text).trim()] : []);
    }
    // chương (đoạn) → bản ghi chương gồm câu
    function bkBuildChapterRec(ch, idx) {
      const s = []; let p = 0;
      ch.paras.forEach((pa) => {
        const parts = pa.h ? [pa.text] : bkSplitSentences(pa.text);
        parts.forEach((t) => { const o = { id: s.length + 1, text: t, p, startTime: s.length, endTime: s.length + 1 }; if (pa.h) o.h = 1; if (pa.epi) o.e = 1; s.push(o); });
        p++;
      });
      return { idx, title: ch.title, s, words: s.reduce((a, x) => a + bkWc(x.text), 0), lv: ch.lv || 0, pa: (ch.pathNodes || []).map((n) => n.t) };
    }

    // =====================================================================================
    // ==================== EPUB (tự giải nén ZIP, không cần thư viện ngoài) ====================
    // =====================================================================================
    function bkZipEntries(u8) {
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      let eocd = -1;
      for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
      if (eocd < 0) throw new Error('File không phải EPUB/ZIP hợp lệ.');
      const total = dv.getUint16(eocd + 10, true);
      let off = dv.getUint32(eocd + 16, true);
      const entries = {}, dec = new TextDecoder();
      for (let n = 0; n < total; n++) {
        if (dv.getUint32(off, true) !== 0x02014b50) break;
        const method = dv.getUint16(off + 10, true), csize = dv.getUint32(off + 20, true);
        const nlen = dv.getUint16(off + 28, true), elen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true);
        const lho = dv.getUint32(off + 42, true);
        entries[dec.decode(u8.subarray(off + 46, off + 46 + nlen))] = { method, csize, lho };
        off += 46 + nlen + elen + clen;
      }
      return entries;
    }
    async function bkZipRead(u8, e) {
      const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
      const start = e.lho + 30 + dv.getUint16(e.lho + 26, true) + dv.getUint16(e.lho + 28, true);
      const data = u8.subarray(start, start + e.csize);
      if (e.method === 0) return data;
      if (typeof DecompressionStream === 'undefined') throw new Error('Trình duyệt quá cũ để mở EPUB (cần Chrome/Edge/Firefox/Safari bản mới).');
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }
    function bkDirOf(p) { const i = p.lastIndexOf('/'); return i < 0 ? '' : p.slice(0, i + 1); }
    function bkResolvePath(base, href) {
      href = decodeURIComponent(String(href || '').split('#')[0]);
      const parts = (href.startsWith('/') ? href.slice(1) : base + href).split('/'), out = [];
      parts.forEach((s) => { if (s === '..') out.pop(); else if (s !== '.' && s !== '') out.push(s); });
      return out.join('/');
    }

    async function bkParseEpub(buf) {
      const u8 = new Uint8Array(buf), entries = bkZipEntries(u8), dec = new TextDecoder('utf-8');
      const readText = async (name) => { const e = entries[name]; if (!e) return null; return dec.decode(await bkZipRead(u8, e)); };
      const cont = await readText('META-INF/container.xml');
      if (!cont) throw new Error('EPUB thiếu META-INF/container.xml');
      const opfPath = (/full-path\s*=\s*"([^"]+)"/.exec(cont) || [])[1];
      const opfText = opfPath && await readText(opfPath);
      if (!opfText) throw new Error('Không đọc được file OPF trong EPUB.');
      const base = bkDirOf(opfPath), opf = new DOMParser().parseFromString(opfText, 'text/xml');
      const q = (sel) => Array.from(opf.querySelectorAll(sel));
      const meta = (n) => { const e = q(`metadata > *`).find((x) => (x.localName || '').toLowerCase() === n); return e ? e.textContent.trim() : ''; };
      const manifest = {};
      q('manifest > item').forEach((it) => { manifest[it.getAttribute('id')] = { href: bkResolvePath(base, it.getAttribute('href')), type: it.getAttribute('media-type') || '', props: it.getAttribute('properties') || '' }; });
      const spine = q('spine > itemref').filter((r) => (r.getAttribute('linear') || 'yes') !== 'no').map((r) => manifest[r.getAttribute('idref')]).filter(Boolean);

      // Mục lục (nav EPUB3 hoặc NCX EPUB2) → danh sách phẳng có độ sâu: { label, file, frag, depth }
      const tocEntries = [];
      const addToc = (baseDir, href, label, depth) => {
        label = String(label || '').replace(/\s+/g, ' ').trim();
        if (!href || !label) return;
        const hi = href.indexOf('#'), frag = hi >= 0 ? decodeURIComponent(href.slice(hi + 1)) : '';
        tocEntries.push({ label, file: bkResolvePath(baseDir, href), frag, depth });
      };
      const kids = (el, name) => Array.from(el.children).filter((x) => (x.localName || '').toLowerCase() === name);
      const navItem = Object.values(manifest).find((m) => /\bnav\b/.test(m.props));
      if (navItem && entries[navItem.href]) {
        const nd = new DOMParser().parseFromString(await readText(navItem.href), 'text/html'), nb = bkDirOf(navItem.href);
        const nav = nd.querySelector('nav[epub\\:type="toc"], nav#toc, nav') || nd;
        const walkOl = (ol, depth) => kids(ol, 'li').forEach((li) => {
          const a = Array.from(li.children).find((x) => /^(a|span)$/i.test(x.localName || ''));
          const href = a && a.getAttribute('href');
          if (href) addToc(nb, href, a.textContent, depth);
          kids(li, 'ol').forEach((sub) => walkOl(sub, depth + (href ? 1 : 0)));
        });
        const ol = nav.querySelector('ol');
        if (ol) walkOl(ol, 0);
      }
      if (!tocEntries.length) {
        const ncx = Object.values(manifest).find((m) => /ncx/.test(m.type));
        if (ncx && entries[ncx.href]) {
          const nd = new DOMParser().parseFromString(await readText(ncx.href), 'text/xml'), nb = bkDirOf(ncx.href);
          const walkNp = (np, depth) => {
            const lab = kids(np, 'navlabel')[0], ct = kids(np, 'content')[0];
            if (lab && ct) addToc(nb, ct.getAttribute('src'), lab.textContent, depth);
            kids(np, 'navpoint').forEach((c) => walkNp(c, depth + 1));
          };
          const nm = nd.querySelector('navMap');
          if (nm) kids(nm, 'navpoint').forEach((np) => walkNp(np, 0));
        }
      }
      tocEntries.forEach((e, i) => { e.uid = i; });
      const byFile = {};
      tocEntries.forEach((e) => { (byFile[e.file] = byFile[e.file] || []).push(e); });

      const blocks = [];
      for (let i = 0; i < spine.length; i++) {
        const it = spine[i];
        if (!/html|xml/.test(it.type) || /\bnav\b/.test(it.props) || !entries[it.href]) continue;
        const html = await readText(it.href);
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const bl = bkBlocksFromDom(doc.body || doc.documentElement, byFile[it.href] || []);
        if (bl.length) blocks.push.apply(blocks, bl);
        if (i % 6 === 0) { bkLoading(true, `Đang đọc EPUB... (${i + 1}/${spine.length})`); await bkTick(); }
      }
      return { blocks, title: meta('title'), author: meta('creator') };
    }

    // =====================================================================================
    // ==================== PDF (nạp pdf.js từ CDN khi cần) ====================
    // =====================================================================================
    function bkLoadPdfJs() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        s.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(window.pdfjsLib); } catch (e) { reject(e); } };
        s.onerror = () => reject(new Error('Không tải được thư viện đọc PDF (cần kết nối internet). Bạn có thể dùng bản EPUB hoặc TXT của sách.'));
        document.head.appendChild(s);
      });
    }

    async function bkParsePdf(buf) {
      const lib = await bkLoadPdfJs();
      const pdf = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
      const pages = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n), tc = await page.getTextContent();
        const lines = []; let cur = null;
        tc.items.forEach((it) => {
          if (typeof it.str !== 'string' || !it.transform) return;
          const x = it.transform[4], y = it.transform[5], size = Math.hypot(it.transform[0], it.transform[1]) || it.height || 10;
          if (!it.str.trim() && !cur) return;
          if (!cur || Math.abs(y - cur.y) > Math.max(2, size * 0.45)) { cur = { y, x0: x, x1: x + (it.width || 0), size, text: '' }; lines.push(cur); }
          if (cur.text && !/\s$/.test(cur.text) && !/^\s/.test(it.str) && x - cur.x1 > size * 0.12) cur.text += ' ';
          cur.text += it.str; cur.x1 = Math.max(cur.x1, x + (it.width || 0)); cur.size = Math.max(cur.size, size);
        });
        pages.push({ lines: lines.map((l) => Object.assign(l, { text: l.text.replace(/\s+/g, ' ').trim() })).filter((l) => l.text), w: page.view[2] - page.view[0] });
        if (n % 5 === 0 || n === pdf.numPages) { bkLoading(true, `Đang đọc PDF... (${n}/${pdf.numPages} trang)`); await bkTick(); }
      }
      // cỡ chữ thân bài = cỡ chiếm nhiều ký tự nhất (tính trên toàn bộ trước khi lọc)
      const sizeChars = {};
      pages.forEach((pg) => pg.lines.forEach((l) => { const k = Math.round(l.size * 2) / 2; sizeChars[k] = (sizeChars[k] || 0) + l.text.length; }));
      const body = +Object.keys(sizeChars).sort((a, b) => sizeChars[b] - sizeChars[a])[0] || 10;
      // bỏ đầu trang / chân trang lặp lại và số trang (KHÔNG đụng tới tiêu đề: chữ lớn hơn thân bài hoặc dạng "Chapter 7")
      const keyOf = (t) => t.toLowerCase().replace(/\d+/g, '#');
      const isTitleLike = (l) => l.size > body * 1.1 || BK_KW_RE.test(l.text) || BK_KW_SOLO.test(l.text);
      const freq = {};
      pages.forEach((pg) => { const edge = pg.lines.slice(0, 2).concat(pg.lines.slice(-2)); new Set(edge.filter((l) => !isTitleLike(l)).map((l) => keyOf(l.text))).forEach((k) => { freq[k] = (freq[k] || 0) + 1; }); });
      const need = Math.max(4, pages.length * 0.3);
      pages.forEach((pg) => {
        const n = pg.lines.length;
        pg.lines = pg.lines.filter((l, i) => {
          const edge = i < 2 || i >= n - 2;
          if (!edge) return true;
          if (/^(page\s+)?[-–—]?\s*\d{1,4}\s*[-–—]?$/i.test(l.text)) return false;
          if (isTitleLike(l)) return true;
          return !(freq[keyOf(l.text)] >= need);
        });
      });
      const headSizes = Array.from(new Set([].concat(...pages.map((pg) => pg.lines.filter((l) => l.size > body * 1.22 && l.text.length <= 110).map((l) => Math.round(l.size)))))).sort((a, b) => b - a);

      const blocks = []; let para = '', prev = null, newPage = false;
      const flushPara = () => { const t = para.trim(); para = ''; if (!t) return; const h = t.length <= 90 && bkHeadingOf(t); if (h && h.src === 'kw') blocks.push({ k: 'h', lvl: 1, src: 'kw', text: h.text }); else blocks.push({ k: 'p', text: t }); };
      pages.forEach((pg) => {
        const xs = pg.lines.map((l) => l.x0).sort((a, b) => a - b), xe = pg.lines.map((l) => l.x1).sort((a, b) => a - b);
        const left = xs[Math.floor(xs.length * 0.1)] || 0, right = xe[Math.floor(xe.length * 0.9)] || pg.w;
        const gaps = []; for (let i = 1; i < pg.lines.length; i++) { const g = pg.lines[i - 1].y - pg.lines[i].y; if (g > 0) gaps.push(g); }
        gaps.sort((a, b) => a - b);
        const spacing = gaps[Math.floor(gaps.length / 2)] || body * 1.3;
        newPage = true;
        pg.lines.forEach((l, i) => {
          if (l.size > body * 1.22 && l.text.length <= 110) {
            flushPara();
            const lvl = Math.max(1, headSizes.indexOf(Math.round(l.size)) + 1), last = blocks[blocks.length - 1];
            if (last && last.k === 'h' && last.src === 'size' && last.lvl === lvl && !newPage) last.text += ' ' + l.text;
            else if (last && last.k === 'h' && last.src === 'size' && last.lvl === lvl && prev && prev.size === l.size && Math.abs(prev.y - l.y) < l.size * 2.2) last.text += ' ' + l.text;
            else blocks.push({ k: 'h', lvl, src: 'size', text: l.text });
            prev = l; newPage = false; return;
          }
          let np = !para;
          if (!np) {
            const ends = /[.!?:”"’')\]]$/.test(para.trim());
            const gap = !newPage && prev ? prev.y - l.y : 0;
            const indent = l.x0 - left > body * 0.9;
            const shortPrev = prev && prev.x1 < right - pg.w * 0.07;
            if (gap > spacing * 1.55) np = true;
            else if (indent && ends) np = true;
            else if (shortPrev && ends && !newPage) np = true;
            else if (newPage && ends && /^[A-Z“"‘']/.test(l.text)) np = true;
          }
          if (np) { flushPara(); para = l.text; }
          else if (/[a-z]-$/.test(para) && /^[a-z]/.test(l.text)) para = para.slice(0, -1) + l.text;
          else para += ' ' + l.text;
          prev = l; newPage = false;
        });
      });
      flushPara();
      let meta = {};
      try { meta = (await pdf.getMetadata()).info || {}; } catch (e) {}
      const junk = /^(untitled|anonymous|unknown|none|null|user|admin|author|title)\b|^microsoft|\.(docx?|indd|pdf|tex|pages)$/i;
      const clean = (v) => { v = String(v || '').trim(); return (!v || junk.test(v)) ? '' : v; };
      return { blocks, title: clean(meta.Title), author: clean(meta.Author) };
    }

    // =====================================================================================
    // ==================== LUỒNG NHẬP SÁCH: chọn file → phân tích → xem trước → lưu ====================
    // =====================================================================================
    let bkImp = null;   // { blocks, fmt, fileName, title, author, chapters:[{title,paras,words,on}], mode }

    function bkInitImport() {
      const drop = document.getElementById('bk-drop'), inp = document.getElementById('bk-file');
      if (!drop || !inp) return;
      drop.addEventListener('click', () => inp.click());
      drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
      ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
      ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); }));
      drop.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) bkHandleFile(f); });
      inp.addEventListener('change', () => { if (inp.files && inp.files[0]) bkHandleFile(inp.files[0]); inp.value = ''; });
    }

    async function bkHandleFile(file) {
      const name = file.name || 'sach', ext = (name.split('.').pop() || '').toLowerCase();
      const base = name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
      bkLoading(true, 'Đang đọc file...');
      await bkTick();
      try {
        let parsed;
        if (ext === 'json') {
          const obj = JSON.parse(await file.text());
          bkLoading(false);
          return bkImportBackup(obj);
        } else if (ext === 'epub') parsed = Object.assign({ fmt: 'epub' }, await bkParseEpub(await file.arrayBuffer()));
        else if (ext === 'pdf') parsed = Object.assign({ fmt: 'pdf' }, await bkParsePdf(await file.arrayBuffer()));
        else if (ext === 'html' || ext === 'htm') {
          const doc = new DOMParser().parseFromString(await file.text(), 'text/html');
          const t = (doc.querySelector('title') || {}).textContent || '';
          parsed = { fmt: 'html', blocks: bkBlocksFromDom(doc.body || doc.documentElement), title: t.trim() };
        } else {
          const g = bkStripGutenberg(await file.text());
          parsed = { fmt: ext === 'md' || ext === 'markdown' ? 'md' : 'txt', blocks: bkBlocksFromText(g.text), title: g.title || '', author: g.author || '' };
        }
        if (!parsed.blocks || !parsed.blocks.length) throw new Error('Không tìm thấy nội dung chữ trong file này (nếu là PDF scan ảnh thì cần OCR trước).');
        bkLoading(false);
        bkOpenImportPreview(parsed, base);
      } catch (e) {
        console.error(e);
        bkLoading(false);
        alert('Không nạp được sách: ' + (e && e.message ? e.message : e));
      }
    }

    function bkImportPasted() {
      const text = (document.getElementById('bk-paste-text').value || '').trim();
      if (!text) { bkToast('Hãy dán nội dung sách vào ô bên dưới trước đã'); return; }
      const blocks = bkBlocksFromText(text);
      if (!blocks.length) { bkToast('Không nhận ra nội dung nào trong văn bản đã dán'); return; }
      bkOpenImportPreview({ fmt: 'txt', blocks }, (document.getElementById('bk-paste-title').value || '').trim() || 'Sách của tôi');
    }

    function bkOpenImportPreview(parsed, fallbackTitle) {
      bkImp = { blocks: parsed.blocks, fmt: parsed.fmt, mode: 'auto', chapters: [] };
      document.getElementById('bk-imp-title').value = parsed.title || '';
      document.getElementById('bk-imp-author').value = parsed.author || '';
      document.getElementById('bk-imp-mode').value = 'auto';
      bkImportRechunk();
      if (!document.getElementById('bk-imp-title').value.trim()) document.getElementById('bk-imp-title').value = fallbackTitle || '';
      if (!document.getElementById('bk-imp-author').value.trim()) {
        for (let i = 0; i < Math.min(8, parsed.blocks.length); i++) {
          const b = parsed.blocks[i], m = b.k === 'p' && /^by\s+([A-Z][^.!?]{2,60})$/i.exec(b.text);
          if (m) { document.getElementById('bk-imp-author').value = m[1].trim(); break; }
        }
      }
      document.getElementById('bk-import-modal').classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    function bkImportRechunk() {
      if (!bkImp) return;
      const mode = document.getElementById('bk-imp-mode').value;
      const res = bkChapterize(bkImp.blocks, { mode });
      bkImp.chapters = res.chapters.map((c) => Object.assign(c, { on: !c.skipDefault && !BK_SKIP_TITLE.test((c.title || '').trim()) }));
      if (res.bookTitle && !document.getElementById('bk-imp-title').value.trim()) document.getElementById('bk-imp-title').value = res.bookTitle;
      bkImportRenderList();
    }
    function bkImportRenderList() {
      const list = document.getElementById('bk-imp-list');
      list.innerHTML = bkImp.chapters.map((c, i) =>
        `<label class="bk-chrow${c.on ? '' : ' off'}" style="padding-left:${10 + (c.lv > 1 ? 14 : 0)}px"><input type="checkbox" data-i="${i}" ${c.on ? 'checked' : ''} /><span class="t">${bkEsc(c.title)}${c.pathNodes && c.pathNodes.length ? `<span style="color:#64748b;font-size:.7rem"> · ${bkEsc(c.pathNodes.map((n) => n.t).join(' › '))}</span>` : ''}</span><span class="w">${c.words.toLocaleString('en-US')} từ</span></label>`).join('');
      list.querySelectorAll('input').forEach((cb) => cb.addEventListener('change', () => { bkImp.chapters[+cb.dataset.i].on = cb.checked; cb.closest('.bk-chrow').classList.toggle('off', !cb.checked); bkImportSummary(); }));
      bkImportSummary();
    }
    function bkImportSummary() {
      const on = bkImp.chapters.filter((c) => c.on), w = on.reduce((a, c) => a + c.words, 0);
      document.getElementById('bk-imp-sum').textContent = `${on.length}/${bkImp.chapters.length} phần được chọn · ${w.toLocaleString('en-US')} từ · đọc khoảng ${Math.max(1, Math.round(w / 200 / 60 * 10) / 10)} giờ`;
    }
    function bkImpAll(on) { bkImp.chapters.forEach((c) => { c.on = on; }); bkImportRenderList(); }
    function bkImportCancel() { document.getElementById('bk-import-modal').classList.remove('open'); bkImp = null; }

    async function bkBuildBook(chosen, info) {
      const id = info.id || bkUid(), recs = [];
      let sent = 0, words = 0;
      for (let i = 0; i < chosen.length; i++) {
        const hy = bkBuildChapterRec(chosen[i], i);
        sent += hy.s.length; words += hy.words;
        recs.push(bkDehydrateChapter(id, hy));
        if (i % 10 === 9) await bkTick();
      }
      const now = Date.now();
      const meta = Object.assign({ id, title: info.title, author: info.author || '', createdAt: now, updatedAt: now, openedAt: now, chapterCount: recs.length, wordCount: words, sentCount: sent, pos: { ch: 0, i: 0 }, cur: null, glossary: '', batch: 'M', hue: bkHue(info.title), format: info.fmt, transWords: 0, chTitles: recs.map((r) => r.title), chWords: recs.map((r) => r.words), chTr: recs.map(() => 0) }, info.extra || {});
      meta.outline = bkBuildOutline(chosen);
      return { meta, recs };
    }

    async function bkImportConfirm() {
      if (!bkImp) return;
      const chosen = bkImp.chapters.filter((c) => c.on);
      if (!chosen.length) { bkToast('Hãy chọn ít nhất 1 phần để nhập'); return; }
      const title = (document.getElementById('bk-imp-title').value || '').trim() || 'Sách không tên';
      const author = (document.getElementById('bk-imp-author').value || '').trim();
      const fmt = bkImp.fmt;
      document.getElementById('bk-import-modal').classList.remove('open');
      bkLoading(true, 'Đang tách câu và lưu sách...');
      await bkTick();
      try {
        const { meta, recs } = await bkBuildBook(chosen, { title, author, fmt });
        const id = meta.id;
        await bkDbSaveBook(meta, recs);
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
        bkImp = null;
        await bkRefreshLibrary();
        bkLoading(false);
        document.getElementById('bk-paste-text').value = '';
        bkOpenBook(id);
      } catch (e) {
        console.error(e);
        bkLoading(false);
        alert('Không lưu được sách: ' + (e && e.message ? e.message : e) + '\n(Có thể bộ nhớ trình duyệt đã đầy.)');
      }
    }

    // ---------- sao lưu / khôi phục ----------
    async function bkExportBook(id) {
      try {
        const metas = await bkDbListBooks(), meta = metas.find((m) => m.id === id);
        if (!meta) return;
        const chs = await bkDbGetChapters(id);
        const blob = new Blob([JSON.stringify({ format: 'shadowing-book-v1', meta, chapters: chs })], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${(meta.title || 'sach').replace(/[^\w\-]+/g, '_').slice(0, 60)}.shadowbook.json`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      } catch (e) { bkToast('Không xuất được sách: ' + e.message); }
    }
    async function bkImportBackup(obj) {
      if (!obj || obj.format !== 'shadowing-book-v1' || !obj.meta || !Array.isArray(obj.chapters)) { alert('File .json này không phải bản sao lưu sách của app.'); return; }
      const exist = bkLibrary.find((b) => b.id === obj.meta.id);
      if (exist && !confirm(`Sách "${exist.title}" đã có trong thư viện. Ghi đè bằng bản sao lưu này?`)) return;
      const meta = Object.assign({}, obj.meta, { openedAt: Date.now() });
      const recs = obj.chapters.map((c) => Object.assign({}, c, { bookId: meta.id, key: `${meta.id}:${c.idx}` }));
      await bkDbSaveBook(meta, recs);
      await bkRefreshLibrary();
      bkToast(`Đã khôi phục sách “${meta.title}”`);
    }
    async function bkDeleteBook(id, e) {
      if (e) e.stopPropagation();
      const b = bkLibrary.find((x) => x.id === id);
      if (!b || !confirm(`Xóa sách "${b.title}" cùng toàn bộ bản dịch? Từ vựng đã lưu vẫn được giữ lại.`)) return;
      await bkDbDeleteBook(id);
      await bkRefreshLibrary();
    }

    // ---------- thư viện sách (trang chủ) ----------
    function bkCoverHtml(b) {
      const h = b.hue || bkHue(b.title);
      const img = b.thumb ? `<img src="${bkEsc(encodeURI(/^(https?:|data:|blob:|images\/)/.test(b.thumb) ? b.thumb : 'images/' + b.thumb))}" alt="" loading="lazy" onerror="this.remove()">` : '';
      return `<div class="bk-cover${b.thumb ? ' has-img' : ''}" style="background:linear-gradient(145deg,hsl(${h},62%,38%),hsl(${(h + 40) % 360},58%,22%))">${img}<span>${bkEsc((b.title || '').slice(0, 42))}</span></div>`;
    }
    function bkProgressOf(b) {
      const total = b.wordCount || 1, pos = b.pos || { ch: 0, i: 0 };
      let before = 0;
      if (b.chWords) { for (let i = 0; i < pos.ch; i++) before += b.chWords[i] || 0; }
      else before = total * (pos.ch / Math.max(1, b.chapterCount));
      return Math.max(0, Math.min(100, Math.round(before / total * 100)));
    }
    function bkRenderLibrary() {
      const host = document.getElementById('bk-lib');
      if (!host) return;
      const cnt = document.getElementById('bk-lib-count');
      const mine = bkLibrary.filter((b) => !b.sample);
      if (typeof bkRenderSamples === 'function') bkRenderSamples();
      if (cnt) cnt.textContent = mine.length ? `${mine.length} cuốn` : '';
      if (!mine.length) { host.innerHTML = '<div class="bk-empty" style="grid-column:1/-1">Chưa có cuốn sách nào. Hãy nạp file sách ở phía trên để bắt đầu.</div>'; return; }
      host.innerHTML = mine.map((b) => {
        const pr = bkProgressOf(b), tr = b.wordCount ? Math.min(100, Math.round((b.transWords || 0) / b.wordCount * 100)) : 0;
        return `<div class="bk-card" onclick="bkOpenBook('${b.id}')" title="Mở sách">
          <div class="bk-card-tools"><button type="button" class="bk-t-exp" title="Sao lưu (.json, kèm bản dịch)" onclick="event.stopPropagation(); bkExportBook('${b.id}')"><i data-lucide="download"></i></button><button type="button" title="Xóa sách" onclick="bkDeleteBook('${b.id}', event)"><i data-lucide="trash-2"></i></button></div>
          ${bkCoverHtml(b)}
          <div class="bk-card-body">
            <div class="bk-card-title">${bkEsc(b.title)}</div>
            <div class="bk-card-sub">${bkEsc(b.author || 'Không rõ tác giả')}</div>
            <div class="bk-card-meta"><span>${(b.chapterCount || 0)} chương</span><span>${((b.wordCount || 0) / 1000).toFixed(1)}k từ</span></div>
            <div class="bk-card-meta"><span>Đọc ${pr}%</span><span style="color:#fcd34d">Dịch ${tr}%</span></div>
            <div class="bk-bar"><i style="width:${pr}%"></i></div>
            <div class="bk-bar tr" style="margin-top:3px"><i style="width:${tr}%"></i></div>
          </div></div>`;
      }).join('');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    const bkEsc = (s) => escHtml(s);

    // =====================================================================================
    // ==================== ĐỌC SÁCH — PHẦN 2: GIAO DIỆN ĐỌC ====================
    // =====================================================================================
    const BK_PREF_KEY = 'shadowing_book_prefs_v1';
    const BK_DEF_PREFS = { theme: 'night', font: 'serif', size: 20, lh: 1.75, width: 760, align: 'left', lay: 'sent', hl: true, bi: false, ct: 3 };
    let bkPrefs = Object.assign({}, BK_DEF_PREFS, window.innerWidth < 640 ? { size: 18 } : {}, (() => { try { return JSON.parse(localStorage.getItem(BK_PREF_KEY) || '{}'); } catch (e) { return {}; } })());
    let bkBook = null;       // bản ghi sách đang mở (object meta từ IndexedDB)
    let bkChs = [];          // toàn bộ chương (dạng trong bộ nhớ)
    let bkPrefix = [];       // bkPrefix[i] = tổng số từ của các chương trước chương i
    let bkCh = 0;            // chương đang đọc
    let bkSEls = [];         // phần tử câu theo chỉ số câu của chương đang hiển thị
    let bkPEls = {};         // phần tử đoạn theo số đoạn (p)
    let bkSliding = false;

    const bkScrollEl = () => document.getElementById('bk-scroll');
    const bkContentEl = () => document.getElementById('bk-content');
    function bkActive() { const el = document.getElementById('screen-book'); return !!el && !el.classList.contains('hidden'); }
    // Vùng chứa chữ đang dùng cho tra nghĩa / lưu từ vựng (khung phụ đề của video, hoặc trang sách)
    function activeSubContainer() { return document.getElementById(bkActive() ? 'bk-content' : 'subtitles-scroll-container'); }

    function bkSavePrefs() { try { localStorage.setItem(BK_PREF_KEY, JSON.stringify(bkPrefs)); } catch (e) {} }

    // ---------- giao diện: nền, chữ, cỡ chữ... ----------
    function bkApplyPrefs() {
      const el = document.getElementById('screen-book');
      if (!el) return;
      el.dataset.theme = bkPrefs.theme; el.dataset.font = bkPrefs.font; el.dataset.align = bkPrefs.align; el.dataset.ct = String(bkPrefs.ct || 3);
      el.style.setProperty('--bk-size', bkPrefs.size + 'px');
      el.style.setProperty('--bk-lh', String(bkPrefs.lh));
      el.style.setProperty('--bk-width', bkPrefs.width + 'px');
      el.style.setProperty('--bk-align', bkPrefs.align === 'justify' ? 'justify' : 'left');
      const c = bkContentEl();
      if (c) { c.classList.toggle('bk-lay-par', bkPrefs.lay === 'par'); c.classList.toggle('bk-lay-sent', bkPrefs.lay !== 'par'); c.classList.toggle('sub-show-vi', !!bkPrefs.bi); }
      document.body.classList.toggle('bk-hl-saved', !!bkPrefs.hl);
      el.querySelectorAll('#bk-set [data-theme]').forEach((b) => b.classList.toggle('on', b.dataset.theme === bkPrefs.theme));
      el.querySelectorAll('#bk-set [data-font]').forEach((b) => b.classList.toggle('on', b.dataset.font === bkPrefs.font));
      el.querySelectorAll('#bk-set [data-width]').forEach((b) => b.classList.toggle('on', +b.dataset.width === +bkPrefs.width));
      el.querySelectorAll('#bk-set [data-align]').forEach((b) => b.classList.toggle('on', b.dataset.align === bkPrefs.align));
      el.querySelectorAll('#bk-set [data-lay]').forEach((b) => b.classList.toggle('on', b.dataset.lay === bkPrefs.lay));
      const hl = document.getElementById('bk-chk-hl'); if (hl) hl.checked = !!bkPrefs.hl;
      document.getElementById('bk-v-size').textContent = bkPrefs.size + 'px';
      document.getElementById('bk-v-lh').textContent = (+bkPrefs.lh).toFixed(2);
      document.getElementById('bk-v-ct').textContent = `${bkPrefs.ct || 3}/5 · ${['', 'Dịu', 'Thường', 'Rõ', 'Rất rõ', 'Đậm'][bkPrefs.ct || 3]}`;
      const bi = document.getElementById('bk-btn-bi'); if (bi) bi.classList.toggle('on', !!bkPrefs.bi);
    }
    function bkSetPref(k, v) {
      const a = bkAnchor();
      bkPrefs[k] = v; bkSavePrefs(); bkApplyPrefs();
      if (['size', 'lh', 'width', 'font', 'lay', 'align', 'ct'].indexOf(k) >= 0) bkRestoreAnchor(a);
      if (k === 'size' && bkDrawerOpen()) requestAnimationFrame(() => bkTocScrollToCurrent(true));   // chữ mục lục đổi theo → giữ mục đang đọc trong tầm nhìn
    }
    function bkStep(k, d) {
      if (k === 'size') bkSetPref('size', Math.max(14, Math.min(36, bkPrefs.size + d)));
      else if (k === 'ct') bkSetPref('ct', Math.max(1, Math.min(5, (bkPrefs.ct || 3) + d)));
      else bkSetPref('lh', Math.max(1.35, Math.min(2.3, Math.round((bkPrefs.lh + d * 0.05) * 100) / 100)));
    }
    function bkToggleSettings(force) {
      const el = document.getElementById('bk-set');
      const open = force === undefined ? !el.classList.contains('open') : !!force;
      el.classList.toggle('open', open);
      document.getElementById('bk-btn-set').classList.toggle('on', open);
      if (open) bkCloseDrawer();
    }
    function bkToggleFocus() {
      const s = document.getElementById('screen-book');
      s.classList.toggle('bk-focus');
      s.classList.remove('bk-peek');
    }

    // ---------- neo vị trí cuộn theo ĐOẠN (không bị nhảy khi đổi cỡ chữ / bật song ngữ / có bản dịch mới) ----------
    function bkAnchor() {
      const box = bkScrollEl(); if (!box || !bkActive()) return null;
      const bt = box.getBoundingClientRect().top;
      const ps = Object.keys(bkPEls).map(Number).sort((a, b) => a - b);
      let lo = 0, hi = ps.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (bkPEls[ps[mid]].getBoundingClientRect().bottom > bt + 1) hi = mid; else lo = mid + 1; }
      if (!ps.length) return null;
      return { p: ps[lo], off: bkPEls[ps[lo]].getBoundingClientRect().top - bt };
    }
    function bkRestoreAnchor(a) {
      if (!a) return;
      const box = bkScrollEl(); let el = bkPEls[a.p];
      if (!el) { const ks = Object.keys(bkPEls).map(Number).sort((x, y) => x - y); const k = ks.find((n) => n >= a.p) ?? ks[ks.length - 1]; el = bkPEls[k]; }
      if (!el) return;
      box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - a.off;
    }

    // ---------- mở / đóng sách ----------
    async function bkOpenBook(id, opts) {
      opts = opts || {};
      bkLoading(true, 'Đang mở sách...');
      await bkTick();
      try {
        const meta = (await bkDbListBooks()).find((b) => b.id === id);
        const recs = meta ? await bkDbGetChapters(id) : [];
        if (!meta || !recs.length) { bkLoading(false); bkToast('Sách này không còn trong thư viện'); return false; }
        bkBook = meta;
        bkChs = recs.map(bkHydrateChapter);
        if (!Array.isArray(bkBook.chWords) || bkBook.chWords.length !== bkChs.length) bkBook.chWords = bkChs.map((c) => c.words);
        if (!Array.isArray(bkBook.chTr) || bkBook.chTr.length !== bkChs.length) bkBook.chTr = bkChs.map((c) => c.s.reduce((a, x) => a + ((x.vi && String(x.vi).trim()) ? bkWc(x.text) : 0), 0));
        bkBook.transWords = bkBook.chTr.reduce((a, b) => a + b, 0);
        bkPrefix = []; let acc = 0; bkChs.forEach((c) => { bkPrefix.push(acc); acc += c.words; });
        bkBook.openedAt = Date.now();

        if (document.getElementById('screen-book').classList.contains('hidden')) captureHomeState();
        if (rafAnimId) { cancelAnimationFrame(rafAnimId); rafAnimId = null; }
        try { if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo(); } catch (e) {}
        stopSubtitleLoop(); hideLookupTooltip();
        ['screen-input', 'screen-practice', 'screen-vocab'].forEach((x) => document.getElementById(x).classList.add('hidden'));
        document.getElementById('screen-book').classList.remove('hidden');
        document.body.classList.add('book-mode');
        document.getElementById('bk-title').textContent = bkBook.title;
        bkApplyPrefs(); bkCloseDrawer(); bkToggleSettings(false); bkTocCollapsed = new Set();
        const pos = bkBook.pos || { ch: 0, i: 0 };
        const ch = opts.ch !== undefined ? opts.ch : pos.ch;
        const si = opts.si !== undefined ? opts.si : pos.i;
        bkShowChapter(ch, { si, flash: !!opts.flash });
        bkDbSaveBook(bkBook).catch(() => {});
        bkLoading(false);
        const sc = bkScrollEl(); if (sc) sc.focus({ preventScroll: true });
        return true;
      } catch (e) {
        console.error(e); bkLoading(false); alert('Không mở được sách: ' + (e && e.message ? e.message : e)); return false;
      }
    }

    async function bkClose() {
      if (!bkBook) return;
      bkSavePosNow();
      hideLookupTooltip(); bkCloseDrawer(); bkToggleSettings(false);
      document.getElementById('bk-tr-modal').classList.remove('open');
      document.getElementById('screen-book').classList.add('hidden');
      document.body.classList.remove('book-mode');
      document.getElementById('screen-input').classList.remove('hidden');
      setInputMode('book');
      await bkRefreshLibrary();
      requestAnimationFrame(() => requestAnimationFrame(() => { window.scrollTo({ top: savedHomeScrollY, behavior: 'auto' }); restoreRowScrollPositions(); }));
    }

    async function bkOpenFromVocab(x) {
      const si = Math.max(0, Math.round(x.t || 0));
      if (bkBook && bkBook.id === x.bookId && bkChs.length) {
        ['screen-input', 'screen-practice', 'screen-vocab'].forEach((i) => document.getElementById(i).classList.add('hidden'));
        document.getElementById('screen-book').classList.remove('hidden');
        document.body.classList.add('book-mode');
        bkShowChapter(x.ch, { si, flash: true });
        return;
      }
      await bkOpenBook(x.bookId, { ch: x.ch, si, flash: true });
    }

    // ---------- hiển thị 1 chương ----------
    function bkShowChapter(ch, o) {
      o = o || {};
      ch = Math.max(0, Math.min(bkChs.length - 1, ch | 0));
      bkCh = ch;
      sentences = bkChs[ch].s;
      currentVideoId = `book:${bkBook.id}:${ch}`;
      currentVideoTitle = `${bkBook.title} · ${bkChs[ch].title}`;
      currentSentenceIndex = 0;
      bkRenderChapter();
      const box = bkScrollEl();
      if (o.si > 0 && bkSEls[o.si]) bkScrollToSentence(o.si, !!o.flash);
      else { box.scrollTop = 0; if (o.flash && bkSEls[0]) bkSEls[0].classList.add('bk-flash'); }
      if (o.pos === 'end') box.scrollTop = box.scrollHeight;
      bkBook.pos = { ch, i: Math.max(0, o.si | 0) };
      bkUpdateUi(); bkSavePos();
    }

    function bkRenderChapter() {
      const ch = bkChs[bkCh], c = bkContentEl();
      const frag = document.createDocumentFragment();
      const head = document.createElement('header');
      head.className = 'bk-chhead';
      head.innerHTML = `${ch.pa && ch.pa.length ? `<div class="bk-crumb">${ch.pa.map(bkEsc).join('<i>›</i>')}</div>` : ''}<div class="bk-chno">Chương ${bkCh + 1} / ${bkChs.length}</div><h1 class="bk-chtitle">${bkEsc(ch.title)}</h1><div class="bk-chrule"></div>`;
      frag.appendChild(head);
      const banner = document.createElement('div'); banner.id = 'bk-banner'; banner.className = 'bk-banner'; banner.style.display = 'none';
      frag.appendChild(banner);

      bkSEls = []; bkPEls = {};
      let curP = null, pEl = null, viBuf = [];
      const flushVi = () => {
        if (pEl && viBuf.length) { const d = document.createElement('div'); d.className = 'sub-vi-line bk-vi-par'; d.textContent = viBuf.join(' '); frag.appendChild(d); }
        viBuf = [];
      };
      ch.s.forEach((s, i) => {
        if (s.p !== curP || !pEl) {
          flushVi();
          curP = s.p;
          pEl = document.createElement('p');
          pEl.className = 'bk-p' + (s.h ? ' bk-sub' : '') + (s.e ? ' bk-epi' : '');
          pEl.dataset.p = s.p;
          frag.appendChild(pEl);
          bkPEls[s.p] = pEl;
        }
        const sp = document.createElement('span');
        sp.className = 'bk-s sentence-text-line';
        sp.setAttribute('data-id', s.id);
        const words = s.text.split(' ').filter(Boolean);
        words.forEach((w, k) => {
          const ws = document.createElement('span');
          ws.className = 'bk-w sub-word-unit';
          ws.textContent = w;
          ws.setAttribute('data-start', i); ws.setAttribute('data-end', i + 1);
          sp.appendChild(ws);
          if (k < words.length - 1) sp.appendChild(document.createTextNode(' '));
        });
        const vi = s.vi && String(s.vi).trim();
        if (vi) {
          const vd = document.createElement('span'); vd.className = 'sub-vi-line bk-vi-inline'; vd.textContent = vi; sp.appendChild(vd);
          viBuf.push(vi);
        }
        pEl.appendChild(sp);
        pEl.appendChild(document.createTextNode(' '));
        bkSEls[i] = sp;
      });
      flushVi();

      const nav = document.createElement('div'); nav.className = 'bk-chnav';
      const prev = bkChs[bkCh - 1], next = bkChs[bkCh + 1];
      nav.innerHTML = `<button type="button" ${prev ? '' : 'disabled'} onclick="bkPrevChapter()"><small>← Chương trước</small><b>${prev ? bkEsc(prev.title) : '—'}</b></button><button type="button" class="next" ${next ? '' : 'disabled'} onclick="bkNextChapter()"><small>Chương sau →</small><b>${next ? bkEsc(next.title) : (bkCh === bkChs.length - 1 ? 'Hết sách 🎉' : '—')}</b></button>`;
      frag.appendChild(nav);
      c.innerHTML = '';
      c.appendChild(frag);
      c.classList.toggle('sub-show-vi', !!bkPrefs.bi);
      bkMarkSaved();
      bkUpdateBanner();
    }

    // Từ/cụm từ đã lưu của chương này → gạch chân chấm chấm
    function bkMarkSaved() {
      const c = bkContentEl(); if (!c || !bkBook) return;
      c.querySelectorAll('.bk-saved').forEach((e) => e.classList.remove('bk-saved'));
      const items = getVocab().filter((x) => x.videoId === currentVideoId && x.bookId === bkBook.id);
      if (!items.length) return;
      const S = bkChs[bkCh].s;
      const joinFrom = (si, n) => { let en = ''; for (let k = si; k < S.length && en.length < n; k++) { const t = S[k].text.split(' ').filter(Boolean).join(' '); en += (en ? ' ' : '') + t; } return en; };
      items.forEach((x) => {
        let si = Math.max(0, Math.round(x.t || 0));
        if (joinFrom(si, x.en.length).slice(0, x.en.length) !== x.en) {   // câu đã bị chia lại (vd. sau khi ghép bản dịch) → dò lại
          const first = x.en.slice(0, 40); si = -1;
          for (let k = 0; k < S.length; k++) { if (S[k].text.indexOf(first) === 0 || S[k].text.split(' ').filter(Boolean).join(' ').indexOf(first) === 0) { if (joinFrom(k, x.en.length).slice(0, x.en.length) === x.en) { si = k; break; } } }
          if (si < 0) return;
        }
        let pos = 0;
        outer: for (let s = si; s < S.length; s++) {
          const el = bkSEls[s]; if (!el) break;
          const ws = el.querySelectorAll('.bk-w');
          for (let w = 0; w < ws.length; w++) {
            const len = ws[w].textContent.length, st = pos, en = pos + len;
            if (en > x.hs && st < x.he) ws[w].classList.add('bk-saved');
            pos = en + 1;
            if (pos > x.he) break outer;
          }
        }
      });
    }

    function bkUpdateBanner() {
      const b = document.getElementById('bk-banner'); if (!b) return;
      if (!bkPrefs.bi) { b.style.display = 'none'; return; }
      const w = bkBook.chWords[bkCh] || 1, pct = Math.round((bkBook.chTr[bkCh] || 0) / w * 100);
      if (pct >= 98) { b.style.display = 'none'; return; }
      b.style.display = 'flex';
      b.innerHTML = `<span>${pct === 0 ? 'Chương này chưa có bản dịch.' : `Bản dịch mới phủ <b>${pct}%</b> chương này.`}</span><button type="button" onclick="bkOpenTranslate('read')">${pct === 0 ? 'Dịch chương này' : 'Dịch tiếp'}</button>`;
    }

    // ---------- cuộn / vị trí / tiến độ ----------
    function bkTopSentence() {
      if (!bkSEls.length) return 0;
      const bt = bkScrollEl().getBoundingClientRect().top + 4;
      let lo = 0, hi = bkSEls.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (bkSEls[mid].getBoundingClientRect().bottom > bt) hi = mid; else lo = mid + 1; }
      return lo;
    }
    function bkScrollToSentence(i, flash) {
      const el = bkSEls[i], box = bkScrollEl(); if (!el) return;
      const r = (el.getClientRects()[0] || el.getBoundingClientRect());
      box.scrollTop += r.top - box.getBoundingClientRect().top - Math.min(110, box.clientHeight * 0.18);
      if (flash) { el.classList.remove('bk-flash'); void el.offsetWidth; el.classList.add('bk-flash'); setTimeout(() => el.classList.remove('bk-flash'), 2600); }
    }
    let bkRaf = 0, bkSaveT = null;
    function bkOnScroll() {
      if (bkRaf) return;
      bkRaf = requestAnimationFrame(() => { bkRaf = 0; bkUpdateProgress(); });
      clearTimeout(bkSaveT); bkSaveT = setTimeout(bkSavePosNow, 900);
    }
    function bkChapterFrac() {
      const box = bkScrollEl(), max = box.scrollHeight - box.clientHeight;
      return max > 4 ? Math.max(0, Math.min(1, box.scrollTop / max)) : 1;
    }
    function bkOverallFrac() {
      const total = bkPrefix.length ? bkPrefix[bkPrefix.length - 1] + bkChs[bkChs.length - 1].words : 1;
      return Math.max(0, Math.min(1, (bkPrefix[bkCh] + bkChapterFrac() * bkChs[bkCh].words) / total));
    }
    function bkUpdateProgress() {
      if (!bkBook || !bkActive()) return;
      const f = bkOverallFrac(), total = bkPrefix[bkPrefix.length - 1] + bkChs[bkChs.length - 1].words;
      if (!bkSliding) document.getElementById('bk-slider').value = Math.round(f * 1000);
      document.getElementById('bk-st-pct').innerHTML = `<b>${Math.round(f * 100)}%</b>`;
      const left = Math.max(0, total * (1 - f)), mins = left / 180;
      document.getElementById('bk-st-left').textContent = mins < 1 ? 'sắp xong' : mins < 60 ? `còn ~${Math.round(mins)} phút` : `còn ~${Math.floor(mins / 60)}g ${Math.round(mins % 60)}p`;
    }
    function bkUpdateUi() {
      document.getElementById('bk-subtitle').textContent = `${bkCh + 1}/${bkChs.length} · ${bkChs[bkCh].title}`;
      document.getElementById('bk-st-ch').innerHTML = `Ch <b>${bkCh + 1}</b>/${bkChs.length}`;
      const tr = bkBook.transWords || 0;
      document.getElementById('bk-btn-bi').classList.toggle('hint', !(bkBook.chTr[bkCh] > 0));
      bkUpdateProgress(); bkUpdateTocHighlight(); bkUpdateTrPill();
    }
    function bkSavePosNow() {
      clearTimeout(bkSaveT);
      if (!bkBook || !bkActive()) return;
      bkBook.pos = { ch: bkCh, i: bkTopSentence() };
      bkBook.openedAt = Date.now();
      bkDbSaveBook(bkBook).catch(() => {});
      bkUpdateTrPill();
    }
    function bkSavePos() { clearTimeout(bkSaveT); bkSaveT = setTimeout(bkSavePosNow, 600); }

    function bkPrevChapter() { if (bkCh > 0) bkShowChapter(bkCh - 1, { pos: 'start' }); }
    function bkNextChapter() { if (bkCh < bkChs.length - 1) bkShowChapter(bkCh + 1); }
    function bkGoto(ch, si, flash) {
      if (ch !== bkCh) bkShowChapter(ch, { si, flash }); else { bkScrollToSentence(si, flash); bkSavePos(); bkUpdateProgress(); }
    }
    function bkSliderInput(v) { bkSliding = true; document.getElementById('bk-st-pct').innerHTML = `<b>${Math.round(v / 10)}%</b>`; }
    function bkSliderCommit(v) {
      bkSliding = false;
      const total = bkPrefix[bkPrefix.length - 1] + bkChs[bkChs.length - 1].words, target = (v / 1000) * total;
      let ch = 0; while (ch < bkChs.length - 1 && bkPrefix[ch + 1] <= target) ch++;
      let within = target - bkPrefix[ch], si = 0, acc = 0;
      const S = bkChs[ch].s;
      for (let i = 0; i < S.length; i++) { acc += bkWc(S[i].text); if (acc >= within) { si = i; break; } si = i; }
      if (+v >= 998) { bkShowChapter(bkChs.length - 1, { pos: 'end' }); return; }
      bkShowChapter(ch, { si });
    }

    // ---------- mục lục + tìm kiếm (ngăn bên trái, KHÔNG che/làm tối nội dung) ----------
    // Màn hình rộng: ngăn nằm cạnh trang sách, vừa xem mục lục vừa đọc. Màn hình hẹp: ngăn nổi lên trên, chạm ra ngoài để đóng.
    let bkTocCollapsed = new Set();
    const bkNarrow = () => window.innerWidth <= 820;
    function bkDrawerOpen() { return document.getElementById('bk-drawer').classList.contains('open'); }
    function bkToggleDrawer(tab, forceOpen) {
      const d = document.getElementById('bk-drawer'), open = bkDrawerOpen();
      const cur = document.getElementById('bk-tab-toc').classList.contains('on') ? 'toc' : 'search';
      if (open && !forceOpen && cur === tab) { bkCloseDrawer(); return; }
      const a = open ? null : bkAnchor();
      bkToggleSettings(false);
      d.classList.add('open'); document.getElementById('bk-drawer-back').classList.toggle('open', bkNarrow());
      document.getElementById('bk-btn-toc').classList.toggle('on', tab === 'toc');
      document.getElementById('bk-tab-toc').classList.toggle('on', tab === 'toc');
      document.getElementById('bk-tab-search').classList.toggle('on', tab === 'search');
      document.getElementById('bk-pane-toc').classList.toggle('on', tab === 'toc');
      document.getElementById('bk-pane-search').classList.toggle('on', tab === 'search');
      if (a) bkRestoreAnchor(a);
      if (tab === 'toc') { bkRenderToc(); bkTocScrollToCurrent(true); }
      else setTimeout(() => { const i = document.getElementById('bk-search-input'); i.focus(); i.select(); }, 60);
    }
    function bkCloseDrawer() {
      const d = document.getElementById('bk-drawer');
      if (!d.classList.contains('open')) return;
      const a = bkActive() ? bkAnchor() : null;
      d.classList.remove('open');
      document.getElementById('bk-drawer-back').classList.remove('open');
      document.getElementById('bk-btn-toc').classList.remove('on');
      if (a) bkRestoreAnchor(a);
      const sc = bkScrollEl(); if (sc && bkActive()) sc.focus({ preventScroll: true });
    }
    // Dàn ý: sách có mục lục cấp bậc dùng outline đã lưu; sách thường → danh sách phẳng
    function bkOutline() {
      if (bkBook && Array.isArray(bkBook.outline) && bkBook.outline.length) return bkBook.outline;
      return bkChs.map((c, i) => ({ t: c.title, lv: 0, ch: i, own: true }));
    }
    function bkRenderToc() {
      const host = document.getElementById('bk-pane-toc'); if (!host || !bkBook) return;
      const ol = bkOutline();
      const hier = ol.some((n) => n.lv > 0 || !n.own);
      let curIdx = -1;
      ol.forEach((n, i) => { if (n.own && n.ch === bkCh) curIdx = i; });
      const anc = new Set();
      if (curIdx >= 0) { let need = ol[curIdx].lv; for (let j = curIdx - 1; j >= 0 && need > 0; j--) if (ol[j].lv < need) { anc.add(j); need = ol[j].lv; } }
      const st = host.scrollTop;
      let hideBelow = -1, html = '';
      ol.forEach((n, i) => {
        if (hideBelow >= 0 && n.lv > hideBelow) return;
        hideBelow = -1;
        const kids = i + 1 < ol.length && ol[i + 1].lv > n.lv;
        const collapsed = kids && bkTocCollapsed.has(i);
        if (collapsed) hideBelow = n.lv;
        let flag = '', meta = '';
        if (n.own) {
          const w = bkBook.chWords[n.ch] || 1, pct = Math.round((bkBook.chTr[n.ch] || 0) / w * 100);
          flag = pct >= 98 ? '<span class="f full">VI</span>' : pct > 0 ? `<span class="f part">${pct}%</span>` : '';
          meta = `<span class="m">${(bkChs[n.ch].words).toLocaleString('en-US')} từ</span>`;
        }
        const lv = hier ? Math.min(n.lv, 3) : 2;
        const cls = ['bk-toc-item', 'lv' + lv, i === curIdx ? 'cur' : '', anc.has(i) ? 'anc' : '', n.own && n.ch < bkCh ? 'read' : '', hier ? '' : 'flat'].filter(Boolean).join(' ');
        const chev = kids ? `<span class="chev" title="${collapsed ? 'Mở rộng' : 'Thu gọn'}" onclick="event.stopPropagation(); bkTocToggle(${i})">${collapsed ? '▸' : '▾'}</span>` : (hier ? '<span class="chev sp"></span>' : '');
        const num = hier ? '' : `<span class="n">${n.ch + 1}</span>`;
        html += `<div class="${cls}" role="button" tabindex="0" data-n="${i}" onclick="bkTocGo(${n.ch})" onkeydown="if(event.key==='Enter'){bkTocGo(${n.ch})}">${chev}${num}<span class="t">${bkEsc(n.t)}${meta}</span>${flag}</div>`;
      });
      host.innerHTML = html;
      host.scrollTop = st;
    }
    function bkTocScrollToCurrent(center) {
      const cur = document.querySelector('#bk-pane-toc .bk-toc-item.cur'); if (!cur) return;
      cur.scrollIntoView({ block: center ? 'center' : 'nearest' });
    }
    function bkUpdateTocHighlight() { if (bkDrawerOpen() && document.getElementById('bk-pane-toc').classList.contains('on')) { bkRenderToc(); bkTocScrollToCurrent(false); } }
    function bkTocToggle(i) { if (bkTocCollapsed.has(i)) bkTocCollapsed.delete(i); else bkTocCollapsed.add(i); bkRenderToc(); }
    function bkTocGo(i) {
      // đảm bảo nhóm chứa chương này không bị thu gọn
      const ol = bkOutline(); ol.forEach((n, k) => { if (n.own && n.ch === i) { let need = n.lv; for (let j = k - 1; j >= 0 && need > 0; j--) if (ol[j].lv < need) { bkTocCollapsed.delete(j); need = ol[j].lv; } } });
      if (bkNarrow()) bkCloseDrawer();
      bkShowChapter(i);
    }

    let bkSearchT = null;
    function bkSearchInput(v) { clearTimeout(bkSearchT); bkSearchT = setTimeout(() => bkRunSearch(v), 180); }
    function bkRunSearch(raw) {
      const host = document.getElementById('bk-search-res'), q = String(raw || '').trim().toLowerCase();
      if (q.length < 2) { host.innerHTML = '<div class="bk-dnote">Gõ ít nhất 2 ký tự để tìm trong toàn bộ cuốn sách.</div>'; return; }
      const hits = []; let more = false;
      outer: for (let c = 0; c < bkChs.length; c++) {
        const S = bkChs[c].s;
        for (let i = 0; i < S.length; i++) {
          const en = S[i].text, vi = S[i].vi || '';
          const a = en.toLowerCase().indexOf(q), b = vi ? vi.toLowerCase().indexOf(q) : -1;
          if (a >= 0 || b >= 0) { hits.push({ c, i, a, b, en, vi }); if (hits.length >= 150) { more = true; break outer; } }
        }
      }
      if (!hits.length) { host.innerHTML = '<div class="bk-dnote">Không tìm thấy kết quả nào.</div>'; return; }
      const mark = (t, k) => k < 0 ? bkEsc(t) : bkEsc(t.slice(0, k)) + '<mark>' + bkEsc(t.slice(k, k + q.length)) + '</mark>' + bkEsc(t.slice(k + q.length));
      const snip = (t, k) => { if (k < 0 || t.length <= 190) return mark(t, k); const s = Math.max(0, k - 70); return (s ? '…' : '') + mark(t.slice(s, s + 190), k - s) + '…'; };
      host.innerHTML = `<div class="bk-dnote" style="padding:10px 14px;text-align:left">${hits.length}${more ? '+' : ''} kết quả</div>` + hits.map((h) =>
        `<button type="button" class="bk-hit" onclick="bkHitGo(${h.c},${h.i})"><small>Ch ${h.c + 1} · ${bkEsc(bkChs[h.c].title)}</small>${h.a >= 0 ? snip(h.en, h.a) : bkEsc(h.en.slice(0, 160))}${h.b >= 0 ? `<div style="color:var(--bk-vi);margin-top:2px">${snip(h.vi, h.b)}</div>` : ''}</button>`).join('');
    }
    function bkHitGo(c, i) { if (bkNarrow()) bkCloseDrawer(); bkGoto(c, i, true); }

    // ---------- bật / tắt song ngữ ----------
    function bkToggleBilingual() {
      if (!bkBook) return;
      if (!bkPrefs.bi && !(bkBook.transWords > 0)) { bkOpenTranslate('read'); return; }
      const a = bkAnchor();
      bkPrefs.bi = !bkPrefs.bi; bkSavePrefs(); bkApplyPrefs(); bkUpdateBanner();
      bkRestoreAnchor(a);
      bkUpdateTrPill();
    }

    // ---------- phím tắt khi đang đọc sách ----------
    document.addEventListener('keydown', (e) => {
      if (!bkActive()) return;
      const k = e.key;
      if (k === 'Escape') {
        const trm = document.getElementById('bk-tr-modal'), imp = document.getElementById('bk-import-modal');
        if (trm.classList.contains('open')) { bkCloseTranslate(); e.stopImmediatePropagation(); return; }
        if (imp.classList.contains('open')) { bkImportCancel(); e.stopImmediatePropagation(); return; }
        if (document.getElementById('bk-drawer').classList.contains('open')) { bkCloseDrawer(); e.stopImmediatePropagation(); return; }
        if (document.getElementById('bk-set').classList.contains('open')) { bkToggleSettings(false); e.stopImmediatePropagation(); return; }
        const s = document.getElementById('screen-book'); if (s.classList.contains('bk-focus')) { s.classList.remove('bk-focus'); e.stopImmediatePropagation(); }
        return;
      }
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.querySelector('.ai-modal-backdrop.open')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const box = bkScrollEl(), h = box.clientHeight;
      let handled = true;
      switch (k) {
        case ' ': box.scrollBy({ top: (e.shiftKey ? -1 : 1) * h * 0.88, behavior: 'smooth' }); break;
        case 'PageDown': box.scrollBy({ top: h * 0.88, behavior: 'smooth' }); break;
        case 'PageUp': box.scrollBy({ top: -h * 0.88, behavior: 'smooth' }); break;
        case 'ArrowDown': box.scrollBy({ top: 70 }); break;
        case 'ArrowUp': box.scrollBy({ top: -70 }); break;
        case 'Home': box.scrollTo({ top: 0 }); break;
        case 'End': box.scrollTo({ top: box.scrollHeight }); break;
        case 'ArrowRight': bkNextChapter(); break;
        case 'ArrowLeft': bkPrevChapter(); break;
        case 't': case 'T': bkToggleDrawer('toc'); break;
        case '/': bkToggleDrawer('search', true); break;
        case 'b': case 'B': bkToggleBilingual(); break;
        case 'f': case 'F': bkToggleFocus(); break;
        case 'd': case 'D': bkOpenTranslate('read'); break;
        case 's': case 'S': saveSelectionToVocabByKey(); break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
      e.stopImmediatePropagation();   // chặn phím tắt của phần video (số = tốc độ, Space = phát...)
    }, true);

    document.addEventListener('mousemove', (e) => {
      const s = document.getElementById('screen-book');
      if (!s || s.classList.contains('hidden') || !s.classList.contains('bk-focus')) return;
      s.classList.toggle('bk-peek', e.clientY < 64 || e.clientY > window.innerHeight - 60);
    });
    document.addEventListener('mousedown', (e) => {
      if (!bkActive()) return;
      const st = document.getElementById('bk-set');
      if (st.classList.contains('open') && !st.contains(e.target) && !document.getElementById('bk-btn-set').contains(e.target)) bkToggleSettings(false);
    });
    document.addEventListener('touchend', () => { if (bkActive()) setTimeout(checkTextSelection, 350); });

    // =====================================================================================
    // ==================== ĐỌC SÁCH — PHẦN 3: DỊCH SONG NGỮ THEO TỪNG ĐỢT ====================
    // Một đợt = khoảng 600 / 1.100 / 1.800 từ, cắt ở ranh giới ĐOẠN VĂN (không cắt giữa đoạn),
    // chương ngắn thì gom nhiều chương vào 1 đợt, chương dài thì chia nhiều đợt. Kết quả AI trả về
    // được căn lại với đúng đoạn sách đó bằng thuật toán ghép sẵn có của app (aicRun).
    // =====================================================================================
    const BK_BATCH = { S: 600, M: 1100, L: 1800 };
    let bkTr = { batch: null, copied: null };
    const bkHasVi = (s) => !!(s && s.vi && String(s.vi).trim());

    // Câu đầu tiên chưa dịch tính từ một vị trí (bỏ qua phần đã dịch). null = đã dịch hết.
    function bkFirstUntranslated(ch, i) {
      for (; ch < bkChs.length; ch++, i = 0) {
        const S = bkChs[ch].s;
        while (i < S.length && bkHasVi(S[i])) i++;
        if (i < S.length) return { ch, i };
      }
      return null;
    }
    function bkTrStart(mode) {
      if (mode === 'start') return { ch: 0, i: 0 };
      if (mode === 'chapter') return { ch: bkCh, i: 0 };
      let ch, i;
      if (mode === 'cursor' && bkBook.cur && bkChs[bkBook.cur.ch]) { ch = bkBook.cur.ch; i = bkBook.cur.i; }
      else {
        ch = bkCh; i = bkTopSentence();
        const S = bkChs[ch].s, p = S[i] ? S[i].p : 0;
        while (i > 0 && S[i - 1].p === p) i--;   // lùi về đầu đoạn đang đọc
      }
      return bkFirstUntranslated(ch, i);
    }

    // Dựng 1 đợt dịch bắt đầu từ (ch0, i0)
    function bkMakeBatch(ch0, i0, target, stopAtTranslated) {
      const segs = []; let acc = 0, ch = ch0, i = i0;
      while (ch < bkChs.length) {
        const S = bkChs[ch].s;
        let lim = S.length;
        if (stopAtTranslated) for (let j = i; j < S.length; j++) if (bkHasVi(S[j])) { lim = j; break; }
        let rem = 0; for (let j = i; j < lim; j++) rem += bkWc(S[j].text);
        if (lim <= i) break;
        const need = target - acc;
        if (rem <= need * 1.3) {                                    // lấy hết phần còn lại của chương
          segs.push({ ch, from: i, to: lim }); acc += rem;
          if (lim < S.length) break;                                // gặp phần đã dịch → dừng
          ch++; i = 0;
          if (acc >= target * 0.85) break;
          continue;
        }
        // cắt giữa chương: chọn ranh giới đoạn gần mức mục tiêu nhất
        let w = 0, best = -1, bestD = Infinity, firstOver = -1;
        for (let j = i; j < lim; j++) {
          if (j > i && S[j].p !== S[j - 1].p) { const tot = acc + w; if (w > 0 && tot >= target * 0.6) { const d = Math.abs(tot - target); if (d < bestD) { bestD = d; best = j; } } }
          w += bkWc(S[j].text);
          if (firstOver < 0 && acc + w >= target) firstOver = j + 1;
        }
        let cut = best;
        if (cut >= 0) { let wb = 0; for (let j = i; j < cut; j++) wb += bkWc(S[j].text); if (acc + wb > target * 1.45) cut = -1; }
        if (cut < 0) {
          if (acc >= target * 0.6) break;                           // đã đủ lớn, đừng kéo thêm đoạn quá dài của chương này
          cut = firstOver > 0 ? firstOver : lim;
        }
        let wc = 0; for (let j = i; j < cut; j++) wc += bkWc(S[j].text);
        segs.push({ ch, from: i, to: cut }); acc += wc;
        break;
      }
      if (!segs.length) return null;
      let words = 0, sents = 0, paras = [];
      segs.forEach((sg, si) => {
        const S = bkChs[sg.ch].s; let curP = null, buf = [];
        const flush = () => { if (buf.length) paras.push(buf.join(' ')); buf = []; };
        for (let j = sg.from; j < sg.to; j++) { if (S[j].p !== curP) { flush(); curP = S[j].p; } buf.push(S[j].text); words += bkWc(S[j].text); sents++; }
        flush();
      });
      const first = bkChs[segs[0].ch].s[segs[0].from], lastSg = segs[segs.length - 1], last = bkChs[lastSg.ch].s[lastSg.to - 1];
      return { segs, words, sents, body: paras.join('\n\n'), startText: first.text, endText: last.text, startCh: segs[0].ch, endCh: lastSg.ch, endIdx: lastSg.to, stop: !!stopAtTranslated };
    }

    function bkTrPrompt(b) {
      const gl = (bkBook.glossary || '').trim();
      const chTitle = bkChs[b.startCh].title + (b.endCh !== b.startCh ? ` … ${bkChs[b.endCh].title}` : '');
      return `Dịch đoạn trích sau từ cuốn sách "${bkBook.title}"${bkBook.author ? ` của ${bkBook.author}` : ''} (phần: "${chTitle}") sang tiếng Việt, theo kiểu xen kẽ: 1 câu gốc tiếng Pháp, ngay dưới là 1 câu dịch tiếng Việt, rồi tới câu tiếng Pháp kế tiếp.\n` +
        `Yêu cầu: giữ nguyên từng câu tiếng Pháp gốc (không bỏ sót, không gộp, không viết lại); đặt toàn bộ kết quả trong MỘT khối code (codebox \`\`\`) để người dùng mobile dễ bấm nút copy; chỉ trả về các cặp câu, không thêm lời dẫn, tiêu đề, đánh số hay ghi chú ngoài khối code; dịch tự nhiên, chính xác, đúng văn phong của sách.` +
        (gl ? `\nGhi chú khi dịch (hãy tuân theo): ${gl}` : '') + `\n\nVăn bản:\n\n${b.body}`;
    }

    // ---------- cửa sổ dịch ----------
    function bkOpenTranslate(mode) {
      if (!bkBook) return;
      document.getElementById('bk-tr-from').value = mode || 'read';
      document.getElementById('bk-tr-size').value = bkBook.batch || 'M';
      document.getElementById('bk-tr-gloss').value = bkBook.glossary || '';
      document.getElementById('bk-tr-title').textContent = `Dịch song ngữ · ${bkBook.title}`;
      document.getElementById('bk-tr-text').value = '';
      aiSetStatus(document.getElementById('bk-tr-status'), '', '');
      document.getElementById('bk-tr-prev').classList.remove('open');
      bkTr.copied = null;
      resetCopyButtons();
      bkTrRefresh();
      document.getElementById('bk-tr-modal').classList.add('open');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
    function bkCloseTranslate() { document.getElementById('bk-tr-modal').classList.remove('open'); const sc = bkScrollEl(); if (sc && bkActive()) sc.focus({ preventScroll: true }); }
    function bkTrSizeChange() { bkBook.batch = document.getElementById('bk-tr-size').value; bkDbSaveBook(bkBook).catch(() => {}); bkTrRefresh(); }
    function bkTrSaveGloss() { bkBook.glossary = document.getElementById('bk-tr-gloss').value.trim(); bkDbSaveBook(bkBook).catch(() => {}); bkTrRefresh(); }

    function bkTrRefresh() {
      const mode = document.getElementById('bk-tr-from').value;
      const target = BK_BATCH[document.getElementById('bk-tr-size').value] || 1100;
      const total = bkBook.wordCount || 1, done = bkBook.transWords || 0;
      document.getElementById('bk-tr-meter').style.width = Math.min(100, done / total * 100) + '%';
      document.getElementById('bk-tr-prog-text').innerHTML = `Đã dịch <b>${Math.round(done / total * 100)}%</b> cuốn sách (${done.toLocaleString('en-US')}/${total.toLocaleString('en-US')} từ)`;
      const st = bkTrStart(mode), info = document.getElementById('bk-tr-info'), copyBtn = document.getElementById('bk-tr-copy');
      bkTr.batch = st ? bkMakeBatch(st.ch, st.i, target, mode === 'cursor' || mode === 'read') : null;
      copyBtn.disabled = !bkTr.batch; copyBtn.style.opacity = bkTr.batch ? '' : '.5';
      document.getElementById('bk-tr-prev').textContent = bkTr.batch ? bkTrPrompt(bkTr.batch) : '';
      if (!bkTr.batch) { info.innerHTML = 'Không còn phần nào chưa dịch từ vị trí này. Chọn “Đầu chương đang đọc” hoặc “Đầu sách” nếu muốn dịch lại.'; return; }
      const b = bkTr.batch, cut = (s) => bkEsc(s.length > 70 ? s.slice(0, 70) + '…' : s);
      let remain = 0;
      for (let c = b.endCh; c < bkChs.length; c++) { const S = bkChs[c].s; for (let j = (c === b.endCh ? b.endIdx : 0); j < S.length; j++) if (!bkHasVi(S[j])) remain += bkWc(S[j].text); }
      const chTxt = b.startCh === b.endCh ? `chương ${b.startCh + 1}` : `chương ${b.startCh + 1}–${b.endCh + 1}`;
      info.innerHTML = `Đợt này: <b>~${b.words.toLocaleString('en-US')} từ</b> · ${b.sents} câu · ${chTxt}.<br>Bắt đầu từ: “${cut(b.startText)}”<br>Sau đợt này còn khoảng <b>${Math.max(1, Math.round(remain / target))}</b> đợt nữa cho tới hết sách.`;
    }
    function bkTrTogglePrev() { document.getElementById('bk-tr-prev').classList.toggle('open'); }
    function bkTrCopy(btn) {
      if (!bkTr.batch) return;
      bkTr.copied = bkTr.batch;
      copyTextToClipboard(bkTrPrompt(bkTr.batch)).then(() => flashCopied(btn, 1800)).catch((err) => { alert('Không thể sao chép: ' + err); });
    }

    // Chạy thuật toán ghép trên 1 đợt (có thể trải nhiều chương); chưa ghi gì vào sách.
    function bkRunBatch(b, text) {
      const comb = [], map = [];
      b.segs.forEach((sg) => {
        const S = bkChs[sg.ch].s;
        for (let j = sg.from; j < sg.to; j++) {
          const k = comb.length;
          comb.push({ id: k + 1, text: S[j].text, startTime: k, endTime: k + 1, p: S[j].p, h: S[j].h, e: S[j].e });
          map.push({ ch: sg.ch, j });
        }
      });
      let r;
      try { r = applyBilingualFromAi(comb, text); } catch (e) { console.error(e); return { ok: false, error: 'Có lỗi khi xử lý câu trả lời: ' + e.message }; }
      if (!r.ok) return r;
      return { ok: true, res: r, comb, map };
    }

    async function bkTrApply() {
      const st = document.getElementById('bk-tr-status');
      const text = (document.getElementById('bk-tr-text').value || '').trim();
      if (!text) { aiSetStatus(st, 'err', 'Bạn chưa dán câu trả lời của AI vào ô bên trên.'); return; }
      const cands = [];
      if (bkTr.copied) cands.push(bkTr.copied);
      if (bkTr.batch && bkTr.batch !== bkTr.copied) cands.push(bkTr.batch);
      if (!cands.length) { aiSetStatus(st, 'err', 'Chưa có đợt dịch nào. Hãy bấm “Copy prompt” trước.'); return; }
      let out = null, used = null, err = '';
      for (const b of cands) { const r = bkRunBatch(b, text); if (r.ok) { out = r; used = b; break; } err = r.error; }
      if (!out) { aiSetStatus(st, 'err', err + '<br>Hãy chắc rằng bạn dán đúng câu trả lời cho prompt vừa copy (đừng đổi “Cỡ mỗi đợt” hay “Bắt đầu dịch từ” sau khi đã copy).'); return; }

      // Ghi kết quả về từng chương (ghi lại đoạn p cũ cho mỗi câu mới)
      const a = bkAnchor();
      const byCh = new Map();
      used.segs.forEach((sg) => byCh.set(sg.ch, { sg, items: [] }));
      out.res.sentences.forEach((r) => {
        let k = Math.floor(r.words[0].startTime + 1e-6); k = Math.max(0, Math.min(out.comb.length - 1, k));
        const m = out.map[k], c0 = out.comb[k];
        const o = { text: r.text, p: c0.p, startTime: 0, endTime: 1 };
        if (bkHasVi(r)) o.vi = String(r.vi).trim();
        if (c0.h) o.h = 1;
        if (c0.e) o.e = 1;
        byCh.get(m.ch).items.push(o);
      });
      const recs = []; let lastTr = null, trSents = 0;
      byCh.forEach((v, ch) => {
        const S = bkChs[ch].s;
        const ns = S.slice(0, v.sg.from).concat(v.items, S.slice(v.sg.to));
        ns.forEach((x, i) => { x.id = i + 1; x.startTime = i; x.endTime = i + 1; });
        bkChs[ch].s = ns;
        bkBook.chTr[ch] = ns.reduce((acc, x) => acc + (bkHasVi(x) ? bkWc(x.text) : 0), 0);
        v.items.forEach((x, idx) => { if (x.vi) trSents++; });
        for (let q = v.sg.from + v.items.length - 1; q >= v.sg.from; q--) { if (bkHasVi(ns[q])) { if (!lastTr || ch > lastTr.ch || (ch === lastTr.ch && q > lastTr.i)) lastTr = { ch, i: q }; break; } }
        recs.push(bkDehydrateChapter(bkBook.id, bkChs[ch]));
      });
      if (!lastTr) { aiSetStatus(st, 'err', 'Không ghép được câu dịch nào. Hãy kiểm tra lại câu trả lời của AI.'); return; }
      let nxt = { ch: lastTr.ch, i: lastTr.i + 1 };
      if (nxt.i >= bkChs[nxt.ch].s.length) nxt = nxt.ch + 1 < bkChs.length ? { ch: nxt.ch + 1, i: 0 } : null;
      bkBook.cur = nxt;
      bkBook.transWords = bkBook.chTr.reduce((x, y) => x + y, 0);
      bkBook.updatedAt = Date.now();
      try { await bkDbSaveBook(bkBook, recs); }
      catch (e) { aiSetStatus(st, 'err', 'Không lưu được bản dịch (bộ nhớ trình duyệt đầy?): ' + e.message); return; }

      bkPrefs.bi = true; bkSavePrefs();
      sentences = bkChs[bkCh].s;
      bkRenderChapter(); bkApplyPrefs(); bkRestoreAnchor(a); bkUpdateUi();
      if (document.getElementById('bk-drawer').classList.contains('open')) bkRenderToc();

      const total = used.sents, pct = Math.min(100, Math.round(trSents / Math.max(1, out.comb.length) * 100));
      let html = `✓ Đã ghép bản dịch cho <b>${trSents}</b> câu của đợt này.`, cls = 'ok';
      if (out.res.stats.tailPct < 96) { cls = 'warn'; html += `<br>AI mới trả lời tới khoảng ${out.res.stats.tailPct}% đợt này. Bấm “Copy prompt” lần nữa: đợt kế tiếp sẽ tự bắt đầu đúng chỗ AI dừng.`; }
      else html += '<br>Đợt kế tiếp đã sẵn sàng bên dưới.';
      document.getElementById('bk-tr-text').value = '';
      bkTr.copied = null;
      resetCopyButtons();
      bkTrRefresh();
      aiSetStatus(st, cls, html);
    }

    async function bkTrClear(scope) {
      const msg = scope === 'book' ? 'Xóa bản dịch của CẢ cuốn sách này?' : 'Xóa bản dịch của chương đang đọc?';
      if (!confirm(msg)) return;
      const recs = [], chs = scope === 'book' ? bkChs.map((c, i) => i) : [bkCh];
      chs.forEach((ch) => { bkChs[ch].s.forEach((x) => { delete x.vi; }); bkBook.chTr[ch] = 0; recs.push(bkDehydrateChapter(bkBook.id, bkChs[ch])); });
      if (scope === 'book') bkBook.cur = null;
      else if (!bkBook.cur || bkBook.cur.ch > bkCh) bkBook.cur = { ch: bkCh, i: 0 };
      bkBook.transWords = bkBook.chTr.reduce((x, y) => x + y, 0);
      await bkDbSaveBook(bkBook, recs);
      const a = bkAnchor();
      bkRenderChapter(); bkApplyPrefs(); bkRestoreAnchor(a); bkUpdateUi();
      bkTr.copied = null; bkTrRefresh();
      bkToast('Đã xóa bản dịch');
    }

    // Nút nhắc "Dịch tiếp" khi đọc gần tới chỗ hết bản dịch
    function bkUpdateTrPill() {
      const pill = document.getElementById('bk-trpill'); if (!pill) return;
      pill.classList.remove('show');
      if (!bkBook || !bkActive() || !(bkBook.transWords > 0) || !bkPrefs.bi) return;
      const readI = bkTopSentence(), fr = bkFirstUntranslated(bkCh, readI);
      if (!fr) return;
      let words = 0, ch = bkCh, i = readI;
      while (words <= 350 && (ch < fr.ch || (ch === fr.ch && i < fr.i))) {
        const S = bkChs[ch].s, end = ch === fr.ch ? fr.i : S.length;
        for (; i < end && words <= 350; i++) words += bkWc(S[i].text);
        if (ch === fr.ch) break; ch++; i = 0;
      }
      if (words <= 350 && bkChs[fr.ch]) pill.classList.add('show');
    }

    // ---------- khởi tạo ----------
    document.addEventListener('DOMContentLoaded', () => {
      bkInitImport();
      bkApplyPrefs();
      bkRefreshLibrary();
    });

    // =====================================================================================
    // ==================== SÁCH MẪU (để người xem web dùng thử chế độ đọc sách) ====================
    // File sách + ảnh bìa nằm CÙNG THƯ MỤC với index.html. Bấm thẻ → app tự tải, nhập vào trình duyệt
    // người xem (lần đầu), những lần sau mở thẳng từ bộ nhớ trình duyệt. Thêm sách mẫu khác = thêm 1 mục vào mảng này.
    // `bundle` (tùy chọn): tên file .shadowbook.json (sao lưu từ nút tải xuống trên thẻ sách) để người xem có
    // sẵn bản dịch song ngữ; nếu để trống hoặc file không có thì dùng file EPUB (chưa có bản dịch).
    // =====================================================================================
    const BK_SAMPLES = [
      {
        id: 'sample-le-petit-prince',
        file: '',
        thumb: '',
        title: 'Le Petit Prince',
        author: 'Antoine de Saint-Exupéry',
        note: 'Kiệt tác văn học Pháp (Song ngữ Pháp - Việt đầy đủ)',
        skip: null,
        bundle: '',
        sampleData: {
          format: 'shadowing-book-v1',
          meta: {
            id: 'sample-le-petit-prince',
            title: 'Le Petit Prince',
            author: 'Antoine de Saint-Exupéry',
            chapterCount: 2,
            wordCount: 385,
            sentCount: 16,
            transWords: 385,
            pos: { ch: 0, i: 0 },
            chTitles: ['Chapitre I — Le serpent boa', 'Chapitre II — S\'il vous plaît... dessine-moi un mouton !'],
            chWords: [195, 190],
            chTr: [195, 190],
            outline: [
              { idx: 0, title: 'Chapitre I — Le serpent boa', lv: 1, words: 195, trWords: 195 },
              { idx: 1, title: 'Chapitre II — S\'il vous plaît... dessine-moi un mouton !', lv: 1, words: 190, trWords: 190 }
            ]
          },
          chapters: [
            {
              idx: 0,
              title: 'Chapitre I — Le serpent boa',
              lv: 1,
              words: 195,
              s: [
                { p: 0, t: "Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait « Histoires Vécues ».", v: "Khi tôi lên sáu tuổi, một lần nọ tôi nhìn thấy một bức tranh tuyệt đẹp trong một cuốn sách về Rừng Nguyên Sinh có tựa đề là « Những câu chuyện có thật »." },
                { p: 0, t: "Ça représentait un serpent boa qui avalait un fauve.", v: "Bức tranh vẽ một con trăn boa đang nuốt chửng một con thú hoang." },
                { p: 1, t: "On disait dans le livre : « Les serpents boas avalent leur proie tout entière, sans la mâcher. Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion. »", v: "Trong cuốn sách người ta viết rằng: « Những con trăn boa nuốt chửng toàn bộ con mồi mà không cần nhai. Sau đó chúng không thể cử động được nữa và ngủ suốt sáu tháng trong quá trình tiêu hóa. »" },
                { p: 2, t: "J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, với un crayon de couleur, à tracer mon premier dessin.", v: "Khi đó tôi đã suy nghĩ rất nhiều về những cuộc phiêu lưu nơi rừng rậm, và đến lượt mình, tôi đã dùng bút chì màu vẽ thành công bức tranh đầu tiên của tôi." },
                { p: 2, t: "Mon dessin numéro 1. Il était comme ça.", v: "Bức tranh số 1 của tôi. Nó trông như thế này đây." },
                { p: 3, t: "J'ai montré mon chef-d'œuvre aux grandes personnes et je leur ai demandé si mon dessin leur faisait peur.", v: "Tôi khoe kiệt tác của mình với những người lớn và hỏi xem bức tranh của tôi có làm họ sợ không." },
                { p: 4, t: "Elles m'ont répondu : « Pourquoi un chapeau ferait-il peur ? »", v: "Họ trả lời tôi rằng: « Tại sao một chiếc mũ lại làm người ta sợ chứ? »" },
                { p: 4, t: "Mon dessin ne représentait pas un chapeau. Il représentait un serpent boa qui digérait un éléphant.", v: "Bức vẽ của tôi không phải là một chiếc mũ. Nó vẽ một con trăn boa đang tiêu hóa một con voi." }
              ]
            },
            {
              idx: 1,
              title: "Chapitre II — S'il vous plaît... dessine-moi un mouton !",
              lv: 1,
              words: 190,
              s: [
                { p: 0, t: "J'ai ainsi vécu seul, sans personne avec qui parler véritablement, jusqu'à une panne dans le désert de Sahara, il y a six ans.", v: "Tôi đã sống cô độc như thế, không có ai để thực sự trò chuyện, cho đến khi máy bay của tôi gặp sự cố rơi xuống sa mạc Sahara cách đây sáu năm." },
                { p: 0, t: "Quelque chose s'était cassé dans mon moteur.", v: "Một bộ phận nào đó trong động cơ của tôi đã bị hỏng." },
                { p: 1, t: "Le premier soir je me suis donc endormi sur le sable à mille milles de toute terre habitée.", v: "Đêm đầu tiên tôi đã ngủ thiếp đi trên cát, cách xa cả ngàn dặm mọi vùng đất có người sinh sống." },
                { p: 2, t: "Alors vous imaginez ma surprise, au lever du jour, quand une drôle de petite voix m'a réveillé.", v: "Bạn hãy tưởng tượng sự ngạc nhiên tột cùng của tôi, khi bình minh ló rạng, một giọng nói nhỏ bé kỳ lạ đã đánh thức tôi dậy." },
                { p: 2, t: "Elle disait : « S'il vous plaît... dessine-moi un mouton ! »", v: "Giọng nói ấy cất lên: « Làm ơn... hãy vẽ cho cháu một con cừu! »" },
                { p: 3, t: "— Hein !", v: "— Hả !" },
                { p: 3, t: "— Dessine-moi un mouton...", v: "— Vẽ cho cháu một con cừu..." },
                { p: 4, t: "Je me suis frotté bien les yeux. J'ai bien regardé. Et j'ai vu un petit bonhomme tout à fait extraordinaire qui me considérait gravement.", v: "Tôi dụi kỹ mắt mình. Tôi nhìn thật chăm chú. Và tôi thấy một cậu bé vô cùng phi thường đang nhìn tôi với vẻ nghiêm trang." }
              ]
            }
          ]
        }
      }
    ];

    function bkRenderSamples() {
      const host = document.getElementById('bk-samples'), wrap = document.getElementById('bk-samples-wrap');
      if (!host) return;
      if (!BK_SAMPLES.length) { if (wrap) wrap.style.display = 'none'; return; }
      host.innerHTML = BK_SAMPLES.map((sm) => {
        const have = bkLibrary.find((b) => b.id === sm.id);
        const pr = have ? bkProgressOf(have) : 0, tr = have && have.wordCount ? Math.min(100, Math.round((have.transWords || 0) / have.wordCount * 100)) : 0;
        const cover = bkCoverHtml({ title: sm.title, thumb: sm.thumb, hue: bkHue(sm.title) });
        return `<div class="bk-sample" role="button" tabindex="0" onclick="bkOpenSample('${sm.id}')" onkeydown="if(event.key==='Enter'){bkOpenSample('${sm.id}')}">
          ${cover.replace('class="bk-cover', 'class="bk-cover bk-cover-lg')}
          <div class="bk-sample-body">
            <span class="bk-sample-tag">Sách mẫu · dùng thử</span>
            <div class="bk-sample-title">${bkEsc(sm.title)}</div>
            <div class="bk-sample-author">${bkEsc(sm.author)}</div>
            <div class="bk-sample-note">${bkEsc(sm.note || '')}</div>
            ${have ? `<div class="bk-card-meta"><span>${have.chapterCount} chương</span><span>${((have.wordCount || 0) / 1000).toFixed(1)}k từ</span><span>Đọc ${pr}%</span>${tr ? `<span style="color:#fcd34d">Dịch ${tr}%</span>` : ''}</div><div class="bk-bar"><i style="width:${pr}%"></i></div>` : '<div class="bk-sample-note">Bấm để mở ngay: tra nghĩa, lưu từ vựng, song ngữ…</div>'}
            <span class="bk-sample-btn">${have ? (pr > 0 ? 'Tiếp tục đọc →' : 'Mở sách →') : 'Đọc thử →'}</span>
          </div>
          ${have ? `<div class="bk-card-tools"><button type="button" title="Xóa bản đã tải về máy này (tải lại bất cứ lúc nào)" onclick="event.stopPropagation(); bkRemoveSample('${sm.id}')"><i data-lucide="trash-2"></i></button></div>` : ''}
        </div>`;
      }).join('');
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }

    async function bkRemoveSample(id) {
      if (!confirm('Xóa bản sách mẫu đã tải trên trình duyệt này (kèm vị trí đọc và bản dịch)? Bạn có thể mở lại để tải lại bất cứ lúc nào.')) return;
      await bkDbDeleteBook(id);
      await bkRefreshLibrary();
    }

    async function bkOpenSample(id) {
      const sm = BK_SAMPLES.find((x) => x.id === id);
      if (!sm) return;
      const have = bkLibrary.find((b) => b.id === id);
      if (have && Array.isArray(have.outline)) { bkOpenBook(id); return; }
      if (have) await bkDbDeleteBook(id);   // bản đã lưu từ phiên bản cũ (chưa có mục lục cấp bậc) → tải lại bản mới
      bkLoading(true, 'Đang tải sách mẫu...');
      await bkTick();
      try {
        const url = sm.file ? new URL(encodeURI(sm.file), location.href).href : '';
        const extra = { sample: true, thumb: sm.thumb };
        let built = null;
        if (sm.sampleData) {
          const obj = sm.sampleData;
          if (obj && obj.format === 'shadowing-book-v1' && obj.meta && Array.isArray(obj.chapters)) {
            const now = Date.now();
            const meta = Object.assign({}, obj.meta, { id: sm.id, title: sm.title, author: sm.author, sample: true, thumb: sm.thumb, createdAt: now, openedAt: now, pos: { ch: 0, i: 0 } });
            built = { meta, recs: obj.chapters.map((c) => Object.assign({}, c, { bookId: sm.id, key: `${sm.id}:${c.idx}` })) };
          }
        }
        if (!built && sm.bundle) {   // bản dựng sẵn có song ngữ
          try {
            const r = await fetch(new URL(encodeURI(sm.bundle), location.href).href);
            if (r.ok) {
              const obj = await r.json();
              if (obj && obj.format === 'shadowing-book-v1' && obj.meta && Array.isArray(obj.chapters)) {
                const now = Date.now();
                const meta = Object.assign({}, obj.meta, { id: sm.id, title: sm.title, author: sm.author, sample: true, thumb: sm.thumb, createdAt: now, openedAt: now, pos: { ch: 0, i: 0 } });
                built = { meta, recs: obj.chapters.map((c) => Object.assign({}, c, { bookId: sm.id, key: `${sm.id}:${c.idx}` })) };
              }
            }
          } catch (e) { /* không có bản dựng sẵn → dùng EPUB */ }
        }
        if (!built) {
          const r = await fetch(url);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const buf = await r.arrayBuffer();
          bkLoading(true, 'Đang đọc sách...');
          await bkTick();
          const parsed = await bkParseEpub(buf);
          const res = bkChapterize(parsed.blocks, { mode: 'auto' });
          const chosen = res.chapters.filter((c) => !c.skipDefault && !BK_SKIP_TITLE.test((c.title || '').trim()) && !(sm.skip && sm.skip.test((c.title || '').trim())));
          if (!chosen.length) throw new Error('Không tìm thấy nội dung trong file sách');
          bkLoading(true, 'Đang tách câu và lưu sách...');
          await bkTick();
          built = await bkBuildBook(chosen, { id: sm.id, title: sm.title, author: sm.author, fmt: 'epub', extra });
        }
        await bkDbSaveBook(built.meta, built.recs);
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
        if (built.meta.transWords > 0) { bkPrefs.bi = true; bkSavePrefs(); }   // có sẵn bản dịch → hiện song ngữ cho người xem lần đầu
        await bkRefreshLibrary();
        bkLoading(false);
        bkOpenBook(sm.id);
      } catch (e) {
        console.error(e);
        bkLoading(false);
        const local = location.protocol === 'file:';
        alert('Không tải được sách mẫu.\n' + (local
          ? 'Bạn đang mở index.html trực tiếp từ máy (file://) nên trình duyệt chặn việc đọc file đi kèm. Khi đã đưa lên web (hoặc chạy bằng một máy chủ cục bộ) thì sẽ mở được.'
          : `Hãy kiểm tra file “${sm.file}” có nằm cùng thư mục với index.html trên host hay không.`) + '\n(' + (e && e.message ? e.message : e) + ')');
      }
    }

    // ==================== ĐỊNH TUYẾN BẰNG HASH (#) ====================
    // Mỗi màn hình có địa chỉ riêng:  #/  trang chủ · #/vocab  từ vựng đã lưu · #/watch/<videoId>  luyện video
    //                                 #/read/<id>  luyện bài viết/văn bản · #/book/<bookId>  đọc sách · #/guide · #/donate
    // Mỗi giao diện luyện tập cũng có link riêng (để F5 không bị quay về Mặc định):
    //   #/watch/<id>  hoặc  #/read/<id>  = Mặc định ·  .../shadowing  = Shadowing ·  .../dictation  = Chép chính tả
    // - Đổi màn hình (bằng bất kỳ nút nào trong app) -> tự cập nhật hash (thêm 1 mục lịch sử, nên Back/Forward chạy tự nhiên).
    // - Tải trang / bấm Back, Forward / sửa hash tay -> đọc hash rồi mở đúng màn hình.
    // - Link cũ dạng #share=... và ?v=... vẫn do code chia sẻ cũ xử lý, router không đụng tới.
    (function setupHashRouter() {
      const $ = (id) => document.getElementById(id);
      const vis = (id) => { const e = $(id); return !!e && !e.classList.contains('hidden'); };
      const SCREENS = ['screen-input', 'screen-practice', 'screen-vocab', 'screen-book', 'screen-guide', 'screen-donate', 'screen-vt'];
      let ready = false;      // chỉ ghi hash sau khi app khởi động xong
      let routing = 0;        // > 0: router đang tự chuyển màn hình, không ghi ngược lại hash
      let syncTimer = null;

      const norm = (h) => { h = String(h || '').replace(/^#/, ''); return (!h || h === '/') ? '/' : h; };
      const dec = (x) => { try { return decodeURIComponent(x); } catch (e) { return x; } };
      const same = (a, b) => a === b || dec(a) === dec(b);   // trình duyệt có thể mã hoá lại hash, nên so sánh cả dạng đã giải mã
      const isShare = () => /^#share=/.test(location.hash || '');
      const setHash = (r, replace) => {
        const url = location.pathname + location.search + '#' + r;
        try { if (replace) history.replaceState(null, '', url); else location.hash = '#' + r; } catch (e) {}
      };

      // Mỗi mục ở trang chủ có link riêng:  #/ (Luyện với Video) · #/articles (Đọc báo/IELTS) · #/books (Đọc sách) · #/translate (Luyện dịch Việt → Pháp)
      // Bài trong mục Luyện dịch Việt → Pháp:  #/translate/<mã bài>.   (Còn #/watch, #/read, #/book như cũ.)
      const MODE_ROUTE = { video: '/', text: '/articles', book: '/books', vt: '/translate', 'custom-yt': '/custom-video' };

      // ----- trạng thái màn hình -> route -----
      function stateRoute() {
        if (vis('screen-vocab')) return '/vocab';
        if (vis('screen-book')) return bkBook ? '/book/' + encodeURIComponent(bkBook.id) : null;
        if (vis('screen-practice')) {
          if (!currentVideoId) return null;
          const pv = window.pvGetView ? window.pvGetView() : 'default';
          return (isTextMode ? '/read/' : '/watch/') + encodeURIComponent(currentVideoId) + (pv && pv !== 'default' ? '/' + pv : '');
        }
        if (vis('screen-guide')) return '/guide';
        if (vis('screen-donate')) return '/donate';
        if (vis('screen-vt')) { const k = window.vtCurrentKey ? window.vtCurrentKey() : ''; return k ? '/translate/' + encodeURIComponent(k) : null; }
        if (vis('screen-input')) {
          const lr = (currentInputMode === 'video' && window.libCatRoute) ? window.libCatRoute() : '';   // trang riêng của thể loại: #/library/<thể loại>[/<playlist>]
          return lr || MODE_ROUTE[currentInputMode] || '/';
        }
        return null;
      }

      // Người dùng đổi màn hình trong app -> cập nhật hash (thêm mục lịch sử)
      function syncHash() {
        if (!ready || routing || isShare()) return;
        const r = stateRoute();
        if (r == null || same(norm(location.hash), r)) return;
        setHash(r, false);
      }
      function scheduleSync() { clearTimeout(syncTimer); syncTimer = setTimeout(syncHash, 30); }
      const mo = new MutationObserver(scheduleSync);
      SCREENS.forEach((id) => { const e = $(id); if (e) mo.observe(e, { attributes: true, attributeFilter: ['class'] }); });

      // ----- route -> mở màn hình -----
      // Về trang chủ từ bất kỳ màn hình nào, dùng đúng các hàm thoát có sẵn (dọn loop, lưu vị trí đọc, khôi phục cuộn...)
      function leaveToHome() {
        if (vis('screen-vocab')) {
          const back = vocabReturnTo;
          closeVocabScreen();                                  // trở lại nơi đã mở Từ vựng
          if (back === 'practice' && vis('screen-practice')) backToInputScreen();
          else if (back === 'book' && vis('screen-book')) bkClose();
        } else if (vis('screen-practice')) backToInputScreen();
        else if (vis('screen-vt')) { if (window.vtClose) window.vtClose(); }
        else if (vis('screen-book')) bkClose();
        else if (vis('screen-guide')) closeGuideScreen();
        else if (vis('screen-donate')) closeDonateScreen();
      }

      function toast(msg) { try { showVocabToast(msg, false); } catch (e) {} }

      async function openVideo(id) {
        const h = getLocalHistory().find((x) => x.videoId === id && !x.isText && x.sentences && x.sentences.length);
        if (h) { loadFromHistory(id); return vis('screen-practice'); }
        // Không có trong lịch sử trên máy này -> thử thư viện video có sẵn của trang
        let title = '';
        if (typeof categoryStructure !== 'undefined' && categoryStructure) {
          Object.keys(categoryStructure).forEach((k) => { if (categoryStructure[k] && categoryStructure[k][id]) title = categoryStructure[k][id]; });
        }
        const meta = typeof videoMetadataMap !== 'undefined' ? videoMetadataMap[id] : null;
        if (meta && meta.title) title = meta.title;
        if (/^[\w-]{6,20}$/.test(id)) { try { await selectCategoryVideo(id, title); } catch (e) {} }
        if (vis('screen-practice')) return true;
        toast('Không tìm thấy video này trên thiết bị. Hãy import lại bằng extension hoặc chọn từ thư viện.');
        return false;
      }

      async function openText(id) {
        const h = getLocalHistory().find((x) => x.videoId === id && x.isText && x.sentences && x.sentences.length);
        if (h) { loadFromHistory(id); return vis('screen-practice'); }
        if (/^art_lib_/.test(id)) { try { await openLibraryArticle(id.slice(8)); } catch (e) {} }   // bài trong thư mục articles/
        else if (/^art_/.test(id)) { try { await selectCategoryArticle(id.slice(4), ''); } catch (e) {} }
        if (vis('screen-practice')) return true;
        toast('Không tìm thấy bài viết này trên thiết bị.');
        return false;
      }

      async function navigate(target) {
        const parts = target.split('/');                 // '/watch/abc' -> ['', 'watch', 'abc']
        const kind = parts[1] || '';
        let id = parts.slice(2).join('/');
        try { id = decodeURIComponent(id); } catch (e) {}

        switch (kind) {
          case '':
          case 'video':
            leaveToHome();
            setInputMode('video');
            if (window.closeLibraryCategory) window.closeLibraryCategory();
            return;
          case 'library': {
            if (!vis('screen-input')) leaveToHome();
            setInputMode('video');
            const dc = (x) => { try { return decodeURIComponent(x || ''); } catch (e) { return x || ''; } };
            if (window.libOpenFromRoute) window.libOpenFromRoute(dc(parts[2]), dc(parts[3]));
            return;
          }
          case 'articles':
          case 'books':
          case 'translate':
          case 'custom-video': {
            const mode = kind === 'articles' ? 'text' : (kind === 'books' ? 'book' : (kind === 'custom-video' ? 'custom-yt' : 'vt'));
            if (!vis('screen-input')) leaveToHome();
            setInputMode(mode);
            if (kind === 'translate' && id && window.vtOpenKey) await window.vtOpenKey(id);
            return;
          }
          case 'vocab':
            if (vis('screen-guide') || vis('screen-donate')) leaveToHome();
            openVocabScreen();
            return;
          case 'guide':
            if (!vis('screen-input')) leaveToHome();
            openGuideScreen();
            return;
          case 'donate':
            if (!vis('screen-input')) leaveToHome();
            openDonateScreen();
            return;
          case 'watch':
          case 'read': {
            const text = kind === 'read';
            // Đuôi /shadowing hoặc /dictation (hoặc /default) = giao diện luyện tập cần mở
            let wantView = 'default';
            const rest = parts.slice(2);
            if (rest.length > 1 && /^(default|shadowing|dictation)$/.test(rest[rest.length - 1])) {
              wantView = rest.pop();
              try { id = decodeURIComponent(rest.join('/')); } catch (e) { id = rest.join('/'); }
            }
            const applyView = () => { if (vis('screen-practice') && window.pvSetView) { try { window.pvSetView(wantView); } catch (e) {} } };
            // Đang ở Từ vựng mà video/bài này vẫn đang mở phía sau -> chỉ cần quay lại, không nạp lại
            if (vis('screen-vocab') && vocabReturnTo === 'practice' && currentVideoId === id && isTextMode === text && sentences.length) { closeVocabScreen(); applyView(); return; }
            // Đang mở đúng video/bài này rồi (ví dụ bấm Back/Forward giữa các giao diện) -> chỉ đổi giao diện, không nạp lại
            if (vis('screen-practice') && currentVideoId === id && isTextMode === text && sentences.length) { applyView(); return; }
            if (!vis('screen-input')) leaveToHome();
            await (text ? openText(id) : openVideo(id));
            applyView();
            return;
          }
          case 'book': {
            if (vis('screen-vocab') && vocabReturnTo === 'book' && bkBook && bkBook.id === id && bkChs.length) { closeVocabScreen(); return; }
            if (!vis('screen-input')) leaveToHome();
            await bkOpenBook(id, {});
            return;
          }
          default:
            leaveToHome();
        }
      }

      async function applyRoute() {
        if (isShare()) return;                              // link chia sẻ cũ: do openSharedFromHash xử lý
        const target = norm(location.hash);
        const cur0 = stateRoute();
        if (cur0 != null && same(target, cur0)) return;    // đã đúng màn hình rồi
        routing++;
        try { await navigate(target); }
        catch (e) { console.warn('[router]', e); }
        finally {
          routing--;
          setTimeout(() => {
            // Không mở được (video/sách không còn trên máy...) -> sửa hash cho khớp màn hình thực tế (thay, không thêm mục lịch sử)
            const r = stateRoute();
            if (r != null && !same(norm(location.hash), r)) setHash(r, true);
          }, 0);
        }
      }

      window.addEventListener('hashchange', () => { if (ready) applyRoute(); });
      window.__routerSync = scheduleSync;   // giao diện luyện tập đổi (Mặc định / Shadowing / Chép chính tả) -> cập nhật hash

      // Gọi từ DOMContentLoaded: đọc hash khi tải trang (F5 / mở link) rồi mới bật chế độ tự ghi hash
      window.__routerBoot = async function (catPromise, skip) {
        const unhide = () => { try { document.documentElement.classList.remove('rt-boot'); if (window.homeNavRefresh) window.homeNavRefresh(); } catch (e) {} };
        if (skip) { ready = true; unhide(); return; }      // đang mở link chia sẻ (#share / ?v=): code chia sẻ tự mở màn hình
        if (norm(location.hash) !== '/') {
          // Màn hình nào KHÔNG cần thư viện video thì mở ngay, không chờ category.json / catalog.json:
          // từ vựng, hướng dẫn, ủng hộ, sách, bài viết đã lưu, và video do chính người dùng nhập (đã có đủ phụ đề trên máy).
          // Video thư viện (hoặc link mở từ máy khác) vẫn phải chờ thư viện nạp xong để lấy đúng dữ liệu từ server.
          const t = norm(location.hash), parts = t.split('/');
          let needLib = true;
          if (/^\/(vocab|guide|donate|book|read)(\/|$)/.test(t)) needLib = false;
          else if (parts[1] === 'watch') {
            let id = parts[2] || ''; try { id = decodeURIComponent(id); } catch (e) {}
            try { const it = getLocalHistory().find((x) => x.videoId === id && !x.isText); needLib = !(it && it.sentences && it.sentences.length && it.userTrans === true); } catch (e) {}
          }
          if (needLib) { try { await catPromise; } catch (e) {} }
          if (!/^#\//.test(location.hash)) { ready = true; unhide(); return; }
          try { await applyRoute(); } catch (e) {}
        }
        ready = true;
        unhide();
        scheduleSync();
      };
    })();


  