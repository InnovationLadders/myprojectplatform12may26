import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

interface AchievementBadgeProps {
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'trophy';
  count: number;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  type,
  count,
  size = 'medium',
  showCount = true
}) => {
  if (count === 0) return null;

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  const getIcon = () => {
    if (type === 'trophy') {
      return <Trophy className={sizeClasses[size]} />;
    }
    if (type === 'platinum' || type === 'gold') {
      return <Trophy className={sizeClasses[size]} />;
    }
    if (type === 'silver') {
      return <Medal className={sizeClasses[size]} />;
    }
    return <Award className={sizeClasses[size]} />;
  };

  const getColor = () => {
    switch (type) {
      case 'trophy':
        return 'text-purple-500';
      case 'platinum':
        return 'text-blue-500';
      case 'gold':
        return 'text-yellow-500';
      case 'silver':
        return 'text-gray-400';
      case 'bronze':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'trophy':
        return 'Trophy';
      case 'platinum':
        return 'Platinum';
      case 'gold':
        return 'Gold';
      case 'silver':
        return 'Silver';
      case 'bronze':
        return 'Bronze';
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`${getColor()} flex items-center`}>
        {getIcon()}
      </div>
      {showCount && (
        <span className={`${textSizeClasses[size]} font-semibold ${getColor()}`}>
          {count > 1 ? `×${count}` : ''}
        </span>
      )}
      <span className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400`}>
        {getLabel()}
      </span>
    </div>
  );
};

export default AchievementBadge;
