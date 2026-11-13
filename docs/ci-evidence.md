# Minh chứng Continuous Integration (Task 4.4)

> Người tổng hợp: Quách Văn Trường · Reviewer: Nguyễn Phạm Thái Tú
> Pipeline do Thái Tú dựng: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) (job `api` ở PR #4, job `web` ở PR #21)

## 1. Pipeline

Workflow `CI` chạy tự động khi **mở hoặc cập nhật pull request vào `main`** và khi push vào `main`.
Hai job chạy song song trên Ubuntu, Node.js 22, mỗi job gồm đúng 4 bước theo đề:

| Bước | Job `api` (thư mục `apps/api`) | Job `web` (thư mục `apps/web`) |
|------|--------------------------------|--------------------------------|
| Install | `npm ci` | `npm ci` |
| Lint | `npm run lint` (ESLint) | `npm run lint` (ESLint, quy tắc Next.js và React Hooks) |
| Unit Test | `npm test` (Jest, project `unit`) | `npm test` (Vitest) |
| Build | `npm run build` (`prisma generate && nest build`) | `npm run build` (`next build`) |

Bước sau chỉ chạy khi bước trước thành công.

## 2. Chặn merge khi CI thất bại

Ruleset `main-protection` (trạng thái `active`, áp dụng cho nhánh mặc định `main`):

| Luật | Cấu hình |
|------|----------|
| `pull_request` | Mọi thay đổi vào `main` phải qua pull request |
| `required_status_checks` | Check `api` bắt buộc phải pass |
| `non_fast_forward` | Cấm force push |
| `deletion` | Cấm xóa nhánh `main` |

Vì vậy PR có lint, test hoặc build lỗi ở backend thì nút merge bị khóa (trạng thái `BLOCKED`).

> **Cần làm:** ruleset mới bắt buộc check `api`. Chủ repository cần thêm check `web` vào
> `required_status_checks` để PR làm hỏng frontend cũng bị chặn merge như backend.

## 3. Lần pipeline thành công

- Pull request: [#4 – ci: thêm pipeline kiểm tra tự động cho API](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/pull/4)
- Lần chạy: [Actions run 42774074769](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/42774074769/job/129688366510) – 2026-11-10

| Bước | Kết quả |
|------|---------|
| Install | ✅ success |
| Lint | ✅ success |
| Unit Test | ✅ success |
| Build | ✅ success |

Trích log bước Unit Test:

```
Test Suites: 3 passed, 3 total
Tests:       14 passed, 14 total
```

Các PR sau cũng pass và đã merge: [#7](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/pull/7)
([run 42782229351](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/42782229351/job/129714762450)).

### Job `web` thành công

- Pull request: [#21 – ci: thêm kiểm tra tự động cho apps/web](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/pull/21)
- Lần chạy: [Actions run 43346593326, job `web`](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/43346593326/job/131627326774) – 2026-11-13.
  Cùng lần chạy, job `api` cũng pass. Sau khi merge, lần chạy trên `main`
  ([run 43346878339](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/43346878339)) pass cả hai job.

| Bước | Kết quả |
|------|---------|
| Install | ✅ success |
| Lint | ✅ success (0 lỗi, 3 cảnh báo `@next/next/no-img-element`) |
| Unit Test | ✅ success |
| Build | ✅ success |

Trích log job `web`:

```
✖ 3 problems (0 errors, 3 warnings)
 Test Files  1 passed (1)
      Tests  3 passed (3)
✓ Compiled successfully in 3.7s
✓ Generating static pages using 3 workers (4/4) in 268ms
```

## 4. Lần pipeline phát hiện lỗi

- Pull request: [#5 – test: cố ý làm hỏng kiểm thử để minh chứng CI bắt lỗi](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/pull/5)
- Lần chạy: [Actions run 42776553514](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/42776553514/job/129696278484) – 2026-11-10

Thay đổi cố ý làm sai một kỳ vọng trong `apps/api/src/common/pricing.spec.ts`:

```diff
-  it('đơn giá = giá gốc + size + topping', () => expect(unitPrice(line)).toBe(58000));
+  it('đơn giá = giá gốc + size + topping', () => expect(unitPrice(line)).toBe(1));
```

| Bước | Kết quả |
|------|---------|
| Install | ✅ success |
| Lint | ✅ success |
| Unit Test | ❌ failure |
| Build | ⏭ skipped (không chạy vì bước trước lỗi) |

Trích log bước Unit Test:

```
FAIL unit src/common/pricing.spec.ts
    Expected: 1
    Received: 58000
Test Suites: 1 failed, 2 passed, 3 total
Tests:       1 failed, 13 passed, 14 total
##[error]Process completed with exit code 1.
```

Kết quả: PR #5 ở trạng thái merge `BLOCKED`, không merge được, và đã được đóng không merge đúng mục
đích minh chứng.

## 5. Lỗi thật được CI phát hiện

Ngoài lần cố ý, CI cũng chặn một lỗi thật ở
[PR #6 – Feat/fe init menu](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/pull/6):

- [Run 42777837175](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/42777837175): bước **Install** thất bại.

  ```
  npm error code EUSAGE
  npm error The `npm ci` command can only install with an existing package-lock.json or
  npm error npm-shrinkwrap.json with lockfileVersion >= 1.
  ```

- Lần chạy tiếp theo của PR này, [run 42778502397](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/42778502397) pass.

Job `web` cũng bắt được lỗi thật ở
[PR #12 – ci: thêm kiểm tra tự động cho apps/web](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/pull/12)
(bản đầu của job `web`):

- [Run 42819386625, job `web`](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/actions/runs/42819386625/job/129840683841) – 2026-11-10:
  bước **Lint** thất bại, Unit Test và Build không chạy.

  ```
  error  Error: Calling setState synchronously within an effect can trigger cascading renders
  error  React Hook "useState" is called conditionally. React Hooks must be called in the exact
         same order in every component render  react-hooks/rules-of-hooks
  ✖ 10 problems (7 errors, 3 warnings)
  ```

- Lỗi được sửa ở [PR #13](https://github.com/NguyenphamThaitu/FE_brewlite_hk1/pull/13); job `web` được đưa
  vào `main` qua PR #21 (thay cho PR #12) và pass như ở mục 3.

## 6. Ảnh chụp

Đề bài chấp nhận "ảnh hoặc log". Log ở trên trích trực tiếp từ GitHub Actions và mở lại được qua
các liên kết. Nếu cần ảnh, chụp trang của hai run ở mục 3 và 4, lưu vào `docs/images/ci-pass.png`
và `docs/images/ci-fail.png`.

## 7. Hạn chế hiện tại

- Ruleset mới bắt buộc check `api`; check `web` chưa bắt buộc (xem mục 2).
- Integration test (`npm run test:int`, cần PostgreSQL) chưa chạy trong CI.
- Ruleset đặt số approve tối thiểu là 0. Quy ước nhóm vẫn yêu cầu 1 reviewer theo bảng phân công
  (xem [`CONTRIBUTING.md`](../CONTRIBUTING.md)).
