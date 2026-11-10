# Software Requirements Specification (SRS) — BrewLite System

> **Dự án:** BrewLite — Hệ thống đặt cà phê và thanh toán không dùng tiền mặt  
> **Môn học:** Công nghệ Phần mềm — Trường Đại học Sài Gòn (SGU)  
> **Học kỳ:** I — Năm học 2026–2027  
> **Giai đoạn:** Task 1 — Khai thác và đặc tả yêu cầu (Task 1.2 - SRS)  
> **Phân hệ đặc tả:** Đặt đơn hàng, Thanh toán không tiền mặt, Lịch sử & Trạng thái đơn hàng (`FR-05` đến `FR-08`)  

---

## 1. Tổng quan phân hệ

Phân hệ này đặc tả 4 yêu cầu chức năng cốt lõi (`FR-05` đến `FR-08`) thuộc chu trình tạo đơn, thanh toán và xử lý vòng đời đơn hàng cho hệ thống **BrewLite** (Assignment 2).

Hệ thống được thiết kế tinh gọn theo phạm vi tối thiểu của đề tài:
- Quản lý tồn kho trực tiếp theo số lượng sản phẩm (`Product.stock`), không quản lý định lượng kho nguyên liệu thô.
- Thực hiện trừ tồn kho sản phẩm trong cùng một Database Transaction ngay khi tạo đơn hàng (`POST /orders`). Nếu đơn hàng bị hủy (`CANCELLED`), hệ thống tự động hoàn trả lại số lượng vào kho.
- Khách hàng theo dõi trạng thái đơn hàng thông qua cơ chế tải lại trang hoặc polling định kỳ phía frontend.

---

## 2. Yêu cầu Chức năng chi tiết (FR-05 → FR-08)

### FR-05: Tạo đơn hàng từ giỏ hàng (Create Order)
- **Mã yêu cầu:** `FR-05`
- **Tên yêu cầu:** Tạo đơn hàng mới từ giỏ hàng (Create Pending Order)
- **Tác nhân:** Khách hàng (Customer) đã đăng nhập.
- **Mức độ ưu tiên (MoSCoW):** **Must have** (Bắt buộc trong MVP).
- **API Endpoint:** `POST /orders`
- **Mục tiêu:** Chuyển đổi các món đồ uống, kích cỡ (Size S/M/L) và topping trong giỏ hàng thành một đơn hàng mới ở trạng thái `PENDING`, đồng thời trừ tồn kho sản phẩm tương ứng.

#### Mô tả luồng xử lý và quy tắc nghiệp vụ:
1. Khách hàng gửi yêu cầu tạo đơn hàng chứa danh sách món: `productId`, kích cỡ (`size`: S/M/L), danh sách `toppings`, số lượng (`qty`) và ghi chú kèm theo Bearer JWT Token.
2. Hệ thống kiểm tra tính hợp lệ của phiên đăng nhập (JWT Guard) và dữ liệu đầu vào (DTO Validation). Nếu chưa đăng nhập hoặc token không hợp lệ, trả về mã lỗi `401 Unauthorized`.
3. Ràng buộc giỏ hàng: Giỏ hàng phải chứa ít nhất 1 sản phẩm với số lượng hợp lệ (qty >= 1). Nếu giỏ hàng rỗng, trả về mã lỗi `400 Bad Request`.
4. Kiểm tra và trừ tồn kho theo sản phẩm (`Product.stock`):
   - Phía backend thực thi một Database Transaction:
     - Kiểm tra tồn kho của từng sản phẩm trong đơn.
     - **Nếu đủ hàng:** Trừ trực tiếp số lượng tồn kho của sản phẩm (`Product.stock = Product.stock - qty`), tính toán tổng tiền đơn hàng độc lập phía server (giá gốc sản phẩm + phụ thu size + phụ thu topping), tạo bản ghi `Order` với trạng thái `PENDING`, tạo các bản ghi `OrderItem` và trả về thông tin đơn kèm mã đơn (`orderId`) với mã phản hồi `201 Created`.
     - **Nếu không đủ hàng:** Hủy bỏ toàn bộ Transaction (Rollback), từ chối tạo đơn và trả về mã lỗi `400 Bad Request` kèm thông báo rõ sản phẩm đã hết hàng.

#### Tiêu chí chấp nhận (Acceptance Criteria):
- **AC-05.1:** Gửi request không có JWT Token hoặc token hết hạn -> Hệ thống phản hồi mã HTTP `401 Unauthorized`.
- **AC-05.2:** Gửi request với danh sách `items` rỗng -> Hệ thống phản hồi mã HTTP `400 Bad Request` ("Giỏ hàng không được để trống").
- **AC-05.3:** Đặt món có số lượng vượt quá `Product.stock` -> Hệ thống phản hồi mã HTTP `400 Bad Request`, không tạo đơn và không làm thay đổi tồn kho sản phẩm trong cơ sở dữ liệu.
- **AC-05.4:** Đặt món khi tồn kho đủ -> Hệ thống tạo đơn hàng thành công ở trạng thái `PENDING`, phản hồi HTTP `201 Created` kèm `orderId`, và `stock` của sản phẩm trong bảng `Product` giảm chính xác bằng số lượng đã đặt.
- **AC-05.5:** Tổng tiền đơn hàng (`total`) bắt buộc được tính toán lại độc lập tại backend, không sử dụng giá trị tổng tiền client gửi lên.

---

### FR-06: Thanh toán không tiền mặt mô phỏng (Cashless Payment)
- **Mã yêu cầu:** `FR-06`
- **Tên yêu cầu:** Thanh toán đơn hàng không dùng tiền mặt (Process Cashless Payment)
- **Tác nhân:** Khách hàng (Customer), Cổng thanh toán mô phỏng (Mock Payment Gateway).
- **Mức độ ưu tiên (MoSCoW):**
  - Luồng thanh toán cốt lõi (Ví/Thẻ, Idempotency): **Must have**.
  - Tính năng tích điểm thưởng Loyalty: **Could have** (Phạm vi mở rộng).
- **API Endpoint:** `POST /orders/:id/pay` (hoặc `POST /payments`)
- **Mục tiêu:** Cho phép khách hàng thanh toán cho đơn hàng đang ở trạng thái `PENDING` hoặc `PAYMENT_FAILED` bằng Ví điện tử hoặc Thẻ ngân hàng nội địa với cơ chế chống lặp an toàn.

#### Mô tả luồng xử lý và quy tắc nghiệp vụ:
1. Khách hàng gửi yêu cầu thanh toán kèm `orderId` và phương thức thanh toán (`E_WALLET` hoặc `BANK_CARD`).
2. **Kiểm tra tiêu đề `Idempotency-Key`:**
   - Tiêu đề `Idempotency-Key` là bắt buộc trong Header request. Nếu thiếu header này, backend trả về lỗi ngay lập tức: `400 Bad Request` ("Thiếu header Idempotency-Key").
   - Nếu `Idempotency-Key` đã tồn tại trong bảng `Payment`: Backend kiểm tra quyền truy cập và trả về ngay kết quả giao dịch trước đó, không gọi sang cổng thanh toán và không trừ tiền lần 2.
3. **Phân quyền và ràng buộc trạng thái đơn hàng:**
   - Đơn hàng phải thuộc quyền sở hữu của người dùng đang đăng nhập (`Order.userId == RequestUser.userId`). Nếu thanh toán đơn của người khác, trả về mã lỗi `403 Forbidden` ("Bạn không có quyền thanh toán đơn hàng này").
   - Chỉ cho phép thanh toán khi đơn hàng đang ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`. Nếu đơn đã ở trạng thái `PAID`, `CANCELLED` hoặc `COMPLETED`, backend từ chối với mã lỗi `400 Bad Request`.
4. **Tính toán số tiền thanh toán:** Backend tự truy vấn tổng tiền `Order.total` từ cơ sở dữ liệu để thực hiện thanh toán, tuyệt đối không nhận số tiền từ body client gửi lên.
5. **Xử lý giao dịch qua Mock Gateway:**
   - **Thanh toán thành công:** Cập nhật trạng thái đơn hàng sang `PAID`, lưu bản ghi `Payment` với trạng thái `SUCCESS`. Phía Frontend nhận phản hồi thành công và thực hiện xóa sạch giỏ hàng (clear cart). Nếu kích hoạt tính năng mở rộng (Could have), tự động cộng điểm thưởng tích lũy (Loyalty points) cho khách hàng.
   - **Thanh toán thất bại:** Cập nhật trạng thái đơn hàng sang `PAYMENT_FAILED`, lưu bản ghi `Payment` với trạng thái `FAILED`. Giỏ hàng phía Frontend được giữ nguyên để khách hàng có thể thử lại.

#### Tiêu chí chấp nhận (Acceptance Criteria):
- **AC-06.1:** Không truyền header `Idempotency-Key` khi gọi API -> Hệ thống phản hồi mã HTTP `400 Bad Request` ("Thiếu header Idempotency-Key").
- **AC-06.2:** Gửi liên tiếp nhiều request có cùng `Idempotency-Key` -> Hệ thống chỉ thực hiện thanh toán đúng 1 lần và trả về cùng một kết quả cho các lần gọi lặp lại.
- **AC-06.3:** Người dùng gửi yêu cầu thanh toán đơn hàng của tài khoản khác -> Hệ thống phản hồi mã HTTP `403 Forbidden`.
- **AC-06.4:** Thanh toán cho đơn hàng đã `PAID` hoặc `CANCELLED` -> Hệ thống phản hồi mã HTTP `400 Bad Request`.
- **AC-06.5:** Giao dịch thành công -> Trạng thái đơn chuyển sang `PAID`, API trả về mã HTTP `200 OK`, Frontend tiến hành xóa giỏ hàng.
- **AC-06.6:** Giao dịch thất bại (mô phỏng lỗi thẻ/số dư) -> Trạng thái đơn chuyển sang `PAYMENT_FAILED`, Frontend hiển thị thông báo lỗi và giữ nguyên giỏ hàng.

---

### FR-07: Xem lịch sử và chi tiết đơn hàng (Order History & Detail)
- **Mã yêu cầu:** `FR-07`
- **Tên yêu cầu:** Tra cứu lịch sử và chi tiết đơn hàng (View Order History & Detail)
- **Tác nhân:** Khách hàng (Customer).
- **Mức độ ưu tiên (MoSCoW):** **Must have**.
- **API Endpoint:** `GET /orders/me` (Danh sách) và `GET /orders/:id` (Chi tiết)
- **Mục tiêu:** Khách hàng có thể tra cứu toàn bộ các đơn hàng do mình tạo ra và xem lại chi tiết từng món đồ uống.

#### Mô tả luồng xử lý và quy tắc nghiệp vụ:
1. Khách hàng truy cập màn hình "Lịch sử đơn hàng".
2. Frontend gọi API `GET /orders/me` kèm theo JWT Token.
3. Backend truy vấn cơ sở dữ liệu, chỉ lấy danh sách các đơn hàng có `userId` khớp với tài khoản đang đăng nhập, sắp xếp theo thời gian mới nhất lên đầu (`createdAt DESC`).
4. Hiển thị danh sách tóm tắt: Mã đơn (VD: `#1042`), ngày giờ tạo, tổng tiền và huy hiệu trạng thái với màu sắc tương ứng:
   - `PENDING` (Chờ thanh toán)
   - `PAID` (Đã thanh toán)
   - `PAYMENT_FAILED` (Thanh toán thất bại)
   - `PREPARING` (Đang pha chế)
   - `READY` (Sẵn sàng nhận)
   - `COMPLETED` (Đã hoàn tất)
   - `CANCELLED` (Đã hủy)
5. Khi người dùng bấm vào một đơn hàng, gọi API `GET /orders/:id` để xem chi tiết: danh sách sản phẩm, kích cỡ (S/M/L), danh sách topping, đơn giá từng món, số lượng, phương thức thanh toán và điểm thưởng nhận được (nếu có).
6. Nếu tài khoản chưa từng đặt đơn hàng nào, hiển thị giao diện trạng thái trống (Empty State) kèm nút điều hướng quay lại trang Menu.

#### Tiêu chí chấp nhận (Acceptance Criteria):
- **AC-07.1:** API `GET /orders/me` chỉ trả về các đơn hàng thuộc sở hữu của chính user gửi token, không bị lộ đơn hàng của user khác.
- **AC-07.2:** Danh sách đơn hàng hỗ trợ hiển thị đầy đủ 7 trạng thái, trong đó có huy hiệu trạng thái `PAYMENT_FAILED` cho các đơn thanh toán lỗi.
- **AC-07.3:** Gọi `GET /orders/:id` với `id` của đơn hàng thuộc người khác -> Hệ thống phản hồi mã HTTP `403 Forbidden`.
- **AC-07.4:** Khi tài khoản không có đơn hàng nào -> Frontend hiển thị giao diện Empty State thân thiện ("Bạn chưa có đơn hàng nào").

---

### FR-08: Quản lý và theo dõi trạng thái đơn hàng (Order State Tracking & Lifecycle)
- **Mã yêu cầu:** `FR-08`
- **Tên yêu cầu:** Quản lý vòng đời và cập nhật trạng thái đơn hàng (Order State Tracking & Lifecycle)
- **Tác nhân:** Khách hàng (Customer), Nhân viên quầy (Staff/Barista), Quản trị viên (Admin).
- **Mức độ ưu tiên (MoSCoW):** **Must have**.
- **API Endpoint:**
  - `POST /orders/:id/cancel`: Khách hàng hủy đơn hợp lệ.
  - `PATCH /orders/:id/status`: Nhân viên/Quản trị viên cập nhật trạng thái đơn hàng.
- **Mục tiêu:** Quản lý các bước chuyển tiếp trạng thái đơn hàng theo máy trạng thái hữu hạn (State Machine), phân quyền rõ ràng giữa Khách hàng và Nhân viên, đồng thời hoàn trả tồn kho sản phẩm khi đơn bị hủy.

#### Mô hình chuyển tiếp trạng thái (State Transitions):
- **Trạng thái hợp lệ:** `PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`.
- **Luồng chuẩn (Happy path):**
  `PENDING` --(Khách thanh toán thành công)--> `PAID` --(Nhân viên nhận đơn)--> `PREPARING` --(Nhân viên pha xong)--> `READY` --(Nhân viên giao khách)--> `COMPLETED`
- **Luồng ngoại lệ (Exceptions):**
  - `PENDING` --(Thanh toán lỗi)--> `PAYMENT_FAILED`
  - `PAYMENT_FAILED` --(Thanh toán lại thành công)--> `PAID`
  - `PENDING` --(Khách hủy)--> `CANCELLED`
  - `PAYMENT_FAILED` --(Khách/Hệ thống hủy)--> `CANCELLED`
  - `PAID` --(Nhân viên/Khách hủy đơn trước khi pha chế)--> `CANCELLED`

#### Quy tắc nghiệp vụ và phân quyền:
1. **Phân quyền cập nhật trạng thái (`PATCH /orders/:id/status`):**
   - Chỉ người dùng có vai trò Nhân viên (`STAFF`) hoặc Quản trị viên (`ADMIN`) mới được phép gọi API chuyển trạng thái đơn hàng sang `PREPARING`, `READY`, `COMPLETED`.
   - Nếu tài khoản khách hàng thông thường (`CUSTOMER`) cố tình gọi API này, hệ thống trả về mã lỗi `403 Forbidden`.
2. **Quy tắc máy trạng thái:**
   - Mọi thao tác cập nhật trạng thái phải đi qua hàm kiểm tra chuyển tiếp hợp lệ (`assertTransition`). Chặn đứng mọi bước nhảy sai quy trình (ví dụ: nhảy từ `PENDING` thẳng sang `COMPLETED`) và ném lỗi HTTP `400 Bad Request`.
   - `COMPLETED` và `CANCELLED` là trạng thái kết thúc (Terminal states), không thể chuyển tiếp sang bất kỳ trạng thái nào khác.
3. **Quyền hủy đơn của khách hàng (`POST /orders/:id/cancel`):**
   - Khách hàng chỉ được phép hủy đơn khi đơn ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`.
   - Khi đơn đã chuyển sang `PREPARING` hoặc các trạng thái sau, API từ chối cho khách hủy.
4. **Cơ chế hoàn trả kho khi hủy đơn:**
   - Khi đơn hàng chuyển sang `CANCELLED`, hệ thống tự động cộng hoàn trả lại số lượng từng món trong đơn vào trường `Product.stock` của sản phẩm trong cùng một Transaction để đảm bảo tính nhất quán dữ liệu.
5. **Cơ chế cập nhật trạng thái phía người dùng:**
   - Phía Frontend cập nhật trạng thái đơn hàng thông qua hành động tải lại trang của người dùng hoặc cơ chế polling tự động định kỳ (ví dụ mỗi 5-10 giây gọi refetch dữ liệu), không yêu cầu hạ tầng WebSocket/SSE thời gian thực phức tạp trong phạm vi MVP.

#### Tiêu chí chấp nhận (Acceptance Criteria):
- **AC-08.1:** Chuyển trạng thái vi phạm quy trình State Machine (ví dụ: từ `PENDING` sang `READY`) -> Hệ thống phản hồi mã HTTP `400 Bad Request` ("Chuyển trạng thái đơn hàng không hợp lệ").
- **AC-08.2:** Tài khoản `CUSTOMER` gọi API `PATCH /orders/:id/status` -> Hệ thống phản hồi mã HTTP `403 Forbidden` ("Chỉ nhân viên mới có quyền cập nhật trạng thái đơn").
- **AC-08.3:** Tài khoản `STAFF` gọi API cập nhật trạng thái theo đúng luồng hợp lệ (`PAID` -> `PREPARING` -> `READY` -> `COMPLETED`) -> Hệ thống cập nhật thành công, trả về mã HTTP `200 OK`.
- **AC-08.4:** Khi đơn hàng bị hủy (`CANCELLED`) qua `POST /orders/:id/cancel` -> Toàn bộ số lượng sản phẩm trong đơn được hoàn trả chính xác vào trường `stock` của bảng `Product`.
