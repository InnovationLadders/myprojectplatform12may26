import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageCircle,
  Image as ImageIcon,
  Video,
  File,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AvatarDisplay } from '../Common/AvatarDisplay';
import type { RecentProjectConversation } from '../../services/dashboardService';

interface RecentConversationsProps {
  conversations: RecentProjectConversation[];
  loading?: boolean;
}

export const RecentConversations: React.FC<RecentConversationsProps> = React.memo(({
  conversations,
  loading = false
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 1) {
      return t('recentConversations.timeAgo.justNow', 'الآن');
    } else if (diffInMinutes < 60) {
      return t('recentConversations.timeAgo.minutes', { count: diffInMinutes });
    } else if (diffInHours < 24) {
      return t('recentConversations.timeAgo.hours', { count: diffInHours });
    } else {
      return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    }
  };

  const getMessageIcon = (messageType: string) => {
    switch (messageType) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-500" />;
      case 'file':
        return <File className="w-4 h-4 text-gray-500" />;
      default:
        return <MessageCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getMessagePreview = (conversation: RecentProjectConversation): string => {
    if (conversation.messageType === 'text') {
      return conversation.message.length > 50
        ? conversation.message.substring(0, 50) + '...'
        : conversation.message;
    } else if (conversation.messageType === 'image') {
      return t('recentConversations.sentImage', 'أرسل صورة');
    } else if (conversation.messageType === 'video') {
      return t('recentConversations.sentVideo', 'أرسل فيديو');
    } else if (conversation.messageType === 'file') {
      return t('recentConversations.sentFile', 'أرسل ملف');
    }
    return '';
  };

  const handleConversationClick = (projectId: string) => {
    navigate(`/projects/${projectId}?tab=chat`);
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          {t('recentConversations.title', 'المحادثات الحديثة')}
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </motion.div>
    );
  }

  if (conversations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-sm"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          {t('recentConversations.title', 'المحادثات الحديثة')}
        </h2>
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            {t('recentConversations.noConversations', 'لا توجد محادثات حديثة في آخر 24 ساعة')}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-blue-600" />
        {t('recentConversations.title', 'المحادثات الحديثة')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conversations.map((conversation, index) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => handleConversationClick(conversation.projectId)}
            className="relative group cursor-pointer bg-gray-50 rounded-xl p-4 hover:bg-blue-50 hover:shadow-md transition-all duration-300"
          >
            {conversation.unreadCount > 0 && (
              <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}

            <div className="mb-3">
              <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">
                {conversation.projectTitle}
              </h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {getTimeAgo(conversation.timestamp)}
              </div>
            </div>

            <div className="flex items-start gap-3 mb-3">
              <AvatarDisplay
                avatarUrl={conversation.userAvatar}
                userName={conversation.userName}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 mb-1">
                  {conversation.userName}
                </p>
                <div className="flex items-start gap-2">
                  {getMessageIcon(conversation.messageType)}
                  <p className="text-xs text-gray-600 line-clamp-2 flex-1">
                    {getMessagePreview(conversation)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end text-blue-600 group-hover:text-blue-700 text-xs font-medium">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                {t('recentConversations.viewProject', 'عرض المشروع')}
              </span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});
