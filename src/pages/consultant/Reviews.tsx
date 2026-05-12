import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  Calendar, 
  User, 
  Filter, 
  Search, 
  ThumbsUp, 
  ThumbsDown, 
  BarChart3, 
  TrendingUp, 
  Award,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatDate } from '../../utils/dateUtils';

interface Review {
  id: string;
  consultation_id: string;
  student_id: string;
  consultant_id: string;
  rating: number;
  feedback: string;
  created_at: string;
  student?: {
    name: string;
    avatar: string;
  };
  consultation?: {
    topic: string;
    type: string;
    date: string;
  };
}

export const Reviews: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // Create a reference to the reviews collection
        const reviewsRef = collection(db, 'reviews');
        
        // Query reviews for this consultant
        const q = query(
          reviewsRef,
          where('consultant_id', '==', user.id),
          orderBy('created_at', 'desc'),
          limit(50)
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setReviews([]);
          setLoading(false);
          return;
        }
        
        // Process reviews and fetch related data
        const reviewsData = await Promise.all(snapshot.docs.map(async (reviewDoc) => {
          const data = reviewDoc.data();
          
          // Get student info
          let studentInfo = {
            name: 'طالب غير معروف',
            avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
          };
          
          if (data.student_id) {
            const studentDocRef = doc(db, 'users', data.student_id);
            const studentDoc = await getDoc(studentDocRef);
            if (studentDoc.exists()) {
              const studentData = studentDoc.data();
              studentInfo = {
                name: studentData.name || 'طالب غير معروف',
                avatar: studentData.avatar_url || studentInfo.avatar
              };
            }
          }
          
          // Get consultation info
          let consultationInfo = {
            topic: 'استشارة',
            type: 'عامة',
            date: new Date().toISOString()
          };
          
          if (data.consultation_id) {
            const consultationDocRef = doc(db, 'consultations', data.consultation_id);
            const consultationDoc = await getDoc(consultationDocRef);
            if (consultationDoc.exists()) {
              const consultationData = consultationDoc.data();
              consultationInfo = {
                topic: consultationData.topic || 'استشارة',
                type: consultationData.type || 'عامة',
                date: consultationData.completed_at ? 
                  new Date(consultationData.completed_at.toDate()).toISOString() : 
                  new Date().toISOString()
              };
            }
          }
          
          return {
            id: reviewDoc.id,
            consultation_id: data.consultation_id,
            student_id: data.student_id,
            consultant_id: data.consultant_id,
            rating: data.rating || 5,
            feedback: data.feedback || '',
            created_at: data.created_at ? new Date(data.created_at.toDate()).toISOString() : new Date().toISOString(),
            student: studentInfo,
            consultation: consultationInfo
          };
        }));
        
        setReviews(reviewsData);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل التقييمات');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  // Filter and sort reviews
  const filteredReviews = reviews.filter(review => {
    const matchesRating = selectedRating === null || review.rating === selectedRating;
    const matchesSearch = review.feedback.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.consultation?.topic.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'latest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    } else if (sortBy === 'highest') {
      return b.rating - a.rating;
    } else if (sortBy === 'lowest') {
      return a.rating - b.rating;
    }
    return 0;
  });

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
    : 0;
  
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: totalReviews > 0 
      ? (reviews.filter(review => review.rating === rating).length / totalReviews) * 100 
      : 0
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
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
        className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">التقييمات</h1>
            <p className="opacity-90">تقييمات الطلاب لاستشاراتك</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <div className="text-sm opacity-80">إجمالي التقييمات</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="text-sm opacity-80">متوسط التقييم</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{ratingCounts[0].count}</div>
            <div className="text-sm opacity-80">تقييم 5 نجوم</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{reviews.filter(r => r.rating >= 4).length}</div>
            <div className="text-sm opacity-80">تقييمات إيجابية</div>
          </div>
        </div>
      </motion.div>

      {/* Rating Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid lg:grid-cols-3 gap-6"
      >
        {/* Rating Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-yellow-500" />
            توزيع التقييمات
          </h2>
          
          <div className="space-y-4">
            {ratingCounts.map((item) => (
              <div key={item.rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-24">
                  <span className="font-medium">{item.rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-yellow-400 h-2.5 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
                <div className="w-16 text-right">
                  <span className="text-sm text-gray-600">{item.percentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-yellow-500" />
            إحصائيات التقييم
          </h2>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800 mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-6 h-6 ${star <= Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <p className="text-gray-600">من {totalReviews} تقييم</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نسبة الرضا</span>
                <span className="font-medium text-green-600">
                  {totalReviews > 0 ? ((reviews.filter(r => r.rating >= 4).length / totalReviews) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">متوسط التقييم الشهري</span>
                <span className="font-medium text-blue-600">
                  {reviews.filter(r => {
                    const reviewDate = new Date(r.created_at);
                    const now = new Date();
                    return reviewDate.getMonth() === now.getMonth() && 
                           reviewDate.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">أعلى تقييم</span>
                <span className="font-medium text-yellow-600">5.0</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Reviews List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-yellow-500" />
            التقييمات والمراجعات
          </h2>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في التقييمات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pr-12 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="latest">الأحدث</option>
              <option value="oldest">الأقدم</option>
              <option value="highest">الأعلى تقييماً</option>
              <option value="lowest">الأقل تقييماً</option>
            </select>
          </div>
        </div>

        {/* Rating Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">تصفية حسب التقييم:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedRating(null)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedRating === null
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              الكل
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setSelectedRating(rating)}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  selectedRating === rating
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{rating}</span>
                <Star className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Reviews */}
        <div className="space-y-6">
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={review.student?.avatar}
                    alt={review.student?.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{review.student?.name}</h3>
                        <p className="text-sm text-gray-500">{review.consultation?.topic}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(review.created_at)}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">{review.feedback}</p>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        تاريخ الاستشارة: {formatDate(review.consultation?.date || '')}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        نوع الاستشارة: {review.consultation?.type === 'technical' ? 'تقنية' : 
                                       review.consultation?.type === 'academic' ? 'أكاديمية' : 
                                       review.consultation?.type === 'career' ? 'مهنية' : 
                                       review.consultation?.type === 'project' ? 'مشروع' : 
                                       review.consultation?.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    مفيد
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <MessageSquare className="w-4 h-4" />
                    رد
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد تقييمات</h3>
              <p className="text-gray-600">
                {reviews.length === 0 
                  ? 'لم تتلق أي تقييمات بعد' 
                  : 'لم يتم العثور على تقييمات تطابق معايير البحث'}
              </p>
              {reviews.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedRating(null);
                    setSearchTerm('');
                    setSortBy('latest');
                  }}
                  className="mt-4 px-6 py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors"
                >
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-500" />
          نصائح لتحسين تقييماتك
        </h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">الاستماع الجيد</h3>
            <p className="text-gray-600 text-sm">استمع جيداً لاحتياجات الطالب وافهم مشكلته قبل تقديم الحلول</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">التواصل الفعال</h3>
            <p className="text-gray-600 text-sm">حافظ على تواصل واضح ومباشر، واستخدم لغة مفهومة للطالب</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2">المتابعة بعد الاستشارة</h3>
            <p className="text-gray-600 text-sm">تواصل مع الطالب بعد الاستشارة للتأكد من استفادته وتقديم دعم إضافي</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Import missing components
import { doc, getDoc } from 'firebase/firestore';