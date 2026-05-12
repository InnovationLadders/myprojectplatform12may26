import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  FileText, 
  Users, 
  BookOpen, 
  ShoppingCart, 
  MessageCircle, 
  Lightbulb,
  Video,
  Star,
  Eye,
  Heart,
  Clock,
  Calendar,
  Tag,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjects } from '../hooks/useProjects';
import { useStoreItems } from '../hooks/useStoreItems';
import { useLearningResources } from '../hooks/useLearningResources';
import { useConsultations } from '../hooks/useConsultations';
import { useProjectIdeas } from '../hooks/useProjectIdeas';
import { formatDate } from '../utils/dateUtils';

// Define the categories for search results
const searchCategories = [
  { id: 'all', name: 'الكل', icon: SearchIcon },
  { id: 'projects', name: 'المشاريع', icon: FileText },
  { id: 'ideas', name: 'أفكار المشاريع', icon: Lightbulb },
  { id: 'resources', name: 'المصادر التعليمية', icon: BookOpen },
  { id: 'store', name: 'المتجر', icon: ShoppingCart },
  { id: 'consultants', name: 'المستشارين', icon: Users },
];

export const SearchResultsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch data from different hooks
  const { projects } = useProjects();
  const { storeItems } = useStoreItems();
  const { resources } = useLearningResources();
  const { consultants } = useConsultations();
  const { projectIdeas } = useProjectIdeas();
  
  // Set loading state based on all data fetches
  useEffect(() => {
    if (projects && storeItems && resources && consultants && projectIdeas) {
      setLoading(false);
    }
  }, [projects, storeItems, resources, consultants, projectIdeas]);
  
  // Filter results based on search query
  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredIdeas = projectIdeas.filter(idea => 
    idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    idea.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredResources = resources.filter(resource => 
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredStoreItems = storeItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const filteredConsultants = consultants.filter(consultant => 
    consultant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    consultant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    consultant.specialties.some(specialty => specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Get all results or filtered by category
  const getResults = () => {
    switch (selectedCategory) {
      case 'projects':
        return { projects: filteredProjects, ideas: [], resources: [], storeItems: [], consultants: [] };
      case 'ideas':
        return { projects: [], ideas: filteredIdeas, resources: [], storeItems: [], consultants: [] };
      case 'resources':
        return { projects: [], ideas: [], resources: filteredResources, storeItems: [], consultants: [] };
      case 'store':
        return { projects: [], ideas: [], resources: [], storeItems: filteredStoreItems, consultants: [] };
      case 'consultants':
        return { projects: [], ideas: [], resources: [], storeItems: [], consultants: filteredConsultants };
      default:
        return { 
          projects: filteredProjects, 
          ideas: filteredIdeas, 
          resources: filteredResources, 
          storeItems: filteredStoreItems, 
          consultants: filteredConsultants 
        };
    }
  };
  
  const results = getResults();
  const totalResults = results.projects.length + results.ideas.length + 
                      results.resources.length + results.storeItems.length + 
                      results.consultants.length;
  
  // Get category text for project ideas
  const getCategoryText = (category: string) => {
    switch (category) {
      case 'stem': return 'العلوم والتقنية';
      case 'entrepreneurship': return 'ريادة الأعمال';
      case 'volunteer': return 'التطوع';
      case 'ethics': return 'الأخلاق';
      default: return category;
    }
  };
  
  // Get difficulty text for project ideas
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'مبتدئ';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'متقدم';
      default: return difficulty;
    }
  };
  
  // Get difficulty color for project ideas
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <SearchIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">نتائج البحث</h1>
            <p className="opacity-90">نتائج البحث عن: "{searchQuery}"</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{totalResults}</div>
            <div className="text-sm opacity-80">إجمالي النتائج</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{results.projects.length}</div>
            <div className="text-sm opacity-80">مشروع</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{results.ideas.length}</div>
            <div className="text-sm opacity-80">فكرة مشروع</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{results.resources.length + results.storeItems.length + results.consultants.length}</div>
            <div className="text-sm opacity-80">نتائج أخرى</div>
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg"
      >
        <div className="flex flex-wrap gap-2">
          {searchCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results */}
      <div className="space-y-8">
        {/* Projects Results */}
        {(selectedCategory === 'all' || selectedCategory === 'projects') && results.projects.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                المشاريع ({results.projects.length})
              </h2>
              <Link to="/projects" className="text-blue-600 hover:text-blue-800 text-sm">
                عرض الكل
              </Link>
            </div>

            <div className="space-y-4">
              {results.projects.slice(0, 5).map((project) => (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="block border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{project.title}</h3>
                      <p className="text-gray-600 line-clamp-2">{project.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>الحالة: {project.status === 'active' ? 'نشط' : 
                                      project.status === 'completed' ? 'مكتمل' : 
                                      project.status === 'draft' ? 'مسودة' : 'مؤرشف'}</span>
                        <span>التقدم: {project.progress}/10</span>
                        {project.due_date && (
                          <span>تاريخ الاستحقاق: {formatDate(project.due_date)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        مشروع
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {results.projects.length > 5 && (
                <div className="text-center mt-4">
                  <Link 
                    to={`/projects?search=${encodeURIComponent(searchQuery)}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    عرض المزيد من المشاريع ({results.projects.length - 5})
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Project Ideas Results */}
        {(selectedCategory === 'all' || selectedCategory === 'ideas') && results.ideas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                أفكار المشاريع ({results.ideas.length})
              </h2>
              <Link to="/project-ideas" className="text-blue-600 hover:text-blue-800 text-sm">
                عرض الكل
              </Link>
            </div>

            <div className="space-y-4">
              {results.ideas.slice(0, 5).map((idea) => (
                <div 
                  key={idea.id} 
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{idea.title}</h3>
                      <p className="text-gray-600 line-clamp-2">{idea.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-lg">
                          {getCategoryText(idea.category)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-lg ${getDifficultyColor(idea.difficulty)}`}>
                          {getDifficultyText(idea.difficulty)}
                        </span>
                        {idea.tags && idea.tags.slice(0, 2).map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        فكرة مشروع
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {results.ideas.length > 5 && (
                <div className="text-center mt-4">
                  <Link 
                    to="/project-ideas"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    عرض المزيد من أفكار المشاريع ({results.ideas.length - 5})
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Learning Resources Results */}
        {(selectedCategory === 'all' || selectedCategory === 'resources') && results.resources.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                المصادر التعليمية ({results.resources.length})
              </h2>
              <Link to="/resources" className="text-blue-600 hover:text-blue-800 text-sm">
                عرض الكل
              </Link>
            </div>

            <div className="space-y-4">
              {results.resources.slice(0, 5).map((resource) => (
                <div 
                  key={resource.id} 
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={resource.thumbnail || "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=150"} 
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{resource.title}</h3>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
                          {resource.type === 'video' ? 'فيديو' : 
                           resource.type === 'article' ? 'مقالة' : 
                           resource.type === 'course' ? 'دورة' : 
                           resource.type === 'template' ? 'قالب' : 
                           resource.type === 'podcast' ? 'بودكاست' : 'مصدر تعليمي'}
                        </span>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{resource.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{resource.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{resource.views} مشاهدة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{resource.duration || '15 دقيقة'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {results.resources.length > 5 && (
                <div className="text-center mt-4">
                  <Link 
                    to="/resources"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    عرض المزيد من المصادر التعليمية ({results.resources.length - 5})
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Store Items Results */}
        {(selectedCategory === 'all' || selectedCategory === 'store') && results.storeItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
                المتجر ({results.storeItems.length})
              </h2>
              <Link to="/store" className="text-blue-600 hover:text-blue-800 text-sm">
                عرض الكل
              </Link>
            </div>

            <div className="space-y-4">
              {results.storeItems.slice(0, 5).map((item) => (
                <div 
                  key={item.id} 
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-purple-600">{item.price} ر.س</span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-400 line-through">{item.originalPrice} ر.س</span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{item.rating} ({item.reviews} تقييم)</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {item.inStock ? 'متوفر' : 'غير متوفر'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {results.storeItems.length > 5 && (
                <div className="text-center mt-4">
                  <Link 
                    to="/store"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    عرض المزيد من المنتجات ({results.storeItems.length - 5})
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Consultants Results */}
        {(selectedCategory === 'all' || selectedCategory === 'consultants') && results.consultants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                المستشارين ({results.consultants.length})
              </h2>
              <Link to="/search" className="text-blue-600 hover:text-blue-800 text-sm">
                عرض الكل
              </Link>
            </div>

            <div className="space-y-4">
              {results.consultants.slice(0, 5).map((consultant) => (
                <div 
                  key={consultant.id} 
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={consultant.avatar} 
                        alt={consultant.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{consultant.name}</h3>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{consultant.rating} ({consultant.reviews} تقييم)</span>
                        </div>
                      </div>
                      <p className="text-gray-600">{consultant.title}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {consultant.specialties.slice(0, 3).map((specialty, idx) => (
                          <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-lg">
                            {specialty}
                          </span>
                        ))}
                        {consultant.specialties.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                            +{consultant.specialties.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {results.consultants.length > 5 && (
                <div className="text-center mt-4">
                  <Link 
                    to="/search"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    عرض المزيد من المستشارين ({results.consultants.length - 5})
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* No Results */}
        {totalResults === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">لم يتم العثور على نتائج</h3>
            <p className="text-gray-600 mb-4">
              لم يتم العثور على نتائج تطابق "{searchQuery}"
            </p>
            <p className="text-gray-500 text-sm mb-6">
              حاول تغيير كلمات البحث أو البحث في فئة محددة
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                العودة للرئيسية
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Backend Search Note - Only visible in development */}
      {import.meta.env.DEV && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
          <p className="font-medium mb-1">ملاحظة للمطورين:</p>
          <p>
            هذه الصفحة تعرض نتائج بحث محلية من البيانات المتاحة في الواجهة الأمامية. في بيئة الإنتاج، يُفضل استخدام خدمة بحث متخصصة مثل Algolia أو Elasticsearch أو Firebase Cloud Functions مع Firestore للبحث عبر مجموعات البيانات المختلفة بكفاءة أعلى.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResultsPage;