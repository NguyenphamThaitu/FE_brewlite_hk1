# Hướng dẫn chạy và triển khai BrewLite

Tài liệu gồm: chạy local bằng Docker, biến môi trường, migration và seed, triển khai production lên
Render, pipeline CD, smoke test và rollback. Kiến trúc tổng thể xem
[`docs/architecture/architecture.md`](architecture/architecture.md). Quyết định nền tảng xem
[ADR-002](architecture/adr/002-deploy-platform.md), quy trình CI/CD xem ADR-007 (PR #14).

## 1. Các môi trường

| Môi trường | Chạy ở đâu | Dùng để |
|---|---|---|
| Local | Máy cá nhân, `docker compose` | Phát triển, demo, test thủ công |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Lint, test, build mỗi pull request |
| Production | Render (web, API, PostgreSQL) | Bản chấm điểm, truy cập qua HTTPS |

Sơ đồ triển khai: [local](diagrams/deployment-local.svg), [production](diagrams/deployment-production.svg).

## 2. Chạy local bằng Docker Compose

Yêu cầu: Docker Desktop (hoặc Docker Engine có `docker compose`), Git. Không cần cài Node hay
PostgreSQL.

```bash
git clone https://github.com/NguyenphamThaitu/FE_brewlite_hk1.git
cd FE_brewlite_hk1
cp .env.example .env          # sửa mật khẩu, JWT_SECRET trong .env
docker compose up -d --build  # dựng db + api
```

| Kiểm tra | Kết quả mong đợi |
|---|---|
| `docker compose ps` | `db` và `api` ở trạng thái `healthy` |
| http://localhost:3001/health | `{"status":"ok","db":"up",...}` |
| http://localhost:3001/products | Danh sách món đã seed |

Chạy kèm web (service `web` đang bật theo profile):

```bash
docker compose --profile web up -d --build
# mở http://localhost:3000
```

Tài khoản nhân viên được seed: `staff@brewlite.local`, mật khẩu là giá trị `STAFF_PASSWORD` trong
`.env` (mặc định `Staff@123`).

| Việc | Lệnh |
|---|---|
| Xem log API | `docker compose logs -f api` |
| Dừng | `docker compose down` |
| Xóa sạch dữ liệu, seed lại từ đầu | `docker compose down -v` rồi `docker compose up -d --build` |

Lưu ý:

- Container `db` không mở cổng ra máy host. Muốn xem dữ liệu thì dùng
  `docker compose exec db psql -U brewlite brewlite`.
- `docker-compose.yml` hiện chưa truyền biến `VNPAY_*` vào container API, nên `POST /payments/vnpay`
  trả 503 "VNPay chưa được cấu hình". Muốn thử thanh toán thì thêm các biến này vào mục
  `api.environment`, hoặc chạy API trực tiếp (mục 3).

## 3. Chạy API trực tiếp bằng Node (không build image)

Dùng khi sửa code backend hoặc khi máy không build được image.

```bash
docker compose up -d db                 # hoặc một PostgreSQL bất kỳ
cd apps/api
cp .env.example .env                    # sửa DATABASE_URL trỏ đúng DB
npm ci
npx prisma migrate deploy               # tạo bảng
npm run build
npm start                               # AUTO_SEED=true sẽ seed khi DB trống
```

Kiểm thử: `npm run lint`, `npm test` (unit), `npm run test:int` (integration, cần PostgreSQL).

## 4. Biến môi trường

Không commit file `.env` (đã có trong `.gitignore`). Chỉ commit `.env.example` với giá trị mẫu.

| Biến | Dùng bởi | Ví dụ local | Bí mật |
|---|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | compose (`db`) | `brewlite` / `brewlite_dev` / `brewlite` | Mật khẩu: có |
| `DATABASE_URL` | API | `postgresql://brewlite:brewlite_dev@db:5432/brewlite` | Có |
| `PORT` | API | `3001` | Không |
| `JWT_SECRET` | API | chuỗi ngẫu nhiên ≥ 32 ký tự | Có |
| `JWT_EXPIRES_IN` | API | `1d` (mặc định) | Không |
| `CORS_ORIGIN` | API | `http://localhost:3000` (nhiều origin cách nhau bằng dấu phẩy) | Không |
| `AUTO_SEED` | API | `true` | Không |
| `STAFF_PASSWORD` | API (seed) | `Staff@123` | Có |
| `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET` | API | lấy từ tài khoản VNPay sandbox | Có |
| `VNPAY_URL` | API | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` | Không |
| `VNPAY_RETURN_URL` | API | `http://localhost:3000/payment/result` | Không |
| `NEXT_PUBLIC_API_URL` | Web (lúc build) | `http://localhost:3001` | Không |

## 5. Migration và seed

- Migration nằm ở `apps/api/prisma/migrations`. Container API chạy `npm run start:prod`, tức là
  `prisma migrate deploy` rồi mới khởi động server, nên DB luôn đúng schema của bản code đang chạy.
- Tạo migration mới (chỉ ở máy dev): sửa `schema.prisma` rồi
  `npx prisma migrate dev --name <ten_thay_doi>`, commit cả thư mục migration mới.
- Seed (`src/prisma/seed.ts`) chỉ chạy khi bảng `Product` còn trống, nên khởi động lại không nhân đôi
  dữ liệu. Seed thủ công: `npm run seed` (sau khi build).
- Không sửa hay xóa migration đã merge vào `main`; muốn thay đổi thì tạo migration mới.

## 6. Triển khai production lên Render

Phần này mô tả cấu hình theo ADR-002 và ADR-007. Người có quyền quản trị Render và repo thực hiện
một lần khi dựng hệ thống.

### 6.1. PostgreSQL

1. Render Dashboard → **New → PostgreSQL**, chọn gói Free, cùng region với API.
2. Lấy **Internal Database URL** làm `DATABASE_URL` cho API. Không dùng External URL, không thêm IP
   vào danh sách truy cập ngoài.
3. DB gói Free hết hạn sau 30 ngày kể từ ngày tạo: tạo sao cho còn hạn đến ngày chấm. Dữ liệu tạo lại
   được bằng migration và seed.

### 6.2. API (`brewlite-api`)

1. **New → Web Service → Existing Image**, image `ghcr.io/<owner>/brewlite-api:<tag>`. Nếu package
   GHCR để private thì thêm credential có quyền `read:packages`.
2. Biến môi trường: `DATABASE_URL` (Internal URL), `JWT_SECRET`, `CORS_ORIGIN` = URL web production,
   `AUTO_SEED=true`, `STAFF_PASSWORD`, `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`,
   `VNPAY_RETURN_URL=https://<web>/payment/result`. Không cần đặt `PORT` vì Render tự cấp, API đọc
   `PORT`.
3. **Health Check Path**: `/health`.
4. Tạo **Deploy Hook**, lưu URL vào GitHub Secrets (ví dụ `RENDER_API_DEPLOY_HOOK`).
5. Trên cổng merchant VNPay sandbox, khai báo IPN URL: `https://<api>/payments/vnpay/ipn`.

### 6.3. Web (`brewlite-web`)

1. Build image với `--build-arg NEXT_PUBLIC_API_URL=https://<api>` vì biến này được gắn vào lúc build.
2. **New → Web Service → Existing Image**, image `ghcr.io/<owner>/brewlite-web:<tag>`.
3. Tạo Deploy Hook, lưu vào GitHub Secrets (ví dụ `RENDER_WEB_DEPLOY_HOOK`).

### 6.4. Secret cần có trên GitHub

| Secret | Dùng cho |
|---|---|
| `RENDER_API_DEPLOY_HOOK` | Gọi deploy API |
| `RENDER_WEB_DEPLOY_HOOK` | Gọi deploy web |
| `GITHUB_TOKEN` (có sẵn) | Push image lên GHCR, cần `permissions: packages: write` |

Tên secret là đề xuất; nếu pipeline CD dùng tên khác thì cập nhật bảng này.

## 7. Pipeline CD

Trạng thái: **chưa có `cd.yml`**. Các bước dự kiến (ADR-007, NFR-21):

| # | Bước | Thành công khi |
|---|---|---|
| 1 | Kích hoạt khi push `main` hoặc push tag `v*` | – |
| 2 | Lint, unit test, build (giống CI) | Không có lỗi |
| 3 | Build image `brewlite-api`, `brewlite-web`, tag `sha-<commit>` (thêm `vX.Y.Z` khi có tag) | Build xong |
| 4 | Push lên GHCR | Image có trên GHCR |
| 5 | Gọi deploy hook kèm `imgURL` trỏ đúng tag SHA | Render nhận yêu cầu |
| 6 | Render khởi động container: `prisma migrate deploy` → server → qua health check `/health` mới nhận traffic | Bản mới live |
| 7 | Smoke test (mục 8), thử lại vài lần vì dịch vụ Free có thể đang ngủ | `/health` trả 200 |
| 8 | Smoke test lỗi → job đỏ, dừng pipeline, làm rollback (mục 9) | – |

## 8. Smoke test

```bash
API=https://<api>
curl -fsS "$API/health"                      # {"status":"ok","db":"up",...}
curl -fsS "$API/products" | head -c 200      # có danh sách món
curl -fsS -o /dev/null -w "%{http_code}\n" https://<web>   # 200
```

Kiểm tra thêm bằng tay trước khi chấm: đăng nhập, đặt một đơn, thanh toán sandbox, nhân viên đổi
trạng thái.

## 9. Rollback

Vì image gắn tag theo commit SHA, quay lại bản cũ không cần build lại.

1. **Cách nhanh**: Render Dashboard → service → **Events/Deploys** → chọn bản deploy tốt gần nhất →
   **Rollback**. Gói Free chỉ quay lại được một số ít bản gần nhất.
2. **Cách chủ động**: gọi lại deploy hook với image cũ:

   ```bash
   curl -X POST "$RENDER_API_DEPLOY_HOOK&imgURL=ghcr.io%2F<owner>%2Fbrewlite-api%3Asha-<commit_tot>"
   ```

3. Chạy lại smoke test (mục 8).
4. Sửa lỗi trên nhánh mới, mở PR, merge để deploy bản sửa.

Lưu ý về database: migration chỉ chạy tiến, rollback ứng dụng không hoàn tác schema. Vì vậy migration
nên viết theo kiểu chỉ thêm (thêm cột cho phép null, thêm giá trị enum, thêm bảng) để bản code cũ vẫn
chạy được trên schema mới.

## 10. Xử lý sự cố thường gặp

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Lần mở đầu tiên rất chậm (~1 phút) | Dịch vụ Free ngủ sau 15 phút không có request | Mở web và `/health` trước khi demo |
| `/health` trả 503, `db: down` | Sai `DATABASE_URL`, DB hết hạn hoặc chưa sẵn sàng | Kiểm tra biến môi trường, trạng thái DB trên Render |
| Trình duyệt báo lỗi CORS | `CORS_ORIGIN` không khớp URL web | Đặt đúng URL web (có `https://`, không có `/` cuối) |
| `POST /payments/vnpay` trả 503 | Thiếu `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` | Thêm biến môi trường cho API |
| IPN trả `97` | `VNPAY_HASH_SECRET` không khớp tài khoản sandbox | Kiểm tra lại secret |
| Web gọi nhầm `localhost` ở production | Image web build sai `NEXT_PUBLIC_API_URL` | Build lại image web với URL API production |
| Container API khởi động lỗi migration | Migration mới không chạy được trên dữ liệu hiện có | Rollback bản trước (mục 9), sửa migration bằng một migration mới |

## 11. Checklist trước ngày chấm

- [ ] URL web và API mở được qua HTTPS.
- [ ] `GET /health` trả 200, `db: up`.
- [ ] DB Render còn hạn đến sau ngày chấm.
- [ ] Đăng nhập được bằng tài khoản nhân viên seed.
- [ ] Đặt đơn và thanh toán VNPay sandbox thành công.
- [ ] Đã thử rollback ít nhất một lần và ghi lại minh chứng (NFR-22).
