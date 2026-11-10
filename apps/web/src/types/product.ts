export type ProductSize = "S" | "M" | "L";

export interface Topping {
  id: string;
  name: string;
  price: number;
}

export interface SizeOption {
  size: ProductSize;
  name: string;
  extraPrice: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  basePrice: number;
  stock: number;
  imageUrl: string;
  isPopular?: boolean;
}

export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  name: string;
  imageUrl: string;
  size: ProductSize;
  sizePrice: number;
  toppings: Topping[];
  note?: string;
  unitPrice: number;
  qty: number;
  totalPrice: number;
}

