
/* Điện thoại / iPad: (1) bàn phím chỉ hiện khi chạm vào ô nhập; (2) bàn phím hiện lên không làm giao diện co lại */
(function () {
  'use strict';
  var touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  // (1) Mọi lệnh tự focus ô gõ chép chính tả (bấm vào từ gợi ý, nút Play, tốc độ, Xóa, đổi câu...) bị bỏ qua trên màn cảm ứng.
  //     Chạm trực tiếp vào ô gõ vẫn mở bàn phím như bình thường (trình duyệt tự focus, không đi qua lệnh này).
  var di = document.getElementById('dc-input');
  if (di && touch) di.focus = function () {};
  // (2) Trong Chép chính tả / Shadowing: bàn phím phủ lên trên thay vì làm co khung (interactive-widget=resizes-visual),
  //     đồng thời chừa thêm chỗ cuộn ở cuối trang bằng đúng chiều cao bàn phím (biến --kb).
  var meta = document.querySelector('meta[name="viewport"]');
  function setMode() {
    if (!meta || !touch) return;
    var v = document.body.getAttribute('data-pv-view');
    var mode = (v === 'dictation' || v === 'shadowing') ? 'resizes-visual' : 'resizes-content';
    var c = meta.getAttribute('content') || '';
    var n = /interactive-widget=[^,\s]+/.test(c) ? c.replace(/interactive-widget=[^,\s]+/, 'interactive-widget=' + mode) : c + ', interactive-widget=' + mode;
    if (n !== c) meta.setAttribute('content', n);
  }
  var vv = window.visualViewport;
  function kb() {
    var root = document.documentElement;
    if (!vv || !touch) return;
    var v = document.body.getAttribute('data-pv-view');
    var h = (v === 'dictation' || v === 'shadowing') ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
    root.style.setProperty('--kb', (vv.scale > 1.01 ? 0 : h) + 'px');
  }
  setMode(); kb();
  new MutationObserver(function () { setMode(); kb(); }).observe(document.body, { attributes: true, attributeFilter: ['data-pv-view'] });
  if (vv) { vv.addEventListener('resize', kb); vv.addEventListener('scroll', kb); }
})();
