
## 2. Yêu cầu chức năng: Menu

Trang `/` (frontend), API `GET /products`.

| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận | Hiện trạng |
| --- | --- | --- | --- | --- |
| FR-01 | Hệ thống hiển thị danh sách sản phẩm đang bán, không cần đăng nhập. | Must | **Given** có ít nhất 1 sản phẩm `isActive = true`. **When** mở trang chủ. **Then** mỗi sản phẩm hiện ảnh, tên, giá dạng `35.000đ`. Sản phẩm `isActive = false` không xuất hiện. `GET /products` trả 200, sắp theo `id` tăng dần, mỗi phần tử gồm `id, name, price, imageUrl, category, stock`. | ✅ |
| FR-02 | Menu có đủ 3 trạng thái: đang tải, rỗng, lỗi. | Must | Khi chờ API: hiện «Đang tải menu...». API trả mảng rỗng: hiện «Chưa có sản phẩm nào.». API lỗi hoặc mất kết nối: hiện thông báo lỗi màu đỏ kèm nội dung lỗi, không treo trang. | ✅ |
| FR-03 | Khách tìm món theo tên, không phân biệt hoa thường và dấu tiếng Việt. | Should | Gõ `ca phe` thì hiện «Cà phê sữa» và «Cà phê đen». Gõ `bac xiu` thì hiện «Bạc xỉu» (chữ đ/Đ được chuẩn hóa thành d/D). Khi có từ khóa, hiện «Tìm thấy N món». Không có kết quả thì hiện «Không tìm thấy món nào phù hợp với “từ khóa”.». Lọc tại trình duyệt, không gọi lại API. | ✅ |
| FR-04 | Chọn một món trên menu sẽ chuyển sang trang chi tiết của món đó. | Must | Nhấn vào thẻ sản phẩm id = X thì điều hướng tới `/products/X`. | ✅ |
| FR-05 | Menu hiển thị mobile-first, lưới thích ứng theo màn hình. | Should | 1 cột ở màn hình hẹp, 2 cột từ breakpoint `sm`, 3 cột từ `md`. Không xuất hiện thanh cuộn ngang ở chiều rộng 360px. | ✅ |
| FR-06 | Thứ tự hiển thị ổn định: 6 món cốt lõi theo thứ tự cố định, các món còn lại xếp sau. | Could | Thứ tự: Cà phê sữa, Cà phê đen, Bạc xỉu, Espresso, Americano, Cappuccino. Món ngoài danh sách đứng sau, giữ thứ tự từ API. | ⚠️ Danh sách tên đang hard-code ở frontend |
| FR-07 | Menu nhóm sản phẩm theo danh mục (`category`). | Could | Với dữ liệu seed: nhóm «Cà phê truyền thống» (3 món) và «Cà phê pha máy» (3 món), mỗi nhóm có tiêu đề riêng. | ❌ Dữ liệu có `category`, giao diện chưa dùng |
| FR-08 | Menu đánh dấu món tạm hết nguyên liệu. | Could | Món không còn pha chế được (BR-03, size mặc định M, không topping) hiện nhãn «Tạm hết» trên thẻ. | ❌ Hiện chỉ báo ở trang chi tiết (FR-13) |

## 3. Yêu cầu chức năng: Chi tiết sản phẩm

Trang `/products/[id]`, API `GET /products/:id` và `GET /inventory/product-availability/:id`.

| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận | Hiện trạng |
| --- | --- | --- | --- | --- |
| FR-09 | Hiển thị chi tiết một sản phẩm đang bán. | Must | `GET /products/:id` trả 200 với dữ liệu sản phẩm. Trang hiện ảnh, tên, giá theo lựa chọn hiện tại. Id không tồn tại hoặc sản phẩm `isActive = false` thì API trả 404 «Không tìm thấy sản phẩm». Id không phải số nguyên thì trả 400. | ✅ |
| FR-10 | Khách chọn kích thước S, M hoặc L. Mặc định là M. | Must | Nút size hiện phụ thu: S không phụ thu, M «+5.000đ», L «+10.000đ». Chỉ một size được chọn tại một thời điểm. Đổi size thì giá cập nhật ngay. | ✅ |
| FR-11 | Khách chọn thêm topping/tùy chọn tùy biến. Hiện có «Đậm cafe» (+5.000đ). Cho phép chọn nhiều và bỏ chọn. | Must | Tick «+ Đậm cafe» thì giá tăng 5.000đ. Bỏ tick thì giá về lại. Danh sách topping lấy từ cấu hình giá (`TOPPING_PRICE`). | ⚠️ Danh sách topping hard-code ở cả frontend và backend |
| FR-12 | Giá hiển thị cập nhật tức thời theo công thức BR-01. | Must | Ví dụ: Cà phê sữa (35.000đ), size L, có Đậm cafe thì hiển thị 50.000đ. Kết quả frontend khớp công thức backend `unitPrice()`. | ✅ |
| FR-13 | Kiểm tra khả năng pha chế theo tồn kho nguyên liệu mỗi khi đổi size hoặc topping. | Must | Gọi `GET /inventory/product-availability/:id?size=&toppings=` (không yêu cầu đăng nhập). Nếu `available = false`: hiện cảnh báo «Hết nguyên liệu pha chế cho tùy chọn này» kèm tên nguyên liệu giới hạn (`limitingIngredient`), nút thêm vào giỏ bị khóa và đổi nhãn «Tạm hết nguyên liệu». Trong lúc đang kiểm tra, nút bị khóa. Món chưa có công thức định lượng thì coi là không khả dụng. | ⚠️ Khi gọi API kiểm tra bị lỗi, giao diện vẫn cho thêm vào giỏ |
| FR-14 | Thêm sản phẩm đã tùy chọn vào giỏ hàng. | Must | Nhấn «Thêm vào giỏ hàng» thì thêm 1 ly với `productId, name, imageUrl, size, toppings, unitPrice` rồi chuyển sang `/cart`. Nếu dòng cùng sản phẩm, size, topping đã có thì tăng số lượng (xem FR-18). | ✅ |
| FR-15 | Nút quay lại trang trước. | Could | Nhấn «← Quay lại (tên món)» thì trở về trang trước đó. | ✅ |
| FR-16 | Hiển thị trạng thái đang tải và lỗi của trang chi tiết. | Must | Đang tải: «Đang tải...». Không tải được hoặc không tồn tại: «Không tìm thấy sản phẩm». | ⚠️ Lỗi mạng và lỗi 404 dùng chung một thông báo |

## 4. Yêu cầu chức năng: Giỏ hàng

Trang `/cart`, trạng thái lưu ở client bằng Zustand (`persist`, khóa `brewlite-cart`). Hiện không có API giỏ hàng.

| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận | Hiện trạng |
| --- | --- | --- | --- | --- |
| FR-17 | Giỏ hàng dùng được cả khi chưa đăng nhập và được giữ khi tải lại trang hoặc đóng mở trình duyệt. | Must | Guest thêm món, tải lại trang (F5) thì giỏ vẫn còn đủ dòng và số lượng. | ✅ Lưu trong `localStorage` |
| FR-18 | Các lần thêm cùng sản phẩm, cùng size và cùng tập topping được gộp thành một dòng. | Must | Thêm Cà phê sữa size M không topping hai lần thì giỏ có 1 dòng, số lượng 2. Thứ tự tick topping không ảnh hưởng việc gộp. Khác size hoặc khác topping thì tạo dòng mới. | ✅ |
| FR-19 | Mỗi dòng hiển thị ảnh, tên, size, danh sách topping (nếu có), đơn giá và số lượng. | Must | Dòng «CÀ PHÊ SỮA (M)», topping «Đậm cafe», đơn giá `45.000đ`. | ✅ |
| FR-20 | Tăng hoặc giảm số lượng của từng dòng. Giảm về 0 thì xóa dòng. | Must | Nhấn «+» thì số lượng +1. Nhấn «–» khi số lượng là 1 thì dòng bị xóa. Tổng tiền cập nhật ngay. | ✅ |
| FR-21 | Xóa một dòng khỏi giỏ. | Must | Nhấn «Xóa» thì dòng biến mất, các dòng khác giữ nguyên. | ✅ |
| FR-22 | Tính và hiển thị tổng tiền giỏ hàng. | Must | Tổng = Σ (đơn giá × số lượng). Ví dụ: 2 × 45.000đ + 1 × 40.000đ = 130.000đ. | ✅ |
| FR-23 | Biểu tượng giỏ ở header hiển thị tổng số ly. | Should | Header hiện «Giỏ hàng (N)», N = Σ số lượng của mọi dòng (không phải số dòng). Giỏ trống hiện 0. | ✅ Có unit test `cartCount` |
| FR-24 | Giỏ trống hiện thông báo và đường dẫn quay lại menu. | Must | Hiện «Giỏ hàng trống.» và nút «Xem menu» dẫn tới `/`. | ✅ |
| FR-25 | Nhấn «Thanh toán» để sang bước đặt đơn, có kiểm tra đăng nhập. | Must | Đã đăng nhập thì chuyển `/checkout`. Chưa đăng nhập thì chuyển `/login`. | ⚠️ Sau đăng nhập hệ thống đưa về `/cart`, khách phải nhấn «Thanh toán» lần nữa |
| FR-26 | Giới hạn số lượng tối đa mỗi dòng là 20 ly (BR-04). | Should | Giao diện không cho tăng quá 20 và hiện thông báo. Nếu vượt, API tạo đơn trả 400. | ⚠️ Chỉ API chặn, giao diện chưa chặn |
| FR-27 | Khi tạo đơn, máy chủ tính lại giá từ dữ liệu sản phẩm, bỏ qua giá do client gửi (BR-05). | Must | Body tạo đơn chỉ gồm `productId, size, toppings, qty`. Tổng đơn do máy chủ tính từ giá gốc trong CSDL và bảng phụ thu. | ✅ |

## 5. Yêu cầu chức năng: Xác thực và phân quyền

Trang `/login`, `/register`; API `POST /auth/register`, `POST /auth/login`. Mật khẩu băm bằng bcrypt (cost 10). Phiên dùng JWT gửi qua header `Authorization: Bearer`.

| Mã | Yêu cầu | MoSCoW | Tiêu chí chấp nhận | Hiện trạng |
| --- | --- | --- | --- | --- |
| FR-28 | Khách đăng ký tài khoản bằng email và mật khẩu. | Must | **Given** email chưa tồn tại, mật khẩu từ 6 ký tự. **When** gửi `POST /auth/register`. **Then** trả 201, tạo người dùng vai trò `CUSTOMER` với 0 điểm thưởng, trả `accessToken` và `user` (`id, email, loyaltyPoints, role`). Mật khẩu chỉ lưu dạng băm, không bao giờ trả về. Giao diện tự đăng nhập và chuyển sang `/cart`. | ✅ |
| FR-29 | Kiểm tra dữ liệu đăng ký và chặn trùng email. | Must | Email sai định dạng hoặc mật khẩu dưới 6 ký tự thì trả 400 kèm thông báo. Email đã đăng ký thì trả 409 «Email đã được đăng ký». Trường lạ trong body (ví dụ `role: "ADMIN"`) bị loại bỏ, không thể tự cấp quyền admin (BR-06). | ⚠️ Email chưa được chuẩn hóa hoa/thường (mục 6) |
| FR-30 | Khách đăng nhập bằng email và mật khẩu. | Must | Thông tin đúng thì trả 200 với `accessToken` và `user`, giao diện chuyển sang `/cart`. Sai email hoặc sai mật khẩu thì trả 401 «Sai email hoặc mật khẩu». Hai trường hợp dùng chung một thông báo để không lộ email nào đã đăng ký. | ✅ |
| FR-31 | Cấp và xác minh JWT. | Must | Token chứa `sub` (id người dùng), `email`, `role`, hết hạn sau 24 giờ, ký bằng `JWT_SECRET` đọc từ biến môi trường. Thiếu `JWT_SECRET` thì ứng dụng không khởi động. Token thiếu, sai chữ ký hoặc hết hạn thì endpoint được bảo vệ trả 401. | ✅ Chưa có refresh token |
| FR-32 | Giữ phiên đăng nhập ở client. | Must | Sau đăng nhập, tải lại trang vẫn còn trạng thái đăng nhập (Zustand `persist`, khóa `brewlite-auth`). Header hiện «Đơn của tôi», «Đăng xuất». Khi chưa đăng nhập hiện «Đăng nhập», «Đăng ký». | ✅ Token nằm trong `localStorage` |
| FR-33 | Đăng xuất. | Must | Nhấn «Đăng xuất» thì xóa `token` và `user` khỏi client, header trở về trạng thái khách. | ⚠️ Không thu hồi token phía máy chủ, giỏ hàng không bị xóa |
| FR-34 | Phân quyền theo vai trò `CUSTOMER` và `ADMIN`. | Must | Endpoint back-office (ví dụ `/inventory/ingredients`, `/inventory/forecast`) yêu cầu `ADMIN`. `CUSTOMER` gọi vào thì nhận 403 «Bạn không có quyền quản trị để thực hiện thao tác này». Liên kết «Quản lý kho», «Doanh thu & Khuyến mãi» chỉ hiện với `ADMIN`. | ✅ |
| FR-35 | Chức năng cần danh tính chỉ dùng được khi đã đăng nhập. | Must | `POST /orders` và `POST /payments` không có token thì trả 401. Truy cập `/checkout` khi chưa đăng nhập thì chuyển sang `/login`. Menu, chi tiết sản phẩm, giỏ hàng và `GET /inventory/product-availability/:id` vẫn công khai. | ✅ |
| FR-36 | Form đăng ký và đăng nhập có trạng thái xử lý và hiển thị lỗi. | Should | Khi đang gửi: nút bị khóa và hiện «Đang xử lý...». Khi API lỗi: hiện thông báo từ máy chủ màu đỏ dưới form, thông báo validate nhiều lỗi được nối thành một dòng. | ✅ |
| FR-37 | Kiểm tra dữ liệu ngay trên form trước khi gửi (Task 5.1 yêu cầu validate cả frontend và backend). | Should | Email sai định dạng hoặc mật khẩu dưới 6 ký tự thì báo lỗi tại ô nhập, không gọi API. Ô email dùng `type="email"`. | ❌ Hiện chỉ backend validate |
| FR-38 | Có sẵn một tài khoản `ADMIN` phục vụ demo và nghiệm thu. | Must | Chạy seed tạo tài khoản `admin@brewlite.vn` nếu chưa có. Chạy seed nhiều lần không tạo trùng. Mật khẩu demo cần đổi trước khi triển khai production. | ✅ Mật khẩu demo đang nằm trong `seed.ts` |


## 7. Gợi ý truy vết

Bảng này làm nền cho `docs/traceability-matrix.md`. Mã US, UC, sơ đồ và test là đề xuất để nhóm đặt tên lại cho thống nhất với backlog.

| Mã yêu cầu | User story / Use-case | API / Màn hình | Code chính | Test đề xuất |
| --- | --- | --- | --- | --- |
| FR-01, FR-02 | US-01 Xem menu | `GET /products`, trang `/` | `products.service.ts`, `app/page.tsx` | API-T01 (danh sách, lọc `isActive`), UI-T01 (loading, empty, error) |
| FR-03 | US-02 Tìm món | Trang `/` | `normalizeText` trong `app/page.tsx` | UI-T02 (tìm không dấu) |
| FR-04 đến FR-08 | US-01 Xem menu | Trang `/` | `app/page.tsx` | UI-T03 (điều hướng, bố cục) |
| FR-09 | US-03 Xem chi tiết | `GET /products/:id`, trang `/products/[id]` | `products.controller.ts`, `app/products/[id]/page.tsx` | API-T02 (200, 404, 400) |
| FR-10 đến FR-12 | US-04 Chọn size và topping | Trang `/products/[id]` | `lib/pricing.ts`, `common/pricing.ts` | UNIT-T01 (`unitPrice`) |
| FR-13 | US-05 Biết món còn pha được | `GET /inventory/product-availability/:id` | `inventory-calculation.service.ts` | INT-T01 (đủ, thiếu, chưa có công thức) |
| FR-14, FR-17 đến FR-24 | US-06 Quản lý giỏ hàng | Trang `/cart` | `store/cart.ts`, `app/cart/page.tsx` | UNIT-T02 (gộp dòng, `cartTotal`, `setQty`) |
| FR-25, FR-26, FR-27 | UC-01 Đặt và thanh toán đơn | `POST /orders` | `orders.service.ts`, `create-order.dto.ts` | INT-T02 (giá tính lại, qty vượt 20) |
| FR-28, FR-29, FR-30 | US-07 Đăng ký, đăng nhập | `POST /auth/register`, `POST /auth/login` | `auth.service.ts`, `auth.dto.ts`, `components/auth-form.tsx` | API-T03 (201, 400, 409, 401) |
| FR-31, FR-35 | US-07 Đăng ký, đăng nhập | Các endpoint có `JwtAuthGuard` | `jwt.strategy.ts`, `jwt-auth.guard.ts` | API-T04 (không token, token hết hạn) |
| FR-32, FR-33, FR-36, FR-37 | US-07 Đăng ký, đăng nhập | `/login`, `/register`, header | `store/auth.ts`, `components/header.tsx` | UI-T04 (phiên, đăng xuất, lỗi form) |
| FR-34, FR-38 | US-08 Quản trị | Endpoint back-office | `roles.guard.ts`, `prisma/seed.ts` | API-T05 (403 với `CUSTOMER`) |
