import React, { useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { Database, CircleCheck as CheckCircle, Circle as XCircle, CircleAlert as AlertCircle, Play, RefreshCw } from 'lucide-react';

const SOURCE_DB_ID = '(default)';
const TARGET_DB_ID = 'myprojectplatformdammam';

const COLLECTIONS = [
  'users',
  'projects',
  'project_students',
  'project_tasks',
  'project_ideas',
  'chat_messages',
  'consultations',
  'reviews',
  'store_items',
  'learning_resources',
  'gallery_projects',
  'summer_program_registrations',
  'project_meetings',
  'student_points',
  'points_history',
  'achievements_config',
  'student_achievements',
  'project_evaluations',
  'ai_assistant_config',
  'ai_assistant_usage',
  'email_notifications',
  'activities',
  'entrepreneurship_submissions',
  'intellectual_property',
  'points_config',
];

type CollectionStatus = 'pending' | 'running' | 'done' | 'error' | 'skipped';

interface CollectionResult {
  name: string;
  status: CollectionStatus;
  count: number;
  error?: string;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCKlDIhgAIPif3q2J4TAyVSBpdrUQ2P1G8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'my-project-plateform-react.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'my-project-plateform-react',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'my-project-plateform-react.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1092300975970',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1092300975970:web:76e0d3717dbf899c7b463b',
};

function getSourceDb() {
  const app = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
  return getFirestore(app);
}

function getTargetDb() {
  const appName = 'target-db-app';
  const app = getApps().find(a => a.name === appName) || initializeApp(firebaseConfig, appName);
  return getFirestore(app, TARGET_DB_ID);
}

async function copyCollection(
  colName: string,
  onProgress: (msg: string) => void
): Promise<{ count: number }> {
  const sourceDb = getSourceDb();
  const targetDb = getTargetDb();

  const sourceSnap = await getDocs(collection(sourceDb, colName));

  if (sourceSnap.empty) {
    onProgress(`Collection "${colName}" is empty, skipping.`);
    return { count: 0 };
  }

  onProgress(`Copying ${sourceSnap.size} documents from "${colName}"...`);

  const docs = sourceSnap.docs;
  const BATCH_SIZE = 400;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(targetDb);
    chunk.forEach(d => {
      const targetRef = doc(targetDb, colName, d.id);
      batch.set(targetRef, d.data());
    });
    await batch.commit();
    onProgress(`  Written ${Math.min(i + BATCH_SIZE, docs.length)} / ${docs.length} documents...`);
  }

  return { count: docs.size };
}

const MigrateToNewDatabase: React.FC = () => {
  const [results, setResults] = useState<CollectionResult[]>(
    COLLECTIONS.map(name => ({ name, status: 'pending', count: 0 }))
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ total: number; errors: number } | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const updateResult = (name: string, patch: Partial<CollectionResult>) => {
    setResults(prev => prev.map(r => r.name === name ? { ...r, ...patch } : r));
  };

  const startMigration = async () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setSummary(null);
    setLogs([]);
    setResults(COLLECTIONS.map(name => ({ name, status: 'pending', count: 0 })));

    addLog(`Starting migration from "${SOURCE_DB_ID}" to "${TARGET_DB_ID}"...`);
    addLog(`Project: ${firebaseConfig.projectId}`);

    let totalCopied = 0;
    let totalErrors = 0;

    for (const colName of COLLECTIONS) {
      updateResult(colName, { status: 'running' });
      addLog(`Processing collection: ${colName}`);
      try {
        const { count } = await copyCollection(colName, addLog);
        totalCopied += count;
        updateResult(colName, { status: count === 0 ? 'skipped' : 'done', count });
        addLog(`Done: "${colName}" - ${count} documents copied.`);
      } catch (err: any) {
        totalErrors++;
        const msg = err?.message || String(err);
        updateResult(colName, { status: 'error', error: msg });
        addLog(`ERROR in "${colName}": ${msg}`);
      }
    }

    setSummary({ total: totalCopied, errors: totalErrors });
    setDone(true);
    setRunning(false);
    addLog(`Migration complete. Total documents copied: ${totalCopied}. Errors: ${totalErrors}.`);
  };

  const statusIcon = (status: CollectionStatus) => {
    if (status === 'done') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'error') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'running') return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
    if (status === 'skipped') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
  };

  const statusBg = (status: CollectionStatus) => {
    if (status === 'done') return 'bg-green-50 border-green-200';
    if (status === 'error') return 'bg-red-50 border-red-200';
    if (status === 'running') return 'bg-blue-50 border-blue-200';
    if (status === 'skipped') return 'bg-yellow-50 border-yellow-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Database className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">نقل قاعدة البيانات</h1>
          <p className="text-sm text-gray-500">
            نسخ البيانات من <span className="font-mono font-semibold text-gray-700">(default)</span> الى{' '}
            <span className="font-mono font-semibold text-gray-700">myprojectplatformdammam</span>
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">تنبيه مهم قبل البدء</p>
          <ul className="list-disc list-inside space-y-1 text-amber-700">
            <li>هذه العملية تقرأ فقط من قاعدة البيانات <strong>(default)</strong> ولا تعدل عليها</li>
            <li>سيتم نسخ جميع المستندات الى <strong>myprojectplatformdammam</strong></li>
            <li>اذا كانت المستندات موجودة مسبقاً في الوجهة ستُستبدل</li>
            <li>تاكد من ان قاعدة البيانات <strong>myprojectplatformdammam</strong> موجودة ومفعلة في Firebase Console</li>
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={startMigration}
          disabled={running}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors shadow-sm"
        >
          {running ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          {running ? 'جاري النسخ...' : 'ابدأ النسخ'}
        </button>

        {done && summary && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
            summary.errors === 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {summary.errors === 0 ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {summary.errors === 0
              ? `تم النسخ بنجاح - ${summary.total} مستند`
              : `اكتمل مع ${summary.errors} خطأ - ${summary.total} مستند`}
          </div>
        )}
      </div>

      {/* Collections Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          المجموعات ({COLLECTIONS.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map(r => (
            <div
              key={r.name}
              className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${statusBg(r.status)}`}
            >
              <div className="flex items-center gap-2">
                {statusIcon(r.status)}
                <span className="font-mono text-gray-800">{r.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {r.status === 'error' && (
                  <span className="text-xs text-red-600 max-w-[120px] truncate" title={r.error}>
                    {r.error}
                  </span>
                )}
                {(r.status === 'done' || r.status === 'skipped') && (
                  <span className={`text-xs font-medium ${r.count > 0 ? 'text-green-700' : 'text-yellow-700'}`}>
                    {r.count > 0 ? `${r.count} docs` : 'فارغة'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            السجل
          </h2>
          <div className="bg-gray-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-green-400 space-y-1">
            {logs.map((log, i) => (
              <div key={i} className={log.includes('ERROR') ? 'text-red-400' : log.includes('Done:') ? 'text-green-300' : 'text-gray-400'}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MigrateToNewDatabase;
