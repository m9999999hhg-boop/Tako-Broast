import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { UnifiedNavbar } from './components/UnifiedNavbar';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { WebsiteView } from './views/WebsiteView';
import { PosView } from './views/PosView';
import { DeliveryView } from './views/DeliveryView';
import { AdminView } from './views/AdminView';
import { CheckoutDrawer } from './components/CheckoutDrawer';
import { ScreenLockGate } from './components/ScreenLockGate';
import { StaffPortalModal } from './components/StaffPortalModal';
import { Lock } from 'lucide-react';

function AppContent() {
  const {
    currentRoute,
    isScreenUnlocked,
    setIsStaffModalOpen,
    activeTrackingOrderId,
    setActiveTrackingOrderId,
  } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Render view or lock gate if screen password is required
  const renderScreenContent = () => {
    if (currentRoute === 'website') {
      return <WebsiteView />;
    }

    // Check if the current staff screen is unlocked
    if (!isScreenUnlocked(currentRoute)) {
      return <ScreenLockGate route={currentRoute} />;
    }

    switch (currentRoute) {
      case 'pos':
        return <PosView />;
      case 'delivery':
        return <DeliveryView />;
      case 'admin':
        return <AdminView />;
      default:
        return <WebsiteView />;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans antialiased text-slate-800 selection:bg-[#FF6321]/20 selection:text-[#FF6321]"
      dir="rtl"
    >
      {/* Top Multi-Route Unified Navigation Bar */}
      <UnifiedNavbar onOpenCart={() => setIsCartOpen(true)} />

      {/* Main View Router */}
      <div className="flex-1">{renderScreenContent()}</div>

      {/* Professional Polish System Footer */}
      <footer className="h-12 bg-white border-t border-slate-200 px-6 sm:px-8 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium print:hidden">
        <div className="flex items-center gap-4">
          <span>الخادم: 192.168.1.44</span>
          <span className="hidden sm:inline">الاستجابة: 24ms</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>الربط المباشر: متصل (SSE Live)</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-slate-400">&copy; 2024 TACO BROAST SYSTEM | ALL RIGHTS RESERVED</div>
          {currentRoute === 'website' && (
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="p-1 text-slate-300 hover:text-slate-600 opacity-25 hover:opacity-100 transition-opacity rounded cursor-pointer"
              title="بوابة التشغيل الداخلي"
              aria-label="Staff Access"
            >
              <Lock className="w-3 h-3" />
            </button>
          )}
        </div>
      </footer>

      {/* Checkout Drawer when opened from Navbar */}
      <CheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOrderSuccess={(orderId) => {
          setActiveTrackingOrderId(orderId);
        }}
      />

      {/* Global Staff Portal Modal */}
      <StaffPortalModal />

      {/* Global Thermal Receipt Modal (triggers automatically for new orders & manual reprint) */}
      <ThermalReceiptModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
