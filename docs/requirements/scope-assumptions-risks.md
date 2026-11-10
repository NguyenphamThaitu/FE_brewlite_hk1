# BrewLite – Phạm vi, giả định, ràng buộc, rủi ro

## 1. Phạm vi

### 1.1 In-scope (MVP)
- Xem menu đồ uống, xem chi tiết sản phẩm (size, topping)
- Giỏ hàng và tính tổng tiền
- Đăng ký, đăng nhập, xác thực JWT
- Tạo đơn hàng, thanh toán mô phỏng (Ví / Thẻ)
- Xem xác nhận đơn, trạng thái đơn, lịch sử đơn của khách
- Nhân viên/quản lý cập nhật trạng thái đơn
- Validate dữ liệu ở cả frontend và backend
- Triển khai thực tế: URL frontend HTTPS, URL API, `GET /health`

### 1.2 Phạm vi mở rộng (làm nếu còn thời gian)
- Khuyến mãi (Promotion) và tích điểm (LoyaltyTransaction): có trong class diagram, code ở mức cơ bản
- Quản lý menu cho quản lý cửa hàng (thêm/sửa/xóa sản phẩm)
- Thông báo trạng thái đơn theo thời gian thực

### 1.3 Out-of-scope
- **Ứng dụng mobile native và PWA**: bỏ theo yêu cầu giảng viên, chỉ làm web (bằng chứng xác nhận lưu trong repo)
- Thanh toán thật qua cổng thanh toán (chỉ mô phỏng)
- Giao hàng, theo dõi shipper, bản đồ
- Quản lý kho nâng cao, báo cáo doanh thu
- Đa ngôn ngữ, đa chi nhánh

## 2. Giả định
- Giảng viên xác nhận chỉ cần ứng dụng web (không mobile/PWA)
- Thanh toán là dịch vụ mô phỏng, luôn phản hồi trong thời gian ngắn và có thể giả lập thành công/thất bại
- Mỗi đơn hàng thuộc về một khách đã đăng nhập
- Chỉ một cửa hàng, một loại tiền tệ (VND)
- Nền tảng deploy miễn phí đủ cho nhu cầu demo và chấm bài
- Người dùng truy cập bằng trình duyệt hiện đại (Chrome, Edge, Firefox bản mới)

## 3. Ràng buộc
- **Thời gian**: hoàn thành từ Thứ 2 đến sáng Thứ 4 (khoảng 2 ngày), nhóm 6 người
- **Ngân sách**: không có kinh phí, chỉ dùng gói miễn phí
- **Công nghệ bắt buộc**: Next.js (frontend), NestJS (backend), PostgreSQL, Docker, GitHub Actions
- **Quy trình**: làm theo thứ tự Task 1 → 5, mọi tài liệu có commit/PR rõ ràng, PR phải qua CI mới merge
- **Bảo mật**: không commit secret vào repo, DB không public

## 4. Rủi ro ban đầu

| Mã | Rủi ro | Khả năng | Ảnh hưởng | Cách giảm thiểu |
|---|---|---|---|---|
| R1 | Không đủ thời gian hoàn thành hết | Cao | Cao | Làm song song, ưu tiên MoSCoW, cắt tính năng Could |
| R2 | Deploy lỗi vào phút cuối (biến môi trường, CORS, DB) | Cao | Cao | Deploy bản trống ngay ngày đầu, deploy nhiều lần |
| R3 | Gói miễn phí giới hạn: dịch vụ ngủ khi không có truy cập, DB free có thể bị xóa | Trung bình | Cao | Kiểm tra chính sách trước khi chốt, mở web trước khi chấm, có script seed tái tạo DB |
| R4 | Xung đột code khi 6 người cùng commit | Trung bình | Trung bình | Mỗi người một nhánh, PR nhỏ, review chéo |
| R5 | Tài liệu mâu thuẫn với code | Trung bình | Trung bình | Kiểm tra nhất quán 3 sơ đồ, cập nhật traceability dần |
| R6 | Giảng viên chưa xác nhận việc bỏ mobile/PWA | Thấp | Cao | Nhắn xác nhận sớm, lưu bằng chứng |
| R7 | Lộ secret vào repo hoặc log CI | Thấp | Cao | `.gitignore` chặn `.env`, dùng GitHub Secrets |
| R8 | Thành viên vắng hoặc kẹt việc | Trung bình | Cao | Mỗi việc có người review biết nội dung, có người dự phòng |