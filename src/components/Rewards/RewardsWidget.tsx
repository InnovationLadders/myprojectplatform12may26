import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getAchievementConfig,
  calculateAchievements,
  StudentPoints,
} from '../../services/rewardPointsService';
import { subscribeToStudentPoints, syncStudentPoints } from '../../services/pointsSyncService';
import AchievementBadge from './AchievementBadge';
import { useNavigate } from 'react-router-dom';

const RewardsWidget: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState<StudentPoints>({
    userId: '',
    totalPoints: 0,
    initiationPoints: 0,
    progressPoints: 0,
    chatPoints: 0,
    filePoints: 0,
    weightedScorePoints: 0,
    lastUpdated: '',
  });
  const [achievements, setAchievements] = useState({
    trophy: 0,
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
  });
  const [animatePoints, setAnimatePoints] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupRealtimeListener = async () => {
      try {
        const config = await getAchievementConfig();

        unsubscribe = subscribeToStudentPoints(
          user.id,
          (studentPoints) => {
            const calculatedAchievements = calculateAchievements(studentPoints.totalPoints, config);

            if (points && studentPoints.totalPoints > points.totalPoints) {
              setAnimatePoints(true);
              setTimeout(() => setAnimatePoints(false), 1000);
            }

            setPoints(studentPoints);
            setAchievements(calculatedAchievements);
            setLastUpdated(studentPoints.lastUpdated);
            setLoading(false);
          },
          (error) => {
            console.error('Error in points subscription:', error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up points listener:', error);
        setLoading(false);
      }
    };

    setupRealtimeListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const handleManualRefresh = async () => {
    if (!user || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await syncStudentPoints(user.id);
    } catch (error) {
      console.error('Error refreshing points:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  if (!user) {
    return null;
  }

  const hasAchievements = Object.values(achievements).some(count => count > 0);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
        <div className="flex items-center gap-1">
          <div className="h-5 w-8 md:h-6 md:w-10 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">pts</span>
        </div>
      </div>
    );
  }

  const displayPoints = points.totalPoints ?? 0;

  return (
    <div className="flex items-center gap-1 md:gap-1.5">
      <button
        onClick={handleManualRefresh}
        disabled={isRefreshing}
        className="p-1.5 md:p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all disabled:opacity-50"
        title="Refresh points"
      >
        <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
      <div
        onClick={() => navigate('/student-rewards')}
        className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20 rounded-lg cursor-pointer hover:shadow-lg transition-all border border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600"
      >
      <div className="flex items-center gap-1 md:gap-1.5">
        <Award className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
        <div className="flex items-center gap-0.5 md:gap-1">
          <span
            className={`text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400 transition-all ${
              animatePoints ? 'scale-125' : 'scale-100'
            }`}
          >
            {displayPoints}
          </span>
          <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">pts</span>
        </div>
      </div>

      {hasAchievements && (
        <div className="hidden sm:flex items-center gap-1 md:gap-1.5 border-l border-blue-300 dark:border-blue-600 pl-1.5 md:pl-2">
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
        </div>
      )}

        <TrendingUp className="hidden md:block w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto" />
      </div>
    </div>
  );
};

export default RewardsWidget;
