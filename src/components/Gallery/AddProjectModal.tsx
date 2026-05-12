import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Save, 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Award, 
  Users, 
  School, 
  User, 
  Tag, 
  AlertTriangle, 
  CheckCircle,
  Link as LinkIcon
} from 'lucide-react';
import { useGallery, GalleryProject } from '../../hooks/useGallery';
import { useAuth } from '../../contexts/AuthContext';
import { getSchools } from '../../lib/firebase';
import { GalleryVertical as GalleryIcon } from 'lucide-react';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProject?: GalleryProject | null; // Optional prop for editing
}

export const AddProjectModal: React.FC<AddProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  editingProject
}) => {
  const { user } = useAuth();
  const { addGalleryProject, updateGalleryProject, uploadMedia, convertYouTubeUrl } = useGallery();
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'stem',
    students: [''],
    teacher: '',
    mediaType: 'image' as 'image' | 'video' | 'youtube',
    mediaFile: null as File | null,
    youtubeUrl: '',
    tags: [''],
    awards: [''],
    featured: false
  });
  const [mediaFilePreview, setMediaFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch schools when modal opens (only for admin users)
  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        title: '', description: '', category: 'stem', students: [''], teacher: '',
        mediaType: 'image', mediaFile: null, youtubeUrl: '', tags: [''], awards: [''], featured: false
      });
      setSelectedSchoolId('');
      setMediaFilePreview(null);
      setError(null);
      setSuccess(null);
      return;
    }

    // Fetch schools for admin users
    if (user?.role === 'admin') {
      
      const fetchSchoolsData = async () => {
        try {
          setSchoolsLoading(true);
          const fetchedSchools = await getSchools();
          if (fetchedSchools && fetchedSchools.length > 0) {
            setSchools(fetchedSchools);
          } else {
            setSchools([]);
          }
        } catch (err) {
          console.error('Error fetching schools:', err);
          setSchools([]);
        } finally {
          setSchoolsLoading(false);
        }
      };
      fetchSchoolsData();
    }

    // Populate form for editing
    if (editingProject) {
      setFormData({
        title: editingProject.title || '',
        description: editingProject.description || '',
        category: editingProject.category || 'stem',
        students: editingProject.students?.length ? editingProject.students : [''],
        teacher: editingProject.teacher || '',
        mediaType: editingProject.mediaType || 'image',
        mediaFile: null, // Cannot pre-fill file input
        youtubeUrl: editingProject.youtubeUrl || '',
        tags: editingProject.tags?.length ? editingProject.tags : [''],
        awards: editingProject.awards?.length ? editingProject.awards : [''],
        featured: editingProject.featured || false
      });
      setSelectedSchoolId(editingProject.schoolId || '');
      setMediaFilePreview(editingProject.mediaUrl || null); // Set preview for existing media
    } else {
      // Reset form for new project when modal opens without editingProject
      setFormData({
        title: '', description: '', category: 'stem', students: [''], teacher: '',
        mediaType: 'image', mediaFile: null, youtubeUrl: '', tags: [''], awards: [''], featured: false
      });
      setSelectedSchoolId('');
      setMediaFilePreview(null);
    }
  }, [isOpen, editingProject, user?.role]);

  const categories = [
    { id: 'stem', name: 'العلوم والتقنية' },
    { id: 'entrepreneurship', name: 'ريادة الأعمال' },
    { id: 'volunteer', name: 'التطوع' },
    { id: 'ethics', name: 'الأخلاق' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], '']
    }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field as keyof typeof prev].filter((_: any, i: number) => i !== index)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        mediaFile: file
      }));
      setMediaFilePreview(URL.createObjectURL(file)); // Create a preview URL
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.mediaType === 'youtube' && !formData.youtubeUrl) {
      setError('يرجى إدخال رابط يوتيوب صالح');
      return;
    }

    if ((formData.mediaType === 'image' || formData.mediaType === 'video') && !formData.mediaFile) {
      setError('يرجى اختيار ملف للرفع');
      return;
    }

    // Validate user permissions
    if (!user) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'school') {
      setError('ليس لديك صلاحية لإضافة مشاريع للمعرض');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      let mediaUrl = '';
      let youtubeUrls = { embedUrl: '', watchUrl: '' };
      
      // Handle media upload/URL based on mediaType
      if (formData.mediaType === 'youtube') {
        if (!formData.youtubeUrl.trim()) {
          throw new Error('يرجى إدخال رابط يوتيوب');
        }
        youtubeUrls = convertYouTubeUrl(formData.youtubeUrl);
        mediaUrl = youtubeUrls.embedUrl;
      } else if (formData.mediaFile) {
        const uploadResult = await uploadMedia(formData.mediaFile);
        mediaUrl = uploadResult.url;
        formData.mediaType = uploadResult.type;
      } else if (!editingProject || (editingProject && formData.mediaFile)) {
        // If it's a new project or an existing project with a new file selected
        throw new Error('يرجى اختيار ملف للرفع');
      }
      // Determine school information based on user role
      let schoolId = '';
      let schoolName = '';
      
      if (user.role === 'admin') {
        // For admin users, use the selected school from dropdown
        if (!selectedSchoolId) {
          throw new Error('يرجى اختيار المدرسة');
        }
        
        const selectedSchool = schools.find(school => school.id === selectedSchoolId);
        if (!selectedSchool) {
          throw new Error('المدرسة المحددة غير صالحة');
        }
        
        schoolId = selectedSchool.id;
        schoolName = selectedSchool.name;
      } else if (user.role === 'school') {
        // For school users, use their own ID and name
        schoolId = user.id;
        schoolName = user.name || 'مدرسة غير معروفة';
      } else {
        throw new Error('ليس لديك صلاحية لإضافة مشاريع للمعرض');
      }

      // Prepare project data
      const projectData: any = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        students: formData.students.filter(s => s.trim()),
        school: schoolName,
        schoolId: schoolId,
        teacher: formData.teacher || user?.name || 'معلم غير معروف',
        mediaUrl: mediaUrl || editingProject?.mediaUrl || '', // Use existing mediaUrl if no new file/youtube link
        mediaType: formData.mediaType,
        tags: formData.tags.filter(t => t.trim()),
        awards: formData.awards.filter(a => a.trim()),
        featured: formData.featured,
        rating: editingProject?.rating || 4.5 // Preserve existing rating or default
      };

      // Only add YouTube-specific fields if mediaType is 'youtube'
      if (formData.mediaType === 'youtube') {
        projectData.youtubeUrl = youtubeUrls.watchUrl;
        projectData.video = youtubeUrls.embedUrl;
      } else {
        // Explicitly set to null for non-YouTube media to prevent undefined values
        projectData.youtubeUrl = null;
        projectData.video = null;
      }

      console.log('Submitting gallery project data:', projectData);
      
      if (editingProject) {
        await updateGalleryProject(editingProject.id, projectData);
      } else {
        await addGalleryProject(projectData);
      }

      setSuccess('تم إضافة المشروع للمعرض بنجاح');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'stem',
        students: [''],
        teacher: '',
        mediaType: 'image',
        mediaFile: null,
        youtubeUrl: '',
        tags: [''],
        awards: [''],
        featured: false,
      });
      
      // Close modal after success
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error adding gallery project:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في إضافة المشروع');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div // Add editingProject to destructuring
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GalleryIcon className="w-6 h-6 text-pink-600" />
            {editingProject ? 'تعديل مشروع المعرض' : (user?.role === 'school' ? `إضافة مشروع لمعرض ${user.name}` : 'إضافة مشروع للمعرض')}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>{success}</div>
          </div>
        )}

        {/* Permission Notice */}
        {user?.role === 'school' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-800">صلاحيات المدرسة</h4>
                <p className="text-green-700 text-sm">يمكنك إضافة مشاريع طلاب مدرستك فقط إلى المعرض</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin School Selection */}
        {user?.role === 'admin' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <School className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-800">اختيار المدرسة</h4>
                <p className="text-blue-700 text-sm">اختر المدرسة التي ينتمي إليها هذا المشروع</p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المدرسة *
              </label>
              <div className="relative">
                <School className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  required
                >
                  <option value="">اختر المدرسة</option>
                  {schoolsLoading && <option disabled>جاري تحميل المدارس...</option>}
                  {!schoolsLoading && schools.length === 0 && (
                    <option disabled>لا توجد مدارس متاحة</option>
                  )}
                  {!schoolsLoading && schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* School Information Display for School Users */}
        {user?.role === 'school' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <School className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-800">معلومات المدرسة</h4>
                <p className="text-blue-700 text-sm">سيتم إضافة هذا المشروع لمعرض {user.name}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان المشروع *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="أدخل عنوان المشروع"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف المشروع *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="اكتب وصفاً شاملاً للمشروع وإنجازاته"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                فئة المشروع *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المعلم المشرف
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.teacher}
                  onChange={(e) => handleInputChange('teacher', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder={user?.role === 'school' ? user.name || 'اسم المعلم المشرف' : 'اسم المعلم المشرف'}
                />
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الوسائط *
            </label>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                formData.mediaType === 'image' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="mediaType"
                  value="image"
                  checked={formData.mediaType === 'image'}
                  onChange={() => handleInputChange('mediaType', 'image')}
                  className="sr-only"
                />
                <ImageIcon className="w-5 h-5" />
                <span>صورة</span>
              </label>
              
              <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                formData.mediaType === 'video' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={formData.mediaType === 'video'}
                  onChange={() => handleInputChange('mediaType', 'video')}
                  className="sr-only"
                />
                <Video className="w-5 h-5" />
                <span>فيديو</span>
              </label>
              
              <label className={`flex items-center justify-center gap-2 p-4 border rounded-xl cursor-pointer transition-colors ${
                formData.mediaType === 'youtube' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'border-gray-300 hover:bg-gray-50'
              }`}>
                <input
                  type="radio"
                  name="mediaType"
                  value="youtube"
                  checked={formData.mediaType === 'youtube'}
                  onChange={() => handleInputChange('mediaType', 'youtube')}
                  className="sr-only"
                />
                <LinkIcon className="w-5 h-5" />
                <span>يوتيوب</span>
              </label>
            </div>

            {formData.mediaType === 'youtube' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط يوتيوب *
                </label>
                <input
                  type="url"
                  value={formData.youtubeUrl}
                  onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك إدخال رابط المشاهدة العادي أو رابط التضمين
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {mediaFilePreview && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-300">
                    {formData.mediaType === 'image' ? (
                      <img src={mediaFilePreview} alt="Media Preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={mediaFilePreview} controls className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setMediaFilePreview(null); setFormData(prev => ({ ...prev, mediaFile: null })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingProject && !formData.mediaFile ? `تغيير ${formData.mediaType === 'image' ? 'الصورة' : 'الفيديو'}` : `رفع ${formData.mediaType === 'image' ? 'صورة' : 'فيديو'} *`}
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" accept={formData.mediaType === 'image' ? 'image/*' : 'video/*'} onChange={handleFileChange} className="hidden" id="media-upload" ref={fileInputRef} />
                  
                  {!mediaFilePreview && (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        {formData.mediaFile 
                          ? formData.mediaFile.name 
                          : `اسحب وأفلت ${formData.mediaType === 'image' ? 'الصورة' : 'الفيديو'} هنا أو اضغط للاختيار`}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        الحد الأقصى للحجم: {formData.mediaType === 'image' ? '10MB' : '100MB'}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Students */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              أسماء الطلاب المشاركين
            </label>
            <div className="space-y-3">
              {formData.students.map((student, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={student}
                    onChange={(e) => handleArrayChange('students', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={`الطالب ${index + 1}`}
                  />
                  {formData.students.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('students', index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('students')}
                className="flex items-center gap-2 px-4 py-2 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                إضافة طالب
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              أدخل أسماء الطلاب المشاركين في المشروع
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الكلمات المفتاحية
            </label>
            <div className="space-y-3">
              {formData.tags.map((tag, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleArrayChange('tags', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={`كلمة مفتاحية ${index + 1}`}
                  />
                  {formData.tags.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('tags', index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('tags')}
                className="flex items-center gap-2 px-4 py-2 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"
              >
                <Tag className="w-4 h-4" />
                إضافة كلمة مفتاحية
              </button>
            </div>
          </div>

          {/* Awards */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الجوائز والإنجازات (اختياري)
            </label>
            <div className="space-y-3">
              {formData.awards.map((award, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={award}
                    onChange={(e) => handleArrayChange('awards', index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder={`جائزة ${index + 1}`}
                  />
                  {formData.awards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem('awards', index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem('awards')}
                className="flex items-center gap-2 px-4 py-2 text-pink-600 hover:bg-pink-100 rounded-lg transition-colors"
              >
                <Award className="w-4 h-4" />
                إضافة جائزة
              </button>
            </div>
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => handleInputChange('featured', e.target.checked)}
              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
            />
            <label htmlFor="featured" className="mr-2 block text-sm text-gray-900">
              عرض كمشروع مميز
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {editingProject ? 'حفظ التغييرات' : 'إضافة للمعرض'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};