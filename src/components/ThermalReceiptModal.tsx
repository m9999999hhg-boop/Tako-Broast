import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, Check, Copy } from 'lucide-react';

export const ThermalReceiptModal: React.FC = () => {
  const { activePrintReceipt, closePrintPreview, settings } = useApp();

  useEffect(() => {
    // Auto trigger browser print if on POS or desktop
    if (activePrintReceipt) {
      const timer = setTimeout(() => {
        // Optional auto-print or visual feedback
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activePrintReceipt]);

  if (!activePrintReceipt) return null;

  const { order, isReprint } = activePrintReceipt;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden when printed via @media print) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#FF6321] animate-pulse" />
            <span className="font-bold text-sm">
              {isReprint ? 'إعادة طباعة إيصال (80mm)' : 'طباعة تلقائية جارية (80mm B&W)'}
            </span>
          </div>
          <button
            onClick={closePrintPreview}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-slate-900 hover:bg-black text-white py-2 px-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#FF6321]" />
            إرسال للطابعة الفعلية
          </button>
          <button
            onClick={closePrintPreview}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 px-4 rounded-lg text-sm font-semibold transition"
          >
            إغلاق
          </button>
        </div>

        {/* 80mm B&W Thermal Paper Container */}
        <div className="p-4 bg-slate-100 flex justify-center">
          <div
            id="thermal-receipt-container"
            className="w-[78mm] bg-white text-black p-3 text-xs font-mono shadow-xs border border-slate-300"
            style={{ fontFamily: 'monospace, Courier' }}
          >
            {/* Header / Logo text */}
            <div className="text-center border-b border-black pb-2 mb-2">
              <div className="font-black text-base tracking-wider">TACO BROAST</div>
              <div className="font-bold text-sm">تاكو بروست</div>
              <div className="text-[11px] mt-0.5">
                {settings?.addressAr || 'ش السنترال بجوار فرن العمده - شبرا النخلة'}
              </div>
              <div className="font-bold text-[11px]">هاتف ودليفري: {settings?.hotline || '01036130204'}</div>
              {isReprint && (
                <div className="mt-1 font-black border border-black px-2 py-0.5 inline-block text-[10px]">
                  *** نسخة مكررة - REPRINT ***
                </div>
              )}
            </div>

            {/* Order Meta */}
            <div className="border-b border-dashed border-black pb-2 mb-2 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span>رقم الطلب: {order.orderNumber}</span>
                <span>
                  {order.orderType === 'DELIVERY'
                    ? 'توصيل دليفري'
                    : order.orderType === 'TAKE_AWAY'
                    ? 'سفري (تيك أواي)'
                    : order.orderType === 'WEBSITE'
                    ? 'طلب أونلاين'
                    : `محلي (طاولة ${order.tableNumber || '-'})`}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-800">
                <span>التاريخ: {new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                <span>الوقت: {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-[10px] text-zinc-800">
                <span>الكاشير: {order.cashierName || 'Cashier 01'}</span>
                <span>العميل: {order.customerName}</span>
              </div>
              <div className="text-[10px]">رقم هاتف العميل: {order.customerPhone}</div>
              {order.deliveryAddress && (
                <div className="text-[10px] font-bold mt-0.5">العنوان: {order.deliveryAddress}</div>
              )}
              {order.deliveryInstructions && (
                <div className="text-[10px] italic">ملاحظات: {order.deliveryInstructions}</div>
              )}
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between font-bold border-b border-black pb-1 mb-1 text-[11px]">
                <span className="w-1/2">الصنف</span>
                <span className="w-12 text-center">الكمية</span>
                <span className="w-16 text-left">السعر</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-start">
                      <span className="w-1/2 font-bold leading-tight">{item.nameAr}</span>
                      <span className="w-12 text-center">{item.quantity}x</span>
                      <span className="w-16 text-left font-bold">{item.price * item.quantity} ج.م</span>
                    </div>
                    {item.spicyChoice && (
                      <div className="text-[10px] pr-2">
                        * {item.spicyChoice === 'SPICY' ? 'سبايسي حار' : 'عادي بارد'}
                      </div>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <div className="text-[10px] pr-2 text-zinc-700">
                        {item.extras.map((e, eIdx) => (
                          <div key={eIdx}>+ {e.nameAr} ({e.price} ج.م)</div>
                        ))}
                      </div>
                    )}
                    {item.notes && <div className="text-[9px] italic pr-2">ملاحظة: {item.notes}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Calculation */}
            <div className="border-b border-black pb-2 mb-2 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>{order.subtotal} ج.م</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span>الخصم:</span>
                  <span>-{order.discount} ج.م</span>
                </div>
              )}
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>خدمة التوصيل:</span>
                  <span>+{order.deliveryFee} ج.م</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>ضريبة القيمة المضافة (8%):</span>
                <span>+{order.tax} ج.م</span>
              </div>
              <div className="flex justify-between font-black text-sm border-t border-black pt-1 mt-1">
                <span>الإجمالي الكلي:</span>
                <span>{order.total} ج.م</span>
              </div>
            </div>

            {/* Payment Meta */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-black pb-2 mb-2">
              <div className="flex justify-between">
                <span>طريقة الدفع:</span>
                <span className="font-bold">
                  {order.paymentMethod === 'CARD' ? 'بطاقة بنكية (Visa/Master)' : order.paymentMethod === 'ONLINE' ? 'دفع إلكتروني' : 'نقداً (كاش)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>حالة السداد:</span>
                <span className="font-bold">{order.paymentStatus === 'PAID' ? 'تم الدفع (مدفوع)' : 'تحصيل عند الاستلام'}</span>
              </div>
            </div>

            {/* Barcode & Footer Greeting */}
            <div className="text-center pt-1 space-y-1">
              <div className="tracking-[4px] font-mono text-[10px] font-bold">
                * {order.orderNumber.replace('#', '')} *
              </div>
              <div className="h-6 bg-slate-900 mx-auto w-3/4 flex items-center justify-center text-white text-[8px] tracking-widest">
                ||| | |||| | ||| || |||
              </div>
              <div className="text-[10px] font-bold mt-1">شكراً لزيارتكم تاكو بروست!</div>
              <div className="text-[9px]">وجبة شهية وهنيئة دائماً</div>
            </div>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 print:hidden flex items-center justify-center gap-1">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>تم تسجيل مهمة الطباعة تلقائياً برمز فريد لتفادي التكرار</span>
        </div>
      </div>
    </div>
  );
};
