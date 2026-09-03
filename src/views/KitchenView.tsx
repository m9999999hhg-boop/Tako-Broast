import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertCircle,
  Volume2,
  VolumeX,
  Package,
} from 'lucide-react';

export const KitchenView: React.FC = () => {
  const { orders, updateStatus, currentUser } = useApp();
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(Date.now());

  // Tick clock every second for elapsed preparation time
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter kitchen tickets
  const kitchenOrders = orders.filter((order) => {
    if (order.status === 'CANCELLED') return false;
    if (filter === 'ACTIVE') {
      return order.status === 'NEW' || order.status === 'ACCEPTED' || order.status === 'PREPARING';
    }
    return true; // show all
  });

  const getElapsedTime = (createdAt: string) => {
    const diffSecs = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggleItemCheck = (orderId: string, idx: number) => {
    const key = `${orderId}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-900 text-white p-4 md:p-6 space-y-6">
      {/* Top KDS Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-800/90 p-4 rounded-2xl border border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#FF6321] flex items-center justify-center text-2xl shadow-sm">
            🍳
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>شاشة المطبخ والشواية (KDS)</span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                مزامنة حية لحظية
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              الشيف المسؤول: {currentUser.name} | الطلبات الجاري تحضيرها الآن: {kitchenOrders.length}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setFilter('ACTIVE')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filter === 'ACTIVE'
                ? 'bg-[#FF6321] text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            الطلبات النشطة ({orders.filter((o) => ['NEW', 'ACCEPTED', 'PREPARING'].includes(o.status)).length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
              filter === 'ALL'
                ? 'bg-[#FF6321] text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            جميع تذاكر اليوم ({orders.length})
          </button>
        </div>
      </div>

      {/* Ticket Cards Grid */}
      {kitchenOrders.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/40 rounded-2xl border border-slate-800 p-8">
          <CheckCircle2 className="w-16 h-16 text-emerald-500/50 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">جميع الطلبات تم تجهيزها بنجاح!</h3>
          <p className="text-xs text-slate-500 mt-1">المطبخ جاهز لاستقبال الطلبات الجديدة من الموقع والكاشير</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kitchenOrders.map((order) => {
            const elapsed = getElapsedTime(order.createdAt);
            const isLate = Math.floor((now - new Date(order.createdAt).getTime()) / 60000) > 15;

            return (
              <div
                key={order.id}
                className={`bg-slate-800 rounded-2xl border flex flex-col justify-between overflow-hidden shadow-sm transition duration-200 ${
                  order.status === 'PREPARING'
                    ? 'border-blue-500 ring-1 ring-blue-500/20'
                    : isLate
                    ? 'border-rose-500 animate-pulse'
                    : 'border-slate-700'
                }`}
              >
                {/* Ticket Header */}
                <div className="p-3.5 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-white">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.orderType === 'TAKE_AWAY'
                            ? 'bg-amber-500/20 text-amber-300'
                            : order.orderType === 'DELIVERY'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {order.orderType === 'TAKE_AWAY'
                          ? 'سفري'
                          : order.orderType === 'DELIVERY'
                          ? 'دليفري'
                          : `طاولة ${order.tableNumber || '-'}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      العميل: {order.customerName}
                    </div>
                  </div>

                  {/* Elapsed Timer */}
                  <div
                    className={`flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                      isLate ? 'bg-rose-500 text-white animate-bounce' : 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{elapsed}</span>
                  </div>
                </div>

                {/* Items to Cook */}
                <div className="p-3.5 space-y-2.5 flex-1 overflow-y-auto max-h-72">
                  {order.items.map((item, idx) => {
                    const isChecked = !!checkedItems[`${order.id}-${idx}`];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleItemCheck(order.id, idx)}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none transition ${
                          isChecked
                            ? 'bg-slate-900/60 border-slate-800 opacity-40 line-through'
                            : 'bg-slate-750/40 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#FF6321] text-white font-bold text-xs flex items-center justify-center">
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-sm text-white">{item.nameAr}</span>
                          </div>
                        </div>

                        {/* Spicy choice tag */}
                        {item.spicyChoice && (
                          <div className="mt-1 flex items-center gap-1 text-xs font-bold">
                            {item.spicyChoice === 'SPICY' ? (
                              <span className="text-rose-400 flex items-center gap-1 bg-rose-900/30 px-2 py-0.5 rounded-md">
                                <Flame className="w-3.5 h-3.5" /> سبايسي حار 🔥
                              </span>
                            ) : (
                              <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                عادي بارد
                              </span>
                            )}
                          </div>
                        )}

                        {/* Extras */}
                        {item.extras && item.extras.length > 0 && (
                          <div className="text-[11px] text-amber-400 mt-1 space-y-0.5">
                            {item.extras.map((ex, eIdx) => (
                              <div key={eIdx}>+ {ex.nameAr}</div>
                            ))}
                          </div>
                        )}

                        {/* Special request notes */}
                        {item.notes && (
                          <div className="text-[10px] text-slate-300 italic mt-1 bg-black/30 p-1 rounded">
                            ملاحظة: {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status action footer buttons */}
                <div className="p-3 bg-slate-900 border-t border-slate-700 grid grid-cols-2 gap-2">
                  {order.status !== 'PREPARING' && order.status !== 'READY' && (
                    <button
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>بدء التحضير والشواء</span>
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <>
                      <div className="text-[11px] font-bold text-blue-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        جاري الطهي
                      </div>
                      <button
                        onClick={() => updateStatus(order.id, 'READY')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>جاهز للتسليم 🔔</span>
                      </button>
                    </>
                  )}

                  {order.status === 'READY' && (
                    <div className="col-span-2 text-center py-1.5 bg-emerald-900/40 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30">
                      ✓ جاهز وبانتظار الاستلام
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
