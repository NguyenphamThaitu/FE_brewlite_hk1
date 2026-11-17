# BrewLite – Release Notes

## v1.1.0 – 17/11/2026

### 1. Tổng quan

Bản phát hành v1.1.0 hoàn thiện các chức năng chính của hệ thống BrewLite sau phiên bản v1.0.0, bao gồm giao diện khách hàng, quản lý đơn hàng, thanh toán mô phỏng, API dành cho nhân viên và quy trình triển khai.

Hệ thống sử dụng Next.js cho frontend, NestJS cho backend và PostgreSQL làm cơ sở dữ liệu.

### 2. Tính năng mới

#### 2.1. Tài khoản và xác thực

- Bổ sung và hoàn thiện chức năng đăng ký, đăng nhập bằng email và mật khẩu.
- Tích hợp xác thực JWT.
- Bổ sung menu tài khoản và xử lý trạng thái đăng nhập.
- Hỗ trợ quay lại luồng đặt hàng sau khi đăng nhập hoặc đăng ký, đồng thời giữ lại giỏ hàng.

#### 2.2. Menu và giao diện

- Bổ sung hình ảnh thương hiệu cho các sản phẩm đồ uống.
- Hoàn thiện trang giới thiệu BrewLite.
- Đồng bộ giao diện đăng nhập và đăng ký theo nhận diện thương hiệu.
- Cải thiện font chữ tiếng Việt và giao diện các thành phần frontend.

#### 2.3. Giỏ hàng và đặt hàng

- Hoàn thiện thao tác thêm, sửa số lượng và xóa sản phẩm trong giỏ hàng.
- Tích hợp frontend với API tạo đơn hàng.
- Backend tự tính tổng tiền đơn hàng và kiểm tra dữ liệu gửi lên.
- Kiểm tra và trừ tồn kho trong giao dịch cơ sở dữ liệu.
- Lưu thông tin tên và giá sản phẩm tại thời điểm đặt hàng để bảo toàn dữ liệu đơn cũ.
- Hoàn thiện trang lịch sử đơn hàng tại `/orders`.

#### 2.4. Thanh toán mô phỏng

- Hỗ trợ thanh toán bằng Ví (`WALLET`) và Thẻ (`CARD`) mô phỏng.
- Cấp số dư ví mặc định 1.000.000 VND cho tài khoản mới.
- Hiển thị số dư ví và chặn thanh toán bằng ví khi số dư không đủ.
- Cải thiện xử lý kết quả thanh toán thẻ mô phỏng: kết quả được quyết định dựa trên số thẻ kiểm thử, không dựa vào hạn thẻ hoặc CVV.
- Hỗ trợ thử thanh toán lại khi giao dịch thất bại.
- Sử dụng `Idempotency-Key` để ngăn xử lý giao dịch trùng lặp.
- Tự động làm rỗng giỏ hàng sau khi thanh toán thành công.

#### 2.5. Lịch sử và theo dõi đơn hàng

- Hoàn thiện trang lịch sử đơn hàng của khách hàng.
- Bổ sung trang chi tiết và theo dõi trạng thái đơn hàng.
- Tự động cập nhật trạng thái đơn bằng cơ chế polling.
- Bổ sung nút theo dõi đơn từ lịch sử đơn hàng và khu vực xác nhận đơn.
- Cho phép khách hàng hủy đơn chưa thanh toán của chính mình theo điều kiện hệ thống.

#### 2.6. Chức năng dành cho nhân viên

- Bổ sung API lấy danh sách đơn hàng dành cho nhân viên.
- Hỗ trợ lọc đơn hàng theo trạng thái.
- Bổ sung API cập nhật trạng thái đơn hàng theo quy trình nghiệp vụ.
- Kiểm tra quyền truy cập và quyền sở hữu đơn hàng khi thực hiện thao tác.

### 3. Cải tiến và sửa lỗi

- Sửa trạng thái modal xác nhận đơn khi thực hiện nhiều lần đặt hàng.
- Cải thiện thông báo và luồng hiển thị khi khách hàng chưa đăng nhập.
- Sửa luồng mở lại checkout sau khi quay về từ trang đăng nhập.
- Bổ sung Header và chức năng hủy đơn tại trang lịch sử đơn hàng.
- Cải thiện hiển thị số dư ví và xử lý thanh toán thiếu tiền.
- Loại bỏ bộ lọc danh mục đồ uống dạng nút không còn cần thiết.
- Loại bỏ các file sao lưu, file debug và import không sử dụng khỏi mã nguồn.

### 4. Backend và dữ liệu

- Cải thiện API xác thực và thông tin tài khoản, bao gồm số dư ví.
- Hoàn thiện xử lý tạo đơn, thanh toán và cập nhật trạng thái đơn hàng.
- Bổ sung kiểm tra quyền sở hữu khi hủy đơn chưa thanh toán.
- Cập nhật schema Prisma và migration cho số dư ví mặc định 1.000.000 VND.
- Bổ sung kiểm thử cho nghiệp vụ tính giá, tồn kho, thanh toán và idempotency.

### 5. Kiểm thử và triển khai

- Bổ sung unit test cho nghiệp vụ tính giá, tồn kho và thanh toán mô phỏng.
- Bổ sung integration test cho luồng tạo đơn, thanh toán và quyền hủy đơn.
- Bổ sung kiểm thử frontend cho xác thực, checkout và theo dõi đơn hàng.
- Báo cáo kiểm thử API ngày 17/11 ghi nhận 47/47 integration test đạt tại commit `0cd0501`.
- Hoàn thiện GitHub Actions CI/CD.
- Bổ sung quy trình build Docker image, đẩy image lên GHCR, triển khai trên Render và smoke test.
- Bổ sung minh chứng kiểm tra triển khai và rollback.
- Cập nhật README, tài liệu triển khai và các file cấu hình môi trường mẫu.

Theo kết quả rà soát ngày 17/11/2026, CI/CD trên nhánh `main` hoạt động thành công; frontend, API và API health check trên môi trường production trả về HTTP 200 tại thời điểm kiểm tra.

### 6. Lưu ý

- Ví và thẻ trong hệ thống là phương thức thanh toán mô phỏng phục vụ học tập và kiểm thử, không phải giao dịch tài chính thực tế.
- Kết quả thanh toán thẻ mô phỏng được quyết định theo số thẻ kiểm thử; hệ thống không sử dụng kiểm tra hạn thẻ và CVV để quyết định kết quả.
- Số dư ví 1.000.000 VND là số dư mô phỏng mặc định cho tài khoản mới.
- Phiên bản này không triển khai thanh toán thật qua các cổng thanh toán bên ngoài.