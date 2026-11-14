"use client";

import { useState } from "react";
import { CartItem, Topping } from "@/types/product";
import { clearCart } from "@/utils/cart";
import { getStoredUser } from "@/utils/auth";
import {
  CheckCircle2,
  X,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Clock,
  Coffee,
} from "lucide-react";

interface OrderConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  totalAmount: number;
}

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  items,
  totalAmount,
}: OrderConfirmationModalProps) {
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [orderCode, setOrderCode] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>(() => {
    return getStoredUser()?.fullName || "Khách hàng";
  });
  const [pickupNote, setPickupNote] = useState<string>("Uống tại bàn");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    // Sinh mã đơn hàng chuẩn BrewLite theo thời gian thực (FR-19, FR-29)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `BL-${randomSuffix}`;
    setOrderCode(code);

    setTimeout(() => {
      // Làm sạch giỏ hàng khi đặt hàng thành công theo đúng SRS FR-29
      clearCart();
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };

  const handleFinish = () => {
    setIsSuccess(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2B1B12]/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isSubmitting) handleFinish();
        }}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#EAE0D2] overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {!isSuccess ? (
          <>
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
                    Vui lòng kiểm tra lại món trước khi gửi đơn
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Đóng popup xác nhận"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#786354] hover:bg-[#FAF4ED] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Order Items Preview */}
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
                            + {item.toppings.map((t: Topping) => t.name).join(", ")}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-[11px] text-[#A66336] italic truncate">
                            Ghi chú: {item.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-[#786354]">x{item.qty}</p>
                        <p className="text-xs font-extrabold text-[#2B1B12]">
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Info Form */}
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
                    Hình thức nhận món / Vị trí bàn (FR-23)
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

              {/* Total Calculation */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#F4DEC9] flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#786354]">Tổng thanh toán (VNĐ)</p>
                  <p className="text-[11px] text-[#A66336]">Thanh toán trực tiếp tại quầy / nhận món</p>
                </div>
                <span
                  data-testid="confirmation-total-amount"
                  className="text-lg font-black text-[#E06D20]"
                >
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-6 bg-white border-t border-[#EAE0D2] flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-full border border-[#D8CDC0] text-[#4A3528] hover:bg-[#FAF4ED] text-xs font-bold transition"
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
                    <span>Xác nhận & Gửi đơn hàng</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Order Placed Success View (FR-29) */
          <div data-testid="order-success-card" className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF4EB] text-[#E06D20] text-xs font-extrabold">
                <Sparkles className="w-3.5 h-3.5" />
                BrewLite Order System
              </span>
              <h2
                data-testid="order-success-title"
                className="text-2xl font-black text-[#2B1B12] uppercase tracking-tight"
              >
                Đặt hàng thành công!
              </h2>
              <p className="text-xs sm:text-sm text-[#786354] max-w-sm mx-auto">
                Cảm ơn bạn <strong className="text-[#2B1B12]">{customerName}</strong>! Đơn hàng của bạn đã được chuyển đến quầy pha chế.
              </p>
            </div>

            {/* Order Code & Status Details */}
            <div className="p-4 rounded-2xl bg-white border border-[#EAE0D2] shadow-xs space-y-3 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-[#F0E6D8]">
                <span className="text-xs font-bold text-[#786354]">Mã đơn hàng:</span>
                <span
                  data-testid="order-code"
                  className="font-black text-[#E06D20] text-sm tracking-wider"
                >
                  #{orderCode}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F0E6D8]">
                <span className="text-xs font-bold text-[#786354]">Trạng thái:</span>
                <span
                  data-testid="order-status-badge"
                  className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                >
                  <Clock className="w-3 h-3" />
                  Đã tiếp nhận (Chờ pha chế)
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#F0E6D8]">
                <span className="text-xs font-bold text-[#786354]">Hình thức nhận:</span>
                <span className="text-xs font-bold text-[#2B1B12]">{pickupNote}</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-[#786354]">Tổng thanh toán:</span>
                <span className="text-base font-black text-[#2B1B12]">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleFinish}
                data-testid="order-finish-button"
                className="w-full py-3.5 px-6 rounded-full bg-[#E06D20] hover:bg-[#C95E16] text-white font-extrabold text-sm shadow-md shadow-orange-950/20 flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Coffee className="w-4 h-4" />
                <span>Hoàn tất & Tiếp tục xem thực đơn</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
