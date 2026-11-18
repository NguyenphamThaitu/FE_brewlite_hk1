"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Coffee,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import Header from "@/components/Header";
import {
  clearSession,
  getStoredUser,
  isSessionActive,
  subscribeAuth,
} from "@/utils/auth";
import {
  getStaffOrders,
  StaffOrder,
  StaffOrderStatus,
  updateOrderStatus,
} from "@/utils/orders-api";

export const STAFF_POLL_MS = 5000;

const STATUS_META: Record<
  StaffOrderStatus,
  {
    label: string;
    badgeClass: string;
    nextStatus?: "PREPARING" | "READY" | "COMPLETED";
    actionLabel?: string;
    actionClass?: string;
  }
> = {
  PAID: {
    label: "Chờ pha chế",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    nextStatus: "PREPARING",
    actionLabel: "Bắt đầu pha chế",
    actionClass:
      "bg-[#E06D20] hover:bg-[#C85A12] text-white shadow-sm shadow-orange-950/15",
  },
  PREPARING: {
    label: "Đang pha chế",
    badgeClass: "bg-sky-100 text-sky-900 border-sky-200",
    nextStatus: "READY",
    actionLabel: "Pha xong · Gọi khách nhận",
    actionClass:
      "bg-sky-600 hover:bg-sky-700 text-white shadow-sm shadow-sky-950/15",
  },
  READY: {
    label: "Sẵn sàng nhận",
    badgeClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    nextStatus: "COMPLETED",
    actionLabel: "Khách đã nhận · Hoàn thành",
    actionClass:
      "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-950/15",
  },
  COMPLETED: {
    label: "Đã hoàn thành",
    badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-200",
  },
};

const FILTER_TABS: { value?: StaffOrderStatus; label: string }[] = [
  { value: undefined, label: "Tất cả đơn" },
  { value: "PAID", label: "Chờ pha chế" },
  { value: "PREPARING", label: "Đang pha chế" },
  { value: "READY", label: "Sẵn sàng nhận" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
];

function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")} ₫`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

export default function StaffOrdersPage() {
  const router = useRouter();
  const user = useSyncExternalStore(subscribeAuth, getStoredUser, () => null);

  const [filterStatus, setFilterStatus] = useState<StaffOrderStatus | undefined>(
    undefined,
  );
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const isStaff = Boolean(user && user.role === "STAFF");

  const fetchOrders = useCallback(
    async (silent = false) => {
      if (!isStaff || !isSessionActive()) return;
      if (!silent) setRefreshing(true);

      try {
        const data = await getStaffOrders(filterStatus);
        setOrders(Array.isArray(data) ? data : []);
        setError(null);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách đơn quầy.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filterStatus, isStaff],
  );

  useEffect(() => {
    if (!isStaff) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async (firstRun = false) => {
      if (cancelled) return;
      await fetchOrders(!firstRun);
      if (!cancelled) {
        timer = setTimeout(() => void poll(false), STAFF_POLL_MS);
      }
    };

    void poll(true);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchOrders, isStaff]);

  const handleAdvanceStatus = async (
    orderId: number,
    nextStatus: "PREPARING" | "READY" | "COMPLETED",
  ) => {
    setUpdatingId(orderId);
    setError(null);
    try {
      await updateOrderStatus(orderId, nextStatus);
      await fetchOrders(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái đơn hàng.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSwitchToStaffAccount = () => {
    clearSession();
    router.push("/login?next=/staff");
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header onOpenCart={() => router.push("/#cart")} activeTab="staff" />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3E8DA] px-3 py-1 text-xs font-extrabold text-[#9A521E]">
              <ChefHat className="h-3.5 w-3.5 text-[#E06D20]" />
              Màn hình điều phối quầy Barista
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#2B1B12] sm:text-3xl">
              Quầy pha chế & Điều phối đơn hàng
            </h1>
          </div>

          {isStaff && (
            <div className="flex items-center gap-3 self-start sm:self-auto">
              {lastUpdated && (
                <span
                  data-testid="staff-poll-indicator"
                  className="text-xs text-[#786354]"
                >
                  Tự làm mới 5s ·{" "}
                  {new Date(lastUpdated).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              )}
              <button
                type="button"
                onClick={() => void fetchOrders(false)}
                disabled={refreshing}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#DED2C3] bg-white px-4 py-2 text-xs font-bold text-[#3D291D] shadow-2xs transition hover:border-[#E06D20] hover:text-[#E06D20] disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin text-[#E06D20]" : ""}`}
                />
                Làm mới
              </button>
            </div>
          )}
        </div>

        {/* Trường hợp 1: Chưa đăng nhập */}
        {!user && (
          <div
            data-testid="staff-unauthenticated"
            className="rounded-3xl border border-[#EAE0D2] bg-white p-8 text-center shadow-sm"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF3EB] text-[#E06D20]">
              <Coffee className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-[#2B1B12]">
              Khu vực dành riêng cho Nhân viên quầy
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#786354]">
              Vui lòng đăng nhập bằng tài khoản nhân viên (
              <code className="rounded bg-[#F5EFE6] px-1.5 py-0.5 font-mono text-xs font-bold text-[#2B1B12]">
                staff@brewlite.local
              </code>
              ) để xem và cập nhật trạng thái pha chế.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/login?next=/staff"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#E06D20] px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-950/15 transition hover:bg-[#C85A12]"
              >
                <LogIn className="h-4 w-4" />
                Đăng nhập nhân viên
              </Link>
              <Link
                href="/"
                className="inline-flex min-h-[44px] items-center rounded-full border border-[#DED2C3] bg-white px-5 py-2.5 text-sm font-bold text-[#3D291D] transition hover:bg-[#FAF4ED]"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        )}

        {/* Trường hợp 2: Đã đăng nhập nhưng là CUSTOMER (FR-17, FR-33: chặn 403) */}
        {user && user.role !== "STAFF" && (
          <div
            data-testid="staff-forbidden"
            className="rounded-3xl border border-red-200 bg-red-50/70 p-8 text-center shadow-sm"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-red-950">
              Không đủ quyền truy cập (403 Forbidden)
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-red-800">
              Bạn đang đăng nhập với tài khoản khách hàng{" "}
              <span className="font-bold">{user.email}</span>. Chỉ tài khoản có
              vai trò <span className="font-bold">STAFF</span> mới được phép điều
              phối đơn hàng tại quầy.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={handleSwitchToStaffAccount}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#E06D20] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#C85A12]"
              >
                <LogIn className="h-4 w-4" />
                Đổi sang tài khoản Nhân viên
              </button>
              <Link
                href="/orders"
                className="inline-flex min-h-[44px] items-center rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-900 transition hover:bg-red-50"
              >
                Xem đơn hàng của tôi
              </Link>
            </div>
          </div>
        )}

        {/* Trường hợp 3: Đã đăng nhập role STAFF */}
        {isStaff && (
          <>
            {/* Bộ lọc trạng thái đơn (FR-33) */}
            <div
              role="tablist"
              aria-label="Lọc đơn theo trạng thái"
              className="mb-6 flex flex-wrap gap-2"
            >
              {FILTER_TABS.map((tab) => {
                const active = filterStatus === tab.value;
                return (
                  <button
                    key={tab.label}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setLoading(true);
                      setFilterStatus(tab.value);
                    }}
                    className={`min-h-[44px] rounded-full px-4 py-2 text-xs font-extrabold transition ${
                      active
                        ? "bg-[#2B1B12] text-white shadow-sm"
                        : "border border-[#DED2C3] bg-white text-[#4A3528] hover:border-[#E06D20] hover:text-[#E06D20]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800"
              >
                {error}
              </div>
            )}

            {loading ? (
              <div
                data-testid="staff-loading"
                className="rounded-3xl border border-[#EAE0D2] bg-white p-12 text-center shadow-sm"
              >
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#E06D20]" />
                <p className="mt-3 text-sm font-medium text-[#786354]">
                  Đang tải danh sách đơn hàng tại quầy...
                </p>
              </div>
            ) : orders.length === 0 ? (
              <div
                data-testid="staff-empty"
                className="rounded-3xl border border-[#EAE0D2] bg-white p-12 text-center shadow-sm"
              >
                <Sparkles className="mx-auto h-10 w-10 text-[#C9B8A6]" />
                <h2 className="mt-3 text-lg font-extrabold text-[#2B1B12]">
                  Chưa có đơn hàng nào ở trạng thái này
                </h2>
                <p className="mt-1 text-sm text-[#786354]">
                  Khi khách hàng thanh toán thành công, đơn mới sẽ tự động xuất
                  hiện tại đây.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] ?? STATUS_META.PAID;
                  const isUpdating = updatingId === order.id;

                  return (
                    <article
                      key={order.id}
                      data-testid={`staff-order-card-${order.id}`}
                      className="flex flex-col justify-between rounded-3xl border border-[#EAE0D2] bg-white p-6 shadow-xs transition hover:shadow-md"
                    >
                      <div>
                        {/* Card Top Row */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F2ECE4] pb-4">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg font-black text-[#2B1B12]">
                                Đơn #{order.id}
                              </span>
                              <span
                                data-testid={`staff-order-status-${order.id}`}
                                className={`rounded-full border px-3 py-1 text-xs font-extrabold ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#786354]">
                              <span className="font-bold text-[#3D291D]">
                                Khách: {order.user?.fullName || `KH #${order.userId}`}
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {formatDateTime(order.createdAt)}
                              </span>
                            </div>
                          </div>

                          <Link
                            href={`/orders/${order.id}`}
                            className="rounded-xl border border-[#EAE0D2] px-3 py-1.5 text-xs font-bold text-[#786354] transition hover:border-[#E06D20] hover:text-[#E06D20]"
                          >
                            Chi tiết
                          </Link>
                        </div>

                        {/* Danh sách món cần pha chế */}
                        <div className="my-4 space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-start justify-between gap-3 rounded-2xl bg-[#FAF8F5] px-3.5 py-2.5 text-sm"
                            >
                              <div>
                                <div className="font-bold text-[#2B1B12]">
                                  {item.productName}{" "}
                                  <span className="text-[#E06D20]">
                                    × {item.quantity}
                                  </span>
                                </div>
                                <div className="mt-0.5 text-xs text-[#786354]">
                                  Size {item.sizeName}
                                  {item.toppings?.length
                                    ? ` · ${item.toppings.map((t) => t.name).join(", ")}`
                                    : ""}
                                </div>
                              </div>
                              <div className="font-bold text-[#3D291D]">
                                {formatVnd(item.lineTotal)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer: Tổng tiền & Nút chuyển trạng thái tuần tự (FR-34) */}
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#F2ECE4] pt-4">
                        <div>
                          <span className="text-xs text-[#786354]">Tổng cộng</span>
                          <div className="text-base font-black text-[#9A521E]">
                            {formatVnd(order.totalAmount)}
                          </div>
                        </div>

                        {meta.nextStatus ? (
                          <button
                            type="button"
                            data-testid={`staff-advance-btn-${order.id}`}
                            disabled={isUpdating}
                            onClick={() =>
                              void handleAdvanceStatus(order.id, meta.nextStatus!)
                            }
                            className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold transition active:scale-95 disabled:opacity-60 ${meta.actionClass}`}
                          >
                            {isUpdating ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang cập nhật...
                              </>
                            ) : (
                              meta.actionLabel
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Đã hoàn tất giao khách
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

