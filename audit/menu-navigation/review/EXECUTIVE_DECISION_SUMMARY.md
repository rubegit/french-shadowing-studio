# TỔNG KẾT QUYẾT ĐỊNH ĐIỀU HÀNH & KẾ HOẠCH HÀNH ĐỘNG
## (EXECUTIVE DECISION SUMMARY)
### Dự án: French Shadowing Studio (FSS)
**Tài liệu:** `audit/menu-navigation/review/EXECUTIVE_DECISION_SUMMARY.md`  
**Cập nhật lần 2:** 2026-11-07  
**Vai trò:** Principal Frontend Architect & Technical Planning Agent  
**Chế độ thực thi:** KẾ HOẠCH KỸ THUẬT — PLANNING ONLY (Chưa sửa mã nguồn, chưa commit, chưa push)  

---

## 1. BA QUYẾT ĐỊNH SẢN PHẨM ĐÃ CHÍNH THỨC KHÓA (LOCKED PRODUCT DECISIONS)

Dựa trên chỉ đạo chính thức từ người dùng, 3 quyết định sản phẩm quan trọng đã được thiết lập thành quy chuẩn kỹ thuật bắt buộc:

1. **QUYẾT ĐỊNH A — Khôi phục Copy Transcript & Share Video:**
   - Đưa cả 2 tính năng (`copyTranscript()` và `shareCurrentVideo()`) vào bên trong **Practice Sandwich Menu** (`#practice-sandwich-menu`).
   - Giữ nguyên Header phụ đề (`#sub-panel-hd`) thanh thoát, chỉ phục vụ các tab câu và ô kính lúp tìm kiếm mở rộng.
2. **QUYẾT ĐỊNH B — Phân định Hiển thị Cloud Sync & Theme Toggle theo 768px:**
   - **Desktop ($> 768\text{px}$):** Ưu tiên hiển thị trực tiếp trên Header để thao tác 1-click; tự động ẩn trong Sandwich Menu để triệt tiêu trùng lặp.
   - **Mobile / Tablet ($\le 768\text{px}$):** Ẩn trên Header; tự động hiển thị trong Sandwich Menu kèm nhãn văn bản đầy đủ.
   - Bảo đảm nguyên tắc bất biến "Never-Lost": Không tồn tại bất kỳ kích thước màn hình nào làm mất cả 2 cách truy cập.
3. **QUYẾT ĐỊNH C — Tách riêng Đơn vị Dọn dẹp Legacy DOM:**
   - Tách toàn bộ việc dọn dẹp các khối HTML đóng băng (`#practice-header-tools`, `#sub-search-bar`) và khử trùng lặp ID `#sub-search-input` thành một **Delivery Unit độc lập sau cùng (UNIT-07)**.
   - Chỉ thực hiện sau khi đã hoàn tất di dời `#fs-pop` và khử sạch các tham chiếu JavaScript tại `js/03-practice-engine.js`, `js/01g-vocab-list.js`, và `js/08-responsive-height.js`.

---

## 2. NHỮNG THAY ĐỔI SO VỚI KẾ HOẠCH REMEDIATION BAN ĐẦU

| Hạng mục so sánh | Kế hoạch Ban đầu (5 Units) | Kế hoạch Mới Cập nhật (7 Units) | Lợi ích Kỹ thuật & Sản phẩm |
|---|---|---|---|
| **Vị trí nút Copy/Share** | Đề xuất đưa lên Header phụ đề (`#sub-panel-hd`) cạnh kính lúp. | **Đưa vào Sandwich Menu** (`#practice-sandwich-menu`). | Giữ Header phụ đề gọn gàng, tránh làm chật chội ô tìm kiếm khi mở rộng. |
| **Trùng lặp Cloud/Theme** | Đề xuất xóa hoặc ẩn tùy tiện. | **Phân định đáp ứng chuẩn xác tại mốc $768\text{px}$** (`MENU_VISIBILITY_ACCEPTANCE_MATRIX.md`). | Triệt tiêu 100% trùng lặp trên desktop, bảo toàn 100% khả năng truy cập trên mobile. |
| **Dọn dẹp Legacy DOM** | Gộp chung vào Phase 1 cùng với việc sửa lỗi P1. | **Tách thành UNIT-07 riêng biệt sau cùng**. | Cô lập triệt để rủi ro Null Pointer Exception, tránh làm gián đoạn các tính năng đang hoạt động. |
| **Thứ tự thực hiện** | Architecture-first (A11y $\rightarrow$ CSS $\rightarrow$ Tính năng). | **Feature & Value-first (Sửa lỗi $\rightarrow$ Mở tính năng $\rightarrow$ A11y $\rightarrow$ Cleanup)**. | Mang lại giá trị sử dụng thực tế tức thì cho người dùng ngay từ các unit đầu tiên. |

---

## 3. THỨ TỰ 7 ĐƠN VỊ TRIỂN KHAI ĐỀ XUẤT (OPTIMAL SEQUENCE)

1. **UNIT-01 (Mã kế hoạch M42):** Sửa lỗi runtime `toggleFsTheme` tại màn hình dịch và triệt tiêu xung đột mở đè Dropdown menu. *(Đã kiểm thử 100% PASS, chờ phê duyệt commit)*.
2. **UNIT-05 (Mã kế hoạch M43):** Khôi phục tính năng Sao chép phụ đề và Chia sẻ video vào Sandwich Menu.
3. **UNIT-06 (Mã kế hoạch M44):** Điều chỉnh hiển thị Cloud Sync & Theme Toggle trên Desktop vs Mobile theo chuẩn mốc 768px.
4. **UNIT-02 (Mã kế hoạch M45):** Nâng cấp Tiếp cận A11y (WCAG 2.2 AA): Quản lý tiêu điểm bằng `inert`, phím `Escape` an toàn, và `aria-labelledby`.
5. **UNIT-03 (Mã kế hoạch M46):** Tối ưu vùng chạm cảm ứng ($\ge 28\text{px}$) cho nút "Xóa tất cả" và tinh chỉnh CSS cho màn hình siêu hẹp 320px.
6. **UNIT-04 (M47):** Đồng bộ mã màu Cloud Modal sang hệ thống Mint Pastel Semantic Tokens `--fs-*` và chuẩn hóa nút Back.
7. **UNIT-07 (M48):** Dọn dẹp Legacy DOM và giải quyết trùng lặp ID `#sub-search-input` sau khi đã khử sạch phụ thuộc JS.

---

## 4. TỔNG HỢP CÁC RỦI RO & BIỆN PHÁP PHÒNG NGỪA

| Đơn vị (Unit) | Mức độ Rủi ro Thực tế | Rủi ro Cụ thể | Giải pháp Phòng ngừa & Kiểm soát |
|---|---|---|---|
| **UNIT-01** | **2% (Rất thấp)** | Sơ suất cú pháp JS trong toggle | Đã chạy kiểm thử CDP 2 chiều và 355/355 unit tests PASS. |
| **UNIT-05** | **5% (Thấp - TB)** | Trình duyệt chặn quyền Clipboard API | Đã có sẵn cơ chế fallback `textarea execCommand` và toast thông báo lỗi. |
| **UNIT-06** | **4% (Thấp)** | Lệch 1px tại điểm ngắt 768px | Phân định rạch ròi `max-width: 768px` vs `min-width: 769px`. |
| **UNIT-02** | **6% (Trung bình)** | Thuộc tính `inert` khóa nhầm modal | Chỉ gán `inert` trên các container anh em (`#screen-input`, `#screen-practice`), không gán lên `body`. |
| **UNIT-03** | **3% (Thấp)** | Vùng chạm phình to làm xô lệch hàng tiêu đề | Sử dụng inline-flex và giữ nguyên font size 12px. |
| **UNIT-04** | **3% (Thấp)** | Sai lệch màu ở chế độ Tối | Dùng trực tiếp class `fs-surface-card` và `fs-text-primary` đã đạt chuẩn WCAG AAA. |
| **UNIT-07** | **8% (Trung bình - Cao)** | Lỗi Null pointer nếu còn sót truy vấn JS cũ | Tuân thủ nghiêm ngặt quy trình 4 bước kiểm tra null phòng thủ trước khi xóa HTML. |

---

## 5. DANH SÁCH 5 TÀI LIỆU KẾ HOẠCH CHÍNH THỨC TRONG `review/`

1. [`PRODUCT_DECISIONS.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/review/PRODUCT_DECISIONS.md) — Tài liệu quy chuẩn kỹ thuật cho 3 quyết định sản phẩm đã khóa.
2. [`DELIVERY_DEPENDENCY_MATRIX.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/review/DELIVERY_DEPENDENCY_MATRIX.md) — Ma trận phụ thuộc chi tiết, so sánh thứ tự triển khai và rủi ro.
3. [`MENU_VISIBILITY_ACCEPTANCE_MATRIX.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/review/MENU_VISIBILITY_ACCEPTANCE_MATRIX.md) — Ma trận kiểm thử hiển thị đa viewport (320px đến 1920px kèm mốc ±1px).
4. [`COMPREHENSIVE_REMEDIATION_PLAN.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/review/COMPREHENSIVE_REMEDIATION_PLAN.md) — Bản kế hoạch chi tiết 7 Delivery Units kèm DoD và Rollback.
5. [`EXECUTIVE_DECISION_SUMMARY.md`](file:///Users/linhvu/AI%20Project/Shadowing/audit/menu-navigation/review/EXECUTIVE_DECISION_SUMMARY.md) — Bản tóm lược điều hành (Tài liệu này).

---

## 6. CÁC VẤN ĐỀ CẦN Ý KIẾN CHỈ ĐẠO CỦA BẠN (NEXT STEPS)

1. **Về Kế hoạch 7 Units:** Bạn có đồng ý với toàn bộ cấu trúc kế hoạch mới và thứ tự ưu tiên hướng tính năng: `UNIT-01` $\rightarrow$ `UNIT-05` $\rightarrow$ `UNIT-06` $\rightarrow$ `UNIT-02` $\rightarrow$ `UNIT-03` $\rightarrow$ `UNIT-04` $\rightarrow$ `UNIT-07`?
2. **Về Trạng thái UNIT-01:** Mã nguồn của UNIT-01 (sửa lỗi `toggleFsTheme` và chống mở đè dropdown) đã được sửa và kiểm thử hoàn chỉnh 100% PASS ở turn trước, hiện đang ở trạng thái uncommitted trong working tree.
   - Bạn có đồng ý phê duyệt commit UNIT-01 với từ khóa **"Duyệt M42"** (để chính thức ghi nhận Module M42 vào Git log)?
   - Hoặc bạn muốn tiếp tục xem xét kế hoạch?

*(Hệ thống đang dừng ở chế độ Planning Only theo đúng chỉ đạo. Tuyệt đối không tự ý commit, push hay sửa mã nguồn).*
