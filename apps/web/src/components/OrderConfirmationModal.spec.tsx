
import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderConfirmationModal from "./OrderConfirmationModal";
import { getStoredCart, saveCart } from "@/utils/cart";
import { getStoredUser, saveSession } from "@/utils/auth";
import { CartItem } from "@/types/product";
import { createOrder, createMockPayment } from "@/utils/orders-api";

vi.mock("@/utils/orders-api", () => ({
  createOrder: vi.fn(),
  createMockPayment: vi.fn(),
}));

// Không gọi GET /auth/me thật trong test: số dư lấy từ phiên lưu sẵn.
vi.mock("@/utils/auth-api", () => ({
  refreshCurrentUser: vi.fn().mockResolvedValue(undefined),
}));

const user = {
  id: 1,
  email: "a@b.com",
  fullName: "Nguyễn Văn A",
  role: "CUSTOMER" as const,
};

const items: CartItem[] = [
  {
    id: "cart-1",
    productId: 1,
    name: "Cà phê sữa đá",
    imageUrl: "https://example.com/cafe.jpg",
    sizeId: 1,
    size: "M",
    sizePrice: 6000,
    toppings: [],
    unitPrice: 35000,
    qty: 2,
    totalPrice: 70000,
  },
];

const renderModal = () =>
  render(
    <OrderConfirmationModal
      isOpen={true}
      onClose={vi.fn()}
      items={items}
      totalAmount={70000}
    />,
  );

describe("OrderConfirmationModal: đặt hàng bắt buộc đăng nhập (FR-18)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    saveCart(items);

    vi.mocked(createOrder).mockResolvedValue({
      id: 123,
      totalAmount: 70000,
      status: "PENDING",
    });

    vi.mocked(createMockPayment).mockResolvedValue({
      paymentId: 456,
      orderId: 123,
      method: "WALLET",
      amount: 70000,
      paymentStatus: "SUCCESS",
      orderStatus: "PAID",
      errorCode: null,
      message: "Thanh toán thành công",
      walletBalance: 130000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chưa đăng nhập: không cho gửi đơn, chỉ hiện yêu cầu đăng nhập", () => {
    renderModal();

    expect(screen.getByTestId("order-login-required")).toBeInTheDocument();
    expect(
      screen.queryByTestId("confirm-order-submit"),
    ).not.toBeInTheDocument();

    const loginLink = screen
      .getAllByRole("link")
      .find((link) => link.getAttribute("href") === "/login?next=%2F%23cart&reason=checkout");

    expect(loginLink).toBeTruthy();
    expect(getStoredCart()).toHaveLength(1);
  });

  it("đã đăng nhập: điền sẵn tên tài khoản và gửi đơn thành công", async () => {
    saveSession({ accessToken: "opaque-token", user });
    renderModal();

    expect(screen.getByTestId("order-customer-name")).toHaveValue(
      "Nguyễn Văn A",
    );

    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    expect(
  await screen.findByTestId("order-success-title"),
).toBeInTheDocument();

expect(screen.getByTestId("order-code")).toHaveTextContent(/#BL-\d+/);
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(createMockPayment).toHaveBeenCalledTimes(1);
    expect(getStoredCart()).toHaveLength(0);
  });

  it("phiên hết hạn đúng lúc bấm gửi: không tạo đơn, chuyển sang yêu cầu đăng nhập", () => {
    const now = Date.now();
    const token = `h.${btoa(
      JSON.stringify({ exp: Math.floor(now / 1000) + 60 }),
    )}.s`;

    saveSession({ accessToken: token, user });
    renderModal();

    vi.spyOn(Date, "now").mockReturnValue(now + 120_000);
    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    expect(screen.getByTestId("order-login-required")).toBeInTheDocument();
    expect(
      screen.queryByTestId("order-success-card"),
    ).not.toBeInTheDocument();
    expect(createOrder).not.toHaveBeenCalled();
    expect(getStoredCart()).toHaveLength(1);
  });
});

describe("OrderConfirmationModal: ví mô phỏng (FR-24)", () => {
  const walletPayment = {
    paymentId: 1,
    orderId: 123,
    method: "WALLET" as const,
    amount: 70000,
    cardLast4: undefined,
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    saveCart(items);
    vi.mocked(createOrder).mockReset();
    vi.mocked(createMockPayment).mockReset();
    vi.mocked(createOrder).mockResolvedValue({
      id: 123,
      totalAmount: 70000,
      status: "PENDING_PAYMENT",
    });
  });

  it("hiện số dư ví, số dư sau thanh toán và trừ tiền khi thanh toán thành công", async () => {
    saveSession({ accessToken: "opaque-token", user: { ...user, walletBalance: 1000000 } });
    vi.mocked(createMockPayment).mockResolvedValue({
      ...walletPayment,
      paymentStatus: "SUCCESS",
      orderStatus: "PAID",
      errorCode: null,
      message: "Thanh toán thành công",
      walletBalance: 930000,
    });
    renderModal();

    expect(screen.getByTestId("wallet-balance")).toHaveTextContent(/1\.000\.000/);
    expect(screen.getByTestId("wallet-balance-after")).toHaveTextContent(/930\.000/);

    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    expect(await screen.findByTestId("wallet-paid")).toHaveTextContent(/70\.000.*930\.000/);
    expect(screen.getByTestId("wallet-balance")).toHaveTextContent(/930\.000/);
    expect(getStoredUser()?.walletBalance).toBe(930000);
  });

  it("số dư không đủ: báo thiếu tiền, khóa nút thanh toán, không tạo đơn", () => {
    saveSession({ accessToken: "opaque-token", user: { ...user, walletBalance: 50000 } });
    renderModal();

    expect(screen.getByTestId("wallet-insufficient")).toHaveTextContent(/thiếu\s+20\.000/);
    expect(screen.getByTestId("confirm-order-submit")).toBeDisabled();

    fireEvent.click(screen.getByTestId("confirm-order-submit"));
    expect(createOrder).not.toHaveBeenCalled();
    expect(createMockPayment).not.toHaveBeenCalled();
  });

  it("API báo ví không đủ: hiện lỗi, cập nhật số dư và khóa thanh toán bằng ví", async () => {
    saveSession({ accessToken: "opaque-token", user: { ...user, walletBalance: 100000 } });
    vi.mocked(createMockPayment).mockResolvedValue({
      ...walletPayment,
      paymentStatus: "FAILED",
      orderStatus: "PAYMENT_FAILED",
      errorCode: "WALLET_INSUFFICIENT_BALANCE",
      message: "Số dư ví không đủ",
      walletBalance: 20000,
    });
    renderModal();

    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Số dư ví không đủ.*20\.000/);
    expect(screen.getByTestId("wallet-balance")).toHaveTextContent(/20\.000/);
    expect(screen.getByTestId("confirm-order-submit")).toBeDisabled();
    expect(screen.queryByTestId("order-success-title")).not.toBeInTheDocument();
    expect(getStoredCart()).toHaveLength(1); // đơn chưa thanh toán thì giỏ hàng vẫn giữ
  });

  it("chọn Thẻ ngân hàng thì không bị chặn bởi số dư ví", () => {
    saveSession({ accessToken: "opaque-token", user: { ...user, walletBalance: 0 } });
    renderModal();

    expect(screen.getByTestId("confirm-order-submit")).toBeDisabled();
    fireEvent.click(screen.getByText("Thẻ ngân hàng"));

    expect(screen.queryByTestId("wallet-insufficient")).not.toBeInTheDocument();
    expect(screen.getByTestId("confirm-order-submit")).not.toBeDisabled();
  });
});
