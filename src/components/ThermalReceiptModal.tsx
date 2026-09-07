import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, Check, Utensils, ReceiptText, FileText } from 'lucide-react';

export const ThermalReceiptModal: React.FC = () => {
  const { activePrintReceipt, closePrintPreview, settings, isCashierAutoPrint } = useApp();
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
  // View modes: 'CUSTOMER' (بون الحساب), 'KITCHEN' (بون التجهيز), 'BOTH' (البونين معاً)
  const [slipMode, setSlipMode] = useState<'CUSTOMER' | 'KITCHEN' | 'BOTH'>('CUSTOMER');

  useEffect(() => {
    // Auto trigger browser print if auto print is enabled and not already printed
    if (activePrintReceipt && !activePrintReceipt.isReprint && isCashierAutoPrint && !hasAutoPrinted) {
      setHasAutoPrinted(true);
      const timer = setTimeout(() => {
        try {
          window.print();
        } catch (e) {
          console.warn('Auto print call handled:', e);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activePrintReceipt, isCashierAutoPrint, hasAutoPrinted]);

  if (!activePrintReceipt) return null;

  const { order, isReprint } = activePrintReceipt;

  const handlePrint = () => {
    window.print();
  };

  // Derive short bon number like "77" from orderNumber (e.g. #TB-8492 -> 92, or if short sequence)
  const rawNum = order.orderNumber.replace(/[^0-9]/g, '');
  const bonNumber = rawNum.length >= 2 ? rawNum.slice(-2) : (rawNum || '77');

  // Format date and time matching the photo: "3:45:46 2026-08-22"
  const orderDate = new Date(order.createdAt);
  const timeFormatted = orderDate.toLocaleTimeString('en-GB', { hour12: false });
  const dateFormatted = orderDate.toISOString().slice(0, 10);
  const dateTimeStr = `${timeFormatted} ${dateFormatted}`;

  // Cashier name (e.g. محمود / Jane Doe)
  const cashierDisplayName = order.cashierName || 'محمود';

  // Order type label for kitchen slip
  const kitchenTypeLabel =
    order.orderType === 'TAKE_AWAY'
      ? 'تجهيز تيك أواي'
      : order.orderType === 'DELIVERY'
      ? 'تجهيز دليفري'
      : order.orderType === 'DINE_IN'
      ? `تجهيز صالة (طاولة ${order.tableNumber || '-'})`
      : 'تجهيز أونلاين';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Control Bar (Hidden on print) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#FF6321] animate-pulse" />
            <div>
              <div className="font-bold text-sm">
                {isReprint ? 'إعادة طباعة بون (80mm)' : 'طباعة تلقائية جاهزة (80mm)'}
              </div>
              <div className="text-[10px] text-slate-400">طراز كاشير تاكو بروست الحراري الرسمي</div>
            </div>
          </div>
          <button
            onClick={closePrintPreview}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher for Slips (Print Choice) */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 print:hidden text-xs">
          <button
            onClick={() => setSlipMode('CUSTOMER')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              slipMode === 'CUSTOMER'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>بون العميل (الحساب)</span>
          </button>

          <button
            onClick={() => setSlipMode('KITCHEN')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              slipMode === 'KITCHEN'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>بون التجهيز (المطبخ)</span>
          </button>

          <button
            onClick={() => setSlipMode('BOTH')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              slipMode === 'BOTH'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>كلا البونين معاً</span>
          </button>
        </div>

        {/* Action Buttons bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 bg-[#FF6321] hover:bg-[#e85516] text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة فورية للطابعة الحرارية</span>
          </button>
          <button
            onClick={closePrintPreview}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>

        {/* Thermal Paper Preview Window */}
        <div className="p-4 bg-slate-200/80 flex justify-center max-h-[70vh] overflow-y-auto">
          <div
            id="thermal-receipt-container"
            className="w-[78mm] bg-white text-black p-3 text-xs font-mono shadow-md border border-slate-300 select-none space-y-4"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              color: '#000000',
              backgroundColor: '#ffffff',
            }}
          >
            {/* ======================================================== */}
            {/* SLIP 1: CUSTOMER RECEIPT (بون العميل والحساب)           */}
            {/* ======================================================== */}
            {(slipMode === 'CUSTOMER' || slipMode === 'BOTH') && (
              <div className="slip-customer space-y-2 border-b-2 border-dashed border-black pb-4 last:border-b-0 last:pb-0">
                {/* 1. TOP LOGO: Framed Burger with Grill & Flames */}
                <div className="flex justify-center">
                  <div className="border border-black p-1.5 text-center flex flex-col items-center justify-center w-28 h-20">
                    <svg
                      viewBox="0 0 100 80"
                      className="w-16 h-12 stroke-black fill-none"
                      style={{ shapeRendering: 'crispEdges' }}
                    >
                      {/* Fire / Flames rising from burger */}
                      <path
                        d="M 50 5 Q 45 18 36 22 Q 42 12 50 5 Z"
                        fill="#000"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      <path
                        d="M 50 5 Q 55 18 64 22 Q 58 12 50 5 Z"
                        fill="#000"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      <path
                        d="M 50 10 Q 50 20 48 24 Q 52 20 50 10 Z"
                        fill="#000"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      {/* Burger Top Bun */}
                      <path
                        d="M 22 40 C 22 26 78 26 78 40 Z"
                        fill="none"
                        stroke="#000"
                        strokeWidth="2.5"
                      />
                      {/* Seeds */}
                      <line x1="38" y1="31" x2="42" y2="31" stroke="#000" strokeWidth="1.5" />
                      <line x1="58" y1="31" x2="62" y2="31" stroke="#000" strokeWidth="1.5" />
                      <line x1="48" y1="35" x2="52" y2="35" stroke="#000" strokeWidth="1.5" />
                      {/* Burger Patty / Grill lines */}
                      <path
                        d="M 20 45 L 80 45 L 78 52 L 22 52 Z"
                        fill="#000"
                        stroke="#000"
                        strokeWidth="1"
                      />
                      {/* Lettuce ripple */}
                      <path
                        d="M 18 53 Q 28 58 38 53 Q 48 58 58 53 Q 68 58 82 53"
                        fill="none"
                        stroke="#000"
                        strokeWidth="2"
                      />
                      {/* Bottom Bun */}
                      <path
                        d="M 24 60 L 76 60 C 76 68 24 68 24 60 Z"
                        fill="none"
                        stroke="#000"
                        strokeWidth="2"
                      />
                    </svg>
                    <div className="text-[9px] font-black tracking-wider leading-none mt-0.5">
                      TACO BROAST
                    </div>
                  </div>
                </div>

                {/* 2. THREE-COLUMN HEADER (Time/Date/Shift - Cashier - Bon Number Box) */}
                <div className="grid grid-cols-3 items-stretch gap-1 text-[11px] pt-1">
                  {/* Left Column: Time & Date + Shift */}
                  <div className="text-right flex flex-col justify-between leading-tight font-bold">
                    <div className="text-[9px] font-mono leading-tight">{dateTimeStr}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-black">171</span>
                      <span className="text-[11px]">وردية</span>
                    </div>
                  </div>

                  {/* Middle Column: Cashier label & Name */}
                  <div className="text-center flex flex-col justify-between leading-tight font-bold">
                    <div className="text-[11px]">كاشير</div>
                    <div className="text-xs font-black">{cashierDisplayName}</div>
                  </div>

                  {/* Right Column: Bordered Bon Number Box (رقم البون 77) */}
                  <div className="border border-black text-center flex flex-col justify-between py-0.5 px-1 bg-white">
                    <div className="text-[10px] font-bold border-b border-black pb-0.5">رقم البون</div>
                    <div className="text-xl font-black tracking-wider leading-none py-1">
                      {bonNumber}
                    </div>
                  </div>
                </div>

                {/* Optional Customer / Order info */}
                <div className="text-[10px] text-zinc-800 flex justify-between border-t border-black pt-1">
                  <span>النوع: {order.orderType === 'DELIVERY' ? 'دليفري توصيل' : order.orderType === 'TAKE_AWAY' ? 'تيك أواي' : 'محلي'}</span>
                  <span>العميل: {order.customerName || 'الجمهور'}</span>
                </div>
                {order.customerPhone && (
                  <div className="text-[9px] text-zinc-700">هاتف العميل: {order.customerPhone}</div>
                )}
                {order.deliveryAddress && (
                  <div className="text-[9px] font-bold">العنوان: {order.deliveryAddress}</div>
                )}

                {/* 3. TABLE: Solid bordered grid with Qty | Item | Price | Value */}
                <div className="w-full border-t border-r border-black mt-1">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 text-center font-black text-[11px] bg-slate-50 border-b border-l border-black">
                    <div className="col-span-2 border-l border-black py-1">الكمية</div>
                    <div className="col-span-5 border-l border-black py-1">الصنف</div>
                    <div className="col-span-2 border-l border-black py-1">السعر</div>
                    <div className="col-span-3 py-1">القيمة</div>
                  </div>

                  {/* Table Body Rows */}
                  {order.items.map((item, idx) => {
                    const itemTotal = item.price * item.quantity;
                    return (
                      <div
                        key={idx}
                        className="grid grid-cols-12 text-center font-bold text-[11px] border-b border-l border-black items-center"
                      >
                        <div className="col-span-2 border-l border-black py-1 font-mono text-xs">
                          {item.quantity}
                        </div>
                        <div className="col-span-5 border-l border-black py-1 text-right px-1 leading-tight">
                          <div>{item.nameAr}</div>
                          {item.spicyChoice && (
                            <span className="text-[9px] text-zinc-600 block">
                              ({item.spicyChoice === 'SPICY' ? 'حار' : 'عادي'})
                            </span>
                          )}
                          {item.extras && item.extras.length > 0 && (
                            <div className="text-[8px] text-zinc-600">
                              {item.extras.map((ex) => `+ ${ex.nameAr}`).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2 border-l border-black py-1 font-mono text-[11px]">
                          {item.price}
                        </div>
                        <div className="col-span-3 py-1 font-mono font-black text-[11px]">
                          {itemTotal}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4. TOTALS SECTION: Left Box (المطلوب 10.00) & Right Rows (الاجمالي/الخصم/الضريبة) */}
                <div className="grid grid-cols-12 gap-2 pt-2 items-start text-xs">
                  {/* Left: Box for المطلوب */}
                  <div className="col-span-6 flex flex-col items-center justify-center">
                    <div className="font-bold text-xs mb-0.5">المطلوب</div>
                    <div className="border border-black w-full py-2 text-center bg-white shadow-2xs">
                      <span className="text-xl font-black tracking-tight font-mono">
                        {order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Right: Detailed amounts */}
                  <div className="col-span-6 space-y-1 font-bold text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs">{order.subtotal.toFixed(3)}</span>
                      <span>الاجمالي</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs">{order.discount.toFixed(3)}</span>
                      <span>الخصم</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs">{order.tax.toFixed(2)}</span>
                      <span>الضريبة</span>
                    </div>
                    {order.deliveryFee > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">{order.deliveryFee.toFixed(2)}</span>
                        <span>خدمة التوصيل</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. FOOTER PHONE NUMBERS */}
                <div className="border-t border-black pt-2 text-center text-[10px] font-mono font-bold tracking-wider" dir="ltr">
                  01279494845 : 01036130204
                </div>
                <div className="text-center text-[9px] text-zinc-700">
                  ش السنترال بجوار فرن العمده - شبرا النخلة
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SLIP 2: KITCHEN / PREPARATION SLIP (بون تجهيز المطبخ)    */}
            {/* Matches the background slip shown in the photo          */}
            {/* ======================================================== */}
            {(slipMode === 'KITCHEN' || slipMode === 'BOTH') && (
              <div className="slip-kitchen space-y-2 pt-2 border-t-2 border-dashed border-black">
                {/* Header: تجهيز تيك أواي / رقم البون 77 */}
                <div className="flex justify-between items-center border-b border-black pb-1">
                  <div className="text-right">
                    <div className="font-black text-sm">{kitchenTypeLabel}</div>
                    <div className="text-[10px] text-zinc-700 font-mono">{dateTimeStr}</div>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black text-white px-3 py-1 font-black rounded-xs">
                    <span className="text-xs">رقم البون</span>
                    <span className="text-lg">{bonNumber}</span>
                  </div>
                </div>

                {/* Cashier & Customer Info */}
                <div className="flex justify-between text-[11px] font-bold">
                  <div>
                    <span>كاشير: </span>
                    <span>{cashierDisplayName}</span>
                  </div>
                  <div>
                    <span>العميل: </span>
                    <span>{order.customerName || 'الجمهور'}</span>
                  </div>
                </div>

                {/* Kitchen items table: الكمية | الصنف | السعر */}
                <div className="w-full border-t border-r border-black">
                  <div className="grid grid-cols-12 text-center font-black text-[11px] bg-slate-50 border-b border-l border-black">
                    <div className="col-span-3 border-l border-black py-1">الكمية</div>
                    <div className="col-span-6 border-l border-black py-1">الصنف</div>
                    <div className="col-span-3 py-1">السعر</div>
                  </div>

                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 text-center font-bold text-xs border-b border-l border-black items-center py-0.5"
                    >
                      <div className="col-span-3 border-l border-black py-1 font-mono font-black text-sm">
                        {item.quantity}
                      </div>
                      <div className="col-span-6 border-l border-black py-1 text-right px-1 font-black">
                        <div>{item.nameAr}</div>
                        {item.spicyChoice && (
                          <span className="text-[10px] font-normal block">
                            [{item.spicyChoice === 'SPICY' ? 'حار SPICY' : 'عادي'}]
                          </span>
                        )}
                        {item.notes && (
                          <div className="text-[9px] italic text-zinc-700">ملاحظة: {item.notes}</div>
                        )}
                      </div>
                      <div className="col-span-3 py-1 font-mono text-[11px]">
                        {item.price}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kitchen Total */}
                <div className="flex justify-between items-center border border-black p-1.5 font-bold text-xs bg-slate-50">
                  <span>الاجمالي</span>
                  <span className="font-mono text-sm font-black">{order.total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 print:hidden flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>إيصال متطابق 100% مع طابعة كاشير تاكو بروست (80mm)</span>
        </div>
      </div>
    </div>
  );
};
