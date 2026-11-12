import { Product, ProductDetail } from "@/types/product";

const DEFAULT_API_URL = "http://localhost:3001";

export const getApiBaseUrl = (): string => {
  return (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
};

const DEFAULT_DRINK_IMAGE =
  "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop&q=80";

const getFallbackImage = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("matcha") || lower.includes("trà sữa")) {
    return "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("đào") || lower.includes("trà")) {
    return "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80";
  }
  if (lower.includes("bạc xỉu")) {
    return "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80";
  }
  return DEFAULT_DRINK_IMAGE;
};

interface ApiProductRaw {
  id: number | string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string | null;
  category?: string | null;
  available?: boolean;
  isPopular?: boolean;
}

interface ApiProductDetailRaw extends ApiProductRaw {
  sizes?: Array<{
    id: number | string;
    name: string;
    extraPrice: number;
    available?: boolean;
  }>;
  toppings?: Array<{
    id: number | string;
    name: string;
    price: number;
    available?: boolean;
  }>;
}

const toCategoryId = (categoryName: string): string => {
  return categoryName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "drinks";
};

export const normalizeProduct = (raw: ApiProductRaw): Product => {
  const categoryName = raw.category?.trim() || "Đồ uống";
  return {
    id: raw.id,
    name: raw.name,
    categoryId: toCategoryId(categoryName),
    categoryName,
    description: raw.description || "",
    basePrice: Number(raw.basePrice) || 0,
    available: raw.available !== false,
    imageUrl: raw.imageUrl?.trim() || getFallbackImage(raw.name),
    isPopular: raw.isPopular,
  };
};

export async function fetchProducts(signal?: AbortSignal): Promise<Product[]> {
  const res = await fetch(`${getApiBaseUrl()}/products`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Không thể tải thực đơn (Mã lỗi ${res.status})`);
  }

  const data = (await res.json()) as ApiProductRaw[];
  if (!Array.isArray(data)) {
    throw new Error("Dữ liệu thực đơn không đúng định dạng");
  }

  return data.map(normalizeProduct);
}

export async function fetchProductDetail(
  id: number | string,
  signal?: AbortSignal
): Promise<ProductDetail> {
  const res = await fetch(`${getApiBaseUrl()}/products/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Không thể tải chi tiết món (Mã lỗi ${res.status})`);
  }

  const raw = (await res.json()) as ApiProductDetailRaw;
  const base = normalizeProduct(raw);

  return {
    ...base,
    sizes: (raw.sizes || []).map((s) => ({
      id: s.id,
      size: s.name,
      name: s.name.length <= 2 ? `Size ${s.name}` : s.name,
      extraPrice: Number(s.extraPrice) || 0,
      available: s.available !== false,
    })),
    toppings: (raw.toppings || []).map((t) => ({
      id: t.id,
      name: t.name,
      price: Number(t.price) || 0,
      available: t.available !== false,
    })),
  };
}

