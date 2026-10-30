
  (function () {
    const wrap = document.getElementById('fs-wrap'), btn = document.getElementById('fs-btn'), pop = document.getElementById('fs-pop');
    if (!wrap || !pop) return;

    const isOpen = () => !pop.classList.contains('pv-x');
    function close() {
      pop.classList.add('pv-x');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    // ==================== QUẢN LÝ CỠ CHỮ & GIÃN DÒNG CÂU HIỆN TẠI (#cs-text) ====================
    const KEY_CS_FS = 'fs_cs_font_size';
    const KEY_CS_LH = 'fs_cs_line_height';

    function getDefaultCsFontSize() {
      return (window.innerWidth <= 768) ? 15.5 : 21;
    }
    const DEFAULT_CS_LH = 1.35;

    let curCsFontSize = parseFloat(localStorage.getItem(KEY_CS_FS)) || getDefaultCsFontSize();
    let curCsLineHeight = parseFloat(localStorage.getItem(KEY_CS_LH)) || DEFAULT_CS_LH;

    function applyCurrentSentenceStyle() {
      document.documentElement.style.setProperty('--cs-font-size', `${curCsFontSize}px`);
      document.documentElement.style.setProperty('--cs-line-height', String(curCsLineHeight));
    }

    window.changeCurrentSentenceFontSize = function (delta) {
      curCsFontSize = Math.max(12, Math.min(36, Number((curCsFontSize + delta).toFixed(1))));
      try { localStorage.setItem(KEY_CS_FS, String(curCsFontSize)); } catch (e) {}
      applyCurrentSentenceStyle();
    };

    window.resetCurrentSentenceFontSize = function () {
      curCsFontSize = getDefaultCsFontSize();
      try { localStorage.removeItem(KEY_CS_FS); } catch (e) {}
      applyCurrentSentenceStyle();
    };

    window.changeCurrentSentenceLineHeight = function (delta) {
      curCsLineHeight = Math.max(1.1, Math.min(2.2, Number((curCsLineHeight + delta).toFixed(2))));
      try { localStorage.setItem(KEY_CS_LH, String(curCsLineHeight)); } catch (e) {}
      applyCurrentSentenceStyle();
    };

    window.resetCurrentSentenceLineHeight = function () {
      curCsLineHeight = DEFAULT_CS_LH;
      try { localStorage.removeItem(KEY_CS_LH); } catch (e) {}
      applyCurrentSentenceStyle();
    };

    // Áp dụng ngay khi nạp trang
    applyCurrentSentenceStyle();

    // ==================== ĐÓNG / MỞ POPUP AA & ĐỊNH VỊ NỔI CANH PHẢI ====================
    window.toggleTextSizePanel = function (e) {
      if (e) e.stopPropagation();
      const open = !isOpen();
      pop.classList.toggle('pv-x', !open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        // Trên mobile, nút Aa bị ẩn trong header nên anchor lấy nút sandwich 3 sọc hoặc chính button sự kiện
        let anchor = btn;
        if (!anchor || anchor.offsetParent === null) {
          anchor = document.getElementById('practice-sandwich-btn') || (e && e.currentTarget) || document.body;
        }
        if (window.pvPlaceFloating) {
          window.pvPlaceFloating(pop, anchor, 'right');
        }
      }
    };

    document.addEventListener('mousedown', (e) => {
      if (isOpen() && !wrap.contains(e.target) && !pop.contains(e.target) && !(e.target.closest && e.target.closest('#practice-sandwich-btn'))) {
        close();
      }
    });
    document.addEventListener('touchstart', (e) => {
      if (isOpen() && !wrap.contains(e.target) && !pop.contains(e.target) && !(e.target.closest && e.target.closest('#practice-sandwich-btn'))) {
        close();
      }
    }, { passive: true });
    window.addEventListener('resize', () => { if (isOpen()) close(); });
    window.addEventListener('orientationchange', () => { if (isOpen()) close(); });
    (function () {
      const h = document.querySelector('#screen-practice header');
      if (h) h.addEventListener('scroll', () => { if (isOpen()) close(); }, { passive: true });
    })();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) close(); }, true);
    new MutationObserver(close).observe(document.body, { attributes: true, attributeFilter: ['data-pv-view'] });
  })();
