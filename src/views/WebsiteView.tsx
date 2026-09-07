import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { ProductModal } from '../components/ProductModal';
import { CheckoutDrawer } from '../components/CheckoutDrawer';
import { RestaurantGpsSection } from '../components/RestaurantGpsSection';
import { OrderTrackingView } from './OrderTrackingView';
import {
  Search,
  Flame,
  Sparkles,
  Plus,
  ShoppingBag,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Star,
  Navigation,
  Compass,
} from 'lucide-react';

export const WebsiteView: React.FC = () => {
  const {
    categories,
    products,
    addToCart,
    cart,
    activeTrackingOrderId,
    setActiveTrackingOrderId,
    settings,
    setIsStaffModalOpen,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // If viewing active tracking order
  if (activeTrackingOrderId) {
    return (
      <OrderTrackingView
        orderId={activeTrackingOrderId}
        onBackToMenu={() => setActiveTrackingOrderId(null)}
      />
    );
  }

  // Filter products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.categoryId === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      prod.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.descriptionAr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const popularProducts = products.filter((p) => p.isPopular);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800">
      {/* Hero Section matching Professional Polish design */}
      <section className="relative overflow-hidden bg-slate-900 text-white py-12 md:py-16 px-4">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FF6321_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#FF6321]/20 border border-[#FF6321]/40 text-[#FF6321] px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>أشهى بروست مقرمش وبرجر مشوي على النار في الشرقية</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              نكهة لا تُقاوم.. <br />
              <span className="text-[#FF6321]">تاكو بروست الأصلي</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
              استمتع بأشهى وجبات البروست المقرمش الطازجة يومياً، برجر اللحم البقري الصافي المشوي على اللهب، وساندوتشات التاكو المميزة. توصيل سريع ومباشر لباب منزلك!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href="#menu"
                className="bg-[#FF6321] hover:bg-[#e85516] text-white font-bold px-6 py-3 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-2 text-sm"
              >
                <span>تصفح قائمة الطعام</span>
                <ChevronRight className="w-4 h-4 rotate-180" />
              </a>

              <a
                href="#restaurant-gps"
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl border border-slate-700 transition flex items-center gap-2 text-sm cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-[#FF6321]" />
                <span>موقعنا على الـ GPS</span>
              </a>

              <a
                href="tel:01036130204"
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-xl border border-slate-700 transition flex items-center gap-2 text-sm"
              >
                <Phone className="w-4 h-4 text-[#FF6321]" />
                <span dir="ltr">01036130204</span>
              </a>
            </div>

            {/* Quick feature perks */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-800 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF6321]" />
                <span>تحضير فوري طازج</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FF6321]" />
                <span>لحوم ودواجن بلدية</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6321]" />
                <span>تتبع GPS حي</span>
              </div>
            </div>
          </div>

          {/* Hero Food Visual Collage */}
          <div className="relative">
            <div className="w-full h-80 md:h-96 rounded-2xl overflow-hidden shadow-xl border border-slate-800 relative group">
              <img
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80"
                alt="Taco Broast Meals"
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 right-6 left-6 text-white flex items-end justify-between">
                <div>
                  <span className="bg-[#FF6321] text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                    HOT CHOICE
                  </span>
                  <div className="text-xl font-bold mt-1">تكساس برجر & وجبات البروست</div>
                  <div className="text-xs text-slate-300">طعم الجريل المدخن الحقيقي</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#FF6321]">95 ج.م</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main id="menu" className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Search & Category Pills */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">قائمة وجبات تاكو بروست</h2>
              <p className="text-xs text-slate-500 mt-0.5">اختر الأصناف لتخصيص خيارات السبايسي والإضافات</p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="ابحث عن وجبة، ساندوتش، برجر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6321] shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#FF6321] text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              جميع الأصناف ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#FF6321] text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <span>{cat.nameAr}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white text-[#FF6321]' : 'bg-slate-100 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Popular Choices Section (if viewing all) */}
        {selectedCategory === 'all' && !searchQuery && popularProducts.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                الأكثر طلباً ومبيعاً
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularProducts.slice(0, 4).map((product) => (
                <div
                  key={product.id}
                  onClick={() => product.isAvailable && setCustomizingProduct(product)}
                  className={`group bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow-md hover:border-[#FF6321]/50 transition duration-200 flex flex-col justify-between ${
                    !product.isAvailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="relative h-44 rounded-lg overflow-hidden mb-3 bg-slate-100">
                    <img
                      src={product.image}
                      alt={product.nameAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {product.hasSpicyOption && (
                      <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <Flame className="w-3 h-3" />
                        حار / عادي
                      </span>
                    )}
                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs">
                        نفذت الكمية حالياً
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">{product.nameAr}</h4>
                      <span className="font-bold text-sm text-[#FF6321] whitespace-nowrap mr-1">
                        {product.price} ج.م
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {product.descriptionAr}
                    </p>
                  </div>

                  <button
                    disabled={!product.isAvailable}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.isAvailable) setCustomizingProduct(product);
                    }}
                    className="mt-3 w-full bg-orange-50 hover:bg-[#FF6321] text-[#FF6321] hover:text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>طلب وتخصيص</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full Menu Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              {selectedCategory === 'all'
                ? 'جميع الوجبات'
                : categories.find((c) => c.id === selectedCategory)?.nameAr}
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{filteredProducts.length} وجبة متاحة</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
              <Search className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-slate-800">لا توجد وجبات تطابق البحث</h4>
              <p className="text-xs text-slate-500 mt-1">جرب البحث بكلمة أخرى أو اختر قسماً آخر</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => product.isAvailable && setCustomizingProduct(product)}
                  className={`group bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm hover:shadow-md hover:border-[#FF6321]/40 transition duration-200 flex flex-col justify-between ${
                    !product.isAvailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="relative h-44 rounded-lg overflow-hidden mb-3 bg-slate-100">
                    <img
                      src={product.image}
                      alt={product.nameAr}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {product.hasSpicyOption && (
                      <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <Flame className="w-3 h-3" />
                        حار / عادي
                      </span>
                    )}
                    {!product.isAvailable && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center text-white font-bold text-xs">
                        غير متاح حالياً
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{product.nameAr}</h4>
                      <span className="font-bold text-sm text-[#FF6321] whitespace-nowrap">
                        {product.price} ج.م
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{product.nameEn}</div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {product.descriptionAr}
                    </p>
                  </div>

                  <button
                    disabled={!product.isAvailable}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (product.isAvailable) setCustomizingProduct(product);
                    }}
                    className="mt-3.5 w-full bg-slate-900 hover:bg-[#FF6321] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>أضف للطلب</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Restaurant GPS & Exact Location Section */}
        <RestaurantGpsSection />
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-40 animate-in fade-in slide-in-from-bottom-6">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-[#FF6321] hover:bg-[#e85516] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg flex items-center justify-between transition active:scale-95 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <span className="text-sm">إتمام الطلب والدفع</span>
            </div>
            <div className="text-base font-bold">
              {cart.reduce((s, i) => s + i.price * i.quantity, 0)} ج.م
            </div>
          </button>
        </div>
      )}

      {/* Product Customizer Modal */}
      <ProductModal
        product={customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onAddToCart={addToCart}
      />

      {/* Checkout Drawer */}
      <CheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(orderId) => {
          setActiveTrackingOrderId(orderId);
        }}
      />
    </div>
  );
};
