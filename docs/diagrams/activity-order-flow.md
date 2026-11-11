# Activity diagram – Luồng đặt món và thanh toán end-to-end (BrewLite)

> Task 2.1 · Người thực hiện: Trần Minh Trí (3124410371) · Reviewer: Quách Văn Trường  
> Nguồn: [`activity-order-flow.puml`](activity-order-flow.puml) · Kết xuất: [`activity-order-flow.svg`](activity-order-flow.svg)  
> Căn cứ: Bối cảnh & phạm vi [`context-and-scope.md`](../requirements/context-and-scope.md), tài liệu đặc tả yêu cầu [`srs.md`](../requirements/srs.md) (FR-18 → FR-27, FR-30, FR-33, FR-34), đặc tả use-case [`use-case-order-payment.md`](../requirements/use-case-order-payment.md) (UC-01), và các quyết định kiến trúc [`ADR-006`](../architecture/adr/006-inventory-transaction-row-locking.md), [`ADR-008`](../architecture/adr/008-simulated-wallet-card-payment.md).

![Activity diagram Luồng đặt món và thanh toán end-to-end](activity-order-flow.svg)

---

## 1. Phân vùng trách nhiệm (5 Phân làn - Swimlanes)

Sơ đồ hoạt động bao gồm 5 phân làn thể hiện rành mạch sự phối hợp giữa tác nhân người dùng, hệ thống phần mềm và dịch vụ bên thứ ba:

| Phân làn (Swimlane) | Vai trò | Trách nhiệm chi tiết |
|---------------------|---------|----------------------|
| **Khách hàng (`Customer`)** | Tác nhân chính | Xem thực đơn, tùy biến kích cỡ (Size S/M/L) và Topping, thêm vào giỏ hàng, xác nhận đặt hàng, thực hiện thanh toán, theo dõi tiến trình và nhận đồ uống tại quầy. |
| **Giao diện Next.js (`Frontend`)** | Tầng trình diễn (Client Web App) | Quản lý trạng thái giỏ hàng cục bộ (`localStorage`), kiểm tra phiên đăng nhập và điều hướng bảo toàn giỏ hàng, sinh `Idempotency-Key` (UUIDv4), gửi request tạo đơn, xóa giỏ hàng khi thành công, polling cập nhật trạng thái đơn (mỗi 5–10s). |
| **NestJS API & Database (`Backend`)** | Tầng nghiệp vụ & Dữ liệu | Xác thực `JwtAuthGuard`, validate DTO, tính lại tổng tiền phía server (chống gian lận giá), mở Database Transaction với cơ chế khóa dòng bi quan (`SELECT ... FOR UPDATE`), quản lý máy trạng thái đơn hàng (`PENDING_PAYMENT` → `PAID` → `PREPARING` → `READY` → `COMPLETED`). |
| **Cổng thanh toán (`PaymentGateway`)** | Dịch vụ thanh toán mô phỏng | Giả lập xử lý thanh toán Ví điện tử (`WALLET`) và Thẻ ngân hàng (`CARD`), kiểm tra số dư và hạn mức, trả về mã trạng thái thành công hoặc thất bại có kiểm soát. |
| **Nhân viên quầy (`Barista`)** | Tác nhân vận hành quầy | Đăng nhập tài khoản nhân viên (`STAFF`), xem hàng đợi đơn đã thanh toán (`GET /orders?status=PAID`), nhận đơn pha chế (`PREPARING`), đóng gói khi xong (`READY`) và xác nhận trao đồ uống cho khách (`COMPLETED`). |

---

## 2. Diễn giải chi tiết các nhánh rẽ và xử lý ngoại lệ (Exceptions)

Sơ đồ đáp ứng đầy đủ điểm bắt đầu (`start`), điểm kết thúc (`stop`), và **3 nhánh rẽ ngoại lệ bắt buộc** theo đúng yêu cầu đồ án (Mục 4.1):

### Nhánh ngoại lệ 1: Người dùng chưa đăng nhập (Unauthenticated)
- Khi khách hàng nhấn *"Đặt hàng / Thanh toán"*, giao diện Next.js kiểm tra token trong client storage.
- Nếu chưa có token, khách hàng được chuyển hướng sang màn hình Đăng nhập (`POST /auth/login`).
- Sau khi đăng nhập thành công, hệ thống cấp JWT Token, lưu vào bộ nhớ client, **bảo toàn nguyên vẹn các món trong giỏ hàng** và tự động quay lại luồng đặt đơn mà không bắt khách phải chọn lại từ đầu.

### Nhánh ngoại lệ 2: Hết hàng hoặc không đủ tồn kho nguyên liệu (Out of Stock / Shortage - FR-19, FR-20)
- Backend mở Transaction, khóa dòng kiểm tra số lượng tồn kho nguyên liệu theo công thức món × size (`SELECT ... FROM "Ingredient" FOR UPDATE`).
- Nếu số lượng tồn kho trong database không đủ đáp ứng, Backend thực hiện **`ROLLBACK TRANSACTION`**, trả về mã lỗi `409 Conflict` kèm danh sách nguyên liệu thiếu (`shortages`).
- Giao diện Next.js hiển thị thông báo chi tiết món hết hàng để khách hàng điều chỉnh lại số lượng hoặc chọn món khác.

### Nhánh ngoại lệ 3: Thanh toán thất bại (Payment Failed - FR-27, ADR-008)
- Khi Cổng thanh toán trả về kết quả thất bại (Ví thiếu tiền, Thẻ bị từ chối hoặc hết hạn):
  - Backend cập nhật trạng thái giao dịch `Payment` sang `FAILED`.
  - Đơn hàng được cập nhật sang trạng thái **`PAYMENT_FAILED`** (thay vì hủy ngay lập tức).
  - **Đặc biệt:** Hệ thống **giữ nguyên tồn kho nguyên liệu** để bảo đảm quyền lợi đặt món cho khách.
  - Backend trả về phản hồi `200 OK` kèm cờ `canRetry: true`.
- Giao diện Next.js hiển thị thông báo lỗi và đưa ra 2 lựa chọn cho khách hàng:
  1. **Thanh toán lại:** Khách đổi phương thức thanh toán hoặc đổi thẻ và gửi lại yêu cầu thanh toán mới.
  2. **Hủy đơn hàng:** Khách bấm *"Hủy đơn hàng"*, Backend mở Transaction cập nhật đơn sang `CANCELLED` và **tự động hoàn trả nguyên liệu vào kho** theo đúng `ingredientUsage` đã lưu.

---

## 3. Bảng đối chiếu tiêu chí nghiệm thu Task 2.1 của Đề bài

| Tiêu chí đề bài yêu cầu (Mục 4.1) | Thể hiện trên sơ đồ | Căn cứ trong dự án |
|-----------------------------------|---------------------|-------------------|
| **Điểm bắt đầu và kết thúc** | Có `start` (Mở ứng dụng) và `stop` (Nhận đồ uống thành công / Hủy đơn). | Mục 4.1 đề bài |
| **Hành động người dùng & hệ thống** | Phân định rạch ròi qua từng ô hành động trên từng phân làn tương ứng. | Luồng nghiệp vụ tối thiểu |
| **Decision / Merge các nhánh** | Sử dụng cấu trúc `if (...) then (...) else (...) endif` chuẩn UML cho cả 3 điểm rẽ nhánh. | PlantUML Activity Beta |
| **Swimlane đa thành phần** | Đầy đủ 5 làn: `Customer`, `Frontend`, `Backend`, `PaymentGateway`, `Barista`. | Đề tài đa tác nhân |
| **Trường hợp chưa đăng nhập** | Rẽ nhánh 1: Chuyển hướng đăng nhập, cấp JWT và bảo toàn giỏ hàng. | FR-18 |
| **Trường hợp hết hàng** | Rẽ nhánh 2: Kiểm tra kho khóa dòng, Rollback và trả mã lỗi 409 Conflict. | FR-19, FR-20, ADR-006 |
| **Trường hợp thanh toán thất bại** | Rẽ nhánh 3: Chuyển `PAYMENT_FAILED`, giữ kho, cho phép thanh toán lại hoặc hủy đơn hoàn kho. | FR-27, ADR-008 |

