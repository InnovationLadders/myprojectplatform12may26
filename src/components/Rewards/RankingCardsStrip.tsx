import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getRankingWindow, RankedStudent } from '../../services/rewardPointsService';

interface RankingCardsStripProps {
  userId: string;
  schoolId: string;
}

const getMedalIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-3.5 h-3.5 text-yellow-300" />;
  if (rank === 2) return <Medal className="w-3.5 h-3.5 text-gray-200" />;
  if (rank === 3) return <Award className="w-3.5 h-3.5 text-amber-600" />;
  return null;
};

const getMedalColor = (rank: number) => {
  if (rank === 1) return 'text-yellow-300';
  if (rank === 2) return 'text-gray-200';
  if (rank === 3) return 'text-amber-500';
  return 'text-white opacity-70';
};

const RankingCardsStrip: React.FC<RankingCardsStripProps> = ({ userId, schoolId }) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [students, setStudents] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRankingWindow(userId, schoolId, 5).then(window => {
      setStudents(window);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, schoolId]);

  if (loading || students.length === 0) return null;

  const me = students.find(s => s.isCurrentUser);
  if (!me) return null;

  const gradient =
    me.rank === 1 ? 'from-yellow-500 to-amber-500' :
    me.rank <= 3  ? 'from-orange-500 to-rose-500' :
                   'from-blue-600 to-teal-500';

  // Sort by rank ascending — display order is always rank 1 first
  // RTL: rank 1 on the right (flex-row-reverse shows index 0 on the right)
  // LTR: rank 1 on the left (flex-row shows index 0 on the left)
  const sorted = [...students].sort((a, b) => a.rank - b.rank);

  const ChevronIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`bg-gradient-to-r ${gradient} rounded-xl px-4 py-3 shadow-md`}
    >
      <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Cards strip */}
        <div className={`flex-1 flex items-stretch gap-2 overflow-x-auto scrollbar-hide ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          {sorted.map((student, idx) => (
            <motion.div
              key={student.userId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.06 }}
              className={`
                flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[80px] transition-all
                ${student.isCurrentUser
                  ? 'bg-white bg-opacity-30 ring-2 ring-white scale-105 shadow-lg'
                  : 'bg-white bg-opacity-15 hover:bg-opacity-20'}
              `}
            >
              {/* Rank number + medal */}
              <div className={`flex items-center gap-0.5 ${getMedalColor(student.rank)}`}>
                {getMedalIcon(student.rank)}
                <span className={`font-black text-sm leading-none ${student.isCurrentUser ? 'text-white' : 'text-white opacity-90'}`}>
                  #{student.rank}
                </span>
              </div>

              {/* Name */}
              <span className={`text-xs font-medium mt-1 text-center leading-tight max-w-[70px] truncate ${student.isCurrentUser ? 'text-white' : 'text-white opacity-80'}`}>
                {student.name ? student.name.split(' ')[0] : '—'}
              </span>

              {/* Points */}
              <span className={`text-xs mt-0.5 ${student.isCurrentUser ? 'text-white font-bold' : 'text-white opacity-70'}`}>
                {student.totalPoints.toLocaleString()}
              </span>
            </motion.div>
          ))}
        </div>

        {/* CTA link */}
        <Link
          to="/student-rewards"
          className="flex-shrink-0 flex items-center gap-1 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white text-xs font-medium px-2.5 py-2 rounded-lg whitespace-nowrap"
        >
          {isRTL ? 'الترتيب الكامل' : 'Full Ranking'}
          <ChevronIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};

export default RankingCardsStrip;
