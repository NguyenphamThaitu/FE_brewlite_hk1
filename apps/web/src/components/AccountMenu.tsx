"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ChevronDown, Coffee, LogIn, LogOut, User, UserPlus } from "lucide-react";
import { clearSession, getStoredUser, isSessionActive, subscribeAuth, updateStoredUser } from "@/utils/auth";
import { getMyWalletBalance } from "@/utils/orders-api";

const formatVnd = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

/**
 * Nút "Tài khoản" trên Header.
 * - Chưa đăng nhập: mở menu có "Đăng nhập" và "Đăng ký".
 * - Đã đăng nhập: hiện tên người dùng, menu có "Đăng xuất" (FR-16).
 */
export default function AccountMenu() {
  const user = useSyncExternalStore(subscribeAuth, getStoredUser, () => null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Token đã hết hạn thì coi như đã đăng xuất, tránh hiện tên của một phiên không còn dùng được.
  useEffect(() => {
    if (user && !isSessionActive()) clearSession();
  }, [user]);

  // Mở menu thì lấy lại số dư ví mới nhất (chỉ dành cho CUSTOMER).
  const userId = user?.id;
  const userRole = user?.role;
  useEffect(() => {
    if (!open || !userId || userRole === "STAFF") return;
    getMyWalletBalance()
      .then((me) => {
        if (typeof me.walletBalance === "number") updateStoredUser({ id: userId, walletBalance: me.walletBalance });
      })
      .catch(() => {}); // lỗi mạng: vẫn hiện số dư đang lưu
  }, [open, userId, userRole]);

  // Đóng menu khi bấm ra ngoài hoặc nhấn Esc.
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    clearSession(); // xóa token phía client; giỏ hàng vẫn được giữ nguyên
    setOpen(false);
  };

  const itemClass =
    "flex w-full items-center gap-2.5 px-4 py-3 min-h-[44px] text-left text-xs font-bold text-[#3D291D] hover:bg-[#FAF4ED] hover:text-[#E06D20] transition";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        data-testid="account-button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={user ? `Tài khoản của ${user.fullName}` : "Tài khoản"}
        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-xs font-bold text-[#3D291D] bg-white border border-[#DED2C3] hover:border-[#E06D20] hover:text-[#E06D20] rounded-full transition shadow-2xs active:scale-95"
      >
        <User className="w-4 h-4 text-[#786354]" />
        <span className="hidden sm:inline max-w-[120px] truncate">
          {user ? user.fullName : "Tài khoản"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#786354] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          data-testid="account-menu"
          className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl bg-white border border-[#EAE0D2] shadow-xl shadow-stone-900/10 z-50"
        >
          {user ? (
            <>
              <div className="px-4 py-3 bg-[#FAF6F0] border-b border-[#EAE0D2]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#786354]">
                  Đang đăng nhập
                </p>
                <p className="mt-0.5 text-sm font-extrabold text-[#2B1B12] truncate">{user.fullName}</p>
                <p className="text-xs text-[#786354] truncate">{user.email}</p>
                {user.role === "STAFF" ? (
                  <p className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-[#786354]">Vai trò</span>
                    <span className="rounded-full bg-[#F3E8DA] px-2.5 py-0.5 font-extrabold text-[#E06D20]">
                      Nhân viên quầy
                    </span>
                  </p>
                ) : (
                  typeof user.walletBalance === "number" && (
                    <p className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-bold text-[#786354]">Số dư ví</span>
                      <span data-testid="account-wallet-balance" className="font-black text-[#E06D20]">
                        {formatVnd(user.walletBalance)}
                      </span>
                    </p>
                  )
                )}
              </div>
              {user.role === "STAFF" && (
                <Link
                  href="/staff"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`${itemClass} border-b border-[#EAE0D2] text-[#E06D20]`}
                >
                  <Coffee className="w-4 h-4" />
                  Quầy pha chế (Staff)
                </Link>
              )}
              <button type="button" role="menuitem" onClick={handleLogout} className={itemClass}>
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <div className="px-4 py-3 bg-[#FAF6F0] border-b border-[#EAE0D2]">
                <p className="text-xs text-[#786354]">Đăng nhập để đặt món và theo dõi đơn hàng.</p>
              </div>
              <Link href="/login" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                <LogIn className="w-4 h-4" />
                Đăng nhập
              </Link>
              <Link href="/register" role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
                <UserPlus className="w-4 h-4" />
                Đăng ký
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
