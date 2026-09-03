import React from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import { LiveMap } from '../components/LiveMap';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bike,
  PackageCheck,
  Phone,
  MessageCircle,
  Printer,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface OrderTrackingViewProps {
  orderId: string;
  onBackToMenu: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orderId, onBackToMenu }) => {
  const { orders, triggerManualPrint, settings } = useApp();
  const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <ShieldAlert className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-zinc-800">لم يتم العثور على الطلب</h2>
        <p className="text-sm text-zinc-500 mt-1">يرجى التأكد من رقم الطلب والمحاولة مجدداً</p>
        <button
          onClick={onBackToMenu}
          className="mt-6 bg-[#FF5C00] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md"
        >
          العودة لقائمة الطعام
        </button>
      </div>
    );
  }

  const steps: { key: OrderStatus; labelAr: string; desc: string; icon: React.ReactNode }[] = [
    { key: 'NEW', labelAr: 'تم استلام الطلب', desc: 'وصل للمطعم وجاري مراجعته بالكاشير', icon: <Clock className="w-4 h-4" /> },
    { key: 'ACCEPTED', labelAr: 'تم القبول', desc: 'تم قبول الطلب وتوجيهه للمطبخ', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'PREPARING', labelAr: 'جاري التحضير بالمطبخ', desc: 'يتم الآن طهي الوجبة والبروست المقرمش طازجاً', icon: <ChefHat className="w-4 h-4" /> },
    { key: 'READY', labelAr: 'الوجبة جاهزة', desc: 'تم التجهيز والتغليف بإحكام', icon: <PackageCheck className="w-4 h-4" /> },
    { key: 'OUT_FOR_DELIVERY', labelAr: 'خرج مع مندوب التوصيل', desc: 'الكابتن في الطريق لموقعك الآن', icon: <Bike className="w-4 h-4" /> },
    { key: 'DELIVERED', labelAr: 'تم التسليم بنجاح', desc: 'بالهناء والشفاء! شكراً لطلبك من تاكو بروست', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const statusOrder: Record<OrderStatus, number> = {
    NEW: 0,
    ACCEPTED: 1,
    PREPARING: 2,
    READY: 3,
    ASSIGNED: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
    CANCELLED: -1,
  };

  const currentStepIndex = statusOrder[order.status] ?? 0;

  // Build WhatsApp share link
  const waMessage = encodeURIComponent(
    `مرحباً تاكو بروست، أستفسر عن طلبي رقم ${order.orderNumber} باسم ${order.customerName}`
  );
  const waLink = `https://wa.me/201036130204?text=${waMessage}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <button
            onClick={onBackToMenu}
            className="text-xs font-semibold text-slate-500 hover:text-[#FF6321] flex items-center gap-1 mb-2 transition"
          >
            <ChevronRight className="w-4 h-4" />
            العودة للمنيو
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">تتبع الطلب {order.orderNumber}</h1>
            <span className="bg-orange-50 border border-[#FF6321]/30 text-[#FF6321] font-bold text-xs px-3 py-1 rounded-full">
              {order.orderType === 'DELIVERY' ? 'توصيل دليفري' : order.orderType === 'TAKE_AWAY' ? 'سفري' : 'محلي بالفرع'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            وقت الإنشاء: {new Date(order.createdAt).toLocaleTimeString('ar-EG')} - الإجمالي: {order.total} ج.م
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => triggerManualPrint(order)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-lg transition"
          >
            <Printer className="w-4 h-4" />
            عرض الإيصال (80mm)
          </button>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-xs transition"
          >
            <MessageCircle className="w-4 h-4" />
            تواصل عبر واتساب
          </a>
        </div>
      </div>

      {/* Live Stepper */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          متابعة حالة الطلب لحظياً
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {steps.map((step, idx) => {
            const isCompleted = currentStepIndex >= idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div
                key={step.key}
                className={`p-4 rounded-xl border transition relative overflow-hidden ${
                  isCurrent
                    ? 'border-[#FF6321] bg-orange-50/60 shadow-xs ring-2 ring-[#FF6321]/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                    : 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? 'bg-[#FF6321] text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </span>
                  {isCurrent && <span className="text-[10px] font-bold text-[#FF6321] animate-pulse">الآن</span>}
                </div>
                <div className="font-bold text-xs leading-tight mb-1 text-slate-900">{step.labelAr}</div>
                <div className="text-[10px] text-slate-500 line-clamp-2">{step.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Driver GPS Tracking Map (if Delivery) */}
      {order.orderType === 'DELIVERY' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#FF6321]" />
                التتبع الحي لمندوب التوصيل على الخريطة (GPS)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                تحديث الموقع تلقائي وفوري عبر الأقمار الصناعية كل 3 ثوانٍ
              </p>
            </div>
            {order.driverName && (
              <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                المندوب: {order.driverName}
              </div>
            )}
          </div>

          {/* Map Container */}
          <LiveMap
            customerLocation={order.deliveryLocation}
            driverLocation={order.driverLocation}
            driverName={order.driverName}
            height="340px"
          />

          {/* Driver Card */}
          {order.driverName && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-xs">
                  🛵
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900">{order.driverName}</div>
                  <div className="text-xs text-slate-500">كابتن تاكو بروست السريع - موتوسيكل دايون</div>
                </div>
              </div>

              {order.driverPhone && (
                <a
                  href={`tel:${order.driverPhone}`}
                  className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Phone className="w-4 h-4 text-[#FF6321]" />
                  <span>اتصال بالمندوب ({order.driverPhone})</span>
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Order Items Review */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">تفاصيل الأصناف بالطلب</h3>
        <div className="divide-y divide-slate-100">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-3 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-sm text-slate-900">
                  {item.quantity}x {item.nameAr}
                </div>
                {item.spicyChoice && (
                  <div className="text-rose-600 font-bold text-[11px]">
                    * {item.spicyChoice === 'SPICY' ? 'سبايسي حار' : 'عادي'}
                  </div>
                )}
                {item.extras && item.extras.length > 0 && (
                  <div className="text-slate-500 text-[10px]">
                    + {item.extras.map((e) => `${e.nameAr} (${e.price}ج.م)`).join(', ')}
                  </div>
                )}
              </div>
              <div className="font-bold text-sm text-[#FF6321]">{item.price * item.quantity} ج.م</div>
            </div>
          ))}
        </div>

        {/* Pricing breakdown */}
        <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>المجموع الفرعي:</span>
            <span>{order.subtotal} ج.م</span>
          </div>
          {order.deliveryFee > 0 && (
            <div className="flex justify-between">
              <span>التوصيل:</span>
              <span>+{order.deliveryFee} ج.م</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>الضريبة:</span>
            <span>+{order.tax} ج.م</span>
          </div>
          <div className="flex justify-between font-bold text-base text-slate-900 pt-2 border-t border-slate-200">
            <span>الإجمالي:</span>
            <span className="text-[#FF6321]">{order.total} ج.م</span>
          </div>
        </div>
      </div>
    </div>
  );
};
