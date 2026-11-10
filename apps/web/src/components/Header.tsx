"use client";

import { useSyncExternalStore } from "react";
import { Coffee, ShoppingBag, User } from "lucide-react";
import { getStoredCart, subscribeCart } from "@/utils/cart";

interface HeaderProps {
  onOpenCart: () => void;
}

export default function Header({ onOpenCart }: HeaderProps) {
  const items = useSyncExternalStore(subscribeCart, getStoredCart, () => []);
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-12 h-12 rounded-2xl bg-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-800/20">
            <Coffee className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-2xl tracking-tight text-neutral-900">
                Brew<span className="text-amber-700">Lite</span>
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Coffee & Tea
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              Cà phê tươi mỗi ngày — Đặt món & Thanh toán
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-600">
          <a href="#menu" className="text-amber-800 font-bold transition">
            Thực đơn đồ uống
          </a>
          <a href="#about" className="hover:text-amber-800 transition">
            Về BrewLite
          </a>
          <a href="#order-history" className="hover:text-amber-800 transition">
            Lịch sử đơn hàng
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* User Profile / Login */}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition"
          >
            <User className="w-5 h-5 text-neutral-500" />
            <span className="hidden sm:inline">Tài khoản</span>
          </button>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium shadow-sm transition active:scale-95"
            aria-label="Xem giỏ hàng"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-semibold">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
