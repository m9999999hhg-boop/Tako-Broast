import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
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
} from 'lucide-react';

export const AdminStaffManagement: React.FC = () => {
  const { allUsers, addNewUser, updateExistingUser, deleteExistingUser, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

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
      case 'KITCHEN':
        return { label: 'طاقم المطبخ', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default:
        return { label: role, color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF6321]" />
            <span>إدارة الموظفين وفريق العمل</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إضافة وتعديل أسماء الموظفين، تحديد الصلاحيات وحماية كلمات المرور المشفرة
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-[#FF6321] hover:bg-[#e85516] text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 self-start shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة موظف جديد</span>
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
