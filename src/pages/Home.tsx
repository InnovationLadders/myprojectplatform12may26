import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Award, TrendingUp, MessageCircle, ShoppingCart, Bot, GalleryVertical as Gallery, Shield, ArrowLeft, Star, Clock, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t('sidebar.projectIdeas'),
      description: t('home.features.projectIdeas.description'),
      link: '/project-ideas',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Users,
      title: t('sidebar.projects'),
      description: t('home.features.projects.description'),
      link: '/projects',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: MessageCircle,
      title: t('sidebar.consultations'),
      description: t('home.features.consultations.description'),
      link: '/consultations',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: ShoppingCart,
      title: t('sidebar.store'),
      description: t('home.features.store.description'),
      link: '/store',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Bot,
      title: t('sidebar.aiAssistant'),
      description: t('home.features.aiAssistant.description'),
      link: '/ai-assistant',
      color: 'from-indigo-500 to-blue-600'
    },
    {
      icon: Gallery,
      title: t('sidebar.gallery'),
      description: t('home.features.gallery.description'),
      link: '/gallery',
      color: 'from-purple-500 to-pink-600'
    },
  ];

  const testimonials = [
    {
      name: 'سارة أحمد',
      role: 'معلمة علوم',
      content: 'منصة مشروعي غيرت طريقة تدريسي تماماً. الطلاب أصبحوا أكثر تفاعلاً وإبداعاً.',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 5
    },
    {
      name: 'محمد علي',
      role: 'طالب ثانوي',
      content: 'تمكنت من تطوير مشروع روبوت متقدم بفضل الإرشادات والدعم المتاح في المنصة.',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 5
    },
    {
      name: 'فاطمة خالد',
      role: 'مديرة مدرسة',
      content: 'المنصة ساعدتنا في تنظيم وإدارة مشاريع الطلاب بكفاءة عالية ومتابعة تقدمهم.',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
      rating: 5
    },
  ];

  return (
    <div className="space-y-8">
     
      {/* Features Section */}
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('home.featuresSection.title')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('home.featuresSection.description')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
              <Link
                to={feature.link}
                className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
              >
                {t('home.featuresSection.exploreMore')}
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>


      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-green-500 to-teal-600 rounded-3xl p-8 text-white text-center"
      >
        <h2 className="text-3xl font-bold mb-4">{t('home.cta.title')}</h2>
        <p className="text-xl mb-6 opacity-90">
          {t('home.cta.description')}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/project-ideas"
            className="bg-white text-green-600 px-8 py-3 rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200"
          >
            {t('home.cta.exploreIdeas')}
          </Link>
          <Link
            to="/projects"
            className="bg-white bg-opacity-20 text-white px-8 py-3 rounded-xl font-medium hover:bg-opacity-30 transition-all duration-200 backdrop-blur-sm"
          >
            {t('home.cta.createProject')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};