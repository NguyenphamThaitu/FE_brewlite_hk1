"use client";

import { useSyncExternalStore } from "react";
import { getEmptyCartSnapshot, getStoredCart, subscribeCart, updateCartQty, removeFromCart, clearCart } from "@/utils/cart";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout?: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const items = useSyncExternalStore(
    subscribeCart,
    getStoredCart,
    getEmptyCartSnapshot
  );

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-[#EFE7DC] bg-[#FAF7F2] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#E06D20]" />
              <h2 className="text-xl font-bold text-[#2B1B12]">Giỏ hàng của bạn</h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F3EDE2] text-[#8C5325]">
                {items.reduce((acc, i) => acc + i.qty, 0)} món
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white border border-[#E5DACD] hover:bg-[#FAF5EE] flex items-center justify-center text-[#4A3528] transition"
              aria-label="Đóng giỏ hàng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-[#EFE7DC]">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-[#FAF5EE] flex items-center justify-center text-[#E06D20]">
                  <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#2B1B12]">
                    Giỏ hàng đang trống
                  </h3>
                  <p className="text-xs text-[#786354] max-w-xs">
                    Hãy dạo quanh thực đơn và chọn cho mình một ly đồ uống thơm ngon nhé!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#E06D20] text-white font-bold text-xs hover:bg-[#C95E16] shadow-md shadow-orange-950/15 transition"
                >
                  Xem thực đơn ngay
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover bg-[#FAF5EE] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-[#2B1B12] truncate">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-[#9C8A7B] hover:text-red-600 p-1 transition"
                        title="Xóa món"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-[#E06D20] font-bold mt-0.5">
                      Size {item.size}
                      {item.toppings.length > 0 &&
                        ` • ${item.toppings.map((t) => t.name).join(", ")}`}
                    </p>

                    {item.note && (
                      <p className="text-xs text-[#786354] italic mt-0.5">
                        Ghi chú: {item.note}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      {/* Qty Controller */}
                      <div className="flex items-center border border-[#E5DACD] rounded-full p-0.5 bg-[#FAF7F2]">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.qty - 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[#4A3528] hover:bg-white transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-[#2B1B12]">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, item.qty + 1)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[#4A3528] hover:bg-white transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-[#2B1B12]">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 bg-[#FAF7F2] border-t border-[#EFE7DC] space-y-4">
              <div className="flex items-center justify-between text-xs text-[#786354]">
                <span>Tạm tính hàng ({items.reduce((s, i) => s + i.qty, 0)} món)</span>
                <span className="font-bold text-[#2B1B12]">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-base font-extrabold text-[#2B1B12]">
                <span>Tổng thanh toán</span>
                <span className="text-xl text-[#E06D20]">
                  {formatPrice(totalAmount)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-3.5 py-3 rounded-full border border-[#D8CDC0] text-[#4A3528] hover:bg-[#FAF4ED] text-xs font-bold transition"
                  title="Xóa hết giỏ hàng"
                >
                  Xóa hết
                </button>
                <button
                  type="button"
                  data-testid="cart-checkout-button"
                  onClick={() => {
                    if (onCheckout) {
                      onCheckout();
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-[#E06D20] hover:bg-[#C95E16] text-white font-bold shadow-md shadow-orange-950/15 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <span>Đặt hàng & Thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
