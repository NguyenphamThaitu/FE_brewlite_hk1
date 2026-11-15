const API_URL = "http://localhost:3001";

export interface ApiProduct {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string | null;
  category: string;
  available: boolean;
}

export interface ApiSize {
  id: number;
  name: string;
  extraPrice: number;
  available: boolean;
}

export interface ApiTopping {
  id: number;
  name: string;
  price: number;
  available: boolean;
}

export interface ApiProductDetail extends ApiProduct {
  sizes: ApiSize[];
  toppings: ApiTopping[];
}

export async function getProducts(): Promise<ApiProduct[]> {
  const response = await fetch(`${API_URL}/products`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách sản phẩm.");
  }

  return response.json();
}

export async function getProductDetail(
  id: number,
): Promise<ApiProductDetail> {
  const response = await fetch(`${API_URL}/products/${id}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể tải chi tiết sản phẩm.");
  }

  return response.json();
}