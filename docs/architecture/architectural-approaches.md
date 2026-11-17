# BrewLite – Mô tả kiến trúc backend
## 1. Tổng quan

Backend BrewLite là một **modular monolith** viết bằng **NestJS 11 (TypeScript)**, cung cấp REST API cho frontend Next.js. Dữ liệu lưu trong **PostgreSQL 16**, truy cập qua **Prisma ORM 6** (client không dùng engine Rust, kết nối bằng `@prisma/adapter-pg`). Toàn bộ hệ thống nằm trong monorepo: `apps/api` (backend), `apps/web` (frontend).

Backend chịu trách nhiệm cho những việc mà trình duyệt không được tự quyết định: tính giá, kiểm tra và trừ tồn kho, xác thực/phân quyền, xử lý thanh toán và chuyển trạng thái đơn. Giỏ hàng **không** lưu ở server (bảng `CartItem` đã bị xóa ở migration `drop_cart_item`); frontend gửi danh sách món khi đặt đơn.

```
Trình duyệt (Next.js)
      │  HTTPS + JWT (Authorization: Bearer)
      ▼
NestJS API (cổng 3001)
  helmet · CORS · ValidationPipe → Guard (JWT, Roles) → Controller → Service
      │  Prisma Client (adapter-pg)
      ▼
PostgreSQL 16  (prisma migrate deploy lúc khởi động container)
```

## 2. Cấu trúc module backend

`AppModule` (`src/app.module.ts`) gom các module sau; `HealthController` được khai báo trực tiếp ở `AppModule` vì chỉ có một endpoint.

| Module | Thư mục | Trách nhiệm | Endpoint chính |
| --- | --- | --- | --- |
| `ConfigModule` (global) | – | Nạp biến môi trường cho mọi module | – |
| `PrismaModule` (global) | `src/prisma` | `PrismaService` mở/đóng kết nối khi module khởi tạo/hủy; `seed.ts` nạp dữ liệu mẫu | – |
| `AuthModule` | `src/auth` | Đăng ký, đăng nhập, `/auth/me`; JWT + Passport; băm mật khẩu bằng `bcryptjs` (cost 10) | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| `ProductsModule` | `src/products` | Thực đơn, chi tiết món kèm size/topping; cờ `available` tính từ tồn kho nguyên liệu | `GET /products`, `GET /products/:id` |
| `OrdersModule` | `src/orders` | Tạo đơn, hủy đơn, lịch sử đơn, màn hình quầy, đổi trạng thái, tự hủy đơn quá hạn | `POST /orders`, `GET /orders`, `GET /orders/me`, `GET /orders/:id`, `POST /orders/:id/cancel`, `PATCH /orders/:id/status`, `GET /staff/orders` |
| `PaymentsModule` | `src/payments` | Thanh toán Ví/Thẻ mô phỏng và VNPay sandbox | `POST /payments`, `POST /payments/vnpay`, `GET /payments/vnpay/ipn`, `GET /payments/vnpay/return` |
| `HealthController` | `src/health` | Kiểm tra API và PostgreSQL | `GET /health` |

Thư mục `src/common` chứa mã dùng chung: `current-user.ts` (decorator `@CurrentUser`, `JwtAuthGuard`, `@Roles` + `RolesGuard`) và hai nhóm hàm thuần (không phụ thuộc framework, có unit test): `pricing.ts` (giá một ly = giá gốc + phụ thu size + giá topping) và `inventory.ts` (tính nguyên liệu cần = (công thức × hệ số size + topping) × số ly, và phát hiện thiếu hàng).

**Phân tầng trong mỗi module:** Controller chỉ nhận request, gắn guard và DTO; Service chứa nghiệp vụ và transaction; Prisma là tầng truy cập dữ liệu. `PaymentsModule` import `OrdersModule` vì dùng chung quy tắc trạng thái đơn (`UNPAID`, `changeOrderStatus`).

### Các quyết định thiết kế đáng chú ý

- **Server không tin giá từ client.** `CreateOrderDto` chỉ nhận `productId`, `sizeId`, `toppingIds`, `quantity` (1–20 mỗi dòng, tối đa 50 dòng mỗi đơn). Giá và nguyên liệu được tính lại theo dữ liệu trong DB; `ValidationPipe` với `whitelist` + `forbidNonWhitelisted` từ chối mọi trường lạ, kể cả trường giá.
- **Tạo đơn nằm trong một transaction:** khóa các dòng `Ingredient` bằng `SELECT … FOR UPDATE` (sắp theo `id` để tránh deadlock) → kiểm tra đủ kho → trừ kho → tạo `Order` + `OrderItem` + dòng lịch sử đầu tiên. Thiếu nguyên liệu trả `409` kèm danh sách `shortages`; lỗi ở bước nào cũng rollback nên kho không bị trừ. Dòng `Order.ingredientUsage` (JSON) ghi lượng đã trừ để hoàn kho đúng khi hủy.
- **Một hàm duy nhất đổi trạng thái đơn.** `changeOrderStatus` (`order-status.ts`) khóa dòng `Order`, chỉ đổi nếu trạng thái hiện tại thuộc tập `from` cho phép, rồi ghi `OrderStatusHistory` trong cùng transaction. Nhờ vậy hai request đồng thời không thể cùng đổi một đơn, và mọi lần đổi đều có dấu vết (ai, lúc nào, lý do: `ORDER_CREATED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `STAFF_UPDATE`, `CUSTOMER_CANCEL`, `AUTO_EXPIRED`; `changedById = null` khi hệ thống tự đổi).
- **Vòng đời đơn:** `PENDING_PAYMENT` → `PAID` → `PREPARING` → `READY` → `COMPLETED`; nhánh `PAYMENT_FAILED` (còn thanh toán lại được) và `CANCELLED` (hoàn kho). Nhân viên chỉ được đẩy đơn đi tiếp đúng thứ tự (`NEXT_STATUS`); khách chỉ hủy được đơn chưa thanh toán xong (`UNPAID`).
- **Phân quyền:** JWT stateless (`sub`, `email`, `role`; hạn mặc định `1d`, đổi bằng `JWT_EXPIRES_IN`). Hai vai trò `CUSTOMER` và `STAFF`; `RolesGuard` chặn khách khỏi `PATCH /orders/:id/status` và `GET /staff/orders` (403). Khách chỉ xem đơn của mình, nhân viên xem mọi đơn; tên người thực hiện trong lịch sử trạng thái chỉ trả cho nhân viên. Chỉ chủ đơn mới được hủy đơn, kể cả nhân viên cũng không hủy hộ.
- **Tự hủy đơn quá hạn** (`OrderExpiryService`): chạy bằng `setInterval` trong tiến trình API (mặc định mỗi 60 giây; `0` = tắt), hủy đơn `PENDING_PAYMENT`/`PAYMENT_FAILED` tạo quá 15 phút, hoàn kho, ghi `AUTO_EXPIRED`. Có cờ `running` để không chạy chồng lượt quét, xử lý tối đa 100 đơn mỗi lượt, bỏ qua đơn đang có giao dịch VNPay `PENDING` còn hiệu lực. Chạy nhiều instance vẫn an toàn vì mỗi đơn chỉ hủy được một lần nhờ khóa dòng.

## 3. PostgreSQL và migration

### 3.1. Mô hình dữ liệu

Schema ở `apps/api/prisma/schema.prisma`, gồm 9 bảng:

| Nhóm | Bảng | Ghi chú |
| --- | --- | --- |
| Người dùng | `User` | `email` duy nhất; `role`; `walletBalance` (ví mô phỏng, mặc định 1.000.000đ) |
| Danh mục | `Product`, `Size`, `Topping` | `Size.recipeMultiplier` (S=1, M=1.25, L=1.5); `Product.isActive` để ngừng bán |
| Kho | `Ingredient`, `ProductIngredient` | Công thức là khóa chính ghép (`productId`, `ingredientId`); `Topping` trỏ tới một nguyên liệu và lượng dùng mỗi phần |
| Đơn hàng | `Order`, `OrderItem`, `OrderStatusHistory` | `OrderItem` lưu bản chụp tên món, size, topping, đơn giá lúc đặt và **không có khóa ngoại tới `Product`**, nên đổi giá/ngừng bán không làm đổi đơn cũ |
| Thanh toán | `Payment` | `txnRef` duy nhất, `idempotencyKey` duy nhất, `cardLast4` |

Quy ước kiểu dữ liệu: tiền là số nguyên VNĐ (`Int`), không dùng số thực; lượng nguyên liệu dùng `Decimal(12,2)`. Enum `Role`, `OrderStatus`, `PaymentStatus` là kiểu enum của PostgreSQL. Khóa ngoại của `OrderItem`, `Payment`, `OrderStatusHistory`, `ProductIngredient` dùng `ON DELETE CASCADE`; `OrderStatusHistory.changedById` dùng `SET NULL`. Chỉ mục: `Order(userId)`, `Order(status, createdAt)` (phục vụ màn hình quầy và quét đơn quá hạn), `Payment(orderId)`, `OrderStatusHistory(orderId)`.

### 3.2. Lịch sử migration

Thư mục `apps/api/prisma/migrations` có 6 migration, được commit vào Git và review qua PR như mã nguồn:

| Migration | Nội dung |
| --- | --- |
| `20261110000000_init` | Tạo enum, toàn bộ bảng, khóa ngoại, chỉ mục và ràng buộc `CHECK (quantity >= 0)` cho `Ingredient` |
| `20261110120000_drop_cart_item` | Xóa bảng `CartItem` vì giỏ hàng chuyển sang frontend |
| `20261110210000_payment_failed_idempotency_key` | Thêm giá trị enum `PAYMENT_FAILED`; thêm cột `Payment.idempotencyKey` kèm chỉ mục `UNIQUE` |
| `20261111090000_wallet_card_payment` | Thêm `User.walletBalance` (lúc đó mặc định 200.000đ) và `Payment.cardLast4` |
| `20261113090000_order_status_history` | Tạo bảng `OrderStatusHistory`; thêm chỉ mục `Order(status, createdAt)` |
| `20261117090000_wallet_default_1m` | Đổi mặc định `walletBalance` thành 1.000.000đ; tài khoản đã có giữ nguyên số dư |

### 3.3. Quy trình áp dụng migration

- **Phát triển:** `npm run migrate:dev` (`prisma migrate dev`) sinh migration từ thay đổi schema.
- **Container/production:** `Dockerfile` của API chạy `npm run start:prod`, tức `prisma migrate deploy && node dist/main.js`. Lệnh này chỉ áp dụng các migration đã commit, không sinh migration mới và không reset dữ liệu. Migration lỗi thì API không khởi động, health check không đạt và nền tảng giữ bản cũ.
- **Nguyên tắc:** chỉ thêm migration mới, không sửa migration đã merge. Migration chỉ tiến lên; pipeline CD ghi rõ khi rollback ứng dụng thì migration không tự hoàn tác, nên thay đổi phá vỡ (đổi tên/xóa cột) cần làm hai bước qua hai bản phát hành.
- **Ràng buộc nằm ngoài schema Prisma:** `CHECK (quantity >= 0)` chỉ có trong SQL của migration `init`, `schema.prisma` không biểu diễn được. Đây là lớp bảo vệ cuối cùng để kho không bao giờ âm, nên khi dựng DB phải dùng migration chứ không dùng `prisma db push`.

### 3.4. Seed dữ liệu

`seed()` (`src/prisma/seed.ts`) tạo 10 nguyên liệu, 5 đồ uống kèm công thức, 3 size (S/M/L), 3 topping và một tài khoản `STAFF` (`staff@brewlite.local`, mật khẩu lấy từ `STAFF_PASSWORD`). Hàm chạy trong một transaction và **chỉ chạy khi bảng `Product` còn trống**, nên khởi động lại không nhân đôi dữ liệu. `main.ts` gọi seed khi `AUTO_SEED=true`; cũng có thể chạy tay bằng `npm run seed`. Seed khi khởi động được chọn vì gói Render miễn phí không có pre-deploy command (ADR-003).

### 3.5. Kiểm soát đồng thời bằng khóa dòng

Các thao tác nhạy cảm đều dùng `SELECT … FOR UPDATE` trong transaction: khóa `Ingredient` khi đặt đơn, khóa `Order` khi đổi trạng thái hoặc thanh toán, khóa `User` khi trừ ví. Integration test kiểm tra hai kịch bản: 20 yêu cầu đặt đơn đồng thời khi tồn kho chỉ đủ 5 đơn thì đúng 5 đơn thành công và kho không âm; 5 request thanh toán cùng key (hoặc 2 request khác key) chỉ tạo đúng 1 giao dịch.

## 4. Thanh toán mô phỏng

### 4.1. Phạm vi và nguyên tắc

Thanh toán chính của hệ thống là **Ví** và **Thẻ mô phỏng** (`POST /payments`, `MockPaymentsController`/`MockPaymentsService`). Không gọi ngân hàng hay cổng thật; kết quả được quyết định bằng quy tắc cố định trong `mock-payment.ts` nên demo và test lặp lại được, không cần mạng hay tài khoản merchant. VNPay sandbox được giữ như phương thức bổ sung (mục 4.5).

Request cần JWT và header `Idempotency-Key`; body gồm `orderId`, `method` (`WALLET` hoặc `CARD`) và, với thẻ, đối tượng `card` gồm `number` (16 số), `expiry` (`MM/YY`), `cvv` (3 số). Các định dạng này được kiểm tra ở DTO.

### 4.2. Quy tắc quyết định kết quả

| Phương thức | Điều kiện | Kết quả |
| --- | --- | --- |
| Ví | `walletBalance >= totalAmount` | Thành công, trừ ví |
| Ví | Số dư không đủ | Thất bại `WALLET_INSUFFICIENT_BALANCE` |
| Thẻ | `4111111111111111`, `5555555555554444` | Thành công |
| Thẻ | `4000000000000002` | Thất bại `CARD_DECLINED` |
| Thẻ | `4000000000009995` | Thất bại `CARD_INSUFFICIENT_FUNDS` |
| Thẻ | Số thẻ khác (đúng định dạng) | Thất bại `CARD_NOT_SUPPORTED` |

Chỉ **số thẻ** quyết định kết quả; hạn thẻ và CVV chỉ cần đúng định dạng và không ảnh hưởng kết quả, để demo nhập hạn thẻ nào cũng được. Mã `CARD_EXPIRED` vẫn còn trong bảng thông báo để trả đúng nội dung cho các giao dịch cũ.

### 4.3. Luồng xử lý trong một transaction

1. Tra `Payment` theo `Idempotency-Key`; nếu đã có thì trả lại kết quả cũ (bước 7).
2. Kiểm tra đơn thuộc về người gọi, nếu không trả `404`.
3. Khóa dòng `Order` (`FOR UPDATE`) và đọc lại; đơn không còn ở trạng thái chờ thanh toán thì trả `409`.
4. Với ví: khóa dòng `User`, so số dư với tổng tiền, thành công thì `decrement` `walletBalance`.
5. Tạo `Payment` với `status` `SUCCESS`/`FAILED`, `responseCode` (`00` hoặc mã lỗi), `txnRef` dạng `WALLET-<orderId>-<8 ký tự UUID>`, `paidAt`, và `cardLast4` nếu là thẻ.
6. Đổi trạng thái đơn qua `changeOrderStatus`: thành công → `PAID` (`PAYMENT_SUCCESS`); thất bại → `PAYMENT_FAILED` (`PAYMENT_FAILED`). Thất bại **giữ nguyên kho** để khách thanh toán lại hoặc tự hủy đơn để hoàn kho.
7. Trả `paymentId`, `orderStatus`, `paymentStatus`, `errorCode`, `message`, kèm `cardLast4` (thẻ) hoặc `walletBalance` mới (ví).

Thất bại vẫn trả **HTTP 200** với `paymentStatus = FAILED` và `errorCode`, thay vì 402, để gửi lặp cùng key luôn nhận đúng kết quả lần đầu.

### 4.4. Idempotency và an toàn dữ liệu

- **Idempotency-Key bắt buộc** (8–100 ký tự: chữ, số, `-`, `_`), thiếu hoặc sai định dạng trả `400` (`requireIdempotencyKey`). Frontend sinh một key mới cho mỗi lượt bấm thanh toán và gửi lại y nguyên khi retry.
- Key lưu ở `Payment.idempotencyKey` với ràng buộc `UNIQUE`. Gửi lại cùng key → trả lại giao dịch cũ, không trừ tiền lần hai. Key đã dùng cho đơn, người dùng hoặc phương thức khác → `409`.
- Hai request cùng key chạy đồng thời: request sau vướng lỗi `P2002` của Prisma, bắt lỗi rồi trả kết quả của request trước.
- Khóa dòng `Order` ngăn hai lần bấm khác key cùng thanh toán một đơn.
- **Không lưu dữ liệu thẻ đầy đủ:** DB chỉ có `cardLast4`; số thẻ đầy đủ, hạn thẻ và CVV không được ghi vào bảng nào. Integration test kiểm tra điều này trực tiếp trên DB.
- Ví mô phỏng: mỗi tài khoản mới được cấp 1.000.000đ để thử thanh toán; `walletBalance` được trả trong `register`, `login` và `/auth/me` để frontend hiển thị số dư.

### 4.5. VNPay sandbox (phương thức bổ sung)

`POST /payments/vnpay` tạo giao dịch `PENDING` và trả `paymentUrl` đã ký HMAC-SHA512; `GET /payments/vnpay/ipn` (VNPay gọi) và `GET /payments/vnpay/return` (frontend chuyển tiếp) cùng dùng `handleVnpayResult`: kiểm tra chữ ký bằng `timingSafeEqual`, khớp `txnRef` và số tiền (×100), và chỉ xử lý giao dịch còn `PENDING` bằng `UPDATE … WHERE status = 'PENDING'`, nên gọi lặp trả mã `02` mà không xử lý lần hai. Đơn đã bị hủy trước đó thì không chuyển sang `PAID`, nhưng giao dịch `SUCCESS` vẫn được ghi để đối soát. Thiếu `VNPAY_TMN_CODE`/`VNPAY_HASH_SECRET` thì chỉ các endpoint VNPay trả `503`; Ví/Thẻ mô phỏng vẫn chạy.

## 5. Cấu hình, health check và logging

### 5.1. Quản lý cấu hình

Mọi cấu hình đi qua **biến môi trường**, nạp bằng `ConfigModule.forRoot({ isGlobal: true })`.

- **Biến bắt buộc** đọc bằng `getOrThrow`: `DATABASE_URL` (`PrismaService`) và `JWT_SECRET` (`AuthModule`, `JwtStrategy`). Thiếu thì API không khởi động, nên lỗi lộ ra ngay lúc deploy thay vì khi có người đăng nhập.
- **Biến tùy chọn có mặc định:** `PORT` (3001), `JWT_EXPIRES_IN` (`1d`), `ORDER_PAYMENT_TIMEOUT_MINUTES` (15), `ORDER_EXPIRY_CHECK_INTERVAL_SECONDS` (60; `0` = tắt), `VNPAY_URL`, `VNPAY_RETURN_URL`. Hàm `readIntSetting` dùng giá trị mặc định khi biến trống hoặc sai định dạng thay vì làm sập API.
- **Biến điều khiển hành vi:** `CORS_ORIGIN` (danh sách origin cách nhau bằng dấu phẩy), `AUTO_SEED`, `STAFF_PASSWORD`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`.
- **Mẫu và nơi đặt giá trị:** `.env.example` ở gốc (cho Docker Compose) và `apps/api/.env.example` (chạy API trực tiếp) chỉ chứa giá trị mẫu; `.env` thật không commit. `docker-compose.yml` tự dựng `DATABASE_URL` từ ba biến `POSTGRES_*`. Production đặt biến trong Render; pipeline CD dùng GitHub Secrets/Variables (`RENDER_*_DEPLOY_HOOK`, `RENDER_API_KEY`, `NEXT_PUBLIC_API_URL`, `PRODUCTION_WEB_URL`). `NEXT_PUBLIC_API_URL` của frontend được truyền vào lúc build image, không phải lúc chạy.
- **Thiết lập chung** (`setup-app.ts`, dùng cho cả `main.ts` lẫn test để test chạy đúng như production): `helmet()`, CORS theo `CORS_ORIGIN`, `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`.

### 5.2. Health check

`GET /health` (không cần xác thực) chạy `SELECT 1` qua Prisma:

- Thành công: `200 { status: "ok", db: "up", uptime }` (`uptime` tính bằng giây).
- Mất kết nối DB: `503 { status: "error", db: "down" }`.

Một endpoint dùng chung cho ba mục đích: `healthcheck` của service `api` trong `docker-compose.yml` (service `web` chỉ khởi động khi `api` healthy), Health Check Path của Render, và bước smoke test sau deploy trong `cd.yml` (kiểm tra `.status == "ok" and .db == "up"`, rồi gọi `/products` và trang web, có retry 20 lần để chịu được dịch vụ miễn phí khởi động lại). Container `db` cũng có `healthcheck` riêng (`pg_isready`), và `api` chỉ chạy khi `db` healthy.

### 5.3. Logging

- Dùng `Logger` có sẵn của NestJS, ghi ra stdout/stderr; Docker và Render tự thu log, container không ghi file log.
- Hiện có logger theo tên class ở `OrderExpiryService`: ghi `log` khi tự hủy đơn (số đơn và mã đơn đã hoàn kho) và `error` khi lượt quét lỗi. Lỗi chưa xử lý trong request do bộ lọc ngoại lệ mặc định của NestJS xử lý và ghi log.
- `seed.ts` khi chạy bằng dòng lệnh dùng `console.log`/`console.error`.
- Quy tắc không ghi dữ liệu nhạy cảm: mật khẩu, JWT, `JWT_SECRET`, `DATABASE_URL`, dữ liệu thẻ; thẻ mô phỏng chỉ lưu 4 số cuối.
- **Chưa có:** log theo từng request (method, đường dẫn, mã trạng thái, thời gian xử lý, `requestId`) và log dạng JSON. ADR-010 ghi đây là hạn chế đã biết; hướng mở rộng là thêm interceptor ghi log request và chuyển sang `pino`.

## 6. Kiểm thử và tích hợp liên tục (liên quan đến backend)

- **Unit test** (`src/**/*.spec.ts`): `pricing`, `inventory`, `idempotency`, `mock-payment`, `vnpay`, `order-expiry`.
- **Integration test** (`test/flow.int-spec.ts`): chạy trên **PostgreSQL thật**, `--runInBand`, bao phủ luồng đặt đơn, tồn kho đồng thời, thanh toán Ví/Thẻ/VNPay, idempotency, hủy đơn, lịch sử trạng thái, màn hình quầy và tự hủy đơn quá hạn.
- **CI** (`ci.yml`): lint, unit test và build cho `api` và `web` trên mỗi PR và push vào `main`. **CD** (`cd.yml`): lint/test/build → build và đẩy image lên GHCR (tag `sha-<7 ký tự>`, `latest`, tag phiên bản) → deploy lên Render nếu `CD_DEPLOY_ENABLED=true` → chờ Live → smoke test → gắn tag `stable`; lỗi thì quay lui về `stable`.
