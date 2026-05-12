import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  MessageSquare, 
  User, 
  FileText, 
  Award,
  BookOpen,
  Settings,
  Users,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  Star,
  Calendar,
  MessageCircle,
  Lightbulb,
  ShoppingCart,
  Bot,
  GalleryVertical,
  Shield,
  LayoutDashboard,
  School
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMinimized, onToggleMinimize }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Common menu items for all users
  const commonMenuItems = [
    { id: 'home', icon: Home, label: t('sidebar.home'), path: '/' },
    { id: 'project-ideas', icon: Lightbulb, label: t('sidebar.projectIdeas'), path: '/project-ideas' },
    { id: 'projects', icon: FileText, label: t('sidebar.projects'), path: '/projects' },
    { id: 'store', icon: ShoppingCart, label: t('sidebar.store'), path: '/store' },
    { id: 'consultations', icon: MessageCircle, label: t('sidebar.consultations'), path: '/consultations' },
    { id: 'gallery', icon: GalleryVertical, label: t('sidebar.gallery'), path: '/gallery' },
    { id: 'ai-assistant', icon: Bot, label: t('sidebar.aiAssistant'), path: '/ai-assistant' },
    { id: 'resources', icon: BookOpen, label: t('sidebar.resources'), path: '/resources' },
    { id: 'intellectual-property', icon: Shield, label: t('sidebar.intellectualProperty'), path: '/intellectual-property' },
  ];

  const getMenuItems = () => {
    // Start with common menu items for all users
    let menuItems = [...commonMenuItems];
    
    // Add role-specific items
    if (user?.role === 'teacher') {
      menuItems.push(
        { id: 'reports', icon: BarChart3, label: t('sidebar.reports'), path: '/reports' }
      );
    } else if (user?.role === 'consultant') {
      menuItems.push(
        { id: 'consultant-dashboard', icon: Briefcase, label: t('sidebar.consultantDashboard'), path: '/consultant-dashboard' },
        { id: 'consultation-requests', icon: MessageCircle, label: t('sidebar.consultationRequests'), path: '/consultation-requests' },
        { id: 'consultant-schedule', icon: Calendar, label: t('sidebar.consultantSchedule'), path: '/consultant-schedule' },
        { id: 'consultant-profile', icon: User, label: t('sidebar.consultantProfile'), path: '/consultant-profile' },
        { id: 'reviews', icon: Star, label: t('sidebar.reviews'), path: '/reviews' }
      );
    } else if (user?.role === 'school') {
      menuItems.push(
        { id: 'reports', icon: BarChart3, label: t('sidebar.reports'), path: '/reports' }
      );
    } else if (user?.role === 'admin') {
      menuItems.push(
        { id: 'admin-dashboard', icon: LayoutDashboard, label: t('sidebar.adminDashboard'), path: '/admin-dashboard' }
      );
    }
    
    // Add settings for all users
    menuItems.push({ id: 'settings', icon: Settings, label: t('sidebar.settings'), path: '/settings' });
    
    return menuItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: isMinimized ? 80 : 320
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`
          bg-white shadow-lg border-gray-200 z-50 flex-shrink-0
          ${isOpen ? 'fixed inset-y-0 lg:relative' : 'hidden lg:flex lg:flex-col'}
          ${isMinimized ? 'w-20' : 'w-80'}
          ${isRTL ? 'border-l' : 'border-r'}
          ${isRTL ? (isOpen ? 'right-0' : '') : (isOpen ? 'left-0' : '')}
        `}
      >
        {/* Header */}
        <div className={`p-6 border-gray-200 ${isMinimized ? 'px-4' : ''} ${isRTL ? 'border-b' : 'border-b'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${isMinimized ? 'justify-center' : ''}`}>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/mashroui-logo.png" 
                  alt={t('appName')} 
                  className="w-full h-full object-contain"
                />
              </div>
              {!isMinimized && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{t('appName')}</h2>
                  <p className="text-sm text-gray-500">{t('appTagline')}</p>
                </div>
              )}
            </div>
            
            {/* Minimize/Maximize button - only show on desktop */}
            <button
              onClick={onToggleMinimize}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMinimized ? (
                isRTL ? <ChevronRight className="w-5 h-5 text-gray-600" /> : <ChevronLeft className="w-5 h-5 text-gray-600" />
              ) : (
                isRTL ? <ChevronLeft className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isRTL ? <ChevronLeft className="w-5 h-5 text-gray-600" /> : <ChevronRight className="w-5 h-5 text-gray-600" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`p-4 space-y-2 overflow-y-auto flex-1 ${isMinimized ? 'px-2' : ''}`}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={item.path} className="relative">
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                  } ${isMinimized ? 'justify-center px-2' : ''}`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isMinimized && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
                
                {/* Tooltip for minimized state */}
                {isMinimized && (
                  <div className={`absolute ${isRTL ? 'right-full' : 'left-full'} top-1/2 transform -translate-y-1/2 ${isRTL ? 'mr-2' : 'ml-2'} bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10`}>
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </motion.div>
    </>
  );
};