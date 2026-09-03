import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Product, OrderStatus } from '../types';
import * as api from '../services/api';
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  Boxes,
  Receipt,
  MessageSquare,
  Settings,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Download,
  Upload,
  Phone,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Lock,
  KeyRound,
  UserCog,
  Eye,
  EyeOff,
} from 'lucide-react';
import { AdminStaffManagement } from '../components/AdminStaffManagement';

type AdminTab =
  | 'overview'
  | 'products'
  | 'orders'
  | 'customers'
  | 'staff'
  | 'inventory'
  | 'expenses'
  | 'whatsapp'
  | 'settings'
  | 'logs';

export const AdminView: React.FC = () => {
  const {
    products,
    updateProduct,
    toggleAvailability,
    orders,
    updateStatus,
    assignDriver,
    customers,
    deliveryStaff,
    settings,
    updateSettings,
    triggerManualPrint,
    categories,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Analytics
  const [analytics, setAnalytics] = useState<{
    totalSales: number;
    totalOrdersCount: number;
    activeOrdersCount: number;
    totalExpenses: number;
    netProfit: number;
    topItems: { name: string; quantity: number }[];
  } | null>(null);

  // Inventory & Expenses
  const [inventory, setInventory] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [whatsappTemplates, setWhatsappTemplates] = useState<any[]>([]);

  // Modals / forms
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: 'مشتريات خامات', amount: '', description: '' });
  const [showSettingsPins, setShowSettingsPins] = useState<{ [key: string]: boolean }>({});

  const togglePinVisibility = (key: string) => {
    setShowSettingsPins((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const loadData = async () => {
    try {
      const [an, inv, exp, logs, wt] = await Promise.all([
        api.fetchAnalytics(),
        api.fetchInventory(),
        api.fetchExpenses(),
        api.fetchActivityLogs(),
        api.fetchWhatsAppTemplates(),
      ]);
      setAnalytics(an);
      setInventory(inv);
      setExpenses(exp);
      setActivityLogs(logs);
      setWhatsappTemplates(wt);
    } catch (e) {
      // Safe
    }
  };

  useEffect(() => {
    loadData();
  }, [orders, products]);

  // Handle Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.nameAr || !editingProduct?.price) return;

    if (editingProduct.id) {
      await updateProduct(editingProduct as Product);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        sku: editingProduct.sku || `TB-${Date.now().toString().slice(-4)}`,
        barcode: editingProduct.barcode || `${Date.now()}`,
        nameAr: editingProduct.nameAr,
        nameEn: editingProduct.nameEn || '',
        descriptionAr: editingProduct.descriptionAr || '',
        descriptionEn: editingProduct.descriptionEn || '',
        price: Number(editingProduct.price),
        costPrice: Number(editingProduct.costPrice || editingProduct.price * 0.55),
        categoryId: editingProduct.categoryId || categories[0]?.id || 'cat-broast',
        image:
          editingProduct.image ||
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isAvailable: editingProduct.isAvailable !== false,
        hasSpicyOption: !!editingProduct.hasSpicyOption,
      };
      await api.createProduct(newProd, 'Admin');
    }

    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || !newExpense.description) return;

    await api.addExpense({
      category: newExpense.category,
      amount: Number(newExpense.amount),
      description: newExpense.description,
      date: new Date().toISOString(),
      createdByName: 'أحمد الإداري',
    });
    setNewExpense({ category: 'مشتريات خامات', amount: '', description: '' });
    loadData();
  };

  // Restock inventory
  const handleRestock = async (id: string, current: number) => {
    const qtyStr = prompt('أدخل الكمية الجديدة الإجمالية في المخزن:', current.toString());
    if (qtyStr !== null) {
      const parsed = parseFloat(qtyStr);
      if (!isNaN(parsed)) {
        await api.updateInventoryStock(id, parsed, 'تعديل يدوي من لوحة الإدارة');
        loadData();
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F1F5F9] flex flex-col md:flex-row text-slate-800">
      {/* Sidebar Tabs matching Professional Polish Design */}
      <aside className="w-full md:w-64 bg-white border-l border-slate-200 p-4 space-y-2">
        <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          إدارة تاكو بروست &bull; Unified
        </div>
        <nav className="space-y-1">
          {[
            { id: 'overview', label: 'لوحة التحكم والأرباح', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'products', label: 'قائمة الطعام والوجبات', icon: <Package className="w-4 h-4" /> },
            { id: 'orders', label: 'إدارة الطلبات والعمليات', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'customers', label: 'سجل وبيانات العملاء', icon: <Users className="w-4 h-4" /> },
            { id: 'staff', label: 'الموظفون وفريق العمل', icon: <UserCog className="w-4 h-4" /> },
            { id: 'inventory', label: 'المخزون والخامات', icon: <Boxes className="w-4 h-4" /> },
            { id: 'expenses', label: 'المصروفات والتكاليف', icon: <Receipt className="w-4 h-4" /> },
            { id: 'whatsapp', label: 'رسائل واتساب الآلية', icon: <MessageSquare className="w-4 h-4" /> },
            { id: 'settings', label: 'إعدادات النظام والطباعة', icon: <Settings className="w-4 h-4" /> },
            { id: 'logs', label: 'سجل النشاطات والأمان', icon: <ShieldCheck className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-right transition ${
                activeTab === tab.id
                  ? 'bg-[#FF6321] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Admin Tab Body */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl space-y-6">
        {/* TAB 1: Overview & Metrics */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="font-bold text-xl text-slate-900">لوحة التحكم اللحظية (Live Dashboard)</h2>
                <div className="bg-orange-50 text-orange-700 border border-orange-200/60 px-3 py-1 rounded-full text-xs font-bold">
                  {orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length} طلبات جارية
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                اليوم: {new Date().toLocaleDateString('ar-EG')}
              </span>
            </div>

            {/* 4 Metric Cards matching Professional Polish Design */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <p className="text-xs text-slate-500 font-medium">إجمالي مبيعات اليوم (Daily Revenue)</p>
                <p className="text-2xl font-bold text-slate-900">{analytics?.totalSales || 0} ج.م</p>
                <div className="mt-1 text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% عن المتوسط</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <p className="text-xs text-slate-500 font-medium">الطلبات النشطة (Active Deliveries)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter((o) => o.orderType === 'DELIVERY' && o.status !== 'DELIVERED').length}
                </p>
                <div className="mt-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span>متوسط الوقت: 24 دقيقة</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <p className="text-xs text-slate-500 font-medium">ضغط المطبخ (Kitchen Load)</p>
                <p className="text-2xl font-bold text-slate-900">
                  {orders.filter((o) => o.status === 'PREPARING').length > 5 ? 'مرتفع' : 'معتدل'}
                </p>
                <div className="mt-1 text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span>طاقم التحضير والشواء نشط</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <p className="text-xs text-slate-500 font-medium">صافي الأرباح التقديرية (Net Profit)</p>
                <p className="text-2xl font-bold text-emerald-600">{analytics?.netProfit || 0} ج.م</p>
                <div className="mt-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span>بعد خصم التكاليف والمصروفات</span>
                </div>
              </div>
            </div>

            {/* Split layout: Recent Activity Real-Time Table & Thermal Print Queue / Top Items */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left col-span-8: Real-Time Activity Table */}
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">
                    النشاط المباشر والطلبات الحية (Recent Activity - Real Time)
                  </h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-[#FF6321] hover:underline font-bold"
                  >
                    عرض الكل
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-3">رقم الطلب</th>
                        <th className="px-6 py-3">المصدر</th>
                        <th className="px-6 py-3">الأصناف</th>
                        <th className="px-6 py-3">الحالة</th>
                        <th className="px-6 py-3">التتبع GPS</th>
                        <th className="px-6 py-3">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {orders.slice(0, 6).map((ord) => {
                        const isWebsite = ord.source === 'WEBSITE';
                        const itemsSummary = ord.items.map((i) => `${i.quantity}x ${i.nameAr}`).join(', ');
                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-6 py-3.5 font-bold text-slate-900">{ord.orderNumber}</td>
                            <td className="px-6 py-3.5">
                              {isWebsite ? (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200/60 px-2 py-0.5 rounded text-[10px] font-bold">
                                  WEBSITE
                                </span>
                              ) : (
                                <span className="bg-green-50 text-green-700 border border-green-200/60 px-2 py-0.5 rounded text-[10px] font-bold">
                                  POS
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 max-w-[200px] truncate text-slate-600 font-medium">
                              {itemsSummary}
                            </td>
                            <td className="px-6 py-3.5">
                              {ord.status === 'PREPARING' && (
                                <span className="text-orange-600 font-semibold bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded text-[10px]">
                                  جاري الطهي
                                </span>
                              )}
                              {ord.status === 'OUT_FOR_DELIVERY' && (
                                <span className="text-blue-600 font-semibold bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded text-[10px]">
                                  خرج للتوصيل
                                </span>
                              )}
                              {ord.status === 'DELIVERED' && (
                                <span className="text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded text-[10px]">
                                  تم التسليم
                                </span>
                              )}
                              {ord.status === 'NEW' && (
                                <span className="text-purple-600 font-semibold bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded text-[10px]">
                                  جديد
                                </span>
                              )}
                              {ord.status === 'READY' && (
                                <span className="text-amber-600 font-semibold bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded text-[10px]">
                                  جاهز
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5">
                              {ord.orderType === 'DELIVERY' ? (
                                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                                  LIVE
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                  داخلي
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 font-bold text-slate-900">{ord.total} ج.م</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right col-span-4: Auto-Print Queue & Top Sellers */}
              <div className="lg:col-span-4 space-y-6">
                {/* Auto-Print Queue Card from Design HTML */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      طابور الطباعة الحرارية (Auto-Print Queue)
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    {orders.length > 0 ? (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="w-9 h-9 bg-slate-900 rounded-md flex items-center justify-center text-white font-mono text-[10px] font-bold">
                          80mm
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800">
                            {orders[0].orderNumber} - {orders[0].customerName}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {orders[0].orderType === 'TAKE_AWAY'
                              ? 'طباعة 2 من 2 (سفري)'
                              : 'طباعة 1 من 1 (حراري)'}
                          </p>
                        </div>
                        <button
                          onClick={() => triggerManualPrint(orders[0])}
                          className="text-[#FF6321] hover:bg-orange-50 p-1.5 rounded-md transition"
                          title="إعادة الطباعة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                        لا توجد طلبات في طابور الطباعة
                      </div>
                    )}
                    <div className="p-2 border border-dashed border-slate-200 rounded-lg text-center">
                      <p className="text-[10px] text-slate-400">Next: بانتظار إشعار الطلبات الجديدة عبر SSE...</p>
                    </div>
                  </div>
                </div>

                {/* Top Selling Meals Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    الوجبات الأكثر مبيعاً اليوم
                  </h3>
                  <div className="space-y-2">
                    {(analytics?.topItems || []).slice(0, 5).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-orange-50 text-[#FF6321] font-bold flex items-center justify-center text-[10px] border border-orange-200/50">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{item.name}</span>
                        </div>
                        <span className="font-black text-[#FF6321]">{item.quantity} طلب</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Products & Menu Management */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">قائمة الطعام والوجبات</h2>
                <p className="text-xs text-slate-500">
                  تعديل الأسعار وتوافر الوجبات (ينعكس فوراً على الموقع والكاشير لحظياً بدون تحديث الصفحة)
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct({});
                  setIsAddingProduct(true);
                }}
                className="bg-[#FF6321] hover:bg-[#e85516] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة صنف جديد للمنيو</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">الصنف</th>
                      <th className="p-3.5">الباركود / SKU</th>
                      <th className="p-3.5">القسم</th>
                      <th className="p-3.5">سعر البيع</th>
                      <th className="p-3.5">سعر التكلفة</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((prod) => (
                      <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.nameAr}
                              className="w-10 h-10 rounded-xl object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="font-bold text-slate-900">{prod.nameAr}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{prod.nameEn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">{prod.sku}</td>
                        <td className="p-3.5">
                          {categories.find((c) => c.id === prod.categoryId)?.nameAr || '-'}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{prod.price} ج.م</td>
                        <td className="p-3.5 text-slate-500">{prod.costPrice} ج.م</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleAvailability(prod.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                              prod.isAvailable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            {prod.isAvailable ? 'متاح للطلب ✓' : 'غير متاح (نفذ)'}
                          </button>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsAddingProduct(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-[#FF6321] hover:bg-slate-100 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit / Add Product Modal */}
            {isAddingProduct && editingProduct && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-900">
                    {editingProduct.id ? 'تعديل الصنف' : 'إضافة وجبة جديدة'}
                  </h3>

                  <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700">الاسم بالعربي</label>
                        <input
                          type="text"
                          required
                          value={editingProduct.nameAr || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:border-[#FF6321] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700">الاسم بالإنجليزي</label>
                        <input
                          type="text"
                          value={editingProduct.nameEn || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:border-[#FF6321] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-700">سعر البيع (ج.م)</label>
                        <input
                          type="number"
                          required
                          value={editingProduct.price || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:border-[#FF6321] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700">سعر التكلفة (ج.م)</label>
                        <input
                          type="number"
                          value={editingProduct.costPrice || ''}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:border-[#FF6321] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700">رابط صورة الوجبة</label>
                      <input
                        type="url"
                        value={editingProduct.image || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 mt-1 focus:border-[#FF6321] outline-none"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700">الوصف بالعربي</label>
                      <textarea
                        value={editingProduct.descriptionAr || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 mt-1 h-16 focus:border-[#FF6321] outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={editingProduct.hasSpicyOption !== false}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, hasSpicyOption: e.target.checked })
                          }
                        />
                        <span>يدعم خيار سبايسي حار / بارد</span>
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-[#FF6321] hover:bg-[#e85516] text-white font-bold shadow-xs transition"
                      >
                        حفظ التغييرات
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Orders CRM */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">سجل الطلبات والعمليات</h2>
                <p className="text-xs text-slate-500">متابعة حالات الطلبات، تعيين مندوبي التوصيل وإعادة الطباعة</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">رقم الطلب</th>
                      <th className="p-3.5">النوع</th>
                      <th className="p-3.5">العميل</th>
                      <th className="p-3.5">الأصناف</th>
                      <th className="p-3.5">الإجمالي</th>
                      <th className="p-3.5">الحالة</th>
                      <th className="p-3.5">مندوب التوصيل</th>
                      <th className="p-3.5 text-center">طباعة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                        <td className="p-3.5">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
                            {ord.orderType === 'DELIVERY'
                              ? 'دليفري'
                              : ord.orderType === 'TAKE_AWAY'
                              ? 'سفري'
                              : 'محلي'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{ord.customerName}</div>
                          <div className="text-[10px] text-slate-500">{ord.customerPhone}</div>
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-700">
                          {ord.items.map((i) => `${i.quantity}x ${i.nameAr}`).join(', ')}
                        </td>
                        <td className="p-3.5 font-bold text-[#FF6321]">{ord.total} ج.م</td>
                        <td className="p-3.5">
                          <select
                            value={ord.status}
                            onChange={(e) => updateStatus(ord.id, e.target.value as OrderStatus)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-800"
                          >
                            <option value="NEW">جديد (NEW)</option>
                            <option value="ACCEPTED">مقبول (ACCEPTED)</option>
                            <option value="PREPARING">تحضير (PREPARING)</option>
                            <option value="READY">جاهز (READY)</option>
                            <option value="OUT_FOR_DELIVERY">خرج للتوصيل (OUT_FOR_DELIVERY)</option>
                            <option value="DELIVERED">تم التسليم (DELIVERED)</option>
                            <option value="CANCELLED">ملغي (CANCELLED)</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          {ord.orderType === 'DELIVERY' ? (
                            <select
                              value={ord.driverId || ''}
                              onChange={(e) => assignDriver(ord.id, e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-800"
                            >
                              <option value="">اختر مندوب...</option>
                              {deliveryStaff.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => triggerManualPrint(ord)}
                            className="p-1.5 text-slate-600 hover:text-[#FF6321] hover:bg-slate-100 rounded-lg transition"
                            title="إعادة طباعة البون 80mm"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Customers CRM */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">سجل وبيانات العملاء (Unified CRM)</h2>
              <p className="text-xs text-slate-500">
                قاعدة بيانات موحدة - رقم هاتف العميل مفتاح وحيد يمنع تكرار الحسابات
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">العميل</th>
                      <th className="p-3.5">رقم الهاتف</th>
                      <th className="p-3.5">العنوان المحفوظ</th>
                      <th className="p-3.5">إجمالي الطلبات</th>
                      <th className="p-3.5">إجمالي المدفوعات</th>
                      <th className="p-3.5">آخر طلب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50/70 transition">
                        <td className="p-3.5 font-bold text-slate-900">{cust.name}</td>
                        <td className="p-3.5 font-mono text-slate-600" dir="ltr">
                          {cust.phone}
                        </td>
                        <td className="p-3.5 text-slate-600">{cust.address || '-'}</td>
                        <td className="p-3.5 font-bold text-slate-800">{cust.totalOrders} طلبات</td>
                        <td className="p-3.5 font-bold text-[#FF6321]">{cust.totalSpent} ج.م</td>
                        <td className="p-3.5 text-[10px] text-slate-500">
                          {cust.lastOrderAt ? new Date(cust.lastOrderAt).toLocaleDateString('ar-EG') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Staff Management */}
        {activeTab === 'staff' && <AdminStaffManagement />}

        {/* TAB 5: Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">المخزون والخامات</h2>
                <p className="text-xs text-slate-500">متابعة كميات الدواجن واللحوم وورق الطباعة والحدود الدنيا</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">الصنف المخزني</th>
                      <th className="p-3.5">التصنيف</th>
                      <th className="p-3.5">الكمية الحالية</th>
                      <th className="p-3.5">حد الأمان</th>
                      <th className="p-3.5">تكلفة الوحدة</th>
                      <th className="p-3.5 text-center">إعادة شحن / جرد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventory.map((inv) => {
                      const isLow = inv.currentStock <= inv.minThreshold;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3.5 font-bold text-slate-900">{inv.nameAr}</td>
                          <td className="p-3.5 text-slate-500">{inv.category}</td>
                          <td className="p-3.5">
                            <span
                              className={`font-bold text-sm ${isLow ? 'text-rose-600 animate-pulse' : 'text-slate-900'}`}
                            >
                              {inv.currentStock} {inv.unit}
                            </span>
                            {isLow && (
                              <span className="mr-2 text-[10px] bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                                كمية منخفضة!
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-500">
                            {inv.minThreshold} {inv.unit}
                          </td>
                          <td className="p-3.5 font-mono">{inv.costPerUnit} ج.م</td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleRestock(inv.id, inv.currentStock)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 rounded-lg text-xs font-bold transition"
                            >
                              تعديل الكمية
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: Expenses */}
        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">المصروفات والتكاليف</h2>
                <p className="text-xs text-slate-500">تسجيل الفواتير، الغاز، المشتريات ومستلزمات التشغيل</p>
              </div>
            </div>

            {/* Add Expense Form */}
            <form onSubmit={handleAddExpense} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-end gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">بند المصروف</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="مشتريات خامات">مشتريات خامات (دواجن/لحوم)</option>
                  <option value="فواتير ومرافق">فواتير ومرافق (غاز/كهرباء)</option>
                  <option value="نثريات وطباعة">نثريات وطباعة (ورق 80مم)</option>
                  <option value="صيانة ومعدات">صيانة ومعدات</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">المبلغ (ج.م)</label>
                <input
                  type="number"
                  required
                  placeholder="المبلغ"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 w-32 focus:border-[#FF6321] outline-none"
                />
              </div>

              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="font-bold text-slate-700">بيان المصروف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة تعبئة أسطوانة غاز للشواية..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#FF6321] outline-none"
                />
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-[#FF6321] text-white font-bold px-5 py-2.5 rounded-xl transition"
              >
                + تسجيل المصروف
              </button>
            </form>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3.5">البند</th>
                    <th className="p-3.5">البيان</th>
                    <th className="p-3.5">المبلغ</th>
                    <th className="p-3.5">المسؤول</th>
                    <th className="p-3.5">التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-bold text-slate-900">{exp.category}</td>
                      <td className="p-3.5 text-slate-700">{exp.description}</td>
                      <td className="p-3.5 font-bold text-rose-600">{exp.amount} ج.م</td>
                      <td className="p-3.5 text-slate-500">{exp.createdByName}</td>
                      <td className="p-3.5 text-[10px] text-slate-400">
                        {new Date(exp.date).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: WhatsApp Templates */}
        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">رسائل واتساب الآلية للعملاء</h2>
              <p className="text-xs text-slate-500">
                تخصيص القوالب التلقائية لإرسال تحديثات الطلب مباشرة للعملاء
              </p>
            </div>

            <div className="space-y-4">
              {whatsappTemplates.map((tpl) => (
                <div key={tpl.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      {tpl.titleAr} ({tpl.key})
                    </h4>
                  </div>
                  <textarea
                    value={tpl.body}
                    onChange={(e) => {
                      const updated = whatsappTemplates.map((t) =>
                        t.id === tpl.id ? { ...t, body: e.target.value } : t
                      );
                      setWhatsappTemplates(updated);
                    }}
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#FF6321] h-20"
                  />
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span>المتغيرات المتاحة: {'{CUSTOMER_NAME}, {ORDER_NO}, {TOTAL}, {DRIVER_NAME}'}</span>
                    <button
                      onClick={() => api.updateWhatsAppTemplate(tpl.id, tpl.body)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition"
                    >
                      حفظ القالب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: Settings & Paper Rules */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">إعدادات النظام والطباعة</h2>
              <p className="text-xs text-slate-500">ضبط إحداثيات الفرع، أسعار التوصيل وقواعد طباعة البون</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">اسم المطعم بالعربي</label>
                  <input
                    type="text"
                    value={settings?.restaurantNameAr || ''}
                    onChange={(e) => updateSettings({ restaurantNameAr: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#FF6321] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">الخط الساخن والدليفري</label>
                  <input
                    type="text"
                    value={settings?.hotline || ''}
                    onChange={(e) => updateSettings({ hotline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#FF6321] outline-none"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">عنوان الفرع بالتفصيل</label>
                <input
                  type="text"
                  value={settings?.addressAr || ''}
                  onChange={(e) => updateSettings({ addressAr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#FF6321] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">خدمة التوصيل الافتراضية (ج.م)</label>
                  <input
                    type="number"
                    value={settings?.defaultDeliveryFee || 15}
                    onChange={(e) => updateSettings({ defaultDeliveryFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#FF6321] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">نسبة الضريبة</label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings?.taxRate || 0.08}
                    onChange={(e) => updateSettings({ taxRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-[#FF6321] outline-none"
                  />
                </div>
              </div>

              {/* Printing Rules */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#FF6321]" />
                  قواعد طباعة الإيصالات الحرارية (80mm)
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={settings?.autoPrintEnabled !== false}
                      onChange={(e) => updateSettings({ autoPrintEnabled: e.target.checked })}
                    />
                    <span>تفعيل الطباعة التلقائية الفورية عند وصول أي طلب جديد (بدون تأكيد يدوي)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 pr-6">
                    يقوم الكاشير بطباعة البون فورياً بدون نوافذ تأكيد مع نظام تتبع آمن يمنع الطباعة المكررة.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800">طلبات التيك أواي (سفري)</div>
                    <div className="text-[#FF6321] font-bold text-base mt-1">نسختين (عميل + مطبخ)</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800">طلبات الدليفري (توصيل)</div>
                    <div className="text-[#FF6321] font-bold text-base mt-1">نسخة واحدة للمندوب</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-800">طلبات الصالة (محلي)</div>
                    <div className="text-[#FF6321] font-bold text-base mt-1">نسخة واحدة للطاولة</div>
                  </div>
                </div>
              </div>

              {/* Screen Passwords Section */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#FF6321]" />
                      <span>كلمات مرور الشاشات ونظام الحماية (Staff Passwords)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      تحديد كلمة المرور المخصصة لكل شاشة داخلية لحمايتها وعزلها بأمان (كلمات المرور مخفية افتراضياً)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* POS PIN */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>كاشير الفرع (POS)</span>
                      <span className="text-[10px] text-slate-400">شاشة البيع</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSettingsPins['pos'] ? 'text' : 'password'}
                        value={settings?.screenPasswords?.pos ?? '1234'}
                        onChange={(e) =>
                          updateSettings({
                            screenPasswords: {
                              pos: e.target.value,
                              delivery: settings?.screenPasswords?.delivery || '3333',
                              admin: settings?.screenPasswords?.admin || '9999',
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 pl-8 rounded-lg border border-slate-200 bg-white font-mono text-center font-bold tracking-widest text-[#FF6321] focus:border-[#FF6321] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => togglePinVisibility('pos')}
                        className="absolute left-2 top-2 text-slate-400 hover:text-slate-600"
                        title={showSettingsPins['pos'] ? 'إخفاء' : 'إظهار'}
                      >
                        {showSettingsPins['pos'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Delivery PIN */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>مناديب التوصيل</span>
                      <span className="text-[10px] text-slate-400">شاشة الـ GPS</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSettingsPins['delivery'] ? 'text' : 'password'}
                        value={settings?.screenPasswords?.delivery ?? '3333'}
                        onChange={(e) =>
                          updateSettings({
                            screenPasswords: {
                              pos: settings?.screenPasswords?.pos || '1234',
                              delivery: e.target.value,
                              admin: settings?.screenPasswords?.admin || '9999',
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 pl-8 rounded-lg border border-slate-200 bg-white font-mono text-center font-bold tracking-widest text-emerald-700 focus:border-[#FF6321] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => togglePinVisibility('delivery')}
                        className="absolute left-2 top-2 text-slate-400 hover:text-slate-600"
                        title={showSettingsPins['delivery'] ? 'إخفاء' : 'إظهار'}
                      >
                        {showSettingsPins['delivery'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Admin PIN */}
                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="font-bold text-slate-700 flex items-center justify-between">
                      <span>لوحة الإدارة</span>
                      <span className="text-[10px] text-slate-400">التحكم الشامل</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showSettingsPins['admin'] ? 'text' : 'password'}
                        value={settings?.screenPasswords?.admin ?? '9999'}
                        onChange={(e) =>
                          updateSettings({
                            screenPasswords: {
                              pos: settings?.screenPasswords?.pos || '1234',
                              delivery: settings?.screenPasswords?.delivery || '3333',
                              admin: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 pl-8 rounded-lg border border-slate-200 bg-white font-mono text-center font-bold tracking-widest text-purple-700 focus:border-[#FF6321] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => togglePinVisibility('admin')}
                        className="absolute left-2 top-2 text-slate-400 hover:text-slate-600"
                        title={showSettingsPins['admin'] ? 'إخفاء' : 'إظهار'}
                      >
                        {showSettingsPins['admin'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Backup & Restore Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-slate-900">النسخ الاحتياطي والاستعادة</h4>
                  <p className="text-[11px] text-slate-500">حفظ نسخة كاملة من قاعدة البيانات الموحدة أو استرجاعها</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/backup/export"
                    download
                    className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تصدير نسخة JSON</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: Activity Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">سجل النشاطات والعمليات</h2>
              <p className="text-xs text-slate-500">سجل تدقيق آمن يوثق كل إنشاء طلب، تغيير حالة، أو طباعة</p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100 text-xs">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                          {log.action}
                        </span>
                        <span>{log.details}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        بواسطة: {log.actorName} ({log.role})
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
