
/* Thanh timeline + nút CC (phụ đề trên video) + thông tin video — giao diện Mặc định */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isTouch = () => window.matchMedia && matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* ---------- Phụ đề trên video: trạng thái (ghi nhớ trong trình duyệt) ---------- */
  const KEY = 'shadowing_master_vid_sub_prefs_v1';
  const S = { en: true, vi: true, size: null };   // size = null: theo cỡ chữ phụ đề bên phải
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (o) {
      if (typeof o.en === 'boolean') S.en = o.en;
      if (typeof o.vi === 'boolean') S.vi = o.vi;
      if (o.size != null && isFinite(o.size) && o.size >= 10 && o.size <= 48) S.size = +o.size;
    }
  } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  /* Điện thoại + máy tính bảng (cảm ứng): công tắc "Phụ đề Việt" luôn TẮT mỗi khi mở một video (người dùng iPad ngang vẫn tự bật được trong nút CC). */
  if (isTouch()) S.vi = false;
  function onVideoOpen() { if (isTouch() && S.vi) { S.vi = false; try { uiSync(); } catch (e) {} } }
  function hasTr() { try { return typeof aicHasTranslation === 'function' && aicHasTranslation(sentences); } catch (e) { return false; } }
  function rightSize() { try { return typeof currentSubFontSize === 'number' ? currentSubFontSize : 19; } catch (e) { return 19; } }
  const effSize = () => (S.size != null ? S.size : rightSize());
  const fmtSize = (v) => String(+(+v).toFixed(1));

  function applySize() {
    const st = document.documentElement.style;
    if (S.size == null) { st.removeProperty('--vid-sub-font-size'); st.removeProperty('--vid-sub-trans-size'); }
    else { st.setProperty('--vid-sub-font-size', S.size + 'px'); st.setProperty('--vid-sub-trans-size', Math.max(11, Math.round(S.size * 0.95)) + 'px'); }
  }

  /* ---------- Cửa sổ CC ---------- */
  const ccBtn = $('cc-btn'), ccPop = $('cc-pop');
  let lastTr = null;
  function setSw(el, on) { el.setAttribute('aria-checked', on ? 'true' : 'false'); }
  function uiSync() {
    if (!ccBtn || !ccPop) return;
    const tr = hasTr();
    lastTr = tr;
    setSw($('cc-vi'), tr && S.vi);
    $('cc-vi').disabled = !tr;
    $('cc-vi-note').textContent = tr ? '' : 'Video này chưa có bản dịch song ngữ';
    $('cc-val').textContent = fmtSize(effSize());
    const hint = $('cc-hint');
    if (S.size == null) { hint.textContent = 'Đang theo cỡ chữ bên phải'; hint.classList.remove('act'); hint.disabled = true; }
    else { hint.textContent = 'Đặt lại theo cỡ chữ bên phải'; hint.classList.add('act'); hint.disabled = false; }
    ccBtn.classList.toggle('on', !!(tr && S.vi));
  }
  function ccPlace() {
    if (ccPop.classList.contains('pv-x')) return;
    const r = ccBtn.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(ccPop.offsetWidth || 268, vw - 16), h = ccPop.offsetHeight || 220;
    const left = clamp(r.right - w, 8, Math.max(8, vw - w - 8));
    const top = (vh - r.bottom - 10 >= h) ? r.bottom + 10 : Math.max(8, r.top - h - 10);
    ccPop.style.left = Math.round(left) + 'px';
    ccPop.style.top = Math.round(top) + 'px';
  }
  function ccOpen(open) {
    if (open) { uiSync(); ccPop.classList.remove('pv-x'); ccPlace(); }
    else ccPop.classList.add('pv-x');
    ccBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  /* Ẩn nút CC: điện thoại (cạnh ngắn của màn hình < 600px, cả dọc lẫn ngang) và máy tính bảng đang quay dọc. */
  let ccOff = null;
  function ccShouldHide() {
    if (!isTouch()) return false;
    const portrait = !!(window.matchMedia && matchMedia('(orientation: portrait)').matches);
    const shortSide = Math.min(screen.width || 9999, screen.height || 9999);
    return portrait || shortSide < 600;
  }
  function syncCcVisibility() {
    const off = ccShouldHide();
    if (off === ccOff) return;
    const first = ccOff === null;
    ccOff = off;
    document.documentElement.classList.toggle('cc-off', off);
    if (off && ccPop && !ccPop.classList.contains('pv-x')) ccOpen(false);
    if (!first) { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }   // để thanh nút điều khiển đo lại bố cục
  }
  if (ccBtn && ccPop) {
    window.addEventListener('resize', syncCcVisibility);
    window.addEventListener('orientationchange', syncCcVisibility);
    syncCcVisibility();
    document.body.appendChild(ccPop);   // đưa ra <body> để không bị khung cuộn / bo góc cắt mất
    ccBtn.addEventListener('click', (e) => { e.stopPropagation(); ccOpen(ccPop.classList.contains('pv-x')); try { ccBtn.blur(); } catch (_) {} });
    document.addEventListener('pointerdown', (e) => {
      if (ccPop.classList.contains('pv-x')) return;
      if (ccPop.contains(e.target) || ccBtn.contains(e.target)) return;
      ccOpen(false);
    }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ccPop.classList.contains('pv-x')) ccOpen(false); });
    let raf = 0;
    const rePlace = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; ccPlace(); }); };
    window.addEventListener('resize', rePlace);
    window.addEventListener('scroll', rePlace, true);
    $('cc-vi').addEventListener('click', () => { if (!hasTr()) return; S.vi = !S.vi; save(); uiSync(); });
    const step = (d) => { S.size = clamp(Math.round((effSize() + d) * 2) / 2, 10, 48); save(); applySize(); uiSync(); };
    $('cc-dec').addEventListener('click', () => step(-1));
    $('cc-inc').addEventListener('click', () => step(1));
    $('cc-hint').addEventListener('click', () => { if (S.size == null) return; S.size = null; save(); applySize(); uiSync(); });
    // Bản dịch có thể được thêm / xóa lúc đang xem: cập nhật trạng thái nút
    setInterval(() => { const tr = hasTr(); if (tr !== lastTr) uiSync(); }, 500);
    applySize();
    uiSync();
  }

  /* ---------- Thanh timeline ---------- */
  const track = $('tl-track');
  const TL = { drag: false, t: 0, dur: 0, durAt: 0, hold: null, rect: null, pct: -1, buf: -1, sec: -1, durSec: -1, vid: null };
  const sp = $('screen-practice');
  function fmt(t) {
    t = Math.max(0, Math.floor(t));
    const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') : m + ':' + String(s).padStart(2, '0');
  }
  function getDur() {
    let d = 0;
    try { if (ytPlayer && isPlayerReady && ytPlayer.getDuration) d = ytPlayer.getDuration() || 0; } catch (e) {}
    if (!(d > 0) && sentences && sentences.length) { const l = sentences[sentences.length - 1]; d = (l.endTime || 0) + 1; }
    return d;
  }
  function tlActive() {
    if (!sp || sp.classList.contains('hidden')) return false;
    try { if (isTextMode) return false; } catch (e) {}
    return !(window.pvGetView && window.pvGetView() !== 'default');
  }
  if (track) {
    const fill = $('tl-fill'), buf = $('tl-buf'), hov = $('tl-hov'), thumb = $('tl-thumb'), tip = $('tl-tip');
    const curEl = $('tl-cur'), durEl = $('tl-dur');
    let tipW = 0, tipTxt = '';

    function setPct(p) {
      if (Math.abs(p - TL.pct) < 0.00004 && !(p === 0 || p === 1)) return;
      if (p === TL.pct) return;
      TL.pct = p;
      fill.style.transform = 'scaleX(' + p + ')';
      thumb.style.left = (p * 100) + '%';
    }
    /* Thời gian HIỂN THỊ trên thanh: tự chạy theo đồng hồ giữa các lần YouTube báo giờ, và bắt đầu chạy NGAY khi bấm Play
       (YouTube mất ~0,3s "buffering" sau khi bấm Play mới báo giờ mới, nên đọc thẳng getCurrentTime thì thanh bị đứng im lúc đó).
       Thanh không bao giờ chạy trước video thật quá ~0,1s lúc vừa bấm Play (~0,35s khi đang phát bình thường). */
    TL.disp = -1; TL.dispAt = 0; TL.wasWant = false; TL.rawMoved = true; TL.rawAtStart = 0;
    function smoothTime(raw, now) {
      const dt = TL.dispAt ? Math.min(0.1, (now - TL.dispAt) / 1000) : 0;
      TL.dispAt = now;
      let want = false;
      const pb = document.getElementById('btn-toggle-play');
      if (pb) want = pb.classList.contains('is-playing'); else { try { want = !!isPlaying; } catch (e) {} }
      let rate = 1; try { rate = (ytPlayer && ytPlayer.getPlaybackRate && ytPlayer.getPlaybackRate()) || 1; } catch (e) {}
      if (want && !TL.wasWant) { TL.rawMoved = false; TL.rawAtStart = raw; TL.startLead = TL.disp < 0 ? 0 : Math.max(0, TL.disp - raw); }
      TL.wasWant = want;
      if (!TL.rawMoved && Math.abs(raw - TL.rawAtStart) > 0.01) TL.rawMoved = true;
      let d = TL.disp;
      if (d < 0 || raw - d > 0.8) d = raw;                      // chưa có mốc / video vừa nhảy tới trước nhiều (tua) -> bám đúng giờ thật
      else if (!want) { if (Math.abs(raw - d) > 0.4) d = raw; } // đang dừng: giữ nguyên chỗ đã dừng, chỉ nhảy khi bị tua đi nơi khác
      else {
        d += dt * rate;
        const cap = TL.rawMoved ? 0.35 : (TL.startLead || 0) + 0.3;   // lúc vừa bấm Play: cho chạy trước tối đa 0,3s (đúng thời gian YouTube cần để bắt đầu phát lại)
        if (d > raw + cap) d = raw + cap;                       // không chạy vượt video thật quá cap (cũng kéo về khi video nhảy lùi, vd. loop)
        else if (d < raw) d += (raw - d) * Math.min(1, dt * 10); // đang chậm hơn video thật -> đuổi kịp mượt
        if (TL.rawMoved && d > raw + 0.04) d -= (d - raw - 0.04) * Math.min(1, dt * 2.5);   // đã chạy bình thường: độ chạy trước co dần về ~0
      }
      TL.disp = d;
      return d;
    }
    function frame() {
      requestAnimationFrame(frame);
      if (!tlActive()) return;
      const now = performance.now();
      let vid = ''; try { vid = currentVideoId; } catch (e) {}
      if (vid !== TL.vid) { TL.vid = vid; TL.hold = null; TL.durAt = 0; TL.pct = -1; TL.buf = -1; TL.sec = -1; }
      if (now - TL.durAt > 400) {
        TL.durAt = now;
        const d = getDur();
        if (d !== TL.dur) { TL.dur = d; track.setAttribute('aria-valuemax', String(Math.round(d))); }
        const ds = Math.floor(d);
        if (ds !== TL.durSec) { TL.durSec = ds; durEl.textContent = fmt(d); }
        try {
          const lf = (ytPlayer && isPlayerReady && ytPlayer.getVideoLoadedFraction) ? (ytPlayer.getVideoLoadedFraction() || 0) : 0;
          if (Math.abs(lf - TL.buf) > 0.001) { TL.buf = lf; buf.style.transform = 'scaleX(' + clamp(lf, 0, 1) + ')'; }
        } catch (e) {}
      }
      let cur = 0;
      if (TL.drag) { cur = TL.t; TL.disp = cur; TL.dispAt = now; }
      else {
        try { if (ytPlayer && isPlayerReady && ytPlayer.getCurrentTime) cur = ytPlayer.getCurrentTime() || 0; } catch (e) {}
        if (TL.hold) {
          // Vừa tua: giữ nguyên vị trí mới trên thanh cho tới khi video thực sự tới nơi (không bị giật ngược về chỗ cũ)
          if (Date.now() > TL.hold.until || Math.abs(cur - TL.hold.t) < 0.6) TL.hold = null; else { cur = TL.hold.t; TL.disp = cur; TL.dispAt = now; }
        }
        if (!TL.hold) cur = smoothTime(cur, now);
      }
      const d = TL.dur;
      setPct(d > 0 ? clamp(cur / d, 0, 1) : 0);
      const s = Math.floor(cur);
      if (s !== TL.sec) { TL.sec = s; curEl.textContent = fmt(cur); track.setAttribute('aria-valuenow', String(s)); }
    }
    requestAnimationFrame(frame);

    function ratioAt(x, r) { return r.width > 0 ? clamp((x - r.left) / r.width, 0, 1) : 0; }
    function showTip(ratio, r) {
      const d = TL.dur > 0 ? TL.dur : getDur();
      const txt = fmt(ratio * d);
      if (txt !== tipTxt) { tipTxt = txt; tip.textContent = txt; tipW = tip.offsetWidth; }
      // Định vị bằng %, không dùng px: bảng điều khiển bị CSS zoom (1.15-1.25) nên px đo từ getBoundingClientRect (toạ độ màn hình)
      // đem áp lại vào bên trong khung zoom sẽ bị nhân thêm hệ số zoom -> càng gần cuối thanh càng lệch xa con trỏ.
      // Cách này: mép trái của tip ở đúng vị trí ratio, rồi lùi lại ratio x chiều rộng chính nó -> tip luôn nằm trọn
      // trong thanh (đầu thanh: mép trái thẳng hàng, cuối thanh: mép phải thẳng hàng, giữa thanh: ngay trên con trỏ).
      tip.style.left = (ratio * 100).toFixed(3) + '%';
      tip.style.transform = 'translateX(' + (-ratio * 100).toFixed(3) + '%)';
      hov.style.transform = 'scaleX(' + ratio + ')';
    }
    function commit(t) {
      let playing = false; try { playing = !!isPlaying; } catch (e) {}
      TL.hold = { t: t, until: Date.now() + 1200 };
      try { seekToTime(t, undefined, playing, null, true); } catch (e) {}
    }
    track.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') track.classList.add('hot'); });
    track.addEventListener('pointerleave', () => { if (!TL.drag) track.classList.remove('hot'); });
    track.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      TL.dur = getDur();
      if (!(TL.dur > 0)) return;
      TL.rect = track.getBoundingClientRect();
      TL.drag = true;
      try { track.setPointerCapture(e.pointerId); } catch (_) {}
      track.classList.add('drag', 'hot');
      const ratio = ratioAt(e.clientX, TL.rect);
      TL.t = ratio * TL.dur;
      showTip(ratio, TL.rect);
      e.preventDefault();
    });
    track.addEventListener('pointermove', (e) => {
      const r = TL.drag ? TL.rect : track.getBoundingClientRect();
      const ratio = ratioAt(e.clientX, r);
      if (TL.drag) TL.t = ratio * TL.dur;
      else if (e.pointerType !== 'mouse') return;
      showTip(ratio, r);
    });
    function endDrag(ok, e) {
      if (!TL.drag) return;
      TL.drag = false;
      track.classList.remove('drag');
      try { track.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!(e.pointerType === 'mouse' && track.matches(':hover'))) track.classList.remove('hot');
      if (ok) commit(TL.t);
    }
    track.addEventListener('pointerup', (e) => endDrag(true, e));
    track.addEventListener('pointercancel', (e) => endDrag(false, e));
    track.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /* ---------- Thông tin video: tiêu đề, kênh, lượt xem ---------- */
  function renderInfo(videoId) {
    const box = $('vid-info'), tEl = $('vi-title'), mEl = $('vi-meta');
    if (!box || !tEl || !mEl) return;
    let hist = null, meta = {};
    try { hist = (typeof getLocalHistory === 'function' ? getLocalHistory() : []).find((h) => h.videoId === videoId && !h.isText) || null; } catch (e) {}
    try { meta = Object.assign({}, hist && hist.meta, (typeof videoMetadataMap === 'object' && videoMetadataMap && videoMetadataMap[videoId]) || {}); } catch (e) {}
    let cvt = ''; try { cvt = typeof currentVideoTitle === 'string' ? currentVideoTitle : ''; } catch (e) {}
    const title = String(meta.title || cvt || (hist && hist.title) || '').trim();
    tEl.textContent = title;
    tEl.title = title;
    mEl.textContent = '';
    const channel = String(meta.channelTitle || '').trim();
    const views = meta.viewCount && typeof formatViews === 'function' ? formatViews(meta.viewCount) : '';
    if (channel) { const c = document.createElement('span'); c.className = 'vi-ch'; c.textContent = channel; c.title = channel; mEl.appendChild(c); }
    if (channel && views) { const d = document.createElement('span'); d.className = 'vi-dot'; d.textContent = '·'; mEl.appendChild(d); }
    if (views) { const v = document.createElement('span'); v.className = 'vi-views'; v.textContent = views; mEl.appendChild(v); }
    box.classList.toggle('empty', !title && !channel && !views);
  }

  window.VP = {
    showEn: () => S.en,
    showVi: () => S.vi && hasTr(),
    onRightSize: uiSync,
    onVideoOpen: onVideoOpen,
    renderInfo: renderInfo
  };
})();
