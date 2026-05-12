import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: 'url("https://images.pexels.com/photos/8471793/pexels-photo-8471793.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        ></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-85"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative text-white py-20 px-4 overflow-hidden"
        >
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="absolute top-4 right-4 z-20">
            <div className="relative">
              <button 
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-all"
              >
                <Globe className="w-4 h-4" />
                <span>{i18n.language === 'ar' ? 'العربية' : 'English'}</span>
              </button>
              
              {showLanguageMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden">
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
          
          <div className="flex items-center justify-center gap-6 mb-6">
            <img
              src="/STEAM-Education_2.jpg"
              alt="STEAM Education - Science Technology Engineering Arts Mathematics"
              className="h-20 rounded-lg shadow-md"
            />
            <img
              src="/mashroui-logo.png"
              alt={t('appName')}
              className="h-24 drop-shadow-lg"
            />
            <img
              src="/PBL-1.jpg"
              alt="Project-based Learning Logo"
              className="h-20 rounded-lg shadow-md"
            />
          </div>
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            <span className="block text-2xl font-medium mb-2 text-blue-100">
              {t('landingPage.welcomeMessage')}
            </span>
            {t('appName')} - {t('appTagline')}
          </h1>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            {t('home.description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
            >
              {t('auth.createAccount')}
            </Link>
            <Link
              to="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-white hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105"
            >
              {t('auth.login')}
            </Link>
          </div>
        </div>
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
          <div className="text-gray-600">طالب مسجل</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">25+</div>
          <div className="text-gray-600">مشروع منجز</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">20+</div>
          <div className="text-gray-600">معلم ومستشار</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">5+</div>
          <div className="text-gray-600">مدرسة شريكة</div>
        </div>
      </div>

      {/* Project Gallery */}
      <div className="py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img 
              src="https://images.pexels.com/photos/9242852/pexels-photo-9242852.jpeg?auto=compress&cs=tinysrgb&w=600" 
              alt="Assistant Robot Project" 
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img 
              src="https://images.pexels.com/photos/7869033/pexels-photo-7869033.jpeg?auto=compress&cs=tinysrgb&w=600" 
              alt="Renewable Energy Project" 
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img 
              src="https://images.pexels.com/photos/8471793/pexels-photo-8471793.jpeg?auto=compress&cs=tinysrgb&w=600" 
              alt="Educational App" 
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="relative overflow-hidden rounded-lg shadow-md group">
            <img 
              src="https://images.pexels.com/photos/4705626/pexels-photo-4705626.jpeg?auto=compress&cs=tinysrgb&w=600" 
              alt="Recycling Project" 
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="py-16 px-4 bg-white">
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
            لماذا منصة مشروعي؟
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2">تعلم قائم على المشاريع</h3>
              <p className="text-gray-600">تطوير مهارات الطلاب من خلال مشاريع عملية تطبيقية في مختلف المجالات</p>
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2">تطوير المهارات</h3>
              <p className="text-gray-600">تنمية مهارات القرن الواحد والعشرين والتفكير النقدي والإبداعي</p>
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
              <h3 className="text-xl font-semibold text-gray-800 mb-2">مجتمع تعليمي</h3>
              <p className="text-gray-600">بيئة تفاعلية تجمع الطلاب والمعلمين والمستشارين في منصة واحدة</p>
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
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
            >
              {t('auth.createAccount')}
            </Link>
            <Link
              to="/summer-program-enrollment"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-white hover:bg-opacity-20 transition-all duration-300"
            >
              .......
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
              <h4 className="text-lg font-semibold mb-4">روابط سريعة</h4>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">تسجيل الدخول</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white transition-colors">إنشاء حساب</Link></li>
                <li><Link to="/summer-program-enrollment" className="text-gray-400 hover:text-white transition-colors">......</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">تواصل معنا</h4>
              <ul className="space-y-2">
                <li className="text-gray-400">البريد الإلكتروني: sales@innovationladders.com</li>
                <li className="text-gray-400">الهاتف: 966554344899 </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">تابعنا</h4>
              {/* Social media links commented out for now
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
              </div>
              */}
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} {t('appName')}. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};