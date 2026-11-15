# ADR-010: Quản lý cấu hình, health check và logging

- Trạng thái: Accepted
- Ngày: 2026-11-13
- Liên quan: Task 3.1 (logging, health check, quản lý cấu hình), Task 5.2 (`GET /health`), Task 5.3
  (smoke test sau deploy), Task 5.4 (secret không nằm trong repo/log), ADR-002, ADR-007, ADR-008

## Bối cảnh

Đề bài yêu cầu kiến trúc thể hiện cách quản lý cấu hình, health check và logging. API chạy ở ba môi
trường: máy cá nhân (`docker-compose.yml`), CI (GitHub Actions) và production trên Render (ADR-002).
Pipeline CD cần một địa chỉ để kiểm tra sau khi deploy, và secret không được xuất hiện trong repo hay
log CI.

## Quyết định

**Cấu hình qua biến môi trường**

- Mọi cấu hình đọc từ biến môi trường, nạp bằng `ConfigModule.forRoot({ isGlobal: true })`.
- Biến bắt buộc đọc bằng `ConfigService.getOrThrow` (ví dụ `JWT_SECRET`): thiếu thì API không khởi động,
  lỗi lộ ra ngay lúc deploy thay vì khi có người dùng đăng nhập.
- `.env.example` liệt kê đủ tên biến, chỉ chứa giá trị mẫu. Tệp `.env` thật không commit.
- `docker-compose.yml` đặt giá trị mặc định cho môi trường local. Production đặt biến trong phần
  Environment của Render; CI dùng GitHub Secrets.

**Health check**

- `GET /health` chạy `SELECT 1` qua Prisma: thành công trả `200 { status: "ok", db: "up", uptime }`,
  mất kết nối database trả `503 { status: "error", db: "down" }`.
- Cùng một endpoint dùng cho: healthcheck của service `api` trong `docker-compose.yml` (service `web`
  chỉ khởi động khi `api` healthy), Health Check Path của Render, và bước smoke test của pipeline CD
  (ADR-007).

**Logging**

- Dùng `Logger` có sẵn của NestJS, ghi ra stdout/stderr. Docker và Render tự thu log, không ghi file log
  trong container.
- Mỗi class tự đặt tên logger theo tên class, ghi các sự kiện vận hành quan trọng (ví dụ số đơn bị tự
  hủy do quá hạn thanh toán, FR-22) và lỗi chưa xử lý.
- Không ghi mật khẩu, JWT, `JWT_SECRET`, `DATABASE_URL` hay dữ liệu thẻ. Thẻ mô phỏng chỉ lưu 4 số
  cuối (ADR-008).

**Các thiết lập dùng chung khác** (`setup-app.ts`): `helmet` cho header bảo mật, CORS theo
`CORS_ORIGIN`, `ValidationPipe` với `whitelist` và `forbidNonWhitelisted` để chặn trường lạ.

## Hệ quả

- Không cần thêm dịch vụ hay thư viện ngoài. Cấu hình giống nhau giữa local, CI và production, chỉ
  khác giá trị biến.
- Health check có kiểm tra database, nên smoke test sau deploy phát hiện được cả lỗi kết nối database,
  không chỉ việc tiến trình còn chạy hay không.
- Một endpoint dùng chung cho liveness và readiness: database chập chờn có thể khiến nền tảng khởi
  động lại API dù tiến trình vẫn sống.
- Chưa có log theo từng request (method, đường dẫn, mã trạng thái, thời gian xử lý, `requestId`) và
  chưa ghi log dạng JSON, nên khó lần theo một request khi có nhiều người dùng. Hướng mở rộng: thêm
  interceptor ghi log request, chuyển sang logger JSON như `pino`.

## Phương án đã cân nhắc

- **`@nestjs/terminus`**: có sẵn nhiều loại kiểm tra, nhưng hiện chỉ cần kiểm tra database, viết tay
  một controller ngắn là đủ và không thêm phụ thuộc.
- **Tách `/health/live` và `/health/ready`**: đúng hơn về lý thuyết, nhưng Render chỉ cấu hình được một
  Health Check Path cho mỗi service.
- **Winston/pino ghi log JSON ngay từ đầu**: chưa cần ở quy mô một cửa hàng; ghi lại làm hướng mở rộng.
