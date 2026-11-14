
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMyOrders } from "@/utils/orders-api";
import { getToken } from "@/utils/auth";

interface OrderItem {
  id: number;
  productName: string;
  sizeName: string;
  toppings: { id: number; name: string; price: number }[];
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderListResponse {
  items: Order[];
  page: number;
  totalPages: number;
  total: number;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAYMENT_FAILED: "Thanh toán thất bại",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        if (!getToken()) {
          throw new Error("Vui lòng đăng nhập để xem lịch sử đơn hàng.");
        }

        const result = (await getMyOrders()) as OrderListResponse;
        setOrders(result.items);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải lịch sử đơn hàng.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-amber-800 hover:underline">
          ← Quay lại trang chủ
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-neutral-900">
          Lịch sử đơn hàng
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Theo dõi các đơn hàng bạn đã đặt tại BrewLite.
        </p>

        {loading && (
          <p className="mt-8 text-neutral-500">Đang tải đơn hàng...</p>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-xl bg-red-50 p-5 text-red-700">
            {error}
            <div className="mt-3">
              <Link href="/login" className="font-semibold underline">
                Đăng nhập
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="font-semibold text-neutral-800">
              Bạn chưa có đơn hàng nào.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-amber-800 px-5 py-3 text-sm font-semibold text-white"
            >
              Khám phá menu
            </Link>
          </div>
        )}

        <div className="mt-8 space-y-5">
          {orders.map((order) => (
            <section
              key={order.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div>
                  <p className="font-bold text-neutral-900">
                    Đơn hàng #{order.id}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <div className="space-y-3 py-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        {item.productName} × {item.quantity}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Size {item.sizeName}
                        {item.toppings?.length
                          ? ` · ${item.toppings.map((t) => t.name).join(", ")}`
                          : ""}
                      </p>
                    </div>
                    <p className="whitespace-nowrap text-sm text-neutral-700">
                      {formatPrice(item.lineTotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t pt-4">
                <span className="font-semibold text-neutral-700">
                  Tổng cộng
                </span>
                <span className="font-bold text-amber-900">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
