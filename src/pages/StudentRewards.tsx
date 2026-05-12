import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getStudentPoints,
  getAchievementConfig,
  calculateAchievements,
  getPointsHistory,
  getTopStudents,
  StudentPoints,
  PointsHistory,
  AchievementConfig,
} from '../services/rewardPointsService';
import { Award, TrendingUp, Trophy, Medal, Star, History, Users, FileText } from 'lucide-react';
import AchievementBadge from '../components/Rewards/AchievementBadge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StudentRewards: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState<StudentPoints | null>(null);
  const [config, setConfig] = useState<AchievementConfig | null>(null);
  const [achievements, setAchievements] = useState({
    trophy: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  });
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [leaderboard, setLeaderboard] = useState<StudentPoints[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [studentPoints, achievementConfig, pointsHistory, topStudents] = await Promise.all([
          getStudentPoints(user.id),
          getAchievementConfig(),
          getPointsHistory(user.id, 20),
          getTopStudents(user.school_id, 10),
        ]);

        setPoints(studentPoints);
        setConfig(achievementConfig);
        setHistory(pointsHistory);
        setLeaderboard(topStudents);

        const calculatedAchievements = calculateAchievements(
          studentPoints.totalPoints,
          achievementConfig
        );
        setAchievements(calculatedAchievements);
      } catch (error) {
        console.error('Error fetching rewards data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading || !points || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const chartData = [
    { name: 'Initiation', value: points.initiationPoints, color: '#8B5CF6' },
    { name: 'Progress', value: points.progressPoints, color: '#3B82F6' },
    { name: 'Chat', value: points.chatPoints, color: '#10B981' },
    { name: 'Files', value: points.filePoints, color: '#F59E0B' },
    { name: 'Weighted Score', value: points.weightedScorePoints, color: '#EC4899' },
  ];

  const getNextAchievement = () => {
    const total = points.totalPoints;
    const thresholds = [
      { type: 'Bronze', value: config.bronze },
      { type: 'Silver', value: config.silver },
      { type: 'Gold', value: config.gold },
      { type: 'Platinum', value: config.platinum },
      { type: 'Trophy', value: config.trophy },
    ];

    for (const threshold of thresholds) {
      const achievementsOfType = Math.floor(total / threshold.value);
      const nextThreshold = (achievementsOfType + 1) * threshold.value;
      if (total < nextThreshold) {
        return {
          type: threshold.type,
          pointsNeeded: nextThreshold - total,
          progress: ((total % threshold.value) / threshold.value) * 100,
        };
      }
    }

    const nextTrophy = Math.ceil(total / config.trophy) * config.trophy;
    return {
      type: 'Trophy',
      pointsNeeded: nextTrophy - total,
      progress: ((total % config.trophy) / config.trophy) * 100,
    };
  };

  const nextAchievement = getNextAchievement();
  const userRank = leaderboard.findIndex(s => s.userId === user?.id) + 1;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'project_activation':
        return '🚀';
      case 'progress_update':
        return '📈';
      case 'chat_message':
        return '💬';
      case 'file_upload':
        return '📎';
      case 'weighted_score':
        return '⚖️';
      case 'manual_adjustment':
        return '⚙️';
      default:
        return '⭐';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Rewards</h1>
          <p className="text-gray-600">Track your points, achievements, and progress</p>
        </div>
        <button
          onClick={() => navigate(`/points-details/${user?.id}`)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FileText className="w-5 h-5" />
          View Detailed Breakdown
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8" />
            <TrendingUp className="w-6 h-6 opacity-75" />
          </div>
          <p className="text-white/80 text-sm mb-1">Total Points</p>
          <p className="text-4xl font-bold">{points.totalPoints}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 text-purple-600" />
            <Star className="w-6 h-6 text-yellow-500" />
          </div>
          <p className="text-gray-600 text-sm mb-2">Achievements</p>
          <div className="flex flex-wrap gap-2">
            {achievements.trophy > 0 && (
              <AchievementBadge type="trophy" count={achievements.trophy} size="small" />
            )}
            {achievements.platinum > 0 && (
              <AchievementBadge type="platinum" count={achievements.platinum} size="small" />
            )}
            {achievements.gold > 0 && (
              <AchievementBadge type="gold" count={achievements.gold} size="small" />
            )}
            {achievements.silver > 0 && (
              <AchievementBadge type="silver" count={achievements.silver} size="small" />
            )}
            {achievements.bronze > 0 && (
              <AchievementBadge type="bronze" count={achievements.bronze} size="small" />
            )}
            {Object.values(achievements).every(v => v === 0) && (
              <p className="text-sm text-gray-500">No achievements yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">School Rank</p>
          <p className="text-3xl font-bold text-gray-900">
            {userRank > 0 ? `#${userRank}` : 'N/A'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Medal className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 text-sm mb-1">Next Achievement</p>
          <p className="text-lg font-semibold text-gray-900">{nextAchievement.type}</p>
          <p className="text-sm text-gray-500">{nextAchievement.pointsNeeded} points away</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(nextAchievement.progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Points Breakdown
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Project Activation</p>
              <p className="text-lg font-semibold text-purple-600">{points.initiationPoints}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Progress Updates</p>
              <p className="text-lg font-semibold text-blue-600">{points.progressPoints}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Chat Messages</p>
              <p className="text-lg font-semibold text-green-600">{points.chatPoints}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">File Uploads</p>
              <p className="text-lg font-semibold text-orange-600">{points.filePoints}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Weighted Score</p>
              <p className="text-lg font-semibold text-pink-600">{points.weightedScorePoints}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            School Leaderboard
          </h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {leaderboard.map((student, index) => (
              <div
                key={student.userId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  student.userId === user?.id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0
                        ? 'bg-yellow-500 text-white'
                        : index === 1
                        ? 'bg-gray-400 text-white'
                        : index === 2
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {student.userId === user?.id ? 'You' : `Student ${index + 1}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="font-bold text-gray-900">{student.totalPoints}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Activity
        </h2>
        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getActivityIcon(item.activityType)}</div>
                  <div>
                    <p className="font-medium text-gray-900">{item.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600">+{item.pointsEarned}</span>
                  <span className="text-sm text-gray-500">pts</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No activity yet. Start earning points!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentRewards;
