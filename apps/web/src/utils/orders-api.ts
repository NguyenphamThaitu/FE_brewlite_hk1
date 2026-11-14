import { getToken } from "@/utils/auth";
import { getApiBaseUrl } from "@/services/products";

export interface CreateOrderItem {
  productId: number;
  sizeId: number;
  toppingIds?: number[];
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
}

export interface CreateOrderResponse {
  id: number;
  totalAmount: number;
  status: string;
}

export interface VnpayPaymentResponse {
  paymentId: number;
  orderId: number;
  amount: number;
  paymentStatus: string;
  paymentUrl: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("Vui lòng đăng nhập để tiếp tục.");
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Không thể xử lý yêu cầu.");
  }

  return data as T;
}

export function createOrder(payload: CreateOrderPayload) {
  return request<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMyOrders(page = 1, limit = 20) {
  return request("/orders/me?page=" + page + "&limit=" + limit);
}

export function getOrderDetail(id: number) {
  return request(`/orders/${id}`);
}

export function createVnpayPayment(
  orderId: number,
  idempotencyKey: string,
) {
  return request<VnpayPaymentResponse>("/payments/vnpay", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ orderId }),
  });
}