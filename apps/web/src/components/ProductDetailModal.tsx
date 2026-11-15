"use client";

import { useEffect, useState } from "react";
import { Product, ProductDetail, ProductSize, SizeOption, Topping } from "@/types/product";
import { SIZE_OPTIONS, AVAILABLE_TOPPINGS } from "@/data/mock-products";
import { fetchProductDetail } from "@/services/products";
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
  const [detailState, setDetailState] = useState<{
    productId: string | number;
    detail: ProductDetail | null;
  } | null>(null);

  useEffect(() => {
    if (!product) return;
    const controller = new AbortController();

    fetchProductDetail(product.id, controller.signal)
      .then((detail) => {
        setDetailState({ productId: product.id, detail });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDetailState({ productId: product.id, detail: null });
        }
      });

    return () => controller.abort();
  }, [product]);

  if (!product) return null;

  const isLoadingDetail = detailState?.productId !== product.id;
  const loadedDetail = detailState?.productId === product.id ? detailState.detail : null;

  const sizeOptions: SizeOption[] = loadedDetail?.sizes.length
    ? loadedDetail.sizes
    : SIZE_OPTIONS;
  const toppingOptions: Topping[] = loadedDetail?.toppings.length
    ? loadedDetail.toppings
    : AVAILABLE_TOPPINGS;

  const currentSizeOption =
    sizeOptions.find((s) => s.size === selectedSize && s.available !== false) ||
    sizeOptions.find((s) => s.available !== false) ||
    sizeOptions[0];

  const maxQty = typeof product.stock === "number" ? Math.min(20, product.stock) : 20;

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
    if (topping.available === false) return;
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
      sizeId: currentSizeOption.id,
      size: currentSizeOption.size,
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tùy biến đồ uống"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-900 shadow-md flex items-center justify-center transition"
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
              <p className="text-sm font-bold text-[#E06D20] mt-1.5">
                Giá gốc: {formatPrice(product.basePrice)}
              </p>
            </div>
          </div>

          <hr className="border-[#EFE7DC]" />

          {/* Section: Size Options (FR-06, FR-07) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#2B1B12]">
                1. Chọn kích cỡ (Bắt buộc)
              </label>
              <span className="text-xs text-[#8C5325] font-bold bg-[#F3EDE2] px-2.5 py-0.5 rounded-full">
                {isLoadingDetail ? "Đang cập nhật..." : "Chọn 1"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {sizeOptions.map((opt) => {
                const isSizeDisabled = opt.available === false;
                const isSelected = currentSizeOption.size === opt.size;
                return (
                  <button
                    key={opt.size}
                    type="button"
                    disabled={isSizeDisabled}
                    onClick={() => setSelectedSize(opt.size)}
                    className={`flex flex-col items-center justify-center p-3 min-h-[48px] rounded-2xl border text-center transition ${
                      isSizeDisabled
                        ? "border-[#EFE7DC] bg-[#F7F2EB] text-[#A69788] cursor-not-allowed opacity-60"
                        : isSelected
                          ? "border-[#E06D20] bg-[#FAF5EE] text-[#2B1B12] font-bold shadow-xs ring-1 ring-[#E06D20]"
                          : "border-[#E5DACD] hover:border-[#D9CABE] text-[#4A3528]"
                    }`}
                  >
                    <span className="text-sm font-bold">{opt.name}</span>
                    <span className="text-xs text-[#786354] mt-0.5">
                      {isSizeDisabled
                        ? "Hết hàng"
                        : opt.extraPrice > 0
                          ? `+${formatPrice(opt.extraPrice)}`
                          : "Chuẩn"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Topping Options (FR-08) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#2B1B12]">
                2. Chọn Topping thêm (Tùy chọn)
              </label>
              <span className="text-xs text-[#786354]">Chọn nhiều</span>
            </div>

            <div className="space-y-2">
              {toppingOptions.map((topping) => {
                const isToppingDisabled = topping.available === false;
                const isChecked = selectedToppings.some((t) => t.id === topping.id);
                return (
                  <label
                    key={topping.id}
                    onClick={() => handleToggleTopping(topping)}
                    className={`flex items-center justify-between p-3 min-h-[44px] rounded-2xl border transition select-none ${
                      isToppingDisabled
                        ? "border-[#EFE7DC] bg-[#F7F2EB] text-[#A69788] cursor-not-allowed opacity-60"
                        : isChecked
                          ? "border-[#E06D20] bg-[#FAF5EE] cursor-pointer ring-1 ring-[#E06D20]/50"
                          : "border-[#E5DACD] hover:bg-[#FAF6F0] cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          isChecked
                            ? "bg-[#E06D20] border-[#E06D20] text-white"
                            : "border-[#D8CDC0] bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium text-[#2B1B12]">
                        {topping.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#786354]">
                      {isToppingDisabled ? "Tạm hết" : `+${formatPrice(topping.price)}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section: Note for Barista */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-[#2B1B12]">
              3. Ghi chú cho Barista (Tùy chọn)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Ít đá 50%, ít ngọt, mang đi..."
              className="w-full px-4 py-2.5 rounded-2xl border border-[#E5DACD] focus:outline-none focus:border-[#E06D20] focus:ring-1 focus:ring-[#E06D20] text-sm text-[#2B1B12]"
              maxLength={150}
            />
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="p-4 sm:p-6 bg-[#FAF7F2] border-t border-[#EFE7DC] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="text-xs font-bold text-[#786354] uppercase">
              Số lượng:
            </span>
            <div className="flex items-center border border-[#E5DACD] bg-white rounded-full p-1 shadow-2xs">
              <button
                type="button"
                disabled={qty <= 1}
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A3528] hover:bg-[#FAF4ED] disabled:opacity-40 transition"
                aria-label="Giảm số lượng"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-bold text-sm text-[#2B1B12]">
                {qty}
              </span>
              <button
                type="button"
                disabled={qty >= maxQty}
                onClick={() => setQty((prev) => Math.min(maxQty, prev + 1))}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#4A3528] hover:bg-[#FAF4ED] disabled:opacity-40 transition"
                aria-label="Tăng số lượng"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            disabled={isAdding || product.available === false}
            onClick={handleAddToCart}
            className="w-full sm:flex-1 py-3.5 px-6 min-h-[48px] rounded-full bg-[#E06D20] hover:bg-[#C95E16] text-white font-bold shadow-md shadow-orange-950/15 flex items-center justify-between transition active:scale-95 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              <span>{isAdding ? "Đang thêm..." : "Thêm vào giỏ hàng"}</span>
            </div>
            <span
              data-testid="modal-total-price"
              className="text-base font-extrabold tracking-wide"
            >
              {formatPrice(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
