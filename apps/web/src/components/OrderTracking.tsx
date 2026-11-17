"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import Header from "@/components/Header";
import { getToken } from "@/utils/auth";
import { getOrderDetail, OrderDetail } from "@/utils/orders-api";

/** Chu kỳ hỏi lại trạng thái đơn. FR-31 yêu cầu tối đa 10 giây/lần. */
export const TRACKING_POLL_MS = 5000;

/** Đơn đã kết thúc thì không cần hỏi lại nữa */
const FINAL_STATUSES = ["COMPLETED", "CANCELLED"];

/** Các bước quầy xử lý đơn sau khi thanh toán (FR-34: PAID → PREPARING → READY → COMPLETED) */
const STEPS = [
  { status: "PAID", label: "Đã thanh toán", hint: "Quầy đã nhận đơn của bạn" },
  { status: "PREPARING", label: "Đang pha chế", hint: "Nhân viên đang pha món" },
  { status: "READY", label: "Sẵn sàng nhận", hint: "Mời bạn ra quầy nhận món" },
  { status: "COMPLETED", label: "Hoàn thành", hint: "Bạn đã nhận món" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAYMENT_FAILED: "Thanh toán thất bại",
  PAID: "Đã thanh toán",
  PREPARING: "Đang pha chế",
  READY: "Sẵn sàng nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const formatTime = (value: string | Date) =>
  new Date(value).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

/**
 * Trang theo dõi đơn của khách (FR-31, UC-08): hiện các bước pha chế và tự hỏi lại
 * GET /orders/:id mỗi TRACKING_POLL_MS cho đến khi đơn hoàn thành hoặc bị hủy.
 */
export default function OrderTracking({ orderId }: { orderId: number }) {
  const router = useRouter();
  const validId = Number.isInteger(orderId) && orderId > 0;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    if (!validId) return;
    let stopped = false;
    let loaded = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        if (!getToken()) throw new Error("Vui lòng đăng nhập để theo dõi đơn hàng.");
        const data = await getOrderDetail(orderId);
        if (stopped) return;
        loaded = true;
        setOrder(data);
        setError("");
        setLastChecked(new Date());
        if (FINAL_STATUSES.includes(data.status)) return;
      } catch (err) {
        if (stopped) return;
        setError(err instanceof Error ? err.message : "Không thể tải đơn hàng.");
        // Lần đầu đã lỗi (chưa đăng nhập, không phải đơn của mình...) thì dừng; mất mạng giữa chừng thì thử lại.
        if (!loaded) return;
      }
      timer = setTimeout(load, TRACKING_POLL_MS);
    };

    void load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId, validId]);

  const stepIndex = order ? STEPS.findIndex((s) => s.status === order.status) : -1;
  const reachedAt = (status: string) =>
    order?.statusHistory?.filter((h) => h.toStatus === status).pop()?.changedAt;
  const polling = order !== null && !FINAL_STATUSES.includes(order.status);

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header onOpenCart={() => router.push("/#cart")} activeTab="history" />
      <main className="px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Link href="/orders" className="text-sm text-amber-800 hover:underline">
            ← Lịch sử đơn hàng
          </Link>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              Theo dõi đơn hàng #{validId ? orderId : "?"}
            </h1>
            {order && (
              <span
                data-testid="tracking-status"
                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            )}
          </div>

          {!validId && (
            <p role="alert" className="mt-8 rounded-xl bg-red-50 p-5 text-red-700">
              Mã đơn hàng không hợp lệ.
            </p>
          )}

          {validId && !order && !error && (
            <p className="mt-8 text-neutral-500">Đang tải đơn hàng...</p>
          )}

          {error && (
            <div role="alert" data-testid="tracking-error" className="mt-8 rounded-xl bg-red-50 p-5 text-sm text-red-700">
              {order ? `Chưa cập nhật được trạng thái mới (${error}). Đang thử lại...` : error}
              {!order && (
                <div className="mt-3 flex gap-4">
                  <Link href="/orders" className="font-semibold underline">
                    Về lịch sử đơn hàng
                  </Link>
                  {!getToken() && (
                    <Link href="/login" className="font-semibold underline">
                      Đăng nhập
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {order && (
            <>
              {order.status === "READY" && (
                <div
                  role="status"
                  data-testid="ready-banner"
                  className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800"
                >
                  <p className="font-black">Món của bạn đã sẵn sàng!</p>
                  <p className="mt-1 text-sm">Mời bạn ra quầy nhận món.</p>
                </div>
              )}

              {(order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_FAILED") && (
                <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                  Đơn chưa được thanh toán nên quầy chưa pha chế. Bạn có thể hủy đơn ở trang lịch sử đơn hàng.
                </p>
              )}

              {order.status === "CANCELLED" && (
                <p className="mt-6 rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-700">
                  Đơn hàng đã bị hủy.
                </p>
              )}

              {stepIndex >= 0 && (
                <ol data-testid="tracking-steps" className="mt-6 space-y-0 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  {STEPS.map((step, index) => {
                    const done = index < stepIndex || order.status === "COMPLETED";
                    const current = index === stepIndex && !done;
                    const at = reachedAt(step.status);
                    return (
                      <li
                        key={step.status}
                        data-testid={`track-step-${step.status}`}
                        aria-current={current ? "step" : undefined}
                        className="flex gap-4"
                      >
                        <div className="flex flex-col items-center">
                          <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                              done
                                ? "bg-[#E06D20] text-white"
                                : current
                                  ? "border-2 border-[#E06D20] bg-white text-[#E06D20]"
                                  : "border-2 border-neutral-200 bg-white text-neutral-400"
                            }`}
                          >
                            {done ? <Check className="h-4 w-4" /> : index + 1}
                          </span>
                          {index < STEPS.length - 1 && (
                            <span className={`my-1 w-0.5 flex-1 ${index < stepIndex ? "bg-[#E06D20]" : "bg-neutral-200"}`} />
                          )}
                        </div>
                        <div className="pb-6">
                          <p className={`text-sm font-bold ${index <= stepIndex ? "text-neutral-900" : "text-neutral-400"}`}>
                            {step.label}
                            {at && index <= stepIndex && (
                              <span className="ml-2 text-xs font-normal text-neutral-500">{formatTime(at)}</span>
                            )}
                          </p>
                          {current && <p className="mt-0.5 text-xs text-neutral-500">{step.hint}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {polling && lastChecked && (
                <p data-testid="tracking-poll-note" className="mt-3 text-xs text-neutral-500">
                  Trang tự cập nhật mỗi {TRACKING_POLL_MS / 1000} giây · Cập nhật lúc {formatTime(lastChecked)}
                </p>
              )}

              <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-xs text-neutral-500">
                  Đặt lúc {new Date(order.createdAt).toLocaleString("vi-VN")}
                </p>
                <div className="space-y-3 py-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">
                          {item.productName} × {item.quantity}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          Size {item.sizeName}
                          {item.toppings?.length ? ` · ${item.toppings.map((t) => t.name).join(", ")}` : ""}
                        </p>
                      </div>
                      <p className="whitespace-nowrap text-sm text-neutral-700">{formatPrice(item.lineTotal)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-4">
                  <span className="font-semibold text-neutral-700">Tổng cộng</span>
                  <span className="font-bold text-amber-900">{formatPrice(order.totalAmount)}</span>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
