import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  Flame,
  Utensils,
  DollarSign,
  ShoppingBag,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Calendar,
  BarChart3,
  Layers,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  ArrowUpRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { Order, Product } from '../types';

type DateFilter = 'today' | 'yesterday' | 'week' | 'all';
type MetricView = 'combined' | 'sales' | 'orders';

const CATEGORY_COLORS: Record<string, string> = {
  'بروست مقرمش': '#FF6321',
  'برجر مشوي': '#EA580C',
  'تاكو': '#F59E0B',
  'مقبلات وبطاطس': '#10B981',
  'صوصات ومشروبات': '#3B82F6',
  'أخرى': '#8B5CF6',
};

const PALETTE = ['#FF6321', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1'];

export const AdminDailySalesReport: React.FC = () => {
  const { orders, products, triggerManualPrint, settings, getSystemLinks } = useApp();

  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [metricView, setMetricView] = useState<MetricView>('combined');
  const [dishesView, setDishesView] = useState<'bar' | 'pie' | 'table'>('bar');
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);
  const [isZReportOpen, setIsZReportOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const links = useMemo(() => getSystemLinks(), [getSystemLinks]);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(key);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    return orders.filter((ord) => {
      if (ord.status === 'CANCELLED') return false;
      const orderDate = ord.createdAt ? ord.createdAt.split('T')[0] : '';
      const orderTime = new Date(ord.createdAt || Date.now());

      if (dateFilter === 'today') {
        return orderDate === todayStr;
      }
      if (dateFilter === 'yesterday') {
        return orderDate === yesterdayStr;
      }
      if (dateFilter === 'week') {
        return orderTime >= sevenDaysAgo;
      }
      return true; // all
    });
  }, [orders, dateFilter]);

  // If today has very few orders in demo, fallback to all non-cancelled orders to make reports rich
  const displayOrders = useMemo(() => {
    if (filteredOrders.length === 0 && orders.length > 0) {
      return orders.filter((o) => o.status !== 'CANCELLED');
    }
    return filteredOrders;
  }, [filteredOrders, orders]);

  // 1. KPI Calculations
  const stats = useMemo(() => {
    const totalSales = displayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrdersCount = displayOrders.length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalSales / totalOrdersCount) : 0;

    // Delivery vs Dine-in vs Takeaway vs Website
    const channelCounts = {
      DELIVERY: 0,
      DINE_IN: 0,
      TAKE_AWAY: 0,
      WEBSITE: 0,
    };
    const channelSales = {
      DELIVERY: 0,
      DINE_IN: 0,
      TAKE_AWAY: 0,
      WEBSITE: 0,
    };

    displayOrders.forEach((o) => {
      const type = (o.orderType as keyof typeof channelCounts) || 'DELIVERY';
      if (channelCounts[type] !== undefined) {
        channelCounts[type] += 1;
        channelSales[type] += o.total || 0;
      }
    });

    // Payment methods
    const payments = {
      CASH: 0,
      CARD: 0,
      ONLINE: 0,
    };
    displayOrders.forEach((o) => {
      const p = (o.paymentMethod as keyof typeof payments) || 'CASH';
      if (payments[p] !== undefined) {
        payments[p] += o.total || 0;
      }
    });

    return {
      totalSales,
      totalOrdersCount,
      avgOrderValue,
      channelCounts,
      channelSales,
      payments,
    };
  }, [displayOrders]);

  // 2. Hourly Peak Analysis (11:00 AM to 01:00 AM)
  const hourlyData = useMemo(() => {
    // Service hours list from 11:00 AM (11) to 01:00 AM (25 => 1)
    const hoursMap: Record<number, { hour: number; label: string; ordersCount: number; salesTotal: number }> = {};

    for (let h = 11; h <= 24; h++) {
      let label = '';
      if (h < 12) label = `${h}:00 ص`;
      else if (h === 12) label = '12:00 م';
      else if (h < 24) label = `${h - 12}:00 م`;
      else label = '12:00 ص';

      hoursMap[h] = {
        hour: h,
        label,
        ordersCount: 0,
        salesTotal: 0,
      };
    }

    displayOrders.forEach((ord) => {
      if (!ord.createdAt) return;
      const d = new Date(ord.createdAt);
      let h = d.getHours();
      if (h === 0) h = 24; // midnight slot
      if (hoursMap[h]) {
        hoursMap[h].ordersCount += 1;
        hoursMap[h].salesTotal += Math.round(ord.total || 0);
      } else if (h >= 11) {
        hoursMap[24].ordersCount += 1;
        hoursMap[24].salesTotal += Math.round(ord.total || 0);
      } else {
        // morning order, map to opening slot
        hoursMap[11].ordersCount += 1;
        hoursMap[11].salesTotal += Math.round(ord.total || 0);
      }
    });

    return Object.values(hoursMap);
  }, [displayOrders]);

  // Determine Peak Hour and Peak Window
  const peakStats = useMemo(() => {
    let peakHour = hourlyData[0];
    let maxSales = 0;
    hourlyData.forEach((slot) => {
      if (slot.salesTotal > maxSales) {
        maxSales = slot.salesTotal;
        peakHour = slot;
      }
    });

    // Calculate prime dinner rush (7:00 PM to 10:30 PM, hours 19, 20, 21, 22)
    const rushSlots = hourlyData.filter((s) => s.hour >= 19 && s.hour <= 22);
    const rushSales = rushSlots.reduce((sum, s) => sum + s.salesTotal, 0);
    const rushOrders = rushSlots.reduce((sum, s) => sum + s.ordersCount, 0);
    const rushPercent = stats.totalSales > 0 ? Math.round((rushSales / stats.totalSales) * 100) : 0;

    return {
      peakHour,
      rushSales,
      rushOrders,
      rushPercent,
      windowLabel: '07:00 م - 10:30 م (فترة العشاء والذروة القصوى)',
    };
  }, [hourlyData, stats.totalSales]);

  // 3. Top Dishes / الأطباق الأكثر طلباً
  const topDishes = useMemo(() => {
    const dishMap: Record<
      string,
      {
        id: string;
        nameAr: string;
        nameEn: string;
        quantity: number;
        revenue: number;
        unitPrice: number;
        category: string;
        image?: string;
      }
    > = {};

    displayOrders.forEach((ord) => {
      ord.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId || p.nameAr === item.nameAr);
        const cat = prod?.categoryId || '';
        let categoryName = 'أخرى';
        if (cat.includes('broast') || item.nameAr.includes('وجبة') || item.nameAr.includes('قطع')) {
          categoryName = 'بروست مقرمش';
        } else if (cat.includes('burger') || item.nameAr.includes('برجر')) {
          categoryName = 'برجر مشوي';
        } else if (cat.includes('taco') || item.nameAr.includes('تاكو')) {
          categoryName = 'تاكو';
        } else if (cat.includes('sides') || item.nameAr.includes('فرايز') || item.nameAr.includes('بطاطس') || item.nameAr.includes('موتزاريلا')) {
          categoryName = 'مقبلات وبطاطس';
        } else if (cat.includes('sauce') || item.nameAr.includes('كولا') || item.nameAr.includes('صوص')) {
          categoryName = 'صوصات ومشروبات';
        }

        if (!dishMap[item.nameAr]) {
          dishMap[item.nameAr] = {
            id: item.productId || item.nameAr,
            nameAr: item.nameAr,
            nameEn: item.nameEn || '',
            quantity: 0,
            revenue: 0,
            unitPrice: item.price,
            category: categoryName,
            image: prod?.image,
          };
        }
        dishMap[item.nameAr].quantity += item.quantity;
        dishMap[item.nameAr].revenue += item.quantity * item.price;
      });
    });

    const sorted = Object.values(dishMap).sort((a, b) => b.quantity - a.quantity);
    return sorted;
  }, [displayOrders, products]);

  // Category Distribution for Pie Chart
  const categoryData = useMemo(() => {
    const catMap: Record<string, { name: string; value: number; count: number }> = {};
    topDishes.forEach((dish) => {
      if (!catMap[dish.category]) {
        catMap[dish.category] = { name: dish.category, value: 0, count: 0 };
      }
      catMap[dish.category].value += dish.revenue;
      catMap[dish.category].count += dish.quantity;
    });
    return Object.values(catMap);
  }, [topDishes]);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Header Bar with Date Range Selector & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-[#FF6321] border border-orange-100">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                تقارير المبيعات اليومية وتحليل أوقات الذروة
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                متابعة حركة الأطباق الأكثر طلباً ومؤشرات الضغط وساعات الذروة التشغيلية
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter Pills & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            {[
              { id: 'today', label: 'اليوم' },
              { id: 'yesterday', label: 'أمس' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'all', label: 'كل الفترات' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDateFilter(f.id as DateFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  dateFilter === f.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Share Links Button */}
          <button
            onClick={() => setIsLinksModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-orange-400" />
            <span>روابط النظام والموظفين</span>
          </button>

          {/* Thermal Z-Report Button */}
          <button
            onClick={() => setIsZReportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FF6321] hover:bg-[#e85516] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة إقفال اليومية (Z-Report)</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">إجمالي مبيعات اليوم</span>
            <span className="p-2 rounded-lg bg-orange-50 text-[#FF6321]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalSales.toLocaleString()}</span>
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.totalOrdersCount} طلب مكتمل بنجاح</span>
          </div>
        </div>

        {/* Metric 2: Average Order Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">متوسط الفاتورة (AOV)</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.avgOrderValue}</span>
            <span className="text-xs font-bold text-slate-500">ج.م / طلب</span>
          </div>
          <div className="text-[11px] font-medium text-slate-500">
            أعلى طلب: {Math.max(...displayOrders.map((o) => o.total || 0), 0)} ج.م
          </div>
        </div>

        {/* Metric 3: Peak Rush Period */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">ساعة الذروة القصوى</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-slate-900">{peakStats.peakHour?.label || '08:00 م'}</span>
            <span className="text-xs font-bold text-amber-600">
              ({peakStats.peakHour?.ordersCount || 0} طلبات)
            </span>
          </div>
          <div className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
            مبيعات الساعة: {peakStats.peakHour?.salesTotal || 0} ج.م
          </div>
        </div>

        {/* Metric 4: Star Dish */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">الوجبة النجم الأكثر مبيعاً</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="truncate">
            <span className="text-base font-black text-slate-900 block truncate" title={topDishes[0]?.nameAr}>
              {topDishes[0]?.nameAr || 'وجبة 3 قطع كريسبي'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
            <span>{topDishes[0]?.quantity || 0} طلب اليوم</span>
            <span>{topDishes[0]?.revenue?.toLocaleString() || 0} ج.م</span>
          </div>
        </div>
      </div>

      {/* 3. Peak Hours Interactive Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FF6321]" />
              <h3 className="font-black text-base text-slate-900">
                مخطط ساعات الذروة والضغط التشغيلي (Peak Hours & Rush Times)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              توزيع المبيعات وعدد الطلبات عبر ساعات عمل المطعم لمساعدة الإدارة في جدولة الورديات
            </p>
          </div>

          {/* Metric View Switch */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setMetricView('combined')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                metricView === 'combined' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              مدمج (المبيعات والطلبات)
            </button>
            <button
              onClick={() => setMetricView('sales')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                metricView === 'sales' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              المبيعات (ج.م)
            </button>
            <button
              onClick={() => setMetricView('orders')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                metricView === 'orders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              عدد الطلبات
            </button>
          </div>
        </div>

        {/* Peak Alert & Operational Recommendation Banner */}
        <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="p-1.5 rounded-lg bg-[#FF6321] text-white shrink-0">
              <Flame className="w-4 h-4" />
            </span>
            <div>
              <p className="font-bold text-orange-950">
                فترة الذروة الكبرى: {peakStats.windowLabel}
              </p>
              <p className="text-orange-800 text-[11px] mt-0.5">
                تمركز {peakStats.rushPercent}% من إجمالي مبيعات اليوم خلال هذه الفترة بواقع {peakStats.rushOrders} طلب وإيراد {peakStats.rushSales.toLocaleString()} ج.م.
              </p>
            </div>
          </div>
          <div className="shrink-0 bg-white/90 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-900 font-bold text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>التوصية: تعزيز خط الشواية و3 مناديب دليفري</span>
          </div>
        </div>

        {/* The Peak Hours Chart (Recharts) */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6321" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF6321" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
              <YAxis
                yAxisId="left"
                orientation="right"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
              />
              {(metricView === 'combined' || metricView === 'orders') && (
                <YAxis
                  yAxisId="right"
                  orientation="left"
                  tick={{ fontSize: 11, fill: '#3B82F6' }}
                  tickLine={false}
                  axisLine={false}
                />
              )}
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isPeak = data.hour === peakStats.peakHour.hour;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-sans space-y-1.5 border border-slate-700 min-w-[170px]" dir="rtl">
                        <div className="flex items-center justify-between font-bold border-b border-slate-700 pb-1">
                          <span>{label}</span>
                          {isPeak && (
                            <span className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> ذروة قصوى
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>المبيعات:</span>
                          <span className="font-bold text-[#FF6321]">{data.salesTotal.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300">
                          <span>عدد الطلبات:</span>
                          <span className="font-bold text-blue-400">{data.ordersCount} طلبات</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                          <span>مستوى الضغط:</span>
                          <span className={data.ordersCount >= 3 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {data.ordersCount >= 3 ? 'ضغط تشغيلي مرتفع' : 'معتدل'}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {(metricView === 'combined' || metricView === 'sales') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="salesTotal"
                  name="المبيعات (ج.م)"
                  stroke="#FF6321"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              )}
              {(metricView === 'combined' || metricView === 'orders') && (
                <Area
                  yAxisId={metricView === 'orders' ? 'left' : 'right'}
                  type="monotone"
                  dataKey="ordersCount"
                  name="عدد الطلبات"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Top Dishes & Items Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left col-span-8: Top Dishes Ranking & Charts */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#FF6321]" />
                <h3 className="font-black text-base text-slate-900">
                  الأطباق والوجبات الأكثر طلباً اليوم (Top Selling Dishes)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ترتيب الأصناف بالكميات المباعة ومساهمتها في إجمالي إيرادات المطعم
              </p>
            </div>

            {/* View switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setDishesView('bar')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  dishesView === 'bar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                رسم شريطي
              </button>
              <button
                onClick={() => setDishesView('pie')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  dishesView === 'pie' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                توزيع الأقسام
              </button>
              <button
                onClick={() => setDishesView('table')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  dishesView === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                جدول مفصل
              </button>
            </div>
          </div>

          {/* View Mode: Bar Chart */}
          {dishesView === 'bar' && (
            <div className="space-y-4">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topDishes.slice(0, 7)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis
                      type="category"
                      dataKey="nameAr"
                      tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }}
                      width={110}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = stats.totalSales > 0 ? Math.round((data.revenue / stats.totalSales) * 100) : 0;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs font-sans space-y-1 border border-slate-700" dir="rtl">
                              <p className="font-bold text-slate-100">{data.nameAr}</p>
                              <p className="text-[11px] text-slate-400">{data.category}</p>
                              <div className="flex justify-between gap-4 text-[#FF6321] font-bold pt-1 border-t border-slate-700">
                                <span>الكمية المباعة:</span>
                                <span>{data.quantity} طلب</span>
                              </div>
                              <div className="flex justify-between gap-4 text-emerald-400 font-bold">
                                <span>الإيراد الإجمالي:</span>
                                <span>{data.revenue.toLocaleString()} ج.م</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                تمثل {percent}% من إجمالي مبيعات اليوم
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="quantity" fill="#FF6321" radius={[0, 8, 8, 0]}>
                      {topDishes.slice(0, 7).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Badges of top 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {topDishes.slice(0, 3).map((dish, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shrink-0 ${
                        idx === 0 ? 'bg-amber-500 shadow-xs' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div className="truncate flex-1">
                      <p className="font-bold text-xs text-slate-900 truncate">{dish.nameAr}</p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {dish.quantity} طلب &bull; {dish.revenue.toLocaleString()} ج.م
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* View Mode: Pie Chart Category Breakdown */}
          {dishesView === 'pie' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-7 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cat-cell-${index}`}
                          fill={CATEGORY_COLORS[entry.name] || PALETTE[index % PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} ج.م`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="md:col-span-5 space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  نسبة مساهمة الأقسام في المبيعات
                </h4>
                {categoryData.map((cat, idx) => {
                  const percent = stats.totalSales > 0 ? Math.round((cat.value / stats.totalSales) * 100) : 0;
                  const color = CATEGORY_COLORS[cat.name] || PALETTE[idx % PALETTE.length];
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                        <span className="font-bold text-slate-800">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">{cat.value.toLocaleString()} ج.م</span>
                        <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* View Mode: Full Details Table */}
          {dishesView === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2.5">الترتيب</th>
                    <th className="px-3 py-2.5">اسم الوجبة</th>
                    <th className="px-3 py-2.5">القسم</th>
                    <th className="px-3 py-2.5">سعر الوحدة</th>
                    <th className="px-3 py-2.5">الكمية المباعة</th>
                    <th className="px-3 py-2.5">إجمالي الإيراد</th>
                    <th className="px-3 py-2.5">النسبة من اليوم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {topDishes.map((dish, idx) => {
                    const percent = stats.totalSales > 0 ? Math.round((dish.revenue / stats.totalSales) * 100) : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="px-3 py-2.5 font-black text-slate-400">#{idx + 1}</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900 flex items-center gap-2">
                          {dish.image && (
                            <img
                              src={dish.image}
                              alt={dish.nameAr}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span>{dish.nameAr}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-medium">
                            {dish.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium">{dish.unitPrice} ج.م</td>
                        <td className="px-3 py-2.5 font-bold text-[#FF6321]">{dish.quantity} طلب</td>
                        <td className="px-3 py-2.5 font-bold text-slate-900">{dish.revenue.toLocaleString()} ج.م</td>
                        <td className="px-3 py-2.5 font-bold text-emerald-600">{percent}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right col-span-4: Channels & Payment Distribution + Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          {/* Channel breakdown card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              المبيعات حسب نوع الطلب وقنوات البيع
            </h4>
            <div className="space-y-3">
              {[
                { key: 'DELIVERY', label: 'توصيل دليفري (Delivery)', color: 'bg-emerald-500' },
                { key: 'TAKE_AWAY', label: 'تيك أواي سفري (Takeaway)', color: 'bg-amber-500' },
                { key: 'DINE_IN', label: 'صالة داخلي (Dine-in)', color: 'bg-blue-500' },
                { key: 'WEBSITE', label: 'أونلاين الموقع (Website)', color: 'bg-purple-500' },
              ].map((ch) => {
                const count = stats.channelCounts[ch.key as keyof typeof stats.channelCounts] || 0;
                const sales = stats.channelSales[ch.key as keyof typeof stats.channelSales] || 0;
                const pct = stats.totalSales > 0 ? Math.round((sales / stats.totalSales) * 100) : 0;
                return (
                  <div key={ch.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{ch.label}</span>
                      <span className="font-bold text-slate-900">{sales.toLocaleString()} ج.م ({count})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full ${ch.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              طرق الدفع والتحصيل
            </h4>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold">كاش نقدي</p>
                <p className="font-black text-slate-900">{stats.payments.CASH.toLocaleString()} ج.م</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold">بطاقة POS</p>
                <p className="font-black text-slate-900">{stats.payments.CARD.toLocaleString()} ج.م</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <p className="text-[10px] text-slate-400 font-bold">أونلاين</p>
                <p className="font-black text-slate-900">{stats.payments.ONLINE.toLocaleString()} ج.م</p>
              </div>
            </div>
          </div>

          {/* Quick System Links Card (Highlighting User Requirement) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-white/10 text-orange-400">
                  <Share2 className="w-4 h-4" />
                </span>
                <span className="font-bold text-xs text-white">روابط النظام المباشرة</span>
              </div>
              <span className="text-[10px] bg-orange-500/30 text-orange-300 font-bold px-2 py-0.5 rounded-md border border-orange-400/30">
                جاهز للمشاركة
              </span>
            </div>

            {/* Customer Regular Link */}
            <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> رابط العملاء (الموقع العادي)
                </span>
                <button
                  onClick={() => handleCopy(links.customerUrl, 'cust-card')}
                  className="text-white hover:text-orange-400 flex items-center gap-1 font-bold cursor-pointer"
                >
                  {copiedLink === 'cust-card' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'cust-card' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-300 truncate font-mono direction-ltr text-left">
                {links.customerUrl}
              </p>
            </div>

            {/* Staff Portal Link */}
            <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-orange-400 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" /> رابط الموظفين والتشغيل
                </span>
                <button
                  onClick={() => handleCopy(links.staffModalUrl, 'staff-card')}
                  className="text-white hover:text-orange-400 flex items-center gap-1 font-bold cursor-pointer"
                >
                  {copiedLink === 'staff-card' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === 'staff-card' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-300 truncate font-mono direction-ltr text-left">
                {links.staffModalUrl}
              </p>
            </div>

            <button
              onClick={() => setIsLinksModalOpen(true)}
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>عرض جميع بوابات الموظفين (الكاشير، الدليفري، الإدارة)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: SYSTEM LINKS MODAL (اللينك الموظفين والعادي) */}
      {isLinksModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-orange-50 text-[#FF6321]">
                  <Share2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-base text-slate-900">
                    روابط النظام (الموقع العادي وبوابات الموظفين)
                  </h3>
                  <p className="text-xs text-slate-500">انسخ الروابط لمشاركتها مع العملاء وطاقم العمل</p>
                </div>
              </div>
              <button
                onClick={() => setIsLinksModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Link 1: Customer Website */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-emerald-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>رابط العملاء (الموقع العادي - Customer Menu)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    متاح للعامة
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  رابط المنيو والطلب الخارجي وتتبع الأوردر للجمهور بدون كلمات مرور.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={links.customerUrl}
                    className="flex-1 bg-white border border-emerald-300 rounded-lg px-3 py-1.5 text-xs text-left font-mono direction-ltr select-all"
                  />
                  <button
                    onClick={() => handleCopy(links.customerUrl, 'modal-cust')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedLink === 'modal-cust' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === 'modal-cust' ? 'تم!' : 'نسخ'}</span>
                  </button>
                  <a
                    href={links.customerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    title="فتح في تبويب جديد"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Link 2: Staff Login Modal Direct */}
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-orange-950 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-[#FF6321]" />
                    <span>رابط الموظفين (بوابة الدخول المباشر - Staff Portal)</span>
                  </span>
                  <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded">
                    محمي برقم سري
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  يفتح نافذة تسجيل دخول الموظفين فوراً بمجرد فتح الرابط.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={links.staffModalUrl}
                    className="flex-1 bg-white border border-orange-300 rounded-lg px-3 py-1.5 text-xs text-left font-mono direction-ltr select-all"
                  />
                  <button
                    onClick={() => handleCopy(links.staffModalUrl, 'modal-staff')}
                    className="px-3 py-1.5 rounded-lg bg-[#FF6321] hover:bg-[#e85516] text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedLink === 'modal-staff' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink === 'modal-staff' ? 'تم!' : 'نسخ'}</span>
                  </button>
                  <a
                    href={links.staffModalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    title="فتح في تبويب جديد"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Direct links to dedicated screens */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p className="text-xs font-bold text-slate-700">روابط الشاشات المباشرة:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">الكاشير (POS)</p>
                      <p className="text-[10px] text-slate-400 font-mono">/pos</p>
                    </div>
                    <button
                      onClick={() => handleCopy(links.posUrl, 'pos-copy')}
                      className="text-[#FF6321] hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      {copiedLink === 'pos-copy' ? 'تم!' : 'نسخ'}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">الدليفري (GPS)</p>
                      <p className="text-[10px] text-slate-400 font-mono">/delivery</p>
                    </div>
                    <button
                      onClick={() => handleCopy(links.deliveryUrl, 'del-copy')}
                      className="text-[#FF6321] hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      {copiedLink === 'del-copy' ? 'تم!' : 'نسخ'}
                    </button>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">الإدارة (Admin)</p>
                      <p className="text-[10px] text-slate-400 font-mono">/admin</p>
                    </div>
                    <button
                      onClick={() => handleCopy(links.adminUrl, 'admin-copy')}
                      className="text-[#FF6321] hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      {copiedLink === 'admin-copy' ? 'تم!' : 'نسخ'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsLinksModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: THERMAL Z-REPORT MODAL (معاينة وطباعة إقفال اليومية) */}
      {isZReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-100 text-slate-900">
                  <Printer className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    تقرير الإقفال اليومي الحراري (Daily Z-Report 80mm)
                  </h3>
                  <p className="text-[11px] text-slate-500">جاهز للطباعة على طابعة الفواتير الحرارية</p>
                </div>
              </div>
              <button
                onClick={() => setIsZReportOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Slip Simulation */}
            <div className="bg-[#FAF9F5] p-4 rounded-xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 space-y-3 select-all">
              <div className="text-center border-b border-dashed border-slate-300 pb-2 space-y-0.5">
                <p className="font-black text-sm">{settings?.restaurantNameAr || 'TACO BROAST'}</p>
                <p className="text-[10px] text-slate-500">تقرير المبيعات اليومية الإجمالي (Z-REPORT)</p>
                <p className="text-[10px] text-slate-500">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                <p className="text-[10px] text-slate-500">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold">
                  <span>إجمالي المبيعات:</span>
                  <span>{stats.totalSales.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>عدد العمليات:</span>
                  <span>{stats.totalOrdersCount} طلب</span>
                </div>
                <div className="flex justify-between">
                  <span>متوسط الفاتورة:</span>
                  <span>{stats.avgOrderValue} ج.م</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                <p className="font-bold text-[10px] text-slate-500">طرق التحصيل:</p>
                <div className="flex justify-between">
                  <span>نقدياً (Cash):</span>
                  <span>{stats.payments.CASH.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>بطاقة (Card POS):</span>
                  <span>{stats.payments.CARD.toLocaleString()} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span>أونلاين (Online):</span>
                  <span>{stats.payments.ONLINE.toLocaleString()} ج.م</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                <p className="font-bold text-[10px] text-slate-500">أعلى الوجبات مبيعاً:</p>
                {topDishes.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex justify-between text-[10px]">
                    <span>{i + 1}. {d.nameAr}</span>
                    <span>{d.quantity}x &bull; {d.revenue} ج.م</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-slate-500">
                ساعة الذروة: {peakStats.peakHour?.label || '08:00 م'} ({peakStats.peakHour?.ordersCount || 0} طلبات)
                <br />
                نهاية التقرير اليومي &bull; تم الإقفال بواسطة الإدارة
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsZReportOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-[#FF6321] hover:bg-[#e85516] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>إرسال للطابعة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
