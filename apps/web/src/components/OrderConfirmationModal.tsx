
"use client";

import { useState } from "react";
import { CartItem, Topping } from "@/types/product";
import { clearCart } from "@/utils/cart";
import { getStoredUser } from "@/utils/auth";
import {
  X,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import {
  createOrder,
  createVnpayPayment,
} from "@/utils/orders-api";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
}

interface PendingPayment {
  orderId: number;
  idempotencyKey: string;
  itemsSignature: string;
}

const PENDING_PAYMENT_KEY = "brewlite_pending_payment";

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  items,
  totalAmount,
}: OrderConfirmationModalProps) {
  const [customerName, setCustomerName] = useState<string>(() => {
    return getStoredUser()?.fullName || "Khách hàng";
  });
  const [pickupNote, setPickupNote] = useState<string>("Uống tại bàn");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      setErrorMessage("Giỏ hàng đang trống.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Chuyển dữ liệu giỏ hàng thành DTO backend yêu cầu
      const orderItems = items.map((item) => {
        const productId = Number(item.productId);
        const sizeId = Number(item.sizeId);
        const quantity = Number(item.qty);
        const toppingIds = (item.toppings || []).map(
          (t: Topping) => Number(t.id)
        );

        if (
          !Number.isInteger(productId) ||
          productId <= 0 ||
          !Number.isInteger(sizeId) ||
          sizeId <= 0 ||
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 20 ||
          toppingIds.some(
            (id) => !Number.isInteger(id) || id <= 0
          )
        ) {
          throw new Error(
            `Thông tin món "${item.name}" không hợp lệ. Vui lòng chọn lại món từ thực đơn.`
          );
        }

        return {
          productId,
          sizeId,
          toppingIds,
          quantity,
        };
      });

      const itemsSignature = JSON.stringify(orderItems);

      // Tìm đơn đã tạo trước đó nhưng chưa thanh toán xong
      let pending: PendingPayment | null = null;

      try {
        const saved = sessionStorage.getItem(PENDING_PAYMENT_KEY);

        if (saved) {
          const parsed = JSON.parse(saved) as PendingPayment;

          if (
            parsed.orderId &&
            parsed.idempotencyKey &&
            parsed.itemsSignature === itemsSignature
          ) {
            pending = parsed;
          }
        }
      } catch {
        sessionStorage.removeItem(PENDING_PAYMENT_KEY);
      }

      // Chỉ tạo đơn mới nếu chưa có đơn phù hợp để thanh toán lại
      if (!pending) {
        const order = await createOrder({
          items: orderItems,
        });

        pending = {
          orderId: order.id,
          idempotencyKey:
            typeof crypto !== "undefined" &&
            typeof crypto.randomUUID === "function"
              ? crypto.randomUUID()
              : `brewlite-${Date.now()}-${Math.random()
                  .toString(36)
                  .slice(2)}`,
          itemsSignature,
        };

        // Lưu lại để nếu tạo link thanh toán lỗi thì có thể thử lại
        sessionStorage.setItem(
          PENDING_PAYMENT_KEY,
          JSON.stringify(pending)
        );
      }

      // Tạo hoặc lấy lại link thanh toán VNPay
      const payment = await createVnpayPayment(
        pending.orderId,
        pending.idempotencyKey
      );

      if (!payment.paymentUrl) {
        throw new Error(
          "Không nhận được đường dẫn thanh toán VNPay. Vui lòng thử lại."
        );
      }

      // Chuyển người dùng sang VNPay
      window.location.assign(payment.paymentUrl);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại."
      );
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-[#2B1B12]/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#EAE0D2] overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#EAE0D2] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="order-modal-title"
                className="text-lg font-black text-[#2B1B12] uppercase tracking-tight"
              >
                Xác nhận đơn hàng
              </h2>
              <p className="text-xs text-[#786354]">
                Kiểm tra món trước khi chuyển đến thanh toán
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng popup xác nhận"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#786354] hover:bg-[#FAF4ED] transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <div>
            <h3 className="text-xs font-bold text-[#786354] uppercase tracking-wider mb-2.5">
              Món trong đơn ({items.reduce((s, i) => s + i.qty, 0)} món)
            </h3>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white border border-[#EAE0D2] flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[#2B1B12] text-xs sm:text-sm truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FFF4EB] text-[#E06D20] font-bold">
                        Size {item.size}
                      </span>
                    </div>

                    {item.toppings && item.toppings.length > 0 && (
                      <p className="text-[11px] text-[#786354] truncate mt-0.5">
                        + {item.toppings.map((t) => t.name).join(", ")}
                      </p>
                    )}

                    {item.note && (
                      <p className="text-[11px] text-[#A66336] italic truncate">
                        Ghi chú: {item.note}
                      </p>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-[#786354]">
                      x{item.qty}
                    </p>
                    <p className="text-xs font-extrabold text-[#2B1B12]">
                      {formatPrice(item.totalPrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer information */}
          <div className="space-y-3 pt-2 border-t border-[#EAE0D2]">
            <div>
              <label
                htmlFor="order-customer-name"
                className="block text-xs font-bold text-[#4A3528] mb-1"
              >
                Tên người nhận món
              </label>
              <input
                id="order-customer-name"
                data-testid="order-customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nhập tên của bạn"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] bg-white text-xs font-medium text-[#2B1B12] focus:outline-hidden focus:border-[#E06D20] transition"
              />
            </div>

            <div>
              <label
                htmlFor="order-pickup-note"
                className="block text-xs font-bold text-[#4A3528] mb-1"
              >
                Hình thức nhận món / Vị trí bàn
              </label>
              <input
                id="order-pickup-note"
                data-testid="order-pickup-note"
                type="text"
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="Ví dụ: Bàn 04, Mang về..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] bg-white text-xs font-medium text-[#2B1B12] focus:outline-hidden focus:border-[#E06D20] transition"
              />
            </div>
          </div>

          {/* Note about fields not accepted by current backend */}
          <p className="text-[11px] text-[#786354]">
            Thông tin tên người nhận và vị trí bàn hiện chỉ dùng để hiển thị;
            API backend hiện chưa lưu hai thông tin này.
          </p>

          {/* Total */}
          <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#F4DEC9] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#786354]">
                Tổng thanh toán (VNĐ)
              </p>
              <p className="text-[11px] text-[#A66336]">
                Thanh toán qua cổng VNPay
              </p>
            </div>
            <span
              data-testid="confirmation-total-amount"
              className="text-lg font-black text-[#E06D20]"
            >
              {formatPrice(totalAmount)}
            </span>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
            >
              {errorMessage}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-[#EAE0D2] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-full border border-[#D8CDC0] text-[#4A3528] hover:bg-[#FAF4ED] text-xs font-bold transition disabled:opacity-50"
          >
            Quay lại
          </button>

          <button
            type="button"
            disabled={isSubmitting || items.length === 0}
            onClick={handleConfirmOrder}
            data-testid="confirm-order-submit"
            className="flex-1 py-3 px-6 rounded-full bg-[#E06D20] hover:bg-[#C95E16] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-orange-950/20 flex items-center justify-center gap-2 transition active:scale-95"
          >
            {isSubmitting ? (
              <span>Đang xử lý đơn...</span>
            ) : (
              <>
                <span>Xác nhận & Thanh toán VNPay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
