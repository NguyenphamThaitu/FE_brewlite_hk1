import { CartItem } from "@/types/product";

const CART_STORAGE_KEY = "brewlite_cart";

export const getStoredCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Lỗi khi đọc giỏ hàng từ localStorage:", error);
    return [];
  }
};

export const saveCart = (items: CartItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("brewlite_cart_updated"));
  } catch (error) {
    console.error("Lỗi khi lưu giỏ hàng vào localStorage:", error);
  }
};

export const addToCart = (newItem: Omit<CartItem, "id" | "totalPrice">): void => {
  const currentCart = getStoredCart();

  // Find if same product with exact same size, same toppings and same note already exists
  const toppingIds = newItem.toppings.map((t) => t.id).sort().join(",");
  
  const existingIndex = currentCart.findIndex((item) => {
    const itemToppingIds = item.toppings.map((t) => t.id).sort().join(",");
    return (
      item.productId === newItem.productId &&
      item.size === newItem.size &&
      itemToppingIds === toppingIds &&
      (item.note || "").trim() === (newItem.note || "").trim()
    );
  });

  if (existingIndex > -1) {
    // Merge quantity (FR-03 quy tắc gộp món trùng)
    currentCart[existingIndex].qty += newItem.qty;
    currentCart[existingIndex].totalPrice =
      currentCart[existingIndex].qty * currentCart[existingIndex].unitPrice;
  } else {
    // Add new item with unique cart item ID
    const cartItem: CartItem = {
      ...newItem,
      id: "cart-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      totalPrice: newItem.qty * newItem.unitPrice,
    };
    currentCart.push(cartItem);
  }

  saveCart(currentCart);
};

export const removeFromCart = (cartItemId: string): void => {
  const currentCart = getStoredCart().filter((item) => item.id !== cartItemId);
  saveCart(currentCart);
};

export const updateCartQty = (cartItemId: string, newQty: number): void => {
  if (newQty <= 0) {
    removeFromCart(cartItemId);
    return;
  }
  const currentCart = getStoredCart();
  const index = currentCart.findIndex((item) => item.id === cartItemId);
  if (index > -1) {
    currentCart[index].qty = newQty;
    currentCart[index].totalPrice = currentCart[index].qty * currentCart[index].unitPrice;
    saveCart(currentCart);
  }
};

export const clearCart = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("brewlite_cart_updated"));
};

export const subscribeCart = (callback: () => void): (() => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("brewlite_cart_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("brewlite_cart_updated", callback);
    window.removeEventListener("storage", callback);
  };
};

