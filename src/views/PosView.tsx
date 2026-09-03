import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, OrderType, OrderItem } from '../types';
import * as api from '../services/api';
import {
  Search,
  Printer,
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  Flame,
  User,
  Phone,
  Utensils,
  Store,
  Bike,
  CreditCard,
  Banknote,
  RotateCcw,
  Sparkles,
  Barcode,
  MapPin,
  Building2,
  Compass,
  Navigation,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const {
    categories,
    products,
    placeOrder,
    orders,
    reprintReceipt,
    currentUser,
    settings,
    triggerManualPrint,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('TAKE_AWAY');
  const [tableNumber, setTableNumber] = useState('طاولة 1');

  // POS Order Items
  const [posItems, setPosItems] = useState<OrderItem[]>([]);
  const [customerName, setCustomerName] = useState('عميل نقدي');
  const [customerPhone, setCustomerPhone] = useState('01000000000');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  // Structured POS Delivery Location Details (Street, Building, Landmark, Description)
  const [streetName, setStreetName] = useState('');
  const [buildingDetails, setBuildingDetails] = useState('');
  const [district, setDistrict] = useState('شبرا النخلة');
  const [landmarkDesc, setLandmarkDesc] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isDetailedAddress, setIsDetailedAddress] = useState(true);

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastOrderSuccess, setLastOrderSuccess] = useState<string | null>(null);

  // Auto-fill customer if phone entered
  const handlePhoneBlur = async () => {
    if (customerPhone.trim().length >= 10) {
      try {
        const found = await api.fetchCustomerByPhone(customerPhone);
        if (found) {
          setCustomerName(found.name);
          if (found.address) setDeliveryAddress(found.address);
        }
      } catch (e) {
        // Safe catch
      }
    }
  };

  // Add product to POS ticket
  const handleAddProduct = (product: Product, spicy: 'NORMAL' | 'SPICY' = 'NORMAL') => {
    if (!product.isAvailable) return;

    setPosItems((prev) => {
      const existingIdx = prev.findIndex(
        (i) => i.productId === product.id && i.spicyChoice === (product.hasSpicyOption ? spicy : undefined)
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + 1,
        };
        return updated;
      }

      return [
        ...prev,
        {
          productId: product.id,
          nameAr: product.nameAr,
          nameEn: product.nameEn,
          price: product.price,
          quantity: 1,
          spicyChoice: product.hasSpicyOption ? spicy : undefined,
          extras: [],
        },
      ];
    });
  };

  const handleUpdateQuantity = (idx: number, delta: number) => {
    setPosItems((prev) =>
      prev
        .map((item, i) => {
          if (i === idx) {
            const newQ = item.quantity + delta;
            return newQ > 0 ? { ...item, quantity: newQ } : null;
          }
          return item;
        })
        .filter(Boolean) as OrderItem[]
    );
  };

  const handleRemoveItem = (idx: number) => {
    setPosItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = posItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = orderType === 'DELIVERY' ? settings?.defaultDeliveryFee || 15 : 0;
  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = Math.round(taxable * (settings?.taxRate || 0.08) * 10) / 10;
  const total = Math.round((taxable + deliveryFee + tax) * 10) / 10;

  // Complete & Print
  const handlePayAndPrint = async () => {
    if (posItems.length === 0) {
      alert('يرجى إضافة وجبات إلى الفاتورة أولاً');
      return;
    }

    // Build synthesized full address for delivery
    const getFinalAddress = () => {
      if (orderType !== 'DELIVERY') return undefined;
      if (!isDetailedAddress) {
        return deliveryAddress.trim() || 'شبرا النخلة';
      }
      const parts: string[] = [];
      if (district.trim()) parts.push(district.trim());
      if (streetName.trim()) parts.push(`شارع ${streetName.trim()}`);
      if (buildingDetails.trim()) parts.push(buildingDetails.trim());
      if (landmarkDesc.trim()) parts.push(`علامة مميزة: ${landmarkDesc.trim()}`);
      return parts.join(' - ') || deliveryAddress.trim() || 'شبرا النخلة';
    };

    const getFinalInstructions = () => {
      if (orderType !== 'DELIVERY') return undefined;
      const notes: string[] = [];
      if (landmarkDesc.trim()) notes.push(`الوصف: ${landmarkDesc.trim()}`);
      if (deliveryNotes.trim()) notes.push(`ملاحظات: ${deliveryNotes.trim()}`);
      return notes.length > 0 ? notes.join(' | ') : undefined;
    };

    setIsProcessing(true);
    try {
      const order = await placeOrder({
        orderType,
        customerName: customerName.trim() || 'عميل نقدي',
        customerPhone: customerPhone.trim() || '01000000000',
        deliveryAddress: getFinalAddress(),
        deliveryInstructions: getFinalInstructions(),
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        items: posItems,
        discount: discountAmount,
        paymentMethod,
        cashierName: currentUser.name,
      });

      setLastOrderSuccess(`تم إنشاء وطباعة الطلب ${order.orderNumber} بنجاح!`);
      // Reset POS ticket for next customer
      setPosItems([]);
      setDiscountAmount(0);
      setCustomerName('عميل نقدي');
      setCustomerPhone('01000000000');
      setDeliveryAddress('');
      setStreetName('');
      setBuildingDetails('');
      setLandmarkDesc('');
      setDeliveryNotes('');
      setIsProcessing(false);

      setTimeout(() => setLastOrderSuccess(null), 5000);
    } catch (err: any) {
      alert(err.message || 'فشل إتمام العملية');
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      p.nameAr.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery);
    return matchCat && matchSearch;
  });

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-[#F1F5F9] overflow-hidden select-none">
      {/* Top POS Action Toolbar matching Professional Polish */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-sm text-slate-900">نقطة البيع (POS Register 04)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-600 font-semibold">الكاشير: {currentUser.name}</span>
          <span className="hidden lg:inline text-slate-300">|</span>
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-[#FF6321]" />
            <span className="font-bold text-slate-700">{settings?.addressAr || 'ش السنترال بجوار فرن العمده - شبرا النخلة'}</span>
          </div>
          {settings?.autoPrintEnabled && (
            <span className="bg-emerald-50 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              <Printer className="w-3 h-3 text-emerald-600" />
              الطباعة التلقائية مفعلة (80mm)
            </span>
          )}
        </div>

        {/* Order Type Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setOrderType('TAKE_AWAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              orderType === 'TAKE_AWAY' ? 'bg-[#FF6321] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>سفري / تيك أواي (نسختين)</span>
          </button>
          <button
            onClick={() => setOrderType('DINE_IN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              orderType === 'DINE_IN' ? 'bg-[#FF6321] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>محلي (صالة)</span>
          </button>
          <button
            onClick={() => setOrderType('DELIVERY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              orderType === 'DELIVERY' ? 'bg-[#FF6321] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>توصيل دليفري (نسخة واحدة)</span>
          </button>
        </div>

        {/* Recent Order Reprint Fast Access */}
        <div className="flex items-center gap-2">
          {orders.length > 0 && (
            <button
              onClick={() => triggerManualPrint(orders[0])}
              className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition"
              title="إعادة طباعة آخر طلب"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة طباعة آخر طلب ({orders[0].orderNumber})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main POS Split Body: Left Categories, Center Product Grid, Right Cart */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Vertical Category Nav */}
        <div className="w-48 bg-white border-l border-slate-200 flex flex-col p-2 space-y-1 overflow-y-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`w-full p-2.5 rounded-xl text-xs font-bold text-right transition flex items-center justify-between ${
              selectedCategory === 'all'
                ? 'bg-[#FF6321] text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>جميع الأقسام</span>
            <span className="text-[10px] opacity-80">{products.length}</span>
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            const isSel = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full p-2.5 rounded-xl text-xs font-bold text-right transition flex items-center justify-between ${
                  isSel ? 'bg-[#FF6321] text-white shadow-xs' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{cat.nameAr}</span>
                <span className="text-[10px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Center: Search + Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden p-4 space-y-3">
          {/* Barcode & Text search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="ابحث بالاسم أو امسح الباركود (مثال: TB-B01 أو 62210001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-10 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#FF6321] shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5 pointer-events-none" />
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
          </div>

          {/* Alert banner if order just placed */}
          {lastOrderSuccess && (
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {lastOrderSuccess}
              </span>
              <button onClick={() => setLastOrderSuccess(null)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => prod.isAvailable && handleAddProduct(prod, 'NORMAL')}
                className={`bg-white rounded-xl p-2.5 border border-slate-200 shadow-xs hover:shadow-sm hover:border-[#FF6321]/50 transition duration-150 flex flex-col justify-between cursor-pointer active:scale-98 ${
                  !prod.isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="relative h-24 rounded-lg overflow-hidden mb-2 bg-slate-100">
                  <img
                    src={prod.image}
                    alt={prod.nameAr}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-mono px-1 rounded">
                    {prod.sku}
                  </span>
                </div>

                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-xs text-slate-900 leading-tight line-clamp-1">
                    {prod.nameAr}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{prod.nameEn}</div>
                </div>

                <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
                  <span className="font-bold text-sm text-[#FF6321]">{prod.price} ج.م</span>
                  {prod.hasSpicyOption && prod.isAvailable ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProduct(prod, 'SPICY');
                        }}
                        className="p-1 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 rounded-md text-[10px] font-bold transition"
                        title="إضافة سبايسي"
                      >
                        🌶️ حار
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddProduct(prod, 'NORMAL');
                        }}
                        className="p-1 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 rounded-md text-[10px] font-bold transition"
                        title="إضافة عادي"
                      >
                        عادي
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                      + إضافة
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Current Ticket / Cart */}
        <div className="w-80 md:w-96 bg-white border-r border-slate-200 flex flex-col shadow-sm">
          {/* Ticket Header with Customer info */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">بيانات الفاتورة الحالية</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {posItems.reduce((s, i) => s + i.quantity, 0)} أصناف
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <input
                  type="tel"
                  placeholder="هاتف العميل"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  onBlur={handlePhoneBlur}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#FF6321]"
                  dir="ltr"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="اسم العميل"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#FF6321]"
                />
              </div>
            </div>

            {orderType === 'DELIVERY' && (
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6321]" />
                    <span>تفاصيل موقع وعنوان التوصيل:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsDetailedAddress(!isDetailedAddress)}
                    className="text-[#FF6321] hover:underline font-bold text-[10px]"
                  >
                    {isDetailedAddress ? 'كتابة حرة بسيطة' : 'تفصيل بالشارع والوصف'}
                  </button>
                </div>

                {isDetailedAddress ? (
                  <div className="space-y-2 bg-slate-100/70 p-2 rounded-xl border border-slate-200">
                    {/* District & Street */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600">المنطقة / القرية</label>
                        <input
                          type="text"
                          placeholder="شبرا النخلة"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#FF6321]"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-slate-600">اسم الشارع</label>
                        <input
                          type="text"
                          placeholder="مثال: ش السنترال"
                          value={streetName}
                          onChange={(e) => setStreetName(e.target.value)}
                          className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#FF6321]"
                        />
                      </div>
                    </div>

                    {/* Building, Floor, Flat */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-slate-600">رقم العمارة / الطابق / الشقة</label>
                      <input
                        type="text"
                        placeholder="مثال: عمارة 5 - دور 3 - شقة 2"
                        value={buildingDetails}
                        onChange={(e) => setBuildingDetails(e.target.value)}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#FF6321]"
                      />
                    </div>

                    {/* Landmark / Description */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                        <span>الوصف والعلامة المميزة</span>
                        <span className="text-[9px] text-[#FF6321] font-bold">للطيار</span>
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: بجوار فرن العمدة / أمام صيدلية الأمل"
                        value={landmarkDesc}
                        onChange={(e) => setLandmarkDesc(e.target.value)}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#FF6321]"
                      />
                    </div>

                    {/* Quick Landmark Tag Shortcuts */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {['ش السنترال', 'فرن العمدة', 'المزلقان', 'المحطة', 'ش السوق', 'ميت حمل'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (!streetName) setStreetName(tag);
                            else if (!landmarkDesc) setLandmarkDesc(`بجوار ${tag}`);
                            else setLandmarkDesc(`${landmarkDesc} - ${tag}`);
                          }}
                          className="text-[9px] bg-white border border-slate-200 hover:border-[#FF6321] text-slate-600 px-1.5 py-0.5 rounded transition font-medium"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>

                    {/* Delivery Driver notes */}
                    <div className="space-y-0.5">
                      <label className="text-[10px] font-bold text-slate-600">ملاحظات تسليم للطيار</label>
                      <input
                        type="text"
                        placeholder="مثال: رن الجرس مرتين / تحصيل 200 ج"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        className="w-full px-2 py-1 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#FF6321]"
                      />
                    </div>

                    {/* Live Preview for Cashier */}
                    {(streetName || landmarkDesc || buildingDetails) && (
                      <div className="text-[10px] bg-orange-50 border border-orange-200 text-[#FF6321] p-1.5 rounded-md leading-relaxed">
                        <span className="font-bold">معاينة العنوان المطبوع: </span>
                        {[
                          district,
                          streetName ? `ش: ${streetName}` : '',
                          buildingDetails,
                          landmarkDesc ? `(علامة: ${landmarkDesc})` : '',
                        ]
                          .filter(Boolean)
                          .join(' - ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="عنوان التوصيل بالتفصيل والوصف والشارع..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#FF6321]"
                    />
                    <p className="text-[10px] text-slate-400">
                      اكتب الشارع ورقم العمارة وعلامة مميزة ووصف للمكان ليظهر في البون.
                    </p>
                  </div>
                )}
              </div>
            )}

            {orderType === 'DINE_IN' && (
              <input
                type="text"
                placeholder="رقم الطاولة (مثال: طاولة 4)"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-[#FF6321]"
              />
            )}
          </div>

          {/* Ticket Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {posItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs space-y-2">
                <Utensils className="w-8 h-8 mx-auto text-slate-300" />
                <div>الفاتورة فارغة</div>
                <div className="text-[10px]">انقر على أي صنف من القائمة لإضافته هنا</div>
              </div>
            ) : (
              posItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate">{item.nameAr}</div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{item.price} ج.م</span>
                      {item.spicyChoice && (
                        <span className="text-rose-600 font-bold">
                          * {item.spicyChoice === 'SPICY' ? 'سبايسي' : 'عادي'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                      <button
                        onClick={() => handleUpdateQuantity(idx, -1)}
                        className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(idx, 1)}
                        className="px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="w-14 text-left font-bold text-xs text-[#FF6321]">
                      {item.price * item.quantity} ج
                    </div>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Discounts */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center gap-1 text-[11px]">
            <span className="text-slate-500 font-bold px-1">خصم:</span>
            {[0, 10, 20, 30].map((amt) => (
              <button
                key={amt}
                onClick={() => setDiscountAmount(amt)}
                className={`px-2 py-1 rounded-md font-bold transition ${
                  discountAmount === amt
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {amt === 0 ? 'بدون' : `${amt} ج`}
              </button>
            ))}
          </div>

          {/* Totals & Payment Method */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المجموع الفرعي:</span>
              <span className="font-bold text-slate-800">{subtotal} ج.م</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>الخصم:</span>
                <span>-{discountAmount} ج.م</span>
              </div>
            )}
            {orderType === 'DELIVERY' && (
              <div className="flex justify-between text-slate-600">
                <span>التوصيل:</span>
                <span className="font-bold text-[#FF6321]">+{deliveryFee} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>ضريبة (8%):</span>
              <span className="font-bold text-slate-800">+{tax} ج.م</span>
            </div>
            <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-1.5">
              <span>الإجمالي:</span>
              <span className="text-[#FF6321]">{total} ج.م</span>
            </div>

            {/* Payment Selector */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'CASH'
                    ? 'border-[#FF6321] bg-orange-50 text-[#FF6321]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>نقداً (كاش)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`py-1.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  paymentMethod === 'CARD'
                    ? 'border-[#FF6321] bg-orange-50 text-[#FF6321]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>فيزا / شبكة</span>
              </button>
            </div>
          </div>

          {/* Action Button: Pay & Auto Print */}
          <div className="p-3 bg-white border-t border-slate-200">
            <button
              onClick={handlePayAndPrint}
              disabled={isProcessing || posItems.length === 0}
              className="w-full bg-[#FF6321] hover:bg-[#e85516] disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs active:scale-95 transition"
            >
              <Printer className="w-4 h-4" />
              <span className="text-sm">
                {isProcessing ? 'جاري الدفع والطباعة...' : `دفع وطباعة الإيصال (${total} ج.م)`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
