import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  Settings,
  BarChart3,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAIConfig,
  updateAIConfig,
  validateOpenAIKey,
  getAIUsageStats,
  getRecentAIUsage,
  AIAssistantConfig,
  AIUsageLog,
  AIUsageStats
} from '../../services/aiAssistantService';
import * as XLSX from 'xlsx';

const ManageAIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [config, setConfig] = useState<AIAssistantConfig | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'stats' | 'usage'>('config');
  const [stats, setStats] = useState<AIUsageStats | null>(null);
  const [recentUsage, setRecentUsage] = useState<AIUsageLog[]>([]);
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, statsData, usageData] = await Promise.all([
        getAIConfig(),
        getAIUsageStats(),
        getRecentAIUsage(100)
      ]);

      setConfig(configData);
      setStats(statsData);
      setRecentUsage(usageData);
    } catch (error) {
      console.error('Error loading AI assistant data:', error);
      setErrorMessage('Failed to load AI assistant data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config || !user) return;

    try {
      setSaving(true);
      setSuccessMessage('');
      setErrorMessage('');

      await updateAIConfig(config, user.id);

      setSuccessMessage('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setErrorMessage('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleValidateApiKey = async () => {
    if (!config?.apiKey) return;

    try {
      setValidating(true);
      const isValid = await validateOpenAIKey(config.apiKey);
      setApiKeyValid(isValid);

      if (isValid) {
        setSuccessMessage('API Key is valid!');
      } else {
        setErrorMessage('API Key is invalid!');
      }

      setTimeout(() => {
        setSuccessMessage('');
        setErrorMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error validating API key:', error);
      setApiKeyValid(false);
      setErrorMessage('Failed to validate API key');
    } finally {
      setValidating(false);
    }
  };

  const exportUsageData = () => {
    if (recentUsage.length === 0) return;

    const data = recentUsage.map((log, index) => ({
      '#': index + 1,
      'User': log.userName || 'Unknown',
      'Email': log.userEmail || 'N/A',
      'Prompt': log.prompt.substring(0, 100),
      'Response': log.response.substring(0, 100),
      'Model': log.model,
      'Tokens Used': log.tokensUsed,
      'Cost ($)': log.costEstimate.toFixed(6),
      'Timestamp': log.timestamp.toLocaleString('ar-SA')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AI Usage');
    XLSX.writeFile(wb, `ai_usage_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Failed to Load Configuration</h2>
          <p className="text-red-600">Unable to load AI assistant configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المساعد الذكي</h1>
        <p className="text-gray-600">إدارة وتكوين خدمة المساعد الذكي بتقنية OpenAI</p>
      </div>

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">{successMessage}</p>
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
        >
          <XCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">{errorMessage}</p>
        </motion.div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              الإعدادات
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              الإحصائيات
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${
                activeTab === 'usage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              سجل الاستخدام
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Bot className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">تكوين الخدمة</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  قم بتكوين إعدادات المساعد الذكي المدعوم بـ OpenAI
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.serviceEnabled}
                      onChange={(e) => setConfig({ ...config, serviceEnabled: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">تفعيل الخدمة</div>
                      <div className="text-sm text-gray-600">السماح للمستخدمين باستخدام المساعد الذكي</div>
                    </div>
                  </label>
                </div>

                <div className={`p-4 rounded-xl ${config.serviceEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    {config.serviceEnabled ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800">الخدمة مفعّلة</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-gray-400" />
                        <span className="font-medium text-gray-600">الخدمة معطّلة</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  مفتاح OpenAI API
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={config.apiKey}
                      onChange={(e) => {
                        setConfig({ ...config, apiKey: e.target.value });
                        setApiKeyValid(null);
                      }}
                      placeholder="sk-..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    onClick={handleValidateApiKey}
                    disabled={!config.apiKey || validating}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {validating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    التحقق
                  </button>
                </div>
                {apiKeyValid !== null && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${apiKeyValid ? 'text-green-600' : 'text-red-600'}`}>
                    {apiKeyValid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {apiKeyValid ? 'المفتاح صالح' : 'المفتاح غير صالح'}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    النموذج
                  </label>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (أسرع وأرخص)</option>
                    <option value="gpt-4o">GPT-4o (متوازن)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo (قوي)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (اقتصادي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    درجة الحرارة (Temperature)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">0 = أكثر تحديداً، 2 = أكثر إبداعاً</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحد الأقصى للرموز (Max Tokens)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="4000"
                    step="100"
                    value={config.maxTokens}
                    onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحد اليومي لكل مستخدم
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.dailyLimitPerUser}
                    onChange={(e) => setConfig({ ...config, dailyLimitPerUser: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الحد اليومي العام
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={config.globalDailyLimit}
                    onChange={(e) => setConfig({ ...config, globalDailyLimit: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    تعليمات النظام (System Prompt)
                  </label>
                  <textarea
                    value={config.systemPrompt}
                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      حفظ الإعدادات
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="w-8 h-8 text-blue-600" />
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-blue-900">{stats.totalRequests}</div>
                  <div className="text-sm text-blue-700">إجمالي الطلبات</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-green-600" />
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-3xl font-bold text-green-900">{stats.activeUsers}</div>
                  <div className="text-sm text-green-700">مستخدمين نشطين</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-8 h-8 text-purple-600" />
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-3xl font-bold text-purple-900">{stats.todayRequests}</div>
                  <div className="text-sm text-purple-700">طلبات اليوم</div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-8 h-8 text-orange-600" />
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="text-3xl font-bold text-orange-900">${stats.totalCostEstimate.toFixed(2)}</div>
                  <div className="text-sm text-orange-700">التكلفة الإجمالية</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">إحصائيات اليوم</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الطلبات</span>
                      <span className="font-bold text-gray-900">{stats.todayRequests}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الرموز المستخدمة</span>
                      <span className="font-bold text-gray-900">{stats.todayTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">التكلفة</span>
                      <span className="font-bold text-gray-900">${stats.todayCost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">إحصائيات عامة</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">إجمالي الرموز</span>
                      <span className="font-bold text-gray-900">{stats.totalTokensUsed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">متوسط الطلبات/مستخدم</span>
                      <span className="font-bold text-gray-900">
                        {stats.activeUsers > 0 ? (stats.totalRequests / stats.activeUsers).toFixed(1) : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">متوسط التكلفة/طلب</span>
                      <span className="font-bold text-gray-900">
                        ${stats.totalRequests > 0 ? (stats.totalCostEstimate / stats.totalRequests).toFixed(4) : '0.0000'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">سجل الاستخدام الأخير</h2>
                <button
                  onClick={exportUsageData}
                  disabled={recentUsage.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  تصدير Excel
                </button>
              </div>

              {recentUsage.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد بيانات استخدام</h3>
                  <p className="text-gray-600">لم يتم تسجيل أي استخدام للمساعد الذكي بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المستخدم</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">السؤال</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">النموذج</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الرموز</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التكلفة</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">الوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentUsage.map((log, index) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm text-gray-900">{index + 1}</td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{log.userName || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{log.userEmail || 'N/A'}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate" title={log.prompt}>
                            {log.prompt.substring(0, 50)}...
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{log.model}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">{log.tokensUsed}</td>
                          <td className="px-4 py-4 text-sm text-gray-900">${log.costEstimate.toFixed(6)}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {log.timestamp.toLocaleString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageAIAssistant;
