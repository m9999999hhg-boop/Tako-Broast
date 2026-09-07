import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Copy,
  Check,
  Phone,
  Clock,
  Compass,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { LiveMap } from './LiveMap';

interface RestaurantGpsSectionProps {
  onOrderNow?: () => void;
}

export const RestaurantGpsSection: React.FC<RestaurantGpsSectionProps> = ({ onOrderNow }) => {
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Exact coordinates for Taco Broast - Shubra El Nakhla
  const coords = {
    lat: 30.3125,
    lng: 31.4285,
  };

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2500);
  };

  return (
    <section id="restaurant-gps" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#FF6321]/10 text-[#FF6321] px-3 py-1 rounded-full text-xs font-bold mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>موقع الفرع المباشر &bull; GPS Location</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>موقع مطعم تاكو بروست على الـ GPS</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              مفتوح الآن
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            شبرا النخلة - ش السنترال بجوار فرن العمدة - مركز بلبيس - محافظة الشرقية
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FF6321] hover:bg-[#e85516] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            <span>الاتجاهات على Google Maps</span>
            <ExternalLink className="w-3 h-3 opacity-80" />
          </a>

          <button
            onClick={handleCopyCoords}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border border-slate-200"
            title="نسخ إحداثيات GPS"
          >
            {copiedCoords ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">تم نسخ الإحداثيات!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>نسخ إحداثيات GPS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Map + Details Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Live Map (7 cols) */}
        <div className="lg:col-span-7 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF6321]" />
              <span className="font-bold">خريطة تفاعلية حية (OpenStreetMap / GPS)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
            </span>
          </div>

          <div className="h-[340px] w-full relative">
            <LiveMap
              restaurantLocation={coords}
              interactive={false}
              height="340px"
            />
          </div>

          {/* Quick Map Overlay Footer */}
          <div className="p-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6321] inline-block" />
              <span>نقطة الفرع: بجوار فرن العمده والسنترال</span>
            </div>
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF6321] hover:underline font-bold flex items-center gap-1"
            >
              <span>فتح شاشة كاملة</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Details & Visiting info (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Exact Address Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <MapPin className="w-4 h-4 text-[#FF6321]" />
              <span>العنوان الدقيق ومعالم الوصول</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              <strong>محافظة الشرقية:</strong> مركز بلبيس، قرية شبرا النخلة، شارع السنترال الرئيسي، ملاصق مباشرة لفرن العمدة.
            </p>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              &bull; إمكانية الاصطفاف أمام المطعم متوفرة<br />
              &bull; صالة طعام مكيفة متوفرة للعائلات والأفراد
            </div>
          </div>

          {/* Phone Numbers & Hotlines Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Phone className="w-4 h-4 text-[#FF6321]" />
              <span>أرقام الهاتف وخدمة الدليفري السريع</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:01036130204"
                className="bg-white hover:bg-orange-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
              >
                <span>الخط الأساسي:</span>
                <span className="font-mono text-[#FF6321]" dir="ltr">01036130204</span>
              </a>
              <a
                href="tel:01279494845"
                className="bg-white hover:bg-orange-50 p-2 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 transition"
              >
                <span>الخط الثاني:</span>
                <span className="font-mono text-[#FF6321]" dir="ltr">01279494845</span>
              </a>
            </div>
          </div>

          {/* Working Hours Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <Clock className="w-4 h-4 text-[#FF6321]" />
              <span>مواعيد العمل واستقبال الطلبات</span>
            </div>
            <p className="text-xs text-slate-700">
              يومياً من <strong>11:00 صباحاً</strong> حتى <strong>02:00 بعد منتصف الليل</strong> (طوال أيام الأسبوع).
            </p>
          </div>

          {/* Delivery Guarantee Card */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">خدمة توصيل حية بتتبع GPS</div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                عند طلب الدليفري، يمكنك متابعة خط سير الكابتن لحظة بلحظة عبر خريطة الـ GPS الحية حتى باب منزلك.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
