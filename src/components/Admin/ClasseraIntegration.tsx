import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { School, Settings, Users, CircleCheck as CheckCircle, Circle as XCircle, Clock, TriangleAlert as AlertTriangle, RefreshCw, Download, Upload, Eye, ChartBar as BarChart3, FolderSync as Sync, ExternalLink, Copy, Key, Globe, Shield } from 'lucide-react';
import { CLASSERA_CONFIG, generateLTIToolConfiguration, generateJWKS } from '../../lib/classera';
import { formatDate } from '../../utils/dateUtils';

interface SyncBatch {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  schools_count: number;
  users_count: number;
  error_message?: string;
}

export const ClasseraIntegration: React.FC = () => {
  const [syncBatches, setSyncBatches] = useState<SyncBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLTIConfig, setShowLTIConfig] = useState(false);
  const [showJWKS, setShowJWKS] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Mock data for demonstration
  useEffect(() => {
    const mockBatches: SyncBatch[] = [
      {
        id: 'batch_001',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000 + 300000).toISOString(),
        schools_count: 5,
        users_count: 150
      },
      {
        id: 'batch_002',
        status: 'processing',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000 + 60000).toISOString(),
        schools_count: 2,
        users_count: 75
      },
      {
        id: 'batch_003',
        status: 'failed',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000 + 120000).toISOString(),
        schools_count: 1,
        users_count: 25,
        error_message: 'Connection timeout to Classera API'
      }
    ];

    setSyncBatches(mockBatches);
    setLoading(false);
  }, []);

  const ltiConfig = generateLTIToolConfiguration();
  const jwks = generateJWKS();

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'processing': return 'قيد المعالجة';
      case 'failed': return 'فشل';
      case 'pending': return 'في الانتظار';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const triggerManualSync = async () => {
    console.log('Triggering manual sync with Classera...');
    // Implement manual sync logic
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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
        className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">تكامل Classera</h1>
              <p className="opacity-90">إدارة التكامل مع منصة Classera التعليمية (Tool Provider)</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-xl hover:bg-opacity-30 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button
              onClick={triggerManualSync}
              className="bg-white text-green-600 px-6 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              مزامنة يدوية
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{syncBatches.length}</div>
            <div className="text-sm opacity-80">دفعات المزامنة</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{syncBatches.filter(b => b.status === 'completed').length}</div>
            <div className="text-sm opacity-80">مكتملة</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {syncBatches.reduce((sum, batch) => sum + batch.schools_count, 0)}
            </div>
            <div className="text-sm opacity-80">مدارس متزامنة</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {syncBatches.reduce((sum, batch) => sum + batch.users_count, 0)}
            </div>
            <div className="text-sm opacity-80">مستخدمين متزامنين</div>
          </div>
        </div>
      </motion.div>

      {/* LTI Tool Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Key className="w-6 h-6 text-green-600" />
            إعدادات LTI Tool Provider
          </h2>
          <button
            onClick={() => setShowLTIConfig(!showLTIConfig)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {showLTIConfig ? 'إخفاء' : 'عرض'} الإعدادات
          </button>
        </div>

        {showLTIConfig && (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Initiate Login URL</label>
                  <button
                    onClick={() => copyToClipboard(CLASSERA_CONFIG.INITIATE_LOGIN_URL, 'initiate')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedField === 'initiate' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {CLASSERA_CONFIG.INITIATE_LOGIN_URL}
                </code>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Target Link URI</label>
                  <button
                    onClick={() => copyToClipboard(CLASSERA_CONFIG.TARGET_LINK_URI, 'target')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedField === 'target' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {CLASSERA_CONFIG.TARGET_LINK_URI}
                </code>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">JWKS URL</label>
                  <button
                    onClick={() => copyToClipboard(CLASSERA_CONFIG.JWKS_URL, 'jwks')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedField === 'jwks' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {CLASSERA_CONFIG.JWKS_URL}
                </code>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Tool Name</label>
                  <button
                    onClick={() => copyToClipboard(CLASSERA_CONFIG.TOOL_NAME, 'name')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedField === 'name' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {CLASSERA_CONFIG.TOOL_NAME}
                </code>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">معلومات مهمة للتكامل</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• هذه هي الإعدادات الرسمية المقدمة من شركة Classera</li>
                    <li>• Client ID: {CLASSERA_CONFIG.CLIENT_ID}</li>
                    <li>• Platform Issuer: {CLASSERA_CONFIG.PLATFORM_ISSUER}</li>
                    <li>• Deployment ID: {CLASSERA_CONFIG.DEPLOYMENT_ID}</li>
                    <li>• Partner Name: {CLASSERA_CONFIG.PARTNER_NAME}</li>
                    <li>• تأكد من تفعيل الأذونات المطلوبة للأداة</li>
                    <li>• يجب إعداد JWKS بشكل صحيح للتوقيع الرقمي</li>
                    <li>• البيئة الحالية: {CLASSERA_CONFIG.IS_PRODUCTION ? 'الإنتاج' : 'التطوير (Staging)'}</li>
                    <li>• Accept Types: {CLASSERA_CONFIG.ACCEPT_TYPES?.join(', ')}</li>
                    <li>• API Domain: {CLASSERA_CONFIG.CLASSERA_API_DOMAIN}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Webview Login Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Globe className="w-6 h-6 text-green-600" />
          إعدادات Webview Login
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">معلومات البيئة الحالية</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm text-gray-600 mb-1">البيئة</label>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    CLASSERA_CONFIG.IS_PRODUCTION ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {CLASSERA_CONFIG.IS_PRODUCTION ? 'الإنتاج' : 'التطوير (Staging)'}
                  </span>
                  <span className="text-sm text-gray-700">{CLASSERA_CONFIG.HOST}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm text-gray-600 mb-1">API Domain</label>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {CLASSERA_CONFIG.CLASSERA_API_DOMAIN}
                </code>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm text-gray-600 mb-1">Deployment ID</label>
                <code className="text-xs bg-white p-2 rounded border block">
                  {CLASSERA_CONFIG.DEPLOYMENT_ID}
                </code>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Webview Login URL</label>
                  <button
                    onClick={() => copyToClipboard(CLASSERA_CONFIG.WEBVIEW_LOGIN_URL, 'webview')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedField === 'webview' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {CLASSERA_CONFIG.WEBVIEW_LOGIN_URL}
                </code>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Access Token</label>
                  <button
                    onClick={() => copyToClipboard(CLASSERA_CONFIG.ACCESS_TOKEN, 'token')}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    {copiedField === 'token' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <code className="text-xs bg-white p-2 rounded border block overflow-x-auto">
                  {CLASSERA_CONFIG.ACCESS_TOKEN}
                </code>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm text-gray-600 mb-1">Partner Name</label>
                <code className="text-xs bg-white p-2 rounded border block">
                  {CLASSERA_CONFIG.PARTNER_NAME}
                </code>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">حسابات الاختبار</h3>
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <h4 className="font-medium text-green-800 mb-2">الحسابات المفعلة</h4>
                <div className="space-y-1 text-xs">
                  {CLASSERA_CONFIG.IS_PRODUCTION ? (
                    <>
                      <div>Admin: <code>Hasan4ts0004</code></div>
                      <div>Student: <code>hasan4s0007</code></div>
                      <div>Teacher: <code>Hasan4t0002</code></div>
                      <div>New Student: <code>LtmStdPartner</code></div>
                      <div>New Teacher: <code>LtmTeacherPartner</code></div>
                      <div>Supervisor: <code>LtmSupervisorPartner</code></div>
                    </>
                  ) : (
                    <>
                      <div>Admin: <code>aed2ts0001</code></div>
                      <div>Student: <code>aed2s1228</code></div>
                      <div>Student 2: <code>aed2s0003</code></div>
                      <div>Teacher: <code>aed2t0001</code></div>
                      <div>New Student: <code>LtmStdPartner</code></div>
                      <div>New Teacher: <code>LtmTeacherPartner</code></div>
                      <div>Supervisor: <code>LtmSupervisorPartner</code></div>
                    </>
                  )}
                  <div className="mt-2 font-medium">كلمة المرور للجميع: <code>Class@987</code></div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-medium text-red-800 mb-2">الحسابات المعطلة</h4>
                <div className="space-y-1 text-xs text-red-700">
                  <div>لا تستخدم هذه الحسابات - ستظهر رسالة خطأ</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <a
            href={CLASSERA_CONFIG.WEBVIEW_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-green-600 px-6 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 flex items-center gap-2"
          >
            <ExternalLink className="w-5 h-5" />
            اختبار تسجيل الدخول مباشرة
          </a>
        </div>
      </motion.div>

      {/* Integration Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6 text-green-600" />
          حالة التكامل
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-green-800">Webview Login متصل</h3>
            </div>
            <p className="text-green-700 text-sm">تسجيل الدخول عبر النافذة المنبثقة يعمل بشكل طبيعي</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-6 h-6 text-blue-600" />
              <h3 className="font-semibold text-blue-800">API التحقق</h3>
            </div>
            <p className="text-blue-700 text-sm">API التحقق من المستخدمين متاح</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              <h3 className="font-semibold text-purple-800">LTI Tool Provider</h3>
            </div>
            <p className="text-purple-700 text-sm">إعدادات الأداة جاهزة للتكامل</p>
          </div>
        </div>
      </motion.div>

      {/* JWKS Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            JWKS (JSON Web Key Set)
          </h2>
          <button
            onClick={() => setShowJWKS(!showJWKS)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            {showJWKS ? 'إخفاء' : 'عرض'} JWKS
          </button>
        </div>

        {showJWKS && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">JWKS JSON</label>
              <button
                onClick={() => copyToClipboard(JSON.stringify(jwks, null, 2), 'jwks-json')}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                {copiedField === 'jwks-json' ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="text-xs bg-white p-4 rounded border overflow-x-auto">
              {JSON.stringify(jwks, null, 2)}
            </pre>
            <p className="text-xs text-gray-600 mt-2">
              ملاحظة: هذا مثال للتطوير. في الإنتاج، يجب إنشاء مفاتيح RSA حقيقية.
            </p>
          </div>
        )}
      </motion.div>

      {/* Sync History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Sync className="w-6 h-6 text-green-600" />
          سجل المزامنة
        </h2>

        <div className="space-y-4">
          {syncBatches.map((batch) => (
            <div key={batch.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(batch.status)}
                  <div>
                    <h3 className="font-semibold text-gray-800">دفعة المزامنة {batch.id}</h3>
                    <p className="text-gray-600 text-sm">
                      {batch.schools_count} مدارس، {batch.users_count} مستخدم
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                  {getStatusText(batch.status)}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div>
                  <span>بدأت: {formatDate(batch.created_at)}</span>
                  {batch.status !== 'pending' && (
                    <span className="mr-4">انتهت: {formatDate(batch.updated_at)}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                    <Eye className="w-4 h-4" />
                  </button>
                  {batch.status === 'completed' && (
                    <button className="p-1 text-green-600 hover:bg-green-100 rounded">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {batch.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 text-sm font-medium">خطأ في المزامنة</p>
                      <p className="text-red-700 text-xs">{batch.error_message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {syncBatches.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد عمليات مزامنة</h3>
            <p className="text-gray-600">لم يتم تنفيذ أي عمليات مزامنة مع Classera بعد</p>
          </div>
        )}
      </motion.div>

      {/* Integration Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="bg-blue-50 border border-blue-200 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">دليل التكامل مع Classera (Tool Provider)</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">خطوات التكامل</h3>
            <ol className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 mt-0.5">1</span>
                <span>تسجيل المنصة في Classera كـ Tool Provider</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 mt-0.5">2</span>
                <span>إعداد LTI 1.3 Tool Configuration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 mt-0.5">3</span>
                <span>تكوين Webview Login للمصادقة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600 mt-0.5">4</span>
                <span>اختبار التكامل والمزامنة</span>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">المتطلبات التقنية</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>LTI 1.3 Tool Provider Support</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>OIDC Login Initiation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>JWKS Endpoint للتوقيع الرقمي</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Webview Login Integration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Grade Passback Support</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
