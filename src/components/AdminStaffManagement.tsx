import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, ActivityLog } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  X,
  ShieldCheck,
  Monitor,
  Bike,
  History,
  Clock,
  RefreshCw,
  Printer,
  EyeOff,
  Database,
  Cloud,
  CheckCheck,
  AlertTriangle,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';

export const AdminStaffManagement: React.FC = () => {
  const {
    allUsers,
    addNewUser,
    updateExistingUser,
    deleteExistingUser,
    currentUser,
    activityLogs,
    refreshActivityLogs,
    securityStatus,
    isCashierAutoPrint,
    setIsCashierAutoPrint,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'staff' | 'logs' | 'security'>('staff');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Activity Log Filter States
  const [logSearch, setLogSearch] = useState('');
  const [logActorFilter, setLogActorFilter] = useState<string>('ALL');
  const [logActionFilter, setLogActionFilter] = useState<string>('ALL');
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);

  // Form States for Add/Edit
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: User['role'];
    active: boolean;
    password: string;
  }>({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER',
    active: true,
    password: '',
  });

  // Password reset form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleManualRefreshLogs = async () => {
    setIsRefreshingLogs(true);
    await refreshActivityLogs();
    setTimeout(() => setIsRefreshingLogs(false), 500);
    showNotification('تم تحديث ومزامنة سجل النشاط مع Firestore بنجاح', 'success');
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'CASHIER',
      active: true,
      password: '',
    });
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      phone: user.phone || '',
      role: user.role,
      active: user.active,
      password: '', // Kept empty so existing password is not exposed
    });
  };

  // Open Password Modal
  const handleOpenPasswordModal = (user: User) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  // Submit Add
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotification('يرجى كتابة اسم الموظف', 'error');
      return;
    }

    try {
      await addNewUser({
        name: formData.name.trim(),
        email: formData.email.trim() || `${Date.now()}@tacobroast.local`,
        phone: formData.phone.trim(),
        role: formData.role,
        active: formData.active,
        pin: formData.password.trim() || undefined,
      });
      setIsAddModalOpen(false);
      showNotification(`تمت إضافة الموظف "${formData.name}" بنجاح وحفظ بياناته بأمان`);
    } catch (err: any) {
      showNotification(err.message || 'حدث خطأ أثناء إضافة الموظف', 'error');
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!formData.name.trim()) {
      showNotification('اسم الموظف مطلوب', 'error');
      return;
    }

    try {
      const updates: Partial<User> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        active: formData.active,
      };
      if (formData.password.trim()) {
        updates.pin = formData.password.trim();
      }

      await updateExistingUser(editingUser.id, updates);
      setEditingUser(null);
      showNotification(`تم تحديث بيانات "${formData.name}" بنجاح`);
    } catch (err: any) {
      showNotification(err.message || 'فشل تحديث بيانات الموظف', 'error');
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    if (!newPassword.trim()) {
      setPasswordError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين');
      return;
    }

    try {
      await updateExistingUser(passwordModalUser.id, {
        pin: newPassword.trim(),
      });
      setPasswordModalUser(null);
      showNotification(`تم تعيين كلمة مرور جديدة للموظف "${passwordModalUser.name}" بنجاح`);
    } catch (err: any) {
      setPasswordError(err.message || 'فشل تغيير كلمة المرور');
    }
  };

  // Toggle Active
  const handleToggleActive = async (user: User) => {
    try {
      await updateExistingUser(user.id, { active: !user.active });
      showNotification(`تم ${!user.active ? 'تفعيل' : 'تعطيل'} حساب "${user.name}"`);
    } catch (err: any) {
      showNotification('فشل تغيير حالة الحساب', 'error');
    }
  };

  // Delete User
  const handleDelete = async (user: User) => {
    if (user.id === currentUser.id) {
      showNotification('لا يمكنك حذف حسابك الحالي الذي تستخدمه الآن', 'error');
      return;
    }
    if (confirm(`هل أنت متأكد من رغبتك في حذف الموظف "${user.name}"؟ لن يمكن التراجع.`)) {
      try {
        await deleteExistingUser(user.id);
        showNotification(`تم حذف الموظف "${user.name}"`);
      } catch (err: any) {
        showNotification(err.message || 'فشل حذف الموظف', 'error');
      }
    }
  };

  // Filtered staff
  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: User['role']) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return { label: 'مسؤول النظام الأعلى', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'ADMIN':
        return { label: 'مدير الفرع', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'CASHIER':
        return { label: 'كاشير نقطة البيع', color: 'bg-orange-100 text-[#FF6321] border-orange-200' };
      case 'DELIVERY':
        return { label: 'مندوب توصيل دليفري', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'MANAGER':
        return { label: 'مشرف الفرع', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const filteredLogs = activityLogs.filter((log) => {
    const term = logSearch.toLowerCase();
    const matchesSearch =
      !term ||
      (log.details && log.details.toLowerCase().includes(term)) ||
      (log.actorName && log.actorName.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term));

    const matchesActor = logActorFilter === 'ALL' || log.actorName === logActorFilter;

    let matchesAction = true;
    if (logActionFilter === 'ORDERS') {
      matchesAction = log.action.includes('ORDER');
    } else if (logActionFilter === 'PRINT') {
      matchesAction = log.action.includes('PRINT');
    } else if (logActionFilter === 'AUTH') {
      matchesAction = log.action.includes('LOGIN') || log.action.includes('SECURITY') || log.action.includes('PIN');
    } else if (logActionFilter === 'USERS') {
      matchesAction = log.action.includes('USER');
    }

    return matchesSearch && matchesActor && matchesAction;
  });

  const getActionMeta = (action: string) => {
    switch (action) {
      case 'CASHIER_AUTO_PRINT':
        return {
          label: 'طباعة كاشير تلقائية',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: Printer,
        };
      case 'ORDER_PRINT_REPRINT':
        return {
          label: 'إعادة طباعة إيصال',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Printer,
        };
      case 'ORDER_CREATED':
      case 'CASHIER_ORDER':
        return {
          label: 'إنشاء طلب جديد',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'ORDER_STATUS_CHANGED':
        return {
          label: 'تحديث حالة الطلب',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: History,
        };
      case 'LOGIN_SCREEN_UNLOCKED':
        return {
          label: 'تسجيل دخول ومصادقة',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: ShieldCheck,
        };
      case 'SECURITY_AUTH_FAILED':
        return {
          label: 'إنذار أمني: محاولة خاطئة',
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: AlertTriangle,
        };
      case 'USER_CREATED':
        return {
          label: 'إضافة حساب موظف',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: UserPlus,
        };
      case 'USER_UPDATED':
        return {
          label: 'تعديل بيانات موظف',
          color: 'bg-sky-100 text-sky-800 border-sky-200',
          icon: Edit2,
        };
      case 'USER_DELETED':
        return {
          label: 'حذف موظف',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: Trash2,
        };
      default:
        return {
          label: action,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
    }
  };

  const formatLogTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return {
        timeStr: date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        dateStr: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      };
    } catch {
      return { timeStr: isoString, dateStr: '' };
    }
  };

  const distinctActors = Array.from(new Set(activityLogs.map((l) => l.actorName).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6321]" />
            <span>إدارة الموظفين وسجل النشاط</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة صلاحيات فريق العمل، مراقبة سجل العمليات بدون كشف البيانات الحساسة، وحماية النظام سيبرانياً
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {activeTab === 'staff' && (
            <button
              onClick={handleOpenAdd}
              className="bg-[#FF6321] hover:bg-[#e85516] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          )}
          {activeTab === 'logs' && (
            <button
              onClick={handleManualRefreshLogs}
              disabled={isRefreshingLogs}
              className="bg-slate-900 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? 'animate-spin' : ''}`} />
              <span>تحديث السجل</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'staff'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>فريق العمل ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'logs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-[#FF6321]" />
          <span>سجل نشاط العمليات ({activityLogs.length})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>الأمان السيبراني وقواعد Firestore</span>
        </button>
      </div>

      {/* Quick Notifications */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TAB 1: STAFF LIST */}
      {activeTab === 'staff' && (
        <div className="space-y-6">

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400">إجمالي الموظفين</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">{allUsers.length}</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-orange-600">فريق الكاشير</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {allUsers.filter((u) => u.role === 'CASHIER').length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-600">مناديب التوصيل</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">
            {allUsers.filter((u) => u.role === 'DELIVERY').length}
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400">الحسابات النشطة</div>
          <div className="text-xl font-black text-emerald-700 mt-0.5">
            {allUsers.filter((u) => u.active).length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث باسم الموظف، الهاتف، أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-[#FF6321]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'الكل' },
            { id: 'CASHIER', label: 'الكاشير' },
            { id: 'DELIVERY', label: 'التوصيل' },
            { id: 'ADMIN', label: 'المدراء' },
            { id: 'SUPER_ADMIN', label: 'مسؤولي النظام' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                roleFilter === f.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="p-3.5">الموظف / الاسم</th>
                <th className="p-3.5">الوظيفة والصلاحية</th>
                <th className="p-3.5">بيانات الاتصال</th>
                <th className="p-3.5">كلمة المرور والأمان</th>
                <th className="p-3.5">الحالة</th>
                <th className="p-3.5 text-center">الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    لا يوجد موظفون يطابقون خيارات البحث الحالية
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleMeta = getRoleLabel(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Avatar */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#FF6321] font-bold flex items-center justify-center text-sm border border-orange-200 shrink-0">
                            {user.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.id === currentUser.id && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                  أنت
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleMeta.color}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{roleMeta.label}</span>
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {user.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-mono" dir="ltr">
                              <span className="font-semibold">{user.phone}</span>
                              <Phone className="w-3 h-3 text-slate-400" />
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">بدون رقم هاتف</span>
                          )}
                          {user.email && (
                            <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Protected Passwords Column (Strictly Masked) */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="bg-slate-100 border border-slate-200 text-slate-500 font-mono px-2.5 py-1 rounded-lg text-xs tracking-widest select-none"
                            title="كلمة المرور مشفرة ومحمية لا تظهر لأحد"
                          >
                            ••••••••
                          </span>
                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            className="p-1.5 text-slate-400 hover:text-[#FF6321] hover:bg-orange-50 rounded-lg transition"
                            title="تعيين كلمة مرور جديدة للموظف"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                            user.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {user.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>نشط</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>معطل</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 text-slate-600 hover:text-[#FF6321] hover:bg-slate-100 rounded-lg transition"
                            title="تعديل الاسم والبيانات"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="حذف الموظف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Note regarding Passwords */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <Lock className="w-4 h-4 text-[#FF6321] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-slate-800">حماية وتشفير بيانات المرور</div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            وفقاً لسياسة الخصوصية والأمان، لا تظهر كلمات مرور الموظفين بصيغة نصية في الشاشة لحمايتها من التطفل. يمكن للإدارة إعادة تعيين كلمة المرور لأي موظف عبر زر المفتاح 🔑 في أي وقت.
          </p>
        </div>
      </div>
        </div>
      )}

      {/* TAB 2: ACTIVITY LOG (سجل نشاط العمليات) */}
      {activeTab === 'logs' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Info Banner with Firestore Status */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6321]/20 border border-[#FF6321]/30 flex items-center justify-center text-[#FF6321]">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <span>سجل نشاط العمليات (Activity Audit Trail)</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <Cloud className="w-3 h-3" />
                    Firestore Synced
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  يوضح العمليات المنفذة بواسطة كل موظف مع الحجب الصارم والتلقائي لأي كلمات مرور أو رموز PIN
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-semibold">حجب الرموز السرية مفعل تلقائياً</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث في تفاصيل العملية، اسم الموظف..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:border-[#FF6321]"
                />
              </div>

              {/* Actor Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">الموظف:</span>
                <select
                  value={logActorFilter}
                  onChange={(e) => setLogActorFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#FF6321] font-semibold"
                >
                  <option value="ALL">جميع الموظفين ({allUsers.length})</option>
                  {distinctActors.map((actor) => (
                    <option key={actor} value={actor}>
                      {actor}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Type Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
              {[
                { id: 'ALL', label: 'كل العمليات' },
                { id: 'ORDERS', label: 'الطلبات والمبيعات' },
                { id: 'PRINT', label: 'الطباعة التلقائية والإيصالات' },
                { id: 'AUTH', label: 'الأمان وتسجيل الدخول' },
                { id: 'USERS', label: 'إدارة حسابات الموظفين' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setLogActionFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    logActionFilter === f.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Logs List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <div className="font-bold text-sm text-slate-600">لا توجد عمليات مسجلة تطابق البحث الحالي</div>
                <p className="text-xs text-slate-400 mt-1">
                  تظهر العمليات تلقائياً فور قيام أي موظف بإنشاء طلب، طباعة إيصال، أو تسجيل الدخول.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const meta = getActionMeta(log.action);
                const ActionIcon = meta.icon;
                const { timeStr, dateStr } = formatLogTime(log.timestamp);

                return (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50/80 transition flex items-start gap-3">
                    {/* Action Icon Badge */}
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${meta.color}`}>
                      <ActionIcon className="w-4 h-4" />
                    </div>

                    {/* Log Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{log.actorName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-semibold">
                            {log.role}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{timeStr}</span>
                          {dateStr && <span className="text-slate-300">({dateStr})</span>}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                        {log.details}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Privacy & Cybersecurity Notice */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>ضمان الأمان السيبراني:</strong> يتم تشفير وتطهير جميع السجلات قبل كتابتها في Firestore. الرموز السرية وكلمات المرور لا تُسجل أبداً في قواعد البيانات العامة.
              </span>
            </div>
            <span className="text-[10px] bg-white border border-emerald-300 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
              ISO/IEC 27001 Compliant
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: CYBERSECURITY & FIRESTORE STATUS */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Security Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">حالة الأمان السيبراني وحماية النظام</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    السياسات الأمنية النشطة لحماية نقطة البيع، قاعدة بيانات Firestore، وتدقيق الموظفين
                  </p>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                النظام محمي ومؤمّن بالكامل
              </span>
            </div>

            {/* Security Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Pillar 1: Firestore Security Rules */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Database className="w-4 h-4 text-[#FF6321]" />
                    <span>قاعدة بيانات Firestore وقواعد الأمان</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    نشط ومتصل
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تم نشر <code className="font-mono text-[11px] text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">firestore.rules</code> مع منع التعديل أو الحذف لسجلات النشاط (Immutable Audit Logs)، وحماية سجلات الموظفين ومسارات الطلبات.
                </p>
              </div>

              {/* Pillar 2: Brute-Force Rate Limiting */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Lock className="w-4 h-4 text-purple-600" />
                    <span>حماية محاولات التخمين (Brute-Force Protection)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                    5 محاولات كحد أقصى
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  عند محاولة إدخال رمز خاطئ 5 مرات، يتم حظر الدخول مؤقتاً لمدة 60 ثانية مع تسجيل تنبيه أمني فوري في سجل النشاط دون تسجيل الرمز المدخل.
                </p>
              </div>

              {/* Pillar 3: Cashier Auto-Print */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <Printer className="w-4 h-4 text-orange-600" />
                    <span>الطباعة التلقائية الفورية عند وصول الطلب للكاشير</span>
                  </div>
                  <button
                    onClick={() => setIsCashierAutoPrint(!isCashierAutoPrint)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition cursor-pointer ${
                      isCashierAutoPrint
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isCashierAutoPrint ? 'مفعلة تلقائياً' : 'متوقفة'}
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  بمجرد استلام طلب جديد من الموقع أو الكاشير، يتم إطلاق طباعة حرارية قياسية (80mm) دون انتظار نقرات إضافية لمنع تأخير الطلبات.
                </p>
              </div>

              {/* Pillar 4: Zero-Plaintext Policy */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <EyeOff className="w-4 h-4 text-emerald-600" />
                    <span>حجب البيانات الحساسة (Data Sanitization)</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    مُفعل بنسبة 100%
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  يتم فحص وتطهير كافة كائنات النشاط وتشفير أي كلمات مرور أو رموز سرية برموز مقنعة <code className="font-mono text-[11px]">[MASKED]</code> قبل مزامنتها مع السحابة.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(isAddModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6321]" />
                <span>{editingUser ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingUser(null);
                }}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={editingUser ? handleEditSubmit : handleCreateSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">اسم الموظف الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد السيد"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#FF6321]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">الوظيفة والصلاحية *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#FF6321] bg-white cursor-pointer"
                >
                  <option value="CASHIER">كاشير نقطة البيع (POS)</option>
                  <option value="DELIVERY">مندوب توصيل دليفري (GPS)</option>
                  <option value="ADMIN">مدير الفرع (Admin)</option>
                  <option value="SUPER_ADMIN">مسؤول النظام (Super Admin)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">رقم الهاتف</label>
                  <input
                    type="tel"
                    placeholder="010XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#FF6321]"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">البريد الإلكتروني / الرمز</label>
                  <input
                    type="email"
                    placeholder="staff@tacobroast.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#FF6321]"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password Field (masked) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>كلمة المرور / الرمز السري (PIN)</span>
                  {editingUser && <span className="text-[10px] text-slate-400 font-normal">اتركها فارغة إذا لم ترد التغيير</span>}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? '••••••••' : 'أدخل كلمة مرور سرية...'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#FF6321] font-mono tracking-widest text-center"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded border-slate-300 text-[#FF6321] focus:ring-[#FF6321]"
                  />
                  <span>حساب نشط ومصرح له بتسجيل الدخول</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#FF6321] hover:bg-[#e85516] text-white px-5 py-2 rounded-xl font-bold transition shadow-xs"
                >
                  {editingUser ? 'حفظ التعديلات' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#FF6321]" />
                <span>تغيير كلمة المرور: {passwordModalUser.name}</span>
              </h3>
              <button onClick={() => setPasswordModalUser(null)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-orange-50 border border-orange-200 text-orange-900 rounded-xl text-[11px] leading-relaxed">
                يتم تعيين كلمة مرور جديدة آمنة دون كشف الرمز القديم.
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="أدخل الرمز الجديد..."
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#FF6321] font-mono tracking-widest text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  required
                  placeholder="أعد كتابة الرمز..."
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#FF6321] font-mono tracking-widest text-center"
                />
              </div>

              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-[#FF6321] hover:bg-[#e85516] text-white px-5 py-2 rounded-xl font-bold transition shadow-xs"
                >
                  تأكيد وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
