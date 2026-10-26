
  (function () {
    const root = document.documentElement;
    const expandedRows = new Set();           // nhớ hàng nào đang mở rộng, để không mất khi trang chủ vẽ lại

    const getMoreWrappers = () => Array.from(document.querySelectorAll('#netflix-categories-container .netflix-row-wrapper, #text-history-container .netflix-row-wrapper, #library-cat-page .netflix-row-wrapper'));   // gồm cả hàng ở tab Đọc báo/IELTS
    const homeVisible = () => { const h = document.getElementById('screen-input'); return !!h && !h.classList.contains('hidden') && !root.classList.contains('rt-boot'); };

    /* ---------------- "XEM THÊM" ---------------- */
    function syncMoreButtons() {
      getMoreWrappers().forEach((w) => {
        const row = w.querySelector('.netflix-scroll-row');
        const btn = w.querySelector('.row-more-btn');
        if (!row || !btn) return;
        if (btn.dataset.page) { btn.classList.add('show'); return; }   // nút "Xem thêm" mở trang riêng của thể loại: luôn hiện
        const open = expandedRows.has(row.id);
        w.classList.toggle('is-expanded', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        const tt = w.querySelector('.row-title-toggle'); if (tt) tt.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.querySelector('.rm-label').textContent = open ? 'Thu gọn' : 'Xem thêm';
        btn.title = open ? 'Thu gọn về một hàng' : 'Hiện tất cả các mục trong hàng này';
        const overflowing = row.clientWidth > 0 && row.scrollWidth > row.clientWidth + 2;
        btn.classList.toggle('show', open || overflowing);
      });
    }

    window.toggleRowExpand = function (rowId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const w = row.closest('.netflix-row-wrapper');
      const willOpen = !expandedRows.has(rowId);
      if (willOpen) { expandedRows.add(rowId); row.scrollLeft = 0; } else { expandedRows.delete(rowId); }
      syncMoreButtons();
      if (!willOpen && w && w.getBoundingClientRect().top < 0) {
        window.scrollTo({ top: w.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' });
      }
    };

    // Trang riêng của thể loại: mở sẵn / thu gọn một hàng playlist bằng code (noSync = chưa đo lại nút ngay)
    window.setRowExpanded = function (rowId, on, noSync) {
      if (on) expandedRows.add(rowId); else expandedRows.delete(rowId);
      if (!noSync) syncMoreButtons();
    };

    window.addEventListener('resize', () => { syncMoreButtons(); });

    // Chỉ hiện ở trang chủ; đo lại nút "Xem thêm" khi trang chủ hiện trở lại.
    const homeEl = document.getElementById('screen-input');
    if (homeEl) {
      new MutationObserver(() => {
        if (homeVisible() && window.homeOnShown) window.homeOnShown();
        if (homeVisible()) requestAnimationFrame(() => { syncMoreButtons(); });
      }).observe(homeEl, { attributes: true, attributeFilter: ['class'] });
    }

    // Được gọi ở cuối renderNetflixCategories() mỗi khi trang chủ vẽ lại.
    window.syncHomeMore = syncMoreButtons;
    window.homeNavRefresh = function () {};
    window.refreshHomeNav = function () {
      syncMoreButtons();
    };

    syncMoreButtons();
  })();
  