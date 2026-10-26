
  (function () {
    const wrap = document.getElementById('fs-wrap'), btn = document.getElementById('fs-btn'), pop = document.getElementById('fs-pop');
    if (!wrap || !btn || !pop) return;
    const isOpen = () => !pop.classList.contains('pv-x');
    function close() { pop.classList.add('pv-x'); btn.setAttribute('aria-expanded', 'false'); }
    window.toggleTextSizePanel = function (e) {
      if (e) e.stopPropagation();
      const open = !isOpen();
      pop.classList.toggle('pv-x', !open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && window.pvPlaceFloating) window.pvPlaceFloating(pop, btn, 'right');
    };
    document.addEventListener('mousedown', (e) => { if (isOpen() && !wrap.contains(e.target) && !pop.contains(e.target)) close(); });
    document.addEventListener('touchstart', (e) => { if (isOpen() && !wrap.contains(e.target) && !pop.contains(e.target)) close(); }, { passive: true });
    window.addEventListener('resize', () => { if (isOpen()) close(); });
    window.addEventListener('orientationchange', () => { if (isOpen()) close(); });
    (function () { const h = document.querySelector('#screen-practice header'); if (h) h.addEventListener('scroll', () => { if (isOpen()) close(); }, { passive: true }); })();
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isOpen()) close(); }, true);
    new MutationObserver(close).observe(document.body, { attributes: true, attributeFilter: ['data-pv-view'] });
  })();
  