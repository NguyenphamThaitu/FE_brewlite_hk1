import { test, expect } from "@playwright/test";

/**
 * Playwright Real-Browser E2E Test (chạy với hệ thống thật từ `docker compose up` hoặc API/Web local).
 * Bao phủ trọn luồng tối thiểu: Menu → Chọn size/topping → Giỏ hàng → Đăng ký (giữ giỏ) → Đặt đơn & Ví 1.000.000₫ → Theo dõi đơn.
 */
test.describe("Real Browser E2E: Luồng đặt món & thanh toán thật (Next.js + NestJS + PostgreSQL)", () => {
  test("Khách vãng lai chọn món, đăng ký bảo toàn giỏ hàng, thanh toán Ví và theo dõi đơn thật", async ({
    page,
  }) => {
    const uniqueEmail = `e2e.tri.${Date.now()}@brewlite.test`;

    // 1. Mở trang chủ thực đơn thật từ Backend API
    await page.goto("/");
    await expect(page.getByText(/Không thể tải thực đơn/i)).not.toBeVisible();

    const firstDrink = page.getByRole("heading", { name: /Cà phê sữa đá/i }).first();
    await expect(firstDrink).toBeVisible();

    // 2. Mở modal chi tiết đồ uống (gọi GET /products/:id thật)
    await firstDrink.click();
    const detailModal = page.getByRole("dialog", { name: /Tùy biến đồ uống/i });
    await expect(detailModal).toBeVisible();
    await expect(detailModal.getByText("Chọn 1")).toBeVisible();

    // 3. Tùy biến Size M (+6.000 ₫), Topping Thạch dừa (+6.000 ₫) và ghi chú
    await detailModal.getByRole("button", { name: /M/i }).first().click();
    await detailModal.locator("label", { hasText: /Thạch dừa/i }).click();
    await detailModal.getByPlaceholder(/Ít đá/i).fill("Ít đá, ít ngọt");

    // 29.000 + 6.000 + 6.000 = 41.000 ₫
    await expect(detailModal.getByTestId("modal-total-price")).toContainText("41.000");

    // 4. Thêm vào giỏ hàng
    await detailModal.getByRole("button", { name: /Thêm vào giỏ hàng/i }).click();
    await expect(detailModal).not.toBeVisible();

    // 5. Mở giỏ hàng -> Chưa đăng nhập -> Bấm "Đăng nhập để đặt hàng"
    await page.getByRole("button", { name: /Xem giỏ hàng/i }).click();
    await expect(
      page.getByRole("heading", { name: "Giỏ hàng của bạn" }),
    ).toBeVisible();
    await page.getByTestId("cart-login-button").click();

    await expect(page).toHaveURL(/\/login/);

    // 6. Chuyển sang Đăng ký tài khoản mới (bảo toàn ?next=/#cart)
    await page.getByRole("link", { name: /^Đăng ký$/i }).first().click();
    await expect(page).toHaveURL(/\/register/);

    await page.locator("#register-fullName").fill("Trần Minh Trí E2E");
    await page.locator("#register-email").fill(uniqueEmail);
    await page.locator("#register-password").fill("Test@12345");
    await page.locator("#register-confirm").fill("Test@12345");
    await page.getByRole("button", { name: /Tạo tài khoản/i }).click();

    // 7. Đăng ký xong tự động quay lại trang chủ mở sẵn giỏ hàng, món vẫn nguyên vẹn (FR-13, FR-18)
    await expect(page).toHaveURL(/\/(#cart)?$/);
    await expect(
      page.getByRole("heading", { name: "Giỏ hàng của bạn" }),
    ).toBeVisible();
    await expect(page.getByTestId("cart-checkout-button")).toBeVisible();

    // 8. Mở modal xác nhận đặt đơn & thanh toán bằng Ví BrewLite mặc định 1.000.000₫
    await page.getByTestId("cart-checkout-button").click();
    const confirmModal = page.getByRole("dialog", {
      name: /Xác nhận đơn hàng/i,
    });
    await expect(confirmModal).toBeVisible();
    await expect(confirmModal.getByTestId("confirmation-total-amount")).toContainText(
      "41.000",
    );

    await confirmModal.getByTestId("confirm-order-submit").click();

    // 9. Xác nhận kết quả đặt hàng thành công & ví trừ đúng còn 959.000 ₫ (PR #77)
    await expect(confirmModal.getByTestId("order-success-title")).toHaveText(
      "Đặt hàng thành công!",
    );
    const orderCodeText = await confirmModal.getByTestId("order-code").innerText();
    const match = orderCodeText.match(/#BL-(\d+)/);
    expect(match).not.toBeNull();
    const createdOrderId = match![1];

    await expect(confirmModal.getByTestId("order-status-badge")).toContainText(
      "Đã tiếp nhận",
    );
    await expect(confirmModal.getByTestId("wallet-paid")).toContainText("959.000");

    // 10. Chuyển sang trang Theo dõi đơn hàng (/orders/[id] - PR #80)
    await confirmModal.getByTestId("track-order-link").click();
    await expect(page).toHaveURL(new RegExp(`/orders/${createdOrderId}$`));
    await expect(
      page.getByRole("heading", { name: `Theo dõi đơn hàng #${createdOrderId}` }),
    ).toBeVisible();
    await expect(page.getByTestId("tracking-status")).toHaveText("Đã thanh toán");

    // 11. Sang trang Lịch sử đơn hàng (/orders) kiểm tra đơn đã lưu trong DB & giỏ hàng đã rỗng
    await page.goto("/orders");
    await expect(page.getByText(`Đơn hàng #${createdOrderId}`)).toBeVisible();
    await expect(page.getByRole("button", { name: /Xem giỏ hàng/i })).toContainText(
      "0",
    );
  });
});
