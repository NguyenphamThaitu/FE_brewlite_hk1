
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

export type MockPaymentMethod = "WALLET" | "CARD";

export interface MockCardDetails {
  number: string;
  expiry: string;
  cvv: string;
}

export interface MockPaymentResponse {
  paymentId: number;
  orderId: number;
  method: MockPaymentMethod;
  amount: number;
  paymentStatus: "SUCCESS" | "FAILED" | string;
  orderStatus: string;
  errorCode: string | null;
  message: string;
  cardLast4?: string;
  walletBalance?: number;
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
    throw new Error(
      Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message || "Không thể xử lý yêu cầu.",
    );
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

export function cancelOrder(id: number) {
  return request<{ id: number; status: string }>(`/orders/${id}/cancel`, {
    method: "POST",
  });
}

export function getMyWalletBalance() {
  return request<{ walletBalance?: number }>("/auth/me");
}

export function getOrderDetail(id: number) {
  return request(`/orders/${id}`);
}

export function createMockPayment(
  orderId: number,
  method: MockPaymentMethod,
  idempotencyKey: string,
  card?: MockCardDetails,
) {
  return request<MockPaymentResponse>("/payments", {
    method: "POST",
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      orderId,
      method,
      ...(method === "CARD" ? { card } : {}),
    }),
  });
}

// Giữ lại hàm VNPay để không ảnh hưởng các phần code cũ
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
