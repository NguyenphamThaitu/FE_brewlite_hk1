
import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MenuPage from "@/app/page";
import * as productsService from "@/services/products";
import * as ordersApi from "@/utils/orders-api";
import { clearCart, getStoredCart } from "@/utils/cart";
import { saveSession } from "@/utils/auth";
import { Product } from "@/types/product";

const mockSeedProducts: Product[] = [
  {
    id: 1,
    name: "Cà phê sữa đá",
    categoryId: "ca-phe",
    categoryName: "Cà phê Phin & Máy",
    description: "Cà phê phin đậm vị, sữa đặc",
    basePrice: 29000,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
  },
  {
    id: 3,
    name: "Trà đào cam sả",
    categoryId: "tra",
    categoryName: "Trà & Matcha",
    description: "Trà đen, đào ngâm, thanh mát",
    basePrice: 39000,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc",
  },
  {
    id: 5,
    name: "Matcha latte",
    categoryId: "tra",
    categoryName: "Trà & Matcha",
    description: "Matcha Nhật pha sữa tươi",
    basePrice: 45000,
    available: true,
    imageUrl:
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a",
  },
];

vi.mock("@/services/products", async () => {
  const actual = await vi.importActual<
    typeof import("@/services/products")
  >("@/services/products");

  return {
    ...actual,
    fetchProducts: vi.fn(),
    fetchProductDetail: vi.fn(),
  };
});

vi.mock("@/utils/orders-api", () => ({
  createOrder: vi.fn(),
  createMockPayment: vi.fn(),
  getMyOrders: vi.fn(),
  getOrderDetail: vi.fn(),
}));

describe("E2E Test: Luồng đặt món và thanh toán mô phỏng BrewLite", () => {
  beforeEach(() => {
vi.clearAllMocks();
clearCart();
localStorage.clear();
sessionStorage.clear();

// Giả lập khách hàng đã đăng nhập để kiểm thử luồng đặt hàng.
saveSession({
  accessToken: "e2e-test-token",
  user: {
    id: 1,
    email: "customer@brewlite.test",
    fullName: "Nguyễn Văn A",
    role: "CUSTOMER",
  },
});

vi.mocked(productsService.fetchProducts).mockResolvedValue(
  mockSeedProducts
);

    vi.mocked(productsService.fetchProductDetail).mockImplementation(
      async (id: string | number) => {
        const product =
          mockSeedProducts.find((item) => item.id === Number(id)) ??
          mockSeedProducts[0];

        return {
          ...product,
          sizes: [
            {
              id: 1,
              size: "S",
              name: "Nhỏ (S)",
              extraPrice: 0,
              available: true,
            },
            {
              id: 2,
              size: "M",
              name: "Vừa (M)",
              extraPrice: 6000,
              available: true,
            },
            {
              id: 3,
              size: "L",
              name: "Lớn (L)",
              extraPrice: 10000,
              available: true,
            },
          ],
          toppings: [
            {
              id: 1,
              name: "Trân châu đen",
              price: 7000,
              available: true,
            },
            {
              id: 2,
              name: "Thạch dừa",
              price: 6000,
              available: true,
            },
            {
              id: 3,
              name: "Kem cheese",
              price: 10000,
              available: true,
            },
          ],
        };
      }
    );

    vi.mocked(ordersApi.createOrder).mockResolvedValue({
      id: 101,
      totalAmount: 42000,
      status: "PENDING_PAYMENT",
    });

    vi.mocked(ordersApi.createMockPayment).mockResolvedValue({
      paymentId: 201,
      orderId: 101,
      method: "WALLET",
      amount: 42000,
      paymentStatus: "SUCCESS",
      orderStatus: "RECEIVED",
      errorCode: null,
      message: "Thanh toán thành công",
    });
  });

  it("Chọn món, tùy chỉnh size/topping và thanh toán thành công bằng Ví BrewLite", async () => {
    render(<MenuPage />);

    const coffeeImage = await screen.findByRole("img", {
      name: /cà phê sữa đá/i,
    });
    fireEvent.click(coffeeImage);

    const modal = await screen.findByRole("dialog");

    fireEvent.click(
      within(modal).getByRole("button", {
        name: /Vừa \(M\)/i,
      })
    );

    fireEvent.click(within(modal).getByText("Trân châu đen"));

    const noteInput = within(modal).getByRole("textbox");
    fireEvent.change(noteInput, {
      target: { value: "Ít đá 50%, ít đường" },
    });

    expect(
      within(modal).getByTestId("modal-total-price")
    ).toHaveTextContent(/42\.000/);

    const addToCartButton = within(modal)
      .getByTestId("modal-total-price")
      .closest("button");

    expect(addToCartButton).not.toBeNull();
    fireEvent.click(addToCartButton!);

    await waitFor(() => {
      const stored = getStoredCart();

      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Cà phê sữa đá");
      expect(stored[0].size).toBe("M");
      expect(stored[0].totalPrice).toBe(42000);
      expect(stored[0].note).toBe("Ít đá 50%, ít đường");
    });

    // Mở giỏ hàng bằng nút giỏ hàng trên giao diện.
    const cartButton = screen.getByRole("button", {
      name: /giỏ hàng/i,
    });
    fireEvent.click(cartButton);

    const checkoutButton = await screen.findByRole("button", {
      name: /thanh toán|đặt hàng|tiếp tục/i,
    });
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-total-amount")
      ).toHaveTextContent(/42\.000/);
    });

    fireEvent.change(screen.getByTestId("order-customer-name"), {
      target: { value: "Trần Minh Trí" },
    });

    fireEvent.change(screen.getByTestId("order-pickup-note"), {
      target: { value: "Bàn số 05 - Tầng 1" },
    });

    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    await waitFor(() => {
      expect(ordersApi.createOrder).toHaveBeenCalledTimes(1);
      expect(ordersApi.createMockPayment).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("order-success-title")).toBeInTheDocument();
    });

    expect(ordersApi.createOrder).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({
          productId: 1,
          sizeId: 2,
          toppingIds: [1],
          quantity: 1,
        }),
      ],
    });

    expect(ordersApi.createMockPayment).toHaveBeenCalledWith(
      101,
      "WALLET",
      expect.any(String),
      undefined
    );

    expect(screen.getByTestId("order-code")).toHaveTextContent(/#BL-/);
    expect(screen.getByTestId("order-status-badge")).toBeInTheDocument();
    expect(
      screen.getByText(/Bàn số 05 - Tầng 1/)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(getStoredCart()).toHaveLength(0);
    });

    fireEvent.click(screen.getByTestId("order-finish-button"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("order-success-title")
      ).not.toBeInTheDocument();
    });
  });

  it("Chọn trà đào, thanh toán thành công và xóa giỏ hàng sau thanh toán", async () => {
    render(<MenuPage />);

    const teaImage = await screen.findByRole("img", {
      name: /trà đào cam sả/i,
    });
    fireEvent.click(teaImage);

    const dialog = await screen.findByRole("dialog");

    const addToCartButton = within(dialog)
      .getByTestId("modal-total-price")
      .closest("button");

    expect(addToCartButton).not.toBeNull();
    fireEvent.click(addToCartButton!);

    await waitFor(() => {
      expect(getStoredCart()).toHaveLength(1);
    });

    expect(getStoredCart()[0].totalPrice).toBe(39000);

    const cartButton = screen.getByRole("button", {
      name: /giỏ hàng/i,
    });
    fireEvent.click(cartButton);

    const checkoutButton = await screen.findByRole("button", {
      name: /thanh toán|đặt hàng|tiếp tục/i,
    });
    fireEvent.click(checkoutButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("confirmation-total-amount")
      ).toHaveTextContent(/39\.000/);
    });

    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    await waitFor(() => {
      expect(ordersApi.createOrder).toHaveBeenCalledTimes(1);
      expect(ordersApi.createMockPayment).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("order-success-title")).toBeInTheDocument();
    });

    expect(ordersApi.createOrder).toHaveBeenCalledWith({
      items: [
        expect.objectContaining({
          productId: 3,
          sizeId: 1,
          quantity: 1,
        }),
      ],
    });

    expect(ordersApi.createMockPayment).toHaveBeenCalledWith(
      101,
      "WALLET",
      expect.any(String),
      undefined
    );

    await waitFor(() => {
      expect(getStoredCart()).toHaveLength(0);
    });
  });
});
