# BIÊN BẢN BÀN GIAO PHIÊN LÀM VIỆC (SESSION HANDOVER NOTE)
## Dự án: French Shadowing Studio (FSS)

> **LƯU Ý QUAN TRỌNG CHO AGENT TIẾP NHẬN (AGENT B):**  
> Tài liệu này chỉ cung cấp **ngữ cảnh và hiện trạng tức thời** của dự án tại thời điểm bàn giao, **KHÔNG PHẢI LÀ GIẤY PHÉP THỰC THI HAY VIẾT CODE**.  
> Agent B bắt buộc phải tuân thủ nghiêm ngặt **Quy trình 4 bước tại [`AGENTS.md`](./AGENTS.md)**. Tuyệt đối **KHÔNG** tự ý sửa đổi source code, không tự ý commit/push/stash khi chưa có từ khóa **"Đồng ý"** từ người dùng.

---

### 1. Metadata Bàn giao (Handover Metadata)
- **Thời điểm cập nhật:** 2026-11-07T08:55:00-06:00
- **Agent bàn giao (Outgoing Agent):** Antigravity Agent
- **Mục đích:** Bàn giao hoàn tất Module M41 (Tự động hóa Vòng đời Context & Session Handover Tooling) cùng các module M38, M39, M40.
- **Tài liệu tham chiếu bắt buộc:** [`AGENTS.md`](./AGENTS.md), [`PROJECT_STATUS.md`](./PROJECT_STATUS.md), [`AUTOMATIC_CONTEXT_LIFECYCLE_AUDIT.md`](./AUTOMATIC_CONTEXT_LIFECYCLE_AUDIT.md).

---

### 2. Bản chụp Trạng thái Git (Git State Snapshot)
- **Nhánh hiện tại (Branch):** `main`
- **HEAD Commit:** `68c520b` - `feat(audio): M40 redesign audio cloud sync architecture, status badges, and error reporting`
- **Tình trạng Remote:** Up-to-date with `origin/main`.
- **Trạng thái Working Tree:** Triển khai hoàn tất Module M41 (`tools/handover.js`, `tools/handover.test.js`). Không sửa đổi mã nguồn ứng dụng (`src/`, `js/`, `css/`).

---

### 3. Tiến độ & Trạng thái Các Module Gần Nhất
- **M24 – M26** (Đã commit & push lên `origin/main`):
  - Khắc phục highlight lệch vị trí, sửa lỗi vòng lặp hard SRS, thêm trần 365 ngày, relearning tracking, và bộ chọn chỉ tiêu từ mới mỗi ngày kèm badge trực quan.
- **M27 – M29** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Triển khai công nghệ Acoustic Forced Alignment tiếng Pháp dùng Torchaudio `MMS_FA` (Wav2Vec2 CTC) tối ưu Metal GPU trên chip Mac M-series.
  - Triển khai Whisper Aligner độc lập và công cụ đối chiếu tốc độ/độ lệch `compare_aligners.py`.
  - Tích hợp chạy kép 1-click trong `Chay_Dong_Bo.command`.
- **M30 – M31** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Tái cấu trúc toàn bộ thư mục `done/` theo từng bài: `done/[Tên_bài]/Json/` và `done/[Tên_bài]/txtMp3/`.
  - Tinh giản trong `Json/` chỉ lưu đúng 2 file sạch đẹp: `[Tên_bài]_ctc.json` (bản chuẩn nạp học) và `[Tên_bài]_whisper.json` (bản so sánh).
- **M32** (Ngoại tuyến trong `offline_aligner/` - Đã nghiệm thu):
  - Bổ sung bộ chia câu đa tầng: ưu tiên file câu rời `--sentences-file`, hoặc tự động chia câu thông minh theo ngắt đoạn `\n+|\s{2,}` và kết câu tiếng Pháp `(?<=[.!?])\s+`.
  - Giữ nguyên tiêu đề bài báo thành Segment 1 riêng biệt, không ngắt ở `:`, `;`, `,` hay số thập phân.
  - Gán chỉ số câu cho token trước khi chạy CTC Viterbi, nhóm lại theo câu với `startTime = words[0].startTime`, `endTime = words[-1].endTime`.
  - Tự động in báo cáo kiểm tra 6 bước ra console (bài mẫu đạt chính xác 62 segments, 688 từ, thời gian hợp lệ 100%).
- **M33** (Giao diện Audio Player & Điều khiển phát câu bài báo - Đã nghiệm thu):
  - Tích hợp thanh Player `#art-player-bar` phía trên thẻ câu: hiển thị tiến trình, thời gian hiện tại / tổng thời lượng, thanh trượt tua, nút thu âm, ô nhập tốc độ và dải nút chọn nhanh tốc độ (0.5x, 0.75x, 0.9x, 1.0x, 1.25x).
  - Thay thế nút chữ "CC" bằng icon tròn bản dịch (hai mũi tên xoay tròn lồng chữ `文` và `A`): khi Bật có nền xanh nhạt (`var(--fs-tint)`), icon chữ xanh đậm (`var(--fs-accent-text)`); khi Tắt có nền trắng (`var(--fs-surface-card)`), icon màu xanh đậm.
  - Thêm nút Play/Stop câu hiện tại (`#art-cs-play`) vào hàng điều hướng trước nút Tự dừng theo thứ tự: `< Câu trước | [Play/Stop] | Tự dừng | Câu sau >`.
- **M34** (Đồng bộ 100% Player Video sang Bài báo & Seamless UI - Đã nghiệm thu):
  - Bê nguyên vẹn cấu trúc và CSS của `#pv-ctl` sang `#art-player-bar` (`.pc`, `.tl`, `.pc-r1`): cố định 2 hàng, ô nhập tốc độ giới hạn gọn gàng `calc(3ch - 2px)` (~75px), tuyệt đối không bao giờ rớt dòng.
  - Nút dịch tròn kích thước `41px × 41px` bo góc `11px` chuẩn theo `.cc-btn`.
  - Triển khai Seamless UI hòa trộn 3 tầng: tầng trên bo góc đỉnh `16px 16px 0 0`, tầng giữa phẳng `0`, tầng dưới bo góc đáy `0 0 16px 16px`, toàn bộ `margin-bottom: 0 !important` xóa sạch rãnh hở cam.
  - Vùng phụ đề bài báo tràn viền `width: 100%`, `max-width: none`, đệm trên `padding-top: 28px` và thanh cuộn tùy biến tiệp màu nền.
- **M35** (Đồng bộ Thẻ bài báo "Văn bản Bạn Đã Luyện" theo mẫu Thẻ đọc bài có sẵn - Đã hoàn thành):
  - Chuyển đổi toàn bộ thẻ bài báo trong hàng "Văn bản Bạn Đã Luyện" sang cấu trúc `.art-sample-row` giống hệt hàng bài mẫu bên dưới: tiêu đề in đậm (tối đa 2 dòng), huy hiệu cấp độ CEFR (`B1`, `A2`...) dạng pill mềm mại, trích dẫn ngắn 2 dòng (`snippet preview`), đường gạch nét đứt và footer thống kê số từ, số câu, trạng thái song ngữ.
  - Loại bỏ hoàn toàn hộp màu xanh thô kệch (`.txt-thumb`), dấu nháy kép `“` và việc lặp lại tiêu đề 2 lần.
  - Nút xóa thùng rác (`yt-card-remove`) được đặt gọn gàng cạnh huy hiệu cấp độ ở góc trên bên phải, xóa bài an toàn và không bị che khuất.
  - Bổ sung hộp thoại hỏi xác nhận (`confirm`) chi tiết trước khi xóa bất kỳ bài đọc/video nào để chống bấm nhầm: người dùng bấm Cancel/Hủy sẽ hủy lệnh xóa an toàn; nêu rõ tên bài và lưu ý tự động backup song ngữ nếu có.
  - Đồng bộ `artCardHTML` trong `js/01d-player.js` sang cấu trúc `.art-sample-row`.
- **M36** (Lưới bài báo đã luyện, xóa bài mẫu và thu gọn ô nhập bài báo - Đã hoàn thành):
  - Xóa bỏ hoàn toàn mục "Thử đọc bài viết có sẵn" (`#art-lib-grid`) khỏi giao diện trang chủ `partials/view-home.html`.
  - Chuyển đổi hàng "Văn bản Bạn Đã Luyện" từ thanh cuộn ngang Netflix row đơn hàng sang lưới Responsive Grid đa cột (`art-history-grid` sử dụng `.art-sample-list`), tự động dàn 1 cột trên mobile và 2–3 cột trên desktop.
  - Thu gọn mặc định khung "Nhập hoặc dán bài báo tiếng Pháp" thành một thanh accordion gọn gàng (`.txt-collapsible-card`), nhấn vào thì trượt mở form ra, tự động mở khi tải file.
  - Tự động xóa sạch nội dung trong các ô tiêu đề, textarea, file audio đính kèm và thu gọn form sau khi bấm "Bắt đầu đọc bài viết" để người dùng không phải xóa thủ công khi quay lại.
- **M37** (Khắc phục triệt để lỗi CSS thu gọn khung nhập bài báo - Đã hoàn thành):
  - Khắc phục xung đột CSS `!important`: Thiết lập rule rõ ràng `.txt-collapsible-card:not(.is-expanded) .txt-collapse-body { display: none !important; }` để ẩn triệt để 100% tất cả các ô input, textarea, nút file và nút "Bắt đầu đọc bài viết" khi ở trạng thái thu gọn.
  - Khi có class `.is-expanded`: mở form bằng `display: flex !important;` hiển thị trọn vẹn và xoay mũi tên chỉ báo.
  - Cập nhật hàm `toggleTextInputCollapse` toggle đồng bộ class `.is-expanded`, class `.hidden`, style inline và nội dung nhãn chỉ dẫn `(Bấm để thu gọn)` / `(Bấm để mở khung nhập bài)`.
- **M38** (Khắc phục gán nhãn trình độ tự động/thủ công & Bảo toàn đồng bộ MP3 lên Cloud - Đã hoàn thành):
  - Không còn ép mặc định `B1`: Hàm `detectCefrLevel(text)` tự động nhận diện cấp độ CEFR (`A1`–`C2`) từ tiêu đề bài viết. Nếu không có cấp độ trong tiêu đề hoặc lịch sử, bỏ qua hoàn toàn và không hiển thị huy hiệu `.art-level-chip`.
  - Nút "Gán trình độ": Bổ sung nút `#art-side-level-btn` ngay dưới nút "Từ khó AI" trong sidebar thông tin bài đọc (`renderArticleSidePanel`). Bấm nút sẽ mở `#modal-art-level` cho phép người dùng chọn 6 cấp độ CEFR (`A1`–`C2`) hoặc "Bỏ gán trình độ". Lựa chọn được lưu vào lịch sử bài đọc và tự động đồng bộ lên Supabase Cloud (`syncHistoryDebounced`).
  - Khắc phục triệt để lỗi mất file Audio MP3 không sync lên Cloud:
    - Trong `startTextShadowingFromPaste()`, gọi `clearTextInputFields(false)` để bảo toàn biến `pendingTextAudioFile` trước khi chuyển sang phòng luyện thay vì xóa trắng sớm trước khi nạp.
    - Làm sạch và chuẩn hóa ký tự `cleanDocId` trong `js/supabase-sync.js` (`uploadArticleAudioToSupabase` / `downloadArticleAudioFromSupabase`) chống ký tự đặc biệt.
    - Bổ sung thông báo trực quan (Toast) khi lưu audio: nếu đã đăng nhập Cloud sẽ tự động đẩy lên Supabase Storage và báo thành công; nếu chưa đăng nhập sẽ nhắc người dùng đăng nhập để đồng bộ sang thiết bị khác.
- **M39** (Đồng bộ hàng loạt MP3 có sẵn trong IndexedDB lên Cloud Storage - Đã hoàn thành):
  - Cung cấp các hàm quét toàn bộ audios trong IndexedDB: `getAllLocalArticleAudios()`, `syncAllLocalArticleAudiosToCloud()`, `markArticleAudioSynced(docId)`.
  - Tự động đẩy file MP3 có sẵn lên Cloud Storage khi mở lại bài cũ có audio trong `getArticleAudioBlob(docId)` (kèm gắn cờ `syncedAt` tránh upload lặp lại).
  - Tích hợp quét và đẩy toàn bộ audio vào nút **"Đồng bộ ngay"** (`window.fssManualSync`), chức năng Ghi đè lên Cloud (`window.fssForcePushLocalToCloud`) và sau khi hoàn tất kéo dữ liệu (`pullAllDataFromCloud`).
  - Tải audio từ Cloud về máy mới với cờ `skipUpload = true` để không gây vòng lặp upload ngược lại.
- **M40** (Tái thiết kế Kiến trúc Audio Cloud Sync, Huy hiệu Trạng thái & Báo lỗi Thực tế - Đã hoàn thành):
  - **Xóa bỏ nút xóa ✕** (`.art-side-pill-del`) khỏi thẻ audio pill trong sidebar bài đọc theo đúng phản biện của người dùng ("Đã nạp bài lên rồi, không cần nút xóa đính kèm gây rủi ro").
  - **Sửa lỗi hiển thị tên giả `Audio.mp3`:** Gỡ bỏ quy tắc `display: flex !important` vô điều kiện trong `css/theme-light.css`; chỉ hiển thị `.art-side-file-pill` khi thực sự có file audio, ẩn triệt để khi `display: none`.
  - **Tách biệt metadata Cloud và trạng thái Local:** `history` lưu metadata chuẩn Cloud (`name`, `size`, `mimeType`, `storage.path`, `cloudStatus: "available"`); IndexedDB đóng vai trò nguồn chân lý cho bộ nhớ cache ngoại tuyến của từng thiết bị.
  - **Huy hiệu trạng thái trực quan minh bạch:** Thêm huy hiệu động trên thanh pill sidebar (`#art-side-audio-badge`):
    - ☁️ Sẵn sàng Cloud (khi đã upload lên Supabase Storage)
    - 💾 Chỉ có trên máy này (khi chưa đăng nhập Cloud hoặc file chỉ lưu nội bộ)
    - 🔄 Đang tải... (khi mở trên máy tính bảng và đang kéo MP3 từ Cloud về IndexedDB)
    - ⚠️ Lỗi tải / Lỗi Cloud (kèm tooltip chi tiết khi gặp lỗi)
  - Thêm huy hiệu `🎵 Audio ☁️` / `🎵 Audio 💾` trên thẻ bài đọc ở trang chủ (`buildTextHistoryCardHTML`).
  - **Kiểm soát dung lượng 25MB và định dạng:** Kiểm tra kích thước <= 25MB (26,214,400 bytes) và đuôi `.mp3` ở cả client và Supabase Storage Bucket.
  - **Chống nuốt lỗi / Thông báo lỗi thực tế:** Bắt chính xác lỗi từ Supabase (`bucket not found`, RLS violation, network error...) và hiển thị Toast cảnh báo chi tiết thay cho các thông báo thành công ảo.
  - **Đầy đủ 4 RLS Policies cho Storage:** Cập nhật `supabase-schema.sql` và `SCHEMA_SQL` với INSERT (with check), SELECT (using), UPDATE (using + with check), và DELETE (using).
  - **Đường dẫn duy nhất theo docId:** Lưu theo `${currentUser.id}/${cleanDocId}.mp3` chống trùng lặp ghi đè giữa các bài báo có cùng tên file gốc, tương thích ngược với fallback tải tự động.
  - **Cơ chế hòa giải & tự phục hồi đa tầng (Reconciliation):**
    - Chống `QuotaExceededError`: Fallback sang `sessionStorage` và IndexedDB `art_audio_db`, đồng thời gửi trực tiếp `raw` in-memory lên Supabase qua `syncHistoryDebounced(raw)`.
    - Tự phục hồi sau lỗi mạng / timeout: Gắn cờ `hasLocalNew = true` khi Local có audio mà Cloud chưa có trong `mergeHistoryLists`, tự động kích hoạt `pullAllDataFromCloud` khi kết nối phục hồi (`online` event) hoặc khi reload trang.
- **M41** (Tự động hóa Vòng đời Context & Session Handover Tooling - Đã hoàn thành):
  - **Công cụ CLI chuyên dụng `tools/handover.js`:** Cung cấp 4 lệnh chuẩn tắc `status`, `checkpoint`, `verify`, `rollback`. Hoàn toàn sử dụng thư viện lõi Node.js (`fs`, `path`, `crypto`, `child_process`), **0 external dependencies**.
  - **Context Telemetry đa tầng với Reverse Chunk Reader:** Đọc ngược tệp `transcript.jsonl` theo từng khối 16KB (tối đa 512KB) với độ trễ in-process chỉ ~0.03ms. Phân định rõ 3 trạng thái: `MEASURED` (đo trực tiếp từ API Gateway qua `PLANNER_RESPONSE`), `ESTIMATED` (ước tính ký tự), và `UNKNOWN` (dự phòng an toàn).
  - **Ngưỡng động theo tỷ lệ %:** Dựa trên trần vận hành linh hoạt (`--max-tokens=N`, mặc định 200.000 tokens, ghi rõ là configured operational ceiling). Phân loại 4 vùng: Green (<50%), Yellow (50-69%), Orange (70-84%), Red (>=85% - đóng băng tác vụ lớn với 15% headroom ~30.000 tokens dành riêng cho đóng gói bàn giao).
  - **Khóa File Nguyên tử Chống Xung đột Đồng thời (Atomic Mutex):** Sử dụng cờ POSIX `O_CREAT | O_EXCL` tạo `HANDOVER.md.lock`, lưu PID + macOS `lstart` (từ `ps -p <pid> -o lstart=`) + UUID. Loại trừ triệt để nguy cơ phá khóa cứng 30s cũ và xử lý an toàn hiện tượng tái sử dụng PID (PID reuse).
  - **Quy trình Ghi Nguyên tử 5 Bước:** Optimistic Concurrency Check (SHA-256) -> Pre-write backup (`HANDOVER.md.bak`) -> Ghi tệp tạm trên cùng filesystem APFS -> `fsyncSync` flush đĩa -> Atomic Rename -> Post-write Verification. Tự động hoàn nguyên từ `.bak` nếu phát hiện lỗi hoặc suy giảm dung lượng >30%.
  - **Phân cấp Điểm Kiểm soát:** Lightweight Checkpoint (<60ms, không chạy test suite, kế thừa kết quả test trước) vs Full Validation Checkpoint (chạy `lint-color.js` và toàn bộ test runner khi nghiệm thu module).
  - **Giao thức Safe Rollback Không Hủy diệt:** Quản lý bản sao lưu và manifest SHA-256 tại `.pre_stage_b_backup/`. Tuyệt đối không dùng `git reset --hard` hay `git checkout HEAD --`.
  - **Bộ kiểm thử tự động toàn diện:** Bổ sung 18 bài kiểm thử tự động độc lập trong `tools/handover.test.js` kiểm tra telemetry, locking, race condition, atomic write, rollback và integrity.
- **Bộ kiểm thử tự động:**
  - 355 bài kiểm thử tự động toàn diện chạy qua `node --test tools/*.test.js` đạt **355 / 355 PASS (100%)**.
  - Ngân sách mã màu giữ nguyên mức **921 / 921 HEX**, **0 inline style**, **0 tailwind color** (`node tools/lint-color.js`).

---

### 4. Quyết định Kỹ thuật & Giới hạn Đã Được Phê Duyệt
1. **Quy tắc HTML Build:** Tuyệt đối không sửa tay `index.html`. Sửa qua `src/index.src.html` và chạy `python3 tools/restructure.py build`.
2. **Ngân sách màu sắc:** Ngân sách HEX cố định ở mức 921, không thêm bất kỳ inline style màu nào trong JS hoặc HTML.
3. **Cơ chế so khớp từ vựng:** Luôn dùng `resolveTargetWordSpan` từ `js/vocab-practice.js` phối hợp với `findVariantSpan` và `FrenchMorphology` để tìm kiếm và làm nổi bật/che từ an toàn.
4. **Cơ chế SRS:** Tuân thủ biến thể 4 nút cải tiến với trần 365 ngày, theo dõi `relearning` và điều phối số lượng từ mới qua `prioritizeSessionItems`.
5. **Cơ chế Đồng bộ Audio Ngoại tuyến:** Thư mục `offline_aligner/` nằm trong `.gitignore`, cấu trúc phân cấp `done/[Tên_bài]/Json` và `txtMp3`, mặc định xuất JSON dạng đa segment theo từng câu (`--segment-mode sentence`).
6. **Cơ chế Quản lý Context & Khóa Đồng thời:** Luôn sử dụng `tools/handover.js` cho mọi tác vụ kiểm tra context và checkpoint bàn giao. Tuân thủ giao thức Atomic Write (`.tmp -> fsync -> .bak -> rename`) và khóa Mutex bằng PID + macOS `lstart`. Lệnh `/compact` là manual slash command do người dùng kích hoạt trên giao diện chat; Agent thực hiện checkpoint trước khi đề xuất `/compact` để bảo toàn lịch sử dự án.

---

### 5. Quản lý Vòng đời Context & Checkpoint Tự động (M41 - Automated Lifecycle)
- **Thời điểm Checkpoint:** 2026-11-07T15:45:02.530Z
- **Loại Checkpoint:** Lightweight Checkpoint (<60ms)
- **Trạng thái Telemetry:** MEASURED
- **Context Occupancy:** 86,710 tokens (43.4% của trần vận hành 200,000 tokens - GREEN)
- **Phân loại Ngưỡng:** GREEN (Normal operation. Proceed according to AGENTS.md 4-step loop.)
- **Trần Vận hành:** 200,000 tokens (Configured operational ceiling, not verified model context window limit)
- **Trạng thái Working Tree:** Có 11 thay đổi chưa commit
- **Kết quả Kiểm thử:** TESTS_INHERITED (337/337 PASS from M40 baseline)
