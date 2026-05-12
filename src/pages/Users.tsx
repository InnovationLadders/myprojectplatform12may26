import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users as UsersIcon, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  GraduationCap,
  Building,
  Shield,
  Eye,
  UserPlus,
  AlertCircle,
  CheckCircle,
  School,
  Briefcase,
  X,
  UserCheck,
  UserX,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useUsers } from '../hooks/useUsers';
import { formatDate, formatRelativeTime } from '../utils/dateUtils';
import { UserFormModal } from '../components/UserManagement/UserFormModal';
import * as XLSX from 'xlsx';

const userRoles = [
  { id: 'all', name: 'جميع المستخدمين' },
  { id: 'student', name: 'طلاب', icon: GraduationCap, color: 'bg-blue-500' },
  { id: 'teacher', name: 'معلمين', icon: BookOpen, color: 'bg-green-500' },
  { id: 'school', name: 'مدارس', icon: Building, color: 'bg-purple-500' },
  { id: 'consultant', name: 'مستشارين', icon: Briefcase, color: 'bg-orange-500' },
  { id: 'admin', name: 'مديرين', icon: Shield, color: 'bg-red-500' },
];

const userStatuses = [
  { id: 'all', name: 'جميع الحالات' },
  { id: 'active', name: 'نشط', color: 'bg-green-100 text-green-800' },
  { id: 'pending', name: 'قيد المراجعة', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'inactive', name: 'غير نشط', color: 'bg-gray-100 text-gray-800' },
  { id: 'suspended', name: 'موقوف', color: 'bg-red-100 text-red-800' },
];

const Users: React.FC = () => {
  const { users, loading, error, addUser, editUser, removeUser, activateUser, deactivateUser } = useUsers();
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get unique schools and cities for filters
  const uniqueSchools = ['all', ...new Set(users.filter(u => u.school).map(u => u.school))];
  const uniqueCities = ['all', ...new Set(users.filter(u => u.schoolCity && u.schoolCity !== 'غير محدد').map(u => u.schoolCity))];

  const filteredUsers = users.filter(user => {
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.school && user.school.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesSchool = selectedSchool === 'all' || user.school === selectedSchool;
    const matchesCity = selectedCity === 'all' || user.schoolCity === selectedCity;
    
    return matchesRole && matchesSearch && matchesStatus && matchesSchool && matchesCity;
  });

  const getRoleText = (role: string) => {
    switch (role) {
      case 'student': return 'طالب';
      case 'teacher': return 'معلم';
      case 'school': return 'مدرسة';
      case 'admin': return 'مدير';
      case 'consultant': return 'مستشار';
      default: return role;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'pending': return 'قيد المراجعة';
      case 'inactive': return 'غير نشط';
      case 'suspended': return 'موقوف';
      default: return status;
    }
  };

  const getRoleIcon = (role: string) => {
    const roleInfo = userRoles.find(r => r.id === role);
    return roleInfo ? roleInfo.icon : UsersIcon;
  };

  const handleAddNewUser = () => {
    setEditingUser(null);
    setIsEditing(false);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditing(true);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setDeleteConfirmUser(user);
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    
    try {
      setActionLoading(`delete-${deleteConfirmUser.id}`);
      await removeUser(deleteConfirmUser.id);
      setDeleteConfirmUser(null);
      setSuccessMessage('تم حذف المستخدم بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('حدث خطأ في حذف المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      setActionLoading(`activate-${userId}`);
      await activateUser(userId);
      setSuccessMessage('تم تفعيل المستخدم بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error activating user:', error);
      alert('حدث خطأ في تفعيل المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      setActionLoading(`deactivate-${userId}`);
      await deactivateUser(userId);
      setSuccessMessage('تم تعطيل المستخدم بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('حدث خطأ في تعطيل المستخدم');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserFormSubmit = async (userData: any) => {
    try {
      if (isEditing && editingUser) {
        await editUser(editingUser.id, userData);
      } else {
        await addUser(userData);
      }
    } catch (error) {
      console.error('Error submitting user form:', error);
      throw error;
    }
  };

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = filteredUsers.map(user => ({
        'الاسم': user.name,
        'البريد الإلكتروني': user.email,
        'الدور': getRoleText(user.role),
        'المدرسة': user.school || 'غير محدد',
        'المدينة': user.schoolCity || 'غير محدد',
        'الحالة': getStatusText(user.status),
        'رقم الهاتف': user.phone || 'غير محدد',
        'الصف الدراسي': user.grade || 'غير محدد',
        'المادة التدريسية': user.subject || 'غير محدد',
        'تاريخ الانضمام': formatDate(user.joinedAt),
        'آخر نشاط': formatDate(user.lastActive)
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'المستخدمين');

      // Generate Excel file
      XLSX.writeFile(workbook, `المستخدمين_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setSuccessMessage('تم تصدير البيانات بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('حدث خطأ أثناء تصدير البيانات');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
              <p className="opacity-90">إدارة ومتابعة جميع مستخدمي المنصة</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={exportToExcel}
              className="bg-white bg-opacity-20 text-white px-6 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-all duration-200 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              تصدير Excel
            </button>
            <button 
              onClick={handleAddNewUser}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              إضافة مستخدم
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{users.length}</div>
            <div className="text-sm opacity-80">إجمالي المستخدمين</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'student').length}</div>
            <div className="text-sm opacity-80">طلاب</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'teacher').length}</div>
            <div className="text-sm opacity-80">معلمين</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{users.filter(u => u.role === 'school').length}</div>
            <div className="text-sm opacity-80">مدارس</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{users.filter(u => u.status === 'pending').length}</div>
            <div className="text-sm opacity-80">قيد المراجعة</div>
          </div>
        </div>
      </motion.div>

      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
        >
          <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-green-800 mb-1">تمت العملية بنجاح</h3>
            <p className="text-green-700">{successMessage}</p>
          </div>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="grid lg:grid-cols-6 gap-4 mb-6">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث بالاسم أو البريد الإلكتروني..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {userRoles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {userStatuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المدارس</option>
              {uniqueSchools.filter(school => school !== 'all').map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">جميع المدن</option>
              {uniqueCities.filter(city => city !== 'all').map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === 'pending'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            }`}
          >
            الحسابات المعلقة ({users.filter(u => u.status === 'pending').length})
          </button>
          <button
            onClick={() => setSelectedRole('school')}
            className={`px-4 py-2 rounded-xl transition-all ${
              selectedRole === 'school'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
            }`}
          >
            المدارس ({users.filter(u => u.role === 'school').length})
          </button>
          <button
            onClick={() => setSelectedRole('consultant')}
            className={`px-4 py-2 rounded-xl transition-all ${
              selectedRole === 'consultant'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
            }`}
          >
            المستشارين ({users.filter(u => u.role === 'consultant').length})
          </button>
        </div>
      </motion.div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          عرض {filteredUsers.length} من أصل {users.length} مستخدم
        </p>
        <button
          onClick={() => {
            setSelectedRole('all');
            setStatusFilter('all');
            setSelectedSchool('all');
            setSelectedCity('all');
            setSearchTerm('');
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          إعادة تعيين الفلاتر
        </button>
      </div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المستخدم
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المدرسة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المدينة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الانضمام
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const RoleIcon = getRoleIcon(user.role);
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img 
                            className="h-10 w-10 rounded-full object-cover" 
                            src={user.avatar} 
                            alt={user.name}
                          />
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <RoleIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{getRoleText(user.role)}</div>
                          {user.subject && (
                            <div className="text-xs text-gray-500">{user.subject}</div>
                          )}
                          {user.grade && (
                            <div className="text-xs text-gray-500">{user.grade}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.school || 'غير محدد'}</div>
                      {user.role === 'school' && user.studentsCount !== undefined && (
                        <div className="text-xs text-gray-500">
                          {user.studentsCount} طالب، {user.teachersCount || 0} معلم
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {user.schoolCity || user.location || 'غير محدد'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(user.joinedAt)}</div>
                      <div className="text-xs text-gray-400">
                        آخر نشاط: {formatRelativeTime(user.lastActive)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative group">
                        <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                          <MoreVertical className="w-5 h-5 text-gray-400" />
                        </button>
                        
                        <div className="absolute left-0 top-10 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="p-2">
                            <button className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                              <Eye className="w-4 h-4" />
                              عرض الملف الشخصي
                            </button>
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                            >
                              <Edit className="w-4 h-4" />
                              تعديل
                            </button>
                            
                            {/* Activation/Deactivation */}
                            {user.status === 'pending' && (
                              <button 
                                onClick={() => handleActivateUser(user.id)}
                                disabled={actionLoading === `activate-${user.id}`}
                                className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-md disabled:opacity-50"
                              >
                                {actionLoading === `activate-${user.id}` ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                                تفعيل
                              </button>
                            )}
                            
                            {user.status === 'active' && (
                              <button 
                                onClick={() => handleDeactivateUser(user.id)}
                                disabled={actionLoading === `deactivate-${user.id}`}
                                className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-orange-700 hover:bg-orange-50 rounded-md disabled:opacity-50"
                              >
                                {actionLoading === `deactivate-${user.id}` ? (
                                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <UserX className="w-4 h-4" />
                                )}
                                تعطيل
                              </button>
                            )}
                            
                            {user.status === 'inactive' && (
                              <button 
                                onClick={() => handleActivateUser(user.id)}
                                disabled={actionLoading === `activate-${user.id}`}
                                className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-md disabled:opacity-50"
                              >
                                {actionLoading === `activate-${user.id}` ? (
                                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <UserCheck className="w-4 h-4" />
                                )}
                                تفعيل
                              </button>
                            )}

                            <button className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                              <Mail className="w-4 h-4" />
                              إرسال رسالة
                            </button>
                            
                            <hr className="my-1" />
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="flex items-center gap-2 w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                            >
                              <Trash2 className="w-4 h-4" />
                              حذف
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لا يوجد مستخدمين</h3>
            <p className="text-gray-600 mb-4">
              {users.length === 0 
                ? 'لم يتم إضافة أي مستخدمين بعد' 
                : 'لم يتم العثور على مستخدمين يطابقون معايير البحث'}
            </p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={handleAddNewUser}
                className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                إضافة مستخدم جديد
              </button>
              {users.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedRole('all');
                    setStatusFilter('all');
                    setSelectedSchool('all');
                    setSelectedCity('all');
                    setSearchTerm('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* User Form Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserFormSubmit}
        editingUser={editingUser}
        isEditing={isEditing}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">تأكيد الحذف</h3>
                <p className="text-sm text-gray-600">هذا الإجراء لا يمكن التراجع عنه</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                هل أنت متأكد من حذف المستخدم التالي؟
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={deleteConfirmUser.avatar} 
                    alt={deleteConfirmUser.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{deleteConfirmUser.name}</p>
                    <p className="text-sm text-gray-600">{deleteConfirmUser.email}</p>
                    <p className="text-xs text-gray-500">{getRoleText(deleteConfirmUser.role)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={actionLoading === `delete-${deleteConfirmUser.id}`}
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={actionLoading === `delete-${deleteConfirmUser.id}`}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === `delete-${deleteConfirmUser.id}` ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Users;
