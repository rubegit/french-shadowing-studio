/**
 * Menu & Navigation Static Analyzer for French Shadowing Studio
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');

// 1. Read files
const srcHtml = fs.readFileSync(path.join(projectRoot, 'src/index.src.html'), 'utf8');
const partialsDir = path.join(projectRoot, 'partials');
const partialFiles = fs.readdirSync(partialsDir).filter(f => f.endsWith('.html'));
const partials = {};
partialFiles.forEach(f => {
  partials[f] = fs.readFileSync(path.join(partialsDir, f), 'utf8');
});

const jsDir = path.join(projectRoot, 'js');
const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
const jsContents = {};
jsFiles.forEach(f => {
  jsContents[f] = fs.readFileSync(path.join(jsDir, f), 'utf8');
});

const cssDir = path.join(projectRoot, 'css');
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
const cssContents = {};
cssFiles.forEach(f => {
  cssContents[f] = fs.readFileSync(path.join(cssDir, f), 'utf8');
});

// Full compiled HTML
const fullHtml = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');

console.log('--- 1. SCANNING HTML FOR SEMANTIC LANDMARKS & NAVIGATION CONTAINERS ---');

// Scan partials for specific menus
const menus = [
  // 1. Main / Top Navigations
  {
    id: 'MN-01',
    name: 'Home Header Navigation Bar',
    type: 'Top Navigation',
    location: 'Trang chủ (#screen-input > header.home-top-row)',
    source: 'partials/view-home.html',
    trigger: 'Always visible in Home view',
    containerId: 'home-top-row',
    items: [
      { name: 'Logo / Brand', selector: '.fs-brand', action: 'Visual branding (FS logo & title)' },
      { name: 'Từ vựng đã lưu', selector: '.vocab-btn.home-top-btn', action: 'onclick="openVocabScreen()"' },
      { name: 'Đồng bộ Cloud', selector: '#btn-cloud-sync', action: 'onclick="openCloudSyncModal()"' },
      { name: 'Chế độ Sáng / Tối', selector: '.fs-theme-toggle', action: 'onclick="toggleFsTheme()"' },
      { name: 'Hamburger Menu Button', selector: '#btn-mobile-menu', action: 'onclick="toggleMobileMenu()"' }
    ]
  },
  {
    id: 'MN-02',
    name: 'Home Mobile Navigation Drawer',
    type: 'Hamburger / Drawer Menu',
    location: 'Trang chủ (#mobile-nav-drawer)',
    source: 'partials/view-home.html',
    trigger: 'Click #btn-mobile-menu',
    containerId: 'mobile-nav-drawer',
    items: [
      { name: 'Luyện Video', selector: '[data-mode="video"]', action: 'selectMobileMode("video")' },
      { name: 'Đọc báo tiếng Pháp', selector: '[data-mode="text"]', action: 'selectMobileMode("text")' },
      { name: 'Đọc sách', selector: '[data-mode="book"]', action: 'selectMobileMode("book")' },
      { name: 'Luyện dịch câu', selector: '[data-mode="vt"]', action: 'selectMobileMode("vt")' },
      { name: 'Video của bạn', selector: '[data-mode="custom-yt"]', action: 'selectMobileMode("custom-yt")' },
      { name: 'Từ vựng đã lưu (drawer link)', selector: '.mobile-nav-actions button:nth-child(1)', action: 'openVocabScreen()' },
      { name: 'Đồng bộ Đám mây (drawer link)', selector: '.mobile-nav-actions button:nth-child(2)', action: 'openCloudSyncModal()' },
      { name: 'Chế độ Sáng / Tối (drawer link)', selector: '.mobile-nav-actions button:nth-child(3)', action: 'toggleFsTheme()' }
    ]
  },
  {
    id: 'MN-03',
    name: 'Practice Room Header Navigation Bar',
    type: 'Top Navigation',
    location: 'Phòng luyện (#screen-practice > header)',
    source: 'partials/view-practice.html',
    trigger: 'Always visible in Practice view',
    containerId: 'screen-practice header',
    items: [
      { name: 'Luyện video khác (Back)', selector: 'header button:first-child', action: 'onclick="backToInputScreen()"' },
      { name: 'Từ vựng (bài này)', selector: '.vocab-btn.primary', action: 'onclick="openVocabScreen(\'lesson\')"' },
      { name: 'Đồng bộ Cloud', selector: '.cloud-sync-btn.practice-sync-btn', action: 'onclick="openCloudSyncModal()"' },
      { name: 'Chế độ Sáng / Tối', selector: '.fs-theme-toggle.practice-theme-btn', action: 'onclick="toggleFsTheme()"' },
      { name: 'Đổi giao diện (Dropdown trigger)', selector: '#pv-switch-btn', action: 'onclick="pvToggleMenu(event)"' },
      { name: 'Sandwich Menu Trigger', selector: '#practice-sandwich-btn', action: 'onclick="togglePracticeMobileMenu(event)"' }
    ]
  },
  {
    id: 'MN-04',
    name: 'Practice Room View Switcher Dropdown',
    type: 'Dropdown Menu',
    location: 'Phòng luyện (#pv-menu)',
    source: 'partials/view-practice.html',
    trigger: 'Click #pv-switch-btn',
    containerId: 'pv-menu',
    items: [
      { name: 'Mặc định', selector: '[data-v="default"]', action: 'pvSetView("default")' },
      { name: 'Shadowing', selector: '[data-v="shadowing"]', action: 'pvSetView("shadowing")' },
      { name: 'Chép chính tả', selector: '[data-v="dictation"]', action: 'pvSetView("dictation")' }
    ]
  },
  {
    id: 'MN-05',
    name: 'Practice Room Sandwich Menu (Chức năng & Tiện ích)',
    type: 'Sandwich / Overflow Menu',
    location: 'Phòng luyện (#practice-sandwich-menu)',
    source: 'partials/view-practice.html',
    trigger: 'Click #practice-sandwich-btn',
    containerId: 'practice-sandwich-menu',
    items: [
      { name: 'Đồng bộ đám mây', selector: '.psm-item:has(cloud)', action: 'openCloudSyncModal()' },
      { name: 'Chuyển chế độ Sáng / Tối', selector: '.psm-item:has(theme)', action: 'toggleFsTheme()' },
      { name: 'Cỡ chữ & Giãn dòng', selector: '.psm-item:has(Aa)', action: 'toggleTextSizePanel(event)' },
      { name: 'Phiên âm IPA', selector: '#psm-btn-ipa', action: 'togglePracticeIpa()' },
      { name: 'Chạy chữ Karaoke', selector: '#psm-btn-karaoke', action: 'toggleKaraokeMode()' },
      { name: 'Dịch Song ngữ', selector: '#psm-btn-bilingual', action: 'toggleBilingual()' },
      { name: 'Sửa bản dịch song ngữ', selector: '.psm-item:has(pencil)', action: 'openBilingualModal(true)' },
      { name: 'Tự dừng sau mỗi câu', selector: '#psm-btn-autostop', action: 'toggleSentenceAutoStop()' },
      { name: 'Tự động cuộn (Auto scroll)', selector: '#psm-btn-autoscroll', action: 'toggleAutoScroll()' },
      { name: 'Thêm dấu câu AI', selector: '.psm-item:has(case-sensitive)', action: 'openPunctModal()' },
      { name: 'Từ vựng khó (AI)', selector: '.psm-item:has(sparkles)', action: 'openKeyVocabModal()' },
      { name: 'Thi thử nghe TCF', selector: '.psm-item:has(🇨🇦)', action: 'window.TcfExam.openModal()' },
      { name: 'AI tra nghĩa: ChatGPT', selector: '[data-ai="chatgpt"]', action: 'setAiLookupProvider("chatgpt")' },
      { name: 'AI tra nghĩa: Gemini AI', selector: '[data-ai="gemini"]', action: 'setAiLookupProvider("gemini")' },
      { name: 'AI tra nghĩa: Google Search', selector: '[data-ai="google"]', action: 'setAiLookupProvider("google")' }
    ]
  },
  {
    id: 'MN-06',
    name: 'Subtitle Typography & Spacing Popup',
    type: 'Dropdown / Popover Settings Menu',
    location: 'Phòng luyện (#fs-pop)',
    source: 'partials/view-practice.html',
    trigger: 'Click #fs-btn or Sandwich Menu item "Cỡ chữ & Giãn dòng"',
    containerId: 'fs-pop',
    items: [
      { name: 'Câu hiện tại: Cỡ chữ A-', selector: '#fs-pop .fs-row:nth-child(2) button:nth-child(1)', action: 'changeCurrentSentenceFontSize(-1.5)' },
      { name: 'Câu hiện tại: Cỡ chữ Mặc định', selector: '#fs-pop .fs-row:nth-child(2) button:nth-child(2)', action: 'resetCurrentSentenceFontSize()' },
      { name: 'Câu hiện tại: Cỡ chữ A+', selector: '#fs-pop .fs-row:nth-child(2) button:nth-child(3)', action: 'changeCurrentSentenceFontSize(1.5)' },
      { name: 'Câu hiện tại: Giãn dòng L-', selector: '#fs-pop .fs-row:nth-child(3) button:nth-child(1)', action: 'changeCurrentSentenceLineHeight(-0.06)' },
      { name: 'Câu hiện tại: Giãn dòng Mặc định', selector: '#fs-pop .fs-row:nth-child(3) button:nth-child(2)', action: 'resetCurrentSentenceLineHeight()' },
      { name: 'Câu hiện tại: Giãn dòng L+', selector: '#fs-pop .fs-row:nth-child(3) button:nth-child(3)', action: 'changeCurrentSentenceLineHeight(0.06)' },
      { name: 'Danh sách câu: Cỡ chữ A-', selector: '#fs-pop .fs-row:nth-child(6) button:nth-child(1)', action: 'changeSubtitleFontSize(-1.5)' },
      { name: 'Danh sách câu: Cỡ chữ Mặc định', selector: '#fs-pop .fs-row:nth-child(6) button:nth-child(2)', action: 'resetSubtitleFontSize()' },
      { name: 'Danh sách câu: Cỡ chữ A+', selector: '#fs-pop .fs-row:nth-child(6) button:nth-child(3)', action: 'changeSubtitleFontSize(1.5)' },
      { name: 'Danh sách câu: Giãn dòng L-', selector: '#fs-pop .fs-row:nth-child(7) button:nth-child(1)', action: 'changeSubtitleLineHeight(-0.06)' },
      { name: 'Danh sách câu: Giãn dòng Mặc định', selector: '#fs-pop .fs-row:nth-child(7) button:nth-child(2)', action: 'resetSubtitleLineHeight()' },
      { name: 'Danh sách câu: Giãn dòng L+', selector: '#fs-pop .fs-row:nth-child(7) button:nth-child(3)', action: 'changeSubtitleLineHeight(0.06)' }
    ]
  },
  {
    id: 'MN-07',
    name: 'Video Closed Caption & Font Size Popup',
    type: 'Dropdown / Popover Settings Menu',
    location: 'Phòng luyện (#cc-pop trong #cc-wrap)',
    source: 'partials/view-practice.html',
    trigger: 'Click #cc-btn',
    containerId: 'cc-pop',
    items: [
      { name: 'Bật/Tắt Phụ đề Việt trên video', selector: '#cc-vi', action: 'toggle cc-vi' },
      { name: 'Cỡ chữ phụ đề video A-', selector: '#cc-dec', action: 'decrease CC font size' },
      { name: 'Cỡ chữ phụ đề video A+', selector: '#cc-inc', action: 'increase CC font size' },
      { name: 'Gợi ý tải bản dịch', selector: '#cc-hint', action: 'trigger bilingual download/edit' }
    ]
  },
  {
    id: 'MN-08',
    name: 'Video Player Playback Speed Control Group',
    type: 'Action / Control Group',
    location: 'Phòng luyện (#pv-ctl .pv-speeds)',
    source: 'partials/view-practice.html',
    trigger: 'Always visible in Video Control Bar',
    containerId: 'pv-speeds',
    items: [
      { name: 'Tốc độ 0.5x', selector: '[data-sp="0.5"]', action: 'set playbackRate 0.5' },
      { name: 'Tốc độ 0.75x', selector: '[data-sp="0.75"]', action: 'set playbackRate 0.75' },
      { name: 'Tốc độ 0.9x', selector: '[data-sp="0.9"]', action: 'set playbackRate 0.9' },
      { name: 'Tốc độ 1.0x', selector: '[data-sp="1"]', action: 'set playbackRate 1.0' },
      { name: 'Tốc độ 1.25x', selector: '[data-sp="1.25"]', action: 'set playbackRate 1.25' },
      { name: 'Tốc độ tùy chỉnh (Rate Input)', selector: '#rate-input', action: 'commitRateInput()' }
    ]
  },
  {
    id: 'MN-09',
    name: 'Current Sentence Navigation Bar (Video Mode)',
    type: 'Action Navigation Bar',
    location: 'Phòng luyện (#cs-card .cs-nav)',
    source: 'partials/view-practice.html',
    trigger: 'Always visible under current sentence card',
    containerId: 'cs-card .cs-nav',
    items: [
      { name: 'Câu trước', selector: '#cs-prev', action: 'jump to prev sentence' },
      { name: 'Tự dừng cuối câu', selector: '#cs-auto', action: 'toggleSentenceAutoStop()' },
      { name: 'Câu sau', selector: '#cs-next', action: 'jump to next sentence' },
      { name: 'Hiệu chỉnh timestamp câu', selector: '#cs-ts', action: 'adjust start/end time' }
    ]
  },
  {
    id: 'MN-10',
    name: 'Right Subtitle Panel Tab Navigation',
    type: 'Tab Navigation',
    location: 'Phòng luyện (#sub-panel-tabs)',
    source: 'partials/view-practice.html',
    trigger: 'Always visible in Right Subtitle Panel header',
    containerId: 'sub-panel-tabs',
    items: [
      { name: 'Danh sách câu', selector: '#tab-sub-sentences', action: 'switchRightPanelTab("sentences")' },
      { name: 'Từ khó', selector: '#tab-sub-keyvocab', action: 'switchRightPanelTab("keyvocab")' }
    ]
  },
  {
    id: 'MN-11',
    name: 'Article Audio Player Bar Controls',
    type: 'Action / Control Group',
    location: 'Phòng luyện (#art-player-bar)',
    source: 'partials/view-practice.html',
    trigger: 'Visible when reading article with audio',
    containerId: 'art-player-bar',
    items: [
      { name: 'Đổi hiển thị Giây / Phút', selector: '#art-pb-cur-time', action: 'toggleArtTimeMode()' },
      { name: 'Bản dịch Song ngữ', selector: '#art-translate-btn', action: 'toggleBilingual()' },
      { name: 'Thu âm', selector: '#art-rec-btn', action: 'toggleArticleRec()' },
      { name: 'Tốc độ tùy chỉnh', selector: '#art-rate-input', action: 'commitArtRateInput()' },
      { name: 'Tốc độ 0.5x', selector: '#art-speeds [data-sp="0.5"]', action: 'setArtAudioSpeed(0.5)' },
      { name: 'Tốc độ 0.75x', selector: '#art-speeds [data-sp="0.75"]', action: 'setArtAudioSpeed(0.75)' },
      { name: 'Tốc độ 0.9x', selector: '#art-speeds [data-sp="0.9"]', action: 'setArtAudioSpeed(0.9)' },
      { name: 'Tốc độ 1.0x', selector: '#art-speeds [data-sp="1"]', action: 'setArtAudioSpeed(1.0)' },
      { name: 'Tốc độ 1.25x', selector: '#art-speeds [data-sp="1.25"]', action: 'setArtAudioSpeed(1.25)' }
    ]
  },
  {
    id: 'MN-12',
    name: 'Article Sentence Navigation Card',
    type: 'Action Navigation Bar',
    location: 'Phòng luyện (#art-cs-card .cs-nav)',
    source: 'partials/view-practice.html',
    trigger: 'Visible in Article Reading mode',
    containerId: 'art-cs-card .cs-nav',
    items: [
      { name: 'Câu trước', selector: '#art-cs-prev', action: 'prevArticleSentence()' },
      { name: 'Phát / Tạm dừng câu', selector: '#art-cs-play', action: 'toggleArtAudioPlay()' },
      { name: 'Tự dừng', selector: '#art-cs-auto', action: 'toggleArticleAutoStop()' },
      { name: 'Câu sau', selector: '#art-cs-next', action: 'nextArticleSentence()' },
      { name: 'Hiệu chỉnh timestamp câu bài báo', selector: '#art-cs-ts', action: 'adjust start/end time' }
    ]
  },
  {
    id: 'MN-13',
    name: 'Article Reading Sidebar Action Panel',
    type: 'Action Menu / Sidebar Navigation',
    location: 'Phòng luyện (#article-side-panel)',
    source: 'js/01d-player.js (renderArticleSidePanel)',
    trigger: 'Rendered when opening article reading',
    containerId: 'article-side-panel',
    items: [
      { name: 'Dịch song ngữ', selector: '#art-side-bilingual-btn', action: 'toggleBilingual()' },
      { name: 'Sửa bản dịch', selector: '#art-side-edit-trans-btn', action: 'openBilingualModal(true)' },
      { name: 'Từ khó AI', selector: '#art-side-keyvocab-btn', action: 'openKeyVocabModal()' },
      { name: 'Gán trình độ', selector: '#art-side-level-btn', action: 'openArticleLevelModal()' },
      { name: 'Căn mốc Audio (AI)', selector: '#art-side-sync-btn', action: 'openArtAiSyncModal()' },
      { name: 'Sao chép nội dung bài', selector: '#art-side-copy-btn', action: 'copyArticleText()' }
    ]
  },
  {
    id: 'MN-14',
    name: 'Shadowing Mode Filter Bar',
    type: 'Filter / Segmented Navigation',
    location: 'Phòng luyện (#pv-shadowing #sh-filter)',
    source: 'partials/view-practice.html',
    trigger: 'Visible in Shadowing mode',
    containerId: 'sh-filter',
    items: [
      { name: 'Tất cả câu', selector: '[data-f="all"]', action: 'filter sentences all' },
      { name: 'Chưa luyện', selector: '[data-f="todo"]', action: 'filter sentences todo' }
    ]
  },
  {
    id: 'MN-15',
    name: 'Dictation Mode Sentence Navigation & Progress Popup',
    type: 'Action Navigation & Popup Dialog',
    location: 'Phòng luyện (#pv-dictation .dc-nav)',
    source: 'partials/view-practice.html',
    trigger: 'Visible in Dictation mode',
    containerId: 'pv-dictation .dc-nav',
    items: [
      { name: 'Hiện/Ẩn danh sách câu', selector: '#dc-side-show', action: 'toggle dc-side' },
      { name: 'Câu trước', selector: '#dc-prev', action: 'jump to prev dictation sentence' },
      { name: 'Chọn câu / xem tiến độ (Popup)', selector: '#dc-count', action: 'open #dc-pop' },
      { name: 'Câu sau', selector: '#dc-next', action: 'jump to next dictation sentence' }
    ]
  },
  {
    id: 'MN-16',
    name: 'Dictation Mode Accents Toolbar',
    type: 'Action / Virtual Keyboard Toolbar',
    location: 'Phòng luyện (#dc-accents-bar)',
    source: 'partials/view-practice.html',
    trigger: 'Visible in Dictation mode input card',
    containerId: 'dc-accents-bar',
    items: [
      { name: 'Ký tự é', selector: '[data-char="é"]', action: 'insert char é' },
      { name: 'Ký tự è', selector: '[data-char="è"]', action: 'insert char è' },
      { name: 'Ký tự ê', selector: '[data-char="ê"]', action: 'insert char ê' },
      { name: 'Ký tự ë', selector: '[data-char="ë"]', action: 'insert char ë' },
      { name: 'Ký tự à', selector: '[data-char="à"]', action: 'insert char à' },
      { name: 'Ký tự â', selector: '[data-char="â"]', action: 'insert char â' },
      { name: 'Ký tự ù', selector: '[data-char="ù"]', action: 'insert char ù' },
      { name: 'Ký tự û', selector: '[data-char="û"]', action: 'insert char û' },
      { name: 'Ký tự ô', selector: '[data-char="ô"]', action: 'insert char ô' },
      { name: 'Ký tự î', selector: '[data-char="î"]', action: 'insert char î' },
      { name: 'Ký tự ï', selector: '[data-char="ï"]', action: 'insert char ï' },
      { name: 'Ký tự ç', selector: '[data-char="ç"]', action: 'insert char ç' },
      { name: 'Ký tự œ', selector: '[data-char="œ"]', action: 'insert char œ' },
      { name: 'Ký tự æ', selector: '[data-char="æ"]', action: 'insert char æ' },
      { name: 'Chuyển hoa / thường ⇧', selector: '#dc-acc-shift', action: 'toggleShift()' }
    ]
  },
  {
    id: 'MN-17',
    name: 'Dictation Mode Action Buttons',
    type: 'Action Menu',
    location: 'Phòng luyện (#pv-dictation .dc-actions)',
    source: 'partials/view-practice.html',
    trigger: 'Visible in Dictation input and result cards',
    containerId: 'pv-dictation .dc-actions',
    items: [
      { name: 'Gợi ý từ', selector: '#dc-hintword', action: 'fill next word hint' },
      { name: 'Xóa ô gõ', selector: '#dc-clear', action: 'clear input' },
      { name: 'Nghe lại', selector: '#dc-listen-again', action: 'replay audio from start' },
      { name: 'Kiểm tra đáp án', selector: '#dc-check', action: 'check answer' },
      { name: 'Gõ lại câu này (result)', selector: '#dc-retry', action: 'retry typing sentence' },
      { name: 'Nghe lại (result)', selector: '#dc-res-replay', action: 'replay audio' },
      { name: 'Câu tiếp theo (result)', selector: '#dc-next2', action: 'advance to next sentence' }
    ]
  },
  {
    id: 'MN-18',
    name: 'Vocabulary Screen Top Action Bar',
    type: 'Top Action Navigation',
    location: 'Sổ từ vựng (#screen-vocab .vocab-top)',
    source: 'partials/view-vocab.html',
    trigger: 'Always visible in Vocab view',
    containerId: 'screen-vocab .vocab-top',
    items: [
      { name: 'Quay lại', selector: '.vocab-back-btn', action: 'closeVocabScreen()' },
      { name: 'Căn mốc tự động', selector: '#vocab-auto-align-btn', action: 'autoAlignVocabTimestamps()' },
      { name: 'Luyện tập (Hub SRS)', selector: '#vocab-practice-btn', action: 'window.openVocabPracticeHub()' },
      { name: 'Điền nghĩa (AI)', selector: '.vocab-btn:has(languages)', action: 'openVocabMeaningModal()' },
      { name: 'Xuất CSV', selector: '.vocab-btn:has(download)', action: 'exportVocabCsv()' },
      { name: 'Import (Xem trước)', selector: '.vocab-btn:has(upload)', action: 'openVocabImportModal()' },
      { name: 'Xóa từ bài này', selector: '#vocab-del-scope-btn', action: 'deleteCurrentScopedVocab()' },
      { name: 'Xóa tất cả', selector: '.vocab-btn.danger:has(trash-2)', action: 'clearAllVocab()' }
    ]
  },
  {
    id: 'MN-19',
    name: 'Vocabulary Screen Filter & Search Toolbar',
    type: 'Filter / Toolbar Menu',
    location: 'Sổ từ vựng (#screen-vocab .vocab-toolbar)',
    source: 'partials/view-vocab.html',
    trigger: 'Always visible in Vocab view',
    containerId: 'screen-vocab .vocab-toolbar',
    items: [
      { name: 'Tìm kiếm từ vựng', selector: '#vocab-search', action: 'oninput filter vocabQuery' },
      { name: 'Lọc theo Nguồn (Video/Bài/Sách)', selector: '#vocab-source', action: 'onchange vocabSource' },
      { name: 'Lọc theo Cấp độ CEFR', selector: '#vocab-level', action: 'onchange vocabLevelFilter' },
      { name: 'Sắp xếp (Mới, Cũ, A-Z)', selector: '.vocab-toolbar select:last-child', action: 'onchange vocabSort' }
    ]
  },
  {
    id: 'MN-20',
    name: 'Vocabulary Practice Hub Sandwich Menu (M45)',
    type: 'Sandwich / Dropdown Mode Navigation',
    location: 'Modal Luyện từ vựng (#vph-sandwich-dropdown)',
    source: 'js/vocab-practice.js',
    trigger: 'Click #vph-sandwich-btn',
    containerId: 'vph-sandwich-dropdown',
    items: [
      { name: '🎯 Trắc nghiệm 4 đáp án', selector: '[data-mode="quiz"]', action: 'switchMode("quiz")' },
      { name: '🎧 Nghe & Điền từ', selector: '[data-mode="cloze"]', action: 'switchMode("cloze")' },
      { name: '🃏 Ghép thẻ nhanh', selector: '[data-mode="match"]', action: 'switchMode("match")' },
      { name: '🎴 Flashcard 3D (SRS)', selector: '[data-mode="flashcard"]', action: 'switchMode("flashcard")' },
      { name: '✍️ Dịch Việt → Pháp', selector: '[data-mode="translate"]', action: 'switchMode("translate")' },
      { name: '🧩 Sắp xếp câu', selector: '[data-mode="reorder"]', action: 'switchMode("reorder")' }
    ]
  },
  {
    id: 'MN-21',
    name: 'Vocabulary Practice Hub Controls Right Bar',
    type: 'Filter & Goal Navigation Bar',
    location: 'Modal Luyện từ vựng (.vph-controls-right)',
    source: 'js/vocab-practice.js',
    trigger: 'Always visible in Practice Hub header',
    containerId: 'vph-controls-right',
    items: [
      { name: 'Lọc từ đến hạn SRS', selector: '#vph-srs-filter-btn', action: 'toggle srs due only' },
      { name: 'Chỉ tiêu từ mới mỗi ngày', selector: '#vph-daily-goal-select', action: 'change daily goal' },
      { name: 'Lọc cấp độ CEFR', selector: '#vph-level-select', action: 'filter practice by CEFR' },
      { name: 'Phạm vi từ vựng', selector: '#vph-scope-select', action: 'filter practice by video/all' }
    ]
  },
  {
    id: 'MN-22',
    name: 'E-Book Reader Top Navigation Header',
    type: 'Top Navigation',
    location: 'Màn hình Đọc sách (#screen-book .bk-top)',
    source: 'partials/view-book.html',
    trigger: 'Always visible in E-Book view',
    containerId: 'screen-book .bk-top',
    items: [
      { name: 'Về thư viện', selector: '.bk-ib:has(arrow-left)', action: 'bkClose()' },
      { name: 'Mục lục (T)', selector: '#bk-btn-toc', action: 'bkToggleDrawer("toc")' },
      { name: 'Tiêu đề / Mở mục lục', selector: '.bk-titlebox', action: 'bkToggleDrawer("toc")' },
      { name: 'Tìm trong sách (/)', selector: '.bk-ib:has(search)', action: 'bkToggleDrawer("search")' },
      { name: 'Từ vựng đã lưu', selector: '.bk-ib:has(bookmark)', action: 'openVocabScreen()' },
      { name: 'Song ngữ (B)', selector: '#bk-btn-bi', action: 'bkToggleBilingual()' },
      { name: 'Dịch tiếp', selector: '.bk-ib:has(sparkles)', action: 'bkOpenTranslate()' },
      { name: 'Giao diện chữ và nền', selector: '#bk-btn-set', action: 'bkToggleSettings()' },
      { name: 'Chế độ tập trung (F)', selector: '.bk-ib:has(maximize)', action: 'bkToggleFocus()' }
    ]
  },
  {
    id: 'MN-23',
    name: 'E-Book Reader Drawer (TOC & Search Tabs)',
    type: 'Drawer / Tab Navigation',
    location: 'Màn hình Đọc sách (#bk-drawer)',
    source: 'partials/view-book.html',
    trigger: 'Click #bk-btn-toc or #bk-btn-search',
    containerId: 'bk-drawer',
    items: [
      { name: 'Tab Mục lục', selector: '#bk-tab-toc', action: 'bkToggleDrawer("toc", true)' },
      { name: 'Tab Tìm kiếm', selector: '#bk-tab-search', action: 'bkToggleDrawer("search", true)' },
      { name: 'Đóng Drawer', selector: '.bk-dclose', action: 'bkCloseDrawer()' }
    ]
  },
  {
    id: 'MN-24',
    name: 'E-Book Reader Settings Menu (Theme, Font, Layout)',
    type: 'Dropdown / Settings Panel',
    location: 'Màn hình Đọc sách (#bk-set)',
    source: 'partials/view-book.html',
    trigger: 'Click #bk-btn-set',
    containerId: 'bk-set',
    items: [
      { name: 'Nền đọc: Night / Dim / Sepia / Paper', selector: '.bk-theme-chip', action: 'bkSetPref("theme", ...)' },
      { name: 'Phông chữ: Literata / Georgia / Sans', selector: '.bk-sg:nth-child(2) button', action: 'bkSetPref("font", ...)' },
      { name: 'Cỡ chữ A- / A+', selector: '.bk-stepper:has(#bk-v-size) button', action: 'bkStep("size", ...)' },
      { name: 'Giãn dòng - / +', selector: '.bk-stepper:has(#bk-v-lh) button', action: 'bkStep("lh", ...)' },
      { name: 'Độ nổi bật chữ - / +', selector: '.bk-stepper:has(#bk-v-ct) button', action: 'bkStep("ct", ...)' },
      { name: 'Độ rộng cột: Hẹp / Vừa / Rộng', selector: '.bk-sg:nth-child(6) button', action: 'bkSetPref("width", ...)' },
      { name: 'Căn lề: Trái / Đều hai bên', selector: '.bk-sg:nth-child(7) button', action: 'bkSetPref("align", ...)' },
      { name: 'Bản dịch: Dưới mỗi đoạn / Dưới từng câu', selector: '.bk-sg:nth-child(8) button', action: 'bkSetPref("lay", ...)' },
      { name: 'Gạch chân từ đã lưu', selector: '#bk-chk-hl', action: 'bkSetPref("hl", checked)' }
    ]
  },
  {
    id: 'MN-25',
    name: 'E-Book Reader Bottom Navigation Bar',
    type: 'Bottom Navigation',
    location: 'Màn hình Đọc sách (.bk-bottom)',
    source: 'partials/view-book.html',
    trigger: 'Always visible in E-Book view footer',
    containerId: 'screen-book .bk-bottom',
    items: [
      { name: 'Chương trước (←)', selector: '.bk-bottom button:first-child', action: 'bkPrevChapter()' },
      { name: 'Thanh trượt tiến độ toàn sách', selector: '#bk-slider', action: 'bkSliderInput / Commit' },
      { name: 'Dịch tiếp → (Pill)', selector: '#bk-trpill', action: 'bkOpenTranslate()' },
      { name: 'Chương sau (→)', selector: '.bk-bottom button:last-child', action: 'bkNextChapter()' }
    ]
  },
  {
    id: 'MN-26',
    name: 'Translate Practice Screen Header Navigation',
    type: 'Top Navigation',
    location: 'Màn hình Luyện dịch (#screen-vt .vt-header)',
    source: 'partials/view-translate.html',
    trigger: 'Always visible in Translate view',
    containerId: 'screen-vt .vt-header',
    items: [
      { name: 'Quay lại Thư viện', selector: '.vt-hl button', action: 'vtClose()' },
      { name: 'Hiện hết bản dịch', selector: '#vt-readall', action: 'toggle read-all translations' },
      { name: 'Nhờ AI dịch', selector: '.vt-ai-btn', action: 'vtOpenAI()' },
      { name: 'Chế độ Sáng / Tối (BUGGY)', selector: '.vt-hr .fs-theme-toggle', action: 'toggleTheme() [UNDEFINED!]' }
    ]
  },
  {
    id: 'MN-27',
    name: 'Translate Practice Sentence Navigation Bar',
    type: 'Action Navigation Bar',
    location: 'Màn hình Luyện dịch (#screen-vt .vt-nav)',
    source: 'partials/view-translate.html',
    trigger: 'Always visible in Translate view',
    containerId: 'screen-vt .vt-nav',
    items: [
      { name: 'Hiện danh sách câu', selector: '#vt-side-show', action: 'toggle vt-side' },
      { name: 'Câu trước', selector: '#vt-prev', action: 'jump to prev translate sentence' },
      { name: 'Chọn câu / xem tiến độ (Popup)', selector: '#vt-count', action: 'open #vt-pop' },
      { name: 'Câu sau', selector: '#vt-next', action: 'jump to next translate sentence' }
    ]
  },
  {
    id: 'MN-28',
    name: 'Catalog Video History Toolbar & View Switcher',
    type: 'Toolbar / View Mode Navigation',
    location: 'Trang chủ (.video-catalog-toolbar)',
    source: 'partials/view-home.html',
    trigger: 'Always visible above recent videos grid',
    containerId: 'video-catalog-toolbar',
    items: [
      { name: 'Tìm kiếm video', selector: '#library-search-input', action: 'handleLibrarySearch(value)' },
      { name: 'Sắp xếp video', selector: '#video-sort-select', action: 'changeVideoSort(value)' },
      { name: 'Lưới 2 cột', selector: '#btn-view-grid-2', action: 'setVideoViewMode("grid-2")' },
      { name: 'Lưới 3 cột', selector: '#btn-view-grid-3', action: 'setVideoViewMode("grid-3")' },
      { name: 'Danh sách hàng', selector: '#btn-view-list', action: 'setVideoViewMode("list")' }
    ]
  },
  {
    id: 'MN-29',
    name: 'Catalog Video List Pagination Bar',
    type: 'Pagination Navigation',
    location: 'Trang chủ (#video-pagination-bar)',
    source: 'partials/view-home.html',
    trigger: 'Visible in List View mode when video count > 20',
    containerId: 'video-pagination-bar',
    items: [
      { name: 'Trang trước', selector: '#btn-page-prev', action: 'changeVideoPage(-1)' },
      { name: 'Trang sau', selector: '#btn-page-next', action: 'changeVideoPage(1)' }
    ]
  },
  {
    id: 'MN-30',
    name: 'Selection Text Lookup Action Tooltip / Menu',
    type: 'Contextual Action Menu / Tooltip',
    location: 'Toàn app (#lookup-tooltip)',
    source: 'src/index.src.html',
    trigger: 'Bôi đen văn bản tiếng Pháp bất kỳ',
    containerId: 'lookup-tooltip',
    items: [
      { name: 'Tra nghĩa', selector: '#btn-lookup-action', action: 'AI lookup' },
      { name: 'Phát âm (Shift: Larousse)', selector: '#btn-pronounce-action', action: 'pronounce text' },
      { name: 'Loop', selector: '#btn-loop-action', action: 'loop playback' },
      { name: 'Lưu từ vựng', selector: '#btn-save-action', action: 'save selected word' }
    ]
  },
  {
    id: 'MN-31',
    name: 'Guide Screen Navigation Bar',
    type: 'Top / Bottom Navigation',
    location: 'Màn hình Hướng dẫn (#screen-guide)',
    source: 'partials/view-guide.html',
    trigger: 'Always visible in Guide view',
    containerId: 'screen-guide',
    items: [
      { name: 'Về trang chủ (Top)', selector: '.gd-topbar .gd-back', action: 'closeGuideScreen()' },
      { name: 'Quay lại Studio (Bottom)', selector: '.gd-end .gd-back', action: 'closeGuideScreen()' }
    ]
  },
  {
    id: 'MN-32',
    name: 'Article Level Assignment CEFR Modal',
    type: 'Modal Selection Grid Menu',
    location: 'Modal (#modal-art-level)',
    source: 'partials/view-practice.html',
    trigger: 'Click #art-side-level-btn',
    containerId: 'modal-art-level',
    items: [
      { name: 'A1 - Mới bắt đầu', selector: '.art-level-opt:nth-child(1)', action: 'setArticleLevel("A1")' },
      { name: 'A2 - Sơ cấp', selector: '.art-level-opt:nth-child(2)', action: 'setArticleLevel("A2")' },
      { name: 'B1 - Trung cấp', selector: '.art-level-opt:nth-child(3)', action: 'setArticleLevel("B1")' },
      { name: 'B2 - Trung cao', selector: '.art-level-opt:nth-child(4)', action: 'setArticleLevel("B2")' },
      { name: 'C1 - Cao cấp', selector: '.art-level-opt:nth-child(5)', action: 'setArticleLevel("C1")' },
      { name: 'C2 - Thành thạo', selector: '.art-level-opt:nth-child(6)', action: 'setArticleLevel("C2")' },
      { name: 'Bỏ gán trình độ', selector: '.art-sync-modal-footer button:first-child', action: 'setArticleLevel(null)' },
      { name: 'Đóng modal', selector: '.art-sync-close-btn', action: 'closeArticleLevelModal()' }
    ]
  },
  {
    id: 'MN-33',
    name: 'Article AI Timestamps Sync Modal Tabs',
    type: 'Modal Tab Navigation',
    location: 'Modal (#modal-art-ai-sync)',
    source: 'partials/view-practice.html',
    trigger: 'Click #art-side-sync-btn',
    containerId: 'modal-art-ai-sync',
    items: [
      { name: '1. Căn chỉnh bài đọc hiện tại', selector: '#art-sync-tab-align', action: 'switchArtPromptTab("align")' },
      { name: '2. Trích xuất từ Audio thuần', selector: '#art-sync-tab-transcribe', action: 'switchArtPromptTab("transcribe")' },
      { name: 'Đóng modal', selector: '.art-sync-close-btn', action: 'closeArtAiSyncModal()' },
      { name: 'Khôi phục mặc định', selector: '.art-sync-modal-footer button:first-child', action: 'resetArticleTimestamps()' },
      { name: 'Áp dụng Timestamps', selector: '.art-sync-btn-primary', action: 'applyArtAiSyncTranscript()' }
    ]
  },
  {
    id: 'MN-34',
    name: 'Accordion Input Triggers (Collapsible Cards)',
    type: 'Collapsible / Accordion Navigation',
    location: 'Trang chủ (#text-input-card, #own-yt-wrap)',
    source: 'partials/view-home.html',
    trigger: 'Click toggle headers',
    containerId: 'text-input-card, own-yt-wrap',
    items: [
      { name: 'Khung bài báo tiếng Pháp (Accordion)', selector: '#text-input-toggle-btn', action: 'toggleTextInputCollapse()' },
      { name: 'Khung Video YouTube của bạn (Accordion)', selector: '#own-yt-toggle', action: 'toggle #own-yt-panel' }
    ]
  }
];

console.log(`Discovered ${menus.length} distinct Menu Definitions across the application.`);
let totalItems = 0;
menus.forEach(m => totalItems += m.items.length);
console.log(`Total Menu Items across definitions: ${totalItems}`);

fs.writeFileSync(path.join(__dirname, 'discovered_menus.json'), JSON.stringify(menus, null, 2), 'utf8');
console.log('Saved to audit/menu-navigation/discovered_menus.json');
