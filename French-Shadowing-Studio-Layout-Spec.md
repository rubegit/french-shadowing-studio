# French Shadowing Studio: Đặc tả BỐ CỤC (layout) theo mockup

File này bổ sung cho `French-Shadowing-Studio-UI-Redesign-Spec.md`. File kia mô tả màu và thành phần; **file này mô tả vị trí, cấu trúc cột, thứ tự và kích thước** của từng màn. Mockup: https://claude.ai/artifact/WFwmbhGknN9dpFLFPKBP5g (mỗi màn có bản sáng ở cột trái và bản tối ở cột phải, **bố cục hai bản giống hệt nhau**).

## 0. Vì sao kết quả mới chỉ đổi màu, chưa đổi bố cục

Giao diện cũ có cấu trúc DOM và CSS layout riêng. Chỉ ghi đè màu thì bố cục cũ vẫn giữ nguyên. Để giống mockup, AI **phải dựng lại layout bằng CSS** (grid/flex, `order`, `grid-template-areas`, max-width, gap) cho từng màn.

### Được phép (để đạt đúng bố cục)
- Đặt `display:grid` hoặc `display:flex` cho container hiện có và định nghĩa cột, hàng, gap, padding, max-width.
- Dùng `order`, `grid-area`, `grid-template-areas` để **đổi vị trí hiển thị** mà không đổi thứ tự DOM.
- **Thêm thẻ bao (wrapper `div`)** quanh các phần tử sẵn có để gom nhóm. Phần tử gốc phải được **chuyển vào** wrapper (giữ nguyên node, id, listener), không clone, không tạo lại bằng `innerHTML`.
- Ẩn trang trí cũ (đường kẻ, khung thừa) bằng CSS nếu không có JS nào phụ thuộc.

### Vẫn cấm
- Đổi hoặc xoá `id`, `data-*`, class mà JS dùng; thay node bằng node mới; đổi logic, event handler, thứ tự khởi tạo.
- Nếu một vị trí chỉ đạt được bằng cách sửa JS, **dừng lại và hỏi**, đừng tự sửa.

### Cách tự kiểm tra
Với mỗi màn: mở trang ở **1280×800**, so với artboard cùng tên trên canvas. Đạt khi: số cột, tỉ lệ cột, thứ tự khối, căn lề, khoảng cách khớp bảng dưới. Rồi thu cửa sổ về 900px và 390px kiểm tra phần responsive.

---

## 1. Khung chung (áp dụng mọi màn)

| Thành phần | Thông số |
|---|---|
| Nền trang | `--fs-bg`, cao tối thiểu bằng viewport |
| Header `.top` | Hàng ngang flex, `align-items:center`, `gap:24px`, `padding:14px 40px`, nền surface, viền dưới 1px |
| Trong header | Logo (ô 36×36 bo 10 + tên 17px/800) → nav (`flex:1`, tab pill `padding:11px 16px`, cách nhau 4px) → chip phải (`padding:11px 16px`, viền, bo pill) |
| Vùng nội dung `.wrap` | `max-width:1200px; margin:0 auto; padding:32px 40px; display:grid; gap:24px` |
| Điểm gãy 900px | Mọi lưới nhiều cột thành **1 cột**; `.wrap` padding `24px 20px`; header padding `12px 20px` |
| Thẻ | `padding:24px; border-radius:20px; border:1px solid line; box-shadow:0 8px 24px` |
| Tiêu đề trang H1 | 32px/800 (trang chủ 42px); mô tả dưới H1: 15–16px màu muted, cách 16–24px |
| Hàng tiêu đề thẻ `.hd` | Flex, `justify-content:space-between`, `align-items:baseline`, `margin-bottom:16px` (H2 trái 18–22px; chú thích hoặc nút phải) |
| Hàng nút `.row` | Flex-wrap, `gap:8px`, `margin-top:12px`, căn giữa theo chiều dọc |
| Dòng danh sách `.li` | Flex space-between, `padding:12px 14px`, bo 12, viền 1px, cách nhau 8px |

Các tỉ lệ cột dùng trong mockup:

| Tên | `grid-template-columns` | Dùng ở |
|---|---|---|
| `c2` | `minmax(0,7fr) minmax(0,4fr)` | Trình luyện, Đọc sách (giao diện đọc), Từ loại, Từ khó, Đọc báo (đọc bài) |
| `c2r` | `minmax(0,4fr) minmax(0,8fr)` | Luyện dịch (màn làm bài) |
| `c3` | `260px minmax(0,1fr) 300px` | Đọc sách (đầy đủ) |
| Trang chủ | `minmax(0,5fr) minmax(0,7fr)`, gap 32, padding `48px 40px` | Trang chủ Luyện Video |
| `g2` | `repeat(2,minmax(0,1fr))`, gap 24 | Luyện tập, hộp thoại 2, trạng thái, hover |
| `g3` (thẻ nhỏ) | `repeat(auto-fill,minmax(220px,1fr))`, gap 12–16 | Nguồn báo, thư viện video, sách |

---

## 2. Bố cục từng màn (wireframe + quy tắc)

Ký hiệu: `[ ]` khối, `|` ranh giới cột. Tên artboard trong ngoặc là tên trên canvas.

### 2.1 Trang chủ Luyện Video (`Main`, `HomeLib`)

```
[ HEADER: logo | nav 5 tab (Luyện Video đang chọn) | chip Từ vựng | chip Cloud ]
+---------------------------+--------------------------------------------+
| 5fr                       | 7fr                                        |
| H1 42px "Luyện nghe..."   | H2 "Thư viện video"      "Tổng: N video"   |
| mô tả 16px                | [chips lọc: Tất cả, Đang luyện, Đã xong,   |
| [THẺ NHẬP 2 BƯỚC]         |  A1..C2]                                   |
|  1. Link YouTube [Dán]    | [THẺ "Tiếp tục luyện": thumb 200px | tiêu đề|
|  2. Vùng nạp phụ đề       |  thanh tiến độ | nút Tiếp tục]             |
|  [Bắt đầu luyện tập]      | [LƯỚI thẻ video auto-fill 220px, gap 16]   |
|                           |  mỗi thẻ: thumb 124px + chip cấp độ góc    |
|                           |  trái + tiêu đề + kênh + thanh tiến độ 6px |
|                           | [ô nét đứt "Thêm video của bạn"]           |
+---------------------------+--------------------------------------------+
```
Quy tắc: bên **trái là nhập liệu, bên phải là thư viện**. Thẻ nhập là **một thẻ** chứa 2 bước, mỗi bước có vòng số 26px nền tint. Nút "Bắt đầu luyện tập" nằm cuối thẻ, không full width.

### 2.2 Trình luyện: chế độ Mặc định (`Player`, `Ctrl`)

```
+--------------------------------------------+--------------------------+
| 7fr                                        | 4fr                      |
| [H1 tiêu đề video]      [seg: Mặc định |   | [THẺ Danh sách câu]      |
|                          Shadowing |       |  H2 "Danh sách câu"  Câu |
|                          Chép chính tả]    |  1/N (phải)              |
| [VIDEO 16:9, bo 16]                        |  [dòng câu + nhãn trạng  |
| [thanh tiến độ 8px] [0:00 ......  0:00]    |   thái bên phải]         |
| [THẺ ĐIỀU KHIỂN, margin-top 16]            |  x5 dòng                 |
|  hàng chip: Song ngữ Karaoke IPA Tự dừng   |  (cuộn trong thẻ nếu dài)|
|  KARAOKE 26px/700 (wrap, gap 4x8)          |                          |
|  IPA (muted)                               | Màn "Ctrl": cột phải là  |
|  Bản dịch (muted)                          | [THẺ Chọn giao diện:     |
|  hàng: Câu trước | Phát | Câu sau |        |  3 ô lựa chọn xếp dọc]   |
|        Thu âm | [seg tốc độ]               | rồi [THẺ Luyện shadowing |
|  [THẺ Hiển thị và công cụ: các chip bật    |  toàn bài, margin-top 16]|
|   tắt, cỡ chữ seg, giãn dòng seg]          |                          |
+--------------------------------------------+--------------------------+
```
Quy tắc: **video ở trên, phụ đề karaoke và điều khiển ở dưới video, danh sách câu ở cột phải riêng**. Bộ chọn 3 chế độ nằm **cùng hàng với tiêu đề**, căn phải. Danh sách câu là thẻ độc lập, không nằm dưới video.

### 2.3 Trình luyện: Shadowing (`Shadow`) và Chép chính tả (`Dictee`)

```
+--------------------------------------------+--------------------------+
| 7fr  [THẺ LỚN]                             | 4fr [THẺ Danh sách câu]  |
| hàng: [seg 3 chế độ, mục chọn đúng] "Câu   |                          |
|        1/N" (phải)                         |                          |
| Shadowing: [thanh âm thanh 56px "Chỉ âm    |                          |
|  thanh"] karaoke, IPA, dịch                |                          |
|  hàng: Nghe mẫu | Thu âm | Nghe lại | seg  |                          |
|  "So sánh giọng": 2 thanh sóng 56px        |                          |
|  hàng: nhãn kết quả | Thử lại | Câu sau    |                          |
| Chép chính tả: hàng [seg Nghe thuần|Có     |                          |
|  gợi ý] [seg tốc độ]; thanh tiến độ; ô gõ  |                          |
|  90px; hàng phím dấu (ô 44px); gợi ý phím; |                          |
|  hàng nút; kết quả từng từ; dịch; Câu tiếp |                          |
+--------------------------------------------+--------------------------+
```
Quy tắc: không có video ở hai chế độ này; mọi thứ nằm trong **một thẻ lớn** bên trái.

### 2.4 Khung tra từ và Từ khó (`Tra`, `Hard`)

```
Tra:  7fr [THẺ TỪ: H1 [từ] + nhãn từ loại + cấp độ | nút Phát âm (phải)]
          IPA · Larousse / "Nghĩa" (dòng có nhãn từ loại) /
          "Ví dụ" (3 dòng, từ highlight) / hàng Lưu từ | Loop câu
      4fr [THẺ Chú giải ký hiệu: bảng từ loại, mẫu karaoke]
Hard: 7fr [THẺ: video 16:9 + karaoke + chú thích]
      4fr [THẺ Từ khó: H2 + "N từ"; hàng chip A1..C2; danh sách từ
           (từ + từ loại, nghĩa, ví dụ highlight, nhãn cấp độ phải);
           hàng Lưu tất cả | Xem danh sách]
```

### 2.5 Đọc báo (`Bao`, `Article`)

```
Bao (MỘT CỘT, tối đa 1200): H1 + mô tả
  [LƯỚI 6 thẻ nguồn auto-fill 220px, gap 12]
  [THẺ nhập bài: H2 trái + "0 từ" phải; textarea cao 150px+; hàng 3 nút]
  [THẺ Thử đọc bài có sẵn: danh sách dòng + nhãn cấp độ]
Article: THANH TRÊN (pill Đọc báo | tiêu đề flex:1 | pill Từ vựng | pill Song ngữ)
  7fr cột đọc max-width 620 căn giữa: đoạn Pháp 19px/1.8 + bản dịch 15px muted
      bên dưới; khung tra nhanh nổi giữa các đoạn
  4fr THẺ: Nguồn, số từ, nhãn lưu lịch sử, nút, "Từ vựng trong bài"
```

### 2.6 Luyện dịch (`Dich`, `DichX`)

```
DichX (màn chọn video và cài extension): c2 (7fr | 4fr)
  trái: H1 + mô tả; lưới 3 thẻ video; THẺ 5 bước cài extension (dòng dọc) + nút
  phải: THẺ [H2 Danh sách câu | nút Hiện hết bản dịch] + seg lọc + danh sách
        + khối "Nhờ AI dịch" (copy prompt, textarea, nút)
Dich (màn làm bài): c2r (4fr | 8fr)
  trái: THẺ Danh sách câu (seg lọc trên cùng, rồi dòng + nhãn trạng thái)
  phải: H1 + mô tả; THẺ [H2 "Câu n/N" | nút Nhờ AI]; câu Việt 24px/700;
        textarea; nút Hiện bản dịch; THẺ (margin-top 16) bản dịch sát nghĩa
        và bản dịch thoáng
```
Lưu ý: **hai trạng thái khác nhau có vị trí danh sách khác nhau** (chọn video: danh sách bên phải; làm bài: danh sách bên trái, hẹp hơn).

### 2.7 Đọc sách (`Sach`, `Reader`, `ReaderX`)

```
Sach (MỘT CỘT): H1 + mô tả; [VÙNG KÉO THẢ padding 32, nét đứt, căn giữa];
  hàng "Dùng thử ngay" (H2 trái, ghi chú phải); lưới bìa 3:4 (auto-fill 220px);
  hàng "Thư viện sách của bạn"; lưới bìa
Reader (đơn giản): THANH TRÊN (pill Thư viện | pill Mục lục | tên sách flex:1 |
  pill Từ vựng | pill Song ngữ); c2: cột đọc max-width 620 giữa | THẺ Hiển thị
ReaderX (đầy đủ): c3 = 260px | 1fr | 300px
  trái  THẺ [seg Mục lục|Tìm kiếm] + danh sách chương hoặc ô tìm
  giữa  cột đọc max-width 620 giữa; dưới cùng THẺ [chữ "Sắp hết phần đã dịch"
        | nút Dịch tiếp →]
  phải  THẺ Hiển thị: H2; nhãn nhỏ 13px/700 muted; Nền = 4 ô 44×44 bo 12;
        Phông (seg); Cỡ chữ (seg A- A+); Giãn dòng; Độ nổi bật; Độ rộng cột
        (seg Hẹp/Vừa/Rộng); Căn lề; Bản dịch hiện; ô tick Gạch chân từ đã lưu
```
Quy tắc: **cài đặt luôn nằm cột phải**, mục lục cột trái; **cột đọc ở giữa, không tràn full width**.

### 2.8 Từ vựng, ôn tập, luyện tập (`Vung`, `Review`, `Practice`)

```
Vung (MỘT CỘT): hàng [H1 "Từ vựng đã lưu · N" (trái) | nút Ôn tập, Luyện tập,
  Điền nghĩa, Xuất CSV (phải)]; hàng chip lọc; THẺ danh sách (mỗi dòng: từ +
  nhãn từ loại, dòng IPA·nghĩa, dòng ví dụ highlight; nhãn cấp độ bên phải)
Review (MỘT CỘT hẹp max-width 720 căn giữa): hàng [H1 | "N từ"]; THẺ: từ lớn 24px
  + từ loại; IPA; hàng Tra nghĩa|Phát âm|Loop|Lưu; Nghĩa; Ví dụ; thanh tiến
  độ; hàng Trước (trái) | Sau (phải)
Practice: g2 (2 cột bằng nhau): THẺ Luyện tập (câu hỏi + 4 đáp án A–D + thanh
  tiến độ + 2 nút) | THẺ Điền nghĩa (hàng từ + ô nhập, khối prompt AI)
```

### 2.9 Video của bạn (`Own`)
MỘT CỘT: H1 + mô tả; THẺ nhập (nhãn bước 1, ô link + nút Dán cùng hàng; nhãn bước 2, vùng chọn file; hàng 2 nút; ghi chú; nút Bắt đầu); hàng "Thư viện video / Tổng: N"; vùng trạng thái nạp.

### 2.10 Hộp thoại (`Mod1`, `Mod2`, `BookMod`)
Trong app, mỗi hộp thoại là **một modal** (overlay mờ + thẻ giữa màn). Mockup xếp nhiều hộp cạnh nhau chỉ để so sánh. Cấu trúc **một hộp**: thẻ padding 24, hàng tiêu đề (H2 trái | nút Đóng phải), nội dung xếp dọc, hàng nút cuối.
- `Mod1`: 3 hộp (Userscript, Donate, Chia sẻ). `Mod2`: lưới 2×2 (4 hộp prompt AI). `BookMod`: 3 hộp.
- Hộp prompt AI: dòng giải thích, hàng 3 nút (Copy prompt, Mở Gemini, Mở Claude), textarea 90px, hàng (Áp dụng | Để sau).

### 2.11 Thi thử TCF (`TcfSetup`, `TcfExam`, `TcfResult`)

```
MODAL: max-width 920px, căn giữa, bo 24, viền, bóng lớn, overflow hidden
+------------------------------------------------------------------+
| HEADER padding 16x22, viền dưới:                                 |
|   Setup: H2 20px (trái) | nút Đóng (phải)                        |
|   Exam/Result: nhãn TCF CANADA | tiêu đề video (flex:1) | đồng hồ | Đóng |
| BAR (chỉ Exam/Result) nền tint: nút Tiếp tục nghe | "Đang dừng" |    |
|      quy tắc nghe 1 lần (căn phải, 13px, màu cảnh báo)           |
| BODY padding 22 (cuộn):                                          |
|   Setup: nhãn mô phỏng, mô tả, KHUNG thông số, "SỐ LƯỢNG CÂU HỎI"|
|     (chip wrap), "ĐỘ KHÓ MỤC TIÊU" (chip wrap), nút Copy prompt, |
|     textarea 140px mono                                          |
|   Exam: các THẺ CÂU HỎI xếp dọc, cách nhau 16                    |
|   Result: KHỐI ĐIỂM căn giữa (số 64px/800 + "/ N", nhãn Niveau, |
|     nhận xét, thời gian), rồi các thẻ câu hỏi                    |
| FOOTER padding 16x22, viền trên (cố định đáy modal):             |
|   Setup: [Bắt đầu...] [Đóng]                                     |
|   Exam: "Đã chọn: x / N câu" | (đẩy phải) Thoát | Nộp bài        |
|   Result: Làm lại | Tạo đề mới | (đẩy phải) Đóng                  |
+------------------------------------------------------------------+
THẺ CÂU HỎI: hàng đầu [CÂU HỎI n / N (trái, 13px/700 accent) | nhãn trạng thái +
  chip cấp độ + loại câu hỏi (phải)]; câu hỏi 18px/700; 4 hàng đáp án
  (min-height 48, bo 14, gap 14: ô chữ cái 32×32 bo 8 | nội dung flex:1 |
  chữ "✓ Đáp án đúng" bên phải nếu đúng); (Result) nút Nghe lại, khung giải
  thích viền trái 4px, khung Bẫy TCF
```
Quy tắc: **header và footer cố định, chỉ phần body cuộn**. Mỗi đáp án là **một hàng đầy chiều rộng**, không xếp 2 cột.

### 2.12 Trạng thái, hover, điện thoại (`States`, `Hover`, `Mobile`)
- `States` và `Hover`: lưới `g2`, mỗi ô là một thẻ minh hoạ (không phải layout app).
- `Mobile`: khung 360 rộng; bên trong **một cột**, padding 16; **thanh tab dưới cố định** gồm 5 mục chia đều (Video, Báo, Sách, Dịch, Của bạn). Header trên trang chủ chỉ còn logo + tên; nav chuyển xuống thanh tab. Trình luyện: video → karaoke → điều khiển → danh sách câu theo chiều dọc. Đọc sách: thanh nhỏ (Mục lục, Aa) trên cùng, cột đọc full width, nút "Dịch tiếp →" full width ở đáy.

---

## 3. Quy tắc bố cục xuyên suốt (hay bị làm sai)

1. **Nội dung chính luôn nằm trong cột `max-width:1200px` căn giữa**, không kéo full width màn hình.
2. **Tiêu đề thẻ trái, hành động phụ phải** trên cùng một hàng (`.hd`).
3. **Danh sách câu luôn là một thẻ riêng**, ở cột phải (trình luyện) hoặc cột trái (luyện dịch làm bài), **không nằm chung thẻ với video/phụ đề**.
4. **Cài đặt hiển thị của trình đọc sách nằm cột phải** là một thẻ, không phải thanh trên cùng.
5. **Hàng nút** luôn xếp ngang, wrap khi hẹp; nút chính nằm đầu hoặc cuối hàng theo mockup, **không** full width trên desktop (trừ điện thoại).
6. **Bộ chọn dạng `seg`** (chế độ, tốc độ, căn lề...) là một khối liền, mục chọn có nền primary, không phải nhiều nút rời.
7. Khoảng cách chuẩn: giữa các thẻ cùng cột 16px; giữa các cột 24px; trong thẻ 24px.
8. Mọi hộp thoại có nút **Đóng** ở góc trên phải; hành động chính ở cuối.

## 4. Cách giao việc cho AI (mẫu prompt)

> Đây là mã nguồn hiện tại và hai file đặc tả (UI-Redesign-Spec và Layout-Spec). Giao diện hiện đã đổi màu nhưng **bố cục chưa giống mockup**. Hãy làm lại **bố cục** cho màn `<tên màn>` theo mục `<số mục>` của Layout-Spec: dựng lại grid/flex, tỉ lệ cột, thứ tự hiển thị, khoảng cách, max-width đúng bảng. Được dùng CSS `order`/`grid-template-areas` và thêm wrapper (chuyển node gốc vào, không clone). Không đổi id, data-*, class mà JS dùng, event handler hay logic. Nếu một vị trí chỉ đạt được bằng cách sửa JS thì dừng lại và hỏi. Trước khi sửa, hãy liệt kê cấu trúc DOM hiện tại của màn này và đề xuất cách map sang bố cục mới. Sau khi sửa, chụp ảnh ở 1280px, 900px, 390px để đối chiếu với artboard.

Làm **một màn mỗi lượt**, theo thứ tự: Header (2.1 khung chung) → Trang chủ → Trình luyện → Đọc báo → Luyện dịch → Đọc sách → Từ vựng → Hộp thoại → TCF → Mobile.
