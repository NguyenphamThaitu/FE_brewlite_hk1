import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MenuPage from "./page";
import * as productsService from "@/services/products";
import { Product } from "@/types/product";

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

const mockApiProducts: Product[] = [
  {
    id: 1,
    name: "Cà phê sữa đá",
    categoryId: "ca-phe",
    categoryName: "Cà phê",
    description: "Cà phê phin đậm vị, sữa đặc",
    basePrice: 29000,
    available: true,
    imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
  },
  {
    id: 2,
    name: "Matcha latte",
    categoryId: "tra",
    categoryName: "Trà",
    description: "Matcha Nhật pha sữa tươi",
    basePrice: 45000,
    available: false,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3",
  },
];

describe("MenuPage (Task 4.3: API Menu + Loading/Empty/Error)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading skeleton state while fetching products", () => {
    vi.mocked(productsService.fetchProducts).mockReturnValue(
      new Promise(() => {})
    );

    render(<MenuPage />);

    expect(screen.getByRole("status", { name: /Đang tải thực đơn/i })).toBeInTheDocument();
  });

  it("renders products from API and filters by search query", async () => {
    vi.mocked(productsService.fetchProducts).mockResolvedValue(mockApiProducts);

    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByText("Cà phê sữa đá")).toBeInTheDocument();
      expect(screen.getByText("Matcha latte")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Tìm kiếm đồ uống/i);
    fireEvent.change(searchInput, { target: { value: "Matcha" } });

    expect(screen.queryByText("Cà phê sữa đá")).not.toBeInTheDocument();
    expect(screen.getByText("Matcha latte")).toBeInTheDocument();
  });

  it("renders empty state when API returns empty product list", async () => {
    vi.mocked(productsService.fetchProducts).mockResolvedValue([]);

    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByText("Thực đơn hiện đang trống")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Tải lại thực đơn/i })
    ).toBeInTheDocument();
  });

  it("renders error state on API failure and recovers when clicking Thử lại", async () => {
    vi.mocked(productsService.fetchProducts)
      .mockRejectedValueOnce(new Error("Lỗi kết nối máy chủ"))
      .mockResolvedValueOnce(mockApiProducts);

    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Không thể tải thực đơn")).toBeInTheDocument();
      expect(screen.getByText("Lỗi kết nối máy chủ")).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: /Thử lại/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Cà phê sữa đá")).toBeInTheDocument();
    });
    expect(productsService.fetchProducts).toHaveBeenCalledTimes(2);
  });
});

