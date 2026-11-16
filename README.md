# BrewLite

**BrewLite** là ứng dụng web hỗ trợ khách hàng xem thực đơn, tùy chỉnh đồ uống, đặt hàng và thanh toán tại cửa hàng cà phê/trà. Dự án được phát triển theo mô hình **monorepo**, gồm frontend Next.js, backend NestJS và cơ sở dữ liệu PostgreSQL.

> **Phạm vi được mô tả theo mã nguồn trên nhánh `main`:** luồng đặt hàng và thanh toán Ví/Thẻ mô phỏng được xử lý trong `CartDrawer` và `OrderConfirmationModal`; trang lịch sử đơn hàng `/orders` và trang kết quả VNPay `/payment/result` đã có. Giao diện nhân viên riêng chưa có trong frontend, dù backend đã cung cấp một số API dành cho STAFF. JWT hiện được lưu ở `localStorage` trên trình duyệt và gửi qua header `Authorization: Bearer ...`.

## 1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Giao diện | Tailwind CSS 4, Lucide React, thiết kế responsive theo hướng mobile-first |
| Quản lý giỏ hàng/phiên | Trạng thái phía client, `localStorage` và `sessionStorage` |
| Kiểm thử frontend | Vitest, React Testing Library, jsdom |
| Backend | NestJS 11, TypeScript, REST API |
| Xác thực và bảo mật API | JWT, Passport, bcryptjs, Helmet, ValidationPipe, CORS |
| Cơ sở dữ liệu | PostgreSQL 16, Prisma ORM 6 và Prisma Migrations |
| Kiểm thử backend | Jest, Supertest |
| Chất lượng mã | ESLint, TypeScript |
| Môi trường local | Docker, Docker Compose |
| Tự động hóa | GitHub Actions CI/CD, GitHub Container Registry (GHCR), Render |

Khuyến nghị dùng **Node.js 22 và npm** khi phát triển trực tiếp trên máy. Dockerfile của từng ứng dụng có phiên bản Node riêng cho build/runtime.

## 2. Chức năng hiện có

### 2.1. Frontend (`apps/web`)

- Hiển thị thực đơn đồ uống, lọc theo danh mục và tìm kiếm sản phẩm.
- Xem chi tiết món trong hộp thoại; chọn size và topping, xem giá theo lựa chọn.
- Thêm món vào giỏ, thay đổi số lượng, xóa món và xem tổng tiền.
- Lưu giỏ hàng trong `localStorage` của trình duyệt.
- Đăng ký và đăng nhập tài khoản khách hàng.
- Bắt buộc đăng nhập và có phiên JWT còn hiệu lực trước khi đặt hàng.
- Đặt hàng và thanh toán bằng **Ví/Thẻ mô phỏng** ngay trong hộp thoại xác nhận đơn.
- Giữ thông tin đơn đang chờ thanh toán trong `sessionStorage` để hỗ trợ thử thanh toán lại; chỉ xóa giỏ khi thanh toán thành công.
- Xem lịch sử đơn hàng tại `/orders`.
- Xác minh kết quả chuyển về từ VNPay tại `/payment/result`.
- Giao diện responsive, ưu tiên màn hình di động. Phiên bản hiện tại là web mobile-first, không nên mô tả là PWA nếu chưa bổ sung và kiểm tra đầy đủ các thành phần PWA.

Các trang/điểm vào chính:

| Đường dẫn | Chức năng |
|---|---|
| `/` | Menu, chi tiết sản phẩm, giỏ hàng và luồng đặt hàng/thanh toán mô phỏng |
| `/login` | Đăng nhập |
| `/register` | Đăng ký |
| `/orders` | Lịch sử đơn hàng của tài khoản đang đăng nhập |
| `/payment/result` | Nhận kết quả chuyển hướng VNPay và yêu cầu API xác minh |

### 2.2. Backend (`apps/api`)

- Cung cấp danh sách/chi tiết sản phẩm và thông tin khả dụng dựa trên tồn kho nguyên liệu.
- Đăng ký, đăng nhập và lấy thông tin tài khoản hiện tại bằng JWT.
- Mã hóa mật khẩu bằng `bcryptjs`.
- Tạo đơn hàng từ sản phẩm, size và topping; API tự tính giá theo dữ liệu database thay vì tin giá do trình duyệt gửi.
- Kiểm tra và trừ nguyên liệu trong transaction; dùng cơ chế khóa dữ liệu cần thiết để hạn chế bán vượt tồn kho.
- Tra cứu đơn, xem lịch sử đơn của tài khoản hiện tại, xem chi tiết và hủy đơn chưa thanh toán theo quyền.
- Cung cấp API cho STAFF xem đơn và cập nhật trạng thái pha chế.
- Ghi lại lịch sử thay đổi trạng thái đơn hàng.
- Tự hủy đơn chưa thanh toán quá hạn và hoàn nguyên liệu theo cấu hình.
- Hỗ trợ thanh toán **Ví/Thẻ mô phỏng**. Đây không phải giao dịch ngân hàng thật; backend không lưu số thẻ đầy đủ, hạn thẻ hoặc CVV.
- Có các endpoint VNPay sandbox ở backend khi cấu hình thông tin merchant; frontend có trang `/payment/result` để xử lý đường dẫn trả về.
- Bắt buộc `Idempotency-Key` đối với request tạo thanh toán để hạn chế tạo/xử lý giao dịch trùng lặp.
- Có `GET /health` để kiểm tra API và kết nối PostgreSQL.

> **Lưu ý về phạm vi:** Trên `main` hiện có API đăng ký/đăng nhập/JWT; chưa thấy API quên mật khẩu hoặc đổi mật khẩu qua email. Không đưa chức năng này vào danh sách chức năng đã hoàn thành cho đến khi code và kiểm thử được merge vào nhánh chính.

## 3. Tài liệu theo Assignment 2

| Task | Tạo phẩm trong repository |
|---|---|
| **Task 1 – Yêu cầu** | `docs/requirements/context-and-scope.md`, `srs.md`, `nfr.md`, `use-case-overview.md`, `use-case-order-payment.md` |
| **Task 2 – Mô hình hóa** | `docs/diagrams/activity-order-flow.puml` và `.svg`; `sequence-checkout.puml` và `.svg`; `class-domain.puml` và `.svg`; sơ đồ use-case tổng quát và use-case đặt hàng/thanh toán |
| **Task 3 – Kiến trúc** | `docs/architecture/`, các ADR trong `docs/architecture/adr/`, deployment diagram tại `docs/diagrams/deployment.puml`/`.svg`, hướng dẫn tại `docs/deployment.md` |
| **Task 4 – Sprint 1** | `apps/web/`, `apps/api/`, `docker-compose.yml`, `.env.example`, `.gitignore`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `CONTRIBUTING.md` |
| **Task 5 – Sprint 2 và Delivery** | Luồng đặt hàng/thanh toán, kiểm thử trong `apps/` và `tests/`, `Dockerfile`, `.github/workflows/cd.yml`, `RELEASE_NOTES.md`, `docs/deployment.md` |

**Việc cần hoàn thiện trước khi nộp:** Assignment 2 yêu cầu bắt buộc tệp `docs/traceability-matrix.md` để liên kết mã yêu cầu với use-case/user story, sơ đồ, code/API và test. Tại thời điểm rà soát nhánh `main`, mình chưa tìm thấy tệp này trong repository. Cần bổ sung ma trận truy vết và cập nhật các liên kết/minh chứng trước khi chốt hồ sơ nộp bài.

## 4. Cấu trúc repository

```text
.
├── apps/
│   ├── api/                         # NestJS API, Prisma schema, migrations và seed
│   │   ├── prisma/
│   │   ├── src/
│   │   ├── .env.example             # Mẫu môi trường khi chạy API trực tiếp
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web/                         # Next.js frontend
│       ├── src/
│       ├── Dockerfile
│       └── package.json
├── docs/
│   ├── architecture/                # Kiến trúc và ADR
│   ├── diagrams/                    # Sơ đồ UML, file nguồn và bản kết xuất
│   ├── images/
│   ├── requirements/                # Bối cảnh, SRS, NFR và use-case
│   ├── ci-evidence.md
│   ├── deployment.md
│   └── sprint-review-retrospective.md
├── tests/                            # Kiểm thử luồng cấp hệ thống/E2E
├── .github/
│   ├── workflows/                   # ci.yml và cd.yml
│   └── pull_request_template.md
├── .env.example                      # Mẫu biến môi trường cho Docker Compose
├── .gitignore
├── docker-compose.yml
├── CONTRIBUTING.md
├── RELEASE_NOTES.md
└── README.md
```

Mỗi ứng dụng có `package.json` và `package-lock.json` riêng. Vì vậy, chạy lệnh npm trong `apps/api` hoặc `apps/web`, không chạy `npm install` ở thư mục gốc.

## 5. Chạy toàn bộ hệ thống bằng Docker Compose

### Yêu cầu

- Git
- Docker Desktop đã cài đặt và đang chạy Docker Compose

### Các bước

1. Clone repository:

   ```bash
   git clone https://github.com/NguyenphamThaitu/FE_brewlite_hk1.git
   cd FE_brewlite_hk1
   ```

2. Tạo file `.env` từ mẫu ở thư mục gốc.

   **PowerShell:**

   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS/Linux/Git Bash:**

   ```bash
   cp .env.example .env
   ```

3. Mở `.env` và đổi `POSTGRES_PASSWORD`, `JWT_SECRET`, `STAFF_PASSWORD` thành giá trị riêng cho môi trường local. Các giá trị mẫu không dùng cho production.

4. Build và khởi chạy các service:

   ```bash
   docker compose up --build
   ```

5. Truy cập:

   | Thành phần | Địa chỉ |
   |---|---|
   | BrewLite Web | http://localhost:3000 |
   | BrewLite API | http://localhost:3001 |
   | API health check | http://localhost:3001/health |
   | API danh sách sản phẩm | http://localhost:3001/products |

Docker Compose khởi chạy PostgreSQL, API và Web. API chờ database healthy trước khi khởi động. API chạy Prisma migrations khi container bắt đầu; `AUTO_SEED=true` cho phép nạp dữ liệu mẫu nếu database chưa có sản phẩm.

Dừng các container nhưng giữ dữ liệu database:

```bash
docker compose down
```

**Cảnh báo:** Lệnh sau xóa named volume `pgdata` và toàn bộ dữ liệu PostgreSQL local:

```bash
docker compose down -v
```

## 6. Chạy frontend/backend riêng để phát triển

Có thể chạy riêng từng ứng dụng khi máy đã có PostgreSQL đang hoạt động, database `brewlite` đã được tạo và `DATABASE_URL` trỏ đúng tới database đó.

### 6.1. Backend API

```bash
cd apps/api
npm ci
```

Tạo file `apps/api/.env` từ mẫu `apps/api/.env.example`.

**PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux/Git Bash:**

```bash
cp .env.example .env
```

Kiểm tra `DATABASE_URL`, `JWT_SECRET` và các biến cấu hình. Sau đó chạy:

```bash
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

API mặc định chạy tại `http://localhost:3001`.

### 6.2. Frontend Web

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

Frontend mặc định chạy tại `http://localhost:3000`. `NEXT_PUBLIC_API_URL` được nhúng vào bundle lúc build; khi đổi URL API cho môi trường triển khai, cần build lại frontend.

## 7. Lệnh lint, test và build

Chạy lệnh trong đúng thư mục của ứng dụng.

### Backend (`apps/api`)

| Lệnh | Mục đích |
|---|---|
| `npm ci` | Cài dependency đúng theo lockfile |
| `npm run lint` | Kiểm tra mã nguồn API bằng ESLint |
| `npm test` | Chạy unit test của Jest (project `unit`) |
| `npm run test:int` | Chạy integration test; cần database kiểm thử theo cấu hình test |
| `npm run test:all` | Chạy toàn bộ project test Jest |
| `npx prisma generate` | Sinh Prisma Client |
| `npm run build` | Sinh Prisma Client và build NestJS |
| `npm run migrate:deploy` | Áp dụng migrations đã commit |
| `npm run start:prod` | Chạy migrations rồi khởi động API production |

### Frontend (`apps/web`)

| Lệnh | Mục đích |
|---|---|
| `npm ci` | Cài dependency đúng theo lockfile |
| `npm run lint` | Kiểm tra ESLint |
| `npm test` | Chạy unit/component test bằng Vitest |
| `npm run test:e2e` | Chạy bộ kiểm thử luồng trong thư mục `tests/` bằng Vitest |
| `npm run build` | Build Next.js |
| `npm run start` | Chạy bản build production |

**CI hiện tại:** `.github/workflows/ci.yml` chạy hai job `api` và `web` khi mở/cập nhật pull request vào `main` hoặc push lên `main`. Mỗi job thực hiện `npm ci → lint → unit test → build`. Script E2E có sẵn trong `apps/web/package.json`; không nên hiểu nhầm là workflow CI hiện tại đã tự chạy script `test:e2e` nếu chưa cập nhật workflow.

## 8. API chính

Các endpoint dưới đây được khai báo trong backend. Endpoint có yêu cầu xác thực cần gửi header `Authorization: Bearer <accessToken>`.

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
| `GET` | `/orders/me` | Lịch sử đơn của tài khoản hiện tại (có phân trang) | JWT |
| `GET` | `/orders/:id` | Chi tiết đơn hàng | JWT, chủ đơn hoặc STAFF |
| `POST` | `/orders/:id/cancel` | Hủy đơn chưa thanh toán | JWT, chủ đơn |
| `PATCH` | `/orders/:id/status` | Cập nhật trạng thái đơn | STAFF |
| `GET` | `/staff/orders` | Danh sách đơn cho nhân viên | STAFF |
| `POST` | `/payments` | Thanh toán Ví/Thẻ mô phỏng | JWT + `Idempotency-Key` |
| `POST` | `/payments/vnpay` | Tạo giao dịch VNPay sandbox | JWT + `Idempotency-Key` |
| `GET` | `/payments/vnpay/ipn` | Endpoint nhận thông báo VNPay | VNPay gọi |
| `GET` | `/payments/vnpay/return` | Xác minh kết quả VNPay trả về | Theo luồng VNPay |

Luồng trạng thái pha chế của nhân viên được backend giới hạn theo thứ tự `PAID → PREPARING → READY → COMPLETED`. Đơn chưa thanh toán có thể chuyển sang `PAYMENT_FAILED` hoặc `CANCELLED` theo nghiệp vụ.

## 9. Biến môi trường

Repository có hai mẫu `.env.example` cho hai cách chạy khác nhau. **Không dùng lẫn hai file này.**

### 9.1. `.env` ở thư mục gốc – Docker Compose

Sao chép từ `.env.example` ở thư mục gốc. Các biến chính:

| Biến | Ý nghĩa |
|---|---|
| `POSTGRES_USER` | Tên người dùng PostgreSQL local |
| `POSTGRES_PASSWORD` | Mật khẩu PostgreSQL local |
| `POSTGRES_DB` | Tên database local |
| `JWT_SECRET` | Khóa ký JWT của API; phải thay bằng chuỗi bí mật riêng |
| `CORS_ORIGIN` | Origin frontend được phép gọi API; nhiều origin phân tách bằng dấu phẩy |
| `NEXT_PUBLIC_API_URL` | URL API được nhúng vào frontend khi build |
| `AUTO_SEED` | `true` để nạp dữ liệu mẫu khi database chưa có sản phẩm; `false` để tắt |
| `STAFF_PASSWORD` | Mật khẩu ban đầu của tài khoản STAFF được seed tạo |
| `ORDER_PAYMENT_TIMEOUT_MINUTES` | Số phút trước khi đơn chưa thanh toán bị xem là quá hạn |
| `ORDER_EXPIRY_CHECK_INTERVAL_SECONDS` | Chu kỳ quét đơn quá hạn; `0` để tắt |
| `VNPAY_TMN_CODE` | Mã merchant VNPay sandbox; không bắt buộc |
| `VNPAY_HASH_SECRET` | Khóa bí mật VNPay sandbox; không bắt buộc |
| `VNPAY_URL` | URL cổng thanh toán VNPay; mặc định là sandbox |
| `VNPAY_RETURN_URL` | URL frontend nhận chuyển hướng sau thanh toán, mặc định `/payment/result` |

Compose tự tạo `DATABASE_URL` nội bộ cho API từ `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` và hostname service `db`. Vì vậy, không cần thêm `DATABASE_URL` vào `.env` gốc khi chạy Compose.

### 9.2. `apps/api/.env` – chạy API trực tiếp

Mẫu riêng nằm ở `apps/api/.env.example`. File này có `DATABASE_URL` trỏ tới PostgreSQL trên máy, `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN` và các biến backend. File này không thay thế `.env` gốc dùng cho Docker Compose.

### 9.3. `apps/web/.env.local` – chạy frontend trực tiếp

Khai báo `NEXT_PUBLIC_API_URL`, ví dụ:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Chỉ đặt biến được phép công khai dưới tiền tố `NEXT_PUBLIC_`. Không đặt mật khẩu, JWT secret, chuỗi kết nối database hoặc khóa VNPay dưới tiền tố này vì các giá trị đó có thể được gửi tới trình duyệt.

### Lưu ý bảo mật

- Không commit `.env`, `.env.local` hoặc bất kỳ file nào chứa secret thật.
- Chỉ commit các file mẫu `.env.example` không chứa thông tin xác thực đang sử dụng.
- `STAFF_PASSWORD` chỉ dùng khi seed tạo tài khoản STAFF; thay biến sau khi tài khoản đã tồn tại không tự đổi mật khẩu của tài khoản đó.
- Production cần đặt biến/secret trực tiếp trong phần Environment của Render và GitHub Actions, không tải `.env` local lên repository.
- Đặt `AUTO_SEED=false` ở production trừ khi có chủ đích seed dữ liệu đã được kiểm soát.
- Các giá trị mặc định trong Docker Compose chỉ dành cho môi trường phát triển local.

## 10. CI/CD, triển khai và quay lui

### 10.1. Continuous Integration

Workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) chạy `Install → Lint → Unit Test → Build` cho cả API và Web. Pull request vào `main` phải vượt qua các status check bắt buộc theo ruleset của repository trước khi merge.

### 10.2. Continuous Delivery/Deployment

Workflow [`.github/workflows/cd.yml`](.github/workflows/cd.yml) được kích hoạt khi:

- Push vào nhánh `main`;
- Push tag phiên bản có dạng `v*`;
- Chạy thủ công bằng `workflow_dispatch`.

Các bước chính: kiểm tra chất lượng, build Docker image cho API/Web, đẩy image lên GHCR, gửi deploy hook tới Render khi `CD_DEPLOY_ENABLED=true`, chờ dịch vụ Live, chạy smoke test và đánh dấu image `stable` nếu smoke test thành công. Khi deploy/smoke test thất bại, workflow có bước gửi lại deploy hook với image `stable` nếu đã tồn tại bản ổn định trước đó.

### 10.3. Cấu hình GitHub Actions

Trong **Settings → Secrets and variables → Actions**, các tên cấu hình được workflow dùng gồm:

| Loại | Tên |
|---|---|
| Secret | `RENDER_API_DEPLOY_HOOK` |
| Secret | `RENDER_WEB_DEPLOY_HOOK` |
| Secret | `RENDER_API_KEY` |
| Variable | `NEXT_PUBLIC_API_URL` |
| Variable | `PRODUCTION_WEB_URL` |
| Variable | `CD_DEPLOY_ENABLED` |

`GITHUB_TOKEN` được GitHub Actions cấp tự động để workflow đẩy image lên GHCR với quyền `packages: write`.

### 10.4. Địa chỉ production được ghi nhận

| Thành phần | Địa chỉ |
|---|---|
| Web | https://brewlite-web-image.onrender.com |
| API | https://brewlite-api-image.onrender.com |
| API health check | https://brewlite-api-image.onrender.com/health |

Đây là các URL được ghi trong tài liệu triển khai của repository; cần kiểm tra trạng thái truy cập thực tế tại thời điểm demo/chấm bài.

### 10.5. Phát hành và quay lui

Tạo tag phiên bản, ví dụ:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Theo dõi workflow tại tab **Actions**. Hướng dẫn triển khai, biến môi trường production, smoke test và rollback chi tiết nằm tại [`docs/deployment.md`](docs/deployment.md).

**Giới hạn rollback:** Workflow quay lui image Docker về tag `stable`; migration Prisma chỉ tiến lên và không tự động hoàn tác. Khi migration đã làm thay đổi dữ liệu/cấu trúc database, cần có phương án xử lý dữ liệu riêng.

## 11. Làm việc nhóm và đóng góp

Repository áp dụng GitHub Flow: tạo nhánh ngắn hạn từ `main`, commit theo Conventional Commits, mở pull request, chờ review và CI thành công rồi mới merge.

Trước khi đóng góp, đọc [`CONTRIBUTING.md`](CONTRIBUTING.md). Pull request sử dụng mẫu [`.github/pull_request_template.md`](.github/pull_request_template.md). Mọi thay đổi tài liệu yêu cầu, sơ đồ hoặc kiến trúc cần ghi rõ lý do và cập nhật tài liệu liên quan; sơ đồ nên commit cả file nguồn và file kết xuất.

## 12. Tài liệu liên quan

- [Bối cảnh và phạm vi](docs/requirements/context-and-scope.md)
- [Đặc tả yêu cầu phần mềm (SRS)](docs/requirements/srs.md)
- [Yêu cầu phi chức năng (NFR)](docs/requirements/nfr.md)
- [Use-case tổng quát](docs/requirements/use-case-overview.md)
- [Use-case đặt hàng và thanh toán](docs/requirements/use-case-order-payment.md)
- [Sơ đồ hoạt động](docs/diagrams/activity-order-flow.svg)
- [Sơ đồ tuần tự checkout](docs/diagrams/sequence-checkout.svg)
- [Sơ đồ lớp domain](docs/diagrams/class-domain.svg)
- [Sơ đồ triển khai](docs/diagrams/deployment.svg)
- [Danh sách quyết định kiến trúc (ADR)](docs/architecture/adr/README.md)
- [Minh chứng CI](docs/ci-evidence.md)
- [Hướng dẫn triển khai và quay lui](docs/deployment.md)
- [Sprint Review và Retrospective](docs/sprint-review-retrospective.md)
- [Release Notes](RELEASE_NOTES.md)
