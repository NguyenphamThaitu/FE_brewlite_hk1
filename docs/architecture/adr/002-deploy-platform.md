# ADR-002: Chọn Render làm nền tảng triển khai

- Trạng thái: Đã chấp nhận
- Ngày: 2026-11-10
- Người quyết định: Nguyễn Phạm Thái Tú (nhóm trưởng)

## Bối cảnh
Nhóm 6 sinh viên, không có ngân sách, hạn nộp sau khoảng 2 ngày. Cần URL
frontend HTTPS, URL API có /health, PostgreSQL không public, deploy được từ
GitHub Actions bằng secret.

## Các lựa chọn đã xem xét
| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| Render | Có gói free cho web service và PostgreSQL, không cần thẻ, kết nối GitHub dễ, HTTPS tự động | Service free ngủ sau 15 phút, DB free có thời hạn |
| Railway | Dễ dùng | Chỉ có credit dùng thử, dễ hết giữa chừng |
| Fly.io | Linh hoạt | Cấu hình phức tạp, tốn thời gian |
| Azure / AWS | Mạnh | Phức tạp, dễ phát sinh phí ngoài ý muốn |
| VPS | Toàn quyền | Phải tự cài và bảo mật, tốn thời gian nhất |

## Quyết định
Dùng Render cho cả frontend (Next.js), backend (NestJS, chạy bằng Docker
image) và PostgreSQL.

## Hệ quả
- Tích cực: triển khai nhanh, đúng ngân sách 0 đồng, có HTTPS sẵn.
- Tiêu cực: cold start khoảng 1 phút; DB free có hạn dùng.
- Giảm thiểu: mở web trước khi chấm hoặc quay video; có migration và seed
  để tái tạo DB; DB dùng đường dẫn nội bộ, không mở public; secret để
  trong biến môi trường của Render và GitHub Secrets.