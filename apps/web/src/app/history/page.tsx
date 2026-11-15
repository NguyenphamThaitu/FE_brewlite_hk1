"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Coffee,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import OrderConfirmationModal from "@/components/OrderConfirmationModal";
import { getStoredCart } from "@/utils/cart";
import { clearSession, isSessionActive } from "@/utils/auth";
import {
  fetchMyOrders,
  OrdersApiError,
  type OrderHistoryOrder,
} from "@/services/orders";

const PAGE_SIZE = 10;

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-800 border-amber-200" },
  PAYMENT_FAILED: { label: "Thanh toán thất bại", className: "bg-red-50 text-red-800 border-red-200" },
  PAID: { label: "Đã thanh toán", className: "bg-blue-50 text-blue-800 border-blue-200" },
  PREPARING: { label: "Đang pha chế", className: "bg-violet-50 text-violet-800 border-violet-200" },
  READY: { label: "Sẵn sàng nhận món", className: "bg-cyan-50 text-cyan-800 border-cyan-200" },
  COMPLETED: { label: "Hoàn thành", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  CANCELLED: { label: "Đã hủy", className: "bg-stone-100 text-stone-700 border-stone-200" },
};

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Thời gian không xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function getToppingNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((topping) => {
      if (typeof topping === "string") return topping;
      if (
        topping &&
        typeof topping === "object" &&
        "name" in topping &&
        typeof (topping as { name?: unknown }).name === "string"
      ) {
        return (topping as { name: string }).name;
      }
      return "";
    })
    .filter(Boolean);
}

function OrderCard({ order }: { order: OrderHistoryOrder }) {
  const status = ORDER_STATUS[order.status] ?? {
    label: order.status || "Không xác định",
    className: "bg-stone-100 text-stone-700 border-stone-200",
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-[#EAE0D2] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#F0E8DE] bg-[#FFFCF8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-black text-[#2B1B12]">Đơn hàng #{order.id}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#897565]">
            <Clock3 className="h-3.5 w-3.5" /> {formatDate(order.createdAt)}
          </p>
        </div>
        <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-extrabold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        {order.items?.length ? (
          order.items.map((item) => {
            const toppings = getToppingNames(item.toppings);
            return (
              <div key={item.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#2B1B12]">{item.productName}</p>
                  <p className="mt-1 text-xs text-[#786354]">
                    Size {item.sizeName} · Số lượng: {item.quantity}
                  </p>
                  {toppings.length > 0 && (
                    <p className="mt-1 text-xs text-[#897565]">Topping: {toppings.join(", ")}</p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-bold tabular-nums text-[#4A3528]">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-[#897565]">Đơn hàng chưa có thông tin món.</p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-dashed border-[#EAE0D2] bg-[#FFFCF8] px-5 py-4 sm:px-6">
        <span className="text-xs font-bold text-[#786354]">Tổng đơn hàng</span>
        <span className="text-lg font-black tabular-nums text-[#E06D20]">{formatPrice(order.totalAmount)}</span>
      </div>
    </article>
  );
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<OrderHistoryOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    if (!isSessionActive()) {
      router.replace(`/login?next=${encodeURIComponent("/history")}`);
      return;
    }
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetchMyOrders(page, PAGE_SIZE, controller.signal)
      .then((result) => {
        setOrders(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof OrdersApiError && err.status === 401) {
          clearSession();
          router.replace(`/login?next=${encodeURIComponent("/history")}`);
          return;
        }
        setError(err instanceof Error ? err.message : "Không thể tải lịch sử đơn hàng.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [authChecked, page, refreshKey, router]);

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FBF7F0] text-sm font-semibold text-[#786354]">
        Đang kiểm tra phiên đăng nhập...
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF7F0] text-[#2B1B12]">
      <Header onOpenCart={() => setIsCartOpen(true)} activeTab="history" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/#menu" className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-[#9A521E] hover:text-[#E06D20]">
              <ArrowLeft className="h-4 w-4" /> Quay lại thực đơn
            </Link>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#E06D20]">Tài khoản BrewLite</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2B1B12] sm:text-4xl">Lịch sử đơn hàng</h1>
            <p className="mt-2 text-sm text-[#786354]">Theo dõi những đơn hàng bạn đã đặt tại BrewLite.</p>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#E0D2C1] bg-white px-5 text-xs font-extrabold text-[#4A3528] transition hover:bg-[#FAF4ED] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-[#EAE0D2] bg-white px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF1E6] text-[#E06D20]">
            <PackageCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#897565]">Tổng số đơn hàng</p>
            <p className="text-lg font-black tabular-nums text-[#2B1B12]">{total}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4" aria-label="Đang tải lịch sử đơn hàng" role="status">
            {[1, 2].map((item) => (
              <div key={item} className="h-52 animate-pulse rounded-3xl border border-[#EAE0D2] bg-white" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="rounded-3xl border border-red-200 bg-white px-6 py-12 text-center">
            <p className="font-bold text-red-800">Không thể tải lịch sử đơn hàng</p>
            <p className="mt-2 text-sm text-[#786354]">{error}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              className="mt-5 rounded-full bg-[#E06D20] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#C85A12]"
            >
              Thử lại
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE0D2] bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF1E6] text-[#E06D20]">
              <ShoppingBag className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-xl font-black text-[#2B1B12]">Bạn chưa có đơn hàng nào</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#786354]">
              Những đơn hàng bạn đặt thành công sẽ xuất hiện tại đây để bạn tiện theo dõi.
            </p>
            <Link href="/#menu" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E06D20] px-6 text-xs font-extrabold text-white hover:bg-[#C85A12]">
              <Coffee className="h-4 w-4" /> Khám phá thực đơn
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => <OrderCard key={order.id} order={order} />)}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#EAE0D2] bg-white px-4 py-4 sm:flex-row sm:px-5">
                <p className="text-xs font-semibold text-[#786354]">
                  Trang {page} / {totalPages} · {total} đơn hàng
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#E0D2C1] px-4 text-xs font-bold text-[#4A3528] hover:bg-[#FAF4ED] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" /> Trước
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#E06D20] px-4 text-xs font-extrabold text-white hover:bg-[#C85A12] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sau <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-[#38251A] bg-[#241710] py-8 text-[#D8CCC0]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-xs sm:flex-row sm:px-6 lg:px-8">
          <span className="font-extrabold text-white">BrewLite Coffee & Tea</span>
          <span className="text-[#A89888]">© 2026 BrewLite System.</span>
        </div>
      </footer>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsOrderModalOpen(true);
        }}
      />
      <OrderConfirmationModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        items={getStoredCart()}
        totalAmount={getStoredCart().reduce((sum, item) => sum + item.totalPrice, 0)}
      />
    </div>
  );
}
