import { getApiBaseUrl } from "@/services/products";
import { getToken } from "@/utils/auth";

export interface OrderHistoryItem {
  id: number;
  productName: string;
  sizeName: string;
  toppings: unknown;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderHistoryOrder {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderHistoryItem[];
}

export interface OrderHistoryResponse {
  items: OrderHistoryOrder[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class OrdersApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "OrdersApiError";
  }
}

/** Lấy lịch sử đơn của tài khoản hiện tại. Backend tự lọc theo userId từ JWT. */
export async function fetchMyOrders(
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<OrderHistoryResponse> {
  const token = getToken();
  if (!token) {
    throw new OrdersApiError(401, "Bạn cần đăng nhập để xem lịch sử đơn hàng.");
  }

  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  const response = await fetch(`${getApiBaseUrl()}/orders/me?${query.toString()}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal,
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const rawMessage =
      data && typeof data === "object" && "message" in data
        ? (data as { message?: unknown }).message
        : null;
    const message = Array.isArray(rawMessage)
      ? rawMessage.map(String).join("; ")
      : typeof rawMessage === "string"
        ? rawMessage
        : `Không thể tải lịch sử đơn hàng (mã lỗi ${response.status}).`;
    throw new OrdersApiError(response.status, message);
  }

  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as OrderHistoryResponse).items)
  ) {
    throw new OrdersApiError(500, "Dữ liệu lịch sử đơn hàng trả về không đúng định dạng.");
  }

  return data as OrderHistoryResponse;
}
