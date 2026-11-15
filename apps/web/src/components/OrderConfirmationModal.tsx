
"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { CartItem, Topping } from "@/types/product";
import { clearCart } from "@/utils/cart";
import { clearSession, getStoredUser, isSessionActive, subscribeAuth } from "@/utils/auth";
import {
Lock,
CheckCircle2,
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
const [isSuccess, setIsSuccess] = useState<boolean>(false);
const [orderCode, setOrderCode] = useState<string>("");

const user = useSyncExternalStore(subscribeAuth, getStoredUser, () => null);

// T├¬n ng╞░ß╗¥i nhß║¡n mß║╖c ─æß╗ïnh l├á t├¬n t├ái khoß║ún ─æang ─æ─âng nhß║¡p.
const [nameInput, setNameInput] = useState<string | null>(null);
const customerName = nameInput ?? user?.fullName ?? "Kh├ích h├áng";

const [pickupNote, setPickupNote] = useState<string>("Uß╗æng tß║íi b├án");
const [paymentMethod, setPaymentMethod] =
  useState<MockPaymentMethod>("WALLET");

const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

// ─Éß║╖t h├áng bß║»t buß╗Öc phß║úi ─æ─âng nhß║¡p v├á phi├¬n c├▓n hiß╗çu lß╗▒c.
if (!user || !isSessionActive()) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-login-title"
      data-testid="order-login-required"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-[#2B1B12]/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-[#FAF7F2] rounded-3xl shadow-2xl border border-[#EAE0D2] p-8 text-center space-y-5 z-10">
        <div className="w-14 h-14 rounded-full bg-[#FFF4EB] text-[#E06D20] mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 id="order-login-title" className="text-lg font-black text-[#2B1B12]">
            Vui l├▓ng ─æ─âng nhß║¡p ─æß╗â ─æß║╖t h├áng
          </h2>
          <p className="text-xs text-[#786354]">
            Giß╗Å h├áng cß╗ºa bß║ín vß║½n ─æ╞░ß╗úc giß╗» nguy├¬n sau khi ─æ─âng nhß║¡p.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/login?next=%2F%23cart&reason=checkout"
            className="py-3 px-6 rounded-full bg-[#E06D20] hover:bg-[#C95E16] text-white font-extrabold text-sm shadow-md shadow-orange-950/20 transition active:scale-95"
          >
            ─É─âng nhß║¡p
          </Link>

          <Link
            href="/register?next=%2F%23cart&reason=checkout"
            className="py-3 px-6 rounded-full border border-[#D8CDC0] text-[#4A3528] hover:bg-[#FAF4ED] text-sm font-bold transition"
          >
            Tß║ío t├ái khoß║ún mß╗¢i
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-[#786354] hover:text-[#E06D20] transition py-1.5"
          >
            ─Éß╗â sau
          </button>
        </div>
      </div>
    </div>
  );
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const handleConfirmOrder = async () => {
  // Kiß╗âm tra phi├¬n ─æ─âng nhß║¡p c├▓n hiß╗çu lß╗▒c tr╞░ß╗¢c khi ─æß║╖t h├áng.
  if (!isSessionActive()) {
    clearSession();
    return;
  }

  if (items.length === 0) {
    setErrorMessage("Giß╗Å h├áng ─æang trß╗æng.");
    return;
  }

  if (successMessage) return;

  if (paymentMethod === "CARD" && !/^\d{16}$/.test(cardNumber)) {
    setErrorMessage("Sß╗æ thß║╗ phß║úi gß╗ôm ─æ├║ng 16 chß╗» sß╗æ.");
    return;
  }

  if (
    paymentMethod === "CARD" &&
    !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)
  ) {
    setErrorMessage("Hß║ín thß║╗ phß║úi c├│ dß║íng MM/YY.");
    return;
  }

  if (paymentMethod === "CARD") {
    const [month, year] = cardExpiry.split("/").map(Number);
    const expiryDate = new Date(2000 + year, month, 1);
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    if (expiryDate <= currentMonth) {
      setErrorMessage("Thß║╗ ─æ├ú hß║┐t hß║ín.");
      return;
    }
  }

  if (paymentMethod === "CARD" && !/^\d{3}$/.test(cardCvv)) {
    setErrorMessage("CVV phß║úi gß╗ôm ─æ├║ng 3 chß╗» sß╗æ.");
    return;
  }

  // Giß╗» nguy├¬n to├án bß╗Ö phß║ºn code c├▓n lß║íi cß╗ºa handleConfirmOrder
  // tß╗½ sau ─æoß║ín kiß╗âm tra CVV.
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
            `Th├┤ng tin m├│n "${item.name}" kh├┤ng hß╗úp lß╗ç. Vui l├▓ng chß╗ìn lß║íi m├│n.`,
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

        setSuccessOrderId(payment.orderId);
setSuccessMessage(payment.message);
      } else {
        // Thanh to├ín thß║Ñt bß║íi vß║½n l╞░u ─æ╞ín ─æß╗â kh├ích c├│ thß╗â thß╗¡ lß║íi.
        // Tß║ío key mß╗¢i ─æß╗â backend kh├┤ng trß║ú lß║íi kß║┐t quß║ú thß║Ñt bß║íi c┼⌐.
        const retryPayment: PendingPayment = {
          ...pending,
          idempotencyKey: createIdempotencyKey(),
        };

        sessionStorage.setItem(
          PENDING_PAYMENT_KEY,
          JSON.stringify(retryPayment),
        );

        setErrorMessage(
          payment.message || "Thanh to├ín thß║Ñt bß║íi. Vui l├▓ng thß╗¡ lß║íi.",
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "C├│ lß╗ùi xß║úy ra khi ─æß║╖t h├áng. Vui l├▓ng thß╗¡ lß║íi.",
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
                X├íc nhß║¡n ─æ╞ín h├áng
              </h2>
              <p className="text-xs text-[#786354]">
                Kiß╗âm tra m├│n tr╞░ß╗¢c khi thanh to├ín
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="─É├│ng popup x├íc nhß║¡n"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#786354] hover:bg-[#FAF4ED] transition disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          <div>
            <h3 className="text-xs font-bold text-[#786354] uppercase tracking-wider mb-2.5">
              M├│n trong ─æ╞ín ({items.reduce((s, i) => s + i.qty, 0)} m├│n)
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
                        Ghi ch├║: {item.note}
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
                T├¬n ng╞░ß╗¥i nhß║¡n m├│n
              </label>
              <input
                id="order-customer-name"
                data-testid="order-customer-name"
                type="text"
                value={customerName}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nhß║¡p t├¬n cß╗ºa bß║ín"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] bg-white text-xs font-medium text-[#2B1B12]"
              />
            </div>

            <div>
              <label
                htmlFor="order-pickup-note"
                className="block text-xs font-bold text-[#4A3528] mb-1"
              >
                H├¼nh thß╗⌐c nhß║¡n m├│n / Vß╗ï tr├¡ b├án
              </label>
              <input
                id="order-pickup-note"
                data-testid="order-pickup-note"
                type="text"
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                placeholder="V├¡ dß╗Ñ: B├án 04, Mang vß╗ü..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CDC0] bg-white text-xs font-medium text-[#2B1B12]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE0D2] space-y-3">
            <h3 className="text-xs font-bold text-[#786354] uppercase tracking-wider">
              Ph╞░╞íng thß╗⌐c thanh to├ín
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
                V├¡ ─æiß╗çn tß╗¡
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
                Thß║╗ ng├ón h├áng
              </button>
            </div>

            {paymentMethod === "WALLET" && (
              <p className="text-[11px] text-[#786354]">
                Thanh to├ín trß╗▒c tiß║┐p bß║▒ng sß╗æ d╞░ v├¡ cß╗ºa t├ái khoß║ún.
                Sß╗æ d╞░ mß║╖c ─æß╗ïnh cß╗ºa t├ái khoß║ún mß╗¢i l├á 200.000─æ.
              </p>
            )}

            {paymentMethod === "CARD" && (
              <div className="space-y-3 p-3 rounded-xl bg-white border border-[#EAE0D2]">
                <div>
                  <label
                    htmlFor="payment-card-number"
                    className="block text-xs font-bold text-[#4A3528] mb-1"
                  >
                    Sß╗æ thß║╗ (16 chß╗» sß╗æ)
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
                      Hß║ín thß║╗ (MM/YY)
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
                  <p>Thß║╗ test th├ánh c├┤ng: 4111111111111111</p>
                  <p>Thß║╗ test bß╗ï tß╗½ chß╗æi: 4000000000000002</p>
                  <p>Thß║╗ test kh├┤ng ─æß╗º tiß╗ün: 4000000000009995</p>
                  <p>Hß║ín thß║╗ phß║úi c├▓n hiß╗çu lß╗▒c. CVV c├│ thß╗â nhß║¡p 3 chß╗» sß╗æ bß║Ñt kß╗│.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#F4DEC9] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#786354]">
                Tß╗òng thanh to├ín (VND)
              </p>
              <p className="text-[11px] text-[#A66336]">
                Thanh to├ín m├┤ phß╗Ång
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
  <div
    role="status"
    className="p-4 rounded-2xl bg-green-50 border border-green-200 space-y-3"
  >
    <h3
      data-testid="order-success-title"
      className="text-lg font-black text-green-800"
    >
      ─Éß║╖t h├áng th├ánh c├┤ng!
    </h3>

    <p className="text-sm text-green-700">
      {successMessage}
    </p>

    <p
      data-testid="order-code"
      className="text-sm font-bold text-[#2B1B12]"
    >
      M├ú ─æ╞ín h├áng: #BL-{successOrderId}
    </p>

    <p
      data-testid="order-status-badge"
      className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold"
    >
      ─É├ú tiß║┐p nhß║¡n (Chß╗¥ pha chß║┐)
    </p>

    <p className="text-sm text-[#4A3528]">
      H├¼nh thß╗⌐c nhß║¡n m├│n: {pickupNote}
    </p>
  </div>
)}
        </div>

        <div className="p-4 sm:p-6 bg-white border-t border-[#EAE0D2] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            data-testid={successMessage ? "order-finish-button" : undefined}
            disabled={isSubmitting}
            className="px-5 py-3 rounded-full border border-[#D8CDC0] text-[#4A3528] hover:bg-[#FAF4ED] text-xs font-bold transition disabled:opacity-50"
          >
            {successMessage
  ? "Ho├án tß║Ñt & Tiß║┐p tß╗Ñc xem thß╗▒c ─æ╞ín"
  : "Quay lß║íi"}
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
                <span>─Éang xß╗¡ l├╜ ─æ╞ín...</span>
              ) : (
                <>
                  <span>X├íc nhß║¡n & Thanh to├ín</span>
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
