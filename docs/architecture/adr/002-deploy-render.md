# ADR-002: Triển khai production trên Render

- Trạng thái: Proposed (chờ Thái Tú xác nhận nền tảng deploy)
- Ngày: 2026-11-10
- Liên quan: Task 3.2, Task 5.3, Task 5.4, ADR-007

## Bối cảnh

Task 5.4 yêu cầu URL frontend qua HTTPS, URL API có health check, database production không
public trực tiếp, secret không nằm trong repository. Nhóm cần nền tảng miễn phí, chạy được
container Docker và có cách rollback.

## Quyết định

| Thành phần | Dịch vụ Render | Ghi chú |
|-----------|----------------|---------|
| `apps/web` (Next.js) | Web Service, deploy từ image Docker | HTTPS miễn phí trên `*.onrender.com` |
| `apps/api` (NestJS) | Web Service, deploy từ image Docker | Health check path `/health` |
| PostgreSQL | Render Postgres | API kết nối bằng **Internal URL** (cùng region) |
| Image | GitHub Container Registry (GHCR) | Tag bằng commit SHA (ADR-007) |

- Ứng dụng lắng nghe trên `0.0.0.0` và cổng lấy từ biến `PORT` (Render mặc định `10000`).
- Secret (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`) đặt trong Environment của Render; URL deploy
  hook và token GHCR đặt trong GitHub Secrets.
- Database: xóa IP allow list (`--clear-ip-allow-list`) để tắt hoàn toàn truy cập từ bên ngoài;
  chỉ API trên Render kết nối qua Internal URL.
- Migration: gói miễn phí **không có pre-deploy command** (chỉ có ở gói trả phí), nên container
  API chạy `prisma migrate deploy` trước khi khởi động server. Nếu migration lỗi, server không
  lên, health check không đạt và Render hủy bản deploy, bản cũ vẫn phục vụ.

## Hệ quả

- Deploy không gián đoạn: Render chỉ chuyển traffic khi bản mới qua health check; nếu không đạt
  trong 15 phút thì hủy deploy và giữ bản cũ.
- Rollback: trang Deploys → *Rollback*, hoặc API *Roll back deploy*. Vì image gắn tag SHA cố
  định, rollback lấy đúng image cũ.
- **Hạn chế của gói miễn phí:**
  - Web service ngủ sau 15 phút không có request, khởi động lại mất khoảng 1 phút. Smoke test và
    buổi demo cần gọi `/health` trước để "đánh thức" dịch vụ.
  - Render Postgres miễn phí **hết hạn sau 30 ngày** kể từ khi tạo (thêm 14 ngày ân hạn), giới
    hạn 1 GB, không có backup. Phải tạo database sao cho còn hiệu lực đến ngày chấm, hoặc nâng
    cấp; seed phải tái tạo được dữ liệu.
  - Rollback trên gói miễn phí chỉ về được 2 bản deploy gần nhất.

## Phương án đã cân nhắc

- **Vercel (web) + Render/Railway (API):** Vercel phục vụ Next.js qua CDN tốt hơn nhưng chia hai
  nền tảng, hai nơi quản lý secret, deployment diagram phức tạp hơn.
- **Railway, Fly.io:** chạy container tốt nhưng gói miễn phí giới hạn theo credit, dễ hết giữa kỳ.
- **VPS tự quản:** chủ động hoàn toàn nhưng phải tự lo HTTPS, bảo mật, sao lưu.

Nguồn: tài liệu Render – Free instances, Deploying an image, Deploy hooks, Health checks,
Deploys, Connecting to Postgres, Rollbacks, Web services (render.com/docs, tra cứu 2026-11-10).
