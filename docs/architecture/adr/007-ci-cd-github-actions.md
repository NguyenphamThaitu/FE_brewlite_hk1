# ADR-007: CI/CD bằng GitHub Actions, image tag theo commit SHA

- Trạng thái: Proposed (chờ Thái Tú xác nhận khi dựng pipeline)
- Ngày: 2026-11-10
- Liên quan: Task 4.4, Task 5.3, ADR-002

## Bối cảnh

Đề bài yêu cầu CI chặn merge khi lint/test/build lỗi, và pipeline CD đầy đủ:
Push/Tag → Lint và Test → Build → Docker Image → Push Registry → Deploy → Smoke Test, có cách
rollback khi thất bại.

## Quyết định

- Nền tảng: **GitHub Actions** trong `.github/workflows/`.
- `ci.yml` chạy khi mở/cập nhật pull request vào `main`: `npm ci → lint → unit test → build` cho
  `apps/api` và `apps/web`. Các job này là status check bắt buộc trong branch protection.
- `cd.yml` chạy khi push vào `main` hoặc push tag `v*`:
  1. chạy lại quality gate (lint, test, build);
  2. build image `ghcr.io/<owner>/brewlite-api` và `brewlite-web`, tag `sha-<commit>` (và tag
     phiên bản `vX.Y.Z` khi phát hành);
  3. push lên GHCR bằng `GITHUB_TOKEN` (quyền `packages: write`);
  4. gọi deploy hook của Render (secret trong GitHub Secrets) với tham số `imgURL` trỏ tới đúng
     tag SHA;
  5. migration chạy khi container API khởi động (ADR-002, ADR-003);
  6. smoke test: gọi `GET /health` và `GET /products` trên URL production, thử lại có giới hạn
     thời gian vì dịch vụ miễn phí có thể đang ngủ;
  7. smoke test thất bại thì job thất bại; rollback bằng nút *Rollback* trên Render hoặc chạy lại
     deploy hook với tag SHA của bản tốt gần nhất.
- Không in secret ra log; chỉ tham chiếu `${{ secrets.* }}`.

## Hệ quả

- Mỗi bản production truy ngược được về đúng commit qua tag image.
- Rollback không cần build lại.
- Phụ thuộc GitHub Actions và GHCR; image GHCR riêng tư thì Render cần credential đọc
  (`read:packages`), hoặc đặt package ở chế độ public.

## Phương án đã cân nhắc

- **Render tự build từ GitHub (auto-deploy):** đơn giản nhưng không có bước build image và push
  registry như đề bài yêu cầu, khó chặn deploy khi test lỗi.
- **Docker Hub:** tương đương GHCR nhưng cần thêm tài khoản và token riêng.
