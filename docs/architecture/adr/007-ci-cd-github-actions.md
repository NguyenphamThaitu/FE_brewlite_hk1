# ADR-007: CI/CD bằng GitHub Actions, image tag theo commit SHA

- Trạng thái: CI – Accepted (job `api` ở PR #4, job `web` ở PR #21) · CD – Accepted (hiện thực ở PR #57)
- Ngày: 2026-11-10
- Liên quan: Task 4, Task 5, NFR-20, NFR-21, NFR-22, ADR-002, ADR-003

## Bối cảnh

Đề bài yêu cầu CI chặn merge khi lint/test/build lỗi, và pipeline CD đầy đủ:
Push/Tag → Lint và Test → Build → Docker Image → Push Registry → Deploy → Smoke Test, có cách
rollback. Nền tảng production là Render (ADR-002).

## Quyết định

### CI (đã hiện thực)

- `.github/workflows/ci.yml`, chạy khi mở/cập nhật PR vào `main` và khi push vào `main`.
- Job `api` (Node 22, thư mục `apps/api`): `npm ci → npm run lint → npm test → npm run build`.
- Job `web` (Node 22, thư mục `apps/web`): cùng 4 bước cho Next.js.
- Ruleset `main-protection` trên GitHub: bắt buộc qua pull request, bắt buộc status check `api`
  và `web` pass, cấm force push và cấm xóa `main`.
- Minh chứng: [`docs/ci-evidence.md`](../../ci-evidence.md).

### CD (đã hiện thực ở PR #57)

- `cd.yml` chạy khi push vào `main`, push tag `v*` hoặc chạy tay (`workflow_dispatch`):
  1. chạy lại quality gate (lint, test, build);
  2. build image `brewlite-api` và `brewlite-web`, tag `sha-<commit>` (thêm `vX.Y.Z` khi phát hành);
  3. push lên GitHub Container Registry bằng `GITHUB_TOKEN` (quyền `packages: write`);
  4. gọi deploy hook của Render (URL hook là secret, lưu trong GitHub Secrets) với tham số `imgURL`
     trỏ đúng tag SHA. Render không tự deploy lại khi tag image đổi nên bước này là bắt buộc;
  5. migration chạy khi container API khởi động (ADR-003); gói miễn phí không có pre-deploy command;
  6. smoke test: gọi `GET /health` (trả `{ status: "ok", db: "up" }`) và `GET /products` trên URL
     production, thử lại trong vài phút vì dịch vụ miễn phí ngủ sau 15 phút và mất khoảng 1 phút để
     khởi động lại;
  7. smoke test thất bại thì job thất bại và dừng pipeline. Rollback: trang Deploys trên Render →
     *Rollback*, hoặc chạy lại deploy hook với tag SHA của bản tốt gần nhất.
- Không in secret ra log; chỉ tham chiếu `${{ secrets.* }}`.
- Khi hiện thực, pipeline bổ sung tag `stable` cho bản đã qua smoke test và **tự quay lui**: deploy
  hoặc smoke test lỗi thì gửi lại deploy hook với ảnh `:stable`. Smoke test kiểm tra `GET /health`,
  `GET /products` và trang chủ web. Chi tiết và kết quả thử quay lui ở
  [`docs/deployment.md`](../../deployment.md) (mục 3, 5 và 7).

## Hệ quả

- Render chỉ chuyển traffic khi bản mới qua health check (đặt health check path là `/health`). Nếu
  không đạt trong 15 phút, Render hủy bản deploy và giữ bản cũ.
- Mỗi bản production truy ngược được về đúng commit qua tag image. Vì dùng tag SHA cố định, rollback
  lấy đúng image cũ, không cần build lại.
- Gói miễn phí chỉ rollback được về 2 bản deploy gần nhất.
- Postgres miễn phí của Render hết hạn sau 30 ngày kể từ khi tạo và không có backup. Phải tạo DB sao
  cho còn hạn đến ngày chấm; seed tái tạo được dữ liệu (ADR-003).
- **Còn thiếu:** CI chưa chạy integration test (`npm run test:int` cần PostgreSQL, có thể dùng
  `services: postgres` của GitHub Actions); hiện chạy ở máy theo hướng dẫn trong README.
- Image GHCR riêng tư thì Render cần credential đọc (`read:packages`), hoặc để package public.

## Phương án đã cân nhắc

- **Render tự build từ GitHub (auto-deploy):** đơn giản nhưng không có bước build image và push
  registry như đề bài yêu cầu, khó chặn deploy khi test lỗi.
- **Docker Hub:** tương đương GHCR nhưng cần thêm tài khoản và token riêng.

Nguồn về Render: tài liệu chính thức trên render.com/docs (Free instances, Deploying an image,
Deploy hooks, Health checks, Deploys, Rollbacks), tra cứu ngày 2026-11-10.
