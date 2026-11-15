export type ProductSize = "S" | "M" | "L" | string;

export interface Topping {
  id: string | number;
  name: string;
  price: number;
  available?: boolean;
}

export interface SizeOption {
  id?: string | number;
  size: ProductSize;
  name: string;
  extraPrice: number;
  available?: boolean;
}

export interface Product {
  id: string | number;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  basePrice: number;
  available?: boolean;
  stock?: number;
  imageUrl: string;
  isPopular?: boolean;
}

export interface ProductDetail extends Product {
  sizes: SizeOption[];
  toppings: Topping[];
}

export interface CartItem {
  id: string; // unique cart item id
  productId: string | number;
  name: string;
  imageUrl: string;
  sizeId?: string | number;
  size: ProductSize;
  sizePrice: number;
  toppings: Topping[];
  note?: string;
  unitPrice: number;
  qty: number;
  totalPrice: number;
}
