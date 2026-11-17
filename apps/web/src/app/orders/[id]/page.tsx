import { Suspense } from "react";
import OrderTracking from "@/components/OrderTracking";

/**
 * /orders/[id] – trang theo dõi đơn (FR-31). Bật cacheComponents nên params là dữ liệu lúc chạy,
 * phải đọc bên trong Suspense.
 */
export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-neutral-500">Đang tải đơn hàng...</p>}>
      {params.then(({ id }) => (
        <OrderTracking orderId={Number(id)} />
      ))}
    </Suspense>
  );
}
