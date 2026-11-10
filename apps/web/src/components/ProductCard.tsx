"use client";

import { Product } from "@/types/product";
import { Plus, Flame, AlertCircle } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div
      onClick={() => !isOutOfStock && onSelect(product)}
      className={`group relative flex flex-col justify-between bg-white rounded-3xl p-4 border border-neutral-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isOutOfStock ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <div>
        {/* Image Container */}
        <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-neutral-100 mb-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isOutOfStock ? "grayscale" : "group-hover:scale-105"
            }`}
            loading="lazy"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isPopular && !isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-600/90 text-white backdrop-blur-sm shadow-sm">
                <Flame className="w-3.5 h-3.5" /> Bán chạy
              </span>
            )}
            {isOutOfStock && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-800/90 text-white backdrop-blur-sm">
                <AlertCircle className="w-3.5 h-3.5" /> Tạm hết món
              </span>
            )}
          </div>

          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-xl text-xs font-semibold bg-black/60 text-white backdrop-blur-md">
            {product.categoryName}
          </span>
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="font-bold text-lg text-neutral-900 group-hover:text-amber-800 transition line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-neutral-400 font-medium">Giá tiêu chuẩn (S)</span>
          <p className="text-lg font-extrabold text-amber-900">
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
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm ${
            isOutOfStock
              ? "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              : "bg-amber-100 text-amber-900 hover:bg-amber-700 hover:text-white active:scale-95"
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isOutOfStock ? "Hết hàng" : "Chọn món"}</span>
        </button>
      </div>
    </div>
  );
}

