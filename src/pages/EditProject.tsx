import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStudents } from '../hooks/useStudents';
import { useProjects } from '../hooks/useProjects';
import { getProjectById, getProjectStudents } from '../lib/firebase';
import { 
  ArrowRight, 
  Save, 
  Plus, 
  X,
  Calendar,
  Users,
  Target,
  BookOpen,
  Lightbulb,
  Upload,
  FileText,
  Search,
  UserPlus,
  Mail,
  User,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const EditProject: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const { students } = useStudents();
  const { updateProject } = useProjects();
  const [currentStep, setCurrentStep] = useState(1);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectStudents, setProjectStudents] = useState<any[]>([]);
  
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';
  const isSchool = user?.role === 'school';
  const isAdmin = user?.role === 'admin';
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    difficulty: '',
    duration: '',
    objectives: [''],
    materials: [''],
    steps: [''],
    due_date: '',
    maxStudents: 5,
    status: 'draft',
    selectedStudentIds: [] as string[]
  });

  // Load project data when component mounts
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!id) {
        setError('Project ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch project details
        const projectData = await getProjectById(id);
        if (!projectData) {
          setError('المشروع غير موجود');
          setLoading(false);
          return;
        }

        // Fetch project students
        const studentsData = await getProjectStudents(id);
        setProjectStudents(studentsData);

        // Extract student IDs
        const studentIds = studentsData.map(s => s.student_id);
        setSelectedStudentIds(studentIds);

        // Format due_date for date input (YYYY-MM-DD)
        let formattedDueDate = '';
        if (projectData.due_date) {
          const dueDate = new Date(projectData.due_date);
          formattedDueDate = dueDate.toISOString().split('T')[0];
        }

        // Set form data
        setFormData({
          title: projectData.title || '',
          description: projectData.description || '',
          category: projectData.category || '',
          subject: projectData.subject || '',
          difficulty: projectData.difficulty || '',
          duration: projectData.duration || '',
          objectives: projectData.objectives?.length ? projectData.objectives : [''],
          materials: projectData.materials?.length ? projectData.materials : [''],
          steps: projectData.steps?.length ? projectData.steps : [''],
          due_date: formattedDueDate,
          maxStudents: projectData.max_students || 5,
          status: projectData.status || 'draft',
          selectedStudentIds: studentIds
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ في تحميل بيانات المشروع');
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  // Filter students by school when component mounts or user changes
  useEffect(() => {
    if (user && user.school_id && students.length > 0) {
      const filteredStudents = students.filter(student => student.school_id === user.school_id);
      setAvailableStudents(filteredStudents);
    }
  }, [user, students]);

  // Update formData when selectedStudentIds changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      selectedStudentIds
    }));
  }, [selectedStudentIds]);

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

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        // Check if we've reached the maximum number of students
        if (prev.length >= formData.maxStudents) {
          alert(`لا يمكن إضافة أكثر من ${formData.maxStudents} طلاب لهذا المشروع`);
          return prev;
        }
        return [...prev, studentId];
      }
    });
  };

  const handleSubmit = async () => {
    if (!id) {
      setError('Project ID is missing');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Filter out empty array items
      const cleanedData = {
        ...formData,
        objectives: formData.objectives?.filter(obj => obj.trim()) || [],
        materials: formData.materials?.filter(mat => mat.trim()) || [],
        steps: formData.steps?.filter(step => step.trim()) || [],
        max_students: formData.maxStudents,
        selectedStudentIds
      };

      await updateProject(id, cleanedData);
      navigate('/projects');
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ في تحديث المشروع');
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    { number: 1, title: t('createProject.steps.basicInfo'), icon: FileText },
    { number: 2, title: t('createProject.steps.detailsObjectives'), icon: Target },
    { number: 3, title: t('createProject.steps.materialsSteps'), icon: BookOpen },
    { number: 4, title: t('createProject.steps.finalSettings'), icon: Calendar },
    { number: 5, title: t('createProject.steps.addStudents'), icon: Users },
  ];

  const categories = [
    { id: 'stem', name: t('projects.categories.stem'), description: t('createProject.categories.stemDesc') },
    { id: 'entrepreneurship', name: t('projects.categories.entrepreneurship'), description: t('createProject.categories.entrepreneurshipDesc') },
    { id: 'volunteer', name: t('projects.categories.volunteer'), description: t('createProject.categories.volunteerDesc') },
    { id: 'ethics', name: t('projects.categories.ethics'), description: t('createProject.categories.ethicsDesc') },
  ];

  const difficulties = [
    { id: 'beginner', name: t('projectIdeas.difficulties.beginner'), description: t('createProject.difficulties.beginnerDesc') },
    { id: 'intermediate', name: t('projectIdeas.difficulties.intermediate'), description: t('createProject.difficulties.intermediateDesc') },
    { id: 'advanced', name: t('projectIdeas.difficulties.advanced'), description: t('createProject.difficulties.advancedDesc') },
  ];

  // Filter students based on search term
  const filteredStudents = availableStudents.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.grade && student.grade.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
          <p className="text-gray-600">{error}</p>
          <Link to="/projects" className="mt-4 inline-block px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
            العودة إلى المشاريع
          </Link>
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
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/projects"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('editProject.title')}</h1>
            <p className="text-gray-600">{t('editProject.subtitle')}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center gap-3 ${index < steps.length - 1 ? 'flex-1' : ''}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStep >= step.number 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="hidden md:block">
                  <p className={`font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden md:block flex-1 h-1 mx-4 ${
                  currentStep > step.number ? 'bg-blue-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Form Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('createProject.steps.basicInfo')}</h2>
              <p className="text-gray-600">{t('editProject.modifyBasicInfo')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.title')} *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('createProject.form.titlePlaceholder')}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.description')} *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('createProject.form.descriptionPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.category')} *
                </label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={formData.category === category.id}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{category.name}</p>
                        <p className="text-sm text-gray-600">{category.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.subject')} *
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('createProject.form.subjectPlaceholder')}
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('createProject.form.difficulty')} *
                  </label>
                  <div className="space-y-2">
                    {difficulties.map((difficulty) => (
                      <label key={difficulty.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="difficulty"
                          value={difficulty.id}
                          checked={formData.difficulty === difficulty.id}
                          onChange={(e) => handleInputChange('difficulty', e.target.value)}
                          className="text-blue-600"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{difficulty.name}</p>
                          <p className="text-sm text-gray-600">{difficulty.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details and Objectives */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('createProject.steps.detailsObjectives')}</h2>
              <p className="text-gray-600">{t('editProject.modifyObjectives')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.duration')} *
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('createProject.form.durationPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.maxStudents')}
                </label>
                <input
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('createProject.form.objectives')} *
              </label>
              <div className="space-y-3">
                {formData.objectives.map((objective, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleArrayChange('objectives', index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`${t('createProject.form.objective')} ${index + 1}`}
                    />
                    {formData.objectives.length > 1 && (
                      <button
                        onClick={() => removeArrayItem('objectives', index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('objectives')}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('createProject.form.addNewObjective')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Materials and Steps */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('createProject.steps.materialsSteps')}</h2>
              <p className="text-gray-600">{t('editProject.modifyMaterialsSteps')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('createProject.form.materials')}
              </label>
              <div className="space-y-3">
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => handleArrayChange('materials', index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`${t('createProject.form.material')} ${index + 1}`}
                    />
                    {formData.materials.length > 1 && (
                      <button
                        onClick={() => removeArrayItem('materials', index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('materials')}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('createProject.form.addNewMaterial')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('createProject.form.implementationSteps')}
              </label>
              <div className="space-y-3">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mt-2">
                      {index + 1}
                    </div>
                    <textarea
                      value={step}
                      onChange={(e) => handleArrayChange('steps', index, e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={`${t('createProject.form.step')} ${index + 1}`}
                      rows={2}
                    />
                    {formData.steps.length > 1 && (
                      <button
                        onClick={() => removeArrayItem('steps', index)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors mt-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('steps')}
                  className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('createProject.form.addNewStep')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Final Settings */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('createProject.steps.finalSettings')}</h2>
              <p className="text-gray-600">{t('editProject.modifyDeadlineStatus')}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.deadline')}
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('createProject.form.status')}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={user?.role === 'student' || user?.role === 'consultant'}
                >
                  <option value="draft">{t('projects.statuses.draft')}</option>
                  <option value="active">{t('projects.statuses.active')}</option>
                  <option value="completed">{t('projects.statuses.completed')}</option>
                  <option value="archived">{t('projects.statuses.archived')}</option>
                </select>
              </div>
            </div>

            {/* Project Summary */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{t('createProject.projectSummary')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('common.title')}:</span>
                  <span className="font-medium">{formData.title || t('createProject.notSpecified')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('common.category')}:</span>
                  <span className="font-medium">
                    {categories.find(c => c.id === formData.category)?.name || t('createProject.notSpecified')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('createProject.form.difficulty')}:</span>
                  <span className="font-medium">
                    {difficulties.find(d => d.id === formData.difficulty)?.name || t('createProject.notSpecified')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('createProject.form.duration')}:</span>
                  <span className="font-medium">{formData.duration || t('createProject.notSpecified')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('createProject.objectivesCount')}:</span>
                  <span className="font-medium">{formData.objectives.filter(o => o.trim()).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('createProject.materialsCount')}:</span>
                  <span className="font-medium">{formData.materials.filter(m => m.trim()).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('createProject.stepsCount')}:</span>
                  <span className="font-medium">{formData.steps.filter(s => s.trim()).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('editProject.studentsCount')}:</span>
                  <span className="font-medium">{selectedStudentIds.length} {t('editProject.outOf')} {formData.maxStudents}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Manage Students */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('editProject.manageStudents')}</h2>
              <p className="text-gray-600">{t('editProject.addRemoveStudents')}</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('createProject.searchStudentsPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Selected Students Summary */}
            {selectedStudentIds.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800 font-medium">
                    {t('createProject.selectedStudents', { count: selectedStudentIds.length, max: formData.maxStudents })}
                  </span>
                  <button
                    onClick={() => setSelectedStudentIds([])}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {t('common.clearAll')}
                  </button>
                </div>
              </div>
            )}

            {/* Students List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`flex items-center gap-4 p-4 border rounded-xl transition-all cursor-pointer hover:shadow-md ${
                      selectedStudentIds.includes(student.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleStudentToggle(student.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.id)}
                      onChange={() => handleStudentToggle(student.id)}
                      disabled={!selectedStudentIds.includes(student.id) && selectedStudentIds.length >= formData.maxStudents}
                      className="text-blue-600"
                    />
                    
                    <img
                      src={student.avatar_url || `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150`}
                      alt={student.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800">{student.name}</h3>
                        {selectedStudentIds.includes(student.id) && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {t('createProject.selected')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {student.email}
                        </div>
                        {student.grade && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {student.grade}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('createProject.noStudents')}</h3>
                  <p className="text-gray-600">
                    {searchTerm ? t('createProject.noStudentsMatch') : t('createProject.noStudentsAvailable')}
                  </p>
                </div>
              )}
            </div>

            {/* Students Info */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-800 mb-2">{t('createProject.importantInfo')}:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {t('createProject.onlySchoolStudents')}</li>
                <li>• {t('createProject.canAddUpTo', { max: formData.maxStudents })}</li>
                <li>• {t('editProject.changesWillAffect')}</li>
                <li>• {t('createProject.searchIncludesNameEmail')}</li>
              </ul>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t('common.previous')}
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <Link
              to="/projects"
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </Link>
            
            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
              >
                {t('common.next')}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {loading ? t('editProject.saving') : t('editProject.saveChanges')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Import missing component
import { GraduationCap } from 'lucide-react';