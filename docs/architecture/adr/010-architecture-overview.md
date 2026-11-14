# BrewLite – Tổng quan kiến trúc

## 1. Mục đích và phạm vi

Tài liệu này mô tả kiến trúc ứng dụng ở mức logic và mục tiêu triển khai production được đề xuất cho BrewLite. Tài liệu phân biệt giữa phần đã được triển khai và xác minh trong repository với hạ tầng production vẫn cần được cấu hình.

## 2. Các thành phần ứng dụng đã xác minh trong repository

| Thành phần | Trách nhiệm | Bằng chứng trong mã nguồn |
|---|---|---|
| Web frontend | Cung cấp giao diện cho khách hàng/nhân viên bằng Next.js | `apps/web/package.json`, `apps/web/src/`, `apps/web/Dockerfile` |
| API backend | Cung cấp các API của ứng dụng bằng NestJS | `apps/api/package.json`, `apps/api/src/`, `apps/api/Dockerfile` |
| Tầng lưu trữ dữ liệu | Lưu người dùng, sản phẩm, nguyên liệu, đơn hàng và thanh toán trong PostgreSQL thông qua Prisma | `apps/api/prisma/schema.prisma` |
| Endpoint kiểm tra sức khỏe của API | Báo cáo tình trạng của API và cơ sở dữ liệu | `apps/api/src/health/health.controller.ts` |
| Khởi động và cấu hình API | Cấu hình middleware/CORS, chỉ seed dữ liệu khi được bật, và lắng nghe trên `PORT` (mặc định 3001) | `apps/api/src/main.ts`, `apps/api/src/setup-app.ts` |
| Đóng gói container cho môi trường local | Chạy PostgreSQL, API và tùy chọn container web để kiểm thử local/container | `docker-compose.yml` |

## 3. Đề xuất triển khai production trên Render

Nền tảng production được chọn là **Render**.

- **Frontend:** Render Web Service dùng Dockerfile hiện có tại `apps/web/Dockerfile`.
- **Backend:** Render Web Service dùng Dockerfile hiện có tại `apps/api/Dockerfile`.
- **Cơ sở dữ liệu:** Render Managed PostgreSQL. Cơ sở dữ liệu là một dịch vụ được quản lý; đây không phải là container `db` trong file Compose dùng cho local.
- **Container registry:** GitHub Container Registry (GHCR) là registry được đề xuất cho các image frontend/API có đánh phiên bản. Hiện repository có các bước kiểm tra CI nhưng chưa có workflow nào được xác minh là publish image lên GHCR; đây là một công việc triển khai còn phải thực hiện.
- **Nền tảng triển khai:** Render lưu trữ hai dịch vụ ứng dụng và PostgreSQL được quản lý.

Đây là kiến trúc mục tiêu, không khẳng định rằng các tài nguyên production đã được cung cấp.

## 4. Giao tiếp khi chạy (runtime)

1. Người dùng mở URL HTTPS công khai của dịch vụ frontend trên Render bằng trình duyệt.
2. Frontend Next.js gọi tới URL HTTPS công khai của dịch vụ API NestJS.
3. API kết nối tới Render PostgreSQL bằng chuỗi kết nối cơ sở dữ liệu được cung cấp qua `DATABASE_URL`.
4. Endpoint `/health` của API kiểm tra kết nối cơ sở dữ liệu và có thể được cấu hình làm đường dẫn health check của Render.

Quá trình build frontend phải nhận đúng URL API công khai thông qua build argument/biến môi trường `NEXT_PUBLIC_API_URL`, vì Dockerfile hiện tại truyền giá trị này vào giai đoạn build của Next.js. API phải nhận origin thực tế của frontend trong `CORS_ORIGIN`.

## 5. Yêu cầu về cấu hình và bảo mật trước khi lên production

- Đặt `DATABASE_URL` thành chuỗi kết nối Render PostgreSQL. Ưu tiên chuỗi kết nối private/internal khi API và cơ sở dữ liệu cùng region trên Render.
- Đặt `CORS_ORIGIN` thành đúng origin của frontend đã triển khai (không dùng `*`).
- Đặt `NEXT_PUBLIC_API_URL` thành URL HTTPS công khai của API tại thời điểm build image frontend.
- Đặt các secret mạnh và duy nhất cho `JWT_SECRET`, `STAFF_PASSWORD` và thông tin xác thực cơ sở dữ liệu. Không bao giờ dùng các giá trị mặc định dành cho phát triển trong `docker-compose.yml`.
- Đặt `AUTO_SEED=false` trừ khi có quy trình seed dữ liệu production được kiểm soát và chủ đích rõ ràng.
- Cấu hình đường dẫn health check của API trên Render là `/health`.
- Cấu hình Render để triển khai đúng image tag/digest bất biến từ GHCR, hoặc ghi chép rõ rằng Render build trực tiếp từ repository. Không trộn lẫn hai cách triển khai trong sơ đồ.
- Cấu hình sao lưu/lưu giữ (backup/retention) cơ sở dữ liệu trên Render và xác minh các đảm bảo sao lưu của gói dịch vụ trước khi go-live.

## 6. Phát triển local so với production

`docker-compose.yml` mô tả cách bố trí container cho môi trường local. File này định nghĩa một container PostgreSQL local với named volume `pgdata` và một service `web` nằm sau profile `web`. Nó là bằng chứng hữu ích về ranh giới container và lưu trữ local, nhưng không chứng minh rằng cơ sở dữ liệu production là một Docker container hay rằng Render đã được cấu hình.

Cơ sở dữ liệu production trong kiến trúc mục tiêu này là Render Managed PostgreSQL. Dung lượng lưu trữ bền vững và việc sao lưu của nó do Render quản lý, thay vì được biểu diễn như một Docker named volume trong sơ đồ production.

## 7. Các quan sát về triển khai hiện có

- `apps/web/next.config.ts` đặt `output: "standalone"`, khớp với chiến lược copy/chạy trong `apps/web/Dockerfile`.
- `apps/api/Dockerfile` expose cổng 3001 và khởi động API bằng `npm run start:prod`.
- `apps/api/package.json` định nghĩa `start:prod` là `prisma migrate deploy && node dist/main.js`.
- `apps/api/src/main.ts` lắng nghe trên `Number(process.env.PORT) || 3001`, hỗ trợ `PORT` do nền tảng cung cấp.
- `apps/api/src/health/health.controller.ts` thực thi một truy vấn cơ sở dữ liệu và trả về lỗi nếu cơ sở dữ liệu không khả dụng.
- `.github/workflows/ci.yml` hiện chạy lint, test và build cho API và web. Nó chưa thiết lập pipeline publish/triển khai GHCR.
