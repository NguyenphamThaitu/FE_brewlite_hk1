"use client";

import { CATEGORIES } from "@/data/mock-products";
import { Search, X, Sparkles } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
}

interface MenuFilterProps {
  categories?: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function MenuFilter({
  categories = CATEGORIES,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: MenuFilterProps) {
  return (
    <div className="space-y-5 bg-[#F5EDE1]/70 p-4 sm:p-5 rounded-3xl border border-[#EAE0D2]">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-full text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? "bg-[#E06D20] text-white shadow-md shadow-orange-950/15 scale-[1.02]"
                    : "bg-white text-[#4A3528] hover:bg-[#FAF6F0] hover:text-[#E06D20] border border-[#E4D9C8] shadow-2xs"
                }`}
              >
                {cat.id === "all" && (
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "text-amber-200" : "text-[#E06D20]"
                    }`}
                  />
                )}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full lg:w-96 flex-shrink-0">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#FAF5EE] border border-[#EAE0D2] flex items-center justify-center text-[#E06D20]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm đồ uống theo tên (VD: Muối, Cold Brew, Trà đào...)"
            className="w-full pl-14 pr-24 py-3 min-h-[44px] rounded-full bg-white border border-[#E0D4C3] shadow-2xs focus:outline-none focus:border-[#E06D20] focus:ring-2 focus:ring-[#E06D20]/20 text-xs sm:text-sm font-medium text-[#2B1B12] transition placeholder:text-[#9A8878]"
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
    </div>
  );
}
