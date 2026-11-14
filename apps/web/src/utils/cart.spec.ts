import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getStoredCart,
  addToCart,
  updateCartQty,
  removeFromCart,
  clearCart,
  saveCart,
} from "./cart";
import { Topping } from "@/types/product";

const mockToppingTranChau: Topping = {
  id: "top-01",
  name: "Trân châu đen",
  price: 5000,
  available: true,
};

const mockToppingKemCheese: Topping = {
  id: "top-02",
  name: "Kem Cheese",
  price: 10000,
  available: true,
};

describe("Cart Utility (FR-10, FR-11, FR-12, FR-13)", () => {
  beforeEach(() => {
    localStorage.clear();
    clearCart();
  });

  it("adds a new drink to cart with correct unit price and total price (FR-10, FR-13)", () => {
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-m",
      size: "M",
      sizePrice: 6000,
      toppings: [mockToppingTranChau],
      note: "Ít đá",
      unitPrice: 40000, // 29k base + 6k size + 5k topping
      qty: 2,
    });

    const cart = getStoredCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].name).toBe("Cà phê Muối");
    expect(cart[0].size).toBe("M");
    expect(cart[0].qty).toBe(2);
    expect(cart[0].unitPrice).toBe(40000);
    expect(cart[0].totalPrice).toBe(80000); // 40k * 2
  });

  it("merges quantity when adding the exact same product, size, toppings and note (FR-10)", () => {
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-m",
      size: "M",
      sizePrice: 6000,
      toppings: [mockToppingTranChau],
      note: "Ít đá",
      unitPrice: 40000,
      qty: 1,
    });

    // Add again with exact same attributes
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-m",
      size: "M",
      sizePrice: 6000,
      toppings: [mockToppingTranChau],
      note: "Ít đá",
      unitPrice: 40000,
      qty: 2,
    });

    const cart = getStoredCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].qty).toBe(3);
    expect(cart[0].totalPrice).toBe(120000); // 40k * 3
  });

  it("creates separate cart items if size, toppings or note differ (FR-10)", () => {
    // Item 1: Size M
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-m",
      size: "M",
      sizePrice: 6000,
      toppings: [mockToppingTranChau],
      unitPrice: 40000,
      qty: 1,
    });

    // Item 2: Size L
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-l",
      size: "L",
      sizePrice: 10000,
      toppings: [mockToppingTranChau],
      unitPrice: 44000,
      qty: 1,
    });

    // Item 3: Size M but different topping
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-m",
      size: "M",
      sizePrice: 6000,
      toppings: [mockToppingKemCheese],
      unitPrice: 45000,
      qty: 1,
    });

    const cart = getStoredCart();
    expect(cart).toHaveLength(3);
  });

  it("updates item quantity and recalculates line total price (FR-12, FR-13)", () => {
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-s",
      size: "S",
      sizePrice: 0,
      toppings: [],
      unitPrice: 29000,
      qty: 1,
    });

    const cart = getStoredCart();
    const itemId = cart[0].id;

    updateCartQty(itemId, 4);

    const updatedCart = getStoredCart();
    expect(updatedCart[0].qty).toBe(4);
    expect(updatedCart[0].totalPrice).toBe(116000); // 29k * 4
  });

  it("removes item from cart when quantity is updated to 0 (FR-12)", () => {
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-s",
      size: "S",
      sizePrice: 0,
      toppings: [],
      unitPrice: 29000,
      qty: 2,
    });

    const cart = getStoredCart();
    const itemId = cart[0].id;

    updateCartQty(itemId, 0);

    expect(getStoredCart()).toHaveLength(0);
  });

  it("removes specific item using removeFromCart (FR-12)", () => {
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-s",
      size: "S",
      sizePrice: 0,
      toppings: [],
      unitPrice: 29000,
      qty: 1,
    });
    addToCart({
      productId: "prod-02",
      name: "Trà Đào Cam Sả",
      imageUrl: "https://example.com/tradao.jpg",
      sizeId: "size-s",
      size: "S",
      sizePrice: 0,
      toppings: [],
      unitPrice: 39000,
      qty: 1,
    });

    const cart = getStoredCart();
    expect(cart).toHaveLength(2);

    removeFromCart(cart[0].id);

    const remainingCart = getStoredCart();
    expect(remainingCart).toHaveLength(1);
    expect(remainingCart[0].productId).toBe("prod-02");
  });

  it("clears all items using clearCart", () => {
    addToCart({
      productId: "prod-01",
      name: "Cà phê Muối",
      imageUrl: "https://example.com/muoi.jpg",
      sizeId: "size-s",
      size: "S",
      sizePrice: 0,
      toppings: [],
      unitPrice: 29000,
      qty: 2,
    });

    clearCart();

    expect(getStoredCart()).toHaveLength(0);
  });
});
