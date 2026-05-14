import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllStudentsWithPoints,
  getAchievementConfig,
  updateAchievementConfig,
  manuallyAdjustPoints,
  resetStudentPoints,
  getPointsHistory,
  calculateAchievements,
  recalculateAllStudentPoints,
  StudentPoints,
  AchievementConfig,
  PointsHistory,
  RecalculationResult,
} from '../../services/rewardPointsService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Award, Settings, Download, Search, Plus, Minus, RefreshCw, History, Calculator, FileText, CircleCheck as CheckCircle } from 'lucide-react';
import AchievementBadge from '../../components/Rewards/AchievementBadge';
import PointsConsistencyChecker from '../../components/Admin/PointsConsistencyChecker';
import { useAuth } from '../../contexts/AuthContext';
import * as XLSX from 'xlsx';

interface StudentWithDetails extends StudentPoints {
  name?: string;
  email?: string;
  school?: string;
}

const ManageRewards: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithDetails[]>([]);
  const [config, setConfig] = useState<AchievementConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [studentHistory, setStudentHistory] = useState<PointsHistory[]>([]);
  const [configForm, setConfigForm] = useState<AchievementConfig | null>(null);
  const [showRecalculateConfirm, setShowRecalculateConfirm] = useState(false);
  const [showRecalculateProgress, setShowRecalculateProgress] = useState(false);
  const [recalculationProgress, setRecalculationProgress] = useState({ current: 0, total: 0, studentId: '' });
  const [recalculationResult, setRecalculationResult] = useState<RecalculationResult | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showConsistencyChecker, setShowConsistencyChecker] = useState(false);
  const [consistencyCheckStudent, setConsistencyCheckStudent] = useState<StudentWithDetails | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredStudents(
        students.filter(
          (s) =>
            s.name?.toLowerCase().includes(query) ||
            s.email?.toLowerCase().includes(query) ||
            s.school?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, students]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsWithPoints, achievementConfig] = await Promise.all([
        getAllStudentsWithPoints(),
        getAchievementConfig(),
      ]);

      const userIds = studentsWithPoints.map((s) => s.userId);
      const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const usersSnapshot = await getDocs(usersQuery);

      const usersMap = new Map();
      usersSnapshot.forEach((doc) => {
        usersMap.set(doc.id, doc.data());
      });

      const studentsWithDetails: StudentWithDetails[] = studentsWithPoints.map((student) => {
        const userData = usersMap.get(student.userId);
        return {
          ...student,
          name: userData?.name || 'Unknown',
          email: userData?.email || 'N/A',
          school: userData?.school_name || 'N/A',
        };
      });

      studentsWithDetails.sort((a, b) => b.totalPoints - a.totalPoints);

      setStudents(studentsWithDetails);
      setFilteredStudents(studentsWithDetails);
      setConfig(achievementConfig);
      setConfigForm(achievementConfig);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async () => {
    if (!configForm) return;

    try {
      await updateAchievementConfig(configForm);
      setConfig(configForm);
      setShowConfigModal(false);
      alert('Configuration updated successfully!');
    } catch (error) {
      console.error('Error updating config:', error);
      alert('Failed to update configuration');
    }
  };

  const handleAdjustPoints = async () => {
    if (!selectedStudent || !user) return;

    try {
      await manuallyAdjustPoints(
        selectedStudent.userId,
        adjustmentAmount,
        adjustmentReason,
        user.id
      );
      setShowAdjustModal(false);
      setAdjustmentAmount(0);
      setAdjustmentReason('');
      await fetchData();
      alert('Points adjusted successfully!');
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Failed to adjust points');
    }
  };

  const handleResetPoints = async (studentId: string) => {
    if (!confirm('Are you sure you want to reset this student\'s points? This action cannot be undone.')) {
      return;
    }

    try {
      await resetStudentPoints(studentId);
      await fetchData();
      alert('Points reset successfully!');
    } catch (error) {
      console.error('Error resetting points:', error);
      alert('Failed to reset points');
    }
  };

  const handleViewHistory = async (student: StudentWithDetails) => {
    setSelectedStudent(student);
    try {
      const history = await getPointsHistory(student.userId, 50);
      setStudentHistory(history);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Failed to fetch student history');
    }
  };

  const exportToExcel = () => {
    const data = filteredStudents.map((student, index) => ({
      Rank: index + 1,
      Name: student.name,
      Email: student.email,
      'Educational Institution': student.school,
      'Total Points': student.totalPoints,
      'Initiation Points': student.initiationPoints,
      'Progress Points': student.progressPoints,
      'Chat Points': student.chatPoints,
      'File Points': student.filePoints,
      'Weighted Score Points': student.weightedScorePoints,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Points');
    XLSX.writeFile(wb, `student_rewards_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleRecalculateAll = async () => {
    setShowRecalculateConfirm(false);
    setShowRecalculateProgress(true);
    setIsRecalculating(true);
    setRecalculationProgress({ current: 0, total: 0, studentId: '' });
    setRecalculationResult(null);

    try {
      const result = await recalculateAllStudentPoints(
        (current, total, studentId) => {
          setRecalculationProgress({ current, total, studentId });
        }
      );

      setRecalculationResult(result);
      setIsRecalculating(false);

      await fetchData();
    } catch (error) {
      console.error('Error recalculating all points:', error);
      setIsRecalculating(false);
      alert('Failed to recalculate points. Please try again.');
      setShowRecalculateProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Rewards System</h1>
        <p className="text-gray-600">Configure points, achievements, and manage student rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => setShowConfigModal(true)}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-left"
        >
          <Settings className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Configuration</h3>
          <p className="text-sm text-gray-600">Manage achievement thresholds and point values</p>
        </button>

        <button
          onClick={exportToExcel}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-left"
        >
          <Download className="w-8 h-8 text-green-600 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Export Data</h3>
          <p className="text-sm text-gray-600">Download student points data to Excel</p>
        </button>

        <button
          onClick={() => setShowRecalculateConfirm(true)}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all text-left"
        >
          <Calculator className="w-8 h-8 text-orange-600 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">Recalculate All Points</h3>
          <p className="text-sm text-gray-600">Refresh all student points from project data</p>
        </button>

        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 shadow-lg text-white">
          <Award className="w-8 h-8 mb-4" />
          <h3 className="font-bold mb-2">Total Students</h3>
          <p className="text-3xl font-bold">{students.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or institution..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Educational Institution</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Points</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievements</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student, index) => {
                const achievements = config
                  ? calculateAchievements(student.totalPoints, config)
                  : { trophy: 0, platinum: 0, gold: 0, silver: 0, bronze: 0 };

                return (
                  <tr key={student.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-bold text-gray-900">{index + 1}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{student.school}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-purple-600">{student.totalPoints}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {achievements.trophy > 0 && (
                          <AchievementBadge type="trophy" count={achievements.trophy} size="small" showCount={true} />
                        )}
                        {achievements.platinum > 0 && (
                          <AchievementBadge type="platinum" count={achievements.platinum} size="small" showCount={true} />
                        )}
                        {achievements.gold > 0 && (
                          <AchievementBadge type="gold" count={achievements.gold} size="small" showCount={true} />
                        )}
                        {achievements.silver > 0 && (
                          <AchievementBadge type="silver" count={achievements.silver} size="small" showCount={true} />
                        )}
                        {achievements.bronze > 0 && (
                          <AchievementBadge type="bronze" count={achievements.bronze} size="small" showCount={true} />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/points-details/${student.userId}`)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConsistencyCheckStudent(student);
                            setShowConsistencyChecker(true);
                          }}
                          className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Check Consistency"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewHistory(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowAdjustModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Adjust Points"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPoints(student.userId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reset Points"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showConfigModal && configForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Rewards Configuration</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Thresholds</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bronze Medal</label>
                    <input
                      type="number"
                      value={configForm.bronze}
                      onChange={(e) => setConfigForm({ ...configForm, bronze: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Silver Medal</label>
                    <input
                      type="number"
                      value={configForm.silver}
                      onChange={(e) => setConfigForm({ ...configForm, silver: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gold Medal</label>
                    <input
                      type="number"
                      value={configForm.gold}
                      onChange={(e) => setConfigForm({ ...configForm, gold: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platinum Medal</label>
                    <input
                      type="number"
                      value={configForm.platinum}
                      onChange={(e) => setConfigForm({ ...configForm, platinum: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trophy</label>
                    <input
                      type="number"
                      value={configForm.trophy}
                      onChange={(e) => setConfigForm({ ...configForm, trophy: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Point Values</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900 font-medium mb-1">Points Calculation Formula:</p>
                  <p className="text-xs text-blue-800">
                    <strong>Total Points</strong> = (Approved Projects × Project Points) + (Sum of All Project Progress × Progress Points Value) +
                    (Chat Messages × Chat Points) + (Files Uploaded × File Points) + (Sum of All Project Weighted Scores × Score Points Value)
                  </p>
                  <p className="text-xs text-blue-700 mt-2 italic">
                    Note: Progress and Weighted Score points are calculated cumulatively from all student projects.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Approved Project Points
                      <span className="text-xs text-gray-500 block font-normal">Points per approved/activated project</span>
                    </label>
                    <input
                      type="number"
                      value={configForm.approvedProjectPoints}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, approvedProjectPoints: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Progress Points Value
                      <span className="text-xs text-gray-500 block font-normal">Points multiplier for total progress (sum of all project progress %)</span>
                    </label>
                    <input
                      type="number"
                      value={configForm.progressPointsPerPercent}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, progressPointsPerPercent: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chat Points Value
                      <span className="text-xs text-gray-500 block font-normal">Points per chat message sent</span>
                    </label>
                    <input
                      type="number"
                      value={configForm.chatMessagePoints}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, chatMessagePoints: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Points Value
                      <span className="text-xs text-gray-500 block font-normal">Points per file uploaded</span>
                    </label>
                    <input
                      type="number"
                      value={configForm.fileUploadPoints}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, fileUploadPoints: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weighted Score Points Value
                      <span className="text-xs text-gray-500 block font-normal">Points multiplier for total weighted score (sum of all project scores)</span>
                    </label>
                    <input
                      type="number"
                      value={configForm.weightedScorePointsPerUnit}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, weightedScorePointsPerUnit: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleUpdateConfig}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Configuration
              </button>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setConfigForm(config);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Adjust Points</h2>
            <p className="text-gray-600 mb-6">Student: {selectedStudent.name}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Amount (use negative for deduction)
                </label>
                <input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 50 or -20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Explain why points are being adjusted..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAdjustPoints}
                disabled={!adjustmentReason.trim() || adjustmentAmount === 0}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Adjust Points
              </button>
              <button
                onClick={() => {
                  setShowAdjustModal(false);
                  setAdjustmentAmount(0);
                  setAdjustmentReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Points History</h2>
            <p className="text-gray-600 mb-6">Student: {selectedStudent.name}</p>

            <div className="space-y-3">
              {studentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-lg font-bold ${item.pointsEarned >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.pointsEarned >= 0 ? '+' : ''}{item.pointsEarned}
                    </span>
                    <span className="text-sm text-gray-500">pts</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-6 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showRecalculateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calculator className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Recalculate All Points?</h2>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700">
                This will recalculate points for all {students.length} students based on their current project data, including:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm space-y-1 ml-2">
                <li>Project progress percentages</li>
                <li>Evaluation weighted scores</li>
                <li>Chat messages and file uploads</li>
                <li>Achievement badges</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                <p className="text-yellow-800 text-sm font-medium">
                  This process may take several minutes depending on the number of students. Please do not close this window during the process.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleRecalculateAll}
                className="flex-1 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Start Recalculation
              </button>
              <button
                onClick={() => setShowRecalculateConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecalculateProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Calculator className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isRecalculating ? 'Recalculating Points...' : 'Recalculation Complete'}
                </h2>
                {isRecalculating && (
                  <p className="text-sm text-gray-600">Please wait while we process all students</p>
                )}
              </div>
            </div>

            {isRecalculating && recalculationProgress.total > 0 && (
              <div className="mb-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Processing student {recalculationProgress.current} of {recalculationProgress.total}</span>
                    <span>{Math.round((recalculationProgress.current / recalculationProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-orange-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${(recalculationProgress.current / recalculationProgress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            )}

            {!isRecalculating && recalculationResult && (
              <div className="mb-6 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{recalculationResult.totalStudents}</div>
                    <div className="text-xs text-blue-700">Total</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{recalculationResult.successful}</div>
                    <div className="text-xs text-green-700">Successful</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{recalculationResult.failed}</div>
                    <div className="text-xs text-red-700">Failed</div>
                  </div>
                </div>

                {recalculationResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                    <div className="space-y-2">
                      {recalculationResult.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-700">
                          <span className="font-medium">Student {error.studentId}:</span> {error.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recalculationResult.successful === recalculationResult.totalStudents && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 text-sm font-medium text-center">
                      All student points have been successfully recalculated!
                    </p>
                  </div>
                )}
              </div>
            )}

            {!isRecalculating && (
              <button
                onClick={() => {
                  setShowRecalculateProgress(false);
                  setRecalculationResult(null);
                }}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}

      {showConsistencyChecker && consistencyCheckStudent && (
        <PointsConsistencyChecker
          studentId={consistencyCheckStudent.userId}
          studentName={consistencyCheckStudent.name || 'Unknown'}
          onClose={() => {
            setShowConsistencyChecker(false);
            setConsistencyCheckStudent(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default ManageRewards;
