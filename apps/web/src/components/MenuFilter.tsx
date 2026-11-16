"use client";

import { Search, X } from "lucide-react";

interface MenuFilterProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function MenuFilter({
  searchQuery,
  onSearchChange,
}: MenuFilterProps) {
  return (
    <div className="bg-[#F5EDE1]/70 p-4 sm:p-5 rounded-3xl border border-[#EAE0D2]">
      <div className="relative w-full max-w-2xl">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#EAE0D2] flex items-center justify-center text-[#E06D20]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm đồ uống theo tên (VD: Muối, Cold Brew, Trà đào...)"
          className="w-full pl-14 pr-28 py-3 min-h-[44px] rounded-full bg-white border border-[#E0D4C3] shadow-2xs focus:outline-none focus:border-[#E06D20] focus:ring-2 focus:ring-[#E06D20]/20 text-xs sm:text-sm font-medium text-[#2B1B12] transition placeholder:text-[#9A8878]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 text-[11px] font-bold text-[#5C4435] hover:text-[#2B1B12] bg-[#F3ECE1] hover:bg-[#E6DBC9] px-2.5 py-1.5 rounded-full transition"
          >
            <X className="w-3 h-3" />
            <span>Xóa tìm kiếm</span>
          </button>
        )}
      </div>
    </div>
  );
}
