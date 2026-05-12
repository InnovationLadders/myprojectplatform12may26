import React from 'react';
import { User } from 'lucide-react';

interface AvatarDisplayProps {
  avatarUrl?: string;
  userName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarUrl,
  userName = 'User',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={userName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.nextElementSibling) {
              (target.nextElementSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <User className={`${iconSizes[size]} text-gray-500`} />
        </div>
      )}
    </div>
  );
};
