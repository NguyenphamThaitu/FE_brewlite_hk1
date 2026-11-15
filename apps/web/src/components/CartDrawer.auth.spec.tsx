import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartDrawer from "./CartDrawer";
import { saveCart } from "@/utils/cart";
import { saveSession } from "@/utils/auth";
import { CartItem } from "@/types/product";

const user = { id: 1, email: "a@b.com", fullName: "Nguyễn Văn A", role: "CUSTOMER" as const };

const cartItems: CartItem[] = [
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

describe("CartDrawer: đặt hàng bắt buộc đăng nhập (FR-18)", () => {
  beforeEach(() => {
    localStorage.clear();
    saveCart(cartItems);
  });

  it("khách chưa đăng nhập: thấy lời nhắc và nút Đăng nhập thay cho nút đặt hàng", () => {
    const onCheckout = vi.fn();
    render(<CartDrawer isOpen={true} onClose={vi.fn()} onCheckout={onCheckout} />);

    expect(screen.getByTestId("cart-login-required")).toBeInTheDocument();
    expect(screen.queryByTestId("cart-checkout-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("cart-login-button")).toHaveAttribute(
      "href",
      "/login?next=%2F%23cart&reason=checkout",
    );
    expect(screen.getByTestId("cart-register-link")).toHaveAttribute(
      "href",
      "/register?next=%2F%23cart&reason=checkout",
    );
    expect(onCheckout).not.toHaveBeenCalled();
  });

  it("đã đăng nhập: có nút Đặt hàng & Thanh toán và gọi onCheckout", () => {
    saveSession({ accessToken: "opaque-token", user });
    const onCheckout = vi.fn();
    render(<CartDrawer isOpen={true} onClose={vi.fn()} onCheckout={onCheckout} />);

    expect(screen.queryByTestId("cart-login-required")).not.toBeInTheDocument();
    expect(screen.queryByTestId("cart-login-button")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("cart-checkout-button"));
    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it("token đã hết hạn: vẫn bị yêu cầu đăng nhập lại", () => {
    const expired = `h.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 60 }))}.s`;
    saveSession({ accessToken: expired, user });
    render(<CartDrawer isOpen={true} onClose={vi.fn()} onCheckout={vi.fn()} />);

    expect(screen.getByTestId("cart-login-button")).toBeInTheDocument();
    expect(screen.queryByTestId("cart-checkout-button")).not.toBeInTheDocument();
  });
});
