import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ProductCard from "./ProductCard";
import { Product } from "@/types/product";

const mockProductInStock: Product = {
  id: "prod-01",
  name: "Cà phê Muối BrewLite",
  categoryId: "traditional",
  categoryName: "Cà phê Truyền thống",
  description: "Cà phê Robusta thơm béo",
  basePrice: 29000,
  stock: 10,
  imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38",
  isPopular: true,
};

const mockProductOutOfStock: Product = {
  id: "prod-02",
  name: "Trà Sữa Oolong Nướng",
  categoryId: "tea",
  categoryName: "Trà Trái Cây",
  description: "Đậm vị khói",
  basePrice: 35000,
  stock: 0,
  imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
};

describe("ProductCard Component", () => {
  it("renders product name, description and price correctly", () => {
    const handleSelect = vi.fn();
    render(<ProductCard product={mockProductInStock} onSelect={handleSelect} />);

    expect(screen.getByText("Cà phê Muối BrewLite")).toBeInTheDocument();
    expect(screen.getByText("Cà phê Robusta thơm béo")).toBeInTheDocument();
    expect(screen.getByText(/29\.000/)).toBeInTheDocument();
    expect(screen.getByText("Bán chạy")).toBeInTheDocument();
  });

  it("calls onSelect when clicking the action button for in-stock item", () => {
    const handleSelect = vi.fn();
    render(<ProductCard product={mockProductInStock} onSelect={handleSelect} />);

    const selectButton = screen.getByRole("button", { name: /Chọn món/i });
    fireEvent.click(selectButton);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith(mockProductInStock);
  });

  it("disables button and shows out-of-stock badge when stock is 0 (FR-01)", () => {
    const handleSelect = vi.fn();
    render(<ProductCard product={mockProductOutOfStock} onSelect={handleSelect} />);

    expect(screen.getByText("Tạm hết món")).toBeInTheDocument();
    const disabledButton = screen.getByRole("button", { name: /Hết hàng/i });
    expect(disabledButton).toBeDisabled();

    fireEvent.click(disabledButton);
    expect(handleSelect).not.toHaveBeenCalled();
  });
});
