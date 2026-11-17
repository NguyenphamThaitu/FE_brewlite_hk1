
import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderConfirmationModal from "./OrderConfirmationModal";
import { getStoredCart, saveCart } from "@/utils/cart";
import { PENDING_PAYMENT_KEY, saveSession } from "@/utils/auth";
import { CartItem } from "@/types/product";
import {
  createOrder,
  createMockPayment,
  getMyWalletBalance,
} from "@/utils/orders-api";

vi.mock("@/utils/orders-api", () => ({
  createOrder: vi.fn(),
  createMockPayment: vi.fn(),
  getMyWalletBalance: vi.fn(),
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

    vi.mocked(getMyWalletBalance).mockResolvedValue({ walletBalance: 200000 });

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

  it("Bug 2: modal đóng (isOpen=false) khi chưa đăng nhập thì không hiện popup đăng nhập", () => {
    render(
      <OrderConfirmationModal
        isOpen={false}
        onClose={vi.fn()}
        items={items}
        totalAmount={70000}
      />,
    );

    expect(screen.queryByTestId("order-login-required")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Bug 1: sau khi thanh toán xong, đóng rồi mở lại thì nút Xác nhận & Thanh toán hiện lại", async () => {
    saveSession({ accessToken: "opaque-token", user });
    const onClose = vi.fn();
    const props = { onClose, items, totalAmount: 70000 };
    const { rerender } = render(
      <OrderConfirmationModal isOpen={true} {...props} />,
    );

    fireEvent.click(screen.getByTestId("confirm-order-submit"));
    fireEvent.click(await screen.findByTestId("order-finish-button"));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<OrderConfirmationModal isOpen={false} {...props} />);
    saveCart(items);
    rerender(<OrderConfirmationModal isOpen={true} {...props} />);

    expect(screen.queryByTestId("order-success-title")).not.toBeInTheDocument();
    expect(screen.getByTestId("confirm-order-submit")).toBeInTheDocument();
  });

  it("Bug 3: bỏ qua đơn chờ thanh toán của tài khoản khác (userId không khớp)", async () => {
    saveSession({ accessToken: "opaque-token", user });
    sessionStorage.setItem(
      PENDING_PAYMENT_KEY,
      JSON.stringify({
        userId: 999,
        orderId: 777,
        idempotencyKey: "old-key",
        itemsSignature: JSON.stringify([
          { productId: 1, sizeId: 1, toppingIds: [], quantity: 2 },
        ]),
      }),
    );
    renderModal();

    fireEvent.click(screen.getByTestId("confirm-order-submit"));
    await screen.findByTestId("order-success-title");

    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createMockPayment).mock.calls[0][0]).toBe(123);
  });

  it("hiện số dư ví thực tế và cảnh báo khi không đủ tiền", async () => {
    vi.mocked(getMyWalletBalance).mockResolvedValue({ walletBalance: 50000 });
    saveSession({ accessToken: "opaque-token", user });
    renderModal();

    expect(await screen.findByTestId("wallet-balance")).toHaveTextContent(
      /50\.000/,
    );
    expect(screen.getByTestId("wallet-insufficient")).toBeInTheDocument();
  });
});
