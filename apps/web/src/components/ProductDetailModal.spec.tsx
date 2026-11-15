import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProductDetailModal from "./ProductDetailModal";
import { Product } from "@/types/product";
import * as productsService from "@/services/products";
import * as cartUtils from "@/utils/cart";

vi.mock("@/services/products", () => ({
  fetchProductDetail: vi.fn(),
}));

const mockProduct: Product = {
  id: "prod-01",
  name: "Cà phê Muối BrewLite",
  categoryId: "traditional",
  categoryName: "Cà phê Truyền thống",
  description: "Cà phê Robusta thơm béo",
  basePrice: 29000,
  stock: 15,
  imageUrl: "https://example.com/muoi.jpg",
  isPopular: true,
  available: true,
};

describe("ProductDetailModal Component (FR-06, FR-07, FR-08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsService.fetchProductDetail).mockResolvedValue({
      id: "prod-01",
      name: "Cà phê Muối BrewLite",
      categoryId: "traditional",
      categoryName: "Cà phê Truyền thống",
      description: "Cà phê Robusta thơm béo",
      basePrice: 29000,
      stock: 15,
      imageUrl: "https://example.com/muoi.jpg",
      isPopular: true,
      available: true,
      sizes: [
        { id: "size-s", size: "S", name: "Nhỏ (S)", extraPrice: 0, available: true },
        { id: "size-m", size: "M", name: "Vừa (M)", extraPrice: 6000, available: true },
        { id: "size-l", size: "L", name: "Lớn (L)", extraPrice: 10000, available: true },
      ],
      toppings: [
        { id: "top-01", name: "Trân châu đen", price: 5000, available: true },
        { id: "top-02", name: "Kem Cheese", price: 10000, available: true },
      ],
    });
  });

  it("renders drink details with base price and default size S (FR-06)", async () => {
    const handleClose = vi.fn();
    render(<ProductDetailModal product={mockProduct} onClose={handleClose} />);

    expect(screen.getByText("Cà phê Muối BrewLite")).toBeInTheDocument();
    expect(screen.getByText("Cà phê Robusta thơm béo")).toBeInTheDocument();
    expect(screen.getByText(/Giá gốc:\s*29\.000/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Nhỏ (S)")).toBeInTheDocument();
      expect(screen.getByText("Vừa (M)")).toBeInTheDocument();
      expect(screen.getByText("Lớn (L)")).toBeInTheDocument();
    });
  });

  it("updates total price when selecting Size M and Size L (FR-07)", async () => {
    render(<ProductDetailModal product={mockProduct} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Vừa (M)")).toBeInTheDocument();
    });

    const totalPriceEl = screen.getByTestId("modal-total-price");

    // Default size S: 29.000 ₫
    expect(totalPriceEl).toHaveTextContent(/29\.000\s*₫/);

    // Select size M (+6.000): 35.000 ₫
    const sizeMButton = screen.getByRole("button", { name: /Vừa \(M\)/i });
    fireEvent.click(sizeMButton);
    expect(totalPriceEl).toHaveTextContent(/35\.000\s*₫/);

    // Select size L (+10.000): 39.000 ₫
    const sizeLButton = screen.getByRole("button", { name: /Lớn \(L\)/i });
    fireEvent.click(sizeLButton);
    expect(totalPriceEl).toHaveTextContent(/39\.000\s*₫/);
  });

  it("toggles toppings and updates total price (FR-08)", async () => {
    render(<ProductDetailModal product={mockProduct} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Trân châu đen")).toBeInTheDocument();
    });

    const totalPriceEl = screen.getByTestId("modal-total-price");

    // Toggle Trân châu đen (+5.000): 29k + 5k = 34k
    const toppingOption = screen.getByText("Trân châu đen");
    fireEvent.click(toppingOption);
    expect(totalPriceEl).toHaveTextContent(/34\.000\s*₫/);

    // Toggle Kem Cheese (+10.000): 34k + 10k = 44k
    const kemCheeseOption = screen.getByText("Kem Cheese");
    fireEvent.click(kemCheeseOption);
    expect(totalPriceEl).toHaveTextContent(/44\.000\s*₫/);

    // Untoggle Trân châu đen (-5.000): 44k - 5k = 39k
    fireEvent.click(toppingOption);
    expect(totalPriceEl).toHaveTextContent(/39\.000\s*₫/);
  });

  it("increases and decreases drink quantity correctly", async () => {
    render(<ProductDetailModal product={mockProduct} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Nhỏ (S)")).toBeInTheDocument();
    });

    const totalPriceEl = screen.getByTestId("modal-total-price");

    // Default quantity 1: 29.000 ₫
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(totalPriceEl).toHaveTextContent(/29\.000\s*₫/);

    // Click Increase
    const incBtn = screen.getByRole("button", { name: /Tăng số lượng/i });
    fireEvent.click(incBtn);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(totalPriceEl).toHaveTextContent(/58\.000\s*₫/);

    // Click Decrease
    const decBtn = screen.getByRole("button", { name: /Giảm số lượng/i });
    fireEvent.click(decBtn);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(totalPriceEl).toHaveTextContent(/29\.000\s*₫/);
  });

  it("adds item to cart with custom note and calls callbacks (FR-10)", async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const addToCartSpy = vi.spyOn(cartUtils, "addToCart");

    render(
      <ProductDetailModal
        product={mockProduct}
        onClose={handleClose}
        onAddedSuccess={handleSuccess}
      />
    );

    // Enter barista note
    const noteInput = screen.getByPlaceholderText(/Ít đá 50%/i);
    fireEvent.change(noteInput, { target: { value: "Mang đi, không ngọt" } });

    // Click Add to Cart
    const addBtn = screen.getByRole("button", { name: /Thêm vào giỏ hàng/i });
    fireEvent.click(addBtn);

    expect(addToCartSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: "prod-01",
        name: "Cà phê Muối BrewLite",
        note: "Mang đi, không ngọt",
        qty: 1,
      })
    );
  });
});
