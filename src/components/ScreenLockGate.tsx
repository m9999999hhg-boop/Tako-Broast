import React, { useState } from 'react';
import { useApp, AppRoute } from '../context/AppContext';
import {
  Lock,
  ShieldAlert,
  Monitor,
  Bike,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ScreenLockGateProps {
  route: AppRoute;
}

export const ScreenLockGate: React.FC<ScreenLockGateProps> = ({ route }) => {
  const { unlockScreen, lockScreen } = useApp();
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const screenDetails: Record<
    Exclude<AppRoute, 'website'>,
    { title: string; subtitle: string; icon: React.ReactNode }
  > = {
    pos: {
      title: 'شاشة الكاشير والمبيعات (POS)',
      subtitle: 'مخصصة للكاشير لإصدار الفواتير وطباعة الإيصالات والطلبات',
      icon: <Monitor className="w-8 h-8 text-[#FF6321]" />,
    },
    delivery: {
      title: 'شاشة مناديب وتوصيل الدليفري',
      subtitle: 'مخصصة لمتابعة المناديب والطيارين وتتبع خطوط السير بالـ GPS',
      icon: <Bike className="w-8 h-8 text-emerald-600" />,
    },
    admin: {
      title: 'لوحة الإدارة والتحكم الشاملة',
      subtitle: 'مخصصة للإدارة فقط للاطلاع على الأرباح، المبيعات، المنيو، وتعيين الإعدادات',
      icon: <ShieldCheck className="w-8 h-8 text-purple-600" />,
    },
  };

  if (route === 'website') return null;

  const currentDetails = screenDetails[route];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('يرجى إدخال كلمة المرور أولاً');
      return;
    }

    const success = unlockScreen(route, passwordInput.trim());
    if (!success) {
      setErrorMsg('كلمة المرور غير صحيحة! يرجى التأكد وإعادة المحاولة.');
      setPasswordInput('');
    } else {
      setErrorMsg(null);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Screen Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-inner">
          {currentDetails.icon}
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5 text-rose-500" />
            <span>شاشة محمية بكلمة مرور</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">{currentDetails.title}</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{currentDetails.subtitle}</p>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1 text-right">
            <label className="block text-xs font-bold text-slate-700">
              أدخل كلمة مرور هذه الشاشة:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="أدخل كلمة المرور..."
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#FF6321] focus:ring-2 focus:ring-[#FF6321]/20 font-mono tracking-widest text-center"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-700 p-0.5"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 justify-center animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              className="w-full bg-[#FF6321] hover:bg-[#e85516] text-white font-bold py-2.5 rounded-xl text-sm transition shadow-xs active:scale-98 flex items-center justify-center gap-2"
            >
              <span>تأكيد الدخول وفتح الشاشة</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>

            <button
              type="button"
              onClick={() => lockScreen(route)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى موقع العملاء</span>
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center text-[11px] text-slate-400 gap-1">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>الوصول مقتصر فقط على الكادر المصرح له</span>
        </div>
      </div>
    </div>
  );
};
