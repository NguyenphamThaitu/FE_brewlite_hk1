# BrewLite – Ma trận truy vết triển khai (Task 3.2)

Ma trận này ánh xạ từng node trong sơ đồ triển khai production tới phần mô tả kiến trúc và bằng chứng trong repository. "Đã xác minh" nghĩa là đã tìm thấy phần triển khai/cấu hình tương ứng trong repository. "Đề xuất / bên ngoài" nghĩa là thuộc thiết kế mục tiêu đã chọn nhưng chưa được thể hiện bằng hạ tầng đã triển khai hay tự động hóa trong repository.

| Node triển khai | Thành phần kiến trúc / trách nhiệm | Bằng chứng trong repository | Trạng thái và xác minh |
|---|---|---|---|
| Thiết bị người dùng – Browser/PWA | Điểm cuối phía client truy cập BrewLite | Không cần artifact triển khai phía server cho trình duyệt của người dùng. Ứng dụng frontend nằm ở `apps/web/src/`. | Đã xác minh là mô hình truy cập của client; thiết bị nằm ngoài phạm vi triển khai của repository. |
| Render Web Service – Next.js | Tầng trình bày web | `apps/web/package.json`; `apps/web/src/`; `apps/web/next.config.ts`; `apps/web/Dockerfile` | Đã xác minh ứng dụng và việc build Docker image. Bản thân Render service vẫn cần được cung cấp. `output: "standalone"` khớp với việc copy `.next/standalone` trong Dockerfile. |
| Render Web Service – NestJS API | Tầng nghiệp vụ/API | `apps/api/package.json`; `apps/api/src/`; `apps/api/Dockerfile`; `apps/api/src/main.ts` | Đã xác minh ứng dụng và việc build Docker image. Bản thân Render service vẫn cần được cung cấp. API đọc `PORT` của nền tảng, mặc định 3001. |
| Health check API `/health` | Endpoint kiểm tra sức khỏe vận hành | `apps/api/src/health/health.controller.ts`; healthcheck của API trong `docker-compose.yml` | Đã xác minh. Endpoint kiểm tra kết nối PostgreSQL, không chỉ kiểm tra tiến trình còn sống. Cấu hình đường dẫn health check của Render là `/health`. |
| Render Managed PostgreSQL | Kho dữ liệu quan hệ bền vững | `apps/api/prisma/schema.prisma`; `apps/api/src/prisma/prisma.service.ts`; service `db` local trong `docker-compose.yml` | Đã xác minh mô hình dữ liệu PostgreSQL/Prisma. Cơ sở dữ liệu Render là hạ tầng mục tiêu và cần được cung cấp. Không đánh đồng với container Compose local. |
| Lưu trữ bền vững cho PostgreSQL | Dữ liệu cơ sở dữ liệu bền vững | `docker-compose.yml` có named volume local `pgdata:/var/lib/postgresql/data` | Đã xác minh lưu trữ local. Lưu trữ production do Render PostgreSQL cung cấp/quản lý; cần kiểm tra thiết lập lưu trữ/sao lưu thực tế trong Render Dashboard. |
| GitHub Actions CI | Tự động kiểm tra lint, test và build | `.github/workflows/ci.yml` | Đã xác minh. Workflow hiện tại không publish image lên GHCR. |
| GHCR – Container Registry | Lưu các container image web/API có đánh phiên bản | Không tìm thấy workflow publish image hay cấu hình GHCR nào được xác minh trong repository đã kiểm tra. | Đề xuất, chưa triển khai/xác minh. Cần thêm workflow có quyền build/push image và cấu hình Render để triển khai các image đó trước khi đánh dấu là đã triển khai. |
| Render – Nền tảng triển khai | Chạy các dịch vụ frontend/API và cơ sở dữ liệu được quản lý | Cấu hình project/service của Render không có trong repository đã kiểm tra. | Nền tảng mục tiêu đã chọn, nhưng các service/lần triển khai thực tế cần được xác minh trong Render Dashboard. |

## Truy vết cấu hình quan trọng

| Thiết lập | Nơi sử dụng | Giá trị production yêu cầu |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Build argument của `apps/web/Dockerfile` và bước build Next.js | URL HTTPS công khai của API đã triển khai; đặt tại thời điểm build image |
| `PORT` | `apps/api/src/main.ts` | Dùng `PORT` do Render cung cấp; ứng dụng mặc định về 3001 |
| `DATABASE_URL` | `apps/api/prisma/schema.prisma` và Prisma service | Chuỗi kết nối Render PostgreSQL |
| `CORS_ORIGIN` | `apps/api/src/main.ts` → `setupApp()` | Origin công khai chính xác của frontend |
| `JWT_SECRET` | Cấu hình xác thực của API | Secret mạnh và duy nhất; không bao giờ dùng giá trị mặc định phát triển của Compose |
| `AUTO_SEED` | `apps/api/src/main.ts` | Thông thường là `false` trên production, trừ khi cần seed dữ liệu có kiểm soát |

## Danh sách kiểm tra xác minh trước khi nộp / lên production

- [ ] Sơ đồ triển khai bao gồm browser/PWA, dịch vụ Next.js, dịch vụ NestJS API, PostgreSQL, lưu trữ bền vững, registry và nền tảng Render.
- [ ] Mỗi node trong sơ đồ đều có một dòng trong ma trận này.
- [ ] Mỗi dòng có bằng chứng từ repository đều trỏ tới một đường dẫn tồn tại trên nhánh nguồn đã chọn.
- [ ] Render PostgreSQL được thể hiện là PostgreSQL được quản lý, không phải container Compose.
- [ ] `pgdata` được mô tả chỉ là lưu trữ local của Compose.
- [ ] GHCR và các tài nguyên Render được gắn nhãn "đề xuất" cho đến khi thực sự được cấu hình.
- [ ] `NEXT_PUBLIC_API_URL` của frontend, `CORS_ORIGIN`, `DATABASE_URL` của API và các secret đã được cấu hình cho production.
- [ ] Health check API trên Render được đặt là `/health`.
- [ ] Đã kiểm tra thiết lập sao lưu/lưu giữ của cơ sở dữ liệu Render.
- [ ] Một smoke test triển khai xác nhận kết nối frontend → API → PostgreSQL.
