"use client";

import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import MenuFilter from "@/components/MenuFilter";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import CartDrawer from "@/components/CartDrawer";
import { fetchProducts } from "@/services/products";
import { Product } from "@/types/product";
import {
  Coffee,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Flame,
  ShieldCheck,
  Clock,
  Star,
  CupSoda,
  Leaf,
} from "lucide-react";

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchProducts(controller.signal)
      .then((data) => {
        setProducts(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Không thể kết nối đến máy chủ BrewLite.";
        setError(message);
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount((prev) => prev + 1);
  };

  // Dynamic category list derived from fetched products (FR-01, FR-02)
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      if (!map.has(p.categoryId)) {
        map.set(p.categoryId, p.categoryName);
      }
    }
    return [
      { id: "all", name: "Tất cả đồ uống" },
      ...Array.from(map.entries()).map(([id, name]) => ({ id, name })),
    ];
  }, [products]);

  // Filter products by category and search query (FR-01, FR-05)
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchCategory =
        selectedCategory === "all" || product.categoryId === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-[#2B1B12] flex flex-col font-sans selection:bg-[#E06D20] selection:text-white">
      {/* Navigation Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* Hero Banner (2-Column Specialty Coffee House Layout) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F8F1E5] via-[#FAF5EE] to-[#FBF7F0] border-b border-[#EAE0D2]">
        {/* Decorative Warm Glows & Botanical Accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#E06D20]/8 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[480px] h-[480px] -translate-y-1/2 rounded-full bg-[#D9A066]/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(#d8c6b2_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            {/* Left Column: Editorial Typography & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#E5D8C5] text-[#9A521E] text-xs font-extrabold shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#E06D20]" />
                <span>Thực đơn cà phê tươi mới mỗi ngày</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#2B1B12] uppercase leading-[1.08]">
                Đánh thức <br />
                <span className="text-[#E06D20]">ngày mới</span> chuẩn gu
              </h1>

              <p className="text-sm sm:text-base text-[#685344] max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Với hương vị cà phê đậm đà và tự nhiên từ những hạt cafe chọn lọc.
                Tùy biến kích cỡ S/M/L, thêm topping yêu thích và thanh toán nhanh
                chóng ngay trên trình duyệt.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
                <a
                  href="#menu"
                  className="px-7 py-3.5 min-h-[48px] rounded-full bg-[#E06D20] hover:bg-[#C85A12] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-orange-950/20 transition active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Đặt Hàng Ngay</span>
                </a>
                <a
                  href="#menu"
                  className="px-7 py-3.5 min-h-[48px] rounded-full bg-white/90 border-2 border-[#352013] hover:bg-[#FAF3E8] text-[#2B1B12] text-xs sm:text-sm font-extrabold transition active:scale-95 inline-flex items-center gap-2 shadow-2xs"
                >
                  <span>Khám Phá Menu</span>
                </a>
              </div>

              {/* Trust Highlights Row */}
              <div className="pt-4 grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 border-t border-[#E6DBC9]/80">
                <div className="text-center lg:text-left">
                  <p className="text-lg sm:text-xl font-black text-[#2B1B12]">100%</p>
                  <p className="text-[11px] font-semibold text-[#786354]">
                    Hạt rang mộc Cầu Đất
                  </p>
                </div>
                <div className="text-center lg:text-left border-x border-[#E6DBC9]/70 px-3">
                  <p className="text-lg sm:text-xl font-black text-[#E06D20]">3 Size</p>
                  <p className="text-[11px] font-semibold text-[#786354]">
                    Tùy biến S • M • L
                  </p>
                </div>
                <div className="text-center lg:text-left pl-1">
                  <p className="text-lg sm:text-xl font-black text-[#2B1B12]">4.9 ★</p>
                  <p className="text-[11px] font-semibold text-[#786354]">
                    Khách hàng yêu thích
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Artistic Coffee Showcase Composition */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Warm Sand Organic Stage */}
              <div className="relative w-full max-w-md aspect-[4/3.6] rounded-[40px] bg-gradient-to-br from-[#EFE3D2] via-[#E8D7C1] to-[#DFC8AC] p-5 sm:p-6 shadow-xl shadow-stone-900/8 border border-white/70 flex flex-col justify-between overflow-hidden">
                {/* Decorative Leaf / Bean Badges */}
                <div className="flex items-center justify-between relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-extrabold text-[#2B1B12] shadow-xs">
                    <Flame className="w-3.5 h-3.5 text-[#E06D20] fill-current" />
                    Signature Collection
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2B1B12] text-[#FAF5EE] text-[11px] font-bold">
                    <Star className="w-3 h-3 text-amber-400 fill-current" /> 4.9
                  </span>
                </div>

                {/* Illustrated Trio Drink Showcase Cards */}
                <div className="grid grid-cols-3 gap-2.5 sm:gap-3 my-auto py-3 relative z-10">
                  {/* Drink 1: Iced Latte */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-white shadow-md flex flex-col items-center text-center transform -rotate-2 hover:rotate-0 transition">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#8B5A2B] to-[#4A2C11] flex items-center justify-center text-amber-100 shadow-inner mb-2">
                      <Coffee className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-[11px] font-extrabold text-[#2B1B12] line-clamp-1">
                      Cà Phê Muối
                    </p>
                    <span className="text-[10px] font-bold text-[#E06D20] mt-0.5">
                      29.000 ₫
                    </span>
                  </div>

                  {/* Drink 2: Peach Tea (Center Elevated) */}
                  <div className="bg-white rounded-2xl p-3 border-2 border-[#E06D20]/40 shadow-lg flex flex-col items-center text-center transform -translate-y-2 scale-105 transition">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#EA7B26] to-[#B8470B] flex items-center justify-center text-white shadow-inner mb-2">
                      <CupSoda className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-[11px] font-extrabold text-[#2B1B12] line-clamp-1">
                      Trà Đào Cam Sả
                    </p>
                    <span className="text-[10px] font-bold text-[#E06D20] mt-0.5">
                      39.000 ₫
                    </span>
                  </div>

                  {/* Drink 3: Matcha Latte */}
                  <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-white shadow-md flex flex-col items-center text-center transform rotate-2 hover:rotate-0 transition">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#5B8C5A] to-[#3B623B] flex items-center justify-center text-emerald-50 shadow-inner mb-2">
                      <Leaf className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <p className="text-[11px] font-extrabold text-[#2B1B12] line-clamp-1">
                      Matcha Latte
                    </p>
                    <span className="text-[10px] font-bold text-[#E06D20] mt-0.5">
                      45.000 ₫
                    </span>
                  </div>
                </div>

                {/* Bottom Floating Bar inside Showcase */}
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-white/80 flex items-center justify-between relative z-10 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FAF4EB] border border-[#E8DAC8] flex items-center justify-center text-[#E06D20]">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-[#2B1B12]">
                        Chuẩn giá niêm yết VNĐ
                      </p>
                      <p className="text-[10px] text-[#786354] font-medium">
                        Tự động gộp giỏ hàng thông minh
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#E06D20] bg-[#FFF4EB] px-2.5 py-1 rounded-full">
                    BrewLite
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Highlights Strip (#about) */}
      <section id="about" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-[#ECE2D4] shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center flex-shrink-0">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#2B1B12]">
                Chiết xuất tươi mỗi ngày
              </h3>
              <p className="text-[11px] text-[#786354]">
                Hạt rang mộc nguyên chất, giữ trọn hậu vị tự nhiên.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#ECE2D4] shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#2B1B12]">
                Tùy biến theo gu riêng
              </h3>
              <p className="text-[11px] text-[#786354]">
                Chọn size S/M/L, topping đa dạng và ghi chú Barista.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-[#ECE2D4] shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold text-[#2B1B12]">
                Đặt món nhanh & mượt mà
              </h3>
              <p className="text-[11px] text-[#786354]">
                Giỏ hàng đồng bộ tức thời, tối ưu cho cả di động.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Menu Section (FR-01 -> FR-08) */}
      <main id="menu" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-7">
        {/* Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#E06D20]">
              Sản Phẩm Nổi Bật
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2B1B12] tracking-tight">
              Món ngon phải thử
            </h2>
          </div>

          {/* Results Counter */}
          <div className="flex items-center gap-3 text-xs font-bold text-[#786354] bg-white px-4 py-2 rounded-full border border-[#EAE0D2] shadow-2xs self-start sm:self-auto">
            <span>
              {isLoading
                ? "Đang tải thực đơn..."
                : `Hiển thị ${filteredProducts.length} món đồ uống`}
            </span>
            {searchQuery && !isLoading && (
              <span className="pl-2 border-l border-[#EAE0D2]">
                Từ khóa: &ldquo;<strong className="text-[#2B1B12]">{searchQuery}</strong>&rdquo;
              </span>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <MenuFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Loading State */}
        {isLoading && (
          <div
            role="status"
            aria-label="Đang tải thực đơn"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {[1, 2, 3, 4].map((skeleton) => (
              <div
                key={skeleton}
                className="bg-white rounded-[28px] p-4 border border-[#ECE2D4] shadow-xs space-y-4 animate-pulse"
              >
                <div className="aspect-[4/3] w-full rounded-2xl bg-[#F4ECE1]" />
                <div className="space-y-2.5">
                  <div className="h-4 bg-[#EFE6D8] rounded-full w-1/3" />
                  <div className="h-5 bg-[#E6DBC9] rounded-full w-3/4" />
                  <div className="h-3 bg-[#F4ECE1] rounded-full w-full" />
                </div>
                <div className="pt-3.5 border-t border-[#F2EAE0] flex items-center justify-between">
                  <div className="h-6 bg-[#E6DBC9] rounded-full w-20" />
                  <div className="h-10 bg-[#EFE6D8] rounded-full w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div
            role="alert"
            className="relative overflow-hidden py-14 sm:py-16 px-6 text-center space-y-5 bg-white rounded-[32px] border border-[#E8DCCB] shadow-sm"
          >
            <div className="w-20 h-20 rounded-full bg-[#FFF4EB] border-4 border-[#FDE6D2] text-[#E06D20] mx-auto flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FAF3E8] text-[#9A521E] border border-[#E8DAC8]">
                Trạng thái kết nối dữ liệu
              </span>
              <h3 className="font-black text-xl text-[#2B1B12]">
                Không thể tải thực đơn
              </h3>
              <p className="text-xs sm:text-sm text-[#786354] font-medium leading-relaxed">
                {error}
              </p>
            </div>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-7 py-3 min-h-[44px] rounded-full bg-[#E06D20] hover:bg-[#C85A12] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-orange-950/15 transition active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Thử lại</span>
              </button>
            </div>
          </div>
        )}

        {/* Empty State (no products returned from API) */}
        {!isLoading && !error && products.length === 0 && (
          <div className="py-16 sm:py-20 px-6 text-center space-y-5 bg-white rounded-[32px] border border-[#E8DCCB] shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#FAF5EE] border-4 border-[#EFE5D8] text-[#E06D20] mx-auto flex items-center justify-center">
              <Coffee className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-black text-xl text-[#2B1B12]">
                Thực đơn hiện đang trống
              </h3>
              <p className="text-xs sm:text-sm text-[#786354] leading-relaxed">
                Hiện chưa có đồ uống nào được mở bán. Vui lòng thử tải lại sau ít phút.
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 px-7 py-3 min-h-[44px] rounded-full bg-[#E06D20] hover:bg-[#C85A12] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-orange-950/15 transition active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tải lại thực đơn</span>
            </button>
          </div>
        )}

        {/* Filter-Empty State */}
        {!isLoading && !error && products.length > 0 && filteredProducts.length === 0 && (
          <div className="py-16 sm:py-20 px-6 text-center space-y-5 bg-white rounded-[32px] border border-[#E8DCCB] shadow-sm">
            <div className="w-20 h-20 rounded-full bg-[#FAF5EE] border-4 border-[#EFE5D8] text-[#E06D20] mx-auto flex items-center justify-center">
              <Coffee className="w-9 h-9 stroke-[1.8]" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="font-black text-xl text-[#2B1B12]">
                Không tìm thấy món đồ uống phù hợp
              </h3>
              <p className="text-xs sm:text-sm text-[#786354] leading-relaxed">
                Vui lòng thử tìm kiếm bằng từ khóa khác hoặc chuyển sang danh mục khác.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="px-7 py-3 min-h-[44px] rounded-full bg-[#E06D20] hover:bg-[#C85A12] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-orange-950/15 transition active:scale-95"
            >
              Xem lại tất cả đồ uống
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(prod) => setSelectedProduct(prod)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#241710] text-[#D8CCC0] py-12 border-t border-[#38251A] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E06D20] flex items-center justify-center text-white">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-white">
              BrewLite Coffee & Tea
            </span>
            <span className="text-[#A89888]">
              — Đồ án Công nghệ Phần mềm (SGU 2026-2027)
            </span>
          </div>
          <p className="text-[#A89888]">
            © 2026 BrewLite System. Phân hệ Frontend Next.js.
          </p>
        </div>
      </footer>

      {/* Product Detail Customization Modal (FR-06 -> FR-08) */}
      {selectedProduct && (
        <ProductDetailModal
          key={selectedProduct.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddedSuccess={() => showToast("Đã thêm món vào giỏ hàng thành công!")}
        />
      )}

      {/* Cart Slide-over Drawer (FR-10 -> FR-13) */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#2B1B12] text-white text-xs font-extrabold shadow-2xl border border-white/15 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#E06D20] flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
