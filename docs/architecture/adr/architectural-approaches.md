# BrewLite – Mô tả kiến trúc (backend, dữ liệu, thanh toán, vận hành)

**Phạm vi:** Task 3.1 – backend theo module, PostgreSQL và migration, thanh toán mô phỏng, logging/health check/quản lý cấu hình **Phiên bản:** 1.0 – Assignment 2 **Nguồn:** mã nguồn `brewlite_hk1` (thư mục `backend/`, `prisma/`, `docker-compose.yml`). Phần frontend Next.js/PWA và deployment diagram viết riêng.

## 1. Phương pháp và tổng quan

BrewLite theo **kiến trúc phân lớp, monolith chia module** (modular monolith). Một ứng dụng NestJS duy nhất, mỗi miền nghiệp vụ là một module, trong module đi theo chuỗi `Controller → Service → Prisma → PostgreSQL`. Controller chỉ nhận request, kiểm tra dữ liệu và gọi service. Service giữ toàn bộ quy tắc nghiệp và transaction. Prisma là lớp truy cập dữ liệu duy nhất.

### 1.1 Các container (C4 mức 2)

| Container | Công nghệ | Cổng | Trách nhiệm | Thư mục mã nguồn |
| --- | --- | --- | --- | --- |
| Web | Next.js 16, React 19, React Query, Zustand | 3000 | Giao diện khách hàng và back-office, giỏ hàng phía client | `frontend/` |
| API | NestJS 12, TypeScript, Prisma 6 | 3001 | Nghiệp vụ, xác thực JWT, đặt đơn, thanh toán, kho nguyên liệu | `backend/src/` |
| Database | PostgreSQL 16, volume `pgdata` | 5432 | Dữ liệu bền vững, giao dịch, khóa dòng | `backend/prisma/` |
| Mock Gateway | Class `MockGateway` chạy cùng tiến trình API | Không có | Mô phỏng cổng thanh toán Ví/Thẻ | `backend/src/payments/mock-gateway.ts` |

Web gọi API bằng HTTP/JSON, địa chỉ lấy từ `NEXT_PUBLIC_API_URL` tại thời điểm build. API nối PostgreSQL qua `DATABASE_URL`.

### 1.2 Thiết lập dùng chung (tầng chéo)

Cấu hình trong `main.ts`:

- `ValidationPipe` toàn cục với `whitelist: true` (bỏ trường lạ, chặn tự cấp `role`) và `transform: true` (ép kiểu theo DTO).
- CORS chỉ cho một origin lấy từ `CORS_ORIGIN`, mặc định `http://localhost:3000`.
- `JwtAuthGuard` (Passport JWT) xác thực, `RolesGuard` và decorator `@Roles(...)` phân quyền `CUSTOMER` / `ADMIN`.
- Lỗi nghiệp vụ dùng exception chuẩn của Nest (`BadRequest`, `Conflict`, `Forbidden`, `NotFound`), thông báo tiếng Việt, frontend hiện trực tiếp.

## 2. Backend theo module

`AppModule` nạp `ConfigModule` (global), `PrismaModule` (global) và 6 module nghiệp vụ.

| Module | Trách nhiệm | Endpoint chính | Phụ thuộc |
| --- | --- | --- | --- |
| `PrismaModule` | Cung cấp `PrismaService` (kết nối khi khởi động, chặn dùng nhầm CSDL khi test) | Không có | Không |
| `ProductsModule` | Menu và chi tiết sản phẩm đang bán | `GET /products`, `GET /products/:id` | Prisma |
| `AuthModule` | Đăng ký, đăng nhập, cấp và xác minh JWT, guard và vai trò | `POST /auth/register`, `POST /auth/login` | Prisma, JWT, Config |
| `OrdersModule` | Tạo đơn, giữ chỗ nguyên liệu, hủy đơn, xem đơn, máy trạng thái đơn | `POST /orders`, `GET /orders/me`, `GET /orders/:id`, `POST /orders/:id/cancel` | Inventory |
| `PaymentsModule` | Thanh toán mô phỏng, idempotency, hoàn tất đơn | `POST /payments` | Inventory, `MockGateway` |
| `InventoryModule` | Nguyên liệu, định lượng công thức, giữ chỗ và trừ kho, báo cáo xuất-nhập-tồn, kiểm tra khả năng pha chế | `GET /inventory/product-availability/:id` (công khai), các endpoint `/inventory/*` còn lại (ADMIN) | Prisma |
| `AdminModule` | Quản lý món, tải ảnh, khuyến mãi, báo cáo doanh thu | `/admin/products`, `/admin/promotions`, `/admin/reports/revenue` (ADMIN) | Prisma |

**Quan hệ giữa module.** `Orders` và `Payments` đều phụ thuộc `Inventory`. `Orders` dùng `InventoryCalculationService` để quy đổi giỏ hàng ra nhu cầu nguyên liệu. `Payments` dùng `InventoryService` để trừ kho khi thanh toán thành công và để hết hạn giữ chỗ. `Payments` còn dùng hàm `assertTransition` của `Orders` (nhập trực tiếp từ `orders/order-state.ts`, chưa qua module). Không có phụ thuộc vòng.

### 2.1 Máy trạng thái đơn hàng

Chỉ các chuyển trạng thái trong bảng dưới được phép. Các chuyển khác bị `assertTransition` từ chối với 400.

| Từ | Được chuyển sang |
| --- | --- |
| `PENDING` | `PAID`, `PAYMENT_FAILED`, `CANCELLED` |
| `PAYMENT_FAILED` | `PENDING` (thử lại), `CANCELLED` |
| `PAID` | `PREPARING`, `CANCELLED` |
| `PREPARING` | `READY` |
| `READY` | `COMPLETED` |
| `COMPLETED`, `CANCELLED` | Trạng thái kết thúc |

### 2.2 Luồng tạo đơn và giữ chỗ nguyên liệu

1. Kiểm tra DTO: 1 đến nhiều dòng, mỗi dòng `productId`, `size` thuộc S/M/L, `toppings` thuộc danh mục, `qty` từ 1 đến 20.
2. Máy chủ nạp sản phẩm, tính `subtotal` từ giá gốc và phụ thu (không tin giá từ client).
3. Nếu có mã khuyến mãi: kiểm tra tồn tại, đang bật, trong thời gian hiệu lực, còn lượt, đủ giá trị tối thiểu. Giảm giá = `floor(subtotal × percent / 100)`.
4. `aggregateRequirements` quy đổi toàn giỏ hàng thành tổng nhu cầu từng nguyên liệu từ công thức theo size và công thức topping.
5. Một **transaction** duy nhất: khóa các dòng nguyên liệu bằng `SELECT ... FOR UPDATE` theo `id` tăng dần (tránh deadlock), kiểm tra `stock − reservedQty ≥ nhu cầu` (thiếu thì trả 409), tăng `reservedQty`, rồi tạo `Order` trạng thái `PENDING` cùng `OrderItem` và `OrderIngredientReservation` (`RESERVED`).
6. `reservationExpiresAt` = thời điểm tạo + 10 phút. Quá hạn thì đơn bị hủy và nguyên liệu được trả lại.

Mô hình «giữ chỗ rồi mới trừ»: tạo đơn chỉ làm tăng `reservedQty`. Khi thanh toán thành công mới trừ `stock` thật, ghi `InventoryMovement` loại `CONSUMPTION` và chuyển reservation sang `CONSUMED`. Hủy đơn trước khi pha chế sẽ trả lại nguyên liệu: đơn `PENDING` hoặc `PAYMENT_FAILED` giảm `reservedQty`, đơn `PAID` cộng lại `stock` và ghi `STOCK_IN`.

## 3. PostgreSQL và migration

### 3.1 Mô hình dữ liệu

Truy cập bằng Prisma ORM, schema tại `backend/prisma/schema.prisma`. Có 11 bảng và 6 enum.

| Nhóm | Bảng | Ghi chú thiết kế |
| --- | --- | --- |
| Danh mục | `Product` | `price` là số nguyên VND. `isActive` ẩn/hiện món. Index trên `isActive`, `category`. |
| Người dùng | `User` | `email` unique, `passwordHash`, `role`, `loyaltyPoints` (số dư điểm, chưa có bảng lịch sử). |
| Đơn hàng | `Order`, `OrderItem` | `Order` có `status`, `total`, `discount`, `promoCode`, `reservationExpiresAt`. `OrderItem.toppings` là mảng chuỗi, `lineTotal` lưu sẵn. |
| Thanh toán | `Payment` | `idempotencyKey` **unique** là chốt chặn xử lý trùng. Lưu `amount`, `method`, `status`. |
| Khuyến mãi | `Promotion` | Khóa chính là `code`. Có `percent`, `minOrderValue`, `usageLimit`, `usedCount`, `startDate`, `endDate`. `Order.promoCode` chỉ là chuỗi, không có khóa ngoại. |
| Kho | `Ingredient`, `RecipeItem`, `ToppingRecipe` | Số lượng dùng `Decimal(12,2)`. `RecipeItem` unique theo (sản phẩm, size, nguyên liệu). `ToppingRecipe` unique theo (topping, nguyên liệu). |
| Giữ chỗ và sổ kho | `OrderIngredientReservation`, `InventoryMovement` | Reservation unique theo (đơn, nguyên liệu). Movement ghi `type`, `quantity`, `balanceAfter`, `reason` để đối soát. |

Enum: `Role`, `OrderStatus`, `PaymentMethod` (`WALLET`, `CARD`), `PaymentStatus` (`SUCCESS`, `FAILED`), `ReservationStatus` (`RESERVED`, `CONSUMED`, `RELEASED`), `MovementType` (`STOCK_IN`, `CONSUMPTION`, `ADJUSTMENT`, `RELEASE_EXPIRED`).

Các quyết định dữ liệu đáng chú ý: tiền dùng số nguyên để tránh sai số dấu phẩy động; chống oversell bằng khóa dòng chứ không bằng cột `version` (cột này được tăng khi cập nhật nhưng chưa dùng để so sánh); các bảng con dùng `onDelete: Cascade` hoặc `Restrict` tùy mức quan trọng.

### 3.2 Migration

Dùng Prisma Migrate. Mỗi thay đổi schema là một thư mục SQL được commit trong `backend/prisma/migrations/`, phát triển bằng `prisma migrate dev`, áp dụng lên môi trường khác bằng `prisma migrate deploy`.

| Migration | Nội dung |
| --- | --- |
| `20261020091929_init` | Tạo `Product`, `User`, `Order`, `OrderItem`, `Payment`, `Promotion` và enum trạng thái, thanh toán |
| `20261102134435_add_ingredient_inventory` | Thêm `Role`, `User.role`, hạn giữ chỗ trên `Order`, toàn bộ bảng kho, công thức, reservation, movement |
| `20261102141404_add_product_is_active` | Thêm `Product.isActive` và index |
| `20261109061609_expand_promotions_and_backoffice` | Mở rộng `Promotion`: thời gian hiệu lực, giới hạn lượt, giá trị tối thiểu |
| `20261109072128_add_product_category` | Thêm `Product.category` và index |

**Seed** (`prisma/seed.ts`, lệnh `prisma db seed`) tạo 6 món, mã `BREW10`, tài khoản admin, nguyên liệu, công thức món và topping. Seed được viết theo hướng chạy lại được (kiểm tra tồn tại trước khi tạo, không reset tồn kho đã có) nhưng có bước dọn dẹp xóa dữ liệu ngoài danh sách (xem mục 7).

**Khởi động container API** chạy `npx prisma migrate deploy && npx prisma db seed && node dist/main.js`. Nhờ vậy một CSDL trống được tái tạo đầy đủ bằng `docker compose up`, đáp ứng yêu cầu migration/seed tái tạo được của Task 5.2.

**Cách ly CSDL test.** `PrismaService` từ chối khởi động khi `NODE_ENV=test` mà `DATABASE_URL` không chứa `_test`. `.env.test` trỏ tới `brewlite_test`, tránh test làm hỏng CSDL phát triển.

## 4. Thanh toán mô phỏng

### 4.1 Thành phần

`MockGateway.charge(amount, method, simulateFail)` chờ 300 ms rồi trả `{ ok: !simulateFail }`. Phương thức `WALLET` và `CARD` không khác nhau về xử lý, chỉ được lưu vào `Payment.method`. Trường `simulateFail` trong body `POST /payments` dùng để demo nhánh thất bại. Gateway là provider riêng nên có thể thay bằng cổng thật (Momo, VNPay, Stripe) mà không đổi `PaymentsService`.

### 4.2 Luồng `POST /payments`

Yêu cầu có JWT và header `Idempotency-Key` (thiếu thì 400).

1. **Idempotency.** Nếu `idempotencyKey` đã có trong bảng `Payment`: khác chủ đơn thì 403, dùng cho đơn khác thì 409, còn lại trả **lại kết quả cũ, không xử lý lại**.
2. **Kiểm tra đơn.** Không tồn tại (404), không phải của người gọi (403), đã hủy (400), đã thanh toán (400), quá hạn giữ chỗ (hủy đơn, trả nguyên liệu, 400).
3. **Thử lại.** Đơn `PAYMENT_FAILED` được đưa về `PENDING` rồi thanh toán lại với key mới.
4. **Gọi gateway** (ngoài transaction để không giữ khóa lâu). Kết quả quy định trạng thái đích `PAID` hoặc `PAYMENT_FAILED`.
5. **Transaction ghi nhận:** tạo `Payment`; cập nhật đơn bằng `updateMany` có điều kiện trạng thái cũ (nếu 0 dòng được sửa thì 409 «có yêu cầu khác đã xử lý»). Nếu thành công: trừ nguyên liệu đã giữ đúng 1 lần, tăng `usedCount` của mã khuyến mãi, cộng điểm thưởng `floor(total / 10.000)`.
6. **Race giữa hai request cùng key:** request chậm vi phạm unique (`P2002`), hệ thống đọc và trả kết quả của request đầu.

Kết quả trả về: `orderId`, `orderStatus`, `paymentStatus`. Test e2e `task10.e2e-spec.ts` xác nhận hai lần gửi cùng key chỉ tạo 1 payment và cộng điểm 1 lần, và 10 đơn đồng thời khi tồn kho chỉ đủ cho 5 thì đúng 5 đơn thành công.

## 5. Cấu hình, logging và health check

### 5.1 Quản lý cấu hình

Cấu hình đi qua biến môi trường (`ConfigModule.forRoot({ isGlobal: true })`). Có `.env.example` cho backend và frontend, `.env.test` cho test. `.env` bị `.gitignore`.

| Biến | Dùng cho | Mặc định | Ghi chú |
| --- | --- | --- | --- |
| `DATABASE_URL` | Prisma, `PrismaService` | Không | Bắt buộc |
| `JWT_SECRET` | Ký và xác minh JWT | Không | `getOrThrow`, thiếu thì ứng dụng không khởi động. Là secret. |
| `CORS_ORIGIN` | CORS | `http://localhost:3000` | Một origin |
| `PORT` | Cổng API | `3001` |  |
| `WEB_URL` | Sinh URL ảnh khi seed và upload | `http://localhost:3000` |  |
| `NODE_ENV` | `test` kích hoạt chặn dùng nhầm CSDL | Không |  |
| `NEXT_PUBLIC_API_URL` | Frontend gọi API | `http://localhost:3001` | **Build-time**, đổi URL phải build lại image web |

### 5.2 Logging

Hiện dùng `Logger` tích hợp của Nest, chỉ ở `InventoryService` (báo số đơn hết hạn được giải phóng lúc khởi động và lỗi dọn dẹp). Ngoài ra là log mặc định của Nest khi khởi động và khi có exception không xử lý. **Chưa có** log request, log sự kiện nghiệp vụ (tạo đơn, kết quả thanh toán), định dạng JSON hay mã tương quan request.

**Đề xuất cho Sprint 2:** log mỗi request (method, đường dẫn, mã trạng thái, thời gian xử lý, `requestId`), log JSON ra stdout để nền tảng đọc được, log sự kiện `order.created`, `payment.succeeded`, `payment.failed`, `reservation.expired`. Tuyệt đối không log mật khẩu, token, `JWT_SECRET` hay `DATABASE_URL` (đáp ứng «secret không xuất hiện trong log CI»).

### 5.3 Health check

Hiện **không có** `GET /health`. Route `GET /` chỉ trả «Hello World!» từ mã khởi tạo NestJS. Trong `docker-compose.yml` chỉ có healthcheck cho `db` (`pg_isready`), backend và frontend chưa có.

**Đề xuất (Task 5.2 yêu cầu):**

| Endpoint | Mục đích | Logic |
| --- | --- | --- |
| `GET /health` | Liveness | Trả 200 `{ status: "ok" }` khi tiến trình sống, không chạm CSDL |
| `GET /health/ready` | Readiness, smoke test sau deploy | Chạy `SELECT 1` qua Prisma, 200 nếu được, 503 nếu không |

Dùng cho `HEALTHCHECK` trong Dockerfile, `depends_on: condition: service_healthy` của compose và bước smoke test của pipeline CD.

## 6. Quyết định kiến trúc (ADR rút gọn)

Mỗi dòng nên trở thành một tệp trong `docs/architecture/adr/`. Các quyết định dưới đây đã được áp dụng trong code, ADR chỉ ghi lại lý do.

| ADR | Quyết định | Lý do | Đánh đổi |
| --- | --- | --- | --- |
| 001 | Một repository, thư mục `backend/` và `frontend/` (xem mục 7 về đổi tên) | Nhóm nhỏ, dễ chạy bằng một `docker compose` | Cần quy ước để CI/CD chạy từng phần |
| 002 | Modular monolith NestJS thay vì microservice | Ít người, transaction đơn-kho-thanh toán cần nhất quán trong một CSDL | Không scale từng module riêng |
| 003 | PostgreSQL + Prisma Migrate | Giao dịch ACID, `FOR UPDATE`, migration có phiên bản | Phải dùng `$queryRaw` cho khóa dòng |
| 004 | Giữ chỗ nguyên liệu 10 phút rồi mới trừ kho khi thanh toán | Không oversell, không trừ kho cho đơn không trả tiền | Phải có cơ chế dọn đơn quá hạn |
| 005 | `Idempotency-Key` bắt buộc, ràng buộc unique ở CSDL | Client gửi lại khi lỗi mạng không tạo thanh toán kép | Client phải quản lý key theo từng lần thử |
| 006 | Gateway mô phỏng trong cùng tiến trình | Đủ cho đồ án, không phụ thuộc bên ngoài | Không mô phỏng webhook, đối soát |
| 007 | JWT stateless, hạn 24 giờ | Đơn giản, không cần lưu phiên | Không thu hồi được token |
| 008 | Cấu hình bằng biến môi trường | Phù hợp Docker và nền tảng deploy | Frontend biết URL API từ lúc build |

**Ưu điểm chính:** logic nghiệp vụ tập trung, dễ kiểm thử; toàn vẹn dữ liệu tốt ở luồng tiền và kho; chi phí vận hành thấp. **Hạn chế:** một điểm lỗi duy nhất; khóa dòng tăng tranh chấp khi đơn rất đông; thiếu quan sát (logging, health) cho môi trường thật.

## 7. Điểm lệch và rủi ro cần xử lý trước khi triển khai

| # | Phát hiện | Rủi ro | Đề xuất |
| --- | --- | --- | --- |
| 1 | **Seed chạy mỗi lần container API khởi động** và có bước dọn dẹp: xóa sản phẩm ngoài danh sách 6 món nếu chưa có đơn, ẩn nếu đã có đơn, xóa nguyên liệu ngoài danh sách kèm sổ kho của chúng. | Món và nguyên liệu do admin tạo trên production có thể mất sau mỗi lần deploy. | Tách seed dữ liệu mẫu khỏi đường khởi động production, bỏ bước dọn dẹp. |
| 2 | Dọn đơn quá hạn giữ chỗ chỉ chạy lúc khởi động và khi chính đơn đó được thanh toán. Không có job định kỳ. | Đơn bị bỏ giữ `reservedQty` vô thời hạn, làm món báo «hết nguyên liệu» sai. | Thêm tác vụ định kỳ (ví dụ `@nestjs/schedule`, mỗi phút) gọi `expireReservationsCleanup`. |
| 3 | `OrdersService.changeStatus` (PAID → PREPARING → READY → COMPLETED) không có controller nào gọi. | Nhân viên quầy không đổi trạng thái được qua API, chưa đủ yêu cầu «quản lý trạng thái đơn». | Thêm endpoint (ví dụ `PATCH /admin/orders/:id/status`) cho `ADMIN`. |
| 4 | Upload ảnh ghi vào `../frontend/public/menu` theo đường dẫn tương đối. | Khi API và Web là hai container riêng, ảnh nằm trong container API và Web không phục vụ được, mất khi tạo lại container. | Dùng volume/object storage và trả ảnh qua API hoặc CDN. |
| 5 | Không có `/health`, log yêu cầu, healthcheck cho API và Web. | Không thể làm smoke test sau deploy. | Xem mục 5.2 và 5.3. |
| 6 | `docker-compose.yml` đặt thẳng `JWT_SECRET: change-me` và mật khẩu DB `brew`. Admin demo có mật khẩu cố định trong seed. | Không được dùng cho production. | Đọc từ secret của CI/nền tảng, đổi mật khẩu admin sau khi triển khai. |
| 7 | `simulateFail` nhận từ client ngay cả ở production. | Ai cũng có thể ép thanh toán thất bại cho đơn của mình, đáng ngại nếu gateway thật được nối. | Chỉ chấp nhận khi `NODE_ENV` khác `production`, hoặc qua biến môi trường. |
| 8 | Gateway được gọi trước khi ghi CSDL. | Với cổng thật, nếu ghi CSDL lỗi sau khi đã trừ tiền sẽ lệch dữ liệu. Với mock thì chưa ảnh hưởng. | Ghi ADR, cần đối soát/webhook khi thay cổng thật. |
| 9 | `usageLimit` khuyến mãi kiểm tra lúc tạo đơn nhưng chỉ tăng `usedCount` lúc thanh toán. | Nhiều đơn đồng thời có thể vượt giới hạn lượt dùng. | Kiểm tra lại trong transaction thanh toán hoặc giữ chỗ lượt dùng. |
| 10 | Cấu trúc repo là `backend/`, `frontend/`, thiếu `apps/api`, `apps/web`, `tests/`, `.github/workflows/`, `docs/requirements`, `docs/architecture`. Chỉ `Logger` và `ConfigService` dùng lẫn với `process.env`. | Lệch cấu trúc đề bài yêu cầu ở Task 4.1. | Đổi tên/chuyển thư mục bằng một PR riêng, cập nhật Dockerfile, compose và README. |
| 11 | Yêu cầu Task 2.3 có lớp `LoyaltyTransaction`, nhưng code chỉ lưu `User.loyaltyPoints`, không có bảng lịch sử điểm. | Class diagram và mô hình dữ liệu không khớp. | Thêm bảng `LoyaltyTransaction` (migration mới) hoặc ghi rõ là lệch có chủ ý. |
| 12 | Không thấy giới hạn tần suất, `helmet`, hoặc bảo vệ riêng cho endpoint công khai `product-availability`. | Rủi ro lạm dụng, dò mật khẩu. | Thêm `@nestjs/throttler` và `helmet` (cùng ADR bảo mật). |

## 8. Truy vết sang deployment diagram (Task 3.2)

| Thành phần deployment | Thành phần kiến trúc | Mã nguồn / cấu hình |
| --- | --- | --- |
| Container `web` | Next.js (mục 1.1) | `frontend/Dockerfile` |
| Container `api` | NestJS, 6 module (mục 2) | `backend/Dockerfile`, `src/` |
| Container/dịch vụ `db` + volume | PostgreSQL, migration (mục 3) | `docker-compose.yml`, `backend/prisma/` |
| Gateway thanh toán | `MockGateway` (mục 4) | `src/payments/mock-gateway.ts` |
| Biến môi trường, secret | Cấu hình (mục 5.1) | `.env.example`, secret của CI |
| Health check, log | Mục 5.2 và 5.3 (đề xuất) | Chưa có, cần thêm ở Sprint 2 |
