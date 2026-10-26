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

