import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Zap, Award, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRankingWindow, RankedStudent } from '../../services/rewardPointsService';

interface RankingMotivationBannerProps {
  userId: string;
  schoolId: string;
}

const getMotivationalMessage = (rank: number, totalInSchool: number, pointsToNext: number) => {
  if (rank === 1) return { text: 'أنت في المقدمة! حافظ على تفوقك', color: 'text-yellow-100', icon: Trophy };
  if (rank <= 3) return { text: `${rank === 2 ? 'المركز الثاني' : 'المركز الثالث'} — أنت قريب من القمة!`, color: 'text-orange-100', icon: TrendingUp };
  if (pointsToNext > 0 && pointsToNext <= 50) return { text: `${pointsToNext} نقطة تفصلك عن المركز الأعلى`, color: 'text-blue-100', icon: Zap };
  return { text: `استمر في العمل للارتقاء في الترتيب`, color: 'text-teal-100', icon: TrendingUp };
};

const RankingMotivationBanner: React.FC<RankingMotivationBannerProps> = ({ userId, schoolId }) => {
  const [data, setData] = useState<{ me: RankedStudent; aboveMe: RankedStudent | null; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRankingWindow(userId, schoolId, 11).then(window => {
      const me = window.find(s => s.isCurrentUser);
      if (!me) { setLoading(false); return; }
      const aboveMe = window.find(s => s.rank === me.rank - 1) ?? null;
      // total = window is always up to 10/11 around user, so approximate
      setData({ me, aboveMe, total: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, schoolId]);

  if (loading || !data) return null;

  const { me, aboveMe } = data;
  const pointsToNext = aboveMe ? aboveMe.totalPoints - me.totalPoints : 0;
  const msg = getMotivationalMessage(me.rank, 0, pointsToNext);
  const MsgIcon = msg.icon;

  // gradient based on rank
  const gradient =
    me.rank === 1 ? 'from-yellow-500 to-amber-500' :
    me.rank <= 3  ? 'from-orange-500 to-rose-500' :
                   'from-blue-600 to-teal-500';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`bg-gradient-to-r ${gradient} rounded-xl px-5 py-3.5 flex items-center gap-4 shadow-md`}
      >
        {/* Rank badge */}
        <div className="flex-shrink-0 flex flex-col items-center bg-white bg-opacity-20 rounded-xl px-3 py-1.5 min-w-[56px]">
          <span className="text-white text-xs font-medium opacity-80">مرتبتك</span>
          <span className="text-white text-2xl font-black leading-none">#{me.rank}</span>
        </div>

        {/* Message + points */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <MsgIcon className={`w-4 h-4 ${msg.color} flex-shrink-0`} />
            <p className={`text-sm font-semibold ${msg.color} truncate`}>{msg.text}</p>
          </div>
          <div className="flex items-center gap-3 text-white text-xs opacity-80">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {me.totalPoints.toLocaleString()} نقطة
            </span>
            {aboveMe && pointsToNext > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                يفوقك {aboveMe.name || 'طالب آخر'} بـ {pointsToNext} نقطة
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/student-rewards"
          className="flex-shrink-0 flex items-center gap-1 bg-white bg-opacity-20 hover:bg-opacity-30 transition-all text-white text-xs font-medium px-3 py-2 rounded-lg"
        >
          الترتيب الكامل
          <ChevronLeft className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </AnimatePresence>
  );
};

export default RankingMotivationBanner;
