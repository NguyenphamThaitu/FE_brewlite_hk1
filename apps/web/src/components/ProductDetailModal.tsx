"use client";

import { useState } from "react";
import { Product, ProductSize, Topping } from "@/types/product";
import { SIZE_OPTIONS, AVAILABLE_TOPPINGS } from "@/data/mock-products";
import { addToCart } from "@/utils/cart";
import { X, Plus, Minus, Check, ShoppingBag } from "lucide-react";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddedSuccess?: () => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddedSuccess,
}: ProductDetailModalProps) {
  const [selectedSize, setSelectedSize] = useState<ProductSize>("S");
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [note, setNote] = useState<string>("");
  const [qty, setQty] = useState<number>(1);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  if (!product) return null;

  // Size details
  const currentSizeOption =
    SIZE_OPTIONS.find((s) => s.size === selectedSize) || SIZE_OPTIONS[0];

  // Calculation
  const toppingsExtraPrice = selectedToppings.reduce((sum, t) => sum + t.price, 0);
  const unitPrice = product.basePrice + currentSizeOption.extraPrice + toppingsExtraPrice;
  const totalPrice = unitPrice * qty;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleToggleTopping = (topping: Topping) => {
    if (selectedToppings.some((t) => t.id === topping.id)) {
      setSelectedToppings(selectedToppings.filter((t) => t.id !== topping.id));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleAddToCart = () => {
    setIsAdding(true);

    addToCart({
      productId: product.id,
      name: product.name,
      imageUrl: product.imageUrl,
      size: selectedSize,
      sizePrice: currentSizeOption.extraPrice,
      toppings: selectedToppings,
      note: note.trim() || undefined,
      unitPrice,
      qty,
    });

    setTimeout(() => {
      setIsAdding(false);
      onClose();
      if (onAddedSuccess) onAddedSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-900 shadow-md flex items-center justify-center transition"
          aria-label="Đóng popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Header Drink Info */}
          <div className="flex gap-4 items-start">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-sm bg-neutral-100 flex-shrink-0"
            />
            <div className="flex-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                {product.categoryName}
              </span>
              <h2 className="text-xl font-bold text-neutral-900 mt-1">
                {product.name}
              </h2>
              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                {product.description}
              </p>
              <p className="text-sm font-bold text-amber-800 mt-1.5">
                Giá gốc: {formatPrice(product.basePrice)}
              </p>
            </div>
          </div>

          <hr className="border-neutral-100" />

          {/* Section: Size Options (FR-02) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-900">
                1. Chọn kích cỡ (Bắt buộc)
              </label>
              <span className="text-xs text-amber-800 font-medium bg-amber-50 px-2 py-0.5 rounded">
                Chọn 1
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {SIZE_OPTIONS.map((opt) => {
                const isSelected = selectedSize === opt.size;
                return (
                  <button
                    key={opt.size}
                    type="button"
                    onClick={() => setSelectedSize(opt.size)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                      isSelected
                        ? "border-amber-700 bg-amber-50/80 text-amber-900 shadow-sm"
                        : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.name}</span>
                    <span className="text-xs text-neutral-500 mt-0.5">
                      {opt.extraPrice > 0 ? `+${formatPrice(opt.extraPrice)}` : "Chuẩn"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Topping Options (FR-02) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-neutral-900">
                2. Chọn Topping thêm (Tùy chọn)
              </label>
              <span className="text-xs text-neutral-400">Chọn nhiều</span>
            </div>

            <div className="space-y-2">
              {AVAILABLE_TOPPINGS.map((topping) => {
                const isChecked = selectedToppings.some((t) => t.id === topping.id);
                return (
                  <label
                    key={topping.id}
                    onClick={() => handleToggleTopping(topping)}
                    className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition select-none ${
                      isChecked
                        ? "border-amber-600 bg-amber-50/50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isChecked
                            ? "bg-amber-700 border-amber-700 text-white"
                            : "border-neutral-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium text-neutral-800">
                        {topping.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-600">
                      +{formatPrice(topping.price)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: Note for Barista */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-neutral-900">
              3. Ghi chú cho Barista (Tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Ít đá 50%, ít ngọt, mang đi..."
              className="w-full px-4 py-2.5 rounded-2xl border border-neutral-200 focus:outline-none focus:border-amber-700 text-sm"
              maxLength={150}
            />
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-6 bg-neutral-50 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-xs font-bold text-neutral-500 uppercase">
              Số lượng:
            </span>
            <div className="flex items-center border border-neutral-200 bg-white rounded-2xl p-1 shadow-sm">
              <button
                type="button"
                disabled={qty <= 1}
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition"
                aria-label="Giảm số lượng"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-neutral-900">
                {qty}
              </span>
              <button
                type="button"
                disabled={qty >= product.stock}
                onClick={() => setQty((prev) => Math.min(product.stock, prev + 1))}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 transition"
                aria-label="Tăng số lượng"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={isAdding}
            onClick={handleAddToCart}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-amber-700 hover:bg-amber-800 text-white font-bold shadow-lg shadow-amber-800/20 flex items-center justify-between transition active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}</span>
            </div>
            <span className="text-base font-extrabold tracking-wide">
              {formatPrice(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

