import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RefreshCw, AlertCircle, CheckCircle, Database, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const DebugUser: React.FC = () => {
  const { user, logout } = useAuth();
  const [firestoreData, setFirestoreData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFirestoreData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        setFirestoreData(userDoc.data());
      } else {
        setError('User document not found in Firestore');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirestoreData();
  }, [user?.id]);

  const handleClearCache = () => {
    sessionStorage.removeItem('userProfile');
    alert('تم مسح الكاش! سيتم إعادة تحميل الصفحة...');
    window.location.reload();
  };

  const handleRefreshData = () => {
    sessionStorage.removeItem('userProfile');
    fetchFirestoreData();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">No User Logged In</h2>
          <p className="text-gray-600">Please log in to view debug information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">User Debug Panel</h1>
                <p className="text-sm text-gray-500">Developer diagnostic tool</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefreshData}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Clear Cache
              </button>
            </div>
          </div>

          {/* Current Session Data */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Current Session (From Context)
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap overflow-auto">
                {JSON.stringify(
                  {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    status: user.status,
                    school_id: user.school_id,
                    grade: user.grade,
                    subject: user.subject,
                    createdAt: user.createdAt
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          {/* Cache Data */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Cached Data (SessionStorage)
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
              <pre className="whitespace-pre-wrap overflow-auto">
                {(() => {
                  const cached = sessionStorage.getItem('userProfile');
                  if (cached) {
                    try {
                      return JSON.stringify(JSON.parse(cached), null, 2);
                    } catch (e) {
                      return 'Invalid JSON in cache';
                    }
                  }
                  return 'No cached data';
                })()}
              </pre>
            </div>
          </div>

          {/* Firestore Data */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              Firestore Database (Raw)
            </h2>
            {loading ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading Firestore data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            ) : firestoreData ? (
              <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap overflow-auto">
                  {JSON.stringify(firestoreData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-yellow-700">No data loaded</p>
              </div>
            )}
          </div>

          {/* Role Validation */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3">Role Validation</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Session Role</p>
                <p className={`text-2xl font-bold ${
                  user.role ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user.role || 'MISSING'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Firestore Role</p>
                <p className={`text-2xl font-bold ${
                  firestoreData?.role ? 'text-green-600' : 'text-red-600'
                }`}>
                  {firestoreData?.role || 'MISSING'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Roles Match</p>
                <p className={`text-2xl font-bold ${
                  user.role === firestoreData?.role ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user.role === firestoreData?.role ? '✓ YES' : '✗ NO'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Valid Role</p>
                <p className={`text-2xl font-bold ${
                  ['student', 'teacher', 'school', 'admin', 'consultant'].includes(user.role)
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {['student', 'teacher', 'school', 'admin', 'consultant'].includes(user.role)
                    ? '✓ YES'
                    : '✗ NO'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = '/projects'}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Projects
            </button>
            <button
              onClick={() => logout(() => window.location.href = '/')}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
