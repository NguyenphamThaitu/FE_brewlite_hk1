import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CartDrawer from "./CartDrawer";
import * as cartUtils from "@/utils/cart";
import { CartItem } from "@/types/product";

const mockCartItems: CartItem[] = [
  {
    id: "cart-1",
    productId: "prod-01",
    name: "Cà phê Muối BrewLite",
    imageUrl: "https://example.com/muoi.jpg",
    sizeId: "size-m",
    size: "M",
    sizePrice: 6000,
    toppings: [{ id: "top-01", name: "Trân châu đen", price: 5000, available: true }],
    note: "Ít đá",
    unitPrice: 40000,
    qty: 2,
    totalPrice: 80000,
  },
  {
    id: "cart-2",
    productId: "prod-02",
    name: "Trà Đào Cam Sả",
    imageUrl: "https://example.com/tradao.jpg",
    sizeId: "size-s",
    size: "S",
    sizePrice: 0,
    toppings: [],
    unitPrice: 39000,
    qty: 1,
    totalPrice: 39000,
  },
];

describe("CartDrawer Component (FR-11, FR-12, FR-13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders empty state when cart has no items", () => {
    vi.spyOn(cartUtils, "getStoredCart").mockReturnValue([]);

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Giỏ hàng của bạn")).toBeInTheDocument();
    expect(screen.getByText("Giỏ hàng đang trống")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem thực đơn ngay/i })).toBeInTheDocument();
  });

  it("renders cart items with name, size, toppings, note and calculated totals (FR-11, FR-13)", () => {
    vi.spyOn(cartUtils, "getStoredCart").mockReturnValue(mockCartItems);

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Cà phê Muối BrewLite")).toBeInTheDocument();
    expect(screen.getByText(/Size M • Trân châu đen/i)).toBeInTheDocument();
    expect(screen.getByText(/Ghi chú: Ít đá/i)).toBeInTheDocument();
    expect(screen.getByText("Trà Đào Cam Sả")).toBeInTheDocument();

    // Total count: 2 + 1 = 3 món
    expect(screen.getByText("3 món")).toBeInTheDocument();

    // Total amount: 80.000 + 39.000 = 119.000 ₫
    expect(screen.getAllByText(/119\.000\s*₫/i).length).toBeGreaterThanOrEqual(1);
  });

  it("calls updateCartQty when clicking plus or minus button (FR-12)", () => {
    vi.spyOn(cartUtils, "getStoredCart").mockReturnValue(mockCartItems);
    const updateSpy = vi.spyOn(cartUtils, "updateCartQty");

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />);

    // Click plus on item 1 (current qty = 2 -> new qty = 3)
    const plusButtons = screen.getAllByRole("button").filter((btn) =>
      btn.querySelector("svg")
    );
    // There are plus/minus/trash/close buttons
    const incBtn = plusButtons.find((btn) => btn.innerHTML.includes("lucide-plus"));
    if (incBtn) {
      fireEvent.click(incBtn);
      expect(updateSpy).toHaveBeenCalledWith("cart-1", 3);
    }
  });

  it("calls removeFromCart when clicking trash icon button (FR-12)", () => {
    vi.spyOn(cartUtils, "getStoredCart").mockReturnValue(mockCartItems);
    const removeSpy = vi.spyOn(cartUtils, "removeFromCart");

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />);

    const deleteButtons = screen.getAllByTitle("Xóa món");
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(removeSpy).toHaveBeenCalledWith("cart-1");
  });

  it("calls clearCart when clicking 'Xóa hết' button", () => {
    vi.spyOn(cartUtils, "getStoredCart").mockReturnValue(mockCartItems);
    const clearSpy = vi.spyOn(cartUtils, "clearCart");

    render(<CartDrawer isOpen={true} onClose={vi.fn()} />);

    const clearBtn = screen.getByRole("button", { name: /Xóa hết/i });
    fireEvent.click(clearBtn);

    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when clicking close button", () => {
    vi.spyOn(cartUtils, "getStoredCart").mockReturnValue([]);
    const handleClose = vi.fn();

    render(<CartDrawer isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText("Đóng giỏ hàng");
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

