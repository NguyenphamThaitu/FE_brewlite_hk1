# Quy ước làm việc nhóm – BrewLite Assignment 2

Tài liệu này quy định chiến lược nhánh, pull request, quy ước commit và Definition of Done
(Task 4.1). Mọi thành viên áp dụng cho cả mã nguồn lẫn tài liệu trong `docs/`.

## 1. Chiến lược nhánh (GitHub Flow)

- `main` là nhánh duy nhất tồn tại lâu dài, luôn ở trạng thái build được và deploy được.
- Không push trực tiếp lên `main`. Mọi thay đổi đi qua nhánh ngắn hạn và pull request.
- Nhánh làm việc tách từ `main` mới nhất, đặt tên theo mẫu `<type>/<mô-tả-ngắn>`
  (chữ thường, không dấu, nối bằng dấu gạch ngang):

| Type | Dùng cho | Ví dụ |
|------|----------|-------|
| `feat` | Chức năng mới | `feat/api-orders`, `feat/web-cart` |
| `fix` | Sửa lỗi | `fix/payment-idempotency` |
| `docs` | Tài liệu, sơ đồ, ADR | `docs/fr-order-payment`, `docs/class-diagram` |
| `test` | Chỉ thêm/sửa test | `test/e2e-checkout` |
| `ci` | Pipeline CI/CD | `ci/pr-pipeline` |
| `chore` | Cấu hình, dọn dẹp, phụ thuộc | `chore/docker-compose` |
| `refactor` | Đổi cấu trúc, không đổi hành vi | `refactor/order-state` |

- Mỗi nhánh chỉ giải quyết một hạng mục trong bảng phân công/backlog và nên sống dưới 2 ngày.
- Một nhánh gom nhiều hạng mục tài liệu nhỏ của cùng một người thì mỗi hạng mục phải là một
  commit riêng có `scope` ghi rõ task (`docs(task-2): ...`) để review và truy vết.
- Không sửa tệp thuộc phần việc của người khác trên nhánh của mình; góp ý qua review PR.
- Xóa nhánh sau khi merge.

### Thứ tự theo Task

Đề bài yêu cầu thực hiện tuần tự Task 1 → 5. Vì vậy tài liệu của task trước (SRS, sơ đồ, kiến
trúc) phải được merge vào `main` trước PR mã nguồn của task sau có liên quan, để lịch sử commit
thể hiện đúng thứ tự.

## 2. Quy trình pull request

1. Cập nhật `main` rồi tạo nhánh: `git switch main && git pull && git switch -c docs/class-diagram`.
2. Commit nhỏ, đúng quy ước ở mục 3.
3. Push nhánh và mở PR vào `main`, điền đầy đủ mẫu PR (`.github/pull_request_template.md`):
   tóm tắt, **lý do thay đổi**, Task và mã yêu cầu liên quan (FR/NFR/UC/ADR).
4. Gán reviewer theo bảng phân công. Tác giả không tự approve PR của mình.
5. PR chỉ được merge khi:
   - pipeline CI xanh: `Install → Lint → Unit Test → Build`;
   - có ít nhất 1 approve của reviewer được phân công;
   - mọi comment review đã được giải quyết;
   - không còn conflict với `main` (tác giả tự cập nhật nhánh bằng `git merge origin/main`
     hoặc `git rebase origin/main`).
6. Merge bằng **Create a merge commit** để giữ nguyên commit của từng thành viên (phục vụ
   chấm đóng góp cá nhân). Không dùng force-push lên nhánh đã mở PR sau khi đã có review.

### Thay đổi yêu cầu, sơ đồ, kiến trúc (Task 4.2)

- Mọi thay đổi trong `docs/requirements`, `docs/diagrams`, `docs/architecture` đều qua PR và
  phải ghi rõ lý do trong phần mô tả PR.
- Sơ đồ luôn commit cả tệp nguồn (`.puml`) và tệp kết xuất (`.svg`) trong cùng một commit.
- Thay đổi quyết định kiến trúc: thêm ADR mới thay thế ADR cũ (đánh dấu ADR cũ là
  `Superseded`), không sửa nội dung quyết định của ADR đã `Accepted`.
- Nếu thay đổi làm lệch mã yêu cầu, API hoặc test, cập nhật `docs/traceability-matrix.md` trong
  cùng PR.

### Bảo vệ nhánh `main`

Ruleset `main-protection` trên GitHub (đang `active`) áp dụng cho `main`:

- Bắt buộc mọi thay đổi đi qua pull request.
- Bắt buộc status check `api` của workflow CI (Install → Lint → Unit Test → Build) pass.
- Cấm force push và cấm xóa nhánh `main`.

Đề xuất bổ sung cho chủ repository: đặt số approve tối thiểu là 1, và thêm check `web` khi CI có
job cho frontend. Trong lúc ruleset còn để 0 approve, nhóm vẫn tự tuân thủ điều kiện "có ít nhất
1 approve" ở mục 2. Minh chứng CI xem [`docs/ci-evidence.md`](docs/ci-evidence.md).

## 3. Quy ước commit (Conventional Commits)

```
<type>(<scope>): <mô tả ngắn>

[phần thân: giải thích lý do thay đổi, không bắt buộc]

[Refs #<issue> | Closes #<issue>]
```

- `type`: `feat`, `fix`, `docs`, `test`, `ci`, `chore`, `refactor` (cùng nghĩa với bảng ở mục 1).
- `scope` (không bắt buộc): `web`, `api`, `db`, `ci`, hoặc `task-1` … `task-5` cho tài liệu.
- Mô tả viết bằng tiếng Anh, thì hiện tại, không viết hoa chữ đầu, không dấu chấm cuối,
  tối đa 72 ký tự.
- Một commit chỉ chứa một thay đổi có ý nghĩa; không gộp tài liệu và mã nguồn không liên quan.
- Không commit `.env`, khóa bí mật, `node_modules`, thư mục build.

Ví dụ:

```
feat(api): add POST /orders with stock check in a transaction
fix(web): keep cart items when payment fails
docs(task-2): add domain class diagram source and svg
ci: block merge when lint, test or build fails
chore(db): add prisma migration for loyalty transactions
```

## 4. Definition of Done

Một hạng mục chỉ được chuyển sang **Done** trên issue board khi thỏa toàn bộ các điều kiện sau.

### 4.1. Mã nguồn

- [ ] Đáp ứng tiêu chí chấp nhận của FR/NFR liên quan trong `docs/requirements/srs.md`.
- [ ] Build không lỗi; lint sạch; unit test cũ và mới đều pass; pipeline CI xanh.
- [ ] Logic mới có test: API có unit/integration test, giao diện có test component hoặc luồng.
- [ ] API validate dữ liệu đầu vào bằng DTO và trả mã lỗi HTTP phù hợp.
- [ ] Giao diện xử lý đủ trạng thái loading, empty và error.
- [ ] Không có secret trong mã nguồn hoặc log; biến môi trường mới đã thêm vào `.env.example`.
- [ ] Thay đổi schema có migration đi kèm; seed chạy lại được trên database trống.
- [ ] README/tài liệu liên quan và `docs/traceability-matrix.md` đã được cập nhật.
- [ ] PR được reviewer phân công approve và đã merge vào `main`.

### 4.2. Tài liệu và sơ đồ

- [ ] Đặt đúng thư mục theo cấu trúc repository (`docs/requirements`, `docs/diagrams`,
      `docs/architecture`).
- [ ] Có mã định danh để truy vết (FR-xx, NFR-xx, UC-xx, ADR-xxx).
- [ ] Sơ đồ có cả tệp nguồn và tệp kết xuất, mở được trên GitHub.
- [ ] Không mâu thuẫn với SRS, các sơ đồ khác và mô hình dữ liệu.
- [ ] PR ghi rõ lý do thay đổi, được reviewer phân công approve và đã merge vào `main`.
