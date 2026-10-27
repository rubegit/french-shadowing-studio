
/* Điện thoại / iPad quay dọc: đo phần màn hình còn lại cho khung phụ đề để ô "Tìm kiếm" và thẻ tên video nằm ngay dưới mép màn hình
   (cuộn xuống mới thấy). Biến --sub-avail / --sub-search-h được đặt trên #split-container và dùng trong CSS của #panel-right. */
(function () {
  const sc = document.getElementById('split-container');
  const vid = document.getElementById('video-frame-wrapper');
  const bar = document.getElementById('sub-search-bar');
  const mq = window.matchMedia('(max-width: 1023px) and (min-height: 501px), (orientation: portrait) and (max-width: 1100px)');
  if (!sc || !vid) return;
  let raf = 0;
  function clear() { sc.style.removeProperty('--sub-avail'); sc.style.removeProperty('--sub-search-h'); }
  function measure() {
    raf = 0;
    if (!mq.matches || document.body.classList.contains('text-mode') || !sc.clientHeight) { clear(); return; }
    const a = document.activeElement;
    if (a && a.id === 'sub-search-input') return;   // đang gõ tìm kiếm (bàn phím ảo làm đổi chiều cao màn hình): giữ nguyên bố cục
    const ctl = document.getElementById('pv-ctl');
    let ctlH = 56;
    if (ctl && ctl.offsetHeight) {
      const ctlStyle = window.getComputedStyle(ctl);
      ctlH = ctl.offsetHeight + (parseFloat(ctlStyle.marginTop) || 0) + (parseFloat(ctlStyle.marginBottom) || 0);
    }
    const cs = document.getElementById('cs-card');
    let csH = 0;
    if (cs && !cs.classList.contains('empty') && cs.offsetHeight && window.getComputedStyle(cs).display !== 'none') {
      const csStyle = window.getComputedStyle(cs);
      csH = cs.offsetHeight + (parseFloat(csStyle.marginTop) || 0) + (parseFloat(csStyle.marginBottom) || 0);
    }
    const pb = parseFloat(window.getComputedStyle(sc).paddingBottom) || 0;
    const pt = parseFloat(window.getComputedStyle(sc).paddingTop) || 0;
    const usableH = sc.clientHeight - pb - pt;
    const avail = usableH - (vid.offsetHeight || 0) - ctlH - csH;
    sc.style.setProperty('--sub-avail', Math.max(120, Math.round(avail)) + 'px');
    if (bar && bar.offsetHeight) sc.style.setProperty('--sub-search-h', bar.offsetHeight + 'px');
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(measure); }
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  document.addEventListener('focusout', schedule);
  if (mq.addEventListener) mq.addEventListener('change', schedule);
  if (window.ResizeObserver) {
    const ro = new ResizeObserver(schedule);
    ro.observe(sc);
    ro.observe(vid);
    if (bar) ro.observe(bar);
    const cs = document.getElementById('cs-card');
    if (cs) ro.observe(cs);
    const ctl = document.getElementById('pv-ctl');
    if (ctl) ro.observe(ctl);
  }
  new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  schedule();

  // Phụ đề đè lên video: cỡ chữ (người dùng chọn ở nút CC) được nhân thêm hệ số --vsc theo bề rộng khung video,
  // để video nhỏ (điện thoại / khung trái hẹp) không bị chữ che kín. Video rộng >= 480px: giữ nguyên 100%.
  if (vid) {
    let vr = 0;
    const capScale = () => { vr = 0; const w = vid.clientWidth; if (!w) return; vid.style.setProperty('--vsc', Math.max(0.7, Math.min(1, w / 480)).toFixed(3)); };
    const sch = () => { if (!vr) vr = requestAnimationFrame(capScale); };
    window.addEventListener('resize', sch);
    if (window.ResizeObserver) new ResizeObserver(sch).observe(vid);
    sch();
  }

  // Header phòng luyện tập: chỉ bật chế độ vuốt ngang khi các nút thật sự không đủ chỗ trên 1 hàng
  const hdr = document.querySelector('#screen-practice header');
  if (hdr) {
    let hr = 0;
    const check = () => { hr = 0; hdr.classList.toggle('hdr-overflow', hdr.scrollWidth > hdr.clientWidth + 1); };
    const sched = () => { if (!hr) hr = requestAnimationFrame(check); };
    window.addEventListener('resize', sched);
    window.addEventListener('orientationchange', sched);
    if (window.ResizeObserver) { const ro2 = new ResizeObserver(sched); ro2.observe(hdr); Array.from(hdr.children).forEach((c) => ro2.observe(c)); }
    new MutationObserver(sched).observe(hdr, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
    sched();

    // Hỗ trợ lăn chuột cuộn ngang trên Desktop khi header tràn
    hdr.addEventListener('wheel', (e) => {
      if (hdr.scrollWidth <= hdr.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        hdr.scrollLeft += e.deltaY;
      }
    }, { passive: false });

    // Hỗ trợ kéo thả chuột (drag-to-scroll) trên desktop
    let isDown = false, startX = 0, startScrollLeft = 0, hasDragged = false;
    hdr.addEventListener('mousedown', (e) => {
      if (hdr.scrollWidth <= hdr.clientWidth) return;
      if (e.target.closest('input, textarea, select')) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      startScrollLeft = hdr.scrollLeft;
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.pageX - startX;
      if (Math.abs(dx) > 4) {
        hasDragged = true;
        hdr.classList.add('hdr-dragging');
        hdr.scrollLeft = startScrollLeft - dx;
      }
    });
    window.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      setTimeout(() => hdr.classList.remove('hdr-dragging'), 50);
    });
    // Tránh kích hoạt click vào nút nếu người dùng vừa kéo chuột để cuộn
    hdr.addEventListener('click', (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
        hasDragged = false;
      }
    }, true);
  }
})();
