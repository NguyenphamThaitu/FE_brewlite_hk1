"use client";

import { Product } from "@/types/product";
import { Plus, Flame, AlertCircle, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const isOutOfStock =
    product.available === false ||
    (typeof product.stock === "number" && product.stock <= 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div
      onClick={() => !isOutOfStock && onSelect(product)}
      className={`group relative flex flex-col justify-between bg-white rounded-[28px] p-4 border border-[#ECE2D4] shadow-xs transition-all duration-300 hover:shadow-xl hover:shadow-stone-900/8 hover:border-[#DFCBB2] hover:-translate-y-1.5 ${
        isOutOfStock ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div>
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-[#F5EFE6] mb-4 border border-[#F0E7DB]">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              isOutOfStock ? "grayscale" : "group-hover:scale-108"
            }`}
            loading="lazy"
          />

          {/* Subtle Bottom Vignette */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isPopular && !isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#E06D20] text-white shadow-md shadow-orange-950/25">
                <Flame className="w-3.5 h-3.5 fill-current" /> Bán chạy
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#2B1B12]/90 text-white backdrop-blur-xs">
                <AlertCircle className="w-3.5 h-3.5" /> Tạm hết món
              </span>
            )}
          </div>

          <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#2B1B12]/80 text-[#FAF5EE] backdrop-blur-xs border border-white/15">
            {product.categoryName}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-1.5 px-0.5">
          {/* Star Rating & Size Hint */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-3.5 h-3.5 fill-current" />
              ))}
              <span className="text-[11px] font-bold text-[#786354] ml-1">4.9</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A8878] bg-[#FAF5EE] px-2 py-0.5 rounded-md border border-[#EFE7DC]">
              Size S • M • L
            </span>
          </div>

          <h3 className="font-extrabold text-lg text-[#2B1B12] group-hover:text-[#E06D20] transition line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-[#786354] line-clamp-2 leading-relaxed min-h-[38px]">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer Info & Action (Matches Reference Coffee Card Layout) */}
      <div className="mt-4 pt-3.5 border-t border-[#F2EAE0] flex items-center justify-between gap-2">
        <div>
          <span className="block text-[10px] uppercase tracking-wider text-[#9C8A7B] font-bold">
            Giá tiêu chuẩn (S)
          </span>
          <p className="text-lg font-black text-[#2B1B12]">
            {formatPrice(product.basePrice)}
          </p>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onSelect(product);
          }}
          className={`flex items-center justify-between gap-2.5 pl-4 pr-1.5 py-1.5 min-h-[44px] rounded-full text-xs font-extrabold transition-all ${
            isOutOfStock
              ? "bg-[#F3ECE2] text-[#A89A8C] pr-4 cursor-not-allowed"
              : "bg-[#FAF5EE] text-[#3D291D] border border-[#E2D5C4] group-hover:border-[#E06D20] hover:bg-[#FFF5EC] active:scale-95"
          }`}
        >
          <span>{isOutOfStock ? "Hết hàng" : "Chọn món"}</span>
          {!isOutOfStock && (
            <span className="w-8 h-8 rounded-full bg-[#E06D20] group-hover:bg-[#C85A12] text-white flex items-center justify-center shadow-xs transition">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
