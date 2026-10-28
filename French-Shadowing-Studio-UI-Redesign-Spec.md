# French Shadowing Studio: Đặc tả thiết kế lại giao diện (sáng, mint, có dark mode)

Tài liệu này để giao cho AI code. Mockup xem tại: https://claude.ai/artifact/WFwmbhGknN9dpFLFPKBP5g (chỉ chủ sở hữu mở được, cần chia sẻ nếu gửi người khác). Mỗi màn có bản sáng (cột trái) và bản tối (cột phải).

> Lưu ý quan trọng: tên class trong tài liệu này (`.card`, `.btn`, `.seg`...) là tên dùng trong mockup. App thật có selector riêng. AI code phải **map** sang selector thật đang có, không đổi tên selector của app.

---

## 1. Mục tiêu và phạm vi

- Làm giao diện **sáng, hiện đại**, màu nhấn **xanh mint pastel**, có **dark mode** tương ứng.
- **Chỉ đổi lớp trình bày** (CSS, class và markup tĩnh). Không đổi logic.
- Phạm vi: toàn bộ màn hình và hộp thoại liệt kê ở mục 7.

## 2. Quy tắc bất di bất dịch (không ảnh hưởng thành phần khác)

1. Không đổi hoặc xoá `id`, thuộc tính `data-*`, và mọi tên class mà JS đang dùng (`querySelector`, `classList`, `getElementById`...). Trước khi sửa, tìm trong JS các selector này và lập danh sách "không được đổi".
2. Không đổi thứ tự DOM của các phần tử mà script phụ thuộc.
3. Không đổi: event handler, logic tách câu/tách từ, đồng bộ thời gian karaoke, tra từ Larousse, thu âm, đồng bộ Cloud, localStorage/IndexedDB, extension, userscript, nội dung prompt gửi AI.
4. Toàn bộ style mới nằm trong **một file `theme-light.css` nạp cuối cùng**, bọc dưới `html[data-ui="light"]` để bật/tắt. Xoá thuộc tính này là về giao diện cũ ngay.
5. Dark mode: ghi đè token trong `html[data-ui="light"][data-theme="dark"]`. Mặc định theo `prefers-color-scheme`. Lựa chọn của người dùng lưu bằng **một key mới**, không đụng key localStorage hiện có.
6. **Không đổi 4 nền đọc sách hiện có** (màu của người dùng chọn trong trình đọc). Ô màu trong mockup chỉ là chỗ giữ chỗ.
7. Mỗi module xong phải chạy checklist hồi quy (mục 10) trước khi sang module kế.

## 3. Design tokens

Khai báo bằng CSS variables trên `html[data-ui="light"]`; dark ghi đè cùng tên.

| Token | Sáng | Tối | Dùng cho |
|---|---|---|---|
| `--fs-bg` | `#F4FBF7` | `#0E1714` | Nền trang |
| `--fs-surface` | `#FFFFFF` | `#16221E` | Thẻ, header, modal |
| `--fs-line` | `#E3E8F1` | `#26362F` | Viền mảnh |
| `--fs-border` | `#CBD3E1` | `#3A4D44` | Viền input, nút phụ |
| `--fs-ink` | `#14213D` | `#E8F3EE` | Chữ chính |
| `--fs-muted` | `#4A566B` | `#A3B5AC` | Chữ phụ |
| `--fs-primary` | `#A8E6CF` | `#A8E6CF` | Nền nút chính, mục đang đọc |
| `--fs-on-primary` | `#0F3D2B` | `#0F3D2B` | Chữ trên nền primary |
| `--fs-tint` | `#E1F5EC` | `#1D3A30` | Nền nhạt: tab đang chọn, thumbnail |
| `--fs-accent-text` | `#0B5A3C` | `#A8E6CF` | Chữ nhấn, link, chip bật |
| `--fs-shadow` | `rgba(20,33,61,.06)` | `rgba(0,0,0,.35)` | Đổ bóng thẻ |
| `--fs-hover` | `rgba(20,33,61,.07)` | `rgba(255,255,255,.08)` | Lớp phủ khi hover |

Màu trạng thái (luôn đi kèm chữ, không chỉ dựa vào màu):

| Trạng thái | Nền sáng / chữ sáng | Nền tối / chữ tối |
|---|---|---|
| Hoàn hảo, Đúng, Xong | `#D6F5E6` / `#0B5A3C` | `#1D3A30` / `#A8E6CF` |
| Gần đúng, Cảnh báo | `#FFF1CC` / `#7A5400` | `#3A3115` / `#F3D77A` |
| Cần luyện, Sai, Lỗi | `#FFE0DC` / `#9B2C1F` | `#432522` / `#FFB4A8` |
| Chưa làm, Trung tính | `#EEF1F6` / `#4A566B` | `#222E2A` / `#A3B5AC` |

Nhãn "TCF CANADA": nền `#C0392B`, chữ trắng (cả hai chế độ).

**Chữ:** Plus Jakarta Sans 400/500/600/700/800 (có tiếng Việt). Trình đọc sách dùng Literata, Georgia hoặc Sans theo lựa chọn hiện có. H1 32–42px/800, H2 18–22px/800, thân 14–15px, chú thích 12–13px.
**Bo góc:** thẻ 20px, panel 16px, nút/input 12px, lựa chọn 14px, chip và nhãn pill 999px.
**Khoảng cách:** bước 4/8; gap thường dùng 8, 12, 16, 24, 32. Trang tối đa 1200px, padding 40px (20px trên điện thoại).
**Điểm gãy:** 900px (lưới nhiều cột chuyển 1 cột). Mọi nút, ô chọn cao tối thiểu 44px.

## 4. Thành phần dùng chung (tên trong mockup)

| Class | Mô tả | Trạng thái |
|---|---|---|
| `.card` | Nền surface, viền `--fs-line`, bo 20, đổ bóng nhẹ, padding 24 | - |
| `.btn` | Nút chính: nền primary, chữ on-primary, bo 12, đậm 700 | hover: phủ `--fs-hover`; nhấn: scale .97; focus: viền 3px accent cách 2px; disabled: opacity .5 |
| `.btn.g` | Nút phụ: nền surface, viền `--fs-border`, chữ accent | như trên |
| `.chip` / `.chip.on` | Bộ lọc, bật tắt dạng pill; bật = nền tint, chữ accent | hover: phủ hover |
| `.seg` | Nhóm nút chọn 1 (tốc độ, chế độ, căn lề...); mục chọn nền primary | - |
| `.li` / `.li.on` | Dòng danh sách; đang chọn: viền primary, nền tint | hover: phủ hover |
| `.st` + `.s1..s4` | Nhãn trạng thái pill (xem bảng màu trạng thái) | - |
| `.pos` | Nhãn từ loại, xem mục 5 | - |
| `.hl` | Từ đang tra trong câu ví dụ: nền primary, chữ on-primary, bo 6 | - |
| `.ul` | Từ đã lưu: gạch chân chấm 2px, màu accent, cách 5px | - |
| `.kw span` | Karaoke, xem mục 5 | - |
| `.bar` | Thanh tiến độ cao 8px, nền line, phần đã đi màu primary | - |
| `.o2` | Lựa chọn trắc nghiệm A–D: ô vuông chữ cái + nội dung | `.sel` đã chọn; `.ok` đáp án đúng |
| `.v` (thẻ video) | Thumbnail tint, chip cấp độ góc trái, tiêu đề, kênh, tiến độ | hover: viền accent + đổ bóng |
| `.top` / `.nav` | Header và tab pill; tab đang chọn nền tint | hover: phủ hover |
| `.drop` | Vùng kéo thả viền nét đứt 1.5px | - |
| Modal | Overlay mờ + thẻ surface bo 20–24, tiêu đề trái, nút Đóng phải | - |
| Input/textarea | Viền `--fs-border`, bo 12, nền `--fs-bg`, chữ `--fs-ink` | focus: viền accent |

Biểu tượng: dùng icon nét (SVG) hoặc chữ, **không dùng emoji**. Nút chỉ có icon phải có `aria-label`.

## 5. Từ loại, karaoke, highlight

**Ký hiệu từ loại** (`.pos`): nhãn nhỏ, in nghiêng, 12px/700, bo 8, nền tint, chữ accent, một màu duy nhất. Ý nghĩa nằm ở chữ viết tắt, màu không mang nghĩa.

| Ký hiệu | Nghĩa | Ký hiệu | Nghĩa |
|---|---|---|---|
| `n.m.` | danh từ giống đực | `adv.` | trạng từ |
| `n.f.` | danh từ giống cái | `prép.` | giới từ |
| `v.` | động từ | `conj.` | liên từ |
| `adj.` | tính từ | `pron.` | đại từ |

Nếu app đang dùng ký hiệu khác (ví dụ `loc.`, `interj.`, `n.m./f.`), giữ nguyên chữ app đang hiển thị và chỉ áp style.

**Karaoke** (phụ đề từng từ), 4 trạng thái, không chỉ dựa vào màu:

| Trạng thái | Style |
|---|---|
| Đã đọc | Chữ `--fs-accent-text` |
| Đang đọc | Nền `--fs-primary`, chữ `--fs-on-primary`, padding ngang 6, bo 8 |
| Chưa đọc | Chữ `--fs-muted`, đậm 600 |
| Từ đã lưu | Gạch chân chấm 2px, kết hợp được với 3 trạng thái trên |

Cỡ chữ mặc định 26px/700 (tăng giảm theo điều khiển A-/A+ của app).
**Từ trong câu ví dụ:** từ đang tra dùng `.hl`. **Từ khó trong bài:** gạch chân chấm như từ đã lưu.
**Không đổi** logic tách từ và đồng bộ thời gian; chỉ đổi style theo class/trạng thái có sẵn.

## 6. Dark mode

- Cùng tên token, giá trị tối (mục 3). Mint `#A8E6CF` giữ nguyên làm màu nhấn; chữ trên nút vẫn `#0F3D2B`.
- Header có nút chuyển sáng/tối. Mặc định theo hệ điều hành, lựa chọn người dùng lưu bằng key mới.
- Đổ bóng đậm hơn, viền mảnh thay cho độ tương phản bề mặt.
- Bốn nền đọc sách không đổi theo dark mode.

## 7. Danh sách màn hình và module

Làm tuần tự theo thứ tự M0 → M9, mỗi module một lượt giao AI.

### M0: Token và nền tảng
Khai báo biến (mỗi token có cặp sáng/tối), font, reset, thanh cuộn, focus ring. Chưa đổi component nào.

### M1: Header và thanh tab
Logo (ô vuông bo 10 nền primary, chữ "FS") và tên app. 5 tab dạng pill: **Luyện Video, Đọc báo, Đọc sách, Luyện dịch, Video của bạn**. Bên phải: chip "Từ vựng đã lưu · N", "Đồng bộ Cloud", nút chuyển sáng/tối.

### M2: Trang chủ Luyện Video
- Cột trái: tiêu đề, mô tả, thẻ nhập 2 bước (1. Link hoặc ID video YouTube + nút Dán; 2. Nạp phụ đề: chọn file SRT/VTT/TXT hoặc dán transcript; nút Bắt đầu luyện tập).
- Cột phải / bản thư viện: bộ lọc (Tất cả, Đang luyện, Đã xong, A1–C2), thẻ "Tiếp tục luyện", lưới thẻ video có chip cấp độ và thanh tiến độ, ô "Thêm video của bạn". Trạng thái: "Đang nạp thư viện video...", "Tổng: N video".

### M3: Trình luyện tập
- Chuyển chế độ: **Mặc định, Shadowing, Chép chính tả** (dạng `.seg`) và hộp "Chọn giao diện luyện tập" (3 thẻ chọn có mô tả).
- **Mặc định:** video 16:9, phụ đề karaoke, IPA, bản dịch; hàng nút bật tắt (IPA, Karaoke, Song ngữ, Tự dừng, Cuộn theo chữ, Thêm dấu câu, Từ khó, Dịch nghĩa, Phiên âm IPA, Ẩn chữ, Thi thử TCF); thanh tiến độ và thời gian; CC, Phụ đề Việt; tốc độ 0.5x/0.75x/0.9x/1.0x; Câu trước/Phát/Câu sau/Thu âm; cỡ chữ phụ đề, giãn dòng.
- **Danh sách câu** bên phải: "Câu n/N", trạng thái Hoàn hảo / Gần đúng / Cần luyện / Chưa làm; mục "Luyện shadowing toàn bài" lọc Tất cả / Chưa luyện.
- **Shadowing:** vùng chỉ âm thanh, Nghe mẫu, Thu âm, Nghe lại bản thu, so sánh giọng mẫu và giọng của bạn.
- **Chép chính tả:** Nghe thuần / Có gợi ý, tốc độ, ô gõ lại, hàng phím dấu (`é è ê ë à â ù û ô î ï ç œ æ ⇧`), gợi ý Enter/Tab, các nút Gợi ý từ, Xóa, Nghe lại, Kiểm tra, kết quả chấm từng từ (từ sai: gạch lượn sóng + chữ "đúng: ..."), Dịch nghĩa, Câu tiếp theo.
- **Khung tra từ:** từ, từ loại, cấp độ, IPA, Larousse, nghĩa theo từ loại, 3 câu ví dụ có highlight kèm bản dịch, Lưu từ, Loop, Phát âm.
- **Từ vựng khó trong bài:** bộ lọc cấp A1–C2, danh sách từ (từ loại, nghĩa, ví dụ có highlight, cấp độ), Lưu tất cả, Xem danh sách.

### M4: Đọc báo và Luyện dịch
- **Đọc báo:** 6 nguồn gợi ý (RFI Français Facile, Le Monde, France 24, Le Figaro, TV5Monde Apprendre, Courrier International), ô dán bài + bộ đếm từ, Tải file (.txt .docx .md), Xóa trắng, Bắt đầu đọc bài viết, danh sách bài có sẵn. **Màn đọc bài:** câu tiếng Pháp + bản dịch dưới câu, tra nhanh ngay trong bài, cột phải (nguồn, số từ, "Tự động lưu lịch sử", từ vựng trong bài).
- **Luyện dịch Việt → Pháp:** danh sách câu (Đã xem bản dịch / Đã gõ, chưa xem / Chưa làm; lọc Tất cả / Chưa luyện), câu tiếng Việt lớn, ô gõ, nút Hiện bản dịch và Hiện hết bản dịch, bản dịch sát nghĩa và bản dịch thoáng, Nhờ AI dịch, thư viện video tiếng Việt, 5 bước cài extension.

### M5: Đọc sách
- **Thư viện:** vùng kéo thả (.epub .pdf .txt .md .html .json), "Dùng thử ngay", "Thư viện sách của bạn".
- **Giao diện đọc:** 3 cột (Mục lục/Tìm kiếm, cột đọc, Hiển thị). Cột đọc: đoạn Pháp + bản dịch, từ đã lưu gạch chấm, thanh "Sắp hết phần đã dịch" + "Dịch tiếp →". Cài đặt: Nền (4 nền hiện có), Phông chữ, Cỡ chữ, Giãn dòng, Độ nổi bật, Độ rộng cột, Căn lề, Bản dịch hiện (Dưới đoạn / Dưới câu), Gạch chân từ đã lưu.
- **Hộp thoại:** Nhập sách (tên, tác giả, cách chia chương, chọn mục), Dịch song ngữ (bắt đầu từ đâu, cỡ mỗi đợt, Copy/Xem prompt, dán và áp dụng, ghi chú thuật ngữ), Quản lý bản dịch.

### M6: Từ vựng
Danh sách Từ vựng đã lưu (Ôn tập, Luyện tập, Điền nghĩa (AI), Xuất CSV, Xoá tất cả; lọc bài học, cấp độ, sắp xếp). Thẻ từ: từ, từ loại, IPA, nghĩa, ví dụ có highlight, cấp độ. Màn Ôn tập (Tra nghĩa, Phát âm, Loop, Lưu). Màn Luyện tập và Điền nghĩa (AI) trong mockup là **đề xuất**, cần đối chiếu app thật.

### M7: Hộp thoại chung
Hướng dẫn userscript (Khuyên dùng, Cài đặt/Cập nhật, Tampermonkey), Donate (tab MoMo/Vietcombank, QR, Lưu ảnh QR, Số tài khoản + Sao chép), Chia sẻ video (link ngắn + Copy link), prompt AI (Chưa có bản dịch, Thêm dấu câu, Từ vựng khó, Điền nghĩa riêng; mỗi hộp có Copy prompt, Mở Gemini, Mở Claude, ô dán, Áp dụng, Để sau).
Thông tin tài khoản, QR trong mockup là **chỗ giữ chỗ**; giữ nguyên nội dung thật của app.

### M8: Thi thử TCF Canada (Compréhension Orale)
- **Thiết lập:** nhãn "MÔ PHỎNG KHẢO THÍ FRANCE ÉDUCATION INTERNATIONAL", mô tả, khung thông số (thời lượng, tổng số từ/câu, độ khó ước tính, chuẩn tối đa 39 câu), chọn số lượng câu (Tự động / 5 / 10 / 20 / 39), độ khó mục tiêu (A2–C1, A2–B1, B1–B2, B2–C1), Copy prompt cho AI, ô dán JSON, Bắt đầu làm bài thi TCF, Đóng.
- **Làm bài:** header (nhãn TCF CANADA, tiêu đề video, đồng hồ, đóng), thanh "Tiếp tục nghe bài thi" + "Đang dừng" + quy tắc nghe 1 lần, thẻ câu hỏi "CÂU HỎI n / N" (chip cấp độ, loại câu hỏi), 4 đáp án A–D (đã chọn: viền accent + nền tint), footer "Đã chọn: x / N câu", Thoát, Nộp bài và xem kết quả. Hộp xác nhận nộp bài: app đang dùng `confirm()` của trình duyệt; đề xuất thay bằng dialog trong app (Hủy / Nộp bài), **chỉ khi đổi được mà không đụng logic**.
- **Kết quả:** khối điểm "x / N" + nhãn Niveau (A2 (CLB 4–5)...), lời nhận xét, thời gian làm bài, tỉ lệ đúng; từng câu có nhãn "✓ Đúng" / "× Sai", đáp án đúng tô xanh kèm chữ "✓ Đáp án đúng", nút Nghe lại đoạn này (mốc thời gian), khung "Giải thích chi tiết và dẫn chứng" (trích dẫn Pháp, dịch, giải thích), khung "Bẫy TCF"; footer Làm lại bài thi này, Tạo đề mới với AI, Đóng.
- Giữ nguyên: quy tắc nghe một lần, bộ đếm thời gian, chấm điểm, phân cấp CLB.

### M9: Trạng thái, tương tác, điện thoại
- Trạng thái: trống ("Chưa có từ vựng nào..."), đang tải (skeleton, "Đang xử lý..."), lỗi (khung viền và chữ màu lỗi + nút Thử lại), phản hồi nhanh ("Đã sao chép", "Đã lưu từ vựng").
- Hover (phủ `--fs-hover`), focus (viền 3px), nhấn (scale .97), vô hiệu hoá (opacity .5). Thẻ video hover: viền accent + đổ bóng.
- Điện thoại: thanh tab dưới (Video, Báo, Sách, Dịch, Của bạn), điểm gãy 900px, phần tử một cột, bảng rộng cuộn ngang trong hộp riêng.

## 8. Trợ năng

- Chữ đạt tương phản 4.5:1 (3:1 từ 24px). Đã chọn sẵn cặp màu đạt chuẩn ở cả hai chế độ.
- Màu phân biệt trạng thái luôn kèm chữ hoặc ký hiệu (Đúng/Sai, Hoàn hảo/Gần đúng..., gạch lượn sóng cho từ sai).
- Nút, ô chọn cao ≥ 44px. Dùng `<button>`, `<a href>`, `<input>` + `<label>` thật. Nút chỉ có icon có `aria-label`.
- Focus ring luôn nhìn thấy, không `outline: none` nếu không có thay thế.
- Tôn trọng `prefers-reduced-motion` nếu thêm chuyển động.

## 9. Cách thực hiện cho AI code

1. Đọc HTML/CSS/JS hiện tại. Liệt kê mọi selector mà JS dùng. Đây là danh sách **không được đổi**.
2. Tạo `theme-light.css` (nạp cuối), khai báo token cho sáng và tối.
3. Làm từng module M0 → M9. Với mỗi module: map thành phần mockup sang selector thật, chỉ thêm/ghi đè style, chỉ thêm class phụ khi bắt buộc.
4. Sau mỗi module chạy checklist mục 10, báo lại phần đã sửa và selector nào đã chạm.
5. Không refactor, không đổi tên, không gom file ngoài phạm vi.

Mẫu prompt cho mỗi module:

> Đây là mã nguồn hiện tại của French Shadowing Studio và đặc tả giao diện (file này). Hãy làm **module Mx**: chỉ đổi lớp trình bày theo đặc tả, đặt trong `theme-light.css`, bọc dưới `html[data-ui="light"]`, có cặp giá trị sáng/tối. Tuyệt đối không đổi id, data-*, class mà JS đang dùng, thứ tự DOM, event handler hay logic. Trước khi sửa, hãy liệt kê các selector JS đang dùng ở phần này. Sau khi sửa, liệt kê file và selector đã chạm, và chạy checklist hồi quy.

## 10. Checklist hồi quy (sau mỗi module)

- Nạp video + phụ đề, phát, karaoke chạy đúng thời điểm.
- Tra từ, lưu từ, phát âm, Loop.
- Thu âm và so sánh giọng.
- Chép chính tả: gõ, kiểm tra, chấm từng từ, phím tắt Enter và Tab.
- Đồng bộ Cloud, từ vựng đã lưu, xuất CSV.
- Mở sách cũ, nhớ vị trí đọc, dịch tiếp, tìm kiếm, mục lục.
- Đọc báo, Luyện dịch, Video của bạn.
- Thi thử TCF: tạo đề, làm bài, nghe một lần, nộp bài, xem kết quả.
- Mọi modal mở/đóng được; chuyển sáng/tối; tắt `data-ui="light"` thì về giao diện cũ nguyên vẹn.
- Kiểm tra ở 1280px, 900px và 390px.

## 11. Điều cần xác nhận với chủ app

- Màn **Luyện tập** và **Điền nghĩa (AI)** trong mockup là đề xuất, chưa có ảnh app thật.
- Bốn nền đọc sách hiện có (màu thật) và ký hiệu từ loại thật.
- Thông tin donate (số tài khoản, QR) giữ nguyên nội dung thật, mockup dùng chỗ giữ chỗ.
- Có nên thay `confirm()` khi nộp bài TCF bằng dialog trong app hay không.
