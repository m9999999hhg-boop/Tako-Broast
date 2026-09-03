import React from 'react';
import { useApp, AppRoute } from '../context/AppContext';
import {
  Globe,
  Monitor,
  Bike,
  ShieldCheck,
  Phone,
  ShoppingCart,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  UtensilsCrossed,
  Flame,
  MapPin,
} from 'lucide-react';

export const UnifiedNavbar: React.FC<{ onOpenCart?: () => void }> = ({ onOpenCart }) => {
  const {
    currentRoute,
    setCurrentRoute,
    isLiveConnected,
    currentUser,
    setCurrentUser,
    allUsers,
    cart,
    settings,
    isStaffModalOpen,
    setIsStaffModalOpen,
    lockScreen,
    unlockedScreens,
  } = useApp();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const staffScreens: { id: Exclude<AppRoute, 'website'>; label: string; icon: React.ReactNode }[] = [
    { id: 'pos', label: 'الكاشير (POS)', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'delivery', label: 'التوصيل GPS', icon: <Bike className="w-3.5 h-3.5" /> },
    { id: 'admin', label: 'لوحة الإدارة', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  ];

  const currentStaffScreen = staffScreens.find((s) => s.id === currentRoute);

  return (
    <header className="sticky top-0 z-40 bg-white text-slate-800 shadow-xs border-b border-slate-200 print:hidden">
      {/* Top micro bar with Hotline & Live SSE indicator */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-700">
            <Phone className="w-3.5 h-3.5 text-[#FF6321]" />
            <span className="text-slate-500 font-medium">الخط الساخن والدليفري:</span>
            <span className="font-bold text-slate-900 tracking-wider" dir="ltr">
              {settings?.hotline || '01036130204'}
            </span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline text-slate-500 font-medium">
            {settings?.addressAr || 'ش السنترال بجوار فرن العمده - شبرا النخلة'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Sync Badge */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 text-[11px] shadow-2xs">
            <span
              className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}
            />
            <span className={isLiveConnected ? 'text-slate-700 font-semibold' : 'text-rose-600 font-semibold'}>
              {isLiveConnected ? 'المزامنة الحية (SSE)' : 'جاري الاتصال...'}
            </span>
          </div>

          {/* If on a staff screen: display active user switcher */}
          {currentRoute !== 'website' && (
            <div className="flex items-center gap-1 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-[11px] shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-[#FF6321]" />
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const found = allUsers.find((u) => u.id === e.target.value);
                  if (found) setCurrentUser(found);
                }}
                className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white text-slate-800">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => setCurrentRoute('website')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-lg bg-[#FF6321] flex items-center justify-center text-white font-bold text-xl shadow-xs group-hover:bg-[#e85516] transition">
            🌮
          </div>
          <div>
            <div className="font-bold text-lg leading-tight tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>تاكو بروست</span>
              {currentRoute === 'website' ? (
                <span className="text-[10px] bg-orange-50 border border-orange-200 text-[#FF6321] px-1.5 py-0.2 rounded font-bold">
                  أونلاين
                </span>
              ) : (
                <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.2 rounded font-bold">
                  تشغيل داخلي
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              TACO BROAST &bull; SHUBRA EL-NAKHLA
            </div>
          </div>
        </div>

        {/* CUSTOMER MODE (When currentRoute === 'website') */}
        {currentRoute === 'website' && (
          <>
            {/* Customer Navigation Quick Links (Only customer visible items) */}
            <nav className="hidden md:flex items-center gap-2">
              <a
                href="#menu"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-[#FF6321] hover:bg-slate-50 transition"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 text-[#FF6321]" />
                <span>قائمة الوجبات</span>
              </a>
              <a
                href="#menu"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-[#FF6321] hover:bg-slate-50 transition"
              >
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>عروض التوفير</span>
              </a>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>شبرا النخلة - بجوار فرن العمدة</span>
              </div>
            </nav>

            {/* Right side buttons for customer website */}
            <div className="flex items-center gap-2">
              {/* Cart button */}
              {onOpenCart && (
                <button
                  onClick={onOpenCart}
                  className="relative flex items-center gap-2 bg-[#FF6321] hover:bg-[#e85516] text-white px-4 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-xs"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>السلة</span>
                  {totalCartCount > 0 && (
                    <span className="bg-white text-[#FF6321] font-black text-[11px] w-5 h-5 rounded-full flex items-center justify-center">
                      {totalCartCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          </>
        )}

        {/* STAFF MODE (When on POS, Kitchen, Delivery, or Admin) */}
        {currentRoute !== 'website' && (
          <div className="flex items-center gap-3">
            {/* Active Staff Screen Indicator & Switcher between unlocked screens */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {staffScreens.map((s) => {
                const isActive = currentRoute === s.id;
                const isUnlocked = unlockedScreens[s.id];
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      if (isUnlocked) {
                        setCurrentRoute(s.id);
                      } else {
                        setIsStaffModalOpen(true);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? 'bg-[#FF6321] text-white shadow-xs'
                        : isUnlocked
                        ? 'text-slate-700 hover:bg-white/80'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={isUnlocked ? `الانتقال إلى ${s.label}` : `${s.label} (مقفلة - تحتاج كلمة مرور)`}
                  >
                    {s.icon}
                    <span className="hidden sm:inline">{s.label}</span>
                    {!isUnlocked && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                  </button>
                );
              })}

              {/* More screens or Unlock new screen */}
              <button
                onClick={() => setIsStaffModalOpen(true)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white text-xs font-bold"
                title="فتح شاشة أخرى بالباسورد"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Lock Screen & Return to Customer View Button */}
            <button
              onClick={() => lockScreen(currentRoute)}
              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>قفل الشاشة والعودة للموقع</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

