# 🇫🇷 French Shadowing Studio

> Ứng dụng luyện tập Shadowing và Chép chính tả (Dictation) chuyên sâu cho người học tiếng Pháp với phụ đề song ngữ Pháp - Việt trên nền video YouTube.

---

## ✨ Tính năng nổi bật

- **Luyện tập Shadowing chuẩn Pháp**: Đồng bộ phụ đề theo từng từ (Word-level timestamps), hiệu ứng karaoke mượt mà, lặp lại từng câu, chỉnh tốc độ phát linh hoạt (0.5x, 0.75x, 1x, 1.25x...).
- **Thu âm giọng nói & Tự so sánh (`MediaRecorder`)**: Ghi âm giọng của bạn trực tiếp qua micro và phát lại để so sánh với phát âm của người bản xứ.
- **Luyện Chép chính tả (Dictation)**:
  - Nghe từng câu và gõ lại.
  - Tự động so sánh lỗi chính tả (Levenshtein distance), nhận diện từ nói tắt / khẩu ngữ tiếng Pháp (*t'as, chuis, chais pas, y a, ptit, msieur...*).
  - Chấm điểm độ chính xác %, hiển thị chi tiết từ đúng, từ gần đúng (sai dấu), từ thiếu, từ thừa.
- **Tra cứu từ vựng & Phiên âm IPA tiếng Pháp**:
  - Bôi đen bất kỳ từ hoặc cụm từ nào để tra cứu nghĩa theo ngữ cảnh với Google AI Mode.
  - Mở trực tiếp trang từ điển chuẩn **Larousse** (`https://www.larousse.fr/`).
  - Hỗ trợ đưa từ về dạng nguyên thể (Lemmatization) và bảng phiên âm quốc tế IPA tiếng Pháp.
- **Web Speech API (TTS)**: Giọng đọc nhân tạo tiếng Pháp chuẩn (`fr-FR`) tích hợp sẵn trên trình duyệt.
- **Sổ từ vựng thông minh (SRS Flashcard)**: Lưu từ vựng kèm ngữ cảnh video và ôn tập theo thuật toán lặp lại ngắt quãng (Spaced Repetition).
- **Trình đọc sách / Bài báo song ngữ**: Tách câu tự động, đọc từng câu và dịch song ngữ.

---

## 🚀 Khởi chạy cục bộ (Local Development)

Vì ứng dụng tải dữ liệu phụ đề và từ điển qua `fetch()` nội bộ, vui lòng chạy qua một máy chủ tĩnh (static web server):

```bash
# Dùng npx serve:
npx serve .

# Hoặc dùng Python:
python3 -m http.server 8000
```

Mở trình duyệt tại: `http://localhost:8000` (hoặc cổng mà server hiển thị).

---

## 📂 Cấu trúc thư mục

```
.
├── index.html            # Mã nguồn chính của ứng dụng (SPA)
├── assets/
│   └── french-ipa.txt    # Từ điển phiên âm IPA tiếng Pháp
├── subs/                 # Thư mục chứa phụ đề (.fr.srt, .json3) và bản dịch (_vi.txt)
│   ├── sample_fr.fr.srt
│   └── sample_fr_vi.txt
├── catalog.json          # Danh mục video tiếng Pháp trang chủ
├── category.json         # Cấu trúc thể loại video
├── videos-data.json      # Metadata các video
├── library-index.json    # Chỉ mục thư viện video
└── README.md
```

---

## 🌐 Triển khai (Deployment)

Dự án tương thích 100% với các nền tảng Static Hosting:
- **Vercel**
- **Cloudflare Pages**
- **GitHub Pages**
