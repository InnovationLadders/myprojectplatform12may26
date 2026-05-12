import React, { useState } from 'react';
import { AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import { checkPointsConsistency, syncStudentPoints } from '../../services/pointsSyncService';

interface PointsConsistencyCheckerProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export const PointsConsistencyChecker: React.FC<PointsConsistencyCheckerProps> = ({
  studentId,
  studentName,
  onClose,
}) => {
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{
    isConsistent: boolean;
    storedPoints: number;
    calculatedPoints: number;
    difference: number;
  } | null>(null);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const consistencyResult = await checkPointsConsistency(studentId);
      setResult(consistencyResult);
    } catch (error) {
      console.error('Error checking consistency:', error);
      alert('Failed to check consistency. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncStudentPoints(studentId);
      const updatedResult = await checkPointsConsistency(studentId);
      setResult(updatedResult);
      alert('Points synchronized successfully!');
    } catch (error) {
      console.error('Error syncing points:', error);
      alert('Failed to sync points. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Points Consistency Check</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            <strong>Student:</strong> {studentName}
          </p>
          <p className="text-sm text-gray-600">
            This tool checks if the stored points match the calculated points from project data.
          </p>
        </div>

        {!result ? (
          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                Check Consistency
              </>
            )}
          </button>
        ) : (
          <div>
            <div
              className={`p-4 rounded-lg mb-4 ${
                result.isConsistent
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {result.isConsistent ? (
                  <>
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Points are consistent!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900">Inconsistency detected!</span>
                  </>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Stored Points:</span>
                  <span className="font-semibold text-gray-900">{result.storedPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Calculated Points:</span>
                  <span className="font-semibold text-gray-900">{result.calculatedPoints}</span>
                </div>
                {!result.isConsistent && (
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="text-gray-700">Difference:</span>
                    <span className="font-bold text-red-600">{result.difference}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              {!result.isConsistent && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Sync Points
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleCheck}
                disabled={checking}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checking ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Recheck
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
          <p className="mb-1">
            <strong>Note:</strong> If inconsistency is detected, click "Sync Points" to recalculate
            from source data.
          </p>
          <p>
            This will update the stored points to match the calculated values based on all project
            activities.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PointsConsistencyChecker;
