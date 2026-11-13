# ADR-001: Dùng monorepo cho frontend, backend và tài liệu

- Trạng thái: Accepted
- Ngày: 2026-11-10
- Liên quan: Task 4.1, NFR khả năng triển khai

## Bối cảnh

Đề bài yêu cầu cấu trúc `apps/web`, `apps/api`, `docs`, `tests`, `.github/workflows` trong một
repository, và mọi thay đổi yêu cầu, sơ đồ, mã nguồn phải truy vết được qua commit/PR. Nhóm 6
người cùng sửa frontend, backend và tài liệu trong cùng Sprint.

## Quyết định

Dùng một repository duy nhất (monorepo):

- `apps/web`: Next.js (TypeScript), mobile-first. Không làm PWA, xem [ADR-009](009-web-mobile-first-without-pwa.md).
- `apps/api`: NestJS (TypeScript), Prisma, PostgreSQL.
- `docs/`: yêu cầu, sơ đồ, kiến trúc, ma trận truy vết, hướng dẫn deploy.
- `tests/`: integration và end-to-end test chạy trên cả hệ thống.
- Mỗi app có `package.json`, `Dockerfile` riêng; `docker-compose.yml` ở gốc chạy `db`, `api`, `web`.
- CI chạy job riêng cho từng app: job `api` (PR #4) và job `web` (PR #21).

## Hệ quả

- Một PR có thể cập nhật đồng thời API, giao diện, tài liệu và ma trận truy vết.
- Một pipeline CI/CD duy nhất, dễ đặt branch protection cho `main`.
- Phiên bản phát hành (tag) áp dụng cho cả hệ thống, release notes đầy đủ.
- Hạn chế: CI phải lọc đường dẫn (`paths`) hoặc chạy cả hai app; dễ conflict khi nhiều người sửa
  cùng tệp tài liệu, nên chia tài liệu thành nhiều tệp nhỏ.

## Phương án đã cân nhắc

- **Hai repository riêng (frontend/backend):** tách quyền dễ hơn nhưng trái cấu trúc đề bài,
  khó truy vết yêu cầu sang mã nguồn và phải đồng bộ phiên bản giữa hai repo.
- **Công cụ monorepo (Nx, Turborepo):** tăng tốc build nhưng thêm độ phức tạp cấu hình, chưa cần
  với quy mô 2 app.
