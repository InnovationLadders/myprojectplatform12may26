import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, CircleCheck as CheckCircle, Circle as XCircle, ChevronDown, ChevronUp, MessageSquare, Calendar, Search } from 'lucide-react';
import { useInvestorRequests, InvestorInterestRequest } from '../hooks/useInvestorRequests';
import { formatDate } from '../utils/dateUtils';

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'closed';

const statusConfig = {
  pending: { label: 'قيد الانتظار', icon: Clock, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  in_progress: { label: 'تحت المعالجة', icon: TrendingUp, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  closed: { label: 'مغلق', icon: XCircle, color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const InvestorRequests: React.FC = () => {
  const { requests, loading, error, updateRequestStatus } = useInvestorRequests();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'in_progress' | 'closed'>('in_progress');
  const [saving, setSaving] = useState(false);

  const filtered = requests.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.investor_name.includes(searchTerm) ||
      r.project_title.includes(searchTerm) ||
      (r.investor_company || '').includes(searchTerm);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    closed: requests.filter(r => r.status === 'closed').length,
  };

  const startEdit = (req: InvestorInterestRequest) => {
    setEditingId(req.id);
    setEditNotes(req.admin_notes || '');
    setEditStatus(req.status);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNotes('');
  };

  const saveEdit = async (requestId: string) => {
    setSaving(true);
    try {
      await updateRequestStatus(requestId, editStatus, editNotes);
      setEditingId(null);
    } catch (err) {
      console.error('Error updating request:', err);
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-2xl font-bold">طلبات المستثمرين</h1>
            <p className="opacity-90 text-sm mt-0.5">إدارة طلبات الاهتمام بمشاريع مؤسستك</p>
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
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="البحث باسم المستثمر أو المشروع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Status Tabs */}
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

      {/* Requests List */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">{error}</div>
      )}

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-sm p-12 text-center"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد طلبات</h3>
          <p className="text-gray-500 text-sm">لم يتم استلام أي طلبات اهتمام بعد</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, index) => {
            const isExpanded = expandedId === req.id;
            const isEditing = editingId === req.id;
            const cfg = statusConfig[req.status];

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Card Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 truncate">{req.investor_name}</p>
                        {req.investor_company && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{req.investor_company}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">المشروع: {req.project_title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <Calendar className="w-3 h-3 inline ml-1" />
                        {formatDate(req.created_at)}
                      </p>
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

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 space-y-4 bg-gray-50">
                    {/* Investor Notes */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">ملاحظات المستثمر</p>
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                        {req.investor_notes || <span className="text-gray-400 italic">لا توجد ملاحظات</span>}
                      </div>
                    </div>

                    {/* Admin response */}
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-2 block">الحالة</label>
                          <div className="flex gap-2 flex-wrap">
                            {(['pending', 'in_progress', 'closed'] as const).map(s => (
                              <button
                                key={s}
                                onClick={() => setEditStatus(s)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                  editStatus === s
                                    ? statusConfig[s].color + ' shadow-sm'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {statusConfig[s].label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-2 block">ملاحظات مدير الاستثمار</label>
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm"
                            placeholder="أضف ملاحظاتك للمستثمر..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(req.id)}
                            disabled={saving}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <CheckCircle className="w-4 h-4" />}
                            حفظ
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {req.admin_notes && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">ملاحظات مدير الاستثمار</p>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
                              {req.admin_notes}
                            </div>
                          </div>
                        )}
                        <button
                          onClick={() => startEdit(req)}
                          className="w-full bg-white border-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {req.admin_notes ? 'تعديل الرد' : 'الرد والتحديث'}
                        </button>
                      </>
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
