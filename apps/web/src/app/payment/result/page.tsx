
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearCart } from "@/utils/cart";
import { getApiBaseUrl } from "@/services/products";

interface PaymentResult {
  success: boolean;
  orderId?: number;
  message?: string;
}

export default function PaymentResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const verifyPayment = async () => {
      try {
        // Gửi nguyên query string VNPay về backend để xác thực chữ ký
        const queryString = window.location.search;

        if (!queryString) {
          throw new Error("Không tìm thấy thông tin kết quả thanh toán.");
        }

        const response = await fetch(
          `${getApiBaseUrl()}/payments/vnpay/return${queryString}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        const data = (await response.json()) as PaymentResult & {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(
            data.message || "Không thể xác minh kết quả thanh toán."
          );
        }

        if (!active) return;

        setResult(data);

        if (data.success) {
          // Chỉ xóa giỏ hàng sau khi backend xác nhận thanh toán thành công
          clearCart();
          sessionStorage.removeItem("brewlite_pending_payment");
        }
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi xác minh thanh toán."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    verifyPayment();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#EAE0D2] p-8 text-center">
        {loading ? (
          <>
            <div className="w-14 h-14 border-4 border-[#F4DEC9] border-t-[#E06D20] rounded-full animate-spin mx-auto mb-5" />
            <h1 className="text-xl font-black text-[#2B1B12]">
              Đang xác minh thanh toán
            </h1>
            <p className="text-sm text-[#786354] mt-2">
              Vui lòng chờ trong giây lát...
            </p>
          </>
        ) : result?.success ? (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 text-3xl">
              ✓
            </div>
            <h1 className="text-2xl font-black text-[#2B1B12]">
              Thanh toán thành công!
            </h1>
            <p className="text-sm text-[#786354] mt-3">
              Đơn hàng của bạn đã được thanh toán và xác nhận.
            </p>
            {result.orderId && (
              <p className="text-sm font-bold text-[#E06D20] mt-3">
                Mã đơn hàng: #{result.orderId}
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="w-full mt-7 py-3 rounded-full bg-[#E06D20] hover:bg-[#C95E16] text-white font-bold transition"
            >
              Xem lịch sử đơn hàng
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-5 text-3xl">
              !
            </div>
            <h1 className="text-2xl font-black text-[#2B1B12]">
              Thanh toán chưa thành công
            </h1>
            <p className="text-sm text-red-600 mt-3">
              {error || result?.message || "Giao dịch chưa được xác nhận."}
            </p>
            {result?.orderId && (
              <p className="text-sm font-bold text-[#786354] mt-3">
                Mã đơn hàng: #{result.orderId}
              </p>
            )}
            <p className="text-xs text-[#786354] mt-3">
              Giỏ hàng được giữ lại để bạn có thể tiếp tục xử lý đơn hàng.
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full mt-7 py-3 rounded-full bg-[#E06D20] hover:bg-[#C95E16] text-white font-bold transition"
            >
              Quay lại thực đơn
            </button>
          </>
        )}
      </div>
    </main>
  );
}
