import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Circle as XCircle, ChevronDown, ChevronUp, Calendar, Building, Search } from 'lucide-react';
import { useInvestorRequests } from '../hooks/useInvestorRequests';
import { formatDate } from '../utils/dateUtils';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'closed';

const statusConfig = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', desc: 'طلبك قيد المراجعة من قبل مدير المؤسسة' },
  in_progress: { label: 'تحت المعالجة', icon: TrendingUp, color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'جاري العمل على طلبك' },
  closed: { label: 'مغلق', icon: XCircle, color: 'bg-gray-100 text-gray-600 border-gray-200', desc: 'تم إغلاق هذا الطلب' },
};

export const MyInvestorRequests: React.FC = () => {
  const { requests, loading, error } = useInvestorRequests();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = requests.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch = r.project_title.includes(searchTerm) || (r.school_name || '').includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    closed: requests.filter(r => r.status === 'closed').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">طلباتي الاستثمارية</h1>
            <p className="opacity-90 text-sm mt-0.5">تتبع طلبات الاهتمام التي أرسلتها</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white bg-opacity-10 rounded-xl p-3">
            <div className="text-2xl font-bold">{counts.pending}</div>
            <div className="text-xs opacity-80">قيد الانتظار</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-xl p-3">
            <div className="text-2xl font-bold">{counts.in_progress}</div>
            <div className="text-xs opacity-80">تحت المعالجة</div>
          </div>
          <div className="bg-white bg-opacity-10 rounded-xl p-3">
            <div className="text-2xl font-bold">{counts.closed}</div>
            <div className="text-xs opacity-80">مغلقة</div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm p-5"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث باسم المشروع أو المؤسسة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'in_progress', 'closed'] as StatusFilter[]).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'الكل' : statusConfig[status].label}
                <span className={`mr-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                  statusFilter === status ? 'bg-white bg-opacity-30 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {counts[status]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* List */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>
      )}

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm p-12 text-center"
        >
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
          <p className="text-gray-500 text-sm">
            {requests.length === 0
              ? 'لم تقم بإرسال أي طلبات اهتمام بعد. تصفح معرض المشاريع وسجّل اهتمامك بأي مشروع.'
              : 'لا توجد طلبات تطابق معايير البحث'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, index) => {
            const isExpanded = expandedId === req.id;
            const cfg = statusConfig[req.status];

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{req.project_title}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5 flex-wrap">
                        {req.school_name && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {req.school_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(req.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                      {React.createElement(cfg.icon, { className: 'w-3 h-3' })}
                      {cfg.label}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50">
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${cfg.color}`}>
                      {React.createElement(cfg.icon, { className: 'w-4 h-4 flex-shrink-0' })}
                      <span>{cfg.desc}</span>
                    </div>

                    {req.investor_notes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">ملاحظاتك</p>
                        <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                          {req.investor_notes}
                        </div>
                      </div>
                    )}

                    {req.admin_notes && (
                      <div>
                        <p className="text-xs font-medium text-emerald-600 mb-2">رد مدير المؤسسة</p>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                          {req.admin_notes}
                        </div>
                      </div>
                    )}

                    {!req.admin_notes && (
                      <p className="text-xs text-gray-400 text-center py-2">لم يتم الرد على طلبك بعد</p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
