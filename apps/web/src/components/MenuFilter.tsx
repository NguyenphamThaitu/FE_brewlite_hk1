"use client";

import { CATEGORIES } from "@/data/mock-products";
import { Search } from "lucide-react";

interface MenuFilterProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function MenuFilter({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
}: MenuFilterProps) {
  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm đồ uống theo tên (VD: Muối, Cold Brew, Trà đào...)"
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-neutral-200 shadow-sm focus:outline-none focus:border-amber-700 text-sm text-neutral-900 transition placeholder:text-neutral-400"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-md transition"
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:justify-center">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shadow-sm ${
                isSelected
                  ? "bg-amber-800 text-white shadow-amber-900/20 scale-105"
                  : "bg-white text-neutral-600 hover:bg-amber-50 hover:text-amber-900 border border-neutral-200"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

