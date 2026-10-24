# 🇫🇷 French Shadowing Studio

> **Nền tảng luyện tập Shadowing, Chép chính tả (Dictation) và Khảo thí Thi thử TCF Canada chuyên sâu cho người học tiếng Pháp trên nền tảng Video YouTube song ngữ Pháp – Việt.**

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_Vercel-success?style=for-the-badge&logo=vercel)](https://french-shadowing-studio.vercel.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20PWA-orange?style=for-the-badge)]()

🌐 **Trải nghiệm trực tuyến ngay tại:** [https://french-shadowing-studio.vercel.app/](https://french-shadowing-studio.vercel.app/)

---

## 📖 Giới thiệu tổng quan

**French Shadowing Studio** là ứng dụng web toàn diện được thiết kế chuyên biệt để giúp người học tiếng Pháp nâng cao phản xạ nghe - nói tự nhiên, chuẩn hóa phát âm và luyện thi chứng chỉ **TCF Canada (Compréhension Orale)**.

Khác với các ứng dụng xem video thông thường, French Shadowing Studio chia nhỏ video thành từng câu thoại độc lập có phụ đề song ngữ Pháp - Việt chuẩn xác, hỗ trợ đồng bộ từng chữ ở tốc độ 60fps, tự động ngắt câu để nhại giọng (*Shadowing*), ghi âm đối sánh ngữ điệu, luyện chép chính tả và cung cấp ngân hàng đề thi mô phỏng chuẩn khảo thí quốc tế.

---

## 🌟 7 Nhóm tính năng cốt lõi

### 1. 🎙️ Luyện Shadowing & Ghi âm Đối sánh Ngữ điệu
- **Đồng bộ từng từ (Word-level timestamps):** Hiệu ứng chữ chạy karaoke mượt mà 60 khung hình/giây giúp người học bắt kịp nhịp điệu và ngữ điệu tự nhiên của người bản xứ.
- **Tùy chỉnh tốc độ linh hoạt:** Hỗ trợ điều chỉnh tốc độ từ `0.5x`, `0.75x`, `0.9x`, `1.0x` đến `1.25x` mà không làm biến dạng cao độ giọng nói (*pitch preservation*).
- **Thu âm đối sánh trực tiếp (`MediaRecorder`):** Bấm phím tắt hoặc nút micro để thu âm giọng nói của bạn cho từng câu thoại, sau đó nghe lại song song để tự nhận biết lỗi phát âm, nối âm (*liaison*) và ngữ điệu lên xuống.

### 2. ⏸️ Chế độ "Tự dừng cuối câu" (Sentence Auto-Stop)
- **Học theo nhịp độ cá nhân:** Khi bật tính năng **[⏸ Tự dừng]** trên thanh công cụ Header hoặc thẻ câu, video sẽ tự động tạm dừng chính xác ở cuối mỗi câu thoại để bạn có thời gian lặp lại và nhại giọng.
- **Tiếp tục mượt mà:** Nhấn phím `Space` hoặc nút Play để phát ngay câu tiếp theo mà không sợ trôi mất nội dung bài học. Trạng thái bật/tắt được lưu tự động vào bộ nhớ trình duyệt (`localStorage`).

### 3. ✍️ Chép chính tả Thông minh (Dictation Studio)
- **Tập trung vào âm thanh:** Chế độ ẩn chữ giúp bạn luyện phản xạ nghe - chép từng câu thoại.
- **Thuật toán so sánh Levenshtein chuyên sâu:** Tự động phát hiện lỗi chính tả, phân biệt rõ từ đúng, từ sai dấu trọng âm, từ viết thiếu hoặc từ thừa.
- **Nhận diện khẩu ngữ tiếng Pháp (*Français familier*):** Tự động hiểu và chấp nhận các từ nói tắt phổ biến trong đời sống thực tế như: *t'as, chuis, chais pas, y a, ptit, msieur, c't'idée...*
- **Chấm điểm phần trăm (%):** Đánh giá độ chính xác tức thì và lưu lại lịch sử kết quả.

### 4. 🇨🇦 Mô phỏng Khảo thí Thi thử TCF Canada (Compréhension Orale)
- **Chuẩn cấu trúc France Éducation International:** Bộ câu hỏi trắc nghiệm QCM 4 lựa chọn (A/B/C/D) hoàn toàn bằng tiếng Pháp theo chuẩn đề thi Nghe hiểu TCF Canada chính thức (tối đa 39 câu).
- **Cơ chế Prompt AI Tự định lượng linh hoạt:**
  - `✨ Tự động theo bài (Tối đa 39 câu)`: AI tự phân tích độ dài và mật độ thông tin của bài nghe để quyết định số lượng câu hỏi phù hợp nhất (từ 3 đến 39 câu), rải đều theo trục thời gian.
  - Các mức chọn tùy biến nhanh: `5 câu (Nhanh)`, `10 câu (Tiêu chuẩn)`, `20 câu (Luyện sâu)` và `39 câu (Trọn vẹn 1 đề thi TCF)`.
- **Tiêu chuẩn khảo thí khắt khe:**
  - Đáp án đúng được diễn đạt lại bằng từ đồng nghĩa (*paraphrase*).
  - 3 phương án nhiễu logic chứa các bẫy nghe kinh điển (*pièges*): đồng âm dị nghĩa, thông tin phủ định, suy diễn quá mức.
  - Mốc thời gian chính xác `[mm:ss - mm:ss]` của đoạn âm thanh chứa đáp án.
  - Lời giải thích chi tiết bằng tiếng Việt kèm trích dẫn chứng cứ (*evidence quote*).
- **Giao diện phòng thi mô phỏng:** Có đồng hồ bấm giờ, nút nghe lại phân đoạn âm thanh tương ứng từng câu, chấm điểm và bảng phân tích trình độ CEFR từ **A1 đến C2**.

### 5. ✨ Trung tâm Luyện Từ vựng Chuyên sâu (Vocab Practice Hub)
- **3 Chế độ học tập tương tác:**
  - 🎴 **Flashcard 3D lật mặt:** Hiển thị từ vựng, phiên âm IPA, nghĩa tiếng Việt, câu ví dụ và bối cảnh trích xuất.
  - 📝 **Trắc nghiệm QCM 4 lựa chọn:** Kiểm tra phản xạ nhận diện nghĩa từ trong thời gian giới hạn.
  - 🎧 **Nghe và Gõ từ (Listen & Type):** Nghe phát âm và gõ lại đúng chính tả từ vựng tiếng Pháp.
- **Thuật toán Lặp lại ngắt quãng (Spaced Repetition - SRS):** Tự động phân loại từ theo trạng thái (*Mới học -> Đang nhớ -> Thành thạo*) và nhắc nhở ôn tập đúng ngày (*Due reviews*).
- **Bộ lọc mạnh mẽ:** Lọc theo cấp độ chuẩn Châu Âu CEFR (**A1, A2, B1, B2, C1, C2**) hoặc lọc riêng theo từng bài học/video.

### 6. 🎧 Audio Video Từ vựng Gốc & Tra cứu Toàn diện
- **Nghe âm thanh thực tế cắt từ video gốc:** Nút `🎧 Audio video` cho phép nghe đúng giọng người bản xứ phát âm từ vựng trong bối cảnh video thực tế mà không cần chiếu lại video.
- **Cơ chế Pre-warm thông minh:** Tự động nạp sẵn Background Audio Player khi vào trang, vượt qua hoàn toàn chính sách chặn autoplay trên Safari/iPhone.
- **Tra cứu nghĩa theo ngữ cảnh với Google AI:** Hiểu nghĩa chính xác của từ hoặc cụm từ tùy thuộc vào ngữ cảnh của câu thoại.
- **Liên kết Từ điển danh tiếng:** Mở nhanh trang từ điển chuẩn **Larousse** (`larousse.fr`) và bảng phiên âm quốc tế **IPA**.

### 7. ☁️ Đồng bộ Đám mây Đa thiết bị với Supabase
- Tích hợp đám mây qua [Supabase](https://supabase.com/), tự động đồng bộ danh sách từ vựng đã lưu, ghi chú cá nhân và tiến độ luyện tập giữa Máy tính, iPhone, iPad và điện thoại Android.
- Hỗ trợ lưu trữ cục bộ (*Offline-first*) khi mất mạng và tự động đồng bộ hóa khi có kết nối trở lại.

---

## ⌨️ Bảng Phím tắt Bàn phím (Keyboard Shortcuts)

Ứng dụng được thiết kế tối ưu cho việc luyện tập bàn phím không cần dùng chuột:

| Phím tắt | Chức năng |
| :--- | :--- |
| `Space` | Tạm dừng / Tiếp tục phát video |
| `←` / `→` | Lùi lại / Tiến tới 3 giây |
| `↑` / `↓` | Nhảy về câu trước / Chuyển sang câu kế tiếp |
| `R` | Nghe lại ngay lập tức câu thoại hiện tại |
| `M` | Bật / Tắt micro để ghi âm giọng nói |
| `P` | Nghe lại bản ghi âm vừa thu |
| `C` | Bật / Tắt phụ đề gốc của YouTube |
| `B` | Bật / Tắt chế độ Phụ đề song ngữ Pháp - Việt |
| `K` | Bật / Tắt chế độ Karaoke chữ chạy sáng |
| `1` - `5` | Điều chỉnh nhanh tốc độ phát (`0.75x`, `1.0x`, `1.25x`...) |
| `Tab` | Chuyển nhanh giữa chế độ Shadowing và Dictation |

---

## 📱 Trải nghiệm Mobile-First & Tiết kiệm Pin

- **Giao diện tối ưu cho iPhone/Smartphone:** Thanh công cụ Header co giãn thông minh, thẻ từ vựng thiết kế dạng khối dọc giúp từ và cụm từ dài hiển thị 100% bề ngang, không bao giờ bị rớt dòng hay gãy chữ.
- **Vòng đời tối ưu CPU & Pin:** Khi video tạm dừng (Pause) hoặc khi người dùng chuyển sang tab/ứng dụng khác (`document.hidden`), vòng lặp `requestAnimationFrame` tự động ngừng hoàn toàn, đưa CPU tab về 0% để bảo vệ pin thiết bị.

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy Cục bộ

Ứng dụng được xây dựng theo kiến trúc **Vanilla Modern Web (HTML5, CSS3, ES6+ Javascript)**, không cần cài đặt node_modules phức tạp để chạy.

### 1. Yêu cầu môi trường
- Bất kỳ trình duyệt web hiện đại nào (Chrome, Safari, Firefox, Edge).
- Một máy chủ tĩnh (static server) để tránh lỗi CORS khi tải các tệp dữ liệu JSON/phụ đề.

### 2. Khởi chạy nhanh
```bash
# Clone mã nguồn dự án:
git clone https://github.com/rubegit/french-shadowing-studio.git
cd french-shadowing-studio

# Cách 1: Sử dụng Python (khuyên dùng):
python3 -m http.server 3333

# Cách 2: Sử dụng Node.js (npx serve):
npx serve -p 3333 .
```

Mở trình duyệt và truy cập: **`http://localhost:3333`**

### 3. Cấu hình Supabase (Tùy chọn - Dành cho đồng bộ đám mây)
Nếu bạn muốn tự triển khai máy chủ Supabase riêng:
1. Tạo một dự án mới trên [Supabase](https://supabase.com/).
2. Chạy tệp SQL schema tại [supabase-schema.sql](file:///Users/linhvu/AI%20Project/Shadowing/supabase-schema.sql) trong SQL Editor của Supabase.
3. Điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` vào tệp [supabase-sync.js](file:///Users/linhvu/AI%20Project/Shadowing/supabase-sync.js).

---

## 📂 Cấu trúc Thư mục Dự án

```text
french-shadowing-studio/
├── index.html              # Giao diện chính (SPA), Video Player, Dictation & Logic cốt lõi
├── tcf-exam.js             # Logic tạo đề thi TCF Canada, sinh prompt AI và giao diện thi thử
├── tcf-exam.css            # Bộ giao diện chuẩn cho phòng thi khảo thí TCF Canada
├── vocab-practice.js       # Logic Vocab Practice Hub (Flashcard 3D, QCM, SRS Algorithm)
├── vocab-practice.css      # Bộ giao diện cho trung tâm luyện từ vựng
├── supabase-sync.js        # Module đồng bộ dữ liệu đám mây đa thiết bị
├── supabase-schema.sql     # Cấu trúc bảng dữ liệu Supabase Database
├── catalog.json            # Danh mục dữ liệu video luyện tập trang chủ
├── category.json           # Danh mục phân loại thể loại video
├── videos-data.json        # Metadata thông tin thời lượng và phụ đề của từng video
├── library-index.json      # Chỉ mục thư viện bài học
├── vercel.json             # Cấu hình Cache-Busting và HTTP Security Headers cho Production
├── AGENTS.md               # Quy định quy trình phát triển và tiêu chuẩn mã nguồn
└── README.md               # Tài liệu giới thiệu và hướng dẫn sử dụng toàn diện
```

---

## 🌐 Hướng dẫn Triển khai Production

Dự án tương thích hoàn hảo với mọi nền tảng Hosting tĩnh hiện đại:

- **Vercel (Khuyên dùng):** Đã tích hợp sẵn cấu hình [vercel.json](file:///Users/linhvu/AI%20Project/Shadowing/vercel.json) với header `Cache-Control: public, max-age=0, must-revalidate` giúp triệt tiêu hiện tượng dính cache cũ khi cập nhật code mới.
- **Cloudflare Pages / GitHub Pages:** Kết nối trực tiếp với nhánh `main` của kho chứa Git để tự động phát hành mỗi khi push code.

---

## 🤝 Đóng góp & Giấy phép (License)

Dự án được phát hành theo giấy phép **MIT License**. Mọi ý kiến đóng góp, báo cáo lỗi hoặc đề xuất tính năng mới đều được hoan nghênh thông qua [GitHub Issues](https://github.com/rubegit/french-shadowing-studio/issues) và Pull Requests.

---

*Chúc bạn có những giờ phút luyện tập phản xạ tiếng Pháp thật say mê và đạt kết quả xuất sắc trong kỳ thi TCF Canada!* 🇫🇷🍁
