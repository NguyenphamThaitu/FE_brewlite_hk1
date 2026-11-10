# BrewLite – Đặc tả yêu cầu phần mềm (SRS rút gọn)

Môn Công nghệ Phần mềm · Assignment 2 – Task 1.2 · Phiên bản 1.0

## 1. Giới thiệu

### 1.1 Mục đích
Tài liệu này đặc tả yêu cầu chức năng (FR) và phi chức năng (NFR) của BrewLite, ứng dụng đặt đồ uống mobile-first/PWA. Mỗi yêu cầu có mã định danh, mức ưu tiên MoSCoW và tiêu chí chấp nhận (AC) có thể kiểm chứng để viết test ở Task 4–5.

### 1.2 Phạm vi
Luồng nghiệp vụ tối thiểu: **Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn**. Công nghệ bắt buộc: Next.js (frontend), NestJS (backend), PostgreSQL (dữ liệu), Docker (đóng gói).

### 1.3 Quy ước
| Ký hiệu | Ý nghĩa |
|---|---|
| **Must** | Bắt buộc có trong MVP; thiếu thì luồng end-to-end không hoàn chỉnh |
| **Should** | Quan trọng, đưa vào nếu đủ thời gian trong Sprint 2 |
| **Could** | Mong muốn, chỉ làm khi còn dư nguồn lực |
| **Won't** | Không thực hiện trong phạm vi học phần này (ghi nhận để mở rộng sau) |

Quy ước chung cho AC: mọi API lỗi trả mã HTTP đúng chuẩn kèm thông điệp lỗi dạng JSON; mọi giao diện kiểm thử ở viewport 360×640 trở lên.

## 2. Mô tả tổng quan

### 2.1 Tác nhân (actor)
| Actor | Mô tả |
|---|---|
| Khách vãng lai | Xem menu, chi tiết sản phẩm, thêm vào giỏ; chưa đăng nhập |
| Khách hàng | Đã đăng nhập; đặt đơn, thanh toán, xem lịch sử và trạng thái đơn |
| Nhân viên quầy | Xem và cập nhật trạng thái đơn |
| Quản lý/Admin | Quản lý sản phẩm, tồn kho, khuyến mãi, xem báo cáo |
| Payment Service (mô phỏng) | Hệ thống bên ngoài xử lý thanh toán Ví/Thẻ |

### 2.2 Vòng đời trạng thái đơn hàng
`PENDING_PAYMENT → PAID → PREPARING → READY → COMPLETED`; nhánh phụ: `PENDING_PAYMENT → CANCELLED` (hủy hoặc quá hạn), `PENDING_PAYMENT → PAYMENT_FAILED → PENDING_PAYMENT` (thử lại).

### 2.3 Giả định
- Một cửa hàng duy nhất, một loại tiền tệ (VND).
- Thanh toán là dịch vụ mô phỏng, không kết nối cổng thanh toán thật.
- Người dùng truy cập chủ yếu bằng điện thoại (Chrome/Safari mobile).

## 3. Yêu cầu chức năng

### 3.1 Menu và sản phẩm
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-01 | Hệ thống hiển thị danh sách menu các sản phẩm đang bán (tên, ảnh, giá cơ bản) | Must | GET /products trả 200 và danh sách sản phẩm có trường id, name, price, imageUrl, available; màn hình menu hiển thị đủ số sản phẩm từ seed; sản phẩm ngừng bán không xuất hiện |
| FR-02 | Menu có trạng thái loading, empty và error | Must | Khi API chậm hiển thị skeleton/spinner; khi danh sách rỗng hiển thị thông báo rỗng; khi API trả 5xx hoặc mất mạng hiển thị thông báo lỗi kèm nút Thử lại; nhấn Thử lại gọi lại API |
| FR-03 | Sản phẩm hết hàng được đánh dấu và không thể thêm vào giỏ | Must | Sản phẩm có tồn kho = 0 hiển thị nhãn Hết hàng; nút Thêm vào giỏ bị vô hiệu hóa; gọi API thêm/đặt với sản phẩm đó trả 409 |
| FR-04 | Lọc menu theo danh mục | Should | GET /products?category=X chỉ trả sản phẩm thuộc danh mục X; chọn tab danh mục trên UI cập nhật danh sách trong ≤ 1 giây (dữ liệu seed) |
| FR-05 | Tìm kiếm sản phẩm theo tên | Could | GET /products?q=abc trả sản phẩm có tên chứa abc (không phân biệt hoa thường); không có kết quả thì hiển thị trạng thái empty |

### 3.2 Chi tiết sản phẩm, size và topping
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-06 | Xem chi tiết sản phẩm (mô tả, giá, size, topping khả dụng) | Must | GET /products/:id trả 200 với đầy đủ thông tin; id không tồn tại trả 404; trang chi tiết hiển thị đúng dữ liệu trả về |
| FR-07 | Chọn size (S/M/L) với mức giá chênh lệch | Must | Size mặc định được chọn sẵn; đổi size làm giá hiển thị cập nhật ngay đúng bằng giá cơ bản + phụ thu size; không chọn được size ngoài danh sách |
| FR-08 | Chọn topping tùy chọn với giá phụ thu | Must | Có thể chọn nhiều topping tối đa 5 (cấu hình được); tổng giá = giá size + tổng giá topping; vượt giới hạn thì UI chặn và API trả 400 |
| FR-09 | Ghi chú cho món (đường, đá, lời nhắn) | Could | Ghi chú tối đa 200 ký tự, được lưu vào OrderItem và hiển thị ở màn hình nhân viên |

### 3.3 Giỏ hàng
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-10 | Thêm món (kèm size, topping, số lượng) vào giỏ | Must | Sau khi thêm, biểu tượng giỏ cập nhật số lượng; hai món cùng sản phẩm nhưng khác size/topping là hai dòng riêng; cùng cấu hình thì cộng dồn số lượng |
| FR-11 | Sửa số lượng và xóa món trong giỏ | Must | Tăng/giảm số lượng cập nhật thành tiền dòng và tổng ngay; số lượng về 0 hoặc nhấn Xóa thì dòng bị gỡ; số lượng hợp lệ từ 1 đến 20 |
| FR-12 | Tính tổng tiền giỏ hàng | Must | Tổng = Σ (đơn giá gồm size và topping × số lượng); test đơn vị với ít nhất 5 bộ dữ liệu cho kết quả chính xác tuyệt đối (không sai số làm tròn, tính bằng số nguyên VND); giỏ rỗng hiển thị 0 và vô hiệu hóa nút Đặt đơn |
| FR-13 | Giữ giỏ hàng khi tải lại trang hoặc sau khi đăng nhập | Should | Tải lại trang (F5) giỏ vẫn còn nguyên; đăng nhập từ giỏ của khách vãng lai không làm mất món |

### 3.4 Xác thực và phân quyền
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-14 | Đăng ký tài khoản bằng email và mật khẩu | Must | POST /auth/register trả 201 với dữ liệu hợp lệ; email trùng trả 409; email sai định dạng hoặc mật khẩu dưới 8 ký tự trả 400 kèm lỗi theo từng trường; form hiển thị lỗi tương ứng |
| FR-15 | Đăng nhập và cấp JWT | Must | POST /auth/login đúng thông tin trả 200 kèm access token JWT; sai thông tin trả 401 với thông báo không tiết lộ email hay mật khẩu sai; token chứa userId và role |
| FR-16 | Đăng xuất và xử lý token hết hạn | Must | Đăng xuất xóa token phía client và chuyển về menu; gọi API bảo vệ bằng token hết hạn trả 401 và UI yêu cầu đăng nhập lại mà không crash |
| FR-17 | Phân quyền theo vai trò (CUSTOMER, STAFF, ADMIN) | Must | Customer gọi API dành cho Staff/Admin nhận 403; Staff không truy cập được API quản trị sản phẩm; Customer chỉ đọc được đơn của chính mình (đơn của người khác trả 403 hoặc 404) |
| FR-18 | Yêu cầu đăng nhập khi đặt đơn | Must | Khách vãng lai nhấn Đặt đơn được chuyển đến trang đăng nhập; sau đăng nhập thành công quay lại bước đặt đơn với giỏ hàng còn nguyên |

### 3.5 Đặt đơn
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-19 | Tạo đơn hàng từ giỏ hàng | Must | POST /orders (có JWT) trả 201 với orderId, danh sách OrderItem, tổng tiền, trạng thái PENDING_PAYMENT; không có JWT trả 401; giỏ rỗng hoặc dữ liệu sai trả 400; tổng tiền do server tính lại, bỏ qua giá client gửi lên |
| FR-20 | Kiểm tra và trừ tồn kho khi tạo đơn | Must | Nếu có món vượt tồn kho, toàn bộ đơn không được tạo, API trả 409 nêu rõ món hết hàng; tạo đơn và trừ kho nằm trong cùng một transaction (lỗi giữa chừng không để lại đơn mồ côi hay kho bị trừ sai) |
| FR-21 | Lưu snapshot giá và tên sản phẩm tại thời điểm đặt | Should | Sau khi đổi giá sản phẩm, đơn cũ vẫn hiển thị giá lúc đặt |
| FR-22 | Tự hủy đơn chưa thanh toán sau thời hạn và hoàn trả tồn kho | Should | Đơn PENDING_PAYMENT quá 15 phút (cấu hình được) chuyển sang CANCELLED và tồn kho được cộng lại; kiểm chứng bằng test với thời hạn rút ngắn |
| FR-23 | Chọn hình thức nhận món (tại quầy hoặc mang đi) | Could | Đơn lưu trường pickupType; nhân viên thấy giá trị này trong danh sách đơn |

### 3.6 Thanh toán
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-24 | Thanh toán bằng Ví mô phỏng | Must | POST /payments với phương thức WALLET cho đơn PENDING_PAYMENT: thành công thì Payment=SUCCESS và đơn chuyển sang PAID; số dư ví không đủ thì Payment=FAILED với mã lỗi rõ ràng |
| FR-25 | Thanh toán bằng Thẻ mô phỏng | Must | Số thẻ test hợp lệ cho kết quả thành công; số thẻ test được quy ước cho kết quả thất bại; dữ liệu thẻ đầy đủ không được lưu trong DB và không xuất hiện trong log |
| FR-26 | Idempotency khi gửi lại yêu cầu thanh toán | Must | Gửi hai lần POST /payments cùng Idempotency-Key cho cùng một đơn chỉ tạo đúng 1 bản ghi Payment và chỉ trừ tiền 1 lần; lần gửi lại trả kết quả giống lần đầu; có integration test chứng minh |
| FR-27 | Xử lý thanh toán thất bại và cho phép thử lại | Must | Khi thất bại đơn vẫn ở trạng thái PENDING_PAYMENT hoặc PAYMENT_FAILED và không bị mất; UI hiển thị lý do và nút Thử lại; thử lại thành công thì đơn chuyển PAID; không thể thanh toán đơn đã PAID (trả 409) |
| FR-28 | Hoàn tiền | Won't | Không thực hiện trong học phần này |

### 3.7 Xác nhận, lịch sử và theo dõi đơn
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-29 | Hiển thị xác nhận đơn sau khi thanh toán thành công | Must | Màn hình xác nhận hiển thị mã đơn, danh sách món, tổng tiền, phương thức thanh toán, trạng thái; giỏ hàng được làm rỗng sau khi thanh toán thành công |
| FR-30 | Xem lịch sử đơn hàng của tôi | Must | GET /orders/me trả danh sách đơn của người dùng hiện tại, sắp xếp mới nhất trước, có phân trang; không lẫn đơn của người khác; trạng thái rỗng hiển thị khi chưa có đơn |
| FR-31 | Theo dõi trạng thái đơn gần thời gian thực | Must | Trang chi tiết đơn tự cập nhật trạng thái (polling tối đa 10 giây/lần) sau khi nhân viên đổi trạng thái; GET /orders/:id trả đúng trạng thái hiện tại |
| FR-32 | Cập nhật trạng thái bằng kênh đẩy (WebSocket/SSE) | Could | Trạng thái thay đổi hiển thị trên máy khách trong ≤ 2 giây mà không cần tải lại |

### 3.8 Quản lý trạng thái đơn (nhân viên) và quản trị
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| FR-33 | Nhân viên xem danh sách đơn đã thanh toán và lọc theo trạng thái | Must | GET /staff/orders (role STAFF) trả đơn lọc theo status; Customer gọi nhận 403 |
| FR-34 | Nhân viên cập nhật trạng thái đơn theo đúng thứ tự cho phép | Must | PATCH /orders/:id/status chấp nhận PAID→PREPARING→READY→COMPLETED; chuyển trạng thái sai thứ tự (ví dụ PAID→COMPLETED) trả 400/409; mỗi lần đổi được ghi lại thời điểm và người thực hiện |
| FR-35 | Quản lý sản phẩm, giá, tồn kho (thêm/sửa/ẩn) | Should | Admin tạo/sửa/ẩn sản phẩm qua API; sản phẩm bị ẩn biến mất khỏi menu khách; dữ liệu đầu vào được validate; Customer/Staff gọi nhận 403 |
| FR-36 | Mã khuyến mãi (Promotion) áp dụng vào đơn | Could | Mã hợp lệ làm giảm tổng đúng theo quy tắc; mã hết hạn, sai hoặc vượt giới hạn dùng bị từ chối kèm lý do; giảm giá không làm tổng âm |
| FR-37 | Tích điểm khách hàng (LoyaltyTransaction) | Could | Đơn PAID sinh một LoyaltyTransaction cộng điểm theo tỷ lệ cấu hình (ví dụ 1 điểm / 10.000 VND); đơn bị hủy không sinh điểm; số điểm xem được ở hồ sơ |
| FR-38 | Báo cáo doanh thu theo ngày | Could | Admin xem tổng doanh thu và số đơn PAID trong ngày; số liệu khớp với dữ liệu seed trong test |

## 4. Yêu cầu phi chức năng

### 4.1 Hiệu năng
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-01 | Thời gian phản hồi API đọc | Must | Với 50 người dùng đồng thời trong 1 phút (k6/autocannon), GET /products và GET /products/:id có p95 ≤ 500 ms trên môi trường production |
| NFR-02 | Tốc độ tải trang di động | Should | Lighthouse (mobile, throttle 4G) cho trang menu: Performance ≥ 80, LCP ≤ 2,5 s |
| NFR-03 | Thời gian tạo đơn và thanh toán | Should | POST /orders và POST /payments có p95 ≤ 1.000 ms với 20 người dùng đồng thời |

### 4.2 Bảo mật
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-04 | Lưu mật khẩu an toàn | Must | Mật khẩu được băm bằng bcrypt (cost ≥ 10) hoặc argon2; kiểm tra DB không có mật khẩu dạng rõ; API không bao giờ trả trường password |
| NFR-05 | Bảo vệ API bằng JWT | Must | Token ký bằng secret từ biến môi trường, có thời hạn (≤ 24 giờ); token sai chữ ký hoặc hết hạn bị từ chối 401; có test tự động cho cả hai trường hợp |
| NFR-06 | Validate dữ liệu đầu vào ở frontend và backend | Must | Backend dùng DTO validation (class-validator) với whitelist, trường thừa bị loại bỏ; payload sai trả 400; truy vấn DB dùng ORM/tham số hóa nên chuỗi chứa SQL injection không làm thay đổi dữ liệu (có test) |
| NFR-07 | Truyền tải qua HTTPS và cấu hình CORS | Must | URL production chỉ truy cập qua HTTPS (HTTP chuyển hướng sang HTTPS); CORS chỉ cho phép origin của frontend production |
| NFR-08 | Quản lý secret | Must | Không có secret trong repository (quét bằng gitleaks hoặc tương đương không có phát hiện); chỉ có .env.example với giá trị mẫu; secret không in trong log CI |
| NFR-09 | Giới hạn tần suất đăng nhập (rate limiting) | Should | Quá 5 lần đăng nhập sai trong 1 phút từ cùng IP trả 429 |
| NFR-10 | Cơ sở dữ liệu không công khai | Must | PostgreSQL production không có địa chỉ public; kết nối từ máy ngoài mạng nội bộ bị từ chối |

### 4.3 Tính khả dụng
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-11 | Giao diện mobile-first | Must | Toàn bộ luồng từ menu đến xác nhận dùng được ở viewport 360×640 mà không cuộn ngang; nút bấm có vùng chạm tối thiểu 44×44 px |
| NFR-12 | Hỗ trợ PWA | Should | Có manifest và service worker; Lighthouse PWA nhận diện cài đặt được; menu đã tải vẫn hiển thị khi mất mạng ở lần mở sau |
| NFR-13 | Giao diện tiếng Việt và định dạng tiền VND | Should | Mọi giá hiển thị dạng 45.000 ₫; thông báo lỗi bằng tiếng Việt, dễ hiểu, không lộ chi tiết kỹ thuật |
| NFR-14 | Khả năng truy cập và tương thích trình duyệt | Should | Lighthouse Accessibility ≥ 85; chạy đúng trên Chrome và Safari phiên bản mới nhất của Android/iOS |

### 4.4 Độ tin cậy và toàn vẹn dữ liệu
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-15 | Không bán vượt tồn kho (chống race condition) | Must | Test tích hợp gửi 20 yêu cầu đặt đơn đồng thời cho sản phẩm tồn kho 5: tối đa 5 đơn thành công, tồn kho cuối cùng không âm |
| NFR-16 | Tính nhất quán giữa đơn và thanh toán | Must | Không tồn tại đơn PAID mà không có Payment SUCCESS và ngược lại (truy vấn kiểm tra sau bộ test trả 0 dòng vi phạm) |
| NFR-17 | Health check và khả dụng production | Must | GET /health trả 200 kèm trạng thái kết nối DB; URL production truy cập được tại thời điểm chấm; nền tảng tự khởi động lại container khi health check thất bại |

### 4.5 Khả năng triển khai, vận hành và bảo trì
| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận |
|---|---|---|---|
| NFR-18 | Chạy toàn hệ thống ở local bằng Docker | Must | Từ repository mới clone, lệnh docker compose up dựng được web, API và database; truy cập được menu theo README mà không cần cài thêm thành phần nào khác ngoài Docker |
| NFR-19 | Migration và seed tái tạo được | Must | Chạy migration và seed trên database rỗng tạo đầy đủ schema và dữ liệu mẫu; chạy lại không gây lỗi hoặc nhân đôi dữ liệu |
| NFR-20 | Pipeline CI chặn mã lỗi | Must | Khi mở pull request, CI chạy Install → Lint → Unit Test → Build; pull request không merge được nếu bất kỳ bước nào thất bại (có minh chứng một lần xanh và một lần đỏ) |
| NFR-21 | Pipeline CD tự động triển khai | Must | Push/tag kích hoạt Lint & Test → Build Docker image (tag theo commit SHA hoặc semver) → Push registry → Deploy → Smoke test; migration chạy trước khi chuyển lưu lượng; smoke test gọi GET /health |
| NFR-22 | Rollback khi triển khai thất bại | Must | Khi smoke test thất bại pipeline dừng với trạng thái lỗi; README mô tả các bước quay về image tag trước đó và đã thử rollback thành công ít nhất một lần |
| NFR-23 | Ghi log có cấu trúc | Should | Mỗi request API ghi log gồm method, path, status, thời gian xử lý, request-id; log không chứa mật khẩu, token hay dữ liệu thẻ |
| NFR-24 | Kiểm thử tự động | Should | Unit test cho nghiệp vụ trọng yếu (tính tiền, state machine đơn, tồn kho) đạt độ phủ dòng ≥ 70% ở các module này; có integration test cho tạo đơn/thanh toán và ít nhất 1 test E2E từ menu đến xác nhận đơn |
| NFR-25 | Chuẩn mã nguồn và quy trình | Should | ESLint/Prettier không có lỗi; commit theo quy ước (ví dụ Conventional Commits); backend tổ chức theo module domain (auth, products, orders, payments) |

## 5. Nội dung không thực hiện (Won't)
| Mã | Nội dung | Lý do |
|---|---|---|
| FR-28 | Hoàn tiền | Ngoài phạm vi MVP, thanh toán chỉ mô phỏng |
| FR-39 | Thanh toán thật qua cổng như VNPay, MoMo, Stripe | Chỉ dùng dịch vụ thanh toán mô phỏng |
| FR-40 | Quên mật khẩu, đăng nhập mạng xã hội (OAuth) | Không thuộc luồng nghiệp vụ tối thiểu |
| FR-41 | Giao hàng tận nơi, theo dõi shipper | Chỉ nhận món tại quầy |
| FR-42 | Đa chi nhánh, đa tiền tệ, đa ngôn ngữ | Một cửa hàng, VND, tiếng Việt |
| FR-43 | Push notification | Chỉ cập nhật trạng thái trong ứng dụng |

## 6. Tổng hợp theo mức ưu tiên
| MoSCoW | Yêu cầu chức năng | Yêu cầu phi chức năng |
|---|---|---|
| Must | FR-01, 02, 03, 06, 07, 08, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 24, 25, 26, 27, 29, 30, 31, 33, 34 | NFR-01, 04, 05, 06, 07, 08, 10, 11, 15, 16, 17, 18, 19, 20, 21, 22 |
| Should | FR-04, 13, 21, 22, 35 | NFR-02, 03, 09, 12, 13, 14, 23, 24, 25 |
| Could | FR-05, 09, 23, 32, 36, 37, 38 | – |
| Won't | FR-28, 39, 40, 41, 42, 43 | – |

## 7. Use-case tổng quát (căn cứ để vẽ sơ đồ)
| Mã UC | Use-case | Actor | Yêu cầu liên quan |
|---|---|---|---|
| UC-01 | Xem menu và chi tiết sản phẩm | Khách vãng lai, Khách hàng | FR-01 đến FR-08 |
| UC-02 | Quản lý giỏ hàng | Khách vãng lai, Khách hàng | FR-10 đến FR-13 |
| UC-03 | Đăng ký / Đăng nhập | Khách hàng | FR-14 đến FR-18 |
| UC-04 | Đặt và thanh toán đơn hàng (use-case trọng tâm cho Task 1.3) | Khách hàng, Payment Service | FR-19 đến FR-22, FR-24 đến FR-27, FR-29 |
| UC-05 | Xem lịch sử và theo dõi đơn | Khách hàng | FR-30, FR-31, FR-32 |
| UC-06 | Xử lý và cập nhật trạng thái đơn | Nhân viên quầy | FR-33, FR-34 |
| UC-07 | Quản lý sản phẩm, khuyến mãi, báo cáo | Quản lý/Admin | FR-35 đến FR-38 |

Ghi chú: NFR áp dụng xuyên suốt cho mọi use-case; sẽ được đưa vào cột Test của docs/traceability-matrix.md.