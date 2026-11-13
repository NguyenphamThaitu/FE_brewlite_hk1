# ADR-001: Nền tảng triển khai Production – Render

- **Trạng thái:** Đã được chấp thuận là nền tảng mục tiêu do nhóm lựa chọn; việc cung cấp (provisioning) hạ tầng vẫn đang chờ xác minh.
- **Ngày:** 2026-11-13
- **Người ra quyết định:** Nhóm dự án

## Bối cảnh

BrewLite gồm frontend Next.js, API NestJS và cơ sở dữ liệu PostgreSQL. Repository đã có sẵn các Dockerfile cho ứng dụng web và API, cùng định nghĩa Docker Compose cho môi trường local. Assignment 2 Task 3.2 yêu cầu sơ đồ triển khai production phải xác định được thiết bị client, dịch vụ phục vụ frontend/CDN, môi trường chạy API, PostgreSQL với lưu trữ bền vững, container registry và nền tảng triển khai.

## Quyết định

Sử dụng Render làm nền tảng triển khai production:
- Triển khai Next.js dưới dạng Render Web Service từ Dockerfile của web hiện có.
- Triển khai NestJS dưới dạng Render Web Service từ Dockerfile của API hiện có.
- Dùng Render Managed PostgreSQL để lưu trữ dữ liệu quan hệ bền vững.
- Dùng GitHub Container Registry (GHCR) làm registry lưu image được đề xuất, với điều kiện triển khai workflow GitHub Actions để publish image và cấu hình triển khai image trên Render.

## Hệ quả

### Tích cực
- Frontend và API có thể được triển khai thành các dịch vụ tách biệt.
- Cơ sở dữ liệu được quản lý độc lập với các container ứng dụng.
- Các Dockerfile hiện có là điểm khởi đầu cho việc triển khai dựa trên container.
- API đã hỗ trợ `PORT` do nền tảng cung cấp và có endpoint `/health` kiểm tra được trạng thái cơ sở dữ liệu.

### Công việc tiếp theo bắt buộc
- Thêm và kiểm thử workflow CI build và push các image có đánh phiên bản lên GHCR, nếu nhóm giữ cách tiếp cận dùng registry.
- Cấu hình các dịch vụ Render, biến môi trường, health check, mạng và PostgreSQL được quản lý.
- Cấu hình URL API cho frontend tại thời điểm build và CORS origin cho API.
- Dùng secret production và tắt việc seed dữ liệu phát triển/thông tin đăng nhập mặc định.
- Xác minh việc sao lưu cơ sở dữ liệu và thực hiện smoke test trên production.

## Các phương án đã cân nhắc

- **Render build trực tiếp từ Git:** đơn giản hơn và không cần duy trì workflow publish image riêng. Nếu chọn phương án này, cần loại bỏ GHCR khỏi sơ đồ triển khai cuối cùng.
- **Vercel cho frontend cộng Render cho API/cơ sở dữ liệu:** không được chọn vì nhóm đã chọn Render làm nền tảng production cho assignment này.
