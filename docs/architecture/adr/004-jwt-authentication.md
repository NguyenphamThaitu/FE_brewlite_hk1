# ADR-004: Xác thực stateless bằng JWT, phân quyền theo role

- Trạng thái: Accepted
- Ngày: 2026-11-10
- Liên quan: FR-14 → FR-18, NFR-04, NFR-05, UC-05, UC-06, UC-11

## Bối cảnh

Khách phải đăng nhập trước khi đặt đơn, thanh toán, xem lịch sử; nhân viên cần quyền riêng để
cập nhật trạng thái pha chế. Frontend và API chạy trên hai domain khác nhau trên Render, API cần
chạy được nhiều instance mà không chia sẻ session.

## Quyết định

- `POST /auth/register`, `POST /auth/login` trả `accessToken` (JWT) và thông tin người dùng công khai;
  `GET /auth/me` trả người dùng hiện tại.
- Token ký bằng `JWT_SECRET`, hạn dùng lấy từ `JWT_EXPIRES_IN` (mặc định `1d`). Payload: `sub`
  (userId), `email`, `role`.
- Mật khẩu băm bằng **bcrypt** (`bcryptjs`, cost 10); không bao giờ trả `passwordHash`. Email chuẩn
  hóa về chữ thường.
- `@nestjs/passport` + `passport-jwt`: `JwtAuthGuard` bảo vệ `/orders`, `POST /payments/vnpay`,
  `/auth/me`. `RolesGuard` + `@Roles(Role.STAFF)` bảo vệ `PATCH /orders/:id/status`.
- `userId` luôn lấy từ token, không lấy từ body. Khách chỉ xem/hủy đơn của mình (403 nếu không phải
  chủ đơn) và chỉ tạo thanh toán cho đơn của mình (404, không tiết lộ đơn tồn tại); `STAFF` xem được
  mọi đơn.
- Client gửi token qua header `Authorization: Bearer <token>`.

## Hệ quả

- API không lưu session, dễ chạy nhiều instance.
- Không thu hồi được token trước khi hết hạn; chấp nhận trong phạm vi MVP (không có refresh token,
  đăng xuất chỉ xóa token phía client).
- Token lưu phía trình duyệt nên frontend phải tránh chèn HTML không kiểm soát (XSS). API đã bật
  `helmet` để thêm các header bảo mật.
- `JWT_SECRET` là secret: chỉ nằm trong biến môi trường của nền tảng và GitHub Secrets.
- Tài khoản `STAFF` được tạo bằng seed (mật khẩu lấy từ `STAFF_PASSWORD`); không có API đăng ký
  `STAFF`.

## Phương án đã cân nhắc

- **Session + cookie:** thu hồi dễ nhưng cần kho session dùng chung và xử lý cookie cross-site.
- **Dịch vụ ngoài (Auth0, Clerk):** nhanh nhưng phụ thuộc bên thứ ba, không thể hiện phần tự hiện
  thực mà đề bài yêu cầu.
