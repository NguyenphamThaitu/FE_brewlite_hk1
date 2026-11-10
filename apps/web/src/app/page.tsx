"use client";

import { useState, useMemo } from "react";
import Header from "@/components/Header";
import MenuFilter from "@/components/MenuFilter";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import CartDrawer from "@/components/CartDrawer";
import { MOCK_PRODUCTS } from "@/data/mock-products";
import { Product } from "@/types/product";
import { Coffee, Sparkles, CheckCircle2 } from "lucide-react";

export default function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter products by category and search query (FR-01)
  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const matchCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;
      const matchSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-neutral-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-900 to-amber-950 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-inner">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-800/80 border border-amber-700 text-amber-200 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Thực đơn cà phê tươi mới mỗi ngày</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Thưởng thức hương vị chuẩn gu cùng{" "}
            <span className="text-amber-400">BrewLite</span>
          </h1>

          <p className="text-sm sm:text-base text-amber-100/80 max-w-2xl mx-auto font-normal leading-relaxed">
            Chọn món yêu thích, tùy biến kích cỡ và topping theo phong cách riêng của bạn.
            Thanh toán nhanh chóng không cần tiền mặt.
          </p>
        </div>
      </section>

      {/* Main Menu Section (FR-01 & FR-02) */}
      <main id="menu" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Filters & Search */}
        <MenuFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 pt-2 border-t border-neutral-200">
          <span>
            Hiển thị <strong>{filteredProducts.length}</strong> món đồ uống
          </span>
          {searchQuery && (
            <span>
              Kết quả cho: &ldquo;<strong>{searchQuery}</strong>&rdquo;
            </span>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-neutral-200 p-8">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 mx-auto flex items-center justify-center">
              <Coffee className="w-8 h-8 stroke-[1.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-neutral-800">
                Không tìm thấy món đồ uống phù hợp
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Vui lòng thử tìm kiếm bằng từ khóa khác hoặc chuyển sang danh mục khác.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-4 py-2 rounded-xl bg-amber-800 text-white text-xs font-semibold hover:bg-amber-900 transition"
            >
              Xem lại tất cả đồ uống
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-10 border-t border-neutral-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-neutral-200">BrewLite Coffee & Tea</span>
            <span>— Đồ án Công nghệ Phần mềm (SGU 2026-2027)</span>
          </div>
          <p>© 2026 BrewLite System. Phân hệ Frontend Next.js.</p>
        </div>
      </footer>

      {/* Product Detail Customization Modal (FR-02) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddedSuccess={() => showToast("Đã thêm món vào giỏ hàng thành công!")}
      />

      {/* Cart Slide-over Drawer (FR-03) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-neutral-900 text-white text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
