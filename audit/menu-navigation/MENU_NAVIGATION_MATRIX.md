# MA TRẬN HÀNH VI ĐIỀU HƯỚNG CHI TIẾT (NAVIGATION BEHAVIOR MATRIX)
## Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/MENU_NAVIGATION_MATRIX.md`  
**Ngày thực hiện:** 2026-11-07  
**Chế độ:** READ-ONLY AUDIT (Xác minh trực tiếp qua mã nguồn và Chrome DevTools Runtime)  

---

## 1. QUY ƯỚC TRẠNG THÁI (STATUS LEGEND)

- **PASS:** Hành vi hoạt động đúng kỳ vọng, handler thực thi đầy đủ, state cập nhật chính xác, không gây lỗi runtime.
- **FAIL:** Lỗi code hoặc runtime exception (ví dụ gọi hàm không tồn tại, ReferenceError).
- **BLOCKED / UNREACHABLE:** Tính năng có handler đầy đủ nhưng phần tử cha bị ẩn `display:none !important`, người dùng không thể bấm.
- **DEFECT / CONFLICT:** Gây xung đột DOM ID, mở đồng thời không đóng, hoặc mất focus/state.
- **NEEDS REVIEW:** Hành vi hoạt động được nhưng thiết kế UX gây khó hiểu hoặc thiếu nhất quán.

---

## 2. MA TRẬN ĐIỀU HƯỚNG TOÀN DIỆN (NAVIGATION MATRIX)

| Menu ID | Mục (Item) | Tương tác (Trigger) | Bộ xử lý (Handler) | Đích đến (Destination) | Thay đổi trạng thái (State Change) | Kỳ vọng (Expected) | Thực tế (Actual) | Trạng thái (Status) |
|---|---|---|---|---|---|---|---|---|
| **MN-01.1** | Logo thương hiệu | Click `.fs-brand` | Không có onclick | Vị trí hiện tại | Không | Giữ nguyên hoặc về top | Giữ nguyên | PASS |
| **MN-01.2** | Từ vựng đã lưu | Click `.vocab-btn` | `openVocabScreen()` | Màn hình Sổ từ vựng | Ẩn `#screen-input`, hiện `#screen-vocab`, đổi hash `#/vocab` | Mở màn hình Sổ từ vựng | Mở mượt mà, cập nhật URL hash | **PASS** |
| **MN-01.3** | Đồng bộ Cloud | Click `#btn-cloud-sync` | `openCloudSyncModal()` | Modal `#fss-cloud-modal` | Hiện modal, nạp tab status/login | Mở modal đồng bộ Supabase | Mở đúng modal, hiển thị trạng thái | **PASS** |
| **MN-01.4** | Chế độ Sáng / Tối | Click `.fs-theme-toggle` | `toggleFsTheme()` | Toàn bộ ứng dụng | Đổi `data-theme="light\|dark"`, nhớ `localStorage` | Chuyển đổi màu sắc toàn diện | Chuyển đổi chuẩn xác | **PASS** |
| **MN-01.5** | Hamburger Button | Click `#btn-mobile-menu` | `toggleMobileMenu()` | Drawer `#mobile-nav-drawer` | Toggle class `.hidden`, đổi `aria-expanded` | Mở/đóng Drawer điều hướng mobile | Mở trượt mượt mà, có backdrop | **PASS** |
| **MN-02.1** | Luyện Video | Click `[data-mode="video"]` | `selectMobileMode("video")`| Khung nhập YouTube | Đóng drawer, hiện `#video-input-mode` | Chuyển khung nhập video | Chuyển đúng khung | **PASS** |
| **MN-02.2** | Đọc báo tiếng Pháp | Click `[data-mode="text"]` | `selectMobileMode("text")` | Khung nhập bài báo | Đóng drawer, hiện `#text-input-mode` | Chuyển khung đọc báo | Chuyển đúng khung | **PASS** |
| **MN-02.3** | Đọc sách | Click `[data-mode="book"]` | `selectMobileMode("book")` | Khung nạp sách | Đóng drawer, hiện `#book-input-mode` | Chuyển khung đọc sách | Chuyển đúng khung | **PASS** |
| **MN-02.4** | Luyện dịch câu | Click `[data-mode="vt"]` | `selectMobileMode("vt")` | Khung luyện dịch | Đóng drawer, hiện `#vt-input-mode` | Chuyển khung luyện dịch | Chuyển đúng khung | **PASS** |
| **MN-02.5** | Video của bạn | Click `[data-mode="custom-yt"]`| `selectMobileMode("custom-yt")`| Khung video riêng | Đóng drawer, hiện `#custom-yt-input-mode` | Chuyển khung video cá nhân | Chuyển đúng khung | **PASS** |
| **MN-02.6** | Drawer: Từ vựng | Click item Từ vựng | `openVocabScreen()` | Sổ từ vựng | Đóng drawer, mở `#screen-vocab` | Mở màn hình Sổ từ vựng | Hoạt động tốt | **PASS** |
| **MN-02.7** | Drawer: Đồng bộ | Click item Đồng bộ | `openCloudSyncModal()` | Modal Cloud | Đóng drawer, mở modal Cloud | Mở modal Cloud | Hoạt động tốt | **PASS** |
| **MN-02.8** | Drawer: Theme | Click item Theme | `toggleFsTheme()` | Toàn app | Chuyển Dark/Light mode | Đổi theme tức thì | Hoạt động tốt | **PASS** |
| **MN-03.1** | Quay lại (Header) | Click nút Back | `backToInputScreen()` | Trang chủ | Ẩn practice, hiện `#screen-input`, đổi hash `#//` | Trở về trang chủ an toàn | Trở về trang chủ, dừng video | **PASS** |
| **MN-03.2** | Từ vựng bài này | Click `.vocab-btn.primary`| `openVocabScreen('lesson')` | Sổ từ vựng (bộ lọc bài) | Mở `#screen-vocab`, gán `vocabSource=id` | Mở từ vựng lọc riêng bài đang học | Lọc đúng từ vựng của bài | **PASS** |
| **MN-03.3** | Đồng bộ Cloud (Header)| Click `.practice-sync-btn` | `openCloudSyncModal()` | Modal Supabase | Hiện modal `#fss-cloud-modal` | Mở modal đồng bộ | Mở đúng modal | **PASS** |
| **MN-03.4** | Theme (Header) | Click `.practice-theme-btn`| `toggleFsTheme()` | Toàn app | Đổi `data-theme` | Đổi theme ngay | Hoạt động chuẩn xác | **PASS** |
| **MN-03.5** | Đổi giao diện | Click `#pv-switch-btn` | `pvToggleMenu(event)` | Menu `#pv-menu` | Toggle `.pv-x`, định vị nổi canh phải | Mở dropdown 3 giao diện | Mở dropdown nổi, có icon check | **PASS** |
| **MN-03.6** | Sandwich Menu Trigger | Click `#practice-sandwich-btn`| `togglePracticeMobileMenu(event)` | Menu `#practice-sandwich-menu` | Toggle `.pv-x`, update badges | Mở menu tiện ích 15 mục | Mở menu nổi, cập nhật huy hiệu | **PASS** |
| **MN-04.1** | Giao diện Mặc định | Click `[data-v="default"]` | `pvSetView("default")` | Phòng luyện mặc định | Đổi layout `pv-default`, URL hash | Chuyển về giao diện mặc định | Chuyển chuẩn xác | **PASS** |
| **MN-04.2** | Giao diện Shadowing | Click `[data-v="shadowing"]` | `pvSetView("shadowing")` | Giao diện Shadowing | Ẩn video, hiện sóng âm và bộ lọc | Chuyển sang chế độ chỉ nghe nhại | Chuyển chuẩn xác | **PASS** |
| **MN-04.3** | Giao diện Chép chính tả| Click `[data-v="dictation"]`| `pvSetView("dictation")` | Giao diện Dictation | Hiện ô gõ, bàn phím accents, chấm điểm | Chuyển sang chế độ gõ câu | Chuyển chuẩn xác | **PASS** |
| **MN-05.1** | Sandwich: Cloud | Click item Cloud | `openCloudSyncModal()` | Modal Cloud | Đóng sandwich, mở modal | Mở modal đồng bộ | Mở tốt | **PASS** |
| **MN-05.2** | Sandwich: Theme | Click item Theme | `toggleFsTheme()` | Toàn app | Đổi theme, đóng sandwich | Đổi theme Sáng/Tối | Đổi tốt | **PASS** |
| **MN-05.3** | Sandwich: Cỡ chữ | Click item Cỡ chữ | `toggleTextSizePanel(event)` | Popover `#fs-pop` | Đóng sandwich, mở popover Aa | Mở bảng chỉnh font/giãn dòng | Mở tốt | **PASS** |
| **MN-05.4** | Sandwich: IPA | Click `#psm-btn-ipa` | `togglePracticeIpa()` | Thẻ câu hiện tại | Toggle IPA, cập nhật badge BẬT/TẮT | Hiện/ẩn phiên âm IPA dưới từ | Hoạt động tốt | **PASS** |
| **MN-05.5** | Sandwich: Karaoke | Click `#psm-btn-karaoke` | `toggleKaraokeMode()` | Thẻ câu & video | Toggle highlight karaoke, đổi badge | Chạy chữ theo giọng đọc | Hoạt động tốt | **PASS** |
| **MN-05.6** | Sandwich: Song ngữ | Click `#psm-btn-bilingual` | `toggleBilingual()` | Phụ đề & timeline | Toggle bản dịch tiếng Việt | Hiện/ẩn bản dịch Việt | Hoạt động tốt | **PASS** |
| **MN-05.7** | Sandwich: Sửa bản dịch | Click item Sửa bản dịch | `openBilingualModal(true)` | Modal song ngữ | Đóng sandwich, mở modal sửa | Mở modal dán đè bản dịch | Hoạt động tốt | **PASS** |
| **MN-05.8** | Sandwich: Tự dừng | Click `#psm-btn-autostop` | `toggleSentenceAutoStop()` | Video/Audio player | Bật/tắt cờ `sentenceAutoStop` | Dừng phát ở cuối mỗi câu | Hoạt động tốt | **PASS** |
| **MN-05.9** | Sandwich: AutoScroll | Click `#psm-btn-autoscroll` | `toggleAutoScroll()` | Danh sách phụ đề | Bật/tắt cờ `autoScroll` | Cuộn tự động theo tiến trình | Hoạt động tốt | **PASS** |
| **MN-05.10** | Sandwich: Thêm dấu câu | Click item Dấu câu | `openPunctModal()` | Modal Thêm dấu câu | Đóng sandwich, mở `#punct-modal` | Mở modal tạo prompt dấu câu | Hoạt động tốt | **PASS** |
| **MN-05.11** | Sandwich: Từ khó AI | Click item Từ khó | `openKeyVocabModal()` | Modal Từ khó AI | Đóng sandwich, mở `#keyvocab-modal` | Mở modal trích xuất từ khó | Hoạt động tốt | **PASS** |
| **MN-05.12** | Sandwich: Thi thử TCF | Click item TCF | `window.TcfExam.openModal()` | Modal Thi thử TCF | Đóng sandwich, mở `#tcf-modal` | Mở giao diện bài thi TCF Canada | Hoạt động tốt | **PASS** |
| **MN-05.13** | AI tra: ChatGPT | Click `[data-ai="chatgpt"]`| `setAiLookupProvider("chatgpt")`| Cấu hình nội bộ | Lưu `localStorage`, đổi active class | Chọn ChatGPT làm mặc định | Lưu tốt | **PASS** |
| **MN-05.14** | AI tra: Gemini AI | Click `[data-ai="gemini"]` | `setAiLookupProvider("gemini")` | Cấu hình nội bộ | Lưu `localStorage`, đổi active class | Chọn Gemini làm mặc định | Lưu tốt | **PASS** |
| **MN-05.15** | AI tra: Google Search | Click `[data-ai="google"]` | `setAiLookupProvider("google")` | Cấu hình nội bộ | Lưu `localStorage`, đổi active class | Chọn Google AI Search | Lưu tốt | **PASS** |
| **MN-06 (All)**| Steppers Cỡ chữ Aa | Click các nút A-, A+, L-, L+| `changeSubtitleFontSize(...)` v.v. | Cỡ chữ phụ đề | Cập nhật CSS variables, lưu `localStorage` | Tăng/giảm cỡ chữ và giãn dòng | Cập nhật mượt mà | **PASS** |
| **MN-07.1** | Công tắc CC video | Click `#cc-vi` | Toggle phụ đề video | Khung video YouTube | Bật/tắt thẻ `#vid-vi` trên video | Ẩn/hiện chữ tiếng Việt trên video | Hoạt động tốt | **PASS** |
| **MN-07.2-3** | Cỡ chữ CC video A-/A+| Click `#cc-dec`, `#cc-inc`| Chỉnh font size CC | Khung video YouTube | Cập nhật cỡ chữ `#vid-subs` | Chữ trên video to/nhỏ | Hoạt động tốt | **PASS** |
| **MN-08 (All)**| Chọn tốc độ phát | Click các nút `0.5x`–`1.25x`| `setPlaybackRate(...)` | Video YouTube | Đổi tốc độ phát của YouTube player | Đổi tốc độ nghe tức thì | Hoạt động tốt | **PASS** |
| **MN-08.6** | Ô gõ tốc độ tự do | Input & Enter `#rate-input`| `commitRateInput()` | Video YouTube | Parse số thập phân, gán tốc độ | Hỗ trợ mọi tốc độ 0.25x–2.0x | Hoạt động tốt | **PASS** |
| **MN-09.1** | Câu trước (Video) | Click `#cs-prev` | `jumpToSentence(idx - 1)` | Video timeline | Tua video về đầu câu trước | Phát câu trước | **PASS** |
| **MN-09.2** | Tự dừng câu (Video) | Click `#cs-auto` | `toggleSentenceAutoStop()` | Player state | Toggle công tắc tự dừng | Dừng khi hết câu | **PASS** |
| **MN-09.3** | Câu sau (Video) | Click `#cs-next` | `jumpToSentence(idx + 1)` | Video timeline | Tua video sang câu sau | Phát câu sau | **PASS** |
| **MN-10.1** | Tab Danh sách câu | Click `#tab-sub-sentences` | `switchRightPanelTab('sentences')`| Cột phụ đề | Hiện danh sách câu, ẩn từ khó | Hiện câu đầy đủ | **PASS** |
| **MN-10.2** | Tab Từ khó | Click `#tab-sub-keyvocab` | `switchRightPanelTab('keyvocab')` | Cột phụ đề | Hiện danh sách từ khó trong bài | Hiện bảng từ khó | **PASS** |
| **MN-11.1** | Giây/Phút bài báo | Click `#art-pb-cur-time` | `toggleArtTimeMode()` | Timeline bài báo | Chuyển đổi định dạng `00.0s` ↔ `0:00` | Đổi cách hiển thị thời gian | Hoạt động tốt | **PASS** |
| **MN-11.2** | Nút tròn Dịch 문A | Click `#art-translate-btn`| `toggleBilingual()` | Phụ đề bài báo | Bật/tắt hiện nghĩa tiếng Việt | Đổi trạng thái song ngữ bài báo | Hoạt động tốt | **PASS** |
| **MN-11.3** | Thu âm bài báo | Click `#art-rec-btn` | `toggleArticleRec()` | MediaRecorder | Khởi chạy microphone ghi âm giọng đọc | Thu âm và phát lại so sánh | Hoạt động tốt | **PASS** |
| **MN-11.4-9** | Tốc độ audio bài báo | Click/Input tốc độ | `setArtAudioSpeed(...)` | Audio Element | Đổi `playbackRate` của `#art-audio-el`| Tăng/giảm tốc độ MP3 bài báo | Hoạt động tốt | **PASS** |
| **MN-12.1-4** | Điều hướng câu bài báo | Click Prev/Play/Auto/Next | `prevArticleSentence()`, v.v.| Audio Element | Tua audio đến mốc câu, play/pause | Phát đúng câu được chọn | **PASS** |
| **MN-13.1-6** | Sidebar bài báo actions | Click các nút sidebar | `toggleBilingual()`, v.v. | Modal hoặc panel | Gọi các tính năng tương ứng | Hoạt động tốt | **PASS** |
| **MN-14.1-2** | Lọc câu Shadowing | Click Tất cả / Chưa luyện | `filterShadowingSentences(...)`| Danh sách Shadowing | Lọc câu theo trạng thái hoàn thành | Lọc chính xác | **PASS** |
| **MN-15.1-4** | Điều hướng Dictation | Click Prev, Next, Count | Jump câu chép chính tả | Khung chép chính tả | Nạp câu mới, reset ô gõ | Chuyển câu mượt mà | **PASS** |
| **MN-16 (All)**| Phím Accents tiếng Pháp| Click phím ký tự | Insert ký tự tại con trỏ textarea | Textarea gõ câu | Thêm ký tự có dấu (`é`, `è`...) | Chèn đúng vị trí con trỏ | **PASS** |
| **MN-17.1-4** | Nút thao tác gõ câu | Click Gợi ý / Xóa / Nghe / Kiểm tra | `checkDictation()`, v.v. | Bảng kết quả | Chấm điểm từng từ, tính độ chính xác | Chấm điểm phân màu chuẩn | **PASS** |
| **MN-18.1** | Quay lại từ Vocab | Click `.vocab-back-btn` | `closeVocabScreen()` | Màn hình trước đó | Ẩn `#screen-vocab`, khôi phục màn hình cũ | Quay lại đúng nơi xuất phát | **PASS** |
| **MN-18.2** | Căn mốc tự động | Click `#vocab-auto-align-btn`| `autoAlignVocabTimestamps()`| Kho từ vựng | Chạy thuật toán đối chiếu phụ đề | Căn mốc thành công | **PASS** |
| **MN-18.3** | Luyện tập SRS | Click `#vocab-practice-btn` | `window.openVocabPracticeHub()` | Modal Vocab Hub | Mở modal luyện tập 6 chế độ | Mở Hub toàn màn hình | **PASS** |
| **MN-18.5** | Xuất CSV từ vựng | Click `.vocab-btn:has(download)`| `exportVocabCsv()` | Tải file máy tính | Tạo blob CSV và kích hoạt tải về | Tải file `.csv` sạch | **PASS** |
| **MN-18.6** | Import xem trước | Click `.vocab-btn:has(upload)` | `openVocabImportModal()` | Modal Import Schema 0.2| Mở modal nạp file từ vựng | Mở đúng modal import | **PASS** |
| **MN-19 (All)**| Bộ lọc sổ từ vựng | Input search & Select filters| `renderVocabPage()` | Danh sách từ vựng | Lọc danh sách theo từ khóa/cấp độ/nguồn | Lọc mượt mà tức thì | **PASS** |
| **MN-20 (All)**| Sandwich Hub 6 chế độ | Click chọn chế độ luyện | `switchMode(modeKey)` | Nội dung Hub SRS | Nạp giao diện Quiz/Điền từ/Match/Flashcard/Dịch/Ghép câu | Chuyển chế độ linh hoạt | **PASS** |
| **MN-21 (All)**| Bộ lọc Hub SRS | Toggle đến hạn & Goal select | Cập nhật danh sách từ luyện | Khung bài tập Hub | Lọc từ theo SRS Due, chỉ tiêu từ mới | Áp dụng chính xác | **PASS** |
| **MN-22 (All)**| Header Đọc sách | Click các nút header sách | `bkToggleDrawer()`, v.v. | Panel hoặc modal | Mở mục lục, tìm kiếm, song ngữ | Hoạt động tốt | **PASS** |
| **MN-23 (All)**| Drawer sách TOC/Search | Click Tab Mục lục / Tìm kiếm | `bkToggleDrawer(...)` | Drawer bên trái | Hiện danh sách chương hoặc kết quả tìm | Tìm kiếm & cuộn chương tốt | **PASS** |
| **MN-24 (All)**| Cài đặt đọc sách | Click chọn Font/Nền/Size | `bkSetPref(...)` | Khung đọc sách | Cập nhật CSS variables của E-Book | Thay đổi kiểu chữ tức thì | **PASS** |
| **MN-25 (All)**| Footer Đọc sách | Click Prev/Next/Slider | `bkPrevChapter()`, v.v. | Khung đọc sách | Chuyển chương hoặc cuộn tới % sách | Chuyển chương mượt mà | **PASS** |
| **MN-26.1** | Quay lại từ Luyện dịch | Click `.vt-hl button` | `vtClose()` | Thư viện dịch | Ẩn `#screen-vt`, hiện thư viện | Quay về thư viện tốt | **PASS** |
| **MN-26.2** | Hiện hết bản dịch | Click `#vt-readall` | `toggleReadAllTranslations()` | Danh sách câu dịch | Hiện toàn bộ bản dịch tiếng Pháp | Hiện bản dịch tốt | **PASS** |
| **MN-26.3** | Nhờ AI dịch | Click `.vt-ai-btn` | `vtOpenAI()` | Modal `#vt-ai-modal` | Hiện modal prompt dịch câu | Mở modal AI tốt | **PASS** |
| **MN-26.4** | **Theme trong Luyện dịch** | Click `.fs-theme-toggle` | `onclick="toggleTheme()"` | **CRASH / LỖI** | **Không đổi được theme** | **Chuyển theme Sáng/Tối** | **LỖI: `toggleTheme is not defined`** | **FAIL (P1)** |
| **MN-27 (All)**| Điều hướng câu dịch | Click Prev / Next / Count | `vtJumpSentence(...)` | Câu dịch hiện tại | Chuyển câu, cập nhật tiến độ | Hoạt động tốt | **PASS** |
| **MN-28 (All)**| Toolbar Video đã luyện | Search / Sort / 2-Col / 3-Col / List | `handleLibrarySearch()`, v.v.| Lưới video trang chủ | Thay đổi cách dàn trang và sắp xếp | Hoạt động tốt | **PASS** |
| **MN-29.1-2** | Phân trang video | Click Prev / Next | `changeVideoPage(+/-1)` | Danh sách video | Lật sang trang 20 video kế tiếp | Lật trang chuẩn | **PASS** |
| **MN-30.1-4** | Tooltip tra nghĩa khi bôi đen | Click Tra nghĩa / Phát âm / Loop / Lưu | Tra từ & Lưu SRS | Popup nổi tại vị trí con trỏ chuột | Kích hoạt tra từ hoặc lưu vào SRS | Hoạt động rất mượt mà | **PASS** |
| **MN-31.1-2** | Điều hướng trang Hướng dẫn | Click Quay lại | `closeGuideScreen()` | Trang chủ | Ẩn `#screen-guide`, mở `#screen-input` | Quay lại trang chủ tốt | **PASS** |
| **MN-32 (All)**| Gán trình độ CEFR | Click các nút A1–C2 / Bỏ gán | `setArticleLevel(lvl)` | Lịch sử bài đọc & Cloud | Lưu CEFR vào bài, sync Supabase | Gán huy hiệu chính xác | **PASS** |
| **MN-33 (All)**| Tab Căn mốc Audio AI | Click Tab 1 / Tab 2 | `switchArtPromptTab(...)` | Modal Căn mốc | Đổi nội dung Prompt theo chế độ | Hoạt động tốt | **PASS** |
| **MN-34.1** | Thu gọn Nhập bài báo | Click `#text-input-toggle-btn`| `toggleTextInputCollapse()` | Khung nhập bài báo | Mở/thu khung soạn thảo, xoay mũi tên | Mở/đóng mượt mà | **PASS** |
| **MN-34.2** | Thu gọn Video của bạn | Click `#own-yt-toggle` | Toggle `#own-yt-panel` | Khung video riêng | Mở/thu bảng nhập link video riêng | Mở/đóng mượt mà | **PASS** |
| **DEAD-01** | **Sao chép phụ đề bài học** | Click `#btn-copy-transcript` | `copyTranscript()` | Clipboard | Copy toàn bộ phụ đề song ngữ | Copy phụ đề vào bộ nhớ | **BLOCKED: Nằm trong `#sub-search-bar` bị `display:none`** | **BLOCKED (P1)** |
| **DEAD-02** | **Chia sẻ video này** | Click `#btn-share` | `shareCurrentVideo()` | Modal `#share-modal` | Mở modal tạo link chia sẻ & tải backup | Mở modal chia sẻ video | **BLOCKED: Nằm trong `#sub-search-bar` bị `display:none`** | **BLOCKED (P1)** |
| **CONFLICT-01**| **Mở đồng thời 2 dropdown** | Mở `#pv-switch-btn` rồi mở `#practice-sandwich-btn` | `pvToggleMenu` & `togglePracticeMobileMenu` | Header phòng luyện | Cả 2 menu cùng mở đồng thời | Menu này phải tự đóng menu kia | **Cả 2 menu cùng hiển thị đè nhau** | **DEFECT (P1)** |
| **CONFLICT-02**| **Trùng lặp ID `#sub-search-input`** | DOM Query | `document.getElementById('sub-search-input')` | Header & Khối ẩn | Không xác định phần tử nào nhận event | Mỗi ID phải là duy nhất trên trang | **Có 2 thẻ input mang cùng ID** | **DEFECT (P1)** |
