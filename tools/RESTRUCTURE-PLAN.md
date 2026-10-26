# Kế hoạch tách `index.html` thành nhiều file (không đổi hành vi)

`index.html` hiện ~22.925 dòng, ~850 KB (gồm HTML, CSS và JS nội tuyến). Mục tiêu: chia thành nhiều file nhỏ theo màn hình và tính năng, **không đổi cách ứng dụng chạy**, để việc làm lại giao diện sau đó nhẹ và an toàn hơn.

> Tôi chưa xem mã nguồn thật của `index.html`, nên chưa biết tên hàm, id hay ranh giới tính năng. Kế hoạch và công cụ dưới đây được thiết kế để **chạy được mà không cần biết trước**, và có lệnh `verify` chứng minh việc tách không làm mất hay đổi một byte nào. Công cụ đã chạy đúng trên một file mẫu nhỏ; bạn cần chạy thử trên file thật.

## 1. Nguyên tắc an toàn

1. **Làm trên nhánh riêng**: `git checkout -b refactor/split-index`, commit sau mỗi giai đoạn.
2. **Chia theo vị trí, không viết lại**: mỗi khối nội tuyến được chuyển nguyên văn ra file và thẻ `<link>`/`<script src>` đứng **đúng chỗ cũ**, nên thứ tự thực thi và phụ thuộc DOM không đổi.
3. **Giữ JS dạng classic script**, không chuyển sang ES module ở giai đoạn này. Lý do: `onclick="..."` trong HTML và biến toàn cục sẽ hỏng nếu đổi sang module.
4. **Chỉ gộp** các khối **liền kề cùng loại**; công cụ từ chối gộp nếu giữa chúng có HTML (vì sẽ đổi thứ tự chạy).
5. Mỗi lần tách xong chạy `verify` và kiểm thử thủ công (mục 6) trước khi sang bước sau.
6. Không đổi: `userscript/`, `subs/`, `assets/`, các file `*.json` dữ liệu, `supabase-schema.sql`, đường dẫn mà JS đang `fetch`. (Đường dẫn tương đối của `fetch` tính theo trang `index.html`, không đổi khi chuyển JS sang file khác.)

## 2. Cấu trúc đích

```
Shadowing/
├── index.html                  # FILE SINH RA từ src/ (vẫn commit để Vercel chạy, không cần build)
├── src/
│   └── index.src.html          # NGUỒN HTML: vỏ trang + <!-- @include partials/... -->
├── partials/                   # mỗi màn hình hoặc hộp thoại một file
│   ├── header.html
│   ├── view-home.html          # Trang chủ Luyện Video
│   ├── view-news.html          # Đọc báo
│   ├── view-translate.html     # Luyện dịch
│   ├── view-books.html         # Đọc sách (thư viện)
│   ├── view-reader.html        # Giao diện đọc sách
│   ├── view-own-video.html     # Video của bạn
│   ├── player.html             # Trình luyện (3 chế độ)
│   ├── vocab-saved.html        # Từ vựng đã lưu và Ôn tập
│   └── modals-*.html           # AI prompts, userscript, donate, nhập sách, chia sẻ...
├── css/
│   ├── 01-... (các khối <style> nội tuyến, đặt tên theo nội dung: base, layout, components, views)
│   └── theme-light.css         # nạp CUỐI CÙNG
├── js/
│   ├── (các khối <script> nội tuyến, đặt tên theo tính năng: core/storage, player, karaoke,
│   │    lookup, news, translate, ebook, vocab-list, modals-ai, theme-toggle...)
│   ├── vocab-practice.js
│   ├── tcf-exam.js
│   └── supabase-sync.js
├── subs/  assets/  userscript/  *.json   # GIỮ NGUYÊN vị trí
├── tools/
│   ├── restructure.py          # công cụ tách (file kèm theo)
│   └── split-manifest.json     # sinh ra, ghi lại phép tách để kiểm chứng
├── mockup-ref/                 # tham chiếu thiết kế (chỉ đọc)
└── index.original.html         # bản gốc sao lưu (chỉ để đối chiếu, có thể xoá sau)
```

Ba file đang nằm ở gốc (`theme-light.css`, `vocab-practice.*`, `tcf-exam.*`, `supabase-sync.js`) **chưa di chuyển** ở giai đoạn 1–3, để không làm hỏng đường dẫn; chúng được chuyển vào `css/` và `js/` ở giai đoạn 4.

## 3. Các giai đoạn

### Giai đoạn 0: Chuẩn bị
- Copy `restructure.py` vào `tools/`. Chạy tại gốc repo (cần Python 3, không cần cài thêm gì).
- Mở site bằng máy chủ cục bộ: `python3 -m http.server 8080`, ghi lại ảnh chụp các màn để so sánh sau này.

### Giai đoạn 1: Quét
```
python3 tools/restructure.py scan
```
In danh sách mọi khối `<style>`/`<script>` nội tuyến: số thứ tự, loại, dòng bắt đầu, số dòng, thuộc tính và dòng đầu. Từ danh sách này quyết định tên và cách nhóm. Khối `<script src>`, JSON-LD, template và khối rỗng bị bỏ qua tự động.

### Giai đoạn 2: Tách CSS và JS
```
python3 tools/restructure.py extract                      # tên tự động: css/NN-style.css, js/NN-script.js
python3 tools/restructure.py verify                       # phải ra: LOSSLESS
```
Muốn đặt tên và gộp, tạo `map.json`:
```json
[
  {"blocks": [1, 2], "file": "css/base.css"},
  {"blocks": [3],    "file": "css/views.css"},
  {"block": 7, "split": [
      {"to_line": 1800, "file": "js/core.js"},
      {"to_line": 5200, "file": "js/player.js"},
      {"file": "js/rest.js"}
  ]}
]
```
rồi `python3 tools/restructure.py extract --map map.json`.

Lưu ý khi cắt một khối JS lớn bằng `split`:
- **Chỉ cắt giữa các hàm hoặc khối ở mức trên cùng**, không cắt giữa thân hàm.
- Mỗi file là một `<script>` riêng: **hàm khai báo ở file sau sẽ không dùng được lúc code chạy ngay ở file trước** (hoisting chỉ có trong một script). Nếu code gọi hàm ngay lúc nạp, đặt phần định nghĩa ở file đứng trước.
- Nếu máy có `node`, công cụ tự cảnh báo file nào không phải JS hợp lệ độc lập.
- Biến `let/const/class` ở mức trên cùng vẫn dùng chung giữa các script classic.

Thêm `--bust` để gắn `?v=<mã băm>` vào đường dẫn, tránh trình duyệt dùng bản cũ (đáng làm nếu `vercel.json` đặt cache dài cho file tĩnh).

Kiểm thử mục 6 → commit.

### Giai đoạn 3: Tách HTML thành partial theo màn hình
Mỗi lệnh cắt một phần tử (theo `id`) ra file riêng, để lại dòng `<!-- @include ... -->` trong `src/index.src.html`:
```
python3 tools/restructure.py cut --id <id-trang-chủ>   --to partials/view-home.html
python3 tools/restructure.py cut --id <id-đọc-báo>     --to partials/view-news.html
python3 tools/restructure.py verify
```
(Tìm id bằng `grep -n 'id="' index.original.html | head -200`.) Công cụ tự bỏ qua `<div>` nằm trong chuỗi JS hay chú thích khi ghép thẻ đóng.

Từ đây **sửa HTML ở `src/` và `partials/`**, rồi chạy:
```
python3 tools/restructure.py build      # sinh lại index.html
```
`index.html` là file sinh ra; **không sửa tay**. Vẫn commit nó để Vercel phục vụ trực tiếp, không cần bước build trên máy chủ.

Lưu ý: `verify` chỉ đúng ngay sau khi tách (trước khi bạn sửa gì). Sau đó nó báo "KHÁC bản gốc" là bình thường.

### Giai đoạn 4 (tuỳ chọn): Dọn gốc repo
Chuyển `theme-light.css`, `vocab-practice.css/js`, `tcf-exam.css/js`, `supabase-sync.js` vào `css/` và `js/`, **sửa đúng các thẻ trỏ tới chúng trong `src/index.src.html`** rồi `build`. Kiểm tra `vercel.json`, README và mọi chỗ khác nhắc tên các file này. Giữ nguyên `userscript/` vì URL của nó được dùng công khai trong app.

### Giai đoạn 5 (tuỳ chọn, sau khi mọi thứ ổn định)
Chuyển dần từng file JS sang ES module (`type="module"`), bỏ `onclick` nội tuyến, thêm `defer`. Đây là thay đổi có rủi ro hành vi nên để riêng, từng file một.

## 4. Thứ tự nạp (không được đảo)
1. CSS gốc (các file tách từ `<style>`), rồi `vocab-practice.css`, `tcf-exam.css`.
2. **`theme-light.css` cuối cùng.**
3. Các `<script>` giữ nguyên thứ tự vị trí ban đầu trong tài liệu.

## 5. Việc nên làm kèm
- Thêm `.vercelignore` để không đưa lên web: `src/`, `partials/`, `tools/`, `mockup-ref/`, `index.original.html`, `.agents/`.
- Thêm `.agents/**/__pycache__/` vào `.gitignore`.
- Cập nhật `PROJECT_STRUCTURE.md` theo cấu trúc mới (cây thư mục, vai trò từng file, cách `build`).
- Thêm vào `AGENTS.md`: "Sửa HTML ở `src/` và `partials/`, không sửa tay `index.html`; sau khi sửa chạy `python3 tools/restructure.py build`."

## 6. Kiểm thử sau mỗi giai đoạn
- Mở trang bằng máy chủ cục bộ, F12 > Console: **không có lỗi đỏ mới** so với bản gốc; Network: mọi file mới trả 200.
- Chạy một lượt: phát video + karaoke, tra và lưu từ, thu âm, chép chính tả, Luyện tập 4 chế độ, Thi thử TCF, Đọc báo, Luyện dịch, Đọc sách (nạp sách, mục lục, dịch tiếp), Từ vựng, Đồng bộ Cloud, đổi theme.
- So ảnh chụp trước và sau ở 1280px và 390px: **phải giống hệt** (giai đoạn 1–3 không được đổi hình thức).
- Thử trên iOS Safari (ứng dụng có xử lý pre-warm audio cho iOS).

## 7. Rủi ro đã biết
| Rủi ro | Cách giảm |
|---|---|
| Đổi thứ tự thực thi script | Thẻ đứng đúng vị trí cũ; từ chối gộp khối không liền kề |
| Gọi hàm ở file khác khi chạy ngay lúc nạp (hoisting) | Chỉ cắt ở ranh giới hàm; đặt định nghĩa lên trước; kiểm thử |
| `onclick` nội tuyến không thấy hàm | Giữ classic script (không dùng module) |
| Cache cũ trên trình duyệt | `--bust` hoặc đổi tên file; kiểm tra `vercel.json` |
| `index.html` sinh ra bị sửa tay rồi bị ghi đè | Quy tắc trong `AGENTS.md`; chỉ sửa ở `src/`, `partials/` |
| Công cụ gặp trường hợp lạ trong 22.925 dòng thật | Luôn chạy `verify`; có `index.original.html` để quay lại (`git checkout`) |

## 8. Prompt mẫu để nhờ AI lập `map.json` (không cho AI sửa mã)
> Đây là kết quả `scan` của `index.html` và file `index.original.html`. Hãy đề xuất `map.json` cho `tools/restructure.py`: (1) nhóm các khối CSS liền kề thành file theo vai trò (base, layout, components, từng màn); (2) với khối JS lớn, đề xuất các điểm cắt theo **số dòng ở ranh giới hàm cấp trên cùng** (kèm tên hàm đầu tiên của mỗi phần) và tên file theo tính năng (core, player, karaoke, lookup, news, translate, ebook, vocab-list, modals-ai, theme-toggle...). Không sửa bất kỳ dòng mã nào. Với mỗi điểm cắt, kiểm tra không có lời gọi hàm chạy ngay lúc nạp tới một hàm nằm ở phần sau. Liệt kê các id của màn hình/hộp thoại phù hợp để dùng với lệnh `cut`.
