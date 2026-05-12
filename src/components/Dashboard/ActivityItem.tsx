import React from 'react';
import { MessageCircle, Paperclip, Award } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Activity, isChatActivity, isFileUploadActivity, isEvaluationActivity } from '../../types/activity';
import { AvatarDisplay } from '../Common/AvatarDisplay';

interface ActivityItemProps {
  activity: Activity;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getIcon = () => {
    if (isChatActivity(activity)) {
      return <MessageCircle className="w-5 h-5 text-blue-500" />;
    } else if (isFileUploadActivity(activity)) {
      return <Paperclip className="w-5 h-5 text-green-500" />;
    } else if (isEvaluationActivity(activity)) {
      return <Award className="w-5 h-5 text-orange-500" />;
    }
    return <MessageCircle className="w-5 h-5 text-gray-500" />;
  };

  const getDescription = () => {
    if (isChatActivity(activity)) {
      return `sent a message in ${activity.project_title}`;
    } else if (isFileUploadActivity(activity)) {
      return `uploaded ${activity.activity_data.fileName} to ${activity.project_title}`;
    } else if (isEvaluationActivity(activity)) {
      const changeCount = activity.activity_data.changes.length;
      return `updated ${changeCount} evaluation ${changeCount === 1 ? 'criterion' : 'criteria'} for ${activity.project_title}`;
    }
    return '';
  };

  const getPreview = () => {
    if (isChatActivity(activity)) {
      return activity.activity_data.messagePreview;
    } else if (isFileUploadActivity(activity)) {
      const data = activity.activity_data;
      return `${data.fileName} (${(data.fileSize / 1024).toFixed(1)} KB)`;
    } else if (isEvaluationActivity(activity)) {
      const changes = activity.activity_data.changes;
      if (changes.length > 0) {
        const firstChange = changes[0];
        return `${firstChange.criterionName}: ${firstChange.oldScore} → ${firstChange.newScore}`;
      }
    }
    return '';
  };

  return (
    <Link
      to={`/project-details/${activity.project_id}`}
      className="block hover:bg-gray-50 transition-colors rounded-lg"
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AvatarDisplay name={activity.user_name} size="sm" />
            <span className="font-medium text-gray-900 text-sm">
              {activity.user_name}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-1">
            {getDescription()}
          </p>

          {getPreview() && (
            <p className="text-xs text-gray-500 truncate">
              {getPreview()}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(activity.created_at, { addSuffix: true })}
          </p>
        </div>
      </div>
    </Link>
  );
};
