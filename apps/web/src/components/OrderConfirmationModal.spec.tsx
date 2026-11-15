import { render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrderConfirmationModal from "./OrderConfirmationModal";
import { getStoredCart, saveCart } from "@/utils/cart";
import { saveSession } from "@/utils/auth";
import { CartItem } from "@/types/product";

const user = { id: 1, email: "a@b.com", fullName: "Nguyễn Văn A", role: "CUSTOMER" as const };

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
  render(<OrderConfirmationModal isOpen={true} onClose={vi.fn()} items={items} totalAmount={70000} />);

describe("OrderConfirmationModal: đặt hàng bắt buộc đăng nhập (FR-18)", () => {
  beforeEach(() => {
    localStorage.clear();
    saveCart(items);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chưa đăng nhập: không cho gửi đơn, chỉ hiện yêu cầu đăng nhập", () => {
    renderModal();

    expect(screen.getByTestId("order-login-required")).toBeInTheDocument();
    expect(screen.queryByTestId("confirm-order-submit")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đăng nhập" })).toHaveAttribute(
      "href",
      "/login?next=%2F%23cart&reason=checkout",
    );
    expect(getStoredCart()).toHaveLength(1); // giỏ hàng không bị đụng tới
  });

  it("đã đăng nhập: điền sẵn tên tài khoản và gửi đơn thành công", async () => {
    saveSession({ accessToken: "opaque-token", user });
    renderModal();

    expect(screen.getByTestId("order-customer-name")).toHaveValue("Nguyễn Văn A");

    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    expect(await screen.findByTestId("order-success-card")).toBeInTheDocument();
    expect(screen.getByTestId("order-code")).toHaveTextContent(/#BL-\d{4}/);
    expect(getStoredCart()).toHaveLength(0);
  });

  it("phiên hết hạn đúng lúc bấm gửi: không tạo đơn, chuyển sang yêu cầu đăng nhập", () => {
    const now = Date.now();
    const token = `h.${btoa(JSON.stringify({ exp: Math.floor(now / 1000) + 60 }))}.s`;
    saveSession({ accessToken: token, user });
    renderModal();

    // Tua đồng hồ sang 2 phút sau: token vừa hết hạn
    vi.spyOn(Date, "now").mockReturnValue(now + 120_000);
    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    expect(screen.getByTestId("order-login-required")).toBeInTheDocument();
    expect(screen.queryByTestId("order-success-card")).not.toBeInTheDocument();
    expect(getStoredCart()).toHaveLength(1);
  });
});
