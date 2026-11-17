# BrewLite – Ma trận truy vết yêu cầu (Traceability Matrix)

> **Căn cứ:** `docs/requirements/srs.md` (SRS rút gọn, phiên bản 1.0 – Assignment 2, Task 1.2).
>
> **Nguyên tắc:** Giữ nguyên mã, tên và phạm vi FR/NFR trong SRS. Ma trận này không tự kết luận một yêu cầu đã hoàn thành chỉ vì có tên file hoặc endpoint dự kiến. Nhóm cần bổ sung đường dẫn code chính xác, tên sơ đồ thực tế, log test, commit SHA và URL triển khai làm minh chứng.

## 1. Quy ước trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| Có thành phần trong source | Đã xác định được file/module/cấu hình liên quan; chưa đồng nghĩa AC đã đạt |
| Đã chạy – đạt | Có log/báo cáo kiểm thử xác nhận toàn bộ tiêu chí liên quan |
| Chưa đạt | Đã chạy nhưng có ít nhất một tiêu chí thất bại |
| Chưa xác nhận | Chưa đủ source hoặc minh chứng để kết luận |
| Chưa chạy | Đã xác định kịch bản kiểm thử nhưng chưa có kết quả chạy |

## 2. Quy ước truy vết thiết kế

Các UC dưới đây lấy nguyên từ mục 7 của SRS:

| Mã UC | Use case | Actor | Yêu cầu liên quan |
|---|---|---|---|
| UC-01 | Xem menu và chi tiết sản phẩm | Khách vãng lai, Khách hàng | FR-01–FR-08 |
| UC-02 | Quản lý giỏ hàng | Khách vãng lai, Khách hàng | FR-10–FR-13 |
| UC-03 | Đăng ký / Đăng nhập | Khách hàng | FR-14–FR-18 |
| UC-04 | Đặt và thanh toán đơn hàng | Khách hàng, Payment Service | FR-19–FR-22, FR-24–FR-27, FR-29 |
| UC-05 | Xem lịch sử và theo dõi đơn | Khách hàng | FR-30–FR-32 |
| UC-06 | Xử lý và cập nhật trạng thái đơn | Nhân viên quầy | FR-33–FR-34 |
| UC-07 | Quản lý sản phẩm, khuyến mãi, báo cáo | Quản lý/Admin | FR-35–FR-38 |

Mã sơ đồ `ACT-xx`, `SEQ-xx`, `CLS-xx` trong bảng truy vết là mã tham chiếu gợi ý. Thay bằng tên/mã file thực tế trong `docs/diagrams/` nếu nhóm đang dùng quy ước khác. Không để mã sơ đồ giả định như thể sơ đồ đã tồn tại.

## 3. Ma trận truy vết yêu cầu chức năng

| Mã SRS | Yêu cầu (giữ nguyên SRS) | MoSCoW | Use case | Thiết kế cần liên kết | Code/API cần đối chiếu | Kiểm thử / tiêu chí chính | Trạng thái / minh chứng |
|---|---|---|---|---|---|---|---|
| FR-01 | Hiển thị danh sách menu các sản phẩm đang bán | Must | UC-01 | ACT-01, SEQ-01, CLS-01 | `apps/web` trang menu; API `GET /products` | API-T01, E2E-T01: trả đúng trường id/name/price/imageUrl/available; ẩn sản phẩm ngừng bán | Chưa xác nhận AC đầy đủ |
| FR-02 | Menu có trạng thái loading, empty và error | Must | UC-01 | ACT-01 | Trang menu, trạng thái tải/lỗi và thao tác thử lại | UNIT-T02, E2E-T02: loading, danh sách rỗng, lỗi 5xx/mất mạng, retry gọi lại API | Chưa xác nhận AC đầy đủ |
| FR-03 | Sản phẩm hết hàng được đánh dấu và không thể thêm vào giỏ | Must | UC-01, UC-02 | ACT-01, ACT-02, SEQ-01 | Menu, chi tiết sản phẩm, logic thêm giỏ/API liên quan | API-T03, E2E-T03: tồn kho 0 hiển thị hết hàng, chặn thêm; API trả 409 | Chưa xác nhận AC đầy đủ |
| FR-04 | Lọc menu theo danh mục | Should | UC-01 | ACT-01, SEQ-01 | API `GET /products?category=X`; bộ lọc danh mục frontend | API-T04, E2E-T04: kết quả đúng danh mục, UI cập nhật trong ≤1 giây theo seed | Chưa xác nhận |
| FR-05 | Tìm kiếm sản phẩm theo tên | Could | UC-01 | ACT-01 | API `GET /products?q=abc` nếu có; bộ lọc tìm kiếm frontend | UNIT-T05, API-T05: tìm không phân biệt hoa thường, empty khi không có kết quả | Chưa xác nhận |
| FR-06 | Xem chi tiết sản phẩm (mô tả, giá, size, topping khả dụng) | Must | UC-01 | ACT-02, SEQ-02, CLS-01 | Product detail page/modal; API `GET /products/:id` | API-T06, E2E-T06: dữ liệu đầy đủ; id sai trả 404; UI hiển thị đúng | Chưa xác nhận AC đầy đủ |
| FR-07 | Chọn size (S/M/L) với mức giá chênh lệch | Must | UC-01 | ACT-02, SEQ-02 | Product detail component và logic tính giá | UNIT-T07, E2E-T07: size mặc định, phụ thu chính xác, không chọn size ngoài danh sách | Chưa xác nhận AC đầy đủ |
| FR-08 | Chọn topping tùy chọn với giá phụ thu | Must | UC-01 | ACT-02, SEQ-02 | Product detail component; validation giới hạn topping ở API nếu có | UNIT-T08, API-T08: nhiều topping, tổng giá, giới hạn tối đa 5, API trả 400 khi vượt | Chưa xác nhận AC đầy đủ |
| FR-09 | Ghi chú cho món (đường, đá, lời nhắn) | Could | UC-01, UC-02, UC-04 | ACT-02, SEQ-02, CLS-01 | Product detail, cart item, OrderItem và màn hình nhân viên | UNIT-T09, API-T09: tối đa 200 ký tự, lưu và hiển thị ở màn hình nhân viên | Chưa xác nhận |
| FR-10 | Thêm món (kèm size, topping, số lượng) vào giỏ | Must | UC-02 | ACT-03, SEQ-03, CLS-01 | Cart utility/store, Product detail, cart drawer | UNIT-T10, E2E-T10: cấu hình khác nhau thành dòng riêng; cùng cấu hình cộng số lượng | Chưa xác nhận AC đầy đủ |
| FR-11 | Sửa số lượng và xóa món trong giỏ | Must | UC-02 | ACT-03, SEQ-03 | Cart utility/store, CartDrawer | UNIT-T11, E2E-T11: cập nhật thành tiền/tổng; xóa dòng; số lượng 1–20 | Chưa xác nhận AC đầy đủ |
| FR-12 | Tính tổng tiền giỏ hàng | Must | UC-02, UC-04 | SEQ-03, CLS-01 | Hàm tính giá cart; backend tính lại tổng đơn | UNIT-T12: ít nhất 5 bộ dữ liệu, số nguyên VND chính xác; giỏ rỗng tổng 0 và khóa đặt đơn | Chưa xác nhận đủ 5 bộ dữ liệu |
| FR-13 | Giữ giỏ hàng khi tải lại trang hoặc sau khi đăng nhập | Should | UC-02, UC-03 | ACT-03, SEQ-03 | Cart persistence/storage và luồng đăng nhập | UNIT-T13, E2E-T13: F5 không mất giỏ; đăng nhập không làm mất món | Chưa xác nhận |
| FR-14 | Đăng ký tài khoản bằng email và mật khẩu | Must | UC-03 | ACT-04, SEQ-04, CLS-01 | Web `/register`; API `POST /auth/register` | API-T14, E2E-T14: 201; email trùng 409; email/mật khẩu sai 400 và lỗi theo trường | Chưa xác nhận AC đầy đủ |
| FR-15 | Đăng nhập và cấp JWT | Must | UC-03 | ACT-04, SEQ-04 | Web `/login`; API `POST /auth/login`; auth/JWT service | API-T15, E2E-T15: đúng trả 200 và JWT có userId/role; sai trả 401 không tiết lộ trường sai | Chưa xác nhận AC đầy đủ |
| FR-16 | Đăng xuất và xử lý token hết hạn | Must | UC-03 | ACT-04, SEQ-04 | Auth client, logout, JWT guard/interceptor | UNIT-T16, API-T16: xóa token, về menu; token hết hạn trả 401 và UI không crash | Chưa xác nhận AC đầy đủ |
| FR-17 | Phân quyền theo vai trò (CUSTOMER, STAFF, ADMIN) | Must | UC-03, UC-05, UC-06, UC-07 | SEQ-04, SEQ-06, SEQ-07, CLS-01 | Role guard/authorization; API quản trị, staff và orders | API-T17: Customer/Staff/Admin truy cập đúng quyền; Customer không xem đơn người khác | Chưa xác nhận AC đầy đủ |
| FR-18 | Yêu cầu đăng nhập khi đặt đơn | Must | UC-03, UC-04 | ACT-04, ACT-05, SEQ-05 | Checkout/OrderConfirmationModal; auth state và redirect | E2E-T18: khách chưa đăng nhập chuyển login; đăng nhập xong quay lại checkout, giỏ còn nguyên | Có test frontend được báo cáo pass trước đây; cần chạy lại trên nhánh hiện tại |
| FR-19 | Tạo đơn hàng từ giỏ hàng | Must | UC-04 | `sequence-checkout.puml`, `activity-order-flow.puml`, `class-domain.puml` (Order, OrderItem) | `POST /orders` – `OrdersService.create` (`apps/api/src/orders/orders.service.ts`), `CreateOrderDto` (`orders.dto.ts`) | INT-07 → INT-13: thiếu JWT 401; giỏ rỗng, dữ liệu sai 400; 201 kèm món, tổng tiền, `PENDING_PAYMENT`; giá tính lại ở server | **Đã chạy – đạt** (API) – 44/44 pass tại `ff1f09e`, [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| FR-20 | Kiểm tra và trừ tồn kho khi tạo đơn | Must | UC-04 | `sequence-checkout.puml`, `activity-order-flow.puml` (nhánh hết hàng), ADR-006 | `OrdersService.create`: khóa `Ingredient` bằng `SELECT … FOR UPDATE`, trừ kho trong `prisma.$transaction`; `common/inventory.ts` | INT-11, INT-12, INT-14, INT-16, INT-17: thiếu nguyên liệu → 409 kèm danh sách thiếu, rollback, kho không đổi | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md). 409 nêu nguyên liệu thiếu thay vì tên món (tồn kho theo nguyên liệu, ADR-006) |
| FR-21 | Lưu snapshot giá và tên sản phẩm tại thời điểm đặt | Should | UC-04, UC-05 | `class-domain.puml` (OrderItem lưu bản chụp, không có khóa ngoại tới Product) | `OrderItem.productName`, `sizeName`, `toppings`, `unitPrice` (`schema.prisma`), gán trong `OrdersService.create` | INT-13, INT-46: đổi tên và giá món sau khi đặt, đơn cũ vẫn giữ tên, đơn giá và thành tiền lúc đặt; đơn đặt sau dùng giá mới | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| FR-22 | Tự hủy đơn chưa thanh toán sau thời hạn và hoàn trả tồn kho | Should | UC-04 | `class-domain.puml` (ghi chú vòng đời Order), ADR-006 | `OrderExpiryService.expireOverdue` (`orders/order-expiry.service.ts`), `OrdersService.cancelPending`; biến `ORDER_PAYMENT_TIMEOUT_MINUTES` | INT-43, INT-44: quá hạn → `CANCELLED`, hoàn kho đúng 1 lần, ghi `AUTO_EXPIRED`; thời hạn rút ngắn còn 1 phút qua cấu hình | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| FR-23 | Chọn hình thức nhận món (tại quầy hoặc mang đi) | Could | UC-04, UC-06 | Không áp dụng | Chưa có: model `Order` không có trường `pickupType` | – | Chưa triển khai (Could) |
| FR-24 | Thanh toán bằng Ví mô phỏng | Must | UC-04 | `sequence-checkout.puml`, `class-domain.puml` (`User.walletBalance`, `Payment`), ADR-008 | `POST /payments` – `MockPaymentsService.pay` (`payments/mock-payments.service.ts`), `decideWallet` (`payments/mock-payment.ts`) | INT-35, INT-36, INT-38; unit `mock-payment.spec.ts`: ví đủ → `SUCCESS`, đơn `PAID`, trừ đúng số dư; thiếu số dư → `FAILED`, mã `WALLET_INSUFFICIENT_BALANCE`; web `OrderConfirmationModal.spec.tsx`: hiện số dư, số dư sau thanh toán, khóa thanh toán bằng ví khi thiếu tiền | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| FR-25 | Thanh toán bằng Thẻ mô phỏng | Must | UC-04 | `sequence-checkout.puml`, `class-domain.puml` (`Payment.cardLast4`), ADR-008 | `decideCard` (`payments/mock-payment.ts`), `MockPaymentsService.pay` | INT-36, INT-37; unit `mock-payment.spec.ts`: thẻ test thành công, bị từ chối, không đủ số dư; từ 17/11 chỉ số thẻ quyết định, hạn thẻ (MM/YY) và CVV nhập bất kỳ; DB chỉ lưu 4 số cuối, không lưu số thẻ đầy đủ hay CVV | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md). Phần "không ghi log": module `payments` không có lệnh ghi log (kiểm tra mã nguồn) |
| FR-26 | Idempotency khi gửi lại yêu cầu thanh toán | Must | UC-04 | `sequence-checkout.puml` (nhánh `Idempotency-Key`), `class-domain.puml` (`Payment.idempotencyKey`), ADR-008 | `requireIdempotencyKey` (`payments/idempotency.ts`), ràng buộc UNIQUE `Payment.idempotencyKey`, `MockPaymentsService.findByKey` | INT-26 → INT-29, INT-35, INT-38 (VNPay: INT-18, INT-20); unit `idempotency.spec.ts`: cùng key chỉ 1 Payment, trừ tiền 1 lần, trả lại kết quả cũ; 5 request cùng key đồng thời → 1 giao dịch | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| FR-27 | Xử lý thanh toán thất bại và cho phép thử lại | Must | UC-04 | `activity-order-flow.puml` (nhánh thanh toán lỗi), `sequence-checkout.puml` (`alt` thất bại), ADR-008 | `MockPaymentsService.pay` (`PENDING_PAYMENT → PAYMENT_FAILED`, thanh toán lại → `PAID`), `changeOrderStatus` (`orders/order-status.ts`) | INT-22, INT-24, INT-36: lỗi → `PAYMENT_FAILED`, giữ kho; thanh toán lại thành công → `PAID`; thanh toán đơn đã `PAID` → 409 | **Đã chạy – đạt** phần API – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md); phần UI (lý do lỗi, nút Thử lại) chưa xác nhận |
| FR-28 | Hoàn tiền | Won't | Ngoài phạm vi | Không triển khai theo SRS | Không áp dụng | Không kiểm thử trong phạm vi học phần | Won't – không thực hiện |
| FR-29 | Hiển thị xác nhận đơn sau khi thanh toán thành công | Must | UC-04 | ACT-05, SEQ-05 | Trang/modal xác nhận; payment result; cart clear | E2E-T29: hiển thị mã đơn, món, tổng, phương thức, trạng thái; giỏ rỗng sau thanh toán thành công | Có test modal frontend được báo cáo pass; cần xác nhận luồng thanh toán E2E |
| FR-30 | Xem lịch sử đơn hàng của tôi | Must | UC-05 | `class-domain.puml` (User – Order) | `GET /orders/me` – `OrdersService.listMine`, `MyOrdersQueryDto`; web `apps/web/src/app/orders` | INT-30 → INT-32: cần JWT; chỉ đơn của mình, mới nhất trước, phân trang, tham số sai 400; chưa có đơn → mảng rỗng | **Đã chạy – đạt** phần API – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md); trang web chưa có test trong báo cáo này |
| FR-31 | Theo dõi trạng thái đơn gần thời gian thực | Must | UC-05 | `class-domain.puml` (`OrderStatusHistory`); `activity-order-flow.puml` (bước 6: màn hình theo dõi `/orders/[id]`) | `GET /orders/:id` – `OrdersService.findOneFor` (kèm `statusHistory`); web `apps/web/src/app/orders/[id]/page.tsx` + `components/OrderTracking.tsx`: polling 5 giây, dừng khi COMPLETED/CANCELLED; nút "Theo dõi đơn" ở lịch sử đơn và khung đặt hàng thành công | INT-33, INT-41: `GET /orders/:id` trả đúng trạng thái sau khi nhân viên đổi; người khác xem → 403. `OrderTracking.spec.tsx` (7 test). **E2E-T31** `tests/e2e-order-tracking.spec.tsx`: nhân viên đổi PAID → PREPARING → READY → COMPLETED, trang khách cập nhật trong ≤ 10 giây và ngừng gọi API khi hoàn thành | Đạt phần API – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md); phần web: đạt – test component và E2E-T31 pass trên CI của PR #80 (đã merge vào `main`) |
| FR-32 | Cập nhật trạng thái bằng kênh đẩy (WebSocket/SSE) | Could | UC-05, UC-06 | SEQ-06, SEQ-07 | WebSocket/SSE gateway/client nếu triển khai | INT-T32, E2E-T32: trạng thái hiển thị ≤2 giây, không tải lại trang | Chưa xác nhận; Could |
| FR-33 | Nhân viên xem danh sách đơn đã thanh toán và lọc theo trạng thái | Must | UC-06 | `class-domain.puml`, `usecase-overview.puml` (Nhân viên quầy) | `GET /staff/orders` – `StaffOrdersController` (`orders.controller.ts`), `OrdersService.listForStaff`, `RolesGuard` | INT-39, INT-40: chưa đăng nhập 401, khách 403, status sai 400; chỉ đơn từ `PAID` trở đi, lọc đúng, đơn đến trước xếp trước | **Đã chạy – đạt** (API) – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| FR-34 | Nhân viên cập nhật trạng thái đơn theo đúng thứ tự cho phép | Must | UC-06 | `class-domain.puml` (`OrderStatusHistory`, ghi chú vòng đời Order) | `PATCH /orders/:id/status` – `OrdersService.updateStatus`, `NEXT_STATUS` (`orders.dto.ts`), `changeOrderStatus` (`orders/order-status.ts`) | INT-33, INT-41, INT-42: đúng thứ tự `PAID → PREPARING → READY → COMPLETED`; nhảy bước 400; khách 403; mỗi lần đổi ghi người thực hiện và thời điểm | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| FR-35 | Quản lý sản phẩm, giá, tồn kho (thêm/sửa/ẩn) | Should | UC-07 | ACT-07, SEQ-07, CLS-01 | Admin product APIs, product module, role guard | API-T35: Admin CRUD/ẩn; sản phẩm ẩn không hiện menu; Customer/Staff nhận 403 | Chưa xác nhận |
| FR-36 | Mã khuyến mãi (Promotion) áp dụng vào đơn | Could | UC-07, UC-04 | SEQ-05, SEQ-07, CLS-01 | Promotion module/model và order pricing | UNIT-T36, INT-T36: mã hợp lệ giảm đúng; mã sai/hết hạn/vượt lượt bị từ chối; tổng không âm | Chưa xác nhận; Could |
| FR-37 | Tích điểm khách hàng (LoyaltyTransaction) | Could | UC-07, UC-05 | SEQ-05, SEQ-07, CLS-01 | Loyalty module/model và hồ sơ khách hàng | INT-T37: đơn PAID cộng điểm đúng; đơn hủy không cộng; xem điểm ở hồ sơ | Chưa xác nhận; Could |
| FR-38 | Báo cáo doanh thu theo ngày | Could | UC-07 | ACT-07, SEQ-07, CLS-01 | Admin reporting API/dashboard | API-T38: tổng doanh thu và số đơn PAID khớp dữ liệu seed | Chưa xác nhận; Could |
| FR-39 | Thanh toán thật qua cổng như VNPay, MoMo, Stripe | Won't | Ngoài phạm vi | Không triển khai theo SRS | Không áp dụng | Không kiểm thử trong phạm vi; không nhầm với payment mô phỏng | Won't – không thực hiện |
| FR-40 | Quên mật khẩu, đăng nhập mạng xã hội (OAuth) | Won't | Ngoài phạm vi | Không triển khai theo SRS | Không áp dụng | Không kiểm thử trong phạm vi học phần | Won't – không thực hiện |
| FR-41 | Giao hàng tận nơi, theo dõi shipper | Won't | Ngoài phạm vi | Không triển khai theo SRS | Không áp dụng | Không kiểm thử trong phạm vi học phần | Won't – không thực hiện |
| FR-42 | Đa chi nhánh, đa tiền tệ, đa ngôn ngữ | Won't | Ngoài phạm vi | Không triển khai theo SRS | Không áp dụng | Không kiểm thử trong phạm vi học phần | Won't – không thực hiện |
| FR-43 | Push notification | Won't | Ngoài phạm vi | Không triển khai theo SRS | Không áp dụng | Không kiểm thử trong phạm vi; trạng thái trong app vẫn thuộc FR-31 | Won't – không thực hiện |

## 4. Ma trận truy vết yêu cầu phi chức năng

| Mã SRS | Yêu cầu (giữ nguyên SRS) | MoSCoW | Phạm vi áp dụng / thiết kế | Code / cấu hình cần đối chiếu | Kiểm thử / minh chứng cần có | Trạng thái |
|---|---|---|---|---|---|---|
| NFR-01 | Thời gian phản hồi API đọc | Must | API đọc sản phẩm | NestJS products API, truy vấn DB, index/cache nếu có | PERF-T01: k6/autocannon, 50 user đồng thời/1 phút; p95 ≤500 ms trên production | Chưa có báo cáo load test |
| NFR-02 | Tốc độ tải trang di động | Should | Web mobile-first | Next.js, ảnh/font, bundle và tối ưu tải trang | PERF-T02: Lighthouse mobile/4G; Performance ≥80, LCP ≤2,5 giây | Chưa có báo cáo Lighthouse |
| NFR-03 | Thời gian tạo đơn và thanh toán | Should | API orders/payments | Order/payment service và truy vấn DB | PERF-T03: 20 user đồng thời; p95 POST `/orders`, `/payments` ≤1.000 ms | Chưa có báo cáo load test |
| NFR-04 | Lưu mật khẩu an toàn | Must | Auth/security | Auth service, bcrypt/argon2, ORM/model | SEC-T04: bcrypt cost ≥10 hoặc argon2; DB không có mật khẩu rõ; API không trả password | Chưa có báo cáo bảo mật |
| NFR-05 | Bảo vệ API bằng JWT | Must | Auth/security | JWT strategy/guard, secret env, expiration | SEC-T05: token sai chữ ký/hết hạn bị 401; hạn ≤24 giờ; có test tự động | Chưa xác nhận đủ AC |
| NFR-06 | Validate dữ liệu đầu vào ở frontend và backend | Must | Toàn bộ API và form | DTO, class-validator, whitelist, ORM | SEC-T06: payload sai trả 400; trường thừa bị loại; test SQL injection | Chưa có báo cáo tổng hợp |
| NFR-07 | Truyền tải qua HTTPS và cấu hình CORS | Must | Production web/API | Render/custom domain, CORS config | SEC-T07: HTTP chuyển HTTPS; CORS chỉ cho origin frontend production | Cần kiểm tra cấu hình/URL thật |
| NFR-08 | Quản lý secret | Must | Repo, CI/CD, production | `.env.example`, `.gitignore`, GitHub Secrets/Render env | SEC-T08: gitleaks hoặc tương đương không phát hiện secret; log CI không lộ secret | Chưa có báo cáo quét |
| NFR-09 | Giới hạn tần suất đăng nhập (rate limiting) | Should | Auth API | Login endpoint, throttler/rate-limit config | SEC-T09: quá 5 lần sai trong 1 phút/IP trả 429 | Chưa xác nhận |
| NFR-10 | Cơ sở dữ liệu không công khai | Must | PostgreSQL production | Render PostgreSQL/network/database URL | SEC-T10: DB không có public endpoint; kết nối từ ngoài mạng nội bộ bị từ chối | Cần xác minh cấu hình production |
| NFR-11 | Giao diện mobile-first | Must | Toàn bộ luồng khách hàng | Responsive layout, CSS, components | UI-T11: viewport 360×640; không cuộn ngang; vùng chạm ≥44×44 px | Chưa có báo cáo UI audit |
| NFR-12 | Hỗ trợ PWA | Should | Frontend | `manifest`, service worker, cache strategy | UI-T12: Lighthouse nhận diện cài đặt; menu đã tải còn hiển thị offline ở lần mở sau | Chưa xác nhận |
| NFR-13 | Giao diện tiếng Việt và định dạng tiền VND | Should | Frontend | Nội dung UI, formatter tiền tệ, error messages | UI-T13: giá dạng 45.000 ₫; lỗi tiếng Việt, dễ hiểu, không lộ kỹ thuật | Chưa có checklist kiểm tra |
| NFR-14 | Khả năng truy cập và tương thích trình duyệt | Should | Frontend | Semantic HTML, labels, focus, responsive | UI-T14: Lighthouse Accessibility ≥85; Chrome/Safari mới nhất Android/iOS | Chưa có báo cáo |
| NFR-15 | Không bán vượt tồn kho (chống race condition) | Must | Order/inventory | `OrdersService.create`: khóa `Ingredient` theo id tăng dần bằng `SELECT … FOR UPDATE` (ADR-006) | INT-17, INT-47: 20 yêu cầu đặt đơn đồng thời, tồn kho chỉ đủ 5 đơn → đúng 5 đơn 201, 15 đơn 409, tồn kho về 0, không âm | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md) |
| NFR-16 | Tính nhất quán giữa đơn và thanh toán | Must | Order/payment/database | Trừ tiền, tạo `Payment` và đổi trạng thái đơn trong cùng transaction (`MockPaymentsService.pay`, `changeOrderStatus`) | Truy vấn kiểm tra sau bộ 44 test (42 đơn, 27 giao dịch): 0 đơn từ `PAID` trở đi thiếu `Payment SUCCESS`, 0 `Payment SUCCESS` có đơn chưa `PAID` | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md), mục 3 |
| NFR-17 | Health check và khả dụng production | Must | API và hosting | `GET /health`, DB connectivity, Render health/restart config | OPS-T17: health trả 200 kèm trạng thái DB; URL truy cập được; restart khi health check thất bại | Cần lưu kết quả kiểm tra production |
| NFR-18 | Chạy toàn hệ thống ở local bằng Docker | Must | Developer environment | `docker-compose.yml`, `apps/api/Dockerfile`, `apps/web/Dockerfile` | `docker compose up -d --build --wait` tại nội dung commit `ff1f09e`, không có `.env`: db, api, web healthy; web 200, `/health` 200, `/products` 5 món, tài khoản mới có ví 1.000.000đ | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md), mục 4 |
| NFR-19 | Migration và seed tái tạo được | Must | Database | `apps/api/prisma/migrations` (5 migration), `src/prisma/seed.ts`, `start:prod` chạy `prisma migrate deploy` | Database trống áp đủ 5 migration và seed; khởi động lại API (seed chạy lại) vẫn 5 món, không nhân đôi | **Đã chạy – đạt** – [báo cáo 17/11](test-reports/2026-11-17-api-integration.md), mục 4 |
| NFR-20 | Pipeline CI chặn mã lỗi | Must | GitHub Actions | `.github/workflows/ci.yml` và branch protection | CI-T20: PR chạy Install→Lint→Unit Test→Build; có minh chứng một lần xanh và một lần đỏ, PR không merge khi fail | Cần link CI run và branch protection |
| NFR-21 | Pipeline CD tự động triển khai | Must | GitHub Actions, registry, Render | `.github/workflows/cd.yml`, Docker build/push, Render deploy, migration | CD-T21: push/tag chạy Lint/Test→Build image tag SHA/semver→registry→deploy→smoke test `/health`; migration trước chuyển traffic | Cần xác minh pipeline thực tế; không suy ra chỉ từ việc dùng Render |
| NFR-22 | Rollback khi triển khai thất bại | Must | Release/deployment | Image tags, deploy workflow, README/deployment docs | OPS-T22: smoke test fail làm pipeline fail; README có rollback; đã thử rollback thành công | Chưa có minh chứng rollback |
| NFR-23 | Ghi log có cấu trúc | Should | Backend/operations | Logger, middleware/interceptor, request-id | OPS-T23: log method/path/status/duration/request-id; không log password/token/card data | Chưa có báo cáo |
| NFR-24 | Kiểm thử tự động | Should | Frontend/backend | Unit, integration, E2E test configs/scripts | TEST-T24: coverage ≥70% ở module trọng yếu; integration order/payment; ít nhất 1 E2E menu→xác nhận | Có log frontend trước đây; E2E từng có 2 test fail, cần chạy lại và bổ sung backend tests |
| NFR-25 | Chuẩn mã nguồn và quy trình | Should | Toàn repository | ESLint/Prettier, module organization, Git workflow | QA-T25: lint/format không lỗi; commit convention; module domain auth/products/orders/payments | Chưa có báo cáo tổng hợp |

## 5. Ma trận kiểm thử tổng hợp

| Nhóm test | ID đề xuất | Phạm vi | Minh chứng cần lưu |
|---|---|---|---|
| Unit / Component | UNIT-Txx | Menu, product detail, cart, auth UI, checkout, pricing/state logic | Lệnh chạy, log pass/fail, coverage, commit SHA |
| API | API-Txx | Products, auth, orders, payments, staff/admin authorization | Request/response, status code, test report |
| Integration | INT-Txx | Transaction tạo đơn/tồn kho, payment/idempotency, trạng thái đơn | Log test, dữ liệu kiểm tra trước/sau |
| End-to-end | E2E-Txx | Menu → tùy chỉnh → giỏ → đăng nhập → đặt đơn → thanh toán → xác nhận | Video/screenshot, trace, report, URL môi trường |
| Performance | PERF-Txx | NFR-01 đến NFR-03 | Kịch bản tải, p95, throughput, error rate |
| Security | SEC-Txx | NFR-04 đến NFR-10 | Kết quả test JWT/role/validation/secret/HTTPS/DB |
| UI / Accessibility | UI-Txx | NFR-11 đến NFR-14 | Viewport screenshots, Lighthouse report, browser matrix |
| Operations / Deployment | OPS-Txx, DB-Txx, CI-Txx, CD-Txx | NFR-17 đến NFR-23 | Health check, Docker clean run, migration, CI/CD run, rollback |

### 5.1. Kết quả kiểm thử đã được trao đổi trước đây

Thông tin dưới đây là ghi nhận từ log frontend đã được cung cấp trong các trao đổi trước, không phải kết quả chạy mới trong lần cập nhật tài liệu này:

| File kiểm thử | Phạm vi | Kết quả từng được báo cáo |
|---|---|---|
| `apps/web/src/utils/cart.spec.ts` | Logic giỏ hàng | 7 test pass |
| `apps/web/src/components/AccountMenu.spec.tsx` | Menu tài khoản | 5 test pass |
| `apps/web/src/components/OrderConfirmationModal.spec.tsx` | Luồng xác nhận/đặt hàng và yêu cầu đăng nhập | 3 test pass |
| `apps/web/src/components/ProductDetailModal.spec.tsx` | Chi tiết sản phẩm, size/topping | 5 test pass |
| `apps/web/src/components/CartDrawer.spec.tsx` | Giỏ hàng | 6 test pass |
| `apps/web/src/app/page.spec.tsx` | Menu | 4 test pass |
| `tests/e2e-order-flow.spec.tsx` | Luồng đặt hàng E2E | 2 test fail trong log được trao đổi; phải chạy lại sau khi sửa |

Tổng cộng có 30 unit/component test pass trong sáu file frontend nêu trên ở log cũ. Không dùng con số này để khẳng định toàn bộ test suite hiện tại đạt. E2E từng fail nên trạng thái end-to-end phải để **Chưa đạt/Chưa xác nhận** cho đến khi có log mới.

### 5.2. Kết quả chạy test tích hợp API ngày 17/11/2026

Chạy `npm run test:int` tại commit `ff1f09e`: **44/44 test pass** (lần chạy trước ở `e093618` cũng 44/44). Lần chạy bổ sung tại commit `0cd0501` (thêm INT-45 → INT-47, sửa quyền hủy đơn): **47/47 pass**. Danh sách test (mã `INT-01` → `INT-47`), truy vấn kiểm tra NFR-16 và lần chạy Docker Compose ghi ở [`test-reports/2026-11-17-api-integration.md`](test-reports/2026-11-17-api-integration.md). Các dòng FR-19 → FR-34, NFR-15, NFR-16, NFR-18 và NFR-19 ở mục 3, 4 dùng báo cáo này làm minh chứng.

## 6. Quy tắc cập nhật và nghiệm thu

1. Mã FR/NFR và nội dung yêu cầu phải khớp chính xác với `docs/requirements/srs.md`.
2. Không gộp, đổi số hoặc tự viết lại yêu cầu làm sai lệch SRS. Các yêu cầu `Won't` vẫn giữ trong ma trận và ghi rõ ngoài phạm vi.
3. Mỗi FR cần truy vết đến UC, thiết kế, code/API và test phù hợp. Nếu một phần không áp dụng, ghi rõ lý do.
4. Mỗi NFR cần có phương pháp kiểm chứng và minh chứng định lượng/định tính theo AC trong SRS.
5. Chỉ ghi **Đã chạy – đạt** khi có log hoặc báo cáo kiểm thử của đúng commit/nhánh.
6. Cập nhật ma trận cùng Pull Request/commit khi yêu cầu, thiết kế, code/API hoặc test thay đổi.
7. Lưu đường dẫn tới sơ đồ, test report, CI/CD run, video demo và URL production trong cột minh chứng hoặc phụ lục.
8. Kiểm tra truy vết hai chiều: từ yêu cầu tìm được thiết kế/code/test; từ chức năng/test quan trọng truy ngược được yêu cầu nguồn.
9. Render là nền tảng triển khai được nhóm sử dụng theo thông tin đã trao đổi; chỉ ghi CD tự động, health check, rollback hoặc URL production là đạt sau khi kiểm tra cấu hình và chạy thử thực tế.

## 7. Checklist trước khi nộp

- [ ] Mã và tên FR-01 đến FR-43 khớp SRS.
- [ ] Mã và tên NFR-01 đến NFR-25 khớp SRS.
- [ ] Các sơ đồ ACT/SEQ/CLS được thay bằng tên file thực tế trong repository.
- [ ] Các đường dẫn code/API đã được kiểm tra trên nhánh chuẩn bị nộp.
- [ ] Test case có kết quả chạy mới, đúng commit SHA.
- [ ] Hai E2E test từng fail đã được xử lý và chạy lại.
- [ ] Có báo cáo performance, security, Lighthouse, Docker clean run và migration/seed.
- [ ] Có link CI/CD, kiểm tra Render production và bằng chứng rollback (nếu nhóm tuyên bố đạt các NFR tương ứng).
