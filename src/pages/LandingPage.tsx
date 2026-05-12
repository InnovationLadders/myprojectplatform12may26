import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSchoolBranding } from '../contexts/SchoolBrandingContext';
import {
  Lightbulb,
  Users,
  MessageCircle,
  ShoppingCart,
  Bot,
  GalleryVertical,
  Shield,
  ArrowLeft,
  Star,
  Award,
  BookOpen,
  CheckCircle,
  DollarSign,
  Truck,
  Globe,
  Target
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { schoolName, logoUrl, loading: brandingLoading } = useSchoolBranding();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowLanguageMenu(false);
  };

  const features = [
    {
      icon: Lightbulb,
      title: t('sidebar.projectIdeas'),
      description: t('home.featuresSection.description'),
      link: '/project-ideas',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Users,
      title: t('sidebar.projects'),
      description: t('home.featuresSection.description'),
      link: '/projects',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: MessageCircle,
      title: t('sidebar.consultations'),
      description: t('home.featuresSection.description'),
      link: '/consultations',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: ShoppingCart,
      title: t('sidebar.store'),
      description: t('home.featuresSection.description'),
      link: '/store',
      color: 'from-pink-500 to-rose-600'
    },
    {
      icon: Bot,
      title: t('sidebar.aiAssistant'),
      description: t('home.featuresSection.description'),
      link: '/ai-assistant',
      color: 'from-indigo-500 to-blue-600'
    },
    {
      icon: GalleryVertical,
      title: t('sidebar.gallery'),
      description: t('home.featuresSection.description'),
      link: '/gallery',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: BookOpen,
      title: t('sidebar.resources'),
      description: t('home.featuresSection.description'),
      link: '/resources',
      color: 'from-emerald-500 to-cyan-600'
    },
    {
      icon: Shield,
      title: t('sidebar.intellectualProperty'),
      description: t('home.featuresSection.description'),
      link: '/intellectual-property',
      color: 'from-red-500 to-rose-600'
    },
  ];

  const testimonials = [
    {
      name: t('landingPage.testimonials.name1'),
      role: t('landingPage.testimonials.role1'),
      content: t('landingPage.testimonials.content1'),
      rating: 5,
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200'
    },
    {
      name: t('landingPage.testimonials.name2'),
      role: t('landingPage.testimonials.role2'),
      content: t('landingPage.testimonials.content2'),
      rating: 5,
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200'
    },
    {
      name: t('landingPage.testimonials.name3'),
      role: t('landingPage.testimonials.role3'),
      content: t('landingPage.testimonials.content3'),
      rating: 5,
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language Selector - Fixed at Top */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-30 backdrop-blur-md text-white rounded-lg hover:bg-opacity-40 transition-all shadow-lg border border-white border-opacity-30"
          >
            <Globe className="w-4 h-4" />
            <span className="font-semibold drop-shadow-md">{i18n.language === 'ar' ? 'العربية' : 'English'}</span>
          </button>

          {showLanguageMenu && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
              <button
                onClick={() => changeLanguage('ar')}
                className={`block w-full text-right px-4 py-2 text-sm hover:bg-gray-100 ${i18n.language === 'ar' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
              >
                العربية
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${i18n.language === 'en' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
              >
                English
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: 'url("/CarProject1.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>

        {/* Dark Base Overlay for Better Text Contrast */}
        <div className="absolute inset-0 bg-black opacity-50"></div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-30"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-white py-20 px-4 overflow-hidden"
        >
        <div className="relative z-10 max-w-6xl mx-auto text-center">

          {/* School Logo - Shows when accessing via subdomain */}
          {logoUrl && schoolName && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <div className="inline-block bg-white bg-opacity-10 backdrop-blur py-6 px-10 rounded-2xl">
                <img
                  src={logoUrl}
                  alt={schoolName}
                  className="h-32 w-auto object-contain drop-shadow-2xl rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </motion.div>
          )}

          <div className="flex items-center justify-center gap-6 mb-6 bg-white bg-opacity-10 backdrop-blur py-4 px-8 rounded-2xl inline-block mx-auto">
            <img
              src="/STEAM-Education_logo.jpg"
              alt="STEAM Education - Science Technology Engineering Arts Mathematics"
              className="h-20 rounded-lg shadow-xl border-2 border-white border-opacity-20"
            />
            <img
              src="/mashroui-logo.png"
              alt={t('appName')}
              className="h-24 drop-shadow-2xl"
            />
            <img
              src="/PBL-logo.jpg"
              alt="Project-based Learning Logo"
              className="h-20 rounded-lg shadow-xl border-2 border-white border-opacity-20"
            />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight drop-shadow-2xl" style={{ textShadow: '0 4px 8px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' }}>
            <span className="block text-2xl font-semibold mb-2 text-white drop-shadow-2xl" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)' }}>
              {t('landingPage.welcomeMessage')}
            </span>
            {t('appName')} - {t('appTagline')}
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto font-medium" style={{ textShadow: '0 3px 6px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.6)' }}>
            {t('home.description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg shadow-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_20px_50px_rgba(255,255,255,0.4)]"
            >
              {t('auth.createAccount')}
            </Link>
            <Link
              to="/login"
              className="bg-white bg-opacity-20 backdrop-blur-md border-2 border-white text-white px-8 py-3 rounded-full font-bold text-lg shadow-2xl hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              {t('auth.login')}
            </Link>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
              <div className="text-gray-600">{t('landingPage.stats.students')}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">25+</div>
              <div className="text-gray-600">{t('landingPage.stats.projects')}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">20+</div>
              <div className="text-gray-600">{t('landingPage.stats.teachers')}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">5+</div>
              <div className="text-gray-600">{t('landingPage.stats.schools')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Gallery */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img
              src="/im7.jpg"
              alt="Biomedical Research and Laboratory Science Project"
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img
              src="/images.jpg"
              alt="Engineering Vehicle Design Project"
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img
              src="/im5.jpg"
              alt="Laboratory Research and Scientific Analysis Project"
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img
              src="/im3.jpg"
              alt="Collaborative STEM Laboratory Project"
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-800 mb-12 text-center"
          >
            {t('home.featuresSection.title')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-r ${feature.color}`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-16 px-4 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-800 mb-12 text-center"
          >
            {t('home.testimonials.title')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-md"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold text-gray-800 mb-12 text-center"
          >
            {t('landingPage.benefits.title')}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('landingPage.benefits.benefit1.title')}</h3>
              <p className="text-gray-600">{t('landingPage.benefits.benefit1.description')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('landingPage.benefits.benefit2.title')}</h3>
              <p className="text-gray-600">{t('landingPage.benefits.benefit2.description')}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('landingPage.benefits.benefit3.title')}</h3>
              <p className="text-gray-600">{t('landingPage.benefits.benefit3.description')}</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-4"
          >
            {t('home.cta.title')}
          </motion.h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            {t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg shadow-2xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 hover:shadow-[0_20px_50px_rgba(255,255,255,0.4)]"
            >
              {t('auth.createAccount')}
            </Link>
            <Link
              to="/summer-program-enrollment"
              className="bg-white bg-opacity-20 backdrop-blur-md border-2 border-white text-white px-8 py-3 rounded-full font-bold text-lg shadow-2xl hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
            >
              {t('landingPage.cta.summerProgram')}
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img
                src="/mashroui-logo.png"
                alt={t('appName')}
                className="h-12 mb-4"
              />
              <p className="text-gray-400">
                {t('appTagline')}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('landingPage.footer.quickLinks')}</h4>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">{t('auth.login')}</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">{t('auth.createAccount')}</Link></li>
                <li><Link to="/summer-program-enrollment" className="text-gray-400 hover:text-white transition-colors">{t('landingPage.footer.summerProgram')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('landingPage.footer.contactUs')}</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">{t('landingPage.footer.email')}: sales@innovationladders.com</li>
                <li className="text-gray-400">{t('landingPage.footer.phone')}: 966554344899 </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">{t('landingPage.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">{t('legal.privacyPolicy.title')}</Link></li>
                <li><Link to="/terms-of-use" className="text-gray-400 hover:text-white transition-colors">{t('legal.termsOfUse.title')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} {t('appName')}. {t('landingPage.footer.copyright')}.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              <Link to="/privacy-policy" className="hover:text-gray-300 transition-colors">{t('legal.privacyPolicy.title')}</Link>
              {' • '}
              <Link to="/terms-of-use" className="hover:text-gray-300 transition-colors">{t('legal.termsOfUse.title')}</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};