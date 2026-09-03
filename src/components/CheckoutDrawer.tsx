import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderType } from '../types';
import * as api from '../services/api';
import { LiveMap } from './LiveMap';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Bike,
  Store,
  Utensils,
  Navigation,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutDrawer: React.FC<CheckoutDrawerProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { cart, updateCartItemQuantity, removeFromCart, clearCart, cartSubtotal, settings, placeOrder } = useApp();

  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [tableNumber, setTableNumber] = useState('طاولة 1');
  const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'ONLINE'>('CASH');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneLookupMsg, setPhoneLookupMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Auto lookup customer if phone entered (Single Source of Truth)
  const handlePhoneBlur = async () => {
    if (customerPhone.trim().length >= 10) {
      try {
        const existing = await api.fetchCustomerByPhone(customerPhone);
        if (existing) {
          if (!customerName) setCustomerName(existing.name);
          if (existing.address && !deliveryAddress) setDeliveryAddress(existing.address);
          if (existing.location && !deliveryLocation) setDeliveryLocation(existing.location);
          setPhoneLookupMsg(`مرحباً بعودتك ${existing.name}! لديك ${existing.totalOrders} طلبات سابقة`);
        } else {
          setPhoneLookupMsg(null);
        }
      } catch (e) {
        // Safe catch
      }
    }
  };

  // HTML5 Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('خدمة تحديد الموقع غير مدعومة في متصفحك');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDeliveryLocation(coords);
        if (!deliveryAddress) {
          setDeliveryAddress('موقعي الحالي المحدد بنظام GPS');
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error or denied', err);
        // Fallback to nearby Sharkia coordinates
        setDeliveryLocation({ lat: 30.316, lng: 31.433 });
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const deliveryFee = orderType === 'DELIVERY' ? settings?.defaultDeliveryFee || 15 : 0;
  const taxRate = settings?.taxRate || 0.08;
  const tax = Math.round(cartSubtotal * taxRate * 10) / 10;
  const grandTotal = Math.round((cartSubtotal + deliveryFee + tax) * 10) / 10;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      alert('يرجى إدخال اسم العميل');
      return;
    }
    if (!customerPhone.trim()) {
      alert('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }
    if (orderType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert('يرجى إدخال عنوان التوصيل بالتفصيل');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await placeOrder({
        orderType,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
        deliveryLocation: orderType === 'DELIVERY' ? deliveryLocation : undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        tableNumber: orderType === 'DINE_IN' ? tableNumber : undefined,
        paymentMethod,
      });

      setIsSubmitting(false);
      onClose();
      onOrderSuccess(order.id);
    } catch (err: any) {
      alert(err.message || 'فشل إرسال الطلب');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
        {/* Top Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#FF6321]" />
            <h2 className="font-bold text-base">سلة طلبات تاكو بروست</h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
              {cart.reduce((s, i) => s + i.quantity, 0)} أصناف
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Cart Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">الوجبات المختارة</h3>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  إفراغ السلة
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl p-6">
                <div className="text-4xl mb-2">🌮</div>
                <div className="font-bold text-slate-700">السلة فارغة حالياً</div>
                <div className="text-xs text-slate-400 mt-1">اختر وجباتك المفضلة من المنيو بالأسفل</div>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => {
                  const extrasSum = (item.extras || []).reduce((s, e) => s + e.price, 0);
                  const itemPrice = item.price + extrasSum;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-sm text-slate-900">{item.nameAr}</div>
                        {item.spicyChoice && (
                          <div className="text-[11px] font-bold text-rose-600">
                            * {item.spicyChoice === 'SPICY' ? 'سبايسي حار' : 'عادي'}
                          </div>
                        )}
                        {item.extras && item.extras.length > 0 && (
                          <div className="text-[10px] text-slate-500">
                            + {item.extras.map((e) => `${e.nameAr} (${e.price}ج.م)`).join(', ')}
                          </div>
                        )}
                        <div className="text-xs font-bold text-[#FF6321] mt-0.5">{itemPrice * item.quantity} ج.م</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                          <button
                            onClick={() => updateCartItemQuantity(item.id, -1)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-r-lg"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItemQuantity(item.id, 1)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-l-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form fields only when cart is not empty */}
          {cart.length > 0 && (
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-5">
              {/* Order Type Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">نوع الطلب</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('DELIVERY')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      orderType === 'DELIVERY'
                        ? 'border-[#FF6321] bg-orange-50/80 text-[#FF6321] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bike className="w-5 h-5" />
                    <span>توصيل دليفري</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('TAKE_AWAY')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      orderType === 'TAKE_AWAY'
                        ? 'border-[#FF6321] bg-orange-50/80 text-[#FF6321] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-5 h-5" />
                    <span>سفري (تيك أواي)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderType('DINE_IN')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                      orderType === 'DINE_IN'
                        ? 'border-[#FF6321] bg-orange-50/80 text-[#FF6321] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Utensils className="w-5 h-5" />
                    <span>تناول بالفرع</span>
                  </button>
                </div>
              </div>

              {/* Customer Contact Information */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#FF6321]" />
                    بيانات العميل
                  </span>
                  {phoneLookupMsg && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {phoneLookupMsg}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">رقم الهاتف (للتواصل)</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="010XXXXXXXX"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        onBlur={handlePhoneBlur}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#FF6321]"
                        dir="ltr"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">الاسم بالكامل</label>
                    <input
                      type="text"
                      required
                      placeholder="اسم العميل"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#FF6321]"
                    />
                  </div>
                </div>

                {/* Dine-In Table number */}
                {orderType === 'DINE_IN' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">رقم الطاولة في الصالة</label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#FF6321]"
                      placeholder="مثال: طاولة 4"
                    />
                  </div>
                )}

                {/* Delivery Address & GPS Location */}
                {orderType === 'DELIVERY' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#FF6321]" />
                        عنوان التوصيل
                      </label>
                      <button
                        type="button"
                        onClick={handleUseMyLocation}
                        disabled={isLocating}
                        className="text-[11px] bg-white border border-[#FF6321] text-[#FF6321] hover:bg-orange-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition"
                      >
                        <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                        {isLocating ? 'جاري التحديد...' : 'استخدم موقعي الحالي (GPS)'}
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="الشارع، رقم العمارة، الشقة، علامة مميزة..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#FF6321]"
                    />

                    {/* Interactive GPS Leaflet Map */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500">
                        موقع التوصيل على الخريطة (انقر لتعديل مكانك بدقة):
                      </div>
                      <LiveMap
                        interactive={true}
                        customerLocation={deliveryLocation}
                        onSelectLocation={(loc) => setDeliveryLocation(loc)}
                        height="180px"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">ملاحظات للمندوب</label>
                      <input
                        type="text"
                        placeholder="مثال: الدور الثالث، الرن على الجرس..."
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#FF6321]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">طريقة السداد</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'CASH'
                        ? 'border-[#FF6321] bg-orange-50 text-[#FF6321] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>نقداً (كاش عند الاستلام)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ONLINE')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      paymentMethod === 'ONLINE'
                        ? 'border-[#FF6321] bg-orange-50 text-[#FF6321] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>دفع إلكتروني (بطاقة / محفظة)</span>
                  </button>
                </div>
              </div>

              {/* Receipt Summary Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold text-slate-800">{cartSubtotal} ج.م</span>
                </div>
                {orderType === 'DELIVERY' && (
                  <div className="flex justify-between text-slate-600">
                    <span>خدمة التوصيل السريع:</span>
                    <span className="font-bold text-[#FF6321]">+{deliveryFee} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>ضريبة القيمة المضافة (8%):</span>
                  <span className="font-bold text-slate-800">+{tax} ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-base text-slate-900 border-t border-slate-200 pt-2">
                  <span>الإجمالي المطلوب:</span>
                  <span className="text-[#FF6321]">{grandTotal} ج.م</span>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Bar */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200">
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              className="w-full bg-[#FF6321] hover:bg-[#e85516] disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-3 shadow-xs active:scale-95 transition"
            >
              <span>{isSubmitting ? 'جاري تسجيل الطلب...' : 'تأكيد وإرسال الطلب للمطعم'}</span>
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
