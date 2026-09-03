import React, { useState } from 'react';
import { useApp, AppRoute } from '../context/AppContext';
import {
  Lock,
  Unlock,
  X,
  Monitor,
  Bike,
  ShieldCheck,
  KeyRound,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const StaffPortalModal: React.FC = () => {
  const {
    isStaffModalOpen,
    setIsStaffModalOpen,
    unlockedScreens,
    unlockScreen,
    lockScreen,
    setCurrentRoute,
    targetLockedRoute,
    setTargetLockedRoute,
  } = useApp();

  const [selectedScreen, setSelectedScreen] = useState<Exclude<AppRoute, 'website'>>(
    (targetLockedRoute as Exclude<AppRoute, 'website'>) || 'pos'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isStaffModalOpen) return null;

  const screens: {
    id: Exclude<AppRoute, 'website'>;
    nameAr: string;
    roleDesc: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'pos',
      nameAr: 'كاشير المبيعات (POS)',
      roleDesc: 'إصدار الفواتير وطباعة البون الفوري',
      icon: <Monitor className="w-5 h-5" />,
      color: 'text-[#FF6321] bg-orange-50 border-orange-200',
    },
    {
      id: 'delivery',
      nameAr: 'مناديب وتوصيل الدليفري',
      roleDesc: 'تتبع الطيارين وإحداثيات الـ GPS',
      icon: <Bike className="w-5 h-5" />,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'admin',
      nameAr: 'لوحة الإدارة والتحكم',
      roleDesc: 'الأرباح والتقارير والمنيو والإعدادات',
      icon: <ShieldCheck className="w-5 h-5" />,
      color: 'text-purple-700 bg-purple-50 border-purple-200',
    },
  ];

  const currentScreenConfig = screens.find((s) => s.id === selectedScreen)!;
  const isSelectedUnlocked = unlockedScreens[selectedScreen];

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور أولاً');
      return;
    }

    const ok = unlockScreen(selectedScreen, passwordInput.trim());
    if (ok) {
      setPasswordInput('');
      setErrorMsg(null);
      setIsStaffModalOpen(false);
      setTargetLockedRoute(null);
    } else {
      setErrorMsg('كلمة المرور غير صحيحة! يرجى إعادة المحاولة.');
    }
  };

  const handleDirectGo = (route: Exclude<AppRoute, 'website'>) => {
    setCurrentRoute(route);
    setIsStaffModalOpen(false);
    setTargetLockedRoute(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FF6321] text-white flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">بوابة الموظفين والتشغيل الداخلي</h3>
              <p className="text-[11px] text-slate-500">اختر الشاشة وأدخل رمز المرور المخصص لها</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsStaffModalOpen(false);
              setTargetLockedRoute(null);
            }}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Screens Grid */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="text-xs font-bold text-slate-700">شاشات النظام المتاحة:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {screens.map((screen) => {
              const isSelected = selectedScreen === screen.id;
              const isUnlocked = unlockedScreens[screen.id];

              return (
                <div
                  key={screen.id}
                  onClick={() => {
                    setSelectedScreen(screen.id);
                    setPasswordInput('');
                    setErrorMsg(null);
                  }}
                  className={`p-3 rounded-xl border text-right cursor-pointer transition flex items-start gap-3 relative ${
                    isSelected
                      ? 'border-[#FF6321] bg-orange-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg border ${screen.color}`}>{screen.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-slate-900 truncate">{screen.nameAr}</span>
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          <Unlock className="w-2.5 h-2.5" /> مفتوحة
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full">
                          <Lock className="w-2.5 h-2.5" /> مقفلة
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{screen.roleDesc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Screen Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-[#FF6321]" />
                <span>التحقق من كلمة مرور: {currentScreenConfig.nameAr}</span>
              </span>
            </div>

            {isSelectedUnlocked ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>هذه الشاشة مفتوحة بالفعل في هذه الجلسة</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => lockScreen(selectedScreen)}
                    className="text-slate-500 hover:text-rose-600 text-[11px] underline"
                  >
                    قفل مجدداً
                  </button>
                  <button
                    onClick={() => handleDirectGo(selectedScreen)}
                    className="bg-[#FF6321] hover:bg-[#e85516] text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                  >
                    <span>الدخول للشاشة</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUnlock} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600">
                    أدخل رمز المرور (PIN):
                  </label>
                  <input
                    type="password"
                    placeholder={`أدخل كلمة المرور...`}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#FF6321] bg-white text-center font-mono tracking-widest"
                  />
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-lg text-xs font-bold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#FF6321] hover:bg-[#e85516] text-white font-bold py-2 rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>تأكيد الرمز والدخول إلى {currentScreenConfig.nameAr}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>نظام الحماية والأمان الداخلي &bull; تاكو بروست</span>
          </span>
          <button
            onClick={() => {
              setIsStaffModalOpen(false);
              setTargetLockedRoute(null);
            }}
            className="text-slate-500 hover:text-slate-800 font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
