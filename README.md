# BrewLite

**BrewLite** là ứng dụng web đặt đồ uống cho cửa hàng cà phê/trà. Repository được tổ chức theo mô hình **monorepo**, gồm giao diện Next.js, API NestJS, cơ sở dữ liệu PostgreSQL, cấu hình Docker Compose, kiểm thử và tài liệu kiến trúc/yêu cầu.

> **Lưu ý về phạm vi hiện tại:** Backend đã có các API cho đơn hàng, thanh toán và nghiệp vụ nhân viên. Tuy nhiên, frontend hiện mới có các trang `/`, `/login`, `/register`; nút **Đặt hàng & Thanh toán** trong giỏ hàng vẫn là placeholder, chưa kết nối với API tạo đơn/thanh toán. Các trang checkout, kết quả thanh toán, lịch sử đơn hàng và màn hình nhân viên chưa được triển khai trong App Router ở phiên bản source hiện tại.

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Giao diện | Tailwind CSS 4, Lucide React |
| Kiểm thử frontend | Vitest, React Testing Library, jsdom |
| Backend | NestJS 11, TypeScript |
| Xác thực | JWT, Passport, bcryptjs |
| Cơ sở dữ liệu | PostgreSQL 16, Prisma ORM 6 |
| Kiểm thử backend | Jest, Supertest |
| Chất lượng mã | ESLint, TypeScript |
| Đóng gói/chạy local | Docker, Docker Compose |
| CI | GitHub Actions |

Khuyến nghị dùng **Node.js 22 và npm** khi phát triển trực tiếp trên máy. Dockerfile của từng ứng dụng đã khai báo phiên bản Node riêng cho quá trình build/runtime.

## 2. Chức năng hiện có

### 2.1. Frontend (`apps/web`)

- Hiển thị thực đơn đồ uống, lọc theo danh mục và tìm kiếm theo tên/mô tả.
- Xem chi tiết món; tải lựa chọn size và topping từ API, có dữ liệu dự phòng cho giao diện.
- Thêm món vào giỏ, cập nhật số lượng, xóa món và xóa toàn bộ giỏ hàng.
- Lưu giỏ hàng trong `localStorage` của trình duyệt.
- Đăng ký và đăng nhập tài khoản khách hàng; xác thực qua API và lưu phiên JWT ở phía trình duyệt.
- Giao diện responsive, ưu tiên trải nghiệm trên thiết bị di động.

### 2.2. Backend (`apps/api`)

- Cung cấp danh sách và chi tiết sản phẩm; xác định khả năng bán dựa trên lượng nguyên liệu.
- Đăng ký, đăng nhập và lấy thông tin tài khoản hiện tại bằng JWT.
- Tạo đơn hàng từ danh sách sản phẩm/size/topping; API tự tính lại giá từ dữ liệu trong database, không tin giá do client gửi.
- Kiểm tra và trừ nguyên liệu trong transaction; khóa dòng dữ liệu khi cần để tránh bán vượt tồn kho.
- Tra cứu đơn hàng, xem lịch sử đơn của khách, hủy đơn chưa thanh toán và ghi lịch sử thay đổi trạng thái.
- Cung cấp API cho nhân viên xem đơn đã thanh toán và cập nhật trạng thái theo luồng nghiệp vụ.
- Tự hủy đơn chưa thanh toán quá hạn và hoàn nguyên liệu về kho theo cấu hình.
- Hỗ trợ thanh toán **Ví/Thẻ mô phỏng**. Đây không phải giao dịch ngân hàng thật; thông tin thẻ đầy đủ không được lưu, chỉ lưu 4 số cuối.
- Có thêm tích hợp **VNPay sandbox** ở backend nếu cấu hình thông tin merchant. Thanh toán mô phỏng không cần cấu hình VNPay.
- Bắt buộc `Idempotency-Key` cho request thanh toán để hạn chế xử lý trùng khi client gửi lại request.

## 3. Cấu trúc repository

```text
.
├── apps/
│   ├── api/                    # NestJS API, Prisma schema/migrations/seed
│   └── web/                    # Next.js frontend
├── docs/
│   ├── architecture/           # ADR, kiến trúc và quyết định thiết kế
│   ├── diagrams/               # Sơ đồ UML và file nguồn
│   └── requirements/           # SRS, NFR, use case, phạm vi
├── tests/                      # Vị trí dành cho kiểm thử cấp hệ thống
├── .github/workflows/          # GitHub Actions CI
├── .env.example                # Mẫu biến môi trường cho Docker Compose
├── docker-compose.yml          # PostgreSQL + API + Web
└── CONTRIBUTING.md             # Quy trình nhánh, commit và pull request
```

Mỗi ứng dụng có `package.json` và `package-lock.json` riêng. Vì vậy, hãy chạy lệnh npm trong `apps/api` hoặc `apps/web`, không chạy `npm install` ở thư mục gốc.

## 4. Chạy toàn bộ hệ thống bằng Docker Compose

### Yêu cầu

- Git
- Docker Desktop đã bật Docker Compose

### Các bước

1. Clone repository:

   ```bash
   git clone https://github.com/NguyenphamThaitu/FE_brewlite_hk1.git
   cd FE_brewlite_hk1
   ```

2. Tạo file `.env` từ mẫu ở thư mục gốc.

   PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux/Git Bash:

   ```bash
   cp .env.example .env
   ```

3. Mở `.env`, thay `JWT_SECRET` bằng chuỗi bí mật ngẫu nhiên đủ dài và đổi `POSTGRES_PASSWORD`, `STAFF_PASSWORD` theo môi trường của bạn. Không dùng các giá trị mẫu này cho production.

4. Build và khởi chạy:

   ```bash
   docker compose up --build
   ```

5. Mở các địa chỉ sau:

   | Thành phần | Địa chỉ |
   |---|---|
   | BrewLite Web | http://localhost:3000 |
   | BrewLite API | http://localhost:3001 |
   | API health check | http://localhost:3001/health |
   | API danh sách sản phẩm | http://localhost:3001/products |

Docker Compose khởi động PostgreSQL trước, đợi database healthy rồi mới khởi động API; frontend được khởi động sau khi API healthy. API tự chạy Prisma migrations khi container khởi động và seed dữ liệu mẫu khi `AUTO_SEED=true` (chỉ seed nếu bảng sản phẩm còn trống).

Dừng các container nhưng giữ dữ liệu database:

```bash
docker compose down
```

**Cảnh báo:** Lệnh sau xóa cả named volume `pgdata` và toàn bộ dữ liệu PostgreSQL local:

```bash
docker compose down -v
```

## 5. Chạy frontend/backend riêng để phát triển

Có thể chạy riêng từng ứng dụng khi máy đã có PostgreSQL đang hoạt động và database `brewlite` đã được tạo. Trong chế độ này, API đọc file `apps/api/.env`; frontend đọc `apps/web/.env.local`.

### 5.1. Backend API

```bash
cd apps/api
npm ci
```

Tạo file `apps/api/.env` từ `apps/api/.env.example`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux/Git Bash:

```bash
cp .env.example .env
```

Kiểm tra `DATABASE_URL` trỏ tới PostgreSQL đang chạy trên máy, sau đó chạy:

```bash
npm run start:dev
```

API mặc định chạy tại `http://localhost:3001`.

### 5.2. Frontend Web

Mở terminal khác:

```bash
cd apps/web
npm ci
```

Tạo file `apps/web/.env.local` với nội dung:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Sau đó chạy:

```bash
npm run dev
```

Frontend mặc định chạy tại `http://localhost:3000`. `NEXT_PUBLIC_API_URL` được Next.js đọc khi build; khi thay đổi URL API trong môi trường production/Docker, cần build lại frontend.

## 6. Lệnh kiểm tra và build

Chạy các lệnh trong đúng thư mục ứng dụng.

### Backend (`apps/api`)

| Lệnh | Mục đích |
|---|---|
| `npm run lint` | Kiểm tra quy tắc mã nguồn API |
| `npm test` | Chạy unit test (Jest, project `unit`) |
| `npm run test:int` | Chạy integration test; cần database kiểm thử theo cấu hình trong test |
| `npm run test:all` | Chạy toàn bộ project test Jest |
| `npm run build` | Sinh Prisma Client và build NestJS |
| `npm run start:prod` | Chạy migration đã commit rồi khởi động API |
| `npm run migrate:dev -- --name ten_migration` | Tạo migration trong môi trường phát triển |
| `npm run migrate:deploy` | Áp dụng migration đã có |

### Frontend (`apps/web`)

| Lệnh | Mục đích |
|---|---|
| `npm run lint` | Kiểm tra ESLint |
| `npm test` | Chạy unit/component test bằng Vitest |
| `npm run build` | Build Next.js |
| `npm run start` | Chạy bản build production |

GitHub Actions workflow tại `.github/workflows/ci.yml` chạy riêng hai job `api` và `web` khi có pull request vào `main` hoặc push lên `main`; mỗi job cài dependencies, lint, test và build.

## 7. API chính

Các endpoint dưới đây được khai báo trong backend. Endpoint có yêu cầu xác thực cần gửi `Authorization: Bearer <accessToken>`.

| Phương thức | Endpoint | Mô tả | Quyền |
|---|---|---|---|
| `GET` | `/health` | Kiểm tra API và kết nối PostgreSQL | Công khai |
| `GET` | `/products` | Danh sách sản phẩm đang bán | Công khai |
| `GET` | `/products/:id` | Chi tiết sản phẩm, size và topping | Công khai |
| `POST` | `/auth/register` | Đăng ký tài khoản khách hàng | Công khai |
| `POST` | `/auth/login` | Đăng nhập, nhận JWT | Công khai |
| `GET` | `/auth/me` | Thông tin tài khoản hiện tại | JWT |
| `POST` | `/orders` | Tạo đơn hàng | JWT |
| `GET` | `/orders` | Danh sách đơn theo quyền người dùng | JWT |
| `GET` | `/orders/me` | Lịch sử đơn của tài khoản hiện tại | JWT |
| `GET` | `/orders/:id` | Chi tiết đơn hàng | JWT, chủ đơn hoặc STAFF |
| `POST` | `/orders/:id/cancel` | Hủy đơn chưa thanh toán | JWT, chủ đơn |
| `PATCH` | `/orders/:id/status` | Cập nhật trạng thái pha chế | STAFF |
| `GET` | `/staff/orders` | Danh sách đơn cho màn hình nhân viên | STAFF |
| `POST` | `/payments` | Thanh toán Ví/Thẻ mô phỏng | JWT + `Idempotency-Key` |
| `POST` | `/payments/vnpay` | Tạo giao dịch VNPay sandbox | JWT + `Idempotency-Key` |
| `GET` | `/payments/vnpay/ipn` | Endpoint nhận thông báo VNPay | VNPay gọi |
| `GET` | `/payments/vnpay/return` | Xử lý kết quả VNPay trả về | Theo cấu hình VNPay |

Luồng trạng thái nhân viên được backend giới hạn theo thứ tự `PAID → PREPARING → READY → COMPLETED`. Đơn chưa thanh toán có thể đi tới `PAYMENT_FAILED` hoặc `CANCELLED` theo nghiệp vụ.

## 8. Biến môi trường

### 8.1. File `.env` ở thư mục gốc

File này được Docker Compose dùng để nội suy cấu hình của các container. Sao chép từ `.env.example` thành `.env`.

| Biến | Ý nghĩa |
|---|---|
| `POSTGRES_USER` | Tên người dùng PostgreSQL |
| `POSTGRES_PASSWORD` | Mật khẩu PostgreSQL local |
| `POSTGRES_DB` | Tên database |
| `JWT_SECRET` | Khóa ký JWT của API |
| `CORS_ORIGIN` | Origin frontend được phép gọi API; có thể liệt kê nhiều origin, phân tách bằng dấu phẩy |
| `NEXT_PUBLIC_API_URL` | URL API được nhúng vào frontend lúc build |
| `AUTO_SEED` | `true` để seed dữ liệu mẫu khi database chưa có sản phẩm; `false` để tắt |
| `STAFF_PASSWORD` | Mật khẩu ban đầu của tài khoản nhân viên do seed tạo |
| `ORDER_PAYMENT_TIMEOUT_MINUTES` | Số phút trước khi đơn chưa thanh toán bị xem là quá hạn (mặc định 15) |
| `ORDER_EXPIRY_CHECK_INTERVAL_SECONDS` | Chu kỳ quét đơn quá hạn; `0` để tắt (mặc định 60 giây) |
| `VNPAY_TMN_CODE` | Mã website/merchant VNPay sandbox; không bắt buộc |
| `VNPAY_HASH_SECRET` | Khóa bí mật VNPay sandbox; không bắt buộc |
| `VNPAY_URL` | URL cổng thanh toán VNPay; mặc định sandbox |
| `VNPAY_RETURN_URL` | URL VNPay chuyển trình duyệt về sau thanh toán |

Compose tự tạo `DATABASE_URL` nội bộ cho API từ ba biến PostgreSQL. Vì vậy, không cần khai báo `DATABASE_URL` trong file `.env` gốc khi chạy Compose.

### 8.2. File `apps/api/.env` khi chạy API trực tiếp

Mẫu riêng nằm ở `apps/api/.env.example`. File này có `DATABASE_URL` trỏ tới PostgreSQL trên máy, `PORT`, `JWT_EXPIRES_IN` và các biến backend. Nó không thay thế file `.env` gốc dùng cho Docker Compose.

### Ghi chú bảo mật và seed

- Không commit `.env`, `.env.local` hoặc bất kỳ file nào chứa secret thật.
- Chỉ đưa biến `NEXT_PUBLIC_*` vào frontend; không đặt mật khẩu, JWT secret hay khóa VNPay dưới tiền tố này vì giá trị có thể được gửi tới trình duyệt.
- `STAFF_PASSWORD` chỉ được dùng khi seed tạo tài khoản nhân viên trên database chưa có dữ liệu sản phẩm. Đổi biến sau khi seed không tự đổi mật khẩu của tài khoản đã tồn tại.
- Trong production, đặt secret tại phần Environment của nền tảng triển khai; đặt `AUTO_SEED=false` trừ khi có chủ đích seed dữ liệu.
- Các giá trị mặc định của Docker Compose chỉ dành cho phát triển local.
- `VNPAY_RETURN_URL` mẫu hiện trỏ tới `/payment/result` ở frontend, nhưng route kết quả này chưa có trong App Router hiện tại. Cần hoàn thiện trang kết quả và nối luồng frontend trước khi demo VNPay end-to-end. Thanh toán Ví/Thẻ mô phỏng không phụ thuộc trang này.

## 9. Tài liệu liên quan

- [Quy ước đóng góp và pull request](CONTRIBUTING.md)
- [Yêu cầu hệ thống (SRS)](docs/requirements/srs.md)
- [Yêu cầu phi chức năng (NFR)](docs/requirements/nfr.md)
- [Tổng quan kiến trúc](docs/architecture/adr/010-architecture-overview.md)
- [Danh sách quyết định kiến trúc (ADR)](docs/architecture/adr/README.md)
- [Minh chứng CI](docs/ci-evidence.md)
- [Hướng dẫn triển khai và quay lui](docs/deployment.md)

## 10. Đóng góp

Vui lòng đọc `CONTRIBUTING.md` trước khi tạo nhánh hoặc pull request. Nhóm sử dụng GitHub Flow: tạo nhánh ngắn hạn từ `main`, commit theo Conventional Commits, mở pull request và chờ CI/review trước khi merge.

## 11. Triển khai và quay lui

Production chạy trên Render (web, API, PostgreSQL), ảnh Docker lưu ở GitHub Container Registry.
Chi tiết đầy đủ: [docs/deployment.md](docs/deployment.md).

### Địa chỉ production

- Web: https://brewlite-web-image.onrender.com
- API: https://brewlite-api-image.onrender.com
- Health check: https://brewlite-api-image.onrender.com/health

### Triển khai

- Merge pull request vào `main`: workflow CD chạy Lint và Test, build ảnh Docker, đẩy lên GHCR
  (tag `sha-xxxxxxx` và `latest`), deploy lên Render khi biến `CD_DEPLOY_ENABLED` là `true`, rồi smoke test.
- Gắn phiên bản: `git tag v0.1.0` rồi `git push origin v0.1.0`. Ảnh sẽ có thêm tag phiên bản đó.

### Quay lui

- Tự động: nếu smoke test lỗi, pipeline gửi lại ảnh `stable` cho API và web.
- Thủ công: vào tab Actions, chọn workflow CD, bấm Run workflow từ một commit hoặc tag cũ đã ổn định.
- Giới hạn: quay lui chỉ đưa ảnh Docker về bản cũ, migration Prisma không tự hoàn tác. Cơ sở dữ liệu
  Render gói Free không có sao lưu.