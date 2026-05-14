import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Users, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getRankingWindow,
  subscribeToSchoolRanking,
  RankedStudent,
} from '../../services/rewardPointsService';

interface StudentRankingWidgetProps {
  userId: string;
  schoolId: string;
}

const StudentRankingWidget: React.FC<StudentRankingWidgetProps> = ({ userId, schoolId }) => {
  const [rankWindow, setRankWindow] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevRank, setPrevRank] = useState<number | null>(null);
  const [rankChanged, setRankChanged] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;

    // Initial load
    getRankingWindow(userId, schoolId, 10).then(window => {
      if (!mounted) return;
      setRankWindow(window);
      const me = window.find(s => s.isCurrentUser);
      if (me) setPrevRank(me.rank);
      setLoading(false);
    });

    // Real-time subscription
    unsubRef.current = subscribeToSchoolRanking(userId, schoolId, 10, (window) => {
      if (!mounted) return;
      const me = window.find(s => s.isCurrentUser);
      if (me) {
        setPrevRank(prev => {
          if (prev !== null && prev !== me.rank) {
            setRankChanged(true);
            setTimeout(() => setRankChanged(false), 2000);
          }
          return me.rank;
        });
      }
      setRankWindow(window);
    });

    return () => {
      mounted = false;
      unsubRef.current?.();
    };
  }, [userId, schoolId]);

  const currentUser = rankWindow.find(s => s.isCurrentUser);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-blue-400';
  };

  const getMedalBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'bg-gray-50 border-gray-200';
    if (rank === 3) return 'bg-amber-50 border-amber-200';
    return '';
  };

  const maxPoints = rankWindow.length > 0 ? Math.max(...rankWindow.map(s => s.totalPoints), 1) : 1;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (rankWindow.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">ترتيبك في المؤسسة</h2>
              <p className="text-blue-100 text-xs">حسب عدد النقاط المكتسبة</p>
            </div>
          </div>

          {currentUser && (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentUser.rank}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`flex flex-col items-center bg-white bg-opacity-20 rounded-xl px-4 py-2 ${rankChanged ? 'ring-2 ring-yellow-300 ring-opacity-80' : ''}`}
              >
                <span className="text-white text-xs font-medium">ترتيبك</span>
                <span className="text-white text-2xl font-black leading-none">#{currentUser.rank}</span>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Rankings List */}
      <div className="p-4 space-y-1.5">
        {rankWindow.map((student, idx) => (
          <motion.div
            key={student.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
          >
            {student.isCurrentUser ? (
              <motion.div
                animate={rankChanged ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="flex flex-col gap-1.5 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <RankBadge rank={student.rank} isHighlighted />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">
                      {student.name || 'أنت'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-yellow-300" />
                    <span className="text-white font-bold text-sm">{student.totalPoints.toLocaleString()}</span>
                    <span className="text-blue-100 text-xs">نقطة</span>
                  </div>
                </div>
                {/* Progress bar indicator */}
                <div className="h-1.5 bg-white bg-opacity-25 rounded-full overflow-hidden ms-11">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((student.totalPoints / maxPoints) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-yellow-300 rounded-full"
                  />
                </div>
              </motion.div>
            ) : (
              <div className={`flex flex-col gap-1 px-4 py-2.5 rounded-xl border transition-colors hover:bg-gray-50 ${getMedalBg(student.rank)} ${student.rank <= 3 ? 'border' : 'border-transparent'}`}>
                <div className="flex items-center gap-3">
                  <RankBadge rank={student.rank} isHighlighted={false} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-700 text-sm truncate">{student.name || '---'}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className={`w-3.5 h-3.5 ${getMedalColor(student.rank)}`} />
                    <span className="text-gray-600 font-semibold text-sm">{student.totalPoints.toLocaleString()}</span>
                    <span className="text-gray-400 text-xs">نق</span>
                  </div>
                </div>
                {/* Thin progress bar */}
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden ms-11">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((student.totalPoints / maxPoints) * 100)}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.03 }}
                    className={`h-full rounded-full ${student.rank === 1 ? 'bg-yellow-400' : student.rank === 2 ? 'bg-gray-400' : student.rank === 3 ? 'bg-amber-500' : 'bg-blue-300'}`}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <Link
          to="/student-rewards"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
        >
          <Users className="w-4 h-4" />
          عرض القائمة الكاملة
        </Link>
      </div>
    </motion.div>
  );
};

const RankBadge: React.FC<{ rank: number; isHighlighted: boolean }> = ({ rank, isHighlighted }) => {
  if (isHighlighted) {
    return (
      <div className="w-8 h-8 rounded-full bg-white bg-opacity-25 flex items-center justify-center flex-shrink-0">
        <span className="text-white font-black text-sm">{rank}</span>
      </div>
    );
  }
  if (rank === 1) return (
    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 border border-yellow-300">
      <span className="text-yellow-600 font-black text-sm">1</span>
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-300">
      <span className="text-gray-500 font-black text-sm">2</span>
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 border border-amber-300">
      <span className="text-amber-600 font-black text-sm">3</span>
    </div>
  );
  return (
    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
      <span className="text-gray-400 font-bold text-sm">{rank}</span>
    </div>
  );
};

export default StudentRankingWidget;
