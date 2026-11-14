
"use client";

import { useState } from "react";
import { CartItem, Topping } from "@/types/product";
import { clearCart } from "@/utils/cart";
import { getStoredUser } from "@/utils/auth";
import {
  X,
  ShoppingBag,
  ArrowRight,
  Wallet,
  CreditCard,
} from "lucide-react";
import {
  createOrder,
  createMockPayment,
  MockPaymentMethod,
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

function createIdempotencyKey() {
  return typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `brewlite-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function OrderConfirmationModal({
  isOpen,
  onClose,
  items,
  totalAmount,
}: OrderConfirmationModalProps) {
  const [customerName, setCustomerName] = useState(
    () => getStoredUser()?.fullName || "Khách hàng",
  );
  const [pickupNote, setPickupNote] = useState("Uống tại bàn");
  const [paymentMethod, setPaymentMethod] =
    useState<MockPaymentMethod>("WALLET");

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const handleConfirmOrder = async () => {
    if (items.length === 0) {
      setErrorMessage("Giỏ hàng đang trống.");
      return;
    }

    if (successMessage) return;

    if (
      paymentMethod === "CARD" &&
      !/^\d{16}$/.test(cardNumber)
    ) {
      setErrorMessage("Số thẻ phải gồm đúng 16 chữ số.");
      return;
    }

    if (
      paymentMethod === "CARD" &&
      !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)
    ) {
      setErrorMessage("Hạn thẻ phải có dạng MM/YY.");
      return;
    }

    if (paymentMethod === "CARD") {
      const [month, year] = cardExpiry.split("/").map(Number);
      const expiryDate = new Date(2000 + year, month, 1);
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      if (expiryDate <= currentMonth) {
        setErrorMessage("Thẻ đã hết hạn.");
        return;
      }
    }
    if (
      paymentMethod === "CARD" &&
      !/^\d{3}$/.test(cardCvv)
    ) {
      setErrorMessage("CVV phải gồm đúng 3 chữ số.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const orderItems = items.map((item) => {
        const productId = Number(item.productId);
        const sizeId = Number(item.sizeId);
        const quantity = Number(item.qty);

        const toppingIds = (item.toppings || []).map(
          (t: Topping) => Number(t.id),
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
            (id) => !Number.isInteger(id) || id <= 0,
          )
        ) {
          throw new Error(
            `Thông tin món "${item.name}" không hợp lệ. Vui lòng chọn lại món.`,
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

      let pending: PendingPayment | null = null;

      try {
        const saved = sessionStorage.getItem(
          PENDING_PAYMENT_KEY,
        );

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

      if (!pending) {
        const order = await createOrder({
          items: orderItems,
        });

        pending = {
          orderId: order.id,
          idempotencyKey: createIdempotencyKey(),
          itemsSignature,
        };

        sessionStorage.setItem(
          PENDING_PAYMENT_KEY,
          JSON.stringify(pending),
        );
      }

      const payment = await createMockPayment(
        pending.orderId,
        paymentMethod,
        pending.idempotencyKey,
        paymentMethod === "CARD"
          ? {
              number: cardNumber,
              expiry: cardExpiry,
              cvv: cardCvv,
            }
          : undefined,
      );

      if (payment.paymentStatus === "SUCCESS") {
        sessionStorage.removeItem(PENDING_PAYMENT_KEY);
        clearCart();

        setSuccessMessage(
          `${payment.message}. Mã đơn hàng: #${payment.orderId}`,
        );
      } else {
        // Thanh toán thất bại vẫn lưu đơn để khách có thể thử lại.
        // Tạo key mới để backend không trả lại kết quả thất bại cũ.
        const retryPayment: PendingPayment = {
          ...pending,
          idempotencyKey: createIdempotencyKey(),
        };

        sessionStorage.setItem(
          PENDING_PAYMENT_KEY,
          JSON.stringify(retryPayment),
        );

        setErrorMessage(
          payment.message || "Thanh toán thất bại. Vui lòng thử lại.",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại.",
      );
    } finally {
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
        className="fixed inset-0 bg-[#2B1B12]/60 backdrop-blur-xs"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-lg bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#EAE0D2] overflow-hidden z-10 flex flex-col max-h-[90vh]">
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
                Kiểm tra món trước khi thanh toán
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

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <div>
            <h3 className="text-xs font-bold text-[#786354] uppercase tracking-wider mb-2.5">
              Món trong đơn ({items.reduce((s, i) => s + i.qty, 0)} món)
            </h3>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-white border border-[#EAE0D2] flex items-center justify-between gap-3"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] bg-white text-xs font-medium text-[#2B1B12]"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] bg-white text-xs font-medium text-[#2B1B12]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE0D2] space-y-3">
            <h3 className="text-xs font-bold text-[#786354] uppercase tracking-wider">
              Phương thức thanh toán
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("WALLET")}
                disabled={isSubmitting || !!successMessage}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition ${
                  paymentMethod === "WALLET"
                    ? "border-[#E06D20] bg-[#FFF4EB] text-[#C95E16]"
                    : "border-[#D8CDC0] bg-white text-[#786354]"
                }`}
              >
                <Wallet className="w-4 h-4" />
                Ví điện tử
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CARD")}
                disabled={isSubmitting || !!successMessage}
                className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition ${
                  paymentMethod === "CARD"
                    ? "border-[#E06D20] bg-[#FFF4EB] text-[#C95E16]"
                    : "border-[#D8CDC0] bg-white text-[#786354]"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Thẻ ngân hàng
              </button>
            </div>

            {paymentMethod === "WALLET" && (
              <p className="text-[11px] text-[#786354]">
                Thanh toán trực tiếp bằng số dư ví của tài khoản.
                Số dư mặc định của tài khoản mới là 200.000đ.
              </p>
            )}

            {paymentMethod === "CARD" && (
              <div className="space-y-3 p-3 rounded-xl bg-white border border-[#EAE0D2]">
                <div>
                  <label
                    htmlFor="payment-card-number"
                    className="block text-xs font-bold text-[#4A3528] mb-1"
                  >
                    Số thẻ (16 chữ số)
                  </label>
                  <input
                    id="payment-card-number"
                    data-testid="payment-card-number"
                    inputMode="numeric"
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) =>
                      setCardNumber(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="4111111111111111"
                    disabled={isSubmitting || !!successMessage}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="payment-card-expiry"
                      className="block text-xs font-bold text-[#4A3528] mb-1"
                    >
                      Hạn thẻ (MM/YY)
                    </label>
                    <input
                      id="payment-card-expiry"
                      data-testid="payment-card-expiry"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length > 2) {
                          value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
                        }
                        setCardExpiry(value);
                      }}
                      placeholder="12/30"
                      disabled={isSubmitting || !!successMessage}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="payment-card-cvv"
                      className="block text-xs font-bold text-[#4A3528] mb-1"
                    >
                      CVV
                    </label>
                    <input
                      id="payment-card-cvv"
                      data-testid="payment-card-cvv"
                      type="password"
                      inputMode="numeric"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="123"
                      disabled={isSubmitting || !!successMessage}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] text-xs"
                    />
                  </div>
                </div>

                <div className="text-[10px] text-[#786354] space-y-1">
                  <p>Thẻ test thành công: 4111111111111111</p>
                  <p>Thẻ test bị từ chối: 4000000000000002</p>
                  <p>Thẻ test không đủ tiền: 4000000000009995</p>
                  <p>Hạn thẻ phải còn hiệu lực. CVV có thể nhập 3 chữ số bất kỳ.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#F4DEC9] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#786354]">
                Tổng thanh toán (VND)
              </p>
              <p className="text-[11px] text-[#A66336]">
                Thanh toán mô phỏng
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

          {successMessage && (
            <p
              role="status"
              className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-bold"
            >
              {successMessage}
            </p>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-white border-t border-[#EAE0D2] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-full border border-[#D8CDC0] text-[#4A3528] hover:bg-[#FAF4ED] text-xs font-bold transition disabled:opacity-50"
          >
            {successMessage ? "Đóng" : "Quay lại"}
          </button>

          {!successMessage && (
            <button
              type="button"
              disabled={isSubmitting || items.length === 0}
              onClick={handleConfirmOrder}
              data-testid="confirm-order-submit"
              className="flex-1 py-3 px-6 rounded-full bg-[#E06D20] hover:bg-[#C95E16] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? (
                <span>Đang xử lý đơn...</span>
              ) : (
                <>
                  <span>Xác nhận & Thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
