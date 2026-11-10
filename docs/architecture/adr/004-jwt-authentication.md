# ADR-004: Xác thực stateless bằng JWT

- Trạng thái: Accepted
- Ngày: 2026-11-10
- Liên quan: FR-04, FR-05, FR-07, NFR bảo mật

## Bối cảnh

Khách hàng phải đăng nhập trước khi đặt đơn, thanh toán, xem lịch sử. Frontend và API chạy trên
hai domain khác nhau trên Render; API cần mở rộng nhiều instance mà không chia sẻ session.

## Quyết định

- `POST /auth/register`, `POST /auth/login` trả về access token JWT (HS256) ký bằng `JWT_SECRET`.
- Payload tối thiểu: `sub` (userId), `email`, `role`. Hạn dùng 24 giờ.
- Mật khẩu băm bằng **bcrypt** (cost 10); không bao giờ trả `passwordHash` trong response.
- NestJS dùng `@nestjs/passport` + `passport-jwt`: `JwtAuthGuard` bảo vệ `/orders`, `/payments`;
  `RolesGuard` cho route dành cho `STAFF`/`ADMIN`.
- Client gửi token qua header `Authorization: Bearer <token>`.
- `userId` luôn lấy từ token, không lấy từ body, để khách không đọc/sửa đơn của người khác.

## Hệ quả

- API không lưu session, dễ chạy nhiều instance.
- Không thu hồi được token trước khi hết hạn; chấp nhận được trong phạm vi MVP (không có
  refresh token, đăng xuất chỉ xóa token phía client).
- Token lưu phía trình duyệt nên frontend phải tránh chèn HTML không kiểm soát (XSS).
- `JWT_SECRET` là secret: chỉ nằm trong biến môi trường của Render và GitHub Secrets.

## Phương án đã cân nhắc

- **Session + cookie:** thu hồi dễ nhưng cần kho session dùng chung và xử lý cookie cross-site.
- **Dịch vụ ngoài (Auth0, Clerk):** nhanh nhưng phụ thuộc bên thứ ba, không thể hiện phần tự
  hiện thực mà đề bài yêu cầu.
