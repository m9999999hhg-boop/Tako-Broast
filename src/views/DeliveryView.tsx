import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { LiveMap } from '../components/LiveMap';
import {
  Bike,
  Navigation,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  Play,
  Pause,
  RotateCcw,
  ShieldCheck,
  DollarSign,
} from 'lucide-react';

export const DeliveryView: React.FC = () => {
  const { orders, updateStatus, updateDriverGPS, deliveryStaff, currentUser } = useApp();

  // Find active driver record
  const activeDriver = deliveryStaff[0]; // Ibrahim or first driver
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);
  const [isSimulatingRoute, setIsSimulatingRoute] = useState(false);
  const simIntervalRef = useRef<any>(null);

  // Filter delivery orders assigned or ready for delivery
  const deliveryOrders = orders.filter(
    (o) => o.orderType === 'DELIVERY' && o.status !== 'CANCELLED'
  );

  const activeAssignedOrder = deliveryOrders.find(
    (o) => o.status === 'OUT_FOR_DELIVERY' || o.status === 'ASSIGNED' || o.status === 'READY'
  );

  // Real Geolocation Watcher
  useEffect(() => {
    let watchId: number | null = null;
    if (isLiveGpsActive && navigator.geolocation && activeDriver) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          updateDriverGPS(activeDriver.id, pos.coords.latitude, pos.coords.longitude);
        },
        (err) => console.warn('GPS watch error', err),
        { enableHighAccuracy: true, maximumAge: 3000 }
      );
    }
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isLiveGpsActive, activeDriver, updateDriverGPS]);

  // Smooth GPS Simulation toward customer destination
  const handleToggleSimulation = () => {
    if (isSimulatingRoute) {
      clearInterval(simIntervalRef.current);
      setIsSimulatingRoute(false);
      return;
    }

    if (!activeAssignedOrder || !activeDriver) {
      alert('لا يوجد طلب نشط حالياً لمحاكاة مساره');
      return;
    }

    setIsSimulatingRoute(true);

    const startLat = 30.3125;
    const startLng = 31.4285;
    const targetLat = activeAssignedOrder.deliveryLocation?.lat || 30.318;
    const targetLng = activeAssignedOrder.deliveryLocation?.lng || 30.435;

    let step = 0;
    const totalSteps = 20;

    simIntervalRef.current = setInterval(() => {
      step++;
      const currentLat = startLat + ((targetLat - startLat) * step) / totalSteps;
      const currentLng = startLng + ((targetLng - startLng) * step) / totalSteps;

      updateDriverGPS(activeDriver.id, currentLat, currentLng);

      if (step >= totalSteps) {
        clearInterval(simIntervalRef.current);
        setIsSimulatingRoute(false);
      }
    }, 1500);
  };

  useEffect(() => {
    return () => clearInterval(simIntervalRef.current);
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Driver Status Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#FF6321] flex items-center justify-center text-3xl text-white shadow-xs">
            🛵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{activeDriver?.name || 'إبراهيم الطيار'}</h1>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                متاح للتوصيل
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              المركبة: {activeDriver?.vehicleType || 'موتوسيكل دايون'} ({activeDriver?.vehiclePlate || 'ق هـ ج 512'})
            </p>
          </div>
        </div>

        {/* GPS Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsLiveGpsActive(!isLiveGpsActive)}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              isLiveGpsActive
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLiveGpsActive ? 'animate-spin' : ''}`} />
            <span>{isLiveGpsActive ? 'بث الـ GPS الفعلي نشط' : 'تفعيل بث الـ GPS الحقيقي'}</span>
          </button>

          <button
            onClick={handleToggleSimulation}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
              isSimulatingRoute
                ? 'bg-amber-500 text-white shadow-xs animate-pulse'
                : 'bg-orange-50 text-[#FF6321] border border-[#FF6321]/30 hover:bg-orange-100'
            }`}
          >
            {isSimulatingRoute ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isSimulatingRoute ? 'إيقاف المحاكاة' : 'محاكاة حركة الموتوسيكل نحو العميل'}</span>
          </button>
        </div>
      </div>

      {/* Active Delivery Mission */}
      {activeAssignedOrder ? (
        <div className="bg-white p-6 rounded-xl border-2 border-[#FF6321] shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-[#FF6321] uppercase tracking-wider">
                مهمة التوصيل الحالية
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                الطلب {activeAssignedOrder.orderNumber}
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                العميل: <strong className="text-slate-800">{activeAssignedOrder.customerName}</strong> (
                {activeAssignedOrder.customerPhone})
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${activeAssignedOrder.customerPhone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Phone className="w-4 h-4" />
                <span>اتصال بالعميل</span>
              </a>
              <a
                href={`https://wa.me/20${activeAssignedOrder.customerPhone.replace(/^0+/, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-xs"
              >
                واتساب
              </a>
            </div>
          </div>

          {/* Delivery Address Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800">عنوان التوصيل: </span>
                <span className="text-slate-600">{activeAssignedOrder.deliveryAddress || 'موقع GPS محدد'}</span>
              </div>
            </div>
            {activeAssignedOrder.deliveryInstructions && (
              <div className="text-slate-500 text-[11px] pr-6">
                ملاحظات: {activeAssignedOrder.deliveryInstructions}
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
              <span>المبلغ المطلوب تحصيله نقداً:</span>
              <span className="text-base font-bold text-[#FF6321]">{activeAssignedOrder.total} ج.م</span>
            </div>
          </div>

          {/* Live Map of Driver & Destination */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>خريطة الملاحة الحية والموقع</span>
              {isSimulatingRoute && (
                <span className="text-amber-600 font-bold text-[11px] animate-pulse">
                  الموتوسيكل يتحرك الآن نحو العميل...
                </span>
              )}
            </div>
            <LiveMap
              customerLocation={activeAssignedOrder.deliveryLocation}
              driverLocation={activeAssignedOrder.driverLocation || activeDriver?.currentLocation}
              driverName={activeDriver?.name}
              height="300px"
            />
          </div>

          {/* Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {activeAssignedOrder.status !== 'OUT_FOR_DELIVERY' && (
              <button
                onClick={() => updateStatus(activeAssignedOrder.id, 'OUT_FOR_DELIVERY')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95"
              >
                <Bike className="w-4 h-4" />
                <span>استلمت من المطعم وفي الطريق للعميل 🚀</span>
              </button>
            )}

            <button
              onClick={() => updateStatus(activeAssignedOrder.id, 'DELIVERED')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-95 sm:col-span-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تم تسليم الطلب للعميل وتحصيل المبلغ ✓</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">لا توجد طلبات معلقة بانتظار التوصيل</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ستظهر الطلبات الجديدة هنا فور طلب أي عميل من الموقع أو الكاشير
          </p>
        </div>
      )}

      {/* History of Completed Deliveries */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900">سجل طلبات التوصيل اليوم</h3>
        <div className="divide-y divide-slate-100">
          {deliveryOrders.map((order) => (
            <div key={order.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-sm text-slate-900">
                  {order.orderNumber} - {order.customerName}
                </div>
                <div className="text-[11px] text-slate-500">{order.deliveryAddress || 'العنوان'}</div>
              </div>
              <div className="text-left">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : order.status === 'OUT_FOR_DELIVERY'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {order.status === 'DELIVERED'
                    ? 'تم التسليم'
                    : order.status === 'OUT_FOR_DELIVERY'
                    ? 'في الطريق'
                    : 'بانتظار الاستلام'}
                </span>
                <div className="font-bold text-sm text-[#FF6321] mt-1">{order.total} ج.م</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
