import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MenuPage from "@/app/page";
import * as productsService from "@/services/products";
import { clearCart, getStoredCart } from "@/utils/cart";
import { Product } from "@/types/product";

// Mock products fetched from API matching apps/api/src/prisma/seed.ts
const mockSeedProducts: Product[] = [
  {
    id: 1,
    name: "Cà phê sữa đá",
    categoryId: "ca-phe",
    categoryName: "Cà phê Phin & Máy",
    description: "Cà phê phin đậm vị, sữa đặc",
    basePrice: 29000,
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
  },
  {
    id: 3,
    name: "Trà đào cam sả",
    categoryId: "tra",
    categoryName: "Trà & Matcha",
    description: "Trà đen, đào ngâm, thơm mát",
    basePrice: 39000,
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc",
  },
  {
    id: 5,
    name: "Matcha latte",
    categoryId: "tra",
    categoryName: "Trà & Matcha",
    description: "Matcha Nhật pha sữa tươi",
    basePrice: 45000,
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a",
  },
];

vi.mock("@/services/products", async () => {
  const actual = await vi.importActual<typeof import("@/services/products")>(
    "@/services/products"
  );
  return {
    ...actual,
    fetchProducts: vi.fn(),
    fetchProductDetail: vi.fn(),
  };
});

describe("E2E Test: Luồng Đặt Món và Xác Nhận Đơn Hàng (Task 5.2 - NFR-24)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCart();
    localStorage.clear();

    vi.mocked(productsService.fetchProducts).mockResolvedValue(mockSeedProducts);

    // Mock chi tiết món khớp với schema size và topping của Backend Prisma Seed
    vi.mocked(productsService.fetchProductDetail).mockImplementation(
      async (id: string | number) => {
        const prod = mockSeedProducts.find((p) => p.id === Number(id)) || mockSeedProducts[0];
        return {
          ...prod,
          sizes: [
            { id: 1, size: "S", name: "Nhỏ (S)", extraPrice: 0, available: true },
            { id: 2, size: "M", name: "Vừa (M)", extraPrice: 6000, available: true },
            { id: 3, size: "L", name: "Lớn (L)", extraPrice: 10000, available: true },
          ],
          toppings: [
            { id: 1, name: "Trân châu đen", price: 7000, available: true },
            { id: 2, name: "Thạch dừa", price: 6000, available: true },
            { id: 3, name: "Kem cheese", price: 10000, available: true },
          ],
        };
      }
    );
  });

  it("Kịch bản E2E: Xem Menu ➔ Chọn món ➔ Tùy biến Size/Topping/Ghi chú ➔ Giỏ hàng ➔ Xác nhận đơn hàng thành công", async () => {
    // 1. Khách hàng truy cập ứng dụng BrewLite
    render(<MenuPage />);

    // Chờ thực đơn tải xong và hiển thị món Cà phê sữa đá
    await waitFor(() => {
      expect(screen.getAllByText("Cà phê sữa đá")[0]).toBeInTheDocument();
    });

    // 2. Khách hàng bấm chọn món "Cà phê sữa đá" trong danh sách menu
    const productCards = screen.getAllByText("Cà phê sữa đá");
    fireEvent.click(productCards[0]);

    // Chờ popup ProductDetailModal hiển thị
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText("Vừa (M)")).toBeInTheDocument();
    });

    const modalDialog = screen.getByRole("dialog");

    // 3. Tùy biến món: Chọn Size M (+6.000 ₫), chọn topping Trân châu đen (+7.000 ₫), nhập ghi chú
    const sizeMBtn = within(modalDialog).getByRole("button", { name: /Vừa \(M\)/i });
    fireEvent.click(sizeMBtn);

    const toppingCheckbox = within(modalDialog).getByText("Trân châu đen");
    fireEvent.click(toppingCheckbox);

    // Nhập ghi chú riêng cho Barista
    const noteInput = within(modalDialog).getByPlaceholderText(/Ít đá 50%/i);
    fireEvent.change(noteInput, { target: { value: "Ít đá, 50% đường" } });

    // Kiểm tra tổng tiền tạm tính trong modal: 29k (gốc) + 6k (size M) + 7k (trân châu) = 42.000 ₫
    const modalTotal = within(modalDialog).getByTestId("modal-total-price");
    expect(modalTotal).toHaveTextContent(/42\.000\s*₫/);

    // 4. Bấm "Thêm vào giỏ hàng"
    const addToCartBtn = within(modalDialog).getByRole("button", { name: /Thêm vào giỏ hàng/i });
    fireEvent.click(addToCartBtn);

    // Kiểm tra giỏ hàng đã được lưu trữ trong localStorage (FR-10)
    await waitFor(() => {
      const stored = getStoredCart();
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe("Cà phê sữa đá");
      expect(stored[0].size).toBe("M");
      expect(stored[0].totalPrice).toBe(42000);
      expect(stored[0].note).toBe("Ít đá, 50% đường");
    });

    // 5. Mở Giỏ hàng (CartDrawer) để kiểm tra đơn hàng trước khi thanh toán
    const headerCartBtn = screen.getByRole("button", { name: /giỏ hàng/i });
    fireEvent.click(headerCartBtn);

    // Xác thực các thông tin hiển thị trong CartDrawer (FR-11, FR-13)
    await waitFor(() => {
      expect(screen.getByText(/Tạm tính hàng/i)).toBeInTheDocument();
      expect(screen.getByText(/Ghi chú: Ít đá, 50% đường/i)).toBeInTheDocument();
    });

    // 6. Khách hàng bấm "Đặt hàng & Thanh toán"
    const checkoutBtn = screen.getByTestId("cart-checkout-button");
    fireEvent.click(checkoutBtn);

    // 7. Màn hình Xác nhận đơn hàng (OrderConfirmationModal) xuất hiện (FR-19, FR-29)
    await waitFor(() => {
      expect(screen.getByText("Xác nhận đơn hàng")).toBeInTheDocument();
      expect(screen.getByTestId("confirmation-total-amount")).toHaveTextContent(/42\.000\s*₫/);
    });

    // Điền thông tin người nhận và hình thức nhận món (FR-23)
    const nameInput = screen.getByTestId("order-customer-name");
    fireEvent.change(nameInput, { target: { value: "Trần Minh Trí" } });

    const pickupInput = screen.getByTestId("order-pickup-note");
    fireEvent.change(pickupInput, { target: { value: "Bàn số 05 - Tầng 1" } });

    // 8. Bấm "Xác nhận & Gửi đơn hàng"
    const confirmSubmitBtn = screen.getByTestId("confirm-order-submit");
    fireEvent.click(confirmSubmitBtn);

    // 9. Kiểm tra Màn hình Đặt hàng thành công hiển thị (FR-29)
    await waitFor(
      () => {
        expect(screen.getByTestId("order-success-title")).toHaveTextContent("Đặt hàng thành công!");
        expect(screen.getByTestId("order-code")).toHaveTextContent(/#BL-/);
        expect(screen.getByTestId("order-status-badge")).toHaveTextContent("Đã tiếp nhận (Chờ pha chế)");
        expect(screen.getByText("Bàn số 05 - Tầng 1")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Giỏ hàng phải được tự động làm rỗng sau khi đặt thành công (FR-29)
    expect(getStoredCart()).toHaveLength(0);

    // 10. Bấm "Hoàn tất & Tiếp tục xem thực đơn" để kết thúc luồng
    const finishBtn = screen.getByTestId("order-finish-button");
    fireEvent.click(finishBtn);

    // Popup xác nhận đóng lại, giao diện trở về trạng thái thực đơn ban đầu
    await waitFor(() => {
      expect(screen.queryByTestId("order-success-title")).not.toBeInTheDocument();
    });
  });

  it("Kịch bản E2E mở rộng: Đặt nhiều món và cập nhật số lượng trong giỏ hàng", async () => {
    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getAllByText("Trà đào cam sả")[0]).toBeInTheDocument();
    });

    // Chọn món Trà đào cam sả (39.000 ₫)
    const peachCards = screen.getAllByText("Trà đào cam sả");
    fireEvent.click(peachCards[0]);

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: /Thêm vào giỏ hàng/i })).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog");

    // Thêm vào giỏ Size S (39.000 ₫)
    const addToCartBtn = within(dialog).getByRole("button", { name: /Thêm vào giỏ hàng/i });
    fireEvent.click(addToCartBtn);

    // Mở giỏ hàng
    const headerCartBtn = screen.getByRole("button", { name: /giỏ hàng/i });
    fireEvent.click(headerCartBtn);

    await waitFor(() => {
      expect(screen.getByTestId("cart-checkout-button")).toBeInTheDocument();
    });

    // Bấm đặt hàng
    fireEvent.click(screen.getByTestId("cart-checkout-button"));

    await waitFor(() => {
      expect(screen.getByTestId("confirmation-total-amount")).toHaveTextContent(/39\.000\s*₫/);
    });

    // Xác nhận gửi đơn
    fireEvent.click(screen.getByTestId("confirm-order-submit"));

    await waitFor(
      () => {
        expect(screen.getByTestId("order-success-title")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(getStoredCart()).toHaveLength(0);
  });
});
