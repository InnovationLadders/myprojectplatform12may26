import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Search, Globe, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import { useSchoolBranding } from '../../contexts/SchoolBrandingContext';
import { useUserSchool } from '../../hooks/useUserSchool';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RewardsWidget from '../Rewards/RewardsWidget';
import { AvatarDisplay } from '../Common/AvatarDisplay';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const { schoolName, logoUrl } = useSchoolBranding();
  const { schoolName: userSchoolName, loading: userSchoolLoading } = useUserSchool(user?.school_id);
  const { notifications, loading: notificationsLoading, markAsRead, markAllAsRead, getUnreadCount } = useNotifications();

  console.log('🔍 Header Debug - User school_id:', user?.school_id);
  console.log('🔍 Header Debug - User school name:', userSchoolName);
  console.log('🔍 Header Debug - Loading:', userSchoolLoading);
  console.log('🔍 Header Debug - Full user object:', user);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
      if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
        setShowSearchModal(false);
      }
    };

    if (showNotificationsDropdown || showSearchModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationsDropdown, showSearchModal]);

  const unreadCount = getUnreadCount();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return '✅';
      case 'project':
        return '⚠️';
      case 'message':
        return '💬';
      case 'system':
      default:
        return 'ℹ️';
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLanguageMenu(false);
  };

  const getRoleText = (role: string) => {
    return t(`roles.${role}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchModal(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 md:px-6 py-2 md:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>

          {/* School Logo Only - No Name */}
          {logoUrl && schoolName && (
            <div className="flex items-center px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <img
                src={logoUrl}
                alt={schoolName}
                className="h-10 w-10 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Search Icon Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={t('header.searchProjects')}
          >
            <Search className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Rewards Widget */}
          <RewardsWidget />

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              <Globe className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
              <span className="hidden sm:inline text-xs md:text-sm">{i18n.language === 'ar' ? 'العربية' : 'English'}</span>
            </button>
            
            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button 
                  onClick={() => changeLanguage('ar')}
                  className={`block w-full text-right px-4 py-2 text-sm hover:bg-gray-50 ${i18n.language === 'ar' ? 'font-bold text-blue-600' : ''}`}
                >
                  العربية
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${i18n.language === 'en' ? 'font-bold text-blue-600' : ''}`}
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell Icon and Dropdown */}
          <div className="relative" ref={notificationsDropdownRef}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="relative p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[10px] md:text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            {showNotificationsDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{t('header.notifications')}</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-blue-600 font-medium">
                        {unreadCount} إشعار جديد
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                      <p className="text-gray-500">جاري تحميل الإشعارات...</p>
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 md:p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          // Navigate to related content if needed
                          if (notification.type === 'message' && notification.relatedId) {
                            navigate(`/projects/${notification.relatedId}`);
                            setShowNotificationsDropdown(false);
                          } else if (notification.type === 'consultation' && notification.relatedId) {
                            navigate('/my-consultations');
                            setShowNotificationsDropdown(false);
                          } else if (notification.type === 'project' && notification.relatedId) {
                            navigate(`/projects/${notification.relatedId}`);
                            setShowNotificationsDropdown(false);
                          }
                        }}
                      >
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className="text-base md:text-lg flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-xs md:text-sm font-medium line-clamp-2 ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                              )}
                            </div>
                            <p className="text-[10px] md:text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">لا توجد إشعارات</p>
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        markAllAsRead();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      تعيين الكل كمقروء
                    </button>
                    <Link
                      to="/notifications"
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => setShowNotificationsDropdown(false)}
                    >
                      عرض جميع الإشعارات
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="text-right hidden md:block">
              <p className="text-xs md:text-sm font-medium text-gray-800">{user?.name}</p>
              <p className="text-[10px] md:text-xs text-gray-500">
                {user?.role ? getRoleText(user.role) : t('common.user')}
              </p>
              {userSchoolName && (
                <p className="text-[10px] md:text-xs text-gray-400 truncate max-w-[150px]">
                  {userSchoolName}
                </p>
              )}
            </div>
            <div className="relative group">
              <button className="border-2 border-gray-200 hover:border-blue-500 transition-colors rounded-full">
                <AvatarDisplay
                  avatarUrl={user?.avatar}
                  userName={user?.name}
                  size="md"
                  className="w-8 h-8 md:w-10 md:h-10"
                />
              </button>
              
              <div className="absolute left-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <Link to="/settings" className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md block">
                    {t('header.profile')}
                  </Link>
                  <Link to="/settings" className="w-full text-right px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md block">
                    {t('header.settings')}
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => logout(() => navigate('/'))}
                    className="w-full text-right px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        >
          <motion.div
            ref={searchModalRef}
            initial={{ scale: 0.95, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: -20 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('header.searchProjects')}</h3>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('header.searchProjects')}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.search')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </header>
  );
};