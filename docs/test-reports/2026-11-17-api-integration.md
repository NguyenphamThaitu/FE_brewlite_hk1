# Báo cáo chạy test tích hợp API – đặt đơn, thanh toán, trạng thái đơn

Minh chứng cho cột *Trạng thái / minh chứng* của [`traceability-matrix.md`](../traceability-matrix.md) (FR-19 → FR-34, NFR-15, NFR-16, NFR-18, NFR-19).

| Mục | Giá trị |
|---|---|
| Ngày chạy | 17/11/2026 |
| Commit | `ff1f09e` trên `main` (sau khi merge PR #77: ví 1.000.000đ, thẻ mô phỏng chỉ xét số thẻ; đã có trang theo dõi đơn của PR #80) |
| Người chạy | Quách Văn Trường |
| Lệnh | `npm run test:int` trong `apps/api` (Jest project `integration`, chạy tuần tự) |
| Môi trường | Node.js 24.16.0, PostgreSQL 18.6 trên máy cá nhân; database trống tạo riêng cho lần chạy |
| Kết quả | **44/44 test pass**, 1 test suite, 12,3 giây |
| Lần chạy trước | Commit `e093618` (trước PR #77): 44/44 pass |
| Lần chạy bổ sung | Commit `0cd0501` (thêm INT-45 → INT-47, chỉ chủ đơn được hủy đơn): **47/47 pass**, 9,8 giây |

CI chưa chạy test tích hợp vì cần PostgreSQL (xem [`ci-evidence.md`](../ci-evidence.md), mục 7), nên báo cáo này là minh chứng chạy tay.

## 1. Cách chạy lại

```bash
cd apps/api
export DATABASE_URL=postgresql://<user>:<password>@localhost:5432/brewlite_test
export TEST_DATABASE_URL=$DATABASE_URL
npm run test:int
```

Mặc định file test chạy `prisma migrate reset` trên `TEST_DATABASE_URL`, tức là **xóa sạch database đó**; chỉ trỏ biến này vào database dùng riêng cho test. Lần chạy này dùng database mới tạo, nên áp migration trước bằng `npx prisma migrate deploy` rồi đặt `TEST_SKIP_MIGRATE=1`.

## 2. Danh sách test

Tất cả test nằm trong [`apps/api/test/flow.int-spec.ts`](../../apps/api/test/flow.int-spec.ts), đánh mã `INT-01` → `INT-47` theo thứ tự chạy. Đây là mã của test có thật; các mã dạng `INT-Txx` còn lại trong ma trận là mã gợi ý, chưa gắn với test nào.

| ID | Nhóm | Test | Yêu cầu | Kết quả |
|---|---|---|---|---|
| INT-01 | Health | `GET /health` | NFR-17 | Pass |
| INT-02 | Sản phẩm | danh sách món | FR-01 | Pass |
| INT-03 | Sản phẩm | chi tiết món có size và topping | FR-06 | Pass |
| INT-04 | Sản phẩm | 404 khi không có / 400 khi id sai | FR-06 | Pass |
| INT-05 | Xác thực | validate dữ liệu đăng ký | FR-14 | Pass |
| INT-06 | Xác thực | đăng ký, trùng email, đăng nhập, /me; tài khoản mới có ví 1.000.000đ | FR-14, FR-15, FR-24 | Pass |
| INT-07 | Xác thực | chưa đăng nhập / token sai bị chặn (`POST /orders`, `GET /orders` → 401) | FR-19, NFR-05 | Pass |
| INT-08 | Validate đơn | giỏ rỗng / thiếu items → 400 | FR-19 | Pass |
| INT-09 | Validate đơn | số lượng, size, topping, món không hợp lệ | FR-19, NFR-06 | Pass |
| INT-10 | Validate đơn | không tin giá từ client: gửi kèm giá bị từ chối | FR-19, NFR-06 | Pass |
| INT-11 | Validate đơn | món đã ngừng bán → 400, kho không đổi | FR-19, FR-20 | Pass |
| INT-12 | Đặt đơn, tồn kho | đặt đơn: tính giá phía server, trừ đúng nguyên liệu theo công thức × size, trạng thái chờ thanh toán | FR-19, FR-20 | Pass |
| INT-13 | Đặt đơn, tồn kho | nhiều dòng trong một đơn: tổng tiền = tổng các dòng, lưu đúng từng dòng | FR-19 | Pass |
| INT-14 | Đặt đơn, tồn kho | hết nguyên liệu → 409, kho không đổi | FR-20 | Pass |
| INT-15 | Đặt đơn, tồn kho | hết nguyên liệu → menu báo món hết, size lớn báo hết trước size nhỏ | FR-03 | Pass |
| INT-16 | Đặt đơn, tồn kho | topping hết nguyên liệu cũng chặn đơn | FR-20 | Pass |
| INT-17 | Đặt đơn, tồn kho | đồng thời: chỉ đủ nguyên liệu cho 1 đơn → đúng 1 đơn thành công | FR-20, NFR-15 (một phần) | Pass |
| INT-18 | VNPay | tạo link thanh toán có chữ ký, gọi lại không tạo giao dịch trùng | FR-26 | Pass |
| INT-19 | VNPay | không thanh toán đơn của người khác | FR-17 | Pass |
| INT-20 | VNPay | IPN thành công → đơn PAID; gọi lại không xử lý lần 2 | FR-26, FR-27 | Pass |
| INT-21 | VNPay | chữ ký sai / số tiền sai / giao dịch lạ bị từ chối, đơn không đổi | ADR-005 | Pass |
| INT-22 | VNPay | thanh toán thất bại → đơn PAYMENT_FAILED, giữ kho để thanh toán lại | FR-27 | Pass |
| INT-23 | Hủy đơn | khách hủy đơn chưa thanh toán → hoàn kho; không hủy được đơn đã thanh toán | Hủy đơn (SRS chưa có FR riêng) | Pass |
| INT-24 | VNPay | thanh toán lại sau PAYMENT_FAILED: giao dịch mới, thành công → PAID, kho không bị trừ thêm | FR-27 | Pass |
| INT-25 | Hủy đơn | khách hủy đơn PAYMENT_FAILED → CANCELLED, hoàn kho đúng 1 lần | Hủy đơn (SRS chưa có FR riêng) | Pass |
| INT-26 | Idempotency | Idempotency-Key thiếu hoặc sai định dạng → 400, không tạo giao dịch | FR-26 | Pass |
| INT-27 | Idempotency | gửi lại cùng key trả đúng giao dịch cũ; key dùng cho đơn khác hoặc người khác → 409 | FR-26 | Pass |
| INT-28 | Idempotency | gửi lại key của giao dịch đã thất bại → trả kết quả cũ, không mở link mới | FR-26 | Pass |
| INT-29 | Idempotency | đồng thời: 5 request cùng key, hoặc 2 request khác key → chỉ 1 giao dịch | FR-26 | Pass |
| INT-30 | Lịch sử đơn | `GET /orders/me` cần đăng nhập; chưa có đơn → mảng rỗng | FR-30 | Pass |
| INT-31 | Lịch sử đơn | phân trang page/limit, tham số sai → 400 | FR-30 | Pass |
| INT-32 | Lịch sử đơn | chỉ trả đơn của chính mình, mới nhất trước, kèm danh sách món | FR-30, FR-17 | Pass |
| INT-33 | Trạng thái đơn | nhân viên đẩy trạng thái đúng thứ tự, khách không được, `GET /orders/:id` của người khác → 403 | FR-34, FR-31, FR-17 | Pass |
| INT-34 | Trạng thái đơn | `GET /orders?status=…` lọc đúng trạng thái; status ngoài danh sách → 400 | NFR-06 | Pass |
| INT-35 | Ví/Thẻ mô phỏng | ví đủ tiền: đơn PAID, trừ đúng số dư, `GET /auth/me` trả đúng số dư mới; gửi lặp cùng key không trừ tiền lần hai | FR-24, FR-26 | Pass |
| INT-36 | Ví/Thẻ mô phỏng | ví không đủ: Payment FAILED kèm mã lỗi, đơn PAYMENT_FAILED; thanh toán lại bằng thẻ test thì PAID; thanh toán đơn đã PAID → 409 | FR-24, FR-25, FR-27 | Pass |
| INT-37 | Ví/Thẻ mô phỏng | thẻ bị từ chối / không đủ số dư kèm lý do; hạn thẻ bất kỳ (kể cả 11/12) không ảnh hưởng; DB chỉ lưu 4 số cuối, không lưu số thẻ đầy đủ hay CVV | FR-25 | Pass |
| INT-38 | Ví/Thẻ mô phỏng | dữ liệu sai → 400, thiếu key → 400, key dùng cho yêu cầu khác → 409, chưa đăng nhập → 401 | FR-24, FR-25, FR-26 | Pass |
| INT-39 | Màn hình quầy | `GET /staff/orders`: chưa đăng nhập 401, khách 403, status ngoài danh sách 400 | FR-33 | Pass |
| INT-40 | Màn hình quầy | chỉ trả đơn đã thanh toán, lọc đúng trạng thái, đơn đến trước xếp trước | FR-33 | Pass |
| INT-41 | Lịch sử trạng thái | ghi đủ từng lần đổi; nhân viên thấy người thực hiện, khách chỉ thấy các mốc | FR-34, FR-31 | Pass |
| INT-42 | Lịch sử trạng thái | đổi sai thứ tự không ghi lịch sử; khách hủy ghi CUSTOMER_CANCEL; IPN VNPay ghi người đổi là hệ thống | FR-34 | Pass |
| INT-43 | Tự hủy đơn | quá 15 phút: hủy đơn, hoàn kho đúng 1 lần, ghi AUTO_EXPIRED; đơn còn hạn, đã thanh toán, có link VNPay còn hiệu lực thì giữ nguyên | FR-22 | Pass |
| INT-44 | Tự hủy đơn | thời hạn rút ngắn còn 1 phút qua `ORDER_PAYMENT_TIMEOUT_MINUTES` | FR-22 | Pass |
| INT-45 | Bổ sung | hủy đơn: chỉ chủ đơn được hủy; nhân viên xem được nhưng hủy hộ bị 403, đơn giữ nguyên | Hủy đơn (SRS chưa có FR riêng), FR-17 | Pass |
| INT-46 | Bổ sung | FR-21: đổi tên và giá món sau khi đặt, đơn cũ vẫn giữ tên và giá lúc đặt | FR-21 | Pass |
| INT-47 | Bổ sung | NFR-15: 20 yêu cầu đặt đơn đồng thời, tồn kho chỉ đủ 5 đơn → đúng 5 đơn thành công, kho không âm | NFR-15 | Pass |

## 3. Kiểm tra nhất quán đơn và thanh toán (NFR-16)

Chạy trên database test ngay sau bộ 44 test (42 đơn, 27 giao dịch, 12 giao dịch `SUCCESS`; lần chạy bổ sung 47 test: 50 đơn, 27 giao dịch, 12 `SUCCESS`, cũng 0 vi phạm):

```sql
-- Đơn từ PAID trở đi nhưng không có Payment SUCCESS
SELECT count(*) FROM "Order" o
WHERE o.status IN ('PAID','PREPARING','READY','COMPLETED')
  AND NOT EXISTS (SELECT 1 FROM "Payment" p WHERE p."orderId" = o.id AND p.status = 'SUCCESS');

-- Payment SUCCESS nhưng đơn chưa PAID
SELECT count(*) FROM "Payment" p JOIN "Order" o ON o.id = p."orderId"
WHERE p.status = 'SUCCESS' AND o.status NOT IN ('PAID','PREPARING','READY','COMPLETED');
```

Kết quả: **0** và **0** dòng vi phạm.

## 4. Chạy toàn hệ thống bằng Docker Compose (NFR-18, NFR-19)

Nội dung giống hệt commit `ff1f09e`, Docker Engine 29.9.2, không có tệp `.env` (dùng giá trị mặc định trong `docker-compose.yml`). Cổng 3000 trên máy đang bận nên `web` chạy ở cổng 3002 và `CORS_ORIGIN` thêm `http://localhost:3002`:

| Bước | Kết quả |
|---|---|
| `docker compose up -d --build --wait` | `db`, `api`, `web` đều `healthy` |
| `http://localhost:3002` | 200 |
| `GET http://localhost:3001/health` | `{"status":"ok","db":"up"}` |
| `GET /products` | 5 món (dữ liệu seed) |
| Đăng ký tài khoản thử | ví mô phỏng có sẵn 1.000.000đ |
| `POST /orders` 1 món | đơn `PENDING_PAYMENT`, 29.000đ |
| `POST /payments` phương thức `WALLET` | `SUCCESS`, đơn `PAID`, ví còn 971.000đ |
| `POST /payments` phương thức `CARD`, thẻ `4111111111111111`, hạn `11/12` | `SUCCESS`, đơn `PAID`, chỉ lưu 4 số cuối `1111` |
| `GET /auth/me` | `walletBalance` 971.000đ |
| `GET /orders?status=abc` | 400 |
| `docker compose restart api` (seed chạy lại vì `AUTO_SEED=true`) | vẫn 5 món, không nhân đôi |
| `docker compose port db 5432` | không mở cổng PostgreSQL ra máy host |

Migration: database trống áp đủ 5 migration bằng `prisma migrate deploy`, trong lần chạy test ở mục 2 và khi container `api` khởi động.
