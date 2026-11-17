"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import CartDrawer from "@/components/CartDrawer";
import OrderConfirmationModal from "@/components/OrderConfirmationModal";
import { getStoredCart } from "@/utils/cart";
import {
  Coffee,
  Sparkles,
  Heart,
  ShieldCheck,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function AboutPage() {
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-[#2B1B12] flex flex-col font-sans selection:bg-[#E06D20] selection:text-white">
      {/* Navigation Header with activeTab='about' */}
      <Header onOpenCart={() => setIsCartOpen(true)} activeTab="about" />

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F8F1E5] via-[#FAF5EE] to-[#FBF7F0] border-b border-[#EAE0D2]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#E06D20]/8 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[480px] h-[480px] -translate-y-1/2 rounded-full bg-[#D9A066]/15 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-35 bg-[radial-gradient(#d8c6b2_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-[#E5D8C5] text-[#9A521E] text-xs font-extrabold shadow-2xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#E06D20]" />
            <span>Câu chuyện thương hiệu BrewLite</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#2B1B12] uppercase leading-[1.1] max-w-4xl mx-auto">
            Hương vị <span className="text-[#E06D20]">nguyên bản</span> <br />
            cho trải nghiệm chuẩn gu
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#685344] max-w-2xl mx-auto font-medium leading-relaxed">
            BrewLite sinh ra từ niềm đam mê đem đến những ly cà phê tươi mộc, đậm đà phong vị Việt Nam
            kết hợp cùng nền tảng công nghệ đặt món hiện đại, nhanh chóng và mượt mà trên mọi thiết bị.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/#menu"
              className="px-8 py-4 min-h-[50px] rounded-full bg-[#E06D20] hover:bg-[#C85A12] text-white text-sm font-extrabold shadow-lg shadow-orange-950/20 transition active:scale-95 inline-flex items-center gap-2.5"
            >
              <Coffee className="w-4 h-4" />
              <span>Khám Phá Thực Đơn & Đặt Món</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Story & Philosophy Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Visual Artwork */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-[36px] overflow-hidden shadow-2xl border-4 border-white aspect-[4/3.5] bg-[#EFE3D2]">
              <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80"
                alt="Không gian cà phê BrewLite"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full bg-[#E06D20] text-white">
                  BrewLite Philosophy
                </span>
                <p className="text-base font-extrabold mt-2">
                  &ldquo;Mỗi giọt cà phê là một lời chào ngày mới tràn đầy cảm hứng.&rdquo;
                </p>
              </div>
            </div>

            {/* Floating Quality Badge */}
            <div className="absolute -bottom-6 -right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-[#E5DACD] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center font-black">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-[#2B1B12]">100% Cầu Đất</p>
                <p className="text-[11px] text-[#786354]">Rang mộc tuyển chọn</p>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF4EB] border border-[#E6DBC9] text-[#E06D20] text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Khởi nguồn đam mê</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-[#2B1B12] leading-tight">
              Giữ trọn tinh hoa cà phê Việt <br />
              giữa nhịp sống số hiện đại
            </h2>

            <p className="text-sm sm:text-base text-[#685344] leading-relaxed">
              Tại <strong>BrewLite</strong>, chúng tôi tin rằng một tách cà phê ngon không chỉ giúp tinh thần tỉnh táo
              mà còn là khoảnh khắc kết nối và tiếp thêm năng lượng tích cực cho cả ngày dài làm việc, học tập.
            </p>

            <p className="text-sm sm:text-base text-[#685344] leading-relaxed">
              Toàn bộ hạt cà phê tại BrewLite được thu hoạch thủ công từ vùng cao nguyên <strong>Cầu Đất – Đà Lạt</strong>,
              nơi khí hậu và thổ nhưỡng lý tưởng bậc nhất. Hạt Robusta đậm đà kết hợp cùng Arabica thơm quyến rũ được
              rang mộc nguyên chất, tuyệt đối không độn bơ, không hương liệu tổng hợp, giữ nguyên hậu vị ngọt thanh tự nhiên.
            </p>

            {/* Checkmark List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#2B1B12]">
                <CheckCircle2 className="w-4 h-4 text-[#E06D20] flex-shrink-0" />
                <span>Chiết xuất tươi trực tiếp mỗi ngày</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#2B1B12]">
                <CheckCircle2 className="w-4 h-4 text-[#E06D20] flex-shrink-0" />
                <span>Không chất bảo quản & hóa chất</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#2B1B12]">
                <CheckCircle2 className="w-4 h-4 text-[#E06D20] flex-shrink-0" />
                <span>Công thức pha chế cân bằng, ít gắt</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#2B1B12]">
                <CheckCircle2 className="w-4 h-4 text-[#E06D20] flex-shrink-0" />
                <span>Bao bì thân thiện sinh thái</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="bg-[#FAF5EE] border-y border-[#EAE0D2] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#E06D20]">
              Giá trị cốt lõi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#2B1B12] mt-2">
              Bốn cam kết vàng tạo nên BrewLite
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE0D2] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center mb-4">
                <Coffee className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#2B1B12] mb-2">
                  100% Cà Phê Mộc
                </h3>
                <p className="text-xs text-[#786354] leading-relaxed">
                  Nguyên liệu tuyển chọn từ Cầu Đất, rang mộc chuẩn nhiệt nhằm giữ trọn hương thơm thanh thoát và hậu vị êm ái.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE0D2] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#2B1B12] mb-2">
                  Tùy Biến Theo Gu
                </h3>
                <p className="text-xs text-[#786354] leading-relaxed">
                  Dễ dàng chọn kích cỡ S/M/L, lựa chọn các loại topping hấp dẫn (trân châu, kem cheese) và ghi chú riêng cho Barista.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE0D2] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#2B1B12] mb-2">
                  Giá Chuẩn & Minh Bạch
                </h3>
                <p className="text-xs text-[#786354] leading-relaxed">
                  Đơn giá niêm yết rõ ràng chuẩn VNĐ, tự động gộp dòng thông minh trong giỏ hàng và không phát sinh phí ẩn.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-3xl p-6 border border-[#EAE0D2] shadow-xs flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition duration-300">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF4EB] text-[#E06D20] flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#2B1B12] mb-2">
                  Đặt Món Nhanh Chóng
                </h3>
                <p className="text-xs text-[#786354] leading-relaxed">
                  Hệ thống số hóa tối ưu cho cả máy tính và di động, hỗ trợ đặt món tại bàn hoặc mang đi chỉ trong vài giây.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-[#FFF4EB] border-2 border-[#E06D20]/30 rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-black text-[#2B1B12]">
            Sẵn sàng thưởng thức đồ uống chuẩn gu?
          </h3>
          <p className="text-xs sm:text-sm text-[#786354] max-w-md mx-auto">
            Xem ngay thực đơn với các dòng cà phê phin, cold brew, trà trái cây và matcha thơm ngon mỗi ngày.
          </p>
          <div className="pt-2">
            <Link
              href="/#menu"
              className="px-8 py-3.5 rounded-full bg-[#E06D20] hover:bg-[#C85A12] text-white font-extrabold text-sm shadow-md shadow-orange-950/20 inline-flex items-center gap-2 transition active:scale-95"
            >
              <span>Xem Thực Đơn Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Shared Footer */}
      <footer className="mt-auto border-t border-[#EAE0D2] bg-[#2B1B12] text-[#E6D9C8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E06D20] flex items-center justify-center text-white">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-white">
              BrewLite Coffee & Tea
            </span>
          </div>
          <p className="text-[#A89888]">
            © 2026 BrewLite System.
          </p>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsOrderModalOpen(true);
        }}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        items={getStoredCart()}
        totalAmount={getStoredCart().reduce((sum, item) => sum + item.totalPrice, 0)}
      />
    </div>
  );
}

