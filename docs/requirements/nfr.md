# BrewLite – Yêu cầu phi chức năng (NFR)

Ưu tiên theo MoSCoW: M = Must, S = Should, C = Could.

| Mã | Nhóm | Yêu cầu | Ưu tiên | Tiêu chí chấp nhận (kiểm chứng được) |
|---|---|---|---|---|
| NFR-01 | Hiệu năng | Các API đọc dữ liệu (`GET /products`, `GET /products/:id`) phản hồi nhanh | M | 95% request có thời gian phản hồi dưới 500 ms với 50 sản phẩm seed, đo bằng log hoặc công cụ test |
| NFR-02 | Hiệu năng | Trang menu tải nhanh | S | Trang menu hiển thị nội dung dưới 3 giây trên mạng thông thường (kiểm tra bằng Lighthouse hoặc DevTools) |
| NFR-03 | Bảo mật | Mật khẩu được băm, không lưu dạng rõ | M | Cột mật khẩu trong DB là chuỗi băm (bcrypt/argon2), kiểm tra bằng xem DB và unit test |
| NFR-04 | Bảo mật | API nhạy cảm yêu cầu JWT hợp lệ | M | Gọi API tạo đơn/lịch sử đơn không có token hoặc token sai trả về 401; có test tự động |
| NFR-05 | Bảo mật | Validate đầu vào ở backend, chống dữ liệu sai | M | Dữ liệu sai định dạng trả về 400 kèm thông báo lỗi; có test cho các trường hợp sai |
| NFR-06 | Bảo mật | Secret không nằm trong repo hay log CI | M | Quét repo không thấy secret; `.env` nằm trong `.gitignore`; secret lưu trong GitHub Secrets / biến môi trường nền tảng |
| NFR-07 | Bảo mật | Giao tiếp qua HTTPS, DB không public | M | URL production dùng `https://`; kết nối DB từ ngoài internet bị từ chối |
| NFR-08 | Khả dụng | Có endpoint kiểm tra sức khỏe | M | `GET /health` trả về 200 khi API và DB hoạt động, dùng cho smoke test |
| NFR-09 | Khả dụng | Hệ thống thông báo lỗi rõ ràng, không treo | S | Giao diện có trạng thái loading, empty, error; lỗi API hiển thị thông báo dễ hiểu |
| NFR-10 | Khả dụng | Giao diện dùng được trên các cỡ màn hình phổ biến | C | Menu và giỏ hàng hiển thị đúng ở chiều rộng 360 px đến 1440 px (web responsive, không phải mobile app) |
| NFR-11 | Khả năng triển khai | Chạy toàn bộ hệ thống ở local bằng một lệnh | M | `docker compose up` chạy được web + API + DB; README có hướng dẫn |
| NFR-12 | Khả năng triển khai | CI chạy tự động khi mở PR | M | PR chạy Install → Lint → Test → Build; PR fail không merge được |
| NFR-13 | Khả năng triển khai | CD tự động khi push/tag, có rollback | M | Push/tag kích hoạt build image, deploy, smoke test; có hướng dẫn rollback trong `docs/deployment.md` |
| NFR-14 | Khả năng triển khai | Database tái tạo được | M | Migration và seed chạy trên DB trống tạo lại đầy đủ dữ liệu mẫu |
| NFR-15 | Bảo trì | Mã nguồn có test và lint | S | Có unit test cho nghiệp vụ chính; lint không có lỗi trong CI |
| NFR-16 | Độ tin cậy | Tạo đơn và trừ tồn kho là một giao dịch | M | Khi một bước lỗi thì toàn bộ rollback; có integration test kiểm tra không còn đơn dở dang |
| NFR-17 | Độ tin cậy | Thanh toán không bị trừ hai lần khi gửi lặp | S | Gửi cùng một yêu cầu thanh toán 2 lần (cùng idempotency key) chỉ tạo một giao dịch; có test |