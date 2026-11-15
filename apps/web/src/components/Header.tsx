"use client";

import { useSyncExternalStore } from "react";
import { Coffee, ShoppingBag, User, Sparkles, Clock } from "lucide-react";
import { getEmptyCartSnapshot, getStoredCart, subscribeCart } from "@/utils/cart";

interface HeaderProps {
  onOpenCart: () => void;
}

export default function Header({ onOpenCart }: HeaderProps) {
  const items = useSyncExternalStore(
    subscribeCart,
    getStoredCart,
    getEmptyCartSnapshot
  );
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <header className="sticky top-0 z-40 bg-[#FAF6F0]/90 backdrop-blur-xl border-b border-[#EAE0D2] transition-all">
      {/* Top Subtle Info Bar */}
      <div className="hidden sm:block bg-[#2B1B12] text-[#E6D9C8] text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#E06D20]" />
            <span>Hạt Arabica & Robusta Cầu Đất rang mộc tươi mới mỗi ngày</span>
          </div>
          <div className="flex items-center gap-4 text-[#C9B8A6]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#E06D20]" /> Mở cửa: 07:00 – 22:00
            </span>
            <span>•</span>
            <span>Đặt món nhanh & Thanh toán không tiền mặt</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a href="#menu" className="flex items-center gap-3.5 cursor-pointer group">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E06D20] to-[#B84D0B] flex items-center justify-center text-white shadow-md shadow-orange-950/20 group-hover:scale-105 transition-transform duration-300">
            <Coffee className="w-6 h-6 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#FAF6F0] p-0.5 flex items-center justify-center">
              <span className="w-full h-full rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl tracking-tight text-[#2B1B12]">
                Brew<span className="text-[#E06D20]">Lite</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F2E8DA] text-[#9A521E] border border-[#E2D4C1]">
                Coffee & Tea
              </span>
            </div>
            <p className="text-[11px] text-[#786354] font-medium hidden sm:block">
              Cà phê tươi mỗi ngày — Đặt món & Thanh toán
            </p>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#F3ECE1] p-1.5 rounded-full border border-[#E6DBC9]">
          <a
            href="#menu"
            className="px-4 py-1.5 rounded-full bg-white text-[#E06D20] text-xs font-extrabold shadow-2xs transition"
          >
            Thực đơn đồ uống
          </a>
          <a
            href="#about"
            className="px-4 py-1.5 rounded-full text-xs font-bold text-[#4A3528] hover:text-[#E06D20] hover:bg-white/60 transition"
          >
            Về BrewLite
          </a>
          <a
            href="#order-history"
            className="px-4 py-1.5 rounded-full text-xs font-bold text-[#4A3528] hover:text-[#E06D20] hover:bg-white/60 transition"
          >
            Lịch sử đơn hàng
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* User Profile / Login */}
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-bold text-[#3D291D] bg-white border border-[#DED2C3] hover:border-[#E06D20] hover:text-[#E06D20] rounded-full transition shadow-2xs active:scale-95"
          >
            <User className="w-4 h-4 text-[#786354]" />
            <span className="hidden sm:inline">Tài khoản</span>
          </button>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="relative flex items-center gap-2.5 pl-4 pr-3.5 py-2.5 min-h-[44px] rounded-full bg-[#E06D20] hover:bg-[#C85A12] text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-950/20 transition active:scale-95"
            aria-label="Xem giỏ hàng"
          >
            <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            <span
              className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-extrabold flex items-center justify-center transition ${
                cartCount > 0
                  ? "bg-[#2B1B12] text-white border border-white/50 shadow-xs"
                  : "bg-white/25 text-white"
              }`}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
